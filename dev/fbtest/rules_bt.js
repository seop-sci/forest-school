// 2.2.0 검토 1: 숲속 대결 순위(bt, btq, btm) 규칙 재현 시험
// 쓰는 법: NODE_PATH=<targaryen> node dev/fbtest/rules_bt.js database.rules.json   (마지막 줄 PASS면 통과)
// - 공격: 0.1초 간격으로 +200씩 쓰기, btq 지우기 섞기, btm 5 바로 쓰기
// - 정상: 하루 5판(한 판 최대 +40) 끝날 때마다 올리기, 오래 쉬고 와서 나눠 올리기, 두 기기 번갈아 올리기, 지기(점수 내려감)
// 앱 쪽 계산은 dev/forest-school.html의 btRankDoc()과 같은 식을 여기 옮겨 써요(BT_DAY, BT_MS, BT_SLACK)
const targaryen = require('targaryen');
const path = require('path');
const rules = require(path.resolve(process.argv[2]));
const T0 = Date.UTC(2026, 9, 1, 3, 0, 0);
const WK = Math.floor((T0 + 32400000 - 1767571200000) / 604800000);
const RANK = { name: '지섭 교장', score: 120, tier: 1, year: 2, test: false, pid: 'K7QM2XPA', week: WK, lp: 0, ws: WK * 1000000 };
const LG = [1000, 1100, 1300, 1600, 2000, 2500];
const lgOf = p => { let L = 0; LG.forEach((a, i) => { if (p >= a) L = i; }); return L; };
const fails = []; let pass = 0;
const ok = (name, c) => { if (c) pass++; else { fails.push(name); console.log('FAIL', name); } };
function mk(rank) { return { db: targaryen.database(rules, { forest: { rank: rank ? { U: rank } : {} } }).as({ uid: 'U', provider: 'anonymous' }) }; }
const wk = now => { const w = Math.floor((now + 32400000 - 1767571200000) / 604800000); return { week: w, ws: w * 1000000 }; };
function put(st, doc, now) {
  const r = st.db.write('/forest/rank/U', Object.assign({}, RANK, doc, wk(now), { at: { '.sv': 'timestamp' } }), { now });
  if (r.allowed) st.db = r.newDatabase; else if (process.env.WHY) console.log(r.info);
  return r.allowed;
}
const cur = st => st.db.snapshot('/forest/rank/U').val() || {};

// ---- 공격 1: 처음 1000점, 0.1초마다 +200 (btq는 서버 시각 바로 그 값으로, 가장 많이 받는 값)
{ const st = mk(Object.assign({}, RANK, { at: T0 - 60000, bt: 1000, btq: T0 - 86400000, btm: 0 }));
  let n = 0, now = T0;
  for (let i = 0; i < 100; i++) { now += 100; const c = cur(st); const bt = Math.min(9999, c.bt + 200); if (put(st, { bt, btq: now, btm: c.btm || 0 }, now) || put(st, { bt, btm: c.btm || 0 }, now)) n++; }
  console.log(`공격 1: 0.1초 간격 +200을 100번, 받아 준 쓰기 ${n}번, 마지막 bt ${cur(st).bt}`);
  ok('공격 1: 10초 동안 1,200점을 넘지 않아요', cur(st).bt <= 1200); }
// ---- 공격 1-2: 10초 간격(앱의 업로드 간격)으로 1시간
{ const st = mk(Object.assign({}, RANK, { at: T0 - 60000, bt: 1000, btq: T0 - 86400000, btm: 0 }));
  let now = T0; for (let i = 0; i < 360; i++) { now += 10000; const c = cur(st); const bt = Math.min(9999, c.bt + 200); put(st, { bt, btq: now, btm: c.btm || 0 }, now) || put(st, { bt, btm: c.btm || 0 }, now); }
  console.log(`공격 1-2: 10초 간격 +200을 1시간, 마지막 bt ${cur(st).bt}`);
  ok('공격 1-2: 한 시간에 하루치(200)와 그 시간만큼(약 8)만', cur(st).bt <= 1209); }
// ---- 공격 2: btq를 빼거나 옛 값으로 되돌리며 반복
{ const st = mk(Object.assign({}, RANK, { at: T0 - 60000, bt: 1200, btq: T0 - 1000, btm: 1 }));
  let now = T0;
  for (let i = 0; i < 50; i++) { now += 100; const c = cur(st);
    put(st, { bt: c.bt, btm: c.btm }, now);                      // btq 빼고 쓰기(지우기)
    put(st, { bt: c.bt + 200, btq: T0 - 86400000, btm: c.btm }, now);   // 옛 btq로 되돌리기
    put(st, { bt: c.bt + 200, btm: c.btm }, now); }           // btq 없이 올리기
  console.log(`공격 2: btq 지우기, 되돌리기, 빼고 올리기, 마지막 bt ${cur(st).bt}`);
  ok('공격 2: btq를 빼거나 되돌려도 오르지 않아요', cur(st).bt === 1200); }
// ---- 공격 3: 메달만 5로
{ const st = mk(Object.assign({}, RANK, { at: T0 - 60000, bt: 1200, btq: T0 - 1000, btm: 1 }));
  ok('공격 3: bt 1200에서 btm 5는 막혀요', !put(st, { bt: 1200, btq: T0 - 1000, btm: 5 }, T0));
  ok('공격 3: bt 1200에서 btm 2(은, 1300)도 막혀요', !put(st, { bt: 1200, btq: T0 - 1000, btm: 2 }, T0));
  ok('공격 3: btm만 쓰고 bt가 없으면 막혀요', !put(st, { btm: 1 }, T0)); }
// ---- 공격 4: 처음 쓰는 줄
{ const st = mk(null);
  ok('공격 4: 처음 1201점은 막혀요', !put(st, { bt: 1201, btq: T0, btm: 1 }, T0));
  ok('공격 4: 처음 btq를 미래로', !put(st, { bt: 1000, btq: T0 + 1, btm: 0 }, T0)); }

// ---- 앱 계산(btRankDoc과 같아요)
const BT_DAY = 86400000, BT_MS = 432000, BT_SLACK = 15000;
function client(dev, srv, now) {   // dev: { pts, lg, sbt, sbtq, sbtm }, srv: 서버 줄(리스너로 받은 내 줄)
  let prev = 0, q = null, m = 0;
  if (dev.sbt) { prev = dev.sbt; q = dev.sbtq; m = dev.sbtm || 0; }
  if (srv && srv.bt && (q == null || (typeof srv.btq === 'number' && srv.btq > q))) { prev = srv.bt; q = typeof srv.btq === 'number' ? srv.btq : null; m = Math.max(m, srv.btm || 0); }
  if (!prev) prev = 1000;
  const base = Math.max(q == null ? -Infinity : q, now - BT_DAY + BT_SLACK);
  const room = Math.max(0, Math.floor((now - BT_SLACK - base) / BT_MS));
  const bt = Math.max(1000, Math.min(dev.pts, prev + room)), d = Math.max(0, bt - prev);
  return { bt, btq: base + d * BT_MS, btm: Math.max(m, srv ? srv.btm || 0 : 0, Math.min(dev.lg, lgOf(bt))) };
}
// 기기에서 올리기: skew는 기기 추정 시각 - 서버 시각
function upload(st, dev, now, skew = 0) {
  const doc = client(dev, st.seen ? cur(st) : null, now + skew);
  const okw = put(st, doc, now);
  if (okw) { dev.sbt = doc.bt; dev.sbtq = doc.btq; dev.sbtm = doc.btm; }
  return okw;
}
const win = dev => { dev.pts = Math.min(9999, dev.pts + 40); dev.lg = Math.max(dev.lg, lgOf(dev.pts)); };
// ---- 정상 1: 하루 5판 모두 최대(+40) 이기고 판마다 올리기, 30일
{ const st = mk(null); st.seen = true; const dev = { pts: 1000, lg: 0 }; let denied = 0, lag = 0;
  for (let day = 0; day < 30; day++) for (let k = 0; k < 5; k++) { const now = T0 + day * BT_DAY + k * 3600e3; win(dev); if (!upload(st, dev, now)) denied++; lag = Math.max(lag, dev.pts - cur(st).bt); }
  // 다음 날 한 번 더 올리면 따라잡아요
  upload(st, dev, T0 + 30 * BT_DAY + 600e3);
  console.log(`정상 1: 30일 150판, 거절 ${denied}, 가장 많이 늦은 점수 ${lag}, 기기 ${dev.pts} 서버 ${cur(st).bt} 메달 ${cur(st).btm}/${dev.lg}`);
  ok('정상 1: 거절이 없어요', denied === 0);
  ok('정상 1: 다음 날 서버가 기기 점수를 따라잡아요', cur(st).bt === dev.pts);
  ok('정상 1: 메달이 기기와 같아요', cur(st).btm === dev.lg); }
// ---- 정상 2: 옛 줄(btq 없음, 2.2.0까지 올린 줄)에서 이어 올리기, 기기는 10초 먼저/늦게
for (const skew of [-10000, 10000]) {
  const st = mk(Object.assign({}, RANK, { at: T0 - 3 * BT_DAY, bt: 1500, btm: 2 })); st.seen = true;
  const dev = { pts: 1500, lg: 2 }; for (let i = 0; i < 5; i++) win(dev);
  const a = upload(st, dev, T0, skew);
  console.log(`정상 2 (기기 시각 ${skew / 1000}초): 옛 줄 1500 → ${cur(st).bt} (${a ? '받음' : '거절'})`);
  ok(`정상 2 (${skew}): 옛 줄에서 하루치(약 200, 시각 여유 15초만큼 덜) 올라가요`, a && cur(st).bt >= 1699); }
// ---- 정상 3: 오래 쉬었다가(기기에서 혼자 7일 동안 1,400점) 나눠 올리기
{ const st = mk(Object.assign({}, RANK, { at: T0 - 60000, bt: 1200, btq: T0 - 60000, btm: 1 })); st.seen = true;
  const dev = { pts: 2600, lg: 5, sbt: 1200, sbtq: T0 - 60000, sbtm: 1 }; let denied = 0, n = 0, now = T0 + 7 * BT_DAY;
  while (cur(st).bt < dev.pts && n < 200) { n++; if (!upload(st, dev, now)) denied++; now += 12 * 3600e3; }
  console.log(`정상 3: 1200 → ${cur(st).bt}, 올리기 ${n}번(12시간 간격), 거절 ${denied}`);
  ok('정상 3: 거절 없이 따라잡아요', denied === 0 && cur(st).bt === 2600 && cur(st).btm === 5); }
// ---- 정상 4: 두 기기(같은 계정) 번갈아. B는 A가 올린 줄을 리스너로 봐요
{ const st = mk(null); st.seen = true; const A = { pts: 1000, lg: 0 }, B = { pts: 1000, lg: 0 }; let denied = 0;
  for (let day = 0; day < 10; day++) for (let k = 0; k < 5; k++) { const now = T0 + day * BT_DAY + k * 3600e3, D = k % 2 ? A : B;
    D.pts = Math.max(A.pts, B.pts); win(D); if (!upload(st, D, now)) denied++; }
  // 리스너를 받기 전(서버 줄을 모르는 채 기기 기억만으로) 올리면 거절될 수 있지만 다음 번에 서버 줄로 맞춰요
  const C = { pts: 3000, lg: 5, sbt: 1000, sbtq: T0 - 1000, sbtm: 0 }; st.seen = false; const first = upload(st, C, T0 + 10 * BT_DAY + 10e3); st.seen = true; const second = upload(st, C, T0 + 10 * BT_DAY + 30e3);
  console.log(`정상 4: 두 기기 10일, 거절 ${denied}, 서버 ${cur(st).bt}. 오래된 기억 기기 첫 올리기 ${first ? '받음' : '거절'}, 줄을 본 뒤 ${second ? '받음' : '거절'}`);
  ok('정상 4: 두 기기 번갈아 올려도 거절이 없어요', denied === 0);
  ok('정상 4: 서버 줄을 본 뒤에는 받아요', second); }
// ---- 정상 5: 지면 점수가 내려가고 메달은 그대로
{ const st = mk(Object.assign({}, RANK, { at: T0 - 60000, bt: 1650, btq: T0 - 60000, btm: 3 })); st.seen = true;
  const dev = { pts: 1590, lg: 3, sbt: 1650, sbtq: T0 - 60000, sbtm: 3 };
  ok('정상 5: 지고 내려간 점수를 올려요', upload(st, dev, T0 + 1000) && cur(st).bt === 1590 && cur(st).btm === 3); }
fails.length && console.log(fails.join('\n'));
console.log(`rules_bt: ${pass} passed, ${fails.length} failed`);
console.log(fails.length ? 'FAIL' : 'PASS');
