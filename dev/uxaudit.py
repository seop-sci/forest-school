# 화면 점검(UI/UX): 여러 화면을 열어 캡처하고, 화면 밖으로 나간 것, 글 잘림, 작은 단추(32px 아래), 겹친 단추를 찾아요
# 쓰는 법: cd dev && python3 wrap.py && python3 uxaudit.py [저장 폴더] [학교급]
# 캡처는 폴더/<너비>_<화면>.png, 찾은 것은 폴더/report.txt
import asyncio, sys, os, json
from playwright.async_api import async_playwright
from testlib import base, ctxpage, CLEAN, F
OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/uxaudit'
TIER = int(sys.argv[2]) if len(sys.argv) > 2 else 1
os.makedirs(OUT, exist_ok=True)
AUDIT = r"""() => {
  const W = innerWidth, H = innerHeight, vis = el => { if (!el.isConnected) return false; const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0) return false; return !el.closest('[hidden]'); };
  const name = el => (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '') + ' ' + (el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 24);
  const top = el => { const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2; if (x < 0 || y < 0 || x > W || y > H) return true; const t = document.elementFromPoint(x, y); return !t || el.contains(t) || t.contains(el); };
  const out = { off: [], clip: [], small: [], cover: [] };
  for (const el of document.querySelectorAll('body *')) {
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    if (cs.position !== 'fixed' && (r.right > W + 2 || r.left < -2) && r.width < W * 1.5 && !el.closest('.tx-mapw,.tm-stage,[class*="scroll"],.map,#map,svg')) { if (el.children.length === 0 || /BUTTON|IMG/.test(el.tagName)) out.off.push(name(el) + ` ${Math.round(r.left)}~${Math.round(r.right)}`); }
    if (/BUTTON|B|SPAN|SMALL|EM|P|H3|H4|LABEL|STRONG/.test(el.tagName) && el.children.length === 0 && el.textContent.trim() && cs.overflow !== 'visible' && cs.textOverflow !== 'ellipsis' && (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 4) && cs.whiteSpace !== 'normal') out.clip.push(name(el));
    if ((el.tagName === 'BUTTON' || el.getAttribute('role') === 'button' || el.tagName === 'A' || el.tagName === 'SUMMARY') && (r.width < 32 || r.height < 32) && top(el) && r.top >= 0 && r.bottom <= H) out.small.push(name(el) + ` ${Math.round(r.width)}x${Math.round(r.height)}`);
    if (el.tagName === 'BUTTON' && r.top >= 0 && r.bottom <= H && r.left >= 0 && r.right <= W && !top(el)) { const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); if (t && !t.closest('.toast,#toast,.tm-msg,.tx-msg,[role="status"]')) out.cover.push(name(el) + ' <- ' + name(t)); }
  }
  for (const k of Object.keys(out)) out[k] = [...new Set(out[k])].slice(0, 25);
  return out;
}"""
SCREENS = [
  ('home', "F.setTab('school')"),
  ('quests', "F.setTab('quests')"),
  ('quests_subs', "F.setTab('quests'); document.querySelector('[data-q-view=\"subs\"]')?.click()"),
  ('quests_mis', "F.setTab('quests'); document.querySelector('[data-q-view=\"missions\"],[data-q-view=\"mis\"]')?.click()"),
  ('teachers', "F.setTab('teachers')"),
  ('study', "F.setTab('grad')"),
  ('street', "F.setTab('street')"),
  ('shop', "F.setTab('shop')"),
  ('event', "F.setTab('event')"),
  ('pass', "F.setTab('event'); document.querySelector('[data-evseg=\"ps\"]')?.click()"),
  ('dex', "F.setTab('dex')"),
  ('rank', "F.setTab('rank')"),
  ('settings', "F.setTab('settings')"),
  ('mini', "F.setTab('mini')"),
  ('tam', "F.setTab('tam')"),
  ('tam_mem', "F.setTab('tam'); document.querySelector('#tmNav [data-tnav=\"mem\"]')?.click()"),
  ('tam_gear', "F.setTab('tam'); document.querySelector('#tmNav [data-tnav=\"gear\"]')?.click()"),
  ('tam_map', "F.setTab('tam'); document.querySelector('#tmMapOpen')?.click()"),
  ('tam_exp', "F.setTab('tam'); document.querySelector('#tmNav [data-tnav=\"exp\"]')?.click()"),
  ('trip', "F.setTab('school'); F.openTrip()"),
  ('sheet_class', "F.setTab('school'); F.openSheet('classroom')"),
  ('sheet_lib', "F.setTab('school'); F.openSheet('library')"),
  ('notice', "F.setTab('school'); F.openNotice ? F.openNotice() : document.querySelector('[data-notice],#noticeBtn')?.click()"),
]
async def main():
    rep = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, sch in ((360, 'dark'), (390, 'light')):
            sv = base(tier=TIER, tg=2, students=60)
            ctx, pg, errs = await ctxpage(b, w, 780, sch, sv)
            await pg.wait_for_timeout(1500)
            await pg.evaluate(f"()=>{{ const F={F}, S=F.S; S.tam.best = Math.max(S.tam.best||0, 40); S.tam.seen = 1; }}")
            for nm, js in SCREENS:
                await pg.evaluate(CLEAN)
                try:
                    await pg.evaluate(f"()=>{{ const F={F}; {js}; }}")
                except Exception as e:
                    rep.append(f'{w} {nm} 열기 실패 {str(e)[:120]}'); continue
                await pg.wait_for_timeout(900)
                await pg.screenshot(path=f'{OUT}/{w}_{nm}.png')
                r = await pg.evaluate(AUDIT)
                for k, v in r.items():
                    for x in v: rep.append(f'{w} {sch} {nm} {k}: {x}')
                await pg.evaluate(f"()=>{{ const F={F}; const t=document.querySelector('#txFull'); if (t) t.hidden = true; }}")
            if errs: rep.append(f'{w} 페이지 오류 {errs[:3]}')
            await ctx.close()
        await b.close()
    open(f'{OUT}/report.txt', 'w').write('\n'.join(rep))
    print(len(rep), '건, 보고서', f'{OUT}/report.txt')
asyncio.run(main())
