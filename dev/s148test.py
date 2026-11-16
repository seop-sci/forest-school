# s148: 저장 읽기 견줌 시험. 옛 저장 표본 40개를 sanitize()에 넣은 결과(JSON)가 기준과 글자까지 같은지 봐요.
# 되풀이를 묶는 일처럼 동작이 그대로여야 하는 일의 안전망이에요. 표본과 기준은 dev/golden/ (만드는 법: dev/golden_make.py)
# 저장 읽기를 일부러 바꾼 버전에서는 바뀐 곳을 눈으로 본 뒤 python3 golden_make.py golden 으로 기준을 다시 적어요.
import asyncio, json
import testlib   # 끝 코드 맞추기
import golden_make as gm

def walk(a, b, p=''):
    if type(a) != type(b): yield p, a, b; return
    if isinstance(a, dict):
        for k in list(a) + [k for k in b if k not in a]:
            if k not in a or k not in b: yield p + '.' + k, a.get(k, '(없음)'), b.get(k, '(없음)')
            else: yield from walk(a[k], b[k], p + '.' + k)
    elif isinstance(a, list):
        if len(a) != len(b): yield p + ' 길이', len(a), len(b)
        else:
            for i, (x, y) in enumerate(zip(a, b)): yield from walk(x, y, f'{p}[{i}]')
    elif a != b: yield p, a, b

saves, gold = gm.load(gm.SAVES), gm.load(gm.GOLD)
out, errs = asyncio.run(gm.sanitize_all(saves))
bad = 0
if len(out) != len(gold): print(f'  틀림: 표본 {len(out)}개인데 기준은 {len(gold)}개'); bad += 1
for (name, _), o, g in zip(saves, out, gold):
    if o == g: continue
    bad += 1
    try: d = list(walk(json.loads(g), json.loads(o)))
    except Exception: d = []
    print(f'  틀림: {name}: ' + ('; '.join(f'{p} 기준 {str(x)[:40]} → 지금 {str(y)[:40]}' for p, x, y in d[:5]) + (f' 밖에 {len(d) - 5}곳' if len(d) > 5 else '') if d else '값은 같고 칸 순서나 글자만 달라요' if not o.startswith('ERR') else o))
if errs: print('  틀림: 쪽 오류', errs[:3]); bad += 1
print(f'표본 {len(saves)}개, 결과 글자 {sum(len(o) for o in out)}자')
print('PASS' if not bad else f'FAIL {bad}')
