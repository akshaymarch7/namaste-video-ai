import 'server-only';
import {after} from 'next/server';
import {getDatabase} from '../db/client';
import {cloudConfig, cloudEnabled} from './config';
import {googleCloudProvider} from './provider';
import {dispatchCloud} from './dispatch';

export async function cloudTick(){
  const config=cloudConfig();
  const {db,client}=await getDatabase();
  return dispatchCloud(db,client,config,googleCloudProvider(config));
}
// after is a latency optimization. The persistent queues and independent
// scheduler are required: request lifetime/background callbacks are not durable.
export async function withCloudDispatch(response:Promise<Response>){
  const result=await response;
  if(result.status===202&&cloudEnabled())after(async()=>{
    try{const counts=await cloudTick();console.info('cloud_dispatch',counts);}
    catch{console.warn('cloud_dispatch_unavailable');}
  });
  return result;
}
