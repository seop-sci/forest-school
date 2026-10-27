# 1.8.1 시험: 공지사항 (설정 > 공지사항, 접속하면 새 공지 창, 일주일간 열지 않기, 업데이트 뒤 한 번)
# (1) 설정 줄을 누르면 공지 창이 열리고 1.8.0 업데이트 7줄이 보여요. 열면 빨간 점이 사라져요
# (2) 접속할 때: 처음 띄우면 '일주일간 열지 않기' 단추가 보이고, 누르면 7일 쉬어요. 쉬는 동안은 안 떠요
# (3) 업데이트한 뒤(버전이 바뀜) 첫 접속에는 쉬는 중이어도 한 번 떠요. 새 공지가 올라와도 떠요. 오래된 공지(7일 넘음)는 안 떠요
# (4) 처음 시작한 학교는 튜토리얼이 먼저라 띄우지 않고 본 것으로 쳐요
# (5) 저장: 옛 저장(nt 없음)은 기본값, 망가진 값은 바로잡기
# (6) 화면: 360px 어두운, 390px 밝은 화면에서 공지 창이 넘치지 않아요
# 쓰는 법: python3 wrap.py && python3 s68test.py   (마지막 줄이 PASS면 통과)
import asyncio, json
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"

async def boot(ctx):
    pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(URL); await pg.wait_for_timeout(3000)
    await pg.evaluate(f"(()=>{{ const F={F}, S=F.S; const t=document.querySelector('#tut'); if(t) t.hidden=true; S.tut.st='skip'; F.rt.tut=null; {CLEAN}; }})()")
    return pg, errs

async def main():
    fails = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
        pg, errs = await boot(ctx)
        # (1)
        r = await pg.evaluate(f"""(async()=>{{ const F={F}, S=F.S; S.nt = {{ seen: '', ver: '', hide: 0 }}; F.setTab('settings'); await new Promise(r=>setTimeout(r,200));
          const dot0 = !document.querySelector('#ntDot').hidden; document.querySelector('#optNotice').click(); await new Promise(r=>setTimeout(r,300));
          const m = document.querySelector('#mNotice'); const out = {{ dot0, open: !m.hidden, li: m.querySelectorAll('.nt-item[open] li').length, hide: !document.querySelector('#ntHide').hidden, seen: S.nt.seen === F.NOTICES[0].id, dot1: !document.querySelector('#ntDot').hidden }};
          document.querySelector('#ntClose').click(); await new Promise(r=>setTimeout(r,300)); out.closed = m.hidden; F.setTab('school'); return out; }})()""")
        if r != {'dot0': True, 'open': True, 'li': 7, 'hide': False, 'seen': True, 'dot1': False, 'closed': True}: fails.append(f'설정에서 열기 {r}')
        # (2)(3)
        r = await pg.evaluate(f"""(async()=>{{ const F={F}, S=F.S, out={{}}; window.__NOTICE_AUTO = true; S.tut.st = 'done'; S.q.m = 10;
          S.nt = {{ seen: F.NOTICES[0].id, ver: '1.7.4', hide: 0 }};
          out.want1 = F.noticeWant(); F.noticeAuto(); await new Promise(r=>setTimeout(r,400));
          out.open = !document.querySelector('#mNotice').hidden; out.hideBtn = !document.querySelector('#ntHide').hidden;
          document.querySelector('#ntHide').click(); await new Promise(r=>setTimeout(r,300));
          out.days = Math.round((S.nt.hide - Date.now()) / 86400000); out.ver = S.nt.ver;
          out.want2 = F.noticeWant();   // 쉬는 중
          S.nt.ver = '1.7.0'; out.want3 = F.noticeWant(); S.nt.ver = out.ver;   // 업데이트 뒤
          S.nt.seen = 'old'; out.want4 = F.noticeWant(); S.nt.seen = F.NOTICES[0].id;   // 새 공지
          S.nt.hide = 0; const d0 = F.NOTICES[0].date; F.NOTICES[0].date = '2026-01-01'; out.want5 = F.noticeWant(); F.NOTICES[0].date = d0;   // 오래된 공지
          // (4) 처음 시작한 학교
          S.nt = {{ seen: '', ver: '', hide: 0 }}; S.tut.st = ''; S.q.m = 0; F.noticeAuto(); await new Promise(r=>setTimeout(r,300));
          out.newbie = [document.querySelector('#mNotice').hidden, S.nt.seen === F.NOTICES[0].id, S.nt.ver];
          window.__NOTICE_AUTO = false; S.tut.st = 'skip'; return out; }})()""")
        ver = await pg.evaluate("document.querySelector('#verRow dd').textContent.slice(1)")
        exp = {'want1': True, 'open': True, 'hideBtn': True, 'days': 7, 'ver': ver, 'want2': False, 'want3': True, 'want4': True, 'want5': False, 'newbie': [True, True, ver]}
        if r != exp: fails.append(f'접속할 때 공지 {r}')
        # (5)
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S; const d = JSON.parse(JSON.stringify(S)); delete d.nt; const a = F.sanitize(d).nt;
          d.nt = {{ seen: 5, ver: {{}}, hide: 1e15 }}; const b = F.sanitize(d).nt; return [a, b.seen, b.ver, b.hide <= Date.now() + 8 * 86400000]; }})()""")
        if r != [{'seen': '', 'ver': '', 'hide': 0}, '', '', True]: fails.append(f'저장 {r}')
        if errs: fails.append(f'오류 {errs}')
        # (6)
        for w, dark in ((360, True), (390, False)):
            c2 = await b.new_context(viewport={'width': w, 'height': 760}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme='dark' if dark else 'light')
            await c2.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
            pg2, e2 = await boot(c2)
            await pg2.evaluate(f"(()=>{{ {F}.S.nt = {{ seen: '', ver: '', hide: 0 }}; {F}.openNotice(true); }})()"); await pg2.wait_for_timeout(400)
            r = await pg2.evaluate("""(()=>{ const s = document.querySelector('#mNotice .modal'), sr = s.getBoundingClientRect(); const over = [...s.querySelectorAll('*')].filter(el => { const r = el.getBoundingClientRect(); return r.width && (r.right > sr.right + 1 || r.left < sr.left - 1); }).map(el => el.className || el.tagName); return { over, top: sr.top, bottom: sr.bottom, h: innerHeight }; })()""")
            await pg2.screenshot(path=f's68_notice_{w}.png')
            if r['over'] or r['top'] < 0 or r['bottom'] > r['h']: fails.append(f'{w}px 공지 창 {r}')
            if e2: fails.append(f'{w}px 오류 {e2}')
            await c2.close()
        await b.close()
    print('\n'.join(fails) if fails else 'PASS')

asyncio.run(main())
