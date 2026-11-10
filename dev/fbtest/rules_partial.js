// 2026-11-11: 랭킹 줄을 일부 칸만 고쳐 쓰는 공격이 막히는지, 정상 쓰기는 되는지 봐요 (PR #136과 그 고침)
// 쓰는 법: NODE_PATH=<targaryen 폴더> node fbtest/rules_partial.js $PWD/gh_database.rules.json   (마지막 줄이 PASS면 통과)
const t = require('targaryen'), fs = require('fs'), path = require('path');
const rules = JSON.parse(fs.readFileSync(path.resolve(process.argv[2]), 'utf8'));
const now = Date.now(), wk = Math.floor((now + 9 * 3600000 - Date.UTC(2026, 0, 5)) / 604800000), TS = { '.sv': 'timestamp' };
let bad = 0; const ok = (name, got, want) => { if (got !== want) { bad++; console.log('FAIL', name, 'got', got, 'want', want); } };
const as = (data, at) => t.database(rules, data).with({ now: at }).as({ uid: 'u1', provider: 'anonymous' });
// 1) 대결 점수
let r = as({}, now).write('/forest/rank/u1', { name: '시험', score: 100, at: TS, bt: 1000, btq: now - 86400000 + 1000 }, undefined, now);
ok('새 줄(bt 1000) 쓰기', r.allowed, true);
let d = r.newDatabase.with({ now: now + 1000 }).as({ uid: 'u1', provider: 'anonymous' });
ok('일부 칸만 고쳐 bt 올리기', d.update('/forest/rank/u1', { bt: 9999, at: TS }, now + 1000).allowed, false);
ok('btq만 지우기', d.update('/forest/rank/u1', { btq: null, at: TS }, now + 1000).allowed, false);
ok('줄 전체로 bt 9999', d.write('/forest/rank/u1', { name: '시험', score: 100, at: TS, bt: 9999, btq: now - 86400000 + 1000 }, undefined, now + 1000).allowed, false);
// 2) 주간 점수: 지난주 점수를 새 주로 옮기기
const row = (at, o) => ({ forest: { rank: { u1: Object.assign({ name: '가', score: 100, at, week: wk - 1, lp: 900000, ws: (wk - 1) * 1e6 + 900000 }, o) } } });
d = as(row(now - 3600e3), now);
ok('지난주 lp를 일부 칸만 고쳐 새 주로', d.update('/forest/rank/u1', { week: wk, ws: wk * 1e6 + 900000, at: TS }, now).allowed, false);
ok('새 주에 줄 전체(lp 30)', d.write('/forest/rank/u1', { name: '가', score: 100, at: TS, week: wk, lp: 30, ws: wk * 1e6 + 30 }, undefined, now).allowed, true);
// 오래 쉬다 돌아와 새 주 첫 올리기에 1000점을 넘는 정상 쓰기(한 시간에 360점 + 1000까지)
d = as(row(now - 6 * 3600e3), now);
ok('6시간 뒤 새 주 lp 2000', d.write('/forest/rank/u1', { name: '가', score: 100, at: TS, week: wk, lp: 2000, ws: wk * 1e6 + 2000 }, undefined, now).allowed, true);
ok('6시간 뒤 새 주 lp 5000', d.write('/forest/rank/u1', { name: '가', score: 100, at: TS, week: wk, lp: 5000, ws: wk * 1e6 + 5000 }, undefined, now).allowed, false);
console.log(bad ? `FAIL ${bad}` : 'PASS');
if (bad) process.exit(1);
