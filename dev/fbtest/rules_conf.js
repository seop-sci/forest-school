// 5.2.0 학회 순위 규칙 시험(cf 학회 점수, cq = 학회 × 1,000,000 + cf, 학회 = 주간 리그 4주). 운영 Firebase에는 요청하지 않아요.
// 쓰는 법: NODE_PATH=<targaryen이 깔린 node_modules> node dev/fbtest/rules_conf.js database.rules.json   (마지막 줄 PASS)
const T = require('targaryen'), rules = require(require('path').resolve(process.argv[2]));
let fail = 0;
const t = (s, g, w) => { if (g !== w) { fail++; console.log('FAIL', s, '실제', g, '바른 값', w); } else console.log('ok  ', s); };
const W = 604800000, KST = 32400000, A0 = Date.UTC(2026, 0, 5);
const weekOf = now => Math.floor((now + KST - A0) / W);
const now = Date.parse('2026-11-20T02:00:00+09:00'), w = weekOf(now), p = Math.floor(w / 4);
const doc = (cf, cq, week = w) => ({ name: 'A', score: 0, at: now, week, lp: 100, ws: week * 1000000 + 100, cf, cq });
const put = (d, old, at = now) => T.database(rules, old ? { forest: { rank: { A: old } } } : {}).as({ uid: 'A' }).write('/forest/rank/A', d, { now: at }).allowed;

t('처음 35점 허용', put(doc(35, p * 1e6 + 35)), true);
t('처음 36점 거부', put(doc(36, p * 1e6 + 36)), false);
t('cq가 cf와 안 맞으면 거부', put(doc(20, p * 1e6 + 21)), false);
t('다음 학회 번호 거부', put(doc(10, (p + 1) * 1e6 + 10)), false);
t('지난 학회 번호 거부(이번 주와 안 맞음)', put(doc(10, (p - 1) * 1e6 + 10)), false);
t('소수 점수 거부', put(doc(10.5, p * 1e6 + 10.5)), false);
const old = Object.assign(doc(100, p * 1e6 + 100), { at: now - 60000 });
t('지난 쓰기 1분 뒤 +35 허용', put(doc(135, p * 1e6 + 135), old), true);
t('지난 쓰기 1분 뒤 +40 거부', put(doc(140, p * 1e6 + 140), old), false);
const old2 = Object.assign(doc(100, p * 1e6 + 100), { at: now - 3600000 });
t('한 시간 뒤 +200 허용(10분마다 35점)', put(doc(300, p * 1e6 + 300), old2), true);
t('한 시간 뒤 +300 거부', put(doc(400, p * 1e6 + 400), old2), false);
t('학회 칸 없이도 허용(옛 앱)', T.database(rules, {}).as({ uid: 'A' }).write('/forest/rank/A', { name: 'A', score: 0, at: now, week: w, lp: 100, ws: w * 1e6 + 100 }, { now }).allowed, true);
t('cf만 있고 cq가 없으면 거부', T.database(rules, {}).as({ uid: 'A' }).write('/forest/rank/A', { name: 'A', score: 0, at: now, week: w, lp: 100, ws: w * 1e6 + 100, cf: 10 }, { now }).allowed, false);
console.log(fail ? `FAIL ${fail}` : 'PASS');
process.exit(fail ? 1 : 0);
