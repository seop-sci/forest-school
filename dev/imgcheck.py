# 4.4.1.3: index.html이 부르는 img/ 파일이 저장소에 모두 있는지 봐요(새 그림 파일을 빠뜨리고 올리면 웹에서 그림이 깨져요)
import re, os, subprocess, sys
root = os.path.join(os.path.dirname(__file__), '..')
html = open(os.path.join(root, 'index.html'), encoding='utf-8').read()
refs = set(re.findall(r'img/[A-Za-z0-9_./-]+\.(?:webp|png|jpg)', html))
tracked = set(subprocess.run(['git', '-C', root, 'ls-files', 'img'], capture_output=True, text=True).stdout.split())
# 5.0.2: 이야기 장면 그림은 이름표(ST_PICS)로 불러요. 표의 그림이 git에 있는지도 봐요
src = open(os.path.join(root, 'dev', 'forest-school.html'), encoding='utf-8').read()
m = re.search(r'/\* ST_PICS:BEGIN \*/\{(.*?)\}/\* ST_PICS:END \*/', src)
if m: refs |= {'img/story/%s-%s.webp' % kv for kv in re.findall(r'([A-Za-z0-9_]+):"([0-9a-f]{10})"', m.group(1))}
miss = sorted(r for r in refs if r not in tracked)
if miss:
    print('git에 없는 그림 파일 %d개 (git add img 를 잊었어요):' % len(miss)); print('\n'.join(miss[:20])); sys.exit(1)
