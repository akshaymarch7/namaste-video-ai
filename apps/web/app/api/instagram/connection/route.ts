import {handleInstagram} from '@/src/instagram/http';
export const runtime='nodejs';
export async function GET(request:Request){return handleInstagram(request,'read');}
export async function DELETE(request:Request){return handleInstagram(request,'disconnect');}
