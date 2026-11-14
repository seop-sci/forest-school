# 4.4.1: 게임 원본의 <script> 안 글에 문법 오류가 있으면 알려요(로딩에서 멈추는 일을 막아요). node --check를 써요
import re, subprocess, sys, tempfile, os
src = open(os.path.join(os.path.dirname(__file__), 'forest-school.html'), encoding='utf-8').read()
bad = 0
for i, m in enumerate(re.finditer(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', src, re.S)):
    body = m.group(1)
    if len(body) < 2000 or 'FS_IMG' in body[:200]: continue   # 그림 묶음과 짧은 조각은 넘어가요
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f: f.write(body); p = f.name
    r = subprocess.run(['node', '--check', p], capture_output=True, text=True); os.unlink(p)
    if r.returncode: bad += 1; print('스크립트 문법 오류:\n' + r.stderr[:600])
sys.exit(1 if bad else 0)
