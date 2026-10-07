import 'server-only';
import {randomUUID} from 'node:crypto';
import {MongoServerError,type Db,type Document} from 'mongodb';
import {ProjectError} from '../projects/contracts';
import {selectableVoices} from '../drafts/contracts';
import {defaultPreferences,patchPreferences,preferenceView,validTimezone} from './contracts';
type Row=Document&{_id:string};
export function preferenceService(db:Db){
 const rows=db.collection<Row>('preferences');
 const view=(r:Row|null)=>r?preferenceView.parse({revision:r.revision,timezone:r.timezone,defaultVoicePreset:r.defaultVoicePreset}):{...defaultPreferences};
 return {
  async get(ownerId:string){return view(await rows.findOne({ownerId}));},
  async save(ownerId:string,raw:unknown){
   const input=patchPreferences.parse(raw);
   if(input.timezone!==undefined&&!validTimezone(input.timezone))throw new ProjectError(422,'INVALID_TIMEZONE','Choose a valid IANA timezone.');
   if(input.defaultVoicePreset!==undefined&&!selectableVoices.includes(input.defaultVoicePreset as typeof selectableVoices[number]))throw new ProjectError(422,'VOICE_UNAVAILABLE','Choose an available voice.');
   const date=new Date(),changes={...(input.timezone!==undefined?{timezone:input.timezone}:{}),...(input.defaultVoicePreset!==undefined?{defaultVoicePreset:input.defaultVoicePreset}:{})};
   if(input.expectedRevision===0){
    const row:Row={_id:`pref_${randomUUID().replaceAll('-','')}`,schemaVersion:1,ownerId,...defaultPreferences,...changes,revision:1,createdAt:date,updatedAt:date};
    try{await rows.insertOne(row);return view(row);}catch(e){if(!(e instanceof MongoServerError&&e.code===11000))throw e;}
   }else{
    const row=await rows.findOneAndUpdate({ownerId,revision:input.expectedRevision},{$set:{...changes,updatedAt:date},$inc:{revision:1}},{returnDocument:'after'});
    if(row)return view(row);
   }
   throw new ProjectError(409,'REVISION_CONFLICT','Preferences changed. Reload and review them before saving again.');
  },
 };
}
