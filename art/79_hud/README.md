| 검사 | 결과 |
| --- | --- |
| a. 새 목록 | 사용16장 + 초안 보관7장 = 그림23장, 모두 지정 크기 RGBA PNG. 사용 파일: hud_board_frame(900×330), hud_card_light/dark(900×150), hud_res_divider(12×120), hud_bar_track_light_v2/dark_v2와 hud_bar_fill(600×36), hud_pill_light_v2/dark_v2(180×60), hud_btn_light/dark/press(132×132), hud_ic_star/kids(96×96), hud_fold_light/dark(132×66). 모두.png. |
| 안 씀 | hud_board_light.png, hud_board_dark.png, hud_res_frame.png, hud_pill_light.png, hud_pill_dark.png, hud_bar_track_light.png, hud_bar_track_dark.png는 초안 그대로 보존. 별도 재화 틀은 사용하지 않음. |
| b. 글자와 기호 | 그림23장에 글자/숫자/기호 없음. 확인 그림에만 임시 글자/숫자/화살표와 기존 게임 아이콘 사용. |
| c. 구석 장식 | 바깥 틀의 잎은 아래 두72px 구석 칸 안에만 있음. 첫 줄 카드와 이름표/막대/단추에 추가 장식 없음. 가장자리 가운데에 하나뿐인 장식 없음. |
| d. 오른쪽 위 | 바깥 틀과 카드의 오른쪽 위 장식 없음. 토스 단추 자리를 비워 둠. |
| e. 테마와 투명 | hud_board_frame 가운데 완전 투명. 판 전체 아래에 테마 색을72% 불투명으로 깔고 첫 줄에만 종이 카드 합성. 진행 줄과 재화 줄은 같은 테마 색으로 이어짐. 이름표는 진한 나무색, 새 막대 홈은 최대 알파153/255(60%)인 중립 어두운 홈. 다섯 테마 위 크림색 글자 확인. |
| f. 밝고 어두운 짝 | 카드/이름표/새 막대 홈/단추/접기 손잡이의 밝은 판과 어두운 판 외곽 알파가 픽셀 단위로 같음. 공통 바깥 틀 하나를 함께 사용. 눌린 단추도 같은 외곽. |
| g. 그림자와 밝은 부분 | 조각 밖 그림자/빛 번짐 제거, 바깥 픽셀 투명. 크림색 종이, 흰 털과 하이라이트 보존. |
| h. 늘이기와 확인 그림 | 최종 확인 그림: _preview/hud_mock_light_v2.png, hud_mock_dark_v2.png, hud_stretch_v2.png(긴 쪽1600px 이하). 너비300/380/450px와 낮은110px 토스 배치, 판 전체의 다섯 테마 확인. 구석 겹침/찢어짐 없음. _v2 없는 초안 확인 그림3장은 보관만 하고 사용하지 않음. main 8bfe4b9의412px 화면을 확인한 합성 시안, 게임 코드/기존 파일 수정 및 PR/병합 없음. |

구석 칸(원본 px): hud_board_frame=상하좌우72, hud_card_light/dark=상하좌우42. 3조각 좌우 끝: hud_bar_track_light_v2/dark_v2와 hud_bar_fill=18, hud_pill_light_v2/dark_v2=27. hud_res_divider, hud_btn_light/dark/press, hud_ic_star/kids, hud_fold_light/dark=고정 크기(9조각 없음). 안 쓰는 초안: board_light/dark=72, res_frame=48, bar_track_light/dark=좌우18, pill_light/dark=좌우27.
