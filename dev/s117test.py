# 4.1.0 시험: 요일 행사(대학 축제, 교환학생의 날, 숲속 장터)와 이야기 틀
# 보는 것
#  1) 화요일: 교환학생 인사, 건물 세 곳 안내, 급식 함께 먹기 차례와 보상, 우정 배지, 수첩 기록, 저장 왕복
#  2) 목요일: 작물 팔기(하루 쿠폰 상한), 쿠폰으로 사기(하루 횟수), 다음 주로 넘어가는 쿠폰
#  3) 축제: 금요일 발표회 보너스, 손님 대표 동물, 주가 바뀌면 도장판이 새로 시작, 랭킹이 없을 때 꾸며 낸 이웃 학교
#  4) 시계를 뒤로 돌려도 요일 행사가 다시 열리지 않아요
#  5) 이야기: 새 학교의 1장 여는 장면, 장이 끝나면 닫는 장면과 고르기, 옛 저장은 '지금까지의 이야기' 하나, 수첩 세 쪽
#  6) 옛 저장(새 칸이 없는 저장)과 엉뚱한 값이 든 저장을 읽어도 멈추지 않아요
#  8) 고등학교에서 겹친 건물 누르기와 꾸미기 자리
#  7) 360px에서 새 창 네 개가 옆으로 넘치지 않고 페이지 오류가 없어요
# 쓰는 법: python3 wrap.py && python3 s117test.py   (마지막 줄이 PASS면 통과)
import asyncio, json
from playwright.async_api import async_playwright
from s4test import ctxpage, base
F = 'window.__forest'
CLEAN = f"(()=>{{ document.querySelectorAll('.overlay').forEach(o=>{{o.hidden=true;o.classList.remove('open')}}); const F={F}; F.rt.modalOpen=null; F.rt.modalQueue.length=0; F.rt.talkSeq=null; F.rt.st=null; F.closeSheet&&F.closeSheet(); const t=document.querySelector('#tut'); if(t) t.hidden=true; F.S.tut.st=F.S.tut.st||'skip'; F.rt.tut=null; }})()"
# 다음 주 월요일 0시(한국 시간)에서 d일 h시간 뒤로 기기 시계를 꾸며요
CLOCK = lambda d, h=10: f"(()=>{{ const F={F}; const now=Date.now()+9*3600000; const day=Math.floor(now/86400000); const wd=(new Date(day*86400000).getUTCDay()+6)%7; const mon=(day-wd+7)*86400000-9*3600000; F.rt.fakeNow=mon+{d}*86400000+{h}*3600000; return [F.gameToday(), F.fvWd? F.fvWd():-1]; }})()"
OVER = "(id)=>{ const m=document.querySelector(id+' .modal'); return m.scrollWidth>m.clientWidth+1 || document.documentElement.scrollWidth>document.documentElement.clientWidth; }"

async def main():
    bad = []
    def ok(c, msg):
        if not c: bad.append(msg); print('  틀림:', msg)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        fac = dict(classroom=14, cafeteria=12, library=11, playground=8, science=3)
        ctx, page, errs = await ctxpage(b, 360, 740, 'light', base(tier=1, tg=2, f=fac))
        await page.evaluate(CLEAN)
        # 1) 화요일
        d = await page.evaluate(CLOCK(1)); print('화요일', d)
        r = await page.evaluate(f"""(()=>{{ const F={F}, S=F.S; F.wdTick(); const b0=S.budget; const on=F.xgOn(); const bar=!document.querySelector('#wdBar').hidden || !!document.querySelector('#wdG [data-wd="xg"]');
          F.openXg(); const over=({OVER})('#mXg'); const g=F.xgGuest(); const sp=F.xgSpots(); F.xgGreet(); return {{on, bar, over, g, sp, s:S.xg.s.slice(), up:S.budget>b0, log:S.xg.log.length}}; }})()""")
        print(' 인사', r)
        ok(r['on'] and r['bar'], '화요일에 교환학생의 날이 열리고 지도(또는 띠)에 보여요'); ok(not r['over'], '교환학생 창이 360px에서 넘치지 않아요')
        ok(r['s'] == [1, 0, 0] and r['up'] and r['log'] == 1, '인사하면 수업료와 수첩 기록'); ok(len(r['sp']) == 3 and 'cafeteria' not in r['sp'], f"안내할 건물 세 곳 {r['sp']}")
        ok(r['g']['real'] is False and r['g']['who'], '랭킹이 없으면 꾸며 낸 이웃 학교')
        await page.wait_for_timeout(400); await page.evaluate(CLEAN)
        r2 = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S; const sp=F.xgSpots(); const b0=S.budget;
          F.xgVisit('cafeteria'); const early=S.xg.s[2]; F.xgVisit(sp[1]); const wrong=S.xg.n;
          for (const k of sp) F.xgVisit(k); const s1=S.xg.s.slice(), up=S.budget>b0; F.xgVisit('cafeteria');
          return {{early, wrong, s1, up, s2:S.xg.s.slice(), bd:S.xg.bd}}; }})()""")
        print(' 안내와 급식', r2)
        ok(r2['early'] == 0 and r2['wrong'] == 0, '차례가 아닌 건물은 세지 않아요'); ok(r2['s1'] == [1, 1, 0] and r2['up'], '세 곳을 안내하면 수업료')
        ok(r2['s2'] == [1, 1, 1] and r2['bd'] == 1, '급식을 함께 먹으면 우정 배지 1개')
        await page.wait_for_timeout(300); await page.evaluate(CLEAN)
        r3 = await page.evaluate(f"(()=>{{ const F={F}, S=F.S; S.xg.bd=3; S.xg.got=0; S.xg.s[2]=0; const e0=S.ess; F.xgLunch(); const a=[S.xg.bd,S.xg.got,S.ess-e0]; S.xg.bd=7; S.xg.s[2]=0; F.xgLunch(); return {{a, b:[S.xg.bd,S.xg.got,S.deco.own.deco_ex_sign||0]}}; }})()")
        print(' 배지 보상', r3); ok(r3['a'] == [4, 1, 10] and r3['b'] == [8, 2, 1], '배지 4개 숲의 정수 10, 8개 방향 이정표')
        await page.evaluate(CLEAN)
        # 4) 시계를 뒤로
        back = await page.evaluate(f"(()=>{{ const F={F}, S=F.S; const t=F.gameToday(); F.rt.fakeNow-=3*86400000; F.wdTick(); return [t===F.gameToday(), S.xg.s.join('')]; }})()")
        ok(back == [True, '111'], f'시계를 뒤로 돌려도 화요일 일이 다시 열리지 않아요 {back}')
        # 2) 목요일
        d = await page.evaluate(CLOCK(3)); print('목요일', d)
        m = await page.evaluate(f"""(()=>{{ const F={F}, S=F.S; F.wdTick(); const on=F.mkOn(), hot=F.mkHot(); S.gn.inv={{lettuce:60, carrot:5, potato:9}}; S.mk.cp=0;
          F.openMk(); const over=({OVER})('#mMk'); F.mkSell('lettuce', false); const one=S.mk.cp; F.mkSell('lettuce', true); F.mkSell('potato', true); const cp=S.mk.cp, sold=S.mk.sold;
          const t0=S.tk.m5, e0=S.ess; for (let i=0;i<7;i++) F.mkBuy('m5'); const m5=S.tk.m5-t0; F.mkBuy('ess'); F.mkBuy('deco_mk_lamp');
          return {{on, hot, over, one, cp, sold, m5, ess:S.ess-e0, left:S.mk.cp, lamp:S.deco.own.deco_mk_lamp||0, xgOn:F.xgOn()}}; }})()""")
        print(' 장터', m)
        ok(m['on'] and not m['xgOn'], '목요일에는 장터만 열려요'); ok(not m['over'], '장터 창이 360px에서 넘치지 않아요')
        ok(m['one'] == (2 if m['hot'] == 'lettuce' else 1), '오늘의 흥정 작물은 쿠폰 두 배'); ok(m['sold'] <= 30 and m['cp'] <= 30 and m['cp'] >= 28, f"하루 쿠폰 상한 {m['cp']}")
        ok(m['m5'] == 5, f"5분권은 하루 5번 {m['m5']}"); ok(m['ess'] == 5 and m['lamp'] == 0, '숲의 정수 5, 쿠폰이 모자라면 장식을 못 사요')
        await page.evaluate(CLEAN)
        # 저장 왕복
        # 저장 왕복: 저장한 글자를 다시 읽어요(다시 켜기는 시험 도구의 저장 넣기와 엇갈릴 때가 있어서 sanitize로 바로 봐요)
        sv = await page.evaluate(f"(()=>{{ const F={F}; F.save(); const S=F.sanitize(JSON.parse(localStorage.getItem('forest-school-v1'))); return [S.xg.bd, S.xg.got, S.xg.log.length, S.mk.cp, S.mk.buy.m5, S.sto.v]; }})()")
        print(' 저장 왕복', sv); ok(sv[0] == 8 and sv[1] == 2 and sv[2] == 1 and sv[3] == m['left'] and sv[4] == 5, '저장 왕복')
        # 3) 축제: 금요일, 그리고 다음 주 월요일
        d = await page.evaluate(CLOCK(4)); print('금요일', d)
        # 주 번호를 먼저 맞춘 뒤 도장을 넣어요(게임의 1초 틱이 아직 안 돌았을 수 있어요)
        fv = await page.evaluate(f"""(()=>{{ const F={F}, S=F.S; S.tier=4; S.f.union=1; F.fvSync(); S.fv.st=5; F.fvSync(); const gs=F.fvGuests();
          return {{on:F.fvOn(), show:F.fvBonus('show'), picnic:F.fvBonus('picnic'), sp:gs.map(g=>g.sp), real:gs.map(g=>g.real), st:S.fv.st, mk:F.mkOn()}}; }})()""")
        print(' 축제', fv)
        ok(fv['on'] and fv['show'] and not fv['picnic'] and not fv['mk'], '금요일은 축제와 발표회 보너스'); ok(len(fv['sp']) == 3 and all(fv['sp']), '손님 학교마다 대표 동물'); ok(fv['st'] == 5, '같은 주에는 도장이 남아요')
        d = await page.evaluate(CLOCK(7)); wk = await page.evaluate(f"(()=>{{ const F={F}; F.fvSync(); return [F.S.fv.st, F.fvBonus('picnic')]; }})()")
        print('다음 주 월요일', d, wk); ok(wk == [0, True], '주가 바뀌면 도장판이 새로 시작하고 월요일은 소풍 보너스')
        d = await page.evaluate(CLOCK(10)); cp = await page.evaluate(f"(()=>{{ const F={F}; F.wdTick(); return [F.S.mk.cp, F.S.mk.sold, F.S.mk.buy.m5||0]; }})()")
        ok(cp == [m['left'], 0, 0], f'쿠폰은 다음 주로 넘어가고 하루 횟수는 새로 {cp}')
        await ctx.close()
        # 5) 이야기: 새 학교
        ctx, page, errs2 = await ctxpage(b, 360, 740, 'dark', base(tier=0, q={'init': True, 'mid': 'f0', 'm': 0, 'mb': 0, 'subs': [], 'done': [], 'gen': 0, 'subDone': 0, 'seen': 0}, sto={'v': 1, 'ch': -1, 'q': [], 'seen': {}, 'pick': {}, 'side': {}}))
        await page.evaluate(CLEAN)
        s1 = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, q=s=>document.querySelector(s); F.stTick(); const open=!q('#mSt').hidden, head=q('#stCh').textContent, who=q('#stWho').textContent, over=({OVER})('#mSt');
          let n=0; while (F.rt.st && n++<20) F.stNext(); return {{open, head, who, over, n, seen:S.sto.seen.o0||0, q:S.sto.q.slice(), ch:S.sto.ch}}; }})()""")
        print('새 학교 1장 여는 장면', s1)
        ok(s1['open'] and '1장' in s1['head'] and s1['who'] == '교감 고슴도치', '새 학교는 1장 여는 장면이 나와요'); ok(s1['seen'] == 1 and s1['q'] == [] and s1['n'] == 5, '다섯 줄을 넘기면 본 것으로 남아요'); ok(not s1['over'], '장면 창이 360px에서 넘치지 않아요')
        await page.wait_for_timeout(300); await page.evaluate(CLEAN)
        s2 = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, q=s=>document.querySelector(s); const i=F.MAIN.findIndex(x=>x.ch===1); S.q.m=i; F.stTick();
          const head=q('#stCh').textContent; let n=0; while (F.rt.st && !F.rt.st.lines[F.rt.st.i].pick && n++<20) F.stNext();
          const picks=[...document.querySelectorAll('#stPicks button')].map(b=>b.textContent); F.stNext(); const stuck=!!F.rt.st.lines[F.rt.st.i].pick; F.stPick(1);
          const after=q('#stText').textContent; while (F.rt.st && n++<40) F.stNext();
          F.openSb(); const over=({OVER})('#mSb'); const rows=document.querySelectorAll('#sbBody .nb-ch').length, btn=document.querySelectorAll('#sbBody [data-sb]').length;
          F.rt.sbTab='who'; F.renderSb(); const who=document.querySelectorAll('#sbBody .nb-who').length; F.rt.sbTab='side'; F.renderSb(); const side=document.querySelectorAll('#sbBody .nb-ch').length;
          return {{head, picks, stuck, after, pick:S.sto.pick.c0, seen:S.sto.seen.c0||0, q:S.sto.q.slice(), rows, btn, who, side, over, m:S.q.m===i}}; }})()""")
        print('1장 닫는 장면', s2)
        ok('1장' in s2['head'] and s2['picks'] == ['그럼요', '모레도 오렴'] and s2['stuck'], '닫는 장면 끝에 답 둘, 고르기 전에는 넘어가지 않아요'); ok(s2['pick'] == 1 and '모레' in s2['after'] and s2['seen'] == 1, '고른 답이 남고 대사가 달라져요')
        ok(s2['m'], '장면은 퀘스트 진행을 바꾸지 않아요'); ok(s2['rows'] == 24 and s2['btn'] == 3 and s2['who'] >= 2 and s2['side'] == 6 and not s2['over'], f"수첩 세 쪽 {s2['rows']} {s2['btn']} {s2['who']} {s2['side']}")
        await ctx.close()
        # 옛 저장(새 칸 없음)과 엉뚱한 값
        ctx, page, errs3 = await ctxpage(b, 390, 800, 'light', base(tier=1, tg=1))
        await page.evaluate(CLEAN)
        o = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, q=s=>document.querySelector(s); const v0=S.sto.v; F.stTick(); const head=q('#stCh').textContent, open=!q('#mSt').hidden;
          document.querySelector('#stSkip').click(); return {{v0, v:S.sto.v, head, open, q:S.sto.q.slice(), ch:S.sto.ch, tags:F.stTags(), ex:!!S.xg, mk:!!S.mk}}; }})()""")
        print('옛 저장', o); ok(o['v'] == 1 and o['open'] and o['head'] == '지금까지의 이야기', '옛 저장은 요약 장면 하나')   # v0은 게임의 1초 틱이 먼저 돌면 이미 1이에요; ok('recap' not in o['q'] and o['ex'] and o['mk'], '건너뛰면 요약이 줄에서 빠지고 새 칸이 생겨요')
        await ctx.close()
        junk = base(tier=2, xg={'day': 5, 's': 'x', 'n': 'a', 'bd': 1e300, 'got': -3, 'log': [1, {'sp': 'constructor', 'd': 3}, None]}, mk={'day': [], 'sold': 'q', 'buy': 7, 'cp': 1e99, 'own': 'z'}, sto={'v': 'k', 'ch': 1e9, 'q': {'a': 1}, 'seen': [1, 2], 'pick': 'x', 'side': {'nap': {'n': 1e9, 'd': 4}, 'zz': 1}}, fv='nope')
        ctx, page, errs4 = await ctxpage(b, 390, 800, 'light', junk)
        j = await page.evaluate(f"(()=>{{ const S={F}.S; return [S.tier, S.xg.bd, S.xg.got, S.xg.log.length, S.mk.cp, S.mk.sold, S.sto.ch, S.sto.q.length, (S.sto.side.nap||{{}}).n, S.fv.st]; }})()")
        print('엉뚱한 값', j); ok(j == [2, 9999, 0, 0, 200, 0, 24, 0, 4, 0], '엉뚱한 값이 든 저장도 읽어요')
        await ctx.close()
        # 8) 고등학교: 운동장과 기숙사가 겹친 자리에서 그림이 있는 건물이 열려요. 꾸미기 자리는 건물 그림 밖
        ctx, page, errs5 = await ctxpage(b, 390, 800, 'light', base(tier=3, tg=1, sto={'v': 1, 'ch': 23, 'q': [], 'seen': {}, 'pick': {}, 'side': {}}))
        await page.evaluate(CLEAN)
        pk = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S; for (const k of F.facKeys()) S.f[k]=Math.max(S.f[k]||0,8); F.setTab('school'); F.renderMap(); await new Promise(r=>setTimeout(r,1500)); F.bldWarm(); await new Promise(r=>setTimeout(r,900));
          const svg=document.querySelector('#map'), m=svg.getScreenCTM(); const at=(x,y)=>{{ const p=svg.createSVGPoint(); p.x=x; p.y=y; const q=p.matrixTransform(m); return F.bldPick({{clientX:q.x, clientY:q.y}}, 'dorm'); }};
          const bx={{}}; for (const k of F.facKeys()) bx[k]=F.bldBox(k);
          const hid=F.DECO_SLOTS[3].map(([x,y],i)=>Object.keys(bx).some(k=>bx[k] && x-4>bx[k][0] && x+4<bx[k][2] && y-6>bx[k][1] && y-30<bx[k][3]) ? i+1 : 0).filter(Boolean);
          return {{field:at(110,225), low:at(110,258), dorm:at(110,310), hid}}; }})()""")
        print('고등학교 누르기', pk); ok(pk['field'] == 'playground' and pk['low'] == 'playground' and pk['dorm'] == 'dorm', '운동장 아래쪽을 눌러도 운동장이 열려요'); ok(not pk['hid'], f"꾸미기 자리가 건물에 가려지지 않아요 {pk['hid']}")
        await ctx.close()
        all_errs = [e for e in errs + errs2 + errs3 + errs4 + errs5 if 'ERR_' not in e]
        ok(not all_errs, f'페이지 오류 {all_errs[:3]}')
        await b.close()
    print('PASS' if not bad else f'FAIL ({len(bad)})')
asyncio.run(main())
