import 'server-only';
import {after} from 'next/server';
import {dependencies} from '../auth/runtime';
import {readInstagramConfig} from '../instagram/config';
import {deliveryConfig} from '../storage/config';
import {publishingEnabled} from './service';
import {publishWorker} from './worker';
import {publishProvider} from './provider';
export async function publishingTick(ownerId?:string){
 if(!publishingEnabled())return {worked:false};const config=readInstagramConfig();if(!config)throw Error('PUBLISH_NOT_CONFIGURED');
 const {db,client}=await dependencies();return publishWorker(db,client,config,publishProvider(config),deliveryConfig().origin).tick(ownerId);
}
export function kickPublishing(ownerId:string){after(async()=>{try{await publishingTick(ownerId);}catch{/* Durable state is retried by the authenticated scheduler; do not log secrets. */}});}
