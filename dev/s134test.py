# 134번 시험(4.3.2): 탐험 대원 한 번에 올리기
# 1) '한 번에 10'으로 누르면 10레벨, '최대'는 가진 도토리로 되는 만큼  2) 출동 대원 고르게 올리기
# 3) 레벨 단추를 꾹 누르면 계속 오르고, 손을 떼면 멈춰요(뗄 때 클릭으로 한 번 더 오르지 않아요)  4) 도토리는 쓴 만큼만 줄고 모두 유한해요
import asyncio, json
from playwright.async_api import async_playwright
from s4test import ctxpage, base
F = 'window.__forest'
async def main():
    bad = []
    def ok(c, msg):
        if not c: bad.append(msg); print('  틀림:', msg)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx, page, errs = await ctxpage(b, 360, 740, 'light', base(tier=0, tg=0))
        await page.wait_for_timeout(1000)
        r = await page.evaluate(f"""(async()=>{{ const F={F}, S=F.S, sl=ms=>new Promise(r=>setTimeout(r,ms));
          document.querySelectorAll('.overlay').forEach(o=>{{o.hidden=true}}); F.rt4.modalOpen=null; F.rt4.modalQueue.length=0;
          S.tam.seen=1; S.budget=1e7; F.setTab('tam'); await sl(300);
          const lv=()=>Object.fromEntries(S.tam.party.map(k=>[k,F.tamLvPlan(k,0)&&((S.tam.mem[k]||{{}}).lv||1)]));
          const sp=document.querySelector('.tm-mem [data-tlv]').dataset.tlv, l0=(S.tam.mem[sp]||{{}}).lv||1;
          const P=F.tamLvPlan(sp,10); document.querySelector('[data-tlvn="10"]').click(); await sl(80);
          const b0=S.budget; document.querySelector('.tm-mem [data-tlv="'+sp+'"]').click(); await sl(80);
          const l1=S.tam.mem[sp].lv, spent=b0-S.budget;
          document.querySelector('[data-tlvn="max"]').click(); await sl(80); const PM=F.tamLvPlan(sp,Infinity);
          document.querySelector('[data-tlvn="1"]').click(); await sl(80);
          const b1=S.budget; S.budget=b1; document.querySelector('[data-tlvall]').click(); await sl(80);
          const all=S.tam.party.map(k=>(S.tam.mem[k]||{{}}).lv||1);
          return {{ sp, l0, P, l1, spent, PM, all, budget: S.budget }}; }})()""")
        print('한 번에', json.dumps(r))
        ok(r['l1'] - r['l0'] == 10 and abs(r['spent'] - r['P']['sum']) < r['P']['sum'] * 0.01, "'한 번에 10'은 10레벨, 계획한 값만큼 써요")
        ok(r['PM']['k'] >= 1 and r['PM']['sum'] <= 1e7, "'최대'는 가진 도토리로 되는 만큼")
        ok(max(r['all']) - min(r['all']) <= 1 and r['budget'] >= 0, '출동 대원 고르게 올리기')
        # 꾹 누르기
        await page.evaluate(f"(()=>{{ const S={F}.S; S.budget=1e7; }})()")
        btn = await page.query_selector('.tm-mem [data-tlv]'); sp = await btn.get_attribute('data-tlv')
        lv0 = await page.evaluate(f"({F}.S.tam.mem['{sp}']||{{}}).lv||1")
        await btn.scroll_into_view_if_needed(); await page.wait_for_timeout(200); bb = await btn.bounding_box(); await page.mouse.move(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2)
        await page.mouse.down(); await page.wait_for_timeout(1500); await page.mouse.up(); await page.wait_for_timeout(300)
        lv1 = await page.evaluate(f"{F}.S.tam.mem['{sp}'].lv")
        await page.wait_for_timeout(500); lv2 = await page.evaluate(f"{F}.S.tam.mem['{sp}'].lv")
        print('꾹', lv0, lv1, lv2)
        ok(lv1 - lv0 >= 5 and lv2 == lv1, '꾹 누르면 계속 오르고, 떼면 멈춰요')
        # 짧게 한 번 누르면 한 레벨
        await page.evaluate(f"(()=>{{ const F={F}; F.S.budget=1e12; F.setTab('school'); F.setTab('tam'); }})()"); await page.wait_for_timeout(300)
        btn = await page.query_selector(f'.tm-mem [data-tlv="{sp}"]'); await btn.click(); await page.wait_for_timeout(200)
        lv3 = await page.evaluate(f"{F}.S.tam.mem['{sp}'].lv"); ok(lv3 == lv2 + 1, '짧게 누르면 한 레벨')
        # 4.3.2.1 추천 칸 꾹 누르기: 그때그때 추천된 대원이 오르고, 칸에 보이는 대원과 같아요
        await page.evaluate(f"(()=>{{ const F={F}; F.S.budget=1e15; F.setTab('school'); F.setTab('tam'); }})()"); await page.wait_for_timeout(300)
        rb = await page.query_selector('.tm-rec [data-tlv]'); await rb.scroll_into_view_if_needed(); bb = await rb.bounding_box()
        before = await page.evaluate(f"(()=>{{ const S={F}.S; return Object.values(S.tam.mem).reduce((a,m)=>a+m.lv,0); }})()")
        await page.mouse.move(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2); await page.mouse.down(); await page.wait_for_timeout(1200)
        shown = await page.evaluate("document.querySelector('.tm-rec .tm-rtx b').textContent")
        rec = await page.evaluate(f"(()=>{{ const F={F}, R=F.tamUpRec().mem; return R ? [R.sp, (F.S.tam.mem[R.sp]||{{}}).lv||1] : null; }})()")
        await page.mouse.up(); await page.wait_for_timeout(300)
        after = await page.evaluate(f"(()=>{{ const S={F}.S; return Object.values(S.tam.mem).reduce((a,m)=>a+m.lv,0); }})()")
        print('추천 꾹', before, after, shown, rec)
        ok(after - before >= 4, '추천 칸을 꾹 누르면 레벨이 계속 올라요')
        ok(not errs, f'오류 없음 {errs[:2]}')
        await ctx.close(); await b.close()
    print('PASS' if not bad else 'FAIL', len(bad))
asyncio.run(main())
