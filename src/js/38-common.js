  /* ---------- 공통: 1초 갱신, 패널 열기, 버튼 ---------- */
  // loop()에서 매 프레임 불러요. 1초마다 도감 기록과 이벤트 회차를 맞추고 버튼 점을 갱신해요
  function tick170(dt) {
    rtTick();   // 연구 트리 연구 시간
    ppTick();   // 논문 쓰기와 학회
    rt.t170 = (rt.t170 || 0) + dt;
    if (rt.t170 < 1) return;
    rt.t170 = 0;
    if (!S.dex || !S.ev) return;
    dexSync(); evSync();
    rosterEnsure(); clubWeekTick(); renderHallBtn(); renderTierDots();
    elTick();   // 반장 선거
    rdTick();   // 책 읽기
    pcTick();   // 숲속 소풍
    fvTick();   // 대학 축제
    wdTick(); stTick(); renderSbBtn();   // 교환학생과 장터, 이야기
    frTick();   // 단짝 친구, 생일 잔치
    if (!$('#mVd').hidden) vdRender();
    snSync(); snHud(); if (!$('#mSn').hidden) snRender();   // 간식 뽑기(날이 바뀌면 기분 0칸). 마을 기부 창(도토리가 늘면 단추가 켜져요)
    gdSync(); gdMark(); if (!$('#mGd').hidden) gdRender();   // 학교 텃밭
    if (cgOpen() && S.cg.wk !== gameWeek() && !rt.modalOpen) { cgSync(); if (rt.tab === 'club') renderClub(); }   // 동아리 대항전 주가 바뀌면
    { const n0 = S.bx ? S.bx.sp.length : 0; bxSync(); if (S.bx && S.bx.sp.length !== n0) renderDeco(); }   // 생물 탐사
    cbApply(); nbApply(); ffRender(); nbNotice();   // 건설 가속, 야간 건설, 오늘 바로 완공 표시
    dsnSync();   // 하루 시작 횟수
    audioWatch();   // 소리가 멈춰 '삐~' 소리가 나면 소리를 새로 켜요
    exTick();   // 시험 기간
    if (rt.tab === 'club') renderClubLite();
    const dd = $('#dexDot'), ed = $('#evDot');
    if (dd) dd.hidden = !dexPending().length && !achClaimable();   // 받을 것만(오늘 찍을 사진은 사진첩 칸 안의 점으로)
    paSync();   // 받을 업적도 점으로
    tick171ach();
    if (ed) ed.hidden = !evClaimable() && !psClaimable();   // 숲속 패스도
    { const pd = $('#psDot'); if (pd) pd.hidden = !psClaimable(); }
    renderWeather();   // 날씨
    renderPLetter();   // 학부모 편지
    if (rt.tab === 'dex') { renderDex(); if (rt.dexSeg === 'pa') paRender(); }
    if (rt.tab === 'event') { if (rt.evSeg === 'ps') renderPass(); else renderEvent(); }
  }
  // setTab()에서 불러요. 도감을 열면 받지 않은 선물을 한 창으로 줘요
  function open170(t) {
    if (!S.dex || !S.ev) return;
    if (t === 'dex') { achSync(true); setDexSeg(rt.dexSeg || 'dex'); }
    dexSync(); evSync();
    if (t === 'dex') { renderDex(); dexGift(); rt.dexNew = null; }
    if (t === 'event') { if (!rt.evSeg && !evClaimable() && psClaimable()) rt.evSeg = 'ps'; setEvSeg(rt.evSeg); }   // 받을 것이 패스에만 있으면 패스 칸부터
  }
  // 저장 읽기: sanitize에서 불러요. 전 저장은 기록으로 알 수 있는 친구들을 채워요(선물은 도감을 처음 열 때 한꺼번에)
  function sanitize170(d, s) {
    if (d.dex && typeof d.dex === 'object') {
      const got = d.dex.got && typeof d.dex.got === 'object' ? d.dex.got : {};
      for (const k of DEX_KEYS.concat(DEX_GUEST_KEYS)) if (got[k]) s.dex.got[k] = numFb(got[k], 1, s.savedAt);
      s.dex.paid = Array.isArray(d.dex.paid) ? d.dex.paid.filter(x => typeof x === 'string' && DEX_PAY_KEYS.has(x)).slice(0, DEX_PAY_KEYS.size) : [];
    } else if (typeof d.born === 'number') {
      BASE_SPECIES.forEach(k => { s.dex.got[k] = s.savedAt; });
      NEWCOMERS.slice(0, s.p.species).forEach(n => { s.dex.got[n.k] = s.savedAt; });
      DEX_TEACHERS.forEach(k => { if (s.t[k] > 0) s.dex.got['tea_' + k] = s.savedAt; });
      s.dex.got.tea_hedgehog = s.savedAt;
    }
    if (d.ev && typeof d.ev === 'object') {
      s.ev.cur = typeof d.ev.cur === 'string' ? d.ev.cur.slice(0, 40) : '';
      s.ev.start = numFb(d.ev.start, 0, 0);
      const st = d.ev.stamp && typeof d.ev.stamp === 'object' ? d.ev.stamp : {};
      s.ev.stamp = { n: Math.min(EV_STAMPS.length, Math.floor(numFb(st.n, 0, 0))), last: typeof st.last === 'string' ? st.last.slice(0, 10) : '' };
      s.ev.list = (Array.isArray(d.ev.list) ? d.ev.list : []).filter(m => m && EV_MEASURE[m.t] && typeof m.n === 'number' && isFinite(m.n) && m.n > 0).slice(0, 3)
        .map(m => ({ t: m.t, n: Math.floor(m.n), b: numFb(m.b, 0, 0), m: numFb(m.m, 0, 15), g: Math.floor(numFb(m.g, 0, 1, SAVE_CAP.count)), done: !!m.done }));
      s.ev.box = !!d.ev.box;
    }
  }
  // 패널 안 버튼: 패널은 HTML에 있으니 지금 바로 이어 둬요
  $('#panelDex').addEventListener('click', e => {
    { const ga = e.target.closest('[data-fr-gift-all]'); if (ga) { frGiftAll(ga.dataset.frGiftAll); return; } }
    if (e.target.closest('[data-fr-pat-all]')) { frPatAll(); return; }
    const fb = e.target.closest('[data-fr-pat],[data-fr-gift],[data-fr-ren]');   // 단짝 칸
    if (fb) { if (fb.dataset.frPat) frPat(fb.dataset.frPat); else if (fb.dataset.frGift) frGift(fb.dataset.frGift); else openFrName(fb.dataset.frRen); return; }
    const b = e.target.closest('[data-dex]');
    if (!b) return;
    rt.dexPick = rt.dexPick === b.dataset.dex ? '' : b.dataset.dex;
    sfx('tap'); renderDex();
  });
  // 이벤트 창 칸: 이번 주 이벤트 | 숲속 패스
  function setEvSeg(v) {
    rt.evSeg = v === 'ps' ? 'ps' : 'ev';
    $$('#evSeg [data-evseg]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.evseg === rt.evSeg)));
    $('#evBody').hidden = rt.evSeg === 'ps'; $('#psBody').hidden = rt.evSeg !== 'ps';
    if (rt.evSeg === 'ps') { $('#psBody').dataset.key = ''; renderPass(); } else { $('#evBody').dataset.key = ''; renderEvent(); }
  }
  $('#panelEvent').addEventListener('click', e => {
    const collect = e.target.closest('[data-collect]')?.dataset.collect;
    if (collect === 'event') { claimEventRewards(); return; }
    if (collect === 'pass') { psClaimBatch(); return; }
    const sg = e.target.closest('[data-evseg]'); if (sg && S) { sfx('tap'); setEvSeg(sg.dataset.evseg); return; }
    const pb = e.target.closest('[data-ps]'); if (pb && S) { const v = pb.dataset.ps; if (v === 'all') psClaimAll(); else if (v === 'ad') psWatchAd(); else psClaimMission(v[0], Number(v.slice(1))); return; }
    const pf = e.target.closest('[data-psf]'); if (pf && S) { psChooseFur(pf.dataset.psf); return; }
    const b = e.target.closest('[data-ev]');
    if (!b || !S) return;
    const v = b.dataset.ev;
    if (v === 'stamp') claimStamp();
    else if (v === 'box') claimEvBox();
    else if (v[0] === 'm') claimEvMission(Number(v.slice(1)));
  });
  /* ===== 도감, 이벤트 END ===== */
