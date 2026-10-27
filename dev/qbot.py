# 퀘스트를 따라 하는 사람처럼 자동 플레이: 메인 퀘스트마다 걸린 시간을 재서 어디서 막히는지 봐요
# 쓰는 법: python3 qbot.py [최대 시간(시)]  → 퀘스트마다 시작 시각(분)과 걸린 분, 마지막에 학교급과 학년을 적어요
import asyncio, json, sys
from playwright.async_api import async_playwright
from s4test import URL
MAXH = float(sys.argv[1]) if len(sys.argv) > 1 else 3
JS = r"""(maxH) => {
  const F = window.__forest, S = () => F.S;
  const W = window.__qb = window.__qb || { t: 0, out: [], qid: '', qt: 0, pick: 0, done: false, buys: 0, qb: 0 };
  const dt = 2, end = W.t + 1800, t0 = performance.now();
  const step = () => { const s = S(); const cap = F.capacity(); if (s.students < cap) s.students = Math.min(cap, s.students + F.CFG.enroll * dt); const g = F.rate() * dt; s.budget += g; F.earn(g); W.t += dt; };
  const buyFac = k => { if (!F.furReady(k)) { const i = F.FUR[k].map((_, j) => j).filter(j => !F.furDone(k, j)).sort((a, b) => F.furCost(k, a) - F.furCost(k, b))[0]; return S().budget >= F.furCost(k, i) && F.buyFur(k, i, true); } return S().budget >= F.facCost(k) && F.buyFacility(k); };
  const best = () => { const r = F.recommend ? F.recommend() : null; if (!r) return false;
    let ok = false;
    if (r.kind === 'tea') ok = S().budget >= F.teaCost(r.k) && F.teacherAct(r.k);
    else if (r.kind === 'fur') ok = S().budget >= F.furCost(r.k, r.i) && F.buyFur(r.k, r.i, true);
    else ok = S().budget >= F.facCost(r.k) && F.buyFacility(r.k);
    if (ok) W.buys++; return ok;
  };
  while (W.t < end && W.t < maxH * 3600 && performance.now() - t0 < 25000) {
    step();
    const q = F.curMain(), id = q ? q.id : 'none';
    if (id !== W.qid) { if (W.qid) W.out.push([W.qid, +(W.qt / 60).toFixed(1), +((W.t - W.qt) / 60).toFixed(1), S().tier, S().tg, W.buys - W.qb]); W.qid = id; W.qt = W.t; W.qb = W.buys; }
    for (let i = 0; i < 3 && F.mainReady(); i++) F.claimMain(null);
    if (F.canGraduate()) { if (S().tier === 1 && S().tg >= 1) { W.done = true; break; } F.graduate(); continue; }
    if (F.canPromote()) { F.promote(); continue; }
    if (q && !F.mainReady()) {
      if (q.t === 'picks') { W.pick += dt; if (W.pick >= 4) { W.pick = 0; S().st.picks += 1; } }
      if (q.t === 'mgBest') { W.pick += dt; if (W.pick >= 2) { W.pick = 0; S().mg.best.a = Math.min(10, (S().mg.best.a || 0) + 1); } }   // 1.8.0
      if (q.t === 'mgOrders') { W.pick += dt; if (W.pick >= 30) { W.pick = 0; S().mg.st.orders += 1; } }
      if (q.t === 'shakes') S().st.shakes += 1;
      if (q.t === 'fest') { S().fest.n[q.k] = (S().fest.n[q.k] || 0) + 1; }
      if (q.t === 'perks') { const k = Object.keys(F.PERKS).filter(x => !F.perkMaxed(x)).sort((a, b) => F.perkCost(a) - F.perkCost(b))[0]; if (k && F.perkCost(k) <= S().p.dip) F.buyPerk(k, document.body); }
      if (q.t === 'fperks') { const k = Object.keys(F.FPERKS).sort((a, b) => F.fpCost(a) - F.fpCost(b))[0]; if (F.fpCost(k) <= S().fund) F.buyFundPerk(k, document.body); }
    }
    for (let i = 0; i < 20; i++) if (!best()) break;
  }
  return { buys: W.buys, t: +(W.t / 60).toFixed(1), tier: S().tier, tg: S().tg, done: W.done, q: W.qid, n: W.out.length };
}"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context()
        await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
        pg = await ctx.new_page(); await pg.goto(URL); await pg.wait_for_timeout(1500)
        for _ in range(400):
            r = await pg.evaluate(JS, MAXH)
            if r['done'] or r['t'] >= MAXH * 60: break
        out = await pg.evaluate('window.__qb.out')
        for row in out: print('%-6s 시작 %6.1f분  걸림 %6.1f분  학교급 %d 종업식 %d  구매 %d' % tuple(row))
        print(json.dumps(r, ensure_ascii=False)); await b.close()
asyncio.run(main())
