# 3.2.6 시험: 랭킹 순위표 보조 줄이 사람처럼 오르기 (지섭 제보 2026-11-09: 월요일인데 너무 높음, 시즌 시작 전인데 시즌 점수)
# 보는 것
#  1) 시즌 시작 전(2026-11-09 월요일 19시 37분): 시즌 순위표에 보조 줄이 없어요
#  2) 같은 때 주간 리그: 가장 높은 보조 줄도 하루 상한(RKF.dayCap) 아래, 0점인 줄도 있음(아직 안 논 사람)
#  3) 시간대: 새벽(3시~6시)에는 점수가 거의 늘지 않아요(늘어난 합이 저녁 19시~22시의 10% 아래)
#  4) 시즌 중(2027-01-20 수요일 21시): 시즌 보조 줄은 시즌 첫날부터 쌓여 주간 줄보다 크고, 하루씩 넘겨도 줄지 않고 하루에 하루 상한 넘게 늘지 않아요
#  5) 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s114test.py   (마지막 줄이 PASS면 통과)
import os
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
SKIP = f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {CLEAN}; }})()"
ok = True
def check(c, m):
    global ok
    print(('PASS ' if c else 'FAIL ') + m); ok = ok and bool(c)

KST = lambda y, mo, d, h, mi=0: f"(Date.UTC({y}, {mo - 1}, {d}, {h} - 9, {mi}))"

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.add_init_script("window.__FOREST_TEST=1; localStorage.clear()")
    pg.goto('file://' + os.path.join(HERE, 'test.html')); pg.wait_for_timeout(2500); pg.evaluate(SKIP)
    r = pg.evaluate(f"""() => {{ const F = window.__forest, S = F.S, R = F.Rank; R.state = 'on'; R.uid = 'me'; F.rt.rkMax = {{}};
      S.lg.last = {{ week: 0, pts: 1500, pos: 1, gold: 0 }};
      const mine = {{ id: 'me', name: '나', lp: 0, sp: 0, score: 0 }}, nx = rows => rows.filter(x => x.nx);
      F.rt.fakeNow = {KST(2026, 11, 9, 19, 37)};
      const seaPre = nx(F.rkFill('sea', [mine], 0)).length, wk = nx(F.rkFill('week', [mine], 0)).map(x => x.lp);
      // 시간대: 같은 주 화요일 새벽 3~6시와 저녁 19~22시에 늘어난 합
      const sum = t => {{ F.rt.rkMax = {{}}; S.clk.last = 0; F.rt.fakeNow = t; return nx(F.rkFill('week', [mine], 0)).reduce((a, x) => a + x.lp, 0); }};
      const night = sum({KST(2026, 11, 10, 6)}) - sum({KST(2026, 11, 10, 3)}), eve = sum({KST(2026, 11, 10, 22)}) - sum({KST(2026, 11, 10, 19)});
      // 시즌 중
      F.rt.rkMax = {{}}; S.clk.last = 0; F.rt.fakeNow = {KST(2027, 1, 20, 21)};
      const on = F.rsNum(), sea = nx(F.rkFill('sea', [mine], 0)).map(x => x.sp), wk2 = nx(F.rkFill('week', [mine], 0)).map(x => x.lp);
      let mono = true, jump = 0, prev = null;
      for (let d = 0; d < 10; d++) {{ F.rt.rkMax = {{}}; S.clk.last = 0; F.rt.fakeNow = {KST(2027, 1, 10, 23)} + d * 86400000;
        const v = Object.fromEntries(nx(F.rkFill('sea', [mine], 0)).map(x => [x.id, x.sp]));
        if (prev) for (const k in v) {{ if (v[k] < prev[k]) mono = false; jump = Math.max(jump, v[k] - prev[k]); }} prev = v; }}
      S.clk.last = 0; F.rt.fakeNow = null;
      return {{ seaPre, wkTop: Math.max(...wk), wkZero: wk.filter(v => v <= 1).length, night, eve, on, seaMin: Math.min(...sea), seaTop: Math.max(...sea), wk2Top: Math.max(...wk2), mono, jump, cap: F.RKF.dayCap }}; }}""")
    print(r)
    check(r['seaPre'] == 0, '시즌 시작 전에는 시즌 보조 줄이 없어요')
    check(r['wkTop'] <= r['cap'], f"월요일 저녁 가장 높은 주간 보조 줄이 하루 상한 아래 {r['wkTop']} <= {r['cap']}")
    check(r['wkZero'] >= 1, f"월요일에 아직 0점인 보조 줄도 있어요 {r['wkZero']}")
    check(r['night'] < r['eve'] * 0.1, f"새벽엔 거의 안 오르고 저녁에 올라요 {r['night']} < {r['eve']} x 0.1")
    check(r['on'] >= 1 and r['seaTop'] > r['wk2Top'], f"시즌 중 시즌 보조 줄은 시즌 첫날부터 쌓여요 {r['seaTop']} > {r['wk2Top']}")
    check(r['mono'] and r['jump'] <= r['cap'], f"시즌 보조 줄은 하루에 줄지 않고 하루 상한 넘게 늘지 않아요 {r['jump']}")
    check(not errs, '오류 없음 ' + str(errs[:2]))
    b.close()
print('PASS' if ok else 'FAIL')
