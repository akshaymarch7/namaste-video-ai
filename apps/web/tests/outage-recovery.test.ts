import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createServer,connect,type Socket} from 'node:net';
import {once} from 'node:events';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {createDatabaseConnection} from '../src/db/client';
import {DatabaseError} from '../src/db/config';

// A real TCP outage against a disposable loopback database. No environment file,
// Atlas connection or provider credential is read. The database stays alive so
// recovery must preserve the same data, not replace it with a new fixture.
test('cold and pooled connections recover after socket failure without an app restart', {timeout:120000}, async()=>{
 const mongo=await MongoMemoryServer.create({binary:{version:'8.0.17'},instance:{ip:'127.0.0.1'}});
 const upstream=new URL(mongo.getUri());
 let available=false;
 const sockets=new Set<Socket>();
 const proxy=createServer(socket=>{
  if(!available){socket.destroy();return;}
  const target=connect({host:'127.0.0.1',port:Number(upstream.port)});
  for(const s of [socket,target]){sockets.add(s);s.on('close',()=>sockets.delete(s));s.on('error',()=>{socket.destroy();target.destroy();});}
  socket.pipe(target);target.pipe(socket);
 });
 proxy.listen(0,'127.0.0.1');await once(proxy,'listening');
 const address=proxy.address();assert.ok(address&&typeof address!=='string');
 const connection=createDatabaseConnection({uri:`mongodb://127.0.0.1:${address.port}/?directConnection=true`,database:'outage_test'});
 try{
  const failures=await Promise.allSettled([connection.get(),connection.get()]);
  for(const result of failures){assert.equal(result.status,'rejected');if(result.status==='rejected')assert.ok(result.reason instanceof DatabaseError&&result.reason.code==='DB_UNAVAILABLE');}
  available=true;
  const before=await connection.get();
  const saved={_id:'saved-draft',topic:'Water cycle',revision:1};
  const records=before.db.collection<{_id:string;topic:string;revision:number}>('outageFixture');
  await records.insertOne(saved);
  available=false;for(const s of sockets)s.destroy();
  await assert.rejects(records.findOne({_id:saved._id}));
  available=true;
  const after=await connection.get();assert.equal(after.client,before.client);
  assert.deepEqual(await records.findOne({_id:saved._id}),saved);
  assert.equal(await records.countDocuments(),1);
 }finally{
  for(const s of sockets)s.destroy();await connection.close();
  await new Promise<void>(resolve=>proxy.close(()=>resolve()));await mongo.stop();
 }
});
