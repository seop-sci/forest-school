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
| `testlib.py` | 자동 시험의 공통 모듈: `URL`, `base()`, `ctxpage()`, `F`, `CLEAN`, `OVER`, `Checker`(ok와 done), `skip()`. 불러오기만 해도 마지막 줄이 PASS나 SKIP이 아니면 끝 코드 1이 돼요 (예전에는 `s4test.py`가 겸했어요) |
| `runall.py` | 시험을 한 번에 돌려요. `python3 runall.py quick` (묶음: `quick`, `ui`, `save`, `fb`, `all`, 번호도 돼요). 세 개씩 함께, 실패한 것은 한 번 다시, 마지막 줄 PASS와 끝 코드로 판정 |
| `driftcheck.py` | 어긋남 검사: 메인 퀘스트 제목과 설명의 숫자가 조건 n과 같은지, 퀘스트 종류가 `qMeasure`, `qGoal`, `goTo`에 모두 있는지, `fresh()`와 새 학년 시작의 건물 처음 값이 같은지 |
| `golden_make.py`, `golden/` | 저장 읽기 견줌 시험(`s148`)의 표본 40개와 기준. 저장 읽기를 일부러 바꾼 버전에서만 `python3 golden_make.py golden`으로 기준을 다시 적어요 |
| `bot.py` | 자동 플레이로 학년마다 걸리는 시간 재기 |
| `qbot.py` | 퀘스트를 따라 하는 자동 플레이: 새 학교에서 박사 학위까지 퀘스트마다, 학기마다 도토리 시간, 공사 시간, 기다림을 재요. `--json 파일`, `--check [시간]`(오래 걸리는 퀘스트와 Infinity, NaN, 10^15 넘는 재화가 있으면 끝 코드 1), `--until 학교급` |
| `balday.py` | qbot 결과를 접속 방식별(하루 1번, 3번, 자주, 광고 유무) 날 수 표로. `python3 qbot.py --json qbot.json && python3 balday.py qbot.json --md 표.md`. 잰 결과는 `docs/BALANCE-2026-11.md` |
| `s37test.py` | 교감 선생님 도토리 지원 회귀 시험 (`needCost`, `prepTopUp`, `rate`, 유치원 진행) |
| `check_rules.py` | `CLAUDE.md`와 `AGENTS.md`의 공통 규칙이 똑같은지 확인 |
| `check_templates.py` | Issue 양식이 GitHub 규칙에 맞는지, 양식이 쓰는 라벨이 저장소에 있는지 확인 |
| `memo.md` | 사용자가 말한 수정 메모 (모았다가 한 번에 반영) |
| `embed_assets.py` | 1.5.0 그림 넣기. PNG 원본 폴더를 webp로 줄여 `forest-school.html`의 그림 묶음(`window.FS_IMG`)에 넣어요. 원본 PNG는 저장소에 넣지 않아요. 1.7.0 도감, 이벤트 그림은 `--block 170`으로 따로 둔 묶음(`window.FS_IMG170`)에 넣어요 |
| `v170-art-buildings.md` | 1.7.0 그림 작업지시서: 학교급별 건물 외관 13장 (Codex용) |
| `embed_audio.py` | 1.7.3 배경음악 넣기. 반복 구간으로 잘라 둔 `bgm_*.m4a`(AAC 80kbps)를 `window.FS_AUD`에 넣어요. 열쇠: `bgm_home`(홈), `bgm_room`(그 밖의 화면), `bgm_festival`(학교 행사), `bgm_play`(미니게임). 곡 원본은 woodani가 Suno 유료 플랜으로 만든 mp3예요. m4a는 `bgm_loop.py`로 만들어요. 반복 구간은 박자에 맞춰 비슷한 곳 두 군데(16박 배수, 60초 이상)를 찾아 자르고, 끝 한 박자를 처음 바로 앞 소리와 겹쳐 이어요(이음매 없이 되풀이). 소리 크기는 -18 LUFS로 맞춰요. 파일이 없으면 게임은 코드 곡으로 돌아가요. 1.7.3에 넣은 구간: bgm_home 12.17~91.67초(이음매 4박자, 귀로 듣고 다시 고름), bgm_room 8.01~101.82초, bgm_festival 28.61~89.07초, bgm_play 25.26~99.45초(이음매 4박자) |
| `make_roofs.py` | 건물 그림에서 지붕만 오려 내요(건물 테마 색을 입힐 때 써요). 결과 폴더를 `embed_assets.py`로 넣어요 |
| `story_pack.py` | 이야기 장면 그림(`img/story`) 이름표 만들기. 새 그림을 `img/story/st_이름.webp`로 넣고 돌리면 파일 이름에 내용 해시를 붙이고 원본의 `ST_PICS` 표를 다시 써요. `--check`는 어긋남만 봐요(`precheck.sh`가 불러요) |
| `app_pack.mjs` | 앱 묶음(안드로이드 `www`, 토스 `dist`)에 넣지 않는 파일을 한 곳에서 정해요. 여기서 뺀 것은 게임이 앱 판에서 웹(`WEB_ROOT`)에서 받아요. 곡 목록은 원본의 `WEB_AUD`를 읽어요 |
| `minify_web.mjs` | 웹판 압축(주석과 공백만). `pages.yml`이 올릴 사본에만 돌려요. 저장소의 `index.html`은 그대로예요 |

순서: `forest-school.html` 고치기 → `python3 wrap.py` → 시험 → `python3 build_gh.py ..` → `cd ../toss && npm run build` → 커밋하고 올리기 (안드로이드는 GitHub Actions가 알아서 만들어요).

반영할 때마다: 저장소 맨 위 `CHANGELOG.md`에 패치노트를 적고 버전을 올려요(사소하면 끝자리, 꽤 중요하면 가운데, 새 학교급이면 앞자리). 버전은 `forest-school.html`의 `VERSION`, `app/android/app/build.gradle`의 `versionName`, `toss/package.json`과 `app/package.json`의 `version`을 함께 바꿔요.

반영이 끝나면 패치노트(CHANGELOG.md)를 GitHub에 적는 것과 함께 Claude 채팅창에도 파일로 보내고, 그 버전 내용을 답에 그대로 보여 줘요. 패치노트는 "1. 교감 선생님 지원량 오류 수정"처럼 번호 붙인 짧은 한 줄로 적어요.

## 학생 걷는 길 (4.4.1)
- `paths/chains.py`: 지도마다 길 가운데를 따라 찍은 점 줄(지도 그림을 3~4배로 키운 격자 그림을 보고 손으로 찍음). 지도 그림을 바꾸면 여기를 고쳐요.
- `paths/bldmask.py`: 건물을 모두 지은 모습에서 건물 그림이 실제로 덮는 곳을 `paths/bld_<지도 줄>.png`로 그려요(학생 그림이 건물 위에 그려져서 건물 뒤쪽 길은 걷지 않아요).
- `paths/dump.py`, `paths/gen.py`: 자리 표를 꺼내고, 점 줄을 갈림점 그래프로 묶어 건물과 분수에 닿는 조각을 빼고, 끊긴 무리는 70칸 안의 직선으로 이어 `forest-school.html`의 `const MAP_PATHS` 줄을 다시 써요. 확인 그림은 `/tmp/paths_pe*.png`.
- 순서: `python3 wrap.py && python3 paths/dump.py && python3 paths/bldmask.py && python3 paths/gen.py && python3 wrap.py`, 그다음 `s138test.py`, `s41test.py`.

## 앱 묶음에서 빼고 웹에서 받는 것 (5.0.2)
- 앱 판(`APP_PACK()`: 토스 `window.AIT`나 안드로이드 `window.FOREST_STORE`)은 이야기 장면 그림, 테마 곡 7개와 행사, 졸업 곡 5개(`WEB_AUD`), 테마 지도와 참나무 층, 졸업식 그림을 `WEB_ROOT`(GitHub Pages)에서 받아요. 받는 곳을 옮기려면 원본의 `WEB_ROOT` 한 줄만 바꿔요.
- 받은 파일은 Cache Storage(`fs-web-1`)에 남겨요(`webFetch`, `webSrc`, `webImg`). Cache Storage를 못 쓰는 기기는 그냥 받아요.
- 못 받으면: 테마 지도는 묶음 안 기본 지도(`mapKey`가 기본 열쇠로 돌아가요), 이야기는 대사만, 곡은 홈 곡, 졸업식은 예전 장면.
- 앱에는 게임 안 저화질 지도(`img/a/map_*`)가 없어요. 지도를 그리는 곳은 `IMG170(지도 열쇠)` 대신 `mapLo(지도 열쇠)`를 써요.
- 곡 파일을 바꾸면 `AUD_V`, 지도를 바꾸면 `MAPS_V`를 올려요. 이야기 그림은 `story_pack.py`가 해시 이름을 새로 붙여요.
- 앱보다 웹을 먼저 내야 해요(앱이 받을 파일이 웹에 있어야 해요). 시험은 `s145test.py`(실제 `app/www`로).
