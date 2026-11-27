  /* ---------- 탐험 원정: 숲 지도 위 칸 열두 개를 따라 올라가며 갈림길에서 셋 가운데 하나를 골라요 ----------
     프로젝트 문서 '탐험 업그레이드 제안서 (학교가 탐험대의 기지)' 2단계. 싸움은 탐험 전투(tamFight, tamStep)를 그대로 자동으로 겨뤄요.
     원정 동안 탐험대 체력은 이어지고(샘물로 채워요), 져도 그때까지 모은 것은 가져와요. 끝에서 큰 장난꾸러기를 달래면 그 지역 보물 하나.
     저장 S.tam.xp. 숫자는 모두 제안(TEX) */
  const TEX = {
    open: 10,
    tk: 3,
    plan: ['start', 'fight', 'fork', 'fight', 'fork', 'fight', 'fork', 'fight', 'fork', 'fight', 'fork', 'boss'],
    // 싸움 세기: 원정을 떠날 때 지금 탐험대가 넘을 수 있는 가장 높은 층(기준 층)에서 back층 아래부터 싸움마다 step층씩
    // 큰 장난꾸러기는 지금 이기는 가장 높은 큰 장난꾸러기 층을 bossBack층만큼 약하게, 상자 장난꾸러기는 기준 층 - chest
    back: 12, step: 2, bossBack: 4, chest: 8,
    // 보상: 싸움마다 탐험 보고서 fMin분치 재료와 수업료 acF분치 도토리, 큰 장난꾸러기는 bMin분치와 acB분치, 별 조각 star, 숲의 정수 ess
    fMin: 15, bMin: 45, acF: 1, acB: 5, star: 3, ess: 5,
    map: {
      ground: [[51.1, 92.8], [50.4, 86.3], [45.6, 75.7], [40.0, 68.2], [56.1, 59.7], [63.4, 51.8], [41.2, 44.0], [27.5, 36.3], [41.2, 28.5], [65.6, 20.7], [55.4, 12.9], [46.0, 5.1]],
      garden: [[50.4, 93.0], [49.8, 86.3], [41.9, 75.7], [39.7, 68.2], [54.8, 59.6], [63.6, 51.8], [41.2, 44.0], [26.7, 36.3], [40.2, 28.5], [66.7, 20.7], [55.2, 12.9], [46.3, 5.1]],
      pond: [[42.9, 91.7], [34.2, 84.0], [45.6, 76.4], [63.6, 68.8], [57.7, 61.1], [37.5, 53.5], [30.4, 45.8], [52.5, 38.2], [61.9, 30.5], [42.7, 22.9], [36.4, 15.3], [47.1, 7.6]],
      library: [[44.8, 91.7], [33.8, 84.0], [42.5, 76.4], [60.4, 68.8], [59.2, 61.1], [38.4, 53.5], [29.8, 45.8], [51.5, 38.2], [61.4, 30.5], [41.5, 22.9], [36.2, 15.3], [47.9, 7.6]],
      yard: [[53.7, 91.7], [55.4, 84.0], [35.4, 76.4], [38.8, 68.8], [60.6, 61.1], [56.1, 53.5], [34.6, 45.8], [30.2, 38.2], [48.9, 30.5], [60.0, 22.9], [40.4, 15.3], [41.7, 7.6]],
      tower: [[51.5, 91.7], [54.2, 84.0], [34.8, 76.4], [39.4, 68.8], [60.8, 61.1], [55.7, 53.5], [34.6, 45.8], [30.4, 38.2], [48.9, 30.5], [60.0, 22.9], [39.7, 15.3], [42.3, 7.6]],
      lab: [[46.3, 90.8], [52.5, 83.3], [57.9, 75.8], [47.5, 68.4], [28.3, 60.8], [46.3, 53.3], [60.6, 45.8], [50.6, 38.3], [33.3, 30.9], [45.2, 23.3], [67.5, 15.8], [55.9, 8.3]] },
    // 쉼터 빈 땅(다음 단계 쉼터 짓기에서 써요)
    camp: {
      ground: [[15.2, 68.2], [77.9, 41.9], [15.8, 20.6]], garden: [[16.2, 69.5], [79.2, 43.5], [18.9, 21.5]], pond: [[19.6, 73.2], [78.3, 50.7], [16.5, 21.9]],
      library: [[19.3, 73.0], [79.4, 49.2], [19.1, 23.3]], yard: [[17.1, 74.4], [79.2, 47.2], [17.3, 24.2]], tower: [[16.2, 73.0], [79.6, 48.8], [17.3, 22.8]], lab: [[18.8, 76.1], [80.9, 44.7], [18.9, 21.1]] },
    // 갈림길 사건. hp: 체력 되살림, atk: 남은 원정 힘, mx: 남은 원정 체력, ch: 다음 싸움 몇 번 힘 +50%, pk: 재료 꾸러미(싸움 한 번치) 몇 개, ac: 수업료 몇 분치
    ev: [
      { k: 'spring', nm: '반짝이는 샘물', hp: 0.4, mk: 'spring' },
      { k: 'shade', nm: '버섯 그늘 쉼터', hp: 0.25, pk: 0.5, mk: 'rest' },
      { k: 'flower', nm: '꽃밭 도시락', hp: 0.3, mk: 'rest' },
      { k: 'chest', nm: '수상한 리본 상자', box: 1, mk: 'chest' },
      { k: 'squirrel', nm: '다람쥐 가게', pk: 1, other: 1, mk: 'rest' },
      { k: 'firefly', nm: '반딧불 지름길', skip: 1, mk: 'rest' },
      { k: 'rainbow', nm: '무지개 다리', atk: 0.2, mk: 'rest' },
      { k: 'mapbit', nm: '나뭇가지 지도 조각', boss: 0.5, mk: 'chest' },
      { k: 'owl', nm: '부엉이 선생님', atk: 0.1, mx: 0.15, mk: 'rest' },
      { k: 'picnic', nm: '장난꾸러기 소풍', ac: 5, mk: 'rest' },
      { k: 'star', nm: '별똥별 소원', ch: 2, mk: 'rest' },
      { k: 'leafboat', nm: '나뭇잎 배', hp: 0.2, st: 1, mk: 'spring' }],
    tr: {
      ground: ['금빛 호루라기', '네잎클로버 책갈피', '낡은 가죽 축구공', '해바라기 씨앗 주머니', '무지개 운동회 리본'],
      garden: ['황금 물뿌리개', '왕버섯 우산', '무지개 당근', '꿀 단지', '텃밭 나무 이름표'],
      pond: ['진주 조개', '연잎 우산', '물방울 유리병', '은빛 물고기 장식', '안개 고래 비늘'],
      library: ['단풍잎 책갈피', '은빛 깃펜', '작은 지구본', '금 자물쇠 일기장', '별이 그려진 책 한 장'],
      yard: ['눈꽃 브로치', '털실 목도리', '작은 종', '고드름 수정', '눈사람 단추 셋'],
      tower: ['별 조각 램프', '작은 망원경', '달 모양 모래시계', '별자리 두루마리', '수정 용 비늘'],
      lab: ['무지개 플라스크', '톱니 탁상시계', '번개 구슬', '구름 솜 병', '꼬마 로봇 열쇠'] },
  };
  function freshTx() { return { d: '', n: 0, run: null, tr: [0, 0, 0, 0, 0, 0, 0], c: 0, w: 0 }; }
  function sanitizeTx(A) {
    const f = freshTx(), n = (v, lo, hi, def) => typeof v === 'number' && isFinite(v) ? Math.max(lo, Math.min(hi, Math.floor(v))) : def;
    if (!A || typeof A !== 'object') return f;
    f.d = typeof A.d === 'string' ? A.d.slice(0, 10) : ''; f.n = n(A.n, 0, 99, 0); f.c = n(A.c, 0, 1e7, 0); f.w = n(A.w, 0, 1e7, 0);
    if (Array.isArray(A.tr)) f.tr = f.tr.map((_, i) => n(A.tr[i], 0, 31, 0));
    const R = A.run;
    if (R && typeof R === 'object') {
      const r = {
        r: n(R.r, 0, TAM.reg.length - 1, 0), at: n(R.at, 0, TEX.plan.length - 1, 0), hp: n(R.hp, 0, 1000, 1000), atk: n(R.atk, 0, 5000, 0), mx: n(R.mx, 0, 5000, 0),
        ch: n(R.ch, 0, 9, 0), sk: R.sk ? 1 : 0, bb: n(R.bb, 0, 5000, 0), fe: n(R.fe, 1, 1e6, 1), fb: n(R.fb, TAM.bossEvery, 1e6, TAM.bossEvery), sd: n(R.sd, 1, 2147483646, 7), end: n(R.end, -1, 1, 0),
        evs: TEX.plan.map((_, i) => Array.isArray(R.evs) && Array.isArray(R.evs[i]) ? R.evs[i].slice(0, 3).map(v => n(v, 0, TEX.ev.length - 1, 0)) : []),
        pk: TEX.plan.map((_, i) => Array.isArray(R.pk) ? n(R.pk[i], -1, TEX.ev.length - 1, -1) : -1),
        got: { m: [0, 1, 2, 3].map(i => R.got && Array.isArray(R.got.m) ? n(R.got.m[i], 0, 1e12, 0) : 0), a: R.got ? n(R.got.a, 0, 1e15, 0) : 0, e: R.got ? n(R.got.e, 0, 999, 0) : 0, t: R.got ? n(R.got.t, -1, 4, -1) : -1 } };
      // 갈림길 사건 카드가 없으면 새로 뽑아요
      TEX.plan.forEach((k, i) => { if (k === 'fork' && r.evs[i].length !== 3) r.evs[i] = txDeal(r.sd + i * 31, i); });
      f.run = r;
    }
    return f;
  }
  const txOn = () => tamOn() && S.tam.best >= TEX.open;
  function txDay() { const t = gameToday(); if (S.tam.xp.d !== t) { S.tam.xp.d = t; S.tam.xp.n = 0; } }
  const txLeft = () => { txDay(); return Math.max(0, TEX.tk - S.tam.xp.n); };
  // 지금까지 가 본 지역(최고층이 지난 50층 묶음마다 하나씩)
  const txRegs = () => { const n = tamRegN(), k = Math.min(n, Math.floor(Math.max(0, S.tam.best - 1) / TAM.regLen) + 1); return TAM.reg.slice(0, n).filter((_, i) => i < k); };
  const txReg = i => TAM.reg[i] || TAM.reg[0];
  const txRnd = sd => { let x = sd % 2147483647 || 7; return () => (x = (x * 16807) % 2147483647) / 2147483647; };
  // 갈림길 카드 셋: 맨 뒤 갈림길(다음 칸이 큰 장난꾸러기)에는 지름길이 나오지 않아요
  function txDeal(sd, at) {
    const rnd = txRnd(sd), last = TEX.plan[at + 1] === 'boss', pool = TEX.ev.map((_, i) => i).filter(i => !(last && TEX.ev[i].skip));
    const out = []; while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    return out;
  }
  // 기준 층: 지금 탐험대가 체력을 다 채운 채로 이기는 가장 높은 층(fe, 큰 장난꾸러기 층은 빼고 재요)과 가장 높은 큰 장난꾸러기 층(fb). 최고층까지만
  function txRef() {
    const team = tamTeam(), best = Math.max(1, S.tam.best), win = f => tamSim(f, team, 7).win, one = f => f % TAM.bossEvery === 0 ? f - 1 : f;
    let lo = 1, hi = best;
    if (!win(1)) lo = hi = 1;
    while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); if (win(one(mid))) lo = mid; else hi = mid - 1; }
    let bl = 0, bh = Math.floor(best / TAM.bossEvery);
    while (bl < bh) { const mid = Math.ceil((bl + bh) / 2); if (win(mid * TAM.bossEvery)) bl = mid; else bh = mid - 1; }
    return { fe: one(lo), fb: Math.max(1, bl) * TAM.bossEvery };
  }
  function txStart(ri) {
    if (!txOn() || S.tam.xp.run) return false;
    if (txLeft() <= 0) return false;
    const regs = txRegs(), R = regs.includes(TAM.reg[ri]) ? ri : TAM.reg.indexOf(regs[regs.length - 1]);
    const sd = 1 + Math.floor(Math.random() * 2147483000);
    const ref = txRef(), run = { r: R, at: 0, hp: 1000, atk: 0, mx: 0, ch: 0, sk: 0, bb: 0, fe: ref.fe, fb: ref.fb, sd, end: 0, evs: TEX.plan.map(() => []), pk: TEX.plan.map(() => -1), got: { m: [0, 0, 0, 0], a: 0, e: 0, t: -1 } };
    TEX.plan.forEach((k, i) => { if (k === 'fork') run.evs[i] = txDeal(sd + i * 31, i); });
    S.tam.xp.n += 1; S.tam.xp.c += 1; S.tam.xp.run = run; save();
    return true;
  }
  // 재료 꾸러미: 탐험 보고서 min분치(그 지역 재료가 많이, 나머지는 조금, 별 조각)
  function txPack(min, mi) {
    const b = Math.max(1, S.tam.best), main = Math.floor(min * (0.3 + b / 200)), side = Math.floor(main / 4), star = Math.floor(min / 30 * (1 + b / 100));
    return [0, 1, 2, 3].map(i => i === 3 ? star : i === mi ? main : side);
  }
  const txAddM = (run, arr, mul) => { for (let i = 0; i < 4; i++) run.got.m[i] = Math.min(1e12, run.got.m[i] + Math.floor(arr[i] * (mul || 1))); };
  // 한 판 겨루기(자동). hp: 남은 체력 비율(0~1)을 들고 들어가 남은 비율을 돌려줘요
  function txFight(run, fl, boss, seed) {
    const atk = 1 + run.atk / 1000 + (run.ch > 0 ? TAM.cheer.mul - 1 : 0), mx = 1 + run.mx / 1000;
    const team = tamTeam().map(s => ({ ...s, atk: s.atk * atk, hp: s.hp * mx }));
    const F = tamFight(Math.max(1, fl), team);
    if (boss) {
      const B = Math.max(TAM.bossEvery, Math.floor(fl / TAM.bossEvery) * TAM.bossEvery), sc = Math.pow(TAM.g, -TEX.bossBack);
      F.M = tamMobs(B).map((m, k) => ({ ...m, hp: m.hp * sc, mx: m.hp * sc, atk: m.atk * sc, c: (1 + k * 0.4) * TAM.pace, wk: 0 }));
    }
    F.P.forEach(p => { p.hp = p.mx * run.hp / 1000; });
    const rnd = txRnd(seed); let r = 0;
    while (!r) { r = tamStep(F, 0.1, true, rnd); F.ev.length = 0; }
    if (run.ch > 0) run.ch -= 1;
    const all = F.P.reduce((s, p) => s + p.mx, 0), left = F.P.reduce((s, p) => s + Math.max(0, p.hp), 0);
    run.hp = r === 1 ? Math.max(1, Math.round(left / Math.max(1e-9, all) * 1000)) : 0;
    return r === 1;
  }
  const txFightFl = (run, at) => Math.max(1, run.fe - TEX.back + TEX.step * TEX.plan.slice(0, at).filter(k => k === 'fight').length);
  // 한 칸 앞으로. 싸움 칸은 바로 겨루고, 갈림길이면 카드를 기다려요
  function txStep() {
    const run = S.tam.xp.run; if (!run || run.end) return null;
    if (TEX.plan[run.at] === 'fork' && run.pk[run.at] < 0) return null;
    run.at = Math.min(TEX.plan.length - 1, run.at + 1);
    const k = TEX.plan[run.at], R = txReg(run.r);
    let out = { k };
    if (k === 'fight') {
      if (run.sk) { run.sk = 0; out.skip = 1; }
      else {
        const win = txFight(run, txFightFl(run, run.at), false, run.sd + run.at * 101);
        out.win = win; out.nm = R.mob[run.at % 3];
        if (win) { txAddM(run, txPack(TEX.fMin, R.mat)); run.got.a += minAcorns(TEX.acF); }
        else run.end = -1;
      }
    } else if (k === 'boss') {
      const win = txFight(run, run.fb, true, run.sd + 977);
      out.win = win; out.nm = R.boss;
      if (win) {
        txAddM(run, txPack(TEX.bMin, R.mat), 1 + run.bb / 1000); run.got.m[3] += TEX.star; run.got.a += minAcorns(TEX.acB); run.got.e += TEX.ess;
        const own = S.tam.xp.tr[run.r] || 0, miss = [0, 1, 2, 3, 4].filter(i => !(own >> i & 1));
        if (miss.length) run.got.t = miss[Math.floor(txRnd(run.sd + 5)() * miss.length)];
        else run.got.m[3] += TEX.star;
        run.end = 1;
      } else run.end = -1;
    }
    save();
    return out;
  }
  // 갈림길에서 카드 하나 고르기
  function txPick(j) {
    const run = S.tam.xp.run; if (!run || run.end || TEX.plan[run.at] !== 'fork' || run.pk[run.at] >= 0) return null;
    const ei = run.evs[run.at][j]; if (ei === undefined) return null;
    const E = TEX.ev[ei], R = txReg(run.r), out = { k: E.k, nm: E.nm, tx: txEvTx(E) };
    run.pk[run.at] = ei;
    if (E.hp) run.hp = Math.min(1000, run.hp + Math.round(E.hp * 1000));
    if (E.atk) run.atk += Math.round(E.atk * 1000);
    if (E.mx) run.mx += Math.round(E.mx * 1000);
    if (E.ch) run.ch += E.ch;
    if (E.skip) run.sk = 1;
    if (E.boss) run.bb += Math.round(E.boss * 1000);
    if (E.ac) run.got.a += minAcorns(E.ac);
    if (E.st) run.got.m[3] += E.st;
    if (E.pk) { const mi = E.other ? [0, 1, 2].filter(i => i !== R.mat)[Math.floor(txRnd(run.sd + run.at)() * 2)] : R.mat; const p = txPack(TEX.fMin, R.mat); if (E.other) { p[mi] = p[R.mat]; p[R.mat] = 0; } txAddM(run, p, E.pk); }
    if (E.box) {
      // 반은 재료 꾸러미 두 개, 반은 장난꾸러기가 튀어나와요(이기면 꾸러미 두 개, 지면 원정 끝)
      if (txRnd(run.sd + run.at * 7)() < 0.5) { txAddM(run, txPack(TEX.fMin, R.mat), 2); out.box = 'gift'; }
      else { const win = txFight(run, run.fe - TEX.chest, false, run.sd + run.at * 103); out.box = win ? 'win' : 'lose'; if (win) txAddM(run, txPack(TEX.fMin, R.mat), 2); else run.end = -1; }
    }
    save();
    return out;
  }
  // 원정을 마치고 모은 것을 받아요(도중에 돌아와도 같아요)
  function txTake() {
    const X = S.tam.xp, run = X.run; if (!run) return null;
    for (let i = 0; i < 4; i++) S.tam.mat[i] = Math.min(1e12, S.tam.mat[i] + run.got.m[i]);
    if (run.got.a) { S.budget += run.got.a; earn(run.got.a); }
    if (run.got.e) addEss(run.got.e);
    if (run.got.t >= 0) X.tr[run.r] = (X.tr[run.r] || 0) | (1 << run.got.t);
    if (run.end === 1) X.w += 1;
    const got = run.got, r = run.r; X.run = null; save();
    return { got, r };
  }
  function txQuit() { const run = S.tam.xp.run; if (!run || run.end) return; run.end = -1; save(); }
  const txTrN = ri => { let v = S.tam.xp.tr[ri] || 0, c = 0; while (v) { c += v & 1; v >>= 1; } return c; };
  // 원정 칸 그림: 지나온 싸움은 꽃 도장, 고른 갈림길은 그 사건 표시
  function txNodePic(run, i) {
    const k = TEX.plan[i];
    if (run && i < run.at && k === 'fork' && run.pk[i] >= 0) return IMG('ex7_node_' + TEX.ev[run.pk[i]].mk);
    if (run && (i < run.at || (i === run.at && k !== 'fork' && i > 0))) return IMG('ex7_node_done');
    return IMG('ex7_node_' + k);
  }
  const txGotTx = g => [...[0, 1, 2, 3].filter(i => g.m[i] > 0).map(i => `${tamMatIc(i, 18)}${fmt(g.m[i])}`), g.a ? `${acornIcon()}${fmt(g.a)}` : '', g.e ? `숲의 정수 ${g.e}` : ''].filter(Boolean).join('<span class="tx-sep"></span>');
  function txEvTx(E) {
    const pc = v => Math.round(v * 100);
    return [E.hp ? `체력 +${pc(E.hp)}%` : '', E.atk ? `남은 원정 힘 +${pc(E.atk)}%` : '', E.mx ? `체력 한도 +${pc(E.mx)}%` : '', E.ch ? `다음 싸움 ${E.ch}번 힘 +${pc(TAM.cheer.mul - 1)}%` : '',
      E.pk && E.other ? '다른 재료 꾸러미' : E.pk ? `재료 꾸러미${E.pk < 1 ? ' 조금' : ''}` : '', E.box ? '재료 꾸러미 둘, 아니면 장난꾸러기' : '', E.skip ? '다음 싸움을 건너뛰어요' : '',
      E.boss ? `큰 장난꾸러기 재료 +${pc(E.boss)}%` : '', E.ac ? `도토리(수업료 ${E.ac}분치)` : '', E.st ? `별 조각 +${E.st}` : ''].filter(Boolean).join(', ');
  }
  // 원정 화면(탐험 화면 위를 통째로 덮어요): 위 줄, 지도(위아래로 넘겨 봐요), 아래 판
  const txSel = () => { const regs = txRegs(); return regs.includes(TAM.reg[rt.txReg]) ? rt.txReg : TAM.reg.indexOf(regs[regs.length - 1]); };
  function txTrRow(ri) {
    const R = txReg(ri), own = S.tam.xp.tr[ri] || 0;
    return `<div class="tx-tr" aria-label="${esc(R.nm)} 보물 ${txTrN(ri)}개"><b>보물<em>${txTrN(ri)}/5</em></b>${[0, 1, 2, 3, 4].map(i => { const u = IMG(`ex7_tr_${R.k}_${i + 1}`), on = own >> i & 1; return `<span class="${on ? 'on' : ''}" title="${on ? esc(TEX.tr[R.k][i]) : '아직 못 찾은 보물'}">${u ? `<img src="${u}" alt="${on ? esc(TEX.tr[R.k][i]) : ''}">` : ''}</span>`; }).join('')}</div>`;
  }
  // 아래 판 글(시험도 이 글을 봐요)
  function txRender() {
    if (!txOn()) return `<p class="tx-lock">원정은 ${TEX.open}층 큰 장난꾸러기를 달래면 열려요</p><button type="button" class="cta tx-wide" data-txx="1">탐험으로 돌아가기</button>`;
    const run = S.tam.xp.run;
    if (!run) {
      const regs = txRegs(), sel = txSel(), left = txLeft(), tic = IMG('ex7_ic_ticket');
      return `<div class="tx-regs" role="group" aria-label="원정 지역">${regs.map(R => { const i = TAM.reg.indexOf(R); return `<button type="button" data-txreg="${i}" aria-pressed="${i === sel}">${esc(R.nm)}<em>${txTrN(i)}/5</em></button>`; }).join('')}</div>` +
        txTrRow(sel) +
        `<button type="button" class="cta tx-wide tx-go" data-txgo="${sel}"${left ? '' : ' aria-disabled="true"'}>${tic ? `<img src="${tic}" alt="">` : ''}<span>${left ? '원정 떠나기' : '내일 다시 떠나요'}</span></button>` +
        `<p class="tx-note">갈림길에서 셋 가운데 하나를 골라요. 져도 모은 것은 가져와요</p>`;
    }
    const R = txReg(run.r), k = TEX.plan[run.at], hp = run.hp / 10;
    let h = `<div class="tx-st"><span class="tx-hp" aria-label="탐험대 체력 ${Math.round(hp)}%"><i style="width:${hp}%"></i></span><em>체력 ${Math.round(hp)}%</em></div>`;
    const bf = [run.atk ? `힘 +${Math.round(run.atk / 10)}%` : '', run.mx ? `체력 한도 +${Math.round(run.mx / 10)}%` : '', run.ch ? `응원 ${run.ch}번` : '', run.sk ? '지름길' : '', run.bb ? `큰 장난꾸러기 재료 +${Math.round(run.bb / 10)}%` : ''].filter(Boolean);
    if (bf.length) h += `<p class="tx-bf">${bf.map(esc).join(', ')}</p>`;
    h += `<p class="tx-got"><small>모은 것</small>${txGotTx(run.got) || '아직 없어요'}</p>`;
    if (run.end) {
      const t = run.got.t, tu = t >= 0 && IMG(`ex7_tr_${R.k}_${t + 1}`);
      h += `<div class="tx-end${run.end > 0 ? ' win' : ''}"><b>${run.end > 0 ? '원정 성공!' : `${run.at}번째 칸까지 왔어요`}</b>` +
        (t >= 0 ? `<span class="tx-trnew">${tu ? `<img src="${tu}" alt="">` : ''}새 보물 ${esc(TEX.tr[R.k][t])}</span>` : '') +
        `<button type="button" class="cta tx-wide" data-txtake="1">모은 것 받기</button></div>`;
    } else if (k === 'fork' && run.pk[run.at] < 0) {
      h += `<p class="tx-q">갈림길이에요. 하나를 골라요</p><div class="tx-cards">${run.evs[run.at].map((ei, j) => { const E = TEX.ev[ei], u = IMG('ex7_ev_' + E.k); return `<button type="button" class="tx-card" data-txpick="${j}">${u ? `<img src="${u}" alt="">` : ''}<b>${esc(E.nm)}</b><small>${esc(txEvTx(E))}</small></button>`; }).join('')}</div>`;
    } else {
      const nx = TEX.plan[run.at + 1], lab = nx === 'boss' ? `${R.boss} 달래기` : nx === 'fork' ? '갈림길로 가기' : run.sk ? '지름길로 지나가기' : '장난꾸러기 달래기';
      h += `<div class="tx-acts"><button type="button" class="cta" data-txstep="1">${esc(lab)}</button><button type="button" class="btn-sub small" data-txquit="1">돌아오기</button></div>`;
    }
    return h;
  }
  function txTop() {
    const run = S.tam.xp.run, R = txReg(run ? run.r : txOn() ? txSel() : 0), tic = IMG('ex7_ic_ticket'), on = txOn();
    return `<button type="button" class="tm-rb tm-back" data-txx="1" aria-label="탐험으로 돌아가기"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4.5 7.5 12l7.5 7.5"/></svg></button>` +
      `<div class="tx-ttl"><small>숲속 원정</small><b>${esc(R.nm)}</b></div>` +
      (on ? `<div class="tx-tk" aria-label="원정권 ${txLeft()}장 남음">${tic ? `<img src="${tic}" alt="">` : ''}<b>${txLeft()}</b><small>/${TEX.tk}</small></div>` : '<span></span>');
  }
  // 지도: 지역이 바뀔 때만 새로 깔고, 칸 그림과 대원 자리만 바꿔요(대원은 길을 따라 옮겨 가요)
  function txMapDraw(ri) {
    const m = $('#txMap'), w = $('#txMapW'); if (!m || !w) return;
    const R = txReg(ri), P = TEX.map[R.k], run = S.tam.xp.run && S.tam.xp.run.r === ri ? S.tam.xp.run : null;
    if (m.dataset.r !== R.k) {
      m.dataset.r = R.k; const bg = IMG('ex7_map_' + R.k); m.style.backgroundImage = bg ? `url("${bg}")` : '';
      m.setAttribute('aria-label', `${R.nm} 원정 지도`);
      setH(m, P.map(([x, y], i) => `<i class="tx-n${TEX.plan[i] === 'boss' ? ' boss' : ''}" style="left:${x}%;top:${y}%"><img alt=""></i>`).join('') + '<img class="tx-me" alt="">');
      w.scrollTop = w.scrollHeight;
    }
    // 지도가 화면 높이를 다 채우게(가로가 조금 넘치면 가운데만 보여요. 칸은 가운데 70% 안에 있어요)
    { const W = w.clientWidth, H = w.clientHeight - (parseFloat(getComputedStyle(w).paddingTop) || 0), mw = Math.round(Math.min(Math.max(W, H / 1.5), W * 1.25)); m.style.width = mw + 'px'; m.style.marginLeft = Math.round((W - mw) / 2) + 'px'; }
    const at = run ? run.at : 0, ns = $$('.tx-n', m);
    ns.forEach((n, i) => { const u = txNodePic(run, i) || ''; const im = n.querySelector('img'); if (im.getAttribute('src') !== u) im.src = u; n.classList.toggle('cur', !!run && i === at); n.classList.toggle('past', !!run && i < at); });
    const me = $('.tx-me', m), lead = tamParty()[0], face = lead ? tamPcPic(lead) : '';
    if (face && me.getAttribute('src') !== face) me.src = face;
    me.hidden = !face; me.style.left = P[at][0] + '%'; me.style.top = P[at][1] + '%';
    // 지금 칸이 화면 가운데쯤 오게 넘겨요
    const y = m.offsetTop + m.offsetHeight * P[at][1] / 100 - w.clientHeight * 0.55;
    if (typeof w.scrollTo === 'function') w.scrollTo({ top: Math.max(0, y), behavior: rt.reduced || w._first ? 'auto' : 'smooth' }); else w.scrollTop = Math.max(0, y);
    w._first = false;
  }
  function txDraw() {
    const box = $('#txFull'); if (!box || box.hidden || !tamOn()) return;
    setH($('#txTop'), txTop());
    setH($('#txPan'), txRender());
    const run = S.tam.xp.run;
    box.classList.toggle('run', !!run); box.classList.toggle('lock', !txOn());
    txMapDraw(run ? run.r : txOn() ? txSel() : 0);
  }
  window.addEventListener('resize', () => { const b = $('#txFull'); if (b && !b.hidden) txMapDraw(S.tam.xp.run ? S.tam.xp.run.r : txSel()); });
  function txOpen() {
    const box = $('#txFull'); if (!box) return;
    box.hidden = false; const w = $('#txMapW'); if (w) w._first = true;
    txDraw(); tamTabsDot();
  }
  function txClose() { const box = $('#txFull'); if (box) box.hidden = true; tamTabsDot(); }
  function txMsg(tx) {
    const m = $('#txMsg'); if (!m) return;
    m.textContent = tx; m.hidden = false; m.style.animation = 'none'; void m.offsetWidth; m.style.animation = '';
    clearTimeout(m._t); m._t = setTimeout(() => { m.hidden = true; }, 2600);
  }
  function txClick(b) {
    if (b.dataset.txx) { sfx('tap'); txClose(); tamRenderBody(); return true; }
    if (b.dataset.txreg) { rt.txReg = +b.dataset.txreg; sfx('tap'); txDraw(); return true; }
    if (b.dataset.txgo) {
      if (txLeft() <= 0) { txMsg('오늘 원정권을 다 썼어요\n내일 다시 떠나요'); return true; }
      if (!txStart(+b.dataset.txgo)) return true;
      sfx('coin'); txMsg(`${txReg(S.tam.xp.run.r).nm} 원정을 떠나요!`); txDraw(); tamTabsDot(); return true;
    }
    if (b.dataset.txpick) {
      const o = txPick(+b.dataset.txpick); if (!o) return true; sfx('tap');
      txMsg(o.box === 'gift' ? '상자 안에 재료가 가득!' : o.box === 'win' ? '상자에서 장난꾸러기가 튀어나왔지만 달래 줬어요' : o.box === 'lose' ? '상자에서 튀어나온 장난꾸러기에게 졌어요' : `${o.nm}\n${o.tx}`);
      txDraw(); return true;
    }
    if (b.dataset.txstep) {
      const o = txStep(); if (!o) return true;
      if (o.k !== 'fork') { sfx(o.win === false ? 'tap' : 'coin'); txMsg(o.skip ? '반딧불을 따라 지름길로 지나왔어요' : o.win ? `${eul(o.nm)} 달래 줬어요` : `${o.nm}에게 졌어요\n모은 것은 가져가요`); }
      else sfx('tap');
      txDraw(); tamTabsDot(); return true;
    }
    if (b.dataset.txquit) { txQuit(); sfx('tap'); txDraw(); return true; }
    if (b.dataset.txtake) {
      const o = txTake(); if (!o) return true; sfx('coin'); renderHUD(); tamRenderTop();
      txMsg(o.got.t >= 0 ? `새 보물을 찾았어요!\n${TEX.tr[txReg(o.r).k][o.got.t]}` : '원정에서 모은 것을 받았어요');
      txDraw(); tamTabsDot(); return true;
    }
    return false;
  }
  // 아래 메뉴 원정 빨간 점: 오늘 아직 안 떠났거나, 끝난 원정을 받지 않았을 때
  const txDot = () => txOn() && ((!S.tam.xp.run && txLeft() >= TEX.tk) || !!(S.tam.xp.run && S.tam.xp.run.end));
  function tamTabsDot() { const b = $('#tmNav [data-tnav="exp"]'); if (b) b.classList.toggle('dot', txDot()); }
