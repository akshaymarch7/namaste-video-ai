import 'server-only';
import {randomUUID} from 'node:crypto';
import {Long,type Db,type MongoClient,type Document,type ClientSession} from 'mongodb';
import {inTransaction} from '../db/client';
import {ProjectError} from '../projects/contracts';
import {videoView,approvalView,approveRequest,selectRequest,selectionView,type Video} from './contracts';
import {assertVideosReady} from './setup';
import {videoHash} from './materialize';
type Doc=Document&{_id:string};
const missing=()=>new ProjectError(404,'NOT_FOUND','Video not found.');
const uid=(p:string)=>`${p}_${randomUUID().replaceAll('-','')}`;
export function videoService(db:Db,client:MongoClient){
 const videos=db.collection<Doc>('videos'),projects=db.collection<Doc>('projects');
 async function parent(ownerId:string,projectId:string,session:ClientSession){const p=await projects.findOne({_id:projectId,ownerId,deletedAt:null},{session});if(!p)throw missing();return p;}
 async function owned(ownerId:string,id:string,session:ClientSession){const v=await videos.findOne({_id:id,ownerId},{session});if(!v)throw missing();const p=await parent(ownerId,v.projectId,session);return {v,p};}
 async function ready(v:Doc,session:ClientSession){const a=await db.collection<Doc>('assets').findOne({_id:v.outputAssetId,ownerId:v.ownerId,projectId:v.projectId,kind:'video',state:'ready',sha256:v.outputHash},{session});if(!a||videoHash(v.renderSpec)!==v.renderSpecHash)throw new ProjectError(409,'VIDEO_NOT_READY','This video is unavailable for review.');}
 const approval=(a:Doc)=>approvalView.parse({id:a._id,projectId:a.projectId,kind:a.kind,subjectId:a.subjectId,subjectHash:a.subjectHash,outputHash:a.outputHash,renderSpecHash:a.renderSpecHash,approvedAt:a.approvedAt.toISOString()});
 async function view(v:Doc,session:ClientSession):Promise<Video>{const a=await db.collection<Doc>('videoApprovals').findOne({ownerId:v.ownerId,projectId:v.projectId,subjectId:v._id},{session});return videoView.parse({id:v._id,projectId:v.projectId,storyboardId:v.storyboardId,parentVideoId:v.renderSpec.captionRevision?.parentVideoId??null,title:v.title,duration:v.duration,outputAssetId:v.outputAssetId,captionsAssetId:v.captionsAssetId,outputHash:v.outputHash,renderSpecHash:v.renderSpecHash,createdAt:v.createdAt.toISOString(),approval:a?approval(a):null});}
 return {
  async list(ownerId:string,projectId:string,limit:number,cursor?:string){await assertVideosReady(db);return inTransaction(client,async session=>{
   const p=await parent(ownerId,projectId,session);let after={};
   if(cursor){const c=await videos.findOne({_id:cursor,ownerId,projectId},{session});if(!c)throw new ProjectError(400,'INVALID_CURSOR','Refresh the version list.');after={$or:[{createdAt:{$lt:c.createdAt}},{createdAt:c.createdAt,_id:{$lt:c._id}}]};}
   const rows=await videos.find({ownerId,projectId,...after},{session}).sort({createdAt:-1,_id:-1}).limit(limit+1).toArray();const data:Video[]=[];
   for(const v of rows.slice(0,limit))data.push(await view(v,session));
   return {data,page:{hasMore:rows.length>limit,nextCursor:rows.length>limit?data.at(-1)!.id:null},project:{id:p._id,title:p.title,revision:p.revision,selectedVideoId:p.selectedVideoId??null,latestReadyVideoId:p.latestReadyVideoId??null}};
  });},
  async get(ownerId:string,id:string){await assertVideosReady(db);return inTransaction(client,async session=>view((await owned(ownerId,id,session)).v,session));},
  async mutate(ownerId:string,id:string,action:'approve'|'select',key:string,raw:unknown){await assertVideosReady(db);const input=action==='approve'?approveRequest.parse(raw):selectRequest.parse(raw);
   return inTransaction(client,async session=>{
    const {v,p}=await owned(ownerId,id,session),commands=db.collection<Doc>('videoCommands');
    const scope={ownerId,videoId:id,action,keyHash:videoHash(key)},requestHash=videoHash(input);
    const old=await commands.findOne(scope,{session});
    if(old){if(old.requestHash!==requestHash)throw new ProjectError(409,'IDEMPOTENCY_KEY_REUSED','Recover the original request.');return {data:old.response,replayed:true};}
    await ready(v,session);let data;
    if(action==='approve'){
     const body=approveRequest.parse(input);if(body.expectedOutputHash!==v.outputHash||body.expectedRenderSpecHash!==v.renderSpecHash)throw new ProjectError(409,'HASH_MISMATCH','Review this exact video before approving.');
     let a=await db.collection<Doc>('videoApprovals').findOne({ownerId,projectId:v.projectId,subjectId:id},{session});
     if(!a){a={_id:uid('apr'),ownerId,projectId:v.projectId,kind:'video',subjectId:id,subjectHash:videoHash({outputHash:v.outputHash,renderSpecHash:v.renderSpecHash}),outputHash:v.outputHash,renderSpecHash:v.renderSpecHash,approvedBy:ownerId,approvedAt:new Date()};await db.collection<Doc>('videoApprovals').insertOne(a,{session});}
     data=approval(a);await projects.updateOne({_id:p._id,ownerId,deletedAt:null},{$inc:{contentRevision:Long.ONE}},{session});
    }else{
     const body=selectRequest.parse(input);if(p.revision!==body.expectedProjectRevision)throw new ProjectError(409,'REVISION_CONFLICT','Project selection changed. Refresh before selecting.');
     await projects.updateOne({_id:p._id,ownerId,revision:body.expectedProjectRevision,deletedAt:null},{$set:{selectedVideoId:id,updatedAt:new Date()},$inc:{revision:1,contentRevision:Long.ONE}},{session});
     data=selectionView.parse({projectId:p._id,videoId:id,projectRevision:p.revision+1});
    }
    await commands.insertOne({_id:uid('cmd'),...scope,projectId:p._id,requestHash,response:data,createdAt:new Date()},{session});return {data,replayed:false};
   });
  },
 };
}
