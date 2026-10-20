# 숲속 동물 학교 토스 미니앱 판

저장소 맨 위의 `index.html`(GitHub 테스트판 게임)을 앱인토스용으로 묶는 폴더예요.
GitHub 전용 부분(Firebase 서버 저장, 링크 미리보기)은 빼고, `src/bridge.js`가 토스 기능을 이어 줘요.

| 게임 기능 | 토스에서 쓰는 것 |
| --- | --- |
| 광고 (보충수업, 2배 받기, 까치 핫딜, 황금 도토리) | 리워드 광고 (`loadFullScreenAd`, `showFullScreenAd`) |
| 저장 | 토스 앱 저장소 (`Storage`) |
| 랭킹 | 토스 게임센터 리더보드 (`Game.setLeaderboardScore`, `Game.openLeaderboard`) |
| 로그인 | 게임 로그인 사용자 키 (`getUserKeyForGame`) |
| 나가기 | `closeView` |

## 콘솔에 등록하기

1. https://apps-in-toss.toss.im 콘솔에 가입하고 워크스페이스를 만들어요.
2. 앱을 만들어요.
   - 앱 이름(영문): `forest-school` (`apps-in-toss.config.ts`의 appName과 같아야 해요)
   - 카테고리: 게임
   - 아이콘: `assets/icon-600.png`
   - 가로 썸네일: `assets/thumbnail-1932x828.png`
   - 세로 스크린샷: `assets/01-school.png`, `02-shop.png`, `03-dressed.png` (636 x 1048)
3. 번들을 올려요: 앱 출시 메뉴에서 `forest-school.ait`를 올리고 '토스앱 테스트' QR로 열어 봐요.
   - QR 테스트는 토스에 로그인한 만 19세 이상 워크스페이스 멤버만 할 수 있어요.
4. 광고 그룹을 만들어요: 인앱 광고 > 리워드, 보상 이름 `황금 도토리`, 수량 `1`.
   - 받은 광고 그룹 ID를 `src/bridge.js`의 `AD_GROUP_ID`에 넣고 다시 빌드해요. 그전까지는 테스트 광고가 나와요.
5. 출시 전에 게임 등급분류를 받고 검토를 요청해요.

## 다시 빌드하기

Node.js 18 이상에서:

```bash
cd toss
npm install
npm run build      # dist 폴더를 만들고 forest-school.ait로 묶어요
```

게임을 고친 뒤에는 맨 위 `index.html`이 바뀌므로 다시 빌드하면 토스 판에도 그대로 들어가요.
