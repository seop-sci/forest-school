  /* ---------- 2.0.1 공부 3단계: 시험 기간 (2026-10-28 woodani 결정, 옛 2.2.0) ----------
     4주마다 한 주(게임 시계, 월~일)가 시험 주예요. 초등학교부터 열려요(과목 레벨만), 중학교부터는 명부 학생 평균 능력과 반반.
     시험 주에는 하루 한 번 자율학습: 과목 하나를 골라 XP(20 + 도서관 Lv, 60까지)를 받고, 자율학습 한 번마다 성적이 3%씩(5번까지) 올라요.
     시험 주가 끝나면 성적표: 과목마다 상한 대비 80% A, 60% B, 40% C, 그 아래 D. 점수(A 4 … D 1)의 합 × 6분치 도토리, 모두 A면 황금 도토리 3, 15점 이상 1.
     전교 1등 학생은 다음 시험까지 교실 창에 상장이 걸려요. 그림은 작업지시서 21(art/v210/exam). 숫자는 본부 제안 */
  const EX = { tier: 1, cycle: 4, at: 2, ssMax: 5, ssStep: 0.03, xpBase: 20, xpMax: 60, minPer: 6, goldAll: 3, goldGood: 1, good: 15 };
  const EX_PT = { A: 4, B: 3, C: 2, D: 1 };
  const freshEx = () => ({ cur: -1, ss: 0, day: '', rep: null, st: { n: 0, best: 0, a: 0 } });   // cur: 이 주에 시험 주를 본 번호, ss: 그 주 자율학습 수, rep: 받을 성적표(또는 받은 마지막 성적표)
  const exOpen = () => !!S && S.tier >= EX.tier;
  const exIsWeek = w => ((w - EX.at) % EX.cycle + EX.cycle) % EX.cycle === 0;
  const exNow = () => exIsWeek(gameWeek());
  // 지금 주 이전의 가장 가까운 시험 주
  const exPrev = () => { const w = gameWeek(); let p = w - (((w - EX.at) % EX.cycle) + EX.cycle) % EX.cycle; if (p === w) p -= EX.cycle; return p; };
  // 다음 시험이 시작하기까지 날 수(시험 주 안이면 끝나기까지)
  function exDays() {
    const w = gameWeek(), toMon = elLeft();   // 다음 월요일까지 1~7일
    if (exIsWeek(w)) return toMon;
    const gap = ((EX.at - w - 1) % EX.cycle + EX.cycle) % EX.cycle;   // 다음 주부터 시험 주까지 남은 주
    return toMon + gap * 7;
  }
  const exXp = () => Math.min(EX.xpMax, EX.xpBase + (S.f.library || 0));
  const exSeats = () => Math.max(1, Math.min(Math.floor(S.students), 10 + 3 * (S.f.library || 0)));
  function exStudyDone() { return S.ex.day === gameToday(); }
  // 과목마다 점수(0~1)와 등급
  function exScore(k) {
    const cap = acCap(); let v = Math.min(1, acLv(k) / cap);
    if (rosterOn() && S.roster.list.length) { const j = AB_KEY.indexOf(k); if (j >= 0) v = v * 0.6 + S.roster.list.reduce((a, s) => a + (s.a[j] || 0), 0) / S.roster.list.length / 100 * 0.4; }   // 학력 0.6 + 명부 평균 0.4
    return Math.min(1, v + EX.ssStep * Math.min(EX.ssMax, S.ex.ss));
  }
  const exGrade = v => v >= 0.8 ? 'A' : v >= 0.6 ? 'B' : v >= 0.4 ? 'C' : 'D';
  const gradeImg = (g, px) => IMG('grade_' + g.toLowerCase()) ? `<img class="ex-stamp" src="${IMG('grade_' + g.toLowerCase())}" alt="${g}" style="width:${px}px;height:${px}px">` : `<b class="ex-g g${g}">${g}</b>`;
  // 전교 1등: 중학교부터는 명부에서 능력치 합이 가장 큰 학생, 그 전에는 만난 친구 하나
  function exTop() {
    if (rosterOn() && S.roster.list.length) { const s = S.roster.list.slice().sort((a, b) => b.a.reduce((x, y) => x + y, 0) - a.a.reduce((x, y) => x + y, 0))[0]; return { sp: s.sp, nm: s.nm }; }
    const L = speciesList(), sp = L[Math.floor(Math.random() * L.length)] || 'rabbit'; return { sp, nm: spName(sp) };
  }
  function exMake(wk) {
    const g = AC.keys.map(k => exGrade(exScore(k))), pts = g.reduce((a, x) => a + EX_PT[x], 0);
    return { wk, g, lv: AC.keys.map(acLv), pts, ss: S.ex.ss, top: exTop(), got: false };
  }
  // 1초마다: 시험 주가 되면 알리고, 끝나면 성적표를 만들어요(그 시험 주에 학교에 왔을 때만)
  function exTick() {
    if (!exOpen() || !S.ex) return;
    const w = gameWeek();
    if (exIsWeek(w) && S.ex.cur !== w) {
      // 5.3.4.6: 지난 시험 주 성적표가 아직 없으면 먼저 만들고, 받지 않은 성적표는 덮기 전에 받아요(전에는 덮여 사라졌어요)
      if (S.ex.cur >= 0 && S.ex.cur < w && !(S.ex.rep && S.ex.rep.wk === S.ex.cur)) { if (S.ex.rep && !S.ex.rep.got) exClaim(); S.ex.rep = exMake(S.ex.cur); }
      const made = !!(S.ex.rep && S.ex.rep.wk === S.ex.cur && !S.ex.rep.got);
      S.ex.cur = w; S.ex.ss = 0; save(); rt.exNews = made ? '지난 시험 성적표가 나왔고 새 시험 주가 시작됐어요!\n도서관이나 공부 탭에서 받아요' : '시험 주가 시작됐어요!\n도서관에서 자율학습을 하면 성적이 올라요'; }
    const p = exPrev();
    if (!exIsWeek(w) && S.ex.cur === p && !(S.ex.rep && S.ex.rep.wk === p)) { if (S.ex.rep && !S.ex.rep.got) exClaim(); S.ex.rep = exMake(p); save(); rt.exNews = '시험 성적표가 나왔어요!\n도서관이나 공부 탭에서 받아요'; if (rt.tab === 'mini') renderMini(); }
    if (rt.exNews && $('#toast').hidden && !rt.modalOpen && !rt.cereOn && !rt.paused && !gameSceneOpen()) { const t = rt.exNews; rt.exNews = ''; toast(t); }
  }
  const exReportReady = () => !!S && !!S.ex && !!S.ex.rep && !S.ex.rep.got;
  function exStudy(k) {
    if (!exOpen() || !AC.name[k] || rt.paused) return 0;
    if (!exNow()) { toast('자율학습은 시험 주에만 해요'); return 0; }
    if (S.f.library < 1) { toast(`${eul(FAC.library.name)} 지으면 자율학습을 할 수 있어요`); return 0; }
    if (exStudyDone()) { toast('오늘 자율학습은 끝났어요.\n내일 또 해요'); return 0; }
    if (S.ex.cur !== gameWeek()) { S.ex.cur = gameWeek(); S.ex.ss = 0; }
    S.ex.day = gameToday(); S.ex.ss += 1;
    const xp = acGain(k, exXp());
    sfx('quest'); buzz(14);
    toast(`학생 ${fmt(exSeats())}명이 ${AC.name[k]} 자율학습을 했어요!\n${AC.name[k]} XP +${xp}`);
    save(); renderExam(); renderMini(); return xp;
  }
  function exClaim() {
    const r = S.ex.rep; if (!r || r.got) return null;
    r.got = true;
    const v = minAcorns(r.pts * EX.minPer); S.budget += v; earn(v);
    const allA = r.g.every(g => g === 'A'), gold = allA ? EX.goldAll : r.pts >= EX.good ? EX.goldGood : 0;
    const gIt = gold ? goldOr(gold) : null;
    S.ex.st.n += 1; S.ex.st.best = Math.max(S.ex.st.best, r.pts); if (allA) S.ex.st.a += 1;
    save(); renderHUD(); checkQuests(); renderExam(); renderMini();
    sfx('quest'); buzz([20, 40, 20]);
    toast(`성적표를 받았어요! 도토리 +${fmt(v)}` + (gIt ? `, ${gIt.t}` : '') + `\n전교 1등 ${r.top.nm}의 상장이 교실에 걸렸어요`);
    return { v, gold };
  }
  function openExam() {
    if (!exOpen()) { toast(`시험 기간은 ${TIERS[EX.tier].name}부터 열려요`); return; }
    if (rt.paused || rt.modalOpen) return;
    exTick(); renderExam(); openModal($('#mExam')); sfx('tap');
  }
  function renderExam() {
    const m = $('#mExam'); if (!m || !S.ex) return;
    const bg = IMG('exam_bg'); $('#exHead').style.backgroundImage = bg ? `url("${bg}")` : '';
    const now = exNow(), r = S.ex.rep, ready = exReportReady(), d = exDays();
    let lead;
    if (ready) lead = '시험 성적표가 나왔어요!\n아래에서 받아요.';
    else if (now) lead = nl(`지금은 시험 주예요(${d}일 남음). 하루 한 번 자율학습을 하면 그 과목 XP를 받고, 성적도 조금씩 올라요.`);
    else lead = nl(`다음 시험까지 ${d}일 남았어요. 시험 주가 오면 하루 한 번 자율학습을 해요. 평소에 공부해 두면 성적이 좋아요.`);
    $('#exLead').textContent = lead;
    // 자율학습: 과목 다섯, 지금 예상 등급
    const sd = exStudyDone(), lib = S.f.library >= 1;
    $('#exStudy').hidden = !now || ready;
    if (now && !ready) {
      $('#exStudyHd').textContent = !lib ? `${eul(FAC.library.name)} 지으면 자율학습을 할 수 있어요` : sd ? `오늘 자율학습은 끝났어요. 이번 주 ${S.ex.ss}번(성적 +${Math.round(100 * EX.ssStep * Math.min(EX.ssMax, S.ex.ss))}%)` : `자율학습할 과목을 골라요. 고른 과목 XP +${exXp()}`;
      $('#exSubj').innerHTML = AC.keys.map(k => `<button class="ex-sub" type="button" data-ex="${k}" aria-disabled="${lib && !sd ? 'false' : 'true'}"><span>${AC.name[k]}</span><small>Lv.${acLv(k)}</small>${gradeImg(exGrade(exScore(k)), 30)}</button>`).join('');
    }
    // 성적표: 받을 것이 있으면 그것, 없으면 마지막으로 받은 것
    const show = r && (ready || !now) ? r : null;
    $('#exReportW').hidden = !show;
    if (show) {
      const pic = IMG('exam_report'); $('#exReport').style.backgroundImage = pic ? `url("${pic}")` : '';
      $('#exReport').classList.toggle('fb', !pic);
      const row = (i, a, b, c, cls) => `<div class="ex-row${cls ? ' ' + cls : ''}" style="top:${((332 + i * 51.3) / 1024 * 100).toFixed(2)}%">${a}<span>${b}</span><span>${c}</span></div>`;
      $('#exReport').innerHTML = `<div class="ex-row hd" style="top:${(272 / 1024 * 100).toFixed(2)}%"><b>과목</b><span>레벨</span><span>등급</span></div>` +
        AC.keys.map((k, i) => row(i, `<b>${AC.name[k]}</b>`, `Lv.${show.lv[i]}`, gradeImg(show.g[i], 22))).join('') +
        row(5, '<b>합계</b>', `${show.pts}점`, `${show.pts}/20`, 'sum') + row(6, '<b>전교 1등</b>', esc(show.top.nm), IMG('exam_award') ? `<img src="${IMG('exam_award')}" alt="" style="width:20px;height:20px">` : '🏅', 'top');
      $('#exReportTx').textContent = show.got ? `${show.wk === exPrev() ? '지난' : '예전'} 시험 성적표예요. 자율학습 ${show.ss}번` : `받으면 도토리 ${fmt(minAcorns(show.pts * EX.minPer))}개${show.g.every(g => g === 'A') ? `와 황금 도토리 ${EX.goldAll}개` : show.pts >= EX.good ? `와 황금 도토리 ${EX.goldGood}개` : ''}를 받아요`;
    }
    $('#exClaim').hidden = !ready;
    $('#exNote').textContent = nl(`등급은 과목 레벨이 ${tierInfo().name} 상한 Lv.${acCapOf(S.tier)}의 80% 이상이면 A, 60% B, 40% C예요. 시험은 4주마다 한 주예요. 지금까지 성적표 ${S.ex.st.n}장, 최고 ${S.ex.st.best}점, 모두 A ${S.ex.st.a}번.` + (rosterOn() ? ' 중학교부터는 명부 학생들의 평균 능력도 반영돼요.' : ''));
  }
  const exAwardTop = () => S && S.ex && S.ex.rep && S.ex.rep.got && S.ex.rep.wk === exPrev() ? S.ex.rep.top : null;   // 다음 시험 전까지 교실에 걸린 상장
  function sanitizeExam(d, s) {
    s.ex = freshEx();
    const E = d.ex && typeof d.ex === 'object' ? d.ex : null; if (!E) return;
    s.ex.cur = Number.isInteger(E.cur) ? Math.max(-1, Math.min(1e5, E.cur)) : -1;
    s.ex.ss = Math.floor(numIn(E.ss, 0, 7)); s.ex.day = typeof E.day === 'string' ? E.day.slice(0, 10) : '';
    const r = E.rep;
    if (r && typeof r === 'object' && Number.isInteger(r.wk) && Array.isArray(r.g) && r.g.length === 5 && r.g.every(g => EX_PT[g])) {
      const lv = Array.isArray(r.lv) && r.lv.length === 5 ? r.lv.map(v => Math.floor(numIn(v, 1, 60))) : [1, 1, 1, 1, 1];
      const top = r.top && typeof r.top === 'object' && typeof r.top.sp === 'string' ? { sp: r.top.sp.slice(0, 20), nm: String(r.top.nm || '').slice(0, 12) || '친구' } : { sp: 'rabbit', nm: '토끼' };
      s.ex.rep = { wk: r.wk, g: r.g.slice(), lv, pts: r.g.reduce((a, g) => a + EX_PT[g], 0), ss: Math.floor(numIn(r.ss, 0, 7)), top, got: !!r.got };
    }
    if (E.st && typeof E.st === 'object') { s.ex.st.n = Math.floor(numIn(E.st.n, 0, 1e5)); s.ex.st.best = Math.floor(numIn(E.st.best, 0, 20)); s.ex.st.a = Math.min(s.ex.st.n, Math.floor(numIn(E.st.a, 0, 1e5))); }
  }
  /* ---------- 공부 4단계: 숲속 대결 (미니게임 3, 체육 공부) (설계안 "숲속 대결 설계안") ----------
     초등학교 3학년부터. 컴퓨터 학교 8곳과 학생 셋이 세 종목(다섯 과목 가운데 셋)으로 겨루는 2선승 승부. 하루 5판(게임 시계)
     종목 점수 = 별 × 20 + 주사위(0~60) + 응원(0~10). 별은 초등학교에서 과목 레벨 ÷ 4(올림, 1~5) + 잘하는 과목 1, 중학교부터 명부 능력치
     승 +25(3연승부터 +5씩, 최대 +15 더), 패 −10(1000 아래로 안 내려가요). 리그 6단계(내려가지 않아요), 승급마다 황금 도토리 1~5
     오늘 첫 승리만 수업료 10분치. 이긴 종목(친선 포함)마다 그 과목 XP 10, 중학교 명부 학생은 능력치 +1(하루 학생마다 2번까지)
     주간 리그 승리마다 5점(하루 25점까지). 그림은 작업지시서 29, 29-1 */
  // 퍼즐, 합치기, 대결 화면에 있는 동안은 홈 알림(반장 선거, 시험 주, 책 다 읽음)을 미뤄요
  const gameSceneOpen = () => { try { return !!((pzUI && pzUI.open) || (mgUI && mgUI.open) || (btUI && btUI.open)); } catch (e) { return false; } };
  const BT = { perDay: 5, adMore: 2, adMax: 1, win: 25, lose: 10, floor: 1000, streakFrom: 3, streakStep: 5, streakMax: 15, firstMin: 10, xp: 12, play: 5, grow: 2, lp: 5, lpDay: 25, cheerMs: 4000, cheerMax: 10, cheerTaps: 50, dice: 60, sweep: 0.7 };   // 응원: 4초 동안 50번까지 두드려요(5번마다 1점, 최대 10점). 주사위 0~60: 설계안의 승률(별 하나 차이 뒤집기 약 20~30%, 두 별 약 5%)에 맞춘 값. 0~30이면 별 하나 차이도 6%라 거의 못 뒤집어요
  const BT_EV = { kor: { name: '책 읽기', ic: 'bev_read', em: '📖' }, math: { name: '수학 퀴즈', ic: 'bev_math', em: '➗' }, sci: { name: '과학 퀴즈', ic: 'bev_science', em: '🧪' },
    art: { name: '그리기', ic: 'bev_draw', em: '🎨' }, pe: { name: '달리기', ic: 'bev_run', em: '👟' } };
  const BT_LG = [
    // 상대 별(off)과 상대 응원(cheer)을 낮췄어요. 가장 좋게 고르고 응원을 꽉 채우면
    // 이기는 판이 새싹 87→91%, 동 77→87%, 은 64→77%, 금 62→75%, 백금 48→64%, 무지개 44→60%(dev 시뮬레이션 3,000판)
    { n: '새싹', at: 1000, gold: 0, medal: 'medal_sprout', off: -3, cheer: 1 }, { n: '동', at: 1100, gold: 1, medal: 'medal_bronze', off: -2, cheer: 2 },
    { n: '은', at: 1300, gold: 2, medal: 'medal_silver', off: -1, cheer: 3 }, { n: '금', at: 1600, gold: 3, medal: 'medal_gold', off: -1, cheer: 4 },
    { n: '백금', at: 2000, gold: 4, medal: 'medal_platinum', off: 0, cheer: 4 }, { n: '무지개', at: 2500, gold: 5, medal: 'medal_rainbow', off: 0, cheer: 5 }
  ];
  const BT_SP = { squirrel: '다람쥐', deer: '사슴', sheep: '양', boar: '멧돼지', beaver: '비버', mouse: '생쥐', goat: '염소', crane: '두루미', sparrow: '참새', wolf: '늑대', goose: '거위', crow: '까마귀' };
  // 상대 학교: 특징(trait) 'even' 고르게, 과목 키는 그 종목에 몰기, 'one' 한 명에 몰기. 선수 셋은 [종류, 이름, 잘하는 과목]
  const BT_SCH = [
    { k: 'oak', name: '참나무 학교', c: '#8A5A2B', trait: 'even', p: [['squirrel', '알밤', 'art'], ['deer', '하늘', 'pe'], ['sheep', '뭉게', 'kor']] },
    { k: 'pine', name: '솔방울 학교', c: '#3F7A3A', trait: 'pe', p: [['deer', '바람', 'pe'], ['boar', '우당', 'pe'], ['beaver', '톱니', 'sci']] },
    { k: 'mushroom', name: '버섯골 학교', c: '#C24A3A', trait: 'sci', p: [['beaver', '댐댐', 'sci'], ['mouse', '또록', 'math'], ['goat', '수염', 'art']] },
    { k: 'firefly', name: '반딧불 학교', c: '#C9A21C', trait: 'kor', p: [['sheep', '포근', 'kor'], ['crane', '긴다리', 'kor'], ['squirrel', '도토', 'art']] },
    { k: 'rainbow', name: '무지개 학교', c: '#7A5AB0', trait: 'art', p: [['goat', '붓끝', 'art'], ['sparrow', '짹짹', 'art'], ['mouse', '찍찍', 'math']] },
    { k: 'rock', name: '바위산 학교', c: '#6E7378', trait: 'one', p: [['wolf', '바위', 'pe'], ['crane', '안개', 'kor'], ['sparrow', '조약', 'art']] },
    { k: 'stream', name: '시냇물 학교', c: '#3E7FB8', trait: 'even', p: [['goose', '물결', 'kor'], ['boar', '첨벙', 'pe'], ['crow', '반짝', 'math']] },
    { k: 'goldforest', name: '황금숲 학교', c: '#C9962A', trait: 'math', gold: true, p: [['wolf', '황금', 'pe'], ['crow', '까망', 'math'], ['goose', '깃털', 'kor']] }
  ];
  const freshBt = () => ({ pts: 1000, lg: 0, day: '', n: 0, adN: 0, won: false, streak: 0, grow: { day: '', m: {} }, last: -1, lp: { day: '', p: 0 }, st: { w: 0, l: 0, ev: 0, best: 0, wm: 0 } });
  const btOpen = () => !!S && (S.tier >= 2 || (S.tier === 1 && S.tg >= 2));
  function btDay() { const t = gameToday(); if (dayRoll(S.bt, t)) { S.bt.n = 0; S.bt.won = false; S.bt.adN = 0; } }
  // 다 쓰면 광고를 보고 하루 한 번 2판 더(숲속 퍼즐과 같게)
  const btQuota = () => BT.perDay + (S.bt.adN || 0) * BT.adMore;
  const btLeft = () => { btDay(); return Math.max(0, btQuota() - S.bt.n); };
  const btCanAd = () => btOpen() && btLeft() <= 0 && (S.bt.adN || 0) < BT.adMax && BT.adMore > 0;
  function btAdMore() {
    if (!btCanAd()) return;
    showAd(() => { btDay(); S.bt.adN = (S.bt.adN || 0) + 1; save(); if (btUI.M) btRender(); renderBtCard(); toast(`오늘 숲속 대결 ${BT.adMore}판을 더 할 수 있어요`); }, r => { if (r !== 'noad') toast('광고를 끝까지 보지 않아서 판을 더 받지 못했어요'); });
  }
  const btLgOf = pts => { let i = 0; BT_LG.forEach((L, j) => { if (pts >= L.at) i = j; }); return i; };
  const btMedal = (i, px) => IMG(BT_LG[i].medal) ? `<img class="bt-medal" src="${IMG(BT_LG[i].medal)}" alt="${BT_LG[i].n} 리그" style="width:${px}px;height:${px}px">` : `<span class="bt-medal em" style="font-size:${Math.round(px * 0.7)}px">🏅</span>`;
  const btEvIc = (k, px) => IMG(BT_EV[k].ic) ? `<img src="${IMG(BT_EV[k].ic)}" alt="" style="width:${px}px;height:${px}px">` : `<span style="font-size:${Math.round(px * 0.7)}px">${BT_EV[k].em}</span>`;
  const btChr = (sp, cls) => IMG('chr_' + sp) ? `<img class="${cls || 'bt-chr'}" src="${IMG('chr_' + sp)}" alt="" draggable="false">` : `<span class="${cls || 'bt-chr'} fb">${kidAvatar(sp)}</span>`;
  const btName = sp => BT_SP[sp] || spName(sp);
  // 내 선수 후보: 중학교부터 명부, 그 전에는 만난 친구 종류. stars[과목]
  function btRoster() {
    if (rosterOn() && S.roster.list.length) return S.roster.list.map((s, i) => ({ id: 'r' + i, sp: s.sp, nm: s.nm, ri: i, st: Object.fromEntries(AB_KEY.map((k, j) => [k, star(s.a[j] || 0)])) }));
    return [...new Set(speciesList())].map(sp => { const apt = AB_KEY[SP_ABIL[sp] !== undefined ? SP_ABIL[sp] : 0];
      return { id: sp, sp, nm: spName(sp), st: Object.fromEntries(AB_KEY.map(k => [k, Math.min(5, Math.max(1, Math.ceil(acLv(k) / 4)) + (k === apt ? 1 : 0))])) }; });
  }
  // 세 종목에 세울 수 있는 가장 좋은 배치(별 합)
  function btBest(evs, list) {
    let best = { sum: -1, pick: [] };
    for (const a of list) for (const b of list) { if (b === a) continue; for (const c of list) { if (c === a || c === b) continue;
      const sum = a.st[evs[0]] + b.st[evs[1]] + c.st[evs[2]]; if (sum > best.sum) best = { sum, pick: [a.id, b.id, c.id] }; } }
    if (best.sum < 0) best = { sum: list.reduce((n, x, i) => n + (i < 3 ? x.st[evs[i]] : 0), 0), pick: list.slice(0, 3).map(x => x.id) };
    return best;
  }
  // 새 판: 상대 학교(연속 금지, 황금숲은 무지개 리그만), 종목 셋, 상대 선수 별(내 가장 좋은 배치에 리그만큼 더하거나 빼요)
  function btMake() {
    const L = S.bt.lg, ok = BT_SCH.map((s, i) => i).filter(i => (!BT_SCH[i].gold || L >= 5) && i !== S.bt.last);
    const si = ok[Math.floor(Math.random() * ok.length)], sch = BT_SCH[si];
    const keys = AC.keys.slice(); for (let i = keys.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [keys[i], keys[j]] = [keys[j], keys[i]]; }
    const evs = keys.slice(0, 3), mine = btRoster();
    const target = Math.max(3, Math.min(15, btBest(evs, mine).sum + BT_LG[L].off + (sch.gold ? 1 : 0)));
    // 상대 배치: 특징 종목에 가장 센 선수, 나머지는 잘하는 과목이 맞는 선수 먼저
    const ps = sch.p.map(([sp, nm, ap]) => ({ sp, nm, ap })), seat = [null, null, null], used = new Set();
    evs.forEach((e, i) => { const x = ps.find((p, j) => !used.has(j) && p.ap === e); if (x) { seat[i] = x; used.add(ps.indexOf(x)); } });
    evs.forEach((e, i) => { if (!seat[i]) { const j = ps.findIndex((p, j) => !used.has(j)); seat[i] = ps[j]; used.add(j); } });
    // 별 나누기
    let st = [0, 0, 0].map(() => Math.floor(target / 3)), rest = target - st.reduce((a, b) => a + b, 0);
    if (sch.trait === 'one') { const i = Math.floor(Math.random() * 3), add = Math.min(5 - st[i], rest + 2); st[i] += add; rest -= add; for (let j = 0; j < 3 && rest < 0; j++) if (j !== i && st[j] > 1) { st[j] -= 1; rest += 1; } }
    const order = [0, 1, 2].sort((a, b) => ((sch.trait === evs[b]) - (sch.trait === evs[a])) || ((seat[b].ap === evs[b]) - (seat[a].ap === evs[a])));
    for (let r = 0; rest > 0 && r < 9; r++) { const i = order[r % 3]; if (st[i] < 5) { st[i] += 1; rest -= 1; } }
    st = st.map(v => Math.max(1, Math.min(5, v)));
    return { si, evs, opp: seat.map((p, i) => ({ sp: p.sp, nm: p.nm, st: st[i] })), me: [null, null, null], sel: 0, phase: 'pick', res: [], i: 0 };
  }
  const btScore = (stars, dice, cheer) => stars * 20 + dice + cheer;
  // 한 종목 겨루기(응원은 나중에 더해요). 같은 점수면 별이 높은 쪽, 그래도 같으면 내가 이겨요
  function btRoll(ms, os, oc) { return { md: Math.floor(Math.random() * (BT.dice + 1)), od: Math.floor(Math.random() * (BT.dice + 1)), oc: Math.max(0, Math.min(BT.cheerMax, oc)), ms, os }; }
  const btWin = (r, mc) => { const a = btScore(r.ms, r.md, mc), b = btScore(r.os, r.od, r.oc); return a > b || (a === b && r.ms >= r.os); };
  function btOppCheer() { const m = BT_LG[S.bt.lg].cheer; return Math.max(0, Math.min(BT.cheerMax, Math.round(m - 2 + Math.random() * 4))); }
  // 판 끝: 점수, 리그, 보상(한 번만)
  function btFinish(M, sw) {   // sw: 소탕(연승 덤 없음, 과목 XP와 리그 점수는 BT.sweep배)
    if (M.done) return M.out; M.done = true; btDay();   // 날짜를 먼저 맞춰요(뒤에서 btDay가 오늘 첫 승리 표시를 지우지 않게)
    const wins = M.res.filter(r => r.win).length, win = M.res.slice(0, 3).filter(r => r.win).length >= 2;
    const before = S.bt.pts, lg0 = S.bt.lg, out = { win, wins, pts0: before, items: [] };
    if (win) { S.bt.streak += 1; const bonus = !sw && S.bt.streak >= BT.streakFrom ? Math.min(BT.streakMax, BT.streakStep * (S.bt.streak - BT.streakFrom + 1)) : 0; S.bt.pts = Math.min(9999, S.bt.pts + BT.win + bonus); out.bonus = bonus;
      S.bt.st.w += 1; if (rosterOn()) S.bt.st.wm += 1; S.bt.st.best = Math.max(S.bt.st.best, S.bt.streak);
      if (!S.bt.won) { S.bt.won = true; const v = Math.round(minAcorns(BT.firstMin) * (1 + deptX('sports') / 100)); S.budget += v; earn(v); out.acorn = v; }
      const t = gameToday(); if (dayRoll(S.bt.lp, t)) { S.bt.lp.p = 0; } const lp = Math.min(sw ? Math.round(BT.lp * BT.sweep) : BT.lp, BT.lpDay - S.bt.lp.p); if (lp > 0) { S.bt.lp.p += lp; addLeague(lp); out.lp = lp; }
    } else { S.bt.streak = 0; S.bt.pts = Math.max(BT.floor, S.bt.pts - BT.lose); S.bt.st.l += 1; }
    out.d = S.bt.pts - before;
    // 이긴 종목(친선 포함): 과목 XP, 중학교 명부 학생 능력치
    const t = gameToday(); if (S.bt.grow.day !== t) S.bt.grow = { day: t, m: {} };
    acGain('pe', sw ? Math.round(BT.play * BT.sweep) : BT.play);   // 한 판 뛰면 이기든 지든 체육 XP
    M.res.forEach((r, i) => { if (!r.win) return; S.bt.st.ev += 1; acGain(M.evs[i], sw ? Math.round(BT.xp * BT.sweep) : BT.xp);
      const p = M.me[i]; if (p && p.ri !== undefined && rosterOn()) { const s = S.roster.list[p.ri], key = s && s.nm; const j = AB_KEY.indexOf(M.evs[i]);
        if (s && j >= 0 && (S.bt.grow.m[key] || 0) < BT.grow && s.a[j] < 100) { s.a[j] += 1; S.bt.grow.m[key] = (S.bt.grow.m[key] || 0) + 1; } } });
    // 리그 승급(내려가지 않아요)
    const lg = Math.max(S.bt.lg, btLgOf(S.bt.pts));
    if (lg > lg0) { let g = 0; for (let i = lg0 + 1; i <= lg; i++) g += BT_LG[i].gold; S.bt.lg = lg; if (g) addGold(g); out.up = lg; out.gold = g; }
    M.out = out; save(); renderHUD(); checkQuests(); renderMini(); rankDirty(); return out;
  }
  // 소탕: 오늘 1판을 직접 하면 남은 판을 한 번에 끝내요. 승패 셈은 그대로(내 응원 0점), 연승 덤은 없고 과목 XP와 리그 점수는 70%
  const btSwOpen = () => { btDay(); return btOpen() && S.bt.n >= 1; };
  function openBtSw() {
    if (!btSwOpen()) { toast('오늘 1판을 직접 하면 소탕할 수 있어요'); return; }
    const left = btLeft(); if (left <= 0) { toast('오늘 판을 다 했어요. 내일 다시 열려요'); return; }
    $('#btSwText').textContent = `남은 ${left}판을 응원 없이 바로 겨뤄요. 이기면 대결 점수가 오르고 지면 내려가요. XP와 리그 점수는 ${Math.round(BT.sweep * 100)}%만 받아요.`;
    openModal($('#mBtSw'));
  }
  function btSweep() {
    if (!btSwOpen() || rt.paused || liveOff('battle') || (btUI.M && btUI.M.phase === 'play')) return null;
    const left = btLeft(); if (left <= 0) return null;
    const g = { n: 0, w: 0, l: 0, d: 0, lp: 0, acorn: 0, gold: 0, up: -1 };
    for (let k = 0; k < left; k++) {
      const M = btMake(), list = btRoster(), b = btBest(M.evs, list);
      M.me = b.pick.map(id => list.find(x => x.id === id)); if (M.me.some(x => !x)) break;
      S.bt.last = M.si; S.bt.n += 1; M.phase = 'play';
      M.rolls = M.evs.map((e, i) => btRoll(M.me[i].st[e], M.opp[i].st, btOppCheer()));
      M.res = M.rolls.map(r => { r.mc = 0; r.win = btWin(r, 0); return r; });
      const o = btFinish(M, true);
      g.n += 1; if (o.win) g.w += 1; else g.l += 1; g.d += o.d; g.lp += o.lp || 0; g.acorn += o.acorn || 0; g.gold += o.gold || 0; if (o.up !== undefined) g.up = o.up;
    }
    if (!g.n) return null;
    sfx('quest'); buzz(15);
    showReward({ title: `대결 ${g.n}판 소탕!`, sub: `${g.w}번 이기고 ${g.l}번 졌어요`, items: [{ ic: '🏅', t: `대결 점수 ${g.d >= 0 ? '+' : ''}${g.d} (지금 ${fmt(S.bt.pts)})` }, g.lp ? { ic: 'lp', t: `리그 점수 +${g.lp}` } : null, g.acorn ? { ic: 'acorn', t: `오늘 첫 승리 도토리 +${fmt(g.acorn)}` } : null, g.up >= 0 ? { ic: '🎖️', t: `${BT_LG[g.up].n} 리그로 올라갔어요` + (g.gold ? ` (황금 도토리 +${g.gold})` : '') } : null].filter(Boolean) });
    if (btUI.M) btRender(); renderBtCard();
    return g;
  }
  // ---------- 화면 ----------
  const btUI = { open: false, M: null, taps: 0, timer: 0 };
  function btOpenScene() {
    if (!btOpen()) { toast('숲속 대결은 초등학교 3학년부터 열려요'); return; }
    if (liveOff('battle')) { toast('숲속 대결은 잠시 점검 중이에요. 조금만 기다려 주세요'); return; }
    btDay(); btUI.open = true; btUI.M = btMake(); btUI.M.si !== undefined && (S.bt.last = btUI.M.si);
    const bg = IMG('arena_bg'); $('#btScene').style.setProperty('--bt-bg', bg ? `url("${bg}")` : 'none');
    $('#btScene').hidden = false; btRender(); musicSync(); save();
  }
  function btClose() {
    const M = btUI.M;
    if (M && M.phase === 'play') { clearTimeout(btUI.timer); while (M.res.length < 3) { const i = M.res.length, r = M.rolls[i]; r.mc = 0; r.win = btWin(r, 0); M.res.push(r); } btFinish(M); }
    btUI.open = false; btUI.M = null; clearTimeout(btUI.timer);
    $('#btScene').hidden = true; save(); renderMini(); musicSync();
  }
  function btAuto() { const M = btUI.M; if (!M || M.phase !== 'pick') return; const list = btRoster(), b = btBest(M.evs, list); M.me = b.pick.map(id => list.find(x => x.id === id)); sfx('tap'); btRender(); }
  function btPick(id) {
    const M = btUI.M; if (!M || M.phase !== 'pick') return;
    const p = btRoster().find(x => x.id === id); if (!p) return;
    const was = M.me.findIndex(x => x && x.id === id); if (was >= 0) M.me[was] = null;
    M.me[M.sel] = p; const nx = M.me.findIndex(x => !x); if (nx >= 0) M.sel = nx;
    sfx('tap'); btRender();
  }
  function btStart() {
    const M = btUI.M; if (!M || M.phase !== 'pick' || M.me.some(x => !x)) return false;
    if (btLeft() <= 0) { if (btCanAd()) btAdMore(); else toast(`숲속 대결은 하루 ${btQuota()}판이에요.\n내일 또 겨뤄요`); return false; }
    S.bt.n += 1; M.phase = 'play'; M.i = 0;
    M.rolls = M.evs.map((e, i) => btRoll(M.me[i].st[e], M.opp[i].st, btOppCheer()));
    save(); M.intro = true; btRender(); sfx('quest');
    btUI.timer = setTimeout(() => { if (btUI.M !== M) return; M.intro = false; btPlayEv(); }, rt.reduced ? 300 : 1400);   // 시작 연출: 두 학교 마크와 VS
    return true;
  }
  /* ---------- 숲속 대결 종목 문제 ----------
     달리기만 지금처럼 두드리기. 수학 퀴즈는 한 자리 수 사칙연산(중학교부터 더하기, 빼기는 두 자리 수 + 한 자리 수), 과학 퀴즈는 기초 상식
     책 읽기는 낱말 문제, 그리기는 색 순서 기억 놀이. 응원 점수(0~10) 자리에 들어가서 점수 계산과 승률은 그대로예요
     퀴즈는 3문제(보기 3개, 한 문제 7초), 맞힌 수 0, 1, 2, 3 → 0, 3, 7, 10점. 기억 놀이는 맞게 누른 칸 비율 × 10점 */
  const BTQ = { n: 3, qMs: 7000, fbMs: 650, pts: [0, 3, 7, 10], memShow: 750, memGap: 200, memMs: 9000 };
  // 과학 퀴즈: [문제, 정답, 오답, 오답]. 보기는 섞어서 보여 줘요
  const BTQ_SCI = [
    ['물이 얼면 무엇이 될까요?', '얼음', '구름', '모래'], ['얼음이 녹으면 무엇이 될까요?', '물', '돌', '흙'],
    ['해는 어느 쪽에서 떠요?', '동쪽', '서쪽', '북쪽'], ['해는 어느 쪽으로 져요?', '서쪽', '동쪽', '남쪽'],
    ['개구리는 어릴 때 무엇이었을까요?', '올챙이', '애벌레', '병아리'], ['나비가 되기 전 모습은?', '애벌레', '올챙이', '달팽이'],
    ['닭의 새끼는?', '병아리', '송아지', '망아지'], ['소의 새끼는?', '송아지', '강아지', '병아리'], ['말의 새끼는?', '망아지', '송아지', '올챙이'],
    ['거미의 다리는 몇 개일까요?', '8개', '6개', '10개'], ['곤충의 다리는 몇 개일까요?', '6개', '4개', '8개'],
    ['식물이 자라려면 꼭 필요한 것은?', '햇빛', '사탕', '장난감'], ['자석에 붙는 것은?', '철 클립', '나무젓가락', '지우개'],
    ['자석에 붙지 않는 것은?', '플라스틱 자', '쇠못', '철 클립'], ['무지개는 몇 가지 색일까요?', '7가지', '5가지', '9가지'],
    ['소리를 듣는 곳은?', '귀', '코', '무릎'], ['냄새를 맡는 곳은?', '코', '귀', '팔꿈치'], ['맛을 느끼는 곳은?', '혀', '귀', '발'],
    ['물에 뜨는 것은?', '나뭇잎', '돌멩이', '쇠못'], ['물에 가라앉는 것은?', '돌멩이', '스티로폼', '나뭇잎'],
    ['가장 추운 계절은?', '겨울', '여름', '봄'], ['가장 더운 계절은?', '여름', '겨울', '가을'], ['단풍이 드는 계절은?', '가을', '여름', '봄'],
    ['꽃이 피고 새싹이 돋는 계절은?', '봄', '겨울', '가을'], ['고래는 어디에 살까요?', '바다', '사막', '나무 위'],
    ['낙타가 사는 곳은?', '사막', '바다', '남극'], ['펭귄이 많이 사는 곳은?', '남극', '사막', '열대 숲'],
    ['씨앗을 심으면 처음 땅 위로 나오는 것은?', '새싹', '열매', '꽃'], ['날마다 조금씩 모양이 바뀌어 보이는 밤하늘의 것은?', '달', '해', '북극성'],
    ['우리가 사는 행성의 이름은?', '지구', '화성', '달'], ['낮에 하늘에서 빛나며 우리를 따뜻하게 해 주는 것은?', '해', '달', '별똥별'],
    ['비가 오기 전 하늘에 많아지는 것은?', '구름', '무지개', '별'], ['비가 그친 뒤 해가 나면 볼 수 있는 것은?', '무지개', '눈사람', '오로라'],
    ['눈은 어느 계절에 많이 올까요?', '겨울', '여름', '늦봄'], ['번개가 친 뒤 들리는 소리는?', '천둥', '박수', '빗자루 소리'],
    ['뼈를 튼튼하게 하는 음식은?', '우유', '사탕', '콜라'], ['이를 닦아야 하는 까닭은?', '충치를 막으려고', '키가 크려고', '눈이 좋아지려고'],
    ['숨을 쉴 때 공기를 받아들이는 곳은?', '폐', '위', '발'], ['피를 온몸으로 보내는 곳은?', '심장', '폐', '위'],
    ['음식이 가장 먼저 들어가는 곳은?', '입', '귀', '코'], ['눈을 지키는 습관은?', '해를 똑바로 보지 않기', '해를 오래 보기', '눈을 세게 비비기'],
    ['손을 꼭 씻어야 할 때는?', '밥 먹기 전', '잠자는 중', '꿈꿀 때'], ['나무에서 얻을 수 없는 것은?', '우유', '열매', '나뭇잎'],
    ['꿀을 만드는 곤충은?', '꿀벌', '개미', '무당벌레'], ['거미줄을 치는 동물은?', '거미', '개미', '나비'],
    ['알을 낳는 동물은?', '닭', '강아지', '고양이'], ['새끼를 낳아 젖을 먹이는 동물은?', '소', '닭', '개구리'],
    ['날개가 있어 하늘을 나는 동물은?', '참새', '토끼', '거북'], ['아가미로 숨을 쉬는 동물은?', '물고기', '강아지', '참새'],
    ['겨울잠을 자는 동물은?', '곰', '참새', '소'], ['다리가 없는 동물은?', '뱀', '개미', '거미'],
    ['등에 딱딱한 등딱지가 있는 동물은?', '거북', '토끼', '사슴'], ['코가 아주 긴 동물은?', '코끼리', '기린', '하마'],
    ['목이 아주 긴 동물은?', '기린', '코끼리', '돼지'], ['밤에 활동하는 새는?', '부엉이', '참새', '닭'],
    ['식물의 뿌리가 하는 일은?', '물을 빨아들여요', '노래를 해요', '하늘을 날아요'], ['해바라기 꽃은 무슨 색일까요?', '노란색', '파란색', '검은색'],
    ['사과가 열리는 곳은?', '나무', '땅속', '물속'], ['땅속에서 자라 캐 먹는 것은?', '감자', '사과', '포도'],
    ['물을 끓이면 올라오는 것은?', '김', '얼음', '모래'], ['설탕이 더 잘 녹는 물은?', '따뜻한 물', '차가운 물', '얼음물'],
    ['얼음을 햇볕에 두면?', '녹아요', '커져요', '단단해져요'], ['그림자가 생기려면 꼭 필요한 것은?', '빛', '소리', '냄새'],
    ['손전등이 빛을 내려면 필요한 것은?', '건전지', '물', '모래'], ['쇠로 만든 물건은?', '못', '지우개', '종이컵'],
    ['유리로 만든 물건은?', '유리컵', '고무공', '나무 의자'], ['고무로 만든 물건은?', '고무장갑', '유리병', '쇠숟가락'],
    ['잡아당기면 잘 늘어나는 것은?', '고무줄', '유리컵', '돌멩이'], ['공기가 들어 있어 통통 튀는 것은?', '공', '돌', '책'],
    ['바람이 불면 빙글빙글 도는 것은?', '바람개비', '연필', '접시'], ['지구에서 가장 넓은 곳을 차지하는 것은?', '바다', '강', '호수'],
    ['바닷물의 맛은?', '짜요', '달아요', '아무 맛 없어요'], ['화산에서 흘러나오는 뜨거운 것은?', '용암', '얼음', '눈'],
    ['땅이 흔들리는 것을 무엇이라 할까요?', '지진', '무지개', '번개'], ['지진이 나면 먼저 할 일은?', '탁자 밑에 몸을 숨겨요', '엘리베이터를 타요', '창가로 가요'],
    ['불이 나면 먼저 할 일은?', '불이야 외치고 밖으로 나가요', '옷장에 숨어요', '물건부터 챙겨요'], ['불을 끌 때 쓰는 것은?', '소화기', '선풍기', '부채'],
    ['낮과 밤이 생기는 까닭은?', '지구가 돌아서', '달이 커져서', '구름이 많아서'], ['하루는 몇 시간일까요?', '24시간', '12시간', '100시간'],
    ['한 해는 몇 달일까요?', '12달', '10달', '7달'], ['일주일은 며칠일까요?', '7일', '5일', '10일'],
    ['밤하늘에 반짝이는 것은?', '별', '무지개', '해'], ['사람이 달에 갈 때 탄 것은?', '우주선', '기차', '배'],
    ['지구 둘레를 도는 달은 몇 개일까요?', '1개', '2개', '10개'], ['사람이 숨 쉴 때 꼭 필요한 것은?', '산소', '모래', '소금'],
    ['물을 주지 않으면 식물은?', '시들어요', '더 커져요', '꽃이 많아져요'], ['개구리가 사는 곳은?', '연못', '사막', '구름 위'],
    ['다람쥐가 좋아하는 먹이는?', '도토리', '생선', '사탕'], ['토끼가 좋아하는 먹이는?', '당근', '고기', '생선'],
    ['판다가 좋아하는 먹이는?', '대나무', '생선', '치즈'], ['물고기가 헤엄칠 때 쓰는 것은?', '지느러미', '날개', '뿔'],
    ['새가 날 때 쓰는 것은?', '날개', '지느러미', '뿔'], ['바다거북이 알을 낳는 곳은?', '모래밭', '나뭇가지', '구름 위'],
    ['개미는 어디에 집을 지을까요?', '땅속', '물속', '구름 위'], ['벌집 한 칸의 모양은?', '육각형', '동그라미', '별 모양'],
    ['꽃가루를 옮겨 주는 곤충은?', '벌', '모기', '바퀴벌레'], ['모기가 많은 계절은?', '여름', '겨울', '한겨울 눈 오는 날'],
    ['눈사람이 녹는 까닭은?', '날이 따뜻해져서', '바람이 없어서', '밤이 와서'], ['물웅덩이 물이 줄어드는 까닭은?', '물이 증발해서', '물이 얼어서', '물이 무거워져서'],
    ['얼음물 컵 바깥에 맺히는 것은?', '물방울', '모래', '연기'], ['그늘보다 햇빛 아래는 어떨까요?', '따뜻해요', '차가워요', '어두워요'],
    ['빛을 가장 잘 통과시키는 것은?', '투명한 유리', '나무판', '두꺼운 책'], ['돋보기로 보면 물체가 어떻게 보일까요?', '크게 보여요', '작게 보여요', '사라져요'],
    ['멀리 있는 별을 볼 때 쓰는 도구는?', '망원경', '현미경', '온도계'], ['아주 작은 것을 크게 보는 도구는?', '현미경', '망원경', '온도계'],
    ['온도를 재는 도구는?', '온도계', '저울', '자'], ['무게를 재는 도구는?', '저울', '온도계', '시계'],
    ['길이를 재는 도구는?', '자', '저울', '컵'], ['시간을 알려 주는 것은?', '시계', '저울', '자'],
    ['방향을 알려 주는 도구는?', '나침반', '돋보기', '온도계'], ['나침반 바늘이 가리키는 방향은?', '북쪽', '서쪽', '위쪽'],
    ['감기를 막는 좋은 습관은?', '손 씻기', '손톱 물어뜯기', '늦게 자기'], ['키가 크려면 필요한 것은?', '골고루 먹고 푹 자기', '사탕만 먹기', '밤새 게임하기'],
    ['젖니가 빠진 자리에 새로 나는 이는?', '영구치', '젖니', '틀니'], ['한 손의 손가락은 몇 개일까요?', '5개', '4개', '6개'],
    ['빨간 신호등은 무슨 뜻일까요?', '멈춰요', '건너요', '뛰어요'], ['초록 신호등에서는 어떻게 할까요?', '좌우를 보고 건너요', '멈춰 서서 기다려요', '뒤로 걸어요'],
    ['비 오는 날 쓰는 것은?', '우산', '선글라스', '부채'], ['추운 날 입는 것은?', '두꺼운 외투', '수영복', '반바지'],
    ['계곡물은 어디로 흘러갈까요?', '낮은 곳', '높은 곳', '하늘'], ['강물이 모여 마지막에 가는 곳은?', '바다', '산꼭대기', '사막'],
    ['나무를 많이 심으면 좋은 점은?', '공기가 맑아져요', '시끄러워져요', '비가 안 와요'], ['쓰레기를 종류별로 나눠 버리는 것은?', '분리배출', '재채기', '낮잠'],
    ['다시 쓸 수 있게 모으는 것은?', '유리병', '바나나 껍질', '쓴 휴지'], ['해가 진 뒤 하늘은 어떻게 될까요?', '어두워져요', '더 밝아져요', '초록색이 돼요'],
    ['국자 모양의 별 일곱 개는?', '북두칠성', '은하수', '무지개'], ['태양계에서 가장 큰 행성은?', '목성', '지구', '화성'],
    ['붉은 행성이라고 불리는 것은?', '화성', '금성', '지구'], ['멋진 고리가 있는 행성은?', '토성', '화성', '지구'],
    ['공룡은 지금 어떻게 되었을까요?', '옛날에 살다 사라졌어요', '동물원에 많아요', '우리 집 마당에 살아요'], ['화석은 무엇일까요?', '옛 생물의 흔적이 돌에 남은 것', '반짝이는 보석', '얼음 조각'],
    ['달팽이가 지나간 자리에 남는 것은?', '끈적한 자국', '모래성', '발자국'], ['무당벌레 등의 무늬는?', '점무늬', '줄무늬', '체크무늬'],
    ['얼룩말의 무늬는?', '줄무늬', '점무늬', '꽃무늬'], ['카멜레온이 잘하는 것은?', '몸 색 바꾸기', '하늘 날기', '노래하기'],
    ['박쥐는 주로 언제 활동할까요?', '밤', '아침', '한낮'], ['연어가 알을 낳으러 거슬러 올라가는 곳은?', '강', '사막', '산꼭대기'],
    ['오리 발가락 사이에 있는 것은?', '물갈퀴', '날개', '지느러미'], ['고슴도치 몸을 덮고 있는 것은?', '가시', '비늘', '깃털'],
    ['물고기 몸을 덮고 있는 것은?', '비늘', '깃털', '털'], ['새의 몸을 덮고 있는 것은?', '깃털', '비늘', '가시'],
    ['바나나가 노랗게 되는 까닭은?', '익어서', '추워서', '비가 와서'], ['마른 콩을 물에 불리면?', '커져요', '작아져요', '사라져요'],
    ['스스로 빛을 내는 것은?', '해', '달', '구름'], ['바람이 강하게 불고 비가 많이 오는 여름 날씨는?', '태풍', '황사', '서리'],
    ['아침에 풀잎에 맺힌 작은 물방울은?', '이슬', '우박', '눈송이'], ['얼음 알갱이가 하늘에서 떨어지는 것은?', '우박', '무지개', '안개'],
    ['코끼리가 물을 마실 때 쓰는 것은?', '코', '꼬리', '귀'], ['캥거루가 새끼를 넣고 다니는 곳은?', '배 주머니', '등', '입'],
    ['병아리가 깨고 나오는 것은?', '알', '씨앗', '고치'], ['누에가 실을 뽑아 만드는 집은?', '고치', '둥지', '굴'],
    ['새가 알을 낳고 품는 곳은?', '둥지', '어항', '벌집'], ['가을에 나무에서 떨어지는 것은?', '낙엽', '눈', '얼음'],
    ['소금물을 햇볕에 두어 물이 마르면 남는 것은?', '소금', '설탕', '모래'], ['물, 우유, 주스는 모두 무엇일까요?', '액체', '돌', '기체'],
    ['풍선 속을 채운 것은?', '공기', '모래', '물감'], ['비누로 손을 씻으면 없어지는 것은?', '세균', '손톱', '손가락'],
    ['식물의 잎이 하는 일은?', '햇빛으로 양분을 만들어요', '땅속을 파요', '소리를 내요'], ['우리 몸을 지탱하는 단단한 것은?', '뼈', '머리카락', '손톱'],
    ['자석의 두 극은?', 'N극과 S극', '빨강과 파랑', '위와 아래'], ['같은 극끼리 자석을 가까이하면?', '밀어내요', '붙어요', '녹아요'],
    ['물을 얼리면 부피는?', '조금 커져요', '조금 작아져요', '사라져요'], ['메아리는 무엇이 되돌아오는 것일까요?', '소리', '빛', '냄새'],
    ['낮에 생기는 그림자가 가장 짧은 때는?', '한낮', '해 뜰 때', '해 질 때'], ['개가 냄새를 잘 맡는 까닭은?', '코가 예민해서', '귀가 커서', '꼬리가 길어서']
  ];
  // 책 읽기: 낱말 문제 [문제, 정답, 오답, 오답]
  const BTQ_KOR = [
    // 반대말
    ["'크다'의 반대말은?", '작다', '높다', '길다'], ["'덥다'의 반대말은?", '춥다', '밝다', '빠르다'], ["'높다'의 반대말은?", '낮다', '넓다', '짧다'],
    ["'길다'의 반대말은?", '짧다', '좁다', '낮다'], ["'많다'의 반대말은?", '적다', '크다', '가볍다'], ["'무겁다'의 반대말은?", '가볍다', '어둡다', '느리다'],
    ["'빠르다'의 반대말은?", '느리다', '작다', '얇다'], ["'밝다'의 반대말은?", '어둡다', '춥다', '좁다'], ["'넓다'의 반대말은?", '좁다', '짧다', '낮다'],
    ["'깊다'의 반대말은?", '얕다', '넓다', '무겁다'], ["'두껍다'의 반대말은?", '얇다', '좁다', '작다'], ["'기쁘다'의 반대말은?", '슬프다', '배고프다', '졸리다'],
    ["'쉽다'의 반대말은?", '어렵다', '느리다', '무겁다'], ["'가깝다'의 반대말은?", '멀다', '좁다', '낮다'], ["'열다'의 반대말은?", '닫다', '자르다', '접다'],
    ["'들어가다'의 반대말은?", '나오다', '올라가다', '앉다'], ["'올라가다'의 반대말은?", '내려가다', '들어가다', '달려가다'], ["'앞'의 반대말은?", '뒤', '옆', '위'],
    ["'위'의 반대말은?", '아래', '앞', '옆'], ["'낮'의 반대말은?", '밤', '아침', '저녁'], ["'오른쪽'의 반대말은?", '왼쪽', '위쪽', '앞쪽'],
    ["'시작'의 반대말은?", '끝', '처음', '중간'], ["'같다'의 반대말은?", '다르다', '닮다', '크다'], ["'깨끗하다'의 반대말은?", '더럽다', '조용하다', '시원하다'],
    ["'웃다'의 반대말은?", '울다', '뛰다', '자다'], ["'주다'의 반대말은?", '받다', '놓다', '찾다'], ["'사다'의 반대말은?", '팔다', '주다', '먹다'],
    ["'이기다'의 반대말은?", '지다', '비기다', '달리다'], ["'입다'의 반대말은?", '벗다', '신다', '쓰다'], ["'켜다'의 반대말은?", '끄다', '열다', '누르다'],
    ["'따뜻하다'의 반대말은?", '차갑다', '부드럽다', '맛있다'], ["'젖다'의 반대말은?", '마르다', '녹다', '얼다'], ["'새것'의 반대말은?", '헌것', '큰것', '좋은것'],
    ["'일어나다'의 반대말은?", '눕다', '걷다', '뛰다'], ["'안'의 반대말은?", '밖', '위', '옆'],
    // 맞춤법
    ['바르게 쓴 것은?', '깨끗하다', '깨끄타다', '깨끝하다'], ['바르게 쓴 것은?', '설거지', '설겆이', '설거찌'], ['바르게 쓴 것은?', '며칠', '몇일', '몇칠'],
    ['바르게 쓴 것은?', '어떡해', '어떻해', '어떠캐'], ['바르게 쓴 것은?', '왠지', '웬지', '왼지'], ['바르게 쓴 것은?', '금세', '금새', '금쌔'],
    ['바르게 쓴 것은?', '베개', '배게', '베게'], ['바르게 쓴 것은?', '찌개', '찌게', '찌깨'], ['바르게 쓴 것은?', '오랜만에', '오랫만에', '오랜마네'],
    ['바르게 쓴 것은?', '안 돼요', '안 되요', '않 돼요'], ['바르게 쓴 것은?', '됐어요', '됬어요', '됏어요'], ['바르게 쓴 것은?', '할게요', '할께요', '할개요'],
    ['바르게 쓴 것은?', '곰곰이', '곰곰히', '곰곰니'], ['바르게 쓴 것은?', '깨끗이', '깨끗히', '깨끄시'], ['바르게 쓴 것은?', '틈틈이', '틈틈히', '틈틈니'],
    ['바르게 쓴 것은?', '떡볶이', '떡볶기', '떡뽁이'], ['바르게 쓴 것은?', '눈곱', '눈꼽', '눈곰'], ['바르게 쓴 것은?', '해님', '햇님', '핸님'],
    ['바르게 쓴 것은?', '숟가락', '숫가락', '숟갈락'], ['바르게 쓴 것은?', '젓가락', '젇가락', '젓갈락'], ['바르게 쓴 것은?', '무릎', '무릅', '무릇'],
    ['바르게 쓴 것은?', '부엌', '부억', '부엇'], ['바르게 쓴 것은?', '꽃잎', '꼿잎', '꽃입'], ['바르게 쓴 것은?', '웃어른', '윗어른', '우어른'],
    ['바르게 쓴 것은?', '아니에요', '아니예요', '아니애요'], ['바르게 쓴 것은?', '꼼꼼히', '꼼꼼이', '꼼꼼니'], ['바르게 쓴 것은?', '닭', '닥', '닯'],
    ['바르게 쓴 것은?', '희한하다', '히한하다', '희안하다'], ['바르게 쓴 것은?', '돌멩이', '돌맹이', '돌멩니'], ['바르게 쓴 것은?', '나뭇잎', '나무잎', '나묻잎'],
    // 흉내 내는 말
    ['소리를 흉내 낸 말은?', '멍멍', '반짝반짝', '엉금엉금'], ['모양을 흉내 낸 말은?', '깡충깡충', '야옹', '딩동'], ['닭 울음소리는?', '꼬끼오', '음매', '꽥꽥'],
    ['오리 울음소리는?', '꽥꽥', '멍멍', '꿀꿀'], ['돼지 울음소리는?', '꿀꿀', '야옹', '짹짹'], ['소 울음소리는?', '음매', '짹짹', '개굴개굴'],
    ['참새 울음소리는?', '짹짹', '음매', '어흥'], ['개구리 울음소리는?', '개굴개굴', '꿀꿀', '야옹'], ['호랑이 울음소리는?', '어흥', '짹짹', '꽥꽥'],
    ['별이 빛나는 모양은?', '반짝반짝', '쿵쿵', '멍멍'], ['거북이 느릿느릿 기어가는 모양은?', '엉금엉금', '깡충깡충', '훨훨'], ['새가 날아가는 모양은?', '훨훨', '엉금엉금', '뒤뚱뒤뚱'],
    ['비가 많이 내리는 소리는?', '주룩주룩', '반짝반짝', '살금살금'], ['문을 두드리는 소리는?', '똑똑', '훨훨', '살랑살랑'], ['몰래 조용히 걷는 모양은?', '살금살금', '쿵쾅쿵쾅', '펄쩍펄쩍'],
    ['바람이 부드럽게 부는 모양은?', '살랑살랑', '쾅쾅', '뻘뻘'], ['크게 웃는 소리는?', '하하', '엉엉', '콜록콜록'], ['크게 우는 소리는?', '엉엉', '하하', '깔깔'],
    ['기침하는 소리는?', '콜록콜록', '하하', '쿨쿨'], ['깊이 잠든 모양은?', '쿨쿨', '깡충깡충', '짹짹'], ['배고플 때 배에서 나는 소리는?', '꼬르륵', '딩동', '짹짹'],
    ['오리가 걷는 모양은?', '뒤뚱뒤뚱', '훨훨', '반짝반짝'], ['초인종 소리는?', '딩동', '음매', '쿨쿨'],
    // 아닌 것 찾기
    ['과일이 아닌 것은?', '당근', '사과', '바나나'], ['탈것이 아닌 것은?', '연필', '버스', '기차'], ['동물이 아닌 것은?', '의자', '토끼', '여우'],
    ['계절이 아닌 것은?', '아침', '봄', '가을'], ['악기가 아닌 것은?', '숟가락', '피아노', '북'], ['학용품이 아닌 것은?', '냄비', '연필', '지우개'],
    ['채소가 아닌 것은?', '포도', '오이', '배추'], ['운동이 아닌 것은?', '낮잠', '축구', '줄넘기'], ['날씨를 나타내는 말이 아닌 것은?', '책상', '비', '눈'],
    ['몸의 한 부분이 아닌 것은?', '모자', '팔', '다리'], ['옷이 아닌 것은?', '우산', '치마', '바지'], ['꽃이 아닌 것은?', '소나무', '장미', '튤립'],
    ['새가 아닌 것은?', '박쥐', '참새', '비둘기'], ['바다에 사는 동물이 아닌 것은?', '다람쥐', '고래', '문어'], ['가구가 아닌 것은?', '사과', '침대', '책상'],
    ['색깔을 나타내는 말이 아닌 것은?', '동그라미', '빨강', '노랑'], ['먹을 수 없는 것은?', '돌멩이', '밥', '빵'], ['곤충이 아닌 것은?', '거미', '나비', '개미'],
    // 알맞은 말 넣기
    ["'토끼가 깡충깡충 ( ).' 알맞은 말은?", '뛰어요', '헤엄쳐요', '날아요'], ["'물고기가 물속에서 ( ).' 알맞은 말은?", '헤엄쳐요', '날아요', '기어요'],
    ["'새가 하늘을 ( ).' 알맞은 말은?", '날아요', '헤엄쳐요', '굴러요'], ["'밥 먹기 전에 손을 ( ).' 알맞은 말은?", '씻어요', '던져요', '접어요'],
    ["'책을 ( ).' 알맞은 말은?", '읽어요', '마셔요', '신어요'], ["'신발을 ( ).' 알맞은 말은?", '신어요', '입어요', '써요'],
    ["'모자를 ( ).' 알맞은 말은?", '써요', '신어요', '먹어요'], ["'옷을 ( ).' 알맞은 말은?", '입어요', '신어요', '써요'],
    ["'장갑을 ( ).' 알맞은 말은?", '껴요', '써요', '마셔요'], ["'우유를 ( ).' 알맞은 말은?", '마셔요', '신어요', '읽어요'],
    ["'노래를 ( ).' 알맞은 말은?", '불러요', '먹어요', '입어요'], ["'그림을 ( ).' 알맞은 말은?", '그려요', '불러요', '마셔요'],
    ["'피아노를 ( ).' 알맞은 말은?", '쳐요', '입어요', '먹어요'], ["'선물을 받아서 ( ).' 알맞은 말은?", '기뻐요', '슬퍼요', '아파요'],
    ["'넘어져서 무릎이 ( ).' 알맞은 말은?", '아파요', '맛있어요', '반짝여요'], ["'봄에는 꽃이 ( ).' 알맞은 말은?", '피어요', '녹아요', '얼어요'],
    ["'겨울에는 눈이 ( ).' 알맞은 말은?", '와요', '피어요', '익어요'], ["'가을에는 사과가 빨갛게 ( ).' 알맞은 말은?", '익어요', '녹아요', '피어요'],
    ["'졸려서 하품을 ( ).' 알맞은 말은?", '해요', '마셔요', '그려요'], ["'친구에게 편지를 ( ).' 알맞은 말은?", '써요', '신어요', '마셔요'],
    // 높임말
    ["'밥'의 높임말은?", '진지', '밥알', '반찬'], ["'집'의 높임말은?", '댁', '방', '마당'], ["'나이'의 높임말은?", '연세', '키', '이름'],
    ["'이름'의 높임말은?", '성함', '별명', '글씨'], ["'자다'의 높임말은?", '주무시다', '먹다', '일어나다'], ["'먹다'의 높임말은?", '드시다', '마시다', '먹이다'],
    ["'있다'의 높임말은?", '계시다', '없다', '주다'], ["'말'의 높임말은?", '말씀', '말투', '말풍선'], ["'아프다'의 높임말은?", '편찮으시다', '아프다', '슬프다'],
    ["'할머니께 선물을 ( ).' 알맞은 말은?", '드려요', '줘요', '받아요'],
    // 세는 말
    ["'연필 한 ( )' 알맞은 말은?", '자루', '마리', '켤레'], ["'신발 한 ( )' 알맞은 말은?", '켤레', '자루', '장'], ["'종이 한 ( )' 알맞은 말은?", '장', '마리', '그루'],
    ["'나무 한 ( )' 알맞은 말은?", '그루', '켤레', '자루'], ["'강아지 한 ( )' 알맞은 말은?", '마리', '장', '켤레'], ["'책 한 ( )' 알맞은 말은?", '권', '마리', '그루'],
    ["'자동차 한 ( )' 알맞은 말은?", '대', '권', '장'], ["'집 한 ( )' 알맞은 말은?", '채', '마리', '켤레'], ["'꽃 한 ( )' 알맞은 말은?", '송이', '켤레', '대'],
    ["'옷 한 ( )' 알맞은 말은?", '벌', '그루', '송이'], ["'양말 한 ( )' 알맞은 말은?", '켤레', '권', '그루'], ["'사람 한 ( )' 알맞은 말은?", '명', '그루', '장'],
    ["'물 한 ( )' 알맞은 말은?", '잔', '켤레', '그루'], ["'밥 한 ( )' 알맞은 말은?", '그릇', '켤레', '권'],
    // 비슷한 말
    ["'기쁘다'와 뜻이 비슷한 말은?", '즐겁다', '슬프다', '무섭다'], ["'예쁘다'와 뜻이 비슷한 말은?", '아름답다', '더럽다', '무겁다'],
    ["'크다'와 뜻이 비슷한 말은?", '커다랗다', '조그맣다', '좁다'], ["'말하다'와 뜻이 비슷한 말은?", '이야기하다', '듣다', '잠자다'],
    ["'빠르다'와 뜻이 비슷한 말은?", '재빠르다', '느리다', '늦다'], ["'걱정하다'와 뜻이 비슷한 말은?", '염려하다', '웃다', '뽐내다'],
    ["'시작하다'와 뜻이 비슷한 말은?", '출발하다', '끝내다', '멈추다'], ["'고맙다'와 뜻이 비슷한 말은?", '감사하다', '미안하다', '심심하다']
  ];
  /* 숲속 대결 문제를 한 주마다 바꿔요. 새로 쓴 세 주치(A, B, C)를 한국 시간 월요일마다 돌리고, 기존 문제도 세 몫으로 나눠 그 주에 함께 내요
     A주 과학은 동물과 식물, 국어는 반대말과 속담. B주 과학은 날씨와 땅과 우주, 국어는 맞춤법과 높임말. C주 과학은 우리 몸과 물질과 안전, 국어는 흉내 내는 말과 끝말잇기
     수학은 A주 사칙연산, B주 빈칸 채우기, C주 뛰어 세기. 그리기(색 기억)는 B주만 거꾸로 누르기 */
  const BTQ_SCI_W = [
    [
      ["코알라가 먹는 잎은?", "유칼립투스 잎", "대나무 잎", "배추 잎"],
      ["젖소가 주는 것은?", "우유", "달걀", "꿀"],
      ["양에게서 얻는 것은?", "털", "꿀", "달걀"],
      ["누에가 먹는 잎은?", "뽕잎", "솔잎", "대나무 잎"],
      ["개구리가 혀로 잡아먹는 것은?", "파리", "도토리", "당근"],
      ["딱따구리가 부리로 쪼는 곳은?", "나무줄기", "바위", "물속"],
      ["두더지가 사는 곳은?", "땅속", "나무 위", "바닷속"],
      ["물과 땅을 오가며 사는 동물은?", "개구리", "참새", "토끼"],
      ["날지 못하는 새는?", "타조", "참새", "제비"],
      ["지구에서 가장 큰 동물은?", "흰수염고래", "코끼리", "기린"],
      ["치타가 가장 잘하는 것은?", "빨리 달리기", "헤엄치기", "나무 타기"],
      ["나비가 꿀을 빠는 입의 모양은?", "대롱 모양", "부리 모양", "집게 모양"],
      ["곤충의 몸은 몇 부분으로 나뉠까요?", "3부분", "2부분", "5부분"],
      ["거미의 몸은 몇 부분으로 나뉠까요?", "2부분", "3부분", "4부분"],
      ["잠자리 날개는 몇 장일까요?", "4장", "2장", "6장"],
      ["매미가 가장 많이 우는 계절은?", "여름", "겨울", "봄"],
      ["반딧불이 몸에서 나오는 것은?", "빛", "연기", "물"],
      ["개구리가 겨울에 하는 것은?", "겨울잠", "이사", "털갈이"],
      ["제비가 겨울이 오면 하는 것은?", "따뜻한 남쪽으로 가요", "겨울잠을 자요", "털이 하얘져요"],
      ["애벌레가 나비가 되기 전 모습은?", "번데기", "알", "둥지"],
      ["개구리 알이 있는 곳은?", "물속", "나무 위", "모래 속"],
      ["뱀이 자라면서 벗는 것은?", "허물", "깃털", "뿔"],
      ["달팽이가 위험할 때 숨는 곳은?", "껍데기 속", "땅속 굴", "나뭇잎 밑"],
      ["오징어 다리는 몇 개일까요?", "10개", "8개", "6개"],
      ["문어 다리는 몇 개일까요?", "8개", "10개", "6개"],
      ["불가사리가 사는 곳은?", "바다", "사막", "숲"],
      ["상어는 무엇일까요?", "물고기", "새", "곤충"],
      ["돌고래가 숨 쉬는 곳은?", "폐", "아가미", "지느러미"],
      ["펭귄이 잘하는 것은?", "헤엄치기", "하늘 날기", "나무 타기"],
      ["북극곰 털은 무슨 색으로 보일까요?", "흰색", "검은색", "빨간색"],
      ["낙타 등에 있는 것은?", "혹", "날개", "등딱지"],
      ["비버가 나뭇가지로 쌓는 것은?", "댐", "벌집", "거미줄"],
      ["꿀벌이 꿀을 모으는 곳은?", "꽃", "돌", "물웅덩이"],
      ["개미가 줄지어 갈 때 따라가는 것은?", "냄새", "소리", "불빛"],
      ["토끼 귀가 긴 까닭은?", "소리를 잘 들으려고", "하늘을 날려고", "헤엄치려고"],
      ["씨앗이 싹트려면 꼭 필요한 것은?", "물", "소금", "설탕"],
      ["선인장이 잘 자라는 곳은?", "사막", "바닷속", "남극"],
      ["선인장의 잎은 어떤 모양일까요?", "가시", "넓적한 잎", "꽃잎"],
      ["연꽃이 자라는 곳은?", "연못", "사막", "바위 위"],
      ["민들레 씨앗이 퍼지는 방법은?", "바람에 날려서", "물에 녹아서", "땅을 파서"],
      ["도꼬마리 열매가 퍼지는 방법은?", "동물 털에 붙어서", "바람에 날려서", "물에 떠서"],
      ["봉숭아 씨앗이 퍼지는 방법은?", "꼬투리가 터져서", "물에 떠서", "바람에 날려서"],
      ["소나무 잎의 모양은?", "바늘 모양", "손바닥 모양", "하트 모양"],
      ["겨울에도 잎이 푸른 나무는?", "소나무", "은행나무", "단풍나무"],
      ["가을에 노랗게 물드는 부채 모양 잎은?", "은행잎", "솔잎", "대나무 잎"],
      ["벼에서 얻는 곡식은?", "쌀", "밀", "콩"],
      ["고구마는 식물의 어느 부분일까요?", "뿌리", "잎", "꽃"],
      ["감자는 식물의 어느 부분일까요?", "줄기", "꽃", "열매"],
      ["꽃이 지고 나면 생기는 것은?", "열매", "뿌리", "새싹"],
      ["식물이 잎에서 내보내는 기체는?", "산소", "연기", "먼지"],
      ["콩나물을 어두운 곳에서 기르면 무슨 색?", "노란색", "초록색", "빨간색"],
      ["해바라기 씨앗이 있는 곳은?", "꽃 가운데", "뿌리", "줄기 속"],
      ["딸기 씨는 어디에 있을까요?", "겉에 콕콕", "가운데 큰 씨 하나", "씨가 없어요"],
      ["나무의 나이를 알 수 있는 것은?", "나이테", "나뭇잎 수", "가지 길이"],
      ["식물의 줄기가 하는 일은?", "물이 지나가는 길", "소리 듣기", "냄새 맡기"],
      ["파리지옥이 잡아먹는 것은?", "곤충", "돌멩이", "물고기"],
      ["버섯은 무엇으로 퍼질까요?", "홀씨", "씨앗", "알"],
      ["곰팡이가 잘 자라는 곳은?", "축축하고 따뜻한 곳", "바싹 마른 곳", "얼음 속"],
      ["씨앗 속에 들어 있는 것은?", "어린 식물", "작은 돌", "물고기 알"],
      ["나팔꽃 덩굴이 자라는 모습은?", "막대를 감고 올라가요", "땅속으로 파고들어요", "물에 둥둥 떠요"],
      ["고추가 다 익으면 무슨 색?", "빨간색", "파란색", "하얀색"],
      ["기린이 높은 잎을 먹을 수 있는 까닭은?", "목이 길어서", "날개가 있어서", "꼬리가 길어서"],
      ["얼룩말이 사는 곳은?", "초원", "바닷속", "남극"],
      ["원숭이가 잘하는 것은?", "나무 타기", "물속에서 숨쉬기", "알 낳기"],
      ["개구리 뒷다리가 하는 일은?", "높이 뛰기", "하늘 날기", "숨쉬기"],
      ["알에서 깨어나는 동물은?", "거북", "강아지", "고래"],
      ["새끼에게 젖을 먹이는 바다 동물은?", "고래", "상어", "오징어"],
      ["나무늘보의 특징은?", "아주 느리게 움직여요", "아주 빨리 달려요", "물속에서만 살아요"],
      ["고슴도치가 위험할 때 하는 것은?", "몸을 동그랗게 말아요", "하늘로 날아요", "물에 뛰어들어요"],
      ["다람쥐가 겨울을 나려고 하는 것은?", "먹이를 모아 둬요", "털을 다 깎아요", "바다로 가요"],
      ["게가 걷는 방향은?", "옆으로", "앞으로만", "위로"],
      ["조개가 많이 사는 곳은?", "갯벌", "나무 위", "사막"],
      ["소가 먹는 것은?", "풀", "고기", "생선"],
      ["사자가 먹는 것은?", "고기", "풀", "꽃"],
      ["애벌레가 갉아 먹는 것은?", "잎", "돌", "모래"],
      ["메뚜기가 잘하는 것은?", "멀리 뛰기", "헤엄치기", "땅 파기"],
      ["지렁이가 사는 곳은?", "흙 속", "물 위", "구름 위"],
      ["지렁이가 하는 좋은 일은?", "흙을 기름지게 해요", "꽃을 따요", "노래를 불러요"],
      ["참새의 부리 모양은?", "짧고 뾰족해요", "아주 길고 휘었어요", "넓적한 삽 모양이에요"],
      ["오리의 부리 모양은?", "넓적해요", "바늘처럼 가늘어요", "갈고리처럼 휘었어요"]
    ],
    [
      ["비는 어디에서 내릴까요?", "구름", "땅속", "바다 밑"],
      ["안개가 끼면 어떻게 될까요?", "멀리 잘 안 보여요", "더 잘 보여요", "하늘이 초록색이 돼요"],
      ["바람은 무엇이 움직이는 걸까요?", "공기", "물", "빛"],
      ["서리가 생기는 때는?", "추운 아침", "더운 한낮", "비 오는 저녁"],
      ["고드름은 무엇이 언 것일까요?", "물", "모래", "우유"],
      ["황사는 무엇이 날아오는 걸까요?", "모래 먼지", "눈송이", "꽃잎"],
      ["장마는 어느 계절에 올까요?", "여름", "겨울", "가을"],
      ["일기 예보가 알려 주는 것은?", "날씨", "시험 점수", "버스 요금"],
      ["하루 중 기온이 가장 높은 때는?", "한낮", "새벽", "한밤"],
      ["구름이 하늘을 다 덮은 날씨는?", "흐림", "맑음", "무지개"],
      ["높은 산에 오를수록 공기는?", "차가워져요", "뜨거워져요", "달콤해져요"],
      ["돌이 오랫동안 부서져 작아진 것은?", "모래", "얼음", "구름"],
      ["바닷물이 빠지면 드러나는 진흙 땅은?", "갯벌", "사막", "빙하"],
      ["밀물과 썰물이 생기는 곳은?", "바다", "연못", "사막"],
      ["높이 솟은 큰 땅은?", "산", "강", "호수"],
      ["아주 큰 얼음덩어리가 천천히 흐르는 것은?", "빙하", "폭포", "호수"],
      ["물이 높은 곳에서 떨어지는 곳은?", "폭포", "연못", "갯벌"],
      ["동굴 천장에 고드름처럼 달린 돌은?", "종유석", "화석", "조약돌"],
      ["한라산은 무엇이 만든 산일까요?", "화산", "빙하", "바람"],
      ["지구를 둘러싼 공기층은?", "대기", "바다", "땅속"],
      ["지구는 무엇의 둘레를 돌까요?", "해", "달", "화성"],
      ["달은 무엇의 둘레를 돌까요?", "지구", "토성", "금성"],
      ["해처럼 스스로 빛나는 것은?", "별", "달", "행성"],
      ["동그랗게 꽉 찬 달은?", "보름달", "초승달", "반달"],
      ["눈썹처럼 가는 달은?", "초승달", "보름달", "반달"],
      ["반쪽만 보이는 달은?", "반달", "보름달", "초승달"],
      ["태양계 행성은 모두 몇 개일까요?", "8개", "9개", "12개"],
      ["해와 가장 가까운 행성은?", "수성", "지구", "토성"],
      ["샛별이라고 불리는 밝은 행성은?", "금성", "목성", "토성"],
      ["밤하늘에 강처럼 길게 보이는 별 무리는?", "은하수", "무지개", "오로라"],
      ["별똥별은 무엇일까요?", "우주 돌이 타며 빛나는 것", "별이 떨어진 것", "달 조각"],
      ["우주에서 본 지구는 무슨 색이 많을까요?", "파란색", "빨간색", "노란색"],
      ["우주에 없는 것은?", "숨 쉴 공기", "별", "행성"],
      ["우주 비행사가 입는 옷은?", "우주복", "수영복", "잠옷"],
      ["달에서 몸무게를 재면 지구보다?", "가벼워요", "무거워요", "똑같아요"],
      ["해가 떠오르는 것을 무엇이라 할까요?", "해돋이", "해넘이", "한밤"],
      ["해가 지는 것을 무엇이라 할까요?", "해넘이", "해돋이", "새벽"],
      ["계절이 바뀌는 까닭은?", "지구가 기울어 해를 돌아서", "달이 커져서", "바람이 바뀌어서"],
      ["여름에 해가 지는 시각은 겨울보다?", "늦어요", "빨라요", "같아요"],
      ["북쪽 하늘에서 거의 움직이지 않는 별은?", "북극성", "샛별", "은하수"],
      ["지구본은 무엇을 본뜬 것일까요?", "지구", "달", "해"],
      ["지도에서 위쪽은 보통 어느 방향?", "북쪽", "남쪽", "서쪽"],
      ["나침반이 북쪽을 가리키는 까닭은?", "지구가 큰 자석 같아서", "바람이 불어서", "해가 북쪽에 있어서"],
      ["물이 수증기로 날아가는 것은?", "증발", "얼음", "눈"],
      ["구름은 무엇이 모인 것일까요?", "작은 물방울", "솜", "연기"],
      ["공기 중에 물기가 많으면?", "습해요", "건조해요", "바람이 멈춰요"],
      ["바람의 방향을 알아보는 도구는?", "풍향계", "온도계", "저울"],
      ["비가 온 양을 재는 도구는?", "우량계", "온도계", "나침반"],
      ["번개 칠 때 가지 말아야 할 곳은?", "큰 나무 밑", "건물 안", "집 안"],
      ["태풍이 오면 할 일은?", "창문 닫고 집에 있기", "바닷가 가기", "연 날리기"],
      ["봄바람에 날려 재채기 나게 하는 것은?", "꽃가루", "눈송이", "우박"],
      ["겨울에 강물이 꽁꽁 얼면 생기는 것은?", "얼음판", "모래밭", "무지개"],
      ["땅속 아주 깊은 곳은 어떨까요?", "아주 뜨거워요", "아주 차가워요", "물만 있어요"],
      ["산과 산 사이 낮은 곳은?", "골짜기", "봉우리", "섬"],
      ["바다로 둘러싸인 땅은?", "섬", "산", "사막"],
      ["석탄과 석유는 무엇에서 생겼을까요?", "옛 생물", "얼음", "구름"],
      ["해시계는 무엇으로 시간을 알려 줄까요?", "그림자", "소리", "냄새"],
      ["낮이 가장 긴 날은?", "하지", "동지", "설날"],
      ["밤이 가장 긴 날은?", "동지", "하지", "추석"],
      ["동지에 먹는 음식은?", "팥죽", "송편", "떡국"],
      ["겨울에 우리나라에 부는 찬 바람은 어느 쪽에서?", "북서쪽", "남쪽", "동쪽"],
      ["빗물이 땅속에 스며 모인 물은?", "지하수", "바닷물", "수돗물"],
      ["강이 바다와 만나는 곳은?", "강어귀", "산꼭대기", "골짜기"],
      ["둥글고 매끈한 작은 돌은?", "조약돌", "바위", "용암"],
      ["파도가 바위를 깎는 곳은?", "바닷가", "사막", "하늘"],
      ["오로라를 볼 수 있는 곳은?", "북극 가까운 곳", "사막 한가운데", "열대 섬"],
      ["밤하늘 별을 이어 만든 이름은?", "별자리", "은하수", "태양"],
      ["일식은 무엇이 해를 가리는 걸까요?", "달", "구름", "지구"],
      ["월식 때 달을 가리는 그림자는?", "지구 그림자", "해 그림자", "구름 그림자"],
      ["사람을 처음 달에 보낸 우주선 이름은?", "아폴로 11호", "누리호", "타이타닉"],
      ["우리나라가 만든 우주 발사체는?", "누리호", "아폴로", "보이저"],
      ["인공위성이 하는 일은?", "날씨를 살펴요", "비를 내려요", "바다를 데워요"],
      ["해가 정남쪽에 오는 때는?", "정오쯤", "새벽", "한밤"],
      ["소나기는 어떤 비일까요?", "갑자기 세게 오다 그치는 비", "며칠 동안 오는 비", "얼어서 오는 비"],
      ["눈이 녹아 물이 되는 계절은?", "봄", "한겨울", "늦가을"],
      ["큰 바위를 쪼개기도 하는 것은?", "얼었다 녹는 물", "햇빛 한 줄기", "작은 바람"],
      ["갯벌에 사는 생물은?", "게", "낙타", "다람쥐"],
      ["밤하늘이 맑으면 잘 보이는 것은?", "별", "무지개", "해"],
      ["지구가 해 둘레를 한 바퀴 도는 데 걸리는 시간은?", "1년", "1달", "1주일"],
      ["지구가 스스로 한 바퀴 도는 데 걸리는 시간은?", "하루", "한 달", "한 해"]
    ],
    [
      ["우리 몸에서 가장 긴 뼈가 있는 곳은?", "허벅지", "손가락", "귀"],
      ["머리뼈가 지켜 주는 것은?", "뇌", "위", "발"],
      ["갈비뼈가 지켜 주는 것은?", "심장과 폐", "발가락", "귀"],
      ["음식을 잘게 부수는 것은?", "이", "머리카락", "손톱"],
      ["먹은 음식을 소화하는 곳은?", "위", "폐", "뼈"],
      ["땀이 나는 까닭은?", "몸을 식히려고", "키가 크려고", "배가 불러서"],
      ["달리기를 하면 심장은?", "빨리 뛰어요", "멈춰요", "느려져요"],
      ["눈을 깜빡이는 까닭은?", "눈을 촉촉하게 하려고", "귀를 쉬게 하려고", "코를 시원하게 하려고"],
      ["피부가 하는 일은?", "몸을 감싸 지켜요", "음식을 소화해요", "노래를 불러요"],
      ["근육이 하는 일은?", "몸을 움직여요", "냄새를 맡아요", "빛을 내요"],
      ["재채기할 때 입을 가리기 좋은 것은?", "옷소매", "친구 어깨", "책상"],
      ["물을 자주 마셔야 하는 까닭은?", "몸에 물이 필요해서", "배가 고파지려고", "키가 줄어서"],
      ["채소를 골고루 먹으면?", "몸이 튼튼해져요", "이가 썩어요", "잠이 안 와요"],
      ["충치를 만드는 것은?", "세균", "물", "채소"],
      ["사람의 보통 체온은 몇 도쯤일까요?", "36.5도", "20도", "50도"],
      ["손톱과 머리카락은 어떻게 될까요?", "계속 자라요", "안 자라요", "줄어들어요"],
      ["어두운 곳에서 눈동자는?", "커져요", "작아져요", "사라져요"],
      ["나무로 만든 물건은?", "나무젓가락", "유리컵", "쇠못"],
      ["종이는 무엇으로 만들까요?", "나무", "돌", "유리"],
      ["유리는 무엇을 녹여 만들까요?", "모래", "나무", "우유"],
      ["플라스틱은 주로 무엇으로 만들까요?", "석유", "모래", "우유"],
      ["물에 잘 녹는 것은?", "소금", "모래", "돌"],
      ["물에 녹지 않는 것은?", "모래", "설탕", "소금"],
      ["얼음, 물, 수증기는 모두 무엇일까요?", "물", "공기", "소금"],
      ["고체인 것은?", "돌", "물", "공기"],
      ["기체인 것은?", "공기", "돌", "우유"],
      ["담는 그릇에 따라 모양이 바뀌는 것은?", "물", "돌", "나무토막"],
      ["초콜릿을 따뜻한 손에 오래 쥐면?", "녹아요", "얼어요", "커져요"],
      ["빵을 오래 두면 생기는 것은?", "곰팡이", "보석", "꽃"],
      ["쇠가 젖은 채로 오래되면 생기는 것은?", "녹", "꽃", "얼음"],
      ["전기가 잘 통하는 것은?", "쇠숟가락", "나무젓가락", "고무장갑"],
      ["전기가 통하지 않는 것은?", "고무", "구리선", "쇠못"],
      ["젖은 손으로 콘센트를 만지면?", "위험해요", "괜찮아요", "시원해요"],
      ["전구에 불이 들어오려면 필요한 것은?", "전기", "물", "모래"],
      ["자석 가까이에서 움직이는 것은?", "나침반 바늘", "나뭇잎", "종이"],
      ["막대자석을 반으로 자르면?", "자석이 두 개 돼요", "자석이 사라져요", "고무가 돼요"],
      ["다른 극끼리 자석을 가까이하면?", "붙어요", "밀어내요", "녹아요"],
      ["위로 던진 공이 다시 내려오는 까닭은?", "지구가 끌어당겨서", "바람이 불어서", "공이 지쳐서"],
      ["얼음판이 미끄러운 까닭은?", "마찰이 적어서", "마찰이 커서", "무거워서"],
      ["운동화 바닥이 울퉁불퉁한 까닭은?", "미끄러지지 않으려고", "예뻐 보이려고", "가벼워지려고"],
      ["시소에서 무거운 친구는 어디에 앉을까요?", "가운데 쪽", "맨 끝", "시소 밖"],
      ["소리는 무엇이 떨려서 날까요?", "물체", "빛", "그림자"],
      ["북을 세게 치면 소리는?", "커져요", "작아져요", "사라져요"],
      ["소리가 전해지지 않는 곳은?", "우주", "물속", "교실"],
      ["빛이 거울에 닿으면?", "반사돼요", "사라져요", "얼어요"],
      ["물속 빨대가 꺾여 보이는 까닭은?", "빛이 꺾여서", "빨대가 휘어서", "물이 차가워서"],
      ["그림자가 생기는 쪽은?", "빛의 반대쪽", "빛이 있는 쪽", "물체 속"],
      ["햇볕 아래 더 뜨거워지는 옷 색은?", "검은색", "흰색", "둘 다 같아요"],
      ["늘인 고무줄을 놓으면?", "원래대로 돌아와요", "사라져요", "녹아요"],
      ["돋보기로 햇빛을 한곳에 모으면?", "뜨거워져요", "차가워져요", "어두워져요"],
      ["물놀이 전에 꼭 하면 좋은 것은?", "준비 운동", "낮잠", "밥 많이 먹기"],
      ["가스 냄새가 나면?", "창문 열고 어른께 알려요", "불을 켜 봐요", "그냥 자요"],
      ["자전거를 탈 때 쓰는 것은?", "헬멧", "수영모", "왕관"],
      ["일회용품을 줄이면 좋은 점은?", "쓰레기가 줄어요", "물이 줄어요", "나무가 줄어요"],
      ["빈 페트병을 버리는 곳은?", "플라스틱 분리함", "음식물 통", "화단"],
      ["북극의 얼음이 녹는 까닭은?", "지구가 더워져서", "눈이 많이 와서", "달이 가까워서"],
      ["전기를 아끼는 방법은?", "안 쓰는 불 끄기", "문 열고 에어컨 켜기", "밤새 TV 켜기"],
      ["물을 아끼는 방법은?", "양치할 때 컵 쓰기", "물 틀어 두기", "샤워 오래 하기"],
      ["햇빛으로 전기를 만드는 것은?", "태양광 패널", "선풍기", "냉장고"],
      ["바람으로 전기를 만드는 것은?", "풍력 발전기", "전기난로", "전자레인지"],
      ["음식을 차갑게 보관하는 것은?", "냉장고", "오븐", "전자레인지"],
      ["약은 누가 알려 준 대로 먹어야 할까요?", "의사나 약사", "친구", "아무나"],
      ["산에서 처음 보는 버섯을 찾으면?", "따 먹지 않아요", "바로 먹어요", "친구에게 먹여요"],
      ["뜨거운 냄비를 잡을 때 쓰는 것은?", "주방 장갑", "맨손", "얇은 종이"],
      ["비누 거품이 동그란 까닭은?", "표면이 오므라들어서", "바람이 불어서", "비누가 무거워서"],
      ["식초의 맛은?", "셔요", "달아요", "짜요"],
      ["레몬즙을 맛보면?", "셔요", "달아요", "짜요"],
      ["소금을 물에 녹이면 물맛은?", "짜요", "달아요", "셔요"],
      ["쇠못과 나무토막 중 물에 뜨는 것은?", "나무토막", "쇠못", "둘 다 가라앉아요"],
      ["더운 날 아이스크림이 빨리 녹는 까닭은?", "열을 받아서", "바람이 없어서", "그늘이라서"],
      ["풍선을 문지르면 머리카락이 붙는 까닭은?", "정전기", "자석", "접착제"],
      ["겨울에 문손잡이에서 찌릿한 것은?", "정전기", "번개", "자석"],
      ["물이 얼기 시작하는 온도는?", "0도", "50도", "100도"],
      ["물이 끓는 온도는?", "100도", "0도", "30도"],
      ["우리 몸에서 냄새를 맡는 세포가 있는 곳은?", "코 안쪽", "귓바퀴", "무릎"],
      ["밝은 곳에 오래 있다 어두운 곳에 가면?", "잠깐 잘 안 보여요", "더 밝게 보여요", "소리가 커져요"],
      ["콩, 두부, 달걀에 많은 영양소는?", "단백질", "물", "설탕"],
      ["밥, 빵, 국수에 많은 영양소는?", "탄수화물", "단백질", "비타민"],
      ["귤과 딸기에 많은 영양소는?", "비타민 C", "지방", "소금"],
      ["키보다 높은 곳 물건을 꺼낼 때는?", "어른께 부탁해요", "의자를 쌓아요", "선반을 흔들어요"]
    ]
  ];
  const BTQ_KOR_W = [
    [
      ["'굵다'의 반대말은?", "가늘다", "짧다", "무겁다"],
      ["'부드럽다'의 반대말은?", "거칠다", "가볍다", "느리다"],
      ["'비싸다'의 반대말은?", "싸다", "크다", "좋다"],
      ["'조용하다'의 반대말은?", "시끄럽다", "어둡다", "차갑다"],
      ["'부지런하다'의 반대말은?", "게으르다", "똑똑하다", "용감하다"],
      ["'배부르다'의 반대말은?", "배고프다", "졸리다", "목마르다"],
      ["'달다'의 반대말은?", "쓰다", "짜다", "맵다"],
      ["'진하다'의 반대말은?", "연하다", "굵다", "빠르다"],
      ["'좋다'의 반대말은?", "나쁘다", "크다", "많다"],
      ["'오다'의 반대말은?", "가다", "서다", "앉다"],
      ["'앉다'의 반대말은?", "서다", "눕다", "걷다"],
      ["'밀다'의 반대말은?", "당기다", "누르다", "던지다"],
      ["'묶다'의 반대말은?", "풀다", "감다", "접다"],
      ["'넣다'의 반대말은?", "빼다", "담다", "채우다"],
      ["'붙이다'의 반대말은?", "떼다", "자르다", "접다"],
      ["'늘다'의 반대말은?", "줄다", "크다", "높다"],
      ["'뜨다'(물 위에)의 반대말은?", "가라앉다", "떠오르다", "헤엄치다"],
      ["'어른'의 반대말은?", "아이", "할머니", "선생님"],
      ["'하늘'의 반대말은?", "땅", "바다", "구름"],
      ["'남쪽'의 반대말은?", "북쪽", "동쪽", "서쪽"],
      ["'처음'의 반대말은?", "마지막", "중간", "시작"],
      ["'입학'의 반대말은?", "졸업", "방학", "개학"],
      ["'출발'의 반대말은?", "도착", "시작", "여행"],
      ["'질문'의 반대말은?", "대답", "문제", "숙제"],
      ["'성공'의 반대말은?", "실패", "노력", "칭찬"],
      ["'알다'의 반대말은?", "모르다", "배우다", "묻다"],
      ["'맑다'의 반대말은?", "흐리다", "밝다", "차갑다"],
      ["'이르다'(시간이)의 반대말은?", "늦다", "빠르다", "짧다"],
      ["'단단하다'의 반대말은?", "무르다", "무겁다", "차갑다"],
      ["'더하다'의 반대말은?", "빼다", "곱하다", "나누다"],
      ["'무섭다'와 뜻이 비슷한 말은?", "두렵다", "즐겁다", "반갑다"],
      ["'친구'와 뜻이 비슷한 말은?", "벗", "이웃", "손님"],
      ["'깨끗하다'와 뜻이 비슷한 말은?", "청결하다", "더럽다", "복잡하다"],
      ["'똑똑하다'와 뜻이 비슷한 말은?", "영리하다", "느리다", "서툴다"],
      ["'조용하다'와 뜻이 비슷한 말은?", "고요하다", "시끄럽다", "바쁘다"],
      ["'돕다'와 뜻이 비슷한 말은?", "거들다", "방해하다", "미루다"],
      ["'즐겁다'와 뜻이 비슷한 말은?", "신나다", "지루하다", "서운하다"],
      ["'아이'와 뜻이 비슷한 말은?", "어린이", "어른", "노인"],
      ["'모자라다'와 뜻이 비슷한 말은?", "부족하다", "넉넉하다", "충분하다"],
      ["'가끔'과 뜻이 비슷한 말은?", "이따금", "언제나", "날마다"],
      ["'갑자기'와 뜻이 비슷한 말은?", "별안간", "천천히", "나중에"],
      ["'아주'와 뜻이 비슷한 말은?", "매우", "조금", "거의"],
      ["'얼른'과 뜻이 비슷한 말은?", "빨리", "천천히", "나중에"],
      ["'살펴보다'와 뜻이 비슷한 말은?", "관찰하다", "잊어버리다", "숨기다"],
      ["'가는 말이 고와야 오는 말이 ( )' 알맞은 말은?", "곱다", "밉다", "빠르다"],
      ["'세 살 버릇 ( )까지 간다' 알맞은 말은?", "여든", "열", "스물"],
      ["'낮말은 새가 듣고 밤말은 ( )가 듣는다'", "쥐", "소", "닭"],
      ["'원숭이도 나무에서 ( )' 알맞은 말은?", "떨어진다", "잠든다", "노래한다"],
      ["'티끌 모아 ( )' 알맞은 말은?", "태산", "바다", "구름"],
      ["'소 잃고 ( ) 고친다' 알맞은 말은?", "외양간", "부엌", "대문"],
      ["'등잔 밑이 ( )' 알맞은 말은?", "어둡다", "밝다", "따뜻하다"],
      ["'발 없는 말이 ( ) 간다' 알맞은 말은?", "천 리", "한 걸음", "열 리"],
      ["'고래 싸움에 ( ) 등 터진다'", "새우", "상어", "문어"],
      ["'우물 안 ( )' 알맞은 말은?", "개구리", "고양이", "거북"],
      ["'누워서 ( ) 먹기' 알맞은 말은?", "떡", "국", "물"],
      ["'빈 수레가 ( )' 알맞은 말은?", "요란하다", "조용하다", "무겁다"],
      ["'개구리 ( ) 적 생각 못 한다'", "올챙이", "알", "어른"],
      ["'꿩 먹고 ( ) 먹는다' 알맞은 말은?", "알", "밥", "떡"],
      ["'돌다리도 ( ) 보고 건너라'", "두들겨", "뛰어", "멀리서"],
      ["'호랑이도 제 말 하면 ( )' 알맞은 말은?", "온다", "잔다", "운다"],
      ["'바늘 가는 데 ( ) 간다' 알맞은 말은?", "실", "가위", "단추"],
      ["'그림의 ( )' 알맞은 말은?", "떡", "꽃", "집"],
      ["'작은 고추가 더 ( )' 알맞은 말은?", "맵다", "달다", "크다"],
      ["'콩 심은 데 콩 나고 ( ) 심은 데 ( ) 난다'", "팥", "쌀", "보리"],
      ["'백지장도 ( ) 낫다' 알맞은 말은?", "맞들면", "찢으면", "접으면"],
      ["'식은 죽 먹기'는 어떤 뜻일까요?", "아주 쉬워요", "아주 뜨거워요", "아주 맛없어요"],
      ["'도서관'은 무엇을 하는 곳일까요?", "책을 읽고 빌리는 곳", "음식을 파는 곳", "운동하는 곳"],
      ["'우체국'에서 하는 일은?", "편지를 보내요", "머리를 잘라요", "병을 고쳐요"],
      ["'소방관'이 하는 일은?", "불을 꺼요", "빵을 구워요", "편지를 날라요"],
      ["'일기'는 무엇을 쓰는 글일까요?", "그날 있었던 일", "물건 값", "전화번호"],
      ["'안내문'은 무엇을 알려 주는 글일까요?", "꼭 알아야 할 내용", "친구의 비밀", "꿈 이야기"],
      ["'주인공'은 누구일까요?", "이야기의 중심 인물", "책을 산 사람", "그림을 그린 사람"],
      ["'제목'은 무엇일까요?", "글의 이름", "글의 마지막 줄", "글쓴이 이름"],
      ["'동시'는 어떤 글일까요?", "어린이 마음을 담은 시", "물건 설명서", "요리법"],
      ["'흉내 내다'는 무슨 뜻일까요?", "똑같이 따라 하다", "크게 웃다", "몰래 숨다"],
      ["'뽐내다'는 무슨 뜻일까요?", "자랑하다", "숨기다", "나누다"],
      ["'서운하다'는 어떤 마음일까요?", "아쉽고 섭섭하다", "아주 기쁘다", "배가 부르다"],
      ["'설레다'는 어떤 마음일까요?", "두근두근 기대되다", "졸리고 지루하다", "화가 나다"],
      ["'뿌듯하다'는 어떤 마음일까요?", "해내서 기쁘고 자랑스럽다", "무섭고 떨리다", "배가 고프다"],
      ["'미안하다'와 함께 쓰기 좋은 말은?", "사과해요", "자랑해요", "놀려요"]
    ],
    [
      ["바르게 쓴 것은?", "어이없다", "어의없다", "어이업다"],
      ["바르게 쓴 것은?", "설레요", "설레여요", "설래요"],
      ["바르게 쓴 것은?", "바라요", "바래요", "발아요"],
      ["바르게 쓴 것은?", "역할", "역활", "여칼"],
      ["바르게 쓴 것은?", "일부러", "일부로", "일브러"],
      ["바르게 쓴 것은?", "굳이", "구지", "궂이"],
      ["바르게 쓴 것은?", "깎아요", "깍아요", "깍가요"],
      ["바르게 쓴 것은?", "괜찮아요", "괜찬아요", "괜찮아여"],
      ["바르게 쓴 것은?", "육개장", "육계장", "육게장"],
      ["바르게 쓴 것은?", "돼지 저금통", "되지 저금통", "대지 저금통"],
      ["바르게 쓴 것은?", "웬일", "왠일", "왼일"],
      ["바르게 쓴 것은?", "어쨌든", "어쨋든", "어짜든"],
      ["바르게 쓴 것은?", "오뚝이", "오뚜기", "오똑이"],
      ["바르게 쓴 것은?", "깍두기", "깍뚜기", "깎두기"],
      ["바르게 쓴 것은?", "초콜릿", "초콜렛", "쪼꼬렛"],
      ["바르게 쓴 것은?", "케이크", "케잌", "케익크"],
      ["바르게 쓴 것은?", "로봇", "로보트", "로봍"],
      ["바르게 쓴 것은?", "주스", "쥬스", "주쓰"],
      ["바르게 쓴 것은?", "텔레비전", "텔레비젼", "텔래비전"],
      ["바르게 쓴 것은?", "소시지", "소세지", "쏘세지"],
      ["바르게 쓴 것은?", "흙장난", "흑장난", "흘장난"],
      ["바르게 쓴 것은?", "물건값", "물건갑", "물건갚"],
      ["바르게 쓴 것은?", "여덟", "여덜", "여덥"],
      ["바르게 쓴 것은?", "의자에 앉아요", "의자에 안자요", "의자에 않아요"],
      ["바르게 쓴 것은?", "짧아요", "짤바요", "짭아요"],
      ["바르게 쓴 것은?", "밟아요", "발바요", "밥아요"],
      ["바르게 쓴 것은?", "넓어요", "널버요", "넙어요"],
      ["바르게 쓴 것은?", "책을 읽어요", "책을 일거요", "책을 익어요"],
      ["바르게 쓴 것은?", "하늘이 맑아요", "하늘이 말가요", "하늘이 막아요"],
      ["바르게 쓴 것은?", "끼어들다", "끼여들다", "끼어둘다"],
      ["바르게 쓴 것은?", "뵙겠습니다", "뵈겠습니다", "봽겠습니다"],
      ["바르게 쓴 것은?", "얼마큼", "얼만큼", "얼만끔"],
      ["바르게 쓴 것은?", "희망", "히망", "흐망"],
      ["바르게 쓴 것은?", "의사 선생님", "으사 선생님", "의싸 선생님"],
      ["바르게 쓴 것은?", "숙제를 안 했어요", "숙제를 않 했어요", "숙제를 아 했어요"],
      ["바르게 쓴 것은?", "먹지 않았어요", "먹지 안았어요", "먹지 앉았어요"],
      ["바르게 쓴 것은?", "잃어버렸어요", "잊어버렷어요", "이러버렸어요"],
      ["바르게 쓴 것은?", "가르쳐 줄게", "갈켜 줄게", "가르켜 줄게"],
      ["바르게 쓴 것은?", "맞히다(정답을)", "마치다(정답을)", "맞추다(정답을)"],
      ["바르게 쓴 것은?", "반드시 올게", "반듯이 올게", "반드씨 올게"],
      ["바르게 띄어 쓴 것은?", "나는 학교에 가요", "나는학교에 가요", "나는 학교에가요"],
      ["바르게 띄어 쓴 것은?", "할 수 있어요", "할수 있어요", "할 수있어요"],
      ["바르게 띄어 쓴 것은?", "먹을 거예요", "먹을거예요", "먹 을거예요"],
      ["바르게 띄어 쓴 것은?", "책 한 권", "책 한권", "책한 권"],
      ["바르게 띄어 쓴 것은?", "연필 세 자루", "연필 세자루", "연필세 자루"],
      ["바르게 띄어 쓴 것은?", "집에 갈 때", "집에 갈때", "집에갈 때"],
      ["바르게 띄어 쓴 것은?", "좋아하는 것", "좋아하는것", "좋아 하는것"],
      ["바르게 띄어 쓴 것은?", "친구와 함께", "친구와함께", "친 구와 함께"],
      ["바르게 띄어 쓴 것은?", "사과 두 개", "사과 두개", "사과두 개"],
      ["바르게 띄어 쓴 것은?", "열심히 공부해요", "열심히공부해요", "열 심히 공부해요"],
      ["'주다'의 높임말은?", "드리다", "받다", "보내다"],
      ["'묻다'(질문하다)의 높임말은?", "여쭙다", "대답하다", "말하다"],
      ["'만나다'의 높임말은?", "뵙다", "보다", "찾다"],
      ["'생일'의 높임말은?", "생신", "잔치", "선물"],
      ["'데리고 가다'의 높임말은?", "모시고 가다", "끌고 가다", "보내 주다"],
      ["'병'의 높임말은?", "병환", "병원", "감기"],
      ["'배고프다'의 높임말은?", "시장하시다", "배부르시다", "목마르다"],
      ["'할아버지, 진지 ( ).' 알맞은 말은?", "드세요", "먹어", "먹어라"],
      ["'선생님께서 교실에 ( ).' 알맞은 말은?", "계세요", "있어", "있다"],
      ["'할머니께서 주무( ).' 알맞은 말은?", "세요", "어", "자"],
      ["'아버지께서 신문을 ( ).' 알맞은 말은?", "읽으세요", "읽어", "읽어라"],
      ["'선생님, 안녕( )' 알맞은 말은?", "하세요", "해", "하니"],
      ["'할머니 ( ) 여쭤봤어요.' 알맞은 말은?", "께", "한테다", "이가"],
      ["웃어른께 드리는 인사로 알맞은 것은?", "안녕하세요", "안녕", "잘 가"],
      ["묻는 문장 끝에 쓰는 부호는?", "물음표", "마침표", "쉼표"],
      ["놀라거나 느낌이 큰 문장 끝에 쓰는 부호는?", "느낌표", "마침표", "쉼표"],
      ["설명하는 문장 끝에 쓰는 부호는?", "마침표", "물음표", "느낌표"],
      ["부르는 말 뒤나 낱말을 나열할 때 쓰는 부호는?", "쉼표", "물음표", "느낌표"],
      ["인물이 한 말을 그대로 옮길 때 쓰는 부호는?", "큰따옴표", "물음표", "마침표"],
      ["마음속으로 한 생각을 쓸 때 쓰는 부호는?", "작은따옴표", "큰따옴표", "느낌표"],
      ["'너 어디 가니( )' 알맞은 부호는?", "?", ".", "!"],
      ["'와, 정말 멋지다( )' 알맞은 부호는?", "!", "?", ","],
      ["'나는 사과( ) 배, 귤을 좋아해요.' 알맞은 부호는?", ",", "?", "!"],
      ["'오늘은 비가 와요( )' 알맞은 부호는?", ".", "?", ","],
      ["편지 처음에 쓰는 부분은?", "받을 사람", "쓴 날짜만", "추신"],
      ["일기에 꼭 쓰는 것은?", "날짜와 날씨", "전화번호", "물건 값"],
      ["글을 읽고 생각이나 느낌을 쓴 글은?", "독서 감상문", "안내문", "광고문"],
      ["이야기의 시간과 장소를 무엇이라 할까요?", "배경", "주제", "제목"],
      ["문장의 처음 칸을 비우고 쓰는 것은?", "들여쓰기", "띄어쓰기", "맞춤법"],
      ["'먹었다'는 언제 일어난 일일까요?", "이미 지난 일", "앞으로 할 일", "지금 하는 일"],
      ["'먹을 거예요'는 언제 일어날 일일까요?", "앞으로 할 일", "이미 지난 일", "어제 한 일"]
    ],
    [
      ["눈이 많이 내리는 모양은?", "펑펑", "살랑살랑", "보글보글"],
      ["시계 소리를 흉내 낸 말은?", "똑딱똑딱", "멍멍", "쌩쌩"],
      ["물을 마시는 소리는?", "꿀꺽꿀꺽", "데굴데굴", "팔랑팔랑"],
      ["공이 굴러가는 모양은?", "데굴데굴", "꿀꺽꿀꺽", "짹짹"],
      ["병아리 울음소리는?", "삐악삐악", "음매", "어흥"],
      ["매미 울음소리는?", "맴맴", "꽥꽥", "꿀꿀"],
      ["가슴이 떨릴 때 나는 소리는?", "두근두근", "보글보글", "쿨쿨"],
      ["찌개가 끓는 소리는?", "보글보글", "살금살금", "엉금엉금"],
      ["아기가 걷는 모양은?", "아장아장", "훨훨", "쌩쌩"],
      ["불이 세게 타는 모양은?", "활활", "살랑살랑", "방긋방긋"],
      ["바람이 세게 부는 소리는?", "쌩쌩", "아장아장", "방긋방긋"],
      ["부엉이 울음소리는?", "부엉부엉", "짹짹", "음매"],
      ["종이 울리는 소리는?", "땡땡", "쿨쿨", "살금살금"],
      ["빗방울이 창문에 떨어지는 소리는?", "톡톡", "어흥", "꿀꿀"],
      ["천둥이 치는 소리는?", "우르릉 쾅쾅", "살랑살랑", "삐악삐악"],
      ["아기가 웃는 모양은?", "방긋방긋", "엉엉", "콜록콜록"],
      ["졸려서 고개를 숙이는 모양은?", "꾸벅꾸벅", "펄쩍펄쩍", "쌩쌩"],
      ["나비가 나는 모양은?", "팔랑팔랑", "쿵쿵", "엉금엉금"],
      ["떡이 부드러운 모양은?", "말랑말랑", "딱딱", "바삭바삭"],
      ["과자를 씹는 소리는?", "바삭바삭", "말랑말랑", "출렁출렁"],
      ["물결이 흔들리는 모양은?", "출렁출렁", "바삭바삭", "꾸벅꾸벅"],
      ["토끼가 뛰는 모양은?", "깡충깡충", "엉금엉금", "뒤뚱뒤뚱"],
      ["고양이 울음소리는?", "야옹", "멍멍", "꽥꽥"],
      ["강아지가 꼬리를 흔드는 모양은?", "살랑살랑", "쿵쾅쿵쾅", "꿀꺽꿀꺽"],
      ["코를 골며 자는 소리는?", "드르렁", "짹짹", "딩동"],
      ["손뼉을 치는 소리는?", "짝짝", "쿨쿨", "야옹"],
      ["'배추 한 ( )' 알맞은 말은?", "포기", "마리", "켤레"],
      ["'포도 한 ( )' 알맞은 말은?", "송이", "켤레", "그루"],
      ["'편지 한 ( )' 알맞은 말은?", "통", "마리", "그루"],
      ["'고등어 두 마리를 묶어 한 ( )'", "손", "발", "통"],
      ["'배(타는 배) 한 ( )' 알맞은 말은?", "척", "켤레", "송이"],
      ["'비행기 한 ( )' 알맞은 말은?", "대", "마리", "송이"],
      ["'시 한 ( )' 알맞은 말은?", "편", "켤레", "그루"],
      ["'노래 한 ( )' 알맞은 말은?", "곡", "마리", "켤레"],
      ["'수박 한 ( )' 알맞은 말은?", "통", "켤레", "권"],
      ["'두부 한 ( )' 알맞은 말은?", "모", "마리", "권"],
      ["'소 한 ( )' 알맞은 말은?", "마리", "그루", "켤레"],
      ["'피자 한 ( )' 알맞은 말은?", "조각", "켤레", "그루"],
      ["'알약 한 ( )' 알맞은 말은?", "알", "켤레", "그루"],
      ["'김 한 ( )' 알맞은 말은?", "장", "마리", "그루"],
      ["'신문 한 ( )' 알맞은 말은?", "부", "마리", "송이"],
      ["'영화 한 ( )' 알맞은 말은?", "편", "켤레", "그루"],
      ["끝말잇기: '기차' 다음 말은?", "차표", "기린", "바다"],
      ["끝말잇기: '사과' 다음 말은?", "과자", "사슴", "나무"],
      ["끝말잇기: '나비' 다음 말은?", "비누", "나무", "하늘"],
      ["끝말잇기: '우유' 다음 말은?", "유리", "우산", "사자"],
      ["끝말잇기: '토끼' 다음 말은?", "끼니", "토마토", "여우"],
      ["끝말잇기: '바다' 다음 말은?", "다리", "바지", "구름"],
      ["끝말잇기: '모자' 다음 말은?", "자동차", "모래", "연필"],
      ["끝말잇기: '가방' 다음 말은?", "방석", "가위", "책상"],
      ["끝말잇기: '오리' 다음 말은?", "리본", "오이", "고래"],
      ["끝말잇기: '시소' 다음 말은?", "소풍", "시계", "그네"],
      ["끝말잇기: '도토리' 다음 말은?", "리코더", "도시락", "다람쥐"],
      ["끝말잇기: '참새' 다음 말은?", "새우", "참외", "제비"],
      ["순우리말 '미리내'의 뜻은?", "은하수", "무지개", "안개"],
      ["순우리말 '가람'의 뜻은?", "강", "산", "하늘"],
      ["순우리말 '누리'의 뜻은?", "세상", "바다", "꽃"],
      ["순우리말 '시나브로'의 뜻은?", "모르는 사이 조금씩", "갑자기 한꺼번에", "아주 빨리"],
      ["순우리말 '윤슬'의 뜻은?", "햇빛에 반짝이는 물결", "새벽 안개", "눈 쌓인 산"],
      ["'한가위'는 어떤 날일까요?", "추석", "설날", "어린이날"],
      ["'해'와 '바라기'를 합친 꽃은?", "해바라기", "해님달님", "바라기꽃"],
      ["'눈'과 '사람'을 합친 말은?", "눈사람", "사람눈", "눈썹"],
      ["'책'과 '가방'을 합친 말은?", "책가방", "가방책", "책상"],
      ["'봄'과 '비'를 합친 말은?", "봄비", "비봄", "봄날"],
      ["'밤'과 '하늘'을 합친 말은?", "밤하늘", "하늘밤", "밤나무"],
      ["'손'과 '수건'을 합친 말은?", "손수건", "수건손", "손가락"],
      ["'배'가 과일을 뜻하는 문장은?", "배를 깎아 먹어요", "배를 타고 가요", "배가 아파요"],
      ["'배'가 탈것을 뜻하는 문장은?", "배를 타고 섬에 가요", "배가 달고 맛있어요", "배가 불러요"],
      ["'눈'이 하늘에서 내리는 것을 뜻하는 문장은?", "눈이 펑펑 와요", "눈을 감아요", "눈이 커요"],
      ["'다리'가 건너는 곳을 뜻하는 문장은?", "다리를 건너요", "다리가 아파요", "다리를 쭉 펴요"],
      ["'말'이 동물을 뜻하는 문장은?", "말이 달려요", "말을 잘해요", "말을 걸어요"],
      ["'밤'이 먹는 것을 뜻하는 문장은?", "군밤이 맛있어요", "밤이 깊었어요", "밤에 잠을 자요"],
      ["같은 글자로 시작하는 말끼리 묶은 것은?", "바다, 바지, 바람", "바다, 하늘, 구름", "사과, 바지, 나무"],
      ["'꽃'이 들어간 낱말이 아닌 것은?", "꼬리", "꽃병", "꽃밭"],
      ["'물'이 들어간 낱말이 아닌 것은?", "무지개", "물고기", "물감"],
      ["가나다순으로 가장 먼저 오는 낱말은?", "가방", "나무", "다리"],
      ["가나다순으로 가장 나중에 오는 낱말은?", "하늘", "사과", "바다"],
      ["'ㄱ'으로 시작하는 낱말은?", "거북", "나비", "토끼"],
      ["받침이 없는 낱말은?", "바다", "사람", "연필"],
      ["글자 수가 세 글자인 낱말은?", "도토리", "사과", "꽃"]
    ]
  ];
  const btqWeek = () => ((gameWeek() % 3) + 3) % 3;   // 0 A주, 1 B주, 2 C주
  const btqBank = (neu, old, w) => neu[w].concat(old.filter((_, i) => i % 3 === w));
  // 그리기: 색 순서 기억 놀이에 쓰는 색 여섯
  const BTQ_COL = [['빨강', '#E8575A'], ['주황', '#F29A3A'], ['노랑', '#F3C83F'], ['초록', '#5DB35A'], ['파랑', '#4A8FD9'], ['보라', '#9B6BD3']];
  const btqMix = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // 문제 은행에서 이번 판에 안 나온 문제부터(세 판쯤은 겹치지 않게)
  function btqPick(bank, key, n) {
    const seen = (rt.btqSeen = rt.btqSeen || {})[key] = rt.btqSeen[key] || [];
    let pool = bank.map((_, i) => i).filter(i => !seen.includes(i));
    if (pool.length < n) { seen.length = 0; pool = bank.map((_, i) => i); }
    const pick = btqMix(pool).slice(0, n);
    seen.push(...pick); if (seen.length > bank.length * 0.8) seen.splice(0, seen.length - Math.floor(bank.length * 0.8));
    return pick.map(i => { const [q, a, ...w] = bank[i]; return { q, a, opts: btqMix([a, ...w]) }; });
  }
  // 수학: 한 자리 수 사칙연산. 빼기는 0 이상, 나누기는 나누어떨어지게. 중학교부터 더하기와 빼기는 두 자리 수 + 한 자리 수
  function btqMath() {
    const r = n => 1 + Math.floor(Math.random() * n), big = S.tier >= 2, op = Math.floor(Math.random() * 4);
    let a, b, ans, t;
    if (op === 0) { a = big ? 9 + r(90) : r(9); b = r(9); ans = a + b; t = '+'; }
    else if (op === 1) { a = big ? 9 + r(90) : r(9); b = r(9); if (b > a) [a, b] = [b, a]; ans = a - b; t = '−'; }
    else if (op === 2) { a = r(9); b = r(9); ans = a * b; t = '×'; }
    else { b = r(9); ans = r(9); a = ans * b; t = '÷'; }
    const w = new Set();
    for (const d of btqMix([1, 2, -1, -2, 3, -3])) { const v = ans + d; if (v >= 0 && v !== ans) w.add(v); if (w.size >= 2) break; }
    return { q: `${a} ${t} ${b} = ?`, a: String(ans), opts: btqMix([ans, ...w]).map(String), math: true };
  }
  // B주 수학: 빈칸 채우기(앞이나 뒤 수가 빈칸), C주 수학: 뛰어 세기
  const btqNear = ans => { const w = new Set(); for (const d of btqMix([1, 2, -1, -2, 3, -3])) { const v = ans + d; if (v >= 0 && v !== ans) w.add(v); if (w.size >= 2) break; } return btqMix([ans, ...w]).map(String); };
  function btqMathBlank() {
    const m = btqMath(), [x, t, y] = m.q.replace(' = ?', '').split(' '), ans = Number(m.a), left = Math.random() < 0.5;
    const hid = left ? Number(x) : Number(y);
    return { q: left ? `□ ${t} ${y} = ${ans}` : `${x} ${t} □ = ${ans}`, a: String(hid), opts: btqNear(hid), math: true };
  }
  function btqMathSeq() {
    const r = n => 1 + Math.floor(Math.random() * n), big = S.tier >= 2, d = big ? 2 + r(10) : 1 + r(4), st = r(big ? 20 : 9);
    const L = [0, 1, 2, 3].map(i => st + d * i), ans = st + d * 4;
    return { q: `${L.join(', ')}, ?`, a: String(ans), opts: btqNear(ans), math: true };
  }
  function btqMake(e) {
    const wk = btqWeek();   // 한 주마다 바뀌는 문제 묶음
    if (e === 'math') return { kind: 'q', qs: Array.from({ length: BTQ.n }, [btqMath, btqMathBlank, btqMathSeq][wk]), k: 0, got: 0, fb: null };
    if (e === 'sci') return { kind: 'q', qs: btqPick(btqBank(BTQ_SCI_W, BTQ_SCI, wk), 'sci' + wk, BTQ.n), k: 0, got: 0, fb: null };
    if (e === 'kor') return { kind: 'q', qs: btqPick(btqBank(BTQ_KOR_W, BTQ_KOR, wk), 'kor' + wk, BTQ.n), k: 0, got: 0, fb: null };
    const len = S.tier >= 2 ? 4 : 3, seq = [];
    for (let i = 0; i < len; i++) { let c; do { c = Math.floor(Math.random() * BTQ_COL.length); } while (seq.length && c === seq[seq.length - 1]); seq.push(c); }
    return { kind: 'mem', seq, show: -1, input: [], phase: 'show', ok: true, rev: wk === 1 };   // B주는 거꾸로 눌러요
  }
  const btqPts = Z => Z.kind === 'q' ? BTQ.pts[Math.min(BTQ.n, Z.got)] : Math.round(10 * (Z.ok || !Z.miss ? Z.input.length : Math.max(0, Z.input.length - 1)) / Z.seq.length);   // 5.3.4.6: 틀린 칸을 눌렀을 때만 그 칸을 빼요(시간이 다 되면 맞힌 칸 그대로)
  function btqHTML(Z) {
    if (Z.kind === 'q') {
      const q = Z.qs[Z.k];
      return `<b class="btq-q${q.math ? ' math' : ''}">${esc(q.q)}</b><span class="btq-time${Z.fb ? ' stop' : ''}"><i style="animation-duration:${BTQ.qMs}ms"></i></span>` +
        `<span class="btq-opts">${q.opts.map((o, i) => `<button type="button" class="btq-o${Z.fb && o === q.a ? ' right' : ''}${Z.fb && Z.fb.pick === i && o !== q.a ? ' wrong' : ''}" data-bq="${i}"${Z.fb ? ' disabled' : ''}>${esc(o)}</button>`).join('')}</span>` +
        `<small class="btq-n">${Z.k + 1} / ${BTQ.n}번째 문제, 맞힌 문제 ${Z.got}개</small>`;
    }
    const dot = (c, on) => `<i class="btq-dot${on ? ' on' : ''}" style="--c:${BTQ_COL[c][1]}" aria-label="${BTQ_COL[c][0]}"></i>`;
    if (Z.phase === 'show') return `<b>${Z.rev ? '색 순서를 기억했다가 거꾸로!' : '색 순서를 기억해요!'}</b><span class="btq-seq">${Z.seq.map((c, i) => i === Z.show ? dot(c, true) : '<i class="btq-dot blank"></i>').join('')}</span><small class="btq-n">${Z.seq.length}개의 색이 차례로 나와요</small>`;
    return `<b>${Z.phase === 'done' ? (Z.ok ? '모두 맞혔어요!' : '아쉬워요!') : Z.rev ? '본 순서를 거꾸로 눌러요' : '본 순서대로 눌러요'}</b><span class="btq-time${Z.phase === 'done' ? ' stop' : ''}"><i style="animation-duration:${BTQ.memMs}ms"></i></span>` +
      `<span class="btq-seq">${Z.seq.map((c, i) => i < Z.input.length ? dot(Z.input[i], true) : '<i class="btq-dot blank"></i>').join('')}</span>` +
      `<span class="btq-pal">${BTQ_COL.map((c, i) => `<button type="button" class="btq-c" style="--c:${c[1]}" data-bm="${i}" aria-label="${c[0]}"${Z.phase === 'done' ? ' disabled' : ''}></button>`).join('')}</span>`;
  }
  function btqRender(M) { const c = $('#btCheer'); if (!c || !M || !M.quiz) return; c.className = 'bt-cheer on btq'; c.innerHTML = btqHTML(M.quiz); }
  // 문제 하나: 7초 안에 고르지 않으면 틀린 것으로
  function btqAsk(M) {
    const Z = M.quiz; Z.fb = null; btqRender(M);
    clearTimeout(btUI.timer);
    btUI.timer = setTimeout(() => { if (btUI.M === M && M.quiz === Z && !Z.fb) btqAnswer(-1); }, BTQ.qMs);
  }
  function btqAnswer(i) {
    const M = btUI.M; if (!M || !M.quiz || M.quiz.kind !== 'q' || M.quiz.fb) return;
    const Z = M.quiz, q = Z.qs[Z.k], ok = i >= 0 && q.opts[i] === q.a;
    clearTimeout(btUI.timer);
    Z.fb = { pick: i }; if (ok) Z.got += 1;
    sfx(ok ? 'done' : 'tap'); buzz(ok ? 12 : [20, 30, 20]); btqRender(M);
    btUI.timer = setTimeout(() => {
      if (btUI.M !== M || M.quiz !== Z) return;
      Z.k += 1;
      if (Z.k < BTQ.n) btqAsk(M); else btReveal(M, btqPts(Z));
    }, BTQ.fbMs);
  }
  // 기억 놀이: 색이 하나씩 켜졌다 꺼지고, 그다음 9초 안에 같은 순서로 눌러요. 틀리면 거기서 끝
  function btqMemShow(M) {
    const Z = M.quiz, step = j => {
      if (btUI.M !== M || M.quiz !== Z) return;
      if (j >= Z.seq.length) { Z.show = -1; Z.phase = 'input'; btqRender(M); btUI.timer = setTimeout(() => { if (btUI.M === M && M.quiz === Z && Z.phase === 'input') btqMemEnd(M, false); }, BTQ.memMs); return; }
      Z.show = j; btqRender(M); sfx('tap');
      btUI.timer = setTimeout(() => { Z.show = -1; btqRender(M); btUI.timer = setTimeout(() => step(j + 1), BTQ.memGap); }, BTQ.memShow);
    };
    btUI.timer = setTimeout(() => step(0), 400);
  }
  function btqMemTap(c) {
    const M = btUI.M; if (!M || !M.quiz || M.quiz.kind !== 'mem' || M.quiz.phase !== 'input') return;
    const Z = M.quiz, ok = (Z.rev ? Z.seq[Z.seq.length - 1 - Z.input.length] : Z.seq[Z.input.length]) === c;
    Z.input.push(c); buzz(ok ? 8 : [20, 30, 20]); sfx(ok ? 'tap' : 'tap');
    if (!ok) { Z.miss = true; btqMemEnd(M, false); return; }
    if (Z.input.length >= Z.seq.length) { btqMemEnd(M, true); return; }
    btqRender(M);
  }
  function btqMemEnd(M, ok) {
    const Z = M.quiz; if (Z.phase === 'done') return;
    clearTimeout(btUI.timer);
    Z.phase = 'done'; Z.ok = ok && Z.input.length >= Z.seq.length; btqRender(M);
    if (Z.ok) sfx('done');
    btUI.timer = setTimeout(() => { if (btUI.M === M && M.quiz === Z) btReveal(M, btqPts(Z)); }, BTQ.fbMs + 150);
  }
  const btCheerPts = n => Math.min(BT.cheerMax, Math.round(Math.min(BT.cheerTaps, n) / (BT.cheerTaps / BT.cheerMax)));
  // 점수가 0부터 차오르는 연출
  function btCount(el, to, ms) { if (!el) return; if (rt.reduced) { el.textContent = to + '점'; return; } const t0 = performance.now(); const step = t => { const k = Math.min(1, (t - t0) / ms); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))) + '점'; if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
  /* 달리기는 트랙을 달리는 모습. 두드릴 때마다 우리 선수가 앞으로 뛰고(통통) 트랙 줄이 뒤로 흘러요
     상대 선수는 정해진 응원 점수만큼 일정하게 달려요. 그림 bt_track(작업지시서 48)이 없으면 CSS 트랙 */
  function btTrackHTML(me, o) {
    const tr = IMG('bt_track');
    return `<div class="bt-track"${tr ? ` style="background:url('${tr}') var(--off) 0/auto 100% repeat-x"` : ''} aria-hidden="true"><span class="bt-fin">🏁</span>` +
      `<div class="bt-lane me"><span class="bt-run" id="btRunMe">${btChr(me.sp, 'bt-runi')}</span></div><div class="bt-lane opp"><span class="bt-run" id="btRunOpp">${btChr(o.sp, 'bt-runi')}</span></div></div>`;
  }
  function btTrackStep() {
    const r = $('#btRunMe'), tk = $('#btCheer .bt-track'); if (!r) return;
    r.style.left = (4 + 78 * Math.min(1, btUI.taps / BT.cheerTaps)) + '%';
    if (!rt.reduced) { r.classList.remove('hop'); void r.offsetWidth; r.classList.add('hop'); }
    if (tk) tk.style.setProperty('--off', (-btUI.taps * 14) + 'px');
  }
  // 종목 하나: 달리기는 4초 동안 두드리면 응원, 다른 종목은 문제. 그다음 점수 공개
  function btPlayEv() {
    const M = btUI.M; if (!M || M.phase !== 'play') return;
    const e = M.evs[M.i];
    btUI.taps = 0; M.reveal = false;
    if (e !== 'pe') {   // 수학, 과학, 책 읽기는 퀴즈, 그리기는 색 기억 놀이
      M.cheering = false; M.quiz = btqMake(e); btRender();
      if (M.quiz.kind === 'q') btqAsk(M); else btqMemShow(M);
      return;
    }
    M.quiz = null; M.cheering = true; btRender();
    const ms = rt.reduced ? 2000 : BT.cheerMs;
    $('#btPlay').style.setProperty('--bt-t', ms + 'ms');
    requestAnimationFrame(() => $('#btPlay').classList.add('go'));
    { const ro = $('#btRunOpp'), oc = (M.rolls[M.i] && M.rolls[M.i].oc) || 0; if (ro) { ro.style.transition = `left ${ms}ms linear`; requestAnimationFrame(() => { ro.style.left = (4 + 78 * Math.min(1, oc / BT.cheerMax)) + '%'; }); } }   // 상대는 일정하게
    btUI.timer = setTimeout(() => {
      if (!btUI.M || btUI.M !== M) return;
      M.cheering = false; $('#btPlay').classList.remove('go');
      btReveal(M, btCheerPts(btUI.taps));
    }, ms);
  }
  // 점수 공개: 응원(문제) 점수 mc를 넣고 이겼는지 보여 준 뒤 다음 종목으로
  function btReveal(M, mc) {
    if (!btUI.M || btUI.M !== M) return;
    clearTimeout(btUI.timer);
    const r = M.rolls[M.i]; r.mc = Math.max(0, Math.min(BT.cheerMax, mc | 0)); r.win = btWin(r, r.mc); M.res.push(r);
    M.quiz = null; M.reveal = true; btRender(); buzz(20);
    btCount($('#btScMe'), btScore(r.ms, r.md, r.mc), 700); btCount($('#btScOpp'), btScore(r.os, r.od, r.oc), 700);
    setTimeout(() => { if (btUI.M !== M) return; $('#btDuel').classList.add('done'); sfx(r.win ? 'quest' : 'tap'); buzz(r.win ? [20, 30, 20] : 30); }, rt.reduced ? 0 : 750);
    btUI.timer = setTimeout(() => {
      if (!btUI.M || btUI.M !== M) return;
      M.i += 1;
      if (M.i < 3) btPlayEv(); else { M.phase = 'result'; btFinish(M); btRender(); }
    }, rt.reduced ? 900 : 2100);
  }
  function btTap(e) {
    const M = btUI.M; if (!M || M.phase !== 'play' || !M.cheering) return;
    if (e && e.cancelable) e.preventDefault();   // 두드려도 글자가 파랗게 잡히지 않게
    if (btUI.taps >= BT.cheerTaps) return;
    btUI.taps += 1; buzz(5);
    const n = $('#btCheerN'); if (n) n.textContent = `${btUI.taps} / ${BT.cheerTaps}`;
    const mi = $('#btMeterI'); if (mi) mi.style.width = (100 * btUI.taps / BT.cheerTaps) + '%';
    const pt = $('#btCheerPt'); if (pt) pt.textContent = `응원 점수 +${btCheerPts(btUI.taps)}`;
    const me = $('#btDuel .bt-side.me'); if (me && !rt.reduced) { me.classList.remove('hit'); void me.offsetWidth; me.classList.add('hit'); }
    btTrackStep();   // 달리기 트랙
    if (btUI.taps === BT.cheerTaps) { sfx('quest'); const c = $('#btCheer'); if (c) c.classList.add('full'); }
    if (!rt.reduced && e && e.clientX !== undefined) {
      if (IMG('bfx_cheer')) { const f = document.createElement('img'); f.className = 'bt-spark'; f.src = IMG('bfx_cheer'); f.style.left = e.clientX + 'px'; f.style.top = e.clientY + 'px'; document.body.appendChild(f); setTimeout(() => f.remove(), 700); }
      const p = document.createElement('span'); p.className = 'bt-plus'; p.textContent = '+1'; p.style.left = (e.clientX + (Math.random() * 30 - 15)) + 'px'; p.style.top = (e.clientY - 20) + 'px'; document.body.appendChild(p); setTimeout(() => p.remove(), 650);
    }
  }
  function btConfetti() {
    const box = document.createElement('div'); box.className = 'bt-confetti'; box.setAttribute('aria-hidden', 'true');
    const cs = ['#F3C04B', '#E85D5D', '#7FB069', '#5AA0E0', '#B48CE0', '#FFFFFF'];
    for (let i = 0; i < 46; i++) { const c = document.createElement('i'); c.style.left = (Math.random() * 100) + '%'; c.style.background = cs[i % cs.length]; c.style.animationDelay = (Math.random() * 0.6) + 's'; c.style.setProperty('--dx', (Math.random() * 120 - 60) + 'px'); c.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg'); box.appendChild(c); }
    $('#btScene').appendChild(box); setTimeout(() => box.remove(), 2600);
  }
  function btAgain() { if (btLeft() <= 0) return; btUI.M = btMake(); S.bt.last = btUI.M.si; sfx('tap'); btRender(); }
  function btRender() {
    const M = btUI.M; if (!M) return;
    const sch = BT_SCH[M.si], left = btLeft();
    $('#btOppMark').innerHTML = IMG('bmark_' + sch.k) ? `<img src="${IMG('bmark_' + sch.k)}" alt="">` : '🏫';
    $('#btOppName').textContent = sch.name; $('#btOppName').style.color = '';
    $('#btLeft').textContent = `오늘 ${left}/${btQuota()}판`;
    $('#btMe').innerHTML = `${btMedal(S.bt.lg, 26)}<b>${fmt(S.bt.pts)}</b>`;
    $('#btPickPane').hidden = M.phase !== 'pick'; $('#btPlay').hidden = M.phase !== 'play'; $('#btResult').hidden = M.phase !== 'result';
    if (M.phase === 'pick') {
      $('#btRows').innerHTML = M.evs.map((e, i) => { const o = M.opp[i], me = M.me[i];
        return `<div class="bt-row${M.sel === i ? ' sel' : ''}"><span class="bt-ev">${btEvIc(e, 30)}<small>${BT_EV[e].name}</small></span>` +
          `<button class="bt-slot${me ? ' on' : ''}" type="button" data-bslot="${i}" aria-label="${BT_EV[e].name}에 세울 학생${me ? `, ${esc(me.nm)}` : ', 비어 있음'}">${me ? `${btChr(me.sp)}<b>${esc(me.nm)}</b><small class="stars">${starTxt(me.st[e])}</small>` : '<em>+</em><small>눌러서 고르기</small>'}</button>` +
          `<span class="bt-vs">VS</span><span class="bt-opp" style="--sc:${sch.c}">${btChr(o.sp)}<b>${esc(o.nm)}</b><small>${btName(o.sp)}</small><small class="stars">${starTxt(o.st)}</small></span></div>`; }).join('');
      const e = M.evs[M.sel], list = btRoster().sort((a, b) => b.st[e] - a.st[e]);
      $('#btListHd').textContent = `${BT_EV[e].name}에 세울 학생을 골라요`;
      $('#btList').innerHTML = list.map(p => { const at = M.me.findIndex(x => x && x.id === p.id);
        return `<button class="bt-cand${at >= 0 ? ' used' : ''}" type="button" data-bpick="${p.id}">${btChr(p.sp)}<b>${esc(p.nm)}</b><small class="stars">${starTxt(p.st[e])}</small>${at >= 0 ? `<i>${BT_EV[M.evs[at]].name}</i>` : ''}</button>`; }).join('');
      const ready = !M.me.some(x => !x);
      const ad = left <= 0 && btCanAd();   // 광고 보고 2판 더
      $('#btGo').setAttribute('aria-disabled', (ready && left > 0) || ad ? 'false' : 'true');
      $('#btGo').textContent = left > 0 ? '대결 시작!' : ad ? `광고 보고 ${BT.adMore}판 더` : '오늘은 다 했어요';
    } else if (M.phase === 'play') {
      const sch2 = BT_SCH[M.si];
      if (M.intro) {   // 시작 연출
        $('#btPlayEv').innerHTML = ''; $('#btScoreLine').innerHTML = ''; $('#btCheer').innerHTML = ''; $('#btCheer').className = 'bt-cheer';
        $('#btDuel').className = 'bt-duel'; $('#btDuel').innerHTML = `<div class="bt-intro"><span class="bt-in me">${(S.deco.mk && markHTML(S.deco.mk)) || '<span style="font-size:46px">🏫</span>'}<b>${esc(schoolTitle())}</b></span><em>VS</em><span class="bt-in opp">${IMG('bmark_' + sch2.k) ? `<img src="${IMG('bmark_' + sch2.k)}" alt="">` : '🏫'}<b>${esc(sch2.name)}</b></span></div>`;
        return;
      }
      const i = Math.min(M.i, 2), e = M.evs[i], r = M.reveal ? M.res[i] : null, me = M.me[i], o = M.opp[i];
      const friendly = i === 2 && M.res.length >= 2 && M.res[0].win === M.res[1].win;
      $('#btPlayEv').innerHTML = `${btEvIc(e, 34)}<b>${i + 1}번째 종목: ${BT_EV[e].name}</b>${friendly ? '<small>친선 경기</small>' : ''}`;
      $('#btPlayEv').classList.remove('pop'); void $('#btPlayEv').offsetWidth; if (!r) $('#btPlayEv').classList.add('pop');
      const scs = r ? [btScore(r.ms, r.md, r.mc), btScore(r.os, r.od, r.oc)] : null, top = scs ? Math.max(1, ...scs) : 1;
      const side = (who, p, stars, mine) => `<div class="bt-side ${mine ? 'me' : 'opp'}${r ? ((mine ? r.win : !r.win) ? ' win' : ' lose') : ''}"><span class="bt-fig">${btChr(p.sp, 'bt-big')}</span><b>${esc(p.nm)}</b><small class="stars">${starTxt(stars)}</small><span class="bt-bar"><i${scs ? ` style="width:${Math.round(100 * scs[mine ? 0 : 1] / top)}%"` : ''}></i></span>` +
        (r ? `<em id="${mine ? 'btScMe' : 'btScOpp'}">0점</em>` : '<em class="wait">?</em>') +
        (r && (mine ? r.win : !r.win) ? (IMG('bfx_win') ? `<img class="bt-stamp" src="${IMG('bfx_win')}" alt="이김">` : '<span class="bt-stamp w">승</span>') : '') +
        (r && (mine ? !r.win : r.win) ? (IMG('bfx_lose') ? `<img class="bt-stamp" src="${IMG('bfx_lose')}" alt="짐">` : '<span class="bt-stamp l">패</span>') : '') + '</div>';
      $('#btDuel').className = 'bt-duel ev-' + e + (r ? '' : ' live');
      $('#btDuel').innerHTML = side('me', me, me.st[e], true) + '<span class="bt-vs2">VS</span>' + side('opp', o, o.st, false);
      $('#btCheer').className = 'bt-cheer' + (M.cheering || M.quiz ? ' on' : '') + (M.quiz ? ' btq' : '');
      $('#btCheer').innerHTML = M.quiz ? btqHTML(M.quiz) : M.cheering ? btTrackHTML(me, o) + `<b>화면을 마구 두드려 응원해요!</b><span class="bt-meter"><i id="btMeterI"></i></span><span class="bt-cnt"><span id="btCheerN">0 / ${BT.cheerTaps}</span><small id="btCheerPt">응원 점수 +0</small></span>`
        : r ? `<b>${r.win ? '이겼어요!' : '아쉬워요!'}</b><span>${e === 'pe' ? '응원' : e === 'art' ? '기억' : '퀴즈'} 점수 ${r.mc} : ${r.oc}</span>` : '';
      $('#btScoreLine').innerHTML = [0, 1, 2].map(j => { const x = M.reveal || j < M.i ? M.res[j] : null; return `<i class="${x ? (x.win ? 'w' : 'l') : j === i ? 'now' : ''}">${btEvIc(M.evs[j], 18)}</i>`; }).join('');
    } else {
      const o = M.out || {}, L = S.bt.lg, nx = BT_LG[L + 1];
      $('#btResult').innerHTML = `<div class="bt-res ${o.win ? 'w' : 'l'}">${o.win ? (IMG('bfx_win') ? `<img src="${IMG('bfx_win')}" alt="">` : '🏆') : (IMG('bfx_lose') ? `<img src="${IMG('bfx_lose')}" alt="">` : '🌧️')}` +
        `<b>${o.win ? '승리!' : '패배'}</b><small>${o.wins}승 ${3 - o.wins}패</small>` +
        `<p>대결 점수 ${fmt(o.pts0)} → <b>${fmt(S.bt.pts)}</b> (${o.d >= 0 ? '+' : ''}${o.d}${o.bonus ? `, ${S.bt.streak}연승 +${o.bonus}` : ''})</p>` +
        (o.acorn ? `<p>오늘 첫 승리! 도토리 +${fmt(o.acorn)}</p>` : '') + (o.lp ? `<p>주간 리그 +${o.lp}</p>` : '') +
        (o.up !== undefined ? `<div class="bt-up">${btMedal(o.up, 56)}<b>${BT_LG[o.up].n} 리그 승급!</b>${o.gold ? `<small>황금 도토리 +${o.gold}</small>` : ''}</div>` : '') +
        `<div class="bt-lgbar">${btMedal(L, 28)}<span class="ac-bar"><i style="width:${nx ? Math.round(100 * Math.min(1, (S.bt.pts - BT_LG[L].at) / (nx.at - BT_LG[L].at))) : 100}%"></i></span><small>${nx ? `${nx.n} 리그까지 ${fmt(Math.max(0, nx.at - S.bt.pts))}점` : '가장 높은 리그예요'}</small></div>` +
        `<p class="fine">이긴 종목마다 그 과목 XP +${BT.xp}${rosterOn() ? ', 이긴 학생은 능력치가 자라요' : ''}. 오늘 남은 대결 ${btLeft()}판.</p>` +
        (o.win ? '' : `<p class="fine bt-why">점수 = 별 × 20 + 주사위(0~${BT.dice}) + 퀴즈와 응원\n별이 높은 학생을 세우면 유리해요</p>`) +   // 다 맞혀도 지는 까닭
        `<div class="btn-row">${btLeft() > 0 ? '<button class="cta" type="button" id="btAgain">한 판 더</button>' : btCanAd() ? `<button class="cta" type="button" id="btAdMore">광고 보고 ${BT.adMore}판 더</button>` : ''}<button class="btn-sub" type="button" id="btDone">닫기</button></div></div>`;
      if (o.win && !rt.reduced && !M.confetti) { M.confetti = true; btConfetti(); }   // 승리 꽃가루
    }
  }
  function renderBtCard() {
    const c = $('#btCard'); if (!c || !S.bt) return;
    const on = btOpen(); c.classList.toggle('lock', !on);
    const art = IMG('card_battle'); $('#btThumb').style.backgroundImage = art ? `url("${art}")` : '';
    $('#btCardSub').innerHTML = on ? `${btMedal(S.bt.lg, 18)} ${BT_LG[S.bt.lg].n} 리그, 대결 점수 ${fmt(S.bt.pts)}` : '초등학교 3학년부터 열려요';
    const lt = $('#btLeftTxt'); lt.textContent = on ? `오늘 ${btLeft()}/${btQuota()}판` : '잠김'; lt.classList.toggle('none', on && btLeft() <= 0);
    $('#btCardTag').textContent = on ? '시작하기' : '잠김';
    { const sw = on && btSwOpen(), can = sw && btLeft() > 0, show = on && (!sw || can);   // 소탕 줄(숲속 퍼즐과 같은 자리)
      $('#btSwTx').hidden = sw; $('#btSwBtn').hidden = !can; if (can) $('#btSwBtn').textContent = `소탕 ${btLeft()}판`;
      $('#btSwRow').hidden = !show; $('#btCardW').classList.toggle('sw-on', show); }
  }
  function sanitizeBt(d, s) {
    s.bt = freshBt(); const B = d.bt && typeof d.bt === 'object' ? d.bt : null; if (!B) return;
    s.bt.pts = Math.floor(numIn(B.pts, 1000, 9999)); s.bt.lg = Math.max(Math.floor(numIn(B.lg, 0, 5)), 0);
    s.bt.day = typeof B.day === 'string' ? B.day.slice(0, 10) : ''; s.bt.adN = Math.floor(numIn(B.adN, 0, BT.adMax)); s.bt.n = Math.floor(numIn(B.n, 0, BT.perDay + BT.adMore * BT.adMax)); s.bt.won = !!B.won;   // 광고로 더 받은 판
    s.bt.streak = Math.floor(numIn(B.streak, 0, 1e4)); s.bt.last = Number.isInteger(B.last) && B.last >= 0 && B.last < BT_SCH.length ? B.last : -1;
    if (B.grow && typeof B.grow === 'object') { s.bt.grow.day = typeof B.grow.day === 'string' ? B.grow.day.slice(0, 10) : ''; if (B.grow.m && typeof B.grow.m === 'object') for (const k of Object.keys(B.grow.m).slice(0, 40)) s.bt.grow.m[String(k).slice(0, 12)] = Math.floor(numIn(B.grow.m[k], 0, BT.grow)); }
    if (B.lp && typeof B.lp === 'object') { s.bt.lp.day = typeof B.lp.day === 'string' ? B.lp.day.slice(0, 10) : ''; s.bt.lp.p = Math.floor(numIn(B.lp.p, 0, BT.lpDay)); }
    if (B.st && typeof B.st === 'object') for (const k of Object.keys(s.bt.st)) s.bt.st[k] = Math.floor(numIn(B.st[k], 0, 1e7));
  }
  function renderExRow() {
    const b = $('#exRowBtn'); if (!b || !S.ex) return;
    b.hidden = !exOpen(); if (!exOpen()) return;
    const ready = exReportReady(), now = exNow();
    $('#exRowIc').innerHTML = IMG('exam_bell') ? `<img src="${IMG('exam_bell')}" alt="">` : '🔔';
    $('#exRowT').textContent = ready ? '시험 성적표가 나왔어요!' : now ? '지금은 시험 주예요' : '시험 기간';
    $('#exRowS').textContent = ready ? '받으면 도토리와 상장' : now ? (exStudyDone() ? `오늘 자율학습 끝, ${exDays()}일 남음` : `도서관 자율학습으로 성적 올리기, ${exDays()}일 남음`) : `다음 시험까지 ${exDays()}일, 평소 공부가 성적이 돼요`;
    $('#exRowGo').textContent = ready ? '받기' : now && !exStudyDone() ? '자율학습' : '보기';
    b.classList.toggle('todo', ready || (now && !exStudyDone() && S.f.library >= 1));
  }
  // 공부 탭의 야간 자율학습 줄(기숙사를 지으면 보여요)
  function renderNsRow() {
    const b = $('#nsRowBtn'); if (!b) return;
    b.hidden = !nsOpen(); if (b.hidden) return;
    const on = nsOn(), used = nsUsedTonight(), night = isNight(), planned = nsPlanned();
    const ic = IMG('ic_selfstudy'); $('#nsRowIc').innerHTML = ic ? `<img src="${ic}" alt="">` : '🌙';
    $('#nsRowT').textContent = on ? '야간 자율학습 중' : planned ? '오늘 밤 자율학습 예약됨' : used ? '오늘 밤 자율학습 끝' : '야간 자율학습';
    $('#nsRowS').textContent = on || planned ? `아침 ${NSL.h1}시에 ${AC.name[S.ns.sub]} XP +${NSL.xp}` : used ? '내일 밤에 다시 할 수 있어요'
      : night ? `켜면 자리 비운 보상 +${hm(nsExtraH() * 3600)}` : `밤 ${NSL.h0 - 12}시부터 아침 ${NSL.h1}시까지, 미리 예약해요`;
    $('#nsRowGo').textContent = on || planned || used ? '보기' : night ? '켜기' : '예약';
    b.classList.toggle('todo', !on && !planned && !used);
  }
  // 공부 탭의 국어, 과학 카드
  function renderStudy2() {
    const rc = $('#rdCard'), lc = $('#labCard'); if (!rc || !lc || !S.rd) return;
    rdDay();
    const b = S.rd.cur && bookOf(S.rd.cur), rl = rdLeft();
    $('#rdCardSub').textContent = !rdReady() ? `${eul(FAC.library.name)} 지으면 열려요` : b ? `「${b.name}」 ${Math.ceil(rdRemain() / 60000)}분 남았어요` : `책을 골라 ${RD.min}분 동안 읽어요`;
    const rt1 = $('#rdLeftTxt'); rt1.textContent = `오늘 ${rl}/${rdPerDay()}권`; rt1.classList.toggle('none', rl <= 0 && !b);
    $('#rdCardTag').textContent = b ? '읽는 중' : '고르기';
    rc.classList.toggle('lock', !rdReady());
    const ready = labReady(), done = ready && labDone();
    $('#labCardSub').textContent = !labOpen() ? `${TIERS[LAB.tier].name} 과학실에서 열려요` : !ready ? `${eul(FAC.science.name)} 지으면 열려요` : done ? '오늘 실험 끝, 내일 또 해요' : '재료 둘을 섞어 실험해요';
    const lt = $('#labLeftTxt'); lt.textContent = ready ? `노트 ${labCount()}/${LAB_KEYS.length}` : '잠김'; lt.classList.toggle('none', !ready || done);
    $('#labCardTag').textContent = !ready ? '잠김' : done ? '노트 보기' : '시작하기';
    lc.classList.toggle('lock', !ready);
  }
  // 동아리 배지: 그림(작업지시서 19)이 있으면 그림, 없으면 그림 문자
  const clubBadge = (c, px) => IMG(CLUBS[c].img) ? `<img class="club-badge" src="${IMG(CLUBS[c].img)}" alt="" draggable="false"${px ? ` style="width:${px}px;height:${px}px"` : ''}>`
    : `<span class="club-badge em c${c}"${px ? ` style="width:${px}px;height:${px}px;font-size:${Math.round(px * 0.55)}px"` : ''}>${CLUBS[c].em}</span>`;
  const kidFace = (sp, r) => `<span class="rs-av">${kidAvatar(r ? sp + '_rare' : sp)}</span>`;   // r: 반짝 친구 모습
  function clubSeatHTML(c) {
    const mem = clubMembers(c), C = CLUBS[c];
    return Array.from({ length: CLUB.seats }, (_, j) => {
      const s = mem[j];
      if (!s) return `<button class="club-seat empty" type="button" data-seat="${c}" aria-label="${C.name} 빈자리, 눌러서 학생 넣기"><b>+</b><small>빈자리</small></button>`;
      const i = S.roster.list.indexOf(s);
      return `<button class="club-seat" type="button" data-seat="${c}" data-ri="${i}" aria-label="${C.name} ${esc(s.nm)}, ${ABIL[C.ab]} 별 ${star(s.a[C.ab])}개">${kidFace(s.sp, s.r)}<b>${esc(s.nm)}</b><small class="stars">${starTxt(star(s.a[C.ab]))}</small></button>`;
    }).join('');
  }
  function renderClub() {
    const box = $('#clubBody'); if (!box || !S) return;
    if (!rosterOn()) { box.innerHTML = `<p class="lead">동아리는 ${TIERS[ROSTER_TIER].name}부터 열려요.</p>`; return; }
    rosterEnsure();
    const bg = IMG('club_bg'); $('#clubHead').style.backgroundImage = bg ? `url("${bg}")` : '';
    $('#clubHead').classList.toggle('fb', !bg);
    const wait = showWait();
    $('#cgBox').innerHTML = cgHTML();   // 동아리 대항전
    $('#clubShowNote').textContent = showNote();
    fvFlag($('#clubShowNote').parentElement, 'show', '축제: 발표회 보상 +100%');   // 축제 금요일
    box.innerHTML = CLUBS.map((C, c) => `<div class="club-card c${c}"><div class="club-top">${clubBadge(c, 40)}<span class="club-nm"><b>${C.name}</b><small>${ABIL[C.ab]} 별 ${clubStars(c)}개</small></span>` +
      `<span class="club-eff">${C.eff(clubShow(c))}</span></div><div class="club-seats">${clubSeatHTML(c)}</div>` +
      `<button class="cta small club-show" type="button" data-show="${c}" aria-disabled="${showReadyC(c) && clubMembers(c).length ? 'false' : 'true'}">${S.club.shown[c] ? '발표회 또 열기' : '발표회 열기'}</button></div>`).join('') +
      `<h3 class="qsec">학생 명부 <small>${yearLabel()} 대표 학생 ${S.roster.list.length}명</small></h3>` +
      `<div class="roster">${S.roster.list.map((s, i) => `<button class="rs-row${rt.clubPick === i ? ' pick' : ''}" type="button" data-ri="${i}">${kidFace(s.sp, s.r)}` +
        `<span class="rs-nm"><b>${esc(s.nm)}</b><small>${s.c >= 0 ? CLUBS[s.c].name : '동아리 없음'}</small></span>` +
        `<span class="rs-ab">${ABIL.map((n, j) => `<i class="${s.c >= 0 && CLUBS[s.c].ab === j ? 'on' : ''}"><em>${n}</em><span>${starTxt(star(s.a[j]))}</span></i>`).join('')}</span></button>`).join('')}</div>`;
  }
  // 동아리 자리 고르기: 자리를 누르면 명부에서 학생을 골라요(그 동아리에 맞는 능력치 순서)
  function openSeatPick(c) {
    rt.seatClub = c; rt.seatStudent = null; $('#seatOut').hidden = true;
    const C = CLUBS[c], L = S.roster.list.map((s, i) => [s, i]).sort((x, y) => y[0].a[C.ab] - x[0].a[C.ab]);
    $('#seatTitle').textContent = `${C.name}에 넣을 학생`;
    $('#seatList').innerHTML = L.map(([s, i]) => `<button class="rs-row${s.c === c ? ' pick' : ''}" type="button" data-pick="${i}">${kidFace(s.sp, s.r)}<span class="rs-nm"><b>${esc(s.nm)}</b><small>${s.c >= 0 ? CLUBS[s.c].name : '동아리 없음'}</small></span>` +
      `<span class="rs-one">${ABIL[C.ab]} <b>${starTxt(star(s.a[C.ab]))}</b></span></button>`).join('') +
      `<p class="note">다른 동아리 학생을 고르면 이 동아리로 옮겨요. 자리가 차 있으면 별이 가장 적은 부원과 바꿔요.<br>바꾼 학생은 이번 주 능력치 오름을 다시 세요.</p>`;
    openModal($('#mSeat'));
  }
  // 학교 복도: 상점 거리처럼 복도 배경 위에 방문. 동아리실이 먼저 열리고 나머지 방은 앞으로 들어와요
  const hallOpen = () => rosterOn();
  function renderHall() {
    const bg = (uniNow() && IMG('hall_bg_uni')) || IMG('hall_bg');   // 대학교 복도 그림(작업지시서 62)이 들어오면 그것을 써요
    $('#hallScene').style.backgroundImage = bg ? `url("${bg}")` : '';
    $('#hallScene').classList.toggle('fb', !bg);
    $$('#panelHall .sf-pic').forEach(el => {
      const u = IMG(el.dataset.front);
      el.classList.toggle('fb', !u); el.style.backgroundImage = u ? `url("${u}")` : '';
    });
    $('#hallClubN').textContent = showReady() || showQuestFree() ? '발표회!' : `${clubSum()}%`;
    // 학생회실: 반장 선거가 열리면 문이 열려요
    const hc = $('#hdCouncil');
    if (hc && elOpen()) {
      hc.classList.remove('soon'); hc.setAttribute('aria-disabled', 'false'); hc.removeAttribute('data-soon'); hc.setAttribute('aria-label', '학생회실, 반장 선거');
      const chip = hc.querySelector('.sf-soon'); if (chip) chip.className = 'sf-have';
      const pres = elPres(); hc.querySelector('.sf-have').textContent = pres ? `반장 ${pres.nm}` : '투표하기!';
    }
    // 칭찬 게시판: 칭찬 스티커판이 열리면 문이 열려요
    const hb = $('#hdBoard');
    if (hb && skOpen()) {
      hb.classList.remove('soon'); hb.setAttribute('aria-disabled', 'false'); hb.removeAttribute('data-soon'); hb.setAttribute('aria-label', '칭찬 게시판, 칭찬 스티커판');
      const chip = hb.querySelector('.sf-soon'); if (chip) chip.className = 'sf-have';
      hb.querySelector('.sf-have').textContent = skFull() ? '상 받기!' : `${S.sk.cur.length}/${SK.full}장`;
    }
    // 교무실: 시험 기간
    const ho = $('#hdOffice');
    if (ho && exOpen()) {
      ho.classList.remove('soon'); ho.setAttribute('aria-disabled', 'false'); ho.removeAttribute('data-soon'); ho.setAttribute('aria-label', '교무실, 시험 기간');
      const chip = ho.querySelector('.sf-soon'); if (chip) chip.className = 'sf-have';
      ho.querySelector('.sf-have').textContent = exReportReady() ? '성적표!' : exNow() ? '시험 주' : `시험 ${exDays()}일 뒤`;
    }
    // 복도의 새 방: 대학교에서는 학과 사무실(학생회관을 지어야 열려요). 다른 학교급에서는 그대로 '새 방, 공사 중'
    const hp = $('#hdDept');
    if (hp && uniNow()) {
      const on = deptOpen(); setT($('b', hp), '학과 사무실');
      hp.classList.toggle('soon', !on); hp.setAttribute('aria-disabled', on ? 'false' : 'true'); hp.setAttribute('aria-label', on ? '학과 사무실, 단과대학 고르기' : '학과 사무실, 학생회관을 지으면 열려요');
      if (on) hp.removeAttribute('data-soon'); else hp.setAttribute('data-soon', '학생회관을 지으면 학과 사무실이 열려요');
      const chip = hp.querySelector('.sf-soon, .sf-have'); if (chip) { chip.className = on ? 'sf-have' : 'sf-soon'; chip.textContent = on ? `${deptPicks().length}/${deptSlots()}곳` : '준비 중'; }
    }
    // 상담실: 고등학교부터 진로 상담
    const hs = $('#hdCounsel');
    if (hs && S.tier >= CS.tier) {
      hs.classList.remove('soon'); hs.setAttribute('aria-disabled', 'false'); hs.removeAttribute('data-soon'); hs.setAttribute('aria-label', '상담실, 진로 상담');
      const chip = hs.querySelector('.sf-soon'); if (chip) chip.className = 'sf-have';
      const left = csLeft(); hs.querySelector('.sf-have').textContent = left ? `상담 ${left}번` : `꿈 ${S.roster.list.filter(csDone).length}명`;
    }
  }
  // 복도 버튼 그림: 초록 틀의 교실 문(창문, 손잡이, 이름표)
  const HALL_DOOR = '<svg viewBox="-12 -12 24 24" aria-hidden="true"><rect x="-11" y="9.4" width="22" height="2.2" rx="1.1" fill="#C9A06A"/>' +
    '<rect x="-8.2" y="-10.4" width="16.4" height="20.4" rx="2.4" fill="#4F7A3A"/><rect x="-6.4" y="-8.6" width="12.8" height="18.4" rx="1.4" fill="#D69A55"/>' +
    '<rect x="-4.6" y="-6.8" width="9.2" height="6.6" rx="1.6" fill="#BFE3F2" stroke="#8A5D2B" stroke-width=".8"/><path d="M0 -6.8 v6.6 M-4.6 -3.5 h9.2" stroke="#8A5D2B" stroke-width=".7"/>' +
    '<path d="M-3.4 -4.6 l1.6 -1.2" stroke="#FFFFFF" stroke-width=".7" stroke-linecap="round" opacity=".85"/>' +
    '<rect x="-4.6" y="1.4" width="9.2" height="6.6" rx="1" fill="none" stroke="#B57A3A" stroke-width=".8"/><circle cx="3.9" cy="0.2" r="1.05" fill="#F3C04B" stroke="#A97A16" stroke-width=".4"/>' +
    '<rect x="-3.6" y="-12" width="7.2" height="3" rx="1" fill="#FFF4D6" stroke="#8A5D2B" stroke-width=".6"/><path d="M-1.8 -10.5 h3.6" stroke="#8A5D2B" stroke-width=".7" stroke-linecap="round"/></svg>';
  function renderHallBtn() {
    const b = $('#btnHall'); if (!b) return;
    b.hidden = !hallOpen();
    if (b.hidden) return;
    const ready = showReady() || showQuestFree();
    $('#hallN').textContent = ready ? '발표회!' : '열기';
    $('#hallDot').hidden = !ready;
    b.setAttribute('aria-label', ready ? '학교 복도, 동아리 발표회를 열 수 있어요' : '학교 복도');
    const ic = $('#hallIc');
    if (!ic.firstChild) ic.innerHTML = HALL_DOOR;
  }
  // 1초마다: 발표회 남은 날만 고쳐요(창 전체를 다시 그리지 않아요)
  function renderClubLite() {
    const n = $('#clubShowNote'); if (!n || !rosterOn()) return;
    if (n.textContent !== showNote()) renderClub();
  }
  // 명부에서 학생을 누르면 동아리를 골라요
  function openClubPick(i) {
    const s = S.roster.list[i]; if (!s) return;
    rt.seatStudent = i; rt.seatClub = null;
    $('#seatTitle').textContent = `${s.nm}의 동아리`;
    $('#seatList').innerHTML = CLUBS.map((C, c) => `<button class="club-pickc${s.c === c ? ' pick' : ''}" type="button" data-pickc="${c}">${clubBadge(c, 32)}<span class="rs-nm"><b>${C.name}</b><small>${clubMembers(c).length}/${CLUB.seats}명</small></span>` +
      `<span class="rs-one">${ABIL[C.ab]} <b>${starTxt(star(s.a[C.ab]))}</b></span></button>`).join('') +
      `<p class="note">자리가 차 있으면 별이 가장 적은 부원과 바꿔요.<br>바꾼 학생은 이번 주 능력치 오름을 다시 세요.</p>`;
    $('#seatOut').hidden = s.c < 0;
    openModal($('#mSeat'));
  }
