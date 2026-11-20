  /* ---------- 보상 창: 받은 것을 한 창에 크게 보여 줘요 ----------
     items: [{ ic: 'acorn'|'dip'|'gold'|'fund'|'ticket'|svg 문자열, t: '도토리 +1,234' }], art: 큰 그림(기념품), big: 그림 아래 이름 */
  // 5.0.4 보상 창의 그림 문자(⚡, ★, 🏆)를 게임 그림으로: 합치기 에너지, 미션 포인트, 패스 점수, 리그 점수
  const RW_PIC = { mge: 'mg_ic_energy', mp: 'ic_ui_quest', pass: 'pass_badge', lp: 'league_ic' }, RW_ALT = { mge: '⚡', mp: '★', pass: '★', lp: '🏆' };
  const rwPic = k => IMG(k) || (window.FS_IMG180 && window.FS_IMG180[k]) || '';   // 합치기 그림은 FS_IMG180 묶음에 있어요
  function showReward(o) {
    if (rt.batch) { rt.batch.items.push(...(o.items || []).filter(Boolean)); rt.batch.n += 1; return; }   // 5.0.2 모두 받기: 보상을 모았다가 창 하나로 보여 줘요
    queueModal(() => {
      const icon = ic => ic === 'acorn' ? acornIcon() : ic === 'dip' ? dipIcon() : ic === 'gold' ? GOLD_ICON : ic === 'fund' ? fundIcon() : ic === 'ticket' ? TICKET_SVG : ic === 'ess' ? ESS_ICON() : RW_PIC[ic] && rwPic(RW_PIC[ic]) ? `<img src="${rwPic(RW_PIC[ic])}" alt="" style="width:24px;height:24px;object-fit:contain">` : RW_PIC[ic] ? RW_ALT[ic] : (ic || '');
      $('#rwTitle').textContent = headText(o.title);
      $('#rwSub').textContent = headText(o.sub || '');
      $('#rwSub').hidden = !o.sub;
      const art = $('#rwArt');
      art.hidden = !o.art;
      art.innerHTML = o.art ? `<div class="rw-art">${o.art}</div><b>${esc(o.big || '')}</b>${o.bigSub ? `<small>${esc(o.bigSub)}</small>` : ''}` : '';
      $('#rwList').innerHTML = (o.items || []).filter(Boolean).map(it => `<li><span class="rw-ic">${icon(it.ic)}</span><span>${esc(it.t)}</span></li>`).join('');
      openModal($('#mReward'));
      sfx('quest');
      return true;
    });
  }

  // 2.1.2.2 보상 칩: [[아이콘, 숫자나 짧은 말, 'sp'(금빛 강조)], ...]. 아이콘은 showReward와 같은 이름(acorn, gold, dip, ess)이나 단축권 키(tk:m5)나 그림 문자
  function rwIcon(ic) {
    if (ic === 'acorn') return acornIcon(); if (ic === 'dip') return dipIcon(); if (ic === 'gold') return GOLD_ICON; if (ic === 'ess') return ESS_ICON();
    if (typeof ic === 'string' && ic.startsWith('tk:')) { const im = IMG('ticket_' + ic.slice(3)); return im ? `<img src="${im}" alt="">` : '⏱'; }
    return esc(ic || '');
  }
  const rwChips = list => `<span class="rw-chips">${list.filter(Boolean).map(([ic, t, sp]) => `<span class="rwc${sp ? ' sp' : ''}"><i>${rwIcon(ic)}</i>${esc(String(t))}</span>`).join('')}</span>`;
  const tkChip = key => { const r = TK_REW[key]; if (!r || !S || S.tier < 1) return null; return ['tk:' + r[0], `${TK.find(x => x.k === r[0]).name.replace('권', '')} ${r[1]}장`]; };

  /* ---------- 지도 위 장면: 체험학습 버스, 숲속 운동회 ---------- */
  // 버스: 아래 교문으로 들어와 멈췄다가 다시 나가요. 떠날 때는 학생 몇 명이 걸어가서 타고, 돌아올 때는 내려서 흩어져요
  const BUS_MAP = '<g class="bus-body"><rect x="-21" y="-14" width="42" height="22" rx="5" fill="#F3C04B"/><rect x="-21" y="2" width="42" height="3" fill="#D9A23A"/>' +
    '<rect x="-17" y="-10" width="8" height="7" rx="1.5" fill="#BFE3F2"/><rect x="-6" y="-10" width="8" height="7" rx="1.5" fill="#BFE3F2"/><rect x="5" y="-10" width="7" height="7" rx="1.5" fill="#BFE3F2"/>' +
    '<rect x="14" y="-10" width="5" height="15" rx="1" fill="#E9B23C" stroke="#B9852C" stroke-width=".8"/><circle cx="-12" cy="9" r="4" fill="#3B3B2D"/><circle cx="12" cy="9" r="4" fill="#3B3B2D"/>' +
    '<circle cx="-12" cy="9" r="1.6" fill="#B9B9A8"/><circle cx="12" cy="9" r="1.6" fill="#B9B9A8"/><text x="-3" y="-15.5" text-anchor="middle" class="bus-sign">체험학습</text></g>';
  /* 3.0.0 woodani 요청: 체험학습을 모두 알게. 떠날 때 남은 친구들이 버스 옆에 모여 깡충 뛰며 깃발을 흔들고, 돌아올 때는 풍선을 들고 마중 나와요.
     친구들은 버스 옆에 서서 응원하듯 통통 뛰어요(k.hold). 버스가 떠나거나 다 내리면 다시 흩어져요 */
  function tripCrowd(mode, bx, by, skip) {
    for (const k of rt.kids) if (k.trip) { k.trip = false; k.hold = false; k.propU = ''; const f = k.g.querySelector('.trip-prop'); if (f) f.remove(); if (!k.board) { k.wait = rand(0.2, 1.2); pickTarget(k); } }
    if (!mode) return;
    const pool = rt.kids.filter(k => !k.board && !k.rider)   // 3.2.5 버스에 탈 친구(k.rider)는 배웅하지 않아요
      .sort((a, b) => Math.hypot(a.x - bx, a.y - by) - Math.hypot(b.x - bx, b.y - by)).slice(0, 5);   // 3.0.0 버스에서 가까운 친구부터(늦게 도착하지 않게)
    const flag = IMG('trip_fx_flag'), bal = IMG('trip_fx_balloons');
    pool.forEach((k, i) => {
      k.trip = true; k.hold = true; k.cheer = rand(0, 6); k.wait = 0; k.speed = 46;
      k.tx = bx - 50 + (i % 3) * 13 + rand(-2, 2); k.ty = by - 8 + Math.floor(i / 3) * 10 + rand(-2, 2);   // 버스 왼쪽 위 길가
      k.propU = mode === 'go' ? flag : bal; k.propGo = mode === 'go';   // 3.2.5 깃발과 풍선은 버스 옆에 도착한 뒤에 들어요(tripProp)
    });
  }
  function tripProp(k) {
    const u = k.propU; k.propU = ''; if (!u || !k.trip) return;
    { const mode = k.propGo ? 'go' : 'back';
      const im = document.createElementNS(NS, 'image'); im.setAttribute('class', 'trip-prop' + (mode === 'go' ? ' wave' : ' float'));
      im.setAttribute('href', u); if (mode === 'go') { im.setAttribute('x', 3); im.setAttribute('y', -22); im.setAttribute('width', 12); im.setAttribute('height', 12); } else { im.setAttribute('x', 2); im.setAttribute('y', -34); im.setAttribute('width', 11); im.setAttribute('height', 16); }
      k.g.appendChild(im);
    }
  }
  // 3.0.0 배웅, 마중 친구가 다 모였는지(아무리 늦어도 ms 뒤에는 넘어가요)
  const tripCrowdIn = () => rt.kids.filter(k => k.trip).every(k => Math.hypot(k.x - k.tx, k.y - k.ty) < 4);
  function tripWait(ms, ok) {
    return new Promise(done => { const t0 = performance.now(); const chk = () => (ok() || performance.now() - t0 > ms) ? done() : requestAnimationFrame(chk); requestAnimationFrame(chk); });
  }
  function tripPop(x, y) {   // 내리는 친구 머리 위 작은 꽃가루
    if (rt.reduced) return;
    const cs = ['#E04848', '#F3C04B', '#3F78C2', '#3FA45B', '#B05FC2'];
    for (let i = 0; i < 6; i++) {
      const c = document.createElementNS(NS, 'rect'); c.setAttribute('x', x - 1); c.setAttribute('y', y); c.setAttribute('width', 2.4); c.setAttribute('height', 3.4); c.setAttribute('fill', cs[i % cs.length]); layerFx.appendChild(c);
      const a = rand(-2.6, -0.5), d = rand(10, 20);
      c.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: `translate(${(Math.cos(a) * d).toFixed(1)}px,${(Math.sin(a) * d).toFixed(1)}px) rotate(${rand(90, 360).toFixed(0)}deg)`, opacity: 0 }], { duration: 800, easing: 'ease-out' }).onfinish = () => c.remove();
    }
  }
  function busScene(mode, n, then) {
    // woodani 요청(2026-11-10): 밤에는 학생이 돌아다니지 않으니(고등학교 밤, 수학여행 중) 버스 장면과 화면 당기기 없이 바로 보내고 맞아요. 낮에는 그대로
    if (kidsAway()) { rt.busHold = 0; if (then) then(); return; }
    zoneGo('plaza');   // 4.0.0 버스 정류장은 광장 구역
    if (rt.reduced || !layerFx.animate) { rt.busHold = 0; if (then) then(); return; }
    if (rt.bus) rt.bus.remove();
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'bus');
    g.setAttribute('aria-hidden', 'true');
    const bi = IMG('trip_bus'), bo = IMG('trip_bus_open');   // 3.0.0 버스 그림(작업지시서 45). 앞이 왼쪽
    g.innerHTML = bi ? `<g class="bus-body"><ellipse cx="2" cy="9" rx="25" ry="4" fill="rgba(40,30,10,.25)"/><image class="bus-img" href="${bi}" x="-30" y="-31" width="60" height="40"/></g>` +
      `<g class="bus-tag"><rect x="-17" y="-40" width="34" height="11" rx="5.5" fill="#FFF6E0" stroke="#C9962A" stroke-width=".8"/><text x="0" y="-32" text-anchor="middle" class="bus-sign">체험학습</text></g>` : BUS_MAP;
    layerFx.appendChild(g);
    const door = open => { const im = g.querySelector('.bus-img'); if (im && bo) im.setAttribute('href', open ? bo : bi); };
    const dust = () => { const u = IMG('trip_fx_dust'); if (!u) return; const d = document.createElementNS(NS, 'image'); d.setAttribute('href', u); d.setAttribute('x', bx + 6); d.setAttribute('y', by - 2); d.setAttribute('width', 30); d.setAttribute('height', 20); d.style.transformBox = 'fill-box'; d.style.transformOrigin = '50% 80%'; layerFx.appendChild(d);
      d.animate([{ opacity: 0.9, transform: 'translate(0,0) scale(.6)' }, { opacity: 0, transform: 'translate(14px,-6px) scale(1.4)' }], { duration: 900, easing: 'ease-out' }).onfinish = () => d.remove(); };
    // 버스가 달리는 동안 통통 흔들려요
    const bb = g.querySelector('.bus-body'); const bob = bb && bb.animate ? bb.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-1.2px)' }, { transform: 'translateY(0)' }], { duration: 260, iterations: Infinity }) : null;
    rt.bus = g;
    const [bx, by] = geo().bus;
    const at = y => `translate(${bx}px, ${y}px)`;
    const drive = (from, to, ms) => g.animate([{ transform: at(from) }, { transform: at(to) }], { duration: ms, easing: from > to ? 'cubic-bezier(.2,.7,.3,1)' : 'cubic-bezier(.6,0,.8,.4)', fill: 'forwards' });
    // 3.0.0 woodani 요청: 친구들이 걸어가다 끝나지 않게, 다 모여 응원한 뒤(최대 4초) 떠나고, 버스가 사라진 뒤에도 잠깐 손을 흔들다 흩어져요.
    // 그동안 화면을 버스 쪽으로 잠깐 당겼다가(1.6배) 원래 자리로 돌아와요
    const cam0 = { z: rt.zoom || 1, x: rt.panX, y: rt.panY }, camGo = camAt(Math.max(cam0.z, 1.6), bx - 18, by - 12);
    if (camGo) camAnim(Math.max(cam0.z, 1.6), camGo[0], camGo[1], 700, true);
    document.body.classList.add('cam-scene');
    const finish = () => setTimeout(() => { tripCrowd(null); rt.kids.forEach(k => { k.frz = false; }); document.body.classList.remove('cam-scene'); if (cam0.x != null && rt.tab === 'school') camAnim(cam0.z, cam0.x, cam0.y, 700); if (then) then(); }, 1200);
    const leave = () => tripWait(12000, tripCrowdIn).then(() => { door(false); dust(); if (bob) bob.play(); sfx('leaf'); drive(by, 490, 1300).onfinish = () => { g.remove(); if (rt.bus === g) rt.bus = null; finish(); }; });
    /* 3.2.5 woodani 요청: 학생들이 버스에 다 온 뒤에 장면이 이어지게. 탈 친구는 버스에서 가까운 친구 n명을 먼저 골라 버스가 오는 동안
       정류장 옆으로 걸어가 줄을 서고(k.rider), 버스가 서면 문으로 들어가요. 다 탈 때까지(넉넉히 15초) 기다려요 */
    const dr = [bx + (IMG('trip_bus') ? -12 : 16), by + 4];   // 3.0.0 새 버스는 앞문이 왼쪽
    const riders = mode === 'go' ? rt.kids.filter(k => !k.board).sort((a, b) => Math.hypot(a.x - dr[0], a.y - dr[1]) - Math.hypot(b.x - dr[0], b.y - dr[1])).slice(0, n) : [];
    riders.forEach((k, i) => { k.rider = true; k.wait = 0; k.speed = 46; k.tx = dr[0] - 8 - i * 7; k.ty = dr[1] + 10; });
    tripCrowd(mode === 'back' ? 'back' : 'go', bx, by, 0);   // 3.0.0 버스가 오는 동안 친구들이 먼저 모여요(떠날 때 배웅, 돌아올 때 마중)
    // 3.2.6 끊김: 지도는 SVG 한 장이라 안에서 무엇이 움직이면 지도 전체를 다시 그려요. 장면에 나오지 않는 친구는 장면이 끝날 때까지 멈춰요
    rt.kids.forEach(k => { if (!k.trip && !k.rider && !k.board) k.frz = true; });
    drive(490, by, 1300).onfinish = () => {
      if (bob) bob.pause(); dust(); door(true);
      if (mode === 'go') {
        // 줄 선 친구들이 한 명씩 버스 문으로 들어가요. 다 타면 떠나요(아무리 늦어도 15초)
        riders.forEach((k, i) => { k.board = true; k.wait = i * 0.25; k.tx = dr[0]; k.ty = dr[1]; k.speed = 40; });
        const t0 = performance.now();
        const check = () => {
          for (const k of riders) if (!k.gone && Math.hypot(k.x - k.tx, k.y - k.ty) < 3) { k.gone = true; k.g.style.opacity = '0'; sfx('tap'); }
          if (riders.every(k => k.gone) || performance.now() - t0 > 15000) {
            riders.forEach(k => { k.g.remove(); const i = rt.kids.indexOf(k); if (i >= 0) rt.kids.splice(i, 1); });
            rt.busHold = 0;
            setTimeout(leave, 400);
          } else requestAnimationFrame(check);
        };
        requestAnimationFrame(check);
      } else {
        // 돌아오면 학생들이 한 명씩 내려요
        // 3.2.5 마중 친구들이 버스 옆에 다 모인 뒤에 내려요(아무리 늦어도 8초)
        let i = 0;
        const off = () => {
          if (i >= n) { setTimeout(leave, 500); return; }
          i++;
          S.trip.kids = Math.max(0, S.trip.kids - 1);
          const before = rt.kids.length;
          syncKids(true);
          for (const k of rt.kids.slice(before)) { k.x = bx - 20; k.y = by + 4; k.wait = 0; placeKid(k, 0); tripPop(k.x, k.y - 14); }
          sfx('tap');
          setTimeout(off, 260);
        };
        tripWait(8000, tripCrowdIn).then(() => setTimeout(off, 300));
      }
    };
  }

  // 숲속 운동회: 4학년부터 2시간마다 열 수 있어요(광고를 보면 바로 다시). 40초 동안 학생들이 청팀과 백팀으로 나뉘어 운동장 트랙을 달리고,
  // 운동장에 굴러오는 공(도토리)을 주울 때마다 청팀이 1점. 백팀은 저절로 점수를 내요. 이기면 상품이 2배
  const SPORTS = { sec: 40, gap: 2 * 3600000, every: 0.65, ground: 6, cx: 165, cy: 336, rx: 100, ry: 33 };
  const sportsOpen = () => !!S && (S.tier >= 2 || (S.tier >= 1 && S.tg >= 3)) && S.f.playground >= 1;
  const sportsWait = () => Math.max(0, S.sports.next - gameNow());   // 4.0.1 대기 시간은 기기 시계가 아니라 게임 시계로 세요(시계를 앞으로 돌려도 줄지 않아요)
  const sportsCon = () => !!S && S.f.playground >= 1 && conOn('playground');   // 3.0.0 woodani 요청: 운동장 공사 중에는 운동회를 못 열어요(공사판 트랙을 달리면 이상해서)
  const sportsPrize = win => Math.max(10, nice(rate() * 180 * (win ? 2 : 1) * vpMult() * clubFestMult() * elMult('fest')));   // 2.0.0 운동부 보너스   // 1.7.0: 교감 선생님 레벨만큼 더
  function renderSportsBtn() { renderFestBtn(); }
  // 잘못 눌러서 광고가 바로 나오지 않게, 바로 열기 같은 곳에서는 한 번 더 물어봐요 (1.4.0)
  // 같은 창을 안드로이드 판 업데이트 알림(window.FOREST_ASK)에도 써요
  function askBox(o) {
    rt.adAsk = o;
    $('#adAskTitle').textContent = o.title || '광고를 볼까요?';
    { const t = $('#adAskText'); t.classList.toggle('ask-rich', !!o.html); if (o.html) t.innerHTML = o.html; else t.textContent = o.text || ''; }   // 5.0.4 o.html: 줄과 굵은 글씨를 직접 짠 창(고르게 올리기)
    $('#adAskYes').textContent = o.yes || '광고 보기';
    $('#adAskNo').textContent = o.no || '그만두기';
    openModal($('#mAdAsk'));
  }
  const askAd = (text, onYes, onNo) => askBox({ text, onYes, onNo });
  function adAskDone(ok) {
    const A = rt.adAsk; rt.adAsk = null;
    closeModal($('#mAdAsk'), () => { if (!A) return; if (ok) { if (A.onYes) A.onYes(); } else if (A.onNo) A.onNo(); });
  }
  window.FOREST_ASK = o => queueModal(() => { askBox({ title: o.title, text: o.text, yes: o.yes, no: o.no, onYes: () => o.done(true), onNo: () => o.done(false) }); return true; });
  window.FOREST_SAVE = () => { try { save(); } catch (e) { /* 저장 실패는 넘어가요 */ } };
  function startSports(viaAd) {
    if (rt.sports || !sportsOpen()) return;
    if (tr2Busy()) { toast(tr2Busy()); return; }   // 3.2.0
    if (festNight()) { toast(`${FEST.sports.name}는 아침 6시부터 열 수 있어요`); return; }   // 3.1.1
    if (sportsCon()) { toast(`${FAC.playground.name} 공사가 끝나면 ${FEST.sports.name}를 열 수 있어요`); return; }   // 3.0.0
    const go = () => {
      setTab('school'); closeSheet(); zoneGo('sports');   // 4.0.0 운동회는 체육 구역에서
      $('#scroller').scrollTo({ top: $('#scroller').scrollHeight, behavior: rt.reduced ? 'auto' : 'smooth' });
      rt.sports = { t: SPORTS.sec, blue: 0, white: 0, spawn: 0, foe: 1.2, intro: 3 };
      feverOn(true);
      S.sports.next = gameNow() + SPORTS.gap;
      rt.kids.forEach((k, i) => {
        k.team = i % 2 ? 'w' : 'b'; k.ang = (i / Math.max(1, rt.kids.length)) * Math.PI * 2; k.spd = rand(0.55, 0.85);
        k.g.insertAdjacentHTML('beforeend', `<rect class="band ${k.team}" x="-6.4" y="-4.6" width="12.8" height="2.4" rx="1.2"/>`);
      });
      $('#sportsBar').hidden = false;
      festFocusNow();
      renderSportsBar();
      musicSync(); buzz(20);   // 2.3.1 woodani: 행사 시작 종소리 뺌
      save(); renderSportsBtn();
    };
    go();   // 5.0.2 옛 운동회 창(#mSports)은 2.x부터 열리지 않아 걷었어요. 운동회는 학교 행사 창에서 열어요
  }
  function renderSportsBar() {
    const R = rt.sports;
    if (!R) return;
    $('#spBlue').textContent = R.blue; $('#spWhite').textContent = R.white;
    $('#spTime').textContent = R.intro > 0 ? SPORTS.sec : Math.ceil(R.t);
    $('#sportsBar').classList.toggle('hurry', R.t <= 5 && !(R.intro > 0));
  }
  // 놀이 루프에서 불러요: 학생들은 트랙을 돌고, 공이 굴러오고, 백팀 점수가 올라가요
  function updateSports(dt) {
    const R = rt.sports;
    if (!R) return;
    fxeTick();   // 5.3.0 행사 효과층 깨우기
    renderSportsBar();
    if (feverIntro(R, dt, FEST.sports.name, '굴러오는 공을 주워서 청팀을 응원해요')) return;
    if (R.ending) return;
    R.t -= dt;
    R.spawn += dt;
    if (R.spawn >= SPORTS.every) { R.spawn = 0; if (rt.drops.length < SPORTS.ground) spawnDrop(false); }
    R.foe -= dt;
    if (R.foe <= 0) { R.foe = rand(1.1, 2.1); R.white += 1; fxeWhite(); }
    for (const k of rt.kids) {
      if (k.board || k.ang === undefined) continue;
      k.ang += dt * k.spd;
      k.tx = SPORTS.cx + Math.cos(k.ang) * SPORTS.rx * (k.team === 'b' ? 1 : 0.86);
      k.ty = SPORTS.cy + Math.sin(k.ang) * SPORTS.ry * (k.team === 'b' ? 1 : 0.8);
      k.wait = 0; k.speed = 80;
    }
    renderSportsBar();
    if (R.t <= 0 && !R.ending) { R.ending = true; fxeSportsEnd(R.blue > R.white); feverEnd(endSports); }
  }
  function endSports() {
    const R = rt.sports; if (!R) return;
    rt.sports = null; fxeReset();
    rt.kids.forEach(k => { delete k.ang; delete k.team; k.speed = rand(14, 22); pickTarget(k); const b = k.g.querySelector('.band'); if (b) b.remove(); });
    $('#sportsBar').hidden = true;
    S.st.sports += 1;
    const win = R.blue > R.white, tie = R.blue === R.white;
    addLeague(win ? LP.festWin : LP.festLose);
    rt.sportsWin = win; rt.prizeName = '운동회'; rt.prizeId = 'sports';
    $('#srTitle').textContent = win ? '청팀 승리!' : tie ? '무승부!' : '백팀 승리!';
    $('#srScore').textContent = `청팀 ${R.blue} : ${R.white} 백팀`;
    $('#srText').textContent = (win ? `공을 ${R.blue}개나 주웠어요! 이긴 상품으로 도토리를 받아요.` : `다음에는 공을 더 빨리 주워 봐요. 그래도 도토리를 조금 받아요.`) + `${vpLv() ? ` ${profText('교감 선생님')} 덕분에 +${VP.per * vpLv()}%예요.` : ''}`;
    $('#srPrize').textContent = fmt(sportsPrize(win));
    $('#srArt').innerHTML = `<svg viewBox="-26 -19 52 38" aria-hidden="true">` + ['rabbit', 'fox', 'chick'].map((sp, i) => `<g transform="translate(${(i - 1) * 15} ${i === 1 ? -3 : 1})">${kidSVG(sp, i)}<rect class="band ${win ? 'b' : 'w'}" x="-6.4" y="-4.6" width="12.8" height="2.4" rx="1.2"/></g>`).join('') + '</svg>';
    sfx(win ? 'quest' : 'done'); buzz(20);
    musicSync(); save(); renderSportsBtn(); checkQuests(); renderAffordance();
    queueModal(() => { openModal($('#mSportsEnd')); return true; });
  }
  // 1.7.2: 학교 행사(보물찾기, 환영회, 운동회, 학예회, 졸업 사진)를 이기면 주던 황금 도토리 1개는 행사마다 하루 한 번만 줘요
  function festGoldLeft(id) { if (!S.fg || S.fg.day !== gameToday()) return true; return !S.fg.got.includes(id); }
  function festGoldTake(id) {
    if (!S.fg || S.fg.day !== gameToday()) S.fg = { day: gameToday(), got: [] };
    if (S.fg.got.includes(id)) return false;
    S.fg.got.push(id); return true;
  }
  function claimSports(x) {
    const v = sportsPrize(rt.sportsWin) * x;
    if (rt.sportsWin && x === 1) acGain('pe', 15);   // 2.0.1 공부: 운동회에서 이기면 체육 XP 15(광고 두 배 받기에서는 한 번만)
    S.budget += v; earn(v);
    const g = false;   // 3.1.1 woodani 결정: 학교 행사(운동회 포함)는 황금 도토리를 주지 않아요. S.fg는 옛 저장 호환으로 남겨요
    floatText(SPORTS.cx, SPORTS.cy - 30, '+' + fmt(v), 'gold');
    toast(`${rt.prizeName || '학교 행사'} 상품 도토리 +${fmt(v)}${g ? ', 황금 도토리 +1' : ''}`);
    sfx('coin'); save(); renderHUD();
  }

