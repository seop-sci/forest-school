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
    if (c > 1e15) bad.push(`${q.id} needCost가 너무 커요: ${c}`);
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
  const F = window.__forest, S = () => F.S; let t = 0, maxB = 0, maxWait = 0, qid = '', qt = 0, pick = 0, tri = 0; const dt = 2;
  const buy = () => { const r = F.recommend(); if (!r) return false;
    if (r.kind === 'tea') return S().budget >= F.teaCost(r.k) && F.teacherAct(r.k);
    if (r.kind === 'fur') return S().budget >= F.furCost(r.k, r.i) && F.buyFur(r.k, r.i, true);
    return S().budget >= F.facCost(r.k) && F.buyFacility(r.k); };
  while (t < 6 * 3600 && S().tier === 0) {
    const s = S(), cap = F.capacity(); if (s.students < cap) s.students = Math.min(cap, s.students + F.CFG.enroll * dt);
    const g = F.rate() * dt; s.budget += g; F.earn(g); t += dt;
    const q = F.curMain(), id = q ? q.id : '';
    if (id !== qid) { maxWait = Math.max(maxWait, t - qt); qid = id; qt = t; }
    for (let i = 0; i < 3 && F.mainReady(); i++) F.claimMain(null);
    if (F.canGraduate()) F.graduate(); else if (F.canPromote()) F.promote();
    if (q && q.t === 'picks') { pick += dt; if (pick >= 4) { pick = 0; s.st.picks += 1; } }
    // 1.7.4 침입자 쫓아내기: 퀘스트가 되면 3초 뒤 매나 뱀이 오고 20초 안에 쫓아내요(놓쳐도 40초 안에 다시 와요). 8초에 한 번 쫓아낸 것으로 쳐요
    if (q && q.t === 'trials') { tri += dt; if (tri >= 8) { tri = 0; s.st.trials = (s.st.trials || 0) + 1; } }
    if (q && q.t === 'perks') { const k = Object.keys(F.PERKS).filter(x => !F.perkMaxed(x)).sort((a, b) => F.perkCost(a) - F.perkCost(b))[0]; if (k && F.perkCost(k) <= s.p.dip) F.buyPerk(k, document.body); }
    for (let i = 0; i < 20; i++) if (!buy()) break;
    maxB = Math.max(maxB, S().budget);
  }
  return { min: +(t / 60).toFixed(1), tier: S().tier, maxBudget: maxB, maxWaitMin: +(maxWait / 60).toFixed(1), q: qid };
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
        await b.close()
    print(json.dumps(report, ensure_ascii=False, indent=1))
    if fails:
        print('FAIL'); [print(' -', x) for x in fails]; sys.exit(1)
    print('PASS')
asyncio.run(main())
