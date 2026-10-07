export function generationError(code:string){
 const messages:Record<string,string>={
  RENDER_CONFIG_CHANGED:'The renderer was updated before this job ran. Start a fresh generation to use the current renderer.',
  PILOT_DAILY_LIMIT:'The internal pilot has reached its daily generation limit. Your work is saved. Please try again tomorrow.',
  WORKER_UNAVAILABLE:'Generation could not start. Your work is saved. Please contact the team before trying again.',
  WORKER_STOPPED:'Generation stopped before processing your request. Your work is saved. Please contact the team before trying again.',
  QUEUE_EXPIRED:'The job expired before the worker started. Your storyboard is saved.',
  PROVIDER_OUTCOME_UNKNOWN:'The speech provider may have processed the request, but its result could not be confirmed. We did not automatically repeat it. Generating again may use credits again.',
  SPEECH_RECOVERY_REQUIRED:'The narration could not be recovered from private storage. We did not repeat the speech request. Check storage before generating again.',
  SPEECH_ACCESS_DENIED:'ElevenLabs denied this request. Check the configured API key and voice permissions.',
  SPEECH_QUOTA_LIMIT:'ElevenLabs returned a quota or rate limit. Check the account before generating again.',
  SPEECH_TIMING_INVALID:'The measured narration or motion timing did not pass validation. Review the storyboard before generating again.',
  RENDERER_NOT_CONNECTED:'This earlier preparation job has no renderer. Generate a new job from your approved storyboard.',
  JOB_DEADLINE:'The job reached its time limit. Your storyboard and earlier videos are preserved.',
 };
 return messages[code]??'Generation stopped without replacing earlier videos. Check the worker before generating again.';
}
