# 1.6.0 시험: 학교 행사 전수 조사. 행사(보물찾기, 환영회, 운동회, 학예회, 졸업 사진)마다 실제로 나오는 아이템(쪽지, 풍선, 공, 음표, 웃음 별)을
# 손가락으로 누를 수 있는지 봐요. 아이템 가운데 점에서 화면 맨 위에 있는 것이 그 아이템이 아니면(위쪽 칸, 퀘스트 칸, 미션 줄, 행사 점수판,
# 알림, 지도 버튼 등에 가려지면) 못 누르는 것으로 세요. 시작 카운트다운 알림판도 행사 자리를 가리지 않는지 봐요.
# 휴대폰 393x762(지섭 폰), 360x800, 412x915. 마지막 줄 PASS면 통과
# 쓰는 법: python3 wrap.py && python3 s52test.py [행사 이름...]
import asyncio, sys, json
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
ONLY = sys.argv[1:]
FESTS = [f for f in ['picnic', 'welcome', 'sports', 'show', 'photo'] if not ONLY or f in ONLY]
SIZES = [(393, 762), (360, 800), (412, 915)]
NEED = 0.9   # 나온 아이템 가운데 이만큼은 누를 수 있어야 해요

SAMPLE = """(() => { const F = window.__forest, rt = F.rt;
  const items = rt.sports ? [...document.querySelectorAll('#fx .drop')] : (rt.fest ? rt.fest.items.filter(i => !i.dead).map(i => i.g) : []);
  const out = [];
  for (const g of items) {
    if (!g.isConnected) continue;
    const r = g.getBoundingClientRect(); if (!r.width) continue;
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) { out.push([0, 'offscreen']); continue; }
    const e = document.elementFromPoint(x, y);
    const hitG = e && e.closest('.fest-item, .drop'); const ok = !!(hitG && (hitG === g || items.includes(hitG)));   // 다른 아이템과 겹친 건 그래도 누를 수 있어요
    let who = '';
    if (!ok && e) { const c = e.closest('[id]'); who = (c ? '#' + c.id : '') + '.' + (e.getAttribute('class') || e.tagName).split(' ')[0]; }
    out.push([ok ? 1 : 0, who]);
  }
  const ban = document.querySelector('#feverBan');
  return { out, ban: ban && !ban.hidden ? (() => { const b = ban.getBoundingClientRect(); return [b.top, b.bottom]; })() : null }; })()"""

async def main():
    fails = []; report = {}
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for (w, h) in SIZES:
            for fid in FESTS:
                tag = f'{w}x{h} {fid}'
                ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2, is_mobile=True, has_touch=True)
                await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
                pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
                await pg.goto(URL); await pg.wait_for_timeout(3500)
                await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S; const t=document.querySelector('#tut'); if(t) t.hidden=true; S.tut.st='skip'; F.rt.tut=null; {CLEAN};
                  S.tier=1; S.tg=5; S.grade=2; S.budget=1e9; for (const k of ['classroom','cafeteria','library','playground','science']) S.f[k]=Math.max(10,S.f[k]||0);
                  S.students=60; S.q.m=F.MAIN.findIndex(q=>q.id==='q23'); S.q.mb=0; S.q.subs=[]; F.fillSubs(); F.rt.mapLaid=-1; F.layoutMap(); F.renderMap(); F.renderHUD(); F.renderAffordance(); F.syncKids(); F.setTab('grad'); F.setTab('school'); }})()""")
                await pg.wait_for_timeout(1500)
                # 더 나쁜 경우: 지도를 위로 끝까지 밀어 둔 채 행사를 열어요
                await pg.evaluate(f"{F}.festFocus(520, 540)"); await pg.wait_for_timeout(300)
                if fid == 'sports': await pg.evaluate(f"{F}.startSports(true)")
                else: await pg.evaluate(f"{F}.startFest('{fid}', true)")
                await pg.wait_for_timeout(900)
                # 카운트다운 알림판이 떠 있는 동안 아이템이 나오는 자리를 가리는지
                ban = await pg.evaluate(SAMPLE)
                await pg.wait_for_timeout(3000)
                tot = ok = 0; who = {}
                shot = False
                for i in range(40):
                    r = await pg.evaluate(SAMPLE)
                    for o, wname in r['out']:
                        tot += 1; ok += o
                        if not o: who[wname] = who.get(wname, 0) + 1
                    if not shot and len(r['out']) >= 3:
                        await pg.screenshot(path=f's52_{fid}_{w}x{h}.png'); shot = True
                    await pg.wait_for_timeout(350)
                frac = ok / tot if tot else 0
                report[tag] = (round(frac, 2), tot, sorted(who.items(), key=lambda x: -x[1])[:3])
                if tot < 8: fails.append(f'[{tag}] 아이템이 너무 적게 나왔어요 ({tot})')
                elif frac < NEED: fails.append(f'[{tag}] 누를 수 있는 아이템 {frac:.0%} ({ok}/{tot}), 가린 것 {report[tag][2]}')
                if errs: fails.append(f'[{tag}] 페이지 오류 {errs[:2]}')
                await ctx.close()
        await b.close()
    for k, v in report.items(): print(k, v)
    for f in fails: print('FAIL', f)
    print('PASS' if not fails else 'FAIL')
    sys.exit(1 if fails else 0)

if __name__ == '__main__': asyncio.run(main())
