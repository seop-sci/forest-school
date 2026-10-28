# 2.0.1 시험: 학급 반장 선거
# 보는 것
#  1) 유치원에서는 안 열려요(교실 창에 단추 없음, 열면 안내). 초등학교부터 후보 3명(서로 다른 동물, 공약 서로 다름)
#  2) 뽑기: 한 주에 한 번, 공약 효과가 그 주에만(수업료 +10%, 행사 보상 +20%, 오늘의 미션 도토리 2배, 줍기 도토리 2배). 값이 유한하고 다른 공약은 1배
#  3) 새 주(게임 시계 +7일)가 되면 새 후보, 지난 반장 효과는 끝나요. 1초 틱에서 알림
#  4) 지도에서 반장 동물 머리 위에 배지 하나
#  5) 중학교: 명부 학생이 후보, 반장이 속한 동아리 보너스 두 배, 복도 학생회실 문이 열리고 누르면 선거 창, elMid 셈
#  6) 메인 퀘스트 el1(초등), jl1(중학교)과 goTo, 교실 창 단추, 저장했다 불러오기와 망가진 저장
#  7) 390 밝은, 360 어두운 화면에서 선거 창이 넘치지 않아요(캡처 s74_390.png, s74_360.png). 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s74test.py   (마지막 줄이 PASS면 통과)
import asyncio, json
from playwright.async_api import async_playwright
from s4test import URL
import s73test as T
F = 'window.__forest'
OVER = T.OVER
OPEN = T.OPEN

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, scheme in ((390, 'light'), (360, 'dark')):
            ctx = await b.new_context(viewport={'width': w, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme=scheme)
            await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(2500); await pg.evaluate(T.SKIP)
            if w == 390:
                # 1) 유치원
                r = await pg.evaluate(f"""(() => {{ const F = {F}; F.S.f.classroom = Math.max(1, F.S.f.classroom); F.openSheet('classroom');
                  const hid = document.querySelector('#sheetElect').hidden; F.closeSheet(); F.openElect(); return {{ hid, open: F.rt.modalOpen && F.rt.modalOpen.id, t: document.querySelector('#toast').textContent }}; }})()""")
                print('유치원', r)
                if not r['hid'] or r['open'] or '초등학교부터' not in r['t']: bad.append(f'유치원에서 열리면 안 돼요 {r}')
                await pg.wait_for_timeout(300)
                # 초등학교로
                await pg.evaluate(T.KG); await pg.evaluate(T.CLEAN); await pg.evaluate(f"{F}.rt.cereOn = false")
            else:
                await pg.evaluate(T.EL); await pg.evaluate(T.CLEAN); await pg.evaluate(f"{F}.rt.cereOn = false")
            mid = w == 360
            r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; F.elSync();
              return {{ tier: S.tier, cand: S.el.cand, sp: new Set(S.el.cand.map(c => c.sp)).size, ps: new Set(S.el.cand.map(c => c.p)).size,
                roster: S.roster.list.map(x => x.nm + ':' + x.sp), mults: ['tuition', 'fest', 'mission', 'pick'].map(F.elMult) }}; }})()""")
            print('후보', w, json.dumps(r, ensure_ascii=False))
            if len(r['cand']) != 3 or r['sp'] != 3 or r['ps'] != 3 or any(m != 1 for m in r['mults']): bad.append(f'{w} 후보 {r}')
            if mid and not all(f"{c['nm']}:{c['sp']}" in r['roster'] for c in r['cand']): bad.append(f'중학교 후보는 명부 학생 {r}')
            # 메인 퀘스트 goTo로 선거 창
            qid = 'jl1' if mid else 'el1'
            r = await pg.evaluate(f"""(() => {{ const F = {F}; F.closeSheet(); F.goTo(F.MAIN.find(q => q.id === '{qid}')); return {{ open: F.rt.modalOpen && F.rt.modalOpen.id, cards: document.querySelectorAll('#elCands .el-card').length, btn: document.querySelectorAll('#elCands [data-el]').length }}; }})()""")
            if r['open'] != 'mElect' or r['cards'] != 3 or r['btn'] != 3: bad.append(f'{w} {qid} 퀘스트로 선거 창 {r}')
            await pg.wait_for_timeout(500)
            o = await pg.evaluate(OVER, '#mElect')
            if o: bad.append(f'{w} 선거 창이 넘쳐요 {o}')
            # 2) 공약별 효과: 각 공약을 가진 후보를 뽑은 것처럼 바꿔 가며 값 확인
            r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S, out = {{}};
              const base = {{ rate: F.rate(), fest: F.festPrize(true), drop: F.dropValue(), pct: [0, 1, 2, 3].map(F.clubPct) }};
              for (const k of Object.keys(F.EL_PLEDGES)) {{
                S.el.cand[0].p = k; S.el.pick = 0;
                out[k] = {{ rate: F.rate() / base.rate, fest: F.festPrize(true) / base.fest, drop: F.dropValue() / base.drop, m: F.elMult('mission') }};
              }}
              S.el.pick = -1; S.el.cand[0].p = Object.keys(F.EL_PLEDGES).find(k => !S.el.cand.slice(1).some(c => c.p === k));
              return {{ out, back: F.rate() / base.rate }}; }})()""")
            print('효과', w, json.dumps(r))
            o2 = r['out']
            if abs(o2['tuition']['rate'] - 1.1) > 1e-6 or abs(o2['fest']['fest'] - 1.2) > 0.08 or abs(o2['pick']['drop'] - 2) > 1e-6 or o2['mission']['m'] != 2: bad.append(f'{w} 공약 효과 {r}')
            if abs(o2['pick']['rate'] - 1) > 1e-9 or abs(o2['mission']['drop'] - 1) > 1e-9 or abs(r['back'] - 1) > 1e-9: bad.append(f'{w} 다른 공약은 그대로여야 해요 {r}')
            # 뽑기(창의 단추로)
            pick = 0 if not mid else None
            if mid:
                # 동아리를 나눈 뒤, 동아리에 든 후보를 뽑아요
                pick = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; F.clubAuto(true); F.renderElect(); return S.el.cand.findIndex(c => (S.roster.list.find(x => x.nm === c.nm && x.sp === c.sp) || {{}}).c >= 0); }})()""")
                if pick < 0: bad.append('동아리에 든 후보가 없어요'); pick = 0
                base_pct = await pg.evaluate(f"[0, 1, 2, 3].map({F}.clubPct)")
            await pg.click(f'#elCands [data-el="{pick}"]'); await pg.wait_for_timeout(500)
            r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; return {{ pick: S.el.pick, el: S.st.elects, mid: S.st.elMid, btn: document.querySelectorAll('#elCands [data-el]').length,
              won: document.querySelectorAll('#elCands .el-card.pick').length, again: F.elVote((S.el.pick + 1) % 3), club: F.elClub(), pct: [0, 1, 2, 3].map(F.clubPct),
              q: F.qDone(F.MAIN.find(q => q.id === '{qid}')) }}; }})()""")
            print('뽑기', w, r)
            if r['pick'] != pick or r['el'] != 1 or r['btn'] != 0 or r['won'] != 1 or r['again']: bad.append(f'{w} 뽑기 {r}')
            if not r['q']: bad.append(f'{w} {qid} 퀘스트가 끝나야 해요')
            if mid:
                if r['mid'] != 1 or r['club'] < 0: bad.append(f'중학교 반장 셈과 동아리 {r}')
                c = r['club']
                if abs(r['pct'][c] - 2 * base_pct[c]) > 1e-9 or any(r['pct'][i] != base_pct[i] for i in range(4) if i != c): bad.append(f'반장 동아리 보너스 두 배 {base_pct} -> {r["pct"]}')
            elif r['mid'] != 0: bad.append(f'초등학교 반장은 elMid에 세지 않아요 {r}')
            await pg.screenshot(path=f's74_{w}.png')
            o = await pg.evaluate(OVER, '#mElect')
            if o: bad.append(f'{w} 뽑은 뒤 선거 창이 넘쳐요 {o}')
            await pg.evaluate(f"{F}.rt.modalOpen && document.querySelector('#elClose').click()"); await pg.wait_for_timeout(400)
            # 4) 지도 배지
            await pg.evaluate(f"(() => {{ const F = {F}; F.setTab('school'); F.syncKids(true); }})()"); await pg.wait_for_timeout(1500)
            r = await pg.evaluate(f"""(() => {{ const F = {F}, p = F.elPres(); const bs = [...document.querySelectorAll('.el-badge')];
              return {{ n: bs.length, on: bs.length ? F.rt.kids.find(k => k.g.contains(bs[0])).sp : '', want: p && p.sp, has: F.rt.kids.some(k => k.sp === (p && p.sp)) }}; }})()""")
            print('배지', w, r)
            if r['has'] and (r['n'] != 1 or r['on'] != r['want']): bad.append(f'{w} 지도 배지 {r}')
            # 5) 복도 학생회실(중학교)
            if mid:
                await pg.evaluate(f"{F}.setTab('hall')"); await pg.wait_for_timeout(400)
                r = await pg.evaluate("""(() => { const b = document.querySelector('#hdCouncil'); return { soon: b.classList.contains('soon'), dis: b.getAttribute('aria-disabled'), tag: b.querySelector('.sf-tag').textContent }; })()""")
                await pg.click('#hdCouncil'); await pg.wait_for_timeout(400)
                r['open'] = await pg.evaluate(OPEN)
                print('학생회실', r)
                if r['soon'] or r['dis'] != 'false' or r['open'] != 'mElect' or '반장' not in r['tag']: bad.append(f'학생회실 문 {r}')
                await pg.evaluate(T.CLEAN)
            else:
                # 교실 창 단추
                await pg.evaluate(f"(() => {{ const F = {F}; F.setTab('school'); F.openSheet('classroom'); }})()"); await pg.wait_for_timeout(400)
                r = await pg.evaluate("""(() => ({ hid: document.querySelector('#sheetElect').hidden, tx: document.querySelector('#sheetElectTx').textContent }))()""")
                await pg.click('#sheetElect'); await pg.wait_for_timeout(600)
                r['open'] = await pg.evaluate(OPEN)
                print('교실 단추', r)
                if r['hid'] or '반장' not in r['tx'] or r['open'] != 'mElect': bad.append(f'교실 창 반장 선거 단추 {r}')
                await pg.evaluate(T.CLEAN)
            # 6) 저장하고 다시 불러오기, 망가진 저장
            r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; F.save(); const raw = JSON.parse(localStorage.getItem('forest-school-v1'));
              const a = F.sanitize(JSON.parse(JSON.stringify(raw)));
              const bad1 = F.sanitize(Object.assign(JSON.parse(JSON.stringify(raw)), {{ el: {{ wk: 'x', pick: 9, cand: [{{ sp: 'dragon', nm: '<b>', p: 'gold' }}] }} }}));
              const bad2 = F.sanitize(Object.assign(JSON.parse(JSON.stringify(raw)), {{ el: null }}));
              return {{ same: JSON.stringify(a.el) === JSON.stringify(S.el), st: a.st.elects, b1: bad1.el, b2: bad2.el }}; }})()""")
            print('저장', w, json.dumps(r, ensure_ascii=False))
            if not r['same'] or r['st'] != 1 or r['b1']['cand'] != [] or r['b1']['pick'] != -1 or r['b2']['cand'] != []: bad.append(f'{w} 저장 {r}')
            # 3) 새 주: 게임 시계 +7일
            r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S, wk0 = S.el.wk; F.rt.fakeNow = Date.now() + 7 * 86400000; F.setServerTime && 0;
              const m0 = F.elPres(); const changed = F.elSync(); return {{ wk0, wk: S.el.wk, gw: F.gameWeek(), changed, pick: S.el.pick, pres: !!F.elPres(), mults: ['tuition', 'fest', 'mission', 'pick'].map(F.elMult) }}; }})()""")
            print('새 주', w, r)
            if not r['changed'] or r['wk'] != r['gw'] or r['wk'] == r['wk0'] or r['pick'] != -1 or r['pres'] or any(m != 1 for m in r['mults']): bad.append(f'{w} 새 주 {r}')
            await pg.evaluate(f"{F}.rt.fakeNow = 0")
            if errs: bad.append(f'{w} 페이지 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    print('\n'.join(bad) if bad else '', 'FAIL' if bad else 'PASS')

if __name__ == '__main__': asyncio.run(main())
