# 145번 시험(5.0.2 앱 용량): 앱 묶음에서 뺀 것(저화질 지도, 이야기 그림, 테마 곡과 행사 곡, 졸업식 그림)을 웹에서 받고, 못 받으면 대신 동작이 나와요
# 실제 앱 묶음(app/www)을 작은 서버로 열어서 봐요. 웹 주소(WEB_ROOT)로 가는 요청은 저장소 파일로 대신 답하거나(인터넷 있음) 끊어요(인터넷 없음).
#  1) 묶음: 뺀 파일이 없고 남길 파일은 있어요(app/www, toss/dist)
#  2) 인터넷 있음: 테마 지도, 이야기 그림, 테마 곡, 졸업식 그림이 와요. 묶음 안에 없는 파일을 찾는 요청(404)이 없어요. 받은 파일이 기기 저장(Cache Storage)에 남아요
#  3) 받아 둔 뒤 인터넷 없음: 기기 저장에서 테마 지도와 이야기 그림이 나와요
#  4) 처음부터 인터넷 없음: 기본 지도, 그림 없는 이야기(대사만), 홈 곡, 예전 졸업식 장면
# 쓰는 법: python3 build_gh.py .. && (cd ../app && npm ci && node build-www.mjs) 뒤  python3 s145test.py   (묶음이 없으면 SKIP)
import asyncio, functools, http.server, json, pathlib, re, sys, threading, time
from playwright.async_api import async_playwright
from testlib import base, F
ROOT = pathlib.Path(__file__).resolve().parent.parent
WWW = ROOT / 'app' / 'www'
WEB = 'https://seop-sci.github.io/forest-school/'
TH = re.compile(r'_(spring|summer|autumn|winter|xmas|space|retro)\.webp$')
WEB_AUD = re.search(r"const WEB_AUD = new Set\(\[([^\]]+)\]\)", (ROOT / 'dev' / 'forest-school.html').read_text(encoding='utf-8')).group(1).replace("'", '').replace(' ', '').split(',')
bad = []
def ok(c, msg):
    if not c: bad.append(msg); print('  틀림:', msg)

def pack_check(d):
    if not d.exists(): print('묶음 없음(건너뜀):', d); return
    a = [f.name for f in (d / 'img' / 'a').iterdir()]
    ok(not [n for n in a if n.startswith('map_')], f'{d.name}: 저화질 지도가 없어요')
    ok(len(a) > 1500, f'{d.name}: 그 밖의 그림은 있어요 {len(a)}')
    for sub in ('story', 'cere', 'cere3'): ok(not (d / 'img' / sub).exists(), f'{d.name}: img/{sub}가 없어요')
    maps = [f.name for f in (d / 'img' / 'maps').iterdir()]
    ok(not [n for n in maps if TH.search(n)] and all((d / 'img' / 'maps' / f'map_{k}.webp').exists() for k in ('kinder', 'elem', 'middle', 'high', 'kinder_lux', 'campus', 'campus_grad', 'zone_lab')), f'{d.name}: 테마 지도는 없고 기본 지도는 있어요')
    aud = sorted(f.stem for f in (d / 'audio').iterdir())
    ok(not set(aud) & set(WEB_AUD) and {'bgm_home', 'bgm_room', 'bgm_play', 'bgm_ex_day'} <= set(aud), f'{d.name}: 웹에서 받는 곡은 없고 늘 쓰는 곡은 있어요 {aud}')
    # 게임이 고르는 기본 지도 열쇠마다 묶음에 고화질 파일이 있어야 해요(앱은 저화질 대신 이것을 써요)
    src = (ROOT / 'dev' / 'forest-school.html').read_text(encoding='utf-8')
    keys = set(re.findall(r"map: '(map_[a-z_]+)'", src))
    miss = [k for k in keys if not (d / 'img' / 'maps' / f'{k}.webp').exists()]
    ok(not miss, f'{d.name}: 지도 열쇠마다 고화질 파일 {miss}')
    size = sum(f.stat().st_size for f in d.rglob('*') if f.is_file())
    print(f'{d.parent.name}/{d.name}: {size / 1e6:.1f}MB, img/a {len(a)}장, 지도 {len(maps)}장, 곡 {len(aud)}개')

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def handle(self):
        try: super().handle()
        except (BrokenPipeError, ConnectionResetError): pass

async def open_page(b, port, online, miss, got, ctx=None):
    if not ctx:
        ctx = await b.new_context(viewport={'width': 390, 'height': 800}, device_scale_factor=2, is_mobile=True, has_touch=True)
        save = base(tier=1, tg=1, bgm=True)
        await ctx.add_init_script("window.__FOREST_TEST = true; window.__STORY_AUTO = false;")
        await ctx.add_init_script("if(!localStorage.getItem('forest-school-v1')) localStorage.setItem('forest-school-v1', %s);" % json.dumps(json.dumps(save)))
    state = {'on': online}
    async def web(route):
        if not state['on']: await route.abort('internetdisconnected'); return
        f = ROOT / route.request.url[len(WEB):].split('?')[0]
        got.append(route.request.url[len(WEB):])
        if f.is_file(): await route.fulfill(status=200, body=f.read_bytes(), headers={'access-control-allow-origin': '*', 'content-type': 'audio/mp4' if f.suffix == '.mp4' else 'image/webp', 'cache-control': 'max-age=600'})
        else: await route.fulfill(status=404, body='', headers={'access-control-allow-origin': '*'})
    await ctx.unroute_all() if ctx.pages else None
    await ctx.route(WEB + '**', web)
    await ctx.route(re.compile(r'^https://(?!seop-sci\.github\.io)'), lambda r: r.abort())   # Firebase, 광고 같은 바깥 주소는 끊어요
    page = ctx.pages[0] if ctx.pages else await ctx.new_page()
    page.on('response', lambda r: miss.append(r.url) if r.status == 404 and '127.0.0.1' in r.url and not r.url.endswith(('favicon.ico', 'config.js')) else None)
    errs = []; page.on('pageerror', lambda e: errs.append(str(e)))
    await page.goto(f'http://127.0.0.1:{port}/index.html'); await page.wait_for_timeout(2500)
    await page.evaluate("(()=>{ const n=document.querySelector('#mNotice'); if(n&&!n.hidden) document.querySelector('#ntClose').click(); })()")
    return ctx, page, state, errs

PROBE = f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms)), q=s=>document.querySelector(s), out={{}};
  out.app = F.APP_PACK(); out.cache = F.webCacheOk();
  // 지도: 봄 테마
  S.cos.th = Object.assign({{}}, S.cos.th, {{ bg: 'spring' }}); F.applyThemes(); F.setMapArt(); await sl(1500);
  const el = q('#mapImg1'); out.mapKey = F.mapKey('map_elem'); out.mapHref = el.getAttribute('href'); out.mapDs = el.dataset.key; out.mapSt = F.mapHi['map_elem_spring'];
  out.mapShown = await new Promise(r => {{ const im = new Image(); im.onload = () => r(im.naturalWidth); im.onerror = () => r(0); im.src = out.mapHref; }});
  out.backdrop = getComputedStyle(q('.frame')).getPropertyValue('--map-bg').slice(0, 60);
  // 이야기: 1장 여는 장면(그 장면만의 그림이 없어 장 그림으로), 2장 닫는 장면
  out.stUrl = F.stPicUrl('st_ch01');
  F.rt.st = null; F.stPlay('o1', true); await sl(1200);
  out.stOpen = !q('#mSt').hidden; out.stPic = !q('#stPic').hidden && !!q('#stPic img') && q('#stPic img').naturalWidth; out.stLine = (q('#stTx') || q('.sy-tx') || q('#mSt')).textContent.trim().length;
  q('#stSkip').click(); await sl(300);
  // 곡: 테마 곡
  F.ensureAudio(true); const buf = await F.bgmLoad('bgm_spring'); out.song = buf ? +buf.duration.toFixed(1) : null; out.webAud = [F.webAud('bgm_spring'), F.webAud('bgm_home')];
  F.setTab('school'); F.Music.cur = ''; F.musicSync(); await sl(1500); out.music = {{ cur: F.Music.cur, file: !!F.Music.src, dur: F.Music.src && F.Music.src.buffer ? +F.Music.src.buffer.duration.toFixed(1) : 0, synth: !!F.Music.track }};
  // 졸업식 그림
  F.cere3.st = ''; F.cere3Load(); await sl(1500); out.c3 = F.cere3.st; out.c3u = F.c3u('podium').slice(0, 5);
  out.keys = out.cache ? (await (await caches.open('fs-web-1')).keys()).map(r => r.url.replace(F.WEB_ROOT, '')) : [];
  return out; }})()"""

async def main():
    for d in (WWW, ROOT / 'toss' / 'dist'): pack_check(d)
    if not WWW.exists(): print('SKIP app/www가 없어요(먼저 앱 묶음을 만들어요)'); return
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=str(WWW)))
    port = srv.server_address[1]; threading.Thread(target=srv.serve_forever, daemon=True).start()
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        # 2) 인터넷 있음
        miss, got = [], []
        ctx, page, state, errs = await open_page(b, port, True, miss, got)
        r = await page.evaluate(PROBE); print('인터넷 있음', {k: v for k, v in r.items() if k != 'keys'}, '저장', len(r['keys']), r['keys'][:40])
        ok(r['app'], '앱 묶음으로 알아봐요')
        ok(r['mapKey'] == 'map_elem_spring' and r['mapSt'] == 'ok' and r['mapShown'] >= 1000, '테마 지도가 고화질로 와요')
        ok(any(u.startswith('img/maps/map_elem_spring.webp') for u in got), '테마 지도는 웹에서')
        ok(r['stOpen'] and r['stPic'] and r['stLine'] > 0, '이야기 그림이 와요')
        ok(re.fullmatch(re.escape(WEB) + r'img/story/st_ch01-[0-9a-f]{10}\.webp', r['stUrl']), f"이야기 그림 주소는 웹의 해시 이름 {r['stUrl']}")
        st = [u for u in got if u.startswith('img/story/')]
        ok(st and all(re.search(r'-[0-9a-f]{10}\.webp$', u) for u in st) and not any(re.search(r'_o-', u) for u in st), f'없는 그림을 찾지 않아요 {st}')
        ok(r['song'] and r['webAud'] == [True, False] and r['music'] == {'cur': 'spring', 'file': True, 'dur': r['song'], 'synth': False}, f"테마 곡이 와요 {r['music']}")
        ok(r['c3'] == 'ok', '졸업식 그림이 와요')
        ok(not miss, f'묶음에 없는 파일을 찾지 않아요 {miss[:5]}')
        ok(not [u for u in got if not (ROOT / u.split("?")[0]).is_file()], '웹에 없는 파일을 찾지 않아요')
        if r['cache']:
            ok(any('map_elem_spring' in k for k in r['keys']) and any('story/st_ch0' in k for k in r['keys']) and any('bgm_spring' in k for k in r['keys']) and any('cere3_podium' in k for k in r['keys']), f"받은 파일이 기기 저장에 남아요 {len(r['keys'])}")
            ok(r['mapHref'].startswith('blob:') and r['c3u'] == 'blob:', '기기 저장에서 꺼낸 그림을 써요')
        else: print('  이 브라우저는 Cache Storage를 못 써서 3)은 건너뛰어요')
        ok(not errs, f'오류 없음 {errs[:2]}')
        # 3) 받아 둔 뒤 인터넷 없음(같은 기기)
        if r['cache']:
            miss2, got2 = [], []
            state['on'] = False
            await page.reload(); await page.wait_for_timeout(2500)
            r2 = await page.evaluate(PROBE); print('받아 둔 뒤 인터넷 없음', {k: v for k, v in r2.items() if k != 'keys'})
            ok(r2['mapSt'] == 'ok' and r2['mapShown'] >= 1000 and r2['stPic'] and r2['song'] and r2['c3'] == 'ok', '받아 둔 지도, 이야기 그림, 곡, 졸업식 그림은 인터넷 없이도 나와요')
        await ctx.close()
        # 4) 처음부터 인터넷 없음
        miss, got = [], []
        ctx, page, state, errs = await open_page(b, port, False, miss, got)
        r = await page.evaluate(PROBE); print('인터넷 없음', {k: v for k, v in r.items() if k != 'keys'})
        ok(r['mapSt'] == 'no' and r['mapKey'] == 'map_elem' and r['mapDs'] == 'map_elem' and r['mapHref'].startswith('img/maps/map_elem.webp') and r['mapShown'] >= 1000, '테마 지도를 못 받으면 묶음 안 기본 지도')
        ok('img/maps/map_elem.webp' in r['backdrop'], f"지도 뒤 배경도 기본 지도 {r['backdrop']}")
        ok(r['stOpen'] and not r['stPic'] and r['stLine'] > 0, '이야기는 그림 없이 대사만')
        ok(r['song'] is None and r['music']['cur'] == 'spring' and r['music']['file'] and not r['music']['synth'] and abs(r['music']['dur'] - 79.5) < 0.3, f"테마 곡을 못 받으면 홈 곡 {r['music']}")
        ok(r['c3'] == 'no', '졸업식 그림을 못 받으면 예전 장면 갈래')
        # 예전 졸업식 장면이 오류 없이 그려져요
        c = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms)); document.querySelectorAll('.overlay').forEach(o=>{{o.hidden=true;o.classList.remove('open')}}); F.rt.modalOpen=null; F.rt.modalQueue.length=0;
          const crew = ['rabbit', 'bear', 'cat']; crew.c3 = F.cere3Info ? F.cere3Info() : {{}}; F.showCere({{ name: '초등학교', school: '숲속 초등학교' }}, crew); await sl(900);
          const a = document.querySelector('#cereArt'), m = document.querySelector('#mCere'); return {{ open: !m.hidden, v2: m.classList.contains('v2'), v3: m.classList.contains('v3'), n: a ? a.children.length : 0, bg: (a.querySelector('image') || {{ getAttribute: () => '' }}).getAttribute('href') }}; }})()""")
        print('예전 졸업식 장면', c); ok(c['open'] and c['v2'] and not c['v3'] and c['n'] > 0, '예전 졸업식 장면이 나와요')
        ok(not miss, f'묶음에 없는 파일을 찾지 않아요 {miss[:5]}'); ok(not errs, f'오류 없음 {errs[:2]}')
        await ctx.close(); await b.close()
    srv.shutdown()
    print('PASS' if not bad else f'FAIL {len(bad)}')
    sys.exit(1 if bad else 0)
asyncio.run(main())
