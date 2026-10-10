import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseInstagramJson} from '../src/instagram/json';
test('Meta numeric identity is preserved exactly above JavaScript safe integers',()=>{
 assert.deepEqual(parseInstagramJson('{"data":[{"user_id":17841400000000001,"expires_in":3600}]}'),{data:[{user_id:'17841400000000001',expires_in:3600}]});
 assert.deepEqual(parseInstagramJson('{"user_id":"17841400000000001"}'),{user_id:'17841400000000001'});
});
test('numeric identity rejects decimal, exponent and negative encodings',()=>{
 for(const value of ['1.5','1e16','-123'])assert.throws(()=>parseInstagramJson('{"user_id":'+value+'}'));
});
