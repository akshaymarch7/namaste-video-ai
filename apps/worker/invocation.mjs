export function workerInvocation(args){
 const [role,mode,id]=args;
 if(!['storyboard','generation'].includes(role))throw Error('Choose storyboard or generation worker.');
 if(args.length===1)return {role,script:role==='storyboard'?'storyboards-worker.ts':'generations-worker.ts',args:[]};
 if(args.length!==3||mode!=='--job'||!/^job_[a-f0-9]{32}$/.test(id??''))throw Error('A bounded execution requires --job and one valid job ID.');
 return {role,script:'cloud-job.ts',args:[role,id]};
}
