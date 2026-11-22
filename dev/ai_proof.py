# 게임 안 한국어 글 훑어보기(Claude API). 결과는 dev/ai_out/proof.md와 proof.json
# 쓰는 법: GitHub Actions 'AI 글 도우미'에서 job=proof. 이 기계에서 뽑힌 글 수와 첫 요청문만 보려면 python3 ai_proof.py --dry
# 고치기는 하지 않아요. 목록만 만들고, woodani가 고른 것을 본부가 PR로 고쳐요
import glob, json, pathlib, re, sys
from ailib import ask, usage_line

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = pathlib.Path(__file__).resolve().parent / 'ai_out'
MODEL = next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--model=')), 'claude-sonnet-5-5')
CHUNK = 220
STR = re.compile(r"'((?:[^'\\\n]|\\.)*[가-힣](?:[^'\\\n]|\\.)*)'|\"((?:[^\"\\\n]|\\.)*[가-힣](?:[^\"\\\n]|\\.)*)\"|`([^`\n]*[가-힣][^`\n]*)`")

SYSTEM = """너는 한국 모바일 게임 '숲속 동물 학교'의 한국어 글 검수자야. 게임 안에 보이는 글(코드에서 뽑은 문자열)을 보고 고칠 것만 골라.
게임의 글 원칙: 초등학생도 읽는 쉬운 한국어, 해요체, 가운뎃점(·)을 쓰지 않음, 같은 것은 늘 같은 이름.

용어집(이 이름이 맞아요): 도토리, 황금 도토리, 숲의 정수, 수료증, 장학재단 기금(줄여서 기금), 학교 파워, 평판, 교장 선생님, 교감 선생님(고슴도치), 수업료, 시설, 가구, 학생 부탁, 메인 퀘스트, 종업식, 방학식, 졸업식, 탐험대, 숲속 합치기, 퍼즐, 대결, 도감, 업적, 칭호, 사진첩, 텃밭, 장터, 체험학습, 숲속 운동회, 학교 행사, 연구 트리, 논문, 숲속 학회, 조교, 대학원.

고를 것(종류 이름을 그대로 써):
- 가운뎃점: · 가 있음
- 맞춤법: 맞춤법이나 띄어쓰기가 틀림
- 어려운말: 아이에게 어려운 한자어나 외래어가 있고, 쉬운 말로 바꿀 수 있음
- 이름다름: 용어집과 다른 이름으로 같은 것을 부름(예: 정수만, 금도토리)
- 어색함: 문장이 어색하거나 뜻이 헷갈림
- 존댓말: 해요체가 아닌 말투가 섞임(버튼 이름, 제목, 짧은 명사구는 괜찮음)

고르지 말 것: ${...} 안의 코드, HTML 태그와 속성 이름, 개발자 메뉴와 개발용 글, 이름이나 고유명사(동물 이름, 학교 이름), 이미 괜찮은 글. 조사 앞에 ${...}가 있으면 조사는 코드가 바꾸니 고르지 마.
확실한 것만 골라. 애매하면 고르지 마.

답은 JSON 배열 하나만, 설명 없이: [{"id": 번호, "kind": "종류", "fix": "고친 글(바꿀 부분만 고친 전체 글)", "why": "까닭 한마디"}]. 고칠 것이 없으면 []."""


def strings():
    seen, out = {}, []
    files = sorted(glob.glob(str(ROOT / 'src/js/*.js'))) + [str(ROOT / 'src/page/10-body.html')]
    for f in files:
        rel = pathlib.Path(f).relative_to(ROOT).as_posix()
        block = False
        for i, line in enumerate(open(f, encoding='utf-8'), 1):
            code = line
            if not f.endswith('.html'):
                if block:
                    if '*/' not in code: continue
                    code = code.split('*/', 1)[1]; block = False
                code = re.sub(r'/\*.*?\*/', '', code)
                if '/*' in code: code, block = code.split('/*', 1)[0], True
                code = re.sub(r'(^|[^:\\\'"`])//.*$', r'\1', code)
            for m in STR.finditer(code):
                s = next(g for g in m.groups() if g is not None).strip()
                if not s: continue
                if s in seen: seen[s]['n'] += 1; continue
                seen[s] = {'id': len(out), 's': s, 'at': f'{rel}:{i}', 'n': 1}
                out.append(seen[s])
    return out


def main():
    rows = strings()
    chunks = [rows[i:i + CHUNK] for i in range(0, len(rows), CHUNK)]
    if '--dry' in sys.argv:
        print(f'글 {len(rows)}개(겹친 것 뺌), 묶음 {len(chunks)}개, 글자 {sum(len(r["s"]) for r in rows):,}')
        print(SYSTEM[:300]); print('---'); print('\n'.join(f'{r["id"]}\t{r["s"]}' for r in chunks[0][:10])); return
    OUT.mkdir(exist_ok=True)
    found, bad = [], 0
    for k, ch in enumerate(chunks, 1):
        txt = ask(SYSTEM, '아래는 번호와 글이에요(탭으로 나눔).\n' + '\n'.join(f'{r["id"]}\t{r["s"]}' for r in ch), MODEL, max_tokens=8000)
        (OUT / f'raw_{k:02d}.txt').write_text(txt, encoding='utf-8')
        t = re.sub(r'```(?:json)?', '', txt); i = t.find('[')
        try: got = json.JSONDecoder().raw_decode(t[i:])[0] if i >= 0 else []
        except json.JSONDecodeError: got, bad = [], bad + 1
        if not isinstance(got, list): got = []
        for g in got:
            try: r = rows[int(g['id'])]
            except (KeyError, ValueError, IndexError, TypeError): continue
            found.append({'at': r['at'], 'n': r['n'], 'kind': g.get('kind', ''), 'now': r['s'], 'fix': g.get('fix', ''), 'why': g.get('why', '')})
        print(f'묶음 {k}/{len(chunks)}: {len(got)}개', flush=True)
    order = ['가운뎃점', '맞춤법', '이름다름', '어려운말', '어색함', '존댓말']
    found.sort(key=lambda x: (order.index(x['kind']) if x['kind'] in order else 99, x['at']))
    esc = lambda s: str(s).replace('|', '\\|')
    md = ['# 게임 안 한국어 글 훑어보기', '', f'모델 {MODEL}. 글 {len(rows)}개를 보고 {len(found)}개를 골랐어요. 읽지 못한 묶음 {bad}개. {usage_line()}', '']
    for kd in order + ['기타']:
        xs = [x for x in found if (x['kind'] == kd) or (kd == '기타' and x['kind'] not in order)]
        if not xs: continue
        md += [f'## {kd} ({len(xs)}개)', '', '| 자리 | 지금 | 고친 안 | 까닭 |', '| --- | --- | --- | --- |']
        md += [f"| {x['at']}{' 외 ' + str(x['n'] - 1) + '곳' if x['n'] > 1 else ''} | {esc(x['now'])} | {esc(x['fix'])} | {esc(x['why'])} |" for x in xs]
        md.append('')
    (OUT / 'proof.json').write_text(json.dumps(found, ensure_ascii=False, indent=1), encoding='utf-8')
    (OUT / 'proof.md').write_text('\n'.join(md) + '\n', encoding='utf-8')
    print(usage_line())


if __name__ == '__main__':
    main()
