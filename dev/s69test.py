# 2.0.0 시험: 핫픽스(live.json 원격 설정)
# (1) 받은 숫자는 정해 둔 이름만, 범위 안으로 맞춰서 바꿔요. 이상한 값과 모르는 이름은 버려요
# (2) 기능 끄기: 숲속 합치기를 끄면 단추가 흐려지고 눌러도 열리지 않아요. 이벤트를 끄면 이벤트가 없어요
# (3) 원격 공지는 게임 안 공지 위에 얹어요. 모양이 틀린 공지는 버려요
# (4) 받은 것을 기기에 남겨 두고, 다음에 받지 못하면(404) 남겨 둔 값을 써요. 빈 설정을 받으면 게임 안 값으로 돌아가요
# 쓰는 법: python3 wrap.py && python3 s69test.py   (마지막 줄이 PASS면 통과)
import asyncio, json
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
LIVE = 'https://live.test/live.json'
GOOD = {'v': 3, 'cfg': {'pz.perDay': 12, 'mg.adE': 999, 'pace': 'x', 'bogus': 5, 'ev.scale': 1},
        'off': ['merge', 'hack'],
        'notices': [{'id': 'a1', 'date': '2099-01-01', 'tag': '알림', 'title': '점검 안내', 'lines': ['한 줄', 7]}, {'id': 'bad', 'title': '날짜 없음', 'lines': []}]}

async def main():
    fails = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844})
        await ctx.add_init_script(f"window.__FOREST_TEST = true; window.FS_LIVE_URL = '{LIVE}';")
        mode = {'body': json.dumps(GOOD), 'status': 200}
        async def handle(route):
            await route.fulfill(status=mode['status'], content_type='application/json', body=mode['body'], headers={'Access-Control-Allow-Origin': '*'})
        await ctx.route('https://live.test/**', handle)
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(3000)
        r = await pg.evaluate(f"""(async()=>{{ const F={F}, S=F.S; const t=document.querySelector('#tut'); if(t) t.hidden=true; S.tut.st='skip'; F.rt.tut=null;
          const out = {{ perDay: F.PZ.perDay, adE: F.MG.AD.e, pace: F.CFG.pace, scale: F.EVC.scale, off: [...F.Live.off], v: F.Live.v, n0: F.NOTICES[0].id, n0lines: F.NOTICES[0].lines, live: F.NOTICES.filter(n => n.live).length,
            cache: !!localStorage.getItem('forest-live') }};
          F.setTab('mini'); await new Promise(r=>setTimeout(r,200)); out.dim = document.querySelector('#mgOpen').classList.contains('live-off');
          document.querySelector('#mgOpen').click(); await new Promise(r=>setTimeout(r,300)); out.open = !document.querySelector('#mgScene').hidden;
          out.toast = document.querySelector('#toast').textContent; F.setTab('school'); return out; }})()""")
        exp = {'perDay': 12, 'adE': 200, 'pace': 0.2, 'scale': 1, 'off': ['merge'], 'v': 3, 'n0': 'live-a1', 'n0lines': ['한 줄'], 'live': 1, 'cache': True, 'dim': True, 'open': False}
        got = {k: r[k] for k in exp}
        if got != exp: fails.append(f'받은 값 {r}')
        if '점검' not in r['toast']: fails.append(f'점검 안내 {r["toast"]}')
        # 이벤트 끄기
        r = await pg.evaluate(f"(()=>{{ const F={F}; const a = !!F.evCurrent('2026-11-03'); F.liveApply({{ off: ['event'] }}); const b = F.evCurrent('2026-11-03'); F.liveApply({json.dumps(GOOD)}); return [a, b]; }})()")
        if r != [True, None]: fails.append(f'이벤트 끄기 {r}')
        # (4) 다시 켤 때 받지 못하면 남겨 둔 값
        mode['status'] = 404; mode['body'] = 'no'
        await pg.reload(); await pg.wait_for_timeout(3000)
        r = await pg.evaluate(f"(()=>{{ const F={F}; return [F.PZ.perDay, F.Live.from, [...F.Live.off]]; }})()")
        if r != [12, 'cache', ['merge']]: fails.append(f'남겨 둔 값 {r}')
        # 빈 설정을 받으면 게임 안 값으로
        mode['status'] = 200; mode['body'] = json.dumps({'v': 4})
        await pg.reload(); await pg.wait_for_timeout(3000)
        r = await pg.evaluate(f"(()=>{{ const F={F}; return [F.PZ.perDay, F.MG.AD.e, F.Live.from, [...F.Live.off], F.NOTICES.filter(n => n.live).length, F.EVC.scale]; }})()")
        if r[:5] != [5, 50, 'net', [], 0] or abs(r[5] - 2 / 3) > 1e-9: fails.append(f'빈 설정 {r}')
        if errs: fails.append(f'오류 {errs}')
        await b.close()
    print('\n'.join(fails) if fails else 'PASS')

asyncio.run(main())
