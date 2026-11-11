# s115: 저장 지킴 시험 (2026-11-11, 3.3.2 분석 M11, M12에서 나온 것)
# 1) 통계 열쇠: 게임 코드가 쓰는 S.st.<이름>이 모두 fresh().st에 있어요(없으면 다시 켤 때 0으로 돌아가요)
# 2) 통계 왕복: 모든 통계 칸에 값을 넣고 저장한 뒤 다시 켜도 그대로예요
# 3) 퀘스트 번호: 예전에 있던 메인 퀘스트 id(dev/quest_ids.txt)가 지금도 MAIN에 있거나, 옮긴 표(mainIndexFromSave)에 있어요
#    퀘스트를 지우거나 이름을 바꾸면 이 시험이 실패해요. 그때는 옮긴 표에 적고 아래 MOVED_OK에도 적어요.
#    새 퀘스트를 더했으면 `python3 s115test.py --snap`으로 목록을 다시 적어요.
import asyncio, json, re, sys, pathlib
from playwright.async_api import async_playwright
from s4test import URL
HERE = pathlib.Path(__file__).resolve().parent
MOVED_OK = {'e6', 'gd2'}   # mainIndexFromSave가 따로 받아 주는 옛 id
F = 'window.__forest'
async def main():
    bad = []
    src = (HERE / 'forest-school.html').read_text(encoding='utf-8')
    used = set(re.findall(r'S\.st\.([A-Za-z0-9_]+)\s*(?:=[^=]|\+\+|\+=)', src))
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844})
        await ctx.add_init_script("window.__FOREST_TEST = true;")
        pg = await ctx.new_page(); await pg.goto(URL)
        await pg.wait_for_function(f"{F} && {F}.S && {F}.S.st", timeout=60000); await pg.wait_for_timeout(1500)
        keys = set(await pg.evaluate(f"Object.keys({F}.S.st)"))
        miss = sorted(used - keys)
        if miss: bad.append(f'fresh().st에 없는 통계 칸: {miss}')
        ids = await pg.evaluate(f"{F}.MAIN.map(m => m.id)")
        snap = HERE / 'quest_ids.txt'
        if '--snap' in sys.argv:
            snap.write_text('\n'.join(ids) + '\n', encoding='utf-8'); print(f'quest_ids.txt에 {len(ids)}개 적음')
        old = [x for x in snap.read_text(encoding='utf-8').split('\n') if x]
        gone = [x for x in old if x not in set(ids) and x not in MOVED_OK]
        if gone: bad.append(f'사라진 메인 퀘스트 id {len(gone)}개(옮긴 표에 적어야 해요): {gone[:10]}')
        if len(set(ids)) != len(ids): bad.append('메인 퀘스트 id가 겹쳐요')
        # 통계 왕복
        await pg.evaluate(f"(() => {{ const F = {F}, S = F.S; let i = 0; for (const k in S.st) S.st[k] = 100 + (i++); F.save(); }})()")
        want = await pg.evaluate(f"JSON.parse(JSON.stringify({F}.S.st))")
        kept = await pg.evaluate("localStorage.getItem('forest-school-v1')")
        await ctx.add_init_script("localStorage.setItem('forest-school-v1', %s);" % json.dumps(kept))
        await pg.reload(); await pg.wait_for_function(f"{F} && {F}.S && {F}.S.st && {F}.S.st.ups >= 100", timeout=60000)
        got = await pg.evaluate(f"JSON.parse(JSON.stringify({F}.S.st))")
        lost = sorted(k for k in want if k != 'play' and k != 'sess' and got.get(k) != want[k])
        if lost: bad.append(f'다시 켜면 바뀌는 통계 칸: {[(k, want[k], got.get(k)) for k in lost]}')
        await b.close()
    for x in bad: print('FAIL', x)
    print('PASS' if not bad else f'FAIL ({len(bad)})'); sys.exit(1 if bad else 0)
asyncio.run(main())
