if(process.env.CLOUD_RUN_ENABLED==='1')throw Error('Continuous local workers are disabled in Cloud Run mode.');
import {setTimeout as delay} from 'node:timers/promises';
import {createDatabaseConnection} from '../src/db/client';
import {readDatabaseConfig} from '../src/db/config';
import {assertStoryboardQueueReady} from '../src/storyboards/queue-setup';
import {runStoryboardJob} from '../src/storyboards/worker';
import {defaultProvider} from '../src/storyboards/http';
import {assertStoryboardRevisionsReady} from '../src/storyboards/revision-setup';
let stop=false;
process.on('SIGTERM',()=>{stop=true;});process.on('SIGINT',()=>{stop=true;});
const connection=createDatabaseConnection(readDatabaseConfig());
try{
 const {db,client}=await connection.get();await assertStoryboardQueueReady(db);await assertStoryboardRevisionsReady(db);
 console.log('Storyboard worker ready. Four-call maximum; three-minute job deadline.');
 while(!stop){
  try{const worked=await runStoryboardJob(db,client,model=>defaultProvider(model));if(!worked)await delay(750);}
  catch{console.error('Storyboard worker iteration failed; pending receipts remain recoverable.');await delay(1000);}
 }
}finally{await connection.close();}
