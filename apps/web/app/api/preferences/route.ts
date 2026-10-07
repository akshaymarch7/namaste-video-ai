import {handlePreferences} from '@/src/preferences/http';
export const dynamic='force-dynamic';
export const GET=(request:Request)=>handlePreferences(request);
export const PATCH=(request:Request)=>handlePreferences(request);
