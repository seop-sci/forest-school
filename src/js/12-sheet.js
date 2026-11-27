  /* ---------- 시설 시트 ---------- */
  function openSheet(k) {
    if (rt.decoEdit) return;   // 꾸미기 중에는 건물을 열지 않아요
    if (rt.paused || rt.fest || rt.sports) return;   // 학교 행사 중에는 도토리를 줍다가 건물 창이 열리지 않게 해요
    rt.sheetKey = k;
    $('#sheetArt').innerHTML = `<img src="${blobUrl(IMG170(seasonKey(S.f[k] >= 1 ? bldImg(k) : SITE_IMG[k])))}" alt="" aria-hidden="true" decoding="async">`;   // Blob 주소
    rt.sheetAnimTo = performance.now() + 320;   // 창이 올라오는 동안은 지도 학생 걸음을 쉬어요(그리기 부담 줄이기)
    rt.furKey = '';
    renderSheet();
    const w = $('#sheetWrap');
    w.hidden = false;
    document.body.classList.add('sheet-open');   // 창이 열려 있는 동안 뒤 지도와 홈 칩 움직임을 멈춰요(끊김 줄이기)
    // 끊김 줄이기: 맨 위로 되돌리기와 단추 초점은 화면을 한 번 더 재게 해서, 그리는 프레임 안과 창이 다 올라온 뒤로 옮겨요
    requestAnimationFrame(() => { const sh = $('#sheetWrap .sheet'); if (sh.scrollTop) sh.scrollTop = 0; w.classList.add('open'); });
    setTimeout(() => { if (rt.sheetKey === k) $('#sheetBuy').focus({ preventScroll: true }); }, 280);
    sfx('tap');
    xgVisit(k);   // 교환학생의 날: 안내할 차례의 건물이면 세요
  }
  // 건물 창에서 연 창을 닫으면 그 건물 창으로 돌아와요
  function viaSheet(fn) { const k = rt.sheetKey; closeSheet(); setTimeout(() => { fn(); if (k && rt.modalOpen) rt.sheetBack = { k, el: rt.modalOpen }; }, 240); }
  function sheetBackCheck(el) { const B = rt.sheetBack; if (!B || B.el !== el) return; rt.sheetBack = null; setTimeout(() => { if (!rt.modalOpen && !rt.sheetKey && rt.tab === 'school' && !rt.paused && !rt.fest && !rt.sports && FAC[B.k] && S.f[B.k] >= 1) openSheet(B.k); }, 320); }
  function closeSheet() {
    if (!rt.sheetKey) return;
    rt.furKey = '';
    const w = $('#sheetWrap');
    w.classList.remove('open');
    rt.sheetKey = null;
    document.body.classList.remove('sheet-open');
    setTimeout(() => { if (!rt.sheetKey) w.hidden = true; }, 230);
    const fw = rt.bldFxWait; rt.bldFxWait = null;   // 창 안에서 업그레이드했으면 닫을 때 지도에서 효과를 보여 줘요
    if (fw && S.f[fw.k] === fw.L) setTimeout(() => bldFx(fw.k, fw.kind), 120);
  }
  // 공사 칸이 생기거나 사라지면 아래에서 올라온 창의 높이가 한 번에 120px쯤 바뀌어
  // 창 전체가 툭 튀었어요. 다시 그리기 전후 창 위치를 재서 0.22초 동안 부드럽게 옮겨요
  function renderSheet() {
    // 도토리가 오를 때마다(1초에 여러 번) 창 위치를 재느라 화면 전체를 다시 쟀어요. 공사 칸처럼 창 높이가 바뀔 수 있을 때만 재요
    const k = rt.sheetKey, shape = k ? [k, conOn(k), S.f[k], facMaxed(k), furReady(k)].join('|') : '';
    const sh = $('#sheetWrap .sheet'), open = sh && !$('#sheetWrap').hidden && rt.sheetShape === shape ? false : sh && !$('#sheetWrap').hidden;
    const t0 = open ? sh.getBoundingClientRect().top : 0;
    rt.sheetShape = shape;
    renderSheet0();
    if (!open || rt.reduced || !sh.animate) return;
    const dy = t0 - sh.getBoundingClientRect().top;
    if (Math.abs(dy) > 4) sh.animate([{ transform: `translateY(${dy.toFixed(0)}px)` }, { transform: 'none' }], { duration: 220, easing: 'ease-out' });
  }
  // 기다릴 시간 어림: 1시간 안은 분, 이틀 안은 시간, 그 뒤는 날
  const etaTx = sec => sec < 3600 ? `약 ${Math.max(1, Math.ceil(sec / 60))}분` : sec < 48 * 3600 ? `약 ${Math.round(sec / 3600)}시간` : `약 ${fmt(Math.round(sec / 86400))}일`;
  /* 건물 창 '탐험에서' 한 줄: 이번 학기 최고 레벨에 가까울수록 탐험 효과가 커져요(18-tam.js TAM.base) */
  function sheetTam(k) {
    const el = $('#sheetTam'); if (!el) return;
    const on = typeof tamOn === 'function' && tamOn() && TAM_BASE_KEYS.includes(k) && (FAC[k].tier || 0) <= S.tier;
    el.hidden = !on; if (!on) return;
    const f = tamFill(k), B = TAM.base, pc = v => Math.round(v * 100);
    const tx = k === 'classroom' ? (isFinite(tamTrainCap()) ? `대원 훈련 Lv.${fmt(tamTrainCap())}까지. 이번 학기 최고 레벨이면 상한이 없어져요` : '대원 훈련 상한 없음')
      : k === 'playground' ? `체육 대원 힘과 체력 +${pc(B.pe * f)}% (최고 레벨이면 +${pc(B.pe)}%)`
      : k === 'cafeteria' ? `응원이 ${tamCheerFl()}층 동안 이어져요 (최고 레벨이면 ${TAM.cheer.fl + B.cheer}층)`
      : k === 'library' ? `탐험 보고서를 ${Math.round(TAM.idleMax / 3600) + Math.round(B.idleH * f)}시간까지 모아요 (최고 레벨이면 ${Math.round(TAM.idleMax / 3600) + B.idleH}시간)`
      : `장비 재료 -${pc(B.gear * f)}% (최고 레벨이면 -${pc(B.gear)}%)`;
    const ic = IMG('ic_tab_ex');
    setH(el, `${ic ? `<img src="${ic}" alt="" aria-hidden="true">` : ''}<span><b>탐험에서</b> ${esc(tx)}</span>`);
  }
  function renderSheet0() {
    const k = rt.sheetKey; if (!k) return;
    const F = FAC[k], L = S.f[k], c = facCost(k), fr = furReady(k), ok = fr && S.budget >= c, cap = facCap(), maxed = facMaxed(k);
    renderFur();
    $('#sheetWrap .sheet').classList.toggle('is-room', !$('#furBox').hidden);
    setT($('#sheetHaveN'), fmt(S.budget));
    setT($('#sheetTitle'), F.name);
    setT($('#sheetSub'), L >= 1 ? `Lv.${L} / Lv.${cap}` : '아직 짓지 않았어요');   // 지금 레벨 / 올해 올릴 수 있는 최고 레벨
    setT($('#sheetDesc'), F.desc);
    setT($('#effNow'), F.eff(L));
    setT($('#effNextLabel'), maxed ? (semFirst() ? '2학기' : finalYear() ? '졸업 뒤' : '다음 학년') : L >= 1 ? '다음 레벨' : '지으면');
    setT($('#effNext'), maxed ? (!semFirst() && finalYear() ? (S.tier === 4 ? '대학원에서 이어서 키워요' : '새 학교에서 다시 지어요') : `Lv.${capNext()}까지 열려요`) : F.eff(L + 1) === F.eff(L) && L >= 1 ? `${F.eff(L)}(가장 빨라요)` : F.eff(L + 1));
    setT($('#sheetRep'), k === 'library' ? '도서관은 평판을 가장 많이 올려요. 평판이 쌓이면 학교 등급이 올라가요.' : `레벨이 오를 때마다 평판도 ★${F.rep} 올라요.`);
    setT($('#sheetBuyLabel'), (maxed ? '최고 레벨' : L >= 1 ? '키우기' : '짓기') );   // 즉시 완공은 옆 ⚡ 단추로
    { const fb = $('#sheetFree'), ok = ffCan(k) && !conOn(k); setT(fb.querySelector('.n'), ffLeft()); fb.hidden = !(S.tier >= 1 && !maxed && !conOn(k) && conFreeLeft(k) && conSec(k, L + 1) > 10);   /* 공사 중에는 아래 단추만 */ fb.setAttribute('aria-disabled', ok && furReady(k) && S.budget >= facCost(k) ? 'false' : 'true'); }
    setT($('#sheetCost'), maxed ? '-' : fmt(c));
    $('#sheetBuy').setAttribute('aria-disabled', ok ? 'false' : 'true');
    $('#sheetBuy').classList.toggle('is-rec', !!rt.rec && rt.rec.kind === 'fac' && rt.rec.k === k && !maxed);
    sheetTam(k);   // 탐험에서 하는 일
    conSheet();   // 공사 중이면 공사 칸
    frSheet(k);   // 여기 있는 친구, 생일 잔치
    // 이 시설이 지금 퀘스트 목표라면 시트 안에서도 알려 줘요
    const mq = curMain();
    let qtxt = '';
    if (mq && !mainReady() && (((mq.t === 'fac' || mq.t === 'fur' || mq.t === 'furAll') && mq.k === k) || (mq.t === 'students' && k === 'classroom' && capacity() < mq.n))) {
      qtxt = `메인 퀘스트 ${qNo(S.q.m)}: ${qGoal(mq)}`;
    } else {
      const s = S.q.subs.find(x => x.t === 'fac' && x.k === k && !subReady(x));
      if (s) qtxt = `${WHO[s.who]}의 부탁: ${qGoal(s)}`;
    }
    const qn = $('#sheetQuest');
    qn.hidden = !qtxt;
    setT(qn, qtxt);
    // 과학실 창의 실험 단추, 도서관 창의 책 읽기 단추
    const sl = $('#sheetLab'), slOn = k === 'science' && labReady();
    sl.hidden = !slOn;
    if (slOn) {
      setH($('#sheetLabIc'), IMG('lab_flask') ? `<img src="${IMG('lab_flask')}" alt="">` : '⚗️');
      setT($('#sheetLabTx'), labDone() ? `오늘 실험 끝, 노트 ${labCount()}/${LAB_KEYS.length}` : `하루 한 번, 노트 ${labCount()}/${LAB_KEYS.length}`);
      setT($('#sheetLabGo'), labDone() ? '노트 보기' : '실험하기');
      sl.classList.toggle('todo', !labDone());
    }
    const sr = $('#sheetRead'), srOn = k === 'library' && rdReady();
    sr.hidden = !srOn;
    if (srOn) {
      const b = S.rd.cur && BOOKS.find(x => x.k === S.rd.cur);
      setH($('#sheetReadIc'), b ? bookCover(b, 'bk-mini') : '📚');
      setT($('#sheetReadTx'), b ? `「${b.name}」 ${Math.ceil(rdRemain() / 60000)}분 남았어요` : `오늘 ${rdLeft()}/${rdPerDay()}권 남았어요`);
      setT($('#sheetReadGo'), b ? '보기' : '고르기');
      sr.classList.toggle('todo', !b && rdLeft() > 0);
    }
    // 도서관 창의 시험 기간 단추, 교실 창의 전교 1등 상장
    const sx = $('#sheetExam'), sxOn = k === 'library' && exOpen() && S.f.library >= 1;
    sx.hidden = !sxOn;
    if (sxOn) {
      setH($('#sheetExamIc'), IMG('exam_book') ? `<img src="${IMG('exam_book')}" alt="">` : '📝');
      setT($('#sheetExamTx'), exReportReady() ? '성적표가 나왔어요!' : exNow() ? (exStudyDone() ? `시험 주, 오늘 자율학습 끝(${exDays()}일 남음)` : `시험 주, 자율학습을 해요(${exDays()}일 남음)`) : `다음 시험까지 ${exDays()}일`);
      setT($('#sheetExamGo'), exReportReady() ? '받기' : exNow() && !exStudyDone() ? '자율학습' : '보기');
      sx.classList.toggle('todo', exReportReady() || (exNow() && !exStudyDone()));
    }
    const aw = $('#sheetAward'), top = k === 'classroom' ? exAwardTop() : null;
    aw.hidden = !top;
    if (top) setH(aw, `${IMG('exam_award') ? `<img src="${IMG('exam_award')}" alt="">` : '🏅'}<span>전교 1등 <b>${esc(top.nm)}</b>의 상장이 다음 시험까지 걸려 있어요.</span>`);
    // 급식실 창의 학교 텃밭
    const sg = $('#sheetGarden'), sgOn = k === 'cafeteria' && gdOpen();
    sg.hidden = !sgOn;
    if (sgOn) {
      gdSync(); const rd = gdReadyN(), tm = gdToday();
      setH($('#sheetGardenIc'), gdImg('item_carrot', '🥕'));
      setT($('#sheetGardenTx'), `${rd ? `거둘 작물 ${rd}개` : `밭 ${gdN()}칸`}, ${tm ? `오늘의 급식 ${tm.nm}` : '오늘의 급식 아직'}`);
      setT($('#sheetGardenGo'), rd ? '거두기' : '가꾸기');
      sg.classList.toggle('todo', rd > 0 || (!tm && GD_MENU.some(gdCanCook)));
    }
    // 기숙사와 도서관 창의 야간 자율학습
    const ns = $('#sheetNs'), nsVis = (k === 'dorm' || k === 'library') && nsOpen();
    ns.hidden = !nsVis;
    if (nsVis) {
      const ic = IMG('ic_selfstudy'); setH($('#sheetNsIc'), ic ? `<img src="${ic}" alt="">` : '🌙');
      const on = nsOn(), used = nsUsedTonight(), night = isNight(), planned = nsPlanned();
      setT($('#sheetNsTx'), on ? `자율학습 중, 아침 ${NSL.h1}시에 ${AC.name[S.ns.sub]} XP +${NSL.xp}` : planned ? `오늘 밤 ${NSL.h0 - 12}시 자율학습을 예약했어요` : used ? '오늘 밤 자율학습을 마쳤어요' : night ? `켜면 자리 비운 보상 +${hm(nsExtraH() * 3600)}` : '오늘 밤 자율학습을 미리 예약해요');
      setT($('#sheetNsGo'), on || used ? '보기' : night ? '켜기' : '예약');
      ns.classList.toggle('todo', !used && !on);
    }
    // 학생회관 창의 학과 사무실
    { const fb = $('#sheetFv'), vis = k === 'union' && fvOpen(); fb.hidden = !vis;   // 대학 축제
      if (vis) { const u = IMG('ic_fv'); setH($('#sheetFvIc'), u ? `<img src="${u}" alt="">` : '🎪'); setT($('#sheetFvTx'), fvOn() ? '오늘 축제 중' : `다음 축제: ${fvNext()}`); fb.classList.toggle('todo', fvOn() && !S.fv.o); } }
    { const rb = $('#sheetRx'), rv = k === 'institute' && rtOpen(); rb.hidden = !rv;   // 연구소 창
      if (rv) { const u = IMG('ic_rt_class'); setH($('#sheetRxIc'), u ? `<img src="${u}" alt="">` : ''); const c = S.rt5.cur; setT($('#sheetRxTx'), c ? `${(RT5.list.find(D => D.k === c.k) || {}).nm} 연구 중 ${hms(c.end - gameNow())}` : '연구 트리가 비어 있어요'); rb.classList.toggle('todo', !c); } }
    { const dp = $('#sheetDept'), vis = k === 'union' && deptOpen(); dp.hidden = !vis;
      if (vis) { const ps = deptPicks(), u = IMG('ic_col_' + (ps[0] || 'edu')); setH($('#sheetDeptIc'), u ? `<img src="${u}" alt="">` : '🎓');
        setT($('#sheetDeptTx'), ps.length ? ps.map((x, i) => (i ? '복수전공 ' : '주전공 ') + deptOf(x).name).join(', ') : '주전공 단과대학을 골라요'); dp.classList.toggle('todo', ps.length < deptSlots()); } }
    // 매점 창의 간식 뽑기
    const sn = $('#sheetSnack'), snOn = k === 'store' && snOpen();
    sn.hidden = !snOn;
    if (snOn) {
      snSync();
      const mi = snMoodImg();
      setH($('#sheetSnackIc'), mi ? `<img src="${mi}" alt="">` : '🍪');
      setT($('#sheetSnackTx'), `학교 기분 ${S.sn.mood}/${snMoodMax()}칸, 간식 도감 ${snCount()}/${SN_ALL.length}종`);
      sn.classList.toggle('todo', S.sn.mood < snMoodMax() && S.budget >= snCost(false));
    }
    // 놀이터 창의 숲속 소풍, 교실 창의 칭찬 스티커판
    const sp = $('#sheetPicnic'), spOn = k === 'playground' && pcReady();
    sp.hidden = !spOn;
    if (spOn) {
      pcSettle();
      setH($('#sheetPicnicIc'), IMG('picnic_ic') ? `<img src="${IMG('picnic_ic')}" alt="">` : '🧺');
      const busy = pcActive(), done = !busy && S.pc.day === gameToday();
      setT($('#sheetPicnicTx'), busy ? `소풍 가는 중, ${Math.ceil(pcRemain() / 60000)}분 뒤 돌아와요` : done ? '오늘 소풍은 다녀왔어요' : `친구 ${PCN.kids}명이 ${PCN.min}분 동안 숲에 다녀와요`);
      setT($('#sheetPicnicGo'), busy ? '보기' : done ? '보기' : '보내기');
      sp.classList.toggle('todo', !busy && !done);
    }
    const sk = $('#sheetSticker'), skOn = k === 'classroom' && skOpen() && S.f.classroom >= 1;
    sk.hidden = !skOn;
    if (skOn) {
      setH($('#sheetStickerIc'), IMG('sticker_star') ? `<img src="${IMG('sticker_star')}" alt="">` : '⭐');
      setT($('#sheetStickerTx'), skFull() ? '다 채웠어요! 상을 골라요' : `스티커 ${S.sk.cur.length}/${SK.full}장`);
      setT($('#sheetStickerGo'), skFull() ? '상 받기' : '보기');
      sk.classList.toggle('todo', skFull());
    }
    // 교실 창의 반장 선거 단추
    const se = $('#sheetElect'), seOn = k === 'classroom' && elOpen() && S.f.classroom >= 1;
    se.hidden = !seOn;
    if (seOn) {
      elSync();
      const pres = elPres();
      setH($('#sheetElectIc'), IMG('elect_ballot_box') ? `<img src="${IMG('elect_ballot_box')}" alt="">` : '🗳️');
      setT($('#sheetElectTx'), pres ? `이번 주 반장 ${elWho(pres)}: ${EL_PLEDGES[pres.p].t}` : '이번 주 후보 세 명이 기다려요');
      setT($('#sheetElectGo'), pres ? '보기' : '투표하기');
      se.classList.toggle('todo', !pres);
    }
    setT($('#sheetNeed'), conOn(k) ? ' ' : maxed ? (semFirst() ? `더 올리려면 1학기를 마쳐야 해요. 1학기 방학식을 열면 Lv.${capNext()}까지 키울 수 있어요` : (finalYear() ? (S.tier === 4 ? `이 학년에서는 다 키웠어요. 학위수여식을 열면 대학원에서 더 키울 수 있어요` : `이 학교급에서는 다 키웠어요. 졸업식을 열면 ${TIERS[S.tier + 1].name}에서 새로 지어요`) : `더 올리려면 학교가 다음 학년으로 올라가야 해요. ${semOn() ? '2학기 ' : ''}종업식을 열면 Lv.${capNext()}까지 키울 수 있어요`)) : !fr ? `가구 네 개를 모두 ${euro('Lv.' + L)} 올리면 건물을 키울 수 있어요` : ok ? ' ' : `도토리 ${fmt(Math.ceil(c - S.budget))}개가 더 필요해요`);
    $('#sheetNeed').classList.toggle('soft', maxed || !fr);
    // 도토리가 모자라면 지금 수업료로 얼마나 걸리는지, 하루 횟수가 남은 일이 있으면 오늘 할 일로 가는 단추
    { const r = rate(), sec = !conOn(k) && !maxed && fr && !ok && r > 0 ? (c - S.budget) / r : 0, w = $('#sheetWait');
      setHid(w, !(sec > 0 && isFinite(sec)));
      if (sec > 0 && isFinite(sec)) { setT($('#sheetWaitTx'), `수업료로 ${etaTx(sec)}`); setHid($('#sheetWaitGo'), !todoRows().some(x => x.left > 0 && x.T.go !== 'home' && x.T.k !== 'sk')); } }
  }
  // 짓기와 업그레이드 효과. kind 'build'(처음 지음) 또는 'up'. 건물 창이 열려 있으면 닫을 때 보여 줘요
  // 켜요(코드로 그린 먼지와 별은 어색해서 그림으로 바꿨어요). setBldFx(false)로 끌 수 있어요
  let BLD_FX = true;
  const setBldFx = v => { BLD_FX = !!v; };
  function bldFx(k, kind) {
    if (!BLD_FX || rt.reduced) return;
    if (rt.sheetKey === k && kind === 'up') { rt.bldFxWait = { k, kind, L: S.f[k] }; return; }
    const g = $('#b-' + k), b = g && g.querySelector('.built'), bi = b && b.querySelector('.bimg'); if (!bi || !g.classList.contains('is-built')) return;
    const num = a => Number(bi.getAttribute(a)) || 0, x = num('x'), y = num('y'), w = num('width');
    if (!w) return;
    const si = g.querySelector('.site .bimg'), sx = si ? Number(si.getAttribute('x')) || x : x, sy = si ? Number(si.getAttribute('y')) || y : y, sw = si ? Number(si.getAttribute('width')) || w : w;
    const old = g.querySelector('.bfx'); if (old) old.remove();
    const fx = document.createElementNS('http://www.w3.org/2000/svg', 'g'); fx.setAttribute('class', 'bfx');
    const im = (key, cls, X, Y, W, H, st) => `<image class="${cls}" href="${IMG180(key)}" x="${X.toFixed(1)}" y="${Y.toFixed(1)}" width="${W.toFixed(1)}" height="${(H || W).toFixed(1)}"${st ? ` style="${st}"` : ''}/>`;
    const cx = x + w / 2, build = kind === 'build';
    let h = '';
    if (build) {
      h += im('fx_scaffold', 'scaf', sx, sy, sw);   // 공사 자리 그림과 같은 캔버스(400×400)라 그대로 겹쳐요
      h += im('fx_hammer', 'ham', sx + sw * 0.58, sy + sw * 0.12, sw * 0.24);
      for (let i = 0; i < 12; i++) {   // 흙먼지 두 번: 바닥에서 옆으로 퍼져요
        const t = ((i % 6) / 5) * 2 - 1, d = w * (0.26 + Math.random() * 0.12), dy0 = y + w * (0.6 + Math.random() * 0.18);
        h += im('fx_dust_' + (1 + (i % 4)), 'dust', cx + t * w * 0.3 - d / 2, dy0 - d / 2, d, d, `--dx:${(t * w * 0.2).toFixed(1)}px;--dy:${(-w * (0.03 + Math.random() * 0.08)).toFixed(1)}px;--d:${((i < 6 ? 0.05 : 0.85) + Math.random() * 0.15).toFixed(2)}s`);
      }
    }
    const n = build ? 8 : 6, d0 = build ? 1.45 : 0.1;
    for (let i = 0; i < n; i++) {   // 반짝이: 지붕 둘레로 튀어요
      const a = -Math.PI * (0.05 + 0.9 * (i / (n - 1))), R = w * (0.28 + Math.random() * 0.14), z = w * (0.1 + Math.random() * 0.06);
      h += im('fx_sparkle_' + (1 + (i % 2)), 'spark', cx - z / 2, y + w * 0.4 - z / 2, z, z, `--dx:${(Math.cos(a) * R).toFixed(1)}px;--dy:${(Math.sin(a) * R).toFixed(1)}px;--d:${(d0 + Math.random() * 0.25).toFixed(2)}s`);
    }
    if (build) {   // 완공 리본: 가운데 빈 곳에 "완공!"을 써요
      const rw = w * 0.82, rh = rw * 160 / 512, ry = y + w * 0.04;
      h += `<g class="rib-g" style="--d:1.4s">${im('fx_ribbon', 'rib', cx - rw / 2, ry, rw, rh)}<text class="rib-t" x="${cx.toFixed(1)}" y="${(ry + rh * 0.45).toFixed(1)}" font-size="${(rh * 0.42).toFixed(1)}" stroke-width="${(rh * 0.08).toFixed(1)}">완공!</text></g>`;
    } else {   // 업그레이드 배지와 레벨
      const bw = w * 0.27, by = y - w * 0.02;
      h += im('fx_up_badge', 'badge', cx - bw / 2, by, bw, bw, '--d:.12s');
      h += `<text class="lv" x="${cx.toFixed(1)}" y="${(by + bw * 1.22).toFixed(1)}" font-size="${(bw * 0.42).toFixed(1)}" stroke-width="${(bw * 0.09).toFixed(1)}" style="--d:.2s">Lv.${S.f[k]}</text>`;
    }
    fx.innerHTML = h; g.appendChild(fx);
    b.classList.remove('fx-rise', 'fx-up'); void b.getBBox();
    b.classList.add(build ? 'fx-rise' : 'fx-up');
    g.classList.toggle('fx-site', build);   // 처음 지을 때는 공사 자리가 비계 밑에 보이다가 사라져요
    if (build) setTimeout(() => { sfx('done'); buzz(14); }, 1400);
    clearTimeout(rt['bfxT' + k]);
    rt['bfxT' + k] = setTimeout(() => { fx.remove(); b.classList.remove('fx-rise', 'fx-up'); g.classList.remove('fx-site'); }, build ? 3300 : 1700);
  }
  // 돈을 내면 공사가 시작돼요. 레벨은 공사가 끝날 때(conFinish) 올라요
  /* 건설 가속(도토리가 남을 때 쓸 곳): 사 두면 그동안 모든 공사가 2배 빨라요(초등학교부터)
     값은 수업료 분치(minAcorns)라 학교가 클수록 커요. 겹쳐 사면 시간이 이어 붙고, 남은 시간은 6시간까지. */
  const CB = { tier: 1, maxH: 6, items: [{ k: 'm30', min: 30, m: 60, name: '건설 부스터(30분)' }, { k: 'h1', min: 60, m: 110, name: '건설 부스터(1시간)' }] };
  const cbOn = () => !!S && !!S.cb && S.cb.until > gameNow();
  const cbLeft = () => S && S.cb ? Math.max(0, Math.ceil((S.cb.until - gameNow()) / 1000)) : 0;
  const cbCost = it => minAcorns(it.m);
  // 지난번 셈한 때부터 지금까지 가속이 켜져 있던 만큼, 공사마다 끝나는 때를 그만큼 당겨요(그 공사가 시작한 뒤의 시간만)
  function cbApply() {
    if (!S || !S.cb) return;
    const now = gameNow(), C = S.cb;
    if (C.until > C.at && S.bd) {
      const hi = Math.min(now, C.until);
      for (const k of Object.keys(S.bd)) { const b = S.bd[k], lo = Math.max(C.at, b.s), ov = hi - lo; if (ov > 0) b.e -= ov; }
    }
    C.at = now;
  }
  /* 야간 건물 건설 이벤트 : 매일 한국 시간 20~24시, 모든 학교급, 모두에게 공사 +100%
     건설 부스터와 겹치면 더해서 +200%(A안). 셈은 cbApply와 같아요: 지난번 셈한 때부터 지금까지 20~24시와 겹친 시간만큼
     공사마다 끝나는 때를 당겨요(그 공사가 시작한 뒤의 시간만). 자리 비운 동안도 같아요. 핫픽스 off에 'night'를 넣으면 꺼져요 */
  const NB = { h0: 20, h1: 24, add: 100, addSp: 200, tier: 1 };   // 학교 특별 이벤트(수능, 추석 같은 큰 이벤트) 날은 +200%
  const DAY_MS = 86400000;
  const nbOnAt = t => { const h = ((t + KST_MS) % DAY_MS) / 3600000; return h >= NB.h0 && h < NB.h1; };
  // 학교 특별 이벤트 주간(수능, 추석 등)의 토요일과 일요일은 하루 종일(0~24시) 건설 가속이에요(+200%). 생물 탐사의 밤 생물은 그대로 20~24시(nbOnAt)
  const kstWd = day => (new Date(Date.parse(day + 'T00:00:00Z')).getUTCDay() + 6) % 7;   // 월 0 … 일 6
  const nbAllDay = day => kstWd(day) >= 5 && nbSpDay(day);
  const nbH0 = day => nbAllDay(day) ? 0 : NB.h0;
  const nbBuildAt = t => nbOnAt(t) || nbAllDay(kstDay(t));
  const nbOn = () => !!S && !liveOff('night') && nbBuildAt(gameNow());
  const nbSpDay = day => { const c = evCurrent(day); return !!c && EV_SPECIAL.includes(c.def); };
  const nbAddOf = day => nbSpDay(day) ? NB.addSp : NB.add;
  const nbAdd = () => nbAddOf(gameToday());
  const nbLeft = () => { const d = (gameNow() + KST_MS) % DAY_MS; return Math.max(0, Math.ceil((NB.h1 * 3600000 - d) / 1000)); };
  const conAdd = () => (cbOn() ? 100 : 0) + (nbOn() ? nbAdd() : 0);   // 지금 공사 빠르기 +n%
  // [a, b) 안에서 20~24시와 겹친 시간(ms)
  function nbOverlap(a, b, w) {   // w면 날마다 +n%를 곱해서(특별 이벤트 날은 2배 당겨요)
    if (!(b > a)) return 0;
    let s = 0;
    for (let d = Math.floor((a + KST_MS) / DAY_MS) * DAY_MS - KST_MS; d < b; d += DAY_MS) {
      const lo = Math.max(a, d + nbH0(kstDay(d)) * 3600000), hi = Math.min(b, d + NB.h1 * 3600000);
      if (hi > lo) s += (hi - lo) * (w ? nbAddOf(kstDay(d)) / 100 : 1);
    }
    return s;
  }
  function nbApply() {
    if (!S || !S.nb) return;
    const now = gameNow(), at = S.nb.at || now;
    if (S.bd && now > at && !liveOff('night')) {
      for (const k of Object.keys(S.bd)) { const b = S.bd[k], ov = nbOverlap(Math.max(at, b.s), now, true); if (ov > 0) b.e -= ov; }
    }
    S.nb.at = now;
  }
  // 이벤트 시간에 처음 볼 때 하루 한 번 알려요(배너가 오면 배너 창으로 바꿔요)
  function nbNotice() {
    if (!S || !S.nb || S.tier < NB.tier || !nbOn() || rt.paused) return;
    const d = gameToday(); if (S.nb.seen === d) return;
    S.nb.seen = d;
    const all = nbAllDay(d), msg = `${all ? '오늘은 하루 종일' : '자정까지'} 모든 공사 +${nbAdd()}%예요${nbAdd() > NB.add ? '(학교 특별 이벤트 주간)' : ''}${cbOn() ? `. 건설 부스터와 함께 +${conAdd()}%` : ''}`;
    const ban = IMG('ev_banner_nightbuild');
    if (ban && !rt.modalOpen) {   // 배너 창. 다른 창이 열려 있으면 토스트로만
      $('#nbBan').style.backgroundImage = `url("${ban}")`;
      $('#nbSub').textContent = all ? `주말 하루 종일 공사 +${nbAdd()}%` : `오늘 ${NB.h0}~${NB.h1}시 공사 +${nbAdd()}%`;
      $('#nbLead').textContent = `${nbAdd() > NB.add ? '학교 특별 이벤트 주간이에요. ' : ''}${cbOn() ? `건설 부스터와 함께 +${conAdd()}%예요.` : '건설 부스터를 같이 쓰면 효과가 더해져요.'}`;
      openModal($('#mNb'));
    } else toast(`야간 건설 이벤트 시작! ${msg}`);
    sfx('quest'); ffRender(true); save();
  }
  /* 야간 자율학습 : 한국 시간 20시~다음 날 6시가 밤이에요
     고등학교부터 밤이면 지도가 저절로 어두워지고 창에 불이 켜져요. 학생은 기숙사 앞에서 졸아요
     기숙사(또는 도서관) 창에서 낮에 예약하거나 밤에 하루 한 번 자율학습을 켜면 그 밤 동안 자리 비운 보상 상한이 기숙사 Lv × 30분(최대 12시간) 늘고
     그 밤에 쌓인 도토리에 사감 선생님 보너스(+5%/Lv)가 붙어요. 6시가 지나면 고른 과목 XP +30. */
  const NSL = { h0: 20, h1: 6, tier: 3, perLvMin: 30, maxH: 12, xp: 30, len: 10 * 3600000 };
  const kstHour = t => ((t + KST_MS) % DAY_MS) / 3600000;
  const nightAt = t => { const h = kstHour(t); return h >= NSL.h0 || h < NSL.h1; };
  const isNight = () => nightAt(gameNow());
  const nightDayOf = t => kstDay(kstHour(t) < NSL.h1 ? t - DAY_MS : t);   // 그 밤이 시작한 날짜(20시가 있는 날)
  const nightStart = day => Date.parse(day + 'T00:00:00Z') - KST_MS + NSL.h0 * 3600000;
  const nsOpen = () => !!S && !!S.ns && S.tier >= NSL.tier && (S.f.dorm || 0) >= 1;
  const nsOnAt = t => nsOpen() && !!S.ns.day && !S.ns.done && t >= Math.max(nightStart(S.ns.day), S.ns.at || 0) && t < nightStart(S.ns.day) + NSL.len;
  const nsOn = () => nsOnAt(gameNow());
  const nsUsedTonight = () => !!S && !!S.ns && S.ns.day === nightDayOf(gameNow());
  const nsPlanned = () => nsOpen() && nsUsedTonight() && !S.ns.done && gameNow() < nightStart(S.ns.day);
  const nsExtraH = () => Math.min(NSL.maxH, (S.f.dorm || 0) * NSL.perLvMin / 60);
  const nsBonus = () => XT.dorm.per / 100 * xtLv('dorm');
  // [a, b) 안에서 자율학습을 켠 밤과 겹친 초
  function nsOverlap(a, b) {
    if (!nsOpen() || !S.ns.day || !(b > a)) return 0;
    const s0 = nightStart(S.ns.day), lo = Math.max(a, s0, S.ns.at || 0), hi = Math.min(b, s0 + NSL.len);
    return hi > lo ? (hi - lo) / 1000 : 0;
  }
  function nsStart() {
    if (!S || rt.paused) return false;
    if (!nsOpen()) { toast('야간 자율학습은 고등학교 기숙사를 지으면 열려요'); return false; }
    nsSettle(true);
    const day = nightDayOf(gameNow());
    if (S.ns.day === day) { toast('오늘 밤 자율학습은 이미 준비했어요'); return false; }
    const sub = AC.keys.includes(rt.nsSub) ? rt.nsSub : S.ns.sub;
    Object.assign(S.ns, { day, sub, got: 0, sec: 0, done: false, n: Math.min(SAVE_CAP.count, S.ns.n + 1), at: gameNow() });
    sfx('quest'); buzz(15);
    toast(nsPlanned() ? `오늘 밤 자율학습을 예약했어요.\n밤 ${NSL.h0 - 12}시에 저절로 시작해요.\n아침 ${NSL.h1}시 뒤에 결과를 받아요.` : `야간 자율학습을 켰어요!\n아침 ${NSL.h1}시까지 자리 비운 보상이 ${hm(nsExtraH() * 3600)} 더 쌓여요`);
    save(); checkQuests(); renderNight(true); try { renderNsRow(); } catch (e) { /* 공부 탭 줄 */ } return true;
  }
  // 켠 밤이 끝나면(6시) 결과를 한 번 알려요: 쌓인 시간과 도토리, 고른 과목 XP
  function nsSettle(quiet) {
    if (!S || !S.ns || S.ns.done || !S.ns.day) return;
    if (gameNow() < nightStart(S.ns.day) + NSL.len) return;
    S.ns.done = true;
    S.ns.fin = Math.min(SAVE_CAP.count, (S.ns.fin || 0) + 1);
    const xp = acGain(S.ns.sub, NSL.xp);
    if (!quiet) toast(`야간 자율학습 결과\n${S.ns.sec > 0 ? `${fmtDur(S.ns.sec)} 동안 도토리 ${fmt(S.ns.got)}개가 쌓였어요` : '밤새 학교를 지켰어요'}\n${AC.name[S.ns.sub]} XP +${xp}`);
    save();
  }
  function nsTick(dt) {
    rt.nsT = (rt.nsT || 0) + dt; if (rt.nsT < 1) return; rt.nsT = 0;
    renderNight(); renderTierDots(); nsSettle(); tr2Tick(); renderTr2Btn();   // 밤이 되면 밤 모습 단추. 수학여행 떠나 있는 동안 학생 숨김
  }
  function openNs() {
    if (!nsOpen()) { toast('야간 자율학습은 고등학교 기숙사를 지으면 열려요'); return; }
    nsSettle(); rt.nsSub = S.ns.sub;
    const bg = IMG('study_bg'); $('#nsHead').style.backgroundImage = bg ? `url("${bg}")` : '';
    renderNs(); openModal($('#mNs'));
  }
  function renderNs() {
    if (!S || !S.ns) return;
    const night = isNight(), used = nsUsedTonight(), on = nsOn(), planned = nsPlanned();
    $('#nsLead').textContent = on ? `지금 자율학습 중이에요.\n아침 ${NSL.h1}시에 ${AC.name[S.ns.sub]} XP +${NSL.xp}을 받아요.`
      : planned ? `오늘 밤 자율학습을 예약했어요.\n밤 ${NSL.h0 - 12}시에 저절로 시작해요.\n다시 들어오지 않아도 돼요.`
      : used ? '오늘 밤 자율학습은 끝났어요.\n내일 밤에 다시 켤 수 있어요.'
      : night ? `켜 두면 아침 ${NSL.h1}시까지 자리 비운 보상이 ${hm(nsExtraH() * 3600)} 더 쌓여요.\n공부할 과목을 골라요.`
      : `오늘 밤 자율학습을 미리 예약해요.\n밤 ${NSL.h0 - 12}시부터 아침 ${NSL.h1}시까지 이어져요.\n공부할 과목을 골라요.`;
    const lock = on || used;
    $('#nsSubs').innerHTML = AC.keys.map(k => `<button type="button" data-ns="${k}" class="${(lock ? S.ns.sub : rt.nsSub) === k ? 'on' : ''}" aria-disabled="${lock ? 'true' : 'false'}">${AC.name[k]}</button>`).join('');
    const bon = nsBonus();
    $('#nsNote').textContent = `기숙사 Lv.${S.f.dorm}: 상한 +${hm(nsExtraH() * 3600)} (Lv마다 ${NSL.perLvMin}분, 최대 ${NSL.maxH}시간)` + (bon > 0 ? `\n오소리 선생님: 자율학습 도토리 +${Math.round(bon * 100)}%` : '\n오소리 선생님 연수로 자율학습 도토리가 늘어요');
    const go = $('#nsGo'); go.textContent = on ? '자율학습 중' : planned ? '예약했어요' : used ? '오늘은 끝났어요' : night ? '자율학습 켜기' : '오늘 밤 예약하기';
    go.setAttribute('aria-disabled', lock ? 'true' : 'false');
  }
  function cbBuy(key) {
    const it = CB.items.find(x => x.k === key); if (!it || !S || rt.paused) return false;
    if (S.tier < CB.tier) { toast('건설 부스터는 초등학교부터 써요'); return false; }
    cbApply(); nbApply();
    const now = gameNow(), base = Math.max(S.cb.until, now), next = base + it.min * 60000;
    if (next - now > CB.maxH * 3600000) { toast(`건설 부스터는 ${CB.maxH}시간까지만 모아 둘 수 있어요`); return false; }
    const c = cbCost(it); if (S.budget < c) { toast(`도토리가 ${fmt(c - S.budget)}개 모자라요`); return false; }
    S.budget -= c; S.cb.until = next; S.cb.at = now; S.st.cbBuy = (S.st.cbBuy || 0) + 1;
    sfx('quest'); toast(`건설 부스터! ${hm(Math.ceil((next - now) / 1000))} 동안 모든 공사 +100%예요${nbOn() ? `. 야간 건설과 함께 +${conAdd()}%` : ''}`);
    conRender(true); renderHUD(); ffRender(true); save();
    return true;
  }
  function cbSheet() {
    const box = $('#conCb'); if (!box) return;
    box.hidden = !S || S.tier < CB.tier;
    if (box.hidden) return;
    const on = cbOn(), key = [on ? Math.floor(cbLeft() / 60) : -1, nbOn() ? nbAdd() : 0, S.tier, ...CB.items.map(it => S.budget >= cbCost(it) ? 1 : 0)].join('|');
    if (box.dataset.key === key) return; box.dataset.key = key;
    setH(box, `<b>건설 부스터 (도토리)</b><small class="${on ? 'on' : ''}">${on ? `지금 모든 공사 +${conAdd()}%예요. ${hm(cbLeft())} 남았어요` : '쓰는 동안 모든 공사 +100%예요.'} 매일 ${NB.h0}~${NB.h1}시에 쓰면 효과 +${NB.add}%가 더해져요(학교 특별 이벤트 주간은 +${NB.addSp}%)${nbOn() ? '. 지금 야간 건설 중' : ''}.</small>` +
      `<span class="row">${CB.items.map(it => `<button type="button" class="cb-b" data-cb="${it.k}" aria-disabled="${S.budget >= cbCost(it) ? 'false' : 'true'}"><span>${it.name}</span><em>${acornIcon()}${fmt(cbCost(it))}</em></button>`).join('')}</span>`);
  }
  // 바로 완공을 쓸 수 있는 건물(이 학교급에 있고, 최고 레벨이 아니고, 공사 중이 아니고, 공사가 10초 넘게 걸리는 레벨)
  // 공사 중이면 바로 쓸 수 있고, 아니면 다음 레벨 공사가 10초 넘게 걸릴 때
  const ffCan = k => !!S && S.tier >= 1 && facKeys().includes(k) && conFreeLeft(k) && (conOn(k) ? conLeft(k) > 0 : (!facMaxed(k) && conSec(k, S.f[k] + 1) > 10 && furReady(k) && S.budget >= facCost(k)));   // 도토리와 가구가 될 때만
  const ffList = () => facKeys().filter(ffCan).sort((a, b) => (conOn(b) ? 1 : 0) - (conOn(a) ? 1 : 0));   // 공사 중인 건물부터
  /* 매점 간식 뽑기: 중학교부터 매점에서 도토리로 간식을 뽑아요
     간식이 학교 기분을 올리고(일반 +1칸, 희귀 +3칸, 하루 10칸), 1칸마다 그날 수업료 +1%. 값은 수업료(특식 데이와 기분 배수는 빼고) 30분치, 10번 270분치
     기분 10칸을 채우는 값(300분치)이 하루 +10%(144분치)보다 커서 도토리가 불어나지 않아요 */
  const SN = { tier: 2, min: 30, tenMin: 270, rare: 0.08, pity: 20, moodMax: 10, moodN: 1, moodR: 3, essNew: 2, goldNewR: 1, essDupR: 3, doneGold: 3 };
  const SN_ALL = [['01', '도토리 쿠키'], ['02', '꿀 우유'], ['03', '딸기 젤리'], ['04', '당근 머핀'], ['05', '사과 주스'], ['06', '옥수수 팝콘'], ['07', '바나나 우유'],
    ['08', '고구마 말랭이'], ['09', '블루베리 요거트'], ['10', '김밥'], ['11', '치즈 크래커'], ['12', '보리차'], ['13', '호떡'], ['14', '떡꼬치'],
    ['r1', '무지개 솜사탕', 1], ['r2', '황금 도토리 케이크', 1], ['r3', '별빛 아이스크림', 1], ['r4', '숲속 과일 파르페', 1], ['r5', '구름 마카롱', 1], ['r6', '꿀벌 왕관 꿀빵', 1]]
    .map(([k, nm, r]) => ({ id: 'snack_' + k, nm, rare: !!r }));
  const snOpen = () => !!S && !!S.sn && S.tier >= SN.tier && (S.f.store || 0) >= 1;
  const snCount = () => S && S.sn ? SN_ALL.filter(x => S.sn.got[x.id]).length : 0;
  function snSync() { if (!S || !S.sn) return; const t = gameToday(); if (dayRoll(S.sn, t)) { S.sn.mood = 0; } }
  const snMult = () => S && S.sn && S.tier >= SN.tier ? 1 + S.sn.mood / 100 : 1;
  const snBase = () => Math.max(1, rate() / (feastOn() ? 2 : 1) / snMult() / gdMult());
  const snCost = ten => Math.max(1, Math.ceil(snBase() * 60 * (ten ? SN.tenMin : SN.min) * (1 - deptX('biz') / 100)));
  const snMoodImg = () => IMG(S.sn.mood >= 6 ? 'mood_happy' : S.sn.mood >= 1 ? 'mood_ok' : 'mood_sleepy');
  function snPick() {
    const pool = S.sn.pity >= SN.pity || Math.random() < snRareP() ? SN_ALL.filter(x => x.rare) : SN_ALL.filter(x => !x.rare);
    const it = pool[Math.floor(Math.random() * pool.length)];
    S.sn.pity = it.rare ? 0 : S.sn.pity + 1;
    return it;
  }
  // 뽑기: ten이면 10번. 결과 [{ it, nw }]를 돌려줘요
  function snDraw(ten) {
    if (!snOpen() || rt.paused) return null;
    snSync();
    const c = snCost(ten);
    if (S.budget < c) { toast(`도토리가 ${fmt(c - S.budget)}개 모자라요`); return null; }
    S.budget -= c;
    const n = (ten ? 10 : 1) * (fvBonus('snack') ? 2 : 1), out = []; let e = 0, g = 0;   // 축제 수요일: 한 번 값에 두 개
    for (let i = 0; i < n; i++) {
      const it = snPick(), nw = !S.sn.got[it.id];
      S.sn.got[it.id] = (S.sn.got[it.id] || 0) + 1;
      if (nw) { if (it.rare) g += SN.goldNewR; else e += SN.essNew; }
      else if (it.rare) e += SN.essDupR;
      S.sn.mood = Math.min(snMoodMax(), S.sn.mood + (it.rare ? SN.moodR : SN.moodN));
      out.push({ it, nw });
    }
    S.sn.n += n;
    let done = false;
    if (!S.sn.gold && snCount() >= SN_ALL.length) { S.sn.gold = true; g += SN.doneGold; done = true; }
    if (e) addEss(e);
    if (g) addGold(g);
    rt.snRes = { out, e, g, done, at: Date.now() };
    sfx(out.some(x => x.it.rare) ? 'quest' : 'coin');
    const msg = [`기분 ${S.sn.mood}칸`, e ? `숲의 정수 +${e}` : '', g ? `황금 도토리 +${g}` : ''].filter(Boolean).join(', ');
    toast(done ? `간식 도감을 다 모았어요! 황금 도토리 +${SN.doneGold}, 뽑기 기계가 황금빛이 됐어요` : msg);
    renderHUD(); snRender(true); save();
    return out;
  }
  function openSn() {
    if (!snOpen()) { toast(S.tier < SN.tier ? '간식 뽑기는 중학교 매점에서 열려요' : '매점을 지으면 간식 뽑기를 할 수 있어요'); return; }
    snSync(); rt.snRes = null; askRowOff();
    const bg = IMG('snack_bg'); $('#snHead').style.backgroundImage = bg ? `url("${bg}")` : '';
    snRender(true); openModal($('#mSn')); sfx('tap');
  }
  const snImg = id => IMG(id) ? `<img src="${IMG(id)}" alt="">` : '🍪';
  function snRender(force) {
    if (!S || !S.sn || $('#mSn').hidden && !force) return;
    fvFlag($('#snPity'), 'snack', '축제: 한 번 값에 두 개');   // 축제 수요일
    const c1 = snCost(false), c10 = snCost(true), key = [S.sn.mood, S.sn.pity, c1, c10, S.budget >= c1, S.budget >= c10, rt.snRes ? rt.snRes.at : 0, S.sn.gold].join('|');
    if (!force && $('#snBtns').dataset.key === key) return; $('#snBtns').dataset.key = key;
    const mi = snMoodImg();
    $('#snMood').innerHTML = `${mi ? `<img src="${mi}" alt="">` : ''}<span>학교 기분 ${S.sn.mood}/${snMoodMax()}칸, 오늘 수업료 +${S.sn.mood}%. 간식 하나에 1칸(희귀 3칸), 자정에 비워져요</span>`;
    const R = rt.snRes;
    if (force || !R || $('#snStage').dataset.at !== String(R ? R.at : 0)) {
      $('#snStage').dataset.at = String(R ? R.at : 0);
      if (!R) $('#snStage').innerHTML = IMG('snack_machine') ? `<img class="sn-mach${S.sn.gold ? ' gold' : ''}" src="${IMG('snack_machine')}" alt="뽑기 기계">` : '🎰';
      else {
        $('#snStage').innerHTML = `<div class="sn-res${R.out.length === 1 ? ' one' : ''}">${R.out.map(({ it, nw }) => `<div class="sn-card${it.rare ? ' rare' : ''}">` +
          `<span class="cap">${IMG(it.rare ? 'snack_capsule_rare' : 'snack_capsule') ? `<img src="${IMG(it.rare ? 'snack_capsule_rare' : 'snack_capsule')}" alt="">` : '🥚'}</span>` +
          `<span class="got">${snImg(it.id)}</span><span class="ell">${esc(it.nm)}</span>${nw ? '<i class="nw">NEW</i>' : ''}</div>`).join('')}</div>`;
        const cs = $$('#snStage .sn-card'); cs.forEach((el, i) => setTimeout(() => el.classList.add('open'), 120 + i * 90));
      }
    }
    $('#snPity').textContent = `희귀 간식 확정까지 ${SN.pity + 1 - S.sn.pity}번. 간식 도감 ${snCount()}/${SN_ALL.length}종`;
    const b = (ten, nm, c) => `<button type="button" data-sn="${ten ? 10 : 1}" aria-disabled="${S.budget >= c ? 'false' : 'true'}"><b>${nm}</b><em>${acornIcon()}${fmt(c)}</em></button>`;
    $('#snBtns').innerHTML = b(false, '1번 뽑기', c1) + b(true, '10번 뽑기', c10);
  }
  function snDexRender() {
    if (!S || !S.sn) return;
    $('#snDexHead').textContent = `모은 간식 ${snCount()}/${SN_ALL.length}종 (희귀 ${SN_ALL.filter(x => x.rare && S.sn.got[x.id]).length}/6)`;
    $('#snDexGrid').innerHTML = SN_ALL.map(x => { const n = S.sn.got[x.id] || 0;
      return `<div class="sn-card${x.rare ? ' rare' : ''}${n ? '' : ' no'}">${snImg(x.id)}<span class="ell">${n ? esc(x.nm) : '???'}</span><small>${n ? `${fmt(n)}번` : x.rare ? '희귀' : ''}</small></div>`; }).join('');
  }
  function snHud() {
    const v = $('#vRate'); if (!v || !S || !S.sn) return;
    const on = S.tier >= SN.tier && S.sn.mood > 0, mi = on ? snMoodImg() : '';
    v.classList.toggle('sn-on', !!mi); if (mi && v.dataset.mood !== mi.length + ':' + S.sn.mood) { v.dataset.mood = mi.length + ':' + S.sn.mood; v.style.setProperty('--sn-mood', `url("${mi}")`); }
    const ds = $('#dsegSn'); if (ds) ds.hidden = !(S.tier >= SN.tier || snCount() > 0);
    const de = $('#dsegBx'); if (de) de.hidden = !(bxOpen() || bxCount() > 0);   // 생물 도감
  }
