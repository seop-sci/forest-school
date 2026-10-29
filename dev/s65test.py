# 2.0.0 시험: 학생 명부, 능력치, 동아리(자동 추천, 보너스, 바꾸기), 발표회, 주간 성장, 저장
# 보는 것
#  1) 초등학교 졸업식을 열면 중학교 명부 15명이 생기고(2.1.0, 방금 전학 온 햄스터 포함, 만난 12종이 모두 들어가요), 동아리는 비어 있어요. 졸업식 사진(S.snap[1])이 남아요
#  2) 자동 추천: 동아리마다 3명, 두 학생을 맞바꿔도 별 합이 더 커지지 않아요(가장 좋은 나누기). 보너스는 별 하나에 2%, 30%까지, 미술부 할인은 절반
#  3) 보너스가 수업료, 행사 보상, 장식 값에 들어가고 값이 유한해요. 동아리 바꾸기(자리가 차 있으면 맞바꿈)와 빼기
#  4) 발표회: 부원 능력치 +4(2.1.0), 수업료 30분치, 하루 한 번(게임 시계). 한 주가 지나면 부원이 자라고, 동아리 건물을 키우면 부원 +1
#  5) 저장했다 불러와도 남고, 옛 저장과 망가진 명부도 받아 줘요. 퀘스트 측정(club, clubSum, star, clubShown, fpUp)
#  6) 복도와 동아리실 화면이 넘치지 않아요(390 밝은, 360 어두운). 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s65test.py   (마지막 줄이 PASS면 통과)
import asyncio, json
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
SKIP = f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {CLEAN}; }})()"
OVER = """(sel) => { const W = innerWidth; const r = document.querySelector(sel); if (!r) return -1;
  return [...r.querySelectorAll('*')].filter(e => { const q = e.getBoundingClientRect(); return q.width && e.offsetParent !== null && (q.right > W + 1 || q.left < -1); }).length; }"""
# 초등학교 6학년 끝(졸업식 퀘스트)에서 졸업식을 열어요
PROMOTE = f"""(() => {{ const F = {F}, S = F.S; S.tier = 1; S.tg = 5; S.sem = 1; S.p.species = 6; Object.assign(S.f, {{ classroom: 38, cafeteria: 30, library: 28, playground: 28, science: 18 }});
  for (const k in S.fu) S.fu[k] = S.fu[k].map(() => S.f[k]); S.students = 158; S.tdip = 250; S.grade = 4; S.best = 4;
  S.q.m = F.MAIN.findIndex(q => q.id === 'e39'); S.q.lat = ''; F.checkGrade();
  const can = F.canPromote(); F.promote(); {CLEAN};
  return {{ can, tier: S.tier, n: S.roster.list.length, sp: S.roster.list.map(s => s.sp), clubs: S.roster.list.filter(s => s.c >= 0).length, snap: S.snap[1] && S.snap[1].f, tfp: S.tfp, fperks: S.st.fperks, q: (F.curMain() || {{}}).id }}; }})()"""

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, scheme in ((390, 'light'), (360, 'dark')):
            ctx = await b.new_context(viewport={'width': w, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme=scheme)
            await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(2500); await pg.evaluate(SKIP)
            r = await pg.evaluate(PROMOTE)
            print('졸업식', json.dumps(r, ensure_ascii=False))
            if not r['can'] or r['tier'] != 2: bad.append(f'졸업식을 열지 못했어요 {r}')
            if r['n'] != 15 or len(set(r['sp'])) != 12 or 'hamster' not in r['sp']: bad.append(f'명부 {r["sp"]}')
            if r['clubs'] != 0: bad.append(f'처음 동아리가 비어 있어야 해요 {r["clubs"]}')
            if not r['snap'] or r['snap']['classroom'] != 38: bad.append(f'졸업식 사진 {r["snap"]}')
            if r['tfp'] != r['fperks']: bad.append(f'tfp {r}')
            if r['q'] != 'e39': bad.append(f'졸업식 퀘스트에서 이어가야 해요 {r["q"]}')
            if w == 390:
                # 자동 추천과 보너스
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S, L = S.roster.list;
                  const q0 = F.qMeasure(F.MAIN.find(q => q.id === 'j4'));
                  const r0 = F.rate(); F.clubAuto(true); const r1 = F.rate();
                  const per = [0, 1, 2, 3, 4].map(c => F.clubMembers(c).length);   // 2.0.1 수학부까지 5곳
                  const tot = () => L.reduce((n, s) => n + (s.c >= 0 ? F.star(s.a[F.CLUBS[s.c].ab]) : 0), 0);
                  const t0 = tot(); let better = 0;
                  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {{ const a = L[i].c, b = L[j].c; if (a === b) continue; L[i].c = b; L[j].c = a; if (tot() > t0) better++; L[i].c = a; L[j].c = b; }}
                  const pct = [0, 1, 2, 3, 4].map(F.clubPct), show = [0, 1, 2, 3, 4].map(F.clubShow), stars = [0, 1, 2, 3, 4].map(F.clubStars);
                  const q1 = F.qMeasure(F.MAIN.find(q => q.id === 'j4')), qs = F.qMeasure(F.MAIN.find(q => q.id === 'j11'));
                  const fest = F.festPrize(false), dc0 = F.decoCost0('bench'), dc = F.decoCost('bench');
                  return {{ q0, q1, qs, r0, r1, per, t0, better, pct, show, stars, sum: F.clubSum(), tm: F.clubTuitionMult(), fm: F.clubFestMult(), off: F.clubDecoOff(), fest, dc0, dc }}; }})()""")
                print('자동 추천', json.dumps(r))
                if sum(r['per']) != 15 or max(r['per']) > 3 or r['q0'] != 0 or r['q1'] != 15: bad.append(f'나누기 {r}')   # 2.1.0 다섯 곳에 15명(자리 15)
                if r['better']: bad.append(f'자동 추천보다 나은 맞바꾸기가 {r["better"]}개 있어요')
                if any(p != min(30, 2 * s) for p, s in zip(r['pct'], r['stars'])): bad.append(f'보너스 계산 {r["pct"]} {r["stars"]}')
                if r['show'][3] != r['pct'][3] // 2 or r['sum'] != sum(r['show']) or r['qs'] != r['sum']: bad.append(f'보이는 보너스 {r}')
                if abs(r['tm'] - (1 + (r['pct'][0] + r['pct'][2] + r['pct'][4]) / 100)) > 1e-9 or abs(r['r1'] / r['r0'] - r['tm']) > 1e-6: bad.append(f'수업료 배수 {r}')
                if abs(r['fm'] - (1 + r['pct'][1] / 100)) > 1e-9 or not (0 < r['fest'] < 1e20): bad.append(f'행사 보상 {r}')
                if r['dc'] > r['dc0'] or (r['off'] > 0 and r['dc'] == r['dc0'] and r['dc0'] > 5): bad.append(f'미술부 할인 {r}')
                # 바꾸기와 빼기
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S, L = S.roster.list;
                  const i = L.findIndex(s => s.c === 1), j = L.findIndex(s => s.c === 0);
                  const low = F.clubMembers(0).sort((x, y) => x.a[0] - y.a[0])[0];
                  F.rt.fakeNow = Date.now() + 3 * 86400000;
                  const before = [0, 1, 2, 3, 4].map(c => F.clubMembers(c).length), full0 = before[0] >= 3;
                  F.clubSet(i, 0); const after = [0, 1, 2, 3, 4].map(c => F.clubMembers(c).length), moved = L[i].c, lowc = low.c, cw = L[i].cw;
                  F.clubSet(i, -1); const out = [L[i].c, [0, 1, 2, 3, 4].map(c => F.clubMembers(c).length)];
                  F.clubAuto(true); return {{ before, full0, after, moved, lowc, cw, wk: F.S.roster.wk, out }}; }})()""")
                print('바꾸기', json.dumps(r))
                exp = r['before'] if r['full0'] else [r['before'][0] + 1, r['before'][1] - 1] + r['before'][2:]
                if r['after'] != exp or r['moved'] != 0 or (r['full0'] and r['lowc'] != 1): bad.append(f'꽉 찬 동아리 맞바꾸기 {r}')
                if r['out'][0] != -1 or sum(r['out'][1]) != 14: bad.append(f'동아리 빼기 {r["out"]}')
                # 발표회, 하루 한 번
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; F.rt.fakeNow = Date.now() + 10 * 86400000;
                  const ready0 = F.showReady(), mem = F.clubMembers(2), a0 = mem.map(s => s.a[2]), b0 = S.budget, prize = Math.max(10, F.nice(F.rate() * 60 * 30));
                  const ok = F.clubShowGo(2); {CLEAN};
                  const a1 = mem.map(s => s.a[2]), got = S.budget - b0, ready1 = F.showReady(), again = F.clubShowGo(1);
                  F.rt.fakeNow += 86400000; const ready2 = F.showReady();
                  const q = [F.qMeasure(F.MAIN.find(x => x.id === 'j7')), F.qMeasure(F.MAIN.find(x => x.id === 'j25'))];
                  return {{ ready0, ok, a0, a1, got, prize, ready1, again, ready2, shows: S.st.shows, shown: S.club.shown, q }}; }})()""")
                print('발표회', json.dumps(r))
                if not (r['ready0'] and r['ok'] and not r['ready1'] and not r['again'] and r['ready2']): bad.append(f'발표회 하루 한 번 {r}')
                if any(min(100, x + 4) != y for x, y in zip(r['a0'], r['a1'])): bad.append(f'발표회 능력치 {r["a0"]} {r["a1"]}')
                if abs(r['got'] - r['prize']) > 1e-6 * r['prize'] + 1 or r['shows'] != 1 or r['shown'] != [0, 0, 1, 0, 0] or r['q'] != [1, 1]: bad.append(f'발표회 보상과 기록 {r}')
                # 주간 성장과 건물 성장
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S, L = S.roster.list;
                  L.forEach(s => {{ s.cw = 0; }}); const w = F.gameWeek(); S.roster.wk = w - 2;
                  const sci = F.clubMembers(0), s0 = sci.map(s => s.a[0]), lv = S.f.science, none = L.filter(s => s.c < 0).map(s => s.a.slice());
                  F.clubWeekTick(); const s1 = sci.map(s => s.a[0]);
                  const before = sci.map(s => s.a[0]); S.budget = 1e30; for (const k in S.fu) S.fu[k] = S.fu[k].map(() => 99);
                  const okb = F.buyFacility('science'); F.conFinish('science'); const s2 = sci.map(s => s.a[0]);
                  return {{ w, wk: S.roster.wk, lv, s0, s1, before, okb, s2, none, none2: L.filter(s => s.c < 0).map(s => s.a.slice()) }}; }})()""")
                print('성장', json.dumps(r))
                g = 5 + r['lv'] // 10
                if r['wk'] != r['w'] or any(min(100, x + 2 * g) != y for x, y in zip(r['s0'], r['s1'])): bad.append(f'주간 성장(두 주) {r}')
                if not r['okb'] or any(min(100, x + 1) != y for x, y in zip(r['before'], r['s2'])): bad.append(f'건물 성장 {r}')
                if r['none'] != r['none2']: bad.append('동아리 밖 학생이 자랐어요')
                # 저장과 옛 저장
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S;
                  const back = F.sanitize(JSON.parse(JSON.stringify(S)));
                  const canon = o => JSON.stringify(o, (k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort()) : v);
                  const same = [canon(back.roster) === canon(S.roster), canon(back.club) === canon(S.club), canon(back.snap) === canon(S.snap)];
                  const old = JSON.parse(JSON.stringify(S)); delete old.roster; delete old.club; delete old.snap; delete old.tfp;
                  const o = F.sanitize(old);
                  const broken = JSON.parse(JSON.stringify(S)); broken.roster.list = [{{ sp: 'dragon', nm: 'x', a: [1, 2, 3, 4], c: 0 }}, ...Array.from({{ length: 5 }}, () => ({{ sp: 'fox', nm: '<b>여우</b>', a: [999, -5, 'a', 50], c: 1 }}))];
                  broken.snap = {{ 1: {{ f: {{ classroom: 1e9 }}, st: -3 }}, 5: {{ f: {{}} }} }};
                  const k = F.sanitize(broken);
                  return {{ same, old: [o.roster.list.length, o.club.last, Object.keys(o.snap).length, o.tfp], br: k.roster.list.map(s => [s.sp, s.nm, s.a, s.c]), snap: k.snap }}; }})()""")
                print('저장', json.dumps(r, ensure_ascii=False))
                if r['same'] != [True, True, True]: bad.append(f'저장했다 불러온 명부와 동아리가 달라요 {r["same"]}')
                if r['old'][0] != 0 or r['old'][1] != -1 or r['old'][2] != 0: bad.append(f'옛 저장 {r["old"]}')
                br = r['br']
                if len(br) != 5 or any(s[0] != 'fox' for s in br) or sum(1 for s in br if s[3] == 1) != 3 or any('<' in s[1] for s in br) or any(not (1 <= v <= 100) for s in br for v in s[2]):
                    bad.append(f'망가진 명부 {br}')
                if '5' in r['snap'] or r['snap'].get('1', {}).get('f', {}).get('classroom') != 99: bad.append(f'망가진 사진 {r["snap"]}')
                # fpUp 퀘스트: 학교급에 와서 고친 횟수
                r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S, q = F.MAIN.find(x => x.id === 'j29'); const a = F.qMeasure(q); S.fund = 100; F.buyFundPerk('schol', document.body); {CLEAN}; return [a, F.qMeasure(q)]; }})()""")
                if r != [0, 1]: bad.append(f'장학재단 퀘스트 {r}')
            # 화면: 복도와 동아리실
            await pg.evaluate(f"{F}.setTab('school')"); await pg.wait_for_timeout(1300)
            r = await pg.evaluate(f"""(() => {{ const b = document.querySelector('#btnHall'); return {{ hall: !b.hidden, n: document.querySelector('#hallN').textContent }}; }})()""")
            if not r['hall']: bad.append(f'{w}: 복도 단추가 안 보여요')
            await pg.click('#btnHall'); await pg.wait_for_timeout(400)
            r = await pg.evaluate("({ doors: document.querySelectorAll('#panelHall .shopfront').length, soon: document.querySelectorAll('#panelHall .shopfront.soon').length, vis: !document.querySelector('#panelHall').hidden })")
            # 작업지시서 20 복도 그림: 방문 6개(동아리실 + 준비 중 5)
            if r != {'doors': 6, 'soon': 2, 'vis': True}: bad.append(f'{w}: 복도 {r}')   # 2.0.1 학생회실, 교무실, 2.1.0 게시판(스티커판)이 열려서 준비 중은 2곳(s73과 같게)
            o = await pg.evaluate(OVER, '#panelHall')
            if o: bad.append(f'{w}: 복도가 {o}곳 넘쳐요')
            await pg.screenshot(path=f's65_hall_{w}.png')
            await pg.click('#hdClub'); await pg.wait_for_timeout(400)
            r = await pg.evaluate("({ cards: document.querySelectorAll('#clubBody .club-card').length, rows: document.querySelectorAll('#clubBody .rs-row').length, seats: document.querySelectorAll('#clubBody .club-seat').length })")
            if r['cards'] != 5 or r['rows'] < 12 or r['seats'] != 15: bad.append(f'{w}: 동아리실 {r}')
            o = await pg.evaluate(OVER, '#panelClub')
            if o: bad.append(f'{w}: 동아리실이 {o}곳 넘쳐요')
            await pg.screenshot(path=f's65_club_{w}.png', full_page=False)
            await pg.click('#clubBody .club-seat'); await pg.wait_for_timeout(300)
            r = await pg.evaluate("({ open: !document.querySelector('#mSeat').hidden, rows: document.querySelectorAll('#seatList [data-pick]').length })")
            if not r['open'] or r['rows'] < 12: bad.append(f'{w}: 자리 고르기 창 {r}')
            o = await pg.evaluate(OVER, '#mSeat')
            if o: bad.append(f'{w}: 자리 고르기 창이 {o}곳 넘쳐요')
            await pg.screenshot(path=f's65_seat_{w}.png')
            await pg.click('#seatClose'); await pg.wait_for_timeout(300)
            await pg.click('#clubBody .rs-row'); await pg.wait_for_timeout(300)
            r = await pg.evaluate("document.querySelectorAll('#seatList [data-pickc]').length")
            if r != 5: bad.append(f'{w}: 학생 동아리 고르기 {r}')
            await pg.click('#seatList [data-pickc="3"]'); await pg.wait_for_timeout(300)
            bad += [f'{w}: 페이지 오류 {e}' for e in errs]
            await ctx.close()
        await b.close()
    if bad:
        print('FAIL'); [print(' -', x) for x in bad]
    else: print('PASS')
asyncio.run(main())
