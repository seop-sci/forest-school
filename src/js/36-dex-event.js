  /* ===== 1.7.0 도감, 이벤트 BEGIN =====
     1.7.0 코드는 모두 이 구역(자바스크립트)과 같은 표시가 붙은 CSS 구역, HTML 구역에 있어요.
     기존 코드에는 한두 줄씩만 들어가요. 그 위치 목록은 dev/v170-notes.md에 있어요 */

  // 공용 함수로 바꾸기: 1.6.0(가장 늦게 본 시각 저장, 시간이 뒤로 가면 날짜 안 넘기기)이 합쳐지면 아래 두 줄만 지워요
  // 임시 함수는 기기 시간만 돌려주고 저장 칸을 만들지 않아요

  // 보상용 분치 보정(공용): 학교급이 오르면 수업료는 1000배, 공사비는 2000배라서 "수업료 몇 분치"의 실제 가치가 학교급마다 절반이 돼요
  // 분치 × 학교급 배수로 공사비 기준 가치를 맞춰요. 기존 퀘스트와 행사 보상에는 쓰지 않아요(수업료 n분치 = rate × 60 × n 그대로).
  // 조정안 6: 숨은 2^학교급 대신 이름 있는 표. 건물 한 레벨 값을 수업료 분으로 재면(같은 상한 비율에서)
  // 고등학교는 중학교의 약 4분의 1~3분의 1이라(공사비 배수 2.5e11 ÷ 수업료 1e9 = 250, 중학교 500), 고등학교는 8배가 아니라 중학교와 같은 4배예요.
  // 이 배수를 쓰는 곳: 합치기 주문과 팔기, 대결 첫 승리, 실험, 소풍, 생일, 스티커판, 시험 성적표, 대항전 참가, 생물 중복, 이벤트, 도감, 건설 부스터 값
  const TIER_X = [1, 2, 4, 4, 4, 4];   // 유치원, 초등, 중학교, 고등학교, 대학교(고등학교와 같게)
  const tierMinutes = m => m * TIER_X[Math.min(S.tier, TIER_X.length - 1)];
  const minAcorns = m => Math.max(10, nice(rate() * 60 * tierMinutes(m)));

  // 1.7.0 그림: FS_IMG170 묶음 → 기존 FS_IMG → 임시 도형(PLACE170) 순서로 찾아요.
  // 진짜 그림이 오면 art/v170 폴더를 `python3 embed_assets.py --block 170 <폴더>`로 넣어요. 열쇠는 파일 이름이에요
  const IMG7 = k => (window.FS_IMG170 && window.FS_IMG170[k]) || IMG(k) || '';
  const PLACE170 = {
    // 아직 못 만난 친구 자리(물음표). 진짜 그림: dex_unknown.png
    dex_unknown: '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="28" fill="#8A8A7A" opacity=".35"/><path d="M24 26q0-9 8-9t8 8q0 4-4 6.5t-4 6.5v2" fill="none" stroke="#5A5A4E" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="47" r="2.6" fill="#5A5A4E"/></svg>',
    // 받은 출석 도장과 아직 안 받은 자리. 진짜 그림: ev_stamp_on.png, ev_stamp_off.png
    ev_stamp_on: '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="#C2453A"/><circle cx="20" cy="20" r="12" fill="none" stroke="#FFF6DC" stroke-width="2"/><path d="M13 20l5 5 9-10" fill="none" stroke="#FFF6DC" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    ev_stamp_off: '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="none" stroke="#8A8A7A" stroke-width="2" stroke-dasharray="4 3"/></svg>'
  };
  // 새 전학생 6종: 그림(작업지시서 20)이 오기 전에는 그림 문자
  for (const k of Object.keys(KID_EMOJI)) PLACE170['chr_' + k] = `<svg viewBox="0 0 64 64" aria-hidden="true"><text x="32" y="46" text-anchor="middle" font-size="40">${KID_EMOJI[k]}</text></svg>`;
  // 그림이 있으면 <img>, 없으면 임시 도형이나 기존 그림을 그려요. fb는 대신 쓸 기존 그림 열쇠
  const pic7 = (k, fb) => {
    const u = IMG7(k) || (fb ? IMG(fb) : '');
    return u ? `<img src="${u}" alt="" draggable="false">` : `<span class="p7">${PLACE170[k] || ''}</span>`;
  };
  // 도감 카드 틀과 책 배경은 밝은 판과 어두운 판 두 가지 그림 자리가 있어요(dex_card_light, dex_card_dark, dex_book_light, dex_book_dark).
  // 그림이 있을 때만 CSS 변수로 넣고, 없으면 CSS의 기본 색이 보여요
  ['dex_card_light', 'dex_card_dark', 'dex_book_light', 'dex_book_dark'].forEach(k => { const u = IMG7(k); if (u) document.documentElement.style.setProperty('--' + k.replace(/_/g, '-'), `url("${u}")`); });
  [['bond_bubble_light', '--fr-bub-l'], ['bond_bubble_dark', '--fr-bub-d']].forEach(([k, v]) => { const u = IMG(k); if (u) document.documentElement.style.setProperty(v, `url("${u}")`); });   // 친구 말풍선

  /* ---------- 동물 도감 ---------- */
  // 학생 11종(기본 5 + 전학생 6)과 선생님 3명. 선생님 열쇠는 학생과 겹치지 않게 tea_를 붙여요(아기곰 학생과 곰 선생님)
  const DEX_TEACHERS = ['squirrel', 'owl', 'bear'];
  const DEX_STUDENTS = BASE_SPECIES.concat(NEWCOMERS.map(n => n.k));
  const DEX_TEA = DEX_TEACHERS.concat(['hedgehog', 'dietitian', 'librarian', 'swan', 'peacock', 'alpaca', 'badger', 'elephant', 'crane', 'pelican']);   // 펠리컨 지도교수님. 두루미 학장 교수님. 코끼리 진로 선생님. 오소리 사감. 새 선생님 셋. 고슴도치 교감 선생님은 처음부터 등록돼요. 영양, 사서 선생님은 오시면
  const DEX_KEYS = DEX_STUDENTS.concat(DEX_TEA.map(k => 'tea_' + k));
  const DEX_NAMES = { rabbit: '토끼', fox: '여우', raccoon: '너구리', chick: '병아리', bear: '아기곰' };
  const DEX_LINES = {
    rabbit: '귀가 길어 숲속 소식을 가장 먼저 들어요. 당근 샐러드를 좋아해요.',
    fox: '꼬리로 바람 방향을 알아내요. 도토리 줍기 시합이 제일 신나요.',
    raccoon: '손재주가 좋아서 뭐든 뚝딱 고쳐요. 반짝이는 돌을 모아요.',
    chick: '아직 작지만 목소리는 제일 커요. 급식 시간을 손꼽아 기다려요.',
    bear: '힘이 세고 마음이 따뜻해요. 그림책 읽어 주는 시간을 좋아해요.',
    cat: '햇볕 좋은 창가를 제일 먼저 찾아요. 낮잠 뒤에는 공부도 열심히 해요.',
    dog: '친구를 보면 꼬리부터 흔들어요. 운동장을 백 바퀴도 달릴 수 있대요.',
    penguin: '먼 남쪽 바다에서 전학 왔어요. 미끄럼틀을 배로 타고 내려와요.',
    panda: '하루에 열두 번 간식을 먹어요. 느긋해 보여도 시험은 늘 만점이에요.',
    koala: '나무 위에서 수업을 들어도 다 알아들어요. 조용한 도서관을 좋아해요.',
    otter: '물장구치며 노는 걸 제일 좋아해요. 조개껍데기로 악기를 만들어요.',
    hamster: '볼 주머니에 해바라기 씨를 가득 모아요. 쳇바퀴 달리기는 지칠 줄 몰라요.',
    duck: '연못에서 전학 왔어요. 비 오는 날이면 신이 나서 노래를 불러요.',
    turtle: '느릿느릿 걸어도 한 번 시작한 일은 끝까지 해요. 등딱지에 스티커를 붙여요.',
    mole: '땅속 길을 누구보다 잘 알아요. 작은 안경 너머로 별자리 책을 읽어요.',
    frog: '높이뛰기 선수예요. 개굴개굴 합창 동아리를 만들고 싶어 해요.',
    waterdeer: '숲속 들판을 가볍게 뛰어다녀요. 수줍지만 그림 솜씨가 좋아요.',
    redpanda: '높은 산 대나무 숲에서 전학 왔어요. 줄무늬 꼬리로 셈을 해요.',
    capybara: '누구와도 금방 친해지는 느긋한 친구예요. 따뜻한 물과 책을 좋아해요.',
    kangaroo: '멀리 남쪽 들판에서 전학 왔어요. 한 번 뛰면 운동장 반을 건너요.',
    meerkat: '모래 들판에서 온 대학교 신입생이에요. 꼿꼿이 서서 강의실 맨 앞줄을 지켜요.',
    sloth: '느긋한 대학교 신입생이에요. 늦게 와도 그림 과제는 가장 꼼꼼해요.',
    chinchilla: '높은 산에서 온 대학교 신입생이에요. 보송보송한 털만큼 호기심도 많아요.',
    tea_badger: '기숙사를 돌보는 사감 선생님이에요. 밤마다 손전등을 들고 방을 한 바퀴 돌아요.',
    tea_elephant: '큰 귀로 학생들의 고민을 끝까지 들어 주는 진로 선생님이에요. 상담실 차는 늘 따뜻해요.',
    tea_crane: '단과대학을 두루 살피는 학장 교수님이에요. 긴 다리로 캠퍼스를 하루에 세 바퀴 돌아요.',
    tea_pelican: '대학원생의 연구를 이끄는 지도교수님이에요. 부리 주머니에 늘 연필과 논문 한 편을 넣고 다녀요.',
    tea_squirrel: '도토리 셈이 숲에서 가장 빠른 수학 선생님이에요. 수업료를 올려 줘요.',
    tea_owl: '밤에도 눈이 반짝이는 과학 선생님이에요. 자리를 비운 동안에도 수업을 이어 줘요.',
    tea_dietitian: '급식실 식단을 짜는 영양 선생님이에요. 편식하는 친구에게는 사과를 하나 더 얹어 줘요.',
    tea_swan: '하얀 목을 길게 빼고 시를 낭송하는 국어 선생님이에요. 책을 읽어 주는 목소리가 잔잔해요.',
    tea_peacock: '깃털 색을 보고 물감을 섞는다는 미술 선생님이에요. 베레모는 꼭 쓰고 다녀요.',
    tea_alpaca: '복슬복슬한 털이 자랑인 매점 선생님이에요. 간식 바구니를 늘 들고 다녀요.',
    tea_librarian: '도서관 책 냄새를 제일 좋아하는 사서 선생님이에요. 뿔에 책갈피를 꽂아 두기도 해요.',
    tea_hedgehog: '교장 선생님 곁에서 학교 일을 하나하나 알려 주는 교감 선생님이에요. 학교 행사를 가장 좋아해요.',
    tea_bear: '숲에서 가장 든든한 체육 선생님이에요. 뱀이나 매가 와도 학생들을 지켜 줘요.'
  };
  // 특별 손님(뱀, 매, 까치, 졸업생): 지도에 나타나면 등록돼요(시련, 까치 핫딜, 졸업생 방문). 앞으로 올 친구 자리는 ??? 잠금 칸이에요
  const DEX_GUESTS = [{ k: 'snake', name: '뱀', hint: '풀숲에서 가끔 오는 손님', line: '장난을 좋아해서 가끔 학교에 기어 와요. 여러 번 누르면 놀라서 돌아가요.' },
    { k: 'hawk', name: '매', hint: '하늘에서 가끔 오는 손님', line: '하늘 높이 맴돌며 학교를 내려다봐요. 눈이 아주 밝아요.' },
    { k: 'magpie', name: '까치', hint: '소식을 물어 오는 손님', line: '반가운 소식과 반값 핫딜을 물어 와요. 숲에서 가장 빠른 우체부예요.' },
    { k: 'alumni', name: '졸업생', hint: '모교를 찾아오는 손님', line: '이 학교를 졸업한 선배예요. 가끔 선물을 들고 모교를 찾아와요.' }];
  // 특별 손님은 나타나면 기록만 해요(선물과 '만난 친구' 수에는 넣지 않아요)
  const DEX_GUEST_KEYS = DEX_GUESTS.map(g => 'g_' + g.k);
  const dexGuest = k => DEX_GUESTS.find(g => 'g_' + g.k === k);
  const DEX_FUTURE = 1;   // 세 칸 중 두 칸은 영양, 사서 선생님이 채웠어요
  // 등록 1종마다 황금 도토리 1개. 모으기 보상: 학생 5종 수업료 30분치, 학생 11종 황금 3개, 모두(17종, 열쇠 이름은 예전 그대로 s14) 황금 5개와 기념 그림
  const DEX_REWARD = { each: 1, goals: [{ key: 's5', who: 'students', need: 5, m: 30, t: '기본 친구 5종 모으기' }, { key: 's11', who: 'students', need: 11, g: 3, t: '학생 11종 모으기' }, { key: 's14', who: 'all', need: DEX_KEYS.length, g: 5, t: '도감 완성' }] };
  const DEX_PAY_KEYS = new Set(DEX_KEYS.concat(DEX_REWARD.goals.map(x => x.key)));
  const XT_DEX = { tea_dietitian: 'diet', tea_librarian: 'lib', tea_swan: 'kor', tea_peacock: 'art', tea_alpaca: 'snack', tea_badger: 'dorm', tea_elephant: 'cou', tea_crane: 'dean', tea_pelican: 'adv' };
  const dexName = k => k === 'tea_hedgehog' ? VP.name : XT_DEX[k] ? XT[XT_DEX[k]].name : k.startsWith('g_') ? (dexGuest(k) || {}).name || k : k.startsWith('tea_') ? TEA[k.slice(4)].name : (DEX_NAMES[k] || (NEWCOMERS.find(n => n.k === k) || {}).name || k);
  const dexPicKey = k => k.startsWith('tea_') ? k : 'chr_' + (k.startsWith('g_') ? k.slice(2) : k);
  const dexHow = k => {
    if (k === 'tea_hedgehog') return '처음부터 학교에 계셔요';
    if (XT_DEX[k] && XT[XT_DEX[k]].tier && S.tier < XT[XT_DEX[k]].tier) return `${TIERS[XT[XT_DEX[k]].tier].name}부터 오셔요`;
    if (XT_DEX[k]) return `${eul(FAC[XT[XT_DEX[k]].fac].name)} 지으면 오셔요`;
    if (k.startsWith('g_')) return (dexGuest(k) || {}).hint || '';
    if (k.startsWith('tea_')) return `${TEA[k.slice(4)].name}을 모시면 등록돼요`;
    const i = NEWCOMERS.findIndex(n => n.k === k);
    return i < 0 ? '학교에 다니는 모습을 보면 등록돼요' : `${i + 1}번째 종업식 뒤에 전학 와요`;
  };
  const dexCount = who => (who === 'students' ? DEX_STUDENTS : DEX_KEYS).filter(k => S.dex.got[k]).length;
  // 그 종의 학생이 지도에 처음 나타나거나 선생님을 모시면 등록해요. 선물은 도감을 열 때 한 창으로 받아요
  function dexMeet(k) {
    if (!S || !S.dex || !(DEX_PAY_KEYS.has(k) || DEX_GUEST_KEYS.includes(k)) || S.dex.got[k]) return;
    S.dex.got[k] = gameNow();
    (rt.dexNew = rt.dexNew || {})[k] = true;
  }
  // 기록으로 알 수 있는 친구들은 지도에 안 보여도 등록해요(종업식을 열었으면 기본 5종, 전학 온 친구, 모신 선생님)
  function dexSync() {
    if (S.st.grads > 0) BASE_SPECIES.forEach(dexMeet);
    NEWCOMERS.slice(0, S.p.species).forEach(n => dexMeet(n.k));
    DEX_TEACHERS.forEach(k => { if (S.t[k] > 0) dexMeet('tea_' + k); });
    dexMeet('tea_hedgehog');
    for (const t of Object.keys(XT_DEX)) if (xtHere(XT_DEX[t])) dexMeet(t);
  }
  // 아직 받지 않은 선물 목록(등록 보상과 모으기 보상)
  function dexPending() {
    const out = [];
    for (const k of DEX_KEYS) if (S.dex.got[k] && !S.dex.paid.includes(k)) out.push({ key: k, g: DEX_REWARD.each, t: `${dexName(k)} 등록` });
    for (const x of DEX_REWARD.goals) if (dexCount(x.who) >= x.need && !S.dex.paid.includes(x.key)) out.push({ key: x.key, g: x.g || 0, m: x.m || 0, t: x.t, big: x.key === 's14' });
    return out;
  }
  // 도감을 열 때 받지 않은 선물을 "도감 선물" 창 하나로 묶어 줘요. 받은 것은 paid에 적어 다시 불러와도 두 번 받지 않아요
  function dexGift() {
    const items = dexPending();
    if (!items.length) return false;
    let g = 0, a = 0, big = false;
    for (const it of items) { g += it.g || 0; if (it.m) a += minAcorns(it.m); if (it.big) big = true; S.dex.paid.push(it.key); }
    if (a > 0) { S.budget += a; earn(a); }
    addGold(g);
    save();
    const names = items.map(it => it.t);
    showReward({
      title: big ? '도감을 완성했어요!' : '도감 선물', sub: names.length <= 2 ? names.join(', ') : `${names.slice(0, 2).join(', ')} 등 ${names.length}가지`,
      art: big ? pic7('dex_complete', 'orn_laurel') : '', big: big ? `${DEX_KEYS.length}종 모두 모았어요` : '',
      items: [a > 0 ? { ic: 'acorn', t: `도토리 +${fmt(a)}` } : null, g > 0 ? { ic: 'gold', t: `황금 도토리 +${g}` } : null]
    });
    return true;
  }
  const dexDate = t => { const d = new Date(t); return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 등록`; };
  function dexCard(k) {
    const on = !!S.dex.got[k], isNew = on && rt.dexNew && rt.dexNew[k], spark = isNew ? IMG7('fx_sparkle') : '';
    return `<button class="dex-card${on ? ' on' : ' off'}${isNew ? ' new' : ''}${spark ? ' has-spark' : ''}${rt.dexPick === k ? ' pick' : ''}" type="button" data-dex="${k}" aria-label="${on ? dexName(k) : '아직 못 만난 친구'}">` +
      `<span class="dex-pic">${on ? pic7(dexPicKey(k)) : pic7('dex_unknown')}</span><b>${on ? esc(dexName(k)) : '???'}</b><small>${on ? '등록' : '미등록'}</small>${spark ? `<img class="dex-spark" src="${spark}" alt="">` : ''}</button>`;
  }
  const dexLock = (hint, i) => `<div class="dex-card lock" aria-label="아직 열리지 않은 자리"><span class="dex-pic">${pic7('dex_unknown')}</span><b>???</b><small>${esc(hint)}</small></div>`;
  function renderDex() {
    const body = $('#dexBody');
    if (!body || !S) return;
    const n = dexCount('all'), key = [n, S.rare ? S.rare.got.join() : '', DEX_GUEST_KEYS.filter(k => S.dex.got[k]).length, rt.dexPick, Object.keys(rt.dexNew || {}).join(''), S.dex.paid.length, frDexKey(rt.dexPick)].join('|');
    $('#dexHead').innerHTML = `<span>만난 친구</span><b>${n} / ${DEX_KEYS.length}종</b>`;
    if (body.dataset.key === key) return;
    body.dataset.key = key;
    const pk = rt.dexPick && (DEX_PAY_KEYS.has(rt.dexPick) || DEX_GUEST_KEYS.includes(rt.dexPick)) ? rt.dexPick : '';
    const got = pk ? S.dex.got[pk] : 0;
    const detail = pk ? `<div class="dex-detail"><span class="dex-pic">${got ? pic7(dexPicKey(pk)) : pic7('dex_unknown')}</span><div><b>${got ? esc(dexName(pk)) : '???'}</b>` +
      `<p>${got ? esc(DEX_LINES[pk] || (dexGuest(pk) || {}).line || '') : '아직 만나지 못했어요.'}</p><small>${got ? dexDate(got) : esc(dexHow(pk))}</small>${got ? frDexBox(pk) : ''}</div></div>` : '';
    body.innerHTML = detail +
      `<h4 class="dex-h">학생 <small>${dexCount('students')} / ${DEX_STUDENTS.length}</small></h4><div class="dex-grid">${DEX_STUDENTS.map(dexCard).join('')}</div>` +
      rareDexHTML() +   // 반짝 친구는 학생 줄 바로 아래, 같은 카드 크기
      `<h4 class="dex-h">선생님 <small>${DEX_TEA.filter(k => S.dex.got['tea_' + k]).length} / ${DEX_TEA.length}</small></h4><div class="dex-grid">${DEX_TEA.map(k => dexCard('tea_' + k)).join('')}</div>` +
      `<h4 class="dex-h">특별 손님 <small>${DEX_GUEST_KEYS.filter(k => S.dex.got[k]).length} / ${DEX_GUESTS.length}</small></h4><div class="dex-grid">${DEX_GUEST_KEYS.map(dexCard).join('')}</div>` +
      `<h4 class="dex-h">앞으로 올 친구</h4><div class="dex-grid">${Array.from({ length: DEX_FUTURE }, (_, i) => dexLock('숲속 교육부에서 준비 중')).join('')}</div>`;
  }

  /* ---------- 이벤트 ---------- */
  // 달력 규칙으로 되풀이해요(앱 안에 고정이라 업데이트 없이 돌아가요)
  // 매주 이벤트 : 한국 시간 월요일 0시부터 일요일 23:59까지 이벤트가 열려요. 4가지가 4주마다 돌아가요
  // EV_ANCHOR가 든 주가 0번째(도토리 수확 축제)예요. 특별 이벤트가 있는 주는 그 주 이벤트가 쉬어요(돌아가는 순서는 그대로 이어져요)
  const EV_WEEKLY = [
    { id: 'harvest', name: '도토리 수확 축제', banner: 'ev_banner_harvest', lead: '숲에 도토리가 가장 많이 떨어지는 때예요. 다람쥐들이 바구니를 들고 수확 축제를 열어요.' },
    { id: 'friends', name: '숲속 친구 주간', banner: 'ev_banner_friends', lead: '숲속 친구들이 모여 함께 노는 주간이에요. 운동장이 웃음소리로 가득해요.' },
    { id: 'books', name: '책 읽는 주간', banner: 'ev_banner_books', fb: 'ev_banner_friends', lead: '숲속 도서관에 새 그림책이 잔뜩 들어왔어요. 다 같이 책을 읽어요.' },
    { id: 'lunch', name: '맛있는 급식 주간', banner: 'ev_banner_lunch', fb: 'ev_banner_harvest', lead: '급식실에서 특별 메뉴가 나와요.' }
  ];
  const EV_MONTHLY = EV_WEEKLY;   // 이름(시험과 옛 코드가 써요)
  const EV_ANCHOR = '2026-11-02';
  // 이벤트가 매주 열려서 한 번 보상은 1.x의 약 3분의 2예요(한 달 합은 약 1.3~1.5배). 미션 도토리는 표의 m에 곱해요
  const EVC = { scale: 2 / 3 };   // 핫픽스(live.json의 ev.scale)로 바꿀 수 있어요
  // 특별 이벤트 표: start와 end('YYYY-MM-DD', 끝나는 날 포함)를 적으면 열려요. 비어 있으면 아직 열지 않아요. 반복 이벤트와 겹치면 특별 이벤트가 먼저예요.
  // ms는 미션 3개 [종류, 목표], m은 미션 하나의 수업료 분치, g는 황금 도토리. 내용과 날짜는 나중에 채워요
  const EV_SPECIAL = [
    // 학교 특별 이벤트 달력: 기념일이 든 주 월~일, 서로 겹치지 않아요. 음력 날짜: 설날 2027-02-07(일), 부처님 오신 날 05-13(목), 추석 09-15(수), 수능 2027-11-18(목)
    // 같은 id가 해마다 다시 열려요(key가 id:시작일이라 새 회차). fb는 배너 그림이 오기 전 대신 보여 줄 그림. 2028년 표는 나중에 더해요(2028년은 어린이날과 부처님 오신 날이 같은 주라 하나만)
    { id: 'exam', name: '수능 응원', start: '2026-11-16', end: '2026-11-22', banner: 'ev_banner_exam', lead: '숲속 선배들이 큰 시험을 봐요. 모두 함께 응원해요. 힘내요!', ms: [['mgOrd', 5], ['pz', 2], ['dmDone', 4]], m: 20, g: 1 },
    { id: 'xmas', name: '크리스마스 파티', start: '2026-12-21', end: '2026-12-27', banner: 'ev_banner_xmas', lead: '숲속 학교에 눈이 내려요. 파티 선물을 받아 가요.', ms: [['picks', 60], ['mgOrd', 5], ['dmDone', 4]], m: 20, g: 1 },
    { id: 'newyear', name: '새해 해돋이', start: '2026-12-28', end: '2027-01-03', banner: 'ev_banner_newyear', fb: 'ev_banner_seollal', lead: '언덕에 올라 새해 첫 해를 봐요. 올해도 숲속 학교를 함께 키워요.', ms: [['picks', 60], ['claims', 3], ['dmDone', 4]], m: 20, g: 1 },
    { id: 'winter1', name: '겨울방학 눈놀이', start: '2027-01-04', end: '2027-01-10', banner: 'ev_banner_winter', fb: 'ev_banner_xmas', lead: '신나는 겨울방학이 시작됐어요. 눈썰매를 타고 눈사람을 만들어요.', ms: [['shakes', 40], ['pz', 2], ['dmDone', 4]], m: 20, g: 1 },
    { id: 'winter2', name: '겨울방학 숙제', start: '2027-01-11', end: '2027-01-17', banner: 'ev_banner_winter', fb: 'ev_banner_xmas', lead: '겨울방학 둘째 주예요. 놀면서 방학 숙제도 조금씩 해요.', ms: [['mgOrd', 5], ['pz', 2], ['claims', 3]], m: 20, g: 1 },
    { id: 'seollal', name: '설날 잔치', start: '2027-02-01', end: '2027-02-07', banner: 'ev_banner_seollal', lead: '새해 복 많이 받아요! 설날 잔치 선물을 준비했어요.', ms: [['picks', 60], ['shakes', 40], ['mgOrd', 5]], m: 20, g: 1 },
    { id: 'grad', name: '졸업식과 종업식', start: '2027-02-15', end: '2027-02-21', banner: 'ev_banner_grad', fb: 'ev_banner_exam', lead: '한 해를 마치는 날이에요. 졸업하는 선배들을 꽃다발로 축하해요.', ms: [['mgOrd', 5], ['pz', 2], ['dmDone', 4]], m: 20, g: 1 },
    { id: 'spring', name: '새 학기 입학식', start: '2027-03-01', end: '2027-03-07', banner: 'ev_banner_spring', fb: 'ev_banner_friends', lead: '새 친구들이 숲속 학교에 들어와요. 새 학기를 반갑게 맞아요.', ms: [['mgOrd', 5], ['picks', 60], ['claims', 3]], m: 20, g: 1 },
    { id: 'trip_spring', name: '봄 체험학습', start: '2027-04-12', end: '2027-04-18', banner: 'ev_banner_trip_spring', fb: 'ev_banner_friends', lead: '꽃이 핀 들판으로 체험학습을 떠나요. 봄 소풍 선물을 받아요.', ms: [['trips', 1], ['picks', 60], ['dmDone', 4]], m: 20, g: 1 },
    { id: 'science', name: '과학의 날', start: '2027-04-19', end: '2027-04-25', banner: 'ev_banner_science', fb: 'ev_banner_exam', lead: '돋보기와 물로켓으로 숲속 과학을 탐구해요.', ms: [['pz', 3], ['mgOrd', 5], ['claims', 3]], m: 20, g: 1 },
    { id: 'children', name: '어린이날 큰잔치', start: '2027-05-03', end: '2027-05-09', banner: 'ev_banner_children', lead: '어린이날을 맞아 큰잔치를 열어요. 친구들과 신나게 놀아요.', ms: [['picks', 60], ['sports', 2], ['dmDone', 4]], m: 20, g: 1 },
    { id: 'buddha', name: '연등 축제', start: '2027-05-10', end: '2027-05-16', banner: 'ev_banner_buddha', fb: 'ev_banner_children', lead: '부처님 오신 날을 맞아 숲길에 알록달록한 연등이 걸렸어요.', ms: [['shakes', 40], ['dmDone', 4], ['claims', 3]], m: 20, g: 1 },
    { id: 'final', name: '기말고사', start: '2027-06-21', end: '2027-06-27', banner: 'ev_banner_final', fb: 'ev_banner_exam', lead: '1학기 기말고사 주간이에요. 열심히 공부한 만큼 선물을 받아요.', ms: [['mgOrd', 5], ['pz', 3], ['dmDone', 4]], m: 20, g: 1 },
    { id: 'vacation', name: '여름방학식', start: '2027-07-19', end: '2027-07-25', banner: 'ev_banner_vacation', fb: 'ev_banner_children', lead: '1학기를 마치고 여름방학을 맞아요. 시냇가에서 물놀이해요.', ms: [['sports', 2], ['picks', 60], ['dmDone', 4]], m: 20, g: 1 },
    { id: 'liberation', name: '광복절', start: '2027-08-09', end: '2027-08-15', banner: 'ev_banner_liberation', fb: 'ev_banner_chuseok', lead: '나라를 되찾은 날을 기억해요. 태극기를 달고 무궁화를 심어요.', ms: [['shakes', 40], ['mgOrd', 5], ['dmDone', 4]], m: 20, g: 1 },
    { id: 'fall', name: '2학기 개학', start: '2027-08-30', end: '2027-09-05', banner: 'ev_banner_fall', fb: 'ev_banner_friends', lead: '방학이 끝나고 다시 학교에 모였어요. 2학기도 힘차게 시작해요.', ms: [['mgOrd', 5], ['pz', 2], ['claims', 3]], m: 20, g: 1 },
    { id: 'chuseok', name: '추석 달맞이', start: '2027-09-13', end: '2027-09-19', banner: 'ev_banner_chuseok', lead: '둥근 달을 보며 소원을 빌어요. 달맞이 선물이 기다려요.', ms: [['shakes', 40], ['mgOrd', 5], ['trips', 1]], m: 20, g: 1 },
    { id: 'hangul', name: '한글날', start: '2027-10-04', end: '2027-10-10', banner: 'ev_banner_hangul', fb: 'ev_banner_exam', lead: '세종대왕님이 만든 한글을 기념해요. 붓으로 예쁜 글씨를 써 봐요.', ms: [['pz', 3], ['dmDone', 4], ['mgOrd', 5]], m: 20, g: 1 },
    { id: 'trip_fall', name: '가을 체험학습', start: '2027-10-18', end: '2027-10-24', banner: 'ev_banner_trip_fall', fb: 'ev_banner_harvest', lead: '단풍 든 과수원으로 체험학습을 떠나요. 사과를 따요.', ms: [['trips', 1], ['shakes', 40], ['picks', 60]], m: 20, g: 1 },
    { id: 'exam', name: '수능 응원', start: '2027-11-15', end: '2027-11-21', banner: 'ev_banner_exam', lead: '숲속 선배들이 큰 시험을 봐요. 모두 함께 응원해요. 힘내요!', ms: [['mgOrd', 5], ['pz', 2], ['dmDone', 4]], m: 20, g: 1 },
    { id: 'xmas', name: '크리스마스 파티', start: '2027-12-20', end: '2027-12-26', banner: 'ev_banner_xmas', lead: '숲속 학교에 눈이 내려요. 파티 선물을 받아 가요.', ms: [['picks', 60], ['mgOrd', 5], ['dmDone', 4]], m: 20, g: 1 },
    { id: 'newyear', name: '새해 해돋이', start: '2027-12-27', end: '2028-01-02', banner: 'ev_banner_newyear', fb: 'ev_banner_seollal', lead: '언덕에 올라 새해 첫 해를 봐요. 올해도 숲속 학교를 함께 키워요.', ms: [['picks', 60], ['claims', 3], ['dmDone', 4]], m: 20, g: 1 }
  ];
  // 달마다 바뀌는 미션과 보상 표: 반복 이벤트마다 미션 3개 [종류, 목표], m은 미션 하나의 수업료 분치(분치 보정 적용), g는 황금 도토리
  const EV_MONTHS = {
    1: { harvest: { ms: [['picks', 120], ['shakes', 80], ['mgOrd', 5]], m: 15, g: 1 }, friends: { ms: [['sports', 3], ['dmDone', 6], ['mgOrd', 5]], m: 15, g: 1 } },
    2: { harvest: { ms: [['picks', 100], ['shakes', 100], ['mgOrd', 5]], m: 15, g: 1 }, friends: { ms: [['trips', 2], ['dmDone', 6], ['picks', 60]], m: 15, g: 1 } },
    3: { harvest: { ms: [['picks', 150], ['mgOrd', 5], ['claims', 3]], m: 15, g: 1 }, friends: { ms: [['sports', 2], ['trips', 1], ['shakes', 60]], m: 15, g: 1 } },
    4: { harvest: { ms: [['shakes', 120], ['picks', 100], ['mgOrd', 5]], m: 15, g: 1 }, friends: { ms: [['dmDone', 9], ['sports', 2], ['picks', 80]], m: 15, g: 1 } },
    5: { harvest: { ms: [['picks', 150], ['shakes', 100], ['mgOrd', 5]], m: 15, g: 1 }, friends: { ms: [['sports', 3], ['trips', 2], ['dmDone', 6]], m: 20, g: 1 } },
    6: { harvest: { ms: [['picks', 120], ['mgOrd', 5], ['claims', 3]], m: 15, g: 1 }, friends: { ms: [['dmDone', 6], ['shakes', 80], ['trips', 1]], m: 15, g: 1 } },
    7: { harvest: { ms: [['shakes', 150], ['picks', 100], ['mgOrd', 5]], m: 15, g: 1 }, friends: { ms: [['sports', 3], ['picks', 80], ['dmDone', 6]], m: 15, g: 1 } },
    8: { harvest: { ms: [['picks', 150], ['shakes', 100], ['mgOrd', 5]], m: 15, g: 1 }, friends: { ms: [['trips', 2], ['dmDone', 6], ['mgOrd', 5]], m: 15, g: 1 } },
    9: { harvest: { ms: [['picks', 180], ['shakes', 100], ['mgOrd', 5]], m: 20, g: 1 }, friends: { ms: [['sports', 3], ['dmDone', 6], ['shakes', 60]], m: 15, g: 1 } },
    10: { harvest: { ms: [['picks', 200], ['shakes', 120], ['mgOrd', 5]], m: 20, g: 1 }, friends: { ms: [['sports', 2], ['trips', 2], ['dmDone', 6]], m: 15, g: 1 } },
    11: { harvest: { ms: [['picks', 150], ['mgOrd', 5], ['claims', 3]], m: 15, g: 1 }, friends: { ms: [['dmDone', 9], ['picks', 80], ['shakes', 60]], m: 15, g: 1 } },
    12: { harvest: { ms: [['picks', 120], ['shakes', 100], ['mgOrd', 5]], m: 15, g: 1 }, friends: { ms: [['sports', 3], ['dmDone', 6], ['trips', 1]], m: 20, g: 1 } }
  };
  // 새 매주 이벤트 미션(달마다 같아요). pz는 숲속 퍼즐 판 수
  const EV_WEEK_BASE = { books: { ms: [['pz', 3], ['mgOrd', 5], ['dmDone', 6]], m: 15, g: 1 }, lunch: { ms: [['picks', 100], ['shakes', 60], ['mgOrd', 5]], m: 15, g: 1 } };
  // 출석 도장 7개: 날마다 하나(한국 시간 날짜 기준). 5개째가 큰 보상이라 7일 가운데 이틀 빠져도 완성이에요. m은 수업료 분치, g는 황금 도토리
  const EV_STAMPS = [{ m: 7 }, { m: 7 }, { m: 7, g: 1 }, { m: 7 }, { m: 40, g: 1, e: 5 }, { m: 7 }, { m: 7 }];   // e: 숲의 정수(이벤트니까 정수도). 매주라서 줄임(1.x: 10분치, 5개째 60분치와 황금 3)
  const EV_BOX = { g: 1, dip: 1, e: 10 };   // e: 숲의 정수 10. 그 이벤트 한정 장식이 있으면 처음 한 번 함께 받아요. 매주라서 황금 2 → 1. 미션 3개를 다 하면 받는 기념 상자
  // 미션은 기존 횟수 통계(S.st)의 "이벤트 시작 때와의 차이"로 재요. 놀이 코드에는 손대지 않아요
  const EV_MEASURE = {
    // ok가 거짓이면 아직 못 하는 미션이라 EV_FALLBACK으로 바꿔요.
    // 자리 비운 도토리 받기(30초 넘게 닫았다 열기)와 연수(다람쥐 선생님은 처음부터 Lv.1이고 최고 레벨이 없어요)는 늘 할 수 있어요.
    // 고치기는 그 학년의 시설이 모두 최고 레벨(facMaxed)이고 가구도 모두 끝났으면(furDone) 종업식 전까지 못 해요.
    // 줍기와 흔들기는 놀이터가 있어야 해요(없으면 참나무를 눌러도 안내만 나와요). 오늘의 미션도 줍기와 흔들기가 섞여 나와서 놀이터가 있어야 목표를 채울 수 있어요
    picks: { name: n => `떨어진 도토리 ${n}개 줍기`, ok: () => S.f.playground >= 1 }, shakes: { name: n => `참나무 ${n}번 흔들기`, ok: () => S.f.playground >= 1 },
    ups: { name: n => `시설이나 가구 ${n}번 고치기`, ok: () => facKeys().some(k => !facMaxed(k) || FUR[k].some((_, i) => !furDone(k, i))) },
    trains: { name: n => `선생님 연수 ${n}번 보내기`, ok: () => DEX_TEACHERS.some(k => S.t[k] >= 1 && !teaMaxed(k)) || !vpMaxed() }, claims: { name: n => `자리 비운 도토리 ${n}번 받기` }, dmDone: { name: n => `오늘의 미션 ${n}개 끝내기` },
    sports: { name: n => `${FEST.sports.name} ${n}번 열기`, ok: () => festOpen('sports') }, trips: { name: n => `체험학습 ${n}번 다녀오기`, ok: () => tripOpen() },
    pz: { name: n => `숲속 퍼즐 ${n}판 끝내기`, ok: () => !liveOff('puzzle') },   // 책 읽는 주간
    mgOrd: { name: n => `숲속 합치기 주문 ${n}개 채우기`, v: () => (S.mg && S.mg.st && S.mg.st.orders) || 0, ok: () => !liveOff('merge') }
  };
  const evOk = t => !!EV_MEASURE[t] && (!EV_MEASURE[t].ok || EV_MEASURE[t].ok());
  const evVal = t => Math.floor((EV_MEASURE[t] && EV_MEASURE[t].v ? EV_MEASURE[t].v() : S.st[t]) || 0);   // 합치기 주문은 S.mg.st에서 세요
  // 아직 못 하는 미션 대신 넣어요(앞에서부터, 할 수 있고 겹치지 않는 것만). 흔들기와 줍기가 안 되면 고치기가 먼저 나와요.
  // 놀이터가 없으면 고치기가 늘 되고(놀이터를 지을 수 있어요), 시설과 가구가 모두 끝났으면 놀이터가 있어 흔들기와 줍기가 돼요.
  // 자리 비운 도토리 받기와 연수는 늘 되니 미션 3개가 언제나 채워져요. 그래도 못 찾으면 자리 비운 도토리 받기를 넣어요
  const EV_FALLBACK = [['shakes', 60], ['picks', 80], ['claims', 3], ['dmDone', 4], ['mgOrd', 5], ['pz', 2]];   // 고치기와 연수는 어려워서 이벤트 미션에서 뺐어요. 자리 비운 도토리 받기와 오늘의 미션은 언제나 할 수 있어요
  const dayAdd = (day, n) => { const [y, m, d] = day.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
  const dayDiff = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
  const dayText = day => { const [, m, d] = day.split('-').map(Number); return `${m}월 ${d}일`; };
  // 특별 이벤트가 어느 기간과 하루라도 겹치는지
  const evSpecialHits = (start, end) => EV_SPECIAL.some(e => e.start && e.end && e.start <= end && e.end >= start);
  // 그날 열려 있는 이벤트. key는 회차마다 다른 글자라서(예: harvest:2026-10) 달이 바뀌면 새 회차로 봐요.
  // 특별 이벤트가 그달 반복 이벤트 기간과 하루라도 겹치면 그달 그 반복 이벤트는 아예 건너뛰어요(도장과 미션이 끊기거나 두 번 열리지 않게)
  const weekMon = day => { const wd = (new Date(Date.parse(day + 'T00:00:00Z')).getUTCDay() + 6) % 7; return dayAdd(day, -wd); };   // 그 날이 든 주의 월요일
  const evWeekDef = mon => EV_WEEKLY[(((Math.round(dayDiff(EV_ANCHOR, mon) / 7)) % EV_WEEKLY.length) + EV_WEEKLY.length) % EV_WEEKLY.length];
  function evCurrent(day) {
    day = day || gameToday();
    if (liveOff('event')) return null;   // 핫픽스로 잠시 끔
    for (const e of EV_SPECIAL) if (e.start && e.end && day >= e.start && day <= e.end) return { def: e, key: `${e.id}:${e.start}`, start: e.start, end: e.end };
    const start = weekMon(day), end = dayAdd(start, 6);
    if (evSpecialHits(start, end)) return null;   // 특별 이벤트가 있는 주는 매주 이벤트가 쉬어요
    const e = evWeekDef(start);
    return { def: e, key: `${e.id}:${start}`, start, end };
  }
  // 그날이 특별 이벤트 때문에 쉬는 매주 이벤트 날이면 { def: 매주 이벤트, sp: 그 특별 이벤트 } (특별 이벤트를 월~일로 맞춰서 보통은 없어요)
  function evSkipped(day) {
    day = day || gameToday();
    const start = weekMon(day), end = dayAdd(start, 6);
    const sp = EV_SPECIAL.find(x => x.start && x.end && x.start <= end && x.end >= start);
    if (!sp || (day >= sp.start && day <= sp.end)) return null;
    return { def: evWeekDef(start), sp };
  }
  const evSkipLine = day => { const k = evSkipped(day); return k ? `<p class="ev-skip">이번 주는 ${esc(k.sp.name)} 때문에 ${esc(eun(k.def.name))} 쉬어요</p>` : ''; };
  // 다음 이벤트(60일 안)
  function evNext(day) {
    day = day || gameToday();
    const cur = evCurrent(day);
    for (let i = 1; i <= 60; i++) { const c = evCurrent(dayAdd(day, i)); if (c && (!cur || c.key !== cur.key)) return c; }
    return null;
  }
  // 다가오는 이벤트 n개(지금 열린 것은 빼고, 120일 안)
  function evUpcoming(day, n) {
    day = day || gameToday();
    const cur = evCurrent(day), out = [], seen = new Set(cur ? [cur.key] : []);
    for (let i = 1; i <= 120 && out.length < n; i++) { const c = evCurrent(dayAdd(day, i)); if (c && !seen.has(c.key)) { seen.add(c.key); out.push(c); } }
    return out;
  }
  // 이벤트 미션 3개를 정해요. 아직 못 하는 종류는 대신 미션으로 바꿔요
  function evMissions(cur) {
    const row = cur.def.ms ? cur.def : ((EV_MONTHS[Number(cur.start.slice(5, 7))] || EV_MONTHS[1])[cur.def.id] || EV_WEEK_BASE[cur.def.id]);
    const used = new Set(), out = [];
    for (const [t0, n0] of row.ms) {
      let t = t0, n = n0;
      if (!evOk(t) || used.has(t)) { const alt = EV_FALLBACK.find(f => evOk(f[0]) && !used.has(f[0])) || ['claims', 3]; t = alt[0]; n = alt[1]; }
      used.add(t);
      out.push({ t, n, b: evVal(t), m: Math.max(1, Math.round(row.m * EVC.scale)), g: row.g, done: false });   // 매주라서 3분의 2
    }
    return out;
  }
  // 1초마다: 열린 이벤트가 바뀌었으면(시작, 끝, 다음 달) 회차를 새로 시작해요
  function evSync() {
    // 핫픽스로 이벤트를 잠시 끈 동안에는 회차를 건드리지 않아요. 같은 주에 다시 켜면 도장과 미션이 그대로예요
    if (liveOff('event')) return;
    const cur = evCurrent(), key = cur ? cur.key : '';
    const first = !rt.evInit;
    rt.evInit = true;
    if (S.ev.cur === key) { evFix(); return; }
    S.ev.cur = key; S.ev.start = cur ? gameNow() : 0; S.ev.stamp = { n: 0, last: '' }; S.ev.list = cur ? evMissions(cur) : []; S.ev.box = false;
    if (cur && !first) toast(`${iga(cur.def.name)} 열렸어요!`);   // 놀던 중에 새 이벤트가 열리면 알려 줘요
    save();
  }
  // 이벤트 중에 못 하게 된 미션(시설과 가구를 다 올렸거나 선생님 연수가 끝남 등)은 할 수 있는 미션으로 바꿔요. 바꾼 미션은 지금부터 다시 세요
  function evFix() {
    if (!S.ev.cur || !S.ev.list.length) return false;
    let ch = false;
    S.ev.list.forEach((m, i) => {
      if (m.done || (evOk(m.t) && m.t !== 'ups' && m.t !== 'trains') || evProg(m) >= m.n) return;   // 전에 받은 고치기, 연수 미션도 바꿔요
      const used = new Set(S.ev.list.filter((_, j) => j !== i).map(x => x.t));
      const alt = EV_FALLBACK.find(f => evOk(f[0]) && !used.has(f[0])); if (!alt) return;
      m.t = alt[0]; m.n = alt[1]; m.b = evVal(alt[0]); ch = true;
    });
    if (ch) save();
    return ch;
  }
  const evProg = m => Math.max(0, Math.min(m.n, evVal(m.t) - m.b));
  const evReady = m => !m.done && evProg(m) >= m.n;
  const evAllDone = () => S.ev.list.length > 0 && S.ev.list.every(m => m.done);
  const evStampReady = () => !!S.ev.cur && !liveOff('event') && S.ev.stamp.n < EV_STAMPS.length && S.ev.stamp.last !== gameToday();
  // 보상을 주기 전에 지금 회차로 맞춰요(월요일 0시를 막 넘겼으면 새 회차부터). 저장된 회차가 지금 열린 이벤트일 때만 줘요
  const evLive = () => { if (liveOff('event')) return null; evSync(); const cur = evCurrent(); return cur && cur.key === S.ev.cur ? cur : null; };
  const evClaimable = () => !!S.ev.cur && !liveOff('event') && (evStampReady() || S.ev.list.some(evReady) || (evAllDone() && !S.ev.box));
  function claimStamp() {
    const cur = evLive();
    if (!cur || !evStampReady()) return false;
    const i = S.ev.stamp.n, r = EV_STAMPS[i];
    S.ev.stamp = { n: i + 1, last: gameToday() };
    const a = r.m ? minAcorns(r.m) : 0;
    if (a > 0) { S.budget += a; earn(a); }
    const gIt = r.g ? goldOr(r.g) : null;
    if (r.e) addEss(r.e);
    const me = i + 1 === 5 ? MG.E.stamp5 : MG.E.stamp; mgAddEnergy(me);   // 합치기 에너지, 도장 7개를 다 모으면 강화 조각
    const mu = i + 1 === EV_STAMPS.length ? 1 : 0, muIt = mu ? mgAddUp(mu) : null;
    // 도장 7개를 다 모으면 그 이벤트 한정 학생 모자(그림이 있고 아직 없을 때)
    const hid = mu ? 'ev_' + cur.def.id : '', hat = hid && COS.hat.items.find(x => x.id === hid);
    const gotHat = !!(hat && evHatArt(hid) && !S.cos.own.includes('hat:' + hid));
    if (gotHat) S.cos.own.push('hat:' + hid);
    const tkIts = [tkGive('stamp'), i + 1 === 5 ? tkGive('stamp5') : null];   // 단축권
    sfx('quest'); buzz(12);
    showReward({ title: `이벤트 도장 ${i + 1}개째!`, sub: gotHat ? `한정 모자 '${hat.name}'${eulOf(hat.name)} 받았어요! 꾸미기 백화점 옷장에서 학생들에게 씌울 수 있어요` : i + 1 === 5 ? '도장 다섯 개를 모아 큰 선물을 받았어요' : i + 1 < 5 ? `${5 - i - 1}개 더 모으면 큰 선물이 있어요` : '끝까지 함께해 줘서 고마워요',
      art: gotHat ? `<img src="${IMG('cos_hat_' + hid)}" alt="" style="width:92px;height:92px;object-fit:contain">` : undefined,
      items: [a > 0 ? { ic: 'acorn', t: `도토리 +${fmt(a)}` } : null, gIt, r.e ? { ic: 'ess', t: `숲의 정수 +${r.e}` } : null, ...tkIts, { ic: 'mge', t: `합치기 에너지 +${me}` }, muIt] });
    save(); renderEvent(); renderHUD();
    return true;
  }
  function claimEvMission(i) {
    if (!evLive()) return false;
    const m = S.ev.list[i];
    if (!m || !evReady(m)) return false;
    m.done = true;
    const a = m.m ? minAcorns(m.m) : 0;
    if (a > 0) { S.budget += a; earn(a); }
    const gIt = m.g ? goldOr(m.g) : null;
    const tkIt = tkGive('evm');   // 단축권
    sfx('quest'); buzz(12);
    showReward({ title: '이벤트 미션 완료!', sub: EV_MEASURE[m.t].name(m.n), items: [a > 0 ? { ic: 'acorn', t: `도토리 +${fmt(a)}` } : null, gIt, tkIt] });
    save(); renderEvent(); renderHUD();
    return true;
  }
  function claimEvBox() {
    const cur = evLive();
    if (!cur || !evAllDone() || S.ev.box) return false;
    S.ev.box = true;
    addGold(EV_BOX.g); addDip(EV_BOX.dip); addEss(EV_BOX.e);
    const dd = DECO_BY['ev_' + cur.def.id], gotDeco = evDecoArt(dd) && !decoOwn(dd.id);   // 이벤트 한정 장식
    if (gotDeco) S.deco.own[dd.id] = 1;
    mgAddEnergy(MG.E.box); const upIt = mgAddUp(1);
    const tkIt = tkGive('box');   // 단축권
    sfx('quest'); buzz(12);
    showReward({ title: '기념 상자를 열었어요!', sub: gotDeco ? `한정 장식 '${dd.name}'${eulOf(dd.name)} 받았어요! 꾸미기 모드에서 지도에 놓아 보세요` : '이벤트 미션을 모두 마쳤어요',
      art: gotDeco ? `<img src="${IMG(dd.img)}" alt="" style="width:92px;height:92px;object-fit:contain">` : pic7('ev_box', 'ic_fund'), items: [{ ic: 'gold', t: `황금 도토리 +${EV_BOX.g}` }, { ic: 'ess', t: `숲의 정수 +${EV_BOX.e}` }, { ic: 'mge', t: `합치기 에너지 +${MG.E.box}` }, upIt, { ic: 'dip', t: `수료증 +${EV_BOX.dip}장` }, tkIt].filter(Boolean) });
    save(); renderEvent(); renderHUD();
    return true;
  }
