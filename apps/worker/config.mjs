const shared=['PATH','HOME','TMPDIR','NODE_ENV','MONGODB_URI','MONGODB_DATABASE'];
const roles={storyboard:['GEMINI_API_KEY','GEMINI_MODEL','OPENAI_API_KEY','OPENAI_STORYBOARD_MODEL','STORYBOARD_PRIMARY_PROVIDER','STORYBOARD_FALLBACK_PROVIDER'],generation:['ELEVENLABS_API_KEY','R2_ACCOUNT_ID','R2_BUCKET','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','BROWSER_EXECUTABLE']};
export function workerConfig(role,source=process.env){
 if(!Object.hasOwn(roles,role))throw Error('Choose storyboard or generation worker.');
 const providerKeys=role==='storyboard'?[source.STORYBOARD_PRIMARY_PROVIDER??'gemini',source.STORYBOARD_FALLBACK_PROVIDER].filter(Boolean).flatMap(provider=>{if(!['gemini','openai'].includes(provider))throw Error('Invalid storyboard provider.');return provider==='gemini'?['GEMINI_API_KEY','GEMINI_MODEL']:['OPENAI_API_KEY'];}):roles[role].filter(key=>key!=='BROWSER_EXECUTABLE');
 const required=['MONGODB_URI','MONGODB_DATABASE',...providerKeys];
 const missing=required.filter(key=>!source[key]?.trim());
 if(missing.length)throw Error(`Worker configuration missing: ${missing.join(', ')}`);
 const env=Object.fromEntries([...shared,...roles[role]].filter(key=>source[key]!==undefined).map(key=>[key,source[key]]));
 env.NODE_ENV='production';
 return {env,script:role==='storyboard'?'storyboards-worker.ts':'generations-worker.ts'};
}
