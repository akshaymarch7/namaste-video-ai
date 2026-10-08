import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {probe,probePath} from '../src/pipeline/media';
const exec=promisify(execFile),directory=path.dirname(probePath());
for(const id of ['search','memory','water']){
 const file=path.resolve('apps/web/public/examples',id+'.mp4'),metadata=await probe(file),video=metadata.streams.find(s=>s.codec_type==='video');
 assert.equal(metadata.streams.length,1);assert.equal(video?.codec_name,'h264');assert.equal(video.width,360);assert.equal(video.height,640);assert.equal(video.avg_frame_rate,'24/1');assert.equal(Number(metadata.format.duration),12);assert.ok((await fs.stat(file)).size<300000);
 await exec(path.join(directory,'ffmpeg'),['-v','error','-xerror','-i',file,'-map','0:v:0','-c:v','rawvideo','-f','null','-'],{env:{...process.env,DYLD_LIBRARY_PATH:directory},timeout:30000});
 const vtt=await fs.readFile(file.replace('.mp4','.vtt'),'utf8');assert.ok(vtt.startsWith('WEBVTT'));assert.equal(vtt.match(/-->/g)?.length,4);assert.ok(vtt.includes('00:00:12.000'));assert.ok((await fs.stat(file.replace('.mp4','.png'))).size>1000);
 console.log(`${id}: full decode, 12s H.264 360×640/24fps, silent, four text cues, poster, <300KB passed.`);
}
