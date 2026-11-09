import asyncio, sys, json
sys.path.insert(0,'/home/claude/work/forest-school/dev')
from playwright.async_api import async_playwright
from s4test import URL
F='window.__forest'
SKIP = f"(()=>{{ const t=document.querySelector('#tut'); if(t) t.hidden=true; {F}.S.tut.st='skip'; {F}.rt.tut=null; document.querySelectorAll('.overlay').forEach(o=>{{o.hidden=true;o.classList.remove('open')}}); {F}.rt.modalOpen=null; }})()"
async def main():
    res={}
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for w,h in ((390,844),(360,780)):
            ctx=await b.new_context(viewport={'width':w,'height':h},device_scale_factor=1,is_mobile=True,has_touch=True)
            await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
            pg=await ctx.new_page(); await pg.goto(URL); await pg.wait_for_timeout(2500); await pg.evaluate(SKIP)
            for tier in (1,2,3):
                r=await pg.evaluate(f"""(async()=>{{const F={F},S=F.S;S.tier={tier};S.tg=0;S.sem=0;for(const k of F.facKeys())S.f[k]=Math.max(S.f[k]||0,8);S.bd={{}};
                  const keep=F.BX_SPOT[{tier}].slice(); const ok=[];
                  const cands=[];for(let x=10;x<=90;x+=3)for(let y=18;y<=84;y+=2)cands.push([x,y]);
                  S.bx.m={tier}; S.bx.next=Date.now()+9e9; F.setTab('school'); F.renderMap();
                  const sc=document.querySelector('#scroller');
                  const K=Math.ceil(cands.length/6);for(let ci=0;ci<K;ci++){{
                    const grp=[0,1,2,3,4,5].map(j=>cands[ci+j*K]).filter(Boolean); grp.forEach((c,i)=>F.BX_SPOT[{tier}][i]=[c[0],c[1],0]);
                    S.bx.sp=grp.map((_,i)=>({{i,id:'bio_ladybug',t:0}})); F.renderDeco(true); await new Promise(r=>setTimeout(r,250));
                    if(sc) sc.scrollTop=0; const hud=document.querySelector('.board').getBoundingClientRect().bottom;
                    const hits=[...document.querySelectorAll('.bld .hit, #b-next .hit')].map(e=>e.getBoundingClientRect());
                    for(let i=0;i<grp.length;i++){{const el=document.querySelector('.bx-hit[data-bx="'+i+'"]'); if(!el) continue;
                      const r0=el.getBoundingClientRect(); const ov=hits.some(hr=>!(r0.right<hr.left-4||r0.left>hr.right+4||r0.bottom<hr.top-4||r0.top>hr.bottom+4));
                      el.scrollIntoView({{block:'center'}}); const rc=el.getBoundingClientRect(); let n=0;
                      for(const [fx,fy] of [[.5,.5],[.25,.3],[.75,.3],[.25,.75],[.75,.75]]){{const e=document.elementFromPoint(rc.left+rc.width*fx,rc.top+rc.height*fy); if(e===el) n++;}}
                                            if(sc) sc.scrollTop=0; const top=el.getBoundingClientRect().top;
                      if(n===5&&top>hud+4&&!ov) ok.push(grp[i]); }}
                  }}
                  keep.forEach((v,i)=>F.BX_SPOT[{tier}][i]=v); S.bx.sp=[]; F.renderDeco(true); return ok;}})()""")
                key=str(tier); s=set(map(tuple,r)); res[key]=s if key not in res else res[key]&s
                print(w,tier,len(r),flush=True)
        await b.close()
    json.dump({k:sorted(v) for k,v in res.items()},open('/home/claude/gen/fit2/bxok.json','w'))
asyncio.run(main())
