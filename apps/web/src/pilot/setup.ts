import 'server-only';
import {createHash} from 'node:crypto';
import type {Db} from 'mongodb';
import {runMigration} from '../db/setup';
import type {CollectionDefinition} from '../db/schema';
const date={bsonType:'date'},integer={bsonType:'int',minimum:0};
export const pilotDefinitions:CollectionDefinition[]=[
 {name:'pilotWindows',validator:{$jsonSchema:{bsonType:'object',additionalProperties:false,required:['_id','windowId','startsAt','endsAt','reservedCents','revision'],properties:{_id:{enum:['active']},windowId:{bsonType:'string',pattern:'^[a-f0-9]{32}$'},startsAt:date,endsAt:date,reservedCents:integer,revision:{bsonType:'long',minimum:0}}}},indexes:[]},
 {name:'pilotReservations',validator:{$jsonSchema:{bsonType:'object',additionalProperties:false,required:['_id','windowId','kind','operationId','cents','createdAt'],properties:{_id:{bsonType:'string',maxLength:256},windowId:{bsonType:'string'},kind:{enum:['storyboard','generation','idea','publish_now','publish_schedule']},operationId:{bsonType:'string',maxLength:100},cents:integer,createdAt:date}}},indexes:[{name:'pilot_window_kind',key:{windowId:1,kind:1}}]},
];
const checksum=createHash('sha256').update(JSON.stringify(pilotDefinitions)).digest('hex');
export const setupPilot=(db:Db)=>runMigration(db,'024-pilot-window','mig_pilotwindow000001',checksum,pilotDefinitions);
