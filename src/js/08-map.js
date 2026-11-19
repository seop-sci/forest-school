  /* ---------- 지도 만들기 ---------- */
  const map = $('#map'), layerKids = $('#kids'), layerFx = $('#fx'), layerTeachers = $('#teachers');
  const kidsAway = () => !!map && (map.classList.contains('hs-night') || map.classList.contains('tr2-away'));   // 3.2.0 수학여행 동안도   // 3.1.1 고등학교 밤(20~6시)에는 학생이 기숙사에 있어 지도에 없어요

  /* 1.5.0 그림 지도: 학교급마다 지도 그림과 건물 자리가 달라요.
     좌표는 지도 viewBox(0 0 360 420) 기준이고, 지도 그림(1024×1536)은 y -60~480에 깔려요.
     건물 자리는 지도 그림 기준 퍼센트(가로, 세로, 건물 그림 너비)로 적어요 (dev/assets 건물 자리 표) */
  const MAP_Y = -60, MAP_W = 360, MAP_H = 540;
  const pct = (x, y, w) => [x / 100 * MAP_W, y / 100 * MAP_H + MAP_Y, w / 100 * MAP_W];
  // 4.2.1 woodani 제보: 운동장 그림이 옮겨진 뒤 운동회 트랙(sports: 가운데 x, y, 가로 반지름, 세로 반지름)이 엉뚱한 곳에 있었어요. 운동장 그림의 달리기 길(그림 가로 48%, 세로 52% 둘레)에 맞췄어요
  const GEO = [
    { map: 'map_kinder',
      // 3.3.0 새 단장: 지도와 빈터는 작업지시서 57 지도 그림에서 바닥(흙, 보도블록)을 직접 재서 가운데와 너비 × 0.96(dev/gen330/lotfit.py, 자리 표 값은 눈대중이라 조금씩 어긋났어요), 선생님 자리는 빈 풀밭에서 골랐어요(dev/gen330 기록)
      // 1.7.3: 건물 자리는 지도 그림의 울타리 빈터(가로, 세로 중심 %, 울타리 안 너비 %)로 적고, 건물 그림의 바닥 섬이 그 빈터에 맞게 놓아요(lotRect)
      lot: { science: [31.4, 70.51, 25.93], classroom: [43.31, 31.25, 31.49], cafeteria: [75.98, 44.16, 27.37], library: [23.19, 49.88, 26.51], playground: [74.27, 65.85, 29.38] },
      nextLot: [31.4, 70.51, 25.93], nextKey: 'bld_classroom_lock',
      next: { img: 'bld_classroom_lock', tag: '초등학교에서 열려요', name: '과학실' },
      oak: [332, 440], plaza: [180, 220.8], gate: [180, 492], bus: [234, 433.5], drop: [180, 242.8, 36, 12],
      spots: [[180, 415.2], [176.4, 361.2], [187.2, 323.4], [180, 285.6], [180, 242.4], [180.8, 238.8], [153, 220.8], [180, 196.5], [206.6, 220.8], [164, 280.2], [210.5, 236.3], [210.5, 243.8], [158.4, 172.2], [147.6, 145.2], [158.4, 118.2], [212.4, 188.4], [262.8, 177.6], [127.1, 211.7]],
      fount: [180, 220.8, 22, 14],
      tea: { hedgehog: [122.4, 220.8, 0.57], squirrel: [144, 123.6, 0.6], bear: [244.8, 199.2, 0.72], owl: [93.6, 220.8, 0.69], owlAway: [57.6, 296.4, 0.63] },
      deco: [[64, 110], [300, 104], [22, 236], [340, 258], [66, 424], [306, 432], [140, 384], [228, 388]],
      sports: [230.4, 334.2, 36, 16.2], eaves: { classroom: 0.05, cafeteria: 0.02, library: 0.02, science: 0.02, playground: -0.08 } },
    { map: 'map_elem',
      // 3.3.0 새 단장: 지도와 빈터는 작업지시서 57 지도 그림에서 바닥(흙, 보도블록)을 직접 재서 가운데와 너비 × 0.96(dev/gen330/lotfit.py, 자리 표 값은 눈대중이라 조금씩 어긋났어요), 선생님 자리는 빈 풀밭에서 골랐어요(dev/gen330 기록)
      // 1.7.4: 과학실 그림이 다른 건물보다 크게 늘어나 외곽선이 굵고 흐려 보였어요(woodani 확인 요청). 빈터 40% → 34%로 줄여 다른 건물과 크기를 맞춰요
      lot: { classroom: [32.67, 31.74, 25.17], cafeteria: [72.36, 38.85, 24.3], library: [25.15, 48.47, 23.45], playground: [69.63, 57.71, 33.69], science: [28.37, 67.29, 23.07] },
      nextLot: [65.33, 74.21, 21.63], nextKey: 'bld_cafeteria_lock',
      next: { img: 'bld_cafeteria_lock', tag: '중학교에서 열려요', name: '매점' },
      oak: [332, 440], plaza: [151.2, 228.9], gate: [180, 492], bus: [234, 430.8], drop: [151.2, 250.9, 36, 12],
      spots: [[180, 415.2], [162, 372], [154.8, 350.4], [180, 328.8], [187.2, 291], [165.6, 269.4], [152, 246.9], [126.8, 222.2], [150.4, 210.9], [177.6, 228.9], [169.2, 188.4], [144, 166.8], [144, 134.4], [136.8, 123.6], [226.8, 150.6], [108, 210], [180, 231.6], [145.4, 258.6], [187.2, 323.4]],
      fount: [151.2, 228.9, 22, 14],
      tea: { hedgehog: [144, 199.2, 0.57], squirrel: [158.4, 134.4, 0.6], bear: [172.8, 253.2, 0.72], owl: [165.6, 166.8, 0.69], owlAway: [79.2, 318, 0.63] },
      deco: [[56, 66], [312, 70], [22, 312], [338, 196], [60, 420], [302, 424], [128, 380], [236, 392]],
      sports: [247.4, 218.3, 50, 22.2], eaves: { classroom: 0.02, cafeteria: 0.0, library: 0.0, science: -0.06, playground: -0.14 } },
    // 2.0.0 중학교: 지도와 빈터는 작업지시서 19 다시 그린 판(art/v200/maps/lots_middle.md, 2026-10-27). 과학실 위 가운데, 교실과 급식실 위쪽 양옆,
    // 도서관과 운동장 아래쪽 양옆, 기숙사 공사 자리(고등학교에서 열려요) 왼쪽 아래, 매점 가운데 아래. 참나무 (82%, 81%), 간판 (39%, 86%)
    { map: 'map_middle',
      // 3.3.0 woodani: 운동장을 맨 위 단에 올려 봤는데 떠 보여서 다시 교실이 맨 위, 운동장이 가운데 왼쪽 넓은 단
      // 3.3.0 새 단장: 지도와 빈터는 작업지시서 57 지도 그림에서 바닥(흙, 보도블록)을 직접 재서 가운데와 너비 × 0.96(dev/gen330/lotfit.py, 자리 표 값은 눈대중이라 조금씩 어긋났어요), 선생님 자리는 빈 풀밭에서 골랐어요(dev/gen330 기록)
      lot: { classroom: [52.29, 26.61, 34.36], cafeteria: [74.46, 37.24, 24.6], library: [27.78, 38.39, 21.53], playground: [31.54, 55.9, 36.95], science: [77.49, 52.73, 20.96], store: [29.44, 73.02, 23.45] },
      nextLot: [71.63, 68.69, 28.62], nextKey: 'bld_classroom_lock',
      next: { img: 'bld_dorm_lock', tag: '고등학교에서 열려요', name: '기숙사' }, nextTagY: 0.36,
      oak: [332, 440], plaza: [194.4, 183], gate: [187, 492], bus: [234, 447], drop: [194.4, 205, 36, 12],
      spots: [[176.4, 415.2], [158.4, 382.8], [122.4, 345], [180, 318], [234, 323.4], [169.2, 291], [145.4, 274.8], [198, 253.2], [212.4, 231.6], [195.2, 201], [175, 195], [194.4, 158.7], [220.8, 183], [194.4, 145.2], [187.2, 107.4], [183.6, 91.2], [259.2, 156], [139.6, 130.2], [125.8, 252.8], [262.8, 231.6]],
      fount: [194.4, 183, 22, 14],
      tea: { hedgehog: [216, 199.2, 0.57], squirrel: [201.6, 102, 0.6], bear: [172.8, 274.8, 0.72], owl: [144, 142, 0.69], owlAway: [158.4, 307.2, 0.63] },   // 5.1.1.2 woodani 결정: 부엉이 선생님이 왼쪽 단추(복도, 학교 행사)에 가려서 도서관 오른쪽 풀밭으로
      deco: [[56, 66], [312, 70], [22, 312], [338, 196], [60, 420], [302, 424], [29, 383], [252, 437]],
      sports: [104.5, 207, 53.4, 21.4], eaves: { classroom: 0.02, cafeteria: 0.0, library: 0.0, science: -0.06, playground: -0.14, store: 0 } },
    // 3.0.0 고등학교: 지도와 빈터는 작업지시서 41(art/v300h/maps/lots_high.md). 과학실 위 가운데, 학생회관 공사 자리(대학교에서 열려요) 오른쪽 위,
    // 교실과 급식실, 도서관과 운동장, 매점과 기숙사가 양옆으로 세 줄. 분수는 가운데(50%, 52%), 참나무 (82%, 81%), 간판 (39%, 86%), 기념물 (70%, 86%)
    { map: 'map_high',
      // 3.3.0 새 단장: 지도와 빈터는 작업지시서 57 지도 그림에서 바닥(흙, 보도블록)을 직접 재서 가운데와 너비 × 0.96(dev/gen330/lotfit.py, 자리 표 값은 눈대중이라 조금씩 어긋났어요), 선생님 자리는 빈 풀밭에서 골랐어요(dev/gen330 기록)
      lot: { classroom: [29.54, 30.2, 27.59], cafeteria: [71.92, 37.91, 27.59], library: [26.17, 43.33, 23.91], science: [76.86, 50.74, 25.5], playground: [31.45, 59.93, 33.86], store: [75.24, 63.72, 24.2], dorm: [30.03, 73.48, 23.21] },
      nextLot: [72.36, 75.92, 27.69], nextKey: 'bld_union_lock',
      next: { img: 'bld_union_lock', tag: '대학교에서 열려요', name: '학생회관' }, nextTagY: 0.24,
      oak: [332, 440], plaza: [190.8, 210], gate: [181, 492], bus: [234, 436.2], drop: [190.8, 232, 36, 12],
      spots: [[176.4, 415.2], [183.6, 372], [187.2, 345], [164, 318], [194.4, 264], [201.6, 242.4], [191.6, 228], [171.4, 222], [183.6, 185.7], [217.2, 210], [168.6, 172.2], [172.8, 123.6], [138.8, 107.4], [208.8, 134.4], [137.3, 160.9], [223.1, 203.4], [169.2, 226.2], [223.2, 266.7], [147.6, 328.8], [212.4, 339.6]],
      fount: [190.8, 210, 22, 14],
      tea: { hedgehog: [151.2, 156, 0.57], squirrel: [165.6, 102, 0.6], bear: [208.8, 231.6, 0.72], owl: [180, 166.8, 0.69], owlAway: [165.6, 285.6, 0.63] },
      deco: [[56, 66], [312, 70], [22, 312], [338, 196], [60, 420], [302, 424], [29, 383], [252, 437]],
      sports: [103.4, 236.2, 48.9, 19.1], eaves: { classroom: 0.02, cafeteria: 0.0, library: 0.0, science: -0.06, playground: -0.14, store: 0, dorm: 0 } }
  ];
  // 2.1.1 운동장 지붕 조각(roof_field, roof_field_s3와 겨울)은 새 그림의 트랙을 색으로 골라 만들었어요(1.5.2처럼 테마 색이 트랙을 칠해요)
  // 2.1.1 새 건물 그림(작업지시서 31, 32)은 아래에서부터 가장 넓은 띠의 가운데를 재고, 예전 값과 같은 크기가 되게 너비 × 0.96, 높이 − 0.02로 맞췄어요
  // 1.7.3 건물 그림마다 바닥 섬(가장 넓은 줄)의 자리: [가로 중심 - 0.5, 세로 중심 - 0.5, 너비] (그림 한 변 기준, dev에서 그림을 재서 적었어요)
  // 3.3.0 새 단장 건물(작업지시서 56)의 바닥 섬 값: [가장 넓은 줄 가운데 - 0.5, 바닥 섬 아래 끝 - 0.5, 가장 넓은 줄 너비]. 3.3.0 빈터 자리는 '바닥 섬 아래 끝이 놓일 곳'이에요(겨울판은 기본과 같게)
  const BLD_ISL = {bld_cafeteria_lock:[-0.0037, 0.4, 0.965],bld_cafeteria_lock_winter:[-0.0037, 0.4, 0.965],bld_cafeteria_lux:[0.0025, 0.4425, 0.9575],bld_cafeteria_on:[-0.0062, 0.44, 0.955],bld_cafeteria_on_winter:[-0.0062, 0.44, 0.955],bld_cafeteria_s2:[-0.0475, 0.4725, 0.8775],bld_cafeteria_s2_winter:[-0.0475, 0.4725, 0.8775],bld_cafeteria_s3:[-0.005, 0.47, 0.9675],bld_cafeteria_s3_winter:[-0.005, 0.47, 0.9675],bld_cafeteria_s4:[-0.0025, 0.4325, 0.9625],bld_cafeteria_s4_winter:[-0.0025, 0.4325, 0.9625],bld_classroom_lock:[0.0162, 0.335, 0.915],bld_classroom_lock_winter:[0.0162, 0.335, 0.915],bld_classroom_lux:[0.0038, 0.4375, 0.96],bld_classroom_on:[-0.0012, 0.47, 0.97],bld_classroom_on_winter:[-0.0012, 0.47, 0.97],bld_classroom_s2:[-0.01, 0.4575, 0.9475],bld_classroom_s2_winter:[-0.01, 0.4575, 0.9475],bld_classroom_s3:[-0.0087, 0.4725, 0.945],bld_classroom_s3_winter:[-0.0087, 0.4725, 0.945],bld_classroom_s4:[-0.0037, 0.4725, 0.945],bld_classroom_s4_winter:[-0.0037, 0.4725, 0.945],bld_dorm_lock:[0.0, 0.395, 0.9575],bld_dorm_lock_winter:[0.0, 0.395, 0.9575],bld_dorm_lux:[0.0112, 0.415, 0.965],bld_dorm_on:[-0.0025, 0.485, 0.9525],bld_dorm_on_winter:[-0.0025, 0.485, 0.9525],bld_field_lux:[0.015, 0.4225, 0.8825],bld_field_on:[0.0162, 0.42, 0.88],bld_field_on_winter:[0.0162, 0.42, 0.88],bld_field_s3:[0.0138, 0.425, 0.88],bld_field_s3_winter:[0.0138, 0.425, 0.88],bld_field_s4:[0.02, 0.4225, 0.8725],bld_field_s4_winter:[0.02, 0.4225, 0.8725],bld_library_lux:[0.0088, 0.445, 0.945],bld_library_on:[-0.0012, 0.4175, 0.96],bld_library_on_winter:[-0.0012, 0.4175, 0.96],bld_library_s2:[0.0, 0.4725, 0.9425],bld_library_s2_winter:[0.0, 0.4725, 0.9425],bld_library_s3:[0.0075, 0.325, 0.9525],bld_library_s3_winter:[0.0075, 0.325, 0.9525],bld_library_s4:[0.0, 0.47, 0.9425],bld_library_s4_winter:[0.0, 0.47, 0.9425],bld_playground_lock:[0.0238, 0.3975, 0.915],bld_playground_lock_winter:[0.0238, 0.3975, 0.915],bld_playground_lux:[0.0112, 0.435, 0.915],bld_playground_on:[0.0138, 0.4325, 0.915],bld_playground_on_winter:[0.0138, 0.4325, 0.915],bld_science_lux:[0.0088, 0.44, 0.96],bld_science_on:[-0.0025, 0.425, 0.9725],bld_science_on_winter:[-0.0025, 0.425, 0.9725],bld_science_s3:[-0.0012, 0.475, 0.97],bld_science_s3_winter:[-0.0012, 0.475, 0.97],bld_science_s4:[-0.0012, 0.435, 0.965],bld_science_s4_winter:[-0.0012, 0.435, 0.965],bld_store_lock:[0.0188, 0.42, 0.925],bld_store_lock_winter:[0.0188, 0.42, 0.925],bld_store_lux:[0.0025, 0.4325, 0.9425],bld_store_on:[-0.0075, 0.4425, 0.9525],bld_store_on_winter:[-0.0075, 0.4425, 0.9525],bld_store_s4:[-0.01, 0.475, 0.9425],bld_store_s4_winter:[-0.01, 0.475, 0.9425],bld_union_lock:[0.0038, 0.395, 0.95],bld_union_lock_winter:[0.0038, 0.395, 0.95]};
  // 3.1.1 woodani 제보: 학생회관 공사 그림(bld_union_lock)의 바닥 섬 값이 틀려(0.35, 1.04) 위로 뜨고 작았어요. 같은 모양인 기숙사 공사 그림 값에 맞췄어요
  // 4.0.0 대학교 건물(작업지시서 54 2단계, 1024 캔버스)의 바닥 섬: [가장 넓은 줄 가운데 - 0.5, 가장 넓은 줄 높이 - 0.5, 너비]. 구역 빈터 자리는 빈터 타원의 가운데라서
  // 바닥 섬의 가장 넓은 줄이 빈터 가운데에 오게 놓아요. 그림마다 값이 거의 같아(±0.01) 건물마다 하나로 맞추고 겨울판도 같은 값을 써요(계절을 바꿔도 건물이 움직이지 않게)
  { const U = { classroom: [0, 0.259, 0.913], cafeteria: [0, 0.259, 0.913], library: [0, 0.259, 0.913], science: [0, 0.259, 0.913], dorm: [0, 0.259, 0.913], store: [0, 0.251, 0.915], field: [0, 0.21, 0.916] };
    for (const k of Object.keys(U)) { BLD_ISL[`bld_${k}_s5`] = U[k]; BLD_ISL[`bld_${k}_s5_winter`] = U[k]; }
    BLD_ISL.bld_union_on = BLD_ISL.bld_union_on_winter = [0, 0.233, 0.917]; BLD_ISL.bld_lab_lock = BLD_ISL.bld_lab_lock_winter = [0, 0.27, 0.917];
    BLD_ISL.bld_institute_on = BLD_ISL.bld_institute_on_winter = [-0.004, 0.29, 0.82]; BLD_ISL.bld_gradhall_on = BLD_ISL.bld_gradhall_on_winter = [0, 0.298, 0.93]; BLD_ISL.bld_gradhall_lock = BLD_ISL.bld_gradhall_lock_winter = [0, 0.298, 0.93]; }   // 5.0.0 작업지시서 85(그림에서 잼)
  // 4.0.0 대학교 구역 지도의 공사 자리 그림(woodani 요청 2026-11-10: 빈터에 딱 맞게). 공사 자리 그림은 옛 지도에 맞춘 둥근 판이라 납작한 구역 빈터에서는 위로 뜨고 작았어요.
  // 구역에서만 이 값으로 놓아요: 판 아래 끝이 빈터 아래 끝에 닿고, 판 너비가 빈터를 조금 넘게 덮어요(그림에서 판의 가장 넓은 줄과 아래 끝을 재서 구함). 다른 학교급은 BLD_ISL과 LOT_XF 그대로
  const ZONE_SITE_ISL = { bld_classroom_lock: [0.0012, 0.175, 0.88, 0.9, 0.3675], bld_cafeteria_lock: [-0.0025, 0.225, 0.92, 0.82, 0.42], bld_playground_lock: [0.0038, 0.232, 0.895, 0.8, 0.425], bld_store_lock: [0.0012, 0.257, 0.915, 0.8, 0.45], bld_dorm_lock: [0, 0.224, 0.925, 0.82, 0.42], bld_union_lock: [0, 0.2215, 0.925, 0.82, 0.4175] };   // [옆, 가운데 높이, 판 너비, 세로 배율, 판 아래 끝]. 세로 배율은 판 아래 끝을 기준으로 눌러요
  for (const k of Object.keys(ZONE_SITE_ISL)) ZONE_SITE_ISL[k + '_winter'] = ZONE_SITE_ISL[k];
  const LOT_FIT = 0.98;   // 바닥 섬이 울타리 안쪽에 살짝 들어가게(울타리가 둘레에 보여요)
  // 빈터 [x%, y%, w%]와 그림 열쇠로 그림 네모 [가운데 x, 가운데 y, 한 변](지도 칸)을 구해요
  // 3.3.0 woodani 요청(빈터에 꽉 맞게): 빈터마다 [옆으로, 아래로, 크기 배율, 세로 배율, 회전(도)]. 지도 그림의 빈터(흙, 보도)가 건물 그림에 덮여 안 보이게 하나씩 맞췄어요(dev/gen330/fit2).
  // 크기와 세로 배율, 회전은 바닥 섬 아래 끝(빈터 자리 점)을 기준으로 해서, 같은 건물의 다른 단계, 겨울, 고급 그림도 같이 맞아요. 0번부터 유치원, 초등, 중, 고(다음 학교급 자리는 next)
  const LOT_XF = [{ next: [4.34, 10.33, 1.1, 1.0, 0.0], classroom: [0.53, 6.38, 1.31, 1.0, 0.0], cafeteria: [-0.72, 0.95, 1.15, 1.0, 0.0], library: [3.17, 9.93, 1.21, 1.0, 0.0], playground: [-0.33, 9.79, 1.13, 1.0, 0.0], science: [4.34, 10.33, 1.1, 1.0, 0.0] },
    { next: [-1.38, 11.22, 1.21, 1.0, 0.0], science: [-3.06, 9.79, 1.25, 1.11, 0.0], classroom: [-5.75, 9.52, 1.21, 1.0, 0.0], cafeteria: [-4.54, 6.49, 1.3, 1.0, 0.0], library: [-3.77, 6.47, 1.25, 1.0, 0.0], playground: [1.91, 20.5, 1.06, 0.94, -0.36] },
    { next: [-7.5, 4.5, 0.97, 0.99, 0.0], science: [-0.21, 8.39, 1.14, 1.0, 0.0], classroom: [-0.63, 9.49, 1.09, 1.0, 0.0], cafeteria: [-4.09, 6.34, 1.13, 1.0, 0.0], library: [-3.98, 7.07, 1.19, 1.0, 0.0], playground: [-3.5, 17, 1.03, 0.85, 0.0], store: [-7.51, 11.11, 1.21, 1.0, 0.0] },
    { next: [1.5, 19.5, 1.0, 0.86, 0.0], science: [-1.14, 7.12, 1.2, 1.0, 0.0], classroom: [-2.81, 10.0, 1.16, 1.0, 0.0], cafeteria: [0.09, 6.44, 1.13, 1.0, 0.0], library: [-6.37, 8.82, 1.27, 1.04, 0.0], playground: [-1.5, 18.5, 1.03, 0.83, -4], store: [-0.76, 9.74, 1.22, 1.0, 0.0], dorm: [-1.88, 7.54, 1.54, 0.81, 0.0] }];
  // 4.0.0 대학교 구역 지도 자리 표 (dev/gen400/zonegeo.py가 작업지시서 54 자리 표에서 만들어요. 손으로 고치지 않아요)
  const ZONE_GEO = [
    { map: 'map_zone_academic', zone: 'academic', zname: '학술 구역', lot: {'classroom': [29.44, 35.32, 30.47], 'library': [68.36, 46.45, 34.28], 'science': [28.52, 69.92, 29.39]}, oak: [282.3, 312.0], plaza: [144.1, 238.1], gate: [166.6, 411.1], drop: [144.1, 238.1, 36, 12], spots: [[169.2, 415.2], [164.9, 385.5], [184.3, 334.2], [154.8, 285.6], [181.8, 237.0], [160.2, 188.4], [190.8, 142.5], [149.4, 96.6], [147.6, 64.2], [126.0, 161.4], [219.6, 231.6], [153.0, 345.0], [160.2, 237.0]], deco: [[108.0, 80.4], [262.8, 134.4], [241.2, 363.9], [277.2, 393.6], [90.0, 377.4], [288.0, 350.4]] },
    { map: 'map_zone_life', zone: 'life', zname: '생활 구역', lot: {'cafeteria': [31.64, 35.64, 34.28], 'store': [67.77, 50.62, 36.04], 'dorm': [28.71, 70.96, 33.5]}, oak: [286.2, 347.5], plaza: [173.7, 269.8], gate: [173.3, 410.4], drop: [173.7, 269.8, 36, 12], spots: [[174.6, 423.8], [175.3, 386.0], [198.0, 339.6], [194.4, 311.0], [172.8, 289.4], [165.6, 261.3], [158.4, 224.0], [167.4, 178.7], [202.3, 134.9], [216.0, 82.6], [144.0, 167.3], [203.4, 246.2], [177.5, 349.3]], deco: [[162.0, 85.8], [255.6, 161.4], [86.4, 274.8], [234.0, 377.4], [302.4, 404.4], [90.0, 377.4]] },
    { map: 'map_zone_plaza', zone: 'plaza', zname: '광장 구역', lot: {'union': [48.44, 38.87, 42.29]}, oak: [40.8, 306.0], plaza: [175.1, 306.0], gate: [175.1, 393.5], drop: [175.1, 306.0, 36, 12], spots: [[176.4, 469.2], [176.4, 431.4], [176.4, 393.6], [176.4, 350.4], [176.4, 307.2], [122.4, 247.8], [115.2, 204.6], [133.2, 191.1], [176.4, 188.4], [234.0, 226.2], [216.0, 191.1], [223.2, 264.0], [136.8, 278.6], [212.4, 279.1]], deco: [[72.0, 107.4], [255.6, 99.3], [90.0, 210.0], [288.0, 237.0], [100.8, 334.2], [266.4, 334.2]], bus: [176.4, 449.2], sign: [86.4, 401.7], vd: [273.6, 388.2], fount: [177.2, 243.0, 22, 14] },
    { map: 'map_zone_sports', zone: 'sports', zname: '체육 구역', lot: {'playground': [48.14, 45.25, 59.28]}, oak: [50.3, 324.6], plaza: [219.6, 323.4], gate: [170.2, 428.6], drop: [219.6, 323.4, 36, 12], spots: [[170.3, 444.9], [168.5, 423.8], [158.4, 407.1], [140.4, 380.1], [122.4, 355.8], [105.1, 328.8], [102.6, 307.2], [111.6, 289.4], [127.8, 274.8], [151.2, 258.6], [171.7, 245.1], [174.6, 232.7]], deco: [[90.0, 96.6], [266.4, 112.8], [50.4, 118.2], [288.0, 358.5], [223.2, 382.8], [79.2, 388.2]] },
    // 5.0.0 연구 구역(작업지시서 82 지도, 84 자리 표). 대학원부터 들어가요(zoneOpen)
    { map: 'map_zone_lab', zone: 'lab', zname: '연구 구역', lot: {'institute': [29.49, 35.55, 44.82], 'gradhall': [70.9, 46.42, 31.93]}, oak: [284.8, 327.8], plaza: [137.8, 246.6], gate: [164.5, 429.4], drop: [137.8, 246.6, 36, 12], spots: [[164.5, 429.4], [162.4, 387.5], [176.5, 347.5], [169.8, 307.4], [144.1, 273.6], [171.9, 254.6], [155.4, 224.4], [166.6, 184.7], [193.0, 152.0], [206.0, 113.3], [184.9, 77.1], [146.2, 60.6]], deco: [[59.8, 198.4], [73.8, 293.3], [105.5, 344.3], [225.0, 372.4], [230.3, 236.0], [242.6, 145.7]] },
  ];
  const CAMPUS = { map: 'map_campus', gate: [177.9, 411.1], fount: [182.1, 229.0], spots: [[180.0, 434.1], [177.8, 377.4], [259.2, 323.4], [181.8, 258.6], [143.3, 227.3], [151.2, 177.6], [187.2, 131.7], [234.0, 118.2], [199.8, 188.4], [133.2, 177.6]],
    zones: [
      { key: 'academic', name: '학술 구역', tag: [95.8, 134.4], hit: [25.2, 37.2, 151.2, 129.6], lock: false },
      { key: 'life', name: '생활 구역', tag: [252.0, 196.5], hit: [187.2, 123.6, 151.2, 97.2], lock: false },
      { key: 'plaza', name: '광장 구역', tag: [178.2, 353.1], hit: [93.6, 291.0, 172.8, 97.2], lock: false },
      { key: 'sports', name: '체육 구역', tag: [81.0, 255.9], hit: [18.0, 193.8, 126.0, 91.8], lock: false },
      { key: 'lab', name: '연구 구역', tag: [264.6, 84.2], hit: [194.4, 21.0, 140.4, 91.8], get lock() { return !gradOn(); } },   // 5.0.0 대학원에서 열려요
    ] };
  // 4.0.0 대학교는 지도가 한 장이 아니라 구역 지도 4장이에요. 구역 줄을 GEO 뒤(ZONE0부터)에 붙여서 지금 지도 엔진을 그대로 써요.
  // 구역 줄에는 다음 학교급 자리(next), 선생님 자리(tea), 운동회 자리(sports)가 없을 수 있어요. 없는 것은 그리지 않거나 광장 자리로 대신해요
  const ZONE0 = GEO.length, UNI_TIER = 4, ZONE_KEYS = ZONE_GEO.map(Z => Z.zone);
  // 구역마다 서 있는 선생님(woodani 결정 2026-11-10): 다람쥐와 부엉이는 학술 구역, 곰은 생활 구역, 고슴도치 부총장님은 광장 구역 정문 옆. 자리는 구역 그림의 빈 풀밭에서 골랐어요
  const ZONE_TEA = { academic: { squirrel: [222, 116, 0.6], owl: [285, 236, 0.69], owlAway: [226, 262, 0.63] }, life: { bear: [84, 176, 0.72] }, plaza: { hedgehog: [122, 352, 0.57] } };
  const ZONE_SPORTS = { sports: [222, 300, 70, 22] };   // 체육 구역 운동회는 대운동장 아래 넓은 풀밭에서
  ZONE_GEO.forEach(Z => GEO.push(Object.assign({ eaves: {}, tea: ZONE_TEA[Z.zone] || null, next: null, fount: null, bus: Z.gate, sports: ZONE_SPORTS[Z.zone] || [Z.drop[0], Z.drop[1], 44, 16] }, Z)));   // 4.0.0 광장 구역 학생회관은 이제 지을 수 있는 건물(FAC.union)이라 '다음 학교급 자리'로 그리지 않아요
  // 캠퍼스 전체 지도도 같은 엔진의 지도 한 줄이에요(건물과 참나무, 꾸미기 자리가 없고 학생 몇 명만 길을 걸어요). 그 위에 구역 이름표를 얹어요(renderCampus)
  const CAMPUS_GI = GEO.length;
  GEO.push({ map: CAMPUS.map, campus: true, zone: '', zname: '캠퍼스', lot: {}, eaves: {}, tea: null, next: null, oak: [-900, -900], plaza: CAMPUS.fount, gate: CAMPUS.gate, bus: CAMPUS.gate,
    drop: [CAMPUS.fount[0], CAMPUS.fount[1] + 22, 36, 12], sports: [CAMPUS.fount[0], CAMPUS.fount[1] + 22, 44, 16], spots: CAMPUS.spots, fount: [CAMPUS.fount[0], CAMPUS.fount[1], 22, 14], deco: [] });
  const lotXf = new Map();   // 빈터 배열 → 위 값(GEO를 만든 뒤 채워요)
  function lotRect(L, key, T) {
    const I = (T && T[key]) || BLD_ISL[key] || [0, 0.4, 0.94], w = L[2] / 100 * MAP_W * LOT_FIT / I[2];
    const r = [L[0] / 100 * MAP_W - I[0] * w, L[1] / 100 * MAP_H + MAP_Y - I[1] * w, w, ''], p = lotXf.get(L);
    if (!p && I[3]) { const By = r[1] + I[4] * w; r[3] = `translate(0 ${By.toFixed(1)}) scale(1 ${I[3]}) translate(0 ${(-By).toFixed(1)})`; return r; }   // 4.0.0 구역 공사 자리: 판 아래 끝을 붙잡고 세로로 눌러요
    if (!p) return r;
    const [dx, dy, f, a, rot] = p, Px = L[0] / 100 * MAP_W, Py = L[1] / 100 * MAP_H + MAP_Y, Qx = Px + dx, Qy = Py + dy;
    return [Px + (r[0] - Px) * f + dx, Py + (r[1] - Py) * f + dy, w * f,
      Math.abs(a - 1) > 0.002 || Math.abs(rot) > 0.01 ? `translate(${Qx.toFixed(1)} ${Qy.toFixed(1)}) rotate(${rot}) scale(1 ${a}) translate(${(-Qx).toFixed(1)} ${(-Qy).toFixed(1)})` : ''];
  }
  const xfAt = r => r[3] ? ` transform="${r[3]}"` : '';
  // 길 찾기, 누르는 자리, 이름표는 학교급마다 대표 그림 기준 자리(b)를 써요. 실제 그림은 그 그림의 바닥 섬에 맞춰 조금씩 옮겨요
  const BASE_KEY = [{ science: 'bld_science_on', classroom: 'bld_classroom_on', cafeteria: 'bld_cafeteria_on', library: 'bld_library_on', playground: 'bld_playground_on' },
    { science: 'bld_science_on', classroom: 'bld_classroom_on', cafeteria: 'bld_cafeteria_on', library: 'bld_library_on', playground: 'bld_field_on' },
    { science: 'bld_science_on', classroom: 'bld_classroom_on', cafeteria: 'bld_cafeteria_on', library: 'bld_library_on', playground: 'bld_field_on', store: 'bld_store_on' },
    // 3.0.0 고등학교는 받은 미리보기(작업지시서 41 map_check)와 같은 자리가 되게 고등학교 그림 기준으로 놓아요
    { science: 'bld_science_s4', classroom: 'bld_classroom_s4', cafeteria: 'bld_cafeteria_s4', library: 'bld_library_s4', playground: 'bld_field_s4', store: 'bld_store_s4', dorm: 'bld_dorm_on' }];
  // 2.1.1 길 찾기, 누르는 자리, 이름표의 기준 자리(b)는 예전 그림의 바닥 섬 값으로 고정해요(새 건물 그림을 넣어도 학생 길과 자리가 그대로). 실제 그림만 새 값으로 맞춰요
  const GEO_ISL = {bld_classroom_on: [-0.0012, 0.47, 0.97], bld_cafeteria_on: [-0.0062, 0.44, 0.955], bld_library_on: [-0.0012, 0.4175, 0.96], bld_playground_on: [0.0138, 0.4325, 0.915], bld_science_on: [-0.0025, 0.425, 0.9725], bld_field_on: [0.0162, 0.42, 0.88], bld_store_on: [-0.0075, 0.4425, 0.9525]};
  GEO.forEach((G, i) => {
    const X = LOT_XF[i] || {}; for (const k of Object.keys(G.lot)) if (X[k]) lotXf.set(G.lot[k], X[k]); if (X.next && G.next) lotXf.set(G.nextLot, X.next);
    const BK = BASE_KEY[i] || { science: 'bld_science_s5', classroom: 'bld_classroom_s5', cafeteria: 'bld_cafeteria_s5', library: 'bld_library_s5', playground: 'bld_field_s5', store: 'bld_store_s5', dorm: 'bld_dorm_s5', union: 'bld_union_on' };   // 4.0.0 구역 지도는 대학교 건물 그림 기준
    G.b = {}; for (const k of Object.keys(G.lot)) G.b[k] = lotRect(G.lot[k], BK[k] || 'bld_dorm_s5', GEO_ISL);
    if (G.next) G.next.at = lotRect(G.nextLot, G.nextKey);
  });
  // 학교급마다 지도 한 장(유치원~고등학교). 4.0.0 대학교는 보고 있는 구역의 지도예요
  // S.zone은 지금 보는 구역 열쇠('' = 캠퍼스 지도)
  // 학교급 모습 보기와 다른 학교 구경(학교급 t를 정해 부를 때)에서는 그 화면에서 고른 구역(rt.viewZone)을 써요
  const zoneKey = view => (view && rt.viewZone != null ? (ZONE_KEYS.includes(rt.viewZone) ? rt.viewZone : '') : S && ZONE_KEYS.includes(S.zone) ? S.zone : '');
  const uniOn = () => !!S && S.tier >= UNI_TIER;
  const zoneOf = k => { const Z = ZONE_GEO.find(Z => Z.lot[k]); return Z ? Z.zone : ''; };   // 그 건물이 있는 구역
  const geoIdx = t => { const v = t === undefined ? (S ? S.tier : 0) : t; const z = v >= UNI_TIER ? zoneKey(t !== undefined) : ''; return v >= UNI_TIER ? (z ? ZONE0 + ZONE_KEYS.indexOf(z) : CAMPUS_GI) : Math.max(0, Math.min(ZONE0 - 1, v)); };
  const geo = t => GEO[geoIdx(t)];
  const BLD_IMG = { classroom: 'bld_classroom_on', cafeteria: 'bld_cafeteria_on', library: 'bld_library_on', science: 'bld_science_on', store: 'bld_store_on', dorm: 'bld_dorm_on', union: 'bld_union_on', institute: 'bld_institute_on', gradhall: 'bld_gradhall_on' };
  const SITE_IMG = { classroom: 'bld_classroom_lock', science: 'bld_classroom_lock', library: 'bld_classroom_lock', cafeteria: 'bld_cafeteria_lock', playground: 'bld_playground_lock', store: 'bld_store_lock', dorm: 'bld_dorm_lock', union: 'bld_union_lock', institute: 'bld_lab_lock', gradhall: 'bld_gradhall_lock' };
  // 1.7.0 학교급별 건물 외관: 학교급이 오른 뒤 그 건물을 처음 키우면 그 학교급 모습으로 바뀌어요(가구와 같은 규칙).
  // S.bs[k]는 지금 보이는 모습의 학교급이고, 단계는 학교급 + 1(최대 4)이에요. 그림이 없는 단계는 바로 아래 단계 그림을 써요.
  // 1단계는 원래 그림(과학실과 운동장은 원래 그림이 2단계), 2~4단계는 1.7.0 묶음의 bld_{k}_s{n}이에요
  const IMG170 = k => (window.FS_IMG170 && window.FS_IMG170[k]) || IMG(k);
  const has170 = k => !!imgFind(k, HAS170_SETS);   // FS_IMG249: 3.0.0 관리자 고급 배경(작업지시서 49)
  const bldStage = k => Math.min(5, ((S.bs && S.bs[k]) || 0) + 1);   // 4.0.0 대학교 모습은 5단계(bld_*_s5)
  const stageKey = (pre, n, min) => { for (let i = n; i >= min; i--) if (has170(`${pre}_s${i}`)) return `${pre}_s${i}`; return ''; };
  const bldImg = k => {
    const n = bldStage(k);
    if (luxOn()) { const lk = k === 'playground' && S.tier >= 1 ? 'bld_field_lux' : `bld_${k}_lux`; if (has170(lk)) return lk; }   // 3.0.0 관리자 고급 건물
    if (k === 'playground') return S.tier >= 1 ? (stageKey('bld_field', n, 3) || 'bld_field_on') : 'bld_playground_on';
    if (k === 'science') return stageKey('bld_science', n, 3) || BLD_IMG[k];
    return stageKey('bld_' + k, n, 2) || BLD_IMG[k];
  };
  // 지붕 색 꾸미기: 단계 그림이면 그 단계 지붕 조각(없으면 지붕 색을 입히지 않아요), 원래 그림이면 원래 지붕 조각
  const roofKey = k => {
    if (/_lux$/.test(bldImg(k))) return '';   // 고급 건물에는 지붕 색을 입히지 않아요
    const m = bldImg(k).match(/^bld_(\w+)_s(\d)$/);
    if (m) return has170(`roof_${m[1]}_s${m[2]}`) ? `roof_${m[1]}_s${m[2]}` : '';
    return k === 'playground' ? (S.tier >= 1 ? 'roof_field' : 'roof_playground') : 'roof_' + k;
  };
  // 1.7.0 겨울 그림: 겨울 눈꽃과 크리스마스 배경 테마면 건물과 공사 자리를 눈 덮인 그림(_winter)으로, 참나무는 계절 그림(oak_봄, 가을, 겨울, 크리스마스)으로.
  // 겨울 그림이면 지붕 조각도 겨울 그림에서 오린 것(roof_*_winter)을 써요. 그림이 없으면 원래 그림 그대로예요
  const winterOn = () => !!(S && S.cos && S.cos.th && (thOn().bg === 'winter' || thOn().bg === 'xmas'));
  const seasonKey = key => winterOn() && has170(key + '_winter') ? key + '_winter' : key;
  const roofArtKey = k => {
    const rk = roofKey(k); if (!rk || seasonKey(bldImg(k)) === bldImg(k)) return rk;
    const wk = rk + '_winter';
    return has170(wk) ? wk : '';
  };
  const oakKey = () => { const id = S && S.cos && S.cos.th && thOn().bg; return id && has170('oak_' + id) ? 'oak_' + id : 'oak'; };
  function setBldArt(k) {
    const g = $('#b-' + k); if (!g || !geo().lot[k]) return;
    const key = seasonKey(bldImg(k)), G = geo(), [bx, by, bw, tf] = lotRect(G.lot[k], key);
    $$('.built .bimg, .built .roofimg', g).forEach(im => setA(im, { x: bx - bw / 2, y: by - bw / 2, width: bw, height: bw, transform: tf }));
    $('.built .bimg', g).setAttribute('href', IMG170(key));
    const rk = roofArtKey(k);
    setA($('.roofimg', g), { href: rk ? IMG170(rk) : '', filter: `url(#rt-${k})` });
  }
  // 테마를 바꾸면 건물, 공사 자리, 다음 학교급 자리, 참나무 그림을 다시 골라요
  function setSeasonArt() {
    if (!S || !$('#map')) return;
    for (const k of Object.keys(FAC)) { const g = $('#b-' + k); if (!g || !geo().lot[k]) continue; setBldArt(k); $('.site .bimg', g).setAttribute('href', IMG170(seasonKey(SITE_IMG[k]))); }
    const nx = $('#b-next'), G = geo(); if (nx && G.next) $('.bimg', nx).setAttribute('href', IMG170(seasonKey(G.next.img)));
    layoutOak();
  }
  // 1.7.0 테마 지도: 배경 테마(봄, 여름, 가을, 겨울, 크리스마스)를 고르면 지도 그림도 그 계절 모습으로 바꿔요. 그림이 없는 테마는 기본 지도
  // 3.0.0 woodani 요청: 관리자만 쓰는 고급 지도와 건물(작업지시서 49, 열쇠 map_*_lux, bld_*_lux). 이 기기에만 켜요(저장에는 안 들어가요)
  const luxOn = () => { if (rt.lux === undefined) { try { rt.lux = localStorage.getItem('forest-lux') === '1'; } catch (e) { rt.lux = false; } } return rt.lux; };
  const MAP_FILES = new Set([
    'map_campus_grad', 'map_campus_grad_spring', 'map_campus_grad_summer', 'map_campus_grad_autumn', 'map_campus_grad_winter', 'map_campus_grad_xmas', 'map_campus_grad_space', 'map_campus_grad_retro', 'map_zone_academic_grad', 'map_zone_academic_grad_spring', 'map_zone_academic_grad_summer', 'map_zone_academic_grad_autumn', 'map_zone_academic_grad_winter', 'map_zone_academic_grad_xmas', 'map_zone_academic_grad_space', 'map_zone_academic_grad_retro', 'map_zone_life_grad', 'map_zone_life_grad_spring', 'map_zone_life_grad_summer', 'map_zone_life_grad_autumn', 'map_zone_life_grad_winter', 'map_zone_life_grad_xmas', 'map_zone_life_grad_space', 'map_zone_life_grad_retro', 'map_zone_plaza_grad', 'map_zone_plaza_grad_spring', 'map_zone_plaza_grad_summer', 'map_zone_plaza_grad_autumn', 'map_zone_plaza_grad_winter', 'map_zone_plaza_grad_xmas', 'map_zone_plaza_grad_space', 'map_zone_plaza_grad_retro', 'map_zone_sports_grad', 'map_zone_sports_grad_spring', 'map_zone_sports_grad_summer', 'map_zone_sports_grad_autumn', 'map_zone_sports_grad_winter', 'map_zone_sports_grad_xmas', 'map_zone_sports_grad_space', 'map_zone_sports_grad_retro', 'map_zone_lab_grad', 'map_zone_lab_grad_spring', 'map_zone_lab_grad_summer', 'map_zone_lab_grad_autumn', 'map_zone_lab_grad_winter', 'map_zone_lab_grad_xmas', 'map_zone_lab_grad_space', 'map_zone_lab_grad_retro',   // 5.0.0 대학원판 지도(작업지시서 88, 89)
   'map_zone_lab_spring', 'map_zone_lab_summer', 'map_zone_lab_autumn', 'map_zone_lab_winter', 'map_zone_lab_xmas', 'map_zone_lab_space', 'map_zone_lab_retro',
    'map_campus_lab_spring', 'map_campus_lab_summer', 'map_campus_lab_autumn', 'map_campus_lab_winter', 'map_campus_lab_xmas', 'map_campus_lab_space', 'map_campus_lab_retro',   // 5.0.0 작업지시서 84
    'map_campus_winter', 'map_zone_academic_winter', 'map_zone_life_winter', 'map_zone_plaza_winter', 'map_zone_sports_winter',
    'map_campus_spring', 'map_zone_academic_spring', 'map_zone_life_spring', 'map_zone_plaza_spring', 'map_zone_sports_spring', 'map_campus_summer', 'map_zone_academic_summer', 'map_zone_life_summer', 'map_zone_plaza_summer', 'map_zone_sports_summer', 'map_campus_autumn', 'map_zone_academic_autumn', 'map_zone_life_autumn', 'map_zone_plaza_autumn', 'map_zone_sports_autumn', 'map_campus_xmas', 'map_zone_academic_xmas', 'map_zone_life_xmas', 'map_zone_plaza_xmas', 'map_zone_sports_xmas', 'map_campus_space', 'map_zone_academic_space', 'map_zone_life_space', 'map_zone_plaza_space', 'map_zone_sports_space', 'map_campus_retro', 'map_zone_academic_retro', 'map_zone_life_retro', 'map_zone_plaza_retro', 'map_zone_sports_retro']);   // 4.1.1 대학교 테마 지도 30장(작업지시서 68)   // 4.0.0 img/maps에 파일로만 있는 테마 지도(대학교는 기본과 겨울 먼저)
  const mapKey = (base, lux) => { const k = mapKey0(base, lux, false); return MAP_THEME_RE.test(k) && mapHi[k] === 'no' && APP_PACK() ? mapKey0(base, lux, true) : k; };   // 5.0.2 앱에서 테마 지도를 못 받았으면 기본 지도 열쇠(참나무 층도 기본 것)
  const mapKey0 = (base, lux, plain) => { if (gradOn()) { if (base === 'map_campus') base = MAP_FILES.has('map_campus_grad') ? 'map_campus_grad' : 'map_campus_lab'; else if (MAP_FILES.has(base + '_grad')) base += '_grad'; }   // 5.0.0 대학원 캠퍼스   // 5.0.0 woodani 결정: 대학원이면 대학원판 지도(작업지시서 88, 89, 자리는 대학교와 같아요)
    const id = !plain && S && S.cos && S.cos.th && thOn().bg; if (id && MAP_FILES.has(`${base}_${id}`)) return `${base}_${id}`; if ((lux || luxOn()) && has170(`${base}_lux`)) return `${base}_lux`; return id && has170(`${base}_${id}`) ? `${base}_${id}` : base; };
  // 1.8.0 지도 고화질: 게임 안 지도는 480×720이라 확대하면 흐려요. 게임 옆 img/maps 폴더의 원본 크기(1024×1536) 그림을 받아 다 오면 바꿔 끼워요.
  // 파일이 없거나 늦으면 게임 안 그림을 그대로 써요(곡 파일과 같은 방식)
  const IMG_BASE = () => window.FS_IMG_BASE || 'img/';
  // 3.3.0 woodani 제보(웹에 새 지도가 안 보임): 지도 파일 이름이 그대로라 웹이 7일 동안 저장해 둔 옛 지도를 썼어요. 지도 그림을 바꾼 판마다 MAPS_V를 올려요
  const MAPS_V = '500';   // 5.0.0 연구 구역 지도
  // 4.3.2 woodani 결정(앱 용량): 안드로이드와 토스 앱에는 테마 지도(봄, 여름, 가을, 겨울, 크리스마스, 우주, 레트로)의 고화질 그림과 참나무 층을 넣지 않고,
  // 고른 테마만 웹(GitHub Pages)에서 받아요. 웹은 한 번 받으면 기기에 남아요. 못 받으면(인터넷 없음) 게임 안에 든 지도 그림을 그대로 써요
  const MAP_WEB = WEB_ROOT + 'img/';
  const MAP_THEME_RE = /_(spring|summer|autumn|winter|xmas|space|retro)$/;
  const mapBase = key => APP_PACK() && MAP_THEME_RE.test(key) ? MAP_WEB : IMG_BASE();
  const mapRaw = key => mapBase(key) + 'maps/' + key + '.webp?v=' + MAPS_V;
  const mapUrl = key => webSrcMap[mapRaw(key)] || mapRaw(key);   // 기기 저장에서 꺼낸 그림이 있으면 그 주소
  const mapHi = {}, mapHiNo = {};   // 열쇠 → 'ok' | 'no' | 'wait', 못 받은 때
  // 5.0.2 앱 용량: 앱에는 게임 안 저화질 지도(img/a의 map_*)를 넣지 않아요. 앱은 처음부터 묶음 안 고화질 지도를 쓰고, 테마 지도가 오기 전이나 못 받았을 때는 기본 지도를 보여요
  const mapPlain = key => key.replace(MAP_THEME_RE, '');
  const mapLo = key => APP_PACK() ? (mapHi[key] === 'ok' ? mapUrl(key) : mapUrl(mapPlain(key))) : IMG170(key);
  // 3.3.4 woodani: 지도마다 오른쪽 아래에 그려진 큰 참나무를 누르는 참나무로 써요(게임이 따로 올리던 참나무 그림 대신).
  // 지도 열쇠 → 참나무 층(l)과 나무 지운 조각(p)의 자리 [x, y, 너비, 높이], 흔드는 중심(pv), 누르는 자리(tap [x, y, 반지름]), 도토리 맺히는 자리(nuts), 떨어지는 자리(drop). 모두 지도 좌표.
  // 표는 dev/oak_pack.py가 작업지시서 54 그림에서 만들어요. 그림 파일(img/maps/oakl_*, oakp_*)이 없거나 못 받으면 예전 참나무 그림을 그대로 써요
  const MAP_OAK = {
    /*MAP_OAK_BEGIN*/
    map_kinder: {l: [230.6, 302.1, 129.4, 116.4], p: [215.2, 286.6, 144.8, 147.3], pv: [316.8, 412.1], tap: [295.7, 360.3, 48], nuts: [[294.6, 348.5], [355.8, 373.8], [355.8, 327.4], [235.5, 367.5], [250.3, 338.0], [311.5, 373.8]], drop: [[273.5, 404.1], [280.5, 417.4], [292.9, 424.5], [310.4, 426.2], [331.2, 423.4], [341.7, 414.6], [343.8, 398.8], [284.1, 390.0]]},
    map_elem: {l: [241.5, 303.2, 118.5, 114.3], p: [226.1, 287.7, 133.9, 145.2], pv: [317.5, 411.4], tap: [301.1, 360.3, 48], nuts: [[301.3, 349.2], [246.4, 372.4], [356.1, 372.4], [356.1, 328.1], [259.1, 345.0], [286.5, 372.4]], drop: [[272.5, 404.1], [279.5, 417.8], [291.8, 424.8], [309.4, 426.6], [330.1, 423.8], [340.7, 417.4], [348.0, 402.3], [283.0, 390.4]]},
    map_middle: {l: [241.2, 300.7, 118.8, 120.9], p: [225.7, 285.2, 134.3, 151.9], pv: [324.1, 415.0], tap: [300.9, 361.1, 48], nuts: [[300.9, 348.2], [355.8, 373.5], [355.8, 327.1], [246.1, 369.3], [258.8, 343.9], [288.3, 373.5]], drop: [[279.5, 408.3], [286.5, 421.6], [298.8, 428.7], [316.4, 429.7], [336.8, 427.6], [348.0, 418.8], [349.8, 403.0], [290.0, 394.2]]},
    map_high: {l: [264.0, 348.2, 96.0, 80.9], p: [248.6, 332.7, 111.4, 111.8], pv: [332.2, 423.4], tap: [312.4, 388.6, 48], nuts: [[311.1, 380.5], [355.4, 397.4], [353.3, 365.7], [271.1, 395.3], [323.8, 397.4], [283.7, 374.2]], drop: [[285.5, 417.8], [293.2, 430.8], [304.8, 438.2], [322.4, 439.9], [343.1, 437.1], [353.7, 428.3], [355.8, 412.5], [293.6, 406.5]]},
    map_zone_academic: {l: [224.6, 235.0, 125.5, 88.6], p: [209.2, 219.5, 150.8, 119.5], pv: [285.8, 316.2], tap: [287.4, 279.3, 48], nuts: [[286.5, 271.2], [345.6, 285.9], [229.6, 279.6], [326.6, 258.5], [250.7, 256.4], [263.3, 288.0]], drop: [[235.9, 326.0], [246.1, 339.0], [266.1, 341.8], [292.5, 339.4], [311.8, 329.5], [327.7, 315.5], [319.6, 297.9], [234.1, 308.4]]},
    map_zone_life: {l: [232.4, 270.8, 100.9, 87.2], p: [216.9, 255.4, 131.8, 118.1], pv: [283.7, 351.7], tap: [282.8, 314.4, 48], nuts: [[283.7, 306.7], [237.3, 321.4], [241.5, 289.8], [325.9, 323.6], [317.5, 302.5], [268.9, 323.6]], drop: [[228.5, 354.8], [243.6, 365.4], [267.5, 368.9], [292.1, 370.3], [312.2, 363.3], [335.0, 350.3], [327.7, 333.4], [246.1, 343.6]]},
    map_zone_plaza: {l: [0.0, 239.5, 89.6, 72.4], p: [0.0, 224.1, 105.1, 103.4], pv: [42.9, 303.2], tap: [44.8, 275.7, 48], nuts: [[45.0, 268.0], [4.9, 282.8], [83.0, 282.8], [11.2, 259.6], [76.6, 261.7], [32.3, 282.8]], drop: [[11.2, 299.6], [18.6, 316.9], [34.8, 328.8], [54.8, 329.5], [73.1, 319.7], [83.7, 302.8], [77.0, 289.5], [16.5, 296.5]]},
    map_zone_sports: {l: [1.8, 239.9, 99.8, 91.8], p: [0.0, 224.4, 117.1, 122.7], pv: [53.8, 325.0], tap: [51.7, 285.8, 48], nuts: [[51.0, 276.8], [6.7, 295.8], [91.1, 295.8], [21.4, 259.9], [84.7, 264.1], [40.4, 295.8]], drop: [[14.4, 329.9], [21.8, 340.4], [41.1, 347.8], [61.5, 350.6], [80.2, 342.5], [93.9, 325.3], [89.3, 308.8], [26.7, 314.4]]},
    map_elem_autumn: {_: 'map_elem', l: [238.4, 301.1, 121.6, 117.8], p: [222.9, 285.6, 137.1, 148.7], tap: [299.5, 360.0, 48], nuts: [[298.1, 347.8], [355.1, 373.1], [245.4, 373.1], [355.1, 326.7], [310.8, 373.1], [258.0, 345.7]]},
    map_elem_lux: {_: 'map_elem', l: [240.8, 303.2, 119.2, 115.0], p: [225.4, 287.7, 134.6, 145.9], tap: [300.7, 360.7, 48], nuts: [[300.6, 349.2], [245.7, 372.4], [355.4, 330.2], [349.1, 372.4], [277.4, 328.1], [285.8, 372.4]]},
    map_elem_retro: {_: 'map_elem', l: [240.5, 313.7, 119.5, 105.8], p: [225.0, 298.2, 135.0, 136.8], tap: [300.6, 366.6, 48], nuts: [[300.2, 355.9], [245.4, 370.7], [350.9, 336.9], [342.4, 374.9], [264.4, 339.0], [281.2, 374.9]]},
    map_elem_space: {_: 'map_elem', l: [239.4, 304.2, 120.6, 118.8], p: [223.9, 288.8, 136.1, 149.8], tap: [300.1, 363.6, 48], nuts: [[299.2, 351.3], [246.4, 372.4], [356.1, 349.2], [326.6, 376.6], [326.6, 330.2], [259.1, 345.0]]},
    map_elem_spring: {_: 'map_elem', l: [241.9, 303.9, 118.1, 114.3], p: [226.4, 288.4, 133.6, 145.2], tap: [301.3, 361.0, 48], nuts: [[301.6, 349.9], [246.8, 373.1], [356.5, 328.8], [350.2, 373.1], [259.5, 345.7], [286.9, 373.1]]},
    map_elem_summer: {_: 'map_elem', l: [234.1, 310.5, 125.9, 107.6], p: [218.7, 295.1, 141.3, 138.5], tap: [297.4, 364.3, 48], nuts: [[296.0, 353.1], [355.1, 334.1], [239.1, 370.0], [338.2, 374.2], [270.7, 334.1], [283.4, 376.3]]},
    map_elem_winter: {_: 'map_elem', l: [238.7, 303.9, 121.3, 116.7], p: [223.2, 288.4, 136.8, 147.7], tap: [299.7, 362.2, 48], nuts: [[296.4, 350.6], [355.4, 333.8], [349.1, 373.8], [258.4, 371.7], [309.0, 373.8], [283.7, 329.5]]},
    map_elem_xmas: {_: 'map_elem', l: [237.3, 304.9, 122.7, 115.0], p: [221.8, 289.5, 138.2, 145.9], tap: [299.0, 362.4, 48], nuts: [[299.2, 351.0], [242.2, 374.2], [356.1, 329.9], [351.9, 372.1], [257.0, 348.9], [284.4, 374.2]]},
    map_high_autumn: {_: 'map_high', l: [261.6, 347.8, 98.4, 84.4], p: [246.1, 332.3, 113.9, 115.3], tap: [311.1, 390.0, 48], nuts: [[310.8, 380.9], [266.5, 397.7], [353.0, 366.1], [348.8, 397.7], [281.2, 374.5], [298.1, 397.7]]},
    map_high_lux: {_: 'map_high', l: [263.3, 347.8, 96.7, 84.4], p: [247.9, 332.3, 112.1, 115.3], tap: [312.0, 390.0, 48], nuts: [[312.5, 380.9], [268.2, 395.6], [356.8, 395.6], [354.7, 366.1], [280.9, 374.5], [299.9, 397.7]]},
    map_high_retro: {_: 'map_high', l: [263.7, 347.5, 96.3, 85.4], p: [248.2, 332.0, 111.8, 116.4], tap: [312.2, 390.2, 48], nuts: [[310.8, 380.9], [353.0, 366.1], [350.9, 397.7], [268.6, 393.5], [302.3, 399.8], [281.2, 374.5]]},
    map_high_space: {_: 'map_high', l: [260.5, 345.0, 99.5, 86.8], p: [245.0, 329.5, 115.0, 117.8], tap: [310.6, 388.4, 48], nuts: [[309.7, 378.8], [265.4, 395.6], [356.1, 366.1], [347.7, 397.7], [299.2, 397.7], [280.2, 374.5]]},
    map_high_spring: {_: 'map_high', l: [263.0, 347.1, 97.0, 82.6], p: [247.5, 331.6, 112.5, 113.6], tap: [311.8, 388.4, 48], nuts: [[312.2, 379.8], [267.9, 396.7], [356.5, 396.7], [354.4, 365.0], [280.5, 375.6], [299.5, 396.7]]},
    map_high_summer: {_: 'map_high', l: [262.6, 347.1, 97.4, 84.0], p: [247.1, 331.6, 112.9, 115.0], tap: [311.7, 389.1, 48], nuts: [[311.8, 380.2], [267.5, 397.0], [356.1, 397.0], [354.0, 365.4], [280.2, 375.9], [299.2, 397.0]]},
    map_high_winter: {_: 'map_high', l: [261.9, 346.8, 98.1, 84.0], p: [246.4, 331.3, 113.6, 115.0], tap: [311.3, 388.8, 48], nuts: [[309.0, 379.8], [355.4, 367.1], [266.8, 392.5], [347.0, 396.7], [325.9, 365.0], [300.6, 396.7]]},
    map_high_xmas: {_: 'map_high', l: [261.6, 345.4, 98.4, 87.5], p: [246.1, 329.9, 113.9, 118.5], tap: [311.1, 389.1, 48], nuts: [[310.8, 381.2], [355.1, 364.3], [355.1, 398.1], [266.5, 393.9], [281.2, 374.9], [323.4, 364.3]]},
    map_kinder_autumn: {_: 'map_kinder', l: [226.1, 302.5, 133.9, 114.3], p: [210.6, 287.0, 149.4, 145.2], tap: [293.4, 359.6, 48], nuts: [[292.1, 348.5], [355.4, 371.7], [231.0, 367.5], [353.3, 329.5], [247.9, 340.1], [313.2, 371.7]]},
    map_kinder_lux: {_: 'map_kinder', l: [228.9, 302.5, 131.1, 115.7], p: [213.4, 287.0, 146.6, 146.6], tap: [294.8, 360.3, 48], nuts: [[295.0, 348.9], [356.1, 372.1], [356.1, 327.8], [233.8, 367.9], [248.6, 338.3], [313.9, 372.1]]},
    map_kinder_retro: {_: 'map_kinder', l: [228.2, 301.8, 131.8, 116.4], p: [212.7, 286.3, 147.3, 147.3], tap: [294.4, 360.0, 48], nuts: [[294.3, 348.2], [355.4, 369.3], [235.2, 369.3], [344.9, 327.1], [250.0, 339.7], [311.1, 373.5]]},
    map_kinder_space: {_: 'map_kinder', l: [229.9, 302.5, 130.1, 115.0], p: [214.5, 287.0, 145.5, 145.9], tap: [295.3, 360.0, 48], nuts: [[293.9, 348.5], [355.1, 371.7], [355.1, 327.4], [234.8, 365.4], [249.6, 338.0], [312.9, 371.7]]},
    map_kinder_spring: {_: 'map_kinder', l: [229.6, 302.1, 130.4, 116.0], p: [214.1, 286.6, 145.9, 147.0], tap: [295.1, 360.1, 48], nuts: [[295.7, 348.5], [352.6, 371.7], [234.5, 365.4], [354.7, 329.5], [251.4, 338.0], [312.5, 371.7]]},
    map_kinder_summer: {_: 'map_kinder', l: [229.9, 302.5, 130.1, 115.7], p: [214.5, 287.0, 145.5, 146.6], tap: [295.3, 360.3, 48], nuts: [[293.9, 348.9], [355.1, 372.1], [355.1, 327.8], [234.8, 367.9], [249.6, 338.3], [312.9, 372.1]]},
    map_kinder_winter: {_: 'map_kinder', l: [229.2, 310.5, 130.8, 107.9], p: [213.8, 295.1, 146.2, 138.9], tap: [294.9, 364.5, 48], nuts: [[295.3, 353.1], [356.5, 367.9], [236.2, 357.3], [343.8, 334.1], [316.4, 376.3], [270.0, 334.1]]},
    map_kinder_xmas: {_: 'map_kinder', l: [225.7, 299.6, 134.3, 122.3], p: [210.2, 284.2, 149.8, 153.3], tap: [293.2, 360.8, 48], nuts: [[291.8, 349.6], [355.1, 374.9], [355.1, 330.6], [230.6, 366.4], [247.5, 336.9], [310.8, 374.9]]},
    map_middle_autumn: {_: 'map_middle', l: [240.8, 301.1, 119.2, 120.2], p: [225.4, 285.6, 134.6, 151.2], tap: [300.7, 361.1, 48], nuts: [[300.6, 348.5], [355.4, 373.8], [355.4, 327.4], [245.7, 369.6], [258.4, 344.3], [287.9, 373.8]]},
    map_middle_lux: {_: 'map_middle', l: [240.8, 300.7, 119.2, 121.6], p: [225.4, 285.2, 134.6, 152.6], tap: [300.7, 361.5, 48], nuts: [[300.6, 348.5], [355.4, 373.8], [355.4, 327.4], [245.7, 367.5], [287.9, 373.8], [262.6, 340.1]]},
    map_middle_retro: {_: 'map_middle', l: [240.8, 301.8, 119.2, 120.6], p: [225.4, 286.3, 134.6, 151.5], tap: [300.7, 362.1, 48], nuts: [[300.6, 349.2], [355.4, 370.3], [245.7, 368.2], [351.2, 334.5], [287.9, 374.5], [262.6, 340.8]]},
    map_middle_space: {_: 'map_middle', l: [239.8, 302.1, 120.2, 121.6], p: [224.3, 286.6, 135.7, 152.6], tap: [300.2, 362.9, 48], nuts: [[299.5, 349.9], [356.5, 373.1], [356.5, 328.8], [253.1, 375.2], [257.3, 343.6], [312.2, 375.2]]},
    map_middle_spring: {_: 'map_middle', l: [239.1, 301.4, 120.9, 120.6], p: [223.6, 285.9, 136.4, 151.5], tap: [299.9, 361.7, 48], nuts: [[298.8, 348.9], [355.8, 374.2], [355.8, 327.8], [248.2, 374.2], [256.6, 344.6], [311.5, 374.2]]},
    map_middle_summer: {_: 'map_middle', l: [236.6, 301.4, 123.4, 120.9], p: [221.1, 285.9, 138.9, 151.9], tap: [298.7, 361.8, 48], nuts: [[298.5, 348.9], [355.4, 374.2], [355.4, 327.8], [241.5, 370.0], [256.3, 344.6], [283.7, 374.2]]},
    map_middle_winter: {_: 'map_middle', l: [241.5, 310.5, 118.5, 112.1], p: [226.1, 295.1, 133.9, 143.1], tap: [301.1, 366.6, 48], nuts: [[301.3, 356.2], [356.1, 335.2], [354.0, 371.0], [250.7, 358.4], [273.9, 337.3], [278.1, 377.3]]},
    map_middle_xmas: {_: 'map_middle', l: [236.2, 300.0, 123.8, 133.6], p: [220.8, 284.5, 139.2, 164.5], tap: [298.5, 366.8, 48], nuts: [[298.1, 352.4], [355.1, 381.9], [355.1, 329.2], [243.3, 373.5], [306.6, 381.9], [253.8, 343.9]]},
    map_zone_academic_winter: {_: 'map_zone_academic', nuts: [[286.5, 271.2], [345.6, 288.0], [229.6, 281.7], [328.7, 260.6], [250.7, 256.4], [309.7, 288.0]], drop: [[235.9, 326.0], [246.1, 339.0], [266.1, 341.8], [292.5, 339.4], [311.8, 329.5], [328.0, 313.7], [322.7, 298.9], [234.1, 308.4]]},
    map_zone_life_winter: {_: 'map_zone_life', nuts: [[283.7, 306.7], [237.3, 323.6], [328.0, 319.3], [243.6, 294.0], [268.9, 323.6], [311.1, 298.2]], drop: [[228.5, 354.8], [243.6, 365.4], [267.5, 368.9], [292.1, 370.3], [311.8, 363.6], [334.3, 351.7], [329.1, 336.9], [246.1, 343.6]]},
    map_zone_plaza_winter: {_: 'map_zone_plaza', nuts: [[45.0, 268.0], [4.9, 282.8], [85.1, 280.7], [17.6, 255.4], [66.1, 257.5], [32.3, 282.8]], drop: [[11.2, 294.4], [18.6, 321.8], [34.8, 328.8], [54.8, 329.5], [73.1, 319.7], [84.4, 301.4], [77.0, 290.2], [17.2, 293.0]]},
    map_zone_sports_winter: {_: 'map_zone_sports', nuts: [[51.0, 276.8], [8.8, 295.8], [93.2, 295.8], [84.7, 262.0], [21.4, 262.0], [40.4, 295.8]], drop: [[14.4, 332.0], [21.8, 340.4], [41.1, 347.8], [61.5, 350.6], [80.2, 342.5], [95.3, 323.2], [89.3, 308.8], [26.7, 314.4]]},
    map_zone_academic_spring: {_: 'map_zone_academic', nuts: [[286.5, 271.2], [345.6, 288.0], [229.6, 281.7], [328.7, 260.6], [252.8, 256.4], [309.7, 288.0]]},
    map_zone_life_spring: {_: 'map_zone_life', nuts: [[283.7, 306.7], [237.3, 323.6], [241.5, 289.8], [325.9, 323.6], [315.4, 302.5], [268.9, 323.6]]},
    map_zone_plaza_spring: {_: 'map_zone_plaza', nuts: [[45.0, 268.0], [2.8, 282.8], [83.0, 282.8], [11.2, 259.6], [76.6, 261.7], [30.2, 282.8]]},
    map_zone_sports_spring: {_: 'map_zone_sports', nuts: [[51.0, 276.8], [4.6, 295.8], [91.1, 295.8], [78.4, 259.9], [15.1, 270.5], [38.3, 295.8]]},
    map_zone_academic_summer: {_: 'map_zone_academic', nuts: [[286.5, 271.2], [345.6, 288.0], [229.6, 279.6], [328.7, 260.6], [252.8, 254.3], [263.3, 288.0]]},
    map_zone_life_summer: {_: 'map_zone_life', nuts: [[283.7, 306.7], [237.3, 323.6], [239.4, 289.8], [325.9, 323.6], [315.4, 302.5], [268.9, 323.6]]},
    map_zone_plaza_summer: {_: 'map_zone_plaza', nuts: [[45.0, 268.0], [2.8, 282.8], [83.0, 282.8], [11.2, 259.6], [76.6, 261.7], [30.2, 282.8]]},
    map_zone_sports_summer: {_: 'map_zone_sports', nuts: [[51.0, 276.8], [4.6, 295.8], [91.1, 295.8], [78.4, 259.9], [15.1, 272.6], [38.3, 295.8]]},
    map_zone_academic_autumn: {_: 'map_zone_academic', nuts: [[286.5, 271.2], [345.6, 288.0], [229.6, 281.7], [328.7, 260.6], [248.6, 258.5], [309.7, 288.0]]},
    map_zone_life_autumn: {_: 'map_zone_life', nuts: [[283.7, 306.7], [237.3, 323.6], [239.4, 291.9], [325.9, 323.6], [315.4, 302.5], [268.9, 323.6]]},
    map_zone_plaza_autumn: {_: 'map_zone_plaza', nuts: [[45.0, 268.0], [2.8, 282.8], [83.0, 282.8], [11.2, 259.6], [76.6, 261.7], [30.2, 282.8]]},
    map_zone_sports_autumn: {_: 'map_zone_sports', nuts: [[51.0, 276.8], [4.6, 295.8], [91.1, 295.8], [78.4, 259.9], [15.1, 270.5], [38.3, 295.8]]},
    map_zone_academic_xmas: {_: 'map_zone_academic', nuts: [[286.5, 271.2], [343.5, 285.9], [231.7, 285.9], [248.6, 260.6], [324.5, 260.6], [307.6, 288.0]]},
    map_zone_life_xmas: {_: 'map_zone_life', nuts: [[283.7, 306.7], [239.4, 323.6], [241.5, 289.8], [325.9, 323.6], [317.5, 302.5], [271.1, 323.6]]},
    map_zone_plaza_xmas: {_: 'map_zone_plaza', nuts: [[45.0, 268.0], [2.8, 282.8], [85.1, 282.8], [15.5, 255.4], [74.5, 263.8], [30.2, 282.8]]},
    map_zone_sports_xmas: {_: 'map_zone_sports', nuts: [[51.0, 276.8], [4.6, 295.8], [97.4, 289.5], [78.4, 259.9], [15.1, 272.6], [65.7, 295.8]]},
    map_zone_academic_space: {_: 'map_zone_academic', nuts: [[286.5, 271.2], [343.5, 288.0], [229.6, 281.7], [328.7, 260.6], [250.7, 256.4], [263.3, 288.0]]},
    map_zone_life_space: {_: 'map_zone_life', nuts: [[283.7, 306.7], [237.3, 323.6], [241.5, 289.8], [325.9, 323.6], [315.4, 302.5], [268.9, 323.6]]},
    map_zone_plaza_space: {_: 'map_zone_plaza', nuts: [[45.0, 268.0], [2.8, 282.8], [83.0, 282.8], [11.2, 259.6], [76.6, 263.8], [30.2, 282.8]]},
    map_zone_sports_space: {_: 'map_zone_sports', nuts: [[51.0, 276.8], [4.6, 295.8], [91.1, 295.8], [86.8, 264.1], [13.0, 270.5], [38.3, 295.8]]},
    map_zone_academic_retro: {_: 'map_zone_academic', nuts: [[286.5, 271.2], [345.6, 285.9], [229.6, 279.6], [326.6, 258.5], [252.8, 254.3], [263.3, 288.0]]},
    map_zone_life_retro: {_: 'map_zone_life'},
    map_zone_plaza_retro: {_: 'map_zone_plaza', nuts: [[45.0, 268.0], [2.8, 282.8], [83.0, 282.8], [11.2, 259.6], [76.6, 261.7], [30.2, 282.8]]},
    map_zone_sports_retro: {_: 'map_zone_sports', nuts: [[51.0, 276.8], [8.8, 295.8], [91.1, 295.8], [84.7, 264.1], [23.6, 259.9], [40.4, 295.8]]},
    map_zone_lab: {l: [204.3, 227.9, 152.6, 109.7], p: [188.8, 212.5, 171.2, 140.6], pv: [284.8, 327.8], tap: [283.0, 282.8, 48], nuts: [[280.9, 270.8], [209.2, 289.8], [352.6, 289.8], [329.4, 258.2], [240.8, 251.8], [255.6, 294.0]], drop: [[231.0, 343.6], [247.5, 350.3], [264.7, 354.8], [282.7, 355.9], [303.0, 353.4], [322.0, 343.6], [340.7, 325.0], [223.6, 323.2]]},
    map_zone_lab_spring: {_: 'map_zone_lab', nuts: [[280.9, 270.8], [209.2, 289.8], [352.6, 289.8], [329.4, 258.2], [236.6, 256.1], [255.6, 294.0]]},
    map_zone_lab_summer: {_: 'map_zone_lab', nuts: [[280.9, 270.8], [209.2, 289.8], [352.6, 289.8], [329.4, 258.2], [236.6, 253.9], [255.6, 294.0]]},
    map_zone_lab_autumn: {_: 'map_zone_lab', nuts: [[280.9, 270.8], [209.2, 289.8], [350.5, 291.9], [331.5, 260.3], [236.6, 253.9], [255.6, 294.0]]},
    map_zone_lab_winter: {_: 'map_zone_lab', nuts: [[280.9, 270.8], [211.3, 294.0], [348.4, 294.0], [226.1, 260.3], [329.4, 256.1], [255.6, 294.0]]},
    map_zone_lab_xmas: {_: 'map_zone_lab', nuts: [[280.9, 270.8], [211.3, 294.0], [352.6, 287.7], [329.4, 256.1], [228.2, 262.4], [308.3, 294.0]]},
    map_zone_lab_space: {_: 'map_zone_lab', nuts: [[280.9, 270.8], [213.4, 294.0], [352.6, 287.7], [228.2, 260.3], [329.4, 258.2], [308.3, 294.0]]},
    map_zone_lab_retro: {_: 'map_zone_lab', nuts: [[280.9, 270.8], [213.4, 294.0], [352.6, 287.7], [228.2, 262.4], [329.4, 258.2], [308.3, 294.0]]},
    map_zone_academic_grad: {_: 'map_zone_academic', l: [213.8, 228.6, 143.4, 100.5], p: [198.3, 213.2, 161.7, 131.5], tap: [285.5, 278.9, 48], nuts: [[286.2, 269.4], [216.6, 290.5], [353.7, 290.5], [334.7, 252.5], [241.9, 250.4], [258.8, 290.5]]},
    map_zone_life_grad: {_: 'map_zone_life', l: [222.2, 265.2, 117.8, 97.4], p: [206.7, 249.7, 148.7, 128.3], tap: [281.1, 313.9, 48], nuts: [[282.0, 303.2], [227.1, 324.3], [336.8, 324.3], [229.2, 286.3], [324.1, 296.8], [265.1, 324.3]]},
    map_zone_plaza_grad: {_: 'map_zone_plaza', l: [0.0, 235.0, 95.6, 78.8], p: [0.0, 219.5, 111.1, 109.7], tap: [47.5, 274.3, 48], nuts: [[47.1, 267.0], [2.8, 252.2], [91.4, 279.6], [4.9, 281.7], [80.9, 256.4], [32.3, 252.2]]},
    map_zone_sports_grad: {_: 'map_zone_sports', l: [0.0, 235.3, 112.5, 102.0], p: [0.0, 219.8, 128.0, 132.9], tap: [55.9, 286.3, 48], nuts: [[55.5, 276.4], [2.8, 297.5], [108.3, 291.2], [2.8, 261.7], [93.5, 259.6], [72.4, 297.5]]},
    map_zone_lab_grad: {_: 'map_zone_lab', l: [200.4, 224.4, 159.6, 116.7], p: [184.9, 208.9, 175.1, 147.7], tap: [280.4, 282.8, 48], nuts: [[279.1, 271.2], [355.1, 294.4], [203.2, 292.3], [336.1, 256.4], [224.3, 258.5], [249.6, 294.4]]},
    map_zone_academic_grad_winter: {_: 'map_zone_academic', l: [213.0, 228.3, 144.5, 103.0], p: [197.6, 212.8, 162.4, 133.9], tap: [285.3, 279.8, 48], nuts: [[285.5, 269.8], [218.0, 290.9], [353.0, 290.9], [338.2, 257.1], [237.0, 252.9], [260.2, 290.9]]},
    map_zone_life_grad_winter: {_: 'map_zone_life', l: [222.2, 265.2, 118.1, 100.9], p: [206.7, 249.7, 149.1, 131.8], tap: [281.2, 315.6, 48], nuts: [[282.0, 306.3], [225.0, 323.2], [336.8, 325.3], [231.3, 287.3], [324.1, 297.9], [260.9, 325.3]]},
    map_zone_plaza_grad_winter: {_: 'map_zone_plaza', l: [0.0, 233.6, 94.2, 84.4], p: [0.0, 218.1, 109.7, 115.3], tap: [46.8, 275.7, 48], nuts: [[47.1, 266.6], [2.8, 283.5], [89.3, 283.5], [4.9, 253.9], [83.0, 260.3], [34.5, 283.5]]},
    map_zone_sports_grad_winter: {_: 'map_zone_sports', l: [0.0, 232.5, 110.7, 106.5], p: [0.0, 217.0, 126.2, 137.5], tap: [55.0, 285.8, 48], nuts: [[55.5, 274.7], [2.8, 297.9], [99.8, 297.9], [2.8, 262.0], [99.8, 268.4], [42.9, 297.9]]},
    map_zone_lab_grad_winter: {_: 'map_zone_lab', l: [200.7, 224.4, 159.3, 116.7], p: [185.3, 208.9, 174.7, 147.7], tap: [280.5, 282.8, 48], nuts: [[279.5, 271.2], [355.4, 292.3], [205.7, 294.4], [222.5, 258.5], [334.3, 256.4], [309.0, 294.4]]},
    map_zone_academic_grad_spring: {_: 'map_zone_academic', l: [213.0, 228.3, 144.5, 103.0], p: [197.6, 212.8, 162.4, 133.9], tap: [285.3, 279.8, 48], nuts: [[285.5, 269.8], [218.0, 290.9], [353.0, 290.9], [334.0, 250.8], [237.0, 252.9], [260.2, 290.9]]},
    map_zone_life_grad_spring: {_: 'map_zone_life', l: [222.2, 265.2, 118.1, 100.9], p: [206.7, 249.7, 149.1, 131.8], tap: [281.2, 315.6, 48], nuts: [[282.0, 306.3], [225.0, 323.2], [336.8, 325.3], [231.3, 287.3], [324.1, 295.8], [260.9, 325.3]]},
    map_zone_plaza_grad_spring: {_: 'map_zone_plaza', l: [0.0, 233.6, 95.6, 84.4], p: [0.0, 218.1, 111.1, 115.3], tap: [47.5, 275.7, 48], nuts: [[47.1, 266.6], [2.8, 283.5], [2.8, 251.8], [89.3, 283.5], [80.9, 256.1], [34.5, 283.5]]},
    map_zone_sports_grad_spring: {_: 'map_zone_sports', l: [0.0, 232.5, 112.5, 106.5], p: [0.0, 217.0, 128.0, 137.5], tap: [55.9, 285.8, 48], nuts: [[55.5, 274.7], [2.8, 297.9], [102.0, 297.9], [2.8, 262.0], [102.0, 268.4], [42.9, 297.9]]},
    map_zone_lab_grad_spring: {_: 'map_zone_lab', l: [200.4, 224.4, 159.6, 116.7], p: [184.9, 208.9, 175.1, 147.7], tap: [280.4, 282.8, 48], nuts: [[279.1, 271.2], [355.1, 294.4], [203.2, 292.3], [336.1, 256.4], [224.3, 258.5], [249.6, 294.4]]},
    map_zone_academic_grad_summer: {_: 'map_zone_academic', l: [213.0, 228.3, 144.5, 103.0], p: [197.6, 212.8, 162.4, 133.9], tap: [285.3, 279.8, 48], nuts: [[285.5, 269.8], [218.0, 290.9], [353.0, 290.9], [334.0, 250.8], [237.0, 252.9], [260.2, 290.9]]},
    map_zone_life_grad_summer: {_: 'map_zone_life', l: [222.2, 265.2, 118.1, 100.9], p: [206.7, 249.7, 149.1, 131.8], tap: [281.2, 315.6, 48], nuts: [[282.0, 306.3], [225.0, 323.2], [336.8, 325.3], [231.3, 287.3], [324.1, 295.8], [260.9, 325.3]]},
    map_zone_plaza_grad_summer: {_: 'map_zone_plaza', l: [0.0, 233.6, 95.6, 84.4], p: [0.0, 218.1, 111.1, 115.3], tap: [47.5, 275.7, 48], nuts: [[47.1, 266.6], [2.8, 283.5], [2.8, 251.8], [89.3, 283.5], [80.9, 256.1], [34.5, 283.5]]},
    map_zone_sports_grad_summer: {_: 'map_zone_sports', l: [0.0, 232.5, 112.5, 106.5], p: [0.0, 217.0, 128.0, 137.5], tap: [55.9, 285.8, 48], nuts: [[55.5, 274.7], [2.8, 297.9], [102.0, 297.9], [2.8, 262.0], [102.0, 268.4], [42.9, 297.9]]},
    map_zone_lab_grad_summer: {_: 'map_zone_lab', l: [200.4, 224.4, 159.6, 116.7], p: [184.9, 208.9, 175.1, 147.7], tap: [280.4, 282.8, 48], nuts: [[279.1, 271.2], [355.1, 294.4], [203.2, 292.3], [336.1, 256.4], [224.3, 258.5], [249.6, 294.4]]},
    map_zone_academic_grad_autumn: {_: 'map_zone_academic', l: [213.0, 228.3, 144.5, 103.0], p: [197.6, 212.8, 162.4, 133.9], tap: [285.3, 279.8, 48], nuts: [[285.5, 269.8], [218.0, 290.9], [353.0, 290.9], [334.0, 250.8], [237.0, 252.9], [260.2, 290.9]]},
    map_zone_life_grad_autumn: {_: 'map_zone_life', l: [222.2, 265.2, 118.1, 100.9], p: [206.7, 249.7, 149.1, 131.8], tap: [281.2, 315.6, 48], nuts: [[282.0, 306.3], [225.0, 323.2], [336.8, 325.3], [231.3, 287.3], [324.1, 295.8], [260.9, 325.3]]},
    map_zone_plaza_grad_autumn: {_: 'map_zone_plaza', l: [0.0, 233.6, 95.6, 84.4], p: [0.0, 218.1, 111.1, 115.3], tap: [47.5, 275.7, 48], nuts: [[47.1, 266.6], [2.8, 283.5], [2.8, 251.8], [89.3, 283.5], [80.9, 256.1], [34.5, 283.5]]},
    map_zone_sports_grad_autumn: {_: 'map_zone_sports', l: [0.0, 232.5, 112.5, 106.5], p: [0.0, 217.0, 128.0, 137.5], tap: [55.9, 285.8, 48], nuts: [[55.5, 274.7], [2.8, 297.9], [102.0, 297.9], [2.8, 262.0], [102.0, 268.4], [42.9, 297.9]]},
    map_zone_lab_grad_autumn: {_: 'map_zone_lab', l: [200.4, 224.4, 159.6, 116.7], p: [184.9, 208.9, 175.1, 147.7], tap: [280.4, 282.8, 48], nuts: [[279.1, 271.2], [355.1, 294.4], [203.2, 292.3], [336.1, 256.4], [224.3, 258.5], [249.6, 294.4]]},
    map_zone_academic_grad_xmas: {_: 'map_zone_academic', l: [213.0, 228.3, 144.5, 103.0], p: [197.6, 212.8, 162.4, 133.9], tap: [285.3, 279.8, 48], nuts: [[285.5, 269.8], [218.0, 290.9], [353.0, 290.9], [334.0, 250.8], [237.0, 252.9], [260.2, 290.9]]},
    map_zone_life_grad_xmas: {_: 'map_zone_life', l: [222.2, 265.2, 118.1, 100.9], p: [206.7, 249.7, 149.1, 131.8], tap: [281.2, 315.6, 48], nuts: [[282.0, 306.3], [225.0, 323.2], [336.8, 325.3], [231.3, 287.3], [324.1, 295.8], [260.9, 325.3]]},
    map_zone_plaza_grad_xmas: {_: 'map_zone_plaza', l: [0.0, 233.6, 95.6, 84.4], p: [0.0, 218.1, 111.1, 115.3], tap: [47.5, 275.7, 48], nuts: [[47.1, 266.6], [2.8, 283.5], [2.8, 251.8], [89.3, 283.5], [80.9, 256.1], [34.5, 283.5]]},
    map_zone_sports_grad_xmas: {_: 'map_zone_sports', l: [0.0, 232.5, 112.5, 106.5], p: [0.0, 217.0, 128.0, 137.5], tap: [55.9, 285.8, 48], nuts: [[55.5, 274.7], [2.8, 297.9], [102.0, 297.9], [2.8, 262.0], [102.0, 268.4], [42.9, 297.9]]},
    map_zone_lab_grad_xmas: {_: 'map_zone_lab', l: [200.4, 224.4, 159.6, 116.7], p: [184.9, 208.9, 175.1, 147.7], tap: [280.4, 282.8, 48], nuts: [[279.1, 271.2], [355.1, 294.4], [203.2, 292.3], [336.1, 256.4], [224.3, 258.5], [249.6, 294.4]]},
    map_zone_academic_grad_space: {_: 'map_zone_academic', l: [213.0, 228.3, 144.5, 103.0], p: [197.6, 212.8, 162.4, 133.9], tap: [285.3, 279.8, 48], nuts: [[285.5, 269.8], [218.0, 290.9], [353.0, 290.9], [334.0, 250.8], [237.0, 252.9], [260.2, 290.9]]},
    map_zone_life_grad_space: {_: 'map_zone_life', l: [222.2, 265.2, 118.1, 100.9], p: [206.7, 249.7, 149.1, 131.8], tap: [281.2, 315.6, 48], nuts: [[282.0, 306.3], [225.0, 323.2], [336.8, 325.3], [231.3, 287.3], [324.1, 295.8], [260.9, 325.3]]},
    map_zone_plaza_grad_space: {_: 'map_zone_plaza', l: [0.0, 233.6, 95.6, 84.4], p: [0.0, 218.1, 111.1, 115.3], tap: [47.5, 275.7, 48], nuts: [[47.1, 266.6], [2.8, 283.5], [2.8, 251.8], [89.3, 283.5], [80.9, 256.1], [34.5, 283.5]]},
    map_zone_sports_grad_space: {_: 'map_zone_sports', l: [0.0, 232.5, 112.5, 106.5], p: [0.0, 217.0, 128.0, 137.5], tap: [55.9, 285.8, 48], nuts: [[55.5, 274.7], [2.8, 297.9], [102.0, 297.9], [2.8, 262.0], [102.0, 268.4], [42.9, 297.9]]},
    map_zone_lab_grad_space: {_: 'map_zone_lab', l: [200.4, 224.4, 159.6, 116.7], p: [184.9, 208.9, 175.1, 147.7], tap: [280.4, 282.8, 48], nuts: [[279.1, 271.2], [355.1, 294.4], [203.2, 292.3], [336.1, 256.4], [224.3, 258.5], [249.6, 294.4]]},
    map_zone_academic_grad_retro: {_: 'map_zone_academic', l: [213.0, 228.3, 144.5, 103.0], p: [197.6, 212.8, 162.4, 133.9], tap: [285.3, 279.8, 48], nuts: [[285.5, 269.8], [218.0, 290.9], [353.0, 290.9], [334.0, 250.8], [237.0, 252.9], [260.2, 290.9]]},
    map_zone_life_grad_retro: {_: 'map_zone_life', l: [222.2, 265.2, 118.1, 100.9], p: [206.7, 249.7, 149.1, 131.8], tap: [281.2, 315.6, 48], nuts: [[282.0, 306.3], [225.0, 323.2], [336.8, 325.3], [231.3, 287.3], [324.1, 295.8], [260.9, 325.3]]},
    map_zone_plaza_grad_retro: {_: 'map_zone_plaza', l: [0.0, 233.6, 95.6, 84.4], p: [0.0, 218.1, 111.1, 115.3], tap: [47.5, 275.7, 48], nuts: [[47.1, 266.6], [2.8, 283.5], [2.8, 251.8], [89.3, 283.5], [80.9, 256.1], [34.5, 283.5]]},
    map_zone_sports_grad_retro: {_: 'map_zone_sports', l: [0.0, 232.5, 112.5, 106.5], p: [0.0, 217.0, 128.0, 137.5], tap: [55.9, 285.8, 48], nuts: [[55.5, 274.7], [2.8, 297.9], [102.0, 297.9], [2.8, 262.0], [102.0, 268.4], [42.9, 297.9]]},
    map_zone_lab_grad_retro: {_: 'map_zone_lab', l: [200.4, 224.4, 159.6, 116.7], p: [184.9, 208.9, 175.1, 147.7], tap: [280.4, 282.8, 48], nuts: [[279.1, 271.2], [355.1, 294.4], [203.2, 292.3], [336.1, 256.4], [224.3, 258.5], [249.6, 294.4]]},
    /*MAP_OAK_END*/
  };
  // 5.0.2 표 줄이기: 테마 지도의 줄은 '_'에 적힌 바탕 줄과 다른 칸만 적혀 있어요(dev/oak_pack.py의 pack_table). 여기서 바탕 값을 채워 온전한 줄로 만들어요. 줄마다 따로 복사해서 서로 값을 나누지 않아요
  for (const k in MAP_OAK) { const r = MAP_OAK[k]; if (r._) { const o = JSON.parse(JSON.stringify(MAP_OAK[r._])); for (const f in r) if (f !== '_') o[f] = r[f]; MAP_OAK[k] = o; } }
  const oakArt = {};   // 지도 열쇠 → 'ok' | 'no' | 'wait'
  const oakRaw = (kind, key) => mapBase(key) + 'maps/oak' + kind + '_' + key.replace(/^map_/, '') + '.webp?v=' + MAPS_V;
  const oakUrl = (kind, key) => webSrcMap[oakRaw(kind, key)] || oakRaw(kind, key);   // 4.3.2 테마 참나무 층도 웹에서
  function oakArtGet(key) {
    if (!MAP_OAK[key] || oakArt[key]) return;
    if (location.protocol === 'file:' && !window.FS_IMG_BASE) return;
    oakArt[key] = 'wait';
    let left = 2, bad = false;
    const fin = () => { if (--left) return; oakArt[key] = bad ? 'no' : 'ok'; if (!bad && S && mapKey(geo().map) === key) layoutOak(); };
    for (const kind of ['l', 'p']) webImg(oakRaw(kind, key), fin, () => { bad = true; fin(); });
  }
  // 지금 지도에서 지도 참나무를 쓸 수 있으면 그 표 줄, 아니면 null
  const mapOak = () => { if (!S) return null; const k = mapKey(geo().map); return MAP_OAK[k] && oakArt[k] === 'ok' ? MAP_OAK[k] : null; };
  // 참나무 가운데(안내 고리, 도토리가 날아오는 곳)
  const oakAt = () => { const M = mapOak(); return M ? [M.tap[0], M.tap[1] + 8, M.tap[2]] : [geo().oak[0], geo().oak[1], 36]; };
  function layoutOak() {
    const G = geo(), M = mapOak(), g = $('#oak'), pt = $('#oakPatch'), img = $('.oak-img'), hit = $('.oak-hit'), cv = $('#oakCanopy'); if (!g) return;
    oakArtGet(mapKey(G.map));
    g.classList.toggle('mapoak', !!M);
    let nuts;
    if (M) {
      const k = mapKey(G.map), [lx, ly, lw, lh] = M.l, [px, py, pw, ph] = M.p, [vx, vy] = M.pv;
      setA(pt, { href: oakUrl('p', k), x: px, y: py, width: pw, height: ph }); pt.style.display = '';
      g.setAttribute('transform', `translate(${vx} ${vy})`);
      setA(img, { href: oakUrl('l', k), x: lx - vx, y: ly - vy, width: lw, height: lh });
      setA(hit, { cx: M.tap[0] - vx, cy: M.tap[1] - vy, r: M.tap[2] });
      cv.style.transformOrigin = `${((vx - lx) / lw * 100).toFixed(1)}% ${((vy - ly) / lh * 100).toFixed(1)}%`;
      nuts = M.nuts.slice(0, 6).map(([x, y]) => [x - vx, y - vy]);
    } else {
      if (pt) { pt.removeAttribute('href'); pt.style.display = 'none'; }
      const [ox, oy] = G.oak;
      g.setAttribute('transform', `translate(${ox} ${oy})`);
      setA(img, { href: IMG170(oakKey()) || IMG('deco_autumn_1'), x: -34, y: -41, width: 68, height: 65 });
      setA(hit, { cx: 0, cy: -6, r: 34 });
      cv.style.transformOrigin = '';
      nuts = [[-16, -20], [12, -26], [-4, -8], [18, -10], [-20, -4], [4, -32]];
    }
    $('.oak-nuts').innerHTML = nuts.map(([x, y]) => `<image class="oak-nut" x="${(x - 5).toFixed(1)}" y="${(y - 5).toFixed(1)}" width="10" height="10" href="${IMG('ic_acorn')}"/>`).join('');
    rt.oakN = -1;
    if (S) renderOak();
  }
  function mapHiGet(key, done) {
    const st = mapHi[key];
    if (st === 'ok') { done(mapUrl(key)); return; }
    if (st) return;
    if (location.protocol === 'file:' && !window.FS_IMG_BASE) return;   // 자동 시험(test.html, file://)은 지도 파일 옆에 있지 않아요. 시험에서 볼 때는 FS_IMG_BASE를 정해요
    mapHi[key] = 'wait';
    webImg(mapRaw(key), () => { mapHi[key] = 'ok'; done(mapUrl(key)); },
      () => { mapHi[key] = 'no'; mapHiNo[key] = Date.now(); if (APP_PACK() && MAP_THEME_RE.test(key) && S && $('#map')) { setMapArt(); layoutOak(); } });   // 앱: 테마 지도를 못 받으면 기본 지도로 다시 그려요
  }
  function setMapArt() {
    // 앱: 못 받은 테마 지도는 1분이 지나면 다시 받아 봐요(인터넷이 돌아왔을 수 있어요)
    if (APP_PACK() && navigator.onLine !== false) for (const k in mapHi) if (mapHi[k] === 'no' && MAP_THEME_RE.test(k) && Date.now() - (mapHiNo[k] || 0) > 60000) { delete mapHi[k]; delete oakArt[k]; }
    GEO.forEach((G, i) => {
      const el = $('#mapImg' + i); if (!el) return;
      const key = mapKey(G.map);
      el.setAttribute('href', mapHi[key] === 'ok' ? mapUrl(key) : mapLo(key));
      el.dataset.key = key;
      // 5.0.2 끊김 줄이기: 고화질은 지금 보는 지도만 바로 받아요(예전에는 켤 때 모든 학교급 지도 12장 3.5MB). 다른 지도는 그 지도로 갈 때 받아요
      if (G !== geo()) { if (mapHi[key] === 'ok') el.setAttribute('href', mapUrl(key)); return; }
      mapHiGet(key, u => { if (el.dataset.key === key) { el.setAttribute('href', u); if (APP_PACK() && G === geo()) mapBackdrop(); } });
    });
    // 대학교부터는 구역을 오갈 때 빈 틈이 없게, 쉬는 틈에 나머지 구역 지도를 받아 둬요
    if (S && S.tier >= UNI_TIER) { clearTimeout(rt.mapIdle); rt.mapIdle = setTimeout(() => { if (!S || S.tier < UNI_TIER) return; GEO.forEach((G, i) => { const el = $('#mapImg' + i); if (!el || i < ZONE0 || G === geo()) return; const key = mapKey(G.map); mapHiGet(key, u => { if (el.dataset.key === key) el.setAttribute('href', u); }); }); }, 4000); }
    if (!rt.c3q) { rt.c3q = true;   // 5.0.2 졸업식 그림은 켜고 6초 뒤가 아니라 마지막 학년이 되면 받아요(loop의 cere3Soon)
      if (APP_PACK()) webCachePrune(u => /\/story\//.test(u) ? Object.keys(ST_PICS).some(k => u.endsWith('/' + k + '-' + ST_PICS[k] + '.webp')) : /\/maps\//.test(u) ? u.endsWith('?v=' + MAPS_V) : /\/audio\//.test(u) ? u.endsWith('?v=' + AUD_V) : true); }   // 5.0.2 주소가 바뀐 옛 파일은 기기 저장에서 지워요   // 3.3.0 새 졸업식 그림은 조금 뒤에 미리 받아 둬요
    mapBackdrop();
  }
  // 1.7.2: 지도를 아래로 끌어내리면 지도 위쪽에 빈 곳이 보여요. 하늘색 고정 배경 대신 지금 지도 그림(테마 지도 포함)을 흐리게 깔아서 어느 테마에서도 이어져 보이게 해요
  function mapBackdrop() {
    const fr = $('.frame'); if (!fr || !S) return;
    const u = mapLo(mapKey(geo().map));
    fr.style.setProperty('--map-bg', u ? `url("${u}")` : 'none');
  }
  const bpos = k => geo().b[k];
  /* 4.1.0 (woodani 제보 2026-11-11: 고등학교에서 운동장을 누르면 기숙사가 열려요)
     건물 그림은 네모 칸이라 비어 보이는 모서리가 옆 건물 위에 겹치고, 나중에 그린 건물이 누르기를 가져갔어요.
     그림마다 실제로 칠해진 곳(투명하지 않은 곳)의 네모를 한 번 재 두고, 누른 자리가 그 안에 든 건물을 골라요. 여럿이면 가운데가 가까운 쪽 */
  const BLD_OPQ = {};
  function bldOpaque(href) {
    if (!href) return null;
    const c = BLD_OPQ[href]; if (c) return c === 1 ? null : c;
    BLD_OPQ[href] = 1;
    const im = new Image();
    im.onload = () => { try {
      const N = 48, cv = document.createElement('canvas'); cv.width = cv.height = N;
      const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(im, 0, 0, N, N);
      const d = cx.getImageData(0, 0, N, N).data; let x0 = N, y0 = N, x1 = -1, y1 = -1;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (d[(y * N + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      BLD_OPQ[href] = x1 < 0 ? [0, 0, 1, 1] : [x0 / N, y0 / N, (x1 + 1) / N, (y1 + 1) / N];
    } catch (e) { BLD_OPQ[href] = [0, 0, 1, 1]; } };
    im.onerror = () => { BLD_OPQ[href] = [0, 0, 1, 1]; };
    im.src = href;
    return null;
  }
  // 지금 보이는 건물 그림의 칠해진 네모(지도 칸 기준). 아직 못 쟀으면 그림 칸에서 가장자리를 조금 뺀 네모
  function bldBox(k) {
    const g = $('#b-' + k); if (!g || getComputedStyle(g).display === 'none') return null;
    const im = $((S.f[k] || 0) >= 1 ? '.built .bimg' : '.site .bimg', g); if (!im) return null;
    const x = +im.getAttribute('x'), y = +im.getAttribute('y'), w = +im.getAttribute('width'), h = +im.getAttribute('height');
    if (!(w > 0 && h > 0)) return null;
    const o = bldOpaque(im.getAttribute('href')) || [0.1, 0.12, 0.9, 0.95];
    return [x + w * o[0], y + h * o[1], x + w * o[2], y + h * o[3]];
  }
  function bldWarm() { for (const k of Object.keys(FAC)) bldBox(k); }
  function bldPick(e, k) {
    try {
      const svg = $('#map'), m = svg && svg.getScreenCTM && svg.getScreenCTM(); if (!m || !e || e.clientX == null || (!e.clientX && !e.clientY)) return k;
      const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(m.inverse());
      let best = null, bd = Infinity;
      for (const kk of Object.keys(FAC)) {
        const b = bldBox(kk); if (!b || q.x < b[0] || q.x > b[2] || q.y < b[1] || q.y > b[3]) continue;
        const d = Math.hypot((q.x - (b[0] + b[2]) / 2) / (b[2] - b[0]), (q.y - (b[1] + b[3]) / 2) / (b[3] - b[1]));
        if (d < bd) { bd = d; best = kk; }
      }
      return best || k;
    } catch (err) { return k; }
  }
  const setA = (el, o) => { for (const [k, v] of Object.entries(o)) el.setAttribute(k, typeof v === 'number' ? +v.toFixed(1) : v); };
  function layoutMap() {
    const G = geo(), key = geoIdx();
    mapBackdrop();
    if (rt.mapLaid === key) return;
    rt.mapLaid = key;
    setMapArt();
    for (const k of Object.keys(FAC)) {
      const g = $('#b-' + k); if (!g || !G.b[k]) continue;
      const [cx, cy, w] = G.b[k];
      setBldArt(k);
      const sk = seasonKey(SITE_IMG[k]), [sx, sy, sw, stf] = lotRect(G.lot[k], sk, G.zone ? ZONE_SITE_ISL : undefined);
      setA($('.site .bimg', g), { x: sx - sw / 2, y: sy - sw / 2, width: sw, height: sw, href: IMG170(sk), transform: stf });
      const box = { x: cx - w * 0.42, y: cy - w * 0.4, width: w * 0.84, height: w * 0.74 };
      setA($('.hit', g), box); setA($('.focus-ring', g), box);
      $('#pq-' + k).setAttribute('transform', `translate(${cx.toFixed(1)} ${(cy + w * 0.36).toFixed(1)})`);
      { const ic = $('.pq-ic', $('#pq-' + k)); if (ic) ic.setAttribute('href', IMG('ic_' + k)); }   // 3.3.0 이름표 그림은 뺐어요
    }
    setTimeout(bldWarm, 1500);   // 4.1.0 건물 그림의 칠해진 네모를 미리 재 둬요
    const nx = $('#b-next');
    for (const k of Object.keys(FAC)) { const g = $('#b-' + k), pq = $('#pq-' + k); if (g) g.classList.toggle('no-lot', !G.b[k]); if (pq) pq.classList.toggle('no-lot', !G.b[k]); }   // 4.0.0 이 지도(구역)에 없는 건물은 숨겨요(테마가 style을 지워서 class로)
    nx.classList.toggle('no-lot', !G.next);
    { const ok = $('#oak'); if (ok) ok.classList.toggle('no-lot', !!G.campus); }
    if (G.next) {
    const [ncx, ncy, nw, ntf] = G.next.at;
    setA($('.bimg', nx), { x: ncx - nw / 2, y: ncy - nw / 2, width: nw, height: nw, href: IMG170(seasonKey(G.next.img)), transform: ntf });
    setA($('.hit', nx), { x: ncx - nw * 0.42, y: ncy - nw * 0.4, width: nw * 0.84, height: nw * 0.74 });
    $('.next-tag', nx).setAttribute('transform', `translate(${ncx.toFixed(1)} ${(ncy + nw * (G.nextTagY !== undefined ? G.nextTagY : 0.36)).toFixed(1)})`);   // 2.0.0 중학교는 간판 자리와 겹치지 않게 위로
    $('#pl-next').textContent = G.next.name; $('#pl-next2').textContent = G.next.tag;   // 2.3.0 이름표 두 줄
    nx.setAttribute('aria-label', `${G.next.name}, ${G.next.tag}`);
    }
    layoutOak();   // 3.3.4 지도 참나무(없으면 예전 참나무 그림)
    [SPORTS.cx, SPORTS.cy, SPORTS.rx, SPORTS.ry] = G.sports;
    rt.guideKey = undefined;
    applyThemes();
  }
  // 나무와 동네 건물을 밑바닥 y 순서로 그려서 뒤에 있는 것이 먼저 깔리게 해요
  function buildForest() {
    // 5.0.2 끊김 줄이기: #forest는 1.7.0부터 지도 그림에 가려 안 보여요(display:none). 요소 468개를 만들지 않아요. 동네 단계 셈(renderTown)은 그대로 돌아요
    rt.townStage = -1;
  }
  // 동네 단계에 맞춰 나무를 치우고 건물을 세워요. anim이면 새로 생긴 건물이 쑥 솟아올라요
  function renderTown(anim) {
    const st = S.grade, sci = S.tier >= 1;
    if (st === rt.townStage && S.tier === rt.townTier) return;
    const prev = S.tier === rt.townTier ? rt.townStage : -1;
    rt.townStage = st; rt.townTier = S.tier;
    $$('#forest [data-gone], #forest [data-sci]').forEach(el => {
      if (el.dataset.stage) return;
      el.style.display = (st >= +(el.dataset.gone || 99) || (sci && el.dataset.sci)) ? 'none' : '';
    });
    $$('#forest [data-stage]').forEach(el => {
      const at = +el.dataset.stage, show = st >= at && !(sci && el.dataset.sci);
      el.style.display = show ? '' : 'none';
      const tw = el.firstElementChild;
      tw.classList.remove('tw-new');
      if (show && anim && prev >= 0 && at > prev && !rt.reduced) { void tw.getBBox(); tw.classList.add('tw-new'); }
    });
  }
  function buildTeachersOnMap() {
    // 고슴도치 교감 선생님은 늘 교실 문 왼쪽에 서 있어요
    layerTeachers.innerHTML = `<g id="m-hedgehog"><g class="tinner">${AV.hedgehog}</g></g>` +
      Object.keys(TEA).map(k => `<g id="m-${k}"><g class="tinner">${AV[k]}</g></g>`).join('');
  }
  // 4.4.0 woodani 요청(행사 때 선생님이 학생과 겹쳐요): 학교 행사가 열린 동안 학생들이 둘러서는 광장 둘레(가로 56, 세로 24 고리와 무대 줄)에
  // 선생님 자리가 들어 있으면, 그 둘레 바깥으로 비켜 서게 해요(모든 학교급, 지도 자리 표는 그대로). 행사가 끝나면 제자리로
  function teaOff(p) {
    if (!p || !geo().plaza || !rt.fest) return p;   // 행사가 열린 동안만(평소 자리는 이름표와 겹치지 않게 골라 둔 그대로)
    const [cx, cy0] = geo().plaza, cy = cy0 + 10, rx = 76, ry = 44, dx = p[0] - cx, dy = p[1] - cy, d = Math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2);
    if (d >= 1) return p;
    const a = d < 0.05 ? Math.PI : Math.atan2(dy / ry, dx / rx);
    return [cx + Math.cos(a) * rx * 1.04, cy + Math.sin(a) * ry * 1.04, p[2]];
  }
  // 4.4.1 현황판 새 그림(작업지시서 79)을 CSS 변수로. 하나라도 없으면 붙이지 않아요(예전 모습 그대로)
  function hudArtInit() {
    const K = { '--hud-frame': 'hud_board_frame', '--hud-card-l': 'hud_card_light', '--hud-card-d': 'hud_card_dark', '--hud-pill-l': 'hud_pill_light', '--hud-pill-d': 'hud_pill_dark',
      '--hud-track-l': 'hud_bar_track_light', '--hud-track-d': 'hud_bar_track_dark', '--hud-fill': 'hud_bar_fill', '--hud-btn-l': 'hud_btn_light', '--hud-btn-d': 'hud_btn_dark', '--hud-btn-p': 'hud_btn_press',
      '--hud-fold-l': 'hud_fold_light', '--hud-fold-d': 'hud_fold_dark', '--hud-div': 'hud_res_divider' };
    if (document.documentElement.classList.contains('hud-art') || !Object.values(K).every(k => IMG(k))) return;
    const R = document.documentElement; for (const [v, k] of Object.entries(K)) R.style.setProperty(v, `url("${IMG(k)}")`);
    R.classList.add('hud-art');
    hudTheme();
    [['#repPill', 'hud_ic_star'], ['#kidsPill', 'hud_ic_kids']].forEach(([q, k]) => { const el = $(q), sv = el && el.querySelector('svg'), u = IMG(k); if (sv && u) { const im = document.createElement('img'); im.src = u; im.alt = ''; sv.replaceWith(im); } });
  }
  // 4.4.1 woodani 요청: 현황판 나무 금빛 틀을 배경 테마 색으로(작업지시서 80). 테마마다 같은 모양에 색만 바꾼 11장, 없으면 기본 그림.
  // 그림이 아닌 곳(아래 탭과 탐험 화면의 고른 칸, 테두리)은 Codex 색표로 맞춰요: [고른 칸 위, 고른 칸 아래, 테두리]
  const HUD_TH_KEYS = { '--hud-frame': 'hud_board_frame', '--hud-card-l': 'hud_card_light', '--hud-card-d': 'hud_card_dark', '--hud-pill-l': 'hud_pill_light', '--hud-pill-d': 'hud_pill_dark',
    '--hud-fill': 'hud_bar_fill', '--hud-btn-l': 'hud_btn_light', '--hud-btn-d': 'hud_btn_dark', '--hud-btn-p': 'hud_btn_press', '--hud-fold-l': 'hud_fold_light', '--hud-fold-d': 'hud_fold_dark' };
  const HUD_TH_COL = { spring: ['#F7D4DE', '#E5A1B9', '#B56C86'], summer: ['#E0F2F4', '#8CC5D8', '#6A9FB2'], autumn: ['#F7C88D', '#D78A49', '#95592F'], winter: ['#EBF4FC', '#B5D1E4', '#7F9CAF'],
    xmas: ['#F1DAB7', '#C98A5B', '#8B4C44'], space: ['#E1D9FF', '#9A8BCE', '#6961A2'], retro: ['#F5D899', '#D98B43', '#9B5F36'] };
  // 4.4.1 woodani 요청: 공지창, 보상 창처럼 가운데 뜨는 창, 아래에서 올라오는 창, 탭 화면(선생님, 퀘스트 등)과 금빛 단추(업그레이드 등)도 배경 테마 색으로(그림 없이 색만).
  // 4.4.1.1 woodani 요청(전수조사): 봄, 여름, 겨울, 우주 단추가 파스텔이라 바탕과 꺼진 단추에 묻혀서 단추 색만 더 진하고 쨍하게(바탕 대비 2배쯤, 글자 대비 5 넘게)
  // [종이, 카드, 테두리, 테두리 그림자, 단추, 단추 글자, 단추 그림자]. 어두운 화면은 바탕은 그대로 두고 테두리와 단추만 테마 색
  const MODAL_TH = { spring: ['#FFF6F8', '#FBE6EC', '#EBC3D0', '#D7A3B5', '#E8789F', '#3E0F22', '#B24A72'], summer: ['#F4FBFC', '#E2F2F5', '#BFDDE6', '#9CC5D3', '#45B3DC', '#0B2A36', '#2A86A8'],
    autumn: ['#FFF6EA', '#F8E6CC', '#E8C79C', '#D3A874', '#E3893F', '#3A1E06', '#95592F'], winter: ['#F6FAFE', '#E6EFF6', '#C8D9E6', '#A9C0D1', '#6FAEDB', '#0F2638', '#3F7FAD'],
    xmas: ['#FFF8EE', '#F5E6D0', '#E0C3A0', '#C9A27A', '#E06A5A', '#3A0E0A', '#8B4C44'], space: ['#F7F5FF', '#E9E5FA', '#CEC6EE', '#ACA2D8', '#8E7BE0', '#140C33', '#5E4CB0'],
    retro: ['#FFF7E6', '#F8E7C2', '#E8CB8E', '#D2AC66', '#F2A93A', '#3A2205', '#A9662A'] };
  function modalThemeCss() {
    if (document.getElementById('thModalCss')) return;
    const W = ':is(.modal,.sheet,.panel)', D = (id, c) => `--line:color-mix(in srgb, ${c[6]} 70%, var(--paper-d));--line-shadow:color-mix(in srgb, ${c[6]} 45%, #000);--chip-bg:color-mix(in srgb, ${c[6]} 35%, var(--paper-d));--accent:${c[4]};--accent-ink:${c[5]};--accent-shadow:${c[6]}`;
    // 4.4.1 woodani 요청: 테마에서는 꺼진 단추(돈 모자람 등)를 테마 색이 없는 회색으로. 켜진 단추(테마 색)와 바로 구분돼요(여름, 겨울은 둘 다 하늘색이라 헷갈렸어요)
    const OFF_L = '--off-bg:#DEDEDA;--off-ink:#85857F;--off-shadow:#BEBEB8', OFF_D = '--off-bg:#3B3D3F;--off-ink:#8E9194;--off-shadow:#2A2C2E';
    let css = `:root[data-th-ui]:not([data-th-ui=""]){${OFF_L}}\n:root[data-th-ui]:not([data-th-ui=""])[data-theme="dark"]{${OFF_D}}\n@media (prefers-color-scheme: dark){:root[data-th-ui]:not([data-th-ui=""]):not([data-theme="light"]){${OFF_D}}}\n`;
    { const T = ':root[data-th-ui]:not([data-th-ui=""])', B = `${T} .tabs .tab.tab-tam,${T} .app.on-school .tabs > .tab.tab-tam`;   // 5.0.0 woodani 요청: 아래 탭 탐험 단추도 테마 색
      css += `${B}{background:radial-gradient(circle at 50% 28%,#FFFFFF,var(--accent) 62%,var(--accent-shadow));color:var(--accent-ink);box-shadow:inset 0 2px 0 rgba(255,255,255,.9),inset 0 -4px 0 rgba(0,0,0,.18),0 0 0 2px var(--accent-shadow),0 3px 0 var(--accent-shadow)}\n`;
      css += `${T} .tabs .tab.tab-tam[aria-selected="true"],${T} .app.on-school .tabs > .tab.tab-tam[aria-selected="true"]{box-shadow:inset 0 2px 0 rgba(255,255,255,.9),inset 0 -4px 0 rgba(0,0,0,.18),0 0 0 3px var(--accent-shadow),0 4px 0 var(--accent-shadow),0 0 16px var(--accent)}\n`; }
    css += `:root[data-th-ui]:not([data-th-ui=""]) .sheet-elect:not(.todo) em{background:var(--accent);color:var(--accent-ink);box-shadow:0 2px 0 var(--accent-shadow)}\n`;   // 건물 창의 쓰다듬기, 가기 같은 작은 단추도 테마 단추 색(바탕색과 같아 묻혔어요)
    css += `:root[data-th-ui]:not([data-th-ui=""]) :is(.sb .buy.off,.ad-pk:disabled,.ac-bk.poor,.ac-bk.off,.pzb.poor,#bkBuy[aria-disabled="true"]){filter:grayscale(1)}\n`;   // 흐리게만 하던 꺼진 단추도 회색으로
    for (const [id, c] of Object.entries(MODAL_TH)) {
      css += `:root[data-th-ui="${id}"]{--accent:${c[4]};--accent-ink:${c[5]};--accent-shadow:${c[6]}}\n`;   // 업그레이드 단추처럼 금빛 단추(--accent)는 화면 어디서나 테마 색
      { const A = `{--accent:${c[4]};--accent-ink:${c[5]};--accent-shadow:${c[6]}}`; css += `:root[data-th-ui="${id}"][data-theme="dark"]${A}\n@media (prefers-color-scheme: dark){:root[data-th-ui="${id}"]:not([data-theme="light"])${A}}\n`; }   // 5.0.0 어두운 화면에서는 기본 금빛이 이겨서 홈의 받기 단추가 테마 색이 아니었어요
      css += `:root[data-th-ui="${id}"] ${W}{--paper:${c[0]};--card:${c[1]};--line:${c[2]};--line-shadow:${c[3]};--accent:${c[4]};--accent-ink:${c[5]};--accent-shadow:${c[6]};--chip-bg:${c[1]}}\n`;
      css += `:root[data-th-ui="${id}"][data-theme="dark"] ${W}{--paper:var(--paper-d);--card:var(--card-d);${D(id, c)}}\n`;
      css += `@media (prefers-color-scheme: dark){:root[data-th-ui="${id}"]:not([data-theme="light"]) ${W}{--paper:var(--paper-d);--card:var(--card-d);${D(id, c)}}}\n`;
    }
    const st = document.createElement('style'); st.id = 'thModalCss'; st.textContent = css; document.head.appendChild(st);
  }
  function hudTheme() {
    { const bg = S && THEME[thOn().bg]; modalThemeCss(); document.documentElement.dataset.thUi = bg && MODAL_TH[bg.id] ? bg.id : ''; }   // 4.4.1 창 색은 현황판 그림이 없어도 바꿔요
    const R = document.documentElement; if (!R.classList.contains('hud-art')) return;
    const bgT = S && THEME[thOn().bg], id = bgT && Object.values(HUD_TH_KEYS).every(k => IMG(`${k}_${bgT.id}`)) ? bgT.id : '';
    if (rt.hudTh === id) return;
    rt.hudTh = id;
    for (const [v, k] of Object.entries(HUD_TH_KEYS)) R.style.setProperty(v, `url("${IMG(id ? `${k}_${id}` : k)}")`);
    const C = HUD_TH_COL[id];
    ['--hud-sel-a', '--hud-sel-b', '--hud-edge'].forEach((v, i) => { if (C) R.style.setProperty(v, C[i]); else R.style.removeProperty(v); });
    R.dataset.hudTh = id;
  }
  function renderTeachersOnMap() {
    for (const k of Object.keys(TEA)) {
      const g = $('#m-' + k);
      const T = geo().tea || {};   // 4.0.0 구역 지도에는 그 구역 선생님만 있어요(자리가 없으면 숨겨요)
      const p = teaOff(k === 'owl' && !(S.f.library > 0) ? T.owlAway : T[k]);
      g.style.display = p && S.t[k] > 0 ? '' : 'none';
      if (p) g.setAttribute('transform', `translate(${p[0]} ${p[1]}) scale(${p[2]})`);
    }
    const hh = teaOff((geo().tea || {}).hedgehog), mh = $('#m-hedgehog');
    if (mh) { mh.style.display = hh ? '' : 'none'; if (hh) mh.setAttribute('transform', `translate(${hh[0]} ${hh[1]}) scale(${hh[2]})`); }
  }

