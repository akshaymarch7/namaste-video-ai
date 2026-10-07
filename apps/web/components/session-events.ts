const channelName='namaste:session-events';
const storageKey='namaste:session-change';
type Signal={type:'session-changed';id:string};
function valid(value:unknown):value is Signal{return !!value&&typeof value==='object'&&'type'in value&&value.type==='session-changed'&&'id'in value&&typeof value.id==='string'&&value.id.length>0&&value.id.length<100;}

// Contains no identity, token or credential. Signals only invalidate; the server confirms identity.
export function notifySessionChanged(){
 let id:string;
 try{id=crypto.randomUUID();}catch{id=`${Date.now()}-${Math.random()}`;}
 const signal:Signal={type:'session-changed',id};
 try{const channel=new BroadcastChannel(channelName);channel.postMessage(signal);channel.close();}catch{/* Storage fallback below. */}
 try{localStorage.setItem(storageKey,JSON.stringify(signal));}catch{/* Periodic/focus checks remain available. */}
}
export function subscribeSessionChanges(invalidate:()=>void){
 const seen=new Set<string>();
 const receive=(value:unknown)=>{if(!valid(value)||seen.has(value.id))return;seen.add(value.id);if(seen.size>32)seen.delete(seen.values().next().value!);invalidate();};
 let channel:BroadcastChannel|undefined;
 try{channel=new BroadcastChannel(channelName);channel.onmessage=event=>receive(event.data);}catch{/* Storage fallback below. */}
 const storage=(event:StorageEvent)=>{if(event.key!==storageKey||!event.newValue)return;try{receive(JSON.parse(event.newValue));}catch{/* Ignore malformed/unrelated storage. */}};
 window.addEventListener('storage',storage);
 return()=>{channel?.close();window.removeEventListener('storage',storage);};
}
