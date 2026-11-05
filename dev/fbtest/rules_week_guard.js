// 보안 보강 1절(2026-11-06, Codex 검토): 주간 랭킹 오염 회귀 시험. 테스트 시계와 규칙 시뮬레이터(targaryen)만 써요. 운영 Firebase에는 요청하지 않아요.
// (1) 규칙: 주 번호는 정수, 서버 시각 기준 이번 주까지만(다음 주, 소수 거부). 지난주와 그 전 주, -1(주 없음)은 옛 앱 호환으로 받아요.
// (2) 조회: 다음 주 기록 60개가 있어도 이번 주 정상 기록이 순위표에서 밀려나지 않아야 해요(옛 방식 limitToLast(ws)와 새 방식 이번 주 범위 조회 비교).
// 쓰는 법: NODE_PATH=<targaryen이 깔린 node_modules> node dev/fbtest/rules_week_guard.js database.rules.json   (마지막 줄 PASS)
const T = require('targaryen'), rules = require(require('path').resolve(process.argv[2]));
let fail = 0;
const t = (s, g, w) => { if (g !== w) { fail++; console.log('FAIL', s, '실제', g, '바른 값', w); } else console.log('ok  ', s); };
const W = 604800000, KST = 32400000, A0 = Date.UTC(2026, 0, 5);
const weekOf = now => Math.floor((now + KST - A0) / W);
const put = (now, week, lp = 100, uid = 'A') => T.database(rules, {}).as({ uid }).write('/forest/rank/' + uid,
  { name: 'A', score: 0, at: now, week, lp, ws: week * 1000000 + lp }, { now }).allowed;

// 규칙
const now = Date.parse('2026-11-06T02:00:00+09:00'), w = weekOf(now);
t(`이번 주 ${w} 허용`, put(now, w), true);
t(`지난주 ${w - 1} 허용(옛 앱, 오프라인 복귀)`, put(now, w - 1), true);
t('주 없음 -1 허용(옛 앱, ws 없이)', T.database(rules, {}).as({ uid: 'A' }).write('/forest/rank/A', { name: 'A', score: 0, at: now, week: -1 }, { now }).allowed, true);
t(`다음 주 ${w + 1} 거부`, put(now, w + 1), false);
t(`다다음 주 ${w + 2} 거부`, put(now, w + 2), false);
t(`소수 주 ${w}.5 거부`, put(now, w + 0.5), false);
t(`소수 주 ${w - 1}.5 거부`, put(now, w - 0.5), false);
t('아주 먼 과거 주 거부', put(now, w - 10), false);
// 월요일 한국 시간 0시 경계: 기기 시계가 조금 빨라 새 주를 먼저 써도 1분까지는 받아 줘요
const mon = Date.parse('2026-11-09T00:00:00+09:00'), wm = weekOf(mon);
t('월요일 0시 정각 새 주 허용', put(mon, wm), true);
t('월요일 0시 30초 전 새 주 허용(1분 여유)', put(mon - 30000, wm), true);
t('월요일 0시 5분 전 새 주 거부', put(mon - 300000, wm), false);
t('월요일 0시 1초 뒤 지난주 허용', put(mon + 1000, wm - 1), true);

// 조회 알고리즘: 서버에 이번 주 정상 5명과 다음 주로 쓴 60줄이 있을 때(옛 규칙이면 쓸 수 있었던 상태)
const RANK_MAX = 50;
const rows = [];
for (let i = 0; i < 5; i++) rows.push({ id: 'ok' + i, week: w, lp: 300 + i, ws: w * 1e6 + 300 + i });
for (let i = 0; i < 60; i++) rows.push({ id: 'bad' + i, week: w + 1, lp: i, ws: (w + 1) * 1e6 + i });
const byWs = [...rows].sort((a, b) => a.ws - b.ws);
const oldQ = byWs.slice(-(RANK_MAX + 10)).filter(r => r.week === w);   // 3.2.1까지: ws 위에서 60줄 받은 뒤 이번 주만
const newQ = byWs.filter(r => r.ws >= w * 1e6 && r.ws <= w * 1e6 + 999999).slice(-(RANK_MAX + 10)).filter(r => Number.isInteger(r.week) && r.week === w);   // 이번 주 범위만 받아요
t('옛 조회는 다음 주 60줄에 이번 주 기록이 밀려나요(재현)', oldQ.length, 0);
t('새 조회는 이번 주 5명을 모두 받아요', newQ.length, 5);
// 소수 주(옛 규칙에서 쓸 수 있던 값)가 서버에 남아 있어도 새 조회와 읽기는 이번 주로 세지 않아요
const frac = { id: 'f', week: w + 0.5, lp: 999, ws: (w + 0.5) * 1e6 + 999 };
const inRange = frac.ws >= w * 1e6 && frac.ws <= w * 1e6 + 999999;
t('소수 주 줄은 범위 안에 들어올 수 있어요(그래서 읽을 때 정수 확인)', inRange, true);
t('읽을 때 정수가 아니면 빼요', Number.isInteger(frac.week) && frac.week === w, false);

console.log(fail ? `FAIL ${fail}` : 'PASS'); process.exitCode = fail ? 1 : 0;
