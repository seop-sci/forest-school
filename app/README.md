# 숲속 동물 학교 안드로이드 판 (구글 플레이)

저장소 맨 위 `index.html`을 안드로이드 앱(Capacitor)으로 감싼 폴더예요. 광고는 구글 애드몹 보상형 광고(`src/ads.js`)를 써요.
업로드 키가 없는 시험 빌드에는 구글 테스트 광고가, 업로드 키로 서명한 빌드에는 진짜 광고가 나와요. 저장은 휴대폰 안에만 해요.
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
