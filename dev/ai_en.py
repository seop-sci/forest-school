# 영어판 밑글 만들기(Claude API). 게임 안 한국어 글(ai_proof.py와 같은 뽑기)을 영어로. 결과는 dev/ai_out/en.json과 en.tsv
# 나중에 해외판을 낼 때 쓸 재료예요. 지금 게임에는 넣지 않아요
# 쓰는 법: GitHub Actions 'AI 글 도우미'에서 job=en. 글 수만 보려면 python3 ai_en.py --dry
import json, pathlib, re, sys
from ailib import ask, usage_line
from ai_proof import strings

OUT = pathlib.Path(__file__).resolve().parent / 'ai_out'
MODEL = next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--model=')), 'claude-sonnet-5-5')
CHUNK = 200

SYSTEM = """You translate Korean UI and story text of the cozy mobile idle game 'Forest Animal School' (숲속 동물 학교) into natural, simple English for children and casual players.
Glossary (always use): 도토리 acorns, 황금 도토리 golden acorns, 숲의 정수 Forest Essence, 수료증 certificates, 장학재단 기금 scholarship fund, 학교 파워 School Power, 평판 reputation, 교장 선생님 Principal, 교감 선생님 Vice Principal (the hedgehog), 수업료 tuition, 시설 facilities, 학생 부탁 student requests, 메인 퀘스트 main quest, 종업식 end-of-year ceremony, 방학식 vacation ceremony, 졸업식 graduation, 탐험대 Expedition Team, 숲속 합치기 Forest Merge, 대결 Battle, 도감 Collection Book, 업적 achievements, 칭호 titles, 사진첩 photo album, 텃밭 garden, 장터 market, 체험학습 field trip, 숲속 운동회 Forest Sports Day, 연구 트리 research tree, 논문 papers, 숲속 학회 Forest Conference, 조교 TA, 솜이 Somi.
Keep every ${...} expression, HTML tag, attribute, {placeholder}, \\n and emoji exactly as they are; translate only the human text around them. Korean particle helpers next to ${...} can be dropped. Keep it about as short as the Korean (buttons stay short).
Answer with one JSON object only, no explanation: {"id": "English", ...}"""


def main():
    rows = strings()
    chunks = [rows[i:i + CHUNK] for i in range(0, len(rows), CHUNK)]
    if '--dry' in sys.argv:
        print(len(rows), 'strings,', len(chunks), 'chunks'); return
    OUT.mkdir(exist_ok=True)
    got, bad = {}, 0
    for k, ch in enumerate(chunks, 1):
        txt = ask(SYSTEM, '\n'.join(f'{r["id"]}\t{r["s"]}' for r in ch), MODEL, max_tokens=16000)
        t = re.sub(r'```(?:json)?', '', txt); i = t.find('{')
        try: d = json.JSONDecoder().raw_decode(t[i:])[0] if i >= 0 else {}
        except json.JSONDecodeError: d, bad = {}, bad + 1
        for kk, v in (d or {}).items():
            if str(kk).isdigit(): got[int(kk)] = v
        print(f'{k}/{len(chunks)}: {len(d or {})}개', flush=True)
    out = [{'at': r['at'], 'ko': r['s'], 'en': got.get(r['id'], '')} for r in rows]
    (OUT / 'en.json').write_text(json.dumps(out, ensure_ascii=False, indent=0), encoding='utf-8')
    (OUT / 'en.tsv').write_text('자리\t한국어\t영어\n' + '\n'.join(f"{o['at']}\t{o['ko']}\t{o['en']}".replace('\n', ' ') for o in out) + '\n', encoding='utf-8')
    (OUT / 'en.md').write_text(f'# 영어판 밑글\n\n모델 {MODEL}. 글 {len(rows)}개 가운데 {len(got)}개 옮김, 읽지 못한 묶음 {bad}개. {usage_line()}\n', encoding='utf-8')
    print(usage_line())


if __name__ == '__main__':
    main()
