// 보안 점검 검증(2026-10-28): database.rules.json을 targaryen 규칙 시뮬레이터로 돌려 문서 2-1, 2-2, 2-3, 2-4, 2-11이 실제로 통과하는 값인지 봐요
// 이 시험은 "고친 뒤 바른 동작"을 기대값으로 적었어요. 지금 규칙에서 FAIL이 나오면 문서의 문제가 재현된 거예요.
// 쓰는 법: NODE_PATH=<targaryen이 깔린 node_modules> node dev/fbtest/rules_sec.js database.rules.json
const targaryen = require('targaryen');
const path = require('path');
const rules = require(path.resolve(process.argv[2]));
const NOW = Date.now();
const RANK = (o) => Object.assign({ name: '교장', score: 100, at: NOW - 3600e3, tier: 1, year: 1, test: false, pid: 'VICTIM01', week: 42, lp: 300, ws: 42000300 }, o);
const STAT = { seen: 1, pid: 'VICTIM01' };
const mk = (withKey) => ({ forest: { rank: { V: RANK({}) }, stats: { V: STAT }, admins: {}, ...(withKey ? { adminKey: 'k9!Qz' } : {}) } });
const db = (withKey = true) => targaryen.database(rules, mk(withKey));
let fail = 0;
const out = (name, got, want, note) => { const ok = got === want; if (!ok) fail++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: 실제 ${got}, 바른 값 ${want}${note ? '  (' + note + ')' : ''}`); };
const as = (d, uid) => d.as({ uid, provider: 'anonymous' });

// 2-1 adminKey가 없을 때
{
  const d = db(false);
  out('2-1 adminKey 없음, 남(X)이 stats 전체 읽기', as(d, 'X').read('/forest/stats', { now: NOW }).allowed, false);
  out('2-1 adminKey 없음, 남(X)이 V의 stats 지우기', as(d, 'X').write('/forest/stats/V', null, { now: NOW }).allowed, false);
  const k = db(true);
  out('2-1 adminKey 있음, X가 stats 읽기', as(k, 'X').read('/forest/stats', { now: NOW }).allowed, false);
  out('2-1 adminKey 있음, 틀린 키로 admins/X 쓰기', as(k, 'X').write('/forest/admins/X', '0000', { now: NOW }).allowed, false);
  // 맞는 키를 맞히면 관리자가 돼요(틀린 시도에 횟수 제한은 규칙에 없어요)
  const r = as(k, 'X').write('/forest/admins/X', 'k9!Qz', { now: NOW });
  out('2-1 맞힌 키로 admins/X 쓰기(관리자 되기)', r.allowed, true, '정상 경로');
}

// 2-2 랭킹 점수: 처음 5만, 그 뒤 0.1초마다 +2000
{
  let d = db(true), t = NOW, score = 50000;
  let r = as(d, 'A').write('/forest/rank/A', RANK({ score, at: t, pid: 'ATTACK01' }), { now: t });
  out('2-2 처음 쓰기 5만', r.allowed, true, '규칙상 허용(정상)');
  d = r.newDatabase;
  let ok = 0;
  for (let i = 0; i < 10; i++) {   // 1초 동안 10번
    t += 100; score += 2000;
    r = as(d, 'A').write('/forest/rank/A', RANK({ score, at: t, pid: 'ATTACK01' }), { now: t });
    if (r.allowed) { ok++; d = r.newDatabase; } else break;
  }
  console.log(`     2-2 1초 동안 0.1초마다 +2000: ${ok}/10번 통과, 점수 50,000 -> ${score.toLocaleString()} (1초 사이 +${(score - 50000).toLocaleString()})`);
  out('2-2 0.1초 뒤 +2000 쓰기가 막혀야 해요', ok === 0, true);
  const big = as(db(true), 'B').write('/forest/rank/B', RANK({ score: 50001, at: NOW, pid: 'ATTACK02' }), { now: NOW }).allowed;
  out('2-2 처음 쓰기 50,001은 막힘', big, false, '정상');
}

// 2-3 남의 pid로 쓰기
{
  const r = as(db(true), 'A').write('/forest/rank/A', RANK({ score: 10, at: NOW, pid: 'VICTIM01' }), { now: NOW });
  out('2-3 남(V)의 pid VICTIM01로 내 행 쓰기', r.allowed, false);
}

// 2-4 week 9999
{
  const r = as(db(true), 'A').write('/forest/rank/A', RANK({ score: 0, at: NOW, pid: 'ATTACK03', week: 9999, lp: 1000, ws: 9999 * 1e6 + 1000 }), { now: NOW });
  out('2-4 week 9999, lp 1000, ws 9,999,001,000 쓰기', r.allowed, false);
  let d = db(true), t = NOW, lp = 0, n = 0;
  for (let i = 0; i < 2000 && lp < 999999; i++) {
    t += 100; const nlp = Math.min(999999, lp + 1000);
    const w = as(d, 'A').write('/forest/rank/A', RANK({ score: 0, at: t, pid: 'ATTACK03', week: 9999, lp: nlp, ws: 9999 * 1e6 + nlp }), { now: t });
    if (!w.allowed) break; d = w.newDatabase; lp = nlp; n++;
  }
  console.log(`     2-4 0.1초마다 lp +1000: ${n}번(${(n / 10).toFixed(1)}초) 만에 lp ${lp.toLocaleString()}`);
}

// 2-11 stats에 아무 필드나 크게
{
  const r = as(db(true), 'A').write('/forest/stats/A', { seen: 1, pid: 'ATTACK01', junk: 'x'.repeat(500000) }, { now: NOW });
  out('2-11 stats/A에 500KB 필드 junk 쓰기', r.allowed, false);
}
console.log(fail ? `FAIL ${fail}개` : 'PASS');
