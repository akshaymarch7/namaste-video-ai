import {randomUUID} from 'node:crypto';
import {Long} from 'mongodb';
import {createDatabaseConnection,inTransaction} from '../src/db/client';
import {readDatabaseConfig} from '../src/db/config';
import {setupPilot} from '../src/pilot/setup';
const action=process.argv[2]??'status';
if(!['status','setup','start','close'].includes(action))throw Error('Use status, setup, start or close');
const connection=createDatabaseConnection(readDatabaseConfig());
try{
 const {db,client}=await connection.get();
 if(action==='setup'||action==='start')await setupPilot(db);
 if(action==='start'){
  await inTransaction(client,async session=>{
   const old=await db.collection('pilotWindows').findOne({_id:'active' as never},{session}),now=new Date();
   if(old&&old.endsAt>now)throw Error('An active window already exists');
   if(await db.collection('cloudDispatches').countDocuments({state:{$in:['submitting','submitted','unknown']}},{session}))throw Error('Resolve existing dispatches first');
   const value={windowId:randomUUID().replaceAll('-',''),startsAt:now,endsAt:new Date(now.getTime()+48*3600000),reservedCents:0,revision:Long.ZERO};
   await db.collection('pilotWindows').replaceOne({_id:'active' as never},{_id:'active' as never,...value},{session,upsert:true});
  });
 }
 if(action==='close')await db.collection('pilotWindows').updateOne({_id:'active' as never,endsAt:{$gt:new Date()}},{$set:{endsAt:new Date()},$inc:{revision:Long.ONE}});
 const window=await db.collection('pilotWindows').findOne({_id:'active' as never});
 const counts=window?await db.collection('pilotReservations').aggregate([{$match:{windowId:window.windowId}},{$group:{_id:'$kind',count:{$sum:1},reservedCents:{$sum:'$cents'}}}]).toArray():[];
 const pendingDispatches=await db.collection('cloudDispatches').countDocuments({state:{$in:['submitting','submitted','unknown']}});
 console.log(JSON.stringify({status:'ok',pendingDispatches,window:window?{startsAt:window.startsAt,endsAt:window.endsAt,reservedCents:window.reservedCents,stopCents:400}:null,counts}));
}catch{console.error('PILOT_OPERATOR_FAILED');process.exitCode=1;}finally{await connection.close();}
