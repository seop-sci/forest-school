# 46번 묶음(1.6.0) 시험: 블록 퍼즐 규칙과 화면
# 검사 대상: 조각 모양, 놓기와 줄 지우기, 문양 줄 3배, 콤보, 학생 부탁, 선생님 블록과 도움, 하루 10판과 광고 +3, 보상 상한, 저장 호환, 끌어 놓기 화면
# 쓰는 법: python3 wrap.py && python3 s46test.py   (마지막 줄이 "PASS"면 통과)
import asyncio, json, sys
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
SKIPTUT = "const t=document.querySelector('#tut'); if(t && !t.hidden){ window.__forest.S.tut.st='skip'; t.hidden=true; window.__forest.rt.modalOpen=null; }"

RULES = r"""() => {
  const F = window.__forest, S = F.S, PZ = F.PZ, bad = [];
  const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) bad.push(m + ': ' + JSON.stringify(a) + ' != ' + JSON.stringify(b)); };
  const ok = (c, m) => { if (!c) bad.push(m); };
  // 조각 모양: 서로 다르고, 5×5 안에 들어가고, 1~9칸
  const keys = new Set(F.PZ_SHAPES.map(s => JSON.stringify(s)));
  eq(keys.size, F.PZ_SHAPES.length, '조각 모양이 겹쳐요');
  ok(F.PZ_SHAPES.every(s => s.length >= 1 && s.length <= 9 && s.every(([r, c]) => r >= 0 && c >= 0 && r < 5 && c < 5)), '조각 모양이 5×5를 벗어나요');
  ok(F.PZ_SHAPES.length >= 30, '조각 모양이 너무 적어요: ' + F.PZ_SHAPES.length);
  // 놓기: 판 밖이나 찬 칸에는 못 놓아요
  let g = F.pzFreshGame(true);
  g.tray[0] = { c: [[0, 0], [0, 1], [0, 2]], k: 1 };
  ok(F.pzFits(g.b, g.tray[0].c, 0, 5), '막대 3칸이 (0,5)에 들어가야 해요');
  ok(!F.pzFits(g.b, g.tray[0].c, 0, 6), '막대 3칸이 (0,6)에 들어가면 안 돼요 (판 밖)');
  g.b[2] = 2; ok(!F.pzFits(g.b, g.tray[0].c, 0, 0), '찬 칸 위에 놓이면 안 돼요');
  // 줄 지우기: 가로 한 줄과 세로 한 줄이 한 번에 (십자) → 15칸, 2줄
  g = F.pzFreshGame(true);
  for (let j = 0; j < 8; j++) { if (j !== 3) g.b[j] = 1; if (j !== 0) g.b[j * 8 + 3] = 2; }
  g.tray[0] = { c: [[0, 0]], k: 4 };
  let r = F.pzPlace(g, 0, 0, 3);
  eq([r.n, r.cleared.length, g.b.filter(Boolean).length, g.lines, g.combo], [2, 15, 0, 2, 1], '십자 지우기');
  eq(r.gain, 1 + Math.round(10 * 2 + 5 * 2 * 1), '십자 점수 (1 + 30)');
  // 문양 줄: 같은 문양 8칸 → 그 줄 3배 (10 → 30)
  g = F.pzFreshGame(true);
  for (let j = 1; j < 8; j++) g.b[j] = 3;
  g.tray[1] = { c: [[0, 0]], k: 3 };
  r = F.pzPlace(g, 1, 0, 0);
  eq([r.n, r.lines.mono, r.gain], [1, ['r0'], 31], '문양 줄 점수');
  // 섞인 줄은 보통 점수
  g = F.pzFreshGame(true);
  for (let j = 1; j < 8; j++) g.b[j] = j % 2 ? 3 : 4;
  g.tray[1] = { c: [[0, 0]], k: 3 };
  r = F.pzPlace(g, 1, 0, 0);
  eq([r.n, r.lines.mono.length, r.gain], [1, 0, 11], '섞인 줄 점수');
  // 콤보: 연달아 지우면 1.5배, 안 지우면 끊겨요
  g = F.pzFreshGame(true);
  for (let j = 1; j < 8; j++) { g.b[j] = 1; g.b[8 + j] = 2; }
  g.tray = [{ c: [[0, 0]], k: 2 }, { c: [[0, 0]], k: 1 }, { c: [[0, 0]], k: 5 }];   // 문양이 섞이게 놓아요
  const r1 = F.pzPlace(g, 0, 0, 0), r2 = F.pzPlace(g, 1, 1, 0);
  eq([r1.gain, r2.gain, g.combo], [11, 1 + Math.round(10 * 1.5), 2], '콤보 배수');
  const r3 = F.pzPlace(g, 2, 5, 5);
  eq([r3.n, g.combo], [0, 0], '콤보 끊김');
  // 학생 부탁: 부탁 문양을 n개 지우면 정수를 주고 다음 학생이 와요
  g = F.pzFreshGame(true);
  const k = g.ask.k, who = g.ask.who; g.ask.n = 8;
  for (let j = 1; j < 8; j++) g.b[j] = k;
  g.tray[0] = { c: [[0, 0]], k };
  r = F.pzPlace(g, 0, 0, 0);
  eq([r.asks.length, r.asks[0] && r.asks[0].ess, g.ess, g.askI, g.ask.got, g.ask.n], [1, PZ.askEss[0], PZ.askEss[0], 1, 0, PZ.askN[1]], '학생 부탁 완료');
  ok(g.ask.k !== k && g.ask.who !== who, '다음 부탁은 문양과 학생이 달라야 해요');
  // 연습 판은 부탁 정수가 0
  g = F.pzFreshGame(false); g.ask.n = 8; const k2 = g.ask.k;
  for (let j = 1; j < 8; j++) g.b[j] = k2; g.tray[0] = { c: [[0, 0]], k: k2 };
  r = F.pzPlace(g, 0, 0, 0); eq([r.asks[0].ess, g.ess], [0, 0], '연습 판 부탁 정수');
  // 선생님 블록: 조각에 끼어 나오고(8개 중 1개꼴), 그 줄을 지우면 도움 1개. 벌써 있으면 점수 15점
  g = F.pzFreshGame(true);
  let teaN = 0; for (let i = 0; i < 2000; i++) { const p = F.pzNewPiece(g); if (p.t) { teaN++; ok(PZ.teas.includes(p.t) && p.ti >= 0 && p.ti < p.c.length, '선생님 블록 칸 번호'); } }
  ok(teaN > 150 && teaN < 350, '선생님 블록 비율 (2000개 중 ' + teaN + ')');
  g = F.pzFreshGame(true);
  for (let j = 1; j < 8; j++) g.b[j] = 2;
  g.tray[0] = { c: [[0, 0], [1, 0]], k: 2, t: 'owl', ti: 0 };
  r = F.pzPlace(g, 0, 0, 0);
  eq([r.n, r.teas, g.helps.owl, g.tb[0], g.tb[8]], [1, [{ t: 'owl', i: 0, got: true }], 1, '', ''], '부엉이 블록이 든 줄을 지우면 도움 1개');
  // 선생님 블록이 줄 밖에 남으면 판에 기억돼요
  g = F.pzFreshGame(true); g.tray[0] = { c: [[0, 0], [1, 0]], k: 2, t: 'bear', ti: 1 };
  r = F.pzPlace(g, 0, 3, 3); eq([g.tb[27], g.tb[35], g.helps.bear], ['', 'bear', 0], '선생님 블록 자리 기억');
  // 벌써 갖고 있으면 점수로
  g = F.pzFreshGame(true); g.helps.owl = 1;
  for (let j = 1; j < 8; j++) g.b[j] = 2;
  g.tray[0] = { c: [[0, 0]], k: 2, t: 'owl', ti: 0 };
  r = F.pzPlace(g, 0, 0, 0); eq([r.gain, g.helps.owl, r.teas[0].got], [1 + 30 + PZ.teaBonus, 1, false], '보관함이 차 있으면 점수');
  // 선생님 도움 쓰기
  g = F.pzFreshGame(true); g.helps.squirrel = 1;
  for (let i = 0; i < 64; i++) g.b[i] = 1;
  const gone = F.pzHelpSquirrel(g, 0, 0);
  eq([gone.length, g.helps.squirrel, g.b.filter(Boolean).length], [4, 0, 60], '다람쥐: 모서리에서는 4칸, 1개 써요');
  eq(F.pzHelpSquirrel(g, 4, 4).length, 0, '다람쥐: 없으면 못 써요');
  g.helps.squirrel = 1; eq(F.pzHelpSquirrel(g, 4, 4).length, 9, '다람쥐: 가운데는 9칸');
  g = F.pzFreshGame(true); g.tray = [null, null, { c: [[0, 0]], k: 1 }];
  ok(!F.pzHelpOwl(g), '부엉이: 없으면 못 써요'); g.helps.owl = 1;
  ok(F.pzHelpOwl(g), '부엉이'); eq([g.tray.filter(Boolean).length, g.helps.owl], [3, 0], '부엉이: 조각 3개 새로');
  g = F.pzFreshGame(true); g.helps.bear = 1; g.tray[0] = { c: [[0, 0], [0, 1], [0, 2]], k: 1, t: 'bear', ti: 2 };
  ok(F.pzHelpBear(g, 0), '곰: 돌리기');
  eq([g.tray[0].c, g.helps.bear, g.tray[0].c[g.tray[0].ti]], [[[0, 0], [1, 0], [2, 0]], 0, [2, 0]], '곰: 가로 막대가 세로가 되고 선생님 칸도 따라가요');
  eq(F.pzRot([[0, 0], [1, 0], [1, 1]]), [[0, 0], [0, 1], [1, 0]], '작은 ㄱ 돌리기');
  // 막힘: 빈 칸이 하나뿐인데 조각이 다 2칸 이상
  g = F.pzFreshGame(true);
  for (let i = 1; i < 64; i++) g.b[i] = 1;
  g.tray = [{ c: [[0, 0], [0, 1]], k: 1 }, { c: [[0, 0], [1, 0]], k: 2 }, null];
  ok(F.pzStuck(g), '막힘을 알아채야 해요');
  g.tray[2] = { c: [[0, 0]], k: 1 }; ok(!F.pzStuck(g), '1칸 조각이 있으면 안 막혀요');
  // 보상 상한: 점수 150점마다 정수 1(25개까지), 200점마다 수업료 1분치(30분치까지)
  eq([F.pzEssOf(149), F.pzEssOf(150), F.pzEssOf(1e9), F.pzMinOf(199), F.pzMinOf(200), F.pzMinOf(1e9)], [0, 1, 25, 0, 1, 30], '보상 상한');
  // 하루 10판 + 광고 3판
  S.pz = { day: '', n: 0, adN: 0, best: 0, cur: null };
  const rws = [];
  for (let i = 0; i < 11; i++) { rws.push(F.pzStart().rw); }
  eq([rws.filter(Boolean).length, rws[10], F.pzLeft(), F.pzCanAd()], [10, false, 0, true], '하루 10판');
  S.pz.adN = 1; eq([F.pzLeft(), F.pzCanAd()], [3, false], '광고 뒤 3판 더, 광고는 하루 1번');
  // 끝내기: 정수와 도토리가 유한하고, 연습 판은 0
  S.pz.n = 0; S.pz.adN = 0; S.ess = 0;
  const b0 = S.budget;
  let cur = F.pzStart(); cur.score = 3000; cur.ess = 4; S.ess = 4;
  let fin = F.pzFinish(cur);
  eq([fin.ess, fin.askEss, fin.mins, fin.newBest, S.ess, S.pz.best, S.pz.cur], [20, 4, 15, true, 24, 3000, null], '판 끝 보상');
  ok(isFinite(fin.acorns) && fin.acorns > 0 && fin.acorns < 1e15 && S.budget - b0 === fin.acorns, '도토리 보상이 유한하고 지급돼요: ' + fin.acorns);
  S.pz.n = 99; cur = F.pzStart(); cur.score = 3000; fin = F.pzFinish(cur);
  eq([cur.rw, fin.ess, fin.acorns, S.ess], [false, 0, 0, 24], '연습 판은 보상 없음');
  // 초등학교에서도 도토리 보상이 수업료 기준으로 커져요
  const keep = { tier: S.tier, f: JSON.stringify(S.f) };
  S.pz.n = 0; S.tier = 1; const r0 = F.rate();
  cur = F.pzStart(); cur.score = 2000; fin = F.pzFinish(cur);
  ok(fin.acorns >= r0 * 60 * 10 * 0.9 && isFinite(fin.acorns), '초등학교 도토리 보상: ' + fin.acorns + ' vs 수업료 10분치 ' + r0 * 600);
  S.tier = keep.tier;
  return bad;
}"""

SAVE = r"""() => {
  const F = window.__forest, bad = [];
  const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) bad.push(m + ': ' + JSON.stringify(a) + ' != ' + JSON.stringify(b)); };
  // 저장 호환: 예전 저장(pz 없음), 깨진 판, 멀쩡한 판
  const base = JSON.parse(localStorage.getItem('forest-school-v1'));
  delete base.pz; delete base.ess;
  localStorage.setItem('forest-school-v1', JSON.stringify(base));
  return bad;
}"""

async def run(b, dark, w, h):
    tag = ('d' if dark else 'l') + str(w)
    ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme='dark' if dark else 'light')
    await ctx.add_init_script("window.__FOREST_TEST = true;")
    pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    # 새 학교로 시작: 저장을 지우고 한 번 다시 열어요 (그 뒤 새로고침에서는 저장이 남아야 해요)
    await pg.goto(URL); await pg.wait_for_timeout(800); await pg.evaluate("localStorage.clear()")
    await pg.reload(); await pg.wait_for_timeout(2600); await pg.evaluate(SKIPTUT)
    bad = await pg.evaluate(RULES)
    # 화면: 미니게임 탭 → 퍼즐 열기 → 끌어 놓기
    await pg.evaluate(f"{F}.S.pz = {{ day: '', n: 0, adN: 0, best: 0, cur: null }}; {F}.S.ess = 12; document.querySelector('.tab[data-tab=mini]').click()"); await pg.wait_for_timeout(400)
    txt = await pg.evaluate("[document.querySelector('#essHave').textContent, document.querySelector('#pzLeftTxt').textContent, document.querySelector('#pzAdBtn').hidden]")
    if txt != ['12', '오늘 보상 판 10번 남음', True]: bad.append('미니게임 탭 글: ' + json.dumps(txt, ensure_ascii=False))
    await pg.screenshot(path=f's46_mini_{tag}.png')
    await pg.evaluate("document.querySelector('#pzOpen').click()"); await pg.wait_for_timeout(500)
    st = await pg.evaluate(f"[!document.querySelector('#pzScene').hidden, document.querySelectorAll('#pzGrid .pz-cell').length, document.querySelectorAll('#pzTray .pz-slot .pz-piece').length, {F}.S.pz.n, {F}.S.pz.cur.rw]")
    if st != [True, 64, 3, 1, True]: bad.append('퍼즐 열기: ' + json.dumps(st))
    # 첫 조각을 (0,0)에 끌어다 놓기
    box = await pg.evaluate("(() => { const s = document.querySelector('#pzTray .pz-slot'); const r = s.getBoundingClientRect(); const g = document.querySelector('#pzGrid').getBoundingClientRect(); return {sx: r.x + r.width/2, sy: r.y + r.height/2, gx: g.x, gy: g.y, cell: g.width/8}; })()")
    p = await pg.evaluate(f"{F}.S.pz.cur.tray[0]")
    pw = max(c[1] for c in p['c']) + 1; ph = max(c[0] for c in p['c']) + 1
    tx = box['gx'] + pw * box['cell'] / 2; ty = box['gy'] + ph * box['cell'] + 70
    await pg.mouse.move(box['sx'], box['sy']); await pg.mouse.down(); await pg.mouse.move(tx - 40, ty - 40, steps=4); await pg.mouse.move(tx, ty, steps=4); await pg.wait_for_timeout(120)
    ghost = await pg.evaluate("[document.querySelectorAll('#pzGrid .pz-cell.ghost').length, document.querySelector('#pzDrag').hidden]")
    if ghost != [len(p['c']), False]: bad.append('끌 때 놓을 자리 미리 보기: ' + json.dumps(ghost))
    await pg.screenshot(path=f's46_drag_{tag}.png')
    await pg.mouse.up(); await pg.wait_for_timeout(300)
    placed = await pg.evaluate(f"[{F}.S.pz.cur.b.filter(Boolean).length, {F}.S.pz.cur.score, {F}.S.pz.cur.tray.filter(Boolean).length, document.querySelectorAll('#pzGrid .pz-cell[data-v]:not([data-v=\"0:\"])').length]")
    if placed != [len(p['c']), len(p['c']), 2, len(p['c'])]: bad.append('놓은 뒤 상태: ' + json.dumps(placed))
    if not await pg.evaluate(f"!!{F}.S.pz.cur"): bad.append('끌어 놓은 뒤 판이 사라졌어요: ' + json.dumps(placed))
    # 판을 조금 채운 모습 (봇이 되는 대로 놓아요) → 화면
    await pg.evaluate(f"""(() => {{ const F = {F}, c = F.S.pz.cur; let moves = 0;
      for (let t = 0; t < 40 && moves < 14; t++) {{ let done = false;
        for (let s = 0; s < 3 && !done; s++) {{ const p = c.tray[s]; if (!p) continue;
          for (let r = 7; r >= 0 && !done; r--) for (let col = 0; col < 8 && !done; col++) if (F.pzFits(c.b, p.c, r, col)) {{ F.pzPlace(c, s, r, col); moves++; done = true; }} }}
        if (!done) break; }}
      F.pzRenderAll(); return [moves, !!F.S.pz.cur, F.pzStuck(c)]; }})()""")
    await pg.wait_for_timeout(300)
    if not await pg.evaluate(f"!!{F}.S.pz.cur"): bad.append('봇이 놓은 뒤 판이 사라졌어요'); return tag, bad
    await pg.screenshot(path=f's46_board_{tag}.png')
    # 선생님 도움 창과 그만하기 창
    if not await pg.evaluate(f"!!{F}.S.pz.cur"): bad.append('도움 단추 전에 판이 사라졌어요'); return tag, bad
    # 선생님 블록이 보이는 조각과 선생님 단추
    await pg.evaluate(f"(() => {{ const c = {F}.S.pz.cur; c.b.fill(0); c.tb.fill(''); c.helps = {{ squirrel: 0, owl: 1, bear: 1 }}; c.tray[0] = {{ c: [[0, 0], [0, 1], [1, 0], [1, 1]], k: 3, t: 'squirrel', ti: 3 }}; {F}.pzRenderAll(); }})()"); await pg.wait_for_timeout(200)
    hp = await pg.evaluate("[document.querySelectorAll('#pzHelps .pz-tea.has').length, document.querySelectorAll('#pzTray [data-slot=\"0\"] i.tea').length, getComputedStyle(document.querySelector('#pzTray [data-slot=\"0\"] i.tea'), '::after').backgroundImage.startsWith('url')]")
    if hp != [2, 1, True]: bad.append('선생님 단추와 블록: ' + json.dumps(hp))
    await pg.screenshot(path=f's46_help_{tag}.png')
    await pg.evaluate("document.querySelector('#pzHelps [data-help=owl]').click()"); await pg.wait_for_timeout(200)
    owl = await pg.evaluate(f"[{F}.S.pz.cur.helps.owl, {F}.S.pz.cur.tray.filter(Boolean).length, document.querySelectorAll('#pzHelps .pz-tea.has').length]")
    if owl != [0, 3, 1]: bad.append('부엉이 도움 뒤: ' + json.dumps(owl))
    await pg.evaluate("document.querySelector('#pzHelps [data-help=bear]').click()"); await pg.wait_for_timeout(100)
    bm = await pg.evaluate("[document.querySelectorAll('#pzTray .pz-slot.rotpick').length, document.querySelector('#pzHelps [data-help=bear]').classList.contains('on')]")
    if bm != [3, True]: bad.append('곰 고르기 모드: ' + json.dumps(bm))
    await pg.evaluate("document.querySelector('#pzHelps [data-help=bear]').click()"); await pg.wait_for_timeout(100)
    # 이어하기: 새로고침해도 하던 판이 남아요
    score0 = await pg.evaluate(f"{F}.S.pz.cur.score")
    await pg.evaluate(f"{F}.pzClose()")
    await pg.reload(); await pg.wait_for_timeout(2600); await pg.evaluate(SKIPTUT)
    res = await pg.evaluate(f"[{F}.S.pz.cur && {F}.S.pz.cur.score, {F}.S.pz.n, {F}.S.ess]")
    if res != [score0, 1, 12]: bad.append('이어하기 저장: ' + json.dumps(res))
    await pg.evaluate("document.querySelector('.tab[data-tab=mini]').click()"); await pg.wait_for_timeout(300)
    sub = await pg.evaluate("[document.querySelector('#pzCardTag').textContent, document.querySelector('#pzCardSub').textContent]")
    if sub[0] != '이어서': bad.append('이어서 카드: ' + json.dumps(sub, ensure_ascii=False))
    # 그만하기 → 보상 창
    await pg.evaluate("document.querySelector('#pzOpen').click()"); await pg.wait_for_timeout(400)
    await pg.evaluate(f"{F}.S.pz.cur.score = 900; {F}.pzRenderAll(); document.querySelector('#pzQuit').click()"); await pg.wait_for_timeout(200)
    await pg.evaluate("document.querySelector('#pzQuitYes').click()"); await pg.wait_for_timeout(400)
    end = await pg.evaluate(f"[!document.querySelector('#pzEnd').hidden, document.querySelector('#pzEndScore').textContent, document.querySelectorAll('#pzEndList li').length, {F}.S.ess, {F}.S.pz.best, {F}.S.pz.cur]")
    if end[:2] != [True, '900'] or end[2] not in (2, 3) or end[3] != 18 or end[4] != 900 or end[5] is not None: bad.append('그만하기 보상: ' + json.dumps(end, ensure_ascii=False))
    await pg.screenshot(path=f's46_end_{tag}.png')
    await pg.evaluate("document.querySelector('#pzEndAgain').click()"); await pg.wait_for_timeout(300)
    again = await pg.evaluate(f"[document.querySelector('#pzEnd').hidden, {F}.S.pz.cur && {F}.S.pz.cur.score, {F}.S.pz.n]")
    if again != [True, 0, 2]: bad.append('다시 하기: ' + json.dumps(again))
    await pg.evaluate("document.querySelector('#pzBack').click()"); await pg.wait_for_timeout(200)
    # 넘침 검사: 퍼즐 장면 안 요소가 화면을 벗어나지 않아요
    await pg.evaluate("document.querySelector('#pzOpen').click()"); await pg.wait_for_timeout(300)
    over = await pg.evaluate("(() => { const W = innerWidth, H = innerHeight; return [...document.querySelectorAll('#pzScene .pz-top, #pzScene .pz-ask, #pzScene .pz-board, #pzScene .pz-tray, #pzScene .pz-foot')].map(e => { const r = e.getBoundingClientRect(); return [e.className, Math.round(r.left), Math.round(r.right), Math.round(r.bottom)]; }).filter(x => x[1] < 0 || x[2] > W + 1 || x[3] > H + 1); })()")
    if over: bad.append('퍼즐 화면 넘침: ' + json.dumps(over))
    # 저장 호환: pz가 없는 예전 저장, 깨진 판. 새로고침은 떠나면서 저장을 다시 쓰니, 새 창에서 시작하기 전에 저장을 바꿔 넣어요
    raw = await pg.evaluate("localStorage.getItem('forest-school-v1')")
    async def boot_with(mutate):
        c2 = await b.new_context(viewport={'width': w, 'height': h}, is_mobile=True, has_touch=True, color_scheme='dark' if dark else 'light')
        await c2.add_init_script("window.__FOREST_TEST = true; (() => { const d = " + raw + "; (" + mutate + ")(d); localStorage.setItem('forest-school-v1', JSON.stringify(d)); })();")
        p2 = await c2.new_page(); e2 = []; p2.on('pageerror', lambda e: e2.append(str(e)))
        await p2.goto(URL); await p2.wait_for_timeout(2600)
        out = await p2.evaluate(f"[{F}.S.ess, {F}.S.pz.n, {F}.S.pz.adN, {F}.S.pz.best, {F}.S.pz.cur]")
        await c2.close(); return out, e2
    old, e2 = await boot_with("d => { delete d.pz; delete d.ess; }")
    if old != [0, 0, 0, 0, None] or e2: bad.append('예전 저장 읽기: ' + json.dumps(old) + ' ' + ' | '.join(e2))
    brk, e2 = await boot_with("d => { d.ess = -5; d.pz = { day: 'x', n: 'a', adN: 2, best: 1e12, cur: { b: [1, 2], tray: 'no', score: 5 } }; }")
    if brk != [0, 0, 2, 1e9, None] or e2: bad.append('깨진 저장 읽기: ' + json.dumps(brk) + ' ' + ' | '.join(e2))
    keep, e2 = await boot_with("d => { d.pz.cur = { b: new Array(64).fill(0).map((_, i) => i < 8 ? 2 : 0), tb: new Array(64).fill('').map((_, i) => i === 2 ? 'owl' : i === 40 ? 'bear' : ''), helps: { owl: 5, bear: 'x' }, tray: [{ c: [[0, 0], [0, 1]], k: 3, t: 'bear', ti: 1 }, null, { c: [[9, 9]], k: 1 }], score: 77, combo: 1, lines: 1, askI: 1, ask: { k: 2, n: 12, got: 3, who: 'fox' }, ess: 2, rw: true }; }")
    cur = keep[4]
    okc = cur and cur['score'] == 77 and cur['helps'] == {'squirrel': 0, 'owl': 1, 'bear': 0} and cur['tb'][2] == 'owl' and cur['tb'][40] == '' and cur['tray'][0] and cur['tray'][0].get('t') == 'bear' and cur['tray'][0].get('ti') == 1 and cur['tray'][1] is None and cur['tray'][2] is None and cur['ask']['who'] == 'fox' and cur['ask']['n'] == 12 and cur['b'][0] == 2
    if not okc or e2: bad.append('하던 판 읽기: ' + json.dumps(keep, ensure_ascii=False)[:300] + ' ' + ' | '.join(e2))
    if errs: bad.append('페이지 오류: ' + ' | '.join(errs))
    await ctx.close()
    return tag, bad

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        out = [await run(b, False, 360, 740), await run(b, True, 390, 844)]
        await b.close()
    fail = False
    for tag, bad in out:
        for m in bad: print(f'[{tag}] FAIL {m}'); fail = True
    print('FAIL' if fail else 'PASS')
    sys.exit(1 if fail else 0)

asyncio.run(main())
