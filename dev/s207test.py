# 207번 시험: 탐험 추천 강화 '한 번에'와 다른 말 번역 빈틈 메우기
# 1) 추천대로 한 번에(대원, 장비): 미리 보기 창에서 쓰는 도토리와 레벨이 보여 준 그대로 올라가고, 도토리와 재료는 음수가 되지 않아요
# 2) 미리 셈(tamRecPlan)은 도토리, 레벨, 장비, 재료를 그대로 두어요
# 3) 번역: 여러 줄 알림(모두 쓰다듬기), 앞뒤가 모두 자리인 무늬, 빈 자리('1분 동안'), 조각을 이어 붙인 글, 숫자에 붙은 조사(★18을 모아)
# 4) 꾸밈(CSS) 글(가졌어요 도장)과 가게 갈래 칩(테마, 이번 달)과 탐험 지역 이름(바퀴째), 실험 노트가 바뀌어요. 한국어는 그대로
# 이 시험은 사전을 받으려고 저장소 맨 위를 작은 웹 서버로 열어요
import asyncio, functools, http.server, json, pathlib, re, threading
from playwright.async_api import async_playwright
from testlib import base, Checker, CLEAN, F
c = Checker()
ROOT = pathlib.Path(__file__).resolve().parent.parent
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Q, directory=str(ROOT)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = f'http://127.0.0.1:{srv.server_address[1]}/dev/test.html'
HAN = re.compile('[가-힣]')
async def open_page(b, q, save):
    ctx = await b.new_context(viewport={'width': 390, 'height': 800}, device_scale_factor=1, is_mobile=True, has_touch=True)
    await ctx.add_init_script("window.__FOREST_TEST = true;")
    await ctx.add_init_script("if(!sessionStorage.getItem('seeded')){localStorage.setItem('forest-school-v1', %s);sessionStorage.setItem('seeded','1');}" % json.dumps(json.dumps(save)))
    pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(BASE + q); await pg.wait_for_timeout(1500)
    await pg.evaluate(CLEAN)
    return ctx, pg, errs
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        # 1), 2) 한국어에서 한 번에 올리기
        ctx, pg, errs = await open_page(b, '', base(tier=2, students=200))
        r = await pg.evaluate(f"""async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms)), o={{}};
          S.budget = 5e3 * F.tamLvCost(F.tamParty()[0]); S.tam.mat = [60, 60, 60, 9];
          const snap = () => JSON.stringify([S.budget, S.tam.mat, S.tam.sg, F.tamParty().map(k => F.tamMem(k).lv)]);
          const s0 = snap(); o.P = F.tamRecPlan('mem'); o.G = F.tamRecPlan('gear'); o.same = snap() === s0;
          F.setTab('tam'); await sl(900); document.querySelectorAll('.overlay').forEach(x=>{{x.hidden=true;x.classList.remove('open')}}); F.rt4.modalOpen=null;
          document.querySelector('#tmNav [data-tnav=mem]').click(); await sl(400);
          o.btn = !!document.querySelector('.tm-rec [data-trec=mem]') && !!document.querySelector('.tm-rec [data-tlv]');
          const b0 = S.budget, pw0 = F.tamPow();
          document.querySelector('[data-trec=mem]').click(); await sl(500);
          o.ask = document.querySelector('#adAskTitle').textContent;
          F.adAskDone(true); await sl(700);
          o.spent = b0 - S.budget; o.pw = [pw0, F.tamPow()]; o.left = S.budget;
          document.querySelector('[data-tseg=gear]').click(); await sl(300);
          o.gbtn = !!document.querySelector('.tm-rec [data-trec=gear]');
          const m0 = S.tam.mat.slice(); if (o.gbtn) {{ document.querySelector('[data-trec=gear]').click(); await sl(500); F.adAskDone(true); await sl(600); }}
          o.mat = [m0, S.tam.mat.slice()];
          return o; }}""")
        P = r['P']
        c.ok(r['same'], f'미리 셈은 아무것도 바꾸지 않아요 {r["same"]}')
        c.ok(P['n'] > 1 and P['cost'] > 0 and P['pw1'] > P['pw0'], f'대원 한 번에 계획 {P["n"]} {P["cost"]}')
        c.ok(r['btn'] and '한 번에' in r['ask'], f'추천 칸 두 단추와 미리 보기 창 {r["btn"]} {r["ask"]}')
        c.ok(r['spent'] > 0 and abs(r['spent'] - P['cost']) <= P['cost'] * 0.02 and r['left'] >= 0 and r['pw'][1] > r['pw'][0], f'보여 준 만큼 썼어요 {r["spent"]} {P["cost"]} {r["pw"]}')
        c.ok(r['gbtn'] and all(v >= 0 for v in r['mat'][1]) and sum(r['mat'][1]) < sum(r['mat'][0]), f'장비 한 번에 {r["gbtn"]} {r["mat"]}')
        c.ok(not errs, f'오류 {errs[:3]}')
        await ctx.close()
        # 3), 4) 다른 말
        S3 = ['토끼 솜이 하트 1칸! 숲의 정수 +2', '1분 동안 장난꾸러기 3마리를 달래 줬어요', '2시간 5분 동안 장난꾸러기 3마리를 달래 줬어요',
              '새 친구 고양이가 전학 왔어요! 앞으로 수업료 +5%. 황금 도토리 +1개도 받았어요. 이제 시설을 Lv.21까지 키울 수 있어요.',
              '위 학교는 평판 ★18을 모아 학교 옆에 버섯집 마을이 생겼기에 이 상장을 주어 「마을 학교」로 인정합니다.',
              '단짝 3명을 쓰다듬었어요 ♥\n토끼 솜이 하트 1칸!\n숲의 정수 +2', '노트 15/24', '4-1 학생 60명 맞이하기', '은 메달을 받았어요! 황금 도토리 +3']
        for L in ('en', 'ja', 'es'):
            ctx, pg, errs = await open_page(b, f'?lang={L}', base(tier=2, students=200))
            r = await pg.evaluate(f"""async(a)=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms)), o={{}};
              o.tr = a.map(s => F.trStr(s));
              F.setTab('shop'); await sl(600); o.chips = [...document.querySelectorAll('#panelShop [data-catgo]')].map(x => x.textContent);
              const st = document.getElementById('langCss'); o.css = st ? st.textContent : '';
              S.tam.best = Math.max(S.tam.best, 300); F.setTab('tam'); await sl(900); o.reg = document.querySelector('#tmReg').textContent;
              S.fr = S.fr || {{}}; for (const sp of ['bear','rabbit']) S.fr[sp] = {{ nm: '솜이', bm: 3, bd: 4, p: 2, pat: '', n: {{ pc: 0, bd: 0, el: 0 }} }};
              F.setTab('school'); await sl(300); F.frPatAll(); await sl(300); o.toast = document.querySelector('#toast').textContent;
              return o; }}""", S3)
            bad = [f'{s} → {t}' for s, t in zip(S3, r['tr']) if HAN.search(t)]
            c.ok(not bad, f'{L} 번역 빈틈 {bad}')
            c.ok(r['chips'] and not any(HAN.search(x) for x in r['chips']), f'{L} 가게 칩 {r["chips"]}')
            c.ok('si.own::after' in r['css'] and not HAN.search(r['css'].split('{content:')[1] if '{content:' in r['css'] else '가'), f'{L} 꾸밈 글 {r["css"][:120]}')
            c.ok(not HAN.search(r['reg']), f'{L} 탐험 지역 이름 {r["reg"]}')
            c.ok(not HAN.search(r['toast']), f'{L} 모두 쓰다듬기 알림 {r["toast"]}')
            c.ok(not errs, f'{L} 오류 {errs[:3]}')
            await ctx.close()
        # 한국어는 그대로
        ctx, pg, errs = await open_page(b, '', base(tier=2, students=200))
        r = await pg.evaluate(f"()=>{{ const F={F}; return [F.trStr('노트 15/24'), !!document.getElementById('langCss')]; }}")
        c.ok(r == ['노트 15/24', False], f'한국어 그대로 {r}')
        await ctx.close()
        await b.close()
    c.done()
asyncio.run(main())
