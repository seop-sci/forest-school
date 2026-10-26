# 49번 묶음(1.6.0) 시험: 게임 시계 gameNow(), gameToday(), gameWeek()
# 검사 대상: 한국 시간 날짜, 기기 시간대 바꾸기, 시계 뒤로 돌리기, 미래로 갔다 돌아오기(서버 시간 있을 때와 없을 때), 하루 제한 다섯 곳이 이 시계를 쓰는지, 저장 호환
# 쓰는 법: python3 wrap.py && python3 s49test.py   (마지막 줄이 "PASS"면 통과)
import asyncio, json, sys
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
SKIPTUT = "const t=document.querySelector('#tut'); if(t && !t.hidden){ window.__forest.S.tut.st='skip'; t.hidden=true; window.__forest.rt.modalOpen=null; }"
DAY = 86400000

CHECK = r"""() => {
  const F = window.__forest, S = F.S, rt = F.rt, bad = [];
  const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) bad.push(m + ': ' + JSON.stringify(a) + ' != ' + JSON.stringify(b)); };
  const DAY = 86400000;
  const off = () => { F.SVR.ok = false; F.SVR.offset = 0; };
  off(); S.clk.last = 0;
  // 한국 시간 날짜: UTC 14:59는 한국 23:59, UTC 15:00은 다음 날 0:00
  eq([F.kstDay(Date.UTC(2026, 10, 1, 14, 59)), F.kstDay(Date.UTC(2026, 10, 1, 15, 0))], ['2026-11-01', '2026-11-02'], '한국 시간 날짜 경계');
  // 주: 한국 시간 월요일 0시. 2026-01-11(일) 23:59 KST는 0주, 2026-01-12(월) 0:00 KST는 1주
  rt.fakeNow = Date.UTC(2026, 0, 11, 14, 59); eq(F.gameWeek(), 0, '주 번호 (일요일 밤)');
  rt.fakeNow = Date.UTC(2026, 0, 11, 15, 0); eq(F.gameWeek(), 1, '주 번호 (월요일 0시)');
  // 시계 뒤로 돌리기: 가장 늦은 시각에 멈춰요
  const T = Date.UTC(2026, 10, 5, 3, 0);   // 2026-11-05 12:00 KST
  rt.fakeNow = T; eq([F.gameNow(), F.gameToday(), S.clk.last], [T, '2026-11-05', T], '보통 때');
  rt.fakeNow = T - 2 * DAY; eq([F.gameNow(), F.gameToday(), S.clk.last], [T, '2026-11-05', T], '뒤로 돌리면 멈춤');
  rt.fakeNow = T + 1000; eq([F.gameNow(), S.clk.last], [T + 1000, T + 1000], '다시 앞으로 가면 따라감');
  // 미래로 갔다 돌아오기, 서버 없음(토스): 미래 시각에 멈춰 있어요 (지섭 결정: 이건 막지 않음)
  rt.fakeNow = T + 10 * DAY; F.gameNow();
  rt.fakeNow = T; eq([F.gameNow(), F.gameToday()], [T + 10 * DAY, '2026-11-15'], '서버 없이 미래에서 돌아오면 멈춤');
  // 서버 시간이 오면(Firebase나 토스 getServerTime → setServerTime) 서버 시간을 믿고 S.clk.last를 바로잡아요 (기기는 아직 T, 서버도 T)
  F.setServerTime(T);
  eq([F.SVR.ok, F.gameNow(), F.gameToday(), S.clk.last], [true, T, '2026-11-05', T], '서버 시간으로 바로잡음');
  // 기기 시계가 3일 틀려도 서버 보정값으로 맞춰요
  rt.fakeNow = T + 3 * DAY; F.setServerTime(T); eq([F.gameNow(), F.gameToday()], [T, '2026-11-05'], '서버 보정');
  F.setServerTime('bad'); F.setServerTime(0); eq([F.gameNow()], [T], '이상한 서버 시간은 무시');
  off();
  // 하루 제한 다섯 곳: 모두 게임 시계를 따라요. 기기 시계를 하루 뒤로 돌려도 새 날이 안 와요
  rt.fakeNow = T; S.clk.last = 0;
  const today = F.gameToday();
  S.pz = { day: today, n: 10, adN: 0, best: 0, cur: null }; S.gd.day = today; S.gd.n = 10; S.gd.shop = 3; S.ad.day = today; S.ad.n = 5; S.hd.day = today; S.hd.n = F.DEAL.perDay; S.att.last = today;
  F.dmDay(); const dm0 = S.dm.list.map(m => m.id).join(','); S.dm.list.forEach(m => { m.done = true; });
  const used = () => [F.pzLeft(), (F.goldDay(), S.gd.n), F.boostLeft(), F.dealLeft(), F.canStamp(), (F.dmDay(), S.dm.day === today && S.dm.list.every(m => m.done))];
  eq(used(), [0, 10, 0, 0, false, true], '제한을 다 쓴 상태 (오늘의 미션도 다 함)');
  rt.fakeNow = T - DAY; eq(used(), [0, 10, 0, 0, false, true], '기기 시계를 하루 뒤로: 그대로 막힘, 미션도 그대로');
  rt.fakeNow = T + DAY; eq(used(), [10, 0, 5, F.DEAL.perDay, true, false], '진짜 다음 날: 다시 열림');
  eq([S.dm.day, S.dm.list.every(m => !m.done)], [F.kstDay(T + DAY), true], '오늘의 미션이 한국 시간 새 날에 바뀜');
  void dm0;
  // 주간 리그와 이번 주 미션: 주 번호는 gameWeek()와 같고(서버에 올리는 week도 S.lg.week), 번호가 뒤로 가도 보상을 두 번 주지 않아요
  off(); S.clk.last = 0;
  const MON = Date.UTC(2026, 10, 1, 15, 0);   // 2026-11-02(월) 0:00 KST
  rt.fakeNow = MON + DAY; F.lgWeek(); F.wkWeek();
  const W = F.gameWeek();
  eq([F.weekIdx(), S.lg.week, S.wk.week, Math.floor(F.lgKey() / 1e6)], [W, W, W, W], '주 번호가 gameWeek와 같음');
  S.lg.pts = 50; S.lg.pos = 3; const gold0 = S.gold;
  // (1) 번호가 뒤로 가는 순간(업데이트 때 동쪽 시간대): 보상 없음, 포인트 그대로
  S.clk.last = 0; rt.fakeNow = MON - 3600000; F.lgWeek(); F.wkWeek();
  eq([S.lg.week, S.lg.pts, S.wk.week], [W, 50, W], '주 번호가 뒤로 가면 그대로');
  // (2) 진짜 다음 주: 지난주 보상 한 번(1.5초 뒤 지급), 새 주로
  rt.fakeNow = MON + 7 * DAY + 3600000; F.lgWeek();
  eq([S.lg.week, S.lg.pts, S.lg.last && S.lg.last.week, S.lg.last && S.lg.last.pts], [W + 1, 0, W, 50], '다음 주: 지난주 기록 남김');
  // (3) 같은 주 번호로 다시 불러도 또 주지 않아요. 시계를 뒤로 돌려도 멈춰 있어요
  F.lgWeek(); rt.fakeNow = MON + DAY; F.lgWeek();
  eq([S.lg.week, S.lg.last.week], [W + 1, W], '같은 주 번호로는 한 번만');
  rt.fakeNow = 0; S.clk.last = 0;
  return [bad, gold0];
}"""

async def run(b, tz, w):
    ctx = await b.new_context(viewport={'width': w, 'height': 760}, is_mobile=True, has_touch=True, timezone_id=tz)
    await ctx.add_init_script("window.__FOREST_TEST = true;")
    pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(URL); await pg.wait_for_timeout(800); await pg.evaluate("localStorage.clear()")
    await pg.reload(); await pg.wait_for_timeout(2600); await pg.evaluate(SKIPTUT)
    bad, gold0 = await pg.evaluate(CHECK)
    await pg.wait_for_timeout(1800)
    paid = await pg.evaluate(f"{F}.S.gold") - gold0
    if paid <= 0: bad.append('지난주 리그 보상이 한 번 지급돼야 해요: ' + str(paid))
    else:
        # 보상이 두 번 들어가지 않았는지: 1.5초 지급이 한 번뿐
        await pg.wait_for_timeout(1600)
        if await pg.evaluate(f"{F}.S.gold") - gold0 != paid: bad.append('지난주 리그 보상이 두 번 들어갔어요')
    # 시간대를 바꿔도 같은 시각이면 같은 날 (UTC 15:30 = 한국 0:30 다음 날, 로스앤젤레스는 전날 오전)
    day = await pg.evaluate(f"(() => {{ {F}.rt.fakeNow = Date.UTC(2026, 10, 1, 15, 30); {F}.S.clk.last = 0; const d = {F}.gameToday(); {F}.rt.fakeNow = 0; return [d, new Date(Date.UTC(2026, 10, 1, 15, 30)).getDate()]; }})()")
    # 저장: clk.last가 남고, 망가진 값은 기기 시간 + 1년까지만
    await pg.evaluate(f"{F}.S.clk.last = 1234567890123")
    raw = await pg.evaluate("(() => { const d = JSON.parse(localStorage.getItem('forest-school-v1')); return d && d.clk ? d.clk.last : null; })()")
    san = await pg.evaluate(f"[{F}.sanitize({{ clk: {{ last: 1e20 }} }}).clk.last <= Date.now() + 367 * 86400000, {F}.sanitize({{ clk: {{ last: 1234567890123 }} }}).clk.last, {F}.sanitize({{}}).clk.last]")
    if san != [True, 1234567890123, 0]: bad.append('저장 읽기: ' + json.dumps(san))
    if errs: bad.append('페이지 오류: ' + ' | '.join(errs))
    await ctx.close()
    return tz, bad, day, raw

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        a = await run(b, 'Asia/Seoul', 360)
        c = await run(b, 'America/Los_Angeles', 390)
        await b.close()
    fail = False
    for tz, bad, day, raw in (a, c):
        for m in bad: print(f'[{tz}] FAIL {m}'); fail = True
        print(f'[{tz}] gameToday={day[0]} (기기 날짜 {day[1]}일), 저장 clk.last 기록={raw is not None}')
    if a[2][0] != c[2][0] or a[2][0] != '2026-11-02': print('FAIL 시간대를 바꾸면 날짜가 달라져요'); fail = True
    if a[2][1] == c[2][1]: print('FAIL 시험 자체: 두 시간대의 기기 날짜가 같아요 (시간대가 안 바뀜)'); fail = True
    print('FAIL' if fail else 'PASS')
    sys.exit(1 if fail else 0)

asyncio.run(main())
