# CLAUDE.md와 AGENTS.md의 공통 규칙 블록이 똑같은지 확인해요. 다르면 끝 코드 1
import pathlib, re, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
pat = re.compile(r'<!-- 공통 규칙 시작.*?<!-- 공통 규칙 끝 -->', re.S)
blocks = {}
for name in ('CLAUDE.md', 'AGENTS.md'):
    m = pat.search((ROOT / name).read_text(encoding='utf-8'))
    if not m: print(f'{name}: 공통 규칙 블록이 없어요'); sys.exit(1)
    blocks[name] = m.group(0)
if blocks['CLAUDE.md'] != blocks['AGENTS.md']:
    import difflib
    print('공통 규칙이 서로 달라요:')
    print('\n'.join(difflib.unified_diff(blocks['CLAUDE.md'].splitlines(), blocks['AGENTS.md'].splitlines(), 'CLAUDE.md', 'AGENTS.md', lineterm='')))
    sys.exit(1)
print('공통 규칙 일치')
