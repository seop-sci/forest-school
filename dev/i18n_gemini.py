# 다국어 번역을 Gemini에게 맡길 때 쓰는 도구
#   내보내기: python3 i18n_gemini.py export [폴더]   (기본 폴더 ../i18n_work)
#     dev/i18n_keys.json에서 아직 번역이 없는 글을 묶음(JSON) 여러 개로 나눠요. 01~ 은 용어 묶음(짧은 이름과 낱말), 그다음이 화면 글이에요.
#     시험 문제(23-exam-battle)는 현지에 맞게 바꿔야 해서 따로(시험문제 묶음) 내보내요.
#     번호와 원문 짝(ids.json)을 함께 남겨요. 묶음을 다시 만들어도 번호는 그대로예요.
#   들여오기: python3 i18n_gemini.py import 파일...   (Gemini가 돌려준 JSON. {"번호": {"en": "...", "ja": "...", "es": "..."}})
#     자리 표시({0}, {name}), 글 안 태그(<b> 등), 통째 자리 수가 원문과 같은지 보고, 맞는 것만 i18n/en.json, ja.json, es.json에 넣어요.
#     용어 묶음을 들여오면 용어집(glossary.json)도 새로 만들어요. 다음 묶음을 Gemini에 줄 때 함께 올려요.
import json, pathlib, re, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
LANGS = ('en', 'ja', 'es')
HOLE = re.compile(r'\{(\w+)(?:\|[가-힣]+)?\}')
TAG = re.compile(r'</?[a-z]+>')
WHERE = {
  'page/10-body.html': '화면 뼈대(단추, 탭, 창 제목, 설정)', 'js/01-numbers.js': '게임 수치 이름', 'js/02-tiers.js': '학교급, 종업식, 졸업식',
  'js/03-quest-data.js': '메인 퀘스트와 학생 부탁(이야기 글)', 'js/05-calc-clock.js': '시간과 계산 안내', 'js/06-research.js': '연구 투자, 숫자',
  'js/07-sound-music.js': '소리', 'js/08-map.js': '지도', 'js/09-students.js': '학생들(지도 위 말풍선)', 'js/10-render.js': '홈 화면', 'js/11-furniture.js': '시설 안 가구',
  'js/12-sheet.js': '건물 창', 'js/13-bio-garden.js': '생물 도감과 텃밭(생물 이름과 설명)', 'js/14-teachers-away-ads.js': '선생님, 돌아왔을 때, 광고',
  'js/15-cloud-save.js': '저장, 계정, 공지', 'js/16-rank.js': '랭킹', 'js/17-gold-shop.js': '황금 도토리 상점', 'js/18-tam.js': '숲속 탐험대(전투)', 'js/18b-tam-exp.js': '탐험 원정',
  'js/19-stationery.js': '문방구', 'js/19b-shop-ui.js': '상점 거리', 'js/20-study-club.js': '학생 명부와 동아리', 'js/21-counsel-elect-lab.js': '진로 상담, 반장 선거, 연구실(대화 글)',
  'js/22-picnic-sticker-memory.js': '소풍, 스티커, 추억', 'js/23-exam-battle.js': '시험과 숲속 대결(문제)', 'js/24-tier-view.js': '학교급 모습 보기', 'js/25-trip.js': '현장체험학습',
  'js/26-puzzle.js': '블록 퍼즐', 'js/27-reward-scenes.js': '보상 창', 'js/28-festivals.js': '학교 행사', 'js/29-story.js': '이야기 장면(대사)', 'js/30-missions.js': '오늘의 미션',
  'js/31-tutorial-attendance.js': '튜토리얼과 출석', 'js/32-graduation.js': '종업식과 졸업식', 'js/33-quests.js': '퀘스트 화면', 'js/33b-guest.js': '오늘의 손님(대사)',
  'js/34-ui-core-loop.js': '창 관리', 'js/35-bind.js': '단추 동작 알림', 'js/36-dex-event.js': '도감과 이벤트', 'js/37-season.js': '숲속 패스', 'js/39-achievements.js': '업적과 칭호',
  'js/40-merge.js': '숲속 합치기', 'js/40c-world.js': '마을', 'js/40d-photo.js': '사진첩', 'js/40e-use.js': '놀이 기록', 'js/41-hotfix-start.js': '시작',
}
EXAM = 'js/23-exam-battle.js'
SIZE = 400

def load(p, d=None):
    try: return json.loads(pathlib.Path(p).read_text())
    except FileNotFoundError: return d
def dic(l): return load(ROOT / f'i18n/{l}.json', {})
def save(p, o): pathlib.Path(p).write_text(json.dumps(o, ensure_ascii=False, indent=1) + '\n')
def save_chunk(p, name, items):   # 한 줄에 글 하나(Gemini가 읽기 쉽고 짧아요)
    body = ',\n'.join(' ' + json.dumps(x, ensure_ascii=False) for x in items)
    pathlib.Path(p).write_text('{"묶음": %s, "글 수": %d, "items": [\n%s\n]}\n' % (json.dumps(name, ensure_ascii=False), len(items), body))

def export(out):
    out = pathlib.Path(out); out.mkdir(parents=True, exist_ok=True)
    keys = load(ROOT / 'dev/i18n_keys.json')
    ids = load(ROOT / 'dev/i18n_ids.json', {})          # 원문 → 번호 (번호는 한 번 정하면 그대로)
    nxt = max(map(int, ids.values()), default=0) + 1
    for k in keys:
        if k not in ids: ids[k] = nxt; nxt += 1
    save(ROOT / 'dev/i18n_ids.json', ids)
    have = [dic(l) for l in LANGS]
    todo = [k for k in keys if not all(k in h for h in have)]
    term = [k for k in todo if len(k) <= 6 and '{' not in k and '<' not in k and EXAM not in keys[k]]
    exam = [k for k in todo if keys[k] == [EXAM]]
    rest = [k for k in todo if k not in term and k not in exam]
    item = lambda k: {'id': ids[k], 'ko': k, 'where': ', '.join(WHERE.get(f, f) for f in keys[k][:2])}
    for f in out.glob('*.json'): f.unlink()
    n = 0
    def write(name, ks):
        nonlocal n
        for i in range(0, len(ks), SIZE):
            n += 1
            save_chunk(out / f'{n:02d}-{name}.json', f'{n:02d}-{name}', [item(k) for k in ks[i:i + SIZE]])
    write('용어', term); write('화면', rest)
    if exam: save_chunk(out / '시험문제.json', '시험문제', [item(k) for k in exam])
    glossary(out)
    print(f'번역할 글 {len(todo)}개: 용어 {len(term)}, 화면 {len(rest)}, 시험 문제 {len(exam)}(따로). 묶음 {n}개 → {out}')

def glossary(out):
    ds = {l: dic(l) for l in LANGS}; gl = {}
    for k in ds['en']:
        if len(k) <= 6 and '{' not in k and '<' not in k and all(k in ds[l] for l in LANGS): gl[k] = {l: ds[l][k] for l in LANGS}
    pathlib.Path(out).mkdir(parents=True, exist_ok=True); save(pathlib.Path(out) / 'glossary.json', dict(sorted(gl.items())))
    return len(gl)

def check(ko, tr):
    """번역 하나가 원문과 맞는지: 자리 표시 이름, 태그 차례, 통째 자리 수"""
    a = sorted(m.group(1) for m in HOLE.finditer(ko)); b = sorted(m.group(1) for m in HOLE.finditer(tr))
    if a != b: return f'자리 표시가 달라요 {a} → {b}'
    if TAG.findall(ko) != TAG.findall(tr): return f'태그 차례가 달라요 {TAG.findall(ko)} → {TAG.findall(tr)}'
    if re.search(r'\{\w+\|[가-힣]+\}', tr): return '조사 표시({0|을})를 지우지 않았어요'
    return ''

def imp(files):
    ids = load(ROOT / 'dev/i18n_ids.json', {}); back = {str(v): k for k, v in ids.items()}
    ds = {l: dic(l) for l in LANGS}
    ok = bad = 0; probs = []; terms = {}
    for f in files:
        raw = pathlib.Path(f).read_text(encoding='utf-8-sig').strip()
        raw = re.sub(r'^```(?:json)?\s*|\s*```$', '', raw)   # Gemini가 코드 칸으로 감싸 줘도 돼요
        o = json.loads(raw)
        if isinstance(o, dict) and 'items' in o: o = {str(x['id']): x for x in o['items']}
        if isinstance(o, list): o = {str(x['id']): x for x in o}
        for i, v in o.items():
            ko = back.get(str(i))
            if ko is None: probs.append(f'{f}: 번호 {i}는 없어요'); bad += 1; continue
            for l in LANGS:
                tr = v.get(l) if isinstance(v, dict) else None
                if tr is None or (tr == '' and len(ko) > 1): probs.append(f'{i} {l}: 번역이 없어요 | {ko}'); bad += 1; continue
                if isinstance(tr, dict):   # 복수형 {"one": ..., "other": ...}
                    e = '' if 'other' in tr else '복수형에 other가 없어요'
                    e = e or next((check(ko, x) for x in tr.values() if check(ko, x)), '')
                else: e = check(ko, str(tr))
                if e: probs.append(f'{i} {l}: {e} | {ko}'); bad += 1; continue
                ds[l][ko] = tr; ok += 1
                if len(ko) <= 6 and '{' not in ko: terms.setdefault(ko, {})[l] = tr
    for l in LANGS: save(ROOT / f'i18n/{l}.json', dict(sorted(ds[l].items())))
    g = glossary(ROOT / 'i18n_work')
    print(f'넣음 {ok}, 고칠 것 {bad}. 용어집 {g}개 → i18n_work/glossary.json')
    for p in probs[:60]: print('  ', p)
    if len(probs) > 60: print(f'  … {len(probs) - 60}개 더')

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'export': export(sys.argv[2] if len(sys.argv) > 2 else ROOT / 'i18n_work')
    elif len(sys.argv) > 2 and sys.argv[1] == 'import': imp(sys.argv[2:])
    else: print(__doc__ or '쓰는 법: export [폴더] | import 파일...')
