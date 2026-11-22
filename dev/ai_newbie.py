# 처음 하는 사람 입장 점검(Claude API). 첫 이야기, 튜토리얼, 기능 안내, 처음 메인 퀘스트 글을 차례대로 읽게 하고
# 여덟 살 아이와 처음 하는 어른 입장에서 헷갈리는 곳을 받아요. 결과는 dev/ai_out/newbie.md
import pathlib, re, sys
from ailib import ask, usage_line

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = pathlib.Path(__file__).resolve().parent / 'ai_out'
MODEL = next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--model=')), 'claude-opus-5-5')
N_MAIN = 70

SYSTEM = """너는 모바일 게임 사용자 경험 검토자야. 한국 방치형 게임 '숲속 동물 학교'(도토리를 모아 숲속 동물 학교를 유치원부터 대학원까지 키움)의 처음 한두 시간에 보이는 글을 코드에서 뽑아 차례대로 줄게(이야기, 튜토리얼 세 장, 기능이 처음 열릴 때 안내, 메인 퀘스트 title, how, say 등).
두 사람이 되어 읽어 봐: (1) 처음 게임을 하는 여덟 살 아이, (2) 방치형 게임을 처음 해 보는 30대 어른.
찾을 것: 무엇을 눌러야 할지 모르겠는 곳, 처음 보는 말이 설명 없이 나오는 곳(용어가 나오는 순서), 앞뒤 안내가 서로 다르거나 순서가 어긋난 곳, 보상이나 목표가 헷갈리는 곳, 글이 너무 길거나 한꺼번에 많은 곳, 재미가 끊길 것 같은 곳.
답(한국어, 쉬운 말): 문제마다 '어디(퀘스트 id나 안내 이름) / 누가 헷갈림(아이, 어른, 둘 다) / 무엇이 헷갈림 / 고친 글이나 방법 한두 줄 / 중요도(높음, 중간, 낮음)'. 마지막에 가장 먼저 고칠 5개. 코드나 숫자 밸런스는 말하지 말고 글과 흐름만."""


def grab():
    js = ROOT / 'src/js'
    tut = (js / '31-tutorial-attendance.js').read_text(encoding='utf-8')
    a = tut.index('const TUT = ['); b = tut.index('\n  };', tut.index('const FEAT_TIPS'))
    q = (js / '03-quest-data.js').read_text(encoding='utf-8').split('\n')
    lines, n = [], 0
    for l in q[16:]:
        if re.search(r"\{ id: '", l): n += 1
        if n > N_MAIN: break
        lines.append(l)
    st = (js / '29-story.js').read_text(encoding='utf-8')
    i = st.find('첫 출근'); story = st[max(0, i - 200): i + 6000] if i >= 0 else ''
    return f"[첫 이야기 '첫 출근' 근처 코드]\n{story}\n\n[튜토리얼과 기능 안내]\n{tut[a:b]}\n\n[처음 메인 퀘스트 {N_MAIN}개]\n" + '\n'.join(lines)


def main():
    g = grab()
    if '--dry' in sys.argv: print(len(g)); print(g[:800]); return
    OUT.mkdir(exist_ok=True)
    txt = ask(SYSTEM, g, MODEL, max_tokens=32000)
    (OUT / 'newbie.md').write_text(f'# 처음 하는 사람 입장 점검\n\n모델 {MODEL}. {usage_line()}\n\n' + txt.strip() + '\n', encoding='utf-8')
    print(usage_line())


if __name__ == '__main__':
    main()
