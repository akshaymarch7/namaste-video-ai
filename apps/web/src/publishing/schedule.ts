import {z} from 'zod';
import {ProjectError} from '../projects/contracts';
import {validTimezone} from '../preferences/contracts';
export const scheduleInput=z.object({localTime:z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),timezone:z.string().max(100).refine(validTimezone,'Choose an IANA timezone.'),utcOffset:z.string().regex(/^[+-]\d{2}:\d{2}$/)}).strict();
export type ScheduleInput=z.infer<typeof scheduleInput>;
const error=(code:string,message:string)=>new ProjectError(422,code,message);
export function scheduleChoices(localTime:string,timezone:string):{utcOffset:string;utc:string}[]{
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(localTime)||!validTimezone(timezone))return [];
 const naive=Date.parse(localTime+'Z');if(!Number.isFinite(naive)||new Date(naive).toISOString().slice(0,16)!==localTime)return [];
 const format=new Intl.DateTimeFormat('en-GB',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 const local=(ms:number)=>{const p=Object.fromEntries(format.formatToParts(ms).map(x=>[x.type,x.value]));return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;};
 // Observe offsets on either side of the candidate day, including half-hour DST transitions.
 const offsets=new Set<number>();for(let h=-36;h<=36;h++)offsets.add(Math.round((Date.parse(local(naive+h*3600000)+'Z')-(naive+h*3600000))/60000));
 return [...offsets].filter(n=>Math.abs(n)<=840&&local(naive-n*60000)===localTime).map(n=>({utcOffset:`${n<0?'-':'+'}${String(Math.floor(Math.abs(n)/60)).padStart(2,'0')}:${String(Math.abs(n)%60).padStart(2,'0')}`,utc:new Date(naive-n*60000).toISOString()})).sort((a,b)=>a.utc.localeCompare(b.utc));
}
export function resolveSchedule(raw:ScheduleInput,now:Date){
 const s=scheduleInput.parse(raw),choices=scheduleChoices(s.localTime,s.timezone);
 if(!choices.length)throw error('INVALID_LOCAL_TIME','This local time does not exist. Choose a valid date and time.');
 const selected=choices.find(c=>c.utcOffset===s.utcOffset);
 if(!selected)throw error(choices.length>1?'AMBIGUOUS_LOCAL_TIME':'INVALID_UTC_OFFSET',`Choose a valid UTC offset: ${choices.map(c=>c.utcOffset).join(', ')}.`);
 const utc=new Date(selected.utc);if(utc.getTime()<now.getTime()+300000)throw error('INVALID_SCHEDULE','Choose a time at least five minutes from now.');
 return {...s,utc};
}
export const scheduleWindowMs=15*60000;
