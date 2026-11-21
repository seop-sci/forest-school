  /* ---------- 미니게임 1: 블록 퍼즐 (1.6.0) ----------
     8×8 판에 조각 3개를 끌어다 놓고 가로세로 줄을 지워요.
     - 문양 줄: 한 줄을 같은 문양으로만 채워 지우면 그 줄은 3배
     - 학생 부탁: 학생이 "꽃 블록 12개 지워 줘" 같은 부탁을 하고, 들어주면 숲의 정수를 바로 줘요
     - 선생님 도움: 조각에 가끔 선생님 블록이 끼어 나와요. 그 블록이 든 줄을 지우면 다람쥐(3×3 치우기), 부엉이(조각 바꾸기), 곰(조각 돌리기) 도움을 받아요
     하루에 5판까지 보상을 주고(2.3.1 woodani: 10판에서 5판, 대신 한 판 보상 +100%), 광고를 보면 2판 더 받아요. 그 뒤에도 연습으로는 계속 할 수 있어요. 하던 판은 저장돼요 */
  const PZ = {
    N: 8, perDay: 5, adMore: 2, adMax: 1, rw: 2, sweep: 0.7,   // rw: 한 판 보상 배수, sweep: 소탕 점수(부터 오늘 직접 한 판 점수의 70%, 화면에는 쓰지 않아요)
    comboGrace: 4,   // 줄을 못 지운 놓기가 이만큼 이어져야 콤보가 끊겨요
    pats: ['acorn', 'leaf', 'flower', 'mushroom', 'berry', 'water'],
    patName: { acorn: '도토리', leaf: '잎', flower: '꽃', mushroom: '버섯', berry: '산딸기', water: '물방울' },
    teas: ['squirrel', 'owl', 'bear'], teaName: { squirrel: '다람쥐', owl: '부엉이', bear: '곰' },
    teaRate: 1 / 8, teaMax: 5, teaBonus: 15,   // 조각 8개 중 1개꼴로 선생님 블록
    essPer: 150, essMax: 25,        // 점수 150점마다 숲의 정수 1개, 한 판에 25개까지
    minPer: 100, minMax: 15,        // 점수 100점마다 수업료 1분치, 한 판에 15분치까지 (균형 제안서)
    askN: [8, 12, 16, 20, 24], askEss: [2, 3, 4, 5, 5],
    askers: [['rabbit', '토끼'], ['fox', '여우'], ['raccoon', '너구리'], ['chick', '병아리'], ['bear', '아기곰'], ['cat', '고양이'], ['dog', '강아지'], ['penguin', '펭귄'], ['panda', '판다'], ['koala', '코알라'], ['otter', '수달']]
  };
  // 조각 모양: [행, 열] 칸 목록. 돌린 모양도 미리 다 넣어 둬요
  const pzRot = cells => { const h = Math.max(...cells.map(c => c[0])); return pzNorm(cells.map(([r, c]) => [c, h - r])); };
  const pzNorm = cells => { const r0 = Math.min(...cells.map(c => c[0])), c0 = Math.min(...cells.map(c => c[1])); return cells.map(([r, c]) => [r - r0, c - c0]).sort((a, b) => a[0] - b[0] || a[1] - b[1]); };
  const PZ_SHAPES = (() => {
    const out = [], seen = new Set();
    const put = cells => { const k = JSON.stringify(cells); if (!seen.has(k)) { seen.add(k); out.push(cells); } };
    const rots = cells => { let c = pzNorm(cells); for (let i = 0; i < 4; i++) { put(c); c = pzRot(c); } };
    for (let n = 1; n <= 5; n++) rots(Array.from({ length: n }, (_, i) => [0, i]));   // 막대 1~5
    put([[0, 0], [0, 1], [1, 0], [1, 1]]); rots([[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]]);   // 네모 2×2, 2×3
    put([[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]]);   // 3×3
    rots([[0, 0], [1, 0], [1, 1]]); rots([[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]]);   // 작은 ㄱ, 큰 ㄱ
    rots([[0, 0], [0, 1], [0, 2], [1, 1]]); rots([[0, 0], [1, 0], [2, 0], [2, 1]]);   // ㅗ, ㄴ
    rots([[0, 1], [0, 2], [1, 0], [1, 1]]); rots([[0, 0], [0, 1], [1, 1], [1, 2]]);   // S, Z
    return out;
  })();
  const pzEmpty = () => new Array(PZ.N * PZ.N).fill(0);
  const pzChoice = a => a[Math.floor(Math.random() * a.length)];
  // 새 조각: 모양은 고르게, 문양은 지금 부탁받은 문양이 조금 더 자주 나와요
  function pzNewPiece(cur) {
    const ask = cur && cur.ask ? cur.ask.k : 0;
    const k = ask && Math.random() < 0.28 ? ask : 1 + Math.floor(Math.random() * PZ.pats.length);
    const c = pzChoice(PZ_SHAPES).map(x => x.slice());
    const piece = { c, k };
    // 가끔 선생님 블록이 조각 한 칸에 끼어 나와요. 보관함이 빈 선생님이 먼저, 다 차 있으면 아무나
    if (Math.random() < PZ.teaRate) {
      const free = cur && cur.helps ? PZ.teas.filter(t => cur.helps[t] < PZ.teaMax) : PZ.teas;
      piece.t = pzChoice(free.length ? free : PZ.teas); piece.ti = Math.floor(Math.random() * c.length);
    }
    return piece;
  }
  function pzNewAsk(cur) {
    const i = cur.askI || 0;
    const prev = cur.ask ? cur.ask.k : 0;
    let k = 1 + Math.floor(Math.random() * PZ.pats.length);
    if (k === prev) k = 1 + (k % PZ.pats.length);
    const who = pzChoice(PZ.askers.filter(a => !cur.ask || a[0] !== cur.ask.who));
    const n = PZ.askN[Math.min(i, PZ.askN.length - 1)];
    cur.ask = { k, n, got: 0, who: who[0], name: who[1] };
  }
  const pzFreshGame = rw => {
    const cur = { b: pzEmpty(), tb: new Array(PZ.N * PZ.N).fill(''), tray: [null, null, null], score: 0, combo: 0, miss: 0, lines: 0, helps: { squirrel: 0, owl: 0, bear: 0 }, askI: 0, ask: null, ess: 0, rw: !!rw, mode: '' };
    pzNewAsk(cur);
    cur.tray = cur.tray.map(() => pzNewPiece(cur));
    return cur;
  };
  // 저장된 판 읽기: 모양이 어긋나면 버리고 새로 시작해요
  function pzSanitize(d) {
    if (!d || typeof d !== 'object' || !Array.isArray(d.b) || d.b.length !== PZ.N * PZ.N) return null;
    const cell = v => (typeof v === 'number' && v >= 0 && v <= PZ.pats.length) ? Math.floor(v) : 0;
    const piece = p => {
      if (!p || typeof p !== 'object' || !Array.isArray(p.c) || !p.c.length || p.c.length > 9) return null;
      const c = p.c.filter(x => Array.isArray(x) && x.length === 2 && Number.isInteger(x[0]) && Number.isInteger(x[1]) && x[0] >= 0 && x[0] < PZ.N && x[1] >= 0 && x[1] < PZ.N).map(x => [x[0], x[1]]);
      const k = cell(p.k);
      if (c.length !== p.c.length || !k) return null;
      const out = { c: pzNorm(c), k };
      if (PZ.teas.includes(p.t) && Number.isInteger(p.ti) && p.ti >= 0 && p.ti < c.length) { out.t = p.t; out.ti = p.ti; }
      return out;
    };
    const tray = Array.isArray(d.tray) ? d.tray.slice(0, 3).map(piece) : [];
    while (tray.length < 3) tray.push(null);
    const b = d.b.map(cell);
    const tb = Array.isArray(d.tb) && d.tb.length === b.length ? d.tb.map((t, i) => b[i] && PZ.teas.includes(t) ? t : '') : new Array(b.length).fill('');
    const helps = { squirrel: 0, owl: 0, bear: 0 };
    if (d.helps && typeof d.helps === 'object') for (const t of PZ.teas) helps[t] = Math.min(PZ.teaMax, Math.floor(numFb(d.helps[t], 0, 0)));
    const cur = { b, tb, tray, score: Math.min(1e9, Math.floor(numFb(d.score, 0, 0))), combo: Math.floor(numFb(d.combo, 0, 0, SAVE_CAP.count)), miss: Math.floor(numFb(d.miss, 0, 0, SAVE_CAP.count)), lines: Math.floor(numFb(d.lines, 0, 0, SAVE_CAP.count)),
      helps, askI: Math.floor(numFb(d.askI, 0, 0, SAVE_CAP.count)), ask: null, ess: Math.floor(numFb(d.ess, 0, 0, SAVE_CAP.count)), rw: d.rw !== false, mode: '' };
    if (d.bst && typeof d.bst === 'object') cur.bst = { teacher: !!d.bst.teacher, small: !!d.bst.small, combo: !!d.bst.combo };   // 부스터
    if (d.ask && typeof d.ask === 'object' && cell(d.ask.k)) {
      const who = PZ.askers.find(a => a[0] === d.ask.who) || PZ.askers[0];
      cur.ask = { k: cell(d.ask.k), n: Math.max(1, Math.floor(numFb(d.ask.n, 1, 8, SAVE_CAP.count))), got: Math.floor(numFb(d.ask.got, 0, 0, SAVE_CAP.count)), who: who[0], name: who[1] };
    } else pzNewAsk(cur);
    cur.tray = cur.tray.map(p => p || pzNewPiece(cur));   // 빈 자리는 바로 채워요(옛 저장의 빈 자리도)
    return cur;
  }
  // 오늘 남은 보상 판. 날이 바뀌면 다시 5판
  function pzDay() { const t = gameToday(); if (dayRoll(S.pz, t)) { S.pz.n = 0; S.pz.adN = 0; } }
  const pzQuota = () => PZ.perDay + S.pz.adN * PZ.adMore;
  const pzLeft = () => { pzDay(); return Math.max(0, pzQuota() - S.pz.n); };
  const pzCanAd = () => { pzDay(); return pzLeft() <= 0 && S.pz.adN < PZ.adMax; };
  // 판 규칙
  const pzAt = (b, r, c) => b[r * PZ.N + c];
  function pzFits(b, cells, r, c) {
    for (const [dr, dc] of cells) { const rr = r + dr, cc = c + dc; if (rr < 0 || cc < 0 || rr >= PZ.N || cc >= PZ.N || pzAt(b, rr, cc)) return false; }
    return true;
  }
  function pzAnyFit(b, piece) {
    if (!piece) return false;
    for (let r = 0; r < PZ.N; r++) for (let c = 0; c < PZ.N; c++) if (pzFits(b, piece.c, r, c)) return true;
    return false;
  }
  const pzStuck = cur => cur.tray.every(p => !p || !pzAnyFit(cur.b, p));
  // 가득 찬 줄 찾기: 가로 줄과 세로 줄, 그리고 같은 문양으로만 찬 줄
  function pzFullLines(b) {
    const rows = [], cols = [], mono = [];
    for (let i = 0; i < PZ.N; i++) {
      let fr = true, fc = true, mr = true, mc = true;
      for (let j = 0; j < PZ.N; j++) {
        const vr = pzAt(b, i, j), vc = pzAt(b, j, i);
        if (!vr) fr = false; else if (vr !== pzAt(b, i, 0)) mr = false;
        if (!vc) fc = false; else if (vc !== pzAt(b, 0, i)) mc = false;
      }
      if (fr) { rows.push(i); if (mr) mono.push('r' + i); }
      if (fc) { cols.push(i); if (mc) mono.push('c' + i); }
    }
    return { rows, cols, mono };
  }
  // 조각 놓기. 돌려주는 값: 놓은 칸 수, 지운 줄, 문양 줄, 번 점수, 지운 칸의 문양 수
  function pzPlace(cur, slot, r, c) {
    const p = cur.tray[slot];
    if (!p || !pzFits(cur.b, p.c, r, c)) return null;
    p.c.forEach(([dr, dc], i) => { const at = (r + dr) * PZ.N + c + dc; cur.b[at] = p.k; cur.tb[at] = p.t && p.ti === i ? p.t : ''; });
    cur.tray[slot] = null;
    const filled = cur.b.slice(), filledT = cur.tb.slice();   // 지우기 전 모습 (터지는 효과에 써요)
    const L = pzFullLines(cur.b);
    const n = L.rows.length + L.cols.length;
    const cleared = [], pats = {}, teas = [];
    const take = (rr, cc) => {
      const i = rr * PZ.N + cc, v = cur.b[i];
      if (!v) return;
      pats[v] = (pats[v] || 0) + 1; cur.b[i] = 0; cleared.push(i);
      // 선생님 블록이 든 줄을 지우면 그 선생님 도움 1개. 벌써 갖고 있으면 점수로 대신 줘요
      const t = cur.tb[i]; cur.tb[i] = '';
      if (t) { const got = cur.helps[t] < PZ.teaMax; if (got) cur.helps[t] += 1; teas.push({ t, i, got }); }
    };
    L.rows.forEach(rr => { for (let j = 0; j < PZ.N; j++) take(rr, j); });
    L.cols.forEach(cc => { for (let j = 0; j < PZ.N; j++) take(j, cc); });
    let gain = p.c.length;
    if (n > 0) {
      cur.combo += 1; cur.miss = 0; cur.lines += n;
      const mult = Math.min(4, 1 + 0.5 * (cur.combo - 1) + (cur.bst && cur.bst.combo ? 0.5 : 0));   // 콤보 부스터: 첫 줄부터 ×1.5
      gain += Math.round((10 * n + 5 * n * (n - 1) + 20 * L.mono.length) * mult) + PZ.teaBonus * teas.filter(x => !x.got).length;
    } else { cur.miss = (cur.miss || 0) + 1; if (cur.miss >= PZ.comboGrace) { cur.combo = 0; cur.miss = 0; } }   // 네 번 연달아 못 지우면 끊겨요
    cur.score += gain;
    // 학생 부탁 진행
    const asks = [];
    if (cur.ask && pats[cur.ask.k]) {
      cur.ask.got += pats[cur.ask.k];
      // 부탁을 들어주면 다음 학생이 와요. 넘친 수는 다음 부탁으로 넘기지 않아요 (문양이 다르니까요)
      if (cur.ask.got >= cur.ask.n) {
        const e = PZ.askEss[Math.min(cur.askI, PZ.askEss.length - 1)];
        asks.push({ name: cur.ask.name, ess: cur.rw ? e : 0 });
        if (cur.rw) cur.ess += e;
        cur.askI += 1; pzNewAsk(cur);
      }
    }
    cur.tray[slot] = pzNewPiece(cur);   // 셋을 다 쓰기 전에, 쓴 자리에 바로 새 조각
    return { placed: p.c.map(([dr, dc]) => (r + dr) * PZ.N + c + dc), lines: L, n, cleared, gain, pats, asks, teas, filled, filledT, over: pzStuck(cur) };
  }
  // 선생님 도움
  const pzHasHelp = (cur, t) => cur.helps && cur.helps[t] > 0;
  function pzHelpSquirrel(cur, r, c) {
    if (!pzHasHelp(cur, 'squirrel')) return [];
    const out = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || cc < 0 || rr >= PZ.N || cc >= PZ.N) continue;
      const i = rr * PZ.N + cc; if (cur.b[i]) { cur.b[i] = 0; cur.tb[i] = ''; out.push(i); }
    }
    cur.helps.squirrel -= 1; return out;
  }
  /* 부엉이 조각 바꾸기는 되도록 꼭 필요한 조각으로. 조각마다 후보 여러 개를 놓아 보고
     줄을 가장 많이 지우는 조각, 없으면 놓을 자리가 있는 조각을 골라요. 세 조각이 같은 모양만 나오지 않게 겹치면 다음 후보 */
  function pzBestLines(b, c) {
    let best = -1;
    for (let r = 0; r < PZ.N; r++) for (let cc = 0; cc < PZ.N; cc++) {
      if (!pzFits(b, c, r, cc)) continue;
      const t = b.slice(); for (const [dr, dc] of c) t[(r + dr) * PZ.N + cc + dc] = 1;
      const L = pzFullLines(t), n = L.rows.length + L.cols.length; if (n > best) best = n;
    }
    return best;   // -1이면 놓을 데가 없어요
  }
  function pzSmartPiece(cur, used) {
    let pick = null, ps = -2;
    for (let i = 0; i < 24; i++) {
      const p = pzNewPiece(cur), k = JSON.stringify(p.c); if (used.has(k) && i < 23) continue;
      const sc = pzBestLines(cur.b, p.c) + p.c.length * 0.01;   // 같은 줄 수면 큰 조각이 조금 먼저
      if (sc > ps) { ps = sc; pick = p; }
    }
    used.add(JSON.stringify(pick.c)); return pick;
  }
  function pzHelpOwl(cur) { if (!pzHasHelp(cur, 'owl')) return false; const used = new Set(); cur.tray = cur.tray.map(() => pzSmartPiece(cur, used)); cur.helps.owl -= 1; return true; }
  function pzHelpBear(cur, slot) {
    const p = cur.tray[slot]; if (!p || !pzHasHelp(cur, 'bear')) return false;
    // 돌리면 칸 순서가 바뀌니 선생님 블록이 어느 칸인지 따라가요
    const before = p.ti != null ? p.c[p.ti] : null;
    const h = Math.max(...p.c.map(x => x[0]));
    p.c = pzRot(p.c);
    if (before) { const [r0, c0] = before; p.ti = Math.max(0, p.c.findIndex(([r, c]) => r === c0 && c === h - r0)); }
    cur.helps.bear -= 1; return true;
  }
  // 보상: 숲의 정수는 점수로, 도토리는 수업료 몇 분치로(학교급이 올라가도 알맞은 양)
  const pzEssOf = score => Math.min(PZ.essMax, Math.floor(score / PZ.essPer)) * PZ.rw;   // 한 판 보상 두 배(하루 판 수는 절반)
  const pzMinOf = score => Math.min(PZ.minMax, Math.floor(score / PZ.minPer)) * PZ.rw;
  const pzXpOf = score => Math.min(AC.pzMax, Math.floor(score / AC.pzPer)) * PZ.rw;
  function addEss(n) { if (!(n > 0)) return; S.ess = Math.min(1e9, S.ess + Math.floor(n * (1 + rxPct('ess') / 100))); renderEss(); }   // 정수 연구
  function renderEss() { const e = $('#essHave'); if (e) e.textContent = fmt(S.ess); const et = $('#vEssTop'); if (et) et.textContent = fmt(S.ess); const e2 = $('#essHave2'); if (e2) e2.textContent = fmt(S.ess); }
  // 판 끝내기(다 막혔거나 그만하기). 정수와 도토리를 주고 최고 점수를 남겨요
  function pzFinish(cur) {
    const rw = cur.rw, score = cur.score;
    const ess = rw ? Math.floor(pzEssOf(score) * libMult()) : 0, mins = rw ? pzMinOf(score) : 0;   // 사서 선생님 레벨만큼 더
    const acorns = mins > 0 ? nice(rate() * 60 * mins) : 0;
    if (ess > 0) addEss(ess);
    if (acorns > 0) { S.budget += acorns; earn(acorns); }
    const newBest = score > S.pz.best;
    if (newBest) S.pz.best = score;
    S.st.pz = (S.st.pz || 0) + 1;
    const xp = rw ? acGain('math', pzXpOf(score)) : 0;   // 공부: 보상 판은 수학 XP(100점마다 1, 판당 12까지. 두 배)
    if (rw && cur.hand !== false) { const t = gameToday(); S.pz.tb = S.pz.hand === t ? Math.max(S.pz.tb || 0, score) : score; S.pz.hand = t; }   // 오늘 직접 한 판이 있으면 소탕이 열려요(그날 직접 한 판의 최고 점수를 남겨요)
    const tk = rw ? tkDaily('pz') : null;   // 보상 판마다 5분권 1장(하루 3장)
    S.pz.cur = null;
    save();
    return { score, ess, askEss: rw ? cur.ess : 0, mins, acorns, newBest, rw, xp, tk };
  }
  /* 숲속 퍼즐 소탕: 그날 보상 판을 1판 직접 하면 열려요. 판마다 오늘 직접 한 판 점수의 70%(PZ.sweep, 조정안 5. 예전에는 역대 최고 점수)로 친 보상을 바로 받아요
     비율은 화면에 쓰지 않고 받을 양만 보여 줘요. 학생 부탁은 소탕으로 채우지 않아요. 오늘의 미션, 이벤트의 '퍼즐 n판'에는 쳐요 */
  const pzSwOpen = () => { pzDay(); return S.pz.hand === gameToday() && (S.pz.tb || 0) > 0; };
  const pzSwScore = () => S.pz.hand === gameToday() ? Math.floor((S.pz.tb || 0) * PZ.sweep) : 0;
  function pzSwGain(n) {
    const sc = pzSwScore(), one = { ess: Math.floor(pzEssOf(sc) * libMult()), m: pzMinOf(sc), xp: pzXpOf(sc) };
    const tkLeft = Math.max(0, TKE.perDay - (S.tkd && S.tkd.day === gameToday() ? S.tkd.pz : 0));
    return { ess: one.ess * n, acorns: one.m > 0 ? nice(rate() * 60 * one.m) * n : 0, xp: one.xp * n, tk: Math.min(n, tkLeft) };
  }
  function pzSwText(g) { return [g.ess ? `숲의 정수 +${g.ess}` : '', g.acorns ? `도토리 +${fmt(g.acorns)}` : '', g.xp ? `수학 XP +${g.xp}` : '', g.tk ? `5분 단축권 +${g.tk}` : ''].filter(Boolean).join(', ') || '보상 없음'; }
  function openPzSw() {
    if (!pzSwOpen()) { toast('오늘 보상 판을 1판 직접 하면 소탕할 수 있어요'); return; }
    const left = pzLeft(); if (left <= 0) { toast('오늘 보상 판을 다 했어요. 내일 다시 열려요'); return; }
    rt.pzSwN = rt.pzSwN === left || rt.pzSwN === 1 ? rt.pzSwN : 1; if (rt.pzSwN > left) rt.pzSwN = 1;
    renderPzSw(); openModal($('#mPzSw'));
  }
  function renderPzSw() {
    const left = pzLeft(), opts = left > 1 ? [1, left] : [1];
    if (!opts.includes(rt.pzSwN)) rt.pzSwN = 1;
    $('#pzSwOpts').innerHTML = opts.map(n => `<button type="button" class="sw-opt${rt.pzSwN === n ? ' on' : ''}" data-sw="${n}"><b>${n === 1 ? '1판 소탕' : `남은 ${n}판 모두 소탕`}</b><small>${pzSwText(pzSwGain(n))}</small></button>`).join('');
  }
  function pzSweep(n) {
    if (!pzSwOpen() || rt.paused) return false;
    n = Math.min(n, pzLeft()); if (n <= 0) return false;
    const g = { ess: 0, acorns: 0, xp: 0, tk: 0 }, sc = pzSwScore();
    for (let i = 0; i < n; i++) {
      S.pz.n += 1; S.st.pz = (S.st.pz || 0) + 1;
      const ess = Math.floor(pzEssOf(sc) * libMult()), m = pzMinOf(sc), a = m > 0 ? nice(rate() * 60 * m) : 0;
      if (ess > 0) addEss(ess); if (a > 0) { S.budget += a; earn(a); }
      g.ess += ess; g.acorns += a; g.xp += acGain('math', pzXpOf(sc));
      if (tkDaily('pz')) g.tk += 1;
    }
    sfx('quest'); buzz(15);
    showReward({ title: `퍼즐 ${n}판 소탕!`, sub: '숲속 퍼즐 보상을 받았어요', items: [g.ess ? { ic: 'ess', t: `숲의 정수 +${g.ess}` } : null, g.acorns ? { ic: 'acorn', t: `도토리 +${fmt(g.acorns)}` } : null, g.xp ? { ic: '📘', t: `수학 XP +${g.xp}` } : null, g.tk ? { ic: IMG('ticket_m5') ? `<img src="${IMG('ticket_m5')}" alt="" style="width:22px;height:22px;object-fit:contain">` : '⏱', t: `5분 단축권 +${g.tk}` } : null].filter(Boolean) });
    save(); renderMini(); renderEss(); renderHUD(); checkQuests(); if (typeof evSync === 'function') evSync();
    return g;
  }
  // 숲속 퍼즐 부스터. 값은 수업료 몇 분치라 학교급이 올라가도 알맞아요. 보상 상한(정수 25, 도토리 15분치)은 그대로
  const PZB = {
    teacher: { m: 5, e: 4, ic: 'boost_pz_teacher', name: '선생님 도움', d: '선생님 도움 하나를 들고 시작' },
    small: { m: 3, e: 3, ic: 'boost_pz_small', name: '작은 조각', d: '처음 조각 3개를 작은 조각으로' },
    combo: { m: 10, e: 6, ic: 'boost_pz_combo', name: '콤보 ×1.5', d: '첫 줄부터 콤보 ×1.5로 시작' },
  };
  const PZB_IDS = Object.keys(PZB);
  // 재화 원칙: 부스터는 숲의 정수로 값을 고정해요(e). m은 1.7.x 도토리 값(수업료 분치) 기록
  const pzbCost = id => PZB[id].e;
  // 아직 아무것도 놓지 않은 보상 판에만 부스터를 쓸 수 있어요
  const pzFresh = cur => !!(cur && cur.rw && !cur.score && !cur.lines && !cur.bst && cur.b.every(v => !v));
  function pzApplyBoost(cur, ids) {
    cur.bst = { teacher: false, small: false, combo: false };
    for (const id of ids) {
      if (!PZB[id]) continue;
      cur.bst[id] = true;
      if (id === 'teacher') { const free = PZ.teas.filter(t => cur.helps[t] < PZ.teaMax); const t = pzChoice(free.length ? free : PZ.teas); cur.helps[t] = Math.min(PZ.teaMax, cur.helps[t] + 1); cur.bst.tea = t; }
      if (id === 'small') { const smalls = PZ_SHAPES.filter(c => c.length <= 3); cur.tray = cur.tray.map(() => ({ c: pzChoice(smalls).map(x => x.slice()), k: 1 + Math.floor(Math.random() * PZ.pats.length) })); }
    }
  }
  // 새 판 시작. 보상 판이 남아 있으면 하나 쓰고, 없으면 연습 판이에요
  function pzStart() {
    pzDay();
    const rw = pzLeft() > 0;
    if (rw) S.pz.n += 1;
    S.pz.cur = pzFreshGame(rw);
    save();
    return S.pz.cur;
  }

  /* 블록 퍼즐 화면 */
  const pzUI = { open: false, drag: null, mode: '', art: false, cells: [] };
  const pzImg = k => `url('${IMG(k)}')`;   // 작은따옴표: style 속성 안에 그대로 넣어요
  function pzInitArt() {
    if (pzUI.art) return;
    pzUI.art = true;
    const sc = $('#pzScene');
    sc.style.setProperty('--pz-bg', window.FS_MINI_BG?.puzzle ? `url('${window.FS_MINI_BG.puzzle}')` : pzImg('pz_bg'));
    sc.style.setProperty('--pz-board', pzImg('pz_board'));
    sc.style.setProperty('--pz-ghost', pzImg('pz_block_ghost'));
    $$('#pzHelps .pz-teapic').forEach(el => { el.style.backgroundImage = pzImg(el.dataset.tea); });
    const grid = $('#pzGrid');
    grid.innerHTML = Array.from({ length: PZ.N * PZ.N }, (_, i) => `<div class="pz-cell" data-i="${i}"></div>`).join('');
    pzUI.cells = $$('#pzGrid .pz-cell');
  }
  const pzBlockImg = k => k ? pzImg('pz_block_' + PZ.pats[k - 1]) : '';
  // 선생님 블록: 그림(pz_tea_*)이 있으면 블록 자체가 선생님 블록이 되고, 모퉁이에 원래 문양 블록을 작게 보여요(문양 줄과 학생 부탁에 그대로 쳐요).
  // 그림이 없으면 문양 블록 위에 선생님 얼굴을 겹쳐요
  const pzTeaArt = t => !!(t && IMG('pz_tea_' + t));
  const pzTeaStyle = (t, k) => !t ? '' : pzTeaArt(t) ? `--tea:${pzBlockImg(k)}` : `--tea:${pzImg('tea_' + t)}`;
  const pzCellImg = (k, t) => pzTeaArt(t) ? pzImg('pz_tea_' + t) : pzBlockImg(k);
  // 부스터 시트
  function pzBoostOpen() {
    const cur = S.pz.cur;
    if (!pzFresh(cur)) { $('#pzBoost').hidden = true; return; }
    pzUI.pick = new Set();
    pzBoostRender();
    setT($('#pzBoostRw'), `${PZ.essPer}점마다 숲의 정수 ${PZ.rw}개, ${PZ.minPer}점마다 수업료 ${PZ.rw}분치를 받아요`);
    $('#pzBoost').hidden = false;
  }
  function pzBoostRender() {
    const pick = pzUI.pick || new Set();
    let sum = 0; for (const id of pick) sum += pzbCost(id);
    $('#pzbList').innerHTML = PZB_IDS.map(id => {
      const B = PZB[id], c = pzbCost(id), on = pick.has(id), poor = !on && S.ess < sum + c;
      return `<button class="pzb${on ? ' on' : ''}${poor ? ' poor' : ''}" type="button" data-pzb="${id}" aria-pressed="${on}"><span class="pzb-ic" style="background-image:${pzImg(IMG(B.ic) ? B.ic : 'tea_squirrel')}" aria-hidden="true"></span>` +
        `<span class="pzb-tx"><b>${B.name}</b><small>${B.d}</small></span><span class="pzb-pr">${ESS_ICON()}${fmt(c)}</span></button>`;
    }).join('');
    $('#pzbGo').textContent = sum > 0 ? `정수 ${fmt(sum)} 쓰고 시작하기` : '시작하기';
  }
  function pzBoostGo(skip) {
    const cur = S.pz.cur, pick = skip ? [] : [...(pzUI.pick || [])];
    $('#pzBoost').hidden = true;
    if (!pick.length || !pzFresh(cur)) { pzRenderAll(); return; }
    const sum = pick.reduce((a, id) => a + pzbCost(id), 0);
    if (S.ess < sum) { pzHint('숲의 정수가 모자라요'); return; }
    S.ess -= sum; S.st.esSpent = (S.st.esSpent || 0) + sum;
    pzApplyBoost(cur, pick);
    S.st.pzb = (S.st.pzb || 0) + pick.length;
    sfx('coin'); buzz(12);
    pzHint(pick.map(id => PZB[id].name).join(', ') + ' 부스터를 들고 시작해요');
    save(); renderHUD(); renderEss(); pzRenderAll();
  }
  function pzOpen(asked) {
    pzInitArt();
    if (FXL.st === 'ok' && !FXO.st) fxoInit();   // 깨지는 조각 그림판
    setTimeout(() => { try { if (FXO.st === 'ok' || FXL.st === 'ok') new Set([...document.querySelectorAll('#pzBoard [style*="url"], #pzTray [style*="url"]')].map(e => e.style.backgroundImage)).forEach(fxoUrlTex); } catch (e) { /* 다음에 */ } }, 600);
    pzDay();
    // 보상 없는 연습 판이 남아 있는데 오늘 보상 판이 있으면 이어 할지 새 보상 판으로 할지 물어요(뒤로 가기는 이어 하기)
    if (!asked && S.pz.cur && !S.pz.cur.rw && pzLeft() > 0) {
      askBox({ title: '새 보상 판이 있어요', text: `하던 연습 판(${fmt(S.pz.cur.score)}점)이 남아 있어요.\n연습 판은 끝까지 해도 보상이 없어요.\n오늘 보상 판 ${pzLeft()}판이 남았어요.`,
        yes: '새 보상 판 시작', no: '연습 판 이어 하기', onYes: () => { S.pz.cur = null; pzStart(); pzOpen(true); }, onNo: () => pzOpen(true) });
      return;
    }
    if (!S.pz.cur) pzStart();
    pzUI.open = true; pzUI.mode = '';
    $('#pzScene').hidden = false;
    $('#pzEnd').hidden = true; $('#pzQuitAsk').hidden = true; $('#pzHint').hidden = true;
    pzRenderAll();
    if (pzStuck(S.pz.cur)) pzGameOver(); else pzBoostOpen();
    musicSync();
  }
  function pzClose() {
    pzUI.open = false; pzUI.mode = '';
    if (pzUI.holdEl) { pzUI.holdEl.remove(); pzUI.holdEl = null; }   // 들고 있던 폭탄
    pzDragEnd(true);
    $('#pzScene').hidden = true;
    save();
    renderMini();
    musicSync();
  }
  function pzRenderAll() { pzRenderBoard(); pzRenderTray(); pzRenderTop(); pzRenderAsk(); pzRenderHelp(); }
  // 판 칸: 문양과 선생님 블록이 바뀐 칸만 다시 그려요
  function pzRenderBoard() {
    const cur = S.pz.cur; if (!cur) return;
    pzUI.cells.forEach((el, i) => {
      const v = cur.b[i], t = cur.tb[i] || '', key = v + ':' + t;
      if (el.dataset.v !== key) {
        el.dataset.v = key; el.style.backgroundImage = pzCellImg(v, t); el.className = 'pz-cell' + (v ? ' on' : '') + (t ? ' tea' + (pzTeaArt(t) ? ' ti' : '') : '');
        el.style.setProperty('--tea', t ? pzTeaStyle(t, v).slice(6) : 'none');
      }
    });
  }
  const pzDims = p => ({ h: Math.max(...p.c.map(x => x[0])) + 1, w: Math.max(...p.c.map(x => x[1])) + 1 });
  function pzCellsHTML(p) {
    const { w, h } = pzDims(p);
    const on = new Map(p.c.map(([r, c], i) => [r * w + c, i])), img = pzBlockImg(p.k);
    let s = '';
    for (let i = 0; i < w * h; i++) {
      if (!on.has(i)) { s += '<i></i>'; continue; }
      const tea = p.t && on.get(i) === p.ti;
      s += `<i class="${tea ? 'tea' + (pzTeaArt(p.t) ? ' ti' : '') : ''}" style="background-image:${tea ? pzCellImg(p.k, p.t) : img};${tea ? pzTeaStyle(p.t, p.k) : ''}"></i>`;
    }
    return s;
  }
  function pzPieceHTML(p, size) {
    const { w, h } = pzDims(p);
    return `<div class="pz-piece" style="grid-template-columns:repeat(${w},${size}px);grid-template-rows:repeat(${h},${size}px)">${pzCellsHTML(p)}</div>`;
  }
  function pzRenderTray() {
    const cur = S.pz.cur; if (!cur) return;
    const tray = $('#pzTray');
    const slotW = (tray.clientWidth - 12 - 16) / 3 || 100, slotH = tray.clientHeight - 12 || 92;
    tray.innerHTML = cur.tray.map((p, i) => {
      if (!p) return `<div class="pz-slot empty" data-slot="${i}"></div>`;
      const { w, h } = pzDims(p);
      const size = Math.floor(Math.min(26, (slotW - 8) / w, (slotH - 8) / h));
      const stuck = !pzAnyFit(cur.b, p);
      return `<div class="pz-slot${stuck ? ' stuck' : ''}${pzUI.mode === 'bear' ? ' rotpick' : ''}" data-slot="${i}" role="button" aria-label="조각 ${i + 1}">${pzPieceHTML(p, size)}</div>`;
    }).join('');
  }
  function pzRenderTop() {
    const cur = S.pz.cur; if (!cur) return;
    $('#pzScore').textContent = fmt(cur.score);
    $('#pzBest').textContent = fmt(Math.max(S.pz.best, cur.score));
    $('#pzEssNow').textContent = cur.rw ? fmt(pzEssOf(cur.score) + cur.ess) : '연습';
    const cb = $('#pzCombo'); if (cb) { const on = cur.combo >= 1; cb.hidden = !on; if (on) cb.textContent = `콤보 ×${Math.min(4, 1 + 0.5 * cur.combo).toFixed(1).replace('.0', '')} (${PZ.comboGrace - (cur.miss || 0)}번)`; }
  }
  function pzRenderAsk() {
    const cur = S.pz.cur; if (!cur || !cur.ask) return;
    const a = cur.ask;
    $('#pzAskPic').style.setProperty('--pz-chr', pzImg('chr_' + a.who));
    $('#pzAskWho').textContent = a.name;
    $('#pzAskWhat').textContent = `${PZ.patName[PZ.pats[a.k - 1]]} 블록 ${a.n}개 지워 줘!`;
    $('#pzAskN').textContent = `${Math.min(a.got, a.n)}/${a.n}`;
    $('#pzAskFill').style.width = Math.min(100, a.got / a.n * 100) + '%';
  }
  // 선생님 도움 단추: 갖고 있으면 밝게, 쓰는 중이면 테두리
  function pzRenderHelp() {
    if (pzUI.mode !== 'squirrel') pzAim(null);   // 다람쥐 모드를 나가면 3×3 미리 보기를 지워요
    const cur = S.pz.cur; if (!cur) return;
    $$('#pzHelps .pz-tea').forEach(b => {
      const t = b.dataset.help, n = cur.helps[t] || 0;
      b.classList.toggle('has', n > 0); b.classList.toggle('on', pzUI.mode === t);
      b.querySelector('.pz-tean').textContent = `${n}/${PZ.teaMax}`; b.classList.toggle('full', n >= PZ.teaMax);   // 보유/최대
    });
  }
  function pzHint(msg, ms) {
    const h = $('#pzHint'); h.textContent = msg; h.hidden = false;
    clearTimeout(pzUI.hintT); pzUI.hintT = setTimeout(() => { h.hidden = true; }, ms || 1600);
  }
  // 판 위 글자 효과(+점수, 콤보)와 잎 조각
  function pzFx(txt, cls, i) {
    const pop = $('#pzPop'); if (!pop) return;
    const rect = pzGridRect();
    let x = rect.w / 2, y = rect.h / 2;
    if (i != null) { x = rect.ox + (i % PZ.N + 0.5) * rect.cell; y = rect.oy + (Math.floor(i / PZ.N) + 0.5) * rect.cellY; }
    const el = document.createElement('span');
    el.className = 'pz-fx' + (cls ? ' ' + cls : ''); el.textContent = txt;
    el.style.left = x + 'px'; el.style.top = y + 'px';
    pop.appendChild(el); setTimeout(() => el.remove(), 1000);
  }
  function pzLeaves(idx, kind) {
    if (rt.reduced) return;
    const pop = $('#pzPop'), rect = pzGridRect();
    idx.slice(0, 24).forEach(i => {
      const x = rect.ox + (i % PZ.N + 0.5) * rect.cell, y = rect.oy + (Math.floor(i / PZ.N) + 0.5) * rect.cellY;
      for (let n = 0; n < (kind === 'mono' ? 2 : 1); n++) {
        const el = document.createElement('i');
        const art = kind === 'mono' ? 'fx_sparkle' : Math.random() < 0.4 ? 'fx_leaf_3' : (Math.random() < 0.5 ? 'fx_leaf_1' : 'fx_leaf_2');
        el.className = 'pz-leaf' + (kind === 'mono' ? ' s' : art === 'fx_leaf_3' ? ' p' : '');
        if (IMG(art)) { el.classList.add('img'); el.style.backgroundImage = pzImg(art); }   // 그림이 있으면 그림 잎과 반짝이
        el.style.left = x + 'px'; el.style.top = y + 'px';
        el.style.setProperty('--dx', (Math.random() * 80 - 40) + 'px'); el.style.setProperty('--dy', (-30 - Math.random() * 60) + 'px'); el.style.setProperty('--rot', (Math.random() * 300 - 150) + 'deg');
        pop.appendChild(el); setTimeout(() => el.remove(), 900);
      }
    });
  }
  // 판 안 칸 좌표: 판(#pzBoard) 기준으로 격자가 어디서 시작하고 한 칸이 몇 px인지
  function pzGridRect() {
    const b = $('#pzBoard').getBoundingClientRect(), g = $('#pzGrid').getBoundingClientRect();
    return { ox: g.left - b.left, oy: g.top - b.top, cell: g.width / PZ.N, cellY: g.height / PZ.N, w: b.width, h: b.height, gl: g.left, gt: g.top };
  }
  /* 조각 끌기 손맛
     - 집으면 조각이 판 크기로 커지며 튀어 오르고, 손가락 바로 위(한 칸쯤)에 따라와요
     - 놓을 수 있는 자리에 가까우면 자석처럼 그 자리에 붙어 보이고, 놓이면 통통 눌리며 짧게 떨려요
     - 놓을 수 없는 곳에서 손을 떼면 조각이 쟁반으로 날아 돌아가요 */
  function pzDragStart(e, slot) {
    const cur = S.pz.cur; if (!cur || pzUI.drag || !pzUI.open) return;
    if (pzUI.mode === 'bear') {
      if (pzHelpBear(cur, slot)) { pzUI.mode = ''; sfx('leaf'); buzz(12); pzHint(profText('곰 선생님이 조각을 돌려 줬어요')); save(); pzRenderTray(); pzRenderHelp(); if (pzStuck(cur)) pzGameOver(); }
      return;
    }
    if (pzUI.mode) return;
    const p = cur.tray[slot]; if (!p) return;
    const rect = pzGridRect(), cell = rect.cell;
    const { w, h } = pzDims(p);
    const d = $('#pzDrag');
    d.classList.remove('fly'); d.style.transition = 'none';
    d.innerHTML = `<div class="pz-dragin" style="grid-template-columns:repeat(${w},${cell - 1}px);grid-template-rows:repeat(${h},${cell - 1}px)">${pzCellsHTML(p)}</div>`;
    d.hidden = false;
    const inner = d.firstChild;
    inner.style.transformOrigin = `${w * cell / 2}px ${h * cell}px`;
    // 손가락은 조각 아래쪽 가운데를 잡은 것으로 보고, 조각을 손가락보다 한 칸 남짓 위에 띄워요
    pzUI.drag = { slot, p, w, h, cell, offX: w * cell / 2, offY: h * cell + cell * 1.25, pid: e.pointerId, at: -1, inner, x: 0, y: 0 };
    $$('#pzTray .pz-slot')[slot].classList.add('lift');
    try { e.target.setPointerCapture && e.target.setPointerCapture(e.pointerId); } catch (x) { /* 무시 */ }
    sfx('tap'); buzz(8);
    pzDragMove(e);
  }
  function pzDragMove(e) {
    const dg = pzUI.drag; if (!dg) return;
    const x = e.clientX - dg.offX, y = e.clientY - dg.offY;
    dg.x = x; dg.y = y;
    $('#pzDrag').style.transform = `translate(${x}px, ${y}px)`;
    const rect = pzGridRect();
    const fc = (x - rect.gl) / rect.cell, fr = (y - rect.gt) / rect.cellY;
    const cur = S.pz.cur;
    // 딱 맞는 칸이 아니어도 한 칸 남짓 안에서 가장 가까운 놓을 자리로 붙어요
    let r = Math.round(fr), c = Math.round(fc), ok = pzFits(cur.b, dg.p.c, r, c);
    if (!ok) { let bd = 0.95 * 0.95; for (let rr = Math.floor(fr) - 1; rr <= Math.ceil(fr) + 1; rr++) for (let cc = Math.floor(fc) - 1; cc <= Math.ceil(fc) + 1; cc++) { const d = (rr - fr) ** 2 + (cc - fc) ** 2; if (d < bd && pzFits(cur.b, dg.p.c, rr, cc)) { bd = d; r = rr; c = cc; ok = true; } } }
    const at = ok ? r * PZ.N + c : -1;
    // 자석: 놓을 수 있으면 조각이 그 칸에 딱 붙어 보여요
    if (ok) { const sx = rect.gl + c * rect.cell - x, sy = rect.gt + r * rect.cellY - y; dg.inner.style.transform = `translate(${sx}px, ${sy}px)`; }
    else dg.inner.style.transform = '';
    if (at === dg.at) return;
    dg.at = at;
    pzUI.cells.forEach(el => { el.classList.remove('ghost', 'will'); });
    if (!ok) return;
    buzz(4);
    // 놓을 자리와, 놓으면 지워질 줄을 미리 보여 줘요
    const trial = cur.b.slice();
    for (const [dr, dc] of dg.p.c) { const i = (r + dr) * PZ.N + c + dc; trial[i] = dg.p.k; pzUI.cells[i].classList.add('ghost'); }
    const L = pzFullLines(trial);
    L.rows.forEach(rr => { for (let j = 0; j < PZ.N; j++) if (cur.b[rr * PZ.N + j]) pzUI.cells[rr * PZ.N + j].classList.add('will'); });
    L.cols.forEach(cc => { for (let j = 0; j < PZ.N; j++) if (cur.b[j * PZ.N + cc]) pzUI.cells[j * PZ.N + cc].classList.add('will'); });
  }
  function pzDragEnd(cancel) {
    const dg = pzUI.drag; if (!dg) return;
    pzUI.drag = null;
    const d = $('#pzDrag');
    pzUI.cells.forEach(el => el.classList.remove('ghost', 'will'));
    const cur = S.pz.cur;
    if (cancel || dg.at < 0 || !cur) {
      // 못 놓는 자리: 쟁반 자리로 날아 돌아가요
      const slotEl = $$('#pzTray .pz-slot')[dg.slot];
      if (!cancel && slotEl && !rt.reduced) {
        const sr = slotEl.getBoundingClientRect();
        d.classList.add('fly'); d.style.transition = '';
        dg.inner.style.transition = 'transform .22s'; dg.inner.style.transform = 'scale(.5)';
        d.style.transform = `translate(${sr.left + sr.width / 2 - dg.offX}px, ${sr.top + sr.height / 2 - dg.h * dg.cell / 2}px)`;
        setTimeout(() => { d.hidden = true; d.classList.remove('fly'); pzRenderTray(); const s2 = $$('#pzTray .pz-slot')[dg.slot]; if (s2) s2.classList.add('back'); }, 220);
        sfx('deny');
      } else { d.hidden = true; pzRenderTray(); }
      return;
    }
    d.hidden = true;
    const r = Math.floor(dg.at / PZ.N), c = dg.at % PZ.N;
    const res = pzPlace(cur, dg.slot, r, c);
    if (!res) { pzRenderTray(); return; }
    pzAfterPlace(res);
  }
  function pzAfterPlace(res) {
    const cur = S.pz.cur;
    pzRenderBoard();
    res.placed.forEach(i => pzUI.cells[i].classList.add('land'));
    setTimeout(() => res.placed.forEach(i => pzUI.cells[i].classList.remove('land')), 320);
    buzz(res.n > 0 ? [18, 30, 24] : 12);
    if (res.n > 0) {
      // 지운 칸은 놓은 자리에서 가까운 순서로 차례차례 터져요. 문양 줄은 더 크게 반짝여요
      const monoSet = new Set();
      res.lines.mono.forEach(m => { const i = +m.slice(1); for (let j = 0; j < PZ.N; j++) monoSet.add(m[0] === 'r' ? i * PZ.N + j : j * PZ.N + i); });
      const p0 = res.placed[Math.floor(res.placed.length / 2)], pr = Math.floor(p0 / PZ.N), pc = p0 % PZ.N;
      res.cleared.forEach(i => {
        const el = pzUI.cells[i], t = res.filledT[i];
        el.style.backgroundImage = pzCellImg(res.filled[i], t); el.dataset.v = '-1';
        if (t) { el.classList.add('tea'); if (pzTeaArt(t)) el.classList.add('ti'); el.style.setProperty('--tea', pzTeaStyle(t, res.filled[i]).slice(6)); }
        const dist = Math.abs(Math.floor(i / PZ.N) - pr) + Math.abs(i % PZ.N - pc);
        el.style.animationDelay = rt.reduced ? '0s' : (dist * 28) + 'ms';
        el.classList.add(monoSet.has(i) ? 'mono' : 'pop');
      });
      setTimeout(() => { res.cleared.forEach(i => { pzUI.cells[i].style.animationDelay = ''; }); pzRenderBoard(); }, rt.reduced ? 0 : 420 + 28 * 8);
      if (FXL.st === 'ok' && !FXO.st) fxoInit();
      if (fxoHost($('#pzPop'))) {   // 블록이 네 조각으로 깨져 떨어져요(문양 줄과 여러 줄이면 빛 고리)
        const rect = pzGridRect(); res.cleared.slice(0, 32).forEach(i => { const x = rect.ox + (i % PZ.N + 0.5) * rect.cell, y = rect.oy + (Math.floor(i / PZ.N) + 0.5) * rect.cellY, dist = Math.abs(Math.floor(i / PZ.N) - pr) + Math.abs(i % PZ.N - pc);
          fxoShatter(x, y, rect.cell, pzCellImg(res.filled[i], res.filledT[i]), 0, dist * 28 + 60); });
        if (res.lines.mono.length || res.n >= 2) { const m = res.cleared[Math.floor(res.cleared.length / 2)]; setTimeout(() => fxoBurst(rect.ox + (m % PZ.N + 0.5) * rect.cell, rect.oy + (Math.floor(m / PZ.N) + 0.5) * rect.cellY, rect.cell * 1.6, res.lines.mono.length ? 0xffd34d : 0xfff2b0, true), 140); }
      } else pzLeaves(res.cleared, res.lines.mono.length ? 'mono' : '');
      if (res.n >= 2 && !rt.reduced) { const b = $('#pzBoard'); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); }
      const mid = res.cleared[Math.floor(res.cleared.length / 2)];
      pzFx('+' + res.gain, res.lines.mono.length || res.n >= 2 ? 'big' : '', mid);
      if (cur.combo >= 2) setTimeout(() => pzFx(`콤보 ×${Math.min(4, 1 + 0.5 * (cur.combo - 1)).toFixed(1).replace('.0', '')}`, 'big'), 250);
      if (res.lines.mono.length) setTimeout(() => pzFx('문양 줄!', 'big'), 450);
      sfx(res.lines.mono.length ? 'quest' : 'pz' + Math.min(6, cur.combo + (res.n >= 2 ? 1 : 0)));
    } else { sfx('pz0'); pzFx('+' + res.gain, '', res.placed[0]); }
    // 선생님 블록이 든 줄을 지웠으면 도움을 받아요
    res.teas.forEach((x, i) => setTimeout(() => {
      pzFx(x.got ? `${PZ.teaName[x.t]} 선생님 도움!` : `${PZ.teaName[x.t]} 선생님 +${PZ.teaBonus}`, 'ess', x.i);
      if (x.got) sfx('done');
    }, 300 + i * 350));
    // 학생 부탁을 들어줬으면 숲의 정수를 바로 줘요
    res.asks.forEach((a, i) => {
      addEss(a.ess);
      setTimeout(() => {
        $('#pzAsk').classList.remove('done'); void $('#pzAsk').offsetWidth; $('#pzAsk').classList.add('done');
        pzFx(a.ess ? `${a.name} 고마워! 정수 +${a.ess}` : `${a.name} 고마워!`, 'ess');
        sfx('buy');
      }, 700 + i * 500);
    });
    pzRenderTray(); pzRenderTop(); pzRenderAsk(); pzRenderHelp();
    save();
    if (res.over) setTimeout(pzGameOver, rt.reduced ? 200 : 800);
  }
  function pzGameOver() {
    const cur = S.pz.cur; if (!cur) return;
    pzUI.mode = '';
    const r = pzFinish(cur);
    $('#pzEndTitle').textContent = r.rw ? '판이 끝났어요' : '연습이 끝났어요';
    $('#pzEndScore').textContent = fmt(r.score);
    $('#pzNewBest').hidden = !r.newBest;
    const items = [];
    if (r.ess > 0) items.push(`<li><span class="tic" style="background-image:${pzImg('ic_essence')}"></span>숲의 정수<b>+${r.ess}</b></li>`);
    if (r.askEss > 0) items.push(`<li><span class="tic" style="background-image:${pzImg('ic_essence')}"></span>학생 부탁 보상<b>+${r.askEss}</b></li>`);
    if (r.acorns > 0) items.push(`<li><span data-acorn>${acornIcon()}</span>도토리<b>+${fmt(r.acorns)}</b></li>`);
    if (r.xp > 0) items.push(`<li><span class="tic" style="background-image:${pzImg('ic_study')}"></span>수학 XP<b>+${r.xp}</b></li>`);   // 공부
    if (r.tk) items.push(`<li><span class="tic" style="background-image:${pzImg('ticket_m5')}"></span>5분 단축권<b>+${TK_REW.pz[1]}</b></li>`);
    $('#pzEndList').innerHTML = items.join('');
    const ea = $('#pzEndArt'), gotEss = r.ess > 0 || r.askEss > 0;   // 정수를 받았으면 정수 무더기 그림
    ea.hidden = !(gotEss && IMG('essence_pile')); if (!ea.hidden) ea.style.backgroundImage = pzImg('essence_pile');
    const left = pzLeft();
    let note = !r.rw ? `연습 판이라 보상은 없어요. 내일 다시 ${PZ.perDay}판을 받아요` : items.length ? '' : `${PZ.essPer}점부터 숲의 정수를, ${PZ.minPer}점부터 도토리를 받아요`;
    if (left > 0 && r.rw) note = (note + ` 오늘 보상 판이 ${left}번 남았어요`).trim();
    $('#pzEndNote').textContent = note;
    $('#pzEndAgain').textContent = left > 0 ? '다시 하기' : '연습으로 다시 하기';
    $('#pzEnd').hidden = false;
    sfx(r.newBest ? 'quest' : 'done');
    renderMini(); renderEss();
  }
  // 선생님 단추: 부엉이는 바로, 다람쥐와 곰은 칸이나 조각을 고르는 모드로
  function pzUseHelp(kind) {
    const cur = S.pz.cur; if (!cur) return;
    if (pzUI.mode === kind) { pzUI.mode = ''; pzRenderTray(); pzRenderHelp(); pzHint('도움을 다음으로 미뤘어요'); return; }
    if (!pzHasHelp(cur, kind)) { pzHint(`${PZ.teaName[kind]} 선생님 블록이 든 줄을 지우면 받아요`); return; }
    sfx('tap');
    if (kind === 'owl') { pzHelpOwl(cur); sfx('leaf'); buzz(12); pzHint(profText('부엉이 선생님이 조각을 바꿔 줬어요')); save(); pzRenderTray(); pzRenderHelp(); if (pzStuck(cur)) pzGameOver(); return; }
    pzUI.mode = kind;
    if (kind === 'squirrel') setTimeout(() => { if (pzUI.mode === 'squirrel') pzAim((PZ.N >> 1) * PZ.N + (PZ.N >> 1)); }, 0);   // 3×3 크기를 먼저 보여 줘요
    pzHint(kind === 'squirrel' ? '폭탄을 끌어서 터뜨릴 곳에 놓아요(손을 떼면 3×3이 터져요)' : '돌릴 조각을 눌러 주세요', 2500);
    pzRenderTray(); pzRenderHelp();
  }
  // 다람쥐 선생님 3×3 미리 보기(마우스를 가져가면 잘 보이게). i가 없으면 지워요
  function pzAim(i) {
    const g = $('#pzGrid'); if (!g || !pzUI.cells) return;
    const on = pzUI.mode === 'squirrel' && i != null && i >= 0;
    g.classList.toggle('sq-mode', pzUI.mode === 'squirrel');
    const r0 = on ? Math.floor(i / PZ.N) : -9, c0 = on ? i % PZ.N : -9;
    pzUI.cells.forEach((el, j) => { const r = Math.floor(j / PZ.N), c = j % PZ.N; el.classList.toggle('aim', on && Math.abs(r - r0) <= 1 && Math.abs(c - c0) <= 1); });
    pzUI.aimI = on ? i : -1;
    pzBombHold(on ? i : -1);
  }
  /* 폭탄을 손에 들고 끌어서 놓아요. 다람쥐 모드에서는 3×3 미리 보기 가운데에 폭탄이 떠 있고
     손가락(마우스)을 따라 움직여요. 손을 떼면 그 자리에서 부르르 떨다 터져요. 그림 pz_bomb(작업지시서 48)이 없으면 💣 */
  function pzBombEl() {
    let b = pzUI.holdEl;
    if (!b || !b.isConnected) {
      b = document.createElement('div'); b.className = 'pz-bomb hold';
      const u = IMG('pz_bomb'); b.innerHTML = u ? `<img src="${u}" alt="">` : '<span>💣</span>';
      document.body.appendChild(b); pzUI.holdEl = b;
    }
    return b;
  }
  function pzBombHold(i) {
    if (i < 0 || pzUI.mode !== 'squirrel' || !pzUI.open) { if (pzUI.holdEl && !pzUI.bombing) { pzUI.holdEl.remove(); pzUI.holdEl = null; } return; }
    const cell = pzUI.cells[i]; if (!cell) return;
    const r = cell.getBoundingClientRect(), w = r.width * 1.35, b = pzBombEl();
    b.style.cssText = `left:${r.left + r.width / 2 - w / 2}px;top:${r.top + r.height / 2 - w / 2}px;width:${w}px;height:${w}px`;
    const sp = b.querySelector('span'); if (sp) sp.style.fontSize = Math.round(w * 0.8) + 'px';
  }
  // 놓은 자리에서 폭탄이 부르르 떨다 '쾅'. 줄이기 설정이면 바로 지워요
  function pzBombDrop(i, then) {
    const cell = pzUI.cells[i]; if (rt.reduced || !cell || !document.body.animate) { if (pzUI.holdEl) { pzUI.holdEl.remove(); pzUI.holdEl = null; } then(); return; }
    const r = cell.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    pzBombHold(i);   // 놓은 칸 가운데로
    const b = pzBombEl();
    sfx('tap');
    b.animate([{ transform: 'scale(1) rotate(0)' }, { transform: 'scale(1.12) rotate(-8deg)' }, { transform: 'scale(1.18) rotate(8deg)' }, { transform: 'scale(1.26) rotate(-6deg)' }, { transform: 'scale(1.4) rotate(0)' }],
      { duration: 380, easing: 'ease-in' }).onfinish = () => {
      b.remove(); if (pzUI.holdEl === b) pzUI.holdEl = null;
      const mk = (key, em, sz) => { const d = document.createElement('div'); d.className = 'pz-bomb'; d.style.cssText = `left:${cx - sz / 2}px;top:${cy - sz / 2}px;width:${sz}px;height:${sz}px`;
        const u = IMG(key); d.innerHTML = u ? `<img src="${u}" alt="">` : `<span style="font-size:${Math.round(sz * 0.8)}px">${em}</span>`; document.body.appendChild(d); return d; };
      const boom = mk('pz_boom', '💥', r.width * 4.2), ring = document.createElement('div');
      ring.className = 'pz-ring'; ring.style.cssText = `left:${cx}px;top:${cy}px`; document.body.appendChild(ring);
      boom.animate([{ transform: 'scale(.3)', opacity: 1 }, { transform: 'scale(1.1)', opacity: 1, offset: 0.4 }, { transform: 'scale(1.3)', opacity: 0 }], { duration: 560, easing: 'ease-out' }).onfinish = () => boom.remove();
      ring.animate([{ transform: 'translate(-50%,-50%) scale(.2)', opacity: 0.9 }, { transform: 'translate(-50%,-50%) scale(3.2)', opacity: 0 }], { duration: 480, easing: 'ease-out' }).onfinish = () => ring.remove();
      const g = $('#pzGrid'); if (g) g.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-4px,2px)' }, { transform: 'translate(4px,-2px)' }, { transform: 'translate(-2px,1px)' }, { transform: 'translate(0,0)' }], { duration: 260 });
      sfx('coin'); buzz(30);
      then();
    };
  }
  function pzCellTap(i) {
    const cur = S.pz.cur; if (!cur || pzUI.mode !== 'squirrel' || pzUI.bombing) return;
    pzAim(null);
    pzUI.bombing = true;
    pzBombDrop(i, () => {
      pzUI.bombing = false;
      const gone = pzHelpSquirrel(cur, Math.floor(i / PZ.N), i % PZ.N);
      pzUI.mode = '';
      if (gone.length) { gone.forEach(j => { pzUI.cells[j].classList.add('sq'); pzUI.cells[j].dataset.v = '-1'; }); setTimeout(pzRenderBoard, rt.reduced ? 0 : 320); pzLeaves(gone, ''); sfx('leaf'); buzz(15); }
      pzHint('다람쥐 선생님의 폭탄으로 치웠어요');
      save(); pzRenderTray(); pzRenderHelp();
    });
  }
  function pzWire() {
    $('#acList').addEventListener('click', e => { const b = e.target.closest('[data-book]'); if (b) { sfx('tap'); openBook(b.dataset.book); return; } const row = e.target.closest('[data-ac]'); if (row) acTip(row.dataset.ac, row); });   // 과목을 누르면 얻는 곳 말풍선. 문제집 구매: 확인창부터
    $('#bkAll').addEventListener('click', () => { const k = rt.bookK; closeModal($('#mBook'), () => acBuyBookAll(k)); });
    $('#bkBuy').addEventListener('click', () => { if ($('#bkBuy').getAttribute('aria-disabled') === 'true') return; const k = rt.bookK; closeModal($('#mBook'), () => acBuyBook(k)); });
    $('#pzSwBtn').addEventListener('click', () => { sfx('tap'); openPzSw(); });   // 소탕
    $('#btSwBtn').addEventListener('click', () => { sfx('tap'); openBtSw(); });   // 대결 소탕
    $('#btSwGo').addEventListener('click', () => closeModal($('#mBtSw'), () => btSweep()));
    $('#pzSwOpts').addEventListener('click', e => { const b = e.target.closest('[data-sw]'); if (!b) return; rt.pzSwN = +b.dataset.sw; renderPzSw(); });
    $('#pzSwGo').addEventListener('click', () => { const n = rt.pzSwN || 1; closeModal($('#mPzSw'), () => pzSweep(n)); });
    $('#pzOpen').addEventListener('click', () => { sfx('tap'); if (liveOff('puzzle')) { toast('숲속 퍼즐은 잠시 점검 중이에요. 조금만 기다려 주세요'); return; } pzOpen(); });
    bind180();   // 숲속 합치기
    $('#pzAdBtn').addEventListener('click', () => {
      if (!pzCanAd()) return;
      showAd(() => { pzDay(); S.pz.adN += 1; save(); renderMini(); toast(`오늘 보상 판 ${PZ.adMore}번을 더 받았어요`); }, r => { if (r !== 'noad') toast('광고를 끝까지 보지 않아서 보상이 없어요'); });
    });
    $('#pzBack').addEventListener('click', () => { sfx('tap'); pzClose(); });
    $('#pzQuit').addEventListener('click', () => { if (!S.pz.cur || !$('#pzEnd').hidden || !$('#pzBoost').hidden) return; sfx('tap'); $('#pzQuitAsk').hidden = false; });
    $('#pzQuitNo').addEventListener('click', () => { $('#pzQuitAsk').hidden = true; });
    // 잠시 나가기: 판을 끝내지 않고 닫아요(하던 판은 S.pz.cur에 남아요). 미니게임 탭에서 '이어하기'로 돌아와요
    $('#pzQuitPause').addEventListener('click', () => { $('#pzQuitAsk').hidden = true; sfx('tap'); pzClose(); toast('하던 판은 그대로 남아요. 공부 탭의 숲속 퍼즐에서 이어서 해요'); });
    $('#pzQuitYes').addEventListener('click', () => { $('#pzQuitAsk').hidden = true; pzGameOver(); });
    $('#pzEndAgain').addEventListener('click', () => { sfx('tap'); $('#pzEnd').hidden = true; pzStart(); pzUI.mode = ''; pzRenderAll(); pzBoostOpen(); });
    $('#pzbList').addEventListener('click', e => {
      const b = e.target.closest('[data-pzb]'); if (!b) return;
      const id = b.dataset.pzb, pick = pzUI.pick || (pzUI.pick = new Set());
      if (pick.has(id)) pick.delete(id);
      else { const sum = [...pick].reduce((a, k) => a + pzbCost(k), 0) + pzbCost(id); if (S.ess < sum) { pzHint('숲의 정수가 모자라요'); return; } pick.add(id); }
      sfx('tap'); pzBoostRender();
    });
    $('#pzbSkip').addEventListener('click', () => { sfx('tap'); pzBoostGo(true); });
    $('#pzbGo').addEventListener('click', () => pzBoostGo(false));
    $('#pzEndOut').addEventListener('click', () => { sfx('tap'); $('#pzEnd').hidden = true; pzClose(); });
    $$('#pzHelps [data-help]').forEach(b => b.addEventListener('click', () => pzUseHelp(b.dataset.help)));
    // 다람쥐 선생님: 마우스를 올리거나 손가락을 대면 3×3을 미리 보여 줘요
    // 폭탄을 끌어서 놓기: 판 위를 누르면 폭탄을 집고, 끄는 동안 폭탄과 3×3이 따라오고, 손을 떼면 그 자리에서 터져요(판 밖에서 떼면 마지막 자리)
    const aimAt = e => { if (pzUI.mode !== 'squirrel' || pzUI.bombing) return; const el = document.elementFromPoint(e.clientX, e.clientY), c = el && el.closest && el.closest('#pzGrid .pz-cell'); if (c) pzAim(+c.dataset.i); };
    const grid = $('#pzGrid');
    grid.addEventListener('pointermove', aimAt);
    grid.addEventListener('pointerdown', e => { if (pzUI.mode !== 'squirrel' || pzUI.bombing) return; e.preventDefault(); pzUI.bombDrag = e.pointerId; try { grid.setPointerCapture(e.pointerId); } catch (er) { /* 괜찮아요 */ } aimAt(e); });
    grid.addEventListener('pointerup', e => { if (pzUI.bombDrag !== e.pointerId) return; pzUI.bombDrag = null; if (pzUI.mode === 'squirrel' && pzUI.aimI >= 0) pzCellTap(pzUI.aimI); });
    grid.addEventListener('pointercancel', () => { pzUI.bombDrag = null; });
    grid.addEventListener('click', e => { if (pzUI.mode === 'squirrel' && e.pointerType !== undefined && e.detail !== 0) return; const c = e.target.closest('.pz-cell'); if (c) pzCellTap(+c.dataset.i); });   // 키보드나 시험의 click()은 그대로
    const tray = $('#pzTray');
    tray.addEventListener('pointerdown', e => { const s = e.target.closest('.pz-slot'); if (!s || s.classList.contains('empty')) return; e.preventDefault(); pzDragStart(e, +s.dataset.slot); });
    const move = e => { if (pzUI.drag && e.pointerId === pzUI.drag.pid) { e.preventDefault(); pzDragMove(e); } };
    const up = e => { if (pzUI.drag && e.pointerId === pzUI.drag.pid) pzDragEnd(false); };
    document.addEventListener('pointermove', move, { passive: false });
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', () => pzDragEnd(true));
    window.addEventListener('resize', () => { if (pzUI.open) pzRenderTray(); });
  }
  // 미니게임 탭 카드: 오늘 남은 판, 최고 점수, 하던 판
  function renderMini() {
    if (!$('#pzLeftTxt')) return;
    pzDay();
    const left = pzLeft();
    renderEss();
    $('.pz-thumb').style.backgroundImage = ['acorn', 'leaf', 'berry', 'flower'].map(k => pzImg('pz_block_' + k)).join(',');   // 블록 넷을 2×2로(한 장을 꽉 채우면 잘려 보였어요)
    $('#pzCardSub').textContent = S.pz.cur ? `${S.pz.cur.rw ? '하던 판' : '연습 판'} 이어서 하기 (${fmt(S.pz.cur.score)}점)` : S.pz.best > 0 ? `최고 ${fmt(S.pz.best)}점` : '조각을 끌어다 놓고 줄을 지워요';
    $('#pzCardTag').textContent = S.pz.cur ? '이어하기' : '시작하기';
    const lt = $('#pzLeftTxt'); lt.textContent = `오늘 ${left}/${pzQuota()}판`; lt.classList.toggle('none', left <= 0);   // 오늘 남은 보상 판 / 오늘 받을 수 있는 판
    $('#pzAdBtn').hidden = !pzCanAd(); $('#pzAdRow').hidden = $('#pzAdBtn').hidden;
    { const on = pzSwOpen(), can = on && left > 0;   // 소탕 안내 줄
      $('#pzSwTx').textContent = !on ? '1판 하면 소탕 가능' : can ? '' : '';   // 카드 안 시작하기 아래(좁아서 짧게)
      $('#pzSwTx').hidden = on; $('#pzSwBtn').hidden = !can; $('#pzSwBtn').textContent = `소탕 ${left}판`;
      const show = !on || can; $('#pzSwRow').hidden = !show; $('#pzCardW').classList.toggle('sw-on', show); }
    renderAc();   // 공부
    renderStudy2();   // 국어, 과학 카드
    renderExRow();   // 시험 기간 줄
    renderNsRow();   // 야간 자율학습 줄
    renderBtCard();   // 숲속 대결 카드
    renderMiniMg();
  }

