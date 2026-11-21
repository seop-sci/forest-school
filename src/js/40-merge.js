  /* ===== 1.8.0 숲속 합치기 BEGIN =====
     미니게임 2. 판 하나(8×10)에 생산기 4개가 있고, 생산기를 누르면 에너지 1을 쓰고 조각이 나와요. 같은 조각 둘을 겹치면 다음 단계(10단계까지).
     생산기는 짝이 되는 종류 둘을 번갈아 내고(참나무: 도토리와 버섯 …), 움직일 수 있고, 강화 조각으로 Lv.5까지 올라요(높은 단계가 바로 나와요).
     에너지는 최고 100, 1분에 1 회복(게임 시계). 오늘의 미션, 보너스 상자, 이번 주 미션, 이벤트 도장과 기념 상자, 광고로 더 받아요.
     학생 주문을 채우면 도토리(수업료 분치, 조각에 든 에너지 × 0.2분)와 장식 조각(6단계 이상), 강화 조각(8단계 이상). 숲의 정수는 주지 않아요.
     설계: 프로젝트 문서 "머지 게임 설계안 (1.8.0)". 그림은 FS_IMG180 묶음(아직 없으면 색 조각과 그림 문자) */
  const MG = {
    W: 8, H: 10, EMAX: 100, REGEN: 60000, ECAP: 999, UPCAP: 99, PCAP: 9999,
    SELL: 0.1, ORDER: 0.2, MIXED: 0.5, HINT_AFTER: 7000, HINT_SHOW: 3000,                           // 에너지 1당 수업료 분치 (팔기, 주문)
    PIECES: [[10, 3], [8, 2], [6, 1]], UPAT: 8,        // 주문 단계별 장식 조각, 강화 조각이 나오는 단계
    SWAP: 30 * 60000, AD: { n: 2, e: 50 },           // 주문 바꾸기 간격, 광고 하루 2번 +50
    E: { dm: 10, bonus: 15, wk: 30, stamp: 7, stamp5: 20, box: 35 },   // 이벤트가 매주라서 도장과 상자 에너지를 줄임(10, 30, 50)
    LV: [[100], [95, 5], [90, 8, 2], [85, 11, 3.5, 0.5], [80, 14, 5, 1]],   // 생산기 레벨마다 1~4단계가 나올 확률(%)
    UPCOST: [0, 1, 1, 2, 2],                         // Lv.n+1로 올릴 때 드는 강화 조각 (index = 지금 레벨)
    kinds: {
      a: { name: '도토리', em: '🌰', c: '#E8D3A8', r: '#A0703C', st: ['도토리', '도토리 한 줌', '도토리 바구니', '도토리 자루', '도토리 수레', '도토리 창고', '참나무 묘목', '참나무', '큰 참나무', '황금 참나무'] },
      m: { name: '버섯', em: '🍄', c: '#F6D2C8', r: '#D9534A', st: ['작은 버섯', '버섯 한 쌍', '버섯 바구니', '큰 버섯', '버섯 우산', '버섯 램프', '버섯 집', '버섯 마을', '반딧불 버섯 숲', '황금 버섯 왕국'] },
      f: { name: '급식', em: '🍪', c: '#FFE0B8', r: '#F08A24', st: ['도토리 쿠키', '산딸기 잼', '버섯 수프', '도토리 빵', '꿀 호떡', '열매 샐러드', '도토리 케이크', '소풍 도시락', '잔치 상', '숲속 뷔페'] },
      d: { name: '음료', em: '🧃', c: '#F8D7E6', r: '#3E86D0', st: ['도토리 차', '산딸기 주스', '꿀물', '우유 한 잔', '코코아', '과일 펀치', '찻주전자 세트', '주스 분수', '숲속 찻집', '무지개 음료 탑'] },
      s: { name: '학용품', em: '✏️', c: '#FFF1B8', r: '#D9A81C', st: ['몽당연필', '연필', '지우개와 연필', '필통', '공책', '그림책', '책가방', '책상 세트', '작은 서재', '숲속 도서관 모형'] },
      c: { name: '미술용품', em: '🎨', c: '#E3D4F5', r: '#8A5BC2', st: ['크레파스', '물감 통', '붓', '팔레트', '스케치북', '그림', '액자 그림', '이젤', '작은 미술실', '숲속 미술관'] },
      g: { name: '꽃', em: '🌸', c: '#FBD5DE', r: '#E06C9F', st: ['씨앗', '새싹', '꽃봉오리', '들꽃', '꽃다발', '꽃 화분', '꽃밭', '꽃 아치', '작은 정원', '무지개 정원'] },
      v: { name: '채소', em: '🥕', c: '#D8EBC0', r: '#4E9A4A', st: ['당근', '토마토', '호박', '채소 바구니', '텃밭 상자', '허수아비 텃밭', '작은 온실', '채소 수레', '숲속 농장', '황금 호박 농장'] }
    },
    gens: { A: { name: '참나무', em: '🌳', kinds: ['a', 'm'] }, F: { name: '급식 냄비', em: '🍲', kinds: ['f', 'd'] }, S: { name: '문구함', em: '🧰', kinds: ['s', 'c'] }, G: { name: '화분', em: '🪴', kinds: ['g', 'v'] } },
    genAt: [0, 2, 5, 7],                              // 처음 생산기 자리(맨 위 줄)
    UP_EVERY: 20,   // 주문 20개마다 한 단계 위 주문
    MUL: [[3, 2], [5, 3], [7, 4]]   // ×2 3단계, ×3 5단계, ×4 7단계로 앞당김(은 4, 6, 8)
                        // 에너지 배수: 어느 종류든 이 단계를 처음 만들면 ×2, ×3, ×4가 열려요(주문이 그 단계쯤부터 나와요)
  };
  const MG_KINDS = Object.keys(MG.kinds), MG_GENS = Object.keys(MG.gens), MG_N = MG.W * MG.H;
  // 합치기 도감 모은 개수 보상(10칸마다, 업적처럼). min은 수업료 분치
  const MG_DEX_MS = [[10, { ess: 5 }], [20, { min: 30 }], [30, { ess: 10 }], [40, { min: 60 }], [50, { ess: 15 }], [60, { min: 90 }], [70, { ess: 20 }], [80, { ess: 30, gold: 5 }]];
  const mgFresh = () => ({ mul: 1, mulSeen: 1, mm: 0, mulNew: false, upq: 0, xr: 0, xd: { day: '', n: 0 }, e: MG.EMAX, eAt: 0, board: '', last: {}, orders: [], swapAt: 0, best: {}, pieces: 0, up: 0, ad: { day: '', n: 0 }, bst: { day: '', lucky: 0, energy: 0, luck: 0 }, seen: false, dexPaid: [], dexE: {}, dexMs: 0, st: { merges: 0, orders: 0, made10: 0, ups: 0, taps: 0 } });
  // 칸 글자: 조각은 종류 소문자 + 단계(1~9, 10은 x), 생산기는 대문자 + 레벨(1~5), 빈칸은 '..'
  const mgLvCh = n => n >= 10 ? 'x' : String(n);
  const mgLvOf = ch => ch === 'x' ? 10 : (Number(ch) || 0);
  const mgCells = () => { const b = S.mg.board, out = []; for (let i = 0; i < MG_N; i++) out.push(b.slice(i * 2, i * 2 + 2) || '..'); return out; };
  const mgSetCells = cells => { S.mg.board = cells.join(''); };
  const mgIsGen = code => !!MG.gens[code[0]];
  const mgIsItem = code => !!MG.kinds[code[0]];
  const mgEmptyBoard = () => { const c = Array(MG_N).fill('..'); MG_GENS.forEach((G, i) => { c[MG.genAt[i]] = G + '1'; }); return c; };
  const IMG180 = k => (window.FS_IMG180 && window.FS_IMG180[k]) || '';
  const mgItemKey = (k, n) => `mg_${k}_${String(n).padStart(2, '0')}`;
  // 조각 하나에 든 에너지: 단계 n = 2^(n-1). 보상은 이 값에 비례해요
  const mgEnergyOf = n => Math.pow(2, n - 1);
  const mgSellMin = n => mgEnergyOf(n) * MG.SELL;
  const mgOrderMin = (n, c) => mgEnergyOf(n) * c * MG.ORDER;
  // 저장 읽기: sanitize()에서 불러요. 판 글자가 이상하거나 생산기가 빠졌으면 바로잡아요
  function sanitize180(d, s) {
    s.mg = mgFresh();
    const m = d.mg && typeof d.mg === 'object' ? d.mg : null;
    if (!m) { s.mg.board = mgEmptyBoard().join(''); return; }
    s.mg.e = Math.min(MG.ECAP, Math.floor(numFb(m.e, 0, MG.EMAX)));
    s.mg.eAt = Math.min(numFb(m.eAt, 0, 0), Date.now() + 366 * 86400000);
    let cells = null;
    if (typeof m.board === 'string' && m.board.length === MG_N * 2) { cells = []; for (let i = 0; i < MG_N; i++) cells.push(m.board.slice(i * 2, i * 2 + 2)); }
    if (cells) {
      cells = cells.map(c => (mgIsItem(c) && mgLvOf(c[1]) >= 1) ? c : (mgIsGen(c) && mgLvOf(c[1]) >= 1 && mgLvOf(c[1]) <= 5) ? c : '..');
      for (const G of MG_GENS) {   // 생산기는 종류마다 꼭 하나: 둘이면 뒤의 것을 빈칸으로, 없으면 빈칸에 Lv.1로
        let seen = false;
        cells = cells.map(c => { if (c[0] !== G) return c; if (seen) return '..'; seen = true; return c; });
        if (!seen) { const j = cells.indexOf('..'); if (j >= 0) cells[j] = G + '1'; }
      }
      if (MG_GENS.some(G => !cells.some(c => c[0] === G))) cells = mgEmptyBoard();
    } else cells = mgEmptyBoard();
    s.mg.board = cells.join('');
    if (m.last && typeof m.last === 'object') for (const G of MG_GENS) if (MG.gens[G].kinds.includes(m.last[G])) s.mg.last[G] = m.last[G];
    if (Array.isArray(m.orders)) s.mg.orders = m.orders.map(o => {   // 주문: it = [{k, n, c}] 1~2개 (옛 모양 {k, n, c}도 받아요)
      if (!o || typeof o !== 'object') return null;
      const raw = Array.isArray(o.it) ? o.it : [o];
      const it = raw.filter(x => x && MG.kinds[x.k] && numFb(x.n, 2, 0) >= 2 && numFb(x.n, 0, 0) <= 10).slice(0, 2)
        .map(x => ({ k: x.k, n: Math.floor(x.n), c: Math.min(3, Math.max(1, Math.floor(numFb(x.c, 1, 1, SAVE_CAP.count)))) }));
      if (!it.length || (it.length === 2 && it[0].k === it[1].k)) return null;
      return { it, who: typeof o.who === 'string' ? o.who.slice(0, 12) : 'rabbit', ...(o.up && it.length === 1 ? { up: 1 } : {}) };
    }).filter(Boolean).slice(0, 3);
    s.mg.swapAt = numFb(m.swapAt, 0, 0);
    if (m.best && typeof m.best === 'object') for (const k of MG_KINDS) s.mg.best[k] = Math.min(10, Math.floor(numFb(m.best[k], 0, 0)));
    s.mg.pieces = Math.min(MG.PCAP, Math.floor(numFb(m.pieces, 0, 0)));
    s.mg.dexPaid = Array.isArray(m.dexPaid) ? [...new Set(m.dexPaid.filter(k => MG_KINDS.includes(k) || k === 'all'))] : [];   // 합치기 도감 받은 보상
    s.mg.up = Math.min(MG.UPCAP, Math.floor(numFb(m.up, 0, 0)));
    if (m.ad && typeof m.ad === 'object') s.mg.ad = { day: typeof m.ad.day === 'string' ? m.ad.day.slice(0, 10) : '', n: Math.floor(numFb(m.ad.n, 0, 0, SAVE_CAP.count)) };
    if (m.bst && typeof m.bst === 'object') s.mg.bst = { day: typeof m.bst.day === 'string' ? m.bst.day.slice(0, 10) : '', lucky: Math.floor(numFb(m.bst.lucky, 0, 0, SAVE_CAP.count)), energy: Math.floor(numFb(m.bst.energy, 0, 0, SAVE_CAP.count)), luck: Math.min(MGB.lucky.taps, Math.floor(numFb(m.bst.luck, 0, 0))) };   // 부스터
    if (m.dexE && typeof m.dexE === 'object') for (const k of MG_KINDS) { const v = Math.floor(numFb(m.dexE[k], 0, 0, SAVE_CAP.count)); if (v) s.mg.dexE[k] = v & 1023; }   // 도감 칸마다 받은 정수(10칸 비트)
    s.mg.dexMs = Math.min(MG_DEX_MS.length, Math.floor(numFb(m.dexMs, 0, 0)));   // 모은 개수 보상 받은 단계
    s.mg.seen = !!m.seen;
    s.mg.mul = Math.min(4, Math.max(1, Math.floor(numFb(m.mul, 1, 1, SAVE_CAP.count)))); s.mg.mulSeen = Math.min(4, Math.max(1, Math.floor(numFb(m.mulSeen, 1, 1, SAVE_CAP.count)))); s.mg.mm = m.mm ? 1 : 0; s.mg.mulNew = !!m.mulNew; s.mg.upq = Math.min(3, Math.floor(numFb(m.upq, 0, 0)));   // 한 단계 위 주문을 기다리는 수. 만드는 방식, 새 배수 강조. 에너지 배수
    s.mg.xr = Math.min(1, numFb(m.xr, 0, 0)); if (m.xd && typeof m.xd === 'object') s.mg.xd = { day: typeof m.xd.day === 'string' ? m.xd.day.slice(0, 10) : '', n: Math.floor(numFb(m.xd.n, 0, 0, SAVE_CAP.count)) };   // 미술 XP 남은 몫과 오늘 받은 양
    if (m.st && typeof m.st === 'object') for (const k of Object.keys(s.mg.st)) s.mg.st[k] = Math.floor(numFb(m.st[k], 0, 0, SAVE_CAP.count));
  }
  /* ---- 에너지 ---- */
  function mgTick() {
    const m = S.mg, now = gameNow();
    if (!m.eAt || m.eAt > now) { m.eAt = now; return; }
    if (m.e >= mgEMax()) { m.eAt = now; return; }
    const got = Math.floor((now - m.eAt) / MG.REGEN);
    if (got <= 0) return;
    m.e = Math.min(mgEMax(), m.e + got);
    m.eAt = m.e >= mgEMax() ? now : m.eAt + got * MG.REGEN;
  }
  // 보상으로 받는 에너지는 100을 넘어도 돼요(회복만 100에서 멈춰요)
  function mgAddEnergy(n) { mgTick(); S.mg.e = Math.min(MG.ECAP, S.mg.e + n); if (S.mg.e >= mgEMax()) S.mg.eAt = gameNow(); }
  /* 조정안 4: 생산기 넷이 모두 Lv.5면 더 쓸 곳이 없으니, 그 뒤 받는 강화 조각 하나는 숲의 정수 5개로 바꿔 줘요
     받은 것을 보상 칸 모양({ ic, t })으로 돌려줘요 */
  const MG_UP_ESS = 5;
  const mgGensMax = () => { const c = mgCells(); return MG_GENS.every(G => c.some(x => x[0] === G && mgLvOf(x[1]) >= 5)); };
  function mgAddUp(n) {
    if (!(n > 0)) return null;
    if (mgGensMax()) { addEss(n * MG_UP_ESS); return { ic: 'ess', t: `숲의 정수 +${n * MG_UP_ESS} (강화 조각 대신)` }; }
    S.mg.up = Math.min(MG.UPCAP, S.mg.up + n);
    return { ic: '🔑', t: `생산기 강화 조각 +${n}` };
  }
  // 남아 있던 강화 조각을 한꺼번에 정수로 바꿔요(생산기가 모두 최고일 때만)
  function mgUpSwap() {
    if (!mgGensMax() || !(S.mg.up > 0)) return 0;
    const n = S.mg.up, e = n * MG_UP_ESS;
    S.mg.up = 0; addEss(e);
    sfx('quest'); toast(`강화 조각 ${n}개를 숲의 정수 ${e}개로 바꿨어요`);
    mgRenderTop(); save();
    return e;
  }
  function mgUpSwapAsk() {
    if (!mgGensMax()) { toast(`강화 조각 ${S.mg.up}개. 생산기를 눌러 강화해요`); return; }
    if (!(S.mg.up > 0)) { toast(`생산기가 모두 최고 레벨이에요. 이제 강화 조각은 숲의 정수 ${MG_UP_ESS}개로 바뀌어요`); return; }
    askBox({ title: '숲의 정수로 바꿀까요?', text: `생산기가 모두 최고 레벨이에요\n강화 조각 ${S.mg.up}개를 숲의 정수 ${S.mg.up * MG_UP_ESS}개로 바꿔요`, yes: '바꾸기', onYes: () => mgUpSwap() });
  }
  const mgEnergyIn = () => { mgTick(); const m = S.mg; if (m.e >= mgEMax()) return 0; return Math.max(1, Math.ceil((MG.REGEN - (gameNow() - m.eAt)) / 1000)); };
  const mgAdLeft = () => { if (S.mg.ad.day !== gameToday()) S.mg.ad = { day: gameToday(), n: 0 }; return Math.max(0, MG.AD.n - S.mg.ad.n); };
  /* ---- 부스터 (재화 원칙: 숲의 정수 고정값) ----
     행운의 생산기: 정수 8, 하루 1번. 다음 30번 누르기는 한 단계 높은 조각이 나와요(에너지 30만큼 이득)
     에너지 +20: 정수 5, 하루 3번 */
  const MGB = {
    lucky: { e: 8, day: 1, taps: 30, ic: 'boost_mg_lucky', name: '행운의 생산기', d: '다음 30번은 한 단계 높은 조각이 나와요' },
    energy: { e: 5, day: 3, add: 20, ic: 'boost_mg_energy', name: '에너지 +20', d: '에너지 20을 바로 채워요' }
  };
  const MGB_IDS = Object.keys(MGB);
  function mgBstDay() { const b = S.mg.bst; if (dayRoll(b)) { b.lucky = 0; b.energy = 0; } return b; }
  const mgBstLeft = id => Math.max(0, MGB[id].day - mgBstDay()[id]);
  function mgBuyBoost(id) {
    const B = MGB[id]; if (!B) return false;
    if (mgBstLeft(id) <= 0) { toast(`오늘 ${B.name} 부스터는 다 샀어요. 내일 다시 열려요`); return false; }
    if (id === 'lucky' && S.mg.bst.luck > 0) { toast(`행운이 아직 ${S.mg.bst.luck}번 남았어요`); return false; }
    if (S.ess < B.e) { toast(essShort(B.e - S.ess)); return false; }
    S.ess -= B.e; S.st.esSpent = (S.st.esSpent || 0) + B.e;
    S.mg.bst[id] += 1;
    if (id === 'lucky') { S.mg.bst.luck = B.taps; toast(`행운의 생산기! 다음 ${B.taps}번은 한 단계 높게 나와요`); }
    else { mgAddEnergy(B.add); toast(`에너지 +${B.add}`); mgBump('#mgE'); }
    sfx('coin'); buzz(12);
    save(); renderEss(); mgRenderTop(); mgRenderOrders(); mgRenderFoot(); mgRenderBoost();
    return true;
  }
  function mgRenderBoost() {
    const box = $('#mgbList'); if (!box) return;
    box.innerHTML = MGB_IDS.map(id => {
      const B = MGB[id], left = mgBstLeft(id), busy = id === 'lucky' && S.mg.bst.luck > 0, off = left <= 0 || busy || S.ess < B.e;
      const note = busy ? `행운 ${S.mg.bst.luck}번 남음` : `오늘 ${left}/${B.day}번`;
      return `<button class="pzb${off ? ' poor' : ''}" type="button" data-mgb="${id}" aria-disabled="${off}"><span class="pzb-ic" style="background-image:url('${IMG(B.ic)}')" aria-hidden="true"></span>` +
        `<span class="pzb-tx"><b>${B.name}</b><small>${B.d}<br>${note}</small></span><span class="pzb-pr">${ESS_ICON()}${fmt(B.e)}</span></button>`;
    }).join('');
    $('#mgbHave').innerHTML = `가진 숲의 정수 ${ESS_ICON()}${fmt(S.ess)}`;
  }
  function mgOpenBoost() { mgRenderBoost(); $('#mgBoostSheet').hidden = false; }
  /* ---- 생산기 ---- */
  function mgSpawnLevel(lv) {
    const row = MG.LV[Math.max(0, Math.min(4, lv - 1))], r = Math.random() * 100;
    let acc = 0;
    for (let i = 0; i < row.length; i++) { acc += row[i]; if (r < acc) return i + 1; }
    return 1;
  }
  function mgSpawnKind(G) {
    const ks = MG.gens[G].kinds, last = S.mg.last[G];
    const cnt = S.mg.lastN && S.mg.lastN[G] || 0;
    let k = Math.random() < 0.5 ? ks[0] : ks[1];
    if (last && k === last && cnt >= 2) k = ks[0] === last ? ks[1] : ks[0];   // 같은 종류가 세 번 연달아 나오지 않게
    S.mg.lastN = S.mg.lastN || {};
    S.mg.lastN[G] = k === last ? cnt + 1 : 1;
    S.mg.last[G] = k;
    return k;
  }
  // 생산기에서 가장 가까운 빈칸(줄과 칸 거리의 합이 가장 작은 곳)
  function mgNearestEmpty(cells, from) {
    const fr = Math.floor(from / MG.W), fc = from % MG.W;
    let best = -1, bd = 1e9;
    cells.forEach((c, i) => { if (c !== '..') return; const d = Math.abs(Math.floor(i / MG.W) - fr) + Math.abs(i % MG.W - fc); if (d < bd) { bd = d; best = i; } });
    return best;
  }
  // 에너지 배수: 만든 가장 높은 단계로 ×2, ×3, ×4가 열려요. 단추를 누를 때마다 ×1 → ×2 → … → 열린 최대 → ×1
  const mgBestMax = () => MG_KINDS.reduce((a, k) => Math.max(a, S.mg.best[k] || 0), 0);
  const mgMulMax = () => MG.MUL.reduce((a, [lv, x]) => mgBestMax() >= lv ? Math.max(a, x) : a, 1);
  // '합쳐서 1개'(S.mg.mm = 1)면 같은 에너지로 단계가 높은 조각 하나. ×3은 나누어떨어지지 않아서 건너뛰어요(×1, ×2, ×4)
  const mgMulOk = x => !(S.mg.mm && x === 3);
  const mgMul = () => { let m = Math.max(1, Math.min(S.mg.mul || 1, mgMulMax())); if (!mgMulOk(m)) m = 2; return m; };
  // 배수와 방식은 단추를 나란히 두고 바로 골라요. 고를 때마다 뜨던 안내 글은 빼고, 처음 열릴 때만 NEW와 설명 창
  function mgPickMul(x) {
    const mx = mgMulMax(); x = Math.max(1, Math.min(mx, x | 0));
    if (!mgMulOk(x)) { toast('×3은 따로만 만들 수 있어요'); return; }
    S.mg.mul = x; S.mg.mulNew = false;
    sfx('tap'); buzz(6); mgRenderMul(); save();
  }
  function mgPickMode(v) {
    v = v ? 1 : 0;
    if (v && mgMul() === 3) { toast('×3은 합쳐서 만들 수 없어요'); return; }
    S.mg.mm = v; if (!mgMulOk(S.mg.mul)) S.mg.mul = 2;
    sfx('tap'); buzz(6); mgRenderMul(); save();
  }
  function mgModeTap() { mgPickMode(S.mg.mm ? 0 : 1); }
  function mgRenderMul() {
    const b = $('#mgMuls'), md = $('#mgModes'); if (!b || !md || !S) return;
    const mx = mgMulMax(), m = mgMul(), key = [mx, m, S.mg.mm, !!S.mg.mulNew].join('|');
    if (b.dataset.key !== key) {
      b.dataset.key = key; b.hidden = md.hidden = mx <= 1;
      const xs = []; for (let x = 1; x <= mx; x++) xs.push(x);
      b.innerHTML = xs.map(x => `<button type="button" data-mul="${x}" class="${x === m ? 'on' : ''}${S.mg.mulNew && x === mx ? ' new' : ''}" aria-pressed="${x === m}" aria-disabled="${mgMulOk(x) ? 'false' : 'true'}" aria-label="에너지 ×${x}">×${x}</button>`).join('');
      md.innerHTML = `<button type="button" data-mm="0" class="${S.mg.mm ? '' : 'on'}" aria-pressed="${!S.mg.mm}">따로 ${m > 1 ? m : 'n'}개</button>` +
        `<button type="button" data-mm="1" class="one${S.mg.mm ? ' on' : ''}" aria-pressed="${!!S.mg.mm}" aria-disabled="${m === 3 ? 'true' : 'false'}">합쳐서 1개</button>`;
    }
    if (mx > (S.mg.mulSeen || 1)) { S.mg.mulSeen = mx; S.mg.mulNew = true; save(); mgMulSheet(mx); }
  }
  // 배수가 처음 열리면 토스트 대신 설명 창(잘 안 보여서)
  function mgMulSheet(mx) {
    const sh = $('#mgMulSheet'); if (!sh) return;
    $('#mgMulTitle').textContent = `에너지 ×${mx}가 열렸어요!`;
    $('#mgMulLead').textContent = `에너지 옆 ×${mx}를 고르면\n생산기를 한 번 누를 때 에너지를 ${mx}까지 써요.\n아래 줄에서 만드는 방식을 골라요.\n따로: 조각이 여러 개 나와요\n합쳐서 1개: 단계가 높은 조각 하나(×2, ×4)`;   // 두 줄
    $('.mg-mul-pic', sh).textContent = '×' + mx;
    sh.hidden = false; sfx('quest');
  }
  function mgTapGen(i) {
    const cells = mgCells(), code = cells[i];
    if (!mgIsGen(code)) return false;
    mgTick();
    const to = mgNearestEmpty(cells, i);
    if (to < 0) { mgShake(i); toast('판이 가득 찼어요. 조각을 합치거나 팔아서 자리를 비워요'); return false; }
    if (S.mg.e < 1) { mgShake(i); toast(`에너지가 모자라요. ${mgEnergyIn()}초 뒤에 1 차요`); return false; }
    if (S.mg.e >= mgEMax()) S.mg.eAt = gameNow();   // 가득 찬 상태에서 처음 쓰면 이때부터 회복을 재요
    // 에너지 배수: 조각마다 에너지 1. 빈칸이나 에너지가 모자라면 되는 만큼만 만들어요
    const mul = mgMul(), made = [];
    if (S.mg.mm && mul > 1) {   // 합쳐서 1개: 에너지 mul을 쓰고 log2(mul)단계 높은 조각 하나. 에너지가 모자라면 되는 만큼(×4 → ×2)
      let m = S.mg.e >= mul ? mul : S.mg.e >= 2 ? 2 : 1;
      if (S.mg.bst.luck > 0 && S.mg.bst.luck < m) m = S.mg.bst.luck >= 2 ? 2 : 1;
      S.mg.e -= m;
      const k = mgSpawnKind(code[0]);
      let n = mgSpawnLevel(mgLvOf(code[1])) + Math.round(Math.log2(m));
      if (S.mg.bst.luck > 0) { S.mg.bst.luck -= m; n += 1; }
      n = Math.min(10, n);
      cells[to] = k + mgLvCh(n); S.mg.st.taps += m; mgNoteBest(k, n); made.push(to);
      if (m < mul) toast(`에너지나 남은 행운에 맞춰 ×${m}로 만들었어요`);
    } else
    for (let j = 0; j < mul; j++) {
      const t = j === 0 ? to : mgNearestEmpty(cells, i);
      if (t < 0 || S.mg.e < 1) break;
      S.mg.e -= 1;
      const k = mgSpawnKind(code[0]);
      let n = mgSpawnLevel(mgLvOf(code[1]));
      if (S.mg.bst.luck > 0) { S.mg.bst.luck -= 1; n = Math.min(10, n + 1); }   // 행운의 생산기
      cells[t] = k + mgLvCh(n);
      S.mg.st.taps += 1;
      mgNoteBest(k, n);
      made.push(t);
    }
    mgSetCells(cells);
    mgUI.newBest = false;
    const gen = mgUI.cells[i]; if (gen && !rt.reduced) { gen.classList.remove('press'); void gen.offsetWidth; gen.classList.add('press'); setTimeout(() => gen.classList.remove('press'), 260); }
    made.forEach(t => mgFly(i, t, cells[t]));
    if (mul > 1 && !S.mg.mm && made.length < mul) toast(made.length < mul && S.mg.e < 1 ? `에너지가 모자라 조각 ${made.length}개만 만들었어요` : `빈칸이 모자라 조각 ${made.length}개만 만들었어요`);
    mgRenderMul();
    sfx('tap'); buzz(6);
    mgRenderBoard(); mgRenderTop(); mgBump('#mgE'); mgRenderOrders(); mgSelect(i);
    save();
    return true;
  }
  function mgNoteBest(k, n) { if ((S.mg.best[k] || 0) < n) { S.mg.best[k] = n; if (n >= 10) S.mg.st.made10 += 1; mgUI.newBest = true; } }
  /* ---- 합치기 도감: 종류마다 1~10단계. 한 번 만든 가장 높은 단계(best)까지 모은 것으로 쳐요(그 아래 단계는 꼭 거쳐야 하니까요).
     한 종류를 10단계까지 모으면 한 번만 보상, 8종류를 모두 모으면 큰 보상. 매일 생기는 정수가 아니라 한 번뿐인 모으기 보상이에요 */
  const MG_DEX = { kind: { ess: 30, pc: 5 }, all: { ess: 100, gold: 10 } };
  const mgDexN = () => MG_KINDS.reduce((a, k) => a + Math.min(10, S.mg.best[k] || 0), 0);
  const mgDexCan = k => k === 'all' ? MG_KINDS.every(x => (S.mg.best[x] || 0) >= 10) && !S.mg.dexPaid.includes('all') : (S.mg.best[k] || 0) >= 10 && !S.mg.dexPaid.includes(k);
  // 처음 만든 칸마다 숲의 정수 1개(눌러서 받기, 전에 만든 칸도), 모은 개수 10, 20 … 80마다 보상(업적처럼)
  const mgDexEssCan = (k, n) => n <= Math.min(10, S.mg.best[k] || 0) && !((S.mg.dexE[k] || 0) & (1 << (n - 1)));
  const mgDexEssN = () => MG_KINDS.reduce((a, k) => { let c = 0; for (let n = 1; n <= 10; n++) if (mgDexEssCan(k, n)) c++; return a + c; }, 0);
  const mgDexMsCan = () => S.mg.dexMs < MG_DEX_MS.length && mgDexN() >= MG_DEX_MS[S.mg.dexMs][0];
  const mgDexAny = () => MG_KINDS.some(mgDexCan) || mgDexCan('all') || mgDexMsCan() || mgDexEssN() > 0;
  function mgDexEss(k, n, el) {
    if (!MG.kinds[k] || !mgDexEssCan(k, n)) return false;
    S.mg.dexE[k] = (S.mg.dexE[k] || 0) | (1 << (n - 1));
    addEss(1); sfx('coin'); buzz(6);
    toast(`숲의 정수 +1 (${MG.kinds[k].st[n - 1]})`);
    save(); mgRenderDex(); mgRenderFoot();
    return true;
  }
  function mgDexMsClaim() {
    if (!mgDexMsCan()) return false;
    const [need, R] = MG_DEX_MS[S.mg.dexMs]; S.mg.dexMs += 1;
    const items = [];
    if (R.ess) { addEss(R.ess); items.push({ ic: '💠', t: `숲의 정수 +${R.ess}` }); }
    if (R.min) { const a = minAcorns(R.min); S.budget += a; earn(a); items.push({ ic: 'acorn', t: `도토리 +${fmt(a)}` }); }
    if (R.gold) { addGold(R.gold); items.push({ ic: 'gold', t: `황금 도토리 +${R.gold}` }); }
    showReward({ title: `합치기 도감 ${need}칸!`, sub: `조각을 ${need}가지 모았어요`, items });
    save(); renderHUD(); mgRenderDex(); mgRenderTop(); mgRenderFoot();
    return true;
  }
  function mgDexClaim(k) {
    if (!mgDexCan(k)) return false;
    S.mg.dexPaid.push(k);
    const R = k === 'all' ? MG_DEX.all : MG_DEX.kind;
    if (R.ess) addEss(R.ess);
    if (R.pc) S.mg.pieces = Math.min(MG.PCAP, S.mg.pieces + R.pc);
    if (R.gold) addGold(R.gold);
    showReward({ title: k === 'all' ? '합치기 도감 완성!' : `${MG.kinds[k].name} 10단계 모으기!`, sub: k === 'all' ? '여덟 종류를 모두 10단계까지 모았어요' : `${MG.kinds[k].st[9]}까지 모두 모았어요`,
      items: [R.ess ? { ic: '💠', t: `숲의 정수 +${R.ess}` } : null, R.pc ? { ic: '💎', t: `장식 조각 +${R.pc}` } : null, R.gold ? { ic: 'gold', t: `황금 도토리 +${R.gold}` } : null] });
    save(); mgRenderDex(); mgRenderTop(); mgRenderFoot();
    return true;
  }
  function mgRenderDex() {
    const body = $('#mgDexBody'); if (!body) return;
    const n = mgDexN();
    const ms = S.mg.dexMs < MG_DEX_MS.length ? MG_DEX_MS[S.mg.dexMs] : null, R = ms && ms[1];
    const msTxt = !ms ? '모은 개수 보상을 모두 받았어요' : `${ms[0]}칸 모으면 ${[R.ess ? `숲의 정수 ${R.ess}` : '', R.min ? `도토리 ${fmt(minAcorns(R.min))}` : '', R.gold ? `황금 도토리 ${R.gold}` : ''].filter(Boolean).join(', ')}`;
    const msBar = `<div class="md-ms"><div class="md-ms-t"><span>${msTxt}</span>${mgDexMsCan() ? '<button class="md-claim" type="button" data-mgms="1">받기</button>' : ms ? `<small>${n}/${ms[0]}</small>` : ''}</div>` +
      `<div class="md-ms-steps">${MG_DEX_MS.map(([v], i) => `<i class="${i < S.mg.dexMs ? 'got' : n >= v ? 'can' : ''}">${v}</i>`).join('')}</div></div>`;
    body.innerHTML = `<div class="md-head"><span>만든 조각</span><b>${n} / ${MG_KINDS.length * 10}</b></div>` + msBar + (mgDexEssN() ? `<p class="md-tip">${ESS_ICON()}표시가 있는 칸을 누르면 숲의 정수 1개를 받아요</p>` : '') +
      MG_KINDS.map(k => {
        const K = MG.kinds[k], best = Math.min(10, S.mg.best[k] || 0), paid = S.mg.dexPaid.includes(k);
        const tiles = Array.from({ length: 10 }, (_, i) => i >= best ? '<span class="md-t off">?</span>' : mgDexEssCan(k, i + 1)
          ? `<button class="md-t ess" type="button" data-mgess="${k}${i + 1}" title="${K.st[i]}" aria-label="${K.st[i]}, 눌러서 숲의 정수 1개">${mgTileHtml(k + mgLvCh(i + 1))}<i class="md-e">${ESS_ICON()}</i></button>`
          : `<span class="md-t" title="${K.st[i]}">${mgTileHtml(k + mgLvCh(i + 1))}</span>`).join('');
        const right = paid ? '<span class="md-done">받았어요</span>' : mgDexCan(k) ? `<button class="md-claim" type="button" data-mgdexk="${k}">받기</button>` : `<small>${best}/10</small>`;
        return `<div class="md-row"><div class="md-top"><b>${K.name}${best ? ` <small>${esc(K.st[best - 1])}</small>` : ''}</b>${right}</div><div class="md-tiles">${tiles}</div></div>`;
      }).join('') +
      `<div class="md-all"><span>한 종류를 10단계까지 모으면 숲의 정수 ${MG_DEX.kind.ess}개와 장식 조각 ${MG_DEX.kind.pc}개, 여덟 종류를 모두 모으면 숲의 정수 ${MG_DEX.all.ess}개와 황금 도토리 ${MG_DEX.all.gold}개를 한 번 받아요</span>${S.mg.dexPaid.includes('all') ? '<span class="md-done">받았어요</span>' : mgDexCan('all') ? '<button class="md-claim" type="button" data-mgdexk="all">받기</button>' : ''}</div>`;
  }
  function mgOpenDex() { mgRenderDex(); $('#mgDexSheet').hidden = false; }
  /* ---- 합치기, 옮기기, 팔기 ---- */
  // from 조각을 to 칸에 놓아요. 같은 조각이면 합치고, 빈칸이면 옮기고, 다른 조각이면 자리를 바꿔요
  function mgDrop(from, to) {
    if (from === to || from < 0 || to < 0) return false;
    const cells = mgCells(), a = cells[from], b = cells[to];
    if (a === '..') return false;
    if (b === '..') { cells[to] = a; cells[from] = '..'; mgSetCells(cells); mgUI.sel = to; mgUI.land = to; sfx('tap'); return 'move'; }
    if (mgIsItem(a) && a === b && mgLvOf(a[1]) < 10) {
      const k = a[0], n = mgLvOf(a[1]) + 1;
      // 5개 보너스: 놓는 칸 둘레(상하좌우)에 같은 조각이 3개 더 있으면 다섯을 한 번에 합쳐 다음 단계 2개 + 1단계 1개
      const nb = [to - MG.W, to + MG.W, to % MG.W > 0 ? to - 1 : -1, to % MG.W < MG.W - 1 ? to + 1 : -1].filter(j => j >= 0 && j < MG_N && j !== from && cells[j] === a);
      cells[from] = '..';
      if (nb.length >= 3) {
        const three = nb.slice(0, 3);
        cells[to] = k + mgLvCh(n); cells[three[0]] = k + mgLvCh(n); cells[three[1]] = k + '1'; cells[three[2]] = '..';
        S.mg.st.merges += 4; mgUI.merged = [to, three[0], three[1]];
        toast('다섯 개를 한 번에 합쳤어요! 보너스로 하나 더');
      } else { cells[to] = k + mgLvCh(n); S.mg.st.merges += 1; mgUI.merged = [to]; }
      mgSetCells(cells);
      mgNoteBest(k, n);
      mgUI.sel = to;
      if (mgUI.cells.length) mgFloat(to, n >= 10 ? '최고!' : mgUI.newBest ? '새 조각!' : `${n}단계!`);
      mgUI.thumpNew = mgUI.newBest; mgUI.newBest = false;
      sfx(n >= 8 ? 'quest' : 'coin'); buzz(n >= 5 ? 14 : 8);
      if (n >= 10) toast(`${MG.kinds[k].st[9]}을 만들었어요! 10단계 최고 조각이에요`);
      return 'merge';
    }
    cells[to] = a; cells[from] = b; mgSetCells(cells); mgUI.sel = to; mgUI.land = to; sfx('tap');
    return 'swap';
  }
  function mgSell(i) {
    const cells = mgCells(), code = cells[i];
    if (!mgIsItem(code)) return false;
    const n = mgLvOf(code[1]), v = minAcorns(mgSellMin(n));
    cells[i] = '..'; mgSetCells(cells);
    S.budget += v; earn(v); mgUI.got.a += v;
    mgUI.sel = -1;
    mgFloat(i, `+${fmt(v)}`);
    sfx('coin');
    toast(`${eul(MG.kinds[code[0]].st[n - 1])} 팔아 도토리 ${fmtN(v)}${eulOf(fmtN(v))} 받았어요`);
    mgRenderBoard(); mgRenderOrders(); mgRenderFoot(); renderHUD(); save();
    return true;
  }
  /* ---- 생산기 강화 ---- */
  const mgUpCost = lv => lv >= 5 ? 0 : MG.UPCOST[lv];
  function mgUpgrade(i) {
    const cells = mgCells(), code = cells[i];
    if (!mgIsGen(code)) return false;
    const lv = mgLvOf(code[1]), cost = mgUpCost(lv);
    if (lv >= 5) { toast('이미 최고 레벨이에요'); return false; }
    if (S.mg.up < cost) { toast(`강화 조각이 ${cost - S.mg.up}개 더 있어야 해요`); return false; }
    S.mg.up -= cost;
    cells[i] = code[0] + String(lv + 1); mgSetCells(cells);
    S.mg.st.ups += 1;
    mgUI.merged = [i];
    sfx('quest'); buzz(16);
    toast(`${MG.gens[code[0]].name} Lv.${lv + 1}! 높은 단계가 더 자주 나와요`);
    mgRenderBoard(); mgRenderTop(); mgSelect(i); save();
    return true;
  }
  /* ---- 학생 주문 ---- */
  const MG_WHO = () => (typeof speciesList === 'function' ? speciesList() : ['rabbit', 'fox', 'raccoon', 'chick', 'bear']);
  const mgOrderKinds = o => o.it.map(x => x.k);
  function mgPickKind(avoid) {
    const pool = MG_KINDS.filter(k => !avoid.includes(k));
    return (pool.length ? pool : MG_KINDS)[Math.floor(Math.random() * (pool.length ? pool.length : MG_KINDS.length))];
  }
  // 높은 단계 주문(새 단계 주문 포함)은 한 번에 하나만, 나머지는 낮은 단계로(퀘스트의 '주문 n개 채우기'가 막히지 않게)
  const mgIsHigh = o => !!o && (!!o.up || o.it.some(x => x.n >= Math.max(4, (S.mg.best[x.k] || 0) - 2)));
  function mgOrderItem(k, mixed, low) {
    const best = Math.max(2, S.mg.best[k] || 0), lowMax = Math.max(2, Math.min(best - 3, Math.ceil(best / 2) + 1));
    const n = low ? 2 + Math.floor(Math.random() * (lowMax - 1)) : Math.max(2, best - Math.floor(Math.random() * 3));
    const c = !mixed && n <= 3 && Math.random() < 0.4 ? 2 : 1;   // 섞인 주문은 종류마다 1개씩
    return { k, n, c };
  }
  // 주문 하나: 한 종류(1~2개) 또는 두 종류를 섞어서(각 1개, 절반 확률). 다른 주문에 있는 종류는 되도록 피해요
  function mgNewOrder(avoid, low) {
    const mixed = Math.random() < MG.MIXED;
    const k1 = mgPickKind(avoid), it = [mgOrderItem(k1, mixed, low)];
    if (mixed) it.push(mgOrderItem(mgPickKind(avoid.concat([k1])), true, low));
    const who = MG_WHO(); return { it, who: who[Math.floor(Math.random() * who.length)] };
  }
  // 주문을 따라가다 보면 위 단계가 열리게. 주문 MG.UP_EVERY개를 채울 때마다 지금 만든 가장 높은 단계보다 한 단계 위 주문 하나
  function mgUpOrder(avoid) {
    const ks = MG_KINDS.filter(k => (S.mg.best[k] || 0) < 10); if (!ks.length) return null;
    const top = Math.max(...ks.map(k => S.mg.best[k] || 0)), tops = ks.filter(k => (S.mg.best[k] || 0) === top);
    const pool = tops.filter(k => !avoid.includes(k)).length ? tops.filter(k => !avoid.includes(k)) : tops, k = pool[Math.floor(Math.random() * pool.length)];
    const who = MG_WHO(); return { it: [{ k, n: Math.min(10, Math.max(2, (S.mg.best[k] || 0) + 1)), c: 1 }], who: who[Math.floor(Math.random() * who.length)], up: 1 };
  }
  function mgFillOrders() {
    while (S.mg.orders.length < 3) {
      const av = S.mg.orders.flatMap(mgOrderKinds);
      const u = S.mg.upq > 0 && !S.mg.orders.some(o => o.up) ? mgUpOrder(av) : null;
      if (u) S.mg.upq -= 1;
      S.mg.orders.push(u || mgNewOrder(av, S.mg.orders.some(mgIsHigh)));
    }
  }
  const mgCount = (cells, k, n) => cells.filter(c => c === k + mgLvCh(n)).length;
  const mgOrderOk = o => { const cells = mgCells(); return o.it.every(x => mgCount(cells, x.k, x.n) >= x.c); };
  const mgOrderText = o => o.it.map(x => `${MG.kinds[x.k].st[x.n - 1]} ${x.c}개`).join('와 ');
  function mgOrderReward(o) {
    let m = 0, pc = 0, up = 0;
    for (const x of o.it) {
      m += mgOrderMin(x.n, x.c);
      pc += (MG.PIECES.find(([lv]) => x.n >= lv) || [0, 0])[1] * x.c;
      up += x.n >= MG.UPAT ? x.c : 0;
    }
    return { a: minAcorns(m), pc, up };
  }
  // 미술 XP = 주문 조각을 만드는 데 드는 에너지(단계 n은 2^(n-1)) ÷ 6. 남는 몫은 모아 다음 주문에 더하고, 하루 100까지
  // 예전(단계 × 개수, 주문당 20)은 처음 며칠 하루 150~300으로 다른 과목의 3~5배였고, 8단계부터는 35 아래로 느려졌어요
  function mgArtXp(o) {
    const t = gameToday(); if (S.mg.xd.day !== t) S.mg.xd = { day: t, n: 0 };
    const left = AC.mgDay - S.mg.xd.n; if (left <= 0) return 0;
    const v = S.mg.xr + o.it.reduce((a, x) => a + mgEnergyOf(x.n) * x.c, 0) / AC.mgE;
    const g = Math.min(left, Math.floor(v)); S.mg.xr = Math.min(0.999, v - Math.floor(v));
    S.mg.xd.n += g;
    return acGain('art', Math.round(g * (1 + XT.art.per / 100 * xtLv('art'))));   // 미술 선생님
  }
  function mgClaimOrder(i) {
    const o = S.mg.orders[i];
    if (!o || !mgOrderOk(o)) return false;
    const cells = mgCells();
    for (const x of o.it) { let left = x.c; for (let j = 0; j < cells.length && left > 0; j++) if (cells[j] === x.k + mgLvCh(x.n)) { cells[j] = '..'; left -= 1; } }
    mgSetCells(cells);
    const r = mgOrderReward(o);
    S.budget += r.a; earn(r.a);
    const upIt = r.up ? mgAddUp(r.up) : null, upKey = !!(upIt && upIt.ic === '🔑');   // 생산기가 모두 최고면 정수로
    mgUI.got.a += r.a; mgUI.got.pc += r.pc; if (upKey) mgUI.got.up += r.up;
    S.mg.pieces = Math.min(MG.PCAP, S.mg.pieces + r.pc);
    if (r.pc) mgBump('#mgPc'); if (upKey) mgBump('#mgUp');
    S.mg.st.orders += 1;
    if (S.mg.st.orders % MG.UP_EVERY === 0) S.mg.upq = Math.min(3, (S.mg.upq || 0) + 1);   // 한 단계 위 주문
    const tk = S.mg.st.orders % TKE.mgEvery === 0 ? tkDaily('mg') : null;   // 주문 5개마다 5분권 1장(하루 3장)
    const xp = mgArtXp(o);   // 미술 XP는 주문에 든 에너지로(에너지 6마다 1, 하루 100까지)
    S.mg.orders.splice(i, 1); mgFillOrders();
    mgUI.sel = -1;
    sfx('quest'); buzz(14);
    const who = (typeof DEX_NAMES === 'object' && DEX_NAMES[o.who]) || (NEWCOMERS.find(x => x.k === o.who) || {}).name || '학생';
    showReward({ title: '주문을 채웠어요!', sub: `${who}에게 ${mgOrderText(o)}를 줬어요`,
      items: [{ ic: 'acorn', t: `도토리 +${fmt(r.a)}` }, xp ? { ic: '📘', t: `미술 XP +${xp}` } : null, r.pc ? { ic: '💎', t: `장식 조각 +${r.pc}` } : null, upIt, tk] });
    mgRenderAll(); renderHUD(); checkQuests(); save();
    return true;
  }
  const mgSwapLeft = () => Math.max(0, MG.SWAP - (gameNow() - S.mg.swapAt));
  function mgSwapOrder(i) {
    if (!S.mg.orders[i]) return false;
    if (mgSwapLeft() > 0) { toast(`${Math.ceil(mgSwapLeft() / 60000)}분 뒤에 바꿀 수 있어요`); return false; }
    S.mg.swapAt = gameNow();
    if (S.mg.orders[i].up) S.mg.upq = Math.min(3, (S.mg.upq || 0) + 1);   // 한 단계 위 주문을 바꿔도 다음에 다시 와요
    S.mg.orders[i] = mgNewOrder(S.mg.orders.flatMap(mgOrderKinds), S.mg.orders.some((o, j) => j !== i && mgIsHigh(o)));   // 지금 주문의 종류도 피해서 다른 것이 나오게
    sfx('tap');
    mgRenderOrders(); mgRenderBoard(); save();
    return true;
  }
  /* ---- 화면 ---- */
  const mgUI = { open: false, cells: [], sel: -1, pop: -1, merged: null, drag: null, dragEl: null, fly: null, land: -1, got: { a: 0, pc: 0, up: 0 }, idleAt: 0, hintT: 0 };   // got: 이번에 들어와서 번 것
  /* ---- 손맛: 생산기에서 조각이 날아 나오고, 합치면 터지고, 숫자가 튀어요 ---- */
  const mgCenter = i => { const el = mgUI.cells[i], g = $('#mgGrid'); if (!el || !g) return null; const r = el.getBoundingClientRect(), gr = g.getBoundingClientRect(); return { x: r.left - gr.left + r.width / 2, y: r.top - gr.top + r.height / 2, w: r.width }; };
  // 생산기(from)에서 새 조각이 to 칸으로 포물선을 그리며 날아가요. 도착하면 칸에 '툭' 내려앉아요
  function mgFly(from, to, code) {
    if (rt.reduced) { mgUI.pop = -1; return; }
    const g = $('#mgGrid'), a = mgCenter(from), b = mgCenter(to); if (!g || !a || !b || !('animate' in Element.prototype)) { mgUI.pop = to; return; }
    const d = document.createElement('div'); d.className = 'mg-fly'; d.innerHTML = mgTileHtml(code);
    d.style.width = d.style.height = a.w + 'px'; d.style.left = (a.x - a.w / 2) + 'px'; d.style.top = (a.y - a.w / 2) + 'px';
    g.appendChild(d);
    const cell = mgUI.cells[to]; cell.classList.add('hide');
    const dx = b.x - a.x, dy = b.y - a.y, up = Math.max(12, Math.hypot(dx, dy) * 0.18);
    const an = d.animate([
      { transform: 'translate(0,0) scale(.8)', opacity: .8 },
      { transform: `translate(${dx * 0.5}px,${dy * 0.5 - up}px) scale(1.06)`, opacity: 1, offset: .55 },
      { transform: `translate(${dx}px,${dy}px) scale(1)`, opacity: 1 }], { duration: rt.reduced ? 180 : 260 + Math.min(120, Math.hypot(dx, dy) * 0.4), easing: 'cubic-bezier(.25,.6,.4,1)' });
    let fin = false;
    const done = () => { if (fin) return; fin = true; d.remove(); cell.classList.remove('hide'); void cell.offsetWidth; cell.classList.add('land'); mgDust(to, 5); setTimeout(() => cell.classList.remove('land'), 400); };
    setTimeout(done, 900);   // 혹시 애니메이션 끝 신호가 안 오면 그래도 조각이 보이게
    an.onfinish = done; an.oncancel = done;
    mgUI.pop = -1;
  }
  // 조각이 내려앉거나 합쳐질 때 흩어지는 작은 가루
  function mgDust(i, n, color) {
    const g = $('#mgGrid'), c = mgCenter(i); if (!g || !c || rt.reduced) return;
    for (let k = 0; k < n; k++) {
      const d = document.createElement('i'); d.className = 'mg-dust'; if (color) d.style.background = color;
      d.style.left = c.x + 'px'; d.style.top = c.y + 'px'; g.appendChild(d);
      const ang = Math.random() * Math.PI * 2, dist = c.w * (0.5 + Math.random() * 0.7), sz = 0.6 + Math.random() * 0.8;
      d.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist + c.w * 0.3}px)) scale(${sz * 0.3})`, opacity: 0 }],
        { duration: 380 + Math.random() * 240, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => d.remove();
    }
  }
  function mgBump(sel) { const el = $(sel); if (!el || rt.reduced) return; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  function mgThump() { const b = $('#mgBoard'); if (!b || rt.reduced) return; b.classList.remove('thump'); void b.offsetWidth; b.classList.add('thump'); setTimeout(() => b.classList.remove('thump'), 300); }
  const mgTileHtml = code => {
    if (code === '..') return '';
    if (mgIsGen(code)) {
      const G = MG.gens[code[0]], lv = mgLvOf(code[1]), img = IMG180('mg_gen_' + code[0]);
      return `<div class="mg-tile gen${img ? ' has-img' : ''}" style="${img ? `--mg-img:url('${img}')` : ''}"><span class="mg-stars" aria-hidden="true">${lv > 1 ? '★'.repeat(lv - 1) : ''}</span>${G.em}<b>Lv.${lv}</b></div>`;
    }
    const K = MG.kinds[code[0]], n = mgLvOf(code[1]), img = IMG180(mgItemKey(code[0], n));
    return `<div class="mg-tile${n >= 10 ? ' lv10' : ''}${img ? ' has-img' : ''}" style="--mg-c:${K.c};--mg-r:${K.r || K.c};${img ? `--mg-img:url('${img}')` : ''}">${K.em}<b>${n}</b></div>`;
  };
  function mgBuildGrid() {
    const g = $('#mgGrid'); if (!g || mgUI.cells.length) return;
    g.innerHTML = Array.from({ length: MG_N }, (_, i) => `<div class="mg-cell" data-i="${i}"></div>`).join('');
    mgUI.cells = [...g.querySelectorAll('.mg-cell')];
    g.addEventListener('pointerdown', mgPointerDown);
    g.addEventListener('pointermove', mgPointerMove);
    g.addEventListener('pointerup', mgPointerUp);
    g.addEventListener('pointercancel', () => mgDragEnd(true));
    $$('[data-mg]', $('#mgScene')).forEach(el => { const u = IMG180(el.dataset.mg); if (u) { el.style.setProperty(el.classList.contains('mh-pic') ? '--mh-img' : '--mg-ic', `url('${u}')`); el.classList.add('has-img'); } });
    const bd = IMG180('mg_board'); if (bd) { $('#mgBoard').style.setProperty('--mg-board', `url('${bd}')`); $('#mgBoard').classList.add('has-art'); }
    const bg = window.FS_MINI_BG?.merge || IMG('pz_bg'); if (bg) $('#mgScene').style.setProperty('--mg-bg', `url('${bg}')`);
  }
  function mgRenderBoard() {
    const cells = mgCells();
    const want = new Set(S.mg.orders.flatMap(o => o.it.map(x => x.k + mgLvCh(x.n))));   // 학생 주문에 필요한 조각은 테두리를 반짝여요
    mgUI.cells.forEach((el, i) => {
      const code = cells[i];
      if (el.dataset.v !== code) { el.dataset.v = code; el.innerHTML = mgTileHtml(code); }
      el.classList.toggle('sel', i === mgUI.sel);
      el.classList.toggle('want', want.has(code));
      el.classList.remove('new', 'merge', 'over');
      if (i === mgUI.pop) { void el.offsetWidth; el.classList.add('new'); }
      if (mgUI.merged && mgUI.merged.includes(i)) { void el.offsetWidth; el.classList.add('merge'); const K = MG.kinds[code[0]], lv = mgLvOf(code[1]);
        if (FXL.st === 'ok' && !FXO.st) fxoInit();
        const c = mgCenter(i); if (c && fxoHost($('#mgGrid'))) fxoBurst(c.x, c.y, c.w * 0.55, K ? K.r : '', lv >= 5); else mgDust(i, lv >= 5 ? 14 : 8, K ? K.c : ''); }   // 빛 고리와 별 조각
      if (i === mgUI.land) { void el.offsetWidth; el.classList.add('land'); setTimeout(() => el.classList.remove('land'), 400); }
    });
    if (mgUI.merged && mgUI.merged.length && mgUI.thumpNew) mgThump();   // 판 두근거림은 처음 만든 단계일 때만
    mgUI.thumpNew = false;
    mgUI.pop = -1; mgUI.merged = null; mgUI.land = -1;
  }
  function mgRenderTop() {
    mgTick();
    const m = S.mg;
    setT($('#mgE'), m.e); setT($('#mgEMax'), `/${mgEMax()}`);
    const sec = mgEnergyIn();
    setT($('#mgETimer'), sec ? ` ${sec}초` : '');   // 다음 1이 차기까지 남은 시간. 가득 차면 비워요
    setT($('#mgPc'), m.pieces); setT($('#mgUp'), m.up);
    mgRenderMul();
    const ad = $('#mgAdBtn'), left = mgAdLeft();
    const energyIcon = IMG180('mg_ic_energy');
    setH(ad, `<span class="mg-ad-play" aria-hidden="true">▶</span>${energyIcon ? `<img class="mg-ad-icon" src="${energyIcon}" alt="">` : '<span aria-hidden="true">⚡</span>'}<span>+${MG.AD.e}</span><small>${left}/${MG.AD.n}</small>`);
    setAt(ad, 'aria-label', `광고 보고 에너지 ${MG.AD.e} 받기, 오늘 ${left}번 남음`);
    setAt(ad, 'aria-disabled', left > 0 ? 'false' : 'true');
  }
  function mgRenderOrders() {
    mgFillOrders();
    const cells = mgCells(), can = mgSwapLeft() <= 0;
    $('#mgOrders').innerHTML = S.mg.orders.map((o, i) => {
      const ok = mgOrderOk(o), r = mgOrderReward(o), img = IMG('chr_' + o.who);
      // 그림 아래는 그 조각의 레벨, 필요한 개수는 그림 위 따로(숫자가 헷갈리지 않게)
      const its = o.it.map(x => { const h = Math.min(x.c, mgCount(cells, x.k, x.n)), got = h >= x.c; return `<span class="mo-one${got ? ' got' : ''}">${mgTileHtml(x.k + mgLvCh(x.n))}<small>Lv.${x.n}</small><em class="mo-cnt" aria-label="${x.c}개 필요, ${h}개 있음">${got ? '✔ ' : ''}${x.c}개</em></span>`; }).join('<i class="mo-plus">+</i>');
      return `<button class="mg-order${ok ? ' ok' : ''}${o.it.length > 1 ? ' two' : ''}${o.up ? ' up' : ''}" type="button" data-order="${i}" aria-label="${o.up ? '새 단계 ' : ''}${mgOrderText(o)} 주문${ok ? ', 눌러서 건네기' : ''}">` +
        `<span class="mo-who" style="${img ? `--mo-img:url('${img}')` : ''}"></span><span class="mo-it">${its}</span>` +
        `<span class="mo-n">${ok ? '건네기' : '주문'}</span><span class="mo-rw">${acornIcon()}${fmt(r.a)}${r.pc ? ` 💎${r.pc}` : ''}${r.up ? (mgGensMax() ? ` ${ESS_ICON()}${r.up * MG_UP_ESS}` : ' 🔑') : ''}</span>` +
        `<span class="mo-swap" data-swap="${i}" title="다른 주문으로" ${can ? '' : 'hidden'} role="button" aria-label="다른 주문으로 바꾸기">↻</span></button>`;
    }).join('');
  }
  function mgRenderFoot() {
    const f = $('#mgFoot'), i = mgUI.sel, cells = mgCells(), code = i >= 0 ? cells[i] : '..';
    if (code === '..') {
      const g = mgUI.got, got = g.a || g.pc || g.up ? `이번에 번 것: 도토리 ${fmt(g.a)}개${g.pc ? `, 장식 조각 ${g.pc}개` : ''}${g.up ? `, 강화 조각 ${g.up}개` : ''}` : '생산기를 눌러 조각을 만들고, 같은 조각 둘을 겹쳐요';
      const luck = S.mg.bst.luck > 0 ? `<em class="mf-luck">행운 ${S.mg.bst.luck}번 남음</em>` : '';
      f.innerHTML = `<div class="mf-tx"><b>숲속 합치기</b><span>${luck}${got}</span></div><button class="mf-btn sub" type="button" data-mgboost="1">부스터</button><button class="mf-btn sub mg-dexbtn" type="button" data-mgdex="1">도감 ${mgDexN()}/${MG_KINDS.length * 10}${mgDexAny() ? '<i class="dot"></i>' : ''}</button>`; return;
    }
    if (mgIsGen(code)) {
      const G = MG.gens[code[0]], lv = mgLvOf(code[1]), cost = mgUpCost(lv);
      f.innerHTML = `${mgTileHtml(code)}<div class="mf-tx"><b>${G.name} Lv.${lv}</b><span>${G.kinds.map(k => MG.kinds[k].name).join('과 ')}이 나와요. 끌어서 옮길 수 있어요</span></div>` +
        `<button class="mf-btn${lv >= 5 ? ' sub' : ''}" type="button" data-mgup="${i}" aria-disabled="${lv >= 5 ? 'true' : 'false'}">${lv >= 5 ? '최고 레벨' : `강화 🔑${cost}`}</button>`;
      return;
    }
    const n = mgLvOf(code[1]);
    f.innerHTML = `${mgTileHtml(code)}<div class="mf-tx"><b>${MG.kinds[code[0]].st[n - 1]}</b><span>${MG.kinds[code[0]].name} ${n}단계${n < 10 ? ', 같은 것과 겹치면 ' + MG.kinds[code[0]].st[n] : ', 최고 단계예요'}</span></div>` +
      `<button class="mf-btn sub" type="button" data-mgsell="${i}">팔기 ${fmt(minAcorns(mgSellMin(n)))}</button>`;
  }
  function mgRenderAll() { mgBuildGrid(); mgRenderBoard(); mgRenderTop(); mgRenderOrders(); mgRenderFoot(); }
  function mgSelect(i) { mgUI.sel = i; mgUI.cells.forEach((el, j) => el.classList.toggle('sel', j === i)); mgRenderFoot(); }
  function mgShake(i) { const el = mgUI.cells[i]; if (!el) return; el.classList.remove('merge'); $('#mgBoard').classList.remove('shake'); void el.offsetWidth; $('#mgBoard').classList.add('shake'); setTimeout(() => $('#mgBoard').classList.remove('shake'), 350); }
  function mgFloat(i, txt) {
    const el = mgUI.cells[i], g = $('#mgGrid'); if (!el || !g) return;
    const r = el.getBoundingClientRect(), gr = g.getBoundingClientRect();
    const d = document.createElement('div'); d.className = 'mg-float'; d.textContent = txt;
    d.style.left = (r.left - gr.left + r.width / 2 - 14) + 'px'; d.style.top = (r.top - gr.top) + 'px';
    g.appendChild(d); setTimeout(() => d.remove(), 1000);
  }
  /* 끌기: 조각(생산기 포함)을 누른 채 움직이면 따라오는 그림자가 생기고, 놓은 칸에 mgDrop. 움직이지 않고 떼면 고르기(생산기는 누르기) */
  function mgPointerDown(e) {
    mgTouch();
    const cell = e.target.closest('.mg-cell'); if (!cell || mgUI.drag) return;
    const i = +cell.dataset.i, code = mgCells()[i];
    const selected = mgUI.sel, cells = mgCells();
    if (selected >= 0 && selected !== i && mgIsItem(cells[selected]) && code === '..') {   // 눌러서 합치기는 없애고(끌어야 합쳐져요), 빈칸으로 옮기기만 남겨요
      const result = mgDrop(selected, i);
      if (result) { mgRenderBoard(); mgRenderOrders(); mgRenderFoot(); if (result === 'merge') checkQuests(); save(); return; }
    }
    if (code === '..') { mgSelect(-1); return; }
    e.preventDefault();
    mgUI.drag = { i, x0: e.clientX, y0: e.clientY, moved: false, id: e.pointerId, over: -1 };
    try { $('#mgGrid').setPointerCapture(e.pointerId); } catch (x) { /* 무시 */ }
  }
  function mgPointerMove(e) {
    const d = mgUI.drag; if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
    if (!d.moved) {
      if (dx * dx + dy * dy < 36) return;
      d.moved = true;
      const g = document.createElement('div'); g.className = 'mg-drag'; g.innerHTML = mgTileHtml(mgCells()[d.i]);
      document.body.appendChild(g); mgUI.dragEl = g;
      mgUI.cells[d.i].style.opacity = '.35';
    }
    mgUI.dragEl.style.left = e.clientX + 'px'; mgUI.dragEl.style.top = e.clientY + 'px';
    const t = document.elementFromPoint(e.clientX, e.clientY), c = t && t.closest('.mg-cell');
    const over = c ? +c.dataset.i : -1;
    if (over !== d.over) { if (d.over >= 0) mgUI.cells[d.over].classList.remove('over'); d.over = over; if (over >= 0 && over !== d.i) mgUI.cells[over].classList.add('over'); }
  }
  function mgPointerUp(e) {
    const d = mgUI.drag; if (!d || e.pointerId !== d.id) return;
    const i = d.i, moved = d.moved, over = d.over;
    mgDragEnd(false);
    if (!moved) { if (mgIsGen(mgCells()[i])) mgTapGen(i); else mgSelect(mgUI.sel === i ? -1 : i); return; }
    if (over >= 0 && over !== i) {
      const r = mgDrop(i, over);
      if (r) { mgRenderBoard(); mgRenderOrders(); mgRenderFoot(); if (r === 'merge') checkQuests(); save(); }
    }
  }
  function mgDragEnd(cancel) {
    const d = mgUI.drag; if (!d) return;
    if (mgUI.dragEl) { mgUI.dragEl.remove(); mgUI.dragEl = null; }
    if (mgUI.cells[d.i]) mgUI.cells[d.i].style.opacity = '';
    if (d.over >= 0 && mgUI.cells[d.over]) mgUI.cells[d.over].classList.remove('over');
    try { $('#mgGrid').releasePointerCapture(d.id); } catch (x) { /* 무시 */ }
    mgUI.drag = null;
  }
  function mgOpen() {
    mgTick();
    if (FXL.st === 'ok' && !FXO.st) fxoInit();   // 빛 고리 그림판
    if (!S.mg.board || S.mg.board.length !== MG_N * 2) mgSetCells(mgEmptyBoard());
    mgFillOrders();
    mgUI.open = true; mgUI.sel = -1; mgUI.got = { a: 0, pc: 0, up: 0 }; mgUI.idleAt = Date.now();
    $('#mgScene').hidden = false; document.body.classList.add('mg-on');   // 합치기 안에서는 알림을 아래 칸 자리에 띄워요
    $('#mgUpSheet').hidden = true;
    $('#mgHelp').hidden = !!S.mg.seen;
    mgRenderAll();
    musicSync();
  }
  function mgClose() {
    mgUI.open = false; mgDragEnd(true); mgClearHint();
    $('#mgScene').hidden = true; document.body.classList.remove('mg-on');
    save(); renderMini(); musicSync();
  }
  function mgOpenUp(i) {
    const code = mgCells()[i]; if (!mgIsGen(code)) return;
    const G = MG.gens[code[0]], lv = mgLvOf(code[1]), cost = mgUpCost(lv);
    mgUI.upAt = i;
    $('#mgUpTitle').textContent = `${G.name} 강화`;
    $('#mgUpRow').innerHTML = `${mgTileHtml(code)}<span>Lv.${lv}${lv < 5 ? ` → Lv.${lv + 1}` : ' (최고)'}</span><span>🔑 ${S.mg.up}${lv < 5 ? ` / ${cost}` : ''}</span>`;
    $('#mgUpTable').innerHTML = '<tr><th>레벨</th><th>1단계</th><th>2단계</th><th>3단계</th><th>4단계</th></tr>' + MG.LV.map((row, j) => `<tr class="${j + 1 === lv ? 'now' : ''}"><td>Lv.${j + 1}</td>${[0, 1, 2, 3].map(c => `<td>${row[c] != null ? row[c] + '%' : '-'}</td>`).join('')}</tr>`).join('');
    $('#mgUpNote').textContent = lv >= 5 ? '최고 레벨이에요. 높은 단계가 가장 자주 나와요' : S.mg.up >= cost ? `강화 조각 ${cost}개를 써서 Lv.${lv + 1}로 올려요` : `강화 조각이 ${cost - S.mg.up}개 더 있어야 해요. 이벤트 기념 상자, 주간 상자, 출석 도장 7개, 8단계 이상 주문에서 받아요`;
    mgUI.upSwap = lv >= 5 && mgGensMax() && S.mg.up > 0;   // 조정안 4: 남은 조각을 정수로
    if (mgUI.upSwap) $('#mgUpNote').textContent = `생산기가 모두 최고 레벨이에요. 남은 강화 조각 ${S.mg.up}개를 숲의 정수 ${S.mg.up * MG_UP_ESS}개로 바꿀 수 있어요`;
    $('#mgUpYes').textContent = mgUI.upSwap ? '정수로 바꾸기' : '강화하기';
    $('#mgUpYes').hidden = lv >= 5 && !mgUI.upSwap;
    $('#mgUpYes').setAttribute('aria-disabled', mgUI.upSwap || S.mg.up >= cost ? 'false' : 'true');
    $('#mgUpSheet').hidden = false;
  }
  function mgAdAsk() {
    const left = mgAdLeft();
    if (left <= 0) { toast('오늘 광고 에너지는 다 받았어요. 내일 다시 열려요'); return; }
    askBox({ title: '광고를 볼까요?', text: `광고를 보고 에너지 ${MG.AD.e}을 받아요\n오늘 ${left}번 더 볼 수 있어요`, onYes: () => mgWatchAd() });
  }
  function mgWatchAd() {
    if (mgAdLeft() <= 0) { toast('오늘 광고 에너지는 다 받았어요. 내일 다시 열려요'); return; }
    showAd(() => { mgAdLeft(); S.mg.ad.n += 1; mgAddEnergy(MG.AD.e); save(); mgRenderTop(); toast(`에너지 +${MG.AD.e}`); }, r => { if (r !== 'noad') toast('광고를 끝까지 보지 않아서 에너지가 없어요'); });
  }
  function renderMiniMg() {
    const sub = $('#mgCardSub'); if (!sub || !S) return;
    mgTick();
    const ok = S.mg.orders.filter(mgOrderOk).length;
    sub.textContent = ok ? `건넬 수 있는 주문 ${ok}개` : '조각을 만들고 겹쳐요';
    { const e = $('#mgEnergyTxt'); if (e) { e.textContent = `에너지 ${S.mg.e}/${mgEMax()}`; e.classList.toggle('none', S.mg.e <= 0); } }   // 시작하기 위 에너지 표(퍼즐 보상 판과 같은 자리)
    const th = $('.mg-thumb'); if (th) { const u = IMG180('mg_card'); if (u) { th.style.setProperty('--mg-card', `url('${u}')`); th.classList.add('has-img'); } }
  }
  function tick180() {
    if (!mgUI.open || mgUI.drag) return;
    const e0 = S.mg.e; mgTick(); mgRenderTop(); if (S.mg.e !== e0) mgRenderOrders();
    if (Date.now() - mgUI.idleAt > MG.HINT_AFTER && $('#mgHelp').hidden && $('#mgUpSheet').hidden && $('#mgDexSheet').hidden && $('#mgBoostSheet').hidden && !(rt.modalOpen && !rt.modalOpen.hidden)) { mgUI.idleAt = Date.now(); mgShowHint(); }
  }
  /* ---- 가만히 있으면 힌트: 건넬 수 있는 주문 → 합칠 수 있는 짝 → 주문에 맞는 생산기 순서로 손가락이 알려 줘요 ---- */
  function mgTouch() { mgUI.idleAt = Date.now(); mgClearHint(); }
  function mgClearHint() {
    clearTimeout(mgUI.hintT);
    $$('.mg-cell.hint', $('#mgGrid')).forEach(el => el.classList.remove('hint'));
    $$('.mg-order.hint', $('#mgOrders')).forEach(el => el.classList.remove('hint'));
    $$('.mg-finger', $('#mgScene')).forEach(el => el.remove());
  }
  function mgFinger(at, to) {   // at 칸에 손가락. to가 있으면 그쪽으로 끌어가는 흉내를 두 번
    const g = $('#mgGrid'), a = mgCenter(at); if (!g || !a) return;
    const f = document.createElement('div'); f.className = 'mg-finger'; f.textContent = '👆';
    f.style.left = a.x + 'px'; f.style.top = (a.y + a.w * 0.3) + 'px'; g.appendChild(f);
    if (rt.reduced) return;
    const b = to >= 0 ? mgCenter(to) : null;
    if (b) f.animate([{ transform: 'translate(-50%,-30%) scale(1)', opacity: 0 }, { transform: 'translate(-50%,-30%) scale(.85)', opacity: 1, offset: .15 }, { transform: `translate(calc(-50% + ${b.x - a.x}px), calc(-30% + ${b.y - a.y}px)) scale(.85)`, opacity: 1, offset: .75 }, { transform: `translate(calc(-50% + ${b.x - a.x}px), calc(-30% + ${b.y - a.y}px)) scale(1)`, opacity: 0 }], { duration: 1300, iterations: 2, easing: 'ease-in-out' });
    else f.animate([{ transform: 'translate(-50%,-30%) scale(1)' }, { transform: 'translate(-50%,-30%) scale(.8) translateY(-8px)' }, { transform: 'translate(-50%,-30%) scale(1)' }], { duration: 700, iterations: 4, easing: 'ease-in-out' });
  }
  function mgHintPick() {
    const cells = mgCells(), want = new Set(S.mg.orders.flatMap(o => o.it.map(x => x.k + mgLvCh(x.n))));
    // 1. 건넬 수 있는 주문
    const ok = S.mg.orders.findIndex(mgOrderOk); if (ok >= 0) return { t: 'order', i: ok };
    // 2. 합칠 수 있는 짝. 주문 조각의 바로 아래 단계면 먼저, 그다음은 높은 단계부터
    const pos = {}; cells.forEach((c, i) => { if (mgIsItem(c) && mgLvOf(c[1]) < 10) (pos[c] = pos[c] || []).push(i); });
    const pairs = Object.keys(pos).filter(c => pos[c].length >= 2);
    if (pairs.length) {
      const up = c => c[0] + mgLvCh(mgLvOf(c[1]) + 1);
      pairs.sort((x, y) => (want.has(up(y)) - want.has(up(x))) || (mgLvOf(y[1]) - mgLvOf(x[1])));
      const [a, b] = pos[pairs[0]]; return { t: 'merge', a, b };
    }
    // 3. 주문 종류가 나오는 생산기 (없으면 아무 생산기), 에너지와 빈칸이 있을 때
    if (S.mg.e < 1 || !cells.includes('..')) return null;
    const wantK = new Set(S.mg.orders.flatMap(o => o.it.map(x => x.k)));
    const gens = cells.map((c, i) => mgIsGen(c) ? i : -1).filter(i => i >= 0);
    const g = gens.find(i => MG.gens[cells[i][0]].kinds.some(k => wantK.has(k)));
    return gens.length ? { t: 'gen', i: g >= 0 ? g : gens[0] } : null;
  }
  // 덜 채운 주문을 누르면 모자란 조각이 나오는 생산기를 반짝이고 손가락으로 가리켜요(생산기를 눌러 보지 않아도 알 수 있게)
  function mgOrderGuide(i) {
    const o = S.mg.orders[i]; if (!o) return false;
    mgClearHint(); mgUI.idleAt = Date.now();
    const cells = mgCells(), lack = o.it.filter(x => mgCount(cells, x.k, x.n) < x.c);
    const gens = [], said = [];
    for (const x of lack) {
      const G = MG_GENS.find(g => MG.gens[g].kinds.includes(x.k)); if (!G) continue;
      const at = cells.findIndex(c => mgIsGen(c) && c[0] === G);
      if (at >= 0 && !gens.includes(at)) gens.push(at);
      said.push(`${eun(MG.kinds[x.k].st[x.n - 1])} ${MG.gens[G].name}에서 나와요`);
    }
    gens.forEach(j => mgUI.cells[j] && mgUI.cells[j].classList.add('hint'));
    if (gens.length) mgFinger(gens[0], -1);
    const el = $(`#mgOrders [data-order="${i}"]`); if (el) el.classList.add('hint');
    toast(said.join(', ') + (lack.some(x => x.n > 1) ? '. 같은 조각 둘을 합쳐 단계를 올려요' : ''));
    sfx('tap');
    mgUI.hintT = setTimeout(mgClearHint, MG.HINT_SHOW);
    return gens;
  }
  function mgShowHint() {
    mgClearHint();
    const h = mgHintPick(); if (!h) return;
    if (h.t === 'order') { const el = $(`#mgOrders [data-order="${h.i}"]`); if (el) el.classList.add('hint'); }
    else if (h.t === 'merge') { mgUI.cells[h.a].classList.add('hint'); mgUI.cells[h.b].classList.add('hint'); mgFinger(h.a, h.b); }
    else { mgUI.cells[h.i].classList.add('hint'); mgFinger(h.i, -1); }
    mgUI.hintT = setTimeout(mgClearHint, MG.HINT_SHOW);
  }
  function bind180() {
    $('#mgScene').addEventListener('pointerdown', mgTouch, true);
    $('#mgOpen').addEventListener('click', () => { sfx('tap'); if (liveOff('merge')) { toast('숲속 합치기는 잠시 점검 중이에요. 조금만 기다려 주세요'); return; } mgOpen(); });
    $('#mgBack').addEventListener('click', () => { sfx('tap'); mgClose(); });
    $('#mgHelpOk').addEventListener('click', () => { S.mg.seen = true; $('#mgHelp').hidden = true; save(); });
    $('#mgMuls').addEventListener('click', e => { const t = e.target.closest('[data-mul]'); if (t) mgPickMul(+t.dataset.mul); });
    $('#mgModes').addEventListener('click', e => { const t = e.target.closest('[data-mm]'); if (t) mgPickMode(+t.dataset.mm); });
    $('#mgMulOk').addEventListener('click', () => { $('#mgMulSheet').hidden = true; });
    $('#mgAdBtn').addEventListener('click', () => { sfx('tap'); mgAdAsk(); });   // 바로 광고 대신 확인 창 먼저
    $('#mgOrders').addEventListener('click', e => {
      const sw = e.target.closest('[data-swap]'); if (sw) { e.stopPropagation(); mgSwapOrder(+sw.dataset.swap); return; }
      const b = e.target.closest('[data-order]'); if (!b) return;
      const i = +b.dataset.order;
      if (!mgClaimOrder(i)) mgOrderGuide(i);
    });
    $('#mgFoot').addEventListener('click', e => {
      const s = e.target.closest('[data-mgsell]'); if (s) {   // 5단계부터는 한 번 더 눌러야 팔아요
        const i = +s.dataset.mgsell, code = mgCells()[i], hi = mgIsItem(code) && mgLvOf(code[1]) >= 5;
        if (hi && mgUI.sellArm !== i) { mgUI.sellArm = i; clearTimeout(mgUI.sellT); mgUI.sellT = setTimeout(() => { mgUI.sellArm = -1; if (s.isConnected) s.textContent = s.dataset.tx; }, 3000); s.dataset.tx = s.textContent; s.textContent = '한 번 더 누르면 팔아요'; sfx('tap'); return; }
        mgUI.sellArm = -1; clearTimeout(mgUI.sellT); mgSell(i); return; }
      const u = e.target.closest('[data-mgup]'); if (u) { sfx('tap'); mgOpenUp(+u.dataset.mgup); return; }
      if (e.target.closest('[data-mgdex]')) { sfx('tap'); mgOpenDex(); }
      if (e.target.closest('[data-mgboost]')) { sfx('tap'); mgOpenBoost(); }
    });
    $('#mgbList').addEventListener('click', e => { const b = e.target.closest('[data-mgb]'); if (b) mgBuyBoost(b.dataset.mgb); });
    $('#mgbClose').addEventListener('click', () => { $('#mgBoostSheet').hidden = true; });
    $('#mgDexClose').addEventListener('click', () => { $('#mgDexSheet').hidden = true; mgRenderFoot(); });
    $('#mgDexBody').addEventListener('click', e => {
      const b = e.target.closest('[data-mgdexk]'); if (b) { mgDexClaim(b.dataset.mgdexk); return; }
      const t = e.target.closest('[data-mgess]'); if (t) { mgDexEss(t.dataset.mgess[0], +t.dataset.mgess.slice(1), t); return; }
      if (e.target.closest('[data-mgms]')) mgDexMsClaim();
    });
    $('#mgUpNo').addEventListener('click', () => { $('#mgUpSheet').hidden = true; });
    $('#mgUpYes').addEventListener('click', () => { if (mgUI.upSwap ? mgUpSwap() : mgUpgrade(mgUI.upAt)) $('#mgUpSheet').hidden = true; });
    $('#mgUps').addEventListener('click', () => mgUpSwapAsk());
    $('#mgPieces').addEventListener('click', () => { sfx('tap'); toast(`장식 조각 ${S.mg.pieces}개. 꾸미기 가게에서 5개로 장식 하나를 받아요`); });   // 조정안 4
  }
  /* ===== 숲속 합치기 END ===== */

