# 1.5.1 시험: 학생이 건물, 공사 자리, 분수 위로 걷지 않고 길로만 다니는지
# 쓰는 법: python3 wrap.py && python3 s41test.py   (마지막 줄이 PASS면 통과)
import asyncio, sys
from playwright.async_api import async_playwright
from s4test import URL
F = 'window.__forest'

INSIDE = "((b,x,y)=>b[4]?((2*x-b[0]-b[2])/(b[2]-b[0]))**2+((2*y-b[1]-b[3])/(b[3]-b[1]))**2<1:x>b[0]&&x<b[2]&&y>b[1]&&y<b[3])"

async def main():
    fails = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 390, 'height': 844})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
        await pg.goto(URL); await pg.wait_for_timeout(3800)
        await pg.evaluate("document.querySelectorAll('.overlay').forEach(o=>o.hidden=true); const t=document.querySelector('#tut'); if(t) t.hidden=true;")
        for tier, name in ((0, '유치원'), (1, '초등학교'), (2, '중학교')):   # 2.0.0 중학교 지도도
            info = await pg.evaluate(f"""(()=>{{ const F={F}; F.S.tier={tier}; F.S.students=0; F.syncKids(true); F.rt.mapLaid=-1; F.layoutMap(); F.renderMap();
              const nav=F.navInfo(), IN={INSIDE};
              const bad=nav.N.map((s,i)=>nav.blocks.some(b=>IN(b,s[0],s[1]))?i:-1).filter(i=>i>=0);
              const seen=new Set([0]), q=[0]; while(q.length){{ const u=q.shift(); for(const [v] of nav.adj[u]) if(!seen.has(v)){{ seen.add(v); q.push(v); }} }}
              return {{bad, n:nav.N.length, reach:seen.size}}; }})()""")
            if info['bad']: fails.append(f'[{name}] 건물 안에 있는 걷는 자리 {info["bad"]}')
            if info['reach'] != info['n']: fails.append(f'[{name}] 이어지지 않은 걷는 자리 ({info["reach"]}/{info["n"]})')
            # 학생을 많이 두고 걷게 해서, 걷는 동안 막힌 곳에 들어가는지 봐요
            await pg.evaluate(f"(()=>{{ const F={F}; F.S.students=40; F.syncKids(true); F.rt.kids.forEach(k=>k.wait=0); window.__bad=[]; window.__steps=0; }})()")
            await pg.evaluate(f"""(()=>{{ const F={F}, IN={INSIDE};
              window.__iv=setInterval(()=>{{ const nav=F.navInfo(); window.__steps++;
                for(const k of F.rt.kids){{ if(k.ang!==undefined||k.board||k.hold) continue;
                  nav.blocks.forEach((b,i)=>{{ if(IN(b,k.x,k.y)) window.__bad.push([i,Math.round(k.x),Math.round(k.y)]); }}); }} }},50); }})()""")
            await pg.wait_for_timeout(12000)
            # 새 친구가 교문에서 들어와요
            await pg.evaluate(f"(()=>{{ const F={F}; F.S.students=46; F.syncKids(false); }})()")
            await pg.wait_for_timeout(6000)
            res = await pg.evaluate("(()=>{ clearInterval(window.__iv); return [window.__bad.slice(0,8), window.__bad.length, window.__steps]; })()")
            moved = await pg.evaluate(f"{F}.rt.kids.filter(k=>k.moving||k.wait>0).length")
            if res[1]: fails.append(f'[{name}] 학생이 막힌 곳에 들어갔어요 {res[1]}번 {res[0]}')
            if res[2] < 100: fails.append(f'[{name}] 확인 횟수가 너무 적어요 {res[2]}')
            if moved == 0: fails.append(f'[{name}] 학생이 움직이지 않아요')
            await pg.locator('#map').screenshot(path=f's41_map_{tier}.png')
        # 길 찾기: 초등학교 교실 앞에서 운동장 앞으로 가는 길이 건물을 피해 가요
        r = await pg.evaluate(f"{F}.navRoute(122, 200, 240, 186)")
        if r is None: fails.append('교실 앞에서 급식실 쪽으로 갈 길이 없어요')
        if errs: fails.append(f'페이지 오류 {errs[:3]}')
        await b.close()
    for f in fails: print('FAIL', f)
    print('PASS' if not fails else f'FAIL ({len(fails)})')
    sys.exit(1 if fails else 0)

asyncio.run(main())
