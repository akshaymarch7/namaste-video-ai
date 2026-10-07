import 'server-only';
import {createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
type CommonInstagramConfig={appId:string;appSecret:string;redirectUri:string;version:string;activeKey:string;keys:Record<string,string>};
export type InstagramConfig=CommonInstagramConfig&({provider?:'instagram';facebookConfigId?:never}|{provider:'facebook';facebookConfigId:string});
export function readInstagramConfig(env:Record<string,string|undefined>=process.env):InstagramConfig|null{
 try{
  const appId=env.INSTAGRAM_APP_ID!,appSecret=env.INSTAGRAM_APP_SECRET!,redirectUri=env.INSTAGRAM_REDIRECT_URI!,version=env.INSTAGRAM_GRAPH_VERSION!,activeKey=env.INSTAGRAM_TOKEN_KEY_ID!,keys=JSON.parse(env.INSTAGRAM_TOKEN_KEYS??'{}');
  const url=new URL(redirectUri),origin=new URL(env.BETTER_AUTH_URL!).origin;
  if(!/^\d+$/.test(appId)||!appSecret||!/^v\d+\.0$/.test(version)||url.protocol!=='https:'||url.origin!==origin||url.pathname!=='/api/instagram/callback'||url.search||url.hash||url.username||url.password||!/^[-\w]{1,40}$/.test(activeKey)||!keys[activeKey])return null;
  if(!Object.hasOwn(keys,activeKey)||typeof keys[activeKey]!=='string'||Object.values(keys).some(k=>typeof k!=='string'||!/^[A-Za-z0-9+/]{43}=$/.test(k)||Buffer.from(k,'base64').length!==32))return null;
  const provider=env.INSTAGRAM_LOGIN_PROVIDER??'instagram';
  if(provider==='instagram')return {appId,appSecret,redirectUri,version,activeKey,keys};
  if(provider==='facebook'&&/^\d{1,100}$/.test(env.INSTAGRAM_FACEBOOK_CONFIG_ID??''))return {appId,appSecret,redirectUri,version,activeKey,keys,provider,facebookConfigId:env.INSTAGRAM_FACEBOOK_CONFIG_ID!};
  return null;
 }catch{return null;}
}
export type EncryptedToken={keyId:string;nonce:string;ciphertext:string;tag:string};
export function encryptToken(token:string,config:InstagramConfig,ownerId:string,id:string):EncryptedToken{
 const nonce=randomBytes(12),cipher=createCipheriv('aes-256-gcm',Buffer.from(config.keys[config.activeKey],'base64'),nonce);
 cipher.setAAD(Buffer.from(JSON.stringify([ownerId,id])));
 const ciphertext=Buffer.concat([cipher.update(token,'utf8'),cipher.final()]);
 return {keyId:config.activeKey,nonce:nonce.toString('base64'),ciphertext:ciphertext.toString('base64'),tag:cipher.getAuthTag().toString('base64')};
}
export function decryptToken(value:EncryptedToken,config:InstagramConfig,ownerId:string,id:string){
 const decipher=createDecipheriv('aes-256-gcm',Buffer.from(config.keys[value.keyId],'base64'),Buffer.from(value.nonce,'base64'));
 decipher.setAAD(Buffer.from(JSON.stringify([ownerId,id])));decipher.setAuthTag(Buffer.from(value.tag,'base64'));
 return Buffer.concat([decipher.update(Buffer.from(value.ciphertext,'base64')),decipher.final()]).toString('utf8');
}
