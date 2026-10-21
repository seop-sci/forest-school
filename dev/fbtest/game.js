
(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const SAVE_KEY = 'forest-school-v1';
  // 토스 미니앱 판이면 toss/src/bridge.js가 window.AIT에 광고, 저장소, 게임센터 기능을 담아 둬요
  const AIT = window.AIT || null;
  const motionMQ = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  /* ---------- 게임 수치 ---------- */
  const CFG = {
    base: 0.25,          // 학생 한 명이 1초에 내는 수업료(도토리)
    cap0: 6, capStep: 4, // 정원 = 6 + 4 x 교실 레벨
    enroll: 0.5,         // 1초에 들어오는 새 학생
    gradeMult: 1.3,      // 동네가 한 단계 자랄 때마다 수업료 배수
    offlineCapH: 8,      // 자리 비운 동안 최대 8시간까지 쌓임
    awayModalSec: 30,    // 30초 넘게 비우면 보상 창
    maxKids: 16, maxDrops: 3, dropLife: 15000,
    // 동네 5단계: 평판이 오르면 학교 둘레가 분교에서 대도시까지 자라요. name은 칠판 배지, title은 상장
    grades: [
      { name: '분교', title: '숲속 분교', rep: 0 },
      { name: '마을', title: '마을 학교', rep: 15, line: '학교 옆에 버섯집 마을이 생겼기에' },
      { name: '읍내', title: '읍내 학교', rep: 40, line: '가게가 늘어선 읍내가 되었기에' },
      { name: '도시', title: '도시 학교', rep: 85, line: '나무 아파트가 들어선 도시가 되었기에' },
      { name: '대도시', title: '대도시 학교', rep: 130, line: '나무 빌딩이 숲을 이룬 대도시가 되었기에' }
    ]
  };
  // 학교급: 유치원에서 시작해서 졸업할 때마다 한 칸씩 올라가요. 지금은 초등학교까지 열려 있어요
  // years는 다니는 햇수, grads는 졸업 전에 여는 종업식 수예요. 해마다 끝에는 종업식, 마지막 해 끝에는 졸업식을 열어요
  // 유치원은 '1년째, 2년째', 초등학교부터는 '1학년, 2학년'으로 불러요
  const TIERS = [
    { name: '유치원', school: '숲속 유치원', years: 2, grads: 1, unit: '년째' },
    { name: '초등학교', school: '숲속 초등학교', years: 6, grads: 5, unit: '학년' },
    { name: '중학교', school: '숲속 중학교', years: 3, grads: 2, unit: '학년' }
  ];
  const TIER_OPEN = 2;
  // 학교급이 오르면 수업료는 1000배, 공사비는 2000배라서 숫자 단위가 껑충 커져요
  const incomeScale = () => Math.pow(1000, S.tier);
  const costScale = () => Math.pow(2000, S.tier);
  const tierInfo = () => TIERS[S.tier];
  // 올해가 몇 년째(몇 학년)인지. 다음 학교급이 아직 안 열려서 마지막 해를 되풀이하면 마지막 해로 보여요
  const yearNo = () => Math.min(S.tg + 1, tierInfo().years);
  const yearLabel = () => `${tierInfo().name} ${yearNo()}${tierInfo().unit}`;
  // '2년째가', '3학년이'처럼 뒤에 붙는 조사까지
  const yearSubj = (n, T) => `${n}${T.unit}${T.unit === '년째' ? '가' : '이'}`;
  // 동네 평판 기준도 학교급마다 20%씩 높아져요
  const townRep = g => Math.round(CFG.grades[g].rep * (1 + 0.2 * S.tier));
  // 숫자 뒤 조사: 끝자리가 0, 1, 3, 6, 7, 8이면 받침이 있어요 (십, 일, 삼, 육, 칠, 팔)
  const numEul = n => '013678'.includes(String(n).slice(-1)) ? '을' : '를';
  /* ---------- 오래 하는 구조: 종업식과 졸업식, 명예 교장실, 전학생, 출석부, 보충수업 ---------- */
  const GRAD_MIN = 4;   // 대도시 학교가 되어야 종업식이나 졸업식을 열 수 있어요
  const startBudget = L => L < 1 ? 20 : 300 * Math.pow(5, L - 1);
  const NEWCOMERS = [
    { k: 'cat', name: '고양이', ga: '가' }, { k: 'dog', name: '강아지', ga: '가' }, { k: 'penguin', name: '펭귄', ga: '이' },
    { k: 'panda', name: '판다', ga: '가' }, { k: 'koala', name: '코알라', ga: '가' }, { k: 'otter', name: '수달', ga: '이' }
  ];
  const PERKS = {
    schol: { name: '동문회 장학금', desc: '졸업생들이 보내 주는 장학금으로 수업료가 올라요.',
      cost: L => Math.ceil(2 * Math.pow(1.45, L)), eff: L => `수업료 ×${Math.pow(1.3, L).toFixed(2)}`,
      icon: '<svg viewBox="-7 -10 14 18" aria-hidden="true"><path d="M-4.6 -1 Q-4.9 5.4 0 7.4 Q4.9 5.4 4.6 -1 Z" class="c-nut"/><path d="M-5.8 -0.8 Q-5.8 -6.2 0 -6.6 Q5.8 -6.2 5.8 -0.8 Q0 0.8 -5.8 -0.8 Z" class="c-cap"/><path d="M-3.4 2.4 h6.8" class="s-string"/></svg>' },
    rep: { name: '소문난 졸업생', desc: '졸업생들이 학교 자랑을 해서 평판이 늘 높아요.',
      cost: L => Math.ceil(3 * Math.pow(1.5, L)), eff: L => `평판 +${5 * L}`,
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" class="c-can"/></svg>' },
    start: { name: '새 학기 준비물', desc: '새 학기를 도토리를 더 들고 시작해요.',
      cost: L => Math.ceil(3 * Math.pow(2, L)), eff: L => `시작 도토리 ${fmt(startBudget(L) * costScale())}개`,
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="7" width="14" height="14" rx="4" class="f-bag1"/><path d="M9 7.5V6a3 3 0 0 1 6 0v1.5" class="s-frame"/><rect x="8" y="12" width="8" height="5" rx="1.5" class="f-bag0"/></svg>' },
    drop: { name: '참나무 거름', desc: '참나무가 튼튼해져서 떨어지는 도토리가 커져요.',
      cost: L => Math.ceil(2 * Math.pow(1.6, L)), eff: L => `주운 도토리 +${50 * L}%`,
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c4.5 3 6.5 7.5 4.3 12.2C15 18 12.8 19.4 12 21c-.8-1.6-3-3-4.3-5.8C5.5 10.5 7.5 6 12 3z" class="c-leaf2"/><path d="M12 7v13" class="s-vein"/></svg>' },
    night: { name: '부엉이 야간 자습', desc: '학교를 비운 동안 도토리가 더 오래 쌓여요.', max: 4,
      cost: L => Math.ceil(3 * Math.pow(2, L)), eff: L => `최대 ${CFG.offlineCapH + 4 * L}시간까지 쌓여요`,
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 3a9 9 0 1 0 5.5 13.6A7.4 7.4 0 0 1 15.5 3z" class="c-moon"/></svg>' }
  };
  // 장학재단: 졸업할 때 받는 기금으로 고쳐요. 학교급이 바뀌어도 효과가 계속 남아요
  const FPERKS = {
    schol: { name: '재단 장학금', desc: '장학재단이 보내 주는 장학금으로 수업료가 두 배씩 늘어요.',
      cost: L => Math.pow(2, L), eff: L => `수업료 ×${Math.pow(2, L)}`,
      icon: '<svg viewBox="-8 -8 16 16" aria-hidden="true"><circle r="7" class="c-fund"/><circle r="5" class="s-fund"/><path d="M0 3.2 C-2.6 1.6 -2.6 -1.8 0 -3.6 C2.6 -1.8 2.6 1.6 0 3.2 Z" class="c-leaf2"/></svg>' },
    rep: { name: '재단 이사회', desc: '이사회가 학교 자랑을 해 줘서 새 학기에도 평판이 높게 시작해요.',
      cost: L => Math.ceil(Math.pow(1.6, L)), eff: L => `평판 +${10 * L}`,
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" class="c-fund"/></svg>' },
    dip: { name: '학급 문집', desc: '종업식마다 근사한 학급 문집을 만들어 줘서 수료증이 늘어요.',
      cost: L => Math.ceil(2 * Math.pow(1.6, L)), eff: L => `수료증 +${25 * L}%`,
      icon: '<svg viewBox="-8.5 -8 17 17" aria-hidden="true"><rect x="-6" y="-7" width="12" height="14" rx="1.5" class="c-roof2"/><rect x="-4" y="-4.6" width="8" height="5.6" rx="1" class="c-dip"/><path d="M-3 3.4 h6" class="s-fund"/></svg>' }
  };
  const FUND = '<circle r="7" class="c-fund"/><circle r="5" class="s-fund"/><path d="M0 3.2 C-2.6 1.6 -2.6 -1.8 0 -3.6 C2.6 -1.8 2.6 1.6 0 3.2 Z" class="c-leaf2"/>';
  const fundIcon = () => `<svg viewBox="-8 -8 16 16" aria-hidden="true">${FUND}</svg>`;
  // 참나무: 누를 때마다 달린 도토리가 하나씩 떨어져요. 다 떨어지면 12초마다 하나씩 다시 열려요. 땅에는 6개까지
  const OAK = { max: 8, regen: 12, ground: 6 };
  // 까치 핫딜: 2분 반짝 열리는 광고 보상. 하루 8번, 1장을 마치면 열려요
  const DEAL = { perDay: 8, life: 120, gap: [150, 270], first: 45, retry: 30, feastMin: 5 };
  const DEAL_LINE = {
    classroom: '숲속 장터에 참나무 목재가 싸게 들어왔대요!',
    cafeteria: '장터에서 도토리 밀가루를 반값에 판대요!',
    library: '헌책방에서 그림책을 한 아름 싸게 판대요!',
    playground: '장터에 놀이 기구 반짝 세일이 열렸대요!',
    science: '장터에 실험 도구 반짝 세일이 열렸대요!',
    teaNew: '숲속 일자리 센터가 소개비를 반만 받는대요!',
    teaUp: '연수원 얼리버드 할인이 열렸대요!'
  };
  // 출석부: m은 수업료 몇 분치, d는 수료증 장수
  const ATT = [{ m: 10 }, { m: 15 }, { d: 1 }, { m: 20 }, { m: 30 }, { d: 2 }, { d: 3 }];
  const BOOST = { min: 10, perDay: 5, adSec: 5 };
  const dropIntervalFor = L => L < 1 ? Infinity : Math.max(8, 24 / (1 + 0.15 * (L - 1)));

  const FAC = {
    classroom: { name: '교실', rep: 1, view: '104 0 152 140',
      desc: '동물 친구들이 수업을 듣는 곳이에요. 넓힐수록 학생이 더 들어와요.',
      cost: L => 20 * Math.pow(1.7, L - 1),
      eff: L => `정원 ${CFG.cap0 + CFG.capStep * L}명` },
    cafeteria: { name: '급식실', rep: 1, view: '238 124 94 120',
      desc: '도토리 급식이 맛있으면 학교가 즐거워져요. 수업료가 올라요.',
      cost: L => 60 * Math.pow(1.8, L),
      eff: L => L < 1 ? '아직 없어요' : `수업료 +${20 * L}%` },
    library: { name: '도서관', rep: 3, view: '24 104 102 144',
      desc: '큰 나무 속 도서관이에요. 책을 읽을수록 학교 평판이 쌓여요.',
      cost: L => 100 * Math.pow(1.8, L),
      eff: L => L < 1 ? '아직 없어요' : `평판 +${3 * L}` },
    // 유치원에서는 미끄럼틀 놀이터, 초등학교부터는 운동장
    playground: { get name() { return S && S.tier >= 1 ? '운동장' : '놀이터'; }, rep: 1, view: '40 280 252 112',
      desc: '뛰놀다 보면 옆 참나무에서 도토리가 떨어져요. 떨어진 도토리를 눌러서 주우세요.',
      cost: L => 50 * Math.pow(1.8, L),
      eff: L => L < 1 ? '아직 없어요' : `${Math.round(dropIntervalFor(L))}초마다 도토리` },
    // 초등학교부터 생기는 새 시설
    science: { name: '과학실', rep: 1, tier: 1, view: '256 4 88 116',
      desc: '실험 발표회를 열면 학교 소문이 나고 수료증이 늘어요.',
      cost: L => 500 * Math.pow(2, L),
      eff: L => L < 1 ? '아직 없어요' : `수료증 +${5 * L}%, 평판 +${L}` }
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
  const AV = {
    hedgehog: HEDGEHOG,
    squirrel:'<path d="M8 14 C 22 12 24 -6 14 -12 C 6 -16 2 -8 8 -4 C 12 -1 10 6 4 8 Z" class="f-squirrel"/><path d="M11 -9 C 16 -10 18 -4 14 -2" class="s-tail"/><ellipse cx="-2" cy="12" rx="9" ry="8" class="f-squirrel"/><ellipse cx="-2" cy="13" rx="5.5" ry="5.5" class="f-squirrel-light"/><path d="M-12 -10 L-10 -19 L-5 -12 Z" class="f-squirrel"/><path d="M8 -10 L6 -19 L1 -12 Z" class="f-squirrel"/><circle cx="-2" cy="-3" r="11" class="f-squirrel"/><ellipse cx="-2" cy="1" rx="6.5" ry="5" class="f-squirrel-light"/><circle cx="-6" cy="-5" r="1.6" class="f-eye"/><circle cx="2" cy="-5" r="1.6" class="f-eye"/><ellipse cx="-2" cy="-0.6" rx="1.6" ry="1.1" class="f-eye"/><ellipse cx="-9" cy="0.4" rx="2" ry="1.3" class="f-cheek"/><ellipse cx="5" cy="0.4" rx="2" ry="1.3" class="f-cheek"/><rect x="-17" y="2" width="3" height="14" rx="1" transform="rotate(-25 -15.5 9)" class="f-pencil"/>',
    owl: '<path d="M-11 -13 L-8 -21 L-4 -15 Z" class="f-owl"/><path d="M11 -13 L8 -21 L4 -15 Z" class="f-owl"/><ellipse cx="0" cy="2" rx="15" ry="19" class="f-owl"/><ellipse cx="0" cy="9" rx="9" ry="10" class="f-owl-light"/><path d="M-5 6 q2 2 4 0 M1 6 q2 2 4 0 M-3 11 q2 2 4 0" class="s-feather"/><path d="M-15 0 Q -20 10 -12 16 M15 0 Q 20 10 12 16" class="s-wing"/><circle cx="-6" cy="-6" r="6" class="f-owl-eye"/><circle cx="6" cy="-6" r="6" class="f-owl-eye"/><circle cx="-6" cy="-6" r="6" class="s-glasses"/><circle cx="6" cy="-6" r="6" class="s-glasses"/><path d="M-1 -6.5 Q0 -7.5 1 -6.5" class="s-glasses"/><circle cx="-6" cy="-5.5" r="2.6" class="f-eye"/><circle cx="6" cy="-5.5" r="2.6" class="f-eye"/><path d="M-2 -1 L2 -1 L0 3 Z" class="f-beak"/><path d="M-5 20 v2.4 M-3 20 v2.4 M3 20 v2.4 M5 20 v2.4" class="s-feet"/>',
    bear: '<circle cx="-11" cy="-12" r="5.5" class="f-bear"/><circle cx="11" cy="-12" r="5.5" class="f-bear"/><circle cx="-11" cy="-12" r="2.8" class="f-bear-light"/><circle cx="11" cy="-12" r="2.8" class="f-bear-light"/><ellipse cx="0" cy="16" rx="13" ry="8" class="f-bear"/><circle cx="0" cy="-2" r="14" class="f-bear"/><ellipse cx="0" cy="4" rx="7" ry="5.4" class="f-bear-light"/><ellipse cx="0" cy="1.6" rx="2.6" ry="1.8" class="f-eye"/><path d="M-2 5.6 Q0 7.6 2 5.6" class="s-mouth"/><circle cx="-5.5" cy="-4" r="1.7" class="f-eye"/><circle cx="5.5" cy="-4" r="1.7" class="f-eye"/><path d="M-6 10 Q0 15 6 10" class="s-string"/><rect x="3" y="11" width="7" height="4" rx="2" class="f-whistle"/>'
  };

  const TEA = {
    squirrel: { name: '다람쥐 선생님', subject: '수학',
      desc: '도토리 셈이 빠른 수학 선생님이에요. 수업료가 올라요.',
      cost: L => L < 1 ? 0 : 80 * Math.pow(1.85, L - 1),
      eff: L => `수업료 +${15 * L}%` },
    owl: { name: '부엉이 선생님', subject: '과학', max: 5,
      desc: '밤에도 수업하는 과학 선생님이에요. 자리 비운 동안 쌓이는 도토리가 늘어요.',
      cost: L => L < 1 ? 300 : 250 * Math.pow(1.85, L - 1),
      eff: L => `자리 비운 동안 수업료의 ${Math.min(100, 30 + 15 * L)}%` },
    bear: { name: '곰 선생님', subject: '체육',
      desc: '힘센 체육 선생님이에요. 참나무를 흔들어서 떨어지는 도토리를 키워요.',
      cost: L => L < 1 ? 600 : 400 * Math.pow(1.85, L - 1),
      eff: L => L < 1 ? '주운 도토리 보너스 없음' : `주운 도토리 +${15 * L}%` }
  };

  const ACORN = '<path d="M-4.6 -1 Q-4.9 5.4 0 7.4 Q4.9 5.4 4.6 -1 Z" class="c-nut"/><ellipse cx="-1.8" cy="2" rx="0.9" ry="2.1" class="c-shine"/><path d="M-5.8 -0.8 Q-5.8 -6.2 0 -6.6 Q5.8 -6.2 5.8 -0.8 Q0 0.8 -5.8 -0.8 Z" class="c-cap"/><path d="M-4 -3.2 H4 M-2.8 -5 H2.8" class="s-capline"/><path d="M0 -6.6 L0.9 -9.2" class="s-stem"/>';
  const acornIcon = () => `<svg viewBox="-7 -10 14 18" aria-hidden="true">${ACORN}</svg>`;
  // 수료증: 빨간 띠를 두른 두루마리
  const DIP = '<rect x="-7" y="-3.6" width="14" height="7.2" rx="1.4" class="c-dip"/><rect x="-8" y="-4.2" width="2.6" height="8.4" rx="1.3" class="c-dip-edge"/><rect x="5.4" y="-4.2" width="2.6" height="8.4" rx="1.3" class="c-dip-edge"/><rect x="-1.4" y="-3.6" width="2.8" height="7.2" class="c-seal"/><path d="M-1.4 3.2 l-1.6 4 l1.8 -0.9 l0.8 1.5 l0.6 -4.6 z M1.4 3.2 l1.6 4 l-1.8 -0.9 l-0.8 1.5 l-0.6 -4.6 z" class="c-seal"/>';
  const dipIcon = () => `<svg viewBox="-8.5 -8 17 17" aria-hidden="true">${DIP}</svg>`;
  const rewardIcon = kind => kind === 'dip' ? dipIcon() : acornIcon();
  const rewardText = (kind, v) => kind === 'dip' ? `수료증 ${v}장` : `도토리 ${fmt(v)}개`;
  const CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ---------- 퀘스트 목록 ---------- */
  // 메인 퀘스트: 교감 선생님이 장마다 하나씩 기능을 알려 주는 튜토리얼. 마지막 퀘스트가 그 장의 상장(학교 등급)이다
  const CHAPTERS = ['첫 출근', '선생님을 모셔요', '소문난 학교', '대도시를 향해', '유치원 졸업', '숲속 초등학교', '6학년까지'];
  // 다음 장이 열리는 때 (장 순서대로)
  const CH_NEXT = ['마을 학교가 되면', '읍내 학교가 되면', '도시 학교가 되면', '대도시 학교가 되면', '초등학교에 입학하면', '1학년 종업식을 마치면', '중학교가 열리면'];
  // id는 저장에 쓰여요. 순서를 바꾸거나 퀘스트를 빼도 하던 퀘스트를 그대로 찾아요
  const MAIN = [
    { id: 'q0', ch: 0, t: 'fac', k: 'classroom', n: 2, r: 30, title: '교실 넓히기', how: '교실을 눌러서 Lv.2로 넓혀요',
      say: '어서 오세요, 교장 선생님! 저는 교감 고슴도치예요. 숲속 유치원에 오고 싶은 친구들은 많은데 교실이 좁아요. 교실을 눌러서 넓혀 볼까요?' },
    { id: 'q1', ch: 0, t: 'fac', k: 'cafeteria', n: 1, r: 40, title: '급식실 짓기', how: '급식실이 생기면 수업료가 20% 올라요',
      say: '배가 고프면 공부가 안 되지요. 급식실을 지으면 학생들이 신이 나서 수업료가 20% 올라요.' },
    { id: 'q2', ch: 0, t: 'fac', k: 'playground', n: 1, r: 40, title: '놀이터 짓기', how: '놀이터 옆 참나무에서 도토리가 떨어져요',
      say: '아이들은 뛰어놀아야 쑥쑥 자라요. 미끄럼틀이 있는 놀이터를 지으면 옆 참나무에서 도토리가 떨어진답니다.' },
    { id: 'q3', ch: 0, t: 'picks', n: 3, r: 60, title: '도토리 줍기', how: '참나무를 누르면 도토리가 떨어져요',
      say: '놀이터 옆 참나무를 눌러 보세요. 도토리가 후두둑 떨어지면 깜빡이다 사라지기 전에 눌러서 주워 주세요!' },
    { id: 'q4', ch: 0, t: 'fac', k: 'library', n: 1, r: 80, title: '도서관 짓기', how: '도서관은 평판을 ★3씩 올려 줘요',
      say: '책 읽는 학교는 소문이 빨리 나요. 도서관은 다른 시설보다 평판을 세 배나 올려 줘요.' },
    { id: 'q5', ch: 0, t: 'tea', k: 'squirrel', n: 2, r: 80, title: '다람쥐 선생님 연수', how: '아래 선생님 탭에서 연수를 보내요',
      say: '우리 학교 첫 선생님인 다람쥐 선생님이에요. 연수를 다녀오면 수업료가 오르고 평판도 ★2 올라요. 아래 선생님 탭을 눌러 보세요.' },
    { id: 'q6', ch: 0, t: 'grade', n: 1, r: 150, title: '마을 학교 되기', how: '평판 ★15를 모으면 학교 옆에 마을이 생겨요',
      say: '평판이 ★15가 되면 소문을 들은 친구들이 학교 옆에 버섯집 마을을 지어요. 숲속 교육청 상장도 받아요. 시설과 선생님을 골고루 키워 봐요!' },

    { id: 'q7', ch: 1, t: 'tea', k: 'owl', n: 1, r: 200, title: '부엉이 선생님 모시기', how: '학교를 비운 동안에도 도토리가 더 쌓여요',
      say: '마을이 생긴 걸 축하해요! 이번엔 밤에도 수업해 줄 부엉이 선생님을 모셔요. 학교를 비운 동안 쌓이는 도토리가 늘어나요.' },
    { id: 'q8', ch: 1, t: 'students', n: 30, r: 250, title: '학생 30명 맞이하기', how: '교실을 Lv.6까지 넓히면 30명이 들어와요',
      say: '마을에서 입학 문의가 밀려와요. 교실을 넓혀서 학생 30명을 맞이해 볼까요?' },
    { id: 'q9', ch: 1, t: 'fac', k: 'cafeteria', n: 3, r: 250, title: '급식실 키우기', how: '급식실 Lv.3이면 수업료가 60% 올라요',
      say: '학생이 늘어서 급식이 모자라요. 급식실을 Lv.3까지 키워 주세요.' },
    { id: 'q10', ch: 1, t: 'fac', k: 'playground', n: 3, r: 300, title: '놀이터 넓히기', how: '놀이터가 넓을수록 도토리가 자주 떨어져요',
      say: '놀이터가 넓어지면 참나무가 더 자주 흔들려요. 떨어지는 도토리를 놓치지 마세요!' },
    { id: 'q11', ch: 1, t: 'grade', n: 2, r: 600, title: '읍내 학교 되기', how: '평판 ★40을 모으면 가게가 늘어선 읍내가 돼요',
      say: '다음 목표는 읍내예요. 평판 ★40을 모으면 마을에 가게가 하나둘 늘어나고, 두 번째 상장을 받아요.' },

    { id: 'q12', ch: 2, t: 'tea', k: 'bear', n: 1, r: 800, title: '곰 선생님 모시기', how: '주운 도토리가 15%씩 늘어나요',
      say: '체육 시간이 필요해요! 힘센 곰 선생님이 참나무를 흔들면 떨어지는 도토리가 더 커져요.' },
    { id: 'q13', ch: 2, t: 'fac', k: 'library', n: 5, r: 1000, title: '도서관 키우기', how: '도서관을 키우면 평판이 쑥쑥 올라요',
      say: '읍내 곳곳에서 책을 빌리러 와요. 도서관을 Lv.5까지 키우면 도시가 눈앞이에요.' },
    { id: 'q14', ch: 2, t: 'tea', k: 'owl', n: 3, r: 1000, title: '부엉이 선생님 연수', how: '자리 비운 동안 수업료의 75%가 쌓여요',
      say: '부엉이 선생님이 연수를 다녀오면 밤 수업이 더 알차져요. 학교를 비운 동안 쌓이는 도토리가 늘어나요.' },
    { id: 'q15', ch: 2, t: 'grade', n: 3, r: 2500, title: '도시 학교 되기', how: '평판 ★85를 모으면 나무 아파트가 들어서요',
      say: '이제 학교 둘레가 도시가 될 차례예요. 평판 ★85를 모으면 나무 아파트가 들어서고 세 번째 상장을 받아요!' },

    { id: 'q16', ch: 3, t: 'students', n: 60, r: 4000, title: '학생 60명 맞이하기', how: '교실을 Lv.14까지 넓혀요',
      say: '도시 곳곳에서 입학하러 와요. 학생 60명이 함께 공부하는 학교를 만들어 봐요.' },
    { id: 'q17', ch: 3, t: 'teaAll', n: 5, r: 5000, title: '선생님 모두 Lv.5', how: '세 선생님을 모두 Lv.5까지 연수 보내요',
      say: '실력 있는 선생님이 좋은 학교를 만들어요. 다람쥐, 부엉이, 곰 선생님을 모두 Lv.5까지 키워 주세요.' },
    { id: 'q18', ch: 3, t: 'rate', n: 300, r: 8000, title: '초당 도토리 300', how: '급식실과 다람쥐 선생님이 수업료를 올려 줘요',
      say: '학교 살림이 넉넉해야 더 크게 키울 수 있어요. 1초에 도토리 300개가 들어오게 만들어 봐요.' },
    { id: 'q19', ch: 3, t: 'fac', k: 'cafeteria', n: 12, r: 10000, title: '숲속 최고 급식실', how: '급식실을 Lv.12까지 키워요',
      say: '대도시 학교라면 급식도 숲에서 제일이어야지요. 급식실을 Lv.12까지 키워 주세요.' },
    { id: 'q20', ch: 3, t: 'fac', k: 'library', n: 11, r: 15000, title: '천 년의 도서관', how: '도서관을 Lv.11까지 키워요',
      say: '천 년 동안 읽을 책을 모아 볼까요? 도서관을 Lv.11까지 키우면 대도시가 코앞이에요.' },
    { id: 'q21', ch: 3, t: 'grade', n: 4, r: 20000, title: '대도시 학교 되기', how: '평판 ★130을 모으면 종업식이 열려요',
      say: '평판 ★130을 모으면 나무 빌딩이 숲을 이룬 대도시가 돼요! 대도시 학교가 되면 1년째를 마치는 종업식을 열 수 있어요.' },

    // 5장: 1년째를 마치는 종업식, 2년째를 채우는 퀘스트, 유치원을 마치는 졸업식. 보상은 수료증(rk: 'dip')이나 수업료 몇 분치(rm)
    { id: 'q22', ch: 4, t: 'grads', n: 1, r: 2, rk: 'dip', title: '첫 종업식', how: '아래 졸업 탭에서 종업식을 열어요',
      say: '드디어 대도시 학교가 되었어요! 종업식을 열면 유치원 1년째를 마치고 2년째가 시작돼요. 학교와 동네는 처음으로 돌아가지만 수료증과 새 친구가 남아요.' },
    { id: 'q23', ch: 4, t: 'perks', n: 1, r: 3, rk: 'dip', title: '명예 교장실 고치기', how: '수료증으로 명예 교장실을 고쳐요',
      say: '수료증은 명예 교장실을 고치는 데 써요. 고친 효과는 2년째에도 그대로라서 학교가 훨씬 빨리 자라요.' },
    // 2년째는 처음부터 다시 자라요. 올해의 동네 단계와 시설 목표로 대도시까지 가는 길을 채워요
    { id: 'k2', ch: 4, t: 'ygrade', n: 2, rm: 1, title: '2년째 읍내 되기', how: '명예 교장실 덕분에 작년보다 빨리 자라요',
      say: '2년째 유치원이 문을 열었어요! 명예 교장실을 고친 덕분에 작년보다 훨씬 빨리 자랄 거예요. 다시 읍내까지 가 볼까요?' },
    { id: 'k3', ch: 4, t: 'teaAll', n: 3, rm: 1, title: '선생님 모두 Lv.3', how: '부엉이와 곰 선생님도 다시 모셔요',
      say: '새해에는 선생님들도 새로 오세요. 다람쥐, 부엉이, 곰 선생님을 모두 모시고 Lv.3까지 연수를 보내 주세요.' },
    { id: 'k4', ch: 4, t: 'ygrade', n: 3, rm: 1.5, title: '2년째 도시 되기', how: '평판을 모아서 도시가 되어요',
      say: '벌써 읍내가 되었네요. 나무 아파트가 들어선 도시까지 쭉쭉 키워 봐요!' },
    { id: 'k5', ch: 4, t: 'students', n: 50, rm: 1.5, title: '학생 50명 맞이하기', how: '교실을 Lv.11까지 넓혀요',
      say: '도시 학교라는 소문을 듣고 입학하려는 친구들이 줄을 섰어요. 교실을 넓혀서 50명을 맞이해요.' },
    { id: 'k6', ch: 4, t: 'picks', n: 15, rm: 2, title: '도토리 15개 줍기', how: '참나무를 누르면 도토리가 떨어져요',
      say: '졸업식 잔치에 쓸 도토리를 모아요. 참나무를 흔들어서 떨어진 도토리를 15개 주워 주세요!' },
    { id: 'k7', ch: 4, t: 'fac', k: 'cafeteria', n: 10, rm: 2, title: '졸업 잔치 급식', how: '급식실을 Lv.10까지 키워요',
      say: '졸업식 날에는 맛있는 잔치 급식이 빠질 수 없지요. 급식실을 Lv.10까지 키워 주세요.' },
    { id: 'k8', ch: 4, t: 'fac', k: 'library', n: 10, rm: 2, title: '그림책 잔치', how: '도서관을 Lv.10까지 키워요',
      say: '도서관에서 그림책 잔치를 열어요. 도서관을 Lv.10까지 키우면 대도시가 코앞이에요.' },
    { id: 'k1', ch: 4, t: 'tier', n: 1, r: 5, rk: 'dip', title: '유치원 졸업식', how: '2년째에 대도시가 되면 졸업식을 열어요',
      say: '유치원 친구들이 많이 자랐어요! 2년째에 다시 대도시 학교가 되면 졸업식을 열고 숲속 초등학교에 입학해요. 졸업 탭에서 졸업식을 열어 보세요.' },

    // 6장: 초등학교 1학년. 도토리 보상은 rm(수업료 몇 분치)으로 정해서 학교급이 올라도 알맞은 크기가 돼요
    { id: 'e1', ch: 5, t: 'fperks', n: 1, r: 3, rk: 'dip', title: '장학재단 고치기', how: '졸업하며 받은 기금으로 장학재단을 고쳐요',
      say: '숲속 초등학교 입학을 축하해요! 유치원을 졸업하며 받은 기금으로 장학재단을 고치면, 앞으로 어느 학교급에서든 효과가 남아요.' },
    { id: 'e2', ch: 5, t: 'fac', k: 'science', n: 1, rm: 10, title: '과학실 짓기', how: '과학실은 수료증과 평판을 올려 줘요',
      say: '초등학교에는 과학실이 있어야지요. 지도 오른쪽 위 공사 자리를 눌러 보세요. 실험 발표회를 열면 소문이 나고 수료증도 늘어나요.' },
{ id: 'e3', ch: 5, t: 'grade', n: 2, rm: 15, title: '초등학교 읍내 되기', how: '초등학교는 평판 기준이 조금 더 높아요',
      say: '초등학교는 학생도 많고 기대도 커서 동네 평판 기준이 조금 높아요. 다시 읍내까지 키워 볼까요?' },
    { id: 'e7', ch: 5, t: 'grade', n: 3, rm: 3, title: '초등학교 도시 되기', how: '나무 아파트가 들어선 도시를 만들어요',
      say: '초등학교 둘레에도 나무 아파트가 들어서고 있어요. 평판을 모아서 도시 학교가 되어 볼까요?' },
    { id: 'e4', ch: 5, t: 'fac', k: 'science', n: 5, rm: 20, title: '과학 발표회', how: '과학실을 Lv.5까지 키워요',
      say: '과학실을 Lv.5까지 키우면 숲속 과학 발표회를 열 수 있어요. 수료증이 25%나 늘어나요.' },
    { id: 'e8', ch: 5, t: 'students', n: 60, rm: 3, title: '학생 60명 맞이하기', how: '교실을 Lv.14까지 넓혀요',
      say: '초등학교는 한 반에 친구가 많아요. 교실을 넓혀서 60명을 맞이해요.' },
    { id: 'e9', ch: 5, t: 'picks', n: 20, rm: 3, title: '운동회 도토리 줍기', how: '참나무를 누르면 도토리가 떨어져요',
      say: '운동회 날이에요! 운동장 옆 참나무를 흔들어서 떨어진 도토리를 20개 주워 주세요.' },
    { id: 'e10', ch: 5, t: 'fac', k: 'cafeteria', n: 11, rm: 4, title: '급식실 Lv.11', how: '급식실을 Lv.11까지 키워요',
      say: '한창 클 나이라 급식을 많이 먹어요. 급식실을 Lv.11까지 키워 주세요.' },
    { id: 'e11', ch: 5, t: 'fac', k: 'science', n: 8, rm: 4, title: '과학 경시대회', how: '과학실을 Lv.8까지 키워요',
      say: '숲속 과학 경시대회가 열려요. 과학실을 Lv.8까지 키우면 대도시가 눈앞이에요.' },
    { id: 'e5', ch: 5, t: 'grade', n: 4, r: 5, rk: 'dip', title: '초등학교 대도시 되기', how: '대도시가 되면 1학년 종업식을 열어요',
      say: '초등학교도 대도시 학교로 만들어 봐요! 그러면 1학년을 마치는 종업식을 열 수 있어요.' },
    { id: 'e12', ch: 5, t: 'tgrads', n: 1, r: 5, rk: 'dip', title: '1학년 종업식', how: '졸업 탭에서 종업식을 열어요',
      say: '1학년을 무사히 마쳤어요! 종업식을 열고 2학년으로 올라가요. 받은 수료증으로 명예 교장실도 다시 고쳐 봐요.' },

    // 7장: 2학년부터 6학년까지. 해마다 조금씩 더 높이 키워야 이룰 수 있는 목표
    { id: 'e13', ch: 6, t: 'ygrade', n: 4, rm: 3, title: '2학년 대도시 되기', how: '명예 교장실 덕분에 2학년은 더 빨라요',
      say: '2학년이 되었어요! 1학년 때 모은 수료증으로 명예 교장실을 고쳤다면 훨씬 빨리 대도시가 될 거예요.' },
    { id: 'e14', ch: 6, t: 'fac', k: 'science', n: 10, rm: 4, title: '과학실 Lv.10', how: '해마다 조금씩 더 높이 키워요',
      say: '과학실을 Lv.10까지 키워 볼까요? 한 해에 못 하면 종업식을 열고 다음 학년에 다시 도전해요.' },
    { id: 'q26', ch: 6, t: 'grads', n: 6, r: 8, rk: 'dip', title: '전학생 모두 만나기', how: '종업식과 졸업식을 합쳐 6번이면 여섯 친구가 모두 와요',
      say: '종업식이나 졸업식을 열 때마다 새 친구가 전학 와요. 고양이부터 수달까지 여섯 친구를 모두 만나 볼까요?' },
    { id: 'e15', ch: 6, t: 'students', n: 90, rm: 4, title: '학생 90명 맞이하기', how: '교실을 Lv.21까지 넓혀요',
      say: '숲속 초등학교가 숲에서 제일 큰 학교가 되어 가요. 교실을 넓혀서 90명을 맞이해요.' },
    { id: 'e6', ch: 6, t: 'tgrads', n: 5, r: 10, rk: 'dip', title: '초등학교 6학년 되기', how: '종업식을 다섯 번 열면 6학년이에요',
      say: '초등학교에서 종업식을 다섯 번 열면 6학년이 돼요. 그러면 중학교에 갈 준비가 끝나요. 중학교는 곧 열릴 거예요!' }
  ];
  // v3 저장은 메인 퀘스트를 번호로 기억했어요. 그때 순서의 id 목록 (q25 별빛숲, q27 무지개숲은 동네 5단계로 바뀌며, q24 졸업식 세 번은 유치원이 2년으로 줄며 빠졌어요)
  const LEGACY_IDS = Array.from({ length: 28 }, (_, i) => 'q' + i);

  // 서브 퀘스트: 학생들의 부탁. 메인 퀘스트를 after개 마치면 차례로 찾아오고, 다 들어주면 반복 부탁이 이어진다
  const WHO = { rabbit: '토끼 학생', fox: '여우 학생', raccoon: '너구리 학생', chick: '병아리 학생', bear: '아기곰 학생' };
  const SUB_UNLOCK = 2;
  const SUBS = [
    { id: 's1', who: 'raccoon', t: 'students', n: 20, after: 2, r: 60, say: n => `친구들을 더 데려와도 돼요? 학생이 ${n}명이 되면 다 같이 놀 수 있어요!` },
    { id: 's2', who: 'chick', t: 'fac', k: 'cafeteria', n: 2, after: 2, r: 80, say: n => `급식에 도토리 죽이 나오면 좋겠어요. 급식실을 Lv.${n}까지 키워 주세요!` },
    { id: 's3', who: 'fox', t: 'picks', n: 5, after: 4, r: 100, say: n => `도토리 줍기 시합 해요! ${FAC.playground.name}에서 ${n}개만 같이 주워요.` },
    { id: 's4', who: 'rabbit', t: 'fac', k: 'playground', n: 2, after: 4, r: 100, say: n => `더 신나게 뛰어놀고 싶어요. ${eul(FAC.playground.name)} Lv.${n}까지 키워 주세요!` },
    { id: 's5', who: 'bear', t: 'fac', k: 'library', n: 2, after: 5, r: 120, say: n => `그림책이 더 있으면 좋겠어요. 도서관을 Lv.${n}까지 키워 주세요.` },
    { id: 's6', who: 'chick', t: 'earned', n: 1500, after: 7, r: 300, say: n => `도토리 ${fmt(n)}개를 모으면 숲속 잔치를 열어요!` },
    { id: 's7', who: 'rabbit', t: 'claims', n: 1, after: 8, r: 300, say: () => '학교 문을 닫아도 수업이 이어지는지 궁금해요. 오른쪽 위 X로 문을 닫았다가 30초 뒤에 다시 와 주세요.' },
    { id: 's8', who: 'raccoon', t: 'fac', k: 'classroom', n: 8, after: 9, r: 400, say: n => `교실이 넓으면 숨바꼭질도 할 수 있어요. 교실을 Lv.${n}까지 넓혀 주세요!` },
    { id: 's9', who: 'bear', t: 'fac', k: 'cafeteria', n: 6, after: 12, r: 1200, say: n => `급식실이 숲에서 제일 맛있대요! Lv.${n}까지 키우면 더 맛있어질 거예요.` },
    { id: 's10', who: 'fox', t: 'picks', n: 20, after: 13, r: 1500, say: n => `도토리 줍기 시합 2라운드예요! 이번엔 ${n}개!` },
    { id: 's11', who: 'rabbit', t: 'fac', k: 'library', n: 8, after: 14, r: 2500, say: n => `도서관에서 하루 종일 책을 읽고 싶어요. 도서관을 Lv.${n}까지 키워 주세요.` },
    { id: 's12', who: 'chick', t: 'students', n: 50, after: 16, r: 4000, say: n => `학생이 ${n}명이 되면 다 같이 사진을 찍어요!` }
  ];
  const GEN = [
    { who: 'fox', t: 'picks', n: c => 10 + 5 * Math.min(c, 6), say: n => `도토리 줍기 시합 한 판 더 해요! 이번엔 ${n}개예요.` },
    { who: 'raccoon', t: 'ups', n: () => 3, say: n => `시설을 ${n}번만 더 반짝반짝하게 고쳐 주세요.` },
    { who: 'bear', t: 'trains', n: () => 2, say: n => `선생님들을 연수에 ${n}번 더 보내 주세요. 수업이 더 재밌어져요!` },
    { who: 'chick', t: 'earned', n: () => nice(rate() * 120), say: n => `도토리 ${fmt(n)}개를 모아서 숲속 잔치를 열어요!` },
    { who: 'rabbit', t: 'claims', n: () => 1, say: () => '학교 문을 닫았다가 다시 와 주세요. 그동안 수업이 잘 이어지는지 볼게요.' }
  ];
  const COUNT_TYPES = new Set(['picks', 'ups', 'trains', 'claims', 'earned']);
  const Q_TYPES = ['fac', 'tea', 'teaAll', 'students', 'grade', 'ygrade', 'rate', 'picks', 'ups', 'trains', 'claims', 'earned', 'grads', 'perks', 'tier', 'tgrads', 'fperks'];

  /* ---------- 상태 ---------- */
  let S = null;
  const rt = {
    lastT: 0, uiT: 0, affT: 0, sortT: 0, floatAcc: 0, floatT: 0, dropT: 0,
    kids: [], drops: [], kidSeq: 0, modalQueue: [], modalOpen: null, sheetKey: null, tab: 'school',
    paused: false, closedAt: 0, hiddenAt: 0, reduced: !!(motionMQ && motionMQ.matches),
    qr: {}, qKey: '', guideKey: null,
    adOpen: false, adTimer: 0, adOk: null, adNo: null, adEarned: false, gKey: '', townStage: -1, townTier: -1,
    deal: null, dealT: DEAL.first, fitKey: '', fitGen: 0, yearKey: '', oakN: -1, oakHintAt: 0, rankEdit: false,
    adopting: false, moveParam: '', moveIn: null, moveBusy: false, adNoGold: false, shopPick: ''
  };
  if (motionMQ && motionMQ.addEventListener) motionMQ.addEventListener('change', e => { rt.reduced = e.matches; });
  // 헷갈리는 0, O, 1, I, L을 뺀 글자로 학교 번호와 이어하기 코드를 만들어요
  const ID_ABC = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  function randCode(n) {
    const a = new Uint32Array(n);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a);
    else for (let i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 4294967296);
    return Array.from(a, x => ID_ABC[x % ID_ABC.length]).join('');
  }
  // 서버 저장 상태. GitHub 테스트판에서만 켜져요 (아래 '서버 저장'에 자세히 적었어요)
  const Cloud = { state: 'off', gen: 0, fb: null, db: null, uid: null, dirty: false, pushing: false, lastPush: 0, lastStats: 0, timer: 0,
    offset: 0, online: true, err: '', bootHadSave: false, skipRestore: false, listening: false, moveCode: '', moveAt: 0 };

  // q.m: 지금 메인 퀘스트 번호, q.mb: 그 퀘스트를 시작할 때의 기준값, q.subs: 받아 둔 학생 부탁들
  // mid: 지금 메인 퀘스트의 id. 퀘스트 목록이 바뀌어도 이어서 할 수 있게 저장해요
  const freshQ = () => ({ init: false, m: 0, mb: 0, mid: '', lat: '', subs: [], done: [], gen: 0, subDone: 0, seen: -1 });
  // p: 종업식으로 남는 것(수료증, 전학생 수, 명예 교장실), best: 가장 높았던 등급, yearEarned: 올해 번 도토리
  // tier: 학교급(0 유치원, 1 초등학교), tg: 이 학교급에서 연 종업식, tdip: 이 학교급에서 모은 수료증, fund와 fp: 장학재단 기금과 강화
  const fresh = () => ({
    v: 4, pid: randCode(8), born: Date.now(), budget: 20, students: 4,
    f: { classroom: 1, cafeteria: 0, library: 0, playground: 0, science: 0 },
    t: { squirrel: 1, owl: 0, bear: 0 },
    grade: 0, best: 0, sound: true, vibrate: true, savedAt: Date.now(),
    pending: 0, pendingSec: 0, certNo: 0, earned: 0, yearEarned: 0,
    tier: 0, tg: 0, tdip: 0, fund: 0, fp: { schol: 0, rep: 0, dip: 0 },
    hd: { day: '', n: 0, feastUntil: 0, album: false, seen: false },
    oak: OAK.max,
    st: { picks: 0, ups: 0, trains: 0, claims: 0, grads: 0, perks: 0, fperks: 0, shakes: 0, dips: 0, play: 0, sess: 0, ads: 0, gold: 0, gspent: 0 },
    p: { dip: 0, species: 0, perk: { schol: 0, rep: 0, start: 0, drop: 0, night: 0 } },
    att: { last: '', n: 0 },
    ad: { day: '', n: 0 },
    u: { boost: false, dev: false },
    units: 'ko',
    gold: 5, gd: { day: '', n: 0, shop: 0 }, cos: { own: [], hat: '', neck: '', roof: '', board: '' }, autoUntil: 0,
    rank: { name: '', joined: false, sent: -1, by: '' },
    q: freshQ()
  });
  const repOf = s => s.f.classroom + s.f.cafeteria + s.f.playground + 3 * s.f.library + s.f.science + 2 * (s.t.squirrel + s.t.owl + s.t.bear) + 5 * s.p.perk.rep + 10 * s.fp.rep;
  const gradeOf = r => { let g = 0; CFG.grades.forEach((x, i) => { if (r >= townRep(i)) g = i; }); return g; };

  function sanitize(d) {
    const s = fresh();
    if (!d || typeof d !== 'object') return s;
    const num = (v, min, fb) => (typeof v === 'number' && isFinite(v) && v >= min) ? v : fb;
    s.budget = num(d.budget, 0, s.budget);
    s.students = num(d.students, 0, s.students);
    for (const k in s.f) s.f[k] = Math.floor(num(d.f && d.f[k], k === 'classroom' ? 1 : 0, s.f[k]));
    for (const k in s.t) s.t[k] = Math.floor(num(d.t && d.t[k], k === 'squirrel' ? 1 : 0, s.t[k]));
    s.t.owl = Math.min(s.t.owl, TEA.owl.max);
    s.grade = Math.min(Math.floor(num(d.grade, 0, 0)), CFG.grades.length - 1);
    s.sound = d.sound !== false; s.vibrate = d.vibrate !== false;
    s.savedAt = num(d.savedAt, 0, Date.now());
    s.pending = num(d.pending, 0, 0); s.pendingSec = num(d.pendingSec, 0, 0);
    s.certNo = Math.floor(num(d.certNo, 0, 0)); s.earned = num(d.earned, 0, 0);
    if (d.st && typeof d.st === 'object') for (const k in s.st) s.st[k] = Math.floor(num(d.st[k], 0, 0));
    s.oak = Math.min(OAK.max, num(d.oak, 0, OAK.max));
    // 종업식과 출석, 광고 기록. 예전 저장에는 없으니 지금 상태에서 알맞게 채워요
    s.best = Math.max(s.grade, Math.min(Math.floor(num(d.best, 0, 0)), CFG.grades.length - 1));
    s.yearEarned = num(d.yearEarned, 0, s.earned);
    if (d.p && typeof d.p === 'object') {
      s.p.dip = Math.floor(num(d.p.dip, 0, 0));
      s.p.species = Math.min(NEWCOMERS.length, Math.floor(num(d.p.species, 0, 0)));
      if (d.p.perk && typeof d.p.perk === 'object') for (const k in s.p.perk) s.p.perk[k] = Math.floor(num(d.p.perk[k], 0, 0));
      s.p.perk.night = Math.min(s.p.perk.night, PERKS.night.max);
    }
    if (d.att && typeof d.att === 'object') { s.att.last = typeof d.att.last === 'string' ? d.att.last.slice(0, 10) : ''; s.att.n = Math.floor(num(d.att.n, 0, 0)); }
    if (d.ad && typeof d.ad === 'object') { s.ad.day = typeof d.ad.day === 'string' ? d.ad.day.slice(0, 10) : ''; s.ad.n = Math.floor(num(d.ad.n, 0, 0)); }
    // 학교급과 장학재단. 졸업식이 없던 저장은 지금까지의 종업식이 모두 유치원에서 열린 것으로 쳐요
    s.tier = Math.min(Math.floor(num(d.tier, 0, 0)), TIER_OPEN - 1);
    s.tg = Math.floor(num(d.tg, 0, s.tier === 0 ? s.st.grads : 0));
    s.fund = Math.floor(num(d.fund, 0, 0));
    if (d.fp && typeof d.fp === 'object') for (const k in s.fp) s.fp[k] = Math.floor(num(d.fp[k], 0, 0));
    if (d.hd && typeof d.hd === 'object') {
      s.hd.day = typeof d.hd.day === 'string' ? d.hd.day.slice(0, 10) : '';
      s.hd.n = Math.floor(num(d.hd.n, 0, 0));
      s.hd.feastUntil = Math.min(num(d.hd.feastUntil, 0, 0), Date.now() + 3 * 3600000);
      s.hd.album = !!d.hd.album; s.hd.seen = !!d.hd.seen;
    }
    // 예전 저장에는 '이번 학교급에서 모은 수료증'이 없어서, 가진 수료증과 명예 교장실에 쓴 수료증을 더해 채워요
    let spent = 0;
    for (const k in s.p.perk) for (let L = 0; L < s.p.perk[k]; L++) spent += PERKS[k].cost(L);
    s.tdip = num(d.tdip, 0, s.p.dip + spent);
    s.u.boost = !!(d.u && d.u.boost) || s.t.owl >= 1;
    s.u.dev = !!(d.u && d.u.dev);
    s.units = d.units === 'en' ? 'en' : 'ko';
    // 학교 번호는 기기를 옮겨도 그대로예요. 예전 저장에는 없어서 새로 만들고, 처음 연 날은 마지막 저장 때로 어림해요
    if (typeof d.pid === 'string' && /^[0-9A-Z]{6,16}$/.test(d.pid)) s.pid = d.pid;
    s.born = Math.min(num(d.born, 0, s.savedAt), Date.now());
    // 황금 도토리: 예전 저장에도 처음 선물 5개를 줘요. 꾸미기는 산 것만 입을 수 있어요
    s.gold = Math.floor(num(d.gold, 0, s.gold));
    if (d.gd && typeof d.gd === 'object') { s.gd.day = typeof d.gd.day === 'string' ? d.gd.day.slice(0, 10) : ''; s.gd.n = Math.floor(num(d.gd.n, 0, 0)); s.gd.shop = Math.floor(num(d.gd.shop, 0, 0)); }
    if (d.cos && typeof d.cos === 'object') {
      s.cos.own = Array.isArray(d.cos.own) ? [...new Set(d.cos.own.filter(id => typeof id === 'string' && COS_IDS.has(id)))] : [];
      for (const k of Object.keys(COS)) { const v = d.cos[k]; s.cos[k] = typeof v === 'string' && s.cos.own.includes(k + ':' + v) ? v : ''; }
    }
    s.autoUntil = Math.min(num(d.autoUntil, 0, 0), Date.now() + 3 * 3600000);
    if (typeof d.tk === 'string') s.tk = d.tk.slice(0, 200);
    s.acctGift = !!d.acctGift;
    if (d.rank && typeof d.rank === 'object') {
      s.rank.name = cleanName(d.rank.name);
      s.rank.joined = !!d.rank.joined && !!s.rank.name;
      s.rank.sent = Math.floor(num(d.rank.sent, -1, -1));
      s.rank.by = typeof d.rank.by === 'string' ? d.rank.by.slice(0, 128) : '';
    }
    // 학교 점수(지금까지 받은 수료증)가 없던 저장은 이번 학교급의 수료증과 받은 기금으로 어림해요
    if (!s.st.dips) {
      let fundEver = s.fund;
      for (const k in s.fp) for (let L = 0; L < s.fp[k]; L++) fundEver += FPERKS[k].cost(L);
      s.st.dips = Math.floor(s.tdip + (s.tier > 0 ? Math.max(0, fundEver - s.tier) * FUND_PER : 0));
    }
    const q = sanitizeQ(d.q, num);
    if (q) s.q = q;   // 퀘스트가 없던 예전 저장이면 init이 false로 남아 시작할 때 진행도에 맞춰 건너뛴다
    // 아직 유치원인데 초등학교 장의 퀘스트에 와 있으면 유치원 졸업식 퀘스트로 되돌려요 (0.4에서는 전학생 퀘스트가 5장에 있었어요)
    const k1 = MAIN.findIndex(m => m.id === 'k1');
    if (s.tier === 0 && MAIN[s.q.m] && MAIN[s.q.m].ch > MAIN[k1].ch) { s.q.m = k1; s.q.mb = 0; }
    return s;
  }
  function sanitizeQ(q, num) {
    if (!q || typeof q !== 'object' || !q.init) return null;
    const out = freshQ();
    out.init = true;
    out.m = mainIndexFromSave(q, num);
    out.mb = num(q.mb, 0, 0);
    out.lat = typeof q.lat === 'string' ? q.lat.slice(0, 12) : '';
    out.seen = Math.min(out.m, Math.floor(typeof q.seen === 'number' && isFinite(q.seen) ? q.seen : -1));
    out.gen = Math.floor(num(q.gen, 0, 0));
    out.subDone = Math.floor(num(q.subDone, 0, 0));
    out.done = Array.isArray(q.done) ? q.done.filter(x => typeof x === 'string' && x.length < 12).slice(0, 100) : [];
    out.subs = (Array.isArray(q.subs) ? q.subs : [])
      .filter(x => x && typeof x.id === 'string' && WHO[x.who] && Q_TYPES.includes(x.t) &&
        (x.t !== 'fac' || FAC[x.k]) && (x.t !== 'tea' || TEA[x.k]) && typeof x.n === 'number' && isFinite(x.n) && x.n > 0)
      .slice(0, 3)
      .map(x => ({ id: x.id.slice(0, 12), who: x.who, t: x.t, k: x.k || null, n: x.n, r: num(x.r, 0, 0), b: num(x.b, 0, 0),
        nw: !!x.nw, say: typeof x.say === 'string' ? x.say.slice(0, 200) : '' }));
    return out;
  }
  function mainIndexFromSave(q, num) {
    const idx = id => MAIN.findIndex(m => m.id === id);
    if (typeof q.mid === 'string' && q.mid) {
      if (q.mid.startsWith('end:')) { const i = idx(q.mid.slice(4)); return i >= 0 ? i + 1 : MAIN.length; }
      const i = idx(q.mid);
      if (i >= 0) return i;
    }
    // v3 저장: 예전 번호 앞의 퀘스트는 모두 마친 것으로 보고, 새 순서에서 아직 안 한 첫 퀘스트부터 이어가요
    const done = new Set(LEGACY_IDS.slice(0, Math.floor(num(q.m, 0, 0))));
    const i = MAIN.findIndex(m => !done.has(m.id));
    return i >= 0 ? i : MAIN.length;
  }
  function syncMid() {
    const cm = MAIN[S.q.m];
    S.q.mid = cm ? cm.id : 'end:' + MAIN[MAIN.length - 1].id;
  }
  function load() {
    try { const raw = localStorage.getItem(SAVE_KEY); return raw ? sanitize(JSON.parse(raw)) : null; } catch (e) { return null; }
  }
  function save(at) {
    if (!S || rt.adopting) return;   // 다른 학교로 바꾸며 다시 여는 중에는 지금 학교를 저장하지 않아요
    S.savedAt = at || (rt.paused ? rt.closedAt : Date.now());
    syncMid();
    const json = JSON.stringify(S);
    try { localStorage.setItem(SAVE_KEY, json); } catch (e) { /* 저장소가 막혀 있어도 게임은 계속 */ }
    if (AIT) AIT.storage.setItem(SAVE_KEY, json).catch(() => {});   // 토스 앱 저장소 (앱을 지워도 남는 건 아니에요)
    Cloud.dirty = true;   // 서버에는 조금씩 모았다가 올려요
  }

  /* ---------- 계산 ---------- */
  const capacity = () => CFG.cap0 + CFG.capStep * S.f.classroom;
  const rep = () => repOf(S);
  // 종업식으로 남는 배수: 장학금은 레벨마다 1.3배씩 곱해지고, 전학생은 한 명마다 +5%
  const legacyMult = () => Math.pow(1.3, S.p.perk.schol) * (1 + 0.05 * S.p.species) * Math.pow(2, S.fp.schol);
  const tuitionMult = () => (1 + 0.2 * S.f.cafeteria) * (1 + 0.15 * S.t.squirrel) * legacyMult();
  const feastOn = () => Date.now() < S.hd.feastUntil;
  const rate = () => Math.min(S.students, capacity()) * CFG.base * tuitionMult() * Math.pow(CFG.gradeMult, S.grade) * incomeScale() * (feastOn() ? 2 : 1);
  const offlineEff = () => Math.min(1, 0.3 + 0.15 * S.t.owl);
  const offlineCapH = () => CFG.offlineCapH + 4 * S.p.perk.night;
  const dropValue = () => rate() * 4 * (1 + 0.15 * S.t.bear) * (1 + 0.5 * S.p.perk.drop);
  function earn(v) { S.earned += v; S.yearEarned += v; }
  // 수료증 = 10 × √(올해 번 도토리 ÷ 100만) × 수료증 배수. 학교급이 오르면 공사비 배수로 나눠서 비슷한 장수가 나와요
  const dipMult = () => (1 + 0.25 * S.fp.dip) * (1 + 0.05 * S.f.science) * (S.hd.album ? 1.5 : 1);
  const previewDip = () => Math.floor(10 * Math.sqrt(S.yearEarned / (1e6 * costScale())) * dipMult() + 1e-9);
  const dipAt = d => Math.pow(d / (10 * dipMult()), 2) * 1e6 * costScale();
  // 졸업: 마지막 해(유치원 2년째)에 대도시 학교가 되면 졸업식을 열어요. 다음 학교급이 열려 있어야 해요
  const nextTierOpen = () => S.tier + 1 < TIER_OPEN;
  const finalYear = () => nextTierOpen() && S.tg >= tierInfo().grads;
  // 마지막 해에는 종업식 대신 졸업식을 열어요. 다음 학교급이 아직 안 열렸으면 종업식을 계속 열 수 있어요
  const canGraduate = () => S.grade >= GRAD_MIN && !finalYear();
  const canPromote = () => finalYear() && S.grade >= GRAD_MIN;
  // 기금 = 이 학교급에서 모은 수료증 5장마다 1 + 졸업 축하 1. 올해 수료증도 함께 쳐요
  const FUND_PER = 5;
  const previewFund = () => Math.floor((S.tdip + previewDip()) / FUND_PER) + 1;
  const fpCost = k => FPERKS[k].cost(S.fp[k]);
  function addDip(v) { S.p.dip += v; S.tdip += v; S.st.dips += v; rankDirty(); }
  const perkCost = k => PERKS[k].cost(S.p.perk[k]);
  const perkMaxed = k => !!PERKS[k].max && S.p.perk[k] >= PERKS[k].max;
  function todayStr(d) {
    d = d || new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  const boostLeft = () => BOOST.perDay - (S.ad.day === todayStr() ? S.ad.n : 0);
  const boostAmount = () => Math.max(100, nice(rate() * 60 * BOOST.min));
  const canStamp = () => S.att.last !== todayStr();
  const dealUnlocked = () => S.q.m >= 7 || S.st.grads > 0 || S.tier > 0;
  const dealLeft = () => DEAL.perDay - (S.hd.day === todayStr() ? S.hd.n : 0);
  // 출석부는 1장(튜토리얼)을 마친 뒤에 열어서 첫 몇 분이 너무 쉬워지지 않게 해요
  const attUnlocked = () => S.q.m >= 7 || S.st.grads > 0 || S.att.n > 0;
  const facCost = k => Math.ceil(FAC[k].cost(S.f[k]) * costScale());
  const teaCost = k => Math.ceil(TEA[k].cost(S.t[k]) * costScale());
  const teaMaxed = k => !!TEA[k].max && S.t[k] >= TEA[k].max;

  // 큰 숫자 줄여 쓰기: 기본은 토스처럼 만, 억, 조. 설정에서 K, M, B로 바꿀 수 있어요
  function fmt(n) {
    n = Math.floor(n + 1e-9);
    if (S && S.units === 'en') return fmtEn(n);
    if (n < 10000) return n.toLocaleString('ko-KR');
    const U = [['양', 1e28], ['자', 1e24], ['해', 1e20], ['경', 1e16], ['조', 1e12], ['억', 1e8], ['만', 1e4]];
    for (const [u, v] of U) {
      if (n >= v) {
        const x = n / v;
        let s;
        if (x >= 100) s = Math.floor(x).toLocaleString('ko-KR');
        else if (x >= 10) s = (Math.floor(x * 10) / 10).toFixed(1).replace(/\.0$/, '');
        else s = (Math.floor(x * 100) / 100).toFixed(2).replace(/0$/, '').replace(/\.0?$/, '');
        return s + u;
      }
    }
    return String(n);
  }
  // K, M, B, T 다음은 방치형 게임에서 흔한 aa, ab, ac ... (1000배씩)
  const EN_UNITS = ['', 'K', 'M', 'B', 'T'];
  const enUnit = e => e < EN_UNITS.length ? EN_UNITS[e]
    : String.fromCharCode(97 + Math.floor((e - EN_UNITS.length) / 26) % 26) + String.fromCharCode(97 + (e - EN_UNITS.length) % 26);
  function fmtEn(n) {
    if (n < 1000) return String(n);
    let e = Math.min(Math.floor(Math.log10(n) / 3), 300), x = n / Math.pow(1000, e);
    if (x >= 1000) { e += 1; x /= 1000; }
    let s;
    if (x >= 100) s = String(Math.floor(x));
    else if (x >= 10) s = (Math.floor(x * 10) / 10).toFixed(1).replace(/\.0$/, '');
    else s = (Math.floor(x * 100) / 100).toFixed(2).replace(/0$/, '').replace(/\.0?$/, '');
    return s + enUnit(e);
  }
  const fmtRate = r => r < 10 ? (Math.floor(r * 10) / 10).toFixed(1) : fmt(r);
  function fmtDur(sec) {
    sec = Math.floor(sec);
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
    if (h > 0) return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
    if (m > 0) return `${m}분`;
    return `${sec}초`;
  }
  const fmtDate = d => `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  const rand = (a, b) => a + Math.random() * (b - a);
  // 보상과 목표를 보기 좋은 숫자로: 137 → 140, 1234 → 1200
  function nice(x) {
    if (!(x > 0)) return 10;
    if (x < 100) return Math.max(10, Math.round(x / 10) * 10);
    const p = Math.pow(10, Math.floor(Math.log10(x)) - 1);
    return Math.round(x / p) * p;
  }
  // 받침이 있으면 '을', 없으면 '를'
  const eul = w => { const c = w.charCodeAt(w.length - 1); return w + ((c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28) ? '을' : '를'); };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- 소리와 진동 ---------- */
  let actx = null, master = null;
  function ensureAudio() {
    if (!S || !S.sound) return;
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try { actx = new AC(); master = actx.createGain(); master.gain.value = 0.5; master.connect(actx.destination); } catch (e) { actx = null; return; }
    }
    if (actx.state === 'suspended' && !document.hidden && !rt.paused) actx.resume().catch(() => {});
  }
  function note(freq, at, dur, type, vol, partial) {
    const t0 = actx.currentTime + at;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
    if (partial) {
      const o2 = actx.createOscillator(), g2 = actx.createGain();
      o2.type = 'sine'; o2.frequency.setValueAtTime(freq * partial, t0);
      g2.gain.setValueAtTime(0.0001, t0);
      g2.gain.exponentialRampToValueAtTime(vol * 0.25, t0 + 0.012);
      g2.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * 0.6);
      o2.connect(g2); g2.connect(master); o2.start(t0); o2.stop(t0 + dur);
    }
  }
  function sfx(name) {
    if (!S || !S.sound) return;
    ensureAudio();
    if (!actx) return;
    try {
      if (name === 'tap') note(740, 0, 0.07, 'triangle', 0.07);
      else if (name === 'coin') { note(988, 0, 0.1, 'triangle', 0.13); note(1319, 0.07, 0.18, 'triangle', 0.13); }
      else if (name === 'buy') { note(523.25, 0, 0.14, 'triangle', 0.12); note(659.25, 0.08, 0.14, 'triangle', 0.12); note(783.99, 0.16, 0.26, 'triangle', 0.12); }
      else if (name === 'deny') note(196, 0, 0.16, 'square', 0.04);
      else if (name === 'leaf') { note(1150, 0, 0.04, 'triangle', 0.022); note(860, 0.035, 0.05, 'triangle', 0.018); }
      else if (name === 'magpie') { note(1480, 0, 0.07, 'square', 0.03); note(1320, 0.13, 0.08, 'square', 0.03); }
      else if (name === 'done') { note(783.99, 0, 0.18, 'sine', 0.14, 2); note(1174.66, 0.12, 0.32, 'sine', 0.14, 2); }
      else if (name === 'quest') [1046.5, 1318.51, 1567.98, 2093].forEach((f, i) => note(f, i * 0.07, 0.22 + i * 0.05, 'triangle', 0.11));
      else if (name === 'bell') {
        // 학교 종소리: 딩동댕동 딩동댕동
        [659.25, 523.25, 587.33, 392.0, 392.0, 587.33, 659.25, 523.25]
          .forEach((f, i) => note(f, i * 0.42 + (i >= 4 ? 0.3 : 0), 1.3, 'sine', 0.17, 2.76));
      }
    } catch (e) { /* 소리 실패는 무시 */ }
  }
  function buzz(ms) {
    if (!S || !S.vibrate) return;
    try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* 진동을 못 쓰는 환경 */ }
  }

  /* ---------- 지도 만들기 ---------- */
  const map = $('#map'), layerKids = $('#kids'), layerFx = $('#fx'), layerTeachers = $('#teachers');
  // 숲의 나무: [x, y, 반지름, 사라지는 동네 단계]. 동네가 자라면 그 자리에 집과 가게가 들어서요
  const TREES = [[24,30,26,2],[62,12,20,1],[90,44,16,2],[14,88,20,1],[336,28,26,2],[298,10,20,1,1],[268,46,16,2,1],[350,90,22,1],[12,170,18,3],[350,178,18,3],[16,262,20],[22,360,24],[60,406,22],[100,410,16],[300,414,22],[352,392,20],[-30,40,30],[390,40,30],[-28,300,28],[392,300,28],[-20,430,26],[380,440,26]];
  // 동네 건물: [나타나는 단계, 종류, x, y(밑바닥), 크기, 모양]. 숲을 밀어내지 않고 숲과 함께 자라는 동네
  const TOWN = [
    [1, 'mush', 60, 30, 1, 0], [1, 'mush', 300, 28, 1, 1, 1], [1, 'mush', 16, 104, 0.72, 1], [1, 'mush', 346, 106, 0.72, 0, 1],
    [2, 'shop', 24, 60, 1, 0], [2, 'shop', 84, 62, 0.9, 1], [2, 'shop', 278, 62, 0.9, 2, 1], [2, 'shop', 336, 60, 1, 0],
    [2, 'lamp', 52, 68, 1, 0], [2, 'lamp', 308, 68, 1, 0, 1],
    [3, 'apt', 18, 40, 1, 0], [3, 'apt', 342, 40, 1, 1], [3, 'apt', 14, 220, 0.8, 1], [3, 'apt', 347, 212, 0.8, 0],
    [4, 'tower', 134, 44, 1, 0], [4, 'tower', 226, 44, 1.08, 1], [4, 'tower', 96, 30, 0.82, 1], [4, 'tower', 266, 30, 0.82, 0]
  ];
  function treeSVG(x, y, r) {
    return `<ellipse cx="${x}" cy="${y + r * 0.92}" rx="${r * 0.8}" ry="${r * 0.22}" class="c-shadow"/>` +
      `<rect x="${x - r * 0.14}" y="${y + r * 0.2}" width="${r * 0.28}" height="${r * 0.72}" rx="2" class="c-trunk"/>` +
      `<circle cx="${x}" cy="${y}" r="${r}" class="c-leaf2"/>` +
      `<circle cx="${x - r * 0.32}" cy="${y - r * 0.28}" r="${r * 0.58}" class="c-leaf1"/>` +
      `<circle cx="${x + r * 0.3}" cy="${y - r * 0.42}" r="${r * 0.38}" class="c-leaf3"/>`;
  }
  // 버섯집: 동그란 갓 지붕에 하얀 점
  function mushSVG(v) {
    return '<ellipse cx="0" cy="1" rx="17" ry="3.5" class="c-shadow"/>' +
      '<rect x="-11" y="-21" width="22" height="22" rx="6" class="c-wall"/>' +
      '<path d="M-4.5 1 V-6 a4.5 4.5 0 0 1 9 0 V1 Z" class="c-door"/>' +
      '<circle cx="6.5" cy="-12" r="2.6" class="c-window"/>' +
      `<path d="M-20 -17 Q-20 -40 0 -40 Q20 -40 20 -17 Q0 -11 -20 -17 Z" class="${v ? 'c-nut' : 'c-roof'}"/>` +
      '<circle cx="-9" cy="-28" r="3.2" class="c-awning2"/><circle cx="6" cy="-32" r="2.4" class="c-awning2"/><circle cx="12" cy="-22" r="2" class="c-awning2"/><circle cx="-1" cy="-21.5" r="1.6" class="c-awning2"/>';
  }
  // 가게: 줄무늬 차양과 간판
  function shopSVG(v) {
    const aw = ['c-awning', 'c-roof2', 'c-roof'][v];
    return '<ellipse cx="0" cy="1" rx="17" ry="3" class="c-shadow"/>' +
      '<rect x="-15" y="-26" width="30" height="27" class="c-wall2"/>' +
      '<rect x="-16.5" y="-30" width="33" height="5" rx="1.5" class="c-roof-edge"/>' +
      '<rect x="-9" y="-24.5" width="18" height="5" rx="1" class="c-signboard"/>' +
      `<path d="M-16 -18 h32 v5 h-32 z" class="${aw}"/>` +
      '<path d="M-12 -18 h4 v5 h-4 z M-4 -18 h4 v5 h-4 z M4 -18 h4 v5 h-4 z M12 -18 h4 v5 h-4 z" class="c-awning2"/>' +
      `<path d="M-16 -13 q2 3 4 0 q2 3 4 0 q2 3 4 0 q2 3 4 0 q2 3 4 0 q2 3 4 0 q2 3 4 0 q2 3 4 0 z" class="${aw}"/>` +
      '<rect x="-12" y="-9" width="11" height="7" rx="1" class="c-window"/>' +
      '<rect x="3" y="-10" width="8" height="11" rx="1" class="c-door"/>';
  }
  // 가로등: 밤이 되면 불이 켜져요
  const lampSVG = () => '<rect x="-0.9" y="-22" width="1.8" height="22" class="c-signboard"/>' +
    '<path d="M-4 -22 h8 l-1.6 -4 h-4.8 z" class="c-signboard"/><circle cx="0" cy="-20.4" r="2.4" class="c-lamp"/>';
  // 나무 아파트: 굵은 줄기에 창문이 줄지어 있고 꼭대기는 잎
  function aptSVG(v) {
    let w = '';
    for (let r = 0; r < 4; r++) for (const c of [-7.5, 2.5]) w += `<rect x="${c}" y="${-54 + r * 11.5}" width="5" height="6" rx="1" class="c-window"/>`;
    return '<ellipse cx="0" cy="1" rx="16" ry="3" class="c-shadow"/>' +
      '<rect x="-12" y="-62" width="24" height="63" rx="6" class="c-trunk"/>' + w +
      '<path d="M-8 -4 q2 -5 0 -10" class="s-bark"/>' +
      `<circle cx="${v ? 13 : -13}" cy="-30" r="5" class="c-leaf1"/><circle cx="${v ? -13 : 13}" cy="-44" r="4.6" class="c-leaf3"/>` +
      '<circle cx="0" cy="-66" r="15" class="c-leaf2"/><circle cx="-7" cy="-70" r="9" class="c-leaf1"/><circle cx="6" cy="-76" r="7" class="c-leaf3"/>' +
      '<rect x="-3.5" y="-9" width="7" height="10" rx="3.5" class="c-door"/>';
  }
  // 나무 빌딩: 대도시의 키 큰 줄기 건물. 꼭대기에는 빨간 불빛
  function towerSVG(v) {
    const h = v ? 112 : 100;
    let w = '';
    for (let y = -h + 10; y < -12; y += 9) for (const c of [-10, -2.5, 5]) w += `<rect x="${c}" y="${y}" width="5" height="5" rx="0.8" class="c-window"/>`;
    return '<ellipse cx="0" cy="1" rx="18" ry="3" class="c-shadow"/>' +
      `<rect x="-14" y="${-h}" width="28" height="${h + 1}" rx="4" class="c-trunk"/>` + w +
      `<ellipse cx="-14" cy="${-h * 0.38}" rx="7" ry="5" class="c-leaf1"/><ellipse cx="14" cy="${-h * 0.62}" rx="7" ry="5" class="c-leaf2"/><ellipse cx="-14" cy="${-h * 0.82}" rx="6" ry="4.4" class="c-leaf3"/>` +
      `<circle cx="0" cy="${-h - 4}" r="14" class="c-leaf2"/><circle cx="-6" cy="${-h - 8}" r="8" class="c-leaf1"/><circle cx="7" cy="${-h - 12}" r="6" class="c-leaf3"/>` +
      `<rect x="-0.8" y="${-h - 30}" width="1.6" height="14" class="c-signboard"/><circle cx="0" cy="${-h - 31}" r="2" class="c-seal"/>`;
  }
  const TOWN_ART = { mush: mushSVG, shop: shopSVG, lamp: lampSVG, apt: aptSVG, tower: towerSVG };
  // 나무와 동네 건물을 밑바닥 y 순서로 그려서 뒤에 있는 것이 먼저 깔리게 해요
  function buildForest() {
    // 과학실이 들어설 자리(오른쪽 위)와 겹치는 것은 data-sci를 붙여서 초등학교부터 치워요
    const items = TREES.map(([x, y, r, gone, sci]) => ({ y: y + r * 0.92, svg: `<g${gone ? ` data-gone="${gone}"` : ''}${sci ? ' data-sci="1"' : ''}>${treeSVG(x, y, r)}</g>` }))
      .concat(TOWN.map(([st, type, x, y, sc, v, sci]) => ({ y, svg: `<g data-stage="${st}"${sci ? ' data-sci="1"' : ''} transform="translate(${x} ${y}) scale(${sc})" style="display:none"><g class="tw">${TOWN_ART[type](v)}</g></g>` })));
    items.sort((a, b) => a.y - b.y);
    $('#forest').innerHTML = items.map(i => i.svg).join('');
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
  const TPOS = { squirrel: [209, 120, 0.42], bear: [300, 350, 0.5] };
  function buildTeachersOnMap() {
    // 고슴도치 교감 선생님은 늘 교실 문 왼쪽에 서 있어요
    layerTeachers.innerHTML = `<g id="m-hedgehog" transform="translate(151 121) scale(.4)"><g class="tinner">${AV.hedgehog}</g></g>` +
      Object.keys(TEA).map(k => `<g id="m-${k}"><g class="tinner">${AV[k]}</g></g>`).join('');
  }
  function renderTeachersOnMap() {
    for (const k of Object.keys(TEA)) {
      const g = $('#m-' + k);
      g.style.display = S.t[k] > 0 ? '' : 'none';
      let p = TPOS[k];
      if (k === 'owl') p = S.f.library > 0 ? [101, 120, 0.5] : [32, 14, 0.45];
      g.setAttribute('transform', `translate(${p[0]} ${p[1]}) scale(${p[2]})`);
    }
  }

  /* ---------- 학생들 ---------- */
  const BASE_SPECIES = ['rabbit', 'fox', 'raccoon', 'chick', 'bear'];
  // 종업식과 졸업식마다 전학 온 친구가 학생 무리에 섞여요
  const speciesList = () => BASE_SPECIES.concat(NEWCOMERS.slice(0, S.p.species).map(n => n.k));
  const BODY = { rabbit: 'f-rabbit', fox: 'f-fox', raccoon: 'f-raccoon', chick: 'f-chick', bear: 'f-bear',
    cat: 'f-cat', dog: 'f-dog', penguin: 'f-peng', panda: 'f-panda-dark', koala: 'f-koala', otter: 'f-otter' };
  const EYE_LIGHT = new Set(['raccoon', 'panda']);
  const HEAD = {
    rabbit: '<ellipse cx="-2.6" cy="-9" rx="2" ry="5.4" class="f-rabbit"/><ellipse cx="2.6" cy="-9" rx="2" ry="5.4" class="f-rabbit"/><ellipse cx="-2.6" cy="-8.6" rx="0.9" ry="3.6" class="f-pink"/><ellipse cx="2.6" cy="-8.6" rx="0.9" ry="3.6" class="f-pink"/><circle r="6" class="f-rabbit"/>',
    fox: '<path d="M-6 -1.5 L-5 -10 L-0.8 -5 Z" class="f-fox"/><path d="M6 -1.5 L5 -10 L0.8 -5 Z" class="f-fox"/><circle r="6" class="f-fox"/><path d="M-5.6 1 Q0 7 5.6 1 Q0 3.4 -5.6 1 Z" class="f-fox-light"/>',
    raccoon: '<circle cx="-4.6" cy="-4.4" r="2.4" class="f-raccoon"/><circle cx="4.6" cy="-4.4" r="2.4" class="f-raccoon"/><circle r="6" class="f-raccoon"/><rect x="-5.4" y="-2.2" width="10.8" height="3.2" rx="1.6" class="f-mask"/>',
    chick: '<circle r="6" class="f-chick"/><path d="M-1.2 -5.6 Q0 -9.4 1.4 -5.8" class="s-tuft"/><path d="M-1.6 0.8 L0 2.8 L1.6 0.8 Z" class="f-beak"/>',
    bear: '<circle cx="-4.6" cy="-4.4" r="2.3" class="f-bear"/><circle cx="4.6" cy="-4.4" r="2.3" class="f-bear"/><circle r="6" class="f-bear"/><ellipse cx="0" cy="2" rx="2.6" ry="2" class="f-bear-light"/><circle cx="0" cy="1.4" r="0.8" class="f-eye"/>',
    cat: '<path d="M-5.6 -1.6 L-4.8 -9.2 L-1.2 -5.4 Z" class="f-cat"/><path d="M5.6 -1.6 L4.8 -9.2 L1.2 -5.4 Z" class="f-cat"/><path d="M-4.6 -3.6 L-4.3 -7.2 L-2.5 -5.3 Z M4.6 -3.6 L4.3 -7.2 L2.5 -5.3 Z" class="f-pink"/><circle r="6" class="f-cat"/><path d="M-1.4 -5.6 v1.8 M0 -5.9 v2.2 M1.4 -5.6 v1.8" class="s-cat"/><path d="M-0.9 1.1 L0.9 1.1 L0 2 Z" class="f-pink"/><path d="M-3.2 1.8 h-3.6 M-3.2 2.8 l-3.2 0.9 M3.2 1.8 h3.6 M3.2 2.8 l3.2 0.9" class="s-whisker"/>',
    dog: '<circle r="6" class="f-dog"/><ellipse cx="-5.6" cy="-0.4" rx="2" ry="4.3" transform="rotate(18 -5.6 -0.4)" class="f-dog-ear"/><ellipse cx="5.6" cy="-0.4" rx="2" ry="4.3" transform="rotate(-18 5.6 -0.4)" class="f-dog-ear"/><ellipse cx="0" cy="1.7" rx="1.3" ry="0.95" class="f-eye"/><path d="M0 2.6 v0.9" class="s-mouth"/>',
    penguin: '<circle r="6" class="f-peng"/><path d="M-4.4 0.2 Q-4.4 -4 -1.2 -3.6 Q0 -2.4 1.2 -3.6 Q4.4 -4 4.4 0.2 Q4.4 4.8 0 5 Q-4.4 4.8 -4.4 0.2 Z" class="f-peng-light"/><path d="M-1.3 1.2 L1.3 1.2 L0 2.9 Z" class="f-beak"/>',
    panda: '<circle cx="-4.6" cy="-4.6" r="2.2" class="f-panda-dark"/><circle cx="4.6" cy="-4.6" r="2.2" class="f-panda-dark"/><circle r="6" class="f-panda"/><ellipse cx="-2.4" cy="-0.5" rx="1.8" ry="1.5" transform="rotate(-20 -2.4 -0.5)" class="f-panda-dark"/><ellipse cx="2.4" cy="-0.5" rx="1.8" ry="1.5" transform="rotate(20 2.4 -0.5)" class="f-panda-dark"/><ellipse cx="0" cy="1.9" rx="1" ry="0.7" class="f-eye"/>',
    koala: '<circle cx="-5.4" cy="-3.4" r="3.2" class="f-koala"/><circle cx="5.4" cy="-3.4" r="3.2" class="f-koala"/><circle cx="-5.4" cy="-3.4" r="1.8" class="f-koala-light"/><circle cx="5.4" cy="-3.4" r="1.8" class="f-koala-light"/><circle r="6" class="f-koala"/><ellipse cx="0" cy="1.4" rx="1.5" ry="2" class="f-eye"/>',
    otter: '<circle cx="-4.6" cy="-4" r="1.6" class="f-otter"/><circle cx="4.6" cy="-4" r="1.6" class="f-otter"/><circle r="6" class="f-otter"/><ellipse cx="0" cy="2" rx="3.6" ry="2.6" class="f-otter-light"/><ellipse cx="0" cy="1" rx="1" ry="0.7" class="f-eye"/><path d="M-2.4 2.2 h-3.4 M-2.4 3 l-3 0.8 M2.4 2.2 h3.4 M2.4 3 l3 0.8" class="s-whisker"/>'
  };
  // 학생 옷차림은 학교급마다 달라요. 유치원은 노란 모자와 이름표, 초등학교는 책가방과 실내화 주머니
  function kidSVG(sp, bag, look) {
    const eyeCls = EYE_LIGHT.has(sp) ? 'f-eye-light' : 'f-eye';
    const kinder = !(S && S.tier >= 1);
    const hat = look ? look.hat : (S ? S.cos.hat : ''), neck = look ? look.neck : (S ? S.cos.neck : '');
    return `<ellipse cx="0" cy="12.4" rx="5.6" ry="1.6" class="c-shadow"/>` +
      (kinder ? '' : `<rect x="-6.6" y="7.4" width="3.2" height="3.6" rx="0.8" class="f-bag${(bag + 1) % 3}"/>`) +
      `<rect x="-3.6" y="4.2" width="7.2" height="7.6" rx="3.4" class="${BODY[sp]}"/>` +
      (sp === 'penguin' ? '<ellipse cx="-0.6" cy="8.4" rx="2.2" ry="2.9" class="f-peng-light"/>' : '') +
      (kinder ? '<rect x="-2.9" y="5.6" width="3.6" height="2.6" rx="0.6" class="c-dip"/>'
        : `<rect x="1.6" y="4.6" width="4.2" height="5.6" rx="1.4" class="f-bag${bag}"/>`) +
      HEAD[sp] + (neck ? NECKS[neck] : '') +
      (hat ? HATS[hat] : kinder ? '<path d="M-6.3 -3.2 Q-6.6 -9.8 0 -10 Q6.6 -9.8 6.3 -3.2 Z" class="f-hat"/><ellipse cx="0" cy="-3.3" rx="7.4" ry="1.5" class="f-hat"/><path d="M-6 -4.4 Q0 -3.4 6 -4.4" class="s-hatband"/>' : '') +
      `<circle cx="-2.3" cy="-0.6" r="0.95" class="${eyeCls}"/><circle cx="2.3" cy="-0.6" r="0.95" class="${eyeCls}"/>` +
      (sp === 'chick' ? '' : '<ellipse cx="-3.7" cy="1.8" rx="1.2" ry="0.8" class="f-cheek"/><ellipse cx="3.7" cy="1.8" rx="1.2" ry="0.8" class="f-cheek"/>');
  }
  const SPOTS = [[150,204],[180,214],[210,204],[164,228],[196,228],[136,214],[224,214],[180,186],[118,262],[240,262],[122,330],[160,318],[206,330],[142,352],[190,354],[236,322],[96,338],[244,350]];
  function pickTarget(k) {
    let i;
    do { i = Math.floor(Math.random() * SPOTS.length); } while (i === k.spot && SPOTS.length > 1);
    k.spot = i;
    k.tx = SPOTS[i][0] + rand(-7, 7);
    k.ty = SPOTS[i][1] + rand(-5, 5);
  }
  function placeKid(k, bob) {
    k.g.setAttribute('transform', `translate(${k.x.toFixed(1)} ${(k.y + bob).toFixed(1)}) scale(.85)`);
  }
  function addKid(fromGate) {
    const list = speciesList();
    const sp = list[rt.kidSeq % list.length];
    const bag = Math.floor(rt.kidSeq / list.length) % 3;
    rt.kidSeq++;
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'kid');
    g.innerHTML = kidSVG(sp, bag);
    layerKids.appendChild(g);
    const k = { g, sp, bag, x: 0, y: 0, tx: 0, ty: 0, spot: -1, wait: rand(0, 2), speed: rand(14, 22), phase: rand(0, 6), moving: false };
    pickTarget(k);
    if (fromGate && !rt.reduced) { k.x = 180 + rand(-8, 8); k.y = 436; k.wait = 0; }
    else { k.x = k.tx; k.y = k.ty; pickTarget(k); }
    placeKid(k, 0);
    rt.kids.push(k);
  }
  function syncKids(initial) {
    const want = Math.min(CFG.maxKids, Math.floor(S.students));
    while (rt.kids.length < want) addKid(!initial);
    while (rt.kids.length > want) { const k = rt.kids.pop(); k.g.remove(); }
  }
  function updateKids(dt, now) {
    if (rt.reduced) return;
    for (const k of rt.kids) {
      if (k.wait > 0) { k.wait -= dt; k.moving = false; }
      else {
        const dx = k.tx - k.x, dy = k.ty - k.y, d = Math.hypot(dx, dy);
        if (d < 0.8) { k.wait = rand(1, 4.5); pickTarget(k); k.moving = false; }
        else { const st = Math.min(d, k.speed * dt); k.x += dx / d * st; k.y += dy / d * st; k.moving = true; }
      }
      placeKid(k, k.moving ? -Math.abs(Math.sin(now / 110 + k.phase)) * 1.6 : 0);
    }
    rt.sortT += dt;
    if (rt.sortT > 0.5) {
      rt.sortT = 0;
      rt.kids.slice().sort((a, b) => a.y - b.y).forEach(k => layerKids.appendChild(k.g));
    }
  }

  /* ---------- 도토리 떨어지기 ---------- */
  function shakeOak() {
    const c = $('#oakCanopy');
    c.classList.remove('shake'); void c.getBBox(); c.classList.add('shake');
    if (S.t.bear > 0) { const b = $('#m-bear .tinner'); b.classList.remove('hop'); void b.getBBox(); b.classList.add('hop'); }
  }
  // 떨어질 자리: 이미 떨어진 도토리와 겹치지 않게 몇 군데 골라 보고 가장 떨어진 곳에 놓아요
  // near: 참나무를 눌러 떨어뜨린 도토리는 나무 가까이에 떨어져요
  function dropSpot(near) {
    let best = null, bestD = -1;
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random());
      const x = near ? 235 + Math.cos(a) * 36 * r : 165 + Math.cos(a) * 90 * r;
      const y = near ? 332 + Math.sin(a) * 18 * r : 336 + Math.sin(a) * 30 * r;
      const d = rt.drops.reduce((m, o) => Math.min(m, Math.hypot(o.x - x, o.y - y)), 99);
      if (d > bestD) { bestD = d; best = [x, y]; }
      if (d >= 26) break;
    }
    return best;
  }
  function spawnDrop(near) {
    const [x, y] = dropSpot(near);
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'drop');
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', '떨어진 도토리 줍기');
    g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    g.innerHTML = `<circle r="18" class="drop-hit"/><circle r="13" class="drop-ring"/><ellipse cx="0" cy="9" rx="6" ry="1.8" class="c-shadow"/><g class="drop-bob"><g class="drop-fall"><g transform="scale(1.3)">${ACORN}</g></g></g>`;
    layerFx.appendChild(g);
    const d = { g, x, y, born: performance.now(), dead: false };
    g.addEventListener('click', e => { e.stopPropagation(); collect(d); });
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); collect(d); } });
    rt.drops.push(d);
    const fall = g.querySelector('.drop-fall');
    if (!rt.reduced && fall.animate) {
      const dx = 318 - x, dy = 302 - y;
      fall.animate([
        { transform: `translate(${dx}px, ${dy}px)` },
        { transform: `translate(${dx * 0.45}px, ${Math.min(dy * 0.45, -18)}px)`, offset: 0.45 },
        { transform: 'translate(0px, 0px)' }
      ], { duration: 650, easing: 'ease-in' });
    }
    shakeOak();
  }
  function tapOak() {
    if (rt.paused) return;
    shakeOak(); sfx('leaf');
    if (S.f.playground < 1) { oakHint(`${eul(FAC.playground.name)} 지으면 참나무 도토리를 주울 수 있어요`); return; }
    if (S.oak < 1) { oakHint(`참나무가 도토리를 다시 맺는 중이에요. ${Math.ceil((1 - S.oak) * OAK.regen)}초만 기다려요`); return; }
    if (rt.drops.length >= OAK.ground) { oakHint('떨어진 도토리를 먼저 주워 주세요'); return; }
    S.oak -= 1; S.st.shakes += 1;
    spawnDrop(true);
    renderOak();
  }
  function oakHint(msg) {
    const now = Date.now();
    if (now - rt.oakHintAt > 2500) { rt.oakHintAt = now; toast(msg); }
  }
  // 나무에 달린 도토리 수만큼 열매를 보여 줘요 (여섯 자리)
  function renderOak() {
    const n = S.f.playground >= 1 ? Math.min(6, Math.ceil(S.oak * 6 / OAK.max - 1e-9)) : 0;
    if (rt.oakN === n) return;
    rt.oakN = n;
    $$('.oak-nut').forEach((c, i) => c.classList.toggle('off', i >= n));
    $('#oak').setAttribute('aria-label', S.f.playground >= 1 ? `참나무 흔들기, 도토리가 ${Math.floor(S.oak)}개 달려 있어요` : '참나무');
  }
  function removeDrop(d) {
    d.dead = true;
    rt.drops = rt.drops.filter(x => x !== d);
    d.g.style.pointerEvents = 'none';
    if (!rt.reduced && d.g.animate) d.g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180 }).onfinish = () => d.g.remove();
    else d.g.remove();
  }
  function collect(d) {
    if (d.dead || rt.paused) return;
    const v = dropValue();
    S.budget += v; earn(v);
    S.st.picks += 1;
    floatText(d.x, d.y - 12, '+' + fmt(v), 'gold');
    sfx('coin'); buzz(12);
    removeDrop(d);
    renderHUD(); renderAffordance();
  }
  function updateDrops(now) {
    for (const d of rt.drops.slice()) {
      const age = now - d.born;
      if (autoOn() && age > 700) { collect(d); continue; }   // 자동 줍기 부스터
      if (age > CFG.dropLife) removeDrop(d);
      else if (age > CFG.dropLife - 3000 && !d.g.classList.contains('blink')) d.g.classList.add('blink');
    }
  }
  function clearDrops() { rt.drops.forEach(d => d.g.remove()); rt.drops = []; }

  function floatText(x, y, txt, cls) {
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', x.toFixed(1)); t.setAttribute('y', y.toFixed(1));
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('class', 'float' + (cls ? ' ' + cls : ''));
    t.textContent = txt;
    layerFx.appendChild(t);
    if (rt.reduced || !t.animate) { setTimeout(() => t.remove(), 1000); return; }
    t.animate([{ transform: 'translateY(0px)', opacity: 1 }, { transform: 'translateY(-24px)', opacity: 0 }],
      { duration: 1300, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => t.remove();
  }

  /* ---------- 화면 그리기 ---------- */
  function renderHUD() {
    $('#vBudget').textContent = fmt(S.budget);
    $('#vRate').textContent = `초당 +${fmtRate(rate())}${feastOn() ? ' ×2' : ''}`;
    renderDeal();
    $('#vStudents').textContent = `${Math.floor(S.students)}/${capacity()}`;
    const r = rep();
    $('#vRep').textContent = r;
    renderWallet();
    fitText($('#vBudget'), 17); fitText($('#vRate'), 11); fitText($('#vStudents'), 15); fitText($('#vRep'), 15);
    if (!$('#statDip').hidden) { fitText($('#vDip'), 15); if (!$('#vFundRow').hidden) fitText($('#vFundRow'), 11); }
    const G = CFG.grades, g = S.grade;
    $('#schoolName').textContent = tierInfo().school;
    renderYear();
    $('#gradePill').textContent = G[g].name;
    let p = 1, txt = finalYear() ? '대도시예요! 졸업식을 열 수 있어요' : '대도시예요! 종업식을 열 수 있어요';
    if (g < G.length - 1) {
      const lo = townRep(g), hi = townRep(g + 1);
      p = Math.max(0, Math.min(1, (r - lo) / (hi - lo)));
      txt = `${G[g + 1].name}까지 ★${Math.max(0, hi - r)}`;
    }
    $('#barFill').style.width = (p * 100).toFixed(1) + '%';
    $('#gradeBar').setAttribute('aria-valuenow', Math.round(p * 100));
    $('#vNext').textContent = txt;
  }
  // 칠판 숫자가 칸보다 길면 글자를 줄여서 한 칸에 맞춰요. 글자 수나 칸 너비가 바뀔 때만 다시 재요
  function fitText(el, min) {
    const key = el.textContent.length + '|' + rt.fitKey;
    if (el.dataset.fit === key) return;
    el.dataset.fit = key;
    el.style.fontSize = '';
    let size = parseFloat(getComputedStyle(el).fontSize);
    while (el.scrollWidth > el.clientWidth + 0.5 && size > min) { size -= 1; el.style.fontSize = size + 'px'; }
  }
  const refit = () => { rt.fitKey = `${window.innerWidth}x${window.innerHeight}|${$('#stats').classList.contains('has-dip') ? 4 : 3}|${rt.fitGen}`; };
  // 칠판 제목 아래: 올해가 몇 년째(몇 학년)인지, 이 학교에서 몇 번째 해인지 점으로 보여 줘요
  function renderYear() {
    const T = tierInfo(), yn = yearNo(), last = finalYear();
    const key = `${S.tier}|${yn}|${last ? 1 : 0}`;
    if (rt.yearKey === key) return;
    rt.yearKey = key;
    $('#yearNow').textContent = `${yn}${T.unit}`;
    $('#yearDots').innerHTML = Array.from({ length: T.years }, (_, i) => `<i class="${i < yn - 1 ? 'on' : i === yn - 1 ? 'now' : ''}"></i>`).join('');
    $('#yearNote').textContent = last ? '졸업반' : '';
  }
  // 가진 재화: 수료증은 처음 받았을 때부터, 기금은 졸업한 뒤부터 칠판에 보여요
  const dipShown = () => S.st.grads > 0 || S.tier > 0 || S.tdip > 0 || S.p.dip > 0;
  const fundShown = () => S.tier > 0 || S.fund > 0;
  function renderWallet() {
    const b = $('#statDip'), on = dipShown();
    if (b.hidden === on) { b.hidden = !on; $('#stats').classList.toggle('has-dip', on); refit(); }
    if (!on) return;
    const dv = fmt(S.p.dip), fo = fundShown(), fv = fmt(S.fund);
    const key = dv + '|' + (fo ? fv : '');
    if (b.dataset.k === key) return;
    b.dataset.k = key;
    $('#vDip').textContent = dv;
    $('#vFundRow').hidden = !fo;
    if (fo) $('#vFund').textContent = `기금 ${fv}`;
    b.setAttribute('aria-label', `수료증 ${dv}장${fo ? `, 장학재단 기금 ${fv}` : ''}. 눌러서 졸업 탭 열기`);
  }
  // 학교급마다 교실 그림이 달라서, 지금 보이는 그림 속 종을 찾아요
  const lookOf = k => $(`#b-${k} .look-${S.tier >= 1 ? 1 : 0}`) || $(`#b-${k} .built`);
  const bellEl = () => $('.bell', lookOf('classroom'));
  function ringBell() { const b = bellEl(); if (!b) return; b.classList.remove('ring'); void b.getBBox(); b.classList.add('ring'); }
  function renderMap() {
    map.classList.toggle('tier-0', !(S.tier >= 1));
    map.classList.toggle('tier-1', S.tier >= 1);
    renderTown(false);
    for (const k of facKeys()) {
      const L = S.f[k], g = $('#b-' + k);
      g.classList.toggle('is-built', L >= 1);
      $('#pl-' + k).textContent = L >= 1 ? `${FAC[k].name} Lv.${L}` : `${FAC[k].name} 짓기`;
      g.setAttribute('aria-label', L >= 1 ? `${FAC[k].name} 레벨 ${L}, 눌러서 업그레이드` : `${FAC[k].name}, 눌러서 짓기`);
    }
    renderTeachersOnMap();
    renderOak();
  }
  function renderAffordance() {
    for (const k of facKeys()) $('#pq-' + k).classList.toggle('can-buy', S.budget >= facCost(k));
    let any = false;
    for (const k of Object.keys(TEA)) if (!teaMaxed(k) && S.budget >= teaCost(k)) any = true;
    $('#tabDot').hidden = !any;
    if (rt.sheetKey) renderSheet();
    if (rt.tab === 'teachers') renderTeachers();
    checkQuests(false);
    renderQuestBar();
    renderSubBar();
    renderGuide();
    renderTeacherGuide();
    renderQuestPanel(false);
    updateQuestDot();
    renderBoostBtn();
    $('#btnAtt').hidden = !attUnlocked();
    $('#attDot').hidden = !attUnlocked() || !canStamp();
    $('#gDot').hidden = rt.tab === 'grad' || !(canGraduate() || canPromote() || Object.keys(PERKS).some(k => !perkMaxed(k) && S.p.dip >= perkCost(k)) || Object.keys(FPERKS).some(k => S.fund >= fpCost(k)));
    renderGradPanel(false);
  }

  /* ---------- 시설 시트 ---------- */
  function openSheet(k) {
    if (rt.paused) return;
    rt.sheetKey = k;
    $('#sheetArt').innerHTML = `<svg viewBox="${FAC[k].view}" aria-hidden="true">${lookOf(k).innerHTML}</svg>`;
    renderSheet();
    const w = $('#sheetWrap');
    w.hidden = false;
    requestAnimationFrame(() => w.classList.add('open'));
    $('#sheetBuy').focus({ preventScroll: true });
    sfx('tap');
  }
  function closeSheet() {
    if (!rt.sheetKey) return;
    const w = $('#sheetWrap');
    w.classList.remove('open');
    rt.sheetKey = null;
    setTimeout(() => { if (!rt.sheetKey) w.hidden = true; }, 230);
  }
  function renderSheet() {
    const k = rt.sheetKey; if (!k) return;
    const F = FAC[k], L = S.f[k], c = facCost(k), ok = S.budget >= c;
    $('#sheetTitle').textContent = F.name;
    $('#sheetSub').textContent = L >= 1 ? `Lv.${L}` : '아직 짓지 않았어요';
    $('#sheetDesc').textContent = F.desc;
    $('#effNow').textContent = F.eff(L);
    $('#effNextLabel').textContent = L >= 1 ? '다음 레벨' : '지으면';
    $('#effNext').textContent = F.eff(L + 1);
    $('#sheetRep').textContent = k === 'library' ? '도서관은 평판을 가장 많이 올려요. 평판이 쌓이면 학교 등급이 올라가요.' : `레벨이 오를 때마다 평판도 ★${F.rep} 올라요.`;
    $('#sheetBuyLabel').textContent = L >= 1 ? '업그레이드' : '짓기';
    $('#sheetCost').textContent = fmt(c);
    $('#sheetBuy').setAttribute('aria-disabled', ok ? 'false' : 'true');
    // 이 시설이 지금 퀘스트 목표라면 시트 안에서도 알려 줘요
    const mq = curMain();
    let qtxt = '';
    if (mq && !mainReady() && ((mq.t === 'fac' && mq.k === k) || (mq.t === 'students' && k === 'classroom' && capacity() < mq.n))) {
      qtxt = `메인 퀘스트 ${qNo(S.q.m)}: ${qGoal(mq)}`;
    } else {
      const s = S.q.subs.find(x => x.t === 'fac' && x.k === k && !subReady(x));
      if (s) qtxt = `${WHO[s.who]}의 부탁: ${qGoal(s)}`;
    }
    const qn = $('#sheetQuest');
    qn.hidden = !qtxt;
    qn.textContent = qtxt;
    $('#sheetNeed').textContent = ok ? ' ' : `도토리 ${fmt(Math.ceil(c - S.budget))}개가 더 필요해요`;
  }
  function buyFacility(k, price) {
    const c = price || facCost(k);
    if (S.budget < c) return false;
    const was = S.f[k], wasReady = mainReady();
    S.budget -= c;
    S.f[k] = was + 1;
    S.st.ups += 1;
    // 1장에서는 퀘스트 목표를 이루면 시트를 닫아 알림줄의 받기 버튼이 보이게 해요
    setTimeout(() => {
      if (!wasReady && mainReady() && S.q.m < 7 && rt.sheetKey === k) closeSheet();
    }, 550);
    const L = S.f[k], n = FAC[k].name;
    if (k === 'classroom') toast(`교실 Lv.${L}! 정원이 ${capacity()}명으로 늘었어요`);
    else if (was === 0 && k === 'cafeteria') toast('급식실을 지었어요! 수업료 +20%');
    else if (was === 0 && k === 'library') toast('도서관을 지었어요! 평판 ★3');
    else if (was === 0 && k === 'science') toast('과학실을 지었어요! 수료증 +5%, 평판 ★1');
    else if (was === 0 && k === 'playground') { toast(`${eul(FAC.playground.name)} 지었어요! 옆 참나무를 누르면 도토리가 떨어져요`); rt.dropT = dropIntervalFor(1) - 3; }
    else toast(`${n} Lv.${L}! ${FAC[k].eff(L)}`);
    afterPurchase();
    return true;
  }

  /* ---------- 선생님 ---------- */
  function buildTeacherCards() {
    $('#teacherList').innerHTML = Object.keys(TEA).map(k => `
      <article class="tcard" data-k="${k}">
        <div class="tav"><svg viewBox="-24 -24 48 48" aria-hidden="true">${AV[k]}</svg></div>
        <div>
          <div class="thead"><h3>${TEA[k].name}</h3><span class="chip">${TEA[k].subject}</span><span class="chip qchip">퀘스트</span><span class="tlv"></span></div>
          <p class="tdesc">${TEA[k].desc}</p>
          <div class="teff"><span class="k">지금</span><span class="v now"></span><span class="k k-next">연수 후</span><span class="v next"></span></div>
          <p class="tnote" hidden></p>
          <button class="cta split small" type="button" data-k="${k}"><span class="lbl"></span><span class="cost">${acornIcon()}<b></b></span></button>
        </div>
      </article>`).join('');
  }
  function renderTeachers() {
    for (const k of Object.keys(TEA)) {
      const card = $(`.tcard[data-k="${k}"]`), T = TEA[k], L = S.t[k], maxed = teaMaxed(k), c = teaCost(k);
      card.classList.toggle('away', L < 1);
      $('.tlv', card).textContent = L < 1 ? '아직 안 오셨어요' : `Lv.${L}`;
      $('.now', card).textContent = T.eff(L);
      $('.k-next', card).textContent = L < 1 ? '모시면' : '연수 후';
      $('.next', card).textContent = maxed ? '최고 레벨이에요' : T.eff(L + 1);
      const note = $('.tnote', card);
      const needPg = k === 'bear' && S.f.playground < 1;
      note.hidden = !needPg;
      note.textContent = needPg ? `${eul(FAC.playground.name)} 지어야 효과가 나요.` : '';
      const btn = $('button', card);
      $('.lbl', btn).textContent = maxed ? '최고 레벨' : (L < 1 ? '모셔 오기' : '연수 보내기');
      $('.cost', btn).hidden = maxed;
      $('.cost b', btn).textContent = fmt(c);
      btn.setAttribute('aria-disabled', (maxed || S.budget < c) ? 'true' : 'false');
    }
  }
  function teacherAct(k, btn, price) {
    if (rt.paused || teaMaxed(k)) return false;
    const c = price || teaCost(k);
    if (S.budget < c) { if (btn) shake(btn); return false; }
    const was = S.t[k];
    S.budget -= c;
    S.t[k] = was + 1;
    if (was >= 1) S.st.trains += 1;
    if (k === 'owl' && !S.u.boost) {
      S.u.boost = true;
      toast('부엉이 선생님이 오셔서 보충수업이 열렸어요! 지도 왼쪽 위를 눌러 보세요');
    } else toast(was < 1 ? `${TEA[k].name}이 오셨어요!` : `${TEA[k].name} 연수 끝! Lv.${S.t[k]}`);
    afterPurchase();
    return true;
  }

  /* ---------- 구매 뒤 처리와 학교 등급 ---------- */
  function afterPurchase() {
    sfx('buy'); buzz(10);
    checkGrade();
    renderMap(); renderHUD(); renderAffordance();
    save();
  }
  function checkGrade() {
    const g = gradeOf(rep());
    if (g <= S.grade) return;
    const first = g > S.best;
    S.grade = g;
    S.best = Math.max(S.best, g);
    renderTown(true);
    const reward = Math.round(rate() * 60);
    S.budget += reward; earn(reward);
    if (first) {
      // 처음 오른 등급만 상장을 줘요. 종업식 뒤 다시 오를 때는 알림만
      S.certNo += 1;
      const no = S.certNo;
      queueModal(() => showCertificate(g, reward, no));
    } else {
      toast(`다시 ${CFG.grades[g].title}가 되었어요! 축하 도토리 +${fmt(reward)}`);
      sfx('done');
      ringBell();
    }
  }
  function showCertificate(g, reward, no) {
    const gr = CFG.grades[g];
    $('#certNo').textContent = `제 ${new Date().getFullYear()}-${no} 호`;
    const need = townRep(g);
    $('#certTo').textContent = tierInfo().school;
    $('#certGrade').textContent = gr.title;
    $('#certBody').textContent = `위 학교는 평판 ★${need}${numEul(need)} 모아 ${gr.line} 이 상장을 주어 「${gr.title}」로 인정합니다.`;
    $('#certDate').textContent = fmtDate(new Date());
    $('#certReward').textContent = '+' + fmt(reward);
    openModal($('#mGrade'));
    sfx('bell');
    ringBell();
    return true;
  }

  /* ---------- 자리 비운 동안 ---------- */
  function applyAway(sec) {
    if (!(sec > 0)) return;
    S.oak = Math.min(OAK.max, S.oak + sec / OAK.regen);
    S.students = Math.min(capacity(), S.students + CFG.enroll * sec);
    if (sec < CFG.awayModalSec) { const g = rate() * sec; S.budget += g; earn(g); return; }
    const used = Math.min(sec, offlineCapH() * 3600);
    S.pending += rate() * offlineEff() * used;
    S.pendingSec += sec;
    save();
    if (rt.modalOpen === $('#mOffline')) fillOffline();
    else queueModal(showOffline);
  }
  function fillOffline() {
    const pct = Math.round(offlineEff() * 100);
    $('#offTime').textContent = fmtDur(S.pendingSec);
    $('#offAmount').textContent = fmt(S.pending);
    let fine = S.t.owl > 0
      ? `부엉이 선생님이 밤에도 수업해서 수업료의 ${pct}%가 쌓였어요.`
      : `자리 비운 동안은 수업료의 ${pct}%가 쌓여요. 부엉이 선생님을 모시면 더 많이 쌓여요.`;
    if (S.pendingSec > offlineCapH() * 3600) fine += ` 도토리는 최대 ${offlineCapH()}시간까지 쌓여요.`;
    $('#offFine').textContent = fine;
  }
  function showOffline() {
    if (!(S.pending > 0)) return false;
    fillOffline();
    openModal($('#mOffline'));
    return true;
  }
  function grantOffline(mult) {
    const v = S.pending * mult;
    S.budget += v; earn(v);
    if (v > 0) S.st.claims += 1;
    S.pending = 0; S.pendingSec = 0;
    floatText(180, 40, '+' + fmt(v), 'gold');
    sfx('coin'); buzz(15);
    save();
    renderHUD(); renderAffordance();
  }
  function claimOffline() { grantOffline(1); closeModal($('#mOffline')); }
  // 광고를 끝까지 보면 2배, 중간에 닫으면 기본 보상만
  function claimOfflineDouble() {
    closeModal($('#mOffline'), () => showAd(
      () => { grantOffline(2); toast('2배로 받았어요!'); },
      () => { grantOffline(1); toast('광고를 끝까지 보지 않아서 기본 보상만 받았어요'); }
    ));
  }

  /* ---------- 테스트 광고 ---------- */
  // 진짜 미니앱에서는 앱인토스 SDK의 보상형 광고로 바꿔요. 보상은 userEarnedReward 신호를 받았을 때만 줘요
  function showAd(onReward, onSkip) {
    if (rt.adOpen) return;
    if (window.FOREST_NOAD) {   // 안드로이드 스토어 판: 광고 없이 바로 보상을 줘요
      rt.adOk = onReward; rt.adNo = onSkip || null; rt.adEarned = true; closeAd();
      return;
    }
    const EXT = AIT && AIT.ads ? AIT : (window.FOREST_ADS || null);   // 토스 광고나 안드로이드 애드몹 광고
    if (EXT) {
      // 토스 리워드 광고: 끝까지 봤다는 신호(userEarnedReward)가 왔을 때만 보상을 줘요
      if (!EXT.adReady()) { EXT.preload(); rt.adNoGold = false; toast('광고를 준비하고 있어요. 잠시 뒤에 다시 눌러 주세요'); return; }
      rt.adOpen = true;
      if (actx && actx.state === 'running') actx.suspend().catch(() => {});   // 광고 중에는 게임 소리를 멈춰요
      EXT.showAd(r => { rt.adOk = onReward; rt.adNo = onSkip || null; rt.adEarned = !!r.earned; closeAd(); });
      return;
    }
    rt.adOpen = true; rt.adOk = onReward; rt.adNo = onSkip || null; rt.adEarned = false;
    let left = BOOST.adSec;
    $('#adCount').textContent = left;
    $('#adFill').style.transition = 'none'; $('#adFill').style.width = '0%';
    void $('#adFill').offsetWidth; $('#adFill').style.transition = '';
    $('#adDone').hidden = true; $('#adSkip').hidden = false;
    $('#mAd').hidden = false;
    if (actx && actx.state === 'running') actx.suspend().catch(() => {});   // 광고 중에는 게임 소리를 멈춰요
    requestAnimationFrame(() => { $('#adFill').style.width = (100 / BOOST.adSec) + '%'; });
    clearInterval(rt.adTimer);
    rt.adTimer = setInterval(() => {
      left -= 1;
      $('#adCount').textContent = Math.max(0, left);
      $('#adFill').style.width = Math.min(100, (BOOST.adSec - left + 1) / BOOST.adSec * 100) + '%';
      if (left <= 0) {
        clearInterval(rt.adTimer);
        rt.adEarned = true;
        $('#adSkip').hidden = true; $('#adDone').hidden = false;
        $('#adDone').focus({ preventScroll: true });
      }
    }, 1000);
    $('#adSkip').focus({ preventScroll: true });
  }
  function closeAd() {
    clearInterval(rt.adTimer);
    $('#mAd').hidden = true;
    rt.adOpen = false;
    ensureAudio();
    const ok = rt.adOk, no = rt.adNo, earned = rt.adEarned, noGold = rt.adNoGold;
    rt.adOk = rt.adNo = null; rt.adNoGold = false;
    if (earned) { S.st.ads += 1; if (!noGold) adGold(); if (ok) ok(); }
    else if (no) no();
    else toast('광고를 끝까지 보지 않아서 보상이 없어요');
  }

  /* 부엉이 선생님 보충수업: 광고 1편에 수업료 10분치, 하루 5번 */
  function renderBoostBtn() {
    const b = $('#btnBoost');
    b.hidden = !S.u.boost;
    if (b.hidden) return;
    const left = boostLeft();
    $('#boostN').textContent = left;
    b.classList.toggle('used', left <= 0);
    b.setAttribute('aria-label', `부엉이 선생님 보충수업, 오늘 ${left}번 남았어요`);
  }
  function openBoost() {
    if (rt.paused || rt.modalOpen) return;
    const left = boostLeft();
    $('#boostAmt').textContent = fmt(boostAmount());
    $('#boostLeft').textContent = left > 0 ? `오늘 남은 보충수업 ${left}번` : '오늘 보충수업을 모두 들었어요. 내일 다시 열려요.';
    const go = $('#boostGo');
    go.textContent = left > 0 ? '광고 보고 받기' : '내일 다시 열려요';
    go.setAttribute('aria-disabled', left > 0 ? 'false' : 'true');
    sfx('tap');
    openModal($('#mBoost'));
  }
  function startBoost() {
    if (boostLeft() <= 0) { shake($('#boostGo')); return; }
    closeModal($('#mBoost'), () => showAd(() => {
      const v = boostAmount();   // 광고를 다 본 순간의 수업료로 계산해요
      const today = todayStr();
      if (S.ad.day !== today) { S.ad.day = today; S.ad.n = 0; }
      S.ad.n += 1;
      S.budget += v; earn(v);
      floatText(180, 40, '+' + fmt(v), 'gold');
      sfx('quest'); buzz(15);
      toast(`보충수업 끝! 도토리 +${fmt(v)}`);
      save(); renderHUD(); renderAffordance();
    }));
  }

  /* ---------- 까치 핫딜 ---------- */
  // 까치가 숲속 장터 소식을 물어 와요. 지금 살 듯 말 듯한 것을 반값에, 아니면 특식 데이나 종업식 단체 사진을 줘요
  function makeDeal() {
    if (canGraduate() && !S.hd.album && Math.random() < 0.4) return { type: 'album' };
    const cands = [];
    for (const k of facKeys()) { const c = facCost(k); if (S.budget < c && S.budget >= c / 2) cands.push({ type: 'fac', k, c }); }
    for (const k of Object.keys(TEA)) {
      if (teaMaxed(k)) continue;
      const c = teaCost(k);
      if (c > 0 && S.budget < c && S.budget >= c / 2) cands.push({ type: 'tea', k, c });
    }
    const q = curMain();
    const want = q && !mainReady() ? cands.find(d => (q.t === 'fac' && d.type === 'fac' && d.k === q.k) ||
      (q.t === 'students' && d.type === 'fac' && d.k === 'classroom') || (q.t === 'tea' && d.type === 'tea' && d.k === q.k)) : null;
    if (want) return want;
    if (cands.length) return cands.sort((a, b) => b.c - a.c)[0];
    if (!feastOn()) return { type: 'feast' };
    return null;
  }
  // 소식이 나온 뒤에 이미 최고 레벨이 되었거나 종업식을 열었으면 그 핫딜은 쓸 수 없어요
  function dealValid(d) {
    if (!d) return false;
    if (d.type === 'fac') return facKeys().includes(d.k);
    if (d.type === 'tea') return !teaMaxed(d.k) && teaCost(d.k) > 0;
    if (d.type === 'album') return canGraduate() && !S.hd.album;
    return true;
  }
  function updateDeal(dt) {
    if (rt.deal) { if (Date.now() > rt.deal.exp && !rt.adOpen && !rt.deal.taken) expireDeal(); return; }
    if (!dealUnlocked() || dealLeft() <= 0 || rt.tab !== 'school') return;
    rt.dealT -= dt;
    if (rt.dealT > 0) return;
    if (!spawnDeal()) rt.dealT = DEAL.retry;
  }
  function spawnDeal() {
    const d = makeDeal();
    if (!d) return false;
    d.exp = Date.now() + DEAL.life * 1000;
    rt.deal = d;
    rt.dealT = rand(DEAL.gap[0], DEAL.gap[1]);
    if (!S.hd.seen) { S.hd.seen = true; toast('까치가 반가운 소식을 물어 왔어요! 지도 오른쪽 아래를 눌러 보세요'); save(); }
    sfx('magpie');
    renderDeal();
    return true;
  }
  function expireDeal() {
    rt.deal = null;
    if (rt.modalOpen === $('#mDeal')) { closeModal($('#mDeal')); toast('까치가 날아갔어요. 다음 소식을 기다려요'); }
    renderDeal();
  }
  const clock = sec => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  function renderDeal() {
    const b = $('#btnDeal'), d = rt.deal;
    b.hidden = !d;
    if (d) {
      const t = clock(Math.max(0, Math.ceil((d.exp - Date.now()) / 1000)));
      if (b.dataset.t !== t) { b.dataset.t = t; $('#dealTime').textContent = t; b.setAttribute('aria-label', `까치 핫딜, ${t} 남았어요`); }
      if (rt.modalOpen === $('#mDeal')) $('#dealClock').textContent = t;
    }
    const on = feastOn();
    $('#feastChip').hidden = !on;
    if (on) $('#feastTime').textContent = clock(Math.ceil((S.hd.feastUntil - Date.now()) / 1000));
    const au = autoOn();
    $('#autoChip').hidden = !au;
    if (au) $('#autoTime').textContent = clock(Math.ceil((S.autoUntil - Date.now()) / 1000));
  }
  function openDeal() {
    if (rt.paused || rt.modalOpen || !rt.deal) return;
    if (!dealValid(rt.deal)) { rt.deal = null; rt.dealT = DEAL.retry; renderDeal(); toast('까치가 다른 소식을 찾으러 갔어요'); return; }
    fillDeal();
    sfx('magpie');
    openModal($('#mDeal'));
  }
  function fillDeal() {
    const d = rt.deal;
    let title, text, price = null, gain = '', go = '광고 보고 반값';
    if (d.type === 'fac') {
      const L = S.f[d.k], F = FAC[d.k];
      title = L >= 1 ? `${F.name} 공사비 반값` : `${F.name} 짓기 반값`;
      const line = d.k === 'playground' && S.tier >= 1 ? '장터에 체육 용품 반짝 세일이 열렸대요!' : DEAL_LINE[d.k];
      text = `${line} ${L >= 1 ? `Lv.${L + 1} 공사를` : '짓는 공사를'} 반값에 해 드려요.`;
      price = facCost(d.k);
    } else if (d.type === 'tea') {
      const L = S.t[d.k], T = TEA[d.k];
      title = L >= 1 ? `${T.name} 연수비 반값` : `${T.name} 모셔 오기 반값`;
      text = L >= 1 ? `${DEAL_LINE.teaUp} Lv.${L + 1} 연수를 반값에 보내 드려요.` : `${DEAL_LINE.teaNew} ${T.name}을 반값에 모셔 올 수 있어요.`;
      price = teaCost(d.k);
    } else if (d.type === 'feast') {
      title = '급식실 특식 데이';
      text = '장터에 싱싱한 도토리가 잔뜩 들어왔대요! 특식을 먹은 학생들이 신이 나서 수업료가 늘어요.';
      gain = `${DEAL.feastMin}분 동안 수업료 2배`; go = '광고 보고 받기';
    } else {
      title = '종업식 단체 사진';
      text = '사진사 까치가 이번 종업식 단체 사진을 찍어 준대요! 멋진 사진이 생기면 수료증이 늘어요.';
      gain = '이번 종업식 수료증 1.5배'; go = '광고 보고 받기';
    }
    $('#dealTitle').textContent = title;
    $('#dealText').textContent = text;
    $('#dealPrice').hidden = price === null;
    $('#dealGain').hidden = price !== null;
    if (price !== null) { $('#dealWas').textContent = fmt(price); $('#dealNow').textContent = fmt(Math.ceil(price / 2)); }
    else $('#dealGain').textContent = gain;
    $('#dealGo').textContent = go;
    $('#dealFine').textContent = `오늘 남은 핫딜 ${dealLeft()}번이에요. 광고를 끝까지 보면 받아요.`;
    $('#dealArt').innerHTML = `<svg viewBox="-24 -24 48 48" aria-hidden="true">${MAGPIE}</svg>`;
    renderDeal();
  }
  function acceptDeal() {
    const d = rt.deal;
    if (!d || !dealValid(d)) { closeModal($('#mDeal')); rt.deal = null; renderDeal(); return; }
    if (dealLeft() <= 0) { shake($('#dealGo')); return; }
    if (d.type === 'fac' || d.type === 'tea') {
      const half = Math.ceil((d.type === 'fac' ? facCost(d.k) : teaCost(d.k)) / 2);
      if (S.budget < half) { shake($('#dealGo')); $('#dealFine').textContent = `반값이어도 도토리 ${fmt(Math.ceil(half - S.budget))}개가 모자라요.`; return; }
    }
    d.taken = true;   // 광고를 보는 동안에는 까치가 날아가지 않아요
    closeModal($('#mDeal'), () => showAd(() => applyDeal(d), () => {
      d.taken = false;
      toast('광고를 끝까지 보지 않아서 핫딜을 못 받았어요');
    }));
  }
  // 광고를 끝까지 봤을 때만 불려요 (진짜 미니앱에서는 userEarnedReward 신호)
  function applyDeal(d) {
    if (rt.deal === d) rt.deal = null;
    if (!dealValid(d)) { renderDeal(); toast('까치가 다른 소식을 찾으러 갔어요'); return; }
    const today = todayStr();
    if (S.hd.day !== today) { S.hd.day = today; S.hd.n = 0; }
    S.hd.n += 1;
    if (d.type === 'fac' || d.type === 'tea') {
      const isFac = d.type === 'fac';
      const full = isFac ? facCost(d.k) : teaCost(d.k), half = Math.ceil(full / 2);
      const ok = isFac ? buyFacility(d.k, half) : teacherAct(d.k, null, half);
      if (!ok) { S.hd.n -= 1; save(); renderDeal(); toast('도토리가 모자라서 핫딜을 쓰지 못했어요. 횟수는 그대로예요'); return; }
      // 산 건물이나 오신 선생님 위로 아낀 도토리가 떠올라요
      const v = isFac ? FAC[d.k].view.split(' ').map(Number) : null;
      const tp = isFac ? [v[0] + v[2] / 2, v[1] + 22] : d.k === 'owl' ? (S.f.library > 0 ? [101, 100] : [32, 10]) : [TPOS[d.k][0], TPOS[d.k][1] - 20];
      setTimeout(() => floatText(tp[0], tp[1], `반값! ${fmt(full - half)} 아낌`, 'gold'), 250);
    } else if (d.type === 'feast') {
      S.hd.feastUntil = Math.max(Date.now(), S.hd.feastUntil) + DEAL.feastMin * 60000;
      toast(`특식 데이 시작! ${DEAL.feastMin}분 동안 수업료가 2배예요`);
      sfx('quest'); buzz(15);
    } else {
      S.hd.album = true;
      toast('사진사 까치가 기다려요! 이번 종업식 수료증이 1.5배예요');
      sfx('quest'); buzz(15);
    }
    save(); renderDeal(); renderHUD(); renderAffordance();
    if (rt.tab === 'grad') renderGradPanel(true);
  }

  /* ---------- 서버 저장 (GitHub 테스트판) ----------
     GitHub Pages에 올린 index.html은 config.js의 Firebase 설정을 읽어 SDK를 불러오고 window.FOREST_FB에 담아요.
     Claude 화면에는 window.FOREST_FB가 없어서 지금처럼 이 기기의 브라우저에만 저장해요.
     서버 자리 (지키는 규칙은 database.rules.json)
       forest/saves/<내 id>  게임 저장. 나만 읽고 써요
       forest/rank/<내 id>   랭킹 이름과 학교 점수
       forest/stats/<내 id>  테스트 현황 (어디까지 했는지, 얼마나 했는지)
       forest/moves/<코드>   다른 기기로 옮길 때 30분 동안 맡겨 두는 학교
     <내 id>는 Firebase 익명 로그인이 기기(브라우저)마다 만들어 줘요. */
  const VERSION = '1.0.0';
  const CLOUD_PUSH = 20000;   // 바뀐 게 있으면 20초마다 올려요
  const STATS_PUSH = 60000;   // 테스트 현황은 1분마다
  const CLOUD_WAIT = 15000;   // 서버가 이만큼 답이 없으면 이 기기에만 저장해요
  const MOVE_MIN = 30;        // 이어하기 코드는 30분 동안 써요
  const hasCloudBuild = () => typeof window.FOREST_FB !== 'undefined';
  const cloudOn = () => Cloud.state === 'on';
  const waitFor = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no({ code: 'timeout' }), ms))]);
  // 서버에 못 붙을 때 설정 화면의 '저장 위치'에 보여 줄 까닭
  const CLOUD_ERR = {
    anon: 'Firebase에서 익명 로그인을 켜 주세요',
    key: 'config.js의 Firebase 설정을 확인해 주세요',
    nourl: 'config.js에 databaseURL이 없어요',
    rules: '데이터베이스 규칙을 확인해 주세요',
    net: '인터넷 연결이 없거나 서버가 답하지 않아요',
    load: 'Firebase를 불러오지 못했어요',
    storage: '이 브라우저는 저장소가 막혀 있어요',
    etc: '서버에 연결하지 못했어요'
  };
  function cloudErrKey(e) {
    const c = String((e && (e.code || e.message)) || e || '');
    if (/operation-not-allowed|admin-restricted/i.test(c)) return 'anon';
    if (/api-key|app-not-authorized|invalid-app|project-not-found/i.test(c)) return 'key';
    if (/permission/i.test(c)) return 'rules';
    if (/nourl|database url/i.test(c)) return 'nourl';
    if (/network|timeout|unavailable|offline/i.test(c)) return 'net';
    if (c === 'load' || c === 'storage') return c;
    return 'etc';
  }
  // 이 브라우저에서 예전에 받은 익명 id가 있으면 그대로 쓰고, 없으면 새로 받아요
  function cloudUser(auth) {
    return new Promise((ok, no) => {
      let un = null, done = false;
      un = auth.onAuthStateChanged(u => {
        if (done) return;
        done = true;
        if (un) un(); else setTimeout(() => { if (un) un(); }, 0);
        if (u) ok(u);
        else auth.signInAnonymously().then(c => ok(c.user), no);
      }, err => { if (!done) { done = true; no(err); } });
    });
  }
  async function initCloud() {
    if (!hasCloudBuild() || Cloud.state === 'wait' || Cloud.state === 'on' || rt.adopting) return;
    const g = ++Cloud.gen;
    Cloud.state = 'wait'; Cloud.err = '';
    renderCloudInfo();
    try {
      let fb = null;
      try { fb = await window.FOREST_FB; } catch (e) { throw { code: 'load' }; }
      if (g !== Cloud.gen) return;
      if (!fb) { Cloud.state = 'off'; renderCloudInfo(); rankAfterCloud(); return; }   // config.js가 비어 있으면 체험판이에요
      const cfg = window.FOREST_FIREBASE || {};
      if (!cfg.databaseURL) throw { code: 'nourl' };
      if (!fb.apps.length) fb.initializeApp(cfg);
      const auth = fb.auth(), db = fb.database();
      const user = await waitFor(cloudUser(auth), CLOUD_WAIT);
      if (g !== Cloud.gen) return;
      Cloud.fb = fb; Cloud.db = db; Cloud.uid = user.uid;
      if (!Cloud.listening) {
        Cloud.listening = true;
        db.ref('.info/serverTimeOffset').on('value', snap => { Cloud.offset = Number(snap.val()) || 0; });
        db.ref('.info/connected').on('value', snap => {
          Cloud.online = !!snap.val();
          renderCloudInfo();
          if (Cloud.online && cloudOn() && Cloud.dirty) cloudPush();
        });
      }
      // 서버 저장과 이 기기 저장 중에서 이어 할 쪽을 골라요
      const srv = (await waitFor(db.ref('forest/saves/' + user.uid).once('value'), CLOUD_WAIT)).val();
      if (g !== Cloud.gen) return;
      if (srv && typeof srv.d === 'string' && !Cloud.skipRestore && cloudShouldRestore(srv)) {
        const r = adoptSave(srv.d, '서버에 저장된 학교를 불러왔어요');
        if (r === 'ok') return;
        if (r === 'storage') throw { code: 'storage' };
        // 서버 저장이 망가졌으면 이 기기 학교로 덮어써요
      }
      Cloud.state = 'on';
      renderCloudInfo();
      cloudPush(true);
      rankAfterCloud();
      if (rt.moveParam) { const c = rt.moveParam; rt.moveParam = ''; queueModal(() => openMove(c)); }
    } catch (e) {
      if (g !== Cloud.gen) return;
      Cloud.state = 'error'; Cloud.err = cloudErrKey(e);
      renderCloudInfo();
      rankAfterCloud();
    }
  }
  // 이 기기에 저장이 없던 새 화면이면 서버 학교를 이어 해요 (새로 10분 넘게 했으면 지금 학교를 지켜요).
  // 둘 다 있으면 더 나중에 저장한 쪽을 써요
  function cloudShouldRestore(srv) {
    const at = Number(srv.at) || 0;
    if (!Cloud.bootHadSave) return performance.now() < 10 * 60000;
    return at > S.savedAt + 5000;
  }
  // 다른 학교로 바꿀 때는 저장을 바꿔 넣고 화면을 다시 열어요. 게임을 처음부터 다시 그리는 가장 안전한 방법이에요
  function adoptSave(d, msg) {
    let obj = null;
    try { obj = JSON.parse(d); } catch (e) { obj = null; }
    if (!obj || typeof obj !== 'object') return 'bad';
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(obj)); sessionStorage.setItem('forest-adopt', msg || ''); } catch (e) { return 'storage'; }
    rt.adopting = true;   // 다시 여는 동안 지금 학교가 저장을 덮어쓰지 않게 막아요
    clearTimeout(Cloud.timer);
    location.reload();
    return 'ok';
  }
  // 연결이 끝날 때까지(붙었거나 못 붙었거나) 기다려요
  function cloudSettled() {
    return new Promise(ok => {
      const t = () => (Cloud.state === 'idle' || Cloud.state === 'wait') ? setTimeout(t, 150) : ok();
      t();
    });
  }
  function retryCloud() {
    if (!hasCloudBuild() || Cloud.state !== 'error') return;
    if (Cloud.err === 'load' && !window.firebase && typeof window.FOREST_LOAD === 'function') window.FOREST_FB = window.FOREST_LOAD();
    Cloud.state = 'idle';
    renderCloudInfo();
    resetRank();
    if (rt.tab === 'rank') initRank(); else renderRankPanel();
    initCloud();
  }
  async function cloudPush(force) {
    if (!cloudOn() || rt.adopting || Cloud.pushing || !S) return;
    if (!force && !Cloud.dirty) return;
    Cloud.pushing = true; Cloud.dirty = false;
    syncMid();
    const db = Cloud.db, uid = Cloud.uid, g = Cloud.gen;
    try {
      await db.ref('forest/saves/' + uid).set({ d: JSON.stringify(S), at: S.savedAt, v: VERSION });
      Cloud.lastPush = Date.now();
      if (force || Date.now() - Cloud.lastStats >= STATS_PUSH) {
        Cloud.lastStats = Date.now();
        await db.ref('forest/stats/' + uid).set(statsDoc());
      }
    } catch (e) {
      Cloud.dirty = true;
      if (g === Cloud.gen && cloudErrKey(e) === 'rules') { Cloud.state = 'error'; Cloud.err = 'rules'; rankAfterCloud(); }
    }
    Cloud.pushing = false;
    renderCloudInfo();
  }
  function cloudTick() { if (cloudOn() && Cloud.dirty && Date.now() - Cloud.lastPush >= CLOUD_PUSH) cloudPush(); }
  // 종업식, 졸업식처럼 큰 일이 있으면 조금 뒤에 바로 올려요
  function cloudSoon() {
    if (!cloudOn()) return;
    clearTimeout(Cloud.timer);
    Cloud.timer = setTimeout(() => { save(); cloudPush(true); }, 1500);
  }
  // 테스트 현황에 남길 것: 이름과 연락처 같은 개인 정보는 받지 않아요
  function statsDoc() {
    const cm = curMain(), ua = navigator.userAgent || '';
    return {
      seen: Cloud.fb.database.ServerValue.TIMESTAMP, born: Math.floor(S.born), pid: S.pid, name: S.rank.name || '',
      tier: S.tier, year: yearNo(), town: S.grade, q: cm ? qNo(S.q.m) : '끝', qt: cm ? cm.title : '',
      play: Math.floor(S.st.play), sess: S.st.sess, days: S.att.n, ads: S.st.ads, score: rankScore(),
      gold: S.gold, gearn: S.st.gold, gspent: S.st.gspent, cos: S.cos.own.length,
      dev: !!S.u.dev, v: VERSION, env: /KAKAOTALK/i.test(ua) ? 'kakao' : (navigator.maxTouchPoints > 0 ? 'mobile' : 'pc')
    };
  }
  function agoText(t) {
    const s = Math.max(0, (Date.now() - t) / 1000);
    if (s < 10) return '방금';
    if (s < 60) return `${Math.floor(s)}초 전`;
    if (s < 3600) return `${Math.floor(s / 60)}분 전`;
    if (s < 86400) return `${Math.floor(s / 3600)}시간 전`;
    return `${Math.floor(s / 86400)}일 전`;
  }
  function renderCloudInfo() {
    if (!S) return;
    let t = AIT ? '이 기기의 토스 앱' : '이 기기의 브라우저';
    if (AIT) $('#infoAd').textContent = AIT.ads ? (AIT.testAd ? '토스 리워드 광고 (테스트 광고)' : '토스 리워드 광고') : '이 토스 앱에서는 광고가 안 나와요';
    if (hasCloudBuild()) {
      if (Cloud.state === 'on') t = !Cloud.online ? '서버 (인터넷이 끊겼어요. 다시 이어지면 저장해요)' : Cloud.lastPush ? `서버 (${agoText(Cloud.lastPush)} 저장)` : '서버';
      else if (Cloud.state === 'idle' || Cloud.state === 'wait') t = '서버에 연결하는 중이에요';
      else if (Cloud.state === 'error') t = `이 기기의 브라우저 (${CLOUD_ERR[Cloud.err] || CLOUD_ERR.etc})`;
      else t = '이 기기의 브라우저 (서버를 연결하기 전 체험판)';
    }
    const dd = $('#infoSave');
    if (dd.textContent !== t) dd.textContent = t;
    $('#optMove').hidden = !cloudOn() || !!window.FOREST_STORE;   // 구글 플레이 판은 구글 계정 연결로 옮겨요
    renderAcct();
    $('#devStats').hidden = !hasCloudBuild();
    $('#pidRow').hidden = !hasCloudBuild();
    $('#infoPid').textContent = '#' + S.pid.slice(0, 4);
  }

  /* 다른 기기에서 이어하기: 이 기기에서 코드를 만들면 지금 학교를 forest/moves/<코드>에 30분 동안 맡겨 두고,
     다른 기기에서 그 코드를 넣으면 학교를 받아 와요. 코드는 한 번 쓰면 지워져요 */
  const moveShow = c => c.slice(0, 4) + '-' + c.slice(4);
  const moveClean = v => String(v || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
  const moveLive = () => !!Cloud.moveCode && Date.now() - Cloud.moveAt < MOVE_MIN * 60000;
  function moveMsg(t, bad) {
    const el = $('#moveMsg');
    el.textContent = t;
    el.classList.toggle('bad', !!bad);
  }
  function renderMove() {
    const live = moveLive();
    $('#moveCode').hidden = !live; $('#moveFine').hidden = !live;
    if (live) $('#moveCode').textContent = moveShow(Cloud.moveCode);
    $('#moveMake').textContent = live ? '이어하기 링크 복사' : '코드 만들기';
  }
  function openMove(prefill) {
    if (!cloudOn()) { toast('서버에 연결되면 쓸 수 있어요'); return false; }
    rt.moveIn = null;
    $('#moveMain').hidden = false; $('#moveAsk').hidden = true; $('#moveClose').hidden = false;
    $('#moveYes').removeAttribute('aria-disabled');
    $('#moveInput').value = prefill ? moveShow(moveClean(prefill)) : '';
    moveMsg('');
    renderMove();
    openModal($('#mMove'));
    if (prefill) loadMove(prefill);
    return true;
  }
  async function makeMove() {
    if (!cloudOn() || rt.moveBusy) return;
    rt.moveBusy = true;
    moveMsg('코드를 만드는 중이에요');
    save();
    const ref = Cloud.db.ref('forest/moves');
    if (Cloud.moveCode) { ref.child(Cloud.moveCode).remove().catch(() => {}); Cloud.moveCode = ''; }   // 예전 코드는 지워요
    let code = '';
    for (let i = 0; i < 3 && !code; i++) {
      const c = randCode(8);
      try {
        await waitFor(ref.child(c).set({ d: JSON.stringify(S), at: Cloud.fb.database.ServerValue.TIMESTAMP, from: Cloud.uid, v: VERSION }), CLOUD_WAIT);
        code = c;
      } catch (e) { if (cloudErrKey(e) === 'net') break; }   // 같은 코드가 이미 있으면 다른 코드로 다시 해요
    }
    rt.moveBusy = false;
    if (!code) { moveMsg('코드를 만들지 못했어요. 인터넷 연결을 확인하고 다시 해 보세요', true); return; }
    Cloud.moveCode = code; Cloud.moveAt = Date.now();
    moveMsg('');
    renderMove();
    sfx('quest');
  }
  async function copyMove() {
    const link = window.FOREST_STORE ? moveShow(Cloud.moveCode) : location.origin + location.pathname + '?move=' + Cloud.moveCode;   // 앱에서는 코드만 복사해요
    let ok = false;
    try { await navigator.clipboard.writeText(link); ok = true; } catch (e) { ok = false; }
    toast(ok ? (window.FOREST_STORE ? '코드를 복사했어요' : '링크를 복사했어요. 다른 기기에서 열어 주세요') : '복사하지 못했어요. 코드를 직접 적어 주세요');
  }

  /* 구글 계정 연결 (안드로이드 판에만 window.FOREST_GOOGLE이 있어요)
     지금 익명 id에 구글 계정을 이어 붙여요. id가 그대로라서 서버 저장도 그대로 이어져요.
     그 구글 계정에 이미 다른 학교가 있으면(새 휴대폰) 어느 학교로 이어 할지 물어봐요 */
  const hasGoogle = () => !!window.FOREST_GOOGLE;
  const ACCT_GIFT = { dip: 15, fund: 3, gold: 30 };   // 구글 계정을 처음 연결하면 한 번 주는 선물
  function giveAcctGift() {
    if (S.acctGift) return '';
    S.acctGift = true;
    addDip(ACCT_GIFT.dip); S.fund += ACCT_GIFT.fund; addGold(ACCT_GIFT.gold);
    save(); renderHUD(); renderGradPanel(true);
    return ` 선물로 수료증 +${ACCT_GIFT.dip}장, 기금 +${ACCT_GIFT.fund}, 황금 도토리 +${ACCT_GIFT.gold}개를 받았어요!`;
  }
  function googleUser() {
    try { const u = Cloud.fb.auth().currentUser; return (u && (u.providerData || []).find(p => p.providerId === 'google.com')) || null; } catch (e) { return null; }
  }
  function renderAcct() {
    const row = $('#optAcct');
    row.hidden = !(hasGoogle() && cloudOn());
    if (row.hidden) return;
    const g = googleUser();
    $('#acctTitle').textContent = g ? '구글 계정 연결됨' : '구글 계정 연결';
    $('#acctSub').textContent = g ? `${g.email || '구글'} 계정에 학교가 저장돼요` :
      (S.acctGift ? '연결해 두면 휴대폰을 바꿔도 같은 학교를 이어 해요' : `연결하면 수료증 ${ACCT_GIFT.dip}장, 기금 ${ACCT_GIFT.fund}, 황금 도토리 ${ACCT_GIFT.gold}개를 선물로 줘요`);
  }
  async function linkGoogle() {
    if (!cloudOn() || rt.acctBusy) return;
    if (googleUser()) { toast('이미 구글 계정에 연결돼 있어요'); return; }
    const G = window.FOREST_GOOGLE;
    // 카카오톡 같은 앱 안 브라우저에서는 구글이 로그인을 막아요
    if ((G.popup || G.web) && /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line\//i.test(navigator.userAgent || '')) {
      toast('이 앱 안에서는 구글 로그인이 안 돼요. 메뉴의 \'다른 브라우저로 열기\'로 열어 주세요');
      return;
    }
    rt.acctBusy = true;
    const auth = Cloud.fb.auth();
    let cred = null;
    try {
      try {
        if (G.popup) await auth.currentUser.linkWithPopup(new Cloud.fb.auth.GoogleAuthProvider());
        else {
          const g = await G.login();
          cred = Cloud.fb.auth.GoogleAuthProvider.credential(g.idToken);
          await auth.currentUser.linkWithCredential(cred);
        }
        const gift = giveAcctGift();
        toast('구글 계정을 연결했어요.' + gift); sfx('quest');
        renderAcct(); cloudPush(true);
      } catch (e) {
        if (!/credential-already-in-use|email-already-in-use|account-exists/.test(String(e && e.code))) throw e;
        cred = cred || (e && e.credential);
        if (!cred) throw e;
        // 이 구글 계정은 이미 다른 학교를 갖고 있어요. 지금 학교의 랭킹과 테스트 기록은 정리하고 그 계정으로 들어가요
        save();
        const local = JSON.stringify(S), old = Cloud.uid;
        try { await Cloud.db.ref('forest/rank/' + old).remove(); await Cloud.db.ref('forest/stats/' + old).remove(); } catch (er) { /* 무시 */ }
        const u = (await auth.signInWithCredential(cred)).user;
        Cloud.gen += 1; rt.adopting = true;   // 예전 id로 하던 저장은 멈추고, 고른 학교로 다시 열어요
        const srv = (await waitFor(Cloud.db.ref('forest/saves/' + u.uid).once('value'), CLOUD_WAIT)).val();
        if (srv && typeof srv.d === 'string') askAcct(srv.d, local);
        else { if (!S.acctGift) { rt.adopting = false; giveAcctGift(); rt.adopting = true; } adoptSave(JSON.stringify(S), '구글 계정을 연결했어요'); }
      }
    } catch (e) {
      const c = String(e && (e.code || e.message));
      if (/popup-blocked/.test(c)) toast('팝업이 막혔어요. 브라우저에서 팝업을 허용해 주세요');
      else if (/unauthorized-domain/.test(c)) toast('Firebase 승인된 도메인에 이 주소를 넣어야 해요');
      else if (!/cancel|popup-closed/i.test(c)) toast('구글 계정을 연결하지 못했어요. 잠시 뒤에 다시 해 보세요');
    }
    rt.acctBusy = false;
  }
  function askAcct(d, local) {
    let inc = null;
    try { inc = sanitize(JSON.parse(d)); } catch (e) { inc = null; }
    if (!inc) { adoptSave(local, '구글 계정을 연결했어요'); return; }
    const T = TIERS[inc.tier], y = Math.min(inc.tg + 1, T.years);
    $('#acctFrom').textContent = inc.rank.name ? `${inc.rank.name}의 학교` : '계정에 있는 학교';
    $('#acctInfo').textContent = `${T.school} ${y}${T.unit}, ${CFG.grades[inc.grade].name} 학교, 학교 점수 ${fmt(Math.floor(inc.st.dips))}`;
    rt.acctPick = { d, local };
    if (rt.modalOpen) closeModal(rt.modalOpen);
    setTimeout(() => openModal($('#mAcct')), 200);
  }
  async function loadMove(raw) {
    const code = moveClean(raw);
    if (!cloudOn() || rt.moveBusy) return;
    if (code.length !== 8) { moveMsg('코드 8자리를 넣어 주세요', true); return; }
    if (code === Cloud.moveCode) { moveMsg('이 기기에서 만든 코드예요. 다른 기기에서 넣어 주세요', true); return; }
    rt.moveBusy = true;
    moveMsg('학교를 찾는 중이에요');
    let v = null;
    try { v = (await waitFor(Cloud.db.ref('forest/moves/' + code).once('value'), CLOUD_WAIT)).val(); }
    catch (e) { rt.moveBusy = false; moveMsg('학교를 찾지 못했어요. 인터넷 연결을 확인해 주세요', true); return; }
    rt.moveBusy = false;
    if (!v || typeof v.d !== 'string') { moveMsg('그런 코드가 없어요. 이미 썼거나 잘못 적었는지 확인해 주세요', true); return; }
    if (v.from === Cloud.uid) { moveMsg('이 기기에서 만든 코드예요. 다른 기기에서 넣어 주세요', true); return; }
    if (!(Date.now() + Cloud.offset - Number(v.at) < MOVE_MIN * 60000)) {
      Cloud.db.ref('forest/moves/' + code).remove().catch(() => {});
      moveMsg('코드를 만든 지 30분이 지났어요. 새 코드를 만들어 주세요', true);
      return;
    }
    let inc = null;
    try { inc = sanitize(JSON.parse(v.d)); } catch (e) { inc = null; }
    if (!inc) { moveMsg('학교 기록을 읽지 못했어요', true); return; }
    rt.moveIn = { code, d: v.d };
    moveMsg('');
    const T = TIERS[inc.tier], y = Math.min(inc.tg + 1, T.years);
    $('#moveFromName').textContent = inc.rank.name ? `${inc.rank.name}의 학교` : '옮겨 올 학교';
    $('#moveFromInfo').textContent = `${T.school} ${y}${T.unit}, ${CFG.grades[inc.grade].name} 학교, 학교 점수 ${fmt(Math.floor(inc.st.dips))}`;
    $('#moveMain').hidden = true; $('#moveAsk').hidden = false; $('#moveClose').hidden = true;
    $('#moveYes').focus({ preventScroll: true });
  }
  async function confirmMove() {
    const m = rt.moveIn;
    if (!m || !cloudOn() || $('#moveYes').getAttribute('aria-disabled') === 'true') return;
    $('#moveYes').setAttribute('aria-disabled', 'true');
    // 코드는 한 번만 쓰게 지우고, 이 기기의 지금 학교가 랭킹에 있었다면 빼요
    try { await waitFor(Cloud.db.ref('forest/moves/' + m.code).remove(), CLOUD_WAIT); } catch (e) { /* 못 지워도 30분이 지나면 못 써요 */ }
    if (S.rank.joined) { try { await waitFor(Cloud.db.ref('forest/rank/' + Cloud.uid).remove(), CLOUD_WAIT); } catch (e) { /* 무시 */ } }
    const r = adoptSave(m.d, '다른 기기의 학교를 옮겨 왔어요');
    if (r === 'ok') return;
    rt.moveIn = null;
    $('#moveYes').removeAttribute('aria-disabled');
    $('#moveAsk').hidden = true; $('#moveMain').hidden = false; $('#moveClose').hidden = false;
    moveMsg(r === 'storage' ? CLOUD_ERR.storage : '학교 기록을 읽지 못했어요', true);
  }

  /* 테스트 현황 (개발자 메뉴): forest/stats를 읽어 테스터마다 어디까지 했는지 보여요.
     같은 학교가 기기를 옮겼으면 가장 최근 기록 하나만 보여요 */
  const ENV_NAME = { kakao: '카카오톡', mobile: '휴대폰', pc: '컴퓨터' };
  const playText = s => s < 60 ? '1분 미만' : s < 3600 ? `${Math.floor(s / 60)}분` : `${Math.floor(s / 3600)}시간 ${Math.floor(s % 3600 / 60)}분`;
  function openStats() {
    if (!cloudOn()) { toast('서버에 연결되면 볼 수 있어요'); return; }
    $('#statsList').textContent = '';
    openModal($('#mStats'));
    loadStats();
  }
  function readStat(id, d) {
    if (!d || typeof d !== 'object' || typeof d.seen !== 'number') return null;
    const n = (v, max) => { v = Number(v); return isFinite(v) && v >= 0 ? Math.min(v, max) : 0; };
    const tier = Math.min(TIERS.length - 1, Math.floor(n(d.tier, 9))), T = TIERS[tier];
    return {
      id, seen: d.seen, born: n(d.born, 9e15), pid: typeof d.pid === 'string' && d.pid ? d.pid.slice(0, 16) : id,
      name: cleanName(d.name), tier, year: Math.max(1, Math.min(T.years, Math.floor(n(d.year, 99)))),
      town: Math.min(CFG.grades.length - 1, Math.floor(n(d.town, 9))),
      q: typeof d.q === 'string' ? d.q.slice(0, 8) : '', qt: typeof d.qt === 'string' ? d.qt.slice(0, 30) : '',
      play: n(d.play, 1e9), sess: Math.floor(n(d.sess, 1e6)), days: Math.floor(n(d.days, 1e5)), ads: Math.floor(n(d.ads, 1e6)),
      score: Math.floor(n(d.score, 1e12)), gearn: Math.floor(n(d.gearn, 1e9)), gspent: Math.floor(n(d.gspent, 1e9)), cos: Math.floor(n(d.cos, 999)), dev: !!d.dev, v: typeof d.v === 'string' ? d.v.slice(0, 10) : '', env: ENV_NAME[d.env] || ''
    };
  }
  async function loadStats() {
    if (!cloudOn()) return;
    const sum = $('#statsSum'), list = $('#statsList');
    sum.textContent = '불러오는 중이에요';
    let v = null;
    try { v = (await waitFor(Cloud.db.ref('forest/stats').once('value'), CLOUD_WAIT)).val(); }
    catch (e) { sum.textContent = '불러오지 못했어요. ' + (cloudErrKey(e) === 'rules' ? CLOUD_ERR.rules : CLOUD_ERR.net); return; }
    const now = Date.now() + Cloud.offset, best = new Map();
    Object.keys(v || {}).forEach(id => {
      const r = readStat(id, v[id]);
      if (!r) return;
      const old = best.get(r.pid);
      if (!old || r.seen > old.seen) best.set(r.pid, r);
    });
    const rows = [...best.values()].sort((a, b) => b.seen - a.seen);
    const today = rows.filter(r => now - r.seen < 86400000).length;
    const avg = rows.length ? rows.reduce((t, r) => t + r.play, 0) / rows.length : 0;
    sum.textContent = rows.length ? `테스터 ${rows.length}명, 하루 안에 들어온 사람 ${today}명, 평균 플레이 ${playText(avg)}` : '아직 기록이 없어요';
    list.textContent = '';
    rows.forEach(r => {
      const li = document.createElement('li');
      li.className = 'st-row';
      const top = document.createElement('div');
      top.className = 'st-top';
      const nm = document.createElement('b');
      nm.textContent = r.name || '이름 없는 학교';   // 테스터가 적은 이름이라 textContent로만 넣어요
      top.appendChild(nm);
      const tag = (t, me) => { const sp = document.createElement('span'); sp.className = 'rk-tag' + (me ? ' me' : ''); sp.textContent = t; top.appendChild(sp); };
      tag('#' + r.pid.slice(0, 4));
      if (r.id === Cloud.uid) tag('나', true);
      if (r.dev) tag('테스트 도구');
      const ago = document.createElement('span');
      ago.className = 'ago';
      ago.textContent = agoText(r.seen - Cloud.offset);
      top.appendChild(ago);
      const T = TIERS[r.tier];
      const mid = document.createElement('div');
      mid.className = 'st-mid';
      mid.textContent = `${T.school} ${r.year}${T.unit}, ${CFG.grades[r.town].name}, 퀘스트 ${r.q}${r.qt ? ' ' + r.qt : ''}`;
      const bot = document.createElement('div');
      bot.textContent = [`플레이 ${playText(r.play)}`, `접속 ${r.sess}번`, `출석 ${r.days}일`, `광고 ${r.ads}번`, `학교 점수 ${fmt(r.score)}`, `황금 도토리 ${r.gearn}개 받고 ${r.gspent}개 씀`, r.cos ? `꾸미기 ${r.cos}개` : '',
        r.born ? `처음 ${agoText(r.born)}` : '', r.env, r.v && r.v !== VERSION ? `버전 ${r.v}` : ''].filter(Boolean).join(', ');
      li.append(top, mid, bot);
      list.appendChild(li);
    });
  }

  /* ---------- 랭킹 ----------
     GitHub 테스트판: 서버의 forest/rank/<내 id>에 학교 점수를 올려 테스터끼리 순위를 봐요.
     Claude 화면: 이 게임 화면을 함께 여는 사람끼리 공유 저장소의 rank/<내 id> 문서로 나눠 봐요.
     토스 미니앱: 랭킹은 토스 게임 센터가 맡아요. 점수가 오를 때 submitGameCenterLeaderBoardScore({ score: String(rankScore()) })를 보내고,
     랭킹 버튼에서는 openGameCenterLeaderboard()로 토스 랭킹 화면을 열면 돼요. 미니앱마다 랭킹은 하나라서 학교 점수 하나만 보내요. */
  const RANK_MAX = 50;
  const Rank = { state: 'idle', gen: 0, be: null, uid: null, rows: [], readOnly: false, writing: false, timer: 0, unsub: null };
  // 학교 점수 = 지금까지 받은 수료증 (종업식, 졸업식, 출석, 퀘스트). 학교급이 달라도 비슷한 크기라서 순위를 매기기 좋아요
  const rankScore = () => Math.floor(S.st.dips);
  // 이름: 앞뒤 빈칸을 지우고 빈칸은 하나로, 10자까지
  function cleanName(v) { return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, 10) : ''; }
  function rankSchool(tier, year) {
    const T = TIERS[Math.max(0, Math.min(TIERS.length - 1, tier | 0))];
    const y = Math.max(1, Math.min(T.years, year | 0 || 1));
    return `${T.school} ${y}${T.unit}`;
  }
  // 랭킹을 둘 곳: GitHub 판은 서버, Claude 화면은 공유 저장소, 둘 다 없으면 내 학교 점수만 보여요.
  // 어느 쪽이든 listen(받기), put(올리기), remove(빼기) 세 가지로 똑같이 써요
  async function rankBackend() {
    if (AIT) return { uid: 'me', readOnly: false, toss: true, listen: ok => { ok([]); return () => {}; },
      put: doc => Promise.resolve(AIT.setScore(doc.score)), remove: () => Promise.resolve() };
    if (hasCloudBuild()) {
      await cloudSettled();
      return cloudOn() ? fbRank() : null;
    }
    const c = window.claude;
    const [db, user] = c && typeof c.use === 'function' ? await Promise.all([c.use('db'), c.use('user')]) : [null, null];
    if (!db || !user) return null;
    const uid = await user.id();
    const readOnly = !uid || (await user.can('data.write')) === false;
    const col = db.collection('rank');
    return {
      uid, readOnly,
      listen: (ok, no) => col.orderBy('score', 'desc').limit(RANK_MAX).onSnapshot(snap => ok(snap.docs.map(d => [d.id, d.data()])), no),
      put: doc => col.doc(uid).set(doc),
      remove: () => col.doc(uid).delete()
    };
  }
  function fbRank() {
    const ref = Cloud.db.ref('forest/rank'), uid = Cloud.uid;
    return {
      uid, readOnly: false,
      // 점수 순으로 위에서부터 받아요. 기기를 옮긴 학교가 겹칠 수 있어서 조금 넉넉히 받아요
      listen: (ok, no) => {
        const q = ref.orderByChild('score').limitToLast(RANK_MAX + 10);
        const cb = snap => { const out = []; snap.forEach(ch => { out.push([ch.key, ch.val()]); }); ok(out.reverse()); };
        q.on('value', cb, no);
        return () => q.off('value', cb);
      },
      put: doc => ref.child(uid).set(Object.assign({}, doc, { at: Cloud.fb.database.ServerValue.TIMESTAMP })),
      remove: () => ref.child(uid).remove()
    };
  }
  async function initRank() {
    if (Rank.state !== 'idle') return;
    const g = ++Rank.gen;
    Rank.state = 'loading';
    renderRankPanel();
    let be = null;
    try { be = await rankBackend(); } catch (e) { be = null; }
    if (g !== Rank.gen) return;
    if (!be) { Rank.state = 'off'; renderRankPanel(); return; }
    Rank.be = be; Rank.uid = be.uid; Rank.readOnly = !!be.readOnly;
    Rank.state = 'on';
    try {
      Rank.unsub = be.listen(pairs => {
        if (g !== Rank.gen) return;
        Rank.rows = rankRows(pairs);
        renderRankPanel();
      }, () => { if (g === Rank.gen) { Rank.state = 'off'; renderRankPanel(); } });
    } catch (e) { Rank.state = 'off'; }
    renderRankPanel();
    submitRank();
  }
  // 서버 연결이 바뀌면 랭킹을 처음부터 다시 이어요
  function resetRank() {
    Rank.gen += 1;
    if (Rank.unsub) { try { Rank.unsub(); } catch (e) { /* 무시 */ } }
    clearTimeout(Rank.timer);
    Object.assign(Rank, { state: 'idle', be: null, uid: null, rows: [], readOnly: false, writing: false, unsub: null });
  }
  function rankAfterCloud() {
    if (Rank.state === 'loading') return;   // 이미 서버 연결을 기다리는 중이면 알아서 이어져요
    resetRank();
    if (S.rank.joined || rt.tab === 'rank') initRank(); else renderRankPanel();
  }
  // 다른 사람이 쓴 문서는 그대로 믿지 않고 모양을 확인해서 읽어요
  function readRow(id, d) {
    if (!d || typeof d !== 'object') return null;
    const score = Number(d.score), name = cleanName(d.name);
    if (!isFinite(score) || score < 0 || !name) return null;
    const at = typeof d.at === 'number' ? d.at : (Date.parse(d.at) || 0);
    return { id, name, score: Math.floor(score), tier: Number(d.tier) | 0, year: Number(d.year) | 0, test: !!d.test, at,
      pid: typeof d.pid === 'string' ? d.pid.slice(0, 16) : '' };
  }
  // 같은 학교(학교 번호)가 기기를 옮겨서 두 번 있으면 내 것이나 가장 최근 것 하나만 남겨요
  function rankRows(pairs) {
    const best = new Map();
    pairs.forEach(([id, d]) => {
      const r = readRow(id, d);
      if (!r) return;
      const k = r.pid || 'id:' + r.id, old = best.get(k);
      if (!old || (old.id !== Rank.uid && (r.id === Rank.uid || r.at > old.at))) best.set(k, r);
    });
    return [...best.values()].sort((a, b) => b.score - a.score || a.at - b.at).slice(0, RANK_MAX);
  }
  // 점수가 바뀌면 잠깐 모았다가 한 번만 올려요
  const tossRank = () => !!(Rank.be && Rank.be.toss);
  function rankDirty() {
    if (!S || !(S.rank.joined || tossRank()) || Rank.state !== 'on') return;
    clearTimeout(Rank.timer);
    Rank.timer = setTimeout(() => submitRank(), 2000);
  }
  async function submitRank(force) {
    if (Rank.state !== 'on' || Rank.readOnly || !Rank.uid || !(S.rank.joined || tossRank()) || Rank.writing) return;
    const score = rankScore();
    // 다른 기기에서 옮겨 온 학교는 이 기기 id로 처음 올리는 거라서 점수가 같아도 올려요
    if (!force && score === S.rank.sent && S.rank.by === Rank.uid) return;
    const g = Rank.gen, be = Rank.be;
    Rank.writing = true;
    try {
      await be.put({ name: S.rank.name, score, tier: S.tier, year: yearNo(), test: !!S.u.dev, pid: S.pid, at: Date.now() });
      if (g === Rank.gen) { S.rank.sent = score; S.rank.by = Rank.uid; save(); }
    } catch (e) {
      const c = String((e && (e.code || e.message)) || '');
      if (g === Rank.gen && /invalid_argument|not_granted|revoked|permission/i.test(c)) Rank.readOnly = true;
      else if (/quota_exceeded/.test(c)) toast('랭킹 자리가 꽉 찼어요. 나중에 다시 해 보세요');
    }
    if (g !== Rank.gen) return;
    Rank.writing = false;
    if (S.rank.joined && !Rank.readOnly && (rankScore() !== S.rank.sent || S.rank.by !== Rank.uid)) rankDirty();
    renderRankPanel();
  }
  async function joinRank(raw) {
    const name = cleanName(raw);
    if (!name) { toast('랭킹에 보일 이름을 적어 주세요'); renderRankPanel(); return; }
    S.rank.name = name; S.rank.joined = true;
    save();
    await submitRank(true);
    if (!Rank.readOnly) { toast(`'${name}' 이름으로 랭킹에 올렸어요!`); sfx('quest'); }
    renderRankPanel();
  }
  async function leaveRank() {
    S.rank.joined = false; S.rank.sent = -1; S.rank.by = '';
    save();
    if (Rank.state === 'on' && Rank.uid && !Rank.readOnly) {
      try { await Rank.be.remove(); } catch (e) { /* 다음에 다시 빼면 돼요 */ }
    }
    toast('랭킹에서 이름을 뺐어요');
    renderRankPanel();
  }
  // 랭킹을 못 여는 까닭
  function rankOffText() {
    if (!hasCloudBuild()) return '랭킹은 친구들과 함께 여는 게임 화면에서 열려요. 지금은 내 학교 점수만 볼 수 있어요.';
    if (Cloud.state === 'error') return `서버에 연결하지 못해서 지금은 내 학교 점수만 볼 수 있어요. ${CLOUD_ERR[Cloud.err] || CLOUD_ERR.etc}.`;
    return '서버를 연결하기 전 체험판이라서 지금은 내 학교 점수만 볼 수 있어요.';
  }
  function renderRankPanel() {
    if (!S || rt.tab !== 'rank') return;
    const score = rankScore(), mine = Rank.rows.findIndex(r => r.id === Rank.uid);
    $('#rankScore').textContent = fmt(score);
    $('#rankPos').textContent = mine >= 0 ? `${mine + 1}위` : '-';
    $('#rankSub').textContent = rankSchool(S.tier, yearNo()) + (Rank.state === 'on' && Rank.rows.length ? `, 랭킹에 ${Rank.rows.length}명` : '');
    // 참여하기와 이름 바꾸기
    const join = $('#rankJoin'), key = `${Rank.state}|${Rank.readOnly}|${S.rank.joined}|${S.rank.name}|${rt.rankEdit ? 1 : 0}|${Cloud.state}|${Cloud.err}`;
    if (join.dataset.key !== key) {
      join.dataset.key = key;
      if (Rank.state === 'idle' || Rank.state === 'loading') join.innerHTML = '<p>랭킹을 불러오는 중이에요.</p>';
      else if (tossRank()) join.innerHTML = '<p>학교 점수는 토스 게임센터 랭킹에 올라가요. 토스 친구들과 순위를 겨뤄 보세요.</p><button class="cta small" type="button" data-rank="toss">토스 랭킹 보기</button>';
      else if (Rank.state === 'off') {
        join.innerHTML = '<p></p>' + (hasCloudBuild() && Cloud.state === 'error' ? '<button class="btn-link" type="button" data-rank="retry">다시 연결하기</button>' : '');
        $('p', join).textContent = rankOffText();
      }
      else if (Rank.readOnly) join.innerHTML = '<p>지금은 랭킹을 볼 수만 있어요.</p>';
      else if (S.rank.joined && !rt.rankEdit) {
        join.innerHTML = '<div class="rank-who"><span>랭킹 이름</span><b></b><button class="btn-link" type="button" data-rank="edit">이름 바꾸기</button><button class="btn-link" type="button" data-rank="leave">랭킹에서 빼기</button></div>';
        $('b', join).textContent = S.rank.name;
      } else {
        join.innerHTML = `<p>${S.rank.joined ? '새 이름을 적어 주세요.' : '랭킹에 올릴 교장 선생님 이름을 정해요. 다른 사람들에게 이 이름과 학교 점수가 보여요.'}</p>` +
          `<form class="rank-form"><input id="rankName" maxlength="10" autocomplete="off" enterkeyhint="done" placeholder="예: 도토리 교장" aria-label="랭킹 이름"><button class="cta" type="submit">${S.rank.joined ? '바꾸기' : '이름 올리기'}</button></form>`;
        $('#rankName', join).value = S.rank.name;
      }
    }
    // 순위표: 이름은 다른 사람이 적은 글이라 textContent로만 넣어요
    const list = $('#rankList'), rows = Rank.state === 'on' ? Rank.rows : [];
    const lkey = rows.map(r => `${r.id}:${r.score}:${r.name}:${r.tier}:${r.year}:${r.test ? 1 : 0}`).join('|') + `|${Rank.uid}|${S.units}`;
    if (list.dataset.key !== lkey) {
      list.dataset.key = lkey;
      list.textContent = '';
      rows.forEach((r, i) => {
        const li = document.createElement('li');
        li.className = 'rk' + (r.id === Rank.uid ? ' me' : '');
        const no = document.createElement('span');
        no.className = 'rk-no' + (i < 3 ? ' m' + (i + 1) : '');
        no.textContent = String(i + 1);
        const txt = document.createElement('div');
        txt.className = 'rk-txt';
        const nm = document.createElement('div');
        nm.className = 'rk-name';
        const ns = document.createElement('span');
        ns.textContent = r.name;
        nm.appendChild(ns);
        if (r.id === Rank.uid) { const t = document.createElement('span'); t.className = 'rk-tag me'; t.textContent = '나'; nm.appendChild(t); }
        if (r.test) { const t = document.createElement('span'); t.className = 'rk-tag'; t.textContent = '테스트'; nm.appendChild(t); }
        const sc = document.createElement('div');
        sc.className = 'rk-school';
        sc.textContent = rankSchool(r.tier, r.year);
        txt.append(nm, sc);
        const b = document.createElement('b');
        b.className = 'rk-score';
        b.textContent = fmt(r.score);
        li.append(no, txt, b);
        li.setAttribute('aria-label', `${i + 1}위 ${r.name}, ${rankSchool(r.tier, r.year)}, 학교 점수 ${fmt(r.score)}`);
        list.appendChild(li);
      });
    }
    const empty = $('#rankEmpty');
    empty.hidden = tossRank() || !(Rank.state === 'on' && rows.length === 0);
    if (!empty.hidden) empty.textContent = '아직 랭킹에 이름을 올린 교장 선생님이 없어요. 첫 번째가 되어 보세요!';
  }

  /* ---------- 황금 도토리와 꾸미기 상점 ----------
     황금 도토리는 돈으로 사지 않고 모으기만 해요: 광고를 볼 때마다 1개(하루 10개까지), 상점 광고 2개(하루 5번),
     출석 도장 1개(7일째 5개), 메인 퀘스트 한 장 3개, 종업식 2개, 졸업식 10개.
     쓰는 곳은 꾸미기(계속 남아요)와 부스터(한 번 쓰면 끝나요). 뽑기 없이 정해진 값으로만 팔아요.
     토스 미니앱에서는 광고 그룹의 보상 이름을 '황금 도토리', 수량을 1로 맞춰 두면 광고 화면에도 똑같이 보여요. */
  const GOLD = { adDay: 10, shopAd: 5, shopAdN: 2, att: 1, att7: 5, chapter: 3, grad: 2, promote: 10 };
  const HATS = {
    cap: '<path d="M-6.2 -3.2 Q-6.4 -9.6 0 -9.8 Q6.4 -9.6 6.2 -3.2 Z" class="h-cap"/><path d="M-2 -3.6 Q4.6 -5.2 9.6 -3 Q4.8 -1.9 -2 -2.5 Z" class="h-cap2"/><circle cx="0" cy="-9.6" r="0.9" class="h-cap2"/>',
    beanie: '<path d="M-6.4 -2.6 Q-6.6 -10.2 0 -10.4 Q6.6 -10.2 6.4 -2.6 Z" class="h-bean"/><rect x="-6.9" y="-4.4" width="13.8" height="2.8" rx="1.3" class="h-bean2"/><circle cx="0" cy="-10.8" r="2" class="h-bean2"/>',
    straw: '<ellipse cx="0" cy="-4.2" rx="9.4" ry="2.1" class="h-straw"/><path d="M-4.9 -4.2 Q-5.1 -9.6 0 -9.8 Q5.1 -9.6 4.9 -4.2 Z" class="h-straw"/><path d="M-4.9 -5.4 Q0 -4.4 4.9 -5.4" class="s-hband"/>',
    flower: '<path d="M-5.8 -2.8 Q0 -9 5.8 -2.8" class="s-band"/><circle cx="-3.4" cy="-6.3" r="1.7" class="h-fl"/><circle cx="0" cy="-7.4" r="1.9" class="h-fl"/><circle cx="3.4" cy="-6.3" r="1.7" class="h-fl"/><circle cx="0" cy="-7.4" r="0.8" class="h-fl2"/>'
  };
  const NECKS = {
    scarf: '<path d="M-4.8 5 Q0 7.2 4.8 5 L4.8 7 Q0 9.2 -4.8 7 Z" class="n-scarf"/><rect x="1.6" y="6.6" width="2.4" height="4.6" rx="1" class="n-scarf2"/>',
    bow: '<path d="M0 6.6 L-3.4 4.8 L-3.4 8.4 Z M0 6.6 L3.4 4.8 L3.4 8.4 Z" class="n-bow"/><circle cx="0" cy="6.6" r="1.1" class="n-bow2"/>'
  };
  const COS = {
    hat: { name: '학생 모자', items: [
      { id: 'cap', name: '파란 야구모자', price: 8 }, { id: 'beanie', name: '빨간 털모자', price: 10 },
      { id: 'straw', name: '밀짚모자', price: 10 }, { id: 'flower', name: '꽃 머리띠', price: 12 }] },
    neck: { name: '학생 목 장식', items: [
      { id: 'scarf', name: '빨간 목도리', price: 8 }, { id: 'bow', name: '나비넥타이', price: 8 }] },
    roof: { name: '학교 지붕', items: [
      { id: 'blue', name: '파란 지붕', price: 15, c: '#4A78B0' }, { id: 'sakura', name: '벚꽃 학교', price: 25, c: '#E796AE' },
      { id: 'snow', name: '눈 오는 학교', price: 25, c: '#EEF3F7' }] },
    board: { name: '칠판 색', items: [
      { id: 'navy', name: '밤하늘 칠판', price: 10, c: '#22364D' }, { id: 'plum', name: '포도 칠판', price: 10, c: '#44304C' },
      { id: 'wood', name: '나무 칠판', price: 10, c: '#4A3526' }] }
  };
  const COS_IDS = new Set(Object.keys(COS).flatMap(k => COS[k].items.map(it => k + ':' + it.id)));
  const BOOSTERS = {
    feast: { name: '특식 데이 30분', desc: '30분 동안 수업료가 2배예요', price: 3 },
    skip: { name: '2시간 건너뛰기', desc: '수업료 2시간치를 바로 받아요', price: 5 },
    auto: { name: '도토리 자동 줍기 1시간', desc: '떨어진 도토리를 알아서 주워요', price: 3 }
  };
  const BOOST_ART = {
    feast: '<svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M-9 -1 H9 Q8.4 8 0 8.6 Q-8.4 8 -9 -1 Z" class="c-wall"/><path d="M-9 -1 H9" class="s-hatband"/><path d="M-6 -2 Q-6 -7 -2 -6.4 Q0 -9.4 3 -7 Q7 -7.6 6.4 -2 Z" class="c-dip"/><path d="M4 -10 L8 -3" stroke="#8A5D3B" stroke-width="1.2" stroke-linecap="round"/></svg>',
    skip: '<svg viewBox="-12 -12 24 24" aria-hidden="true"><circle r="9" class="c-clock"/><path d="M0 -5.6 V0 L4 2.6" fill="none" stroke="#6D4828" stroke-width="1.8" stroke-linecap="round"/></svg>',
    auto: '<svg viewBox="-12 -13 24 24" aria-hidden="true"><g transform="scale(1.25)">' + ACORN + '</g><path d="M6 -10 l1.2 2.6 2.6 1.2 -2.6 1.2 -1.2 2.6 -1.2 -2.6 -2.6 -1.2 2.6 -1.2 Z" class="c-gnut"/></svg>'
  };
  const GOLD_ICON = '<svg viewBox="-8 -11 16 20" aria-hidden="true"><path d="M-4.6 -1 Q-4.9 5.4 0 7.4 Q4.9 5.4 4.6 -1 Z" class="c-gnut"/><ellipse cx="-1.8" cy="2" rx="0.9" ry="2.1" class="c-gshine"/><path d="M-5.8 -0.8 Q-5.8 -6.2 0 -6.6 Q5.8 -6.2 5.8 -0.8 Q0 0.8 -5.8 -0.8 Z" class="c-gcap"/><path d="M-4 -3.2 H4 M-2.8 -5 H2.8" class="s-gline"/><path d="M0 -6.6 L0.9 -9.2" class="s-gstem"/></svg>';
  const autoOn = () => !!S && Date.now() < S.autoUntil;
  function goldDay() { const t = todayStr(); if (S.gd.day !== t) { S.gd.day = t; S.gd.n = 0; S.gd.shop = 0; } }
  function addGold(n) {
    if (!(n > 0)) return;
    S.gold += n; S.st.gold += n;
    renderShopBtn();
    const b = $('#btnShop');
    if (!b.hidden) { const sp = document.createElement('span'); sp.className = 'gpop'; sp.textContent = '+' + n; b.appendChild(sp); setTimeout(() => sp.remove(), 1400); }
    if (rt.tab === 'shop') renderShop();
  }
  // 광고를 끝까지 보면 덤으로 1개 (하루 10개까지)
  function adGold() { goldDay(); if (S.gd.n >= GOLD.adDay) return; S.gd.n += 1; addGold(1); }
  function renderShopBtn() {
    $('#goldN').textContent = fmt(S.gold);
    $('#btnShop').setAttribute('aria-label', `황금 도토리 상점, 황금 도토리 ${fmt(S.gold)}개`);
  }
  // 꾸민 모습을 학교에 입혀요: 학생 소품은 학생을 다시 그리고, 지붕과 칠판은 색 이름표를 바꿔요
  function applyCos() {
    rt.kids.forEach(k => { k.g.innerHTML = kidSVG(k.sp, k.bag); });
    const map = $('#map');
    ['blue', 'sakura', 'snow'].forEach(r => map.classList.toggle('rs-' + r, S.cos.roof === r));
    ['navy', 'plum', 'wood'].forEach(b => $('.board').classList.toggle('bt-' + b, S.cos.board === b));
    const fx = $('#fallFx'), kind = S.cos.roof === 'sakura' ? 'petal' : S.cos.roof === 'snow' ? 'snow' : '';
    if (fx.dataset.kind !== kind) {
      fx.dataset.kind = kind;
      fx.textContent = '';
      fx.className = 'fallfx' + (kind === 'snow' ? ' snow' : '');
      for (let i = 0; kind && i < 16; i++) {
        const e = document.createElement('i');
        e.style.left = (Math.random() * 100).toFixed(1) + '%';
        e.style.setProperty('--dx', (Math.random() * 40 - 20).toFixed(0) + 'px');
        e.style.setProperty('--y', (Math.random() * 96).toFixed(1) + '%');
        e.style.animationDuration = (7 + Math.random() * 6).toFixed(1) + 's';
        e.style.animationDelay = (-Math.random() * 12).toFixed(1) + 's';
        fx.appendChild(e);
      }
    }
    fx.hidden = !kind;
  }
  function cosArt(cat, it) {
    if (cat === 'hat' || cat === 'neck') {
      const look = { hat: cat === 'hat' ? it.id : '', neck: cat === 'neck' ? it.id : '' };
      return `<svg viewBox="-11 -13.5 22 27" aria-hidden="true">${kidSVG('bear', 0, look)}</svg>`;
    }
    if (cat === 'roof') {
      const dots = it.id === 'sakura' ? '<circle cx="8" cy="9" r="1.3" fill="#F5B3C6"/><circle cx="30" cy="6" r="1.2" fill="#F5B3C6"/><circle cx="33" cy="16" r="1.1" fill="#F5B3C6"/>'
        : it.id === 'snow' ? '<circle cx="8" cy="8" r="1.2" fill="#fff"/><circle cx="31" cy="6" r="1.1" fill="#fff"/><circle cx="34" cy="15" r="1" fill="#fff"/><circle cx="6" cy="16" r="1" fill="#fff"/>' : '';
      return `<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="10" y="19" width="20" height="15" class="c-wall"/><rect x="17.5" y="25" width="5" height="9" rx="1" class="c-door"/><path d="M6 21 L20 9 L34 21 Z" fill="${it.c}"/>${dots}</svg>`;
    }
    return `<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="5" y="9" width="30" height="21" rx="3" fill="${it.c}" stroke="#7A522D" stroke-width="2.5"/><path d="M10 16 h12 M10 21 h17 M10 26 h8" stroke="#F3F2E8" stroke-width="1.6" stroke-linecap="round"/></svg>`;
  }
  function openShop() {
    if (rt.modalOpen) closeModal(rt.modalOpen);
    setTab('shop');
  }
  function renderShop() {
    goldDay();
    $('#shopHave').innerHTML = GOLD_ICON + '<span></span>';
    $('#shopHave span').textContent = fmt(S.gold);
    const left = GOLD.shopAd - S.gd.shop;
    $('#shopAd').setAttribute('aria-disabled', left > 0 ? 'false' : 'true');
    $('#shopAdLeft').textContent = left > 0 ? `오늘 ${left}번 더 받을 수 있어요` : '오늘 상점 광고를 모두 봤어요. 내일 다시 열려요';
    const coin = `<svg viewBox="-8 -11 16 20" aria-hidden="true">${GOLD_ICON.slice(GOLD_ICON.indexOf('>') + 1, -6)}</svg>`;
    let h = '<h3 class="shop-h">부스터 <small>한 번 쓰면 끝나요</small></h3>';
    for (const k of Object.keys(BOOSTERS)) {
      const B = BOOSTERS[k], poor = S.gold < B.price;
      h += `<div class="sb"><span class="pv">${BOOST_ART[k]}</span><span class="tx"><b>${B.name}</b><span>${B.desc}</span></span>` +
        `<button class="buy${poor ? ' poor' : ''}" type="button" data-buy="b:${k}" aria-label="${B.name}, 황금 도토리 ${B.price}개">${coin}${B.price}</button></div>`;
    }
    for (const cat of Object.keys(COS)) {
      h += `<h3 class="shop-h">${COS[cat].name}</h3><div class="shop-grid">`;
      for (const it of COS[cat].items) {
        const key = cat + ':' + it.id, own = S.cos.own.includes(key), on = S.cos[cat] === it.id, poor = !own && S.gold < it.price;
        const wear = cat === 'hat' || cat === 'neck';
        const pr = on ? (wear ? '입는 중' : '쓰는 중') : own ? (wear ? '입기' : '쓰기') : `${coin}${it.price}`;
        h += `<button class="si${own ? ' own' : ''}${on ? ' on' : ''}${poor ? ' poor' : ''}" type="button" data-buy="c:${key}" aria-pressed="${on}">` +
          `<span class="pv">${cosArt(cat, it)}</span><span class="nm">${it.name}</span><span class="pr">${pr}</span></button>`;
      }
      h += '</div>';
    }
    h += `<p class="shop-note">황금 도토리 모으는 곳: 광고를 끝까지 보면 1개(하루 ${GOLD.adDay}개까지), 출석 도장 1개(7일째 ${GOLD.att7}개), 메인 퀘스트 한 장 ${GOLD.chapter}개, 종업식 ${GOLD.grad}개, 졸업식 ${GOLD.promote}개. 쓰고 있는 꾸미기를 한 번 더 누르면 원래대로 돌아가요.</p>`;
    const list = $('#shopList'), top = list.scrollTop;
    list.innerHTML = h;
    list.scrollTop = top;
    // 사기 전에 한 번 더 물어봐요
    const ask = $('#shopAsk'), it = shopItem(rt.shopPick);
    ask.hidden = !it;
    if (it) {
      const enough = S.gold >= it.price;
      $('#shopAskText').textContent = enough ? `${it.name}${it.ga} 황금 도토리 ${it.price}개로 살까요?` : `황금 도토리가 ${it.price - S.gold}개 모자라요.`;
      $('#shopYes').textContent = enough ? '사기' : '광고 보고 모으기';
    }
  }
  // '파란 야구모자를', '밀짚모자를'처럼 받침에 맞는 조사
  const eulOf = w => { const c = w.charCodeAt(w.length - 1) - 0xAC00; return c >= 0 && c <= 11171 && c % 28 ? '을' : '를'; };
  function shopItem(pick) {
    if (!pick) return null;
    const [t, a, b] = pick.split(':');
    if (t === 'b' && BOOSTERS[a]) return { kind: 'b', k: a, name: BOOSTERS[a].name, ga: eulOf(BOOSTERS[a].name), price: BOOSTERS[a].price };
    const it = t === 'c' && COS[a] && COS[a].items.find(x => x.id === b);
    return it ? { kind: 'c', cat: a, id: b, name: it.name, ga: eulOf(it.name), price: it.price } : null;
  }
  function pickShop(pick) {
    const it = shopItem(pick);
    if (!it) return;
    sfx('tap');
    if (it.kind === 'c' && S.cos.own.includes(it.cat + ':' + it.id)) {   // 산 꾸미기는 바로 입고 벗어요
      S.cos[it.cat] = S.cos[it.cat] === it.id ? '' : it.id;
      rt.shopPick = '';
      applyCos(); save(); renderShop();
      const wear = it.cat === 'hat' || it.cat === 'neck';
      toast(S.cos[it.cat] ? `${it.name}${it.ga} ${wear ? '입혔어요' : '골랐어요'}` : wear ? `${it.name}${it.ga} 벗었어요` : '원래 모습으로 돌렸어요');
      return;
    }
    rt.shopPick = pick;
    renderShop();
  }
  function buyShop() {
    const it = shopItem(rt.shopPick);
    if (!it) return;
    if (S.gold < it.price) { rt.shopPick = ''; shopAd(); return; }
    S.gold -= it.price; S.st.gspent += it.price;
    rt.shopPick = '';
    if (it.kind === 'c') {
      S.cos.own.push(it.cat + ':' + it.id);
      S.cos[it.cat] = it.id;
      applyCos();
      toast(`${it.name}${it.ga} 샀어요! ${it.cat === 'hat' || it.cat === 'neck' ? '바로 입혀 뒀어요' : '바로 바꿔 뒀어요'}`);
    } else useBooster(it.k);
    sfx('quest'); buzz(15);
    save(); renderShopBtn(); renderShop(); renderHUD(); renderAffordance(); renderDeal();
  }
  function useBooster(k) {
    if (k === 'feast') { S.hd.feastUntil = Math.max(Date.now(), S.hd.feastUntil) + 30 * 60000; toast('특식 데이! 30분 동안 수업료가 2배예요'); }
    else if (k === 'skip') {
      const v = rate() * 7200;
      S.budget += v; earn(v);
      S.students = Math.min(capacity(), S.students + CFG.enroll * 7200);
      floatText(180, 40, '+' + fmt(v), 'gold');
      toast(`2시간을 건너뛰었어요! 도토리 +${fmt(v)}`);
    } else if (k === 'auto') {
      S.autoUntil = Math.max(Date.now(), S.autoUntil) + 3600000;
      toast(S.f.playground >= 1 ? '1시간 동안 떨어진 도토리를 알아서 주워요' : '1시간 동안 떨어진 도토리를 알아서 주워요. 운동장을 지으면 도토리가 떨어져요');
    }
  }
  // 상점 광고: 끝까지 보면 2개 (이때는 광고 덤 1개를 따로 주지 않아요)
  function shopAd() {
    goldDay();
    if (S.gd.shop >= GOLD.shopAd) { shake($('#shopAd')); return; }
    rt.adNoGold = true;
    showAd(() => {
      goldDay(); S.gd.shop += 1;
      addGold(GOLD.shopAdN);
      sfx('quest');
      toast(`황금 도토리 +${GOLD.shopAdN}개를 받았어요`);
      save();
      if (rt.tab === 'shop') renderShop();
    }, () => {
      toast('광고를 끝까지 보지 않아서 황금 도토리가 없어요');
    });
  }

  /* ---------- 출석부 ---------- */
  function attState() {
    const n = S.att.n, stamped = !canStamp();
    const filled = stamped ? ((n - 1) % 7) + 1 : n % 7;
    return { filled, next: stamped ? -1 : filled };
  }
  function attValue(i) {
    const a = ATT[i];
    return a.d ? { kind: 'dip', v: a.d } : { kind: 'acorn', v: Math.max(a.m * 20, nice(rate() * 60 * a.m)) };
  }
  function renderAtt(justIdx) {
    const { filled, next } = attState();
    $('#attGrid').innerHTML = ATT.map((a, i) => {
      const reward = a.d ? `${dipIcon()}${a.d}장` : `${acornIcon()}${a.m}분치`;
      const stamped = i < filled;
      return `<div class="att-cell${i === 6 ? ' big' : ''}${i === next ? ' today' : ''}${i === justIdx ? ' just' : ''}${stamped ? ' done' : ''}">` +
        `<span>${i + 1}일째</span><b>${reward}</b>` +
        (stamped ? '<span class="stamp" aria-label="출석 완료"><i>참<br>잘했어요</i></span>' : '') + '</div>';
    }).join('');
    const go = $('#attGo');
    const can = canStamp();
    go.textContent = can ? '오늘 도장 받기' : '내일 또 만나요';
    go.setAttribute('aria-disabled', can ? 'false' : 'true');
    $('#attTotal').textContent = S.att.n > 0 ? `지금까지 ${S.att.n}일 출석했어요. 하루를 걸러도 이어서 찍혀요.` : '하루를 걸러도 이어서 찍혀요.';
  }
  function openAtt() {
    if (rt.paused || rt.modalOpen) return;
    renderAtt(-1);
    sfx('tap');
    openModal($('#mAtt'));
  }
  function stampAtt() {
    if (!canStamp()) { shake($('#attGo')); return; }
    const i = S.att.n % 7, r = attValue(i), g = i === 6 ? GOLD.att7 : GOLD.att;
    S.att.n += 1; S.att.last = todayStr();
    if (r.kind === 'dip') { addDip(r.v); toast(`출석 도장 쾅! 수료증 +${r.v}장, 황금 도토리 +${g}`); }
    else { S.budget += r.v; earn(r.v); toast(`출석 도장 쾅! 도토리 +${fmt(r.v)}, 황금 도토리 +${g}`); }
    addGold(g);
    sfx('quest'); buzz(20);
    renderAtt(i);
    save(); renderHUD(); renderAffordance();
  }

  /* ---------- 종업식, 졸업식, 명예 교장실 ---------- */
  function renderGradPanel(force) {
    if (rt.tab !== 'grad' && !force) return;
    const d = previewDip(), can = canGraduate(), T = tierInfo(), N = TIERS[S.tier + 1];
    $('#gYear').textContent = yearLabel();
    // 마지막 해에는 종업식 카드를 숨기고 바로 아래 졸업식 카드로 안내해요
    const last = finalYear();
    $('#gCard').hidden = last;
    $('#gLead').textContent = last
      ? `${T.name}${T.unit === '년째' ? `은 ${T.years}년째가 마지막 해예요` : `는 ${T.years}학년이 마지막 학년이에요`}. 대도시 학교가 되면 종업식 대신 졸업식을 열고 ${N.school}에 입학해요. 수료증은 명예 교장실에서 써요.`
      : `대도시 학교가 되면 종업식을 열 수 있어요. 학교와 동네는 처음으로 돌아가지만, 수료증으로 명예 교장실을 고치면 ${T.unit === '년째' ? '다음 해는' : '다음 학년은'} 더 빨리 자라요.`;
    $('#gHave').textContent = fmt(S.p.dip);
    $('#gPreview').textContent = `${fmt(d)}장`;
    const lo = dipAt(d), hi = dipAt(d + 1);
    const p = Math.max(0, Math.min(1, (S.yearEarned - lo) / (hi - lo)));
    $('#gBar').style.width = (p * 100).toFixed(1) + '%';
    $('#gBarWrap').setAttribute('aria-valuenow', Math.round(p * 100));
    $('#gNote').textContent = can
      ? `${S.hd.album ? '단체 사진 덕분에 수료증이 1.5배예요. ' : ''}다음 수료증까지 도토리 ${fmt(Math.ceil(hi - S.yearEarned))}개 더 벌면 돼요. 오래 운영할수록 수료증이 늘지만 점점 느려져요.`
      : `${CFG.grades[GRAD_MIN].title}가 되면 종업식을 열 수 있어요. 지금은 ${CFG.grades[S.grade].title}예요.`;
    const btn = $('#gBtn');
    btn.textContent = can ? `종업식 열기 (수료증 ${fmt(d)}장)` : '아직 열 수 없어요';
    btn.setAttribute('aria-disabled', can ? 'false' : 'true');
    if (!can) $('#gConfirm').hidden = true;
    renderTierCard();
    // 명예 교장실, 장학재단, 전학생 목록은 바뀐 게 있을 때만 다시 그려요
    const key = [S.p.dip, ...Object.keys(PERKS).map(k => S.p.perk[k]), S.p.species, S.st.grads, S.tier, S.fund, ...Object.keys(FPERKS).map(k => S.fp[k])].join('|');
    if (force || key !== rt.gKey) {
      rt.gKey = key;
      $('#perkList').innerHTML = Object.keys(PERKS).map(k => {
        const P = PERKS[k], L = S.p.perk[k], maxed = perkMaxed(k), c = perkCost(k);
        return `<div class="perk"><span class="p-ic">${P.icon}</span>` +
          `<div><b>${P.name} <span class="p-lv">Lv.${L}</span></b><small>${P.desc}</small>` +
          `<span class="p-eff">${maxed ? P.eff(L) + ' (최고)' : `${P.eff(L)} → ${P.eff(L + 1)}`}</span></div>` +
          (maxed ? '<button class="btn-perk" type="button" aria-disabled="true">최고</button>'
            : `<button class="btn-perk" type="button" data-perk="${k}" aria-disabled="${S.p.dip >= c ? 'false' : 'true'}" aria-label="${P.name} 고치기, 수료증 ${c}장">${dipIcon()}${c}</button>`) +
          '</div>';
      }).join('');
      $('#perkHave').innerHTML = dipShown()
        ? `${dipIcon()}<span>가진 수료증 <b>${fmt(S.p.dip)}</b>장</span>`
        : `${dipIcon()}<span>종업식을 열면 수료증을 받아요</span>`;
      $('#fundHave').innerHTML = S.fund > 0 || S.tier > 0
        ? `${fundIcon()}<span>가진 기금 <b>${fmt(S.fund)}</b></span>`
        : `${fundIcon()}<span>졸업하면 기금을 받아요</span>`;
      $('#fundList').innerHTML = Object.keys(FPERKS).map(k => {
        const P = FPERKS[k], L = S.fp[k], c = fpCost(k);
        return `<div class="perk"><span class="p-ic">${P.icon}</span>` +
          `<div><b>${P.name} <span class="p-lv">Lv.${L}</span></b><small>${P.desc}</small>` +
          `<span class="p-eff">${P.eff(L)} → ${P.eff(L + 1)}</span></div>` +
          `<button class="btn-perk" type="button" data-fperk="${k}" aria-disabled="${S.fund >= c ? 'false' : 'true'}" aria-label="${P.name} 고치기, 기금 ${c}"><span class="fic">${fundIcon()}</span>${c}</button></div>`;
      }).join('');
      $('#friendList').innerHTML = NEWCOMERS.map((n, i) => {
        const has = i < S.p.species;
        return `<div class="friend${has ? '' : ' locked'}"><span class="f-av">${kidAvatar(n.k)}</span>` +
          `<span>${has ? n.name : `${i + 1}번째 전학생`}</span></div>`;
      }).join('');
    }
  }
  // 졸업 전에 조금 더 벌면 기금이 하나 느는지 알려 줘요
  function nextFundNote() {
    const tot = S.tdip + previewDip(), goal = (Math.floor(tot / FUND_PER) + 1) * FUND_PER;
    const more = Math.ceil(dipAt(goal - S.tdip) - S.yearEarned);
    return more > 0 ? `도토리를 ${fmt(more)}개 더 벌고 가면 기금이 1 늘어요.` : '';
  }
  // 졸업식 카드: 다음 학교급, 조건 두 가지, 받게 될 기금
  function renderTierCard() {
    const T = tierInfo(), N = TIERS[S.tier + 1], open = nextTierOpen(), can = canPromote(), f = previewFund();
    $('#tierFrom').textContent = T.school;
    $('#tierTo').textContent = N ? N.school : '';
    const reqs = [
      { ok: S.tg >= T.grads, txt: `${T.name} ${T.years}${T.unit} 되기 (지금 ${yearNo()}${T.unit})` },
      { ok: S.grade >= GRAD_MIN, txt: `대도시 학교 되기 (지금 ${CFG.grades[S.grade].name})` }
    ];
    const html = reqs.map(r => `<li class="${r.ok ? 'ok' : ''}"><span class="mk2">${r.ok ? CHECK : ''}</span>${r.txt}</li>`).join('');
    if ($('#tierReqs').innerHTML !== html) $('#tierReqs').innerHTML = html;
    $('#tierFund').textContent = fmt(f);
    $('#tierNote').textContent = !open
      ? `${N.name}는 다음 업데이트에 열려요. 그동안 종업식을 열어 수료증을 모아 두면 졸업할 때 기금이 늘어요.`
      : can ? `지금 졸업하면 기금 ${fmt(f)}${numEul(f)} 받아요. ${nextFundNote()}`
      : `이 학교급에서 모은 수료증 ${FUND_PER}장마다 기금이 1씩 늘어요. 올해 수료증도 함께 쳐요. 지금까지 ${fmt(S.tdip)}장을 모았어요.`;
    const btn = $('#tierBtn');
    btn.textContent = open ? `졸업식 열기 (${N.name} 입학)` : `${N.name} 준비 중`;
    btn.setAttribute('aria-disabled', can ? 'false' : 'true');
    if (!can) $('#tierConfirm').hidden = true;
  }
  function buyPerk(k, btn) {
    if (rt.paused || perkMaxed(k)) return;
    const c = perkCost(k);
    if (S.p.dip < c) { shake(btn); return; }
    S.p.dip -= c;
    S.p.perk[k] += 1;
    S.st.perks += 1;
    toast(`${PERKS[k].name} Lv.${S.p.perk[k]}! ${PERKS[k].eff(S.p.perk[k])}`);
    sfx('buy'); buzz(10);
    checkGrade();   // 소문난 졸업생은 평판을 바로 올려요
    renderGradPanel(true); renderHUD(); renderMap(); renderAffordance();
    save();
  }
  function buyFundPerk(k, btn) {
    if (rt.paused) return;
    const c = fpCost(k);
    if (S.fund < c) { shake(btn); return; }
    S.fund -= c;
    S.fp[k] += 1;
    S.st.fperks += 1;
    toast(`${FPERKS[k].name} Lv.${S.fp[k]}! ${FPERKS[k].eff(S.fp[k])}`);
    sfx('buy'); buzz(10);
    checkGrade();   // 재단 이사회는 평판을 바로 올려요
    renderGradPanel(true); renderHUD(); renderMap(); renderAffordance();
    save();
  }
  function askGraduate() {
    if (!canGraduate()) { shake($('#gBtn')); return; }
    const d = previewDip();
    const T = tierInfo(), n = S.tg + 2;
    const begins = n > T.years ? '새 학기가' : `${T.name} ${yearSubj(n, T)}`;
    let txt = `종업식을 열면 ${begins} 시작돼요. 도토리, 시설, 선생님, 동네는 처음으로 돌아가고 수료증 ${fmt(d)}장을 받아요. 명예 교장실과 전학 온 친구들, 퀘스트 기록은 그대로 남아요.`;
    if (mainReady()) txt += ' 받지 않은 메인 퀘스트 보상이 있으니 먼저 받아 주세요.';
    $('#gConfirmText').textContent = txt;
    $('#gConfirm').hidden = false;
    $('#gNo').focus({ preventScroll: true });
  }
  // 새 학기: 학교는 처음으로 돌아가고 종업식과 졸업식으로 얻은 것만 남아요
  function newYear() {
    S.budget = startBudget(S.p.perk.start) * costScale();
    S.students = 4;
    S.f = { classroom: 1, cafeteria: 0, library: 0, playground: 0, science: 0 };
    S.t = { squirrel: 1, owl: 0, bear: 0 };
    S.grade = 0; S.pending = 0; S.pendingSec = 0; S.yearEarned = 0;
    S.q.subs = S.q.subs.filter(s => COUNT_TYPES.has(s.t));
    fillSubs();
    const mq = curMain();
    if (mq && !COUNT_TYPES.has(mq.t)) startMain();
    rt.kids.forEach(k => k.g.remove()); rt.kids = [];
    clearDrops(); rt.dropT = 0; rt.guideKey = null;
    rt.deal = null;   // 학교가 새로 시작하면 까치도 새 소식을 찾아와요
  }
  function graduate() {
    if (!canGraduate() || rt.paused) return;
    const dip = previewDip(), leaving = Math.floor(S.students);
    addDip(dip);
    S.hd.album = false;
    S.st.grads += 1; S.tg += 1;
    cloudSoon();
    addGold(GOLD.grad);
    let newcomer = null;
    if (S.p.species < NEWCOMERS.length) { newcomer = NEWCOMERS[S.p.species]; S.p.species += 1; }
    newYear();
    if (newcomer) rt.kidSeq = BASE_SPECIES.length + S.p.species - 1;   // 새 친구가 맨 먼저 교문으로 들어와요
    $('#gConfirm').hidden = true;
    checkGrade();
    syncKids(false);
    renderMap(); renderHUD(); renderAffordance(); renderGradPanel(true);
    save();
    queueModal(() => showCeremony(dip, leaving, newcomer));
  }
  function showCeremony(dip, leaving, newcomer) {
    // 방금 마친 해와 새로 시작하는 해 (다음 학교급이 아직 닫혀 있으면 마지막 해를 다시 해요)
    const T = tierInfo(), N = TIERS[S.tier + 1], ended = Math.min(S.tg, T.years), n = S.tg + 1;
    $('#gradTitle').textContent = `${T.name} ${ended}${T.unit} 종업식`;
    $('#gradText').textContent = `학생 ${leaving}명이 ${ended}${T.unit}${T.unit === '년째' ? '를' : '을'} 마쳤어요. ` + (n <= T.years
      ? `이제 ${T.name} ${yearSubj(n, T)} 시작돼요.`
      : `${N ? N.name + '가 열릴 때까지 ' : ''}${T.years}${T.unit} 교실에서 새 친구들을 맞아요.`);
    $('#gradOk').textContent = n <= T.years ? `${n}${T.unit} 시작하기` : '새 학기 시작하기';
    $('#gradDip').textContent = '+' + fmt(dip);
    $('#gradArt').innerHTML = newcomer
      ? `<svg viewBox="-10 -15.5 20 27" aria-hidden="true">${kidSVG(newcomer.k, 0)}</svg>`
      : `<svg viewBox="-10 -10 20 20" aria-hidden="true">${DIP}</svg>`;
    $('#gradNew').textContent = newcomer
      ? `새 친구 ${newcomer.name}${newcomer.ga} 전학 왔어요! 앞으로 수업료 +5%`
      : '전학 올 친구를 모두 만났어요. 수료증으로 명예 교장실을 고쳐 보세요.';
    $('#gradNew').textContent += ` 황금 도토리 +${GOLD.grad}개도 받았어요.`;
    openModal($('#mGrad'));
    sfx('bell'); setTimeout(() => sfx('quest'), 900);
    return true;
  }
  /* 졸업식: 수료증과 명예 교장실은 처음부터, 기금과 장학재단, 전학 온 친구들은 남아요 */
  function askPromote() {
    if (!canPromote()) { shake($('#tierBtn')); return; }
    const f = previewFund();
    let txt = `졸업식을 열면 ${TIERS[S.tier + 1].school}에 입학해요. 도토리, 시설, 선생님, 동네에 더해 수료증과 명예 교장실도 처음부터예요. 장학재단 기금 ${fmt(f)}${numEul(f)} 받고, 전학 온 친구들과 장학재단, 퀘스트 기록은 그대로 남아요.`;
    if (mainReady()) txt += ' 받지 않은 메인 퀘스트 보상이 있으니 먼저 받아 주세요.';
    $('#tierConfirmText').textContent = txt;
    $('#tierConfirm').hidden = false;
    $('#tierNo').focus({ preventScroll: true });
  }
  function promote() {
    if (!canPromote() || rt.paused) return;
    const fund = previewFund(), leaving = Math.floor(S.students), from = tierInfo();
    const dipsIn = Math.floor(S.tdip + previewDip());   // 이번 학교급에서 모은 수료증 (기금으로 바뀌어요)
    S.fund += fund;
    S.st.dips += previewDip();   // 마지막 해 수료증은 기금이 되지만 학교 점수에는 더해요
    rankDirty();
    S.hd.album = false;
    S.st.grads += 1;   // 졸업식도 종업식과 함께 행사 횟수로 쳐요
    cloudSoon();
    addGold(GOLD.promote);
    let newcomer = null;
    if (S.p.species < NEWCOMERS.length) { newcomer = NEWCOMERS[S.p.species]; S.p.species += 1; }
    S.tier += 1; S.tg = 0; S.tdip = 0; S.best = 0;
    S.p.dip = 0;
    for (const k in S.p.perk) S.p.perk[k] = 0;
    newYear();
    if (newcomer) rt.kidSeq = BASE_SPECIES.length + S.p.species - 1;
    $('#tierConfirm').hidden = true;
    queueModal(() => showEntrance(fund, leaving, from, newcomer, dipsIn));
    checkGrade();
    syncKids(false);
    renderMap(); renderHUD(); renderAffordance(); renderGradPanel(true);
    save();
  }
  function showEntrance(fund, leaving, from, newcomer, dipsIn) {
    const T = tierInfo();
    $('#tierTitle').textContent = `${from.school} 졸업식`;
    $('#tierText').textContent = `${eul(from.name)} 마친 친구들 ${leaving}명이 졸업장을 받았어요. 이제 책가방을 메고 ${T.school}에 입학해요!`;
    $('#tierFundAmt').textContent = '+' + fmt(fund);
    const crew = ['rabbit', newcomer ? newcomer.k : 'fox', 'chick'];
    $('#tierArt').innerHTML = `<svg viewBox="-26 -19 52 38" aria-hidden="true">` +
      crew.map((sp, i) => `<g transform="translate(${(i - 1) * 15} ${i === 1 ? -2 : 1}) scale(${i === 1 ? 1.1 : 0.95})">${kidSVG(sp, i)}</g>`).join('') + '</svg>';
    $('#tierFine').textContent = `${from.name}에서 모은 수료증 ${fmt(dipsIn || 0)}장이 장학재단 기금이 됐어요. ` + (newcomer ? `새 친구 ${newcomer.name}${newcomer.ga} 함께 왔어요. ` : '') +
      `새로 생긴 과학실을 지어 보세요. 기금은 졸업 탭의 장학재단에서 써요. 졸업 선물로 황금 도토리 +${GOLD.promote}개를 받았어요.`;
    $('#tierOk').textContent = `${T.name} 입학하기`;
    openModal($('#mTier'));
    sfx('bell'); setTimeout(() => sfx('quest'), 900);
    return true;
  }
  function goGrad(where) {
    setTab('grad');
    const el = where === 'perks' ? $('#perkHead') : where === 'tier' ? $('#tierCard') : where === 'fund' ? $('#fundHead') : null;
    if (el) el.scrollIntoView({ block: where === 'tier' ? 'center' : 'start', behavior: rt.reduced ? 'auto' : 'smooth' });
  }

  /* ---------- 퀘스트 ---------- */
  function qMeasure(q) {
    switch (q.t) {
      case 'fac': return S.f[q.k];
      case 'tea': return S.t[q.k];
      case 'teaAll': return Math.min(S.t.squirrel, S.t.owl, S.t.bear);
      case 'students': return Math.floor(S.students + 1e-6);
      case 'grade': case 'ygrade': return rep();
      case 'rate': return rate();
      case 'earned': return S.earned;
      case 'tier': return S.tier;
      case 'tgrads': return S.tg;
      default: return S.st[q.t] || 0;   // picks, ups, trains, claims, grads, perks, fperks
    }
  }
  const qNeed = q => (q.t === 'grade' || q.t === 'ygrade') ? townRep(q.n) : q.n;
  // 퀘스트 보상: rm이 있으면 지금 수업료 몇 분치
  const qReward = q => q.rm ? Math.max(10, nice(rate() * 60 * q.rm)) : q.r;
  function qDone(q, base) {
    if (!q) return false;
    if (q.t === 'grade') return S.best >= q.n;   // 한 번이라도 오른 등급이면 종업식 뒤에도 완료로 쳐요
    if (q.t === 'ygrade') return S.grade >= q.n;   // 올해 동네가 그 단계까지 자랐는지
    const v = qMeasure(q);
    return COUNT_TYPES.has(q.t) ? v - base >= q.n - 1e-6 : v >= q.n - 1e-6;
  }
  function qProg(q, base) {
    const done = qDone(q, base) || (q === curMain() && S.q.lat === q.id), need = qNeed(q), v = qMeasure(q);
    let frac, text;
    if (COUNT_TYPES.has(q.t)) {
      const cur = Math.max(0, Math.min(need, v - base));
      frac = cur / need;
      text = `${fmt(cur)}/${fmt(need)}`;
    } else if (q.t === 'tier') {
      // 졸업식 퀘스트: 마지막 해 전까지는 몇 년째인지, 마지막 해에는 대도시까지 남은 평판으로 막대를 채워요
      const T = tierInfo(), need = townRep(GRAD_MIN), r = Math.min(rep(), need);
      if (canPromote()) { frac = 0.96; text = '준비 끝'; }
      else if (finalYear()) { frac = (T.grads + r / need) / (T.grads + 1); text = `★${r}/${need}`; }
      else { frac = Math.min(S.tg, T.grads) / (T.grads + 1); text = `${yearNo()}${T.unit}`; }
    } else {
      // 레벨, 학생 수, 평판은 퀘스트를 받은 때부터 얼마나 왔는지로 막대를 채워요
      const from = Math.min(base, need), shown = Math.min(v, need);
      frac = need > from ? (shown - from) / (need - from) : 1;
      if (q.t === 'grade' || q.t === 'ygrade') text = `★${shown}/${need}`;
      else if (q.t === 'rate') text = `${fmtRate(shown)}/${fmt(need)}`;
      else if ((q.t === 'fac' || q.t === 'tea') && need === 1) text = `${shown}/1`;
      else if (q.t === 'students') text = `${shown}/${need}명`;
      else if (q.t === 'grads' || q.t === 'perks' || q.t === 'tgrads' || q.t === 'fperks') text = `${shown}/${need}번`;
      else text = `Lv.${shown}/${need}`;
    }
    return { done, frac: done ? 1 : Math.max(0, Math.min(1, frac)), text };
  }
  function qGoal(q) {
    switch (q.t) {
      case 'fac': return q.n === 1 ? `${FAC[q.k].name} 짓기` : `${FAC[q.k].name} Lv.${q.n} 만들기`;
      case 'tea': return q.n === 1 ? `${TEA[q.k].name} 모셔 오기` : `${TEA[q.k].name} Lv.${q.n}`;
      case 'teaAll': return `선생님 모두 Lv.${q.n}`;
      case 'students': return `학생 ${q.n}명 모으기`;
      case 'grade': case 'ygrade': return `${CFG.grades[q.n].title} 되기`;
      case 'rate': return `초당 도토리 ${fmt(q.n)}개 벌기`;
      case 'picks': return `떨어진 도토리 ${q.n}개 줍기`;
      case 'ups': return `시설 ${q.n}번 고치기`;
      case 'trains': return `선생님 연수 ${q.n}번 보내기`;
      case 'claims': return `자리 비운 보상 ${q.n}번 받기`;
      case 'earned': return `도토리 ${fmt(q.n)}개 모으기`;
      case 'grads': return q.n === 1 ? '종업식 열기' : `종업식과 졸업식 ${q.n}번 열기`;
      case 'perks': return `명예 교장실 ${q.n}번 고치기`;
      case 'tier': return `${TIERS[q.n - 1].name} 졸업하기`;
      case 'tgrads': return `${tierInfo().name}에서 종업식 ${q.n}번 열기`;
      case 'fperks': return `장학재단 ${q.n}번 고치기`;
    }
    return '';
  }
  function qNo(i) {
    const ch = MAIN[i].ch;
    let j = 0;
    for (let x = 0; x < i; x++) if (MAIN[x].ch === ch) j++;
    return `${ch + 1}-${j + 1}`;
  }
  const curMain = () => MAIN[S.q.m] || null;
  // 한 번 이룬 메인 퀘스트는 종업식으로 학교가 처음으로 돌아가도 완료로 남아요
  const mainReady = () => { const q = curMain(); return !!q && (S.q.lat === q.id || qDone(q, S.q.mb)); };
  const subReady = s => qDone(s, s.b);
  const pickTutorial = () => { const q = curMain(); return !!q && q.t === 'picks' && !mainReady(); };
  const subSlots = () => S.q.m < 7 ? 2 : 3;
  const kidAvatar = sp => `<svg viewBox="-10 -15.5 20 27" aria-hidden="true">${kidSVG(sp, 0)}</svg>`;
  const hedgehogAvatar = () => `<svg viewBox="-24 -24 48 48" aria-hidden="true">${AV.hedgehog}</svg>`;

  function startMain() { const q = curMain(); S.q.mb = q ? qMeasure(q) : 0; }
  // 퀘스트가 생기기 전부터 하던 학교는 이미 이룬 메인 퀘스트를 보상 없이 건너뛰어요
  function fastForwardMain() {
    while (S.q.m < MAIN.length) {
      const q = MAIN[S.q.m];
      const ok = q.t === 'picks' ? S.f.playground >= 1 : (COUNT_TYPES.has(q.t) ? false : qDone(q, 0));
      if (!ok) break;
      S.q.m += 1;
    }
    startMain();
  }
  function makeSub(d) {
    const s = { id: d.id, who: d.who, t: d.t, k: d.k || null, n: d.n, r: 0, b: 0, nw: true, say: '' };
    // 받자마자 끝나 버리는 부탁이 없게 목표를 지금보다 한 단계 위로 맞춰요
    if (s.t === 'fac') s.n = Math.max(s.n, S.f[s.k] + 1);
    if (s.t === 'students' && Math.floor(S.students) >= s.n) s.n = Math.floor(S.students) + 4;
    s.b = qMeasure(s);
    s.r = Math.max(d.r || 0, nice(rate() * (d.gen ? 60 : 30)));
    s.say = d.say(s.n);
    return s;
  }
  function nextSubDef() {
    const active = new Set(S.q.subs.map(s => s.id));
    for (const d of SUBS) {
      if (S.q.done.includes(d.id) || active.has(d.id)) continue;
      return S.q.m >= d.after ? d : null;
    }
    const c = S.q.gen, tpl = GEN[c % GEN.length];
    S.q.gen = c + 1;
    return { id: 'g' + c, who: tpl.who, t: tpl.t, n: tpl.n(Math.floor(c / GEN.length)), say: tpl.say, gen: true };
  }
  function fillSubs() {
    if (S.q.m < SUB_UNLOCK) return 0;
    let added = 0;
    while (S.q.subs.length < subSlots() && added < 3) {
      const d = nextSubDef();
      if (!d) break;
      S.q.subs.push(makeSub(d));
      added++;
    }
    return added;
  }

  function checkQuests(silent) {
    const q = curMain(), key = 'm' + S.q.m, mr = mainReady();
    if (mr && q) S.q.lat = q.id;
    if (mr && !rt.qr[key] && !silent) { sfx('done'); toast(`퀘스트 완료! 받기를 누르면 ${rewardText(q.rk, qReward(q))}${q.rk === 'dip' ? '을' : '를'} 받아요`); }
    rt.qr[key] = mr;
    for (const s of S.q.subs) {
      const r = subReady(s);
      if (r && !rt.qr[s.id] && !silent) { sfx('done'); toast(`${WHO[s.who]}의 부탁을 들어줬어요! 노란 쪽지를 눌러 보상을 받아요`); }
      rt.qr[s.id] = r;
    }
  }
  function claimMain(fromEl) {
    const q = curMain();
    if (!q || !mainReady() || rt.paused) return;
    grant(qReward(q), fromEl, q.rk);
    S.q.m += 1;
    startMain();
    if (!curMain() || curMain().ch !== q.ch) addGold(GOLD.chapter);   // 한 장을 마치면 황금 도토리
    const unlocked = S.q.m === SUB_UNLOCK;
    const added = fillSubs();
    const nx = curMain();
    if (unlocked && added) toast('학생들이 부탁을 하러 왔어요! 퀘스트 탭을 열어 보세요');
    else if (S.q.m === 7) toast('1장을 마친 기념으로 출석부가 열렸어요! 칠판 위 달력을 눌러 보세요');
    else if (nx) toast(`다음 퀘스트 ${qNo(S.q.m)} ${nx.title}`);
    else toast('메인 퀘스트를 모두 마쳤어요! 종업식과 학생들의 부탁은 계속 이어져요');
    if (nx && nx.t === 'picks') rt.dropT = Math.max(rt.dropT, 3.5);
    questChanged();
  }
  function claimSub(id, fromEl) {
    const i = S.q.subs.findIndex(s => s.id === id);
    if (i < 0 || rt.paused) return;
    const s = S.q.subs[i];
    if (!subReady(s)) return;
    grant(s.r, fromEl);
    S.q.subs.splice(i, 1);
    if (s.id[0] === 's') S.q.done.push(s.id);
    S.q.subDone += 1;
    delete rt.qr[s.id];
    const added = fillSubs();
    toast(added ? `${WHO[s.who]}이 고마워해요! 새 부탁이 들어왔어요` : `${WHO[s.who]}이 고마워해요!`);
    questChanged();
  }
  function grant(v, fromEl, kind) {
    // 퀘스트 보상은 '도토리 모으기' 부탁과 수료증 계산에는 세지 않아요
    if (kind === 'dip') addDip(v);
    else S.budget += v;
    sfx('quest'); buzz(15);
    flyAcorns(fromEl, v, kind);
    renderHUD();
    if (kind === 'dip') toast(`수료증 +${v}장`);
  }
  function questChanged() {
    rt.qKey = '';
    renderAffordance();
    save();
  }
  function flyAcorns(fromEl, v, kind) {
    // 도토리는 칠판의 도토리 숫자로, 수료증은 아래 졸업 탭으로 날아가요
    const isDip = kind === 'dip';
    const to = isDip ? $('.tab[data-tab="grad"]') : $('#vBudget');
    const bump = () => { if (!rt.reduced && to.animate) to.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { duration: 320, easing: 'ease-out' }); };
    const src = fromEl && (fromEl.querySelector('.q-act') || fromEl);
    if (!src || rt.reduced || !document.body.animate) { bump(); return; }
    const a = src.getBoundingClientRect(), b = to.getBoundingClientRect();
    if (!a.width) { bump(); return; }
    const n = Math.min(7, 3 + Math.floor(Math.log10(Math.max(10, v))));
    for (let i = 0; i < n; i++) {
      const el = document.createElement('span');
      el.className = 'fly';
      el.innerHTML = isDip ? dipIcon() : acornIcon();
      const sx = a.left + a.width * rand(0.25, 0.75) - 9, sy = a.top + a.height / 2 - 11;
      const ex = isDip ? b.left + b.width / 2 - 9 : b.left + 5, ey = b.top + b.height / 2 - 11;
      el.style.left = sx + 'px'; el.style.top = sy + 'px';
      document.body.appendChild(el);
      const mx = rand(-36, 36), my = rand(-60, -24);
      el.animate([
        { transform: 'translate(0px, 0px) scale(.5)', opacity: 0 },
        { transform: `translate(${mx}px, ${my}px) scale(1.15)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${ex - sx}px, ${ey - sy}px) scale(.7)`, opacity: 0.9 }
      ], { duration: 620 + i * 60, easing: 'cubic-bezier(.45,0,.3,1)' }).onfinish = () => { el.remove(); if (i === n - 1) bump(); };
    }
  }

  /* 칠판 아래 퀘스트 쪽지: 지금 메인 퀘스트, 다 마치면 학생 부탁 */
  function renderQuestBar() {
    const bar = $('#questBar');
    const mq = curMain();
    let q, base, no, title, how, av;
    if (mq) { q = mq; base = S.q.mb; no = qNo(S.q.m); title = mq.title; how = mq.how; av = 'h'; }
    else {
      const s = S.q.subs.find(subReady) || S.q.subs[0];
      if (!s) { bar.hidden = true; return; }
      q = s; base = s.b; no = '부탁'; title = `${WHO[s.who]}의 부탁`; how = qGoal(s); av = s.who;
    }
    bar.hidden = rt.tab === 'quests';
    const key = `${no}|${title}|${how}`;
    if (bar.dataset.key !== key) {
      const first = !bar.dataset.key;
      bar.dataset.key = key;
      $('#qbAv').innerHTML = av === 'h' ? hedgehogAvatar() : kidAvatar(av);
      $('#qbNo').textContent = no;
      $('#qbTitle').textContent = title;
      $('#qbHow').textContent = how;
      $('#qbRewIc').innerHTML = rewardIcon(q.rk);
      if (!first && !rt.reduced && bar.animate) bar.animate([{ opacity: 0.3, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'ease-out' });
    }
    const p = qProg(q, base);
    $('#qbRew').textContent = fmt(qReward(q));
    $('#qbCnt').textContent = p.done ? '완료' : p.text;
    $('#qbFill').style.width = (p.frac * 100).toFixed(1) + '%';
    bar.classList.toggle('ready', p.done);
    bar.setAttribute('aria-label', `${mq ? '메인 퀘스트 ' + no : '학생 부탁'} ${title}. ${p.done ? '완료했어요. 눌러서 보상 받기' : p.text + '. 눌러서 바로 가기'}`);
  }

  /* 메인 화면 학생 부탁: 무엇을 부탁했는지와 진행 막대. 다 들어주면 눌러서 바로 받아요 */
  // 쪽지에는 짧게 '무엇 몇/몇'만 적어요. 누가 부탁했는지는 얼굴로, 자세한 말은 누르면 보여요
  function subText(s, p) {
    const v = qMeasure(s), cur = COUNT_TYPES.has(s.t) ? v - s.b : v;
    const nums = `${fmt(Math.max(0, Math.min(s.n, Math.floor(cur + 1e-6))))}/${fmt(s.n)}`;
    switch (s.t) {
      case 'fac': return `${FAC[s.k].name} ${nums}`;
      case 'students': return `학생 ${nums}`;
      case 'picks': return `줍기 ${nums}`;
      case 'earned': return `모으기 ${nums}`;
      case 'ups': return `고치기 ${nums}`;
      case 'trains': return `연수 ${nums}`;
      case 'claims': return `문 닫기 ${nums}`;
      default: return p.text;
    }
  }
  function renderSubBar() {
    const bar = $('#subBar');
    // 메인 퀘스트를 다 마치면 위 쪽지가 부탁을 보여 주니까 여기서는 감춰요
    const show = rt.tab !== 'quests' && !!curMain() && S.q.subs.length > 0;
    bar.hidden = !show;
    if (!show) return;
    const key = S.q.subs.map(s => s.id + (subReady(s) ? '!' : '') + (s.nw ? '*' : '')).join(',');
    if (bar.dataset.key !== key) {
      bar.dataset.key = key;
      bar.innerHTML = S.q.subs.map(s => `<button class="sub${subReady(s) ? ' ready' : ''}${s.nw ? ' new' : ''}" type="button" data-sub="${s.id}">` +
        `<span class="s-av" aria-hidden="true">${kidAvatar(s.who)}</span><span class="s-txt"></span><i class="s-bar"></i></button>`).join('');
    }
    for (const s of S.q.subs) {
      const el = bar.querySelector(`[data-sub="${s.id}"]`);
      if (!el) continue;
      const p = qProg(s, s.b), txt = el.querySelector('.s-txt');
      const html = p.done ? `받기<span class="ric">${acornIcon()}</span>${fmt(s.r)}` : esc(subText(s, p));
      if (txt.dataset.h !== html) { txt.dataset.h = html; txt.innerHTML = html; }
      el.querySelector('.s-bar').style.width = (p.frac * 100).toFixed(0) + '%';
      el.setAttribute('aria-label', `${WHO[s.who]}의 부탁, ${qGoal(s)}. ${p.done ? '다 했어요. 눌러서 보상 받기' : p.text}`);
    }
  }
  function tapSub(id, el) {
    const s = S.q.subs.find(x => x.id === id);
    if (!s || rt.paused) return;
    if (subReady(s)) { claimSub(id, el); return; }
    if (s.nw) { s.nw = false; updateQuestDot(); }
    toast(`${WHO[s.who]}: ${s.say}`);
    goTo(s);
  }

  /* 퀘스트 탭 */
  const questKey = () => `${S.q.m}|${mainReady() ? 1 : 0}|${S.q.subs.map(s => s.id + (subReady(s) ? '!' : '')).join(',')}`;
  function renderQuestPanel(force) {
    if (rt.tab !== 'quests') return;
    const key = questKey();
    if (force || key !== rt.qKey) { rt.qKey = key; buildQuestPanel(); }
    else updateQuestProgress();
  }
  function questCard(q, base, o) {
    const p = qProg(q, base);
    const act = p.done
      ? `<button class="cta small" type="button" data-act="claim" data-q="${o.ref}">보상 받기</button>`
      : `<button class="btn-go" type="button" data-act="go" data-q="${o.ref}">바로 가기</button>`;
    return `<div class="qcard${p.done ? ' is-done' : ''}" data-qp="${o.ref}">` +
      `<div class="qwho"><span class="qav${o.kid ? ' kid' : ''}" aria-hidden="true">${o.av}</span><span class="qname">${esc(o.name)}</span>${o.badge ? `<span class="qnew">${o.badge}</span>` : ''}</div>` +
      `<p class="qsay">${esc(o.say)}</p>` +
      `<div class="qgoal"><b>${esc(qGoal(q))}</b><span class="qp">${p.done ? '완료' : p.text}</span></div>` +
      `<div class="qbar"><i style="width:${(p.frac * 100).toFixed(1)}%"></i></div>` +
      `<div class="qfoot"><span class="qrew">보상 ${rewardIcon(q.rk)}<b>${fmt(qReward(q))}</b></span>${act}</div></div>`;
  }
  function buildQuestPanel() {
    const i = S.q.m, q = MAIN[i];
    if (!q) {
      $('#qMain').innerHTML = '<div class="qall"><b>메인 퀘스트를 모두 마쳤어요</b><p>숲속 초등학교까지 왔어요! 중학교는 다음 업데이트에 열려요. 그동안 종업식으로 수료증을 모으고 학생들의 부탁도 들어주세요.</p></div>';
    } else {
      const ch = q.ch, list = [];
      MAIN.forEach((m, j) => { if (m.ch === ch) list.push(j); });
      const doneN = list.filter(j => j < i).length;
      const items = list.map((j, idx) => {
        const m = MAIN[j];
        if (j < i) return `<li class="qs done"><span class="mk">${CHECK}</span>${esc(m.title)}</li>`;
        if (j > i) return `<li class="qs"><span class="mk">${idx + 1}</span>${esc(m.title)}</li>`;
        return `<li class="qs cur">${questCard(m, S.q.mb, { ref: 'main', av: hedgehogAvatar(), name: `${qNo(j)} ${m.title}`, say: m.say, badge: S.q.seen < j ? '새 퀘스트' : '' })}</li>`;
      }).join('');
      const nx = CHAPTERS[ch + 1];
      const next = nx ? `<p class="ch-next">${CH_NEXT[ch]} ${ch + 2}장 「${nx}」 퀘스트가 열려요.</p>` : '';
      $('#qMain').innerHTML = `<div class="chapter"><div class="ch-head"><span class="ch-no">${ch + 1}장</span><b>${CHAPTERS[ch]}</b><span class="ch-count">${doneN}/${list.length}</span></div><ol class="qsteps">${items}</ol>${next}</div>`;
    }
    let subs;
    if (S.q.m < SUB_UNLOCK) subs = '<p class="qempty">메인 퀘스트 1-2 급식실 짓기를 마치면 학생들이 부탁을 하러 와요.</p>';
    else {
      subs = S.q.subs.map(s => questCard(s, s.b, { ref: s.id, kid: true, av: kidAvatar(s.who), name: WHO[s.who], say: `“${s.say}”`, badge: s.nw ? '새 부탁' : '' })).join('');
      if (S.q.subs.length < subSlots()) subs += '<p class="qempty">새 부탁을 기다리고 있어요. 메인 퀘스트를 진행하면 학생들이 또 찾아와요.</p>';
    }
    $('#qSubs').innerHTML = subs;
    $('#qTally').textContent = S.q.subDone > 0 ? `지금까지 들어준 부탁 ${S.q.subDone}개` : '';
  }
  function updateQuestProgress() {
    $$('#panelQuests [data-qp]').forEach(card => {
      const ref = card.dataset.qp;
      const q = ref === 'main' ? curMain() : S.q.subs.find(s => s.id === ref);
      if (!q) return;
      const p = qProg(q, ref === 'main' ? S.q.mb : q.b);
      $('.qp', card).textContent = p.done ? '완료' : p.text;
      $('.qbar i', card).style.width = (p.frac * 100).toFixed(1) + '%';
    });
  }
  function updateQuestDot() {
    const on = rt.tab !== 'quests' && (mainReady() || S.q.subs.some(s => s.nw || subReady(s)));
    $('#qDot').hidden = !on;
  }
  function markQuestsSeen() { S.q.seen = S.q.m; S.q.subs.forEach(s => { s.nw = false; }); }

  /* 지도와 탭 위 안내 화살표 */
  const GUIDE_TIP = { classroom: [180, 158, 1], library: [75, 270, 1], cafeteria: [285, 264, 1], playground: [165, 388, -1], science: [299, 118, 1] };
  function guideTarget() {
    if (rt.tab !== 'school' || rt.sheetKey || rt.modalOpen || rt.paused) return null;
    const q = curMain();
    if (!q || mainReady()) return null;
    const early = S.q.m < 7;   // 1장에서는 늘, 그다음부터는 살 수 있을 때만 가리켜요
    if (q.t === 'fac') return (early || S.budget >= facCost(q.k)) ? q.k : null;
    if (q.t === 'students' && capacity() < q.n) return (early || S.budget >= facCost('classroom')) ? 'classroom' : null;
    if (q.t === 'picks') return S.f.playground >= 1 ? 'picks' : 'playground';
    return null;
  }
  function renderGuide() {
    layerFx.classList.toggle('rings', pickTutorial() || S.q.subs.some(s => s.t === 'picks' && !subReady(s)));
    const t = guideTarget();
    if (t === rt.guideKey) return;
    rt.guideKey = t;
    const g = $('#guide');
    if (!t) { g.innerHTML = ''; return; }
    // 도토리 줍기는 참나무를 가리켜요
    if (t === 'picks') { g.innerHTML = '<g class="g-ring"><circle cx="324" cy="300" r="40"/></g><g transform="translate(324 256)"><g class="g-arrow"><path d="M0 0 L-9 -11 L-4 -11 L-4 -23 L4 -23 L4 -11 L9 -11 Z"/></g></g>'; return; }
    const fr = $('#b-' + t + ' .focus-ring');
    const ring = t === 'playground'
      ? '<ellipse cx="165" cy="335" rx="120" ry="54"/>'
      : `<rect x="${fr.getAttribute('x')}" y="${fr.getAttribute('y')}" width="${fr.getAttribute('width')}" height="${fr.getAttribute('height')}" rx="16"/>`;
    const [x, y, dir] = GUIDE_TIP[t];
    g.innerHTML = `<g class="g-ring">${ring}</g><g transform="translate(${x} ${y})${dir > 0 ? ' rotate(180)' : ''}"><g class="g-arrow"><path d="M0 0 L-9 -11 L-4 -11 L-4 -23 L4 -23 L4 -11 L9 -11 Z"/></g></g>`;
  }
  function lowestTeacher(n) {
    const ks = Object.keys(TEA).filter(k => S.t[k] < n && !teaMaxed(k));
    ks.sort((a, b) => teaCost(a) - teaCost(b));
    return ks[0] || null;
  }
  function renderTeacherGuide() {
    const q = curMain();
    let k = null;
    if (q && !mainReady()) {
      if (q.t === 'tea') k = q.k;
      else if (q.t === 'teaAll') k = lowestTeacher(q.n);
    }
    const can = !!k && !teaMaxed(k) && S.budget >= teaCost(k);
    $('.tab[data-tab="teachers"]').classList.toggle('guide', !!k && rt.tab !== 'teachers' && (S.q.m < 7 || can));
    // 종업식과 졸업식 퀘스트는 열 수 있거나 명예 교장실을 고칠 수 있을 때 졸업 탭을 가리켜요
    const gq = q && !mainReady() && (((q.t === 'grads' || q.t === 'tgrads') && canGraduate()) ||
      (q.t === 'perks' && Object.keys(PERKS).some(p => !perkMaxed(p) && S.p.dip >= perkCost(p))) ||
      (q.t === 'tier' && canPromote()) || (q.t === 'fperks' && Object.keys(FPERKS).some(p => S.fund >= fpCost(p))));
    $('.tab[data-tab="grad"]').classList.toggle('guide', !!gq && rt.tab !== 'grad');
    $$('.tcard').forEach(c => {
      const is = c.dataset.k === k;
      c.classList.toggle('is-quest', is);
      c.classList.toggle('guide-pulse', is && can);
    });
  }

  /* 바로 가기: 퀘스트에 필요한 곳을 열어 줘요 */
  function goFac(k, msg) { setTab('school'); openSheet(k); if (msg) toast(msg); }
  function goTeacher(k, msg) {
    setTab('teachers');
    const card = $(`.tcard[data-k="${k}"]`);
    if (card) {
      card.scrollIntoView({ block: 'center', behavior: rt.reduced ? 'auto' : 'smooth' });
      card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash');
    }
    if (msg) toast(msg);
  }
  function bestPick(kind) {
    const c = [];
    if (kind === 'rate') {
      c.push({ f: 'cafeteria', cost: facCost('cafeteria') }, { t: 'squirrel', cost: teaCost('squirrel') });
      if (S.students >= capacity() - 0.5) c.push({ f: 'classroom', cost: facCost('classroom') });
    } else {
      for (const k of facKeys()) c.push({ f: k, cost: facCost(k) / (kind === 'rep' ? FAC[k].rep : 1) });
      if (kind === 'rep') for (const k of Object.keys(TEA)) if (!teaMaxed(k)) c.push({ t: k, cost: teaCost(k) / 2 });
    }
    c.sort((a, b) => a.cost - b.cost);
    return c[0];
  }
  function goTo(q) {
    if (!q || rt.paused) return;
    switch (q.t) {
      case 'fac': return goFac(q.k);
      case 'tea': return goTeacher(q.k);
      case 'teaAll': { const k = lowestTeacher(q.n); return k ? goTeacher(k) : setTab('teachers'); }
      case 'students':
        if (capacity() < q.n) return goFac('classroom', '교실을 넓혀야 학생이 더 들어올 수 있어요');
        setTab('school'); return toast('학생들이 오고 있어요. 조금만 기다려 주세요');
      case 'picks':
        if (S.f.playground < 1) return goFac('playground', `${eul(FAC.playground.name)} 먼저 지어야 해요`);
        setTab('school'); return toast(`참나무를 누르면 도토리가 떨어져요. ${FAC.playground.name}에 떨어진 도토리를 눌러서 주워요`);
      case 'grade': case 'ygrade': { const b = bestPick('rep'); return b.f ? goFac(b.f, '지금 평판을 올리기 좋은 곳이에요') : goTeacher(b.t, '연수를 보내면 평판이 ★2 올라요'); }
      case 'rate': { const b = bestPick('rate'); return b.f ? goFac(b.f, '지금 수업료를 올리기 좋은 곳이에요') : goTeacher(b.t, '다람쥐 선생님이 수업료를 올려 줘요'); }
      case 'ups': return goFac(bestPick('ups').f, '지금 가장 싸게 고칠 수 있는 시설이에요');
      case 'trains': {
        const ks = Object.keys(TEA).filter(k => S.t[k] >= 1 && !teaMaxed(k)).sort((a, b) => teaCost(a) - teaCost(b));
        return ks[0] ? goTeacher(ks[0], '지금 가장 싸게 연수를 보낼 수 있는 선생님이에요') : setTab('teachers');
      }
      case 'claims': setTab('school'); return toast('오른쪽 위 X로 학교 문을 닫고 30초 뒤에 다시 열어 보세요');
      case 'earned': setTab('school'); return toast(`수업료와 ${FAC.playground.name} 도토리가 쌓이면 채워져요`);
      case 'grads': case 'tgrads': return goGrad();
      case 'perks': return goGrad('perks');
      case 'tier': return goGrad('tier');
      case 'fperks': return goGrad('fund');
    }
  }

  /* ---------- 모달 순서 관리 ---------- */
  function queueModal(fn) { rt.modalQueue.push(fn); if (!rt.modalOpen && !rt.paused) nextModal(); }
  function nextModal() {
    if (rt.modalOpen || rt.paused) return;
    while (rt.modalQueue.length) { const fn = rt.modalQueue.shift(); if (fn() !== false) return; }
  }
  function openModal(el) {
    rt.modalOpen = el;
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('open'));
    const b = el.querySelector('[data-autofocus]') || el.querySelector('.cta') || el.querySelector('button');
    if (b) b.focus({ preventScroll: true });
  }
  function closeModal(el, then) {
    el.classList.remove('open');
    if (rt.modalOpen === el) rt.modalOpen = null;
    setTimeout(() => { if (rt.modalOpen !== el) el.hidden = true; if (then) then(); nextModal(); }, 180);
  }

  /* ---------- 알림, 탭 ---------- */
  let toastTimer = 0;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.hidden = false;
    el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2200);
  }
  function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); sfx('deny'); }
  function setTab(t) {
    const prev = rt.tab;
    rt.tab = t;
    $$('.tab').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === t ? 'true' : 'false'));
    $('#panelQuests').hidden = t !== 'quests';
    $('#panelTeachers').hidden = t !== 'teachers';
    $('#panelGrad').hidden = t !== 'grad';
    $('#panelSettings').hidden = t !== 'settings';
    $('#panelRank').hidden = t !== 'rank';
    $('#panelShop').hidden = t !== 'shop';
    $('#app').classList.toggle('on-school', t === 'school');
    if (t !== 'school') $('#scroller').scrollTop = 0;
    if (t === 'shop') { rt.shopPick = ''; renderShop(); $('#panelShop').scrollTop = 0; }
    if (t === 'rank') { rt.rankEdit = false; initRank(); renderRankPanel(); submitRank(); }
    if (t === 'settings') renderCloudInfo();
    if (prev === 'quests' && t !== 'quests') markQuestsSeen();
    if (t === 'teachers') renderTeachers();
    if (t === 'quests') renderQuestPanel(true);
    if (t === 'grad') renderGradPanel(true); else $('#gConfirm').hidden = true;
    $('#gDot').hidden = $('#gDot').hidden || t === 'grad';
    if (t !== 'settings') { $('#resetConfirm').hidden = true; }
    renderQuestBar(); renderSubBar(); renderGuide(); renderTeacherGuide(); updateQuestDot();
  }
  function syncSettingsUI() {
    $('#optSound').checked = S.sound; $('#optVibe').checked = S.vibrate;
    $$('#optUnits [data-units]').forEach(b => b.setAttribute('aria-checked', b.dataset.units === S.units ? 'true' : 'false'));
  }
  // 숫자 단위를 바꾸면 화면에 적힌 숫자를 모두 다시 그려요
  function refreshNumbers() {
    rt.gKey = ''; rt.qKey = ''; $('#questBar').dataset.key = ''; $('#subBar').dataset.key = '';
    renderHUD(); renderMap(); renderAffordance(); renderTeachers(); renderGradPanel(true); renderRankPanel();
  }

  /* ---------- 나가기와 다시 열기 ---------- */
  function closeSchool() {
    closeSheet();
    rt.paused = true;
    rt.closedAt = Date.now();
    save(rt.closedAt);
    if (actx && actx.state === 'running') actx.suspend().catch(() => {});
    $('#sClosed').hidden = false;
    $('#reopen').focus({ preventScroll: true });
  }
  function reopenSchool() {
    $('#sClosed').hidden = true;
    rt.paused = false;
    rt.lastT = performance.now();
    ensureAudio();
    applyAway((Date.now() - rt.closedAt) / 1000);
    syncKids(false);
    renderHUD(); renderAffordance();
    nextModal();
  }
  function resetGame() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* 무시 */ }
    S = fresh();
    startMain(); S.q.init = true;
    rt.qr = {}; rt.qKey = ''; rt.guideKey = null; rt.gKey = ''; $('#questBar').dataset.key = '';
    rt.kids.forEach(k => k.g.remove()); rt.kids = [];
    clearDrops(); rt.dropT = 0; rt.floatAcc = 0; rt.floatT = 0; rt.modalQueue = [];
    rt.deal = null; rt.dealT = DEAL.first; rt.yearKey = ''; rt.oakN = -1;
    syncSettingsUI(); applyCos(); renderShopBtn(); syncKids(true);
    renderMap(); renderHUD(); renderAffordance();
    save();
    $('#resetConfirm').hidden = true;
    setTab('school');
    toast('처음부터 다시 시작해요');
  }

  /* ---------- 게임 루프 ---------- */
  function loop(now) {
    const dt = Math.min(1, Math.max(0, (now - rt.lastT) / 1000));
    rt.lastT = now;
    if (!rt.paused && S) {
      S.st.play += dt;   // 학교 문을 열어 둔 시간 (테스트 현황에서 봐요)
      const cap = capacity();
      if (S.students < cap) S.students = Math.min(cap, S.students + CFG.enroll * dt);
      const gain = rate() * dt;
      S.budget += gain; earn(gain);
      rt.floatAcc += gain; rt.floatT += dt;
      if (rt.floatT >= 3) { if (rt.floatAcc >= 1) floatText(180, 40, '+' + fmt(rt.floatAcc)); rt.floatAcc = 0; rt.floatT = 0; }
      let iv = dropIntervalFor(S.f.playground);
      if (isFinite(iv) && pickTutorial()) iv = Math.min(iv, 5);   // 도토리 줍기 퀘스트 동안은 더 자주 떨어져요
      if (isFinite(iv)) {
        rt.dropT += dt;
        if (rt.dropT >= iv) { rt.dropT = 0; if (rt.drops.length < CFG.maxDrops) spawnDrop(); }
      }
      syncKids(false);
      updateKids(dt, now);
      updateDrops(now);
      updateDeal(dt);
      if (S.oak < OAK.max) { S.oak = Math.min(OAK.max, S.oak + dt / OAK.regen); renderOak(); }
      rt.uiT += dt; if (rt.uiT >= 0.1) { rt.uiT = 0; renderHUD(); }
      rt.affT += dt; if (rt.affT >= 0.25) { rt.affT = 0; renderAffordance(); }
    }
    requestAnimationFrame(loop);
  }

  /* ---------- 이벤트 ---------- */
  function wire() {
    $$('[data-acorn]').forEach(el => { el.outerHTML = acornIcon(); });
    $$('[data-dip]').forEach(el => { el.outerHTML = dipIcon(); });
    $$('[data-fund]').forEach(el => { el.outerHTML = fundIcon(); });
    const owlFace = `<svg viewBox="-24 -24 48 48" aria-hidden="true"><g transform="translate(0 3) scale(.95)">${AV.owl}</g></svg>`;
    $('#boostIc').innerHTML = owlFace;
    $('#boostArt').innerHTML = `<svg viewBox="-30 -30 60 60" aria-hidden="true"><circle cx="14" cy="-15" r="8" class="c-moon"/><circle cx="18" cy="-18" r="7" class="c-boardfill"/><g transform="translate(-3 6) scale(.62)">${AV.owl}</g><g transform="translate(16 14) scale(1.1)">${ACORN}</g></svg>`;

    // 테스트 광고, 보충수업, 출석부
    $('#btnBoost').addEventListener('click', openBoost);
    $('#boostGo').addEventListener('click', startBoost);
    $('#boostNo').addEventListener('click', () => closeModal($('#mBoost')));
    $('[data-close-boost]').addEventListener('click', () => closeModal($('#mBoost')));
    $('#offDouble').addEventListener('click', claimOfflineDouble);
    $('#adDone').addEventListener('click', closeAd);
    $('#adSkip').addEventListener('click', closeAd);
    $('#btnAtt').addEventListener('click', openAtt);
    $('#attGo').addEventListener('click', stampAtt);
    $('#attNo').addEventListener('click', () => closeModal($('#mAtt')));
    $('[data-close-att]').addEventListener('click', () => closeModal($('#mAtt')));

    // 졸업식과 명예 교장실
    $('#gBtn').addEventListener('click', askGraduate);
    $('#gNo').addEventListener('click', () => { $('#gConfirm').hidden = true; });
    $('#gYes').addEventListener('click', graduate);
    $('#perkList').addEventListener('click', e => {
      const b = e.target.closest('button[data-perk]');
      if (b) buyPerk(b.dataset.perk, b);
    });
    $('#gradOk').addEventListener('click', () => { sfx('tap'); closeModal($('#mGrad')); setTab('school'); });
    $('#fundList').addEventListener('click', e => {
      const b = e.target.closest('button[data-fperk]');
      if (b) buyFundPerk(b.dataset.fperk, b);
    });
    $('#statDip').addEventListener('click', () => { if (!rt.paused) goGrad('perks'); });
    $('#optUnits').addEventListener('click', e => {
      const b = e.target.closest('[data-units]');
      if (!b || b.dataset.units === S.units) return;
      S.units = b.dataset.units; save(); syncSettingsUI(); refreshNumbers();
      toast(S.units === 'en' ? '큰 숫자를 K, M, B로 줄여 써요' : '큰 숫자를 만, 억, 조로 줄여 써요');
    });
    $('#rankJoin').addEventListener('click', e => {
      const b = e.target.closest('[data-rank]');
      if (!b || b.tagName === 'FORM') return;
      if (b.dataset.rank === 'edit') { rt.rankEdit = true; renderRankPanel(); const i = $('#rankName'); if (i) i.focus(); }
      else if (b.dataset.rank === 'leave') leaveRank();
      else if (b.dataset.rank === 'retry') retryCloud();
      else if (b.dataset.rank === 'toss' && AIT) AIT.openBoard();
    });
    $('#rankJoin').addEventListener('submit', e => {
      e.preventDefault();
      const i = $('#rankName');
      rt.rankEdit = false;
      joinRank(i ? i.value : '');
    });
    // 황금 도토리 상점
    $('#btnShop').addEventListener('click', () => { if (!rt.paused && !rt.modalOpen) { sfx('tap'); openShop(); } });
    $('#shopList').addEventListener('click', e => { const b = e.target.closest('[data-buy]'); if (b) pickShop(b.dataset.buy); });
    $('#shopNo').addEventListener('click', () => { rt.shopPick = ''; renderShop(); });
    $('#shopYes').addEventListener('click', buyShop);
    $('#shopAd').addEventListener('click', shopAd);
    // 서버 저장: 다른 기기에서 이어하기, 테스트 현황
    $('#optMove').addEventListener('click', () => { sfx('tap'); openMove(); });
    $('#optAcct').addEventListener('click', () => { sfx('tap'); linkGoogle(); });
    $('#acctLoad').addEventListener('click', () => { const a = rt.acctPick; if (a) adoptSave(a.d, '구글 계정의 학교를 불러왔어요'); });
    $('#acctKeep').addEventListener('click', () => { const a = rt.acctPick; if (a) adoptSave(a.local, '이 폰의 학교를 구글 계정에 저장했어요'); });
    $('#moveMake').addEventListener('click', () => { if (moveLive()) copyMove(); else makeMove(); });
    $('#moveForm').addEventListener('submit', e => { e.preventDefault(); loadMove($('#moveInput').value); });
    $('#moveYes').addEventListener('click', confirmMove);
    $('#moveNo').addEventListener('click', () => { rt.moveIn = null; $('#moveAsk').hidden = true; $('#moveMain').hidden = false; $('#moveClose').hidden = false; moveMsg(''); });
    $('#moveClose').addEventListener('click', () => closeModal($('#mMove')));
    $('[data-close-move]').addEventListener('click', () => { if (!rt.moveIn) closeModal($('#mMove')); });
    $('#devStats').addEventListener('click', openStats);
    $('#statsReload').addEventListener('click', loadStats);
    $('#statsClose').addEventListener('click', () => closeModal($('#mStats')));
    $('[data-close-stats]').addEventListener('click', () => closeModal($('#mStats')));
    window.addEventListener('online', () => { if (Cloud.state === 'error' && (Cloud.err === 'net' || Cloud.err === 'load')) retryCloud(); });
    window.addEventListener('resize', refit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { rt.fitGen += 1; refit(); }).catch(() => {});
    $('#oak').addEventListener('click', tapOak);
    $('#oak').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tapOak(); } });
    $('#subBar').addEventListener('click', e => { const b = e.target.closest('[data-sub]'); if (b) tapSub(b.dataset.sub, b); });
    $('#btnDeal').addEventListener('click', openDeal);
    $('#dealIc').innerHTML = `<svg viewBox="-24 -24 48 48" aria-hidden="true">${MAGPIE}</svg>`;
    $('#dealGo').addEventListener('click', acceptDeal);
    $('#dealNo').addEventListener('click', () => closeModal($('#mDeal')));
    $('[data-close-deal]').addEventListener('click', () => closeModal($('#mDeal')));
    $('#devDeal').addEventListener('click', () => {
      if (!dealUnlocked()) { toast('까치 핫딜은 1장 퀘스트를 마치면 열려요'); return; }
      if (dealLeft() <= 0) { S.hd.day = ''; S.hd.n = 0; }
      rt.deal = null;
      setTab('school');
      if (spawnDeal()) toast('까치를 불렀어요 (테스트)');
      else { rt.dealT = DEAL.retry; renderDeal(); toast('지금은 까치가 물어 올 소식이 없어요. 특식 데이가 끝나면 다시 불러 보세요'); }
    });
    $('#tierBtn').addEventListener('click', askPromote);
    $('#tierNo').addEventListener('click', () => { $('#tierConfirm').hidden = true; });
    $('#tierYes').addEventListener('click', promote);
    $('#tierOk').addEventListener('click', () => { sfx('tap'); closeModal($('#mTier')); setTab('school'); });
    $('#devTier').addEventListener('click', () => {
      S.u.dev = true;
      if (!nextTierOpen()) { toast(`${TIERS[S.tier + 1].name}는 아직 준비 중이에요`); return; }
      S.tg = Math.max(S.tg, tierInfo().grads);
      S.tdip = Math.max(S.tdip, 40);
      while (gradeOf(rep()) < GRAD_MIN) S.f.library += 1;   // 평판이 대도시에 닿을 때까지 도서관을 키워요
      checkGrade();
      setTab('grad'); renderMap(); renderHUD(); renderAffordance(); save();
      toast('졸업 조건을 채웠어요 (테스트). 졸업 탭의 졸업식을 눌러 보세요');
    });

    // 숨긴 개발자 메뉴: 정보의 '버전' 줄을 빠르게 다섯 번 누르면 열려요
    let verTaps = 0, verAt = 0;
    $('#verRow').addEventListener('click', () => {
      const now = Date.now();
      verTaps = now - verAt < 1500 ? verTaps + 1 : 1;
      verAt = now;
      if (AIT || window.FOREST_STORE) return;   // 토스 판과 구글 플레이 판에는 개발자 메뉴를 열지 않아요
      if (verTaps >= 5 && $('#devBox').hidden) { $('#devBox').hidden = false; toast('개발자 테스트 메뉴가 열렸어요'); }
    });
    $('#devCash').addEventListener('click', () => {
      S.u.dev = true;
      const v = Math.max(1000, rate() * 3600);
      S.budget += v; earn(v);
      toast(`도토리 +${fmt(v)} (테스트)`);
      renderHUD(); renderAffordance(); save();
    });
    $('#devDay').addEventListener('click', () => {
      S.u.dev = true;
      S.att.last = ''; S.ad.day = ''; S.ad.n = 0; S.hd.day = ''; S.hd.n = 0;
      toast('다음 날이 된 것처럼 바꿨어요. 출석 도장, 보충수업, 핫딜이 다시 열려요');
      renderAffordance(); save();
    });
    $('#offArt').innerHTML = `<svg viewBox="-30 -30 60 60" aria-hidden="true"><circle cx="14" cy="-15" r="8" class="c-moon"/><circle cx="18" cy="-18" r="7" class="c-boardfill"/><circle cx="-18" cy="-12" r="1" class="c-moon"/><circle cx="-10" cy="-20" r="0.8" class="c-moon"/><g transform="translate(-3 6) scale(.62)">${AV.owl}</g></svg>`;

    $$('.bld').forEach(g => {
      const k = g.getAttribute('data-k');
      g.addEventListener('click', () => openSheet(k));
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSheet(k); } });
      g.addEventListener('pointerdown', () => g.classList.add('press'));
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => g.addEventListener(ev, () => g.classList.remove('press')));
    });
    $('#sheetBuy').addEventListener('click', () => {
      const k = rt.sheetKey; if (!k) return;
      if (!buyFacility(k)) shake($('#sheetBuy'));
      renderSheet();
    });
    $$('[data-close-sheet]').forEach(el => el.addEventListener('click', closeSheet));
    $('#teacherList').addEventListener('click', e => {
      const b = e.target.closest('button[data-k]');
      if (b) teacherAct(b.getAttribute('data-k'), b);
    });
    $$('.tab').forEach(b => b.addEventListener('click', () => { setTab(b.dataset.tab); sfx('tap'); }));

    // 퀘스트 쪽지: 완료했으면 보상 받기, 아니면 해야 할 곳으로 바로 가기
    $('#questBar').addEventListener('click', () => {
      const bar = $('#questBar');
      const mq = curMain();
      if (mq) { if (mainReady()) claimMain(bar); else goTo(mq); return; }
      const s = S.q.subs.find(subReady) || S.q.subs[0];
      if (!s) return;
      if (subReady(s)) claimSub(s.id, bar); else goTo(s);
    });
    $('#panelQuests').addEventListener('click', e => {
      const b = e.target.closest('button[data-act]');
      if (!b) return;
      const ref = b.dataset.q;
      if (b.dataset.act === 'claim') { if (ref === 'main') claimMain(b); else claimSub(ref, b); return; }
      goTo(ref === 'main' ? curMain() : S.q.subs.find(s => s.id === ref));
    });

    $('#optSound').addEventListener('change', e => {
      S.sound = e.target.checked;
      if (S.sound) { ensureAudio(); sfx('tap'); }
      save();
    });
    $('#optVibe').addEventListener('change', e => { S.vibrate = e.target.checked; buzz(20); save(); });
    $('#optSkip').addEventListener('click', () => {
      S.u.dev = true;
      setTab('school');
      applyAway(3 * 3600);
    });
    $('#optReset').addEventListener('click', () => { $('#resetConfirm').hidden = false; $('#resetNo').focus(); });
    $('#resetNo').addEventListener('click', () => { $('#resetConfirm').hidden = true; });
    $('#resetYes').addEventListener('click', resetGame);

    $('#offClaim').addEventListener('click', claimOffline);
    $('#certOk').addEventListener('click', () => { sfx('tap'); closeModal($('#mGrade')); });
    $('#btnExit').addEventListener('click', () => { if (!rt.modalOpen) { sfx('tap'); openModal($('#mExit')); } });
    $('#exitNo').addEventListener('click', () => closeModal($('#mExit')));
    $('[data-close-exit]').addEventListener('click', () => closeModal($('#mExit')));
    $('#exitYes').addEventListener('click', () => closeModal($('#mExit'), () => { if (AIT) { save(); AIT.close(); } else closeSchool(); }));
    $('#reopen').addEventListener('click', reopenSchool);

    document.addEventListener('pointerdown', ensureAudio, { capture: true });
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (rt.adOpen) return;
      if (rt.modalOpen === $('#mExit')) closeModal($('#mExit'));
      else if (rt.modalOpen === $('#mBoost')) closeModal($('#mBoost'));
      else if (rt.modalOpen === $('#mAtt')) closeModal($('#mAtt'));
      else if (rt.modalOpen === $('#mDeal')) closeModal($('#mDeal'));
      else if (rt.modalOpen === $('#mMove') && !rt.moveIn) closeModal($('#mMove'));
      else if (rt.modalOpen === $('#mStats')) closeModal($('#mStats'));
      else if (rt.sheetKey && !rt.modalOpen) closeSheet();
    });
    document.addEventListener('visibilitychange', () => {
      if (!S) return;
      if (document.hidden) {
        rt.hiddenAt = Date.now();
        if (!rt.paused) save(rt.hiddenAt);
        cloudPush();   // 앱을 내리면 서버에도 바로 올려요
        if (actx && actx.state === 'running') actx.suspend().catch(() => {});
      } else {
        const away = rt.hiddenAt ? (Date.now() - rt.hiddenAt) / 1000 : 0;
        rt.hiddenAt = 0;
        rt.lastT = performance.now();
        if (Cloud.state === 'error' && Cloud.err === 'net') retryCloud();
        if (rt.paused) return;
        ensureAudio();
        applyAway(away);
      }
    });
    window.addEventListener('pagehide', () => { save(rt.paused ? rt.closedAt : (document.hidden && rt.hiddenAt ? rt.hiddenAt : Date.now())); cloudPush(); });
    setInterval(() => {
      if (S && !rt.paused && !document.hidden) save();
      cloudTick();
      if (rt.tab === 'settings') renderCloudInfo();
    }, 5000);
  }

  /* ---------- 시작 ---------- */
  function start(data) {
    refit();
    let hadSave = false;
    try { hadSave = !!localStorage.getItem(SAVE_KEY); } catch (e) { hadSave = false; }
    const fromHot = !!(data && data.save);
    // 서버 학교나 다른 기기 학교로 바꾸며 다시 열었으면 알려 주고, 이번에는 서버 학교로 되돌리지 않아요
    let adopted = null;
    try { adopted = sessionStorage.getItem('forest-adopt'); if (adopted !== null) sessionStorage.removeItem('forest-adopt'); } catch (e) { adopted = null; }
    S = fromHot ? sanitize(data.save) : (load() || fresh());
    S.st.sess += 1;
    if (!S.q.init) { if (hadSave) fastForwardMain(); else startMain(); S.q.init = true; }
    fillSubs();
    checkQuests(true);
    buildForest();
    buildTeachersOnMap();
    buildTeacherCards();
    wire();
    syncSettingsUI();
    syncKids(true);
    renderMap(); renderHUD(); renderAffordance();
    checkGrade();
    renderCloudInfo();
    applyCos(); renderShopBtn();
    // GitHub 테스트판: 서버에 연결해서 저장을 맞춰요. 이어하기 링크(?move=코드)로 열었으면 연결된 뒤 코드 창을 띄워요
    if (hasCloudBuild()) {
      Cloud.state = 'idle';
      Cloud.bootHadSave = hadSave;
      Cloud.skipRestore = adopted !== null;
      try {
        const m = new URLSearchParams(location.search).get('move');
        if (m) { rt.moveParam = m; history.replaceState(null, '', location.pathname + location.hash); }
      } catch (e) { /* 무시 */ }
      initCloud();
    }
    if (adopted !== null) setTimeout(() => toast(adopted || '학교를 불러왔어요'), 500);
    if (S.rank.joined || AIT) initRank();   // 랭킹에 참여한 학교는 점수가 오르면 바로 올라가게 미리 연결해요
    if (!fromHot) {
      if (S.pending > 0) queueModal(showOffline);
      else if (hadSave) applyAway((Date.now() - S.savedAt) / 1000);
    }
    if (!hadSave) save();
    rt.lastT = performance.now();
    requestAnimationFrame(loop);
  }

  if (window.claude && window.claude.hot && window.claude.hot.snapshot) {
    try { window.claude.hot.snapshot(() => { if (S) syncMid(); return { save: S }; }); } catch (e) { /* 무시 */ }
  }
  if (AIT) {
    document.documentElement.classList.add('ait');
    const inset = a => { if (!a) return; const r = document.documentElement.style; r.setProperty('--ait-top', (a.top || 0) + 'px'); r.setProperty('--ait-bottom', (a.bottom || 0) + 'px'); };
    inset(AIT.safeArea()); AIT.subscribeSafe(inset);
    AIT.preload();
    (async () => {
      try {
        if (!localStorage.getItem(SAVE_KEY)) { const v = await AIT.storage.getItem(SAVE_KEY); if (v) localStorage.setItem(SAVE_KEY, v); }
      } catch (e) { /* 없으면 새로 시작해요 */ }
      start({});
      AIT.userKey().then(k => { if (k && S) { S.tk = k; save(); } });   // 토스 사용자 키(미니앱마다 고유)를 저장해 둬요
    })();
  } else window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
})();
