  /* ---------- 2.1.0 숲속 소풍 (유치원 2, 로드맵 5절) ----------
     놀이터 안에서 게임 시계로 하루 한 번. 학생 3명을 골라 보내면 15분 뒤 돌아와요(앱을 꺼도 가요). 그동안 3명은 수업료를 내지 않아요.
     돌아오면 수업료 10분치(도시락을 싸면 15분치), 가끔 숲의 정수 1~2개, 아주 가끔 희귀 열매(꾸미기 가게에서 일반 장식 하나로 바꿔요).
     도시락은 숲의 정수 5(5.3.3 woodani, 예전 15), 보낼 때 싸요. 확률과 열매 쓰임은 본부 제안 */
  const PCN = { min: 15, kids: 3, acorn: 10, lunchAcorn: 15, lunch: 5, essP: 0.3, berryP: 0.05 };
  const freshPc = () => ({ day: '', at: 0, kids: [], lunch: false, berry: 0, st: { n: 0, ess: 0, berry: 0 } });
  const pcReady = () => !!S && !!S.pc && S.f.playground >= 1;
  const pcActive = () => !!S && !!S.pc && S.pc.at > 0;
  const pcAway = () => pcActive() ? PCN.kids : 0;
  const pcEnd = () => S.pc.at + PCN.min * 60000;
  const pcRemain = () => pcActive() ? Math.max(0, pcEnd() - gameNow()) : 0;
  const pcChr = (sp, px) => IMG('chr_' + sp) ? `<img src="${IMG('chr_' + sp)}" alt="" draggable="false"${px ? ` style="width:${px}px;height:${px}px"` : ''}>` : `<span class="fb">${kidAvatar(sp)}</span>`;
  function pcStart(kids, lunch) {
    if (!pcReady() || rt.paused) return false;
    if (pcActive()) { toast('지금 소풍을 가 있어요'); return false; }
    if (S.pc.day === gameToday()) { toast('소풍은 하루 한 번이에요.\n내일 또 가요'); return false; }
    const sp = speciesList(), list = [...new Set(kids)].filter(k => sp.includes(k)).slice(0, PCN.kids);
    if (list.length < Math.min(PCN.kids, sp.length)) { toast(`소풍 갈 친구를 ${PCN.kids}명 골라요`); return false; }
    if (lunch && S.ess < PCN.lunch) { toast(`도시락을 싸려면 숲의 정수 ${PCN.lunch}개가 있어야 해요`); return false; }
    if (lunch) { S.ess -= PCN.lunch; S.st.esSpent = (S.st.esSpent || 0) + PCN.lunch; renderEss(); }
    S.pc.day = gameToday(); S.pc.at = gameNow(); S.pc.kids = list; S.pc.lunch = !!lunch;
    sfx('tap'); save(); renderHUD();
    toast(`${list.map(spName).join(', ')} 친구가 소풍을 떠났어요.\n${PCN.min}분 뒤 돌아와요`);
    return true;
  }
  // 돌아왔으면 보상을 줘요. 보상 창은 다른 창이 없을 때(1초마다 pcTick)
  function pcSettle() {
    if (!pcActive() || gameNow() < pcEnd()) return false;
    const lunch = S.pc.lunch, kids = S.pc.kids.slice();
    S.pc.at = 0; S.pc.lunch = false; S.pc.st.n += 1;
    const fvb = fvBonus('picnic'), v = minAcorns(lunch ? PCN.lunchAcorn : PCN.acorn) * (fvb ? 2 : 1); S.budget += v; earn(v);   // 축제 월요일: 소풍 수확 +100%
    const items = [{ ic: 'acorn', t: `도토리 +${fmt(v)}${lunch ? ' (도시락)' : ''}${fvb ? ' (축제 +100%)' : ''}` }];
    if (Math.random() < PCN.essP) { const e = Math.random() < 0.5 ? 1 : 2; addEss(e); S.pc.st.ess += e; items.push({ ic: 'ess', t: `숲의 정수 +${e}` }); }
    if (Math.random() < PCN.berryP) { S.pc.berry += 1; S.pc.st.berry += 1; items.push({ ic: IMG('picnic_berry') ? `<img src="${IMG('picnic_berry')}" alt="" style="width:22px;height:22px">` : '🫐', t: '희귀 열매 +1 (꾸미기 가게에서 장식으로 바꿔요)' }); }
    for (const sp of kids) { const f = frOf(sp); if (f) { f.n.pc += 1; items.push(...frAddP(sp, BF.picnic, true)); } }   // 함께 간 단짝 친밀도
    rt.pcNews = { kids, items };
    save(); renderHUD(); checkQuests();
    if (rt.modalOpen === $('#mPicnic')) renderPicnic();
    return true;
  }
  function pcTick() {
    if (!S || !S.pc) return;
    pcSettle();
    if (pcActive() && rt.modalOpen === $('#mPicnic')) renderPicnicNow();
    // 소풍 간 친구 셋은 지도에서 잠시 안 보여요
    const away = pcAway(); rt.kids.forEach((k, i) => { const h = i < away; if (k.g.style.display !== (h ? 'none' : '')) k.g.style.display = h ? 'none' : ''; });
    if (rt.pcNews && !rt.modalOpen && !rt.cereOn && !rt.paused && !gameSceneOpen()) {
      const n = rt.pcNews; rt.pcNews = null;
      showReward({ title: '소풍에서 돌아왔어요!', sub: `${n.kids.map(spName).join(', ')} 친구가 숲에서 이것저것 주워 왔어요`, art: IMG('picnic_bundle') ? `<img src="${IMG('picnic_bundle')}" alt="" style="width:120px;height:120px">` : '🧺', big: '숲속 소풍', items: n.items });
    }
  }
  function openPicnic() {
    if (!pcReady()) { toast(`${eul(FAC.playground.name)} 지으면 소풍을 갈 수 있어요`); return; }
    if (rt.paused || rt.modalOpen) return;
    pcSettle();
    const sp = speciesList();
    rt.pcSel = sp.slice(0, PCN.kids); rt.pcLunch = false;
    renderPicnic(); openModal($('#mPicnic')); sfx('tap');
  }
  function renderPicnicNow() {
    const box = $('#pcNow'); if (!box) return;
    box.hidden = !pcActive(); if (box.hidden) return;
    const left = pcRemain(), tot = PCN.min * 60000, m = Math.ceil(left / 60000);
    box.innerHTML = `${IMG('picnic_basket') ? `<img src="${IMG('picnic_basket')}" alt="">` : ''}<span class="pc-ntx"><b>소풍 가는 중${S.pc.lunch ? ' (도시락)' : ''}</b><span class="pc-who">${S.pc.kids.map(k => pcChr(k)).join('')}</span><small>${left > 0 ? `${m}분 뒤 돌아와요` : '돌아왔어요!'}</small><span class="ac-bar"><i style="width:${Math.round(100 * (1 - left / tot))}%"></i></span></span>`;
  }
  function picnicUseTicket(k) {
    const t = TK.find(x => x.k === k);
    if (!t || !pcActive() || pcRemain() <= 0 || S.tk[k] < 1) return;
    S.tk[k]--; S.st.tkUsed = (S.st.tkUsed || 0) + 1; S.pc.at = Math.max(1, S.pc.at - t.sec * 1000);
    if (!pcSettle()) save(); renderPicnic();
  }
  function renderPicnic() {
    if (!$('#mPicnic') || !S.pc) return;
    const bg = IMG('picnic_trail'); $('#pcHead').style.backgroundImage = bg ? `url("${bg}")` : '';
    const busy = pcActive(), done = !busy && S.pc.day === gameToday(), can = !busy && !done;
    $('#pcLead').textContent = nl(busy ? '친구들이 숲으로 소풍을 갔어요. 앱을 꺼도 시간은 가요.' : done ? '오늘 소풍은 다녀왔어요. 내일 또 가요.' : `하루 한 번, 친구 ${PCN.kids}명이 ${PCN.min}분 동안 다녀와요. 도토리 ${fmtN(minAcorns(PCN.acorn))}${batchim(fmtN(minAcorns(PCN.acorn))) ? '과' : '와'} 가끔 숲의 정수를 주워 와요. 그동안 ${PCN.kids}명은 수업료를 내지 않아요.`);
    renderPicnicNow();
    fvFlag($('#pcLead'), 'picnic', '축제 +100%');   // 축제 월요일
    $('#pcTickets').innerHTML = busy && pcRemain() > 0 ? waitTicketButtons('data-picnic-tk') : '';
    const sp = speciesList();
    $('#pcKids').hidden = !can;
    $('#pcKids').innerHTML = can ? sp.map(k => { const on = rt.pcSel.includes(k);
      return `<button class="pc-kid${on ? ' pick' : ''}" type="button" data-pk="${k}" aria-pressed="${on}">${pcChr(k)}<span>${spName(k)}</span></button>`; }).join('') : '';
    const lb = $('#pcLunch'); lb.hidden = !can;
    if (can) {
      const poor = S.ess < PCN.lunch;
      lb.setAttribute('aria-pressed', rt.pcLunch ? 'true' : 'false'); lb.setAttribute('aria-disabled', poor && !rt.pcLunch ? 'true' : 'false');
      lb.innerHTML = `${IMG('picnic_lunch') ? `<img src="${IMG('picnic_lunch')}" alt="">` : ''}<span class="pc-ltx"><b>도시락 싸기</b><small>숲의 정수 ${PCN.lunch}개. 주워 오는 도토리가 ${fmt(minAcorns(PCN.acorn))}에서 ${euro(fmt(minAcorns(PCN.lunchAcorn)))} 늘어요</small></span><span class="pc-chk" aria-hidden="true">${rt.pcLunch ? '✓' : ''}</span>`;
    }
    const go = $('#pcGo'); go.hidden = !can;
    go.setAttribute('aria-disabled', rt.pcSel.length >= Math.min(PCN.kids, sp.length) ? 'false' : 'true');
    go.textContent = `소풍 보내기 (${rt.pcSel.length}/${Math.min(PCN.kids, sp.length)}명)`;
    $('#pcNote').textContent = nl(`지금까지 소풍 ${S.pc.st.n}번.` + (S.pc.berry ? ` 희귀 열매 ${S.pc.berry}개가 있어요. 꾸미기 가게에서 일반 장식으로 바꿔요.` : ''));
  }
  function pcKidTap(k) {
    if (!speciesList().includes(k)) return;
    const s = rt.pcSel, i = s.indexOf(k);
    if (i >= 0) s.splice(i, 1); else if (s.length < PCN.kids) s.push(k); else { s.shift(); s.push(k); }
    sfx('tap'); renderPicnic();
  }
  function pcGo() {
    if (!pcStart(rt.pcSel, rt.pcLunch)) return;
    renderPicnic(); setTimeout(() => { if (rt.modalOpen === $('#mPicnic')) closeModal($('#mPicnic')); }, 500);
  }

  /* ---------- 칭찬 스티커판 (초등학교 2, 로드맵 5절) ----------
     초등학교부터 교실 벽에. 오늘의 미션, 메인 퀘스트, 학생 부탁을 끝낼 때마다 스티커 한 장(게임 시계로 하루 5장까지)
     20장을 채우면 반 전체 상: 수업료 1시간치 도토리나 황금 도토리 2개 가운데 하나. 고르면 판이 비워지고 새 판이 붙어요
     판 그림은 달마다 바뀌고(작업지시서 12, 12장), 다 채운 판은 넘겨 볼 수 있어요 */
  const SK = { tier: 1, perDay: 5, full: 20, acornMin: 60, gold: 2, keep: 60 };
  const SK_KINDS = ['star', 'heart', 'acorn', 'flower', 'leaf', 'sun', 'rainbow', 'crown'];
  // 판 그림(1024×768)의 칸 가운데(%): 가로 5칸 × 세로 4칸
  const SK_X = [17.2, 33.6, 50, 66.4, 82.8], SK_Y = [29.2, 45.8, 62.5, 79.2];
  const freshSk = () => ({ day: '', n: 0, cur: [], mo: 0, done: [], st: { all: 0, boards: 0 } });
  const skOpen = () => !!S && !!S.sk && S.tier >= SK.tier;
  const skMonth = () => Number(gameToday().slice(5, 7)) || 1;
  const skFull = () => S.sk.cur.length >= SK.full;
  function skDay() { const t = gameToday(); if (dayRoll(S.sk, t)) { S.sk.n = 0; } }
  const skLeft = () => { skDay(); return Math.max(0, SK.perDay - S.sk.n); };
  // 스티커 한 장 붙이기. 붙였으면 보상 창에 넣을 줄을, 아니면 null
  function skAdd() {
    if (!skOpen() || skFull() || skLeft() <= 0) return null;
    if (!S.sk.cur.length) S.sk.mo = skMonth();
    S.sk.n += 1; S.sk.st.all += 1;
    S.sk.cur.push(Math.floor(Math.random() * SK_KINDS.length));
    rt.skNew = S.sk.cur.length - 1;
    const full = skFull();
    if (full) setTimeout(() => toast('칭찬 스티커판을 다 채웠어요!\n교실에서 반 전체 상을 골라요'), 1200);
    return { ic: IMG('sticker_star') ? `<img src="${IMG('sticker_star')}" alt="" style="width:22px;height:22px">` : '⭐', t: `칭찬 스티커 +1장 (${S.sk.cur.length}/${SK.full})` };
  }
  function skPrize(kind) {
    if (!skOpen() || !skFull() || rt.paused) return false;
    const items = [];
    if (kind === 'gold') items.push(goldOr(SK.gold));
    else { const v = minAcorns(SK.acornMin); S.budget += v; earn(v); items.push({ ic: 'acorn', t: `도토리 +${fmt(v)}` }); }
    S.sk.done.push({ mo: S.sk.mo || skMonth(), d: gameToday(), s: S.sk.cur.slice(0, SK.full) });
    if (S.sk.done.length > SK.keep) S.sk.done.splice(0, S.sk.done.length - SK.keep);
    S.sk.cur = []; S.sk.mo = skMonth(); S.sk.st.boards += 1; rt.skNew = -1;
    save(); renderHUD(); checkQuests();
    closeModal($('#mSticker'));
    showReward({ title: '반 전체 상!', sub: '스티커판을 다 채웠어요. 새 판을 붙였어요', art: IMG('sticker_prize') ? `<img src="${IMG('sticker_prize')}" alt="" style="width:130px;height:130px">` : '🏅', big: '칭찬 스티커판', items });
    return true;
  }
  function openSticker() {
    if (!skOpen()) { toast(`칭찬 스티커판은 ${TIERS[SK.tier].name}부터 열려요`); return; }
    if (rt.paused || rt.modalOpen) return;
    rt.skView = 'cur'; rt.skPage = Math.max(0, S.sk.done.length - 1);
    renderSticker(); openModal($('#mSticker')); sfx('tap');
    setTimeout(() => { rt.skNew = -1; }, 800);
  }
  function skBoardHTML(mo, list, ring) {
    const bg = IMG('sticker_board_' + String(mo).padStart(2, '0'));
    let h = bg ? '' : '<i class="sk-fb"></i>';
    for (let i = 0; i < SK.full; i++) {
      const x = SK_X[i % 5], y = SK_Y[Math.floor(i / 5)], k = list[i];
      if (k == null) { if (ring && !bg) h += `<span class="sk-st ring" style="left:${x}%;top:${y}%"></span>`; continue; }
      const im = IMG('sticker_' + SK_KINDS[k]);
      h += `<span class="sk-st${ring && i === rt.skNew ? ' new' : ''}" style="left:${x}%;top:${y}%">${im ? `<img src="${im}" alt="" draggable="false">` : '⭐'}</span>`;
    }
    return { h, bg };
  }
  function renderSticker() {
    if (!$('#mSticker') || !S.sk) return;
    const old = rt.skView === 'old' && S.sk.done.length > 0;
    $$('#skSeg [data-sv]').forEach(b => b.setAttribute('aria-checked', (b.dataset.sv === 'old') === old ? 'true' : 'false'));
    $('#skSegN').textContent = S.sk.done.length;
    const board = $('#skBoard');
    if (old) {
      rt.skPage = Math.max(0, Math.min(S.sk.done.length - 1, rt.skPage));
      const B = S.sk.done[rt.skPage], r = skBoardHTML(B.mo, B.s, false);
      board.innerHTML = r.h; board.style.backgroundImage = r.bg ? `url("${r.bg}")` : '';
      $('#skPgRow').hidden = false; $('#skPg').textContent = `${rt.skPage + 1}/${S.sk.done.length}`;
      $('#skPrev').setAttribute('aria-disabled', rt.skPage > 0 ? 'false' : 'true');
      $('#skNext').setAttribute('aria-disabled', rt.skPage < S.sk.done.length - 1 ? 'false' : 'true');
      $('#skLead').textContent = `${B.mo}월에 다 채운 판이에요.\n${B.d.replace(/^(\d+)-(\d+)-(\d+)$/, (m, y, mo, d) => `${y}년 ${+mo}월 ${+d}일`)}에 상을 받았어요.`;
      $('#skPrize').hidden = true;
      $('#skNote').textContent = nl(`다 채운 판 ${S.sk.done.length}장.`);
      return;
    }
    const mo = S.sk.cur.length ? (S.sk.mo || skMonth()) : skMonth(), r = skBoardHTML(mo, S.sk.cur, true);
    board.innerHTML = r.h; board.style.backgroundImage = r.bg ? `url("${r.bg}")` : '';
    $('#skPgRow').hidden = true;
    const full = skFull(), left = skLeft();
    $('#skLead').textContent = nl(full ? '스티커판을 다 채웠어요! 반 전체 상을 골라요.' : `미션이나 퀘스트를 끝내면 한 장. ${SK.full}장을 채우면 반 전체 상을 받아요.`);
    $('#skPrize').hidden = !full;
    if (full) {
      $('#skPickA').innerHTML = `도토리<br><small>+${fmt(minAcorns(SK.acornMin))}</small>`;
      $('#skPickG').innerHTML = `황금 도토리<br><small>+${SK.gold}개</small>`;
    }
    $('#skNote').textContent = nl(`${S.sk.cur.length}/${SK.full}장. ${full ? '상을 받으면 새 판이 붙어요.' : left > 0 ? `오늘 ${left}장 더 받을 수 있어요.` : '오늘 스티커는 다 받았어요. 내일 또 모아요.'}`);
  }

  // 소풍과 스티커판 저장 읽기
  function sanitize210(d, s) {
    s.pc = freshPc();
    const P = d.pc && typeof d.pc === 'object' ? d.pc : null;
    if (P) {
      s.pc.day = typeof P.day === 'string' ? P.day.slice(0, 10) : '';
      const kids = Array.isArray(P.kids) ? P.kids.filter(k => typeof k === 'string' && k.length < 20).slice(0, PCN.kids) : [];
      const at = numIn(P.at, 0, Date.now() + 366 * 86400000);
      if (at > 0 && kids.length) { s.pc.at = at; s.pc.kids = kids; s.pc.lunch = P.lunch === true; }
      s.pc.berry = Math.floor(numIn(P.berry, 0, 999));
      if (P.st && typeof P.st === 'object') { s.pc.st.n = Math.floor(numIn(P.st.n, 0, 1e6)); s.pc.st.ess = Math.floor(numIn(P.st.ess, 0, 1e7)); s.pc.st.berry = Math.floor(numIn(P.st.berry, 0, 1e6)); }
    }
    s.sk = freshSk();
    const K = d.sk && typeof d.sk === 'object' ? d.sk : null;
    if (K) {
      s.sk.day = typeof K.day === 'string' ? K.day.slice(0, 10) : '';
      s.sk.n = Math.floor(numIn(K.n, 0, SK.perDay));
      const okList = L => Array.isArray(L) ? L.filter(k => Number.isInteger(k) && k >= 0 && k < SK_KINDS.length).slice(0, SK.full) : [];
      s.sk.cur = okList(K.cur);
      s.sk.mo = Math.floor(numIn(K.mo, 0, 12));
      if (Array.isArray(K.done)) s.sk.done = K.done.filter(b => b && typeof b === 'object').slice(-SK.keep).map(b => ({ mo: Math.max(1, Math.floor(numIn(b.mo, 1, 12))), d: typeof b.d === 'string' ? b.d.slice(0, 10) : '', s: okList(b.s) }));
      if (K.st && typeof K.st === 'object') { s.sk.st.all = Math.floor(numIn(K.st.all, 0, 1e7)); s.sk.st.boards = Math.floor(numIn(K.st.boards, 0, 1e6)); }
    }
  }
  /* ---------- 학생과 추억 (프로젝트 문서 '학생과 추억 설계안 ') ----------
     동물 종류마다 이름과 생일이 있는 단짝 친구 한 명(유치원 5명, 전학생이 올 때마다 한 명씩, 최대 17명). 학교와 함께 자라서 종업식과 졸업식에도 남아요
     친밀도 하트 5칸: 쓰다듬기(친구마다 하루 1번, 지도에서 학생 누르기와 건물 창), 선물(정수 5, 하루 3번), 생일 케이크, 소풍, 반장 당선
     생일 잔치: 단짝 생일 + 단짝 생일이 없는 주에는 반 친구 생일 한 번(주마다 정해진 하루). 급식실(없으면 교실)에 케이크
     졸업 앨범: 종업식과 졸업식마다 한 쪽. 졸업식에는 하트가 가장 높은 단짝(♥2부터)이 편지를 남겨요. 숫자는 본부 제안 */
  const BF = { pat: 1, gift: 3, giftEss: 5, giftDay: 3, cake: 5, bdGift: 6, picnic: 1, elect: 2,
    hearts: [3, 10, 20, 35, 55], heartEss: [2, 3, 5, 8], heartGold: 1, bdMin: 20, bdMinClass: 10, albMax: 100, letterMin: 2 };
  const FR_NAME_RE = /^[가-힣A-Za-z0-9]{1,4}$/;
  const FR_LINES = {
    any: ['오늘도 학교 오는 길이 신났어요!', '교장 선생님, 안녕하세요!', '도토리 하나 주웠어요. 보여 드릴까요?', '쉬는 시간이 제일 좋아요.',
      '숙제 다 했어요. 칭찬해 주세요!', '내일은 날씨가 맑을까요?', '친구랑 술래잡기했어요.', '학교가 점점 멋져져요!'],
    classroom: ['선생님 이야기가 재미있어요.', '오늘 받아쓰기 다 맞았어요!', '제 자리는 창가라 햇살이 좋아요.', '오늘은 칠판 지우기 당번이에요.'],
    cafeteria: ['오늘 도토리 죽 최고예요!', '반찬 남기지 않았어요.', '급식 선생님이 웃어 주셨어요.', '후식으로 산딸기가 나왔어요!'],
    library: ['그림책 세 권 읽었어요.', '도서관은 조용해서 좋아요.', '공룡 책을 빌렸어요!', '책 냄새가 참 좋아요.'],
    playground: ['그네를 제일 높이 탔어요!', '미끄럼틀 한 번 더!', '달리기 시합해요!', '모래성 쌓았어요.'],
    science: ['돋보기로 개미를 봤어요.', '실험은 늘 두근두근해요.', '무지개 거품 또 만들고 싶어요!', '저 커서 과학자 될래요.'],
    store: ['매점 빵이 제일 맛있어요.', '용돈 모아서 간식 샀어요.', '줄 서서 기다렸어요.', '오늘의 간식은 뭘까요?'],
    dorm: ['룸메이트랑 밤새 이야기했어요.', '2층 침대 위 칸이 제 자리예요!', '사감 선생님 발소리가 들려요.', '자율학습 끝나고 별 봤어요.'],
    union: ['동아리 게시판에 새 글이 붙었어요.', '학생회관 소파가 제일 푹신해요.', '자판기에서 도토리 우유 뽑았어요!', '무대에서 노래 연습했어요.'],
    institute: ['실험이 드디어 성공했어요!', '화이트보드가 수식으로 꽉 찼어요.', '커피 머신 앞 줄이 제일 길어요.', '연구 노트를 세 권째 쓰고 있어요.'],
    gradhall: ['세미나 발표 연습 중이에요.', '논문 서가에서 옛 논문을 찾았어요.', '옥상 정원에서 머리를 식혀요.', '발표 스크린이 너무 커서 떨려요.'],
    close: ['교장 선생님이 제일 좋아요!', '우리 학교라서 정말 다행이에요.', '나중에 커서도 꼭 놀러 올게요.']
  };
  // 단짝 한마디도 학교급마다(중학교, 고등학교, 대학교). 그 학교급 글에 없는 건물은 예전 글을 써요
  const FR_TIER = {
    2: { any: ['오늘도 지각은 안 했어요.', '교장 선생님, 안녕하세요.', '쉬는 시간에 매점 다녀왔어요.', '수행평가 다 냈어요. 칭찬해 주세요.', '친구랑 떡볶이 먹기로 했어요.', '학교가 점점 멋져져요.'], classroom: ['창가 자리 뽑았어요!', '칠판 당번이에요.', '오늘 발표 안 걸렸어요.'], cafeteria: ['오늘 급식 메뉴 외워 왔어요.', '두 번 받아도 돼요?', '후식으로 산딸기 요구르트가 나왔어요.'], library: ['만화책인 줄 알고 빌렸는데 소설이었어요.', '도서관은 시원해서 좋아요.', '독후감 쓸 책 골랐어요.'], playground: ['점심시간에 축구했어요.', '오래달리기 싫어요…', '피구에서 끝까지 살아남았어요!'], science: ['알코올램프 처음 켜 봤어요.', '실험 보고서가 더 어려워요.', '현미경으로 양파 껍질 봤어요.'], store: ['매점 빵은 쉬는 시간에 다 팔려요.', '용돈이 벌써 떨어졌어요.', '친구 것도 사 왔어요.'], close: ['교장 선생님이 제일 편해요.', '우리 학교라서 다행이에요.', '졸업해도 놀러 올게요.'] },
    3: { any: ['오늘도 무사히 등교했어요.', '교장 선생님, 안녕하세요.', '모의고사 끝났어요. 살았어요.', '쉬는 시간에 잠깐 잤어요.', '친구랑 문제집 바꿔 풀었어요.', '학교가 점점 멋져져요.'], classroom: ['맨 뒷자리가 제일 좋아요.', '칠판 글씨가 두 겹으로 보여요.', '자습 시간에 한 장 풀었어요.'], cafeteria: ['급식표에 형광펜 칠해 놨어요.', '오늘은 줄이 짧았어요!', '영양 선생님이 한 국자 더 주셨어요.'], library: ['도서관 구석 자리가 제 자리예요.', '소설 읽다가 종 치는 걸 못 들었어요.', '빌린 책 연체됐어요…'], playground: ['체육 시간이 일주일의 낙이에요.', '농구 골대 아래가 제 자리예요.', '한 바퀴 돌고 오면 잠이 깨요.'], science: ['실험은 재미있는데 계산이 문제예요.', '과학실 냄새가 좋아요.', '시험관을 안 깼어요. 오늘은요.'], store: ['매점 커피 우유 없으면 못 버텨요.', '종 치자마자 뛰었어요.', '오늘은 제가 살게요.'], dorm: ['룸메이트랑 밤새 이야기했어요.', '2층 침대 위 칸이 제 자리예요.', '야자 끝나고 별 봤어요.'], close: ['교장 선생님 덕분에 버텨요.', '우리 학교라서 다행이에요.', '졸업하고도 꼭 찾아올게요.'] },
    4: { any: ['오늘 1교시가 있었어요. 해냈어요.', '총장님, 안녕하세요.', '공강이 세 시간이에요.', '과제 다 냈어요. 칭찬해 주세요.', '동기랑 밥 먹기로 했어요.', '캠퍼스가 점점 멋져져요.'], classroom: ['교수님 농담에 저만 웃었어요.', '앞줄에 앉아 봤어요.', '출석 부를 때 딱 들어왔어요.'], cafeteria: ['학생 식당이 제일 싸고 맛있어요.', '오늘은 돈가스 나오는 날이에요.', '혼자 먹어도 괜찮아요.'], library: ['시험 기간이라 자리가 없어요.', '전공 책이 베개만 해요.', '책 사이에서 네잎클로버가 나왔어요.'], playground: ['저녁마다 트랙을 돌아요.', '과 대항전 연습했어요.', '잔디밭에 누우면 하늘이 넓어요.'], science: ['실험 수업이 여섯 시간이에요.', '결과가 처음으로 맞게 나왔어요!', '실험복이 이제 좀 어울려요.'], store: ['매점 삼각김밥으로 버텨요.', '밤에도 불이 켜져 있어서 좋아요.', '동기 것도 샀어요.'], dorm: ['룸메이트가 야식을 시켰어요.', '창밖으로 캠퍼스가 다 보여요.', '빨래방에서 친구를 사귀었어요.'], union: ['동아리 게시판에 새 글이 붙었어요.', '학생회관 소파가 제일 푹신해요.', '무대에서 노래 연습했어요.'], close: ['총장님이 계셔서 든든해요.', '이 학교 오길 정말 잘했어요.', '졸업해도 꼭 찾아올게요.'] } };
  const frLines = () => FR_TIER[S.tier] || FR_LINES;
  const frOf = sp => (S && S.fr && S.fr[sp]) || null;
  const frNm = sp => { const f = frOf(sp); return f ? f.nm : spName(sp); };
  const frFull = sp => frOf(sp) ? `${spName(sp)} ${frOf(sp).nm}` : spName(sp);   // 토끼 도토리
  const frHeart = p => BF.hearts.filter(v => p >= v).length;
  const frList = () => S && S.fr ? speciesList().filter(sp => S.fr[sp]) : [];
  const frToday = f => !!f && f.pat === gameToday();
  const frRec = sp => { const f = frOf(sp); return f ? f.n.pc + f.n.bd + f.n.el : 0; };
  // 하트가 높은 순서(같으면 받은 순서 그대로라, 섞어서 주면 고르게 뽑혀요)
  const frRank = L => L.slice().sort((a, b) => ((frOf(b) || {}).p || 0) - ((frOf(a) || {}).p || 0));
  const frHash = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const heartIc = () => IMG('bond_heart') ? `<img src="${IMG('bond_heart')}" alt="" style="width:22px;height:22px">` : '♥';
  function heartsHTML(p) {
    const n = frHeart(p), on = IMG('bond_heart'), off = IMG('bond_heart_empty');
    return Array.from({ length: BF.hearts.length }, (_, i) => on && off ? `<img src="${i < n ? on : off}" alt="">` : (i < n ? '♥' : '♡')).join('');
  }
  // 새 단짝: 이름은 다른 단짝과 겹치지 않게, 생일은 생일이 가장 적은 달에(같은 날은 피해요)
  function frMake(sp) {
    if (!S || !S.fr || S.fr[sp]) return false;
    const F = Object.values(S.fr), used = F.map(f => f.nm), free = KID_NAMES.filter(n => !used.includes(n));
    const pool = free.length ? free : KID_NAMES, nm = pool[Math.floor(Math.random() * pool.length)];
    const cnt = Array(12).fill(0); F.forEach(f => { cnt[f.bm - 1] += 1; });
    const lo = Math.min(...cnt), ms = []; cnt.forEach((c, i) => { if (c === lo) ms.push(i + 1); });
    const bm = ms[Math.floor(Math.random() * ms.length)];
    let bd = 1 + Math.floor(Math.random() * 28);
    for (let t = 0; t < 28 && F.some(f => f.bm === bm && f.bd === bd); t++) bd = bd % 28 + 1;
    S.fr[sp] = { nm, bm, bd, p: 0, pat: '', n: { pc: 0, bd: 0, el: 0 } };
    return true;
  }
  // 만난 종류마다 단짝을 만들어요(옛 저장도). 중학교 명부의 종류마다 첫 학생은 단짝 이름을 써요
  function frSync() {
    if (!S || !S.fr) return false;
    let ch = false;
    for (const sp of speciesList()) if (frMake(sp)) ch = true;
    if (frRosterLink()) ch = true;
    return ch;
  }
  function frRosterLink() {
    if (!S.roster || !Array.isArray(S.roster.list) || !S.roster.list.length) return false;
    let ch = false;
    const seen = new Set();
    for (const s of S.roster.list) {
      if (seen.has(s.sp)) continue;
      seen.add(s.sp);
      const f = S.fr[s.sp];
      if (!f || s.nm === f.nm) continue;
      const old = s.nm, clash = S.roster.list.find(x => x !== s && x.nm === f.nm);
      if (clash) {   // 다른 명부 학생이 그 이름을 쓰면 그 학생은 비어 있는 이름으로
        const taken = S.roster.list.map(x => x.nm).concat(Object.values(S.fr).map(x => x.nm));
        const nm2 = KID_NAMES.find(n => !taken.includes(n)) || old;
        if (S.el && Array.isArray(S.el.cand)) S.el.cand.forEach(c => { if (c.sp === clash.sp && c.nm === clash.nm) c.nm = nm2; });
        clash.nm = nm2;
      }
      if (S.el && Array.isArray(S.el.cand)) S.el.cand.forEach(c => { if (c.sp === s.sp && c.nm === old) c.nm = f.nm; });
      s.nm = f.nm; ch = true;
    }
    return ch;
  }
  // 친밀도를 더해요. 하트가 오르면 보상(♥1~4 숲의 정수, ♥5 황금 도토리)을 주고 보상 줄 목록을 돌려줘요
  function frAddP(sp, v, quiet) {
    const f = frOf(sp); if (!f || !(v > 0)) return [];
    const was = frHeart(f.p);
    f.p = Math.min(1e6, f.p + Math.floor(v));
    const now = frHeart(f.p), items = [];
    for (let h = was + 1; h <= now; h++) {
      if (h <= BF.heartEss.length) { addEss(BF.heartEss[h - 1]); items.push({ ic: 'ess', t: `${frFull(sp)} 하트 ${h}칸! 숲의 정수 +${BF.heartEss[h - 1]}` }); }
      else { addGold(BF.heartGold); items.push({ ic: 'gold', t: `${frFull(sp)} 하트 ${h}칸! 황금 도토리 +${BF.heartGold}` }); }
    }
    if (items.length && !quiet) { sfx('quest'); toast(items.map(x => x.t).join('\n')); }
    return items;
  }
  function frRefresh() { if (rt.tab === 'dex') renderDex(); if (rt.sheetKey) renderSheet(); if (rt.tab === 'grad') renderGradPanel(true); }
  // 쓰다듬기: 친구마다 하루 한 번, 공짜
  function frPat(sp, x, y, quiet) {
    const f = frOf(sp); if (!f || rt.paused) return false;
    if (frToday(f)) { if (!quiet) toast(`${eun(frFull(sp))} 오늘 이미 쓰다듬었어요`); return false; }
    f.pat = gameToday(); S.frc.pat += 1;
    const items = frAddP(sp, BF.pat, true);
    sfx('tap'); buzz(8);
    if (x != null) frHeartFx(x, y);
    if (items.length) { sfx('quest'); toast(items.map(i => i.t).join('\n')); }
    else if (!quiet) toast(`${eul(frFull(sp))} 쓰다듬었어요 ♥`);
    save(); checkQuests(); frRefresh();
    return true;
  }
  // 도감에서 모두 쓰다듬기: 오늘 아직 안 쓰다듬은 단짝을 한 번에(하나씩 쓰다듬기와 같은 값)
  const frPatLeft = () => frList().filter(sp => { const f = frOf(sp); return f && !frToday(f); });
  function frPatAll() {
    if (rt.paused) return 0;
    const L = frPatLeft(); if (!L.length) { toast('오늘은 모두 쓰다듬었어요'); return 0; }
    const items = [];
    for (const sp of L) { const f = frOf(sp); f.pat = gameToday(); S.frc.pat += 1; items.push(...frAddP(sp, BF.pat, true)); }
    sfx(items.length ? 'quest' : 'tap'); buzz(8);
    toast([`단짝 ${L.length}명을 쓰다듬었어요 ♥`, ...items.map(i => i.t)].join('\n'));
    save(); checkQuests(); frRefresh();
    return L.length;
  }
  function frHeartFx(x, y) {
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', x.toFixed(1)); t.setAttribute('y', y.toFixed(1)); t.setAttribute('text-anchor', 'middle'); t.setAttribute('class', 'fr-heart');
    t.textContent = '♥';
    layerFx.appendChild(t);
    if (rt.reduced || !t.animate) { setTimeout(() => t.remove(), 900); return; }
    t.animate([{ transform: 'translateY(0px)', opacity: 1 }, { transform: 'translateY(-18px)', opacity: 0 }], { duration: 900, easing: 'ease-out' }).onfinish = () => t.remove();
  }
  // 선물: 숲의 정수 5, 하루 3번(친구 모두 합쳐). 생일인 친구에게는 두 배
  function frGiftLeft() {
    if (!S || !S.frg) return 0;
    if (dayRoll(S.frg)) { S.frg.n = 0; }
    return Math.max(0, BF.giftDay - S.frg.n);
  }
  function frGift(sp) {
    const f = frOf(sp); if (!f || rt.paused) return false;
    if (frGiftLeft() <= 0) { toast(`선물은 하루 ${BF.giftDay}번까지예요. 내일 또 줘요`); return false; }
    if (S.ess < BF.giftEss) { toast(essShort(BF.giftEss - S.ess)); return false; }
    S.ess -= BF.giftEss; S.st.esSpent = (S.st.esSpent || 0) + BF.giftEss; renderEss();
    S.frg.n += 1; S.frc.gift += 1;
    const bp = bdParty(), bdNow = !!bp && bp.fr && bp.sp === sp, v = bdNow ? BF.bdGift : BF.gift;
    const items = [{ ic: heartIc(), t: `친밀도 +${v}${bdNow ? ' (생일 선물)' : ''}` }].concat(frAddP(sp, v, true));
    sfx('quest'); buzz(12);
    showReward({ title: '선물을 줬어요!', sub: `${iga(frFull(sp))} ${bdNow ? '생일 선물이라 정말 기뻐해요' : '기뻐해요'}`,
      art: IMG(bdNow ? 'bday_gift' : 'bond_gift') ? `<img src="${IMG(bdNow ? 'bday_gift' : 'bond_gift')}" alt="" style="width:96px;height:96px;object-fit:contain">` : '', items });
    save(); checkQuests(); frRefresh();
    return true;
  }
  // 선물 남은 번 모두 주기: 한 번씩 줄 때와 같은 값으로 주고, 보상 창은 하나로 모아요
  function frGiftAll(sp) {
    const f = frOf(sp); if (!f || rt.paused || rt.batch) return 0;
    const B = rt.batch = { items: [], n: 0 }; let n = 0;
    try { while (frGiftLeft() > 0 && S.ess >= BF.giftEss && n < 20 && frGift(sp)) n += 1; } finally { rt.batch = null; }
    if (!n) { frGift(sp); return 0; }
    const hearts = B.items.filter(it => /^친밀도 \+/.test(it.t)), sum = hearts.reduce((a, it) => a + (+(/\+(\d+)/.exec(it.t) || [0, 0])[1]), 0);
    showReward({ title: `선물을 ${n}번 줬어요!`, sub: `${iga(frFull(sp))} 정말 기뻐해요`,
      art: IMG('bond_gift') ? `<img src="${IMG('bond_gift')}" alt="" style="width:96px;height:96px;object-fit:contain">` : '',
      items: [{ ic: heartIc(), t: `친밀도 +${sum}` }].concat(psMergeItems(B.items.filter(it => !hearts.includes(it)))) });
    return n;
  }
  function frRename(sp, v) {
    const f = frOf(sp); if (!f) return false;
    const nm = String(v || '').trim();
    if (!FR_NAME_RE.test(nm)) { toast('한글, 영어, 숫자로 1~4글자를 적어 주세요'); return false; }
    if (nm === f.nm) return true;
    if (Object.keys(S.fr).some(k => k !== sp && S.fr[k].nm === nm)) { toast('다른 단짝이 쓰는 이름이에요'); return false; }
    f.nm = nm;
    frRosterLink();
    sfx('quest'); toast(`이제 ${spName(sp)} ${nm}${batchim(nm) ? '이에요' : '예요'}!`);
    save(); frRefresh();
    return true;
  }
  function openFrName(sp) {
    const f = frOf(sp); if (!f || rt.paused) return;
    rt.frNameSp = sp;
    $('#frNameLead').textContent = `${frFull(sp)}의 새 이름을 정해요.`;
    $('#frNameIn').value = f.nm;
    openModal($('#mFrName')); sfx('tap');
    setTimeout(() => { try { $('#frNameIn').focus(); $('#frNameIn').select(); } catch (e) { /* 초점을 못 줘도 괜찮아요 */ } }, 60);
  }
  // 한 줄 대사: 건물마다 4줄 + 어디서나 8줄 + 하트 3칸부터 3줄. 생일이면 생일 말
  function frPool(sp, k) {
    const f = frOf(sp);
    const L = frLines();
    return (L[k] || FR_LINES[k] || []).concat(L.any, f && frHeart(f.p) >= 3 ? L.close : []);
  }
  function frLine(sp, k) {
    const bp = bdParty();
    if (bp && bp.fr && bp.sp === sp && !bdDoneToday()) return `오늘 제 생일이에요! ${FAC[bdPlace()].name}에 케이크가 있어요.`;
    const pool = frPool(sp, k);
    return pool[Math.floor(Math.random() * pool.length)];
  }
  const frLineDay = (sp, k) => { const bp = bdParty(); if (bp && bp.fr && bp.sp === sp && !bdDoneToday()) return frLine(sp, k); const pool = frPool(sp, k); return pool[frHash(gameToday() + sp + k) % pool.length]; };
  // 건물 창의 '여기 있는 친구': 날마다 바뀌어요(지어진 건물만)
  function frHere(k) {
    const L = frList(); if (!L.length || !(S.f[k] >= 1)) return '';
    return L[frHash(gameToday() + ':' + k) % L.length];
  }
  function frSheet(k) {
    const row = $('#sheetFriend'), sp = frHere(k);
    row.hidden = !sp;
    if (sp) {
      const f = frOf(sp), done = frToday(f);
      row.dataset.sp = sp;
      setH($('#sheetFriendIc'), kidAvatar(sp));
      setH($('#sheetFriendNm'), `${esc(frFull(sp))}<span class="fr-mini" aria-label="하트 ${frHeart(f.p)}칸">${heartsHTML(f.p)}</span>`);
      setT($('#sheetFriendTx'), headText(frLineDay(sp, k)));
      setT($('#sheetFriendGo'), done ? '♥ 오늘 했어요' : '쓰다듬기');
      row.setAttribute('aria-label', `${frFull(sp)}, ${done ? '오늘 쓰다듬었어요' : '눌러서 쓰다듬기'}`);
    }
    const br = $('#sheetBday'), bp = bdParty(), bOn = !!bp && bdPlace() === k && !bdDoneToday();
    br.hidden = !bOn;
    if (bOn) {
      setH($('#sheetBdayIc'), IMG('bday_cake') ? `<img src="${IMG('bday_cake')}" alt="">` : '🎂');
      setT($('#sheetBdayTx'), bp.fr ? `오늘은 ${frFull(bp.sp)}의 생일이에요!` : `오늘은 반 친구 ${spName(bp.sp)} ${bp.nm}의 생일이에요!`);
      br.classList.add('todo');
    }
  }
  // 도감 학생 카드 아래 단짝 칸
  function frDexBox(sp) {
    if (!DEX_STUDENTS.includes(sp)) return '';
    const f = frOf(sp); if (!f) return '';
    const h = frHeart(f.p), next = BF.hearts[h], done = frToday(f), left = frGiftLeft();
    const pat = IMG('bond_pat') ? `<img src="${IMG('bond_pat')}" alt="">` : '', gift = IMG('bond_gift') ? `<img src="${IMG('bond_gift')}" alt="">` : '';
    return `<div class="fr-box"><div class="fr-top"><b>${esc(f.nm)}</b><button class="fr-ren" type="button" data-fr-ren="${sp}" aria-label="${esc(f.nm)} 이름 바꾸기">✎</button>` +
      `<span class="fr-hearts" aria-label="친밀도 하트 ${h}칸">${heartsHTML(f.p)}</span></div>` +
      `<small>생일 ${f.bm}월 ${f.bd}일. 함께한 기록: 소풍 ${f.n.pc}번, 생일 잔치 ${f.n.bd}번, 반장 ${f.n.el}번</small>` +
      `<div class="fr-act"><button class="btn-sub small" type="button" data-fr-pat="${sp}"${done ? ' aria-disabled="true"' : ''}>${pat}${done ? '오늘 쓰다듬었어요' : '쓰다듬기'}</button>` +
      `<button class="btn-sub small" type="button" data-fr-gift="${sp}"${left <= 0 || S.ess < BF.giftEss ? ' aria-disabled="true"' : ''}>${gift}선물 (정수 ${BF.giftEss})</button>` +
      (left >= 2 && S.ess >= BF.giftEss * 2 ? `<button class="btn-sub small" type="button" data-fr-gift-all="${sp}">선물 ${Math.min(left, Math.floor(S.ess / BF.giftEss))}번 모두 (정수 ${Math.min(left, Math.floor(S.ess / BF.giftEss)) * BF.giftEss})</button>` : '') + '</div>' +
      `<small>${next ? `다음 하트까지 친밀도 ${next - f.p}` : '하트를 모두 채웠어요!'}. 오늘 선물 ${left}번 남았어요</small></div>`;
  }
  const frDexKey = sp => { const f = frOf(sp); return f ? [f.nm, f.p, f.pat === gameToday() ? 1 : 0, frGiftLeft(), S.ess >= BF.giftEss ? 1 : 0, f.n.pc, f.n.bd, f.n.el].join(',') : ''; };
  // 지도에서 학생 누르기: 이름 말풍선과 쓰다듬기
  function frKidTap(k) {
    if (!S || rt.paused || rt.decoEdit || rt.viewTier != null || rt.fest || rt.sports) return false;
    frSync();
    const sp = k.sp, f = frOf(sp); if (!f) return false;
    const x = k.x, y = k.y - 14;
    const patted = !frToday(f) && frPat(sp, x, y - 8, true);
    mapBubble(x, y - 20, frFull(sp) + (patted ? ' ♥' : ''), frLine(sp, ''));
    return true;
  }
  function mapBubble(x, y, name, line) {
    line = headText(line);
    if (rt.frBub) { rt.frBub.remove(); rt.frBub = null; }
    const W = 158, H = 40, bx = Math.max(W / 2 + 4, Math.min(360 - W / 2 - 4, x)), by = Math.max(-56 + H, y);
    const L = IMG('bond_bubble_light'), D = IMG('bond_bubble_dark');
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'fr-bub'); g.setAttribute('pointer-events', 'none');
    g.setAttribute('transform', `translate(${bx.toFixed(1)} ${by.toFixed(1)})`);
    g.innerHTML = (L ? `<image class="bb-l" href="${L}" x="${-W / 2}" y="${-H}" width="${W}" height="${H + 6}" preserveAspectRatio="none"/>` : `<rect class="bb-l" x="${-W / 2}" y="${-H}" width="${W}" height="${H}" rx="10" fill="#FFF8E7" stroke="#C99A5B"/>`) +
      (D ? `<image class="bb-d" href="${D}" x="${-W / 2}" y="${-H}" width="${W}" height="${H + 6}" preserveAspectRatio="none"/>` : '') +
      `<text class="fr-bub-t" x="0" y="${-H + 16}" text-anchor="middle">${esc(name)}</text><text class="fr-bub-s" x="0" y="${-H + 28}" text-anchor="middle">${esc(line)}</text>`;
    layerFx.appendChild(g);
    rt.frBub = g;
    if (g.animate && !rt.reduced) g.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160 });
    setTimeout(() => { if (rt.frBub === g) { g.remove(); rt.frBub = null; } }, 2800);
  }

  /* 생일 잔치: 오늘 생일인 단짝. 없으면, 이번 주(월~일)에 단짝 생일이 하나도 없을 때만 주마다 정해진 하루에 반 친구(이름 없는 학생) 생일 */
  function bdParty(day) {
    if (!S || !S.fr) return null;
    day = day || gameToday();
    const L = frList(), memo = rt.bdMemo, mk = day + '|' + L.map(sp => S.fr[sp].bm + '-' + S.fr[sp].bd).join(',');
    if (memo && memo.k === mk) return memo.v;
    const [Y, M, D] = day.split('-').map(Number);
    let v = null;
    const has = (m, d) => L.find(sp => S.fr[sp].bm === m && S.fr[sp].bd === d);
    const fsp = has(M, D);
    if (fsp) v = { sp: fsp, nm: S.fr[fsp].nm, fr: true };
    else if (Y && M && D) {
      const t = Date.UTC(Y, M - 1, D), wd = (new Date(t).getUTCDay() + 6) % 7, mon = t - wd * 86400000;
      let any = false;
      for (let i = 0; i < 7 && !any; i++) { const d = new Date(mon + i * 86400000); if (has(d.getUTCMonth() + 1, d.getUTCDate())) any = true; }
      const h = frHash('bd' + Math.round(mon / 86400000));
      if (!any && h % 7 === wd) {
        const SP = speciesList(), used = Object.values(S.fr).map(f => f.nm), free = KID_NAMES.filter(n => !used.includes(n));
        const pool = free.length ? free : KID_NAMES;
        v = { sp: SP[(h >>> 3) % SP.length], nm: pool[(h >>> 9) % pool.length], fr: false };
      }
    }
    rt.bdMemo = { k: mk, v };
    return v;
  }
  const bdDoneToday = () => !!S && !!S.bday && S.bday.day === gameToday() && S.bday.done;
  const bdPlace = () => S && S.f.cafeteria >= 1 ? 'cafeteria' : 'classroom';
  function bdClaim() {
    const p = bdParty(); if (!p || bdDoneToday() || rt.paused) return false;
    S.bday = { day: gameToday(), done: true }; S.frc.cake += 1;
    const v = minAcorns(p.fr ? BF.bdMin : BF.bdMinClass); S.budget += v; earn(v);
    const items = [{ ic: 'acorn', t: `도토리 +${fmt(v)}` }];
    if (p.fr) {
      const f = frOf(p.sp);
      if (f) { f.n.bd += 1; items.push({ ic: heartIc(), t: `${frFull(p.sp)} 친밀도 +${BF.cake}` }); items.push(...frAddP(p.sp, BF.cake, true)); }
    }
    bdConfetti();
    sfx('quest'); buzz([20, 40, 20]);
    showReward({ title: '생일 축하해요!', sub: p.fr ? `오늘은 ${frFull(p.sp)}의 생일이에요. 다 같이 케이크를 나눠 먹었어요` : `오늘은 반 친구 ${spName(p.sp)} ${p.nm}의 생일이에요. 다 같이 축하했어요`,
      art: IMG('bday_cake') ? `<img src="${IMG('bday_cake')}" alt="" style="width:110px;height:110px;object-fit:contain">` : '', items });
    save(); renderHUD(); bdRender(true); frRefresh(); checkQuests();
    return true;
  }
  function bdConfetti() {
    const u = IMG('bday_confetti'), k = bdPlace(), b = bpos(k); if (!u || !b || rt.reduced) return;
    const [cx, cy, w] = b, im = document.createElementNS(NS, 'image');
    im.setAttribute('href', u); im.setAttribute('x', (cx - w * 0.5).toFixed(1)); im.setAttribute('y', (cy - w * 0.9).toFixed(1));
    im.setAttribute('width', w.toFixed(1)); im.setAttribute('height', w.toFixed(1)); im.setAttribute('pointer-events', 'none');
    layerFx.appendChild(im);
    if (!im.animate) { setTimeout(() => im.remove(), 1200); return; }
    im.animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)', offset: 0.3 }, { opacity: 0, transform: 'scale(1.1)' }],
      { duration: 1400, easing: 'ease-out' }).onfinish = () => im.remove();
    im.style.transformBox = 'fill-box'; im.style.transformOrigin = '50% 50%';
  }
  // 지도: 잔치 날에는 그 건물 위에 깃발 줄, 옆에 케이크(누르면 잔치). 케이크를 먹으면 깃발만 남아요
  function bdRender(force) {
    if (!S) return;
    const p = bdParty(), done = bdDoneToday(), k = bdPlace(), b = bpos(k);
    const key = [p ? p.sp + p.nm : '', done, k, b ? b.join(',') : '', rt.viewTier == null ? '' : rt.viewTier, rt.decoEdit ? 1 : 0].join('|');
    if (!force && rt.bdKey === key) return;
    rt.bdKey = key;
    let g = document.getElementById('bdayG');
    if (!g) { g = document.createElementNS(NS, 'g'); g.id = 'bdayG'; layerFx.parentNode.insertBefore(g, layerFx); }
    g.innerHTML = '';
    if (!p || !b || rt.viewTier != null || rt.decoEdit || !(S.f[k] >= 1)) return;
    const [cx, cy, w] = b, ban = IMG('bday_banner'), cake = IMG('bday_cake');
    if (ban) g.insertAdjacentHTML('beforeend', `<image href="${ban}" x="${(cx - w * 0.42).toFixed(1)}" y="${(cy - w * 0.56).toFixed(1)}" width="${(w * 0.84).toFixed(1)}" height="${(w * 0.21).toFixed(1)}" pointer-events="none"/>`);
    if (!done) {
      const s = 28, x = cx + w * 0.4, y = cy + w * 0.24;
      g.insertAdjacentHTML('beforeend', `<g class="bd-cake" role="button" tabindex="0" aria-label="생일 케이크, 눌러서 축하하기"><circle cx="${x.toFixed(1)}" cy="${(y - s / 2).toFixed(1)}" r="${s * 0.62}" fill="transparent"/>` +
        (cake ? `<image href="${cake}" x="${(x - s / 2).toFixed(1)}" y="${(y - s).toFixed(1)}" width="${s}" height="${s}"/>` : `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" font-size="18">🎂</text>`) + '</g>');
      const c = g.querySelector('.bd-cake');
      c.addEventListener('click', e => { e.stopPropagation(); bdClaim(); });
      c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bdClaim(); } });
    }
  }
  // 생일인 친구 한 명(지도 위 그 종류의 첫 학생)이 고깔모자를 써요
  function bdHats() {
    const p = bdParty(), want = p ? p.sp : '';
    const k = want ? rt.kids.find(x => x.sp === want) : null;
    if (rt.bdHatK && rt.bdHatK !== k) {
      const o = rt.bdHatK; rt.bdHatK = null;
      if (rt.kids.includes(o)) { o.g.innerHTML = kidSVG(o.rare ? o.sp + '_rare' : o.sp, o.bag); rt.elBadgeT = ''; }   // 5.3.4.6: 희귀 겉모습 그대로
    }
    if (k && rt.bdHatK !== k && IMG('cos_hat_bday')) { k.g.innerHTML = kidSVG(k.rare ? k.sp + '_rare' : k.sp, k.bag, { hat: 'bday', neck: S.cos.neck }); rt.bdHatK = k; rt.elBadgeT = ''; }
  }
  function frTick() {
    if (!S || !S.fr) return;
    if (frSync()) save();
    const tap = !(window.__FOREST_TEST && !window.__FOREST_KIDTAP) && !rt.decoEdit && rt.viewTier == null;
    if (layerKids.classList.contains('tap') !== tap) layerKids.classList.toggle('tap', tap);
    if (S.bday.day && S.bday.day !== gameToday()) { S.bday = { day: '', done: false }; }
    bdRender(); bdHats();
    const gb = $('#gAlbumTx');
    if (gb && rt.tab === 'grad') { const t = `${S.alb.length}쪽, 단짝 친구 ${frList().length}명`; if (gb.textContent !== t) { gb.textContent = t; $('#gAlbumIc').innerHTML = IMG('album_cover') ? `<img src="${IMG('album_cover')}" alt="">` : '📔'; } }
  }

  /* 졸업 앨범: 종업식('y')과 졸업식('g')마다 한 쪽. 사진 칸 6개는 그해 하트가 높은 단짝, 큰 사진은 그 학교급 지도 */
  const ALB_MAP = ['map_kinder', 'map_elem', 'map_middle', 'map_high'];
  const ALB_SLOTS = [[14.2, 20.2], [31, 20.2], [14.2, 39.5], [31, 39.5], [14.2, 58.6], [31, 58.6]];
  // 앨범 쪽 그림: 빈 지도 대신 그때 학교 모습(그때 건물 레벨로 지은 건물과 공사 자리). 학교급 모습 보기와 같은 그림 규칙
  function albSchool(pg) {
    const t = pg.t, G = GEO[geoIdx(t)]; if (!G) return '';
    const mk = mapKey(G.map), mapU = mapLo(mk); if (!mapU) return '';
    const f = pg.f || {}, bs = pg.bs || {}, items = [];
    const keys = Object.keys(FAC).filter(k => (FAC[k].tier || 0) <= t && G.lot[k]);
    for (const k of keys) {
      const built = (f[k] || 0) >= 1, im = seasonKey(built ? viewBldKey(k, t, bs[k] != null ? bs[k] : t, luxOn()) : SITE_IMG[k]), u = IMG170(im); if (!u) continue;
      const R = lotRect(G.lot[k], im), [cx, cy, w] = R;
      items.push({ y: cy, s: `<image href="${u}" x="${(cx - w / 2).toFixed(1)}" y="${(cy - w / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${w.toFixed(1)}"${xfAt(R)}/>` });
    }
    // 지도에 그려진 참나무를 쓰는 지도는 참나무 그림을 덧그리지 않아요
    if (G.oak && !MAP_OAK[mapKey(G.map)]) { const [ox, oy] = G.oak, u = IMG170(oakKey()); if (u) items.push({ y: oy + 20, s: `<image href="${u}" x="${ox - 34}" y="${oy - 41}" width="68" height="65"/>` }); }
    items.sort((a, b) => a.y - b.y);
    return `<svg class="m" viewBox="58 70 244 270" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><image x="0" y="-60" width="360" height="540" preserveAspectRatio="none" href="${mapU}"/>${items.map(o => o.s).join('')}</svg>`;
  }
  function albAdd(kind, extra) {
    const pg = Object.assign({ t: S.tier, y: S.tg + 1, k: kind, at: Date.now(), st: Math.floor(S.students), f: Object.assign({}, S.f), bs: Object.assign({}, S.bs), dip: 0,
      kids: frRank(frList()).slice(0, 6), el: (elPres() || {}).sp || '', ph: false, ltr: null, v: 0 }, extra || {});
    pg.ph = !!pg.ph; pg.dip = Math.max(0, Math.floor(pg.dip || 0));
    S.alb.push(pg);
    if (S.alb.length > BF.albMax) S.alb.splice(0, S.alb.length - BF.albMax);
    return pg;
  }
  // 옛 저장: 이미 지난 학교급은 졸업식 사진(S.snap)으로 졸업 쪽을 만들어요
  function albMigrate(s) {
    for (let t = 0; t < s.tier; t++) {
      const x = s.snap && s.snap[t];
      if (!x || s.alb.some(p => p.t === t && p.k === 'g')) continue;
      const kids = [...new Set((x.roster || []).map(r => r.sp))].filter(sp => DEX_STUDENTS.includes(sp)).slice(0, 6);
      s.alb.push({ t, y: TIERS[t].years, k: 'g', at: x.at || 0, st: x.st || 0, f: Object.assign({}, x.f), dip: 0, kids, el: '', ph: false, ltr: null, v: 0, old: true });
    }
    s.alb.sort((a, b) => a.t - b.t || a.y - b.y || (a.k === 'g') - (b.k === 'g') || a.at - b.at);
  }
  const albDate = t => { if (!t) return ''; const d = new Date(t); return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`; };
  function openAlbum() {
    if (!S || rt.paused) return;
    if (rt.modalOpen) closeModal(rt.modalOpen);
    S.frc.alb += 1;
    rt.albPage = -1;
    renderAlbum();
    openModal($('#mAlbum')); sfx('tap');
    save(); checkQuests();
  }
  function renderAlbum() {
    const box = $('#albBook'); if (!box || !S) return;
    const n = S.alb.length;
    rt.albPage = Math.max(-1, Math.min(n - 1, rt.albPage == null ? -1 : rt.albPage));
    const m = $('#mAlbum');
    m.style.setProperty('--alb-l', IMG('album_page_light') ? `url("${IMG('album_page_light')}")` : 'none');
    m.style.setProperty('--alb-d', IMG('album_page_dark') ? `url("${IMG('album_page_dark')}")` : 'none');
    $('#albPrev').disabled = rt.albPage <= -1; $('#albNext').disabled = rt.albPage >= n - 1;
    $('#albPg').textContent = rt.albPage < 0 ? `표지 (${n}쪽)` : `${rt.albPage + 1} / ${n}`;
    const lt = $('#albLetter');
    if (rt.albPage < 0) {
      box.className = 'alb-book';
      box.innerHTML = `<div class="alb-cover">${IMG('album_cover') ? `<img src="${IMG('album_cover')}" alt="">` : ''}<b>${esc(schoolTitle())}</b></div>`;
      $('#albLead').textContent = nl(n ? `종업식과 졸업식마다 한 쪽씩 쌓여요. 단짝 친구는 ${frList().length}명이에요.` : '아직 쪽이 없어요. 종업식이나 졸업식을 열면 첫 쪽이 생겨요.');
      lt.hidden = true;
      return;
    }
    const pg = S.alb[rt.albPage], today = gameToday().slice(5), map = IMG(ALB_MAP[pg.t] || ALB_MAP[0]);
    if (pg.k === 'tr' && TR2_BY[pg.pl]) {   // 수학여행 단체 사진 쪽
      box.className = 'alb-book pg trp';
      box.innerHTML = tr2Photo(pg.pl, pg.pk, pg.kids.concat(pg.kx || [])) + `<div class="alb-cap"><b>${esc(`${TIERS[pg.t].name} ${pg.y}${TIERS[pg.t].unit}`)}</b><span>수학여행, ${TR2_BY[pg.pl].name}</span><span>${albDate(pg.at)}</span></div>`;
      $('#albLead').textContent = pg.pk.map((j, i) => TR2_BY[pg.pl].stops[i] ? TR2_BY[pg.pl].stops[i].acts[j][0] : '').filter(Boolean).join(', ') + '.';
      lt.hidden = true; return;
    }
    box.className = 'alb-book pg';
    const bdSp = new Set(frList().filter(sp => `${String(S.fr[sp].bm).padStart(2, '0')}-${String(S.fr[sp].bd).padStart(2, '0')}` === today));
    const slots = ALB_SLOTS.map(([l, t], i) => {
      const sp = pg.kids[i];
      if (!sp) return `<div class="alb-slot" style="left:${l}%;top:${t}%"></div>`;
      return `<div class="alb-slot" style="left:${l}%;top:${t}%">${kidAvatar(sp)}<small>${esc(frNm(sp))}</small>` +
        (pg.el === sp && IMG('elect_badge') ? `<img class="alb-el" src="${IMG('elect_badge')}" alt="반장">` : '') +
        (bdSp.has(sp) && IMG('bday_cake') ? `<img class="alb-bd" src="${IMG('bday_cake')}" alt="오늘 생일">` : '') + '</div>';
    }).join('');
    const cn = pg.ph && IMG('album_corner') ? ['a', 'b', 'c', 'd'].map(c => `<img class="alb-cn ${c}" src="${IMG('album_corner')}" alt="">`).join('') : '';
    box.innerHTML = slots + `<div class="alb-big">${albSchool(pg) || (map ? `<img class="m" src="${map}" alt="">` : '')}</div>${cn}` +
      `<div class="alb-cap"><b>${esc(`${TIERS[pg.t].name} ${pg.y}${TIERS[pg.t].unit}`)}</b><span>${pg.k === 'g' ? '졸업식' : '종업식'}${pg.ph ? ', 단체 사진' : ''}</span><span>${albDate(pg.at)}</span></div>`;
    const facs = Object.keys(pg.f || {}).filter(k => FAC[k] && pg.f[k] > 0).map(k => `${k === 'playground' ? (pg.t >= 1 ? '운동장' : '놀이터') : FAC[k].name} Lv.${pg.f[k]}`).join(', ');
    $('#albLead').textContent = [`학생 ${pg.st}명${pg.dip ? `, 수료증 ${fmt(pg.dip)}장` : ''}${pg.old ? ' (옛 기록으로 만든 쪽)' : ''}.`, facs ? facs + '.' : '',
      pg.el ? `그때 반장은 ${frFull(pg.el)}.` : '', pg.v ? `졸업생 ${pg.v}명이 찾아왔어요.` : ''].filter(Boolean).join('\n');
    lt.hidden = !pg.ltr;
  }
  // 졸업 편지: 하트가 가장 높은 단짝(같으면 함께한 기록이 많은 친구). 하트 5칸이면 황금 도토리 1을 같이 넣어 줘요
  function frLetter(from) {
    const L = frList(); if (!L.length) return null;
    const sp = L.slice().sort((a, b) => (S.fr[b].p - S.fr[a].p) || (frRec(b) - frRec(a)))[0], f = S.fr[sp], h = frHeart(f.p);
    if (h < BF.letterMin) return null;
    const N = TIERS[S.tier + 1], lines = ['교장 선생님께', '', `${from.school}에서 보낸 날들이 정말 즐거웠어요.`];
    if (f.n.pc > 0) lines.push(`교장 선생님이 보내 준 숲속 소풍 ${f.n.pc}번, 하나도 잊지 않을게요.`);
    if (f.n.bd > 0) lines.push(`${FAC.cafeteria.name}에서 생일 케이크를 먹던 날이 제일 행복했어요.`);
    if (f.n.el > 0) lines.push('반장이 됐을 때 떨렸지만 정말 뿌듯했어요.');
    if (!f.n.pc && !f.n.bd && !f.n.el) lines.push('교장 선생님이 쓰다듬어 줄 때마다 힘이 났어요.');
    const gold = h >= BF.hearts.length ? BF.heartGold : 0;
    if (gold) { lines.push('교장 선생님은 제 가장 친한 친구예요. 작은 선물을 같이 넣었어요.'); addGold(gold); }
    lines.push(N ? `${N.school}에서도 잘 부탁드려요!` : '앞으로도 잘 부탁드려요!', '', `${spName(sp)} ${f.nm} 올림`);
    return { sp, nm: f.nm, h, txt: lines.join('\n'), gold };
  }
  function openLetter(pg, back) {
    if (!pg || !pg.ltr) return;
    const m = $('#mLetter');
    m.style.setProperty('--lt-l', IMG('bond_paper_light') ? `url("${IMG('bond_paper_light')}")` : 'none');
    m.style.setProperty('--lt-d', IMG('bond_paper_dark') ? `url("${IMG('bond_paper_dark')}")` : 'none');
    $('#ltTitle').textContent = `${pg.ltr.nm}의 졸업 편지`;
    $('#ltNav').hidden = true; $('#ltClose').textContent = '고마워!'; rt.plAt = null;   // 학부모 편지와 같은 창
    $('#ltText').innerHTML = esc(pg.ltr.txt + (pg.ltr.gold && !back ? `\n\n(황금 도토리 +${pg.ltr.gold})` : '')).replace(/\n/g, '<br>');   // 글자 칸이 줄바꿈을 빈칸으로 바꿔서 <br>로
    rt.ltBack = !!back;
    openModal(m); sfx('quest');
  }
  // 저장 읽기
  function sanitize211(d, s) {
    const day = v => typeof v === 'string' ? v.slice(0, 10) : '';
    s.ff = {};   // 바로 완공
    s.ces = typeof d.ces === 'string' ? d.ces.slice(0, 10) : '';
    s.ffx = typeof d.ffx === 'string' ? d.ffx.slice(0, 10) : '';
    { const N = d.sn && typeof d.sn === 'object' ? d.sn : {}, got = {};   // 매점 간식 뽑기
      if (N.got && typeof N.got === 'object') for (const x of SN_ALL) { const c = Math.floor(numIn(N.got[x.id], 0, 1e9)); if (c) got[x.id] = c; }
      s.sn = { got, day: day(N.day), mood: Math.floor(numIn(N.mood, 0, SN.moodMax + 2)), pity: Math.floor(numIn(N.pity, 0, SN.pity)), n: Math.floor(numIn(N.n, 0, 1e9)), gold: N.gold === true && SN_ALL.every(x => got[x.id]) }; }
    { const V = d.vd && typeof d.vd === 'object' ? d.vd : {}; s.vd = { lv: Math.floor(numIn(V.lv, 0, 9999)), p: numIn(V.p, 0, 1), sum: numIn(V.sum, 0, 1e300), n: Math.floor(numIn(V.n, 0, 1e9)), lk: { day: '', lv: 0, need: 0 } }; if (s.vd.p >= 1) s.vd.p = 0.999999;
    if (V.lk && typeof V.lk === 'object' && typeof V.lk.day === 'string') s.vd.lk = { day: V.lk.day.slice(0, 10), lv: Math.floor(numIn(V.lk.lv, 0, 9999)), need: Math.floor(numIn(V.lk.need, 0, SAVE_CAP.big)) };     }   // 마을 기부
    { const C = d.cb && typeof d.cb === 'object' ? d.cb : {}, lim = Math.max(Date.now(), Number(d.clk && d.clk.last) || 0) + 366 * 86400000; s.cb = { until: numIn(C.until, 0, lim), at: numIn(C.at, 0, lim) }; }   // 건설 가속
    { const N = d.nb && typeof d.nb === 'object' ? d.nb : {}; s.nb = { at: numIn(N.at, 0, Date.now() + 366 * 86400000), seen: typeof N.seen === 'string' ? N.seen.slice(0, 10) : '' }; }   // 야간 건설
    { const N = d.ns && typeof d.ns === 'object' ? d.ns : {};   // 야간 자율학습
      s.ns = { day: typeof N.day === 'string' && /^\d{4}-\d\d-\d\d$/.test(N.day) ? N.day : '', sub: AC.keys.includes(N.sub) ? N.sub : 'kor',
        got: numIn(N.got, 0, SAVE_CAP.big), sec: numIn(N.sec, 0, 86400), done: N.done !== false, n: Math.floor(numIn(N.n, 0, SAVE_CAP.count)), at: numIn(N.at, 0, 253402300799999), fin: Math.floor(numIn(N.fin, 0, SAVE_CAP.count)) };
      if (s.ns.day && (!Number.isFinite(nightStart(s.ns.day)) || kstDay(nightStart(s.ns.day)) !== s.ns.day)) { s.ns.day = ''; s.ns.done = true; s.ns.at = 0; } }
    if (d.ff && typeof d.ff === 'object') for (const k of Object.keys(FAC)) if (typeof d.ff[k] === 'string') s.ff[k] = d.ff[k].slice(0, 10);
    { const F = d.ffd && typeof d.ffd === 'object' ? d.ffd : null;   // 학교 전체 하루 횟수. 옛 저장은 오늘 건물마다 쓴 것을 세어요
      if (F) s.ffd = { day: day(F.day), n: Math.floor(numIn(F.n, 0, 99)) };
      else { const t = gameToday(); s.ffd = { day: t, n: Object.values(s.ff).filter(v => v === t).length }; } }
    s.fr = {};
    if (d.fr && typeof d.fr === 'object') for (const sp of Object.keys(d.fr)) {
      const F = d.fr[sp];
      if (!DEX_STUDENTS.includes(sp) || !F || typeof F !== 'object' || typeof F.nm !== 'string' || !FR_NAME_RE.test(F.nm)) continue;
      const n = F.n && typeof F.n === 'object' ? F.n : {};
      s.fr[sp] = { nm: F.nm, bm: Math.floor(numIn(F.bm, 1, 12)), bd: Math.floor(numIn(F.bd, 1, 28)), p: Math.floor(numIn(F.p, 0, 1e6)), pat: day(F.pat),
        n: { pc: Math.floor(numIn(n.pc, 0, 1e6)), bd: Math.floor(numIn(n.bd, 0, 1e6)), el: Math.floor(numIn(n.el, 0, 1e6)) } };
    }
    const G = d.frg && typeof d.frg === 'object' ? d.frg : {};
    s.frg = { day: day(G.day), n: Math.floor(numIn(G.n, 0, BF.giftDay)) };
    const C = d.frc && typeof d.frc === 'object' ? d.frc : {};
    s.frc = { pat: Math.floor(numIn(C.pat, 0, 1e7)), gift: Math.floor(numIn(C.gift, 0, 1e7)), cake: Math.floor(numIn(C.cake, 0, 1e7)), alb: Math.floor(numIn(C.alb, 0, 1e7)) };
    const B = d.bday && typeof d.bday === 'object' ? d.bday : {};
    s.bday = { day: day(B.day), done: B.done === true };
    s.alb = (Array.isArray(d.alb) ? d.alb : []).filter(p => p && typeof p === 'object' && Number.isInteger(p.t) && p.t >= 0 && p.t < TIERS.length).slice(-BF.albMax).map(p => {
      const f = {};
      if (p.f && typeof p.f === 'object') for (const k of Object.keys(FAC)) f[k] = Math.floor(numIn(p.f[k], 0, 999));
      const L = p.ltr && typeof p.ltr === 'object' && typeof p.ltr.txt === 'string' && DEX_STUDENTS.includes(p.ltr.sp)
        ? { sp: p.ltr.sp, nm: typeof p.ltr.nm === 'string' ? p.ltr.nm.slice(0, 4) : '', h: Math.floor(numIn(p.ltr.h, 0, 5)), txt: p.ltr.txt.slice(0, 1200), gold: Math.floor(numIn(p.ltr.gold, 0, 1)) } : null;
      const bs = {};   // 그때 건물 그림 단계(앨범 쪽 그림). 옛 쪽에는 없어요
      if (p.bs && typeof p.bs === 'object') for (const k of Object.keys(FAC)) if (p.bs[k] != null) bs[k] = Math.floor(numIn(p.bs[k], 0, 9));
      if (p.k === 'tr' && TR2_BY[p.pl]) return { t: p.t, y: Math.max(1, Math.floor(numIn(p.y, 1, 9))), k: 'tr', at: numIn(p.at, 0, Date.now() + 366 * 86400000), st: Math.floor(numIn(p.st, 0, 1e7)), f, bs, dip: 0,   // 수학여행 단체 사진 쪽
        kids: (Array.isArray(p.kids) ? p.kids : []).filter(sp => DEX_STUDENTS.includes(sp)).slice(0, 6), kx: (Array.isArray(p.kx) ? p.kx : []).filter(sp => DEX_STUDENTS.includes(sp)).slice(0, 5),
        el: '', ph: true, ltr: null, v: 0, old: false, pl: p.pl, pk: (Array.isArray(p.pk) ? p.pk : []).filter(v => v === 0 || v === 1).slice(0, 3) };
      return { t: p.t, y: Math.max(1, Math.floor(numIn(p.y, 1, 9))), k: p.k === 'g' ? 'g' : 'y', at: numIn(p.at, 0, Date.now() + 366 * 86400000), st: Math.floor(numIn(p.st, 0, 1e7)), f, bs,
        dip: Math.floor(numIn(p.dip, 0, 1e12)), kids: (Array.isArray(p.kids) ? p.kids : []).filter(sp => DEX_STUDENTS.includes(sp)).slice(0, 6),
        el: DEX_STUDENTS.includes(p.el) ? p.el : '', ph: p.ph === true, ltr: L, v: Math.floor(numIn(p.v, 0, 999)), old: p.old === true };
    });
    albMigrate(s);
  }

