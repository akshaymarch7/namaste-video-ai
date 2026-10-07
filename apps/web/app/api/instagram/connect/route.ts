import {handleInstagram} from '@/src/instagram/http';
export const runtime='nodejs';
export async function POST(request:Request){return handleInstagram(request,'connect');}
