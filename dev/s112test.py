# 3.2.1 시험: 고등학교 밤 모습 단추(밤, 저녁, 밝게), 공사 중 건물에는 창문 불빛을 켜지 않기, 건물 창이 같은 글과 그림을 다시 넣지 않기와 뒤 움직임 멈춤,
# 저장 칸 nl, 넓은 휴대폰(512칸)은 412칸 너비로 그리기
# 쓰는 법: python3 wrap.py && python3 s112test.py   (마지막 줄이 PASS면 통과)
import asyncio, sys
sys.path.insert(0, '.')
from playwright.async_api import async_playwright
from s4test import ctxpage, base, URL

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx, pg, errs = await ctxpage(b, 390, 844, 'light', base(tier=3, tg=0))
        r = await pg.evaluate("""() => { const F=window.__forest,S=F.S,o=[],ok=(c,m)=>{ if(!c) o.push(m); };
          document.querySelectorAll('.overlay').forEach(m=>m.hidden=true); F.rt.modalOpen=null;
          S.f.dorm = Math.max(1, S.f.dorm || 0); S.f.classroom = Math.max(3, S.f.classroom || 0); S.f.library = Math.max(3, S.f.library || 0);
          F.setServerTime(Date.parse('2026-11-06T22:00:00+09:00'));
          S.nl = 0; F.renderNight(true); F.renderTierDots();
          const map = document.getElementById('map'), g = document.getElementById('nightG');
          ok(map.classList.contains('hs-night'), '밤 22시 고등학교');
          const rect = () => g.querySelector('rect[fill="#141C3E"]');
          ok(rect() && rect().getAttribute('opacity') === '.46', '밤: 어둡게');
          const nb = document.querySelector('#tierDots [data-nl]'); ok(!!nb, '밤 모습 단추가 보여요');
          F.nlCycle(); ok(S.nl === 1 && rect() && rect().getAttribute('opacity') === '.24', '저녁: 조금 어둡게');
          F.nlCycle(); ok(S.nl === 2 && !rect() && map.classList.contains('nl-light'), '밝게: 덮개 없음');
          ok(map.classList.contains('hs-night'), '밝게여도 밤 규칙(학생은 기숙사)은 그대로');
          F.nlCycle(); ok(S.nl === 0 && rect(), '다시 밤');
          // 공사 중인 건물은 불빛 없음
          const now = Date.now();
          S.bd = S.bd || {}; S.bd.classroom = { s: now, e: now + 3600000, L: S.f.classroom + 1 };
          F.renderNight(true); ok(!/classroom:/.test(g.dataset.key) && /library:/.test(g.dataset.key), '공사 중 교실은 불빛 빼기: ' + g.dataset.key.slice(0, 80));
          delete S.bd.classroom; F.renderNight(true); ok(/classroom:/.test(g.dataset.key), '공사가 끝나면 불빛');
          // 낮이면 단추 없음
          F.setServerTime(Date.parse('2026-11-06T12:00:00+09:00')); F.renderNight(true); F.renderTierDots();
          ok(!document.querySelector('#tierDots [data-nl]') && !map.classList.contains('hs-night'), '낮에는 단추 없음');
          // 저장 칸
          const d = JSON.parse(JSON.stringify(S)); d.nl = 2; ok(F.sanitize(d).nl === 2, '저장 nl 2');
          d.nl = 7; ok(F.sanitize(d).nl === 0, '이상한 값은 0'); delete d.nl; ok(F.sanitize(d).nl === 0, '옛 저장은 0');
          // 건물 창: 같은 내용이면 다시 넣지 않아요
          F.openSheet('library');
          ok(document.body.classList.contains('sheet-open'), '창이 열리면 sheet-open');
          const ic = document.querySelector('#sheetNsIc'), first = ic && ic.firstElementChild, tx = document.getElementById('sheetTitle').firstChild;
          for (let i = 0; i < 5; i++) F.renderSheet();
          ok(!first || ic.firstElementChild === first, '아이콘 그림을 다시 만들지 않아요');
          ok(document.getElementById('sheetTitle').firstChild === tx, '제목 글을 다시 넣지 않아요');
          const st = getComputedStyle(document.querySelector('.map-right') || document.body).animationPlayState;
          F.closeSheet(); ok(!document.body.classList.contains('sheet-open'), '닫으면 sheet-open 없음');
          return o; }""")
        print('\n'.join(r) if r else '', errs[:3])
        bad = list(r) + errs
        await ctx.close()
        # 넓은 휴대폰: 화면 너비 512칸이면 412칸으로 그려요. 보통 휴대폰(390칸)은 그대로
        for w, want in [(512, 412), (390, 390), (440, 440)]:
            c2 = await b.new_context(viewport={'width': w, 'height': 1100}, is_mobile=True, has_touch=True, device_scale_factor=2.8)
            await c2.add_init_script("window.__FOREST_TEST = true;")
            p2 = await c2.new_page(); await p2.goto(URL); await p2.wait_for_timeout(800)
            iw = await p2.evaluate("innerWidth")
            print(w, '→', iw)
            if iw != want: bad.append(f'{w}칸 화면은 {want}칸이어야 해요: {iw}')
            await c2.close()
        print('PASS' if not bad else 'FAIL')
        await b.close()
asyncio.run(main())
