# sanitize() 견줌 시험(s148)의 표본과 기준을 만들어요 (5.0.2 개발 기반 정리).
#   python3 dev/golden_make.py saves    저장 표본을 새로 만들어요(dev/golden/saves.json.gz). 봇이 유치원부터 대학원까지 가며 졸업식마다 찍어요. 3분쯤
#   python3 dev/golden_make.py golden   지금 원본의 sanitize() 결과를 기준으로 적어요(dev/golden/sanitize.json.gz)
# 기준을 다시 적는 때: 저장 읽기를 일부러 바꾼 버전(새 저장 칸, 옛 저장 바로잡기)을 낼 때만. 되풀이를 묶는 일처럼 동작이 그대로여야 하는 일에서는 다시 적지 않아요.
import asyncio, gzip, json, pathlib, random, sys, time
from playwright.async_api import async_playwright
HERE = pathlib.Path(__file__).resolve().parent
G = HERE / 'golden'; SAVES = G / 'saves.json.gz'; GOLD = G / 'sanitize.json.gz'
URL = (HERE / 'test.html').resolve().as_uri()
NOW = 1794888000000   # 멈춘 시계: 2026-11-17 12:00 (한국 시간). 날짜가 바뀌어도 결과가 같게
# 시계와 무작위를 멈춰요. sanitize()는 Date.now()와 무작위 코드(pid)를 써요
FREEZE = """(() => { const N = %d, D = Date; let seed = 12345;
  class FD extends D { constructor(...a) { if (a.length) super(...a); else super(N); } static now() { return N; } }
  window.Date = FD; window.__seed = v => { seed = v; };
  Math.random = () => { seed = (seed * 1664525 + 1013904223) %% 4294967296; return seed / 4294967296; }; 
  try { crypto.getRandomValues = arr => { for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 4294967296); return arr; }; } catch (e) {}
  window.__FOREST_TEST = true; localStorage.clear(); })()""" % NOW
OLD_TOP = ['v', 'budget', 'students', 'f', 't', 'grade', 'best', 'sound', 'vibrate', 'savedAt', 'pending', 'pendingSec', 'certNo', 'earned', 'yearEarned', 'st', 'p', 'att', 'ad', 'u', 'tier', 'tg', 'tdip', 'fund', 'fp', 'q', 'rank']

def load(p): return json.loads(gzip.decompress(p.read_bytes()).decode('utf-8'))
def dump(p, o): p.write_bytes(gzip.compress(json.dumps(o, ensure_ascii=False, separators=(',', ':')).encode('utf-8'), 9, mtime=0))

def hand():
    b = {'v': 4, 'budget': 1e6, 'students': 60, 'f': {'classroom': 14, 'cafeteria': 12, 'library': 11, 'playground': 8}, 't': {'squirrel': 5, 'owl': 5, 'bear': 5}, 'grade': 4, 'best': 4,
         'savedAt': NOW - 3600000, 'pending': 0, 'pendingSec': 0, 'certNo': 5, 'earned': 9e7, 'yearEarned': 3e6, 'st': {'picks': 40, 'ups': 90, 'trains': 20, 'claims': 3, 'grads': 0, 'perks': 0},
         'p': {'dip': 0, 'species': 0, 'perk': {'schol': 0, 'rep': 0, 'start': 0, 'drop': 0, 'night': 0}}, 'att': {'last': '2026-11-16', 'n': 2}, 'ad': {'day': '', 'n': 0}, 'u': {'boost': True},
         'tier': 0, 'tg': 0, 'tdip': 0, 'fund': 0, 'fp': {'schol': 0, 'rep': 0, 'dip': 0}, 'q': {'init': True, 'mid': 'q22', 'm': 22, 'mb': 0, 'subs': [], 'done': [], 'gen': 0, 'subDone': 5, 'seen': 22}}
    out = [('빈 저장', {}), ('v만', {'v': 4}), ('옛 작은 저장(1.x 모양)', b)]
    for tier in range(1, 6): out.append((f'옛 작은 저장, 학교급 {tier}', dict(b, tier=tier, tg=1, tdip=30, fund=500 * tier, p=dict(b['p'], dip=200 * tier))))
    out.append(('v3 저장(퀘스트를 번호로 기억)', dict(b, v=3, q={'init': True, 'm': 12, 'mb': 0, 'subs': [], 'done': ['s1', 's2'], 'gen': 0, 'subDone': 2, 'seen': 12})))
    out.append(('v2 저장(q 없음)', {k: v for k, v in dict(b, v=2).items() if k not in ('q', 'tier', 'tg', 'tdip', 'fund', 'fp')}))
    out.append(('틀린 꼴', {'v': 4, 'budget': 'abc', 'students': -7, 'f': [1, 2, 3], 't': None, 'grade': 99, 'best': -1, 'earned': 1e40, 'st': 'x', 'p': {'dip': -5, 'perk': []}, 'att': 5, 'q': {'m': 'x', 'subs': 'no', 'done': {}}, 'gold': 1e30, 'tier': 9, 'tg': -3, 'fund': None, 'fu': {'classroom': [9, 'a', -1]}, 'fr': [], 'cos': 3, 'rd': 'x', 'tam': [], 'bt': 7}))
    out.append(('너무 큰 값', dict(b, budget=1e300, students=1e9, earned=1e300, fund=1e40, gold=1e12, f={'classroom': 500, 'cafeteria': 500, 'library': 500, 'playground': 500}, t={'squirrel': 500, 'owl': 500, 'bear': 500})))
    return out

def aged(name, s, rnd):
    out = [(name, s), (name + ' → 옛 칸만 남김', {k: s[k] for k in OLD_TOP if k in s})]
    out.append((name + ' → 맨 위 칸 40% 빠짐', {k: v for k, v in s.items() if k in ('v',) or rnd.random() > 0.4}))
    out.append((name + ' → 둘째 칸 30% 빠짐', {k: ({a: c for a, c in v.items() if rnd.random() > 0.3} if isinstance(v, dict) else v) for k, v in s.items()}))
    def junk(o, d=0):
        if isinstance(o, dict): return {k: junk(v, d + 1) for k, v in o.items()}
        if isinstance(o, list): return [junk(v, d + 1) for v in o]
        if isinstance(o, (int, float)) and not isinstance(o, bool) and d and rnd.random() < 0.1: return rnd.choice([-5, 1e40, 'x', None, 0.5, 1e9])
        return o
    out.append((name + ' → 숫자 10%가 이상한 값', junk(s)))
    return out

async def page(p):
    b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 390, 'height': 800}, timezone_id='Asia/Seoul', locale='ko-KR')
    await ctx.add_init_script(FREEZE); pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(URL); await pg.wait_for_function('window.__forest && window.__forest.sanitize'); return b, pg, errs

async def sanitize_all(saves):
    """표본마다 sanitize() 결과 글자(JSON). 무작위 씨앗은 표본마다 처음으로 돌려요"""
    async with async_playwright() as p:
        b, pg, errs = await page(p); out = []
        for i in range(0, len(saves), 8):
            out += await pg.evaluate("""L => L.map(s => { window.__seed(777); try { return JSON.stringify(window.__forest.sanitize(JSON.parse(s))); } catch (e) { return 'ERR ' + e.message; } })""", [json.dumps(s[1]) for s in saves[i:i + 8]])
        await b.close(); return out, errs

def main():
    what = sys.argv[1] if len(sys.argv) > 1 else ''
    G.mkdir(exist_ok=True)
    if what == 'saves':
        import qbot
        r = asyncio.run(qbot.run(5)); rnd = random.Random(20261117); out = hand()
        for i, s in enumerate(r['snaps']): out += aged(f'봇 졸업식 {i + 1}', json.loads(s), rnd)
        # 모든 칸에 기본값이 아닌 값이 든 저장: 마지막 졸업식 저장을 sanitize()로 채운 다음, 숫자는 3씩 올리고 날짜 칸은 오늘이나 어제로 채워요(하루 초기화가 도는 쪽과 안 도는 쪽)
        full = json.loads(asyncio.run(sanitize_all([('', json.loads(r['snaps'][-1]))]))[0][0])
        import re
        def touch(o, day, k=''):
            if isinstance(o, dict): return {a: touch(v, day, a) for a, v in o.items()}
            if isinstance(o, list): return [touch(v, day, k) for v in o]
            if isinstance(o, bool): return o
            if isinstance(o, (int, float)): return o if k in ('v', 'born', 'savedAt', 'tier', 'tg', 'sem') or o > 1e11 else o + 3
            if isinstance(o, str) and (re.fullmatch(r'\d{4}-\d{2}-\d{2}', o) or (o == '' and k in ('day', 'last', 'd'))): return day
            return o
        out += [('모든 칸을 건드린 저장, 날짜는 오늘', touch(full, '2026-11-17')), ('모든 칸을 건드린 저장, 날짜는 어제', touch(full, '2026-11-16')), ('모든 칸을 건드린 저장, 날짜는 지난달', touch(full, '2026-10-03'))]
        dump(SAVES, out); print(f'표본 {len(out)}개, {SAVES.stat().st_size // 1024}KB')
    elif what == 'golden':
        saves = load(SAVES); out, errs = asyncio.run(sanitize_all(saves))
        dump(GOLD, out); print(f'기준 {len(out)}개, {GOLD.stat().st_size // 1024}KB, 오류 {sum(1 for o in out if o.startswith("ERR"))}개, 쪽 오류 {errs[:3]}')
    else: print(__doc__ or '쓰는 법: golden_make.py saves | golden')
if __name__ == '__main__': main()
