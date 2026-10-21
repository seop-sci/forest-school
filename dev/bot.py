# 자동 플레이: 가장 싼 것부터 사고, 대도시가 되면 명예 교장실을 고치고 종업식을 열어요. 해마다 걸린 시간과 레벨을 적어요
import asyncio, json, sys
from playwright.async_api import async_playwright
from s4test import URL
BOT = r"""(maxH) => {
  const F = window.__forest; const W = window.__bot = window.__bot || { t: 0, yearT: 0, out: [], done: false, tripEnd: 0, trips: 0, pickT: 0 }; const out = W.out; let t = W.t, yearT = W.yearT; const dt = 5; const end = t + maxH * 3600; const t0 = performance.now();
  const S = () => F.S;
  const step = () => { const s = S(); const cap = F.capacity(); if (s.students < cap) s.students = Math.min(cap, s.students + F.CFG.enroll * dt); const g = F.rate() * dt; s.budget += g; F.earn(g); t += dt; yearT += dt; };
  const buy = () => { for (let i = 0; i < 60; i++) {
      const c = [];
      for (const k of F.facKeys()) { if (F.furReady(k)) c.push([F.facCost(k), () => F.buyFacility(k)]); else F.FUR[k].forEach((_, i) => { if (!F.furDone(k, i)) c.push([F.furCost(k, i), () => F.buyFur(k, i, true)]); }); }
      for (const k of Object.keys(F.TEA)) if (!F.teaMaxed(k)) c.push([F.teaCost(k), () => F.teacherAct(k)]);
      c.sort((a, b) => a[0] - b[0]);
      if (!c.length || c[0][0] > S().budget) return; c[0][1]();
  } };
  const perks = () => { for (let i = 0; i < 40; i++) { const ks = Object.keys(F.PERKS).filter(k => !F.perkMaxed(k)).sort((a, b) => F.perkCost(a) - F.perkCost(b)); if (!ks.length || F.perkCost(ks[0]) > S().p.dip) return; F.buyPerk(ks[0], document.body); } };
  const fperks = () => { for (let i = 0; i < 40; i++) { const ks = Object.keys(F.FPERKS).sort((a, b) => F.fpCost(a) - F.fpCost(b)); if (F.fpCost(ks[0]) > S().fund) return; F.buyFundPerk(ks[0], document.body); } };
  const snap = (what) => { const s = S(); out.push({ what, cap: F.facCap(), trips: s.st.trips, souv: s.trip.souv.length, tier: s.tier, tg: s.tg, min: Math.round(yearT / 60), totalH: +(t / 3600).toFixed(2), f: Object.assign({}, s.f), t: Object.assign({}, s.t), st: Math.floor(s.students), q: s.q.m, qid: (F.curMain() || {}).id }); yearT = 0; };
  while (t < end && performance.now() - t0 < 20000) {
    step(); buy(); perks();
    { const q = F.curMain(); if (q && q.t === 'fest') { const s = S(); s.fest.n[q.k] = (s.fest.n[q.k] || 0) + 1; } if (q && q.t === 'sports') S().st.sports += 1; }
    { const s = S(); W.pickT += dt; if (W.pickT >= 15) { W.pickT = 0; s.st.picks += 1; } }
    { const s = S();
      if (F.S.trip && (s.trip.open || (s.tier >= 1 && s.tg >= 2))) {
        if (!s.trip.cur) {
          const q = F.curMain() || {};
          const ok = F.TRIPS.filter(D => s.st.trips >= D.need);
          let D = q.t === 'tripat' ? ok.find(x => x.id === q.k) : null;
          if (!D) D = ok.filter(x => x.souv.some((_, i) => !s.trip.souv.includes(x.id + ':' + i))).sort((a, b) => a.min - b.min)[0] || ok[0];
          if (D) { s.trip.open = true; F.startTrip(D.id); W.tripEnd = t + D.min * 60; }
        } else if (t >= W.tripEnd) { s.trip.end = Date.now() - 1; F.claimTrip(1); W.trips++; }
      } }
    for (let i = 0; i < 5 && F.mainReady(); i++) F.claimMain(null);
    if (S().tier === 1 && S().tg >= 5) { if (!F.curMain()) { snap('final'); W.done = true; break; } }
    else if (F.canGraduate()) { snap('grad'); perks(); F.graduate(); buy(); }
    else if (F.canPromote()) {
      if (S().tier >= 1) { snap('final'); W.done = true; break; }
      snap('promote'); F.promote(); fperks(); buy();
    }
  }
  W.t = t; W.yearT = yearT; const s = S(); return { done: W.done, h: +(t/3600).toFixed(2), tier: s.tier, tg: s.tg, grade: s.grade, f: s.f, q: s.q.m, n: out.length, out: out.slice(-3) };
}"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 390, 'height': 800})
        await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        for i in range(int(sys.argv[1]) if len(sys.argv) > 1 else 30):
            r = await pg.evaluate(BOT, 0.5)
            print(json.dumps({k: r[k] for k in ('h','tier','tg','grade','f','q','n')}, ensure_ascii=False), flush=True)
            if r['done']: break
        for x in await pg.evaluate('window.__bot.out'): print(json.dumps(x, ensure_ascii=False))
        print(errs[:3]); await b.close()
asyncio.run(main())
