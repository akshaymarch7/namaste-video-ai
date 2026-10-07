import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {workerConfig} from './config.mjs';
import {workerInvocation} from './invocation.mjs';
try{
 const invocation=workerInvocation(process.argv.slice(2));
 const {env}=workerConfig(invocation.role);
 const root=fileURLToPath(new URL('../../',import.meta.url));
 const child=spawn(process.execPath,['--conditions=react-server','--import','tsx',`apps/web/scripts/${invocation.script}`,...invocation.args],{cwd:root,env,stdio:'inherit'});
 // tini -g forwards to descendants too. Keep the parent alive until the worker exits.
 process.on('SIGTERM',()=>child.kill('SIGTERM'));
 process.on('SIGINT',()=>child.kill('SIGINT'));
 child.on('error',()=>{console.error('Worker process could not start.');process.exitCode=1;});
 child.on('exit',(code,signal)=>{process.exitCode=code??(signal?1:0);});
}catch(error){console.error(error.message);process.exitCode=1;}
