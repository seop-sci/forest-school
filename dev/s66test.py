# 2.0.0 시험: 학교급 모습 보기, 졸업식 사진, 새 전학생 6종과 전학 대화, 옛 저장 이어가기
# 보는 것
#  1) 유치원에서는 학교급 동그라미가 안 보이고, 초등학교부터 6개(지난 학교급은 누를 수 있고, 못 간 곳은 자물쇠)가 탭 막대 위에 보여요
#  2) 지난 학교급 보기: 사진이 없으면 모두 지어진 모습, 사진이 있으면 그때 레벨. 꾸미기 모드에서 그 지도 장식 자리에 놓고(지금 지도와 따로), 돌아가기
#  3) 종업식과 졸업식에 새 친구가 오면 식 창 다음에 전학 대화(교감 소개, 자기소개 두 줄, 마지막 안내)가 떠요. 전학생은 12종이고 그림이 없으면 그림 문자
#  4) 옛 저장: 전학생 6종을 다 만난 학교는 6종 그대로(불러오며 7번째를 채우지 않아요), 친구 성장 쪽지를 계속 쓸 수 있어요. 초등학교 퀘스트를 다 마친 저장은 e39(초등학교 졸업식)에서 이어가요
#  5) q26 이름과 대사, 초등학교 졸업식은 6학년 장을 마쳐야 열려요
#  6) 화면이 넘치지 않아요(390 밝은, 360 어두운). 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s66test.py   (마지막 줄이 PASS면 통과)
import asyncio, json
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
SKIP = f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {CLEAN}; }})()"
OVER = """(sel) => { const W = innerWidth; const r = document.querySelector(sel); if (!r) return -1;
  return [...r.querySelectorAll('*')].filter(e => { const q = e.getBoundingClientRect(); return q.width && e.offsetParent !== null && (q.right > W + 1 || q.left < -1); }).length; }"""

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, scheme in ((390, 'light'), (360, 'dark')):
            ctx = await b.new_context(viewport={'width': w, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme=scheme)
            await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(2500); await pg.evaluate(SKIP)
            await pg.wait_for_timeout(1200)
            r = await pg.evaluate("document.querySelector('#tierDots').hidden")
            if not r: bad.append(f'{w}: 유치원에서 학교급 동그라미가 보여요')
            # 초등학교 1학년(유치원 사진 없음)
            await pg.evaluate(f"(() => {{ const F = {F}, S = F.S; S.tier = 1; S.f.science = 1; S.deco.own.bench = 3; F.renderMap(); F.renderTierDots(); }})()")
            await pg.wait_for_timeout(1200)
            r = await pg.evaluate("""(() => { const d = document.querySelector('#tierDots'), t = document.querySelector('.tabs').getBoundingClientRect(), q = d.getBoundingClientRect();
              return { hidden: d.hidden, n: d.querySelectorAll('.td').length, past: d.querySelectorAll('.td.past').length, cur: d.querySelectorAll('.td.cur').length, lock: d.querySelectorAll('.td.lock').length, above: q.bottom <= t.top + 1 }; })()""")
            if r != {'hidden': False, 'n': 6, 'past': 1, 'cur': 1, 'lock': 4, 'above': True}: bad.append(f'{w}: 동그라미 {r}')
            await pg.click('#tierDots .td.past'); await pg.wait_for_timeout(400)
            r = await pg.evaluate("""(() => { const v = document.querySelector('#tierView'); return { open: !v.hidden, title: document.querySelector('#tvTitle').textContent, sub: document.querySelector('#tvSub').textContent,
              imgs: v.querySelectorAll('#tvMap image').length, lv: v.querySelectorAll('.tv-lv').length }; })()""")
            print('유치원 보기', json.dumps(r, ensure_ascii=False))
            if not r['open'] or '유치원 시절' not in r['title'] or '모두 지어진' not in r['sub'] or r['lv'] != 0 or r['imgs'] < 7: bad.append(f'{w}: 유치원 보기 {r}')
            await pg.screenshot(path=f's66_view0_{w}.png')
            # 지난 지도 꾸미기
            await pg.click('#tvEdit'); await pg.wait_for_timeout(200)
            r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; const slots = document.querySelectorAll('#tvMap [data-tvslot]').length;
              F.openDecoPick(2); const ok = F.decoPut(2, 'bench'); {CLEAN};
              return {{ slots, ok, lay0: S.deco.lay[0][2], lay1: S.deco.lay[1][2], main: document.querySelectorAll('#decoG image.deco-it').length, view: document.querySelectorAll('#tvMap image').length }}; }})()""")
            if r['slots'] != 11 or not r['ok'] or r['lay0'] != 'bench' or r['lay1'] != '' or r['main'] != 0: bad.append(f'{w}: 지난 지도 꾸미기 {r}')
            await pg.click('#tvBack'); await pg.wait_for_timeout(200)
            r = await pg.evaluate(f"({{ v: document.querySelector('#tierView').hidden, t: {F}.rt.viewTier }})")
            if r != {'v': True, 't': None}: bad.append(f'{w}: 돌아가기 {r}')
            if w == 390:
                # 종업식 전학 대화: 1학년 종업식이면 세 번째 친구(펭귄)
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; S.tg = 0; S.p.species = 2; S.grade = 4; S.best = 4; S.q.m = F.MAIN.findIndex(q => q.id === 'e12'); S.q.lat = '';
                  const can = F.canGraduate(); F.graduate(); return {{ can, sp: S.p.species, q: F.rt.modalQueue.length, open: F.rt.modalOpen && F.rt.modalOpen.id }}; }})()""")
                await pg.wait_for_timeout(500)
                if not r['can'] or r['sp'] != 3 or r['open'] != 'mGrad' or r['q'] != 1: bad.append(f'종업식 창 순서 {r}')
                await pg.click('#gradOk'); await pg.wait_for_timeout(500)
                r = await pg.evaluate("""(() => ({ open: !document.querySelector('#mTalk').hidden, who: document.querySelector('#talkWho').textContent, text: document.querySelector('#talkText').textContent, step: document.querySelector('#talkStep').textContent }))()""")
                print('전학 대화', json.dumps(r, ensure_ascii=False))
                if not r['open'] or r['who'] != '교감 고슴도치' or '펭귄이 전학 왔답니다' not in r['text'] or r['step'] != '1 / 4': bad.append(f'전학 대화 시작 {r}')
                o = await pg.evaluate(OVER, '#mTalk')
                if o: bad.append(f'전학 대화 창이 {o}곳 넘쳐요')
                await pg.screenshot(path='s66_talk1.png')
                lines = []
                for i in range(4):
                    lines.append(await pg.evaluate("[document.querySelector('#talkWho').textContent, document.querySelector('#talkText').textContent, document.querySelector('#talkNext').textContent]"))
                    if i == 1: await pg.screenshot(path='s66_talk2.png')
                    await pg.click('#talkNext'); await pg.wait_for_timeout(250)
                print('대사', json.dumps(lines, ensure_ascii=False))
                if lines[1][0] != '새 친구 펭귄' or lines[3][2] != '반가워요!' or '5%' not in lines[3][1]: bad.append(f'전학 대사 {lines}')
                await pg.wait_for_timeout(400)
                if not await pg.evaluate("document.querySelector('#mTalk').hidden"): bad.append('전학 대화가 닫히지 않아요')
                # 새 전학생 6종: 그림이 없으면 그림 문자, 대사가 모두 있어요
                r = await pg.evaluate(f"""(() => {{ const F = {F}; return {{ n: F.NEWCOMERS.length, ks: F.NEWCOMERS.slice(6).map(n => n.k), emoji: F.NEWCOMERS.slice(6).map(n => F.kidSVG(n.k, 0).includes('<text')),
                  lines: F.NEWCOMERS.map(n => F.showNewTalk && n.k), dex: F.DEX_KEYS.length }}; }})()""")
                if r['n'] != 12 or r['ks'] != ['hamster', 'duck', 'turtle', 'mole', 'frog', 'waterdeer']: bad.append(f'새 전학생 {r}')
                if not all(r['emoji']): bad.append(f'그림 문자 {r["emoji"]}')
                await pg.evaluate(CLEAN)
                # 옛 저장: 전학생 6종을 다 만난 초등학교 6학년(퀘스트 다 마침, 쪽지 2장)
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; const d = JSON.parse(JSON.stringify(S));
                  d.tier = 1; d.tg = 5; d.st.grads = 7; d.p.species = 6; d.p.ticket = 2; d.p.nl = [1, 0, 0, 0, 0, 0]; d.q = {{ init: true, m: 999, mid: 'end:e38', mb: 0, subs: [], done: [], gen: 0, subDone: 0, seen: 0, qv: 2 }};
                  delete d.roster; delete d.club; delete d.snap;
                  const s = F.sanitize(d); const q = F.MAIN[s.q.m];
                  const q26 = F.MAIN.find(x => x.id === 'q26');
                  return {{ species: s.p.species, nl: s.p.nl.length, ticket: s.p.ticket, q: q && q.id, q26: [q26.title, q26.how], tfp: s.tfp }}; }})()""")
                print('옛 저장', json.dumps(r, ensure_ascii=False))
                if r['species'] != 6 or r['nl'] != 12 or r['ticket'] != 2: bad.append(f'옛 저장 전학생 {r}')
                if r['q'] != 'e39': bad.append(f'옛 저장 퀘스트 {r["q"]}')
                if r['q26'][0] != '여섯 번째 전학생 맞이하기' or '마지막' in r['q26'][1]: bad.append(f'q26 {r["q26"]}')
                # 친구 성장 쪽지: 6종을 만난 학교는 계속 키울 수 있어요
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; S.p.species = 6; S.p.ticket = 2; S.p.nl = Array(12).fill(0); S.p.nl[0] = 1; F.setTab('grad'); F.renderGradPanel && 0;
                  return {{ grow: document.querySelectorAll('#friendList [data-grow]').length, locked: document.querySelectorAll('#friendList .friend.locked').length, note: !document.querySelector('#friendNote').hidden }}; }})()""")
                if r != {'grow': 6, 'locked': 6, 'note': True}: bad.append(f'친구 성장 쪽지 {r}')
                # 초등학교 졸업식은 6학년 장을 마쳐야
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; S.tier = 1; S.tg = 5; S.grade = 4; S.best = 4; S.q.m = F.MAIN.findIndex(q => q.id === 'e15'); S.q.lat = '';
                  const a = F.canPromote(); F.setTab('grad'); const li = [...document.querySelectorAll('#tierReqs li')].map(l => [l.className, l.textContent]);
                  S.q.m = F.MAIN.findIndex(q => q.id === 'e39'); const b2 = F.canPromote(); return {{ a, b: b2, li }}; }})()""")
                print('졸업식 잠금', json.dumps(r, ensure_ascii=False))
                if r['a'] or not r['b'] or len(r['li']) != 3 or '남은 퀘스트' not in r['li'][2][1]: bad.append(f'졸업식 잠금 {r}')
                # 졸업식 사진이 있는 초등학교 보기(중학교에서)
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; Object.assign(S.f, {{ classroom: 30, cafeteria: 22, library: 21, playground: 23, science: 13 }}); for (const k in S.fu) S.fu[k] = S.fu[k].map(() => S.f[k]); S.tdip = 100;
                  F.promote(); {CLEAN}; F.setTab('school'); F.tierViewOpen(1);
                  return {{ tier: S.tier, snap: S.snap[1] && S.snap[1].f.classroom, sub: document.querySelector('#tvSub').textContent, lv: document.querySelectorAll('#tvMap .tv-lv').length, kids: S.snap[1].roster.length }}; }})()""")
                print('초등학교 보기', json.dumps(r, ensure_ascii=False))
                if r['tier'] != 2 or r['snap'] != 30 or r['lv'] != 5 or '학생' not in r['sub']: bad.append(f'졸업식 사진 보기 {r}')
                await pg.wait_for_timeout(300); await pg.screenshot(path='s66_view1.png')
                await pg.evaluate(f"{F}.tierViewClose()")
            o = await pg.evaluate(OVER, '#tierView')
            if o > 0: bad.append(f'{w}: 학교급 보기가 {o}곳 넘쳐요')
            bad += [f'{w}: 페이지 오류 {e}' for e in errs]
            await ctx.close()
        await b.close()
    if bad:
        print('FAIL'); [print(' -', x) for x in bad]
    else: print('PASS')
asyncio.run(main())
