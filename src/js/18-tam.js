  /* ---------- 4.3.0 숲속 탐험대 (프로젝트 문서 '4.3.0 설계안 (숲속 탐험대) 초안', woodani 결정 2026-11-14) ----------
     밤마다 학교 곳곳에 숲의 장난꾸러기들이 와요. 학생 동물 대원이 1층, 2층… 끝없이 탐험해요. 숫자는 모두 본부 제안(dev/tamsim.py로 재요).
     이름: 시험 기간이 EX를 써서 탐험은 TAM, 저장 S.tam. 다른 곳에서 먼저 불려도 멈추지 않게 var */
  var TAM = {
    reg: [
      { k: 'ground', nm: '들꽃 운동장', mob: ['솜털 민들레 요정', '데굴데굴 공 꼬마', '떼쓰는 무당벌레'], boss: '토라진 큰 해바라기', mat: 0 },
      { k: 'garden', nm: '버섯 텃밭', mob: ['잠꾸러기 버섯', '끈적끈적 달팽이', '퐁퐁 포자 방울'], boss: '하품하는 왕버섯', mat: 2 },
      { k: 'pond', nm: '안개 연못', mob: ['장난꾸러기 물방울', '안개 솜사탕 요정', '연잎 정령'], boss: '안개 구름 고래', mat: 1 },
      { k: 'library', nm: '단풍 도서관', mob: ['종이비행기 꼬마', '먼지 솜뭉치', '책갈피 나비'], boss: '잠꼬대하는 큰 책', mat: 0 },
      { k: 'yard', nm: '눈 내린 뒤뜰', mob: ['눈뭉치 꼬마', '고드름 요정', '얼음 반딧불'], boss: '눈보라 눈사람 대장', mat: 1 },
      { k: 'tower', nm: '별빛 천문대', mob: ['반짝 수정 꼬마', '그림자 솜뭉치', '졸린 박쥐'], boss: '수정 꼬마 용', mat: 3 },
      { k: 'lab', nm: '구름 실험실', mob: ['번쩍 전구 꼬마', '톱니 굴렁쇠', '보글보글 플라스크'], boss: '꾸벅꾸벅 구름 로봇', mat: 2 }],   // 대학원에서만 끼는 일곱째 지역(작업지시서 86)
    regLen: 50, bossEvery: 10, limit: 30,
    // 지역마다 유리한 과목(힘과 체력 +30%), 모든 대원 레벨이 탐험대 전체에 주는 보유 효과(레벨 1마다 +0.3%). 숫자는 제안
    adv: { ground: 1, garden: 3, pond: 0, library: 2, yard: 4, tower: 0, lab: 4 }, advG: 0.3, collG: 0.003, collMax: 3,
    mHp: 20, mAtk: 2.2, mobN: [2.4, 1.4, 1],   // 한 층에 1, 2, 3마리일 때 한 마리의 힘 배수
    g: 1.07, bossHp: 7, bossAtk: 1.7, mobCd: 1.6,
    // 역할(능력 번호 0 과학, 1 체육, 2 국어, 3 미술, 4 수학)
    role: [{ k: 'sci', nm: '과학 실험', hp: 0.9, atk: 0.85, cd: 1.4 }, { k: 'pe', nm: '체육 돌격', hp: 1.7, atk: 0.9, cd: 1.1 },
      { k: 'kor', nm: '국어 응원', hp: 1.1, atk: 0.7, cd: 1.3 }, { k: 'art', nm: '미술 물감', hp: 1.0, atk: 0.75, cd: 1.2 },
      { k: 'math', nm: '수학 별 화살', hp: 0.85, atk: 1.2, cd: 1.3 }],
    front: [2, 0, 4, 1, 3],   // 앞줄 차례: 체육, 미술, 과학, 수학, 국어
    pHp: 40, pAtk: 7, lvG: 1.1, starG: 0.12, acG: 0.01, gauge: 10,
    lvMin: 2, lvCost: 1.13, lvUp: 1.18,   // 레벨 올리기: 수업료 lvMin분치 × lvCost^(레벨-1)
    star: [0, 5, 15, 35, 75], starTier: 1,   // ★2부터 별 조각, 초등학교부터
    gear: [{ k: 'tool', nm: '탐험 도구', mat: 0, ic: '🪄', hint: '대원 힘' }, { k: 'bag', nm: '가방', mat: 1, ic: '🎒', hint: '대원 체력' }, { k: 'hat', nm: '모자', mat: 2, ic: '🎩', hint: '필살기 게이지' }],
    gearPer: 0.08,   // 장비는 대원 칸마다(그 칸에 선 대원이 받아요). 한 칸 Lv마다 8%(제안)
    slotNm: ['맨 앞', '앞', '가운데', '뒤', '맨 뒤'],
    mats: ['반짝 나뭇가지', '빛나는 조약돌', '무지개 꽃잎', '별 조각'], matIc: ['🪵', '🪨', '🌸', '⭐'],
    idleMax: 12 * 3600, idleMin: 600,
    adSpd: { n: 3, min: 10, max: 30 },   // 광고 한 번에 2배속 10분(게임을 켜 둔 동안만 줄어요), 이어 붙여 30분까지, 하루 세 번
    adRep: 1,   // 고침: 이 값이 주석 안에 들어가 있어서 보고서 두 배 광고가 하루 한 번으로 막히지 않았어요
    cheer: { n: 3, fl: 5, mul: 1.5 },   // 📺 응원 받기 = 다음 5층 동안 대원 힘과 체력 +50%, 하루 세 번
    // 겨루기 속도와 한 층의 흐름(걷기, 만남, 이김, 사건, 오르기, 짐). 초 단위, 2배속이면 모두 반으로
    pace: 1.7, ph: { walk: 2.6, meet: 1.1, win: 1.5, climb: 1.3, lose: 3.6, ev: 8 }, evP: 0.3,
    mobPh: ['chr_mouse', 'chr_crow', 'chr_goose', 'chr_sheep', 'chr_goat', 'chr_beaver', 'chr_mouse'], bossPh: 'chr_boar',
    // 심화 탐험(하드모드). 그 학기 상한을 넘으면 열려요. 1층 힘은 상한 층의 hG배, 층마다 hG배(일반은 g). 도토리 대신 재료와 별 조각(숫자는 제안)
    hG: 1.1, hMat: 1.5,
    // 필살기 세 박자. 모으기, 컷인, 큰 움직임(ms). '연출 건너뛰기'를 켜 두면 모으기와 컷인 없이 바로 큰 움직임
    skCharge: 300, skCut: 900, skTail: 150, skFx: 0.75,   // 모으기 0.3초, 컷인 0.9초, 큰 움직임은 0.75배 빠르게, 끝난 뒤 바로 이어서
  };
  function freshTam() { return { best: 0, party: ['bear', 'rabbit', 'fox'], mem: {}, gear: { tool: 0, bag: 0, hat: 0 }, sg: [0, 1, 2, 3, 4].map(() => ({ tool: 0, bag: 0, hat: 0 })), mat: [0, 0, 0, 0], it: 0, auto: 0, ad: { day: '', spd: 0, rep: 0, rv: 0, ch: 0 }, cheer: 0, spd: { sec: 0 }, wk: { w: -1, best: 0 }, seen: 0, hm: 0, hb: 0, hc: 0, hw: { w: -1, best: 0 }, skSeen: 0, skOff: 0, ed: '' }; }
  function sanitizeTam(d, s) {
    const A = d && d.tam && typeof d.tam === 'object' ? d.tam : {}, f = freshTam(), n = (v, lo, hi, def) => typeof v === 'number' && isFinite(v) ? Math.max(lo, Math.min(hi, Math.floor(v))) : def;
    f.best = n(A.best, 0, 1e6, 0);
    if (A.mem && typeof A.mem === 'object') for (const k of Object.keys(A.mem).slice(0, 60)) { const m = A.mem[k]; if (typeof k === 'string' && /^[a-z]{2,16}$/.test(k) && m && typeof m === 'object') f.mem[k] = { lv: n(m.lv, 1, 1e5, 1), st: n(m.st, 1, 5, 1), sh: n(m.sh, 0, 1e6, 0) }; }
    if (Array.isArray(A.party)) { const p = A.party.filter(k => typeof k === 'string' && /^[a-z]{2,16}$/.test(k)).slice(0, 5); if (p.length) f.party = [...new Set(p)]; }
    if (A.gear && typeof A.gear === 'object') for (const k of ['tool', 'bag', 'hat']) f.gear[k] = n(A.gear[k], 0, 1e5, 0);
    // 칸 장비(sg). 옛 저장(탐험대 전체 장비 gear)만 있으면 다섯 칸에 그대로 나눠 줘요
    for (let i = 0; i < 5; i++) { const g = Array.isArray(A.sg) && A.sg[i] && typeof A.sg[i] === 'object' ? A.sg[i] : f.gear; for (const k of ['tool', 'bag', 'hat']) f.sg[i][k] = n(g[k], 0, 1e5, 0); }
    if (Array.isArray(A.mat)) f.mat = [0, 1, 2, 3].map(i => n(A.mat[i], 0, 1e12, 0));
    f.it = n(A.it, 0, 4e12, 0); f.auto = A.auto ? 1 : 0; f.seen = A.seen ? 1 : 0;
    if (A.ad && typeof A.ad === 'object') f.ad = { day: typeof A.ad.day === 'string' ? A.ad.day.slice(0, 10) : '', spd: n(A.ad.spd, 0, 99, 0), rep: n(A.ad.rep, 0, 99, 0), rv: n(A.ad.rv, 0, 1e6, 0), ch: n(A.ad.ch, 0, 99, 0) };
    f.cheer = n(A.cheer, 0, 99, 0);   // 응원이 남은 층
    if (A.spd && typeof A.spd === 'object') f.spd = { sec: n(A.spd.sec, 0, TAM.adSpd.max * 60, 0) };   // 옛 시험판의 층 단위 2배속(fl, until)은 받지 않아요
    if (A.wk && typeof A.wk === 'object') f.wk = { w: n(A.wk.w, -1, 1e7, -1), best: n(A.wk.best, 0, 1e6, 0) };
    // 심화 탐험(hm 켬, hb 가장 높은 심화 층, hc 그 기록의 기준 상한, hw 이번 주 심화 층), 필살기 컷인을 본 과목(skSeen 비트)
    f.hm = A.hm ? 1 : 0; f.hb = n(A.hb, 0, 1e6, 0); f.hc = n(A.hc, 0, 1e7, 0); f.skSeen = n(A.skSeen, 0, 31, 0); f.skOff = A.skOff ? 1 : 0; f.ed = typeof A.ed === 'string' ? A.ed.slice(0, 10) : '';   // 입장 장면을 본 날
    if (A.hw && typeof A.hw === 'object') f.hw = { w: n(A.hw.w, -1, 1e7, -1), best: n(A.hw.best, 0, 1e6, 0) };
    s.tam = f;
  }
  const tamOn = () => !!S && !!S.tam;
  const tamRegN = () => gradOn() ? TAM.reg.length : TAM.reg.length - 1;   // 구름 실험실은 대학원에서만(50층 묶음마다 일곱 지역)
  const tamReg = fl => TAM.reg[Math.floor((Math.max(1, fl) - 1) / TAM.regLen) % tamRegN()];
  const tamLap = fl => Math.floor((Math.max(1, fl) - 1) / (TAM.regLen * tamRegN()));   // 300층마다 '깊은 밤' 한 단계
  const tamRole = sp => SP_ABIL[sp] !== undefined ? SP_ABIL[sp] : 1;
  const tamMem = sp => S.tam.mem[sp] || (S.tam.mem[sp] = { lv: 1, st: 1, sh: 0 });
  const tamSlots = () => S.tier <= 0 ? 3 : S.tier === 1 ? 4 : 5;
  const tamStarOn = () => S.tier >= TAM.starTier;
  const tamAvail = () => DEX_STUDENTS.filter(k => BASE_SPECIES.includes(k) || (S.dex && S.dex.got[k]));
  const tamParty = () => S.tam.party.filter(k => tamAvail().includes(k)).slice(0, tamSlots());
  const tamAutoOn = () => S.tam.best >= 2;   // 자동 쓰기 단추는 2층을 넘으면
  function tamStat(sp, slot) {
    const m = tamMem(sp), ri = tamRole(sp), r = TAM.role[ri], G = slot != null && S.tam.sg[slot] ? S.tam.sg[slot] : { tool: 0, bag: 0, hat: 0 };
    const mul = Math.pow(TAM.lvG, m.lv - 1) * (1 + TAM.starG * (m.st - 1)) * (1 + TAM.acG * (acLv(AB_KEY[ri]) - 1)) * tamCollMul() * (tamAdvRi() === ri ? 1 + TAM.advG : 1) * rtTamMul();   // 연구 트리 탐험
    return { sp, ri, hp: TAM.pHp * r.hp * mul * (1 + TAM.gearPer * G.bag), atk: TAM.pAtk * r.atk * mul * (1 + TAM.gearPer * G.tool), cd: r.cd, gg: 1 + TAM.gearPer * G.hat };
  }
  // 지금 탐험하는 지역에서 유리한 과목, 모든 대원 레벨의 보유 효과
  const tamAdvRi = () => TAM.adv[tamReg(tamCurFl()).k];
  const tamCollLv = () => tamAvail().reduce((s, sp) => s + (tamMem(sp).lv - 1) + 5 * Math.max(0, tamMem(sp).st - 1), 0);
  const tamCollMul = () => Math.min(TAM.collMax, 1 + TAM.collG * tamCollLv());
  const tamTeam = () => tamParty().map(sp => ({ sp, ri: tamRole(sp) })).sort((a, b) => TAM.front[a.ri] - TAM.front[b.ri]).map((x, i) => tamStat(x.sp, i));   // 앞줄부터 1번 칸
  const tamPow = () => Math.round(tamTeam().reduce((s, p) => s + p.atk * 6 / p.cd + p.hp / 4, 0));   // 화면에 보이는 '탐험대 힘'
  function tamMobs(fl, hm) {
    const R = tamReg(fl), m = Math.min(1e250, hm ? Math.pow(TAM.g, Math.max(1, S.tam.hc || tamCap()) - 1 + tamStgFl()) * Math.pow(TAM.hG, fl) : Math.pow(TAM.g, fl - 1 + tamStgFl())), boss = fl % TAM.bossEvery === 0, out = [];
    if (boss) out.push({ boss: 1, nm: R.boss, i: 0, hp: TAM.mHp * m * TAM.bossHp, atk: TAM.mAtk * m * TAM.bossAtk });
    if (boss) { for (let i = 0; i < 2; i++) { const j = (fl + i) % 3; out.push({ nm: R.mob[j], i: j, hp: TAM.mHp * m, atk: TAM.mAtk * m }); } return out; }
    // 10층 묶음 안에서 1~3층은 한 마리씩 다른 친구, 4~6층은 두 마리, 7~9층은 세 마리
    // 적게 나오면 한 마리가 더 세요(합친 힘은 1~3층 2.4, 4~6층 2.8, 7~9층 3배로 큰 장난꾸러기 앞에서 가장 세요)
    const k = ((fl - 1) % TAM.bossEvery) + 1, n = k <= 3 ? 1 : k <= 6 ? 2 : 3, f = TAM.mobN[n - 1];
    for (let i = 0; i < n; i++) { const j = ((k - 1) % 3 + i) % 3; out.push({ nm: R.mob[j], i: j, hp: TAM.mHp * m * f, atk: TAM.mAtk * m * f, solo: n === 1 }); }
    return out;
  }
  function tamFight(fl, team, buff, mod, hm) {
    const b = buff || 1;
    const pc = TAM.pace, md = mod || {}, ph = md.hp || 1, mh = md.hard ? 1.4 : 1;
    return { id: (tamFight.n = (tamFight.n || 0) + 1), fl, hm: !!hm, hard: !!md.hard, t: 0, lim: TAM.limit * pc, ev: [], P: team.map((s, k) => ({ ...s, cd: s.cd * pc, hp: s.hp * b * ph, mx: s.hp * b * ph, atk: s.atk * b, c: (0.4 + k * 0.3) * pc, g: 0 })),
      M: tamMobs(fl, hm).map((m, k) => ({ ...m, hp: m.hp * mh, mx: m.hp * mh, c: (1 + k * 0.4) * pc, wk: 0 })) };
  }
  // 한 대원의 기술. big은 필살기
  function tamAct(F, p, big, rnd) {
    const L = F.M.filter(m => m.hp > 0); if (!L.length) return;
    const hit = (m, d, cr) => { m.hp -= d; F.ev.push({ k: 'hit', m: F.M.indexOf(m), d, cr: !!cr }); };
    const pi = F.P.indexOf(p); F.ev.push({ k: big ? 'big' : 'act', p: pi, ri: p.ri });
    if (p.ri === 1) { if (big) L.forEach(m => hit(m, p.atk * 3)); else hit(L[0], p.atk); }
    else if (p.ri === 0) L.forEach(m => hit(m, p.atk * (big ? 3.2 : 0.5)));
    else if (p.ri === 2) {
      const A = F.P.filter(q => q.hp > 0);
      if (big) { A.forEach(q => { const h = q.mx * 0.5; q.hp = Math.min(q.mx, q.hp + h); F.ev.push({ k: 'heal', p: F.P.indexOf(q), d: h }); }); L.forEach(m => hit(m, p.atk)); }
      else { const w = A.slice().sort((a, b) => a.hp / a.mx - b.hp / b.mx)[0]; if (w && w.hp / w.mx < 0.85) { const h = p.atk * 1.6; w.hp = Math.min(w.mx, w.hp + h); F.ev.push({ k: 'heal', p: F.P.indexOf(w), d: h }); } else hit(L[0], p.atk * 0.8); }
    }
    else if (p.ri === 3) { if (big) L.forEach(m => { hit(m, p.atk * 2); m.wk = 6; }); else { hit(L[0], p.atk * 0.8); L[0].wk = 3; } }
    else { const w = L.slice().sort((a, b) => a.hp - b.hp)[0]; if (big) hit(w, p.atk * 8, true); else { const cr = rnd() < 0.25; hit(w, p.atk * (cr ? 2 : 1), cr); } }
  }
  function tamCastAt(F, p) { if (!p || p.hp <= 0 || p.g < TAM.gauge) return false; p.g = 0; tamAct(F, p, true, Math.random); return true; }
  // 한 걸음: 1 이김, -1 짐, 0 이어서
  function tamStep(F, dt, auto, rnd) {
    F.t += dt;
    for (const p of F.P) {
      if (p.hp <= 0) continue;
      p.c -= dt; if (p.c <= 0) { p.c += p.cd; tamAct(F, p, false, rnd); p.g = Math.min(TAM.gauge, p.g + p.gg); }
      if (auto && p.g >= TAM.gauge) tamCastAt(F, p);
    }
    for (const m of F.M) {
      if (m.hp <= 0) continue;
      m.wk = Math.max(0, m.wk - dt); m.c -= dt;
      if (m.c <= 0) { m.c += TAM.mobCd * TAM.pace; const tg = F.P.find(q => q.hp > 0); if (tg) { const d = m.atk * (m.wk > 0 ? 0.7 : 1); tg.hp -= d; tg.g = Math.min(TAM.gauge, tg.g + 0.4 * tg.gg); F.ev.push({ k: 'hurt', p: F.P.indexOf(tg), m: F.M.indexOf(m), d }); } }
    }
    for (const m of F.M) if (m.hp <= 0 && !m.out) { m.out = 1; F.ev.push({ k: 'poof', m: F.M.indexOf(m) }); }
    for (const p of F.P) if (p.hp <= 0 && !p.out) { p.out = 1; F.ev.push({ k: 'ko', p: F.P.indexOf(p) }); }
    if (F.M.every(m => m.hp <= 0)) return 1;
    if (F.P.every(p => p.hp <= 0) || F.t >= (F.lim || TAM.limit)) return -1;
    return 0;
  }
  // 시험과 균형 재기: 한 층을 끝까지 겨뤄 봐요(자동 쓰기)
  function tamSim(fl, team, seed) {
    let x = seed || 7; const rnd = () => (x = (x * 16807) % 2147483647) / 2147483647;
    const F = tamFight(fl, team || tamTeam()); let r = 0;
    while (!r) { r = tamStep(F, 0.1, true, rnd); F.ev.length = 0; }
    return { win: r === 1, t: Math.round(F.t * 10) / 10 };
  }
  const tamSpdOn = () => S.tam.spd.sec > 0;
  function tamAdDay() { const t = gameToday(); if (S.tam.ad.day !== t) S.tam.ad = { day: t, spd: 0, rep: 0, rv: S.tam.ad.rv || 0, ch: 0 }; }
  /* 학년과 학기마다 갈 수 있는 층에 상한을 두고, 대원 레벨 값은 지금 수업료 말고 그 학년 기준 수업료로 정해요
     상한: 유치원 1년째 10층, 2년째 20층 / 초등 1학년 1학기 25층부터 학기마다 +5(6학년 2학기 80층) / 중학교 90층부터 +10(140층)
     / 고등학교 150층부터 +10(200층) / 대학교 215층부터 +15(4학년 1학기 305층), 대학교 4학년 2학기는 상한 없이 끝없이(대학원이 열리면 다시 정해요)
     기준 수업료: 학생 30명, 소도시, 종업식으로 남은 배수(legacyMult)만(처음 하는 유치원 학교도 키울 수 있게 낮게). 부스터, 소풍, 선생님, 시설은 넣지 않아요(같은 학년 안에서는 늘 같은 값)
     레벨 값: 기준 수업료 2분치 × 1.13^(레벨 - 기준 레벨). 기준 레벨은 앞 단계 상한을 넘는 데 드는 레벨(1층 + 1.5층/레벨로 셈). 학년이 오르면 지난 레벨이 싸져요 */
  // 상한을 올리고, 레벨 값의 기준점을 상한보다 TAM_REACH층 아래에 둬요
  // 기준점까지는 싸게 편하게 가고, 그 위 상한까지는 1.13배씩 비싸져서 도토리를 건물과 탐험 중 어디에 쓸지 고르게 돼요
  // 상한: 유치원 30, 40층 / 초등 50층부터 학기마다 +5(6학년 2학기 105층) / 중 120층부터 +10(170층) / 고 185층부터 +10(235층) / 대 255층부터 +15(4학년 1학기 345층), 4학년 2학기 끝없이
  // 학기마다 상한 오르는 폭을 두 배로, 학교급이 오르면 더 많이 열려요(숫자는 제안)
  // 유치원 30, 40층 / 초등 50층부터 학기마다 +10(160층) / 중 180층부터 +20(280층) / 고 300층부터 +20(400층) / 대 420층부터 +30, 4학년 2학기 끝없이
  const TAM_CAP = [{ s: 30, d: 10 }, { s: 50, d: 10 }, { s: 180, d: 20 }, { s: 300, d: 20 }, { s: 420, d: 30 }, { s: 660, d: 30 }], TAM_REACH = 24;   // 대학원: 석사 1학기 660층(대학교 4학년 1학기 600층 + 60)부터 학기마다 +30, 박사 8학기 끝없이
  // 학기(유치원은 해)마다 장난꾸러기가 TAM_STG층치씩 세져요. 지난 학기에 올려 둔 레벨로 새 상한이 바로 뚫리지 않게(숫자는 제안)
  const TAM_STG = 15;
  const tamStageAll = () => { let n = 0; for (let t = 0; t < S.tier; t++) n += t === 0 ? TIERS[t].years : TIERS[t].years * 2; return n + tamStageIn(); };
  const tamStgFl = () => TAM_STG * tamStageAll();
  const tamStageIn = () => { const T = TIERS[S.tier], y = Math.min(yearNo(), T.years) - 1; return S.tier === 0 ? y : y * 2 + (S.sem ? 1 : 0); };   // 학교급 안에서 몇째 단계(유치원은 해마다, 그 밖에는 학기마다)
  const tamCapAt = (t, k) => { const C = TAM_CAP[Math.min(t, TAM_CAP.length - 1)]; return C.s + C.d * k; };
  function tamCap() {
    if (!S || !S.tam) return Infinity;
    const k = tamStageIn(), T = TIERS[S.tier];
    if (S.tier >= TAM_CAP.length - 1 && k >= T.years * 2 - 1) return Infinity;   // 박사 8학기부터 끝없이(대학교 4학년 2학기는 이제 630층)
    return tamCapAt(S.tier, k);
  }
  const tamCapped = () => S.tam.best >= tamCap();
  // 심화 탐험: 그 학기 상한에 닿으면 열려요
  const tamHOpen = () => { if (!S || !S.tam) return false; const c = tamCap(); return isFinite(c) ? S.tam.best >= c : S.tam.hc > 0 && S.tam.best >= S.tam.hc; };   // 박사 8학기(일반 탐험이 끝없는 때)에는 마지막으로 있던 상한(hc)에 닿았는지로 봐요. 예전에는 심화 탐험이 닫히고 단추도 숨었어요
  function tamHSync() { const c = tamCap(); if (isFinite(c) && S.tam.hc !== c) S.tam.hc = c; if (S.tam.hm && !tamHOpen()) S.tam.hm = 0; }   // 상한이 바뀌어도 심화 층은 그대로(세기는 새 상한에 맞춰 세져요)
  const tamHOn = () => !!(S.tam.hm && tamHOpen());
  const tamCurFl = () => tamHOn() ? S.tam.hb + 1 : S.tam.best + 1;
  const tamFlTx = (fl, hm) => `${hm ? '심화 ' : ''}${fmt(fl)}층`;
  const tamCapMsg = () => `${fmt(tamCap())}층까지 왔어요!\n심화 탐험이 열렸어요`;
  const tamReach = () => S.tier >= 4 ? 36 : TAM_REACH;   // 대학교만 상한보다 36층 아래(숫자는 제안)
  const tamLvRef = () => { const c = tamCap(), k = (isFinite(c) ? c : tamCapAt(S.tier, tamStageIn() - 1) + 30) + tamStgFl(); return Math.max(0, Math.round((k - tamReach() - 22) / 1.5)); };   // 학기마다 세지는 만큼 기준 레벨도. 편하게 가는 층(상한 - 24층)에 드는 레벨
  const tamBaseRate = () => 30 * CFG.base * CFG.pace * incomeScale() * Math.pow(CFG.gradeMult, 2) * legacyMult() * (S.sem ? 1.2 : 1);   // 초당 기준 수업료(2학기는 1.2배)
  const tamAcorns = m => Math.max(10, nice(tamBaseRate() * 60 * tierMinutes(m)));
  // 한 번에 여러 레벨. n은 1, 10, 또는 Infinity(가진 도토리로 되는 만큼, 한 번에 500까지)
  function tamLvPlan(sp, n) {   // 지금 도토리로 n레벨까지 몇 레벨, 얼마
    const m = tamMem(sp), lv0 = m.lv, lim = Math.min(n, 500); let k = 0, sum = 0;
    try { while (k < lim) { const c = tamLvCost(sp); if (sum + c > S.budget) break; sum += c; m.lv += 1; k++; } } finally { m.lv = lv0; }
    return { k, sum };
  }
  function tamLvBuy(sp, n) {
    const P = tamLvPlan(sp, n); if (!P.k) return 0;
    S.budget -= P.sum; tamMem(sp).lv += P.k; return P.k;
  }
  // 출동 대원 고르게 올리기: 가장 싼 대원부터 하나씩, 도토리가 모자랄 때까지(한 번에 500까지)
  function tamLvAll() {
    const ps = tamParty(); let n = 0;
    while (n < 500) { let best = null, bc = Infinity; for (const sp of ps) { const c = tamLvCost(sp); if (c < bc) { bc = c; best = sp; } } if (!best || bc > S.budget) break; S.budget -= bc; tamMem(best).lv += 1; n++; }
    return n;
  }
  // 고르게 올리기 전에 쓸 도토리와 결과를 미리 보여 줘요(도토리와 레벨은 그대로 두고 셈만 해요)
  function tamLvAllPlan() {
    const ps = tamParty(), b0 = S.budget, lv0 = ps.map(sp => tamMem(sp).lv), pw0 = tamPow();
    let n = 0, b1 = b0, lv1 = lv0, pw1 = pw0;
    try { n = tamLvAll(); b1 = S.budget; lv1 = ps.map(sp => tamMem(sp).lv); pw1 = tamPow(); }
    finally { S.budget = b0; ps.forEach((sp, i) => { tamMem(sp).lv = lv0[i]; }); }
    return { n, cost: b0 - b1, left: b1, up: ps.map((sp, i) => ({ sp, a: lv0[i], b: lv1[i] })), pw0, pw1 };
  }
  function tamLvAllAsk() {
    const P = tamLvAllPlan(); if (!P.n) return;
    // 쓰는 도토리, 대원마다 한 줄, 탐험대 힘을 나눠서 보여 줘요(예전에는 창을 열 때 줄바꿈이 지워져 한 덩어리로 보였어요)
    const rows = P.up.filter(u => u.b > u.a).map(u => `<span class="ask-row"><i>${esc(spName(u.sp))}</i><span>Lv.${u.a} → <b>${u.b}</b></span><em>+${u.b - u.a}</em></span>`).join('');
    askBox({ title: '출동 대원 고르게 올리기', yes: '올리기', no: '그만두기',
      html: `<span class="ask-sum">${acornIcon()}<b>${fmtN(P.cost)}</b>${eulOf(fmtN(P.cost))} 써요</span><span class="ask-sub">남는 도토리 ${fmtN(P.left)}</span><span class="ask-rows">${rows}</span><span class="ask-sum">탐험대 힘 ${fmt(P.pw0)} → <b>${fmt(P.pw1)}</b></span>`,
      onYes: () => { let n = 0;   // 보여 준 그대로 올려요(창을 보는 동안 들어온 도토리로 더 올리지 않아요)
        if (S.budget >= P.cost && P.up.every(u => tamMem(u.sp).lv === u.a)) { S.budget -= P.cost; for (const u of P.up) tamMem(u.sp).lv = u.b; n = P.n; } else n = tamLvAll();
        if (!n) return; tamLvFx(tamParty()); tamRestartStat(); sfx('coin'); buzz(14); save(); renderHUD(); tamRenderTop(); tamRenderBody(); tamToast(`출동 대원 레벨 +${n}`); } });
  }
  /* 기준 레벨 아래는 1.13배씩 싸지되 기준 값의 1.13^-15(약 16%) 아래로는 안 내려가요
     기준 레벨부터는 한 레벨마다 1.18배씩(전에는 1.13배) 비싸져요(숫자는 제안) */
  const tamLvCost = sp => { const d = tamMem(sp).lv - 1 - tamLvRef(); return tamAcorns(TAM.lvMin * (d < 0 ? Math.pow(TAM.lvCost, Math.max(-15, d)) : Math.pow(TAM.lvUp, Math.min(200, d)))); };
  const tamGearCost = (k, i) => { const L = S.tam.sg[i][k], G = TAM.gear.find(g => g.k === k); return { m: G.mat, n: 4 + 3 * L, star: L % 10 === 9 ? 3 * (1 + Math.floor(L / 10)) : 0 }; };
  const tamGrade = L => Math.min(3, 1 + Math.floor(L / 10));
  const tamStarNeed = st => st >= 5 ? 0 : TAM.star[st] - TAM.star[st - 1];
  // 별 조각: 같은 동물을 학교에서 또 만나면(신입생, 교환학생 등)과 보물 상자
  function tamShard(sp, n) {
    if (!tamOn() || !tamStarOn() || !DEX_STUDENTS.includes(sp)) return;
    const m = tamMem(sp); if (m.st >= 5) return;
    m.sh += n;
    while (m.st < 5 && m.sh >= tamStarNeed(m.st + 1)) { m.sh -= tamStarNeed(m.st + 1); m.st += 1; tamToast(`${spName(sp)} 대원 별이 올랐어요! ★${m.st}`); }
    if (rt.tab === 'tam') tamRenderBody();
  }
  function tamWin(fl) {
    const R = tamReg(fl), got = [];
    S.tam.best = Math.max(S.tam.best, fl);
    tamWeek(); if (fl > S.tam.wk.best) { S.tam.wk.best = fl; rankDirty(); }
    const mi = R.mat; S.tam.mat[mi] = Math.min(1e12, S.tam.mat[mi] + 2 + Math.floor(fl / 40)); if (fl % 5 === 0) S.tam.mat[3] = Math.min(1e12, S.tam.mat[3] + 1);
    const a = minAcorns(0.5); S.budget += a; earn(a);
    if (fl % TAM.bossEvery === 0) { addEss(10); got.push('숲의 정수 +10'); }
    if (fl % 50 === 0) {
      const c = fl % 150 === 0 ? 3 : fl % 100 === 0 ? 2 : 1, q = [8, 16, 30][c - 1];
      for (let i = 0; i < 4; i++) S.tam.mat[i] = Math.min(1e12, S.tam.mat[i] + (i === 3 ? Math.ceil(q / 3) : q));
      const ps = tamParty(); if (ps.length) tamShard(ps[Math.floor(Math.random() * ps.length)], 3);
      got.push(['나무', '은빛', '금빛'][c - 1] + ' 보물 상자');
    }
    if (fl % 100 === 0) { addGold(1); got.push('황금 도토리 +1'); }
    if (got.length) { if (rt.tamQ) rt.tamQ.push(...got); else tamToast(`${fl}층 통과!\n${got.join('\n')}`); }
    if (fl % 10 === 0) save();
    tamLiveDots();
  }
  // 탐험 화면을 켜 둔 채 재료와 도토리를 얻으면 대원과 장비 칸의 빨간 점과 단추를 바로 바꿔요
  function tamLiveDots() {
    if (rt.tab !== 'tam' || !tamFxOn()) return;
    const seg = rt.tamSeg || 'mem';
    tamRenderBody();
  }
  function tamWeek() { const w = gameWeek(); if (S.tam.wk.w !== w) S.tam.wk = { w, best: 0 }; }
  function tamHWeek() { const w = gameWeek(); if (S.tam.hw.w !== w) S.tam.hw = { w, best: 0 }; }
  // 심화 탐험에서 이긴 층: 도토리, 정수, 황금 도토리는 없고 재료(일반의 1.5배)와 별 조각(숫자는 제안)
  function tamWinH(fl) {
    const R = tamReg(fl), got = [], add = (i, v) => { S.tam.mat[i] = Math.min(1e12, S.tam.mat[i] + v); }, first = fl > S.tam.hb;
    S.tam.hb = Math.max(S.tam.hb, fl);
    if (first && fl % TAM.bossEvery === 0 && ppData(PP.dat.boss)) got.push(`연구 자료 +${PP.dat.boss}`);   // 심화 큰 장난꾸러기 처음 넘기
    tamHWeek(); if (fl > S.tam.hw.best) { S.tam.hw.best = fl; rankDirty(); }
    add(R.mat, Math.round(TAM.hMat * (2 + Math.floor((S.tam.hc + fl) / 40)))); if (fl % 5 === 0) add(3, 1);
    if (fl % TAM.bossEvery === 0) { const ps = tamParty(); if (tamStarOn() && ps.length) { const sp = ps[Math.floor(Math.random() * ps.length)]; tamShard(sp, 1); got.push(`${spName(sp)} 별 조각 +1`); } else { add(3, 2); got.push(`${TAM.mats[3]} +2`); } }
    if (fl % 50 === 0) { for (let i = 0; i < 4; i++) add(i, i === 3 ? 10 : 30); const ps = tamParty(); if (ps.length) tamShard(ps[Math.floor(Math.random() * ps.length)], 3); got.push('금빛 보물 상자'); }
    if (got.length) { if (rt.tamQ) rt.tamQ.push(...got); else tamToast(`심화 ${fl}층 통과!\n${got.join('\n')}`); }
    if (fl % 10 === 0) save();
    tamLiveDots();
  }
  /* 탐험 화면을 보지 않을 때는 마지막으로 넘은 층만 되풀이하고, 층은 화면을 볼 때만 올라가요
     되풀이한 층은 기본 보상(재료와 도토리, 심화는 재료)만 받아요. 큰 장난꾸러기 정수, 보물 상자, 황금 도토리, 랭킹은 처음 넘을 때만 */
  const tamWatch = () => rt.tab === 'tam' && !document.hidden;
  const tamRepFl = () => Math.max(1, tamCurFl() - 1);
  function tamWinRep(fl, hm) {
    const R = tamReg(fl), add = (i, v) => { S.tam.mat[i] = Math.min(1e12, S.tam.mat[i] + v); };
    if (hm) add(R.mat, Math.round(TAM.hMat * (2 + Math.floor((S.tam.hc + fl) / 40))));
    else { add(R.mat, 2 + Math.floor(fl / 40)); const a = minAcorns(0.5); S.budget += a; earn(a); }
    tamLiveDots();
  }
  /* 빠른 스킵. 지금 층부터 위로, 대원 한 번 공격(필살기 말고 보통 공격)으로 모든 장난꾸러기가 쓰러지는 층까지만 한 번에 넘어가요
     유리한 과목 덤은 빼고 셈(지역이 바뀌어도 안전하게). 넘은 층은 하나하나 이긴 것과 같은 보상, 사건은 없어요. 한 번에 1000층까지 */
  function tamSkipTo() {
    if (!tamOn() || !tamParty().length) return 0;
    tamHSync(); const hm = tamHOn(), cur = tamCurFl(), cap = hm ? Infinity : tamCap(), adv = tamAdvRi(), cr = S.tam.cheer > 0 ? TAM.cheer.mul : 1;
    if (!hm && tamCapped()) return 0;
    const one = tamTeam().reduce((m, p) => Math.max(m, p.atk * cr / (p.ri === adv ? 1 + TAM.advG : 1) * [0.5, 1, 0.8, 0.8, 1][p.ri]), 0);
    let fl = cur - 1;
    while (fl - cur < 999 && fl + 1 <= cap) { const M = tamMobs(fl + 1, hm); if (!M.every(m => m.hp <= one)) break; fl++; }
    return fl - cur + 1 >= 2 ? fl : 0;   // 두 층 이상일 때만
  }
  function tamSkipGo() {
    const to = tamSkipTo(); if (!to) { tamToast('지금은 빠르게 넘을 층이 없어요'); return; }
    const hm = tamHOn(), from = tamCurFl(); rt.tamQ = [];
    try { for (let f = from; f <= to; f++) { if (hm) tamWinH(f); else tamWin(f); if (!hm && S.tam.cheer > 0) S.tam.cheer -= 1; } }
    finally { const got = rt.tamQ; rt.tamQ = null; const n = {}; got.forEach(g => { n[g] = (n[g] || 0) + 1; });
      sfx('coin'); save(); rankDirty(); tamRestart(); tamRenderTop(); tamRenderBody();
      tamToast(`${tamFlTx(from, hm)}부터 ${fmt(to)}층까지 빠르게 넘었어요!` + (got.length ? '\n' + Object.keys(n).slice(0, 4).map(k => n[k] > 1 ? `${k} ×${n[k]}` : k).join('\n') : '')); }
  }
  // 자리 비운 동안의 탐험 보고서: 가장 깊은 층에서 계속 모아요(최대 12시간)
  function tamIdle() {
    if (!S.tam.it) S.tam.it = gameNow();
    const sec = Math.min(TAM.idleMax + (rtLv('tam') >= 4 ? 7200 : 0), Math.max(0, (gameNow() - S.tam.it) / 1000)), b = Math.max(1, S.tam.best), R = tamReg(b), min = sec / 60;
    const main = Math.floor(min * (0.3 + b / 200)), side = Math.floor(main / 4), star = Math.floor(min / 30 * (1 + b / 100));
    return { sec, mat: [0, 1, 2, 3].map(i => i === 3 ? star : i === R.mat ? main : side), acorn: S.tam.best ? minAcorns(sec / 3600 * 3) : 0, mobs: Math.floor(min * 2) };
  }
  function tamCollect(mul) {
    const I = tamIdle(); if (I.sec < 60) return null;
    for (let i = 0; i < 4; i++) S.tam.mat[i] = Math.min(1e12, S.tam.mat[i] + I.mat[i] * mul);
    if (I.acorn) { S.budget += I.acorn * mul; earn(I.acorn * mul); }
    S.tam.it = gameNow(); save();
    return I;
  }
  function tamReport(auto) {
    const I = tamIdle(); if (I.sec < (auto ? TAM.idleMin : 60)) { if (!auto) tamToast('조금 더 지나면 보고서가 쌓여요'); return; }
    queueModal(() => {
      tamAdDay();
      const h = Math.floor(I.sec / 3600), mm = Math.floor(I.sec % 3600 / 60);
      $('#tmRepSub').textContent = `${h ? h + '시간 ' : ''}${mm}분 동안 장난꾸러기 ${fmt(I.mobs)}마리를 달래 줬어요`;
      setH($('#tmRepList'), I.mat.map((v, i) => v ? `<li><span>${TAM.matIc[i]}</span>${TAM.mats[i]} +${fmt(v)}</li>` : '').join('') + (I.acorn ? `<li>${acornIcon()}도토리 +${fmt(I.acorn)}</li>` : ''));
      const ad = $('#tmRepAd'); ad.hidden = S.tam.ad.rep >= TAM.adRep;
      openModal($('#mTamRep'));
    });
  }
  function tamRepTake(dbl) {
    const go = mul => { closeModal($('#mTamRep')); const I = tamCollect(mul); if (I) tamToast(mul > 1 ? '광고 선물! 보고서를 두 배로 받았어요' : '탐험 보고서를 받았어요'); tamRenderBody(); };
    if (!dbl) return go(1);
    showAd(() => { tamAdDay(); S.tam.ad.rep += 1; go(2); }, r => { if (r !== 'noad') tamToast('광고를 끝까지 보지 않아서 보상이 없어요'); });
  }
  function tamAdSpd() {
    tamAdDay(); if (S.tam.ad.spd >= TAM.adSpd.n) { tamToast('2배속 광고는 하루 세 번까지예요'); return; }
    if (S.tam.spd.sec > (TAM.adSpd.max - TAM.adSpd.min) * 60) { tamToast(`2배속은 ${TAM.adSpd.max}분까지 모을 수 있어요`); return; }
    showAd(() => { tamAdDay(); S.tam.ad.spd += 1; S.tam.spd.sec = Math.min(TAM.adSpd.max * 60, S.tam.spd.sec + TAM.adSpd.min * 60); save(); tamToast(`2배속 ${TAM.adSpd.min}분! 게임을 켜 둔 동안만 줄어요`); tamRenderTop(); }, r => { if (r !== 'noad') tamToast('광고를 끝까지 보지 않아서 보상이 없어요'); });
  }
  // 📺 응원 받기: 다음 TAM.cheer.fl층 동안 대원 힘과 체력이 세져요(하루 TAM.cheer.n번). 예전 '힘내서 다시 도전'은 실제로 세지지 않았어요
  const tamCheerLeft = () => { tamAdDay(); return Math.max(0, TAM.cheer.n - (S.tam.ad.ch || 0)); };
  function tamAdRevive() {
    if (S.tam.cheer > 0) { tamToast(`응원이 아직 ${S.tam.cheer}층 남았어요`); return; }
    if (tamCheerLeft() <= 0) { tamToast(`응원은 하루 ${TAM.cheer.n}번까지예요`); return; }
    showAd(() => { tamAdDay(); S.tam.ad.ch = (S.tam.ad.ch || 0) + 1; S.tam.ad.rv = (S.tam.ad.rv || 0) + 1; S.tam.cheer = TAM.cheer.fl; save();
      const T = rt.tam; if (T) { T.lose = 0; T.nLose = 0; if (T.ph === 'lose') T.t = TAM.ph.lose; else if (T.F && T.ph === 'fight') tamCheerNow(T.F); }
      tamRenderTop(); tamToast(`응원을 받았어요!\n다음 ${TAM.cheer.fl}층 동안 힘과 체력 +${Math.round((TAM.cheer.mul - 1) * 100)}%`); }, r => { if (r !== 'noad') tamToast('광고를 끝까지 보지 않아서 보상이 없어요'); });
  }
  // 겨루는 중에 응원을 받으면 지금 대원도 바로 세져요
  function tamCheerNow(F) { const m = TAM.cheer.mul; F.P.forEach(p => { p.atk *= m; p.mx *= m; p.hp *= m; }); F.cheer = 1; }
  // 매 프레임: 탐험 화면이 아니어도 겨뤄요(그림은 탐험 화면에서만)
  // 한 층의 흐름: 걷기(배경이 흘러요) → 만남(장난꾸러기가 떨어져요) → 겨루기 → 이김(전리품) → 사건(가끔) → 오르기(다음 층) / 지면 물러났다가 다시
  // 탐험 화면이 아니어도 같은 시간으로 흘러가요(그림만 안 그려요). 사건은 화면이 아니면 바로 기본 선택
  function tamPh(T, ph) {
    T.ph = ph; T.t = 0; if (rt.tab === 'tam') musicSync();
    tamHSync(); const vis = tamFxOn(), hm = tamHOn(), fl = tamCurFl();
    if (ph === 'walk' && !hm && tamCapped()) { T.ph = 'cap'; T.F = null; if (vis) { tamWalk(fl); $('#tmP') && $('#tmP').classList.remove('walking'); tamRibbon('clear', tamCapMsg()); tamRenderTop(); } return; }   // 학년 상한
    if (ph === 'walk') { T.F = null; if (vis) tamWalk(fl); }
    else if (ph === 'meet') {
      const rep = !tamWatch() && !T.mod; T.F = tamFight(rep ? tamRepFl() : fl, tamTeam(), !rep && S.tam.cheer > 0 ? TAM.cheer.mul : 1, T.mod, hm); T.F.cheer = !rep && S.tam.cheer > 0 ? 1 : 0; T.F.rep = rep ? 1 : 0; T.mod = null;   // 응원, 화면 밖이면 마지막으로 넘은 층을 되풀이
      if (vis) { tamBuild(); tamAlert(); tamCam(true, T.F.M[0].boss); if (T.F.M[0].boss) { tamRibbon('boss', '큰 장난꾸러기가 나타났어요!'); const w = $('#tmWarn'); if (w && !rt.reduced) { w.hidden = false; $$('i', w).forEach(i => { i.style.animation = 'none'; void i.offsetWidth; i.style.animation = ''; }); clearTimeout(w._t); w._t = setTimeout(() => { w.hidden = true; }, 1500); } } }
    }
    else if (ph === 'win') {
      const f = T.F.fl, hard = T.F.hard, rep = T.F.rep || (!tamWatch() && f >= tamCurFl()); T.nLose = 0; T.lose = 0;
      if (rep) { tamWinRep(T.F.rep ? f : tamRepFl(), T.F.hm); T.ev = null; }   // 화면 밖에서는 층이 오르지 않아요
      else { if (T.F.cheer && S.tam.cheer > 0) S.tam.cheer -= 1; if (T.F.hm) tamWinH(f); else tamWin(f); if (hard) tamWinHard(f);
      T.ev = !T.F.hm && f % TAM.bossEvery && Math.random() < TAM.evP ? tamEvRoll(f) : null; }
      if (vis) { tamRibbon('clear', `${tamFlTx(f, T.F.hm)} 통과!`); tamRenderTop(); tamVictory(f); tamCam(false); }
    }
    else if (ph === 'event') { if (vis) tamEvShow(T.ev); }
    else if (ph === 'climb') { T.F = null; if (vis) tamClimb(fl - 1); }
    else if (ph === 'lose') {
      T.lose = T.F.fl; T.nLose = (T.nLose || 0) + 1;
      if (vis) { tamRibbon('lose', T.nLose >= 3 ? '대원 레벨을 올리면 이길 수 있어요' : '힘을 길러서 다시 와요'); tamRenderTop(); tamRenderBody(); }
    }
  }
  function tamTick(dt) {
    if (!tamOn() || !tamParty().length) return;
    const T = rt.tam || (rt.tam = { ph: '', t: 0, F: null, buff: 0, lose: 0, nLose: 0, ev: null, mod: null });
    if (!T.ph) { tamPh(T, 'walk'); return; }
    if (tamFxOn() && (rt.tamAcT = (rt.tamAcT || 0) + dt) > 0.4) { rt.tamAcT = 0; tamAcorn(); }   // 위 칸 도토리
    if (T.ph === 'cap') { if (!tamCapped() || tamHOn()) tamPh(T, 'walk'); return; }   // 학년이 오르면 다시 걸어요
    const vis = tamFxOn(), d = dt * (tamSpdOn() ? 2 : 1), P = TAM.ph;
    if (tamSpdOn()) { const was = Math.ceil(S.tam.spd.sec); S.tam.spd.sec = Math.max(0, S.tam.spd.sec - dt); if (vis && Math.ceil(S.tam.spd.sec) !== was) tamRenderTop(); }   // 2배속은 켜 둔 동안만 줄어요
    T.t += d;
    if (T.ph === 'walk') { if (T.t >= P.walk) tamPh(T, 'meet'); }
    else if (T.ph === 'meet') { if (vis && T.F) tamDraw(T.F); if (T.t >= P.meet) tamPh(T, 'fight'); }
    else if (T.ph === 'fight') {
      if (vis && tamSkBusy()) { T.t -= d; return; }   // 필살기 연출 동안 겨루기는 잠깐 멈춰요(화면을 볼 때만)
      if (T.pend) { const r = T.pend; T.pend = 0; tamPh(T, r === 1 ? 'win' : 'lose'); return; }
      const r = tamStep(T.F, d, !!S.tam.auto && tamAutoOn(), Math.random);
      if (vis) tamDraw(T.F); T.F.ev.length = 0;
      if (r && vis && tamSkBusy()) T.pend = r; else if (r === 1) tamPh(T, 'win'); else if (r === -1) tamPh(T, 'lose');
    }
    else if (T.ph === 'win') { if (T.t >= P.win * ((tamCurFl() - 1) % 50 === 0 ? 1.5 : 1)) tamPh(T, T.ev ? 'event' : 'climb'); }
    else if (T.ph === 'event') { if (!vis || T.t >= P.ev) tamEvPick(T, -1); }
    else if (T.ph === 'climb') { if (T.t >= P.climb) tamPh(T, 'walk'); }
    else if (T.ph === 'lose') { if (T.t >= P.lose) tamPh(T, 'walk'); }
  }
  // 사건: 이긴 층 뒤에 가끔(보스 층 빼고). 고르지 않으면 첫째(안전한) 쪽
  const TM_EV = [
    { k: 'chest', ic: 'ex_chest_wood', t: '반짝이는 보물 상자를 찾았어요!', o: ['열어 보기'] },
    { k: 'spring', ic: 'ex_fx_heal', t: '맑은 샘물이 솟아요. 마시면 다음 층에서 힘이 나요', o: ['마시고 가기'] },
    { k: 'fork', ic: 'ex_flag', t: '갈림길이에요. 숲길은 장난꾸러기가 세지만 재료가 두 배예요', o: ['큰길로 가기', '숲길로 가기'] },
    { k: 'lost', ic: '', t: '길 잃은 아기 동물을 만났어요', o: ['학교로 데려다주기'] }
  ];
  function tamEvRoll(fl) {
    const E = TM_EV[Math.floor(Math.random() * TM_EV.length)], av = tamAvail();
    return Object.assign({}, E, { fl, sp: E.k === 'lost' ? av[Math.floor(Math.random() * av.length)] : '' });
  }
  function tamEvPick(T, i) {
    const E = T.ev; if (!E) { tamPh(T, 'climb'); return; }
    const pick = i < 0 ? 0 : i, R = tamReg(E.fl); let msg = '';
    if (E.k === 'chest') { const n = 3 + Math.floor(E.fl / 15); S.tam.mat[R.mat] = Math.min(1e12, S.tam.mat[R.mat] + n); if (E.fl >= 5) S.tam.mat[3] = Math.min(1e12, S.tam.mat[3] + 1); msg = `보물 상자에서\n${TAM.mats[R.mat]} +${n}${E.fl >= 5 ? `, ${TAM.mats[3]} +1` : ''}`; }
    else if (E.k === 'spring') { T.mod = { hp: 1.3 }; msg = '다음 층에서 체력이 30% 많아요'; }
    else if (E.k === 'fork') { if (pick === 1) { T.mod = { hard: 1 }; msg = '숲길로 가요. 조심해요!'; } else msg = '큰길로 가요'; }
    else if (E.k === 'lost') { if (tamStarOn() && E.sp) { tamShard(E.sp, 1); msg = `${spName(E.sp)} 별 조각 +1`; } else { const a = minAcorns(1); S.budget += a; earn(a); msg = `도토리 +${fmt(a)}`; } }
    T.ev = null; save(); tamLiveDots();
    const c = $('#tmEv'); if (c) c.hidden = true;
    if (msg && tamFxOn()) tamToast(msg);
    tamPh(T, 'climb');
  }
  // 강화하면 지금 겨루는 대원 능력치도 바로 올려요(체력은 같은 비율로)
  function tamRestartStat() { const T = rt.tam, F = T && T.F; if (!F) return; const tm = tamTeam(); F.P.forEach((p, i) => { const n = tm[i]; if (!n || n.sp !== p.sp) return; const r = p.mx ? p.hp / p.mx : 1; p.atk = n.atk; p.mx = n.hp; p.hp = p.hp > 0 ? n.hp * r : 0; p.gg = n.gg; }); }
  // 대원을 바꾸면 이번 층을 걷기부터 다시
  function tamRestart() { tamSkStop(); const T = rt.tam; if (T && T.ph && T.ph !== 'event') { T.pend = 0; const c = $('#tmEv'); if (c) c.hidden = true; tamPh(T, 'walk'); } }
  // 숲길(어려운 길)로 이긴 층은 재료를 한 번 더
  function tamWinHard(fl) { const R = tamReg(fl); S.tam.mat[R.mat] = Math.min(1e12, S.tam.mat[R.mat] + 2 + Math.floor(fl / 40)); }
  /* ----- 그림: 탐험 화면 ----- */
  const tamPic = (k, fb) => tamI(k) || IMG(fb) || '';
  // 3D 그림(작업지시서 74, 75, ex3_)이 있으면 먼저 쓰고, 없으면 2D 그림(ex_)
  const tamI = k => IMG(String(k).replace(/^ex_/, 'ex3_')) || IMG(k);
  const tamPcPic = (sp, act) => tamI(`ex_pc_${sp}_${act ? 'act' : 'idle'}`) || IMG('chr_' + sp) || '';
  const tamMobPic = (fl, m) => m.boss ? tamPic(`ex_boss_${tamReg(fl).k}`, TAM.bossPh) : tamPic(`ex_mob_${tamReg(fl).k}_${m.i + 1}`, TAM.mobPh[(TAM.reg.indexOf(tamReg(fl)) + m.i) % TAM.mobPh.length]);
  // 탐험대가 층을 오르며 장난꾸러기를 만나는 화려한 화면. 자리(왼쪽 %, 바닥 %), 앞줄부터
  // 맨 앞 장식(풀과 꽃)에 가리지 않게 대원과 장난꾸러기를 14%만큼 위로(TM_UP, 체력 막대까지 보이게)
  // 사선 배치(탐험대는 왼쪽 아래, 장난꾸러기는 오른쪽 위). [가로 %, 바닥에서 % (TM_UP 더함)]
  const TM_UP = 26, TM_PPOS = [[35, 6], [21, 10], [27, -4], [9, 4], [12, 16]];
  const TM_MPOS = [[59, 21], [71, 30], [75, 12]], TM_MPOS1 = [[66, 22]], TM_MPOS2 = [[59, 20], [72, 28]], TM_BPOS = [[67, 18], [50, 35], [53, 12]];   // 오른쪽 단추에 가리지 않게 가운데 쪽으로
  const TM_AMB = { ground: 14, garden: 12, pond: 12, library: 12, yard: 22, tower: 18 };
  // 깊이: 뒷줄(바닥 % 큼)일수록 조금 작고 어둡게
  const tamDz = y => `--dz:${(1.02 - y * 0.007).toFixed(3)};--db:${(1 - Math.max(0, y) * 0.004).toFixed(3)};`;
  // 카메라: 겨룰 때 다가가고, 큰 장난꾸러기가 나오면 그쪽으로 확대했다가 돌아와요
  function tamCam(fight, boss) {
    const st = $('#tmStage'); if (!st) return; st.classList.toggle('fight', !!fight);
    if (boss) { st.classList.add('bossin'); clearTimeout(st._cb); st._cb = setTimeout(() => st.classList.remove('bossin'), 1300); }
  }
  function tamPunch() { const st = $('#tmStage'); if (!st || rt.reduced) return; st.classList.add('punch'); clearTimeout(st._cp); st._cp = setTimeout(() => st.classList.remove('punch'), 110); }
  // 맞은 모습(ex3_..._hit)이 있으면 잠깐 바꿔 보여요
  function tamHitPic(el, k) {
    const u = k && (/^ex4_/.test(k) ? IMG(k) : IMG(k.replace(/^ex_/, 'ex3_'))), im = el && el.querySelector('img'); if (!u || !im) return;
    if (!im.dataset.base) im.dataset.base = im.src; clearTimeout(im._h); im.src = u; im._h = setTimeout(() => { if (im.src === u) im.src = im.dataset.base; delete im.dataset.base; }, 340);
  }
  // 탐험에서 받은 것과 알림은 화면 맨 위가 아니라 탐험 무대 가운데에 띄워요(탐험 화면이 아니면 원래 알림)
  function tamToast(msg) {
    const st = $('#tmStage'), m = $('#tmMsg');
    if (!st || !m || rt.tab !== 'tam' || $('#panelTam').hidden || !$('#tmSheet').hidden) { toast(msg); return; }   // 창이 열려 있으면 무대 알림이 창 뒤에 가려요
    m.textContent = msg; m.hidden = false; m.style.animation = 'none'; void m.offsetWidth; m.style.animation = '';
    clearTimeout(m._t); m._t = setTimeout(() => { m.hidden = true; }, 2600);
  }
  function tamFxOn() { return rt.tab === 'tam' && !rt.modalOpen && !document.hidden; }
  function tamBg(fl) { return IMG('ex4_bg_' + tamReg(fl).k) || tamI('ex_bg_' + tamReg(fl).k); }   // 세로 배경
  // 겹 배경(작업지시서 104): 하늘, 먼 풍경, 바닥 세 겹(앞 장식은 #tmFg). 그림이 다 있는 지역만, 없으면 예전 한 장
  function tamLay(fl) { const k = tamReg(fl).k, u = n => IMG(`ex5_${k}_${n}`), L = { k, sky: u('sky'), far: u('far'), floor: u('floor'), front: u('front') }; return L.sky && L.far && L.floor ? L : null; }
  // 오르는 길: 엔진 바닥이 되는 지역이면 켜요
  function tamG6(fl) { const st = $('#tmStage'), on = !!(st && tamLay(fl) && fxgOn(fl) && fxgSet(tamReg(fl).k)); if (st) st.classList.toggle('g6', on); if (!on) fxgHide(); else fxgHeight(fl); return on; }
  function tamBgPaint(el, fl) {
    if (!el) return; const L = tamLay(fl);
    if (!L) { if (el.dataset.lay) { el.innerHTML = ''; el.dataset.lay = ''; } const bg = tamBg(fl); el.style.backgroundImage = bg ? `url("${bg}")` : ''; return; }
    el.style.backgroundImage = '';
    if (el.dataset.lay !== L.k) { el.innerHTML = `<i class="tm-lay"><i class="ly sky" style="background-image:url('${L.sky}')"></i><i class="ly far" style="background-image:url('${L.far}')"></i><i class="ly floor" style="background-image:url('${L.floor}')"></i></i>`; el.dataset.lay = L.k; }
  }
  function tamAmb(k) {
    const a = $('#tmAmb'); if (!a || a.dataset.k === k) return; a.dataset.k = k;
    let h = ''; for (let i = 0; i < TM_AMB[k]; i++) { const r = (n => (Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1)(1), q = Math.abs(r);
      h += `<i style="left:${(i * 37 % 100)}%;--s:${4 + (i * 7 % 5)}px;--d:${6 + (i * 13 % 6)}s;--dl:-${(i * 1.7 % 9).toFixed(1)}s;--dx:${(q * 60 - 30).toFixed(0)}px;--y:${(i * 23 % 70)}"></i>`; }
    a.innerHTML = h;
  }
  function tamTower(fl) {
    const t = $('#tmTower'); if (!t) return;
    const p = ((fl - 1) % TAM.bossEvery) / (TAM.bossEvery - 1) * 100, R = tamReg(fl), P = tamParty();
    t.style.setProperty('--p', p.toFixed(0) + '%');
    const b = tamI(`ex_boss_${R.k}`), m = P.length ? (tamI(`ex_pc_${P[0]}_idle`) || IMG('chr_' + P[0])) : '';
    t.querySelector('.tt-boss').style.backgroundImage = b ? `url("${b}")` : '';
    t.querySelector('.tt-me').style.backgroundImage = m ? `url("${m}")` : '';
  }
  function tamFl(fl, up) {
    const e = $('#tmFlBig'); if (!e) return; e.textContent = tamFlTx(fl, tamHOn());
    if (up) { e.classList.remove('up'); void e.offsetWidth; e.classList.add('up'); }
  }
  function tamBuild() {
    const T = rt.tam, F = T && T.F, st = $('#tmStage'); if (!st) return;
    const fl = F ? F.fl : tamCurFl(), R = tamReg(fl), bg = tamBg(fl);
    st.dataset.reg = R.k; st.classList.toggle('hm', F ? !!F.hm : tamHOn()); st.classList.toggle('deep', tamLap(fl) > 0);
    if (!T || !T.climbing) tamBgPaint($('.tm-bg.cur', st), fl);
    st.classList.toggle('lay', !!tamLay(fl));
    tamG6(fl);
    tamAmb(R.k); tamTower(fl); tamFl(fl);
    const boss = !!(F && F.M[0] && F.M[0].boss); st.classList.toggle('boss', boss);
    const bb = $('#tmBossBar'); bb.hidden = !boss; if (boss) bb.querySelector('span').textContent = F.M[0].nm;
    const party = F ? F.P : tamTeam();
    $('#tmP').dataset.fid = F ? F.id : ''; $('#tmM').dataset.fid = F ? F.id : ''; $('#tmP').classList.remove('walking', 'enter', 'jump');
    setH($('#tmP'), party.map((p, i) => { const [x, y] = TM_PPOS[i] || TM_PPOS[0];
      return `<div class="tm-f" data-i="${i}" style="left:${x}%;bottom:${y + TM_UP}%;z-index:${30 - y};${tamDz(y)}--bd:-${(i * 0.37).toFixed(2)}s;--bd2:${(i * 0.06).toFixed(2)}s"><div class="tm-body"><img src="${tamPcPic(p.sp)}" alt="${esc(spName(p.sp))}"></div><i class="tm-hp"><s></s><b></b></i></div>`; }).join(''));
    if (!F) { setH($('#tmM'), ''); return; }
    const pos = boss ? TM_BPOS : F.M.length === 1 ? TM_MPOS1 : F.M.length === 2 ? TM_MPOS2 : TM_MPOS;   // 마리 수에 맞춘 자리
    setH($('#tmM'), F.M.map((m, i) => { const [x, y] = pos[i] || pos[0];
      return `<div class="tm-f tm-mob in${m.boss ? ' boss' : ''}${m.solo ? ' solo' : ''}" data-i="${i}" style="left:${x}%;bottom:${y + TM_UP}%;z-index:${30 - y};${tamDz(y)}--bd:-${(i * 0.5).toFixed(2)}s;--id:${(i * 0.12).toFixed(2)}s"><div class="tm-body"><img src="${tamMobPic(F.fl, m)}" alt="${esc(m.nm)}"></div><i class="tm-hp"><s></s><b></b></i></div>`; }).join(''));
    if (boss) tamShake(7, 420);
    tamSkills(); tamDraw(F);
  }
  // 무대 위 좌표(무대 너비, 높이에 대한 %)
  function tamAt(el, fy) {
    const st = $('#tmFx'), a = st.getBoundingClientRect(), r = el.getBoundingClientRect();
    return [r.left - a.left + r.width / 2, r.top - a.top + r.height * (fy == null ? 0.45 : fy)];
  }
  function tamFxImg(cls, src, x, y, kf, ms, ease) {
    const fx = $('#tmFx'); if (!fx || !src) return null;
    const im = document.createElement('img'); im.className = cls; im.src = src; im.alt = ''; fx.appendChild(im);
    const w = im.getBoundingClientRect().width || 40;
    const k = kf.map(f => Object.assign({}, f, { transform: `translate(${x + (f.dx || 0) - w / 2}px,${y + (f.dy || 0) - w / 2}px) ${f.t || ''}` }));
    k.forEach(f => { delete f.dx; delete f.dy; delete f.t; });
    const an = im.animate(k, { duration: ms, easing: ease || 'ease-out', fill: 'forwards' });
    an.onfinish = () => im.remove();
    return im;
  }
  function tamFloat(el, tx, cls) {
    if (!el) return; const fx = $('#tmFx'); if (!fx) return;
    const [x, y] = tamAt(el, 0.15), s = document.createElement('span'); s.className = 'tm-num ' + (cls || ''); s.textContent = tx; fx.appendChild(s);
    const w = s.getBoundingClientRect().width, jx = (Math.random() - 0.5) * 18;
    s.animate([{ transform: `translate(${x - w / 2 + jx}px,${y}px) scale(.4)`, opacity: 0 }, { transform: `translate(${x - w / 2 + jx}px,${y - 14}px) scale(1.25)`, opacity: 1, offset: 0.2 },
      { transform: `translate(${x - w / 2 + jx}px,${y - 20}px) scale(1)`, opacity: 1, offset: 0.6 }, { transform: `translate(${x - w / 2 + jx}px,${y - 40}px) scale(.9)`, opacity: 0 }], { duration: cls === 'cr' ? 1000 : 800, easing: 'ease-out', fill: 'forwards' }).onfinish = () => s.remove();
  }
  function tamShake(px, ms) {
    const w = $('#tmWorld'); if (!w || rt.reduced) return;
    const k = []; for (let i = 0; i <= 6; i++) { const f = (1 - i / 6) * px; k.push({ transform: `translate(${((i % 2 ? 1 : -1) * f).toFixed(1)}px,${((i % 3 - 1) * f * 0.6).toFixed(1)}px)` }); }
    w.animate(k, { duration: ms, easing: 'linear' });
  }
  function tamHitFx(el, cr, big, ri) {
    fxTamHit(el, cr, big, ri);   // 탐험 효과층(40b-fx-layer.js): 과목 색 반짝이, 먼지, 충격 고리
    const [x, y] = tamAt(el), rot = Math.round(Math.random() * 90);
    // 강한 한 방은 금빛 별(ex4_fx_crit), 필살기는 큰 불꽃(ex4_fx_hit_big)과 충격파(ex4_fx_shock)
    const hs = (cr && IMG('ex4_fx_crit')) || (big && IMG('ex4_fx_hit_big')) || tamI('ex_fx_hit');
    if (fxTamOn()) fxTamKick();
    if (big && IMG('ex4_fx_shock')) tamFxImg('tm-shock', IMG('ex4_fx_shock'), x, y, [{ t: 'scale(.2)', opacity: 0.9 }, { t: 'scale(1.2)', opacity: 0 }], 520);
    tamFxImg('tm-spark', hs, x + (Math.random() - 0.5) * 12, y, [{ t: `scale(.3) rotate(${rot}deg)`, opacity: 1 }, { t: `scale(${cr ? 1.7 : 1.1}) rotate(${rot + 30}deg)`, opacity: 1, offset: 0.4 }, { t: `scale(${cr ? 2 : 1.3}) rotate(${rot + 40}deg)`, opacity: 0 }], 360);
  }
  // 과목마다 다른 평소 공격. 과학은 포물선 플라스크와 거품, 국어는 물결 음표 셋, 미술은 물감 방울 셋, 수학은 빠른 별과 잔상(체육은 붙어서 들이받기)
  function tamShot(fromEl, toEl, ri, onHit) {
    if (fxTamOn()) { if (FXT.st !== 'ok') fxTamInit(); else fxTamKick(); }   // 날아가는 기술 그림 뒤 반짝이 꼬리
    const src = tamI(`ex_fx_${TAM.role[ri].k}`); if (!src || !fromEl || !toEl) { if (onHit) onHit(); return; }
    const [x0, y0] = tamAt(fromEl, 0.4), [x1, y1] = tamAt(toEl, 0.45), dx = x1 - x0, dy = y1 - y0;
    const fly = (ms, arc, spin, sc, ox, oy, ease) => tamFxImg('tm-shot', src, x0, y0, [{ t: `scale(${0.5 * sc}) rotate(0deg)`, opacity: 0.3 }, { dx: dx * 0.5 + (ox || 0) / 2, dy: dy * 0.5 + arc + (oy || 0) / 2, t: `scale(${sc}) rotate(${spin / 2}deg)`, opacity: 1, offset: 0.5 }, { dx: dx + (ox || 0), dy: dy + (oy || 0), t: `scale(${1.1 * sc}) rotate(${spin}deg)`, opacity: 1 }], ms, ease || 'linear');
    if (ri === 0) {   // 과학
      fly(380, -42, 540, 1);
      setTimeout(() => { if (onHit) onHit(); for (let k = 0; k < 3; k++) tamFxImg('tm-note', src, x1, y1, [{ t: 'scale(.3)', opacity: 1 }, { dx: (k - 1) * 18, dy: -16 - k * 4, t: 'scale(.55)', opacity: 0 }], 420); }, 370);
    } else if (ri === 2) {   // 국어
      for (let k = 0; k < 3; k++) setTimeout(() => fly(360, (k - 1) * 22, 0, 0.75, 0, (k - 1) * 10), k * 90);
      setTimeout(() => onHit && onHit(), 2 * 90 + 350);
    } else if (ri === 3) {   // 미술
      for (let k = 0; k < 3; k++) setTimeout(() => fly(340 + k * 40, -30 - k * 10, 120, 0.7, (k - 1) * 16, (k - 1) * 8), k * 50);
      setTimeout(() => onHit && onHit(), 2 * 50 + 380);
    } else {   // 수학
      for (let k = 0; k < 3; k++) setTimeout(() => tamFxImg('tm-shot', src, x0, y0, [{ t: `scale(${1 - k * 0.25})`, opacity: 1 - k * 0.3 }, { dx, dy, t: `scale(${1 - k * 0.25})`, opacity: 1 - k * 0.3 }], 200, 'ease-in'), k * 35);
      setTimeout(() => onHit && onHit(), 200);
    }
  }
  function tamDropFx(el, fl) {
    fxTamDrop(el, fl);   // 탐험 효과층: 도토리와 재료가 튀어 바닥에 굴러요(그림만)
    const [x, y] = tamAt(el, 0.5), src = IMG(['ex_mat_twig', 'ex_mat_stone', 'ex_mat_petal'][tamReg(fl).mat] || 'ex_mat_star') || IMG('ex_mat_star');
    tamFxImg('tm-poof', tamI('ex_fx_poof'), x, y, [{ t: 'scale(.4)', opacity: 1 }, { t: 'scale(1.3)', opacity: 0 }], 520);
    const st = $('#tmFx').getBoundingClientRect();
    for (let i = 0; i < 2; i++) tamFxImg('tm-drop', src, x, y, [{ t: 'scale(.6)', opacity: 1 }, { dx: (i ? 18 : -14), dy: -38, t: 'scale(1.1)', opacity: 1, offset: 0.35 }, { dx: (i ? 22 : -18), dy: 0, t: 'scale(1)', opacity: 1, offset: 0.6 }, { dx: -x + st.width * 0.08, dy: -y + st.height * 0.08, t: 'scale(.5)', opacity: 0.2 }], 1000 + i * 120, 'ease-in-out');
  }
  function tamDraw(F) {
    const P = $$('#tmP .tm-f'), M = $$('#tmM .tm-f');
    if (P.length !== F.P.length || M.length !== F.M.length || $('#tmM').dataset.fid !== String(F.id)) { tamBuild(); return; }   // 다른 판의 쓰러진 대원 그림을 그대로 쓰던 것 고침
    let actor = -1, sk = null;   // sk: 필살기 연출 시계로 맞는 때와 회복되는 때
    F.ev.forEach((e, ei) => {
      if (e.k === 'act' || e.k === 'big') {
        actor = e.p; sk = null; const el = P[e.p], im = el && el.querySelector('img'); if (!el) return;
        if (e.k === 'big') { const nx = F.ev.slice(ei + 1).find(x => x.k === 'hit'); sk = tamSkillFx(F, e.p, nx ? nx.m : 0); const sp = F.P[e.p].sp; skAt(sk.hit - 900, () => { const a = IMG(`ex4_pc_${sp}_sk`) || tamI(`ex_pc_${sp}_act`); if (a && im) { im.src = a; clearTimeout(el._t); el._t = setTimeout(() => { im.src = tamPcPic(sp); }, 1400); } }); return; }
        el.classList.remove('act', 'far'); void el.offsetWidth; el.classList.add('act'); if (e.ri !== 1) el.classList.add('far'); fxTamDust(el);
        const a = IMG(`ex4_pc_${F.P[e.p].sp}_atk`) || tamI(`ex_pc_${F.P[e.p].sp}_act`); if (a && im) { im.src = a; clearTimeout(el._t); el._t = setTimeout(() => { im.src = tamPcPic(F.P[e.p].sp); }, 520); }   // 공격 자세(작업지시서 78)
      } else if (e.k === 'hit') {
        const el = M[e.m], d = fmt(Math.max(1, Math.round(e.d))), cr = e.cr, fromEl = actor >= 0 ? P[actor] : null, ri = actor >= 0 ? F.P[actor].ri : 1, bigHit = !!sk;
        const land = () => { el.classList.remove('hurt'); void el.offsetWidth; el.classList.add('hurt'); tamHitPic(el, F.M[e.m] && !F.M[e.m].boss ? `ex_mob_${tamReg(F.fl).k}_${F.M[e.m].i + 1}_hit` : ''); tamHitFx(el, cr, bigHit, ri); tamFloat(el, d, cr || bigHit ? 'cr' : ''); if (cr && !bigHit) { tamShake(5, 260); tamPunch(); } };
        if (bigHit) skAt(sk.hit, () => { land(); tamBars(F); }); else if (ri === 1 || !fromEl) land(); else tamShot(fromEl, el, ri, land);
      }
      else if (e.k === 'heal') { const el = P[e.p], hf = f => sk ? skAt(sk.heal, f) : f(); hf(() => { if (sk && IMG('ex4_sk_kor_heal')) { const [hx, hy] = tamAt(el, 0.55); tamFxImg('tm-pillar', IMG('ex4_sk_kor_heal'), hx, hy, [{ t: 'scaleY(.2)', opacity: 0 }, { t: 'scaleY(1)', opacity: 1, offset: 0.35 }, { dy: -10, t: 'scaleY(1.05)', opacity: 0 }], 1000); } tamFloat(el, '+' + fmt(Math.round(e.d)), 'heal'); const [x, y] = tamAt(el); tamFxImg('tm-spark', tamI('ex_fx_heal'), x, y, [{ t: 'scale(.4)', opacity: 0 }, { t: 'scale(1.2)', opacity: 1, offset: 0.4 }, { dy: -16, t: 'scale(1.4)', opacity: 0 }], 600); }); }
      else if (e.k === 'hurt') {
        const el = P[e.p], mm = M[e.m];
        if (mm) { mm.classList.remove('act'); void mm.offsetWidth; mm.classList.add('act'); const fm = F.M[e.m]; if (fm) tamHitPic(mm, fm.boss ? `ex_boss_${tamReg(F.fl).k}_atk` : `ex_mob_${tamReg(F.fl).k}_${fm.i + 1}_atk`); }   /* 장난꾸러기도 칠 때 공격 자세(작업지시서 92) */
        setTimeout(() => { el.classList.remove('hurt'); void el.offsetWidth; el.classList.add('hurt'); tamHitPic(el, `ex4_pc_${F.P[e.p].sp}_hurt`); tamFloat(el, fmt(Math.max(1, Math.round(e.d))), 'ouch'); }, 140);
      }
      else if (e.k === 'poof') { const el = M[e.m], go = () => { el.classList.add('out'); tamDropFx(el, F.fl); }; if (sk || tamSkBusy()) skAt(Math.max(sk ? sk.hit : 0, SKQ.end - 600) + 300, go); else setTimeout(go, 300); }
      else if (e.k === 'ko') P[e.p].classList.add('out');
    });
    if (!tamSkBusy()) tamBars(F);   // 필살기 연출 동안은 맞는 순간에 체력 막대를 줄여요
    const tb = $('#tmTime'); if (tb) tb.style.width = Math.max(0, 100 - F.t / (F.lim || TAM.limit) * 100) + '%';
    tamSkills(true);
  }
  function tamBars(F) {
    const P = $$('#tmP .tm-f'), M = $$('#tmM .tm-f'); if (P.length !== F.P.length || M.length !== F.M.length) return;
    const hw = (el, v) => { const w = Math.max(0, v) * 100 + '%', b = el.querySelector('.tm-hp b'), t = el.querySelector('.tm-hp s'); b.style.width = w; if (t) t.style.width = w; };   // 흰 꼬리가 조금 늦게 따라 줄어요
    F.P.forEach((p, i) => hw(P[i], p.hp / p.mx));
    F.M.forEach((m, i) => { hw(M[i], m.hp / m.mx); M[i].classList.toggle('weak', m.wk > 0); });
    if (F.M[0] && F.M[0].boss) $('#tmBossBar b').style.width = Math.max(0, F.M[0].hp / F.M[0].mx * 100) + '%';
  }
  // 과목마다 이름 있는 필살기와 따로 짠 움직임. 맞는 숫자는 움직임이 닿는 순간에 떠요
  const TM_SK = [
    { n: '펑펑 화산 실험', s: '화산 실험', d: '장난꾸러기 모두에게 큰 폭발', hit: 600 },
    { n: '회오리 돌진', s: '회오리 돌진', d: '모두를 밀어내는 돌진', hit: 640 },
    { n: '힘내라 응원가', s: '응원가', d: '탐험대 체력 회복과 노래 공격', hit: 960, heal: 300 },
    { n: '무지개 물감 폭탄', s: '무지개 폭탄', d: '모두에게 물감, 한동안 약해져요', hit: 640 },
    { n: '별빛 정답 화살', s: '별빛 화살', d: '가장 약한 하나에게 아주 큰 한 방', hit: 900 }
  ];
  // 필살기 연출 시계
  // 연출에 딸린 일(맞는 숫자, 회복, 사라짐)은 모두 이 시계로 맞춰요.
  // 연출이 도는 동안(탐험 화면을 보고 있을 때만) 겨루기는 잠깐 멈춰요(tamTick)
  const SKQ = { list: [], t0: 0, shift: 0, end: 0, cutEnd: 0, raf: 0, el: null };
  const skNow = () => performance.now() - SKQ.t0 + SKQ.shift;
  function skReset() { if (!SKQ.list.length && skNow() > SKQ.end + 50) Object.assign(SKQ, { t0: performance.now(), shift: 0, end: 0, cutEnd: 0 }); }
  function skAt(ms, f) {
    SKQ.list.push({ due: ms, f });
    if (SKQ.raf) return;
    const loop = () => {
      SKQ.raf = 0; const n = skNow(), due = SKQ.list.filter(x => x.due <= n);
      SKQ.list = SKQ.list.filter(x => x.due > n);
      due.sort((a, b) => a.due - b.due).forEach(x => { try { if (tamFxOn()) x.f(); } catch (e) { /* 연출만 빠져요 */ } });
      if (SKQ.list.length) SKQ.raf = requestAnimationFrame(loop);
    };
    SKQ.raf = requestAnimationFrame(loop);
  }
  const tamSkBusy = () => SKQ.list.length > 0 || skNow() < SKQ.end;
  // 탭을 옮기거나 다시 그릴 때: 남은 연출을 버려요(겨루기 결과는 이미 정해져 있어요)
  function tamSkStop() {
    if (SKQ.raf) cancelAnimationFrame(SKQ.raf);
    Object.assign(SKQ, { list: [], t0: performance.now(), shift: 0, end: 0, cutEnd: 0, raf: 0 });
    const c = $('#tmCut'), st = $('#tmStage'); if (c) c.hidden = true; $('#panelTam').classList.remove('tm-cutting');
    if (st) st.classList.remove('skdim', 'skcam'); if (SKQ.el) { SKQ.el.classList.remove('charge'); SKQ.el = null; }
  }
  const TM_GC = { sci: '#3FB8FF', pe: '#FF8A2A', kor: '#5CCB4A', art: '#FF5FB0', math: '#FFC21E' };   // 모으기 빛 색
  function tamCutIn(ri, sp) {
    const c = $('#tmCut'), pic = IMG(`ex4_pc_${sp}_sk`) || tamI(`ex_pc_${sp}_act`) || IMG('chr_' + sp), cb = IMG(`ex4_cut_${TAM.role[ri].k}`);
    c.hidden = false; $('#panelTam').classList.add('tm-cutting'); c.dataset.r = TAM.role[ri].k;   // 컷인 동안 오른쪽 단추는 잠깐 숨겨요
    c.style.setProperty('--cd', TAM.skCut + 'ms');
    c.classList.toggle('x4', !!cb); c.style.backgroundImage = cb ? `url("${cb}")` : '';   // 과목 컷인 띠(작업지시서 77)
    setH(c, `${pic ? `<img src="${pic}" alt="">` : ''}<span><small>${esc(TAM.role[ri].nm.split(' ')[0])} 필살기</small><b>${esc(TM_SK[ri].n)}!</b></span>`);
    c.style.animation = 'none'; void c.offsetWidth; c.style.animation = '';
  }
  function tamFlash() { const st = $('#tmStage'); st.classList.remove('flash'); void st.offsetWidth; st.classList.add('flash'); }
  function tamBigImg(src, x, y, kf, ms, cls) { return tamFxImg(cls || 'tm-bigs', src, x, y, kf, ms, 'cubic-bezier(.2,.8,.3,1)'); }
  // 필살기 세 박자: 모으기(TAM.skCharge) → 컷인(TAM.skCut, 처음 본 과목은 건너뛰기 단추) → 큰 움직임 → 잔상.
  // 돌려주는 값: 연출 시계로 맞는 때(hit)와 회복되는 때(heal)
  function tamSkillFx(F, pi, tgt) {
    skReset(); const P = $$('#tmP .tm-f'), el = P[pi], p = F.P[pi], ri = p.ri, S0 = TM_SK[ri], st = $('#tmStage');
    const t0 = Math.max(skNow(), SKQ.end), seen = (S.tam.skSeen >> ri) & 1, off = !!S.tam.skOff && S.tam.skSeen > 0, cutEnd = off ? t0 : t0 + TAM.skCharge + TAM.skCut, eb = cutEnd;
    const hitAt = eb + S0.hit * TAM.skFx, healAt = eb + (S0.heal || S0.hit) * TAM.skFx;
    SKQ.end = hitAt + TAM.skTail;
    const at = (ms, f) => skAt(eb + ms * TAM.skFx, f);
    // 1. 모으기: 대원이 빛나고 둘레에서 과목 조각이 모여요
    if (off) skAt(t0, () => { SKQ.cutEnd = cutEnd; st.classList.add('skdim'); sfx('quest'); if (!seen) { S.tam.skSeen |= 1 << ri; save(); } });
    else skAt(t0, () => {
      SKQ.cutEnd = cutEnd; SKQ.el = el; st.classList.add('skdim'); sfx('quest');
      if (!el) return;
      if (!rt.reduced) { const a = st.getBoundingClientRect(), r = el.getBoundingClientRect(), cam = st.querySelector('.tm-cam');   // 필살기: 쓰는 대원 쪽으로 다가가요(2배 빠르기면 절반)
        if (cam && a.width) { cam.style.transformOrigin = `${((r.left + r.width / 2 - a.left) / a.width * 100).toFixed(1)}% ${((r.top + r.height * 0.6 - a.top) / a.height * 100).toFixed(1)}%`; st.style.setProperty('--skz', tamSpdOn() ? 1.07 : 1.14); st.classList.add('skcam'); setTimeout(() => st.classList.remove('skcam'), Math.max(400, cutEnd - t0 + 250)); } } el.classList.add('charge'); el.style.setProperty('--cc', TM_GC[TAM.role[ri].k]);
      { const im = el.querySelector('img'), u = IMG(`ex4_pc_${p.sp}_sk`); if (im && u) { im.src = u; clearTimeout(el._t); el._t = setTimeout(() => { im.src = tamPcPic(p.sp); }, TAM.skCharge + TAM.skCut + 900); } }   // 필살기 자세
      { const cu = IMG(`ex4_sk_${TAM.role[ri].k}_charge`); if (cu) { const [cx, cy] = tamAt(el, 0.6); tamFxImg('tm-ring', cu, cx, cy, [{ t: 'scale(.3) rotate(0deg)', opacity: 0 }, { t: 'scale(1) rotate(60deg)', opacity: 1, offset: 0.4 }, { t: 'scale(1.15) rotate(120deg)', opacity: 0 }], TAM.skCharge + 500); } }
      const [x, y] = tamAt(el, 0.5), sm = tamI(`ex_fx_${TAM.role[ri].k}`), r = st.getBoundingClientRect().width * 0.2;
      for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2; tamFxImg('tm-note', sm, x, y, [{ dx: Math.cos(a) * r, dy: Math.sin(a) * r, t: 'scale(1)', opacity: 0 }, { dx: Math.cos(a + 1) * r * 0.45, dy: Math.sin(a + 1) * r * 0.45, t: 'scale(.8)', opacity: 1, offset: 0.55 }, { t: 'scale(.2)', opacity: 0 }], TAM.skCharge, 'ease-in'); }
    });
    // 2. 컷인: 들어와서 멈춰 이름을 읽고 빠져나가요
    if (!off) { skAt(t0 + TAM.skCharge, () => { tamCutIn(ri, p.sp); buzz(25); });
      skAt(cutEnd, () => { $('#tmCut').hidden = true; $('#panelTam').classList.remove('tm-cutting'); if (el) el.classList.remove('charge');
        if (!seen) { S.tam.skSeen |= 1 << ri; save(); tamRenderTop(); } }); }
    skAt(SKQ.end, () => { if (skNow() >= SKQ.end - 5) st.classList.remove('skdim', 'skcam'); });
    if (!el) return { hit: hitAt, heal: healAt };
    // 3. 큰 움직임
    at(0, () => { el.classList.remove('cast'); void el.offsetWidth; el.classList.add('cast'); setTimeout(() => el.classList.remove('cast'), 1100); });
    const fxr = () => $('#tmFx').getBoundingClientRect(), A = () => tamAt(el, 0.45);
    const MC = () => { const L = $$('#tmM .tm-f:not(.out)'), fx = fxr(); return L.length ? L.map(m => tamAt(m, 0.5)).reduce((a, b) => [a[0] + b[0] / L.length, a[1] + b[1] / L.length], [0, 0]) : [fx.width * 0.72, fx.height * 0.6]; };
    // 새 필살기 조각(작업지시서 77)이 있으면 먼저: 과학 폭발과 거품, 체육 회오리와 잎, 국어 노래 고리와 음표, 미술 물감 튐과 방울, 수학 별 폭발과 별
    const X4 = { sci: ['boom', 'bubble'], pe: ['tornado', 'leaf'], kor: ['ring', 'note'], art: ['splash', 'drop'], math: ['burst', 'star'] }[TAM.role[ri].k], x4 = n => IMG(`ex4_sk_${TAM.role[ri].k}_${n}`);
    const big = x4(X4[0]) || tamI(`ex_fx_${TAM.role[ri].k}_big`), small = x4(X4[1]) || tamI(`ex_fx_${TAM.role[ri].k}`);
    if (ri === 0) {   // 과학: 플라스크가 높이 날아가 가운데에서 펑, 거품이 한 번 더
      at(0, () => { const [ax, ay] = A(), mc = MC(), fx = fxr(); tamFxImg('tm-shot big', x4('throw') || small, ax, ay, [{ t: 'scale(.6) rotate(0deg)' }, { dx: (mc[0] - ax) / 2, dy: -fx.height * 0.45, t: 'scale(1.3) rotate(300deg)', offset: 0.5 }, { dx: mc[0] - ax, dy: mc[1] - ay, t: 'scale(1) rotate(620deg)' }], 560, 'ease-in-out'); });
      at(560, () => { const mc = MC(); tamFlash(); tamShake(10, 600); tamPunch(); tamBigImg(big, mc[0], mc[1], [{ t: 'scale(.2)', opacity: 1 }, { t: 'scale(1.25)', opacity: 1, offset: 0.3 }, { t: 'scale(1.35)', opacity: 1, offset: 0.7 }, { t: 'scale(1.6)', opacity: 0 }], 1500); });
      at(860, () => { const mc = MC(); tamBigImg(big, mc[0] + 20, mc[1] - 14, [{ t: 'scale(.2)', opacity: 1 }, { t: 'scale(.9)', opacity: 1, offset: 0.4 }, { t: 'scale(1.1)', opacity: 0 }], 1100); });
    } else if (ri === 1) {   // 체육: 빙글빙글 가로질러 달려가 세 번 들이받고 돌아와요(잔상)
      at(0, () => { const [ax] = A(), mc = MC(), dx = Math.max(40, mc[0] - ax + 10);
        el.animate([{ transform: 'translateX(-50%) scale(var(--dz,1))' }, { transform: `translateX(calc(-50% + ${dx}px)) scale(var(--dz,1))`, offset: 0.3 }, { transform: `translateX(calc(-50% + ${dx}px)) scale(var(--dz,1))`, offset: 0.75 }, { transform: 'translateX(-50%) scale(var(--dz,1))' }], { duration: 1300, easing: 'cubic-bezier(.5,0,.3,1)' });
        { const d4 = x4('dash'); if (d4) { const [, ay] = A(); tamFxImg('tm-sweep4', d4, ax + dx / 2, ay, [{ t: 'scaleX(.2)', opacity: 0 }, { t: 'scaleX(1)', opacity: 1, offset: 0.3 }, { t: 'scaleX(1.1)', opacity: 0 }], 900); } }
        const im = el.querySelector('img'); for (let k = 1; k <= 4; k++) setTimeout(() => { const [gx, gy] = tamAt(el, 0.5); tamFxImg('tm-ghost', im.src, gx, gy, [{ opacity: 0.55, t: 'scale(1)' }, { opacity: 0, t: 'scale(1.05)' }], 380); }, k * 70); });
      for (let k = 0; k < 3; k++) at(400 + k * 240, () => { const mc = MC(); tamShake(7, 320); tamPunch(); tamBigImg(big, mc[0], mc[1], [{ t: `scale(.5) rotate(${-20 + k * 30}deg)`, opacity: 1 }, { t: `scale(1.25) rotate(${10 + k * 30}deg)`, opacity: 0 }], 900); $$('#tmM .tm-f:not(.out)').forEach(m => { m.classList.remove('kb'); void m.offsetWidth; m.classList.add('kb'); }); });
    } else if (ri === 2) {   // 국어: 노래 고리가 여러 번 퍼지고 음표가 장난꾸러기에게
      const PC = () => { const L = $$('#tmP .tm-f'); return L.map(e => tamAt(e, 0.5)).reduce((a, b) => [a[0] + b[0] / L.length, a[1] + b[1] / L.length], [0, 0]); };
      for (let k = 0; k < 3; k++) at(k * 260, () => { const pc = PC(); tamBigImg(big, pc[0], pc[1], [{ t: 'scale(.3) rotate(0deg)', opacity: 0.9 }, { t: 'scale(1.1) rotate(90deg)', opacity: 0.9, offset: 0.5 }, { t: 'scale(1.4) rotate(140deg)', opacity: 0 }], 1300, 'tm-bigs ring'); });
      at(0, () => $$('#tmP .tm-f').forEach((e, k) => { e.classList.add('glow'); setTimeout(() => e.classList.remove('glow'), 1500); const [x, y] = tamAt(e, 0.3); for (let j = 0; j < 2; j++) setTimeout(() => tamFxImg('tm-note', small, x + (j ? 12 : -12), y, [{ t: 'scale(.4)', opacity: 0 }, { dy: -30, t: 'scale(1)', opacity: 1, offset: 0.4 }, { dy: -60, dx: j ? 10 : -10, t: 'scale(.8)', opacity: 0 }], 1200), k * 90 + j * 200); }));
      at(560, () => { const pc = PC(); $$('#tmM .tm-f:not(.out)').forEach((m, k) => { const [x, y] = tamAt(m, 0.45); for (let j = 0; j < 3; j++) setTimeout(() => tamFxImg('tm-shot', small, pc[0], pc[1], [{ t: 'scale(.6)' }, { dx: (x - pc[0]) / 2, dy: (y - pc[1]) / 2 + (j - 1) * 18, t: 'scale(1)', offset: 0.5 }, { dx: x - pc[0], dy: y - pc[1], t: 'scale(1.1)' }], 380, 'linear'), k * 60 + j * 110); }); });
    } else if (ri === 3) {   // 미술: 물감 비가 내리고 무지개 붓이 화면을 쓸어요
      at(0, () => $$('#tmM .tm-f:not(.out)').forEach((m, k) => { const [x, y] = tamAt(m, 0.45); for (let j = 0; j < 4; j++) setTimeout(() => tamFxImg('tm-shot', small, x + (Math.random() - 0.5) * 40, y, [{ dy: -fxr().height * 0.5, t: 'scale(.6)' }, { t: 'scale(1)' }], 420, 'ease-in'), k * 110 + j * 90); }));
      at(420, () => { const fx = fxr(), W = fx.width, mc = MC(), b2 = document.createElement('img'); b2.className = 'tm-sweep'; b2.src = x4('stroke') || big || ''; b2.alt = ''; $('#tmFx').appendChild(b2);
        const sh = W * 0.9 * ((b2.naturalHeight && b2.naturalWidth) ? b2.naturalHeight / b2.naturalWidth : 0.45), sy = mc[1] - sh / 2;   // 붓 가운데가 장난꾸러기 가운데를 지나가게
        b2.animate([{ transform: `translate(${-W * 0.6}px,${sy}px) rotate(-8deg) scale(.9)`, opacity: 0 }, { transform: `translate(${W * 0.15}px,${sy}px) rotate(-4deg) scale(1.05)`, opacity: 1, offset: 0.45 }, { transform: `translate(${W * 0.3}px,${sy}px) rotate(-2deg) scale(1.08)`, opacity: 1, offset: 0.7 }, { transform: `translate(${W * 0.55}px,${sy}px) rotate(0deg) scale(1.1)`, opacity: 0 }], { duration: 1300, easing: 'ease-out', fill: 'forwards' }).onfinish = () => b2.remove(); });
      at(620, () => { tamShake(5, 300); $$('#tmM .tm-f:not(.out)').forEach(m => { m.classList.remove('paint'); void m.offsetWidth; m.classList.add('paint'); if (x4('splash')) { const [x, y] = tamAt(m, 0.5); tamBigImg(x4('splash'), x, y, [{ t: 'scale(.2) rotate(-20deg)', opacity: 1 }, { t: 'scale(.75) rotate(5deg)', opacity: 1, offset: 0.35 }, { t: 'scale(.85)', opacity: 0 }], 1100, 'tm-bigs sm'); } }); });
    } else {   // 수학: 별이 대원 둘레를 돌다가, 가장 약한 장난꾸러기에 과녁, 하늘에서 별 화살
      const T0 = () => $$('#tmM .tm-f')[tgt] || $$('#tmM .tm-f:not(.out)')[0];
      at(0, () => { const [ax, ay] = A(), r = fxr().width * 0.12; for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; tamFxImg('tm-note', small, ax, ay, [{ t: 'scale(.2)', opacity: 0 }, { dx: Math.cos(a) * r, dy: Math.sin(a) * r, t: 'scale(1)', opacity: 1, offset: 0.4 }, { dx: Math.cos(a + 1.6) * r, dy: Math.sin(a + 1.6) * r, t: 'scale(1)', opacity: 1, offset: 0.8 }, { t: 'scale(.2)', opacity: 0 }], 700); } });
      at(300, () => { const tg = T0(); if (!tg) return; const [tx, ty] = tamAt(tg, 0.5), r = document.createElement('i'); r.className = 'tm-aim'; $('#tmFx').appendChild(r); r.style.transform = `translate(${tx - 30}px,${ty - 30}px)`; setTimeout(() => r.remove(), 900); });
      at(700, () => { const tg = T0(); if (!tg) return; const [tx, ty] = tamAt(tg, 0.5), ar = x4('arrow');
        if (ar) { const [ax, ay] = A(), ang = Math.atan2(ty - ay, tx - ax) * 180 / Math.PI; tamFxImg('tm-arrow4', ar, ax, ay, [{ t: `rotate(${ang}deg) scale(.6)`, opacity: 1 }, { dx: tx - ax, dy: ty - ay, t: `rotate(${ang}deg) scale(1)`, opacity: 1 }], 200, 'ease-in'); }
        else tamBigImg(big, tx, ty, [{ dy: -fxr().height * 0.9, t: 'scale(.7) rotate(-30deg)', opacity: 1 }, { dy: 0, t: 'scale(1.1) rotate(0deg)', opacity: 1, offset: 0.7 }, { t: 'scale(1.6)', opacity: 0 }], 420, 'tm-bigs star'); });
      at(880, () => { const tg = T0(); if (!tg || !x4('burst')) return; const [tx, ty] = tamAt(tg, 0.5); tamBigImg(big, tx, ty, [{ t: 'scale(.2)', opacity: 1 }, { t: 'scale(1.1)', opacity: 1, offset: 0.35 }, { t: 'scale(1.3)', opacity: 0 }], 900); });
      at(880, () => { tamFlash(); tamShake(9, 480); tamPunch(); });
    }
    // 잔상: 과목 조각이 천천히 흩어져 내려요(겨루기는 기다리지 않아요)
    at(S0.hit + 150, () => { const mc = MC(), w = fxr().width; for (let k = 0; k < 10; k++) tamFxImg('tm-note', small, mc[0] + (Math.random() - 0.5) * w * 0.4, mc[1] - 40 - Math.random() * 30, [{ t: 'scale(.7) rotate(0deg)', opacity: 0 }, { t: 'scale(.8)', opacity: 0.9, offset: 0.15 }, { dy: 50 + Math.random() * 40, dx: (Math.random() - 0.5) * 30, t: `scale(.6) rotate(${Math.round(Math.random() * 240 - 120)}deg)`, opacity: 0 }], 1800 + Math.random() * 600, 'ease-in'); });
    return { hit: hitAt, heal: healAt };
  }
  function tamRibbon(kind, tx) {
    const r = $('#tmRib'); if (!r) return;
    const u = kind === 'lose' ? '' : IMG(kind === 'boss' ? 'ex_ribbon_boss' : 'ex_ribbon_clear');
    r.className = 'tm-rib ' + kind; r.style.backgroundImage = u ? `url("${u}")` : ''; r.textContent = tx; r.hidden = false;
    r.style.animation = 'none'; void r.offsetWidth; r.style.animation = '';
    clearTimeout(r._t); r._t = setTimeout(() => { r.hidden = true; }, 1300);
    if (kind === 'clear') sfx('coin');
  }
  // 걷기: 탐험대가 오른쪽으로 걸어가고 배경이 왼쪽으로 흘러요
  function tamSpdK() { return tamSpdOn() ? 2 : 1; }
  function tamWalk(fl) {
    const st = $('#tmStage'), T = rt.tam; if (!st || !T) return;
    const R = tamReg(fl), cur = $('.tm-bg.cur', st), bg = tamBg(fl);
    if (!T.climbing) { cur.getAnimations().forEach(a => a.cancel()); tamBgPaint(cur, fl); }
    st.dataset.reg = R.k; st.classList.toggle('hm', tamHOn()); st.classList.toggle('deep', tamLap(fl) > 0); st.classList.remove('boss'); $('#tmBossBar').hidden = true;
    tamAmb(R.k); tamTower(fl); tamFl(fl);
    const team = tamTeam(), pp = $('#tmP');
    pp.dataset.fid = 'walk';
    setH(pp, team.map((p, i) => { const [x, y] = TM_PPOS[i] || TM_PPOS[0];
      return `<div class="tm-f" data-i="${i}" style="left:${x}%;bottom:${y + TM_UP}%;z-index:${30 - y};${tamDz(y)}--bd:-${(i * 0.13).toFixed(2)}s"><div class="tm-body"><img src="${tamPcPic(p.sp)}" alt="${esc(spName(p.sp))}"></div><i class="tm-hp"><s></s><b style="width:100%"></b></i></div>`; }).join(''));
    setH($('#tmM'), ''); $('#tmM').dataset.fid = '';
    if (T.nLose) pp.classList.add('enter'); else pp.classList.remove('enter');
    pp.classList.add('walking'); clearTimeout(pp._t); const ms = TAM.ph.walk / tamSpdK() * 1000; pp._t = setTimeout(() => pp.classList.remove('walking', 'enter'), ms);
    st.classList.toggle('lay', !!tamLay(fl)); { const lu = IMG('ex5_light'); if (lu) st.style.setProperty('--ex5-light', `url("${lu}")`); }
    const L = tamLay(fl), wo = { duration: ms, easing: 'cubic-bezier(.3,0,.6,1)', fill: 'forwards' };
    if (!T.climbing && !rt.reduced) {
      if (L) {   // 겹마다 다른 빠르기: 먼 풍경은 천천히, 바닥은 조금 빠르게, 앞 장식은 가장 빠르게
        const far = cur.querySelector('.ly.far'), flo = cur.querySelector('.ly.floor');
        if (far) { far.getAnimations().forEach(a => a.cancel()); far.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-12%)' }], wo); }
        if (flo) { flo.getAnimations().forEach(a => a.cancel()); flo.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-9%)' }], wo); }
      } else cur.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-16%)' }], wo);
    }
    if (tamG6(fl) && !T.climbing) fxgRun(ms, FXG.W * 0.55);   // 걷는 동안 길을 따라 조금씩
    { const fg = $('#tmFg'), fu = (L && L.front) || IMG('ex4_fg_' + R.k) || tamI('ex_fg_' + R.k); if (fg) { fg.getAnimations().forEach(a => a.cancel()); fg.classList.toggle('lay', !!(L && L.front)); fg.style.backgroundImage = fu ? `url("${fu}")` : ''; if (fu && !rt.reduced) fg.animate([{ transform: 'translateX(0)' }, { transform: L && L.front ? 'translateX(-7%)' : 'translateX(-24%)' }], wo); } }
    $('#tmTime').style.width = '100%'; tamCam(false);
    tamSkills();
  }
  // 만남: 앞 대원 머리 위에 느낌표
  function tamAlert() {
    const f = $('#tmP .tm-f'); if (!f) return;
    const a = document.createElement('b'); a.className = 'tm-alert'; a.textContent = '!'; f.appendChild(a); setTimeout(() => a.remove(), 900);
  }
  // 이김: 대원들이 기뻐 뛰고, 50층은 보물 상자, 10층마다 깃발
  function tamVictory(fl) {
    const st = $('#tmStage'); if (!st) return;
    $$('#tmP .tm-f:not(.out)').forEach((el, i) => { const im = el.querySelector('img'), sp = tamTeam()[+el.dataset.i]; el.classList.remove('cheer'); void el.offsetWidth; el.classList.add('cheer');
      const a = sp && tamI(`ex_pc_${sp.sp}_act`); if (a && im) { im.src = a; setTimeout(() => { im.src = tamPcPic(sp.sp); }, 900); } });
    if (fl % 50 === 0) { const c = tamI(fl % 150 === 0 ? 'ex_chest_gold' : fl % 100 === 0 ? 'ex_chest_silver' : 'ex_chest_wood'); if (c) { const im = document.createElement('img'); im.className = 'tm-chest'; im.src = c; im.alt = ''; st.appendChild(im); setTimeout(() => im.remove(), 1400); } }
    else if (fl % TAM.bossEvery === 0 && tamI('ex_flag')) { const im = document.createElement('img'); im.className = 'tm-flag'; im.src = tamI('ex_flag'); im.alt = ''; $('#tmFx').appendChild(im); setTimeout(() => im.remove(), 1400); }
  }
  // 사건 카드
  function tamEvShow(E) {
    const c = $('#tmEv'); if (!c || !E) return;
    const ic = E.k === 'lost' ? (tamI(`ex_pc_${E.sp}_idle`) || IMG('chr_' + E.sp)) : tamI(E.ic);
    setH(c, `<div class="tm-evc">${ic ? `<img src="${ic}" alt="">` : ''}<p>${esc(E.k === 'lost' ? `길 잃은 아기 ${eul(spName(E.sp))} 만났어요` : E.t)}</p>` +
      `<div class="tm-evb">${E.o.map((o, i) => `<button type="button" class="${i ? 'btn-sub' : 'cta'} small" data-tev="${i}">${esc(o)}</button>`).join('')}</div><i class="tm-evt" style="animation-duration:${TAM.ph.ev / tamSpdK()}s"></i></div>`);
    c.hidden = false;
  }
  // 지금 단계에 맞게 화면을 다시 그려요(탭을 열었을 때)
  function tamSync() {
    const T = rt.tam; if (!T || !T.ph) { tamWalk(tamCurFl()); return; }
    const c = $('#tmEv'); if (c) c.hidden = T.ph !== 'event';
    if (T.ph === 'meet' || T.ph === 'fight') { tamBuild(); tamCam(true); }
    else if (T.ph === 'event') { tamWalk(tamCurFl()); tamEvShow(T.ev); $('#tmP').classList.remove('walking'); }
    else { tamWalk(tamCurFl()); $('#tmP').classList.remove('walking'); }
  }
  // 오르기: 탐험대가 뛰어오르고 무대가 아래로 흘러 다음 층이 위에서 내려와요
  // 오르는 길: 같은 지역 안에서는 대원이 사선 길을 따라 오른쪽 위로 달리고 바닥이 왼쪽 아래로 흘러요(10층마다 아치문)
  function tamClimbG6(best) {
    const st = $('#tmStage'), T = rt.tam, next = best + 1, pp = $('#tmP'), ms = TAM.ph.climb / tamSpdK() * 900;
    T.climbing = true; pp.classList.remove('jump', 'enter'); pp.classList.add('walking', 'runup');
    st.classList.remove('climb'); void st.offsetWidth; st.classList.add('climb');
    fxgRun(ms, Math.hypot(FXG.W, FXG.H / FXG_SQ) * 0.6, next % TAM.bossEvery === 0);
    fxgHeight(next);
    { const fg = $('#tmFg'); if (fg && fg.animate) { fg.getAnimations().forEach(x => x.cancel()); fg.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate(-12%,7%)', opacity: 0, offset: 0.6 }, { transform: 'translate(10%,-6%)', opacity: 0, offset: 0.61 }, { transform: 'none', opacity: 1 }], { duration: ms, easing: 'ease-in-out' }); } }
    setTimeout(() => { T.climbing = false; st.classList.remove('climb'); pp.classList.remove('walking', 'runup'); }, ms);
    tamFl(next, true); tamTower(next); st.classList.remove('boss'); $('#tmBossBar').hidden = true;
    setH($('#tmM'), ''); sfx('tap');
  }
  function tamClimb(best) {
    const st = $('#tmStage'), T = rt.tam; if (!st || !T) return;
    if (!rt.reduced && st.classList.contains('g6') && tamReg(best + 1).k === tamReg(best).k && fxgOn(best + 1) && FXG.floor) { tamClimbG6(best); return; }
    fxgHide();   // 지역이 바뀌는 오르기는 예전처럼 무대가 통째로 바뀌어요(새 지역 바닥은 다음 걷기에서)
    const next = best + 1, cur = $('.tm-bg.cur', st), nx = $('.tm-bg.nx', st), bg = tamBg(next);
    cur.getAnimations().forEach(a => a.commitStyles && a.commitStyles()); cur.getAnimations().forEach(a => a.cancel());
    tamBgPaint(nx, next); T.climbing = true; st.classList.toggle('lay', !!tamLay(next));
    $('#tmP').classList.remove('jump'); void st.offsetWidth; $('#tmP').classList.add('jump');
    st.classList.remove('climb'); void st.offsetWidth; st.classList.add('climb');
    const o = { duration: TAM.ph.climb / tamSpdK() * 900, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' }, x0 = cur.style.transform || 'translateX(0)';
    cur.animate([{ transform: x0 }, { transform: x0 + ' translateY(100%)' }], o);
    const a = nx.animate([{ transform: 'translateY(-100%)' }, { transform: 'translateY(0)' }], o);
    { const fg = $('#tmFg'); if (fg) { const x = getComputedStyle(fg).transform; fg.animate([{ transform: x === 'none' ? 'none' : x, opacity: 1 }, { transform: (x === 'none' ? '' : x + ' ') + 'translateY(120%)', opacity: 0 }], { duration: o.duration, easing: o.easing, fill: 'forwards' }); } }
    a.onfinish = () => { cur.style.transform = ''; cur.style.backgroundImage = nx.style.backgroundImage; cur.innerHTML = nx.innerHTML; cur.dataset.lay = nx.dataset.lay || ''; cur.getAnimations().forEach(x => x.cancel()); a.cancel(); T.climbing = false; st.classList.remove('climb'); $('#tmP').classList.remove('jump'); };
    tamFl(next, true); tamTower(next); st.dataset.reg = tamReg(next).k; tamAmb(tamReg(next).k); st.classList.remove('boss'); $('#tmBossBar').hidden = true;
    setH($('#tmM'), ''); sfx('tap');
  }

  // 대원 얼굴 줄: 필살기 게이지가 차면 반짝, 누르면 필살기
  function tamSkills(upd) {
    const box = $('#tmSk'), F = rt.tam && rt.tam.F; if (!box) return;
    const P = F ? F.P : tamTeam().map(s => ({ ...s, g: 0, hp: 1 }));
    if (!upd || box.children.length !== P.length) setH(box, P.map((p, i) => `<button type="button" class="tm-sk" data-tsk="${i}" aria-label="${esc(spName(p.sp))} 필살기 ${esc(TM_SK[p.ri].n)}"><img src="${IMG('chr_' + p.sp) || ''}" alt=""><i></i><small>${esc(TM_SK[p.ri].s)}</small></button>`).join(''));
    $$('.tm-sk', box).forEach((b, i) => { const p = P[i]; if (!p) return; const r = Math.min(1, p.g / TAM.gauge); b.style.setProperty('--g', (r * 100).toFixed(0) + '%'); b.classList.toggle('ready', r >= 1 && p.hp > 0); b.classList.toggle('out', p.hp <= 0); });
    if (F && !rt.tamTip && S.tam.best < 2 && P.some(p => p.hp > 0 && p.g >= TAM.gauge)) { rt.tamTip = 1; tamToast('게이지가 다 찼어요!\n반짝이는 대원 얼굴을 눌러요'); }   // 처음 1~2층 안내(켤 때마다 한 번)
  }
  function tamCast(i) {
    const F = rt.tam && rt.tam.F; if (!F) return;
    if (tamCastAt(F, F.P[i])) { tamDraw(F); F.ev.length = 0; }
  }
  function tamRenderTop() {
    if (!tamOn()) return;
    tamHSync(); const hm = tamHOn(), fl = tamCurFl(), R = tamReg(fl), lap = hm ? 0 : tamLap(fl);
    $('#tmReg').textContent = R.nm + (lap ? ` (${lap + 1}바퀴째)` : '');
    $('#tmFl').textContent = tamFlTx(fl, hm);
    { const md = $('#tmMode'); md.hidden = !tamHOpen(); $$('[data-tmm]', md).forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.tmm === (hm ? 1 : 0)))); }   // 심화 탐험
    $('#tmBest').innerHTML = hm ? `<span>심화 최고</span>${fmt(S.tam.hb)}층` : (S.tam.best ? `<span>최고층</span>${fmt(S.tam.best)}층` : '<span>첫 탐험</span>') + (isFinite(tamCap()) ? `<small class="tm-cap">${tamCapped() ? '이번 학기 끝! 심화 탐험으로 가요' : `이번 학기 ${fmt(tamCap())}층까지`}</small>` : '');
    { const pw = tamPow(), el = $('#tmPow'), fu = tamI('ex_flag');   // 탐험대 힘 칸: 깃발 그림과 큰 숫자, 힘이 오르면 한 번 들썩
      setH(el, `${fu ? `<img src="${fu}" alt="">` : ''}<span><small>탐험대 힘</small><b>${fmt(pw)}</b></span>`); el.setAttribute('aria-label', `탐험대 힘 ${fmt(pw)}`);
      if (rt.tamPw && pw > rt.tamPw) { el.classList.remove('up'); void el.offsetWidth; el.classList.add('up'); }
      rt.tamPw = pw; }
    tamAdDay();
    // 오른쪽 둥근 단추(그림, 짧은 이름, 남은 횟수). 읽어 주는 이름은 aria-label에 길게
    const rb = (el, ic, nm, sub, ad, lab) => { const k = [ic, nm, sub, ad].join('|'); if (el._k !== k) { el._k = k; const u = IMG(ic), a = ad && IMG('ex4_ic_ad'); setH(el, `${a ? `<img class="tm-adb" src="${a}" alt="">` : ''}${u ? `<img src="${u}" alt="">` : ''}<small>${esc(nm)}</small>${sub ? `<em>${esc(sub)}</em>` : ''}`); } el.setAttribute('aria-label', lab); };
    const sb = $('#tmSpd'); sb.classList.toggle('on', tamSpdOn());
    const left = TAM.adSpd.n - S.tam.ad.spd;
    rb(sb, 'ex4_ic_speed', tamSpdOn() ? hms(S.tam.spd.sec * 1000) : '광고 2배속', `${left}`, !tamSpdOn() || left > 0, tamSpdOn() ? `2배속 ${hms(S.tam.spd.sec * 1000)} 남음` : `광고 보고 2배속 ${TAM.adSpd.min}분, 오늘 ${left}번 남음`);
    const ab = $('#tmAuto'); ab.hidden = !tamAutoOn(); ab.setAttribute('aria-pressed', S.tam.auto ? 'true' : 'false'); rb(ab, 'ex4_ic_auto', S.tam.auto ? '필살기 자동' : '필살기 수동', '', false, S.tam.auto ? '필살기 자동 켬' : '필살기 자동 끔');
    { const so = $('#tmSkOff'); so.hidden = !S.tam.skSeen; so.setAttribute('aria-pressed', S.tam.skOff ? 'true' : 'false'); rb(so, 'ex4_ic_report', S.tam.skOff ? '연출 짧게' : '연출 보기', '', false, S.tam.skOff ? '필살기 연출 건너뛰기 켬' : '필살기 연출 건너뛰기 끔'); }   // 필살기를 한 번 본 뒤에 생겨요
    { const sk = $('#tmSkip'), to = tamSkipTo(); sk.hidden = !to; if (to) { rb(sk, 'ex_flag', '빠르게 넘기', `${fmt(to)}층`, false, `빠르게 넘기: ${fmt(to)}층까지 한 번에 넘어가요`);
      if (rt.tamSkTo !== to && (!rt.tamSkTo || to > rt.tamSkTo + 9)) tamToast(`누르면 ${fmt(to)}층까지 빠르게 넘길 수 있어요`); } rt.tamSkTo = to; }
    const T = rt.tam, rv = $('#tmRevive'), cl = tamCheerLeft(); rv.hidden = !(S.tam.cheer > 0 || (T && T.lose && cl > 0));   // 지면 응원 단추, 응원 중에는 남은 층
    rb(rv, 'ex4_ic_cheer', S.tam.cheer > 0 ? `응원 ${S.tam.cheer}층` : '응원', S.tam.cheer > 0 ? '' : `${cl}`, S.tam.cheer <= 0, S.tam.cheer > 0 ? `응원 ${S.tam.cheer}층 남음` : `광고 보고 응원 받기 힘 +${Math.round((TAM.cheer.mul - 1) * 100)}%, 오늘 ${cl}번 남음`); rv.classList.toggle('on', S.tam.cheer > 0);
    tamAcorn(true);
    const I = tamIdle(), rp = $('#tmRep'); rp.hidden = I.sec < 60; rp.textContent = `탐험 보고서 받기 (${Math.floor(I.sec / 60)}분)`;
  }
  // 강화 추천과 자동 편성
  const tamScore = s => s.atk * 6 / s.cd + s.hp / 4;
  // 자동 편성: 과목마다 가장 센 대원 한 명씩 먼저(여러 과목이 함께), 지역에서 유리한 과목과 체육, 국어를 먼저 챙기고 남는 칸은 힘 순
  function tamAutoTeam() {
    const av = tamAvail().map(sp => tamStat(sp)).sort((a, b) => tamScore(b) - tamScore(a)), n = tamSlots(), adv = tamAdvRi();
    const best = [0, 1, 2, 3, 4].map(ri => av.find(p => p.ri === ri)).filter(Boolean);
    const pri = ri => ri === adv ? 0 : ri === 1 ? 1 : ri === 2 ? 2 : 3;
    best.sort((a, b) => pri(a.ri) - pri(b.ri) || tamScore(b) - tamScore(a));
    const pick = best.slice(0, n);
    for (const p of av) { if (pick.length >= n) break; if (!pick.includes(p)) pick.push(p); }
    return pick.map(p => p.sp);
  }
  // 자동 편성이 지금보다 센 조합이면 얼마나 세지는지(아니면 0). 대원 단추와 아래 메뉴에 표시해요
  function tamAutoGain() {
    const keep = S.tam.party, p0 = tamPow(), auto = tamAutoTeam();
    if (auto.length === tamParty().length && auto.every(k => keep.includes(k))) return 0;
    S.tam.party = auto; const p1 = tamPow(); S.tam.party = keep;
    return p1 > p0 ? p1 - p0 : 0;
  }
  function tamPowWith(fn) { const st = JSON.stringify([S.tam.mem, S.tam.sg]); fn(); const v = tamPow(); const [m, g] = JSON.parse(st); S.tam.mem = m; S.tam.sg = g; return v; }
  // 가장 이득이 큰 강화: 대원은 도토리 한 개당 힘, 장비는 지금 살 수 있는 것 가운데 힘이 가장 많이 느는 것
  function tamUpRec() {
    const p0 = tamPow(); let mem = null, gear = null;
    for (const sp of tamAvail()) { const c = tamLvCost(sp), g = tamPowWith(() => { tamMem(sp).lv += 1; }) - p0; const v = g / Math.max(1, c); if (!mem || v > mem.v) mem = { sp, c, g, v }; }
    const nP = tamParty().length;
    for (let i = 0; i < nP; i++) for (const G of TAM.gear) { const c = tamGearCost(G.k, i); if (S.tam.mat[c.m] < c.n || S.tam.mat[3] < c.star) continue; const g = tamPowWith(() => { S.tam.sg[i][G.k] += 1; }) - p0; if (!gear || g > gear.g) gear = { k: G.k, i, g, c }; }
    return { mem, gear };
  }
  const TM_RC = { sci: '#BDEBFF', pe: '#FFD0B0', kor: '#D8F5C6', art: '#FFD3EE', math: '#FFF0A8' };
  const tamMatImg = i => IMG(['ex_mat_twig', 'ex_mat_stone', 'ex_mat_petal', 'ex_mat_star'][i]);
  const tamMatIc = (i, px) => { const u = tamMatImg(i); return u ? `<img class="tm-mi" src="${u}" alt="${TAM.mats[i]}" style="width:${px}px;height:${px}px">` : TAM.matIc[i]; };
  function tamTabs(seg, rec) {
    const can = rec.mem && S.budget >= rec.mem.c || tamAutoGain() > 0, gc = !!rec.gear;   // 더 센 조합이 있어도 대원에 빨간 점
    const ic = { mem: tamI(`ex_pc_${tamParty()[0] || 'bear'}_idle`) || IMG('chr_bear'), gear: IMG('ex_gear_tool_1'), mat: IMG('ex_mat_star') };
    setH($('#tmSeg'), [['mem', '대원', can], ['gear', '장비', gc], ['mat', '재료', false]].map(([k, n, dot]) =>
      `<button type="button" data-tseg="${k}" aria-pressed="${seg === k}">${ic[k] ? `<img src="${ic[k]}" alt="">` : ''}<span>${n}</span>${dot ? '<i class="tm-dot"></i>' : ''}</button>`).join(''));
    const sh = $('#tmSheet'), open = sh && !sh.hidden;   // 아래 메뉴: 빨간 점, 열린 창 이름
    $$('#tmNav [data-tnav]').forEach(b => { const k = b.dataset.tnav; b.classList.toggle('dot', k === 'mem' ? !!can : k === 'gear' ? gc : k === 'rep' ? tamIdle().sec >= 60 : false); b.setAttribute('aria-pressed', String(open && seg === k)); });
    if (open) $('#tmShT').textContent = { mem: '대원', gear: '장비', mat: '재료' }[seg] || '대원';
  }
  function tamRenderBody() {
    const box = $('#tmBody'); if (!box || !tamOn()) return;
    const seg = rt.tamSeg || 'mem', rec = tamUpRec();
    tamTabs(seg, rec);
    if (seg === 'mem') {
      const party = tamParty(), slots = tamSlots(), auto = tamAutoTeam(), same = auto.length === party.length && auto.every(k => party.includes(k));
      const R = rec.mem, rs = R && tamStat(R.sp);
      let h = '';
      if (R) h += `<div class="tm-rec"><span class="tm-rtag">추천 강화</span><img src="${tamPcPic(R.sp)}" alt=""><div class="tm-rtx"><b>${esc(spName(R.sp))} Lv.${tamMem(R.sp).lv} → ${tamMem(R.sp).lv + 1}</b><small>탐험대 힘 +${fmt(Math.max(1, Math.round(R.g)))}</small><small class="tm-hold">👆 꾹 누르면 계속 올라가요</small></div>` +
        `<button type="button" class="cta small" data-tlv="${R.sp}"${S.budget >= R.c ? '' : ' aria-disabled="true"'}>${acornIcon()}${fmt(R.c)}</button></div>`;
      h += `<div class="tm-party">${Array.from({ length: 5 }, (_, i) => { const sp = party[i];
        if (i >= slots) return `<div class="tm-slot lock"><span>🔒</span><small>${i === 3 ? '초등학교' : '중학교'}</small></div>`;
        if (!sp) return `<div class="tm-slot empty"><span>+</span></div>`;
        const s = tamStat(sp); return `<div class="tm-slot" style="--rc:${TM_RC[TAM.role[s.ri].k]}"><img src="${tamPcPic(sp)}" alt=""><em>Lv.${tamMem(sp).lv}</em><small>${esc(spName(sp))}</small></div>`; }).join('')}</div>`;
      { const R0 = tamReg(tamCurFl()), ar = TAM.role[tamAdvRi()], cl = tamCollLv();
        h += `<div class="tm-tips"><p><b class="tm-role" style="--rc:${TM_RC[ar.k]}">${esc(ar.nm.split(' ')[0])}</b> ${esc(R0.nm)}에서 힘 +${Math.round(TAM.advG * 100)}%</p>` +
          `<p><b class="tm-role">모은 대원 효과</b> 대원 레벨 합 ${fmt(cl)} → 힘 +${(Math.min(TAM.collMax, 1 + TAM.collG * cl) * 100 - 100).toFixed(1)}%</p></div>`; }
      { const gain = same ? 0 : tamAutoGain();   // 더 센 조합이 있으면 단추를 반짝이고 늘어나는 힘을 보여 줘요
        h += `<div class="tm-prow"><span>대원 ${party.length}/${slots}명</span><button type="button" class="btn-sub small${gain ? ' tm-auto-hot' : ''}" data-tauto="1"${same ? ' aria-disabled="true"' : ''}>${same ? '가장 좋은 조합이에요' : gain ? `더 센 조합 있어요 <b>힘 +${fmt(gain)}</b>` : '자동 편성'}</button></div>`; }
      { const lvN = rt.tamLvN || 1, allC = Math.min(...party.map(tamLvCost));   // 한 번에 올리기
        h += `<div class="tm-lvrow"><span class="tm-lvn" role="group" aria-label="한 번에 올릴 레벨">한 번에${[[1, '1'], [10, '10'], [Infinity, '최대']].map(([v, t]) => `<button type="button" data-tlvn="${v === Infinity ? 'max' : v}" aria-pressed="${lvN === v}">${t}</button>`).join('')}</span>` +
          `<button type="button" class="cta small" data-tlvall="1"${party.length && S.budget >= allC ? '' : ' aria-disabled="true"'}>고르게 올리기</button></div>`; }
      h += tamAvail().slice().sort((a, b) => (party.includes(b) - party.includes(a)) || (tamScore(tamStat(b)) - tamScore(tamStat(a)))).map(sp => {
        const m = tamMem(sp), on = party.includes(sp), s = tamStat(sp), r = TAM.role[s.ri], best = R && R.sp === sp, sug = !on && auto.includes(sp);
        const lvN = rt.tamLvN || 1, P = lvN > 1 ? tamLvPlan(sp, lvN) : null, c = P && P.k ? P.sum : tamLvCost(sp), can = S.budget >= c;   // 한 번에 여러 레벨
        const st = tamStarOn() ? `<span class="tm-st">${'★'.repeat(m.st)}<i>${'★'.repeat(5 - m.st)}</i></span>${m.st < 5 ? `<small class="tm-sh">별 조각 ${m.sh}/${tamStarNeed(m.st + 1)}</small>` : ''}` : '';
        return `<div class="tm-mem${on ? ' on' : ''}${best ? ' best' : ''}"><span class="tm-face" style="--rc:${TM_RC[r.k]}"><img src="${tamPcPic(sp)}" alt="">${on ? '<i>출동</i>' : ''}</span>` +
          `<div class="tm-mtx"><b>${esc(spName(sp))}<em>Lv.${m.lv}</em>${sug ? '<u>추천</u>' : ''}${s.ri === tamAdvRi() ? '<u class="adv">유리</u>' : ''}</b><span class="tm-role" style="--rc:${TM_RC[r.k]}">${r.nm}</span><small>힘 ${fmt(Math.round(s.atk))}  체력 ${fmt(Math.round(s.hp))}</small>${st}</div>` +
          `<div class="tm-mbt"><button type="button" class="cta small" data-tlv="${sp}"${can ? '' : ' aria-disabled="true"'}>${P && P.k > 1 ? `<i class="tm-lvk">+${P.k}</i>` : ''}${acornIcon()}${fmt(c)}</button><button type="button" class="btn-sub small" data-tpick="${sp}">${on ? '빼기' : '편성'}</button></div></div>`;
      }).join('');
      setH(box, h);
    } else if (seg === 'gear') {
      // 칸 장비: 대원이 아니라 칸을 강화해요. 대원을 바꿔도 그 칸의 장비는 그대로 남아요
      const team = tamTeam(), slots = tamSlots(), rg = rec.gear;
      let h = '';   // 설명 줄을 뺐어요(칸마다 '1번 칸'과 대원 이름이 보여요)
      if (rg) { const G = TAM.gear.find(g => g.k === rg.k), gu = IMG(`ex_gear_${rg.k}_${tamGrade(S.tam.sg[rg.i][rg.k])}`);
        h += `<div class="tm-rec"><span class="tm-rtag">추천 강화</span>${gu ? `<img src="${gu}" alt="">` : ''}<div class="tm-rtx"><b>${rg.i + 1}번 칸 ${G.nm} Lv.${S.tam.sg[rg.i][rg.k]} → ${S.tam.sg[rg.i][rg.k] + 1}</b><small>탐험대 힘 +${fmt(Math.max(1, Math.round(rg.g)))}</small><small class="tm-hold">👆 꾹 누르면 계속 올라가요</small></div>` +
          `<button type="button" class="cta small" data-tgear="${rg.i}:${rg.k}">${tamMatIc(rg.c.m, 18)}${rg.c.n}${rg.c.star ? ` ${tamMatIc(3, 18)}${rg.c.star}` : ''}</button></div>`; }
      h += Array.from({ length: 5 }, (_, i) => {
        const p = team[i], lock = i >= slots;
        if (lock) return `<div class="tm-sgc lock"><div class="tm-sgh"><b>${i + 1}번 칸</b><span>${TAM.slotNm[i]}</span><small>🔒 ${i === 3 ? '초등학교' : '중학교'}부터 열려요</small></div></div>`;
        return `<div class="tm-sgc"><div class="tm-sgh"><b>${i + 1}번 칸</b><span>${TAM.slotNm[i]}</span>${p ? `<em class="tm-sgw"><img src="${tamPcPic(p.sp)}" alt="">${esc(spName(p.sp))}</em>` : '<em class="tm-sgw none">비어 있음</em>'}</div><div class="tm-sgg">` +
          TAM.gear.map(G => { const L = S.tam.sg[i][G.k], c = tamGearCost(G.k, i), can = S.tam.mat[c.m] >= c.n && S.tam.mat[3] >= c.star, gu = IMG(`ex_gear_${G.k}_${tamGrade(L)}`), best = rg && rg.i === i && rg.k === G.k;
            return `<div class="tm-gi g${tamGrade(L)}${best ? ' best' : ''}">${best ? '<u>추천</u>' : ''}<span class="tm-gim">${gu ? `<img src="${gu}" alt="">` : G.ic}<em>Lv.${L}</em></span><small>${G.hint} +${Math.round(TAM.gearPer * L * 100)}%</small>` +
              `<button type="button" class="cta small" data-tgear="${i}:${G.k}"${can ? '' : ' aria-disabled="true"'}>${tamMatIc(c.m, 16)}${c.n}${c.star ? ` ${tamMatIc(3, 16)}${c.star}` : ''}</button></div>`; }).join('') + '</div></div>';
      }).join('');
      setH(box, h);
    } else {
      const R = tamReg(tamCurFl());
      setH(box, `<p class="tm-note">${R.nm}에서는 ${iga(TAM.mats[R.mat])} 많이 나와요</p><ul class="tm-mats">` + TAM.mats.map((n, i) => `<li${i === R.mat ? ' class="now"' : ''}>${tamMatIc(i, 34)}<b>${n}</b><em>${fmt(S.tam.mat[i])}</em></li>`).join('') + '</ul>');
    }
  }
  function tamOpen() {
    if (!FXL.st && wldLv() > 0) { FXL.touched = true; fxLoad(); }   // 엔진을 아직 안 받았으면 지금
    if (FXL.st === 'ok' && !FXT.st) fxTamInit();   // 탐험 효과층을 미리 준비
    if (FXL.st === 'ok' && !FXG.st) fxgInit();   // 오르는 길 바닥
    else if (FXG.st === 'ok') fxgRefresh();   // 다시 들어오면 숨겨 둔 바닥 그림판을 다시 깔아요
    if (!tamOn()) return;
    if (!S.tam.seen) { S.tam.seen = 1; S.tam.it = S.tam.it || gameNow(); save();   // 처음 열면 소개 장면(자동 시험에서는 __TAM_INTRO일 때만)
      const shown = !(window.__FOREST_TEST && !window.__TAM_INTRO) && stPlay('tam', false);
      if (!shown) tamToast('밤이면 학교에 숲의 장난꾸러기들이 와요!\n탐험대와 함께 달래 주러 가요'); }
    tamUiInit(); tamSkStop(); tamRenderTop(); tamSync(); tamRenderBody();
    { const today = gameToday(), en = $('#tmEnter'); if (en && S.tam.ed !== today && !window.__FOREST_TEST) { S.tam.ed = today; save(); en.hidden = false; en.style.animation = 'none'; void en.offsetWidth; en.style.animation = ''; clearTimeout(en._t); en._t = setTimeout(() => { en.hidden = true; }, 1600); } }   // 입장 장면은 하루 처음만
    tamReport(true);
  }
  // 화면 틀과 아이콘 그림(작업지시서 77)을 한 번만 CSS 변수와 img에 넣어요
  function tamUiInit() {
    if (rt.tamUi) return; rt.tamUi = 1;
    const P = $('#panelTam'), v = (n, k) => { const u = IMG(k); if (u) P.style.setProperty(n, `url("${u}")`); };
    v('--x4-btn', 'ex4_ui_btn_round'); v('--x4-btnon', 'ex4_ui_btn_round_on'); v('--x4-top', 'ex4_ui_topbar'); v('--x4-floor', 'ex4_ui_floor');
    v('--x4-skf', 'ex4_ui_sk_frame'); v('--x4-skr', 'ex4_ui_sk_ready'); v('--x4-bot', 'ex4_ui_bottom'); v('--x4-aura', 'ex4_boss_aura'); v('--x4-warn', 'ex4_boss_warn'); v('--x4-enter', 'ex4_enter'); v('--x4-acorn', 'ic_acorn');
    $$('#panelTam img[data-x4]').forEach(im => { const u = IMG(im.dataset.x4); if (u) im.src = u; });
  }
  // 위 칸 도토리(탐험 화면을 볼 때만 바꿔요)
  function tamAcorn(force) {
    const e = $('#tmAcN'); if (!e) return; const t = fmt2(S.budget); if (!force && e.textContent === t) return;
    e.textContent = t; rt.tamAc = S.budget; e.style.fontSize = ''; let z = parseFloat(getComputedStyle(e).fontSize); while (e.scrollWidth > e.clientWidth + 0.5 && z > 9) { z -= 0.5; e.style.fontSize = z + 'px'; }   // 글자가 바뀔 때만(0.4초마다 한 번까지) 칸에 맞춰요. 들썩임 없이, 홈처럼 두 단위까지
  }
  // 대원 레벨이 오르면 무대 위 그 대원 발밑에서 금빛 기둥(ex4_fx_levelup)
  function tamLvFx(sps) {
    const u = IMG('ex4_fx_levelup'), T = rt.tam, F = T && T.F; if (!u || !tamFxOn()) return;
    const team = F ? F.P : tamTeam(), P = $$('#tmP .tm-f');
    team.forEach((p, i) => { if (!sps.includes(p.sp) || !P[i]) return; const [x, y] = tamAt(P[i], 0.55); tamFxImg('tm-lvup', u, x, y, [{ t: 'scaleY(.2)', opacity: 0 }, { t: 'scaleY(1)', opacity: 1, offset: 0.3 }, { dy: -12, t: 'scaleY(1.05)', opacity: 0 }], 900); });
  }
  // 칸 장비 한 단계 올리기(재료가 모자라거나 잠긴 칸이면 false). 꾹 누르기도 함께 써요
  function tamGearBuy(i, k) {
    if (!S.tam.sg[i] || !(k in S.tam.sg[i]) || i >= tamSlots()) return false;
    const c = tamGearCost(k, i); if (S.tam.mat[c.m] < c.n || S.tam.mat[3] < c.star) return false;
    S.tam.mat[c.m] -= c.n; S.tam.mat[3] -= c.star; S.tam.sg[i][k] += 1; return true;
  }
  function tamClick(e) {
    const b = e.target.closest('button'); if (!b || !tamOn()) return;
    if (b.getAttribute('aria-disabled') === 'true' && !(b.dataset.tlv && S.budget >= tamLvCost(b.dataset.tlv))) { if (b.dataset.tlv) tamToast('도토리가 모자라요\n문방구에서 숲의 정수로 도토리를 살 수 있어요'); else if (b.dataset.tgear) tamToast('재료가 모자라요'); return; }
    if (b.dataset.tsk) { tamCast(+b.dataset.tsk); return; }
    if (b.dataset.tmm) { const v = +b.dataset.tmm; if ((v && !tamHOpen()) || (rt.tam && rt.tam.ph === 'event')) return; if ((S.tam.hm ? 1 : 0) === v) return; S.tam.hm = v; tamHSync(); sfx('tap'); save(); tamSkStop(); tamRestart(); tamRenderTop(); tamRenderBody(); musicSync(); return; }   // 심화 탐험
    if (b.id === 'tmExit') { sfx('tap'); setTab('school'); return; }
    if (b.id === 'tmShX') { sfx('tap'); $('#tmSheet').hidden = true; tamRenderBody(); return; }
    if (b.dataset.tnav) { const k = b.dataset.tnav; sfx('tap');
      if (k === 'rank') { rt.rankView = 'tam'; setTab('rank'); rt.backTab = 'tam'; return; }   // 닫으면 탐험으로
      if (k === 'rep') { tamReport(false); return; }
      const sh = $('#tmSheet'); if (!sh.hidden && rt.tamSeg === k) { sh.hidden = true; tamRenderBody(); return; }
      rt.tamSeg = k; sh.hidden = false; $('#tmBody').scrollTop = 0; tamRenderBody(); return; }
    if (b.id === 'tmSkOff') { S.tam.skOff = S.tam.skOff ? 0 : 1; sfx('tap'); save(); tamRenderTop(); return; }   // 켜 두는 필살기 연출 건너뛰기
    if (b.dataset.tev) { const T = rt.tam; if (T && T.ph === 'event') { sfx('tap'); tamEvPick(T, +b.dataset.tev); } return; }
    if (b.dataset.tauto) { S.tam.party = tamAutoTeam(); sfx('coin'); save(); tamRestart(); tamRenderTop(); tamRenderBody(); tamSkills(); tamToast('가장 힘센 조합으로 편성했어요'); return; }
    if (b.dataset.tseg) { rt.tamSeg = b.dataset.tseg; sfx('tap'); tamRenderBody(); return; }
    if (b.dataset.tpick) {
      const sp = b.dataset.tpick, P = S.tam.party.filter(k => tamAvail().includes(k));
      if (P.includes(sp)) { if (P.length <= 1) { tamToast('대원이 한 명은 있어야 해요'); return; } S.tam.party = P.filter(k => k !== sp); }
      else { if (P.length >= tamSlots()) { tamToast(`대원은 ${tamSlots()}명까지예요. 먼저 한 명을 빼 주세요`); return; } S.tam.party = P.concat(sp); }
      sfx('tap'); save(); tamRestart(); tamRenderTop(); tamRenderBody(); tamSkills(); return;
    }
    if (b.dataset.tlvn) { rt.tamLvN = b.dataset.tlvn === 'max' ? Infinity : +b.dataset.tlvn; sfx('tap'); tamRenderBody(); return; }
    if (b.dataset.tlvall) { sfx('tap'); tamLvAllAsk(); return; }   // 미리 보기 창 뒤에 올려요
    if (b.dataset.tlv) { const sp = b.dataset.tlv, inRec = !!b.closest('.tm-rec'), n = tamLvBuy(sp, inRec ? 1 : (rt.tamLvN || 1)); if (!n) return; tamLvFx([sp]); tamRestartStat(); sfx('coin'); buzz(10); save(); renderHUD(); tamRenderTop(); tamRenderBody(); if (n > 1) tamToast(`${spName(sp)} 레벨 +${n}`); return; }
    if (b.dataset.tgear) { const [si, k] = b.dataset.tgear.split(':'); if (!tamGearBuy(+si, k)) return; tamRestartStat(); sfx('coin'); save(); tamRenderTop(); tamRenderBody(); return; }
    if (b.id === 'tmSpd') { tamAdSpd(); return; }
    if (b.id === 'tmSkip') { tamSkipGo(); return; }
    if (b.id === 'tmAuto') { S.tam.auto = S.tam.auto ? 0 : 1; sfx('tap'); save(); tamRenderTop(); return; }
    if (b.id === 'tmRevive') { tamAdRevive(); return; }
    if (b.id === 'tmRep') { tamReport(false); return; }
  }
  // 오늘의 광고 도장(하루 6개). 날짜가 바뀌면 도장과 '한 판 더'를 새로
  function adxDay() { if (!S.adx) S.adx = freshAdx(); const t = gameToday(); if (S.adx.day !== t) { const f = freshAdx(); f.day = t; S.adx = f; } }
  function adStamp() {
    if (!S) return [];
    adxDay();
    if (S.adx.n >= ADX.max) return [];
    S.adx.n += 1;
    const out = [];
    ADX.st.forEach(([need, ess, tk, amt], i) => {
      if (S.adx.n < need || S.adx.got[i]) return;
      S.adx.got[i] = 1; addEss(ess); S.tk[tk] = Math.min(SAVE_CAP.count, S.tk[tk] + amt);
      out.push(`숲의 정수 +${ess}, ${tk === 'm5' ? '5분권' : '30분권'} ${amt}장`);
    });
    if (out.length) setTimeout(() => toast(`오늘의 광고 도장 ${S.adx.n}개!\n${out.join('\n')}`), 2600);
    save();
    if (rt.tab === 'shop') renderShop();
    return out;
  }
  function renderAdStamp() {
    const box = $('#adStamp'); if (!box || !S) return;
    adxDay();
    const gift = ADX.st.map(x => x[0]);
    setH(box, `<b>오늘의 광고 도장 <small>${S.adx.n}/${ADX.max}</small></b><span class="ads-row">` +
      Array.from({ length: ADX.max }, (_, i) => `<i class="${i < S.adx.n ? 'on' : ''}${gift.includes(i + 1) ? ' gift' : ''}">${i < S.adx.n ? '✓' : i + 1}</i>`).join('') + '</span>' +
      `<small>${ADX.st.map(([need, ess, tk, amt], i) => `<span class="${S.adx.got[i] ? 'ok' : ''}">${need}개: 숲의 정수 ${ess}, ${tk === 'm5' ? '5분권' : '30분권'} ${amt}장</span>`).join('')}</small>`);
  }
  // 고등학교부터 도토리 광고(자리 비운 동안, 보충수업)에 보상 고르기
  const adPickOn = () => !!S && S.tier >= ADX.tier;
  const conNear = () => (S && S.bd ? Object.keys(S.bd).filter(k => conOn(k) && conLeft(k) > 0).sort((a, b) => S.bd[a].e - S.bd[b].e)[0] : '') || '';
  const adPickNow = () => adPickOn() ? (rt.adPick === 'con' && !conNear() ? 'acorn' : rt.adPick || 'acorn') : 'acorn';
  function renderAdPick(sel, first) {
    const box = $(sel); if (!box) return;
    box.hidden = !adPickOn(); if (box.hidden) return;
    const con = !!conNear(), pk = adPickNow();
    setH(box, [['acorn', first], ['con', `공사 ${ADX.conMin}분 단축`], ['ess', `숲의 정수 +${ADX.ess}`]].map(([k, t]) =>
      `<button type="button" class="ad-pk${pk === k ? ' on' : ''}" data-adpk="${k}" aria-pressed="${pk === k}"${k === 'con' && !con ? ' disabled' : ''}>${t}</button>`).join(''));
  }
  // 고른 보상(공사 단축이나 숲의 정수)을 줘요. 광고를 보는 동안 공사가 끝났으면 숲의 정수로
  function adPickGive(k) {
    if (k === 'con') { const c = conNear(); if (c) { conCut(c, ADX.conMin * 60); return `${FAC[c].name} 공사 ${ADX.conMin}분 단축!`; } }
    addEss(ADX.ess); save(); return `숲의 정수 +${ADX.ess}`;
  }
  function adPickSync() {
    if (rt.modalOpen === $('#mOffline')) fillOffline();
    if (rt.modalOpen === $('#mBoost')) boostPickSync();
  }
  function renderShopBtn() {
    $('#goldN').textContent = fmt(S.gold);
    $('#btnShop').setAttribute('aria-label', `꾸미기 백화점, 황금 도토리 ${fmt(S.gold)}개`);
    { const b = $('#btnShop'), sv = b.querySelector('svg'); if (IMG('ic_gold_acorn') && sv && !b.dataset.img) { b.dataset.img = '1'; sv.outerHTML = GOLD_ICON; } }   // 그림 황금 도토리
  }
  // 꾸민 모습을 학교에 입혀요: 학생 소품은 학생을 다시 그리고, 지붕과 칠판은 색 이름표를 바꿔요
  /* 테마 세트를 사기 전에 지도, 건물 지붕과 벽 색, 테마 곡이 어떻게 바뀌는지 홈 지도에서 미리 봐요
     저장(S.cos.th)은 바꾸지 않고 rt.thPrev로만 그려요. 다른 탭으로 가거나 '돌아가기'를 누르면 끝나요 */
  function thPreview(id) {
    const T = THEME[id]; if (!T) return;
    const th = {}; for (const [sl] of TH_SLOTS) th[sl] = id;
    rt.thPrev = { id, th }; Music.preview = ''; rt.thScroll = $('#scroller').scrollTop;   // 돌아오면 그 자리로
    sfx('tap'); setTab('school'); applyCos(); ensureAudio(true); musicSync();
    const b = $('#thPrevBar');
    if (b) { $('#thPrevName').textContent = `${T.name} 세트 미리 보기`; b.hidden = false;
      const by = $('#thPrevBuy'), own = TH_SLOTS.every(([sl]) => thOwn(id, sl)); by.hidden = own; if (!own) by.innerHTML = `사기 <svg viewBox="-8 -11 16 20" aria-hidden="true">${GOLD_ICON.slice(GOLD_ICON.indexOf('>') + 1, -6)}</svg>${thSetPrice(id)}`; }   // 5.3.3 미리 보다가 바로 사기
    if (!S.bgm && SONGS[id]) toast('미리 보기 곡만 나와요\n배경음악은 설정에서 켤 수 있어요');
  }
  function thPreviewEnd(quiet) {
    if (!rt.thPrev) return;
    rt.thPrev = null; const b = $('#thPrevBar'); if (b) b.hidden = true;
    applyCos(); musicSync();
    if (!quiet) { openShop(); const y = rt.thScroll || 0; requestAnimationFrame(() => { $('#scroller').scrollTop = y; }); }
  }
  function applyCos() {
    rt.kids.forEach(k => { k.g.innerHTML = kidSVG(k.rare ? k.sp + '_rare' : k.sp, k.bag); });
    rt.bdHatK = null; rt.elBadgeT = '';   // 생일 고깔과 반장 배지는 다음 틱에 다시
    const map = $('#map');
    applyThemes();
    const bgT = THEME[thOn().bg];
    const fx = $('#fallFx'), kind = bgT ? bgT.fx : '';
    if (fx.dataset.kind !== kind) {
      fx.dataset.kind = kind;
      fx.textContent = '';
      fx.className = 'fallfx' + (kind && kind !== 'petal' ? ' ' + kind : '');
      for (let i = 0; kind && i < 16; i++) {
        const e = document.createElement('i');
        e.style.left = (Math.random() * 100).toFixed(1) + '%';
        e.style.setProperty('--dx', (Math.random() * 40 - 20).toFixed(0) + 'px');
        e.style.setProperty('--y', (Math.random() * 96).toFixed(1) + '%');
        e.style.animationDuration = kind === 'star' ? (1.2 + Math.random() * 2).toFixed(1) + 's' : (7 + Math.random() * 6).toFixed(1) + 's';
        e.style.animationDelay = (-Math.random() * 12).toFixed(1) + 's';
        fx.appendChild(e);
      }
    }
    fx.hidden = !kind;
    musicSync();   // 배경 테마가 바뀌면 학교 곡도 바뀌어요
  }
  function cosArt(cat, it) {
    if (cat === 'hat' || cat === 'neck') {
      const look = { hat: cat === 'hat' ? it.id : '', neck: cat === 'neck' ? it.id : '' };
      return `<svg viewBox="-11 -13.5 22 27" aria-hidden="true">${kidSVG('bear', 0, look)}</svg>`;
    }
    return `<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="5" y="9" width="30" height="21" rx="3" fill="${it.c}" stroke="#7A522D" stroke-width="2.5"/><path d="M10 16 h12 M10 21 h17 M10 26 h8" stroke="#F3F2E8" stroke-width="1.6" stroke-linecap="round"/></svg>`;
  }
  // 상점 거리: 가게 카드에 가진 재화를 보여 주고, 누르면 그 가게로 들어가요
  function renderStreet() {
    $('#sfGoldN').textContent = fmt(S.gold || 0);
    $('#sfEssN').textContent = fmt(S.ess || 0);
    const bg = IMG('street_bg'); $('#streetScene').style.backgroundImage = bg ? `url("${bg}")` : '';
    $$('#panelStreet .sf-pic').forEach(el => {
      const u = IMG(el.dataset.front) || (el.dataset.fb && IMG(el.dataset.fb));
      el.classList.toggle('fb', !IMG(el.dataset.front));
      if (u) el.style.backgroundImage = `url("${u}")`;
    });    shopChrome('street'); renderShelf(); renderShopMore();   // 5.3.3 재화 줄, 오늘의 진열대, 다른 가게
  }
  function openShop() {
    if (rt.modalOpen) closeModal(rt.modalOpen);
    setTab('shop');
  }
  // 꾸미기 백화점의 놓친 이벤트 장식: 이미 끝난 이벤트(지금 열린 것은 빼요)의 한정 장식 가운데 아직 없는 것
  function evPastIds() {
    const today = gameToday(), cur = evCurrent(today), out = new Set();
    let d = dayAdd(weekMon(today), -1);
    for (let i = 0; i < 260 && d >= '2026-11-02'; i++) {   // 매주 이벤트가 시작된 주까지(5년치)
      const e = evCurrent(d); if (e && (!cur || e.def.id !== cur.def.id)) out.add(e.def.id);
      d = dayAdd(weekMon(d), -1);
    }
    return [...out];
  }
  const evRestock = () => evPastIds().map(id => DECO_BY['ev_' + id]).filter(dd => evDecoArt(dd) && !decoOwn(dd.id));
  function renderShop() {
    goldDay();
    $('#shopHave').innerHTML = GOLD_ICON + '<span></span>';
    $('#shopHave span').textContent = fmt(S.gold);
    const left = Math.max(0, GOLD.shopAd - S.gd.shop);   // 5.3.3 상점 광고만 세요
    $('#shopAd').setAttribute('aria-disabled', left > 0 ? 'false' : 'true');
    renderAdStamp();
    $('#shopAdLeft').textContent = left > 0 ? `오늘 상점 광고를 ${left}번 더 볼 수 있어요` : '오늘 상점 광고를 모두 봤어요. 내일 다시 열려요';
    const coin = `<svg viewBox="-8 -11 16 20" aria-hidden="true">${GOLD_ICON.slice(GOLD_ICON.indexOf('>') + 1, -6)}</svg>`;
    let h = renderThemes(coin);
    // 5.3.3 이달의 꾸미기
    h += `<h3 class="shop-h" data-cat="이번 달">${gmNow()}월의 꾸미기 <small>이번 달 한정. 지나면 놓친 장식에서 같은 값으로</small></h3><div class="shop-grid">${gmTiles(gmItems(gmNow()), coin)}</div>`;
    // 학생 옷 세트: 모자와 목 장식 한 벌
    h += `<h3 class="shop-h">학생 옷 세트 <small>모자와 목 장식 한 벌</small></h3><div class="shop-grid">`;
    for (const o of OUTFITS) {
      const own = ofOwn(o), on = own && ofOn(o), p = ofPrice(o), poor = !own && S.gold < p;
      const pr = on ? '쓰는 중' : own ? '쓰기' : `${coin}${p}`;   // 5.3.3 가진 것의 말은 '쓰기' 하나로
      h += `<button class="si${own ? ' own' : ''}${on ? ' on' : ''}${poor ? ' poor' : ''}" type="button" data-buy="o:${o.id}" aria-pressed="${on}" aria-label="${o.name}${own ? '' : `, 황금 도토리 ${p}개`}">` +
        `<span class="pv"><svg viewBox="-11 -13.5 22 27" aria-hidden="true">${kidSVG('bear', 0, { hat: o.hat, neck: o.neck })}</svg></span><span class="nm">${o.name}</span><span class="pr">${pr}</span>${own ? '' : lackTx(p, S.gold)}</button>`;
    }
    h += '</div>';
    // 옷장: 세트 밖에서 받은 모자(주간 상자, 이벤트, 꾸미기 가게 한정 모자)와 옛 조각을 하나씩 입고 벗어요
    const ofParts = new Set(OUTFITS.flatMap(o => ['hat:' + o.hat, 'neck:' + o.neck]));
    const ward = Object.keys(COS).flatMap(cat => COS[cat].items.filter(it => S.cos.own.includes(cat + ':' + it.id) && !ofParts.has(cat + ':' + it.id)).map(it => [cat, it]));
    const half = OUTFITS.filter(o => ofOwnN(o) === 1).flatMap(o => [['hat', cosIt('hat', o.hat)], ['neck', cosIt('neck', o.neck)]].filter(([cat, it]) => S.cos.own.includes(cat + ':' + it.id)));
    if (ward.length || half.length) {
      h += `<h3 class="shop-h">옷장 <small>가진 것을 하나씩 입고 벗어요</small></h3><div class="shop-grid">`;
      for (const [cat, it] of ward.concat(half)) {
        const on = S.cos[cat] === it.id;
        h += `<button class="si own${on ? ' on' : ''}" type="button" data-buy="c:${cat}:${it.id}" aria-pressed="${on}">` +
          `<span class="pv">${cosArt(cat, it)}</span><span class="nm">${it.name}</span><span class="pr">${on ? '쓰는 중' : '쓰기'}</span></button>`;
      }
      h += '</div>';
    }
    // 놓친 이벤트 장식
    const miss = evRestock(), gmp = gmPast().flatMap(gmItems).filter(x => !x.own);
    if (gmp.length) h += `<h3 class="shop-h" data-cat="놓친 장식">지난달의 꾸미기 <small>그달 값 그대로</small></h3><div class="shop-grid">${gmTiles(gmp, coin)}</div>`;
    if (miss.length) {
      h += `<h3 class="shop-h"${gmp.length ? '' : ' data-cat="놓친 장식"'}>놓친 이벤트 장식 <small>지난 이벤트 것만, 하나씩</small></h3><div class="shop-grid">`;
      for (const d of miss) {
        const poor = S.gold < GSHOP.evDeco;
        h += `<button class="si${poor ? ' poor' : ''}" type="button" data-buy="e:${d.id}" aria-label="${d.name}, 황금 도토리 ${GSHOP.evDeco}개"><span class="rare-mark" aria-hidden="true">★</span>` +
          `<span class="pv deco"><img src="${IMG(d.img)}" alt="" draggable="false"></span><span class="nm">${d.name}</span><span class="pr">${coin}${GSHOP.evDeco}</span>${lackTx(GSHOP.evDeco, S.gold)}</button>`;
      }
      h += '</div>';
    }
    // 학교 마크 특별판
    h += `<h3 class="shop-h" data-cat="마크">학교 마크 특별판 <small>마크 위에 덧입혀요</small></h3><div class="shop-grid">`;
    const mk = S.deco.mk || [0, 0, 3, 2];
    for (const [x, nm] of MARKX) {
      const own = S.cos.own.includes('mkx:' + x), on = S.cos.mkx === x, poor = !own && S.gold < GSHOP.mark;
      h += `<button class="si${own ? ' own' : ''}${on ? ' on' : ''}${poor ? ' poor' : ''}" type="button" data-buy="m:${x}" aria-pressed="${on}" aria-label="학교 마크 ${nm}${own ? '' : `, 황금 도토리 ${GSHOP.mark}개`}">` +
        `<span class="pv">${markHTML(mk, x)}</span><span class="nm">${nm}</span><span class="pr">${on ? '쓰는 중' : own ? '쓰기' : `${coin}${GSHOP.mark}`}</span>${own ? '' : lackTx(GSHOP.mark, S.gold)}</button>`;
    }
    h += '</div>';
    // 이름 바꾸기(랭킹)는 5.3.3부터 설정 > 학교 간판과 마크 아래(#optNick, 같은 길)
    const list = $('#shopList'), top = list.scrollTop;
    list.innerHTML = h;
    list.scrollTop = top;
    // 사기 전에 한 번 더 물어봐요
    const ask = $('#shopAsk'), it = shopItem(rt.shopPick);
    ask.hidden = !it || !it.price;
    if (it && it.price) {
      const enough = S.gold >= it.price;
      $('#shopAskText').textContent = enough ? `${it.name}${it.ga} 황금 도토리 ${it.price}개로 살까요?` : `황금 도토리가 ${it.price - S.gold}개 모자라요.`;
      $('#shopYes').textContent = enough ? '사기' : '광고 보고 모으기';
    }    shopChrome('shop');
  }
  // '파란 야구모자를', '밀짚모자를'처럼 받침에 맞는 조사
  const eulOf = w => { const c = w.charCodeAt(w.length - 1) - 0xAC00; return c >= 0 && c <= 11171 && c % 28 ? '을' : '를'; };
  function shopItem(pick) {
    if (!pick) return null;
    const [t, a, b] = pick.split(':');
    if (t === 's' && THEME[a] && thCount(a) < TH_SLOTS.length) { const nm = `${THEME[a].name} 세트`; return { kind: 's', th: a, name: nm, ga: eulOf(nm), price: thSetPrice(a) }; }
    if (t === 't' && THEME[a] && TH_SLOTS.some(([x]) => x === b)) {
      const nm = `${THEME[a].name} ${TH_SLOTS.find(([x]) => x === b)[1]}`;
      return { kind: 't', th: a, slot: b, name: nm, ga: eulOf(nm), price: 0 };
    }
    if (t === 'o' && OUTFIT[a]) { const o = OUTFIT[a], nm = `${o.name} 세트`; return { kind: 'o', o, name: nm, ga: eulOf(nm), price: ofOwn(o) ? 0 : ofPrice(o) }; }
    if (t === 'e') { const d = DECO_BY[a]; return d && d.ev && evDecoArt(d) && !decoOwn(d.id) && evPastIds().includes(d.id.slice(3)) ? { kind: 'e', d, name: d.name, ga: eulOf(d.name), price: GSHOP.evDeco } : null; }
    if (t === 'm' && MARKX.some(([x]) => x === a)) { const nm = `학교 마크 ${MARKX.find(([x]) => x === a)[1]}`; return { kind: 'm', x: a, name: nm, ga: eulOf(nm), price: S.cos.own.includes('mkx:' + a) ? 0 : GSHOP.mark }; }
    if (t === 'r') return { kind: 'r', name: '이름 바꾸기', price: 0 };
    if (t === 'g' && /^\d\d$/.test(a) && +a >= 1 && +a <= 12 && (+a === gmNow() || gmPast().includes(+a))) {   // 5.3.3 이달의 꾸미기(그달과 지난 달만)
      const x = gmItems(+a).find(y => y.kind === b); if (!x) return null;
      return { kind: 'g', gk: b, x, name: x.name, ga: eulOf(x.name), price: x.own ? 0 : x.price };
    }
    const it = t === 'c' && COS[a] && COS[a].items.find(x => x.id === b);
    return it && S.cos.own.includes(a + ':' + b) ? { kind: 'c', cat: a, id: b, name: it.name, ga: eulOf(it.name), price: 0 } : null;   // 하나씩은 산 것만 입고 벗어요
  }
  function pickShop(pick) {
    const it = shopItem(pick);
    if (!it) return;
    sfx('tap');
    if (it.kind === 't') {   // 산 테마 칸은 바로 바꾸고 되돌려요. 안 산 칸은 세트로 사요
      if (!thOwn(it.th, it.slot)) { toast(`${THEME[it.th].name} 테마는 세트로 살 수 있어요`); return; }
      S.cos.th[it.slot] = S.cos.th[it.slot] === it.th ? '' : it.th;
      rt.shopPick = '';
      applyCos(); save(); renderShop();
      toast(S.cos.th[it.slot] ? `${it.name}${it.ga} 골랐어요` : '원래 모습으로 돌렸어요');
      return;
    }
    if (it.kind === 'c') {   // 산 꾸미기는 바로 입고 벗어요
      S.cos[it.cat] = S.cos[it.cat] === it.id ? '' : it.id;
      rt.shopPick = '';
      applyCos(); save(); renderShop();
      toast(S.cos[it.cat] ? `${it.name}${it.ga} 입혔어요` : `${it.name}${it.ga} 벗었어요`);
      return;
    }
    if (it.kind === 'o' && ofOwn(it.o)) {   // 산 옷 세트는 한 벌로 입고 벗어요
      const off = ofOn(it.o);
      S.cos.hat = off ? '' : it.o.hat; S.cos.neck = off ? '' : it.o.neck;
      rt.shopPick = '';
      applyCos(); save(); renderShop();
      toast(off ? `${it.o.name} 옷을 벗었어요` : `${it.o.name} 옷을 입혔어요`);
      return;
    }
    if (it.kind === 'm' && !it.price) {   // 산 마크 특별판은 바로 쓰고 벗어요
      S.cos.mkx = S.cos.mkx === it.x ? '' : it.x;
      rt.shopPick = '';
      renderCrest(); save(); renderShop();
      toast(S.cos.mkx ? (S.deco.mk ? `${it.name}${it.ga} 썼어요` : `${it.name}${it.ga} 골랐어요. 꾸미기 가게에서 학교 마크를 정하면 보여요`) : '마크를 원래대로 돌렸어요');
      return;
    }
    if (it.kind === 'g' && !it.price) {   // 산 이달의 꾸미기: 모자는 입고 벗어요, 장식은 지도에 놓아요
      rt.shopPick = '';
      if (it.gk === 'hat') { S.cos.hat = S.cos.hat === it.x.id ? '' : it.x.id; applyCos(); save(); renderShop(); toast(S.cos.hat ? `${it.name}${it.ga} 입혔어요` : `${it.name}${it.ga} 벗었어요`); }
      else toast(`${it.name}${it.ga} 가지고 있어요. 꾸미기 가게의 '지도 꾸미기'로 놓아요`);
      return;
    }
    if (it.kind === 'r') { rt.shopPick = ''; setTab('rank'); rt.rankEdit = true; renderRankPanel(); const i = $('#rankName'); if (i) i.focus(); return; }
    rt.shopPick = pick;
    if (it.price && it.price < ASK_GOLD && S.gold >= it.price) { buyShop(); return; }   // 5.3.3 큰 값(황금 30 이상)만 한 번 더 물어요
    renderShop();
  }
  function buyShop() {
    const it = shopItem(rt.shopPick);
    if (!it || !it.price) { rt.shopPick = ''; renderShop(); return; }
    if (S.gold < it.price) { rt.shopPick = ''; shopAd(); return; }
    S.gold -= it.price; S.st.gspent += it.price;
    rt.shopPick = '';
    if (it.kind === 's') {
      for (const [sl] of TH_SLOTS) { if (!thOwn(it.th, sl)) S.cos.own.push(`th:${it.th}:${sl}`); S.cos.th[sl] = it.th; }
      applyCos();
      toast(`${THEME[it.th].name} 세트를 샀어요! 학교 전체를 꾸몄고 모음 보상으로 수업료가 ${THEME[it.th].bonus}% 올랐어요`);
    } else if (it.kind === 'o') {
      for (const [cat, id] of [['hat', it.o.hat], ['neck', it.o.neck]]) if (!S.cos.own.includes(cat + ':' + id)) S.cos.own.push(cat + ':' + id);
      S.cos.hat = it.o.hat; S.cos.neck = it.o.neck;
      applyCos();
      toast(`${it.name}${it.ga} 샀어요! 바로 입혀 뒀어요`);
    } else if (it.kind === 'e') {
      S.deco.own[it.d.id] = 1;
      toast(`${it.name}${it.ga} 샀어요! 꾸미기 가게의 '지도 꾸미기'를 눌러 학교에 놓아 보세요`);
    } else if (it.kind === 'g') {   // 5.3.3 이달의 꾸미기
      if (it.gk === 'hat') { S.cos.own.push('hat:' + it.x.id); S.cos.hat = it.x.id; applyCos(); toast(`${it.name}${it.ga} 샀어요! 바로 입혀 뒀어요`); }
      else { S.deco.own[it.x.id] = 1; toast(`${it.name}${it.ga} 샀어요! 꾸미기 가게의 '지도 꾸미기'를 눌러 학교에 놓아 보세요`); }
    } else if (it.kind === 'm') {
      S.cos.own.push('mkx:' + it.x); S.cos.mkx = it.x;
      renderCrest();
      toast(S.deco.mk ? `${it.name}${it.ga} 샀어요! 학교 마크에 덧입혔어요` : `${it.name}${it.ga} 샀어요! 꾸미기 가게에서 학교 마크를 정하면 보여요`);
    }
    sfx('quest'); buzz(15);
    save(); renderShopBtn(); renderShop(); renderHUD(); renderAffordance(); renderDeal();
  }
