# 5.0.1.1 시험: 건물 앞에 선 학생을 누르면(휴대폰 크롬이 누름을 건물로 끌어가도) 학생 말풍선이 뜨고, 학생이 없는 자리는 건물 창이 열려요
# 쓰는 법: python3 wrap.py && python3 s154test.py   (마지막 줄이 PASS면 통과)
import asyncio, json
from playwright.async_api import async_playwright
from testlib import base, URL, Checker
c = Checker()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for tier, zone, bk in ((2,None,'store'),(4,'life','store'),(5,'life','store'),(5,'academic','classroom')):
            kw = dict(tier=tier, students=110)
            if zone: kw['zone']=zone
            ctx = await b.new_context(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True, device_scale_factor=3)
            await ctx.add_init_script("window.__FOREST_TEST = true; window.__FOREST_KIDTAP=true;")
            await ctx.add_init_script("if(!sessionStorage.getItem('seeded')){localStorage.setItem('forest-school-v1', %s);sessionStorage.setItem('seeded','1');}" % json.dumps(json.dumps(base(**kw))))
            pg = await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(2500)
            r = await pg.evaluate("""async(bk)=>{const F=window.__forest,R=F.rt4,sl=ms=>new Promise(r=>setTimeout(r,ms));
              const clean=()=>{if(F.closeSheet)F.closeSheet();document.querySelectorAll('.fr-bub').forEach(b=>b.remove());document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true});R.modalOpen=null;R.modalQueue.length=0;R.sheetKey=null;};
              clean(); const hit=document.querySelector('#b-'+bk+' .hit').getBoundingClientRect();
              const k=R.kids[0]; R.kids.forEach(q=>{q.speed=0;q.wait=1e9;q.route=[]});
              // 학생을 건물 한가운데에 세워요
              const m=document.querySelector('#map').getScreenCTM().inverse(); const pt=new DOMPoint(hit.x+hit.width/2,hit.y+hit.height/2).matrixTransform(m);
              k.x=k.tx=pt.x; k.y=k.ty=pt.y+8; await sl(700);
              const kr=k.g.getBoundingClientRect(), kx=kr.x+kr.width/2, ky=kr.y+kr.height/2;
              const map=document.querySelector('#map'), tap=(x,y,tgt)=>{map.dispatchEvent(new PointerEvent('pointerdown',{clientX:x,clientY:y,bubbles:true,pointerType:'touch'}));tgt.dispatchEvent(new MouseEvent('click',{clientX:hit.x+hit.width/2,clientY:hit.y+hit.height-4,bubbles:true}));};
              const out={};
              tap(kx,ky,document.querySelector('#b-'+bk+' .hit')); await sl(200); out.onKid={sheet:R.sheetKey||null,bub:!!document.querySelector('.fr-bub')}; clean(); await sl(200);
              tap(hit.x+4,hit.y+4,document.querySelector('#b-'+bk+' .hit')); await sl(200); out.offKid={sheet:R.sheetKey||null,bub:!!document.querySelector('.fr-bub')}; clean();
              return out;}""", bk)
            print(tier, zone, r)
            c.ok(r['onKid'] == {'sheet': None, 'bub': True}, f'{tier} {zone} 학생을 눌렀는데 {r["onKid"]}')
            c.ok(r['offKid'] == {'sheet': bk, 'bub': False}, f'{tier} {zone} 건물을 눌렀는데 {r["offKid"]}')
            c.ok(not errs, f'오류 {errs[:2]}'); await ctx.close()
asyncio.run(main())
c.done()
