# CLAUDE.md — 숲속 동물 학교 (Claude용)

이 저장소는 도토리를 모아 숲속 동물 학교를 키우는 방치형 게임이에요. 웹(GitHub Pages), 안드로이드(구글 플레이), 토스 미니앱 세 판이 같은 원본에서 나와요.
Claude는 구현, 시험, 빌드, PR, 패치노트를 맡아요. 아래 공통 규칙은 AGENTS.md와 똑같아요.

<!-- 공통 규칙 시작: 이 블록은 CLAUDE.md와 AGENTS.md에 글자 하나까지 똑같이 들어가요. 고칠 때는 두 파일을 함께 고치고 `python3 dev/check_rules.py`로 확인해요 -->
## 공통 규칙

### 역할
| 누구 | 하는 일 |
| --- | --- |
| ChatGPT | 기획, 디자인, 소스 분석, 오류 검토, 개발 작업 명세 작성 (GitHub Issue로 등록) |
| Claude | 코드 구현, 테스트 실행, 빌드, GitHub 반영(브랜치와 PR), 패치노트 관리 |
| 사용자(woodani) | 기능 결정, 최종 검수, 배포 승인 |

### 파일 체계 (바꾸지 않아요)
- 게임 원본은 저장소 맨 위 `src/` 폴더의 여러 파일이에요(2026-11-18 woodani 결정: `src/page/` 머리와 화면 뼈대와 그림 주소표, `src/css/` 꾸밈, `src/js/` 기능별 코드). 고칠 때는 `src/` 파일을 고쳐요. `dev/forest-school.html`은 `python3 dev/srcbuild.py build`로 `src/`를 차례대로 이어 붙인 결과물이라 손으로 고치지 않아요(`wrap.py`와 `build_gh.py`가 먼저 만들어요). 나누는 곳은 `dev/src_parts.txt`, 둘이 같은지는 `python3 dev/srcbuild.py check`로 봐요. `src/`와 `dev/forest-school.html`은 함께 커밋해요.
- 그림은 저장소 맨 위 `img/a` 파일이 원본이에요(2026-11-17 woodani 결정). 원본(`src/page/20-img-map.html`)에는 `"열쇠":"img/a/열쇠-지문.webp"` 같은 주소만 있어요. 그림은 `dev/embed_assets.py`로 넣고, 새 파일은 `git add img`로 함께 올려요. `img/a` 파일을 손으로 고치거나 이름을 바꾸지 않아요.
- 저장소 맨 위 `index.html`은 `python3 dev/build_gh.py .`로 만든 결과물이에요. 손으로 고치지 않아요.
- 안드로이드(`app/`)와 토스(`toss/`)는 `index.html`을 가져다 묶어요. `<!-- github-only -->` 표시 구간은 두 판에서 빠져요.
- `config.js`(Firebase 설정), `database.rules.json`(서버 규칙), 안드로이드 앱 ID `io.github.seopsci.forestschool`, 애드몹 ID, 토스 광고 그룹 ID는 사용자가 따로 말하지 않으면 바꾸지 않아요.
- 개발 지침과 도구 설명은 `dev/README.md`, 빌드와 버전 절차는 `docs/RELEASE.md`, 시험 목록은 `docs/TESTING.md`에 있어요.

### 작업 흐름
1. ChatGPT가 작업 명세를 GitHub Issue(템플릿: 작업 요청)로 올려요. 사용자가 그 작업을 하기로 정해요.
2. Claude가 `main`에서 작업 브랜치를 만들어 구현해요. 브랜치 이름은 `feat/…`, `fix/…`, `chore/…`, `docs/…`.
3. Claude가 시험을 돌리고 PR을 열어요. PR 본문에 Issue 번호, 바뀐 파일, 시험 결과(돌린 것과 못 돌린 것), 버전과 패치노트를 적어요.
4. ChatGPT가 PR을 검토해요(아래 필수 검토 기준).
5. 사용자가 승인하면 `main`에 합쳐요. `main`에 합치는 순간 GitHub Pages(웹)가 바뀌므로, 합치기가 곧 웹 배포예요. 안드로이드 빌드는 '앱 내자' 때 `main`의 그 커밋을 `app-release` 가지로 올릴 때만 돌아요(2026-11-17 woodani 결정). 사용자가 "업데이트하자"(또는 "반영해 줘")라고 하면 그 작업의 PR을 `main`에 합치는 승인까지 포함해요. 그 밖에는 사용자 승인 없이 `main`에 합치거나 직접 올리지 않아요.
   - (2026-11-19 woodani 결정) 게임에 영향이 없는 문서만 바꾸는 PR은 사용자 승인 없이 바로 합쳐도 돼요. 문서만이란 `docs/`, `README.md`, `CHANGELOG.md`, `dev/README.md`, `dev/memo.md`, `CLAUDE.md`, `AGENTS.md` 같은 글 파일만 바뀐 것이에요. `src/`, `dev/forest-school.html`, `index.html`, `img/`, `app/`, `toss/`, 시험과 도구, `config.js`, `database.rules.json`, `.github/`이 하나라도 바뀌면 지금처럼 승인을 받아요. 합친 뒤 PR 번호를 사용자에게 알려요.
6. 플레이 콘솔 업로드와 토스 콘솔 업로드는 사용자가 해요. Claude 화면의 게임(아티팩트)도 사용자가 승인한 뒤에 바꿔요("업데이트하자"에 포함).
7. (2026-11-15 woodani 결정) 웹 먼저, 앱은 나중에: "웹에 올려줘"(또는 "업데이트하자")는 `main`에 합쳐 웹만 내는 것이에요. 사용자가 실제 게임에서 확인하고, 고칠 것은 4.4.1.1처럼 웹으로 계속 내요. "앱 내자"라고 하면 그때 토스 판(`forest-school.ait`)을 만들어 보내고, 그 커밋을 `app-release` 가지로 올려(`git push origin main:app-release`) 안드로이드 빌드를 돌리고 위치를 알려요. 웹만 합칠 때는 안드로이드 빌드가 돌지 않아요.

### 필수 검토 기준 (모든 PR)
1. 재화 계산: 도토리, 황금 도토리, 수료증, 기금, 쪽지가 생기거나 줄어드는 곳이 바뀌었는지. 바뀌었다면 값이 유한하고 상식적인 크기인지(Infinity, NaN, 10^15 넘는 값이 없는지), 학교급마다 `costScale()`과 `incomeScale()`에 맞는지.
2. 퀘스트 보상과 진행: `MAIN`과 학생 부탁의 보상(`r`, `rm`, `qReward()`), 완료 조건(`qMeasure()`, `qDone()`), 학년 잠금(`yearLocked()`)이 서로 맞는지. 이룰 수 없어서 진행이 멈추는 퀘스트가 없는지.
3. 저장 데이터 호환: 저장 키 `forest-school-v1`과 기존 필드를 지우거나 뜻을 바꾸지 않아요. 새 필드는 `fresh()`에 기본값을 넣고 `sanitize()`에서 옛 저장을 받아 줘요. Firebase 경로(`forest/saves`, `rank`, `stats`, `moves`, `admins`)와 규칙을 바꾸면 사용자에게 콘솔에서 할 일을 알려요.
4. 기존 UI 기능 보존: 기존 버튼, 탭, 창, 단축 동작(개발자 메뉴 포함)이 그대로 동작하는지. 밝은 화면과 어두운 화면, 휴대폰 너비 360px과 390px에서 겹치거나 넘치지 않는지.
5. 교감 선생님 지원 회귀: `needCost()`, `prepTopUp()`, `rate()`와 메인 퀘스트 진행 조건을 건드렸다면 `dev/s37test.py`가 PASS여야 해요.
6. 디자인과 밸런스: 명세에 없는 디자인이나 밸런스 변경은 하지 않아요. 필요해 보이면 PR에 "제안"으로만 적어요.

### 시험과 보고
- 원본을 고친 PR은 `cd dev && python3 wrap.py` 뒤 관련 시험과 `s37test.py`를 돌려요. 전체 목록은 `docs/TESTING.md`.
- 돌린 시험과 결과, 돌리지 못한 시험과 그 까닭을 PR과 사용자에게 꼭 알려요. 돌리지 않은 시험을 통과했다고 쓰지 않아요.
- (2026-11-15 woodani 결정) 웹에 먼저 낼 때(4.4.1.1 같은 웹 고침)는 빨리 내려고 꼭 필요한 시험만 돌려요: `dev/jscheck.py`(문법), `s37`(교감 선생님 지원), 바뀐 곳에 맞는 시험 몇 개, 화면을 건드렸으면 `s42`, `s62`, `s107`, `s128`, 버전을 올렸으면 `s68`. "앱 내자"로 토스와 안드로이드를 낼 때는 `runall.py app`(약 30개, 10분 안팎, 2026-11-20 woodani 결정)을 돌려요. 전부(`all`, 40분쯤)는 새 학교급처럼 큰 버전에서만.

### 버전과 패치노트
- 게임에 실제 변화가 있을 때만 버전을 올려요. 문서, 시험, 개발 도구만 바뀌면 올리지 않아요.
- 끝자리(1.3.0 → 1.3.1): 사소한 수정. 가운데(1.3.0 → 1.4.0): 꽤 중요한 수정. 앞자리(1.x → 2.0.0): 새 학교급처럼 아주 큰 변화.
- 버전은 네 곳을 함께 바꿔요(`docs/RELEASE.md`). `CHANGELOG.md`에는 "1. 교감 선생님 지원량 오류 수정"처럼 번호 붙인 짧은 한 줄로 적어요.
- 반영이 끝나면 패치노트를 사용자에게 채팅으로도 보내요.
<!-- 공통 규칙 끝 -->

## Claude가 일하는 방법

### 시작할 때
- `main`을 받아 오고(`git fetch origin main`) 작업 브랜치를 만들어요.
- Issue 명세를 읽고, 명세와 공통 규칙이 부딪히면 구현하기 전에 사용자에게 물어요.
- 사용자가 "메모해 줘"라고 하면 고치지 않고 `dev/memo.md`의 "아직 반영 안 함"에 적고 "적어 뒀어요(지금 n개)"라고만 답해요. "반영해 줘"라고 하면 모아 둔 것을 한 번에 구현해요.

### 고칠 때
- `src/` 파일만 고쳐요(`dev/forest-school.html`은 결과물). 원본을 직접 고치는 도구(`embed_assets.py`, `img_out.py`, `story_pack.py`, `oak_pack.py`, `embed_audio.py`)는 끝에 `src/`로 저절로 나눠 넣어요. 시험용 손잡이는 `window.__forest`(`window.__FOREST_TEST`일 때만 생겨요)에 붙여요.
- 새 저장 필드: `fresh()` 기본값 → `sanitize()` 읽기 → 옛 저장 바로잡기 순서로 넣어요.
- 큰 숫자는 `fmt()`, 한국어 조사는 `eul()`, `iga()`, `eun()`을 써요. 가운뎃점(·)은 되도록 쓰지 않아요.

### 시험하고 만들 때
```bash
cd dev
python3 runall.py quick         # 웹에 먼저 낼 때 보는 묶음: 문법, 어긋남 검사, s37(교감 선생님 지원, PASS여야 해요), 화면, 저장 읽기. wrap.py도 함께 돌아요
python3 runall.py 86 120        # 그 밖에 바뀐 곳에 맞는 시험을 번호로 (docs/TESTING.md). 묶음: quick, ui, save, fb, all
python3 runall.py app           # "앱 내자" 때 (약 30개, 10분 안팎)
python3 runall.py all           # 전부(40분쯤): 새 학교급처럼 큰 버전에서만
python3 build_gh.py ..          # 맨 위 index.html 다시 만들기
cd ../toss && npm ci && npm run build   # 토스 판 forest-school.ait (사용자에게 보내요)
```
- 안드로이드는 '앱 내자' 때 `git push origin main:app-release`로 그 커밋을 `app-release` 가지에 올리면 GitHub Actions(`.github/workflows/android.yml`)가 만들어요. 같은 커밋을 다시 빌드하려면 Actions 화면의 Run workflow(사용자)로 해요.
- 가짜 Firebase 서버를 쓰는 시험(s7, s18, s26, s27, s34)은 `targaryen` npm 꾸러미가 필요해요(`NODE_PATH`로 잡아요).
- 시험 하나만 볼 때는 `python3 wrap.py && python3 s37test.py`. 모든 시험은 마지막 줄 PASS와 끝 코드 0으로 판정해요(`dev/testlib.py`).
- 서버 규칙의 원본은 `dev/gh_database.rules.json`이에요. 그곳을 고치고 맨 위 `database.rules.json`으로 복사해요. 밀어 올리기 전에 `sh dev/precheck.sh`(git hook pre-push)로 GitHub 검사와 같은 것을 먼저 봐요.

### 끝낼 때
- PR 본문(템플릿)에 바뀐 파일, 구현 내용, 시험 결과, 못 돌린 시험, 버전과 패치노트를 적어요.
- 사용자에게 PR 주소, 패치노트, 사용자가 할 일(콘솔 설정, 업로드)을 짧게 알려요.
- 커밋 메시지 끝에는 이 세션의 지시대로 Co-Authored-By 줄을 붙여요.
