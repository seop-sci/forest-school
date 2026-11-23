  /* ---------- 2.0.0 학생 명부와 동아리 ----------
     학생 수(수업료 계산)는 그대로 두고, 그 가운데 얼굴이 되는 대표 학생 12명을 명부에 따로 적어요(S.roster).
     중학교부터 명부가 생기고 동아리 다섯 곳(2.0.1부터 수학부)에 3명씩 나눠요. 졸업식(학교급 올리기) 때 명부 학생은 졸업 사진(S.snap)에 남고 새 친구들이 입학해요.
     능력치는 과학, 체육, 국어, 미술, 수학(2.0.1에 이름을 바꾸고 수학을 더함. 속으로 1~100, 화면에는 별 1~5개). 동아리 보너스는 부원 셋의 맞는 능력치 별 하나에 2%(최대 30%), 미술부 할인은 절반.
     능력치가 자라는 법: 그 동아리 건물을 한 레벨 올릴 때마다 부원 +1, 한 주(게임 시계) 내내 같은 동아리였으면 +5와 건물 레벨 10마다 +1, 발표회 +5 */
  const ROSTER_N = 15, ROSTER_MAX = 18, ROSTER_TIER = 2;   // 처음 15명(동아리 5곳 × 3자리), 전학 온 친구가 더해지면 18명까지
  const ABIL = ['과학', '체육', '국어', '미술', '수학'];   // 공부: 저장 배열 순서는 그대로, 이름만 체육과 국어로, 수학을 다섯째로
  const AB_KEY = ['sci', 'pe', 'kor', 'art', 'math'];   // 능력 번호 → 과목 키
  const CLUBS = [
    { id: 'sci', name: '과학부', ab: 0, fac: 'science', img: 'club_science', em: '🔬', eff: p => `수업료 +${p}%` },
    { id: 'spo', name: '운동부', ab: 1, fac: 'playground', img: 'club_sports', em: '⚽', eff: p => `학교 행사 보상 +${p}%` },
    { id: 'rea', name: '독서부', ab: 2, fac: 'library', img: 'club_reading', em: '📚', eff: p => `수업료 +${p}%` },
    { id: 'art', name: '미술부', ab: 3, fac: 'classroom', img: 'club_art', em: '🎨', eff: p => `장식 값 -${p}%` },
    { id: 'mat', name: '수학부', ab: 4, fac: 'classroom', img: 'league_math', em: '➗', eff: p => `수업료 +${p}%` }   // 공부: 수학부
  ];
  // showDays: 발표회 주기(게임 시계 날짜). 설계안은 일주일이지만 중학교 한 해가 하루 안팎이라 균형 제안서에서 하루를 제안했어요. woodani 확정 전이에요
  const CLUB = { seats: 3, per: 2, max: 30, grow: 5, growLv: 10, up: 1, show: 4, showMin: 30, showDays: 1, weekend: 2 };   // 발표회는 월~금 하루 한 번, 그 주에 못 연 날이 있으면 주말에 2번까지 보충
  /* ---------- 공부: 과목 5개(국어, 수학, 과학, 미술, 체육)의 학교 학력 레벨 ----------
     공부(퍼즐=수학, 합치기=미술, 뒤에 책 읽기=국어, 과학 실험=과학, 숲속 대결=체육)를 하면 그 과목 학습 경험치(XP)가 바로 들어와요
     숲의 정수로 문제집을 사면 +50(과목마다 하루 2권). 다음 레벨까지 20 + 5n, 상한은 학교급마다(유 10, 초 20, 중 30, 고 40, 대 50, 원 60)
     효과: 수업료 레벨 합 × 0.1%(acMult), 평판 10레벨마다 +1(acRepOf), 새 명부 학생의 시작 능력 바탕(rosterKid). 숫자는 "균형 제안서 (공부 탭)" */
  const AC = { keys: ['kor', 'math', 'sci', 'art', 'pe'], name: { kor: '국어', math: '수학', sci: '과학', art: '미술', pe: '체육' },
    cap: [10, 20, 30, 40, 50, 60], need: n => 25 + 2 * n, pzPer: 100, pzMax: 12, mgPer: 1, mgMax: 20, mgE: 6, mgDay: 100,   // 학력과 능력치 균형: 과목마다 하루 XP를 비슷하게(균형 제안서 학력과 능력치 1절)
    book: { ess: 10, xp: 50, perDay: 2, perLv: 1, cap: 30 }, tuition: 0.001, repPer: 10 };   // 문제집 값은 정수 10 + 그 과목 레벨, 과목마다 하루 2권(조정안 5, 예전 1권)
  const AC_GAME = { kor: '책 읽기', math: '숲속 퍼즐', sci: '과학 탐구 실험', art: '숲속 합치기', pe: '숲속 대결' };
  const freshAc = () => { const o = { bk: { day: '', n: {} }, st: { xp: 0, bk: 0 } }; for (const k of AC.keys) { o[k] = { lv: 1, xp: 0 }; o.bk.n[k] = 0; } return o; };
  const acCapOf = tier => AC.cap[Math.max(0, Math.min(AC.cap.length - 1, tier))];
  const acCap = () => acCapOf(S.tier);
  const acLv = k => (S && S.ac && S.ac[k]) ? S.ac[k].lv : 1;
  const acSumOf = s => s && s.ac ? AC.keys.reduce((n, k) => n + ((s.ac[k] && s.ac[k].lv) || 1), 0) : 0;
  const acSum = () => acSumOf(S);
  const acMult = () => 1 + acSum() * AC.tuition;
  const acRepOf = s => Math.floor(acSumOf(s) / AC.repPer);
  // 상한까지 레벨업. 상한에 닿은 뒤 받은 XP는 모아 뒀다가 학교급이 오르면 풀려요
  function acSettle(k, cap) {
    const a = S.ac[k]; cap = cap === undefined ? acCap() : cap; let up = 0;
    while (a.lv < cap && a.xp >= AC.need(a.lv)) { a.xp -= AC.need(a.lv); a.lv += 1; up += 1; }
    return up;
  }
  const acAll = () => AC.keys.reduce((n, k) => n + acSettle(k), 0);
  function acGain(k, v) {
    if (!S.ac || !S.ac[k] || !(v > 0)) return 0;
    v = Math.floor(v * (1 + rxPct('study') / 100)); S.ac[k].xp += v; S.ac.st.xp += v;   // 학력 연구
    const up = acSettle(k);
    if (up) { const lv = S.ac[k].lv, capped = lv >= acCap(); setTimeout(() => toast(`${AC.name[k]} Lv.${lv}!${capped ? ` ${tierInfo().name}에서는 여기까지예요` : ''}`), 500); }
    checkQuests(true); return v;
  }
  function acBkDay() { const t = gameToday(); if (dayRoll(S.ac.bk, t)) { for (const k of AC.keys) S.ac.bk.n[k] = 0; } }
  const bookCost = k => Math.min(AC.book.cap, AC.book.ess + AC.book.perLv * acLv(k));   // 문제집 값은 레벨을 따라 오르고 30에서 멈춰요(5.3.3 woodani A안)
  const acBkLeft = k => { acBkDay(); return Math.max(0, AC.book.perDay - (S.ac.bk.n[k] || 0)); };
  // 문제집 남은 권 모두 사기: 한 권씩 살 때와 같은 값과 차례로 사고(레벨이 오르면 값도 따라 올라요), 정수가 모자라면 살 수 있는 만큼만 사요
  function acBuyBookAll(k) {
    if (!AC.name[k] || rt.batch) return 0;
    const e0 = S.ess, x0 = S.ac.st.bk; let n = 0;
    rt.batch = { items: [], n: 0 };
    try { while (acBkLeft(k) > 0 && S.ess >= bookCost(k) && n < 50 && acBuyBook(k)) n += 1; } finally { rt.batch = null; }
    if (!n) { acBuyBook(k); return 0; }   // 한 권도 못 사면 까닭을 알려 줘요
    sfx('quest'); buzz(14);
    toast(`${AC.name[k]} 문제집 ${S.ac.st.bk - x0}권을 풀었어요! ${AC.name[k]} XP +${n * AC.book.xp}\n숲의 정수 ${e0 - S.ess}개를 썼어요`);
    return n;
  }
  function acBuyBook(k) {
    if (!AC.name[k]) return false;
    if (acBkLeft(k) <= 0) { toast(`${AC.name[k]} 문제집은 하루 ${AC.book.perDay}권까지예요. 내일 다시 살 수 있어요`); return false; }
    const cost = bookCost(k);
    if (S.ess < cost) { toast(essShort(cost - S.ess)); return false; }
    S.ess -= cost; S.st.esSpent = (S.st.esSpent || 0) + cost;
    S.ac.bk.n[k] = (S.ac.bk.n[k] || 0) + 1; S.ac.st.bk += 1;
    acGain(k, AC.book.xp);
    sfx('quest'); buzz(14);
    toast(`${AC.name[k]} 문제집을 풀었어요! ${AC.name[k]} XP +${AC.book.xp}`);
    save(); renderEss(); renderMini(); renderHUD(); checkQuests();
    if (rt.tab === 'ess') renderEssShop();   // 정수 상점에서 사면 남은 권수가 바로 줄게
    return true;
  }
  // 공부 탭 위쪽 과목 5줄: 이름, Lv., 진행 막대, 문제집 단추
  function renderAc() {
    const box = $('#acList'); if (!box || !S.ac) return;
    acBkDay();
    const cap = acCap(), ic = ESS_ICON();
    box.innerHTML = `<div class="ac-head"><b>학교 학력 ${acSum()}</b><small>수업료 +${(acSum() * AC.tuition * 100).toFixed(1)}%, 평판 +${acRepOf(S)}</small></div>` +
      AC.keys.map(k => { const a = S.ac[k], need = AC.need(a.lv), capped = a.lv >= cap, left = acBkLeft(k), poor = S.ess < bookCost(k);
        return `<div class="ac-row" data-ac="${k}" role="button" tabindex="0" aria-label="${AC.name[k]} XP를 얻는 곳 보기"><span class="ac-nm">${AC.name[k]}</span><span class="ac-lv">Lv.${a.lv}</span>` +
          `<span class="ac-bar${capped ? ' cap' : ''}" role="progressbar" aria-label="${AC.name[k]} Lv.${a.lv}" aria-valuenow="${capped ? need : Math.min(need, a.xp)}" aria-valuemax="${need}"><i style="width:${capped ? 100 : Math.round(100 * Math.min(1, a.xp / need))}%"></i></span>` +
          `<button class="ac-bk${left > 0 ? '' : ' off'}" type="button" data-book="${k}" aria-label="${AC.name[k]} 문제집 구매, 오늘 ${left}권 남음">${left > 0 ? '문제집 구매' : '내일 또'}</button></div>`; }).join('') +
      `<div class="ac-note">${cap <= acLv('kor') && AC.keys.every(k => acLv(k) >= cap) ? `${tierInfo().name}에서는 Lv.${cap}까지예요. 다음 학교급에서 더 배워요` : `문제집은 과목마다 하루 ${AC.book.perDay}권, 한 권에 XP +${AC.book.xp}이에요. ${tierInfo().name}에서는 Lv.${cap}까지 올라요`}</div>`;
  }
  // 과목 줄을 누르면 그 과목 XP를 얻는 곳을 말풍선으로 잠깐 보여 줘요. 아직 열리지 않은 곳은 흐리게
  const AC_SRC = {
    kor: [['책 읽기(도서관)', 0], ['고니 선생님 연수', 1], ['비 오는 날 책 읽기 보너스', 1]],
    math: [['숲속 퍼즐', 0], ['동아리 수학부', 2]],
    sci: [['과학 탐구 실험(과학실)', 1], ['숲속 생물 탐사', 1]],
    art: [['숲속 합치기', 0], ['공작 선생님 연수', 1]],
    pe: [['숲속 대결', () => btOpen(), '초등 3학년부터'], ['운동회와 체육대회', () => S.tier >= 2 || (S.tier === 1 && S.tg >= 3), '초등 4학년부터']]
  };
  function acTip(k, row) {
    const box = $('#acList'), old = box.querySelector('.ac-tip'); if (old) { const same = old.dataset.k === k; old.remove(); clearTimeout(rt.acTipT); if (same) return; }
    const T = ['유치원부터', '초등학교부터', '중학교부터'];
    const all = AC_SRC[k].concat([['문제집(숲의 정수)', 0], ['시험 기간 자율학습(도서관)', 1]]);
    const li = all.map(([t, tier, lab]) => { const on = typeof tier === 'function' ? tier() : S.tier >= tier; return `<li class="${on ? '' : 'off'}">${t}${on ? '' : ` <small>${lab || T[tier]}</small>`}</li>`; }).join('');
    const d = document.createElement('div'); d.className = 'ac-tip'; d.dataset.k = k;
    d.innerHTML = `<b>${AC.name[k]} XP는 여기서 얻어요</b><ul>${li}</ul>`;
    box.appendChild(d);
    const br = box.getBoundingClientRect(), rr = row.getBoundingClientRect();
    d.style.top = Math.max(0, rr.top - br.top - d.offsetHeight - 6) + 'px';
    sfx('tap');
    rt.acTipT = setTimeout(() => d.remove(), 3500);
  }
  // 문제집 구매 확인창: 값, 효과, 오늘 남은 권수, 가진 숲의 정수
  function openBook(k) {
    if (!AC.name[k] || rt.paused || rt.modalOpen) return;
    rt.bookK = k; renderBook(); openModal($('#mBook'));
  }
  function renderBook() {
    const k = rt.bookK; if (!k || !$('#mBook')) return;
    const left = acBkLeft(k), need = bookCost(k), have = S.ess, ic = ESS_ICON();
    $('#bkTitle').textContent = `${AC.name[k]} 문제집`;
    $('#bkLead').textContent = `숲의 정수 ${need}개로 한 권을 사면 ${AC.name[k]} XP +${AC.book.xp}을 바로 받아요.`;
    $('#bkLeft').innerHTML = `<span>오늘 남은 문제집</span><b>${left} / ${AC.book.perDay}권</b>`;
    $('#bkHave').innerHTML = `<span>가진 숲의 정수</span><b>${ic}${fmt(have)}개</b>`;
    const why = left <= 0 ? `${AC.name[k]} 문제집은 오늘 다 샀어요. 내일 다시 살 수 있어요.` : have < need ? `숲의 정수가 ${need - have}개 모자라요. 퍼즐이나 합치기로 모을 수 있어요.` : '';
    $('#bkWhy').textContent = why; $('#bkWhy').hidden = !why;
    $('#bkBuy').setAttribute('aria-disabled', why ? 'true' : 'false');
    $('#bkBuy').innerHTML = `${ic}${need} 구매하기`;
    { const a = $('#bkAll'); if (a) { a.hidden = !!why || left < 2 || have < need * 2; a.textContent = `남은 ${left}권 모두 사기 (정수가 되는 만큼)`; } }
  }
  // 옛 저장: 퍼즐 판 수와 합치기 주문 수로 수학과 미술 XP를 한 번 환산해요(테스트판 플레이어)
  function sanitizeAc(d, s) {
    s.ac = freshAc();
    const cap = acCapOf(s.tier);
    if (d.ac && typeof d.ac === 'object') {
      for (const k of AC.keys) { const a = d.ac[k] && typeof d.ac[k] === 'object' ? d.ac[k] : {}; s.ac[k].lv = Math.floor(numIn(a.lv, 1, 60)); s.ac[k].xp = Math.floor(numIn(a.xp, 0, 1e7)); }
      const bk = d.ac.bk && typeof d.ac.bk === 'object' ? d.ac.bk : {};
      s.ac.bk.day = typeof bk.day === 'string' ? bk.day.slice(0, 10) : '';
      for (const k of AC.keys) s.ac.bk.n[k] = Math.floor(numIn(bk.n && bk.n[k], 0, AC.book.perDay));
      const st = d.ac.st && typeof d.ac.st === 'object' ? d.ac.st : {};
      s.ac.st.xp = Math.floor(numIn(st.xp, 0, 1e9)); s.ac.st.bk = Math.floor(numIn(st.bk, 0, 1e6));
    } else {
      s.ac.math.xp = 8 * Math.floor(numIn(d.st && d.st.pz, 0, 1e5));
      s.ac.art.xp = 8 * Math.floor(numIn(d.mg && d.mg.st && d.mg.st.orders, 0, 1e5));
    }
    // 레벨이 상한을 넘는 저장은 상한에서 멈추고, 모아 둔 XP로 올릴 수 있는 만큼 올려요
    for (const k of AC.keys) { const a = s.ac[k]; if (a.lv > cap) a.lv = cap; while (a.lv < cap && a.xp >= AC.need(a.lv)) { a.xp -= AC.need(a.lv); a.lv += 1; } }
  }
  // 동물마다 잘하는 능력(0 과학, 1 체육, 2 국어, 3 미술, 4 수학)
  const SP_ABIL = { rabbit: 1, fox: 0, raccoon: 0, chick: 3, bear: 1, cat: 2, dog: 1, penguin: 0, panda: 2, koala: 2, otter: 3,
    hamster: 1, duck: 3, turtle: 2, mole: 0, frog: 1, waterdeer: 3, redpanda: 4, capybara: 2, kangaroo: 1, meerkat: 4, sloth: 3, chinchilla: 0, lemur: 0, armadillo: 2, quokka: 1 };   // 여우원숭이 과학, 아르마딜로 국어, 쿼카 체육(제안). 미어캣 수학, 나무늘보 미술, 친칠라 과학(제안). 레서판다 수학, 카피바라 국어, 캥거루 체육
  const KID_NAMES = ['도토리', '밤송이', '솔방울', '이슬', '새싹', '단풍', '보리', '콩알', '버찌', '다래', '머루', '호두', '달래', '나리', '송이', '들꽃',
    '구름', '바람', '햇살', '별님', '조약돌', '방울', '보라', '감자', '고구마', '앵두', '모과', '자두', '토실', '꼬물', '동글', '말랑'];
  const star = v => Math.max(1, Math.min(5, Math.ceil(v / 20)));
  const starTxt = n => `<span class="st-on">${'★'.repeat(n)}</span><span class="st-off">${'★'.repeat(5 - n)}</span>`;   // 채운 별과 빈 별(연하게)
  const rosterOn = () => !!S && S.tier >= ROSTER_TIER;
  const freshRoster = () => ({ list: [], wk: -1, gen: 0, v: 2 });   // v: 능력치 균형 판(2부터 새 숫자)
  const freshClub = () => ({ day: '', n: 0, shown: [0, 0, 0, 0, 0], last: -1, wk: -1, wd: 0, we: 0 });   // wk: 이번 주 월요일(날 번호), wd: 이번 주 월~금에 연 횟수, we: 주말에 연 횟수
  // 새 명부: 만난 친구들 가운데서 겹치지 않게 12명(모자라면 겹쳐요). 잘하는 능력 하나가 도드라지고, 가끔 둘째도 조금
  function rosterKid(sp, taken) {
    // 공부: 시작 능력의 바탕은 그 과목의 학교 학력
    const a = AB_KEY.map(k => 8 + Math.floor(acLv(k) / 3) + Math.floor(Math.random() * 5));   // 시작값을 낮춰서 중학교 내내 키워요(입학 때 잘하는 과목 ★2~3)
    const main = SP_ABIL[sp] !== undefined ? SP_ABIL[sp] : Math.floor(Math.random() * ABIL.length);
    a[main] += 20 + Math.floor(Math.random() * 13);
    if (Math.random() < 0.4) { const o = (main + 1 + Math.floor(Math.random() * (ABIL.length - 1))) % ABIL.length; a[o] += 6; }
    const free = KID_NAMES.filter(n => !taken.includes(n)), nm = (free.length ? free : KID_NAMES)[Math.floor(Math.random() * (free.length || KID_NAMES.length))];
    taken.push(nm);
    const out = { sp, nm, a: a.map(v => Math.min(100, v)), c: -1, cw: gameWeek() };
    if (rareGot(sp) && Math.random() < RARE.roster) out.r = true;   // 반짝 친구 모습(능력치는 같아요)
    return out;
  }
  // must: 꼭 넣을 친구(방금 전학 온 친구)
  function rosterMake(must) {
    const met = speciesList().filter(k => k !== must), pick = must ? [must] : [];
    for (let i = met.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [met[i], met[j]] = [met[j], met[i]]; }
    for (let i = 0; pick.length < ROSTER_N; i++) pick.push(met[i % met.length]);
    const taken = [], out = pick.map(sp => rosterKid(sp, taken));
    out.forEach(k => tamShard(k.sp, 1));   // 새 학년에 같은 동물 친구를 또 만나면 그 대원 별 조각 하나
    return out;
  }
  // 학년 중간에 전학 온 친구는 명부 끝에 더해요(동아리 밖에서 시작)
  function rosterAdd(sp) {
    if (!rosterOn() || !S.roster.list.length || S.roster.list.length >= ROSTER_MAX) return null;
    const s = rosterKid(sp, S.roster.list.map(x => x.nm)); S.roster.list.push(s); return s;
  }
  function rosterEnsure(must) {
    if (!rosterOn() || S.roster.list.length) return false;
    S.roster.list = rosterMake(must); S.roster.gen += 1; S.roster.wk = gameWeek();
    return true;   // 동아리는 비어 있어요. 메인 퀘스트 '첫 동아리 나누기'에서 나눠요(자동 추천 단추)
  }
  const clubMembers = c => S.roster.list.filter(s => s.c === c);
  const clubStars = c => clubMembers(c).reduce((n, s) => n + star(s.a[CLUBS[c].ab]), 0);
  const clubPct = c => rosterOn() ? Math.min(CLUB.max, CLUB.per * clubStars(c)) * (elClub() === c ? 2 : 1) : 0;   // 반장이 속한 동아리는 두 배
  const clubShow = c => c === 3 ? Math.floor(clubPct(3) / 2) : clubPct(c);   // 화면에 보이는 효과 숫자(미술부는 할인이라 절반)
  const clubSum = () => CLUBS.reduce((n, _, c) => n + clubShow(c), 0);
  const clubTuitionMult = () => 1 + (clubPct(0) + clubPct(2) + clubPct(4)) / 100;   // 수학부도 수업료
  const clubFestMult = () => 1 + clubPct(1) / 100;
  const clubDecoOff = () => clubShow(3);
  // 자동 추천: 동아리마다 3명씩, 맞는 능력치 별의 합이 가장 크게(12명이라 모든 경우를 셈으로 따져요)
  function clubAuto(quiet) {
    const L = S.roster.list, n = L.length; if (!n) return false;
    const seats = CLUBS.map(() => Math.min(CLUB.seats, Math.ceil(n / CLUBS.length)));
    const memo = new Map();
    const key = (i, cnt) => i + ':' + cnt.join(',');
    const best = (i, cnt) => {
      if (i >= n) return 0;
      const k = key(i, cnt); if (memo.has(k)) return memo.get(k);
      let v = -1;
      if (n - i > cnt.reduce((a, x, c) => a + seats[c] - x, 0)) v = best(i + 1, cnt);   // 자리가 모자라면 동아리 밖
      for (let c = 0; c < CLUBS.length; c++) if (cnt[c] < seats[c]) { cnt[c]++; v = Math.max(v, star(L[i].a[CLUBS[c].ab]) * 100 + L[i].a[CLUBS[c].ab] / 100 + best(i + 1, cnt)); cnt[c]--; }
      memo.set(k, v); return v;
    };
    const cnt = CLUBS.map(() => 0), out = [];
    best(0, cnt);
    for (let i = 0; i < n; i++) {
      let pickC = -1, pv = -Infinity;
      const here = best(i, cnt);
      for (let c = 0; c < CLUBS.length; c++) if (cnt[c] < seats[c]) {
        cnt[c]++; const v = star(L[i].a[CLUBS[c].ab]) * 100 + L[i].a[CLUBS[c].ab] / 100 + best(i + 1, cnt); cnt[c]--;
        if (v > pv + 1e-9) { pv = v; pickC = c; }
      }
      if (pickC >= 0 && Math.abs(pv - here) < 1e-6) { cnt[pickC]++; out.push(pickC); } else out.push(-1);
    }
    const wk = gameWeek();
    L.forEach((s, i) => { if (s.c !== out[i]) { s.c = out[i]; s.cw = wk; } });
    if (!quiet) { save(); renderClub(); }
    return true;
  }
  // 동아리 바꾸기: 언제든 공짜. 바꾼 학생은 이번 주 능력치 오름을 처음부터 다시 세요
  function clubSet(i, c) {
    const s = S.roster.list[i]; if (!s) return false;
    c = c >= 0 && c < CLUBS.length ? c : -1;
    if (s.c === c) return true;
    if (c >= 0 && clubMembers(c).length >= CLUB.seats) {   // 자리가 차 있으면 가장 별이 적은 부원과 자리를 바꿔요
      const out = clubMembers(c).sort((x, y) => x.a[CLUBS[c].ab] - y.a[CLUBS[c].ab])[0];
      out.c = s.c; out.cw = gameWeek();
    }
    s.c = c; s.cw = gameWeek();
    save();
    return true;
  }
  const abUp = (s, ab, v) => { s.a[ab] = Math.min(100, s.a[ab] + v); };
  // 건물을 한 레벨 올리면 그 건물 동아리 부원의 능력치 +1
  function clubFacUp(k) {
    if (!rosterOn()) return;
    CLUBS.forEach((C, c) => { if (C.fac === k) clubMembers(c).forEach(s => abUp(s, C.ab, CLUB.up)); });
  }
  // 한 주가 지나면(게임 시계) 그 주 내내 같은 동아리였던 부원이 자라요. 여러 주가 지났어도 8주까지만 쳐요
  function clubWeekTick() {
    if (!rosterOn() || !S.roster.list.length) return false;
    const now = gameWeek(); if (S.roster.wk < 0) S.roster.wk = now;
    if (now <= S.roster.wk) return false;
    for (let w = Math.max(S.roster.wk, now - 8); w < now; w++) {
      for (const s of S.roster.list) if (s.c >= 0 && s.cw < w) { const C = CLUBS[s.c]; abUp(s, C.ab, CLUB.grow + Math.floor((S.f[C.fac] || 0) / CLUB.growLv)); }
    }
    S.roster.wk = now;
    save();
    return true;
  }
  // 발표회: 게임 시계 기준 CLUB.showDays일에 한 번. 무대에 선 동아리 부원 능력치 +5, 수업료 30분치
  const showDay = () => Math.floor((gameNow() + KST_MS) / 86400000);
  // 월~금에 하루 한 번. 그 주에 못 연 날이 있으면 토, 일에 모두 합쳐 2번까지(못 연 날 수까지) 보충해요. 날짜는 게임 시계(한국 시간)
  const showWd = d => (d + 3) % 7;   // 0 월요일 … 6 일요일 (1970-01-01이 목요일)
  function showOkOn(d) {
    if (S.club.last >= 0 && d < S.club.last + CLUB.showDays) return false;
    const wk = d - showWd(d), same = S.club.wk === wk, wd = same ? S.club.wd : 0, we = same ? S.club.we : 0;
    if (showWd(d) < 5) return true;
    return we < CLUB.weekend && wd + we < 5;
  }
  const showWait = () => { const d = showDay(); for (let i = 0; i < 8; i++) if (showOkOn(d + i)) return i; return 8; };
  const showWeekendNow = () => showWd(showDay()) >= 5;
  function showNote() {
    const w = showWait(), d = showDay();
    if (w > 0 && showQuestFree()) return '퀘스트: 아직 무대에 안 선 동아리는 오늘 바로 열 수 있어요';
    if (w <= 0) { if (!showWeekendNow()) return '오늘 발표회를 열 수 있어요'; const same = S.club.wk === d - showWd(d), left = Math.min(CLUB.weekend - (same ? S.club.we : 0), 5 - (same ? S.club.wd + S.club.we : 0)); return `오늘 보충 발표회를 열 수 있어요 (이번 주말 ${left}번)`; }
    if (w === 1) return showWd(d + 1) === 0 ? '월요일에 다시 발표회를 열 수 있어요' : '내일 다시 발표회를 열 수 있어요';
    return showWd(d + w) === 0 ? '월요일에 다시 발표회를 열 수 있어요' : `다음 발표회까지 ${w}일`;
  }
  const showReady = () => rosterOn() && showWait() <= 0;
  // 메인 퀘스트 '동아리 두 곳 발표회'(clubShown)를 하는 동안에는 아직 무대에 안 선 동아리는 오늘 이미 열었어도 바로 열 수 있어요(하루 기다림 없애기)
  //   c가 없으면 그런 동아리(부원이 있는)가 하나라도 있는지
  function showQuestFree(c) {
    if (!rosterOn() || !S.club) return false;
    const q = curMain(); if (!q || q.t !== 'clubShown' || mainReady()) return false;
    if (c === undefined) return S.club.shown.some((v, i) => !v && clubMembers(i).length > 0);
    return !!CLUBS[c] && !S.club.shown[c];
  }
  const showReadyC = c => showReady() || showQuestFree(c);
  const showPrize = () => Math.max(10, nice(rate() * 60 * CLUB.showMin));
  function clubShowGo(c) {
    if (!showReadyC(c) || !CLUBS[c]) return false;
    const mem = clubMembers(c); if (!mem.length) { toast(`${eun(CLUBS[c].name)} 아직 부원이 없어요`); return false; }
    const C = CLUBS[c], fvb = fvBonus('show'), v = showPrize() * (fvb ? 2 : 1);   // 축제 금요일: 발표회 보상 +100%
    mem.forEach(s => abUp(s, C.ab, CLUB.show));
    const d = showDay(), wk = d - showWd(d);
    if (S.club.wk !== wk) { S.club.wk = wk; S.club.wd = 0; S.club.we = 0; }
    if (showWd(d) < 5) S.club.wd += 1; else S.club.we += 1;
    S.club.last = d; S.club.n += 1; S.club.shown[c] = 1; S.st.shows = (S.st.shows || 0) + 1;
    cgShowAdd(c); if (cgOpen()) S.cg.st.s += 1;   // 대항전 발표회 점수
    S.budget += v; earn(v);
    addLeague(LP.festWin);
    save();
    showReward({ title: `${C.name} 발표회를 열었어요!`, sub: mem.map(s => s.nm).join(', ') + `의 ${ABIL[C.ab]} 능력치 +${CLUB.show}`, art: clubBadge(c, 72), items: [{ ic: 'acorn', t: `도토리 +${fmt(v)}${fvb ? ' (축제 +100%)' : ''}` }] });
    renderClub(); questChanged();
    return true;
  }
  /* ---------- 동아리 대항전 (프로젝트 문서 ' 설계안' 5절) ----------
     중학교부터 매주 월~일(게임 시계, 한국 시간) 한 주 리그. 우리 학교와 숲속 대결 학교 7곳이 동아리 다섯의 점수 합으로 겨뤄요
     우리 점수 = 동아리마다 (부원 능력치 별 × 10 + 연습 × 20 + 발표회 × 30). 연습은 하루 한 번 '모두 연습'(부원 능력치 +2)
     상대 학교의 한 주 점수는 주가 시작할 때 우리 학교 예상 점수에 맞춰 정해지고(1.22배 ~ 0.72배), 날마다 조금씩 올라요
     주가 끝나면 1등 황금 도토리 2와 우승 깃발(1, 3, 6번째 우승에 동, 은, 금), 2~3등 황금 1, 모두 수업료 30분치. 서버 랭킹은 쓰지 않아요 */
  const CG = { tier: 2, star: 10, prac: 20, show: 30, grow: 2, gold1: 2, gold23: 1, partMin: 30, flagAt: [1, 3, 6],
    f: [1.22, 1.12, 1.04, 0.97, 0.9, 0.82, 0.72], jitter: 0.04, practiceRate: 0.7, showGuess: 5 };
  const CG_FLAGS = [['cg_flag_b', '동메달 우승 깃발', 'flag_bronze'], ['cg_flag_s', '은메달 우승 깃발', 'flag_silver'], ['cg_flag_g', '금메달 우승 깃발', 'flag_gold']];
  const freshCg = () => ({ wk: -1, opp: [], prac: CLUBS.map(() => 0), show: CLUBS.map(() => 0), pd: '', res: null, wins: 0, pod: 0, st: { p: 0, n: 0, s: 0 } });   // s: 검토 5 대항전 중 발표회 수(cgShow 퀘스트)
  const cgOpen = () => !!S && !!S.cg && rosterOn() && S.tier >= CG.tier;
  const cgStarPts = () => CLUBS.reduce((n, _, c) => n + clubStars(c) * CG.star, 0);
  const cgClubPts = c => clubStars(c) * CG.star + (S.cg.prac[c] || 0) * CG.prac + (S.cg.show[c] || 0) * CG.show;
  const cgMy = () => CLUBS.reduce((n, _, c) => n + cgClubPts(c), 0);
  const cgDayIdx = () => showWd(showDay());   // 0 월요일 … 6 일요일
  const cgProg = () => (cgDayIdx() + 1) / 7;
  const cgOppNow = o => Math.round(o.f * cgProg());
  const cgPracToday = () => !!S.cg && S.cg.pd === gameToday();
  // 이번 주 순위표(지금 점수). 같은 점수면 우리 학교가 위
  function cgTable(final) {
    const rows = S.cg.opp.map(o => { const s = BT_SCH.find(x => x.k === o.k) || { name: '숲속 학교', k: o.k }; return { k: o.k, nm: s.name, pts: final ? o.f : cgOppNow(o) }; });
    rows.push({ me: true, nm: schoolTitle(), pts: cgMy() });
    return rows.sort((a, b) => b.pts - a.pts || (a.me ? -1 : b.me ? 1 : 0));
  }
  function cgNewWeek(wk) {
    const expect = cgStarPts() + CLUBS.length * 7 * CG.practiceRate * CG.prac + CG.showGuess * CG.show;
    const sch = BT_SCH.slice().sort(() => Math.random() - 0.5).slice(0, CG.f.length);
    S.cg.wk = wk; S.cg.prac = CLUBS.map(() => 0); S.cg.show = CLUBS.map(() => 0);
    S.cg.opp = sch.map((s, i) => ({ k: s.k, f: Math.max(10, Math.round(expect * CG.f[i] * (1 + (Math.random() * 2 - 1) * CG.jitter))) }));
  }
  // 주가 바뀌면 지난주를 셈하고 새 주를 열어요. 여러 주를 비웠어도 셈은 마지막 주 한 번만
  function cgSync(quiet) {
    if (!cgOpen()) return null;
    const wk = gameWeek();
    if (S.cg.wk === wk) return null;
    let res = null;
    if (S.cg.wk >= 0 && S.cg.opp.length) {
      const t = cgTable(true), rank = t.findIndex(r => r.me) + 1, my = cgMy(), items = [];
      const acorn = minAcorns(CG.partMin); S.budget += acorn; earn(acorn); items.push({ ic: 'acorn', t: `참가 도토리 +${fmt(acorn)}` });
      if (rank === 1) {
        S.cg.wins += 1; { const g = goldRich() ? 1 : CG.gold1; addGold(g); items.push({ ic: 'gold', t: `황금 도토리 +${g}` }); }   // 60개 뒤에는 우승 1개
        const fi = CG.flagAt.indexOf(S.cg.wins); if (fi >= 0) { S.deco.own[CG_FLAGS[fi][0]] = 1; items.push({ ic: IMG(CG_FLAGS[fi][2]) ? `<img src="${IMG(CG_FLAGS[fi][2])}" alt="" style="width:22px;height:22px;object-fit:contain">` : '🚩', t: `지도 장식 ${CG_FLAGS[fi][1]}` }); }
      } else if (rank <= 3) items.push(goldOr(CG.gold23));
      if (rank <= 3) S.cg.pod += 1;
      S.cg.st.n += 1;
      res = { wk: S.cg.wk, rank, my, top: t.slice(0, 3).map(r => r.nm), items };
      S.cg.res = { wk: S.cg.wk, rank, my };
    }
    cgNewWeek(wk);
    save();
    if (res && !quiet) {
      sfx('quest');
      showReward({ title: res.rank === 1 ? '동아리 대항전 우승!' : `동아리 대항전 ${res.rank}등`, sub: `지난주 우리 학교 ${fmt(res.my)}점. 1등 ${res.top[0]}`, art: IMG('league_ic') ? `<img src="${IMG('league_ic')}" alt="" style="width:72px;height:72px">` : '', items: res.items });
    }
    return res;
  }
  function cgPractice() {
    if (!cgOpen() || rt.paused) return false;
    cgSync();
    if (cgPracToday()) { toast('오늘 연습은 끝났어요. 내일 또 해요'); return false; }
    const cs = CLUBS.map((C, c) => c).filter(c => clubMembers(c).length);
    if (!cs.length) { toast('동아리에 부원을 먼저 나눠요. 자동 추천을 눌러 봐요'); return false; }
    for (const c of cs) { S.cg.prac[c] += 1; clubMembers(c).forEach(s => abUp(s, CLUBS[c].ab, CG.grow)); }
    S.cg.pd = gameToday(); S.cg.st.p += 1;
    sfx('quest'); toast(`${cs.length}개 동아리가 연습했어요! 대항전 +${cs.length * CG.prac}점, 부원 능력치 +${CG.grow}`);
    renderClub(); questChanged(); save();
    return true;
  }
  const cgShowAdd = c => { if (cgOpen()) { cgSync(); S.cg.show[c] = (S.cg.show[c] || 0) + 1; } };
  function cgHTML() {
    if (!cgOpen()) return '';
    cgSync();
    const t = cgTable(false), me = t.findIndex(r => r.me) + 1, left = 6 - cgDayIdx(), ban = IMG('league_banner');
    return `<div class="cg-box"><div class="cg-ban"${ban ? ` style="background-image:url('${ban}')"` : ''}><b>동아리 대항전</b><small>${left ? `일요일까지 ${left}일 남았어요` : '오늘 밤 자정에 끝나요'}</small></div>` +
      `<p class="cg-me">이번 주 우리 학교 <b>${me}등</b>, ${fmt(cgMy())}점${S.cg.wins ? ` <span class="cg-wins">우승 ${S.cg.wins}번</span>` : ''}</p>` +
      `<ol class="cg-tab">${t.map((r, i) => `<li class="${r.me ? 'me' : ''}"><span class="cg-rk">${i + 1}</span>${r.me ? ((S.deco.mk && markHTML(S.deco.mk)) || '🏫') : IMG('bmark_' + r.k) ? `<img src="${IMG('bmark_' + r.k)}" alt="">` : '🏫'}<span class="nm ell">${esc(r.nm)}</span><b>${fmt(r.pts)}</b></li>`).join('')}</ol>` +
      `<div class="cg-clubs">${CLUBS.map((C, c) => `<span>${clubBadge(c, 22)}${fmt(cgClubPts(c))}</span>`).join('')}</div>` +
      `<button class="cta small cg-prac" type="button" data-cg="prac" aria-disabled="${cgPracToday() ? 'true' : 'false'}">${cgPracToday() ? '오늘 연습 끝, 내일 또 해요' : `모두 연습 (동아리마다 +${CG.prac}점)`}</button>` +
      `<small class="cg-note">점수: 부원 별 하나 ${CG.star}점, 연습 ${CG.prac}점, 발표회 ${CG.show}점. 1등 황금 도토리 ${CG.gold1}개와 우승 깃발, 2~3등 황금 도토리 ${CG.gold23}${S.cg.res ? `. 지난주 ${S.cg.res.rank}등` : ''}</small></div>`;
  }
  function sanitizeCg(d, s) {
    const G = d.cg && typeof d.cg === 'object' ? d.cg : {}, o = freshCg(), n = (v, hi) => Math.max(0, Math.min(hi, Math.floor(Number(v) || 0)));
    o.wk = Number.isInteger(G.wk) && G.wk >= -1 && G.wk < 1e5 ? G.wk : -1;
    o.opp = (Array.isArray(G.opp) ? G.opp : []).filter(x => x && BT_SCH.some(b => b.k === x.k)).slice(0, CG.f.length).map(x => ({ k: x.k, f: n(x.f, 1e7) }));
    o.prac = CLUBS.map((_, c) => n(Array.isArray(G.prac) ? G.prac[c] : 0, 7)); o.show = CLUBS.map((_, c) => n(Array.isArray(G.show) ? G.show[c] : 0, 14));
    o.pd = typeof G.pd === 'string' ? G.pd.slice(0, 10) : '';
    o.res = G.res && typeof G.res === 'object' ? { wk: n(G.res.wk, 1e5), rank: Math.max(1, n(G.res.rank, 8)), my: n(G.res.my, 1e7) } : null;
    o.wins = n(G.wins, 1e4); o.pod = n(G.pod, 1e4); o.st = { p: n(G.st && G.st.p, 1e6), n: n(G.st && G.st.n, 1e6), s: n(G.st && G.st.s, 1e6) };
    // 5: st.s가 없던 저장은 이번 주 대항전 발표회 수(show)를 최소값으로 받아요(그전 주 것은 알 수 없어요)
    if (!(G.st && typeof G.st === 'object' && 's' in G.st))   /* 글자나 숫자가 들어온 저장에도 읽기가 멈추지 않게 */ o.st.s = Math.max(o.st.s, o.wk >= 0 ? o.show.reduce((a, v) => a + v, 0) : 0);
    s.cg = o;
  }
