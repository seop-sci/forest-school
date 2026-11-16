# 자동 시험을 한 번에 돌려요 (5.0.2 개발 기반 정리).
# 쓰는 법: python3 dev/runall.py [묶음이나 번호 ...] [-j 3] [--no-retry] [--list]
#   묶음: quick(웹에 먼저 낼 때 보는 것), ui(화면 넘침과 겹침), save(저장 읽기와 옛 저장), fb(가짜 Firebase 서버), all(전부)
#   번호: 37 128 처럼 적으면 그 시험만. 아무것도 안 적으면 quick.
# 판정: 시험마다 "마지막 줄이 PASS로 시작"하고 "끝 코드 0"이어야 통과예요(끝 코드는 dev/testlib.py가 맞춰요). SKIP은 따로 세요.
# 세 개씩 함께 돌리고(-j), 실패한 것은 끝에 혼자 한 번 다시 돌려요(함께 돌릴 때만 흔들리는 시험이 있어요).
# 끝 코드: 다시 돌려도 실패한 시험이 있으면 1. 아래 '알려진 실패'는 표시만 하고 끝 코드에는 넣지 않아요.
import concurrent.futures as cf, os, pathlib, re, subprocess, sys, time
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
ALL = sorted(int(re.fullmatch(r's(\d+)test\.py', f.name).group(1)) for f in HERE.glob('s*test.py') if re.fullmatch(r's(\d+)test\.py', f.name))
FB = [7, 18, 26, 27, 34, 44, 97, 98, 116, 118]                    # 가짜 Firebase 서버(node, targaryen)가 있어야 해요
GROUPS = {
    'quick': [37, 68, 42, 62, 107, 128, 146, 147, 148],         # + jscheck, driftcheck (아래 EXTRA)
    'ui': [42, 62, 107, 109, 128, 138, 41, 52, 73, 146, 147],
    'save': [148, 117, 66, 54, 72, 100, 147],
    'fb': FB,
    'all': ALL,
}
# 표시만 해 두는 시험(2026-11-17 기준). 고친 것은 여기서 빼요
KNOWN_FAIL = {4: '옛 화면 기준(졸업 탭 단추가 학교 카드로 옮겨짐)', 7: '옛 화면 기준(졸업 탭 단추)', 76: '옛 저장 모양 기준(과학 탐구 실험)'}
DATE = {52, 73, 81, 85, 86, 89, 97, 106, 107, 108, 119, 122, 123}   # 요일을 타요: 월요일(대학 축제 날)에 실패하고 화요일에는 통과했어요
SHAKY = {47, 60, 66, 72, 84, 87, 91, 129, 136}                     # 함께 돌릴 때 가끔 실패해요(혼자 돌리면 통과)
EXTRA = {'quick': [['python3', 'jscheck.py'], ['python3', 'driftcheck.py']], 'all': [['python3', 'jscheck.py'], ['python3', 'driftcheck.py']]}

def run_one(n, timeout=1200):
    t0 = time.time(); env = dict(os.environ)
    if n in FB and 'NODE_PATH' not in env:
        for cand in ('/tmp/tg/node_modules', str(ROOT / 'node_modules')):
            if (pathlib.Path(cand) / 'targaryen').exists(): env['NODE_PATH'] = cand; break
    try:
        r = subprocess.run([sys.executable, f's{n}test.py'], cwd=HERE, capture_output=True, text=True, timeout=timeout, env=env)
        out, code = (r.stdout or '') + (r.stderr or ''), r.returncode
    except subprocess.TimeoutExpired as e:
        out, code = ((e.stdout or b'').decode('utf-8', 'ignore') if isinstance(e.stdout, bytes) else (e.stdout or '')) + '\n시간 초과', 124
    last = ([l.strip() for l in out.strip().split('\n') if l.strip()] or [''])[-1]
    res = 'SKIP' if last.startswith('SKIP') else 'PASS' if (last.startswith('PASS') and code == 0) else 'FAIL'
    return dict(n=n, res=res, code=code, sec=round(time.time() - t0), last=last[:90], out=out)

def main():
    a = sys.argv[1:]
    jobs = int(a[a.index('-j') + 1]) if '-j' in a else 3
    names = [x for i, x in enumerate(a) if not x.startswith('-') and not (i and a[i - 1] == '-j')]
    if '--list' in a:
        for g, L in GROUPS.items(): print(f'{g} ({len(L)}): ' + ' '.join(f's{n}' for n in L))
        print('알려진 실패:', KNOWN_FAIL); print('요일을 타는 시험:', sorted(DATE)); print('가끔 흔들리는 시험:', sorted(SHAKY)); return
    todo, extra = [], []
    for x in (names or ['quick']):
        if x in GROUPS: todo += GROUPS[x]; extra += EXTRA.get(x, [])
        elif x.lstrip('s').isdigit(): todo.append(int(x.lstrip('s')))
        else: print('모르는 묶음이에요:', x); sys.exit(2)
    todo = [n for i, n in enumerate(todo) if n not in todo[:i] and (HERE / f's{n}test.py').exists()]
    t0 = time.time()
    subprocess.run([sys.executable, 'wrap.py'], cwd=HERE, check=True)
    if any(n in FB for n in todo): subprocess.run([sys.executable, 'build_gh.py', 'gh'], cwd=HERE, stdout=subprocess.DEVNULL, check=True)
    bad_extra = []
    for cmd in [c for i, c in enumerate(extra) if c not in extra[:i]]:
        t1 = time.time(); r = subprocess.run(cmd, cwd=HERE, capture_output=True, text=True)
        print(f"{' '.join(cmd[1:]):<14} {'PASS' if r.returncode == 0 else 'FAIL'} {time.time() - t1:4.0f}초"); 
        if r.returncode: bad_extra.append(cmd[1]); print((r.stdout + r.stderr)[-600:])
    res = {}
    with cf.ThreadPoolExecutor(jobs) as ex:
        for r in ex.map(run_one, todo):
            res[r['n']] = r; print(f"s{r['n']:<4} {r['res']} {r['sec']:4d}초  {'' if r['res'] == 'PASS' else r['last']}", flush=True)
    retried = []
    if '--no-retry' not in a:
        for n in [n for n in todo if res[n]['res'] == 'FAIL' and n not in KNOWN_FAIL]:
            r = run_one(n); retried.append(n); r['retry'] = True; r['first'] = res[n]['last']; res[n] = r
            print(f"s{n:<4} 다시: {r['res']} {r['sec']:4d}초  {'' if r['res'] == 'PASS' else r['last']}", flush=True)
    fails = [n for n in todo if res[n]['res'] == 'FAIL']
    real = [n for n in fails if n not in KNOWN_FAIL]
    print(f"\n시험 {len(todo)}개: 통과 {sum(1 for n in todo if res[n]['res'] == 'PASS')}, 건너뜀 {sum(1 for n in todo if res[n]['res'] == 'SKIP')}, 실패 {len(fails)}. 걸린 시간 {round(time.time() - t0)}초(한 번에 {jobs}개)")
    if retried: print('다시 돌려 통과(흔들림): ' + (' '.join(f's{n}' for n in retried if res[n]['res'] == 'PASS') or '없음'))
    for n in fails:
        tag = '알려진 실패: ' + KNOWN_FAIL[n] if n in KNOWN_FAIL else '요일을 타는 시험' if n in DATE else '가끔 흔들리는 시험' if n in SHAKY else '새 실패'
        print(f"  s{n} ({tag})  {res[n]['last']}")
    for n in real:
        (HERE / f'runall_s{n}.log').write_text(res[n]['out'], encoding='utf-8')
    if real: print('실패한 시험의 출력은 dev/runall_s<번호>.log에 있어요')
    ok = not real and not bad_extra
    print('PASS' if ok else 'FAIL'); sys.exit(0 if ok else 1)
main()
