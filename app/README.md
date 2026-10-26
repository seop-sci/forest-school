# 숲속 동물 학교 안드로이드 판 (구글 플레이)

저장소 맨 위 `index.html`을 안드로이드 앱(Capacitor)으로 감싼 폴더예요. 광고는 구글 애드몹 보상형 광고(`src/ads.js`)를 써요.
업로드 키가 없는 시험 빌드에는 구글 테스트 광고가, 업로드 키로 서명한 빌드에는 진짜 광고가 나와요.
저장은 GitHub 판과 같은 Firebase 서버를 쓰고(`src/fb.js`), 원하는 사람은 설정의 '구글 계정 연결'로 계정에 학교를 묶을 수 있어요(`src/google.js`, 토스 판에는 없어요).
- 구글 로그인 웹 클라이언트 ID: `src/google.js`의 `WEB_CLIENT_ID` (비어 있으면 '구글 계정 연결'이 안 보여요)
- Firebase에 안드로이드 앱(패키지 이름과 SHA-1)을 등록해야 구글 로그인이 돼요. 업로드 키 SHA-1: `4D:A7:9A:01:C0:B0:01:CD:2D:C1:E7:74:8E:BC:4D:3E:E5:73:55:62`
  - **플레이 스토어에서 받은 앱은 구글이 다시 서명해요(앱 서명).** 그래서 플레이 콘솔 > 설정 > 앱 무결성 > 앱 서명의 **"앱 서명 키 인증서" SHA-1**도 Firebase 콘솔 > 프로젝트 설정 > 안드로이드 앱 > 디지털 지문 추가에 꼭 넣어야 해요. 업로드 키만 있으면 스토어 판에서 구글 로그인이 "오류 10"으로 실패해요(2026-10-26에 지섭이 추가함).
  - 1.7.1부터 구글 로그인이나 광고가 실패하면 알림 끝에 오류 코드를 보여 줘요. 구글 로그인 10은 SHA-1 미등록, 광고 3은 지금 줄 광고가 없음(새 앱은 애드몹 검토와 스토어 연결 전까지 자주 나와요), 2는 인터넷이에요.
- 애드몹 앱 ID: `android/app/src/main/res/values/strings.xml`의 `admob_app_id`
- 보상형 광고 단위: `src/ads.js`의 `AD_UNIT`

- 앱 ID: `io.github.seopsci.forestschool` (구글 플레이에 한 번 올리면 바꿀 수 없어요)
- 빌드: `index.html`이나 `app` 폴더가 바뀌면 깃허브 Actions가 자동으로 만들어요. 결과는 Actions > 실행 기록 > Artifacts에서 내려받아요.

## 처음 한 번: 업로드 키 비밀값 넣기
저장소 Settings > Secrets and variables > Actions > New repository secret에서 두 개를 넣어요.

| 이름 | 값 |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | `ANDROID_KEYSTORE_BASE64.txt` 내용 전체 |
| `ANDROID_KEYSTORE_PASSWORD` | `ANDROID_KEYSTORE_PASSWORD.txt` 내용 |

비밀값이 없으면 휴대폰 시험용 디버그 APK만 만들어요. 업로드 키 파일(`forest-school-upload.jks`)과 비밀번호는 잃어버리지 않게 따로 보관해요.
