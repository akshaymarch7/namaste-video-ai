import {createDatabaseConnection} from '../src/db/client';
import {readDatabaseConfig} from '../src/db/config';
import {jobId} from '../src/jobs/contracts';
// One execution addresses exactly one persisted request. No queue polling or
// provider retry loop here; existing journals/fences own execution semantics.
let connection:ReturnType<typeof createDatabaseConnection>|undefined;
try{
 const role=process.argv[2],id=jobId.parse(process.argv[3]);
 if(!['storyboard','generation'].includes(role)||process.argv.length!==4)throw Error('INVALID_JOB_INVOCATION');
 connection=createDatabaseConnection(readDatabaseConfig());
 const {db,client}=await connection.get();
 if(role==='storyboard'){
  const [{runStoryboardJob},{defaultProvider},{assertStoryboardQueueReady},{assertStoryboardRevisionsReady}]=await Promise.all([
   import('../src/storyboards/worker'),import('../src/storyboards/http'),import('../src/storyboards/queue-setup'),import('../src/storyboards/revision-setup')]);
  await assertStoryboardQueueReady(db);await assertStoryboardRevisionsReady(db);
  await runStoryboardJob(db,client,model=>defaultProvider(model),undefined,id);
 }else{
  const [{runGenerationJob},{localExecutionAdapters}]=await Promise.all([import('../src/jobs/service'),import('../src/jobs/local-render')]);
  await runGenerationJob(db,client,id,undefined,undefined,await localExecutionAdapters());
 }
 console.log('Bounded worker execution finished. Persisted job state is authoritative.');
}catch{console.error('Bounded worker execution failed; inspect persisted state before retrying.');process.exitCode=1;}
finally{await connection?.close();}
