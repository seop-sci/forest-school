  /* ---------- 문방구(2.1.0, 옛 1.6.0 정수 상점) ----------
     값은 여기 한곳에서만 바꿔요 (속도와 경제 재설계안 3절, Fable 값). 숲의 정수는 작은 꾸미기와 소모품에 써요.
     정수로 도토리 묶음과 황금 도토리를 사던 것은 뺐어요(재화 역할이 섞여서). 도토리 → 정수 바꾸기는 넘치는 도토리 출구라 남겨요.
     한정 모자(hat)와 특별 가구(fur)는 꾸미기 가게에서 팔아요 */
  const ESHOP = {
    hat: 120, fur: 200,
    ex: { n: 10, min: 60, perDay: 5 },
    ax: { ess: 20, min: 30, perDay: 5 },   // 숲의 정수 20개로 도토리 수업료 30분치, 하루 5번. 위 ex의 거꾸로라 오가며 남는 게 없어요. 도토리 수업료 60분치로 숲의 정수 10개, 하루 5번(넘치는 도토리 쓸 곳). 거꾸로 바꿔도 남는 게 없어요(정수 20개 → 30분치)
    tk: { perDay: 5, list: [{ k: 'm5', n: 10, ess: 25 }, { k: 'm30', n: 1, ess: 15 }, { k: 'h1', n: 1, ess: 28 }, { k: 'h3', n: 1, ess: 70 }] },   // 시간 단축권, 네 가지 합쳐 하루 5번
    boost: { perDay: 3, feast: { ess: 12, min: 60 } },   // 수업료 부스터는 하루 3번
    night: 150   // 밤 모드(지도 밤 색과 창 불빛, 영구)
  };
  const ESS_ICON = () => `<span class="tic" style="background-image:${pzImg('ic_essence')}"></span>`;
  function esDay() {
    const t = gameToday(), w = gameWeek();
    if (dayRoll(S.es, t)) { S.es.n = 0; S.es.x = 0; S.es.t = 0; S.es.bf = 0; S.es.ba = 0; S.es.ax = 0; }
    if (w > S.es.week) { S.es.week = w; S.es.g = 0; }
  }
  const esExLeft = () => { esDay(); return Math.max(0, ESHOP.ex.perDay - S.es.x); };
  const esTkLeft = () => { esDay(); return Math.max(0, ESHOP.tk.perDay - S.es.t); };
  const esBfLeft = () => { esDay(); return Math.max(0, ESHOP.boost.perDay - S.es.bf); };
  const esExCost = () => Math.max(10, nice(rate() * 60 * ESHOP.ex.min));
  const esAxLeft = () => { esDay(); return Math.max(0, ESHOP.ax.perDay - (S.es.ax || 0)); };
  const esAxGain = () => Math.max(10, nice(rate() / (feastOn() ? 2 : 1) * 60 * ESHOP.ax.min));   // 정수로 받는 도토리. 수업료 부스터는 빼요(부스터를 켜고 바꾸면 두 배가 되지 않게). ex의 거꾸로라 오가며 남는 게 없어요
  const tkName = k => TK.find(x => x.k === k).name;
  function essItem(pick) {
    if (!pick) return null;
    const [t, id] = pick.split(':');
    if (t === 'hat') { const it = COS.hat.items.find(x => x.id === id && x.ess); return it ? { kind: 'hat', id, name: it.name, ga: eulOf(it.name), price: ESHOP.hat } : null; }
    if (t === 'sp' && SP_BY_ID[id]) return { kind: 'sp', id, k: SP_BY_ID[id].k, name: SP_BY_ID[id].name, ga: eulOf(SP_BY_ID[id].name), price: ESHOP.fur };
    if (t === 'book' && AC.keys.includes(id)) return { kind: 'book', k: id };
    if (t === 'tk') { const T = ESHOP.tk.list.find(x => x.k === id); if (!T) return null; const nm = `${tkName(id)} ${T.n}장`; return { kind: 'tk', T, name: nm, ga: eulOf(nm), price: T.ess }; }
    if (t === 'bf') { const nm = `수업료 +100% ${ESHOP.boost.feast.min / 60}시간`; return { kind: 'bf', name: nm, ga: eulOf(nm), price: ESHOP.boost.feast.ess }; }
    if (t === 'lunch') return { kind: 'lunch', name: '소풍 도시락', price: 0 };   // 소풍 창에서 싸요
    if (t === 'night') return { kind: 'night', name: '밤 모드', ga: '를', price: S.cos.own.includes(NIGHT_KEY) ? 0 : ESHOP.night };
    if (t === 'ax') { const g = esAxGain(), nm = `도토리 ${fmt(g)}`; return { kind: 'ax', gain: g, name: nm, ga: eulOf(nm), price: ESHOP.ax.ess }; }
    if (t === 'ex') { const nm = `숲의 정수 ${ESHOP.ex.n}개`; return { kind: 'ex', name: nm, ga: eulOf(nm), price: esExCost(), acorn: true }; }   // 값이 도토리예요
    return null;
  }
  function renderEssShop() {
    esDay();
    $('#essHave2').textContent = fmt(S.ess);
    const eb = $('#essBig'); if (IMG('essence_big')) eb.style.backgroundImage = pzImg('essence_big');
    const ic = ESS_ICON(), row = (pv, b, sp, sm, btn) => `<div class="sb"><span class="pv">${pv}</span><span class="tx"><b>${b}</b><span>${sp}</span>${sm ? `<small>${sm}</small>` : ''}</span>${btn}</div>`;
    const buy = (pick, price, off, lab) => `<span class="buyw"><button class="buy${S.ess < price ? ' poor' : ''}${off ? ' off' : ''}" type="button" data-ebuy="${pick}" aria-label="${lab}, 숲의 정수 ${price}개">${ic}${price}</button>${off ? '<em class="lack">내일 다시</em>' : lackTx(price, S.ess)}</span>`;   // 5.3.3 모자란 양과 '내일 다시'
    // 문제집
    let h = `<h3 class="shop-h" data-cat="공부">문제집 <small>과목마다 하루 ${AC.book.perDay}권</small></h3>`;
    for (const k of AC.keys) {
      const left = acBkLeft(k), c = bookCost(k);
      h += row(`<span class="tic" data-ic="ic_book" aria-hidden="true"></span>`, `${AC.name[k]} 문제집`, `${AC.name[k]} Lv.${acLv(k)}, XP +${AC.book.xp}`, left > 0 ? `오늘 ${left}권 남았어요` : '오늘은 다 샀어요. 내일 다시 열려요', buy('book:' + k, c, left <= 0, `${AC.name[k]} 문제집`));
    }
    // 시간 단축권
    if (S.tier >= 1) { const tl = esTkLeft();   // 5.3.3 유치원은 공사가 5초라 단축권을 숨겨요
      h += `<h3 class="shop-h" data-cat="시간">시간 단축권 <small>공사, 체험학습, 소풍, 책 읽기 시간을 줄여요. 하루 ${ESHOP.tk.perDay}번</small></h3>`;
      for (const T of ESHOP.tk.list) {
        const img = IMG('ticket_' + T.k);
        h += row(img ? `<img src="${img}" alt="" draggable="false">` : ic, `${tkName(T.k)} ${T.n}장`, `가진 ${tkName(T.k)} ${fmt(S.tk[T.k])}장`, '', buy('tk:' + T.k, T.ess, tl <= 0, `${tkName(T.k)} ${T.n}장`));
      }
      h += `<p class="shop-note">${tl > 0 ? `오늘 ${tl}번 더 살 수 있어요` : '오늘은 다 샀어요. 내일 다시 열려요'}</p>`; }
    // 부스터
    { const bf = esBfLeft(), fl = feastOn() ? Math.ceil((S.hd.feastUntil - gameNow()) / 60000) : 0;
      h += `<h3 class="shop-h" data-cat="도움">부스터 <small>종류마다 하루 ${ESHOP.boost.perDay}번</small></h3>`;
      h += row(BOOST_ART.feast, `수업료 +100% ${ESHOP.boost.feast.min / 60}시간`, fl ? `지금 ${hm(fl * 60)} 남았어요. 사면 더 늘어나요` : `${ESHOP.boost.feast.min / 60}시간 동안 수업료 +100%예요`, bf > 0 ? `오늘 ${bf}번 더 살 수 있어요` : '오늘은 다 샀어요', buy('bf', ESHOP.boost.feast.ess, bf <= 0, '수업료 +100%'));
      h += `<p class="shop-note">숲속 퍼즐과 숲속 합치기 부스터는 각 게임 화면에서 사요</p>`; }
    // 소풍 도시락(놀이터 소풍 창에서 보낼 때 싸요)
    if (S.pc && pcReady()) {
      const busy = pcActive(), done = !busy && S.pc.day === gameToday();
      h += `<h3 class="shop-h">소풍 도시락 <small>소풍 하루 한 번</small></h3>` +
        row(IMG('picnic_lunch') ? `<img src="${IMG('picnic_lunch')}" alt="" draggable="false">` : ic, `소풍 도시락 (정수 ${PCN.lunch})`, `주워 오는 도토리가 ${fmt(minAcorns(PCN.acorn))}에서 ${euro(fmt(minAcorns(PCN.lunchAcorn)))} 늘어요`, busy ? '지금 소풍을 가 있어요' : done ? '오늘 소풍은 다녀왔어요' : '소풍 보낼 때 함께 싸요',
          `<button class="buy${busy || done ? ' off' : ''}" type="button" data-ebuy="lunch">싸서 보내기</button>`);
    }
    // 밤 모드
    { const own = S.cos.own.includes(NIGHT_KEY), on = own && S.cos.night;
      h += `<h3 class="shop-h">밤 모드 <small>한 번 사면 계속</small></h3>`;
      h += row(`<svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M3 -8 A8.5 8.5 0 1 0 8 4 A7 7 0 1 1 3 -8 Z" fill="#F2C230"/></svg>`, '밤 모드', '지도가 밤 색이 되고 건물 창에 불이 켜져요', own ? '' : '',
        own ? `<button class="buy${on ? ' on' : ''}" type="button" data-ebuy="night" aria-pressed="${on}">${on ? '끄기' : '켜기'}</button>` : buy('night', ESHOP.night, false, '밤 모드')); }
    // 바꾸기
    h += '<h3 class="shop-h" data-cat="교환">교환 <small>(하루 5번씩)</small></h3>';
    { const xl = esExLeft(), xc = esExCost();
      h += `<div class="sb"><span class="pv">${ic}</span><span class="tx"><b>숲의 정수 ${ESHOP.ex.n}개</b><span>도토리를 내고 받아요</span><small>${xl > 0 ? `오늘 ${xl}번 더 바꿀 수 있어요` : '오늘은 다 바꿨어요. 내일 다시 열려요'}</small></span>` +
        `<button class="buy${S.budget < xc ? ' poor' : ''}${xl > 0 ? '' : ' off'}" type="button" data-ebuy="ex" aria-label="숲의 정수 ${ESHOP.ex.n}개, 도토리 ${fmt(xc)}"><span data-acorn>${acornIcon()}</span>${fmt(xc)}</button></div>`; }
    { const al = esAxLeft(), ag = esAxGain();   // 숲의 정수 → 도토리(탐험 대원 훈련에 쓸 도토리)
      h += row(`<span data-acorn>${acornIcon()}</span>`, `도토리 ${fmt(ag)}`, '숲의 정수를 내고 받아요', al > 0 ? `오늘 ${al}번 더 바꿀 수 있어요` : '오늘은 다 바꿨어요. 내일 다시 열려요', buy('ax', ESHOP.ax.ess, al <= 0, `도토리 ${fmt(ag)}`)); }
    const list = $('#essList'), top = list.scrollTop;
    list.innerHTML = h; list.scrollTop = top;
    $$('#essList [data-ic]').forEach(el => { const u = IMG(el.dataset.ic); if (u) el.style.backgroundImage = `url("${u}")`; });
    const ask = $('#essAsk'), it = essItem(rt.essPick);
    ask.hidden = !it || !it.price;
    if (it && it.price) {
      const enough = it.acorn ? S.budget >= it.price : S.ess >= it.price;
      $('#essAskText').textContent = it.kind === 'ax' ? (enough ? `도토리 +${fmt(it.gain)}, 숲의 정수 ${it.price}개로 바꿀까요?` : `숲의 정수가 ${it.price - S.ess}개 모자라요.`) : it.acorn ? (enough ? `도토리 ${fmt(it.price)}로 ${it.name}${it.ga} 바꿀까요?` : `도토리가 ${fmt(it.price - S.budget)} 모자라요.`)
        : enough ? (it.kind === 'night' ? `밤 모드는 낮에도 지도를 밤 모습으로 바꿔요. 고등학교에서는 20시부터 6시까지 저절로 어두워져요. 그래도 숲의 정수 ${it.price}개로 살까요?` : `${it.name}${it.ga} 숲의 정수 ${it.price}개로 살까요?`) : `숲의 정수가 ${it.price - S.ess}개 모자라요. 공부 탭에서 모을 수 있어요.`;   // 밤 모드 안내
      $('#essYes').textContent = it.acorn || it.kind === 'ax' ? (enough ? '바꾸기' : '닫기') : enough ? '사기' : '공부 가기';
    }    shopChrome('ess');
  }
  // 한정 모자와 특별 가구(꾸미기 가게): 산 것은 바로 입고 벗거나 놓고 치워요. 바꿨으면 true
  function essCosToggle(it) {
    if (it.kind === 'hat' && S.cos.own.includes('hat:' + it.id)) {
      S.cos.hat = S.cos.hat === it.id ? '' : it.id;
      applyCos(); save();
      toast(S.cos.hat === it.id ? `${it.name}${it.ga} 입혔어요` : `${it.name}${it.ga} 벗었어요`); return true;
    }
    if (it.kind === 'sp' && S.cos.own.includes('sp:' + it.id)) {
      S.cos.sp[it.k] = S.cos.sp[it.k] === it.id ? '' : it.id;
      save(); if (rt.sheetKey) renderSheet();
      toast(S.cos.sp[it.k] ? `${it.name}${it.ga} ${FAC[it.k].name}에 놓았어요` : `${it.name}${it.ga} 치웠어요`); return true;
    }
    return false;
  }
  function essCosBuy(it) {
    S.ess -= it.price; S.st.esSpent = (S.st.esSpent || 0) + it.price;
    if (it.kind === 'hat') { S.cos.own.push('hat:' + it.id); S.cos.hat = it.id; applyCos(); toast(`${it.name}${it.ga} 샀어요! 바로 입혀 뒀어요`); }
    else { S.cos.own.push('sp:' + it.id); S.cos.sp[it.k] = it.id; if (rt.sheetKey) renderSheet(); toast(`${it.name}${it.ga} 샀어요! ${FAC[it.k].name}에 놓았어요`); }
    sfx('quest'); buzz(15);
  }
  function pickEss(pick) {
    const it = essItem(pick); if (!it) return;
    sfx('tap');
    if (it.kind === 'book') { rt.essPick = ''; openBook(it.k); return; }
    if (it.kind === 'lunch') { rt.essPick = ''; openPicnic(); if (rt.modalOpen === $('#mPicnic') && S.ess >= PCN.lunch) { rt.pcLunch = true; renderPicnic(); } return; }   // 문제집은 공부 탭과 같은 확인창으로
    if (it.kind === 'night' && !it.price) {
      S.cos.night = !S.cos.night; rt.essPick = '';
      renderNight(true); save(); renderEssShop();
      toast(S.cos.night ? '밤 모드를 켰어요' : '밤 모드를 껐어요'); return;
    }
    if (it.kind === 'ax' && esAxLeft() <= 0) { toast(`도토리 바꾸기는 하루 ${ESHOP.ax.perDay}번까지예요. 내일 다시 바꿀 수 있어요`); return; }
    if (it.kind === 'ex' && esExLeft() <= 0) { toast(`숲의 정수 바꾸기는 하루 ${ESHOP.ex.perDay}번까지예요. 내일 다시 바꿀 수 있어요`); return; }
    if (it.kind === 'tk' && esTkLeft() <= 0) { toast(`시간 단축권은 하루 ${ESHOP.tk.perDay}번까지 살 수 있어요. 내일 다시 열려요`); return; }
    if (it.kind === 'bf' && esBfLeft() <= 0) { toast(`수업료 +100%는 하루 ${ESHOP.boost.perDay}번까지예요. 내일 다시 살 수 있어요`); return; }
    rt.essPick = pick;
    if (it.price && it.kind !== 'night' && (it.acorn ? S.budget >= it.price : S.ess >= it.price)) { buyEss(); return; }   // 5.3.3 바로 사요. 모자라면 아래 줄이 길을 알려 줘요
    renderEssShop();
  }
  function buyEss() {
    const it = essItem(rt.essPick); if (!it || !it.price) { rt.essPick = ''; renderEssShop(); return; }
    if (it.kind === 'ex') {   // 도토리 → 숲의 정수
      rt.essPick = '';
      if (S.budget < it.price || esExLeft() <= 0) { renderEssShop(); return; }
      S.budget -= it.price; S.es.x += 1; addEss(ESHOP.ex.n);
      toast(`도토리 ${fmt(it.price)}로 숲의 정수 ${ESHOP.ex.n}개를 받았어요!`); sfx('quest'); buzz(15);
      save(); renderEss(); renderEssShop(); renderHUD(); renderAffordance(); return;
    }
    if (it.kind === 'ax' && S.ess < it.price) { rt.essPick = ''; renderEssShop(); return; }   // '닫기'
    if (S.ess < it.price) { rt.essPick = ''; setTab('mini'); return; }
    if ((it.kind === 'tk' && esTkLeft() <= 0) || (it.kind === 'bf' && esBfLeft() <= 0) || (it.kind === 'ax' && esAxLeft() <= 0)) { rt.essPick = ''; renderEssShop(); return; }
    S.ess -= it.price; S.st.esSpent = (S.st.esSpent || 0) + it.price;
    rt.essPick = '';
    if (it.kind === 'ax') { const g = esAxGain(); S.budget += g; S.es.ax = (S.es.ax || 0) + 1; toast(`도토리 +${fmt(g)}!\n숲의 정수 ${it.price}개로 바꿨어요`); }   // 수료증 셈(올해 번 도토리)에는 넣지 않아요
    else if (it.kind === 'tk') { S.tk[it.T.k] += it.T.n; S.es.t += 1; toast(`${it.name}${it.ga} 샀어요! 공사나 체험학습, 소풍, 책 읽기에 쓸 수 있어요`); }
    else if (it.kind === 'bf') { S.hd.feastUntil = Math.max(gameNow(), S.hd.feastUntil) + ESHOP.boost.feast.min * 60000; S.es.bf += 1; toast(`${ESHOP.boost.feast.min / 60}시간 동안 수업료 +100%예요!`); }
    else if (it.kind === 'night') { S.cos.own.push(NIGHT_KEY); S.cos.night = true; renderNight(true); toast('밤 모드를 샀어요! 문방구에서 켜고 끌 수 있어요'); }
    sfx('quest'); buzz(15);
    save(); renderEss(); renderEssShop(); renderShopBtn(); renderHUD(); renderAffordance(); renderDeal();
  }
  // 밤 모드: 지도에 밤 색을 덮고 지은 건물 창에 불빛을 켜요(이름표는 위에 그대로)
  function renderNight(force) {
    const g = $('#nightG'); if (!g || !S) return;
    const bought = !!(S.cos && S.cos.night && S.cos.own.includes(NIGHT_KEY));
    const hsN = S.tier >= NSL.tier && geoIdx() >= 3 && rt.viewTier == null && isNight();   // 대학교 구역과 캠퍼스 지도도 밤이 와요
    // 고등학교부터 밤(20~6시)이면 저절로(A안)
    const on = bought || hsN, look = hsN ? (S.nl || 0) : 0;   // 고등학교 밤 모습(0 밤, 1 저녁, 2 밝게)
    map.classList.toggle('hs-night', hsN);
    map.classList.toggle('nl-light', hsN && look === 2);
    // 창문 불빛 조각(작업지시서 42): 건물 그림마다 glow_ 조각이 있으면 같은 자리에 겹치고, 없으면 예전처럼 둥근 빛
    const gk = k => seasonKey(bldImg(k)).replace(/^bld_/, 'glow_').replace(/^glow_dorm_on/, 'glow_dorm');   // 기숙사 불빛은 glow_dorm(_winter)
    // 공사 중(비계)인 건물에는 창문 불빛을 켜지 않아요. 밝게 보기에서는 불빛과 밤하늘 없이 학생만 기숙사에
    const ks = on && look < 2 ? Object.keys(FAC).filter(k => S.f[k] >= 1 && !conOn(k) && bpos(k) && geo().lot[k] && (k !== 'playground' || IMG(gk(k)))) : [];
    const key = on ? geoIdx() + '|' + hsN + '|' + look + '|' + (hsN && S.f.dorm >= 1) + '|' + ks.map(k => k + ':' + gk(k)).join() : '';
    if (!force && g.dataset.key === key) return;
    g.dataset.key = key;
    if (!on) { g.innerHTML = ''; return; }
    g.innerHTML = '<defs><radialGradient id="nmGlow"><stop offset="0" stop-color="#FFE29A" stop-opacity=".95"/><stop offset=".55" stop-color="#FFD36B" stop-opacity=".35"/><stop offset="1" stop-color="#FFD36B" stop-opacity="0"/></radialGradient></defs>' +
      (hsN ? nsSleepers() : '') +
      (look === 2 ? '' : `<rect x="-300" y="-300" width="960" height="1020" fill="#141C3E" opacity="${look === 1 ? '.24' : '.46'}"/>`) +   // multiply는 지도 그림(svg 밖)과 섞이지 않아 거의 안 어두워져서 그냥 덮어요
      '<g class="nb-src">' + (look < 2 && geoIdx() >= 3 && IMG('night_sky') ? `<image href="${IMG('night_sky')}" x="0" y="${MAP_Y}" width="${MAP_W}" height="${MAP_H}" preserveAspectRatio="none"/>` : '') +   // 달, 별, 반딧불(고등학교 지도만)
      ks.map(k => { const gi = IMG(gk(k)); if (gi) { const R = lotRect(geo().lot[k], seasonKey(bldImg(k))), [bx, by, bw] = R; return `<image href="${gi}" x="${(bx - bw / 2).toFixed(1)}" y="${(by - bw / 2).toFixed(1)}" width="${bw.toFixed(1)}" height="${bw.toFixed(1)}"${xfAt(R)}/>`; }
        const [cx, cy, w] = bpos(k); return `<ellipse cx="${cx.toFixed(1)}" cy="${(cy - w * 0.3).toFixed(1)}" rx="${(w * 0.42).toFixed(1)}" ry="${(w * 0.3).toFixed(1)}" fill="url(#nmGlow)" style="mix-blend-mode:screen"/>`; }).join('') + '</g>';
    nightBake(g, key);
  }
  /* 밤하늘과 건물 불빛 조각(큰 그림 여러 장)이 지도 안에 겹쳐 있어서, 조금만 움직여도 휴대폰이 전부 다시 칠했어요
     처음 한 번 캔버스에 합쳐 그림 한 장으로 바꿔 끼워요. 합치는 동안과 실패하면 예전 그림들을 그대로 써요 */
  const NBK = { key: "", url: "" };
  function nightBake(g, key) {
    const src = g.querySelector('.nb-src'); if (!src) return;
    const swap = () => { const s0 = g.querySelector('.nb-src'); if (s0 && g.dataset.key === key) s0.outerHTML = `<image class="nb-img" href="${NBK.url}" x="0" y="${MAP_Y}" width="${MAP_W}" height="${MAP_H}" preserveAspectRatio="none"/>`; };
    if (NBK.key === key && NBK.url) { swap(); return; }
    const L = [...src.querySelectorAll('image')].map(im => ({ u: im.getAttribute('href'), x: +im.getAttribute('x'), y: +im.getAttribute('y'), w: +im.getAttribute('width'), h: +im.getAttribute('height') }));
    if (!L.length || src.querySelector('ellipse') || !window.Promise) return;   // 둥근 빛(그림 없음)은 섞는 방식이 달라서 그대로
    const cv = document.createElement('canvas'); if (!cv.getContext || !cv.toBlob) return;
    const r = map.getBoundingClientRect(), sc = Math.max(1.5, Math.min(3, (r.width || 390) / MAP_W * (window.devicePixelRatio || 1)));
    cv.width = Math.round(MAP_W * sc); cv.height = Math.round(MAP_H * sc);
    Promise.all(L.map(l => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok([im, l]); im.onerror = no; im.src = l.u; })))
      .then(list => {
        if (g.dataset.key !== key) return;
        const c = cv.getContext('2d');
        for (const [im, l] of list) c.drawImage(im, l.x * sc, (l.y - MAP_Y) * sc, l.w * sc, l.h * sc);
        cv.toBlob(b => { if (!b || g.dataset.key !== key) return; if (NBK.url) URL.revokeObjectURL(NBK.url); NBK.url = URL.createObjectURL(b); NBK.key = key; swap(); }, 'image/webp', 0.92);
      }).catch(() => { /* 실패하면 예전처럼 여러 장 */ });
  }
  // 밤에는 학생이 걷지 않고 기숙사 앞(기숙사가 없으면 분수 옆)에 셋이 앉아 졸아요. 나머지는 기숙사 안
  function nsSleepers() {
    const sp = speciesList(); if (!sp.length) return '';
    const n = Math.min(3, Math.max(1, Math.floor(S.students) || 0));
    let cx, cy, w;
    // 기숙사 왼쪽 길가(이름표와 겹치지 않게). 기숙사가 없으면 분수 옆
    if (S.f.dorm >= 1 && bpos('dorm')) { [cx, cy, w] = bpos('dorm'); cx -= w * 0.5; cy += w * 0.02; } else { [cx, cy] = geo().plaza; cx += 26; cy += 6; w = 60; }
    const z = IMG('sleep_z');
    return Array.from({ length: n }, (_, i) => {
      const x = cx + (i % 2) * 9 - 4, y = cy + i * 11;
      return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(0.82)">${kidSVG(sp[(i * 5 + 2) % sp.length])}</g>` +
        (z ? `<image class="ns-z" href="${z}" x="${(x + 3).toFixed(1)}" y="${(y - 24).toFixed(1)}" width="11" height="11" style="animation-delay:${(i * 0.8).toFixed(1)}s"/>` : '');
    }).join('');
  }
  /* ===== 학교 꾸미기: 숲의 정수로 장식을 사서 지도의 정해진 자리(지도마다 11곳)에 놓아요. 보너스는 없고 졸업해도 남아요 ===== */
  // sm: 작은 장식(설계안: 벤치, 가로등, 새집, 이정표, 버섯 램프)은 36칸, 나머지는 46칸
  const DECO = [
    { id: 'bench', name: '벤치', ess: 10, img: 'deco_bench', sm: 1 },   // 처음 장식 퀘스트(4-8)에서 막히지 않게 싼 장식 셋은 40 → 10
    { id: 'flowerbed', name: '꽃밭', ess: 10, img: 'deco_flowerbed' },
    { id: 'signpost', name: '이정표', ess: 10, img: 'deco_signpost', sm: 1 },
    { id: 'streetlamp', name: '가로등', ess: 60, img: 'deco_streetlamp', sm: 1 },
    { id: 'birdhouse', name: '새집', ess: 60, img: 'deco_birdhouse', sm: 1 },
    { id: 'mushroom', name: '버섯 램프', ess: 80, img: 'deco_mushroom_lamp', sm: 1 },
    { id: 'picnic', name: '소풍 탁자', ess: 80, img: 'deco_picnic' },
    { id: 'pond', name: '연못', ess: 100, img: 'deco_pond' },
    { id: 'swingtree', name: '그네 나무', ess: 100, img: 'deco_swingtree' },
    { id: 'arch', name: '꽃 아치', ess: 100, img: 'deco_arch' },
    { id: 'fountain', name: '분수', ess: 150, img: 'deco_fountain' },
    { id: 'statue', name: '도토리 석상', ess: 150, img: 'deco_acorn_statue' },
    { id: 'rainbow', name: '무지개', ess: 250, img: 'deco_rare_rainbow', rare: 1 },
    { id: 'crystal', name: '수정 나무', ess: 250, img: 'deco_rare_crystal_tree', rare: 1 },
    { id: 'clock', name: '시계탑', ess: 250, img: 'deco_rare_clocktower', rare: 1 },
    { id: 'owl', name: '부엉이 동상', ess: 250, img: 'deco_rare_owl_statue', rare: 1 }
  ];
  // 이벤트 한정 장식(작업지시서 26): 가게에서 팔지 않고 그 이벤트의 기념 상자에서 하나 받아요. 그림(evd_*)이 들어오기 전에는 상자에서 나오지 않아요
  const EV_DECO = [['harvest', '도토리 수레'], ['friends', '우정 바람개비', 1], ['books', '야외 책장'], ['lunch', '급식 수레', 1], ['exam', '응원 엿 바구니', 1], ['xmas', '크리스마스트리'],
    ['newyear', '해님 연', 1], ['winter1', '눈사람', 1], ['winter2', '이글루와 눈썰매'], ['seollal', '윷놀이 멍석'], ['grad', '졸업 사진 아치'], ['spring', '벚나무'], ['trip_spring', '나비 꽃 정원'],
    ['science', '물로켓 발사대', 1], ['children', '바람개비 꽃밭'], ['buddha', '연등 기둥', 1], ['final', '모래시계 석상', 1], ['vacation', '물놀이 파라솔'], ['liberation', '무궁화 화단'],
    ['fall', '해바라기 화단'], ['chuseok', '송편 상과 달 등불'], ['hangul', '붓과 벼루 탁자', 1], ['trip_fall', '사과나무']];
  // 숲속 패스 시즌 표(장식 목록을 만들 때 써서 여기 둬요. 나머지는 '숲속 패스' 묶음)
  const PS = { anchor: '2026-11-02', len: 28, steps: 30, per: 100, dN: 3, dP: 30, wN: 5, wP: 60, extra: 300, extraEss: 10, tier: 1, adMul: 2 };
  // 시즌마다 주제와 한정 그림(작업지시서 23, 34). 0은 받은 가을 그림, 12(2027년 10월)는 둘째 해 주문 때 그려요. 그림이 없는 시즌은 황금 도토리로 대신 줘요
  const PS_SEASONS = [
    ['가을 수확', 'pass_deco_s1', '허수아비와 호박 더미', 'pass_fur_s1', '단풍잎 흔들의자'],
    ['크리스마스', 'pass_deco_s01', '선물 상자 탑', 'pass_fur_s01', '양말 걸린 벽난로'],
    ['새해 눈', 'pass_deco_s02', '눈사람 가족', 'pass_fur_s02', '털실 담요 안락의자'],
    ['설날', 'pass_deco_s03', '복주머니 연 장식대', 'pass_fur_s03', '색동 방석과 소반'],
    ['새 학기', 'pass_deco_s04', '꽃 풍선 환영 아치', 'pass_fur_s04', '새 책가방 사물함'],
    ['벚꽃', 'pass_deco_s05', '벚꽃 그네', 'pass_fur_s05', '벚꽃 책상과 의자'],
    ['소풍', 'pass_deco_s06', '바람개비 동산', 'pass_fur_s06', '소풍 바구니 탁자'],
    ['장미 초여름', 'pass_deco_s07', '장미 덩굴 정자', 'pass_fur_s07', '장미 화분 선반'],
    ['장마', 'pass_deco_s08', '수국 꽃밭', 'pass_fur_s08', '우산꽂이 선반'],
    ['여름 바다', 'pass_deco_s09', '모래성과 파라솔', 'pass_fur_s09', '조개 의자'],
    ['늦여름 해바라기', 'pass_deco_s10', '해바라기 수박 수레', 'pass_fur_s10', '수박 빈백'],
    ['추석 달맞이', 'pass_deco_s11', '보름달 등불', 'pass_fur_s11', '달항아리 장식장'],
    ['가을 수확', '', '', '', ''],
    ['늦가을 도토리', 'pass_deco_s13', '도토리 미끄럼틀', 'pass_fur_s13', '도토리 책장']
  ];
  const psDecoId = n => 'ps_' + n, psFurId = n => 'psf_' + n;
  const TR2 = { tier: 3, h0: 6, h1: 17, hours: 3, acMin: 120, ess: 20, xp: 20, dupEss: 10 };
  const TR2_PL = [
    { id: 'old', name: '옛 도시', img: 'tr2_city_old', photo: 'photo_old', c: '#C98B4E', say: '옛 성곽과 돌탑, 한옥 거리가 있는 오래된 도시예요.',
      stops: [
        { img: 'stop_old_1', name: '성곽 길', acts: [['성곽 걷기', 'pe', '높은 성벽 위를 끝까지 걸었어요. 다리는 아파도 경치가 최고예요!'], ['박물관 해설 듣기', 'kor', '해설사 선생님 이야기에 모두 귀를 쫑긋 세웠어요.']] },
        { img: 'stop_old_2', name: '돌탑 마당', acts: [['돌탑 그리기', 'art', '돌 하나하나를 정성껏 스케치북에 옮겼어요.'], ['옛 시 읽기', 'kor', '돌탑 앞에서 옛 시를 소리 내어 읽었어요.']] },
        { img: 'stop_old_3', name: '전통 과자 가게', acts: [['전통 과자 만들기', 'sci', '반죽이 굳는 온도를 맞추니 바삭한 과자가 됐어요.'], ['기념 도장 찍기', 'art', '알록달록 도장을 수첩 가득 찍었어요.']] }],
      props: ['prop_old_flag', 'prop_old_fan'], souv: [['sv2_old_1', '작은 돌탑 모형'], ['sv2_old_2', '전통 문양 연'], ['sv2_old_3', '옛 등불']] },
    { id: 'island', name: '섬 마을', img: 'tr2_island', photo: 'photo_island', c: '#3E9BC2', say: '배를 타고 가는 섬이에요. 하얀 등대와 귤밭이 있어요.',
      stops: [
        { img: 'stop_island_1', name: '등대와 갯바위', acts: [['등대 오르기', 'pe', '빙글빙글 계단을 올라 바다를 내려다봤어요.'], ['갯바위 생물 관찰', 'sci', '작은 게와 고둥을 찾아 관찰 노트에 적었어요.']] },
        { img: 'stop_island_2', name: '귤밭', acts: [['귤 따기', 'pe', '바구니 가득 귤을 땄어요. 하나씩 맛보는 것도 잊지 않았어요.'], ['해녀 이야기 듣기', 'kor', '바닷속 이야기를 듣고 모두 눈이 동그래졌어요.']] },
        { img: 'stop_island_3', name: '해안 길', acts: [['자전거로 섬 한 바퀴', 'pe', '바닷바람을 맞으며 섬을 한 바퀴 돌았어요.'], ['노을 그리기', 'art', '붉게 물든 하늘을 크레파스로 담았어요.']] }],
      props: ['prop_island_mandarin', 'prop_island_net'], souv: [['sv2_island_1', '등대 모형'], ['sv2_island_2', '귤 바구니'], ['sv2_island_3', '둥근 돌 조각']] },
    { id: 'big', name: '큰 도시', img: 'tr2_city_big', photo: 'photo_big', c: '#8C6CC4', say: '과학관과 놀이공원, 높은 전망대가 있는 큰 도시예요.',
      stops: [
        { img: 'stop_big_1', name: '과학관', acts: [['과학관 실험 쇼', 'sci', '펑! 하고 거품이 솟자 모두 박수를 쳤어요.'], ['로봇 만들기', 'math', '톱니바퀴 수를 세어 움직이는 로봇을 완성했어요.']] },
        { img: 'stop_big_2', name: '놀이공원과 시장', acts: [['놀이공원', 'pe', '관람차 꼭대기에서 학교 쪽을 찾아봤어요.'], ['시장 구경', 'math', '용돈을 계산해서 알뜰하게 간식을 샀어요.']] },
        { img: 'stop_big_3', name: '전망대', acts: [['전망대 야경 보기', 'sci', '반짝이는 불빛으로 별자리를 찾아봤어요.'], ['거리 공연 보기', 'art', '음악에 맞춰 다 같이 박수를 쳤어요.']] }],
      props: ['prop_big_balloon', 'prop_big_robot'], souv: [['sv2_big_1', '관람차 모형'], ['sv2_big_2', '로봇 장난감'], ['sv2_big_3', '전망대 스노볼']] }
  ];
  const TR2_BY = Object.fromEntries(TR2_PL.map(P => [P.id, P]));
  const freshTr2 = () => ({ done: {}, cur: null, go: 0, back: 0, souv: [] });
  [['winter', '눈꽃 트로피'], ['spring', '벚꽃 트로피'], ['summer', '파도 분수 트로피'], ['autumn', '단풍 도토리 조각상']].forEach(([q, nm]) => DECO.push({ id: 'rs_' + q, name: nm, ess: 0, img: 'season_' + q, rare: 1, ev: 1, rs: 1 }));   // 랭킹 시즌 기념 장식
  PS_SEASONS.forEach((x, n) => { if (x[1]) DECO.push({ id: psDecoId(n), name: x[2], ess: 0, img: x[1], rare: 1, ev: 1, ps: 1 }); });   // 숲속 패스 한정 장식
  [['cg_flag_b', '동메달 우승 깃발', 'flag_bronze'], ['cg_flag_s', '은메달 우승 깃발', 'flag_silver'], ['cg_flag_g', '금메달 우승 깃발', 'flag_gold']].forEach(([id, name, img]) => DECO.push({ id, name, ess: 0, img, rare: 1, ev: 1, cg: 1 }));   // 대항전 우승 깃발(CG_FLAGS와 같아요)
  DECO.push({ id: 'bio_hut', name: '관찰 오두막', ess: 0, img: 'bio_hut', rare: 1, ev: 1, bio: 30 });
  DECO.push({ id: 'deco_col_science', name: '온실 화분대', ess: 0, img: 'deco_col_science', rare: 1, ev: 1, col: 1 }, { id: 'deco_col_sports', name: '공 조형물', ess: 0, img: 'deco_col_sports', rare: 1, ev: 1, col: 1 }, { id: 'deco_col_human', name: '책 더미 벤치', ess: 0, img: 'deco_col_human', rare: 1, ev: 1, col: 1 }, { id: 'deco_col_art', name: '이젤과 조각', ess: 0, img: 'deco_col_art', rare: 1, ev: 1, col: 1 }, { id: 'deco_col_biz', name: '도토리 저울', ess: 0, img: 'deco_col_biz', rare: 1, ev: 1, col: 1 }, { id: 'deco_col_eng', name: '톱니 시계탑', ess: 0, img: 'deco_col_eng', rare: 1, ev: 1, col: 1 }, { id: 'deco_col_edu', name: '칠판 표지판', ess: 0, img: 'deco_col_edu', rare: 1, ev: 1, col: 1 }, { id: 'deco_col_med', name: '약초 화단', ess: 0, img: 'deco_col_med', rare: 1, ev: 1, col: 1 });   // 단과대학 장식(작업지시서 55): 처음 고르면 받아요
  const FV_SV = { science: '표본 진열대', sports: '우승컵 받침대', human: '시화 이젤', art: '작은 조각상', biz: '장터 수레', eng: '바람개비 풍차', edu: '사과 교탁', med: '약초차 수레' };
  // 대축제 달 한정 장식 12종(작업지시서 70): 그 달 대축제 도장 24개를 모으면 받아요. 살 수 없어요
  const BF_DECO = ['눈꽃 등불', '연날리기 연', '벚꽃 아치', '튤립 수레', '카네이션 화분 탑', '수국 우산', '수박 그네', '해바라기 풍차', '보름달 토끼 등불', '단풍 허수아비', '도토리 탑', '별 장식 트리'];
  DECO.push(...BF_DECO.map((nm, i) => ({ id: 'deco_bf_' + String(i + 1).padStart(2, '0'), name: nm, ess: 0, img: 'deco_bf_' + String(i + 1).padStart(2, '0'), rare: 1, ev: 1, bf: i + 1 })));
  DECO.push(...Object.keys(FV_SV).map(k => ({ id: 'deco_fv_' + k, name: FV_SV[k], ess: 0, img: 'deco_fv_' + k, rare: 1, ev: 1, fv: 1 })));   // 축제 부스 기념품 8종(작업지시서 63): 그 부스 놀이를 여섯 번 성공하면 받아요
  // 교환학생 우정 배지 8개 보상과 장터 장식 3종(작업지시서 64). 초등학교부터라 대학교 조건이 없어요
  DECO.push({ id: 'deco_ex_sign', name: '방향 이정표', ess: 0, img: 'deco_ex_sign', rare: 1, ev: 1, xg: 1 }, { id: 'deco_mk_lamp', name: '장터 등불', ess: 0, img: 'deco_mk_lamp', rare: 1, ev: 1, mk: 1 }, { id: 'deco_mk_cart', name: '채소 수레', ess: 0, img: 'deco_mk_cart', rare: 1, ev: 1, mk: 1 }, { id: 'deco_mk_pack', name: '보부상 봇짐', ess: 0, img: 'deco_mk_pack', rare: 1, ev: 1, mk: 1 });
  DECO.push({ id: 'deco_bug_hotel', name: '곤충 호텔', ess: 0, img: 'deco_bug_hotel', rare: 1, ev: 1, bio: 60 }, { id: 'deco_eco_pond', name: '생태 연못', ess: 0, img: 'deco_eco_pond', rare: 1, ev: 1, bio: 90 });
  DECO.push({ id: 'deco_career_tree', name: '진로 나무', ess: 0, img: 'deco_career_tree', rare: 1, ev: 1, cs: 1 });   // 진로 도감 12칸을 다 채우면. 생물 60종, 90종. 생물 30종을 다 모으면
  for (const P of TR2_PL) for (const [id, name] of P.souv) DECO.push({ id, name, ess: 0, img: id, rare: 1, ev: 1, tr2: P.name, sm: 1 });   // 수학여행 기념품
  for (const [k, name, sm] of EV_DECO) DECO.push({ id: 'ev_' + k, name, ess: 0, img: 'evd_' + k, rare: 1, ev: 1, ...(sm ? { sm: 1 } : {}) });
  DECO.push({ id: 'deco_pp_board', name: '세미나 칠판', ess: 0, img: 'deco_pp_board', rare: 1, ev: 1, pp: '세미나 10번' }, { id: 'deco_pp_chair', name: '명예의 의자', ess: 0, img: 'deco_pp_chair', rare: 1, ev: 1, pp: '세미나 20번' }, { id: 'deco_pp_tower', name: '논문 탑', ess: 0, img: 'deco_pp_tower', rare: 1, ev: 1, pp: '논문 30편' }, { id: 'deco_vd20', name: '마을 감사 아치', ess: 0, img: 'deco_vd20', rare: 1, ev: 1, pp: '마을 기부 20단계' });   // 칭호 덤 장식(작업지시서 100, ppDecoSync)
  const evDecoArt = d => !!(d && d.ev && IMG(d.img));
  GMON.nm.forEach(([flag, gate], i) => { const m = gmKey(i + 1);   // 5.3.3 이달의 꾸미기 깃발과 아치(하나씩, 백화점에서 황금으로)
    DECO.push({ id: `deco_mon_${m}_flag`, name: flag, ess: 0, img: `deco_mon_${m}_flag`, rare: 1, ev: 1, gm: i + 1 }, { id: `deco_mon_${m}_gate`, name: gate, ess: 0, img: `deco_mon_${m}_gate`, rare: 1, ev: 1, gm: i + 1 }); });
  const DECO_BY = Object.fromEntries(DECO.map(d => [d.id, d]));
  const DECO_GROW = 1.5, DECO_MAX = 11;   // 일반 장식은 하나 더 살 때마다 1.5배(지도 한 장을 다 채우는 11개까지), 희귀 장식은 하나씩만
  // 장식 자리(지도 그림의 %). 건물(Lv.5 크기)과 이름표, 호수를 피해서 지도마다 11곳. 간판 자리는 따로
  const pctXY = ([x, y]) => [Math.round(x * MAP_W / 100), Math.round(y * MAP_H / 100 + MAP_Y)];
  const DECO_SLOTS = [   // 새 단장: 작업지시서 57 자리 표의 꾸미기 11곳(D01~D11)
    // 건물 뒤에 가려지거나 서로 겹치던 자리를 옮겼어요. 유치원 4, 10번, 초등학교 4, 5, 11번, 고등학교 2, 4, 5, 7, 8, 10번(장식은 건물보다 먼저 그려져서 건물 그림과 겹치면 안 보여요)
    [[78.1, 23], [83.1, 29.1], [51.9, 39.1], [66.7, 73.7], [30, 35.6], [16.9, 60], [61.9, 83], [26.9, 80.9], [10, 60], [38.9, 75.9], [70, 28]].map(pctXY),
    [[61.9, 25], [76.1, 27], [15, 35.9], [9.4, 24.8], [70, 80], [13.1, 55], [26.9, 55], [88.9, 65], [31.1, 77], [23.9, 83], [56.9, 83.7]].map(pctXY),
    [[77, 28], [46.5, 33.3], [13, 79.5], [19, 79.5], [49, 81], [63, 80], [66, 84], [26.5, 86.5], [60, 84], [20, 28], [21.5, 83.5]].map(pctXY),
    [[53.1, 20.9], [78.1, 22.8], [56.9, 40.6], [61.7, 87], [8.3, 81.1], [23.1, 82.6], [92.2, 75], [55.6, 67.8], [63.9, 80], [65.6, 19.3], [21.1, 86.5]].map(pctXY),
  ];
  ZONE_GEO.forEach(Z => DECO_SLOTS.push(Z.deco.map(p => p.slice()))); DECO_SLOTS.push([]);   // 구역 지도마다 꾸미기 6곳(작업지시서 54 자리 표)
  const DECO_SIGN = [[124.2, 424.3], [124.2, 416.2], [126.0, 421.6], [124.2, 424.3]];   // 지도 그림의 정문 옆 나무 팻말 위에 덮어요(작업지시서 57 자리 표의 간판 가운데)
  ZONE_GEO.forEach(Z => DECO_SIGN.push(Z.sign || null)); DECO_SIGN.push(null);   // 학교 간판은 정문이 있는 광장 구역에만
  const MARK_BASE = ['shield', 'circle', 'flag'], MARK_SYM = ['acorn', 'leaf', 'star', 'book', 'sun', 'owl'];
  const MARK_COL = ['#D9534A', '#E8913A', '#F2C230', '#4E9A4A', '#3E78C2', '#8A5BC2', '#E77FA8', '#9A6A43'];
  const MARK_COL_NM = ['빨강', '주황', '노랑', '초록', '파랑', '보라', '분홍', '갈색'];
  const freshDeco = () => ({ own: {}, lay: DECO_SLOTS.map(L => L.map(() => '')), nm: '', mk: null });
  const decoMap = () => geoIdx();
  const decoOwn = id => (S.deco.own[id] || 0);
  // 대학교 구역 지도 네 장은 한 학교라서, 장식 개수를 구역끼리 함께 세요(한 구역에 놓은 장식을 다른 구역에 또 놓을 수 없어요)
  const decoGroup = m => m >= ZONE0 && m < ZONE0 + ZONE_KEYS.length ? ZONE_KEYS.map((_, z) => ZONE0 + z) : [m];
  const decoUsed = (m, id, skip) => decoGroup(m).reduce((a, g) => a + (S.deco.lay[g] || []).filter((x, i) => x === id && !(g === m && i === skip)).length, 0);
  const decoPlaced = m => S.deco.lay[m].filter(Boolean).length;
  const decoPlacedAll = () => S.deco.lay.reduce((a, L) => a + L.filter(Boolean).length, 0);
  const decoCost0 = id => { const d = DECO_BY[id]; if (!d) return Infinity; return d.rare ? d.ess : Math.ceil(d.ess * Math.pow(DECO_GROW, Math.min(DECO_MAX, decoOwn(id))) / 5) * 5; };
  // 미술부 할인(최대 15%). 할인한 값은 1 단위로 반올림해요
  const decoCost = id => { const c = decoCost0(id); if (!isFinite(c)) return c; const off = typeof clubDecoOff === 'function' ? clubDecoOff() : 0; return off > 0 ? Math.max(1, Math.round(c * (1 - off / 100))) : c; };
  const decoSoldOut = id => { const d = DECO_BY[id]; return !d || decoOwn(id) >= (d.rare ? 1 : DECO_MAX); };
  const cleanSchoolNm = v => typeof v === 'string' ? v.replace(/[\s<>&"'`\\]/g, '').slice(0, 6) : '';
  const schoolTitle = () => `${S.deco.nm || '숲속'} ${tierInfo().name}`;
  const markOk = mk => Array.isArray(mk) && mk.length === 4 && mk.every(n => Number.isInteger(n) && n >= 0) && mk[0] < MARK_BASE.length && mk[1] < MARK_SYM.length && mk[2] < MARK_COL.length && mk[3] < MARK_COL.length;
  function sanitize174(d, s) {
    const x = d.deco && typeof d.deco === 'object' ? d.deco : {};
    if (x.own && typeof x.own === 'object') for (const it of DECO) { const n = Math.floor(Number(x.own[it.id]) || 0); if (n > 0) s.deco.own[it.id] = Math.min(it.rare ? 1 : DECO_MAX, n); }
    const usedZ = {};   // 대학교 구역끼리는 함께 세요(옛 저장에서 넘치게 놓인 것은 앞 구역부터 남기고 나머지는 가진 장식으로 돌아가요)
    for (let m = 0; m < DECO_SLOTS.length; m++) {
      const L = Array.isArray(x.lay) && Array.isArray(x.lay[m]) ? x.lay[m] : [], used = m >= ZONE0 && m < ZONE0 + ZONE_KEYS.length ? usedZ : {};
      for (let i = 0; i < DECO_SLOTS[m].length; i++) {
        const id = L[i];   // 한 지도에 같은 장식을 가진 수보다 많이 놓을 수 없어요
        if (typeof id === 'string' && s.deco.own[id] && (used[id] || 0) < s.deco.own[id]) { s.deco.lay[m][i] = id; used[id] = (used[id] || 0) + 1; }
      }
    }
    s.deco.nm = cleanSchoolNm(x.nm);
    s.deco.mk = markOk(x.mk) ? x.mk.slice() : null;
  }
  // 학교 마크: 회색 바탕과 문양 그림에 고른 색을 곱해서 칠해요
  function markHTML(mk, x) {
    if (!markOk(mk)) return '';
    if (x === undefined) x = S && S.cos ? S.cos.mkx : '';   // 꾸미기 백화점 마크 특별판
    const b = IMG('mark_base_' + MARK_BASE[mk[0]]), y = IMG('mark_sym_' + MARK_SYM[mk[1]]);
    if (!b || !y) return '';
    const lay = (u, c) => `<img src="${u}" alt="" draggable="false"><i style="background:${c};-webkit-mask-image:url('${u}');mask-image:url('${u}')"></i>`;
    return `<span class="smark">${lay(b, MARK_COL[mk[2]])}${lay(y, MARK_COL[mk[3]])}${MARKX_SVG[x] ? `<svg class="smx" viewBox="0 0 100 100" aria-hidden="true">${MARKX_SVG[x]}</svg>` : ''}</span>`;
  }
  function renderCrest() {
    const el = $('#schoolCrest'); if (!el) return;
    const h = S.deco.mk ? markHTML(S.deco.mk) : '';
    if (el.dataset.mk === h.length + ':' + (S.deco.mk || []).join() + S.cos.mkx) return;
    el.dataset.mk = h.length + ':' + (S.deco.mk || []).join() + S.cos.mkx;
    el.classList.toggle('has-mark', !!h); el.innerHTML = h;
  }
  // 지도: 놓인 장식, 학교 간판, 꾸미기 중이면 빈 자리 표시
  function renderDeco(force) {
    renderNight();   // 밤 모드: 건물이 늘면 창 불빛도
    const g = $('#decoG'); if (!g || !S) return;
    const m = decoMap(), L = S.deco.lay[m], edit = !!rt.decoEdit;
    const key = [m, L.join(), S.deco.nm, S.tier, edit, S.vd ? S.vd.lv : 0, S.bx ? S.bx.m + ':' + S.bx.sp.map(x => x.i).join() : '', taMapKey()].join('|');   /* 조교와 기념비 */
    if (!force && g.dataset.key === key) return; g.dataset.key = key;
    let h = edit ? '<rect class="deco-dim" x="-200" y="-200" width="760" height="940"/>' : '';
    { const bg = $('#bxG'); if (bg) bg.innerHTML = edit ? '' : bxMapHTML(m); }   // 숨은 생물은 건물 위 층(#bxG)에 그려요
    { const vt = $('#vdTop'); if (vt) vt.innerHTML = edit ? '' : vdMapHTML(m) + taMapHTML(); }   // 마을 기부는 학생 위 층. 숨은 생물. 마을 기부 기념물(꾸미기 중에는 숨겨요). 꾸미기 중에는 지도를 살짝 어둡게 해서 빈 자리가 잘 보여요
    const [sx, sy] = DECO_SIGN[m] || [0, 0], sw = 96, sh = 48, nm = S.deco.nm || '숲속', tn = tierInfo().name;
    if (DECO_SIGN[m] && IMG('sign_board')) {
      // 글자는 간판 안쪽 판(그림 높이의 27%~71%) 가운데에 두 줄로. 판이 낮아서 글자를 작게 해요(위로 삐져나감)
      const fs1 = Math.min(8.5, 50 / Math.max(1, nm.length)), fs2 = Math.min(7.5, 50 / Math.max(1, tn.length)), mid = sy - sh * 0.477;
      h += `<g class="deco-sign"><image x="${sx - sw / 2}" y="${sy - sh * 0.97}" width="${sw}" height="${sh}" href="${IMG('sign_board')}"/>` +
        `<text class="deco-sign-t" x="${sx}" y="${(mid - sh * 0.105).toFixed(1)}" style="font-size:${fs1.toFixed(1)}px"></text><text class="deco-sign-t" x="${sx}" y="${(mid + sh * 0.115).toFixed(1)}" style="font-size:${fs2.toFixed(1)}px"></text></g>`;
    }
    DECO_SLOTS[m].forEach(([x, y], i) => {
      const d = DECO_BY[L[i]];
      if (d && IMG(d.img)) { const w = d.sm ? 36 : 46; h += `<image class="deco-it" x="${x - w / 2}" y="${y - w * 0.975}" width="${w}" height="${w}" href="${IMG(d.img)}"/>`; }
      if (edit) {
        if (!d) h += decoEmptyMark(x, y, i);   // 빈 자리를 크게, 반짝이게(지도에서 잘 안 보여요)
        else h += `<g class="deco-on"><ellipse class="deco-ring" cx="${x}" cy="${y - 4}" rx="22" ry="8"/></g>`;
        h += `<rect class="deco-hit" data-slot="${i}" x="${x - 22}" y="${y - 40}" width="44" height="46"/>`;
      }
    });
    g.innerHTML = h;
    const ts = g.querySelectorAll('.deco-sign-t');
    if (ts.length) {
      ts[0].textContent = nm; ts[1].textContent = tn;
      // 글꼴마다 글자 높이가 달라서(휴대폰의 제목 글꼴은 위로 커요) 실제 크기를 재서 안쪽 판에 맞춰요
      try {
        const top = sy - sh * 0.97 + sh * 0.29, bot = sy - sh * 0.97 + sh * 0.69, room = bot - top;
        let b1 = ts[0].getBBox(), b2 = ts[1].getBBox();
        if (!(b1.height && b2.height)) g.dataset.key = '';   // 못 쟀으면 다음에 다시 그려요
        else {
          const need = b1.height + b2.height, k = Math.min(1, room / need, (sw * 0.6) / Math.max(b1.width, b2.width));
          if (k < 1) { ts.forEach(t => { t.style.fontSize = (parseFloat(t.style.fontSize) * k).toFixed(2) + 'px'; }); b1 = ts[0].getBBox(); b2 = ts[1].getBBox(); }
          const pad = (room - b1.height - b2.height) / 3;
          ts[0].setAttribute('y', (+ts[0].getAttribute('y') + (top + pad - b1.y)).toFixed(2));
          ts[1].setAttribute('y', (+ts[1].getAttribute('y') + (top + pad * 2 + b1.height - b2.y)).toFixed(2));
        }
      } catch (e) { /* 지도가 안 보일 때는 재지 못해요. 다음에 그릴 때 맞춰요 */ }
    }
    // 간판이나 놓인 장식 가까이(30칸 안)의 계절 스티커는 숨겨요
    const near = [[sx, sy - 10]].concat(DECO_SLOTS[m].filter((p, i) => L[i]).map(([x, y]) => [x, y - 10]));
    $$('#thDeco image').forEach(im => {
      const cx = +im.getAttribute('x') + 24, cy = +im.getAttribute('y') + 30;
      im.style.display = near.some(([x, y]) => Math.hypot(x - cx, y - cy) < 30) ? 'none' : '';
    });
    const bar = $('#decoBar'); if (bar) bar.hidden = !(edit && rt.tab === 'school');
    if (typeof renderZoneBar === 'function') renderZoneBar();
    map.classList.toggle('deco-on', edit);   // 꾸미기 중에는 꾸미기만(건물, 참나무, 도토리, 선생님, 학생을 누르지 않아요)
  }
  // 빈 장식 자리 표시: 금빛 테 흰 동그라미에 +, 둘레가 숨 쉬듯 반짝여요. 차례 번호는 애니메이션이 한꺼번에 깜빡이지 않게 늦춤에 써요
  const decoEmptyMark = (x, y, i) => `<g class="deco-empty" transform="translate(${x} ${y - 10})" style="--d:${(i % 4) * 0.3}s"><circle class="de-halo" r="17"/><circle class="de-dot" r="11.5"/><path class="de-plus" d="M-5 0H5M0 -5V5"/></g>`;
  function decoEditStart() {
    if (uniOn() && geo().campus) setZone('plaza', true);   // 캠퍼스 지도에는 꾸미기 자리가 없어서 광장 구역으로(다른 구역은 그 구역에서 꾸며요)
    rt.decoEdit = true; sfx('tap');
    setTab('school'); renderDeco(true);
    const m = decoMap(), i = S.deco.lay[m].indexOf('');
    if (i >= 0 && rt.mapS) { const fr = $('.frame'), [x, y] = DECO_SLOTS[m][i]; panTo(fr.clientWidth / 2 - x * rt.mapS, fr.clientHeight / 2 - (y + 60) * rt.mapS); }
  }
  function decoEditEnd() { if (!rt.decoEdit) return; rt.decoEdit = false; renderDeco(true); save(); }
  function openDecoPick(i) {
    const m = viewMap(); if (!DECO_SLOTS[m][i]) return;
    rt.decoSlot = i; sfx('tap');
    const cur = S.deco.lay[m][i];
    const own = DECO.filter(d => decoOwn(d.id) > 0);
    $('#decoPickList').innerHTML = own.map(d => {
      const left = decoOwn(d.id) - decoUsed(m, d.id, i), on = cur === d.id;
      return `<button class="si${on ? ' on' : ''}${left > 0 ? '' : ' dis'}" type="button" data-dput="${d.id}" aria-pressed="${on}"><span class="pv deco"><img src="${IMG(d.img)}" alt="" draggable="false"></span><span class="nm">${d.name}</span><span class="pr">${on ? '놓는 중' : left > 0 ? `${left}개 남음` : '다 놓았어요'}</span></button>`;
    }).join('');
    $('#decoPickNote').textContent = own.length ? '' : '아직 가진 장식이 없어요. 상점 거리의 꾸미기 가게에서 살 수 있어요';
    $('#decoPickShop').hidden = own.length > 0;
    $('#decoPickClear').hidden = !cur;
    openModal($('#mDecoPick'));
  }
  function decoPut(i, id) {
    const m = viewMap(); if (!DECO_SLOTS[m][i]) return false;
    if (id) { if (!DECO_BY[id] || decoOwn(id) - decoUsed(m, id, i) <= 0) return false; }
    S.deco.lay[m][i] = id || '';
    renderDeco(true); if (rt.viewTier != null) renderTierView(true); save();
    return true;
  }
  // 꾸미기 가게
  function renderDecoShop() {
    const m = decoMap(), ic = ESS_ICON();
    $('#decoHave').innerHTML = `${ic}<span>${fmt(S.ess)}</span>`;
    { const all = DECO_SLOTS[m].length, used = decoPlaced(m); $('#decoSlotsTxt').textContent = !all ? '이 지도에는 꾸밀 자리가 없어요. 구역 지도에서 꾸며요' : used >= all ? `자리 ${all}곳을 모두 꾸몄어요. 바꾸기도 돼요` : `빈 자리 ${all - used}곳, 놓은 장식 ${used}개`;   // 5.3.3 빈 상태 글
      const pic = $('#decoModePic'); if (pic && !pic.firstChild && IMG('deco_flowerbed')) pic.innerHTML = `<img src="${IMG('deco_flowerbed')}" alt="">`; }   // 꾸미기 모드 카드
    let h = '';
    const evList = DECO.filter(evDecoArt);
    // 5.3.3: 이벤트 한정 장식은 도감의 '장식' 칸으로 옮겼어요(가게에는 아래 한 줄). 갈래 칩용 머리(data-cat)
    for (const [title, cat, list] of [['장식 <small>(사면 지도에 놓을 수 있어요)</small>', '장식', DECO.filter(d => !d.rare)], ['희귀 장식 <small>(하나씩만)</small>', '희귀', DECO.filter(d => d.rare && !d.ev)]]) {
      h += `<h3 class="shop-h" data-cat="${cat}">${title}</h3><div class="shop-grid">`;
      for (const d of list) {
        const n = decoOwn(d.id), out = decoSoldOut(d.id), c = decoCost(d.id), poor = !out && S.ess < c, nx = out ? 0 : decoNext(d.id);
        const pr = out ? (d.rare ? '가졌어요' : '더 살 수 없어요') : `${ic}${c}`;
        h += `<button class="si${n ? ' own' : ''}${poor ? ' poor' : ''}${out ? ' out' : ''}" type="button" data-dbuy="${d.id}" aria-label="${d.name}${out ? '' : `, 숲의 정수 ${c}개`}">` +
          (d.rare ? '<span class="rare-mark" aria-hidden="true">★</span>' : '') +
          `<span class="pv deco"><img src="${IMG(d.img)}" alt="" draggable="false"></span><span class="nm">${d.name}${!d.rare && n ? ` <small>${n}개</small>` : ''}</span><span class="pr">${pr}</span>` +
          (out ? '' : poor ? lackTx(c, S.ess) : nx ? `<em class="nx">다음 ${nx}</em>` : '') + '</button>';   // 5.3.3 값이 오르는 장식은 다음 값
      }
      h += '</div>';
    }
    // 한정 모자와 특별 가구(옛 정수 상점에서 옮겨 왔어요)
    h += '<h3 class="shop-h" data-cat="모자">한정 모자 <small>(학생들이 써요)</small></h3><div class="shop-grid">';
    for (const it of COS.hat.items) {
      if (!it.ess) continue;
      const key = 'hat:' + it.id, own = S.cos.own.includes(key), on = S.cos.hat === it.id, poor = !own && S.ess < ESHOP.hat;
      h += `<button class="si${own ? ' own' : ''}${on ? ' on' : ''}${poor ? ' poor' : ''}" type="button" data-dbuy="${key}" aria-pressed="${on}" aria-label="${it.name}${own ? '' : `, 숲의 정수 ${ESHOP.hat}개`}">` +
        `<span class="pv"><img src="${IMG('cos_hat_' + it.id)}" alt="" draggable="false"></span><span class="nm">${it.name}</span><span class="pr">${on ? '쓰는 중' : own ? '쓰기' : `${ic}${ESHOP.hat}`}</span>${own ? '' : lackTx(ESHOP.hat, S.ess)}</button>`;
    }
    h += '</div><h3 class="shop-h" data-cat="가구">특별 가구 <small>(방마다 하나씩 놓여요)</small></h3><div class="shop-grid">';
    for (const k of Object.keys(SP_FUR)) {
      const F = SP_FUR[k], key = 'sp:' + F.id, own = S.cos.own.includes(key), on = S.cos.sp[k] === F.id, poor = !own && S.ess < ESHOP.fur;
      h += `<button class="si${own ? ' own' : ''}${on ? ' on' : ''}${poor ? ' poor' : ''}" type="button" data-dbuy="${key}" aria-pressed="${on}" aria-label="${F.name}${own ? '' : `, 숲의 정수 ${ESHOP.fur}개`}">` +
        `<span class="pv fur"><img src="${IMG('fur_sp_' + F.id)}" alt="" draggable="false"></span><span class="nm">${F.name}</span><span class="pr">${on ? '쓰는 중' : own ? '쓰기' : `${ic}${ESHOP.fur}`}</span>${own ? '' : lackTx(ESHOP.fur, S.ess)}</button>`;
    }
    h += '</div>';
    { const L = DECO.filter(evDecoArt), own = L.filter(d => decoOwn(d.id)).length, im = L[0] && IMG(L[0].img);   // 5.3.3 이벤트 한정 장식은 도감에서 봐요
      if (L.length) h += `<button class="sb ev-dex" type="button" data-evdex><span class="pv">${im ? `<img src="${im}" alt="">` : ''}</span><span class="tx"><b>이벤트 한정 장식 도감</b><span>이벤트 기념 상자 같은 곳에서 받아요. 가진 것은 '지도 꾸미기'로 놓아요</span></span><span class="pill">${own} / ${L.length} ›</span></button>`; }
    const list = $('#decoList'), top = list.scrollTop; list.innerHTML = h; list.scrollTop = top;
    const ask = $('#decoAsk'), ci = rt.decoPick.includes(':') ? essItem(rt.decoPick) : null, d = ci ? null : DECO_BY[rt.decoPick];
    const nm = ci ? ci.name : d && d.name, c = ci ? ci.price : d && decoCost(d.id);
    ask.hidden = !nm;
    if (nm) {
      const enough = S.ess >= c;
      $('#decoAskText').textContent = enough ? `${nm}${eulOf(nm)} 숲의 정수 ${c}개로 살까요?` : `숲의 정수가 ${c - S.ess}개 모자라요. 공부 탭에서 모으거나 문방구에서 바꿀 수 있어요.`;
      $('#decoYes').textContent = enough ? '사기' : '공부 가기';
    }
    // 소풍에서 주워 온 희귀 열매 하나로 일반 장식 하나
    const berryOk = !!(d && !d.rare && !d.ev && !decoSoldOut(d.id) && S.pc && S.pc.berry > 0);
    $('#decoBerry').hidden = !berryOk;
    if (berryOk) $('#decoBerry').textContent = `희귀 열매로 받기 (${S.pc.berry}개)`;
    const pieceOk = !!(d && !d.rare && !d.ev && !decoSoldOut(d.id) && S.mg && S.mg.pieces >= 5);
    $('#decoPieces').hidden = !pieceOk;
    if (pieceOk) $('#decoPieces').textContent = `장식 조각 5개로 받기 (${S.mg.pieces}개)`;
    const inp = $('#decoName'); if (document.activeElement !== inp) inp.value = S.deco.nm;
    $('#decoTier').textContent = tierInfo().name;
    if (!rt.mkDraft) rt.mkDraft = S.deco.mk ? S.deco.mk.slice() : [0, 0, 3, 2];
    renderMarkEdit();    shopChrome('deco');
  }
  function renderMarkEdit() {
    const k = rt.mkDraft;
    $('#markBig').innerHTML = markHTML(k, '');
    const btn = (grp, i, inner, on, lab, cls = '') => `<button class="${cls}" type="button" data-mk="${grp}:${i}" aria-pressed="${on}" aria-label="${lab}">${inner}</button>`;
    const row = (lab, html) => `<div class="mark-row"><small>${lab}</small>${html}</div>`;
    $('#markRows').innerHTML =
      row('모양', MARK_BASE.map((b, i) => btn(0, i, `<img src="${IMG('mark_base_' + b)}" alt="">`, k[0] === i, `모양 ${i + 1}`)).join('')) +
      row('문양', MARK_SYM.map((b, i) => btn(1, i, `<img src="${IMG('mark_sym_' + b)}" alt="">`, k[1] === i, `문양 ${i + 1}`)).join('')) +
      row('바탕 색', MARK_COL.map((c, i) => btn(2, i, `<i style="background:${c}"></i>`, k[2] === i, '바탕 ' + MARK_COL_NM[i], 'sw')).join('')) +
      row('문양 색', MARK_COL.map((c, i) => btn(3, i, `<i style="background:${c}"></i>`, k[3] === i, '문양 ' + MARK_COL_NM[i], 'sw')).join(''));
    $('#markOff').hidden = !S.deco.mk;
  }
  function pickDeco(id) {
    if (id.includes(':')) {   // 한정 모자와 특별 가구
      const it = essItem(id); if (!it) return;
      sfx('tap');
      if (essCosToggle(it)) { rt.decoPick = ''; renderDecoShop(); return; }
      rt.decoPick = id;
      if (S.ess >= it.price) { buyDeco(); return; }   // 5.3.3 바로 사요
      renderDecoShop(); return;
    }
    const d = DECO_BY[id]; if (!d) return;
    sfx('tap');
    if (d.ev) { toast(decoOwn(id) ? `${d.name}${eulOf(d.name)} 가지고 있어요. '지도 꾸미기'를 눌러 학교에 놓아 보세요` : d.gm ? `${eun(d.name)} ${d.gm}월의 꾸미기예요. 꾸미기 백화점에서 황금 도토리로 사요` : d.pa ? `${eun(d.name)} ${d.pa} 받아요` : d.pp ? `${eun(d.name)} ${d.pp}이면 받아요` : d.cs ? `${eun(d.name)} 진로 도감 12칸을 다 채우면 받아요` : d.tr2 ? `${eun(d.name)} ${d.tr2} ${tr2Nm()}에서 가져와요` : d.fv ? `${eun(d.name)} 축제 부스 놀이를 ${FV.win}번 성공하면 받아요` : d.bf ? `${eun(d.name)} ${d.bf}월 대축제에서 도장 ${BIG.max}개를 모으면 받아요` : d.xg ? `${eun(d.name)} 교환학생 우정 배지 8개를 모으면 받아요` : d.mk ? `${eun(d.name)} 목요일 숲속 장터에서 쿠폰으로 사요` : `${eun(d.name)} 그 이벤트의 기념 상자에서 받아요. 지난 이벤트 것은 꾸미기 백화점에서 살 수 있어요`); return; }
    if (decoSoldOut(id)) { toast(d.rare ? `${eun(d.name)} 하나만 가질 수 있어요` : `${eun(d.name)} ${DECO_MAX}개까지 가질 수 있어요`); return; }
    rt.decoPick = id;
    const alt = !d.rare && ((S.pc && S.pc.berry > 0) || (S.mg && S.mg.pieces >= 5));   // 열매나 조각으로 받을 길이 있으면 줄을 띄워 고르게 해요
    if (!alt && S.ess >= decoCost(id)) { buyDeco(); return; }   // 5.3.3 바로 사요
    renderDecoShop();
  }
  function buyDecoPieces() {
    const d = DECO_BY[rt.decoPick]; rt.decoPick = '';
    if (!d || d.rare || d.ev || decoSoldOut(d.id) || !S.mg || S.mg.pieces < 5) { renderDecoShop(); return false; }
    S.mg.pieces -= 5; S.deco.own[d.id] = decoOwn(d.id) + 1;
    toast(`장식 조각으로 ${d.name}${eulOf(d.name)} 받았어요!`);
    sfx('quest'); buzz(15); save(); renderDecoShop(); return true;
  }
  function buyDecoBerry() {   // 희귀 열매 하나로 일반 장식 하나
    const d = DECO_BY[rt.decoPick]; rt.decoPick = '';
    if (!d || d.rare || d.ev || decoSoldOut(d.id) || !(S.pc && S.pc.berry > 0)) { renderDecoShop(); return false; }
    S.pc.berry -= 1; S.deco.own[d.id] = decoOwn(d.id) + 1;
    toast(`희귀 열매로 ${d.name}${eulOf(d.name)} 받았어요! '지도 꾸미기'를 눌러 학교에 놓아 보세요`); sfx('quest'); buzz(15);
    save(); renderDecoShop();
    return true;
  }
  function buyDeco() {
    if (rt.decoPick.includes(':')) {   // 한정 모자와 특별 가구
      const it = essItem(rt.decoPick); rt.decoPick = '';
      if (!it || S.cos.own.includes(it.kind + ':' + it.id)) { renderDecoShop(); return false; }
      if (!(S.ess >= it.price)) { setTab('mini'); return false; }
      essCosBuy(it); save(); renderEss(); renderDecoShop();
      return true;
    }
    const d = DECO_BY[rt.decoPick]; rt.decoPick = '';
    if (!d || d.ev || decoSoldOut(d.id)) { renderDecoShop(); return false; }
    const c = decoCost(d.id);
    if (!(S.ess >= c)) { setTab('mini'); return false; }
    S.ess -= c; S.st.esSpent = (S.st.esSpent || 0) + c;
    S.deco.own[d.id] = decoOwn(d.id) + 1;
    toast(`${d.name}${eulOf(d.name)} 샀어요! '지도 꾸미기'를 눌러 학교에 놓아 보세요`); sfx('quest'); buzz(15);
    save(); renderEss(); renderDecoShop();
    return true;
  }
  function setSchoolNm(v) {
    const n = cleanSchoolNm(v);
    S.deco.nm = n === '숲속' ? '' : n;
    renderDeco(true); renderHUD(); save(); renderDecoShop();
    { const t = schoolTitle(); toast(`학교 이름을 "${t}"${batchim(t) ? '으로' : '로'} 정했어요`); }
  }
  function setMark(mk) {
    S.deco.mk = mk && markOk(mk) ? mk.slice() : null;
    renderCrest(); save(); renderDecoShop();
  }
  function useBooster(k) {   // 이제는 미션 보상의 특식 데이만 써요(팔던 부스터는 5.3.3에 치웠어요)
    if (k === 'feast') { S.hd.feastUntil = Math.max(gameNow(), S.hd.feastUntil) + 10 * 60000; toast('특식 데이! 10분 동안 수업료 +100%예요'); }
  }

  // 상점 광고는 하루 3번, 일반 광고 황금과 따로 세요(5.3.3 woodani)
  function shopAd() {
    goldDay();
    if (S.gd.shop >= GOLD.shopAd) { shake($('#shopAd')); return; }
    rt.adNoGold = true;
    showAd(() => {
      goldDay();
      if (S.gd.shop >= GOLD.shopAd) return;
      S.gd.shop += 1; S.gd.n += 1;
      addGold(GOLD.shopAdN);
      sfx('quest');
      toast(`황금 도토리 +${GOLD.shopAdN}개를 받았어요`);
      save();
      if (rt.tab === 'shop') renderShop();
    if (rt.tab === 'street') renderStreet();
    }, r => {
      if (r !== 'noad') toast('광고를 끝까지 보지 않아서 황금 도토리를 받지 못했어요');
    });
  }

