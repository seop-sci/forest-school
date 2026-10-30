# 2.1.3 시험: 랭킹 시즌과 다른 학교 구경, 예시 학교
# 보는 것
#  1) 시즌 번호(2026-12부터 계절마다), 리그 점수가 시즌 점수로도 모여요, 시즌이 끝나면 300점 이상이면 기념 장식, 1~3위면 칭호, 넷 다 모으면 '사계절 교장'
#  2) 랭킹 '시즌' 보기(공유 저장소 흉내): 올린 문서에 sk, sp, 이번 시즌 줄만 보여요
#  3) 내 학교 보여 주기: 처음 꺼짐, 켜면 look에 올라가고 끄면 지워요. 순위 줄을 누르면 그 학교를 구경(보기만), 보여 주지 않는 학교는 알림
#  4) 남이 올린 학교 모습은 모양을 확인해서 읽어요(이상한 장식, 이름, 친구는 빼요)
#  5) 예시 학교: 이름과 띠에 '예시', 장식 11곳, 돌아가기. 화면 넘침 없음, 페이지 오류 없음
# 쓰는 법: python3 wrap.py && python3 s90test.py   (마지막 줄이 PASS면 통과)
import asyncio, json
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'
CLEAN = "document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
SKIP = f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; {CLEAN}; }})()"
DAY = lambda d: f"Date.parse('{d}T03:00:00Z')"
# 공유 저장소 흉내(Claude 화면 게임의 window.claude.use('db'))
MOCK = r"""
window.__FOREST_TEST = true; localStorage.clear();
(() => {
  const store = { rank: {}, look: {} }, subs = [];
  const fire = () => subs.forEach(s => s());
  const coll = name => ({
    orderBy: (f, dir) => ({ limit: n => ({ onSnapshot: (ok) => { const run = () => ok({ docs: Object.entries(store[name]).sort((a, b) => (b[1][f] || 0) - (a[1][f] || 0)).slice(0, n).map(([id, v]) => ({ id, data: () => v })) }); subs.push(run); setTimeout(run, 0); return () => {}; } }) }),
    doc: id => ({ set: v => { store[name][id] = JSON.parse(JSON.stringify(v)); setTimeout(fire, 0); return Promise.resolve(); }, delete: () => { delete store[name][id]; setTimeout(fire, 0); return Promise.resolve(); },
      get: () => Promise.resolve(store[name][id] ? { exists: true, data: () => store[name][id] } : { exists: false, data: () => null }) })
  });
  window.__store = store;
  window.claude = { use: async k => k === 'db' ? { collection: coll } : { id: async () => 'me', can: async () => true } };
})();
"""

async def main():
    bad = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, scheme in ((390, 'light'), (360, 'dark')):
            ctx = await b.new_context(viewport={'width': w, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme=scheme)
            await ctx.add_init_script(MOCK)
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(2500); await pg.evaluate(SKIP)
            # 1) 시즌
            r = await pg.evaluate(f"""(() => {{ const F = {F}, S = F.S; const n = d => F.rsNum(d);
              const ns = [n('2026-11-30'), n('2026-12-01'), n('2027-02-28'), n('2027-03-01'), n('2027-06-01'), n('2027-09-30'), n('2027-12-01')];
              F.rt.fakeNow = {DAY('2026-12-05')}; S.clk = {{ last: 0 }}; F.rsSync(); const n0 = S.rs.n;
              const p0 = S.rs.p; F.addLeague && 0; S.lg.week = -9; S.lg.pts = 0; window.__forest.rsAdd(120); const p1 = S.rs.p;
              S.rs.p = 350; S.rs.pos = 2; F.rt.fakeNow = {DAY('2027-03-02')}; S.clk = {{ last: 0 }}; F.rsSync(); {CLEAN};
              const deco = !!S.deco.own.rs_winter, king = S.rs.king, n1 = S.rs.n, p2 = S.rs.p;
              S.deco.own.rs_spring = 1; S.deco.own.rs_summer = 1; S.deco.own.rs_autumn = 1; const t = F.achTitles().map(x => x.id);
              return {{ ns, n0, p1: p1 - p0, deco, king, n1, p2, king2: t.includes('seasonking'), four: t.includes('fourseason'), lab: F.rsLabel(1) }}; }})()""")
            print('시즌', json.dumps(r, ensure_ascii=False))
            if r['ns'] != [0, 1, 1, 2, 3, 4, 5] or r['n0'] != 1 or r['p1'] != 120 or not r['deco'] or r['king'] != 1 or r['n1'] != 2 or r['p2'] != 0 or not r['king2'] or not r['four'] or '겨울' not in r['lab']: bad.append(f'{w}: 시즌 {r}')
            # 2) 랭킹 참가, 시즌 보기
            await pg.evaluate(f"(() => {{ const F = {F}, S = F.S; S.rank.asked = true; S.rs.p = 80; F.setTab('rank'); }})()")
            await pg.wait_for_timeout(800)
            await pg.evaluate(f"{F}.joinRank && 0")
            ok = await pg.evaluate(f"(async () => {{ const F = {F}; F.setTab('rank'); await new Promise(r => setTimeout(r, 400)); return document.querySelector('#rankName') ? true : false; }})()")
            await pg.evaluate("(async () => { const i = document.querySelector('#rankName'); if (i) { i.value = '졸린 다람쥐'; i.closest('form').requestSubmit(); } })()")
            await pg.wait_for_timeout(1500)
            r = await pg.evaluate("(() => { const d = window.__store.rank.me || {}; return { sk: d.sk, sp: d.sp, look: !!window.__store.look.me, toggle: !!document.querySelector('#lookOn'), checked: document.querySelector('#lookOn') && document.querySelector('#lookOn').checked }; })()")
            print('올리기', r)
            if r['sk'] != 2 or r['sp'] != 80 or r['look'] or not r['toggle'] or r['checked']: bad.append(f'{w}: 랭킹 시즌 올리기 {r}')
            await pg.click('#rankView [data-rv=sea]'); await pg.wait_for_timeout(500)
            r = await pg.evaluate("(() => ({ rows: document.querySelectorAll('#rankList li').length, lab: document.querySelector('#rankScoreLab').textContent, sc: document.querySelector('#rankScore').textContent, look: document.querySelectorAll('#rankList li[data-look]').length }))()")
            if r['rows'] != 1 or r['lab'] != '이번 시즌 점수' or r['sc'] != '80' or r['look'] != 1: bad.append(f'{w}: 시즌 보기 {r}')
            await pg.screenshot(path=f's90_rank_{w}.png')
            # 3) 보여 주기 켜고 끄기
            await pg.click('#lookOn'); await pg.wait_for_timeout(600)
            r1 = await pg.evaluate(f"(() => {{ const v = window.__store.look.me; return {{ on: {F}.S.lk.on, has: !!v, len: v ? v.d.length : 0, read: v ? !!{F}.lookRead(v.d) : false }}; }})()")
            await pg.click('#lookOn'); await pg.wait_for_timeout(600)
            r2 = await pg.evaluate(f"({{ on: {F}.S.lk.on, has: !!window.__store.look.me }})")
            print('보여 주기', r1, r2)
            if not r1['on'] or not r1['has'] or r1['len'] > 4000 or not r1['read'] or r2['on'] or r2['has']: bad.append(f'{w}: 보여 주기 {r1} {r2}')
            # 남의 학교: 하나는 보여 주고 하나는 안 보여 줘요
            r = await pg.evaluate(f"""(async () => {{ const F = {F}, st = window.__store;
              st.rank.other = {{ name: '수줍은 판다', score: 5, at: Date.now(), sk: 2, sp: 50, tier: 1, year: 2 }};
              st.rank.hide = {{ name: '느긋한 곰', score: 4, at: Date.now(), sk: 2, sp: 40, tier: 1, year: 1 }};
              st.look.other = {{ d: JSON.stringify({{ t: 1, y: 2, nm: '<b>새싹', mk: [0, 1, 2, 3], f: {{ classroom: 9, library: 3 }}, bs: {{ classroom: 1 }}, lay: ['fountain', 'evil', 'bench'], st: 77, rare: ['fox', 'zz'], kids: ['fox_rare', 'x<y'], ti: 'hack' }}), at: Date.now() }};
              const rd = F.lookRead(st.look.other.d);
              await F.openLook('hide', '느긋한 곰'); const hid = document.querySelector('#tierView').hidden;
              await F.openLook('other', '수줍은 판다'); await new Promise(r => setTimeout(r, 300));
              return {{ rd: [rd.nm, rd.lay.slice(0, 3), rd.rare, rd.kids, rd.ti], hid, open: !document.querySelector('#tierView').hidden, title: document.querySelector('#tvTitle').textContent, edit: document.querySelector('#tvEdit').hidden,
                imgs: document.querySelectorAll('#tvMap image').length, mark: !!document.querySelector('#tvMark .smark') }}; }})()""")
            print('구경', json.dumps(r, ensure_ascii=False))
            if r['rd'] != ['b새싹', ['fountain', '', 'bench'], ['fox'], ['fox_rare'], ''] or not r['hid'] or not r['open'] or '수줍은 판다 교장 선생님' not in r['title'] or not r['edit'] or r['imgs'] < 6 or not r['mark']: bad.append(f'{w}: 구경 {r}')
            await pg.screenshot(path=f's90_look_{w}.png')
            await pg.click('#tvBack'); await pg.wait_for_timeout(300)
            # 5) 예시 학교
            r = await pg.evaluate(f"""(async () => {{ const F = {F}; F.setTab('rank'); await new Promise(r => setTimeout(r, 300)); document.querySelector('[data-look=model]').click(); await new Promise(r => setTimeout(r, 500));
              return {{ tab: F.rt.tab, title: document.querySelector('#tvTitle').textContent, sub: document.querySelector('#tvSub').textContent, deco: F.MODEL_SCHOOL.lay.filter(id => id).length, imgs: document.querySelectorAll('#tvMap image').length, look: F.rt.lookData && F.rt.lookData.model }}; }})()""")
            print('예시', json.dumps(r, ensure_ascii=False))
            if r['tab'] != 'school' or '[예시]' not in r['title'] or '예시로 꾸민 학교' not in r['sub'] or r['deco'] != 11 or r['imgs'] < 20 or not r['look']: bad.append(f'{w}: 예시 학교 {r}')
            await pg.wait_for_timeout(500); await pg.screenshot(path=f's90_model_{w}.png')
            o = await pg.evaluate("""(() => { const W = innerWidth; return [...document.querySelectorAll('#tierView .tv-bar *')].filter(e => { const q = e.getBoundingClientRect(); return q.width && e.offsetParent !== null && (q.right > W + 1 || q.left < -1); }).length; })()""")
            if o: bad.append(f'{w}: 구경 띠가 {o}곳 넘쳐요')
            await pg.click('#tvBack'); await pg.wait_for_timeout(200)
            if await pg.evaluate(f"!!{F}.rt.lookData"): bad.append(f'{w}: 돌아가기 뒤에도 구경 중')
            bad += [f'{w}: 페이지 오류 {e}' for e in errs]
            await ctx.close()
        await b.close()
    if bad:
        print('FAIL'); [print(' -', x) for x in bad]
    else: print('PASS')
asyncio.run(main())
