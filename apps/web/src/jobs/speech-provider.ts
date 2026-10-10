import 'server-only';
import {boundedBytes} from '../ideas/providers';
import {ExecutionError} from './execution';
import type {RenderConfig} from './render-config';

// Keep transport separate from local media probing. An interrupted response may
// already have consumed speech credits, so this boundary never retries.
export async function requestSpeech(text:string, config:RenderConfig, key:string,
  signal:AbortSignal, request:typeof fetch=fetch) {
  try {
    const response=await request(`https://api.elevenlabs.io/v1/text-to-speech/${config.voiceId}/with-timestamps?output_format=${config.format}`,{
      method:'POST',redirect:'error',headers:{'Content-Type':'application/json','xi-api-key':key},
      body:JSON.stringify({text,model_id:config.model,voice_settings:{stability:config.stability,similarity_boost:config.similarityBoost}}),signal,
    });
    if(!response.ok){
      await response.body?.cancel();
      throw new ExecutionError([401,403].includes(response.status)?'SPEECH_ACCESS_DENIED':response.status===429?'SPEECH_QUOTA_LIMIT':'PROVIDER_OUTCOME_UNKNOWN');
    }
    const payload=JSON.parse((await boundedBytes(response,12*1024*1024)).toString('utf8'));
    if(typeof payload?.audio_base64!=='string'||!payload.audio_base64||!payload.alignment)throw new ExecutionError('PROVIDER_OUTCOME_UNKNOWN');
    return payload as {audio_base64:string;alignment:import('./speech-result').SpeechResult['alignment']};
  } catch(error) {
    if(error instanceof ExecutionError)throw error;
    // Raw socket, JSON and response-body errors must not escape this boundary.
    throw new ExecutionError('PROVIDER_OUTCOME_UNKNOWN');
  }
}
