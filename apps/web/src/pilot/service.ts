import 'server-only';
import {Long,type Db,type ClientSession,type Document} from 'mongodb';
import {ProjectError} from '../projects/contracts';
type Row=Document&{_id:string};
export type PilotKind='storyboard'|'generation'|'idea'|'publish_now'|'publish_schedule';
// Conservative planning allowances, not a provider invoice or dollar guarantee.
export const pilotCents={storyboard:10,generation:40,idea:2,publish_now:0,publish_schedule:0} as const;
export const pilotBudgetCents=400;
const fail=(code:string,message:string)=>new ProjectError(409,code,message);
export async function pilotWindow(db:Db,session?:ClientSession){const w=await db.collection<Row>('pilotWindows').findOne({_id:'active'},{session});if(!w&&process.env.PILOT_WINDOW_REQUIRED==='1')throw fail('PILOT_WINDOW_CLOSED','The testing window has not been configured. Your work is saved.');return w;}
function checkTime(w:Row,date:Date){
 if(!(w.startsAt instanceof Date)||!(w.endsAt instanceof Date)||w.endsAt<=w.startsAt||w.endsAt.getTime()-w.startsAt.getTime()>48*3600000)throw fail('PILOT_WINDOW_CLOSED','The testing window is unavailable. Your saved work remains accessible.');
 if(date<w.startsAt||date>=w.endsAt)throw fail('PILOT_WINDOW_CLOSED','The testing window is closed. Your saved work remains accessible.');
}
export async function checkPilot(db:Db,session?:ClientSession,date=new Date()){
 const w=await pilotWindow(db,session);if(!w)return;checkTime(w,date);
 if(w.reservedCents>=pilotBudgetCents)throw fail('PILOT_BUDGET_LIMIT','The pilot usage allowance is reserved. Existing requests can finish; contact the administrator before generating more.');
}
// Called inside the caller's transaction. One singleton write serializes limits
// across creators and replicas; uncertain/failed work never refunds an allowance.
export async function reservePilot(db:Db,session:ClientSession,kind:PilotKind,operationId:string,date=new Date()){
 const w=await pilotWindow(db,session);if(!w)return;
 checkTime(w,date);
 const rows=db.collection<Row>('pilotReservations'),id=`${w.windowId}:${kind}:${operationId}`;
 if(await rows.findOne({_id:id},{session}))return;
 await db.collection<Row>('pilotWindows').updateOne({_id:'active',windowId:w.windowId},{$inc:{revision:Long.ONE}},{session});
 const cents=pilotCents[kind];
 if(w.reservedCents+cents>pilotBudgetCents)throw fail('PILOT_BUDGET_LIMIT','The pilot usage allowance is reserved. Contact the administrator before generating more.');
 const limit=kind==='generation'?8:kind.startsWith('publish_')?1:Infinity;
 if(await rows.countDocuments({windowId:w.windowId,kind},{session})>=limit)throw fail('PILOT_WINDOW_LIMIT','This testing window has reached its limit for this action. Your work is saved.');
 await rows.insertOne({_id:id,windowId:w.windowId,kind,operationId,cents,createdAt:date},{session});
 await db.collection<Row>('pilotWindows').updateOne({_id:'active',windowId:w.windowId},{$inc:{reservedCents:cents}},{session});
}
export async function checkPilotPublication(db:Db,session:ClientSession,row:{_id:string;mode?:string;usernameAtApproval?:string},date=new Date()){
 const w=await pilotWindow(db,session);if(!w)return;checkTime(w,date);
 if(row.usernameAtApproval?.toLowerCase()!=='namastevideoai')throw fail('PILOT_DESTINATION_LIMIT','This pilot permits posting only to @namastevideoai.');
 const kind=row.mode==='schedule'?'publish_schedule':'publish_now';
 if(!await db.collection('pilotReservations').findOne({windowId:w.windowId,kind,operationId:row._id},{session}))throw fail('PILOT_WINDOW_LIMIT','This publication was not approved within the current testing window.');
}
