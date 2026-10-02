import {setTimeout as delay} from 'node:timers/promises';
import {createDatabaseConnection} from '../src/db/client';
import {readDatabaseConfig} from '../src/db/config';
import {assertStoryboardQueueReady} from '../src/storyboards/queue-setup';
import {runStoryboardJob} from '../src/storyboards/worker';
import {geminiConfig} from '../src/ideas/providers';
import {planStoryboard} from '../src/storyboards/planner';
let stop=false;
process.on('SIGTERM',()=>{stop=true;});process.on('SIGINT',()=>{stop=true;});
const connection=createDatabaseConnection(readDatabaseConfig());
try{
 const {db,client}=await connection.get();await assertStoryboardQueueReady(db);
 console.log('Storyboard worker ready. Four-call maximum; three-minute job deadline.');
 while(!stop){
  try{const worked=await runStoryboardJob(db,client,model=>({model,run:(input,context)=>planStoryboard(input,{...geminiConfig(),model},fetch,event=>console.info(JSON.stringify({event:'storyboard_provider_result',requestId:context.requestId,model,...event})),{deadline:context.deadline,progress:context.progress})}));if(!worked)await delay(750);}
  catch{console.error('Storyboard worker iteration failed; pending receipts remain recoverable.');await delay(1000);}
 }
}finally{await connection.close();}
