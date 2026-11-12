# 120번 시험(4.2.0): 한 달에 한 번 대축제 (매달 마지막 금, 토, 일)
# 날짜 셈(달 끝, 해 넘김), 대학교만, 부스 하루 두 번, 손님 다섯 곳, 불꽃놀이(밤 8시부터, 하루 한 번), 도장판(하루 10개, 24개에 달 장식), 매주 도장판 겹침,
# 다음 달 새 판, 다음 해 같은 달에 다시 받기, 옛 저장, 엉뚱한 저장, 360px에서 창이 넘치지 않는지
import asyncio, json
from playwright.async_api import async_playwright
from s4test import ctxpage, base
F = 'window.__forest'
CLEAN = f"(()=>{{ document.querySelectorAll('.overlay').forEach(o=>{{o.hidden=true;o.classList.remove('open')}}); const F={F}; F.rt.modalOpen=null; F.rt.modalQueue.length=0; F.rt.talkSeq=null; F.rt.st=null; F.closeSheet&&F.closeSheet(); }})()"
CLOCK = lambda day, h=10: f"(()=>{{ const F={F}; F.rt.fakeNow=Date.parse('{day}T00:00:00Z')-9*3600000+{h}*3600000; F.fvSync(); return F.gameToday(); }})()"
async def main():
    bad = []
    def ok(c, msg):
        if not c: bad.append(msg); print('  틀림:', msg)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        fac = dict(classroom=14, cafeteria=12, library=11, playground=8, science=6)
        ctx, page, errs = await ctxpage(b, 360, 740, 'light', base(tier=4, tg=2, f=fac, students=40))
        await page.evaluate(CLEAN)
        # 1) 날짜
        r = await page.evaluate(f"""(()=>{{ const F={F}, w=t=>{{const x=F.bfWin(t); return x? x.key+'/'+x.i : ''}}, n=t=>F.bfNext(t).start;
          return [w('2026-11-26'), w('2026-11-27'), w('2026-11-29'), w('2026-11-30'), w('2027-12-31'), w('2028-01-02'), w('2028-01-03'), n('2026-11-13'), n('2026-11-30'), n('2027-12-30'), n('2028-01-03')]; }})()""")
        print('날짜', r)
        ok(r == ['', '2026-11/0', '2026-11/2', '', '2027-12/0', '2027-12/2', '', '2026-11-27', '2026-12-25', '2027-12-31', '2028-01-28'], '마지막 금토일과 해 넘김')
        # 2) 대학교가 아니면 닫혀요, 학생회관이 있어야
        await page.evaluate(CLOCK('2026-11-27'))
        r = await page.evaluate(f"(()=>{{ const F={F}, S=F.S; S.f.union=0; const a=F.bfOn(); S.f.union=1; S.dp=S.dp||{{}}; S.dp.pick=['science','art']; return [a, F.bfOn(), F.fvOn(), F.fvBoothMax(), F.fvGuests().length]; }})()")
        print('여는 조건', r); ok(r == [False, True, True, 2, 5], '학생회관이 있어야 열리고, 부스 두 번, 손님 다섯 곳')
        # 3) 창 열기 도장, 부스 두 번, 손님 다섯 곳
        r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms)); F.openFv(); await sl(300); const a=[S.fv.st, S.bf.st];
          const cl=()=>{{ document.querySelectorAll('.overlay').forEach(o=>{{o.hidden=true;o.classList.remove('open')}}); F.rt.modalOpen=null; F.rt.modalQueue.length=0; }};
          const play=async k=>{{ cl(); const ok=F.fvBoothStart(k); await sl(400); const R=F.rt.fest; if(!R) return ok; R.n=99; R.t=0; for(let i=0;i<60&&F.rt.fest;i++) await sl(100); await sl(300); cl(); return ok; }};
          const p1=await play('science'), p2=await play('science'), p3=F.fvBoothStart('science');
          const b=[S.fv.st, S.bf.st, S.fv.b.science, S.fv.win.science];
          for (let i=0;i<5;i++) F.fvMeet(i);
          return {{a, b, p:[p1,p2,p3], c:[S.fv.st, S.bf.st, S.bf.g2, S.fv.g.slice()]}}; }})()""")
        print('부스와 손님', r)
        ok(r['a'] == [1, 1], '창을 열면 두 판 모두 도장 하나'); ok(r['p'] == [True, True, False], '부스는 하루 두 번')
        ok(r['b'] == [2, 3, 2, 2], '매주 도장은 부스마다 하루 한 번, 대축제 도장은 판마다'); ok(r['c'][0] == 3 and r['c'][1] == 5 and r['c'][2] == 1 and r['c'][3] == [1, 1, 1, 1, 1], '손님 세 곳에 매주 도장, 다섯 곳에 대축제 도장 둘')
        # 4) 불꽃놀이: 낮에는 안 되고 밤에 하루 한 번
        r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms)); for(let i=0;i<60&&F.rt.fest;i++) await sl(100); document.querySelectorAll('.overlay').forEach(o=>{{o.hidden=true;o.classList.remove('open')}}); F.rt.modalOpen=null; F.rt.modalQueue.length=0;
          const day=F.bfFwStart(); F.rt.fakeNow+=11*3600000; const e0=S.ess; const a=F.bfFwStart(); await sl(400); const R=F.rt.fest; const id=R&&R.id; if(R){{R.n=99; R.t=0;}} for(let i=0;i<60&&F.rt.fest;i++) await sl(100); await sl(300);
          document.querySelectorAll('.overlay').forEach(o=>{{o.hidden=true;o.classList.remove('open')}}); F.rt.modalOpen=null; F.rt.modalQueue.length=0; const again=F.bfFwStart();
          return [day, a, id, S.ess-e0, S.bf.st, S.bf.dn, again]; }})()""")
        print('불꽃놀이', r); ok(r[0] is False and r[1] is True and r[2] == 'bf_fw' and r[3] == 20 and r[4] == 8 and r[5] == 8 and r[6] is False, '밤에 한 번, 성공하면 정수 5(도장 8개 단계 15 더해 20)와 도장 셋')
        # 5) 하루 10개 상한, 사흘 24개에 달 장식, 다음 날 새로
        r = await page.evaluate(f"""(()=>{{ const F={F}, S=F.S; const m0=S.tk.m5; F.bfStamp(9); const a=[S.bf.st, S.bf.dn]; F.rt.fakeNow+=86400000; F.fvSync(); F.bfStamp(10); F.rt.fakeNow+=86400000; F.fvSync(); const it=F.bfStamp(10);
          return {{a, st:S.bf.st, got:S.bf.got.slice(), own:S.bf.own, deco:!!S.deco.own.deco_bf_11, m5:S.tk.m5-m0, it:it.map(x=>x.t)}}; }})()""")
        print('도장판', r); ok(r['a'] == [10, 10], '하루 10개까지'); ok(r['st'] == 24 and r['got'] == [1] * 6 and r['own'] == {'11': 1} and r['deco'], '24개에 11월 장식')
        # 6) 다음 달 새 판, 대축제가 아닌 날
        r = await page.evaluate(f"""(()=>{{ const F={F}, S=F.S; F.rt.fakeNow+=86400000; F.fvSync(); const off=[F.bfOn(), F.fvOn(), F.fvBoothMax(), F.fvGuests().length, F.bfNextTx()];
          F.rt.fakeNow=Date.parse('2026-12-25T01:00:00Z'); F.fvSync(); return {{off, st:S.bf.st, mon:S.bf.mon, got:S.bf.got.slice()}}; }})()""")
        print('다음 달', r); ok(r['off'][0] is False and r['off'][2] == 1 and r['off'][3] == 3 and '12월 25일' in r['off'][4], '대축제가 끝나면 예전 축제로'); ok(r['st'] == 0 and r['mon'] == '2026-12' and r['got'] == [0] * 6, '다음 달은 빈 판')
        # 7) 다음 해 같은 달에 다시 받으면 '이미 있어요'
        r = await page.evaluate(f"""(()=>{{ const F={F}, S=F.S; F.rt.fakeNow=Date.parse('2027-11-26T01:00:00Z'); F.fvSync(); F.bfStamp(10); F.rt.fakeNow+=86400000; F.fvSync(); F.bfStamp(10); F.rt.fakeNow+=86400000; F.fvSync(); return F.bfStamp(10).map(x=>x.t); }})()""")
        print('다음 해', r); ok(any('이미 있어요' in t for t in r), '다음 해 같은 달에 다시 받을 수 있어요')
        # 8) 창이 360px에서 넘치지 않음, 페이지 오류 없음
        await page.evaluate(CLEAN); await page.evaluate(CLOCK('2026-11-28', 21)); await page.evaluate(f"{F}.openFv()"); await page.wait_for_timeout(500)
        r = await page.evaluate("(()=>{ const m=document.querySelector('#mFv .modal'); return [m.scrollWidth>m.clientWidth+1, document.documentElement.scrollWidth>document.documentElement.clientWidth, document.querySelector('#fvTitle').textContent, document.querySelectorAll('#fvBody .bf-board .fv-st').length]; })()")
        print('창', r); ok(r == [False, False, '숲속 대학교 대축제', 24], '360px에서 넘치지 않고 대축제 판 24칸')
        await page.screenshot(path='s120_win.png')
        # 9) 옛 저장과 엉뚱한 저장
        r = await page.evaluate(f"""(()=>{{ const F={F}, a={{}}, b={{}}; F.sanitizeBf({{}}, a); F.sanitizeBf({{bf:{{mon:5, st:1e9, dn:-3, got:'x', own:{{'11':1, '99':1, 'x':1}}, o:'y'}}}}, b); return [a.bf, b.bf]; }})()""")
        print('저장', r); ok(r[0]['st'] == 0 and r[0]['mon'] == '' and r[1]['st'] == 24 and r[1]['dn'] == 0 and r[1]['own'] == {'11': 1} and r[1]['mon'] == '', '옛 저장과 엉뚱한 값')
        ok(not errs, f'페이지 오류 {errs[:3]}')
        await ctx.close()
        # 10) 대학교가 아닌 학교: 띠 한 줄(달에 한 번)
        ctx, page, errs = await ctxpage(b, 360, 740, 'light', base(tier=2, tg=2, f=fac, students=40))
        await page.evaluate(CLEAN); await page.evaluate(f"{F}.S.tut.st=1"); await page.evaluate(CLOCK('2026-11-27')); await page.wait_for_timeout(2200)
        r = await page.evaluate(f"[!document.querySelector('#fvTip').hidden, document.querySelector('#fvTipTx').textContent, {F}.bfOn()]")
        print('다른 학교 띠', r); ok(r[0] and '대축제' in r[1] and r[2] is False, '다른 학교에는 띠 한 줄만')
        await page.evaluate("document.querySelector('#fvTipX').click()"); await page.wait_for_timeout(300); await page.evaluate(CLOCK('2026-11-28')); await page.wait_for_timeout(2200)
        r = await page.evaluate("[document.querySelector('#fvTip').hidden, document.querySelector('#fvTipTx').textContent]")
        print('닫은 뒤', r); ok(r[0] or '대축제' not in r[1], '닫으면 그 달에는 다시 안 떠요')
        ok(not errs, f'페이지 오류 {errs[:3]}')
        await ctx.close(); await b.close()
    print('\n'.join(bad)); print('PASS' if not bad else 'FAIL')
if __name__ == "__main__": asyncio.run(main())
