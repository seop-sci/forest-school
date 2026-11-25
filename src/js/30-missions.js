  /* ---------- 오늘의 미션과 주간 리그 ----------
     오늘의 미션: 하루에 3개, 자정에 바뀌어요. 하나에 황금 도토리 1개와 수업료 5분치, 셋 다 하면 보너스 상자(황금 도토리 1개, 수료증 1장).
     주간 리그: 월요일마다 새로 시작해요. 이번 주에 한 일로 리그 점수를 모아 겨뤄요(오래 한 학교만 이기지 않게, 학교 크기와 상관없는 점수).
     미션 하나 10점, 보너스 상자 20점, 학교 행사 성공 15점(실패 5점), 체험학습 10점 + 1시간마다 5점, 종업식 20점, 퀘스트 하나 3점.
     지난주 리그가 끝나면 마지막으로 본 순위로 보상을 받아요: 1위 30개, 2~3위 20개, 10위 안 10개, 참여만 해도 3개 */
  const MISSIONS = {
    // 줍기와 흔들기는 놀이터(참나무)가 있어야 해요. 놀이터를 짓기 전에는 고르지 않아요
    picks: { n: 15, name: n => `떨어진 도토리 ${n}개 줍기`, v: () => S.st.picks, ok: () => S.f.playground >= 1 },
    shakes: { n: 20, name: n => `참나무 ${n}번 흔들기`, v: () => S.st.shakes, ok: () => S.f.playground >= 1 },
    ups: { n: 15, name: n => `시설이나 가구 ${n}번 고치기`, v: () => S.st.ups, ok: () => false },
    trains: { n: 2, name: n => `선생님 연수 ${n}번 보내기`, v: () => S.st.trains, ok: () => false },
    subs: { get n() { return S && S.tier >= 4 ? 1 : 2; }, name: n => `학생 부탁 ${n}개 들어주기`,   /* 대학교부터는 부탁이 오래 걸려서 1개 */ v: () => S.q.subDone, ok: () => S.q.m >= SUB_UNLOCK },
    puzzle: { n: 1, name: () => '숲속 퍼즐 한 판 끝내기', v: () => S.st.pz || 0, ok: () => !liveOff('puzzle') },
    merge: { n: 2, name: n => `숲속 합치기 주문 ${n}개 채우기`, v: () => S.mg.st.orders, ok: () => !liveOff('merge') },
    fest: { n: 1, name: () => '학교 행사 한 번 열기', v: () => S.st.sports + Object.values(S.fest.n).reduce((a, b) => a + b, 0), ok: () => FEST_IDS.some(festOpen) },
    trip: { n: 1, name: () => '체험학습 다녀오기', v: () => S.st.trips, ok: () => tripOpen() },
    ns: { n: 1, name: () => '야간 자율학습 켜거나 예약하기', v: () => S.ns ? S.ns.n : 0, ok: () => nsOpen() && !nsUsedTonight() },   // 고등학교 기숙사부터
    cs: { n: 1, name: () => '진로 상담 한 번 하기', v: () => S.cs ? S.cs.talks : 0, ok: () => csOpen() && csLeft() > 0 }   // 고등학교부터
  };
  const DM = { min: 5, bonusGold: 1, bonusDip: 1 };
  const LP = { mission: 10, bonus: 20, festWin: 15, festLose: 5, trip: 10, tripHour: 5, grad: 20, quest: 3 };
  const LG_PRIZE = r => 1;   // 광고가 아닌 보상은 모두 1개
  // 주는 월요일에 시작해요. 2026년 1월 5일(월)부터 몇 번째 주인지
  // 주 번호: 게임 시계의 gameWeek(한국 시간 월요일 0시 시작, 이 0). 전에는 기기 시간대의 월요일이었는데 번호 체계는 같아요
  const weekIdx = () => gameWeek();
  function dayHash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  // 날이 바뀌면 오늘의 미션 3개를 새로 골라요 (열려 있는 것 가운데에서, 날짜와 학교 번호로 섞어요)
  function repairMissions(list, defs) {
    let changed = false;
    for (const m of list) {
      const d = defs[m.id];
      if (!d || m.done || d.v() - m.b >= d.n || !d.ok || d.ok()) continue;
      const id = Object.keys(defs).find(k => !list.some(x => x.id === k) && (!defs[k].ok || defs[k].ok()));
      if (!id) continue;
      m.id = id; m.b = defs[id].v(); changed = true;
    }
    return changed;
  }
  function swapDaily(i) {
    dmDay(); const m = S.dm.list[i];
    if (!m || S.dm.swapped || S.dm.bonus || m.done || dmReady(m)) return false;
    const id = Object.keys(MISSIONS).find(k => !S.dm.list.some(x => x.id === k) && (!MISSIONS[k].ok || MISSIONS[k].ok()));
    if (!id) { toast('지금 바꿀 수 있는 미션이 없어요'); return false; }
    m.id = id; m.b = MISSIONS[id].v(); S.dm.swapped = true;
    save(); renderMissions(); return true;
  }
  function dmDay() {
    const t = gameToday();
    if (S.dm.day === t) { if (repairMissions(S.dm.list, MISSIONS)) save(); return; }
    const ids = Object.keys(MISSIONS).filter(id => !MISSIONS[id].ok || MISSIONS[id].ok());
    let h = dayHash(t + S.pid);
    const pick = [];
    while (pick.length < 3 && ids.length) { const i = h % ids.length; pick.push(ids.splice(i, 1)[0]); h = Math.imul(h ^ (h >>> 13), 1103515245) >>> 0; }
    S.dm = { day: t, list: pick.map(id => ({ id, b: MISSIONS[id].v(), done: false })), bonus: false, swapped: false };
  }
  const dmProg = m => Math.max(0, Math.min(MISSIONS[m.id].n, MISSIONS[m.id].v() - m.b));
  const dmReady = m => !m.done && dmProg(m) >= MISSIONS[m.id].n;
  const dmAllDone = () => S.dm.list.length > 0 && S.dm.list.every(m => m.done);
  const dmClaimable = () => S.dm.list.some(dmReady) || (dmAllDone() && !S.dm.bonus);
  function claimMission(i) {
    const m = S.dm.list[i];
    if (!m || !dmReady(m)) return;
    m.done = true;
    S.st.dmDone += 1; addMP(MP.daily);
    mgAddEnergy(MG.E.dm);   // 숲속 합치기 에너지
    const v = Math.max(10, nice(rate() * 60 * DM.min * elMult('mission')));   // 반장 공약
    S.budget += v; earn(v);
    addLeague(LP.mission);
    sfx('quest'); buzz(12);
    const skIt = skAdd(), tkIt = tkGive('dm');   // 칭찬 스티커, 단축권
    showReward({ title: '미션 완료!', sub: MISSIONS[m.id].name(MISSIONS[m.id].n), items: [skIt, tkIt].filter(Boolean).concat([{ ic: 'acorn', t: `도토리 +${fmt(v)}` }, { ic: 'mge', t: `합치기 에너지 +${MG.E.dm}` }, { ic: 'mp', t: `미션 포인트 +${MP.daily}` }]) });
    save(); renderMissions(); renderHUD(); updateQuestDot();
  }
  function claimBonus() {
    if (!dmAllDone() || S.dm.bonus) return;
    S.dm.bonus = true;
    addMP(MP.bonus);
    mgAddEnergy(MG.E.bonus);
    const gIt = goldOr(DM.bonusGold); addDip(DM.bonusDip);
    addLeague(LP.bonus);
    sfx('quest'); buzz(20);
    showReward({ title: '보너스 상자를 열었어요!', sub: '오늘의 미션을 모두 마쳤어요', items: [gIt, { ic: 'mge', t: `합치기 에너지 +${MG.E.bonus}` }, { ic: 'dip', t: `수료증 +${DM.bonusDip}장` }, { ic: 'mp', t: `미션 포인트 +${MP.bonus}` }] });
    save(); renderMissions(); renderHUD(); updateQuestDot();
  }
  /* 모두 받기: 오늘의 미션과 보너스 상자, 이번 주 미션과 상자, 패스 미션, 이벤트 미션, 학생 부탁 가운데 지금 받을 수 있는 것을 한 번에 받아요
     받는 양과 차례는 하나씩 누를 때와 같아요(같은 함수를 차례로 불러요). 보상 창만 하나로 모아요 */
  function claimables() {
    if (!S) return 0;
    // '모두 받기'는 미션을 받은 뒤 그 미션 포인트로 열리는 상자와 마지막 미션 뒤의 보너스까지 받아서, 띠의 개수(3)와 받은 창의 개수(4)가 달랐어요. 받은 뒤 열릴 것까지 미리 세요
    const dmR = S.dm.list.filter(dmReady).length, wkR = S.wk.list.filter(wkReady).length;
    const bonus = !S.dm.bonus && S.dm.list.length > 0 && S.dm.list.every(m => m.done || dmReady(m)) ? 1 : 0;
    const pts = S.wk.pts + dmR * MP.daily + bonus * MP.bonus + wkR * MP.week;
    let n = dmR + bonus + wkR + MP_BOX.filter((B, i) => !S.wk.got[i] && pts >= B.at).length + S.q.subs.filter(subReady).length;
    try { if (psOpen()) n += S.ps.dl.filter(psReady).length + S.ps.wl.filter(psReady).length; } catch (e) { /* 패스가 아직 준비 전 */ }
    try { if (evLive()) n += S.ev.list.filter(evReady).length; } catch (e) { /* 이벤트가 아직 준비 전 */ }
    return n;
  }
  function claimAllNow() {
    if (!S || rt.paused || rt.batch) return 0;
    dmDay(); wkWeek();
    const b0 = S.budget, B = rt.batch = { items: [], n: 0 };
    try {
      S.dm.list.forEach((m, i) => { if (dmReady(m)) claimMission(i); });
      if (dmAllDone() && !S.dm.bonus) claimBonus();
      S.wk.list.forEach((m, i) => { if (wkReady(m)) claimWeekMission(i); });
      if (psOpen()) { psSync(); S.ps.dl.forEach((m, i) => { if (psReady(m)) psClaimMission('d', i); }); S.ps.wl.forEach((m, i) => { if (psReady(m)) psClaimMission('w', i); }); }
      if (evLive()) S.ev.list.forEach((m, i) => { if (evReady(m)) claimEvMission(i); });
      S.q.subs.filter(subReady).map(q => q.id).forEach(id => claimSub(id, null));
      MP_BOX.forEach((_, i) => { if (boxReady(i)) claimBox(i); });   // 상자는 맨 뒤에(방금 받은 미션 포인트로 열리는 상자까지)
    } finally { rt.batch = null; }
    if (!B.n) return 0;
    const ac = S.budget - b0, items = psMergeItems(B.items.filter(it => it && it.ic !== 'acorn').map(it => ({ ic: it.ic, t: String(it.t).replace(/ \(\d+\/\d+\)$/, '') })));   // '칭찬 스티커 +1장 (3/20)'처럼 뒤에 붙은 진행 숫자는 떼고 합쳐요
    if (ac >= 1) items.unshift({ ic: 'acorn', t: `도토리 +${fmt(ac)}` });
    showReward({ title: '모두 받았어요!', sub: `보상 ${B.n}개를 한 번에 받았어요`, items });
    save(); renderMissions(); renderHUD(); updateQuestDot();
    return B.n;
  }
  /* 오늘 할 일 판: 하루 횟수가 있는 활동의 남은 횟수와 바로 가기를 한 줄씩 보여 줘요(열린 것만). 새 저장 칸은 접기(S.fold.td)뿐이에요 */
  const TODO = [
    { k: 'rd', nm: '책 읽기', u: '권', on: () => rdReady(), left: () => rdLeft(), go: 'rdBooks' },
    { k: 'bk', nm: '문제집', u: '권', on: () => !!S.ac, left: () => AC.keys.reduce((a, k) => a + acBkLeft(k), 0), go: 'acBook' },
    { k: 'pz', nm: '숲속 퍼즐', u: '판', on: () => !liveOff('puzzle'), left: () => pzLeft(), go: 'pz' },
    { k: 'bt', nm: '숲속 대결', u: '판', on: () => btOpen(), left: () => btLeft(), go: 'btPlays' },
    { k: 'pc', nm: '숲속 소풍', u: '번', on: () => pcReady(), left: () => (S.pc.day === gameToday() ? 0 : 1), go: 'picnics' },
    { k: 'cs', nm: '진로 상담', u: '번', on: () => hallOpen() && csOpen(), left: () => csLeft(), go: 'csTalk' },
    { k: 'sk', nm: '칭찬 스티커', u: '장', on: () => skOpen(), left: () => skLeft(), go: 'stickers', sub: '미션과 부탁을 끝내면 받아요' },
    { k: 'gift', nm: '단짝 선물', u: '번', on: () => frList().length > 0, left: () => frGiftLeft(), go: 'frGift' },
    { k: 'boost', nm: '보충수업', u: '번', on: () => !!S.u.boost, left: () => Math.max(0, boostLeft()), go: 'home', tip: '홈에 있으면 지도 왼쪽 위에 가끔 나타나요', sub: '홈에서 기다리면 나와요' },
    { k: 'deal', nm: '까치 핫딜', u: '번', on: () => dealUnlocked(), left: () => Math.max(0, dealLeft()), go: 'home', tip: '홈에 있으면 까치가 가끔 찾아와요', sub: '홈에서 기다리면 나와요' }
  ];
  function todoRows() { const out = []; for (const T of TODO) { let on = false, left = 0; try { on = !!T.on(); if (on) left = T.left(); } catch (e) { on = false; } if (on) out.push({ T, left }); } return out; }
  function todoGo(k) {
    const T = TODO.find(x => x.k === k); if (!T || rt.paused) return;
    sfx('tap');
    if (T.go === 'home') { setTab('school'); toast(T.tip); return; }
    goTo({ t: T.go });
    if (k === 'bk') setTimeout(() => toast("과목 옆 '문제집 구매'를 눌러요"), 300);
  }
  function renderTodo() {
    const rows = todoRows(); if (!rows.length) return '';
    const pas = r => r.T.go === 'home' || r.T.k === 'sk';   // 기다리면 오는 것(보충수업, 핫딜, 스티커)은 '가기' 없이 맨 아래에
    rows.sort((a, b) => (pas(a) ? 1 : 0) - (pas(b) ? 1 : 0));
    const n = rows.filter(r => r.left > 0 && !pas(r)).length, fold = !!(S.fold && S.fold.td);
    return `<h4 class="dm-h td-h"><button type="button" class="td-fold" data-td-fold aria-expanded="${fold ? 'false' : 'true'}">오늘 할 일 <small>${n ? `${n}가지 남음` : '모두 했어요'}</small><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button></h4>` +
      (fold ? '' : '<div class="td-list">' + rows.map(({ T, left }) => left > 0 && pas({ T })
        ? `<div class="td-row wait"><b>${T.nm}</b><span>${left}${T.u} 남음${T.sub ? `, ${T.sub}` : ''}</span></div>`
        : left > 0
        ? `<button type="button" class="td-row" data-todo="${T.k}"><b>${T.nm}</b><span>${left}${T.u} 남음${T.sub ? `, ${T.sub}` : ''}</span><em>가기 ›</em></button>`
        : `<div class="td-row done"><b>${T.nm}</b><span>${CHECK}다 했어요</span></div>`).join('') + '</div>');
  }
  function renderMissions() {
    const box = $('#qDaily');
    if (!box || !S) return;
    dmDay();
    const gi = `<svg viewBox="-8 -11 16 20" aria-hidden="true">${GOLD_ICON.slice(GOLD_ICON.indexOf('>') + 1, -6)}</svg>`;
    wkWeek();
    let evK = 0; try { evK = evClaimable() ? 1 : 0; } catch (e) { /* 무시 */ }
    const cn = claimables(), td = renderTodo();
    const key = cn + '|' + td + '|' + evK + '|' + S.dm.day + '|' + S.dm.list.map(m => `${m.id}:${dmProg(m)}:${m.done ? 1 : 0}`).join(',') + '|' + S.dm.bonus + '|' + S.wk.week + ':' + S.wk.pts + ':' + S.wk.got.join('') + ':' + S.wk.list.map(m => `${m.id}:${wkProg(m)}:${m.done ? 1 : 0}`).join(',');
    if (box.dataset.key === key) return;
    box.dataset.key = key;
    const all = dmAllDone();
    let evOn = false; try { evOn = evClaimable(); } catch (e) { /* 무시 */ }
    box.innerHTML = (cn >= 2 ? `<button class="dm-ev dm-all" type="button" data-claim-all><span><b>받을 보상 ${cn}개</b><small>미션, 상자, 패스와 이벤트 미션, 학생 부탁</small></span><span class="cta small" aria-hidden="true">모두 받기</span></button>` : '') + (evOn ? '<button class="dm-ev" type="button" data-go="event"><span><b>이벤트에서 받을 선물이 있어요</b><small>이벤트 미션, 이벤트 도장, 기념 상자</small></span><span aria-hidden="true">›</span></button>' : '') + renderWeek() + td + '<h4 class="dm-h">오늘의 미션 <small>자정에 바뀌어요</small></h4>' + S.dm.list.map((m, i) => {
      const M = MISSIONS[m.id], p = dmProg(m), ready = dmReady(m);
      return `<div class="dm${m.done ? ' done' : ''}"><div class="dm-tx"${goAt(m.id, !m.done && !ready)}><b>${M.name(M.n)} <em>+${MP.daily}점</em></b><div class="qbar"><i style="width:${(p / M.n * 100).toFixed(0)}%"></i></div></div>` +
        (m.done ? `<span class="dm-ok">${CHECK}</span>` : ready ? `<button class="cta small" type="button" data-dm="${i}">받기</button>` : `<span class="dm-n">${p}/${M.n}${!S.dm.swapped && !S.dm.bonus ? `<button type="button" class="btn-sub small" data-dmswap="${i}" aria-label="미션 바꾸기, 하루 한 번 무료">바꾸기</button>` : ''}</span>`) + '</div>';
    }).join('') +
      `<div class="dm bonus${S.dm.bonus ? ' done' : ''}"><div class="dm-tx"><b>보너스 상자 <em>+${MP.bonus}점</em></b><span>${S.dm.list.length === 3 ? '셋 다' : '모두'} 하면</span>${rwChips([['gold', DM.bonusGold], ['dip', DM.bonusDip], ['⚡', MG.E.bonus]])}</div>` +
      (S.dm.bonus ? `<span class="dm-ok">${CHECK}</span>` : all ? '<button class="cta small" type="button" data-dm="bonus">열기</button>' : `<span class="dm-n">${S.dm.list.filter(m => m.done).length}/${S.dm.list.length}</span>`) + '</div>' +
      `<h4 class="dm-h">이번 주 미션 <small>월요일에 바뀌어요</small></h4><div class="dm-rw"><span>미션 하나에</span>${rwChips([['gold', MP.weekGold], ['⚡', MG.E.wk]])}</div>` + renderWeekList();
  }

  // 주간 리그
  function lgWeek() {
    const w = weekIdx();
    if (S.lg.week === w) return;
    if (w < S.lg.week) return;   // 주 번호가 뒤로 가면(시간대 바꿈, 업데이트 순간) 아무것도 안 해요. 같은 주 번호로 보상을 두 번 주지 않아요
    // 지난주가 끝났어요: 참여했으면 마지막으로 본 순위로 보상
    if (S.lg.week >= 0 && S.lg.pts > 0 && !S.lg.paid) {
      const r = S.lg.pos || 99, g = LG_PRIZE(r);
      S.lg.last = { week: S.lg.week, pts: S.lg.pts, pos: S.lg.pos || 0, gold: g };
      const pos = S.lg.pos || 0;
      const gIt = goldOr(g);   // 보상은 바로 주고 안내만 늦게(창을 닫아도 사라지지 않게). 60개 뒤에는 정수
      setTimeout(() => toast(`지난주 리그 ${pos ? pos + '위' : '참여'} 보상! ${gIt ? gIt.t : ''}`), 1500);
    }
    S.lg = { week: w, pts: 0, pos: 0, paid: false, last: S.lg.last || null };
  }
  // 높은 학교급은 퀘스트와 식이 오래 걸려 리그 점수가 불리했어요. 퀘스트와 종업식, 방학식 점수(진행 점수)는 합쳐서 하루 LG_PROG점까지만 쌓여요
  // 봇으로 잰 하루 진행 점수: 초등 73, 중 128, 고 46, 대학교 35, 대학원 16 → 상한 30이면 초중고대 30, 대학원 16(주 합계 차이 2.2배 → 1.14배쯤)
  const LG_PROG = 30;
  const lgProgLeft = () => { const t = gameToday(); return S.lg.dq && S.lg.dq.day === t ? Math.max(0, LG_PROG - S.lg.dq.p) : LG_PROG; };
  function addLeague(p, prog) {
    if (!(p > 0)) return;
    if (prog) { const t = gameToday(); if (!S.lg.dq || S.lg.dq.day !== t) S.lg.dq = { day: t, p: 0 }; p = Math.min(p, LG_PROG - S.lg.dq.p); if (!(p > 0)) return; S.lg.dq.p += p; }
    lgWeek();
    S.lg.pts += Math.round(p);
    rsAdd(p);   // 랭킹 시즌 점수
    rankDirty();
  }
  const lgKey = () => weekIdx() * 1e6 + Math.min(999999, S.lg.pts);

  /* ---------- 이번 주 미션과 미션 포인트 ----------
     이번 주 미션: 월요일마다 4개, 크게 해야 하는 일. 하나에 황금 도토리 1개.
     미션 포인트: 오늘의 미션 20점, 보너스 상자 40점, 이번 주 미션 50점. 일주일 동안 모아서 상자 5개를 차례로 열어요.
     마지막 상자(650점)는 처음 한 번 금빛 왕관(주간 보상으로만 받는 모자)을 줘요. 하루 미션을 5일 완주하고 주간 미션 3개를 마치면 열 수 있어요 */
  const WMISSIONS = {
    puzzle: { n: 5, name: n => `숲속 퍼즐 ${n}판 끝내기`, v: () => S.st.pz || 0, ok: () => !liveOff('puzzle') },
    merge: { n: 10, name: n => `숲속 합치기 주문 ${n}개 채우기`, v: () => S.mg.st.orders, ok: () => !liveOff('merge') },
    shakes: { n: 60, name: n => `참나무 ${n}번 흔들기`, v: () => S.st.shakes, ok: () => S.f.playground >= 1 },
    picks: { n: 150, name: n => `떨어진 도토리 ${n}개 줍기`, v: () => S.st.picks, ok: () => S.f.playground >= 1 },   // 놀이터가 있어야 해요
    ups: { n: 100, name: n => `시설이나 가구 ${n}번 고치기`, v: () => S.st.ups, ok: () => false },
    trains: { n: 10, name: n => `선생님 연수 ${n}번 보내기`, v: () => S.st.trains, ok: () => false },
    daily: { n: 12, name: n => `오늘의 미션 ${n}개 마치기`, v: () => S.st.dmDone },
    subs: { get n() { return S && S.tier >= 4 ? 5 : 10; }, name: n => `학생 부탁 ${n}개 들어주기`,   /* 대학교부터 5개 */ v: () => S.q.subDone, ok: () => S.q.m >= SUB_UNLOCK },
    fest: { n: 4, name: n => `학교 행사 ${n}번 열기`, v: () => MISSIONS.fest.v(), ok: () => FEST_IDS.some(festOpen) },
    trip: { n: 3, name: n => `체험학습 ${n}번 다녀오기`, v: () => S.st.trips, ok: () => tripOpen() }
  };
  const MP = { daily: 20, bonus: 40, week: 50, weekGold: 1 };
  const MP_BOX = [
    { at: 100, gold: 1, min: 10 },
    { at: 250, gold: 1, dip: 2, min: 20 },
    { at: 350, gold: 1, feast: true, min: 30 },
    { at: 500, gold: 1, dip: 5, min: 45 },
    { at: 650, gold: 1, crown: true, min: 60 }
  ];
  function wkWeek() {
    const w = weekIdx();
    if (S.wk.week === w) { if (repairMissions(S.wk.list, WMISSIONS)) save(); return; }
    if (w < S.wk.week) return;   // 주 번호가 뒤로 가면 이번 주 미션과 상자를 다시 열지 않아요
    const ids = Object.keys(WMISSIONS).filter(id => !WMISSIONS[id].ok || WMISSIONS[id].ok());
    let h = dayHash('w' + w + S.pid);
    const pick = [];
    while (pick.length < 4 && ids.length) { const i = h % ids.length; pick.push(ids.splice(i, 1)[0]); h = Math.imul(h ^ (h >>> 13), 1103515245) >>> 0; }
    S.wk = { week: w, pts: 0, got: MP_BOX.map(() => false), list: pick.map(id => ({ id, b: WMISSIONS[id].v(), done: false })) };
  }
  const wkProg = m => Math.max(0, Math.min(WMISSIONS[m.id].n, WMISSIONS[m.id].v() - m.b));
  const wkReady = m => !m.done && wkProg(m) >= WMISSIONS[m.id].n;
  const boxReady = i => !S.wk.got[i] && S.wk.pts >= MP_BOX[i].at;
  const wkClaimable = () => S.wk.list.some(wkReady) || MP_BOX.some((_, i) => boxReady(i));
  function addMP(p) { wkWeek(); S.wk.pts += p; }
  function claimWeekMission(i) {
    const m = S.wk.list[i];
    if (!m || !wkReady(m)) return;
    m.done = true;
    const gIt = goldOr(MP.weekGold); addMP(MP.week); addLeague(LP.mission * 2);
    mgAddEnergy(MG.E.wk);
    sfx('quest'); buzz(15);
    if (rt.batch) { rt.batch.items.push(gIt, { ic: 'mp', t: `미션 포인트 +${MP.week}` }, { ic: 'mge', t: `합치기 에너지 +${MG.E.wk}` }); rt.batch.n += 1; }
    toast(`이번 주 미션 완료! ${gIt.t}, 미션 포인트 +${MP.week}, 합치기 에너지 +${MG.E.wk}`);
    save(); renderMissions(); updateQuestDot();
  }
  function claimBox(i) {
    if (!boxReady(i)) return;
    const B = MP_BOX[i];
    S.wk.got[i] = true;
    const got = [];
    // 상자마다 도토리도 수업료 몇 분치(min)로 넣어요. 학교급이 올라도 알맞은 양이 나와요
    if (B.min) { const v = Math.max(10, nice(rate() * 60 * B.min)); S.budget += v; earn(v); got.push(`도토리 +${fmt(v)}`); }
    if (B.gold) { if (i === MP_BOX.length - 1) { addGold(B.gold); got.push(`황금 도토리 +${B.gold}`); } else { const g = goldOr(B.gold); if (g) got.push(g); } }   // 60개 뒤에는 마지막 상자만 황금
    if (B.dip) { addDip(B.dip); got.push(`수료증 +${B.dip}장`); }
    if (B.feast) { useBooster('feast'); got.push('특식 데이 10분'); }
    if (i === MP_BOX.length - 1) { const it = mgAddUp(1); if (it) got.push(it); }   // 마지막 주간 상자(생산기가 모두 최고면 정수)
    { const tk = tkGive('wk'); if (tk) got.push(tk); }   // 단축권
    if (B.crown) {
      if (!S.cos.own.includes('hat:crown')) { S.cos.own.push('hat:crown'); S.cos.hat = 'crown'; applyCos(); got.push('금빛 왕관 (학생들이 바로 썼어요!)'); }
      else { addGold(1); got.push('황금 도토리 +1 더'); }
    }
    sfx('quest'); buzz(20);
    showReward({ title: `${i + 1}번째 주간 상자를 열었어요!`, items: got.map(t => typeof t === 'object' ? t : ({ ic: /황금/.test(t) ? 'gold' : /^도토리/.test(t) ? 'acorn' : /수료증/.test(t) ? 'dip' : /왕관/.test(t) ? '👑' : /정수/.test(t) ? 'ess' : '🍱', t })) });   // 정수와 단축권이 도시락 그림으로 나왔어요. 정수, 단축권, 생산기 조각은 주는 곳의 그림 그대로
    save(); renderMissions(); renderHUD(); updateQuestDot();
  }
  function renderWeek() {
    wkWeek();
    const top = MP_BOX[MP_BOX.length - 1].at, pct = Math.min(1, S.wk.pts / top) * 100;
    const left = 7 - ((new Date(gameNow() + KST_MS).getUTCDay() + 6) % 7);   // 한국 시간 요일
    const box = (i) => {
      const B = MP_BOX[i], got = S.wk.got[i], ready = boxReady(i);
      const ic = `<svg viewBox="-11 -11 22 22" aria-hidden="true"><rect x="-8" y="-3" width="16" height="10" rx="2" class="${got ? 'mb-open' : 'mb-b'}"/><path d="M-9 -7 H9 V-2 H-9 Z" class="${got ? 'mb-open' : 'mb-l'}"/><rect x="-1.6" y="-7" width="3.2" height="14" class="mb-r"/></svg>`;
      return `<button class="mbox${got ? ' got' : ''}${ready ? ' ready' : ''}" type="button" style="left:${(B.at / top * 100).toFixed(1)}%" data-box="${i}" aria-label="${B.at}점 상자${got ? ', 열었어요' : ready ? ', 열 수 있어요' : ''}">${ic}<small>${B.at}</small></button>`;
    };
    return `<div class="mp"><div class="mp-top"><b>미션 포인트 <span>${S.wk.pts}</span>점</b><small>월요일에 새로 시작 (${left}일 남음)</small></div>` +
      `<div class="mp-track"><div class="mp-bar"><i style="width:${pct.toFixed(1)}%"></i></div>${MP_BOX.map((_, i) => box(i)).join('')}</div>` +
      `<p class="mp-note">오늘의 미션 ${MP.daily}점, 보너스 상자 ${MP.bonus}점, 이번 주 미션 ${MP.week}점. 상자마다 도토리, 황금 도토리${S.tier >= 1 ? ', ' + TK.find(x => x.k === TK_REW.wk[0]).name.replace('권', ' 단축권') : ''}</p></div>`;
  }
  function renderWeekList() {
    return S.wk.list.map((m, i) => {
      const M = WMISSIONS[m.id], p = wkProg(m), ready = wkReady(m);
      return `<div class="dm${m.done ? ' done' : ''}"><div class="dm-tx"${goAt(m.id, !m.done && !ready)}><b>${M.name(M.n)} <em>+${MP.week}점</em></b><div class="qbar"><i style="width:${(p / M.n * 100).toFixed(0)}%"></i></div></div>` +
        (m.done ? `<span class="dm-ok">${CHECK}</span>` : ready ? `<button class="cta small" type="button" data-wm="${i}">받기</button>` : `<span class="dm-n">${fmt(p)}/${fmt(M.n)}</span>`) + '</div>';
    }).join('');
  }

  /* 피버 타임: 행사 동안 지도가 금빛으로 반짝이고, 시작할 때 3, 2, 1 카운트다운, 끝날 때 '끝!' 배너가 떠요 */
  function feverOn(on) {
    $('.stage').classList.toggle('fever', on);
    $('#feverFx').hidden = !on || rt.reduced;
  }
  let feverTimer = 0;
  // 카운트다운 알림판이 행사 자리(광장, 운동장)를 가리지 않게 행사 자리 아래에 띄워요. 아래에 자리가 없으면 위에 띄워요
  function banSpot() {
    let top, bot;
    if (rt.sports) { top = SPORTS.cy - SPORTS.ry - 24; bot = SPORTS.cy + SPORTS.ry + 8; }
    else if (rt.fest) {
      const form = festDef(rt.fest.id).form;
      if (form === 'free') return null;   // 보물찾기는 지도 곳곳에서 해요
      top = pzy() - 84; bot = pzy() + (form === 'stage' ? 58 : 50);
    } else return null;
    const m = layerKids.getScreenCTM && layerKids.getScreenCTM();
    if (!m) return null;
    const a = new DOMPoint(pzx(), top).matrixTransform(m), z = new DOMPoint(pzx(), bot).matrixTransform(m);
    return [a.y, z.y];
  }
  function placeBanner(b) {
    b.style.top = '';
    const sp = banSpot();
    if (!sp) return;
    const h = b.offsetHeight, gap = 14;
    const tabs = $('.tabs'), low = (tabs && tabs.getBoundingClientRect().top) || innerHeight;
    const hud = $('#festBar:not([hidden]), #sportsBar:not([hidden])'), high = hud ? hud.getBoundingClientRect().bottom : 0;
    let c = sp[1] + gap + h / 2;
    if (c + h / 2 > low - 8) {
      const up = sp[0] - gap - h / 2;
      c = up - h / 2 >= high + 8 ? up : low - 8 - h / 2;
    }
    b.style.top = Math.round(c) + 'px';
  }
  function feverBanner(big, small, ms) {
    const b = $('#feverBan');
    $('#fvBig').textContent = big; $('#fvSmall').textContent = small || '';
    b.hidden = false; placeBanner(b); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    clearTimeout(feverTimer);
    if (ms) feverTimer = setTimeout(() => { b.hidden = true; }, ms);
  }
  // 카운트다운이 끝나기 전에는 시간이 흐르지 않고 아무것도 나오지 않아요
  function feverIntro(R, dt, title, how) {
    if (!(R.intro > 0)) return false;
    const before = Math.ceil(R.intro);
    R.intro -= dt;
    const now = Math.ceil(R.intro);
    if (R.intro <= 0) { feverBanner('시작!', how, 900); sfx('tap'); buzz(30); }   // 종소리 대신 가벼운 소리
    else if (now !== before || !R.shown) { R.shown = true; feverBanner(String(now), title, 0); sfx('tap'); buzz(10); }
    return true;
  }
  function feverCombo(R, x, y) {
    const now = performance.now();
    R.combo = now - (R.lastHit || 0) < 1500 ? (R.combo || 0) + 1 : 1;
    R.lastHit = now;
    if (R.combo >= 3) floatText(x, y - 24, `콤보 ${R.combo}!`, 'combo');
  }
  function feverEnd(then) {
    feverBanner('끝!', '', 1000);
    buzz(40);   // 행사 끝 종소리 뺌
    setTimeout(() => { feverOn(false); then(); }, 1000);
  }

