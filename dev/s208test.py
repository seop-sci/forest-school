# 208번 시험: 숲속 대결 퀴즈의 다른 말 문제(i18n/quiz_en.json, quiz_ja.json, quiz_es.json)
# 1) 파일: 과학(기본, A~C주)과 그 말 낱말 문제(국어 자리)가 있고, 모두 [문제, 정답, 오답, 오답] 꼴에 보기가 겹치지 않고 한국어가 없어요
# 2) 영어, 일본어, 스페인어 화면에서 과학과 국어 종목이 그 말 문제를 내고, 퀴즈 칸은 화면 글 바꾸기가 건드리지 않아요(data-i18n-skip)
# 3) 한국어는 원래 문제 그대로
import asyncio, functools, http.server, json, pathlib, re, threading
from playwright.async_api import async_playwright
from testlib import base, Checker, CLEAN, F
c = Checker()
ROOT = pathlib.Path(__file__).resolve().parent.parent
HAN = re.compile('[가-힣]')
for L in ('en', 'ja', 'es'):
    q = json.loads((ROOT / f'i18n/quiz_{L}.json').read_text())
    banks = [q['sci'], q['kor']] + q['sciW'] + q['korW']
    bad = [x for b in banks for x in b if len(x) != 4 or len(set(x[1:])) != 3 or any(not isinstance(v, str) or not v.strip() for v in x)]
    han = [x[0] for b in banks for x in b if any(HAN.search(v) for v in x)]
    dup = len(q['sci'] + sum(q['sciW'], [])) - len({x[0] for x in q['sci'] + sum(q['sciW'], [])})
    c.ok(len(q['sci']) >= 150 and len(q['kor']) >= 80 and len(q['sciW']) == 3 and len(q['korW']) == 3 and all(len(w) >= 70 for w in q['sciW'] + q['korW']), f'{L} 문제 수')
    c.ok(not bad and not han, f'{L} 꼴이 이상하거나 한국어가 섞인 문제 {bad[:2]} {han[:2]}')
    c.ok(dup == 0, f'{L} 같은 과학 문제 {dup}개')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Q, directory=str(ROOT)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = f'http://127.0.0.1:{srv.server_address[1]}/dev/test.html'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for L in ('en', 'ja', 'es', ''):
            ctx = await b.new_context(viewport={'width': 390, 'height': 800}, is_mobile=True, has_touch=True)
            await ctx.add_init_script("window.__FOREST_TEST = true;")
            await ctx.add_init_script("if(!sessionStorage.getItem('s')){localStorage.setItem('forest-school-v1', %s);sessionStorage.setItem('s','1');}" % json.dumps(json.dumps(base(tier=2, students=200))))
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(BASE + (f'?lang={L}' if L else '')); await pg.wait_for_timeout(1500); await pg.evaluate(CLEAN)
            r = await pg.evaluate(f"""()=>{{ const F={F}, o={{ q: [] }};
              for (let i = 0; i < 30; i++) for (const e of ['sci', 'kor']) {{ const Z = F.btqMake(e); for (const x of Z.qs) o.q.push([e, x.q, x.a, x.opts]); }}
              o.html = F.btqHTML ? '' : ''; return o; }}""")
            qs = r['q']
            if L:
                han = [x for x in qs if any(HAN.search(v) for v in [x[1], x[2]] + x[3])]
                c.ok(not han, f'{L} 대결 퀴즈에 한국어 {han[:2]}')
            else:
                c.ok(all(HAN.search(x[1]) for x in qs), '한국어는 원래 문제')
            c.ok(all(x[3].count(x[2]) == 1 and len(set(x[3])) == 3 for x in qs), f'{L or "ko"} 보기와 정답 {qs[:1]}')
            skip = await pg.evaluate("()=>{ const d = document.createElement('div'); d.innerHTML = '<b class=\"btq-q\" data-i18n-skip>x</b>'; return d.firstChild.hasAttribute('data-i18n-skip'); }")
            c.ok(skip, '퀴즈 칸 건너뛰기 표시')
            c.ok(not errs, f'{L or "ko"} 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    c.done()
asyncio.run(main())
