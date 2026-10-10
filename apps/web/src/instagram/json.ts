// Meta identifiers may be unquoted JSON integers larger than Number.MAX_SAFE_INTEGER.
// Preserve their original digits before JavaScript rounding; reject exponent/decimal IDs.
export function parseInstagramJson(body:string):unknown {
 return JSON.parse(body,((key:string,value:unknown,context?:{source?:string})=>{
  if(key==='user_id'&&typeof value==='number'){
   if(!context?.source||!/^\d{1,100}$/.test(context.source))throw Error('INVALID_INSTAGRAM_IDENTIFIER');
   return context.source;
  }
  return value;
 }) as Parameters<typeof JSON.parse>[1]);
}
