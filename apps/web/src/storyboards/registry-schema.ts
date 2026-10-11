import {z} from 'zod';
import type {CollectionDefinition} from '../db/schema';
import {storyboardSchema} from './contracts';
import {editableStoryboardSchema} from './editable-contract';
function bson(value:any):any{if(Array.isArray(value))return value.map(bson);if(!value||typeof value!=='object')return value;return Object.fromEntries(Object.entries(value).filter(([k])=>k!=='$schema').map(([k,v])=>k==='type'?['bsonType',v==='integer'?'int':v==='number'?['double','int']:v]:k==='const'?['enum',[v]]:[k,bson(v)]));}
export function chartCandidateDefinition(original:CollectionDefinition){const d=structuredClone(original);d.validator.$jsonSchema.properties.content=bson(z.toJSONSchema(storyboardSchema));return d;}
export function chartDraftDefinition(original:CollectionDefinition){const d=structuredClone(original);d.validator.$jsonSchema.properties.editablePlan={anyOf:[{bsonType:'null'},bson(z.toJSONSchema(editableStoryboardSchema))]};return d;}
