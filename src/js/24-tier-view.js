  /* ---------- 2.0.0 학교급 모습 보기와 졸업식 사진 ----------
     졸업식(학교급 올리기) 때 그 학교급의 건물 레벨과 모습, 학생 수, 명부 학생을 S.snap[학교급]에 남겨요.
     홈 지도 아래 작은 동그라미(유, 초, 중, 고, 대, 원)를 누르면 지난 학교급 지도를 보기 전용으로 보여 줘요. 사진이 없는 학교급(2.0.0 전에 지난 학교급)은
     건물을 모두 지어진 모습으로 보여 줘요. 지난 지도도 꾸밀 수 있어요(장식 자리는 지도마다 따로). 2.1.3 다른 학교 구경도 이 보기를 써요 */
  const TIER_SHORT = ['유', '초', '중', '고', '대', '원'];
  const TIER_ALL = ['유치원', '초등학교', '중학교', '고등학교', '대학교', '대학원'];
  function snapTake() {
    S.snap[S.tier] = { f: Object.assign({}, S.f), bs: Object.assign({}, S.bs), st: Math.floor(S.students), at: Date.now(),
      roster: (S.roster.list || []).map(s => ({ sp: s.sp, nm: s.nm })) };
  }
  // 그 학교급의 모습: 사진이 있으면 사진, 없으면 그 학교급 건물을 모두 지어진 모습으로
  function snapOf(t) {
    const x = S.snap && S.snap[t];
    if (x) return x;
    const f = {}, bs = {};
    for (const k of Object.keys(FAC)) { f[k] = (FAC[k].tier || 0) <= t ? 1 : 0; bs[k] = t; }
    return { f, bs, st: 0, at: 0, roster: [], all: true };
  }
  // 지난 학교급 건물 그림(그 학교급 모습). bldImg와 같은 규칙을 그 학교급 기준으로
  function viewBldKey(k, t, bsv, lux) {
    const n = Math.min(5, (bsv || 0) + 1);
    if (lux) { const lk = k === 'playground' && t >= 1 ? 'bld_field_lux' : `bld_${k}_lux`; if (has170(lk)) return lk; }   // 예시 학교는 누구나 고급 건물(모델하우스처럼), 관리자는 다른 구경과 지난 모습에도
    if (k === 'playground') return t >= 1 ? (stageKey('bld_field', n, 3) || 'bld_field_on') : 'bld_playground_on';
    if (k === 'science') return stageKey('bld_science', n, 3) || BLD_IMG[k];
    return stageKey('bld_' + k, n, 2) || BLD_IMG[k];
  }
  const viewMap = () => rt.viewTier == null ? decoMap() : geoIdx(rt.viewTier);
  // 밤(20~6시)에는 밝기를 고를 수 있어요(모든 학교급). 고등학교부터는 학생이 그대로 기숙사에서 쉬어요
  const NL_NAME = ['밤', '저녁', '밝게'], NL_EM = ['🌙', '🌆', '☀️'];
  function nlCycle() {
    S.nl = ((S.nl || 0) + 1) % 3; sfx('tap'); save();
    renderNight(true); wldSync(); renderTierDots();
    const hs = !!map && map.classList.contains('hs-night');
    toast(S.nl === 2 ? '밤에도 밝게 보여요' + (hs ? '.\n학생들은 그대로 기숙사에서 쉬어요' : '') : S.nl === 1 ? '밤 화면을 조금 어둡게 보여요' : '밤 화면을 어둡게 보여요');
  }
  // 날씨 칩이 가운데에 있어서 좁은 화면이나 밤 모습 단추가 있을 때 학교급 단추와 겹쳤어요. 학교급 단추 오른쪽에 붙여요
  function wxPlace() {
    const c = $('#wxChip'), d = $('#tierDots'); if (!c) return;
    if (c.hidden || !d || d.hidden || !d.offsetWidth) { c.style.left = ''; c.style.transform = ''; return; }
    c.style.left = (d.offsetLeft + d.offsetWidth + 6) + 'px'; c.style.transform = 'none';
    chipRow();
  }
  function renderTierDots() {
    const box = $('#tierDots'); if (!box || !S) return;
    let wn = false; try { wn = wldLv() > 0 && WLD.ph === 'night' && !rt.photo; } catch (e) { /* 마을 층 준비 전 */ }
    const nlOn = rt.viewTier == null && !S.todOff && (!!map && map.classList.contains('hs-night') || wn);   // 밤 밝기 단추(고등학교 밤, 그 아래 학교급은 마을 층 밤)
    box.hidden = (S.tier < 1 && !nlOn) || rt.tab !== 'school' || !!rt.decoEdit;   // 유치원은 학교급 단추 없이 밤 밝기 단추만
    const key = [S.tier, rt.viewTier, nlOn, S.nl || 0, box.hidden].join('|');
    if (box.dataset.key === key) return; box.dataset.key = key;
    setTimeout(wxPlace, 0); renderCampus();   // 구역 막대도 같은 때에
    box.innerHTML = (S.tier < 1 ? [] : TIER_SHORT).map((c, t) => {
      const cur = t === S.tier, past = t < S.tier, on = rt.viewTier === t || (rt.viewTier == null && cur);
      return `<button type="button" class="td${cur ? ' cur' : ''}${past ? ' past' : ''}${on ? ' on' : ''}${t > S.tier ? ' lock' : ''}" data-td="${t}" aria-label="${TIER_ALL[t]}${cur ? ', 지금 학교' : past ? ', 그때 모습 보기' : ', 아직 못 가요'}"${t > S.tier ? ' aria-disabled="true"' : ''}>` +
        (t > S.tier ? '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 7V5.6a3 3 0 0 1 6 0V7M4.4 7h7.2v6H4.4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>' : c) + '</button>';
    }).join('') + (nlOn ? `<button type="button" class="td nl" data-nl="1" aria-label="밤 화면 밝기: ${NL_NAME[S.nl || 0]}, 눌러서 바꾸기">${NL_EM[S.nl || 0]}</button>` : '');
  }
  function tierViewOpen(t) {
    if (t === S.tier || t == null) { tierViewClose(); return; }
    if (!(t >= 0 && t < S.tier)) { toast(`${eun(TIER_ALL[t] || '그 학교급')} 아직 갈 수 없어요`); return; }
    if (rt.decoEdit) decoEditEnd();
    rt.viewTier = t; rt.viewEdit = false; rt.lookData = null; sfx('tap');
    renderTierView(true); renderTierDots();
  }
  function tierViewClose() {
    if (rt.viewTier == null) return;
    rt.viewTier = null; rt.viewEdit = false; rt.lookData = null; rt.viewZone = null;   // 구경도 닫아요
    $('#tierView').hidden = true; renderTierDots();
  }
  function renderTierView(force) {
    const box = $('#tierView'); if (!box) return;
    const t = rt.viewTier; if (t == null) { box.hidden = true; return; }
    // 대학교는 캠퍼스 지도를 먼저 보여 주고 구역 이름표를 눌러 들어가요(rt.viewZone: '' 캠퍼스, 구역 열쇠)
    if (t >= UNI_TIER) { if (rt.viewZone == null) rt.viewZone = ''; } else rt.viewZone = null;
    { const cb = $('#tvCampus'); if (cb) cb.hidden = !(t >= UNI_TIER && rt.viewZone); }
    // 다른 학교 구경(rt.lookData): 그 학교가 올린 모습으로, 보기만 해요. 예시 학교는 늘 '예시'라고 적어요
    const LD = rt.lookData || null;
    const gi = geoIdx(t), G = GEO[gi], x = LD ? { f: LD.f, bs: LD.bs, st: LD.st, at: 0, roster: LD.kids.map(sp => ({ sp })) } : snapOf(t), L = (LD ? (t >= UNI_TIER ? (LD.zl && LD.zl[rt.viewZone]) : LD.lay) : S.deco.lay[gi]) || [], edit = !LD && !!rt.viewEdit && !G.campus;
    const schNm = LD ? (LD.model ? '본보기(예시)' : LD.nm) : S.deco.nm;
    const key = [t, gi, L.join(), schNm, edit, JSON.stringify(x.f), LD ? (LD.who || '') + LD.vd : ''].join('|');
    box.hidden = false;
    box.classList.toggle('tv-visit', !!LD); box.classList.toggle('tv-model', !!(LD && LD.model));
    { const tb = $('#tvTabs'); if (tb) { tb.hidden = !(LD && LD.model); $$('button', tb).forEach(b => { if (+b.dataset.mt >= 4) b.hidden = false; const on = +b.dataset.mt === t; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); }); } }   // .look은 다른 곳에서 숨김 이름이라 tv-visit
    $('#tvTitle').textContent = LD ? (LD.model ? `[예시] 본보기 숲속 ${TIER_ALL[t]}` : `${LD.who} 교장 선생님의 ${LD.nm || '숲속'} ${TIER_ALL[t]}`) : `${S.deco.nm || '숲속'} ${TIER_ALL[t]} 시절 모습`;
    $('#tvSub').textContent = LD ? (LD.model ? '예시로 꾸민 학교예요. 실제 교장 선생님의 학교가 아니에요' : `${TIERS[t].unit === '년째' ? '' : `${LD.y}${TIERS[t].unit}, `}학생 ${fmt(LD.st)}명${LD.rare.length ? `, 반짝 친구 ${LD.rare.length}명` : ''}${LD.vd ? `, 마을 기부 ${LD.vd}단계` : ''}${LD.ti && achTitleName(LD.ti) ? `, 칭호 ${achTitleName(LD.ti)}` : ''}`)
      : x.all ? '그때는 사진을 남기지 않아서 모두 지어진 모습으로 보여요' : `${x.at ? kstDay(x.at) + ' 졸업식, ' : ''}학생 ${fmt(x.st)}명`;
    $('#tvEdit').textContent = edit ? '다 했어요' : '꾸미기';
    $('#tvEdit').hidden = !!LD || !!G.campus;
    $('#tvMark').innerHTML = LD && LD.mk && markOk(LD.mk) ? markHTML(LD.mk, '') : '';
    if (!force && box.dataset.key === key) return; box.dataset.key = key;
    const lux = luxOn() || !!(LD && LD.model);   // 예시 학교는 고급 배경을 켜지 않아도 고급 지도와 건물(그림이 있는 판에서만)
    const mapU = mapLo(mapKey(G.map, lux));
    box.style.setProperty('--map-bg', mapU ? `url("${mapU}")` : 'none');
    const mk = mapKey(G.map, lux); if (mapHi[mk] !== 'ok') mapHiGet(mk, () => { if (rt.viewTier === t) renderTierView(true); });   // 고화질 지도가 오면 다시 그려요
    let h = `<image x="0" y="-60" width="360" height="540" preserveAspectRatio="none" href="${mapHi[mk] === 'ok' ? mapUrl(mk) : mapU}"/>`;
    // 건물: 앞(아래)에 있는 것이 위에 그려지게
    const keys = Object.keys(FAC).filter(k => (FAC[k].tier || 0) <= t && G.lot[k]).sort((a, b) => G.lot[a][1] - G.lot[b][1]);
    const items = [], tags = [];
    for (const k of keys) {
      const built = (x.f[k] || 0) >= 1, im = seasonKey(built ? viewBldKey(k, t, x.bs[k], luxOn()) : SITE_IMG[k]), R = lotRect(G.lot[k], im, !built && G.zone ? ZONE_SITE_ISL : undefined), [cx, cy, w] = R;   // 예시 학교도 그 학교급 새 건물(고급 건물은 학교급마다 같은 모양이라 지도만 고급으로)
      items.push({ y: cy, s: `<image href="${IMG170(im)}" x="${(cx - w / 2).toFixed(1)}" y="${(cy - w / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${w.toFixed(1)}"${xfAt(R)}/>` });
      tags.push((built && x.f[k] > 1 && !x.all ? `<g class="tv-lv" transform="translate(${cx.toFixed(1)} ${(cy + w * 0.36).toFixed(1)})"><rect x="-30" y="-9" width="60" height="18" rx="9"/><text y="4" text-anchor="middle">${k === 'playground' ? (t >= 1 ? '운동장' : '놀이터') : FAC[k].name} Lv.${x.f[k]}</text></g>` : ''));   // 이름표는 장식과 학생 위에
    }
    if (G.next) { const R = lotRect(G.nextLot, G.nextKey), [ncx, ncy, nw] = R; items.push({ y: ncy, s: `<image href="${IMG170(seasonKey(G.next.img))}" x="${(ncx - nw / 2).toFixed(1)}" y="${(ncy - nw / 2).toFixed(1)}" width="${nw.toFixed(1)}" height="${nw.toFixed(1)}" opacity=".85"${xfAt(R)}/>` }); }
    if (!G.campus && !MAP_OAK[mk]) { const [ox, oy] = G.oak; items.push({ y: oy + 20, s: `<image href="${IMG170(oakKey()) || IMG('deco_autumn_1')}" x="${ox - 34}" y="${oy - 41}" width="68" height="65"/>` }); }
    // 장식과 간판
    const [sx, sy] = DECO_SIGN[gi] || [0, 0], sw = 84, sh = 42, nm = schNm || '숲속', tn = TIER_ALL[t];
    if (DECO_SIGN[gi] && IMG('sign_board')) items.push({ y: sy, s: `<g class="deco-sign"><image x="${sx - sw / 2}" y="${sy - sh * 0.97}" width="${sw}" height="${sh}" href="${IMG('sign_board')}"/>` +
      `<text class="deco-sign-t" x="${sx}" y="${sy - sh * 0.6}" style="font-size:${Math.min(10, 52 / Math.max(1, nm.length)).toFixed(1)}px">${esc(nm)}</text><text class="deco-sign-t" x="${sx}" y="${sy - sh * 0.36}" style="font-size:${Math.min(9, 52 / tn.length).toFixed(1)}px">${tn}</text></g>` });
    DECO_SLOTS[gi].forEach(([dx, dy], i) => {
      const d = DECO_BY[L[i]];
      let s = '';
      if (d && IMG(d.img)) { const w = d.sm ? 36 : 46; s += `<image x="${dx - w / 2}" y="${dy - w * 0.975}" width="${w}" height="${w}" href="${IMG(d.img)}"/>`; }
      if (edit) s += (d ? `<ellipse class="deco-ring" cx="${dx}" cy="${dy - 4}" rx="22" ry="8"/>` : decoEmptyMark(dx, dy, i)) +
        `<rect class="deco-hit" data-tvslot="${i}" x="${dx - 22}" y="${dy - 40}" width="44" height="46"/>`;
      if (s) items.push({ y: dy, s });
    });
    // 그때 명부 학생(사진에 남은 친구들)
    (x.roster || []).slice(0, Math.min(G.campus ? 6 : 8, G.spots.length)).forEach((r, i) => { const [kx, ky] = G.spots[i]; items.push({ y: ky + 11, s: `<g transform="translate(${kx} ${ky})${G.campus ? ' scale(.66)' : ''}">${kidSVG(r.sp, i)}</g>` }); });
    items.sort((a, b) => a.y - b.y);
    // 캠퍼스 지도: 구역 이름표(배지 없이). 눌러서 그 구역 모습을 봐요
    if (G.campus) tags.push('<g id="tvZones">' + CAMPUS.zones.map(z => { const [tx, ty] = z.tag, [hx, hy, hw, hh] = z.hit, w = z.name.length * 11.5 + 18;
      return `<g class="cz${z.lock ? ' lock' : ''}" data-tvzone="${z.lock ? '' : z.key}"><rect class="cz-hit" x="${hx}" y="${hy}" width="${hw}" height="${hh}" rx="18"/><g transform="translate(${tx} ${ty})"><rect class="cz-plate" x="${-w / 2}" y="-10" width="${w}" height="20" rx="10"/><text class="cz-name" y="4">${z.name}</text></g></g>`; }).join('') + '</g>');
    $('#tvMap').innerHTML = h + items.map(o => o.s).join('') + tags.join('');
  }
  /* ---------- 전학 대화 ----------
     종업식이나 졸업식 창을 닫으면 화면 아래 대화 창이 떠요. 교감 고슴도치가 소개하고, 새 친구가 자기소개를 두 줄 해요
     누르면 다음 말로 넘어가고, 마지막에 수업료 +5%와 도감 등록을 알려요. 대사는 woodani가 다듬어요 */
  const NEW_TALK = {
    cat: ['안녕하세요! 저는 고양이예요. 햇볕 좋은 창가 자리를 제일 좋아해요.', '낮잠은 조금만 자고 공부도 열심히 할게요. 잘 부탁해요!'],
    dog: ['멍! 반가워요, 저는 강아지예요. 친구를 보면 꼬리가 저절로 흔들려요.', '달리기 시합은 언제든 자신 있어요. 운동장에서 같이 뛰어요!'],
    penguin: ['안녕하세요, 저는 먼 남쪽 바다에서 온 펭귄이에요.', '추운 곳에서 와서 더위는 조금 힘들지만, 수영은 누구보다 잘해요!'],
    panda: ['안녕하세요... 저는 판다예요. 대나무 간식을 넉넉히 챙겨 왔어요.', '느긋해 보여도 공부는 자신 있어요. 같이 숙제해요!'],
    koala: ['음... 안녕하세요. 저는 코알라예요. 나무 위가 제일 편해요.', '조용한 도서관에서 책 읽는 걸 좋아해요. 재미있는 책 알려 주세요.'],
    otter: ['안녕하세요! 저는 수달이에요. 물장구치는 게 제일 신나요.', '조개껍데기로 만든 악기를 가져왔어요. 다음에 같이 연주해요!'],
    hamster: ['안녕하세요! 저는 햄스터예요. 해바라기 씨 모으는 게 취미예요!', '볼 주머니에 간식을 넣어 왔어요. 친구들이랑 나눠 먹을래요.'],
    duck: ['꽥! 안녕하세요, 연못 학교에서 전학 온 오리예요.', '비 오는 날을 제일 좋아해요. 노래를 부르면 기분이 좋아져요!'],
    turtle: ['안녕하세요. 저는... 거북이에요. 말이 조금 느려도 기다려 주세요.', '한 번 시작한 일은 끝까지 해요. 느려도 꾸준히요!'],
    mole: ['안녕하세요! 저는 두더지예요. 땅속 지름길은 제가 다 알아요.', '눈이 조금 나빠서 안경을 썼어요. 별자리 책 읽는 걸 좋아해요.'],
    frog: ['개굴! 안녕하세요, 저는 개구리예요. 높이뛰기는 제가 일등이에요!', '친구들이랑 개굴개굴 합창을 하고 싶어요. 같이 해요!'],
    waterdeer: ['안, 안녕하세요... 저는 고라니예요. 수줍음이 조금 많아요.', '그림 그리는 걸 좋아해요. 우리 학교 풍경도 그려 볼게요!'],
    // 고등학교 전학생(대사는 다듬어요)
    redpanda: ['안녕하세요! 저는 높은 산 대나무 숲에서 온 레서판다예요.', '꼬리 줄무늬를 세면서 셈 공부를 했어요. 수학 문제는 저한테 맡겨요!'],
    capybara: ['반가워요. 저는 카피바라예요. 따뜻한 물에 몸 담그는 걸 좋아해요.', '느긋하게 책 읽는 시간이 제일 좋아요. 기숙사에서 같이 읽어요!'],
    kangaroo: ['안녕하세요! 저는 먼 남쪽 들판에서 온 캥거루예요. 깡충!', '주머니에 운동화를 챙겨 왔어요. 운동장 달리기 같이 해요!'],
    // 대학원생(대사는 다듬어요)
    lemur: ['안녕하세요! 저는 여우원숭이예요. 줄무늬 꼬리가 자랑이에요.', '실험 노트는 꼬리만큼 길게 쓸 거예요!'],
    armadillo: ['안녕하세요. 저는 아르마딜로예요. 부끄러우면 동그랗게 말려요.', '논문을 읽다 보면 껍질 속처럼 아늑해요.'],
    quokka: ['안녕하세요! 저는 늘 웃는 쿼카예요.', '발표 포스터는 제가 제일 크게 만들게요!'],
    // 대학교 신입생(대사는 다듬어요)
    meerkat: ['안녕하세요! 저는 넓은 모래 들판에서 온 미어캣이에요.', '꼿꼿이 서서 멀리 보는 게 특기예요. 별을 세다 보니 셈도 빨라졌어요!'],
    sloth: ['안녕... 하세요... 저는 나무늘보예요. 조금 느려도 봐주세요.', '천천히 오래 그리는 그림을 좋아해요. 캠퍼스 나무를 하나씩 그릴게요.'],
    chinchilla: ['안녕하세요! 저는 높은 산 바위틈에서 온 친칠라예요.', '궁금한 게 생기면 잠이 안 와요. 실험실 불은 제가 끌게요!']
  };
  function newTalkLines(n) {
    const self = NEW_TALK[n.k] || [`안녕하세요! 저는 ${n.name}예요. 잘 부탁해요!`];
    return [{ who: 'hedgehog', t: `교장 선생님, 오늘 우리 학교에 새 친구가 왔어요! ${n.name}${n.ga} 전학 왔답니다. 다 같이 반갑게 맞아 줘요.` }]
      .concat(self.map(t => ({ who: n.k, t })))
      .concat([{ who: 'hedgehog', t: `${n.name} 친구가 오면서 학교가 더 북적여요. 수업료가 5% 올랐고, 동물 도감에도 등록했어요!`, last: true }]);
  }
  function showNewTalk(n) {
    const m = $('#mTalk'); if (!m || !n) return false;
    rt.talkSeq = { n, lines: newTalkLines(n), i: 0 };
    talkLine();
    openModal(m);
    return true;
  }
  function talkLine() {
    const T = rt.talkSeq; if (!T) return;
    const L = T.lines[T.i], hh = L.who === 'hedgehog';
    $('#talkAv').innerHTML = hh ? hedgehogAvatar() : kidAvatar(L.who);
    $('#talkAv').classList.toggle('kid', !hh);
    $('#talkWho').textContent = hh ? '교감 고슴도치' : T.n.lab || `새 친구 ${T.n.name}`;   // 반짝 친구는 lab
    $('#talkText').textContent = nl(headText(L.t));
    $('#talkNext').textContent = T.i >= T.lines.length - 1 ? '반가워요!' : '다음';
    $('#talkStep').textContent = `${T.i + 1} / ${T.lines.length}`;
  }
  function talkNext() {
    const T = rt.talkSeq; if (!T) { closeModal($('#mTalk')); return; }
    sfx('tap');
    if (T.i < T.lines.length - 1) { T.i += 1; talkLine(); return; }
    rt.talkSeq = null;
    closeModal($('#mTalk'));
  }
