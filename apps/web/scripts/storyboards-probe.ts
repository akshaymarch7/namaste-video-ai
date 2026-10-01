import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {planStoryboard,StoryboardPlanningError} from '../src/storyboards/planner';
import {geminiConfig,ProviderError} from '../src/ideas/providers';
try {
  const topic=process.argv.slice(2).join(' ').trim()||'Explain the water cycle to school students';
  const result=await planStoryboard({topic,audience:'Beginners',notes:'',voicePreset:'daniel-test'},geminiConfig(),fetch,event=>console.log(JSON.stringify({event:'storyboard_probe',...event})));
  // Local inspection artifact only; not a database version or a rendering approval.
  const directory=resolve('runs/storyboards');await mkdir(directory,{recursive:true});
  const path=resolve(directory,`${randomUUID()}.json`);
  await writeFile(path,JSON.stringify(result,null,2)+'\n',{mode:0o600,flag:'wx'});
  console.log(JSON.stringify({ok:true,path,scenes:result.content.scenes.length,estimatedDurationSeconds:result.estimatedDurationSeconds,attempts:result.attempts}));
} catch(error) {console.error(JSON.stringify({ok:false,code:error instanceof ProviderError?error.code:'STORYBOARD_PROBE_FAILED',...(error instanceof StoryboardPlanningError?{issues:error.issues}:{})}));process.exitCode=1;}
