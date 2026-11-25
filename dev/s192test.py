# 192번 시험(5.4.0.3): 놀이 기록과 생물 120종, 150종 보상
# 1) 탭, 창, 합치기, 퍼즐을 열면 S.use에 열쇠와 날이 쌓여요(같은 날은 한 번, 날은 7개까지, 열쇠는 60개까지)
# 2) useStr(테스트 현황 use 칸) 글 모양과 800자 한도, statsDoc에 use, 관리자 모아 보기(useSumText, 테스트 도구 학교는 뺌)
# 3) 저장 읽기: 옛 저장은 빈 값, 틀린 열쇠와 값은 버려요
# 4) 토스(가짜 window.AIT): 열쇠마다 AIT.log
# 5) 생물 120종에 황금 3과 정수 60(단계 6), 150종에 정수 100과 칭호 생물 도감 완성(단계 7). 90종 보상은 그대로
import asyncio, json
from playwright.async_api import async_playwright
from testlib import base, ctxpage, Checker, CLEAN, URL
c = Checker()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx, pg, errs = await ctxpage(b, 390, 800, 'light', base(tier=1, students=110))
        await pg.wait_for_timeout(1300); await pg.evaluate(CLEAN)
        r = await pg.evaluate("""async()=>{ const F = window.__forest, S = F.S, sl = ms => new Promise(r => setTimeout(r, ms)), o = {};
          o.fresh = JSON.stringify({ d: {}, n: Object.fromEntries(Object.entries(S.use.n).filter(([k]) => !/^m[A-Z]/.test(k))) }).replace('"n":{}', '"n":{}').replace('{"d":{},', '{"d":{},');   // 저녁 야간 건설 알림 창처럼 시간에 따라 저절로 뜨는 창은 빼요
          F.setTab('teachers'); await sl(100); F.setTab('school'); await sl(100); F.setTab('school');
          F.mgOpen(); await sl(300); document.querySelector('#mgBack').click(); await sl(300);
          F.useLog('pz'); F.useLog('pz');
          o.keys = Object.keys(S.use.n); o.tabN = S.use.n.tab_teachers; o.pzN = S.use.n.pz; o.pzD = S.use.d.pz.length; o.mg = S.use.n.mg;
          S.use.d.pz = [1, 2, 3, 4, 5, 6, 7, 8].map(x => x + 20000); F.useLog('pz'); o.keep = S.use.d.pz.length;
          for (let i = 0; i < 80; i++) F.useLog('zz' + i); o.cap = Object.keys(S.use.n).length;
          F.useLog('bad key!<>'); o.clean = !Object.keys(S.use.n).some(k => /[^A-Za-z0-9_:\\-]/.test(k));
          o.str = F.useStr(); o.len = o.str.length; o.strOk = /^[A-Za-z0-9_:\\-]+:\\d+\\/\\d+(,[A-Za-z0-9_:\\-]+:\\d+\\/\\d+)*$/.test(o.str);
          o.doc = F.statsDoc().use === o.str;
          o.sum = F.useSumText([{ use: 'mg:5/20,pz:1/3' }, { use: 'mg:2/4' }, { use: 'mg:7/9', dev: true }, { use: '' }]);
          const t = {}; F.sanitizeUse({ use: { n: { mg: 3, 'x y': 2, pz: 'a', tab_school: 1e99 }, d: { mg: [20001, 'q', -1, 20002], tab_school: [20003] } } }, t); o.san = t.use;
          const t2 = {}; F.sanitizeUse({}, t2); o.san0 = JSON.stringify(t2.use);
          // 생물 보상
          const ids = F.BIO.map(b => b.id), g0 = S.gold, e0 = S.ess;
          S.bx.got = Object.fromEntries(ids.slice(0, 119).map(x => [x, 1])); S.bx.g = 5; S.bx.sp = [{ i: 1, id: ids[130], t: 0 }]; F.bxTap(1); await sl(200);
          o.g6 = S.bx.g; o.gold = S.gold - g0; o.ess120 = S.ess - e0; F.CLEAN;
          return o; }""")
        await pg.evaluate(CLEAN)
        r2 = await pg.evaluate("""async()=>{ const F = window.__forest, S = F.S, sl = ms => new Promise(r => setTimeout(r, ms)), o = {}, ids = F.BIO.map(b => b.id), e0 = S.ess;
          S.bx.got = Object.fromEntries(ids.slice(0, 149).map(x => [x, 1])); S.bx.g = 6; S.bx.sp = [{ i: 1, id: ids[149], t: 0 }]; F.bxTap(1); await sl(200);
          o.g7 = S.bx.g; o.ess150 = S.ess - e0;
          const s2 = F.sanitize(JSON.parse(JSON.stringify(S))); o.sanG = s2.bx.g; o.useKeep = Object.keys(s2.use.n).length > 0;
          return o; }""")
        print(r, r2)
        c.ok(r['fresh'] == '{"d":{},"n":{}}', '새 학교는 빈 놀이 기록')
        c.ok(r['tabN'] == 1 and r['pzN'] == 2 and r['pzD'] == 1 and r['mg'] == 1, f'탭, 합치기, 퍼즐 기록, 같은 날은 날 하나 {r["keys"][:8]}')
        c.ok(r['keep'] == 7 and r['cap'] == 60 and r['clean'], f'날 7개, 열쇠 60개 한도, 이상한 글자는 지움 ({r["keep"]}, {r["cap"]})')
        c.ok(r['strOk'] and r['len'] <= 800 and r['doc'], f'테스트 현황 한 줄 모양과 800자, statsDoc에 들어감 ({r["len"]}자)')
        c.ok(r['sum'].startswith('지난 7일') and '숲속 합치기 2명 7일' in r['sum'] and '숲속 퍼즐 1명 1일' in r['sum'], f'관리자 모아 보기(테스트 도구 빼고) {r["sum"]}')
        c.ok(r['san'] == {'d': {'mg': [20001, 20002]}, 'n': {'mg': 3, 'pz': 0, 'tab_school': 10000000}} or (r['san']['n'].get('mg') == 3 and 'x y' not in r['san']['n'] and r['san']['d']['mg'] == [20001, 20002]), f'저장 읽기 바로잡기 {r["san"]}')
        c.ok(r['san0'] == '{"d":{},"n":{}}', '옛 저장은 빈 놀이 기록')
        c.ok(r['g6'] == 6 and r['gold'] >= 3 and r['ess120'] >= 60, f'120종: 황금 3과 정수 60 ({r["gold"]}, {r["ess120"]})')
        c.ok(r2['g7'] == 7 and r2['ess150'] >= 100 and r2['sanG'] == 7 and r2['useKeep'], f'150종: 정수 100, 단계 7이 저장 읽기에 남아요 {r2}')
        c.ok(not errs, f'오류 없음 {errs[:3]}')
        await ctx.close()
        # 토스 분석 로그
        ctx = await b.new_context(viewport={'width': 390, 'height': 800}, device_scale_factor=2, is_mobile=True, has_touch=True)
        await ctx.add_init_script("window.__FOREST_TEST = true;")
        await ctx.add_init_script("""window.__aitLog = []; window.AIT = { ads: false, testAd: true, adReady: () => false, preload: () => {}, showAd: d => d({ earned: false }), log: n => window.__aitLog.push(n),
          storage: { getItem: () => Promise.resolve(null), setItem: () => Promise.resolve() }, setScore: () => Promise.resolve(), openBoard: () => Promise.resolve(), close: () => Promise.resolve(), safeArea: () => null, subscribeSafe: () => () => {}, userKey: async () => '', serverTime: null };""")
        await ctx.add_init_script("if(!sessionStorage.getItem('seeded')){localStorage.setItem('forest-school-v1', %s);sessionStorage.setItem('seeded','1');}" % json.dumps(json.dumps(base(tier=1))))
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(2500)
        r3 = await pg.evaluate("async()=>{ const F = window.__forest; window.__aitLog.length = 0; F.setTab('teachers'); F.setTab('school'); F.useLog('pz'); return window.__aitLog.slice(); }")
        print('toss', r3)
        c.ok(r3 == ['tab_teachers', 'tab_school', 'pz'], f'토스 분석 로그 {r3}')
        c.ok(not errs, f'토스 판 오류 없음 {errs[:2]}')
        await ctx.close(); await b.close()
    c.done()
asyncio.run(main())
