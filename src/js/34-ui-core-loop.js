  /* ---------- 모달 순서 관리 ---------- */
  function queueModal(fn) { rt.modalQueue.push(fn); if (!rt.modalOpen && !rt.paused) nextModal(); }
  function nextModal() {
    if (rt.modalOpen || rt.paused) return;
    while (rt.modalQueue.length) { const fn = rt.modalQueue.shift(); if (fn() !== false) return; }
  }
  function openModal(el) {
    nlModal(el);   // 2.0.1
    rt.modalOpen = el;
    el.hidden = false;
    try { uiRwOpen(el); } catch (e) { /* 연출만 */ }   // 5.3.0.1 보상 창 빛살
    musicSync();   // 4.2.0 졸업식과 학위수여식 곡은 창에 따라 바뀌어요
    requestAnimationFrame(() => el.classList.add('open'));
    const b = el.querySelector('[data-autofocus]') || el.querySelector('.cta') || el.querySelector('button');
    if (b) b.focus({ preventScroll: true });
  }
  function closeModal(el, then) {
    if (el.classList.contains('open')) { try { uiRwClose(el); } catch (e) { /* 연출만 */ } }   // 5.3.0.1 도토리가 위 칸으로
    el.classList.remove('open');
    if (rt.modalOpen === el) rt.modalOpen = null;
    setTimeout(() => { if (rt.modalOpen !== el) el.hidden = true; if (then) then(); nextModal(); musicSync(); setTimeout(toastFlush, 60); sheetBackCheck(el); }, 180);
  }

  /* ---------- 알림, 탭 ---------- */
  let toastTimer = 0;
  // 2.0.1 읽기 쉽게(woodani): 문장이 끝나는 곳(. ! ?)에서 줄을 바꿔요. 화면은 white-space: pre-line으로 줄바꿈을 보여 줘요
  const nl = t => String(t).replace(/([.!?])\s+(?=\S)/g, '$1\n');
  // 창을 열 때: 글자만 든 문단(p)은 문장마다 줄을 바꿔요(안에 그림이나 굵은 글씨가 든 문단은 그대로)
  function nlModal(el) {
    if (!el || !el.querySelectorAll) return;
    el.querySelectorAll('p').forEach(nlP);
  }
  function nlP(p) {
    if (!p.childNodes.length || ![...p.childNodes].every(n => n.nodeType === 3)) return;
    const t = nl(p.textContent.replace(/[ \t]*\n[ \t]*/g, ' ').replace(/ {2,}/g, ' ').trim());
    if (t !== p.textContent) p.textContent = t;
    p.classList.add('nl');
  }
  function toast(msg) {
    if (rt.batch) return;   // 5.0.2 모두 받기 동안의 낱개 알림은 보상 창에 모아요
    msg = nl(msg);
    if (rt.cereOn) { if (!rt.cereToasts.includes(msg)) rt.cereToasts.push(msg); return; }   // 2.0.1 졸업식 장면 동안 온 알림은 장면이 끝난 뒤에
    // 5.0.1.6 F-02: 가운데 창이 떠 있는 동안 저절로 온 알림(방금 누른 것의 대답이 아닌 것)은 창이 닫힌 뒤에 보여요
    const tapped = performance.now() - (rt.tapT || 0) < 700;
    if (rt.modalOpen && !tapped) { if (!rt.mdToasts.includes(msg)) { rt.mdToasts.push(msg); if (rt.mdToasts.length > 4) rt.mdToasts.shift(); } return; }
    const el = $('#toast');
    // 5.0.1.6 F-02: 저절로 온 알림이 아직 떠 있는 알림을 곧바로 덮지 않고 차례를 기다려요(누른 것의 대답은 바로 보여요)
    if (!tapped && !el.hidden && el.textContent !== msg && performance.now() - rt.toastAt < 1500) { if (!rt.toastQ.includes(msg)) { rt.toastQ.push(msg); if (rt.toastQ.length > 4) rt.toastQ.shift(); } return; }   // 많이 밀리면 오래된 것부터 버려요
    toastShow(msg);
  }
  function toastShow(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.hidden = false; rt.toastAt = performance.now();
    el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
    clearTimeout(toastTimer);
    const dur = Math.min(5500, 2200 + Math.max(0, msg.replace(/\s/g, '').length - 22) * 75);   // 5.0.1.6 W-04 긴 알림은 더 오래
    toastTimer = setTimeout(() => { el.hidden = true; const n = rt.toastQ.shift(); if (n) toastTimer = setTimeout(() => toastShow(n), 200); }, dur);
  }
  function toastFlush() { if (rt.modalOpen || rt.cereOn || !rt.mdToasts.length) return; const q = rt.mdToasts.splice(0); const el = $('#toast'); if (el.hidden) { toastShow(q.shift()); } rt.toastQ.push(...q.filter(m => !rt.toastQ.includes(m))); rt.toastQ.splice(3); }
  // 2.3.1 woodani 제보(학교급 동그라미 자물쇠가 홈에 돌아올 때마다 흔들림): 흔들기 표시(shake)가 남아 있어서 숨겼다 다시 보일 때 흔들림이 다시 돌았어요. 끝나면 지워요
  function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true }); setTimeout(() => el.classList.remove('shake'), 900); sfx('deny'); }
  function setTab(t) {
    const prev = rt.tab;
    if (t !== 'rank' && t !== 'dex') rt.backTab = '';   // 5.0.1.6 M-08, C-22
    if (rt.thPrev && t !== 'school') thPreviewEnd(true);   // 3.0.0 다른 탭으로 가면 미리 보기를 끝내요
    rt.tab = t;
    const tabOn = t === 'shop' || t === 'ess' || t === 'deco' ? 'street' : t;   // 1.7.2: 가게 안에 있어도 아래 '상점' 탭이 켜져 있어요
    $$('.tab').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === tabOn ? 'true' : 'false'));
    $('#panelStreet').hidden = t !== 'street';
    if (t === 'street') { renderStreet(); $('#panelStreet').scrollTop = 0; }
    $('#panelQuests').hidden = t !== 'quests';
    $('#panelTeachers').hidden = t !== 'teachers';
    $('#panelGrad').hidden = t !== 'grad';
    if (t === 'tam' && rt.tam && rt.tam.F && rt.tam.F.rep) tamRestart();   // 4.4.1 되풀이 층에서 지금 층으로
    $('#app').classList.toggle('tam-full', t === 'tam'); if (t !== 'tam') { const sh = $('#tmSheet'); if (sh) sh.hidden = true; }   // 4.4.0 탐험 전체 화면
    $('#panelTam').hidden = t !== 'tam'; if (t === 'tam') { tamOpen(); $('#panelTam').scrollTop = 0; const td = $('#tamDot'); if (td) td.hidden = true; }   // 4.3.0 숲속 탐험대
    $('#panelSettings').hidden = t !== 'settings';
    $('#panelRank').hidden = t !== 'rank';
    $('#panelShop').hidden = t !== 'shop';
    $('#panelMini').hidden = t !== 'mini';
    $('#panelDex').hidden = t !== 'dex'; $('#panelEvent').hidden = t !== 'event'; if (t === 'dex' || t === 'event') open170(t);   // 1.7.0 도감, 이벤트
    $('#panelEss').hidden = t !== 'ess';
    $('#panelHall').hidden = t !== 'hall'; if (t === 'hall') { renderHall(); $('#panelHall').scrollTop = 0; }   // 2.0.0 학교 복도
    $('#panelClub').hidden = t !== 'club'; if (t === 'club') { rt.clubPick = -1; renderClub(); $('#panelClub').scrollTop = 0; }
    if (t !== 'school') tierViewClose();
    $('#panelDeco').hidden = t !== 'deco';   // 1.7.4 꾸미기 가게
    if (t === 'deco') { rt.decoPick = ''; rt.mkDraft = null; renderDecoShop(); $('#panelDeco').scrollTop = 0; }
    if (t !== 'school' && rt.decoEdit) decoEditEnd();
    { const db = $('#decoBar'); if (db) db.hidden = !(rt.decoEdit && t === 'school'); }
    if (t === 'ess') { rt.essPick = ''; renderEssShop(); $('#panelEss').scrollTop = 0; }
    $('#app').classList.toggle('on-school', t === 'school');
    if (t !== 'school') $('#scroller').scrollTop = 0;
    if (t === 'shop') { rt.shopPick = ''; renderShop(); $('#panelShop').scrollTop = 0; }
    if (t === 'rank') { rt.rankEdit = false; initRank(); renderRankPanel(); submitRank(); }
    if (t === 'settings') { renderCloudInfo(); renderNoticeDot(); }
    if (t === 'mini') renderMini();
    if (prev === 'quests' && t !== 'quests') markQuestsSeen();
    if (t === 'teachers') renderTeachers();
    if (t === 'quests') renderQuestPanel(true);
    if (t === 'grad') renderGradPanel(true); else $('#gConfirm').hidden = true;
    $('#gDot').hidden = $('#gDot').hidden || t === 'grad';
    if (t !== 'settings') { $('#resetConfirm').hidden = true; }
    renderQuestBar(); renderSubBar(); renderGuide(); renderTeacherGuide(); updateQuestDot();
    if (t === 'school') requestAnimationFrame(() => fitMap(prev !== 'school' && rt.panX == null));
    { const bd = $('.board'), scd = $('#schoolCard'); if (bd && bd.classList.contains('open')) { bd.classList.remove('open'); if (scd) scd.setAttribute('aria-expanded', 'false'); } }
    if (t !== 'shop') Music.preview = '';
    musicSync();
    try { trTab(t, prev); } catch (e) { /* 연출만 */ }   // 5.3.0.1 탭 넘김
  }
  function syncSettingsUI() {
    $('#optSound').checked = S.sound; $('#optBgm').checked = S.bgm; $('#optVibe').checked = S.vibrate;
    $('#tutSub').textContent = S.tut.paid || S.tut.nop ? '학교를 꾸려 가는 방법을 다시 봐요' : `끝까지 보면 황금 도토리 ${TUT_GOLD}개` + (S.tut.st === 'later' ? ' (이어서 보기)' : '');
    $$('#optUnits [data-units]').forEach(b => b.setAttribute('aria-checked', b.dataset.units === S.units ? 'true' : 'false'));
    $$('#optUiz [data-uiz]').forEach(b => b.setAttribute('aria-checked', +b.dataset.uiz === S.uiz ? 'true' : 'false'));
    applyUiz();
  }
  function applyUiz() { const v = S && S.uiz === 1 ? '1' : ''; if (document.documentElement.style.getPropertyValue('--uiz') !== v) { if (v) document.documentElement.style.setProperty('--uiz', v); else document.documentElement.style.removeProperty('--uiz'); document.documentElement.classList.toggle('uiz-big', !!v); } }   // 5.0.1.7 X-01
  // 숫자 단위를 바꾸면 화면에 적힌 숫자를 모두 다시 그려요
  function refreshNumbers() {
    rt.gKey = ''; rt.qKey = ''; $('#questBar').dataset.key = ''; $('#subBar').dataset.key = '';
    renderHUD(); renderMap(); renderAffordance(); renderTeachers(); renderGradPanel(true); renderRankPanel();
  }

  /* ---------- 나가기와 다시 열기 ---------- */
  function closeSchool() {
    closeSheet();
    rt.paused = true;
    rt.closedAt = gameNow();
    awayHold(true);   // 2.0.0 Codex 검토(6): 닫아 둔 시간은 '켠 뒤 논 시간'에 넣지 않아요
    save(rt.closedAt);
    musicSync();
    if (actx && actx.state === 'running') actx.suspend().catch(() => {});
    $('#sClosed').hidden = false;
    $('#reopen').focus({ preventScroll: true });
  }
  function reopenSchool() {
    $('#sClosed').hidden = true;
    rt.paused = false;
    rt.lastT = performance.now();
    ensureAudio();
    awayHold(false);   // 2.0.0 Codex 검토(6)
    if (!rt.awayWait) applyAway((gameNow() - rt.closedAt) / 1000);   // 서버 시간을 기다리는 중이면 그때 한꺼번에 계산해요
    syncKids(false);
    renderHUD(); renderAffordance();
    nextModal();
  }
  // 계정(Firebase 로그인)을 지워요. 구글 계정이 이어져 있으면 오래전에 로그인했다고 거절될 수 있어서, 한 번 더 로그인하고 다시 지워요
  const DEL_PENDING = 'forest-del-pending';
  function delPending(set) {
    try {
      if (set === undefined) return localStorage.getItem(DEL_PENDING) === '1';
      if (set) localStorage.setItem(DEL_PENDING, '1'); else localStorage.removeItem(DEL_PENDING);
    } catch (e) { /* 저장소가 막혀 있어요 */ }
    return false;
  }
  async function deleteAuthUser(canAsk) {
    const u = Cloud.fb && Cloud.fb.auth().currentUser;
    if (!u || typeof u.delete !== 'function') return true;
    try { await u.delete(); return true; }
    catch (e) {
      const G = window.FOREST_GOOGLE;
      if (!canAsk || !/requires-recent-login/.test(String(e && e.code)) || !googleUser() || !G) return false;
      try {
        if (G.popup) await u.reauthenticateWithPopup(new Cloud.fb.auth.GoogleAuthProvider());
        else { const g = await G.login(); await u.reauthenticateWithCredential(Cloud.fb.auth.GoogleAuthProvider.credential(g.idToken)); }
        await u.delete();
        return true;
      } catch (er) { return false; }
    }
  }
  /* 계정 지우기: 서버의 저장, 예전 학교 칸, 랭킹, 공개 학교 모습, 테스트 기록, 관리자 표시를 지우고 Firebase 계정(익명, 구글 연결)도 지운 뒤 새 학교로 다시 열어요.
     2.2.0 검토 3: 서버 기록을 모두 지우기 전에는 계정(인증)을 지우지 않아요(계정이 없으면 내 칸을 지울 권한도 없어져요).
     지우는 동안과 일부를 못 지웠을 때는 저장, 예전 학교, 랭킹, 공개 모습을 올리지 않고(Cloud.deleting), 못 지운 것은 기기에 표시(DEL_DATA)를 남겨 다음에 열 때 먼저 지워요.
     이 기기의 예전 학교(forest-school-bak)와 저장 맞춤 기록도 지워서, 지운 뒤 새 익명 계정으로 예전 학교가 올라가지 않아요.
     계정만 못 지웠으면(구글 다시 로그인 취소, 인터넷 끊김) 표시(DEL_PENDING)를 남겨 두고, 다음에 열 때 서버에 새로 올리기 전에 다시 지워요 */
  const DEL_PATHS = ['saves', 'bak', 'rank', 'look', 'stats', 'admins'];
  const DEL_DATA = 'forest-del-data';
  function delData(uid) {
    try {
      if (uid === undefined) return localStorage.getItem(DEL_DATA) || '';
      if (uid) localStorage.setItem(DEL_DATA, uid); else localStorage.removeItem(DEL_DATA);
    } catch (e) { /* 저장소가 막혀 있어요 */ }
    return '';
  }
  // 서버 칸을 모두 지워요. 못 지운 칸 이름을 돌려줘요(빈 배열이면 모두 지움)
  async function delServer(uid) {
    const rs = await Promise.allSettled(DEL_PATHS.map(k => waitFor(Cloud.db.ref(`forest/${k}/${uid}`).remove(), CLOUD_WAIT)));
    return DEL_PATHS.filter((k, i) => rs[i].status !== 'fulfilled');
  }
  function delLocal() {
    try { [SAVE_KEY, BAK_KEY, BAKD_KEY, SYNC_KEY, ACCT_PENDING].forEach(k => localStorage.removeItem(k)); } catch (e) { /* 무시 */ }
  }
  async function deleteAccount() {
    if (!cloudOn() || rt.deleting) return;
    rt.deleting = true;
    const btn = $('#delYes'); btn.disabled = true; btn.textContent = '지우는 중';
    const uid = Cloud.uid;
    Cloud.deleting = true; clearTimeout(Cloud.timer);   // 지우는 동안 저장, 예전 학교, 랭킹, 공개 모습을 올리지 않아요
    rt.adopting = true;   // 지우는 동안 다시 저장하지 않아요
    delData(uid);   // 다 지우기 전에 앱이 꺼져도 다음에 열 때 이어서 지워요
    const left = await delServer(uid);
    if (left.length) {
      rt.deleting = false; rt.adopting = false; btn.disabled = false; btn.textContent = '모두 지우기';
      Cloud.delLeft = true; renderCloudInfo();   // 서버에 다시 올리지 않고 기다려요(앱을 다시 열면 먼저 지워요)
      toast('서버 기록을 다 지우지 못했어요. 인터넷을 확인하고 다시 눌러 주세요. 그동안 서버에 저장하지 않아요');
      return;
    }
    delData(false);
    const gone = await deleteAuthUser(true);
    if (!gone) delPending(true);
    delLocal();
    try { sessionStorage.setItem('forest-adopt', gone ? '계정과 서버 기록을 모두 지웠어요. 새 학교로 시작해요' : '서버 기록은 지웠어요. 계정은 아직 남아 있어서 다음에 열 때 다시 지워요'); } catch (e) { /* 무시 */ }
    location.reload();
  }
  // 다음에 열 때: 지난번에 서버 기록을 다 못 지웠으면 이어서 지우고, 다 지우면 이 기기 학교도 지운 뒤 다시 열어요
  async function delResume(uid) {
    const left = await delServer(uid);
    if (left.length) return false;
    delData(false);
    const gone = await deleteAuthUser(false);
    if (!gone) delPending(true);
    delLocal();
    try { sessionStorage.setItem('forest-adopt', gone ? '지난번에 남았던 계정과 서버 기록을 모두 지웠어요. 새 학교로 시작해요' : '서버 기록은 지웠어요. 계정은 아직 남아 있어서 다음에 열 때 다시 지워요'); } catch (e) { /* 무시 */ }
    rt.adopting = true; location.reload();
    return true;
  }
  function resetGame() {
    if (S && S.pid) bakAdd(JSON.stringify(S), '처음부터 다시 하기 전');   // 2.2.0
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
  // 끝없이 도는 CSS 움직임(반딧불, 빛 번짐, 단추 흔들림, 비 등)은 멈춰 두고,
  // 학생 걸음과 같은 프레임에 시간만 옮겨 줘요. 1초마다 새로 생긴 움직임을 찾아요. 모습은 그대로예요
  const MAP_DIV = 2;
  // 5.0.2 끊김 줄이기: 지도가 통째로 가려진 동안(다른 탭, 탐험, 퍼즐과 합치기와 대결, 졸업식 장면)에는 지도 학생 걸음과 지도 속 끝없는 움직임을 쉬어요. 돌아오면 그 자리에서 이어 가요
  function mapHidden() { try { return rt.tab !== 'school' || !!rt.cereOn || !!(pzUI.open || mgUI.open || btUI.open); } catch (e) { return rt.tab !== 'school'; } }
  function slowAnimTick(now, noMap) {
    if (!document.getAnimations) return;
    if (!rt.saAt || now - rt.saAt > 1000) {
      rt.saAt = now;
      const keep = [];
      for (const a of document.getAnimations()) {
        const e = a.effect, tg = e && e.target; if (!tg || !e.getTiming || e.getTiming().iterations !== Infinity) continue;
        // 휴대폰 WebView에서는 transform, opacity 움직임도 따로 돌지 못하고 매 프레임 다시 계산하는 경우가 있어서 끝없는 움직임은 모두 같은 프레임에 모아요
        if (a.playState === 'running' && !a._slow) { a._slow = true; a._t0 = now - (a.currentTime || 0); a._map = !!(tg.closest && tg.closest('#map')); a.pause(); }
        if (a._slow && a.playState === 'paused') keep.push(a);
      }
      rt.slowAnims = keep;
    }
    for (const a of rt.slowAnims || []) { if (noMap && a._map) continue; try { a.currentTime = now - a._t0; } catch (er) { /* 지워진 움직임 */ } }
  }
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
        if (rt.dropT >= iv) { rt.dropT = 0; if (rt.drops.length < CFG.maxDrops && !rt.fest && !rt.sports && !rt.decoEdit && !geo().campus) spawnDrop(); }   // 3.3.1 woodani: 학교 행사와 꾸미기 중에는 도토리가 떨어지지 않아요
      }
      syncKids(false);
      // 보안 보강 판 끊김(2026-11-06 woodani S26 울트라 제보): 학생 걸음, 지도 속 SVG 움직임, 빛 번짐처럼 휴대폰이 화면 전체를 다시 계산하는 일을
      // 같은 프레임에 모아 1초에 30번만 해요(MAP_DIV). 바뀌는 프레임이 반으로 줄어요
      rt.mf = (rt.mf || 0) + 1; rt.kdt = (rt.kdt || 0) + dt;
      const vis = rt.mf % MAP_DIV === 0;
      if (vis) { const noMap = mapHidden(); if (!(rt.sheetAnimTo > now) && !rt.sheetKey && !noMap) updateKids(rt.kdt, now); rt.kdt = 0; slowAnimTick(now, noMap); }   // 3.0.0 건물 창이 올라오는 0.3초 동안은 쉬어요   // 3.2.1 창이 열려 있는 동안 계속 쉬어요(지도 학생은 그 자리에 서 있어요)
      updateDrops(now);
      updateTalk(dt);
      updateBoostWin(dt);
      updateTrial(dt);
      updateVisit(dt);
      updateDeal(dt);
      updateSports(dt);
      updateFest(dt, now);
      tick170(dt);   // 1.7.0 도감, 이벤트
      tick171(dt);   // 1.7.1 방 안을 걷는 친구들
      tick180(dt);   // 1.8.0 숲속 합치기
      tamTick(dt);   // 4.3.0 숲속 탐험대
      nsTick(dt);   // 3.0.0 밤 모습과 야간 자율학습
      if (S.bd && Object.keys(S.bd).length) { conTick(); conRender(false); }   // 2.1.0 공사
      if (S.oak < OAK.max) { S.oak = Math.min(OAK.max, S.oak + dt / OAK.regen); renderOak(); }
      rt.uiT += dt; if (rt.uiT >= 0.1 && vis) { rt.uiT = 0; renderHUD(); }   // 글자 바꾸기도 같은 프레임에
      rt.affT += dt; if (rt.affT >= 0.25 && vis) { rt.affT = 0; renderAffordance(); repTipCheck(); featTipCheck(); if (!cere3.st && finalYear()) cere3Load(); }   // 5.0.2 졸업식 그림은 마지막 학년에 미리 받아 둬요
    }
    requestAnimationFrame(loop);
  }

