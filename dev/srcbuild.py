# 2026-11-18 woodani 결정: 게임 원본을 저장소 맨 위 src/ 여러 파일로 나눠요.
# dev/forest-school.html은 src/ 파일들을 차례대로 이어 붙여 만든 결과물이에요(지금까지의 도구와 시험은 그대로 이 파일을 읽어요).
#
# 쓰는 법
#   python3 dev/srcbuild.py build   src/ → dev/forest-school.html (wrap.py와 build_gh.py가 먼저 불러요)
#   python3 dev/srcbuild.py split   dev/forest-school.html → src/ (embed_assets.py, img_out.py처럼 원본을 직접 고치는 도구 뒤에)
#   python3 dev/srcbuild.py check   둘이 같은지 보기만 해요(precheck.sh, GitHub 검사)
#
# 나눌 곳은 dev/src_parts.txt에 있어요. 한 줄에 "파일<탭>그 파일이 시작하는 줄의 앞부분".
# 새 파일을 만들려면 그 표에 한 줄을 더하고(시작하는 줄이 원본에서 한 번만 나오게) split을 돌려요.
import pathlib, sys

DEV = pathlib.Path(__file__).resolve().parent
ROOT = DEV.parent
SRC = ROOT / 'src'
HTML = DEV / 'forest-school.html'
SPEC = DEV / 'src_parts.txt'


def spec():
    out = []
    for line in SPEC.read_text(encoding='utf-8').splitlines():
        if not line.strip() or line.startswith('#'):
            continue
        fn, anchor = line.split('\t', 1)
        out.append((fn, anchor))
    return out


def assemble():
    parts = []
    for fn, _ in spec():
        p = SRC / fn
        if not p.exists():
            sys.exit(f'src/{fn} 파일이 없어요. python3 dev/srcbuild.py split 로 다시 나눠 주세요')
        parts.append(p.read_bytes())
    return b''.join(parts)


def hit(line, anchor):
    # 짧은 표지(<script>, /* 탭 */)는 줄 전체가 같아야 하고, 긴 표지는 줄 앞부분이 같으면 돼요
    return line.rstrip('\r\n') == anchor or (len(anchor) >= 12 and line.startswith(anchor))


def split(text=None):
    data = HTML.read_bytes() if text is None else text
    lines = data.decode('utf-8').splitlines(keepends=True)
    S = spec(); cuts = []; pos = 0
    for i, (fn, anchor) in enumerate(S):
        if i == 0:
            cuts.append(0); continue
        j = pos + 1
        while j < len(lines) and not hit(lines[j], anchor):
            j += 1
        if j >= len(lines):
            sys.exit(f'나눌 곳을 못 찾았어요: {fn} ("{anchor}"). dev/src_parts.txt를 고쳐 주세요')
        cuts.append(j); pos = j
    cuts.append(len(lines))
    keep = set()
    for i, (fn, _) in enumerate(S):
        p = SRC / fn; p.parent.mkdir(parents=True, exist_ok=True)
        body = ''.join(lines[cuts[i]:cuts[i + 1]]).encode('utf-8')
        if not p.exists() or p.read_bytes() != body:
            p.write_bytes(body)
        keep.add(p.resolve())
    for p in SRC.rglob('*'):   # 표에서 빠진 옛 파일은 지워요
        if p.is_file() and p.resolve() not in keep:
            p.unlink()
    if assemble() != data:
        sys.exit('나눈 뒤 다시 이은 결과가 원본과 달라요(버그)')
    return len(S)


def newest_src():
    return max((p.stat().st_mtime for p in SRC.rglob('*') if p.is_file()), default=0)


def build(force=False):
    out = assemble()
    if HTML.exists():
        cur = HTML.read_bytes()
        if cur == out:
            return False
        # dev/forest-school.html을 직접 고쳤는데 src/에 옮기지 않았으면 덮어쓰지 않아요
        if not force and HTML.stat().st_mtime > newest_src():
            sys.exit('dev/forest-school.html이 src/보다 새로워요(원본을 직접 고친 것 같아요).\n'
                     '  고친 것을 살리려면: python3 dev/srcbuild.py split\n'
                     '  src/ 것으로 덮으려면: python3 dev/srcbuild.py build --force')
    HTML.write_bytes(out)
    return True


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'build'
    if cmd == 'build':
        print('src/ → dev/forest-school.html', '새로 만들었어요' if build('--force' in sys.argv) else '바뀐 것 없음')
    elif cmd == 'split':
        print(f'dev/forest-school.html → src/ 파일 {split()}개')
    elif cmd == 'check':
        if not SRC.exists():
            print('src/ 없음(나누기 전)'); sys.exit(0)
        ok = assemble() == HTML.read_bytes()
        print('src/와 dev/forest-school.html이 같아요' if ok else 'src/와 dev/forest-school.html이 달라요. python3 dev/srcbuild.py build(또는 split)를 돌리고 둘 다 올려 주세요')
        sys.exit(0 if ok else 1)
    else:
        sys.exit('build, split, check 가운데 하나를 써요')
