# 개발용 폴더

협업 규칙은 저장소 맨 위 `CLAUDE.md`(Claude)와 `AGENTS.md`(ChatGPT), 빌드와 버전 절차는 `docs/RELEASE.md`, 시험 목록은 `docs/TESTING.md`에 있어요.

게임을 고칠 때 쓰는 원본과 도구예요. 저장소 맨 위 `index.html`은 여기 `forest-school.html`로 만든 결과물이에요.

| 파일 | 하는 일 |
| --- | --- |
| `forest-school.html` | 게임 원본 (Claude 화면에 올리는 본문) |
| `build_gh.py` | 원본으로 GitHub 판 만들기. `python3 build_gh.py ..` 하면 저장소 맨 위 `index.html`이 새로 생겨요 |
| `gh_README.md`, `gh_database.rules.json` | GitHub 판의 README와 데이터베이스 규칙 원본 |
| `wrap.py` | 시험용 `test.html` 만들기 |
| `s*test.py`, `fbtest/` | Playwright 자동 시험 (가짜 Firebase 서버 포함) |
| `bot.py` | 자동 플레이로 학년마다 걸리는 시간 재기 |
| `qbot.py` | 퀘스트를 따라 하는 자동 플레이로 퀘스트마다 걸리는 시간 재기 (막히는 곳 찾기) |
| `s37test.py` | 교감 선생님 도토리 지원 회귀 시험 (`needCost`, `prepTopUp`, `rate`, 유치원 진행) |
| `check_rules.py` | `CLAUDE.md`와 `AGENTS.md`의 공통 규칙이 똑같은지 확인 |
| `check_templates.py` | Issue 양식이 GitHub 규칙에 맞는지, 양식이 쓰는 라벨이 저장소에 있는지 확인 |
| `memo.md` | 사용자가 말한 수정 메모 (모았다가 한 번에 반영) |

순서: `forest-school.html` 고치기 → `python3 wrap.py` → 시험 → `python3 build_gh.py ..` → `cd ../toss && npm run build` → 커밋하고 올리기 (안드로이드는 GitHub Actions가 알아서 만들어요).

반영할 때마다: 저장소 맨 위 `CHANGELOG.md`에 패치노트를 적고 버전을 올려요(사소하면 끝자리, 꽤 중요하면 가운데, 새 학교급이면 앞자리). 버전은 `forest-school.html`의 `VERSION`, `app/android/app/build.gradle`의 `versionName`, `toss/package.json`과 `app/package.json`의 `version`을 함께 바꿔요.

반영이 끝나면 패치노트(CHANGELOG.md)를 GitHub에 적는 것과 함께 Claude 채팅창에도 파일로 보내고, 그 버전 내용을 답에 그대로 보여 줘요. 패치노트는 "1. 교감 선생님 지원량 오류 수정"처럼 번호 붙인 짧은 한 줄로 적어요.
