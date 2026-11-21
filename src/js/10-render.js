  /* ---------- 화면 그리기 ---------- */
  // 끊김: 0.1초마다 도는 화면 갱신이 같은 글자도 다시 써서 화면 배치를 매번 다시 셌어요. 바뀐 때만 써요
  const setTx = (el, v) => { if (el && el.textContent !== String(v)) el.textContent = v; };
  const setAt = (el, a, v) => { if (el && el.getAttribute(a) !== String(v)) el.setAttribute(a, v); };
  const setHid = (el, h) => { if (el && el.hidden !== !!h) el.hidden = !!h; };
  const earlyDay = () => !!S && S.tier === 0 && S.q.m < 3 && !(S.st && S.st.grads > 0);   // 처음 세 메인 퀘스트
  function renderHUD() {
    document.body.classList.toggle('early', earlyDay());
    setTx($('#vBudget'), fmt2(S.budget));
    setTx($('#vRate'), `초당 +${fmtRate(rate())}${feastOn() ? ' (+100%)' : ''}`);
    renderDeal();
    setTx($('#vStudents'), `${Math.floor(S.students)}/${capacity()}`);
    const r = rep();
    setTx($('#vRep'), r);
    const kn = Math.floor(S.students);
    setTx($('#vRepTop'), fmt(r)); setTx($('#vKidsTop'), `${fmt(kn)}명`); setTx($('#vEssTop'), fmt(S.ess || 0));
    { const ei = $('#essPill img'); if (ei && !ei.getAttribute('src') && IMG('ic_essence')) ei.setAttribute('src', IMG('ic_essence')); } setAt($('#essPill'), 'aria-label', `숲의 정수 ${fmt(S.ess || 0)}`);
    setAt($('#repPill'), 'aria-label', `평판 ${fmt(r)}`); setAt($('#kidsPill'), 'aria-label', `학생 ${fmt(kn)}명`);
    renderPower();
    fitText($('#vBudget'), 14, budgetTpl(S.budget)); fitText($('#vRate'), 11, $('#vRate').textContent.replace(/[0-9]/g, '8')); fitText($('#vStudents'), 15); fitText($('#vPower'), 15);
    const G = CFG.grades, g = S.grade;
    setTx($('#schoolName'), schoolTitle());   // 꾸미기 가게에서 이름 앞부분을 바꿀 수 있어요
    renderCrest();
    renderYear();
    setTx($('#gradePill'), G[g].name);
    let p = 1, txt = semFirst() ? (semLocked() ? `1학기 방학식까지 퀘스트 ${semLeft()}개` : '1학기 방학식을 열 수 있어요') : finalYear() ? '졸업식을 열 수 있어요' : yearLocked() ? `종업식까지 퀘스트 ${yearLeft()}개` : '종업식을 열 수 있어요';   // '대도시예요!'는 위 칸에 이미 보여서 뺐어요
    if (g < G.length - 1) {
      const lo = townRep(g), hi = townRep(g + 1);
      p = Math.max(0, Math.min(1, (r - lo) / (hi - lo)));
      txt = `${G[g + 1].name}까지 ★${Math.max(0, hi - r)}`;
    }
    { const bw = (p * 100).toFixed(1) + '%', bf = $('#barFill'); if (bf.style.width !== bw) bf.style.width = bw; }
    setAt($('#gradeBar'), 'aria-valuenow', Math.round(p * 100));
    setTx($('#vNext'), txt);
  }
  // 칠판 숫자가 칸보다 길면 글자를 줄여서 한 칸에 맞춰요. 글자 수나 칸 너비가 바뀔 때만 다시 재요
  // tpl: 크기를 정할 때 쓸 가장 긴 글자(예: '8888억 8888만'). 주면 그 글자로 크기를 정해서, 숫자가 '4167억'처럼 잠깐 짧아져도 글자가 커졌다 작아졌다 하지 않아요
  function fitText(el, min, tpl) {
    const key = (tpl || el.textContent).length + '|' + (tpl || '') + '|' + rt.fitKey;
    if (el.dataset.fit === key) return;
    el.dataset.fit = key;
    const real = el.textContent;
    if (tpl) el.textContent = tpl;
    el.style.fontSize = '';
    let size = parseFloat(getComputedStyle(el).fontSize);
    // scrollWidth는 정수로 반올림돼서 0.5px 넘침을 못 잡아요(그래도 ...이 생겨요). 글자 실제 너비를 Range로 재요
    const cs = getComputedStyle(el), room = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const rg = document.createRange(), over = () => { rg.selectNodeContents(el); return rg.getBoundingClientRect().width > room + 0.01; };
    while (over() && size > min) { size -= 1; el.style.fontSize = size + 'px'; }
    if (tpl) el.textContent = real;
  }
  // 도토리 칸 크기 정하기용 글자: 지금 단위에서 가장 길게 나올 모양(숫자는 8로, 아래 단위까지)
  function budgetTpl(n) {
    const t = fmt2(n);
    if (!/[만억조경해자양]/.test(t)) return t.replace(/[0-9]/g, '8');
    const m = t.match(/^([0-9,]+)([만억조경해자양])/); if (!m) return t;
    const U = ['양', '자', '해', '경', '조', '억', '만'], i = U.indexOf(m[2]), u2 = i + 1 < U.length ? U[i + 1] : '';
    return m[1].replace(/[0-9]/g, '8') + m[2] + (u2 ? ' 8888' + u2 : '');
  }
  const refit = () => { rt.fitKey = `${window.innerWidth}x${window.innerHeight}|3|${rt.fitGen}`; };
  // 칠판 제목 아래: 올해가 몇 년째(몇 학년)인지, 이 학교에서 몇 번째 해인지 점으로 보여 줘요
  function renderYear() {
    const T = tierInfo(), yn = yearNo(), last = finalYear();
    const key = `${S.tier}|${yn}|${last ? 1 : 0}|${semLabel()}`;
    if (rt.yearKey === key) return;
    rt.yearKey = key;
    $('#yearNow').textContent = gradOn() ? gradSemTxt(yn, S.sem) : `${yn}${T.unit}`;
    $('#yearDots').innerHTML = Array.from({ length: T.years }, (_, i) => `<i class="${i < yn - 1 ? 'on' : i === yn - 1 ? 'now' : ''}"></i>`).join('');
    const kLast = last && S.tier === 0;   // 졸업반 표시는 2년짜리 유치원만(다른 학교급은 몇 년인지 다들 알아요)
    $('#yearNote').textContent = gradOn() ? '' : (kLast ? '졸업반 ' : '') + semLabel();
    $('#yearNote').classList.toggle('sem', !kLast);
  }
  // 가진 재화: 수료증은 처음 받았을 때부터, 기금은 졸업한 뒤부터 칠판에 보여요
  const dipShown = () => S.st.grads > 0 || S.tier > 0 || S.tdip > 0 || S.p.dip > 0;

  // 학교급마다 교실 그림이 달라서, 지금 보이는 그림 속 종을 찾아요
  const lookOf = k => $(`#b-${k} .built`);
  const bellEl = () => $('.bell', lookOf('classroom'));
  function ringBell() { const b = bellEl(); if (!b) return; b.classList.remove('ring'); void b.getBBox(); b.classList.add('ring'); }
  // 구역 바꾸기: z는 구역 열쇠, ''면 캠퍼스 화면. 지도 한 장을 통째로 바꾸는 것이라 학생과 떨어진 도토리를 새 지도에 다시 놓아요
  function setZone(z, quiet) {
    if (!uniOn()) return;
    z = ZONE_KEYS.includes(z) && zoneOpen(z) ? z : '';   // 연구 구역은 대학원부터
    const was = geoIdx();
    S.zone = z; if (z) { rt.zoneLast = z; if (!S.zv) S.zv = {}; if (!S.zv[z]) { S.zv[z] = 1; if (typeof renderQuestBar === 'function') renderQuestBar(); } }   // '캠퍼스 둘러보기' 퀘스트
    if (geoIdx() !== was) {
      rt.nav = null; rt.guideKey = undefined;
      rt.kids.forEach(k => k.g.remove()); rt.kids = []; clearDrops();
      renderMap(); syncKids(true);
      rt.zoom = 1; fitMap(true);   // 새 지도는 처음 자리와 크기로
    }
    if (typeof renderCampus === 'function') renderCampus();
    if (!quiet) { renderHUD(); renderAffordance(); save(); }
  }
  // 캠퍼스 지도 위의 구역 이름표. 배지는 그 구역 건물 가운데 급한 것 하나: 즉시 완공 가능 > 공사 중 > 올릴 수 있어요
  function zoneBadge(z) {
    const Z = ZONE_GEO.find(Z => Z.zone === z); if (!Z) return null;
    const ks = Object.keys(Z.lot).filter(k => FAC[k] && facKeys().includes(k));
    if (z === 'plaza' && S.fv && bfOn() && (S.bf.dn || 0) < BIG.dayMax) return ['fv', '대축제!'];
    if (z === 'plaza' && S.fv && fvOn() && fvStampsToday() < Math.min(FV.dayMax, fvBooths().length + 2)) return ['fv', '축제!'];
    if (ks.some(k => { const p = document.getElementById('pq-' + k); return p && p.classList.contains('ff-on'); })) return ['ff', '즉시 완공 가능!'];
    if (ks.some(k => conOn(k))) return ['con', '공사 중'];
    if (ks.some(k => S.budget >= facNextCost(k))) return ['up', '올릴 수 있어요'];
    return null;
  }
  function renderCampus() {
    const g = $('#campusG'); if (!g || !S) return;
    const on = uniOn() && !!geo().campus && rt.viewTier == null;
    const key = on ? CAMPUS.zones.map(z => z.key + ':' + (z.lock ? 'L' : (zoneBadge(z.key) || [''])[0])).join() : '';
    if (g.dataset.key !== key) {
      g.dataset.key = key;
      g.innerHTML = !on ? '' : CAMPUS.zones.map(z => {
        const [tx, ty] = z.tag, [hx, hy, hw, hh] = z.hit, w = z.name.length * 11.5 + 18, bd = z.lock ? null : zoneBadge(z.key), bw = bd ? bd[1].length * 8 + 12 : 0;
        return `<g class="cz${z.lock ? ' lock' : ''}" data-zone="${z.key}" tabindex="0" role="button" aria-label="${z.name}${z.lock ? ', 대학원에서 열려요' : ', 눌러서 들어가기' + (bd ? ', ' + bd[1] : '')}">` +
          `<rect class="cz-hit" x="${hx}" y="${hy}" width="${hw}" height="${hh}" rx="18"/>` +
          `<g transform="translate(${tx} ${ty})"><rect class="cz-plate" x="${-w / 2}" y="${z.lock ? -13 : -10}" width="${w}" height="${z.lock ? 28 : 20}" rx="10"/>` +
          `<text class="cz-name" y="${z.lock ? 0 : 4}">${z.name}</text>` + (z.lock ? '<text class="cz-sub" y="10">대학원에서 열려요</text>' : '') +
          (bd ? `<g class="cz-bdg ${bd[0]}" transform="translate(0 -19)"><rect x="${-bw / 2}" y="-6.5" width="${bw}" height="13" rx="6.5"/><text y="3">${bd[1]}</text></g>` : '') + '</g></g>';
      }).join('');
    }
    renderZoneBar();
  }
  function renderZoneBar() {
    const bar = $('#zoneBar'); if (!bar || !S) return;
    const show = uniOn() && !geo().campus && rt.tab === 'school' && rt.viewTier == null;   // 꾸미기 중에도 구역을 옮길 수 있게(캠퍼스 단추만 숨겨요)
    bar.hidden = !show; bar.classList.toggle('in-edit', !!rt.decoEdit); bar.style.bottom = rt.decoEdit ? 'calc(var(--bot-h, 70px) + 80px)' : (bar.dataset.bot || ''); if (!show) return;   // 꾸미기 중에는 꾸미기 띠 위로
    $('#zoneName').textContent = geo().zname;
    // 캠퍼스 그림을 아직 안 받았거나 테마 지도일 때 비었어요. 지금 테마의 캠퍼스 지도를 받아서 넣고, 그동안은 기본 캠퍼스 그림
    const ic = $('#zoneHomeIc'), ck = mapKey(CAMPUS.map), put = u => { if (u && ic.dataset.u !== u) { ic.dataset.u = u; ic.style.backgroundImage = `url("${u}")`; } };
    put(mapHi[ck] === 'ok' ? mapUrl(ck) : mapHi[CAMPUS.map] === 'ok' ? mapUrl(CAMPUS.map) : mapLo(ck) || mapLo(CAMPUS.map));
    if (mapHi[ck] !== 'ok') mapHiGet(ck, put); if (ck !== CAMPUS.map && mapHi[ck] === 'no') mapHiGet(CAMPUS.map, u => { if (mapHi[ck] !== 'ok') put(u); });
  }
  const zoneOpen = z => z !== 'lab' || gradOn();   // 연구 구역은 대학원부터
  const zoneStep = d => { const ks = ZONE_KEYS.filter(zoneOpen), i = ks.indexOf(S.zone); if (i >= 0) { sfx('tap'); setZone(ks[(i + d + ks.length) % ks.length]); } };
  function campusTap(el) {
    const z = CAMPUS.zones.find(z => z.key === el.dataset.zone); if (!z) return;
    if (z.lock) { toast(`${eun(z.name)} 대학원에서 열려요`); sfx('tap'); return; }
    sfx('tap'); setZone(z.key);
  }
  // 장면이 일어나는 구역으로 조용히 옮겨요(운동회는 체육, 버스는 광장, 건물 바로 가기는 그 건물 구역)
  const zoneGo = z => { if (uniOn() && z && geo().zone !== z) setZone(z, true); };
  // 대학교 미리 보기(개발자 메뉴에서만): 저장하지 않고 이 화면에서만 대학교로 바꿔 봐요. 새로 고치면 원래 학교로 돌아와요
  function uniPreview() {
    if (AIT || window.FOREST_STORE || !S) return false;
    if (!rt.uniPrev) save();
    rt.uniPrev = true; S.u.dev = true;
    S.tier = UNI_TIER; S.tg = 0; S.sem = 0; S.zone = ''; rt.zoneLast = '';
    for (const k of Object.keys(S.bs)) if (S.f[k] >= 1) S.bs[k] = UNI_TIER;   // 미리 보기에서는 지은 건물을 대학교 모습으로
    rt.mapLaid = undefined; rt.nav = null;
    { const i = MAIN.findIndex(q => q.id === 'un1'); if (i >= 0 && S.q.m < i) { S.q.m = i; S.q.mb = 0; S.q.mid = 'un1'; } }   // 미리 보기에서는 대학교 첫 퀘스트부터
    rt.kids.forEach(k => k.g.remove()); rt.kids = []; clearDrops();
    setTab('school'); renderMap(); syncKids(true); renderHUD(); renderAffordance(); renderQuestBar(); profTitles();
    if (typeof renderCampus === 'function') renderCampus();
    return true;
  }
  function renderMap() {
    map.classList.toggle('tier-0', !(S.tier >= 1));
    map.classList.toggle('tier-1', S.tier >= 1);
    map.classList.toggle('tier-2', S.tier >= 2);   // 중학교부터 매점
    map.classList.toggle('tier-3', S.tier >= 3);   // 고등학교부터 기숙사
    for (let i = 0; i < GEO.length; i++) map.classList.toggle('g-' + i, geoIdx() === i);
    layoutMap();
    renderTown(false);
    for (const k of facKeys()) {
      const L = S.f[k], g = $('#b-' + k);
      g.classList.toggle('is-built', L >= 1);
      $('#pl-' + k).textContent = L >= 1 ? `${FAC[k].name} Lv.${L}` : `${FAC[k].name} 짓기`;
      { const t = $('#pl-' + k), pq = $('#pq-' + k), r = $('.c-plaque', pq);   // 이름표 너비를 글자 길이에 맞춰요
        let tw = 0; try { tw = t.getComputedTextLength(); } catch (e) {}
        if (!tw) tw = t.textContent.length * 7.2;
        const w = Math.ceil(tw) + 12; if (r.getAttribute('width') !== String(w)) { r.setAttribute('width', w); r.setAttribute('x', -w / 2); $('.can', pq).setAttribute('transform', `translate(${w / 2 + 1} -7)`); } }
      g.setAttribute('aria-label', L >= 1 ? `${FAC[k].name} 레벨 ${L}, 눌러서 키우기` : `${FAC[k].name}, 눌러서 짓기`);
    }
    hudArtInit(); hudTheme(); renderTeachersOnMap();   // 현황판 그림
    renderOak();
    renderDeco();
    if (S.bd) for (const k of Object.keys(FAC)) conMap(k);   // 공사 표시
    renderCampus();
  }

  /* 홈: 지도를 화면 가득 깔고 UI를 띄워요. 지도 그림은 화면보다 크게 그리고(가로세로 비율 유지), 손가락으로 밀어 볼 수 있어요 */
  function hudVars() {
    const app = $('#app'), fr = $('.frame');
    if (!app || !fr || rt.tab !== 'school') return;
    chipRow();
    const f = fr.getBoundingClientRect(), b = $('.board').getBoundingClientRect(), q = $('#qRow').getBoundingClientRect(), sb = $('#subBar'), qc = $('#qCard');
    const left = Math.max(q.bottom, sb && !sb.hidden ? sb.getBoundingClientRect().bottom : 0, qc ? qc.getBoundingClientRect().bottom : 0) - f.top;
    // 홈 UI 정리: 오른쪽 메뉴 레일이 가리는 폭. 행사 아이템과 떨어진 도토리가 레일 밑에 나오지 않게 visMap()에서 빼요
    const mr = $('.map-right'), mrr = mr && mr.offsetParent ? mr.getBoundingClientRect() : null;
    rt.hudRight = mrr && mrr.width ? Math.max(0, Math.round(f.right - mrr.left)) : 0;
    const bot = f.bottom - $('.tabs').getBoundingClientRect().top;
    app.style.setProperty('--hud-h', Math.round(b.bottom - f.top) + 'px');
    app.style.setProperty('--left-h', Math.round(left) + 'px');
    app.style.setProperty('--bot-h', Math.max(0, Math.round(bot)) + 'px');
    rt.hudTop = left; rt.hudBot = bot;
  }
  // 지금 화면에 보이는 지도 범위(지도 좌표): [왼쪽, 위, 오른쪽, 아래]. 위쪽 UI와 아래 탭 막대에 가린 곳은 빼요
  function visMap() {
    const fr = $('.frame'); if (!fr || !rt.mapS || rt.tab !== 'school') return null;
    const sc = rt.mapS, W = fr.clientWidth, H = fr.clientHeight;
    return [-(rt.panX || 0) / sc, ((rt.hudTop || 0) - (rt.panY || 0)) / sc - 60, (W - (rt.hudRight || 0) - (rt.panX || 0)) / sc, (H - (rt.hudBot || 0) - (rt.panY || 0)) / sc - 60];
  }
  // 지도에서 가장 위에 있는 건물(공사 자리 포함)의 지붕 꼭대기 y (지도 좌표)
  const mapRoofTop = () => { const G = geo(); if (G.campus) return Math.min(...CAMPUS.zones.map(z => z.tag[1] - 100));   // 캠퍼스 지도에는 건물이 없어서 가장 위 구역 이름표를 기준으로 해요(이름표가 퀘스트 카드보다 70칸쯤 아래로 올 때까지 내릴 수 있어요). 없으면 지도가 움직이지 않아 위쪽 구역이 현황판 뒤에 숨었어요
    return Math.min(...Object.values(G.b).concat(G.next ? [G.next.at] : []).map(([, cy, w]) => cy - w * 0.46)); };
  // 화면 당기기(camAnim)가 마지막 자리를 미리 알 수 있게 자리 맞추기만 따로 떼었어요
  function panTo(x, y) {
    if (rt.camHold) { rt.camHold = null; map.classList.remove('cam-move'); }   // 키운 채로 멈춘 그림을 손으로 옮기면 그 자리에서 끝내요
    const [px, py] = panClamp(x, y);
    rt.panX = px; rt.panY = py;
    map.style.transform = `translate(${rt.panX.toFixed(1)}px, ${rt.panY.toFixed(1)}px)`;
  }
  function panClamp(x, y) {
    const fr = $('.frame'), W = fr.clientWidth, H = fr.clientHeight;
    // 지도가 화면보다 작은 쪽은 그 안에서만, 큰 쪽은 빈틈이 보이지 않는 데까지만 움직여요
    const cl = (v, room) => Math.min(Math.max(0, room), Math.max(Math.min(0, room), v));
    const px = cl(x, W - rt.mapW);
    // 긴 휴대폰에서도 가장 위 건물(초등학교 과학실)이 위쪽 칸에 가려지지 않게, 그 지붕이 위쪽 칸 바로 아래 올 때까지 지도를 내릴 수 있어요
    // 지도 위 끝은 위쪽 칸 뒤에 머물러서 빈 곳이 보이지 않아요(그 뒤는 .frame의 하늘색)
    const down = Math.max(0, (rt.hudTop || 0) + 4 - (mapRoofTop() + 60) * rt.mapS);
    const lo = rt.mapH < H ? H - (rt.hudBot || 0) - rt.mapH : H - rt.mapH;
    // 지도를 360칸으로 줄이면 긴 휴대폰에서는 지도 전체가 위쪽 칸과 아래 탭 사이에 다 들어가요(lo > down)
    // 그때는 지도 아래 끝을 아래 탭 위에 맞춰 두고(위아래로 움직이지 않아요), 지도 위쪽 빈 곳은 흐린 배경(.frame::before)이 채워요
    return [px, lo > down ? lo : Math.min(down, Math.max(lo, y))];
  }
  // 학교 행사: 행사 자리(지도 y 범위)가 위쪽 칸과 아래 탭 사이에 다 보이게 지도를 옮겨요. 범위가 더 크면 위쪽을 맞춰요
  function festFocus(top, bot) {
    const fr = $('.frame'); if (!fr || !rt.mapS || rt.tab !== 'school') return;
    const H = fr.clientHeight, sc = rt.mapS, a = (rt.hudTop || 0) + 8, z = H - (rt.hudBot || 0) - 8;
    const h = (bot - top) * sc, want = h <= z - a ? (a + z) / 2 - ((top + bot) / 2 + 60) * sc : a - (top + 60) * sc;
    panTo(rt.panX == null ? (fr.clientWidth - rt.mapW) / 2 : rt.panX, want);
  }
  // 행사마다 아이템이 나오고 움직이는 자리 (지도 y)
  function festRange() {
    if (rt.sports) return [SPORTS.cy - SPORTS.ry - 22, SPORTS.cy + SPORTS.ry + 18];
    if (!rt.fest) return null;
    const form = festDef(rt.fest.id).form, y = pzy();
    return form === 'stage' ? [y - 150, y + 64] : form === 'ring' ? [y - 124, y + 50] : form === 'rows' ? [y - 44, y + 40] : [78, 412];
  }
  function festFocusNow() { const r = festRange(); if (!r) return; requestAnimationFrame(() => requestAnimationFrame(() => { hudVars(); festFocus(r[0], r[1]); })); }
  // 지도 확대: 손가락 두 개(휴대폰)나 휠(컴퓨터)로 키워요. 줄이기는 처음 크기(rt.zoom 1)까지만
  const ZOOM_MAX = 2.5;
  function fitMap(reset, focus) {
    const fr = $('.frame'); if (!fr) return;
    const W = fr.clientWidth, H = fr.clientHeight;
    if (!W || !H || rt.tab !== 'school') return;
    hudVars();
    // 화면을 가득 채우되, 지도 가로 360칸이 다 보이게 해요. 긴 휴대폰에서는 위아래 끝이 UI 뒤로 조금 비어요
    // 지도가 차분해져서 학교 전체가 더 잘 보이게 300칸 → 360칸(지도 가로 전체). rt.viewW는 시험용
    if (reset) rt.zoom = 1;
    const sc0 = Math.min(Math.max(W / 360, H / 540), W / (rt.viewW || 360));
    // 위 칸과 아래 탭이 낮아져서, 긴 휴대폰에서 지도가 그 사이보다 조금 짧으면(5%까지) 조금 키워 빈틈을 메워요
    const fill = (H - (rt.hudTop || 0) - (rt.hudBot || 0)) / 540, sc = (fill > sc0 && fill <= sc0 * 1.05 ? fill : sc0) * (rt.zoom || 1), old = rt.mapS;
    rt.mapS = sc; rt.mapW = 360 * sc; rt.mapH = 540 * sc;
    map.style.width = rt.mapW + 'px'; map.style.height = rt.mapH + 'px';
    if (reset || rt.panX == null || !old) {
      // 건물들 가운데(지도 y 215)가 위쪽 UI와 아래 탭 사이 한가운데에 오게
      // 위쪽 현황판과 퀘스트 카드가 조금 커져서, 맨 위 건물 이름표와 참나무가 함께 보이게 기준을 15칸 내려요
      const mid = ((rt.hudTop || 0) + H - (rt.hudBot || 0)) / 2;
      panTo((W - rt.mapW) / 2, mid - (215 + 75) * sc);
    } else if (focus) panTo(focus[0] - (focus[0] - rt.panX) * sc / old, focus[1] - (focus[1] - rt.panY) * sc / old);   // 손가락이나 휠 자리를 그대로 두고 키워요
    else panTo(rt.panX * sc / old, rt.panY * sc / old);
  }
  // cx, cy: 화면 좌표. z: 1(처음 크기) ~ ZOOM_MAX
  function zoomAt(z, cx, cy) {
    const fr = $('.frame'); if (!fr || !rt.mapS || rt.tab !== 'school') return false;
    z = Math.min(ZOOM_MAX, Math.max(1, z));
    if (Math.abs(z - (rt.zoom || 1)) < 1e-3) return false;
    const r = fr.getBoundingClientRect();
    rt.zoom = z; fitMap(false, [cx - r.left, cy - r.top]);
    return true;
  }
  /* 체험학습 배웅과 마중 때 잠깐 버스 쪽으로 화면을 당겼다가 원래 자리로 돌아와요
     camAnim(z, x, y, ms): z 확대(1~ZOOM_MAX), x y 지도 왼쪽 위 자리(panTo와 같은 값)로 부드럽게. camAt(mx, my): 지도 좌표를 화면 가운데에 두는 x y */
  function camAt(z, mx, my) {
    const fr = $('.frame'); if (!fr || !rt.mapS) return null;
    const W = fr.clientWidth, H = fr.clientHeight, mid = ((rt.hudTop || 0) + H - (rt.hudBot || 0)) / 2, sc = rt.mapS / (rt.zoom || 1) * z;
    return [W / 2 - mx * sc, mid - (my + 60) * sc];
  }
  function camAnim(z, x, y, ms, hold) {
    return new Promise(done => {
      if (!rt.mapS || rt.tab !== 'school') { done(); return; }
      /* hold: 다 당긴 뒤에도 지도 크기를 다시 맞추지 않고(그때 한 번 크게 끊겼어요) 키운 그림 그대로 두었다가
         원래 크기로 돌아오는 다음 당기기에서 그대로 되돌려요. 그러면 장면 내내 지도 크기를 한 번도 바꾸지 않아요 */
      const H = rt.camHold; rt.camHold = null;
      /* 예전에는 매 프레임 fitMap으로 지도 크기(width, height)를 바꾸고
         위쪽 칸 자리를 다시 재서(hudVars), 휴대폰이 큰 지도를 프레임마다 다시 배치하고 다시 그렸어요
         이제 움직이는 동안은 지도 크기는 그대로 두고 transform(옮기기와 키우기)만 바꾸고, 크기는 끝에 한 번만 맞춰요 */
      const z0 = rt.zoom || 1, x0 = H ? H.x : rt.panX, y0 = H ? H.y : rt.panY, sc0 = H ? H.s : 1, t0 = performance.now(), id = (rt.camId = (rt.camId || 0) + 1);
      const m0 = { s: rt.mapS, w: rt.mapW, h: rt.mapH }, s1 = m0.s / z0 * z;
      rt.mapS = s1; rt.mapW = 360 * s1; rt.mapH = 540 * s1;
      const [x1, y1] = panClamp(x, y);   // 마지막 자리(빈틈이 보이지 않게 맞춘 값)
      rt.mapS = m0.s; rt.mapW = m0.w; rt.mapH = m0.h;
      map.classList.add('cam-move');   // 움직이는 동안 지도를 한 장의 그림처럼 옮기고 키워요(끝나면 한 번 다시 그림)
      const end = () => {
        if (hold && rt.tab === 'school') { rt.camHold = { s: z / z0, x: x1, y: y1 }; done(); return; }   // 키운 그림 그대로
        map.classList.remove('cam-move');
        if (Math.abs(z - z0) < 1e-6) panTo(x1, y1); else { rt.zoom = z; fitMap(false); panTo(x1, y1); }   // 원래 크기로 돌아오면 크기는 그대로
        done();
      };
      const step = now => {
        if (rt.camId !== id) { map.classList.remove('cam-move'); done(); return; }   // 새 당기기가 이어받아요(그쪽이 처음 자리부터 다시 움직여요)
        if (rt.tab !== 'school') { end(); return; }
        const p = Math.min(1, (now - t0) / ms), e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        const sc = sc0 + (z / z0 - sc0) * e;
        map.style.transform = `translate(${(x0 + (x1 - x0) * e).toFixed(1)}px, ${(y0 + (y1 - y0) * e).toFixed(1)}px) scale(${sc.toFixed(4)})`;
        if (p < 1) requestAnimationFrame(step); else end();
      };
      requestAnimationFrame(step);
    });
  }
  function setupPan() {
    const fr = $('.frame');
    let st = null, pinch = null;
    const pts = new Map();   // 지도 위에 닿은 손가락들 (두 개면 확대, 축소)
    const two = () => { const [a, b] = [...pts.values()]; return { d: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; };
    fr.addEventListener('pointerdown', e => {
      if (rt.tab !== 'school' || e.target.closest('button, .panel') || (e.pointerType === 'mouse' && e.button !== 0)) return;
      if (e.pointerType === 'touch') pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) {
        const t = two(); pinch = { d: Math.max(20, t.d), z: rt.zoom || 1, x: t.x, y: t.y };
        if (st && st.moved) fr.classList.remove('panning');
        st = null; rt.panMoved = performance.now();
        return;
      }
      if (pts.size > 2) return;
      st = { id: e.pointerId, x: e.clientX, y: e.clientY, px: rt.panX || 0, py: rt.panY || 0, moved: false };
    });
    fr.addEventListener('pointermove', e => {
      if (pts.has(e.pointerId)) pts.get(e.pointerId).x = e.clientX, pts.get(e.pointerId).y = e.clientY;
      if (pinch && pts.size >= 2) {
        const t = two();
        zoomAt(pinch.z * t.d / pinch.d, t.x, t.y);
        panTo(rt.panX + t.x - pinch.x, rt.panY + t.y - pinch.y);   // 두 손가락을 같이 밀면 지도도 따라가요
        pinch.x = t.x; pinch.y = t.y; rt.panMoved = performance.now();
        return;
      }
      if (!st || e.pointerId !== st.id) return;
      const dx = e.clientX - st.x, dy = e.clientY - st.y;
      if (!st.moved && Math.hypot(dx, dy) < 8) return;
      if (!st.moved) { st.moved = true; try { fr.setPointerCapture(e.pointerId); } catch (er) { /* 무시 */ } fr.classList.add('panning'); }
      panTo(st.px + dx, st.py + dy);
    });
    const end = e => { pts.delete(e.pointerId); if (pinch && pts.size < 2) { pinch = null; rt.panMoved = performance.now(); return; } if (!st || e.pointerId !== st.id) return; if (st.moved) { rt.panMoved = performance.now(); fr.classList.remove('panning'); } st = null; };
    fr.addEventListener('pointerup', end); fr.addEventListener('pointercancel', end);
    // 지도 판은 스크롤하지 않아요 (키보드로 건물을 옮겨 다닐 때 브라우저가 밀어 두는 것도 되돌려요)
    fr.addEventListener('wheel', e => {   // 컴퓨터: 휠로 확대, 축소 (트랙패드 두 손가락 벌리기는 ctrlKey 휠로 와요)
      if (rt.tab !== 'school' || rt.modalOpen || e.target.closest('.panel, .sheet, .modal, .q-card, #qCard, .map-right, .map-left, .board')) return;
      e.preventDefault();
      const k = e.ctrlKey ? 0.01 : 0.0015, dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      zoomAt((rt.zoom || 1) * Math.exp(-dy * k), e.clientX, e.clientY);
    }, { passive: false });
    fr.addEventListener('scroll', () => { if (fr.scrollLeft || fr.scrollTop) { fr.scrollLeft = 0; fr.scrollTop = 0; } });
    // 지도를 밀고 난 손가락이 떨어질 때 건물이나 도토리가 눌리지 않게 해요
    fr.addEventListener('click', e => { if (rt.panMoved && performance.now() - rt.panMoved < 350) { e.stopPropagation(); e.preventDefault(); } }, true);
    const ro = window.ResizeObserver ? new ResizeObserver(() => fitMap(false)) : null;
    if (ro) [fr, $('.board'), $('#qCard'), $('#qRow'), $('#subBar'), $('.map-right'), $('.tabs')].forEach(el => el && ro.observe(el));
    window.addEventListener('resize', () => fitMap(false));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => requestAnimationFrame(() => { fitMap(false); renderDeco(true); }));   // 글꼴이 늦게 와서 줄바꿈이 바뀌어도 다시 재요
    $('#qFold').addEventListener('click', () => {
      const r = $('#qRow'), f = !r.classList.contains('folded');
      r.classList.toggle('folded', f); $('#qCard').classList.toggle('q-folded', f); $('#qFold').setAttribute('aria-expanded', f ? 'false' : 'true');
      $('#qFold').setAttribute('aria-label', f ? '퀘스트 칸 펼치기' : '퀘스트 칸 접기');
      if (S && S.fold) { S.fold.q = f ? 1 : 0; save(); }
      sfx('tap'); requestAnimationFrame(hudVars);
    });
    $$('.ui-fold').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); const k = b.dataset.fold; if (!S || !S.fold) return; S.fold[k] = S.fold[k] ? 0 : 1; foldApply(); sfx('tap'); save(); }));
    foldApply();
  }
  // 홈 칸 접기: 학교 칸(b), 왼쪽 단추(l), 오른쪽 메뉴(r), 퀘스트 칸(q)
  const FOLD_EL = { b: ['.board', '학교 칸'], l: ['.map-left', '왼쪽 단추'], r: ['.map-right', '오른쪽 메뉴'] };
  function foldApply() {
    if (!S || !S.fold) return;
    for (const k of Object.keys(FOLD_EL)) {
      const el = $(FOLD_EL[k][0]), b = $('#fold' + k.toUpperCase()), f = !!S.fold[k]; if (!el || !b) continue;
      el.classList.toggle('folded', f); b.setAttribute('aria-expanded', f ? 'false' : 'true'); b.setAttribute('aria-label', `${FOLD_EL[k][1]} ${f ? '펼치기' : '접기'}`);
    }
    const q = $('#qRow'); if (q && q.classList.contains('folded') !== !!S.fold.q) { q.classList.toggle('folded', !!S.fold.q); $('#qCard').classList.toggle('q-folded', !!S.fold.q); $('#qFold').setAttribute('aria-expanded', S.fold.q ? 'false' : 'true'); }
    foldDots(); requestAnimationFrame(hudVars);
  }
  function foldDots() {   // 접은 칸 안에 알림 점이 있으면 접기 단추에 점
    for (const k of ['l', 'r']) { const el = $(FOLD_EL[k][0]), b = $('#fold' + k.toUpperCase()); if (!el || !b) continue;
      const on = !!S.fold[k] && [...el.querySelectorAll(':scope > :not(.ui-fold)')].some(c => !c.hidden && ([...c.querySelectorAll('.dot')].some(d => !d.hidden)));
      $('.dot', b).hidden = !on; }
  }
  function renderAffordance() {
    if (S && S.fold && rt.foldS !== S) { rt.foldS = S; foldApply(); } else foldDots();   // 불러온 저장마다 한 번
    for (const k of facKeys()) $('#pq-' + k).classList.toggle('can-buy', S.budget >= facNextCost(k));
    let any = false;
    for (const k of Object.keys(TEA)) if (!teaMaxed(k) && S.budget >= teaCost(k)) any = true;
    $('#tabDot').hidden = !any;
    // 탐험 단추 빨간 점: 아직 한 번도 안 열었거나, 보고서가 쌓였을 때(탐험 화면을 보는 동안은 끔). 시계가 아직 없으면 tamIdle을 부르지 않아요(첫 열기 전에 시계를 켜지 않게)
    const td = $('#tamDot'); if (td) td.hidden = !(tamOn() && rt.tab !== 'tam' && (!S.tam.seen || (S.tam.it && tamIdle().sec >= TAM.idleMin)));
    renderRec();
    if (rt.sheetKey) renderSheet();
    if (rt.tab === 'teachers') renderTeachers();
    checkQuests(false);
    renderQuestBar();
    renderSubBar();
    renderGuide();
    renderCampus();   // 구역 배지
    renderTeacherGuide();
    renderQuestPanel(false);
    updateQuestDot();
    renderBoostBtn();
    ffRender();   // 즉시 완공 칩(행사가 시작되면 바로 숨게)
    renderTripBtn();
    renderTr2Btn();
    renderSportsBtn();
    if (rt.tab === 'quests') renderMissions();
    setHid($('#btnAtt'), !attUnlocked());
    setHid($('#attDot'), !attUnlocked() || !canStamp());
    setHid($('#gDot'), rt.tab === 'grad' || !(canGraduate() || canPromote() || (S.p.ticket > 0 && growOn()) || Object.keys(PERKS).some(k => !perkMaxed(k) && S.p.dip >= perkCost(k)) || Object.keys(FPERKS).some(k => S.fund >= fpCost(k))));
    renderGradPanel(false);
  }

