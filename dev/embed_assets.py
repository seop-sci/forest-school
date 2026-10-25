# 1.5.0 그림 넣기: PNG 원본 폴더를 받아 webp로 줄이고, forest-school.html 안의 그림 묶음(window.FS_IMG)을 새로 써요.
# 쓰는 법: python3 embed_assets.py <원본 폴더> [<원본 폴더2> ...]
#   1.7.0 도감, 이벤트 그림은 따로 둔 묶음(window.FS_IMG170)에 넣어요: python3 embed_assets.py --block 170 ../art/v170/dex ../art/v170/event
#   폴더 안의 파일 이름(확장자 뺀 것)이 그대로 열쇠가 돼요. 예: map_kinder, bld_classroom_on, ic_home
# 원본 PNG는 저장소에 넣지 않아요(1차 에셋 zip, art/v150-assets 브랜치). 게임은 한 파일로 돌아가야 해서 그림을 글자로 바꿔 넣어요.
import base64, io, pathlib, re, sys
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE / 'forest-school.html'
BEGIN, END, VAR = '<!-- FS_IMG:BEGIN -->', '<!-- FS_IMG:END -->', 'FS_IMG'
# 1.7.0 묶음(--block 170): 1.6.0 퍼즐 그림과 같은 묶음을 고치지 않게 따로 둬요
BLOCKS = {'170': ('<!-- FS_IMG170:BEGIN -->', '<!-- FS_IMG170:END -->', 'FS_IMG170')}

# 열쇠 앞부분마다 줄일 크기(긴 변 픽셀)와 화질
RULES = [
    ('map_', 720, 70),
    ('bld_', 400, 80),
    ('ic_', 112, 86),
    ('deco_', 200, 80),
    ('orn_', 160, 80),
    ('chr_', 220, 82),
    ('tea_', 260, 82),
    ('room_', 900, 72),
    ('fur_', 200, 78),
    ('roof_', 400, 80),
    ('oak', 300, 80),
    # 1.7.0 도감, 이벤트
    ('dex_', 720, 78),
    ('ev_', 720, 75),
    ('fx_', 200, 80),
]
SKIP = {'building_positions'}


def rule(key):
    for pre, size, q in RULES:
        if key.startswith(pre):
            return size, q
    return None


def clean_alpha(im):
    # 거의 불투명한 곳(250~254)은 완전히 불투명하게, 아주 옅은 얼룩(16 이하)은 투명하게 해요
    if im.mode != 'RGBA':
        return im
    a = im.getchannel('A').point(lambda v: 255 if v >= 250 else (0 if v <= 16 else v))
    im.putalpha(a)
    return im


def encode(path):
    key = path.stem
    r = rule(key)
    if not r:
        return None
    size, q = r
    im = Image.open(path)
    im = im.convert('RGBA') if im.mode in ('RGBA', 'LA', 'P') else im.convert('RGB')
    im = clean_alpha(im)
    im.thumbnail((size, size), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'WEBP', quality=q, method=6)
    return key, 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()


def main(dirs, block=''):
    BEGIN, END, VAR = BLOCKS.get(block, ('<!-- FS_IMG:BEGIN -->', '<!-- FS_IMG:END -->', 'FS_IMG'))
    imgs = {}
    for d in dirs:
        for p in sorted(pathlib.Path(d).glob('*.png')):
            if p.stem in SKIP:
                continue
            got = encode(p)
            if got:
                imgs[got[0]] = got[1]
    src = SRC.read_text(encoding='utf-8')
    old = {}
    if BEGIN in src:
        block = src[src.index(BEGIN):src.index(END)]
        for k, v in re.findall(r'"([a-z0-9_]+)":"(data:image/webp;base64,[^"]+)"', block):
            old[k] = v
    old.update(imgs)   # 이번에 준 폴더의 그림만 바꾸고, 전에 넣은 그림은 그대로 둬요
    body = ',\n'.join(f'"{k}":"{v}"' for k, v in sorted(old.items()))
    new = f'{BEGIN}\n<script>window.{VAR}={{\n{body}\n}};</script>\n{END}'
    if BEGIN in src:
        src = src[:src.index(BEGIN)] + new + src[src.index(END) + len(END):]
    elif block:
        sys.exit(f'{BEGIN} 표시가 없어요')
    else:
        at = src.index('\n<script>\n') + 1
        src = src[:at] + new + '\n' + src[at:]
    SRC.write_text(src, encoding='utf-8')
    total = sum(len(v) for v in old.values())
    print(f'그림 {len(old)}개 (이번에 {len(imgs)}개), 글자 크기 {total / 1024:.0f} KB')


if __name__ == '__main__':
    args = sys.argv[1:]
    block = ''
    if args[:1] == ['--block'] and len(args) >= 2:
        block = args[1]; args = args[2:]
        if block not in BLOCKS:
            sys.exit('아는 묶음은 ' + ', '.join(BLOCKS) + '뿐이에요')
    if not args:
        sys.exit('원본 폴더를 적어 주세요')
    main(args, block)
