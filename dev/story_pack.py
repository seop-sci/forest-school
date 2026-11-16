# 이야기 장면 그림(img/story)의 이름표를 만들어요. (5.0.x 앱 용량 줄이기)
# 그림 파일 이름에 내용 해시를 붙이고(st_ch01-1a2b3c4d5e.webp), 원본의 ST_PICS 표(열쇠 → 해시)를 다시 써요.
# 게임은 이 표에 있는 그림만 받아서 없는 그림을 헛되이 찾지 않고, 내용이 바뀐 그림만 다시 받아요.
# 쓰는 법: 새 그림을 img/story/st_이름.webp로 넣고  python3 dev/story_pack.py  (--check면 고치지 않고 어긋남만 봐요)
import hashlib, pathlib, re, sys
HERE = pathlib.Path(__file__).resolve().parent
DIR = HERE.parent / 'img' / 'story'
SRC = HERE / 'forest-school.html'
CHECK = '--check' in sys.argv
pics = {}
for f in sorted(DIR.glob('*.webp')):
    h = hashlib.sha1(f.read_bytes()).hexdigest()[:10]
    m = re.fullmatch(r'(.+)-([0-9a-f]{10})', f.stem)
    key = m.group(1) if m else f.stem
    if key in pics and not m: continue   # 같은 열쇠의 새 그림(해시 없는 이름)이 먼저 처리돼요
    want = DIR / f'{key}-{h}.webp'
    if f != want:
        if CHECK: print('이름이 내용과 달라요:', f.name); sys.exit(1)
        for old in DIR.glob(f'{key}-*.webp'):
            if old != f and re.fullmatch(re.escape(key) + r'-[0-9a-f]{10}', old.stem): old.unlink()
        f.rename(want)
    pics[key] = h
table = '{' + ','.join(f'{k}:"{v}"' for k, v in sorted(pics.items())) + '}'
src = SRC.read_text(encoding='utf-8')
pat = re.compile(r'(/\* ST_PICS:BEGIN \*/).*?(/\* ST_PICS:END \*/)', re.S)
m = pat.search(src)
if not m: print('원본에서 ST_PICS 표 자리를 찾지 못했어요'); sys.exit(1)
if src[m.start():m.end()] != f'{m.group(1)}{table}{m.group(2)}':
    if CHECK: print('ST_PICS 표가 img/story와 달라요. python3 dev/story_pack.py 를 돌려 주세요'); sys.exit(1)
    SRC.write_text(src[:m.start()] + f'{m.group(1)}{table}{m.group(2)}' + src[m.end():], encoding='utf-8')
print('이야기 그림', len(pics))
