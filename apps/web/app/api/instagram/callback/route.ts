import {handleInstagram} from '@/src/instagram/http';
export const runtime='nodejs';
export const maxDuration=60;
export async function GET(request:Request){return handleInstagram(request,'callback');}
