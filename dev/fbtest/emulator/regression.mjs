// Official Emulator only. demo project and loopback are mandatory; no production fallback.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { ref, set, get, update, remove, runTransaction, query, orderByChild, equalTo, limitToLast, serverTimestamp } from 'firebase/database';
const host = process.env.FIREBASE_DATABASE_EMULATOR_HOST;
if (!host || !/^127\.0\.0\.1:\d+$/.test(host)) throw Error('Loopback Firebase Emulator required');
const [hostname, port] = host.split(':');
const source = fs.readFileSync('../../../database.rules.json', 'utf8');
assert.equal(source, fs.readFileSync('../../gh_database.rules.json', 'utf8'));
let env;
const open = async rules => {
  if (env) await env.cleanup();
  env = await initializeTestEnvironment({ projectId: 'demo-forest-security', database: { host: hostname, port: +port, rules } });
  await env.clearDatabase();
  return env.authenticatedContext('A').database();
};
try {
  let db = await open(source);
  const doc = { d: '{"v":4}', at: Date.now(), v: '3.0.0' };
  for (const path of ['forest/saves/A', 'forest/bak/A/0']) {
    await assertSucceeds(set(ref(db, path), doc));
    for (const bad of [{ junk: 'x'.repeat(1048576) }, { v: 'x'.repeat(1048576) }, { at: 'now' }, { d: {} }, { v: 3 }]) {
      await assertFails(set(ref(db, path), { ...doc, ...bad }));
    }
    await assertFails(update(ref(db, path), { junk: 1 }));
    const other = env.authenticatedContext('B').database();
    await assertFails(get(ref(other, path)));
    await assertFails(set(ref(other, path), doc));
    await assertFails(remove(ref(other, path)));
    await assertSucceeds(remove(ref(db, path)));
  }
  await assertSucceeds(set(ref(db, 'forest/saves/A'), { ...doc, v: '1.8.0' }));
  await assertSucceeds(update(ref(db, 'forest/saves/A'), { r: 1 }));
  await assertSucceeds(runTransaction(ref(db, 'forest/saves/A'), current => ({ ...(current || doc), r: (current?.r || 0) + 1 })));
  assert.equal((await get(ref(db, 'forest/saves/A/r'))).val(), 2);
  await assertSucceeds(set(ref(db, 'forest/bak/A/0'), { ...doc, pid: 'ABC123', prog: 20015, sum: '학교', sv: doc.at, why: '백업' }));
  await assertFails(set(ref(db, 'forest/bak/A/3'), doc));
  await assertSucceeds(update(ref(db, 'forest'), { 'saves/A': null, 'bak/A': null, 'rank/A': null, 'look/A': null, 'stats/A': null, 'admins/A': null }));
  console.log('PASS storage whitelist, old save, partial update, revision transaction, backup, multi-path deletion, isolation');

  // RTDB now cannot be set by a client. Substitute a literal into a TEST-ONLY copy for calendar boundaries.
  for (const [date, n] of [['2026-12-01T00:00:00+09:00', 1], ['2027-03-01T00:00:00+09:00', 2], ['2028-03-01T00:00:00+09:00', 6], ['2100-03-01T00:00:00+09:00', 294]]) {
    for (const delta of [-1, 0]) {
      const now = Date.parse(date) + delta;
      db = await open(source.replace(/\bnow\b/g, String(now)));
      const row = sk => ({ name: 'A', score: 0, at: now, sk, sp: 100 });
      await assertFails(set(ref(db, 'forest/rank/A'), row(n + 1)));
      await assertFails(set(ref(db, 'forest/rank/A'), row(1.5)));
      if (delta < 0) await assertFails(set(ref(db, 'forest/rank/A'), row(n)));
      else await assertSucceeds(set(ref(db, 'forest/rank/A'), row(n)));
    }
  }
  console.log('PASS KST season boundary and invalid season');
  db = await open(source);
  await env.withSecurityRulesDisabled(async context => {
    const rows = { current: { name: 'current', sk: 2, sp: 100 } };
    for (let i = 0; i < 60; i++) {
      rows['old' + i] = { name: 'old', sk: 1, sp: 1000 };
      rows['future' + i] = { name: 'future', sk: 3, sp: 2000 };
    }
    await set(ref(context.database(), 'forest/rank'), rows);
  });
  const legacy = await get(query(ref(db, 'forest/rank'), orderByChild('sp'), limitToLast(60)));
  assert.equal(legacy.hasChild('current'), false);
  const fixed = await get(query(ref(db, 'forest/rank'), orderByChild('sk'), equalTo(2)));
  assert.deepEqual(Object.keys(fixed.val()), ['current']);
  console.log('PASS prior/future records cannot crowd current-season query');
  // 2026-11-11 (3.3.2 분석 H1): 랭킹 줄을 일부 칸만 고쳐 쓰는 공격이 막히고, 줄 전체 정상 쓰기는 되는지 (가짜 엔진 시험 rules_partial.js와 같은 경우)
  db = await open(source);
  {
    const now = Date.now(), wk = Math.floor((now + 9 * 3600000 - Date.UTC(2026, 0, 5)) / 604800000), TS = serverTimestamp();
    await assertSucceeds(set(ref(db, 'forest/rank/A'), { name: 'A', score: 100, at: TS, bt: 1000, btq: now - 86400000 + 1000 }));
    await assertFails(update(ref(db, 'forest/rank/A'), { bt: 9999, at: TS }));
    await assertFails(update(ref(db, 'forest/rank/A'), { btq: null, at: TS }));
    await assertFails(set(ref(db, 'forest/rank/A'), { name: 'A', score: 100, at: TS, bt: 9999, btq: now - 86400000 + 1000 }));
    await env.withSecurityRulesDisabled(async context => {
      await set(ref(context.database(), 'forest/rank/A'), { name: 'A', score: 100, at: now - 3600e3, week: wk - 1, lp: 900000, ws: (wk - 1) * 1e6 + 900000 });
    });
    await assertFails(update(ref(db, 'forest/rank/A'), { week: wk, ws: wk * 1e6 + 900000, at: TS }));
    await assertSucceeds(set(ref(db, 'forest/rank/A'), { name: 'A', score: 100, at: TS, week: wk, lp: 30, ws: wk * 1e6 + 30 }));
  }
  console.log('PASS partial-field rank writes are rejected, full-row writes still work');
  console.log('PASS');
} finally { if (env) await env.cleanup(); }
