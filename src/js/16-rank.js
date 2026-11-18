  /* ---------- 랭킹 ----------
     GitHub 테스트판: 서버의 forest/rank/<내 id>에 학교 점수를 올려 테스터끼리 순위를 봐요.
     Claude 화면: 이 게임 화면을 함께 여는 사람끼리 공유 저장소의 rank/<내 id> 문서로 나눠 봐요.
     토스 미니앱: 랭킹은 토스 게임 센터가 맡아요. 점수가 오를 때 submitGameCenterLeaderBoardScore({ score: String(rankScore()) })를 보내고,
     랭킹 버튼에서는 openGameCenterLeaderboard()로 토스 랭킹 화면을 열면 돼요. 미니앱마다 랭킹은 하나라서 학교 점수 하나만 보내요. */
  const RANK_MAX = 50;
  const Rank = { state: 'idle', gen: 0, be: null, uid: null, rows: [], wrows: [], brows: [], trows: [], stf: 0, stfW: null, stfAt: 0, readOnly: false, writing: false, timer: 0, unsub: null, unsubW: null, unsubB: null, sbt: 0, sbtq: null, sbtm: 0 };   // 2.0.1 brows: 대결 순위, sbt: 이번에 켠 뒤 올린 대결 점수
  /* 학교 파워: 다른 게임의 전투력처럼 쌓아 온 것에 가중치를 둔 합이에요. 쓰거나 종업식을 열어도 줄지 않아요.
     지금 학교(졸업하면 처음으로): 시설 레벨 ×10, 가구 레벨 ×2, 선생님 레벨 ×12. 졸업할 때 이 몫은 pwBank에 넣어 둬요.
     계속 남는 것: 받은 수료증 ×5, 졸업 강화 레벨 ×20, 장학재단 강화 레벨 ×40, 기념품 ×25, 꾸미기 ×15, 학교급 ×500,
     지금까지 번 도토리는 자릿수로 눌러서 100 × log10(번 도토리 + 1). 랭킹 점수도 학교 파워예요 */
  const sumOf = o => Object.values(o || {}).reduce((a, v) => a + (Array.isArray(v) ? v.reduce((x, y) => x + (+y || 0), 0) : (+v || 0)), 0);
  const pwLive = s => 10 * sumOf(s.f) + 2 * sumOf(s.fu) + 12 * sumOf(s.t);
  const pwOf = s => Math.floor(pwLive(s) + (s.pwBank || 0) + 5 * (s.st ? s.st.dips || 0 : 0) + 20 * sumOf(s.p && s.p.perk) + 40 * sumOf(s.fp) +
    25 * (s.trip && s.trip.souv ? s.trip.souv.length : 0) + 30 * ((s.p && s.p.nl) || []).reduce((x, y) => x + y, 0) + 15 * (s.cos && s.cos.own ? s.cos.own.length : 0) + 500 * (s.tier || 0) + 100 * Math.log10(1 + (s.earned || 0)));
  const schoolPower = () => pwOf(S);
  const rankScore = () => schoolPower();
  // 번 도토리 몫은 조금씩 계속 올라서, +숫자는 무언가를 사거나 받아서 오를 때만 띄워요
  const pwSteps = s => pwOf(s) - Math.floor(100 * Math.log10(1 + (s.earned || 0)));
  function renderPower() {
    const v = schoolPower();
    if (rt.pwShown === v) return;
    const st = pwSteps(S), jump = rt.pwStep !== undefined && st > rt.pwStep;
    const up = jump && rt.pwShown !== undefined && v > rt.pwShown ? v - rt.pwShown : 0;
    rt.pwShown = v; rt.pwStep = st;
    $('#vPower').textContent = fmt(v);
    $('#statPw').setAttribute('aria-label', `학교 파워 ${fmt(v)}`);
    if (up && !rt.reduced) { const sp = document.createElement('span'); sp.className = 'pw-pop'; sp.textContent = '+' + fmt(up); $('#statPw').appendChild(sp); setTimeout(() => sp.remove(), 1400); }
    if (up) rankDirty();
  }
  // 이름: 앞뒤 빈칸을 지우고 빈칸은 하나로, 10자까지
  function cleanName(v) { return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, 10) : ''; }
  function rankSchool(tier, year, sem) {
    const T = TIERS[Math.max(0, Math.min(TIERS.length - 1, tier | 0))];
    const y = Math.max(1, Math.min(T.years, year | 0 || 1));
    if ((tier | 0) >= GRAD_TIER) return `${T.school} ${gradSemTxt(y, sem)}`;   // 5.0.0
    return `${T.school} ${y}${T.unit}` + ((tier | 0) >= 1 && (sem === 0 || sem === 1) ? ` ${sem + 1}학기` : '');   // 2.1.1 학기
  }
  // 랭킹을 둘 곳: GitHub 판은 서버, Claude 화면은 공유 저장소, 둘 다 없으면 내 학교 점수만 보여요.
  // 어느 쪽이든 listen(받기), put(올리기), remove(빼기) 세 가지로 똑같이 써요
  async function rankBackend() {
    if (AIT) return { uid: 'me', readOnly: false, toss: true, listen: ok => { ok([]); return () => {}; },
      put: doc => Promise.resolve(AIT.setScore(doc.score)), remove: () => Promise.resolve() };
    if (hasCloudBuild()) {
      await cloudSettled();
      return cloudOn() && !Cloud.delLeft ? fbRank() : null;
    }
    const c = window.claude;
    const [db, user] = c && typeof c.use === 'function' ? await Promise.all([c.use('db'), c.use('user')]) : [null, null];
    if (!db || !user) return null;
    const uid = await user.id();
    const readOnly = !uid || (await user.can('data.write')) === false;
    const col = db.collection('rank');
    return {
      uid, readOnly,
      listen: (ok, no) => col.orderBy('score', 'desc').limit(RANK_MAX).onSnapshot(snap => ok(snap.docs.map(d => [d.id, d.data()])), no),
      listenWeek: (ok, no) => col.orderBy('ws', 'desc').limit(RANK_MAX).onSnapshot(snap => ok(snap.docs.map(d => [d.id, d.data()])), no),
      listenBt: (ok, no) => col.orderBy('bt', 'desc').limit(RANK_MAX).onSnapshot(snap => ok(snap.docs.map(d => [d.id, d.data()])), no),   // 2.0.1 대결 순위
      listenSea: (ok, no) => col.orderBy('sp', 'desc').limit(RANK_MAX).onSnapshot(snap => ok(snap.docs.map(d => [d.id, d.data()])), no),   // 2.1.3 랭킹 시즌
      listenTam: (ok, no) => col.orderBy('tq', 'desc').limit(RANK_MAX).onSnapshot(snap => ok(snap.docs.map(d => [d.id, d.data()])), no),   // 4.3.0 탐험 순위
      listenTamH: (ok, no) => col.orderBy('hq', 'desc').limit(RANK_MAX).onSnapshot(snap => ok(snap.docs.map(d => [d.id, d.data()])), no),   // 4.3.3 심화 탐험 순위
      put: doc => col.doc(uid).set(doc),
      remove: () => col.doc(uid).delete(),
      // 2.1.3 다른 학교 구경
      lookPut: d => db.collection('look').doc(uid).set({ d, at: Date.now() }),
      lookDel: () => db.collection('look').doc(uid).delete(),
      lookGet: id => { const r = db.collection('look').doc(id); return typeof r.get === 'function' ? r.get().then(x => x && (typeof x.data === 'function' ? (x.exists === false ? null : x.data()) : x)) :
        new Promise(res => { let un = null; un = r.onSnapshot(x => { if (un) un(); res(x && x.exists !== false ? x.data() : null); }, () => res(null)); }); }
    };
  }
  function fbRank() {
    const ref = Cloud.db.ref('forest/rank'), uid = Cloud.uid;
    // 순위표를 받는 두 가지 모양(예전에는 칸마다 같은 글이 따로 있었어요)
    //   top(칸): 그 칸이 큰 순으로 위에서부터. 기기를 옮긴 학교가 겹칠 수 있어서 조금 넉넉히 받아요
    //   week(칸): 이번 주 범위(주 × 1,000,000 ~ +999,999)만 받고, 주가 바뀌면 다시 붙어요
    //     보안 보강(2026-11-06 Codex 검토 1절): 위에서부터 받으면 다음 주로 쓴 줄이 조회 한도를 먼저 차지해 이번 주 기록이 밀려났어요. 조회 개수는 그대로예요
    const rowsOf = ok => snap => { const out = []; snap.forEach(ch => { out.push([ch.key, ch.val()]); }); ok(out.reverse()); };
    const top = child => (ok, no) => {
      const q = ref.orderByChild(child).limitToLast(RANK_MAX + 10), cb = rowsOf(ok);
      q.on('value', cb, no);
      return () => q.off('value', cb);
    };
    const week = child => (ok, no) => {
      let q = null, wk = null;
      const cb = rowsOf(ok);
      const sync = () => {
        const next = weekIdx(); if (next === wk) return;
        if (q) q.off('value', cb);
        wk = next; q = ref.orderByChild(child).startAt(wk * 1000000).endAt(wk * 1000000 + 999999).limitToLast(RANK_MAX + 10); q.on('value', cb, no);
      };
      sync(); const timer = setInterval(sync, 30000);
      return () => { clearInterval(timer); if (q) q.off('value', cb); };
    };
    return {
      uid, readOnly: false,
      listen: top('score'),
      listenWeek: week('ws'),
      listenBt: top('bt'),   // 2.0.1 대결 순위(서버 규칙 indexOn bt)
      listenSea: (ok, no) => {
        // 이전 판의 sk/sp 기록도 포함해 현재 시즌을 먼저 고른 다음 점수순으로 정렬해요.
        let q = null, season = -1;
        const cb = snap => { const out = []; snap.forEach(ch => { out.push([ch.key, ch.val()]); }); ok(out); };
        const sync = () => {
          const next = rsNum(); if (next === season) return;
          if (q) q.off('value', cb);
          season = next; q = ref.orderByChild('sk').equalTo(next); q.on('value', cb, no);
        };
        sync(); const timer = setInterval(sync, 30000);
        return () => { clearInterval(timer); if (q) q.off('value', cb); };
      },
      listenTam: week('tq'),   // 4.3.0 탐험 순위: 주간 리그처럼 이번 주 범위(tq = 주 × 1,000,000 + 층)만 받아요(서버 규칙 indexOn tq)
      listenTamH: week('hq'),   // 4.3.3 심화 탐험 순위(hq = 주 × 1,000,000 + 심화 층, 서버 규칙 indexOn hq)
      put: doc => ref.child(uid).set(Object.assign({}, doc, { at: Cloud.fb.database.ServerValue.TIMESTAMP })),
      remove: () => ref.child(uid).remove(),
      removeOther: id => ref.child(id).remove(),   // 4.1.2 관리자만(서버 규칙이 forest/adminUids 계정의 지우기만 받아 줘요)
      lookPut: d => Cloud.db.ref('forest/look/' + uid).set({ d, at: Cloud.fb.database.ServerValue.TIMESTAMP }),   // 2.1.3 다른 학교 구경(서버 규칙 forest/look)
      lookDel: () => Cloud.db.ref('forest/look/' + uid).remove(),
      lookGet: id => Cloud.db.ref('forest/look/' + id).once('value').then(x => x.val()),
      names: () => ref.once('value').then(snap => { const out = []; snap.forEach(ch => { const v = ch.val(); if (ch.key !== uid && v && typeof v.name === 'string') out.push(v.name); }); return out; })
    };
  }
  async function initRank() {
    if (Rank.state !== 'idle') return;
    const g = ++Rank.gen;
    Rank.state = 'loading';
    renderRankPanel();
    let be = null;
    try { be = await rankBackend(); } catch (e) { be = null; }
    if (g !== Rank.gen) return;
    if (!be) { Rank.state = 'off'; renderRankPanel(); return; }
    Rank.be = be; Rank.uid = be.uid; Rank.readOnly = !!be.readOnly;
    Rank.state = 'on';
    setTimeout(lookRetry, 0);   // 2.2.0 검토 6: 지난번에 못 지운 공개 학교를 다시 지워요
    try {
      Rank.unsub = be.listen(pairs => {
        if (g !== Rank.gen) return;
        Rank.rows = rankRows(pairs);
        renderRankPanel();
      }, () => { if (g === Rank.gen) { Rank.state = 'off'; renderRankPanel(); } });
      if (be.listenWeek) Rank.unsubW = be.listenWeek(pairs => {
        if (g !== Rank.gen) return;
        const w = weekIdx();
        // 1.5.4: 이번 주 기록만 고른 다음 미션 포인트 순으로 50명을 잘라요 (학교 파워로 먼저 자르면 주간 고득점자가 빠졌어요)
        Rank.wrows = rankRows(pairs, r => r.week === w && r.lp > 0, (a, b) => b.lp - a.lp || a.at - b.at);
        renderRankPanel();
      }, () => {});
      if (be.listenSea) Rank.unsubS = be.listenSea(pairs => {   // 2.1.3 랭킹 시즌: 이번 시즌 줄만
        if (g !== Rank.gen) return;
        const n = rsNum();
        Rank.srows = rankRows(pairs, r => r.sk === n && r.sp > 0, (a, b) => b.sp - a.sp || a.at - b.at);
        renderRankPanel();
      }, () => {});
      if (be.listenTam) Rank.unsubT = be.listenTam(pairs => {   // 4.3.0 탐험 순위: 이번 주 줄만
        if (g !== Rank.gen) return;
        const w = weekIdx();
        Rank.trows = rankRows(pairs, r => r.week === w && r.tf > 0, (a, b) => b.tf - a.tf || a.at - b.at);
        renderRankPanel();
      }, () => {});
      if (be.listenTamH) Rank.unsubH = be.listenTamH(pairs => {   // 4.3.3 심화 탐험 순위: 이번 주 줄만
        if (g !== Rank.gen) return;
        const w = weekIdx();
        Rank.hrows = rankRows(pairs, r => r.week === w && r.hf > 0, (a, b) => b.hf - a.hf || a.at - b.at);
        renderRankPanel();
      }, () => {});
      if (be.listenBt) Rank.unsubB = be.listenBt(pairs => {
        if (g !== Rank.gen) return;
        Rank.brows = rankRows(pairs, r => r.bt > 0, (a, b) => b.bt - a.bt || a.at - b.at);
        renderRankPanel();
      }, () => {});
    } catch (e) { Rank.state = 'off'; }
    renderRankPanel();
    submitRank();
    maybeAskNick();
  }
  // 서버 연결이 바뀌면 랭킹을 처음부터 다시 이어요
  function resetRank() {
    Rank.gen += 1;
    if (Rank.unsub) { try { Rank.unsub(); } catch (e) { /* 무시 */ } }
    if (Rank.unsubW) { try { Rank.unsubW(); } catch (e) { /* 무시 */ } }
    if (Rank.unsubB) { try { Rank.unsubB(); } catch (e) { /* 무시 */ } }
    if (Rank.unsubS) { try { Rank.unsubS(); } catch (e) { /* 무시 */ } }
    if (Rank.unsubT) { try { Rank.unsubT(); } catch (e) { /* 무시 */ } }
    if (Rank.unsubH) { try { Rank.unsubH(); } catch (e) { /* 무시 */ } }
    clearTimeout(Rank.timer);
    Object.assign(Rank, { state: 'idle', be: null, uid: null, rows: [], wrows: [], brows: [], srows: [], trows: [], hrows: [], readOnly: false, writing: false, unsub: null, unsubW: null, unsubB: null, unsubS: null, unsubT: null, unsubH: null, sbt: 0, sbtq: null, sbtm: 0, stf: 0, stfW: null, stfAt: 0 });
  }
  function rankAfterCloud() {
    if (Rank.state === 'loading') return;   // 이미 서버 연결을 기다리는 중이면 알아서 이어져요
    resetRank();
    if (S.rank.joined || rt.tab === 'rank' || (!S.rank.asked && S.q.m >= NICK_AT)) initRank(); else renderRankPanel();
  }
  // 다른 사람이 쓴 문서는 그대로 믿지 않고 모양을 확인해서 읽어요
  function readRow(id, d) {
    if (!d || typeof d !== 'object') return null;
    const score = Number(d.score), name = cleanName(d.name);
    if (!isFinite(score) || score < 0 || !name) return null;
    const at = typeof d.at === 'number' ? d.at : (Date.parse(d.at) || 0);
    return { id, name, score: Math.floor(score), tier: Number(d.tier) | 0, year: Number(d.year) | 0, test: !!d.test, at,
      pid: typeof d.pid === 'string' ? d.pid.slice(0, 16) : '', week: Number.isInteger(d.week) ? d.week : -2 /* 보안 보강: 소수 주를 정수로 바꿔 이번 주로 세지 않아요 */, lp: Math.max(0, Math.floor(Number(d.lp) || 0)),
      title: typeof d.title === 'string' && achTitleName(d.title) ? d.title : '',   // 2.1.3 업적 말고 받는 칭호도
      bt: typeof d.bt === 'number' && isFinite(d.bt) ? Math.max(1000, Math.min(9999, Math.floor(d.bt))) : 0, btm: typeof d.btm === 'number' ? Math.max(0, Math.min(5, Math.floor(d.btm))) : 0, btq: typeof d.btq === 'number' && isFinite(d.btq) ? d.btq : null, sem: d.sem === 0 || d.sem === 1 ? d.sem : null,
      sk: Math.max(0, Math.floor(Number(d.sk) || 0)), sp: Math.max(0, Math.min(1e9, Math.floor(Number(d.sp) || 0))), tf: Math.max(0, Math.min(100000, Math.floor(Number(d.tf) || 0))), hf: Math.max(0, Math.min(100000, Math.floor(Number(d.hf) || 0))) };   // 4.3.3 심화 층   // 4.3.0 탐험 이번 주 가장 깊은 층   // 2.0.1 대결, 2.1.1 학기, 2.1.3 랭킹 시즌
  }
  // 같은 학교(학교 번호)가 기기를 옮겨서 두 번 있으면 내 것이나 가장 최근 것 하나만 남겨요
  function rankRows(pairs, keep, order) {
    const best = new Map();
    pairs.forEach(([id, d]) => {
      const r = readRow(id, d);
      if (!r) return;
      const k = 'id:' + r.id, old = best.get(k);   // 2.0.0 보안 점검(2-3): 남의 학교 번호(pid)를 흉내 내 가리지 못하게 계정으로만 묶어요
      if (!old || (old.id !== Rank.uid && (r.id === Rank.uid || r.at > old.at))) best.set(k, r);
    });
    return [...best.values()].filter(keep || (() => true)).sort(order || ((a, b) => b.score - a.score || a.at - b.at)).slice(0, RANK_MAX);
  }
  // 점수가 바뀌면 잠깐 모았다가 한 번만 올려요
  const tossRank = () => !!(Rank.be && Rank.be.toss);
  function rankDirty() {
    if (!S || !(S.rank.joined || tossRank()) || Rank.state !== 'on') return;
    clearTimeout(Rank.timer);
    // 2.0.0 보안 점검(2-2): 서버 규칙이 지난 쓰기에서 10초가 지나야 크게 오르는 것을 받아 줘서, 10초보다 자주 올리지 않아요
    Rank.timer = setTimeout(() => submitRank(), Math.max(2000, RANK_GAP - (Date.now() - (Rank.lastPut || 0))));
  }
  const RANK_GAP = 11500;   // 2.0.0 Codex 검토(5): 10.5초 → 11.5초(나눠 올릴 때 규칙의 10초를 넉넉히 넘게)
  // 2.0.0 Codex 검토(5): 이번에 서버 규칙이 받아 줄 점수와 리그 점수의 최대(조금 넉넉히 덜). 서버에 있는 내 줄과 그 뒤 흐른 시간으로 재요
  function rankCap() {
    const mine = (Rank.rows || []).find(r => r.id === Rank.uid);
    let score = null, lp = null, week = null, dt = null;
    if (S.rank.by === Rank.uid && Rank.lastPerf != null) {   // 이번에 켠 뒤 올린 적이 있으면 그 값과 흐른 시간
      score = S.rank.sent; week = Math.floor(S.rank.sws / 1000000); lp = S.rank.sws - week * 1000000; dt = perfNow() - Rank.lastPerf;
    } else if (mine) {   // 받은 순위표에 내 줄이 있으면 그 값과 서버 시각
      score = mine.score; week = mine.week; lp = mine.lp; dt = gameNow() - mine.at;
    } else if (S.rank.by === Rank.uid && S.rank.sent > 0) return null;   // 내 줄이 있는데 언제 올렸는지 모르면 한 번 그대로 올려 봐요(거절되면 15초 뒤 다시)
    if (score == null) return { score: 50000, lp: 1000 };   // 처음 올리기
    const up = dt >= 11000 ? 1 : 0;   // 규칙은 10초가 지나야 크게 받아 줘요(1초 넉넉히)
    dt = Math.max(0, dt - 1500);   // 시간 차이를 넉넉히 빼요
    return { score: Math.floor(score + up * 2000 + dt / 500), lp: Math.floor((week === S.lg.week ? lp : 0) + up * 1000 + dt / 10000) };
  }
  const be0 = () => !!(Rank.be && Rank.be.remove);
  // 2.2.0 검토 1: 대결 점수는 서버 규칙이 '하루 200점' 시간 예산(btq)으로 막아요. 오른 점수 1점마다 btq가 432초(하루 ÷ 200) 앞으로 가고,
  // btq는 서버 시각(now)을 넘을 수 없고 하루 전보다 뒤처진 만큼은 쌓이지 않아요. 그래서 쉬었다 와도 한 번에 200점, 그 뒤로는 하루 200점까지만 올라요.
  // 한 판 최대 +40, 하루 5판이라 정상 게임은 하루 200점을 넘지 않아요. 넘는 점수는 다음 업로드에서 차례로 따라가요
  const BT_DAY = 86400000, BT_MS = 432000, BT_SLACK = 15000;   // 서버 시각과 기기 추정 시각 차이를 15초까지 견뎌요
  function btRankDoc() {
    const mine = (Rank.rows || []).find(r => r.id === Rank.uid) || (Rank.brows || []).find(r => r.id === Rank.uid);
    // 두 기기가 같은 계정이면 btq가 더 큰 쪽(더 나중 서버 상태)을 기준으로 해요. btq는 줄어들 수 없어요
    let prev = 0, q = null, m = 0;
    if (Rank.sbt) { prev = Rank.sbt; q = Rank.sbtq; m = Rank.sbtm || 0; }
    if (mine && mine.bt && (q == null || (mine.btq != null && mine.btq > q))) { prev = mine.bt; q = mine.btq; m = Math.max(m, mine.btm); }
    if (!prev) prev = 1000;   // 처음이거나 bt 없이 올라간 줄은 1000부터
    const now = gameNow(), base = Math.max(q == null ? -Infinity : q, now - BT_DAY + BT_SLACK);
    const room = Math.max(0, Math.floor((now - BT_SLACK - base) / BT_MS));
    const bt = Math.max(1000, Math.min(S.bt.pts, prev + room)), d = Math.max(0, bt - prev);
    return { bt, btq: base + d * BT_MS, btm: Math.max(m, mine ? mine.btm : 0, Math.min(S.bt.lg, btLgOf(bt))) };
  }
  // 4.3.0 탐험 순위에 올릴 이번 주 가장 깊은 층과, 서버 규칙이 받아 줄 만큼으로 줄인 값
  function tamTf() { if (!S.tam) return 0; tamWeek(); return S.tam.wk.w === S.lg.week ? Math.max(0, Math.min(100000, S.tam.wk.best | 0)) : 0; }
  // 탐험 순위에 올릴 층: 서버 규칙이 받는 만큼만(3초마다 1층, 10초가 지나면 10층 더) 올려요. 일반 탐험(tf)과 심화 탐험(hf)이 같은 셈을 써요
  //   best 내 기록, rows 그 순위표, at와 w와 sent는 이번 주에 마지막으로 올린 때와 주와 값, key는 순위표 줄에서 읽을 칸 이름
  function tamRankStep(best, rows, at, w, sent, key) {
    const mine = (rows || []).find(r => r.id === Rank.uid), row = (Rank.rows || []).find(r => r.id === Rank.uid);
    let prev = 0, dt = null;
    if (at && w === S.lg.week) prev = sent; else if (mine && mine.week === S.lg.week) prev = mine[key];
    if (Rank.lastPerf != null && S.rank.by === Rank.uid) dt = perfNow() - Rank.lastPerf; else if (row) dt = gameNow() - row.at;
    const room = dt == null ? (S.rank.by === Rank.uid && S.rank.sent > 0 ? 0 : 10) : (dt >= 11000 ? 10 : 0) + Math.max(0, dt - 1500) / 3000;
    return Math.max(0, Math.min(best, Math.floor(prev + room)));
  }
  function tamRankDoc() { const v = tamRankStep(tamTf(), Rank.trows, Rank.stfAt, Rank.stfW, Rank.stf, 'tf'); return { tf: v, tq: S.lg.week * 1000000 + v }; }
  // 4.3.3 심화 탐험 순위: 일반 탐험(tf)과 같은 규칙 모양(3초마다 1층, 10초가 지나면 10층 더)
  function tamHf() { if (!S.tam) return 0; tamHWeek(); return S.tam.hw.w === S.lg.week ? Math.max(0, Math.min(100000, S.tam.hw.best | 0)) : 0; }
  function tamHRankDoc() { const v = tamRankStep(tamHf(), Rank.hrows, Rank.shfAt, Rank.shfW, Rank.shf, 'hf'); return { hf: v, hq: S.lg.week * 1000000 + v }; }
  const tamRankBehind = () => !tossRank() && Rank.state === 'on' && ((!Rank.noTam && tamTf() > (Rank.stfW === S.lg.week ? Rank.stf : 0)) || (!Rank.noTamH && tamHf() > (Rank.shfW === S.lg.week ? Rank.shf : 0)));
  async function submitRank(force) {
    if (Rank.state !== 'on' || Rank.readOnly || !Rank.uid || !(S.rank.joined || tossRank()) || Rank.writing || (hasCloudBuild() && (Cloud.deleting || Cloud.delLeft))) return;   // 2.2.0 검토 3
    if (S.u.dev) {   // 2.0.0 보안 점검(2-7): 개발자 메뉴로 재화를 받은 학교는 랭킹에 올리지 않아요
      if (S.rank.sent && be0()) { try { await Rank.be.remove(); } catch (e) { /* 다음에 다시 */ } S.rank.sent = 0; save(); }
      return;
    }
    const score = rankScore();
    // 다른 기기에서 옮겨 온 학교는 이 기기 id로 처음 올리는 거라서 점수가 같아도 올려요
    if (!force && score === S.rank.sent && S.rank.by === Rank.uid && lgKey() === S.rank.sws && !tamRankBehind()) return;
    if (!force && Date.now() - (Rank.lastPut || 0) < RANK_GAP) { rankDirty(); return; }   // 10초 간격(2-2)
    const g = Rank.gen, be = Rank.be;
    Rank.writing = true;
    try {
      lgWeek();
      // 2.0.0 Codex 검토(5): 서버 규칙은 한 번에 오르는 폭을 막아요(점수는 10초마다 약 2,000, 리그 점수는 약 1,000).
      // 종업식처럼 크게 오르면 규칙이 받아 주는 만큼만 올리고, 나머지는 10초 뒤에 이어서 올려요. 그래서 거절되어 읽기만 하게 되지 않아요
      const cap = be.toss ? null : rankCap();
      const sc = cap ? Math.min(score, cap.score) : score, lp = cap ? Math.min(S.lg.pts, cap.lp) : S.lg.pts;
      const ws = S.lg.week * 1000000 + lp;
      const doc = { name: S.rank.name, score: sc, tier: S.tier, year: yearNo(), test: !!S.u.dev, pid: S.pid, at: Date.now(), ws, lp, week: S.lg.week };
      if (S.ach && S.ach.title && /^[a-z]{1,12}$/.test(S.ach.title)) doc.title = S.ach.title;   /* 5.0.3.1 곁가지 이야기 칭호(st_)는 서버 규칙이 소문자만 받아서 보내지 않아요 */   // 1.7.1 칭호(서버 규칙을 게시한 뒤에 켜요)
      // 2.1.1 학기(woodani 요청: 랭킹에 학기도). 서버 규칙(sem)을 아직 게시하지 않아 거절되면 학기 없이 다시 올려요
      if (!Rank.noSem && semOn()) { doc.sem = S.sem; Rank.semSent = true; } else Rank.semSent = false;
      // 2.1.3 랭킹 시즌: 규칙(sk, sp)을 아직 게시하지 않아 거절되면 시즌 없이 다시 올려요. 규칙은 리그 점수처럼 10초에 1,000쯤까지 받아요
      if (!Rank.noSk && rsOn()) { rsSync(); const mine = (Rank.srows || []).find(r => r.id === Rank.uid), prev = mine && mine.sk === S.rs.n ? mine.sp : (Rank.ssp && Rank.ssk === S.rs.n ? Rank.ssp : null);
        const dt = mine ? gameNow() - mine.at : Rank.sspAt ? perfNow() - Rank.sspAt : 0; doc.sk = S.rs.n; doc.sp = Math.min(S.rs.p, prev == null ? 1000 : Math.floor(prev + (dt >= 11000 ? 1000 : 0) + Math.max(0, dt - 1500) / 10000)); Rank.skSent = true; } else Rank.skSent = false;
      // 2.0.1 숲속 대결 순위. 2.2.0 검토 1부터 규칙은 btq 시간 예산으로 하루 200점까지 받아요(btRankDoc)
      const bto = !be.toss && btOpen() ? btRankDoc() : null;
      if (bto) { doc.bt = bto.bt; doc.btm = bto.btm; if (!Rank.noBtq) { doc.btq = bto.btq; Rank.btqSent = true; } else Rank.btqSent = false; } else Rank.btqSent = false;   // 2.2.0 검토 1: 새 규칙(btq)을 게시하기 전에는 btq 없이
      // 4.3.0 탐험 순위: 규칙은 지난 쓰기 뒤 3초마다 1층(10초가 지나면 10층 더)까지 받아요. 규칙(tf, tq)을 게시하기 전에 거절되면 탐험 칸 없이 다시 올려요
      const tfo = !be.toss && !Rank.noTam ? tamRankDoc() : null;
      if (tfo) { doc.tf = tfo.tf; doc.tq = tfo.tq; Rank.tamSent = true; } else Rank.tamSent = false;
      // 4.3.3 심화 탐험 순위: 규칙(hf, hq)을 게시하기 전에 거절되면 심화 칸 없이 다시 올려요
      const hfo = !be.toss && !Rank.noTamH && tamHf() > 0 ? tamHRankDoc() : null;
      if (hfo) { doc.hf = hfo.hf; doc.hq = hfo.hq; Rank.tamHSent = true; } else Rank.tamHSent = false;
      await be.put(doc);
      Rank.lastPut = Date.now(); Rank.lastPerf = perfNow(); Rank.denied = 0;
      if (tfo && g === Rank.gen) { Rank.stf = tfo.tf; Rank.stfW = doc.week; Rank.stfAt = perfNow(); }
      if (hfo && g === Rank.gen) { Rank.shf = hfo.hf; Rank.shfW = doc.week; Rank.shfAt = perfNow(); }
      if (g === Rank.gen) { S.rank.sent = sc; S.rank.by = Rank.uid; S.rank.sws = ws; if (bto) { Rank.sbt = bto.bt; Rank.sbtq = bto.btq; Rank.sbtm = bto.btm; } if (Rank.skSent) { Rank.ssp = doc.sp; Rank.ssk = doc.sk; Rank.sspAt = perfNow(); } save(); lookPush(); }
    } catch (e) {
      const c = String((e && (e.code || e.message)) || '');
      if (g === Rank.gen && Rank.tamHSent && /permission/i.test(c) && !Rank.noTamH) { Rank.noTamH = true; Rank.writing = false; rankDirty(); renderRankPanel(); return; }   // 4.3.3 심화 칸 규칙이 아직 없어요
      if (g === Rank.gen && Rank.tamSent && /permission/i.test(c) && !Rank.noTam) { Rank.noTam = true; Rank.writing = false; rankDirty(); renderRankPanel(); return; }   // 4.3.0 탐험 칸 규칙이 아직 없어요
      if (g === Rank.gen && Rank.btqSent && /permission/i.test(c) && !Rank.noBtq) { Rank.noBtq = true; Rank.writing = false; rankDirty(); renderRankPanel(); return; }   // 2.2.0 검토 1 btq 칸 규칙이 아직 없어요
      if (g === Rank.gen && Rank.skSent && /permission/i.test(c) && !Rank.noSk) { Rank.noSk = true; Rank.writing = false; rankDirty(); renderRankPanel(); return; }   // 2.1.3 시즌 칸 규칙이 아직 없어요
      if (g === Rank.gen && Rank.semSent && /permission/i.test(c) && !Rank.noSem) { Rank.noSem = true; Rank.writing = false; rankDirty(); renderRankPanel(); return; }   // 2.1.1 학기 칸 규칙이 아직 없어요
      // 2.0.0: 규칙의 간격이나 오름 폭에 걸렸을 수 있어서 한 번은 15초 뒤 다시 해 보고, 또 막히면 읽기만 해요
      if (g === Rank.gen && /permission/i.test(c) && !Rank.denied) { Rank.denied = 1; Rank.lastPut = Date.now() + 4500; }
      else if (g === Rank.gen && /invalid_argument|not_granted|revoked|permission/i.test(c)) Rank.readOnly = true;
      else if (/quota_exceeded/.test(c)) toast('랭킹 자리가 꽉 찼어요. 나중에 다시 해 보세요');
    }
    if (g !== Rank.gen) return;
    Rank.writing = false;
    if (S.rank.joined && !Rank.readOnly && (rankScore() !== S.rank.sent || S.rank.by !== Rank.uid || lgKey() !== S.rank.sws || (btOpen() && S.bt.pts !== Rank.sbt) || (Rank.skSent && Rank.ssp < S.rs.p) || tamRankBehind())) rankDirty();
    renderRankPanel();
  }
  /* 교장 선생님 이름: 처음 한 번은 무료, 그다음부터는 바꿀 때마다 황금 도토리 5개, 6개, 7개... (2.1.0부터, 예전에는 50개, 60개, 70개)
     주사위를 누르면 '졸린 다람쥐'처럼 꾸밈말과 동물(숲속 물건) 이름을 이어서, 랭킹에 없는 이름을 골라 줘요 */
  const NICK_ADJ = ['귀여운', '슬픈', '졸린', '배고픈', '용감한', '수줍은', '신난', '느긋한', '똑똑한', '반짝이는', '포근한', '씩씩한', '엉뚱한', '다정한', '부지런한',
    '말랑한', '날쌘', '행복한', '꿈꾸는', '노래하는', '춤추는', '웃는', '조용한', '상냥한', '명랑한', '깜찍한', '든든한', '설레는', '꼬마', '심심한'];
  const NICK_NOUN = ['다람쥐', '토끼', '여우', '너구리', '병아리', '아기곰', '부엉이', '고슴도치', '수달', '판다', '펭귄', '코알라', '고양이', '강아지', '햄스터',
    '오리', '사슴', '두더지', '거북이', '참새', '도토리', '솔방울', '버섯', '청설모'];
  const NICK_AT = MAIN.findIndex(q => q.ch === 3);   // 3장을 마치고 4장 '대도시를 향해'가 열릴 때 이름을 정해요
  const nickKey = n => cleanName(n).replace(/\s/g, '').toLowerCase();
  const nickPrice = () => S.rank.name ? 5 + S.rank.ren : 0;   // 2.1.0 woodani 결정: 예전 값(50 + 10 × 바꾼 횟수)의 10분의 1
  const Nick = { names: null, at: 0 };
  async function takenNames(fresh) {
    if (!fresh && Nick.names && Date.now() - Nick.at < 30000) return Nick.names;
    let list = Rank.rows.filter(r => r.id !== Rank.uid).map(r => r.name);
    if (Rank.be && Rank.be.names) { try { list = list.concat(await Rank.be.names()); } catch (e) { /* 받은 순위표만 봐요 */ } }
    Nick.names = new Set(list.map(nickKey)); Nick.at = Date.now();
    return Nick.names;
  }
  function randNick(taken) {
    const mine = nickKey(S.rank.name);
    for (let i = 0; i < 60; i++) {
      const n = NICK_ADJ[Math.floor(Math.random() * NICK_ADJ.length)] + ' ' + NICK_NOUN[Math.floor(Math.random() * NICK_NOUN.length)];
      if (!taken.has(nickKey(n)) && nickKey(n) !== mine) return n;
    }
    return NICK_NOUN[Math.floor(Math.random() * NICK_NOUN.length)] + ' ' + (10 + Math.floor(Math.random() * 90));
  }
  async function rollNick(input) {
    if (!input) return;
    sfx('tap');
    input.value = randNick(await takenNames());
  }
  async function joinRank(raw) {
    const name = cleanName(raw);
    if (!name) { toast('랭킹에 보일 이름을 적어 주세요'); return false; }
    const same = name === S.rank.name, price = same ? 0 : nickPrice();
    if (S.gold < price) { toast(`이름을 바꾸려면 황금 도토리 ${price}개가 있어야 해요. ${price - S.gold}개 모자라요`); return false; }
    if (!same && (await takenNames(true)).has(nickKey(name))) { toast('이미 쓰는 이름이에요\n주사위로 다른 이름을 골라 보세요'); return false; }
    if (price) { S.gold -= price; S.st.gspent += price; S.rank.ren += 1; renderShopBtn(); }
    S.rank.name = name; S.rank.joined = true; S.rank.asked = true;
    rt.rankEdit = false;
    save();
    await submitRank(true);
    if (!Rank.readOnly) { toast(price ? `'${name}'${euro(name).slice(String(name).length)} 이름을 바꿨어요` : `'${name}' 교장 선생님, 랭킹에 올렸어요!`); sfx('quest'); }
    renderRankPanel();
    return true;
  }
  // 3장을 마치면 이름을 정하는 창을 한 번 띄워요. 토스 판은 토스 게임센터 이름을 써서 묻지 않아요
  function maybeAskNick() {
    if (!S || AIT || S.rank.joined || S.rank.asked || S.q.m < NICK_AT || rt.nickAsked) return;
    if (Rank.state === 'idle') { initRank(); return; }   // 랭킹이 이어지면 다시 불러요
    if (Rank.state !== 'on' || Rank.readOnly || tossRank()) return;
    rt.nickAsked = true;
    queueModal(() => {
      if (S.rank.joined) return false;
      openModal($('#mNick'));
      const i = $('#nickName');
      i.value = S.rank.name || '';
      if (!i.value) rollNick(i);
    });
  }
  async function leaveRank() {
    S.rank.joined = false; S.rank.sent = -1; S.rank.by = '';
    save();
    if (Rank.state === 'on' && Rank.uid && !Rank.readOnly) {
      try { await Rank.be.remove(); } catch (e) { /* 다음에 다시 빼면 돼요 */ }
    }
    if (S.lk.pub || S.lk.on || S.lk.del) await lookDelNow();   // 2.2.0 검토 6: 랭킹에서 빠지면 공개한 학교 모습도 지워요(켜 둔 설정은 다시 들어오면 써요)
    toast('랭킹에서 이름을 뺐어요');
    renderRankPanel();
  }
  // 랭킹을 못 여는 까닭
  function rankOffText() {
    if (!hasCloudBuild()) return '랭킹은 친구들과 함께 여는 게임 화면에서 열려요. 지금은 내 점수만 볼 수 있어요. 다른 학교 순위는 연결되면 보여요.';
    if (Cloud.state === 'error') return `서버에 연결하지 못해서 지금은 내 점수만 볼 수 있어요. 다른 학교 순위는 연결되면 보여요.${Cloud.err && Cloud.err !== 'etc' ? ` (오류 ${Cloud.err})` : ''}`;
    return '서버를 연결하기 전 체험판이라서 지금은 내 점수만 볼 수 있어요. 다른 학교 순위는 연결되면 보여요.';
  }
  /* 3.0.0 순위표 보조 줄(woodani 결정 2026-11-03, 자세한 것은 본부 인수인계 문서). 서버에는 아무것도 올리지 않아요 */
  const RKF = { fill: 20, lo: 0.3, hi: 1.1, endLo: 0.3, endHi: 0.9, start: 0.25, tierDrop: 0.04, floor: { week: 300, sea: 3000, bt: 60, all: 300 }, titled: 0.65,
    // 3.2.6 woodani 제보(월요일인데 이미 점수가 높음, 시즌 시작 전인데 시즌 점수): 주간과 시즌은 월요일 0점에서 시작해 사람처럼 요일과 시간대에 따라 올라가요.
    // 줄마다 요일별 노는 양이 다르고 쉬는 날(off)도 있어요. 하루에 오르는 점수는 dayCap을 넘지 않아요(오늘의 미션, 보너스, 행사, 체험학습, 대결을 열심히 한 하루쯤). 숫자는 본부 제안
    off: 0.22, dayCap: 260, refCap: 1800,
    // 5.0.1 woodani 요청(2026-11-17): 보조 줄은 고등학교까지만(maxTier), 학교 파워는 고등학교 끝쯤(hsRef)을 넘는 기준으로 크지 않게. 숫자는 본부 제안
    maxTier: 3, hsRef: 4500,
    // 5.0.1 woodani 요청(2026-11-17): 보조 줄은 모두에게 똑같이 보여요(내 계정, 내 점수, 내 학교급과 상관없이). 대결 점수 900~1500, 주간 기준 900. 숫자는 본부 제안
    btLo: 900, btHi: 1500, wkRef: 900 };
  // 하루 중 노는 양(0~23시). 새벽은 거의 없고 아침, 점심, 저녁에 몰려요
  const RKF_HOUR = [0.02, 0, 0, 0, 0, 0, 0.1, 0.5, 0.7, 0.35, 0.3, 0.35, 0.8, 0.6, 0.3, 0.3, 0.45, 0.7, 0.9, 1, 1, 0.9, 0.6, 0.25];
  const RKF_CUM = (() => { const c = [0]; RKF_HOUR.forEach(v => c.push(c[c.length - 1] + v)); return c.map(v => v / c[24]); })();
  const rkHourCum = h => { const i = Math.min(23, Math.floor(h)); return RKF_CUM[i] + (RKF_CUM[i + 1] - RKF_CUM[i]) * (h - i); };
  // 한 줄의 한 주: 요일별 몫(0~6, 월요일부터)과 그 주 마지막 점수
  function rkWeekPlan(rs, ref) {
    const w = Array.from({ length: 7 }, (_, d) => rkRnd(rs, 'd' + d) < RKF.off ? 0 : 0.5 + rkRnd(rs, 'v' + d));
    if (!w.some(x => x > 0)) w[rkHash(rs) % 7] = 1;
    const tot = w.reduce((a, b) => a + b, 0), u = rkRnd(rs, 'e');
    const end = Math.min(ref * (RKF.endLo + (RKF.endHi - RKF.endLo) * u), RKF.dayCap * tot / Math.max(...w));   // 가장 많이 노는 날도 하루 상한 안
    return { w, tot, end };
  }
  // 그 주 시작부터 (요일 dow, 시 h)까지 쌓인 점수
  function rkWeekAt(P, dow, h) { let done = 0; for (let d = 0; d < dow; d++) done += P.w[d]; done += P.w[dow] * rkHourCum(h); return P.end * done / P.tot; }
  // 3.0.1 woodani: 보조 줄도 칭호를 달아요. 점수가 높은 쪽 65%만 달고(낮은 쪽은 안 달아요), 실제로 얻을 수 있는 칭호만 그 학교급부터 골라요(숫자는 학교급)
  // 숲의 길잡이(메인 퀘스트 80개, 초등학교 2학년쯤), 마을 후원자(마을 기부 3단계), 꼬마 과학자(실험 노트 24장), 꾸미기 장인(지도 한 장에 장식 11개)
  const RKF_TI = { quest: 1, vdpatron: 1, lab: 1, deco: 1 };
  const rkHash = t => { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rkRnd = (seed, i) => (rkHash(seed + ':' + i) % 100000) / 100000;
  function rkPeriod(mode) {   // 기간이 얼마나 지났는지(0~1)
    const d = new Date(gameNow() + KST_MS);
    if (mode === 'week') return Math.min(1, (((d.getUTCDay() + 6) % 7) + (d.getUTCHours() + d.getUTCMinutes() / 60) / 24) / 7);
    if (mode === 'sea') { const m = d.getUTCMonth(), y = d.getUTCFullYear(), sm = m === 11 ? 11 : m < 2 ? -1 : m - (m - 2) % 3, st = Date.UTC(sm < 0 ? y - 1 : y, sm < 0 ? 11 : sm, 1);
      return Math.min(1, Math.max(0, (d.getTime() - st) / (91 * 86400000))); }
    return 0;
  }
  function rkFill(mode, rows, mine) {
    const need = RKF.fill - rows.length; if (need <= 0 || Rank.state !== 'on') return rows;
    if (mode === 'sea' && !rsOn()) return rows;   // 3.2.6 시즌이 시작하기 전에는 보조 줄도 없어요
    const seed = `${mode}|${mode === 'sea' ? 's' + rsNum() : gameWeek()}`, timed = mode === 'week' || mode === 'sea';   // 3.2.6 주간과 시즌은 rkTimed가 셈   // 5.0.1 모두에게 같게(계정 빼고)
    const memo = rt.rkMax || (rt.rkMax = {});
    const taken = new Set(rows.map(r => nickKey(r.name))), out = rows.slice();
    const us = Array.from({ length: need }, (_, i) => rkRnd(seed, i)), uCut = us.slice().sort((a, b) => b - a)[Math.max(0, Math.round(need * RKF.titled) - 1)];   // 점수는 u가 클수록 높아요
    for (let i = 0; i < need; i++) {
      const u = us[i];
      let v;
      if (timed) v = rkTimed(mode, seed + '|' + i);
      else if (mode === 'bt') v = RKF.btLo + (RKF.btHi - RKF.btLo) * u;   // 5.0.1 모두에게 같게
      else v = RKF.hsRef * (RKF.lo + (1 - RKF.lo) * u);   // 5.0.1 학교 파워는 고등학교 끝쯤(hsRef)의 30~100%, 모두에게 같게
      const mk = seed + '|' + i; v = Math.max(memo[mk] || 0, Math.max(1, Math.round(v))); memo[mk] = v;   // 한 번 보인 점수보다 내려가지 않아요
      let nm = NICK_ADJ[rkHash(seed + 'a' + i) % NICK_ADJ.length] + ' ' + NICK_NOUN[rkHash(seed + 'n' + i) % NICK_NOUN.length];
      if (taken.has(nickKey(nm))) nm = NICK_NOUN[rkHash(seed + 'n' + i) % NICK_NOUN.length] + ' ' + (10 + rkHash(seed + 'k' + i) % 90);
      taken.add(nickKey(nm));
      const tier = Math.min(RKF.maxTier, Math.floor(u * (RKF.maxTier + 1))), T = TIERS[Math.min(TIERS.length - 1, tier)];   // 5.0.1 보조 줄은 유치원~고등학교, 점수가 높을수록 위 학교급(모두에게 같게)
      const tis = Object.keys(RKF_TI).filter(id => RKF_TI[id] <= tier && achTitleName(id)), title = RKF.titled > 0 && u >= uCut && tis.length ? tis[rkHash(seed + 't' + i) % tis.length] : '';
      out.push({ id: 'x' + i, nx: true, name: nm, score: v, lp: v, sp: v, bt: v, btm: Math.min(5, Math.floor(u * 5)), tier, year: 1 + rkHash(seed + 'y' + i) % T.years, sem: rkHash(seed + 's' + i) % 2, title });   // 3.0.1 학기도 줄마다(유치원은 rankSchool이 안 보여 줘요)
    }
    const key = r => mode === 'sea' ? r.sp : mode === 'bt' ? r.bt : mode === 'week' ? r.lp : r.score;
    return out.sort((a, b) => (key(b) || 0) - (key(a) || 0));
  }
  // 3.2.6 주간: 이번 주 계획에서 지금까지. 시즌: 시즌 첫날부터 오늘까지 날마다 그 주 계획의 몫을 더해요(주간 줄과 같은 방식)
  function rkRef() { return RKF.wkRef; }   // 5.0.1 모두에게 같게(예전에는 내 지난주 점수 기준)
  function rkTimed(mode, rs) {
    const ref = rkRef(), now = gameNow() + KST_MS, day = Math.floor(now / 86400000), h = (now % 86400000) / 3600000;
    const dowOf = dy => ((dy - 4) % 7 + 7) % 7, wkOf = dy => Math.floor((dy - 4) / 7);   // 1970-01-05가 월요일
    if (mode === 'week') return rkWeekAt(rkWeekPlan(rs + '|w' + wkOf(day), ref), dowOf(day), h);
    const d = new Date(now), m = d.getUTCMonth(), y = d.getUTCFullYear(), sm = m === 11 ? 11 : m < 2 ? -1 : m - (m - 2) % 3;
    const st = Math.floor(Date.UTC(sm < 0 ? y - 1 : y, sm < 0 ? 11 : sm, 1) / 86400000);
    let v = 0, P = null, pk = null;
    for (let dy = st; dy <= day; dy++) {
      const k = wkOf(dy); if (k !== pk) { P = rkWeekPlan(rs + '|w' + k, ref); pk = k; }
      v += P.end * P.w[dowOf(dy)] * (dy === day ? rkHourCum(h) : 1) / P.tot;
    }
    return v;
  }
  /* 4.1.2 관리자(forest/adminUids)가 랭킹의 엉뚱한 줄을 지워요. 규칙은 4.1.1에 들어 있어요(지우기만, 고치기는 안 돼요).
     실시간으로 듣고 있어서 지우면 순위표가 저절로 다시 그려져요. 그 계정이 다시 올리는 것까지 막지는 못해요(차단 목록은 아직 없어요) */
  async function rankAdminDel(id) {
    if (!rt.isAdmin || !id || id === Rank.uid || !Rank.be || !Rank.be.removeOther) return;
    if (rt.rkDel !== id) { rt.rkDel = id; clearTimeout(rt.rkDelT); rt.rkDelT = setTimeout(() => { rt.rkDel = ''; renderRankPanel(); }, 5000); renderRankPanel(); return; }
    clearTimeout(rt.rkDelT); rt.rkDel = '';
    try { await waitFor(Rank.be.removeOther(id), CLOUD_WAIT); toast('랭킹에서 그 줄을 지웠어요'); }
    catch (e) { toast(cloudErrKey(e) === 'rules' ? '지우지 못했어요. 새 서버 규칙을 게시했는지 봐 주세요' : '지우지 못했어요. ' + CLOUD_ERR.net); }
    renderRankPanel();
  }
  function renderRankPanel() {
    if (!S || rt.tab !== 'rank') return;
    lgWeek();
    rsSync();
    // 4.1.2 관리자 랭킹 줄 지우기: 개발자 메뉴가 있는 판(웹)에서만, 켠 뒤 한 번만 관리자인지 물어봐요
    if (!rt.admChk && !AIT && !window.FOREST_STORE && cloudOn()) { rt.admChk = true; checkAdmin().then(() => { if (rt.isAdmin) renderRankPanel(); }).catch(() => {}); }
    const mode = tossRank() ? 'all' : (['all', 'bt', 'sea', 'tam'].includes(rt.rankView) ? rt.rankView : 'week'), wk = mode === 'week', bm = mode === 'bt', sea = mode === 'sea', tm = mode === 'tam';   // 4.3.0 탐험 순위   // 2.0.1 대결 순위, 2.1.3 시즌
    $('#rankView').hidden = tossRank();
    const th = tm && !!rt.rkH;   // 4.3.3 심화 탐험 순위
    $('#rankTamSeg').hidden = !tm; $$('#rankTamSeg [data-rth]').forEach(b => b.setAttribute('aria-checked', String((b.dataset.rth === '1') === th)));
    $$('#rankView [data-rv]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.rv === mode)));
    const score = th ? tamHf() : tm ? tamTf() : sea ? S.rs.p : bm ? S.bt.pts : wk ? S.lg.pts : rankScore();
    const R = th ? (Rank.hrows || []) : tm ? (Rank.trows || []) : tossRank() || (bm && !btOpen()) ? (sea ? (Rank.srows || []) : bm ? (Rank.brows || []) : wk ? Rank.wrows : Rank.rows) : rkFill(mode, sea ? (Rank.srows || []) : bm ? (Rank.brows || []) : wk ? Rank.wrows : Rank.rows, score), mine = R.findIndex(r => r.id === Rank.uid);   // 3.0.0 보조 줄
    if (wk && mine >= 0 && S.lg.pos !== mine + 1) { S.lg.pos = mine + 1; }
    if (sea && mine >= 0 && S.rs.pos !== mine + 1) { S.rs.pos = mine + 1; save(); }   // 2.1.3 시즌이 끝날 때 칭호를 정하는 순위
    $('#rankScoreLab').textContent = th ? '이번 주 가장 높은 심화 층' : tm ? '이번 주 가장 높은 층' : sea ? '이번 시즌 점수' : bm ? '내 대결 점수' : wk ? '이번 주 리그 점수' : '내 학교 파워';
    $('#rankScore').textContent = tm ? `${fmt(score)}층` : fmt(score);
    $('#rankPos').textContent = mine >= 0 ? `${mine + 1}위` : '-';
    const left = 7 - ((new Date(gameNow() + KST_MS).getUTCDay() + 6) % 7);   // 2.0.0 보안 점검(1-5): 한국 시간 요일
    if (tm) {   // 4.3.0 탐험 순위
      $('#rankSub').textContent = `월요일에 새로 시작해요 (${left}일 남음)`;
      $('#rankLead').textContent = th ? '' : '이번 주에 탐험대가 오른 가장 높은 층으로 겨뤄요.'; $('#rankLead').hidden = th;
    } else if (sea) {   // 2.1.3 랭킹 시즌
      const n = rsNum(), q = n ? RS_Q[rsQ(n)] : null;
      $('#rankSub').textContent = n ? `${rsLabel(n)}. ${S.rs.p >= RS.min ? `기념 장식 '${q[3]}'${eulOf(q[3])} 받아요` : `${fmt(RS.min - S.rs.p)}점 더 모으면 기념 장식 '${q[3]}'`}` : '랭킹 시즌은 2026년 12월에 시작해요';
      $('#rankLead').textContent = '주간 리그 점수를 시즌 내내 모아요. 300점을 넘기면 계절 기념 장식, 1~3위는 칭호 \'숲속 시즌 왕\'.';
    } else
    $('#rankSub').textContent = bm ? (btOpen() ? `${BT_LG[S.bt.lg].n} 리그, 오늘 남은 대결 ${btLeft()}판` : '숲속 대결은 초등학교 3학년부터 열려요') : wk ? `월요일에 새 리그가 시작돼요 (${left}일 남음). 리그에 참여하면 순위와 상관없이 황금 도토리 1개`
      : rankSchool(S.tier, yearNo(), semOn() ? S.sem : null) + (Rank.state === 'on' && R.length ? `, 랭킹에 ${R.length}명` : '');
    if (!tm) $('#rankLead').hidden = false;
    if (!sea && !tm) $('#rankLead').textContent = bm ? '숲속 대결 점수로 겨뤄요. 메달은 가장 높이 오른 리그예요.' : wk ? '이번 주에 한 일로 겨뤄요. 미션 10, 미션 보너스 20, 학교 행사 15, 체험학습 10(1시간마다 +5), 종업식 20, 퀘스트 3점(퀘스트와 식은 합쳐서 하루 30점까지).'
      : '학교 파워로 순위를 매겨요.';
    // 참여하기와 이름 바꾸기
    const join = $('#rankJoin'), key = `${Rank.state}|${Rank.readOnly}|${S.rank.joined}|${S.rank.name}|${rt.rankEdit ? 1 : 0}|${Cloud.state}|${Cloud.err}|${nickPrice()}|${S.gold >= nickPrice()}`;
    if (join.dataset.key !== key) {
      join.dataset.key = key;
      if (Rank.state === 'idle' || Rank.state === 'loading') join.innerHTML = '<p>랭킹을 불러오는 중이에요.</p>';
      else if (tossRank()) join.innerHTML = '<p>학교 파워는 토스 게임센터 랭킹에 올라가요. 토스 친구들과 순위를 겨뤄 보세요.</p><button class="cta small" type="button" data-rank="toss">토스 랭킹 보기</button>';
      else if (Rank.state === 'off') {
        join.innerHTML = '<p></p>' + (hasCloudBuild() && Cloud.state === 'error' ? '<button class="btn-link" type="button" data-rank="retry">다시 연결하기</button>' : '');
        $('p', join).textContent = rankOffText();
      }
      else if (Rank.readOnly) join.innerHTML = '<p>지금은 랭킹을 볼 수만 있어요.</p>';
      else if (S.rank.joined && !rt.rankEdit) {
        join.innerHTML = `<div class="rank-who"><span>교장 선생님 이름</span><b></b><button class="btn-link" type="button" data-rank="edit">이름 바꾸기</button><button class="btn-link" type="button" data-rank="leave">랭킹에서 빼기</button></div>`;
        $('b', join).textContent = S.rank.name;
      } else {
        const edit = S.rank.joined && rt.rankEdit, price = nickPrice();
        const coin = `<svg viewBox="-8 -11 16 20" aria-hidden="true">${GOLD_ICON.slice(GOLD_ICON.indexOf('>') + 1, -6)}</svg>`;
        const lead = edit ? `새 이름을 적거나 주사위를 눌러요. 이번에 바꾸면 황금 도토리 ${price}개가 들고, 다음에는 1개 더 들어요.`
          : S.rank.name ? '이 이름으로 다시 랭킹에 올릴 수 있어요. 이름을 바꾸면 황금 도토리가 들어요.'
          : '랭킹에 올릴 교장 선생님 이름을 정해요. 처음 한 번은 무료예요. 주사위를 누르면 귀여운 이름을 골라 줘요.';
        join.innerHTML = `<p>${lead}</p>` +
          `<form class="rank-form"><input id="rankName" maxlength="10" autocomplete="off" enterkeyhint="done" placeholder="예: 졸린 다람쥐" aria-label="교장 선생님 이름">` +
          `<button class="dice" type="button" data-rank="dice" aria-label="다른 이름 추천받기"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8.5" cy="8.5" r="1.6" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.6" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.6" fill="currentColor"/></svg></button>` +
          `<button class="cta${edit && S.gold < price ? ' poor' : ''}" type="submit">${edit ? `${coin}${price} 바꾸기` : S.rank.name ? '다시 올리기' : '이름 정하기'}</button></form>` +
          (edit ? '<button class="btn-link" type="button" data-rank="cancel">취소</button>' : '');
        $('#rankName', join).value = S.rank.name;
      }
    }
    // 2.1.3 다른 학교 구경: 내 학교 보여 주기(처음에는 꺼짐)와 예시 학교
    { const lk = $('#rankLook'), can = Rank.state === 'on' && !Rank.readOnly && S.rank.joined && !tossRank() && !!(Rank.be && Rank.be.lookPut), k2 = `${can}|${S.lk.on}|${S.lk.del ? 1 : 0}|${Rank.noLook ? 1 : 0}`;
      if (lk && lk.dataset.key !== k2) { lk.dataset.key = k2;
        lk.innerHTML = (can ? `<label class="rl-on"><input type="checkbox" id="lookOn"${S.lk.on ? ' checked' : ''}><span><b>내 학교 보여 주기</b><small>${S.lk.on ? (Rank.noLook ? '서버 준비 중이에요. 준비되면 저절로 올라가요' : '랭킹에서 다른 교장 선생님이 내 학교 지도를 구경할 수 있어요') : S.lk.del ? '서버에서 내 학교를 지우는 중이에요. 인터넷이 이어지면 다시 지워요' : '켜면 랭킹에서 내 학교 지도를 구경할 수 있어요'}</small></span></label>` : '') +
          `<button class="btn-sub rl-model" type="button" data-look="model">예시 학교 구경하기</button><p class="fine">랭킹의 학교 이름을 누르면 그 학교를 구경해요(보여 주기를 켠 학교만)</p>`; } }
    // 순위표: 이름은 다른 사람이 적은 글이라 textContent로만 넣어요
    const list = $('#rankList'), rows = Rank.state === 'on' ? R : [];
    const lkey = mode + rows.map(r => `${r.id}:${r.score}:${r.lp}:${r.sp}:${r.bt}:${r.btm}:${r.tf}:${r.name}:${r.tier}:${r.year}:${r.test ? 1 : 0}:${r.title}`).join('|') + `|${Rank.uid}|${S.units}|${S.ach ? S.ach.title : ''}|${rt.isAdmin ? 1 : 0}|${rt.rkDel || ''}`;
    const canDel = !!(rt.isAdmin && Rank.be && Rank.be.removeOther && !Rank.readOnly);
    if (list.dataset.key !== lkey) {
      list.dataset.key = lkey;
      list.textContent = '';
      rows.forEach((r, i) => {
        const li = document.createElement('li');
        li.className = 'rk' + (r.id === Rank.uid ? ' me' : '');
        const no = document.createElement('span');
        no.className = 'rk-no' + (i < 3 ? ' m' + (i + 1) : '');
        no.textContent = String(i + 1);
        const txt = document.createElement('div');
        txt.className = 'rk-txt';
        const nm = document.createElement('div');
        nm.className = 'rk-name';
        const ns = document.createElement('span');
        ns.textContent = r.name;
        nm.appendChild(ns);
        const tt = r.id === Rank.uid && S.ach ? S.ach.title : r.title;   // 1.7.1 칭호(내 줄은 서버에 없어도 보여요)
        if (bm) { const md = document.createElement('span'); md.className = 'rk-medal'; md.innerHTML = btMedal(Math.max(0, Math.min(5, r.btm | 0)), 18); nm.insertBefore(md, ns); }   // 2.0.1 대결 메달(숫자만 써서 그려요)
        if (tt && achTitleName(tt)) { const t = document.createElement('span'); t.className = 'rk-title'; t.textContent = achTitleName(tt); nm.appendChild(t); }
        if (r.id === Rank.uid) { const t = document.createElement('span'); t.className = 'rk-tag me'; t.textContent = '나'; nm.appendChild(t); }
        if (r.test) { const t = document.createElement('span'); t.className = 'rk-tag'; t.textContent = '테스트'; nm.appendChild(t); }
        const sc = document.createElement('div');
        sc.className = 'rk-school';
        sc.textContent = r.id === Rank.uid && semOn() ? rankSchool(S.tier, yearNo(), S.sem) : rankSchool(r.tier, r.year, r.sem);
        txt.append(nm, sc);
        if (canDel && !r.nx && r.id !== Rank.uid) {   // 4.1.2 관리자만: 남의 줄 지우기(두 번 눌러요)
          const db = document.createElement('button'), sure = rt.rkDel === r.id;
          db.type = 'button'; db.className = 'rk-del' + (sure ? ' sure' : ''); db.dataset.del = r.id;
          db.textContent = sure ? '한 번 더 누르면 지워요' : '이 줄 지우기';
          txt.appendChild(db);
        }
        const b = document.createElement('b');
        b.className = 'rk-score';
        b.textContent = th ? `${fmt(r.hf)}층` : tm ? `${fmt(r.tf)}층` : fmt(sea ? r.sp : bm ? r.bt : wk ? r.lp : r.score);
        if (!r.nx) { li.dataset.look = r.id; li.dataset.who = r.name; li.classList.add('can-look'); }   // 2.1.3 누르면 그 학교 구경(3.0.0 보조 줄은 구경 안 돼요)
        li.append(no, txt, b);
        li.setAttribute('aria-label', `${i + 1}위 ${r.name}, ${rankSchool(r.tier, r.year, r.sem)}, ${th ? '심화 탐험 가장 높은 층' : tm ? '탐험 가장 높은 층' : bm ? `대결 점수, ${BT_LG[Math.max(0, Math.min(5, r.btm | 0))].n} 리그` : wk ? '리그 점수' : '학교 파워'} ${fmt(th ? r.hf : tm ? r.tf : bm ? r.bt : wk ? r.lp : r.score)}`);
        list.appendChild(li);
      });
    }
    const empty = $('#rankEmpty');
    empty.hidden = tossRank() || !(Rank.state === 'on' && rows.length === 0);
    if (!empty.hidden) empty.textContent = th ? (Rank.noTamH ? '심화 탐험 순위는 서버 준비 중이에요.' : '아직 이번 주 심화 탐험 순위에 오른 학교가 없어요.') : tm ? (Rank.noTam ? '탐험 순위는 서버 준비 중이에요. 탐험 기록은 지금도 모이고 있어요.' : '아직 이번 주 탐험 순위에 오른 학교가 없어요. 탐험대를 보내 첫 번째가 되어 보세요!') : sea ? (Rank.noSk ? '시즌 순위는 서버 준비 중이에요. 시즌 점수는 지금도 모이고 있어요.' : '아직 이번 시즌 순위에 오른 학교가 없어요. 주간 리그 점수를 모아 첫 번째가 되어 보세요!') : bm ? '아직 대결 순위에 오른 학교가 없어요. 숲속 대결에서 첫 번째가 되어 보세요!' : '아직 랭킹에 이름을 올린 교장 선생님이 없어요. 첫 번째가 되어 보세요!';
  }

