import {z} from 'zod';
import {draftDefinition} from './schema';
import {editableStoryboardSchema} from '../storyboards/editable-contract';
import type {CollectionDefinition} from '../db/schema';
// Local JSON-schema conversion keeps this definition independent of migration modules.
function bson(value:any):any{if(Array.isArray(value))return value.map(bson);if(!value||typeof value!=='object')return value;return Object.fromEntries(Object.entries(value).filter(([k])=>k!=='$schema').map(([k,v])=>k==='type'?['bsonType',v==='integer'?'int':v==='number'?['double','int']:v]:k==='const'?['enum',[v]]:[k,bson(v)]));}
export const editableDraftDefinition=structuredClone(draftDefinition);
const props=editableDraftDefinition.validator.$jsonSchema.properties;
props.editablePlan={anyOf:[{bsonType:'null'},bson(z.toJSONSchema(editableStoryboardSchema))]};
props.planStale={bsonType:'bool'};
props.sourceStoryboardId={bsonType:['string','null'],pattern:'^stb_[a-f0-9]{32}$'};
// New provenance is optional for existing idea-only rows; application always writes it.
const str={bsonType:'string',minLength:1,maxLength:256};
const fields={_id:{bsonType:'string',pattern:'^cmd_[a-f0-9]{32}$'},ownerId:str,projectId:str,keyHash:{bsonType:'string',pattern:'^[a-f0-9]{64}$'},requestHash:{bsonType:'string',pattern:'^[a-f0-9]{64}$'},response:{bsonType:'object'},createdAt:{bsonType:'date'}};
export const draftCommandDefinition:CollectionDefinition={name:'draftCommands',validator:{$jsonSchema:{bsonType:'object',additionalProperties:false,required:Object.keys(fields),properties:fields}},indexes:[{name:'draft_apply_key',key:{ownerId:1,projectId:1,keyHash:1},unique:true}]};
