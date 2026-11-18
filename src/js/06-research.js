  /* ---------- 4.2.0 연구 투자 (프로젝트 문서 '4.2.0 설계안 2 (황금 도토리와 광고)' 7절) ----------
     학과 사무실에서 도토리를 넣어 연구를 올려요. 레벨 끝없음, 효과는 상한까지.
     woodani 결정(2026-11-13): 값은 그 레벨이 열린 때의 수업료로 정해 두고 올리기 전까지 그대로, 올리면 그때의 수업료로 다음 값을 새로 정해요. 건축은 레벨마다 -0.5%.
     숫자(레벨마다 효과, 상한, 2시간치, 1.25배)는 본부 제안이에요. var는 다른 곳(공사 시간, 정수, 공부)에서 먼저 불려도 멈추지 않게 */
  var RX = { baseH: 2, grow: 1.25, list: [
    { k: 'study', nm: '학력 연구', per: 2, cap: 100, unit: '공부 경험치', sign: '+', ic: '📚' },
    { k: 'build', nm: '건축 연구', per: 0.5, cap: 30, unit: '공사 시간', sign: '-', ic: '🏗️' },
    { k: 'ess', nm: '정수 연구', per: 1, cap: 30, unit: '받는 숲의 정수', sign: '+', ic: '✨' }] };
  function rxPct(k) { if (!RX || !S || !S.rx) return 0; const R = RX.list.find(x => x.k === k); return R ? Math.min(R.cap, (S.rx.lv[k] || 0) * R.per) : 0; }
  // 4.5.0 woodani 결정(2026-11-15): 대학교에서는 빼고 대학원 연구소 창에서 연구 트리와 함께 열어요(5.0.0). 올린 레벨의 효과(rxPct)는 그대로 남아요
  let RX_TIER = 5;   // 시험(s122)만 window.__forest.rxTier로 바꿔 셈을 확인해요
  const rxOpen = () => deptOpen() && S.tier >= RX_TIER;
  const rxFull = R => rxPct(R.k) >= R.cap;
  // 그 레벨 값: 정해 둔 값이 없을 때만 지금 수업료로 정하고 저장해요
  function rxCost(k) {
    if (!S.rx.c[k]) { S.rx.c[k] = Math.max(100, nice(rate() * 3600 * RX.baseH * Math.pow(RX.grow, S.rx.lv[k] || 0))); save(); }
    return S.rx.c[k];
  }
  function rxUp(k) {
    const R = RX.list.find(x => x.k === k); if (!R || !rxOpen() || rxFull(R)) return false;
    const c = rxCost(k);
    if (S.budget < c) { toast(`도토리가 ${fmt(c - S.budget)}개 모자라요`); return false; }
    S.budget -= c; S.st.rxSpent = (S.st.rxSpent || 0) + c;
    S.rx.lv[k] = (S.rx.lv[k] || 0) + 1; S.rx.c[k] = 0;
    if (!rxFull(R)) rxCost(k);   // 다음 레벨 값은 지금 수업료로 새로 정해요
    sfx('quest'); buzz(15); save(); renderHUD();
    toast(`${R.nm} Lv.${S.rx.lv[k]}!\n${R.unit} ${R.sign}${fmtPct(rxPct(k))}%`);
    return true;
  }
  const fmtPct = v => (Math.round(v * 10) / 10).toString();
  function rxPart(inLab) {
    if (rxOpen() && !inLab && gradOn()) return '<h3 class="fv-h">연구 투자</h3><p class="fine">연구 투자는 연구 구역 연구소에서 해요.</p>';   // 5.0.0
    if (!rxOpen()) {   // 4.5.0 대학교: 올린 연구가 있으면 효과만 보여 주고, 대학원으로 옮긴다고 알려요
      if (!deptOpen()) return '';
      const got = RX.list.filter(R => S.rx.lv[R.k] > 0).map(R => `${R.nm} Lv.${S.rx.lv[R.k]} (${R.unit} ${R.sign}${fmtPct(rxPct(R.k))}%)`);
      return '<h3 class="fv-h">연구 투자</h3><p class="fine">연구 투자는 대학원 연구소로 옮겨요. 대학원이 열리면 연구 트리와 함께 다시 할 수 있어요.' +
        (got.length ? `<br>지금 효과는 그대로 남아요: ${got.join(', ')}` : '') + '</p>';
    }
    return '<h3 class="fv-h">연구 투자</h3><div class="dp-list">' + RX.list.map(R => {
      const lv = S.rx.lv[R.k] || 0, full = rxFull(R), c = full ? 0 : rxCost(R.k), poor = S.budget < c;
      return `<div class="dp-row"><span class="dp-ic">${R.ic}</span><div class="dp-tx"><b>${R.nm} Lv.${lv}</b><small>${R.unit} ${rxPct(R.k) ? R.sign + fmtPct(rxPct(R.k)) : '0'}%${full ? ' (최대)' : `, 다음 ${R.sign}${fmtPct(Math.min(R.cap, (lv + 1) * R.per))}%`}</small></div>` +
        (full ? '<span class="fe-lock">완성</span>' : `<button class="${poor ? 'btn-sub' : 'cta'} small" type="button" data-dp="rx:${R.k}">${acornIcon()}${fmt(c)}</button>`) + '</div>';
    }).join('') + '</div>';
  }
  /* ---------- 5.0.0 연구소 창: 연구 투자와 연구 트리 (설계안 '5.0.0 설계안 (대학원, 연구 구역) 초안' 3절, woodani 결정 2026-11-15) ----------
     연구 트리: 가지 다섯 개 × 칸 네 개. 칸마다 숲의 정수와 그때 수업료 몇 시간치 도토리를 쓰고, 연구 시간이 지나야 올라요(한 번에 하나). 졸업해도 남아요. 숫자는 본부 제안 */
  const RT5 = {
    list: [
      { k: 'class', nm: '수업', ic: 'ic_rt_class', eff: L => `수업료 +${5 * L}%` },
      { k: 'event', nm: '행사', ic: 'ic_rt_event', eff: L => `학교 행사, 축제, 체험학습 도토리 +${10 * L}%` },
      { k: 'tam', nm: '탐험', ic: 'ic_rt_tam', eff: L => `탐험대 힘 +${5 * L}%` + (L >= 4 ? ', 보고서 +2시간' : '') },
      { k: 'time', nm: '시간', ic: 'ic_rt_time', eff: L => `자리 비운 동안 수입 +${L}시간` },
      { k: 'ta', nm: '조교', ic: 'ic_rt_ta', lock: true, eff: () => '조교 파견은 준비 중이에요' }],
    ess: [50, 100, 200, 400], hrs: [1, 2, 4, 8], time: [1, 3, 6, 12], max: 4 };
  const rtLv = k => (S && S.rt5 && S.rt5.lv[k]) || 0;
  const rtClassMul = () => 1 + 0.05 * rtLv('class');
  const rtEvt = () => 1 + 0.1 * rtLv('event');
  const rtTamMul = () => 1 + 0.05 * rtLv('tam');
  const rtCost = k => { const L = Math.min(RT5.max - 1, rtLv(k)); return { ess: RT5.ess[L], ac: nice(rate() * 3600 * RT5.hrs[L]), sec: Math.round(RT5.time[L] * 3600 * (1 - XT.adv.per / 100 * xtLv('adv'))) }; };   // 5.0.0 펠리컨 지도교수님 연수만큼 짧아져요
  const rtOpen = () => gradOn() && (S.f.institute || 0) >= 1;
  const rtHrs = sec => { const m = Math.round(sec / 60), h = Math.floor(m / 60); return h && m % 60 ? `${h}시간 ${m % 60}분` : h ? `${h}시간` : `${m}분`; };   // 5.0.0 연구 시간 글자(지도교수님 연수로 분 단위가 생겨요)
  function rtStart(k) {
    const D = RT5.list.find(x => x.k === k); if (!D || D.lock || !rtOpen()) return false;
    if (S.rt5.cur) { toast('연구는 한 번에 하나씩 해요'); return false; }
    if (rtLv(k) >= RT5.max) return false;
    const c = rtCost(k);
    if (S.ess < c.ess) { toast(essShort(c.ess - S.ess)); return false; }
    if (S.budget < c.ac) { toast(`도토리가 ${fmt(c.ac - S.budget)}개 모자라요`); return false; }
    S.ess -= c.ess; S.st.esSpent = (S.st.esSpent || 0) + c.ess; S.budget -= c.ac;
    S.rt5.cur = { k, end: gameNow() + c.sec * 1000 };
    renderEss(); renderHUD(); save(); sfx('coin'); toast(`${D.nm} 연구를 시작했어요\n${rtHrs(c.sec)} 뒤에 끝나요`);
    return true;
  }
  function rtTick() {
    const c = S && S.rt5 && S.rt5.cur; if (!c || gameNow() < c.end) return;
    const D = RT5.list.find(x => x.k === c.k); S.rt5.lv[c.k] = Math.min(RT5.max, rtLv(c.k) + 1); S.rt5.cur = null; save();
    toast(`${D ? D.nm : ''} 연구 ${rtLv(c.k)}칸 완성!\n${D ? D.eff(rtLv(c.k)) : ''}`); sfx('quest');
    if (!$('#mRx').hidden) renderRx();
  }
  function rtPart() {
    const c = S.rt5.cur, now = gameNow();
    return '<p class="fine">한 번에 하나씩 연구해요. 졸업해도 남아요.</p><div class="dp-list">' + RT5.list.map(D => {
      const L = rtLv(D.k), u = IMG(D.ic), run = c && c.k === D.k, full = L >= RT5.max, k = rtCost(D.k);
      const btn = D.lock ? '<span class="fe-lock">준비 중</span>' : full ? '<span class="fe-lock">완성</span>' : run ? `<span class="fe-lock">${hms(c.end - now)}</span>`
        : `<button class="${c || S.ess < k.ess || S.budget < k.ac ? 'btn-sub' : 'cta'} small" type="button" data-rt="${D.k}">정수 ${k.ess}</button>`;
      return `<div class="dp-row"><span class="dp-ic">${u ? `<img src="${u}" alt="">` : ''}</span><div class="dp-tx"><b>${D.nm} ${'●'.repeat(L)}${'○'.repeat(RT5.max - L)}</b><small>${L ? D.eff(L) : '아직 연구 전'}${D.lock || full ? '' : `, 다음 ${D.eff(L + 1)} (도토리 ${fmt(k.ac)}, ${rtHrs(k.sec)})`}</small></div>${btn}</div>`;
    }).join('') + '</div>';
  }
  function renderRx() {
    const tab = rt.rxTab === 'tree' ? 'tree' : 'inv';
    $$('#rxSeg [data-rseg]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.rseg === tab)));
    setH($('#rxBody'), tab === 'tree' ? rtPart() : rxPart(true));
  }
  function openRx() {
    if (!rtOpen()) { toast('대학원 연구소를 지으면 열려요'); return; }
    if (rt.paused || rt.modalOpen) return;
    renderRx(); openModal($('#mRx')); sfx('tap');
  }
  const deptSlots = () => !uniNow() ? 0 : Math.min(3, yearNo());   // 1학년 1곳, 2학년 2곳, 3학년부터 3곳
  const deptPicks = () => (S.dp && Array.isArray(S.dp.pick) ? S.dp.pick : []).filter(k => deptOf(k)).slice(0, deptSlots());
  const deptLocked = D => !!D.year && yearNo() < D.year;
  function deptLv(D) {   // 그 단과대학이 보는 학력 레벨: 사범대학은 다섯 과목 평균, 의과대학은 과학과 체육 중 낮은 쪽
    const ls = D.sub.map(acLv);
    return D.avg ? ls.reduce((a, b) => a + b, 0) / ls.length : D.low ? Math.min(...ls) : ls[0];
  }
  function deptJobPct(D) {   // 고등학교에서 이룬 진로 가운데 과목이 같은 것 하나마다 +2%, 가장 크면 +10%. 의과대학은 숲속 의사가 두 배
    const done = (S.cs && S.cs.done) || {}; let n = 0;
    for (const J of JOBS) if (done[J.k] && D.sub.includes(DEPT_AB[J.ab])) n += (D.k === 'med' && J.k === 'doctor') ? 2 : 1;
    return Math.min(DEPT.jobMax, n * DEPT.job);
  }
  const deptF = D => { const cap = Math.max(2, acCap()); return Math.max(0, Math.min(1, (deptLv(D) - 1) / (cap - 1))); };   // 그 단과대학 학력이 상한에 얼마나 가까운지(0~1)
  function deptPct(D) {   // 수업료 보너스 %: 기본 10, 학력이 상한에 가까울수록 30까지, 진로 보너스를 더한 뒤 학장 교수님 보너스를 곱해요
    return (DEPT.base + (DEPT.max - DEPT.base) * deptF(D) + deptJobPct(D)) * deanMult();
  }
  // 4.0.0 단과대학마다 따로 받는 보너스(woodani 결정 2026-11-11, 제안표 그대로): [기본, 학력이 상한일 때]. 다니는 곳만 받아요. 학장 교수님은 곱하지 않아요
  const DEPT_X = {
    science: { v: [50, 100], t: n => `실험 성공 도토리 +${n}%` }, sports: { v: [50, 100], t: n => `대결 첫 승 도토리 +${n}%` },
    human: { v: [20, 40], t: n => `책 읽기 국어 XP +${n}%` }, art: { v: [10, 20], t: n => `합치기 에너지 상한 +${n}` },
    biz: { v: [10, 20], t: n => `간식 뽑기 값 -${n}%` }, eng: { v: [5, 10], t: n => `공사 시간 -${n}%` },
    edu: { v: [5, 10], t: n => `연수비 -${n}%` }, med: { v: [1, 2], t: n => `학교 기분 상한 +${n}칸` } };
  const deptXOf = D => { const [a, b] = DEPT_X[D.k].v; return Math.round(a + (b - a) * deptF(D)); };
  const deptX = k => (!S || !uniNow() || !deptPicks().includes(k)) ? 0 : deptXOf(deptOf(k));
  const snMoodMax = () => SN.moodMax + deptX('med');
  const deptMult = () => { if (!S || !uniNow()) return 1; let p = 0; for (const k of deptPicks()) p += deptPct(deptOf(k)); return 1 + p / 100; };
  const deptIc = D => { const u = IMG('ic_col_' + D.k); return u ? `<img src="${u}" alt="">` : D.em; };
  function openDept(room) {   // room: 복도 문으로 들어오면 방 그림(room_dept)을 머리에 보여요
    rt.dpRoom = !!room;
    if (!deptOpen()) { toast(uniNow() ? '학생회관을 지으면 학과 사무실이 열려요' : '단과대학은 대학교부터 열려요'); return; }
    if (rt.paused || rt.modalOpen) return;
    rt.dpSwap = ''; renderDept(); openModal($('#mDept')); sfx('tap');
  }
  function renderDept() {
    const m = $('#mDept'); if (!m || !S.dp) return;
    const picks = deptPicks(), slots = deptSlots(), full = picks.length >= slots, sw = rt.dpSwap ? deptOf(rt.dpSwap) : null;
    const hd = $('#dpHead'), hu = (rt.dpRoom && IMG('room_dept')) || IMG('col_head'); hd.classList.toggle('art', !!hu); hd.style.backgroundImage = hu ? `url("${blobUrl(hu)}")` : '';
    setT($('#dpSlots'), `전공 ${picks.length} / ${slots}`);   // 4.5.0 woodani: 여러 곳을 다니는 대신 주전공과 복수전공으로
    const note = sw ? `${sw.name}${batchim(sw.name) ? '과' : '와'} 바꿀 곳을 골라요` : full ? (S.dp.free ? '이번 한 번은 공짜로 바꿀 수 있어요' : `바꾸려면 숲의 정수 ${DEPT.ess}개가 들어요`) : picks.length ? '복수전공을 하나 더 고를 수 있어요' : '주전공 단과대학을 골라요';
    $('#dpBody').innerHTML = `<p class="dp-note">${note}</p><div class="dp-list">` + DEPT.list.map(D => {
      const on = picks.includes(D.k), lock = deptLocked(D), lv = deptLv(D);
      const subTx = D.avg ? '다섯 과목 평균' : D.low ? '과학과 체육 중 낮은 쪽' : AC.name[D.sub[0]];
      const btn = lock ? `<span class="fe-lock">${D.year}학년부터</span>`
        : sw ? (on ? `<button class="cta small" type="button" data-dp="swap:${D.k}">여기와 바꾸기</button>` : D.k === sw.k ? `<button class="btn-sub small" type="button" data-dp="cancel">그만두기</button>` : '')
        : on ? `<span class="fe-lock">${picks[0] === D.k ? '주전공' : '복수전공'}</span>`
        : `<button class="${full ? 'btn-sub' : 'cta'} small" type="button" data-dp="pick:${D.k}">${full ? '바꾸기' : '고르기'}</button>`;
      return `<div class="dp-row${on ? ' on' : ''}${lock ? ' lock' : ''}"><span class="dp-ic">${deptIc(D)}</span><div class="dp-tx"><b>${D.name}</b><small>${subTx} Lv.${Math.floor(lv)}, ${FAC[D.fac].name}</small><em>수업료 +${Math.round(deptPct(D))}%</em><em class="dp-x">${DEPT_X[D.k].t(deptXOf(D))}</em></div>${btn}</div>`;
    }).join('') + '</div>' + rxPart();   // 4.2.0 연구 투자
  }
  function deptSet(k, out) {   // out: 바꿀 때 빼는 곳('' = 빈 자리에 넣기)
    const D = deptOf(k); if (!D || deptLocked(D) || !deptOpen()) return false;
    let picks = deptPicks(); if (picks.includes(k)) return false;
    if (out) {
      if (!picks.includes(out)) return false;
      if (!S.dp.free) { if (S.ess < DEPT.ess) { toast(essShort(DEPT.ess - S.ess)); return false; } S.ess -= DEPT.ess; S.st.esSpent = (S.st.esSpent || 0) + DEPT.ess; renderEss(); }
      S.dp.free = 0; picks = picks.map(x => x === out ? k : x);
    } else { if (picks.length >= deptSlots()) return false; picks.push(k); }
    S.dp.pick = picks; const first = !S.dp.own[k]; if (first) { S.dp.own[k] = 1; if (S.deco && S.deco.own) S.deco.own['deco_col_' + k] = 1; }
    save(); renderHUD(); renderQuestBar(); sfx('tap'); toast(`${D.name}에 다니기 시작했어요. 수업료 +${Math.round(deptPct(D))}%` + (first ? '\n장식을 받았어요. 꾸미기 가게의 \'지도 꾸미기\'로 놓아요' : ''));
    return true;
  }
  function deptClick(e) {
    const b = e.target.closest('[data-dp]'); if (!b) return;
    const [v, k] = b.dataset.dp.split(':');
    if (v === 'cancel') rt.dpSwap = '';
    else if (v === 'pick') { if (deptPicks().length >= deptSlots()) rt.dpSwap = k; else deptSet(k, ''); }
    else if (v === 'swap') { if (deptSet(rt.dpSwap, k)) rt.dpSwap = ''; }
    else if (v === 'rx') rxUp(k);   // 4.2.0
    renderDept();
  }
  const xtLv = k => (S && S.xt && S.xt[k]) || 0;
  const xtHere = k => !!S && S.tier >= (XT[k].tier || 0) && S.f[XT[k].fac] >= 1;   // 2.3.0 tier: 그 학교급부터
  const rdPerDay = () => RD.perDay + Math.floor(xtLv('kor') / 5);   // 2.3.0 고니 선생님
  const mgEMax = () => MG.EMAX + 10 * Math.floor(xtLv('art') / 5) + deptX('art');   // 2.3.0 공작 선생님
  const snRareP = () => SN.rare + XT.snack.per / 100 * xtLv('snack');   // 2.3.0 알파카 선생님
  const xtMaxed = k => xtLv(k) >= XT[k].max;
  const xtCost = k => XT[k].ess ? 20 + 10 * (xtLv(k) + 1) : Math.ceil(softCost(TEA.bear.cost, xtLv(k) + 1, SOFT.tea) * costScale() * (1 - deptX('edu') / 100));   // 2.3.5 정수로 연수하는 선생님
  const xtHave = k => XT[k].ess ? S.ess : S.budget;
  const fixMult = () => 1 - XT.fix.per / 100 * xtLv('fix');   // 2.3.5 비버 선생님
  const feastMins = () => DEAL.feastMin + XT.diet.per * xtLv('diet');   // 까치 특식 데이 길이
  const libMult = () => 1 + XT.lib.per / 100 * xtLv('lib');   // 퍼즐 점수 정수 배수

  // 큰 숫자 줄여 쓰기: 기본은 토스처럼 만, 억, 조. 설정에서 K, M, B로 바꿀 수 있어요
  const multTx = m => m < 10 ? `수업료 +${Math.round((m - 1) * 100).toLocaleString('ko-KR')}%` : `수업료 ×${fmt(m)}`;   // 5.0.1.7 T-16
  const essShort = n => `숲의 정수가 ${fmt(Math.max(1, Math.ceil(n)))}개 모자라요. 공부 탭에서 모아요`;   // 5.0.1.8 W-09 모자랄 때 한 가지 꼴
  const acornShort = n => `도토리가 ${fmt(Math.max(1, Math.ceil(n)))}개 모자라요`;   // 5.0.1.8 W-03 흔들기만 하던 단추에 까닭을
  const fmtN = n => { const t = fmt(n); return /[0-9]$/.test(t) ? t + '개' : t; };   // 5.0.1.5 '1,200자개'처럼 단위 뒤 '개'를 빼요
  function fmt(n) {
    n = Math.floor(n + 1e-9);
    if (!isFinite(n)) return '0';   // 2.0.0 보안 점검(1-9): NaN, 무한대는 0으로 보여 줘요
    if (S && S.units === 'en') return fmtEn(n);
    if (n < 10000) return n.toLocaleString('ko-KR');
    const U = [['극', 1e48], ['재', 1e44], ['정', 1e40], ['간', 1e36], ['구', 1e32], ['양', 1e28], ['자', 1e24], ['해', 1e20], ['경', 1e16], ['조', 1e12], ['억', 1e8], ['만', 1e4]];
    for (const [u, v] of U) {
      if (n >= v) {
        const x = n / v * (1 + 1e-12);   // 5.0.4 큰 수에서 나눗셈 끝자리 때문에 15구가 14.9구로 보이던 것
        let s;
        if (x >= 100) s = Math.floor(x).toLocaleString('ko-KR');
        else if (x >= 10) s = (Math.floor(x * 10) / 10).toFixed(1).replace(/\.0$/, '');
        else s = (Math.floor(x * 100) / 100).toFixed(2).replace(/0$/, '').replace(/\.0?$/, '');
        return s + u;
      }
    }
    return String(n);
  }
  // 1.5.6: 위쪽 줄 도토리 칸은 두 단위까지 보여 줘요 (2억 5438만, 3조 3402억). 다른 곳은 fmt처럼 짧게
  function fmt2(n) {
    n = Math.floor(n + 1e-9);
    if (!isFinite(n) || n < 0) return fmt(n);
    if (S && S.units === 'en') return n < 1e6 ? n.toLocaleString('en-US') : fmtEn(n);
    if (n < 10000) return n.toLocaleString('ko-KR');
    const U = [['극', 1e48], ['재', 1e44], ['정', 1e40], ['간', 1e36], ['구', 1e32], ['양', 1e28], ['자', 1e24], ['해', 1e20], ['경', 1e16], ['조', 1e12], ['억', 1e8], ['만', 1e4]];
    const [u, v] = U.find(([, x]) => n >= x);
    const tot = Math.floor(n / (v / 1e4) * (1 + 1e-12)), hi = Math.floor(tot / 1e4), lo = Math.max(0, tot - hi * 1e4);   // 5.0.4 나눗셈 끝자리 보정(25구가 24구 9999양으로 보이던 것)
    const i = U.findIndex(([x]) => x === u), u2 = i + 1 < U.length ? U[i + 1][0] : '';
    const head = (hi >= 1e4 ? hi.toLocaleString('ko-KR') : String(hi)) + u;
    return lo > 0 ? `${head} ${Math.min(9999, lo)}${u2}` : head;
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
  const repTxt = (q, t) => String(t || '').replace(/\{REP\}/g, () => (q && (q.t === 'grade' || q.t === 'ygrade')) ? townRep(q.n) : '');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

