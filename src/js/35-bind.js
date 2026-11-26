  /* ---------- 이벤트 ---------- */
  function wire() {   // 단추와 창 연결. 차례가 듣는 이 순서를 정하니 바꾸지 않아요
    wireArt();
    wireHomeLeft();
    wireTam();
    wireAdsAtt();
    wireGrad();
    wireUnits();
    wireRank();
    wireMissions();
    wireDeco();
    wireClubView();
    wireStreet();
    wireCloudAcct();
    wireWindow();
    wireDev();
    wireCampus();
    wireDevTools();
    wireBuildings();
    wireCommon();
    wireStudy();
    wireSchoolLife();
    wireSnackFest();
    wireCare();
    wireQuests();
    wireSettings();
    wireExitBack();
    wireAppLife();
  }
  // 그림 아이콘과 보충수업 그림
  function wireArt() {
    pzWire();
    $$('.plaque').forEach(pq => pq.insertAdjacentHTML('beforeend', '<g class="rec" transform="translate(0 -17)"><rect x="-15" y="-7" width="30" height="13" rx="6.5" class="c-rec"/><text y="3" text-anchor="middle" class="t-rec">추천</text></g>'));
    $$('[data-acorn]').forEach(el => { el.outerHTML = acornIcon(); });
    $$('[data-dip]').forEach(el => { el.outerHTML = dipIcon(); });
    $$('[data-fund]').forEach(el => { el.outerHTML = fundIcon(); });
    const owlFace = `<svg viewBox="-24 -24 48 48" aria-hidden="true"><g transform="translate(0 3) scale(.95)">${AV.owl}</g></svg>`;
    $('#boostIc').innerHTML = owlFace;
    $('#boostArt').innerHTML = IMG('art_boost_night') ? `<img src="${IMG('art_boost_night')}" alt="" style="width:100%;height:100%;object-fit:contain">` : `<svg viewBox="-30 -30 60 60" aria-hidden="true"><circle cx="14" cy="-15" r="8" class="c-moon"/><circle cx="18" cy="-18" r="7" class="c-boardfill"/><g transform="translate(-3 6) scale(.62)">${AV.owl}</g><g transform="translate(16 14) scale(1.1)">${ACORN}</g></svg>`;
  }
  // 홈 왼쪽 단추: 보충수업, 체험학습, 학교 행사, 수학여행, 자리 비운 보상
  function wireHomeLeft() {
    // 테스트 광고, 보충수업, 출석부
    $('#btnBoost').addEventListener('click', openBoost);
    $('#tripIc').innerHTML = IMG('ic_trip') ? `<img src="${IMG('ic_trip')}" alt="" style="width:100%;height:100%;object-fit:contain">` : BUS;
    $('#sportsIc').innerHTML = IMG('ic_ui_school_event') ? `<img src="${IMG('ic_ui_school_event')}" alt="" draggable="false">` : `<svg viewBox="-11 -11 22 22" aria-hidden="true">${FEST_ICON.welcome}</svg>`;   // 홈 UI 정리: 학교 행사 풍선 그림
    $('#btnSports').addEventListener('click', () => { if (!rt.modalOpen) { actPop(false); openFest(); } });
    $('#btnAct').addEventListener('click', e => { e.stopPropagation(); sfx('tap'); actPop($('#actPop').hidden); });
    document.addEventListener('click', e => { if (!$('#actPop').hidden && !e.target.closest('.act-w')) actPop(false); });
    $('#actIc').innerHTML = $('#sportsIc').innerHTML;
    $('#festList').addEventListener('click', e => { const b = e.target.closest('[data-fest]'); if (b) startFest(b.dataset.fest, false); });
    $('#srGet').addEventListener('click', () => closeModal($('#mSportsEnd'), () => claimSports(1)));
    $('#btnTrip').addEventListener('click', () => { if (!rt.modalOpen) { actPop(false); openTrip(); } });
    $('#btnTr2').addEventListener('click', () => { if (!rt.modalOpen) { actPop(false); openTr2(); } });   // 수학여행
    $('#tr2Body').addEventListener('click', e => { const b = e.target.closest('[data-tr2]'); if (!b || b.getAttribute('aria-disabled') === 'true') return; tr2Act(b.dataset.tr2); });
    $('#tripBody').addEventListener('toggle', e => { if (e.target.classList && e.target.classList.contains('tr-souv-d')) rt.trSvOpen = e.target.open; }, true);
    $('#tripBody').addEventListener('click', e => {
      const ticket = e.target.closest('[data-trip-tk]');
      if (ticket) return tripUseTicket(ticket.dataset.tripTk);
      const go = e.target.closest('[data-trip]');
      if (go) return startTrip(go.dataset.trip);
      const id = e.target.closest('button') && e.target.closest('button').id;
      if (id === 'tripAd') tripAd();
      else if (id === 'tripGet') claimTrip(1);
    });
    $('#boostGo').addEventListener('click', startBoost);
    $('#offDouble').addEventListener('click', claimOfflineDouble);
  }
  // 숲속 탐험대
  function wireTam() {
    $('#panelTam').addEventListener('click', tamClick);
    // 탐험 화면의 칸을 누르면 한 줄 설명
    { const tip = (sel, f) => { const el = $(sel); if (el) el.addEventListener('click', e => { e.stopPropagation(); sfx('tap'); tamToast(f()); }); };
      tip('#tmFl', () => `지금 오르는 층이에요. ${TAM.bossEvery}층마다 큰 장난꾸러기가 나와요`);
      tip('#tmReg', () => `지금 지역이에요. ${TAM.regLen}층마다 지역이 바뀌고, 한 바퀴를 돌면 더 센 'n바퀴째'가 돼요`);
      tip('#tmBest', () => tamCapped() ? '이번 학기에 갈 수 있는 끝까지 왔어요. 심화 탐험으로 더 겨룰 수 있어요' : '가장 높이 오른 층과 이번 학기에 갈 수 있는 층이에요');
      tip('#tmPow', () => '탐험대 힘이에요. 대원 레벨, 별, 장비를 올리면 커져요');
      const tw = $('#tmTower'); if (tw) { tw.style.pointerEvents = 'auto'; tw.addEventListener('click', e => { e.stopPropagation(); sfx('tap'); tamToast(`노란 줄은 다음 큰 장난꾸러기까지 남은 층이에요`); }); } }
    // 레벨 단추를 꾹 누르고 있으면 0.4초 뒤부터 계속 올라가요(한 레벨씩, 점점 빠르게). 손을 떼거나 도토리가 모자라면 멈춰요
    { let hold = null;
      const stop = () => { if (!hold) return; clearTimeout(hold.t); if (hold.n) { save(); if (hold.n > 1) tamToast(hold.rec ? `추천 강화 ${hold.n}번` : hold.gear ? `장비 강화 ${hold.n}번` : `${spName(hold.sp)} 레벨 +${hold.n}`); } setTimeout(() => { hold = null; }, 0); };
      // 추천 칸을 꾹 누르면 처음 대원만 계속 올라가고 칸에는 다른 대원이 떠서 레벨이 안 오르는 것처럼 보였어요. 추천 칸은 매번 그때 추천된 대원을 올려요
      // 장비 단추도 꾹 누르면 계속 올라가요. 추천 칸은 매번 그때 추천된 장비를 올려요
      const tickG = () => { if (!hold) return; let [i, k] = hold.gear; if (hold.rec) { const g = tamUpRec().gear; if (!g) { stop(); return; } i = g.i; k = g.k; }
        if (!tamGearBuy(i, k)) { stop(); return; }
        hold.n += 1; tamRestartStat(); sfx('coin'); tamRenderTop(); tamRenderBody();
        hold.t = setTimeout(tickG, Math.max(70, 180 - hold.n * 8)); };
      const tick = () => { if (!hold) return; if (hold.rec) { const R = tamUpRec().mem; if (!R) { stop(); return; } hold.sp = R.sp; } const c = tamLvCost(hold.sp); if (S.budget < c) { stop(); return; }
        S.budget -= c; tamMem(hold.sp).lv += 1; hold.n += 1; tamRestartStat(); sfx('coin'); renderHUD(); tamRenderTop(); tamRenderBody();
        hold.t = setTimeout(tick, Math.max(50, 160 - hold.n * 6)); };
      $('#panelTam').addEventListener('pointerdown', e => { const gb = e.target.closest('[data-tgear]');
        if (gb && gb.getAttribute('aria-disabled') !== 'true') { const [si, k] = gb.dataset.tgear.split(':'); stop(); hold = { gear: [+si, k], rec: !!gb.closest('.tm-rec'), n: 0, t: setTimeout(tickG, 400) }; return; }
        const b = e.target.closest('[data-tlv]'); if (!b || S.budget < tamLvCost(b.dataset.tlv)) return;
        stop(); hold = { sp: b.dataset.tlv, rec: !!b.closest('.tm-rec'), n: 0, t: setTimeout(tick, 400) }; });
      ['pointerup', 'pointercancel', 'blur'].forEach(ev => window.addEventListener(ev, stop));
      $('#panelTam').addEventListener('contextmenu', e => e.preventDefault());   // 탐험 화면 어디든 길게 누르기 메뉴를 막아요(앱은 MainActivity에서도 막아요). 안드로이드 길게 누르기 메뉴를 막아요
      // 꾹 눌러서 올렸으면 손을 뗄 때 나오는 클릭은 버려요
      $('#panelTam').addEventListener('click', e => { if (hold && hold.n && e.target.closest('[data-tlv],[data-tgear]')) { e.stopImmediatePropagation(); e.preventDefault(); } }, true); }
    $('#tmRepOk').addEventListener('click', () => tamRepTake(false)); $('#tmRepAd').addEventListener('click', () => tamRepTake(true));
  }
  // 광고 창과 출석부
  function wireAdsAtt() {
    for (const sel of ['#offPick', '#boostPick']) $(sel).addEventListener('click', e => { const b = e.target.closest('[data-adpk]'); if (!b || b.disabled) return; rt.adPick = b.dataset.adpk; sfx('tap'); adPickSync(); });   // 광고 보상 고르기
    $('#adDone').addEventListener('click', closeAd);
    $('#adSkip').addEventListener('click', closeAd);
    $('#btnAtt').addEventListener('click', openAtt);
    $('#attGo').addEventListener('click', stampAtt);
  }
  // 졸업 탭: 종업식, 졸업식, 명예 교장실, 장학재단
  function wireGrad() {
    // 졸업식과 명예 교장실
    $('#gBtn').addEventListener('click', askGraduate);
    $('#gNo').addEventListener('click', () => { $('#gConfirm').hidden = true; });
    $('#gYes').addEventListener('click', graduate);
    $('#perkList').addEventListener('click', e => {
      const b = e.target.closest('button[data-perk]');
      if (b) buyPerk(b.dataset.perk, b);
    });
    $('#gradOk').addEventListener('click', () => { sfx('tap'); closeModal($('#mGrad')); setTab('school'); });
    $('#fundList').addEventListener('click', e => {
      const b = e.target.closest('button[data-fperk]');
      if (b) buyFundPerk(b.dataset.fperk, b);
    });
  }
  // 설정의 화면 크기와 숫자 단위
  function wireUnits() {
    $('#optUiz').addEventListener('click', e => { const b = e.target.closest('[data-uiz]'); if (!b || +b.dataset.uiz === S.uiz) return; S.uiz = +b.dataset.uiz; save(); syncSettingsUI(); sfx('tap'); setTimeout(() => { try { chipRow(); wxPlace(); } catch (er) { /* 다음 틱에 */ } }, 60); toast(S.uiz ? '화면 글자와 단추를 크게 보여 줘요' : '화면을 보통 크기로 보여 줘요'); });
    $('#optUnits').addEventListener('click', e => {
      const b = e.target.closest('[data-units]');
      if (!b || b.dataset.units === S.units) return;
      S.units = b.dataset.units; save(); syncSettingsUI(); refreshNumbers();
      toast(S.units === 'en' ? '큰 숫자를 K, M, B로 줄여 써요' : '큰 숫자를 만, 억, 조로 줄여 써요');
    });
  }
  // 랭킹과 참가
  function wireRank() {
    $('#rankView').addEventListener('click', e => { const b = e.target.closest('[data-rv]'); if (!b) return; rt.rankView = b.dataset.rv === 'week' ? (rt.rkLg || 'week') : b.dataset.rv === 'all' ? (rt.rkSch || 'all') : b.dataset.rv; sfx('tap'); renderRankPanel(); });
    $('#rankSchSeg').addEventListener('click', e => { const b = e.target.closest('[data-rsc]'); if (!b) return; rt.rankView = rt.rkSch = b.dataset.rsc === 'conf' ? 'conf' : 'all'; sfx('tap'); renderRankPanel(); });   // 학교 안의 학교 파워와 학회
    $('#rankLgSeg').addEventListener('click', e => { const b = e.target.closest('[data-rlg]'); if (!b) return; rt.rankView = rt.rkLg = b.dataset.rlg === 'sea' ? 'sea' : 'week'; sfx('tap'); renderRankPanel(); });   // 리그 안의 이번 주와 시즌
    $('#rankTamSeg').addEventListener('click', e => { const b = e.target.closest('[data-rth]'); if (!b) return; rt.rkH = b.dataset.rth === '1' ? 1 : 0; sfx('tap'); renderRankPanel(); });
    $('#rankLook').addEventListener('click', e => { const b = e.target.closest('[data-look]'); if (b) openLook(b.dataset.look); });   // 예시 학교
    $('#rankLook').addEventListener('change', e => { if (e.target.id === 'lookOn') lookSet(e.target.checked); });
    $('#rankList').addEventListener('click', e => { const d = e.target.closest('.rk-del'); if (d) { e.stopPropagation(); rankAdminDel(d.dataset.del); return; } const li = e.target.closest('li[data-look]'); if (li) openLook(li.dataset.look, li.dataset.who); });   // 순위 줄을 누르면 그 학교 구경
    $('#rankJoin').addEventListener('click', e => {
      const b = e.target.closest('[data-rank]');
      if (!b || b.tagName === 'FORM') return;
      if (b.dataset.rank === 'edit') { rt.rankEdit = true; renderRankPanel(); const i = $('#rankName'); if (i) i.focus(); }
      else if (b.dataset.rank === 'leave') leaveRank();
      else if (b.dataset.rank === 'dice') rollNick($('#rankName'));
      else if (b.dataset.rank === 'cancel') { rt.rankEdit = false; renderRankPanel(); }
      else if (b.dataset.rank === 'retry') retryCloud();
      else if (b.dataset.rank === 'toss' && AIT) AIT.openBoard();
    });
    $('#rankJoin').addEventListener('submit', e => {
      e.preventDefault();
      const i = $('#rankName');
      joinRank(i ? i.value : '');
    });
    $('#nickDice').addEventListener('click', () => rollNick($('#nickName')));
  }
  // 미션 바로 가기, 퀘스트 탭 일과, 이름 정하기
  function wireMissions() {
    // 미션을 누르면 그 일을 하는 곳으로(퀘스트 탭, 패스, 이벤트 탭 모두)
    document.addEventListener('click', e => { const g = e.target.closest('[data-mgo]'); if (g && !e.target.closest('button')) missionGo(g.dataset.mgo); });
    document.addEventListener('keydown', e => { if (e.key !== 'Enter' && e.key !== ' ') return; const g = e.target.closest && e.target.closest('[data-mgo]'); if (g) { e.preventDefault(); missionGo(g.dataset.mgo); } });
    $('#qDaily').addEventListener('click', e => {
      if (e.target.closest('[data-claim-all]')) { claimAllNow(); return; }   // 모두 받기
      if (e.target.closest('[data-td-fold]')) { if (S.fold) { S.fold.td = S.fold.td ? 0 : 1; sfx('tap'); save(); renderMissions(); } return; }
      { const t = e.target.closest('[data-todo]'); if (t) { todoGo(t.dataset.todo); return; } }
      const x = e.target.closest('[data-box]'); if (x) { if (boxReady(+x.dataset.box)) claimBox(+x.dataset.box); else toast(`미션 포인트 ${MP_BOX[+x.dataset.box].at}점이면 열 수 있어요`); return; }
      const w = e.target.closest('[data-wm]'); if (w) { claimWeekMission(+w.dataset.wm); return; }
      const sw = e.target.closest('[data-dmswap]'); if (sw) { swapDaily(+sw.dataset.dmswap); return; }
      const b = e.target.closest('[data-dm]'); if (!b) return; if (b.dataset.dm === 'bonus') claimBonus(); else claimMission(+b.dataset.dm);
    });
    $('#nickForm').addEventListener('submit', async e => {
      e.preventDefault();
      const btn = $('#nickOk');
      if (btn.disabled) return;
      btn.disabled = true;
      const ok = await joinRank($('#nickName').value);
      btn.disabled = false;
      if (ok) closeModal($('#mNick'));
    });
  }
  // 꾸미기 가게와 꾸미기 모드
  function wireDeco() {
    // 황금 도토리 상점
    // 꾸미기 가게와 꾸미기 모드
    $('#decoList').addEventListener('click', e => { const b = e.target.closest('[data-dbuy]'); if (b) pickDeco(b.dataset.dbuy); });
    $('#decoNo').addEventListener('click', () => { rt.decoPick = ''; renderDecoShop(); });
    $('#decoYes').addEventListener('click', buyDeco);
    $('#decoBerry').addEventListener('click', buyDecoBerry);
    $('#decoPieces').addEventListener('click', buyDecoPieces);
    $('#decoPlace').addEventListener('click', decoEditStart);
    $('#decoNameForm').addEventListener('submit', e => { e.preventDefault(); const v = cleanSchoolNm($('#decoName').value); if (!v) { shake($('#decoName')); return; } $('#decoName').blur(); setSchoolNm(v); });
    $('#markRows').addEventListener('click', e => { const b = e.target.closest('[data-mk]'); if (!b) return; const [g, i] = b.dataset.mk.split(':').map(Number); sfx('tap'); rt.mkDraft[g] = i; renderMarkEdit(); });
    $('#markSave').addEventListener('click', () => { sfx('quest'); setMark(rt.mkDraft); toast('학교 마크를 바꿨어요. 위쪽 학교 카드에 보여요'); });
    $('#markOff').addEventListener('click', () => { sfx('tap'); setMark(null); toast('학교 카드를 교실 그림으로 되돌렸어요'); });
    $('#vdTop').addEventListener('click', e => { if (!rt.decoEdit && !festBusy() && e.target.closest('[data-vd]')) { e.stopPropagation(); openVd(); } });
    $('#bxG').addEventListener('click', e => { const x = !rt.decoEdit && e.target.closest('[data-bx]'); if (x) { e.stopPropagation(); bxTap(Number(x.dataset.bx)); } });   // 생물 탐사(#bxG)
    $('#decoG').addEventListener('click', e => { if (!rt.decoEdit && !festBusy() && e.target.closest('[data-vd]')) { e.stopPropagation(); openVd(); return; } const r = e.target.closest('[data-slot]'); if (!r || !rt.decoEdit) return; e.stopPropagation(); openDecoPick(+r.dataset.slot); });   // 생물 탐사(data-bx)
    $('#decoDone').addEventListener('click', () => { sfx('tap'); decoEditEnd(); toast('학교 꾸미기를 마쳤어요'); });
    $('#decoPickList').addEventListener('click', e => { const b = e.target.closest('[data-dput]'); if (!b) return; if (decoPut(rt.decoSlot, b.dataset.dput)) { sfx('quest'); achSync(); closeModal($('#mDecoPick')); } });
    $('#decoPickClear').addEventListener('click', () => { decoPut(rt.decoSlot, ''); sfx('tap'); closeModal($('#mDecoPick')); });
  }
  // 동아리, 날씨, 학교급 모습 보기, 전학 대화
  function wireClubView() {
    // 동아리, 학교급 모습 보기, 전학 대화
    $('#clubAutoBtn').addEventListener('click', () => { if (clubAuto()) { sfx('quest'); toast('능력치에 맞게 동아리를 나눴어요'); questChanged(); } });
    $('#cgBox').addEventListener('click', e => { if (e.target.closest('[data-cg="prac"]')) cgPractice(); });   // 대항전 '모두 연습'은 #cgBox 안에 있어요(#clubBody 밖이라 눌러도 반응이 없었어요)
    $('#clubBody').addEventListener('click', e => {
      if (e.target.closest('[data-cg="prac"]')) { cgPractice(); return; }   // 동아리 대항전
      const seat = e.target.closest('[data-seat]'), show = e.target.closest('[data-show]'), row = e.target.closest('.rs-row[data-ri]');
      if (show) { const c = +show.dataset.show; if (show.getAttribute('aria-disabled') === 'true') { shake(show); toast(!showReadyC(c) ? `발표회는 월~금 하루에 한 번이고, 못 연 날은 주말에 ${CLUB.weekend}번까지 보충해요. ${showNote()}` : '부원이 있어야 발표회를 열 수 있어요'); return; } clubShowGo(c); return; }
      if (seat) { openSeatPick(+seat.dataset.seat); sfx('tap'); return; }
      if (row) { openClubPick(+row.dataset.ri); sfx('tap'); }
    });
    $('#seatList').addEventListener('click', e => {
      const p = e.target.closest('[data-pick]'), pc = e.target.closest('[data-pickc]');
      if (p && rt.seatClub != null) clubSet(+p.dataset.pick, rt.seatClub);
      else if (pc && rt.seatStudent != null) clubSet(rt.seatStudent, +pc.dataset.pickc);
      else return;
      sfx('buy'); closeModal($('#mSeat')); renderClub(); questChanged();
    });
    $('#seatOut').addEventListener('click', () => { if (rt.seatStudent != null) clubSet(rt.seatStudent, -1); closeModal($('#mSeat')); renderClub(); questChanged(); });
    $('#tierDots').addEventListener('click', e => { if (e.target.closest('[data-nl]')) { nlCycle(); return; } const b = e.target.closest('[data-td]'); if (!b) return; const t = +b.dataset.td; if (t > S.tier) { shake(b); toast(`${eun(TIER_ALL[t])} 아직 갈 수 없어요`); return; } if (t === S.tier) tierViewClose(); else tierViewOpen(t); });
    $('#tvBack').addEventListener('click', () => { sfx('tap'); tierViewClose(); });
    $('#wxChip').addEventListener('click', () => { const k = wxOf(); if (!k) return; sfx('tap'); S.wxOff = S.wxOff ? 0 : 1; save(); renderWeather();   // 날씨, 날씨 효과 켜고 끄기
      wxTipShow(`${WX[k].tip}`, S.wxOff ? '날씨 그림을 껐어요. 다시 누르면 켜져요(보너스는 그대로)' : '날씨 그림을 켰어요'); });   // 누르면 켜고 끄기 그대로, 설명은 칩 바로 위 말풍선으로
    $('#tvTabs').addEventListener('click', e => { const b = e.target.closest('[data-mt]'); if (!b || !rt.lookData || !rt.lookData.model) return; const t = +b.dataset.mt; if (t === rt.viewTier) return; sfx('tap'); rt.lookData = modelOf(t); rt.viewTier = t; renderTierView(true); renderTierDots(); });
    $('#tvEdit').addEventListener('click', () => { sfx('tap'); rt.viewEdit = !rt.viewEdit; renderTierView(true); if (!rt.viewEdit) save(); });
    $('#tvMap').addEventListener('click', e => { const h = e.target.closest('[data-tvslot]'); if (h && rt.viewEdit) openDecoPick(+h.dataset.tvslot);
      const z = e.target.closest('[data-tvzone]'); if (z && z.dataset.tvzone) { sfx('tap'); rt.viewZone = z.dataset.tvzone; rt.viewEdit = false; renderTierView(true); } });
    $('#tvCampus').addEventListener('click', () => { sfx('tap'); rt.viewZone = ''; rt.viewEdit = false; renderTierView(true); });
    $('#mTalk').addEventListener('click', () => talkNext());
  }
  // 상점 거리와 꾸미기 백화점, 문방구
  function wireStreet() {
    $('#btnShop').addEventListener('click', () => { if (!rt.paused && !rt.modalOpen) { sfx('tap'); openShop(); } });
    $('#thPrevBack').addEventListener('click', () => { sfx('tap'); thPreviewEnd(false); });
    $('#thPrevBuy').addEventListener('click', () => { const id = rt.thPrev && rt.thPrev.id; sfx('tap'); thPreviewEnd(false); if (id) { rt.thOpen = id; pickShop('s:' + id); } });   // 사기 전 확인 줄로
    $('#shopList').addEventListener('click', e => {
      const ap = e.target.closest('[data-apply]');
      if (ap) {
        const t = ap.dataset.apply, own = TH_SLOTS.filter(([sl]) => thOwn(t, sl));
        if (own.every(([sl]) => S.cos.th[sl] === t)) { own.forEach(([sl]) => { S.cos.th[sl] = ''; }); toast('원래 모습으로 돌렸어요'); }
        else { own.forEach(([sl]) => { S.cos.th[sl] = t; }); toast(`${THEME[t].name} 테마로 한 번에 바꿨어요`); }
        sfx('tap'); applyCos(); save(); renderShop();
        return;
      }
      const tf = e.target.closest('[data-thfold]');   // 테마 세트 펼치기
      if (tf) { rt.thOpen = rt.thOpen === tf.dataset.thfold ? '' : tf.dataset.thfold; sfx('tap'); renderShop(); return; }
      const pv = e.target.closest('[data-thprev]');
      if (pv) { thPreview(pv.dataset.thprev); return; }
      const p = e.target.closest('[data-play]');
      if (p) {
        Music.preview = Music.preview === p.dataset.play ? '' : p.dataset.play;
        ensureAudio(true); musicSync(); renderShop();
        if (Music.preview && !S.bgm) toast('미리 듣기만 나와요. 배경음악은 설정에서 켤 수 있어요');
        return;
      }
      const b = e.target.closest('[data-buy]'); if (b) pickShop(b.dataset.buy);
    });
    $('#shopNo').addEventListener('click', () => { rt.shopPick = ''; renderShop(); });
    $('#essList').addEventListener('click', e => { const b = e.target.closest('[data-ebuy]'); if (b) pickEss(b.dataset.ebuy); });
    $('#essNo').addEventListener('click', () => { rt.essPick = ''; renderEssShop(); });
    $('#essYes').addEventListener('click', buyEss);
    $('#shopYes').addEventListener('click', buyShop);
    $('#shopAd').addEventListener('click', shopAd);
  }
  // 서버 저장, 구글 계정, 예전 학교 되돌리기
  function wireCloudAcct() {
    // 서버 저장: 구글 계정 연결, 테스트 현황
    $('#optAcct').addEventListener('click', () => { sfx('tap'); if (googleUser()) { const m = $('#acctMenu'); m.hidden = !m.hidden; rt.acctOutArm = false; $('#acctOut').textContent = '로그아웃'; } else linkGoogle(); });   // 연결돼 있으면 바꾸기와 로그아웃
    $('#acctMenuNo').addEventListener('click', () => { $('#acctMenu').hidden = true; });
    $('#acctSwitch').addEventListener('click', () => { sfx('tap'); switchGoogle(); });
    $('#acctOut').addEventListener('click', () => {
      sfx('tap');
      if (!rt.acctOutArm) { rt.acctOutArm = true; $('#acctOut').textContent = '한 번 더 누르면 로그아웃'; toast('로그아웃하면 이 기기에서는 새 학교로 시작해요. 학교는 구글 계정에 남아요'); return; }
      logoutGoogle();
    });
    $('#pickKeep').addEventListener('click', pickKeepLocal);   // 저장 안전 장치
    $('#pickLoad').addEventListener('click', pickLoadSrv);
    $('#optBak').addEventListener('click', () => { sfx('tap'); rt.bakArm = -1; openBak(); });
    $('#bakList').addEventListener('click', e => { const b = e.target.closest('[data-bak]'); if (b) bakRestore(Number(b.dataset.bak)); });
    $('#acctLoad').addEventListener('click', () => { const a = rt.acctPick; if (a) { bakAdd(a.local, '고르지 않은 이 폰 학교'); adoptSave(a.d, '구글 계정의 학교를 불러왔어요'); } });   // 이 폰 학교도 예전 학교 되돌리기에 남겨요(안내 글과 같게)
    $('#acctKeep').addEventListener('click', () => { const a = rt.acctPick; if (a) { bakAdd(a.d, '고르지 않은 계정 학교'); adoptSave(a.local, '이 폰의 학교를 구글 계정에 저장했어요'); } });   // 계정 학교도 남겨요
    $('#devStats').addEventListener('click', openStats);
    $('#statsReload').addEventListener('click', loadStats);
    $('#statsDel').addEventListener('click', deleteStats);
  }
  // 창 크기와 글꼴, 다음 건물, 서브 퀘스트, 핫딜, 학교급 확인, 졸업식 장면
  function wireWindow() {
    window.addEventListener('online', () => { if (Cloud.state === 'error' && (Cloud.err === 'net' || Cloud.err === 'load' || Cloud.err === 'acct')) retryCloud(); });
    window.addEventListener('resize', refit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { rt.fitGen += 1; refit(); }).catch(() => {});
    const nextTap = () => { const G = geo().next; if (!G) return; toast(`${eun(G.name)} ${G.tag}`); sfx('tap'); };
    $('#b-next').addEventListener('click', () => { if (!rt.trial) nextTap(); });
    $('#b-next').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nextTap(); } });
    $('#oak').addEventListener('click', tapOak);
    $('#oak').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tapOak(); } });
    $('#subBar').addEventListener('click', e => { const b = e.target.closest('[data-sub]'); if (b) tapSub(b.dataset.sub, b); });
    $('#btnDeal').addEventListener('click', openDeal);
    $('#dealIc').innerHTML = `<svg viewBox="-24 -24 48 48" aria-hidden="true">${guestArt('magpie')}</svg>`;
    $('#dealGo').addEventListener('click', acceptDeal);
    $('#devDeal').addEventListener('click', () => {
      S.u.dev = true;   // 보안 점검: 개발자 메뉴로 부른 것도 표시해요
      if (!dealUnlocked()) { toast('까치 핫딜은 1장 퀘스트를 마치면 열려요'); return; }
      if (dealLeft() <= 0) { S.hd.day = ''; S.hd.n = 0; }
      rt.deal = null;
      setTab('school');
      if (spawnDeal()) toast('까치를 불렀어요 (테스트)');
      else { rt.dealT = DEAL.retry; renderDeal(); toast('지금은 까치 소식이 없어요\n특식 데이가 끝나면 다시 불러 보세요'); }
    });
    $('#tierBtn').addEventListener('click', askPromote);
    $('#tierNo').addEventListener('click', () => { $('#tierConfirm').hidden = true; });
    $('#tierYes').addEventListener('click', promote);
    $('#tierOk').addEventListener('click', () => { sfx('tap'); closeModal($('#mTier')); setTab('school'); });
    $('#mCere').addEventListener('click', e => { if (!e.target.closest('#cereAsk')) cereAsk(); });   // 졸업식 장면을 누르면 건너뛸지 물어요
    $('#cereKeep').addEventListener('click', () => { sfx('tap'); cereKeep(); });
    $('#cereGo').addEventListener('click', () => { sfx('tap'); cereEnd(true); });
  }
  // 개발자 메뉴와 화면 고치기 모드
  function wireDev() {
    $('#devTier').addEventListener('click', () => {
      S.u.dev = true;
      if (!nextTierOpen()) { toast(`${TIERS[S.tier + 1].name}는 아직 준비 중이에요`); return; }
      for (let y = S.tg; y < tierInfo().grads; y++) {   // 건너뛴 해도 종업식과 전학생을 세요
        S.st.grads += 1;
        if (S.p.species < ncMax()) S.p.species += 1; else S.p.ticket = (S.p.ticket || 0) + 1;
      }
      S.tg = Math.max(S.tg, tierInfo().grads); S.sem = 1;
      S.tdip = Math.max(S.tdip, 40);
      while (gradeOf(rep()) < GRAD_MIN) S.f.library += 1;   // 평판이 대도시에 닿을 때까지 도서관을 키워요
      { const gi = promoteGateIdx(); if (gi >= 0 && S.q.m < gi) { S.q.m = gi; S.q.lat = ''; startMain(); } }   // 졸업식 퀘스트 앞의 메인 퀘스트도 모두 마친 것으로
      checkGrade();
      setTab('grad'); renderMap(); renderHUD(); renderAffordance(); save();
      toast('졸업 조건을 채웠어요 (테스트). 위쪽 졸업 단추의 졸업식을 눌러 보세요');
    });

    // 숨긴 개발자 메뉴: 정보의 '버전' 줄을 빠르게 다섯 번 누르면 열려요
    let verTaps = 0, verAt = 0;
    $('#verRow').addEventListener('click', () => {
      const now = Date.now();
      verTaps = now - verAt < 1500 ? verTaps + 1 : 1;
      verAt = now;
      if (AIT || window.FOREST_STORE) { if (verTaps >= 5) { verTaps = 0; fpsToggle(); } return; }   // 토스 판과 구글 플레이 판에는 개발자 메뉴를 열지 않고, 다섯 번 누르면 초당 장수 보기만 켜고 꺼요
      if (verTaps >= 5 && $('#devBox').hidden) { $('#devBox').hidden = false; toast('개발자 테스트 메뉴가 열렸어요'); devLuxShow(); }
    });
    // 화면 고치기 모드 (관리자 계정으로 웹판에서만. 앱에서는 단추가 안 보여요)
    //   글: 화면의 글을 누르면 고치는 칸이 떠요. 자리: 생물 자리(빨간 점)나 단추, 지도 그림을 끌어요.
    // 고친 것은 그 자리에서만 보이고(새로 고치면 사라져요) 목록에 쌓여요. 목록을 복사해 본부(Claude)에 붙이면 원본에 넣어요
    //   게임 저장(forest-school-v1)은 건드리지 않아요. 목록은 이 기기의 forest-edit-v1에만 남아요.
    const ED = { on: false, mode: 'view', list: [], bar: null, box: null, dots: [], timer: 0, drag: null };
    const edKey = 'forest-edit-v1', edUI = el => !!(el && el.closest && el.closest('.ed-bar,.ed-box,.ed-dot'));
    const edLoad = () => { try { const L = JSON.parse(localStorage.getItem(edKey) || '[]'); if (Array.isArray(L)) ED.list = L.filter(x => x && typeof x === 'object').slice(0, 300); } catch (e) { ED.list = []; } };
    const edSave = () => { try { localStorage.setItem(edKey, JSON.stringify(ED.list)); } catch (e) { /* 이번만 */ } edBar(); };
    // 어디 화면인지와 요소를 사람이 읽을 수 있게: "홈 > #homeQuest .q-how"
    function edWhere() {
      const m = rt.modalOpen; if (m) { const h = m.querySelector('h2,h3'); return `창 #${m.id}${h ? ' (' + h.textContent.trim().slice(0, 16) + ')' : ''}`; }
      const nm = { school: '홈', teachers: '선생님', tam: '탐험', mini: '공부', street: '상점', quests: '퀘스트', grad: '졸업', rank: '랭킹', dex: '도감', event: '이벤트', settings: '설정' };
      const z = rt.tab === 'school' ? ' 지도 ' + decoMap() + '번' : '';
      return (nm[rt.tab] || rt.tab || '화면') + z;
    }
    function edPath(el) {
      const parts = [];
      for (let e = el, n = 0; e && e.nodeType === 1 && e !== document.body && n < 4; e = e.parentNode, n++) {
        const d = Object.keys(e.dataset || {}).filter(k => !/^(ed|cm)/.test(k)).slice(0, 1).map(k => `[data-${k.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}="${e.dataset[k]}"]`).join('');
        const c = (typeof e.className === 'string' ? e.className : (e.className && e.className.baseVal) || '').split(/\s+/).filter(x => x && !/^(ed-|open$|on$|show$)/.test(x)).slice(0, 2).map(x => '.' + x).join('');
        if (e.id) { parts.unshift('#' + e.id); break; }
        parts.unshift(e.tagName.toLowerCase() + c + d);
      }
      return parts.join(' > ');
    }
    function edBar() {
      if (!ED.bar) {
        ED.bar = document.createElement('div'); ED.bar.className = 'ed-bar';
        ED.bar.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const k = b.dataset.ed;
          if (k === 'list') edList(); else if (k === 'off') edOff(); else if (k === 'pos') ED.bar.classList.toggle('low'); else { ED.mode = k; edBox(null); edDots(); edBar(); } });
        document.body.appendChild(ED.bar);
      }
      const B = (k, t) => `<button type="button" data-ed="${k}" aria-pressed="${ED.mode === k}">${t}</button>`;
      ED.bar.innerHTML = B('view', '보기') + B('text', '글') + B('move', '자리') + `<button type="button" class="ed-n" data-ed="list">목록 ${ED.list.length}</button><button type="button" data-ed="pos">↕</button><button type="button" data-ed="off">끄기</button>`;
    }
    function edBox(html) {
      if (ED.box) { ED.box.remove(); ED.box = null; }
      if (!html) return null;
      ED.box = document.createElement('div'); ED.box.className = 'ed-box'; ED.box.innerHTML = html; document.body.appendChild(ED.box); return ED.box;
    }
    const edEsc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    // ---- 글 고치기: 누른 자리의 글 조각(텍스트 노드)을 찾아요
    function edTextAt(x, y, target) {
      let node = null;
      try { const r = document.caretRangeFromPoint ? document.caretRangeFromPoint(x, y) : null; if (r && r.startContainer && r.startContainer.nodeType === 3) node = r.startContainer;
        else if (document.caretPositionFromPoint) { const c = document.caretPositionFromPoint(x, y); if (c && c.offsetNode && c.offsetNode.nodeType === 3) node = c.offsetNode; } } catch (e) { /* 아래에서 찾아요 */ }
      if (node && !node.nodeValue.trim()) node = null;
      if (node && target && !target.contains(node) && !node.parentNode.contains(target)) node = null;
      if (!node && target) { const w = document.createTreeWalker(target, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (n.nodeValue.trim()) { node = n; break; } }
      return node;
    }
    function edEditText(node) {
      const el = node.parentNode, old = node.nodeValue, prev = ED.list.find(x => x.k === 'text' && x.b === old.trim() && x.p === edPath(el));
      el.classList.add('ed-pick');
      const box = edBox(`<h4>글 고치기 <small style="font-weight:400;color:#6B7280">${edEsc(edWhere())}</small></h4><p class="ed-old">${edEsc(prev ? prev.a : old.trim())}</p><textarea></textarea><div class="ed-row"><button type="button" data-x="no">취소</button><button type="button" class="ok" data-x="ok">고치기</button></div>`);
      const ta = box.querySelector('textarea'); ta.value = old.trim(); setTimeout(() => { try { ta.focus(); } catch (e) { /* 괜찮아요 */ } }, 30);
      box.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; el.classList.remove('ed-pick');
        if (b.dataset.x === 'ok') { const v = ta.value.trim();
          if (v && v !== old.trim()) {
            if (prev) { prev.b = v; if (prev.a === v) ED.list.splice(ED.list.indexOf(prev), 1); }
            else ED.list.push({ k: 'text', w: edWhere(), p: edPath(el), a: old.trim(), b: v });
            node.nodeValue = old.replace(old.trim(), v); edSave(); } }
        edBox(null); });
    }
    // ---- 자리 옮기기
    function edPickMove(t) {
      // 너무 큰 덩어리(화면 너비의 70% 넘는 것)는 고르지 않아요. id나 data 속성이 있는 가장 가까운 것을 골라요
      const fit = e => { const r = e.getBoundingClientRect(); return r.width <= innerWidth * 0.7 && r.height <= innerHeight * 0.5; };
      let best = t;
      const btn = t.closest && t.closest('button,a,[role="button"],li'); if (btn && fit(btn)) return btn;   // 단추 안의 그림을 눌러도 단추째로 옮겨요
      for (let e = t, n = 0; e && e !== document.body && n < 6; e = e.parentNode, n++) {
        if (e.nodeType !== 1 || /^(svg|html|body)$/i.test(e.tagName) || !fit(e)) break;
        best = e; if (e.id || Object.keys(e.dataset || {}).length) break;
      }
      return best;
    }
    function edMoveRec(el, dx, dy) {
      const p = edPath(el), svg = !!(el.ownerSVGElement), w = edWhere(); let rec = ED.list.find(x => x.k === 'move' && x.p === p && x.w === w);
      if (!rec) { rec = { k: 'move', w, p, dx: 0, dy: 0, u: svg ? '지도 칸' : 'px', t: (el.textContent || '').trim().slice(0, 14) }; ED.list.push(rec); }
      rec.dx = Math.round((rec.dx + dx) * 10) / 10; rec.dy = Math.round((rec.dy + dy) * 10) / 10;
      if (!rec.dx && !rec.dy) ED.list.splice(ED.list.indexOf(rec), 1);
      edSave();
    }
    // 생물 자리(BX_SPOT): 지금 지도의 여섯 자리를 빨간 점으로 보여 주고 끌 수 있게
    function edDots() {
      ED.dots.forEach(d => d.remove()); ED.dots = [];
      if (!ED.on || ED.mode !== 'move' || rt.tab !== 'school' || rt.modalOpen) return;
      const L = typeof bxSpots === 'function' ? bxSpots() : null, svg = $('#map'); if (!L || !svg) return;
      const m = decoMap(), ctm = svg.getScreenCTM(); if (!ctm) return;
      L.forEach((q, i) => {
        const rec = ED.list.find(x => x.k === 'bx' && x.m === m && x.i === i), cur = rec ? rec.b : [q[0], q[1]], v = pctXY(cur);
        const d = document.createElement('div'); d.className = 'ed-dot' + (rec ? ' moved' : ''); d.textContent = i + 1; d.dataset.i = i;
        d.style.left = (ctm.a * v[0] + ctm.e) + 'px'; d.style.top = (ctm.d * v[1] + ctm.f) + 'px';
        document.body.appendChild(d); ED.dots.push(d);
      });
    }
    function edDotDrop(d, x, y) {
      const svg = $('#map'), ctm = svg.getScreenCTM(), m = decoMap(), i = +d.dataset.i, q = bxSpots()[i];
      const vx = (x - ctm.e) / ctm.a, vy = (y - ctm.f) / ctm.d, b = [Math.round(vx / MAP_W * 100), Math.round((vy - MAP_Y) / MAP_H * 100)];
      let rec = ED.list.find(r => r.k === 'bx' && r.m === m && r.i === i);
      if (!rec) { rec = { k: 'bx', w: edWhere(), m, i, a: [q[0], q[1]], b }; ED.list.push(rec); } else rec.b = b;
      if (rec.a[0] === b[0] && rec.a[1] === b[1]) ED.list.splice(ED.list.indexOf(rec), 1);
      edSave(); edDots();
    }
    // ---- 누르기 가로채기: 글과 자리 모드에서는 게임 단추가 눌리지 않아요(보기 모드에서 화면을 옮겨 다녀요)
    function edDown(e) {
      if (!ED.on || ED.mode === 'view' || edUI(e.target) && !e.target.classList.contains('ed-dot')) return;
      e.preventDefault(); e.stopPropagation();
      if (ED.mode === 'text') { const n = edTextAt(e.clientX, e.clientY, e.target); if (n) edEditText(n); return; }
      const dot = e.target.classList.contains('ed-dot') ? e.target : null, el = dot || edPickMove(e.target);
      const svg = !dot && el.ownerSVGElement, ctm = svg ? svg.getScreenCTM() : null;
      ED.drag = { el, dot, x0: e.clientX, y0: e.clientY, sx: ctm ? ctm.a : 1, sy: ctm ? ctm.d : 1, base: dot ? '' : (svg ? el.getAttribute('transform') || '' : el.style.transform || ''), svg: !!svg, dx: 0, dy: 0 };
      if (!dot) el.classList.add('ed-pick');
    }
    function edMove(e) {
      const g = ED.drag; if (!g) return; e.preventDefault(); e.stopPropagation();
      g.dx = e.clientX - g.x0; g.dy = e.clientY - g.y0;
      if (g.dot) { g.dot.style.left = e.clientX + 'px'; g.dot.style.top = e.clientY + 'px'; }
      else if (g.svg) g.el.setAttribute('transform', `${g.base} translate(${(g.dx / g.sx).toFixed(1)} ${(g.dy / g.sy).toFixed(1)})`.trim());
      else g.el.style.transform = `${g.base} translate(${g.dx}px, ${g.dy}px)`.trim();
    }
    function edUp(e) {
      const g = ED.drag; if (!g) return; ED.drag = null; e.preventDefault(); e.stopPropagation();
      if (g.dot) { edDotDrop(g.dot, e.clientX, e.clientY); return; }
      g.el.classList.remove('ed-pick');
      if (Math.abs(g.dx) + Math.abs(g.dy) < 3) { if (g.svg) { if (g.base) g.el.setAttribute('transform', g.base); else g.el.removeAttribute('transform'); } else g.el.style.transform = g.base; return; }
      edMoveRec(g.el, g.svg ? g.dx / g.sx : g.dx, g.svg ? g.dy / g.sy : g.dy);
    }
    const edEat = e => { if (ED.on && ED.mode !== 'view' && !edUI(e.target)) { e.preventDefault(); e.stopPropagation(); } };
    // ---- 목록
    function edLine(x) {
      if (x.k === 'text') return `글 [${x.w} / ${x.p}] "${x.a}" → "${x.b}"`;
      if (x.k === 'bx') return `생물 자리 [${x.w} / 지도 ${x.m}번 ${x.i + 1}째] ${x.a.join(', ')} → ${x.b.join(', ')}`;
      return `자리 [${x.w} / ${x.p}${x.t ? ' "' + x.t + '"' : ''}] 오른쪽 ${x.dx >= 0 ? '+' : ''}${x.dx}${x.u}, 아래 ${x.dy >= 0 ? '+' : ''}${x.dy}${x.u}`;
    }
    const edText = () => `[숲속 동물 학교 고치기 목록] 버전 ${VERSION}, 화면 ${innerWidth}x${innerHeight}\n` + ED.list.map((x, i) => `${i + 1}. ${edLine(x)}`).join('\n');
    function edList() {
      const box = edBox(`<h4>고친 목록 ${ED.list.length}개</h4>${ED.list.length ? '<ol>' + ED.list.map((x, i) => `<li>${edEsc(edLine(x))} <button type="button" data-del="${i}">✕</button></li>`).join('') + '</ol>' : '<p class="ed-old">아직 고친 것이 없어요. 위 막대에서 글이나 자리를 고르고 화면을 눌러 보세요.</p>'}<div class="ed-row"><button type="button" data-x="no">닫기</button><button type="button" data-x="clear">모두 지우기</button><button type="button" class="ok" data-x="copy">복사</button></div>`);
      box.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.del) { ED.list.splice(+b.dataset.del, 1); edSave(); edList(); edDots(); return; }
        if (b.dataset.x === 'clear') { ED.list = []; edSave(); edList(); edDots(); return; }
        if (b.dataset.x === 'copy') { const t = edText(); const done = () => { b.textContent = '복사했어요'; };
          const fb = () => { const ta = document.createElement('textarea'); ta.value = t; ta.className = 'ed-box'; ta.style.cssText = 'top:8px;bottom:auto;height:40vh'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e2) { /* 손으로 복사 */ } setTimeout(() => ta.remove(), 4000); };
          try { navigator.clipboard.writeText(t).then(done, fb); } catch (e2) { fb(); } return; }
        edBox(null); });
    }
    // 화면이 다시 그려지면 고친 글이 원래대로 돌아가서, 켜 둔 동안에는 같은 글을 찾아 다시 바꿔 보여 줘요
    function edReapply() {
      if (!ED.on) return; const T = ED.list.filter(x => x.k === 'text'); if (T.length && !ED.box) {
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n, c = 0;
        while ((n = w.nextNode()) && c++ < 20000) { const v = n.nodeValue, t = v.trim(); if (!t) continue; const r = T.find(x => x.a === t); if (r && !edUI(n.parentNode)) n.nodeValue = v.replace(t, r.b); } }
      if (!ED.drag) edDots();
    }
    function edOn() {
      if (ED.on) return; ED.on = true; ED.mode = 'view'; edLoad(); edBar();
      for (const ev of ['pointerdown', 'pointermove', 'pointerup']) document.addEventListener(ev, { pointerdown: edDown, pointermove: edMove, pointerup: edUp }[ev], true);
      for (const ev of ['click', 'touchstart', 'mousedown']) document.addEventListener(ev, edEat, { capture: true, passive: false });
      ED.timer = setInterval(edReapply, 700);
      toast('화면 고치기 모드를 켰어요\n보기로 화면을 옮기고, 글이나 자리를 골라 고쳐요');
    }
    function edOff() {
      if (!ED.on) return; ED.on = false; clearInterval(ED.timer); edBox(null); ED.dots.forEach(d => d.remove()); ED.dots = [];
      for (const ev of ['pointerdown', 'pointermove', 'pointerup']) document.removeEventListener(ev, { pointerdown: edDown, pointermove: edMove, pointerup: edUp }[ev], true);
      for (const ev of ['click', 'touchstart', 'mousedown']) document.removeEventListener(ev, edEat, { capture: true });
      if (ED.bar) { ED.bar.remove(); ED.bar = null; }
      toast('화면 고치기 모드를 껐어요\n고친 목록은 남아 있어요');
    }
    $('#devEdit').addEventListener('click', () => { if (ED.on) edOff(); else { if (rt.modalOpen) closeModal(rt.modalOpen); edOn(); } });
    if (window.__FOREST_TEST) window.__forestEd = { ED, edOn, edOff, edText, edList, edDots };
    // 관리자 고급 배경: 관리자 계정(forest/adminUids)에만 단추가 보여요
    async function devLuxShow() {
      const b = $('#devLux'); if (!b) return;
      if (!window.__FOREST_TEST && cloudOn()) { try { await checkAdmin(); } catch (e) { /* 아니면 숨김 */ } }
      b.hidden = !(rt.isAdmin || window.__FOREST_TEST); devLuxText();
      $('#devEdit').hidden = !((rt.isAdmin && window.FS_WEB_LOCK) || window.__FOREST_TEST);   // 화면 고치기 모드는 관리자 계정으로 웹판에서만
    }
    function devLuxText() {
      const n = GEO.filter(G => has170(G.map + '_lux')).length;
      $('#devLux b').textContent = luxOn() ? '고급 배경 끄기 (관리자)' : '고급 배경 켜기 (관리자)';
      $('#devLuxTx').textContent = n ? `이 기기에서만 고급 지도와 건물을 써요. 고급 지도 ${n}장 있어요` : '고급 지도 그림이 아직 없어요(작업지시서 49). 그림이 오면 바로 써요';
    }
    $('#devLux').addEventListener('click', () => {
      rt.lux = !luxOn(); try { localStorage.setItem('forest-lux', rt.lux ? '1' : '0'); } catch (e) { /* 이번만 */ }
      applyThemes(); renderMap(); devLuxText(); toast(rt.lux ? '고급 배경을 켰어요' : '고급 배경을 껐어요');
    });
  }
  // 캠퍼스와 구역 옮기기
  function wireCampus() {
    $('#campusG').addEventListener('click', e => { const el = e.target.closest('.cz'); if (el && !rt.trial) campusTap(el); });
    $('#campusG').addEventListener('keydown', e => { const el = e.target.closest('.cz'); if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); campusTap(el); } });
    $('#zoneHome').addEventListener('click', () => { sfx('tap'); setZone(''); });
    $('#zonePrev').addEventListener('click', () => zoneStep(-1));
    $('#zoneNext').addEventListener('click', () => zoneStep(1));
  }
  // 개발자 메뉴의 시험 단추
  function wireDevTools() {
    $('#devUni').addEventListener('click', () => {
      if (rt.uniPrev) { try { sessionStorage.removeItem('fs-uni-prev'); } catch (e) {} location.reload(); return; }   // 한 번 더 누르면 미리 보기를 끝내고 원래 학교로
      if (uniPreview()) toast('대학교 미리 보기예요. 저장되지 않아요 (테스트)');
    });
    $('#devCash').addEventListener('click', () => {
      S.u.dev = true;
      const v = Math.max(1000, rate() * 3600);
      S.budget += v; earn(v);
      toast(`도토리 +${fmt(v)} (테스트)`);
      renderHUD(); renderAffordance(); save();
    });
    $('#devTrip').addEventListener('click', () => {
      S.u.dev = true;
      if (!tripOpen()) { S.trip.open = true; toast('체험학습을 열었어요 (테스트). 지도 왼쪽 버스를 눌러 보세요'); }
      else if (S.trip.cur) { S.trip.end = gameNow(); toast('체험학습에서 바로 돌아왔어요 (테스트)'); }
      else toast('지금 다녀오는 체험학습이 없어요. 먼저 출발해 보세요');
      rt.tripTxt = ''; renderTripBtn(); save();
    });
    $('#devGold').addEventListener('click', () => {
      S.u.dev = true;
      S.gold += 100;
      renderShopBtn(); save();
      toast(`황금 도토리 +100개 (테스트) 지금 ${fmt(S.gold)}개`);
    });
    $('#devEss').addEventListener('click', () => {
      S.u.dev = true; addEss(500); save();
      toast(`숲의 정수 +500 (테스트) 지금 ${fmt(S.ess)}`);
    });
    $('#devMg').addEventListener('click', () => {
      S.u.dev = true; mgAddEnergy(100); S.mg.up = Math.min(MG.UPCAP, S.mg.up + 10); S.mg.pieces = Math.min(MG.PCAP, S.mg.pieces + 10); save();
      if (typeof renderMiniMg === 'function') renderMiniMg();
      toast(`합치기 에너지 +100, 강화 조각 +10, 장식 조각 +10 (테스트)`);
    });
    $('#devDip').addEventListener('click', () => {
      S.u.dev = true; addDip(100); S.fund += 100; S.p.ticket += 3; save(); renderAffordance();
      toast('수료증 +100, 기금 +100, 친구 성장 쪽지 +3 (테스트)');
    });
    $('#devDay').addEventListener('click', () => {
      S.u.dev = true;
      S.att.last = ''; S.ad.day = ''; S.ad.n = 0; S.hd.day = ''; S.hd.n = 0;
      S.pz.day = ''; S.mg.ad.day = ''; S.mg.bst.day = '';   // 숲속 퍼즐 수학 XP, 합치기 광고와 부스터 횟수도
      toast('다음 날이 된 것처럼 바꿨어요. 출석 도장, 보충수업, 핫딜, 퍼즐 수학 XP, 합치기 부스터가 다시 열려요');
      renderAffordance(); save();
    });
    $('#offArt').innerHTML = IMG('art_offline') ? `<img src="${IMG('art_offline')}" alt="" style="width:100%;height:100%;object-fit:contain">` : `<svg viewBox="-30 -30 60 60" aria-hidden="true"><circle cx="14" cy="-15" r="8" class="c-moon"/><circle cx="18" cy="-18" r="7" class="c-boardfill"/><circle cx="-18" cy="-12" r="1" class="c-moon"/><circle cx="-10" cy="-20" r="0.8" class="c-moon"/><g transform="translate(-3 6) scale(.62)">${AV.owl}</g></svg>`;
  }
  // 건물, 공사 칸, 가구, 선생님 카드
  function wireBuildings() {
    // 건물 이름표는 학생과 선생님 위 층(#plaques)으로 옮겨서 업그레이드 표시가 가려지지 않게 해요. 이름표를 눌러도 건물이 열려요
    $$('.bld').forEach(g => {
      const k = g.getAttribute('data-k'), pq = $('#pq-' + k);
      if (pq) {
        $('#plaques').appendChild(pq);
        pq.addEventListener('click', () => { if (!rt.trial) openSheet(k); });   // 매나 뱀이 들어온 동안에는 건물이 열리지 않아요
        pq.addEventListener('pointerdown', () => g.classList.add('press'));
        ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => pq.addEventListener(ev, () => g.classList.remove('press')));
      }
    });
    $$('.bld').forEach(g => {
      const k = g.getAttribute('data-k');
      g.addEventListener('click', e => { if (!rt.trial) openSheet(bldPick(e, k)); });   // 겹친 자리에서는 그림이 실제로 있는 건물을 골라요
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSheet(k); } });
      g.addEventListener('pointerdown', () => g.classList.add('press'));
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => g.addEventListener(ev, () => g.classList.remove('press')));
    });
    $('#sheetBuy').addEventListener('click', () => {
      const k = rt.sheetKey; if (!k) return;
      if (!furReady(k)) { shake($('#sheetBuy')); toast(`가구 네 개를 모두 ${euro('Lv.' + S.f[k])} 올려 주세요`); return; }
      if (!buyFacility(k)) { shake($('#sheetBuy')); if (!facMaxed(k) && !conOn(k) && S.budget < facCost(k)) toast(acornShort(facCost(k) - S.budget)); }
      renderSheet();
    });
    // 공사 칸: 바로 줄이기는 먼저 조합을 보여 주고 한 번 더 누르면 써요
    $('#conAll').addEventListener('click', () => {
      const k = rt.sheetKey; if (!k || !conOn(k)) return;
      if (!tkPlan(conLeft(k)).n) { shake($('#conAll')); toast(`시간 단축권이 없어요. 광고를 보면 5분권 ${TKAD.n}장을 받아요`); return; }
      sfx('tap');
      if (!rt.conArm) { rt.conArm = true; rt.conPick = ''; conSheet(); return; }
      rt.conArm = false; tkUseAll(k); renderSheet();
    });
    $('#conNo').addEventListener('click', () => { rt.conArm = false; sfx('tap'); conSheet(); });
    $('#conMore').addEventListener('click', () => { rt.conMore = !rt.conMore; sfx('tap'); conSheet(); });   // F-05 다른 방법 펼치기
    // 즉시 완공 단추와 숲의 정수로 즉시 완료
    $('#sheetFree').addEventListener('click', () => {
      const k = rt.sheetKey; if (!k) return;
      if (!furReady(k)) { shake($('#sheetFree')); toast(`가구 네 개를 모두 ${euro('Lv.' + S.f[k])} 올려 주세요`); return; }
      if (S.budget < facCost(k)) { shake($('#sheetFree')); toast('도토리가 모자라요'); return; }
      if (!conFree(k)) shake($('#sheetFree'));
      renderSheet();
    });
    $('#conFree').addEventListener('click', () => { const k = rt.sheetKey; if (!k || !conFree(k)) shake($('#conFree')); renderSheet(); });
    $('#conEss').addEventListener('click', () => { const k = rt.sheetKey; if (k) askConEss(k); });
    $('#cesQuiet').addEventListener('click', () => { const b = $('#cesQuiet'), on = !b.classList.contains('on'); b.classList.toggle('on', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); sfx('tap'); });
    $('#wlGo').addEventListener('click', () => { linkGoogle(); });
    $('#wlCopy').addEventListener('click', () => { const u = Cloud.uid || ''; try { navigator.clipboard.writeText(u).then(() => toast('계정 번호를 복사했어요'), () => toast(u)); } catch (e) { toast(u); } });
    webLockCheck();
    $('#cesGo').addEventListener('click', () => {
      const k = rt.cesK; if ($('#cesQuiet').classList.contains('on')) S.ces = gameToday();
      closeModal($('#mCes')); if (k) conEss(k); if (rt.sheetKey) renderSheet();
    });
    $('#conTks').addEventListener('click', e => {
      const b = e.target.closest('[data-tk]'), k = rt.sheetKey; if (!b || !k || !conOn(k)) return;
      const t = TK.find(x => x.k === b.dataset.tk); rt.conArm = false;
      if (S.tk[t.k] < 1) { shake(b); toast(`${t.name}이 없어요`); return; }
      if (t.sec > conLeft(k) + 59 && rt.conPick !== t.k) { rt.conPick = t.k; conSheet(); toast(`${t.name}은 남은 시간보다 길어서 남는 시간이 없어져요. 한 번 더 누르면 써요`); return; }
      rt.conPick = ''; sfx('tap'); tkUse(k, t.k); renderSheet();
    });
    $('#conAd').addEventListener('click', () => { rt.conArm = false; tkAd(); });
    $$('[data-close-sheet]').forEach(el => el.addEventListener('click', closeSheet));
    $('#furScene').addEventListener('click', furTap);
    $('#furScene').addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('[data-fur]')) { e.preventDefault(); furTap(e); } });
    $('#furList').addEventListener('click', furTap);
    $('#furAll').addEventListener('click', () => { const k = rt.sheetKey; if (k && !buyFurAll(k)) shake($('#furAll')); });
    $('#teacherList').addEventListener('click', e => {
      const b = e.target.closest('button[data-k]');
      if (b) { const k = b.getAttribute('data-k'); if (k === 'vp') vpAct(b); else if (XT[k]) xtAct(k, b); else teacherAct(k, b); }
    });
  }
  // 아래 탭, 창 닫기, 그림 아이콘, 학교 카드, 반장 선거
  function wireCommon() {
    $$('.tab').forEach(b => b.addEventListener('click', () => { setTab(b.dataset.tab); sfx('tap'); }));
    // 창을 닫기만 하는 단추와 바깥 누르기 57곳: 요소에 data-cm="창 id"를 달면 여기서 닫아요. data-cm-tap이 함께 있으면 누르는 소리도 내요
    // (예전에는 단추마다 closeModal만 부르는 연결이 따로 있었어요. 닫으면서 다른 일도 하는 단추는 그대로 따로 연결해요)
    for (const ev of ['pointerdown', 'click', 'keydown']) document.addEventListener(ev, () => { rt.tapT = performance.now(); }, true);   // 방금 누른 것의 대답인지 가려요
    document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-cm]'); if (!b) return; if (b.hasAttribute('data-cm-tap')) sfx('tap'); closeModal($('#' + b.dataset.cm)); });
    document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-go]'); if (b) { setTab(b.dataset.go); sfx('tap'); } });   // 상점 거리와 이벤트 바로 가기(나중에 그린 단추도)
    // 그림 아이콘을 채우고, 아직 열리지 않은 버튼은 알려만 줘요
    $$('[data-ic]').forEach(el => { const u = IMG(el.dataset.ic); if (u) el.style.backgroundImage = `url("${u}")`; });
    $$('.panel-x').forEach(b => b.addEventListener('click', () => { const back = rt.backTab; rt.backTab = ''; sfx('tap'); if (back === 'tam' && rt.tab === 'rank') setTab('tam'); else if (back === 'sn' && rt.tab === 'dex') { setTab('school'); openSn(); } else setTab('school'); }));   // 들어온 곳으로
    setupPan(); requestAnimationFrame(() => fitMap(true));
    // 학교 카드를 누르면 학생, 평판, 학교 파워가 펼쳐져요
    const sc = $('#schoolCard'), board = $('.board');
    const scToggle = on => { board.classList.toggle('open', on); sc.setAttribute('aria-expanded', on ? 'true' : 'false'); sc.setAttribute('aria-label', on ? '학교 현황 접기' : '학교 현황 펼치기'); };
    sc.addEventListener('click', () => { scToggle(!board.classList.contains('open')); sfx('tap'); });
    sc.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sc.click(); } });
    document.addEventListener('pointerdown', e => { if (board.classList.contains('open') && !e.target.closest('.board')) scToggle(false); });

    $$('[data-soon]').forEach(b => b.addEventListener('click', () => { if (!b.dataset.soon) return; toast(b.dataset.soon); sfx('tap'); }));
    $$('.panel p, .sheet p').forEach(nlP);   // 처음부터 적힌 설명 글도 문장마다 줄바꿈
    $('#hdCouncil').addEventListener('click', () => { if (elOpen()) openElect(); });
    $('#hdBoard').addEventListener('click', () => { if (skOpen()) openSticker(); });
    $('#elCands').addEventListener('click', e => { const b = e.target.closest('[data-el]'); if (b) elVote(+b.dataset.el); });
    $('#sheetElect').addEventListener('click', () => viaSheet(openElect));
  }
  // 공부: 실험, 책, 숲속 대결, 시험 기간, 복도, 진로 상담
  function wireStudy() {
    // 공부 2단계: 과학 탐구 실험, 책 읽기
    $('#sheetLab').addEventListener('click', () => { const note = labDone(); closeSheet(); setTimeout(() => { openLab(); if (note && rt.modalOpen === $('#mLab')) { rt.labView = 'note'; renderLab(); } }, 240); });
    $('#sheetRead').addEventListener('click', () => viaSheet(openRead));
    $('#labCard').addEventListener('click', () => { const note = labReady() && labDone(); openLab(); if (note && rt.modalOpen === $('#mLab')) { rt.labView = 'note'; renderLab(); } });
    $('#rdCard').addEventListener('click', openRead);
    // 숲속 대결
    $('#btCard').addEventListener('click', () => { sfx('tap'); btOpenScene(); });
    $('#btBack').addEventListener('click', () => { sfx('tap'); if (btUI.M && btUI.M.phase === 'play') { $('#btQuitAsk').hidden = false; return; } btClose(); });
    $('#btQuitNo').addEventListener('click', () => { sfx('tap'); $('#btQuitAsk').hidden = true; });
    $('#btQuitYes').addEventListener('click', () => { sfx('tap'); $('#btQuitAsk').hidden = true; const M = btUI.M; btClose(); if (M && M.res && M.res.length === 3) { const w = M.res.filter(r => r.win).length; toast(w >= 2 ? `남은 종목까지 겨뤄서 이겼어요 (${w}:${3 - w})` : `남은 종목까지 겨뤄서 졌어요 (${w}:${3 - w})`); } });
    $('#btAuto').addEventListener('click', btAuto);
    $('#btGo').addEventListener('click', () => { if ($('#btGo').getAttribute('aria-disabled') !== 'true') { if (btLeft() <= 0) btAdMore(); else btStart(); } else if (btLeft() > 0) { shake($('#btGo')); toast('세 종목에 학생을 모두 세워 주세요'); } });
    $('#btRows').addEventListener('click', e => { const b = e.target.closest('[data-bslot]'); if (!b || !btUI.M || btUI.M.phase !== 'pick') return; btUI.M.sel = +b.dataset.bslot; sfx('tap'); btRender(); });
    $('#btList').addEventListener('click', e => { const b = e.target.closest('[data-bpick]'); if (b) btPick(b.dataset.bpick); });
    $('#btPlay').addEventListener('pointerdown', btTap);
    $('#btCheer').addEventListener('click', e => { const q = e.target.closest('[data-bq]'), c = e.target.closest('[data-bm]'); if (q) btqAnswer(+q.dataset.bq); else if (c) btqMemTap(+c.dataset.bm); });   // 종목 문제
    $('#btResult').addEventListener('click', e => { if (e.target.closest('#btAgain')) btAgain(); else if (e.target.closest('#btAdMore')) btAdMore(); else if (e.target.closest('#btDone')) { sfx('tap'); btClose(); } });
    // 시험 기간
    $('#sheetExam').addEventListener('click', () => viaSheet(openExam));
    $('#exRowBtn').addEventListener('click', openExam);
    $('#nsRowBtn').addEventListener('click', () => { sfx('tap'); openNs(); });
    $('#exSubj').addEventListener('click', e => { const b = e.target.closest('[data-ex]'); if (b && b.getAttribute('aria-disabled') !== 'true') exStudy(b.dataset.ex); });
    $('#exClaim').addEventListener('click', exClaim);
    $('#hdOffice').addEventListener('click', () => { if (exOpen() && hallOpen()) openExam(); });
    $('#hdCounsel').addEventListener('click', () => { if (S.tier >= CS.tier && hallOpen()) openCounsel(); });
    $('#hdDept').addEventListener('click', () => { if (uniNow() && deptOpen() && hallOpen()) openDept(true); });   // 복도의 학과 사무실
    $('#mCounsel').addEventListener('click', csClick);
    $('#csClose').addEventListener('click', () => { sfx('tap'); closeModal($('#mCounsel')); renderHall(); });
    $('#csBack').addEventListener('click', () => $('#csClose').click());   // 바깥을 눌러도 닫혀요
    $('#labClose').addEventListener('click', () => { if (rt.labBusy) return; sfx('tap'); closeModal($('#mLab')); });
  }
  // 소풍, 스티커판, 앨범, 공사 그림 미리 풀기
  function wireSchoolLife() {
    // 숲속 소풍, 칭찬 스티커판
    $('#sheetPicnic').addEventListener('click', () => viaSheet(openPicnic));
    $('#sheetSticker').addEventListener('click', () => viaSheet(openSticker));
    $('#sheetWaitGo').addEventListener('click', () => { sfx('tap'); closeSheet(); setTab('quests'); setTimeout(() => { const h = $('#qDaily .td-h'); if (h) h.scrollIntoView({ block: 'start', behavior: rt.reduced ? 'auto' : 'smooth' }); }, 80); });   // 5.3.2.1
    $('#pcTickets').addEventListener('click', e => { const b = e.target.closest('[data-picnic-tk]'); if (b) picnicUseTicket(b.dataset.picnicTk); });
    $('#pcKids').addEventListener('click', e => { const b = e.target.closest('[data-pk]'); if (b) pcKidTap(b.dataset.pk); });
    $('#pcLunch').addEventListener('click', () => { if (!rt.pcLunch && S.ess < PCN.lunch) { toast(essShort(PCN.lunch - S.ess)); return; } rt.pcLunch = !rt.pcLunch; sfx('tap'); renderPicnic(); });
    $('#pcGo').addEventListener('click', () => { if ($('#pcGo').getAttribute('aria-disabled') === 'true') { toast(`소풍 갈 친구를 ${PCN.kids}명 골라요`); return; } pcGo(); });
    $('#skSeg').addEventListener('click', e => { const b = e.target.closest('[data-sv]'); if (!b) return; if (b.dataset.sv === 'old' && !S.sk.done.length) { toast('아직 다 채운 판이 없어요'); return; } rt.skView = b.dataset.sv; sfx('tap'); renderSticker(); });
    $('#skPrev').addEventListener('click', () => { rt.skPage -= 1; renderSticker(); });
    $('#skNext').addEventListener('click', () => { rt.skPage += 1; renderSticker(); });
    $('#skPickA').addEventListener('click', () => skPrize('acorn'));
    $('#skPickG').addEventListener('click', () => skPrize('gold'));
    // 학생과 추억
    $('#sheetFriend').addEventListener('click', () => { const sp = $('#sheetFriend').dataset.sp, f = frOf(sp); if (!f) return; if (!frToday(f)) frPat(sp); else toast(`${frFull(sp)}: ${headText(frLine(sp, rt.sheetKey))}`); });
    $('#sheetBday').addEventListener('click', () => { closeSheet(); setTimeout(bdClaim, 240); });
    $('#gAlbum').addEventListener('click', openAlbum);
    // 끊김 줄이기: 공사를 처음 시작할 때 비계, 막대, 비버 그림을 푸느라 한 번 멈추지 않게 켜고 조금 뒤 미리 풀어 둬요
    setTimeout(() => { for (const u of [IMG180('fx_scaffold'), IMG('timer_bar'), IMG('fx_lantern'), FSI('fix_beaver_1'), FSI('fix_beaver_2'), FSI('fix_beaver_3')]) if (u) { const im = new Image(); im.src = u; if (im.decode) im.decode().catch(() => {}); } }, 3000);
    for (const k of Object.keys(FAC)) { const p = document.getElementById('pq-' + k); if (p && !p.querySelector('.ffb')) p.insertAdjacentHTML('beforeend', '<g class="ffb" transform="translate(-38 -20)"><rect x="0" y="-6.5" width="76" height="13" rx="6.5"/><text x="38" y="3" text-anchor="middle">즉시 완공 가능!</text></g>'); }
    $('#decoPickShop').addEventListener('click', () => { sfx('tap'); closeModal($('#mDecoPick'), () => { decoEditEnd(); setTab('deco'); }); });
    $('#upChip').addEventListener('click', () => { sfx('tap'); upAsk(); });
    $('#taChip').addEventListener('click', () => { taClaim(); taRender(false); });
    $('#ffChip').addEventListener('click', e => { if (e.target.closest('.ffx')) { S.ffx = gameToday(); sfx('tap'); ffRender(true); save(); toast('오늘은 이 알림을 닫았어요. 내일 다시 보여요'); return; } const k = ffList()[0]; if (k) { sfx('tap'); openSheet(k); toast(e.currentTarget.dataset.tip || ''); } else toast(conAdd() > 0 ? `지금 모든 공사 +${conAdd()}%예요${cbOn() ? `. 건설 부스터 ${hm(cbLeft())} 남았어요` : ''}${nbOn() ? `. 야간 건설은 ${hm(nbLeft())} 남았어요` : ''}` : `매일 ${NB.h0}~${NB.h1}시에는 야간 건설 이벤트로 모든 공사 +${NB.add}%예요. 학교 특별 이벤트 주간에는 +${NB.addSp}%예요`); });
    $('#conCb').addEventListener('click', e => { const b = e.target.closest('[data-cb]'); if (b) cbBuy(b.dataset.cb); });
    $('#albPrev').addEventListener('click', () => { rt.albPage -= 1; sfx('tap'); renderAlbum(); });
    $('#albNext').addEventListener('click', () => { rt.albPage += 1; sfx('tap'); renderAlbum(); });
  }
  // 매점, 자율학습, 연구소, 대학 축제, 교환학생, 이야기, 텃밭
  function wireSnackFest() {
    // 매점 간식 뽑기 창
    $('#sheetSnack').addEventListener('click', () => viaSheet(openSn));
    $('#sheetNs').addEventListener('click', () => viaSheet(openNs));
    $('#sheetDept').addEventListener('click', () => viaSheet(openDept));
    $('#sheetRx').addEventListener('click', () => viaSheet(openRx));
    $('#rxSeg').addEventListener('click', e => { const b = e.target.closest('[data-rseg]'); if (!b) return; rt.rxTab = b.dataset.rseg; sfx('tap'); renderRx(); });
    $('#rxBody').addEventListener('click', e => { const b = e.target.closest('[data-rt],[data-rts],[data-pp],[data-dp^="rx:"],[data-ta],[data-lab]'); if (!b) return;
      if (b.dataset.lab) { labClick(b); return; }   // 연구소 시간 줄이기
      if (b.dataset.pp) { const v = b.dataset.pp; if (v === 'day') ppDay(); else if (v.startsWith('w:')) ppWrite(v.slice(2)); renderRx(); return; }   // 논문
      if (b.dataset.rts) { rt.rtSel = b.dataset.rts; sfx('tap'); renderRx(); return; }   // 연구 나무 칸 고르기
      if (b.dataset.ta) { const [a, x, y, z] = b.dataset.ta.split(':'); const i = +x;   // 조교
        if (a === 'pick') { rt.taPick = rt.taPick === i ? -1 : i; rt.taGo = -1; sfx('tap'); }
        else if (a === 'go') { rt.taGo = rt.taGo === i ? -1 : i; rt.taPick = -1; sfx('tap'); }
        else if (a === 'hr') { rt.taHr = +y; sfx('tap'); }
        else if (a === 'sit') taSit(i, y);
        else if (a === 'send') taSend(i, +y, +z);
        else if (a === 'claim') taClaim();
        else if (a === 'mon') taMonUp();
        renderRx(); return; }
      if (b.dataset.rt) { if (rtStart(b.dataset.rt)) renderRx(); return; }
      if (rxUp(b.dataset.dp.slice(3))) renderRx(); });
    $('#mDept').addEventListener('click', deptClick);
    // 대학 축제
    $('#sheetFv').addEventListener('click', () => viaSheet(openFv));
    $('#mFv').addEventListener('click', fvClick);
    $('#fvG').addEventListener('click', fvMapTap); $('#fvG').addEventListener('keydown', fvMapTap);
    $('#fvTipX').addEventListener('click', () => { sfx('tap'); const k = rt.fvTipK; if (k && k.startsWith('bf')) S.bf[k === 'bfeve' ? 'eve' : 'tip'] = (bfWin(gameToday()) || bfNext(gameToday())).key; else S.fv.tip = gameWeek(); save(); fvTip(); });
    // 교환학생, 장터, 이야기
    $('#mXg').addEventListener('click', xgClick);
    $('#mMk').addEventListener('click', mkClick);
    $('#wdBarGo').addEventListener('click', () => { if (xgOn() && !xgDone()) openXg(); else openMk(); });
    $('#wdG').addEventListener('click', wdMapTap); $('#wdG').addEventListener('keydown', wdMapTap);
    $('#wdBarX').addEventListener('click', () => { sfx('tap'); rt.wdX = gameToday(); wdBar(); });
    $('#stSay').addEventListener('click', stNext); $('#stNext').addEventListener('click', stNext); $('#stPrev').addEventListener('click', stPrev);
    $('#stSkip').addEventListener('click', () => { sfx('tap'); stEnd(); });
    $('#stPicks').addEventListener('click', e => { const b = e.target.closest('[data-stp]'); if (b) stPick(+b.dataset.stp); });
    $('#map').addEventListener('click', sideMapTap, true); $('#map').addEventListener('keydown', sideMapTap, true);   // 곁가지 말풍선
    $('#sbBtn').addEventListener('click', openSb);
    $('#mSb').addEventListener('click', sbClick);
    $('#nsGo').addEventListener('click', () => { if (nsStart()) renderNs(); });
    $('#nsSubs').addEventListener('click', e => { const b = e.target.closest('[data-ns]'); if (!b || b.getAttribute('aria-disabled') === 'true' || nsUsedTonight()) return; rt.nsSub = b.dataset.ns; S.ns.sub = rt.nsSub; save(); renderNs(); });
    $('#snBtns').addEventListener('click', e => { const b = e.target.closest('[data-sn]'); if (!b) return;
      if (b.dataset.sn === '10' && b.getAttribute('aria-disabled') !== 'true') { sfx('tap'); askRow($('#snBtns'), `도토리 ${fmt(snCost(true))}개로 10번 뽑을까요?`, '10번 뽑기', () => snDraw(true)); return; }   // 큰 값은 한 번 더 물어요
      askRowOff(); snDraw(b.dataset.sn === '10'); });
    $('#bxDexBtn').addEventListener('click', () => { sfx('tap'); closeModal($('#mBx')); setTimeout(() => { setTab('dex'); setDexSeg('bx'); }, 240); });
    $('#sheetGarden').addEventListener('click', () => { closeSheet(); setTimeout(openGd, 240); });
    $('#mGd').addEventListener('click', e => {
      const b = e.target.closest('[data-gd]'); if (!b || b.getAttribute('aria-disabled') === 'true' && b.dataset.gd !== 'cook') return;
      const i = Number(b.dataset.i), g = b.dataset.gd;
      if (g === 'pick') { sfx('tap'); rt.gdCutI = -1; rt.gdPick = rt.gdPick === i ? -1 : i; gdRender(true); }
      else if (g === 'pickall') { sfx('tap'); rt.gdCutI = -1; rt.gdPick = rt.gdPick === -2 ? -1 : -2; gdRender(true); }
      else if (g === 'harall') { let k = 0; rt.gdFull = false; S.gn.plots.slice(0, gdN()).forEach((p, j) => { if (p.c && gdReady(p) && gdHarvest(j, true)) k++; }); if (k) { sfx('coin'); toast(rt.gdFull ? `작물 ${k}곳을 거뒀어요!\n가득 찬 재료는 넣지 못했어요` : `작물 ${k}곳을 거뒀어요!`); rt.gdFull = false; gdRender(true); gdMark(); save(); } }
      else if (g === 'watall') { let k = 0; S.gn.plots.slice(0, gdN()).forEach(p => { if (p.c && !p.w && !gdReady(p)) { gdWet(p); k++; } }); if (k) { sfx('tap'); toast(`밭 ${k}곳에 물을 줬어요!`); gdRender(true); gdMark(); save(); } }
      else if (g === 'cut') { sfx('tap'); rt.gdPick = -1; rt.gdPullI = -1; rt.gdCutI = rt.gdCutI === i ? -1 : i; gdRender(true); }
      else if (g === 'tk') gdTk(i, b.dataset.tk);
      else if (g === 'tkall') gdTkAll(i);
      else if (g === 'tkad') { tkAd(); setTimeout(() => gdRender(true), 400); }
      else if (g === 'free') gdFree(i);
      else if (g === 'pull') { if (rt.gdPullI === i) gdPull(i); else { sfx('tap'); rt.gdPullI = i; gdRender(true); } }
      else if (g === 'seed') gdPlant(rt.gdPick, b.dataset.c);
      else if (g === 'wat') gdWater(i);
      else if (g === 'har') gdHarvest(i);
      else if (g === 'cook') { const m = GD_M[b.dataset.m]; if (!m) return; if (!gdMenuOk(m)) { toast('이 메뉴는 학교급이 오르면 열려요'); return; } if (gdToday()) { toast('오늘의 급식은 이미 만들었어요. 내일 또 만들어요'); return; } if (!gdCanCook(m)) { toast(`재료가 모자라요: ${Object.entries(m.need).map(([c, n]) => `${GD_C[c].nm} ${n}개`).join(', ')}`); return; } rt.gdSel = m.id; sfx('tap'); gdRender(true); }
      else if (g === 'cooksel') { rt.gdSel = ''; sfx('tap'); gdRender(true); }
      else if (g === 'cookgo') { rt.gdSel = ''; gdCook(b.dataset.m); }
    });
    $('#snDexBtn').addEventListener('click', () => { sfx('tap'); closeModal($('#mSn')); setTimeout(() => { setTab('dex'); setDexSeg('sn'); rt.backTab = 'sn'; }, 240); });   // 도감을 닫으면 뽑기 창으로
  }
  // 마을 기부, 편지, 이름 바꾸기, 실험 노트, 책 고르기
  function wireCare() {
    // 마을 기부 창
    $('#vdBtns').addEventListener('click', e => { const b = e.target.closest('[data-vdk]'); if (!b) return; const k = b.dataset.vdk;
      if (k === 'left' && S.budget >= vdLeft()) { sfx('tap'); askRow($('#vdBtns'), `도토리 ${fmt(vdLeft())}개를 기부해 ${S.vd.lv + 1}단계로 올릴까요?`, '기부하기', () => vdGive('left')); return; }   // 남은 만큼은 한 번 더 물어요
      askRowOff(); vdGive(k === 'all' ? k : Number(k)); });
    $('#albLetter').addEventListener('click', () => { const pg = S.alb[rt.albPage]; if (pg && pg.ltr) { closeModal($('#mAlbum')); setTimeout(() => openLetter(pg, true), 240); } });
    $('#ltPrev').addEventListener('click', () => { if (rt.plAt != null) openPLetter(rt.plAt - 1, true); });   // 학부모 편지함
    $('#ltNext').addEventListener('click', () => { if (rt.plAt != null) openPLetter(rt.plAt + 1, true); });
    $('#plChip').addEventListener('click', () => openPLetter());
    $('#optPLetter').addEventListener('click', () => { sfx('tap'); openPLetter(null, true); });
    $('#frNameForm').addEventListener('submit', e => { e.preventDefault(); if (frRename(rt.frNameSp, $('#frNameIn').value)) closeModal($('#mFrName')); });
    layerKids.addEventListener('click', e => { const g = e.target.closest('.kid'); if (!g) return; e.stopPropagation(); const k = rt.kids.find(x => x.g === g); if (k) frKidTap(k); });
    $('#labSeg').addEventListener('click', e => { const b = e.target.closest('[data-lv]'); if (!b || rt.labBusy) return; rt.labView = b.dataset.lv; sfx('tap'); renderLab(); });
    $('#labIns').addEventListener('click', e => { const b = e.target.closest('[data-li]'); if (b) labTap(+b.dataset.li); });
    $('#labMixPane').addEventListener('click', e => { const b = e.target.closest('[data-ls]'); if (!b || labDone() || rt.labBusy) return; rt.labSel[+b.dataset.ls] = -1; sfx('tap'); renderLab(); });
    $('#labGo').addEventListener('click', labGo);
    $('#labPrev').addEventListener('click', () => { rt.labPage -= 1; renderLab(); });
    $('#labNext').addEventListener('click', () => { rt.labPage += 1; renderLab(); });
    $('#rdTickets').addEventListener('click', e => { const u = e.target.closest('[data-rd-unq]'); if (u) { rdUnqueue(+u.dataset.rdUnq); return; } const b = e.target.closest('[data-read-tk]'); if (b) readUseTicket(b.dataset.readTk); });
    $('#rdBooks').addEventListener('click', e => { const b = e.target.closest('[data-bk]'); if (b && b.getAttribute('aria-disabled') !== 'true') rdStart(b.dataset.bk); });
  }
  // 퀘스트 쪽지와 퀘스트 탭
  function wireQuests() {
    // 퀘스트 쪽지: 완료했으면 보상 받기, 아니면 해야 할 곳으로 바로 가기
    ['#sheetQReady', '#teaQReady'].forEach(id => $(id).addEventListener('click', e => { e.stopPropagation(); sfx('tap'); qReadyTap(e.currentTarget); }));
    // H-07: 현황판의 동네 등급, 평판, 숲의 정수, 학생 칸을 눌러도 반응이 없었어요. 한 줄 설명을 띄워요
    [['#gradePill', () => { const G = CFG.grades, g = S.grade; return g < G.length - 1 ? `동네 등급이에요. 평판을 모으면 ${G[g + 1].name}${iga(G[g + 1].name).slice(-1)} 돼요. 대도시가 되면 종업식을 열 수 있어요` : '동네 등급이에요. 가장 높은 대도시예요. 종업식을 열 수 있어요'; }],
      ['#repPill', () => '평판이에요. 건물과 선생님 레벨을 올리면 쌓이고, 동네 등급이 올라가요'],
      ['#essPill', () => '숲의 정수예요. 미니게임과 미션에서 모으고, 꾸미기 가게 같은 곳에서 써요'],
      ['#kidsPill', () => `학생 ${fmt(Math.floor(S.students))}명, 정원 ${fmt(capacity())}명이에요. 교실을 넓히면 더 들어와요`]].forEach(([sel, f]) => {
      const el = $(sel); if (!el) return;
      el.style.cursor = 'pointer';
      el.addEventListener('click', e => { if (rt.paused) return; e.stopPropagation(); sfx('tap'); toast(f()); });
    });
    $('#questBar').addEventListener('click', () => {
      rt.qTap = true;   // 여는 장면은 이때
      const bar = $('#questBar');
      const mq = curMain();
      if (mq) { if (mainReady()) claimMain(bar); else goTo(mq); return; }
      const s = S.q.subs.find(subReady) || S.q.subs[0];
      if (!s) return;
      if (subReady(s)) claimSub(s.id, bar); else goTo(s);
    });
    $('#panelQuests').addEventListener('click', e => {
      const b = e.target.closest('button[data-act]');
      if (!b) return;
      const ref = b.dataset.q;
      if (b.dataset.act === 'fold') { rt.qOpen = !rt.qOpen; sfx('tap'); buildQuestPanel(); return; }   // 메인 퀘스트 펼치기
      if (b.dataset.act === 'claim') { if (ref === 'main') claimMain(b); else if (ref === 'guest') gsClaim(b); else claimSub(ref, b); return; }
      goTo(ref === 'main' ? curMain() : ref === 'guest' ? S.gs.sub : S.q.subs.find(s => s.id === ref));
    });
  }
  // 설정과 튜토리얼
  function wireSettings() {
    $('#optBgm').addEventListener('change', e => {
      S.bgm = e.target.checked;
      if (S.bgm) ensureAudio(); else musicSync();
      save();
    });
    $('#optSound').addEventListener('change', e => {
      S.sound = e.target.checked;
      if (S.sound) { ensureAudio(); sfx('tap'); }
      save();
    });
    $('#optVibe').addEventListener('change', e => { S.vibrate = e.target.checked; buzz(20); save(); });
    $('#optSkip').addEventListener('click', () => {
      S.u.dev = true;
      setTab('school');
      applyAway(3 * 3600);
    });
    $('#optReset').addEventListener('click', () => { $('#resetConfirm').hidden = false; $('#resetNo').focus(); });
    $('#resetNo').addEventListener('click', () => { $('#resetConfirm').hidden = true; });
    $('#resetYes').addEventListener('click', resetGame);
    $('#tutAv').innerHTML = hedgehogAvatar();
    $('#optTut').addEventListener('click', () => { if (!rt.modalOpen) tutStart(S.tut.st === 'later' ? S.tut.step : 0); });
    $('#optNotice').addEventListener('click', () => { sfx('tap'); if (!rt.modalOpen) openNotice(false); });   // 공지
    const syncAdPrivacy = () => { const a = window.FOREST_ADS; $('#optAdPrivacy').hidden = !(a && typeof a.privacyRequired === 'function' && a.privacyRequired()); };
    window.addEventListener('forest-ad-privacy', syncAdPrivacy); syncAdPrivacy();
    $('#optAdPrivacy').addEventListener('click', async () => { const a = window.FOREST_ADS; if (!a || typeof a.privacyOptions !== 'function') return; $('#optAdPrivacy').disabled = true; try { await a.privacyOptions(); } finally { $('#optAdPrivacy').disabled = false; syncAdPrivacy(); } });
    $('#ntHide').addEventListener('click', () => { S.nt.hide = Date.now() + NT_HIDE; save(); closeModal($('#mNotice')); toast('일주일 동안 공지 창을 열지 않아요\n설정 > 공지사항에서 볼 수 있어요'); });
    $('#tutNext').addEventListener('click', tutNext);
    $('#tutLater').addEventListener('click', () => tutEnd('later'));
    $('#tutSkip').addEventListener('click', () => { if (!rt.tut) return; if (rt.tut.confirm) tutEnd('skip'); else { rt.tut.confirm = true; tutShow(); } });
    window.addEventListener('resize', () => { if (rt.tut && rt.tutPlace) rt.tutPlace(); });
    $('#optDel').addEventListener('click', () => { $('#delConfirm').hidden = false; $('#delNo').focus(); });
    $('#delNo').addEventListener('click', () => { $('#delConfirm').hidden = true; });
    $('#delYes').addEventListener('click', deleteAccount);
  }
  // 자리 비운 보상, 나가기, 광고 확인, 전학생, 뒤로 가기
  function wireExitBack() {
    $('#offClaim').addEventListener('click', claimOffline);
    $('#btnExit').addEventListener('click', () => { if (!rt.modalOpen) { sfx('tap'); openModal($('#mExit')); } });
    $('#adAskYes').addEventListener('click', () => adAskDone(true));
    $('#adAskNo').addEventListener('click', () => adAskDone(false));
    $('[data-close-adask]').addEventListener('click', () => adAskDone(false));
    $('#friendList').addEventListener('click', e => {
      const b = e.target.closest('[data-grow]'); if (!b) return;
      const i = +b.dataset.grow;
      if (!(S.p.ticket > 0) || i >= S.p.species) { shake(b); return; }
      S.p.ticket -= 1; S.p.nl[i] = (S.p.nl[i] || 0) + 1;
      const n = NEWCOMERS[i], L = S.p.nl[i];
      rt.kids.forEach(k => { if (k.sp === n.k) k.g.innerHTML = kidSVG(k.sp, k.bag); });
      showReward({ title: `${n.name}${n.ga} 쑥 자랐어요!`, art: kidAvatar(n.k).replace('<svg', '<svg style="width:72px;height:96px"'), big: `${n.name} Lv.${L}`, bigSub: L === 5 ? '금빛 별을 달았어요!' : '수업료 +2%', items: [] });
      sfx('buy'); save(); renderHUD(); renderAffordance(); renderGradPanel(true);
    });
    $('#exitYes').addEventListener('click', () => closeModal($('#mExit'), () => {
      if (AIT) { save(); AIT.close(); }
      else if (window.FOREST_APP) { save(); window.FOREST_APP.exit(); }
      else closeSchool();
    }));
    window.FOREST_BACK = () => {
      if (rt.modalOpen === $('#mExit')) { $('#exitNo').click(); return; }   // 확인 창에서 한 번 더 뒤로 가기는 '계속하기'예요 (닫기는 버튼으로만)
      if (rt.modalOpen || rt.sheetKey || rt.adOpen) { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); return; }
      // 블록 퍼즐 안에서 뒤로 가기: 열린 작은 창부터 닫고, 없으면 미니게임 탭으로 (하던 판은 저장돼요)
      if (pzUI.open) {
        for (const id of ['#pzQuitAsk']) { const el = $(id); if (!el.hidden) { el.hidden = true; return; } }
        if (!$('#pzEnd').hidden) { $('#pzEnd').hidden = true; pzClose(); return; }
        if (pzUI.mode) { pzUI.mode = ''; pzRenderTray(); pzRenderHelp(); return; }
        pzClose(); return;
      }
      if (!rt.paused) { if (rt.tab !== 'school') setTab('school'); else { sfx('tap'); openModal($('#mExit')); } }
    };
    $('#reopen').addEventListener('click', reopenSchool);
  }
  // 소리 켜기, 화면 숨김과 돌아옴, 저장 주기
  function wireAppLife() {
    document.addEventListener('pointerdown', ensureAudio, { capture: true });
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (rt.adOpen) return;
      if (pzUI.open && !rt.modalOpen) { window.FOREST_BACK(); return; }
      if (rt.modalOpen === $('#mExit')) closeModal($('#mExit'));
      else if (rt.modalOpen === $('#mAdAsk')) adAskDone(false);
      else if (rt.modalOpen === $('#mBoost')) closeModal($('#mBoost'));
      else if (rt.modalOpen === $('#mAtt')) closeModal($('#mAtt'));
      else if (rt.modalOpen === $('#mDeal')) closeModal($('#mDeal'));
      else if (rt.modalOpen === $('#mStats')) closeModal($('#mStats'));
      else if (rt.modalOpen === $('#mNotice')) closeModal($('#mNotice'));   // 공지
      else if (rt.modalOpen === $('#mElect')) closeModal($('#mElect'));   // 반장 선거
      else if (rt.modalOpen === $('#mTrip')) closeModal($('#mTrip'));
      else if (rt.modalOpen === $('#mFest')) closeModal($('#mFest'));
      else if (rt.modalOpen === $('#mCere')) { if (rt.cereAsking) cereKeep(); else { rt.cereAt = 0; cereAsk(); } }   // 뒤로 가기는 건너뛸지 묻고, 물을 때 다시 누르면 계속 봐요
      else if (rt.modalOpen === $('#tut')) tutEnd('later');
      else if (rt.modalOpen === $('#mSportsEnd')) $('#srGet').click();   // 운동회 결과는 받기 단추와 같게(뒤로 가기로 닫으면 상품을 못 받았어요)
      else if (rt.modalOpen === $('#mLab') && rt.labBusy) { /* 실험 장면이 도는 동안은 닫지 않아요(닫기 단추와 같게) */ }
      // 위에 없는 창도 뒤로 가기로 닫아요. 꼭 골라야 하는 창(저장 고르기, 전학 대화, 자리 비운 보상)은 그대로
      else if (rt.modalOpen && rt.modalOpen.classList.contains('overlay') && !['mPick', 'mTalk', 'mOffline', 'mSt'].includes(rt.modalOpen.id)) closeModal(rt.modalOpen);
      else if (rt.sheetKey && !rt.modalOpen) closeSheet();
    });
    document.addEventListener('visibilitychange', () => {
      if (!S) return;
      if (document.hidden) {
        rt.hiddenAt = gameNow();
        if (!rt.paused) save(rt.hiddenAt);
        Cloud.hideSv = S.savedAt;   // 2: 내릴 때 학교. 이것이 서버에 올라갔으면 내려 둔 동안 저절로 흐른 것만 달라요
        cloudPush();   // 앱을 내리면 서버에도 바로 올려요
        if (cloudOn()) Cloud.fresh = false;   // 다시 켜면 서버 저장부터 확인해요
        awayHold(true);   // 내려 둔 시간은 '켠 뒤 논 시간'에 넣지 않아요
        if (actx && actx.state === 'running') actx.suspend().catch(() => {});
        clearTimeout(rt.netT); rt.netT = setTimeout(netSleep, NET_IDLE.hidden);   // 서버 연결 줄이기
      } else {
        clearTimeout(rt.netT); netWake(); Cloud.wakeT = performance.now();
        const away = rt.hiddenAt && !rt.awayWait ? (gameNow() - rt.hiddenAt) / 1000 : 0;
        rt.hiddenAt = 0;
        rt.lastT = performance.now();
        if (Cloud.state === 'error' && Cloud.err === 'net') retryCloud();
        cloudVerify();
        if (rt.paused) return;
        awayHold(false);
        ensureAudio();
        applyAway(away);
      }
    });
    window.addEventListener('pagehide', () => { save(rt.paused ? rt.closedAt : (document.hidden && rt.hiddenAt ? rt.hiddenAt : gameNow())); cloudPush(); });   // 닫힐 때 저장 시각도 게임 시계로(기기 시계를 뒤로 돌려 자리 비운 보상을 되풀이해 받던 길)
    utSync(); setInterval(utSync, 1000);   // 대학교 낱말
    setInterval(() => {
      if (S && !rt.paused && !document.hidden) save();
      cloudTick();
      if (rt.tab === 'settings') renderCloudInfo();
      if (!document.hidden && cloudOn() && !Cloud.asleep && Date.now() - (rt.netAct || 0) > NET_IDLE.still) { cloudPush(); clearTimeout(rt.netT); rt.netT = setTimeout(netSleep, 3000); }   // 켜 둔 채 오래 안 만지면
    }, 5000);
    rt.netAct = Date.now();
    ['pointerdown', 'keydown'].forEach(t => document.addEventListener(t, () => { rt.netAct = Date.now(); if (Cloud.asleep) netWake(); }, true));
  }
  /* 서버 연결 줄이기. 무료 요금제는 서버에 동시에 붙는 기기가 100대까지라, 화면 밖에 잠시 있거나(1분)
     켜 둔 채 오래 안 만지면(10분) 서버 연결을 끊고, 다시 보거나 누르면 붙어요. 저장은 끊기 전에 올리고, 다시 붙으면 서버 학교부터 확인해요 */
  const NET_IDLE = { hidden: 60000, still: 600000 };
  function netSleep() {
    if (!Cloud.db || Cloud.asleep || !cloudOn()) return;
    if (Cloud.pushing) { clearTimeout(rt.netT); rt.netT = setTimeout(netSleep, 2000); return; }   // 올리는 중이면 끝난 뒤에
    Cloud.asleep = true;
    try { Cloud.db.goOffline(); } catch (e) { Cloud.asleep = false; }
  }
  function netWake() {
    rt.netAct = Date.now();
    if (!Cloud.asleep || !Cloud.db) return;
    Cloud.asleep = false;
    try { Cloud.db.goOnline(); } catch (e) { /* 무시 */ }
    Cloud.fresh = false; cloudVerify();   // 끊긴 사이 다른 기기가 저장했을 수 있어서 서버 학교부터 봐요
  }

