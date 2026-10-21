# 시험 화면에서도 진짜 게임 글꼴(주아, 개구, 고운돋움, 고운바탕)이 보이게 npm의 fontsource 파일로 구글 글꼴 요청에 답해요
import pathlib, re
FD = pathlib.Path(__file__).resolve().parent / 'fonts' / 'node_modules' / '@fontsource'
SHEETS = [('jua', '400'), ('gaegu', '400'), ('gaegu', '700'), ('gowun-dodum', '400'), ('gowun-batang', '400'), ('gowun-batang', '700')]

def font_css():
    out = []
    for pkg, w in SHEETS:
        css = (FD / pkg / f'{w}.css').read_text(encoding='utf-8')
        out.append(re.sub(r"url\(\./files/([^)]+)\)", lambda m: f"url(https://fonts.gstatic.com/fs/{pkg}/{m.group(1)})", css))
    return '\n'.join(out)
CSS = font_css()

async def add_font_routes(ctx):
    await ctx.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=CSS))
    async def files(route):
        m = re.search(r'/fs/([^/]+)/([^/?]+)$', route.request.url)
        f = FD / m.group(1) / 'files' / m.group(2) if m else None
        if not f or not f.exists():
            return await route.abort()
        await route.fulfill(status=200, body=f.read_bytes(), headers={'content-type': 'font/woff2' if f.suffix == '.woff2' else 'font/woff', 'access-control-allow-origin': '*'})
    await ctx.route('https://fonts.gstatic.com/fs/**', files)
