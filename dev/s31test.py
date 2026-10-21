# 31번 묶음 시험: 로딩 화면 3초, 학생 느낌표 말 걸기, 시설 안 가구
import asyncio, json
from playwright.async_api import async_playwright
from s4test import URL

async def run(b, dark, w):
    r = {}
    ctx = await b.new_context(viewport={'width': w, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme='dark' if dark else 'light')
    await ctx.add_init_script("window.__FOREST_TEST = true; window.__FOREST_BOOT = true; if (!sessionStorage.getItem('s31')) { localStorage.clear(); sessionStorage.setItem('s31', '1'); }")
    pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    tag = f"{'d' if dark else 'l'}{w}"
    await pg.goto(URL)
    await pg.wait_for_timeout(1800)
    r['boot_at_1.8s'] = await pg.evaluate("!!document.getElementById('boot')")
    if not dark and w == 390: await pg.screenshot(path='s31_boot.png')
    await pg.wait_for_timeout(2400)
    r['boot_gone_4.2s'] = not await pg.evaluate("!!document.getElementById('boot')")
    # 튜토리얼이 떴으면 닫아요
    await pg.evaluate("const t=document.querySelector('#tut'); if(t && !t.hidden){ window.__forest.S.tut.st='skip'; t.hidden=true; window.__forest.rt.modalOpen=null; }")
    F = "window.__forest"
    # 새 학교: 교실 Lv.1, 가구 0. 가구 없이 건물은 못 올려요
    r['fresh_fu'] = await pg.evaluate(f"[{F}.S.fu.classroom, {F}.furReady('classroom')]")
    await pg.evaluate(f"{F}.S.budget = 1e4")
    r['buy_blocked'] = await pg.evaluate(f"{F}.buyFacility('classroom')")
    await pg.evaluate("document.querySelector('#b-classroom').dispatchEvent(new MouseEvent('click',{bubbles:true}))"); await pg.wait_for_timeout(450)
    r['sheet'] = await pg.evaluate("[!document.querySelector('#furBox').hidden, document.querySelectorAll('#furScene .fur-it').length, document.querySelector('#sheetNeed').textContent, document.querySelector('#sheetBuy').getAttribute('aria-disabled')]")
    await pg.screenshot(path=f's31_room0_{tag}.png')
    # 그림 속 책상을 눌러서 하나 올리고, 한 번에 올리기로 나머지
    await pg.evaluate("document.querySelector('#furScene [data-fur=\"0\"]').dispatchEvent(new MouseEvent('click',{bubbles:true}))"); await pg.wait_for_timeout(200)
    r['after_desk'] = await pg.evaluate(f"{F}.S.fu.classroom.join(',')")
    await pg.tap('#furAll'); await pg.wait_for_timeout(300)
    r['after_all'] = await pg.evaluate(f"[{F}.S.fu.classroom.join(','), {F}.furReady('classroom'), document.querySelector('#sheetBuy').getAttribute('aria-disabled'), document.querySelector('#toast').textContent]")
    await pg.tap("#sheetBuy"); await pg.wait_for_timeout(900)
    r['lv2'] = await pg.evaluate(f"[{F}.S.f.classroom, {F}.furReady('classroom'), document.querySelector('#sheetSub').textContent]")
    # 단계별 모습: 1, 5, 10, 15
    await pg.evaluate("if (document.querySelector('#sheetWrap').hidden) document.querySelector('#b-classroom').dispatchEvent(new MouseEvent('click',{bubbles:true}))"); await pg.wait_for_timeout(400)
    for lv in (4, 9, 14, 19):
        await pg.evaluate(f"{F}.S.f.classroom = {lv+1}; {F}.S.fu.classroom = [{lv},{lv+1},{lv},{lv+1}]; {F}.rt.furKey=''")
        await pg.wait_for_timeout(350)
        await pg.screenshot(path=f's31_room{lv+1}_{tag}.png')
    # 다른 시설 방
    for k in ('cafeteria', 'library', 'playground', 'science'):
        await pg.evaluate(f"{F}.S.tier = 1; {F}.S.f.{k} = 12; {F}.S.fu.{k} = [1,6,11,16]; document.querySelector('[data-close-sheet]').click()")
        await pg.wait_for_timeout(300)
        await pg.evaluate(f"document.querySelector('#b-{k}').dispatchEvent(new MouseEvent('click',{{bubbles:true}}))"); await pg.wait_for_timeout(450)
        await pg.screenshot(path=f's31_{k}_{tag}.png')
    await pg.evaluate("document.querySelector('[data-close-sheet]').click()"); await pg.wait_for_timeout(300)
    # 학생 말 걸기
    await pg.evaluate(f"{F}.S.tier = 0; {F}.S.students = 10; {F}.startTalk({F}.rt.kids[0])"); await pg.wait_for_timeout(300)
    r['talk_mark'] = await pg.evaluate("!!document.querySelector('#fx .talk')")
    if not dark and w == 390: await pg.screenshot(path='s31_talk_mark.png')
    b0 = await pg.evaluate(f"{F}.S.budget")
    await pg.evaluate("document.querySelector('#fx .talk').dispatchEvent(new MouseEvent('click',{bubbles:true}))"); await pg.wait_for_timeout(350)
    r['talk'] = await pg.evaluate(f"[!document.querySelector('#fx .talk'), !!document.querySelector('#fx .bubble'), document.querySelector('#fx .bubble text') && document.querySelector('#fx .bubble text').textContent, {F}.S.budget > {b0}]")
    await pg.screenshot(path=f's31_talk_{tag}.png')
    await pg.wait_for_timeout(3600)
    r['bubble_gone'] = await pg.evaluate("!document.querySelector('#fx .bubble')")
    # 옛 저장(가구 없음)은 건물 레벨까지 채워져요
    r['migrate'] = await pg.evaluate("""(() => { const d = JSON.parse(JSON.stringify(window.__forest.S)); delete d.fu; d.f.cafeteria = 7; window.__forest.rt.adopting = true; localStorage.setItem('forest-school-v1', JSON.stringify(d)); return true; })()""")
    await pg.reload(); await pg.wait_for_timeout(3800)
    r['migrated'] = await pg.evaluate(f"[{F}.S.f.cafeteria, {F}.S.fu.cafeteria.join(','), {F}.furReady('cafeteria')]")
    r['errors'] = errs
    await ctx.close()
    return r

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); out = {}
        for dark in (False, True):
            for w in (390, 360):
                out[f"{'dark' if dark else 'light'}{w}"] = await run(b, dark, w)
        await b.close(); print(json.dumps(out, ensure_ascii=False, indent=1))
asyncio.run(main())
