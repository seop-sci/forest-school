# 건물 그림에서 지붕만 오려 내요 (테마 색을 입힐 때 써요).
# 쓰는 법: python3 make_roofs.py <건물 그림 폴더> <내보낼 폴더>   그다음 python3 embed_assets.py <내보낼 폴더>
# 지붕 색(색상 범위)으로 고르고, 그림 위쪽 62%만 봐요. 밝기는 남겨서 게임이 색을 곱해 입혀도 그늘이 살아요.
# 운동장 트랙은 그림 아래까지 내려오니 끝까지 보고, 가장 큰 덩어리(트랙)만 남겨서 깃발과 관중석 지붕은 빼요 (1.5.2)
import colorsys, pathlib, sys
from PIL import Image, ImageFilter

SPEC = {   # 열쇠: (건물 그림, [색상 범위...], 볼 높이, 가장 큰 덩어리만)
    'roof_classroom': ('bld_classroom_on', [(0, 0.06), (0.94, 1.0)]),
    'roof_cafeteria': ('bld_cafeteria_on', [(0.03, 0.11)]),
    'roof_library': ('bld_library_on', [(0.55, 0.70)]),
    'roof_science': ('bld_science_on', [(0.30, 0.47)]),
    'roof_playground': ('bld_playground_on', [(0, 0.05), (0.95, 1.0)]),
    'roof_field': ('bld_field_on', [(0.97, 1.0), (0, 0.035)], 1.0, True),
}
SIZE = 400


def roof(src, hues, ylim=0.62, largest=False):
    im = Image.open(src).convert('RGBA').resize((SIZE, SIZE), Image.LANCZOS)
    px = im.load()
    mask = Image.new('L', im.size, 0); mp = mask.load()
    gray = Image.new('L', im.size, 0); gp = gray.load()
    for y in range(int(SIZE * ylim)):
        for x in range(SIZE):
            r, g, b, a = px[x, y]
            if a < 200:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s > 0.42 and v > 0.3 and any(lo <= h <= hi for lo, hi in hues):
                mp[x, y] = 255
            gp[x, y] = int(min(255, 70 + v * 205))
    if largest:
        import numpy as np
        from scipy import ndimage
        a = np.array(mask.filter(ImageFilter.MaxFilter(5))) > 0
        lab, n = ndimage.label(a)
        if n:
            big = 1 + int(np.argmax(ndimage.sum(a, lab, range(1, n + 1))))
            keep = np.array(mask) > 0
            keep &= lab == big
            mask = Image.fromarray((keep * 255).astype('uint8'), 'L')
    mask = mask.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    out = Image.merge('RGBA', (gray, gray, gray, mask))
    return out


def main(src_dir, out_dir):
    src_dir, out_dir = pathlib.Path(src_dir), pathlib.Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    only = sys.argv[3:]   # 열쇠를 적으면 그것만 다시 만들어요
    for key, (name, hues, *opt) in SPEC.items():
        if only and key not in only:
            continue
        roof(src_dir / f'{name}.png', hues, *opt).save(out_dir / f'{key}.png')
        print(key)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
