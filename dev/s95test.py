# 2.2.0 시험: 숲속 생물 탐사
# 보는 것
#  1) 유치원에는 없고 초등학교부터. 게임 시계 2시간마다 한 마리, 최대 3마리, 자리 비운 동안 몫도 그때 시각으로
#  2) 조건: 물가 자리에는 물가 생물만, 계절(여름 매미, 가을 단풍잎), 밤 20~24시(반딧불이, 하늘다람쥐), 비(달팽이, 도롱뇽)
#  3) 관찰: 처음 과학 XP 10과 정수 1, 다시 보면 XP 3과 도토리. 10종 황금 1, 20종 정수 20, 30종 관찰 오두막 장식
#  4) 지도에 흔들리는 풀숲 표시와 누르기, 관찰 카드 창, 도감 '생물' 칸 30칸
#  5) 메인 퀘스트 bx1, bx2(초등 5장), 패스 미션 bx, 업적 bio, 저장 읽기
#  6) 390 밝은, 360 어두운 화면 넘침 없음, 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s95test.py   (마지막 줄이 PASS면 통과)
import asyncio
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
SKIP = f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {CLEAN}; }})()"
OVER = """(sel => { const out = []; document.querySelectorAll(sel).forEach(el => { const r = el.getBoundingClientRect(); if (r.width && (r.right > innerWidth + 1 || r.left < -1 || el.scrollWidth > el.clientWidth + 2)) out.push((el.id || el.className) + ' ' + Math.round(r.left) + '~' + Math.round(r.right)); }); return out; })"""
# 한국 시간 (월, 일, 시, 분)
K = "((mo, d, h, m) => Date.UTC(2026, mo - 1, d, h - 9, m || 0))"
H = 3600000


async def main():
    bad = []

    def ok(c, msg):
        if not c:
            bad.append(msg); print('  틀림:', msg)

    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, scheme in ((390, 'light'), (360, 'dark')):
            ctx = await b.new_context(viewport={'width': w, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme=scheme)
            await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(2500); await pg.evaluate(SKIP)
            ev = lambda js: pg.evaluate(f"(() => {{ const F = {F}, S = F.S, K = {K}, H = {H}; {js} }})()")
            if w == 390:
                # 2) 조건 (뽑기 대신 exOk로)
                r = await ev("""const ok = (k, t, w) => F.bxOk(F.BIO_BY['bio_' + k], t, w);
                  const day = K(11, 3, 14), night = K(11, 3, 21), sum = K(7, 10, 14);
                  let rain = null; for (let d = 1; d <= 28; d++) { const s = `2026-11-${String(d).padStart(2, '0')}`; if (F.wxOf(s) === 'rain') { rain = K(11, d, 14); break; } }
                  return { strider_w: ok('waterstrider', day, 1), strider_l: ok('waterstrider', day, 0), lady_w: ok('ladybug', day, 1), cicada_nov: ok('cicada', day, 0), cicada_jul: ok('cicada', sum, 0),
                    maple_nov: ok('maple', day, 0), fly_day: ok('flyingsquirrel', day, 0), fly_night: ok('flyingsquirrel', night, 0), firefly_nov: ok('firefly', night, 0),
                    snail_dry: ok('snail', day, 0), snail_rain: rain ? ok('snail', rain, 0) : true,
                    pools: [0, 1].map(wt => [day, night, sum].map(t => F.BIO.filter(b => F.bxOk(b, t, wt)).length)) };""")
                print('조건', r)
                ok(r['strider_w'] and not r['strider_l'] and not r['lady_w'], f'물가 {r}')
                ok(not r['cicada_nov'] and r['cicada_jul'] and r['maple_nov'], f'계절 {r}')
                ok(not r['fly_day'] and r['fly_night'] and not r['firefly_nov'], f'밤 {r}')
                ok(not r['snail_dry'] and r['snail_rain'], f'비 {r}')
                ok(all(n >= 3 for row in r['pools'] for n in row), f'언제든 뽑을 생물이 있어요 {r}')
                # 1) 나타나기
                r = await ev("""F.rt.fakeNow = K(11, 3, 9); S.tier = 0; S.bx.next = 0; S.bx.sp = []; F.bxSync(); const kinder = S.bx.sp.length;
                  S.tier = 1; F.bxSync(); const first = S.bx.sp.length;
                  F.rt.fakeNow = K(11, 3, 10); F.bxSync(); const h1 = S.bx.sp.length;
                  F.rt.fakeNow = K(11, 3, 11, 1); F.bxSync(); const h2 = S.bx.sp.length;
                  F.rt.fakeNow = K(11, 3, 23); F.bxSync(); const full = S.bx.sp.length, next = (S.bx.next - F.rt.fakeNow) / H;
                  const L = F.BX_SPOT[S.bx.m], wOk = S.bx.sp.every(x => !!F.BIO_BY[x.id].w === !!L[x.i][2]), uniq = new Set(S.bx.sp.map(x => x.i)).size;
                  return { kinder, first, h1, h2, full, next, wOk, uniq, m: S.bx.m };""")
                print('나타나기', r)
                ok(r['kinder'] == 0 and r['first'] == 1 and r['h1'] == 1 and r['h2'] == 2 and r['full'] == 3 and r['next'] == 2 and r['wOk'] and r['uniq'] == 3 and r['m'] == 1, f'나타나기 {r}')
                # 3) 관찰과 보상
                r = await ev("""S.bx.got = {}; S.bx.g = 0; S.bx.st.n = 0; const x0 = S.bx.sp[0], id = x0.id; S.ac.sci.xp = 0; S.ac.sci.lv = 1;
                  const e0 = S.ess, xp0 = F.acLv ? 0 : 0; const r1 = F.bxTap(x0.i); const e1 = S.ess - e0, left = S.bx.sp.length;
                  S.bx.sp.push({ i: x0.i, id, t: F.rt.fakeNow }); const b0 = S.budget, e2 = S.ess; F.bxTap(x0.i); const acorn = S.budget - b0, e3 = S.ess - e2;
                  const g0 = S.gold; S.bx.got = Object.fromEntries(F.BIO.slice(0, 9).map(b => [b.id, 1])); S.bx.g = 0;
                  const nb = F.BIO[12]; S.bx.sp = [{ i: 0, id: nb.id, t: 0 }]; F.bxTap(0); const g10 = S.gold - g0;
                  S.bx.got = Object.fromEntries(F.BIO.slice(0, 29).map(b => [b.id, 1])); S.bx.sp = [{ i: 1, id: F.BIO[29].id, t: 0 }]; const ee = S.ess; F.bxTap(1);
                  return { nw: r1 && r1.nw, e1, left, acorn: acorn > 0, e3, g10, e20: S.ess - ee, g: S.bx.g, hut: S.deco.own.bio_hut, n: S.bx.st.n, cnt: F.bxCount(),
                    card: document.querySelector('#bxCard').textContent, open: !document.querySelector('#mBx').hidden };""")
                print('관찰', {k: v for k, v in r.items() if k != 'card'})
                ok(r['nw'] and r['e1'] == 1 and r['left'] == 2 and r['acorn'] and r['e3'] == 0, f'처음과 다시 보기 {r}')
                ok(r['g10'] == 1 and r['e20'] == 20 + 1 and r['g'] == 3 and r['hut'] == 1 and r['cnt'] == 30, f'10, 20, 30종 보상 {r}')
                ok(r['open'] and 'NEW' in r['card'] and '멸종위기 야생생물' in r['card'], f'관찰 카드 {r["card"]}')
                await pg.evaluate(CLEAN)
                # 5) 퀘스트, 패스, 업적, 저장
                r = await ev("""const ids = F.MAIN.map(q => q.id), i1 = ids.indexOf('bx1'), i2 = ids.indexOf('bx2');
                  const a = F.sanitize({ ...JSON.parse(JSON.stringify(S)), bx: { m: 1, sp: [{ i: 0, id: 'bio_pine', t: 5 }, { i: 0, id: 'bio_fern' }, { i: 9, id: 'bio_pine' }, { i: 2, id: 'bio_zz' }], next: 'x', got: { bio_pine: 3, bio_zz: 2 }, g: 9, st: { n: -1 } } });
                  const b = F.sanitize({ ...JSON.parse(JSON.stringify(S)), bx: undefined });
                  return { i1, i2, ch: [F.MAIN[i1].ch, F.MAIN[i2].ch], m1: F.qMeasure(F.MAIN[i1]), m2: F.qMeasure(F.MAIN[i2]), ps: F.PS_M.bx.v(), ach: (F.ACH.find(x => x.id === 'bio') || {}).title, a: a.bx, b: [b.bx.m, b.bx.sp.length] };""")
                print('퀘스트와 저장', {k: v for k, v in r.items() if k != 'a'})
                ok(r['i1'] > 0 and r['i2'] > r['i1'] and r['ch'] == [5, 5] and r['m1'] == 4 and r['m2'] == 30 and r['ps'] == 4 and r['ach'] == '꼬마 생물학자', f'퀘스트 {r}')
                a = r['a']
                ok(a['m'] == 1 and a['sp'] == [{'i': 0, 'id': 'bio_pine', 't': 5}] and a['next'] == 0 and a['got'] == {'bio_pine': 3} and a['g'] == 3 and a['st']['n'] == 0 and r['b'] == [-1, 0], f'저장 읽기 {a}')
            # 4) 지도와 도감
            r = await ev("""S.tier = 1; F.rt.fakeNow = K(11, 20, 9); S.bx.sp = [{ i: 0, id: 'bio_pine', t: 0 }, { i: 2, id: 'bio_waterstrider', t: 0 }]; S.bx.m = 1; S.bx.next = K(11, 20, 11);
              F.renderDeco(true); return document.querySelectorAll('#decoG [data-bx]').length;""")
            ok(r == 2, f'{w} 지도 표시 {r}')
            await pg.wait_for_timeout(400); await pg.screenshot(path=f's95_map_{w}.png')
            await pg.dispatch_event('#decoG [data-bx="0"]', 'click'); await pg.wait_for_timeout(1500)
            r = await ev("return { open: !document.querySelector('#mBx').hidden, left: S.bx.sp.length, map: document.querySelectorAll('#decoG [data-bx]').length };")
            ok(r['open'] and r['left'] == 1 and r['map'] == 1, f'{w} 누르기 {r}')
            await pg.screenshot(path=f's95_card_{w}.png')
            o = await pg.evaluate(OVER + "('#mBx .modal, #mBx .modal *')"); ok(not o, f'{w} 관찰 카드가 넘쳐요 {o[:4]}')
            await pg.evaluate(CLEAN)
            r = await ev("""F.setTab('dex'); F.renderHUD && F.renderHUD(); const seg = document.querySelector('#dsegBx'); F.setDexSeg('bx');
              return { seg: !seg.hidden, cards: document.querySelectorAll('#bxDexGrid .bx-card').length };""")
            await pg.wait_for_timeout(500); await pg.screenshot(path=f's95_dex_{w}.png')
            ok(r['cards'] == 30, f'{w} 도감 {r}')
            o = await pg.evaluate(OVER + "('#bxPane, #bxPane *')"); ok(not o, f'{w} 도감이 넘쳐요 {o[:4]}')
            ok(not errs, f'{w} 페이지 오류 {errs}')
            await ctx.close()
        await b.close()
    print('PASS' if not bad else f'FAIL {len(bad)}')

if __name__ == '__main__':
    asyncio.run(main())
