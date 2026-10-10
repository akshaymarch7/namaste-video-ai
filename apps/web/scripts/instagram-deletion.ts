import {getDatabase} from '../src/db/client';
import {completeReviewedDeletion,deletionStatus} from '../src/instagram/deletion';
let client:Awaited<ReturnType<typeof getDatabase>>['client']|undefined;
try{
 const [action,code,confirmation,...extra]=process.argv.slice(2);
 if(!['status','complete'].includes(action)||!/^[a-f0-9]{64}$/.test(code??'')||extra.length||(action==='complete'?confirmation!=='--confirm-account-and-publication-review':confirmation!==undefined))throw Error();
 const deps=await getDatabase();client=deps.client;
 if(action==='complete')await completeReviewedDeletion(deps.db,client,code);
 const status=await deletionStatus(deps.db,code);console.log(JSON.stringify({status:status?.state??'not_found'}));
}catch{console.error(JSON.stringify({status:'error',message:'Request unchanged or outcome unconfirmed. Check the status before retrying; unmapped or ambiguous history requires identity review. Completion requires --confirm-account-and-publication-review.'}));process.exitCode=1;}finally{await client?.close();}
