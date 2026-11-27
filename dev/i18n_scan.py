# 다국어 점검: 번역할 한국어 글을 모으고, 언어 사전(맨 위 i18n/<말>.json)마다 얼마나 채웠는지 세요
# 쓰는 법: python3 dev/i18n_scan.py            → 말마다 채운 수와 빠진 글 몇 개
#          python3 dev/i18n_scan.py --list en  → en 사전에 빠진 글을 모두
#          python3 dev/i18n_scan.py --check    → 사전에 자리 표시({n} 등)가 원문과 다르면 실패(끝 코드 1)
# 모으는 글: src/page의 화면 글과 이름표(aria-label, title, placeholder, alt), src/js의 t('…') 첫 글
import json, pathlib, re, sys, html
ROOT = pathlib.Path(__file__).resolve().parent.parent
LANGS = ['en', 'ja', 'es']
HAN = re.compile(r'[가-힣]')

def page_texts():
    out = set()
    for f in sorted((ROOT / 'src/page').glob('*.html')):
        s = f.read_text(encoding='utf-8')
        s = re.sub(r'<script.*?</script>|<style.*?</style>|<!--.*?-->', '', s, flags=re.S)
        for m in re.finditer(r'>([^<>]+)<', s):
            t = html.unescape(m.group(1)).strip()
            if HAN.search(t): out.add(t)
        for m in re.finditer(r'\b(?:aria-label|title|placeholder|alt)="([^"]+)"', s):
            t = html.unescape(m.group(1)).strip()
            if HAN.search(t): out.add(t)
    return out

def js_keys():
    out = set()
    for f in sorted((ROOT / 'src/js').glob('*.js')):
        s = f.read_text(encoding='utf-8')
        for m in re.finditer(r"\bt\(\s*'((?:[^'\\]|\\.)*)'", s):
            k = m.group(1).replace("\\'", "'")
            if HAN.search(k): out.add(k)
    return out

def holes(s):
    return sorted(re.findall(r'\{(\w+)(?:\|[가-힣]+)?\}', s if isinstance(s, str) else json.dumps(s, ensure_ascii=False)))

def main():
    keys = page_texts() | js_keys()
    bad = 0
    for L in LANGS:
        p = ROOT / 'i18n' / f'{L}.json'
        d = json.loads(p.read_text(encoding='utf-8')) if p.exists() else {}
        have = [k for k in keys if k in d]
        miss = sorted(k for k in keys if k not in d)
        print(f'{L}: 채움 {len(have)}/{len(keys)} ({100 * len(have) // max(1, len(keys))}%), 사전 줄 {len(d)}')
        for k, v in d.items():
            if holes(k) != sorted(set(holes(v)) | set()) and holes(k) != holes(v):
                vs = v if isinstance(v, str) else ' / '.join(v.values())
                if set(holes(k)) != set(re.findall(r'\{(\w+)\}', vs)):
                    bad += 1; print(f'  자리 표시가 달라요: {k!r} → {v!r}')
        if '--list' in sys.argv and sys.argv[sys.argv.index('--list') + 1] == L:
            for k in miss: print('  ' + k)
        elif miss:
            print('  빠진 글 예: ' + ' | '.join(miss[:5]))
    if '--check' in sys.argv:
        print('PASS' if not bad else f'FAIL {bad}')
        sys.exit(1 if bad else 0)

main()
