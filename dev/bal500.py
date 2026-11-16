# 5.0.0 균형 셈: 대학원 한 학기가 대학교 한 학기의 몇 배 걸리는지 재요(목표 4.5일 / 3일 = 1.5배)
# 실제 시간을 흉내 내지 않고, 메인 퀘스트를 따라 꼭 사야 하는 것(퀘스트의 건물 레벨, 대도시 평판)을 가장 싼 것부터 사면서
# '그때 수입으로 모으는 데 걸린 시간(도토리 시간)'과 '공사 시간'을 학기마다 더해요.
# 같은 판에서 대학교 4학년부터 박사 8학기까지 이어서 재니, 수료증과 특전 같은 공통 배수는 견줄 때 지워져요.
# 쓰는 법: python3 wrap.py && python3 bal500.py [설정 JSON]   설정 예: '{"extra": 0.3}' 학기마다 남는 도토리의 30%를 수입 올리기에 써요
import asyncio, json, sys
from playwright.async_api import async_playwright
from s4test import URL

JS = r"""(cfg) => { const F = window.__forest, S = F.S, out = [], notes = [];
  F.rt.modalQueue.length = 0; F.rt.modalOpen = null;
  S.tier = 4; S.tg = 3; S.sem = 0; S.grade = 0; S.best = 4; S.students = 160; S.yearEarned = 0;
  const cap0 = F.facCap() - 3;   // 3학년 2학기 끝 상한
  for (const k of F.facKeys()) { S.f[k] = cap0; if (S.fu[k]) S.fu[k] = S.fu[k].map(() => cap0); }
  Object.assign(S.t, { squirrel: cap0, owl: 5, bear: cap0 });
  S.q.m = F.MAIN.findIndex(q => q.id === 'un33'); S.q.mb = 0; S.q.lat = '';
  let fake = Date.now(); F.rt.fakeNow = fake;
  const RB = ['classroom', 'cafeteria', 'playground', 'library', 'science'];   // 평판에 들어가는 건물(도서관 3배)
  let T = 0, C = 0, buys = 0;
  const pay = (fn, cost) => { if (!(cost > 0) || !isFinite(cost)) return false; const r = F.rate(); S.budget = cost * 1.000001; const ok = fn(); S.budget = 0; if (!ok) return false; T += cost / r; buys++;
    // 공사는 바로 끝내고 걸린 공사 시간만 더해요(게임 시계는 앞으로만 흘러요)
    const now = F.gameNow(); for (const k in (S.bd || {})) C += Math.max(0, S.bd[k].e - now) / 1000;
    fake = Math.max(fake, now) + 86400e3; F.rt.fakeNow = fake; F.conTick(); return true; };
  const conSec = k => { try { return F.conSecOf ? F.conSecOf(k) : 0; } catch (e) { return 0; } };
  const lvUp = k => { if (!F.furReady(k)) { const j = F.FUR[k].map((_, j) => j).filter(j => !F.furDone(k, j)).sort((a, b) => F.furCost(k, a) - F.furCost(k, b))[0]; return pay(() => F.buyFur(k, j, true), F.furCost(k, j)); }
    if (S.f[k] >= F.facCap()) return false; const L0 = S.f[k]; return pay(() => F.buyFacility(k), F.facCost(k)); };
  const cheapRep = () => { const ks = RB.filter(k => S.f[k] < F.facCap() || !F.furReady(k)).sort((a, b) => (F.furReady(a) ? F.facCost(a) / (a === 'library' ? 3 : 1) : 0) - (F.furReady(b) ? F.facCost(b) / (b === 'library' ? 3 : 1) : 0)); return ks[0] && lvUp(ks[0]); };
  const extra = () => { if (!cfg.extra) return; };
  let guard = 0, semT0 = 0, semB0 = 0, semC0 = 0;
  while (guard++ < 200000) {
    for (let i = 0; i < 8 && F.mainReady(); i++) F.claimMain(null);
    F.rt.modalQueue.length = 0; F.rt.modalOpen = null;
    if (S.tier >= 5 && S.tg >= 6) break;
    if (F.canGraduate()) { out.push({ tier: S.tier, tg: S.tg, sem: S.sem, h: +((T - semT0) / 3600).toFixed(2), buys: buys - semB0, con: +((C - semC0) / 3600).toFixed(1), rate: +F.rate().toPrecision(3), lv: Object.assign({}, S.f), q: (F.curMain() || {}).id });
      semT0 = T; semB0 = buys; semC0 = C; F.graduate(); S.grade = 0; F.checkGrade(); continue; }
    if (F.canPromote()) { out.push({ tier: S.tier, tg: S.tg, sem: S.sem, h: +((T - semT0) / 3600).toFixed(2), buys: buys - semB0, con: +((C - semC0) / 3600).toFixed(1), rate: +F.rate().toPrecision(3), lv: Object.assign({}, S.f), q: 'promote' });
      semT0 = T; semB0 = buys; semC0 = C; F.promote(); F.rt.modalQueue.length = 0; F.rt.modalOpen = null; S.grade = 0; F.checkGrade(); continue; }
    const q = F.curMain();
    if (q && q.t === 'xt' && F.xtLv(q.k) < q.n) { pay(() => F.xtAct(q.k), F.xtCost(q.k)) || (S.q.lat = q.id); continue; }
    if (cfg.policy === 'need') {
      if (q && q.t === 'fac' && (S.f[q.k] || 0) < q.n) { if (!lvUp(q.k)) { if (!cheapRep()) { notes.push('막힘 ' + q.id); S.q.lat = q.id; } } continue; }
      if (S.grade < 4) { if (!cheapRep()) { notes.push('평판 막힘'); S.grade = 4; } F.checkGrade(); continue; }
    } else {
      // 사람처럼 살 수 있는 것 가운데 가장 싼 것부터(건물, 가구, 선생님). 퀘스트 건물도 결국 사요
      const c = [];
      for (const k of F.facKeys()) { if (!F.furReady(k)) { const j = F.FUR[k].map((_, j) => j).filter(j => !F.furDone(k, j)).sort((a, b) => F.furCost(k, a) - F.furCost(k, b))[0]; if (j !== undefined) c.push([F.furCost(k, j), () => F.buyFur(k, j, true)]); } else if (S.f[k] < F.facCap()) c.push([F.facCost(k), () => F.buyFacility(k)]); }
      for (const k of Object.keys(F.TEA)) if (!F.teaMaxed(k)) c.push([F.teaCost(k), () => F.teacherAct(k)]);
      c.sort((a, b) => a[0] - b[0]); const lim = F.rate() * 3600 * 24 * 3650 * 100;
      let ok = false; for (const x of c) { if (x[0] > lim) break; if (pay(x[1], x[0])) { ok = true; break; } }
      F.checkGrade();
      if (ok) continue;
    }
    if (q && !F.mainReady() && !['fac', 'grade', 'ygrade', 'tier', 'students', 'furAll'].includes(q.t)) { S.q.lat = q.id; continue; }   // 봇이 못 하는 퀘스트(공부, 대결 등)는 한 것으로 쳐요
    notes.push('멈춤 ' + JSON.stringify({ q: q && q.id, m: S.q.m, n: F.MAIN.length, tier: S.tier, tg: S.tg, sem: S.sem, grade: S.grade, rate: F.rate(), f: S.f, t: S.t, cg: F.canGraduate(), tea: Object.keys(F.TEA).map(k => [k, F.teaMaxed(k), F.teaCost(k)]) })); break;
  }
  return { out, notes: notes.slice(0, 12), guard }; }"""

async def main():
    cfg = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 390, 'height': 800})
        await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        await pg.evaluate("const t=document.querySelector('#tut'); if(t && !t.hidden){ window.__forest.S.tut.st='skip'; t.hidden=true; window.__forest.rt.modalOpen=null; }")
        r = await pg.evaluate(JS, cfg)
        for x in r['out']: print(json.dumps(x, ensure_ascii=False))
        print('notes', r['notes'], 'guard', r['guard'], 'errs', errs[:3])
        await b.close()
asyncio.run(main())
