  /* ---------- 2.2.0 숲속 생물 탐사 (프로젝트 문서 '2.2.0 설계안' 4절, woodani 확정 2026-10-30) ----------
     초등학교부터 홈 지도의 정해진 자리(지도마다 6곳, 풀숲과 물가)에 게임 시계 2시간마다 생물이 하나씩 숨어요(최대 3마리 기다림).
     누르면 돋보기로 관찰하고 생물 카드가 생물 도감(동물 도감의 '생물' 칸)에 모여요. 계절, 밤(20~24시), 비, 물가에 따라 나오는 생물이 달라요.
     처음 관찰 과학 XP 10과 숲의 정수 1, 다시 보면 과학 XP 3과 수업료 3분치. 희귀 4%(과학실 Lv.5마다 +1%, 최대 8%).
     10종 황금 도토리 1, 20종 숲의 정수 20, 30종 지도 장식 '관찰 오두막'(업적 '생물 탐사' 칭호 꼬마 생물학자)
     2.3.5: 90종으로. 60종 황금 도토리 3과 곤충 호텔, 90종 숲의 정수 50과 생태 연못, 칭호 숲속 박사 */
  const BX = { tier: 1, every: 2 * 3600000, max: 3, rare0: 4, rareMax: 8, xpNew: 10, xpDup: 3, essNew: 1, dupMin: 3, gold10: 1, ess20: 20, gold60: 3, ess90: 50 };
  // 지도(geoIdx)마다 [가로 %, 세로 %, 물가면 1]. 장식 자리, 건물 빈터(울타리 안), 길을 피했어요
  // 2.3.0.1 woodani 제보(학교 행사 단추가 청설모를 가림): 왼쪽 단추 줄, 오른쪽 단추 줄, 아래 칩, 화면 밖(가장자리 11%)에 걸리던 자리를 안쪽 풀숲과 물가로 옮겼어요
  // 3.0.0 woodani 제보(중학교 과학실 뒤 생물을 누르기 힘듦): 건물 누르는 칸과 이름표에 가리던 자리를 손가락이 다 닿는 풀밭과 호수로 옮겼어요(390px, 360px에서 잼)
  const BX_SPOT = [null,   // 3.3.0 새 단장: 빈 풀밭과 길가에서 서로 멀리 6곳(첫째는 물가)
    [[10, 78, 1], [79, 18, 0], [85, 64, 0], [46, 76, 0], [49, 18, 0], [28, 76, 0]],
    [[79, 20, 1], [10, 82, 0], [62, 46, 0], [49, 64, 0], [49, 80, 0], [28, 24, 0]],
    [[80, 19.5, 1], [24, 81, 0], [52, 49.5, 0], [10, 62, 0], [56, 72, 0], [48, 27, 0]]];   // 3.3.0 건물을 빈터에 꽉 맞춘 뒤 다시 골랐어요(가장자리 단추와 건물 누르는 칸에 안 가리게, 390px와 360px 모두)   // 3.0.0 고등학교   // 4.4.1 현황판이 낮아져 왼쪽 단추가 올라와서 [10, 62]로 옮김(예전 [10, 54])
  // 4.0.0 구역 지도마다 6곳(구역 그림의 빈 풀밭, 첫째는 물가. 광장 구역에는 물가가 없어요). 캠퍼스 지도에는 없어요
  BX_SPOT.push([[94, 46, 1], [65, 28, 0], [61, 74, 0], [86, 62, 0], [80, 85, 0], [56, 62, 0]],   // 5.0.1.2 넷째 자리: 아래 구역 단추에 가려서 옮김
    [[80, 30, 1], [20, 52, 0], [66, 40, 0], [86, 50, 0], [64, 66, 0], [13, 62, 0]],   // 5.0.1.2 넷째, 다섯째 자리: 아래 구역 단추에 가려서 옮김
    [[19, 28, 0], [78, 27, 0], [17, 47, 0], [87, 49, 0], [22, 74, 0], [80, 77, 0]],
    [[94, 40, 1], [84, 55, 0], [56, 58, 0], [80, 69, 0], [56, 70, 0], [15, 79, 0]]);   // 5.0.1.2 체육 구역 둘째 자리(왼쪽 메뉴 수학여행 단추에 가림)와 다섯째 자리(아래 구역 단추에 가림)를 옮김
  const SPR = [3, 4, 5], SUM = [6, 7, 8], AUT = [9, 10, 11], WIN = [12, 1, 2];
  // [열쇠, 이름, 무리(0 곤충, 1 식물, 2 새와 작은 동물), 조건, 설명]. 조건: s 달, n 밤, r 비, w 물가, rare 희귀, en 멸종위기
  const BIO = [
    ['ladybug', '무당벌레', 0, {}, '빨간 등에 까만 점. 진딧물을 잡아먹어서 텃밭의 친구예요.'],
    ['swallowtail', '호랑나비', 0, { s: [...SPR, ...SUM] }, '호랑이 무늬 날개를 가진 큰 나비예요. 꽃꿀을 빨아 먹어요.'],
    ['dragonfly', '고추잠자리', 0, { s: [...SUM, ...AUT] }, '늦여름부터 가을에 빨갛게 익는 잠자리예요.'],
    ['rhinobeetle', '장수풍뎅이', 0, { s: SUM }, '수컷 머리에 긴 뿔이 있어요. 참나무 수액을 좋아해요.'],
    ['stagbeetle', '사슴벌레', 0, { s: SUM }, '사슴뿔 같은 큰 턱을 가졌어요. 밤에 나무 수액을 먹으러 와요.'],
    ['cicada', '매미', 0, { s: SUM }, '땅속에서 몇 년을 지내고 나와 여름 내내 노래해요.'],
    ['firefly', '반딧불이', 0, { n: 1, s: [5, 6, 7, 8, 9], rare: 1 }, '꽁무니에서 빛을 내는 곤충이에요. 물이 맑고 깨끗한 곳에서만 살아요.'],
    ['waterstrider', '소금쟁이', 0, { w: 1 }, '긴 다리로 물 위를 미끄러지듯 걸어요. 물에 빠지지 않아요.'],
    ['snail', '달팽이', 0, { r: 1 }, '비 오는 날 촉촉한 잎 위로 나와요. 눈은 긴 더듬이 끝에 있어요.'],
    ['honeybee', '꿀벌', 0, { s: [...SPR, ...SUM, 9] }, '꽃가루를 옮겨 열매가 맺히게 도와줘요.'],
    ['dandelion', '민들레', 1, { s: SPR }, '노란 꽃이 지면 하얀 솜털 씨앗이 바람을 타고 멀리 날아가요.'],
    ['azalea', '진달래', 1, { s: [3, 4] }, '이른 봄 잎보다 꽃이 먼저 피는 분홍 꽃이에요.'],
    ['foxtail', '강아지풀', 1, { s: [...SUM, ...AUT] }, '강아지 꼬리처럼 복슬복슬한 이삭이 달려요.'],
    ['fern', '고사리', 1, {}, '꽃 없이 잎 뒤의 포자로 퍼져요. 어린잎은 돌돌 말려 있어요.'],
    ['lotus', '연꽃', 1, { w: 1, s: SUM }, '진흙 속에서 자라도 깨끗하고 큰 꽃을 피워요.'],
    ['maple', '단풍잎', 1, { s: AUT }, '가을이 되면 잎의 초록 색소가 줄어 빨갛게 물들어요.'],
    ['ginkgo', '은행잎', 1, { s: AUT }, '부채 모양 잎이 가을에 노랗게 물들어요. 아주 오래전부터 살아온 나무예요.'],
    ['pine', '소나무', 1, {}, '사계절 내내 푸른 바늘잎 나무예요. 솔방울에 씨앗이 들어 있어요.'],
    ['hericium', '노루궁뎅이버섯', 1, { s: AUT }, '노루 엉덩이 털처럼 하얗고 복슬복슬한 버섯이에요. 버섯은 식물이 아니라 균류예요.'],
    ['miseon', '미선나무', 1, { s: [3, 4], rare: 1 }, '세계에서 우리나라에만 자라는 특산 식물이에요. 하얀 꽃이 피어요.'],
    ['greattit', '박새', 2, {}, '검은 넥타이 무늬가 있는 작은 새예요. 벌레를 많이 잡아 줘요.'],
    ['woodpecker', '오색딱따구리', 2, {}, '부리로 나무를 콕콕 두드려 속의 벌레를 찾아요.'],
    ['kingfisher', '물총새', 2, { w: 1 }, '물속으로 총알처럼 뛰어들어 물고기를 잡아요.'],
    ['mandarin', '원앙', 2, { w: 1 }, '수컷의 깃털이 알록달록 화려한 오리예요. 천연기념물이에요.'],
    ['squirrel_red', '청설모', 2, {}, '귀 끝에 긴 털이 있는 회갈색 다람쥐 무리예요. 잣과 솔방울을 좋아해요.'],
    ['salamander', '도롱뇽', 2, { r: 1 }, '깨끗한 계곡 근처에 사는 양서류예요. 비 오는 날 밖으로 나와요.'],
    ['flyingsquirrel', '하늘다람쥐', 2, { n: 1, rare: 1, en: 'Ⅱ급' }, '앞다리와 뒷다리 사이 막을 펴고 나무 사이를 날아요. 천연기념물이에요.'],
    ['otter', '수달', 2, { w: 1, rare: 1, en: 'Ⅰ급' }, '헤엄을 아주 잘 치는 물가의 동물이에요. 천연기념물이에요.'],
    ['redbat', '붉은박쥐', 2, { n: 1, rare: 1, en: 'Ⅰ급' }, '주황빛 털 때문에 황금박쥐라고도 불러요. 천연기념물이에요.'],
    ['pitta', '팔색조', 2, { s: [5, 6, 7, 8], rare: 1, en: 'Ⅱ급' }, '여덟 가지 빛깔 깃털을 가진 여름 철새예요. 천연기념물이에요.'],
    // 2.3.5 생물 60종 더하기(작업지시서 48, woodani 결정 2026-11-03). WIN 겨울 12~2월
    ['cabbagewhite', '배추흰나비', 0, { s: [...SPR, ...SUM] }, '하얀 날개에 까만 점이 있는 나비예요. 애벌레는 배추와 양배추 잎을 먹고 자라요.'],
    ['sulphur', '노랑나비', 0, { s: SPR }, '봄 들판을 노랗게 나는 나비예요. 토끼풀 같은 콩과 식물에 알을 낳아요.'],
    ['mantis', '사마귀', 0, { s: AUT }, '낫처럼 생긴 앞다리로 벌레를 잡아요. 고개를 돌려 뒤도 볼 수 있어요.'],
    ['grasshopper', '메뚜기', 0, { s: [...SUM, ...AUT] }, '튼튼한 뒷다리로 멀리 뛰어요. 벼와 풀잎을 갉아 먹어요.'],
    ['longheaded', '방아깨비', 0, { s: [...SUM, ...AUT] }, '머리가 길쭉한 큰 메뚜기 무리예요. 뒷다리를 잡으면 방아를 찧듯 몸을 끄덕여요.'],
    ['cricket', '귀뚜라미', 0, { s: AUT, n: 1 }, '가을밤에 날개를 비벼 귀뚤귀뚤 노래해요. 소리를 듣는 귀가 앞다리에 있어요.'],
    ['katydid', '여치', 0, { s: SUM }, '긴 더듬이를 가진 초록 곤충이에요. 여름 풀밭에서 날개를 비벼 울어요.'],
    ['longhorn', '하늘소', 0, { s: SUM }, '몸보다 긴 더듬이를 가진 딱정벌레예요. 애벌레는 나무 속을 파먹으며 자라요.'],
    ['jewelbeetle', '비단벌레', 0, { s: SUM, rare: 1 }, '초록빛 금속처럼 반짝이는 딱정벌레예요. 옛날에는 날개로 장신구를 꾸몄대요.'],
    ['divingbeetle', '물방개', 0, { w: 1 }, '노처럼 생긴 뒷다리로 물속을 헤엄쳐요. 날개 밑에 공기 방울을 담아 숨을 쉬어요.'],
    ['damselfly', '실잠자리', 0, { w: 1, s: [...SPR, ...SUM] }, '실처럼 가는 몸을 가진 작은 잠자리예요. 앉을 때 날개를 접어요.'],
    ['emperor', '왕잠자리', 0, { w: 1, s: SUM }, '몸이 크고 빠르게 나는 잠자리예요. 연못 위를 오가며 영역을 지켜요.'],
    ['ant', '개미', 0, {}, '여왕개미를 중심으로 모여 사는 곤충이에요. 냄새로 길을 알려 주며 함께 먹이를 날라요.'],
    ['hoverfly', '꽃등에', 0, { s: [...SPR, ...SUM] }, '벌처럼 줄무늬가 있지만 침이 없는 파리 무리예요. 공중에 멈춘 듯 떠 있을 수 있어요.'],
    ['dungbeetle', '소똥구리', 0, { rare: 1, en: 'Ⅱ급' }, '소똥을 동그랗게 빚어 물구나무서듯 굴려요. 그 경단에 알을 낳아요.'],
    ['apollo', '붉은점모시나비', 0, { s: SPR, rare: 1, en: 'Ⅰ급' }, '얇고 하얀 날개에 붉은 점이 있는 나비예요. 늦봄에 잠깐만 날아요.'],
    ['bumblebee', '호박벌', 0, { s: [...SPR, ...SUM] }, '통통하고 털이 복슬복슬한 큰 벌이에요. 몸을 떨어 꽃가루를 털어 내요.'],
    ['pillbug', '공벌레', 0, { r: 1 }, '건드리면 몸을 공처럼 동그랗게 말아요. 곤충이 아니라 새우와 가까운 동물이에요.'],
    ['mayfly', '하루살이', 0, { w: 1, s: SPR }, '물속에서 애벌레로 오래 지내다 어른이 되면 며칠만 살아요. 어른은 입이 없어 먹지 않아요.'],
    ['wintermoth', '겨울자나방', 0, { s: WIN, n: 1 }, '추운 겨울밤에 나오는 나방이에요. 암컷은 날개가 거의 없어 나무를 기어올라요.'],
    ['cherry', '벚꽃', 1, { s: [4] }, '4월에 분홍빛 꽃이 한꺼번에 피었다가 바람에 꽃잎이 흩날려요.'],
    ['forsythia', '개나리', 1, { s: [3, 4] }, '이른 봄 잎보다 먼저 노란 꽃이 가지 가득 피어요.'],
    ['magnolia', '목련', 1, { s: [3, 4] }, '커다란 하얀 꽃이 피는 나무예요. 꽃눈이 털옷을 입고 겨울을 나요.'],
    ['violet', '제비꽃', 1, { s: SPR }, '제비가 돌아올 즈음 피는 작은 보라 꽃이에요. 씨앗을 개미가 옮겨 줘요.'],
    ['clover', '토끼풀', 1, { s: [...SPR, ...SUM] }, '잎이 세 장인 풀이에요. 하얀 꽃으로 꽃반지를 만들어요. 네 잎은 아주 드물어요.'],
    ['sunflower', '해바라기', 1, { s: SUM }, '키가 크고 큰 노란 꽃이 피어요. 꽃 가운데에 씨앗이 빽빽하게 열려요.'],
    ['morningglory', '나팔꽃', 1, { s: SUM }, '아침에 나팔 모양 꽃이 피었다가 낮에 오므려요. 덩굴이 감고 올라가요.'],
    ['hydrangea', '수국', 1, { s: [6, 7] }, '작은 꽃이 공처럼 모여 피어요. 흙에 따라 꽃 색이 파랑이나 분홍으로 달라져요.'],
    ['cosmos', '코스모스', 1, { s: AUT }, '가을 길가에 하늘하늘 피는 꽃이에요. 분홍, 하양, 자주 꽃이 있어요.'],
    ['silvergrass', '억새', 1, { s: AUT }, '가을 산과 들에 은빛 이삭이 바람에 물결쳐요. 씨앗은 솜털을 달고 날아가요.'],
    ['oak', '상수리나무와 도토리', 1, { s: AUT }, '가을에 동그란 도토리가 열리는 참나무예요. 다람쥐와 어치가 도토리를 숨겨 숲을 넓혀요.'],
    ['chestnut', '밤송이', 1, { s: AUT }, '가시투성이 밤송이가 가을에 벌어지면 밤톨이 나와요.'],
    ['camellia', '동백꽃', 1, { s: [12, 1, 2, 3] }, '추운 겨울에 빨간 꽃이 피어요. 동박새가 꿀을 먹으며 꽃가루를 옮겨요.'],
    ['adonis', '복수초', 1, { s: [1, 2, 3] }, '눈을 녹이며 피어나는 노란 꽃이에요. 봄이 오는 것을 가장 먼저 알려 줘요.'],
    ['moss', '이끼', 1, { r: 1 }, '뿌리와 꽃이 없는 작은 식물이에요. 물을 머금어 비 온 뒤 더 파릇해요.'],
    ['reed', '갈대', 1, { w: 1, s: AUT }, '물가에서 자라는 키 큰 풀이에요. 억새와 닮았지만 물가에 살고 이삭이 갈색이에요.'],
    ['waterlily', '수련', 1, { w: 1, s: SUM }, '물 위에 둥근 잎을 띄우고 꽃을 피워요. 낮에 피고 저녁에 오므려요.'],
    ['cattail', '부들', 1, { w: 1, s: [...SUM, ...AUT] }, '물가에 소시지처럼 생긴 갈색 이삭이 달려요. 다 익으면 솜털 씨앗이 날려요.'],
    ['ladyslipper', '광릉요강꽃', 1, { s: SPR, rare: 1, en: 'Ⅰ급' }, '주머니처럼 부푼 꽃이 피는 난초예요. 우리나라 숲 몇 곳에서만 자라요.'],
    ['euryale', '가시연꽃', 1, { w: 1, s: SUM, rare: 1, en: 'Ⅱ급' }, '잎과 줄기에 가시가 돋은 큰 연꽃이에요. 잎이 아주 크고 보라 꽃이 피어요.'],
    ['sparrow', '참새', 2, {}, '사람 사는 곳 가까이에 사는 작은 새예요. 무리 지어 짹짹 지저귀어요.'],
    ['bulbul', '직박구리', 2, {}, '삐이익 하고 시끄럽게 우는 회색 새예요. 열매와 꽃꿀을 좋아해요.'],
    ['whiteeye', '동박새', 2, { s: [...WIN, ...SPR] }, '눈 둘레가 하얀 연두색 작은 새예요. 동백꽃 꿀을 먹으며 꽃가루를 옮겨요.'],
    ['wren', '굴뚝새', 2, { s: WIN }, '꼬리를 쫑긋 세운 아주 작은 갈색 새예요. 겨울에도 맑게 노래해요.'],
    ['mallard', '청둥오리', 2, { w: 1, s: WIN }, '수컷 머리가 초록빛으로 반짝이는 오리예요. 겨울에 우리나라를 찾아와요.'],
    ['heron', '왜가리', 2, { w: 1 }, '긴 다리로 물가에 가만히 서 있다가 물고기를 콕 잡아요.'],
    ['swan', '큰고니', 2, { w: 1, s: WIN, rare: 1, en: 'Ⅱ급' }, '온몸이 하얀 큰 새예요. 먼 북쪽에서 겨울을 나러 날아와요. 천연기념물이에요.'],
    ['crane', '두루미', 2, { s: WIN, rare: 1, en: 'Ⅰ급' }, '머리 꼭대기가 붉은 하얀 새예요. 겨울에 찾아와 짝과 함께 춤을 춰요. 천연기념물이에요.'],
    ['eagleowl', '수리부엉이', 2, { n: 1, rare: 1, en: 'Ⅱ급' }, '머리에 귀깃이 솟은 아주 큰 부엉이예요. 밤에 소리 없이 날아요. 천연기념물이에요.'],
    ['scopsowl', '소쩍새', 2, { n: 1, s: [...SPR, ...SUM] }, '봄밤에 소쩍소쩍 우는 작은 올빼미 무리예요. 천연기념물이에요.'],
    ['cuckoo', '뻐꾸기', 2, { s: SUM }, '뻐꾹뻐꾹 우는 여름 철새예요. 다른 새 둥지에 몰래 알을 낳아요.'],
    ['swallow', '제비', 2, { s: [...SPR, ...SUM] }, '봄에 남쪽에서 날아와 처마 밑에 진흙 둥지를 지어요. 날면서 벌레를 잡아요.'],
    ['treefrog', '청개구리', 2, { r: 1 }, '발가락 끝 빨판으로 잎에 착 붙어요. 비가 오려고 하면 더 크게 울어요.'],
    ['toad', '두꺼비', 2, { r: 1 }, '오돌토돌한 피부를 가진 개구리 무리예요. 비 오는 밤에 엉금엉금 걸어 다녀요.'],
    ['turtle', '남생이', 2, { w: 1, rare: 1, en: 'Ⅱ급' }, '우리나라 냇가에 사는 토종 거북이에요. 돌 위에서 햇볕을 쬐어요. 천연기념물이에요.'],
    ['lizard', '아무르장지뱀', 2, { s: SUM }, '꼬리가 아주 긴 도마뱀이에요. 위험하면 꼬리를 끊고 달아나요.'],
    ['weasel', '족제비', 2, {}, '몸이 가늘고 길어 좁은 굴에도 쏙 들어가요. 쥐를 잘 잡아요.'],
    ['hare', '멧토끼', 2, {}, '산과 들에 사는 야생 토끼예요. 긴 귀로 소리를 잘 듣고 아주 빨리 달려요.'],
    ['roedeer', '노루', 2, {}, '엉덩이에 하얀 털이 있는 작은 사슴이에요. 놀라면 엉덩이 털을 펴서 알려요.'],
    ['leopardcat', '삵', 2, { n: 1, rare: 1, en: 'Ⅱ급' }, '고양이를 닮은 야생 동물이에요. 이마에 줄무늬, 몸에 점무늬가 있어요. 밤에 사냥해요.']]
    .map(([k, nm, g, c, d]) => ({ id: 'bio_' + k, nm, g, ...c, d }));
  const BIO_BY = Object.fromEntries(BIO.map(b => [b.id, b]));
  const BIO_G = ['곤충', '식물', '새와 작은 동물'];
  const freshBx = () => ({ m: -1, sp: [], next: 0, got: {}, g: 0, st: { n: 0 } });
  const bxOpen = () => !!S && !!S.bx && S.tier >= BX.tier;
  const bxSpots = () => BX_SPOT[decoMap()] || null;
  const bxCount = () => S && S.bx ? BIO.filter(b => S.bx.got[b.id]).length : 0;
  const bxRareP = () => Math.min(BX.rareMax, BX.rare0 + Math.floor((S.f.science || 0) / 5));
  const kstMonth = t => new Date(t + KST_MS).getUTCMonth() + 1;
  function bxOk(b, t, water) {
    if (!!b.w !== !!water) return false;
    if (b.s && !b.s.includes(kstMonth(t))) return false;
    if (b.n && !nbOnAt(t)) return false;
    if (b.r && wxOf(kstDay(t)) !== 'rain') return false;
    return true;
  }
  function bxPick(t, water) {
    const el = BIO.filter(b => bxOk(b, t, water)), rares = el.filter(b => b.rare), com = el.filter(b => !b.rare);
    if (rares.length && (Math.random() * 100 < bxRareP() || !com.length)) return rares[Math.floor(Math.random() * rares.length)];
    // 계절, 밤, 비처럼 때를 타는 생물은 그때 잘 보이게 세 배로 뽑아요
    const wt = com.map(b => (b.s || b.n || b.r ? 3 : 1)), sum = wt.reduce((a, v) => a + v, 0);
    let r = Math.random() * sum;
    for (let i = 0; i < com.length; i++) { r -= wt[i]; if (r < 0) return com[i]; }
    return com[com.length - 1] || null;
  }
  // 게임 시계로 2시간마다 한 마리(자리 비운 동안의 몫도 그때 시각으로 뽑아요). 지도가 바뀌면 숨어 있던 생물은 떠나요
  function bxSync() {
    if (!bxOpen()) return;
    const L = bxSpots(); if (!L) return;
    const now = gameNow(), m = decoMap();
    if (S.bx.m !== m) { S.bx.m = m; S.bx.sp = []; }
    if (!S.bx.next) S.bx.next = now;
    for (let k = 0; k < 40 && S.bx.next <= now; k++) {
      if (S.bx.sp.length >= BX.max) { S.bx.next = now + BX.every; break; }
      const free = L.map((_, i) => i).filter(i => !S.bx.sp.some(x => x.i === i));
      const i = free[Math.floor(Math.random() * free.length)], b = bxPick(S.bx.next, L[i][2]);
      if (b) S.bx.sp.push({ i, id: b.id, t: S.bx.next });
      S.bx.next += BX.every;
    }
  }
  function bxMapHTML(m) {
    if (!bxOpen() || S.bx.m !== m || rt.viewTier != null) return '';
    const L = BX_SPOT[m]; if (!L) return '';
    return S.bx.sp.map(x => {
      const s = L[x.i]; if (!s) return '';
      const [px, py] = pctXY([s[0], s[1]]), w = 36, u = IMG(s[2] ? 'bio_rustle_water' : 'bio_rustle'), ln = IMG('bio_lens');
      return `<circle class="bx-glow" cx="${px}" cy="${(py - w * 0.32).toFixed(1)}" r="${(w * 0.56).toFixed(1)}" style="--d:${(x.i * 0.37).toFixed(2)}s"/>` +
        (ln ? `<image class="bx-lens" href="${ln}" x="${px + 4}" y="${(py - w * 1.12).toFixed(1)}" width="15" height="15" style="--d:${(x.i * 0.37).toFixed(2)}s"/>` : '') +
        `<g class="bx-it" style="--d:${(x.i * 0.37).toFixed(2)}s">${u ? `<image x="${px - w / 2}" y="${py - w * 0.8}" width="${w}" height="${w}" href="${u}"/>` : `<text x="${px}" y="${py - 4}" text-anchor="middle" font-size="18">${s[2] ? '💧' : '🌿'}</text>`}` +
        `<rect class="bx-hit" data-bx="${x.i}" x="${px - 22}" y="${py - 34}" width="44" height="44"/></g>`;
    }).join('');
  }
  function bxTap(i) {
    if (!bxOpen() || rt.paused) return null;
    const k = S.bx.sp.findIndex(x => x.i === i); if (k < 0) return null;
    const b = BIO_BY[S.bx.sp[k].id]; S.bx.sp.splice(k, 1);
    if (!b) return null;
    const nw = !S.bx.got[b.id];
    S.bx.got[b.id] = (S.bx.got[b.id] || 0) + 1; S.bx.st.n += 1;
    const got = [];
    acGain('sci', nw ? BX.xpNew : BX.xpDup); got.push(`과학 XP +${nw ? BX.xpNew : BX.xpDup}`);
    if (nw) { addEss(BX.essNew); got.push(`숲의 정수 +${BX.essNew}`); }
    else { const a = minAcorns(BX.dupMin); S.budget += a; earn(a); got.push(`도토리 +${fmt(a)}`); }
    const n = bxCount();
    if (n >= 10 && S.bx.g < 1) { S.bx.g = 1; addGold(BX.gold10); got.push(`생물 10종! 황금 도토리 +${BX.gold10}`); }
    if (n >= 20 && S.bx.g < 2) { S.bx.g = 2; addEss(BX.ess20); got.push(`생물 20종! 숲의 정수 +${BX.ess20}`); }
    if (n >= 30 && S.bx.g < 3) { S.bx.g = 3; S.deco.own.bio_hut = 1; got.push('생물 30종! 지도 장식 관찰 오두막'); }
    // 2.3.5 woodani 결정: 60종 황금 도토리 3과 곤충 호텔, 90종 숲의 정수 50과 생태 연못, 칭호 숲속 박사
    if (n >= 60 && S.bx.g < 4) { S.bx.g = 4; addGold(BX.gold60); S.deco.own.deco_bug_hotel = 1; got.push(`생물 60종! 황금 도토리 +${BX.gold60}, 지도 장식 곤충 호텔`); }
    if (n >= BIO.length && S.bx.g < 5) { S.bx.g = 5; addEss(BX.ess90); S.deco.own.deco_eco_pond = 1; got.push(`생물 ${BIO.length}종을 다 모았어요! 숲의 정수 +${BX.ess90}, 지도 장식 생태 연못, 칭호 숲속 박사`); }
    rt.bxRes = { b, nw, got };
    sfx(b.rare ? 'quest' : 'coin');
    renderDeco(true); renderHUD(); bxShow(); save();
    return rt.bxRes;
  }
  const bxImg = (b, cls) => IMG(b.id) ? `<img${cls ? ` class="${cls}"` : ''} src="${IMG(b.id)}" alt="">` : `<span class="bx-em">${['🐞', '🌿', '🐦'][b.g]}</span>`;
  function bxShow() {
    const R = rt.bxRes; if (!R) return;
    const b = R.b, lens = IMG('bio_lens');
    $('#bxCard').innerHTML = `<div class="bx-look">${lens ? `<img class="lens" src="${lens}" alt="">` : ''}${bxImg(b, 'pic')}</div>` +
      `<b class="bx-nm">${esc(b.nm)}${R.nw ? ' <i class="nw">NEW</i>' : ''}</b><small class="bx-g">${BIO_G[b.g]}${b.en ? `, 멸종위기 야생생물 ${b.en}` : b.rare ? ', 귀한 생물' : ''}</small>` +
      `<p class="bx-d">${esc(b.d)}</p><p class="bx-got">${R.got.map(esc).join('<br>')}</p><small class="bx-cnt">생물 도감 ${bxCount()}/${BIO.length}종</small>`;
    $('#bxCard').classList.remove('open'); void $('#bxCard').offsetWidth; $('#bxCard').classList.add('open');
    openModal($('#mBx'));
  }
  const bxHint = b => [b.w ? '물가' : '', b.s ? (b.s.every(m => SPR.includes(m)) ? '봄' : b.s.every(m => SUM.includes(m)) ? '여름' : b.s.every(m => AUT.includes(m)) ? '가을' : `${b.s[0]}~${b.s[b.s.length - 1]}월`) : '', b.n ? '밤 20~24시' : '', b.r ? '비 오는 날' : ''].filter(Boolean).join(', ');
  function bxDexRender() {
    if (!S || !S.bx) return;
    $('#bxDexHead').textContent = `관찰한 생물 ${bxCount()}/${BIO.length}종 (귀한 생물 ${BIO.filter(b => b.rare && S.bx.got[b.id]).length}/${BIO.filter(b => b.rare).length}). 오늘 지도에 숨은 생물 ${S.bx.sp.length}마리`;
    $('#bxDexGrid').innerHTML = BIO_G.map((g, gi) => `<b class="bx-gh">${g}</b>` + BIO.filter(b => b.g === gi).map(b => { const n = S.bx.got[b.id] || 0;
      return `<button type="button" class="sn-card bx-card${b.rare ? ' rare' : ''}${n ? '' : ' no'}" data-bxd="${b.id}">${n ? bxImg(b) : IMG('bio_frame') ? `<img src="${IMG('bio_frame')}" alt="">` : '❔'}<span class="ell">${n ? esc(b.nm) : '???'}</span><small>${n ? `${fmt(n)}번` : bxHint(b) || '언제든'}</small></button>`; }).join('')).join('');
  }
  function sanitizeBx(d, s) {
    const X = d.bx && typeof d.bx === 'object' ? d.bx : {}, o = freshBx(), lim = Math.max(Date.now(), Number(d.clk && d.clk.last) || 0) + 366 * 86400000, n = (v, hi) => Math.max(0, Math.min(hi, Math.floor(Number(v) || 0)));
    o.m = Number.isInteger(X.m) && X.m >= 0 && X.m < BX_SPOT.length ? X.m : -1;
    const L = BX_SPOT[o.m] || [], used = {};
    o.sp = (Array.isArray(X.sp) ? X.sp : []).filter(x => x && Number.isInteger(x.i) && x.i >= 0 && x.i < L.length && BIO_BY[x.id] && !used[x.i] && (used[x.i] = 1)).slice(0, BX.max).map(x => ({ i: x.i, id: x.id, t: n(x.t, lim) }));
    o.next = n(X.next, lim);
    if (X.got && typeof X.got === 'object') for (const b of BIO) if (X.got[b.id]) o.got[b.id] = n(X.got[b.id], 1e6);
    o.g = n(X.g, 5); o.st.n = n(X.st && X.st.n, 1e9);
    s.bx = o;
  }
  /* ---------- 2.2.0 학교 텃밭 (프로젝트 문서 '2.2.0 설계안' 3절, woodani 확정 2026-10-30) ----------
     유치원부터 급식실 창에서 열어요. 씨앗은 공짜, 작물마다 자라는 시간이 있고 물을 주면 남은 시간 -20%(비 오는 날은 저절로).
     거두면 재료 1개(물 준 작물은 2개). 하루 한 번 재료로 '오늘의 급식'을 만들면 그날 수업료 +5%(재료 3가지 메뉴는 +8%),
     영양 선생님 Lv.5마다 +1%p(최대 +3%p). 처음 만든 메뉴는 숲의 정수 3, 메뉴 8가지에 황금 도토리 1 */
  const GD = { plots: [2, 3, 4, 5, 5, 5], water: 0.2, ess: 3, gold8: 1, p2: 5, p3: 8, dietPer: 5, dietMax: 3, invMax: 99 };
  const GD_CROPS = [
    { k: 'lettuce', nm: '상추', em: '🥬', min: 20, tier: 0 }, { k: 'carrot', nm: '당근', em: '🥕', min: 60, tier: 0 },
    { k: 'potato', nm: '감자', em: '🥔', min: 120, tier: 0 }, { k: 'corn', nm: '옥수수', em: '🌽', min: 180, tier: 1 },
    { k: 'tomato', nm: '토마토', em: '🍅', min: 240, tier: 1 }, { k: 'pumpkin', nm: '호박', em: '🎃', min: 360, tier: 1 },
    { k: 'strawberry', nm: '딸기', em: '🍓', min: 480, tier: 2 }, { k: 'sweetpotato', nm: '고구마', em: '🍠', min: 600, tier: 2 }];
  const GD_C = Object.fromEntries(GD_CROPS.map(c => [c.k, c]));
  const GD_MENU = [
    ['17', '상추 샐러드', '🥗', { lettuce: 2 }],   // 2.3.0 상추만으로 만드는 첫 메뉴(유치원 gd4에서 당근을 기다리지 않게)
    ['01', '상추 비빔밥', '🍚', { lettuce: 1, carrot: 1 }], ['02', '당근 수프', '🥣', { carrot: 1, potato: 1 }], ['03', '감자전', '🥞', { potato: 1, lettuce: 1 }],
    ['04', '옥수수 수프', '🥣', { corn: 1, potato: 1 }], ['05', '토마토 스파게티', '🍝', { tomato: 1, lettuce: 1 }], ['06', '호박죽', '🥣', { pumpkin: 1, corn: 1 }],
    ['07', '딸기 우유', '🥛', { strawberry: 2 }], ['08', '고구마 맛탕', '🍠', { sweetpotato: 2 }], ['09', '감자 샐러드', '🥗', { potato: 1, carrot: 1, lettuce: 1 }],
    ['10', '채소 카레', '🍛', { potato: 1, carrot: 1, pumpkin: 1 }], ['11', '옥수수 버터구이', '🌽', { corn: 2 }], ['12', '토마토 달걀 볶음', '🍳', { tomato: 2 }],
    ['13', '딸기 샌드위치', '🥪', { strawberry: 1, lettuce: 1 }], ['14', '고구마 라테', '☕', { sweetpotato: 1, corn: 1 }],
    ['15', '숲속 채소 피자', '🍕', { tomato: 1, corn: 1, pumpkin: 1 }], ['16', '무지개 채소 김밥', '🍙', { lettuce: 1, carrot: 1, sweetpotato: 1 }]]
    .map(([n, nm, em, need]) => ({ id: 'menu_' + n, nm, em, need, kinds: Object.keys(need).length }));
  const GD_M = Object.fromEntries(GD_MENU.map(m => [m.id, m]));
  const freshGd = () => ({ plots: [], inv: {}, menu: {}, today: { day: '', id: '' }, g8: false, wx: '', st: { h: 0, cook: 0, plant: 0 }, free: 0, fq: [] });   // 3.3.2 free: 텃밭 바로 자라기 무료 횟수, fq: 그 기회를 준 퀘스트
  const gdOpen = () => !!S && !!S.gn && (S.f.cafeteria || 0) >= 1;
  const gdN = () => GD.plots[Math.max(0, Math.min(GD.plots.length - 1, S.tier))];
  const gdCropOk = c => !!GD_C[c] && GD_C[c].tier <= S.tier;
  const gdMenuOk = m => Object.keys(m.need).every(gdCropOk);
  const gdMenuCount = () => S && S.gn ? GD_MENU.filter(m => S.gn.menu[m.id]).length : 0;
  const gdReady = p => !!p && !!p.c && gameNow() >= p.e;
  const gdReadyN = () => S && S.gn ? S.gn.plots.slice(0, gdN()).filter(gdReady).length : 0;
  const gdDiet = () => Math.min(GD.dietMax, Math.floor(xtLv('diet') / GD.dietPer));
  const gdPct = m => (m.kinds >= 3 ? GD.p3 : GD.p2) + gdDiet();
  const gdToday = () => S && S.gn && S.gn.today.day === gameToday() && GD_M[S.gn.today.id] ? GD_M[S.gn.today.id] : null;
  const gdMult = () => { const m = S && S.gn ? gdToday() : null; return m ? 1 + gdPct(m) / 100 : 1; };
  const gdCanCook = m => gdMenuOk(m) && Object.entries(m.need).every(([c, n]) => (S.gn.inv[c] || 0) >= n);
  const gdImg = (key, em, cls) => IMG(key) ? `<img${cls ? ` class="${cls}"` : ''} src="${IMG(key)}" alt="">` : `<span class="gd-em${cls ? ' ' + cls : ''}" aria-hidden="true">${em}</span>`;
  // 비 오는 날: 심어 둔 밭에 저절로 물(하루 한 번 셈)
  function gdSync() {
    if (!S || !S.gn) return;
    const n = gdN(); while (S.gn.plots.length < n) S.gn.plots.push({ c: '', s: 0, e: 0, w: 0 });
    const d = gameToday();
    if (S.gn.wx !== d && wxIs('rain')) { S.gn.wx = d; for (const p of S.gn.plots) if (p.c && !p.w && !gdReady(p)) gdWet(p); }
  }
  function gdWet(p) { const now = gameNow(); p.w = 1; p.e = Math.max(now, p.e - Math.max(0, p.e - now) * GD.water); }
  function gdPlant(i, c) {
    if (!gdOpen() || rt.paused) return false;
    if (i === -2) {   // 3.3.2 빈 밭 모두 같은 작물로
      gdSync(); if (!gdCropOk(c)) return false;
      const now = gameNow(); let k = 0;
      S.gn.plots.slice(0, gdN()).forEach(p => { if (p.c) return; p.c = c; p.s = now; p.e = now + GD_C[c].min * 60000; p.w = 0; if (wxIs('rain')) gdWet(p); k++; });
      if (!k) return false;
      S.gn.st.plant += k; rt.gdPick = -1;
      sfx('tap'); toast(`${eul(GD_C[c].nm)} ${k}곳에 심었어요. ${hm(GD_C[c].min * 60)} 뒤에 거둬요`);
      gdRender(true); gdMark(); save();
      return true;
    }
    gdSync();
    const p = S.gn.plots[i]; if (!p || i >= gdN() || p.c || !gdCropOk(c)) return false;
    const now = gameNow(); p.c = c; p.s = now; p.e = now + GD_C[c].min * 60000; p.w = 0;
    if (wxIs('rain')) gdWet(p);
    S.gn.st.plant += 1; rt.gdPick = -1;
    sfx('tap'); toast(`${eul(GD_C[c].nm)} 심었어요. ${hm(Math.ceil((p.e - now) / 1000))} 뒤에 거둬요${p.w ? ' (비가 와서 물을 줬어요)' : ''}`);
    gdRender(true); gdMark(); save();
    return true;
  }
  /* 3.3.2 woodani 요청: 텃밭도 시간 단축권과 광고로 당겨요(공사와 같은 단축권). 그리고 텃밭 퀘스트(첫 작물 거두기, 오늘의 급식 만들기)가
     시작될 때 '바로 자라기' 무료 한 번(미리 오래 걸리는 작물을 심어 두면 퀘스트가 막혀서) */
  const GD_FREE_Q = ['gd3', 'gd4'];
  function gdFreeGrant(q) {
    if (!S || !S.gn || !q || !GD_FREE_Q.includes(q.id) || S.gn.fq.includes(q.id)) return;
    S.gn.fq.push(q.id); S.gn.free = Math.min(9, (S.gn.free || 0) + 1);
  }
  function gdCut(i, sec) {
    const p = S.gn.plots[i]; if (!p || !p.c || gdReady(p)) return false;
    const now = gameNow(); p.e = Math.max(now, p.e - sec * 1000);
    gdRender(true); gdMark(); save();
    return true;
  }
  function gdTk(i, tk) {
    const t = TK.find(x => x.k === tk), p = S.gn.plots[i]; if (!t || !p || !p.c || gdReady(p)) return;
    if (S.tk[tk] < 1) { toast(`${t.name}이 없어요. 광고를 보면 5분권 ${TKAD.n}장을 받아요`); return; }
    S.tk[tk] -= 1; S.st.tkUsed = (S.st.tkUsed || 0) + 1; sfx('tap');
    gdCut(i, t.sec);
    toast(gdReady(p) ? `${iga(GD_C[p.c].nm)} 다 자랐어요!` : `${t.name}으로 ${hm(t.sec)} 당겼어요`);
  }
  function gdTkAll(i) {
    const p = S.gn.plots[i]; if (!p || !p.c || gdReady(p)) return;
    const rem = Math.ceil((p.e - gameNow()) / 1000), pl = tkPlan(rem);
    if (!pl.n) { toast(`시간 단축권이 없어요. 광고를 보면 5분권 ${TKAD.n}장을 받아요`); return; }
    for (const t of TK) S.tk[t.k] -= pl.use[t.k];
    S.st.tkUsed = (S.st.tkUsed || 0) + pl.n; sfx('tap');
    gdCut(i, pl.cut + (pl.left ? 0 : 1));
    toast(pl.left ? `${tkPlanText(pl)}을 써서 ${hm(pl.cut)} 당겼어요. ${hm(pl.left)} 남아요` : `${tkPlanText(pl)}을 써서 다 자랐어요!`);
  }
  function gdPull(i) {   // 4.0.1 (woodani 결정): 자라는 작물을 뽑아 밭을 비워요. 재료와 통계는 그대로예요
    const p = S.gn.plots[i]; rt.gdPullI = -1; if (!p || !p.c || gdReady(p)) return false;
    const nm = GD_C[p.c].nm; S.gn.plots[i] = { c: '', s: 0, e: 0, w: 0 }; rt.gdCutI = -1;
    sfx('tap'); toast(`${eul(nm)} 뽑았어요. 밭이 비었어요`);
    gdRender(true); gdMark(); save();
    return true;
  }
  function gdFree(i) {
    const p = S.gn.plots[i]; if (!p || !p.c || gdReady(p) || !(S.gn.free > 0)) return;
    S.gn.free -= 1; sfx('quest');
    gdCut(i, 1e7);
    toast(`${iga(GD_C[p.c].nm)} 바로 다 자랐어요!`);
  }
  function gdWater(i) {
    const p = S.gn.plots[i]; if (!p || !p.c || p.w || gdReady(p)) return false;
    gdWet(p); sfx('tap'); toast(`물을 줬어요! ${hm(Math.max(0, Math.ceil((p.e - gameNow()) / 1000)))} 남았어요`);
    gdRender(true); gdMark(); save();
    return true;
  }
  function gdHarvest(i, quiet) {
    const p = S.gn.plots[i]; if (!p || !gdReady(p)) return false;
    const c = p.c, n = p.w ? 2 : 1, had = S.gn.inv[c] || 0;
    S.gn.inv[c] = Math.min(GD.invMax, had + n);
    const got = S.gn.inv[c] - had; if (got < n) rt.gdFull = true;   // 4.0.1: 재료가 가득 차서 덜 들어간 것을 알려요
    S.gn.plots[i] = { c: '', s: 0, e: 0, w: 0 }; S.gn.st.h += 1;
    if (quiet) return true;   // 3.3.2 모두 거두기는 한 번에 알려요
    rt.gdFull = false; sfx('coin'); toast(got >= n ? `${GD_C[c].nm} ${n}개를 거뒀어요!` : got > 0 ? `${GD_C[c].nm} ${got}개만 거뒀어요\n재료가 가득 찼어요(${GD.invMax}개)` : `${GD_C[c].nm} 재료가 가득 찼어요(${GD.invMax}개)\n거둔 작물은 넣지 못했어요`);
    gdRender(true); gdMark(); save();
    return true;
  }
  function gdCook(id) {
    const m = GD_M[id]; if (!m || !gdOpen() || rt.paused) return false;
    if (gdToday()) { toast('오늘의 급식은 이미 만들었어요. 내일 또 만들어요'); return false; }
    if (!gdCanCook(m)) { toast('재료가 모자라요'); return false; }
    for (const [c, n] of Object.entries(m.need)) S.gn.inv[c] -= n;
    const nw = !S.gn.menu[m.id];
    S.gn.menu[m.id] = (S.gn.menu[m.id] || 0) + 1; S.gn.st.cook += 1;
    S.gn.today = { day: gameToday(), id: m.id };
    let e = 0, g = 0;
    if (nw) e += GD.ess;
    if (!S.gn.g8 && gdMenuCount() >= 8) { S.gn.g8 = true; g += GD.gold8; }
    if (e) addEss(e); if (g) addGold(g);
    sfx('quest');
    toast(`오늘의 급식 ${m.nm}! 오늘 수업료 +${gdPct(m)}%${e ? `, 새 메뉴라 숲의 정수 +${e}` : ''}${g ? `, 메뉴 8가지라 황금 도토리 +${g}` : ''}`);
    renderHUD(); gdRender(true); save();
    return true;
  }
  function gdMark() {
    const pq = document.getElementById('pq-cafeteria'); if (!pq || !S || !S.gn) return;
    let g = pq.querySelector('.gdb');
    if (!g) { g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('class', 'gdb'); g.setAttribute('transform', 'translate(-30 -22)'); g.innerHTML = IMG('garden_bubble') ? `<image href="${IMG('garden_bubble')}" x="-12" y="-14" width="24" height="24"/>` : '<circle r="10"/><text y="4" text-anchor="middle">🌱</text>'; pq.appendChild(g); }
    pq.classList.toggle('gd-on', gdOpen() && rt.viewTier == null && gdReadyN() > 0);
  }
  function sanitizeGd(d, s) {
    const G = d.gn && typeof d.gn === 'object' ? d.gn : {}, o = freshGd(), lim = Math.max(Date.now(), Number(d.clk && d.clk.last) || 0) + 366 * 86400000, n = (v, hi) => Math.max(0, Math.min(hi, Math.floor(Number(v) || 0)));
    o.plots = (Array.isArray(G.plots) ? G.plots : []).slice(0, GD.plots[GD.plots.length - 1]).map(p => p && GD_C[p.c] ? { c: p.c, s: n(p.s, lim), e: n(p.e, lim), w: p.w ? 1 : 0 } : { c: '', s: 0, e: 0, w: 0 });
    if (G.inv && typeof G.inv === 'object') for (const c of Object.keys(GD_C)) if (G.inv[c]) o.inv[c] = n(G.inv[c], GD.invMax);
    if (G.menu && typeof G.menu === 'object') for (const m of GD_MENU) if (G.menu[m.id]) o.menu[m.id] = n(G.menu[m.id], 1e6);
    if (G.today && typeof G.today.day === 'string' && GD_M[G.today.id]) o.today = { day: G.today.day.slice(0, 10), id: G.today.id };
    o.g8 = G.g8 === true; o.wx = typeof G.wx === 'string' ? G.wx.slice(0, 10) : '';
    if (G.st && typeof G.st === 'object') for (const k of Object.keys(o.st)) o.st[k] = n(G.st[k], 1e9);
    o.free = n(G.free, 9); o.fq = (Array.isArray(G.fq) ? G.fq : []).filter(x => GD_FREE_Q.includes(x));
    s.gn = o;
  }
  function openGd() {
    if (!gdOpen()) { toast('급식실을 지으면 텃밭을 가꿀 수 있어요'); return; }
    gdSync(); rt.gdPick = -1; rt.gdCutI = -1; rt.gdSel = '';   // 5.0.2.2 다시 열면 만들기 확인 창은 닫혀 있어요
    gdFreeGrant(curMain());   // 3.3.2 이미 그 퀘스트 중인 학교도 텃밭을 열면 무료 한 번
    const bg = IMG('garden_bg'); $('#gdHead').style.backgroundImage = bg ? `url("${bg}")` : ''; $('#gdHead').classList.toggle('noimg', !bg);   // 그림(작업지시서 37-A)이 오기 전에는 낮게
    gdRender(true); openModal($('#mGd')); sfx('tap');
  }
  function gdRender(force) {
    if (!S || !S.gn || $('#mGd').hidden && !force) return;
    gdSync();
    const now = gameNow(), n = gdN(), tm = gdToday();
    const key = [n, rt.gdPick, JSON.stringify(S.gn.plots.slice(0, n).map(p => [p.c, p.w, gdReady(p), p.c ? Math.floor(Math.max(0, p.e - now) / 60000) : 0])), JSON.stringify(S.gn.inv), tm ? tm.id : '', gdDiet(), rt.gdCutI, rt.gdPullI, S.gn.free, JSON.stringify(S.tk), tkAdLeft()].join('|');
    if (!force && $('#gdPlots').dataset.key === key) return; $('#gdPlots').dataset.key = key;
    $('#gdPlots').innerHTML = S.gn.plots.slice(0, n).map((p, i) => {
      const C = GD_C[p.c], ready = gdReady(p), st = !C ? 0 : ready ? 3 : (now - p.s) / Math.max(1, p.e - p.s) < 0.5 ? 1 : 2;
      const bed = IMG(p.w && !ready ? 'plot_wet' : 'plot_dry'), crop = C ? gdImg(`crop_${p.c}_${st}`, st === 3 ? C.em : st === 2 ? '🌿' : '🌱', 'crop') : '';
      const tx = !C ? '빈 밭' : ready ? `${C.nm} 다 자람` : `${C.nm} ${hm(Math.max(1, Math.ceil((p.e - now) / 1000)))}`;
      const act = !C ? `<button type="button" data-gd="pick" data-i="${i}">심기</button>` : ready ? `<button type="button" class="go" data-gd="har" data-i="${i}">거두기</button>`
        : (p.w ? '<small>물 줬어요</small>' : `<button type="button" data-gd="wat" data-i="${i}">물 주기</button>`) + `<button type="button" data-gd="cut" data-i="${i}">시간 줄이기</button>`;   // 3.3.2
      return `<div class="gd-plot${ready ? ' ready' : ''}${rt.gdPick === i || rt.gdCutI === i ? ' pick' : ''}"><span class="bed"${bed ? ` style="background-image:url('${bed}')"` : ''}>${crop}</span><span class="tx">${tx}</span>${act}</div>`;
    }).join('');
    { const cb = $('#gdCut'), ci = rt.gdCutI, cp = ci >= 0 ? S.gn.plots[ci] : null, ok = cp && cp.c && !gdReady(cp);
      if (!ok) rt.gdCutI = -1;
      cb.hidden = !ok;
      if (ok) { const rem = Math.ceil((cp.e - now) / 1000), adL = tkAdLeft();
        cb.innerHTML = `<b>${GD_C[cp.c].nm} 시간 당기기 <small>${hm(rem)} 남음</small></b>` +
          (S.gn.free > 0 ? `<button type="button" class="go free" data-gd="free" data-i="${ci}">무료로 바로 자라기 (${S.gn.free}번)</button>` : '') +
          `<div class="gd-tks">${TK.slice().reverse().map(t => `<button type="button" data-gd="tk" data-tk="${t.k}" data-i="${ci}" aria-disabled="${S.tk[t.k] > 0 ? 'false' : 'true'}">${t.name}<small>${S.tk[t.k]}장</small></button>`).join('')}</div>` +
          `<div class="gd-tkrow"><button type="button" data-gd="tkall" data-i="${ci}" aria-disabled="${tkSum() > 0 ? 'false' : 'true'}">단축권 자동 사용</button>` +
          `<button type="button" data-gd="tkad" aria-disabled="${adL > 0 ? 'false' : 'true'}">광고 보고 5분권 ${TKAD.n}장 받기 (오늘 ${adL}번 남음)</button></div>` +
          `<div class="gd-tkrow"><button type="button" data-gd="pull" data-i="${ci}">${rt.gdPullI === ci ? '한 번 더 누르면 뽑아요 (재료 없음)' : '작물 뽑기'}</button></div>`; } }   // 4.0.1 잘못 심은 작물 뽑기(두 번 눌러요)
    { const live = S.gn.plots.slice(0, n), em = live.filter(p => !p.c).length, rd = live.filter(p => p.c && gdReady(p)).length, wt = live.filter(p => p.c && !p.w && !gdReady(p)).length;
      if (rt.gdPick === -2 && !em) rt.gdPick = -1;
      $('#gdBulk').innerHTML = n < 2 ? '' : (em ? `<button type="button" data-gd="pickall">빈 밭 모두 심기 (${em})</button>` : '') +
        (rd ? `<button type="button" data-gd="harall">모두 거두기 (${rd})</button>` : '') + (wt ? `<button type="button" data-gd="watall">모두 물 주기 (${wt})</button>` : ''); }
    const pk = $('#gdPick'); pk.hidden = !(rt.gdPick >= 0 || rt.gdPick === -2);
    if (rt.gdPick >= 0 || rt.gdPick === -2) pk.innerHTML = `<b>${rt.gdPick === -2 ? `빈 밭 ${S.gn.plots.slice(0, n).filter(p => !p.c).length}곳에 무엇을 심을까요?` : `${rt.gdPick + 1}번 밭에 무엇을 심을까요?`}</b><div class="gd-seeds">${GD_CROPS.map(c => gdCropOk(c.k)
      ? `<button type="button" data-gd="seed" data-c="${c.k}">${gdImg('item_' + c.k, c.em)}<span>${c.nm}</span><small>${hm(c.min * 60)}</small></button>`
      : `<button type="button" aria-disabled="true">${gdImg('item_' + c.k, c.em)}<span>${c.nm}</span><small>${['', '초등학교', '중학교'][c.tier]}부터</small></button>`).join('')}</div>`;
    $('#gdInv').innerHTML = `<b>재료</b>${GD_CROPS.filter(c => gdCropOk(c.k) || S.gn.inv[c.k]).map(c => `<span class="gd-it">${gdImg('item_' + c.k, c.em)}${S.gn.inv[c.k] || 0}</span>`).join('')}`;
    const dz = gdDiet();
    $('#gdToday').innerHTML = tm ? `${gdImg(tm.id, tm.em)}<span>오늘의 급식은 <b>${esc(tm.nm)}</b>! 오늘 수업료 +${gdPct(tm)}%</span>`
      : `<span>오늘의 급식을 만들면 그날 수업료 +${GD.p2 + dz}%(재료 3가지 메뉴는 +${GD.p3 + dz}%)${dz ? `. 영양 선생님 덕분에 +${dz}%p` : ''}</span>`;
    $('#gdMenus').innerHTML = `<b>급식 메뉴 ${gdMenuCount()}/${GD_MENU.length}</b><div class="gd-mgrid">${GD_MENU.map(m => {
      const has = S.gn.menu[m.id], ok = gdMenuOk(m), can = !tm && gdCanCook(m);
      const need = Object.entries(m.need).map(([c, k]) => `${GD_C[c].em}${k > 1 ? '×' + k : ''}`).join('');
      return `<button type="button" class="gd-menu${has ? '' : ' no'}${can ? ' can' : ''}${tm && tm.id === m.id ? ' on' : ''}" data-gd="cook" data-m="${m.id}" aria-disabled="${can ? 'false' : 'true'}">` +
        `${has ? gdImg(m.id, m.em) : gdImg('menu_frame', '🍽')}<span class="ell">${has || ok ? esc(m.nm) : '???'}</span><small>${can ? `만들기 +${gdPct(m)}%` : ok ? need : `${TIERS[Math.max(...Object.keys(m.need).map(c => GD_C[c].tier))].name}부터`}</small></button>`;
    }).join('')}</div>` + (() => { const m = !tm && GD_M[rt.gdSel]; return m && gdCanCook(m) ? `<div class="gd-ok" role="dialog" aria-label="오늘의 급식 만들기"><div class="gd-ok-bg" data-gd="cooksel" data-m=""></div><div class="gd-ok-card"><div class="gd-ok-pic">${gdImg(m.id, m.em)}</div><b>${eul(esc(m.nm))} 만들까요?</b><p>오늘 수업료 +${gdPct(m)}%<br>오늘의 급식은 하루 한 번이라 바꿀 수 없어요</p><div class="btn-row"><button class="btn-sub" type="button" data-gd="cooksel" data-m="">다시 고르기</button><button class="cta" type="button" data-gd="cookgo" data-m="${m.id}">만들기</button></div></div></div>` : ''; })();   // 5.0.1.6 C-03 누르면 먼저 물어봐요. 5.0.2.2 woodani: 아래에 붙던 확인 칸을 텃밭 창 가운데 따로 띄워요
  }
  /* 2.1.2 마을 기부(프로젝트 문서 '마을 기부 설계안 (2.1.2)', woodani 확정 2026-10-29): 도토리를 숲속 마을에 기부하면 기부 단계가 올라요.
     상한이 없고 힘(수입, 공사 속도)은 주지 않아요. 기념물, 칭호, 업적, 정수와 가끔 황금 도토리만. 졸업해도 남아요.
     단계마다 필요한 양 = 지금 수업료(초당, 특식 데이 2배는 빼고) × H(n)시간. 진행은 이번 단계 비율 p로 저장해서 수업료가 올라도 채운 만큼은 그대로예요 */
  const VD = { tier: 1, H: [1, 2, 3, 5, 8, 12, 18, 24], after: 6, ess: 5, goldEvery: 5, art: 8, w: 62, box: 46,
    fr: [0.9, 0.34, 0.4, 0.45, 0.43, 0.43, 0.54, 0.65, 0.66],   // 3.0.0 그림 캔버스에서 실제 그림이 차지하는 너비(기부함, 1~8단계). 1, 2단계는 그림이 작게 그려져서 이걸로 키워요
    spot: [null, [12, 90], [12, 91], [12, 90]],   // 3.3.0 woodani: '새 편지' 단추에 가려서 아래로. 오른쪽 아래는 체험학습 버스 자리라 간판 왼쪽 아래 풀밭으로
    titles: [{ id: 'vdpatron', lv: 3, title: '마을 후원자' }, { id: 'vdgold', lv: 8, title: '황금 나무 주인' }] };   // 20단계 '숲속 기부왕'은 업적 줄의 칭호
  ZONE_GEO.forEach(Z => VD.spot.push(Z.vd ? [Z.vd[0] / MAP_W * 100, (Z.vd[1] - MAP_Y) / MAP_H * 100] : null));   // 4.0.0 기념물은 광장 구역에만(작업지시서 54 자리 표)
  const vdH = n => n <= VD.H.length ? VD.H[n - 1] : VD.H[VD.H.length - 1] + VD.after * (n - VD.H.length);
  const vdOpen = () => !!S && !!S.vd && S.tier >= VD.tier;
  const vdRate = () => Math.max(1, rate() / (feastOn() ? 2 : 1) / snMult() / gdMult());   // 특식 데이와 간식 기분, 오늘의 급식은 빼요
  const vdLive = () => Math.max(1, Math.ceil(vdRate() * 3600 * vdH(S.vd.lv + 1)));
  // 2.3.1 woodani 결정: 그날 한 번 기부한 단계는 그날(23:59까지) 그 가격으로 나머지를 채워요. 날이 바뀌면 그때 수입으로 다시 정해요
  const vdLocked = () => { const k = S.vd.lk; return !!k && k.day === gameToday() && k.lv === S.vd.lv && k.need >= 1; };
  const vdNeed = () => vdLocked() ? S.vd.lk.need : vdLive();
  const vdLeft = () => Math.max(1, Math.ceil(vdNeed() * (1 - S.vd.p)));
  // 3.0.0 지도 기념물 크기: 실제 그림 너비 cw(기부함 41, 1단계 38에서 8단계 52까지), 캔버스 w
  const vdSize = lv => { const L = Math.min(VD.art, Math.max(0, lv)), cw = L ? 36 + 2 * L : VD.box * VD.fr[0]; return { cw, w: L ? Math.min(130, cw / VD.fr[L]) : VD.box }; };
  const vdImg = lv => lv <= 0 ? IMG('donate_box') : IMG('donate_m' + Math.min(VD.art, lv));
  // 그림(512 캔버스)마다 보이는 부분. 창과 보상 그림에서는 이만큼만 잘라 크게 보여요(앞 단계 기념물은 캔버스에 작게 그려져 있어요)
  const VD_BOX = [[26, 41, 485, 469], [168, 366, 344, 472], [151, 353, 360, 472], [139, 253, 371, 473], [143, 226, 369, 472], [144, 182, 367, 472], [117, 148, 393, 472], [90, 115, 423, 474], [88, 80, 424, 474]];
  function vdPic(lv, px) {
    const u = vdImg(lv); if (!u) return '';
    const [x0, y0, x1, y1] = VD_BOX[Math.min(VD.art, Math.max(0, lv))], side = Math.max(x1 - x0, y1 - y0) * 1.08, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    return `<svg viewBox="${(cx - side / 2).toFixed(0)} ${(cy - side / 2).toFixed(0)} ${side.toFixed(0)} ${side.toFixed(0)}" width="${px}" height="${px}" aria-hidden="true"><image href="${u}" width="512" height="512"/></svg>`;
  }
  const vdReward = lv => lv <= VD.art ? { e: VD.ess * lv, g: 0 } : { e: 0, g: lv % VD.goldEvery === 0 ? 1 : 0 };
  const vdAmt = k => { const need = vdNeed(), left = vdLeft(); return k === 'left' ? left : Math.min(left, Math.ceil(need * k)); };
  // 기부: k는 0.1, 0.5, 'left'(다음 단계까지 남은 만큼), 'all'(가진 만큼, 모자랄 때). 이번 단계를 넘겨서 내지는 않아요
  function vdGive(k) {
    if (!vdOpen() || rt.paused) return false;
    const need = vdNeed(), left = vdLeft();
    let a = k === 'all' ? Math.min(left, Math.floor(S.budget)) : vdAmt(k);
    if (!(a >= 1)) { toast('기부할 도토리가 없어요'); return false; }
    if (S.budget < a) { toast(`도토리가 ${fmt(a - S.budget)}개 모자라요`); return false; }
    if (!vdLocked()) S.vd.lk = { day: gameToday(), lv: S.vd.lv, need };   // 2.3.1 오늘 이 가격으로 묶어요
    S.budget -= a; S.vd.sum += a; S.vd.n += 1;
    S.vd.p = a >= left ? 1 : Math.min(0.999999, S.vd.p + a / need);
    if (S.vd.p >= 1) vdUp();
    else { sfx('coin'); toast(`마을에 도토리 ${fmt(a)}개를 기부했어요. ${S.vd.lv + 1}단계까지 ${Math.floor(S.vd.p * 100)}%`); vdRender(); }
    renderHUD(); renderDeco(true); save();
    return true;
  }
  function vdUp() {
    S.vd.lv += 1; S.vd.p = 0;
    const lv = S.vd.lv, r = vdReward(lv), items = [];
    if (r.e) { addEss(r.e); items.push({ ic: 'ess', t: `숲의 정수 +${r.e}` }); }
    if (r.g) { addGold(r.g); items.push({ ic: 'gold', t: `황금 도토리 +${r.g}` }); }
    const tt = VD.titles.find(t => t.lv === lv);
    if (tt) { if (!S.ach.title) { S.ach.title = tt.id; rankDirty(); } items.push({ ic: '🎖️', t: `칭호 "${tt.title}"${S.ach.title === tt.id ? '를 달았어요' : '를 받았어요'}` }); }
    rt.vdPop = true; closeModal($('#mVd'));
    sfx('quest');
    showReward({ title: `마을 기부 ${lv}단계!`, sub: lv <= VD.art ? '마을에 새 기념물이 생겼어요' : '황금 나무가 더 반짝여요', art: vdPic(lv, 110),
      big: `숲속 마을 친구들이 고마워해요`, items: items.length ? items : [{ ic: '🌳', t: `${lv + 1}단계를 향해 가요` }] });
    renderAch(true); renderHudTitle();
  }
  function openVd() {
    if (!vdOpen()) { toast('마을 기부는 초등학교부터 열려요'); return; }
    const bg = IMG('donate_bg'); $('#vdHead').style.backgroundImage = bg ? `url("${bg}")` : '';
    $('#vdBtns').dataset.key = ''; vdRender(); openModal($('#mVd')); sfx('tap');
  }
  function vdRender() {
    const m = $('#mVd'); if (!m || !S || !S.vd) return;
    const lv = S.vd.lv, pct = Math.floor(S.vd.p * 100), left = vdLeft(), a1 = vdAmt(0.1), a5 = vdAmt(0.5), short = S.budget < a1;
    const key = [lv, pct, left, a1, a5, short, Math.floor(S.budget), vdLocked()].join('|'); if ($('#vdBtns').dataset.key === key) return; $('#vdBtns').dataset.key = key;
    $('#vdNow').innerHTML = vdPic(lv, 96); $('#vdNowT').textContent = lv ? `지금 ${lv}단계` : '기부함';
    $('#vdNext').innerHTML = vdPic(lv + 1, 96); $('#vdNextT').textContent = `${lv + 1}단계`;
    $('#vdFill').style.width = pct + '%'; $('#vdPct').textContent = `${pct}%`; $('#vdBar').setAttribute('aria-valuenow', pct);
    const r = vdReward(lv + 1), tt = VD.titles.find(t => t.lv === lv + 1) || (lv + 1 === 20 ? { title: achTitleName('donate') } : null);
    const rw = [r.e ? `숲의 정수 ${r.e}` : '', r.g ? `황금 도토리 ${r.g}` : '', tt ? `칭호 "${tt.title}"` : ''].filter(Boolean).join(', ');
    $('#vdLead').textContent = `${lv + 1}단계까지 도토리 ${fmt(left)}개가 더 필요해요\n${rw ? `${lv + 1}단계 보상: ${rw}` : `${lv + 1 > VD.art ? `${VD.goldEvery}단계마다 황금 도토리를 받아요` : ''}`}`;
    const b = (k, nm, a) => `<button type="button" data-vdk="${k}" aria-disabled="${S.budget >= a ? 'false' : 'true'}"><span>${nm}</span><em>${acornIcon()}${fmt(a)}</em></button>`;
    $('#vdBtns').innerHTML = short && S.budget >= 1 ? b('all', '있는 만큼', Math.min(left, Math.floor(S.budget))) : b('0.1', '10%', a1) + b('0.5', '50%', a5) + b('left', '남은 만큼', left);
    $('#vdSum').textContent = `지금까지 기부한 도토리 ${fmt(S.vd.sum)}개\n단계가 오르면 지도에 기념물이 서요. 수입은 늘지 않아요. 졸업해도 남아요`;
    { const lk = $('#vdLock'); if (lk) { lk.hidden = !vdLocked(); lk.textContent = '이 가격은 오늘 23:59까지예요. 지나면 그때 수입에 맞게 기부할 도토리가 다시 정해져요'; } }   // 2.3.1
  }
  // 지도의 기념물(renderDeco가 불러요): 지금 지도에 자리가 있을 때만
  function vdMapHTML(m) {
    if (!vdOpen() || !VD.spot[m]) return '';
    const [x, y] = pctXY(VD.spot[m]), lv = S.vd.lv, { w, cw } = vdSize(lv), u = vdImg(lv);   // 3.0.0 woodani: 그래도 잘 안 보여서 그림 실제 크기로 맞춰 키워요
    if (!u) return '';   // 기부함은 캔버스를 꽉 채워서 작게
    const pop = rt.vdPop ? ' pop' : ''; rt.vdPop = false;
    const t = lv ? `마을 기부 ${lv}단계` : '마을 기부', tw = t.length * 6.2 + 10;
    const hw = Math.max(cw + 6, 44);   // 누르는 칸은 손가락 크기 이상
    return `<ellipse class="vd-sh" cx="${x}" cy="${(y - 1).toFixed(1)}" rx="${(cw * 0.56).toFixed(1)}" ry="${(cw * 0.15).toFixed(1)}"/>` +   // 3.0.0 바닥 그림자
      `<image class="vd-it${pop}" x="${x - w / 2}" y="${(y - w * 472 / 512).toFixed(1)}" width="${w}" height="${w}" href="${u}"/>` +
      `<g class="vd-tag"><rect x="${(x - tw / 2).toFixed(1)}" y="${(y + 1).toFixed(1)}" width="${tw.toFixed(1)}" height="11" rx="5.5"/><text x="${x}" y="${(y + 9).toFixed(1)}">${t}</text></g>` +
      `<rect class="vd-hit" data-vd="1" x="${x - hw / 2}" y="${(y - hw * 0.85).toFixed(1)}" width="${hw}" height="${(hw * 0.85 + 13).toFixed(1)}"/>`;
  }
  // 2.2.0 칩이 두세 줄이 되면 위의 '새 편지' 칩을 그만큼 올려요
  // 3.3.4 아래 한 줄 칩: 오른쪽부터 까치 핫딜, 새 편지, 즉시 완공 순서로 놓아요. 학교급 단추에 닿으면 한 줄 위로
  function chipRow() {
    const fr = $('#ffChip') && $('#ffChip').parentElement; if (!fr) return;
    const dots = $('#tierDots'), W = fr.clientWidth; let lim = dots && !dots.hidden && dots.offsetWidth ? dots.offsetLeft + dots.offsetWidth + 8 : 10;
    { const wx = $('#wxChip'); if (wx && !wx.hidden && wx.offsetWidth) lim = Math.max(lim, wx.getBoundingClientRect().right - fr.getBoundingClientRect().left + 8); }   // 5.0.1.5 H-04 날씨 칩도 비켜요
    let r = 10, row = 0;
    for (const el of [$('#btnDeal'), $('#plChip'), $('#ffChip'), $('#upChip')]) {
      if (!el || el.hidden || !el.offsetWidth) continue;
      const w = el.offsetWidth;
      if (r > 10 && W - r - w < lim) { row += 1; r = 10; }
      el.style.right = r + 'px'; el.style.bottom = `calc(var(--bot-h, 70px) + ${10 + row * 35}px)`;
      r += w + 6;
    }
    { const zb = $('#zoneBar'); if (zb) { zb.dataset.bot = `calc(var(--bot-h, 70px) + ${46 + row * 35}px)`; zb.style.bottom = rt.decoEdit ? 'calc(var(--bot-h, 70px) + 80px)' : zb.dataset.bot; } }   // 4.0.0 구역 막대는 칩 줄 바로 위
  }
  function ffUp() { chipRow(); }
  function ffRender(force) {
    if (!S) return;
    const ks = ffList(), on = cbOn(), nb = nbOn(), nbShow = S.tier >= NB.tier && !liveOff('night');
    for (const k of Object.keys(FAC)) { const p = document.getElementById('pq-' + k); if (p) p.classList.toggle('ff-on', ks.includes(k)); }
    const c = $('#ffChip'); if (!c) return;
    upRender(rt.tab === 'school' && rt.viewTier == null && !rt.decoEdit && !rt.fest && !rt.sports && !festBusy() && !rt.paused && S.tier >= 1);   // 5.0.2.2
    const show = S.ffx !== gameToday() && rt.tab === 'school' && rt.viewTier == null && !rt.decoEdit && !rt.fest && !rt.sports && !festBusy() && !rt.paused && S.tier >= 1 && (ks.length > 0 || on || nbShow);   // 학교 행사 중에는 숨겨요. 2.2.0 야간 건설 줄은 초등학교부터 늘 보여요
    const key = [show, S.ffx, ks.length, ffLeft(), on ? Math.floor(cbLeft() / 60) : -1, nbShow ? (nb ? Math.floor(nbLeft() / 60) : -2) : -1, nbAdd()].join('|');
    if (!force && c.dataset.key === key) return; c.dataset.key = key;
    c.hidden = !show; if (!show) { ffUp(c); return; }
    c.classList.toggle('pulse', ks.length > 0);
    const nbIc = IMG('ic_nightbuild') ? `<img class="nb-ic" src="${IMG('ic_nightbuild')}" alt="">` : '🌙';
    const sp = nbAdd() > NB.add, nbTx = !nbShow ? '' : nb ? `${nbAllDay(gameToday()) ? '주말 건설 가속' : '야간 건설'} +${nbAdd()}%, ${hm(nbLeft())} 남음` : sp ? (nbAllDay(gameToday()) ? `오늘 하루 종일 건설 가속 +${nbAdd()}%(특별 이벤트 주말)` : `오늘 ${NB.h0}~${NB.h1}시 건설 가속 +${nbAdd()}%(특별 이벤트)`) : `매일 ${NB.h0}~${NB.h1}시 건설 가속 이벤트`;
    c.classList.toggle('nb-on', nb && nbShow);
    const mp = $('#map'); if (mp) mp.classList.toggle('nb-night', nb);   // 2.2.0 비계에 등불
    // 3.3.4 작은 알약: ⚡남은 번, 건설 부스터, 야간 건설 아이콘(켜져 있을 때만 +n%). 자세한 말은 누르면 떠요
    c.innerHTML = (ks.length ? `<b>⚡${ffLeft()}/${FF.day}</b>` : '') + (on ? `<small>🔨+100%</small>` : '') +
      (nbShow ? `<small class="nb">${nbIc}${nb || sp ? ` +${nbAdd()}%` : ''}</small>` : '') + '<span class="ffx" role="button" aria-label="오늘은 이 알림 닫기">×</span>';
    c.dataset.tip = [ks.length ? `즉시 완공이 오늘 ${ffLeft()}번 남았어요. ${FAC[ks[0]].name}부터 보여 드려요` : '', on ? `건설 부스터 +100%, ${hm(cbLeft())} 남음` : '', nbShow ? nbTx : ''].filter(Boolean).join(' / ');
    c.setAttribute('aria-label', (ks.length ? `오늘 즉시 완공 ${FF.day}번 가운데 ${ffLeft()}번 남음, 눌러서 건물 창 열기` : '') + (on ? ` 건설 부스터 사용 중` : '') + (nbShow ? ` ${nbTx}` : ''));
    ffUp(c);
  }
  /* 5.0.2.2 woodani 결정(2026-11-18): 건물을 하나씩 들어가 올리기 불편하다는 의견. 지금 도토리로 올릴 수 있는 건물을 싼 것부터 골라
     가구를 채우고 공사까지 한 번에 시작해요. 이미 지은 건물만, 공사 중이거나 이 학기 최고 레벨이면 빼요. 두 채 이상일 때 홈 아래 칩으로 보여요 */
  function upPlan() {
    const opts = facKeys().filter(k => S.f[k] >= 1 && !conOn(k) && !facMaxed(k)).map(k => ({ k, c: furLeftCost(k) + facCost(k) })).filter(o => isFinite(o.c)).sort((a, b) => a.c - b.c);
    const ks = []; let cost = 0;
    for (const o of opts) { if (cost + o.c > S.budget) break; cost += o.c; ks.push(o.k); }
    return { ks, cost };
  }
  function upRender(base) {
    const c = $('#upChip'); if (!c) return;
    const n = base ? upPlan().ks.length : 0, show = n >= 2, key = show ? String(n) : '';
    if (c.dataset.key === key) return; c.dataset.key = key;
    c.hidden = !show;
    if (show) { c.innerHTML = `<b>🔨 건물 ${n}채 올리기!</b>`; /* 5.0.3 woodani: '한 번에 n채'보다 알아보기 쉽게 */ c.setAttribute('aria-label', `올릴 수 있는 건물 ${n}채를 한 번에 한 단계씩 올리기`); }
    chipRow();
  }
  function upAsk() {
    const P = upPlan(); if (P.ks.length < 1) { toast('지금 도토리로 올릴 수 있는 건물이 없어요'); return; }
    const rows = P.ks.map(k => `<span class="ask-row"><i>${esc(FAC[k].name)}</i><span>Lv.${S.f[k]} → <b>${S.f[k] + 1}</b></span><em>+1</em></span>`).join('');
    askBox({ title: '건물 한 번에 올리기', yes: '올리기', no: '그만두기',
      html: `<span class="ask-sum">${acornIcon()}<b>${fmtN(P.cost)}</b>${eulOf(fmtN(P.cost))} 써요</span><span class="ask-sub">남는 도토리 ${fmtN(S.budget - P.cost)}. 가구를 채우고 공사를 시작해요</span><span class="ask-rows">${rows}</span>`,
      onYes: () => upAll(P.ks) });
  }
  // 보여 준 건물만 올려요(창을 보는 동안 들어온 도토리로 더 올리지 않아요)
  function upAll(ks) {
    if (rt.paused) return 0;
    ks = (ks || upPlan().ks).filter(k => facKeys().includes(k) && S.f[k] >= 1 && !conOn(k) && !facMaxed(k));
    const done = [];
    rt.batch = { items: [], n: 0 };   // 건물마다 뜨는 알림과 소리는 모아서 한 번
    try { for (const k of ks) { if (!furReady(k)) buyFurAll(k); if (furReady(k) && buyFacility(k)) done.push(k); } } finally { rt.batch = null; }
    if (!done.length) { toast('도토리가 모자라 올리지 못했어요'); return 0; }
    sfx('buy'); buzz(14);
    toast(`건물 ${done.length}채 공사 시작! ${done.map(k => FAC[k].name).join(', ')}`);
    ffRender(true); save();
    return done.length;
  }
  // 2.1.1 건물마다 하루 한 번 바로 완공 → 3.0.0 조정안 7(woodani 결정): 학교 전체 하루 3번, 고르는 건물은 마음대로. S.ffd = { 날, 쓴 횟수 }
  const FF = { day: 3 };
  const ffLeft = () => !S || !S.ffd ? 0 : S.ffd.day === gameToday() ? Math.max(0, FF.day - S.ffd.n) : FF.day;
  const conFreeLeft = k => ffLeft() > 0;
  // 2.3.0 즉시 완공 단추: 공사 중인 건물을 바로 끝내요(3.0.0 학교 전체 하루 3번). 공사 중이 아니면 먼저 공사를 시작하고 바로 끝내요
  function conFree(k) {
    if (!S || S.tier < 1 || !facKeys().includes(k) || !conFreeLeft(k) || rt.paused) return false;
    if (!conOn(k)) { if (!furReady(k) || facMaxed(k) || S.budget < facCost(k)) return false; if (!buyFacility(k)) return false; }
    if (!conOn(k)) return false;   // 10초 공사가 이미 끝났으면 쓰지 않아요
    const L = S.bd[k].L;
    { const t = gameToday(); S.ff[k] = t; if (S.ffd.day !== t) S.ffd = { day: t, n: 0 }; S.ffd.n += 1; }
    sfx('quest'); conFinish(k);
    { const n = ffLeft(); setTimeout(() => toast(`즉시 완공! ${FAC[k].name} Lv.${L}\n${n ? `오늘 즉시 완공 ${n}번 더 쓸 수 있어요` : '오늘 즉시 완공을 다 썼어요. 내일 다시 3번이에요'}`), 900); }
    renderMap(); conRender(true); ffRender(true); save();
    return true;
  }
  // 2.3.0 숲의 정수로 즉시 완료(woodani 확정): 남은 시간 5분 이하는 정수 2, 그 위로는 10분마다 4(올림)
  const CESS = { min5: 2, per10: 4 };
  const conEssCost = sec => sec <= 0 ? 0 : sec <= 300 ? CESS.min5 : CESS.per10 * Math.ceil(sec / 600);
  const conEssQuiet = () => !!S && S.ces === gameToday();
  function conEss(k) {
    if (!S || !conOn(k) || rt.paused) return false;
    const c = conEssCost(conLeft(k)); if (!c) return false;
    if (S.ess < c) { toast(essShort(c - S.ess)); return false; }
    const L = S.bd[k].L;
    S.ess -= c; S.st.esSpent = (S.st.esSpent || 0) + c; renderEss();
    sfx('quest'); conFinish(k);
    setTimeout(() => toast(`숲의 정수 ${c}로 즉시 완료! ${FAC[k].name} Lv.${L}`), 900);
    renderMap(); conRender(true); ffRender(true); save();
    return true;
  }
  function askConEss(k) {
    if (!conOn(k)) return;
    const left = conLeft(k), c = conEssCost(left);
    if (S.ess < c) { shake($('#conEss')); toast(essShort(c - S.ess)); return; }
    if (conEssQuiet()) { conEss(k); renderSheet(); return; }
    rt.cesK = k;
    $('#cesText').textContent = `${FAC[k].name} Lv.${S.bd[k].L} 공사가 남은 ${hm(left)}을 기다리지 않고 바로 끝나요.`;
    $('#cesCost').innerHTML = `${ESS_ICON()}<b>${c}</b>`;
    $('#cesHave').textContent = `가진 숲의 정수 ${fmt(S.ess)} → ${fmt(S.ess - c)}`;
    $('#cesQuiet').classList.remove('on'); $('#cesQuiet').setAttribute('aria-checked', 'false');
    openModal($('#mCes'));
  }
  function buyFacility(k, price) {
    if (!furReady(k) || conOn(k)) return false;   // 가구를 다 채워야 건물을 키울 수 있어요. 공사 중이면 다음 레벨은 끝난 뒤에
    const c = price || facCost(k);
    if (S.budget < c) return false;
    S.budget -= c;
    const L = S.f[k] + 1, now = gameNow(), sec = conSec(k, L);
    S.bd[k] = { L, s: now, e: now + sec * 1000 };
    S.st.cons = (S.st.cons || 0) + 1;
    // 2.3.0 woodani 결정: 하루 한 번 즉시 완공은 저절로 쓰지 않고, 건물 창의 ⚡ 즉시 완공 단추로 원할 때 써요(conFree)
    toast(sec <= 10 ? `${FAC[k].name} 공사 시작! 금방 끝나요` : `${FAC[k].name} 공사 시작! ${hm(sec)} 뒤에 Lv.${L}`);
    sfx('tap');
    afterPurchase();   // 3.2.3 끊김 줄이기: 여기서 지도를 그리므로 아래에서 한 번 더 그리지 않아요
    conRender(true);
    return true;
  }
  // 공사 끝: 레벨이 오르고 예전처럼 효과와 알림이 나와요. quiet면 알림 대신 묶어서 한 번(켤 때 끝난 공사 n개)
  function conFinish(k, quiet) {
    const b = S.bd[k]; if (!b) return false;
    delete S.bd[k];
    if (S.f[k] + 1 !== b.L) return false;   // 학교가 바뀌는 등으로 맞지 않는 공사는 버려요
    const was = S.f[k], wasReady = mainReady();
    S.f[k] = was + 1;
    S.st.ups += 1;
    clubFacUp(k);   // 2.0.0
    // 1.7.0: 학교급이 오른 뒤 처음 키우면 건물 모습이 그 학교급으로 바뀌어요
    let newLook = false;
    if (S.bs && (S.bs[k] || 0) < S.tier) { const before = bldImg(k); S.bs[k] = S.tier; if (bldImg(k) !== before) { newLook = true; setBldArt(k); } }
    if (was === 0 && rt.sheetKey === k) closeSheet();   // 처음 지을 때는 안을 보여 주지 않고 지도로 돌아가요
    // 1장에서는 퀘스트 목표를 이루면 시트를 닫아 알림줄의 받기 버튼이 보이게 해요
    setTimeout(() => {
      if (!wasReady && mainReady() && S.q.m < CH1() && rt.sheetKey === k) closeSheet();
    }, 550);
    const L = S.f[k], n = FAC[k].name;
    if (k === 'classroom') toast(`교실 Lv.${L}! 정원이 ${capacity()}명으로 늘었어요`);
    else if (was === 0 && k === 'cafeteria') toast('급식실을 지었어요! 수업료 +20%');
    else if (was === 0 && k === 'library') toast('도서관을 지었어요! 평판 ★3');
    else if (was === 0 && k === 'science') toast('과학실을 지었어요! 수료증 +3%, 평판 ★1');
    else if (was === 0 && k === 'store') toast(`매점을 지었어요! 수업료 +${FAC.store.per}%`);
    else if (was === 0 && k === 'dorm') toast(`기숙사를 지었어요! 수업료 +${FAC.dorm.per}%\n오소리 선생님이 오셨어요`);
    else if (was === 0 && k === 'union') toast(`학생회관을 지었어요! 수업료 +${FAC.union.per}%\n두루미 학장 교수님이 오셨어요`);
    else if (was === 0 && k === 'playground') { toast(`${eul(FAC.playground.name)} 지었어요! 옆 참나무를 누르면 도토리가 떨어져요`); rt.dropT = dropIntervalFor(1) - 3; }
    else if (!quiet) toast(`${n} Lv.${L}! ${FAC[k].eff(L)}`);
    if (newLook && !quiet) setTimeout(() => toast(`${n} 모습이 ${tierInfo().name}답게 새로 바뀌었어요!`), 1600);
    afterPurchase();
    if (!quiet) bldFx(k, was === 0 ? 'build' : 'up');   // 1.8.0
    return true;
  }
  // 게임 시계로 끝난 공사를 마쳐요. 한 번에 둘 이상 끝났으면(자리 비운 뒤 켤 때) 하나로 묶어 알려요
  function conTick() {
    if (!S || !S.bd) return 0;
    cbApply(); nbApply();   // 2.1.1 건설 가속, 2.2.0 야간 건설
    const now = gameNow(), done = Object.keys(S.bd).filter(k => S.bd[k].e <= now);
    if (!done.length) return 0;
    const many = done.length >= 2, names = [];
    for (const k of done) { const L = S.bd[k].L; if (conFinish(k, many)) names.push(`${FAC[k].name} Lv.${L}`); }
    if (many && names.length) { toast(`끝난 공사 ${names.length}개: ${names.join(', ')}`); sfx('done'); }
    renderMap(); conRender(true); save();
    return done.length;
  }
  // 단축권 쓰기: 남은 시간을 sec초 줄여요. 0이 되면 바로 끝나요
  function conCut(k, sec) {
    if (!conOn(k)) return;
    S.bd[k].e -= sec * 1000;
    if (S.bd[k].e <= gameNow()) conTick(); else { renderMap(); conRender(true); save(); }
  }
  function tkUseAll(k) {
    const rem = conLeft(k); if (!rem) return false;
    const p = tkPlan(rem); if (!p.n) { toast(`시간 단축권이 없어요. 광고를 보면 5분권 ${TKAD.n}장을 받아요`); return false; }
    for (const t of TK) S.tk[t.k] -= p.use[t.k];
    S.st.tkUsed = (S.st.tkUsed || 0) + p.n;   // 4.0.1: 자동 사용도 쓴 장수를 세요
    toast(p.left ? `${tkPlanText(p)}을 써서 ${hm(p.cut)} 줄였어요. ${hm(p.left)} 남아요` : `${tkPlanText(p)}을 써서 공사가 끝났어요!`);
    conCut(k, p.cut + (p.left ? 0 : 1));
    return true;
  }
  function tkUse(k, tk) {
    const t = TK.find(x => x.k === tk); if (!t || !conOn(k) || S.tk[tk] < 1) return false;
    S.tk[tk] -= 1; S.st.tkUsed = (S.st.tkUsed || 0) + 1;
    conCut(k, t.sec);
    return true;
  }
  function tkAd() {
    if (tkAdLeft() <= 0) { toast('오늘 광고 단축권은 다 받았어요. 내일 다시 받아요'); return; }
    showAd(() => {
      const today = gameToday();
      if (dayRoll(S.tka, today)) { S.tka.n = 0; }
      S.tka.n += 1; S.tk.m5 += TKAD.n;
      sfx('quest'); toast(`5분 단축권 ${TKAD.n}장을 받았어요!`);
      conRender(true); save();
    });
  }
  // 지도 위 공사 표시(비계와 진행 막대)와 건물 창의 공사 칸을 새로 그려요. force가 아니면 1초에 한 번만
  function conRender(force) {
    if (!S || !S.bd) return;
    const sec = Math.floor(Date.now() / 1000);
    if (!force && rt.conSec === sec) return;
    rt.conSec = sec;
    for (const k of Object.keys(FAC)) conMap(k);
    if (rt.sheetKey) conSheet();
  }
  function conMap(k) {
    const g = $('#b-' + k); if (!g) return;
    let el = g.querySelector('.con'), ui = document.getElementById('cu-' + k);
    if (!conOn(k) || !facKeys().includes(k) || (uniOn() && !geo().lot[k])) { if (el) el.remove(); if (ui) ui.remove(); g.classList.remove('is-con'); ffbAt(k, 0, false); return; }   // 4.1.1 woodani 제보: 대학교에서 구역을 옮기면 다른 구역 건물의 공사 막대와 비버 선생님이 그대로 남았어요. 이 지도에 없는 건물은 지워요
    const bi = g.querySelector(S.f[k] >= 1 ? '.built .bimg' : '.site .bimg') || g.querySelector('.bimg'); if (!bi) return;
    if (el && el.dataset.lay !== String(rt.mapLaid)) { el.remove(); el = null; if (ui) { ui.remove(); ui = null; } }   // 3.2.3 학교급이 바뀌어 지도 배치가 달라지면 막대 자리를 다시 잡아요
    const num = a => Number(bi.getAttribute(a)) || 0, x = num('x'), y = num('y'), w = num('width'); if (!w) return;
    const b = S.bd[k], left = conLeft(k), pr = Math.min(1, Math.max(0, 1 - left * 1000 / Math.max(1, b.e - b.s)));
    if (!el) {
      el = document.createElementNS('http://www.w3.org/2000/svg', 'g'); el.setAttribute('class', 'con'); g.appendChild(el);
      const bw = Math.min(w, 104) * 0.74, bh = bw * 56 / 256,   // 2.1.2: 넓은 그림(운동장, 과학실)도 막대와 글씨는 다른 건물과 같은 크기
        bx = x + (w - bw) / 2,
        // 3.2.3 woodani 요청: 막대가 건물 꼭대기에 있으면 촘촘한 지도(고등학교)에서 위 건물 이름판과 겹쳐요. 이름판 바로 위로 내리고, ⚡ 배지는 막대 위, '즉시 완공 가능!'은 그 위
        G0 = geo().b[k], by = G0 ? G0[1] + G0[2] * 0.36 - 12 - bh * 0.82 : y + w * 0.02;
      el.dataset.bh = bh.toFixed(2); el.dataset.lay = String(rt.mapLaid);
      // 3.3.0 woodani 요청: 비계가 건물 그림 전체 크기라 너무 복잡해 보여요. 건물 가운데에 절반쯤 크기로(아래쪽은 바닥 섬 위)
      const sw = w * 0.5, sx = x + (w - sw) / 2, sy = y + w * 0.3;
      el.innerHTML = (IMG180('fx_scaffold') ? `<image class="con-scaf" href="${IMG180('fx_scaffold')}" x="${sx.toFixed(1)}" y="${sy.toFixed(1)}" width="${sw.toFixed(1)}" height="${sw.toFixed(1)}"/>` : '') +
        (IMG('fx_lantern') ? `<image class="con-lan" href="${IMG('fx_lantern')}" x="${(sx + sw * 0.02).toFixed(1)}" y="${(sy + sw * 0.3).toFixed(1)}" width="${(sw * 0.3).toFixed(1)}" height="${(sw * 0.3).toFixed(1)}"/>` : '') +   // 2.2.0 야간 건설 때만 보이는 등불
        `<rect class="con-back" x="${(bx + bw * 0.06).toFixed(1)}" y="${(by + bh * 0.2).toFixed(1)}" width="${(bw * 0.88).toFixed(1)}" height="${(bh * 0.6).toFixed(1)}" rx="${(bh * 0.3).toFixed(1)}"/>` +
        `<rect class="con-fill" x="${(bx + bw * 0.06).toFixed(1)}" y="${(by + bh * 0.2).toFixed(1)}" width="0" height="${(bh * 0.6).toFixed(1)}" rx="${(bh * 0.3).toFixed(1)}" data-w="${(bw * 0.88).toFixed(1)}"/>` +
        (IMG('timer_bar') ? `<image class="con-bar" href="${IMG('timer_bar')}" x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}"/>` : '') +
        `<text class="con-t" x="${(x + w / 2).toFixed(1)}" y="${(by + bh * 0.66).toFixed(1)}" font-size="${(bh * 0.5).toFixed(1)}" stroke-width="${(bh * 0.12).toFixed(1)}"></text>` +
        `<g class="con-sp"><rect x="${(bx + bw / 2 - bh * 1.6).toFixed(1)}" y="${(by - bh * 0.75 - 1).toFixed(1)}" width="${(bh * 3.2).toFixed(1)}" height="${(bh * 0.95).toFixed(1)}" rx="${(bh * 0.47).toFixed(1)}"/>` +
        `<text x="${(bx + bw / 2).toFixed(1)}" y="${(by - bh * 0.08 - 1).toFixed(1)}" font-size="${(bh * 0.58).toFixed(1)}" textLength="${(bh * 2.6).toFixed(1)}" lengthAdjust="spacingAndGlyphs"></text></g>`;   // 2.3.0.2 휴대폰에서 글자가 배지 밖으로 넘쳐서 배지를 넓히고 글자를 배지 안에 맞춰요   // 2.3.0.1 빠르기 배지(막대 바로 아래)
    }
    if (!ui) {   // 2.3.1 막대와 글씨, 배지는 학생 위 층(#conUi)으로 옮겨요. 비계 그림은 건물에 그대로
      ui = document.createElementNS('http://www.w3.org/2000/svg', 'g'); ui.setAttribute('class', 'con con-ui'); ui.id = 'cu-' + k;
      const lay = $('#conUi'); if (lay) lay.appendChild(ui); else el.appendChild(ui);
      for (const c of ['.con-back', '.con-fill', '.con-bar', '.con-t', '.con-sp']) { const n = el.querySelector(c); if (n) ui.appendChild(n); }
    }
    conBeaver(ui, x, y, w);   // 2.3.5 비버는 학생 위 층(건물 누르는 칸에 가리지 않게)
    { const bv = ui.querySelector('.con-bv'); if (bv && ui.firstChild !== bv) ui.insertBefore(bv, ui.firstChild); }   // 3.2.3 막대와 배지가 비버 앞에 보여요(글씨가 가리지 않게)
    ui.classList.toggle('fast', conAdd() > 0);
    { const add = conAdd(), sp = ui.querySelector('.con-sp text'); el.classList.toggle('fast', add > 0); const st = `⚡+${add}%`; if (add > 0 && sp && sp.textContent !== st) sp.textContent = st; }
    g.classList.add('is-con'); ffbAt(k, Number(el.dataset.bh) || 0, conAdd() > 0);
    const f = ui.querySelector('.con-fill'); if (f) f.setAttribute('width', (Number(f.dataset.w) * pr).toFixed(1));
    const t = ui.querySelector('.con-t'), tx = hm(left); if (t && t.textContent !== tx) t.textContent = tx;
  }
  // 3.2.3 '즉시 완공 가능!' 배지 자리: 공사 중이면 이름판 위 막대(와 ⚡ 배지) 위로 올려요
  function ffbAt(k, bh, fast) {
    const b = document.querySelector('#pq-' + k + ' .ffb'); if (!b) return;
    const ty = !bh ? -20 : fast ? -21.5 - bh * 1.57 - 2 : -20.5 - bh * 0.62, tr = `translate(-38 ${ty.toFixed(1)})`;
    if (b.getAttribute('transform') !== tr) b.setAttribute('transform', tr);
  }
  // 2.3.5 비버 선생님이 공사장에서 망치질해요(초등학교부터). 그림 1, 2를 0.35초마다 번갈아, 가끔 3(먼지)
  const BV_LINES = ['뚝딱뚝딱! 튼튼하게 짓는 중이에요', '못 하나도 꼼꼼하게 박아요', '조금만 기다려 주세요, 금방 끝나요', '연수를 받으면 더 빨리 지을 수 있어요'];
  function conBeaver(el, x, y, w) {
    const has = xtHere('fix') && FSI('fix_beaver_1') && FSI('fix_beaver_2');
    let bv = el.querySelector('.con-bv');
    if (!has) { if (bv) bv.remove(); return; }
    if (bv) return;
    const s = Math.min(w, 110) * 0.44, bx = x + w * 0.8 - s / 2, by = y + w * 0.8 - s;
    const im = (k, c) => FSI(k) ? `<image class="${c}" href="${FSI(k)}" x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}"/>` : '';
    bv = document.createElementNS('http://www.w3.org/2000/svg', 'g'); bv.setAttribute('class', 'con-bv');
    bv.setAttribute('role', 'button'); bv.setAttribute('aria-label', XT.fix.name);
    bv.innerHTML = `<rect class="bv-hit" x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" fill="transparent"/>` +
      im('fix_beaver_1', 'bv1') + im('fix_beaver_2', 'bv2') + (FSI('fix_beaver_3') ? im('fix_beaver_3', 'bv3') : '') +
      (FSI('fix_spark') ? `<image class="bv-sp" href="${FSI('fix_spark')}" x="${(bx - s * 0.18).toFixed(1)}" y="${(by + s * 0.1).toFixed(1)}" width="${(s * 0.42).toFixed(1)}" height="${(s * 0.42).toFixed(1)}"/>` : '') +
      (FSI('fix_dust') ? `<image class="bv-du" href="${FSI('fix_dust')}" x="${(bx - s * 0.1).toFixed(1)}" y="${(by + s * 0.6).toFixed(1)}" width="${(s * 0.6).toFixed(1)}" height="${(s * 0.45).toFixed(1)}"/>` : '');
    if (!FSI('fix_beaver_3')) bv.classList.add('no3');
    bv.addEventListener('click', e => { e.stopPropagation(); rt.bvN = ((rt.bvN || 0) + 1) % BV_LINES.length; sfx('tap'); toast(`${XT.fix.name}: ${BV_LINES[rt.bvN]}`); });
    bv.addEventListener('pointerdown', e => e.stopPropagation());
    el.appendChild(bv);
  }
  // 건물 창의 공사 칸: 남은 시간, 즉시 완공(하루 한 번), 단축권 자동 사용(일괄), 숲의 정수로 즉시 완료, 골라서 쓰기, 광고
  function conSheet() {
    const k = rt.sheetKey, on = conOn(k), box = $('#sheetCon');
    box.hidden = !on;
    $('#sheetBuy').hidden = on;
    if (!on) { rt.conArm = false; rt.conPick = ''; return; }
    const b = S.bd[k], left = conLeft(k), pr = Math.min(1, Math.max(0, 1 - left * 1000 / Math.max(1, b.e - b.s)));
    setH($('#conClock'), IMG('ic_clock') ? `<img src="${IMG('ic_clock')}" alt="">` : '⏰');
    setT($('#conTx'), `Lv.${b.L} 공사 중, ${hm(left)} 남았어요`);
    $('#conFill').style.width = (pr * 100).toFixed(1) + '%';
    const p = tkPlan(left);
    $('#conAll').setAttribute('aria-disabled', p.n ? 'false' : 'true');
    setT($('#conAllLbl'), rt.conArm && p.n ? '이대로 쓸게요' : '단축권 자동 사용');   // 2.3.0 이름(woodani)
    $('#conFree').hidden = !(S.tier >= 1 && conFreeLeft(k));
    if (!$('#conFree').hidden) { setT($('#conFreeTx'), `즉시 완공 (오늘 ${ffLeft()}번 남음)`); setT($('#conFree .n'), ffLeft()); }   // 3.0.0 학교 전체 하루 3번
    { const c = conEssCost(left); setH($('#conEssCost'), `${ESS_ICON()}<b>${c}</b>`); $('#conEss').setAttribute('aria-disabled', S.ess >= c ? 'false' : 'true'); }
    $('#conNo').hidden = !(rt.conArm && p.n);
    setT($('#conPlan'), !p.n ? '시간 단축권이 없어요. 광고를 보거나 문방구에서 살 수 있어요'
      : p.left ? `${tkPlanText(p)}을 써서 ${hm(p.cut)} 줄이고 ${hm(p.left)} 남아요` : left < 60 ? `${hm(left)}면 끝나요. 단축권은 긴 공사에 아껴 두세요` : `${tkPlanText(p)}을 써서 바로 끝나요`);
    const arm = rt.conArm && p.n;   // 2.1.2 바로 줄이기를 누르면 쓸 권을 표시해요
    setH($('#conTks'), TK.slice().reverse().map(t => `<button type="button" class="con-tk${rt.conPick === t.k ? ' armed' : ''}${arm && p.use[t.k] ? ' plan' : ''}" data-tk="${t.k}" aria-disabled="${S.tk[t.k] > 0 ? 'false' : 'true'}">${IMG('ticket_' + t.k) ? `<img src="${IMG('ticket_' + t.k)}" alt="">` : '⌛'}<span>${t.name}</span><b>${fmt(S.tk[t.k])}장</b>${arm && p.use[t.k] ? `<em class="use">−${p.use[t.k]}장</em>` : ''}</button>`).join(''));
    cbSheet();   // 2.1.1 건설 가속
    const al = tkAdLeft();
    $('#conAd').setAttribute('aria-disabled', al > 0 ? 'false' : 'true');
    setT($('#conAd'), al > 0 ? `광고 보고 5분권 ${TKAD.n}장 받기 (오늘 ${al}번 남음)` : '오늘 광고 단축권을 다 받았어요');
  }

