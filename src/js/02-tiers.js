  /* ---------- 오래 하는 구조: 종업식과 졸업식, 명예 교장실, 전학생, 출석부, 보충수업 ---------- */
  const GRAD_MIN = 4;   // 대도시 학교가 되어야 종업식이나 졸업식을 열 수 있어요
  const startBudget = L => L < 1 ? 20 : 300 * Math.pow(5, L - 1);
  const NEWCOMERS = [
    { k: 'cat', name: '고양이', ga: '가' }, { k: 'dog', name: '강아지', ga: '가' }, { k: 'penguin', name: '펭귄', ga: '이' },
    { k: 'panda', name: '판다', ga: '가' }, { k: 'koala', name: '코알라', ga: '가' }, { k: 'otter', name: '수달', ga: '이' },
    // 새 전학생 6종: 중학교와 고등학교에서도 해마다 새 친구가 와요
    { k: 'hamster', name: '햄스터', ga: '가' }, { k: 'duck', name: '오리', ga: '가' }, { k: 'turtle', name: '거북', ga: '이' },
    { k: 'mole', name: '두더지', ga: '가' }, { k: 'frog', name: '개구리', ga: '가' }, { k: 'waterdeer', name: '고라니', ga: '가' },
    // 고등학교 전학생 3종(작업지시서 43): 2학년 종업식, 3학년 졸업식, 여유 하나
    { k: 'redpanda', name: '레서판다', ga: '가' }, { k: 'capybara', name: '카피바라', ga: '가' }, { k: 'kangaroo', name: '캥거루', ga: '가' },
    // 대학교 신입생 3종(설계안 2절, 작업지시서 54): 대학교 종업식과 졸업식에 한 명씩 와요
    { k: 'meerkat', name: '미어캣', ga: '이' }, { k: 'sloth', name: '나무늘보', ga: '가' }, { k: 'chinchilla', name: '친칠라', ga: '가' },
    { k: 'lemur', name: '여우원숭이', ga: '가' }, { k: 'armadillo', name: '아르마딜로', ga: '가' }, { k: 'quokka', name: '쿼카', ga: '가' }   // 대학원생
  ];
  const NEWCOMERS_PRE_UNI = 15;   // 고등학교까지 만날 수 있는 전학생 수. 대학교 신입생 3종은 대학교에 올라가야 와요
  const ncMax = () => S && S.tier >= GRAD_TIER ? NEWCOMERS.length : S && S.tier >= 4 ? NEWCOMERS_PRE_UNI + 3 : NEWCOMERS_PRE_UNI;   // 대학원생 3종은 대학원에서
  const NEWCOMERS_OLD = 6;   // 전의 전학생 수. 옛 저장의 전학생 채우기는 여기까지만 해요(이미 다 만난 학교는 다음 식부터 새 친구가 와요)
  const PERKS = {
    schol: { name: '동문회 장학금', desc: '졸업생들이 보내 주는 장학금으로 수업료가 올라요.',
      cost: L => Math.ceil(2 * Math.pow(1.45, L)), eff: L => multTx(Math.pow(1.3, L)),   // 10배 아래는 '+%' 꼴
      icon: '<svg viewBox="-7 -10 14 18" aria-hidden="true"><path d="M-4.6 -1 Q-4.9 5.4 0 7.4 Q4.9 5.4 4.6 -1 Z" class="c-nut"/><path d="M-5.8 -0.8 Q-5.8 -6.2 0 -6.6 Q5.8 -6.2 5.8 -0.8 Q0 0.8 -5.8 -0.8 Z" class="c-cap"/><path d="M-3.4 2.4 h6.8" class="s-string"/></svg>' },
    rep: { name: '소문난 졸업생', desc: '졸업생들이 학교 자랑을 해서 평판이 늘 높아요.',
      cost: L => Math.ceil(3 * Math.pow(1.5, L)), eff: L => `평판 +${5 * L}`,
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" class="c-can"/></svg>' },
    start: { name: '새 학기 준비물', desc: '종업식을 열 때마다 도토리를 선물받아요.',
      cost: L => Math.ceil(3 * Math.pow(2, L)), eff: L => L < 1 ? '선물 없음' : `수업료 ${30 * L}분치 선물`,   // 실제 선물(수업료 30분 × 단계)
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="7" width="14" height="14" rx="4" class="f-bag1"/><path d="M9 7.5V6a3 3 0 0 1 6 0v1.5" class="s-frame"/><rect x="8" y="12" width="8" height="5" rx="1.5" class="f-bag0"/></svg>' },
    drop: { name: '참나무 거름', desc: '참나무가 튼튼해져서 떨어지는 도토리가 커져요.',
      cost: L => Math.ceil(2 * Math.pow(1.6, L)), eff: L => `주운 도토리 +${50 * L}%`,
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c4.5 3 6.5 7.5 4.3 12.2C15 18 12.8 19.4 12 21c-.8-1.6-3-3-4.3-5.8C5.5 10.5 7.5 6 12 3z" class="c-leaf2"/><path d="M12 7v13" class="s-vein"/></svg>' },
    // 이름만 바꿈(야간 자율학습과 헷갈리지 않게). 주석이 설명과 최고 레벨까지 덮어서 Lv.NaN, 자리 비운 보상이 안 쌓이던 것 고침
    night: { name: '부엉이 밤샘 수업', desc: '학교를 비운 동안 도토리가 더 오래 쌓여요.', max: 4,
      cost: L => Math.ceil(3 * Math.pow(2, L)), eff: L => `최대 ${CFG.offlineCapH + 4 * L}시간까지 쌓여요`,
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 3a9 9 0 1 0 5.5 13.6A7.4 7.4 0 0 1 15.5 3z" class="c-moon"/></svg>' }
  };
  // 장학재단: 졸업할 때 받는 기금으로 고쳐요. 학교급이 바뀌어도 효과가 계속 남아요
  // 저장 칸 상한. lv: 시설과 선생님 레벨, perk: 명예 교장실 강화(1.3^60이어도 유한해요), fperk: 장학재단 강화(2^40)
  // count: 수료증, 기금, 황금 도토리, 기록 횟수 같은 셈, big: 도토리처럼 아주 커질 수 있는 값
  const SAVE_CAP = { lv: 999, tea: 99, perk: 60, fperk: 40, count: 1e12, big: 1e30, acorn: 1e60 };   // 시설과 가구 레벨 99 → 999, 도토리 칸(가진 것, 번 것, 받을 것, 시설 값)은 10^30 → 10^60(acorn). 대학원을 되풀이하면 시설 상한(40 + 5 × 학년)이 100을 넘고 그 값이 10^30을 넘어서, 다시 켤 때 레벨과 도토리가 깎였어요. 선생님(tea)과 그 밖의 칸(big)은 그대로
  // 저장을 읽을 때 숫자 칸을 바로잡는 도우미 두 가지(예전에는 sanitize 함수마다 num이라는 같은 이름으로 따로 있었어요. 인자 뜻이 달라 이름을 나눴어요)
  // numFb(v, min, fb, max): min보다 작거나 숫자가 아니면 fb(대신 쓸 값), 크면 max로 잘라요. 상한 없던 숫자 칸에도 상한을 둬요(셈은 SAVE_CAP.count)
  //   numIn(v, lo, hi): lo와 hi 사이로 잘라요. 숫자가 아니면 lo
  const numFb = (v, min, fb, max = SAVE_CAP.big) => (typeof v === 'number' && isFinite(v) && v >= min) ? Math.min(v, max) : fb;
  const numIn = (v, lo, hi) => typeof v === 'number' && isFinite(v) ? Math.max(lo, Math.min(hi, v)) : lo;
  const FPERKS = {
    schol: { name: '재단 장학금', desc: '레벨마다 수업료 +100%씩 늘어요(곱해져요).',
      cost: L => Math.pow(2, L), eff: L => multTx(Math.pow(2, L)),
      icon: '<svg viewBox="-8 -8 16 16" aria-hidden="true"><circle r="7" class="c-fund"/><circle r="5" class="s-fund"/><path d="M0 3.2 C-2.6 1.6 -2.6 -1.8 0 -3.6 C2.6 -1.8 2.6 1.6 0 3.2 Z" class="c-leaf2"/></svg>' },
    rep: { name: '재단 이사회', desc: '새 학기에도 평판이 높게 시작해요.',
      cost: L => Math.ceil(Math.pow(1.6, L)), eff: L => `평판 +${10 * L}`,
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" class="c-fund"/></svg>' },
    dip: { name: '학급 문집', desc: '종업식마다 수료증이 늘어요.',
      cost: L => Math.ceil(2 * Math.pow(1.6, L)), eff: L => `수료증 +${25 * L}%`,
      icon: '<svg viewBox="-8.5 -8 17 17" aria-hidden="true"><rect x="-6" y="-7" width="12" height="14" rx="1.5" class="c-roof2"/><rect x="-4" y="-4.6" width="8" height="5.6" rx="1" class="c-dip"/><path d="M-3 3.4 h6" class="s-fund"/></svg>' }
  };
  const FUND = '<circle r="7" class="c-fund"/><circle r="5" class="s-fund"/><path d="M0 3.2 C-2.6 1.6 -2.6 -1.8 0 -3.6 C2.6 -1.8 2.6 1.6 0 3.2 Z" class="c-leaf2"/>';
  const fundIcon = () => `<svg viewBox="-8 -8 16 16" aria-hidden="true">${FUND}</svg>`;
  // 참나무: 누를 때마다 달린 도토리가 하나씩 떨어져요. 다 떨어지면 12초마다 하나씩 다시 열려요. 땅에는 6개까지
  const OAK = { max: 8, regen: 12, ground: 6 };
  // 까치 핫딜: 2분 반짝 열리는 광고 보상. 하루 8번, 1장을 마치면 열려요
  // 핫딜은 광고 한 번 값(상점 광고 황금 도토리 5개 = 수업료 30분 건너뛰기, 특식 데이 약 17분)보다 커야 해요
  // 특식 데이는 30분, 반값 공사와 연수는 아끼는 도토리가 수업료 30분치(minSave초)보다 많을 때만 나와요
  const DEAL = { perDay: 8, life: 120, gap: [150, 270], first: 45, retry: 30, feastMin: 30, minSave: 1800 };   // 특식 데이 20분 → 30분(광고 한 편은 30분치라는 원칙에 맞춤)
  const DEAL_LINE = {
    classroom: '숲속 장터에 참나무 목재가 싸게 들어왔대요!',
    cafeteria: '장터에서 도토리 밀가루를 반값에 판대요!',
    library: '헌책방에서 그림책을 한 아름 싸게 판대요!',
    playground: '장터에 놀이 기구 반짝 세일이 열렸대요!',
    science: '장터에 실험 도구 반짝 세일이 열렸대요!',
    store: '도매 시장에서 과자 상자를 반값에 넘긴대요!',
    dorm: '가구 공방에서 2층 침대를 반값에 판대요!',
    union: '숲속 극장에서 무대 장식을 반값에 넘긴대요!',
    teaNew: '숲속 일자리 센터가 소개비를 반만 받는대요!',
    teaUp: '연수원 얼리버드 할인이 열렸대요!'
  };
  // 출석부: m은 수업료 몇 분치, d는 수료증 장수
  const ATT = [{ m: 10 }, { m: 15 }, { d: 1 }, { m: 20 }, { m: 30 }, { d: 2 }, { d: 3 }];
  const BOOST = { min: 30, perDay: 5, adSec: 5 };
  /* 광고 볼 이유 (프로젝트 문서 ' 설계안 2 (황금 도토리와 광고)' 3절 1~3번). 숫자는 본부 제안
     1. 고등학교부터 '자리 비운 동안 두 배'와 보충수업 광고에 보상 고르기(도토리, 공사 30분 단축, 숲의 정수 10)
     2. 한 판 더 광고(하루 한 번씩): 축제 부스, 대축제 불꽃놀이, 교환학생 학교 안내, 진로 상담
     3. 오늘의 광고 도장: 어느 광고든 끝까지 보면 하나(하루 6개). 3개 숲의 정수 10과 5분권 2장, 6개 숲의 정수 20과 30분권 1장 */
  const ADX = { tier: 3, conMin: 30, ess: 10, max: 6, st: [[3, 10, 'm5', 2], [6, 20, 'm30', 1]] };
  const freshAdx = () => ({ day: '', n: 0, got: [0, 0], fv: 0, fw: 0, xg: 0, cs: 0, all: 0 });   // all: 오늘 본 광고 수(도장 상한 없이, 관리자 지표용). 광고 한 편 = 30분(보충수업, 단축권, 체험학습이 같게)
  // 보충수업 버튼은 늘 떠 있지 않고 까치 핫딜처럼 가끔 1분 반 동안만 나타나요
  const BOOSTW = { life: 90, gap: [240, 420], first: 90 };
  const dropIntervalFor = L => L < 1 ? Infinity : Math.max(8, 24 / (1 + 0.15 * (L - 1)));

  const FAC = {
    classroom: { name: '교실', rep: 1, view: '104 0 152 140',
      desc: '넓힐수록 학생이 더 들어와요.',
      cost: L => 20 * Math.pow(1.7, L - 1),
      eff: L => `정원 ${CFG.cap0 + CFG.capStep * L}명` },
    cafeteria: { name: '급식실', rep: 1, view: '238 124 94 120',
      desc: '급식이 맛있으면 수업료가 올라요.',
      cost: L => 60 * Math.pow(1.8, L),
      eff: L => L < 1 ? '아직 없어요' : `수업료 +${20 * L}%` },
    library: { name: '도서관', rep: 3, view: '24 104 102 144',
      desc: '책을 읽을수록 학교 평판이 쌓여요.',
      cost: L => (S && S.tier <= 1 ? 60 : 100) * Math.pow(1.8, L),   // 2026-11-22 woodani: 유치원과 초등은 급식실과 같은 60(초등 4~6학년 도서관 Lv.31~40이 그 학년 시간의 92%였어요)
      eff: L => L < 1 ? '아직 없어요' : `평판 +${3 * L}` },
    // 유치원에서는 미끄럼틀 놀이터, 초등학교부터는 운동장
    playground: { get name() { return S && S.tier >= 1 ? '운동장' : '놀이터'; }, rep: 1, view: '40 280 252 112',
      desc: '옆 참나무에서 떨어진 도토리를 눌러서 주워요.',
      cost: L => 50 * Math.pow(1.8, L),
      eff: L => L < 1 ? '아직 없어요' : `${Math.round(dropIntervalFor(L))}초마다 도토리` },
    // 초등학교부터 생기는 새 시설
    science: { name: '과학실', rep: 1, tier: 1, view: '256 4 88 116',
      desc: '실험 발표회를 열면 수료증이 늘어요.',
      cost: L => 500 * Math.pow(1.8, L),   // 2배씩이라 Lv.15가 도서관의 24배였어요. 다른 건물처럼 1.8배
      eff: L => L < 1 ? '아직 없어요' : `수료증 +${3 * L}%, 평판 +${L}` },
    // 중학교부터 생기는 새 시설. 값과 효과는 균형 제안서에서 정해요
    store: { name: '매점', rep: 1, tier: 2, per: 15, view: '0 0 100 100',
      desc: '간식과 음료를 팔아요. 수업료가 올라요.',
      cost: L => 60 * Math.pow(1.8, L),   // 균형 제안서 제안값: 처음 짓기가 입학 뒤 30분쯤
      eff: L => L < 1 ? '아직 없어요' : `수업료 +${FAC.store.per * L}%` },
    // 고등학교부터 생기는 새 시설(설계안 3절). 효과는 매점과 같은 수업료 +15%/Lv, 값은 균형 제안서에서 봇으로 다시 재요
    dorm: { name: '기숙사', rep: 1, tier: 3, per: 15, view: '0 0 100 100',
      desc: '밤에는 야간 자율학습을 켤 수 있어요.',
      cost: L => 60 * Math.pow(1.8, L),
      eff: L => L < 1 ? '아직 없어요' : `수업료 +${FAC.dorm.per * L}%` },
    // 대학교부터 생기는 새 시설(설계안 4절). 효과는 매점, 기숙사와 같은 수업료 +15%/Lv. 값 곡선은 기숙사와 같게 둔 제안값이고 균형 제안서에서 다시 재요
    union: { name: '학생회관', rep: 1, tier: 4, per: 15, view: '0 0 100 100',
      desc: '동아리와 학생회가 모여요. 수업료가 올라요.',
      cost: L => 60 * Math.pow(1.8, L),
      eff: L => L < 1 ? '아직 없어요' : `수업료 +${FAC.union.per * L}%` },
    // 대학원 연구 구역: 값과 공사 시간은 대학교 최대 레벨(Lv.35)쯤부터(lvOff). 효과는 학생회관과 같게
    institute: { name: '연구소', rep: 1, tier: 5, per: 15, lvOff: 35, view: '0 0 100 100',
      desc: '연구가 쌓일수록 수업료가 올라요. 연구 투자와 연구 트리를 여기서 해요.',
      cost: L => 60 * Math.pow(1.8, L),
      eff: L => L < 1 ? '아직 없어요' : `수업료 +${FAC.institute.per * L}%` },
    gradhall: { name: '대학원 연구동', rep: 1, tier: 5, per: 15, lvOff: 35, view: '0 0 100 100',
      desc: '세미나실이 있는 연구동이에요. 수업료가 올라요.',
      cost: L => 60 * Math.pow(1.8, L),
      eff: L => L < 1 ? '아직 없어요' : `수업료 +${FAC.gradhall.per * L}%` }
  };
  // 지금 학교급에서 쓸 수 있는 시설
  const facKeys = () => Object.keys(FAC).filter(k => (FAC[k].tier || 0) <= S.tier);

  // 고슴도치 교감 선생님의 가시: 머리 뒤를 빙 두르는 톱니 모양
  function spikePath(cx, cy, r1, r2, n, a0, a1) {
    const pts = [];
    for (let i = 0; i <= n * 2; i++) {
      const a = (a0 + (a1 - a0) * i / (n * 2)) * Math.PI / 180, r = i % 2 ? r2 : r1;
      pts.push((cx + Math.cos(a) * r).toFixed(1) + ' ' + (cy + Math.sin(a) * r).toFixed(1));
    }
    return 'M' + pts.join(' L') + ' Z';
  }
  const HEDGEHOG =
    `<path d="${spikePath(0, -1, 14, 21, 11, 150, 390)}" class="f-hedge"/>` +
    '<ellipse cx="0" cy="17" rx="12" ry="7.5" class="f-hedge"/><ellipse cx="0" cy="17.5" rx="7.5" ry="6" class="f-hedge-face"/>' +
    '<path d="M-1.6 10.5 h3.2 l1.2 6 l-2.8 3.2 l-2.8 -3.2 z" class="f-tie"/>' +
    '<circle cx="-9.5" cy="-9" r="3.4" class="f-hedge-face"/><circle cx="9.5" cy="-9" r="3.4" class="f-hedge-face"/>' +
    '<circle cx="-9.5" cy="-9" r="1.6" class="f-pink"/><circle cx="9.5" cy="-9" r="1.6" class="f-pink"/>' +
    '<ellipse cx="0" cy="0" rx="12" ry="11" class="f-hedge-face"/>' +
    '<circle cx="-4.5" cy="-1.5" r="1.7" class="f-eye"/><circle cx="4.5" cy="-1.5" r="1.7" class="f-eye"/>' +
    '<circle cx="-4.5" cy="-1.5" r="4" class="s-glasses"/><circle cx="4.5" cy="-1.5" r="4" class="s-glasses"/><path d="M-0.6 -1.8 Q0 -2.6 0.6 -1.8" class="s-glasses"/>' +
    '<ellipse cx="0" cy="3.6" rx="2.2" ry="1.6" class="f-eye"/><path d="M-2.2 6.4 Q0 8.2 2.2 6.4" class="s-mouth"/>' +
    '<ellipse cx="-8" cy="3.6" rx="2" ry="1.3" class="f-cheek"/><ellipse cx="8" cy="3.6" rx="2" ry="1.3" class="f-cheek"/>' +
    '<rect x="9" y="9" width="9" height="12" rx="1.5" class="c-door"/><rect x="10.5" y="11.5" width="6" height="8" rx="0.8" class="c-page"/><rect x="11.5" y="8" width="4" height="2.6" rx="1" class="f-whistle"/>';

  // 까치: 반가운 소식을 물어 오는 새. 부리에 빨간 핫딜 꼬리표를 물고 있어요
  const MAGPIE = '<g transform="translate(-4 2) scale(.92)">' +
    '<path d="M-7 5 L-22 17 L-19.5 19.5 L-4 9 Z" class="f-mag"/><path d="M-9 4 L-21 12 L-20 14.5 L-7 7 Z" class="f-magb"/>' +
    '<ellipse cx="1" cy="4" rx="11" ry="9" class="f-mag"/><ellipse cx="4" cy="7.5" rx="6.5" ry="5.2" class="f-magw"/>' +
    '<path d="M-8 -1 Q1 -5 8 1 Q3 9 -8 7 Z" class="f-magb"/><path d="M-4 1.5 Q1 -0.5 5.5 2" class="s-magw"/>' +
    '<circle cx="9" cy="-7" r="7.2" class="f-mag"/><circle cx="11" cy="-8.4" r="2" class="f-magw"/><circle cx="11.5" cy="-8.4" r="1.1" class="f-eye"/>' +
    '<path d="M15.4 -7.6 L22 -6 L15.4 -4.4 Z" class="f-magbeak"/><path d="M3 12.5 v4.5 M7 12.5 v4.5" class="s-magleg"/>' +
    '<g transform="translate(19.5 -5.6) rotate(18)"><rect x="0" y="0" width="11" height="7.6" rx="1.6" class="c-seal"/><circle cx="2.2" cy="3.8" r="1.1" class="c-dip"/><path d="M4.6 2.4 h4.4 M4.6 5.2 h3" class="s-tagline"/></g></g>';
  // 선생님(고슴도치 교감 선생님 포함)은 그림(PNG)으로
  const CHR_AR = { chr_lemur: 0.68, chr_armadillo: 0.65, chr_quokka: 0.61, tea_pelican: 0.61, tea_beaver: 0.92, chr_bear: 0.69, chr_cat: 0.75, chr_chick: 0.67, chr_dog: 0.84, chr_fox: 0.73, chr_koala: 0.99, chr_otter: 0.96, chr_panda: 0.68, chr_penguin: 0.64, chr_rabbit: 0.65, chr_raccoon: 0.88, chr_hamster: 0.66, chr_duck: 0.58, chr_turtle: 0.6, chr_mole: 0.63, chr_frog: 0.63, chr_waterdeer: 0.59, chr_redpanda: 0.68, chr_capybara: 0.6, chr_kangaroo: 0.58, chr_meerkat: 0.68, chr_sloth: 0.68, chr_chinchilla: 0.68, tea_crane: 0.75, tea_badger: 0.74, tea_bear: 0.61, tea_hedgehog: 0.75, tea_owl: 0.64, tea_squirrel: 0.83, tea_dietitian: 0.64, tea_librarian: 0.58, tea_swan: 0.7, tea_peacock: 0.77, tea_alpaca: 0.52, tea_elephant: 1 };
  // 5.0.2 그림 묶음(window.FS_IMG…)을 찾는 차례는 여기 한 곳에서만 정해요. 예전에는 FSI, IMG, has170이 저마다 긴 목록을 가졌고 서로 조금 달랐어요(FSI에는 174와 249가 빠져 있었지만 FSI로 찾는 학생, 선생님, 고치기 그림은 그 묶음에 없어 결과는 같아요)
  const IMG_SETS = ['FS_IMG', 'FS_IMG400', 'FS_IMG430', 'FS_IMG431', 'FS_IMG171', 'FS_IMG174', 'FS_IMG200', 'FS_IMG213', 'FS_IMG220', 'FS_IMG230', 'FS_IMG231', 'FS_IMG235', 'FS_IMG300', 'FS_IMG310', 'FS_IMG311', 'FS_IMG312', 'FS_IMG320', 'FS_IMG249'];
  const HAS170_SETS = ['FS_IMG170', 'FS_IMG400', 'FS_IMG430', 'FS_IMG431', 'FS_IMG200', 'FS_IMG300', 'FS_IMG249'];   // 학교급별 건물 모습, 테마 지도, 고급 그림이 있는지 볼 때 찾는 묶음
  const imgFind = (k, sets) => { for (let i = 0; i < sets.length; i++) { const B = window[sets[i]]; if (B && B[k]) return B[k]; } return ''; };
  const IMG = k => imgFind(k, IMG_SETS), FSI = IMG;
  const teaPic = k => { const h = Math.min(44, 46 / CHR_AR['tea_' + k]), w = h * CHR_AR['tea_' + k]; return `<image href="${FSI('tea_' + k)}" x="${(-w / 2).toFixed(1)}" y="${(22 - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}"/>`; };
  const AV = {
    hedgehog: HEDGEHOG,
    squirrel:'<path d="M8 14 C 22 12 24 -6 14 -12 C 6 -16 2 -8 8 -4 C 12 -1 10 6 4 8 Z" class="f-squirrel"/><path d="M11 -9 C 16 -10 18 -4 14 -2" class="s-tail"/><ellipse cx="-2" cy="12" rx="9" ry="8" class="f-squirrel"/><ellipse cx="-2" cy="13" rx="5.5" ry="5.5" class="f-squirrel-light"/><path d="M-12 -10 L-10 -19 L-5 -12 Z" class="f-squirrel"/><path d="M8 -10 L6 -19 L1 -12 Z" class="f-squirrel"/><circle cx="-2" cy="-3" r="11" class="f-squirrel"/><ellipse cx="-2" cy="1" rx="6.5" ry="5" class="f-squirrel-light"/><circle cx="-6" cy="-5" r="1.6" class="f-eye"/><circle cx="2" cy="-5" r="1.6" class="f-eye"/><ellipse cx="-2" cy="-0.6" rx="1.6" ry="1.1" class="f-eye"/><ellipse cx="-9" cy="0.4" rx="2" ry="1.3" class="f-cheek"/><ellipse cx="5" cy="0.4" rx="2" ry="1.3" class="f-cheek"/><rect x="-17" y="2" width="3" height="14" rx="1" transform="rotate(-25 -15.5 9)" class="f-pencil"/>',
    owl: '<path d="M-11 -13 L-8 -21 L-4 -15 Z" class="f-owl"/><path d="M11 -13 L8 -21 L4 -15 Z" class="f-owl"/><ellipse cx="0" cy="2" rx="15" ry="19" class="f-owl"/><ellipse cx="0" cy="9" rx="9" ry="10" class="f-owl-light"/><path d="M-5 6 q2 2 4 0 M1 6 q2 2 4 0 M-3 11 q2 2 4 0" class="s-feather"/><path d="M-15 0 Q -20 10 -12 16 M15 0 Q 20 10 12 16" class="s-wing"/><circle cx="-6" cy="-6" r="6" class="f-owl-eye"/><circle cx="6" cy="-6" r="6" class="f-owl-eye"/><circle cx="-6" cy="-6" r="6" class="s-glasses"/><circle cx="6" cy="-6" r="6" class="s-glasses"/><path d="M-1 -6.5 Q0 -7.5 1 -6.5" class="s-glasses"/><circle cx="-6" cy="-5.5" r="2.6" class="f-eye"/><circle cx="6" cy="-5.5" r="2.6" class="f-eye"/><path d="M-2 -1 L2 -1 L0 3 Z" class="f-beak"/><path d="M-5 20 v2.4 M-3 20 v2.4 M3 20 v2.4 M5 20 v2.4" class="s-feet"/>',
    bear: '<circle cx="-11" cy="-12" r="5.5" class="f-bear"/><circle cx="11" cy="-12" r="5.5" class="f-bear"/><circle cx="-11" cy="-12" r="2.8" class="f-bear-light"/><circle cx="11" cy="-12" r="2.8" class="f-bear-light"/><ellipse cx="0" cy="16" rx="13" ry="8" class="f-bear"/><circle cx="0" cy="-2" r="14" class="f-bear"/><ellipse cx="0" cy="4" rx="7" ry="5.4" class="f-bear-light"/><ellipse cx="0" cy="1.6" rx="2.6" ry="1.8" class="f-eye"/><path d="M-2 5.6 Q0 7.6 2 5.6" class="s-mouth"/><circle cx="-5.5" cy="-4" r="1.7" class="f-eye"/><circle cx="5.5" cy="-4" r="1.7" class="f-eye"/><path d="M-6 10 Q0 15 6 10" class="s-string"/><rect x="3" y="11" width="7" height="4" rx="2" class="f-whistle"/>'
  };
  // 새 선생님 두 분(그림이 없으면 그림 문자)
  AV.dietitian = '<text x="0" y="10" text-anchor="middle" font-size="28">🐑</text>'; AV.librarian = '<text x="0" y="10" text-anchor="middle" font-size="28">🦌</text>';
  AV.swan = '<text x="0" y="10" text-anchor="middle" font-size="28">🦢</text>'; AV.peacock = '<text x="0" y="10" text-anchor="middle" font-size="28">🦚</text>'; AV.alpaca = '<text x="0" y="10" text-anchor="middle" font-size="28">🦙</text>'; AV.badger = '<text x="0" y="10" text-anchor="middle" font-size="28">🦡</text>'; AV.beaver = '<text x="0" y="10" text-anchor="middle" font-size="28">🦫</text>';   // 오소리
  AV.elephant = '<text x="0" y="10" text-anchor="middle" font-size="28">🐘</text>'; AV.crane = '<text x="0" y="10" text-anchor="middle" font-size="28">🦩</text>';   // 코끼리 선생님
  AV.pelican = '<text x="0" y="10" text-anchor="middle" font-size="28">🐦</text>';   // 펠리컨 지도교수님
  for (const k of ['hedgehog', 'squirrel', 'owl', 'bear', 'dietitian', 'librarian', 'swan', 'peacock', 'alpaca', 'badger', 'beaver', 'elephant', 'crane', 'pelican']) if (FSI('tea_' + k)) AV[k] = teaPic(k);

  const TEA = {   // 탭 순서: 다람쥐, 곰, 부엉이. 저장은 열쇠라 그대로
    squirrel: { name: '다람쥐 선생님', subject: '수학',
      desc: '도토리 셈이 빠른 수학 선생님이에요.',
      cost: L => L < 1 ? 0 : 80 * Math.pow(1.85, L - 1),
      eff: L => `수업료 +${15 * L}%` },
    bear: { name: '곰 선생님', subject: '체육',
      desc: '힘센 체육 선생님이에요.',
      cost: L => L < 1 ? 600 : 400 * Math.pow(1.85, L - 1),
      eff: L => L < 1 ? '주운 도토리 보너스 없음' : `주운 도토리 +${15 * L}%` },
    owl: { name: '부엉이 선생님', subject: '과학', max: 5,
      desc: '밤에도 수업하는 과학 선생님이에요.',
      cost: L => L < 1 ? 300 : 250 * Math.pow(1.85, L - 1),
      eff: L => `자리 비운 동안 수업료의 ${Math.min(100, 30 + 15 * L)}%` }
  };

  // 코드로 그린 도토리 대신 그림(ic_acorn). 그림이 없으면 예전 도형
  const IMG0 = k => (window.FS_IMG && window.FS_IMG[k]) || '';
  const ACORN = IMG0('ic_acorn') ? `<image href="${IMG0('ic_acorn')}" x="-7" y="-9" width="14" height="14"/>` : '<path d="M-4.6 -1 Q-4.9 5.4 0 7.4 Q4.9 5.4 4.6 -1 Z" class="c-nut"/><ellipse cx="-1.8" cy="2" rx="0.9" ry="2.1" class="c-shine"/><path d="M-5.8 -0.8 Q-5.8 -6.2 0 -6.6 Q5.8 -6.2 5.8 -0.8 Q0 0.8 -5.8 -0.8 Z" class="c-cap"/><path d="M-4 -3.2 H4 M-2.8 -5 H2.8" class="s-capline"/><path d="M0 -6.6 L0.9 -9.2" class="s-stem"/>';
  const acornIcon = () => `<svg viewBox="-7 -10 14 18" aria-hidden="true">${ACORN}</svg>`;
  // 수료증: 빨간 띠를 두른 두루마리
  const DIP = IMG0('ic_cert') ? `<image href="${IMG0('ic_cert')}" x="-8.5" y="-8.5" width="17" height="17"/>` : '<rect x="-7" y="-3.6" width="14" height="7.2" rx="1.4" class="c-dip"/><rect x="-8" y="-4.2" width="2.6" height="8.4" rx="1.3" class="c-dip-edge"/><rect x="5.4" y="-4.2" width="2.6" height="8.4" rx="1.3" class="c-dip-edge"/><rect x="-1.4" y="-3.6" width="2.8" height="7.2" class="c-seal"/><path d="M-1.4 3.2 l-1.6 4 l1.8 -0.9 l0.8 1.5 l0.6 -4.6 z M1.4 3.2 l1.6 4 l-1.8 -0.9 l-0.8 1.5 l-0.6 -4.6 z" class="c-seal"/>';
  const dipIcon = () => `<svg viewBox="-8.5 -8 17 17" aria-hidden="true">${DIP}</svg>`;
  const rewardIcon = kind => kind === 'dip' ? dipIcon() : acornIcon();
  const rewardText = (kind, v) => kind === 'dip' ? `수료증 ${v}장` : `도토리 ${fmt(v)}개`;
  const CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

