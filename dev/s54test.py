# 1.7.0 시험: 그림 연결. (1) 테마 지도: 배경 테마 봄, 여름, 가을, 겨울, 크리스마스를 고르면 유치원과 초등학교 지도가 그 테마 그림으로 바뀌고, 다른 테마나 테마 없음은 기본 지도.
# (2) 학교급별 건물 외관: 초등학교에서 교실, 급식실, 도서관을 처음 키우면 2단계 그림과 2단계 지붕 조각으로 바뀌고 알림이 떠요. 과학실과 운동장은 원래 그림 그대로.
#     예전 저장(bs 칸 없음)은 지금 보이는 모습 그대로 시작해요. 유치원에서는 바뀌지 않아요.
# (2-1) 겨울 그림: 겨울 눈꽃과 크리스마스 테마의 건물, 공사 자리, 지붕 조각, 계절 참나무(작업지시서 7).
# (3) 도감 특별 손님: 뱀, 매(시련), 까치(핫딜), 졸업생(방문)이 나타나면 등록되고 그림과 이름이 보여요. 선물 목록과 '만난 친구 n/15'에는 넣지 않아요.
# 쓰는 법: python3 wrap.py && python3 s54test.py   (마지막 줄이 PASS면 통과)
import asyncio, sys
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"

async def main():
    fails = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(3500)
        await pg.evaluate(f"(()=>{{ const F={F}, S=F.S; const t=document.querySelector('#tut'); if(t) t.hidden=true; S.tut.st='skip'; F.rt.tut=null; {CLEAN}; S.budget=1e12; }})()")
        # 1) 테마 지도
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S, I=window.FS_IMG170||{{}}, out={{}};
          for (const th of ['', 'spring', 'summer', 'autumn', 'winter', 'xmas', 'space']) {{ S.cos.th.bg = th; F.applyThemes();
            const h0 = document.querySelector('#mapImg0').getAttribute('href'), h1 = document.querySelector('#mapImg1').getAttribute('href');
            const want0 = I['map_kinder_' + th] || window.FS_IMG.map_kinder, want1 = I['map_elem_' + th] || window.FS_IMG.map_elem;
            out[th || 'none'] = [h0 === want0, h1 === want1, !!I['map_kinder_' + th], !!I['map_elem_' + th]]; }}
          S.cos.th.bg = ''; F.applyThemes(); return out; }})()""")
        for th in ['spring', 'summer', 'autumn', 'winter', 'xmas']:
            if r[th] != [True, True, True, True]: fails.append(f'테마 지도 {th}: {r[th]}')
        for th in ['none', 'space']:
            if r[th][:2] != [True, True] or r[th][2] or r[th][3]: fails.append(f'기본 지도 {th}: {r[th]}')
        # 2) 건물 외관: 유치원에서는 그대로
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S; S.tier=0; for (const k of ['classroom','cafeteria','library','playground']) {{ S.f[k]=Math.max(3,S.f[k]||0); F.FUR[k].forEach((_,i)=>{{ if (S.fu && S.fu[k]) S.fu[k][i]=Math.max(S.fu[k][i]||0, S.f[k]); }}); }}
          F.rt.mapLaid=-1; F.layoutMap(); F.renderMap(); const before = F.bldImg('classroom'); return [before, S.bs.classroom]; }})()""")
        if r != ['bld_classroom_on', 0]: fails.append(f'유치원 교실 모습 {r}')
        # 초등학교로: 처음 키우면 2단계
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S; S.tier=1; S.f.science=Math.max(1,S.f.science||0); S.bs.science=1; S.bs.playground=1;
          F.rt.mapLaid=-1; F.layoutMap(); F.renderMap(); const out = {{}};
          for (const k of ['classroom','cafeteria','library']) {{
            const g=document.querySelector('#b-'+k); const b0=F.bldImg(k);
            for (let i=0;i<8 && !F.furReady(k);i++) {{ const j=F.FUR[k].findIndex((_,j)=>!F.furDone(k,j)); if (j<0) break; F.buyFur(k,j,true); }}
            const ok = F.buyFacility(k);
            const href = g.querySelector('.built .bimg').getAttribute('href'), roof = g.querySelector('.roofimg').getAttribute('href');
            out[k] = {{ b0, ok, b1: F.bldImg(k), bs: S.bs[k], hrefOk: href === window.FS_IMG170['bld_'+k+'_s2'], roofOk: roof === window.FS_IMG170['roof_'+k+'_s2'], roofKey: F.roofKey(k) }};
          }}
          out.science = [F.bldImg('science'), F.roofKey('science')]; out.playground = [F.bldImg('playground'), F.roofKey('playground')];
          return out; }})()""")
        for k in ['classroom', 'cafeteria', 'library']:
            v = r[k]
            if not (v['b0'] == f'bld_{k}_on' and v['ok'] and v['b1'] == f'bld_{k}_s2' and v['bs'] == 1 and v['hrefOk'] and v['roofOk'] and v['roofKey'] == f'roof_{k}_s2'):
                fails.append(f'초등학교 {k} 첫 업그레이드 모습 {v}')
        if r['science'] != ['bld_science_on', 'roof_science'] or r['playground'] != ['bld_field_on', 'roof_field']: fails.append(f"과학실, 운동장 모습 {r['science']} {r['playground']}")
        await pg.wait_for_timeout(1800)
        t = await pg.evaluate("(document.querySelector('.toast')||{}).textContent||''")
        if '새로 바뀌었어요' not in t: fails.append(f'건물 모습 알림 {t}')
        await pg.evaluate(f"(()=>{{ {CLEAN}; {F}.setTab('school'); {F}.festFocus(300, 420); }})()"); await pg.wait_for_timeout(400)
        await pg.screenshot(path='s54_elem_s2.png')
        # 예전 저장: bs 칸이 없으면 지금 모습 그대로
        r = await pg.evaluate(f"""(()=>{{ const F={F}; const d = JSON.parse(JSON.stringify(F.S)); delete d.bs; const s = F.sanitize(d); return [s.bs.classroom, s.bs.cafeteria, s.bs.science, s.bs.playground]; }})()""")
        if r != [0, 0, 1, 1]: fails.append(f'예전 저장 건물 모습 {r}')
        # 겨울 테마 지도 화면
        await pg.evaluate(f"(()=>{{ const F={F}; F.S.cos.th.bg='winter'; F.applyThemes(); {CLEAN}; }})()"); await pg.wait_for_timeout(400)
        await pg.screenshot(path='s54_winter.png')
        await pg.evaluate(f"(()=>{{ const F={F}; F.S.cos.th.bg=''; F.applyThemes(); }})()")
        # 2-1) 겨울 그림: 겨울 눈꽃과 크리스마스 테마면 건물, 공사 자리, 지붕 조각이 겨울 그림, 참나무는 계절 그림
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S, I=window.FS_IMG170, out={{}};
          for (const th of ['winter', 'xmas', 'spring', 'autumn', 'summer', '']) {{ S.cos.th.bg = th; F.applyThemes();
            const g = document.querySelector('#b-classroom'), lib = document.querySelector('#b-library');
            out[th || 'none'] = {{ bld: g.querySelector('.built .bimg').getAttribute('href') === I[F.bldImg('classroom') + '_winter'],
              roof: g.querySelector('.roofimg').getAttribute('href') === I[F.roofKey('classroom') + '_winter'],
              oak: document.querySelector('.oak-img').getAttribute('href') === (I['oak_' + th] || window.FS_IMG.oak), key: F.seasonKey(F.bldImg('classroom')), oakKey: F.oakKey() }}; }}
          S.cos.th.bg = ''; F.applyThemes(); return out; }})()""")
        for th in ['winter', 'xmas']:
            if not (r[th]['bld'] and r[th]['roof'] and r[th]['oak']): fails.append(f'{th} 겨울 건물, 지붕, 참나무 {r[th]}')
        for th in ['spring', 'autumn']:
            if r[th]['bld'] or not r[th]['oak'] or r[th]['oakKey'] != 'oak_' + th: fails.append(f'{th} 건물은 원래 그림, 참나무는 계절 그림 {r[th]}')
        for th in ['summer', 'none']:
            if r[th]['bld'] or r[th]['oakKey'] != 'oak': fails.append(f'{th} 원래 그림 {r[th]}')
        await pg.evaluate(f"(()=>{{ const F={F}; F.S.cos.th.bg='xmas'; F.applyThemes(); {CLEAN}; F.setTab('school'); }})()"); await pg.wait_for_timeout(400)
        await pg.screenshot(path='s54_xmas.png')
        await pg.evaluate(f"(()=>{{ const F={F}; F.S.cos.th.bg=''; F.applyThemes(); }})()")
        # 3) 특별 손님
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S; const n0 = F.dexPending().length;
          F.startTrial('snake'); F.startVisit(); F.spawnDeal();
          const got = F.DEX_GUEST_KEYS.filter(k => S.dex.got[k]);
          F.setTab('dex'); const cards = [...document.querySelectorAll('#dexBody .dex-card[data-dex^="g_"]')].map(c => [c.dataset.dex, c.classList.contains('on'), !!c.querySelector('img, .p7')]);
          const head = document.querySelector('#dexHead').textContent;
          return {{ got, cards, head, pend: F.dexPending().map(x=>x.key).filter(k=>k.startsWith('g_')), keys: F.DEX_KEYS.length }}; }})()""")
        if not ({'g_snake', 'g_alumni'} <= set(r['got'])): fails.append(f"특별 손님 등록 {r['got']}")
        if len(r['cards']) != 4: fails.append(f"특별 손님 칸 {r['cards']}")
        on = [c for c in r['cards'] if c[1]]
        if not on or not all(c[2] for c in on): fails.append(f"만난 특별 손님 그림 {r['cards']}")
        if r['pend']: fails.append(f"특별 손님이 선물 목록에 들어갔어요 {r['pend']}")
        if f"/ {r['keys']}종" not in r['head'] or r['keys'] != 15: fails.append(f"만난 친구 수가 바뀌었어요 {r['head']}")
        await pg.evaluate(f"{CLEAN}"); await pg.wait_for_timeout(300)
        await pg.evaluate("document.querySelector('#panelDex').scrollTop = 99999"); await pg.wait_for_timeout(200)
        await pg.screenshot(path='s54_dex_guests.png')
        if errs: fails.append(f'페이지 오류 {errs[:3]}')
        await b.close()
    for f in fails: print('FAIL', f)
    print('PASS' if not fails else 'FAIL')
    sys.exit(1 if fails else 0)

if __name__ == '__main__': asyncio.run(main())
