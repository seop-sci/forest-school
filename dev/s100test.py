# 2.3.0.1 시험: 부엉이 밤샘 수업 NaN 고침, 초반 시간 단축권, 퀘스트 접기, 숨은 생물 자리와 강조, 공사 가속 배지, 특별 이벤트 주말 하루 종일 건설 가속
# 쓰는 법: python3 wrap.py && python3 s100test.py   (마지막 줄이 PASS면 통과)
import asyncio, json, datetime
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
SKIP = f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {CLEAN}; }})()"
def kst(y, m, d, h): return int(datetime.datetime(y, m, d, h, 0, 0, tzinfo=datetime.timezone(datetime.timedelta(hours=9))).timestamp() * 1000)

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        # 옛 2.3.0 저장: perk.night가 NaN이라 null로 저장된 학교
        await ctx.add_init_script("window.__FOREST_TEST = true; if (!sessionStorage.getItem('s100')) { localStorage.clear(); sessionStorage.setItem('s100', '1'); }")
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(2500); await pg.evaluate(SKIP)
        # 1) 부엉이 밤샘 수업
        r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; return {{ max: F.PERKS.night.max, desc: F.PERKS.night.desc, lv: S.p.perk.night, cap: F.offlineCapH() }}; }})()""")
        if r != {'max': 4, 'desc': '학교를 비운 동안 도토리가 더 오래 쌓여요.', 'lv': 0, 'cap': 8}: bad.append(f'부엉이 밤샘 수업 {r}')
        r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; S.pending = 0; S.pendingSec = 0; F.applyAway(3 * 3600); const v = S.pending; {CLEAN}; return {{ ok: Number.isFinite(v) && v > 0 }}; }})()""")
        if not r['ok']: bad.append(f'자리 비운 보상 {r}')
        # NaN 저장 불러오기
        r = await pg.evaluate(f"""(() => {{ const F = {F}; const raw = JSON.parse(localStorage.getItem('forest-school-v1') || 'null'); if (!raw) return 'nosave';
          raw.p.perk.night = null; const s = F.parseSave ? F.parseSave(JSON.stringify(raw)) : null; return s ? s.p.perk.night : 'noparse'; }})()""")
        if r not in (0, 'noparse', 'nosave'): bad.append(f'NaN 저장 {r}')
        # 2) 초반 단축권: 메인 퀘스트
        r = await pg.evaluate(f"""(() => {{ const F = {F}; const ids = [...F.TK_Q]; const chs = ids.map(id => F.MAIN.find(q => q.id === id).ch); return {{ n: ids.length, maxCh: Math.max(...chs), ch0: chs.filter(c => c === 0).length }}; }})()""")
        print('메인 퀘스트 단축권', r)
        if r['n'] < 10 or r['maxCh'] > 7 or r['ch0'] < 1: bad.append(f'메인 퀘스트 단축권 {r}')
        r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; const i = F.MAIN.findIndex(q => F.TK_Q.has(q.id)); S.q.m = i; S.q.lat = F.MAIN[i].id; F.startMain && 0;
          const before = S.tk.m5; F.setTab('quests'); const chip = !!document.querySelector('#qMain .qtk'); return {{ chip, before }}; }})()""")
        if not r['chip']: bad.append('퀘스트 카드 단축권 표시가 없어요')
        # 3) 퀘스트 접기
        r = await pg.evaluate("""(() => { const ol = document.querySelector('#qMain .qsteps'), b = document.querySelector('#qMain .ch-fold');
          const vis = [...ol.querySelectorAll('.qs')].filter(e => e.offsetParent !== null).length; return { fold: ol.classList.contains('fold'), vis, btn: !!b }; })()""")
        if not r['fold'] or r['vis'] != 1 or not r['btn']: bad.append(f'접기 {r}')
        await pg.click('#qMain .ch-fold'); await pg.wait_for_timeout(200)
        r = await pg.evaluate("""(() => { const ol = document.querySelector('#qMain .qsteps'); return { fold: ol.classList.contains('fold'), vis: [...ol.querySelectorAll('.qs')].filter(e => e.offsetParent !== null).length, ex: document.querySelector('#qMain .ch-fold').getAttribute('aria-expanded') }; })()""")
        if r['fold'] or r['vis'] < 2 or r['ex'] != 'true': bad.append(f'펼치기 {r}')
        await pg.evaluate(f"{F}.setTab('school')")
        # 4) 퍼즐과 합치기 단축권(하루 3장)
        r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; S.tier = 0; const m0 = S.tk.m5; const got = [];
          for (let i = 0; i < 5; i++) got.push(!!F.pzFinish({{ rw: true, score: 300, ess: 0 }}).tk);
          return {{ got, add: S.tk.m5 - m0, day: S.tkd.pz }}; }})()""")
        if r['got'] != [True, True, True, False, False] or r['add'] != 3: bad.append(f'퍼즐 단축권 {r}')
        r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; const m0 = S.tk.m5; let n = 0; for (let i = 0; i < 25; i++) {{ S.mg.st.orders += 1; if (S.mg.st.orders % F.TKE.mgEvery === 0 && F.tkDaily('mg')) n++; }} return {{ n, add: S.tk.m5 - m0 }}; }})()""")
        if r != {'n': 3, 'add': 3}: bad.append(f'합치기 단축권 {r}')
        # 5) 숨은 생물 자리: 왼쪽 단추 줄, 오른쪽 단추 줄, 화면 가장자리를 피해요
        r = await pg.evaluate(f"""(() => {{ const L = {F}.BX_SPOT; const bad = []; for (let m = 1; m < L.length; m++) for (const [x, y] of L[m]) {{
          if (x < 11 || x > 91 || (x < 25 && y > 12 && y < 48) || (x > 79 && y < 31) || (x > 48 && y > 71 && y < 85)) bad.push([m, x, y]); }} return bad; }})()""")
        if r: bad.append(f'숨은 생물 자리 {r}')
        r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; S.tier = 1; S.f.science = 1; F.renderMap(); S.bx.m = 1; S.bx.sp = [{{ i: 0, id: 'ladybug', t: Date.now() }}]; F.renderDeco(true);
          return {{ glow: document.querySelectorAll('#decoG .bx-glow').length, hit: document.querySelectorAll('#decoG .bx-hit').length }}; }})()""")
        if r['glow'] != 1 or r['hit'] != 1: bad.append(f'숨은 생물 강조 {r}')
        # 6) 특별 이벤트 주말 하루 종일 건설 가속(2026 수능 주 11/16~22)
        r = await pg.evaluate(f"""(() => {{ const F = {F}; return {{
          sat10: F.nbBuildAt({kst(2026, 11, 21, 10)}), fri10: F.nbBuildAt({kst(2026, 11, 20, 10)}), fri21: F.nbBuildAt({kst(2026, 11, 20, 21)}), sun3: F.nbBuildAt({kst(2026, 11, 22, 3)}),
          nsat: F.nbBuildAt({kst(2026, 11, 28, 10)}), all: F.nbAllDay('2026-11-21') }}; }})()""")
        if r != {'sat10': True, 'fri10': False, 'fri21': True, 'sun3': True, 'nsat': False, 'all': True}: bad.append(f'주말 건설 가속 {r}')
        # 7) 공사 가속 배지: 낮에는 없고(게임 시계는 뒤로 가지 않아서 낮을 먼저 봐요), 20시부터 +100%
        r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; {CLEAN}; F.rt.fakeNow = {kst(2026, 11, 3, 13)}; const n = F.rt.fakeNow; S.f.library = 3; S.bd.library = {{ L: 4, s: n - 60000, e: n + 600000 }}; F.renderMap(); F.conRender(true); const c = document.querySelector('#b-library .con'); return {{ add: F.conAdd(), fast: !!c && c.classList.contains('fast') }}; }})()""")
        if r['add'] != 0 or r['fast']: bad.append(f'낮 배지 {r}')
        r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; {CLEAN}; F.rt.fakeNow = {kst(2026, 11, 3, 21)}; const n = F.rt.fakeNow; S.f.library = 3; S.bd.library = {{ L: 4, s: n - 60000, e: n + 600000 }}; F.renderMap(); F.conRender(true);
          const c = document.querySelector('#b-library .con'); return {{ add: F.conAdd(), fast: !!c && c.classList.contains('fast'), tx: c ? c.querySelector('.con-sp text').textContent : '' }}; }})()""")
        if r != {'add': 100, 'fast': True, 'tx': '⚡+100%'}: bad.append(f'가속 배지 {r}')
        await pg.screenshot(path='s100_con.png')
        if errs: bad.append(f'페이지 오류 {errs[:3]}')
        await b.close()
    print('\n'.join(bad) if bad else '', 'FAIL' if bad else 'PASS')

asyncio.run(main())
