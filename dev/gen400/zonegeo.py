#!/usr/bin/env python3
"""4.0.0 대학교 캠퍼스와 구역 지도 자리 표 만들기 (작업지시서 54 1단계)

Codex가 준 자리 표(lots_*.md, 지도 그림 기준 %)를 읽어 게임 지도 좌표(가로 0~360, 세로 -60~480)로 바꾸고,
  1) 지도 그림을 img/maps/map_campus.webp, map_zone_<구역>.webp로 줄여 담고
  2) 게임에 넣을 표(zones.js.txt)를 쓰고
  3) 확인 그림(zones_check.png)을 그려요.
그림을 새로 그리지 않아요. 줄여 담고 표시만 해요.

쓰는 법: python3 -I zonegeo.py <54_campus 폴더> [--no-img]
"""
import sys, os, re, json
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_IMG = os.path.join(HERE, '..', '..', 'img', 'maps')
ZONES = [('academic', 'lots_academic_v2.md', '학술 구역'), ('life', 'lots_life_v3.md', '생활 구역'), ('plaza', 'lots_plaza_v2.md', '광장 구역'), ('sports', 'lots_sports_v3.md', '체육 구역')]
FAC = {'bld_classroom_s5': 'classroom', 'bld_library_s5': 'library', 'bld_science_s5': 'science', 'bld_cafeteria_s5': 'cafeteria', 'bld_store_s5': 'store', 'bld_dorm_s5': 'dorm', 'bld_union_on': 'union', 'bld_field_s5': 'playground'}
nums = lambda s: [float(x) for x in re.findall(r'-?\d+(?:\.\d+)?', s)]
gx = lambda p: round(p * 3.6, 1)                 # 가로 % → 지도 좌표
gy = lambda p: round(p * 5.4 - 60, 1)            # 세로 % → 지도 좌표
first = lambda txt, pat: (lambda m: nums(m.group(1)) if m else None)(re.search(pat + r'[^\[]*\[([^\]]+)\]', txt))

def read_zone(d, key, fn, name):
    t = open(os.path.join(d, fn), encoding='utf-8').read()
    z = {'key': key, 'name': name, 'map': 'map_zone_' + key, 'lot': {}, 'lotPx': {}}
    for m in re.finditer(r'^\| L\d+ \| (\w+) \| [^|]+ \| \[([^\]]+)\]', t, re.M):
        cx, cy, w, h = nums(m.group(2))
        z['lot'][FAC[m.group(1)]] = [cx, cy, w]          # 게임 lot은 [가로 %, 세로 %, 빈터 너비 %]
        z['lotPx'][FAC[m.group(1)]] = [cx, cy, w, h]
    z['gate'] = first(t, r'E 교문'); z['plaza'] = first(t, r'G 광장'); z['oak'] = first(t, r'O 지도에 그린 참나무')
    z['deco'] = [nums(m.group(1)) for m in re.finditer(r'^\| D\d+ \| \[([^\]]+)\]', t, re.M)]
    z['spots'] = [nums(m.group(1)) for m in re.finditer(r'^\| P\d+ \| \[([^\]]+)\]', t, re.M)]
    for k, pat in (('bus', r'버스 서는 자리'), ('sign', r'학교 간판 자리'), ('vd', r'마을 기부 기념물 자리'), ('fount', r'분수 가운데'), ('sportsAt', r'운동회 자리')):
        v = first(t, pat)
        if v: z[k] = v
    return z

def read_campus(d):
    t = open(os.path.join(d, 'lots_campus_v2.md'), encoding='utf-8').read()
    c = {'map': 'map_campus', 'zones': []}
    keys = {'학술 구역': 'academic', '생활 구역': 'life', '광장 구역': 'plaza', '체육 구역': 'sports', '연구 구역': 'lab'}
    for m in re.finditer(r'^\| Z\d+ \| ([^|]+) \| \[([^\]]+)\] \| \[([^\]]+)\] \| (\S+)', t, re.M):
        c['zones'].append({'key': keys[m.group(1).strip()], 'name': m.group(1).strip(), 'tag': nums(m.group(2)), 'hit': nums(m.group(3)), 'lock': m.group(4) == '잠금'})
    c['gate'] = first(t, r'정문 가운데'); c['fount'] = first(t, r'광장 분수 가운데')
    c['spots'] = [nums(m.group(1)) for m in re.finditer(r'^\| P\d+ \| \[([^\]]+)\]', t, re.M)]
    return c

def js(v): return json.dumps(v, separators=(', ', ': ')).replace('"', "'")

def main():
    d = sys.argv[1]
    zs = [read_zone(d, *z) for z in ZONES]; cp = read_campus(d)
    if '--no-img' not in sys.argv:
        os.makedirs(OUT_IMG, exist_ok=True)
        for k in ['map_campus'] + [z['map'] for z in zs]:
            im = Image.open(os.path.join(d, k + '.png')).convert('RGB'); assert im.size == (1024, 1536), (k, im.size)
            im.save(os.path.join(OUT_IMG, k + '.webp'), 'WEBP', quality=82, method=6)
            print(k, os.path.getsize(os.path.join(OUT_IMG, k + '.webp')) // 1024, 'KB')
    L = ['  // 4.0.0 대학교 구역 지도 자리 표 (dev/gen400/zonegeo.py가 작업지시서 54 자리 표에서 만들어요. 손으로 고치지 않아요)', '  const ZONE_GEO = [']
    for z in zs:
        P = lambda p: [gx(p[0]), gy(p[1])]
        row = [f"map: '{z['map']}'", f"zone: '{z['key']}'", f"zname: '{z['name']}'", 'lot: ' + js(z['lot']),
               'oak: ' + js(P(z['oak'])), 'plaza: ' + js(P(z['plaza'])), 'gate: ' + js(P(z['gate'])),
               'drop: ' + js(P(z['plaza']) + [36, 12]), 'spots: ' + js([P(p) for p in z['spots']]), 'deco: ' + js([P(p) for p in z['deco']])]
        if 'bus' in z: row.append('bus: ' + js(P(z['bus'])))
        if 'sign' in z: row.append('sign: ' + js(P(z['sign'])))
        if 'vd' in z: row.append('vd: ' + js(P(z['vd'])))
        if 'fount' in z: row.append('fount: ' + js(P(z['fount']) + [22, 14]))
        L.append('    { ' + ', '.join(row) + ' },')
    L.append('  ];')
    P = lambda p: [gx(p[0]), gy(p[1])]
    L.append("  const CAMPUS = { map: 'map_campus', gate: " + js(P(cp['gate'])) + ', fount: ' + js(P(cp['fount'])) + ', spots: ' + js([P(p) for p in cp['spots']]) + ',')
    L.append('    zones: [')
    for zn in cp['zones']:
        x, y, w, h = zn['hit']
        L.append(f"      {{ key: '{zn['key']}', name: '{zn['name']}', tag: {js(P(zn['tag']))}, hit: {js([gx(x), gy(y), round(w * 3.6, 1), round(h * 5.4, 1)])}, lock: {'true' if zn['lock'] else 'false'} }},")
    L.append('    ] };')
    open(os.path.join(HERE, 'zones.js.txt'), 'w', encoding='utf-8').write('\n'.join(L) + '\n')
    # 확인 그림
    S = 0.4; W, H = int(1024 * S), int(1536 * S)
    sheet = Image.new('RGB', (W * 5 + 16, H), 'white')
    def px(p): return (p[0] / 100 * W, p[1] / 100 * H)
    im = Image.open(os.path.join(d, 'map_campus.png')).convert('RGB').resize((W, H)); dr = ImageDraw.Draw(im)
    for zn in cp['zones']:
        x, y, w, h = zn['hit']; a = px((x, y)); b = px((x + w, y + h))
        dr.rectangle([a, b], outline='red' if zn['lock'] else 'blue', width=2); t = px(zn['tag']); dr.ellipse([t[0] - 4, t[1] - 4, t[0] + 4, t[1] + 4], fill='yellow', outline='black')
    for p in cp['spots']: q = px(p); dr.ellipse([q[0] - 3, q[1] - 3, q[0] + 3, q[1] + 3], fill='white', outline='black')
    sheet.paste(im, (0, 0))
    for i, z in enumerate(zs):
        im = Image.open(os.path.join(d, z['map'] + '.png')).convert('RGB').resize((W, H)); dr = ImageDraw.Draw(im)
        for k, (cx, cy, w, h) in z['lotPx'].items():
            a = px((cx - w / 2, cy - h / 2)); b = px((cx + w / 2, cy + h / 2)); dr.ellipse([a, b], outline='blue', width=2); dr.text((a[0], a[1] - 10), k, fill='blue')
        for p in z['spots']: q = px(p); dr.ellipse([q[0] - 3, q[1] - 3, q[0] + 3, q[1] + 3], fill='white', outline='black')
        for p in z['deco']: q = px(p); dr.ellipse([q[0] - 12, q[1] - 8, q[0] + 12, q[1] + 8], outline='magenta', width=2)
        for k, col in (('oak', 'green'), ('gate', 'orange'), ('plaza', 'yellow'), ('bus', 'cyan'), ('sign', 'brown'), ('vd', 'gold'), ('fount', 'aqua')):
            if z.get(k): q = px(z[k]); dr.rectangle([q[0] - 5, q[1] - 5, q[0] + 5, q[1] + 5], fill=col, outline='black'); dr.text((q[0] + 7, q[1] - 5), k, fill='black')
        sheet.paste(im, ((i + 1) * (W + 4), 0))
    sheet.save(os.path.join(HERE, 'zones_check.png'))
    print('표:', os.path.join(HERE, 'zones.js.txt'), ' 확인 그림: zones_check.png')

if __name__ == '__main__':
    main()
