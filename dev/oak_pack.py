#!/usr/bin/env python3
"""지도 참나무 묶기 (3.3.4, 작업지시서 54)

Codex가 준 참나무 층(oak_<지도>_<판>.png)과 나무 지운 지도(map_<지도>_nooak_<판>.png)에서
게임이 쓰는 작은 그림 두 장과 자리 표를 만들어요.
  img/maps/oakl_<지도>.webp : 참나무 층을 나무 둘레만 오린 것(투명 배경)
  img/maps/oakp_<지도>.webp : 나무 지운 지도에서 나무 자리만 오린 조각(가장자리 12px은 부드럽게 투명)
  표: 원본 forest-school.html의 MAP_OAK_BEGIN ~ MAP_OAK_END 사이를 바꿔 써요
그림을 새로 그리지 않아요. 오리고 줄여 담기만 해요.

쓰는 법: python3 -I oak_pack.py <그림 폴더> <deliverables json> <판 꼬리 예: _v7> [--out <img/maps 폴더>] [--keys a,b] [--no-table]
        python3 oak_pack.py --repack [--check]   그림 없이 원본의 표만 다시 짧게 적어요(풀어낸 값이 같은지 견줘요)
표는 5.0.2부터 바탕 지도와 다른 칸만 적어요(pack_table). 게임이 읽을 때 바탕 값을 채워요.
좌표: 지도 그림 1024x1536 → 지도 좌표 가로 0~360, 세로 -60~480
"""
import sys, os, json, re
from PIL import Image, ImageFilter
import numpy as np

FIELDS = ['l', 'p', 'pv', 'tap', 'nuts', 'drop']
def _fmt(o): return json.dumps(o, separators=(', ', ': ')).replace('"', '')

def pack_table(rows):
    """표의 줄을 만들어요. 5.0.2부터 테마 지도의 줄은 바탕 줄과 다른 칸만 적어요: map_elem_autumn: {_: 'map_elem', l: [...], ...}
    바탕은 '온전히 적은 줄' 가운데 같은 칸이 가장 많은 것(이름이 앞부분으로 같으면 먼저). 게임은 읽을 때 바탕 값을 채워요(MAP_OAK 아래 한 줄)."""
    out, full = [], []
    for k, r in rows.items():
        best, bs = None, 0
        for b in full:
            same = sum(1 for f in FIELDS if rows[b][f] == r[f]); sc = same * 2 + (1 if k.startswith(b + '_') else 0)
            if same > 0 and sc > bs: bs, best = sc, b
        whole = f"    {k}: " + _fmt(r) + ','
        if best:
            line = f"    {k}: " + _fmt({'_': best, **{f: r[f] for f in FIELDS if rows[best][f] != r[f]}}).replace('_: ' + best, "_: '" + best + "'", 1) + ','
            if len(line) < len(whole) - 20: out.append(line); continue
        full.append(k); out.append(whole)
    assert unpack_table(out) == rows, '풀어낸 표가 처음 값과 달라요'
    return out

def parse_table(text):
    """표 글(줄들)을 읽어 {열쇠: 줄}로. 바탕(_)은 아직 채우지 않아요"""
    rows = {}
    for m in re.finditer(r"^\s+(map_\w+): (\{.*\}),\s*$", text, re.M):
        rows[m.group(1)] = json.loads(re.sub(r"(\w+):", r'"\1":', m.group(2).replace("'", '"')))
    return rows

def unpack_table(lines):
    """줄들을 온전한 표로 풀어요(게임이 읽을 때 하는 일과 같아요)"""
    raw = parse_table('\n'.join(lines) if isinstance(lines, list) else lines); out = {}
    for k, r in raw.items():
        if '_' in r:
            o = json.loads(json.dumps(raw[r['_']])); assert '_' not in o, (k, '바탕 줄이 온전하지 않아요')
            o.update({f: v for f, v in r.items() if f != '_'}); out[k] = o
        else: out[k] = r
    return out

def repack():
    """그림은 건드리지 않고 원본의 표만 다시 짧게 적어요. 풀어낸 값이 그대로인지 견줘요:  python3 oak_pack.py --repack [--check]"""
    html = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'forest-school.html')
    s = open(html, encoding='utf-8').read()
    m = re.search(r'/\*MAP_OAK_BEGIN\*/(.*?)/\*MAP_OAK_END\*/', s, re.S)
    before = unpack_table(m.group(1)); lines = pack_table(before)
    assert unpack_table(lines) == before and list(unpack_table(lines)) == list(before)
    new = '/*MAP_OAK_BEGIN*/\n' + '\n'.join(lines) + '\n    /*MAP_OAK_END*/'
    print(f'{len(before)}줄, 표 글자 {len(m.group(0))} → {len(new)}, 풀어낸 값은 같아요')
    if '--check' in sys.argv: return
    open(html, 'w', encoding='utf-8').write(s[:m.start()] + new + s[m.end():])

def main():
    a = sys.argv[1:]
    if '--repack' in a: return repack()
    src, dj, suf = a[0], a[1], a[2]
    out = a[a.index('--out') + 1] if '--out' in a else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'img', 'maps')
    keys = a[a.index('--keys') + 1].split(',') if '--keys' in a else None
    os.makedirs(out, exist_ok=True)
    ents = {e['key']: e for e in json.load(open(dj, encoding='utf-8'))['oak']}
    gx = lambda px: round(px * 360 / 1024, 1)
    gy = lambda py: round(py * 540 / 1536 - 60, 1)
    gs = lambda d: round(d * 360 / 1024, 1)
    rows, total = {}, 0
    for key, e in ents.items():
        if keys and key not in keys: continue
        oak = Image.open(os.path.join(src, f'oak_{key}{suf}.png')).convert('RGBA')
        noo = Image.open(os.path.join(src, f'map_{key}_nooak{suf}.png')).convert('RGB')
        assert oak.size == (1024, 1536) and noo.size == (1024, 1536), (key, oak.size, noo.size)
        al = np.array(oak)[..., 3]
        ys, xs = np.nonzero(al > 8)
        x0, y0, x1, y1 = max(0, xs.min() - 2), max(0, ys.min() - 2), min(1024, xs.max() + 3), min(1536, ys.max() + 3)
        layer = oak.crop((x0, y0, x1, y1))
        # 조각: 나무 둘레 44px 넓게, 지도 끝에 닿지 않는 가장자리만 12px 부드럽게
        PAD, FE = 44, 12
        px0, py0, px1, py1 = max(0, x0 - PAD), max(0, y0 - PAD), min(1024, x1 + PAD), min(1536, y1 + PAD)
        patch = noo.crop((px0, py0, px1, py1)).convert('RGBA')
        w, h = patch.size
        m = np.full((h, w), 255.0)
        ramp = lambda n: np.clip((np.arange(n) + 0.5) / FE, 0, 1) * 255
        if px0 > 0: m = np.minimum(m, ramp(w)[None, :])
        if px1 < 1024: m = np.minimum(m, ramp(w)[::-1][None, :])
        if py0 > 0: m = np.minimum(m, ramp(h)[:, None])
        if py1 < 1536: m = np.minimum(m, ramp(h)[::-1][:, None])
        patch.putalpha(Image.fromarray(m.astype('uint8')))
        fl, fp = os.path.join(out, f'oakl_{key}.webp'), os.path.join(out, f'oakp_{key}.webp')
        layer.save(fl, 'WEBP', quality=90, method=6)
        patch.save(fp, 'WEBP', quality=88, method=6)
        total += os.path.getsize(fl) + os.path.getsize(fp)
        # v7 자리 표에는 tap_px가 없고 tap(가로, 세로 %와 지도 가로 폭 기준 반지름 %)만 있어요
        pv = e['pivot_px']
        tap = e.get('tap_px') or [e['tap'][0] / 100 * 1024, e['tap'][1] / 100 * 1536, e['tap'][2] / 100 * 1024]
        # 도토리 맺히는 자리 6곳: 잎이 꽉 찬 곳(둘레 6px이 모두 불투명) 가운데, 층 높이의 22~62% 띠에서 서로 멀리 떨어지게 골라요
        solid = np.array(Image.fromarray(((al > 200) * 255).astype('uint8')).filter(ImageFilter.MinFilter(13))) > 0
        hh = y1 - y0
        cand = [(x, y) for y in range(int(y0 + hh * 0.22), int(y0 + hh * 0.62), 6) for x in range(x0 + 8, x1 - 8, 6) if solid[y, x]]
        nuts = []
        if cand:
            nuts = [min(cand, key=lambda c: abs(c[0] - (x0 + x1) / 2) + abs(c[1] - (y0 + hh * 0.4)))]
            while len(nuts) < 6 and len(nuts) < len(cand):
                nuts.append(max(cand, key=lambda c: min((c[0] - n[0]) ** 2 + ((c[1] - n[1]) * 1.6) ** 2 for n in nuts)))
        if len(nuts) < 6: nuts = [tuple(p) for p in e['acorns_px'][:6]]
        row = {
            'l': [gx(x0), gy(y0), gs(x1 - x0), gs(y1 - y0)], 'p': [gx(px0), gy(py0), gs(px1 - px0), gs(py1 - py0)],
            'pv': [gx(pv[0]), gy(pv[1])], 'tap': [gx(tap[0]), gy(tap[1]), min(gs(tap[2]), 48)],
            'nuts': [[gx(x), gy(y)] for x, y in nuts], 'drop': [[gx(x), gy(y)] for x, y in e['drop_px']],
        }
        rows['map_' + key] = row
    lines = pack_table(rows)
    print(f'{len(lines)}장, 그림 합계 {total / 1024:.0f}KB → {out}')
    if '--no-table' in a:
        print('\n'.join(lines)); return
    html = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'forest-school.html')
    s = open(html, encoding='utf-8').read()
    s2 = re.sub(r'/\*MAP_OAK_BEGIN\*/.*?/\*MAP_OAK_END\*/', lambda _: '/*MAP_OAK_BEGIN*/\n' + '\n'.join(lines) + '\n    /*MAP_OAK_END*/', s, count=1, flags=re.S)
    assert s2 != s or not lines
    open(html, 'w', encoding='utf-8').write(s2)
    print('표를 forest-school.html에 썼어요')

if __name__ == '__main__':
    main()
