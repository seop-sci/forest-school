# 2.0.0 균형 자동 플레이: 새 학교에서 시작해 유치원, 초등학교, 중학교를 끝까지 해 봐요.
# 사람처럼 메인 퀘스트를 따라 가장 싼 것부터 사고, 대도시가 되면 명예 교장실을 고치고 종업식과 졸업식을 열어요.
# 게임 시계(rt.fakeNow)도 흉내 낸 시간만큼 흘려서 동아리 주간 성장과 발표회가 실제처럼 돌아가요. 황금 도토리와 광고는 쓰지 않아요.
# 쓰는 법: python3 wrap.py && python3 bal200.py [이름] [설정 JSON]
#   설정 예: '{"club": false}' 동아리를 나누지 않아요, '{"store": 0}' 매점 효과 0, '{"newc": false}' 2.0.0 새 전학생 6종을 빼요
# 결과: 해마다 걸린 시간(분), 퀘스트마다 걸린 시간, 수업료 배수. dev/bal200_<이름>.json에도 적어요
import asyncio, json, sys, time
from playwright.async_api import async_playwright
from s4test import URL

BOT = r"""(o) => {
  const F = window.__forest, cfg = o.cfg || {};
  const W = window.__bal = window.__bal || { t: 0, yearT: 0, years: [], quests: [], qid: '', qt: 0, pickT: 0, triT: 0, done: false, t0: Date.now(), maxB: 0, maxRate: 0, notes: [] };
  const S = () => F.S, dt = 10, end = W.t + o.hours * 3600, wall = performance.now();
  if (W.t === 0) {
    if (cfg.store !== undefined) F.FAC.store.per = cfg.store;
    if (cfg.newc === false) F.NEWCOMERS.splice(6);
    if (cfg.clubPer !== undefined) F.CLUB.per = cfg.clubPer;
    if (cfg.showDays !== undefined) F.CLUB.showDays = cfg.showDays;
    if (cfg.storeCost !== undefined) { const b = cfg.storeCost; F.FAC.store.cost = L => b * Math.pow(1.8, L); }
    if (cfg.cost2 !== undefined) F.TIER_SCALE.cost[2] = cfg.cost2;
    if (cfg.inc2 !== undefined) F.TIER_SCALE.inc[2] = cfg.inc2;
    if (cfg.fundOff) W.fundOff = true;
  }
  const now = () => W.t0 + W.t * 1000;
  const buy = () => { for (let i = 0; i < 60; i++) {
      const r = F.recommend(); let ok = false;
      if (r) { if (r.kind === 'tea') ok = S().budget >= F.teaCost(r.k) && F.teacherAct(r.k);
        else if (r.kind === 'fur') ok = S().budget >= F.furCost(r.k, r.i) && F.buyFur(r.k, r.i, true);
        else ok = S().budget >= F.facCost(r.k) && F.buyFacility(r.k); }
      if (!ok) { // 추천이 못 사면 가장 싼 것
        const c = [];
        for (const k of F.facKeys()) { if (F.furReady(k)) c.push([F.facCost(k), () => F.buyFacility(k)]); else F.FUR[k].forEach((_, j) => { if (!F.furDone(k, j)) c.push([F.furCost(k, j), () => F.buyFur(k, j, true)]); }); }
        for (const k of Object.keys(F.TEA)) if (!F.teaMaxed(k)) c.push([F.teaCost(k), () => F.teacherAct(k)]);
        c.sort((a, b) => a[0] - b[0]);
        if (!c.length || c[0][0] > S().budget) return; if (!c[0][1]()) return;
      }
  } };
  const perks = () => { for (let i = 0; i < 40; i++) { const ks = Object.keys(F.PERKS).filter(k => !F.perkMaxed(k)).sort((a, b) => F.perkCost(a) - F.perkCost(b)); if (!ks.length || F.perkCost(ks[0]) > S().p.dip) return; F.buyPerk(ks[0], document.body); } };
  const fperks = () => { for (let i = 0; i < 40; i++) { const ks = Object.keys(F.FPERKS).sort((a, b) => F.fpCost(a) - F.fpCost(b)); if (F.fpCost(ks[0]) > S().fund) return; F.buyFundPerk(ks[0], document.body); } };
  const yearSnap = what => { const s = S(); W.years.push({ what, tier: s.tier, tg: s.tg, min: Math.round(W.yearT / 60), totalH: +(W.t / 3600).toFixed(1), f: Object.assign({}, s.f), t: Object.assign({}, s.t), students: Math.floor(s.students),
      rate: +F.rate().toPrecision(3), store: (s.f.store || 0) * F.FAC.store.per, club: F.clubSum ? F.clubSum() : 0, clubT: +(F.clubTuitionMult() - 1).toFixed(2), species: s.p.species, fund: s.fund, fp: Object.assign({}, s.fp), perk: Object.assign({}, s.p.perk), dips: Math.round(s.st.dips), tdip: Math.round(s.tdip), mult: { legacy: +F.legacyMult().toPrecision(3), tuition: +F.tuitionMult().toPrecision(3) }, q: (F.curMain() || {}).id || 'end', budget: +s.budget.toPrecision(3) }); W.yearT = 0; };
  while (W.t < end && performance.now() - wall < 18000) {
    const s = S(); F.rt.fakeNow = now();
    const cap = F.capacity(); if (s.students < cap) s.students = Math.min(cap, s.students + F.CFG.enroll * dt);
    const g = F.rate() * dt; s.budget += g; F.earn(g); W.t += dt; W.yearT += dt;
    if (!isFinite(s.budget) || !isFinite(F.rate())) { W.notes.push('유한하지 않은 값 ' + W.t); W.done = true; break; }
    W.maxB = Math.max(W.maxB, s.budget); W.maxRate = Math.max(W.maxRate, F.rate());
    const q = F.curMain(), id = q ? q.id : 'end';
    if (id !== W.qid) { if (W.qid) W.quests.push([W.qid, Math.round((W.t - W.qt) / 60), s.tier, s.tg]); W.qid = id; W.qt = W.t; }
    // 줍기 15초에 하나, 침입자 8초에 한 번(퀘스트일 때), 행사와 운동회는 퀘스트일 때 바로 한 번
    W.pickT += dt; if (W.pickT >= 15) { W.pickT = 0; s.st.picks += 1; }
    if (q && q.t === 'trials') { W.triT += dt; if (W.triT >= 8) { W.triT = 0; s.st.trials = (s.st.trials || 0) + 1; } }
    if (q && q.t === 'fest') s.fest.n[q.k] = (s.fest.n[q.k] || 0) + 1;
    if (q && q.t === 'sports') s.st.sports += 1;
    if (q && q.t === 'mgBest') s.mg.best.a = Math.min(10, (s.mg.best.a || 0) + 1);
    if (q && q.t === 'mgOrders') s.mg.st.orders += 1;
    // 현장체험학습(bot.py와 같아요)
    if (s.trip && (s.trip.open || (s.tier >= 1 && s.tg >= 2) || s.tier >= 2)) {
      if (!s.trip.cur) {
        const ok = F.TRIPS.filter(D => s.st.trips >= D.need);
        let D = q && q.t === 'tripat' ? ok.find(x => x.id === q.k) : null;
        if (!D) D = ok.filter(x => x.souv.some((_, i) => !s.trip.souv.includes(x.id + ':' + i))).sort((a, b) => a.min - b.min)[0] || ok[0];
        if (D) { s.trip.open = true; F.startTrip(D.id); W.tripEnd = W.t + D.min * 60; }
      } else if (W.t >= W.tripEnd) { s.trip.end = Date.now() - 1; F.claimTrip(1); }
    }
    // 2.0.0 동아리: 나누기(자동 추천)는 퀘스트가 오면, 그 뒤로는 하루에 한 번 다시 추천. 발표회는 열 수 있을 때(아직 안 선 동아리 먼저)
    if (s.tier >= 2 && cfg.club !== false) {
      F.rosterEnsure();
      if ((q && q.t === 'club') || (s.roster.list.some(x => x.c >= 0) && W.t - (W.autoT || 0) > 86400)) { F.clubAuto(true); W.autoT = W.t; }
      if (F.showReady() && s.roster.list.some(x => x.c >= 0)) { const c = [0, 1, 2, 3].filter(c => !s.club.shown[c])[0]; F.clubShowGo(c === undefined ? 0 : c); }
      F.clubWeekTick();
    }
    buy(); perks();
    for (let i = 0; i < 5 && F.mainReady(); i++) F.claimMain(null);
    if (F.canGraduate()) { yearSnap('종업식'); perks(); F.graduate(); fperks(); buy(); }
    else if (F.canPromote()) { yearSnap('졸업식'); F.promote(); if (!W.fundOff) fperks(); buy(); yearSnap('입학 직후'); }
    else if (s.tier === 2 && s.tg >= 2 && !F.curMain()) { yearSnap('중학교 끝'); W.done = true; break; }
    F.rt.modalQueue.length = 0; F.rt.modalOpen = null;
    if (s.tier === 2 && s.tg >= 3) { W.years[W.years.length - 1].what = '중학교 3학년 끝'; W.done = true; break; }
    if (W.t > (o.maxH || 400) * 3600) { yearSnap('시간 끝'); W.done = true; break; }
  }
  const s = S();
  return { done: W.done, h: +(W.t / 3600).toFixed(1), tier: s.tier, tg: s.tg, grade: s.grade, q: (F.curMain() || {}).id, rate: +F.rate().toPrecision(3), budget: +s.budget.toPrecision(3), years: W.years.length };
}"""

async def main():
    name = sys.argv[1] if len(sys.argv) > 1 else 'base'
    cfg = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 390, 'height': 800})
        await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        await pg.evaluate("const t=document.querySelector('#tut'); if(t && !t.hidden){ window.__forest.S.tut.st='skip'; t.hidden=true; window.__forest.rt.modalOpen=null; }")
        t0 = time.time()
        while True:
            r = await pg.evaluate(BOT, {'hours': 2, 'cfg': cfg, 'maxH': 600})
            print(json.dumps(r, ensure_ascii=False), flush=True)
            if r['done']: break
        out = await pg.evaluate("({ years: window.__bal.years, quests: window.__bal.quests, maxB: window.__bal.maxB, maxRate: window.__bal.maxRate, notes: window.__bal.notes })")
        out['errs'] = errs[:5]; out['wall'] = round(time.time() - t0)
        open(f'bal200_{name}.json', 'w').write(json.dumps(out, ensure_ascii=False, indent=1))
        for y in out['years']: print(json.dumps(y, ensure_ascii=False))
        print('errs', errs[:3])
        await b.close()
asyncio.run(main())
