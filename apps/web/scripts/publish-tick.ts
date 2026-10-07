import {publishingTick} from '../src/publishing/runtime';
try{console.log(JSON.stringify(await publishingTick()));}catch{console.error(JSON.stringify({error:'PUBLISH_TICK_UNAVAILABLE'}));process.exitCode=1;}
