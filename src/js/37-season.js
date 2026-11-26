  /* ===== 2.1.3 숲속 패스 BEGIN (프로젝트 문서 "시즌 설계안 (2.1.3)", woodani 확정 2026-10-30) =====
     4주마다 시즌. 오늘의 미션(하나에 PS.dP)과 이번 주 미션(하나에 PS.wP)을 받으면 패스 점수가 함께 들어와 30단계 트랙을 채워요. 무료, 광고는 '오늘 미션 점수 2배'만.
     패스만의 미션은 따로 고르지 않아요. 옛 저장에 남은 패스 미션은 받을 수 있는 것만 그날(그 주) 한 번 받아요
     시즌 번호는 2026-11-02(월)부터 4주마다 0, 1, 2 …(화면에는 +1). 시즌마다 한정 장식(20단계)과 한정 가구(30단계).
     정수와 소모품, 황금 도토리만 주고 도토리(학교 키우기 재화)는 주지 않아요 */
  const psSeason = day => { const d = dayDiff(PS.anchor, day || gameToday()); return d < 0 ? -1 : Math.floor(d / PS.len); };
  const psEnd = n => dayAdd(PS.anchor, n * PS.len + PS.len - 1);
  const psDef = n => { const x = PS_SEASONS[n] || ['', '', '', '', ''];   /* 표에 없으면 '시즌 N' 한 번만 */ return { theme: x[0], deco: x[1], decoNm: x[2], fur: x[3], furNm: x[4] }; };
  const psOpen = () => !!S && !!S.ps && S.tier >= PS.tier && psSeason() >= 0 && !liveOff('event');
  // 예전 패스 미션 표. 옛 저장에 남은 미션을 읽고 받는 데만 써요. d는 오늘 미션 목표, w는 이번 주 미션 목표
  const PS_M = {
    picks: { d: 30, name: n => `떨어진 도토리 ${n}개 줍기`, v: () => S.st.picks, ok: () => S.f.playground >= 1 },
    shakes: { d: 20, name: n => `참나무 ${n}번 흔들기`, v: () => S.st.shakes, ok: () => S.f.playground >= 1 },
    dm: { d: 2, w: 10, name: n => `오늘의 미션 ${n}개 끝내기`, v: () => S.st.dmDone },
    pz: { d: 1, w: 5, name: n => `숲속 퍼즐 ${n}판 끝내기`, v: () => S.st.pz || 0, ok: () => !liveOff('puzzle') },
    mg: { d: 2, w: 10, name: n => `숲속 합치기 주문 ${n}개 채우기`, v: () => (S.mg && S.mg.st && S.mg.st.orders) || 0, ok: () => !liveOff('merge') },
    rd: { d: 1, w: 6, name: n => `책 ${n}권 다 읽기`, v: () => S.rd.st || 0 },
    bt: { d: 1, w: 10, name: n => `숲속 대결 ${n}판 하기`, v: () => S.bt.st.w + S.bt.st.l, ok: () => btOpen() },
    sk: { d: 2, w: 10, name: n => `칭찬 스티커 ${n}장 받기`, v: () => S.sk.st.all, ok: () => skOpen() },
    fest: { d: 1, name: n => `학교 행사 ${n}번 열기`, v: () => S.st.sports + Object.values(S.fest.n).reduce((a, b) => a + b, 0), ok: () => FEST_IDS.some(festOpen) },
    lab: { w: 3, name: n => `과학 실험 ${n}번 하기`, v: () => S.lab.st.n, ok: () => labOpen() },
    out: { w: 3, name: n => `소풍이나 체험학습 ${n}번 보내기`, v: () => S.pc.st.n + S.st.trips },
    con: { w: 5, name: n => `시설 공사 ${n}번 하기`, v: () => S.st.cons || 0 },
    sn: { w: 5, name: n => `매점 간식 ${n}번 뽑기`, v: () => S.sn.n, ok: () => snOpen() },
    gd: { d: 2, w: 10, name: n => `텃밭 작물 ${n}번 거두기`, v: () => S.gn.st.h, ok: () => gdOpen() },
    bx: { d: 2, w: 8, name: n => `생물 ${n}번 관찰하기`, v: () => S.bx.st.n, ok: () => bxOpen() },
    cg: { d: 1, w: 5, name: n => `동아리 대항전 연습 ${n}번`, v: () => S.cg.st.p, ok: () => cgOpen() }
  };
  const psOk = id => { const M = PS_M[id]; try { return !!M && (!M.ok || M.ok()); } catch (e) { return false; } };
  const psVal = id => { try { return Math.floor(PS_M[id].v()) || 0; } catch (e) { return 0; } };
  const psProg = m => Math.max(0, Math.min(m.n, psVal(m.id) - m.b));
  const psReady = m => !m.done && psProg(m) >= m.n;
  const freshPs = () => ({ s: -1, pts: 0, got: 0, ex: 0, day: '', dl: [], wk: -1, wl: [], ad: '', tot: 0, fur: [], fsel: '', badge: 0, seen: -1 });
  function sanitizePs(d, s) {
    const P = d.ps && typeof d.ps === 'object' ? d.ps : {};
    const ml = a => (Array.isArray(a) ? a : []).filter(m => m && PS_M[m.id]).slice(0, 5).map(m => ({ id: m.id, n: Math.floor(numIn(m.n, 1, 1e6)), b: Math.floor(numIn(m.b, 0, 1e12)), done: m.done === true }));
    s.ps = { s: Math.floor(numIn(P.s, -1, 1e4)), pts: Math.floor(numIn(P.pts, 0, 1e7)), got: Math.floor(numIn(P.got, 0, 2 ** PS.steps - 1)), ex: Math.floor(numIn(P.ex, 0, 1e5)),
      day: typeof P.day === 'string' ? P.day.slice(0, 10) : '', dl: ml(P.dl), wk: Math.floor(numIn(P.wk, -1, 1e6)), wl: ml(P.wl), ad: typeof P.ad === 'string' ? P.ad.slice(0, 10) : '',
      tot: Math.floor(numIn(P.tot, 0, 1e6)), fur: (Array.isArray(P.fur) ? P.fur : []).filter(x => typeof x === 'string' && /^psf_\d{1,4}$/.test(x)).slice(0, 200),
      fsel: typeof P.fsel === 'string' && /^psf_\d{1,4}$/.test(P.fsel) ? P.fsel : '', badge: Math.floor(numIn(P.badge, 0, 1e4)), seen: Math.floor(numIn(P.seen, -1, 1e4)) };
    if (s.ps.fsel && !s.ps.fur.includes(s.ps.fsel)) s.ps.fsel = '';
  }
  const psLv = () => Math.min(PS.steps, Math.floor(S.ps.pts / PS.per));
  const psGot = i => !!(S.ps.got & (1 << (i - 1)));
  const psClaimable = () => psOpen() && (psStepReady() > 0 || psExtraReady() > 0 || S.ps.dl.some(psReady) || S.ps.wl.some(psReady));
  const psStepReady = () => { let c = 0; for (let i = 1; i <= psLv(); i++) if (!psGot(i)) c++; return c; };
  const psExtraReady = () => Math.max(0, Math.floor(Math.max(0, S.ps.pts - PS.steps * PS.per) / PS.extra) - S.ps.ex);
  // 단계 보상: 10, 20, 30은 큰 보상, 5, 15, 25는 작은 상자, 나머지는 돌아가며
  function psReward(i, n) {
    const D = psDef(n);
    if (i === 10) return { k: 'badge', g: 2, ic: 'pass_badge', t: '황금 도토리 2와 시즌 배지' };
    if (i === 20) return D.deco ? { k: 'deco', ic: D.deco, t: `한정 장식 '${D.decoNm}'` } : { k: 'gold', g: 2, ic: 'gold', t: '황금 도토리 2' };
    if (i === 30) return D.fur ? { k: 'fur', g: 3, ic: D.fur, t: `황금 도토리 3과 한정 가구 '${D.furNm}'` } : { k: 'gold', g: 5, ic: 'gold', t: '황금 도토리 5' };
    if (i % 5 === 0) return { k: 'chest', e: 15, tk: ['m30', 1], ic: 'pass_chest_small', t: '작은 상자: 숲의 정수 15와 30분 단축권 1장' };
    const c = [{ k: 'ess', e: 5, ic: 'ess', t: '숲의 정수 5' }, { k: 'tk', tk: ['m5', 3], ic: 'tk:m5', t: '5분 단축권 3장' }, { k: 'mge', mge: 20, ic: 'mge', t: '합치기 에너지 20' },
      { k: 'ess', e: 10, ic: 'ess', t: '숲의 정수 10' }, { k: 'book', ic: '📘', t: '문제집 1권(가장 낮은 과목)' }];
    return c[(i - 1 - Math.floor(i / 5)) % c.length];
  }
  function psGive(r, n) {
    const out = [];
    if (r.g) out.push(goldOr(r.g));
    if (r.e) { addEss(r.e); out.push({ ic: 'ess', t: `숲의 정수 +${r.e}` }); }
    if (r.tk && S.tk) { S.tk[r.tk[0]] += r.tk[1]; const im = IMG('ticket_' + r.tk[0]); out.push({ ic: im ? `<img src="${im}" alt="" style="width:22px;height:22px;object-fit:contain">` : '⏱', t: `${TK.find(x => x.k === r.tk[0]).name.replace('권', ' 단축권')} +${r.tk[1]}장` }); }
    if (r.mge) { mgAddEnergy(r.mge); out.push({ ic: 'mge', t: `합치기 에너지 +${r.mge}` }); }
    if (r.k === 'book') { const k = AC.keys.slice().sort((a, b) => acLv(a) - acLv(b))[0], v = acGain(k, AC.book.xp); out.push({ ic: '📘', t: `${AC.name[k]} XP +${v}` }); }
    if (r.k === 'badge') { S.ps.badge += 1; out.push({ ic: '🎖', t: `시즌 배지 (모두 ${S.ps.badge}개)` }); if (S.ps.badge === 1) out.push({ ic: '🏷', t: "칭호 '패스 새내기'" }); }
    if (r.k === 'deco') { const id = psDecoId(n); if (DECO_BY[id] && !decoOwn(id)) S.deco.own[id] = 1; out.push({ ic: '🎁', t: `${r.t} (꾸미기 모드에서 지도에 놓아요)` }); }
    if (r.k === 'fur') { const id = psFurId(n); if (!S.ps.fur.includes(id)) S.ps.fur.push(id); S.ps.fsel = id; out.push({ ic: '🪑', t: `한정 가구 '${psDef(n).furNm}' (교실에 놓였어요)` }); }
    return out;
  }
  // 받을 수 있는 단계를 모두 받아요. quiet면 창 없이 목록만 돌려줘요(지난 시즌 정리)
  function psClaimAll(quiet) {
    if (!S.ps || S.ps.s < 0) return [];
    const n = S.ps.s, items = [];
    for (let i = 1; i <= psLv(); i++) if (!psGot(i)) { S.ps.got |= (1 << (i - 1)); S.ps.tot += 1; items.push(...psGive(psReward(i, n), n)); }
    const ex = psExtraReady(); if (ex > 0) { S.ps.ex += ex; addEss(ex * PS.extraEss); items.push({ ic: 'ess', t: `덤 상자 ${ex}개: 숲의 정수 +${ex * PS.extraEss}` }); }
    if (!items.length) return items;
    save(); checkQuests(true);
    if (!quiet) { sfx('quest'); buzz(14); showReward({ title: '숲속 패스 보상을 받았어요!', sub: `시즌 ${n + 1}${psDef(n).theme ? ' ' + psDef(n).theme : ''}, ${psLv()}단계`, items: psMergeItems(items) }); renderPass(); renderHUD(); }
    return items;
  }
  // 같은 종류 보상은 한 줄로 합쳐요(여러 단계를 한꺼번에 받을 때 지저분하지 않게)
  function psMergeItems(items) {
    const sum = {}, rest = [];
    for (const it of items) { const m = /^(.*) \+(\d+)(장)?$/.exec(it.t); if (m && !/XP/.test(m[1])) { const k = m[1]; sum[k] = sum[k] || { ic: it.ic, n: 0, u: m[3] || '' }; sum[k].n += Number(m[2]); } else rest.push(it); }
    return Object.entries(sum).map(([k, v]) => ({ ic: v.ic, t: `${k} +${v.n}${v.u}` })).concat(rest);
  }
  // 날, 주, 시즌이 바뀌면 미션을 새로 골라요. 시즌이 바뀌면 지난 시즌에 받을 수 있었던 보상을 저절로 받아요
  function psSync() {
    if (!S || !S.ps) return;
    const n = psSeason();
    if (n !== S.ps.s) {
      const old = S.ps.s >= 0 ? psClaimAll(true) : [];
      if (old.length) showReward({ title: '지난 시즌 패스 보상', sub: `시즌 ${S.ps.s + 1}${psDef(S.ps.s).theme ? ' ' + psDef(S.ps.s).theme : ''}에서 받을 수 있었던 보상을 챙겨 왔어요`, items: psMergeItems(old) });
      Object.assign(S.ps, { s: n, pts: 0, got: 0, ex: 0, day: '', dl: [], wk: -1, wl: [], ad: '' });
    }
    if (!psOpen()) return;
    const t = gameToday(), w = gameWeek();
    if (dayRoll(S.ps, t)) S.ps.dl = [];
    if (S.ps.wk !== w) { S.ps.wk = w; S.ps.wl = []; }
  }
  // 오늘의 미션(d)이나 이번 주 미션(w)을 받을 때 패스 점수도 함께. 받은 양을 돌려줘요(패스가 닫혀 있으면 0)
  function psFromMission(kind) {
    if (!psOpen()) return 0;
    psSync();
    const p = kind === 'w' ? PS.wP : PS.dP * psDayMul();
    const lv0 = psLv(); S.ps.pts += p;
    if (psLv() > lv0) setTimeout(() => toast(`숲속 패스 ${psLv()}단계에 닿았어요`), 600);
    return p;
  }
  const psDayMul = () => S.ps.ad === gameToday() ? PS.adMul : 1;
  function psClaimMission(kind, i) {
    psSync();
    const L = kind === 'w' ? S.ps.wl : S.ps.dl, m = L[i];
    if (!m || !psReady(m)) return false;
    m.done = true;
    const p = kind === 'w' ? PS.wP : PS.dP * psDayMul();
    const lv0 = psLv(); S.ps.pts += p;
    sfx('coin'); buzz(8);
    if (rt.batch) { rt.batch.items.push({ ic: 'pass', t: `패스 점수 +${p}` }); rt.batch.n += 1; }
    toast(`패스 점수 +${p}` + (psLv() > lv0 ? `! ${psLv()}단계에 닿았어요` : ''));
    save(); renderPass(); checkQuests(true);
    return true;
  }
  function psWatchAd() {
    if (!psOpen() || S.ps.ad === gameToday()) return;
    showAd(() => {
      S.ps.ad = gameToday();
      const done = S.dm && S.dm.day === gameToday() ? S.dm.list.filter(m => m.done).length : 0, add = done * PS.dP * (PS.adMul - 1);
      if (add) S.ps.pts += add;
      toast(`오늘의 미션 패스 점수 +100%가 됐어요${add ? `! 이미 받은 미션도 +${add}` : ''}`);
      save(); renderPass();
    });
  }
  function psChooseFur(id) {
    if (id && !S.ps.fur.includes(id)) return;
    S.ps.fsel = id || ''; sfx('tap'); save(); renderPass();
    toast(id ? '교실에 시즌 가구를 놓았어요' : '교실에서 시즌 가구를 치웠어요');
  }
  // 교실 방에 놓는 시즌 가구(한 번에 하나)
  const PS_FUR_AT = [70, 198, 56];
  function psFurImg(k) {
    if (k !== 'classroom' || !S.ps || !S.ps.fsel) return '';
    const n = Number(S.ps.fsel.slice(4)), key = psDef(n).fur, u = key && IMG(key); if (!u) return '';
    const [x, y, w0] = PS_FUR_AT, s = furDepth(y), ww = w0 * s;
    return `<g class="fur-it fur-sp"><ellipse cx="${x}" cy="${(y - 1).toFixed(1)}" rx="${(ww * 0.42).toFixed(1)}" ry="${(2 + ww * 0.04).toFixed(1)}" class="fur-shadow"/>` +
      `<image href="${u}" x="${(x - ww / 2).toFixed(1)}" y="${(y - ww).toFixed(1)}" width="${ww.toFixed(1)}" height="${ww.toFixed(1)}"/></g>`;
  }
  const psIc = ic => ic === 'gold' ? GOLD_ICON : ic === 'ess' ? ESS_ICON() : ic.startsWith('tk:') ? (IMG('ticket_' + ic.slice(3)) ? `<img src="${IMG('ticket_' + ic.slice(3))}" alt="">` : '⏱') : RW_PIC[ic] && rwPic(RW_PIC[ic]) ? `<img src="${rwPic(RW_PIC[ic])}" alt="">` : IMG(ic) ? `<img src="${IMG(ic)}" alt="">` : esc(ic);   // 합치기 에너지(mge) 그림
  function renderPass() {
    const body = $('#psBody'); if (!body || !S || !S.ps) return;
    psSync();
    if (S.tier < PS.tier) { body.innerHTML = '<div class="ev-wait"><b>숲속 패스는 초등학교부터 열려요</b><p>초등학교에 입학하면 4주마다 새 시즌이 열려요.</p></div>'; return; }
    if (!psOpen()) { const d = dayDiff(gameToday(), PS.anchor); body.innerHTML = `<div class="ev-wait"><b>숲속 패스 준비 중</b><p>${d > 0 ? `첫 시즌은 ${dayText(PS.anchor)}에 열려요 (${d}일 뒤)` : '잠시 쉬어요'}</p></div>`; return; }
    const n = S.ps.s, D = psDef(n), lv = psLv(), left = dayDiff(gameToday(), psEnd(n)), mul = psDayMul();
    const key = [n, S.ps.pts, S.ps.got, S.ps.ex, S.ps.ad, gameToday(), S.ps.dl.map(m => psProg(m) + (m.done ? 'd' : '')).join(), S.ps.wl.map(m => psProg(m) + (m.done ? 'd' : '')).join(), S.ps.fsel, S.ps.fur.length].join('|');
    if (body.dataset.key === key) return; body.dataset.key = key;
    const nodes = [];
    for (let i = 1; i <= PS.steps; i++) {
      const r = psReward(i, n), got = psGot(i), open = i <= lv, big = i % 10 === 0;
      const bg = IMG(got ? 'pass_node_got' : open ? 'pass_node_open' : 'pass_node_lock');
      nodes.push(`<div class="ps-node${got ? ' got' : open ? ' open' : ''}${big ? ' big' : ''}" title="${i}단계: ${esc(r.t)}"><span class="ps-nb" style="${bg ? `background-image:url('${bg}')` : ''}"><i>${psIc(r.ic)}</i></span><small>${i}</small>${i === Math.max(1, lv) && lv > 0 && IMG('pass_flag') ? `<img class="ps-flag" src="${IMG('pass_flag')}" alt="">` : ''}</div>`);
    }
    const ready = psStepReady() + psExtraReady();
    const old = [...S.ps.dl.map((m, i) => [m, 'd', i]), ...S.ps.wl.map((m, i) => [m, 'w', i])].filter(([m]) => psReady(m));   // 옛 저장의 받을 수 있는 패스 미션
    const ms = (L, kind, p) => L.map((m, i) => { const pr = psProg(m), rd = psReady(m); return `<div class="dm${m.done ? ' done' : ''}"><div class="dm-tx"${goAt(m.id, !m.done && !rd)}><b>${esc(PS_M[m.id].name(m.n))} <em>+${p}점</em></b><div class="qbar"><i style="width:${(pr / m.n * 100).toFixed(0)}%"></i></div></div>` +
      (m.done ? `<span class="dm-ok">${CHECK}</span>` : rd ? `<button class="cta small" type="button" data-ps="${kind}${i}">받기</button>` : `<span class="dm-n">${pr}/${m.n}</span>`) + '</div>'; }).join('');
    const bg = IMG('pass_bg');
    const furs = S.ps.fur.filter(id => IMG(psDef(Number(id.slice(4))).fur));
    body.innerHTML = `<div class="ps-head${bg ? ' has-img' : ''}">${bg ? `<img src="${bg}" alt="">` : ''}<div class="ps-ttl"><b>숲속 패스</b><span>시즌 ${n + 1}${D.theme ? ' ' + esc(D.theme) : ''}</span><small>${left > 0 ? `${left}일 남음` : '오늘까지'}</small></div></div>` +
      `<div class="ps-lv"><span><b>${lv}</b>/${PS.steps}단계</span><span class="ps-bar"><i style="width:${(lv >= PS.steps ? 100 : (S.ps.pts % PS.per) / PS.per * 100).toFixed(0)}%"></i></span><span>${lv >= PS.steps ? `덤 상자까지 ${PS.extra - (S.ps.pts - PS.steps * PS.per) % PS.extra}점` : `다음 단계까지 ${PS.per - S.ps.pts % PS.per}점`}</span></div>` +
      `<div class="ps-track" id="psTrack">${nodes.join('')}</div>` +
      (ready ? `<button class="cta" type="button" data-ps="all">보상 받기 (${ready})</button>` : '') +
      `<p class="fine ps-big">20단계 한정 장식 <b>${esc(D.decoNm || '황금 도토리 2')}</b>, 30단계 한정 가구 <b>${esc(D.furNm || '황금 도토리 5')}</b>. 시즌이 끝나면 다시 얻을 수 없어요</p>` +
      `<p class="fine ps-how">오늘의 미션 하나에 패스 점수 +${PS.dP * mul}${mul > 1 ? '(광고 덕분에 두 배)' : ''}, 이번 주 미션 하나에 +${PS.wP}</p>` +
      (mul > 1 ? '' : `<button class="btn-sub ps-ad" type="button" data-ps="ad">광고 보고 오늘의 미션 패스 점수 +100%</button>`) +
      (old.length ? `<h4 class="dex-h">남은 패스 미션 <small>받을 수 있는 것만 남았어요</small></h4><div class="dms">${old.map(([m, k, i]) => ms([m], k, k === 'w' ? PS.wP : PS.dP * mul).replace(`data-ps="${k}0"`, `data-ps="${k}${i}"`)).join('')}</div>` : '') +
      (furs.length ? `<h4 class="dex-h">교실 시즌 가구 <small>하나를 골라 교실에 놓아요</small></h4><div class="ps-furs">${furs.map(id => `<button type="button" class="${S.ps.fsel === id ? 'on' : ''}" data-psf="${id}" aria-pressed="${S.ps.fsel === id}"><img src="${IMG(psDef(Number(id.slice(4))).fur)}" alt=""><small>${esc(psDef(Number(id.slice(4))).furNm)}</small></button>`).join('')}<button type="button" class="${S.ps.fsel ? '' : 'on'}" data-psf="">치우기</button></div>` : '');
    const tr = $('#psTrack'), cur = tr && tr.children[Math.max(0, lv - 2)]; if (tr && cur) tr.scrollLeft = cur.offsetLeft - 8;
  }
  VD.titles.push({ id: 'alma', title: '모교의 자랑', got: d => !!(d && d.ta && d.ta.mon >= 3) });   // 모교 기념비 3단계
  VD.titles.push({ id: 'biodoc', title: '숲속 박사', got: d => !!(d && d.bx && d.bx.g >= 5) });   // 생물 90종
  VD.titles.push({ id: 'bioall', title: '생물 도감 완성', got: d => !!(d && d.bx && d.bx.g >= 7) });   // 생물 150종
  VD.titles.push({ id: 'psnew', title: '패스 새내기', got: d => !!(d && d.ps && d.ps.badge >= 1) });   // 패스 10단계 첫 배지
  VD.titles.push({ id: 'seasonking', title: '숲속 시즌 왕', got: d => !!(d && d.rs && d.rs.king >= 1) }, { id: 'fourseason', title: '사계절 교장', got: d => !!(d && d.deco && d.deco.own && ['winter', 'spring', 'summer', 'autumn'].every(q => d.deco.own['rs_' + q])) });   // 랭킹 시즌
  /* ===== 숲속 패스 END ===== */
  /* ===== 반짝 친구 BEGIN (시즌 설계안 3절) =====
     종업식과 졸업식마다 5% 확률로 아직 못 만난 반짝 친구가 와요. 12번 연속 못 만나면 다음 번은 꼭
     woodani 당부: 털 색으로 친구를 부르거나 견주지 않아요. 반짝이는 까닭은 숲의 별빛을 받은 행운이고, 능력치와 수업료는 다른 친구와 똑같아요 */
  const RARE = { p: 0.05, pity: 12, walk: 0.2, roster: 0.1, gold: 1, list: [
    { sp: 'rabbit', name: '달빛 토끼', say: '안녕! 달님이 환하던 밤에 별빛 가루를 잔뜩 맞았더니 반짝반짝해졌어요.' },
    { sp: 'fox', name: '눈송이 여우', say: '첫눈 오는 날 숲길에서 별빛을 만났어요. 친구들이랑 눈싸움하고 싶어요!' },
    { sp: 'chick', name: '햇살 병아리', say: '아침 햇살 사이로 내려온 별빛을 받았어요. 노래 부르는 걸 제일 좋아해요!' },
    { sp: 'panda', name: '단풍 판다', need: 1, say: '단풍 숲에서 별빛을 만났어요. 대나무 간식을 넉넉히 가져왔으니 같이 먹어요!' },
    { sp: 'bear', name: '눈꽃 곰', say: '눈꽃이 피던 날 별빛이 살포시 내려왔어요. 따뜻한 꿀차를 좋아해요.' },
    { sp: 'dog', name: '별무늬 강아지', need: 1, say: '별빛이 콕콕 내려앉아 별무늬가 생겼어요. 같이 뛰어놀아요, 멍!' }] };
  const rareGot = sp => !!S && !!S.rare && S.rare.got.includes(sp);
  function rareRoll() {
    if (!S || !S.rare) return null;
    const cand = RARE.list.filter(x => !S.rare.got.includes(x.sp) && (!x.need || speciesList().includes(x.sp)) && FSI('chr_' + x.sp + '_rare'));
    if (!cand.length) return null;
    if (S.rare.miss < RARE.pity && Math.random() >= RARE.p) { S.rare.miss += 1; return null; }
    const x = cand[Math.floor(Math.random() * cand.length)];
    S.rare.got.push(x.sp); S.rare.miss = 0; addGold(RARE.gold);
    const k = rt.kids.find(z => z.sp === x.sp && !z.rare); if (k) { k.rare = true; k.g.innerHTML = kidSVG(x.sp + '_rare', k.bag); }   // 지도에 바로 한 명
    return x;
  }
  function showRareTalk(x) {
    const m = $('#mTalk'); if (!m || !x) return false;
    const w = x.sp + '_rare';
    rt.talkSeq = { n: { k: w, name: x.name, lab: `반짝 친구 ${x.name}` }, i: 0, lines: [
      { who: 'hedgehog', t: `교장 선생님, 숲의 별빛이 우리 학교에 내려앉았어요! 반짝이는 ${iga(x.name)} 놀러 왔어요.` },
      { who: w, t: x.say },
      { who: 'hedgehog', t: `${eun(x.name)} 별빛을 받은 반짝 친구예요. 다른 친구들과 똑같이 공부하고 뛰어놀아요. 동물 도감 반짝 친구 칸에 등록했고, 선물로 황금 도토리 ${RARE.gold}개를 받았어요!`, last: true }] };
    talkLine(); openModal(m);
    return true;
  }
  // 종업식, 졸업식에서 불러요(전학 대화 다음)
  function rareAfterCere() { const x = rareRoll(); if (x) { queueModal(() => showRareTalk(x)); save(); } }
  function rareDexHTML() {
    const n = S.rare.got.length;
    return `<h4 class="dex-h">반짝 친구 <small>${n} / ${RARE.list.length}</small></h4><p class="fine dex-rare-lead">종업식과 졸업식 때 아주 가끔 놀러 와요.</p><div class="dex-grid">` +
      RARE.list.map(x => { const on = rareGot(x.sp), im = FSI('chr_' + x.sp + '_rare'), bd = IMG('rare_badge');
        return `<div class="dex-card rare${on ? ' on' : ' off'}" aria-label="${on ? x.name : '아직 못 만난 반짝 친구'}"><span class="dex-pic">${on && im ? `<img src="${im}" alt="">` : pic7('dex_unknown')}</span>${on && bd ? `<img class="rare-bd" src="${bd}" alt="">` : ''}<b>${on ? x.name : '???'}</b><small>${on ? '등록' : '미등록'}</small></div>`; }).join('') + '</div>';
  }
  /* ===== 반짝 친구 END ===== */
  /* ===== 날씨 BEGIN (로드맵 9절 "언제든 넣을 수 있는 작은 것") =====
     게임 시계의 날마다 날씨가 정해져요(모두에게 같은 날씨). 맑음이 대부분이고 가끔 비, 눈(12~2월), 안개
     지도에 효과만 얹고, 그날 작은 보너스가 있어요. 수업료와 공사 같은 큰 균형은 건드리지 않아요
     비: 책 읽기 10분(원래 15분), 국어 XP +5. 눈: 떨어진 도토리 1.5배. 안개: 과학 실험 성공 XP +15 */
  const WX = { rain: { em: '🌧', name: '비', tip: '비 오는 날은 책 읽기 좋아요. 책 읽기 10분, 국어 XP +5' },
    snow: { em: '❄', name: '눈', tip: '눈 오는 날은 도토리가 반짝여요. 떨어진 도토리 +50%' },
    fog: { em: '🌫', name: '안개', tip: '안개 낀 날은 신비로운 실험 날이에요. 과학 실험 성공하면 XP +15' } };
  // 날마다 정해지는 날씨: 100 가운데 18은 비(겨울은 눈), 8은 안개, 나머지는 맑음
  function wxOf(day) {
    day = day || gameToday();
    if (liveOff('weather')) return '';
    const m = Number(day.slice(5, 7)), h = dayHash('wx:' + day) % 100;
    if (h < 18) return m === 12 || m <= 2 ? 'snow' : 'rain';
    if (h < 26) return 'fog';
    return '';
  }
  const wxIs = k => !!S && wxOf() === k;
  const rdMinNow = () => wxIs('rain') ? 10 : RD.min;
  function renderWeather() {
    const fx = $('#wxFx'), chip = $('#wxChip'); if (!fx || !chip || !S) return;
    const k = wxOf(), show = !!k && rt.tab === 'school' && rt.viewTier == null && !rt.decoEdit;
    if (fx.dataset.k !== k) {
      fx.dataset.k = k; fx.className = 'wx-fx' + (k ? ' wx-' + k : ''); fx.textContent = '';
      for (let i = 0; k === 'snow' && i < 34; i++) {   // 눈송이는 테마 낙엽처럼 하나씩 흩날려요
        const e = document.createElement('i');
        e.style.left = (Math.random() * 100).toFixed(1) + '%';
        e.style.setProperty('--dx', (Math.random() * 40 - 20).toFixed(0) + 'px');
        e.style.setProperty('--s', (3 + Math.random() * 4).toFixed(1) + 'px');
        e.style.animationDuration = (6 + Math.random() * 7).toFixed(1) + 's';
        e.style.animationDelay = (-Math.random() * 13).toFixed(1) + 's';
        fx.appendChild(e);
      }
    }
    fx.hidden = !k || rt.viewTier != null || !!S.wxOff;
    chip.classList.toggle('off', !!S.wxOff);
    if (chip.hidden !== !show) { chip.hidden = !show; wxPlace(); }   // 학교급 단추 옆에
    if (show && chip.dataset.k !== k) { chip.dataset.k = k; chip.innerHTML = `<span aria-hidden="true">${WX[k].em}</span>${WX[k].name} 오는 날`.replace('안개 오는 날', '안개 낀 날'); }
    // 그날 처음 홈을 볼 때 한 번 알려 줘요
    if (show && S.wx !== gameToday() && !rt.modalOpen) { S.wx = gameToday(); save(); setTimeout(() => toast(`${WX[k].em} 오늘은 ${k === 'fog' ? '안개가 꼈어요' : iga(WX[k].name) + ' 와요'}.\n${WX[k].tip}`), 600); }
  }
  // 날씨 칩 바로 위에 잠깐 뜨는 말풍선(알림 칸을 쓰지 않아요)
  function wxTipShow(main, sub) {
    const chip = $('#wxChip'); if (!chip || chip.hidden) return;
    let t = $('#wxTip'); if (!t) { t = document.createElement('div'); t.id = 'wxTip'; t.className = 'wx-tip'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.innerHTML = `<b></b><small></small>`; t.querySelector('b').textContent = main; t.querySelector('small').textContent = sub || '';
    const r = chip.getBoundingClientRect(); t.hidden = false;
    const w = Math.min(260, innerWidth - 16); t.style.width = w + 'px';
    t.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px';
    t.style.bottom = (innerHeight - r.top + 8) + 'px';
    t.classList.remove('on'); void t.offsetWidth; t.classList.add('on');
    clearTimeout(rt.wxTipT); rt.wxTipT = setTimeout(() => { t.classList.remove('on'); t.hidden = true; }, 3000);
  }
  /* ===== 날씨 END ===== */
  /* ===== 학부모 쪽지 이야기 BEGIN (로드맵 9절) =====
     까치 우체부가 게임 시계 한 주에 한 통씩 학부모 편지를 가져와요. 열두 통이 이어지는 짧은 이야기예요(그림 없이 글만)
     처음 받는 날에 첫 통, 그 뒤로 월요일마다 한 통. 읽으면 숲의 정수 2(작은 고마움). 다 읽은 편지는 설정 > 학부모 편지함에서 다시 봐요 */
  const PL = { ess: 2, list: [
    { from: '토끼 학생네 엄마', title: '처음 보내는 편지', txt: '교장 선생님, 안녕하세요.\n우리 아이가 숲속 학교에 다닌 지 한 달이 됐어요.\n처음에는 교문 앞에서 귀를 축 늘어뜨리고 울었는데, 요즘은 아침마다 먼저 가방을 메고 기다려요.\n고맙다는 말을 꼭 전하고 싶어서 까치 우체부에게 부탁했어요.' },
    { from: '여우 학생네 아빠', title: '책 읽는 소리', txt: '교장 선생님, 어젯밤 우리 집에 작은 소리가 들렸어요.\n아이가 도서관에서 빌린 그림책을 동생에게 읽어 주고 있더라고요.\n글자를 더듬더듬 읽다가 웃다가, 끝까지 다 읽었어요.\n학교에서 배운 걸 집에서 나누는 모습이 참 뿌듯했어요.' },
    { from: '너구리 학생네 할머니', title: '비 오는 날의 우산', txt: '교장 선생님, 지난번 비 오던 날 우리 손주가 우산을 두고 갔지요.\n그런데 병아리 친구가 자기 우산을 같이 썼다고 하더군요.\n둘 다 어깨가 흠뻑 젖어서 왔는데, 얼굴은 해님처럼 웃고 있었어요.\n좋은 친구를 만나게 해 주셔서 고맙습니다.' },
    { from: '곰 학생네 엄마', title: '생일 케이크', txt: '교장 선생님, 급식실에서 열어 주신 생일 잔치 이야기를 들었어요.\n우리 아이가 집에 와서 케이크 이야기를 열 번도 넘게 했답니다.\n친구들이 노래를 불러 줄 때 너무 좋아서 꼬리가 저절로 흔들렸대요.\n오래오래 기억할 하루가 됐어요.' },
    { from: '학부모 모임 대표 다람쥐', title: '작은 비밀 계획', txt: '교장 선생님께만 살짝 말씀드려요.\n학부모들이 모여서 학교에 작은 선물을 하기로 했어요.\n무엇인지는 아직 비밀이에요!\n다음 편지부터 조금씩 알려 드릴게요. 기대해 주세요.' },
    { from: '학부모 모임 대표 다람쥐', title: '도토리 모으기', txt: '교장 선생님, 비밀 계획 첫 단계는 도토리 모으기예요.\n아침마다 숲길에서 한 알씩 주워 커다란 항아리에 모으고 있어요.\n아이들이 눈치챌까 봐 항아리는 부엉이 선생님 댁 뒤에 숨겨 두었답니다.\n벌써 항아리 절반이 찼어요.' },
    { from: '병아리 학생네 아빠', title: '선생님 놀이', txt: '교장 선생님, 요즘 우리 아이가 집에서 선생님 놀이를 해요.\n인형들을 줄 세워 놓고 "숙제는 다 했나요?" 하고 묻는답니다.\n나중에 커서 숲속 학교 선생님이 되고 싶대요.\n학교가 아이에게 꿈을 하나 심어 주었어요.' },
    { from: '여우 학생네 아빠', title: '운동회 전날', txt: '교장 선생님, 내일이 운동회라 아이가 잠을 못 이루고 있어요.\n달리기에서 넘어지면 어쩌나 걱정이 많더라고요.\n"넘어져도 다시 일어나서 끝까지 달리면 그게 일등이야" 하고 말해 주었어요.\n내일 운동장에서 크게 응원할게요.' },
    { from: '학부모 모임 대표 다람쥐', title: '씨앗 고르기', txt: '교장 선생님, 비밀 계획 둘째 단계예요.\n모은 도토리를 숲속 시장에 가져가 꽃씨와 어린 나무로 바꾸었어요.\n해바라기, 코스모스, 그리고 작은 참나무 한 그루예요.\n이제 무엇을 하려는지 눈치채셨나요?' },
    { from: '너구리 학생네 할머니', title: '첫눈 오던 날', txt: '교장 선생님, 첫눈이 오던 날 아이들이 운동장에서 눈사람을 만들었다지요.\n우리 손주는 눈사람에게 자기 목도리를 둘러 주고 왔어요.\n목이 시렸을 텐데 "눈사람이 더 추워 보였어요" 하더군요.\n마음이 따뜻한 아이로 자라고 있어요.' },
    { from: '학부모 모임 대표 다람쥐', title: '숲속 꽃밭', txt: '교장 선생님, 드디어 비밀 계획을 말씀드려요!\n학부모들이 학교 뒤뜰에 작은 꽃밭을 만들었어요.\n한가운데에는 어린 참나무를 심고, 둘레에 아이들 이름표를 하나씩 꽂았어요.\n아이들이 졸업해도 이 나무는 학교에 남아 함께 자랄 거예요.' },
    { from: '숲속 학교 학부모 모두', title: '고맙습니다', txt: '교장 선생님, 열두 통의 편지를 끝까지 읽어 주셔서 고마워요.\n아이들이 웃으며 학교에 가는 아침이 저희에게는 가장 큰 선물이에요.\n꽃밭의 참나무가 자라는 만큼 아이들도 쑥쑥 자라겠지요.\n앞으로도 숲속 학교를 잘 부탁드려요. 늘 응원할게요!' }
  ] };
  // 받은 편지 수: 처음 열어 본 주에 첫 통, 그 뒤 주마다 한 통
  function plSync() {
    if (!S || !S.pl) return;
    const w = gameWeek();
    if (S.pl.got === 0) { S.pl.got = 1; S.pl.wk = w; return; }
    if (S.pl.got < PL.list.length && w > S.pl.wk) { S.pl.got = Math.min(PL.list.length, S.pl.got + 1); S.pl.wk = w; }
  }
  const plUnread = () => !!S && !!S.pl && S.pl.read < S.pl.got;
  function openPLetter(i, archive) {
    plSync();
    if (i == null) i = archive ? Math.max(0, S.pl.got - 1) : S.pl.read;
    if (i < 0 || i >= S.pl.got) { toast('아직 받은 편지가 없어요'); return; }
    const L = PL.list[i], m = $('#mLetter'), first = i >= S.pl.read && !archive;
    m.style.setProperty('--lt-l', IMG('bond_paper_light') ? `url("${IMG('bond_paper_light')}")` : 'none');
    m.style.setProperty('--lt-d', IMG('bond_paper_dark') ? `url("${IMG('bond_paper_dark')}")` : 'none');
    let gift = '';
    if (i >= S.pl.read) { S.pl.read = i + 1; addEss(PL.ess); gift = `\n\n(숲의 정수 +${PL.ess})`; save(); }
    $('#ltTitle').textContent = `${L.title}`;
    $('#ltText').innerHTML = esc(headText(`${L.txt}\n\n${L.from} 드림${gift}`)).replace(/\n/g, '<br>');
    rt.ltBack = true; rt.plAt = i;
    $('#ltNav').hidden = S.pl.got < 2;
    $('#ltPg').textContent = `${i + 1} / ${PL.list.length}`;
    $('#ltPrev').disabled = i <= 0; $('#ltNext').disabled = i >= S.pl.got - 1;
    $('#ltClose').textContent = '고마워요!';
    if (!m.hidden && rt.modalOpen === m) { sfx('tap'); return; }
    openModal(m); sfx(first ? 'quest' : 'tap');
  }
  function renderPLetter() {
    const chip = $('#plChip'); if (!chip || !S) return;
    plSync();
    const show = plUnread() && rt.tab === 'school' && rt.viewTier == null && !rt.decoEdit && !rt.fest && !rt.sports;
    chip.hidden = !show; chipRow();
    const sub = $('#plSub'); if (sub) sub.textContent = S.pl.got ? `받은 편지 ${S.pl.got}통${plUnread() ? ', 새 편지가 있어요' : ''}` : '까치 우체부가 학부모 편지를 가져와요';
  }
  /* ===== 학부모 쪽지 이야기 END ===== */


  /* ===== 랭킹 시즌과 다른 학교 구경 BEGIN (시즌 설계안 2, 4절) =====
     랭킹 시즌: 계절마다(겨울 12~2월, 봄 3~5월, 여름 6~8월, 가을 9~11월) 주간 리그 점수를 모아요. 2026 겨울이 시즌 1
     시즌 점수 300점이면 그 계절 기념 장식, 시즌 순위 1~3위는 칭호 '숲속 시즌 왕', 기념 장식 넷을 다 모으면 '사계절 교장'
     다른 학교 구경: 교장 선생님이 '내 학교 보여 주기'를 켠 학교만 서버(forest/look)에 학교 모습을 올려요. 처음에는 꺼져 있어요
     예시 학교: 게임 안에 들어 있는 예쁘게 꾸민 본보기 학교. 누가 봐도 예시인 걸 알게 이름과 띠에 늘 적어요 */
  const RS = { min: 300, startKey: 2027 * 4, look: 600000 };   // 2027*4 = 2026년 12월~2027년 2월 겨울
  const rsKeyOf = day => { const [y, m] = day.split('-').map(Number); return (m === 12 ? y + 1 : y) * 4 + (m === 12 || m <= 2 ? 0 : m <= 5 ? 1 : m <= 8 ? 2 : 3); };
  const rsNum = day => { const k = rsKeyOf(day || gameToday()); return k < RS.startKey ? 0 : k - RS.startKey + 1; };
  const rsQ = n => (RS.startKey + n - 1) % 4;
  const rsLabel = n => { const k = RS.startKey + n - 1, y = Math.floor(k / 4), q = k % 4; return q === 0 ? `${y - 1}~${String(y).slice(2)} 겨울 시즌` : `${y} ${RS_Q[q][1]} 시즌`; };
  const rsOn = () => !!S && !!S.rs && rsNum() >= 1;
  function rsAdd(p) { if (!rsOn()) return; rsSync(); S.rs.p += Math.round(p); }
  function rsSync() {
    if (!S || !S.rs) return;
    const n = rsNum();
    if (n === S.rs.n) return;
    const old = S.rs.n, items = [];
    if (old >= 1 && S.rs.p >= RS.min) {
      const id = 'rs_' + RS_Q[rsQ(old)][0];
      if (DECO_BY[id] && !decoOwn(id)) { S.deco.own[id] = 1; items.push({ ic: '🎁', t: `기념 장식 '${DECO_BY[id].name}'` }); }
      else items.push(goldOr(1, '(기념 장식은 이미 있어요)'));
    }
    if (old >= 1 && S.rs.pos >= 1 && S.rs.pos <= 3 && S.rs.p > 0) { S.rs.king += 1; items.push({ ic: '🏆', t: `시즌 순위 ${S.rs.pos}위! 칭호 '숲속 시즌 왕'` }); }
    if (items.length) showReward({ title: `${rsLabel(old)}이 끝났어요`, sub: `시즌 점수 ${fmt(S.rs.p)}점`, items });
    S.rs.n = n; S.rs.p = 0; S.rs.pos = 0;
  }
  const RS_Q = [['winter', '겨울', 'season_winter', '눈꽃 트로피'], ['spring', '봄', 'season_spring', '벚꽃 트로피'], ['summer', '여름', 'season_summer', '파도 분수 트로피'], ['autumn', '가을', 'season_autumn', '단풍 도토리 조각상']];
  // 다른 학교 구경에 올리는 내 학교 모습(4,000자 안)
  function lookDoc() {
    const gi = geoIdx(S.tier), f = {}, bs = {};
    for (const k of Object.keys(FAC)) if ((FAC[k].tier || 0) <= S.tier) { f[k] = Math.min(999, S.f[k] | 0); bs[k] = S.bs ? (S.bs[k] | 0) : S.tier; }
    const kids = (rosterOn() && S.roster.list.length ? S.roster.list.map(x => x.r ? x.sp + '_rare' : x.sp) : speciesList().map(sp => rareGot(sp) ? sp + '_rare' : sp)).slice(0, 8);
    return JSON.stringify({ v: 1, t: S.tier, y: yearNo(), nm: S.deco.nm || '', mk: S.deco.mk || null, ti: S.ach ? S.ach.title : '', f, bs, lay: S.deco.lay[gi].slice(0, 11), st: Math.floor(S.students), rare: S.rare.got.slice(), vd: S.vd.lv, kids });
  }
  // 남이 올린 글은 그대로 믿지 않고 모양을 확인해요
  function lookRead(raw) {
    let d = null; try { d = typeof raw === 'string' && raw.length <= 4000 ? JSON.parse(raw) : null; } catch (e) { d = null; }
    if (!d || typeof d !== 'object') return null;
    const t = Number.isInteger(d.t) && d.t >= 0 && d.t < Math.min(TIERS.length, GEO.length) ? d.t : 0, f = {}, bs = {};
    for (const k of Object.keys(FAC)) { f[k] = Math.max(0, Math.min(999, Math.floor(Number(d.f && d.f[k]) || 0))); bs[k] = Math.max(0, Math.min(9, Math.floor(Number(d.bs && d.bs[k]) || 0))); }
    const lay = Array.from({ length: DECO_SLOTS[geoIdx(t)].length }, (_, i) => { const id = Array.isArray(d.lay) ? d.lay[i] : ''; return typeof id === 'string' && DECO_BY[id] ? id : ''; });
    const okSp = sp => typeof sp === 'string' && (DEX_STUDENTS.includes(sp) || (sp.endsWith('_rare') && RARE.list.some(x => x.sp + '_rare' === sp)));
    return { t, y: Math.max(1, Math.min(9, Math.floor(Number(d.y) || 1))), nm: cleanSchoolNm(d.nm), mk: markOk(d.mk) ? d.mk : null, ti: typeof d.ti === 'string' && achTitleName(d.ti) ? d.ti : '', f, bs, lay,
      st: Math.max(0, Math.min(1e7, Math.floor(Number(d.st) || 0))), rare: (Array.isArray(d.rare) ? d.rare : []).filter(sp => RARE.list.some(x => x.sp === sp)).slice(0, 6),
      vd: Math.max(0, Math.min(9999, Math.floor(Number(d.vd) || 0))), kids: (Array.isArray(d.kids) ? d.kids : []).filter(okSp).slice(0, 8) };
  }
  // 예시 학교: 서버 없이 누구나 볼 수 있어요. 이름과 띠에 '예시'를 늘 적어요
  // 예시 학교는 고등학교, 누구나 고급 지도와 건물로 보여요(모델하우스). 레벨은 고등학교 상한 30, 학생은 교실 Lv.30 정원과 기숙사를 어림한 수(제안)
  const MODEL_SCHOOL = { model: true, who: '숲속 학교 예시', t: 3, y: 3, nm: '본보기', mk: [0, 0, 3, 2], ti: '',
    f: { classroom: 30, cafeteria: 30, library: 30, playground: 30, science: 30, store: 30, dorm: 30 }, bs: { classroom: 3, cafeteria: 3, library: 3, playground: 3, science: 3, store: 3, dorm: 3 },
    lay: ['fountain', 'flowerbed', 'arch', 'swingtree', 'pond', 'clock', 'crystal', 'streetlamp', 'bench', 'rainbow', 'owl'], st: 150, rare: ['rabbit', 'fox', 'chick'], vd: 8,
    kids: ['rabbit_rare', 'fox_rare', 'chick_rare', 'redpanda', 'capybara', 'kangaroo', 'panda', 'otter'] };
  // 모델하우스는 유, 초, 중, 고를 모두 볼 수 있게. 학교급마다 장식과 학생을 다르게 꾸며요(학생 수와 연차는 어림한 값)
  const MODEL_TIER = [
    { y: 1, st: 40, lay: ['flowerbed', 'swingtree', 'mushroom', 'pond', 'birdhouse', 'rainbow', 'picnic', 'bench', 'arch', 'owl', 'fountain'], kids: ['rabbit_rare', 'fox_rare', 'chick_rare', 'bear', 'raccoon', 'hamster', 'duck', 'frog'] },
    { y: 6, st: 80, lay: ['fountain', 'flowerbed', 'picnic', 'swingtree', 'pond', 'birdhouse', 'rainbow', 'bench', 'arch', 'statue', 'signpost'], kids: ['rabbit_rare', 'fox_rare', 'chick_rare', 'cat', 'dog', 'penguin', 'otter', 'turtle'] },
    { y: 3, st: 120, lay: ['statue', 'flowerbed', 'arch', 'streetlamp', 'pond', 'clock', 'crystal', 'bench', 'swingtree', 'fountain', 'owl'], kids: ['rabbit_rare', 'fox_rare', 'chick_rare', 'panda', 'koala', 'mole', 'waterdeer', 'cat'] },
    { y: MODEL_SCHOOL.y, st: MODEL_SCHOOL.st, lay: MODEL_SCHOOL.lay, kids: MODEL_SCHOOL.kids },
    // 대학교: 구역마다 꾸미기 6곳(zl). 대학교가 열렸을 때만 탭이 보여요. 학생 수는 어림한 값
    { y: 4, st: 200, lay: [], kids: ['rabbit_rare', 'fox_rare', 'chick_rare', 'meerkat', 'sloth', 'chinchilla', 'redpanda', 'capybara'],
      zl: { academic: ['statue', 'flowerbed', 'clock', 'streetlamp', 'bench', 'owl'], life: ['picnic', 'flowerbed', 'pond', 'streetlamp', 'bench', 'birdhouse'],
        plaza: ['fountain', 'arch', 'flowerbed', 'crystal', 'streetlamp', 'rainbow'], sports: ['signpost', 'bench', 'flowerbed', 'streetlamp', 'swingtree', 'statue'] } }];
  function modelOf(t) {
    t = Math.max(0, Math.min(4, Math.min(TIERS.length, GEO.length) - 1, t | 0)); const M = MODEL_TIER[t], f = {}, bs = {};
    for (const k of Object.keys(FAC)) { f[k] = (FAC[k].tier || 0) <= t ? (t >= 4 ? 35 : 30) : 0; bs[k] = t; }
    return Object.assign({}, MODEL_SCHOOL, { t, y: M.y, st: M.st, f, bs, lay: t >= 4 ? [] : M.lay.slice(0, DECO_SLOTS[geoIdx(t)].length), zl: M.zl || null, kids: M.kids });
  }
  /* 6: 공개를 끄면 서버의 forest/look/<id>를 지워요. 못 지웠으면 S.lk.del을 남겨(앱을 껐다 켜도) 랭킹이 다시 이어질 때 다시 지워요
     다른 기기의 옛 저장(공개 켬)이 다시 올리지 않게, 올린 적이 있는데(pub) 서버에 내 학교가 없으면 다른 곳에서 끈 것으로 보고 이 기기도 꺼요 */
  async function lookDelNow() {
    if (!S || !S.lk) return false;
    S.lk.del = true; S.lk.pub = false; S.lk.h = ''; save();
    if (Rank.state !== 'on' || !Rank.be || !Rank.be.lookDel || Rank.lookDeling) return false;
    Rank.lookDeling = true;
    try { await waitFor(Rank.be.lookDel(), CLOUD_WAIT); S.lk.del = false; save(); return true; }
    catch (e) { return false; }
    finally { Rank.lookDeling = false; renderRankPanel(); }
  }
  function lookRetry() { if (S && S.lk && S.lk.del && !S.lk.on) lookDelNow(); }
  async function lookPush(force) {
    if (S && S.lk && S.lk.del && !S.lk.on) { lookDelNow(); return; }
    if (!S || !S.lk || !S.lk.on || !S.rank.joined || Rank.state !== 'on' || Rank.readOnly || !Rank.be || !Rank.be.lookPut || S.u.dev || Cloud.deleting || Cloud.delLeft) return;
    const d = lookDoc();
    if (!force && (d === S.lk.h || Date.now() - (S.lk.at || 0) < RS.look)) return;
    if (!force && S.lk.pub && Rank.be.lookGet) {
      let v = null; try { v = await waitFor(Rank.be.lookGet(Rank.uid), CLOUD_WAIT); } catch (e) { return; }   // 못 읽으면 다음에
      if (!v) { S.lk.on = false; S.lk.pub = false; S.lk.h = ''; save(); renderRankPanel(); return; }   // 다른 기기나 랭킹 빼기, 계정 지우기로 꺼졌어요
    }
    try { await Rank.be.lookPut(d); S.lk.at = Date.now(); S.lk.h = d; S.lk.pub = true; S.lk.del = false; save(); }
    catch (e) { if (/permission/i.test(String((e && (e.code || e.message)) || ''))) Rank.noLook = true; }
  }
  async function lookSet(on) {
    S.lk.on = !!on; S.lk.h = ''; if (on) S.lk.del = false; save(); sfx('tap');
    if (on) { await lookPush(true); toast(Rank.noLook ? '서버가 아직 준비 중이라 지금은 올리지 못했어요. 준비되면 저절로 올라가요' : '랭킹에서 다른 교장 선생님이 내 학교를 구경할 수 있어요'); }
    else if (await lookDelNow()) toast('내 학교를 보여 주지 않아요');
    else toast('서버에서 아직 내 학교를 지우지 못했어요. 인터넷이 이어지면 다시 지울게요');
    renderRankPanel();
  }
  async function openLook(id, who) {
    if (!S) return;
    let data = null;
    if (id === 'model') data = modelOf(S.tier);   // 처음에는 지금 내 학교급으로 열어요
    else if (id === Rank.uid) data = Object.assign(lookRead(lookDoc()), { who: S.rank.name, me: true });
    else {
      if (!Rank.be || !Rank.be.lookGet) { toast('다른 학교 구경은 서버에 연결되면 할 수 있어요'); return; }
      try { const v = await Rank.be.lookGet(id); data = v && typeof v.d === 'string' ? lookRead(v.d) : null; } catch (e) { data = null; }
      if (!data) { toast('이 학교는 모습을 보여 주지 않아요'); return; }
      data.who = who || '교장 선생님';
    }
    sfx('tap'); setTab('school');
    if (rt.decoEdit) decoEditEnd();
    rt.lookData = data; rt.viewTier = data.t; rt.viewEdit = false;
    renderTierView(true); renderTierDots();
  }
  /* ===== 랭킹 시즌과 다른 학교 구경 END ===== */

  function renderEvent() {
    const body = $('#evBody');
    if (!body || !S) return;
    const day = gameToday(), cur = evCurrent(day);
    const key = [S.ev.cur, day, S.ev.stamp.n, S.ev.stamp.last, S.ev.list.map(m => `${evProg(m)}${m.done ? 'd' : ''}`).join(','), S.ev.box, S.tier, EV_SPECIAL.map(e => e.start + e.end).join('')].join('|');
    if (body.dataset.key === key) return;
    body.dataset.key = key;
    // 이벤트 예정: 매주 이벤트와 특별 이벤트를 섞어 다가오는 4개. 특별 이벤트는 금빛으로 강조
    const ups = evUpcoming(day, 4);
    const upcoming = ups.length ? `<h4 class="dex-h">이벤트 예정</h4><ul class="ev-up">${ups.map(c => {
      const sp = EV_SPECIAL.includes(c.def), d = dayDiff(day, c.start);
      return `<li class="${sp ? 'sp' : ''}"><span class="ev-up-nm">${sp ? '<em>특별</em>' : ''}${esc(c.def.name)}</span><span>${dayText(c.start)} ~ ${dayText(c.end)}<small>${d}일 뒤</small></span></li>`;
    }).join('')}</ul>` : '';
    if (!cur || S.ev.cur !== cur.key) {
      const nx = evNext(day);
      body.innerHTML = evSkipLine(day) + `<div class="ev-wait"><span class="wpic">${pic7('ev_wait', 'oak')}</span><b>지금은 이벤트가 없어요</b>` +
        (nx ? `<p>다음 이벤트는 <b>${esc(nx.def.name)}</b>${batchim(nx.def.name) ? '이에요' : '예요'}. ${dayText(nx.start)}에 열려요 (${dayDiff(day, nx.start)}일 뒤)</p>` : '<p>다음 이벤트를 준비하고 있어요</p>') + '</div>' + upcoming;
      return;
    }
    const left = dayDiff(day, cur.end), gi = `<svg viewBox="-8 -11 16 20" aria-hidden="true">${GOLD_ICON.slice(GOLD_ICON.indexOf('>') + 1, -6)}</svg>`;
    const stamps = EV_STAMPS.map((r, i) => {
      const on = i < S.ev.stamp.n, big = i === 4;
      return `<span class="ev-stamp${on ? ' on' : ''}${big ? ' big' : ''}"><span class="st">${pic7(on ? 'ev_stamp_on' : 'ev_stamp_off')}</span><small>${i + 1}일</small>${r.g && !goldRich() ? `<em>${gi}${r.g}</em>` : ''}</span>`;
    }).join('');
    const ready = evStampReady(), full = S.ev.stamp.n >= EV_STAMPS.length;
    const stampBtn = ready ? '<button class="cta small" type="button" data-ev="stamp">이벤트 도장 받기</button>' :
      `<button class="cta small" type="button" disabled>${full ? '도장을 다 모았어요' : '내일 또 만나요'}</button>`;
    const missions = S.ev.list.map((m, i) => {
      const p = evProg(m), rd = evReady(m);
      return `<div class="dm${m.done ? ' done' : ''}"><div class="dm-tx"${goAt(m.t, !m.done && !rd)}><b>${EV_MEASURE[m.t].name(m.n)}</b><div class="qbar"><i style="width:${(p / m.n * 100).toFixed(0)}%"></i></div></div>` +
        (m.done ? `<span class="dm-ok">${CHECK}</span>` : rd ? `<button class="cta small" type="button" data-ev="m${i}">받기</button>` : `<span class="dm-n">${p}/${m.n}</span>`) + '</div>';
    }).join('');
    const all = evAllDone();
    const evBoxDeco = () => { const dd = DECO_BY['ev_' + cur.def.id]; return !S.ev.box && dd && evDecoArt(dd) && !decoOwn(dd.id); };   // 처음 한 번 받는 한정 장식
    const box = `<div class="dm ev-box${S.ev.box ? ' done' : ''}"><span class="dex-pic">${pic7('ev_box', 'ic_fund')}</span><div class="dm-tx"><b>기념 상자</b><small>미션 3개를 다 하면 열려요</small>${rwChips([evBoxDeco() ? ['🎁', '한정 장식', 1] : null, ['gold', EV_BOX.g], ['ess', EV_BOX.e], ['dip', EV_BOX.dip], tkChip('box'), ['⚡', MG.E.box], ['🔑', 1]])}</div>` +
      (S.ev.box ? `<span class="dm-ok">${CHECK}</span>` : all ? '<button class="cta small" type="button" data-ev="box">열기</button>' : `<span class="dm-n">${S.ev.list.filter(m => m.done).length}/3</span>`) + '</div>';
    const u = IMG7(cur.def.banner) || (cur.def.fb ? IMG7(cur.def.fb) : '');   // 새 배너 그림이 오기 전에는 비슷한 배너를 빌려 써요
    body.innerHTML = `<div class="ev-banner ${cur.def.id}${u ? ' has-img' : ''}">${u ? `<img src="${u}" alt="">` : ''}<b>${esc(cur.def.name)}</b></div>` +
      `<div class="ev-period"><span>${dayText(cur.start)} ~ ${dayText(cur.end)}</span><span>${left > 0 ? `${left}일 남음` : '오늘까지'}</span></div>` +
      `<p class="lead">${esc(nl(cur.def.lead))}</p>` + evSkipLine(day) +
      `<h4 class="dex-h">이벤트 도장</h4><div class="ev-stamps">${stamps}</div>${stampBtn}` +
      `<h4 class="dex-h">이벤트 미션 <small>미션마다</small>${rwChips([['acorn', '도토리'], ['gold', 1], tkChip('evm')])}</h4><div class="dms">${missions}${box}</div>` + upcoming;
  }

