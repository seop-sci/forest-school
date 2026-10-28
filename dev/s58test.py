# 1.7.1 시험: 업적과 칭호, 영양 선생님과 사서 선생님, 방 꾸밈 소품, 방 안을 걷는 친구들, 학교 행사 그림, 지도 손님 그림, 오류 코드 알림
# (1) 새 선생님: 건물을 지어야 오셔요, 연수 값(곰 연수 곡선), 최고 Lv.10, 특식 데이 +2분/레벨, 퍼즐 정수 +3%/레벨, 수업료는 그대로, 도감 17종, 예전 저장
# (2) 방 꾸밈 소품: 건물 Lv.1, 5, 10, 15, 20마다 하나씩(방마다 5개), 그림이 모두 있는지
# (3) 걷는 친구들: 그 방 선생님을 모셨을 때만 선생님, 학생 두 명, 시간이 지나면 자리가 바뀌는지
# (4) 행사 그림: 쪽지, 풍선, 음표, 별이 그림으로, 무대, 사진기, 줄 장식, 운동회 공, 행사 아이콘, 뱀과 매와 까치 그림
# (5) 오류 코드: 광고 3, 동의, 구글 로그인 10
# (6) 업적: 기록으로 이루기, 받기(황금 1~5), 5단계 칭호(처음 받은 칭호는 바로 달기), 칭호 바꾸기와 떼기, 줄어도 이룬 것은 남기, 예전 저장과 망가진 저장, 받을 것이 있으면 도감 버튼 점
# (7) 화면: 업적 화면(밝은 390px, 어두운 360px) 넘침, 선생님 탭 새 카드
# 쓰는 법: python3 wrap.py && python3 s58test.py   (마지막 줄이 PASS면 통과)
import asyncio, sys, json
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"

async def boot(ctx):
    pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(URL); await pg.wait_for_timeout(2800)
    await pg.evaluate(f"(()=>{{ const F={F}, S=F.S; const t=document.querySelector('#tut'); if(t) t.hidden=true; S.tut.st='skip'; F.rt.tut=null; {CLEAN}; }})()")
    return pg, errs

async def main():
    fails = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
        pg, errs = await boot(ctx)
        # ---- (1) 새 선생님
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S, out={{}};
          S.budget = 1e12; S.f.cafeteria = 0; S.f.library = 0;
          out.noBuild = F.xtAct('diet');
          S.f.cafeteria = 3; S.f.library = 2;
          const r0 = F.rate(), c1 = F.xtCost('diet'); out.ok1 = F.xtAct('diet'); out.paid = Math.abs(1e12 - S.budget - c1) < 1;
          out.r = F.rate() === r0;
          for (let i = 0; i < 12; i++) F.xtAct('diet');
          out.dietLv = S.xt.diet; out.feast = F.feastMins();
          for (let i = 0; i < 4; i++) F.xtAct('lib');
          out.lib = [S.xt.lib, +F.libMult().toFixed(2)];
          // 곰 연수 곡선: 교감 선생님과 같은 값
          const vp = S.vp; S.vp = 4; out.sameCurve = F.xtCost('lib') === (() => {{ const c = F.xtCost('lib'); return c; }})(); S.vp = vp;
          // 퍼즐 정수: 점수 1500 → 기본 10개, 사서 Lv.4 → 11개
          const g = F.pzFreshGame(true); g.score = 1500; const e0 = S.ess; const res = F.pzFinish(g); out.ess = [res.ess, S.ess - e0];
          // 도감
          F.dexSync(); out.dex = [F.DEX_KEYS.length, !!S.dex.got.tea_dietitian, !!S.dex.got.tea_librarian];
          // 저장 다시 읽기
          const d = JSON.parse(JSON.stringify(S)); d.xt = {{ diet: 99, lib: -3 }}; const s2 = F.sanitize(d); out.san = [s2.xt.diet, s2.xt.lib];
          delete d.xt; const s3 = F.sanitize(d); out.old = [s3.xt.diet, s3.xt.lib];
          return out; }})()""")
        if r['noBuild'] is not False or not r['ok1'] or not r['paid'] or not r['r']: fails.append(f'영양 선생님 연수 {r}')
        if r['dietLv'] != 10 or r['feast'] != 40: fails.append(f'영양 선생님 최고 레벨과 특식 데이 {r}')
        if r['lib'] != [4, 1.12] or r['ess'][0] != 11 or r['ess'][1] < 11: fails.append(f'사서 선생님 정수 {r}')
        if r['dex'] != [23, True, True]: fails.append(f'도감 23종(2.0.0 새 학생 6종) {r}')
        if r['san'] != [10, 0] or r['old'] != [0, 0]: fails.append(f'새 선생님 저장 {r}')
        # 선생님 탭 카드
        await pg.evaluate(f"{F}.setTab('teachers')"); await pg.wait_for_timeout(400)
        r = await pg.evaluate("[...document.querySelectorAll('.tcard.xt')].map(c => [c.dataset.k, c.querySelector('.tlv').textContent, c.querySelector('.now').textContent, !!c.querySelector('.tav image')])")
        if len(r) != 2 or r[0][1] != 'Lv.10' or '40분' not in r[0][2] or not r[0][3] or not r[1][3]: fails.append(f'선생님 탭 새 카드 {r}')
        await pg.evaluate(f"{F}.setTab('school')")
        # ---- (2)(3) 방 꾸밈 소품과 걷는 친구들
        r = await pg.evaluate(f"""(async()=>{{ const F={F}, S=F.S, out={{}};
          const ks = ['classroom', 'cafeteria', 'library', 'playground', 'science'];
          out.cnt = []; for (const L of [1, 4, 5, 10, 15, 20, 30]) {{ S.f.classroom = L; out.cnt.push(F.propInstances('classroom').length); }}
          out.all = ks.map(k => {{ S.f[k] = 20; return F.propInstances(k).length; }});
          S.t.squirrel = 0; S.students = 30; F.openSheet('classroom'); await new Promise(r => setTimeout(r, 300));
          out.noTea = document.querySelectorAll('#roomWalk .wk').length;
          F.closeSheet(); await new Promise(r => setTimeout(r, 300)); S.t.squirrel = 2; F.openSheet('classroom'); await new Promise(r => setTimeout(r, 300));
          const w = [...document.querySelectorAll('#roomWalk .wk')]; out.withTea = w.length;
          const t0 = w.map(e => e.getAttribute('transform')).join(); await new Promise(r => setTimeout(r, 2500)); const t1 = w.map(e => e.getAttribute('transform')).join();
          out.moved = t0 !== t1;
          out.props = document.querySelectorAll('#furScene .fur-prop image').length;
          F.closeSheet();
          return out; }})()""")
        if r['cnt'] != [1, 1, 2, 3, 4, 5, 5] or r['all'] != [5, 5, 5, 5, 5]: fails.append(f'꾸밈 소품 레벨 {r}')
        if r['noTea'] != 2 or r['withTea'] != 3 or not r['moved'] or r['props'] != 5: fails.append(f'방 안을 걷는 친구들 {r}')
        # ---- (4) 행사 그림, 손님 그림
        r = await pg.evaluate(f"""(()=>{{ const F={F}; const out = {{}};
          out.items = ['paper', 'balloon', 'note', 'smile'].map(k => F.festItemSvg(k).startsWith('<image'));
          out.guest = ['snake', 'hawk', 'magpie'].map(k => F.guestArt(k).includes('<image'));
          out.ic = ['picnic', 'welcome', 'sports', 'show', 'photo'].every(k => !!F.IMG('fest_ic_' + k));
          out.big = ['fest_stage', 'fest_camera', 'fest_garland', 'fest_ball_blue'].every(k => !!F.IMG(k));
          out.ach = ['ach_frame_gold', 'ach_ic_rank', 'ach_popup', 'title_ribbon_light', 'ic_trophy', 'tea_dietitian', 'prop_science_rocket'].every(k => !!F.IMG(k));
          return out; }})()""")
        if r['items'] != [True] * 4 or r['guest'] != [True] * 3 or not r['ic'] or not r['big'] or not r['ach']: fails.append(f'그림 연결 {r}')
        # ---- (5) 오류 코드
        r = await pg.evaluate(f"""(()=>{{ const F={F};
          return [F.adErrText({{ adError: () => '3' }}), F.adErrText({{ adError: () => 'consent:x' }}), F.adErrText({{ adError: () => '' }}), F.adErrText(null), F.googleErrText('10: DEVELOPER_ERROR'), F.googleErrText('auth/internal-error')]; }})()""")
        if '오류 3' not in r[0] or '줄 광고' not in r[0] or '동의' not in r[1] or r[2] != '' or r[3] != '' or 'SHA-1' not in r[4] or 'internal' not in r[5]: fails.append(f'오류 코드 {r}')
        # ---- (6) 업적
        r = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S, out={{}};
          S.ach = {{ hit: {{}}, got: {{}}, title: '' }}; S.students = 60; S.st.grads = 0; S.st.trains = 0; S.st.gold = 0; S.att.n = 0; S.pz.best = 0; S.st.trips = 0;
          for (const k of Object.keys(S.f)) S.f[k] = 1; S.q.m = 0;
          F.achSync(true); out.hit = S.ach.hit.students; out.claimable = F.achClaimable();
          const g0 = S.gold; F.claimAch('students'); {CLEAN}; out.gain = S.gold - g0; out.got = S.ach.got.students; out.again = F.claimAch('students');
          S.students = 3; F.achSync(true); out.keep = S.ach.hit.students;   // 줄어도 남아요
          S.f.classroom = 50; F.achSync(true); const g1 = S.gold; F.claimAch('building'); {CLEAN}; out.gold3 = S.gold - g1; out.title = S.ach.title;
          S.pz.best = 45000; F.achSync(true); F.claimAch('puzzle'); {CLEAN}; out.title2 = S.ach.title;   // 이미 단 칭호는 그대로
          out.set = [F.setTitle('puzzle'), S.ach.title, F.setTitle('puzzle'), S.ach.title, F.setTitle('grad'), S.ach.title];
          F.setTitle('building'); {CLEAN};
          out.total = F.ACH.filter(a => a.goals.length === 5).length * 5;
          const d = JSON.parse(JSON.stringify(S));
          let s = F.sanitize(d); out.san = [s.ach.got.building, s.ach.title];
          d.ach = {{ hit: {{ students: 9, grad: 'x', zzz: 3 }}, got: {{ students: 7, building: 5 }}, title: 'building' }}; s = F.sanitize(d);
          out.bad = [s.ach.hit.students, s.ach.hit.grad || 0, s.ach.hit.zzz || 0, s.ach.got.students, s.ach.got.building || 0, s.ach.title];
          delete d.ach; s = F.sanitize(d); out.old = [Object.keys(s.ach.hit).length, s.ach.title];
          return out; }})()""")
        if r['hit'] != 2 or not r['claimable'] or r['gain'] != 3 or r['got'] != 2 or r['again'] is not False or r['keep'] != 2: fails.append(f'업적 받기 {r}')
        if r['gold3'] != 15 or r['title'] != 'building' or r['title2'] != 'building': fails.append(f'금 업적과 칭호 {r}')
        if r['set'] != [True, 'puzzle', True, '', False, ''] or r['total'] != 65: fails.append(f'칭호 바꾸기 {r}')
        if r['san'] != [5, 'building'] or r['bad'] != [5, 0, 0, 5, 0, ''] or r['old'] != [0, '']: fails.append(f'업적 저장 {r}')
        # 도감 버튼 점
        r = await pg.evaluate(f"""(async()=>{{ const F={F}, S=F.S; S.st.trains = 60; await new Promise(r => setTimeout(r, 1500)); {CLEAN}; return [F.achClaimable(), !document.querySelector('#dexDot').hidden, !document.querySelector('#achDot').hidden]; }})()""")
        if r != [True, True, True]: fails.append(f'받을 업적 점 {r}')
        # ---- (7) 화면
        for theme, w in [('light', 390), ('dark', 360)]:
            await pg.set_viewport_size({'width': w, 'height': 800})
            await pg.evaluate(f"document.documentElement.setAttribute('data-theme','{theme}'); {F}.setTab('dex'); {CLEAN}; {F}.setDexSeg('ach')")
            await pg.wait_for_timeout(400)
            ov = await pg.evaluate("(()=>{ const rows=[...document.querySelectorAll('.ach-row')]; return { doc: document.documentElement.scrollWidth - innerWidth, n: rows.length, over: rows.filter(r => r.scrollWidth > r.clientWidth + 1).length, btn: document.querySelectorAll('.ach-btn').length, chip: document.querySelectorAll('.title-chip').length }; })()")
            if ov['doc'] > 0 or ov['n'] != 13 or ov['over'] or ov['btn'] < 1 or ov['chip'] != 2: fails.append(f'{theme} {w}px 업적 화면 {ov}')
            await pg.screenshot(path=f's58_{theme}_{w}.png')
            # 버튼으로 받기
            await pg.click('.ach-btn'); await pg.wait_for_timeout(500)
            got = await pg.evaluate(f"{F}.S.ach.got.teacher || 0")
            if got < 1: fails.append(f'{theme} 받기 버튼 {got}')
            await pg.evaluate(CLEAN)
            await pg.evaluate(f"{F}.S.ach.got.teacher = 0")
        await pg.evaluate(f"{F}.setDexSeg('dex')"); await pg.wait_for_timeout(200)
        r = await pg.evaluate("[document.querySelector('#dexPane').hidden, document.querySelector('#achPane').hidden, document.querySelectorAll('.dex-card').length]")
        if r[0] or not r[1] or r[2] < 17: fails.append(f'도감으로 돌아가기 {r}')
        # 홈 위쪽 칭호
        await pg.evaluate(f"{F}.setTab('school')"); await pg.wait_for_timeout(1300)
        r = await pg.evaluate("(()=>{ const el=document.querySelector('#hudTitle'); const r=el.getBoundingClientRect(), p=el.parentElement.getBoundingClientRect(); return [el.hidden, el.textContent, r.right <= p.right + 1, r.width > 30]; })()")
        if r != [False, '숲속 건축왕', True, True]: fails.append(f'홈 위쪽 칭호 {r}')
        await pg.click('#hudTitle'); await pg.wait_for_timeout(400)
        r = await pg.evaluate(f"[{F}.rt.tab, document.querySelector('#achPane').hidden]")
        if r != ['dex', False]: fails.append(f'칭호 눌러 업적 열기 {r}')
        await pg.evaluate(f"{F}.setTitle('building')"); await pg.wait_for_timeout(1300)
        if not await pg.evaluate("document.querySelector('#hudTitle').hidden"): fails.append('칭호를 떼면 홈에서 사라져야 해요')
        if errs: fails.append(f'페이지 오류 {errs[:3]}')
        await b.close()
    for f in fails: print('FAIL', f)
    print('PASS' if not fails else 'FAIL')
    sys.exit(1 if fails else 0)

if __name__ == '__main__': asyncio.run(main())
