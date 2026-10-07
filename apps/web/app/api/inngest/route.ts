import type {NextRequest} from 'next/server';
import {serve} from 'inngest/next';
import {inngest,generationFunction,dispatchFunction} from '@/src/jobs/inngest';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const handlers=serve({client:inngest,functions:[generationFunction,dispatchFunction]});
function allowed(request:Request){
 if(process.env.CLOUD_RUN_ENABLED==='1')return false;
 // Explicit local mode only. Hosted requests must pass the SDK's signing-key verification.
 const dev=process.env.NODE_ENV!=='production'&&process.env.INNGEST_DEV==='1';
 return dev?['localhost','127.0.0.1'].includes(new URL(request.url).hostname):Boolean(process.env.INNGEST_SIGNING_KEY);
}
export async function GET(request:NextRequest,context:unknown){if(!allowed(request))return new Response(null,{status:503});return handlers.GET(request,context);}
export async function POST(request:NextRequest,context:unknown){if(!allowed(request))return new Response(null,{status:503});return handlers.POST(request,context);}
export async function PUT(request:NextRequest,context:unknown){if(!allowed(request))return new Response(null,{status:503});return handlers.PUT(request,context);}
