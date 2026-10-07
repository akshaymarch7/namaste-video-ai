import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderMedia,renderStill,makeCancelSignal} from '@remotion/renderer';
import {probe} from '../pipeline/media';
import {compileV2,captionsVtt,type MeasuredSpeech} from './compiler';

export type SpeechInput=MeasuredSpeech & {audioPath?:string};
// Local compute adapter. Never called from a Next.js request or the F13 worker.
// Public assets are a private temporary directory containing only validated MP3s.
export async function renderPlanV2(input:{plan:unknown;notes:string;speech:Record<string,SpeechInput>;fixture:boolean;outputDirectory:string;stillsOnly?:boolean}){
  const started=performance.now();
  const timeline=compileV2(input.plan,{notes:input.notes,voicePreset:'daniel-test'},input.speech,input.fixture);
  const dir=path.resolve(input.outputDirectory);
  // A new directory per attempt protects previous outputs, including failed attempts.
  await fs.mkdir(dir,{mode:0o700});
  const temp=await fs.mkdtemp(path.join(os.tmpdir(),'namaste-render-v2-'));
  try{
    const publicDir=path.join(temp,'media');await fs.mkdir(publicDir,{mode:0o700});
    for(const scene of timeline.scenes){
      const speech=input.speech[scene.id];
      if(input.fixture){if(speech.audioPath)throw Error('FIXTURE_AUDIO_FORBIDDEN');continue;}
      if(!speech.audioPath||!path.isAbsolute(speech.audioPath))throw Error('LOCAL_AUDIO_REQUIRED');
      const source=await fs.lstat(speech.audioPath);
      if(!source.isFile()||source.size<=0||source.size>16*1024*1024)throw Error('AUDIO_FILE_INVALID');
      const destination=path.join(publicDir,`${scene.id}.mp3`);
      await fs.copyFile(speech.audioPath,destination);await fs.chmod(destination,0o600);
      const metadata=await probe(destination);
      if(!Number.isFinite(Number(metadata.format.duration))||metadata.streams.length!==1||metadata.streams[0].codec_name!=='mp3'||metadata.streams[0].codec_type!=='audio'||Math.abs(Number(metadata.format.duration)-speech.duration)>0.05)throw Error('AUDIO_MEASUREMENT_MISMATCH');
    }
    const serveUrl=await bundle({entryPoint:fileURLToPath(new URL('./index.tsx',import.meta.url)),publicDir,outDir:path.join(temp,'bundle'),enableCaching:false});
    const browserExecutable=process.env.BROWSER_EXECUTABLE||undefined;
    const inputProps={timeline,audio:!input.fixture};
    const composition=await selectComposition({serveUrl,id:'PlanV2',inputProps,browserExecutable});
    const {cancelSignal,cancel}=makeCancelSignal();
    const timeout=setTimeout(cancel,10*60*1000);
    const interrupt=()=>cancel();process.once('SIGINT',interrupt);process.once('SIGTERM',interrupt);
    try{
      await fs.mkdir(path.join(dir,'frames'),{mode:0o700});
      for(const scene of timeline.scenes){
        const frame=scene.start+Math.min(scene.frames-1,Math.max(60,...scene.events.map(e=>e.start+e.frames)));
        await renderStill({serveUrl,composition,inputProps,browserExecutable,frame,output:path.join(dir,'frames',`${scene.id}.png`),cancelSignal});
      }
      if(!input.stillsOnly){
        const output=path.join(dir,'output.partial.mp4');
        await renderMedia({serveUrl,composition,inputProps,browserExecutable,codec:'h264',audioCodec:'aac',pixelFormat:'yuv420p',outputLocation:output,concurrency:2,crf:23,cancelSignal});
        const metadata=await probe(output),video=metadata.streams.find(s=>s.codec_type==='video');
        const duration=Number(metadata.format.duration);
        const checks={dimensions:video?.width===1080&&video.height===1920,frameRate:video?.avg_frame_rate==='30/1',codec:video?.codec_name==='h264',duration:duration>=60&&duration<=90&&Math.abs(duration-timeline.frames/30)<0.1,audio:input.fixture?!metadata.streams.some(s=>s.codec_type==='audio'):metadata.streams.some(s=>s.codec_type==='audio'&&s.codec_name==='aac'),size:(await fs.stat(output)).size<=64*1024*1024};
        const passed=Object.values(checks).every(Boolean);
        await fs.writeFile(path.join(dir,'qa.json'),JSON.stringify({passed,checks,duration,fixture:input.fixture,rendererVersion:timeline.rendererVersion,elapsedSeconds:Math.round((performance.now()-started)/100)/10,nodePeakRssKiB:process.resourceUsage().maxRSS,memoryScope:'Node process only; excludes Chromium and compositor children',humanReview:'pending'},null,2),{mode:0o600});
        if(!passed)throw Error('OUTPUT_VALIDATION_FAILED');
        await fs.rename(output,path.join(dir,'output.mp4'));
      }
      await fs.writeFile(path.join(dir,'timeline.json'),JSON.stringify(timeline,null,2),{mode:0o600});
      await fs.writeFile(path.join(dir,'captions.vtt'),captionsVtt(timeline),{mode:0o600});
      return {directory:dir,frames:timeline.frames,fixture:input.fixture,stillsOnly:!!input.stillsOnly};
    }finally{clearTimeout(timeout);process.removeListener('SIGINT',interrupt);process.removeListener('SIGTERM',interrupt);}
  }finally{await fs.rm(temp,{recursive:true,force:true});}
}
