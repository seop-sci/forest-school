  /* ---------- 현장체험학습 ----------
     3학년부터 열려요. 한 번에 한 곳씩, 실제 시간으로 30분에서 8시간 다녀와요. 다녀오는 동안에도 학교는 그대로 돌아가요.
     돌아오면 도토리(수업료 반만큼), 수료증, 먼 곳은 황금 도토리, 그리고 그곳 기념품 하나를 가져와요.
     기념품은 하나에 수업료 +2%, 한 곳의 세 가지를 다 모으면 +10% 더. 졸업해도 남아요.
     광고: 다녀오는 중에는 남은 시간을 줄이고(전체의 1/4, 적어도 15분), (1.4.0부터 돌아왔을 때 2배 받기는 없어요) */
  const TRIPS = [
    { id: 'hill', name: '뒷산 숲 산책', min: 30, dip: 1, gold: 0, need: 0, c: '#6E9446', say: '도토리 나무가 우거진 뒷산을 한 바퀴 돌아요',
      souv: ['솔방울 액자', '다람쥐 발자국 화석', '네잎클로버 책갈피',
        '도토리 모자 배지', '이끼 유리병', '버섯 지우개', '나뭇잎 탁본', '딱따구리 나무패', '단풍잎 코팅 카드', '산딸기 잼 병', '나무껍질 수첩', '뒷산 지도 손수건'] },
    { id: 'creek', name: '시냇가 물놀이', min: 60, dip: 2, gold: 0, need: 0, c: '#3E8FC2', say: '맑은 시냇물에서 송사리를 관찰해요',
      souv: ['반짝 조약돌', '송사리 그림', '물수제비 돌',
        '올챙이 그림 컵', '물방개 배지', '징검다리 돌 문진', '버들피리', '수달 발자국 본', '물레방아 모형', '소금쟁이 스티커', '뗏목 모형', '시냇가 뜰채'] },
    { id: 'museum', name: '숲속 박물관', min: 120, dip: 3, gold: 1, need: 2, c: '#A8743C', say: '옛날 숲 이야기와 공룡 뼈를 구경해요',
      souv: ['공룡 뼈 모형', '옛날 도토리 동전', '부엉이 깃털 펜',
        '매머드 털 인형', '삼엽충 화석', '옛날 학교 종', '동굴 벽화 엽서', '호박 구슬', '옛 지도 두루마리', '토기 조각 퍼즐', '박물관 입장권', '공룡 알 지우개'] },
    { id: 'beach', name: '푸른 바닷가', min: 240, dip: 5, gold: 1, need: 4, c: '#2FA3B5', say: '갯벌에서 조개를 줍고 파도 소리를 들어요',
      souv: ['소라 껍데기', '불가사리 열쇠고리', '모래 병',
        '갈매기 깃털', '조개 목걸이', '등대 오르골', '꽃게 장난감', '해초 책갈피', '바다 유리 조각', '모래성 틀', '돌고래 호루라기', '파도 엽서'] },
    { id: 'star', name: '별빛 천문대', min: 480, dip: 8, gold: 1, need: 7, c: '#5B4FA8', say: '산꼭대기 천문대에서 하룻밤 별을 봐요',
      souv: ['별자리 지도', '망원경 배지', '운석 조각',
        '달 지도 포스터', '혜성 열쇠고리', '야광 별 스티커', '토성 팽이', '북두칠성 손전등', '별똥별 소원 병', '천문대 저금통', '은하수 엽서', '우주 비행사 배지'] }
  ];
  // 4.1.1 대학교 현장 답사: 갈 곳 이름과 설명을 조사하는 말투로(시간, 보상, 기념품은 그대로)
  const TRIPS_U = { hill: ['뒷산 식생 답사', '캠퍼스 뒷산을 돌며 나무와 풀을 조사해요'], creek: ['시냇가 수질 답사', '시냇물 수질을 재고 송사리를 기록해요'], museum: ['숲속 박물관', '옛 숲의 기록과 공룡 화석을 조사해요'],
    beach: ['푸른 바닷가', '갯벌 생물을 조사하고 표본을 모아요'], star: ['별빛 천문대', '산꼭대기 천문대에서 밤새 별을 관측해요'] };
  for (const T of TRIPS) for (const [f, i] of [['name', 0], ['say', 1]]) { const t0 = T[f]; Object.defineProperty(T, f, { get: () => uniNow() && TRIPS_U[T.id] ? TRIPS_U[T.id][i] : t0, enumerable: true, configurable: true }); }
  const TRIP = Object.fromEntries(TRIPS.map(t => [t.id, t]));
  const SOUV_IDS = new Set(TRIPS.flatMap(t => t.souv.map((_, i) => `${t.id}:${i}`)));
  const TRIP_ART = {
    hill: '<path d="M-10 6 L-3 -6 L1 0 L4 -4 L10 6 Z" fill="#6E9446"/><circle cx="5" cy="-7" r="2" fill="#F3C04B"/>',
    creek: '<path d="M-10 -1 Q-5 -5 0 -1 T10 -1 M-10 4 Q-5 0 0 4 T10 4" fill="none" stroke="#3E8FC2" stroke-width="2.2" stroke-linecap="round"/>',
    museum: '<path d="M-9 -3 L0 -9 L9 -3 Z" fill="#A8743C"/><rect x="-8" y="-3" width="16" height="2" fill="#C99A5B"/><path d="M-6 -1 v7 M-2 -1 v7 M2 -1 v7 M6 -1 v7" stroke="#C99A5B" stroke-width="1.8"/><rect x="-9" y="6" width="18" height="2" fill="#A8743C"/>',
    beach: '<path d="M-8 6 Q-8 -6 0 -7 Q8 -6 8 6 Z" fill="#F4D6B0"/><path d="M-4 5 Q-3 -3 0 -6 M0 5 V-6 M4 5 Q3 -3 0 -6" fill="none" stroke="#D9A066" stroke-width="1.2"/>',
    star: '<path d="M0 -9 L2.4 -2.6 L9 -2.6 L3.6 1.6 L5.6 8 L0 4 L-5.6 8 L-3.6 1.6 L-9 -2.6 L-2.4 -2.6 Z" fill="#F3C04B"/>'
  };
  const tripIcon = (id, cls) => IMG('trip_dest_' + id) ? `<img class="tr-dest${cls ? ' ' + cls : ''}" src="${blobUrl(IMG('trip_dest_' + id))}" alt="" aria-hidden="true" decoding="async">` : `<svg viewBox="-11 -11 22 22" aria-hidden="true"${cls ? ` class="${cls}"` : ''}>${TRIP_ART[id]}</svg>`;   // 3.0.0 목적지 그림(작업지시서 45)
  const BUS = '<svg viewBox="-12 -12 24 24" aria-hidden="true"><rect x="-10" y="-7" width="20" height="12" rx="3" fill="#F3C04B"/><rect x="-8" y="-5" width="4.5" height="4" rx="1" fill="#BFE3F2"/><rect x="-2.2" y="-5" width="4.5" height="4" rx="1" fill="#BFE3F2"/><rect x="3.6" y="-5" width="4.4" height="4" rx="1" fill="#BFE3F2"/><rect x="-10" y="1" width="20" height="1.6" fill="#D9A23A"/><circle cx="-5.5" cy="5.5" r="2.4" fill="#3B3B2D"/><circle cx="5.5" cy="5.5" r="2.4" fill="#3B3B2D"/></svg>';
  const tripOpen = () => !!S && (S.trip.open || S.tier >= 2 || (S.tier >= 1 && S.tg >= 2));
  const souvN = () => S.trip.souv.length;
  // 4.4.2 woodani 결정(2026-11-15): 기념품을 곳마다 3종에서 12종으로. 다 모으면 겹친 기념품 몫으로 정수만 계속 나오던 것을 늦춰요.
  // 처음 세 가지(SOUV_OLD)는 예전 그대로 하나에 +2%, 세 가지를 다 모으면 +10%. 새 아홉 가지는 하나에 +1%, 열두 가지를 다 모으면 +5% 더. 처음 세 가지부터 먼저 나와요
  const SOUV_OLD = 3;
  const souvOld = () => S.trip.souv.filter(k => +k.split(':')[1] < SOUV_OLD).length;
  const tripSetsDone = () => TRIPS.filter(t => t.souv.slice(0, SOUV_OLD).every((_, i) => S.trip.souv.includes(`${t.id}:${i}`))).length;
  const tripSetsAll = () => TRIPS.filter(t => t.souv.every((_, i) => S.trip.souv.includes(`${t.id}:${i}`))).length;
  const tripMult = () => { const o = souvOld(); return 1 + 0.02 * o + 0.01 * (souvN() - o) + 0.1 * tripSetsDone() + 0.05 * tripSetsAll(); };
  const tripLeft = () => Math.max(0, S.trip.end - gameNow());   // 2.0.0 보안 점검(1-6): 게임 시계
  const tripBack = () => !!S.trip.cur && tripLeft() <= 0;
  const tripCut = T => Math.max(30, Math.round(T.min / 4));   // 광고 한 편에 줄어드는 분(2.3.1 woodani 결정: 적어도 30분)
  function tripReward(T) {
    return { acorns: Math.max(10, nice(rate() * T.min * 60 * 0.5 * rtEvt())), dip: T.dip, gold: T.gold };   // 5.0.0 연구 트리 행사
  }
  function hms(ms) {
    const s = Math.ceil(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    return h ? `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}` : `${m}:${String(x).padStart(2, '0')}`;
  }
  const minText = m => m >= 60 ? `${m / 60}시간` : `${m}분`;
  /* ===== 3.2.0 수학여행(설계안 "3.2.0 설계안 (수학여행)", 2026-11-05 woodani 결정): 고등학교부터 학년마다 한 번.
     옛 도시, 섬 마을, 큰 도시 중 한 곳 → 들를 곳 세 군데에서 활동을 하나씩 고르고 → 단체 사진 → 학생들이 3시간 동안 떠나 있어요(수업료는 그대로).
     돌아오면 도토리(수업료 2시간치), 숲의 정수, 그곳 기념품(지도 장식), 앨범에 사진 한 쪽. 숫자는 본부 제안 ===== */
  const tr2Nm = () => uniOn() ? '배낭여행' : '수학여행';   // 4.1.1 woodani: 대학교에서는 배낭여행이라고 불러요(이름만, 규칙과 저장은 그대로)
  const tr2Key = () => `${S.tier}-${S.tg}`;
  const tr2Open = () => !!S && !!S.tr2 && S.tier >= TR2.tier;
  const tr2Away = () => !!(S && S.tr2 && S.tr2.cur && S.tr2.cur.st === 'go' && gameNow() >= (S.tr2.cur.dep || 0) && gameNow() < S.tr2.cur.back);
  // 3.2.1 woodani 요청: 출발 시간(6~17시) 밖에서도 미리 골라 사진까지 찍으면 다음 아침 6시에 떠나요(야간 자율학습 예약처럼)
  const tr2Rsv = () => !!(S && S.tr2 && S.tr2.cur && S.tr2.cur.st === 'go' && gameNow() < (S.tr2.cur.dep || 0));
  const tr2NextDep = () => { const t = gameNow(), h = kstHour(t); return t + Math.round(((TR2.h0 - h + 24) % 24) * 3600000); };
  const tr2Ready = () => !!(S && S.tr2 && S.tr2.cur && S.tr2.cur.st === 'go' && gameNow() >= S.tr2.cur.back);
  const tr2Day = () => { const h = kstHour(gameNow()); return h >= TR2.h0 && h < TR2.h1; };
  const tr2Placed = () => S.deco.lay.reduce((a, L) => a + L.filter(x => typeof x === 'string' && x.startsWith('sv2_')).length, 0);
  const tr2Busy = () => tr2Away() ? `${tr2Nm()} 중이에요. 학생들이 돌아오면 할 수 있어요` : '';
  function sanitizeTr2(d, s) {
    const c = d.tr2 && typeof d.tr2 === 'object' ? d.tr2 : {}, n = v => typeof v === 'number' && isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
    s.tr2 = freshTr2();
    if (c.done && typeof c.done === 'object') for (const k of Object.keys(c.done).slice(0, 40)) if (/^\d-\d$/.test(k)) s.tr2.done[k] = 1;
    s.tr2.go = n(c.go); s.tr2.back = n(c.back);
    const ids = new Set(TR2_PL.flatMap(P => P.souv.map(v => v[0])));
    s.tr2.souv = (Array.isArray(c.souv) ? c.souv : []).filter((v, i, a) => ids.has(v) && a.indexOf(v) === i);
    const u = c.cur;
    if (u && typeof u === 'object' && TR2_BY[u.pl] && /^\d-\d$/.test(u.k)) {
      const pk = (Array.isArray(u.pk) ? u.pk : []).filter(v => v === 0 || v === 1).slice(0, 3);
      const st = u.st === 'go' ? 'go' : pk.length >= 3 ? 'photo' : 'pick';
      s.tr2.cur = { pl: u.pl, k: u.k, st, pk, start: n(u.start), back: n(u.back), dep: st === 'go' ? n(u.dep) : 0, kids: (Array.isArray(u.kids) ? u.kids : []).filter(sp => DEX_STUDENTS.includes(sp)).slice(0, 11) };   // 3.2.1 dep: 예약한 출발 시각
      if (st === 'go' && !(s.tr2.cur.back > 0)) s.tr2.cur.back = Date.now();
      if (s.tr2.cur.dep > s.tr2.cur.back) s.tr2.cur.dep = 0;
    }
  }
  // 단체 사진: 그곳 배경 앞에 두 줄로 서요(뒷줄 5, 앞줄 6). 고른 둘째 활동에 따라 소품이 달라요
  function tr2Photo(pl, pk, kids, cls) {
    const P = TR2_BY[pl]; if (!P) return '';
    const pos = [[22, 50], [36, 49], [50, 48], [64, 49], [78, 50], [15, 64], [29, 65], [43, 66], [57, 66], [71, 65], [85, 64]];
    const prop = P.props[(pk && pk[1]) || 0];
    return `<div class="tr2-photo${cls ? ' ' + cls : ''}">${IMG(P.photo) ? `<img class="bg" src="${IMG(P.photo)}" alt="">` : ''}` +
      kids.slice(0, 11).map((sp, i) => `<span class="k" style="left:${pos[i][0]}%;top:${pos[i][1]}%">${kidAvatar(sp)}</span>`).join('') +
      (IMG(prop) ? `<img class="pp" src="${IMG(prop)}" alt="">` : '') + '</div>';
  }
  function renderTr2Btn() {
    const b = $('#btnTr2'); if (!b) return;
    const cur = S.tr2 && S.tr2.cur, on = tr2Open() && (!!cur || !S.tr2.done[tr2Key()]);
    setHid(b, !on); if (!on) return;   // 3.2.6 바뀐 때만
    const txt = !cur ? (tr2Day() ? '출발' : '예약') : cur.st !== 'go' ? '여행 중' : tr2Rsv() ? '6시 출발' : tr2Ready() ? '도착!' : hms(Math.max(0, cur.back - gameNow()));
    if (rt.tr2Txt !== txt) { rt.tr2Txt = txt; $('#tr2N').textContent = txt; b.classList.toggle('ready', !cur || tr2Ready() || cur.st !== 'go'); b.setAttribute('aria-label', `${tr2Nm()}, ${txt}`); }
    { const lb = b.querySelector('.b-lb'); if (lb && lb.textContent !== tr2Nm()) { lb.textContent = tr2Nm(); b.setAttribute('aria-label', `${tr2Nm()}, ${txt}`); } }
    if (!$('#tr2Ic').firstChild && IMG('ic_trip2')) $('#tr2Ic').innerHTML = `<img src="${IMG('ic_trip2')}" alt="">`;
    if (rt.modalOpen === $('#mTr2') && cur && cur.st === 'go') {
      if (rt.tr2View !== (tr2Ready() ? 'back' : tr2Rsv() ? 'rsv' : 'go')) renderTr2();
      else if (!tr2Ready()) { const L = $('#tr2Left'); if (L) L.textContent = tr2Rsv() ? `떠나기까지 ${hms(cur.dep - gameNow())}` : `${hms(cur.back - gameNow())} 남았어요`; }
    }
  }
  // 지도에서 학생을 숨기는 표시(고등학교 밤과 같은 방식)
  function tr2Tick() {
    if (!S || !S.tr2 || !map) return;
    const away = tr2Away();
    if (map.classList.contains('tr2-away') !== away) { map.classList.toggle('tr2-away', away); if (!away) syncKids(false); }
  }
  function openTr2() {
    if (rt.paused || !tr2Open()) { if (S && S.tier < TR2.tier) toast('수학여행은 고등학교부터 갈 수 있어요'); return; }
    if (rt.modalOpen && rt.modalOpen !== $('#mTr2')) return;
    sfx('tap'); rt.tr2Msg = ''; setT($('#tr2Title'), tr2Nm()); renderTr2();
    if (rt.modalOpen !== $('#mTr2')) openModal($('#mTr2'));
  }
  function renderTr2() {
    const T = S.tr2, cur = T.cur, P = cur && TR2_BY[cur.pl];
    let h = rt.tr2Msg ? `<p class="tr-got">${esc(rt.tr2Msg)}</p>` : '';
    rt.tr2View = !cur ? 'idle' : cur.st === 'go' ? (tr2Ready() ? 'back' : tr2Rsv() ? 'rsv' : 'go') : cur.st;
    if (!cur) {
      const used = !!T.done[tr2Key()];
      h += `<p class="tr-lead">${used ? `${yearNo()}학년 ${tr2Nm()}은 다녀왔어요. 다음 학년에 또 떠나요.` : '학년마다 한 번, 한 곳을 골라 떠나요. 고르면 바꿀 수 없어요. 그곳 세 군데에서 활동을 골라요.'}\n${TR2.hours}시간 동안 떠나 있어도 수업료는 그대로 들어와요.</p>`;
      if (!used && !tr2Day()) h += '<p class="fine">지금은 출발 시간(아침 6시~오후 5시)이 아니에요. 미리 골라 단체 사진까지 찍어 두면 아침 6시에 떠나도록 예약돼요.</p>';
      h += '<div class="tr2-list">' + TR2_PL.map(Q => {
        const got = Q.souv.filter(v => T.souv.includes(v[0])).length, can = !used && !S.trip.cur && !festBusy();
        const sel = can && rt.tr2Sel === Q.id;   // 5.0.1.6 C-01 누르면 먼저 물어봐요
        return `<button class="tr2-pl${sel ? ' sel' : ''}" type="button" data-tr2="sel:${Q.id}"${can ? '' : ' aria-disabled="true"'} style="--tc:${Q.c}">` +
          (IMG(Q.img) ? `<img src="${IMG(Q.img)}" alt="">` : '') + `<b>${Q.name}</b><span>${Q.say}</span><small>기념품 ${got}/3${can ? ', 여기로 가기 ›' : ''}</small></button>` +
          (sel ? `<div class="tr2-ok" style="--tc:${Q.c}"><p>${euro(Q.name)} 떠날까요? 이번 학년에는 바꿀 수 없어요. ${TR2.hours}시간 동안 학교 행사, 체험학습, 진로 상담은 쉬어요.</p><div class="btn-row"><button class="btn-sub" type="button" data-tr2="sel:">다시 고르기</button><button class="cta" type="button" data-tr2="p:${Q.id}">떠나기</button></div></div>` : '');
      }).join('') + '</div>';
      if (!used && S.trip.cur) h += '<p class="fine">체험학습 간 친구들이 돌아오면 떠날 수 있어요.</p>';
    } else if (cur.st === 'pick') {
      const i = cur.pk.length, St = P.stops[i];
      h += `<div class="tr2-stop">${IMG(St.img) ? `<img src="${IMG(St.img)}" alt="">` : ''}<span class="tr2-step">${P.name}, ${i + 1}/3 ${St.name}</span></div>` +
        `<p class="tr-lead">어떤 활동을 할까요?</p><div class="tr2-acts">` +
        St.acts.map((a, j) => `<button class="cta${j ? ' sub' : ''}" type="button" data-tr2="a:${j}">${a[0]} <small>${AC.name[a[1]]} XP +${TR2.xp}</small></button>`).join('') + '</div>';
    } else if (cur.st === 'photo') {
      h += `<p class="tr-lead">${P.name}에서 단체 사진을 찍어요. 모두 웃어요!</p>` + tr2Photo(cur.pl, cur.pk, cur.kids) +
        `<div class="btn-row"><button class="cta" type="button" data-tr2="snap">찰칵!</button></div>`;
    } else if (tr2Rsv()) {   // 3.2.1 예약
      h += tr2Photo(cur.pl, cur.pk, cur.kids, 'small') + `<p class="tr-left" id="tr2Left">떠나기까지 ${hms(cur.dep - gameNow())}</p>` +
        `<p class="fine">${P.name} ${tr2Nm()}을 예약했어요. 아침 ${TR2.h0}시에 떠나서 ${TR2.h0 + TR2.hours}시에 돌아와요.</p>`;
    } else if (!tr2Ready()) {
      const left = cur.back - gameNow();
      h += tr2Photo(cur.pl, cur.pk, cur.kids, 'small') + `<p class="tr-left" id="tr2Left">${hms(left)} 남았어요</p>` +
        `<p class="fine">${P.name}에 가 있어요. 학교 행사, 체험학습, 진로 상담은 돌아오면 할 수 있어요.</p>` +
        `<div class="btn-row" style="flex-wrap:wrap">${TK.filter(t => S.tk[t.k] > 0).map(t => `<button class="btn-sub small" type="button" data-tr2="t:${t.k}">${t.name} (${S.tk[t.k]}장)</button>`).join('')}</div>`;
    } else {
      h += `<p class="tr-lead">${P.name}에서 돌아왔어요! 기념품과 사진을 가져왔어요.</p>` + tr2Photo(cur.pl, cur.pk, cur.kids, 'small') +
        `<div class="tr-gift"><span class="tr-rw">${acornIcon()}<b>${fmt(minAcorns(TR2.acMin))}</b></span><span class="tr-rw">${IMG('ic_essence') ? `<img src="${IMG('ic_essence')}" alt="" style="width:16px;height:16px">` : ''}<b>${TR2.ess}</b></span></div>` +
        `<div class="btn-row"><button class="cta" type="button" data-tr2="get">받기</button></div>`;
    }
    h += `<h3 class="tr-h">${tr2Nm()} 기념품 <small>${T.souv.length}/9종</small></h3><div class="tr-souv">` +
      TR2_PL.flatMap(Q => Q.souv.map(([id, nm]) => { const own = T.souv.includes(id);
        return `<span class="sv${own ? ' own' : ''}" style="--tc:${Q.c}">${own && IMG(id) ? `<img src="${IMG(id)}" alt="">` : '<b>?</b>'}<small>${own ? nm : Q.name}</small></span>`; })).join('') +
      '</div><p class="fine tr-fine">기념품은 꾸미기 가게에서 지도에 놓아요. 졸업해도 남아요.</p>';
    $('#tr2Body').innerHTML = h;
  }
  function tr2Act(v) {
    const T = S.tr2, cur = T.cur;
    if (v.startsWith('sel:')) { rt.tr2Sel = v.slice(4); sfx('tap'); renderTr2(); return; }   // 5.0.1.6 C-01
    if (v.startsWith('p:')) {
      const P = TR2_BY[v.slice(2)];
      if (!P || cur || T.done[tr2Key()]) return;
      if (S.trip.cur) { toast('체험학습 간 친구들이 돌아오면 떠날 수 있어요'); return; }
      if (festBusy()) return;
      // 사진에 설 학생: 명부(고등학교) 학생 종류를 먼저, 모자라면 학교 동물 종류를 돌려 가며(최대 11명)
      const sp = speciesList(), pool = (rosterOn() && S.roster && S.roster.list.length ? S.roster.list.map(x => x.sp) : []).filter(v => DEX_STUDENTS.includes(v));
      const want = Math.min(11, Math.max(3, Math.floor(S.students) || 3)), kids = [];
      for (let i = 0; kids.length < want && i < want * 4; i++) { const v = i < pool.length ? pool[i] : sp[i % sp.length]; if (v && (kids.filter(z => z === v).length < 2 || i >= want * 2)) kids.push(v); }
      T.done[tr2Key()] = 1; T.go += 1; rt.tr2Sel = '';
      T.cur = { pl: P.id, k: tr2Key(), st: 'pick', pk: [], start: gameNow(), back: 0, kids };
      sfx('buy'); rt.tr2Msg = ''; rt.tr2Txt = ''; save(); renderTr2(); renderTr2Btn(); checkQuests(); return;
    }
    if (!cur) return;
    const P = TR2_BY[cur.pl];
    if (v.startsWith('a:') && cur.st === 'pick') {
      const j = +v.slice(2), a = P.stops[cur.pk.length].acts[j]; if (!a) return;
      cur.pk.push(j); acGain(a[1], TR2.xp); sfx('quest');
      rt.tr2Msg = a[2];
      if (cur.pk.length >= 3) cur.st = 'photo';
      save(); renderTr2(); return;
    }
    if (v === 'snap' && cur.st === 'photo') {
      // 진로 관심: 고른 활동 과목이 학생 진로 후보 과목과 같으면 그 학생 관심 +1(여행 한 번에 한 번)
      let opened = 0;
      if (S.cs && S.tier >= CS.tier && rosterOn()) {
        csEnsure();
        const subj = new Set(cur.pk.map((j, i) => P.stops[i].acts[j][1]));
        for (const x of S.roster.list) if (Array.isArray(x.jc) && x.jo.length < 3 && x.jc.some(j => subj.has(AB_KEY[JOBS[j].ab]))) { x.ji = Math.round((x.ji + 1) * 100) / 100; opened += csOpenCards(x).length; }
      }
      const dep = tr2Day() ? 0 : tr2NextDep();   // 3.2.1 출발 시간 밖이면 다음 아침 6시에 떠나요
      cur.st = 'go'; cur.dep = dep; cur.back = (dep || gameNow()) + TR2.hours * 3600000;
      sfx('done'); buzz(15);
      rt.tr2Msg = (dep ? `찰칵! ${tr2Nm()}을 예약했어요. 아침 ${TR2.h0}시에 떠나서 ${TR2.h0 + TR2.hours}시에 돌아와요.` : `찰칵! 멋진 사진이 나왔어요. 학생들은 ${TR2.hours}시간 뒤에 돌아와요.`) + (opened ? `\n여행 덕분에 진로 카드가 ${opened}장 열렸어요!` : '');
      rt.tr2Txt = ''; save(); tr2Tick(); renderTr2(); renderTr2Btn(); syncKids(false); return;
    }
    if (v.startsWith('t:') && cur.st === 'go' && !tr2Ready() && !tr2Rsv()) {
      const t = TK.find(x => x.k === v.slice(2)); if (!t || S.tk[t.k] < 1) return;
      S.tk[t.k] -= 1; S.st.tkUsed = (S.st.tkUsed || 0) + 1; cur.back -= t.sec * 1000;
      sfx('tap'); rt.tr2Txt = ''; save(); tr2Tick(); renderTr2(); renderTr2Btn(); return;
    }
    if (v === 'get' && tr2Ready()) {
      const ac = minAcorns(TR2.acMin);
      S.budget += ac; earn(ac); addEss(TR2.ess);
      // 기념품: 고른 길(활동 합)에 맞는 것, 이미 있으면 그곳의 다음 것, 셋 다 있으면 숲의 정수
      const base = (cur.pk[0] + cur.pk[1] * 2 + cur.pk[2]) % 3, order = [0, 1, 2].map(i => P.souv[(base + i) % 3]);
      const sv = order.find(v2 => !T.souv.includes(v2[0]));
      let got = `도토리 ${fmt(ac)}, 숲의 정수 ${TR2.ess}`;
      if (sv) { T.souv.push(sv[0]); S.deco.own[sv[0]] = 1; got += `, 기념품 ${sv[1]}`; } else { addEss(TR2.dupEss); got += `, 숲의 정수 +${TR2.dupEss}(기념품은 다 모았어요)`; }
      const t0 = +cur.k.split('-')[0], y0 = +cur.k.split('-')[1] + 1;
      S.alb.push({ t: t0, y: y0, k: 'tr', at: Date.now(), st: Math.floor(S.students), f: {}, bs: {}, dip: 0, kids: cur.kids.slice(0, 6), kx: cur.kids.slice(6, 11), el: '', ph: true, ltr: null, v: 0, old: false, pl: cur.pl, pk: cur.pk.slice() });
      if (S.alb.length > BF.albMax) S.alb.splice(0, S.alb.length - BF.albMax);
      T.back += 1; T.cur = null;
      sfx('done'); rt.tr2Msg = `받았어요! ${got}. 단체 사진은 졸업 앨범에 붙었어요.`; rt.tr2Txt = '';
      save(); tr2Tick(); renderTr2(); renderTr2Btn(); checkQuests(); syncKids(false); return;
    }
  }
  function renderTripBtn() {
    const b = $('#btnTrip'), on = tripOpen();
    b.hidden = !on;
    if (!on) return;
    if (!S.trip.open) {   // 처음 열리는 날
      S.trip.open = true; save();
      setTimeout(() => toast('현장체험학습이 열렸어요! 지도 왼쪽의 버스를 눌러 보세요'), 600);
    }
    const back = tripBack(), cur = S.trip.cur;
    const txt = !cur ? '출발' : back ? '도착!' : hms(tripLeft());
    if (rt.tripTxt !== txt) {
      rt.tripTxt = txt;
      $('#tripN').textContent = txt;
      b.classList.toggle('ready', back || !cur);
      b.setAttribute('aria-label', !cur ? '현장체험학습, 떠날 수 있어요' : back ? `현장체험학습, ${TRIP[cur].name}에서 돌아왔어요` : `현장체험학습, ${TRIP[cur].name}에서 돌아오기까지 ${txt}`);
    }
    if (rt.modalOpen === $('#mTrip')) {
      if (rt.tripView !== (cur ? (back ? 'back' : 'go') : 'idle')) renderTrip();
      else if (cur && !back) {
        $('#tripLeft').textContent = `${hms(tripLeft())} 남았어요`;
        $('#tripBar').style.width = ((1 - tripLeft() / (S.trip.end - S.trip.start)) * 100).toFixed(1) + '%';
      }
    }
  }
  function openTrip(keep) {
    if (rt.paused) return;
    if (keep !== true) rt.tripGot = '';
    if (!tripOpen()) { toast('현장체험학습은 초등학교 3학년부터 갈 수 있어요'); return; }
    if (rt.modalOpen && rt.modalOpen !== $('#mTrip')) return;
    sfx('tap');
    renderTrip();
    if (rt.modalOpen !== $('#mTrip')) openModal($('#mTrip'));
  }
  function renderTrip() {
    const cur = S.trip.cur, T = cur && TRIP[cur], back = tripBack();
    rt.tripView = cur ? (back ? 'back' : 'go') : 'idle';
    const ac = acornIcon(), di = dipIcon(), gi = `<svg viewBox="-8 -11 16 20" aria-hidden="true">${GOLD_ICON.slice(GOLD_ICON.indexOf('>') + 1, -6)}</svg>`;
    const rw = (R, x) => `<span class="tr-rw">${ac}<b>${fmt(R.acorns * x)}</b></span><span class="tr-rw">${di}<b>${R.dip * x}</b></span>${R.gold ? `<span class="tr-rw">${gi}<b>${R.gold}</b></span>` : ''}`;
    let h = (IMG('trip_head') ? `<div class="tr-head" style="background-image:url('${blobUrl(IMG('trip_head'))}')" aria-hidden="true"></div>` : '') + (rt.tripGot ? `<p class="tr-got">${esc(rt.tripGot)}</p>` : '');   // 3.0.0 창 맨 위 그림
    if (!cur) {
      h += '<p class="tr-lead">돌아오면 도토리, 수료증, 그곳 기념품을 가져와요.</p><div class="tr-list">';
      for (const D of TRIPS) {
        const lock = S.st.trips < D.need, got = D.souv.filter((_, i) => S.trip.souv.includes(`${D.id}:${i}`)).length;
        h += `<div class="tr-row${lock ? ' lock' : ''}"><span class="tr-ic${IMG('trip_dest_' + D.id) ? ' has-dest' : ''}" style="--tc:${D.c}">${tripIcon(D.id)}</span>` +
          `<div class="tr-tx"><b>${D.name} <small>${minText(D.min)}</small></b><span>${lock ? `체험학습을 ${D.need}번 다녀오면 열려요` : D.say}</span>` +
          `<span class="tr-meta">${lock ? '' : rw(tripReward(D), 1)}<span class="tr-sv">기념품 ${got}/${D.souv.length}</span></span></div>` +
          (lock ? '<span class="tr-lock" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 10V8a4 4 0 0 1 8 0v2" fill="none" stroke="currentColor" stroke-width="2"/></svg></span>'
            : `<button class="cta small" type="button" data-trip="${D.id}">출발</button>`) + '</div>';
      }
      h += '</div>';
    } else if (!back) {
      const cut = tripCut(T);
      h += `<div class="tr-now"><span class="tr-ic big${IMG('trip_dest_' + T.id) ? ' has-dest' : ''}" style="--tc:${T.c}">${tripIcon(T.id)}</span><b>${T.name}에 가 있어요</b><span>${T.say}</span></div>` +
        `<div class="tr-bar"><i id="tripBar" style="width:${((1 - tripLeft() / (S.trip.end - S.trip.start)) * 100).toFixed(1)}%"></i></div>` +
        `<p class="tr-left" id="tripLeft">${hms(tripLeft())} 남았어요</p>` +
        `<button class="cta" type="button" id="tripAd">광고 보고 ${minText(cut)} 당기기</button>` +
        `<div class="btn-row" style="flex-wrap:wrap">${TK.filter(t => S.tk[t.k] > 0).map(t => `<button class="btn-sub small" type="button" data-trip-tk="${t.k}">${t.name} (${S.tk[t.k]}장)</button>`).join('')}</div><p class="fine">남은 시간보다 긴 단축권을 쓰면 남는 시간은 사라져요.</p>` +
        '<p class="fine">앱을 꺼도 시간은 가요.</p>';
    } else {
      const R = tripReward(T);
      h += `<div class="tr-now"><span class="tr-ic big${IMG('trip_dest_' + T.id) ? ' has-dest' : ''}" style="--tc:${T.c}">${tripIcon(T.id)}</span><b>${T.name}에서 돌아왔어요!</b><span>기념품 하나와 함께 이만큼 가져왔어요</span></div>` +
        `<div class="tr-gift">${rw(R, 1)}</div>` +
        `<div class="btn-row"><button class="cta" type="button" id="tripGet">받기</button></div>`;   // 1.4.0: 광고가 너무 많다는 의견으로 2배 받기를 뺐어요
    }
    // 기념품 모음
    h += `<details class="tr-souv-d"${rt.trSvOpen ? ' open' : ''}><summary><h3 class="tr-h">기념품 모음 <small>${souvN()}/${SOUV_IDS.size}종, 수업료 +${Math.round((tripMult() - 1) * 100)}%</small></h3></summary><div class="tr-souv">`;   // 5.0.1.6 C-04 접어 둬요
    for (const D of TRIPS) {   // 4.4.2 곳마다 12종이라 곳마다 줄을 나눠요
      const got = D.souv.filter((_, i) => S.trip.souv.includes(`${D.id}:${i}`)).length;
      h += `<b class="sv-h" style="--tc:${D.c}">${D.name} <small>${got}/${D.souv.length}</small></b>`;
      D.souv.forEach((nm, i) => {
        const own = S.trip.souv.includes(`${D.id}:${i}`);
        h += `<span class="sv${own ? ' own' : ''}" style="--tc:${D.c}" title="${own ? nm : '아직 몰라요'}">${own ? souvIcon(D.id + ':' + i) : '<b>?</b>'}<small>${own ? nm : '?'}</small></span>`;
      });
    }
    h += '</div><p class="fine tr-fine">처음 세 가지: 하나에 수업료 +2%, 다 모으면 +10% 더<br>그다음 아홉 가지: 하나에 +1%, 다 모으면 +5% 더<br>졸업해도 남아요</p></details>';
    $('#tripBody').innerHTML = h;
  }
  function startTrip(id) {
    const D = TRIP[id];
    if (!D || S.trip.cur || S.st.trips < D.need) return;
    if (tr2Busy()) { toast(tr2Busy()); return; }   // 3.2.0 수학여행 중
    const now = gameNow();
    rt.tripGot = '';
    S.trip.cur = id; S.trip.start = now; S.trip.end = now + D.min * 60000;
    sfx('buy'); buzz(10);
    toast(`${D.name}에 출발했어요! ${minText(D.min)} 뒤에 돌아와요`);
    S.trip.kids = Math.max(0, Math.min(5, rt.kids.length - 2));
    rt.tripTxt = ''; save(); renderTripBtn();
    const n = S.trip.kids;
    rt.busHold = rt.reduced ? 0 : n;
    closeModal($('#mTrip'), () => { if (rt.tab !== 'school' && !kidsAway()) setTab('school'); busScene('go', n, () => { rt.busHold = 0; syncKids(false); }); });
  }
  function tripUseTicket(k) {
    const t = TK.find(x => x.k === k);
    if (!t || !S.trip.cur || tripBack() || S.tk[k] < 1) return false;
    S.tk[k] -= 1; S.st.tkUsed = (S.st.tkUsed || 0) + 1;
    S.trip.end = Math.max(gameNow(), S.trip.end - t.sec * 1000);
    S.trip.start = Math.min(S.trip.start, S.trip.end - 1);
    rt.tripTxt = ''; save(); renderTrip(); renderTripBtn();
    toast(tripBack() ? '체험학습에서 돌아왔어요!' : `${t.name}을 썼어요`); return true;
  }
  function tripAd() {
    if (!S.trip.cur || tripBack()) return;
    const D = TRIP[S.trip.cur];
    closeModal($('#mTrip'), () => showAd(() => {
      const cut = tripCut(D) * 60000;
      S.trip.end = Math.max(gameNow(), S.trip.end - cut);
      S.trip.start = Math.min(S.trip.start, S.trip.end - 1);
      rt.tripTxt = ''; save(); renderTripBtn();
      toast(tripBack() ? `${D.name}에서 돌아왔어요!` : `${minText(tripCut(D))} 일찍 돌아와요`);
      openTrip();
    }, () => openTrip()));
  }
  function claimTrip(x) {
    if (!tripBack()) return;
    const D = TRIP[S.trip.cur], R = tripReward(D);
    S.budget += R.acorns * x; earn(R.acorns * x);
    addDip(R.dip * x);
    const gIt = R.gold ? goldOr(R.gold) : null;   // 4.2.0
    const left0 = D.souv.map((_, i) => `${D.id}:${i}`).filter(k => !S.trip.souv.includes(k)), leftOld = left0.filter(k => +k.split(':')[1] < SOUV_OLD);
    const left = leftOld.length ? leftOld : left0, isOld = leftOld.length > 0;   // 4.4.2 처음 세 가지부터
    let msg = `${D.name}에서 도토리 +${fmt(R.acorns * x)}, 수료증 +${R.dip * x}장`;
    const rw = { title: `${D.name}에서 돌아왔어요!`, items: [{ ic: 'acorn', t: `도토리 +${fmt(R.acorns * x)}` }, R.dip ? { ic: 'dip', t: `수료증 +${R.dip * x}장` } : null, gIt] };
    if (left.length) {
      const k = left[Math.floor(Math.random() * left.length)];
      S.trip.souv.push(k);
      msg += `, 기념품 '${D.souv[+k.split(':')[1]]}'`;
      rw.art = souvIcon(k); rw.big = `새 기념품: ${D.souv[+k.split(':')[1]]}`;
      if (isOld) {
        rw.bigSub = left.length === 1 ? `${D.name} 기념품 세 가지를 모두 모았어요! 수업료 +2%에 +10% 더` : '기념품 하나에 수업료 +2%';
        if (left.length === 1) msg += `까지! ${D.name} 기념품 세 가지를 모두 모아서 수업료가 10% 더 올랐어요`;
      } else {
        rw.bigSub = left.length === 1 ? `${D.name} 기념품 ${D.souv.length}가지를 모두 모았어요! 수업료 +1%에 +5% 더` : '새 기념품 하나에 수업료 +1%';
        if (left.length === 1) msg += `까지! ${D.name} 기념품 ${D.souv.length}가지를 모두 모아서 수업료가 5% 더 올랐어요`;
      }
    } else { const it = goldOr(1, '(기념품이 겹쳐서)'); msg += ', ' + it.t; rw.items.push(it); }   // 4.2.0
    // 3.2.5 woodani 제보(돌아올 때 끊김): 보상 창이 버스 장면과 같은 순간에 열려 겹쳤어요. 학생들이 다 내린 뒤에 보여요
    const n0 = S.trip.kids, rwNow = rt.reduced || !n0 || !layerFx.animate;
    if (rwNow) showReward(rw);
    S.trip.been[D.id] = (S.trip.been[D.id] || 0) + 1;
    S.st.trips += 1;
    addLeague(LP.trip + LP.tripHour * Math.floor(D.min / 60));
    S.trip.cur = ''; S.trip.start = 0; S.trip.end = 0;
    buzz(15);
    rt.tripGot = msg;
    rt.tripTxt = '';
    save(); renderHUD(); renderAffordance(); renderTripBtn(); renderGradPanel(true);
    const n = S.trip.kids, arrive = () => { if (rt.tab !== 'school' && !kidsAway()) setTab('school'); if (n > 0) busScene('back', n, () => { S.trip.kids = 0; syncKids(false); save(); if (!rwNow) showReward(rw); }); };
    if (rt.reduced) { S.trip.kids = 0; syncKids(false); }
    if (rt.modalOpen === $('#mTrip')) closeModal($('#mTrip'), arrive); else arrive();
  }

  const TICKET_SVG = '<svg viewBox="-12 -9 24 18" aria-hidden="true"><path d="M-11 -7 h22 v4 a3 3 0 0 0 0 6 v4 h-22 v-4 a3 3 0 0 0 0 -6 Z" fill="#F7C9D2" stroke="#B5576B" stroke-width="1.2"/><path d="M-4 -2 l1 2.2 2.4 .3 -1.8 1.6 .5 2.4 -2.1 -1.2 -2.1 1.2 .5 -2.4 -1.8 -1.6 2.4 -.3 Z" fill="#D9534A"/><path d="M3 -3 h5 M3 0 h5 M3 3 h4" stroke="#B5576B" stroke-width="1"/></svg>';
  /* 기념품 그림: 체험학습 장소마다 세 개씩, 모두 -20~20 안에 그려요 */
  const SV_O = 'stroke="#4E3D2C" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"';
  const SOUV_ART = {
    'hill:0': `<rect x="-15" y="-15" width="30" height="30" rx="3" fill="#C98A3A" ${SV_O}/><rect x="-11" y="-11" width="22" height="22" rx="2" fill="#FFF6DE" ${SV_O}/><ellipse cx="0" cy="2" rx="6" ry="8" fill="#8A5D3B" ${SV_O}/><path d="M-5 -2 h10 M-6 2 h12 M-5 6 h10" stroke="#C98A3A" stroke-width="1.2"/>`,
    'hill:1': `<ellipse cx="0" cy="2" rx="16" ry="13" fill="#B9AE9A" ${SV_O}/><ellipse cx="0" cy="5" rx="5" ry="6" fill="#8E826E"/><circle cx="-6" cy="-5" r="2.6" fill="#8E826E"/><circle cx="-1" cy="-8" r="2.6" fill="#8E826E"/><circle cx="5" cy="-6" r="2.6" fill="#8E826E"/>`,
    'hill:2': `<rect x="-7" y="-17" width="14" height="34" rx="2" fill="#FFF6DE" ${SV_O}/><path d="M0 -3 m-5 0 a5 5 0 1 1 5 5 a5 5 0 1 1 -5 -5 a5 5 0 1 1 5 -5" fill="#6E9446" ${SV_O}/><path d="M0 2 v10" stroke="#6E9446" stroke-width="1.6"/><circle cx="0" cy="-14" r="1.6" fill="#D9534A"/>`,
    'creek:0': `<ellipse cx="0" cy="3" rx="15" ry="10" fill="#9FB5C2" ${SV_O}/><ellipse cx="-5" cy="0" rx="4" ry="2" fill="#FFFFFF" opacity=".8"/><path d="M8 -12 l2 4 l4 2 l-4 2 l-2 4 l-2 -4 l-4 -2 l4 -2 Z" fill="#FFE27A" ${SV_O}/>`,
    'creek:1': `<rect x="-16" y="-13" width="32" height="26" rx="2" fill="#FFFDF5" ${SV_O}/><path d="M-10 2 q8 -9 16 0 q-8 9 -16 0 Z M6 2 l6 -5 v10 Z" fill="#7FC1E0" ${SV_O}/><circle cx="-5" cy="0" r="1.2" fill="#2A2520"/><path d="M-14 9 q4 -2 8 0 t8 0 t8 0" fill="none" stroke="#3F8AD8" stroke-width="1.2"/>`,
    'creek:2': `<ellipse cx="0" cy="2" rx="15" ry="7" fill="#8E969B" ${SV_O}/><path d="M-12 -6 q4 -4 8 0 M-2 -9 q4 -4 8 0 M8 -6 q3 -3 6 0" fill="none" stroke="#3F8AD8" stroke-width="1.6"/>`,
    'museum:0': `<path d="M-15 4 h30 M-11 0 v8 M-4 -2 v12 M4 -2 v12 M11 0 v8" ${SV_O} fill="none" stroke-width="3.2" stroke="#F5ECD5"/><path d="M-15 4 h30 M-11 0 v8 M-4 -2 v12 M4 -2 v12 M11 0 v8" fill="none" ${SV_O} stroke-width="1"/><circle cx="-16" cy="-5" r="5" fill="#F5ECD5" ${SV_O}/><circle cx="-17" cy="-6" r="1" fill="#2A2520"/>`,
    'museum:1': `<circle r="14" fill="#E0A93A" ${SV_O}/><circle r="10" fill="none" stroke="#B07F2C" stroke-width="1.4"/><path d="M-4 -1 q0 -6 4 -6 q4 0 4 6 q0 7 -4 8 q-4 -1 -4 -8 Z" fill="#8A5D3B" ${SV_O}/><path d="M-5 -2 h10" stroke="#5E3F22" stroke-width="1.6"/>`,
    'museum:2': `<path d="M-12 14 L8 -12 Q14 -18 15 -10 Q12 -4 -8 16 Z" fill="#8A6C50" ${SV_O}/><path d="M-4 6 l14 -16 M-1 8 l13 -12" stroke="#EAD8B8" stroke-width="1.1"/><path d="M-12 14 l-4 4" ${SV_O}/>`,
    'beach:0': `<path d="M-14 8 Q-14 -14 2 -14 Q16 -12 14 4 Q10 14 -2 12 Z" fill="#F7C9B6" ${SV_O}/><path d="M2 -14 Q-2 -2 -2 12 M-8 -10 Q-6 0 -8 10 M9 -10 Q6 0 6 10" fill="none" stroke="#D9947A" stroke-width="1.2"/>`,
    'beach:1': `<path d="M0 -14 L4 -4 L15 -4 L6 3 L9 14 L0 7 L-9 14 L-6 3 L-15 -4 L-4 -4 Z" fill="#F07C7C" ${SV_O}/><circle cx="0" cy="-17" r="3" fill="none" stroke="#C7CED1" stroke-width="1.8"/><circle cx="0" cy="0" r="1.5" fill="#FFFFFF"/>`,
    'beach:2': `<rect x="-7" y="-16" width="14" height="5" rx="1" fill="#C98A3A" ${SV_O}/><path d="M-9 -11 h18 v24 q0 4 -4 4 h-10 q-4 0 -4 -4 Z" fill="#E4F3F8" ${SV_O}/><path d="M-9 4 q4 -3 9 0 t9 0 v9 q0 4 -4 4 h-10 q-4 0 -4 -4 Z" fill="#F3D9A6"/><path d="M-9 -11 h18 v24 q0 4 -4 4 h-10 q-4 0 -4 -4 Z" fill="none" ${SV_O}/>`,
    'star:0': `<rect x="-16" y="-13" width="32" height="26" rx="2" fill="#2F3A68" ${SV_O}/><path d="M-10 6 L-3 -2 L4 3 L11 -7" fill="none" stroke="#FFE27A" stroke-width="1.2"/><circle cx="-10" cy="6" r="1.8" fill="#FFE27A"/><circle cx="-3" cy="-2" r="1.8" fill="#FFE27A"/><circle cx="4" cy="3" r="1.8" fill="#FFE27A"/><circle cx="11" cy="-7" r="1.8" fill="#FFE27A"/>`,
    'star:1': `<circle r="14" fill="#5B4FA8" ${SV_O}/><rect x="-8" y="-3" width="13" height="6" rx="2" transform="rotate(-25)" fill="#E4EBEF" ${SV_O}/><path d="M-1 4 l-3 7 M2 3 l3 8" ${SV_O}/><circle cx="8" cy="-8" r="1.4" fill="#FFE27A"/>`,
    'star:2': `<path d="M-12 4 Q-14 -8 -2 -12 Q12 -14 13 -2 Q14 10 2 12 Q-10 14 -12 4 Z" fill="#5E5A66" ${SV_O}/><circle cx="-4" cy="-3" r="2.4" fill="#45414D"/><circle cx="5" cy="3" r="3" fill="#45414D"/><path d="M8 -12 l1 3 l3 1 l-3 1 l-1 3 l-1 -3 l-3 -1 l3 -1 Z" fill="#FFE27A"/>`
  };
  const souvIcon = (k, c) => { const u = IMG('souv_' + k.replace(':', '_')); return u ? `<img class="sv-img" src="${u}" alt="" aria-hidden="true">` : `<svg viewBox="-20 -20 40 40" aria-hidden="true">${SOUV_ART[k] || TRIP_ART[k.split(':')[0]] || ''}</svg>`; };   // 3.0.0 기념품 그림

