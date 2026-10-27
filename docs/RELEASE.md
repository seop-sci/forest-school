# 빌드와 버전 관리 (웹, 안드로이드, 토스)

세 판 모두 `dev/forest-school.html` 하나에서 나와요.

```
dev/forest-school.html ──build_gh.py──▶ index.html ──┬─▶ GitHub Pages (웹 테스트판)
                                                    ├─▶ app/ (Capacitor) ─ GitHub Actions ─▶ .aab / .apk (구글 플레이)
                                                    └─▶ toss/ (앱인토스) ─ npm run build ─▶ forest-school.ait
```

## 1. 버전 올리기 (게임에 실제 변화가 있을 때만)

| 곳 | 무엇 |
| --- | --- |
| `dev/forest-school.html` | `const VERSION = 'x.y.z'`, 로딩 화면 `bootVer`의 `vx.y.z`, 설정 정보 `verRow`의 `vx.y.z` (세 군데. `build_gh.py`가 VERSION을 읽어 `index.html` 첫머리에 `<meta name="forest-version">`을 저절로 넣어요. 안드로이드 판 업데이트 알림이 큰 업데이트인지 가릴 때 읽어요) |
| `app/android/app/build.gradle` | `versionName "x.y.z"` (`versionCode`는 Actions 실행 번호로 저절로 올라가요) |
| `app/package.json` | `"version": "x.y.z"` |
| `toss/package.json` | `"version": "x.y.z"` |
| `CHANGELOG.md` | 맨 위에 `## x.y.z (날짜)`와 번호 붙인 짧은 줄 |

규칙: 사소한 수정 끝자리, 꽤 중요한 수정 가운데, 새 학교급 같은 아주 큰 변화 앞자리. 문서, 시험, 개발 도구만 바뀌면 올리지 않아요.

### 게임 안 공지사항 (2.0.0부터, 2026-10-27 지섭)
- 설정 > 공지사항의 글은 `dev/forest-school.html`의 `NOTICES` 맨 위에 넣어요. 접속하면 새 공지 창이 떠요(올라온 뒤 7일, '일주일간 열지 않기'), 버전이 바뀐 뒤 첫 접속에는 한 번 꼭 떠요.
- **업데이트할 때마다 공지도 함께 넣어요**(2026-10-27 지섭). 버전을 올릴 때 NOTICES 맨 위에 그 버전 공지를 더해요.
- **패치노트를 자동으로 넣지 않아요.** CHANGELOG.md는 자세한 기록이고, 공지에는 지섭이 검수해서 정리한 짧은 목록만 넣어요. 지섭이 정리해 주기 전에는 공지를 비워 두고 물어봐요.

## 2. 웹 (GitHub Pages)

```bash
cd dev
python3 wrap.py          # 시험용 test.html
# 시험 (docs/TESTING.md)
python3 build_gh.py ..   # 맨 위 index.html (config.js가 이미 있으면 건드리지 않아요)
```
- `main`에 합쳐지면 1~2분 뒤 https://seop-sci.github.io/forest-school/ 에 반영돼요. 작업 브랜치에서는 바뀌지 않아요.
- `database.rules.json`이 바뀌었다면 사용자가 Firebase 콘솔 > Realtime Database > 규칙에 붙여 넣고 게시해야 해요.

## 3. 안드로이드 (구글 플레이)

- `main`에 `index.html`이나 `app/**`가 바뀌어 합쳐지면 `.github/workflows/android.yml`이 돌아요. 직접 돌릴 때는 Actions에서 Run workflow.
- 결과: Actions 실행 기록 > Artifacts > `forest-school-android-<실행 번호>` (`.aab`는 플레이 콘솔용, `.apk`는 휴대폰 설치용).
- 업로드 키 비밀값(`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`)이 없으면 시험용 디버그 APK만 나와요.
- 플레이 콘솔 업로드는 사용자가 해요. minSdk 24, targetSdk 36 (`app/android/variables.gradle`).

## 4. 토스 미니앱

```bash
cd toss
npm ci
npm run build            # dist/ 만들고 forest-school.ait로 묶어요 (index.html을 씀)
```
- 만든 `toss/forest-school.ait`를 사용자에게 보내면 사용자가 앱인토스 콘솔에 올려요.
- 광고 그룹 ID는 `toss/src/bridge.js`의 `AD_GROUP_ID`. 바꾸지 않아요.

## 5. Claude 화면의 게임 (아티팩트)

- `dev/forest-school.html`을 그대로 같은 아티팩트 주소에 올려요. 사용자가 승인한 뒤에 바꿔요.

## 6. 배포 승인

`main`에 합치기, 아티팩트 바꾸기, 콘솔 업로드는 모두 배포예요. 사용자가 PR이나 채팅에서 승인한 뒤에만 해요.
