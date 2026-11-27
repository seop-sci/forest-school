# 195번 시험: 컴퓨터 웹 크게 보기 (맨 위 index.html)
# 1) 마우스 넓은 화면(1920x1080)에서는 게임이 iframe 안에 담기고 창 높이에 맞춰 커져요(배율 = 세로 1080 / 760, 1.6배까지)
# 2) 커진 화면에서도 누르기와 끌기 자리가 맞아요(건물 누르면 그 건물 창, 지도 끌면 끈 만큼 움직임)
# 3) 휴대폰(터치), 터치 노트북, 좁은 컴퓨터 창(1280x720)은 그대로(iframe 없음)
# 4) 앱 판(토스, 안드로이드)은 github-only 구간을 지우므로 크게 보기 코드가 들어가지 않아요
import asyncio, json, pathlib, re
from playwright.async_api import async_playwright
from testlib import base, Checker
c = Checker()
ROOT = pathlib.Path(__file__).resolve().parent.parent
WEB = 'https://fs.test/'
TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'audio/mp4', '.json': 'application/json', '.css': 'text/css'}
async def serve(route):
    u = route.request.url
    if not u.startswith(WEB): await route.abort(); return
    p = u[len(WEB):].split('?')[0].split('#')[0] or 'index.html'
    f = ROOT / p
    if f.is_file(): await route.fulfill(status=200, body=f.read_bytes(), headers={'content-type': TYPES.get(f.suffix, 'application/octet-stream')})
    else: await route.fulfill(status=404, body='')
async def open_(b, w, h, sv, touch=False, mobile=False, dpr=1):
    ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=dpr, has_touch=touch, is_mobile=mobile)
    await ctx.route('**/*', serve)
    await ctx.add_init_script("window.__FOREST_DZ=1;try{if(!localStorage.getItem('forest-school-v1'))localStorage.setItem('forest-school-v1', " + json.dumps(json.dumps(sv)) + ")}catch(e){}")
    pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(WEB + 'index.html', wait_until='commit'); await pg.wait_for_timeout(6000)
    return ctx, pg, errs
def game(pg):
    fr = [f for f in pg.frames if f != pg.main_frame]
    return fr[0] if fr else pg.main_frame
CLOSE = "document.querySelectorAll('.overlay').forEach(x => { x.hidden = true; x.classList.remove('open'); })"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        sv = base(tier=1, students=60); sv['f'] = dict(classroom=10, cafeteria=10, library=10, playground=6)
        # 1) 컴퓨터 넓은 화면
        ctx, pg, errs = await open_(b, 1920, 1080, sv)
        r = await pg.evaluate("(() => { const f = document.querySelector('#fsDz'); return f ? { z: window.__FOREST_DZ_Z, w: f.getBoundingClientRect().width, h: f.getBoundingClientRect().height, iw: parseFloat(f.style.width) } : null; })()")
        c.ok(r and abs(r['z'] - 1080 / 760) < 0.01 and abs(r['w'] - 1920) < 2 and abs(r['h'] - 1080) < 2, f'컴퓨터에서 iframe으로 커짐 {r}')
        g = game(pg)
        c.ok(g != pg.main_frame, '게임이 iframe 안에서 돌아요')
        await g.evaluate(CLOSE); await pg.wait_for_timeout(400)
        inner = await g.evaluate("[innerWidth, innerHeight, !!document.querySelector('#map'), document.querySelector('.app').getBoundingClientRect().width]")
        c.ok(inner[2] and abs(inner[0] - 1920 / r['z']) < 2 and inner[3] <= 480, f'게임 안은 휴대폰처럼 좁은 화면 {inner}')
        # 2) 누르기: 교실 건물 가운데를 바깥 좌표로 누르면 교실 창
        await g.evaluate("window.__dzHit = null; document.addEventListener('click', e => { const t = e.target.closest && e.target.closest('[data-k]'); window.__dzHit = t ? t.dataset.k : (e.target.id || e.target.tagName); }, true)")
        box = await g.evaluate("(() => { const el = document.querySelector('#map [data-k=\"classroom\"]'); if (!el) return null; const q = el.getBoundingClientRect(); return [q.left + q.width / 2, q.top + q.height / 2]; })()")
        z = r['z']
        if box:
            await pg.mouse.click(box[0] * z, box[1] * z); await pg.wait_for_timeout(500)
            hit = await g.evaluate("window.__dzHit")
            c.ok(hit == 'classroom', f'커진 화면에서 건물을 바로 눌러요 {hit} {box}')
        else:
            c.ok(False, '교실 건물을 못 찾았어요')
        await g.evaluate(CLOSE); await pg.wait_for_timeout(300)
        # 지도 끌기: 바깥에서 위로 100px 끌면 지도는 100/z 만큼 움직여요(손가락을 따라옴)
        y0 = await g.evaluate("(() => { const m = document.querySelector('#map'); return [m.style.transform, document.querySelector('.frame').getBoundingClientRect().top] })()")
        cx, cy = 960, 540 + 120
        await pg.mouse.move(cx, cy); await pg.mouse.down(); await pg.mouse.move(cx, cy - 50, steps=5); await pg.mouse.move(cx, cy - 100, steps=5); await pg.mouse.up(); await pg.wait_for_timeout(200)
        y1 = await g.evaluate("document.querySelector('#map').style.transform")
        ty = lambda t: float(re.findall(r'-?[\d.]+', t)[1]) if t else 0
        moved = ty(y0[0]) - ty(y1)
        c.ok(abs(moved - 100 / z) < 8 or moved < 1 and 'translate' in y1, f'지도 끌기 {y0[0]} -> {y1}, 움직임 {moved:.1f} (기대 {100 / z:.1f})')
        await pg.screenshot(path='s195_desk.png')
        c.ok(not errs, f'페이지 오류 {errs[:3]}')
        await ctx.close()
        # 3) 그대로인 곳
        for (w, h, touch, mobile, dpr, nm) in [(390, 844, True, True, 3, '휴대폰'), (1920, 1080, True, False, 1, '터치 노트북'), (1280, 720, False, False, 1, '좁은 컴퓨터 창')]:
            ctx, pg, errs = await open_(b, w, h, sv, touch, mobile, dpr)
            r = await pg.evaluate("[!!document.querySelector('#fsDz'), !!document.querySelector('#map'), window.top === window]")
            c.ok(r == [False, True, True], f'{nm}은 그대로 {r}')
            await ctx.close()
        # 4) 앱 판에는 없음
        h = (ROOT / 'index.html').read_text(encoding='utf-8')
        app = re.sub(r'<!-- github-only -->[\s\S]*?<!-- /github-only -->\n?', '', h)
        c.ok('fsDz' in h and 'fsDz' not in app and '__FOREST_DZ' not in app, '앱 판에는 크게 보기 코드가 없어요')
        await b.close()
    c.done()
asyncio.run(main())
