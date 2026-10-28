# 1.7.0 시험(2.0.0 매주 이벤트로 고침): 동물 도감(등록, 옛 저장 자동 채우기, 도감 선물 한 번만), 이벤트(달력 규칙, 출석 도장 하루 한 번과 5개째 큰 보상, 미션과 기념 상자,
#   달이 바뀌면 새 회차, 특별 이벤트 표, 특별 이벤트와 겹치는 달의 반복 이벤트 건너뛰기와 쉬는 안내 한 줄, 못 하는 미션 대신 넣기,
#   새 저장(놀이터 없음)과 시설과 가구를 모두 최고로 올린 학교에서 모든 달의 미션이 이룰 수 있는 종류인지), 분치 보정, 밝은 화면 390px과 어두운 화면 360px에서 넘침 없음
# 쓰는 법: python3 wrap.py && python3 s48test.py   (마지막 줄이 PASS면 통과)
import asyncio, json, sys
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay.center').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
# 기기 시간을 흉내 내요: Date.now만 바꿔요(게임 시계 gameNow는 서버 시간이 없으면 기기 시간을 써요).
# 날짜는 앞으로만 돌려요. 1.6.0 공용 시계(gameNow, gameToday)는 시간이 뒤로 가면 막기 때문이에요
FAKE = "(()=>{ const real = Date.now; window.__off = 0; Date.now = () => real() + window.__off; })()"

def kst_noon(y, m, d):
    # 한국 시간 낮 12시 = 협정 세계시 03:00
    import calendar
    return calendar.timegm((y, m, d, 3, 0, 0)) * 1000

async def boot(ctx, save=None):
    pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    if save is not None:
        await pg.add_init_script(f"localStorage.setItem('forest-school-v1', {json.dumps(json.dumps(save))});")
    await pg.goto(URL); await pg.wait_for_timeout(2500)
    await pg.evaluate(f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {CLEAN}; {F}.EV_SPECIAL.forEach(e => {{ e.start = ''; e.end = ''; }}); }})()")   # 실제 날짜 표는 s56에서 봐요. 여기서는 비우고 규칙만 봐요
    return pg, errs

async def set_day(pg, y, m, d):
    await pg.evaluate(f"window.__off = {kst_noon(y, m, d)} - (Date.now() - window.__off)")
    await pg.wait_for_timeout(1300)   # tick170이 1초마다 돌아요

async def main():
    fails = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear(); " + FAKE)
        pg, errs = await boot(ctx)
        # 1) 새 게임: 학생이 지도에 나타나면 등록, 다람쥐 선생님은 기록으로 등록, 버튼이 보이고 선물 점이 켜져요
        d1 = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S; const bd=document.querySelector('[data-tab="dex"]'), be=document.querySelector('[data-tab="event"]');
          return {{ got: Object.keys(S.dex.got), tea: !!S.dex.got.tea_squirrel, btn: !!bd && !bd.hidden && !bd.classList.contains('soon') && !!be && !be.hidden && !be.classList.contains('soon'),
            dot: !document.querySelector('#dexDot').hidden, pend: F.dexPending().length, paid: S.dex.paid.length }}; }})()""")
        if not d1['btn']: fails.append('도감이나 이벤트 버튼이 안 보여요')
        if not any(k in d1['got'] for k in ['rabbit', 'fox', 'raccoon', 'chick', 'bear']): fails.append(f"학생을 만났는데 등록이 안 됐어요 {d1['got']}")
        if not d1['tea']: fails.append('다람쥐 선생님이 등록되지 않았어요')
        if not d1['dot'] or d1['pend'] < 2 or d1['paid'] != 0: fails.append(f'선물 점이나 받을 선물 수가 이상해요 {d1}')
        # 2) 도감을 열면 선물 창 하나로 받고, 다시 열거나 다시 불러와도 두 번 받지 않아요
        g = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S; const g0=S.gold, n=F.dexPending().reduce((a,x)=>a+(x.g||0),0), k=F.dexPending().length; F.setTab('dex');
          const m=document.querySelector('#mReward'); const t=document.querySelector('#rwTitle').textContent;
          return {{ n, k, dg: S.gold-g0, title: t, open: !m.hidden, paid: S.dex.paid.length, again: F.dexGift(), body: document.querySelector('#dexBody').textContent.slice(0,40) }}; }})()""")
        if g['dg'] != g['n'] or g['paid'] != g['k']: fails.append(f'도감 선물 황금 도토리 수가 등록 수와 달라요 {g}')
        if not g['open'] or g['title'] != '도감 선물': fails.append(f"도감 선물 창이 안 떴어요 {g}")
        if g['again'] is not False: fails.append('선물을 두 번 줘요')
        await pg.evaluate(CLEAN)
        saved = await pg.evaluate("JSON.parse(localStorage.getItem('forest-school-v1'))")
        if not saved or not saved.get('dex') or len(saved['dex'].get('paid', [])) != g['k']: fails.append('받은 선물이 저장되지 않았어요')
        # 3) 옛 저장(1.7.0 전): 기록으로 기본 5종, 전학생 2종, 선생님 2명을 채우고, 불러온 뒤 처음 열 때 한 번만 선물
        old = dict(saved); old.pop('dex', None); old.pop('ev', None)
        old['p'] = dict(old['p'], species=2); old['t'] = dict(old['t'], owl=1); old['st'] = dict(old['st'], grads=1); old['gold'] = 0
        san = await pg.evaluate(f"(()=>{{ const s={F}.sanitize({json.dumps(old)}); return {{ got: Object.keys(s.dex.got).sort(), paid: s.dex.paid, cur: s.ev.cur }}; }})()")
        want = sorted(['rabbit', 'fox', 'raccoon', 'chick', 'bear', 'cat', 'dog', 'tea_squirrel', 'tea_owl', 'tea_hedgehog'])   # 1.7.0: 교감 선생님은 처음부터 등록
        if san['got'] != want or san['paid'] != [] or san['cur'] != '': fails.append(f'옛 저장 자동 등록이 틀려요 {san}')
        bad = await pg.evaluate(f"(()=>{{ const s={F}.sanitize({{born:1, savedAt:5, dex:{{got:{{rabbit:'x', bogus:3, fox:7}}, paid:['rabbit','zzz']}}, ev:{{cur:5, stamp:{{n:99, last:7}}, list:[{{t:'nope', n:3}}, {{t:'picks', n:5, b:1, done:true}}]}}}}); return {{ got: s.dex.got, paid: s.dex.paid, ev: s.ev }}; }})()")
        if set(bad['got']) != {'rabbit', 'fox'} or bad['got']['fox'] != 7 or bad['paid'] != ['rabbit']: fails.append(f'이상한 도감 저장을 걸러 내지 못했어요 {bad}')
        if bad['ev']['cur'] != '' or bad['ev']['stamp'] != {'n': 7, 'last': ''} or len(bad['ev']['list']) != 1 or bad['ev']['list'][0]['t'] != 'picks': fails.append(f'이상한 이벤트 저장을 걸러 내지 못했어요 {bad}')
        pg2, errs2 = await boot(ctx, old)
        r = await pg2.evaluate(f"""(()=>{{ const F={F}, S=F.S; const g0=S.gold, n=F.dexPending().length; F.setTab('dex');
          const t=document.querySelector('#rwTitle').textContent, sub=document.querySelector('#rwSub').textContent; const dg=S.gold-g0; {CLEAN};
          F.setTab('school'); F.setTab('dex'); return {{ n, dg, title: t, sub, paid: S.dex.paid.length, again: S.gold-g0-dg, bud: S.budget }}; }})()""")
        if r['n'] != 11 or r['dg'] != 10 or r['paid'] != 11 or r['again'] != 0: fails.append(f'옛 저장 도감 선물(등록 10개와 5종 보상)이 틀려요 {r}')
        if '등' not in r['sub']: fails.append(f'선물 창 설명이 묶여 있지 않아요 {r}')
        saved2 = await pg2.evaluate("JSON.parse(localStorage.getItem('forest-school-v1'))")
        pg3, errs3 = await boot(ctx, saved2)
        r3 = await pg3.evaluate(f"(()=>{{ const F={F}, S=F.S; const g0=S.gold; F.setTab('dex'); return {{ dg: S.gold-g0, open: !document.querySelector('#mReward').hidden, pend: F.dexPending().length }}; }})()")
        if r3['dg'] != 0 or r3['open'] or r3['pend'] != 0: fails.append(f'다시 불러오니 선물을 또 줘요 {r3}')
        await pg2.close(); await pg3.close()
        # 새 저장(놀이터 없음)으로 이벤트를 열면 미션 3개가 모두 이룰 수 있는 종류이고 겹치지 않아요
        ctx2 = await b.new_context(viewport={'width': 390, 'height': 844})
        await ctx2.add_init_script("window.__FOREST_TEST = true; localStorage.clear(); " + FAKE)
        pn, errsn = await boot(ctx2)
        await set_day(pn, 2026, 11, 3)
        nw = await pn.evaluate(f"""(()=>{{ const F={F}, S=F.S; const out={{ pg: S.f.playground, cur: S.ev.cur, list: S.ev.list.map(m=>m.t), bad: [] }};
          const doable = ['claims', 'dmDone', 'pz', 'mgOrd'];   // 놀이터 없는 새 학교가 할 수 있는 종류 (1.6.0부터 오늘의 미션은 놀이터 없이도 고치기와 연수가 나와요)
          const rows = [];
          for (let mo = 1; mo <= 12; mo++) for (const e of F.EV_MONTHLY) rows.push({{ def: e, start: `2026-${{String(mo).padStart(2,'0')}}-01` }});
          for (const e of F.EV_SPECIAL) rows.push({{ def: e, start: '2026-12-24' }});
          for (const r of rows) {{ const ts = F.evMissions(r).map(m=>m.t);
            if (ts.length !== 3 || new Set(ts).size !== 3 || ts.some(t => !F.evOk(t) || !doable.includes(t))) out.bad.push(r.def.id + r.start.slice(5,7) + ':' + ts.join(','));
            if (ts.some(t => !Number.isFinite(F.evVal(t)))) out.bad.push('셀 수 없음:' + ts.join(',')); }}
          out.ok = Object.keys(F.EV_MEASURE).filter(t => F.evOk(t));
          return out; }})()""")
        if nw['pg'] != 0 or nw['cur'] != 'harvest:2026-11-02': fails.append(f'새 저장 이벤트 준비가 이상해요 {nw}')
        if len(nw['list']) != 3 or len(set(nw['list'])) != 3 or any(t not in ('claims', 'dmDone', 'pz', 'mgOrd') for t in nw['list']): fails.append(f"새 저장 이벤트 미션에 못 하는 종류가 있어요 {nw['list']}")
        if nw['bad']: fails.append(f"놀이터 없는 학교에서 이룰 수 없는 미션이 나와요 {nw['bad'][:6]}")
        if sorted(nw['ok']) != ['claims', 'dmDone', 'mgOrd', 'pz', 'trains', 'ups']: fails.append(f"놀이터 없을 때 할 수 있는 종류가 달라요 {nw['ok']}")
        # 흔들기: 놀이터 0에서는 참나무를 눌러도 횟수가 그대로라 미션으로 나오면 안 돼요(위에서 확인). 놀이터를 지으면 다시 나와요
        built = await pn.evaluate(f"(()=>{{ const F={F}, S=F.S; S.f.playground=1; return Object.keys(F.EV_MEASURE).filter(t => F.evOk(t)).sort(); }})()")
        if not all(t in built for t in ('picks', 'shakes', 'dmDone')): fails.append(f'놀이터를 지어도 줍기, 흔들기, 오늘의 미션이 안 열려요 {built}')
        # 시설과 가구를 모두 최고로 올린 학교: 고치기는 빠지고, 모든 달의 미션이 이룰 수 있는 종류이고 겹치지 않아요
        mx = await pn.evaluate(f"""(()=>{{ const F={F}, S=F.S; const cap=F.facCap(); for (const k of F.facKeys()) {{ S.f[k]=cap; S.fu[k]=S.fu[k].map(()=>cap); }}
          const out={{ ups: F.evOk('ups'), ok: Object.keys(F.EV_MEASURE).filter(t => F.evOk(t)).sort(), bad: [] }};
          const rows = [];
          for (let mo = 1; mo <= 12; mo++) for (const e of F.EV_MONTHLY) rows.push({{ def: e, start: `2026-${{String(mo).padStart(2,'0')}}-01` }});
          for (const e of F.EV_SPECIAL) rows.push({{ def: e, start: '2026-12-24' }});
          for (const r of rows) {{ const ts = F.evMissions(r).map(m=>m.t); if (ts.length !== 3 || new Set(ts).size !== 3 || ts.some(t => !F.evOk(t))) out.bad.push(r.def.id + r.start.slice(5,7) + ':' + ts.join(',')); }}
          S.fu.classroom[0] = cap - 1; out.upsAgain = F.evOk('ups');   // 가구 하나만 덜 끝나도 다시 고치기가 돼요
          return out; }})()""")
        if mx['ups'] is not False or 'ups' in mx['ok']: fails.append(f'모두 최고 레벨인데 고치기가 할 수 있는 미션으로 나와요 {mx}')
        if mx['bad']: fails.append(f"모두 최고 레벨인 학교에서 이룰 수 없는 미션이 나와요 {mx['bad'][:6]}")
        if mx['upsAgain'] is not True: fails.append('가구가 덜 끝났는데 고치기가 안 돼요')
        if errsn: fails.append(f'새 저장 페이지 오류 {errsn}')
        await ctx2.close()
        # 4) 이벤트(2.0.0 매주): 11월 3일(화)은 11월 2일(월)에 시작한 주의 도토리 수확 축제
        await set_day(pg, 2026, 11, 3)
        e = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S; F.setTab('event'); const txt=document.querySelector('#evBody').textContent;
          return {{ cur: S.ev.cur, list: S.ev.list.map(m=>m.t), n: S.ev.list.length, txt: txt.slice(0,200), btn: !!document.querySelector('[data-ev="stamp"]'), day: F.gameToday(), dot: !document.querySelector('#evDot').hidden }}; }})()""")
        if e['cur'] != 'harvest:2026-11-02' or e['n'] != 3 or e['day'] != '2026-11-03': fails.append(f'11월 3일 이벤트 회차가 틀려요 {e}')
        if '도토리 수확 축제' not in e['txt'] or '11월 2일 ~ 11월 8일' not in e['txt'] or not e['btn'] or not e['dot']: fails.append(f'이벤트 화면이나 도장 버튼이 안 보여요 {e}')
        # 출석 도장: 하루 한 번, 날이 바뀌면 또, 5개째 큰 보상(2.0.0: 황금 도토리 1개)
        s1 = await pg.evaluate(f"(()=>{{ const F={F}, S=F.S; const g0=S.gold, b0=S.budget; const a=F.claimStamp(); {CLEAN}; const b=F.claimStamp(); return {{ a, b, n: S.ev.stamp.n, last: S.ev.stamp.last, acorn: S.budget-b0, gold: S.gold-g0 }}; }})()")
        if not (s1['a'] is True and s1['b'] is False and s1['n'] == 1 and s1['last'] == '2026-11-03' and s1['acorn'] > 0 and s1['gold'] == 0): fails.append(f'첫 도장이 틀려요 {s1}')
        await set_day(pg, 2026, 11, 4)
        s2 = await pg.evaluate(f"(()=>{{ const F={F}, S=F.S; const a=F.claimStamp(); {CLEAN}; return {{ a, n: S.ev.stamp.n, cur: S.ev.cur }}; }})()")
        if not (s2['a'] is True and s2['n'] == 2 and s2['cur'] == 'harvest:2026-11-02'): fails.append(f'다음 날 도장이 틀려요 {s2}')
        await set_day(pg, 2026, 11, 8)
        s5 = await pg.evaluate(f"(()=>{{ const F={F}, S=F.S; S.ev.stamp.n=4; const g0=S.gold; const a=F.claimStamp(); const t=document.querySelector('#rwTitle').textContent; {CLEAN}; return {{ a, n: S.ev.stamp.n, gold: S.gold-g0, t, cur: S.ev.cur }}; }})()")
        if not (s5['a'] is True and s5['n'] == 5 and s5['gold'] == 1 and '5개째' in s5['t'] and s5['cur'] == 'harvest:2026-11-02'): fails.append(f'5개째 큰 보상(일요일까지 같은 회차)이 틀려요 {s5}')
        # 미션: 횟수 통계의 차이로 재고, 셋 다 하면 기념 상자(2.0.0: 황금 도토리 1개, 수료증 1장)
        m = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S; const out={{}}; out.before=F.claimEvMission(0);
          S.ev.list.forEach(x=>{{ if (x.t === 'mgOrd') S.mg.st.orders = x.b + x.n; else S.st[x.t] = x.b + x.n; }}); const g0=S.gold, d0=S.p.dip;
          out.m=[0,1,2].map(i=>{{ const r=F.claimEvMission(i); {CLEAN}; return r; }}); out.boxBefore=S.ev.box; out.box=F.claimEvBox(); {CLEAN}; out.again=F.claimEvBox();
          out.gold=S.gold-g0; out.dip=S.p.dip-d0; out.done=S.ev.list.every(x=>x.done); out.mins=S.ev.list.map(x=>x.m); return out; }})()""")
        if m['before'] is not False or m['m'] != [True, True, True] or m['box'] is not True or m['again'] is not False: fails.append(f'이벤트 미션과 상자가 틀려요 {m}')
        if m['gold'] != 3 + 1 or m['dip'] != 1: fails.append(f'미션 보상(황금 3개와 상자 1개, 수료증 1장)이 틀려요 {m}')
        if m['mins'] != [10, 10, 10]: fails.append(f'미션 도토리 분치가 3분의 2가 아니에요(11월 수확 축제 15분치 → 10) {m}')
        # 월요일이 되면 다음 이벤트 새 회차(도장 0). 유치원(운동회, 체험학습 아직 못 함)에서는 친구 주간 미션이 대신 미션으로 바뀌어요
        await set_day(pg, 2026, 11, 9)
        fr = await pg.evaluate(f"(()=>{{ const F={F}, S=F.S; F.setTab('school'); F.setTab('event'); return {{ cur: S.ev.cur, list: S.ev.list.map(m=>m.t), n: S.ev.stamp.n, txt: document.querySelector('#evBody').textContent.slice(0,120) }}; }})()")
        if fr['cur'] != 'friends:2026-11-09' or fr['n'] != 0 or any(t in ('sports', 'trips') for t in fr['list']) or len(set(fr['list'])) != 3 or '숲속 친구 주간' not in fr['txt']: fails.append(f'월요일 새 회차나 친구 주간 미션 대신 넣기가 틀려요 {fr}')
        await set_day(pg, 2026, 11, 16)
        bk = await pg.evaluate(f"(()=>{{ const F={F}, S=F.S; F.setTab('school'); F.setTab('event'); return {{ cur: S.ev.cur, list: S.ev.list.map(m=>m.t), img: !!document.querySelector('#evBody .ev-banner img') }}; }})()")
        if bk['cur'] != 'books:2026-11-16' or 'pz' not in bk['list'] or not bk['img']: fails.append(f'책 읽는 주간(퍼즐 미션, 빌린 배너)이 틀려요 {bk}')
        await set_day(pg, 2026, 11, 23)
        ln = await pg.evaluate(f"(()=>{{ const S={F}.S; return {{ cur: S.ev.cur }}; }})()")
        if ln['cur'] != 'lunch:2026-11-23': fails.append(f'맛있는 급식 주간이 틀려요 {ln}')
        await set_day(pg, 2026, 12, 2)
        dec = await pg.evaluate(f"(()=>{{ const F={F}, S=F.S; return {{ cur: S.ev.cur, n: S.ev.stamp.n, box: S.ev.box }}; }})()")
        if dec['cur'] != 'harvest:2026-11-30' or dec['n'] != 0 or dec['box']: fails.append(f'4주 뒤 다시 수확 축제 새 회차가 틀려요 {dec}')
        # 특별 이벤트가 월~일 한 주 전체(12월 7~13일)면 그 주 매주 이벤트 대신 열리고, 다음 주는 순서대로(책 읽는 주간)
        ov = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S; const x=F.EV_SPECIAL.find(e=>e.id==='xmas'); x.start='2026-12-07'; x.end='2026-12-13';
          const nx=F.evNext('2026-12-02'); const nx2=F.evNext('2026-12-08');
          return {{ d6: F.evCurrent('2026-12-06').key, d8: F.evCurrent('2026-12-08').key, d13: F.evCurrent('2026-12-13').key, d14: F.evCurrent('2026-12-14').key, nx: nx && nx.key, nx2: nx2 && nx2.key, sk: F.evSkipped('2026-12-08') }}; }})()""")
        if ov['d6'] != 'harvest:2026-11-30' or ov['d8'] != 'xmas:2026-12-07' or ov['d13'] != 'xmas:2026-12-07' or ov['d14'] != 'books:2026-12-14' or ov['nx'] != 'xmas:2026-12-07' or ov['nx2'] != 'books:2026-12-14' or ov['sk'] is not None:
            fails.append(f'특별 이벤트 주가 틀려요 {ov}')
        # 특별 이벤트가 주 가운데 며칠만(12월 9~11일)이면 그 주 매주 이벤트는 쉬고, 쉬는 날에는 안내 한 줄
        pt = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S; const x=F.EV_SPECIAL.find(e=>e.id==='xmas'); x.start='2026-12-09'; x.end='2026-12-11';
          return {{ d8: F.evCurrent('2026-12-08'), d10: F.evCurrent('2026-12-10').key, d12: F.evCurrent('2026-12-12'), sk: F.evSkipped('2026-12-08'), sk10: F.evSkipped('2026-12-10') }}; }})()""")
        if pt['d8'] is not None or pt['d10'] != 'xmas:2026-12-09' or pt['d12'] is not None or not pt['sk'] or pt['sk']['def']['id'] != 'friends' or pt['sk10'] is not None:
            fails.append(f'주 가운데 특별 이벤트가 틀려요 {pt}')
        await set_day(pg, 2026, 12, 8)
        skip = await pg.evaluate(f"(()=>{{ const F={F}, S=F.S; F.setTab('school'); F.setTab('event'); return {{ cur: S.ev.cur, stamp: F.claimStamp(), txt: document.querySelector('#evBody').textContent }}; }})()")
        if skip['cur'] != '' or skip['stamp'] is not False or '크리스마스 파티' not in skip['txt'] or not skip['txt'].startswith('이번 주는 크리스마스 파티 때문에 숲속 친구 주간은 쉬어요'): fails.append(f"쉬는 날 화면이 틀려요 {skip['cur']} {skip['txt'][:90]}")
        await set_day(pg, 2026, 12, 10)
        x10 = await pg.evaluate(f"(()=>{{ const F={F}, S=F.S; const a=F.claimStamp(); {CLEAN}; return {{ cur: S.ev.cur, a, n: S.ev.stamp.n }}; }})()")
        if x10['cur'] != 'xmas:2026-12-09' or x10['a'] is not True or x10['n'] != 1: fails.append(f'특별 이벤트 도장이 틀려요 {x10}')
        # 특별 이벤트 표: 날짜를 적으면 예정 목록에 보이고, 그날이 되면 열려요
        sp = await pg.evaluate(f"""(()=>{{ const F={F}, S=F.S; const x=F.EV_SPECIAL.find(e=>e.id==='xmas'); x.start='2026-12-21'; x.end='2026-12-27';
          F.setTab('school'); F.setTab('event'); const up=document.querySelector('#evBody').textContent.includes('크리스마스 파티');
          const nx=F.evNext('2026-12-20'); return {{ up, nx: nx && nx.def.id, cur: F.evCurrent('2026-12-25').key }}; }})()""")
        if not sp['up'] or sp['nx'] != 'xmas' or sp['cur'] != 'xmas:2026-12-21': fails.append(f'특별 이벤트 표가 틀려요 {sp}')
        await set_day(pg, 2026, 12, 25)
        x = await pg.evaluate(f"(()=>{{ const F={F}, S=F.S; F.setTab('school'); F.setTab('event'); return {{ cur: S.ev.cur, txt: document.querySelector('#evBody').textContent.slice(0,80), n: S.ev.list.length, m: S.ev.list.map(q=>q.m) }}; }})()")
        if x['cur'] != 'xmas:2026-12-21' or '크리스마스 파티' not in x['txt'] or x['n'] != 3 or x['m'] != [13, 13, 13]: fails.append(f'크리스마스 이벤트가 열리지 않아요 {x}')
        # 5) 분치 보정: 유치원 1배, 초등 2배, 중학교 4배
        tm = await pg.evaluate(f"(()=>{{ const F={F}, S=F.S; const t=S.tier; const out=[0,1,2].map(i=>{{ S.tier=i; return F.tierMinutes(10); }}); S.tier=t; return out; }})()")
        if tm != [10, 20, 40]: fails.append(f'분치 보정이 틀려요 {tm}')
        # 6) 화면: 밝은 390px과 어두운 360px에서 도감과 이벤트 패널이 넘치지 않아요
        for theme, w_, name in [('light', 390, 's48_light'), ('dark', 360, 's48_dark')]:
            await pg.set_viewport_size({'width': w_, 'height': 844})
            await pg.evaluate(f"document.documentElement.setAttribute('data-theme','{theme}')")
            for tab in ['dex', 'event']:
                ov = await pg.evaluate(f"""(()=>{{ const F={F}; F.setTab('school'); F.setTab('{tab}'); const p=document.querySelector('#panel{tab[0].upper() + tab[1:]}');
                  const cards=[...p.querySelectorAll('.dex-card, .ev-stamp, .dm')]; const over=cards.filter(c=>c.getBoundingClientRect().right > innerWidth + 1).length;
                  const tall=[...p.querySelectorAll('.dex-pic, .ev-stamp .st, .ev-wait .wpic')].filter(e=>{{ const i=e.querySelector('img, .p7'); return i && i.getBoundingClientRect().height > e.getBoundingClientRect().height + 1; }}).length;
                  return {{ doc: document.documentElement.scrollWidth - innerWidth, pan: p.scrollWidth - p.clientWidth, over, tall, hid: p.hidden }}; }})()""")
                if ov['doc'] > 0 or ov['pan'] > 0 or ov['over'] > 0 or ov['tall'] > 0 or ov['hid']: fails.append(f'{theme} {w_}px {tab} 패널이 넘쳐요 {ov}')
                await pg.wait_for_timeout(200)
                await pg.screenshot(path=f'{name}_{tab}.png')
            await pg.evaluate(f"{F}.setTab('school')"); await pg.wait_for_timeout(200)
            await pg.screenshot(path=f'{name}_home.png')
            bt = await pg.evaluate("(()=>{ const r=[...document.querySelectorAll('.map-right .sidebtn')].filter(b=>!b.hidden).map(b=>b.getBoundingClientRect()); return { n: r.length, ok: r.every(x=>x.right<=innerWidth && x.bottom<=innerHeight && x.left>=0) }; })()")
            if bt['n'] != 4 or not bt['ok']:   # 퀘스트, 랭킹, 도감, 이벤트 (1.7.2: 정수 상점은 아래 상점 탭의 상점 거리로 옮김)
                fails.append(f'{theme} 홈 오른쪽 버튼이 화면 밖이에요 {bt}')
        if errs or errs2 or errs3: fails.append(f'페이지 오류 {errs + errs2 + errs3}')
        await b.close()
    for f in fails: print('FAIL:', f)
    print('PASS' if not fails else 'FAIL')
    sys.exit(1 if fails else 0)

asyncio.run(main())
