  /* ===== 5.4.0 사진첩과 계절 사진 미션 BEGIN =====
     프로젝트 문서 '5.4.0 명세 (사진첩과 계절 사진 미션, 수집 완성 기록)'(2026-11-22 woodani 결정)
     - 사진 모드의 찰칵: 고른 시간과 날씨가 지금 실제와 같을 때만 찍혀요. 판정은 화면(wldPhase)이 아니라 실제 시각과 그날 날씨(wxOf)로 해요
       (사진 모드에서 고른 시간, 5.3.4 시간 흐름 단추 '늘 낮', 날씨 효과 끄기, 그래픽 낮음과 상관없이)
     - 미션 24장(언제나 8, 계절마다 4). 한 장으로 지금 맞는 미션을 모두 채워요. 맞는 미션이 없거나 다 찍었으면 자유 사진(30장까지)
     - 보상(안 A): 미션 사진 한 장에 숲의 정수 5, 계절 4장을 다 모으면 그 계절 액자와 지도 장식, 언제나 8장을 다 모으면 금빛 액자
     - 사진 그림은 저장하지 않아요. 찍은 순간의 학교급, 건물 레벨, 시간, 날씨만 적고 볼 때 졸업 앨범(albSchool)처럼 다시 그려요
     - 도감 창 '사진' 칸, 업적 칸 맨 위 '모은 것' 판(숲속 학교 완성도). 처음 세 메인 퀘스트 뒤에 열려요 */
  const PA = { ess: 5, frMax: 30 };
  const PA_SEA = { al: { nm: '언제나', fr: 'gold' }, spring: { nm: '봄', m: [3, 4, 5], fr: 'spring' }, summer: { nm: '여름', m: [6, 7, 8], fr: 'summer' }, autumn: { nm: '가을', m: [9, 10, 11], fr: 'autumn' }, winter: { nm: '겨울', m: [12, 1, 2], fr: 'winter' } };
  const PA_SEA_KEYS = ['al', 'spring', 'summer', 'autumn', 'winter'];
  const PA_FR = { plain: '기본', spring: '봄', summer: '여름', autumn: '가을', winter: '겨울', gold: '금빛' };
  const PA_DECO = { spring: '꽃 사진 게시판', summer: '삼각대 카메라', autumn: '낙엽 포토존', winter: '눈사람 포토존' };
  const paSea = m => PA_SEA_KEYS.find(k => PA_SEA[k].m && PA_SEA[k].m.includes(m)) || 'spring';
  const clr = s => s.wx === '';   // 맑음(안개, 비, 눈이 아닌 날)
  // 미션 표: cond는 paNow()의 상태 { ph 시간, wx 날씨, m 달, ev 이번 주 특별 이벤트 id, fest 행사 중, nb 야간 건설 공사 중, tier }. bug는 사진 위에 얹는 생물
  const PA_MS = [
    { id: 'al_morn', sea: 'al', name: '아침 햇살 교정', hint: '아침(6~9시), 맑은 날', cond: s => s.ph === 'morning' && clr(s) },
    { id: 'al_day', sea: 'al', name: '한낮의 운동장', hint: '낮(9~17시)', cond: s => s.ph === 'day' },
    { id: 'al_eve', sea: 'al', name: '노을 지는 학교', hint: '노을(17~20시), 맑은 날', cond: s => s.ph === 'evening' && clr(s) },
    { id: 'al_night', sea: 'al', name: '별이 뜬 밤', hint: '밤(20~6시), 맑은 날', cond: s => s.ph === 'night' && clr(s) },
    { id: 'al_fog', sea: 'al', name: '안개 낀 아침', hint: '안개 낀 날 아침', cond: s => s.ph === 'morning' && s.wx === 'fog' },
    { id: 'al_nb', sea: 'al', name: '밤에도 뚝딱뚝딱', hint: '밤 8~12시, 공사 중인 건물이 있을 때', cond: s => !!s.nb },
    { id: 'al_fest', sea: 'al', name: '학교 행사 한 장면', hint: '학교 행사나 운동회가 열리는 동안', cond: s => !!s.fest },
    { id: 'al_dorm', sea: 'al', name: '불 켜진 기숙사', hint: '고등학교부터, 밤', cond: s => s.tier >= 3 && s.ph === 'night' },
    { id: 'sp_rain', sea: 'spring', name: '봄비 내리는 교정', hint: '봄, 비 오는 날', cond: s => s.wx === 'rain' },
    { id: 'sp_bfly', sea: 'spring', name: '나비가 찾아온 날', hint: '봄, 맑은 날 아침이나 낮', cond: s => (s.ph === 'morning' || s.ph === 'day') && clr(s), bug: 'bfly' },
    { id: 'sp_new', sea: 'spring', name: '새 학기 첫 주', hint: "'새 학기 입학식' 이벤트 주", cond: s => s.ev === 'spring', any: 1 },
    { id: 'sp_ffly', sea: 'spring', name: '봄밤의 반딧불', hint: '봄, 맑은 날 노을이나 밤', cond: s => (s.ph === 'evening' || s.ph === 'night') && clr(s), bug: 'ffly' },
    { id: 'su_rain', sea: 'summer', name: '여름 소나기', hint: '여름, 비 오는 날', cond: s => s.wx === 'rain' },
    { id: 'su_ffly', sea: 'summer', name: '반딧불 여름밤', hint: '여름, 맑은 밤', cond: s => s.ph === 'night' && clr(s), bug: 'ffly' },
    { id: 'su_dfly', sea: 'summer', name: '잠자리 나는 한낮', hint: '7~8월, 맑은 낮', cond: s => s.m >= 7 && s.ph === 'day' && clr(s), bug: 'dfly' },
    { id: 'su_eve', sea: 'summer', name: '여름 노을', hint: '여름, 맑은 날 노을', cond: s => s.ph === 'evening' && clr(s) },
    { id: 'au_leaf', sea: 'autumn', name: '낙엽 날리는 오후', hint: '가을, 맑은 낮', cond: s => s.ph === 'day' && clr(s), bug: 'leaf' },
    { id: 'au_rain', sea: 'autumn', name: '가을비', hint: '가을, 비 오는 날', cond: s => s.wx === 'rain' },
    { id: 'au_dfly', sea: 'autumn', name: '가을 하늘 잠자리', hint: '9~10월, 맑은 날 아침이나 낮', cond: s => s.m <= 10 && (s.ph === 'morning' || s.ph === 'day') && clr(s), bug: 'dfly' },
    { id: 'au_fog', sea: 'autumn', name: '가을 안개', hint: '가을, 안개 낀 날', cond: s => s.wx === 'fog' },
    { id: 'wi_snow', sea: 'winter', name: '눈 내리는 교정', hint: '겨울(12~2월), 눈 오는 날', cond: s => s.wx === 'snow' },
    { id: 'wi_snight', sea: 'winter', name: '눈 오는 밤', hint: '겨울, 눈 오는 밤', cond: s => s.wx === 'snow' && s.ph === 'night' },
    { id: 'wi_xmas', sea: 'winter', name: '크리스마스 주간', hint: "'크리스마스 파티' 이벤트 주", cond: s => s.ev === 'xmas', any: 1 },
    { id: 'wi_ny', sea: 'winter', name: '새해 첫 아침', hint: "'새해 해돋이' 이벤트 주 아침", cond: s => s.ev === 'newyear' && s.ph === 'morning', any: 1 }
  ];
  const PA_BY = Object.fromEntries(PA_MS.map(x => [x.id, x]));
  const paOpen = () => !!S && !!S.pa && !!S.pa.on;
  const paCount = () => paOpen() ? PA_MS.filter(x => S.pa.ms[x.id]).length : 0;
  // 지금 실제 상태. 시험은 rt.paFake로 칸 몇 개를 덮어써요
  function paNow() {
    const t = gameNow(), h = kstHour(t), m = new Date(t + KST_MS).getUTCMonth() + 1;
    let ev = ''; try { const c = evCurrent(); ev = c && c.def && EV_SPECIAL.includes(c.def) ? c.def.id : ''; } catch (e) { /* 이벤트 없음 */ }
    let wx = ''; try { wx = wxOf() || ''; } catch (e) { /* 맑음 */ }
    const st = { ph: nightAt(t) ? 'night' : h < 9 ? 'morning' : h >= 17 ? 'evening' : 'day', wx, m, ev, fest: festBusy(),
      nb: S.tier >= NB.tier && !liveOff('night') && nbOnAt(t) && Object.keys(FAC).some(conOn), tier: S.tier };
    return rt.paFake ? Object.assign(st, rt.paFake) : st;
  }
  // 그 미션을 지금 찍을 수 있는지(계절 미션은 그 계절 달에만. 이벤트 주 미션은 그 주면 언제나)
  const paFit = (x, s) => (x.sea === 'al' || x.any || PA_SEA[x.sea].m.includes(s.m)) && !!x.cond(s);
  const paCan = s => PA_MS.filter(x => paFit(x, s || paNow())).map(x => x.id);
  const paTodo = s => paCan(s).filter(id => !S.pa.ms[id]);
  // 사진 모드 아래 줄에서 고를 수 있는 날씨('' 맑음, 비, 눈). 안개 낀 날은 '맑음' 칸이 실제예요
  const paVisWx = s => s.wx === 'rain' || s.wx === 'snow' ? s.wx : '';
  const paReal = () => { const s = paNow(); return rt.wldPh === s.ph && (rt.wldWx || '') === paVisWx(s); };
  // 빨간 점: 지금 찍을 수 있는데 아직 안 찍은 미션이 있고, 오늘 사진첩을 아직 안 열어 봤을 때만
  const paDot = () => paOpen() && S.pa.seen !== gameToday() && paTodo().length > 0;
  function freshPa() { return { on: 0, ms: {}, fr: [], own: ['plain'], seen: '', n: 0 }; }
  function paRecOk(r) { return !!r && typeof r === 'object' && Number.isFinite(r.at) && r.at > 0 && Number.isInteger(r.t) && r.t >= 0 && r.t < TIERS.length && ['morning', 'day', 'evening', 'night'].includes(r.ph); }
  function paRecClean(r, own) {
    const lv = o => { const z = {}; if (o && typeof o === 'object') for (const k of Object.keys(FAC)) { const v = o[k]; if (Number.isFinite(v) && v > 0) z[k] = Math.min(SAVE_CAP.lv, Math.floor(v)); } return z; };
    return { at: Math.floor(r.at), t: r.t, ph: r.ph, wx: ['rain', 'snow', 'fog'].includes(r.wx) ? r.wx : '', f: lv(r.f), bs: lv(r.bs), fx: own.includes(r.fx) ? r.fx : 'plain', ...(typeof r.id === 'string' && PA_BY[r.id] ? { id: r.id } : {}) };
  }
  // 저장 읽기: 모르는 미션과 망가진 기록은 버려요. 자유 사진은 30장까지(오래된 것부터 잘라요)
  function sanitizePa(d, s) {
    const P = d && d.pa && typeof d.pa === 'object' ? d.pa : null, f = freshPa();
    if (P) {
      f.on = P.on ? 1 : 0;
      f.own = ['plain', ...new Set((Array.isArray(P.own) ? P.own : []).filter(k => k !== 'plain' && PA_FR[k]))];
      if (P.ms && typeof P.ms === 'object') for (const id of Object.keys(P.ms)) if (PA_BY[id] && paRecOk(P.ms[id])) f.ms[id] = paRecClean(P.ms[id], f.own);
      f.fr = (Array.isArray(P.fr) ? P.fr : []).filter(paRecOk).slice(-PA.frMax).map(r => paRecClean(r, f.own));
      f.seen = typeof P.seen === 'string' ? P.seen.slice(0, 10) : '';
      f.n = Number.isFinite(P.n) && P.n > 0 ? Math.min(1e7, Math.floor(P.n)) : 0;
    }
    s.pa = f;
  }
  // 처음 세 메인 퀘스트 뒤에 열어요(이미 하던 사람은 바로). 1초마다
  function paSync() {
    if (!S || !S.pa) return;
    if (!S.pa.on && !earlyDay()) { S.pa.on = 1; save(); }
    const ds = $('#dsegPa'); if (ds && ds.hidden === paOpen()) ds.hidden = !paOpen();
    const pd = $('#paDot'); if (pd) { const on = paDot(); if (pd.hidden === on) pd.hidden = !on; }
    const sn = $('#phSnap'); if (sn) paSnapSync();
  }
  const paLv = o => { const z = {}; for (const k of Object.keys(FAC)) if (o && o[k] > 0) z[k] = Math.min(SAVE_CAP.lv, Math.floor(o[k])); return z; };   // 저장 읽기(paRecClean)와 같은 차례
  // 찰칵
  function paShot() {
    if (!paOpen() || !rt.photo) return false;
    if (!paReal()) { sfx('deny'); toast('지금 모습으로 돌아가면 찍을 수 있어요.\n점이 찍힌 시간과 날씨를 골라 보세요'); return false; }
    const s = paNow(), rec = { at: gameNow(), t: S.tier, ph: s.ph, wx: s.wx, f: paLv(S.f), bs: paLv(S.bs), fx: 'plain' };
    const nw = paTodo(s), got = [];
    S.pa.n = Math.min(1e7, S.pa.n + 1);
    sfx('shutter'); paFlash();
    if (nw.length) {
      for (const id of nw) S.pa.ms[id] = Object.assign({}, rec);
      addEss(PA.ess * nw.length);
      got.push(`사진첩에 붙였어요. 새 사진 ${nw.length}장(${nw.map(id => PA_BY[id].name).join(', ')}), 숲의 정수 +${PA.ess * nw.length}`);
      for (const k of PA_SEA_KEYS) {   // 묶음을 다 모으면 액자와 지도 장식(한 번만)
        const fr = PA_SEA[k].fr;
        if (S.pa.own.includes(fr) || !PA_MS.filter(x => x.sea === k).every(x => S.pa.ms[x.id])) continue;
        S.pa.own.push(fr);
        const dk = 'deco_pa_' + k; if (k !== 'al' && DECO_BY[dk]) S.deco.own[dk] = Math.max(1, S.deco.own[dk] || 0);
        got.push(k === 'al' ? '언제나 사진을 다 모았어요! 금빛 액자' : `${PA_SEA[k].nm} 사진을 다 모았어요! ${PA_FR[fr]} 액자와 지도 장식 ${PA_DECO[k]}`);
      }
    } else {
      const fr = Object.assign({}, rec), mid = paCan(s)[0]; if (mid) fr.id = mid;   // 이미 찍은 미션이면 그 이름을 붙여 둬요
      S.pa.fr.push(fr); if (S.pa.fr.length > PA.frMax) S.pa.fr.splice(0, S.pa.fr.length - PA.frMax);
      got.push('자유 사진으로 남겼어요');
    }
    toast(got.join('\n'));
    save(); try { achSync(false); } catch (e) { /* 다음 1초에 */ }
    if (rt.tab === 'dex' && rt.dexSeg === 'pa') paRender(true);
    paSync();
    return true;
  }
  function paFlash() {
    if (rt.reduced) return;
    const f = document.createElement('div'); f.className = 'pa-flash'; f.setAttribute('aria-hidden', 'true'); document.body.appendChild(f); setTimeout(() => f.remove(), 400);
  }
  // 사진 모드 아래 줄: 찰칵 단추는 실제와 같을 때만 진하게, 실제 시간과 날씨 칸에 작은 점
  function paSnapSync() {
    const b = $('#phSnap'); if (!b) return;
    const s = paNow(), ok = paReal();
    b.classList.toggle('off', !ok); b.setAttribute('aria-disabled', String(!ok));
    $$('#phT [data-pht]').forEach(x => x.classList.toggle('pa-real', x.dataset.pht === s.ph));
    $$('#phW [data-phw]').forEach(x => x.classList.toggle('pa-real', x.dataset.phw === paVisWx(s)));
  }
  const paDate = t => { const d = new Date(t + KST_MS); return `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCDate()).padStart(2, '0')}`; };
  // 사진 그림: 그때 학교 모습 + 시간 색 막 + 비나 눈 + 생물 하나 + 액자. 움직이지 않아요
  function paPic(r, id, big) {
    const x = id && PA_BY[id], bug = x && x.bug, fx = r.fx || 'plain', fu = IMG('pa_fr_' + fx);
    let sch = ''; try { sch = albSchool({ t: r.t, f: r.f, bs: r.bs }); } catch (e) { sch = ''; }
    const bu = bug === 'bfly' ? IMG('fx_bfly_y_1') : bug === 'dfly' ? IMG('fx_dfly_1') : bug === 'leaf' ? IMG('fx_leaf_1') : '';
    return `<span class="pa-pic${big ? ' big' : ''} fr-${fx}${fu ? ' has-fr' : ''}">${sch}<i class="pa-ph ph-${r.ph}${r.wx ? ' wx-' + r.wx : ''}"></i>` +
      (bu ? `<img class="pa-bug" src="${bu}" alt="">` : bug === 'ffly' ? '<i class="pa-ffly"></i>' : '') +
      (fu ? `<img class="pa-fr" src="${fu}" alt="">` : '') + '</span>';
  }
  const paCam = () => IMG('pa_cam') ? `<img class="pa-cam" src="${IMG('pa_cam')}" alt="">` : '<span class="pa-cam" aria-hidden="true">📷</span>';
  function paCell(x, s) {
    const r = S.pa.ms[x.id];
    if (r) return `<button class="pa-cell on" type="button" data-pa="${x.id}">${paPic(r, x.id)}<b>${esc(x.name)}</b><small>${paDate(r.at)}</small></button>`;
    const can = paFit(x, s);
    return `<button class="pa-cell off${can ? ' can' : ''}" type="button" data-pago="${x.id}"><span class="pa-pic empty">${paCam()}${can ? '<i class="pa-now">지금 찍을 수 있어요</i>' : ''}</span><b>${esc(x.name)}</b><small>${esc(x.hint)}</small></button>`;
  }
  function paRender(force) {
    const box = $('#paBody'); if (!box || !S || !S.pa) return;
    const s = paNow(), cur = paSea(s.m), n = paCount();
    setT($('#paHead'), `사진 미션 ${n} / ${PA_MS.length}장`);
    const key = [JSON.stringify(S.pa), s.ph, s.wx, s.m, s.ev, s.fest, s.nb, s.tier, rt.paBig || '', rt.paOpenSea || ''].join('|');
    if (!force && box.dataset.key === key) return; box.dataset.key = key;
    const grp = (k, open) => { const L = PA_MS.filter(x => x.sea === k), got = L.filter(x => S.pa.ms[x.id]).length, sea = PA_SEA[k];
      const head = `${sea.nm}${sea.m ? ` (${sea.m[0]}~${sea.m[2]}월)` : ''} <small>${got} / ${L.length}${S.pa.own.includes(sea.fr) ? `, ${PA_FR[sea.fr]} 액자 받음` : ''}</small>`;
      const body = `<div class="pa-grid">${L.map(x => paCell(x, s)).join('')}</div>`;
      return open ? `<section class="pa-grp"><h3>${head}${k === cur ? ' <i class="pa-tag">지금 계절</i>' : ''}</h3>${body}</section>`
        : `<details class="pa-grp" data-pasea="${k}"${rt.paOpenSea === k ? ' open' : ''}><summary><h3>${head}</h3></summary>${body}</details>`; };
    let h = grp(cur, true) + grp('al', true) + PA_SEA_KEYS.filter(k => k !== 'al' && k !== cur).map(k => grp(k, false)).join('');
    h += `<section class="pa-grp"><h3>자유 사진 <small>${S.pa.fr.length} / ${PA.frMax}</small></h3>` + (S.pa.fr.length ? `<div class="pa-grid">${S.pa.fr.map((r, i) => `<button class="pa-cell on" type="button" data-pafr="${i}">${paPic(r, r.id)}<b>${r.id ? esc(PA_BY[r.id].name) : '자유 사진'}</b><small>${paDate(r.at)}</small></button>`).slice().reverse().join('')}</div>` : '<p class="pa-none">미션에 맞지 않는 사진이나 이미 찍은 미션 사진은 여기에 남아요.</p>') + '</section>';
    box.innerHTML = h + paBigHTML();
  }
  // 크게 보기: 사진, 이름, 찍은 날, 그때 학교급, 액자 고르기, 자유 사진만 지우기
  function paBigHTML() {
    const k = rt.paBig; if (!k) return '';
    const fr = k.startsWith('fr:'), r = fr ? S.pa.fr[+k.slice(3)] : S.pa.ms[k]; if (!r) { rt.paBig = ''; return ''; }
    const id = fr ? r.id : k, nm = fr ? (r.id ? PA_BY[r.id].name : '자유 사진') : PA_BY[k].name;
    return `<div class="pa-big" role="dialog" aria-label="${esc(nm)}"><div class="pa-big-in">` + paPic(r, id, true) +
      `<b>${esc(nm)}</b><small>${paDate(r.at)}, ${TIERS[r.t].name}</small>` +
      `<div class="seg pa-frs" role="radiogroup" aria-label="액자">${Object.keys(PA_FR).filter(f => S.pa.own.includes(f)).map(f => `<button type="button" role="radio" data-pafx="${f}" aria-checked="${r.fx === f}">${PA_FR[f]}</button>`).join('')}</div>` +
      `<div class="btn-row">${fr ? '<button class="btn-sub" type="button" id="paDel">지우기</button>' : ''}<button class="cta" type="button" id="paBigX">닫기</button></div></div></div>`;
  }
  const paBigRec = () => { const k = rt.paBig || ''; return k.startsWith('fr:') ? S.pa.fr[+k.slice(3)] : S.pa.ms[k]; };
  function paGo() {   // 사진 찍으러 가기: 사진 모드를 열어요(실제 시간과 날씨가 골라져 있어요)
    if (!paOpen()) return;
    sfx('tap'); photoOpen();
  }
  document.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('#paPane button, #paPane summary, #phSnap'); if (!t || !S || !S.pa) return;
    if (t.id === 'phSnap') { paShot(); return; }
    if (t.id === 'paGo' || t.dataset.pago) { paGo(); return; }
    if (t.tagName === 'SUMMARY') { const d = t.parentNode; rt.paOpenSea = d.open ? '' : d.dataset.pasea; return; }
    if (t.dataset.pa || t.dataset.pafr != null) { sfx('tap'); rt.paBig = t.dataset.pa || 'fr:' + t.dataset.pafr; paRender(true); return; }
    if (t.id === 'paBigX') { sfx('tap'); rt.paBig = ''; paRender(true); return; }
    if (t.dataset.pafx) { const r = paBigRec(); if (r && S.pa.own.includes(t.dataset.pafx)) { r.fx = t.dataset.pafx; sfx('tap'); save(); paRender(true); } return; }
    if (t.id === 'paDel') { const k = rt.paBig || ''; if (k.startsWith('fr:')) { S.pa.fr.splice(+k.slice(3), 1); rt.paBig = ''; sfx('tap'); save(); paRender(true); } }
  });
  function paSegOpen() {   // 사진 칸을 열면 그날 빨간 점을 꺼요
    if (!paOpen()) return;
    if (S.pa.seen !== gameToday()) { S.pa.seen = gameToday(); save(); }
    paRender(true); paSync();
  }

  /* 모은 것 한눈에 보기(업적 칸 맨 위): 줄마다 n / 전체, 열리지 않은 것은 숨겨요. 별자리는 여기에 한 줄 더해요 */
  function paAllRows() {
    const L = [], add = (nm, n, max, open, go) => { if (open && max > 0) L.push({ nm, n: Math.min(n, max), max, go }); };
    const tr2N = () => TR2_PL.reduce((a, P) => a + P.souv.length, 0);
    const med = S.pp && Array.isArray(S.pp.med) ? new Set(S.pp.med.map(m => m[1])).size : 0;
    add('동물 친구', dexCount('all') + (S.rare ? S.rare.got.length : 0), DEX_KEYS.length + RARE.list.length, true, 'dex');
    add('간식', snCount(), SN_ALL.length, S.tier >= SN.tier || snCount() > 0, 'sn');
    add('생물', bxCount(), BIO.length, bxOpen() || bxCount() > 0, 'bx');
    add('사진 미션', paCount(), PA_MS.length, paOpen(), 'pa');
    { const E = DECO.filter(evDecoArt); add('한정 장식', E.filter(d => decoOwn(d.id)).length, E.length, E.length > 0, 'deco'); }
    add('체험학습 기념품', souvN(), SOUV_IDS.size, tripOpen() || souvN() > 0, '');
    add('수학여행 기념품', S.tr2 ? S.tr2.souv.length : 0, tr2N(), tr2Open() || (S.tr2 && S.tr2.souv.length > 0), '');
    add('대학 축제 기념품', S.fv && S.fv.own ? Object.keys(S.fv.own).filter(k => S.fv.own[k]).length : 0, Object.keys(FV_SV).length, S.tier >= 4, '');
    add('학회 메달', med, 3, ppOpen() || med > 0, '');
    add('업적 단계', ACH.reduce((a, x) => a + achGot(x.id), 0), ACH.length * ACH_N, true, '');
    add('칭호', achTitles().length, ACH.length + VD.titles.length + ST_TITLES.length + PP_TITLES.length, true, '');
    return L;
  }
  const paAllPct = L => L.length ? Math.floor(L.reduce((a, r) => a + r.n / r.max, 0) / L.length * 100) : 0;
  function paAllRender() {
    const box = $('#paAll'); if (!box || !S) return;
    let L; try { L = paAllRows(); } catch (e) { box.hidden = true; return; }
    const key = L.map(r => r.n).join(','); if (box.dataset.key === key) return; box.dataset.key = key;
    box.hidden = false;
    box.innerHTML = `<h3>모은 것 <small>숲속 학교 완성도 ${paAllPct(L)}%</small></h3>` + L.map(r => {
      const p = Math.floor(r.n / r.max * 100), tag = r.go ? `button type="button" data-allgo="${r.go}"` : 'div';
      return `<${tag} class="pa-all-row"><span>${esc(r.nm)}</span><span class="ach-bar"><i style="width:${p}%"></i></span><small>${fmt(r.n)} / ${fmt(r.max)}</small></${r.go ? 'button' : 'div'}>`;
    }).join('');
  }
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('#paAll [data-allgo]'); if (b) { sfx('tap'); setDexSeg(b.dataset.allgo); } });
  // 계절 사진 장식(가게에서 팔지 않아요). 그림(pad_*)이 오기 전에는 도감과 꾸미기에 보이지 않아요(evDecoArt)
  for (const k of ['spring', 'summer', 'autumn', 'winter']) DECO.push({ id: 'deco_pa_' + k, name: PA_DECO[k], ess: 0, img: 'pad_' + k, rare: 1, ev: 1, pa: `${PA_SEA[k].nm} 사진 미션 4장을 다 찍으면` });
  for (const d of DECO) if (d.pa) DECO_BY[d.id] = d;
  // 사진 업적(미션 사진 1, 6, 12, 18, 24장)
  ACH.push({ id: 'photo', name: '사진첩', goals: [1, 6, 12, 18, 24], title: '숲속 사진가', t: n => n >= PA_MS.length ? '사진 미션 모두 찍기' : `사진 미션 ${n}장 찍기`, v: () => paCount() });
  ACH_EM.photo = '📷';
  const PA_T = { PA, PA_MS, paNow, paCan, paTodo, paShot, paReal, paDot, paRender, paAllRows, paAllPct, paSync, sanitizePa, freshPa, paSegOpen, fake: o => { rt.paFake = o || null; }, get open() { return paOpen(); }, count: () => paCount() };
  /* ===== 사진첩 END ===== */
