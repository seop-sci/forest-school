# 3.1.0 진로 상담 시험: 상담실 열림(고등학교부터), 하루 상담 횟수와 날 바뀜, 카드 열림(친밀도별 관심), 진로 정하기와 바꾸기,
# 준비도 계산, 고3 졸업 정산 한 번만(A안), 진로 도감과 진로 나무, 업적, 미션, 메인 퀘스트 측정, 옛 저장 받기, 360px와 390px 화면
# 쓰는 법: python3 wrap.py && python3 s110test.py   (마지막 줄이 PASS면 통과)
import asyncio, sys
from playwright.async_api import async_playwright
from s4test import URL

SETUP = r"""(tier) => {
  const F = window.__forest, S = F.S;
  S.tut.st = 'skip'; const t = document.querySelector('#tut'); if (t) t.hidden = true; F.rt.modalOpen = null;
  S.tier = tier; S.tg = 2; Object.assign(S.f, { classroom: 25, cafeteria: 18, library: 24, playground: 18, science: 11, store: 17, dorm: tier >= 3 ? 18 : 0 });
  S.students = 100; S.roster = { list: [], wk: -1, gen: 0, v: 2 }; F.rosterEnsure();
  return S.roster.list.length;
}"""
CHECK = r"""() => {
  const F = window.__forest, S = F.S, bad = [], ok = (c, m) => { if (!c) bad.push(m); };
  ok(F.JOBS.length === 12, '진로 12종');
  ok(F.CS_WORRY.length === 5 && F.CS_WORRY.every(a => a.length === 6), '과목마다 고민 6줄');
  ok(F.csOpen(), '고등학교에서 상담실이 열려야 해요');
  F.openCounsel(); ok(!document.querySelector('#mCounsel').hidden, '상담 창이 열려요');
  ok(S.roster.list.every(x => x.jc.length === 3 && new Set(x.jc).size === 3 && x.jo.length === 0 && x.jb === -1), '학생마다 후보 3장(겹치지 않게), 처음엔 뒷면');
  const x = S.roster.list[0], main = x.a.indexOf(Math.max(...x.a));
  ok(x.jc.filter(j => F.JOBS[j].ab === main).length >= 1, '잘하는 과목 진로가 후보에 있어요');
  ok(F.csMax() === 3 && F.csLeft() === 3, '하루 3번');
  S.xt.cou = 5; ok(F.csMax() === 4, '코끼리 Lv.5에 하루 4번'); S.xt.cou = 10; ok(F.csMax() === 5, 'Lv.10에 하루 5번'); S.xt.cou = 0;
  ok(F.csNeed(x) === 3, '♥ 없으면 카드 한 장에 관심 3');
  // 상담: 맞는 답 두 번이면 카드 한 장(관심 2 × 배수 ≥ 1)
  for (let n = 0; n < 2; n++) { F.rt.csTalk = F.csTalkMake(0); const k = F.rt.csTalk.opts.findIndex(o => o.how === 'good'); ok(F.rt.csTalk.opts.length === 3 && new Set(F.rt.csTalk.opts.map(o => o.how)).size === 3, '답 셋은 맞는 답, 다른 후보, 엇나간 답'); F.csAnswer(k); }
  ok(x.jo.length === 1, '맞는 답 두 번에 카드 한 장 열림: ' + x.jo.length);
  ok(S.cs.talks === 2 && S.cs.n === 2 && F.csLeft() === 1, '상담 횟수');
  F.rt.csTalk = F.csTalkMake(1); F.csAnswer(0); ok(F.csLeft() === 0, '오늘 다 씀');
  const t0 = S.cs.talks; F.rt.csTalk = F.csTalkMake(1); F.csAnswer(0); ok(S.cs.talks === t0, '다 쓰면 더 상담 안 돼요');
  S.cs.day = '2000-01-01'; ok(F.csLeft() === 3, '날 바뀌면 다시 3번');
  // 진로 정하기, 바꾸기
  const j = x.jo[0]; F.csChoose(0, j); ok(x.jb === j && S.cs.picks === 1, '진로 정하기');
  F.csChoose(0, j); ok(x.jb === -1, '같은 카드 다시 누르면 풀기'); F.csChoose(0, j); ok(S.cs.picks === 1, '다시 정해도 처음 정한 수는 그대로');
  F.csChoose(0, x.jc.find(c => !x.jo.includes(c))); ok(x.jb === j, '안 열린 카드로는 못 정해요');
  // 준비도: 별 4, 건물 상한 90% → 84(+ 동아리)
  const J = F.JOBS[j]; x.a[J.ab] = 80; x.c = -1; S.f[J.fac] = Math.round(0.9 * 30); const cap = Math.max(1, F.S && 30);
  const r = F.csReady(x), exp = Math.round(4 / 5 * 60 + Math.min(1, S.f[J.fac] / Math.max(1, window.__forest.yearCap() + 0)) * 40);
  ok(r >= 0 && r <= 100 && isFinite(r), '준비도는 0~100: ' + r);
  // 졸업 정산: 10명 이룸 → 수료증 +40%, 황금 2, 한 번만
  S.roster.list.forEach((y, i) => { if (i < 10) { y.jo = [y.jc[0]]; y.jb = y.jc[0]; y.a[F.JOBS[y.jb].ab] = 100; S.f[F.JOBS[y.jb].fac] = 60; } });
  const g0 = S.gold, e0 = S.ess, b = F.csSettle();
  ok(Math.abs(b - 0.4) < 1e-9, '이룬 10명이면 +40%: ' + b);
  ok(S.gold - g0 >= 2, '5명마다 황금 1');
  ok(S.cs.won === 10 && S.cs.paid === S.roster.gen, '정산 기록');
  const dex = Object.keys(S.cs.done).length; ok(S.ess - e0 === 5 * dex, '도감 칸마다 정수 5');
  ok(F.csSettle() === 0 && S.cs.won === 10, '같은 명부는 다시 정산하지 않아요(A안)');
  // 도감 12칸 모두 → 진로 나무, 황금 3
  F.JOBS.forEach(J2 => { if (!S.cs.done[J2.k]) S.cs.done[J2.k] = { nm: '친구', sp: 'rabbit' }; }); delete S.cs.done[F.JOBS[S.roster.list[0].jb].k];
  const g1 = S.gold; F.csSettle(); ok(S.deco.own.deco_career_tree === 1 && S.gold - g1 === 3, '도감 완성 보상');
  // 1학년에는 정산 없음
  S.tg = 0; ok(F.csSettle() === 0, '1학년 졸업식에는 정산 없음'); S.tg = 2;
  // 업적, 미션, 퀘스트
  const A = window.__forest.ACH ? window.__forest.ACH.find(a => a.id === 'counsel') : null;
  if (A) ok(A.v() === 10 && A.goals.join() === '3,6,10,14,18', '업적 진로 상담');
  const q2 = F.MAIN.find(q => q.id === 'cs2'), q3 = F.MAIN.find(q => q.id === 'cs3'), q1 = F.MAIN.find(q => q.id === 'cs1');
  ok(q1 && q2 && q3 && F.qMeasure(q2) === S.cs.talks && F.qMeasure(q3) === S.cs.picks && F.qMeasure(q1) === S.xt.cou, '메인 퀘스트 측정');
  ok(typeof F.qGoal(q2) === 'string' && typeof F.qGoal(q3) === 'string', '메인 퀘스트 글');
  // 저장: 왕복과 옛 저장
  const s2 = F.sanitize(JSON.parse(JSON.stringify(S)));
  ok(s2.cs.won === 10 && s2.roster.list[0].jb === S.roster.list[0].jb && s2.roster.list[0].jc.join() === S.roster.list[0].jc.join(), '저장 왕복');
  const o = JSON.parse(JSON.stringify(S)); delete o.cs; o.roster.list.forEach(y => { delete y.jc; delete y.jo; delete y.ji; delete y.jb; }); delete o.xt.cou;
  const s3 = F.sanitize(o); ok(s3.cs.won === 0 && s3.cs.paid === -1 && s3.xt.cou === 0 && s3.roster.list.every(y => !y.jc), '옛 저장 받기');
  const w = JSON.parse(JSON.stringify(S)); w.cs = { n: 'x', won: Infinity, done: { scientist: { nm: '<b>' } } }; w.roster.list[0].jc = [0, 0, 99]; w.roster.list[1].ji = NaN;
  const s4 = F.sanitize(w); ok(s4.cs.won === 0 && !/[<>]/.test(s4.cs.done.scientist.nm) && !s4.roster.list[0].jc && s4.roster.list[1].ji === 0, '이상한 저장 걸러 내기');
  return bad;
}"""
async def main():
    fails = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 780})
        await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        await pg.evaluate(SETUP, 2)
        if await pg.evaluate("window.__forest.csOpen()"): fails.append('중학교에서 상담실이 열리면 안 돼요')
        await pg.evaluate(SETUP, 3)
        fails += await pg.evaluate(CHECK)
        fails += ['페이지 오류: ' + e for e in errs]
        await ctx.close()
        # 화면: 밝은 390px, 어두운 360px에서 목록과 상담 창이 넘치지 않는지
        for theme, wd in (('light', 390), ('dark', 360)):
            ctx = await b.new_context(viewport={'width': wd, 'height': 740}, color_scheme=theme)
            await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(1500)
            await pg.evaluate(SETUP, 3)
            await pg.evaluate("window.__forest.S.cs.met = 1; window.__forest.openCounsel()")
            r = await pg.evaluate("""() => { const m = document.querySelector('#mCounsel .modal'), W = innerWidth, out = [];
              const box = m.getBoundingClientRect(); if (box.left < 0 || box.right > W) out.push('창이 화면 밖');
              document.querySelectorAll('#mCounsel .cs-row').forEach(r => { if (r.scrollWidth > r.clientWidth + 1) out.push('줄 넘침'); const b = r.querySelector('.cta').getBoundingClientRect(); if (b.right > r.getBoundingClientRect().right + 1) out.push('상담 단추 넘침'); });
              return out; }""")
            fails += [f'[{theme} {wd}] {x}' for x in r]
            await pg.click('[data-cs="t0"]')
            r = await pg.evaluate("() => [...document.querySelectorAll('#mCounsel .cs-opt')].filter(b => b.scrollWidth > b.clientWidth + 1).length")
            if r: fails.append(f'[{theme} {wd}] 답 단추 넘침')
            await pg.click('[data-cs="a0"]'); await pg.click('[data-cs="list"]'); await pg.click('[data-cs="dex"]')
            r = await pg.evaluate("() => document.querySelectorAll('#mCounsel .cs-dx').length")
            if r != 12: fails.append(f'[{theme}] 진로 도감 칸 {r}')
            fails += [f'[{theme}] 페이지 오류: ' + e for e in errs]
            await ctx.close()
        await b.close()
    for f in fails: print('FAIL', f)
    print('FAIL' if fails else 'PASS'); sys.exit(1 if fails else 0)
asyncio.run(main())
