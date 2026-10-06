import 'server-only';
import {Inngest} from 'inngest';
import {getDatabase} from '../db/client';
import {dispatchJobs} from './dispatch';
import {runGenerationJob} from './service';
import {jobId} from './contracts';
export const inngest=new Inngest({id:'namastevideo-development',isDev:process.env.NODE_ENV!=='production'&&process.env.INNGEST_DEV==='1'});
export const generationFunction=inngest.createFunction({id:'generation-preflight',triggers:[{event:'namaste/generation.requested'}],retries:2},async({event,step})=>{
 const id=jobId.parse(event.data.jobId);
 return step.run('validate-approved-input',async()=>{const {db,client}=await getDatabase();return {handled:await runGenerationJob(db,client,id)};});
});
export const dispatchFunction=inngest.createFunction({id:'generation-outbox',triggers:[{cron:'* * * * *'}],retries:2},async({step})=>step.run('dispatch-and-reconcile',async()=>{const {db,client}=await getDatabase();return dispatchJobs(db,client,event=>inngest.send(event));}));
