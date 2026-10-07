import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {publishProvider} from '../src/publishing/provider';
import type {InstagramConfig} from '../src/instagram/config';
const cfg:InstagramConfig={appId:'123',appSecret:'test',redirectUri:'https://app.test/api/instagram/callback',version:'v26.0',activeKey:'a',keys:{a:randomBytes(32).toString('base64')}};
test('Meta adapter selects fixed provider host and sends Reel fields without query credentials',async()=>{
 for(const config of [cfg,{...cfg,provider:'facebook',facebookConfigId:'456'} as InstagramConfig]){
  const requests:{url:string;init?:RequestInit}[]=[];
  const provider=publishProvider(config,(async(url,init)=>{requests.push({url:String(url),init});return Response.json({id:'123456'});}) as typeof fetch);
  await provider.create('987','private-bearer','https://media.test/media/opaque','Caption');await provider.publish('987','private-bearer','123456');
  assert.match(requests[0].url,config.provider==='facebook'?/^https:\/\/graph.facebook.com\//:/^https:\/\/graph.instagram.com\//);assert.equal(requests[0].url.includes('private-bearer'),false);assert.equal((requests[0].init?.headers as any).Authorization,'Bearer private-bearer');
  const body=requests[0].init?.body as URLSearchParams;assert.equal(body.get('media_type'),'REELS');assert.equal(body.get('caption'),'Caption');assert.equal(requests[0].init?.redirect,'manual');assert.equal((requests[1].init?.body as URLSearchParams).get('creation_id'),'123456');
 }
});
test('provider timeouts, invalid bodies and upstream errors remain sanitized without retries',async()=>{
 for(const response of [()=>{throw Error('private-bearer');},()=>new Response('private-bearer',{status:502}),()=>Response.json({error:{code:190,message:'private-bearer'}},{status:400})]){let calls=0;const p=publishProvider(cfg,(async()=>{calls++;return response();}) as typeof fetch);await assert.rejects(p.publish('1','private-bearer','2'),e=>!String(e).includes('private-bearer'));assert.equal(calls,1);}
});
test('provider validates status, identifiers and Instagram permalink hosts',async()=>{
 let body:any={status_code:'PUBLISHED'};const p=publishProvider(cfg,(async()=>Response.json(body)) as typeof fetch);assert.equal(await p.status('1','token'),'PUBLISHED');body={status_code:'invented'};await assert.rejects(p.status('1','token'));body={id:'../escape'};await assert.rejects(p.publish('1','token','2'));body={permalink:'https://evil.test/reel'};await assert.rejects(p.permalink('1','token'));body={permalink:'https://www.instagram.com/reel/test/'};assert.equal(await p.permalink('1','token'),body.permalink);
});
