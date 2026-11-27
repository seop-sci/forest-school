# 개발용 폴더

협업 규칙은 저장소 맨 위 `CLAUDE.md`(Claude)와 `AGENTS.md`(ChatGPT), 빌드와 버전 절차는 `docs/RELEASE.md`, 시험 목록은 `docs/TESTING.md`에 있어요.

게임을 고칠 때 쓰는 원본과 도구예요. 저장소 맨 위 `index.html`은 여기 `forest-school.html`로 만든 결과물이에요.

**2026-11-18 woodani 결정: 원본을 저장소 맨 위 `src/` 여러 파일로 나눴어요.** `src/page/`(머리, 화면 뼈대, 그림 주소표), `src/css/`(꾸밈 세 파일), `src/js/`(기능별 44파일: 퀘스트 표, 저장, 지도, 탐험, 퍼즐, 합치기 등). `forest-school.html`은 이 파일들을 차례대로 이어 붙인 결과물이고, 지금까지의 도구와 시험은 그대로 이 파일을 읽어요.

- 고칠 때: `src/` 파일을 고치고 `python3 wrap.py`(또는 `build_gh.py`)를 돌리면 먼저 `forest-school.html`을 새로 만들어요.
- `forest-school.html`을 직접 고쳤다면 `python3 srcbuild.py split`으로 `src/`에 옮겨요. 직접 고친 파일이 `src/`보다 새로우면 `build`가 덮어쓰지 않고 멈춰요.
- 원본을 직접 고치는 도구(`embed_assets.py`, `img_out.py`, `story_pack.py`, `oak_pack.py`, `embed_audio.py`)는 처음에 `build`, 끝에 `split`을 저절로 불러요.
- 나누는 곳은 `src_parts.txt`(한 줄에 "파일<탭>그 파일이 시작하는 줄의 앞부분"). 새 파일을 만들려면 한 줄을 더하고 `split`.
- `src/`와 `forest-school.html`은 함께 커밋해요. `precheck.sh`와 GitHub Build check가 `python3 srcbuild.py check`로 둘이 같은지 봐요.

| 파일 | 하는 일 |
| --- | --- |
| `srcbuild.py`, `src_parts.txt` | 원본 나누기와 잇기. `build`(src/ → forest-school.html), `split`(거꾸로), `check`(같은지만) |
| `forest-school.html` | `src/`를 이어 붙인 게임 전체(코드와 글, 2.9MB). 그림은 주소(`img/a/열쇠-지문.webp`)만 있고 바이트는 저장소 맨 위 `img/a` 파일에 있어요(2026-11-17부터. 그 전에는 base64로 품어 40MB였어요) |
| `imglib.py`, `img_out.py` | 그림을 원본 밖 파일로 두는 도구. `python3 img_out.py`(원본에 남은 base64 그림을 파일로 꺼냄, 여러 번 돌려도 같음), `--check`(주소마다 파일이 있고 이름의 지문이 내용과 맞는지), `--inline 파일`(그림을 품은 옛 꼴 한 파일로 만들기. 되돌리거나 한 파일로 건넬 때) |
| `build_gh.py` | 원본으로 GitHub 판 만들기. `python3 build_gh.py ..` 하면 저장소 맨 위 `index.html`이 새로 생겨요. 첫머리 github-only 구간에 컴퓨터 웹 크게 보기(DESK, 마우스 넓은 화면이면 같은 주소를 iframe에 담아 키움)가 들어가요 |
| `gh_README.md`, `gh_database.rules.json` | GitHub 판의 README와 데이터베이스 규칙 원본 |
| `wrap.py` | 시험용 `test.html` 만들기. 시험판은 `file://` 주소라 그림(`img/a`)과 곡(`audio`)을 글 안에 base64로 다시 넣어요 |
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
| `embed_audio.py` | 1.7.3 배경음악 넣기. 반복 구간으로 잘라 둔 `bgm_*.m4a`(AAC 80kbps)를 `window.FS_AUD`에 넣어요. 열쇠: `bgm_home`(홈), `bgm_room`(그 밖의 화면), `bgm_festival`(학교 행사), `bgm_play`(미니게임). 곡 원본은 woodani가 Suno 유료 플랜으로 만든 mp3예요. m4a는 `bgm_loop.py`로 만들어요. 반복 구간은 박자에 맞춰 비슷한 곳 두 군데(16박 배수, 60초 이상)를 찾아 자르고, 끝 한 박자를 처음 바로 앞 소리와 겹쳐 이어요(이음매 없이 되풀이). 소리 크기는 -18 LUFS로 맞춰요. 파일이 없으면 게임은 코드 곡으로 돌아가요. 1.7.3에 넣은 구간: bgm_home 12.17~91.67초(이음매 4박자, 귀로 듣고 다시 고름), bgm_room 8.01~101.82초, bgm_festival 28.61~89.07초, bgm_play 25.26~99.45초(이음매 4박자) |
| `make_roofs.py` | 건물 그림에서 지붕만 오려 내요(건물 테마 색을 입힐 때 써요). 결과 폴더를 `embed_assets.py`로 넣어요 |
| `story_pack.py` | 이야기 장면 그림(`img/story`) 이름표 만들기. 새 그림을 `img/story/st_이름.webp`로 넣고 돌리면 파일 이름에 내용 해시를 붙이고 원본의 `ST_PICS` 표를 다시 써요. `--check`는 어긋남만 봐요(`precheck.sh`가 불러요) |
| `app_pack.mjs` | 앱 묶음(안드로이드 `www`, 토스 `dist`)에 넣지 않는 파일을 한 곳에서 정해요. 여기서 뺀 것은 게임이 앱 판에서 웹(`WEB_ROOT`)에서 받아요. 곡 목록은 원본의 `WEB_AUD`를 읽어요 |
| `ai_lines.py`, `ai_proof.py`, `ailib.py` | Claude API(Console 크레딧)로 글 후보 만들기. `ai_lines.py`는 오늘의 손님 대사 후보, `ai_proof.py`는 게임 안 한국어 글 훑어보기(가운뎃점, 맞춤법, 이름 다름, 어려운 말). GitHub Actions 'AI 글 도우미'에서 손으로만 돌리고(키는 저장소 Secrets `ANTHROPIC_API_KEY`), 결과는 새 가지 `ai/<job>-<번호>`의 `dev/ai_out/`에 올라와요. `--dry`로 요청문만 볼 수 있어요. 게임은 API를 부르지 않아요 |
| `minify_web.mjs` | 웹판 압축(주석과 공백만). `pages.yml`이 올릴 사본에만 돌려요. 저장소의 `index.html`은 그대로예요 |

순서: `src/` 고치기 → `python3 wrap.py`(forest-school.html을 먼저 새로 만들어요) → 시험 → `python3 build_gh.py ..` → `cd ../toss && npm run build` → 커밋하고 올리기 (안드로이드는 GitHub Actions가 알아서 만들어요).

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
- 앱보다 웹을 먼저 내야 해요(앱이 받을 파일이 웹에 있어야 해요). 시험은 `s150test.py`(실제 `app/www`로).

## 화면 고치기 모드 (2026-11-17)

사용자(woodani)가 게임 화면을 보면서 글과 자리를 직접 고쳐 보고, 고친 목록을 본부(Claude)에 넘기는 도구예요. 게임 내용은 바뀌지 않아요.

- 여는 곳: 관리자 계정으로 웹판에 들어가 설정에서 버전을 다섯 번 눌러 개발자 메뉴를 열고 "화면 고치기 모드 (관리자)"를 눌러요. 앱(안드로이드, 토스)에서는 단추가 보이지 않아요(`rt.isAdmin && window.FS_WEB_LOCK`).
- 막대: 보기(게임을 평소처럼 눌러 화면을 옮겨요), 글(글을 눌러 고쳐요), 자리(빨간 점은 숨은 생물 자리, 그 밖의 단추나 지도 그림도 끌 수 있어요), 목록, 위아래 옮기기, 끄기.
- 고친 것은 그 화면에서만 보여요. 새로 고치면 원래대로 돌아가고 목록만 남아요(이 기기의 `forest-edit-v1`. 게임 저장 `forest-school-v1`과 따로예요).
- 목록 창의 "복사"를 누르고 대화창에 붙이면 Claude가 원본(`dev/forest-school.html`)에 넣어요. 목록 한 줄은 "글 [화면 / 요소] "옛 글" → "새 글"", "생물 자리 [지도 n번 k째] 옛 자리 → 새 자리(퍼센트)", "자리 [화면 / 요소] 오른쪽 +npx, 아래 +npx" 꼴이에요.
- 코드는 `ED`, `edOn()`, `edOff()`와 `ed`로 시작하는 함수들이에요. 시험은 `s155test.py`.

