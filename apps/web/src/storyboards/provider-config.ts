import 'server-only';
import {ProviderError} from '../ideas/providers';
export type PlannerProvider = 'gemini'|'openai';
export type PlannerEndpoint = {provider?:PlannerProvider;key:string;model:string};
export type PlannerConfig = PlannerEndpoint & {fallback?:PlannerEndpoint};
const modelPattern=/^[a-zA-Z0-9.-]{1,70}$/;
function endpoint(provider:string,model:string|undefined,env:Record<string,string|undefined>):PlannerEndpoint {
 if(provider!=='gemini'&&provider!=='openai')throw new ProviderError('AI_NOT_CONFIGURED');
 const key=env[provider==='openai'?'OPENAI_API_KEY':'GEMINI_API_KEY'];
 if(!key?.trim()||!model||!modelPattern.test(model))throw new ProviderError('AI_NOT_CONFIGURED');
 return {provider,key,model};
}
// A queue receipt pins the entire route; changing defaults cannot reroute accepted work.
// Legacy bare model IDs continue to mean Gemini, with no new fallback.
export function storyboardConfig(route?:string,env:Record<string,string|undefined>=process.env):PlannerConfig {
 let endpoints:PlannerEndpoint[];
 if(route){
  const parts=route.split('|');
  if(parts.length>2||route.length>100)throw new ProviderError('AI_NOT_CONFIGURED');
  endpoints=parts.map(part=>{const pair=part.split(':');return pair.length===1?endpoint('gemini',pair[0],env):pair.length===2?endpoint(pair[0],pair[1],env):(()=>{throw new ProviderError('AI_NOT_CONFIGURED');})();});
 }else{
  const primary=env.STORYBOARD_PRIMARY_PROVIDER??'gemini',fallback=env.STORYBOARD_FALLBACK_PROVIDER;
  const get=(p:string)=>endpoint(p,env[p==='openai'?'OPENAI_STORYBOARD_MODEL':'GEMINI_MODEL']??(p==='openai'?'gpt-4.1-mini':undefined),env);
  endpoints=[get(primary),...(fallback?[get(fallback)]:[])];
 }
 if(endpoints.length===2&&endpoints[0].provider===endpoints[1].provider)throw new ProviderError('AI_NOT_CONFIGURED');
 const config={...endpoints[0],...(endpoints[1]?{fallback:endpoints[1]}:{})};
 if(plannerRoute(config).length>100)throw new ProviderError('AI_NOT_CONFIGURED');
 return config;
}
export function plannerRoute(config:PlannerConfig){
 if(!config.fallback&&(config.provider??'gemini')==='gemini')return config.model;
 return [config,...(config.fallback?[config.fallback]:[])].map(c=>`${c.provider??'gemini'}:${c.model}`).join('|');
}
