import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {openBrowser} from '@remotion/renderer';
import {mediaProbePath} from '../../src/pipeline/media-binaries';
const probe=mediaProbePath();
execFileSync(probe,['-version'],{cwd:path.dirname(probe),stdio:'ignore',timeout:15000});
const browser=await openBrowser('chrome');
await browser.close({silent:true});
console.log('Worker image preflight passed: audio probe and Chromium startup.');
