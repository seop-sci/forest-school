# 다국어 화면 넘침 점검: 말(en, ja, es)과 너비(360, 390)마다 탭과 건물 창을 돌며, 한국어에서는 괜찮은데 그 말에서 글이 잘리거나 화면 밖으로 나가는 칸을 모아요
# python3 i18n_layout.py [--lang=en] [--w=360] [--tier=1] [--json 파일]
import asyncio, functools, http.server, json, pathlib, sys, threading
from playwright.async_api import async_playwright
from testlib import base, CLEAN
ROOT = pathlib.Path(__file__).resolve().parent.parent
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Q, directory=str(ROOT)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
arg = lambda k, d: next((a.split('=', 1)[1] for a in sys.argv if a.startswith(f'--{k}=')), d)
LANGS = arg('lang', 'en,ja,es').split(','); WS = [int(x) for x in arg('w', '360,390').split(',')]; TIERS = [int(x) for x in arg('tier', '1,5').split(',')]
OUT = sys.argv[sys.argv.index('--json') + 1] if '--json' in sys.argv else None
# 글이 든 칸 가운데 넘친 것: 글이 칸보다 넓은데 잘라 보이는 칸(overflow hidden, 말줄임), 또는 화면 밖으로 나간 칸
FIND = """() => { const o = []; const vw = innerWidth;
  for (const el of document.querySelectorAll('body *')) {
    if (!el.getClientRects().length || el.closest('svg,script,style,#devPanel')) continue;
    const own = [...el.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim()); if (!own) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    const r = el.getBoundingClientRect(); if (r.width < 4 || r.bottom < 0 || r.top > innerHeight * 3) continue;
    const clip = /hidden|clip/.test(cs.overflowX) || cs.textOverflow === 'ellipsis';
    const wide = el.scrollWidth > el.clientWidth + 2 && clip;
    const tall = el.scrollHeight > el.clientHeight + 3 && /hidden|clip/.test(cs.overflowY) && cs.webkitLineClamp === 'none' && el.clientHeight > 0;
    const out = r.right > vw + 1 || r.left < -1;
    if (wide || tall || out) {
      const path = []; let e = el; for (let i = 0; e && i < 3; i++, e = e.parentElement) path.unshift(e.id ? '#' + e.id : e.tagName.toLowerCase() + (e.classList[0] ? '.' + e.classList[0] : ''));
      o.push({ k: path.join(' > '), why: wide ? 'wide' : tall ? 'tall' : 'out', t: el.textContent.trim().slice(0, 60) });
    } }
  return o; }"""
SCREENS = [('tab ' + t, f"F.setTab('{t}')") for t in ['school', 'quests', 'teachers', 'tam', 'study', 'street', 'grad', 'event', 'dex', 'rank', 'mini', 'settings']] + \
          [('건물 ' + b, f"F.setTab('school'); F.openSheet('{b}')") for b in ['classroom', 'cafeteria', 'library', 'playground']]
async def run(b, lang, w, tier):
    ctx = await b.new_context(viewport={'width': w, 'height': 800}, device_scale_factor=1, is_mobile=True, has_touch=True)
    await ctx.add_init_script("window.__FOREST_TEST = true;")
    await ctx.add_init_script("if(!sessionStorage.getItem('seeded')){localStorage.setItem('forest-school-v1', %s);sessionStorage.setItem('seeded','1');}" % json.dumps(json.dumps(base(tier=tier, tg=2, students=60))))
    pg = await ctx.new_page()
    await pg.goto(f'http://127.0.0.1:{srv.server_address[1]}/dev/test.html?lang={lang}'); await pg.wait_for_timeout(1500); await pg.evaluate(CLEAN)
    res = {}
    for nm, js in SCREENS:
        try:
            await pg.evaluate(f"()=>{{ const F=window.__forest; {js}; }}"); await pg.wait_for_timeout(500)
            res[nm] = await pg.evaluate(FIND)
        except Exception as e: res[nm] = [{'k': 'ERR', 'why': str(e)[:60], 't': ''}]
        await pg.evaluate(CLEAN)
    await ctx.close(); return res
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); allr = []
        for tier in TIERS:
            for w in WS:
                ko = await run(b, 'ko', w, tier)
                kos = {(nm, x['k']) for nm, xs in ko.items() for x in xs}
                for lang in LANGS:
                    r = await run(b, lang, w, tier)
                    for nm, xs in r.items():
                        for x in xs:
                            if (nm, x['k']) in kos: continue
                            allr.append({'lang': lang, 'w': w, 'tier': tier, 'screen': nm, **x})
        await b.close()
    seen = {}
    for x in allr: seen.setdefault((x['k'], x['why']), []).append(x)
    print('넘침 칸', len(seen), '(전체', len(allr), ')')
    for (k, why), xs in sorted(seen.items(), key=lambda kv: -len(kv[1])):
        langs = sorted({f"{x['lang']}{x['w']}" for x in xs})
        print(f"  {why:4} {k} | {xs[0]['screen']} | {','.join(langs)} | {xs[0]['t']}")
    if OUT: pathlib.Path(OUT).write_text(json.dumps(allr, ensure_ascii=False, indent=1))
asyncio.run(main())
