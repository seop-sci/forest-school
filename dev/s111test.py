# 3.2.0 수학여행 시험: 학년마다 한 번, 낮에만 출발, 활동 세 번과 과목 XP, 단체 사진 뒤 3시간 학생 숨김, 받기(도토리, 정수, 기념품, 앨범 쪽), 저장 다시 읽기, 메인 퀘스트 tr1~tr3
# 쓰는 법: python3 wrap.py && python3 s111test.py   (마지막 줄이 PASS면 통과)
import asyncio, sys
sys.path.insert(0, '.')
from playwright.async_api import async_playwright
from s4test import ctxpage, base
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx, pg, errs = await ctxpage(b, 390, 844, 'light', base(tier=3, tg=0))
        r = await pg.evaluate("""() => { const F=window.__forest,S=F.S,o=[],ok=(c,m)=>{ if(!c) o.push(m); };
          document.querySelectorAll('.overlay').forEach(m=>m.hidden=true); F.rt.modalOpen=null;
          F.setServerTime(Date.parse('2026-11-06T22:00:00+09:00'));
          F.tr2Act('p:old'); ok(!S.tr2.cur, '밤에는 출발 못 해요');
          F.setServerTime(Date.parse('2026-11-06T10:00:00+09:00'));
          ok(F.TR2_PL.length === 3 && F.TR2_PL.every(P => P.stops.length === 3 && P.souv.length === 3), '곳 셋, 들를 곳 셋, 기념품 셋');
          const x0 = S.ac.pe.xp + S.ac.sci.xp + S.ac.art.xp + S.ac.kor.xp + S.ac.math.xp;
          F.tr2Act('p:island'); ok(S.tr2.cur && S.tr2.cur.st === 'pick' && S.tr2.go === 1, '출발');
          F.tr2Act('a:0'); F.tr2Act('a:1'); F.tr2Act('a:0');
          const x1 = S.ac.pe.xp + S.ac.sci.xp + S.ac.art.xp + S.ac.kor.xp + S.ac.math.xp;
          ok(S.tr2.cur.st === 'photo' && S.tr2.cur.pk.join() === '0,1,0', '활동 세 번');
          ok(x1 - x0 >= 60 || S.ac.pe.lv > 0, '과목 XP');
          F.tr2Act('snap'); F.tr2Tick();
          ok(F.tr2Away() && document.getElementById('map').classList.contains('tr2-away'), '사진 뒤 학생이 떠나요');
          const s0 = S.alb.length, e0 = S.ess, b0 = S.budget;
          F.tr2Act('get'); ok(S.tr2.cur, '돌아오기 전에는 못 받아요');
          F.setServerTime(Date.parse('2026-11-06T13:00:01+09:00')); F.tr2Tick();
          ok(F.tr2Ready() && !F.tr2Away(), '3시간 뒤 도착');
          F.tr2Act('get');
          ok(!S.tr2.cur && S.tr2.back === 1 && S.tr2.souv.length === 1 && S.deco.own[S.tr2.souv[0]] === 1, '기념품');
          ok(S.ess - e0 >= 20 && S.budget > b0 && isFinite(S.budget), '도토리와 정수');
          ok(S.alb.length === s0 + 1 && S.alb[S.alb.length - 1].k === 'tr', '앨범 쪽');
          F.tr2Act('p:old'); ok(!S.tr2.cur, '같은 학년에는 한 번만');
          const d = F.sanitize(JSON.parse(JSON.stringify(S)));
          ok(d.tr2.souv.length === 1 && d.tr2.done['3-0'] === 1 && d.alb[d.alb.length - 1].pl === 'island', '저장 다시 읽기');
          const old = JSON.parse(JSON.stringify(S)); delete old.tr2; const d2 = F.sanitize(old);
          ok(d2.tr2 && d2.tr2.cur === null && d2.tr2.go === 0, '옛 저장');
          ok(['tr1','tr2','tr3'].every(id => F.MAIN.some(q => q.id === id)), '메인 퀘스트 셋');
          return o; }""")
        print('\n'.join(r) if r else '', errs[:3])
        print('PASS' if not r and not errs else 'FAIL')
        await b.close()
asyncio.run(main())
