  /* ---------- 상태 ---------- */
  let S = null;
  const rt = {
    lastT: 0, uiT: 0, affT: 0, sortT: 0, floatAcc: 0, floatT: 0, dropT: 0,
    kids: [], drops: [], kidSeq: 0, talk: null, talkT: 20, furKey: '', modalQueue: [], modalOpen: null, cereOn: false, cereToasts: [], mdToasts: [], toastQ: [], toastAt: 0, tapT: 0, sheetKey: null, tab: 'school',
    paused: false, closedAt: 0, hiddenAt: 0, reduced: !!(motionMQ && motionMQ.matches),
    qr: {}, qKey: '', guideKey: null,
    adOpen: false, adTimer: 0, adOk: null, adNo: null, adEarned: false, gKey: '', townStage: -1, townTier: -1,
    deal: null, dealT: DEAL.first, boostUntil: 0, boostT: BOOSTW.first, fitKey: '', fitGen: 0, yearKey: '', oakN: -1, oakHintAt: 0, rankEdit: false,
    adopting: false, adNoGold: false, shopPick: ''
  };
  if (motionMQ && motionMQ.addEventListener) motionMQ.addEventListener('change', e => { rt.reduced = e.matches; });
  // 헷갈리는 0, O, 1, I, L을 뺀 글자로 학교 번호를 만들어요
  const ID_ABC = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  function randCode(n) {
    const a = new Uint32Array(n);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a);
    else for (let i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 4294967296);
    return Array.from(a, x => ID_ABC[x % ID_ABC.length]).join('');
  }
  // 서버 저장 상태. GitHub 테스트판에서만 켜져요 (아래 '서버 저장'에 자세히 적었어요)
  const Cloud = { state: 'off', gen: 0, fb: null, db: null, uid: null, dirty: false, pushing: false, lastPush: 0, lastStats: 0, timer: 0,
    offset: 0, online: true, err: '', bootHadSave: false, bootSavedAt: 0, skipRestore: false, listening: false, rev: 0, syncSv: null, hideSv: null, hold: false, deleting: false };

  // q.m: 지금 메인 퀘스트 번호, q.mb: 그 퀘스트를 시작할 때의 기준값, q.subs: 받아 둔 학생 부탁들
  // mid: 지금 메인 퀘스트의 id. 퀘스트 목록이 바뀌어도 이어서 할 수 있게 저장해요
  const freshQ = () => ({ init: false, m: 0, md: 0, mb: 0, mid: '', lat: '', subs: [], done: [], gen: 0, subDone: 0, seen: -1, qv: 2, reset: false });
  // p: 종업식으로 남는 것(수료증, 전학생 수, 명예 교장실), best: 가장 높았던 등급, yearEarned: 올해 번 도토리
  // tier: 학교급(0 유치원, 1 초등학교), tg: 이 학교급에서 연 종업식, tdip: 이 학교급에서 모은 수료증, fund와 fp: 장학재단 기금과 강화
  const fresh = () => ({
    v: 4, pid: randCode(8), born: Date.now(), budget: 20, students: 4,
    f: { classroom: 1, cafeteria: 0, library: 0, playground: 0, science: 0, store: 0, dorm: 0, union: 0, institute: 0, gradhall: 0 },   // 5.0.0 연구소, 연구동   // 4.0.0 union: 학생회관
    fu: freshFu(),
    fold: { b: 0, l: 0, r: 0, q: 0, td: 0 },   // 5.0.2 td: 퀘스트 탭 '오늘 할 일' 접기   // 3.0.0 홈 칸 접기(1이면 접음)
    t: { squirrel: 1, owl: 0, bear: 0 },
    vp: 0,   // 1.7.0 고슴도치 교감 선생님 연수 레벨 (0~10)
    ach: { hit: {}, got: {}, title: '' },   // 1.7.1 업적: hit 이룬 등급(0~3), got 받은 등급, title 단 칭호(업적 종류 id)
    xt: { diet: 0, lib: 0, kor: 0, art: 0, snack: 0, dorm: 0, fix: 0, cou: 0, dean: 0, adv: 0 },   // 5.0.0 adv: 펠리컨 지도교수님   // 4.0.0 dean: 두루미 학장 교수님   // 3.1.0 cou: 코끼리 선생님(진로 상담)
      // 2.3.0 국어, 미술, 매점 선생님   // 1.7.1 양 선생님, 사슴 선생님 연수 레벨 (0~10, 그 건물을 지으면 오셔요)
    grade: 0, best: 0, sound: true, bgm: true, vibrate: true, ambV: 2, savedAt: Date.now(),
    pending: 0, pendingSec: 0, away: { from: 0, skip: 0 }, certNo: 0, earned: 0, yearEarned: 0, pwBank: 0,
    tier: 0, tg: 0, sem: 0, semDip: 0, tdip: 0, fund: 0, fp: { schol: 0, rep: 0, dip: 0 },
    hd: { day: '', n: 0, feastUntil: 0, album: false, seen: false, furNew: true },
    oak: OAK.max,
    st: { picks: 0, ups: 0, trains: 0, claims: 0, grads: 0, perks: 0, fperks: 0, shakes: 0, dips: 0, play: 0, sess: 0, ads: 0, gold: 0, gspent: 0, trips: 0, sports: 0, dmDone: 0, pz: 0, trials: 0, shows: 0, visits: 0, esSpent: 0, rxSpent: 0, pzb: 0, elects: 0, elMid: 0, sems: 0, cons: 0, tkUsed: 0, cbBuy: 0, nsAway: 0 },   // 2026-11-11 cons, tkUsed, cbBuy, nsAway: 쓰기만 하고 저장에서 빠지던 칸(패스 미션 '시설 공사'가 0으로 돌아가던 문제)   // 2.1.0 sems: 1학기 방학식. 2.0.1 elects: 반장을 뽑은 횟수, elMid: 그 가운데 중학교부터
      // 2.0.0: trials(1.7.4 침입자)가 저장에서 빠지던 것을 고치고 shows(동아리 발표회)를 더해요
    p: { dip: 0, species: 0, ticket: 0, nl: NEWCOMERS.map(() => 0), perk: { schol: 0, rep: 0, start: 0, drop: 0, night: 0 } },
    att: { last: '', n: 0 },
    ad: { day: '', n: 0 },
    u: { boost: false, dev: false },
    units: 'ko',
    uiz: 0,   // 5.0.1.7 화면 크기(0 보통 0.9배, 1 크게 1배, woodani 결정 X-01)
    trip: { open: false, cur: '', start: 0, end: 0, souv: [], been: {}, kids: 0 },
    sports: { next: 0 },
    fest: { next: {}, n: {}, sub: {} },   // sub: 밤이라 낮 행사가 잠겼을 때 밤 행사로 대신 채운 메인 퀘스트 횟수
    dm: { day: '', list: [], bonus: false, swapped: false },
    tut: { st: '', step: 0, paid: false, nop: false }, tips: { rep: false, oak: false, left: false, tabs: false },   // 5.0.1.7 F-03 기능이 열릴 때 한 장 안내
    nt: { seen: '', ver: '', hide: 0 },   // 2.0.0 공지: 마지막으로 본 공지, 마지막으로 띄운 버전, 일주일간 열지 않기 끝
    wk: { week: -1, pts: 0, got: [false, false, false, false, false], list: [] },
    lg: { week: -1, pts: 0, pos: 0, paid: false, last: null, dq: { day: '', p: 0 } },   // 5.0.3 dq: 오늘 쌓인 진행 점수(퀘스트와 식)
    gold: 5, gd: { day: '', n: 0, shop: 0 }, cos: { own: [], hat: '', neck: '', mkx: '', night: false, th: { bg: '', classroom: '', cafeteria: '', library: '', science: '', playground: '' }, sp: { classroom: '', cafeteria: '', library: '', science: '', playground: '' } }, autoUntil: 0,
    rank: { name: '', joined: false, sent: -1, by: '', ren: 0, asked: false },
    bs: { classroom: 0, cafeteria: 0, library: 0, science: 0, playground: 0, store: 0, dorm: 0, union: 0, institute: 0, gradhall: 0 },   // 1.7.0 건물마다 지금 보이는 모습의 학교급
    mg: mgFresh(),   // 1.8.0 숲속 합치기
    dex: { got: {}, paid: [] }, ev: { cur: '', start: 0, stamp: { n: 0, last: '' }, list: [], box: false },   // 1.7.0 도감, 이벤트
    // 1.6.0 숲의 정수(미니게임에서만 얻어요)와 블록 퍼즐: 오늘 보상 판 수, 광고로 더한 횟수, 최고 점수, 하던 판
    ess: 0, pz: { day: '', n: 0, adN: 0, best: 0, cur: null, hand: '', tb: 0 },   // 2.3.1 hand: 보상 판을 직접 한 날(소탕), 3.0.0 tb: 그날 직접 한 보상 판의 최고 점수
    ac: freshAc(),   // 2.0.1 공부: 과목 5개 학교 학력(lv, xp), 문제집 bk(day, n), 통계 st
    pc: freshPc(), sk: freshSk(),   // 2.1.0 숲속 소풍, 칭찬 스티커판
    ff: {},   // 2.1.1 건물마다 바로 완공을 쓴 날(3.0.0부터는 기록만, 횟수는 ffd)
    ffd: { day: '', n: 0 },   // 3.0.0 조정안 7: 오늘 학교 전체에서 쓴 무료 즉시 완공 횟수
    ces: '',   // 2.3.0 숲의 정수로 즉시 완료 '오늘은 다시 묻지 않기'를 고른 날
    ffx: '',   // 2.3.0 홈 지도 칩을 닫은 날
    sn: { got: {}, day: '', mood: 0, pity: 0, n: 0, gold: false },   // 2.1.2 매점 간식 뽑기: 간식마다 뽑은 수, 기분 날짜와 칸, 희귀 없이 뽑은 수, 모두 뽑은 수, 다 모아 받은 황금 기계
    vd: { lv: 0, p: 0, sum: 0, n: 0, lk: { day: '', lv: 0, need: 0 } },   // 2.3.1 lk: 그날 처음 기부한 단계의 가격(그날 23:59까지 그대로)
      // 2.1.2 마을 기부: 단계, 이번 단계 채운 비율(0~1), 모두 낸 도토리, 낸 횟수
    cb: { until: 0, at: 0 },   // 2.1.1 건설 가속(도토리): until까지 공사 +100%, at은 마지막으로 셈한 때
    nb: { at: 0, seen: '' },
    ns: { day: '', sub: 'kor', got: 0, sec: 0, done: true, n: 0, at: 0, fin: 0 },   // 3.0.0 야간 자율학습: 켠 밤의 시작 날짜, 고른 과목, 그 밤에 쌓인 도토리와 시간, 결과 받음, 준비 횟수, 예약/시작 시각, 마친 횟수
    cg: freshCg(),   // 2.2.0 동아리 대항전(숲속 대결 주간 순위 lg와 다른 칸): 주, 상대 학교 한 주 점수, 동아리마다 연습과 발표회 수, 오늘 연습한 날, 지난주 결과, 우승 수, 3등 안 수, 기록
    bx: freshBx(),   // 2.2.0 숲속 생물 탐사(시험 기간 ex와 다른 칸): 지도, 숨은 생물(자리, 생물, 나타난 때), 다음 나타날 때, 관찰 수, 받은 단계 보상, 기록
    gn: freshGd(),   // 2.2.0 학교 텃밭(황금 도토리 상점 gd와 다른 칸): 밭(작물, 심은 때, 다 자라는 때, 물), 재료, 만든 메뉴, 오늘의 급식, 메뉴 8가지 황금, 비로 물 준 날, 기록   // 2.2.0 야간 건설 이벤트: at 마지막으로 셈한 때, seen 시작 알림을 본 날
    fr: {}, frg: { day: '', n: 0 }, frc: { pat: 0, gift: 0, cake: 0, alb: 0 }, bday: { day: '', done: false }, alb: [],   // 2.1.1 단짝 친구, 오늘 선물, 횟수, 오늘 생일 잔치, 졸업 앨범
    dsn: { day: '', trips: 0, sports: 0, fest: {} },   // 2.1.0 오늘 시작할 때의 체험학습, 운동회, 행사 횟수(오늘 한 것도 퀘스트에 쳐요)
    lab: freshLab(), rd: freshRd(), ex: freshEx(), bt: freshBt(), ps: freshPs(), rare: { got: [], miss: 0 }, rs: { n: 0, p: 0, pos: 0, king: 0 }, lk: { on: false, at: 0, h: '', pub: false, del: false }, wx: '', pl: { got: 0, read: 0, wk: -1 },   // pl: 2.1.3 학부모 편지(받은 통, 읽은 통, 받은 주)
      // wx: 2.1.3 날씨 알림을 본 날. ps: 2.1.3 숲속 패스, rs: 랭킹 시즌(번호, 점수, 마지막으로 본 순위, 시즌 왕 횟수), lk: 내 학교 보여 주기(pub 서버에 올린 적 있음, del 끄기를 서버에 아직 못 지움. 2.2.0 검토 6), rare: 2.1.3 반짝 친구(만난 종, 연속 못 만난 횟수)
      // ex: 2.0.1 시험 기간(본 시험 주, 자율학습, 성적표, 기록)
    // 2.0.1 공부 2단계: 과학 탐구 실험(오늘 한 날, 모은 카드, 해 본 짝), 책 읽기(오늘 권수, 읽는 책과 시작 시각, 읽은 횟수)
    bd: {}, tk: { m5: 0, m30: 0, h1: 0, h3: 0 }, tka: { day: '', n: 0 }, tkd: { day: '', pz: 0, mg: 0 },   // 2.3.0.1 tkd: 오늘 퍼즐, 합치기로 받은 단축권   // 2.1.0 공사(건물마다 { L 오를 레벨, s 시작, e 끝 }), 시간 단축권 장수, 광고 단축권 오늘 횟수
    clk: { last: 0 },   // 게임 시계: 지금까지 본 가장 늦은 시각 (gameNow)
    fg: { day: '', got: [] },   // 1.7.2 학교 행사 황금 도토리: 행사마다 하루 한 번(got에 오늘 받은 행사 id)
    es: { day: '', n: 0, week: -1, g: 0, x: 0, t: 0, bf: 0, ba: 0, ax: 0 },   // 2.1.0 t 오늘 산 단축권 묶음 수, bf ba 오늘 산 부스터(수업료 2배, 자리 비운 보상 2배)
    awx: 0,   // 2.1.0 자리 비운 보상 2배 부스터: 다음 받기에 2배(남은 번 수)
    zv: {},   // 4.0.0 들어가 본 구역({academic: 1, ...}). '캠퍼스 둘러보기' 퀘스트가 세요
    gr0: -1,   // 5.0.1.4 이번 학기를 시작할 때의 평판(동네 등급을 이 위로 올린 만큼으로 정해요). -1이면 옛 기준
    rp: { b: 0 },   // 되풀이 학년 종업식 조건: 지난 식 때의 건물 레벨 합(0이면 아직 안 셈)
    bf: freshBf(),   // 4.2.0 대축제: mon 그 달, st 도장, got 받은 단계, day 날짜, dn 그날 도장, o 창 열기, g2 손님 다섯 곳, fw 불꽃놀이, own 받은 달 장식, eve 전날 띠, tip 다른 학교 띠, auto 첫날 창
    tam: freshTam(),   // 4.3.0 숲속 탐험대: best 가장 깊은 층, party 대원, mem 동물마다 { lv, st 별, sh 별 조각 }, gear 장비 레벨, mat 재료 넷, it 보고서 마지막 받은 때, auto, ad, spd 2배속, wk 주간 최고, seen
    adx: freshAdx(),   // 4.2.0 광고: day 날짜, n 오늘 광고 도장, got 받은 단계, fv fw xg cs 오늘 쓴 '한 판 더'(축제 부스, 불꽃놀이, 교환학생 안내, 진로 상담)
    rx: { lv: {}, c: {} },
    rt5: { lv: {}, cur: null },
    pp: { dat: 0, cur: null, n: 0, by: {}, day: '', cm: -1, cf: 0, cb: 0, ck: {}, med: [], sem: 0 },   // 5.2.0 논문: dat 연구 자료, cur 쓰는 논문 { k 주제, end }, n 편수, by 주제마다 편수, day 자료 정리한 날, cm 학회 번호(4주), cf 이번 학회 점수, cb 가장 높았던 학회 점수, ck 이번 학회 주제마다 편수, med [학회, 메달 1~3], sem 대학원 세미나와 학위수여식 횟수
    ta: { seat: [], out: [], mem: 0, mon: 0, n: 0 },   // 5.1.0 조교: seat 자리마다 { b 건물 }, out 파견 { i 자리, to 모교 0~4, h 시간 0~2, end }, mem 추억 조각, mon 기념비 단계, n 파견 횟수   // 5.0.0 연구 트리: lv 가지마다 칸 수(0~4), cur 지금 연구 { k, end }   // 4.2.0 연구 투자: lv 연구마다 레벨, c 그 레벨에 정해 둔 값(열린 때의 수업료로 정하고 올릴 때까지 그대로)
    fv: freshFv(),   // 4.1.0 대학 축제: wk 이번 주, st 도장 수, got 받은 단계, day 날짜, b 그날 한 부스, g 그날 만난 손님, o 그날 창을 열었는지, win 부스마다 성공 횟수, own 받은 기념품, tip 띠를 닫은 주, td 띠를 본 날
    xg: freshXg(), mk: freshMk(), sto: freshSto(),   // 4.1.0 교환학생의 날, 숲속 장터, 이야기(본 장면, 고른 답, 곁가지)
    dp: { pick: [], own: {}, free: 0 },   // 4.0.0 단과대학: pick 다니는 곳(열쇠), own 한 번이라도 고른 곳, free 1이면 다음 바꾸기가 공짜(종업식 뒤)
    zone: '',   // 4.0.0 대학교에서 지금 보는 구역('' = 캠퍼스 화면, 'academic' | 'life' | 'plaza' | 'sports')
    deco: freshDeco(),   // 1.7.4 꾸미기: own 가진 장식 수, lay 지도별 자리(유치원, 초등학교)마다 놓인 장식 id, nm 학교 이름 앞부분('' = 숲속), mk 학교 마크 [모양, 문양, 바탕 색, 문양 색] 또는 null   // 1.6.0 정수 상점: 오늘 산 도토리 묶음 수, 이번 주 산 황금 도토리 묶음 수
    cs: freshCs(),
    wxOff: 0,   // 날씨 효과 끄기(칩을 눌러 켜고 꺼요)
    nl: 0,   // 3.2.1 고등학교 밤 모습: 0 밤(어둡게), 1 저녁(조금 어둡게), 2 밝게(woodani 요청, 보이는 모습만 바뀌고 밤 규칙은 그대로)
    tr2: freshTr2(),   // 3.2.0 수학여행: 다녀온 학년, 지금 여행, 떠난 수, 돌아온 수, 기념품   // 3.1.0 진로 상담: 오늘 날짜와 횟수, 모든 상담 수, 진로를 고른 수, 이룬 학생 수, 정산한 명부 번호, 진로 도감
    roster: freshRoster(), club: freshClub(), el: freshEl(), snap: {}, tfp: 0,   // 2.0.1 el: 반장 선거
      // tfp: 이 학교급에 들어올 때까지 장학재단을 고친 횟수   // 2.0.0 학생 명부, 동아리, 학교급 사진(졸업식 때 남긴 모습)
    q: freshQ()
  });
  const repOf = s => s.f.classroom + s.f.cafeteria + s.f.playground + 3 * s.f.library + s.f.science + 2 * (s.t.squirrel + s.t.owl + s.t.bear) + 5 * s.p.perk.rep + 10 * s.fp.rep + acRepOf(s);   // 2.0.1 학력 10레벨마다 +1
  const gradeOf = r => { let g = 0; CFG.grades.forEach((x, i) => { if (r >= townRep(i)) g = i; }); return g; };

  function sanitize(d) {
    const s = fresh();
    if (!d || typeof d !== 'object') return s;
    // 1.5.4: 손상되거나 고친 저장이 계산을 무한대로 만들거나 시작을 멈추지 않게 칸마다 넉넉한 상한을 둬요.
    // 실제 놀이로는 닿을 수 없는 값이라 정상 저장은 그대로예요 (SAVE_CAP)
    const cap = (v, max) => Math.min(max, v);
    s.budget = cap(numFb(d.budget, 0, s.budget, SAVE_CAP.acorn), SAVE_CAP.acorn);
    s.students = cap(numFb(d.students, 0, s.students), SAVE_CAP.count);
    for (const k in s.f) s.f[k] = Math.floor(cap(numFb(d.f && d.f[k], k === 'classroom' ? 1 : 0, s.f[k]), SAVE_CAP.lv));
    // 시설 안 가구: 가구가 생기기 전 저장이면 지금 건물 레벨까지 채워 줘서 바로 다음 레벨을 준비할 수 있어요
    for (const k in s.fu) s.fu[k] = s.fu[k].map((_, i) => {
      const a = d.fu && Array.isArray(d.fu[k]) ? d.fu[k] : null;
      return Math.min(s.f[k], Math.floor(a ? numFb(a[i], 0, 0) : s.f[k]));
    });
    for (const k in s.t) s.t[k] = Math.floor(cap(numFb(d.t && d.t[k], k === 'squirrel' ? 1 : 0, s.t[k]), TEA[k].max || SAVE_CAP.tea));
    s.t.owl = Math.min(s.t.owl, TEA.owl.max);
    s.grade = Math.min(Math.floor(numFb(d.grade, 0, 0)), CFG.grades.length - 1);
    s.sound = d.sound !== false; s.bgm = d.bgm !== false; s.vibrate = d.vibrate !== false;
    s.ambV = [0, 1, 2, 3].includes(d.ambV) ? d.ambV : (s.sound || s.bgm ? 2 : 0);   // 자연 소리 크기(0 끄기~3 크게). 옛 저장은 소리를 다 꺼 둔 사람만 끄기
    s.savedAt = numFb(d.savedAt, 0, Date.now());
    s.pending = cap(numFb(d.pending, 0, 0, SAVE_CAP.acorn), SAVE_CAP.acorn); s.pendingSec = cap(numFb(d.pendingSec, 0, 0), SAVE_CAP.count);
    s.certNo = Math.floor(cap(numFb(d.certNo, 0, 0), SAVE_CAP.count)); s.earned = cap(numFb(d.earned, 0, 0, SAVE_CAP.acorn), SAVE_CAP.acorn); s.pwBank = cap(numFb(d.pwBank, 0, 0), SAVE_CAP.big);
    if (d.st && typeof d.st === 'object') for (const k in s.st) s.st[k] = Math.floor(cap(numFb(d.st[k], 0, 0), k === 'earned' || k === 'spent' ? SAVE_CAP.big : SAVE_CAP.count));
    s.oak = Math.min(OAK.max, numFb(d.oak, 0, OAK.max));
    // 종업식과 출석, 광고 기록. 예전 저장에는 없으니 지금 상태에서 알맞게 채워요
    s.best = Math.max(s.grade, Math.min(Math.floor(numFb(d.best, 0, 0)), CFG.grades.length - 1));
    s.yearEarned = cap(numFb(d.yearEarned, 0, s.earned, SAVE_CAP.acorn), SAVE_CAP.acorn);
    if (d.p && typeof d.p === 'object') {
      s.p.dip = Math.floor(cap(numFb(d.p.dip, 0, 0), SAVE_CAP.count));
      s.p.ticket = Math.floor(cap(numFb(d.p.ticket, 0, 0), SAVE_CAP.count));
      if (Array.isArray(d.p.nl)) s.p.nl = s.p.nl.map((_, i) => Math.min(99, Math.floor(numFb(d.p.nl[i], 0, 0))));
      s.p.species = Math.min(NEWCOMERS.length, Math.floor(numFb(d.p.species, 0, 0)));
      if (d.p.perk && typeof d.p.perk === 'object') for (const k in s.p.perk) s.p.perk[k] = Math.floor(cap(numFb(d.p.perk[k], 0, 0), PERKS[k].max || SAVE_CAP.perk));
      s.p.perk.night = Math.min(s.p.perk.night, PERKS.night.max) || 0;   // 2.3.0.1 NaN으로 저장된 학교도 0부터
    }
    if (d.att && typeof d.att === 'object') { s.att.last = typeof d.att.last === 'string' ? d.att.last.slice(0, 10) : ''; s.att.n = Math.floor(numFb(d.att.n, 0, 0, SAVE_CAP.count)); }
    if (d.ad && typeof d.ad === 'object') { s.ad.day = typeof d.ad.day === 'string' ? d.ad.day.slice(0, 10) : ''; s.ad.n = Math.floor(numFb(d.ad.n, 0, 0, SAVE_CAP.count)); }
    // 학교급과 장학재단. 졸업식이 없던 저장은 지금까지의 종업식이 모두 유치원에서 열린 것으로 쳐요
    s.tier = Math.min(Math.floor(numFb(d.tier, 0, 0)), TIER_OPEN - 1);
    s.zone = typeof d.zone === 'string' && ZONE_KEYS.includes(d.zone) ? d.zone : '';   // 4.0.0
    s.zv = {}; if (d.zv && typeof d.zv === 'object') for (const z of ZONE_KEYS) if (d.zv[z]) s.zv[z] = 1;
    s.gr0 = Math.floor(cap(numFb(d.gr0, -1, -1), SAVE_CAP.count));   // 5.0.1.4 옛 저장은 -1(지금 학기는 옛 기준, 다음 학기부터 새 기준)
    s.rp = { b: Math.floor(cap(numFb(d.rp && d.rp.b, 0, 0), SAVE_CAP.count)) };
    s.dp = { pick: [], own: {}, free: 0 };   // 4.0.0 단과대학
    if (d.dp && typeof d.dp === 'object') { const ks = ['science', 'sports', 'human', 'art', 'biz', 'eng', 'edu', 'med']; if (Array.isArray(d.dp.pick)) for (const k of d.dp.pick) if (ks.includes(k) && !s.dp.pick.includes(k) && s.dp.pick.length < 3) s.dp.pick.push(k); if (d.dp.own && typeof d.dp.own === 'object') for (const k of ks) if (d.dp.own[k]) s.dp.own[k] = 1; s.dp.free = d.dp.free ? 1 : 0; }
    s.tg = Math.floor(numFb(d.tg, 0, s.tier === 0 ? s.st.grads : 0));
    // 2.1.0 학기: 0은 1학기, 1은 2학기. 학기가 없던 저장은 지금 학년을 2학기로 쳐서, 다음 종업식에 원래대로 학년이 올라가요
    s.sem = d.sem === 0 || d.sem === 1 ? d.sem : (s.tier >= 1 ? 1 : 0);
    s.semDip = s.sem ? Math.min(SAVE_CAP.count, Math.floor(numFb(d.semDip, 0, 0))) : 0;   // 2.1.0 1학기 방학식에 준 수료증
    s.fund = Math.floor(cap(numFb(d.fund, 0, 0), SAVE_CAP.count));
    if (d.fp && typeof d.fp === 'object') for (const k in s.fp) s.fp[k] = Math.floor(cap(numFb(d.fp[k], 0, 0), SAVE_CAP.fperk));
    if (d.hd && typeof d.hd === 'object') {
      s.hd.day = typeof d.hd.day === 'string' ? d.hd.day.slice(0, 10) : '';
      s.hd.n = Math.floor(numFb(d.hd.n, 0, 0, SAVE_CAP.count));
      s.hd.feastUntil = Math.min(numFb(d.hd.feastUntil, 0, 0), Date.now() + 27 * 3600000);   // 2.0.0: 게임 시계 기준이라 하루 여유
      s.hd.furNew = d.hd.furNew !== false;
      s.hd.album = !!d.hd.album; s.hd.seen = !!d.hd.seen;
    }
    // 예전 저장에는 '이번 학교급에서 모은 수료증'이 없어서, 가진 수료증과 명예 교장실에 쓴 수료증을 더해 채워요
    let spent = 0;
    for (const k in s.p.perk) for (let L = 0; L < s.p.perk[k]; L++) spent += PERKS[k].cost(L);
    s.tdip = cap(numFb(d.tdip, 0, s.p.dip + spent), SAVE_CAP.count);
    s.u.boost = !!(d.u && d.u.boost) || s.t.owl >= 1;
    s.u.dev = !!(d.u && d.u.dev);
    s.units = d.units === 'en' ? 'en' : 'ko';
    s.uiz = d.uiz === 1 ? 1 : 0;   // 5.0.1.7
    // 학교 번호는 기기를 옮겨도 그대로예요. 예전 저장에는 없어서 새로 만들고, 처음 연 날은 마지막 저장 때로 어림해요
    if (typeof d.pid === 'string' && /^[0-9A-Z]{6,16}$/.test(d.pid)) s.pid = d.pid;
    s.born = Math.min(numFb(d.born, 0, s.savedAt), Date.now());
    // 황금 도토리: 예전 저장에도 처음 선물 5개를 줘요. 꾸미기는 산 것만 입을 수 있어요
    s.gold = Math.floor(cap(numFb(d.gold, 0, s.gold), SAVE_CAP.count));
    if (d.gd && typeof d.gd === 'object') { s.gd.day = typeof d.gd.day === 'string' ? d.gd.day.slice(0, 10) : ''; s.gd.n = Math.floor(numFb(d.gd.n, 0, 0, SAVE_CAP.count)); s.gd.shop = Math.floor(numFb(d.gd.shop, 0, 0, SAVE_CAP.count)); }
    if (d.cos && typeof d.cos === 'object') {
      // 칠판 색은 이제 배경 테마를 따라가요. 예전에 산 칠판은 값(10개씩)을 돌려줘요
      // 지붕도 이제 테마 세트가 맡아요. 예전에 산 지붕도 값(파란 지붕 15개, 벚꽃과 눈 오는 학교 25개)을 돌려줘요
      const OLD = { 'board:navy': 10, 'board:plum': 10, 'board:wood': 10, 'roof:blue': 15, 'roof:sakura': 25, 'roof:snow': 25 };
      if (Array.isArray(d.cos.own)) s.gold += [...new Set(d.cos.own)].reduce((a, id) => a + (OLD[id] || 0), 0);
      s.cos.own = Array.isArray(d.cos.own) ? [...new Set(d.cos.own.filter(id => typeof id === 'string' && (COS_IDS.has(id) || SP_IDS.has(id))))] : [];
      for (const k of Object.keys(COS)) { const v = d.cos[k]; s.cos[k] = typeof v === 'string' && s.cos.own.includes(k + ':' + v) ? v : ''; }
      const th = d.cos.th && typeof d.cos.th === 'object' ? d.cos.th : {};
      for (const [slot] of TH_SLOTS) { const v = th[slot]; s.cos.th[slot] = typeof v === 'string' && s.cos.own.includes(`th:${v}:${slot}`) ? v : ''; }
      // 1.6.0 특별 가구: 산 것만 방에 놓여요 (sp 칸이 없는 옛 저장은 산 가구를 바로 놓아요)
      const sp = d.cos.sp && typeof d.cos.sp === 'object' ? d.cos.sp : null;
      for (const k of Object.keys(SP_FUR)) { const own = s.cos.own.includes('sp:' + SP_FUR[k].id); s.cos.sp[k] = own && (!sp || sp[k] === SP_FUR[k].id) ? SP_FUR[k].id : ''; }
      // 2.1.0 학교 마크 특별판과 밤 모드: 산 것만 써요
      s.cos.mkx = typeof d.cos.mkx === 'string' && s.cos.own.includes('mkx:' + d.cos.mkx) ? d.cos.mkx : '';
      s.cos.night = d.cos.night === true && s.cos.own.includes(NIGHT_KEY);
    }
    // 1.7.2 학교 행사 황금 도토리 하루 한 번
    if (d.fg && typeof d.fg === 'object') {
      s.fg.day = typeof d.fg.day === 'string' ? d.fg.day.slice(0, 10) : '';
      s.fg.got = Array.isArray(d.fg.got) ? d.fg.got.filter(x => typeof x === 'string' && x.length < 20).slice(0, 10) : [];
    }
    // 1.6.0 정수 상점 구매 횟수
    if (d.es && typeof d.es === 'object') {
      s.es.day = typeof d.es.day === 'string' ? d.es.day.slice(0, 10) : ''; s.es.n = Math.floor(numFb(d.es.n, 0, 0, SAVE_CAP.count));
      s.es.week = Math.floor(numFb(d.es.week, -1, -1, SAVE_CAP.count)); s.es.g = Math.floor(numFb(d.es.g, 0, 0, SAVE_CAP.count));
      s.es.x = Math.floor(numFb(d.es.x, 0, 0, SAVE_CAP.count)); s.es.ax = Math.min(99, Math.floor(numFb(d.es.ax, 0, 0)));   // 4.3.1 정수로 도토리 바꾸기(오늘 바꾼 횟수)   // 1.7.4 도토리로 정수 바꾸기(오늘 바꾼 횟수)
      s.es.t = Math.min(99, Math.floor(numFb(d.es.t, 0, 0))); s.es.bf = Math.min(99, Math.floor(numFb(d.es.bf, 0, 0))); s.es.ba = Math.min(99, Math.floor(numFb(d.es.ba, 0, 0)));   // 2.1.0 문방구
    }
    s.autoUntil = Math.min(numFb(d.autoUntil, 0, 0), Date.now() + 27 * 3600000);
    if (d.fest && typeof d.fest === 'object') for (const id of FEST_IDS) {
      if (d.fest.next && d.fest.next[id]) s.fest.next[id] = Math.min(numFb(d.fest.next[id], 0, 0), Math.max(Date.now(), Number(d.clk && d.clk.last) || 0) + 2 * 3600000);   // 4.0.1 기기 시계를 뒤로 돌려 다시 열어도 대기가 줄지 않게, 마지막 게임 시계와 견줘요
      if (d.fest.n && d.fest.n[id]) s.fest.n[id] = Math.floor(numFb(d.fest.n[id], 0, 0, SAVE_CAP.count));
      if (d.fest.sub && d.fest.sub[id] && !FEST[id].night) s.fest.sub[id] = Math.floor(cap(numFb(d.fest.sub[id], 0, 0), SAVE_CAP.count));
    }
    if (d.dm && typeof d.dm === 'object' && typeof d.dm.day === 'string') {
      s.dm.day = d.dm.day.slice(0, 10); s.dm.bonus = !!d.dm.bonus; s.dm.swapped = d.dm.swapped === true;
      s.dm.list = (Array.isArray(d.dm.list) ? d.dm.list : []).filter(m => m && MISSIONS[m.id]).slice(0, 3).map(m => ({ id: m.id, b: numFb(m.b, 0, 0), done: !!m.done }));
    }
    if (d.tut && typeof d.tut === 'object') {
      s.tut.st = ['later', 'done', 'skip'].includes(d.tut.st) ? d.tut.st : ''; s.tut.step = Math.floor(numFb(d.tut.step, 0, 0, SAVE_CAP.count));
      s.tut.paid = !!d.tut.paid; s.tut.nop = !!d.tut.nop;
    }
    if (d.tips && typeof d.tips === 'object') { s.tips.rep = !!d.tips.rep; for (const k of ['oak', 'left', 'tabs']) s.tips[k] = !!d.tips[k]; }   // 5.0.1.7
    if (d.nt && typeof d.nt === 'object') s.nt = { seen: typeof d.nt.seen === 'string' ? d.nt.seen.slice(0, 40) : '', ver: typeof d.nt.ver === 'string' ? d.nt.ver.slice(0, 12) : '', hide: Math.min(typeof d.nt.hide === 'number' && isFinite(d.nt.hide) && d.nt.hide > 0 ? d.nt.hide : 0, Date.now() + 8 * 86400000) };   // 2.0.0 공지
    if (d.wk && typeof d.wk === 'object') {
      s.wk.week = Math.floor(numFb(d.wk.week, -1, -1, SAVE_CAP.count)); s.wk.pts = Math.floor(numFb(d.wk.pts, 0, 0, SAVE_CAP.count));
      s.wk.got = MP_BOX.map((_, i) => !!(Array.isArray(d.wk.got) && d.wk.got[i]));
      s.wk.list = (Array.isArray(d.wk.list) ? d.wk.list : []).filter(m => m && WMISSIONS[m.id]).slice(0, 4).map(m => ({ id: m.id, b: numFb(m.b, 0, 0), done: !!m.done }));
    }
    if (d.lg && typeof d.lg === 'object') {
      s.lg.week = Math.floor(numFb(d.lg.week, -1, -1, SAVE_CAP.count)); s.lg.pts = Math.floor(numFb(d.lg.pts, 0, 0, SAVE_CAP.count)); s.lg.pos = Math.floor(numFb(d.lg.pos, 0, 0, SAVE_CAP.count)); s.lg.paid = !!d.lg.paid;
      if (d.lg.last && typeof d.lg.last === 'object') s.lg.last = { week: numFb(d.lg.last.week, 0, 0, SAVE_CAP.count), pts: numFb(d.lg.last.pts, 0, 0, SAVE_CAP.count), pos: numFb(d.lg.last.pos, 0, 0, SAVE_CAP.count), gold: numFb(d.lg.last.gold, 0, 0, SAVE_CAP.count) };
      if (d.lg.dq && typeof d.lg.dq === 'object') s.lg.dq = { day: typeof d.lg.dq.day === 'string' ? d.lg.dq.day.slice(0, 12) : '', p: Math.min(1000, Math.floor(numFb(d.lg.dq.p, 0, 0, 1000))) };   // 5.0.3 옛 저장에는 없어요(기본값 그대로)
    }
    if (d.sports && typeof d.sports === 'object') s.sports.next = Math.min(numFb(d.sports.next, 0, 0), Math.max(Date.now(), Number(d.clk && d.clk.last) || 0) + 2 * 3600000);   // 4.0.1
    if (d.trip && typeof d.trip === 'object') {
      const t = d.trip;
      s.trip.open = !!t.open;
      s.trip.kids = Math.min(6, Math.floor(numFb(t.kids, 0, 0)));
      s.trip.souv = Array.isArray(t.souv) ? [...new Set(t.souv.filter(k => typeof k === 'string' && SOUV_IDS.has(k)))] : [];
      if (t.been && typeof t.been === 'object') for (const k of Object.keys(TRIP)) if (t.been[k]) s.trip.been[k] = Math.floor(numFb(t.been[k], 0, 0, SAVE_CAP.count));
      if (typeof t.cur === 'string' && TRIP[t.cur]) {
        const len = TRIP[t.cur].min * 60000, end = numFb(t.end, 0, 0), start = numFb(t.start, 0, 0);
        if (end > 0 && end - Math.max(Date.now(), Number(d.clk && d.clk.last) || 0) <= len + 86400000) {   // 4.0.1: 기기 시계가 하루 넘게 느려도 가던 체험학습이 사라지지 않게 마지막 게임 시계와 견줘요
          s.trip.cur = t.cur; s.trip.end = end; s.trip.start = Math.min(start || end - len, end - 1); }   // 2.0.0: 끝나는 시각은 게임 시계라 기기 시계와 어긋날 수 있어 하루 여유
      }
    }
    // 2.1.0: 토스 사용자 키는 옛 저장의 tk(글자)에서 tkey로 옮겨요. tk는 이제 시간 단축권 장수예요
    if (typeof d.tkey === 'string') s.tkey = d.tkey.slice(0, 200); else if (typeof d.tk === 'string') s.tkey = d.tk.slice(0, 200);
    s.awx = Math.min(3, Math.floor(numFb(d.awx, 0, 0)));
    s.acctGift = !!d.acctGift;
    if (d.rank && typeof d.rank === 'object') {
      s.rank.name = cleanName(d.rank.name);
      s.rank.joined = !!d.rank.joined && !!s.rank.name;
      s.rank.sent = Math.floor(numFb(d.rank.sent, -1, -1, SAVE_CAP.count));
      s.rank.by = typeof d.rank.by === 'string' ? d.rank.by.slice(0, 128) : '';
      s.rank.ren = Math.floor(numFb(d.rank.ren, 0, 0, SAVE_CAP.count)); s.rank.asked = !!d.rank.asked || s.rank.joined;
    }
    // 학교 점수(지금까지 받은 수료증)가 없던 저장은 이번 학교급의 수료증과 받은 기금으로 어림해요
    if (!s.st.dips) {
      let fundEver = s.fund;
      for (const k in s.fp) for (let L = 0; L < s.fp[k]; L++) fundEver += FPERKS[k].cost(L);
      s.st.dips = Math.floor(s.tdip + (s.tier > 0 ? Math.max(0, fundEver - s.tier) * FUND_PER : 0));
    }
    const q = sanitizeQ(d.q);
    if (q) s.q = q;
    // 예전에는 2~6학년 퀘스트가 한 장(7장)에 몰려 있었어요. 그때 저장이면 지금 학년의 장 첫 퀘스트부터 다시 시작해요
    if (q && d.q.qv !== 2 && s.tier === 1 && ['e13', 'e14', 'q26', 'e15', 'e6'].includes(String(d.q.mid || '').replace(/^end:/, ''))) {
      const ch = Math.max(6, Math.min(10, s.tg + 5));
      s.q.m = MAIN.findIndex(m => m.ch === ch);
      s.q.lat = ''; s.q.seen = Math.min(s.q.seen, s.q.m - 1); s.q.reset = true;
    }
    s.q.qv = 2;   // 퀘스트가 없던 예전 저장이면 init이 false로 남아 시작할 때 진행도에 맞춰 건너뛴다
    // 아직 유치원인데 초등학교 장의 퀘스트에 와 있으면 유치원 졸업식 퀘스트로 되돌려요 (0.4에서는 전학생 퀘스트가 5장에 있었어요)
    const k1 = MAIN.findIndex(m => m.id === 'k1');
    if (s.tier === 0 && MAIN[s.q.m] && MAIN[s.q.m].ch > MAIN[k1].ch) { s.q.m = k1; s.q.mb = 0; }
    // 2.3.0 woodani 제보: 유치원 퀘스트를 남긴 채 초등학교에 온 저장은 '유치원 졸업식'(바로 완료)부터 이어서 초등학교 장으로 가요
    if (s.tier >= 1 && MAIN[s.q.m] && s.q.m < k1) { s.q.m = k1; s.q.mb = 0; s.q.lat = ''; }
    // 2.0.0: 초등학교 퀘스트를 다 마친 저장(end:e38)은 새 '초등학교 졸업식'(e39)에서 이어가요. 아직 초등학교면 중학교 장으로 넘어가지 않아요
    const e39 = MAIN.findIndex(m => m.id === 'e39');
    if (s.tier === 1 && (s.q.m >= MAIN.length || (MAIN[s.q.m] && MAIN[s.q.m].ch > MAIN[e39].ch))) { s.q.m = e39; s.q.mb = 0; }
    // 1.3.0: 개발자 '졸업 조건 채우기'로 건너뛴 해가 종업식 횟수와 전학생에 빠져 있으면 학년에 맞춰 채워요
    const yearsDone = s.tier === 0 ? s.tg : TIERS[0].grads + 1 + s.tg;
    if (s.st.grads < yearsDone) s.st.grads = yearsDone;
    if (s.p.species < Math.min(NEWCOMERS_OLD, yearsDone)) s.p.species = Math.min(NEWCOMERS_OLD, yearsDone);
    sanitize170(d, s);   // 1.7.0 도감, 이벤트
    sanitize180(d, s);   // 1.8.0 숲속 합치기
    s.vp = Math.min(VP.max, Math.floor(numFb(d.vp, 0, 0)));   // 1.7.0 교감 선생님
    for (const k of Object.keys(XT)) s.xt[k] = Math.min(XT[k].max, Math.floor(numFb(d.xt && d.xt[k], 0, 0)));
    for (const k of ['b', 'l', 'r', 'q', 'td']) s.fold[k] = d.fold && d.fold[k] ? 1 : 0;   // 3.0.0 홈 칸 접기   // 1.7.1 새 선생님
    sanitize171(d, s);   // 1.7.1 업적
    sanitize174(d, s);   // 1.7.4 꾸미기
    sanitize200(d, s);   // 2.0.0 명부, 동아리, 학교급 사진
    sanitizeCs(d, s);   // 3.1.0 진로 상담
    sanitizeTr2(d, s);   // 3.2.0 수학여행
    sanitizeFv(d, s);   // 4.1.0 대학 축제
    sanitizeBf(d, s);   // 4.2.0 대축제
    { const R = d && d.rx && typeof d.rx === 'object' ? d.rx : {}, f = { lv: {}, c: {} };   // 4.2.0 연구 투자
      for (const x of RX.list) { const lv = R.lv && R.lv[x.k], c = R.c && R.c[x.k];
        if (typeof lv === 'number' && isFinite(lv) && lv > 0) f.lv[x.k] = Math.min(1000, Math.floor(lv));
        if (typeof c === 'number' && isFinite(c) && c > 0) f.c[x.k] = Math.min(SAVE_CAP.acorn, Math.floor(c)); }
      s.rx = f; }
    if (d.rt5 && typeof d.rt5 === 'object') {   // 5.0.0 연구 트리
      const lv = {}; for (const D of RT5.list) { const v = d.rt5.lv && d.rt5.lv[D.k]; if (Number.isFinite(v) && v > 0) lv[D.k] = Math.min(RT5.top, Math.floor(v)); }
      const c = d.rt5.cur; s.rt5 = { lv, cur: c && RT5.list.some(D => D.k === c.k && !D.lock) && Number.isFinite(c.end) ? { k: c.k, end: c.end } : null }; }
    if (d.ta && typeof d.ta === 'object') {   // 5.1.0 조교
      const T = d.ta, num = (v, mx) => Number.isFinite(v) && v > 0 ? Math.min(mx, Math.floor(v)) : 0;
      const seat = (Array.isArray(T.seat) ? T.seat : []).slice(0, 4).map(x => ({ b: x && typeof x.b === 'string' && FAC[x.b] ? x.b : '' }));
      const out = (Array.isArray(T.out) ? T.out : []).filter(o => o && Number.isInteger(o.i) && o.i >= 0 && o.i < 4 && Number.isInteger(o.to) && o.to >= 0 && o.to <= 4 && Number.isInteger(o.h) && o.h >= 0 && o.h <= 2 && Number.isFinite(o.end))
        .filter((o, j, a) => a.findIndex(y => y.i === o.i) === j).map(o => ({ i: o.i, to: o.to, h: o.h, end: o.end }));
      s.ta = { seat, out, mem: num(T.mem, 1e9), mon: num(T.mon, 3), n: num(T.n, 1e9) }; }
    if (d.pp && typeof d.pp === 'object') {   // 5.2.0 논문과 학회
      const P = d.pp, num = (v, mx) => Number.isFinite(v) && v > 0 ? Math.min(mx, Math.floor(v)) : 0, keys = new Set(RT5.list.map(D => D.k));
      const map = o => { const r = {}; if (o && typeof o === 'object') for (const k of Object.keys(o)) if (keys.has(k)) r[k] = num(o[k], 1e6); return r; };
      const c = P.cur && keys.has(P.cur.k) && Number.isFinite(P.cur.end) ? { k: P.cur.k, end: P.cur.end } : null;
      const med = Array.isArray(P.med) ? P.med.filter(m => Array.isArray(m) && Number.isFinite(m[0]) && [1, 2, 3].includes(m[1])).slice(-60).map(m => [Math.floor(m[0]), m[1]]) : [];
      s.pp = { dat: num(P.dat, 9999), cur: c, n: num(P.n, 1e6), by: map(P.by), day: typeof P.day === 'string' ? P.day.slice(0, 10) : '', cm: Number.isFinite(P.cm) ? Math.max(-1, Math.floor(P.cm)) : -1,
        cf: num(P.cf, 99999), cb: num(P.cb, 99999), ck: map(P.ck), med, sem: num(P.sem, 1e6) };
    } else if (s.tier >= GRAD_TIER) s.pp.sem = Math.max(0, Math.floor((s.tg || 0) * 2 + (s.sem || 0)));   // 5.2.0 앞 저장: 지난 세미나 수를 학기로 어림
    { const A = d && d.adx && typeof d.adx === 'object' ? d.adx : {}, f = freshAdx();   // 4.2.0 광고 도장과 한 판 더
      f.day = typeof A.day === 'string' ? A.day.slice(0, 10) : '';
      f.n = typeof A.n === 'number' && isFinite(A.n) ? Math.max(0, Math.min(ADX.max, Math.floor(A.n))) : 0;
      if (Array.isArray(A.got)) f.got = ADX.st.map((_, i) => A.got[i] ? 1 : 0);
      for (const k of ['fv', 'fw', 'xg', 'cs']) f[k] = A[k] ? 1 : 0;
      f.all = typeof A.all === 'number' && isFinite(A.all) ? Math.max(0, Math.min(10000, Math.floor(A.all))) : 0;   // 5.0.1
      s.adx = f; }
    sanitizeTam(d, s);   // 4.3.0 숲속 탐험대
    sanitizeXg(d, s); sanitizeMk(d, s); sanitizeSto(d, s);   // 4.1.0 교환학생, 장터, 이야기
    s.nl = [0, 1, 2].includes(d.nl) ? d.nl : 0;   // 3.2.1 고등학교 밤 모습
    s.tfp = Math.min(s.st.fperks, Math.floor(numFb(d.tfp, 0, s.st.fperks)));
    // 1.7.0 학교급별 건물 외관: 예전 저장은 지금 보이는 모습 그대로(유치원 모습, 과학실과 운동장은 초등학교 모습) 시작해서 다음 업그레이드 때 바뀌어요
    if (d.bs && typeof d.bs === 'object') { for (const k of Object.keys(s.bs)) s.bs[k] = Math.min(s.tier, Math.floor(numFb(d.bs[k], 0, 0))); }
    else { s.bs.science = Math.min(1, s.tier); s.bs.playground = Math.min(1, s.tier); }
    // 1.6.0: 숲의 정수와 블록 퍼즐. 예전 저장에는 없으니 0에서 시작하고, 하던 판은 모양이 맞을 때만 이어요
    s.ess = Math.min(1e9, Math.floor(numFb(d.ess, 0, 0)));   // 2.2.0 검토(추가 1): addEss와 같은 상한 10억(예전에는 읽을 때 상한이 없어 1e308도 받았어요)
    sanitizeAc(d, s);   // 2.0.1 공부
    sanitizeStudy2(d, s);   // 2.0.1 공부 2단계: 실험, 책 읽기
    sanitize210(d, s);   // 2.1.0 숲속 소풍, 칭찬 스티커판
    sanitize211(d, s);   // 2.1.1 단짝 친구, 생일 잔치, 졸업 앨범
    if (d.dsn && typeof d.dsn === 'object' && typeof d.dsn.day === 'string') {
      s.dsn.day = d.dsn.day.slice(0, 10); s.dsn.trips = Math.min(s.st.trips, Math.floor(numFb(d.dsn.trips, 0, 0))); s.dsn.sports = Math.min(s.st.sports, Math.floor(numFb(d.dsn.sports, 0, 0)));
      if (d.dsn.fest && typeof d.dsn.fest === 'object') for (const k of Object.keys(s.fest.n)) s.dsn.fest[k] = Math.min(s.fest.n[k] || 0, Math.floor(numFb(d.dsn.fest[k], 0, 0)));
    }
    sanitizeExam(d, s);   // 2.0.1 공부 3단계: 시험 기간
    sanitizeBt(d, s);   // 2.0.1 공부 4단계: 숲속 대결
    sanitizePs(d, s);   // 2.1.3 숲속 패스
    sanitizeGd(d, s);   // 2.2.0 학교 텃밭
    sanitizeBx(d, s);   // 2.2.0 숲속 생물 탐사
    sanitizeCg(d, s);   // 2.2.0 동아리 대항전
    s.wx = typeof d.wx === 'string' ? d.wx.slice(0, 10) : '';   // 2.1.3 날씨 알림 본 날
    s.wxOff = d.wxOff ? 1 : 0;   // 보안 보강 판(2026-11-06 woodani): 날씨 칩을 눌러 비, 눈, 안개 효과 끄기(날씨 자체와 보너스는 그대로)
    { const P = d.pl && typeof d.pl === 'object' ? d.pl : {}, got = Math.max(0, Math.min(PL.list.length, Math.floor(Number(P.got) || 0))); s.pl = { got, read: Math.max(0, Math.min(got, Math.floor(Number(P.read) || 0))), wk: Math.floor(Number(P.wk)) || -1 }; }   // 2.1.3 학부모 편지
    { const R = d.rs && typeof d.rs === 'object' ? d.rs : {}, n = (v, hi) => Math.max(0, Math.min(hi, Math.floor(Number(v) || 0))); s.rs = { n: n(R.n, 1e4), p: n(R.p, 1e9), pos: n(R.pos, 1e4), king: n(R.king, 1e4) }; }   // 2.1.3 랭킹 시즌
    { const L = d.lk && typeof d.lk === 'object' ? d.lk : {}; s.lk = { on: L.on === true, at: Math.max(0, Math.min(Date.now() + 864e5, Number(L.at) || 0)), h: '', pub: L.pub === true, del: L.del === true }; }   // 2.1.3 내 학교 보여 주기(처음에는 꺼짐)
    { const R = d.rare && typeof d.rare === 'object' ? d.rare : {}; s.rare = { got: [...new Set((Array.isArray(R.got) ? R.got : []).filter(sp => RARE.list.some(x => x.sp === sp)))], miss: Math.min(RARE.pity, Math.max(0, Math.floor(Number(R.miss) || 0))) }; }   // 2.1.3 반짝 친구
    // 2.1.0 공사와 시간 단축권: 예전 저장에는 없으니 공사 없음, 단축권 0장. 지금 레벨 다음 칸이 아닌 공사는 버려요
    if (d.bd && typeof d.bd === 'object') for (const k of Object.keys(FAC)) {
      const b = d.bd[k];
      if (b && typeof b === 'object' && Math.floor(numFb(b.L, 0, 0, SAVE_CAP.count)) === s.f[k] + 1 && s.f[k] + 1 <= SAVE_CAP.lv) {
        const st = numFb(b.s, 0, 0), e = numFb(b.e, 0, 0);
        if (e > 0 && e - st <= 30 * 86400000) s.bd[k] = { L: s.f[k] + 1, s: Math.min(st, e), e };
      }
    }
    if (d.tk && typeof d.tk === 'object') for (const k of Object.keys(s.tk)) s.tk[k] = Math.min(SAVE_CAP.count, Math.floor(numFb(d.tk[k], 0, 0)));
    if (d.tkd && typeof d.tkd === 'object') { s.tkd.day = typeof d.tkd.day === 'string' ? d.tkd.day.slice(0, 10) : ''; s.tkd.pz = Math.min(TKE.perDay, Math.floor(numFb(d.tkd.pz, 0, 0))); s.tkd.mg = Math.min(TKE.perDay, Math.floor(numFb(d.tkd.mg, 0, 0))); }   // 2.3.0.1
    if (d.tka && typeof d.tka === 'object') { s.tka.day = typeof d.tka.day === 'string' ? d.tka.day.slice(0, 10) : ''; s.tka.n = Math.min(TKAD.perDay, Math.floor(numFb(d.tka.n, 0, 0))); }
    if (d.pz && typeof d.pz === 'object') {
      s.pz.day = typeof d.pz.day === 'string' ? d.pz.day.slice(0, 10) : '';
      s.pz.n = Math.floor(numFb(d.pz.n, 0, 0, SAVE_CAP.count)); s.pz.adN = Math.floor(numFb(d.pz.adN, 0, 0, SAVE_CAP.count));
      s.pz.best = Math.min(1e9, Math.floor(numFb(d.pz.best, 0, 0)));
      s.pz.hand = typeof d.pz.hand === 'string' ? d.pz.hand.slice(0, 10) : '';   // 2.3.1 소탕
      s.pz.tb = d.pz.tb === undefined ? s.pz.best : Math.min(1e9, Math.floor(numFb(d.pz.tb, 0, 0)));   // 3.0.0 옛 저장은 업데이트한 날만 예전처럼 최고 점수로
      s.pz.cur = pzSanitize(d.pz.cur);
    }
    // 게임 시계: 망가진 값으로 영영 멈추지 않게 기기 시간 + 1년까지만 받아요
    s.clk.last = timeSrc() ? numFb(d.clk && d.clk.last, 0, 0) : Math.min(numFb(d.clk && d.clk.last, 0, 0), Date.now() + 366 * 86400000);   // 4.0.1 (3.3.2 분석 H3): 서버 시간을 받는 판은 기기 시계로 깎지 않아요. 기기 날짜를 1년 넘게 과거로 돌려 다시 켜면 게임 날짜가 뒤로 가서 하루 제한이 풀렸어요. 앞서간 시계는 서버 시간이 바로잡아요
    // 2.0.0 보안 점검: 서버 시간을 기다리던 자리 비움(from은 저장 시각보다 늦을 수 없어요, skip은 하루까지)
    if (d.away && typeof d.away === 'object') { s.away.from = Math.min(numFb(d.away.from, 0, 0), s.savedAt || 0); s.away.skip = Math.min(numFb(d.away.skip, 0, 0), 86400000); }
    return s;
  }
  function sanitizeQ(q) {
    if (!q || typeof q !== 'object' || !q.init) return null;
    const out = freshQ();
    out.init = true;
    out.m = mainIndexFromSave(q);
    out.mb = numFb(q.mb, 0, 0);
    out.md = Math.floor(numFb(q.md, 0, out.m));   // 2.0.0 보안 점검(1-7): 끝낸 메인 퀘스트 수. 옛 저장은 지금 번호로 시작해요
    out.lat = typeof q.lat === 'string' ? q.lat.slice(0, 12) : '';
    out.seen = Math.min(out.m, Math.floor(typeof q.seen === 'number' && isFinite(q.seen) ? q.seen : -1));
    out.gen = Math.floor(numFb(q.gen, 0, 0, SAVE_CAP.count));
    out.subDone = Math.floor(numFb(q.subDone, 0, 0, SAVE_CAP.count));
    out.done = Array.isArray(q.done) ? q.done.filter(x => typeof x === 'string' && x.length < 12).slice(0, 100) : [];
    out.subs = (Array.isArray(q.subs) ? q.subs : [])
      .filter(x => x && typeof x.id === 'string' && WHO[x.who] && Q_TYPES.includes(x.t) &&
        (x.t !== 'fac' || FAC[x.k]) && (x.t !== 'tea' || TEA[x.k]) && typeof x.n === 'number' && isFinite(x.n) && x.n > 0)
      .slice(0, 3)
      .map(x => ({ id: x.id.slice(0, 12), who: x.who, t: x.t, k: x.k || null, n: x.n, r: numFb(x.r, 0, 0), b: numFb(x.b, 0, 0),
        nw: !!x.nw, say: typeof x.say === 'string' ? x.say.slice(0, 200) : '' }));
    return out;
  }
  function mainIndexFromSave(q) {
    const idx = id => MAIN.findIndex(m => m.id === id);
    // 7장을 학년마다 나누면서 빠진 퀘스트: '6학년 되기'(e6)는 새 6학년 장의 첫 퀘스트로 이어요
    const MOVED = { e6: 'e15' };
    if (typeof q.mid === 'string' && MOVED[q.mid]) return idx(MOVED[q.mid]);
    // 2.2.1 3장 '오늘의 급식'(gd2)은 4장 gd4로 옮겼어요. 그 자리였으면 3장 '텃밭에 작물 심기'(gd1) 바로 다음부터 이어가요(이미 지은 건물 레벨은 바로 완료로 보여요)
    if (q.mid === 'gd2' || q.mid === 'end:gd2') return idx('gd1') + 1;
    if (typeof q.mid === 'string' && q.mid === 'end:e6') return idx('e15');
    if (typeof q.mid === 'string' && q.mid) {
      if (q.mid.startsWith('end:')) { const i = idx(q.mid.slice(4)); return i >= 0 ? i + 1 : MAIN.length; }
      const i = idx(q.mid);
      if (i >= 0) return i;
    }
    // v3 저장: 예전 번호 앞의 퀘스트는 모두 마친 것으로 보고, 새 순서에서 아직 안 한 첫 퀘스트부터 이어가요
    const done = new Set(LEGACY_IDS.slice(0, Math.floor(numFb(q.m, 0, 0, SAVE_CAP.count))));
    const i = MAIN.findIndex(m => !done.has(m.id));
    return i >= 0 ? i : MAIN.length;
  }
  function syncMid() {
    const cm = MAIN[S.q.m];
    S.q.mid = cm ? cm.id : 'end:' + MAIN[MAIN.length - 1].id;
  }
  function load() {
    let raw = null;
    try { raw = localStorage.getItem(SAVE_KEY); return raw ? sanitize(JSON.parse(raw)) : null; }
    catch (e) {
      // 1.5.4: 읽지 못한 저장을 새 학교로 조용히 덮어쓰기 전에 따로 남겨 둬요 (설정 > 정보에서 알려요)
      if (raw) try { localStorage.setItem(SAVE_KEY + '-broken', raw); rt.brokenSave = true; } catch (er) { /* 저장소가 막혀 있어요 */ }
      return null;
    }
  }
  function save(at) {
    if (!S || rt.adopting || rt.uniPrev) return;   // 다른 학교로 바꾸며 다시 여는 중에는 지금 학교를 저장하지 않아요. 4.0.0 대학교 미리 보기 동안도 저장하지 않아요
    S.savedAt = at || (rt.paused ? rt.closedAt : gameNow());   // 2.0.0 보안 점검(2-5): 기기 시계 대신 게임 시계
    if (rt.awayWait) S.away = { from: rt.awayWait.from, skip: awaySkip(rt.awayWait) };   // 서버 시간을 아직 못 받았으면 다음에 이어서 계산해요
    syncMid();
    const json = JSON.stringify(S);
    try { localStorage.setItem(SAVE_KEY, json); } catch (e) { /* 저장소가 막혀 있어도 게임은 계속 */ }
    if (AIT) AIT.storage.setItem(SAVE_KEY, json).catch(() => {});   // 토스 앱 저장소 (앱을 지워도 남는 건 아니에요)
    Cloud.dirty = true;   // 서버에는 조금씩 모았다가 올려요
  }

