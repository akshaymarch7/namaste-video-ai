import {dependencies} from '../src/auth/runtime';
import {readInstagramConfig} from '../src/instagram/config';
import {instagramProvider} from '../src/instagram/provider';
import {instagramService} from '../src/instagram/service';
import {assertInstagramReady} from '../src/instagram/setup';
let client:Awaited<ReturnType<typeof dependencies>>['client']|undefined;
try{
 const config=readInstagramConfig();if(!config)throw Error();
 const deps=await dependencies();client=deps.client;await assertInstagramReady(deps.db);
 const service=instagramService(deps.db,client,config,instagramProvider(config)),counts:Record<string,number>={};
 for await(const row of deps.db.collection('instagramConnections').find({state:'connected',expiresAt:{$gt:new Date(),$lt:new Date(Date.now()+7*86400000)}},{projection:{ownerId:1}})){
  const result=await service.refresh(row.ownerId);counts[result]=(counts[result]??0)+1;
 }
 console.log(JSON.stringify({status:'ok',counts}));
}catch{console.error(JSON.stringify({status:'error',code:'INSTAGRAM_REFRESH_FAILED'}));process.exitCode=1;}finally{await client?.close();}
