# 206번 시험: 다국어 틀(1단계)
# 1) 한국어(기본): 글과 숫자(만, 억)가 그대로, html lang=ko, 언어 칸은 숨김
# 2) ?lang=en, ?lang=ja, ?lang=es: 사전(i18n/<말>.json)을 받아 처음 화면 글(아래 탭, 설정)이 바뀌고 html lang이 바뀌어요
# 3) t(): 자리 표시, 한국어 조사({name|을}), 복수형(one, other), 사전에 없는 글은 한국어 그대로
# 4) 숫자: 영어와 스페인어는 K, M, B, 일본어는 万, 億. 숫자 단위 칸은 영어와 스페인어에서 숨겨요
# 5) 일본어 글꼴 링크(#fontJa)와 줄바꿈(word-break normal)
# 6) 언어 칸에서 고르면 이 기기에 남고(forest-lang) 다시 열어도 그 말
# 7) 시간대: 저장(S.tz)이 없던 옛 저장은 한국 시간에서 시작해 휴대폰 시간대로 한 번 맞추고, 7일 안에는 다시 바꾸지 않아요. 랭킹 주간은 한국 시간 그대로
# 8) 사전 점검(i18n_scan --check) 통과, 360px과 390px 넘침 없음
# 이 시험은 사전을 받으려고 저장소 맨 위를 작은 웹 서버로 열어요
import asyncio, functools, http.server, json, os, pathlib, subprocess, sys, threading
from playwright.async_api import async_playwright
from testlib import base, Checker, CLEAN, F, OVER
c = Checker()
ROOT = pathlib.Path(__file__).resolve().parent.parent
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Q, directory=str(ROOT)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = f'http://127.0.0.1:{srv.server_address[1]}/dev/test.html'
async def open_page(b, w, sch, q, save, tz='Asia/Seoul', ls=None):
    ctx = await b.new_context(viewport={'width': w, 'height': 780}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme=sch, timezone_id=tz, locale='en-US')
    await ctx.add_init_script("window.__FOREST_TEST = true;")
    await ctx.add_init_script("if(!sessionStorage.getItem('seeded')){localStorage.setItem('forest-school-v1', %s);%ssessionStorage.setItem('seeded','1');}" % (json.dumps(json.dumps(save)), (f"localStorage.setItem('forest-lang','{ls}');" if ls else '')))
    pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(BASE + q); await pg.wait_for_timeout(1500)
    await pg.evaluate(CLEAN)
    return ctx, pg, errs
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        # 1) 한국어
        ctx, pg, errs = await open_page(b, 390, 'light', '', base(tier=1))
        r = await pg.evaluate(f"""()=>{{ const F={F}; return {{ lang: document.documentElement.lang, L: F.getLang(), tab: document.querySelector('.tab[data-tab="quests"]')?.textContent.trim(), big: F.fmt(123456789), big2: F.fmt2(123456789),
          t1: F.t('학생 {{n}}명 모으기', {{ n: 5 }}), t2: F.t('{{name|을}} 쓰다듬었어요', {{ name: '솜이' }}), t3: F.t('{{name|이}} 왔어요', {{ name: '여우' }}), t4: F.t('{{name|로}} 가요', {{ name: '교실' }}), t5: F.t('{{name|로}} 가요', {{ name: '도서관' }}) }}; }}""")
        F2 = await pg.evaluate("()=>{ window.__forest.setTab('settings'); return document.querySelector('#langRow').hidden; }")
        c.ok(r['lang'] == 'ko' and r['L'] == 'ko' and '억' in r['big'] and '만' in r['big2'] and F2, f'한국어 그대로 {r} 언어 칸 숨김 {F2}')
        c.ok(r['t1'] == '학생 5명 모으기' and r['t2'] == '솜이를 쓰다듬었어요' and r['t3'] == '여우가 왔어요' and r['t4'] == '교실로 가요' and r['t5'] == '도서관으로 가요', f'한국어 자리 표시와 조사 {r}')
        c.ok(not errs, f'한국어 오류 {errs[:3]}')
        await ctx.close()
        # 2) 영어, 일본어, 스페인어
        want = {'en': ('Quests', 'M', 'Settings'), 'ja': ('クエスト', '億', '設定'), 'es': ('Misiones', 'M', 'Ajustes')}
        for L, (tab, unit, st) in want.items():
            for w, sch in ((360, 'dark'), (390, 'light')):
                ctx, pg, errs = await open_page(b, w, sch, f'?lang={L}', base(tier=1))
                r = await pg.evaluate(f"""()=>{{ const F={F}; F.setTab('settings'); const tabEl = [...document.querySelectorAll('.tab')].find(x => x.dataset.tab === 'quests');
                  const o = {{ lang: document.documentElement.lang, L: F.getLang(), tab: tabEl ? tabEl.textContent.trim() : '', big: F.fmt(123456789), row: !document.querySelector('#langRow').hidden, sel: document.querySelector('#optLang').value,
                    units: document.querySelector('#optUnits').closest('.srow').hidden, st: document.querySelector('#panelSettings h2')?.textContent.trim() || '',
                    font: !!document.getElementById('fontJa'), wb: getComputedStyle(document.body).wordBreak,
                    miss: F.t('사전에 없는 글이에요'), pl1: F.t('도토리 {{n}}개', {{ n: 1 }}), keep: F.t('{{name|을}} 쓰다듬었어요', {{ name: 'Cotton' }}) }}; return o; }}""")
                c.ok(r['lang'] == L and r['L'] == L and tab in r['tab'] and unit in r['big'] and r['row'] and r['sel'] == L, f'{L} {w} 사전과 탭 글과 숫자 {r}')
                c.ok(st in r['st'], f'{L} {w} 설정 제목 {r["st"]}')
                c.ok(r['units'] == (L != 'ja'), f'{L} 숫자 단위 칸 {r["units"]}')
                c.ok((r['font'] and r['wb'] == 'normal') if L == 'ja' else (not r['font']), f'{L} 글꼴과 줄바꿈 {r["font"]} {r["wb"]}')
                c.ok(r['miss'] == '사전에 없는 글이에요' and r['keep'] == 'Cotton 쓰다듬었어요', f'{L} 없는 글과 조사 {r}')
                # 위 줄 아이콘(.icon-btn)은 누르는 자리 넓히기(::after) 때문에 scrollWidth가 커져 보여서 빼요
                over = await pg.evaluate(OVER, '.tab:not(.icon-btn), #panelSettings .srow, #panelSettings .srow *')
                c.ok(not over, f'{L} {w} 넘침 {over}')
                c.ok(not errs, f'{L} {w} 오류 {errs[:3]}')
                await ctx.close()
        # 3) 복수형(사전 글을 바꿔 끼워서)
        ctx, pg, errs = await open_page(b, 390, 'light', '?lang=en', base(tier=1))
        r = await pg.evaluate(f"""()=>{{ const F={F}; F.setLangTest('en', {{ '도토리 {{n}}개': {{ one: '{{n}} acorn', other: '{{n}} acorns' }}, '{{name|을}} 쓰다듬었어요': 'You patted {{name}}' }});
          return [F.t('도토리 {{n}}개', {{ n: 1 }}), F.t('도토리 {{n}}개', {{ n: 3 }}), F.t('{{name|을}} 쓰다듬었어요', {{ name: 'Cotton' }})]; }}""")
        c.ok(r == ['1 acorn', '3 acorns', 'You patted Cotton'], f'복수형과 자리 표시 {r}')
        # 6) 언어 칸에서 고르기
        await pg.evaluate("()=>{ window.__forest.setTab('settings'); const s = document.querySelector('#optLang'); s.value = 'ja'; s.dispatchEvent(new Event('change', { bubbles: true })); }")
        await pg.wait_for_timeout(2000)
        r = await pg.evaluate("()=>[localStorage.getItem('forest-lang'), location.search, document.documentElement.lang]")
        c.ok(r[0] == 'ja' and 'lang=' not in r[1] and r[2] == 'ja', f'언어 고르기 {r}')
        await ctx.close()
        # 7) 시간대
        old = base(tier=1); old.pop('tz', None)
        ctx, pg, errs = await open_page(b, 390, 'light', '', old, tz='America/Mexico_City')
        r = await pg.evaluate(f"""()=>{{ const F={F}, S=F.S; const o = {{ o: S.tz.o, at: S.tz.at > 0, dev: F.tzDev(), now: F.getTz() }};
          S.tz.o = 9 * 3600000; S.tz.at = F.gameNow() - 86400000; F.tzSync(); o.hold = S.tz.o; o.holdNow = F.getTz();
          S.tz.at = F.gameNow() - 8 * 86400000; F.tzSync(); o.after = S.tz.o;
          const d = F.sanitize({{ ...JSON.parse(JSON.stringify(S)), tz: {{ o: 'x' }} }}); o.bad = d.tz.o;
          return o; }}""")
        c.ok(r['o'] == r['dev'] and r['at'] and r['now'] == r['dev'] and r['dev'] < 0, f'옛 저장은 휴대폰 시간대로 한 번 {r}')
        c.ok(r['hold'] == 9 * 3600000 and r['holdNow'] == 9 * 3600000 and r['after'] == r['dev'] and r['bad'] == 9 * 3600000, f'7일 안에는 그대로, 망가진 값은 한국 시간 {r}')
        c.ok(not errs, f'시간대 오류 {errs[:3]}')
        await ctx.close()
        ctx, pg, errs = await open_page(b, 390, 'light', '', base(tier=1))
        r = await pg.evaluate(f"()=>{{ const F={F}; return [F.getTz(), F.S.tz.o]; }}")
        c.ok(r == [9 * 3600000, 9 * 3600000], f'한국에서는 한국 시간 {r}')
        await ctx.close()
        await b.close()
    r = subprocess.run([sys.executable, str(ROOT / 'dev/i18n_scan.py'), '--check'], capture_output=True, text=True)
    c.ok(r.returncode == 0, f'사전 점검 {r.stdout[-200:]}')
    c.done()
asyncio.run(main())
