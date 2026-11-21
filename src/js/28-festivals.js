  /* ---------- 학년별 학교 행사 ----------
     1학년 봄 소풍 보물찾기, 2학년 새 친구 환영회, 4학년 숲속 운동회, 5학년 학예회, 6학년 졸업 사진. (3학년은 현장체험학습)
     지도 왼쪽 '학교 행사' 버튼에서 열어요. 행사마다 2시간에 한 번, 광고를 보면 바로 다시 열 수 있어요.
     학생들이 행사 모양으로 모이고(둥글게, 관객석, 두 줄), 지도에 나타나는 것(쪽지, 풍선, 음표, 웃음 별)을 시간 안에 목표만큼 누르면 성공이에요 */
  const FEST = {
    picnic: { name: '봄 소풍 보물찾기', tg: 0, sec: 30, goal: 12, form: 'free', item: 'paper', how: 'pop',
      lead: '뒷산으로 봄 소풍을 가요! 화면 곳곳에 숨은 보물 쪽지를 30초 안에 12장 눌러 찾으면 성공이에요.', win: '보물 쪽지를 다 찾았어요!', unit: '장' },
    welcome: { name: '새 친구 환영회', tg: 1, sec: 30, goal: 15, form: 'ring', item: 'balloon', how: 'rise',
      lead: '광장에 둥글게 모여 새 친구를 환영해요. 하늘로 날아오르는 풍선을 눌러 터뜨려요. 30초 안에 15개면 성공!', win: '풍선이 펑펑! 새 친구들이 활짝 웃어요.', unit: '개' },
    sports: { name: '숲속 운동회', tg: 3, sec: SPORTS.sec, sports: true,
      lead: '청팀과 백팀으로 나뉘어 트랙을 달려요. 굴러오는 공을 주울 때마다 청팀이 1점! 백팀보다 많이 주우면 이겨요.' },
    show: { name: '학예회', tg: 4, sec: 35, goal: 18, form: 'stage', item: 'note', how: 'rise',
      lead: '광장 무대에서 친구들이 차례로 공연해요. 무대에서 떠오르는 음표를 눌러 박수를 보내요. 35초 안에 18개면 대성공!', win: '앙코르! 박수가 쏟아졌어요.', unit: '개' },
    photo: { name: '졸업 사진 찍기', tg: 5, sec: 30, goal: 14, form: 'rows', item: 'smile', how: 'pop',
      lead: '교실 앞에 두 줄로 서서 졸업 사진을 찍어요. 친구들 머리 위에 반짝이는 웃음 별을 눌러 모두 웃게 해요. 14개면 찰칵!', win: '찰칵! 모두 활짝 웃은 졸업 사진이 나왔어요.', unit: '개' },
    // 고등학교 밤(20~6시) 전용 행사: 학생은 기숙사 창가에서 봐서 지도에 없어요. 메인 퀘스트에는 넣지 않아요. 목표 숫자는 본부 제안
    meteor: { name: '별똥별 보기', tg: 0, sec: 30, goal: 14, form: 'free', item: 'meteor', how: 'fall', night: true,
      lead: '기숙사 친구들이 창가에 모였어요. 밤하늘을 가로지르는 별똥별을 눌러 소원을 빌어요. 30초 안에 14개면 성공!', win: '소원을 가득 빌었어요! 기숙사 창가가 반짝여요.', unit: '개' },
    lantern: { name: '소원 등불 날리기', tg: 0, sec: 30, goal: 15, form: 'free', item: 'lantern', how: 'rise', night: true,
      lead: '광장에서 소원 등불이 하나씩 떠올라요. 등불을 눌러 하늘 높이 보내 줘요. 30초 안에 15개면 성공!', win: '밤하늘이 등불로 가득해요!', unit: '개' },
    firefly: { name: '반딧불 세기', tg: 0, sec: 30, goal: 12, form: 'free', item: 'firefly', how: 'pop', night: true,
      lead: '풀숲에 반딧불이 깜빡여요. 불빛이 꺼지기 전에 눌러 세어 봐요. 30초 안에 12마리면 성공!', win: '반딧불이 한가득! 숲이 환해졌어요.', unit: '마리' }
  };
  // 학교 행사 이름을 학교급에 맞게. 중학교와 고등학교, 대학교가 달라요(놀이와 숫자는 그대로)
  const FEST_NM = { 2: { sports: '체육대회', show: '학교 축제', photo: '졸업 앨범 촬영' }, 3: { sports: '체육대회', show: '학교 축제', photo: '졸업 앨범 촬영' },
    4: { picnic: 'MT 보물찾기', welcome: '신입생 환영회', sports: '체육대회', show: '동아리 공연', photo: '졸업 앨범 촬영' } };
  const FEST_TX = { 4: {
    picnic: { lead: 'MT 온 숲에서 보물찾기를 해요! 화면 곳곳에 숨은 보물 쪽지를 30초 안에 12장 눌러 찾으면 성공이에요.' },
    welcome: { lead: '광장에 둥글게 모여 신입생을 환영해요. 하늘로 날아오르는 풍선을 눌러 터뜨려요. 30초 안에 15개면 성공!', win: '풍선이 펑펑! 신입생들이 활짝 웃어요.' },
    show: { lead: '광장 무대에서 동아리들이 차례로 공연해요. 무대에서 떠오르는 음표를 눌러 박수를 보내요. 35초 안에 18개면 대성공!' },
    photo: { lead: '강의실 앞에 두 줄로 서서 졸업 앨범 사진을 찍어요. 친구들 머리 위에 반짝이는 웃음 별을 눌러 모두 웃게 해요. 14개면 찰칵!', win: '찰칵! 모두 활짝 웃은 졸업 앨범 사진이 나왔어요.' } } };
  for (const id of Object.keys(FEST)) for (const f of ['lead', 'win']) { const t0 = FEST[id][f]; if (t0 === undefined) continue; Object.defineProperty(FEST[id], f, { get: () => (S && FEST_TX[S.tier] && FEST_TX[S.tier][id] && FEST_TX[S.tier][id][f]) || t0, enumerable: true, configurable: true }); }
  for (const id of Object.keys(FEST)) { const nm0 = FEST[id].name; Object.defineProperty(FEST[id], 'name', { get: () => (S && FEST_NM[S.tier] && FEST_NM[S.tier][id]) || nm0, enumerable: true, configurable: true }); }
  const FEST_IDS = Object.keys(FEST);
  const FEST_ITEM = {
    paper: '<g transform="rotate(-8)"><rect x="-6" y="-7" width="12" height="14" rx="1.5" fill="#FFF6DA" stroke="#C9A25B" stroke-width="1"/><path d="M-3.5 -3 h7 M-3.5 0 h7 M-3.5 3 h4" stroke="#C9A25B" stroke-width=".9"/><circle cx="4" cy="-5" r="2.2" fill="#E04848"/></g>',
    balloon: '<path d="M0 8 Q-1.5 12 1 16" fill="none" stroke="#8A8A7A" stroke-width=".8"/><ellipse cx="0" cy="0" rx="6.5" ry="8" fill="var(--bc)"/><ellipse cx="-2.2" cy="-3" rx="1.6" ry="2.6" fill="#FFFFFF" opacity=".55"/><path d="M-1.4 7.6 L1.4 7.6 L0 9.4 Z" fill="var(--bc)"/>',
    note: '<path d="M-1 -8 V5" stroke="var(--bc)" stroke-width="1.8"/><path d="M-1 -8 Q5 -6 6 -1" fill="none" stroke="var(--bc)" stroke-width="1.8"/><ellipse cx="-4" cy="5" rx="3.6" ry="2.7" transform="rotate(-20 -4 5)" fill="var(--bc)"/>',
    smile: '<path d="M0 -9 L2.6 -2.8 L9 -2.6 L4 1.6 L5.8 8 L0 4.4 L-5.8 8 L-4 1.6 L-9 -2.6 L-2.6 -2.8 Z" fill="#F3C04B" stroke="#D99A1E" stroke-width=".8"/><path d="M-2.4 1.2 Q0 3.4 2.4 1.2" fill="none" stroke="#7A4A10" stroke-width="1"/><circle cx="-1.8" cy="-1.2" r=".8" fill="#7A4A10"/><circle cx="1.8" cy="-1.2" r=".8" fill="#7A4A10"/>'
  };
  const FEST_COLORS = ['#E04848', '#3F78C2', '#F3C04B', '#3FA45B', '#B05FC2', '#F08A3C'];
  const FEST_ICON = {
    picnic: '<rect x="-7" y="-6" width="14" height="13" rx="1.5" fill="#FFF6DA" stroke="#C9A25B"/><path d="M-4 -2 h8 M-4 1 h8 M-4 4 h5" stroke="#C9A25B"/><circle cx="5" cy="-5" r="2.6" fill="#E04848"/>',
    welcome: '<ellipse cx="-3" cy="-3" rx="5" ry="6" fill="#E04848"/><ellipse cx="4" cy="-1" rx="4.6" ry="5.6" fill="#3F78C2"/><path d="M-3 3 Q-2 7 0 10 M4 4.6 Q3 8 0 10" fill="none" stroke="#8A8A7A" stroke-width=".9"/>',
    sports: '<path d="M-8 9 L-8 -9" stroke="#8A5D3B" stroke-width="1.6" stroke-linecap="round"/><path d="M-7.5 -9 H6 L3 -5 L6 -1 H-7.5 Z" fill="#3F78C2"/><circle cx="4" cy="6" r="4.2" fill="#FFFFFF" stroke="#D9534A" stroke-width="1.2"/>',
    show: '<path d="M-9 -8 Q0 -3 9 -8 V8 H-9 Z" fill="#B8322F"/><path d="M-3 -4 V4" stroke="#F3C04B" stroke-width="1.6"/><ellipse cx="-5" cy="4" rx="2.6" ry="2" fill="#F3C04B"/><path d="M-3 -4 Q2 -3 3 0" fill="none" stroke="#F3C04B" stroke-width="1.6"/>',
    photo: '<rect x="-9" y="-5" width="18" height="12" rx="2.5" fill="#3B3B2D"/><rect x="-4" y="-8" width="7" height="4" rx="1" fill="#3B3B2D"/><circle cx="0" cy="1" r="4" fill="#BFE3F2" stroke="#7A8A96" stroke-width="1.2"/><circle cx="6" cy="-2.5" r="1.2" fill="#F3C04B"/>'
  };
  const festIcon = id => IMG('fest_ic_' + id) ? `<img src="${IMG('fest_ic_' + id)}" alt="" aria-hidden="true" draggable="false" style="width:100%;height:100%;object-fit:contain">` : `<svg viewBox="-11 -11 22 22" aria-hidden="true">${FEST_ICON[id]}</svg>`;
  // 학교 행사 그림(작업지시서 9). 그림이 있으면 그림으로, 없으면 예전 도형으로 그려요. 누르는 자리와 크기는 그대로예요
  const FEST_ART = { bf_seed: ['bf_seed'], meteor: ['fest_meteor_1', 'fest_meteor_2'], lantern: ['fest_lantern_orange', 'fest_lantern_pink', 'fest_lantern_yellow'], firefly: ['fest_firefly_on', 'fest_firefly_half'], paper: ['fest_paper'], balloon: ['fest_balloon_red', 'fest_balloon_yellow', 'fest_balloon_blue'], note: ['fest_note_1', 'fest_note_2'], smile: ['fest_star'], fv_science: ['fv_item_science'], fv_sports: ['fv_item_sports'], fv_human: ['fv_item_human'], fv_art: ['fv_item_art'], fv_biz: ['fv_item_biz'], fv_eng: ['fv_item_eng'], fv_edu: ['fv_item_edu'], fv_med: ['fv_item_med'] };   // fv_: 축제 부스 놀이 물건
  const FEST_AR = { fest_paper: 0.92, fest_balloon_red: 1.22, fest_balloon_yellow: 1.24, fest_balloon_blue: 1.2, fest_note_1: 1.13, fest_note_2: 1.01, fest_star: 0.96, fest_ball_blue: 1, fest_lantern_orange: 1.333, fest_lantern_pink: 1.333, fest_lantern_yellow: 1.333 };
  function festArtSvg(key, w) {
    const u = IMG(key); if (!u) return '';
    const h = w * (FEST_AR[key] || 1);
    return `<image href="${u}" x="${(-w / 2).toFixed(1)}" y="${(-h / 2).toFixed(1)}" width="${w}" height="${h.toFixed(1)}"/>`;
  }
  function festItemSvg(item, w) {
    if (item === 'bf_seed' && !IMG('bf_seed')) item = 'lantern';   // 불꽃 씨앗 그림(작업지시서 70)이 오기 전에는 등불 그림
    const keys = (FEST_ART[item] || []).filter(k => IMG(k)); if (!keys.length) { const sh = FEST_ITEM[item] || FEST_ITEM.balloon; return w ? `<g transform="scale(${(w / 22).toFixed(2)})">${sh}</g>` : sh; }
    return festArtSvg(keys[Math.floor(Math.random() * keys.length)], w || (item === 'balloon' ? 19 : item === 'meteor' ? 30 : item === 'lantern' ? 20 : 22));
  }
  // 고등학교 밤(20~6시, 지도 hs-night와 같은 때)에는 낮 행사를 쉬고 밤 행사만, 낮에는 그 반대예요. 밤 행사는 그림이 있어야 보여요
  const festNight = () => !!S && S.tier >= NSL.tier && geoIdx() >= 3 && isNight();
  const festShown = id => !FEST[id].night || (!!S && S.tier >= NSL.tier && geoIdx() >= 3 && (FEST_ART[FEST[id].item] || []).some(k => IMG(k)));
  const festTimeLock = id => !!S && festShown(id) && !!FEST[id].night !== festNight();
  const festBase = id => !!S && festShown(id) && S.f.playground >= 1 && (S.tier >= 2 || (S.tier === 1 && S.tg >= FEST[id].tg));
  const festOpen = id => festBase(id) && !festTimeLock(id);
  const festWait = id => id === 'sports' ? sportsWait() : Math.max(0, (S.fest.next[id] || 0) - gameNow());
  const festPrize = win => Math.max(10, nice(rate() * 180 * (win ? 2 : 1) * vpMult() * clubFestMult() * elMult('fest')));
  const festBusy = () => !!(rt.fest || rt.sports);
  const festCon = id => id === 'sports' && sportsCon();   // 운동장 공사 중에는 운동회를 잠가요
  // 지도 왼쪽 '학교 행사' 버튼: 열 수 있는 행사 수나, 가장 빨리 열리는 행사까지 남은 시간
  function renderFestBtn() {
    const b = $('#btnSports'), open = FEST_IDS.filter(festOpen), on = open.length > 0 && !festBusy();
    b.hidden = !on;
    if (!on) return;
    const ready = open.filter(id => festWait(id) <= 0 && !festCon(id)).length;   // 공사 중인 운동회는 열린 수에 넣지 않아요
    const tm = open.filter(id => !festCon(id)), txt = ready ? `${ready}` : tm.length ? hms(Math.min(...tm.map(festWait))) : '공사 중';
    if (rt.festTxt !== txt) { rt.festTxt = txt; $('#sportsN').textContent = txt; b.classList.toggle('ready', ready > 0); b.setAttribute('aria-label', ready ? `학교 행사, ${ready}개 열렸어요` : `학교 행사, 다음 행사까지 ${txt}`); }
    if (rt.modalOpen === $('#mFest')) {
      const key = FEST_IDS.map(id => festTimeLock(id) ? 'n' : festOpen(id) ? (festCon(id) ? 'c' : festWait(id) > 0 ? hms(festWait(id)) : 'r') : 'x').join('|');
      if (rt.festKey !== key) renderFestList();
    }
  }
  function openFest() {
    if (rt.paused || festBusy()) return;
    if (!FEST_IDS.some(festOpen)) { toast(S.f.playground < 1 ? `${eul(FAC.playground.name)} 먼저 지어야 해요` : '학교 행사는 초등학교에 입학하면 열 수 있어요'); return; }
    if (rt.modalOpen && rt.modalOpen !== $('#mFest')) return;
    sfx('tap');
    renderFestList();
    if (rt.modalOpen !== $('#mFest')) openModal($('#mFest'));
  }
  function renderFestList() {
    rt.festKey = FEST_IDS.map(id => festTimeLock(id) ? 'n' : festOpen(id) ? (festCon(id) ? 'c' : festWait(id) > 0 ? hms(festWait(id)) : 'r') : 'x').join('|');
    const ac = acornIcon();
    $('#festList').innerHTML = FEST_IDS.filter(festShown).sort((a, b) => festTimeLock(a) - festTimeLock(b)).map(id => {   // 지금 열 수 있는 쪽(낮 행사나 밤 행사)을 위에
      const F = FEST[id];
      if (festBase(id) && festTimeLock(id)) return `<div class="tr-row fe-row lock"><span class="tr-ic" style="--tc:#F3C04B">${festIcon(id)}</span>` +
        `<div class="tr-tx"><b>${F.name} <small>${F.sec}초</small></b><span>${F.night ? '밤(20~6시)에 여는 기숙사 행사예요' : '밤에는 학생들이 기숙사에 있어요'}</span></div><span class="fe-lock">${F.night ? '밤 8시부터' : '아침 6시부터'}</span></div>`;
      const open = festOpen(id), w = open ? festWait(id) : 0, con = open && festCon(id);
      const btn = !open ? `<span class="fe-lock">${F.tg + 1}학년부터</span>`
        : con ? `<span class="fe-lock">공사 중</span>`   // 운동장 공사 중
        : w > 0 ? `<button class="btn-sub small" type="button" data-fest="${id}" data-ad="1"><span>광고 보고 바로</span><small>${hms(w)}</small></button>`
        : `<button class="cta small" type="button" data-fest="${id}">열기</button>`;
      return `<div class="tr-row fe-row${open && !con ? '' : ' lock'}"><span class="tr-ic" style="--tc:#F3C04B">${festIcon(id)}</span>` +
        `<div class="tr-tx"><b>${F.name} <small>${F.sec}초</small></b><span>${con ? `${FAC.playground.name} 공사가 끝나면 열 수 있어요` : open ? F.lead : '학년이 올라가면 열려요'}</span>` +
        (open && !con ? `<span class="tr-meta"><span class="tr-rw">${ac}<b>${fmt(festPrize(true))}</b></span><span class="tr-sv">성공 상품</span></span>` : '') + `</div>${btn}</div>`;
    }).join('');
  }
  function startFest(id, viaAd) {
    if (festBusy()) return;
    if (uniOn() && geo().campus && id !== 'sports') zoneGo('plaza');   // 학교 행사는 보고 있는 구역에서, 캠퍼스 지도에서 열면 광장 구역에서
    if (tr2Busy()) { toast(tr2Busy()); return; }
    if (festTimeLock(id)) { toast(FEST[id].night ? '기숙사 행사는 밤 8시부터 열려요' : '밤에는 학생들이 기숙사에 있어요. 아침 6시에 다시 열 수 있어요'); return; }
    if (!festOpen(id)) return;
    if (festCon(id)) { toast(`${FAC.playground.name} 공사가 끝나면 운동회를 열 수 있어요`); return; }
    if (!viaAd && festWait(id) > 0) { closeModal($('#mFest'), () => askAd(`${FEST[id].name}${batchim(FEST[id].name) ? '을' : '를'} 기다리지 않고 광고를 보면 바로 열 수 있어요.`, () => showAd(() => startFest(id, true), () => openFest()), () => openFest())); return; }
    if (id === 'sports') { if (rt.modalOpen === $('#mFest')) closeModal($('#mFest'), () => startSports(true)); else startSports(true); return; }
    const go = () => {
      const F = FEST[id];
      setTab('school'); closeSheet();
      const sc = $('#scroller'), top = F.form === 'free' ? 0 : $('#map').getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 60;
      sc.scrollTo({ top: Math.max(0, top), behavior: rt.reduced ? 'auto' : 'smooth' });
      rt.fest = { id, t: F.sec, n: 0, spawn: 0.6, items: [], perf: 0, intro: 3 }; renderTeachersOnMap();
      feverOn(true);
      S.fest.next[id] = gameNow() + SPORTS.gap;
      festForm(F.form);
      if (F.form === 'stage') { festLighting(true); festStage(true); }
      if (F.form === 'rows') { festPhotoDecor(true); festCamera(true); }
      if (F.night) festNightDecor(id);
      if (F.form === 'ring') festGarland(true);
      $('#festBar').hidden = false;
      festFocusNow();
      renderFestBar();
      musicSync(); buzz(20);   // 행사 시작 종소리 뺌
      save(); renderFestBtn();
    };
    if (rt.modalOpen === $('#mFest')) closeModal($('#mFest'), go); else go();
  }
  // 학교 행사는 지도 광장 가운데에서 열려요 (옛 지도의 180, 212 자리)
  const pzx = () => geo().plaza[0], pzy = () => geo().plaza[1];
  // 학생들을 행사 자리에 세워요
  function festForm(form) {
    const ks = rt.kids.filter(k => !k.board), n = ks.length;
    ks.forEach((k, i) => {
      let x, y;
      if (form === 'ring') { const a = i / Math.max(1, n) * Math.PI * 2; x = pzx() + Math.cos(a) * 56; y = pzy() + Math.sin(a) * 24; }
      else if (form === 'stage') { const row = i % 2, col = Math.floor(i / 2), cols = Math.ceil(n / 2); x = pzx() + (col - (cols - 1) / 2) * 15 + row * 7; y = pzy() + 26 + row * 13; }
      else if (form === 'rows') { const row = i % 2, col = Math.floor(i / 2), cols = Math.ceil(n / 2); x = pzx() + (col - (cols - 1) / 2) * 14 + row * 7; y = pzy() + 6 + row * 12; }
      else return;
      k.hold = true; k.wait = 0; k.tx = x; k.ty = y; k.speed = 40; k.cheer = rand(0, 6);
    });
  }
  // 광장 행사 장식 한 겹(조명, 무대, 줄 장식, 사진 장식, 밤 장식, 사진기가 함께 써요. 예전에는 여섯 함수에 같은 뼈대가 따로 있었어요)
  // 같은 id의 옛 것을 지우고, html이 있으면 <g>를 새로 만들어 layer의 맨 앞(front)이나 맨 뒤에 넣어요. 만든 <g>를 돌려줘요(없으면 null)
  function festPiece(id, html, layer, front, attrs) {
    const old = $('#' + id); if (old) old.remove();
    if (!html) return null;
    const g = document.createElementNS(NS, 'g');
    g.id = id; for (const k in attrs) g.setAttribute(k, attrs[k]);
    g.innerHTML = html;
    if (front) layer.insertBefore(g, layer.firstChild); else layer.appendChild(g);
    return g;
  }
  function festLighting(on) {
    const g = festPiece('festLighting', on && `<defs><radialGradient id="festShade" gradientUnits="userSpaceOnUse" cx="${pzx()}" cy="${pzy()-20}" r="155"><stop offset="0" stop-color="#17283a" stop-opacity="0"/><stop offset="1" stop-color="#17283a" stop-opacity=".55"/></radialGradient></defs><rect x="0" y="-60" width="360" height="540" fill="url(#festShade)"/><path class="fest-light-beam" d="M${pzx()-38} ${pzy()-100} L${pzx()-55} ${pzy()+10} L${pzx()+5} ${pzy()+10} Z" fill="#fff0a4" opacity=".3"/><path class="fest-light-beam alt" d="M${pzx()+38} ${pzy()-100} L${pzx()-5} ${pzy()+10} L${pzx()+55} ${pzy()+10} Z" fill="#ffc8d8" opacity=".3"/>`, layerKids, true, { class: 'kfloor', 'aria-hidden': 'true', 'pointer-events': 'none' });
    if (g && rt.reduced) g.querySelectorAll('.fest-light-beam').forEach(e => e.style.animation = 'none');
  }
  function festStage(on) {
    festPiece('festStage', on && (IMG('fest_stage') ? `<image href="${IMG('fest_stage')}" x="128" y="${(210 - 104 * 0.684).toFixed(1)}" width="104" height="${(104 * 0.684).toFixed(1)}"/>` :   // 그림 무대
      '<rect x="140" y="186" width="80" height="22" rx="3" fill="#8A5D3B"/><rect x="140" y="186" width="80" height="4" fill="#A8743C"/>' +
      '<path d="M136 150 H224 V156 Q212 164 200 156 Q188 164 180 156 Q172 164 160 156 Q148 164 136 156 Z" fill="#B8322F"/>' +
      '<rect x="136" y="150" width="6" height="40" fill="#B8322F"/><rect x="218" y="150" width="6" height="40" fill="#B8322F"/>'), layerKids, true, { class: 'kfloor', 'aria-hidden': 'true', transform: on && `translate(${pzx() - 180} ${pzy() - 212})` });
  }
  function festGarland(on) {   // 환영회 줄 장식: 학생들이 둥글게 선 자리 위에 걸어요
    festPiece('festGarland', on && IMG('fest_garland') && `<image href="${IMG('fest_garland')}" x="${(pzx() - 70).toFixed(1)}" y="${(pzy() - 50).toFixed(1)}" width="140" height="${(140 * 0.185).toFixed(1)}"/>`, layerKids, true, { class: 'kfloor', 'aria-hidden': 'true' });
  }
  function festPhotoDecor(on) {
    festPiece('festPhotoDecor', on && `<g transform="translate(${pzx()} ${pzy()})"><path d="M-62 -44 Q0 -14 62 -44" fill="none" stroke="#f9db87" stroke-width="2"/><path d="M-53 -40 l8 2 -5 7z M-28 -33 l8 1 -4 8z M-3 -29 l8 0 -4 8z M22 -33 l8 -1 -4 8z M45 -38 l8 -2 -3 9z" fill="#f3a7aa" stroke="#fff1d1" stroke-width=".6"/><circle cx="-58" cy="-45" r="2.5" fill="#ffe48f"/><circle cx="58" cy="-45" r="2.5" fill="#ffe48f"/><path d="M-53 0 l2 -5 2 5 5 2 -5 2 -2 5 -2 -5 -5 -2z M53 -8 l2 -5 2 5 5 2 -5 2 -2 5 -2 -5 -5 -2z" fill="#fff5bd"/></g>`, layerFx, false, { 'aria-hidden': 'true', 'pointer-events': 'none' });
  }
  // 밤 행사 광장 장식(작업지시서 51): 별똥별은 망원경, 등불은 받침대, 반딧불은 유리병을 분수 왼쪽 아래에
  const FEST_NDECO = { meteor: 'fest_scope', lantern: 'fest_lantern_stand', firefly: 'fest_jar' };
  function festNightDecor(id) {
    const k = id && FEST_NDECO[id];
    festPiece('festNDeco', k && IMG(k) && `<image href="${IMG(k)}" x="${(pzx() - 58).toFixed(1)}" y="${(pzy() - 6).toFixed(1)}" width="34" height="34"/>`, layerFx, true, { 'aria-hidden': 'true', 'pointer-events': 'none' });
  }
  function festCamera(on) {
    festPiece('festCam', on && (IMG('fest_camera') ? `<image href="${IMG('fest_camera')}" x="167" y="${(294 - 26 * 1.582).toFixed(1)}" width="26" height="${(26 * 1.582).toFixed(1)}"/>` :   // 그림 사진기
      '<path d="M180 270 L172 292 M180 270 L188 292 M180 270 V292" stroke="#6E4A2E" stroke-width="1.6"/><g transform="translate(180 264) scale(.9)">' + FEST_ICON.photo + '</g>'), layerFx, false, { 'aria-hidden': 'true', transform: on && `translate(${pzx()-180} ${pzy()-212})` });
  }
  function renderFestBar() {
    const R = rt.fest; if (!R) return;
    const F = festDef(R.id);
    $('#fbName').textContent = F.name;
    $('#fbN').textContent = `${R.n}/${F.goal}`;
    $('#fbT').textContent = R.intro > 0 ? F.sec : Math.ceil(R.t);
    $('#festBar').classList.toggle('hurry', R.t <= 5 && !(R.intro > 0));
  }
  function festSpawn(F) {
    let x, y;
    if (F.bf) { x = pzx() + rand(-90, 90); y = pzy() + rand(-6, 24); }   // 불꽃 씨앗은 광장에서 떠올라요
    else if (F.fv) {   // 축제 부스 놀이: 떠오르기는 광장에서, 떨어지기는 위에서, 굴러오기는 왼쪽에서, 숨은 것 찾기는 곳곳에서
      const v0 = visMap() || [0, 0, 360, 480];
      if (F.how === 'drop') { x = rand(v0[0] + 30, v0[2] - 30); y = v0[1] + 24; }
      else if (F.how === 'roll') { x = v0[0] + 16; y = pzy() + rand(-70, 70); }
      else if (F.how === 'pop') { x = rand(v0[0] + 30, v0[2] - 30); y = rand(v0[1] + 40, v0[3] - 30); }
      else { x = pzx() + rand(-70, 70); y = pzy() + 10 + rand(-10, 30); }
    }
    else if (F.item === 'meteor') { const v0 = visMap() || [0, 0, 360, 480]; x = rand(v0[0] + 20, (v0[0] + v0[2]) / 2 + 40); y = rand(v0[1] + 30, v0[1] + (v0[3] - v0[1]) * 0.45); }   // 하늘 위쪽 왼편에서 오른쪽 아래로
    else if (F.item === 'paper' || F.item === 'firefly') { const P0 = [[34, 176], [58, 300], [322, 240], [312, 372], [94, 398], [336, 150], [26, 248], [262, 404], [104, 86], [252, 92], [44, 360], [330, 300]], v0 = visMap(), P = v0 ? P0.filter(([px, py]) => px > v0[0] + 16 && px < v0[2] - 16 && py > v0[1] + 16 && py < v0[3] - 16) : P0; const PP = P.length >= 4 ? P : P0; [x, y] = PP[Math.floor(Math.random() * PP.length)]; x += rand(-8, 8); y += rand(-6, 6); }
    else if (F.item === 'smile') { const ks = rt.kids.filter(k => k.hold); if (!ks.length) return; const k = ks[Math.floor(Math.random() * ks.length)]; x = k.x; y = k.y - 20; }
    else if (F.form === 'stage') { x = pzx() + rand(-34, 34); y = pzy() - 30; }
    else { x = pzx() + rand(-60, 60); y = pzy() + 2 + rand(-10, 16); }
    // 위쪽 칸과 아래 탭에 가려진 곳에는 내지 않아요
    const vv = visMap(); if (vv) { x = Math.min(vv[2] - 14, Math.max(vv[0] + 14, x)); y = Math.min(vv[3] - 14, Math.max(vv[1] + 18, y)); }
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'fest-item');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', F.label ? F.label : F.item === 'meteor' ? '별똥별' : F.item === 'lantern' ? '소원 등불' : F.item === 'firefly' ? '반딧불' : F.item === 'paper' ? '보물 쪽지' : F.item === 'balloon' ? '풍선' : F.item === 'note' ? '음표' : '웃음 별');
    g.style.setProperty('--bc', FEST_COLORS[Math.floor(Math.random() * FEST_COLORS.length)]);
    // 보물 쪽지가 풀숲에서 잘 안 보여서 더 크게, 밝은 고리와 둘레 빛, 통통 튀게
    if (F.item === 'paper' || (F.fv && F.how === 'pop')) { g.classList.add('fi-paper'); g.innerHTML = `<circle r="20" class="drop-hit"/><circle r="17" class="fi-glow"/><circle r="15" class="fi-ring"/><g class="fi-in"><g class="fi-bob">${festItemSvg(F.item, 30)}</g></g>`; }
    else g.innerHTML = `<circle r="15" class="drop-hit"/><circle r="12" class="fi-glow"/><g class="fi-in">${festItemSvg(F.item)}</g>`;
    g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    layerFx.appendChild(g);
    const it = { g, x, y, born: performance.now(), life: F.how === 'rise' ? 3800 : F.how === 'fall' ? 2600 : F.how === 'drop' ? 6000 : F.how === 'roll' ? 6500 : F.item === 'paper' || F.fv ? 2600 : 2000, dead: false, rise: F.how === 'rise', fall: F.how === 'fall', drop: F.how === 'drop', roll: F.how === 'roll' };
    const hit = e => { e.preventDefault(); e.stopPropagation(); festHit(it); };
    g.addEventListener('pointerdown', hit);
    rt.fest.items.push(it);
    if (!rt.reduced && g.animate && !it.rise && !it.fall) g.querySelector('.fi-in').animate([{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1.15)', opacity: 1, offset: 0.25 }, { transform: 'scale(1)', opacity: 1 }], { duration: 320 });
  }
  function festHit(it) {
    const R = rt.fest;
    if (!R || it.dead) return;
    it.dead = true; R.n += 1;
    feverCombo(R, it.x, it.y);
    const v = Math.max(1, nice(rate() * 3 * rtEvt()));
    S.budget += v; earn(v);
    floatText(it.x, it.y - 10, '+' + fmt(v), 'gold');
    if (festDef(R.id).bf) bfBurst(it.x, it.y);   // 불꽃이 펴져요(그림이 있을 때)
    fxeHit(it, festDef(R.id));   // 행사 효과층: 풍선 조각, 음표 반짝이, 불꽃, 박수 파도
    sfx('coin'); buzz(10);
    if (!rt.reduced && it.g.animate) it.g.animate([{ transform: `translate(${it.x}px, ${it.y}px) scale(1)`, opacity: 1 }, { transform: `translate(${it.x}px, ${it.y}px) scale(1.8)`, opacity: 0 }], { duration: 220 }).onfinish = () => it.g.remove();
    else it.g.remove();
    renderFestBar();
  }
  function updateFest(dt, now) {
    const R = rt.fest;
    if (!R) return;
    const F = festDef(R.id);
    fxeTick();   // 행사 효과층 깨우기
    renderFestBar();
    if (feverIntro(R, dt, F.name, F.hint ? F.hint : F.item === 'meteor' ? '떨어지는 별똥별을 눌러요' : F.item === 'lantern' ? '떠오르는 등불을 눌러요' : F.item === 'firefly' ? '깜빡이는 반딧불을 눌러요' : F.item === 'paper' ? '곳곳에 반짝이는 쪽지를 눌러요' : F.item === 'balloon' ? '날아오르는 풍선을 눌러요' : F.item === 'note' ? '떠오르는 음표를 눌러요' : '반짝이는 웃음 별을 눌러요')) return;
    if (R.ending) return;
    R.t -= dt; R.spawn -= dt;
    if (R.spawn <= 0) { R.spawn = F.sec / (F.goal * 2); if (R.items.filter(i => !i.dead).length < 7) festSpawn(F); }
    for (const it of R.items) {
      if (it.dead) continue;
      const age = now - it.born;
      if (it.fall) { it.x += dt * 62; it.y += dt * 40; it.g.setAttribute('transform', `translate(${it.x.toFixed(1)} ${it.y.toFixed(1)})`); }   // 별똥별
      if (it.drop) { it.y += dt * 62; it.x += Math.sin(age / 300) * 0.3; it.g.setAttribute('transform', `translate(${it.x.toFixed(1)} ${it.y.toFixed(1)})`); }   // 축제 부스
      if (it.roll) { it.x += dt * 70; it.g.setAttribute('transform', `translate(${it.x.toFixed(1)} ${it.y.toFixed(1)}) rotate(${(it.x * 4 % 360).toFixed(0)})`); }
      const vf = (it.fall || it.drop || it.roll) && visMap(); if (vf && (it.x > vf[2] - 10 || it.y > vf[3] - 10)) it.born = -1e9;   // 화면 밖으로 나가면 사라져요
      if (it.rise) { it.y -= dt * 30; it.x += Math.sin(age / 400) * 0.25; it.g.setAttribute('transform', `translate(${it.x.toFixed(1)} ${it.y.toFixed(1)})` + (fxOn() ? ` rotate(${(Math.sin(age / 500) * 9).toFixed(1)})` : '')); }   // 풍선, 등불, 음표가 좌우로 살랑
      const vt = it.rise && visMap();   // 떠오르는 음표와 풍선은 위쪽 칸에 닿기 전에 사라져요(가려져서 못 누르는 일이 없게)
      if (age > it.life || (vt && it.y < vt[1] + 12)) { it.dead = true; if (!rt.reduced && it.g.animate) it.g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 }).onfinish = () => it.g.remove(); else it.g.remove(); }
    }
    R.items = R.items.filter(i => !i.dead || i.g.isConnected);
    // 학예회: 4초마다 다른 친구가 무대에 올라가요
    if (F.form === 'stage') {
      R.perf -= dt;
      if (R.perf <= 0) {
        R.perf = 4;
        const ks = rt.kids.filter(k => k.hold);
        if (R.star) { R.star.tx = R.star.homeX; R.star.ty = R.star.homeY; }
        const k = ks[Math.floor(Math.random() * ks.length)];
        if (k) { k.homeX = k.tx; k.homeY = k.ty; k.tx = pzx() + rand(-10, 10); k.ty = pzy() - 18; R.star = k; }
      }
    }
    renderFestBar();
    if (R.t <= 0 && !R.ending) { R.ending = true; R.items.forEach(i => { i.dead = true; i.g.remove(); }); feverEnd(endFest); }
  }
  function endFest() {
    const R = rt.fest; if (!R) return;
    const F = festDef(R.id);
    fxeReset(); fxeEnd(F, R.n >= F.goal);   // 학사모 던지기, 색종이
    rt.fest = null; renderTeachersOnMap();
    R.items.forEach(i => i.g.remove());
    festStage(false); festLighting(false);
    rt.kids.forEach(k => { if (k.hold) { k.hold = false; k.speed = rand(14, 22); pickTarget(k); } });
    $('#festBar').hidden = true;
    if (F.form === 'rows' && !rt.reduced) {   // 찰칵! 하얗게 번쩍해요
      const fl = document.createElement('div'); fl.className = 'camflash'; $('.stage').appendChild(fl); setTimeout(() => fl.remove(), 700);
    }
    festCamera(false); festGarland(false); festPhotoDecor(false); festNightDecor(null);
    if (F.fv) { fvBoothEnd(R, F); return; }   // 축제 부스 놀이는 따로 끝내요
    if (F.bf) { bfFwEnd(R, F); return; }   // 대축제 불꽃놀이
    S.fest.n[R.id] = (S.fest.n[R.id] || 0) + 1;
    // 밤(20~6시)에는 낮 행사가 잠겨서 메인 퀘스트가 멈췄어요. 밤 행사를 한 번 열면 그 퀘스트를 한 것으로 쳐요
    { const cm = curMain(); if (F.night && cm && cm.t === 'fest' && FEST[cm.k] && !FEST[cm.k].night && festBase(cm.k)) { if (!S.fest.sub) S.fest.sub = {}; S.fest.sub[cm.k] = (S.fest.sub[cm.k] || 0) + 1; } }
    const win = R.n >= F.goal;
    addLeague(win ? LP.festWin : LP.festLose);
    rt.sportsWin = win; rt.prizeName = F.name; rt.prizeId = R.id;
    $('#srTitle').textContent = win ? `${F.name} 성공!` : `${F.name} 끝!`;
    $('#srScore').textContent = `${R.n}/${F.goal}${F.unit}`;
    $('#srText').textContent = (win ? `${F.win} 상품으로 도토리를 받아요.` : `아깝게 ${F.goal - R.n}${F.unit} 모자랐어요. 그래도 도토리를 조금 받아요.`) + `${vpLv() ? ` ${profText('교감 선생님')} 덕분에 +${VP.per * vpLv()}%예요.` : ''}`;
    $('#srPrize').textContent = fmt(festPrize(win));
    $('#srArt').innerHTML = IMG('fest_ic_' + R.id) ? festIcon(R.id) : FEST_ICON[R.id] ? `<svg viewBox="-11 -11 22 22" aria-hidden="true">${FEST_ICON[R.id]}</svg>` : festIcon(R.id);   // 밤 행사는 그림 아이콘만
    sfx(win ? 'quest' : 'done'); buzz(20);
    musicSync(); save(); renderFestBtn(); checkQuests(); renderAffordance();
    queueModal(() => { openModal($('#mSportsEnd')); return true; });
  }

  /* ---------- 대학 축제 (프로젝트 문서 ' 설계안 (대학 축제)', 그림은 작업지시서 63) ----------
     매주 월, 수, 금(게임 시계, 한국 시간)에 광장 구역에서 열려요. 대학교이고 학생회관이 있어야 해요
     다니는 단과대학마다 부스 하나(하루 한 번 30초 놀이, 움직임만 학교 행사 틀을 써요), 손님 학교 세 곳, 요일 보너스 하나, 한 주 도장판
     숫자(FV)는 woodani가 제안대로 확정했어요(저녁): 부스 10분치, 손님 15분치, 기념품 6번 성공, 30초에 14개, 도장판 보상 다섯 단계. 서버 규칙은 바꾸지 않아요(손님 학교는 이미 읽은 랭킹에서 골라요) */
  const FV = { days: [0, 2, 4], sec: 30, goal: 14, boothMin: 10, guestMin: 15, deanPct: 5, win: 6, dayMax: 5, weekMax: 15,
    steps: [[3, 'tk', 2], [6, 'ess', 10], [9, 'tk', 3], [12, 'ess', 15], [15, 'gold', 1]],
    bonus: { 0: 'picnic', 2: 'snack', 4: 'show' }, bonusTx: { picnic: '소풍 수확 +100%', snack: '간식 뽑기 하나 더', show: '동아리 발표회 +100%' } };
  // 부스 놀이: nm 누르는 물건, how 움직임(rise 떠오르기, drop 떨어지기, roll 굴러오기, pop 숨은 것 찾기). 기념품 장식 이름은 FV_SV
  const FV_B = {
    science: { nm: '비커', how: 'rise' }, sports: { nm: '공', how: 'roll' },
    human: { nm: '책', how: 'pop' }, art: { nm: '음표', how: 'rise' },
    biz: { nm: '도토리 동전', how: 'drop' }, eng: { nm: '톱니바퀴', how: 'pop' },
    edu: { nm: '분필', how: 'drop' }, med: { nm: '반창고', how: 'rise' } };
  const FV_KEYS = Object.keys(FV_B), FV_WD = ['월', '화', '수', '목', '금', '토', '일'];
  const FV_HOW = { rise: '떠오르는', drop: '떨어지는', roll: '굴러오는', pop: '곳곳에 숨은' };
  // 랭킹을 못 읽는 판(토스, 오프라인)에 오는 꾸며 낸 이웃 학교: [교장 선생님 이름, 학교급, 학년]
  const FV_FAKE = [['솔방울', 3, 2], ['산딸기', 2, 1], ['은방울', 4, 1], ['개암나무', 3, 3], ['물푸레', 1, 5], ['싸리꽃', 2, 3], ['머루', 4, 2], ['다래', 1, 3], ['밤송이', 3, 1]];
  // 광장 구역 지도(360 × 540 칸) 위 자리: 부스 세 곳, 무대, 등불 기둥, 만국기, 손님 깃발 세 곳
  // 대축제 사흘 동안 광장 말고 다른 구역과 캠퍼스 지도에도 만국기 [x, y, 너비] (설계 8절, 그림은 fv_bunting 다시 쓰기)
  const BF_BUNT = { campus: [[124, 186, 116]], academic: [[176, 200, 124]], life: [[172, 236, 124]], sports: [[104, 262, 150]] };
  const FV_POS = { booth: [[60, 152, 56], [292, 152, 56], [270, 326, 50]], stage: [285, 268, 52], lamp: [[108, 252, 16], [242, 252, 16]], bunt: [108, 208, 134], flag: [[112, 318], [138, 366], [214, 366], [76, 270], [324, 334]] };   // 대축제에는 손님 다섯 곳(뒤 두 곳)
  const freshFv = () => ({ wk: -1, st: 0, got: [0, 0, 0, 0, 0], day: '', b: {}, g: [0, 0, 0, 0, 0], o: 0, win: {}, own: {}, tip: -1, td: '' });
  function sanitizeFv(d, s) {
    const f = freshFv(), F = d && d.fv && typeof d.fv === 'object' ? d.fv : null; s.fv = f; if (!F) return;
    const n = (v, hi, lo = 0) => typeof v === 'number' && isFinite(v) ? Math.max(lo, Math.min(hi, Math.floor(v))) : lo;
    f.wk = n(F.wk, 1e6, -1); f.st = n(F.st, FV.weekMax); f.tip = n(F.tip, 1e6, -1); f.o = F.o ? 1 : 0;
    f.day = typeof F.day === 'string' ? F.day.slice(0, 10) : ''; f.td = typeof F.td === 'string' ? F.td.slice(0, 10) : '';
    if (Array.isArray(F.got)) f.got = FV.steps.map((_, i) => F.got[i] ? 1 : 0);
    if (Array.isArray(F.g)) f.g = [0, 1, 2, 3, 4].map(i => F.g[i] ? 1 : 0);   // 대축제에는 손님 다섯 곳
    for (const k of FV_KEYS) {
      if (F.b && typeof F.b === 'object' && F.b[k]) f.b[k] = n(F.b[k], BIG.booth, 1);   // 대축제에는 부스 하루 두 번
      if (F.win && typeof F.win === 'object') { const w = n(F.win[k], 9999); if (w) f.win[k] = w; }
      if (F.own && typeof F.own === 'object' && F.own[k]) f.own[k] = 1;
    }
  }
  // 축제와 교환학생의 '수업료 N분치'는 학교급 배수(minAcorns) 없이 글자 그대로 N분치예요
  const fvPay = m => Math.max(10, nice(rate() * 60 * m * rtEvt()));
  const fvWd = () => kstWd(gameToday());
  const fvDay = () => FV.days.includes(fvWd()) || !!bfWin(gameToday());   // 대축제 사흘(마지막 금토일)도 축제 날
  const fvOpen = () => uniNow() && (S.f.union || 0) >= 1 && !!S.fv;
  const fvOn = () => fvOpen() && fvDay();
  const fvBonus = k => !!S && fvOn() && FV.bonus[fvWd()] === k;   // 요일 보너스: 월 소풍, 수 간식 뽑기, 금 발표회
  // 요일 보너스가 걸린 창(소풍, 간식 뽑기, 동아리)에 한 줄 표시를 넣었다 뺐다 해요
  function fvFlag(anchor, k, tx) {
    if (!anchor) return;
    const nx = anchor.nextElementSibling, has = !!nx && nx.classList.contains('fv-flag'), on = fvBonus(k);
    if (on && !has) { const p = document.createElement('p'); p.className = 'fv-flag'; p.textContent = tx; anchor.after(p); }
    else if (!on && has) nx.remove();
  }
  const fvNext = () => { const w = fvWd(); if (bfWin(gameToday())) return ''; for (let i = 1; i <= 7; i++) if (FV.days.includes((w + i) % 7)) return FV_WD[(w + i) % 7] + '요일'; return ''; };
  /* ---------- 한 달에 한 번 대축제 (프로젝트 문서 ' 설계안 (한 달에 한 번 대축제)', 그림은 작업지시서 70) ----------
     매달 마지막 금, 토, 일 사흘. 대학교(학생회관 Lv.1)만. 달 장식은 다음 해 같은 달에 다시 받을 수 있어요. 마지막 단계 24개. 곡은 새로(Suno)
     부스 하루 두 번, 손님 다섯 곳, 밤 20~24시 불꽃놀이, 사흘 동안 모으는 도장판. 매주 축제(월수금)는 그대로이고 사흘은 축제 날로 쳐요(fvDay)
     숫자는 본부 제안이에요. 서버 규칙은 바꾸지 않아요 */
  const BIG = { max: 24, dayMax: 10, booth: 2, guests: 5, guestSt: 2, fwFrom: 20, fwSec: 30, fwGoal: 16, fwWin: 3, fwLose: 1, fwEss: 5,
    steps: [[4, 'm5', 3], [8, 'ess', 15], [12, 'm30', 1], [16, 'ess', 25], [20, 'gold', 1], [24, 'deco', 1]] };
  const bfYmd = ms => new Date(ms).toISOString().slice(0, 10);
  // 그 달 마지막 금요일(m은 1~12)
  const bfFri = (y, m) => { const last = Date.UTC(y, m, 0); return bfYmd(last - ((new Date(last).getUTCDay() + 2) % 7) * 86400000); };
  const bfMk = (y, m) => { const st = bfFri(y, m); return { key: `${y}-${String(m).padStart(2, '0')}`, mon: m, start: st, i: 0 }; };
  // 날짜 t가 대축제 사흘 안이면 { key 그 달, mon 달, start 금요일, i 며칠째(0~2) }. 금요일이 그달 끝이면 토, 일은 다음 달 1, 2일이에요
  function bfWin(t) {
    if (!t) return null;
    const y = +t.slice(0, 4), m = +t.slice(5, 7), d = dayNo(t);
    for (const [yy, mm] of [[y, m], m === 1 ? [y - 1, 12] : [y, m - 1]]) { const w = bfMk(yy, mm), i = d - dayNo(w.start); if (i >= 0 && i <= 2) { w.i = i; return w; } }
    return null;
  }
  // 다음 대축제(지금이 대축제 중이면 그것)
  function bfNext(t) {
    const w = bfWin(t); if (w) return w;
    const y = +t.slice(0, 4), m = +t.slice(5, 7), a = bfMk(y, m);
    return dayNo(a.start) > dayNo(t) ? a : bfMk(m === 12 ? y + 1 : y, m === 12 ? 1 : m + 1);
  }
  const bfMd = t => `${+t.slice(5, 7)}월 ${+t.slice(8, 10)}일`;
  const bfNextTx = () => { const n = bfNext(gameToday()); return `다음 대축제 ${bfMd(n.start)}(금)부터 사흘`; };
  const bfOn = () => !!S && !!S.bf && fvOpen() && !!bfWin(gameToday());
  const bfFw = () => bfOn() && kstHour(gameNow()) >= BIG.fwFrom;   // 불꽃놀이는 밤 8시부터 자정까지
  const bfDecoId = mon => 'deco_bf_' + String(mon).padStart(2, '0');
  const freshBf = () => ({ mon: '', st: 0, got: [0, 0, 0, 0, 0, 0], day: '', dn: 0, o: 0, g2: 0, fw: 0, own: {}, eve: '', tip: '', auto: '' });
  function sanitizeBf(d, s) {
    const f = freshBf(), B = d && d.bf && typeof d.bf === 'object' ? d.bf : null; s.bf = f; if (!B) return;
    const n = (v, hi) => typeof v === 'number' && isFinite(v) ? Math.max(0, Math.min(hi, Math.floor(v))) : 0;
    const str = (v, k) => typeof v === 'string' ? v.slice(0, k) : '';
    f.mon = str(B.mon, 7); f.day = str(B.day, 10); f.eve = str(B.eve, 7); f.tip = str(B.tip, 7); f.auto = str(B.auto, 7);
    f.st = n(B.st, BIG.max); f.dn = n(B.dn, BIG.dayMax); f.o = B.o ? 1 : 0; f.g2 = B.g2 ? 1 : 0; f.fw = B.fw ? 1 : 0;
    if (Array.isArray(B.got)) f.got = BIG.steps.map((_, i) => B.got[i] ? 1 : 0);
    if (B.own && typeof B.own === 'object') for (let i = 1; i <= 12; i++) { const k = String(i).padStart(2, '0'); if (B.own[k]) f.own[k] = 1; }
  }
  function bfSync() {
    if (!S || !S.bf) return;
    const t = gameToday(), w = bfWin(t); let ch = false;
    if (w && S.bf.mon !== w.key) { S.bf.mon = w.key; S.bf.st = 0; S.bf.got = BIG.steps.map(() => 0); ch = true; }   // 새 달 대축제는 빈 도장판으로
    if (dayRoll(S.bf, t)) { S.bf.dn = 0; S.bf.o = 0; S.bf.g2 = 0; S.bf.fw = 0; ch = true; }
    if (ch) save();
  }
  const bfStampIc = px => { const u = IMG('ic_bf_stamp') || IMG('ic_fv_stamp'); return u ? `<img src="${u}" alt="" style="width:${px}px;height:${px}px">` : '🔖'; };
  const bfDecoIc = (mon, px) => { const u = IMG(bfDecoId(mon)); return u ? `<img src="${u}" alt="" style="width:${px}px;height:${px}px;object-fit:contain">` : '🎁'; };
  // 대축제 도장(하루 10개, 사흘 24개까지)을 찍고, 채운 단계의 보상을 바로 줘요
  function bfStamp(n) {
    const w = bfWin(gameToday()); if (!w || !S.bf) return [];
    bfSync();
    const add = Math.max(0, Math.min(n, BIG.dayMax - S.bf.dn, BIG.max - S.bf.st)); if (!add) return [];
    S.bf.dn += add; S.bf.st += add;
    const out = [{ ic: bfStampIc(18), t: `대축제 도장 +${add} (${S.bf.st}/${BIG.max})` }];
    BIG.steps.forEach(([need, kind, amt], i) => {
      if (S.bf.st < need || S.bf.got[i]) return;
      S.bf.got[i] = 1;
      if (kind === 'm5' || kind === 'm30') { S.tk[kind] = Math.min(SAVE_CAP.count, S.tk[kind] + amt); out.push({ ic: 'ticket', t: `도장 ${need}개: ${kind === 'm5' ? '5분권' : '30분권'} +${amt}` }); }
      else if (kind === 'ess') { addEss(amt); out.push({ ic: 'ess', t: `도장 ${need}개: 숲의 정수 +${amt}` }); }
      else if (kind === 'gold') { addGold(amt); out.push({ ic: 'gold', t: `도장 ${need}개: 황금 도토리 +${amt}` }); }
      else { const k = String(w.mon).padStart(2, '0'), had = !!S.bf.own[k]; S.bf.own[k] = 1; if (S.deco && S.deco.own) S.deco.own[bfDecoId(w.mon)] = 1;
        out.push({ ic: bfDecoIc(w.mon, 22), t: had ? `도장 ${need}개: ${BF_DECO[w.mon - 1]} (이미 있어요)` : `도장 ${need}개: ${w.mon}월 장식 '${BF_DECO[w.mon - 1]}' (꾸미기에서 놓아요)` }); }
    });
    return out;
  }
  // '한 판 더' 광고(하루 한 번씩): k는 'fv' 'fw' 'xg' 'cs'. 광고를 끝까지 보면 go가 true일 때만 그날 쓴 것으로 쳐요
  const adxCan = k => { if (!S) return false; adxDay(); return !S.adx[k]; };
  const adxBtn = (dat, tx) => `<button class="btn-sub small adx-btn" type="button" ${dat}>📺 ${tx}</button>`;
  function adxMore(k, go) {
    if (!adxCan(k)) { toast('광고로 더 하기는 하루 한 번이에요'); return false; }
    showAd(() => { adxDay(); if (go()) { S.adx[k] = 1; save(); } }, r => { if (r !== 'noad') toast('광고를 끝까지 보지 않아서 보상이 없어요'); });
    return true;
  }
  // 축제 창 안 대축제 칸: 불꽃놀이와 도장판
  function bfPart(w) {
    const done = !!S.bf.fw, can = bfFw(), mm = String(w.mon).padStart(2, '0');
    let h = `<p class="fv-bonus">${bfStampIc(16)}대축제! <b>부스 하루 두 번, 손님 다섯 곳</b></p>`;
    h += '<h3 class="fv-h">밤 불꽃놀이</h3><div class="dp-list fv-list">' +
      `<div class="dp-row${done ? ' on' : ''}"><span class="dp-ic">${IMG('bf_burst_gold') ? `<img src="${IMG('bf_burst_gold')}" alt="" style="width:38px;height:38px">` : '🎆'}</span><div class="dp-tx"><b>광장 불꽃놀이</b><small>불꽃 씨앗 ${BIG.fwGoal}개 누르기, ${BIG.fwSec}초</small><em>성공하면 숲의 정수 ${BIG.fwEss}</em></div>` +
      (done ? (can && adxCan('fw') ? adxBtn('data-fv="adfw:1"', '한 번 더') : '<span class="fe-lock">오늘 끝</span>') : can ? '<button class="cta small" type="button" data-fv="fw:1">하기</button>' : '<span class="fe-lock">밤 8시부터</span>') + '</div></div>';
    h += `<h3 class="fv-h">대축제 도장판 <small>${S.bf.st}/${BIG.max}, 오늘 ${S.bf.dn}/${BIG.dayMax}</small></h3><div class="fv-board bf-board">` +
      Array.from({ length: BIG.max }, (_, i) => { const stp = BIG.steps.find(x => x[0] === i + 1); return `<span class="fv-st${i < S.bf.st ? ' on' : ''}${stp ? ' gift' : ''}">${i < S.bf.st ? bfStampIc(22) : stp ? (stp[1] === 'deco' ? bfDecoIc(w.mon, 22) : stp[1] === 'ess' ? '✨' : stp[1] === 'gold' ? '🌰' : '🎫') : ''}</span>`; }).join('') + '</div>' +
      '<p class="fv-steps">' + BIG.steps.map(([need, kind, amt], i) => `<span class="${S.bf.got[i] ? 'ok' : ''}">${need}개 ${kind === 'm5' ? `5분권 ${amt}장` : kind === 'm30' ? `30분권 ${amt}장` : kind === 'ess' ? `숲의 정수 ${amt}` : kind === 'gold' ? `황금 도토리 ${amt}` : `${w.mon}월 장식 '${BF_DECO[w.mon - 1]}'${S.bf.own[mm] ? '(있음)' : ''}`}</span>`).join('') + '</p>';
    return h;
  }
  // 불꽃놀이 놀이 틀: 학교 행사 놀이(rt.fest)에 얹어요
  function bfDef(id) {
    if (id !== 'bf_fw') return null;
    return { name: '대축제 불꽃놀이', sec: BIG.fwSec, goal: BIG.fwGoal, form: 'ring', item: 'bf_seed', how: 'rise', unit: '개', bf: 1, label: '불꽃 씨앗', hint: '떠오르는 불꽃 씨앗을 눌러 터뜨려요' };
  }
  function bfFwStart(extra) {
    bfSync();
    if (!bfFw() || (S.bf.fw && !extra) || festBusy()) { if (bfOn() && !bfFw()) toast('불꽃놀이는 밤 8시부터 열려요'); return false; }
    if (tr2Busy()) { toast(tr2Busy()); return false; }
    const go = () => {
      zoneGo('plaza'); setTab('school'); closeSheet();
      $('#scroller').scrollTo({ top: 0, behavior: rt.reduced ? 'auto' : 'smooth' });
      rt.fest = { id: 'bf_fw', t: BIG.fwSec, n: 0, spawn: 0.6, items: [], perf: 0, intro: 3 }; renderTeachersOnMap();
      feverOn(true); festForm('ring');
      S.bf.fw = 1;   // 시작하면 오늘 한 것으로 쳐요
      $('#festBar').hidden = false;
      festFocusNow(); renderFestBar(); musicSync(); buzz(20);
      save(); renderFestBtn(); fvMap(true);
    };
    if (rt.modalOpen === $('#mFv')) closeModal($('#mFv'), go); else if (!rt.modalOpen) go(); else return false;
    return true;
  }
  function bfFwEnd(R, F) {
    const win = R.n >= F.goal, items = [];
    if (win) { addEss(BIG.fwEss); items.push({ ic: 'ess', t: `숲의 정수 +${BIG.fwEss}` }); }
    items.push(...bfStamp(win ? BIG.fwWin : BIG.fwLose));
    sfx(win ? 'quest' : 'done'); buzz(20);
    musicSync(); save(); renderHUD(); renderFestBtn(); fvMap(true);
    const u = IMG('bf_burst_pink');
    showReward({ title: win ? '불꽃놀이 대성공!' : '불꽃놀이 끝!', sub: win ? `불꽃 ${R.n}송이가 밤하늘에 펴졌어요` : `${F.goal - R.n}송이가 모자랐어요. 도장은 받아요`, art: u ? `<img src="${u}" alt="" style="width:120px;height:120px">` : '🎆', big: `${R.n}/${F.goal}개`, items });
  }
  // 누른 자리에 불꽃 한 송이(그림이 있을 때만)
  function bfBurst(x, y) {
    const ks = ['bf_burst_gold', 'bf_burst_pink', 'bf_burst_blue'].filter(k => IMG(k)); if (!ks.length) return;
    const im = document.createElementNS(NS, 'image'), w = 64;
    im.setAttribute('href', IMG(ks[Math.floor(Math.random() * ks.length)])); im.setAttribute('x', (x - w / 2).toFixed(1)); im.setAttribute('y', (y - w / 2).toFixed(1)); im.setAttribute('width', w); im.setAttribute('height', w);
    im.setAttribute('pointer-events', 'none'); im.style.transformOrigin = `${x}px ${y}px`; im.style.transformBox = 'view-box'; layerFx.appendChild(im);
    if (!rt.reduced && im.animate) im.animate([{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'scale(1)', offset: 0.3 }, { opacity: 0, transform: 'scale(1.15)' }], { duration: 900, easing: 'ease-out' }).onfinish = () => im.remove();
    else setTimeout(() => im.remove(), 600);
  }
  // 대축제 첫날 처음 들어오면 축제 창을 한 번 띄워요(시험판에서는 __BF_AUTO일 때만)
  function bfAuto() {
    if (!bfOn() || (window.__FOREST_TEST && !window.__BF_AUTO)) return;
    const w = bfWin(gameToday());
    if (S.bf.auto === w.key || rt.tab !== 'school' || rt.modalOpen || rt.paused || festBusy() || !S.tut.st || rt.talkSeq || rt.st) return;
    S.bf.auto = w.key; save(); openFv();
  }
  function fvSync() {
    if (!S || !S.fv) return;
    const wk = gameWeek(), t = gameToday(); let ch = false;
    if (S.fv.wk !== wk) { S.fv.wk = wk; S.fv.st = 0; S.fv.got = FV.steps.map(() => 0); ch = true; }   // 도장판은 매주 월요일 0시에 새로
    if (dayRoll(S.fv, t)) { S.fv.b = {}; S.fv.g = [0, 0, 0, 0, 0]; S.fv.o = 0; ch = true; }
    bfSync();
    if (ch) save();
  }
  const fvBooths = () => deptPicks().filter(k => FV_B[k]);
  const fvItemImg = (k, px) => { const u = IMG('fv_item_' + k); return u ? `<img src="${u}" alt="" style="width:${px}px;height:${px}px;object-fit:contain">` : deptOf(k).em; };
  const fvStampsToday = () => fvBooths().filter(k => S.fv.b[k]).length + ([0, 1, 2].every(i => S.fv.g[i]) ? 1 : 0) + (S.fv.o ? 1 : 0);
  const fvBoothMax = () => bfOn() ? BIG.booth : 1;   // 대축제에는 부스마다 하루 두 번
  // 도장을 찍고, 채운 단계의 보상을 바로 줘요
  function fvStamp(n) {
    const was = S.fv.st; S.fv.st = Math.min(FV.weekMax, S.fv.st + n);
    const out = [];
    FV.steps.forEach(([need, kind, amt], i) => {
      if (S.fv.st < need || S.fv.got[i]) return;
      S.fv.got[i] = 1;
      if (kind === 'tk') { S.tk.m5 = Math.min(SAVE_CAP.count, S.tk.m5 + amt); out.push({ ic: 'ticket', t: `도장 ${need}개: 5분권 +${amt}` }); }
      else if (kind === 'ess') { addEss(amt); out.push({ ic: 'ess', t: `도장 ${need}개: 숲의 정수 +${amt}` }); }
      else { addGold(amt); out.push({ ic: 'gold', t: `도장 ${need}개: 황금 도토리 +${amt}` }); }
    });
    if (S.fv.st > was) out.unshift({ ic: fvStampIc(18), t: `축제 도장 +${S.fv.st - was} (${S.fv.st}/${FV.weekMax})` });
    return out;
  }
  const fvStampIc = px => { const u = IMG('ic_fv_stamp'); return u ? `<img src="${u}" alt="" style="width:${px}px;height:${px}px">` : '🔖'; };
  // 손님 학교 세 곳: 이미 읽은 랭킹 위쪽 50곳에서 내 학교를 빼고, 날짜로 정해진 차례대로. 랭킹이 없으면 꾸며 낸 이웃 학교
  const fvGuestSp = (t, i) => DEX_STUDENTS[dayHash('fv' + t + i) % DEX_STUDENTS.length];   // 손님 학교의 대표 동물: 날짜와 차례로 한 종
  function fvGuests() {
    const t = gameToday(), rows = (typeof Rank !== 'undefined' && Rank.state === 'on' && !tossRank() ? Rank.rows || [] : []).filter(r => r.id !== Rank.uid && !r.test && !r.nx).slice(0, 50);
    const gn = bfOn() ? BIG.guests : 3, key = t + '|' + gn + '|' + rows.length + '|' + (rows[0] ? rows[0].id : '');
    if (rt.fvGs && rt.fvGs.key === key) return rt.fvGs.list;
    const dn = Math.floor(Date.parse(t + 'T00:00:00Z') / 86400000), list = [];
    if (rows.length >= gn) for (let i = 0; i < gn; i++) { const r = rows[(dn * 3 + i) % rows.length]; list.push({ id: r.id, who: r.name, sch: rankSchool(r.tier, r.year, r.sem), real: true, sp: fvGuestSp(t, i) }); }
    else for (let i = 0; i < gn; i++) { const f = FV_FAKE[(dn * 3 + i) % FV_FAKE.length]; list.push({ id: '', who: f[0], sch: rankSchool(f[1], f[2], null), real: false, sp: fvGuestSp(t, i) }); }
    rt.fvGs = { key, list };
    return list;
  }
  function openFv() {
    if (!S || rt.paused || festBusy()) return;
    if (!uniNow()) { toast('대학 축제는 대학교에서 열려요'); return; }
    if (!fvOpen()) { toast('학생회관을 지으면 축제가 열려요'); return; }
    if (rt.modalOpen && rt.modalOpen !== $('#mFv')) return;
    fvSync(); sfx('tap');
    let news = [];
    if (fvOn() && !S.fv.o) { S.fv.o = 1; news = fvStamp(1); save(); }   // 축제 날 창을 열면 도장 하나
    if (bfOn() && !S.bf.o) { S.bf.o = 1; news = news.concat(bfStamp(1)); save(); }   // 대축제 도장도 하나
    renderFv();
    if (rt.modalOpen !== $('#mFv')) openModal($('#mFv'));
    if (news.length) toast(news.map(x => x.t).join('\n'));
  }
  function renderFv() {
    const m = $('#mFv'); if (!m || !S || !S.fv) return;
    fvSync();
    const on = fvOn(), bw = on && bfOn() ? bfWin(gameToday()) : null, hu = (bw && IMG('bf_head')) || IMG('fv_head'), hd = $('#fvHead');
    hd.classList.toggle('art', !!hu); hd.style.backgroundImage = hu ? `url("${blobUrl(hu)}")` : '';
    setT($('#fvTitle'), bw ? '숲속 대학교 대축제' : '대학 축제');
    setT($('#fvDayTx'), bw ? `대축제 ${bw.i + 1}일째 (사흘 중)` : on ? '오늘 축제 중' : `다음 축제 ${fvNext()}`);
    let h = '';
    if (on) {
      const bn = FV.bonus[fvWd()];
      if (bn) h += `<p class="fv-bonus">${fvStampIc(16)}오늘의 보너스 <b>${FV.bonusTx[bn]}</b></p>`;
      if (bw) h += bfPart(bw);
      h += '<h3 class="fv-h">단과대학 부스</h3><div class="dp-list fv-list">' + (fvBooths().map(k => {
        const D = deptOf(k), bn = S.fv.b[k] || 0, done = bn >= fvBoothMax(), w = S.fv.win[k] || 0, own = !!S.fv.own[k];
        return `<div class="dp-row${done ? ' on' : ''}"><span class="dp-ic">${fvItemImg(k, 38)}</span><div class="dp-tx"><b>${D.name} 부스</b><small>${FV_B[k].nm} ${FV.goal}개 누르기, ${FV.sec}초${fvBoothMax() > 1 ? `, 오늘 ${bn}/${fvBoothMax()}번` : ''}</small><em>${own ? '기념품 받음' : `기념품까지 ${Math.min(w, FV.win)}/${FV.win}`}</em></div>` +
          (done ? (adxCan('fv') ? adxBtn(`data-fv="adb:${k}"`, '한 판 더') : '<span class="fe-lock">오늘 끝</span>') : `<button class="cta small" type="button" data-fv="booth:${k}">하기</button>`) + '</div>';
      }).join('') || '<p class="dp-note">학과 사무실에서 단과대학을 고르면 부스가 서요</p>') + '</div>';
      const gs = fvGuests(), fl = IMG('fv_flag');
      h += '<h3 class="fv-h">손님 학교</h3><div class="dp-list fv-list">' + gs.map((g, i) => {
        const met = !!S.fv.g[i];
        return `<div class="dp-row${met ? ' on' : ''}"><span class="dp-ic">${IMG('chr_' + g.sp) ? pcChr(g.sp, 40) : fl ? `<img src="${fl}" alt="" style="width:28px;height:42px;object-fit:contain">` : '🚩'}</span><div class="dp-tx"><b>${esc(g.who)} 교장 선생님</b><small>${esc(g.sch)}, 대표 ${spName(g.sp)}</small>` +
          (g.real ? `<button class="btn-link fv-look" type="button" data-fv="look:${i}">구경 가기</button>` : '') + '</div>' +
          (met ? '<span class="fe-lock">만났어요</span>' : `<button class="cta small" type="button" data-fv="meet:${i}">만나기</button>`) + '</div>';
      }).join('') + '</div>';
    } else h += `<p class="dp-note">축제는 매주 월, 수, 금요일에 열려요</p>`;
    if (!bw) h += `<p class="dp-note">${bfNextTx()}</p>`;
    h += `<h3 class="fv-h">이번 주 도장판 <small>${S.fv.st}/${FV.weekMax}</small></h3><div class="fv-board">` +
      Array.from({ length: FV.weekMax }, (_, i) => { const stp = FV.steps.find(x => x[0] === i + 1); return `<span class="fv-st${i < S.fv.st ? ' on' : ''}${stp ? ' gift' : ''}">${i < S.fv.st ? fvStampIc(26) : stp ? (stp[1] === 'tk' ? '🎫' : stp[1] === 'ess' ? '✨' : '🌰') : ''}</span>`; }).join('') + '</div>' +
      '<p class="fv-steps">' + FV.steps.map(([need, kind, amt], i) => `<span class="${S.fv.got[i] ? 'ok' : ''}">${need}개 ${kind === 'tk' ? `5분권 ${amt}장` : kind === 'ess' ? `숲의 정수 ${amt}` : `황금 도토리 ${amt}`}</span>`).join('') + '</p>';
    setH($('#fvBody'), h);
  }
  function fvClick(e) {
    const b = e.target.closest('[data-fv]'); if (!b) return;
    const [v, a] = b.dataset.fv.split(':');
    if (v === 'booth') fvBoothStart(a);
    else if (v === 'fw') bfFwStart();
    else if (v === 'adb') { fvSync(); if (fvOn() && FV_B[a] && (S.fv.b[a] || 0) >= fvBoothMax() && !festBusy()) adxMore('fv', () => fvBoothStart(a, true)); }   // 한 판 더
    else if (v === 'adfw') { bfSync(); if (bfFw() && S.bf.fw && !festBusy()) adxMore('fw', () => bfFwStart(true)); }
    else if (v === 'meet') { fvMeet(+a); renderFv(); }
    else if (v === 'look') { const g = fvGuests()[+a]; if (g && g.real) closeModal($('#mFv'), () => openLook(g.id, g.who)); }
  }
  // 손님 학교를 만나면 수업료를 선물받아요. 그날 세 곳을 다 만나면 도장 하나
  function fvMeet(i) {
    fvSync();
    const g = fvGuests()[i]; if (!g || !fvOn() || S.fv.g[i]) return false;
    S.fv.g[i] = 1;
    const v = fvPay(FV.guestMin); S.budget += v; earn(v);
    const items = [{ ic: 'acorn', t: `도토리 +${fmt(v)}` }];
    if (i < 3 && [0, 1, 2].every(j => S.fv.g[j])) items.push(...fvStamp(1));
    if (bfOn() && !S.bf.g2 && fvGuests().every((_, j) => S.fv.g[j])) { S.bf.g2 = 1; items.push(...bfStamp(BIG.guestSt)); }   // 대축제 손님 다섯 곳 모두
    sfx('coin'); save(); renderHUD(); fvMap(true);
    toast(`${g.who} 교장 선생님이 선물을 줬어요\n` + items.map(x => x.t).join('\n'));
    return true;
  }
  // 부스 놀이의 틀: 학교 행사 놀이(rt.fest)에 얹어요. id는 'fv_' + 단과대학 열쇠
  function fvDef(id) {
    const k = typeof id === 'string' && id.startsWith('fv_') ? id.slice(3) : '', B = FV_B[k]; if (!B) return null;
    return { name: `${deptOf(k).name} 부스`, sec: FV.sec, goal: FV.goal, form: 'free', item: id, how: B.how, unit: '개', fv: k, label: B.nm, hint: `${FV_HOW[B.how]} ${B.nm}${batchim(B.nm) ? '을' : '를'} 눌러요` };
  }
  function festDef(id) { return FEST[id] || fvDef(id) || bfDef(id); }
  function fvBoothStart(k, extra) {
    fvSync();
    if (!fvOn() || !FV_B[k] || !fvBooths().includes(k) || festBusy()) return false;
    if ((S.fv.b[k] || 0) >= fvBoothMax() && !extra) { toast('이 부스는 오늘 다 놀았어요. 내일 다시 열려요'); return false; }
    if (tr2Busy()) { toast(tr2Busy()); return false; }
    const go = () => {
      zoneGo('plaza');
      setTab('school'); closeSheet();
      $('#scroller').scrollTo({ top: 0, behavior: rt.reduced ? 'auto' : 'smooth' });
      rt.fest = { id: 'fv_' + k, t: FV.sec, n: 0, spawn: 0.6, items: [], perf: 0, intro: 3, ...(extra ? { adx: 1 } : {}) }; renderTeachersOnMap();
      feverOn(true);
      S.fv.b[k] = (S.fv.b[k] || 0) + 1;   // 시작하면 오늘 한 것으로 쳐요(다시 하기 없음). 대축제에는 하루 두 번
      $('#festBar').hidden = false;
      festFocusNow(); renderFestBar(); musicSync(); buzz(20);
      save(); renderFestBtn(); fvMap(true);
    };
    if (rt.modalOpen === $('#mFv')) closeModal($('#mFv'), go); else if (!rt.modalOpen) go(); else return false;
    return true;
  }
  // 놀이가 끝났어요: 성공하면 수업료(학장 교수님 레벨마다 +5%)와 기념품 진행, 성공이든 아니든 도장 하나
  function fvBoothEnd(R, F) {
    const k = F.fv, win = R.n >= F.goal, items = [];
    if (win) {
      const v = Math.max(10, nice(fvPay(FV.boothMin) * (1 + FV.deanPct / 100 * xtLv('dean')))); S.budget += v; earn(v);
      items.push({ ic: 'acorn', t: `도토리 +${fmt(v)}` });
      S.fv.win[k] = (S.fv.win[k] || 0) + 1;
      if (S.fv.win[k] >= FV.win && !S.fv.own[k]) {
        S.fv.own[k] = 1; if (S.deco && S.deco.own) S.deco.own['deco_fv_' + k] = 1;
        const u = IMG('deco_fv_' + k); items.push({ ic: u ? `<img src="${u}" alt="" style="width:22px;height:22px">` : '🎁', t: `기념품 '${FV_SV[k]}' (꾸미기에서 놓아요)` });
      }
    }
    if ((S.fv.b[k] || 0) <= 1 || R.adx) items.push(...fvStamp(1));   // 매주 도장판은 부스마다 하루 한 번. 광고로 한 판 더 한 판도 하나
    if (bfOn()) items.push(...bfStamp(1));   // 대축제 도장은 판마다
    sfx(win ? 'quest' : 'done'); buzz(20);
    musicSync(); save(); renderHUD(); renderFestBtn(); fvMap(true);
    const u = IMG('fv_booth_' + k);
    showReward({ title: win ? `${F.name} 성공!` : `${F.name} 끝!`, sub: win ? `${F.label} ${R.n}개를 눌렀어요` : `${F.goal - R.n}개가 모자랐어요. 도장은 받아요`, art: u ? `<img src="${u}" alt="" style="width:120px;height:120px">` : '🎪', big: `${R.n}/${F.goal}개`, items });
  }
  // 광장 구역 지도에 축제 모습을 얹어요: 부스, 무대, 등불 기둥, 만국기, 손님 깃발. 지도 그림은 그대로예요
  function fvMap(force) {
    const g = $('#fvG'), top = $('#fvTop'); if (!g || !top || !S) return;
    const on = !!S.fv && fvOn() && uniOn() && geo().zone === 'plaza' && rt.viewTier == null && !rt.decoEdit;
    const bs = on ? fvBooths() : [], gs = on ? fvGuests() : [], night = on && isNight();
    const gate = !!S.bf && bfOn() && uniOn() && !!geo().campus && rt.viewTier == null && !rt.decoEdit && !!IMG('bf_banner');   // 대축제 사흘 동안 캠퍼스 정문 현수막
    const sky = on && bfOn() && (night || (!!rt.fest && rt.fest.id === 'bf_fw')) && !!IMG('bf_sky');   // 대축제 밤하늘
    const bz = !on && !!S.bf && bfOn() && uniOn() && rt.viewTier == null && !rt.decoEdit && !!IMG('fv_bunting') ? BF_BUNT[geo().campus ? 'campus' : geo().zone] : null;   // 다른 구역과 캠퍼스의 만국기
    const key = !on ? (gate ? 'gate' : '') + (bz ? 'b' + (geo().campus ? 'c' : geo().zone) : '') : [gameToday(), sky ? 's' : '', bs.map(k => k + (S.fv.b[k] || 0)).join(), gs.map((x, i) => x.who + x.sp + (S.fv.g[i] ? 1 : 0)).join(), night ? 'n' : 'd', rt.fest ? 'p' : ''].join('|');
    if (!force && g.dataset.key === key) return; g.dataset.key = key;
    if (!on) { g.innerHTML = ''; top.innerHTML = (bz ? bz.map(([x, y, w]) => `<image href="${IMG('fv_bunting')}" x="${x}" y="${y}" width="${w}" height="${w / 4}"/>`).join('') : '') + (gate ? bfGateSvg() : ''); return; }
    const im = (k, x, y, w, ar) => IMG(k) ? `<image href="${IMG(k)}" x="${(x - w / 2).toFixed(1)}" y="${(y - w * ar).toFixed(1)}" width="${w}" height="${(w * ar).toFixed(1)}"/>` : '';
    let h = im('fv_stage', ...FV_POS.stage, 1);
    FV_POS.lamp.forEach(([x, y, w]) => { h += im('fv_lamp', x, y, w, 2); });
    bs.forEach((k, i) => { const [x, y, w] = FV_POS.booth[i]; const done = (S.fv.b[k] || 0) >= fvBoothMax();
      h += `<g class="fv-booth${done ? ' done' : ''}" data-fvb="${k}" role="button" tabindex="0" aria-label="${deptOf(k).name} 부스${done ? ', 오늘 끝' : ', 눌러서 축제 창 열기'}">${im('fv_booth_' + k, x, y, w, 1)}` + (done ? '' : `<g class="fv-pin" transform="translate(${x} ${y - w - 2})"><circle r="6.5"/><text y="3.2">!</text></g>`) + '</g>'; });
    if (!rt.fest) gs.forEach((x, i) => { const [fx, fy] = FV_POS.flag[i], met = !!S.fv.g[i], nm = x.who.length > 6 ? x.who.slice(0, 6) + '…' : x.who;
      h += `<g class="fv-guest${met ? ' met' : ''}" data-fvg="${i}" role="button" tabindex="0" aria-label="${esc(x.who)} 교장 선생님의 ${esc(x.sch)}${met ? ', 만났어요' : ', 눌러서 만나기'}">${im('fv_flag', fx, fy, 24, 1.5)}${im('chr_' + x.sp, fx + 15, fy + 1, 17, 1 / (CHR_AR['chr_' + x.sp] || 0.7))}<circle class="fv-hit" cx="${fx}" cy="${fy - 18}" r="19"/>` +
        `<g transform="translate(${fx} ${fy + 7})"><rect class="fv-tag" x="${-(nm.length * 7.4 + 10) / 2}" y="-7" width="${nm.length * 7.4 + 10}" height="13" rx="6.5"/><text class="fv-nm" y="3"></text></g>` + (met ? '' : `<g class="fv-pin" transform="translate(${fx + 9} ${fy - 38})"><circle r="6.5"/><text y="3.2">!</text></g>`) + '</g>'; });
    g.innerHTML = h;
    g.querySelectorAll('.fv-guest').forEach((el, i) => { const x = gs[+el.dataset.fvg]; if (x) el.querySelector('.fv-nm').textContent = x.who.length > 6 ? x.who.slice(0, 6) + '…' : x.who; });
    const [bx, by, bw] = FV_POS.bunt;
    top.innerHTML = (sky ? `<image href="${IMG('bf_sky')}" x="0" y="${(visMap() || [0, 0])[1] + 6}" width="360" height="180" opacity=".9"/>` : '') + (IMG('fv_bunting') ? `<image href="${IMG('fv_bunting')}" x="${bx}" y="${by}" width="${bw}" height="${bw / 4}"/>` : '') +
      (night ? FV_POS.lamp.map(([x, y, w]) => `<circle class="fv-glow" cx="${x}" cy="${y - w * 1.55}" r="17"/>`).join('') : '');
  }
  // 캠퍼스 정문 위 현수막(작업지시서 70 확인 그림 gate70 자리)
  function bfGateSvg() {
    const [gx] = CAMPUS.gate, w = 84, h = w / 3, x = gx - w / 2, y = 432;
    return `<image href="${IMG('bf_banner')}" x="${x.toFixed(1)}" y="${y}" width="${w}" height="${h.toFixed(1)}"/><text class="bf-gate" x="${gx.toFixed(1)}" y="${(y + h * 0.66).toFixed(1)}">대축제</text>`;
  }
  function fvMapTap(e) {
    const b = e.target.closest('[data-fvb]'), g = e.target.closest('[data-fvg]');
    if (!b && !g) return;
    if (e.type === 'keydown') { if (e.key !== 'Enter' && e.key !== ' ') return; e.preventDefault(); }
    if (rt.paused || rt.modalOpen || festBusy() || rt.decoEdit) return;
    if (g) fvMeet(+g.dataset.fvg); else openFv();
  }
  // 대학교가 아닌 학교에는 한 주에 한 번, 그 주 처음 켠 축제 날에만 아래 탭 위에 작은 띠를 보여 줘요(X로 닫아요)
  function fvTip() {
    const el = $('#fvTip'); if (!el || !S || !S.fv) return;
    const wk = gameWeek(), t = gameToday(), base = !!S.tut.st && rt.tab === 'school' && !festBusy() && S.tier >= 1;   // 유치원에서는 대학교 축제 띠를 띄우지 않아요
    // 대축제: 대학교에는 전날 한 줄, 다른 학교에는 첫날부터 달에 한 번. 매주 축제 띠보다 먼저
    const bw = S.bf ? bfWin(t) : null, bn = S.bf && !bw ? bfNext(t) : null;
    let kind = '';
    if (base && bw && !uniNow() && S.bf.tip !== bw.key) kind = 'bftip';
    else if (base && bn && fvOpen() && dayNo(bn.start) - dayNo(t) === 1 && S.bf.eve !== bn.key) kind = 'bfeve';
    else {
      let show = !uniNow() && fvDay() && S.fv.tip !== wk && base;
      if (show && S.fv.td !== t) { if (S.fv.td && weekMon(S.fv.td) === weekMon(t)) show = false; else { S.fv.td = t; save(); } }
      if (show) kind = 'fv';
    }
    const show = !!kind;
    if (el.hidden === show || rt.fvTipK !== kind) {
      el.hidden = !show; rt.fvTipK = kind;
      if (show) { const bfk = kind.startsWith('bf'), u = (bfk && IMG('ic_bf')) || IMG('ic_fv'); setH($('#fvTipIc'), u ? `<img src="${u}" alt="">` : '🎪');
        setT($('#fvTipTx'), kind === 'bftip' ? '숲속 대학교에서 대축제가 열렸어요' : kind === 'bfeve' ? '내일부터 사흘 동안 대축제가 열려요' : '숲속 대학교는 지금 축제 중이에요'); }
    }
  }
  function fvTick() {
    if (!S || !S.fv) return;
    fvSync(); fvMap(); fvTip(); bfAuto();
    if (rt.modalOpen === $('#mFv') && rt.fvKey !== gameToday()) { rt.fvKey = gameToday(); renderFv(); }
  }

  /* ---------- 요일 행사: 화요일 교환학생의 날, 목요일 숲속 장터 (프로젝트 문서 ' 설계안 2 (교환학생과 장터)', 그림은 작업지시서 64) ----------
     초등학교부터 열려요. 날짜는 게임 시계(한국 시간)이고 축제의 요일 틀(fvWd)을 그대로 써요. 서버 규칙은 바꾸지 않아요
     숫자(XG, MK)는 woodani가 제안대로 확정했어요(19시 반). 깜짝 물건의 종류와 곁가지 칭호 이름은 아직 본부 제안이에요 */
  const WD_TIER = 1;
  const wdOpen = () => !!S && S.tier >= WD_TIER && !!S.tut.st;
  const dayNo = t => Math.floor(Date.parse(t + 'T00:00:00Z') / 86400000);
  // 이미 읽은 랭킹 위쪽 50곳(내 학교와 시험 학교는 빼요). 축제 손님 학교와 같은 방식이에요
  const wdRows = () => (typeof Rank !== 'undefined' && Rank.state === 'on' && !tossRank() ? Rank.rows || [] : []).filter(r => r.id !== Rank.uid && !r.test && !r.nx).slice(0, 50);
  const wdImg = (k, px, fb) => { const u = IMG(k); return u ? `<img src="${u}" alt="" style="width:${px}px;height:${px}px;object-fit:contain">` : fb; };

  /* 교환학생의 날 */
  const XG = { wd: 1, greetMin: 10, guideMin: 15, guide: 3, step: 4, ess: 10, tk: 3, log: 12, deco: 'deco_ex_sign' };
  const XG_SAY = {
    rabbit: ['안녕하세요! 귀가 길어서 종소리를 제일 먼저 들어요.', '이 학교 종소리는 우리 학교보다 맑네요!'],
    fox: ['안녕하세요. 지름길 찾는 건 자신 있어요.', '그런데 이 학교는 돌아가는 길이 더 예쁘네요.'],
    raccoon: ['안녕하세요! 오는 길에 손을 세 번 씻었어요.', '급식실이 어디예요? 아, 아직 공부 시간이군요.'],
    chick: ['삐약! 아, 안녕하세요.', '우리 학교 형 누나들이 여기 꼭 가 보래요.'],
    bear: ['안녕하세요. 도시락은 두 개 싸 왔어요.', '하나는 새 친구랑 나눠 먹으려고요.'],
    cat: ['안녕하세요. 햇볕 잘 드는 창가 자리가 있나요?', '졸려는 게 아니에요. 생각하는 거예요.'],
    dog: ['안녕하세요! 안녕하세요! 정말 반가워요!', '운동장이 넓네요. 한 바퀴만 뛰고 올게요!'],
    penguin: ['안녕하세요. 조금 덥지만 괜찮아요.', '이 학교 급식에 얼음 동동 띄운 게 있다고 들었어요.'],
    panda: ['안녕하세요. 걸어오다 대나무 숲에서 조금 쉬었어요.', '그래서 조금 늦었어요. 조금요.'],
    koala: ['안녕하세요. 나무가 많아서 마음이 놓여요.', '큰 참나무에 올라가도 되나요? 구경만 할게요.'],
    otter: ['안녕하세요! 조약돌을 선물로 가져왔어요.', '제가 제일 아끼는 돌이에요. 잘 부탁해요.'],
    hamster: ['안녕하세요! 볼에 넣어 온 건 간식이에요.', '숨긴 게 아니고 아껴 둔 거예요.'],
    duck: ['안녕하세요. 줄 서는 건 제가 잘해요.', '우리 학교는 어디 갈 때 늘 한 줄이거든요.'],
    turtle: ['안녕하세요. 어제 출발해서 방금 왔어요.', '천천히 봐야 더 많이 보여요.'],
    mole: ['안녕하세요. 땅 위 학교는 처음이에요.', '교실에 창문이 있네요. 신기해요!'],
    frog: ['안녕하세요! 폴짝 뛰어서 왔어요.', '비 오는 날에는 저를 불러 주세요. 노래해 드릴게요.'],
    waterdeer: ['아, 안녕하세요.', '낯선 곳은 조금 떨려요. 그래도 와 보고 싶었어요.'],
    redpanda: ['안녕하세요! 꼬리로 인사해도 되나요?', '이 학교 단풍이 제 꼬리 색이랑 닮았어요.'],
    capybara: ['안녕하세요. 저는 누구하고나 잘 지내요.', '옆에 앉아도 되지요? 고마워요.'],
    kangaroo: ['안녕하세요! 주머니에 공책을 넣어 왔어요.', '멀리뛰기 시간이 있으면 꼭 불러 주세요.'],
    meerkat: ['안녕하세요. 망은 제가 볼게요.', '선생님이 오시면 바로 알려 드릴게요. 농담이에요.'],
    sloth: ['안…… 녕…… 하세요.', '인사를 마치니 벌써 점심때네요.'],
    chinchilla: ['안녕하세요! 궁금한 게 백 가지쯤 있어요.', '첫 번째 질문이에요. 저 큰 나무는 몇 살이에요?'],
    _: ['안녕하세요! 오늘 하루 잘 부탁해요.', '이 학교 이야기를 많이 듣고 왔어요.'] };
  const freshXg = () => ({ day: '', s: [0, 0, 0], n: 0, bd: 0, got: 0, log: [] });
  function sanitizeXg(d, s) {
    const f = freshXg(), X = d && d.xg && typeof d.xg === 'object' ? d.xg : null; s.xg = f; if (!X) return;
    const n = (v, hi) => typeof v === 'number' && isFinite(v) ? Math.max(0, Math.min(hi, Math.floor(v))) : 0;
    f.day = typeof X.day === 'string' ? X.day.slice(0, 10) : '';
    if (Array.isArray(X.s)) f.s = [0, 1, 2].map(i => X.s[i] ? 1 : 0);
    f.n = n(X.n, XG.guide); f.bd = n(X.bd, 9999); f.got = n(X.got, Math.floor(f.bd / XG.step));
    if (Array.isArray(X.log)) f.log = X.log.filter(e => e && typeof e === 'object' && DEX_STUDENTS.includes(e.sp) && typeof e.d === 'string').slice(0, XG.log)
      .map(e => ({ sp: e.sp, who: cleanName(String(e.who || '')).slice(0, 12) || '이웃', d: e.d.slice(0, 10), id: typeof e.id === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(e.id) ? e.id : '' }));
  }
  const xgOpen = () => wdOpen() && !!S.xg;
  const xgOn = () => xgOpen() && fvWd() === XG.wd;
  const xgDone = () => !!S.xg && S.xg.s.every(Boolean);
  function xgSync() {
    if (!S || !S.xg) return;
    const t = gameToday();
    if (dayRoll(S.xg, t)) { S.xg.s = [0, 0, 0]; S.xg.n = 0; save(); }
  }
  // 오늘 온 학생: 동물은 날짜로 한 종, 학교는 랭킹에서 날짜로 한 곳(없으면 꾸며 낸 이웃 학교)
  function xgGuest() {
    const t = gameToday(), rows = wdRows(), key = t + '|' + rows.length + '|' + (rows[0] ? rows[0].id : '');
    if (rt.xgG && rt.xgG.key === key) return rt.xgG.g;
    const dn = dayNo(t), sp = DEX_STUDENTS[dayHash('ex' + t) % DEX_STUDENTS.length];
    let g;
    if (rows.length >= 3) { const r = rows[(dn * 7 + 5) % rows.length]; g = { sp, id: r.id, who: r.name, sch: rankSchool(r.tier, r.year, r.sem), real: true }; }
    else { const f = FV_FAKE[(dn + 4) % FV_FAKE.length]; g = { sp, id: '', who: f[0], sch: rankSchool(f[1], f[2], null), real: false }; }
    rt.xgG = { key, g };
    return g;
  }
  // 교환학생이 가 보고 싶어 하는 곳: 지은 건물 가운데 날짜로 세 곳(급식실은 마지막 차례라 빼요)
  function xgSpots() {
    const ks = facKeys().filter(k => (S.f[k] || 0) >= 1 && k !== 'cafeteria');
    if (!ks.length) return [];
    const st = dayHash('sp' + gameToday()) % ks.length, out = [];
    for (let i = 0; i < ks.length && out.length < XG.guide; i++) out.push(ks[(st + i) % ks.length]);
    return out;
  }
  const xgBadgeIc = px => wdImg('ic_ex_badge', px, '🎖');
  // 배지를 받고, 채운 단계의 보상을 줘요: 4개 숲의 정수, 8개 장식 '방향 이정표', 그 뒤로 4개마다 5분권
  function xgBadge() {
    S.xg.bd = Math.min(9999, S.xg.bd + 1);
    const items = [{ ic: xgBadgeIc(22), t: `우정 배지 +1 (모두 ${S.xg.bd}개)` }];
    while (S.xg.got < Math.floor(S.xg.bd / XG.step)) {
      S.xg.got += 1;
      if (S.xg.got === 1) { addEss(XG.ess); items.push({ ic: 'ess', t: `배지 ${XG.step}개: 숲의 정수 +${XG.ess}` }); }
      else if (S.xg.got === 2) { if (S.deco && S.deco.own) S.deco.own[XG.deco] = 1; items.push({ ic: wdImg(XG.deco, 22, '🪧'), t: `배지 ${XG.step * 2}개: 장식 '방향 이정표' (꾸미기에서 놓아요)` }); }
      else { S.tk.m5 = Math.min(SAVE_CAP.count, S.tk.m5 + XG.tk); items.push({ ic: 'ticket', t: `배지 ${S.xg.got * XG.step}개: 5분권 +${XG.tk}` }); }
    }
    return items;
  }
  function xgPay(min) { const v = fvPay(min); S.budget += v; earn(v); return v; }
  // 1. 인사하기: 짧은 대화를 보고 수업료를 받아요
  function xgGreet() {
    xgSync();
    if (!xgOn() || S.xg.s[0] || festBusy()) return false;
    const g = xgGuest(), nm = spName(g.sp), say = XG_SAY[g.sp] || XG_SAY._;
    S.xg.s[0] = 1;
    tamShard(g.sp, 2);   // 교환학생으로 온 동물 친구: 그 대원 별 조각 둘
    S.xg.log = [{ sp: g.sp, who: g.who, d: gameToday(), id: g.real ? g.id : '' }].concat(S.xg.log.filter(e => e.d !== gameToday())).slice(0, XG.log);
    const v = xgPay(XG.greetMin);
    save(); renderHUD();
    const go = () => {
      rt.talkSeq = { n: { k: g.sp, name: nm, lab: `교환학생 ${nm}` }, i: 0, lines: say.map(t => ({ who: g.sp, t })).concat([{ who: 'hedgehog', t: `${g.who} 교장 선생님네 학교에서 온 ${nm}${batchim(nm) ? '이에요' : '예요'}. 인사 선물로 도토리 ${fmt(v)}개를 받았어요. 이제 학교를 안내해 줄까요?`, last: true }]) };
      talkLine(); openModal($('#mTalk'));
    };
    if (rt.modalOpen === $('#mXg')) closeModal($('#mXg'), go); else if (!rt.modalOpen) go();
    return true;
  }
  // 2와 3. 건물 창을 열 때 불러요: 안내할 차례의 건물이면 한 곳을 센 것으로 치고, 안내를 마친 뒤 급식실을 열면 함께 먹어요
  function xgVisit(k) {
    if (!S || !S.xg || !xgOn()) return;
    xgSync();
    if (!S.xg.s[0]) return;
    const nm = spName(xgGuest().sp);
    if (!S.xg.s[1]) {
      const sp = xgSpots();
      if (sp[S.xg.n] !== k) return;
      S.xg.n += 1;
      if (S.xg.n >= sp.length) { S.xg.s[1] = 1; const v = xgPay(XG.guideMin); renderHUD(); toast(`${nm} 친구에게 학교를 다 보여 줬어요\n도토리 +${fmt(v)}`); }
      else toast(`${nm}: 여기가 ${FAC[k].name}이군요! (${S.xg.n}/${sp.length})`);
      sfx('coin'); save(); wdBar();
    } else if (!S.xg.s[2] && k === 'cafeteria') xgLunch();
  }
  function xgLunch() {
    if (!xgOn() || !S.xg.s[1] || S.xg.s[2]) return false;
    S.xg.s[2] = 1;
    const items = xgBadge(), nm = spName(xgGuest().sp);
    sfx('quest'); save(); wdBar();
    showReward({ title: '급식을 함께 먹었어요', sub: `${nm} 친구가 다음에 또 오고 싶대요`, art: pcChr(xgGuest().sp, 96), big: `우정 배지 ${S.xg.bd}개`, items });
    return true;
  }
  function openXg() {
    if (!S || rt.paused || festBusy()) return;
    if (!xgOpen()) { toast('교환학생의 날은 초등학교부터 열려요'); return; }
    if (rt.modalOpen && rt.modalOpen !== $('#mXg')) return;
    xgSync(); sfx('tap'); renderXg();
    if (rt.modalOpen !== $('#mXg')) openModal($('#mXg'));
  }
  function renderXg() {
    const m = $('#mXg'); if (!m || !S || !S.xg) return;
    const on = xgOn(), hu = IMG('ex_head'), hd = $('#xgHead');
    hd.classList.toggle('art', !!hu); hd.style.backgroundImage = hu ? `url("${blobUrl(hu)}")` : '';
    setT($('#xgDayTx'), on ? '오늘 교환학생의 날' : '매주 화요일');
    let h = '';
    if (on) {
      const g = xgGuest(), nm = spName(g.sp), sp = xgSpots(), s = S.xg.s;
      const mine = spName(speciesList()[dayHash('me' + gameToday()) % speciesList().length]);
      h += `<div class="xg-who"><span class="xg-chr">${pcChr(g.sp, 64)}</span><p><b>${esc(g.who)} 교장 선생님네 학교에서 온 ${nm}</b><small>${esc(g.sch)}</small><small>우리 학교 ${mine} 친구도 오늘 그 학교에 가 있어요</small>` +
        (g.real ? `<button class="btn-link fv-look" type="button" data-xg="look">구경 가기</button>` : '') + '</p></div>';
      const row = (i, ti, sub, rew, btn) => `<div class="dp-row${s[i] ? ' on' : ''}"><span class="dp-ic">${i + 1}</span><div class="dp-tx"><b>${ti}</b><small>${sub}</small><em>${rew}</em></div>` +
        (s[i] ? (i === 1 && sp.length && adxCan('xg') ? adxBtn('data-xg="adg"', '한 번 더') : '<span class="fe-lock">했어요</span>') : i > 0 && !s[i - 1] ? '<span class="fe-lock">앞의 일 먼저</span>' : btn) + '</div>';
      h += '<div class="dp-list fv-list">' +
        row(0, '인사하기', `${nm} 친구와 이야기해요`, `수업료 ${XG.greetMin}분치`, '<button class="cta small" type="button" data-xg="greet">인사</button>') +
        row(1, '학교 안내', sp.map((k, i) => `${i < S.xg.n ? '✓' : ''}${FAC[k].name}`).join(' → ') || '건물을 지으면 안내할 수 있어요', `수업료 ${XG.guideMin}분치`, sp.length ? `<button class="cta small" type="button" data-xg="go:${sp[Math.min(S.xg.n, sp.length - 1)]}">가기</button>` : '') +
        row(2, '급식 함께 먹기', '급식실에 가요', '우정 배지 1개', `<button class="cta small" type="button" data-xg="${(S.f.cafeteria || 0) >= 1 ? 'go:cafeteria' : 'lunch'}">가기</button>`) + '</div>';
    } else h += '<p class="dp-note">화요일마다 다른 학교 친구가 하루 동안 와요</p>';
    const nxt = (Math.floor(S.xg.bd / XG.step) + 1) * XG.step, nk = Math.floor(S.xg.bd / XG.step) + 1;
    h += `<h3 class="fv-h">우정 배지 <small>${S.xg.bd}개</small></h3><p class="fv-steps"><span>${xgBadgeIc(16)} ${nxt}개가 되면 ${nk === 1 ? `숲의 정수 ${XG.ess}` : nk === 2 ? "장식 '방향 이정표'" : `5분권 ${XG.tk}장`}</span></p>`;
    if (S.xg.log.length) h += '<h3 class="fv-h">교환학생 수첩</h3><div class="xg-log">' + S.xg.log.map((e, i) => `<div class="xg-le"><span>${pcChr(e.sp, 30)}</span><b>${spName(e.sp)}</b><small>${esc(e.who)} 교장 선생님네, ${e.d.slice(5).replace('-', '/')}</small>` +
      (e.id ? `<button class="btn-link" type="button" data-xg="log:${i}">구경 가기</button>` : '') + '</div>').join('') + '</div>';
    setH($('#xgBody'), h);
  }
  function xgClick(e) {
    const b = e.target.closest('[data-xg]'); if (!b) return;
    const [v, a] = b.dataset.xg.split(':');
    if (v === 'greet') xgGreet();
    else if (v === 'adg') { xgSync(); if (xgOn() && S.xg.s[1] && xgSpots().length) adxMore('xg', () => { if (!xgOn()) return false; S.xg.s[1] = 0; S.xg.n = 0; renderXg(); wdBar(); toast('학교 안내를 한 번 더 해요'); return true; }); }   // 한 번 더
    else if (v === 'go') closeModal($('#mXg'), () => goFac(a));
    else if (v === 'lunch') { closeModal($('#mXg')); xgLunch(); }
    else if (v === 'look') { const g = xgGuest(); if (g.real) closeModal($('#mXg'), () => openLook(g.id, g.who)); }
    else if (v === 'log') { const x = S.xg.log[+a]; if (x && x.id) closeModal($('#mXg'), () => openLook(x.id, x.who)); }
  }

  /* 숲속 장터: 텃밭 작물을 장터 쿠폰으로 바꾸고, 쿠폰으로 물건을 사요. 도토리와 섞이지 않아요 */
  const MK = { wd: 3, dayCap: 30, cpMax: 200, decoCp: 60,
    price: { lettuce: 1, carrot: 1, potato: 2, corn: 2, tomato: 3, pumpkin: 3, strawberry: 5, sweetpotato: 5 },
    shop: [{ id: 'm5', nm: '5분권 1장', cp: 4, n: 5 }, { id: 'm30', nm: '30분권 1장', cp: 22, n: 1 }, { id: 'ess', nm: '숲의 정수 5', cp: 8, n: 2 }, { id: 'sur', nm: '', cp: 10, n: 1 }],
    deco: [['deco_mk_lamp', '장터 등불'], ['deco_mk_cart', '채소 수레'], ['deco_mk_pack', '보부상 봇짐']] };
  const freshMk = () => ({ day: '', sold: 0, buy: {}, cp: 0, own: {} });
  function sanitizeMk(d, s) {
    const f = freshMk(), M = d && d.mk && typeof d.mk === 'object' ? d.mk : null; s.mk = f; if (!M) return;
    const n = (v, hi) => typeof v === 'number' && isFinite(v) ? Math.max(0, Math.min(hi, Math.floor(v))) : 0;
    f.day = typeof M.day === 'string' ? M.day.slice(0, 10) : ''; f.sold = n(M.sold, MK.dayCap); f.cp = n(M.cp, MK.cpMax);
    for (const x of MK.shop) if (M.buy && typeof M.buy === 'object') { const b = n(M.buy[x.id], x.n); if (b) f.buy[x.id] = b; }
    for (const [id] of MK.deco) if (M.own && typeof M.own === 'object' && M.own[id]) f.own[id] = 1;
  }
  const mkOpen = () => wdOpen() && !!S.mk;
  const mkOn = () => mkOpen() && fvWd() === MK.wd;
  function mkSync() {
    if (!S || !S.mk) return;
    const t = gameToday();
    if (dayRoll(S.mk, t)) { S.mk.sold = 0; S.mk.buy = {}; save(); }
  }
  const mkCrops = () => GD_CROPS.filter(c => c.tier <= S.tier);
  const mkHot = () => { const cs = mkCrops(); return cs[dayHash('mk' + gameToday()) % cs.length].k; };   // 오늘의 흥정: 쿠폰 두 배
  const mkUnit = k => (MK.price[k] || 0) * (mkHot() === k ? 2 : 1);
  const mkCpIc = px => wdImg('ic_mk_coupon', px, '🎟');
  // 오늘의 깜짝 물건: 날짜로 바뀌어요. 지금 쓸 수 있는 것 가운데 하나
  function mkSur() {
    const os = [snOpen() ? { k: 'sn', nm: '간식 뽑기 한 번' } : null, gdOpen() && (S.gn.free || 0) < 9 ? { k: 'grow', nm: '텃밭 바로 자라기 1번' } : null].filter(Boolean);
    return os.length ? os[dayNo(gameToday()) % os.length] : null;
  }
  // 작물 팔기: all이면 팔 수 있는 만큼. 하루에 받는 쿠폰은 MK.dayCap, 가진 쿠폰은 MK.cpMax까지
  function mkSell(k, all) {
    mkSync();
    if (!mkOn() || !MK.price[k] || !S.gn) return false;
    const have = S.gn.inv[k] || 0, u = mkUnit(k), room = Math.min(MK.dayCap - S.mk.sold, MK.cpMax - S.mk.cp);
    if (have < 1) { toast(`${GD_C[k].nm}${batchim(GD_C[k].nm) ? '이' : '가'} 없어요`); return false; }
    if (room < u) { toast(S.mk.cp + u > MK.cpMax ? `쿠폰은 ${MK.cpMax}장까지 가질 수 있어요` : '오늘 받을 쿠폰을 다 받았어요. 내일 다시 열려요'); return false; }
    const n = all ? Math.min(have, Math.floor(room / u)) : 1;
    S.gn.inv[k] = have - n; S.mk.sold += n * u; S.mk.cp += n * u;
    sfx('coin'); save(); renderMk();
    toast(`${GD_C[k].nm} ${n}개를 팔았어요\n장터 쿠폰 +${n * u}`);
    return true;
  }
  function mkBuy(id) {
    mkSync();
    if (!mkOn()) return false;
    const dc = MK.deco.find(x => x[0] === id), x = MK.shop.find(y => y.id === id), cp = dc ? MK.decoCp : x ? x.cp : 0;
    if (!cp) return false;
    if (dc ? (S.mk.own[id] || decoOwn(id)) : (S.mk.buy[id] || 0) >= x.n) { toast(dc ? '이미 가지고 있어요' : '오늘은 다 샀어요. 내일 다시 열려요'); return false; }
    const sur = id === 'sur' ? mkSur() : null;
    if (id === 'sur' && !sur) return false;
    if (S.mk.cp < cp) { toast(`쿠폰이 ${cp - S.mk.cp}장 모자라요`); return false; }
    S.mk.cp -= cp;
    let got = '';
    if (dc) { S.mk.own[id] = 1; S.deco.own[id] = 1; got = `장식 '${dc[1]}' (꾸미기에서 놓아요)`; }
    else {
      S.mk.buy[id] = (S.mk.buy[id] || 0) + 1;
      if (id === 'm5' || id === 'm30') { S.tk[id] = Math.min(SAVE_CAP.count, S.tk[id] + 1); got = x.nm; }
      else if (id === 'ess') { addEss(5); got = '숲의 정수 +5'; }
      else if (sur.k === 'grow') { S.gn.free = Math.min(9, (S.gn.free || 0) + 1); got = '텃밭 바로 자라기 +1'; }
      else { S.budget += snCost(false); const out = snDraw(false); got = out && out.length ? `간식 뽑기: ${out.map(o => o.it.nm).join(', ')}` : '간식 뽑기'; }
    }
    sfx('quest'); save(); renderHUD(); renderMk();
    toast(got);
    return true;
  }
  function openMk() {
    if (!S || rt.paused || festBusy()) return;
    if (!mkOpen()) { toast('숲속 장터는 초등학교부터 열려요'); return; }
    if (rt.modalOpen && rt.modalOpen !== $('#mMk')) return;
    mkSync(); sfx('tap'); renderMk();
    if (rt.modalOpen !== $('#mMk')) openModal($('#mMk'));
  }
  function renderMk() {
    const m = $('#mMk'); if (!m || !S || !S.mk) return;
    const on = mkOn(), hu = IMG('mk_head'), hd = $('#mkHead');
    hd.classList.toggle('art', !!hu); hd.style.backgroundImage = hu ? `url("${blobUrl(hu)}")` : '';
    setH($('#mkDayTx'), `${mkCpIc(14)} ${S.mk.cp}장`);
    let h = '';
    if (on) {
      const hot = mkHot();
      h += `<p class="fv-bonus">${wdImg('mk_who', 22, '🦦')}수달 보부상이 오늘 찾는 것 <b>${GD_C[hot].nm} (쿠폰 두 배)</b></p>`;
      h += `<h3 class="fv-h">작물 팔기 <small>오늘 ${S.mk.sold}/${MK.dayCap}장</small></h3><div class="mk-grid">` + mkCrops().map(c => { const have = (S.gn && S.gn.inv[c.k]) || 0;
        return `<div class="mk-crop${hot === c.k ? ' hot' : ''}${have ? '' : ' none'}"><span class="mk-em">${IMG('crop_' + c.k) ? `<img src="${IMG('crop_' + c.k)}" alt="">` : c.em}</span><b>${c.nm} ${have}개</b><small>1개에 ${mkCpIc(12)}${mkUnit(c.k)}</small>` +
          `<span class="mk-btns"><button type="button" data-mk="sell:${c.k}" aria-disabled="${have ? 'false' : 'true'}">1개</button><button type="button" data-mk="all:${c.k}" aria-disabled="${have ? 'false' : 'true'}">모두</button></span></div>`; }).join('') + '</div>';
      const sur = mkSur();
      h += '<h3 class="fv-h">물건 사기</h3><div class="dp-list fv-list">' + MK.shop.filter(x => x.id !== 'sur' || sur).map(x => { const b = S.mk.buy[x.id] || 0, out = b >= x.n;
        return `<div class="dp-row${out ? ' on' : ''}"><div class="dp-tx"><b>${x.id === 'sur' ? `오늘의 깜짝 물건: ${sur.nm}` : x.nm}</b><small>오늘 ${b}/${x.n}번</small></div>` +
          (out ? '<span class="fe-lock">다 샀어요</span>' : `<button class="cta small" type="button" data-mk="buy:${x.id}" aria-disabled="${S.mk.cp >= x.cp ? 'false' : 'true'}">${mkCpIc(13)}${x.cp}</button>`) + '</div>'; }).join('') +
        MK.deco.map(([id, nm]) => { const own = !!(S.mk.own[id] || decoOwn(id));
          return `<div class="dp-row${own ? ' on' : ''}"><span class="dp-ic">${wdImg(id, 34, '🏮')}</span><div class="dp-tx"><b>${nm}</b><small>장식</small></div>` +
            (own ? '<span class="fe-lock">가졌어요</span>' : `<button class="cta small" type="button" data-mk="buy:${id}" aria-disabled="${S.mk.cp >= MK.decoCp ? 'false' : 'true'}">${mkCpIc(13)}${MK.decoCp}</button>`) + '</div>'; }).join('') + '</div>';
    } else h += '<p class="dp-note">목요일마다 수달 보부상이 수레 가게를 열어요</p>';
    setH($('#mkBody'), h);
  }
  function mkClick(e) {
    const b = e.target.closest('[data-mk]'); if (!b) return;
    const [v, a] = b.dataset.mk.split(':');
    if (v === 'sell') mkSell(a, false); else if (v === 'all') mkSell(a, true); else if (v === 'buy') mkBuy(a);
  }
  // 요일 행사 띠: 화요일과 목요일에 아래 탭 위에 한 줄. 누르면 그 창이 열리고, X로 닫으면 그날은 다시 안 떠요
  function wdBar() {
    const el = $('#wdBar'); if (!el || !S) return;
    const t = gameToday(), ex = xgOn() && !xgDone(), mk = mkOn();
    const onMap = !!($('#wdG') && $('#wdG').dataset.key);   // 지도에 교환학생이나 수레 가게가 보이면 띠는 숨겨요(같은 자리를 가려요). 대학교의 다른 구역처럼 지도에 없을 때만 띠
    const show = (ex || mk) && !onMap && rt.wdX !== t && rt.tab === 'school' && rt.viewTier == null && !rt.decoEdit && !festBusy() && !rt.paused;
    if (el.hidden === show) el.hidden = !show;
    if (!show) return;
    setH($('#wdBarIc'), ex ? wdImg('ic_ex', 20, '🎒') : wdImg('ic_mk', 20, '🛒'));
    setT($('#wdBarTx'), ex ? (S.xg.s[0] ? `교환학생 ${spName(xgGuest().sp)} 친구를 안내해요` : `교환학생 ${spName(xgGuest().sp)} 친구가 왔어요`) : '오늘은 숲속 장터가 열려요');
  }
  // 지도에 얹기: 교문 안쪽 길목에 화요일은 교환학생과 환영 현수막, 목요일은 수달 보부상의 수레 가게. 누르면 그 창이 열려요(지도 그림은 그대로)
  const WD_PLAZA = [176, 372];   // 대학교 광장 구역에서 교환학생과 수레 가게가 서는 자리
  function wdMap(force) {
    const g = $('#wdG'); if (!g || !S) return;
    const G = geo(), P = G.gate ? [G.gate[0], 398] : G.zone === 'plaza' ? WD_PLAZA : null, ok = !!P && rt.viewTier == null && !rt.decoEdit && !rt.fest && !rt.sports;   // 대학교는 광장 구역에만(축제가 없는 화, 목이라 축제 자리와 겹치지 않아요)
    const xg = ok && xgOn(), mk = ok && mkOn(), sp = xg ? xgGuest().sp : '';
    const key = !xg && !mk ? '' : [gameToday(), geoIdx(), xg ? sp + S.xg.s.join('') : 'mk'].join('|');
    if (!force && g.dataset.key === key) return; g.dataset.key = key;
    if (!key) { g.innerHTML = ''; return; }
    // 생물 탐사 자리(누르는 칸 44×44)와 겹치면 옆으로 비켜 서요(중학교 교문 앞 자리가 수레에 가려졌어요)
    const y = P[1];
    const BXL = (BX_SPOT[geoIdx()] || []).map(q => pctXY([q[0], q[1]]));
    const clash = x => BXL.some(([bx, by]) => Math.abs(bx - x) < 58 && by - 34 < y + 6 && by + 10 > y - 46);
    const gx = [0, -62, 62, -90, 90].map(d => P[0] + d).find(x => !clash(x)) || P[0];
    const im = (k, x, yy, w, ar) => IMG(k) ? `<image href="${IMG(k)}" x="${(x - w / 2).toFixed(1)}" y="${(yy - w * ar).toFixed(1)}" width="${w}" height="${(w * ar).toFixed(1)}"/>` : '';
    const pin = (x, yy) => `<g class="fv-pin" transform="translate(${x} ${yy})"><circle r="6.5"/><text y="3.2">!</text></g>`;
    if (xg) g.innerHTML = `<g class="wd-it" data-wd="xg" role="button" tabindex="0" aria-label="교환학생 ${spName(sp)}, 눌러서 교환학생의 날 열기">${im('ex_banner', gx, y - 30, 66, 0.25)}${im('chr_' + sp, gx - 3, y, 20, 1 / (CHR_AR['chr_' + sp] || 0.7))}${im('ex_bag', gx + 11, y, 11, 1)}<rect class="fv-hit" x="${gx - 34}" y="${y - 48}" width="68" height="52"/>${xgDone() ? '' : pin(gx + 14, y - 34)}</g>`;
    else g.innerHTML = `<g class="wd-it" data-wd="mk" role="button" tabindex="0" aria-label="수달 보부상의 수레 가게, 눌러서 숲속 장터 열기">${im('mk_stall', gx + 4, y + 2, 46, 1)}${im('mk_who', gx - 22, y + 2, 19, 680 / 512)}<rect class="fv-hit" x="${gx - 34}" y="${y - 44}" width="66" height="48"/>${pin(gx + 22, y - 44)}</g>`;
  }
  function wdMapTap(e) {
    const b = e.target.closest('[data-wd]'); if (!b) return;
    if (e.type === 'keydown') { if (e.key !== 'Enter' && e.key !== ' ') return; e.preventDefault(); }
    if (rt.paused || rt.modalOpen || festBusy() || rt.decoEdit) return;
    if (b.dataset.wd === 'xg') openXg(); else openMk();
  }
  function wdTick() {
    if (!S || !S.xg || !S.mk) return;
    xgSync(); mkSync(); wdMap(); wdBar();
    const t = gameToday();
    if (rt.modalOpen === $('#mXg') && rt.xgKey !== t) { rt.xgKey = t; renderXg(); }
    if (rt.modalOpen === $('#mMk') && rt.mkKey !== t) { rt.mkKey = t; renderMk(); }
  }

