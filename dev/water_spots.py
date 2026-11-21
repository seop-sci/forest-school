# 5.3.1 마을 층 물결 자리: 지도 그림에서 물(파란 곳)을 찾아 물결을 띄울 자리를 골라요.
# 쓰는 법: python3 water_spots.py  → src/js/40c-world.js에 붙일 WLD_WATER 표를 찍어요(지도 좌표 x 0~360, y -60~480)
import re, pathlib, json
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parent.parent
s = (ROOT / 'src/page/20-img-map.html').read_text()
m = dict(re.findall(r'"([a-z0-9_]+)":"(img/a/[^"]+)"', s))
keys = [k for k in m if re.fullmatch(r'map_(kinder|elem|middle|high|campus|zone_[a-z]+|grad[a-z_]*)', k)]
out = {}
for k in sorted(keys):
    im = Image.open(ROOT / m[k]).convert('RGB').resize((90, 135))
    px = im.load(); cells = []
    for y in range(int(135 * 0.14), 135):
        for x in range(90):
            r, g, b = px[x, y]
            if b > 140 and b > r + 45 and b > g + 8 and g > r: cells.append((x, y))
    pick = []
    for (x, y) in cells:
        if all((x - a) ** 2 + (y - b) ** 2 > 64 for a, b in pick): pick.append((x, y))
    sp = [[round(x * 4 + 2), round(y * 4 + 2 - 60)] for x, y in pick[:12]]
    sp = [p for p in sp if 40 <= p[1] <= 440]   # 맨 위 먼 풍경과 맨 아래 꽃밭(파란 꽃)은 빼요
    if sp: out[k] = sp
print('const WLD_WATER = ' + json.dumps(out, separators=(',', ':')) + ';')
