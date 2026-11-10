# 작업지시서 59 — 새 건물 밤 창문 불빛

- 결과: 기본 18장 + 겨울 18장 = **36장**, PNG RGBA, 모두 400×400.
- 기준 저장소: seop-sci/forest-school, main 스냅샷 658a0b8f31181430d1708e96131bc76ed75ff5a9.
- 대상 가지: art/59-glow. 이 폴더의 미술 자료만 추가하며 PR과 main 병합은 하지 않음.
- 제작: 내장 image_gen으로 건물별 밤 모습 36장을 각각 생성한 다음, 생성 픽셀에서 따뜻한 빛만 분리함. 코드로 빛의 모양을 그리거나 건물 원본을 수정하지 않음.
- 정렬: 400×400 원본 좌표의 유리·등 마스크에 잘라 맞춤. 기본/겨울은 같은 마스크를 공유하고, 겨울 원본의 눈 차폐만 추가함. 창틀·식물·빨랫감은 마스크에서 제외함.
- 알파: 벽·지붕·땅은 투명. 유리는 선명하게, 주변 생성 불빛은 낮은 알파로 남김. 바닥 빛은 넣지 않음.
- 기숙사: 방 7곳을 선택하여 약 절반만 점등. 현관 유리와 기존 발코니 등은 별도 점등. 기본/겨울의 방 선택은 같음.
- 글자·숫자·상징을 추가하지 않음. 확인 그림의 파일명 라벨은 설명용임.

## 검사 방법

- a: 저장된 PNG의 가로·세로, RGBA, 네 모서리 알파 0, 빛 픽셀 존재를 확인.
- b: 건물 알파 8/255 이상을 원본 영역으로 정의. 최종 조각의 알파가 0보다 큰 모든 픽셀이 이 영역 안에 있음. 따라서 12px 허용치를 넘는 누출은 0px.
- c: 건물 영역 픽셀 수 대비 빛의 알파가 0보다 큰 픽셀 수. 저장 전에 알파 4/255 미만을 0으로 정리했으며, 가중 면적이 아닌 픽셀 개수로 계산.
- d: 기본/겨울의 원본 유리·등 마스크를 픽셀 단위로 비교해 좌표 차이 0px 확인. 겨울에는 원본의 눈에 가린 영역을 추가로 차폐. 밝기와 실내 빛 질감은 각각의 생성본을 사용하므로 서로 다름.
- 낮/빛만/밤 합성, 50% 중첩 확인 그림을 육안 검토. 밤 확인 그림은 원본 RGB를 0.4배로 만든 뒤 일반 알파 합성.

검사 결과: **36/36 통과**. 불빛 면적 5.41–20.237%. 원본 영역 밖 픽셀 0개. 공통 창 마스크 이동 0px. 검사에서 걸린 항목 없음.

## 파일별 검사표

| 파일 | a 크기·투명 | b 영역 밖 | c 불빛 면적 | d 기본/겨울 위치 |
|---|---|---:|---:|---|
| glow_classroom_on.png | 통과 | 0px | 7.895% | 0px · 통과 |
| glow_classroom_on_winter.png | 통과 | 0px | 6.794% | 0px · 통과 |
| glow_classroom_s2.png | 통과 | 0px | 7.590% | 0px · 통과 |
| glow_classroom_s2_winter.png | 통과 | 0px | 6.355% | 0px · 통과 |
| glow_classroom_s3.png | 통과 | 0px | 7.621% | 0px · 통과 |
| glow_classroom_s3_winter.png | 통과 | 0px | 7.358% | 0px · 통과 |
| glow_classroom_s4.png | 통과 | 0px | 13.493% | 0px · 통과 |
| glow_classroom_s4_winter.png | 통과 | 0px | 11.136% | 0px · 통과 |
| glow_cafeteria_on.png | 통과 | 0px | 11.706% | 0px · 통과 |
| glow_cafeteria_on_winter.png | 통과 | 0px | 11.235% | 0px · 통과 |
| glow_cafeteria_s2.png | 통과 | 0px | 11.438% | 0px · 통과 |
| glow_cafeteria_s2_winter.png | 통과 | 0px | 8.716% | 0px · 통과 |
| glow_cafeteria_s3.png | 통과 | 0px | 11.417% | 0px · 통과 |
| glow_cafeteria_s3_winter.png | 통과 | 0px | 11.403% | 0px · 통과 |
| glow_cafeteria_s4.png | 통과 | 0px | 13.165% | 0px · 통과 |
| glow_cafeteria_s4_winter.png | 통과 | 0px | 14.487% | 0px · 통과 |
| glow_library_on.png | 통과 | 0px | 7.035% | 0px · 통과 |
| glow_library_on_winter.png | 통과 | 0px | 8.453% | 0px · 통과 |
| glow_library_s2.png | 통과 | 0px | 7.705% | 0px · 통과 |
| glow_library_s2_winter.png | 통과 | 0px | 8.003% | 0px · 통과 |
| glow_library_s3.png | 통과 | 0px | 9.555% | 0px · 통과 |
| glow_library_s3_winter.png | 통과 | 0px | 9.515% | 0px · 통과 |
| glow_library_s4.png | 통과 | 0px | 16.604% | 0px · 통과 |
| glow_library_s4_winter.png | 통과 | 0px | 12.933% | 0px · 통과 |
| glow_science_on.png | 통과 | 0px | 11.554% | 0px · 통과 |
| glow_science_on_winter.png | 통과 | 0px | 12.805% | 0px · 통과 |
| glow_science_s3.png | 통과 | 0px | 18.762% | 0px · 통과 |
| glow_science_s3_winter.png | 통과 | 0px | 18.461% | 0px · 통과 |
| glow_science_s4.png | 통과 | 0px | 20.237% | 0px · 통과 |
| glow_science_s4_winter.png | 통과 | 0px | 20.064% | 0px · 통과 |
| glow_store_on.png | 통과 | 0px | 7.862% | 0px · 통과 |
| glow_store_on_winter.png | 통과 | 0px | 7.907% | 0px · 통과 |
| glow_store_s4.png | 통과 | 0px | 5.629% | 0px · 통과 |
| glow_store_s4_winter.png | 통과 | 0px | 5.410% | 0px · 통과 |
| glow_dorm.png | 통과 | 0px | 8.156% | 0px · 통과 |
| glow_dorm_winter.png | 통과 | 0px | 7.288% | 0px · 통과 |

## 원본 대응표

모든 경로는 기준 커밋의 img/a/ 아래이며, 다운로드 후 Git blob SHA를 검증함. 원본은 이 결과물에 중복 저장하지 않음.

| 결과 키 | 기준 원본 | 원본 Git blob SHA |
|---|---|---|
| glow_classroom_on | bld_classroom_on-15b3f1ef83.webp | ede00c52ea4df40e7f75416530ae42bf1f5de1d2 |
| glow_classroom_on_winter | bld_classroom_on_winter-eaf08c1264.webp | ce5a350b776e6b1d242e6e88983933232b18e423 |
| glow_classroom_s2 | bld_classroom_s2-eec5127814.webp | 101fcc6a2e5e588e9832bac2b231faf0f500e739 |
| glow_classroom_s2_winter | bld_classroom_s2_winter-34f9527522.webp | acbd9cf6125d52dd76fb82f70fe86dcbb61cf18b |
| glow_classroom_s3 | bld_classroom_s3-12703cdc64.webp | 2845d0056beb09b052cb62ff39a5919440593058 |
| glow_classroom_s3_winter | bld_classroom_s3_winter-077e4f6bdd.webp | adf864c8162f3220c3d03ae585a3de5a05663079 |
| glow_classroom_s4 | bld_classroom_s4-636598a5e4.webp | a874c444d871b8eb7923480f13be5b9e1cf097dc |
| glow_classroom_s4_winter | bld_classroom_s4_winter-70966ca730.webp | e1e95eccb22a081e134ab152e8fc62d179ed2607 |
| glow_cafeteria_on | bld_cafeteria_on-3a3ab6bc70.webp | 8e6af92d323607a01b3f16ca541d2ea1f2929bd5 |
| glow_cafeteria_on_winter | bld_cafeteria_on_winter-e38153be55.webp | 247b3a1cb8ebd3fe63cf64188c50c8342924753e |
| glow_cafeteria_s2 | bld_cafeteria_s2-94ccdee6f1.webp | 67af140b91ddf535e3112efadd249ada34a1cba8 |
| glow_cafeteria_s2_winter | bld_cafeteria_s2_winter-8d5953dab0.webp | bc527b0b5474957b8109888093e25742f56f0ce5 |
| glow_cafeteria_s3 | bld_cafeteria_s3-8c981fbf46.webp | 4acb5eb4ecf46af41ef254dce8a5bb09d967b410 |
| glow_cafeteria_s3_winter | bld_cafeteria_s3_winter-9898797b9c.webp | 144732541850a4031ba5cb13214ae526b74b8439 |
| glow_cafeteria_s4 | bld_cafeteria_s4-8797805d82.webp | 83f182cb952ba6cc5fff1ac8a34991d7949486a1 |
| glow_cafeteria_s4_winter | bld_cafeteria_s4_winter-4cebc8e1c4.webp | c668cdc5bb1cf808f75ea3208aea734c2935b828 |
| glow_library_on | bld_library_on-d6ea141804.webp | b84466a6a1d09191ed392620b0fb56ccacba3fd6 |
| glow_library_on_winter | bld_library_on_winter-b6085e9b93.webp | 755f111f0b970808f997080ac211fea5f9153274 |
| glow_library_s2 | bld_library_s2-dd3ee5db37.webp | cc122285d4286637202ee4d2d38700dfcd3f860f |
| glow_library_s2_winter | bld_library_s2_winter-fdeb080a2d.webp | eb3bd012d867b1f6a6e3a9c48d38fa11f3471ad7 |
| glow_library_s3 | bld_library_s3-f07719bca8.webp | 735c1c8d7c68844e247f28d214fb677249b6b74f |
| glow_library_s3_winter | bld_library_s3_winter-efb9093db5.webp | 2fcee37846206618924b08f4ccf5dab2a2814f23 |
| glow_library_s4 | bld_library_s4-f3c4d32a04.webp | 081914d7dc359eba54e2ea80da69b28afeeb8542 |
| glow_library_s4_winter | bld_library_s4_winter-ab2f69886b.webp | 966f17650c204c7e81b3d5497c6c3e302018edb8 |
| glow_science_on | bld_science_on-6f8b36ca12.webp | 5e3060a59e9b7794c33602cb5a2335306a4dc5f1 |
| glow_science_on_winter | bld_science_on_winter-2927002c79.webp | a1b414de48592cb20c823a01834b520e2a784b01 |
| glow_science_s3 | bld_science_s3-7511ca1a1c.webp | ff5ecc1460e6e69238100dd2ab6250c2f2728c3a |
| glow_science_s3_winter | bld_science_s3_winter-039cd7cf4a.webp | 550fc05f24fceaea19c2392e575d8b63bb096c3f |
| glow_science_s4 | bld_science_s4-e9b4e2ee55.webp | ff85588dc909647338591d1e060f5e262432c438 |
| glow_science_s4_winter | bld_science_s4_winter-72927dd17b.webp | a100ba5c01fb64fa8aa12f6204c0474b7e887ed1 |
| glow_store_on | bld_store_on-6c0ffdc863.webp | dd2c74e66b49c1299b81be08373bd88240db63f7 |
| glow_store_on_winter | bld_store_on_winter-1019366d9c.webp | 5aaad9bba9ff656828a1e2b2498cb40c1a735641 |
| glow_store_s4 | bld_store_s4-1bfabe10cf.webp | 73b10ff7360c4cd6ca235fa662a297eaaa1c2a0f |
| glow_store_s4_winter | bld_store_s4_winter-19512f3207.webp | 1e49e55a3b2618a5f8cb4dbcc768cbe72f99c0c5 |
| glow_dorm | bld_dorm_on-cc62c27c31.webp | b2b3dbdbce04a3f3bff595cfcb02365544f0429c |
| glow_dorm_winter | bld_dorm_on_winter-00e5f9f305.webp | c297fe04f64b6d81938d7fbcdc8259ce08e8373d |

## 확인 자료

- _preview/glow_sheet_1.png: 기본 18장, 낮 / 빛만 / 밤.
- _preview/glow_sheet_2.png: 겨울 18장, 낮 / 빛만 / 밤.
- _preview/glow_fit.png: 36장, 원본 위 조각 알파 50% 중첩.
- _preview/glow_night_high.png: 고등학교 6건물과 기존 운동장 불빛을 적용한 7채.
- _prompts.md: 사용한 내장 이미지 생성 프롬프트 36개.

## 범위와 남은 것

요청한 36장과 확인 자료를 완료함. 게임 코드 연결과 실제 게임 실행은 이번 미술 자료 작업의 범위 밖이며 수행하지 않음.
