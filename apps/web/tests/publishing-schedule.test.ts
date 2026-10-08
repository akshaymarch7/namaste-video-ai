import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveSchedule,scheduleChoices} from '../src/publishing/schedule';
import {publishInput} from '../src/publishing/contracts';
const now=new Date('2026-01-01T00:00Z');
test('Indian timezone resolves exact UTC and enforces five-minute server lead time',()=>{
 assert.equal(resolveSchedule({localTime:'2026-01-01T05:35',timezone:'Asia/Kolkata',utcOffset:'+05:30'},now).utc.toISOString(),'2026-01-01T00:05:00.000Z');
 assert.throws(()=>resolveSchedule({localTime:'2026-01-01T05:34',timezone:'Asia/Kolkata',utcOffset:'+05:30'},now),{code:'INVALID_SCHEDULE'});
});
test('DST gap and impossible dates are rejected, repeated hour requires exact offset',()=>{
 assert.deepEqual(scheduleChoices('2026-03-08T02:30','America/New_York'),[]);
 assert.deepEqual(scheduleChoices('2026-02-30T12:00','UTC'),[]);
 const choices=scheduleChoices('2026-11-01T01:30','America/New_York');assert.deepEqual(choices.map(x=>x.utcOffset),['-04:00','-05:00']);
 assert.equal(resolveSchedule({localTime:'2026-11-01T01:30',timezone:'America/New_York',utcOffset:'-05:00'},now).utc.toISOString(),'2026-11-01T06:30:00.000Z');
 assert.throws(()=>resolveSchedule({localTime:'2026-11-01T01:30',timezone:'America/New_York',utcOffset:'-06:00'},now),{code:'AMBIGUOUS_LOCAL_TIME'});
});
test('half-hour DST, quarter-hour zones and invalid timezone do not guess',()=>{
 assert.equal(scheduleChoices('2026-01-01T12:00','Asia/Kathmandu')[0].utcOffset,'+05:45');
 assert.deepEqual(scheduleChoices('2026-04-05T01:45','Australia/Lord_Howe').map(x=>x.utcOffset),['+11:00','+10:30']);
 assert.deepEqual(scheduleChoices('2026-01-01T12:00','not/a/zone'),[]);
 assert.throws(()=>resolveSchedule({localTime:'2026-01-01T12:00',timezone:'UTC',utcOffset:'+01:00'},now),{code:'INVALID_UTC_OFFSET'});
});
test('schedule input cannot be hidden on now mode or omitted on schedule mode',()=>{
 const input={projectId:'prj_'+'a'.repeat(32),payload:{videoId:'vid_'+'b'.repeat(32),videoApprovalId:'apr_'+'c'.repeat(32),expectedOutputHash:'d'.repeat(64),destination:{connectionId:'igc_'+'e'.repeat(32),instagramUserId:'1',destinationEpoch:1},caption:''},confirm:true};
 assert.equal(publishInput.safeParse({...input,mode:'schedule'}).success,false);
 assert.equal(publishInput.safeParse({...input,mode:'now',schedule:{localTime:'2026-01-01T12:00',timezone:'UTC',utcOffset:'+00:00'}}).success,false);
});
