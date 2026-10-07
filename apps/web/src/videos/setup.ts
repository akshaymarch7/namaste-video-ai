import 'server-only';
import {createHash} from 'node:crypto';
import type {Db} from 'mongodb';
import {runMigration} from '../db/setup';
import {DatabaseError} from '../db/config';
import type {CollectionDefinition} from '../db/schema';
const text={bsonType:'string',minLength:1,maxLength:256},hash={bsonType:'string',pattern:'^[a-f0-9]{64}$'},date={bsonType:'date'};
const def=(name:string,properties:Record<string,unknown>,indexes:CollectionDefinition['indexes']):CollectionDefinition=>({name,validator:{$jsonSchema:{bsonType:'object',additionalProperties:false,required:Object.keys(properties),properties}},indexes});
export const videoDefinitions=[
 def('videos',{_id:{bsonType:'string',pattern:'^vid_[a-f0-9]{32}$'},ownerId:text,projectId:text,jobId:text,storyboardId:text,storyApprovalId:text,title:text,renderSpec:{bsonType:'object'},renderSpecHash:hash,outputHash:hash,outputAssetId:text,captionsAssetId:text,duration:{bsonType:['double','int'],minimum:60,maximum:90},createdAt:date},[{name:'video_job',key:{jobId:1},unique:true},{name:'video_project',key:{ownerId:1,projectId:1,createdAt:-1,_id:-1}}]),
 def('videoApprovals',{_id:{bsonType:'string',pattern:'^apr_[a-f0-9]{32}$'},ownerId:text,projectId:text,kind:{enum:['video']},subjectId:text,subjectHash:hash,outputHash:hash,renderSpecHash:hash,approvedBy:text,approvedAt:date},[{name:'video_approval_subject',key:{ownerId:1,projectId:1,subjectId:1},unique:true}]),
 def('videoCommands',{_id:text,ownerId:text,projectId:text,videoId:text,action:{enum:['approve','select']},keyHash:hash,requestHash:hash,response:{bsonType:'object'},createdAt:date},[{name:'video_command_key',key:{ownerId:1,videoId:1,action:1,keyHash:1},unique:true}]),
];
const id='mig_videoreview00001',checksum=createHash('sha256').update(JSON.stringify(videoDefinitions)).digest('hex');
export async function setupVideos(db:Db){return runMigration(db,'014-video-review',id,checksum,videoDefinitions);}
export async function assertVideosReady(db:Db){if(!await db.collection('schemaMigrations').findOne({_id:id as never,checksum,state:'completed'}))throw new DatabaseError('VIDEO_SETUP_REQUIRED','Run db:setup before reviewing videos.');}
