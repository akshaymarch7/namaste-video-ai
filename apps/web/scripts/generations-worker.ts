import {createDatabaseConnection} from '../src/db/client';
import {readDatabaseConfig} from '../src/db/config';
import {dispatchJobs} from '../src/jobs/dispatch';
import {runGenerationJob} from '../src/jobs/service';
import {localExecutionAdapters} from '../src/jobs/local-render';
const connection=createDatabaseConnection(readDatabaseConfig());let stopping=false;
process.on('SIGINT',()=>{stopping=true;});process.on('SIGTERM',()=>{stopping=true;});
try{const adapters=await localExecutionAdapters();const {db,client}=await connection.get();do{await dispatchJobs(db,client,async event=>{if(stopping)throw Error('WORKER_STOPPING');await runGenerationJob(db,client,event.data.jobId,undefined,undefined,adapters);},undefined,()=>stopping);if(process.argv.includes('--once'))break;if(!stopping)await new Promise(r=>setTimeout(r,1000));}while(!stopping);}catch{console.error('Generation worker stopped. Check database setup and configuration.');process.exitCode=1;}finally{await connection.close();}
