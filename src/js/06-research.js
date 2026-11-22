  /* ---------- 4.2.0 연구 투자 (프로젝트 문서 '4.2.0 설계안 2 (황금 도토리와 광고)' 7절) ----------
     학과 사무실에서 도토리를 넣어 연구를 올려요. 레벨 끝없음, 효과는 상한까지.
     woodani 결정(2026-11-13): 값은 그 레벨이 열린 때의 수업료로 정해 두고 올리기 전까지 그대로, 올리면 그때의 수업료로 다음 값을 새로 정해요. 건축은 레벨마다 -0.5%.
     숫자(레벨마다 효과, 상한, 2시간치, 1.25배)는 본부 제안이에요. var는 다른 곳(공사 시간, 정수, 공부)에서 먼저 불려도 멈추지 않게 */
  var RX = { baseH: 2, grow: 1.25, list: [
    { k: 'study', nm: '학력 연구', per: 2, cap: 100, unit: '공부 경험치', sign: '+', ic: '📚' },
    { k: 'build', nm: '건축 연구', per: 0.5, cap: 30, unit: '공사 시간', sign: '-', ic: '🏗️' },
    { k: 'ess', nm: '정수 연구', per: 1, cap: 30, unit: '받는 숲의 정수', sign: '+', ic: '✨' }] };
  function rxPct(k) { if (!RX || !S || !S.rx) return 0; const R = RX.list.find(x => x.k === k); return R ? Math.min(R.cap, (S.rx.lv[k] || 0) * R.per) : 0; }
  // 대학교에서는 빼고 대학원 연구소 창에서 연구 트리와 함께 열어요. 올린 레벨의 효과(rxPct)는 그대로 남아요
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
    if (rxOpen() && !inLab && gradOn()) return '<h3 class="fv-h">연구 투자</h3><p class="fine">연구 투자는 연구 구역 연구소에서 해요.</p>';
    if (!rxOpen()) {   // 대학교: 올린 연구가 있으면 효과만 보여 주고, 대학원으로 옮긴다고 알려요
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
  /* ---------- 연구소 창: 연구 투자와 연구 트리 (설계안 ' 설계안 (대학원, 연구 구역) 초안' 3절) ----------
     연구 트리: 가지 다섯 개 × 칸 네 개. 칸마다 숲의 정수와 그때 수업료 몇 시간치 도토리를 쓰고, 연구 시간이 지나야 올라요(한 번에 하나). 졸업해도 남아요. 숫자는 본부 제안 */
  const RT5 = {
    list: [
      { k: 'class', nm: '수업', ic: 'ic_rt_class', eff: L => `수업료 +${5 * L}%` },
      { k: 'event', nm: '행사', ic: 'ic_rt_event', eff: L => `학교 행사, 축제, 체험학습 도토리 +${10 * L}%` },
      { k: 'tam', nm: '탐험', ic: 'ic_rt_tam', eff: L => `탐험대 힘 +${5 * L}%` + (L >= 4 ? ', 보고서 +2시간' : '') },
      { k: 'time', nm: '시간', ic: 'ic_rt_time', eff: L => `자리 비운 동안 수입 +${L}시간` },
      { k: 'ta', nm: '조교', ic: 'ic_rt_ta', eff: L => ['', '조교 자리 +1', '조교 자리 +1, 파견 시간 -15%', '조교 자리 +2, 파견 시간 -15%', '조교 자리 +2, 파견 시간 -15%, 파견 보상 +25%', '조교 자리 +2, 파견 시간 -15%, 파견 보상 +50%'][L] }],   // 조교 가지 열림
    ess: [50, 100, 200, 400, 800], hrs: [1, 2, 4, 8, 16], time: [1, 3, 6, 12, 24], max: 4, top: 5 };   // 다섯째 칸(심화 칸)은 논문으로 열려요(rtMax)
  const rtLv = k => (S && S.rt5 && S.rt5.lv[k]) || 0;
  const rtClassMul = () => 1 + 0.05 * rtLv('class');
  const rtEvt = () => 1 + 0.1 * rtLv('event');
  const rtTamMul = () => 1 + 0.05 * rtLv('tam');
  const rtCost = k => { const L = Math.min(RT5.top - 1, rtLv(k)); return { ess: RT5.ess[L], ac: nice(rate() * 3600 * RT5.hrs[L]), sec: Math.round(RT5.time[L] * 3600 * (1 - XT.adv.per / 100 * xtLv('adv'))) }; };   // 펠리컨 지도교수님 연수만큼 짧아져요
  const rtOpen = () => gradOn() && (S.f.institute || 0) >= 1;
  const rtHrs = sec => { const m = Math.round(sec / 60), h = Math.floor(m / 60); return h && m % 60 ? `${h}시간 ${m % 60}분` : h ? `${h}시간` : `${m}분`; };   // 연구 시간 글자(지도교수님 연수로 분 단위가 생겨요)
  function rtStart(k) {
    const D = RT5.list.find(x => x.k === k); if (!D || D.lock || !rtOpen()) return false;
    if (S.rt5.cur) { toast('연구는 한 번에 하나씩 해요'); return false; }
    if (rtLv(k) >= rtMax(k)) { if (rtLv(k) < RT5.top) toast(`논문 ${PP.deep[k]}편을 쓰면 다섯째 칸이 열려요`); return false; }
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
    const D = RT5.list.find(x => x.k === c.k); S.rt5.lv[c.k] = Math.min(RT5.top, rtLv(c.k) + 1); S.rt5.cur = null; ppData(PP.dat.rt); save(); rt.rtPop = { k: c.k, i: rtLv(c.k) - 1 };   // 나무 칸이 막 자란 움직임
    toast(`${D ? D.nm : ''} 연구 ${rtLv(c.k)}칸 완성!\n${D ? D.eff(rtLv(c.k)) : ''}`); sfx('quest');
    if (!$('#mRx').hidden) renderRx();
  }
  /* 연구 트리를 목록 대신 한 그루 나무로. 밑동에서 가지 다섯 개가 위로 뻗고, 가지마다 칸이 아래에서 위로 이어져요
     칸 자리는 720x960 판 기준(그림 작업지시서 96의 rt_tree_bg와 같은 좌표). 칸을 누르면 아래 칸 창에 효과, 값, '연구하기'. 효과와 값은 그대로 */
  const RT_PT = [[160, 141, 125, 109, 96], [260, 250, 242, 235, 228], [360, 360, 360, 360, 360], [460, 470, 478, 485, 492], [560, 579, 595, 611, 624]];   // 가지마다 줄 1~5의 x(작업지시서 96-2, 위로 갈수록 퍼지는 부채꼴)
  const RT_X = (j, i) => RT_PT[j][i], RT_Y = i => 800 - 150 * i, RT_W = 720, RT_H = 960;
  const rtTop = () => RT5.top >= 5 ? 0 : RT_Y(RT5.top - 1) - 130;   // 칸 줄 수가 다섯보다 적으면 빈 위쪽을 잘라요
  function rtTreeSvg() {
    const bg = IMG('rt_tree_bg'), c = S.rt5.cur;
    let s = '';
    if (!bg) s += `<path d="M330 960 Q336 905 360 880 Q384 905 390 960 Z" fill="#9A6B43"/>`;
    RT5.list.forEach((D, j) => {
      const x = RT_X(j, 0), L = rtLv(D.k), run = c && c.k === D.k, seg = i => `M${RT_X(j, i - 1)} ${RT_Y(i - 1)} L${RT_X(j, i)} ${RT_Y(i)}`;
      const stem = `M360 885 C360 850 ${x} 860 ${x} ${RT_Y(0)}`;
      if (!bg) { s += `<path d="${stem}" stroke="#B98A5E" stroke-width="16" fill="none" stroke-linecap="round"/>`; for (let i = 1; i < RT5.top; i++) s += `<path d="${seg(i)}" stroke="#B98A5E" stroke-width="14" fill="none" stroke-linecap="round"/>`; }
      if (L > 0 || run) s += `<path d="${stem}" class="rt-done" fill="none"/>`;
      for (let i = 1; i < RT5.top; i++) if (L > i || (L === i && run)) s += `<path d="${seg(i)}" class="rt-done${L === i ? ' rt-run' : ''}" fill="none"/>`;
    });
    return `<svg class="rt-lines" viewBox="0 ${rtTop()} ${RT_W} ${RT_H - rtTop()}" preserveAspectRatio="none" aria-hidden="true">${s}</svg>`;
  }
  function rtPart() {
    const c = S.rt5.cur, now = gameNow(), bg = IMG('rt_tree_bg');
    if (!RT5.list.some(D => D.k === rt.rtSel)) rt.rtSel = c ? c.k : (RT5.list.find(D => !D.lock && rtLv(D.k) < rtMax(D.k)) || RT5.list[0]).k;
    let nodes = '';
    RT5.list.forEach((D, j) => {
      const L = rtLv(D.k), u = IMG(D.ic), run = c && c.k === D.k;
      for (let i = 0; i < RT5.top; i++) {
        const st = i < L ? 'done' : i === L && run ? 'run' : i === L && !D.lock && i < rtMax(D.k) ? 'next' : 'lock', sel = rt.rtSel === D.k && (i === Math.min(L, RT5.top - 1));
        const pop = st === 'done' && rt.rtPop && rt.rtPop.k === D.k && rt.rtPop.i === i;
        nodes += `<button class="rt-node ${st}${sel ? ' sel' : ''}${pop ? ' pop' : ''}" type="button" data-rts="${D.k}" style="left:${(RT_X(j, i) / RT_W * 100).toFixed(2)}%;top:${((RT_Y(i) - rtTop()) / (RT_H - rtTop()) * 100).toFixed(2)}%" aria-label="${D.nm} ${i + 1}칸${st === 'done' ? ' 완성' : st === 'run' ? ' 연구 중' : st === 'lock' ? ' 잠김' : ''}">` +
          (u ? `<img src="${u}" alt="">` : `<b>${i + 1}</b>`) + (st === 'lock' ? '<i class="rt-lk">🔒</i>' : st === 'done' ? '<i class="rt-leaf"></i>' : '') + '</button>';
      }
      nodes += `<span class="rt-nm" style="left:${(RT_X(j, 0) / RT_W * 100).toFixed(2)}%">${D.nm}</span>`;
    });
    rt.rtPop = null;
    const D = RT5.list.find(x => x.k === rt.rtSel), L = rtLv(D.k), run = c && c.k === D.k, full = L >= RT5.top, shut = !full && L >= rtMax(D.k), k = rtCost(D.k);
    const btn = D.lock ? '<span class="fe-lock">준비 중</span>' : full ? '<span class="fe-lock">완성</span>' : run ? `<span class="fe-lock">${hms(c.end - now)}</span>`
      : shut ? '<span class="fe-lock">잠김</span>' : c ? '<span class="fe-lock">다른 연구 중</span>'
      : `<button class="${S.ess < k.ess || S.budget < k.ac ? 'btn-sub' : 'cta'} small" type="button" data-rt="${D.k}">연구하기 (정수 ${k.ess})</button>`;
    const info = `<div class="rt-card"><span class="dp-ic">${IMG(D.ic) ? `<img src="${IMG(D.ic)}" alt="">` : ''}</span><div class="dp-tx"><b>${D.nm} ${Math.min(L + (full ? 0 : 1), RT5.top)}칸${full ? ' (완성)' : ''}</b>` +
      `<small>${L ? `지금 ${D.eff(L)}` : '아직 연구 전'}${D.lock || full ? '' : run ? `<br>다음 ${D.eff(L + 1)}<br>연구 중이에요. 끝나면 칸이 채워져요` : `<br>다음 ${D.eff(L + 1)}<br>도토리 ${fmt(k.ac)}, ${rtHrs(k.sec)}`}` +   // 5.3.2.1: 연구 중에는 걸리는 시간 대신 남은 시간(오른쪽) 하나만
      // 5.3.2.1: 잠긴 까닭을 한 줄로(예전에는 단추 자리에 '논문 3편', '다른 연구 중'만)
      `${D.lock || full || run ? '' : shut ? `<br>논문 ${PP.deep[D.k]}편을 쓰면 열려요 (지금 ${fmt((S.pp && S.pp.n) || 0)}편)` : c ? `<br>${(RT5.list.find(x => x.k === c.k) || {}).nm || '다른'} 연구가 끝나면 할 수 있어요` : ''}</small></div>${btn}</div>`;
    return `<p class="fine">한 번에 하나씩 연구해요. 졸업해도 남아요.</p><div class="rt-tree${bg ? ' art' : ''}" style="aspect-ratio:${RT_W}/${RT_H - rtTop()}${bg ? `;background-image:url('${blobUrl(bg)}')` : ''}">${rtTreeSvg()}${nodes}</div>${info}`;
  }
  function renderRx() {
    const tab = ['tree', 'ta', 'paper'].includes(rt.rxTab) ? rt.rxTab : 'inv';
    $$('#rxSeg [data-rseg]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.rseg === tab)));
    setH($('#rxBody'), tab === 'tree' ? rtPart() : tab === 'ta' ? taPart() : tab === 'paper' ? ppPart() : rxPart(true));
    { const hd = $('#rxTitle').parentElement, u = tab === 'ta' && taOpen() ? IMG('ta_bg') : tab === 'paper' && ppOpen() ? IMG('conf_bg') : ''; hd.classList.toggle('art', !!u); hd.style.backgroundImage = u ? `url("${blobUrl(u)}")` : ''; }   // 조교 탭 머리 그림, 논문 탭은 학회장 그림
  }
  /* ---------- 조교 파견 (프로젝트 문서 ' 설계안 (조교 파견) 초안', : 숫자는 제안대로) ----------
     조교 자리: 대학원생 조교를 캠퍼스 건물에 한 명씩 앉혀요. 앉아 있는 조교 한 명마다 수업료 +10%, 그 건물 가구 값 -10%
     모교 파견: 조교를 졸업한 학교(유치원~대학교)에 2, 4, 8시간 보내 숲의 정수와 추억 조각, 모교마다 다른 덤을 받아요. 파견 중에는 자리 효과가 꺼져요
     모교 기념비: 추억 조각 30, 80, 160개로 3단계. 단계마다 수업료 +3%, 3단계에 칭호 '모교의 자랑'. 졸업해도 남아요 */
  const TA = { seat0: 2, pct: 10, fur: 10, hrs: [2, 4, 8], ess: [5, 10, 20], mem: [1, 2, 4], mon: [30, 80, 160], monPct: 3,
    who: ['lemur', 'armadillo', 'quokka'], whoNm: { lemur: '여우원숭이', armadillo: '아르마딜로', quokka: '쿼카' },
    school: ['유치원', '초등학교', '중학교', '고등학교', '대학교'],
    bonus: ['숲의 정수 +50%', '국어와 수학 경험치', '과학 경험치', '탐험 재료', '도토리(수업료 몇 분치)'] };
  const taOpen = () => rtOpen() && !!S.ta && (S.tg * 2 + (S.sem || 0)) >= 1;   // 석사 2학기부터
  const taSeats = () => TA.seat0 + (rtLv('ta') >= 1 ? 1 : 0) + (rtLv('ta') >= 3 ? 1 : 0);
  const taOut = i => !!S.ta && S.ta.out.some(o => o.i === i);
  const taOnB = k => !!S && !!S.ta && gradOn() && S.ta.seat.some((x, i) => x && x.b === k && i < taSeats() && !taOut(i));   // 앉아서 일하는 조교가 있는 건물
  const taWork = () => !S || !S.ta || !gradOn() ? 0 : S.ta.seat.filter((x, i) => x && x.b && FAC[x.b] && i < taSeats() && !taOut(i)).length;
  const taMult = () => 1 + TA.pct / 100 * taWork() + (S && S.ta && gradOn() ? TA.monPct / 100 * S.ta.mon : 0);   // 수업료에 곱해요(기념비 포함)
  const taFurMul = k => taOnB(k) ? 1 - TA.fur / 100 : 1;
  const taWho = i => TA.who[i % TA.who.length];
  const taSec = h => Math.round(TA.hrs[h] * 3600 * (rtLv('ta') >= 2 ? 0.85 : 1));
  const taDue = () => !S || !S.ta ? [] : S.ta.out.filter(o => gameNow() >= o.end);
  const taB = () => facKeys().filter(k => S.f[k] >= 1);   // 앉힐 수 있는 건물: 지은 캠퍼스 건물
  function taSit(i, k) {
    if (!taOpen() || i < 0 || i >= taSeats() || taOut(i)) return false;
    if (k && (!FAC[k] || !(S.f[k] >= 1))) return false;
    for (let j = 0; j < S.ta.seat.length; j++) if (j !== i && S.ta.seat[j] && S.ta.seat[j].b === k && k) S.ta.seat[j] = { b: '' };   // 한 건물에 한 명: 앉아 있던 조교는 비켜요
    while (S.ta.seat.length <= i) S.ta.seat.push({ b: '' });
    S.ta.seat[i] = { b: k || '' }; rt.taPick = -1;
    save(); renderHUD(); renderDeco(); checkQuests(true); sfx('tap');
    if (k) toast(`${TA.whoNm[taWho(i)]} 조교가\n${FAC[k].name}에서 일해요`);
    return true;
  }
  function taSend(i, to, h) {
    if (!taOpen() || i < 0 || i >= taSeats() || taOut(i) || !(to >= 0 && to <= 4) || !(h >= 0 && h <= 2)) return false;
    S.ta.out.push({ i, to, h, end: gameNow() + taSec(h) * 1000 }); S.ta.n = Math.min(1e9, S.ta.n + 1);   // 파견 횟수는 보낼 때 세요
    save(); renderHUD(); renderDeco(); checkQuests(true); sfx('coin'); rt.taGo = -1;
    toast(`${TA.whoNm[taWho(i)]} 조교가\n숲속 ${TA.school[to]}에 다녀와요\n${rtHrs(taSec(h))} 뒤에 돌아와요`);
    return true;
  }
  function taClaim() {
    const due = taDue(); if (!due.length) return false;
    const mul = rtLv('ta') >= 5 ? 1.5 : rtLv('ta') >= 4 ? 1.25 : 1; let ess = 0, mem = 0, ac = 0; const got = [];   // 조교 심화 칸 +25% 더
    for (const o of due) {
      const f = TA.hrs[o.h] / 2;   // 덤은 2시간을 1배로 시간만큼
      ess += Math.round(TA.ess[o.h] * mul * (o.to === 0 ? 1.5 : 1)); mem += Math.round(TA.mem[o.h] * mul);
      if (o.to === 1) { acGain('kor', Math.round(10 * f * mul)); acGain('math', Math.round(10 * f * mul)); got.push('국어와 수학 경험치'); }
      if (o.to === 2) { acGain('sci', Math.round(20 * f * mul)); got.push('과학 경험치'); }
      if (o.to === 3 && S.tam && S.tam.mat) { for (let m = 0; m < 3; m++) S.tam.mat[m] = Math.min(1e12, S.tam.mat[m] + Math.round(10 * f * mul)); got.push('탐험 재료'); }
      if (o.to === 4) ac += nice(rate() * 600 * f * mul);
    }
    S.ta.out = S.ta.out.filter(o => !due.includes(o));
    S.ta.mem = Math.min(1e9, S.ta.mem + mem);
    ppData(due.reduce((t, o) => t + (PP.dat.ta[o.h] || 0), 0));   // 4시간 1, 8시간 2
    addEss(ess); if (ac > 0) { S.budget += ac; earn(ac); got.push(`도토리 ${fmt(ac)}`); }
    save(); renderHUD(); renderDeco(); checkQuests(true); sfx('quest'); buzz(15);
    toast(`조교 ${due.length}명이 돌아왔어요\n숲의 정수 ${ess}, 추억 조각 ${mem}` + (got.length ? `\n${[...new Set(got)].join(', ')}` : ''));
    if (!$('#mRx').hidden) renderRx();
    return true;
  }
  function taMonUp() {
    if (!taOpen() || S.ta.mon >= TA.mon.length) return false;
    const c = TA.mon[S.ta.mon];
    if (S.ta.mem < c) { toast(`추억 조각이 ${c - S.ta.mem}개 모자라요`); return false; }
    S.ta.mem -= c; S.ta.mon += 1;
    save(); renderHUD(); renderDeco(); checkQuests(true); sfx('quest'); buzz(20);
    toast(`모교 기념비 ${S.ta.mon}단계!\n수업료 +${TA.monPct * S.ta.mon}%` + (S.ta.mon >= TA.mon.length ? `\n칭호 '모교의 자랑'을 받았어요` : ''));
    return true;
  }
  /* ---------- 논문과 숲속 학회 (프로젝트 문서 ' 설계안 (논문과 숲속 학회) 초안', : 숫자는 제안대로, 대학원부터) ----------
     연구 자료: 하루 첫 자료 정리 1, 세미나 3, 조교 파견 4시간 1과 8시간 2, 연구 트리 칸 2, 심화 탐험 큰 장난꾸러기 처음 넘기 1
     논문: 주제(연구 트리 가지)를 골라 자료 3개로 4시간. 점수 = 10 + 그 가지 칸 수 × 5, 한 학회에서 같은 주제 3편째부터 절반. 다 쓰면 정수 10
     숲속 학회: 4주(주간 리그 4주)마다. 그 학회에 쓴 논문 점수를 더하고, 끝나면 100점 동, 300점 은, 600점 금메달. 서버 랭킹 cf(점수), cq(학회 × 1,000,000 + 점수)
     심화 칸: 논문 3, 6, 10, 15, 20편마다 수업, 행사, 탐험, 시간, 조교 가지에 다섯째 칸 */
  const PP = { need: 3, sec: 4 * 3600, ess: 10, base: 10, per: 5, halfAt: 2, weeks: 4,
    dat: { day: 1, sem: 3, ta: [0, 1, 2], rt: 2, boss: 1 },
    med: [{ at: 100, nm: '동메달', ic: '🥉', ess: 20, gold: 0 }, { at: 300, nm: '은메달', ic: '🥈', ess: 40, gold: 0 }, { at: 600, nm: '금메달', ic: '🥇', ess: 60, gold: 1 }],
    deep: { class: 3, event: 6, tam: 10, time: 15, ta: 20 } };
  const PP_TITLES = [
    { id: 'semfive', title: '발표왕', got: s => !!s.pp && s.pp.sem >= 5 },
    { id: 'semten', title: '숲속 석학', got: s => !!s.pp && s.pp.sem >= 10 },
    { id: 'semtwenty', title: '명예 교수', got: s => !!s.pp && s.pp.sem >= 20 },
    { id: 'paperone', title: '첫 논문', got: s => !!s.pp && s.pp.n >= 1 },
    { id: 'paperthirty', title: '논문 부자', got: s => !!s.pp && s.pp.n >= 30 },
    { id: 'confgold', title: '학회 금메달', got: s => !!s.pp && (s.pp.med || []).some(m => m[1] >= 3) }];
  const ppOpen = () => !!S && !!S.pp && rtOpen();   // 대학원 연구소를 지으면(석사 1학기부터)
  const ppPer = () => Math.floor(gameWeek() / PP.weeks);
  const ppLeft = () => { const end = Date.UTC(2026, 0, 5) + (ppPer() + 1) * PP.weeks * 604800000 - KST_MS; return Math.max(0, Math.ceil((end - gameNow()) / 86400000)); };
  const rtMax = k => (S && S.pp && S.pp.n >= (PP.deep[k] || Infinity)) ? RT5.top : RT5.max;   // 심화 칸이 열린 가지는 다섯 칸
  const ppMedOf = v => PP.med.reduce((a, m, i) => v >= m.at ? i + 1 : a, 0);
  // 학회 메달 그림(작업지시서 100, conf_med_1~3). 그림이 없으면 이모지
  const ppMedIc = (m, px) => { const u = IMG('conf_med_' + m); return u ? `<img class="pp-med" src="${u}" alt="" style="width:${px || 24}px;height:${px || 24}px;object-fit:contain;vertical-align:middle">` : PP.med[m - 1].ic; };
  // 칭호 덤 장식(설계안 5절, 작업지시서 100): 세미나 10번, 20번, 논문 30편, 마을 기부 20단계. 얻으면 꾸미기 장식으로 지도에 놓아요(힘 없음)
  const PP_DECO = [['deco_pp_board', () => !!S.pp && S.pp.sem >= 10], ['deco_pp_chair', () => !!S.pp && S.pp.sem >= 20], ['deco_pp_tower', () => !!S.pp && S.pp.n >= 30], ['deco_vd20', () => !!S.vd && S.vd.lv >= 20]];
  function ppDecoSync() {
    const got = []; if (!S || !S.deco || !S.deco.own) return got;
    for (const [id, ok] of PP_DECO) if (DECO_BY[id] && !S.deco.own[id] && ok()) { S.deco.own[id] = 1; got.push(DECO_BY[id].name); }
    return got;
  }
  const ppScore = k => { const v = PP.base + PP.per * rtLv(k); return ((S.pp.ck[k] || 0) >= PP.halfAt) ? Math.floor(v / 2) : v; };
  function ppData(n, why) {   // 연구 자료 얻기(대학원에서만)
    if (!ppOpen() || !(n > 0)) return 0;
    S.pp.dat = Math.min(9999, S.pp.dat + n);
    if (why) rt.ppWhy = why;
    if (!$('#mRx').hidden && rt.rxTab === 'paper') renderRx();
    return n;
  }
  // 학회가 바뀌면 지난 학회 메달을 주고 점수를 0부터. 켤 때와 1초마다 봐요
  function ppSync() {
    if (!S || !S.pp) return;
    if (ppDecoSync().length) save();   // 이미 조건을 넘은 저장도 받아요
    const p = ppPer(); if (S.pp.cm === p) return;
    const old = S.pp.cm, v = S.pp.cf, m = old >= 0 && v > 0 ? ppMedOf(v) : 0;
    S.pp.cm = p; S.pp.cf = 0; S.pp.ck = {};
    if (m) {
      const M = PP.med[m - 1]; S.pp.med.push([old, m]); if (S.pp.med.length > 60) S.pp.med = S.pp.med.slice(-60);
      addEss(M.ess); if (M.gold) addGold(M.gold);
      const mu = IMG('conf_med_' + m);
      showReward({ title: `숲속 학회 ${M.nm}`, sub: `지난 학회 점수 ${fmt(v)}점`, art: mu ? `<img src="${mu}" alt="" style="width:96px;height:96px;object-fit:contain">` : undefined, items: [{ ic: ppMedIc(m), t: M.nm }, { ic: 'ess', t: `숲의 정수 +${M.ess}` }, M.gold ? { ic: 'gold', t: `황금 도토리 +${M.gold}` } : null] });
    }
    save();
  }
  function ppDay() {   // 하루 첫 자료 정리
    if (!ppOpen()) return false;
    const d = gameToday(); if (S.pp.day === d) { toast('오늘 자료 정리는 끝났어요\n내일 다시 해요'); return false; }
    S.pp.day = d; ppData(PP.dat.day); save(); sfx('coin'); toast(`연구 자료 +${PP.dat.day}`); return true;
  }
  function ppWrite(k) {
    const D = RT5.list.find(x => x.k === k); if (!D || !ppOpen()) return false;
    if (S.pp.cur) { toast('논문은 한 번에 한 편씩 써요'); return false; }
    if (S.pp.dat < PP.need) { toast(`연구 자료가 ${PP.need - S.pp.dat}개 모자라요`); return false; }
    S.pp.dat -= PP.need; S.pp.cur = { k, end: gameNow() + PP.sec * 1000 };
    save(); sfx('tap'); toast(`${D.nm} 논문을 쓰기 시작했어요\n${rtHrs(PP.sec)} 뒤에 끝나요`); checkQuests(true);
    return true;
  }
  function ppTick() {
    if (!S || !S.pp) return;
    ppSync();
    const c = S.pp.cur; if (!c || gameNow() < c.end) return;
    const D = RT5.list.find(x => x.k === c.k), before = new Set(PP_TITLES.filter(t => t.got(S)).map(t => t.id)), deep0 = RT5.list.filter(x => rtMax(x.k) > RT5.max).length;
    const sc = ppScore(c.k);
    S.pp.cur = null; S.pp.n += 1; S.pp.by[c.k] = (S.pp.by[c.k] || 0) + 1; S.pp.ck[c.k] = (S.pp.ck[c.k] || 0) + 1;
    S.pp.cf = Math.min(99999, S.pp.cf + sc); S.pp.cb = Math.max(S.pp.cb, S.pp.cf);
    addEss(PP.ess); rankDirty();
    const newD = ppDecoSync(); save();
    const newT = PP_TITLES.filter(t => t.got(S) && !before.has(t.id)), deep = RT5.list.filter(x => rtMax(x.k) > RT5.max);
    showReward({ title: `논문 ${S.pp.n}편째 완성!`, sub: `${D ? D.nm : ''} 논문, 학회 점수 +${sc}`, items: [{ ic: 'ess', t: `숲의 정수 +${PP.ess}` }, { ic: '📜', t: `이번 학회 ${fmt(S.pp.cf)}점` },
      deep.length > deep0 ? { ic: '🌿', t: `${deep[deep.length - 1].nm} 가지에 다섯째 칸이 열렸어요` } : null, ...newT.map(t => ({ ic: '🎖️', t: `칭호 "${t.title}"` })), ...newD.map(n => ({ ic: '🎁', t: `장식 '${n}' (꾸미기 모드에서 지도에 놓아요)` }))] });
    sfx('quest'); checkQuests(true);
    if (!$('#mRx').hidden) renderRx();
  }
  function ppSemDone() { if (S && S.pp && gradOn()) { S.pp.sem += 1; ppData(PP.dat.sem); for (const n of ppDecoSync()) toast(`'${n}' 장식을 받았어요\n꾸미기 모드에서 지도에 놓아요`); } }   // 세미나와 학위수여식
  function ppPart() {
    if (!ppOpen()) return `<p class="fine">${gradOn() ? '연구 구역 연구소를 지으면 열려요' : '대학교를 졸업하고 대학원에 가면 열려요'}</p>`;
    ppSync();
    const P = S.pp, c = P.cur, now = gameNow(), m = ppMedOf(P.cf), nx = PP.med[m], u = IMG('ic_rdata'), up = IMG('ic_paper'), dayDone = P.day === gameToday();
    const nextDeep = RT5.list.filter(D => P.n < PP.deep[D.k]).sort((a, b) => PP.deep[a.k] - PP.deep[b.k])[0];
    let h = `<div class="pp-conf"><b>이번 숲속 학회 ${fmt(P.cf)}점</b><small>${ppLeft()}일 남음. ${m ? `지금 ${ppMedIc(m, 18)} ${PP.med[m - 1].nm}` : '아직 메달 없음'}${nx ? `, ${nx.at}점이면 ${ppMedIc(m + 1, 18)} ${nx.nm}` : ''}</small></div>`;
    h += `<div class="dp-row"><span class="dp-ic">${u ? `<img src="${u}" alt="">` : '🔎'}</span><div class="dp-tx"><b>연구 자료 ${fmt(P.dat)}개</b><small>자료 ${PP.need}개로 논문 한 편을 ${rtHrs(PP.sec)} 동안 써요<br>얻는 곳: 세미나 +${PP.dat.sem}, 연구 트리 칸 +${PP.dat.rt}, 조교 파견 4시간 +${PP.dat.ta[1]}, 8시간 +${PP.dat.ta[2]}, 심화 탐험 큰 장난꾸러기를 처음 이기면 +${PP.dat.boss}</small></div>` +
      (dayDone ? '<span class="fe-lock">오늘 정리함</span>' : `<button class="cta small" type="button" data-pp="day">자료 정리 +${PP.dat.day}</button>`) + '</div>';
    if (c) { const D = RT5.list.find(x => x.k === c.k); h += `<div class="dp-row on"><span class="dp-ic">${up ? `<img src="${up}" alt="">` : '📜'}</span><div class="dp-tx"><b>${D ? D.nm : ''} 논문 쓰는 중</b><small>끝나면 학회 점수 +${ppScore(c.k)}</small></div><span class="fe-lock">${hms(c.end - now)}</span></div>`; }
    h += '<div class="dp-list">' + RT5.list.map(D => {
      const sc = ppScore(D.k), half = (P.ck[D.k] || 0) >= PP.halfAt, U = IMG(D.ic), can = !c && P.dat >= PP.need;
      return `<div class="dp-row"><span class="dp-ic">${U ? `<img src="${U}" alt="">` : ''}</span><div class="dp-tx"><b>${D.nm} 논문</b><small>학회 점수 ${sc}${half ? ' (이번 학회 같은 주제 3편째부터 절반)' : ` (연구 트리 ${rtLv(D.k)}칸)`}</small></div>` +
        `<button class="${can ? 'cta' : 'btn-sub'} small" type="button" data-pp="w:${D.k}">쓰기</button></div>`;
    }).join('') + '</div>';
    h += `<p class="fine">쓴 논문 ${P.n}편${nextDeep ? `. ${PP.deep[nextDeep.k]}편이면 연구 트리 ${nextDeep.nm} 가지에 다섯째 칸이 열려요` : '. 연구 트리 심화 칸이 모두 열렸어요'}. 4주마다 학회가 새로 열려요.</p>`;
    return h;
  }
  function taPart() {
    if (!taOpen()) return '<p class="fine">조교는 석사 2학기에 열려요.</p>';
    const now = gameNow(), n = taSeats(), memIc = IMG('ic_ta_mem') ? `<img class="ta-mem" src="${IMG('ic_ta_mem')}" alt="">` : '💠';
    const mul = rtLv('ta') >= 4 ? 1.25 : 1, hr = Math.max(0, Math.min(2, rt.taHr | 0));
    let h = `<p class="fine ta-info">일하는 조교 한 명마다<br><b>수업료 +${TA.pct}%</b>, 그 건물 <b>가구 값 -${TA.fur}%</b><br>파견 가면 숲의 정수와 추억 조각을 가져와요<br>파견 중에는 자리 효과가 꺼져요</p><div class="dp-list">`;
    for (let i = 0; i < n; i++) {
      const x = S.ta.seat[i] || { b: '' }, o = S.ta.out.find(y => y.i === i), w = taWho(i), u = IMG('chr_ta_' + w) || IMG('chr_' + w);
      const st = o ? (now >= o.end ? `숲속 ${TA.school[o.to]}에서 돌아왔어요` : `숲속 ${TA.school[o.to]}에 가 있어요<br>${hms(o.end - now)} 뒤에 돌아와요`) : x.b && FAC[x.b] ? `${FAC[x.b].name}에서 일해요` : '빈자리예요';
      const btn = o ? (now >= o.end ? `<button class="cta small" type="button" data-ta="claim">받기</button>` : '<span class="fe-lock">파견 중</span>')
        : `<button class="btn-sub small" type="button" data-ta="pick:${i}">자리 정하기</button><button class="cta small" type="button" data-ta="go:${i}">파견</button>`;
      h += `<div class="dp-row"><span class="dp-ic">${u ? `<img src="${u}" alt="">` : ''}</span><div class="dp-tx"><b>${TA.whoNm[w]} 조교</b><small>${st}</small></div><span class="ta-btns">${btn}</span></div>`;
      if (rt.taPick === i && !o) h += '<div class="ta-pick">' + taB().map(k => `<button class="${x.b === k ? 'cta' : 'btn-sub'} small" type="button" data-ta="sit:${i}:${k}">${FAC[k].name}</button>`).join('') + (x.b ? `<button class="btn-sub small" type="button" data-ta="sit:${i}:">비우기</button>` : '') + '</div>';
      if (rt.taGo === i && !o) h += '<div class="ta-go"><p class="ta-go-h">1. 얼마나 다녀올까요?</p><div class="ta-hrs">'
        + TA.hrs.map((_, k) => `<button class="ta-hr${k === hr ? ' on' : ''}" type="button" data-ta="hr:${i}:${k}" aria-pressed="${k === hr}"><b>${rtHrs(taSec(k))}</b><small>정수 ${Math.round(TA.ess[k] * mul)}<br>추억 조각 ${Math.round(TA.mem[k] * mul)}</small></button>`).join('')
        + '</div><p class="ta-go-h">2. 어느 모교에 보낼까요?</p>'
        + TA.school.map((nm, t) => `<div class="ta-sch"><span><b>숲속 ${nm}</b><small>덤: ${TA.bonus[t]}</small></span><button class="cta small" type="button" data-ta="send:${i}:${t}:${hr}">보내기</button></div>`).join('') + '</div>';
    }
    h += '</div>';
    const mn = S.ta.mon, full = mn >= TA.mon.length, mc = full ? 0 : TA.mon[mn];
    const monTx = full ? `완성! 수업료 +${TA.monPct * mn}%, 칭호 '모교의 자랑'` : (mn ? `지금 수업료 +${TA.monPct * mn}%<br>` : '') + `조각 ${mc}개로 ${mn ? '올리면' : '세우면'} 수업료 +${TA.monPct * (mn + 1)}%${mn + 1 === TA.mon.length ? '와 칭호' : ''}`;
    h += `<h3 class="fv-h">모교 기념비 <small>${mn} / ${TA.mon.length}단계</small></h3><div class="dp-list"><div class="dp-row"><span class="dp-ic">${IMG('deco_alma_' + Math.max(1, mn)) ? `<img src="${IMG('deco_alma_' + Math.max(1, mn))}" alt=""${mn ? '' : ' class="ta-dim"'}>` : ''}</span><div class="dp-tx"><b>추억 조각 ${memIc}${fmt(S.ta.mem)}${full ? '' : ` / ${mc}`}</b><small>${monTx}</small></div>` +
      (full ? '<span class="fe-lock">완성</span>' : `<button class="${S.ta.mem < mc ? 'btn-sub' : 'cta'} small" type="button" data-ta="mon">${mn ? '올리기' : '세우기'}</button>`) + '</div></div>';
    return h;
  }
  // 지도: 일하는 조교는 그 건물 앞 오른쪽에 작게, 기념비는 연구 구역 왼쪽 풀밭에(renderDeco가 불러요, 학생 위 층 #vdTop)
  const TA_MON_AT = [222, 300];   // 길과 참나무 사이 풀밭(왼쪽 풀밭은 옆 단추에 가려요)
  const taMapKey = () => !S || !S.ta || !taOpen() ? '' : [S.ta.mon, taSeats(), S.ta.seat.map(x => x ? x.b : '').join(), S.ta.out.map(o => o.i).join()].join('/');
  function taMapHTML() {
    if (!S || !S.ta || !taOpen()) return '';
    const G = geo(); let h = '';
    if (G.zone === 'lab' && S.ta.mon >= 1) {
      const u = IMG('deco_alma_' + Math.min(3, S.ta.mon)), w = 46 + 6 * (S.ta.mon - 1), [x, y] = TA_MON_AT;
      if (u) h += `<ellipse class="vd-sh" cx="${x}" cy="${y - 1}" rx="${(w * 0.4).toFixed(1)}" ry="${(w * 0.1).toFixed(1)}"/><image class="ta-mon" x="${x - w / 2}" y="${(y - w * 0.86).toFixed(1)}" width="${w}" height="${w}" href="${u}"/>`;
    }
    S.ta.seat.forEach((s, i) => {
      if (i >= taSeats() || !s || !s.b || taOut(i) || !G.lot || !G.lot[s.b] || !G.b || !G.b[s.b]) return;
      const u = IMG('chr_ta_' + taWho(i)); if (!u) return;
      const L = G.lot[s.b], bw = G.b[s.b][2], fx = L[0] / 100 * MAP_W + bw * 0.34, fy = L[1] / 100 * MAP_H + MAP_Y + bw * 0.16, fw = 17, fh = fw * 220 / 150;
      h += `<ellipse class="vd-sh" cx="${fx.toFixed(1)}" cy="${fy.toFixed(1)}" rx="6" ry="1.8"/><image class="ta-fig" x="${(fx - fw / 2).toFixed(1)}" y="${(fy - fh).toFixed(1)}" width="${fw}" height="${fh.toFixed(1)}" href="${u}"/>`;
    });
    return h;
  }
  function taRender(base) {   // 홈 칩: 돌아온 조교가 있으면
    const c = $('#taChip'); if (!c) return;
    const n = base && taOpen() ? taDue().length : 0, key = n ? String(n) : '';
    if (c.dataset.key === key) return; c.dataset.key = key;
    c.hidden = !n; if (n) { c.innerHTML = `<b>🎒 조교가 돌아왔어요</b>`; c.setAttribute('aria-label', `모교에서 돌아온 조교 ${n}명의 보상 받기`); }
    chipRow();
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
  // 단과대학마다 따로 받는 보너스(제안표 그대로): [기본, 학력이 상한일 때]. 다니는 곳만 받아요. 학장 교수님은 곱하지 않아요
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
    setT($('#dpSlots'), `전공 ${picks.length} / ${slots}`);   // 여러 곳을 다니는 대신 주전공과 복수전공으로
    const note = sw ? `${sw.name}${batchim(sw.name) ? '과' : '와'} 바꿀 곳을 골라요` : full ? (S.dp.free ? '이번 한 번은 공짜로 바꿀 수 있어요' : `바꾸려면 숲의 정수 ${DEPT.ess}개가 들어요`) : picks.length ? '복수전공을 하나 더 고를 수 있어요' : '주전공 단과대학을 골라요';
    $('#dpBody').innerHTML = `<p class="dp-note">${note}</p><div class="dp-list">` + DEPT.list.map(D => {
      const on = picks.includes(D.k), lock = deptLocked(D), lv = deptLv(D);
      const subTx = D.avg ? '다섯 과목 평균' : D.low ? '과학과 체육 중 낮은 쪽' : AC.name[D.sub[0]];
      const btn = lock ? `<span class="fe-lock">${D.year}학년부터</span>`
        : sw ? (on ? `<button class="cta small" type="button" data-dp="swap:${D.k}">여기와 바꾸기</button>` : D.k === sw.k ? `<button class="btn-sub small" type="button" data-dp="cancel">그만두기</button>` : '')
        : on ? `<span class="fe-lock">${picks[0] === D.k ? '주전공' : '복수전공'}</span>`
        : `<button class="${full ? 'btn-sub' : 'cta'} small" type="button" data-dp="pick:${D.k}">${full ? '바꾸기' : '고르기'}</button>`;
      return `<div class="dp-row${on ? ' on' : ''}${lock ? ' lock' : ''}"><span class="dp-ic">${deptIc(D)}</span><div class="dp-tx"><b>${D.name}</b><small>${subTx} Lv.${Math.floor(lv)}, ${FAC[D.fac].name}</small><em>수업료 +${Math.round(deptPct(D))}%</em><em class="dp-x">${DEPT_X[D.k].t(deptXOf(D))}</em></div>${btn}</div>`;
    }).join('') + '</div>' + rxPart();   // 연구 투자
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
    else if (v === 'rx') rxUp(k);
    renderDept();
  }
  const xtLv = k => (S && S.xt && S.xt[k]) || 0;
  const xtHere = k => !!S && S.tier >= (XT[k].tier || 0) && S.f[XT[k].fac] >= 1;   // tier: 그 학교급부터
  const rdPerDay = () => RD.perDay + Math.floor(xtLv('kor') / 5);   // 고니 선생님
  const mgEMax = () => MG.EMAX + 10 * Math.floor(xtLv('art') / 5) + deptX('art');   // 공작 선생님
  const snRareP = () => SN.rare + XT.snack.per / 100 * xtLv('snack');   // 알파카 선생님
  const xtMaxed = k => xtLv(k) >= XT[k].max;
  const xtCost = k => XT[k].ess ? 20 + 10 * (xtLv(k) + 1) : Math.ceil(softCost(TEA.bear.cost, xtLv(k) + 1, SOFT.tea) * costScale() * (1 - deptX('edu') / 100));   // 정수로 연수하는 선생님
  const xtHave = k => XT[k].ess ? S.ess : S.budget;
  const fixMult = () => 1 - XT.fix.per / 100 * xtLv('fix');   // 비버 선생님
  const feastMins = () => DEAL.feastMin + XT.diet.per * xtLv('diet');   // 까치 특식 데이 길이
  const libMult = () => 1 + XT.lib.per / 100 * xtLv('lib');   // 퍼즐 점수 정수 배수

  // 큰 숫자 줄여 쓰기: 기본은 토스처럼 만, 억, 조. 설정에서 K, M, B로 바꿀 수 있어요
  const multTx = m => m < 10 ? `수업료 +${Math.round((m - 1) * 100).toLocaleString('ko-KR')}%` : `수업료 ×${fmt(m)}`;
  const essShort = n => `숲의 정수가 ${fmt(Math.max(1, Math.ceil(n)))}개 모자라요. 공부 탭에서 모아요`;   // 모자랄 때 한 가지 꼴
  const acornShort = n => `도토리가 ${fmt(Math.max(1, Math.ceil(n)))}개 모자라요`;   // 흔들기만 하던 단추에 까닭을
  const fmtN = n => { const t = fmt(n); return /[0-9]$/.test(t) ? t + '개' : t; };   // '1,200자개'처럼 단위 뒤 '개'를 빼요
  function fmt(n) {
    n = Math.floor(n + 1e-9);
    if (!isFinite(n)) return '0';   // 보안 점검(1-9): NaN, 무한대는 0으로 보여 줘요
    if (S && S.units === 'en') return fmtEn(n);
    if (n < 10000) return n.toLocaleString('ko-KR');
    const U = [['극', 1e48], ['재', 1e44], ['정', 1e40], ['간', 1e36], ['구', 1e32], ['양', 1e28], ['자', 1e24], ['해', 1e20], ['경', 1e16], ['조', 1e12], ['억', 1e8], ['만', 1e4]];
    for (const [u, v] of U) {
      if (n >= v) {
        const x = n / v * (1 + 1e-12);   // 큰 수에서 나눗셈 끝자리 때문에 15구가 14.9구로 보이던 것
        let s;
        if (x >= 100) s = Math.floor(x).toLocaleString('ko-KR');
        else if (x >= 10) s = (Math.floor(x * 10) / 10).toFixed(1).replace(/\.0$/, '');
        else s = (Math.floor(x * 100) / 100).toFixed(2).replace(/0$/, '').replace(/\.0?$/, '');
        return s + u;
      }
    }
    return String(n);
  }
  // 위쪽 줄 도토리 칸은 두 단위까지 보여 줘요 (2억 5438만, 3조 3402억). 다른 곳은 fmt처럼 짧게
  function fmt2(n) {
    n = Math.floor(n + 1e-9);
    if (!isFinite(n) || n < 0) return fmt(n);
    if (S && S.units === 'en') return n < 1e6 ? n.toLocaleString('en-US') : fmtEn(n);
    if (n < 10000) return n.toLocaleString('ko-KR');
    const U = [['극', 1e48], ['재', 1e44], ['정', 1e40], ['간', 1e36], ['구', 1e32], ['양', 1e28], ['자', 1e24], ['해', 1e20], ['경', 1e16], ['조', 1e12], ['억', 1e8], ['만', 1e4]];
    const [u, v] = U.find(([, x]) => n >= x);
    const tot = Math.floor(n / (v / 1e4) * (1 + 1e-12)), hi = Math.floor(tot / 1e4), lo = Math.max(0, tot - hi * 1e4);   // 나눗셈 끝자리 보정(25구가 24구 9999양으로 보이던 것)
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

