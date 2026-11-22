# 오늘의 손님 대사 후보 만들기(Claude API). 결과는 dev/ai_out/lines.json과 lines.md
# 쓰는 법: GitHub Actions 'AI 글 도우미'에서 job=lines (키는 저장소 Secrets). 이 기계에서 요청문만 보려면 python3 ai_lines.py --dry
# 만든 글은 후보예요. 본부가 고르고 다듬어서 코드에 고정 글로 넣어요(게임은 API를 부르지 않아요)
import json, pathlib, re, sys
from ailib import ask, usage_line

OUT = pathlib.Path(__file__).resolve().parent / 'ai_out'
MODEL = next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--model=')), 'claude-sonnet-5-5')
N_INTRO, N_THANKS, N_ASK = 15, 15, 3

SYSTEM = """너는 한국 모바일 방치형 게임 '숲속 동물 학교'의 대사 작가야.
게임: 교장 선생님(플레이어)이 도토리를 모아 숲속 동물 학교를 유치원부터 대학원까지 키워요. 학생은 토끼, 여우, 너구리, 병아리, 아기곰 같은 아기 동물이에요. 분위기는 따뜻하고 귀여운 그림책이에요.
새 기능 '오늘의 손님': 하루 한 번 손님이 교문 앞에 와서 기다리다가, 교장 선생님이 누르면 짧은 대화(두 줄)를 하고 부탁 하나를 남겨요. 부탁을 들어주면 고맙다는 한 줄을 남기고 돌아가요.

글 규칙(꼭 지켜):
- 쉬운 한국어. 초등학생도 바로 읽는 말. 어려운 한자어와 외래어를 피해요.
- 손님은 교장 선생님께 존댓말(해요체). '교장 선생님'이라고 불러요.
- 한 줄은 35자 안팎, 길어도 45자를 넘지 않아요.
- 가운뎃점(·)을 쓰지 않아요. 말줄임표는 '...' 대신 쓰지 않거나 한 번만.
- 이모지, 영어, 숫자 대신 쓰는 기호를 쓰지 않아요. 따옴표 안에 따옴표를 넣지 않아요.
- 실제 상표, 실제 사람, 종교, 정치, 다툼, 슬픈 일(아픔, 이별, 죽음) 이야기는 하지 않아요.
- 같은 손님의 줄끼리 뜻이나 첫 낱말이 겹치지 않게 골고루.
- 자리표시는 아래에 적힌 것만 그대로 써요: {child}는 학생 이름, {job}은 졸업생의 직업, {n}은 부탁 개수.

답은 JSON 하나만, 설명 없이. 모양:
{"intro": [["첫 줄", "둘째 줄"], ...], "thanks": ["...", ...], "ask": {"부탁종류": ["...", ...], ...}}"""

GUESTS = [
    ('parent_rabbit', '토끼 학생의 엄마. 다정하고 수다스러워요. 당근 머핀을 구워 왔어요. 학생 이름 {child}를 넣어 우리 아이 이야기를 해요.'),
    ('parent_fox', '여우 학생의 아빠. 점잖고 조금 장난기 있어요. 신문을 즐겨 봐요. 학생 이름 {child}를 넣어 우리 아이 이야기를 해요.'),
    ('parent_raccoon', '너구리 학생의 엄마. 꽃을 좋아하고 꼼꼼해요. 학생 이름 {child}를 넣어 우리 아이 이야기를 해요.'),
    ('parent_hen', '병아리 학생의 엄마 닭. 걱정이 많지만 씩씩해요. 따뜻한 도시락을 싸 왔어요. 학생 이름 {child}를 넣어 우리 아이 이야기를 해요.'),
    ('parent_bear', '아기곰 학생의 아빠. 듬직하고 너털웃음을 지어요. 꿀을 좋아해요. 학생 이름 {child}를 넣어 우리 아이 이야기를 해요.'),
    ('alumni', '이 학교를 졸업한 선배. 지금은 {job}(으)로 일해요. 모교와 교장 선생님을 그리워하고 후배들을 응원해요. {job}을 넣는 줄과 안 넣는 줄을 섞어요(조사는 {job}이 받침 있는 말, 없는 말 모두 어색하지 않게 \'{job} 일\', \'{job}로 일해요\'처럼 피해 써요).'),
    ('magpie', '마을 우체부 까치. 소식을 물어 오는 빠르고 명랑한 손님. 숲속 마을의 소식(날씨, 축제, 이웃 이야기)을 전해요.'),
]
ASKS = {
    'picks': '도토리 {n}개 줍기(지도에 떨어진 도토리를 눌러 주워요)',
    'ups': '시설 {n}번 고치기(건물이나 가구 레벨 올리기)',
    'trains': '선생님을 연수에 {n}번 보내기',
    'earned': '수업료로 도토리를 더 모으기({n}개)',
    'rdBooks': '도서관에서 책 {n}권 읽기',
    'gdHarvest': '텃밭에서 작물 {n}개 거두기',
    'cafeteria': '급식실 한 단계 올리기',
}


def prompt(key, desc):
    asks = '\n'.join(f'- {k}: {v}' for k, v in ASKS.items())
    return f"""손님: {key}
누구인지: {desc}

만들 것:
1. intro: 교장 선생님이 눌렀을 때 하는 인사 대화 {N_INTRO}개. 각각 두 줄(첫 줄은 인사나 근황, 둘째 줄은 학교나 학생 이야기). 부탁은 넣지 않아요.
2. thanks: 부탁을 들어준 뒤 고맙다는 한 줄 {N_THANKS}개. 돌아가며 하는 인사가 자연스럽게 들어가도 좋아요.
3. ask: 아래 부탁 종류마다 그 손님다운 부탁 한 줄 {N_ASK}개씩. {{n}}이 있는 종류는 개수 자리에 {{n}}을 넣어요.
{asks}"""


def parse(txt):
    m = re.search(r'\{.*\}', txt, re.S)
    return json.loads(m.group(0)) if m else None


def lint(s):
    bad = []
    if '·' in s: bad.append('가운뎃점')
    if len(s) > 45: bad.append(f'{len(s)}자')
    if re.search(r'[A-Za-z]', s.replace('{child}', '').replace('{job}', '').replace('{n}', '')): bad.append('영어')
    return bad


def main():
    if '--dry' in sys.argv:
        print(SYSTEM); print('---'); print(prompt(*GUESTS[0])); return
    OUT.mkdir(exist_ok=True)
    res, md, warn = {}, ['# 오늘의 손님 대사 후보', '', f'모델 {MODEL}. 글 뒤 [ ]는 규칙 검사에 걸린 것이에요.', ''], 0
    for key, desc in GUESTS:
        d = None
        for _ in range(2):
            d = parse(ask(SYSTEM, prompt(key, desc), MODEL))
            if d: break
        if not d:
            md += [f'## {key}', '', '(JSON을 받지 못했어요)', '']; continue
        res[key] = d
        md += [f'## {key}', '', '### 인사 대화']
        for i, pair in enumerate(d.get('intro', []), 1):
            ls = [f'{x}' + (f" [{', '.join(lint(x))}]" if lint(x) else '') for x in pair]
            warn += sum(1 for x in pair if lint(x))
            md.append(f'{i}. ' + ' / '.join(ls))
        md += ['', '### 고마워요']
        for i, x in enumerate(d.get('thanks', []), 1):
            warn += 1 if lint(x) else 0
            md.append(f'{i}. {x}' + (f" [{', '.join(lint(x))}]" if lint(x) else ''))
        md += ['', '### 부탁']
        for k, xs in (d.get('ask') or {}).items():
            for x in xs:
                warn += 1 if lint(x) else 0
                md.append(f'- {k}: {x}' + (f" [{', '.join(lint(x))}]" if lint(x) else ''))
        md.append('')
    md += ['', f'규칙 검사에 걸린 줄 {warn}개. {usage_line()}']
    (OUT / 'lines.json').write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding='utf-8')
    (OUT / 'lines.md').write_text('\n'.join(md) + '\n', encoding='utf-8')
    print(usage_line())


if __name__ == '__main__':
    main()
