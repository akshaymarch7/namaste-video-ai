import {test} from 'node:test';
import assert from 'node:assert/strict';
import {notifySessionChanged,subscribeSessionChanges} from '../components/session-events';
test('cross-tab signals deduplicate transports, reject malformed events and clean up',t=>{
 const listeners=new Set<(event:any)=>void>();const channels:FakeChannel[]=[];const stored:string[]=[];
 class FakeChannel{onmessage:((e:any)=>void)|null=null;closed=false;constructor(){channels.push(this);}postMessage(data:unknown){for(const c of channels)if(c!==this&&!c.closed)c.onmessage?.({data});}close(){this.closed=true;}}
 const original=globalThis.BroadcastChannel;globalThis.BroadcastChannel=FakeChannel as any;t.after(()=>{globalThis.BroadcastChannel=original;});
 Object.defineProperty(globalThis,'window',{configurable:true,value:{addEventListener:(_:string,fn:any)=>listeners.add(fn),removeEventListener:(_:string,fn:any)=>listeners.delete(fn)}});
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{setItem:(_:string,value:string)=>stored.push(value)}});
 t.after(()=>{Reflect.deleteProperty(globalThis,'window');Reflect.deleteProperty(globalThis,'localStorage');});
 let calls=0;const stop=subscribeSessionChanges(()=>calls++);notifySessionChanged();assert.equal(calls,1);
 const emit=(newValue:string)=>{for(const fn of listeners)fn({key:'namaste:session-change',newValue});};
 emit(stored[0]);emit('broken');emit(JSON.stringify({type:'different',id:'a'}));assert.equal(calls,1);
 emit(JSON.stringify({type:'session-changed',id:'different'}));assert.equal(calls,2);
 stop();assert.equal(listeners.size,0);assert.equal(channels[0].closed,true);
});
test('unavailable notification transports never prevent successful auth navigation',t=>{
 const original=globalThis.BroadcastChannel;globalThis.BroadcastChannel=class{constructor(){throw Error('blocked');}} as any;t.after(()=>{globalThis.BroadcastChannel=original;});
 Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw Error('blocked');}});
 t.after(()=>Reflect.deleteProperty(globalThis,'localStorage'));
 assert.doesNotThrow(()=>notifySessionChanged());
});
