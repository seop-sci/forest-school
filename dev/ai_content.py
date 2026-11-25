# 앞으로 쓸 게임 글 재료 만들기(Claude API). 결과는 dev/ai_out/content.json과 content.md
# 졸업생 후일담 편지, 5.5.0 밤하늘 별자리, 학생 부탁 말 바꿔 쓰기, 계절 행사 대사. 후보예요. 본부가 골라 다듬어 코드에 넣어요
# 쓰는 법: GitHub Actions 'AI 글 도우미'에서 job=content. 요청문만 보려면 python3 ai_content.py --dry
import json, pathlib, re, sys
from ailib import ask, usage_line

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = pathlib.Path(__file__).resolve().parent / 'ai_out'
MODEL = next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--model=')), 'claude-opus-5-5')

BASE = """너는 한국 모바일 방치형 게임 '숲속 동물 학교'의 글 작가야.
게임: 교장 선생님(플레이어)이 도토리를 모아 숲속 동물 학교를 유치원부터 초등, 중학교, 고등학교, 대학교, 대학원까지 키워요. 학생은 토끼, 여우, 너구리, 병아리, 아기곰, 다람쥐, 판다 같은 동물이에요. 교감 선생님은 고슴도치, 학교의 첫 학생은 솜이예요. 분위기는 따뜻하고 귀여운 그림책이에요.
글 규칙(꼭 지켜): 초등학생도 읽는 쉬운 한국어. 존댓말은 해요체. 한 줄 45자 안. 가운뎃점(·)을 쓰지 않아요. 이모지, 영어를 쓰지 않아요. 실제 상표, 실제 사람, 종교, 정치, 다툼, 슬픈 일(아픔, 이별, 죽음) 이야기는 하지 않아요. 같은 묶음의 줄끼리 뜻과 첫 낱말이 겹치지 않게.
답은 JSON 하나만, 설명 없이."""


def jobs():
    s = (ROOT / 'src/js/21-counsel-elect-lab.js').read_text(encoding='utf-8')
    return re.findall(r"\{ k: '(\w+)', name: '([^']+)', ab: \d, fac: '\w+', line: '([^']+)'", s)


def tasks():
    J = jobs()
    t = []
    for i in range(0, len(J), 4):
        part = '\n'.join(f'- {k}: {nm} ({ln})' for k, nm, ln in J[i:i + 4])
        t.append(('alumni', f"""졸업생 후일담 편지. 이 학교를 졸업한 학생이 어른이 되어 교장 선생님께 보내는 편지예요. 아래 직업마다 편지 4통.
편지마다 4~6줄. 첫 줄은 인사, 가운데는 그 직업으로 하는 일과 학교에서 배운 것이 이어진 작은 장면, 끝 줄은 감사나 응원. 학생 이름은 {{name}}으로 써요(편지 끝 서명 줄 '{{name}} 올림').
{part}
JSON: {{"직업k": [["줄", ...], ...], ...}}"""))
    for sea in ['봄', '여름', '가을', '겨울']:
        t.append(('stars', f"""5.5.0 '밤하늘 별자리 관측'의 {sea} 별자리 8개. 실제 별자리가 아니라 숲속 동물 학교에만 있는 상상 별자리예요(별 4~9개를 이은 모양).
별자리마다: name(짧은 이름, 예 '도토리 바구니자리'), stars(별 수), shape(별을 어떻게 이었는지 한 줄, 그림 작업에 씀), legend(숲속 전설 3줄), hint(언제 어디서 잘 보이는지 한 줄), say(학생이 처음 찾았을 때 하는 말 한 줄).
{sea} 느낌의 소재로, 다른 계절과 겹치지 않게.
JSON: {{"list": [{{"name": "", "stars": 0, "shape": "", "legend": ["", "", ""], "hint": "", "say": ""}}, ...]}}"""))
    t.append(('gen', """학생 부탁 말 바꿔 쓰기. 지금은 같은 부탁이 늘 같은 말이라 지루해요. 아래 다섯 부탁마다 다른 말 12개.
학생 말투(귀엽고 신난 아이, 해요체). {n}은 개수 자리예요(없는 것은 넣지 않아요).
- fox, picks: 도토리 줍기 시합 {n}개 (지금: '도토리 줍기 시합 한 판 더 해요! 이번엔 {n}개예요.')
- raccoon, ups: 시설 {n}번 고치기 (지금: '시설을 {n}번만 더 반짝반짝하게 고쳐 주세요.')
- bear, trains: 선생님 연수 {n}번 (지금: '선생님들을 연수에 {n}번 더 보내 주세요. 수업이 더 재밌어져요!')
- chick, earned: 도토리 {n}개 모으기 (지금: '도토리 {n}개를 모아서 숲속 잔치를 열어요!')
- rabbit, claims: 학교 문을 닫았다가 다시 오기 (지금: '학교 문을 닫았다가 다시 와 주세요. 그동안 수업이 잘 이어지는지 볼게요.')
JSON: {"picks": [""], "ups": [""], "trains": [""], "earned": [""], "claims": [""]}"""))
    for ev, what in [('spring', '봄 소풍(도시락과 보물찾기)'), ('summer', '여름 캠프(텐트, 반딧불, 물놀이)'), ('autumn', '가을 운동회(달리기, 줄다리기, 박 터뜨리기)'), ('winter', '겨울 축제(눈사람, 눈썰매, 따뜻한 코코아)')]:
        t.append(('event_' + ev, f"""계절 행사 대사: {what}. 해마다 열리는 학교 행사예요.
만들 것: open(교감 고슴도치가 행사를 알리는 두 줄 대화 6개), kids(행사 중 학생들이 하는 짧은 말 24개, 말풍선용 20자 안), cheer(교장 선생님을 부르는 학생 말 6개), close(행사가 끝나고 교감이 하는 한 줄 6개), record(작년 기록을 깼을 때 한 줄 6개, 숫자 대신 {{record}} 자리).
JSON: {{"open": [["", ""]], "kids": [""], "cheer": [""], "close": [""], "record": [""]}}"""))
    return t


def parse(txt):
    t = re.sub(r'```(?:json)?', '', txt); i = t.find('{')
    if i < 0: return None
    try: return json.JSONDecoder().raw_decode(t[i:])[0]
    except json.JSONDecodeError: return None


def main():
    T = tasks()
    if '--dry' in sys.argv:
        print(len(jobs()), 'jobs,', len(T), 'tasks'); print(T[0][1][:500]); return
    OUT.mkdir(exist_ok=True)
    res = {}
    for k, (kind, ask_txt) in enumerate(T, 1):
        raw = ask(BASE, ask_txt, MODEL, max_tokens=16000)
        (OUT / f'raw_content_{k:02d}_{kind}.txt').write_text(raw, encoding='utf-8')
        d = parse(raw)
        if d is None: print(f'{k} {kind}: JSON 못 읽음', flush=True); continue
        if kind in ('alumni', 'stars'):
            tgt = res.setdefault(kind, {} if kind == 'alumni' else [])
            if kind == 'alumni': tgt.update(d)
            else: tgt.extend(d.get('list', []))
        else: res[kind] = d
        print(f'{k}/{len(T)} {kind} 끝. {usage_line()}', flush=True)
    (OUT / 'content.json').write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding='utf-8')
    md = ['# 게임 글 재료 후보', '', f'모델 {MODEL}. {usage_line()}', '']
    for k, v in res.items():
        md += [f'## {k}', '', '```json', json.dumps(v, ensure_ascii=False, indent=1), '```', '']
    (OUT / 'content.md').write_text('\n'.join(md) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
