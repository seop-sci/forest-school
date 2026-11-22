# 코드 점검 지적 검증(Claude API). dev/ai_claims.json의 지적마다 관련 파일(지적에 적힌 파일, 없으면 영역 파일)을 줄 번호와 함께 보내
# '맞음, 틀림, 모름'과 근거 줄을 받아요. 결과는 dev/ai_out/verify.md. 본부가 '맞음'을 다시 확인해요
import json, pathlib, re, sys
from ailib import ask, usage_line
from ai_audit import numbered

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = pathlib.Path(__file__).resolve().parent / 'ai_out'
MODEL = next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--model=')), 'claude-opus-5-5')
LIMIT = 300_000

SYSTEM = """너는 HTML5 게임 '숲속 동물 학교'의 꼼꼼한 코드 검증자야. 다른 점검자가 낸 버그 지적 하나와 관련 코드(줄 번호 포함)를 줄게.
원본은 src/js 여러 파일을 이어 붙인 한 페이지라 함수와 상수가 파일을 넘어 보여요. 보이지 않는 함수는 이름으로만 짐작하고, 짐작이면 '모름'으로 해.
할 일: 지적을 반박하려고 애써 봐. 이미 있는 방어(가드, sanitize, numFb, try/catch, 표식, CSS pointer-events, 같은 일을 하는 다른 경로)를 찾아.
반박하지 못하고 재현 길이 코드로 이어지면 '맞음'.
답 모양(한국어, 짧게):
판정: 맞음 | 틀림 | 모름
근거: 파일:줄 과 그 줄이 하는 일 3~6줄
영향: 실제로 사용자가 겪는 일 한 줄(맞음일 때), 아니면 '없음'
고치기: 한두 줄(맞음일 때)"""


def files_for(c):
    named = sorted(set(re.findall(r'\b(\d\d[a-z]?-[\w-]+\.js)\b', c['title'] + c['text'])))
    named = [f for f in named if (ROOT / 'src/js' / f).exists()]
    if named and re.search(r'sanitize|저장 읽기|다시 켜', c['text']) and '04-state-save.js' not in named: named.append('04-state-save.js')
    return named or c['files']


def main():
    claims = json.loads((pathlib.Path(__file__).resolve().parent / 'ai_claims.json').read_text(encoding='utf-8'))
    if '--dry' in sys.argv:
        for c in claims: print(c['title'][:50], files_for(c), sum(len(numbered(f)) for f in files_for(c)))
        return
    OUT.mkdir(exist_ok=True)
    md = ['# 코드 점검 지적 검증', '', f'모델 {MODEL}.', '']
    for k, c in enumerate(claims, 1):
        code, n = [], 0
        for f in files_for(c):
            t = numbered(f)
            if n + len(t) > LIMIT: continue
            code.append(t); n += len(t)
        txt = ask(SYSTEM, f"지적({c['area']}): {c['title']}\n{c['text']}\n\n관련 코드:\n\n" + '\n\n'.join(code), MODEL, max_tokens=24000)
        md += [f"## {k}. [{c['area']}] {c['title']}", '', txt.strip(), '']
        (OUT / 'verify.md').write_text('\n'.join(md) + '\n', encoding='utf-8')
        print(f'{k}/{len(claims)} 끝. {usage_line()}', flush=True)
    md += ['', usage_line()]
    (OUT / 'verify.md').write_text('\n'.join(md) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
