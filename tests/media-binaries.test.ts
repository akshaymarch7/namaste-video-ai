import {test} from 'node:test';
import assert from 'node:assert/strict';
import {access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {compositorPackage,mediaProbePath} from '../src/pipeline/media-binaries';
test('Linux rendering resolves GNU binaries for both supported CPU architectures',()=>{assert.equal(compositorPackage('linux','x64'),'@remotion/compositor-linux-x64-gnu');assert.equal(compositorPackage('linux','arm64'),'@remotion/compositor-linux-arm64-gnu');assert.equal(compositorPackage('darwin','arm64'),'@remotion/compositor-darwin-arm64');assert.throws(()=>compositorPackage('linux','unknown'),/UNSUPPORTED/);});
test('installed probe resolves independently of caller cwd and executes',async()=>{const probe=mediaProbePath();await access(probe);assert.ok(path.isAbsolute(probe));const output=execFileSync(probe,['-version'],{cwd:path.dirname(probe),encoding:'utf8'});assert.match(output,/ffprobe version/);});
