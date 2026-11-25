  /* ---------- 게임 수치 ---------- */
  const CFG = {
    base: 0.25,          // 학생 한 명이 1초에 내는 수업료(도토리)
    pace: 0.2,           // 게임 템포를 늦추려고 1/10로 줄였고, 너무 느리다는 의견으로 1/5로 (1장은 쉬운 퀘스트 보상으로 빠르게)
    cap0: 6, capStep: 4, // 정원 = 6 + 4 x 교실 레벨
    enroll: 0.5,         // 1초에 들어오는 새 학생
    gradeMult: 1.3,      // 동네가 한 단계 자랄 때마다 수업료 배수
    offlineCapH: 8,      // 자리 비운 동안 최대 8시간까지 쌓임
    awayModalSec: 30,    // 30초 넘게 비우면 보상 창
    awayQuietSec: 300,   // 5분보다 짧게 비웠으면 창 없이 바로 주고 알림 한 줄(받는 양은 창과 같아요)
    maxKids: 16, maxDrops: 3, dropLife: 15000,
    // 동네 5단계: 평판이 오르면 학교 둘레가 분교에서 대도시까지 자라요. name은 칠판 배지, title은 상장
    grades: [
      { name: '분교', title: '숲속 분교', rep: 0 },
      { name: '마을', title: '마을 학교', rep: 15, line: '학교 옆에 버섯집 마을이 생겼기에' },
      { name: '소도시', title: '소도시 학교', rep: 40, line: '가게가 늘어선 소도시가 되었기에' },
      { name: '도시', title: '도시 학교', rep: 85, line: '나무 아파트가 들어선 도시가 되었기에' },
      { name: '대도시', title: '대도시 학교', rep: 130, line: '나무 빌딩이 숲을 이룬 대도시가 되었기에' }
    ]
  };
  // 학교급: 유치원에서 시작해서 졸업할 때마다 한 칸씩 올라가요
  // years는 다니는 햇수, grads는 졸업 전에 여는 종업식 수예요. 해마다 끝에는 종업식, 마지막 해 끝에는 졸업식을 열어요
  // 유치원은 '1년째, 2년째', 초등학교부터는 '1학년, 2학년'으로 불러요
  const TIERS = [
    { name: '유치원', school: '숲속 유치원', years: 2, grads: 1, unit: '년째' },
    { name: '초등학교', school: '숲속 초등학교', years: 6, grads: 5, unit: '학년', newb: '과학실' },
    { name: '중학교', school: '숲속 중학교', years: 3, grads: 2, unit: '학년', newb: '매점' },
    { name: '고등학교', school: '숲속 고등학교', years: 3, grads: 2, unit: '학년', newb: '기숙사' },
    { name: '대학교', school: '숲속 대학교', years: 4, grads: 3, unit: '학년', newb: '학생회관' },
    { name: '대학원', school: '숲속 대학원', years: 6, grads: 5, unit: '학년', newb: '연구소', grad: true }   // 대학원: 안쪽은 6학년(석사 2, 박사 4), 보이는 글은 석사 1~4학기, 박사 1~8학기(gradSemTxt). 대학교 캠퍼스와 건물을 이어 가요 준비 중: TIER_OPEN을 올리기 전에는 개발자 메뉴 '대학교 미리 보기'에서만 보여요
  ];
  const TIER_OPEN = 6;   // 대학원까지. 중학교까지, 고등학교까지, 대학교까지 열려요
  // 학교급이 오르면 수업료는 1000배, 공사비는 2000배라서 숫자 단위가 껑충 커져요
  // 학교급마다 수업료와 공사비 배수를 표로 적어요(균형 제안서에서 고르는 값). 표에 없는 학교급은 예전 규칙(1000배, 2000배)
  // 중학교 공사비는 균형 제안서 제안값 5억 배(예전 규칙이면 400만 배). 전이에요
  const TIER_SCALE = { inc: [4, 1e3, 1e6, 1e9, 1e12, 1e12], cost: [1, 2e3, 5e8, 2.5e11, 6e16, 2.4e17] };   // 대학원 공사비만 4배(수업료 배수는 그대로). 건물 값이 수입보다 너무 싸서 12학기가 5일쯤이면 끝났어요. 대학원은 건물을 이어 가서 배수를 따로 올리지 않아요. 대학교: 수업료 1e12, 공사비 6e16(bal400으로 한 학년 20시간쯤)
  // 고등학교: 중학교가 초등학교의 1000배와 25만 배였던 비율 그대로(봇으로 다시 재요)
    // 유치원 수업료 4배: 유치원을 2시간 안에(속도와 경제 재설계안 1절)
  const incomeScale = () => TIER_SCALE.inc[S.tier] !== undefined ? TIER_SCALE.inc[S.tier] : Math.pow(1000, S.tier);
  const costScale = () => TIER_SCALE.cost[S.tier] !== undefined ? TIER_SCALE.cost[S.tier] : Math.pow(2000, S.tier);
  const tierInfo = () => TIERS[S.tier];
  // 올해가 몇 년째(몇 학년)인지. 다음 학교급이 아직 안 열려서 마지막 해를 되풀이하면 마지막 해로 보여요
  const yearNo = () => Math.min(S.tg + 1, tierInfo().years);
  // 대학원: 학년 대신 학기로 보여요. y는 몇 학년(1부터), sem은 0(1학기) 또는 1(2학기)
  const GRAD_TIER = 5;
  const gradOn = t => (t === undefined ? (S ? S.tier : 0) : t) >= GRAD_TIER;
  const gradSemN = (y, sem) => (Math.max(1, y) - 1) * 2 + (sem ? 1 : 0) + 1;
  const gradSemTxt = (y, sem) => { const n = gradSemN(y, sem); return n <= 4 ? `석사 ${n}학기` : `박사 ${n - 4}학기`; };
  const yearLabel = () => gradOn() ? `대학원 ${gradSemTxt(yearNo(), S.sem)}` : `${tierInfo().name} ${yearNo()}${tierInfo().unit}`;
  // '2년째가', '3학년이'처럼 뒤에 붙는 조사까지
  const yearSubj = (n, T) => `${n}${T.unit}${T.unit === '년째' ? '가' : '이'}`;
  // 동네 평판 기준도 학교급마다 20%씩 높아져요
  // 2학기에는 동네 기준이 반 단계(초등 15.6점, 중학교 18점) 올라가요(균형 제안서 두 학기 2절). 시설 상한은 그대로라 선생님과 남은 시설로 다시 대도시를 만들어요
  // 대학원은 건물을 이어 받아 대도시 기준이 너무 낮았어요(석사 1학기 260, 대학교 4학년 2학기 398)
  // 대학교처럼 상한까지 지은 평판보다 55쯤 아래가 되게, 석사 1학기 432에서 학기마다 약 +21(박사 8학기 665). 아래 등급도 같은 비율
  // 건물과 선생님이 학기를 넘어 남아서, 둘째 학기부터는 시작하자마자 대도시였어요(46학기 가운데 40학기)
  // 초등학교부터는 '이번 학기에 더 올린 평판'으로 등급을 정해요. 학기를 시작할 때의 평판(S.gr0)에서 마을 25%, 소도시 50%, 도시 75%, 대도시 100%.
  // 학기 목표 폭은 그 학기에 상한이 오른 만큼 건물을 다 올렸을 때 평판(단계마다 7)에 선생님 세 단계(6)를 더한 것의 60%: 1학기 16, 2학기 12(봇으로 잰 제안 숫자. 80%면 초등학교가 5.7일 길어져서 60%로).
  // 선생님은 상한이 없어서 건물을 미리 다 올려 둔 학교도 막히지 않아요. 학교급 첫 학기와 옛 저장의 지금 학기(S.gr0 = -1)는 아래 옛 기준 그대로예요
  const TERM_F = [0, 0.25, 0.5, 0.75, 1];
  const termRep = () => Math.round(0.6 * (7 * (S.sem ? 2 : 3) + 6));
  const termOn = () => !!S && S.tier >= 1 && S.gr0 >= 0;
  const townRep = g => termOn() ? S.gr0 + Math.round(termRep() * TERM_F[g]) : S.tier >= GRAD_TIER ? Math.round(CFG.grades[g].rep * 3.32 * (1 + 0.049 * (2 * S.tg + (S.sem || 0))))
    : Math.round(CFG.grades[g].rep * (1 + 0.2 * S.tier) * (1 + 0.2 * (S.tg + (S.tier >= 1 ? 0.5 * (S.sem || 0) : 0))));
  // 숫자 뒤 조사: 끝자리가 0, 1, 3, 6, 7, 8이면 받침이 있어요 (십, 일, 삼, 육, 칠, 팔)
  const numEul = n => '013678'.includes(String(n).slice(-1)) ? '을' : '를';
