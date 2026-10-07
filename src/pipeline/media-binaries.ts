import {createRequire} from 'node:module';
import path from 'node:path';
const require=createRequire(import.meta.url);
// Production images use Debian/glibc. Preserve the existing macOS prototype.
export function compositorPackage(platform:string,arch:string){
 if(!['x64','arm64'].includes(arch)||!['linux','darwin'].includes(platform))throw Error('UNSUPPORTED_RENDER_PLATFORM');
 return `@remotion/compositor-${platform}-${arch}${platform==='linux'?'-gnu':''}`;
}
export function mediaProbePath(){
 const directory=(require(compositorPackage(process.platform,process.arch)) as {dir:string}).dir;
 return path.join(directory,'ffprobe');
}
