import path from 'node:path';
import fs from 'node:fs/promises';
import {parseArgs} from 'node:util';
import {renderFixture,fixtureSpeech} from '../src/plan-v2/fixture';
import {renderPlanV2} from '../src/plan-v2/render';
const {values}=parseArgs({options:{run:{type:'string'},'stills-only':{type:'boolean'}}});
if(!values.run||!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,70}$/.test(values.run))throw Error('Supply --run with a new alphanumeric run ID.');
await fs.mkdir(path.resolve('runs'),{recursive:true});
try{
  const result=await renderPlanV2({plan:renderFixture,notes:'',speech:fixtureSpeech(),fixture:true,outputDirectory:path.resolve('runs',`v2-${values.run}`),stillsOnly:values['stills-only']});
  console.log(`Silent PlanV2 fixture ready: ${result.directory}. No provider calls or dashboard job changes.`);
}catch{console.error('PlanV2 render failed. Existing output directories are never overwritten; use a new run ID.');process.exitCode=1;}
