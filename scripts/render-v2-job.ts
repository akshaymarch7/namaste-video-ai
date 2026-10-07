// Private local-worker bridge. Not a web endpoint or a user-supplied code runner.
import fs from 'node:fs/promises';
import {renderPlanV2} from '../src/plan-v2/render';
try{await renderPlanV2(JSON.parse(await fs.readFile(process.argv[2],'utf8')));}
catch{console.error('Render validation or execution failed.');process.exitCode=1;}
