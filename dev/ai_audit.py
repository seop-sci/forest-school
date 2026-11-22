# 게임 코드 깊이 점검(Claude API, 센 모델). 결과는 dev/ai_out/audit.md
# 쓰는 법: GitHub Actions 'AI 글 도우미'에서 job=audit. 이 기계에서 영역별 크기만 보려면 python3 ai_audit.py --dry
# 고치지 않아요. 본부가 항목마다 코드로 확인해 (가) 진짜 버그, (나) 개선, (다) 사실과 다름으로 나눠요
import pathlib, sys
from ailib import ask, usage_line

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = pathlib.Path(__file__).resolve().parent / 'ai_out'
MODEL = next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--model=')), 'claude-fable-5-2')
LIMIT = 330_000   # 한 번에 보내는 코드 글자 수(넘으면 나눠요)

SYSTEM = """너는 HTML5 방치형 게임 '숲속 동물 학교'의 코드 점검자야. 원본은 src/js 여러 파일을 차례로 이어 붙인 한 페이지이고(함수와 상수는 파일을 넘어 서로 보여요), 웹(GitHub Pages), 안드로이드(WebView), 토스 미니앱이 같은 원본을 써. 전역 S는 저장(localStorage 'forest-school-v1'), rt는 실행 중 상태야.
이번 요청에는 한 영역에 관련된 파일만 줄 번호와 함께 보여 줄게. 보이지 않는 파일의 함수는 이름과 쓰임으로 짐작하되, 짐작에 기대는 지적은 확신도를 낮춰.

답하는 방식(꼭 지켜):
- 항목마다: 파일과 함수와 줄 / 무엇이 틀리는지 / 재현 방법(어떤 저장 상태나 시각에서 무엇을 하면 어떻게 되는지) / 확신도(높음, 중간, 낮음) / 고치는 방법 한두 줄
- 실제로 틀린 값, 진행 막힘, 저장 깨짐, 보상 두 번, 오류로 멈춤만. 리팩토링 권유, 스타일, 일반론, 성능 미세 조정은 빼.
- 밸런스 숫자(값, 보상, 시간)를 바꾸자는 제안은 하지 마. 계산이 틀린 것(Infinity, NaN, 음수, 단위 어긋남)만 버그로 봐.
- 쓰기 전에 그 함수를 부르는 곳과 이미 있는 방어(sanitize, numFb, cap, esc, textContent, try/catch, rt.adTok 같은 표식)를 꼭 확인해.
- 마지막에 이 영역에서 확신도 높은 것만 5개 이내로 순서를 매겨. 없으면 '없음'.
- 한국어로, 쉬운 말로.

이미 확인하고 끝난 것(다시 지적하지 마):
고친 것(5.3.4.4): fxoShatter 텍스처 누수(FXO.quad), ambLoad 실패 뒤 다시 받기, 진로 도감 정수 addEss, budgetTpl 큰 단위, SAVE_CAP.acorn 1e100, 논문 칭호 PP_TITLES 저장 복원, acctSaveFirst가 쉬던 연결에서 확인을 기다림, 심화 탐험 순위 lkey의 r.hf.
사실과 다르거나 일부러 그런 것: WebGL 앱 4개(일할 때만 그림), dropAvoid와 firstHint의 레이아웃 읽기, slowAnimTick, 폴링 setInterval, Music.timer(숨기면 actx.suspend), 정수와 황금 쓰는 곳 기록 누락(없음), 개발자 단추 S.gold += 100, __forest 중복 키(시험용), nice(Infinity), 랭킹과 손님 이름 XSS(모두 textContent나 esc, 서버 규칙 10글자), localStorage 용량, 광고 대기 AD_GUARD_MS 180초(늦은 신호는 adTok으로 버림), listenSea에 limitToLast(점수 순이 아님), TIER_X와 대학원 학기 길이(밸런스)."""

AREAS = [
    ('저장 호환', '04-state-save.js의 fresh()와 sanitize(), 기능 파일의 sanitizeXxx와 freshXxx. fresh()에는 있는데 sanitize()가 받지 않아 옛 저장이나 클라우드 저장을 읽으면 사라지거나 undefined가 되는 칸, 배열과 객체 모양을 검사하지 않아 나중에 .length나 [k]에서 터지는 칸, 학교급이 바뀔 때 지워야 할 칸이 남는 것. 특히 S.pa(사진첩), S.gn(텃밭), S.ta(조교), S.pp(논문)',
     ['02-tiers.js', '04-state-save.js', '06-research.js', '13-bio-garden.js', '19-stationery.js', '39-achievements.js', '40d-photo.js']),
    ('시간과 날짜 경계', 'gameNow(), gameToday(), kstHour, weekIdx, 요일 계산, 자정과 월요일 넘어갈 때, 기기 시계를 앞뒤로 돌릴 때(오프라인 보상, 공사 끝 시각, 하루 횟수 초기화), 기기 시간대가 KST가 아닐 때',
     ['05-calc-clock.js', '14-teachers-away-ads.js', '25-trip.js', '30-missions.js', '31-tutorial-attendance.js', '36-dex-event.js', '37-season.js', '41-hotfix-start.js']),
    ('행사와 시간 기능', '하루 한 번이나 주마다 열리는 기능(축제, 장터, 교환학생, 대결, 시험)의 날 바뀜과 보상 두 번 받기',
     ['28-festivals.js', '23-exam-battle.js']),
    ('퀘스트 막힘', 'MAIN과 학생 부탁의 qMeasure, qDone, qGoal, goTo, yearLocked가 서로 어긋나 이룰 수 없는 퀘스트, 졸업과 진급과 대학원 반복(repYear) 때 진행 값이 잘못 넘어가는 것',
     ['03-quest-data.js', '33-quests.js', '32-graduation.js', '12-sheet.js']),
    ('클라우드 저장과 서버 규칙', 'cloudPush, cloudClash, cloudVerify, syncGet, revOf, 두 기기 번갈아 쓰기, 오프라인에서 켰다가 연결될 때 새 저장이 옛 저장에 덮이는 길. database.rules.json의 .validate가 클라이언트가 실제로 보내는 문서(statsDoc, 랭킹 put, lookPut, tamRankDoc 등)와 어긋나 쓰기가 조용히 거절되는 칸',
     ['15-cloud-save.js', '16-rank.js', '../../database.rules.json']),
    ('화면과 이벤트', '창을 열거나 다시 그릴 때마다 addEventListener를 다시 붙여 한 번 누르면 두 번 처리되는 곳(보상 두 번, 값 두 번 빠짐), 창 닫힘과 일시정지(rt.paused, rt.modalOpen)가 어긋나 멈추는 곳, <!-- github-only --> 구간이 빠진 앱 판에서 없는 요소를 부르는 곳',
     ['34-ui-core-loop.js', '35-bind.js', '38-common.js', '10-render.js', '11-furniture.js', '24-tier-view.js', '00-boot.js']),
    ('미니게임과 탐험', '퍼즐, 숲속 합치기, 탐험대에서 보상 두 번, 진행 저장 누락, 판이 끝나지 않는 상태, 광고 보상 처리',
     ['26-puzzle.js', '40-merge.js', '18-tam.js']),
    ('학생과 지도와 그 밖', '학생과 지도, 상점, 공부, 상담, 소풍, 이야기, 보상 장면에서 위와 같은 종류의 버그',
     ['08-map.js', '09-students.js', '17-gold-shop.js', '19b-shop-ui.js', '20-study-club.js', '21-counsel-elect-lab.js', '22-picnic-sticker-memory.js', '27-reward-scenes.js', '29-story.js']),
]


def numbered(name):
    p = (ROOT / 'src/js' / name).resolve()
    t = p.read_text(encoding='utf-8')
    rel = p.relative_to(ROOT).as_posix()
    return f'===== {rel} =====\n' + '\n'.join(f'{i}| {l}' for i, l in enumerate(t.split('\n'), 1))


def packs(files):
    out, cur, n = [], [], 0
    for f in files:
        t = numbered(f)
        if cur and n + len(t) > LIMIT: out.append(cur); cur, n = [], 0
        cur.append(t); n += len(t)
    if cur: out.append(cur)
    return out


def main():
    only = next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--areas=')), '')
    pick = [int(x) for x in only.split(',') if x.strip().isdigit()]
    plan = [(a, d, packs(fs)) for i, (a, d, fs) in enumerate(AREAS, 1) if not pick or i in pick]
    if '--dry' in sys.argv:
        for a, d, ps in plan: print(a, [sum(len(x) for x in p) for p in ps])
        return
    OUT.mkdir(exist_ok=True)
    md = ['# 게임 코드 깊이 점검', '', f'모델 {MODEL}(못 쓰면 claude-opus-5-5). 본부가 항목마다 코드로 다시 확인해요.', '']
    for a, d, ps in plan:
        for k, p in enumerate(ps, 1):
            head = f'{a}' + (f' ({k}/{len(ps)})' if len(ps) > 1 else '')
            txt = ask(SYSTEM, f'점검 영역: {a}\n볼 것: {d}\n\n' + '\n\n'.join(p), MODEL, max_tokens=48000)
            md += [f'## {head}', '', txt.strip(), '']
            (OUT / 'audit.md').write_text('\n'.join(md) + '\n', encoding='utf-8')   # 중간에 멈춰도 남게
            print(f'{head} 끝. {usage_line()}', flush=True)
    md += ['', usage_line()]
    (OUT / 'audit.md').write_text('\n'.join(md) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
