  /* ---------- 5.3.3 상점 새 진열 (docs/SHOP-2026-11.md 5절 1, 2단계) ----------
     값, 효과, 하루 한도는 하나도 바꾸지 않고 모습과 차례만 바꿔요. 새 탭은 없어요.
     재화 줄(가게마다 위에), 가게 칩(가게 사이 바로 가기), 갈래 칩(가게 안 갈래로 내려가기), 오늘의 진열대(가게마다 권하는 품목 하나, 값은 가게와 같아요),
     이벤트 한정 장식은 도감의 '장식' 칸으로(가게에는 한 줄), 학교 간판과 마크, 이름 바꾸기는 설정으로 옮겼어요 */
  const tkSecAll = () => TK.reduce((a, t) => a + (S.tk[t.k] || 0) * t.sec, 0);
  function walletHTML() {
    const t = tkSecAll(), ti = IMG('ticket_m30');
    return `<span class="w-it" aria-label="황금 도토리 ${fmt(S.gold)}개">${GOLD_ICON}<b>${fmt(S.gold)}</b></span>` +
      `<span class="w-it" aria-label="숲의 정수 ${fmt(S.ess)}개">${ESS_ICON()}<b>${fmt(S.ess)}</b></span>` +
      (S.tier >= 1 ? `<span class="w-it" aria-label="시간 단축권 ${t ? hm(t) : '없음'}">${ti ? `<img src="${ti}" alt="">` : '⌛'}<b>${t ? hm(t) : '0분'}</b></span>` : '');   // 유치원은 공사가 5초라 단축권을 숨겨요
  }
  const SHOP_PANEL = { street: '#panelStreet', shop: '#panelShop', ess: '#panelEss', deco: '#panelDeco' }, SHOP_LIST = { shop: '#shopList', ess: '#essList', deco: '#decoList' };
  function shopChrome(tab) {
    const P = $(SHOP_PANEL[tab]); if (!P || !S) return;
    const w = P.querySelector('[data-wallet]'); if (w) setH(w, walletHTML());
    const c = P.querySelector('[data-cats]'), L = SHOP_LIST[tab] && $(SHOP_LIST[tab]);
    if (c && L) {
      const hs = [...L.querySelectorAll('[data-cat]')], key = hs.map(h => h.dataset.cat).join('|');
      if (c.dataset.key !== key) { c.dataset.key = key; c.innerHTML = hs.map((h, i) => `<button type="button" data-catgo="${i}">${h.dataset.cat}</button>`).join(''); }
      c.hidden = hs.length < 2;
    }
  }
  // 갈래 칩: 그 갈래 머리까지 내려가요(걸러 숨기지 않아서 품목은 모두 그대로 보여요)
  const scrollBox = el => { for (let p = el.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowY; if ((o === 'auto' || o === 'scroll') && p.scrollHeight > p.clientHeight) return p; } return document.scrollingElement; };
  function shopScrollTo(el, P) {
    const box = scrollBox(el), top = P && P.querySelector('[data-shoptop]'), off = (top ? top.getBoundingClientRect().height : 0) + 8;
    const y = box.scrollTop + el.getBoundingClientRect().top - box.getBoundingClientRect().top - off;
    box.scrollTo({ top: Math.max(0, y), behavior: rt.reduced ? 'auto' : 'smooth' });
  }
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-catgo]'); if (!b) return;
    const P = b.closest('.shop-panel'), L = P && P.querySelector('.shop-scroll'), h = L && L.querySelectorAll('[data-cat]')[+b.dataset.catgo]; if (!h) return;
    sfx('tap'); shopScrollTo(h, P);
  });
  // 모자란 양과 '내일 다시'(값 알약 아래 한 줄)
  const lackTx = (price, have) => have < price ? `<em class="lack">${fmt(price - have)} 모자라요</em>` : '';
  // 하나 더 살 때마다 값이 오르는 장식: 지금 값으로 산 뒤의 값(decoCost0과 같은 셈, 동아리 할인도 같게)
  function decoNext(id) {
    const d = DECO_BY[id]; if (!d || d.rare || d.ev) return 0;
    const n = decoOwn(id) + 1; if (n >= DECO_MAX) return 0;
    const c = Math.ceil(d.ess * Math.pow(DECO_GROW, Math.min(DECO_MAX, n)) / 5) * 5, off = typeof clubDecoOff === 'function' ? clubDecoOff() : 0;
    return off > 0 ? Math.max(1, Math.round(c * (1 - off / 100))) : c;
  }
  /* 오늘의 진열대: 가게마다 지금 살 수 있는 품목 가운데 하나를 날마다 골라 크게 보여요. 누르면 그 가게의 그 품목으로 가요(값과 사는 길은 가게와 같아요) */
  function shelfPicks() {
    const day = gameToday(), pick = (arr, k) => arr.length ? arr[dayHash(day + ':' + k) % arr.length] : null, out = [];
    { const c = [];
      for (const o of OUTFITS) if (!ofOwn(o)) c.push({ p: 'o:' + o.id, art: `<svg viewBox="-11 -13.5 22 27" aria-hidden="true">${kidSVG('bear', 0, { hat: o.hat, neck: o.neck })}</svg>`, line: '학생 옷 한 벌' });
      for (const t of THEMES) if (thCount(t.id) < TH_SLOTS.length) c.push({ p: 's:' + t.id, art: thArt(t, 'bg'), line: '지도, 지붕 색, 테마 곡 한 벌' });
      const it = pick(c, 'g'), si = it && shopItem(it.p);
      if (si) out.push({ shop: 'shop', go: it.p, art: it.art, name: si.name, line: it.line, price: si.price, cur: 'gold' }); }
    { const c = [];
      for (const k of AC.keys) if (acBkLeft(k) > 0) c.push({ p: 'book:' + k, name: `${AC.name[k]} 문제집`, price: bookCost(k), line: `${AC.name[k]} XP +${AC.book.xp}`, art: `<span class="tic" style="background-image:url('${IMG('ic_book')}')"></span>` });
      if (S.tier >= 1 && esTkLeft() > 0) for (const T of ESHOP.tk.list) c.push({ p: 'tk:' + T.k, name: `${tkName(T.k)} ${T.n}장`, price: T.ess, line: '공사와 체험학습 시간을 줄여요', art: IMG('ticket_' + T.k) ? `<img src="${IMG('ticket_' + T.k)}" alt="">` : '' });
      if (esBfLeft() > 0) c.push({ p: 'bf', name: `수업료 +100% ${ESHOP.boost.feast.min / 60}시간`, price: ESHOP.boost.feast.ess, line: '수업료가 두 배', art: BOOST_ART.feast });
      const it = pick(c, 'e'); if (it) out.push({ shop: 'ess', go: it.p, art: it.art, name: it.name, line: it.line, price: it.price, cur: 'ess' }); }
    { const c = DECO.filter(d => !d.ev && !decoSoldOut(d.id) && IMG(d.img));
      const d = pick(c, 'd'); if (d) out.push({ shop: 'deco', go: d.id, art: `<img src="${IMG(d.img)}" alt="">`, name: d.name, line: d.rare ? '희귀 장식, 하나만' : '지도에 놓는 장식', price: decoCost(d.id), cur: 'ess' }); }
    return out;
  }
  const SHOP_NM = { shop: '꾸미기 백화점', ess: '문방구', deco: '꾸미기 가게' };
  function renderShelf() {
    const box = $('#shelf'); if (!box) return;
    const ps = shelfPicks(), ic = { gold: GOLD_ICON, ess: ESS_ICON() };
    const key = ps.map(x => x.go + x.price + (x.cur === 'gold' ? S.gold >= x.price : S.ess >= x.price)).join('|');
    if (box.dataset.key === key) return; box.dataset.key = key;
    box.innerHTML = ps.length ? `<h3 class="shop-h shelf-h">오늘의 진열대 <small>날마다 바뀌어요. 값은 가게와 같아요</small></h3>` + ps.map(x => {
      const have = x.cur === 'gold' ? S.gold : S.ess, poor = have < x.price;
      return `<button class="big-card${poor ? ' poor' : ''}" type="button" data-shelf="${x.shop}|${x.go}"><span class="bc-pv">${x.art}</span><span class="bc-tx"><small>${SHOP_NM[x.shop]}</small><b>${x.name}</b><span>${x.line}</span></span>` +
        `<span class="bc-pr"><span class="pill">${ic[x.cur]}${fmt(x.price)}</span>${lackTx(x.price, have)}</span></button>`;
    }).join('') : '';
  }
  function shelfGo(v) {
    const [shop, go] = v.split('|'); sfx('tap'); setTab(shop);
    setTimeout(() => {
      if (shop === 'shop') pickShop(go); else if (shop === 'ess') pickEss(go); else pickDeco(go);
      const L = $(SHOP_LIST[shop]), el = L && L.querySelector(`[data-buy="${go}"], [data-ebuy="${go}"], [data-dbuy="${go}"]`);
      if (el) { shopScrollTo(el, $(SHOP_PANEL[shop])); el.classList.add('hl'); setTimeout(() => el.classList.remove('hl'), 1600); }
    }, 60);
  }
  // 다른 가게로 바로 가기(매점, 숲속 장터, 숲속 패스). 고유 시스템은 건물과 탭 안에 그대로 두고 길만 보여요
  function renderShopMore() {
    const box = $('#shopMore'); if (!box) return;
    const L = [];
    if (S.tier >= 2 && (S.f.store || 0) >= 1) L.push(['store', '매점', '간식 뽑기']);
    if (typeof mkOn === 'function' && mkOn()) L.push(['mk', '숲속 장터', '오늘 열려요']);
    if (typeof psOpen === 'function' && psOpen()) L.push(['ps', '숲속 패스', '시즌 미션 보상']);
    const h = L.length ? `<h3 class="shop-h">다른 가게</h3><div class="more-row">${L.map(([k, n, s]) => `<button type="button" class="more-go" data-more="${k}"><b>${n}</b><small>${s}</small></button>`).join('')}</div>` : '';
    if (box.dataset.h !== h) { box.dataset.h = h; box.innerHTML = h; }
  }
  document.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('[data-shelf], [data-more], [data-evdex], #optNick'); if (!t || !S || rt.paused) return;
    if (t.dataset.shelf) { shelfGo(t.dataset.shelf); return; }
    sfx('tap');
    if (t.dataset.more === 'store') { setTab('school'); setTimeout(() => openSheet('store'), 80); return; }
    if (t.dataset.more === 'mk') { openMk(); return; }
    if (t.dataset.more === 'ps') { setTab('event'); setEvSeg('ps'); return; }
    if (t.hasAttribute('data-evdex')) { setTab('dex'); setDexSeg('deco'); return; }
    if (t.id === 'optNick') { setTab('rank'); rt.rankEdit = true; renderRankPanel(); const i = $('#rankName'); if (i) i.focus(); }   // 예전 백화점 '이름 바꾸기'와 같은 길
  });
  /* 도감 '장식' 칸: 이벤트 한정 장식(가게에서 팔지 않고 이벤트 기념 상자, 패스, 진로 도감 같은 곳에서 받아요). 누르면 얻는 곳을 알려요(예전 가게와 같은 말) */
  const evDecoList = () => DECO.filter(evDecoArt);
  function decoDexRender() {
    const g = $('#decoDexGrid'); if (!g || !S) return;
    const L = evDecoList(), own = L.filter(d => decoOwn(d.id)).length;
    setT($('#decoDexHead'), `한정 장식 ${own} / ${L.length}`);
    const key = L.map(d => decoOwn(d.id) ? 1 : 0).join('');
    if (g.dataset.key === key) return; g.dataset.key = key;
    g.innerHTML = L.map(d => { const n = decoOwn(d.id);
      return `<button class="sn-card${n ? ' on' : ' off'}" type="button" data-dbuy="${d.id}"><img src="${IMG(d.img)}" alt="" draggable="false"><b>${d.name}</b><small>${n ? '가졌어요' : '아직 없어요'}</small></button>`; }).join('');
  }
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('#decoDexGrid [data-dbuy]'); if (b) pickDeco(b.dataset.dbuy); });
  // 설정의 학교 간판과 마크: 예전 꾸미기 가게 끝에서 하던 것과 같아요
  function setSchoolRender() {
    if (!S) return;
    const inp = $('#decoName'); if (inp && document.activeElement !== inp) inp.value = S.deco.nm;
    setT($('#decoTier'), tierInfo().name);
    if (!rt.mkDraft) rt.mkDraft = S.deco.mk ? S.deco.mk.slice() : [0, 0, 3, 2];
    renderMarkEdit();
    const np = nickPrice(); setT($('#optNickTx'), `랭킹에 보이는 이름을 바꿔요. ${np ? `바꿀 때 황금 도토리 ${np}개` : '처음 정할 때는 공짜예요'}`);
  }

  /* 큰 값 사기 전 확인 줄(10번 뽑기, 남은 만큼 기부). 단추 줄 바로 아래에 붙고, 취소하거나 고르면 사라져요 */
  function askRow(after, text, yes, fn) {
    askRowOff();
    const r = document.createElement('div'); r.className = 'ask-row'; r.id = 'askRow';
    r.innerHTML = `<p>${esc(text)}</p><div class="btn-row"><button class="btn-sub" type="button" data-ask="no">취소</button><button class="cta" type="button" data-ask="yes">${esc(yes)}</button></div>`;
    r.addEventListener('click', e => { const b = e.target.closest('[data-ask]'); if (!b) return; askRowOff(); if (b.dataset.ask === 'yes') fn(); else sfx('tap'); });
    after.insertAdjacentElement('afterend', r);
  }
  function askRowOff() { const r = $('#askRow'); if (r) r.remove(); }

  /* 이달의 꾸미기: 지금 달과 지난 달들(GMON.start부터). 한 줄 [{ g, kind, id, name, price, own, img }] */
  const gmNow = () => +gameToday().slice(5, 7);
  function gmPast() {
    const t = gameToday(), [y1, m1] = [+t.slice(0, 4), +t.slice(5, 7)], [y0, m0] = GMON.start.split('-').map(Number), out = [];
    for (let y = y0, m = m0; y < y1 || (y === y1 && m < m1); m === 12 ? (y++, m = 1) : m++) if (m !== m1 && !out.includes(m)) out.push(m);
    return out.slice(-11).reverse();   // 가까운 달부터
  }
  function gmItems(m) {
    const k = gmKey(m), [f, g, h] = GMON.nm[m - 1];
    return [{ g: `g:${k}:flag`, kind: 'flag', id: `deco_mon_${k}_flag`, name: f, price: GMON.flag, img: `deco_mon_${k}_flag` },
      { g: `g:${k}:gate`, kind: 'gate', id: `deco_mon_${k}_gate`, name: g, price: GMON.gate, img: `deco_mon_${k}_gate` },
      { g: `g:${k}:hat`, kind: 'hat', id: 'mon' + k, name: h, price: GMON.hat, img: 'cos_hat_mon' + k }]
      .map(x => Object.assign(x, { own: x.kind === 'hat' ? S.cos.own.includes('hat:' + x.id) : decoOwn(x.id) > 0 }));
  }
  function gmTiles(list, coin) {
    return list.map(x => { const on = x.kind === 'hat' && S.cos.hat === x.id, poor = !x.own && S.gold < x.price, im = IMG(x.img);
      return `<button class="si${x.own ? ' own' : ''}${on ? ' on' : ''}${poor ? ' poor' : ''}" type="button" data-buy="${x.g}" aria-pressed="${on}" aria-label="${x.name}${x.own ? '' : `, 황금 도토리 ${x.price}개`}">` +
        `<span class="pv${x.kind === 'hat' ? '' : ' deco'}">${im ? `<img src="${im}" alt="" draggable="false">` : ''}</span><span class="nm">${x.name}</span>` +
        `<span class="pr">${x.kind === 'hat' ? (on ? '쓰는 중' : x.own ? '쓰기' : `${coin}${x.price}`) : x.own ? '가졌어요' : `${coin}${x.price}`}</span>${x.own ? '' : lackTx(x.price, S.gold)}</button>`; }).join('');
  }
