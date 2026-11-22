  /* ---------- 2.0.0 핫픽스(원격 설정, 2026-10-27 woodani) ----------
     웹 주소의 live.json을 켤 때 읽어요(웹, 안드로이드, 토스 모두). 코드는 받지 않고 숫자, 공지, 기능 끄기만 받아요.
     바꿀 수 있는 숫자는 LIVE_KEYS에 적은 것만이고, 값마다 최소와 최대 안으로 맞춰요. 받은 것은 이 기기에 남겨 두고 인터넷이 없을 때 써요.
     쓰는 법은 docs/HOTFIX.md */
  const LIVE_URL = () => window.FS_LIVE_URL || (/(github\.io|web\.app|firebaseapp\.com)$/.test(location.hostname) ? 'live.json' : 'https://seop-sci.github.io/forest-school/live.json');   // GitHub 복구로 다시 github.io(~ 앱은 web.app을 읽어서 Firebase가 github.io로 넘겨줘요)
  const LIVE_KEYS = {   // 이름: [바꿀 곳, 칸, 최소, 최대]
    pace: [() => CFG, 'pace', 0.1, 0.4],   // 게임 속도(수업료 배율)
    'pz.perDay': [() => PZ, 'perDay', 3, 30], 'pz.adMore': [() => PZ, 'adMore', 0, 10], 'pz.adMax': [() => PZ, 'adMax', 0, 5],   // 숲속 퍼즐 하루 보상 판, 광고로 더 받는 판과 횟수
    'mg.adN': [() => MG.AD, 'n', 0, 5], 'mg.adE': [() => MG.AD, 'e', 10, 200], 'mg.regen': [() => MG, 'REGEN', 20000, 300000],   // 숲속 합치기 광고 횟수와 에너지, 에너지 1 차는 시간(ms)
    'ev.scale': [() => EVC, 'scale', 0.3, 1.5]   // 이벤트 미션 도토리 배율(다음 회차부터)
  };
  const LIVE_OFF_OK = ['puzzle', 'merge', 'event', 'battle', 'weather', 'night'];   // 야간 건설도. 날씨도. 숲속 대결도. 잠시 끌 수 있는 기능
  const Live = { v: 0, off: new Set(), base: null, ok: false };
  const MAINT_KEY = 'forest-maint', MAINT_MAX_MS = 24 * 3600000;
  function liveApply(j, from) {
    if (!j || typeof j !== 'object') return false;
    if (!Live.base) { Live.base = {}; for (const [k, [o, f]] of Object.entries(LIVE_KEYS)) Live.base[k] = o()[f]; }
    for (const [k, [o, f, lo, hi]] of Object.entries(LIVE_KEYS)) {   // 빠진 값은 원래 값으로 되돌려요
      const v = j.cfg && typeof j.cfg[k] === 'number' && isFinite(j.cfg[k]) ? Math.min(hi, Math.max(lo, j.cfg[k])) : Live.base[k];
      o()[f] = Number.isInteger(Live.base[k]) ? Math.round(v) : v;
    }
    Live.off = new Set(Array.isArray(j.off) ? j.off.filter(x => LIVE_OFF_OK.includes(x)) : []);
    // 원격 공지: 게임 안 공지(NOTICES) 위에 얹어요. 날짜가 새로운 것이 위로
    const own = NOTICES.filter(n => !n.live);
    const add = Array.isArray(j.notices) ? j.notices.slice(0, 10).filter(n => n && typeof n.id === 'string' && typeof n.title === 'string' && typeof n.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(n.date) && Array.isArray(n.lines))   // 날짜는 글자일 때만
      .map(n => ({ id: 'live-' + n.id.slice(0, 30), date: n.date, tag: typeof n.tag === 'string' ? n.tag.slice(0, 8) : '알림', title: n.title.slice(0, 40), lines: n.lines.filter(l => typeof l === 'string').slice(0, 20).map(l => l.slice(0, 200)), live: true })) : [];
    NOTICES.length = 0; NOTICES.push(...[...add, ...own].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)));
    Live.v = typeof j.v === 'number' ? j.v : 0; Live.ok = true; Live.from = from;
    // 점검 모드: 인터넷에서 받은 live.json에만 따라요(이 기기에 남겨 두지 않아요. 인터넷이 없을 때 갇히지 않게)
    if (from === 'net') {
      const m = j.maint;
      Live.maint = m && typeof m === 'object' && typeof m.msg === 'string' && m.msg.trim()
        ? { title: typeof m.title === 'string' && m.title.trim() ? m.title.trim().slice(0, 30) : '점검 중이에요', msg: m.msg.trim().slice(0, 300), until: typeof m.until === 'string' ? m.until.trim().slice(0, 40) : '' } : null;
      // 같은 점검 글을 이 기기가 처음 본 지 24시간이 지나면 덮개가 저절로 풀려요(live.json이 잘못 남아도 갇히지 않게)
      try {
        if (Live.maint) {
          const k = [Live.maint.title, Live.maint.msg, Live.maint.until].join('|'), now = Date.now();
          let o = null; try { o = JSON.parse(localStorage.getItem(MAINT_KEY) || 'null'); } catch (e) { o = null; }
          if (!o || o.k !== k || typeof o.at !== 'number' || o.at > now) { o = { k, at: now }; localStorage.setItem(MAINT_KEY, JSON.stringify(o)); }
          if (now - o.at > MAINT_MAX_MS) Live.maint = null;
        } else localStorage.removeItem(MAINT_KEY);
      } catch (e) { /* 저장소가 막혀 있으면 예전처럼 */ }
      maintSync();
    }
    // 이 기기에 남길 때는 받아 준 것만 정리해서 통째로 남겨요(글자 수로 자르면 다음에 읽지 못해요)
    const cfg = {}; for (const k of Object.keys(LIVE_KEYS)) if (j.cfg && typeof j.cfg[k] === 'number' && isFinite(j.cfg[k])) cfg[k] = j.cfg[k];
    Live.clean = { v: Live.v, cfg, off: [...Live.off], notices: add.map(n => ({ id: n.id.slice(5), date: n.date, tag: n.tag, title: n.title, lines: n.lines })) };
    if (S) { renderNoticeDot(); renderLiveOff(); }
    return true;
  }
  const liveOff = k => Live.off.has(k);
  // 점검 모드: 덮개를 띄우고 1분마다 live.json을 다시 읽어요. 제목을 3초 안에 다섯 번 누르면 이번만 들어가요(용)
  function maintSync() {
    const el = document.getElementById('maint'); if (!el) return;
    const on = !!Live.maint && !rt.maintPass;
    if (on) {
      $('#maintTitle').textContent = Live.maint.title;
      $('#maintMsg').textContent = Live.maint.msg;
      $('#maintUntil').hidden = !Live.maint.until; $('#maintUntil').textContent = Live.maint.until ? `끝나는 때: ${Live.maint.until}` : '';
      if (!rt.maintTimer) rt.maintTimer = setInterval(() => { liveLoad(); }, 60000);
    } else if (rt.maintTimer) { clearInterval(rt.maintTimer); rt.maintTimer = 0; }
    const was = !el.hidden; el.hidden = !on;
    if (was && !on && !rt.maintPass && S) toast('점검이 끝났어요!\n다시 즐겁게 놀아요');
  }
  function maintTap() {
    const t = Date.now(); rt.maintTaps = (rt.maintTaps || []).filter(x => t - x < 3000); rt.maintTaps.push(t);
    if (rt.maintTaps.length >= 5) { rt.maintTaps = []; rt.maintPass = true; maintSync(); toast('점검 중이지만 이번만 들어가요'); }
  }
  function renderLiveOff() {
    for (const [k, id] of [['puzzle', '#pzOpen'], ['merge', '#mgOpen'], ['battle', '#btCard']]) { const b = $(id); if (b) b.classList.toggle('live-off', liveOff(k)); }   // 대결 카드도
  }
  async function liveLoad() {
    try { const c = JSON.parse(localStorage.getItem('forest-live') || 'null'); if (c) liveApply(c, 'cache'); } catch (e) { /* 남긴 것이 없으면 그만 */ }
    if (location.protocol === 'file:' && !window.FS_LIVE_URL) return;   // 자동 시험(file://)은 받지 않아요
    if (window.__FOREST_TEST && !window.FS_LIVE_URL) return;
    try {
      const ctl = typeof AbortController === 'function' ? new AbortController() : null;
      const t = setTimeout(() => ctl && ctl.abort(), 6000);
      const r = await fetch(LIVE_URL() + '?t=' + Math.floor(Date.now() / 60000), { cache: 'no-store', signal: ctl ? ctl.signal : undefined });
      clearTimeout(t);
      if (!r.ok) return;
      const j = await r.json();
      if (liveApply(j, 'net')) { try { localStorage.setItem('forest-live', JSON.stringify(Live.clean)); } catch (e) { /* 저장 못 해도 이번에는 써요 */ } if (S && !rt.ntAuto) noticeAuto(); }
    } catch (e) { /* 인터넷이 없거나 막혀 있으면 게임 안 값 그대로 */ }
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
    rt.clk0 = { last: (S.clk && S.clk.last) || 0, perf: performance.now() };   // 보안 점검(2-6): 서버 시간 전까지 쓰는 게임 시계 기준
    if (!S.q.init) { if (hadSave) fastForwardMain(); else startMain(); S.q.init = true; }
    if (S.q.reset) { S.q.reset = false; startMain(); }
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
    warmRooms();   // 건물 안 그림을 쉬는 틈에 미리 풀어 둬요
    // GitHub 테스트판: 서버에 연결해서 저장을 맞춰요
    if (hadSave) bakDaily();   // 하루 한 번 자동 백업(서버가 없는 판도)
    if (hasCloudBuild()) {
      Cloud.state = 'idle';
      Cloud.bootHadSave = hadSave;
      Cloud.bootSavedAt = S.savedAt;   // 보안 점검(1-1): 서버 학교와 비교할 이 기기 저장 시각은 켤 때 값으로(그 뒤 저장하면 바뀌어요)
      Cloud.skipRestore = adopted !== null;
      // 이어하기 코드 기능을 뺐어요. 예전 링크(?move=)는 주소에서만 지우고, 남은 코드 기록도 지워요
      try {
        if (new URLSearchParams(location.search).has('move')) history.replaceState(null, '', location.pathname + location.hash);
        localStorage.removeItem('forest-move-code');
      } catch (e) { /* 무시 */ }
      initCloud();
    }
    if (adopted !== null) setTimeout(() => toast(adopted || '학교를 불러왔어요'), bootLeft() + 600);
    if (rt.brokenSave) setTimeout(() => toast('저장된 학교를 읽지 못해서 새 학교로 시작했어요. 읽지 못한 기록은 이 기기에 따로 남겨 뒀어요'), bootLeft() + 900);
    if (S.rank.joined || AIT) initRank();   // 랭킹에 참여한 학교는 점수가 오르면 바로 올라가게 미리 연결해요
    if (!fromHot) {
      if (hadSave) awayStart();
      else if (S.pending > 0) queueModal(showOffline);
    }
    if (!hadSave) save();
    rt.lastT = performance.now();
    requestAnimationFrame(loop);
    bootDone();
    setTimeout(tutAuto, bootLeft() + 900);
    setTimeout(noticeAuto, bootLeft() + 1100);
    liveLoad();   // 핫픽스(live.json). 공지
    $('#maintRetry').addEventListener('click', async () => { sfx('tap'); $('#maintRetry').setAttribute('aria-disabled', 'true'); await liveLoad(); $('#maintRetry').setAttribute('aria-disabled', 'false'); if (Live.maint) toast('아직 점검 중이에요.\n조금만 기다려 주세요'); });   // 점검 모드
    $('#maintTitle').addEventListener('click', maintTap);
  }
  // 로딩 화면: 일찍 끝나도 적어도 3초는 보여 줘요. 막대는 로딩하는 것처럼 멈칫거리며 차오르고, 끝까지 채운 뒤 사르르 사라져요
  const BOOT_MIN = window.__FOREST_TEST && !window.__FOREST_BOOT ? 1200 : 3000;   // 자동 시험은 예전처럼 1.2초만 기다려요
  // 토스는 자기 로딩 화면을 페이지가 다 열릴 때까지 띄워서, 그동안 우리 로딩 화면이 가려진 채 끝나 버렸어요. 토스 판은 페이지가 다 열린 때부터 2.5초를 세요
  let bootT0 = 0;
  const bootRestart = () => {   // 토스 판: 화면이 보이기 시작할 때 막대와 안내 글을 처음부터 다시 보여 줘요
    bootT0 = performance.now();
    const i = document.getElementById('bootBar'), st = document.getElementById('bootStep');
    if (i) { i.style.animation = 'none'; void i.offsetWidth; i.style.animation = 'bootFill 2.4s linear forwards'; }
    BOOT_STEPS.forEach((m, k) => setTimeout(() => { if (st && st.isConnected && !document.getElementById('boot').classList.contains('done')) st.textContent = m; }, k * 480));
  };
  if (AIT && !window.__FOREST_TEST) { if (document.readyState === 'complete') bootT0 = performance.now(); else addEventListener('load', bootRestart, { once: true }); }
  const bootLeft = () => Math.max(0, (AIT && !window.__FOREST_TEST ? 2500 : BOOT_MIN) - (performance.now() - bootT0));
  const BOOT_STEPS = ['학교 문을 여는 중...', '도토리를 세는 중...', '교실 창문을 여는 중...', '학생들을 깨우는 중...', '출석부를 챙기는 중...'];
  const BOOT_TIPS = ['참나무를 누르면 도토리가 떨어져요', '체험학습을 보내 두면 기다리는 동안에도 학교가 자라요', '오늘의 미션으로 미션 포인트를 모아 주간 상자를 열어요', '종업식을 열면 학교는 그대로 남고 시설 레벨이 확장돼요', '꾸미기 백화점의 테마 세트를 가지면 수업료가 올라요', '숲의 정수는 공부 탭에서 모아요. 문방구에서 도토리로 바꿀 수도 있어요', '꾸미기 가게에서 산 장식을 지도의 빈 자리에 놓아 학교를 꾸며요', '꾸미기 가게에서 학교 이름과 학교 마크를 바꿀 수 있어요', '매나 뱀이 나타나면 여러 번 눌러서 쫓아내요. 곰 선생님이 도와줘요', '업적을 모두 이루면 칭호를 받아요. 칭호는 랭킹 이름 옆에 붙어요', '숲속 퍼즐은 잠시 나갔다가 이어하기로 돌아올 수 있어요', '홈 지도는 두 손가락으로 벌리면 크게 볼 수 있어요'];   // 다듬음(4번, 학교 행사 줄 빼기) + 새 기능 도움말
  (() => {
    const v = document.getElementById('bootVer'), t = document.getElementById('bootTip');
    if (v) v.textContent = 'v' + VERSION;
    if (t) t.textContent = BOOT_TIPS[Math.floor(Math.random() * BOOT_TIPS.length)];
    const st = document.getElementById('bootStep');
    BOOT_STEPS.forEach((m, i) => { if (i) setTimeout(() => { if (st && st.isConnected) st.textContent = m; }, i * 620); });
    setTimeout(() => bootDone(), AIT ? 10000 : 8000);   // 무슨 일이 있어도 8초(토스 판은 10초) 뒤에는 걷어요
  })();
  function bootDone() {
    const b = document.getElementById('boot');
    if (!b || b.dataset.done) return;
    b.dataset.done = '1';
    const go = () => setTimeout(() => {
      b.classList.add('done');
      const st = document.getElementById('bootStep'); if (st) st.textContent = '준비 끝!';
      setTimeout(() => { b.classList.add('out'); setTimeout(() => b.remove(), 500); }, 280);
    }, bootLeft());
    if (AIT && !window.__FOREST_TEST && document.readyState !== 'complete') addEventListener('load', go, { once: true }); else go();   // 토스 판: 페이지가 다 열린 뒤에 세요
  }

  // 시험용 손잡이: 자동 시험(window.__FOREST_TEST)에서만 게임 속 함수를 꺼내 써요
  if (window.__FOREST_TEST) window.__forest = { get S() { return S; }, claimSub, hardQ, taOpen, taSit, taSend, taClaim, taMonUp, taMult, taSeats, taDue, taRender, TA, statsDoc, get rt4() { return rt; }, BX_SPOT, decoMap, tamGearBuy, zoneKids, setZone, claimMission, MISSIONS, adAskDone, tamRenderBody, tamMem, btSweep, btSwOpen, openBtSw, btLeft, btDay, renderBtCard, tamCap, SAVE_CAP, fmt, sanitize, showEntrance, claimables, claimAllNow, subReady, todoRows, offlineEff, qNeed, incomeScale, todoGo, renderTodo, acBuyBookAll, frGiftAll, rdUnqueue, rdSettle, frGift, frGiftLeft, acBkLeft, bookCost, APP_PACK, mapLo, mapHidden, finalYear, stPicUrl, ST_PICS, webAud, webCacheOk, c3u, WEB_ROOT, THEME, applyCos, setZone, decoEditStart, decoEditEnd, tamSkipTo, tamSkipGo, tamWinRep, tamRepFl, tamRenderTop, tamBg, teaOff, geo, qMeasure, IMG, tamHOn, tamHOpen, tamCurFl, tamWinH, tamHf, tamHRankDoc, tamSkBusy, tamReach, get SKQ() { return SKQ; }, esAxGain, esAxLeft, ESHOP, tamLvPlan, tamLvBuy, tamLvAll, mapUrl, mapBase, tamCheerLeft, tamAdRevive, tamCap, tamCapped, tamLvRef, tamBaseRate, tamLvCost, tamStageIn, musicWant, tamPh, tamEvPick, tamAutoTeam, tamAutoGain, tamUpRec, MAIN, startSports, GEO, claimAchAll, ACH, btMake, btBest, btRoster, btRoll, btWin, btOppCheer, BT, BT_LG, stPrev, get Rank() { return Rank; }, tamRankDoc, tamTf, tamAdSpd, tamReport, tamRepTake, tamAdRevive, renderRankPanel, TAM, tamSim, tamTeam, tamStat, tamMobs, tamWin, tamIdle, tamCollect, tamParty, tamShard, tamPow, tamFight, tamStep, TAM, tamSim, tamTeam, tamStat, tamMobs, tamWin, tamIdle, tamCollect, tamShard, tamParty, tamPow, tamLvCost, tamOpen, setZone, geo, stPlay, stNext, ST, ST_SIDE, SIDE, missionGo, MGO, MGO_MINI, MGO_Q, renderMissions, renderPass, BOOST, conLeft, gameToday, setTab, ADX, adStamp, adxDay, adxCan, adxMore, adPickNow, adPickGive, conNear, renderAdStamp, claimOfflineDouble, startBoost, openBoost, showOffline, fvBoothStart, bfFwStart, musicWant, renderCounsel, renderXg, renderFv, showCeremony, RX, rxPct, rxCost, rxUp, rxPart, renderDept, goldOr, goldRich, adGold, stampAtt, GOLD, BIG, BF_DECO, bfWin, bfNext, bfOn, bfFw, bfSync, bfStamp, bfFwStart, bfPart, bfNextTx, sanitizeBf, freshBf, fvBoothMax, bldBox, bldPick, bldWarm, DECO_SLOTS, XG, MK, ST, SIDE, ST_SIDE, wdMap, xgOn, xgGuest, xgSpots, xgGreet, xgVisit, xgLunch, openXg, mkOn, mkHot, mkSell, mkBuy, mkSur, openMk, wdBar, wdTick, stTick, stPlay, stNext, stPick, stEnd, stTags, openSb, renderSb, sideCan, sideMap, fvFlag, FV, FV_POS, fvOn, fvOpen, fvBonus, fvSync, fvStamp, fvGuests, openFv, renderFv, fvMeet, fvBoothStart, fvMap, fvTip, festDef, goTo, navInfo, openShop, gdReady, thPreview, thPreviewEnd, thOn, busScene, tripCrowd, openTrip, startTrip, claimTrip, TRIPS, tripMult, openSheet, openRx, rtStart, rtLv, RT5, setZone, tamReg, promote, canPromote, get rxTier() { return RX_TIER; }, set rxTier(v) { RX_TIER = v; }, tamLvAllPlan, tamLvAllAsk, decoPut, decoUsed, get ZONE0() { return ZONE0; }, mgPickMul, mgPickMode, mgUpOrder, mgFillOrders, mgAdAsk, sportsCon, festCon, btQuota, btCanAd, btAdMore, warmRooms, blobUrl, vdSize, vdBlock, pzSweep, pzSwGain, pzSwOpen, pzXpOf, mgMulMax, mgMulOk, mgMul, mgModeTap, acTip, kidDupIdx, trialSafe, closeAd,
    TKE, TK_Q, tkDaily, nbAllDay, nbBuildAt, nbOn, conAdd, BX_SPOT, PERKS, offlineCapH, applyAway, pzFinish, mgClaimOrder,
    CS, JOBS, CS_WORRY, freshCs, csOpen, csLeft, csMax, csEnsure, csCands, csNeed, csMul, csOpenCards, csReady, csDone, csTalkMake, csAnswer, csChoose, csSettle, openCounsel, renderCounsel, renderHall, MAIN, qMeasure, qGoal, sanitize,   // 진로 상담
    questPick, facAllNext, CAMPUS8,
    upPlan, upAll, upAsk, upRender,
    termRep, termOn,
    NSL, nsStart, nsSettle, nsOpen, nsOn, nsOverlap, nsExtraH, isNight, nightDayOf, openNs, renderNs, bxSpots, renderNight,
   conOn, conLeft, conTick, conSec, conFinish, tkPlan, tkUse, tkUseAll, TK, CON, TKAD, capNext, yearCap,   // 공사
    semOn, semFirst, semLabel, cereDip, semBreak,   // 학기(s80)
    get btUI() { return btUI; }, rkFill, RKF, rkPeriod, luxOn, foldApply, adminLookData, conFreeLeft, ffLeft, FF, TIER_X, UNI_FRESH, freshMult, repYear, repLeft, repLocked, repSum, deptX, deptXOf, DEPT_X, snMoodMax, mgEMax, festTimeLock, festNight, conFree, conEss, conEssCost, askConEss, CON, conSec, conBand, CB, cbOn, cbLeft, cbCost, cbApply, cbBuy, conRender, progOf, parseSave, saveSum, bakList, bakAdd, bakAll, askPick, pickKeepLocal, pickLoadSrv, openBak, cloudShouldRestore, get Cloud() { return Cloud; }, CG, CG_FLAGS, cgOpen, cgSync, cgPractice, cgMy, cgTable, cgOppNow, cgHTML, cgNewWeek, renderClub, BX, BX_SPOT, BIO, BIO_BY, bxOpen, bxSync, bxPick, bxOk, bxTap, bxCount, bxRareP, bxMapHTML, bxDexRender, setDexSeg, renderDeco, gdOpen, showReady, GD, GD_CROPS, GD_MENU, GD_M, gdN, gdSync, gdPlant, gdWater, gdHarvest, gdPull, gdCook, gdMult, gdPct, gdToday, gdReadyN, gdMenuCount, openGd, gdRender, gdMark, nbApply, NB, nbAdd, nbAddOf, nbOn, nbOnAt, nbLeft, nbOverlap, nbApply, nbNotice, conAdd, get Live() { return Live; }, sanitize211, ffCan, ffRender, BTQ, BTQ_SCI, BTQ_KOR, BTQ_COL, btqMake, btqMath, btqPick, btqAnswer, btqMemTap, btqPts, btReveal,   // 대결 종목 문제
    SN, SN_ALL, snOpen, snCount, snSync, snMult, snBase, snCost, snPick, snDraw, openSn, snRender, snDexRender, setDexSeg, rate,
    qProg, VD, vdH, vdOpen, vdNeed, vdLeft, vdLocked, vdLive, boostAmount, TKAD, tripCut, achMedal, vdAmt, vdGive, vdUp, openVd, vdRender, vdMapHTML, achTitles, achTitleName, setTitle,
    BF, FR_LINES, frSync, frMake, frOf, frNm, frFull, frHeart, frList, frPat, frGift, frGiftLeft, frAddP, frRename, frHere, frKidTap, frLetter, frTick, bdParty, bdPlace, bdClaim, bdDoneToday, bdRender, bdHats,
    albAdd, albMigrate, openAlbum, renderAlbum, openLetter, sanitize211,   // 학생과 추억
    PCN, pcStart, pcSettle, pcTick, pcActive, pcAway, pcRemain, openPicnic, renderPicnic, SK, SK_KINDS, skAdd, skPrize, skLeft, skFull, openSticker, renderSticker,
    AW, audioWatch, audioReset, pzHelpSquirrel,   // 소리 지킴이, 퍼즐
    GSHOP, OUTFITS, evPastIds, renderNight, shopItem, essItem, buyEss, pickEss, nickPrice, grantOffline, thSetPrice, pickDeco, buyDeco, buyDecoBerry,   // 소풍, 스티커판, 상점
    LAB, LAB_IN, LAB_KEYS, LAB_CARDS, LAB_MIX, LAB_DBL, labOf, labRun, labCount, labReady, labDone, openLab, renderLab, labTap, labGo, RD, BOOKS, rdStart, rdSettle, rdTick, rdLeft, rdRemain, openRead, renderRead, renderStudy2, sanitizeStudy2, maintSync, maintTap, openBook, renderBook, BT, BT_EV, BT_LG, BT_SCH, btOpen, btLeft, btRoster, btBest, btMake, btScore, btWin, btFinish, btOpenScene, btClose, btRankDoc, readRow, btAuto, btPick, btStart, btRender, renderBtCard, sanitizeBt, get btUI() { return btUI; }, EX, exIsWeek, exNow, exPrev, exDays, exScore, exGrade, exStudy, exClaim, exTick, exMake, openExam, renderExam, exAwardTop, exReportReady, sanitizeExam, renderSheet, openSheet,   // 공부 2단계(s76)
    AC, AC_GAME, AB_KEY, ABIL, acLv, acSum, acMult, acRepOf, acGain, acSettle, acAll, acCap, acBkLeft, acBuyBook, renderAc, sanitizeAc, freshAc, rankRows, awayStart, awaySettle, timeSrc, save, awayHold, rankCap, cloudVerify, liveApply, liveLoad, openNotice, NOTICES, get Live() { return Live; }, get Rank() { return Rank; }, liveOff,   // 보안 점검 시험(s71), Codex 검토 시험(s72)
    rosterEnsure, rosterMake, rosterAdd, clubAuto, clubSet, clubPct, clubShow, clubSum, clubStars, clubMembers, clubShowGo, conArtKey, FXL, FXT, FXE, fxeFirework, fxeSportsEnd, fxTamHitT: (...a) => fxTamHit(...a), fxTamDropT: (...a) => fxTamDrop(...a), fxOn, fxTamOn, fxTamInit, fxLoad, fxOak, dropValue, UIFX, FXG, fxgOn, fxgSet, fxgRun, fxgHeight, FXO, fxoInit, pzAfterPlaceT: r => pzAfterPlace(r), mgRenderBoardT: () => mgRenderBoard(), trTab, trWipe, uiRwOpen, uiRwClose, cereFx, tamLay, openModalT: el => openModal(el), closeModalT: (el, f) => closeModal(el, f), ppDecoSync, ppMedIc, PP_DECO, showReady, showReadyC, showQuestFree, showWait, showDay, clubWeekTick, clubFacUp, CLUBS, CLUB, star, clubTuitionMult, clubFestMult, clubDecoOff, renderClub, renderHall, openSeatPick, openClubPick,
    TIER_SCALE, renderCampus, zoneBadge, uniPreview, setZone, DEPT, openDept, renderDept, deptSet, deptPct, deptOf, deptPicks, deptSlots, deptMult, zoneKey, uniOn, zoneOf, ZONE_GEO, CAMPUS, GEO, geoIdx, legacyMult, tuitionMult, snapTake, snapOf, showCere, cereCrew, cere3Info, cere3Load, cere3, tierViewOpen, tierViewClose, renderTierView, renderTierDots, nlCycle, viewMap, showNewTalk, talkNext, showCere, cereEnd, cereCrew, cereAsk, cereKeep, goFur, updateQuestDot, openElect, renderElect, elVote, elSync, elMult, elClub, elPres, elBadge, elMake, EL_PLEDGES, clubPct, festPrize, dropValue, claimMission, gameWeek, NEWCOMERS, TIERS, GEO, geoIdx, decoCost0, qMeasure, qDone, qGoal, kidArt: kidSVG, newYear, checkGrade, gradeOf, townRep, FAC, sanitize200, trialHunt, updateTrial, TRIAL, zoomAt, fitMap, ZOOM_MAX, DECO, DECO_SLOTS, DECO_SIGN, decoCost, decoSoldOut, pickDeco, buyDeco, decoPut, decoEditStart, decoEditEnd, openDecoPick, renderDeco, setSchoolNm, setMark, schoolTitle, markHTML, decoPlacedAll, esExLeft, esExCost, get Cloud() { return Cloud; }, get actx() { return actx; }, Music, musicSync, ensureAudio, bgmLoad, pzUI, rt, makeDeal, furStage, DEAL, navInfo, navRoute, hudTheme, HUD_TH_COL, pathInfo, pathRoute, MAP_PATHS, spawnDrop, repTipCheck, linkGoogle, retryCloud, sanitize, acctPending, renderMap, renderHUD, renderAffordance, syncKids, layoutMap, geo, hitTrial, endVisit, showReward, recommend, needCost, prepTopUp, qReward, prepPhase, rankScore, pwOf, previewDip, dipMult, costScale, buyFur, buyFurAll, furCost, furReady, furDone, FUR, startTalk, endTalk, teacherAct, facCost, teaCost, facKeys, rate, rep, capacity, canGraduate, canPromote,
    fmt, fmt2, graduate, promote, buyPerk, perkCost, perkMaxed, buyFundPerk, fpCost, claimMain, mainReady, curMain, qNo, earn, CFG, TEA, teaMaxed, PERKS, FPERKS, MAIN, finalYear, startTrip, claimTrip, TRIPS, yearLocked, endSports, rtSports: () => rt.sports, rtFest: () => rt.fest, facCap, addLeague, addMP, tutStart, endFest, claimBox, musicWant, askBox, festWait, setTab,
    RARE, modelOf, rareRoll, rareGot, showRareTalk, rareDexHTML, kidSVG, rosterKid, WX, wxOf, wxIs, rdMinNow, renderWeather, PL, plSync, plUnread, openPLetter, renderPLetter, RS, rsNum, rsSync, rsAdd, rsLabel, lookDoc, lookRead, lookPush, lookSet, openLook, MODEL_SCHOOL, joinRank, PS, PS_M, PS_SEASONS, psSeason, psOpen, psSync, psLv, psGot, psReward, psClaimAll, psClaimMission, psWatchAd, psClaimable, psStepReady, psExtraReady, psChooseFur, psFurImg, renderPass, setEvSeg, xtGot, achTitles,   // 숲속 패스
    MAP_OAK, oakArt, layoutOak, mapOak, oakAt, tapOak, dropSpot,
    dexMeet, dexSync, dexPending, dexGift, renderDex, evCurrent, evNext, evUpcoming, evSync, evFix, evVal, EV_FALLBACK, EV_DECO, EV_HAT, COS, DECO_BY, decoOwn, perkRec, fpRec, gmPast, gmItems, gmNow, GMON, buyShop, pickShop, showNote, showOkOn, showWd, renderGradPanel, renderShop, renderDecoShop, EV_WEEKLY, EV_WEEK_BASE, weekMon, claimStamp, claimEvMission, claimEvBox, renderEvent, evMissions, evOk, evSkipped, EV_MONTHS, EV_MEASURE, tierMinutes, minAcorns, IMG, sanitize171, ACH, achSync, claimAch, setTitle, renderAch, setDexSeg, achClaimable, XT, xtAct, xtCost, xtLv, feastMins, libMult, propInstances, walkBuild, festItemSvg, guestArt, adErrText, googleErrText, openSheet, closeSheet, startFest, startSports, sanitize170, EV_STAMPS, EV_SPECIAL, EV_MONTHLY, EV_BOX, DEX_KEYS, DEX_REWARD, DEX_GUEST_KEYS, seasonKey, roofArtKey, thrKey, PP, PP_TITLES, ppOpen, ppPer, ppData, ppDay, ppWrite, ppTick, ppSync, ppScore, ppSemDone, rtMax, alumniLines, SIDE, vdReward, oakKey, setSeasonArt, VP, vpLv, vpCost, vpMult, vpAct, renderVpCard, sportsPrize, festPrize, renderTeachers, buildTeacherCards, bldImg, roofKey, bldStage, mapKey, setMapArt, applyThemes, buyFacility, bldFx, setBldFx, mapHi, Live, liveApply, liveLoad, liveOff, LIVE_KEYS, EVC, NOTICES, openNotice, noticeAuto, noticeWant, ntUnread, startTrial, endTrial: () => rt.trial && (rt.trial.left = 0), spawnDeal, startVisit, IMG170, MG, mgCells, mgSetCells, mgTick, mgAddEnergy, mgAddUp, mgTapGen, mgDrop, mgSell, mgUpgrade, mgAddUp, mgUpSwap, mgGensMax, MG_UP_ESS, mgClaimOrder, mgSwapOrder, mgOrderOk, mgFillOrders, mgOpen, mgClose, mgRenderAll, mgSpawnLevel, mgNearestEmpty, mgEmptyBoard, mgOrderReward, mgUI, sanitize180, mgWatchAd, mgNewOrder, mgHintPick, mgShowHint, mgClearHint, mgTouch, mgOrderGuide, mgDexN, mgDexCan, mgDexClaim, mgOpenDex, MG_DEX, MG_DEX_MS, mgDexEss, mgDexEssCan, mgDexEssN, mgDexMsCan, mgDexMsClaim, MGB, mgBuyBoost, mgBstLeft, mgOpenBoost, nice, claimMission, claimBonus, claimWeekMission, MP_BOX, swapDaily, repairMissions, MISSIONS, WMISSIONS, dmDay, wkWeek,   // 도감, 이벤트
    PZ, PZ_SHAPES, pzFits, pzAnyFit, pzStuck, pzFullLines, pzPlace, pzFreshGame, pzStart, PZB, pzbCost, pzApplyBoost, pzBoostOpen, pzBoostGo, festGoldLeft, festGoldTake, claimSports, TR2, TR2_PL, openTr2, tr2Act, tr2Away, tr2Ready, tr2Rsv, tr2Tick, renderAlbum, FEST, FEST_IDS, festNight, festShown, festTimeLock, festOpen, startFest, openFest, endFest, renderStreet, pzFinish, pzLeft, pzCanAd, pzEssOf, pzMinOf, pzHelpSquirrel, pzHelpOwl, pzHelpBear, fillSubs, mapRoofTop, showAd, claimOfflineDouble, startBoost, tripAd, festFocus, festRange, visMap, renderMissions, pzHasHelp, pzRot, pzNewPiece, pzOpen, pzClose, pzGameOver, pzRenderAll, renderMini, addEss, ESHOP, SP_FUR, applyCos, essItem, pickEss, buyEss, renderEssShop, hatSVG, spFurImg, gameNow, gameToday, gameWeek, kstDay, setServerTime, SVR, dmDay, weekIdx, lgWeek, wkWeek, lgKey, pzDay, goldDay, boostLeft, dealLeft, canStamp };
  if (window.__FOREST_TEST) Object.assign(window.__forest, { uniTerm, utSync, tripUseTicket, readUseTicket, picnicUseTicket, buyDecoPieces, adGold, claimBonus, cloudPush, cloudClash, syncGet, revOf, deleteAccount, lookDel: () => lookDelNow(), lookSet, lookPush, leaveRank, sanitizeCg, freshCg, ambWant, ambSync, AMB, AMB_LV, WLD, wldSync, wldLv, wldPhase, wldWeather, wldAuto, WLD_WATER, wldCurtain, photoOpen, photoClose, oakBend, oakBands, frPatAll, frPatLeft, fpsToggle, fxRes, fxWant, gradRecReady, teaRecReady });   // 시험 손잡이
  if (window.claude && window.claude.hot && window.claude.hot.snapshot) {
    try { window.claude.hot.snapshot(() => { if (S) syncMid(); return { save: S }; }); } catch (e) { /* 무시 */ }
  }
  if (AIT) {
    document.documentElement.classList.add('ait');
    // 토스가 주는 여백은 기기 기준 픽셀이에요. 넓은 폰에서 화면 칸 수를 바꿨으면(맨 위 viewport 맞춤) 그 비율로 바꿔 써요
    const inset = a => { if (!a) return; const r = document.documentElement.style, sw = (window.screen && screen.width) || 0, k = sw && innerWidth && Math.abs(innerWidth - sw) > 2 ? innerWidth / sw : 1, px = v => Math.max(0, Math.round((+v || 0) * k)) + 'px'; r.setProperty('--ait-top', px(a.top)); r.setProperty('--ait-bottom', px(a.bottom)); r.setProperty('--ait-nav', px(52)); r.setProperty('--ait-capw', px(112)); };
    inset(AIT.safeArea()); AIT.subscribeSafe(inset);
    AIT.preload();
    (async () => {
      try {
        if (!localStorage.getItem(SAVE_KEY)) { const v = await AIT.storage.getItem(SAVE_KEY); if (v) localStorage.setItem(SAVE_KEY, v); }
      } catch (e) { /* 없으면 새로 시작해요 */ }
      start({});
      AIT.userKey().then(k => { if (k && S) { S.tkey = k; save(); } });   // 토스 사용자 키(미니앱마다 고유)를 저장해 둬요
      const tossClock = () => { if (AIT.serverTime) AIT.serverTime().then(setServerTime); };   // 토스 서버 시간으로 게임 시계를 맞춰요
      tossClock(); SVR.resync = tossClock;   // 시계가 어긋나 보이면 다시 받아요
      document.addEventListener('visibilitychange', () => { if (!document.hidden) tossClock(); });
    })();
  } else window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
})();
</script>
