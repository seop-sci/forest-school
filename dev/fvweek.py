# 4.1.1 재기: 요일 행사(대학 축제 월수금, 교환학생의 날 화, 숲속 장터 목) 한 주 수입이 평소 한 주 수입의 몇 배인지 재요.
# 대학교 학교를 하나 만들고, 게임 시계를 요일마다 옮겨 가며 게임의 진짜 함수(손님 만나기, 부스 놀이 끝내기, 교환학생 세 단계)를 불러
# 번 도토리(S.earned)가 얼마나 늘었는지를 '수업료 몇 분치'로 바꿔요. 물건을 사지 않아서 수업료(rate)는 한 주 내내 같아요.
# 평소 수입은 접속 습관 세 가지로 셈해요(켜 둔 시간은 수업료 그대로, 자리 비운 시간은 게임의 상한과 비율 그대로. 자리 비운 보상 한 번은 진짜 함수로 맞춰 봐요).
# 쓰는 법: python3 wrap.py && python3 fvweek.py   (판정 줄 없음, 숫자만 보여 줘요)
import asyncio, json
from playwright.async_api import async_playwright
from s4test import ctxpage, base
F = 'window.__forest'
CLEAN = f"(()=>{{ document.querySelectorAll('.overlay').forEach(o=>{{o.hidden=true;o.classList.remove('open')}}); const F={F}; F.rt.modalOpen=null; F.rt.modalQueue.length=0; F.rt.talkSeq=null; F.rt.st=null; F.closeSheet&&F.closeSheet(); const t=document.querySelector('#tut'); if(t) t.hidden=true; F.S.tut.st=F.S.tut.st||'skip'; F.rt.tut=null; }})()"
# 다음 주 월요일 0시(한국 시간)에서 d일 h시간 뒤로 게임 시계를 옮겨요(앞으로만 옮겨요)
CLOCK = lambda d, h=10: f"(()=>{{ const F={F}; const now=Date.now()+9*3600000; const day=Math.floor(now/86400000); const wd=(new Date(day*86400000).getUTCDay()+6)%7; const mon=(day-wd+7)*86400000-9*3600000; F.rt.fakeNow=mon+{d}*86400000+{h}*3600000; return [F.gameToday(), F.fvWd? F.fvWd():-1]; }})()"

MEASURE = """async (o) => {
  const F = window.__forest, S = F.S, out = { days: {}, notes: [] };
  const T0 = performance.now(); let tOff = 0;
  const mins = d => +(d / (F.rate() * 60)).toFixed(2);
  const mark = () => ({ e: S.earned, t: performance.now() });
  const gain = m => mins(S.earned - m.e - F.rate() * (performance.now() - m.t) / 1000);   // 재는 동안 저절로 번 수업료는 빼요
  const wait = ms => new Promise(r => setTimeout(r, ms));
  if (o.step === 'setup') {
    S.tier = 4; S.f.union = Math.max(1, S.f.union || 0);
    for (let i = 0; i < 6 && F.deptPicks().length < F.deptSlots(); i++) { const D = F.DEPT.list.find(D => !F.deptPicks().includes(D.k)); if (D) F.deptSet(D.k, ''); }
    return { rate: F.rate(), booths: F.deptPicks(), slots: F.deptSlots(), dean: F.xtLv('dean'), capH: F.offlineCapH(), owl: S.t.owl, eff: Math.min(1, 0.3 + 0.15 * S.t.owl), fvOpen: F.fvOpen(),
      picnicMin: mins(F.minAcorns(F.PCN.acorn)), showMin: F.CLUB.showMin, FV: { boothMin: F.FV.boothMin, guestMin: F.FV.guestMin, deanPct: F.FV.deanPct } };
  }
  if (o.step === 'fv') {
    F.fvSync(); const r = { on: F.fvOn(), bonus: ['picnic', 'snack', 'show'].find(k => F.fvBonus(k)) || '' };
    let m0 = mark(); for (let i = 0; i < 3; i++) F.fvMeet(i); r.guest = gain(m0);
    m0 = mark(); r.boothN = 0;
    for (const k of F.deptPicks()) {
      F.rt.modalOpen = null; F.rt.modalQueue.length = 0;
      if (!F.fvBoothStart(k)) { out.notes.push('부스를 못 열었어요 ' + k); continue; }
      await wait(50); if (!F.rt.fest) { out.notes.push('놀이가 안 시작됐어요 ' + k); continue; }
      F.rt.fest.n = F.FV.goal; F.rt.fest.intro = 0; F.rt.fest.t = 0.01;
      for (let j = 0; j < 100 && F.rt.fest; j++) await wait(50);
      if (F.rt.fest) { out.notes.push('놀이가 안 끝났어요 ' + k); F.rt.fest = null; } else r.boothN++;
      document.querySelectorAll('.overlay').forEach(x => { x.hidden = true; x.classList.remove('open'); }); F.rt.modalOpen = null; F.rt.modalQueue.length = 0;
    }
    r.booth = gain(m0); r.stamps = S.fv.st; r.notes = out.notes;
    return r;
  }
  if (o.step === 'xg') {
    const r = { on: F.xgOn() }; const m0 = mark(), es0 = S.ess;
    try { F.xgGreet(); const sp = F.xgSpots ? F.xgSpots() : []; for (const k of sp) F.xgVisit(k); F.xgLunch(); } catch (e) { r.err = String(e); }
    r.acorn = gain(m0); r.ess = S.ess - es0; r.xg = JSON.parse(JSON.stringify(S.xg || {}));
    return r;
  }
  if (o.step === 'away') {   // 자리 비운 보상 3시간을 진짜 함수로
    if (!F.applyAway) return { skip: true };
    const p0 = S.pending; F.applyAway(3 * 3600); return { min: mins(S.pending - p0) };
  }
}"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        fac = dict(classroom=14, cafeteria=12, library=11, playground=8, science=3)
        ctx, page, errs = await ctxpage(b, 390, 800, 'light', base(tier=4, tg=1, f=fac))
        await page.evaluate(CLEAN)
        st = await page.evaluate(MEASURE, {'step': 'setup'}); print('학교', json.dumps(st, ensure_ascii=False))
        week = {}; xg = {}
        for d, nm in ((0, '월'), (1, '화'), (2, '수'), (4, '금')):
            await page.evaluate(CLOCK(d)); await page.wait_for_timeout(2500); await page.evaluate(CLEAN)   # 날짜가 바뀐 뒤 게임이 자리를 잡을 때까지 기다려요
            if nm == '화': xg = await page.evaluate(MEASURE, {'step': 'xg'}); print('화', json.dumps(xg, ensure_ascii=False)[:400]); continue
            week[nm] = await page.evaluate(MEASURE, {'step': 'fv'}); print(nm, json.dumps(week[nm], ensure_ascii=False))
        aw = await page.evaluate(MEASURE, {'step': 'away'}); print('자리 비운 3시간', aw)
        fv = sum(week[k]['guest'] + week[k]['booth'] for k in week)
        bonus = st['picnicMin'] + st['showMin']          # 월요일 소풍 한 번 더, 금요일 발표회 한 번 더
        extra = fv + bonus + xg.get('acorn', 0)
        print(f"\n요일 행사 한 주 도토리: 축제 {fv:.0f}분치 + 요일 보너스 {bonus:.0f}분치 + 교환학생 {xg.get('acorn', 0):.0f}분치 = {extra:.0f}분치 ({extra / 60:.1f}시간치)")
        capH, eff = st['capH'], st['eff']
        base_day = st['picnicMin'] + st['showMin'] * 5 / 7   # 평소에도 하는 소풍 하루 한 번, 발표회 평일 한 번
        for nm, n, m in (('가볍게(하루 2번, 10분씩)', 2, 10), ('보통(하루 4번, 15분씩)', 4, 15), ('많이(하루 8번, 20분씩)', 8, 20), ('켜 두기(하루 종일)', 1, 1440)):
            on = n * m; gap = (1440 - on) / n if on < 1440 else 0
            day = on + n * min(gap, capH * 60) * eff + base_day
            wk = day * 7
            print(f"{nm}: 평소 한 주 {wk / 60:.0f}시간치, 행사를 다 하면 {1 + extra / wk:.3f}배 (+{extra / wk * 100:.1f}%)")
        for eff2 in (0.3, 0.6):
            day = 4 * 15 + 4 * min((1440 - 60) / 4, capH * 60) * eff2 + base_day
            print(f"보통인데 부엉이 선생님이 낮아 자리 비운 비율 {int(eff2 * 100)}%: {1 + extra / (day * 7):.3f}배")
        print('오류', errs[:3])
        await b.close()
asyncio.run(main())
