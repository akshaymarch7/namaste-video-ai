import 'server-only';
import {createHash} from 'node:crypto';
export const publicationTombstone=(owner:string,video:string,account:string)=>createHash('sha256').update(JSON.stringify(['instagram-publication',owner,video,account])).digest('hex');
