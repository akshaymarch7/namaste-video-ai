import {jobView} from '../jobs/contracts';
import {z} from 'zod';
import {videoId} from './contracts';
import {sha256} from '../storage/contracts';
import {captionOverrides} from '../../../../src/plan-v2/caption-edits';
export const captionRequest=z.object({expectedRenderSpecHash:sha256,overrides:captionOverrides}).strict();
export const regenerateRequest=z.object({expectedRenderSpecHash:sha256}).strict();
export const captionView=z.object({videoId,renderSpecHash:sha256,scenes:z.array(z.object({sceneId:z.string(),title:z.string(),speechFingerprint:sha256,captions:z.array(z.object({id:z.string(),sourceStart:z.number().int().nonnegative(),sourceEnd:z.number().int().positive(),text:z.string(),originalText:z.string(),startFrame:z.number().int().nonnegative(),endFrame:z.number().int().positive()}).strict())}).strict())}).strict();

export const revisionView=z.object({sourceVideoId:videoId,sourceRenderSpecHash:sha256,job:jobView}).strict();
