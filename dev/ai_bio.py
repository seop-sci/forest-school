# 생물 도감 늘리기 후보 만들기(Claude API). 결과는 dev/ai_out/bio.json과 bio.md
# 새 무리 셋(민물고기와 물속 생물, 양서류와 파충류, 버섯과 이끼와 열매)마다 후보 30종을 만들고,
# 다른 요청으로 사실(우리나라에 사는지, 이름, 나오는 달, 멸종위기 등급, 설명)을 한 번 더 점검해요. 본부가 20종씩 골라 코드에 넣어요
# 쓰는 법: GitHub Actions 'AI 글 도우미'에서 job=bio. 요청문만 보려면 python3 ai_bio.py --dry
import json, pathlib, re, sys
from ailib import ask, usage_line

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = pathlib.Path(__file__).resolve().parent / 'ai_out'
MODEL = next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--model=')), 'claude-opus-5-5')
N = 30

BASE = """너는 한국 생물을 잘 아는 생태 교육 전문가이자 어린이 게임 글 작가야.
게임 '숲속 동물 학교'에는 학교 지도 풀숲과 물가에서 생물을 찾아 모으는 '생물 도감'이 있어요(초등학생이 읽어요).
글 규칙(꼭 지켜): 쉬운 한국어, 해요체. 가운뎃점(·)을 쓰지 않아요. 이모지, 영어를 쓰지 않아요(열쇠 k만 영어 소문자).
사실이 틀리면 안 돼요. 확실하지 않은 것은 넣지 말고, 우리나라(한반도)에 실제로 사는 생물만 골라요. 독이 있거나 먹으면 안 되는 것은 설명에 '먹으면 안 돼요'처럼 분명히 적어요.
답은 JSON 하나만, 설명 없이."""

GROUPS = [
    ('water', '민물고기와 물속 생물', '계곡, 냇물, 연못, 논에 사는 민물고기, 가재, 새우, 다슬기, 조개, 물속 곤충의 애벌레(잠자리 애벌레 등) 같은 물속 생물. 모두 물가 자리에서만 나와요(w: 1)'),
    ('herp', '양서류와 파충류', '개구리, 두꺼비, 맹꽁이, 도롱뇽 무리, 거북, 도마뱀, 뱀. 비 오는 날(r: 1)이나 물가(w: 1)에서 잘 나오는 것은 조건을 달아요. 겨울잠을 자는 것은 겨울(12~2월)을 빼요'),
    ('fungi', '버섯과 이끼와 열매', '숲의 버섯, 이끼, 고사리가 아닌 양치식물 조금, 산과 들의 열매(도토리 말고). 버섯은 가을이나 비 온 뒤(r: 1), 열매는 익는 달로'),
]


def current():
    s = (ROOT / 'src/js/13-bio-garden.js').read_text(encoding='utf-8')
    return re.findall(r"^\s+\['(\w+)', '([^']+)', (\d)", s, re.M)


def gen_prompt(g, nm, how, have):
    return f"""생물 도감에 넣을 새 무리 '{nm}' 후보 {N}종을 골라 주세요. {how}.
이미 도감에 있는 생물(겹치면 안 돼요): {', '.join(have)}
고르는 법: 아이들이 이름을 들어 봤거나 숲속 학교 근처에서 볼 법한 흔한 생물 위주로, 희귀한 것(rare)은 {N}종 가운데 4~6종. 멸종위기 야생생물(환경부 지정 Ⅰ급, Ⅱ급)이면 en에 등급을 적고, 아니면 빈칸. 천연기념물이면 설명 끝에 '천연기념물이에요.'.
종마다:
- k: 영어 소문자 열쇠(밑줄 없이 한 낱말, 예 'minnow', 'mandarinfish'), 이미 있는 열쇠와 겹치지 않게
- name: 우리말 이름(국가생물종목록에 있는 표준 이름)
- sci: 학명
- s: 볼 수 있는 달 목록(1~12, 일 년 내내면 [])
- n: 밤에 주로 보이면 1, 아니면 0
- r: 비 오는 날 잘 보이면 1, 아니면 0
- w: 물가에서만 나오면 1, 아니면 0
- rare: 희귀하면 1, 아니면 0
- en: 'Ⅰ급', 'Ⅱ급', 또는 ''
- desc: 도감 설명 두 문장, 합쳐서 60자 안. 생김새 하나와 사는 모습 하나(지금 도감 말투 예: '깨끗한 계곡 근처에 사는 양서류예요. 비 오는 날 밖으로 나와요.')
- art: 그림 작업용 한 줄(색, 무늬, 크기 느낌, 그릴 자세), 30자 안팎
- why: 고른 까닭과 확인 근거 한 줄(어디에 사는지, 언제 보이는지)
JSON: {{"list": [{{"k": "", "name": "", "sci": "", "s": [], "n": 0, "r": 0, "w": 0, "rare": 0, "en": "", "desc": "", "art": "", "why": ""}}]}}"""


def check_prompt(nm, items):
    return f"""아래는 어린이 게임 생물 도감 '{nm}' 후보예요. 다른 사람이 만든 것이라 틀린 곳이 있을 수 있어요. 종마다 꼼꼼히 확인해 주세요.
확인할 것: 1) 한반도에 실제로 사는지(외래종이면 표시) 2) 우리말 이름과 학명이 맞는지 3) 볼 수 있는 달, 밤, 비, 물가 조건이 맞는지 4) 멸종위기 등급과 천연기념물이 맞는지(2026년 기준으로 확실하지 않으면 ok를 false로) 5) 설명 사실이 맞는지, 아이에게 위험한 것(독)은 경고가 있는지 6) 규칙(해요체, 60자 안, 가운뎃점 없음)
종마다 답: k, ok(그대로 써도 되면 true), fix(고칠 칸만 담은 객체, 없으면 {{}}), note(틀린 곳이나 걱정 한 줄, 없으면 ''), keep(도감에 넣기 좋으면 1, 빼는 게 좋으면 0. 외래종, 너무 낯선 것, 확인이 안 되는 것은 0)
후보:
{json.dumps(items, ensure_ascii=False)}
JSON: {{"list": [{{"k": "", "ok": true, "fix": {{}}, "note": "", "keep": 1}}]}}"""


def parse(txt):
    t = re.sub(r'```(?:json)?', '', txt); i = t.find('{')
    if i < 0: return None
    try: return json.JSONDecoder().raw_decode(t[i:])[0]
    except json.JSONDecodeError: return None


def main():
    have = [nm for _, nm, _ in current()]
    if '--dry' in sys.argv:
        print(len(have), 'species now'); print(gen_prompt(*GROUPS[0], have)[:1500]); return
    OUT.mkdir(exist_ok=True)
    res = {}
    keys = {k for k, _, _ in current()}
    for g, nm, how in GROUPS:
        raw = ask(BASE, gen_prompt(g, nm, how, have + [x['name'] for v in res.values() for x in v]), MODEL, max_tokens=32000)
        (OUT / f'raw_bio_{g}_gen.txt').write_text(raw, encoding='utf-8')
        d = parse(raw)
        L = (d or {}).get('list', [])
        L = [x for x in L if isinstance(x, dict) and x.get('k') and x['k'] not in keys]
        for x in L: keys.add(x['k'])
        print(f'{g} 후보 {len(L)}종. {usage_line()}', flush=True)
        raw2 = ask(BASE, check_prompt(nm, L), MODEL, max_tokens=32000)
        (OUT / f'raw_bio_{g}_check.txt').write_text(raw2, encoding='utf-8')
        C = {c.get('k'): c for c in ((parse(raw2) or {}).get('list', [])) if isinstance(c, dict)}
        for x in L:
            c = C.get(x['k'], {})
            x['check'] = {'ok': c.get('ok'), 'fix': c.get('fix') or {}, 'note': c.get('note', ''), 'keep': c.get('keep')}
            for kk, vv in (c.get('fix') or {}).items():
                if kk in x and kk not in ('k',): x[kk] = vv
        res[g] = L
        print(f'{g} 점검 끝(남길 것 {sum(1 for x in L if x["check"]["keep"] == 1)}종). {usage_line()}', flush=True)
    (OUT / 'bio.json').write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding='utf-8')
    md = ['# 생물 도감 늘리기 후보', '', f'모델 {MODEL}. {usage_line()}', '']
    for g, nm, _ in GROUPS:
        md += [f'## {nm}', '', '| 남김 | 이름 | 열쇠 | 달 | 조건 | 등급 | 설명 | 점검 |', '| --- | --- | --- | --- | --- | --- | --- | --- |']
        for x in res.get(g, []):
            cond = ' '.join(t for t, on in (('밤', x.get('n')), ('비', x.get('r')), ('물가', x.get('w')), ('희귀', x.get('rare'))) if on)
            md.append(f"| {'O' if x['check']['keep'] == 1 else 'X'} | {x.get('name','')} | {x['k']} | {','.join(map(str, x.get('s') or [])) or '늘'} | {cond} | {x.get('en','')} | {x.get('desc','')} | {x['check']['note']} |")
        md.append('')
    (OUT / 'bio.md').write_text('\n'.join(md) + '\n', encoding='utf-8')
    print('끝.', usage_line())


if __name__ == '__main__':
    main()
