# 4.4.1 학생 걷는 길 만들기: chains.py의 길 가닥을 갈림점 그래프로 묶어 forest-school.html의 const MAP_PATHS 줄을 다시 써요(손으로 고치지 않아요).
# 쓰는 법: cd dev && python3 wrap.py && python3 paths/dump.py && python3 paths/gen.py   확인 그림은 /tmp/paths_pe*.png
# 건물, 분수, 다음 학교급 자리(게임의 길 찾기와 같은 막힌 곳)에 닿는 조각이 있으면 알려 줘요. 끊긴 무리는 막힌 곳을 지나지 않는 가장 짧은 직선으로 이어요(풀밭을 조금 걸어요)
import json, math, pathlib, re, sys
from PIL import Image, ImageDraw
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent
sys.path.insert(0, str(HERE))
from chains import CHAINS
G = json.load(open(HERE / 'geo.json'))
import numpy as np
from scipy import ndimage as ndi
MASK = {}
def blocks(g):   # 분수(타원). 건물은 bldmask.py가 그린 건물 그림 자리(paths/bld_<줄>.png)로 봐요
    B = []
    if g['fount']: fx, fy, rx, ry = g['fount']; B.append((fx - rx - 1, fy - ry - 1, fx + rx + 1, fy + ry + 1, 1))
    return B
def inb(b, x, y):
    if b[4] == 2: m = b[0]; xi, yi = int(x), int(y + 60); return 0 <= yi < m.shape[0] and 0 <= xi < m.shape[1] and bool(m[yi, xi])
    if b[4]: return ((2 * x - b[0] - b[2]) / (b[2] - b[0])) ** 2 + ((2 * y - b[1] - b[3]) / (b[3] - b[1])) ** 2 < 1
    return b[0] < x < b[2] and b[1] < y < b[3]
def bldmask(i):
    f = HERE / f'bld_{i}.png'
    if not f.exists(): return None
    from PIL import Image as I
    a = np.asarray(I.open(f).convert('RGBA'))[..., 3] > 200
    return ndi.binary_erosion(a, iterations=1)   # 건물 그림의 진한 곳만(그림자와 꽃 테두리는 걸어도 돼요)
def clear(B, p, q):
    n = max(1, math.ceil(math.hypot(q[0] - p[0], q[1] - p[1])))
    return not any(inb(b, p[0] + (q[0] - p[0]) * s / n, p[1] + (q[1] - p[1]) * s / n) for s in range(n + 1) for b in B)
MAXBR = 70   # 끊긴 무리를 이을 때 풀밭을 이만큼까지만 걸어요
def build(i):
    g = G[i]; B = blocks(g); N = []; E = set(); warn = []
    bm = bldmask(i)
    if bm is not None: B.append((bm, 0, 0, 0, 2))
    def node(p):
        if g['fount']:   # 분수(우물, 정자) 둘레 점은 막힌 타원 밖으로 조금 밀어내요
            fx, fy, rx, ry = g['fount']; dx, dy = (p[0] - fx) / rx, (p[1] - fy) / ry; r = math.hypot(dx, dy)
            if 0 < r < 1.35: p = (fx + dx / r * 1.35 * rx, fy + dy / r * 1.35 * ry)
        for j, q in enumerate(N):
            if math.hypot(p[0] - q[0], p[1] - q[1]) <= 2.5: return j
        N.append(list(p)); return len(N) - 1
    for ch in CHAINS[i]:
        ids = [node(p) for p in ch]
        for a, b in zip(ids, ids[1:]):
            if a == b: continue
            if not clear(B, N[a], N[b]): warn.append((N[a], N[b])); continue   # 건물 자리(지붕이 그려지는 곳)는 걷지 않아요
            E.add((min(a, b), max(a, b)))
    # 끊긴 무리 잇기
    par = list(range(len(N)))
    def f(x):
        while par[x] != x: par[x] = par[par[x]]; x = par[x]
        return x
    for a, b in E: par[f(a)] = f(b)
    bridges = []; used = {x for e in E for x in e}; gave = set()
    while len({f(x) for x in used} - gave) > 1:
        gx, gy = g['spots'][0]; r0 = f(min(used, key=lambda x: math.hypot(N[x][0] - gx, N[x][1] - gy))); best = None   # 정문 쪽 무리에 이어 붙여요
        for a in used:
            if f(a) != r0: continue
            for b in used:
                if f(b) == r0 or f(b) in gave: continue
                d = math.hypot(N[a][0] - N[b][0], N[a][1] - N[b][1])
                if d <= MAXBR and (best is None or d < best[0]) and clear(B, N[a], N[b]): best = (d, a, b)
        if not best:   # 너무 멀거나 막혀서 못 잇는 무리는 빼요(그 길은 걷지 않아요)
            for x in list(used):
                if f(x) != r0 and f(x) not in gave:
                    left = f(x); break
            gave.add(left); warn.append(('뺀 무리', [N[x] for x in used if f(x) == left][:3])); continue
        _, a, b = best; E.add((min(a, b), max(a, b))); par[f(a)] = f(b); bridges.append((N[a], N[b], round(best[0])))
    E = {e for e in E if f(e[0]) not in gave}
    return N, sorted(E), warn, bridges, B
if __name__ == '__main__':
    out = []
    for i in range(len(G)):
        N, E, warn, br, B = build(i); g = G[i]
        out.append({'n': [[round(x), round(y)] for x, y in N], 'e': [list(e) for e in E]})
        print(i, g['map'], '점', len(N), '길', len(E), '이음', br, ('뺀 것 ' + str(warn)) if warn else '')
        im = Image.open(ROOT / 'img' / 'maps' / f'{g["map"]}.webp').convert('RGB'); d = ImageDraw.Draw(im); S = 1024 / 360
        P = lambda x, y: (x * S, (y + 60) * S)
        for b in B:
            if b[4] == 2: continue
            if b[4]: d.ellipse([*P(b[0], b[1]), *P(b[2], b[3])], outline=(0, 0, 255), width=3)
            else: d.rectangle([*P(b[0], b[1]), *P(b[2], b[3])], outline=(0, 0, 255), width=3)
        for a, b in E: d.line([P(*N[a]), P(*N[b])], fill=(255, 0, 0), width=6)
        for p, q, _ in br: d.line([P(*p), P(*q)], fill=(255, 140, 0), width=6)
        for x, y in N: d.ellipse([P(x, y)[0] - 6, P(x, y)[1] - 6, P(x, y)[0] + 6, P(x, y)[1] + 6], fill=(255, 255, 0))
        im.resize((512, 768)).save(f'/tmp/paths_pe{i}.png')
    H = ROOT / 'dev' / 'forest-school.html'; t = H.read_text()
    line = '  const MAP_PATHS = ' + json.dumps(out, separators=(',', ':')) + ';   // dev/paths/gen.py가 만들어요(손으로 고치지 않아요)'
    t2, n = re.subn(r'^  const MAP_PATHS = .*$', lambda _: line, t, count=1, flags=re.M)
    assert n == 1, 'forest-school.html에 const MAP_PATHS 줄이 없어요'
    H.write_text(t2); print('MAP_PATHS', len(line))
