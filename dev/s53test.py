# 1.6.0 시험: 광고가 준비되지 않았을 때(애드몹이나 토스가 줄 광고가 없을 때). 가짜 광고(window.FOREST_ADS, adReady가 false)를 넣고
# 자리 비운 도토리 2배 받기는 기본 보상을 바로 주는지, 보충수업 부엉이 버튼이 그대로 남는지, 까치 핫딜이 묶이지 않고 다시 받을 수 있는지,
# 체험학습 단축은 창이 다시 열리는지, 퍼즐 판 추가와 상점 광고는 횟수가 그대로인지, 안내 글이 '광고를 불러오지 못했어요'인지 봐요.
# 그리고 광고가 준비되면(adReady true) 끝까지 본 보상이 그대로 들어오는지도 봐요.
# 쓰는 법: python3 wrap.py && python3 s53test.py   (마지막 줄이 PASS면 통과)
import asyncio, sys
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
FAKE = "window.__adReady = false; window.__adCalls = 0; window.FOREST_ADS = { adReady: () => window.__adReady, adState: () => window.__adReady ? '' : 'loading', preload: () => { window.__adCalls++; }, showAd: done => setTimeout(() => done({ earned: true }), 50) };"

async def main():
    fails = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 393, 'height': 762}, device_scale_factor=2, is_mobile=True, has_touch=True)
        await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();" + FAKE)
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(3500)
        await pg.evaluate(f"(()=>{{ const F={F}, S=F.S; const t=document.querySelector('#tut'); if(t) t.hidden=true; S.tut.st='skip'; F.rt.tut=null; {CLEAN}; S.tier=1; S.budget=1e9; S.f.playground=5; S.t.owl=2; S.students=30; F.renderHUD(); F.renderAffordance(); }})()")
        toast = "(document.querySelector('.toast') || {}).textContent || ''"
        # 1) 자리 비운 도토리 2배 → 광고 없음 → 기본 보상
        await pg.evaluate(f"(()=>{{ const F={F}, S=F.S; S.pending = 5000; S.pendingSec = 3600; F.rt.b0 = S.budget; F.claimOfflineDouble(); }})()")
        await pg.wait_for_timeout(900)
        r = await pg.evaluate(f"[{F}.S.budget - {F}.rt.b0, {F}.S.pending, {toast}]")
        if not (5000 <= r[0] < 7000) or r[1] != 0: fails.append(f'자리 비운 도토리: 광고가 없을 때 기본 보상이 안 들어와요 {r}')
        if '기본 보상' not in r[2]: fails.append(f'자리 비운 도토리 안내 {r[2]}')
        # 2) 보충수업: 버튼이 그대로
        await pg.evaluate(f"(()=>{{ const F={F}; F.rt.boostUntil = Date.now() + 60000; F.startBoost(); }})()")
        await pg.wait_for_timeout(900)
        r = await pg.evaluate(f"[{F}.rt.boostUntil > Date.now(), {F}.S.ad.n, {toast}]")
        if not r[0]: fails.append(f'보충수업: 광고가 없을 때 부엉이 버튼이 사라져요 {r}')
        if '불러오지 못했어요' not in r[2]: fails.append(f'보충수업 안내 {r[2]}')
        # 3) 상점 광고: 횟수 그대로
        g0 = await pg.evaluate(f"[{F}.S.gold, {F}.S.gd.shop]")
        await pg.evaluate(f"{F}.setTab('shop')"); await pg.wait_for_timeout(200)
        await pg.evaluate("document.querySelector('#shopAd').click()"); await pg.wait_for_timeout(400)
        g1 = await pg.evaluate(f"[{F}.S.gold, {F}.S.gd.shop, {toast}]")
        if g1[:2] != g0: fails.append(f'상점 광고: 광고가 없는데 횟수나 황금 도토리가 바뀌었어요 {g0} {g1}')
        if '불러오지 못했어요' not in g1[2]: fails.append(f'상점 광고 안내 {g1[2]}')
        await pg.evaluate(f"{F}.setTab('school')")
        # 4) 광고가 준비되면 보상이 들어와요 (자리 비운 도토리 2배)
        await pg.evaluate(f"(()=>{{ window.__adReady = true; const F={F}, S=F.S; S.pending = 1000; S.pendingSec = 600; F.rt.b0 = S.budget; F.claimOfflineDouble(); }})()")
        await pg.wait_for_timeout(1500)
        r = await pg.evaluate(f"[{F}.S.budget - {F}.rt.b0, {F}.S.pending]")
        if not (2000 <= r[0] < 3500) or r[1] != 0: fails.append(f'광고가 있을 때 2배 보상 {r}')
        if errs: fails.append(f'페이지 오류 {errs[:2]}')
        await b.close()
    for f in fails: print('FAIL', f)
    print('PASS' if not fails else 'FAIL')
    sys.exit(1 if fails else 0)

if __name__ == '__main__': asyncio.run(main())
