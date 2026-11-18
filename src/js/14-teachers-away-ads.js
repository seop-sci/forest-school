  /* ---------- 선생님 ---------- */
  function buildTeacherCards() {
    $('#teacherList').innerHTML = Object.keys(TEA).map(k => `
      <article class="tcard" data-k="${k}">
        <div class="tav"><svg viewBox="-24 -24 48 48" aria-hidden="true">${AV[k]}</svg></div>
        <div>
          <div class="thead"><h3>${TEA[k].name}</h3><span class="chip">${TEA[k].subject}</span><span class="chip qchip">퀘스트</span><span class="chip rchip">추천</span><span class="tlv"></span></div>
          <p class="tdesc">${TEA[k].desc}</p>
          <div class="teff"><span class="k">지금</span><span class="v now"></span><span class="k k-next">연수 후</span><span class="v next"></span></div>
          <p class="tnote" hidden></p>
          <button class="cta split small" type="button" data-k="${k}"><span class="lbl"></span><span class="cost">${acornIcon()}<b></b></span></button>
        </div>
      </article>`).join('') + xtCards(Object.keys(XT).filter(k => XT[k].sub)) + `
      <article class="tcard vp" data-k="vp">
        <div class="tav"><svg viewBox="-24 -24 48 48" aria-hidden="true">${AV.hedgehog}</svg></div>
        <div>
          <div class="thead"><h3>${VP.name}</h3><span class="chip">${VP.subject}</span><span class="tlv"></span></div>
          <p class="tdesc">${VP.desc}</p>
          <div class="teff"><span class="k">지금</span><span class="v now"></span><span class="k k-next">연수 후</span><span class="v next"></span></div>
          <button class="cta split small" type="button" data-k="vp"><span class="lbl"></span><span class="cost">${acornIcon()}<b></b></span></button>
        </div>
      </article>` + xtCards(Object.keys(XT).filter(k => !XT[k].sub));   // 1.7.0 고슴도치 교감 선생님은 기존 선생님 밑에, 1.7.1 새 선생님은 그 밑에(2.3.0 과목 선생님은 교감 위에)
  }
  function xtCards(keys) {
    return keys.map(k => `
      <article class="tcard vp xt" data-k="${k}">
        <div class="tav"><svg viewBox="-24 -24 48 48" aria-hidden="true">${AV[XT[k].av]}</svg></div>
        <div>
          <div class="thead"><h3>${XT[k].name}</h3><span class="chip">${XT[k].subject}</span><span class="tlv"></span></div>
          <p class="tdesc">${XT[k].desc}</p>
          <div class="teff"><span class="k">지금</span><span class="v now"></span><span class="k k-next">연수 후</span><span class="v next"></span></div>
          <p class="tnote" hidden></p>
          <button class="cta split small" type="button" data-k="${k}"><span class="lbl"></span><span class="cost">${XT[k].ess ? ESS_ICON() : acornIcon()}<b></b></span></button>
        </div>
      </article>`).join('');
  }
  function renderVpCard() {
    const card = $('.tcard[data-k="vp"]'); if (!card) return;
    const L = vpLv(), maxed = vpMaxed(), c = vpCost();
    setT($('.tlv', card), `Lv.${L}`);
    setT($('.now', card), VP.eff(L));
    setT($('.next', card), maxed ? '최고 레벨이에요' : VP.eff(L + 1));
    const btn = $('button', card);
    setT($('.lbl', btn), maxed ? '최고 레벨' : '연수 보내기');
    setHid($('.cost', btn), maxed);
    setT($('.cost b', btn), fmt(c));
    setAt(btn, 'aria-disabled', (maxed || S.budget < c) ? 'true' : 'false');
  }
  function profTitles() {   // 4.0.0 카드 이름과 소개 글, 탭 이름을 지금 학교급 호칭으로
    const put = (k, o) => { const c = $(`.tcard[data-k="${k}"]`); if (!c) return; setT($('h3', c), o.name); const d = $('.tdesc', c); if (d) setT(d, o.desc); };
    for (const k of Object.keys(TEA)) put(k, TEA[k]);
    for (const k of Object.keys(XT)) put(k, XT[k]);
    put('vp', VP); { const c = $('.tcard[data-k="vp"]'); if (c) setT($('.chip', c), VP.subject); }
    const nm = uniNow() ? '교직원' : '선생님';   // woodani 결정(2026-11-11): 유치원~고등학교는 선생님, 대학교부터 교직원
    { const t = $('#ttlTeachers span:last-child'); if (t) setT(t, nm); }
    { const t = $('#tabTeaTx'); if (t) setT(t, nm); }
    { const t = $('#qsecVp'); if (t) setT(t, profText('교감 선생님의 안내')); }
    { const t = $('#offTitle'); if (t) setT(t, headText('다녀오셨어요, 교장 선생님!')); }
  }
  function renderXtCards() {
    profTitles();
    for (const k of Object.keys(XT)) {
      const card = $(`.tcard[data-k="${k}"]`); if (!card) continue;
      const X = XT[k], L = xtLv(k), here = xtHere(k), maxed = xtMaxed(k), c = xtCost(k);
      card.classList.toggle('away', !here);
      setT($('.tlv', card), here ? `Lv.${L}` : '아직 안 오셨어요');
      setT($('.now', card), X.eff(L));
      setT($('.next', card), maxed ? '최고 레벨이에요' : X.eff(L + 1));
      setT($('.k-next', card), here ? '연수 후' : '오시면');   // 5.0.1.5 T-11 못 만난 선생님
      const note = $('.tnote', card); setHid(note, here); setT(note, here ? '' : S.tier < (X.tier || 0) ? `${TIERS[X.tier].school}${X.fac === 'store' ? ' 매점' : X.fac === 'dorm' ? ' 기숙사' : X.fac === 'union' ? ' 학생회관' : X.fac === 'institute' ? ' 연구소' : ''}에서 오셔요.` : `${eul(FAC[X.fac].name)} 지으면 학교에 오셔요.`);
      const btn = $('button', card);
      setT($('.lbl', btn), maxed ? '최고 레벨' : '연수 보내기');
      setHid($('.cost', btn), maxed || !here);
      setT($('.cost b', btn), fmt(c));
      setAt(btn, 'aria-disabled', (!here || maxed || xtHave(k) < c) ? 'true' : 'false');
    }
  }
  function xtAct(k, btn) {
    if (rt.paused || !XT[k] || xtMaxed(k)) return false;
    if (!xtHere(k)) { toast(S.tier < (XT[k].tier || 0) ? `${XT[k].name}은 ${TIERS[XT[k].tier].school}에서 오셔요` : `${eul(FAC[XT[k].fac].name)} 지으면 ${XT[k].name}이 오셔요`); if (btn) shake(btn); return false; }
    const c = xtCost(k);
    if (xtHave(k) < c) { toast(XT[k].ess ? essShort(c - xtHave(k)) : acornShort(c - xtHave(k))); if (btn) shake(btn); return false; }
    if (XT[k].ess) { S.ess -= c; S.st.esSpent = (S.st.esSpent || 0) + c; renderEss(); } else S.budget -= c;
    S.xt[k] = xtLv(k) + 1;
    S.st.trains += 1;
    toast(`${XT[k].name} 연수 끝! Lv.${S.xt[k]}, ${XT[k].eff(S.xt[k])}`);
    afterPurchase();
    return true;
  }
  function vpAct(btn) {
    if (rt.paused || vpMaxed()) return false;
    const c = vpCost();
    if (S.budget < c) { if (btn) { shake(btn); toast(acornShort(c - S.budget)); } return false; }
    S.budget -= c;
    S.vp = vpLv() + 1;
    S.st.trains += 1;
    toast(`${VP.name} 연수 끝! Lv.${S.vp}, 학교 행사 상품 +${VP.per * S.vp}%`);
    afterPurchase();
    return true;
  }
  function renderTeachers() {
    for (const k of Object.keys(TEA)) {
      const card = $(`.tcard[data-k="${k}"]`), T = TEA[k], L = S.t[k], maxed = teaMaxed(k), c = teaCost(k);
      card.classList.toggle('away', L < 1);
      setT($('.tlv', card), L < 1 ? '아직 안 오셨어요' : `Lv.${L}`);
      setT($('.now', card), T.eff(L));
      setT($('.k-next', card), L < 1 ? '모시면' : '연수 후');
      setT($('.next', card), maxed ? '최고 레벨이에요' : T.eff(L + 1));
      const note = $('.tnote', card);
      const needPg = k === 'bear' && S.f.playground < 1;
      setHid(note, !needPg);
      setT(note, needPg ? `${eul(FAC.playground.name)} 지어야 효과가 나요.` : '');
      const btn = $('button', card);
      setT($('.lbl', btn), maxed ? '최고 레벨' : (L < 1 ? '모셔 오기' : '연수 보내기'));
      setHid($('.cost', btn), maxed);
      setT($('.cost b', btn), fmt(c));
      setAt(btn, 'aria-disabled', (maxed || S.budget < c) ? 'true' : 'false');
    }
    renderVpCard(); renderXtCards();
  }
  function teacherAct(k, btn, price) {
    if (rt.paused || teaMaxed(k)) return false;
    const c = price || teaCost(k);
    if (S.budget < c) { if (btn) { shake(btn); toast(acornShort(c - S.budget)); } return false; }
    const was = S.t[k];
    S.budget -= c;
    S.t[k] = was + 1;
    if (was >= 1) S.st.trains += 1;
    if (k === 'owl' && !S.u.boost) {
      S.u.boost = true;
      rt.boostUntil = Date.now() + BOOSTW.life * 1000;   // 처음 한 번은 바로 보여 줘요
      toast(profText('부엉이 선생님이 오셔서 보충수업이 열렸어요! 가끔 지도 왼쪽 위에 나타나요'));
    } else toast(was < 1 ? `${TEA[k].name}이 오셨어요!` : `${TEA[k].name} 연수 끝! Lv.${S.t[k]}`);
    afterPurchase();
    return true;
  }

  /* ---------- 구매 뒤 처리와 학교 등급 ---------- */
  function afterPurchase() {
    rt.recAt = 0;
    sfx('buy'); buzz(10);
    checkGrade();
    renderMap(); renderHUD(); renderAffordance();
    save();
  }
  function checkGrade() {
    const g = gradeOf(rep());
    if (g <= S.grade) return;
    const first = g > S.best;
    S.grade = g;
    S.best = Math.max(S.best, g);
    renderTown(true);
    const reward = Math.round(rate() * 60);
    S.budget += reward; earn(reward);
    if (first) {
      // 처음 오른 등급만 상장을 줘요. 종업식 뒤 다시 오를 때는 알림만
      S.certNo += 1;
      const no = S.certNo;
      queueModal(() => showCertificate(g, reward, no));
    } else {
      toast(`다시 ${CFG.grades[g].title}가 되었어요! 축하 도토리 +${fmt(reward)}`);
      sfx('done');
      ringBell();
    }
  }
  function showCertificate(g, reward, no) {
    const gr = CFG.grades[g];
    $('#certNo').textContent = `제 ${new Date().getFullYear()}-${no} 호`;
    const need = townRep(g);
    $('#certTo').textContent = tierInfo().school;
    $('#certGrade').textContent = gr.title;
    $('#certBody').textContent = `위 학교는 평판 ★${need}${numEul(need)} 모아 ${gr.line} 이 상장을 주어 「${gr.title}」로 인정합니다.`;
    $('#certDate').textContent = fmtDate(new Date());
    $('#certReward').textContent = '+' + fmt(reward);
    openModal($('#mGrade'));
    sfx('bell');
    ringBell();
    return true;
  }

  /* ---------- 자리 비운 동안 ---------- */
  /* 2.0.0 보안 점검(1-8, 2-5): 켤 때의 자리 비운 시간은 서버 시간으로 재요.
     서버 시간을 받을 수 있는 판은 서버 시간이 올 때까지 기다렸다가 계산하고(못 받고 끄면 S.away에 남겨 다음에 이어요),
     켠 뒤 놀던 시간(skip)은 빼요. 받지 않은 보상이 있어도 그 뒤 흐른 시간을 버리지 않아요 */
  function awayStart() {
    const from = S.away && S.away.from > 0 ? S.away.from : S.savedAt;
    if (!timeSrc()) { awayApply((gameNow() - from) / 1000); return; }
    rt.awayWait = { from, skip: (S.away && S.away.skip) || 0, perf: (document.hidden || rt.paused) ? null : perfNow() };
    if (serverTimeOk()) awaySettle();
  }
  // 2.0.0 Codex 검토(6): 켠 뒤 논 시간(skip)은 화면이 보이고 학교가 열려 있는 동안만 세요. 앱을 내리거나 학교를 닫으면 멈췄다가, 다시 열면 이어 세요
  function awaySkip(w) { return w.skip + (w.perf == null ? 0 : perfNow() - w.perf); }
  function awayHold(stop) {
    const w = rt.awayWait;
    if (!w) return;
    if (stop) { w.skip = awaySkip(w); w.perf = null; }
    else if (w.perf == null) w.perf = perfNow();
  }
  function awaySettle() {
    const w = rt.awayWait;
    if (!w || !S || !serverTimeOk()) return;
    rt.awayWait = null; S.away = { from: 0, skip: 0 };
    awayApply((gameNow() - w.from - awaySkip(w)) / 1000);
  }
  function awayApply(sec) {
    applyAway(sec);
    if (S.pending > 0 && !(sec >= CFG.awayModalSec)) queueModal(showOffline);   // 짧게 비웠어도 받지 않은 보상은 보여 줘요
  }
  function applyAway(sec) {
    if (!(sec > 0)) return;
    S.oak = Math.min(OAK.max, S.oak + sec / OAK.regen);
    S.students = Math.min(capacity(), S.students + CFG.enroll * sec);
    if (sec < CFG.awayModalSec) { const g = rate() * sec; S.budget += g; earn(g); return; }
    const ov = nsOverlap(gameNow() - sec * 1000, gameNow());   // 3.0.0 야간 자율학습을 켠 밤과 겹친 시간
    const used = Math.min(sec, Math.max(0, (offlineCapH() + (ov > 0 ? nsExtraH() : 0)) * 3600 - S.pendingSec));   // 2.0.0 보안 점검(1-3): 받지 않은 보상과 합쳐 상한까지만
    const nsUsed = Math.min(used, ov), base = rate() * offlineEff();
    S.pending += base * (used + nsUsed * nsBonus());
    if (nsUsed > 0) { S.ns.got += base * nsUsed * (1 + nsBonus()); S.ns.sec += nsUsed; rt.nsAway = true; S.st.nsAway = (S.st.nsAway || 0) + 1; }
    S.pendingSec += sec;
    if (sec < CFG.awayQuietSec && S.pendingSec === sec && !rt.nsAway && rt.modalOpen !== $('#mOffline')) { const v = S.pending; grantOffline(1); toast(`자리 비운 ${fmtDur(sec)} 동안 도토리 +${fmt(v)}`); return; }   // 5.0.1.7 F-14
    save();
    if (rt.modalOpen === $('#mOffline')) fillOffline();
    else queueModal(showOffline);
  }
  function fillOffline() {
    const pct = Math.round(offlineEff() * 100);
    $('#offTime').textContent = fmtDur(S.pendingSec);
    $('#offAmount').textContent = fmt(S.pending);
    let fine = S.t.owl > 0
      ? profText(`부엉이 선생님이 밤에도 수업해서 수업료의 ${pct}%가 쌓였어요.`)
      : `자리 비운 동안은 수업료의 ${pct}%가 쌓여요.`;
    if (S.pendingSec > offlineCapH() * 3600) fine += ` 도토리는 최대 ${offlineCapH()}시간까지 쌓여요.`;
    if (rt.nsAway) fine += ` 야간 자율학습으로 ${hm(nsExtraH() * 3600)} 더 쌓였어요.`;   // 3.0.0
    $('#offFine').textContent = fine;
    renderAdPick('#offPick', '도토리 +100%'); $('#offDouble').textContent = adPickNow() === 'acorn' ? '광고 보고 +100%' : '광고 보고 함께 받기';   // 4.2.0
  }
  function showOffline() {
    if (!(S.pending > 0)) return false;
    fillOffline();
    openModal($('#mOffline'));
    return true;
  }
  function grantOffline(mult) {
    const v = S.pending * mult;
    S.budget += v; earn(v);
    if (v > 0) S.st.claims += 1;
    S.pending = 0; S.pendingSec = 0; rt.nsAway = false;
    floatText(180, 40, '+' + fmt(v), 'gold');
    sfx('coin'); buzz(15);
    save();
    renderHUD(); renderAffordance();
  }
  function claimOffline() { grantOffline(1); closeModal($('#mOffline')); }
  // 광고를 끝까지 보면 2배, 중간에 닫으면 기본 보상만
  function claimOfflineDouble() {
    const pk = adPickNow();   // 4.2.0 고등학교부터: 두 배 대신 공사 단축이나 숲의 정수를 함께 받을 수 있어요
    closeModal($('#mOffline'), () => showAd(
      () => { if (pk === 'acorn') { grantOffline(2); toast('+100%로 받았어요!'); } else { grantOffline(1); toast('광고 보상! ' + adPickGive(pk)); } },
      r => {   // 2026-11-11: 광고가 아직 준비 안 됐으면 보상을 주지 않고 창을 다시 열어요(2배 기회를 잃지 않게). 보상은 S.pending에 그대로 있어요
        if (r === 'noad') { setTimeout(() => { if (S.pending > 0 && !rt.modalOpen) showOffline(); }, 350); return; }
        grantOffline(1); toast('광고를 끝까지 보지 않아서 기본 보상만 받았어요'); }
    ));
  }

  /* ---------- 테스트 광고 ---------- */
  // 진짜 미니앱에서는 앱인토스 SDK의 보상형 광고로 바꿔요. 보상은 userEarnedReward 신호를 받았을 때만 줘요
  const AD_GUARD_MS = 180000;
  function showAd(onReward, onSkip) {
    if (rt.adOpen) return;
    const EXT = AIT && AIT.ads ? AIT : ADS_EXT;   // 토스 광고나 안드로이드 애드몹 광고
    if (EXT) {
      // 토스 리워드 광고: 끝까지 봤다는 신호(userEarnedReward)가 왔을 때만 보상을 줘요
      // 1.6.0: 광고가 아직 없으면 알려 주고, 광고를 못 봤을 때의 처리(onSkip)를 '광고 없음'으로 불러요. 기본 보상이나 버튼이 사라지지 않게요
      if (!EXT.adReady()) { EXT.preload(); rt.adNoGold = false; toast('광고를 불러오지 못했어요. 잠시 뒤에 다시 눌러 주세요' + adErrText(EXT)); if (onSkip) onSkip('noad'); return; }
      rt.adOpen = true;
      if (actx && actx.state === 'running') actx.suspend().catch(() => {});   // 광고 중에는 게임 소리를 멈춰요
      // 4.0.1 (3.3.2 분석): 광고가 끝났다는 신호가 3분 동안 안 오면 풀어 줘요(광고 단추가 영영 막히지 않게). 늦게 온 신호는 받지 않아요
      const tok = rt.adTok = (rt.adTok || 0) + 1;
      clearTimeout(rt.adGuard);
      rt.adGuard = setTimeout(() => {
        if (!rt.adOpen || rt.adTok !== tok) return;
        rt.adTok += 1; rt.adOpen = false; rt.adOk = rt.adNo = null; rt.adNoGold = false;
        ensureAudio(); musicSync();
        toast('광고가 끝났다는 신호를 받지 못했어요\n잠시 뒤에 다시 눌러 주세요');
        if (onSkip) onSkip('noad');
      }, (window.__FOREST_TEST && window.__AD_GUARD_MS) || AD_GUARD_MS);
      EXT.showAd(r => { if (rt.adTok !== tok) return; clearTimeout(rt.adGuard); rt.adOk = onReward; rt.adNo = onSkip || null; rt.adEarned = !!(r && r.earned); closeAd(); });
      return;
    }
    // 4.0.1 woodani 결정(2026-11-11): 토스 판에서 광고를 쓸 수 없으면 시험 광고 창 대신 알림만 띄워요(보상 없음)
    if (AIT) { rt.adNoGold = false; toast('지금은 광고를 볼 수 없어요\n잠시 뒤에 다시 눌러 주세요'); if (onSkip) onSkip('noad'); return; }
    rt.adOpen = true; rt.adOk = onReward; rt.adNo = onSkip || null; rt.adEarned = false;
    let left = BOOST.adSec;
    $('#adCount').textContent = left;
    $('#adFill').style.transition = 'none'; $('#adFill').style.width = '0%';
    void $('#adFill').offsetWidth; $('#adFill').style.transition = '';
    $('#adDone').hidden = true; $('#adSkip').hidden = false;
    $('#mAd').hidden = false;
    if (actx && actx.state === 'running') actx.suspend().catch(() => {});   // 광고 중에는 게임 소리를 멈춰요
    requestAnimationFrame(() => { $('#adFill').style.width = (100 / BOOST.adSec) + '%'; });
    clearInterval(rt.adTimer);
    rt.adTimer = setInterval(() => {
      left -= 1;
      $('#adCount').textContent = Math.max(0, left);
      $('#adFill').style.width = Math.min(100, (BOOST.adSec - left + 1) / BOOST.adSec * 100) + '%';
      if (left <= 0) {
        clearInterval(rt.adTimer);
        rt.adEarned = true;
        $('#adSkip').hidden = true; $('#adDone').hidden = false;
        $('#adDone').focus({ preventScroll: true });
      }
    }, 1000);
    $('#adSkip').focus({ preventScroll: true });
  }
  function closeAd() {
    clearInterval(rt.adTimer);
    $('#mAd').hidden = true;
    rt.adOpen = false;
    ensureAudio(); musicSync();
    const ok = rt.adOk, no = rt.adNo, earned = rt.adEarned, noGold = rt.adNoGold;
    rt.adOk = rt.adNo = null; rt.adNoGold = false;
    if (earned) { S.st.ads += 1; adxDay(); S.adx.all = Math.min(10000, (S.adx.all || 0) + 1); if (!noGold) adGold(); adStamp(); if (ok) ok(); }   // 5.0.1 오늘 본 광고 수(관리자 지표)
    else if (no) no();
    else toast('광고를 끝까지 보지 않아서 보상이 없어요');
  }

  /* 부엉이 선생님 보충수업: 광고 1편에 수업료 30분치(2.3.1, 그전 10분치), 하루 5번 */
  const boostShown = () => S.u.boost && boostLeft() > 0 && (Date.now() < rt.boostUntil || rt.modalOpen === $('#mBoost'));
  function updateBoostWin(dt) {
    if (!S.u.boost || boostLeft() <= 0 || Date.now() < rt.boostUntil) return;
    if (festBusy()) return;
    rt.boostT = Math.max(0, rt.boostT - dt);   // 5.0.1.2 다른 탭에 있어도 기다리는 시간이 줄어요(예전에는 홈에 있어야만 줄었어요). 나오는 것은 홈에서만
    if (rt.boostT > 0 || rt.tab !== 'school' || rt.modalOpen) return;
    rt.boostT = rand(BOOSTW.gap[0], BOOSTW.gap[1]);
    rt.boostUntil = Date.now() + BOOSTW.life * 1000;
    renderBoostBtn();
  }
  function renderBoostBtn() {
    const b = $('#btnBoost');
    b.hidden = !boostShown();
    if (b.hidden) return;
    const sec = Math.max(0, Math.ceil((rt.boostUntil - Date.now()) / 1000)), t = clock(sec);
    if (b.dataset.t !== t) { b.dataset.t = t; $('#boostN').textContent = t; b.setAttribute('aria-label', `부엉이 선생님 보충수업, ${t} 남았어요`); }
  }
  function openBoost() {
    if (rt.paused || rt.modalOpen) return;
    const left = boostLeft();
    $('#boostAmt').textContent = fmt(boostAmount());
    $('#boostLeft').textContent = left > 0 ? `오늘 남은 보충수업 ${left}번` : '오늘 보충수업을 모두 들었어요. 내일 다시 열려요.';
    const go = $('#boostGo');
    go.textContent = left > 0 ? '광고 보고 받기' : '내일 다시 열려요';
    go.setAttribute('aria-disabled', left > 0 ? 'false' : 'true');
    boostPickSync();
    sfx('tap');
    openModal($('#mBoost'));
  }
  function boostPickSync() {   // 4.2.0 고등학교부터 보상 고르기
    renderAdPick('#boostPick', '도토리 받기');
    const a = adPickNow() === 'acorn';
    $('#boostAmtBox').hidden = !a;
    $('#boostLead').textContent = a ? '광고를 끝까지 보면 도토리를 바로 받아요.' : '광고를 끝까지 보면 고른 보상을 바로 받아요.';
  }
  function startBoost() {
    if (boostLeft() <= 0) { shake($('#boostGo')); return; }
    const keep = rt.boostUntil;
    rt.boostUntil = 0;   // 한 번 들으면 버튼이 들어가고 다음에 다시 나타나요
    const pk = adPickNow();
    closeModal($('#mBoost'), () => showAd(() => {
      const v = boostAmount();   // 광고를 다 본 순간의 수업료로 계산해요
      const today = gameToday();
      if (dayRoll(S.ad, today)) { S.ad.n = 0; }
      S.ad.n += 1;
      if (pk !== 'acorn') { const tx = adPickGive(pk); sfx('quest'); buzz(15); toast(`보충수업 끝! ${tx}`); save(); renderHUD(); renderAffordance(); return; }   // 4.2.0
      S.budget += v; earn(v);
      floatText(180, 40, '+' + fmt(v), 'gold');
      sfx('quest'); buzz(15);
      toast(`보충수업 끝! 도토리 +${fmt(v)}`);
      save(); renderHUD(); renderAffordance();
    }, r => {
      if (r === 'noad') { rt.boostUntil = keep; renderBoostBtn(); }   // 1.6.0: 광고가 없었으면 부엉이 버튼을 그대로 둬요
      else toast('광고를 끝까지 보지 않아서 보상이 없어요');
    }));
  }

  /* ---------- 까치 핫딜 ---------- */
  // 까치가 숲속 장터 소식을 물어 와요. 지금 살 듯 말 듯한 것을 반값에, 아니면 특식 데이나 종업식 단체 사진을 줘요
  function makeDeal() {
    if (canGraduate() && !S.hd.album && Math.random() < 0.4) return { type: 'album' };
    const cands = [];
    const worth = c => c / 2 >= rate() * DEAL.minSave;
    for (const k of facKeys()) { if (!furReady(k)) continue; const c = facCost(k); if (S.budget < c && S.budget >= c / 2 && worth(c)) cands.push({ type: 'fac', k, c }); }
    for (const k of Object.keys(TEA)) {
      if (teaMaxed(k)) continue;
      const c = teaCost(k);
      if (c > 0 && S.budget < c && S.budget >= c / 2 && worth(c)) cands.push({ type: 'tea', k, c });
    }
    const q = curMain();
    const want = q && !mainReady() ? cands.find(d => (q.t === 'fac' && d.type === 'fac' && d.k === q.k) ||
      (q.t === 'students' && d.type === 'fac' && d.k === 'classroom') || (q.t === 'tea' && d.type === 'tea' && d.k === q.k)) : null;
    if (want) return want;
    if (cands.length) return cands.sort((a, b) => b.c - a.c)[0];
    if (!feastOn()) return { type: 'feast' };
    return null;
  }
  // 소식이 나온 뒤에 이미 최고 레벨이 되었거나 종업식을 열었으면 그 핫딜은 쓸 수 없어요
  function dealValid(d) {
    if (!d) return false;
    if (d.type === 'fac') return facKeys().includes(d.k) && !facMaxed(d.k) && furReady(d.k);
    if (d.type === 'tea') return !teaMaxed(d.k) && teaCost(d.k) > 0;
    if (d.type === 'album') return canGraduate() && !S.hd.album;
    return true;
  }
  function updateDeal(dt) {
    if (rt.deal) { if ((Date.now() > rt.deal.exp || (festBusy() && rt.modalOpen !== $('#mDeal'))) && !rt.adOpen && !rt.deal.taken) expireDeal(); return; }
    if (!dealUnlocked() || dealLeft() <= 0 || festBusy()) return;   // 학교 행사 중에는 까치가 오지 않아요
    rt.dealT = Math.max(0, rt.dealT - dt);   // 5.0.1.2 다른 탭에 있어도 기다리는 시간이 줄어요. 까치는 홈에 돌아오면 와요
    if (rt.dealT > 0 || rt.tab !== 'school') return;
    if (!spawnDeal()) rt.dealT = DEAL.retry;
  }
  function spawnDeal() {
    const d = makeDeal();
    if (!d) return false;
    d.exp = Date.now() + DEAL.life * 1000;
    rt.deal = d;
    rt.dealT = rand(DEAL.gap[0], DEAL.gap[1]);
    dexMeet('g_magpie');   // 1.7.0 도감 특별 손님
    if (!S.hd.seen) { S.hd.seen = true; toast('까치가 소식을 물어 왔어요!\n지도 오른쪽 아래 까치를 눌러 보세요'); save(); }
    sfx('magpie');
    renderDeal();
    return true;
  }
  function expireDeal() {
    rt.deal = null;
    if (rt.modalOpen === $('#mDeal')) { closeModal($('#mDeal')); toast('까치가 날아갔어요. 다음 소식을 기다려요'); }
    renderDeal();
  }
  const clock = sec => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  function renderDeal() {
    const b = $('#btnDeal'), d = rt.deal;
    if (b.hidden !== !d) { setHid(b, !d); chipRow(); }   // 3.2.6 바뀐 때만, 3.3.4 아래 줄 맞추기
    if (d) {
      const t = clock(Math.max(0, Math.ceil((d.exp - Date.now()) / 1000)));
      if (b.dataset.t !== t) { b.dataset.t = t; $('#dealTime').textContent = t; b.setAttribute('aria-label', `까치 핫딜, ${t} 남았어요`); }
      if (rt.modalOpen === $('#mDeal')) $('#dealClock').textContent = t;
    }
    const on = feastOn();
    setHid($('#feastChip'), !on);
    if (on) setTx($('#feastTime'), clock(Math.ceil((S.hd.feastUntil - gameNow()) / 1000)));
    const au = autoOn();
    setHid($('#autoChip'), !au);
    if (au) setTx($('#autoTime'), clock(Math.ceil((S.autoUntil - gameNow()) / 1000)));
  }
  function openDeal() {
    if (rt.paused || rt.modalOpen || !rt.deal) return;
    if (!dealValid(rt.deal)) { rt.deal = null; rt.dealT = DEAL.retry; renderDeal(); toast('까치가 다른 소식을 찾으러 갔어요'); return; }
    fillDeal();
    sfx('magpie');
    openModal($('#mDeal'));
  }
  function fillDeal() {
    const d = rt.deal;
    let title, text, price = null, gain = '', go = '광고 보고 반값';
    if (d.type === 'fac') {
      const L = S.f[d.k], F = FAC[d.k];
      title = L >= 1 ? `${F.name} 공사비 반값` : `${F.name} 짓기 반값`;
      const line = d.k === 'playground' && S.tier >= 1 ? '장터에 체육 용품 반짝 세일이 열렸대요!' : DEAL_LINE[d.k];
      text = `${line} ${L >= 1 ? `Lv.${L + 1} 공사를` : '짓는 공사를'} 반값에 해 드려요.`;
      price = facCost(d.k);
    } else if (d.type === 'tea') {
      const L = S.t[d.k], T = TEA[d.k];
      title = L >= 1 ? `${T.name} 연수비 반값` : `${T.name} 모셔 오기 반값`;
      text = L >= 1 ? `${DEAL_LINE.teaUp} Lv.${L + 1} 연수를 반값에 보내 드려요.` : `${DEAL_LINE.teaNew} ${T.name}을 반값에 모셔 올 수 있어요.`;
      price = teaCost(d.k);
    } else if (d.type === 'feast') {
      title = '급식실 특식 데이';
      text = '장터에 싱싱한 도토리가 잔뜩 들어왔대요! 특식을 먹은 학생들이 신이 나서 수업료가 늘어요.';
      gain = `${feastMins()}분 동안 수업료 +100%`; go = '광고 보고 받기';
    } else {
      title = '종업식 단체 사진';
      text = '사진사 까치가 이번 종업식 단체 사진을 찍어 준대요! 멋진 사진이 생기면 수료증이 늘어요.';
      gain = '이번 종업식 수료증 +50%'; go = '광고 보고 받기';
    }
    $('#dealTitle').textContent = title;
    $('#dealText').textContent = text;
    $('#dealPrice').hidden = price === null;
    $('#dealGain').hidden = price !== null;
    if (price !== null) { $('#dealWas').textContent = fmt(price); $('#dealNow').textContent = fmt(Math.ceil(price / 2)); }
    else $('#dealGain').textContent = gain;
    $('#dealGo').textContent = go;
    $('#dealFine').textContent = `오늘 남은 핫딜 ${dealLeft()}번이에요. 광고를 끝까지 보면 받아요.`;
    $('#dealArt').innerHTML = `<svg viewBox="-24 -24 48 48" aria-hidden="true">${guestArt('magpie')}</svg>`;
    renderDeal();
  }
  function acceptDeal() {
    const d = rt.deal;
    if (!d || !dealValid(d)) { closeModal($('#mDeal')); rt.deal = null; renderDeal(); return; }
    if (dealLeft() <= 0) { shake($('#dealGo')); return; }
    if (d.type === 'fac' || d.type === 'tea') {
      const half = Math.ceil((d.type === 'fac' ? facCost(d.k) : teaCost(d.k)) / 2);
      if (S.budget < half) { shake($('#dealGo')); $('#dealFine').textContent = `반값이어도 도토리 ${fmt(Math.ceil(half - S.budget))}개가 모자라요.`; return; }
    }
    d.taken = true;   // 광고를 보는 동안에는 까치가 날아가지 않아요
    closeModal($('#mDeal'), () => showAd(() => applyDeal(d), r => {
      d.taken = false;
      if (r !== 'noad') toast('광고를 끝까지 보지 않아서 핫딜을 못 받았어요');
      renderDeal();
    }));
  }
  // 광고를 끝까지 봤을 때만 불려요 (진짜 미니앱에서는 userEarnedReward 신호)
  function applyDeal(d) {
    if (rt.deal === d) rt.deal = null;
    if (!dealValid(d)) { renderDeal(); toast('까치가 다른 소식을 찾으러 갔어요'); return; }
    const today = gameToday();
    if (dayRoll(S.hd, today)) { S.hd.n = 0; }
    S.hd.n += 1;
    if (d.type === 'fac' || d.type === 'tea') {
      const isFac = d.type === 'fac';
      const full = isFac ? facCost(d.k) : teaCost(d.k), half = Math.ceil(full / 2);
      const ok = isFac ? buyFacility(d.k, half) : teacherAct(d.k, null, half);
      if (!ok) { S.hd.n -= 1; save(); renderDeal(); toast('도토리가 모자라서 핫딜을 쓰지 못했어요. 횟수는 그대로예요'); return; }
      // 산 건물이나 오신 선생님 위로 아낀 도토리가 떠올라요
      const T = geo().tea || {}, tq = (d.k === 'owl' && !(S.f.library > 0) ? T.owlAway : T[d.k]) || geo().plaza;
      const bp = bpos(d.k) || [geo().plaza[0], geo().plaza[1], 0];   // 4.0.0 다른 구역 건물이면 광장 위에 띄워요
      const tp = isFac ? [bp[0], bp[1] - bp[2] * 0.3] : [tq[0], tq[1] - 20];
      setTimeout(() => floatText(tp[0], tp[1], `반값! ${fmt(full - half)} 아낌`, 'gold'), 250);
    } else if (d.type === 'feast') {
      S.hd.feastUntil = Math.max(gameNow(), S.hd.feastUntil) + feastMins() * 60000;
      toast(`특식 데이 시작! ${feastMins()}분 동안 수업료 +100%예요`);
      sfx('quest'); buzz(15);
    } else {
      S.hd.album = true;
      toast('사진사 까치가 기다려요! 이번 종업식 수료증 +50%예요');
      sfx('quest'); buzz(15);
    }
    save(); renderDeal(); renderHUD(); renderAffordance();
    if (rt.tab === 'grad') renderGradPanel(true);
  }

