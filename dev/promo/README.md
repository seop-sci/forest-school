# 홍보물 만들기 도구 (2026-11-14, 4.3.2.1 화면)

스토어 스크린샷, 피처 그래픽, 광고 이미지, 홍보 영상을 실제 게임 화면으로 만드는 스크립트예요. 이 세션의 `/home/claude/promo`에서 쓰던 것을 그대로 옮겨서 경로가 절대 경로예요. 다시 쓸 때는 경로만 맞춰 주세요.

## 준비
1. 저장소 맨 위에서 `python3 -m http.server 8765` (게임 index.html)
2. 작업 폴더에서 `npm i @fontsource/jua @fontsource/gowun-dodum @fontsource/gaegu @fontsource/gowun-batang` 뒤 `fonts.css`를 만들고(구글 폰트 대신 쓰는 글꼴), 그 폴더에서 `python3 -m http.server 8766`
3. `boot.png`: 게임의 `.boot-pic` 배경(로딩 그림, 720x1080)을 꺼낸 것

## 순서
- `scenes.py [장면…]`: 장면 원본 찍기(raw/). 시험 손잡이 `window.__forest`로 학교급, 테마, 탐험 층을 맞춰요. `#toast`, 날씨, 즉시 완공 배지는 숨겨요.
- `compose.py`: 플레이 스크린샷 8장(1080x1920, 문구 위)
- `compose2.py`: 피처 그래픽 1024x500, 광고 이미지 1200x628, 1200x1200, 1200x1500
- `rec3.py`: 영상 원본. 게임 시간을 8배 느리게 돌리고(시계, 타이머, 애니메이션) 화면을 찍어 1초에 30장쯤 얻어요. 가상 시간(setVirtualTimePolicy)은 지도 화면에서 멈춰서 쓰지 않아요.
- `vbg.py`: 영상 배경과 문구, 처음과 끝 카드
- `mkvid.py`: 영상 세 가지(세로, 가로, 정사각, 19.5초, bgm_home)
