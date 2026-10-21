# 개발용 폴더

게임을 고칠 때 쓰는 원본과 도구예요. 저장소 맨 위 `index.html`은 여기 `forest-school.html`로 만든 결과물이에요.

| 파일 | 하는 일 |
| --- | --- |
| `forest-school.html` | 게임 원본 (Claude 화면에 올리는 본문) |
| `build_gh.py` | 원본으로 GitHub 판 만들기. `python3 build_gh.py ..` 하면 저장소 맨 위 `index.html`이 새로 생겨요 |
| `gh_README.md`, `gh_database.rules.json` | GitHub 판의 README와 데이터베이스 규칙 원본 |
| `wrap.py` | 시험용 `test.html` 만들기 |
| `s*test.py`, `fbtest/` | Playwright 자동 시험 (가짜 Firebase 서버 포함) |
| `bot.py` | 자동 플레이로 학년마다 걸리는 시간 재기 |

순서: `forest-school.html` 고치기 → `python3 wrap.py` → 시험 → `python3 build_gh.py ..` → `cd ../toss && npm run build` → 커밋하고 올리기 (안드로이드는 GitHub Actions가 알아서 만들어요).

반영할 때마다: 저장소 맨 위 `CHANGELOG.md`에 패치노트를 적고 버전을 올려요(사소하면 끝자리, 꽤 중요하면 가운데, 새 학교급이면 앞자리). 버전은 `forest-school.html`의 `VERSION`, `app/android/app/build.gradle`의 `versionName`, `toss/package.json`의 `version`을 함께 바꿔요.
