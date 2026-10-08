// Explicitly authored public demonstrations. No environment files, user data or provider calls.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderMedia,renderStill} from '@remotion/renderer';
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'namaste-public-demos-'));
try{const empty=path.join(temp,'empty');await fs.mkdir(empty);const url=await bundle({entryPoint:path.resolve('src/homepage-demo/index.tsx'),publicDir:empty,outDir:path.join(temp,'bundle'),enableCaching:false});
const captions={search:['Start with sorted values.','Check the middle value.','Discard the smaller half.','14 found. Keep halving.'],memory:['Both hold data. Their jobs differ.','RAM holds your current work.','Storage keeps saved files.','A desk for work. A shelf for keeps.'],water:['The Sun warms surface water.','Water evaporates into the air.','Cooling vapour forms clouds.','Rain returns water to the ground.']};
for(const id of ['search','memory','water'] as const){const composition=await selectComposition({serveUrl:url,id});const output=path.resolve('apps/web/public/examples',id);await renderMedia({serveUrl:url,composition,codec:'h264',pixelFormat:'yuv420p',outputLocation:output+'.mp4',concurrency:2,crf:24});await renderStill({serveUrl:url,composition,frame:240,output:output+'.png'});await fs.writeFile(output+'.vtt','WEBVTT\n\n'+captions[id].map((text,i)=>`00:00:${String(i*3).padStart(2,'0')}.000 --> 00:00:${String((i+1)*3).padStart(2,'0')}.000\n${text}\n`).join('\n'));console.log(`Public ${id} demo rendered.`);}
}finally{await fs.rm(temp,{recursive:true,force:true});}
