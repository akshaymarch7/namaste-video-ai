import 'server-only';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mediaProbePath} from '../../../../src/pipeline/media-binaries';
import {r2Store} from '../storage/r2';
import {ExecutionError,type ExecutionAdapters} from './execution';
import {requestSpeech} from './speech-provider';
const exec=promisify(execFile),root=fileURLToPath(new URL('../../../../',import.meta.url));
const probe=mediaProbePath();
export async function localExecutionAdapters():Promise<ExecutionAdapters>{
 const apiKey=process.env.ELEVENLABS_API_KEY;
 if(!apiKey)throw new ExecutionError('SPEECH_NOT_CONFIGURED');
 const store=r2Store();
 // macOS compositor dylibs resolve relative to this directory. Check before TTS.
 await exec(probe,['-version'],{cwd:path.dirname(probe),timeout:15000,maxBuffer:1024*1024});
 return {store,
  async speech(text,config,signal){
   const combined=AbortSignal.any([signal,AbortSignal.timeout(120000)]);
   const payload=await requestSpeech(text,config,apiKey,combined);
   const temp=await fs.mkdtemp(path.join(os.tmpdir(),'namaste-speech-'));
   try{
    const file=path.join(temp,'audio.mp3');await fs.writeFile(file,Buffer.from(payload.audio_base64,'base64'),{mode:0o600});
    const {stdout}=await exec(probe,['-v','error','-show_streams','-show_format','-of','json',file],{cwd:path.dirname(probe),signal:combined,timeout:15000,maxBuffer:1024*1024});
    const metadata=JSON.parse(stdout),duration=Number(metadata.format.duration);
    if(metadata.streams.length!==1||metadata.streams[0].codec_name!=='mp3'||!Number.isFinite(duration)||duration<=0)throw new ExecutionError('SPEECH_TIMING_INVALID');
    return {audio:payload.audio_base64,alignment:payload.alignment,duration};
   }finally{await fs.rm(temp,{recursive:true,force:true});}
  },
  async render(plan,notes,speech,signal,captionOverrides){
   const temp=await fs.mkdtemp(path.join(os.tmpdir(),'namaste-job-render-'));
   try{
    const measured:Record<string,unknown>={};
    for(const scene of plan.scenes){const s=speech[scene.id],audioPath=path.join(temp,`${scene.id}.mp3`);await fs.writeFile(audioPath,Buffer.from(s.audio,'base64'),{mode:0o600});measured[scene.id]={alignment:s.alignment,duration:s.duration,audioPath};}
    const outputDirectory=path.join(temp,'output'),manifest=path.join(temp,'input.json');
    await fs.writeFile(manifest,JSON.stringify({plan,notes,speech:measured,fixture:false,outputDirectory,captionOverrides}),{mode:0o600});
    // Run outside react-server conditions; never pass provider or storage credentials to Chromium.
    await exec(process.execPath,['--import','tsx',path.join(root,'scripts/render-v2-job.ts'),manifest],{cwd:root,signal,timeout:12*60000,maxBuffer:1024*1024,env:{NODE_ENV:'production',PATH:process.env.PATH,HOME:process.env.HOME,TMPDIR:process.env.TMPDIR,...(process.env.BROWSER_EXECUTABLE?{BROWSER_EXECUTABLE:process.env.BROWSER_EXECUTABLE}:{})}});
    const qa=JSON.parse(await fs.readFile(path.join(outputDirectory,'qa.json'),'utf8'));
    if(!qa.passed||qa.fixture)throw new ExecutionError('RENDER_INVALID');
    return {video:await fs.readFile(path.join(outputDirectory,'output.mp4')),captions:await fs.readFile(path.join(outputDirectory,'captions.vtt')),duration:qa.duration};
   }catch(e){if(e instanceof ExecutionError)throw e;throw new ExecutionError(signal.aborted?'EXECUTION_STOPPED':'RENDER_FAILED');}
   finally{await fs.rm(temp,{recursive:true,force:true});}
  },
 };
}
