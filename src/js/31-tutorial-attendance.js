  /* ---------- 튜토리얼 ----------
     처음 시작한 학교에 고슴도치 교감 선생님이 화면 곳곳을 비추며 안내해요. 끝까지 보면 황금 도토리 1개.
     '나중에'를 누르면 다음에 열 때 다시 물어보고, 설정에서 언제든 이어 할 수 있어요. '건너뛰기'를 하면 보상은 없어요 */
  const TUT_GOLD = 1;
  // 5.0.1.7 woodani 결정(F-03): 이야기 '첫 출근'을 먼저 보여 주고 튜토리얼은 세 장만. 참나무, 왼쪽 단추, 아래 탭은 그 기능이 처음 열릴 때 한 장씩(featTipCheck)
  const TUT = [
    { sel: '.board-top', t: '우리 학교 현황', d: '도토리는 수업료로 저절로 쌓여요. 학교 카드를 누르면 학생 정원과 학교 파워가 펼쳐져요. 세 장만 보면 황금 도토리를 드려요.' },
    { sel: '#questBar', t: '메인 퀘스트', d: '제가 할 일을 하나씩 알려 드려요. 다 하면 여기를 눌러 보상을 받아요. 막히면 눌러서 바로 가 보세요.' },
    { sel: '#b-classroom', t: '건물 키우기', d: '건물을 누르면 안이 보여요. 가구 네 개를 모두 건물 레벨까지 올리면 건물을 키울 수 있어요. 자리를 비워도 도토리는 계속 쌓여요.', scroll: true }
  ];
  const FEAT_TIPS = {
    oak: { sel: '#oak', t: '참나무 흔들기', d: '놀이터 옆 참나무를 눌러 도토리를 떨어뜨려요. 떨어진 도토리를 눌러 주우면 도토리를 듬뿍 받아요.', scroll: true },
    left: { sel: '.map-left', t: '지도 왼쪽 단추', d: '보충수업, 체험학습, 학교 행사가 여기에 생겨요. 학년이 올라가면 하나씩 열려요.', scroll: true },
    tabs: { sel: '.tabs', t: '아래 탭', d: '선생님, 탐험, 공부, 상점은 아래 탭에서 열어요. 졸업과 설정은 맨 위 단추, 퀘스트 목록과 랭킹은 지도 오른쪽 단추예요.' }
  };
  function tutAuto() {
    // 처음 시작한 학교(메인 퀘스트 3개 전)에만 저절로 열어요. '나중에'를 눌렀으면 다음에 열 때 한 번 더 물어봐요
    if (!S || S.tut.st === 'done' || S.tut.st === 'skip' || rt.tutAsked) return;
    if (S.tut.st !== 'later' && S.q.m >= 3) return;
    if (!(window.__FOREST_TEST && !window.__STORY_AUTO) && (rt.st || (S.sto && ((!S.sto.v && S.q.m === 0) || (S.sto.q && S.sto.q[0] === 'o0'))))) { setTimeout(tutAuto, 1200); return; }   // 5.0.1.7 F-03 이야기 '첫 출근'이 먼저
    rt.tutAsked = true;
    queueModal(() => { tutStart(S.tut.step || 0); return true; });
  }
  function tutStart(i) {
    rt.tut = { i: Math.max(0, Math.min(TUT.length - 1, i | 0)), confirm: false };
    rt.modalOpen = $('#tut');
    $('#tut').hidden = false;
    setTab('school');
    tutShow();
  }
  // 1.5.3 한 번만 보여 주는 안내: 튜토리얼 상자를 빌려 한 장만 보여 줘요 (보상, 건너뛰기, 나중에 없음)
  function tipStart(T) {
    rt.tut = { i: 0, confirm: false, one: T };
    rt.modalOpen = $('#tut');
    $('#tut').hidden = false;
    setTab('school');
    tutShow();
  }
  // 평판을 모으는 퀘스트를 처음 만나면, 퀘스트 칸을 누르면 올릴 곳을 알려 준다고 안내해요
  // 5.0.1.7 F-03 기능이 처음 열릴 때 한 장 안내. 튜토리얼을 마친(또는 건너뛴) 학교에만, 한 번에 하나씩
  function featTipCheck() {
    { const hd = $('#homeDot'); if (hd && S) { const on = rt.tab !== 'school' && !!curMain() && mainReady(); if (hd.hidden === on) hd.hidden = !on; } }   // 5.0.1.8 F-09 홈 밖에서 메인 퀘스트를 마치면 홈 탭에 빨간 점
    { const fl = $('#foldL'); if (fl && S) { const any = [...$$('.map-left > :not(.side-fold)')].some(b => !b.hidden); if (fl.hidden === any) fl.hidden = !any; } }   // 5.0.1.7 F-18 왼쪽 단추가 하나도 없으면 접기 단추도 숨겨요
    if (!S || rt.tut || rt.modalOpen || rt.paused || rt.st || rt.tab !== 'school' || rt.sheetKey || rt.modalQueue.length || !S.tut.st || S.tut.st === 'later') return;
    if (window.__FOREST_TEST && !window.__STORY_AUTO) return;
    const vis = sel => { const e = $(sel); if (!e || e.hidden) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    let k = '';
    if (!S.tips.oak && S.f.playground >= 1 && vis('#oak')) k = 'oak';
    else if (!S.tips.left && [...$$('.map-left .boost')].some(b => !b.hidden)) k = 'left';
    else if (!S.tips.tabs && S.q.m >= 3) k = 'tabs';
    if (!k) return;
    S.tips[k] = true; save(); tipStart(FEAT_TIPS[k]);
  }
  function repTipCheck() {
    if (!S || S.tips.rep || rt.tut || rt.modalOpen || rt.paused || rt.tab !== 'school') return;
    if (S.tut.st === '' && S.q.m < 3) return;   // 첫 튜토리얼이 먼저예요
    const q = curMain();
    if (!q || (q.t !== 'grade' && q.t !== 'ygrade') || mainReady()) return;
    S.tips.rep = true; save();
    queueModal(() => { tipStart({ sel: '#questBar', t: '평판 모으기', d: '평판은 시설을 키우거나 선생님을 연수 보내면 올라요. 무엇부터 올릴지 모르겠으면 이 퀘스트 칸을 눌러 보세요. 지금 평판을 올리기 가장 좋은 곳으로 데려다줘요.' }); return true; });
  }
  function tutShow() {
    const one = rt.tut.one, L = one ? [one] : TUT;
    const T = L[rt.tut.i], hole = $('#tutHole'), box = $('#tutBox');
    $('#tutStep').textContent = one ? '' : `${rt.tut.i + 1}/${TUT.length}`;
    $('#tutTitle').textContent = T.t;
    $('#tutText').textContent = T.d;
    $('#tutNext').textContent = one ? '알겠어요' : rt.tut.i === TUT.length - 1 ? `황금 도토리 ${TUT_GOLD}개 받기` : '다음';
    $('#tutSkip').textContent = rt.tut.confirm ? '네, 건너뛸게요 (보상 없음)' : '건너뛰기';
    $('#tutSkip').hidden = !!one;
    $('#tutLater').hidden = !!one || rt.tut.i === TUT.length - 1;
    const el = T.sel ? $(T.sel) : null;
    const place = () => {
      const r = el && !el.hidden ? el.getBoundingClientRect() : null, pad = 6;
      if (!r || r.width < 20 || r.height < 20) { hole.hidden = true; box.classList.add('mid'); box.style.top = ''; return; }
      hole.hidden = false;
      Object.assign(hole.style, { left: (r.left - pad) + 'px', top: (r.top - pad) + 'px', width: (r.width + pad * 2) + 'px', height: (r.height + pad * 2) + 'px' });
      box.classList.remove('mid');
      const h = box.offsetHeight, below = r.bottom + 14, above = r.top - h - 14;
      box.style.top = (below + h < window.innerHeight - 8 ? below : Math.max(8, above)) + 'px';
    };
    if (el && T.scroll) {
      if (el.closest('#map') && rt.mapS) { const fr = $('.frame').getBoundingClientRect(), q = el.getBoundingClientRect(); panTo((rt.panX || 0) + (fr.left + fr.width / 2) - (q.left + q.width / 2), (rt.panY || 0) + (fr.top + fr.height / 2) - (q.top + q.height / 2)); }
      else el.scrollIntoView({ block: 'center', behavior: 'auto' });
      requestAnimationFrame(place);
    } else place();
    rt.tutPlace = place;
  }
  function tutNext() {
    if (!rt.tut) return;
    rt.tut.confirm = false;
    if (rt.tut.one) { $('#tut').hidden = true; if (rt.modalOpen === $('#tut')) rt.modalOpen = null; rt.tut = null; sfx('tap'); return nextModal(); }
    if (rt.tut.i >= TUT.length - 1) return tutEnd('done');
    rt.tut.i += 1; S.tut.step = rt.tut.i;
    sfx('tap'); save(); tutShow();
  }
  function tutEnd(how) {
    $('#tut').hidden = true;
    if (rt.modalOpen === $('#tut')) rt.modalOpen = null;
    const reward = how === 'done' && !S.tut.paid && !S.tut.nop;
    if (how === 'skip') S.tut.nop = true;   // 건너뛰면 보상은 없어요
    S.tut.st = how; rt.tut = null;
    if (how === 'later') toast('맨 위 톱니바퀴(설정)에서 언제든 튜토리얼을 이어 할 수 있어요');
    else if (how === 'skip') { S.tut.step = 0; toast('튜토리얼을 건너뛰었어요. 맨 위 톱니바퀴(설정)에서 다시 볼 수 있어요'); }
    else { S.tut.step = 0; if (reward) { S.tut.paid = true; addGold(TUT_GOLD); sfx('quest'); toast(`튜토리얼 끝! 황금 도토리 +${TUT_GOLD}개`); } else toast('튜토리얼을 다시 봤어요'); }
    $('#scroller').scrollTop = 0;
    save(); syncSettingsUI(); nextModal();
  }

  /* ---------- 출석부 ---------- */
  function attState() {
    const n = S.att.n, stamped = !canStamp();
    const filled = stamped ? ((n - 1) % 7) + 1 : n % 7;
    return { filled, next: stamped ? -1 : filled };
  }
  function attValue(i) {
    const a = ATT[i];
    return a.d ? { kind: 'dip', v: a.d } : { kind: 'acorn', v: Math.max(a.m * 20, nice(rate() * 60 * a.m)) };
  }
  function renderAtt(justIdx) {
    const { filled, next } = attState();
    $('#attGrid').innerHTML = ATT.map((a, i) => {
      const reward = a.d ? `${dipIcon()}${a.d}장` : `${acornIcon()}${fmt(attValue(i).v)}`;
      const stamped = i < filled;
      return `<div class="att-cell${i === 6 ? ' big' : ''}${i === next ? ' today' : ''}${i === justIdx ? ' just' : ''}${stamped ? ' done' : ''}">` +
        `<span>${i + 1}일째</span><b>${reward}</b>` +
        (stamped ? '<span class="stamp" aria-label="출석 완료"><i>참<br>잘했어요</i></span>' : '') + '</div>';
    }).join('');
    const go = $('#attGo');
    const can = canStamp();
    go.textContent = can ? '오늘 도장 받기' : '내일 또 만나요';
    go.setAttribute('aria-disabled', can ? 'false' : 'true');
    $('#attTotal').textContent = S.att.n > 0 ? `지금까지 ${S.att.n}일 출석했어요. 하루를 걸러도 이어서 찍혀요.` : '하루를 걸러도 이어서 찍혀요.';
  }
  function openAtt() {
    if (rt.paused || rt.modalOpen) return;
    renderAtt(-1);
    sfx('tap');
    openModal($('#mAtt'));
  }
  function stampAtt() {
    if (!canStamp()) { shake($('#attGo')); return; }
    const i = S.att.n % 7, r = attValue(i), g = i === 6 ? GOLD.att7 : GOLD.att;
    S.att.n += 1; S.att.last = gameToday();
    const gIt = i === 6 ? (addGold(g), { t: `황금 도토리 +${g}` }) : goldOr(g);   // 4.2.0 60개 뒤에는 7일째만 황금
    if (r.kind === 'dip') { addDip(r.v); toast(`출석 도장 쾅! 수료증 +${r.v}장, ${gIt.t}`); }
    else { S.budget += r.v; earn(r.v); toast(`출석 도장 쾅! 도토리 +${fmt(r.v)}, ${gIt.t}`); }
    sfx('quest'); buzz(20);
    renderAtt(i);
    save(); renderHUD(); renderAffordance();
  }

