# 그림을 원본 밖 파일로 두는 일의 공통 모듈 (2026-11-17 woodani 결정: 원본 구조 '가').
# 원본(dev/forest-school.html)에는 "열쇠":"img/a/열쇠-지문.webp" 같은 주소만 있고, 그림 바이트는 저장소 맨 위 img/a 파일에만 있어요.
#   externalize(글, 폴더)  글 안의 base64 그림을 파일로 꺼내고 주소로 바꿔요(이미 주소면 그대로). dev/img_out.py와 build_gh.py가 써요
#   inline(글, 폴더)       주소를 다시 base64로 넣어요. wrap.py가 시험판(test.html, file:// 주소)을 만들 때 써요
#   refs(글)              글이 부르는 img/a 파일 이름들
# 파일 이름은 "열쇠-그림 바이트의 sha1 앞 10자.확장자"라서, 이름과 내용이 맞는지 언제든 다시 볼 수 있어요(check).
import base64, hashlib, pathlib, re
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
IMGDIR = ROOT / 'img' / 'a'
SRC = HERE / 'forest-school.html'
_EXT = {'webp': 'webp', 'png': 'png', 'jpeg': 'jpg', 'jpg': 'jpg', 'gif': 'gif'}
_MIME = {'webp': 'webp', 'png': 'png', 'jpg': 'jpeg', 'gif': 'gif'}
_KIND = r'(webp|png|jpeg|jpg|gif)'
_B64 = r'([A-Za-z0-9+/=]+)'
_NAME = r'[A-Za-z0-9_]+-[0-9a-f]{10}\.(?:webp|png|jpg|gif)'
_san = lambda key: re.sub(r'[^A-Za-z0-9_]', '_', key)[:60]

def _write(imgdir, stem, kind, b64, used):
    raw = base64.b64decode(b64)
    name = f"{stem}-{hashlib.sha1(raw).hexdigest()[:10]}.{_EXT.get(kind, 'bin')}"
    f = pathlib.Path(imgdir) / name
    if not f.exists(): f.write_bytes(raw)
    used.add(name)
    return f'img/a/{name}'

def externalize(doc, imgdir=IMGDIR):
    """base64 그림 세 가지 자리를 파일로 꺼내요: (1) 그림 묶음의 "열쇠":"data:..." (2) 퍼즐과 합치기 배경 FS_MINI_BG (3) 로딩 그림 .boot-pic"""
    pathlib.Path(imgdir).mkdir(parents=True, exist_ok=True); used = set()
    doc = re.sub(r'"([A-Za-z0-9_]+)":(\s*)"data:image/' + _KIND + ';base64,' + _B64 + '"',
                 lambda m: f'"{m.group(1)}":{m.group(2)}"{_write(imgdir, _san(m.group(1)), m.group(3), m.group(4), used)}"', doc)
    def mini(m):
        return m.group(1) + re.sub(r'([A-Za-z0-9_]+):"data:image/' + _KIND + ';base64,' + _B64 + '"',
                                   lambda k: f'{k.group(1)}:"{_write(imgdir, "mini_bg_" + k.group(1), k.group(2), k.group(3), used)}"', m.group(2)) + m.group(3)
    doc = re.sub(r'(window\.FS_MINI_BG=\{)([^\n]*?)(\};)', mini, doc)
    doc = re.sub(r'(\.boot-pic\{[^}]*?)url\(data:image/' + _KIND + ';base64,' + _B64 + r'\)',
                 lambda m: f'{m.group(1)}url({_write(imgdir, "boot_pic", m.group(2), m.group(3), used)})', doc)
    return doc, used

def refs(doc):
    return set(re.findall(r'img/a/(' + _NAME + ')', doc))

def _data(imgdir, name):
    raw = (pathlib.Path(imgdir) / name).read_bytes()
    return f"data:image/{_MIME[name.rsplit('.', 1)[1]]};base64,{base64.b64encode(raw).decode()}"

def inline(doc, imgdir=IMGDIR):
    """externalize의 거꾸로. 시험판은 file:// 주소라 그림을 글 안에 다시 넣어요(곡을 넣는 것과 같아요)"""
    n = [0]
    def entry(m):
        if not m.group(3).startswith(_san(m.group(1)) + '-'): return m.group(0)
        n[0] += 1; return f'"{m.group(1)}":{m.group(2)}"{_data(imgdir, m.group(3))}"'
    doc = re.sub(r'"([A-Za-z0-9_]+)":(\s*)"img/a/(' + _NAME + ')"', entry, doc)
    def mini(m):
        def one(k):
            n[0] += 1; return f'{k.group(1)}:"{_data(imgdir, k.group(2))}"'
        return m.group(1) + re.sub(r'([A-Za-z0-9_]+):"img/a/(mini_bg_' + _NAME + ')"', one, m.group(2)) + m.group(3)
    doc = re.sub(r'(window\.FS_MINI_BG=\{)([^\n]*?)(\};)', mini, doc)
    def boot(m):
        n[0] += 1; return f'{m.group(1)}url({_data(imgdir, m.group(2))})'
    doc = re.sub(r'(\.boot-pic\{[^}]*?)url\(img/a/(boot_pic-[0-9a-f]{10}\.(?:webp|png|jpg|gif))\)', boot, doc)
    return doc, n[0]

def check(doc, imgdir=IMGDIR):
    """글이 부르는 파일이 모두 있고, 파일 이름의 지문이 내용과 맞는지. 틀린 것의 목록을 돌려줘요"""
    bad = []
    for name in sorted(refs(doc)):
        f = pathlib.Path(imgdir) / name
        if not f.exists(): bad.append(f'없는 파일 {name}'); continue
        if hashlib.sha1(f.read_bytes()).hexdigest()[:10] != name.rsplit('.', 1)[0].rsplit('-', 1)[1]: bad.append(f'내용이 이름과 다른 파일 {name}')
    if re.search(r'data:image/' + _KIND + ';base64,', doc): bad.append('글 안에 base64 그림이 남아 있어요(python3 dev/img_out.py 로 꺼내요)')
    return bad
