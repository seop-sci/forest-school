# 어긋남 막는 검사 (5.0.2 개발 기반 정리). 게임 원본에서 '한 곳만 고치고 다른 곳을 잊기 쉬운' 세 가지를 봐요.
#   1. 메인 퀘스트(MAIN) 제목과 설명에 적힌 숫자가 조건 n과 같은지 (Lv.3이라 쓰고 n은 4인 것)
#   2. 퀘스트 종류(t)가 qMeasure(재기), qGoal(목표 글), goTo(바로 가기)에 모두 있는지
#   3. fresh()와 새 학년 시작(newYear: graduate()와 promote()가 불러요)의 건물, 선생님 처음 값이 같은지
# 쓰는 법: python3 dev/driftcheck.py   (먼저 python3 wrap.py). 마지막 줄 PASS, 어긋나면 FAIL과 끝 코드 1.
import sys as _sys, pathlib as _pl; _sys.path.insert(0, str(_pl.Path(__file__).resolve().parent)); import srcbuild as _sb; _sb.build()   # 2026-11-18 src/ → forest-school.html 먼저
import re, sys, pathlib, json
from testlib import URL
from playwright.sync_api import sync_playwright
HERE = pathlib.Path(__file__).resolve().parent
src = (HERE / 'forest-school.html').read_text(encoding='utf-8')
bad, note = [], []
seen = 0

def body(name):
    i = src.index(f'\n  function {name}(')
    j = src.index('\n  }\n', i)
    return src[i:j]
def cases(name): return set(re.findall(r"case '(\w+)'", body(name)))

# ---- 브라우저에서 MAIN과 처음 값 읽기
pw = sync_playwright().start(); br = pw.chromium.launch()
pg = br.new_page(); pg.add_init_script('window.__FOREST_TEST = 1'); pg.goto(URL); pg.wait_for_function('window.__forest && window.__forest.MAIN')
MAIN = pg.evaluate("window.__forest.MAIN.map(q => ({ id: q.id, t: q.t, k: q.k || '', n: q.n, title: q.title || '', how: q.how || '' }))")
ST = pg.evaluate("Object.keys(window.__forest.S.st)")
br.close(); pw.stop()

# ---- 1. 제목과 설명의 숫자
# 제목: 'Lv.N', 'N명', 'N번', 'N개', 'N곳', 'N권', 'N마리', 'N종' 가운데 하나가 있으면 그 숫자는 n이어야 해요.
# 설명(how): 다른 숫자(20%, ★3)가 섞이므로 'Lv.N'만 봐요. 종류가 fac, fur, furAll, tea, teaAll, vp, xt처럼 레벨을 재는 것일 때만.
LV = {'fac', 'facAll', 'fur', 'furAll', 'tea', 'teaAll', 'vp', 'xt'}
NOCHK = {'grade', 'ygrade', 'tier', 'rate', 'earned', 'dept', 'semH'}   # n이 번호이거나(등급, 학교급) 큰 수를 줄여 쓰는 종류
OKAY = {}   # 일부러 다르게 쓴 것: id → 까닭
def num(s): return float(s.replace(',', ''))
for q in MAIN:
    if q['id'] in OKAY or not isinstance(q['n'], (int, float)): continue
    t, n = q['t'], q['n']
    for where, text in (('제목', q['title']), ('설명', q['how'])):
        for m in re.finditer(r'Lv\.(\d+)', text):
            if t in LV: seen += 1
            if t in LV and int(m.group(1)) != n: bad.append(f"{q['id']} {where} '{text}': Lv.{m.group(1)}인데 n은 {n}")
        if where == '제목' and t not in NOCHK and t not in LV:
            for m in re.finditer(r'(\d[\d,]*)\s*(명|번|개|곳|권|마리|종|장|판|층)', text):
                seen += 1
                if num(m.group(1)) != n: bad.append(f"{q['id']} 제목 '{text}': {m.group(1)}{m.group(2)}인데 n은 {n}")
note.append(f'메인 퀘스트 {len(MAIN)}개의 제목과 설명 숫자 {seen}곳')
if seen < 50: bad.append(f'숫자를 {seen}곳밖에 못 봤어요. 이 검사가 헛돌고 있어요')

# ---- 2. 퀘스트 종류
i0 = src.index('\n  const SUBS = ['); i1 = src.index('\n  const freshQ', i0)
sub_t = set(re.findall(r"\bt: '(\w+)'", src[i0:i1]))
types = {q['t'] for q in MAIN} | sub_t
cm, cg, ct = cases('qMeasure'), cases('qGoal'), cases('goTo')
GOAL_OK = {}   # qGoal이 없어도 되는 종류: 까닭
GOTO_OK = {}
for t in sorted(types):
    if t not in cm and t not in ST: bad.append(f"종류 '{t}': qMeasure에 없고 S.st에도 없어요(늘 0으로 재요)")
    if t not in cg and t not in GOAL_OK: bad.append(f"종류 '{t}': qGoal에 없어요(목표 글이 비어요)")
    if t not in ct and t not in GOTO_OK: bad.append(f"종류 '{t}': goTo에 없어요(바로 가기를 눌러도 아무 일이 없어요)")
note.append(f'퀘스트 종류 {len(types)}가지(메인 {len({q["t"] for q in MAIN})}, 학생 부탁 {len(sub_t)})')

# ---- 3. fresh()와 graduate()의 처음 값
def obj(text):
    return {k: v for k, v in re.findall(r'(\w+): (-?\d+)', text)}
fr = src[src.index('\n  const fresh = () => ({'):]
gd = body('newYear')   # graduate()와 promote()가 함께 부르는 새 학년 시작
for key, lab in (('f', '건물'), ('t', '선생님')):
    a = re.search(r'\n    %s: \{([^}]*)\}' % key, fr); b = re.search(r'S\.%s = \{([^}]*)\}' % key, gd)
    if not a or not b: bad.append(f'{lab} 처음 값을 못 찾았어요(fresh {bool(a)}, newYear {bool(b)}). 이 검사를 고쳐야 해요'); continue
    A, B = obj(a.group(1)), obj(b.group(1))
    if A != B:
        diff = sorted(set(A) ^ set(B)) + [k for k in A if k in B and A[k] != B[k]]
        bad.append(f'{lab} 처음 값이 fresh()와 newYear()에서 달라요: {diff}')
    else: note.append(f'{lab} 처음 값 {len(A)}칸')
if 'S.fu = freshFu()' not in gd or 'fu: freshFu()' not in fr[:3000]: bad.append('가구 처음 값: fresh()와 newYear()가 둘 다 freshFu()를 쓰지 않아요')

for n in note: print('  봤어요:', n)
for b in bad: print('  어긋남:', b)
print('PASS' if not bad else f'FAIL ({len(bad)}개)')
sys.exit(1 if bad else 0)
