# 3.0.0 시험: 랭킹 순위표 보조 줄, 홈 칸 접기, 숲속 합치기 판 크기, 선생님 이름, 관리자 고급 배경
# 보는 것
#  1) 랭킹 보조 줄: 순위표가 20줄까지 차요. 주간 리그 보조 줄 점수는 한 주 동안 줄지 않고, 3.2.6부터 월요일 0시 30분에는 거의 0점(10점 아래),
#     6시간마다 늘어나는 점수가 하루 상한(RKF.dayCap)을 넘지 않고, 일요일 밤에는 가장 높은 보조 줄이 지난주 내 점수보다 낮아요. 학교 파워 보조 줄은 내 점수의 30~110%. 보조 줄은 눌러도 구경이 안 돼요(data-look 없음)
#  2) 홈 칸 접기: 학교 칸, 왼쪽 단추, 오른쪽 메뉴, 퀘스트 칸을 접고 펴요. 저장(S.fold)에 남고 옛 저장은 모두 펼침
#  3) 숲속 합치기(393x762, 360x780): 위 칸 두 줄이 있어도 판이 남은 높이 안에 들어가고(마지막 줄 안 잘림) 판이 화면 너비의 88% 넘게, 주문 쪽지 높이 90px 아래
#  4) 선생님 이름: 양, 사슴, 고니, 공작, 알파카, 비버, 오소리 선생님
#  5) 고급 배경: 켜면 고급 지도와 건물 열쇠, 끄면 원래대로
#  6) 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s109test.py   (마지막 줄이 PASS면 통과)
import os, sys
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
SKIP = f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {CLEAN}; }})()"
ok = True
def check(c, m):
    global ok
    print(('PASS ' if c else 'FAIL ') + m); ok = ok and bool(c)

def page(b, w, h):
    pg = b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=2)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.add_init_script("window.__FOREST_TEST=1; localStorage.clear()")
    pg.goto('file://' + os.path.join(HERE, 'test.html')); pg.wait_for_timeout(2500); pg.evaluate(SKIP)
    return pg, errs

with sync_playwright() as p:
    b = p.chromium.launch()
    pg, errs = page(b, 390, 844)
    # 1) 랭킹 보조 줄
    r = pg.evaluate("""() => { const F = window.__forest, S = F.S, R = F.Rank; R.state = 'on'; R.uid = 'me';
      S.lg.last = { week: 0, pts: 500, pos: 1, gold: 0 };
      const mon = Date.UTC(2030, 0, 7, 0 - 9, 30);   // 2030-01-07 월요일 한국 시간 0시 30분
      const mine = { id: 'me', name: '나', lp: 0, score: 0 };
      const runs = []; let mono = true, prev = null, jump = 0;
      S.clk.last = 0; F.rt.rkMax = {};
      for (let h = 0; h <= 167; h += 6) { F.rt.fakeNow = mon + h * 3600000; const rows = F.rkFill('week', [mine], 0).filter(x => x.nx);
        const v = Object.fromEntries(rows.map(x => [x.id, x.lp])); if (prev) for (const k in v) { if (v[k] < prev[k]) mono = false; jump = Math.max(jump, v[k] - prev[k]); } prev = v; runs.push(Math.max(...rows.map(x => x.lp))); }
      S.clk.last = 0; F.rt.rkMax = {}; F.rt.fakeNow = mon + 3600000; const monRows = F.rkFill('week', [mine], 0);   // 3.2.6 시계는 뒤로 가지 않고 한 번 보인 점수는 남아서, 월요일을 다시 잴 때 둘 다 비워요
      F.rt.fakeNow = mon + 167 * 3600000; const sunTop = Math.max(...F.rkFill('week', [mine], 0).filter(x => x.nx).map(x => x.lp));
      const all = F.rkFill('all', [{ id: 'me', name: '나', score: 10000 }], 10000).filter(x => x.nx).map(x => x.score / 10000);
      const n = monRows.length, low = Math.min(...monRows.filter(x => x.nx).map(x => x.lp)), monTop = Math.max(...monRows.filter(x => x.nx).map(x => x.lp));
      S.clk.last = 0; F.rt.fakeNow = null;
      return { n, mono, monLow: low, monTop, jump, cap: F.RKF.dayCap, sunTop, minF: Math.min(...all), maxF: Math.max(...all), names: new Set(monRows.map(x => x.name)).size }; }""")
    print('보조 줄', r)
    check(r['n'] == 20 and r['names'] == 20, '순위표 20줄, 이름 겹침 없음')
    check(r['mono'], '주간 보조 줄 점수가 한 주 동안 줄지 않아요')
    check(r['monTop'] < 10 and r['sunTop'] < 500, '3.2.6 월요일 0시 30분엔 보조 줄이 거의 0점, 일요일엔 가장 높은 보조 줄이 지난주 내 점수보다 낮아요')
    check(r['jump'] <= r['cap'], f"3.2.6 6시간 동안 늘어나는 점수가 하루 상한 안 {r['jump']} <= {r['cap']}")
    check(r['minF'] >= 0.3 * 0.92 - 1e-9 and r['maxF'] <= 1.1 + 1e-9, '학교 파워 보조 줄은 내 점수의 30~110%')
    r = pg.evaluate("""() => { const F = window.__forest, S = F.S; F.Rank.state = 'on'; F.Rank.uid = 'me'; F.Rank.rows = []; F.Rank.wrows = []; F.rt.rankView = 'all';
      F.setTab('rank'); const li = [...document.querySelectorAll('#rankList li')];
      return { n: li.length, look: li.filter(x => x.dataset.look).length }; }""")
    print('순위표', r)
    check(r['n'] >= 19 and r['look'] == 0, '보조 줄은 눌러도 구경이 안 돼요')
    pg.evaluate(CLEAN)
    # 2) 홈 칸 접기
    r = pg.evaluate("""async () => { const F = window.__forest, S = F.S; F.setTab('school'); F.renderMap(); await new Promise(r => setTimeout(r, 400));
      for (const id of ['foldB', 'foldL', 'foldR', 'qFold']) document.getElementById(id).click(); await new Promise(r => setTimeout(r, 300));
      const out = { fold: { ...S.fold }, b: document.querySelector('.board').classList.contains('folded'), l: document.querySelector('.map-left').classList.contains('folded'),
        r: document.querySelector('.map-right').classList.contains('folded'), q: document.getElementById('qRow').classList.contains('folded'),
        bh: Math.round(document.querySelector('.board').getBoundingClientRect().height), sideBtns: [...document.querySelectorAll('.map-right .sidebtn')].filter(x => x.offsetParent).length };
      const s2 = F.sanitize(JSON.parse(JSON.stringify(S))), s3 = F.sanitize({ ...JSON.parse(JSON.stringify(S)), fold: undefined });
      out.keep = s2.fold; out.old = s3.fold;
      for (const id of ['foldB', 'foldL', 'foldR', 'qFold']) document.getElementById(id).click(); await new Promise(r => setTimeout(r, 300));
      out.after = { ...S.fold }; out.bh2 = Math.round(document.querySelector('.board').getBoundingClientRect().height); return out; }""")
    print('접기', r)
    check(r['fold'] == {'b': 1, 'l': 1, 'r': 1, 'q': 1} and r['b'] and r['l'] and r['r'] and r['q'] and r['sideBtns'] == 0, '네 칸을 모두 접어요')
    check(r['bh'] < r['bh2'] * 0.7, f"학교 칸이 한 줄로 낮아져요 {r['bh']} < {r['bh2']}")
    check(r['keep'] == {'b': 1, 'l': 1, 'r': 1, 'q': 1} and r['old'] == {'b': 0, 'l': 0, 'r': 0, 'q': 0} and r['after'] == {'b': 0, 'l': 0, 'r': 0, 'q': 0}, '저장에 남고 옛 저장은 펼침, 다시 누르면 펴요')
    # 4) 선생님 이름
    r = pg.evaluate("() => Object.fromEntries(Object.entries(window.__forest.XT).map(([k, v]) => [k, v.name]))")
    check(r.get('diet') == '양 선생님' and r.get('lib') == '사슴 선생님' and r.get('kor') == '고니 선생님' and r.get('art') == '공작 선생님' and r.get('snack') == '알파카 선생님' and r.get('fix') == '비버 선생님' and r.get('dorm') == '오소리 선생님', f'선생님 이름 {r}')
    # 5) 고급 배경
    r = pg.evaluate("""() => { const F = window.__forest; F.rt.lux = false; const a = F.mapKey('map_elem'); F.rt.lux = true; const b = F.mapKey('map_elem'), c = F.mapKey('map_high'); F.rt.lux = false; return [a, b, c]; }""")
    check(r == ['map_elem', 'map_elem_lux', 'map_high_lux'], f'고급 지도 열쇠 {r}')
    r = pg.evaluate("""() => { document.getElementById('devBox').hidden = false; const b = document.getElementById('devLux'); b.hidden = false; b.click(); const on = window.__forest.luxOn(), ls = localStorage.getItem('forest-lux'); b.click(); return [on, ls, window.__forest.luxOn()]; }""")
    check(r == [True, '1', False], f'개발자 메뉴에서 켜고 꺼요 {r}')
    check(not errs, '오류 없음 ' + str(errs[:2])); pg.close()
    # 3) 숲속 합치기 판
    for w, h in ((393, 762), (360, 780)):
        pg, errs = page(b, w, h)
        pg.evaluate("()=>{const F=window.__forest,S=F.S; S.tier=2; F.setTab('mini'); setTimeout(()=>document.getElementById('mgOpen').click(),300)}")
        pg.wait_for_timeout(1500); pg.evaluate("()=>{const h=document.getElementById('mgHelp'); if(h) h.hidden=true}"); pg.evaluate(CLEAN)
        pg.evaluate("()=>{const b=document.getElementById('mgMuls'),m=document.getElementById('mgModes'); b.hidden=m.hidden=false; b.innerHTML='<button>×1</button><button>×2</button>'; m.innerHTML='<button>따로</button><button>합쳐서</button>'}")
        pg.wait_for_timeout(500)
        r = pg.evaluate("""()=>{const c=[...document.querySelectorAll('#mgGrid .mg-cell')], last=c[c.length-1].getBoundingClientRect(), mid=document.querySelector('.mg-mid').getBoundingClientRect(), bd=document.getElementById('mgBoard').getBoundingClientRect(), o=document.querySelector('.mg-order').getBoundingClientRect();
          return {last: last.bottom, mid: mid.bottom, board: bd.bottom, bw: bd.width / innerWidth, oh: o.height}}""")
        print(w, r)
        check(r['board'] <= r['mid'] + 1 and r['last'] <= r['mid'], f'{w}px 판과 마지막 줄이 안 잘려요')
        check(r['bw'] >= 0.88 and r['oh'] <= 90, f"{w}px 판이 너비 가득({r['bw']:.2f}), 주문 쪽지 낮게({r['oh']:.0f}px)")
        check(not errs, f'{w}px 오류 없음 ' + str(errs[:2])); pg.close()
    b.close()
print('PASS' if ok else 'FAIL'); sys.exit(0 if ok else 1)
