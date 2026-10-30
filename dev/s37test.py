# 회귀 시험: 1.3.0에서 고친 '교감 선생님 도토리 지원' 오류가 다시 생기지 않는지 봐요.
# 검사 대상: needCost(), prepTopUp(), rate(), 메인 퀘스트 진행 조건과 보상(qReward)
# 쓰는 법: python3 wrap.py && python3 s37test.py   (마지막 줄이 "PASS"면 통과, 아니면 실패한 검사를 적고 끝 코드 1)
import asyncio, json, sys
from playwright.async_api import async_playwright
from s4test import URL

# 여러 시점의 학교를 만들어 놓고 모든 메인 퀘스트를 검사해요
STATES = {
    '유치원 처음': {},
    '유치원 1년째 4장 (1.3.0 버그가 난 곳)': {'f': {'classroom': 14, 'cafeteria': 11, 'library': 10, 'playground': 10}, 't': {'squirrel': 5, 'owl': 5, 'bear': 5}, 'students': 60, 'fuFull': True},
    '유치원 2년째': {'tg': 1, 'f': {'classroom': 18, 'cafeteria': 14, 'library': 13, 'playground': 14}, 't': {'squirrel': 8, 'owl': 5, 'bear': 7}, 'students': 80, 'fuFull': True},
    '초등학교 1학년': {'tier': 1, 'tg': 0, 'f': {'classroom': 8, 'cafeteria': 6, 'library': 6, 'playground': 6, 'science': 1}, 't': {'squirrel': 4, 'owl': 2, 'bear': 2}, 'students': 30, 'fuFull': True},
    '초등학교 4학년': {'tier': 1, 'tg': 3, 'f': {'classroom': 30, 'cafeteria': 26, 'library': 25, 'playground': 26, 'science': 15}, 't': {'squirrel': 20, 'owl': 5, 'bear': 18}, 'students': 120, 'fuFull': True},
    # 2.0.0 중학교
    '중학교 1학년': {'tier': 2, 'tg': 0, 'f': {'classroom': 8, 'cafeteria': 6, 'library': 6, 'playground': 6, 'science': 3, 'store': 3}, 't': {'squirrel': 8, 'owl': 5, 'bear': 5}, 'students': 30, 'fuFull': True},
    '중학교 3학년': {'tier': 2, 'tg': 2, 'f': {'classroom': 25, 'cafeteria': 18, 'library': 17, 'playground': 18, 'science': 11, 'store': 17}, 't': {'squirrel': 20, 'owl': 5, 'bear': 15}, 'students': 100, 'fuFull': True},
}
SETUP = r"""(st) => {
  const F = window.__forest, S = F.S;
  if (st.tier !== undefined) S.tier = st.tier;
  if (st.tg !== undefined) S.tg = st.tg;
  if (st.f) Object.assign(S.f, st.f);
  if (st.t) Object.assign(S.t, st.t);
  if (st.fuFull) for (const k in S.fu) S.fu[k] = S.fu[k].map(() => S.f[k]);
  if (st.students) S.students = st.students;
  S.budget = 0;
  return true;
}"""
CHECK = r"""() => {
  const F = window.__forest, S = F.S, bad = [], snap = () => JSON.stringify([S.f, S.t, S.fu, S.students, S.budget]);
  const r0 = F.rate();
  if (!(isFinite(r0) && r0 > 0)) bad.push('rate()가 유한한 양수가 아니에요: ' + r0);
  const before = snap();
  // prepTopUp 상한: 수업료 30분치 + 200만. 1.4.0(Issue #2)부터 올림해도 이 상한을 넘지 않아야 해요
  const cap = r0 * 60 * 30 + 2e6;
  const rows = [];
  for (const q of F.MAIN) {
    const c = F.needCost(q);
    if (!(isFinite(c) && c >= 0)) bad.push(`${q.id} needCost가 이상해요: ${c}`);
    if (c > 1e15 * Math.max(1, F.costScale() / 2000)) bad.push(`${q.id} needCost가 너무 커요: ${c}`);   // 2.0.0 중학교는 공사비 배수만큼 크게 봐요
    const rw = F.qReward ? F.qReward(q) : 0;
    if (!(isFinite(rw) && rw >= 0)) bad.push(`${q.id} 보상이 이상해요: ${rw}`);
    rows.push([q.id, Math.round(c)]);
  }
  if (snap() !== before) bad.push('needCost()가 학교 상태(시설, 선생님, 가구, 학생, 도토리)를 바꿔 놓았어요');
  // prepTopUp: 유치원에서만, 상한 안에서만
  const q0 = S.q.m, out = [];
  for (let m = 0; m < F.MAIN.length; m++) {
    S.q.m = m; S.budget = 0;
    const v = F.prepTopUp(true);
    if (!(isFinite(v) && v >= 0)) bad.push(`${F.MAIN[m].id} prepTopUp 값이 이상해요: ${v}`);
    if (v > cap * 1.0001 + 100) bad.push(`${F.MAIN[m].id} prepTopUp이 상한(${Math.round(cap)})을 넘었어요: ${v}`);
    if (S.tier > 0 && v > 0) bad.push(`${F.MAIN[m].id} 초등학교인데 교감 선생님 지원(${v})이 나왔어요`);
    if (Math.abs(S.budget - v) > 1e-6) bad.push(`${F.MAIN[m].id} prepTopUp이 돌려준 값과 실제로 더한 도토리가 달라요`);
    out.push(v);
  }
  S.q.m = q0; S.budget = 0;
  const r1 = F.rate();
  if (Math.abs(r1 - r0) > 1e-9 * Math.max(1, r0)) bad.push(`검사 뒤 rate()가 바뀌었어요: ${r0} → ${r1}`);
  return { bad, maxNeed: Math.max(...rows.map(r => r[1])), maxTop: Math.max(...out), rate: r0, prepPhase: F.prepPhase() };
}"""
# 1.3.0에서 터졌던 두 퀘스트: k5(학생 80명)는 1년째 최고 레벨로 못 이뤄서 지원 0, q18(1.3.0부터 초당 30)은 이룰 수 있으니 작고 유한해야 해요
FOCUS = r"""() => { const F = window.__forest; return ['q18', 'k5'].map(id => [id, F.needCost(F.MAIN.find(q => q.id === id))]); }"""
# 퀘스트를 따라 하는 사람처럼 유치원을 끝까지 해 보며 도토리가 폭발하지 않는지, 오래 막히지 않는지 봐요
FLOW = r"""() => {
  const F = window.__forest, S = () => F.S; let t = 0, maxB = 0, maxWait = 0, qid = '', qt = 0, pick = 0, tri = 0; const dt = 2, t0 = Date.now();
  const ev = n => Math.floor(t / n) !== Math.floor((t - dt) / n);   // 2.0.1: n초마다 한 번(다른 퀘스트의 pick 셈과 따로)
  const buy = () => { const r = F.recommend(); if (!r) return false;
    if (r.kind === 'tea') return S().budget >= F.teaCost(r.k) && F.teacherAct(r.k);
    if (r.kind === 'fur') return S().budget >= F.furCost(r.k, r.i) && F.buyFur(r.k, r.i, true);
    return S().budget >= F.facCost(r.k) && F.buyFacility(r.k); };
  while (t < 6 * 3600 && S().tier === 0) {
    F.rt.fakeNow = t0 + t * 1000; F.conTick();   // 2.1.0 공사 시간(유치원 5초)도 게임 시계로 끝나요
    const s = S(), cap = F.capacity(); if (s.students < cap) s.students = Math.min(cap, s.students + F.CFG.enroll * dt);
    const g = F.rate() * dt; s.budget += g; F.earn(g); t += dt;
    const q = F.curMain(), id = q ? q.id : '';
    if (id !== qid) { maxWait = Math.max(maxWait, t - qt); qid = id; qt = t; }
    for (let i = 0; i < 3 && F.mainReady(); i++) F.claimMain(null);
    if (F.canGraduate()) F.graduate(); else if (F.canPromote()) F.promote();
    if (q && q.t === 'picks') { pick += dt; if (pick >= 4) { pick = 0; s.st.picks += 1; } }
    // 1.8.0 숲속 합치기 안내 퀘스트: 사람이 2초에 한 번 생산기를 누르고 합치는 셈으로 쳐요 (에너지는 1분에 1 차요)
    if (q && q.t === 'mgBest') { pick += dt; if (pick >= 2) { pick = 0; s.mg.best.a = Math.min(10, (s.mg.best.a || 0) + 1); } }
    if (q && q.t === 'mgOrders') { pick += dt; if (pick >= 30) { pick = 0; s.mg.st.orders += 1; } }
    // 1.7.4 침입자 쫓아내기: 퀘스트가 되면 3초 뒤 매나 뱀이 오고 20초 안에 쫓아내요(놓쳐도 40초 안에 다시 와요). 8초에 한 번 쫓아낸 것으로 쳐요
    if (q && q.t === 'trials') { tri += dt; if (tri >= 8) { tri = 0; s.st.trials = (s.st.trials || 0) + 1; } }
    // 1.8.0 보강 퀘스트: 퍼즐 한 판은 1분에 한 번(정수 15), 영양 사서 교감 연수는 살 수 있으면 바로, 장식은 퍼즐로 정수를 모아 벤치를 사서 놓기, 업적은 받을 수 있으면 받기
    if (q && (q.t === 'pz' || q.t === 'deco')) { pick += dt; if (pick >= 60) { pick = 0; s.st.pz = (s.st.pz || 0) + 1; s.ess += 15; } }
    if (q && q.t === 'deco' && s.ess >= 60) { F.rt.decoPick = 'bench'; if (F.buyDeco()) for (let i = 0; i < 11; i++) if (F.decoPut(i, 'bench')) break; }
    if (q && q.t === 'xt' && s.budget >= F.xtCost(q.k)) F.xtAct(q.k);
    if (q && q.t === 'vp' && s.budget >= F.vpCost()) F.vpAct();
    if (q && (q.t === 'elects' || q.t === 'elMid')) { F.elSync(); F.elVote(0); }   // 2.0.1
    if (q && q.t === 'rdBooks' && ev(900)) s.rd.st += 1;   // 2.0.1 책 읽기: 15분 뒤 한 권
    if (q && q.t === 'labs' && s.f.science >= 1 && s.lab.day !== F.gameToday()) F.labRun(0, 2);   // 2.0.1 과학 실험: 하루 한 번
    if (q && q.t === 'acMax' && ev(60)) F.acGain('math', 20);   // 2.0.1 공부: 퍼즐 한 판(약 20 XP)을 1분에 한 번
    if (q && q.t === 'acBook' && ev(30)) { s.ess += 10; F.acBuyBook('kor'); }   // 문제집 한 권
    if (q && (q.t === 'vdGive' || q.t === 'vdLv') && F.vdOpen() && s.budget >= F.vdLeft()) F.vdGive('left');   // 2.1.2 마을 기부: 다음 단계까지 모이면 내요
    if (q && q.t === 'psGot' && F.psOpen()) { F.psSync(); if (F.psLv() < 1) s.ps.pts += F.PS.per; F.psClaimAll(true); }   // 2.1.3 숲속 패스: 미션을 한 셈 치고 1단계를 받아요
    if (q && (q.t === 'snDraw' || q.t === 'snDex') && F.snOpen() && s.budget >= F.snCost(false)) F.snDraw(false);   // 2.1.2 간식 뽑기: 30분치가 모이면 한 번씩
    if (q && (q.t === 'gdHarvest' || q.t === 'gdCook') && F.gdOpen()) { F.gdSync(); s.gd.plots.forEach((p, i) => { if (!p.c) F.gdPlant(i, 'lettuce'); else F.gdHarvest(i); }); if (q.t === 'gdCook') F.GD_MENU.some(m => F.gdCook(m.id)); }   // 2.2.0 텃밭
    if (q && (q.t === 'bxSeen' || q.t === 'bxKinds') && F.bxOpen()) { F.bxSync(); if (s.bx.sp.length) F.bxTap(s.bx.sp[0].i); }   // 2.2.0 생물 탐사
    if (q && (q.t === 'cgPrac' || q.t === 'cgShow') && F.cgOpen()) { F.cgSync(true); if (q.t === 'cgPrac') F.cgPractice(); else if (F.showReady()) { const c = F.CLUBS.findIndex((_, i) => F.clubMembers(i).length); if (c >= 0) F.clubShowGo(c); } }   // 2.2.0 동아리 대항전
    if (q && (q.t === 'btPlays' || q.t === 'btMid') && ev(120)) { s.bt.st.w += 1; s.bt.st.wm += F.S.tier >= 2 ? 1 : 0; }   // 2.0.1 숲속 대결: 2분에 한 판 이김
    if (q && q.t === 'btLg' && ev(600)) s.bt.lg = Math.max(s.bt.lg, 1);   // 동 리그: 이긴 판 넷쯤
    if (q && q.t === 'ach') { F.achSync(); const a = F.ACH.find(x => (s.ach.got[x.id] || 0) < (s.ach.hit[x.id] || 0)); if (a) F.claimAch(a.id); }
    if (q && q.t === 'perks') { const k = Object.keys(F.PERKS).filter(x => !F.perkMaxed(x)).sort((a, b) => F.perkCost(a) - F.perkCost(b))[0]; if (k && F.perkCost(k) <= s.p.dip) F.buyPerk(k, document.body); }
    for (let i = 0; i < 20; i++) if (!buy()) break;
    maxB = Math.max(maxB, S().budget);
  }
  return { min: +(t / 60).toFixed(1), tier: S().tier, maxBudget: maxB, maxWaitMin: +(maxWait / 60).toFixed(1), q: qid };
}"""

# 2.0.0 중학교 따라 하기: 초등학교 6학년 끝(졸업식 퀘스트)에서 졸업식을 열고 중학교 장 끝까지 해 봐요.
# 게임 시계(rt.fakeNow)도 흘려서 동아리 발표회(하루 한 번)와 주간 성장이 실제처럼 돌아가요. 동아리는 자동 추천으로 나눠요
FLOW2 = r"""() => {
  const F = window.__forest, S = () => F.S; let t = 0, maxB = 0, maxWait = 0, qid = '', qt = 0, pick = 0, tri = 0, waitAt = '', tripEnd = 0; const dt = 10, t0 = Date.now();
  const ev = n => Math.floor(t / n) !== Math.floor((t - dt) / n);   // 2.0.1: n초마다 한 번(다른 퀘스트의 pick 셈과 따로)
  const s0 = S(); s0.tier = 1; s0.tg = 5; s0.p.species = 6; Object.assign(s0.f, { classroom: 38, cafeteria: 30, library: 28, playground: 28, science: 18 });
  s0.sem = 1;   // 2.1.0 졸업식은 6학년 2학기에
  for (const k in s0.fu) s0.fu[k] = s0.fu[k].map(() => s0.f[k]); s0.students = 158; s0.tdip = 250; s0.grade = 4; s0.best = 4;
  s0.q.m = F.MAIN.findIndex(q => q.id === 'e39'); s0.q.lat = ''; F.checkGrade();
  if (!F.canPromote()) return { err: '졸업식을 열 수 없어요' };
  F.promote(); F.rt.modalQueue.length = 0; F.rt.modalOpen = null;
  // 사람처럼: 추천을 사고, 추천이 비싸면 가장 싼 것을 사요. 장학재단은 기금이 되는 만큼 고쳐요
  const buy = () => { const r = F.recommend(); let ok = false;
    if (r) { if (r.kind === 'tea') ok = S().budget >= F.teaCost(r.k) && F.teacherAct(r.k);
      else if (r.kind === 'fur') ok = S().budget >= F.furCost(r.k, r.i) && F.buyFur(r.k, r.i, true);
      else ok = S().budget >= F.facCost(r.k) && F.buyFacility(r.k); }
    if (ok) return true;
    const c = [];
    for (const k of F.facKeys()) { if (F.conOn(k)) continue; if (F.furReady(k)) c.push([F.facCost(k), () => F.buyFacility(k)]); else F.FUR[k].forEach((_, j) => { if (!F.furDone(k, j)) c.push([F.furCost(k, j), () => F.buyFur(k, j, true)]); }); }
    for (const k of Object.keys(F.TEA)) if (!F.teaMaxed(k)) c.push([F.teaCost(k), () => F.teacherAct(k)]);
    c.sort((a, b) => a[0] - b[0]);
    return !!c.length && c[0][0] <= S().budget && c[0][1](); };
  for (let i = 0; i < 40; i++) { const ks = Object.keys(F.FPERKS).sort((a, b) => F.fpCost(a) - F.fpCost(b)); if (F.fpCost(ks[0]) > S().fund) break; F.buyFundPerk(ks[0], document.body); }
  // 2.1.0: 공사가 끝나기를 기다리는 동안 도토리가 더 쌓이고 한 퀘스트가 길어져서 기준을 넓혔어요(막힘 2,000분, 도토리 1e17 = 중학교 공사비 배수 5억 × 2억)
  while (t < 120 * 3600 && F.curMain()) {   // 2.1.0 공사 시간과 두 학기로 중학교가 길어졌어요(자동 플레이 약 78시간)
    const s = S(); F.rt.fakeNow = t0 + t * 1000; F.conTick();
    const cap = F.capacity(); if (s.students < cap) s.students = Math.min(cap, s.students + F.CFG.enroll * dt);
    const g = F.rate() * dt; s.budget += g; F.earn(g); t += dt;
    const q = F.curMain(), id = q ? q.id : '';
    if (id !== qid) { if (t - qt > maxWait) { maxWait = t - qt; waitAt = qid; } qid = id; qt = t; }
    pick += dt; if (pick >= 15) { pick = 0; s.st.picks += 1; }
    if (q && q.t === 'trials') { tri += dt; if (tri >= 8) { tri = 0; s.st.trials = (s.st.trials || 0) + 1; } }
    if (q && q.t === 'fest') s.fest.n[q.k] = (s.fest.n[q.k] || 0) + 1;
    if (q && q.t === 'sports') s.st.sports += 1;
    if (q && q.t === 'club') F.clubAuto(true);
    if (q && q.t === 'clubMat' && !s.roster.list.some(x => x.c === 4)) { const k = s.roster.list.slice().sort((a, b) => b.a[4] - a.a[4])[0]; if (k) k.c = 4; }   // 2.0.1 수학부 꾸리기: 사람처럼 수학 별이 많은 친구를 직접 넣어요
    if (q && (q.t === 'elects' || q.t === 'elMid')) { F.elSync(); F.elVote(0); }   // 2.0.1 반장 선거 안내 퀘스트: 첫 후보를 뽑아요
    if (q && q.t === 'rdBooks' && ev(900)) s.rd.st += 1;   // 2.0.1 책 읽기: 15분 뒤 한 권
    if (q && q.t === 'labs' && s.f.science >= 1 && s.lab.day !== F.gameToday()) F.labRun(0, 2);   // 2.0.1 과학 실험: 하루 한 번
    if (q && q.t === 'acMax' && ev(60)) F.acGain('math', 20);   // 2.0.1 공부: 퍼즐 한 판(약 20 XP)을 1분에 한 번
    if (q && q.t === 'acBook' && ev(30)) { s.ess += 10; F.acBuyBook('kor'); }   // 문제집 한 권
    if (q && (q.t === 'vdGive' || q.t === 'vdLv') && F.vdOpen() && s.budget >= F.vdLeft()) F.vdGive('left');   // 2.1.2 마을 기부: 다음 단계까지 모이면 내요
    if (q && q.t === 'psGot' && F.psOpen()) { F.psSync(); if (F.psLv() < 1) s.ps.pts += F.PS.per; F.psClaimAll(true); }   // 2.1.3 숲속 패스: 미션을 한 셈 치고 1단계를 받아요
    if (q && (q.t === 'snDraw' || q.t === 'snDex') && F.snOpen() && s.budget >= F.snCost(false)) F.snDraw(false);   // 2.1.2 간식 뽑기: 30분치가 모이면 한 번씩
    if (q && (q.t === 'gdHarvest' || q.t === 'gdCook') && F.gdOpen()) { F.gdSync(); s.gd.plots.forEach((p, i) => { if (!p.c) F.gdPlant(i, 'lettuce'); else F.gdHarvest(i); }); if (q.t === 'gdCook') F.GD_MENU.some(m => F.gdCook(m.id)); }   // 2.2.0 텃밭
    if (q && (q.t === 'bxSeen' || q.t === 'bxKinds') && F.bxOpen()) { F.bxSync(); if (s.bx.sp.length) F.bxTap(s.bx.sp[0].i); }   // 2.2.0 생물 탐사
    if (q && (q.t === 'cgPrac' || q.t === 'cgShow') && F.cgOpen()) { F.cgSync(true); if (q.t === 'cgPrac') F.cgPractice(); else if (F.showReady()) { const c = F.CLUBS.findIndex((_, i) => F.clubMembers(i).length); if (c >= 0) F.clubShowGo(c); } }   // 2.2.0 동아리 대항전
    if (q && (q.t === 'btPlays' || q.t === 'btMid') && ev(120)) { s.bt.st.w += 1; s.bt.st.wm += F.S.tier >= 2 ? 1 : 0; }   // 2.0.1 숲속 대결: 2분에 한 판 이김
    if (q && q.t === 'btLg' && ev(600)) s.bt.lg = Math.min(q.n, s.bt.lg + 1);   // 2.1.0 학기 숙제 리그: 10분에 한 리그씩(사람은 며칠)
    if (q && q.t === 'btWins' && ev(120)) s.bt.st.w += 1;   // 2.1.0 학기 숙제: 2분에 한 판 이김
    if (q && q.t === 'acSum' && ev(60)) F.acGain(F.AC.keys[Math.floor(t / 60) % 5], 20);   // 2.1.0 학기 숙제: 과목을 돌아가며 공부
    if (s.roster.list.some(x => x.c >= 0) && F.showReady()) { const c = [0, 1, 2, 3].find(c => !s.club.shown[c]); F.clubShowGo(c === undefined ? 0 : c); }
    F.clubWeekTick();
    // 현장체험학습: 갈 수 있는 곳 중 아직 기념품이 남은 가장 짧은 곳(다녀오면 수업료의 절반만큼 더 받아요)
    if (!s.trip.cur) { const ok = F.TRIPS.filter(D => s.st.trips >= D.need); const D = ok.filter(x => x.souv.some((_, i) => !s.trip.souv.includes(x.id + ':' + i))).sort((a, b) => a.min - b.min)[0] || ok[0]; if (D) { s.trip.open = true; F.startTrip(D.id); tripEnd = t + D.min * 60; } }
    else if (t >= tripEnd) { s.trip.end = Date.now() - 1; F.claimTrip(1); }
    for (let i = 0; i < 40; i++) { const k = Object.keys(F.PERKS).filter(x => !F.perkMaxed(x)).sort((a, b) => F.perkCost(a) - F.perkCost(b))[0]; if (!k || F.perkCost(k) > s.p.dip) break; F.buyPerk(k, document.body); }
    for (let i = 0; i < 5 && F.mainReady(); i++) F.claimMain(null);
    if (F.canGraduate()) F.graduate();
    for (let i = 0; i < 20; i++) if (!buy()) break;
    F.rt.modalQueue.length = 0; F.rt.modalOpen = null;
    maxB = Math.max(maxB, S().budget);
    if (!isFinite(S().budget) || !isFinite(F.rate())) return { err: '유한하지 않은 값', q: qid };
  }
  return { h: +(t / 3600).toFixed(1), tier: S().tier, tg: S().tg, maxBudget: maxB, maxWaitMin: +(maxWait / 60).toFixed(1), waitAt, q: (F.curMain() || {}).id || '끝', roster: S().roster.list.length, club: F.clubSum() };
}"""

async def main():
    fails, report = [], {}
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for name, st in STATES.items():
            ctx = await b.new_context()
            await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(1500)
            await pg.evaluate("window.__forest.rt.paused = true")   # 시험하는 동안 게임 시간이 흐르지 않게
            await pg.evaluate(SETUP, st)
            r = await pg.evaluate(CHECK)
            if name.startswith('유치원 1년째 4장'):
                r['focus'] = await pg.evaluate(FOCUS)
                for qid, c in r['focus']:
                    if qid == 'k5' and c != 0: fails.append(f'[{name}] {qid} 지원 계산이 0이어야 하는데 {c}')
                    if qid == 'q18' and not (0 <= c < 1e8): fails.append(f'[{name}] {qid} 지원 계산이 너무 커요: {c}')
            fails += [f'[{name}] {x}' for x in r['bad']] + [f'[{name}] 페이지 오류: {e}' for e in errs]
            del r['bad']; report[name] = r
            await ctx.close()
        ctx = await b.new_context()
        await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        await pg.evaluate("const t=document.querySelector('#tut'); if(t && !t.hidden){ window.__forest.S.tut.st='skip'; t.hidden=true; window.__forest.rt.modalOpen=null; }")
        f = await pg.evaluate(FLOW); report['유치원 따라 하기'] = f
        if f['tier'] < 1: fails.append(f'유치원을 6시간 안에 졸업하지 못했어요 (멈춘 퀘스트 {f["q"]})')
        if f['maxBudget'] > 1e9: fails.append(f'유치원에서 도토리가 {f["maxBudget"]:.3g}개까지 쌓였어요 (지원 폭발 의심)')
        if f['maxWaitMin'] > 30: fails.append(f'유치원에서 한 퀘스트에 {f["maxWaitMin"]}분 넘게 막혔어요')
        fails += [f'[따라 하기] 페이지 오류: {e}' for e in errs]
        # 2.0.0 중학교 따라 하기
        ctx = await b.new_context()
        await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        await pg.evaluate("const t=document.querySelector('#tut'); if(t && !t.hidden){ window.__forest.S.tut.st='skip'; t.hidden=true; window.__forest.rt.modalOpen=null; }")
        f2 = await pg.evaluate(FLOW2); report['중학교 따라 하기'] = f2
        if f2.get('err'): fails.append(f'중학교 따라 하기: {f2["err"]}')
        elif f2['q'] != '끝': fails.append(f'중학교 장을 120시간 안에 끝내지 못했어요 (멈춘 퀘스트 {f2["q"]})')
        else:
            if f2['maxWaitMin'] > 2000: fails.append(f'중학교에서 한 퀘스트({f2["waitAt"]})에 {f2["maxWaitMin"]}분 넘게 막혔어요')
            if f2['maxBudget'] > 1e17: fails.append(f'중학교에서 도토리가 {f2["maxBudget"]:.3g}개까지 쌓였어요')
            if f2['roster'] < 12: fails.append(f'중학교 명부가 {f2["roster"]}명이에요')
        fails += [f'[중학교 따라 하기] 페이지 오류: {e}' for e in errs]
        await b.close()
    print(json.dumps(report, ensure_ascii=False, indent=1))
    if fails:
        print('FAIL'); [print(' -', x) for x in fails]; sys.exit(1)
    print('PASS')
asyncio.run(main())
