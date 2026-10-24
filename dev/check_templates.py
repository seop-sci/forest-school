# GitHub Issue 양식(.github/ISSUE_TEMPLATE/*.yml)이 GitHub 규칙에 맞는지 확인하고, 양식이 쓰는 라벨이 저장소에 있는지 봐요.
# 쓰는 법: python3 dev/check_templates.py [--labels]   (--labels면 GitHub API로 라벨도 확인, gh 로그인 필요)
import pathlib, re, subprocess, sys, json
import yaml
ROOT = pathlib.Path(__file__).resolve().parent.parent
TYPES = {'markdown', 'textarea', 'input', 'dropdown', 'checkboxes'}
ID_RE = re.compile(r'^[A-Za-z0-9_-]+$')
bad, labels = [], set()
for f in sorted((ROOT / '.github' / 'ISSUE_TEMPLATE').glob('*.yml')):
    d = yaml.safe_load(f.read_text(encoding='utf-8'))
    if f.name == 'config.yml':
        if not isinstance(d.get('blank_issues_enabled', True), bool): bad.append(f'{f.name}: blank_issues_enabled는 true나 false')
        continue
    for k in ('name', 'description', 'body'):
        if not d.get(k): bad.append(f'{f.name}: {k}가 없어요')
    labels |= set(d.get('labels') or [])
    ids = set()
    for i, el in enumerate(d.get('body') or []):
        t = el.get('type')
        if t not in TYPES: bad.append(f'{f.name} body[{i}]: type {t!r}은 쓸 수 없어요')
        if t != 'markdown':
            eid = el.get('id')
            if not eid or not ID_RE.match(eid): bad.append(f'{f.name} body[{i}]: id {eid!r}는 영문, 숫자, -, _ 만')
            if eid in ids: bad.append(f'{f.name}: id {eid} 가 겹쳐요')
            ids.add(eid)
            if not (el.get('attributes') or {}).get('label'): bad.append(f'{f.name} body[{i}]: label이 없어요')
        else:
            if not (el.get('attributes') or {}).get('value'): bad.append(f'{f.name} body[{i}]: markdown value가 없어요')
        opts = (el.get('attributes') or {}).get('options')
        if t == 'dropdown':
            if not opts or len(set(opts)) != len(opts) or any(str(o).strip().lower() == 'none' for o in opts): bad.append(f'{f.name} body[{i}]: dropdown options가 비었거나 겹치거나 None')
        if t == 'checkboxes':
            if not opts or any(not isinstance(o, dict) or not o.get('label') for o in opts): bad.append(f'{f.name} body[{i}]: checkboxes options마다 label이 필요해요')
    print(f'{f.name}: 항목 {len(d.get("body") or [])}개, 라벨 {sorted(labels)}')
if '--labels' in sys.argv and labels:
    out = subprocess.run(['gh', 'api', 'repos/seop-sci/forest-school/labels', '--paginate', '--jq', '.[].name'], capture_output=True, text=True)
    have = set(out.stdout.split('\n')) if out.returncode == 0 else set()
    if out.returncode != 0: bad.append('라벨을 불러오지 못했어요: ' + out.stderr.strip()[:200])
    for l in labels - have: bad.append(f'라벨 {l!r}이 저장소에 없어요')
    if out.returncode == 0: print('저장소 라벨 확인:', ', '.join(sorted(labels & have)))
if bad:
    print('FAIL'); [print(' -', b) for b in bad]; sys.exit(1)
print('PASS')
