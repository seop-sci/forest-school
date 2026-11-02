# 2.3.5 비버 시설 선생님: 초등학교부터, 연수는 숲의 정수 20+10n, 한 레벨에 공사 시간 -2%
import os, sys
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
ok = True
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
SKIP = f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {CLEAN}; }})()"
def check(c, m):
    global ok
    print(('PASS ' if c else 'FAIL ') + m); ok = ok and c
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 360, 'height': 780})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.add_init_script("window.__FOREST_TEST=1; localStorage.clear()")
    pg.goto('file://' + os.path.join(HERE, 'test.html')); pg.wait_for_timeout(1500)
    r = pg.evaluate("""() => { const F = window.__forest, S = F.S;
      const out = {};
      S.tier = 0; S.f.classroom = 1; out.here0 = !F.xtAct('fix');
      S.tier = 1; S.tg = 3; S.f.classroom = 3; S.ess = 1000;
      out.costs = []; let L = 0;
      const base = F.conSec('library', 5);
      out.base = base;
      while (S.xt.fix < 10) { const c = F.xtCost('fix'); out.costs.push(c); const e = S.ess; F.xtAct('fix'); if (e - S.ess !== c) out.bad = 1; }
      out.spent = 1000 - S.ess; out.after = F.conSec('library', 5); out.maxed = !F.xtAct('fix');
      S.ess = 0; S.xt.fix = 3; out.poor = !F.xtAct('fix') && S.xt.fix === 3;
      out.first = F.conSec('library', 1);
      F.goTo && F.goTo('teachers');
      const card = document.querySelector('.tcard[data-k="fix"]'); out.card = !!card; out.ess = !!(card && card.querySelector('.cost .tic'));
      return out; }""")
    print(r)
    check(r['here0'], '유치원에서는 연수를 못 해요')
    check(r['costs'] == [30, 40, 50, 60, 70, 80, 90, 100, 110, 120] and r['spent'] == 750 and not r.get('bad'), '정수 30~120, 모두 750')
    check(abs(r['after'] - round(r['base'] * 0.8)) <= 1, 'Lv.10 공사 시간 -20%')
    check(r['maxed'] and r['poor'], '최고 레벨과 정수 모자람')
    check(r['first'] == 10, '처음 짓기 10초 그대로')
    check(r['card'] and r['ess'], '선생님 탭 카드에 정수 표시')
    # 지도: 공사장에 비버, 누르면 말풍선(건물 창은 안 열려요), 공사가 끝나면 사라져요
    pg.evaluate(SKIP)
    m = pg.evaluate("""async () => { const F = window.__forest, S = F.S; S.tier = 1; S.tg = 3; S.xt.fix = 0;
      for (const k of F.facKeys()) S.f[k] = Math.max(S.f[k] || 0, 4); F.setTab('school'); F.renderMap();
      const now = Date.now(); S.bd = { classroom: { L: 5, s: now, e: now + 600000 } }; F.conRender(true);
      const bv = document.querySelector('#cu-classroom .con-bv'); if (!bv) return { bv: false };
      bv.scrollIntoView({ block: 'center' }); await new Promise(r => setTimeout(r, 300));
      const r = bv.getBoundingClientRect(), e = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return { bv: true, top: !!(e && e.closest('.con-bv')), frames: bv.querySelectorAll('image').length }; }""")
    print(m)
    check(m.get('bv') and m.get('top') and m.get('frames', 0) >= 3, '공사장 비버가 보이고 맨 위에서 눌려요')
    pg.click('#cu-classroom .con-bv rect.bv-hit'); pg.wait_for_timeout(300)
    t = pg.evaluate("() => [window.__forest.rt.sheetKey || '', window.__forest.rt.bvN]")
    check(t[0] == '' and t[1] == 1, '비버를 누르면 말하고 건물 창은 안 열려요')
    pg.evaluate("() => { const F = window.__forest; F.S.bd.classroom.e = Date.now() - 1; F.conTick(); F.conRender(true); }"); pg.wait_for_timeout(400)
    check(pg.evaluate("() => !document.querySelector('.con-bv')"), '공사가 끝나면 비버가 사라져요')
    check(not errs, '오류 없음 ' + str(errs[:2]))
    b.close()
print('PASS' if ok else 'FAIL'); sys.exit(0 if ok else 1)
