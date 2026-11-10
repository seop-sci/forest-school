#!/usr/bin/env python3
"""지도 참나무 묶기 (3.3.4, 작업지시서 54)

Codex가 준 참나무 층(oak_<지도>_<판>.png)과 나무 지운 지도(map_<지도>_nooak_<판>.png)에서
게임이 쓰는 작은 그림 두 장과 자리 표를 만들어요.
  img/maps/oakl_<지도>.webp : 참나무 층을 나무 둘레만 오린 것(투명 배경)
  img/maps/oakp_<지도>.webp : 나무 지운 지도에서 나무 자리만 오린 조각(가장자리 12px은 부드럽게 투명)
  표: 원본 forest-school.html의 MAP_OAK_BEGIN ~ MAP_OAK_END 사이를 바꿔 써요
그림을 새로 그리지 않아요. 오리고 줄여 담기만 해요.

쓰는 법: python3 -I oak_pack.py <그림 폴더> <deliverables json> <판 꼬리 예: _v7> [--out <img/maps 폴더>] [--keys a,b] [--no-table]
좌표: 지도 그림 1024x1536 → 지도 좌표 가로 0~360, 세로 -60~480
"""
import sys, os, json, re
from PIL import Image, ImageFilter
import numpy as np

def main():
    a = sys.argv[1:]
    src, dj, suf = a[0], a[1], a[2]
    out = a[a.index('--out') + 1] if '--out' in a else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'img', 'maps')
    keys = a[a.index('--keys') + 1].split(',') if '--keys' in a else None
    os.makedirs(out, exist_ok=True)
    ents = {e['key']: e for e in json.load(open(dj, encoding='utf-8'))['oak']}
    gx = lambda px: round(px * 360 / 1024, 1)
    gy = lambda py: round(py * 540 / 1536 - 60, 1)
    gs = lambda d: round(d * 360 / 1024, 1)
    lines, total = [], 0
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
        pv, tap = e['pivot_px'], e['tap_px']
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
        lines.append(f"    map_{key}: " + json.dumps(row, separators=(', ', ': ')).replace('"', '') + ',')
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
