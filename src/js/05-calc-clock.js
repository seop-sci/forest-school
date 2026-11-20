  /* ---------- 계산 ---------- */
  const capacity = () => CFG.cap0 + CFG.capStep * S.f.classroom;
  const rep = () => repOf(S);
  // 종업식으로 남는 배수: 장학금은 레벨마다 1.3배씩 곱해지고, 전학생은 한 명마다 +5%
  // 전학 온 친구: 한 명마다 +5%, 다 온 뒤에는 친구 성장 쪽지로 키운 레벨마다 +2%
  const nlSum = () => (S.p.nl || []).reduce((a, b) => a + b, 0);
  // 친구 성장 쪽지 고르기: 전학생을 다 만났거나, 이미 쪽지를 받아 키우기 시작한 학교(2.0.0에 전학생이 12종으로 늘기 전에 6종을 다 만난 학교)
  const growOn = () => S.p.species >= ncMax() || (S.p.ticket || 0) > 0 || nlSum() > 0;
  const legacyMult = () => Math.pow(1.3, S.p.perk.schol) * (1 + 0.05 * S.p.species + 0.02 * nlSum()) * Math.pow(2, S.fp.schol);
  const tuitionMult = () => (1 + 0.2 * S.f.cafeteria) * (1 + 0.15 * S.t.squirrel) * (1 + FAC.store.per / 100 * (S.f.store || 0)) * (1 + FAC.dorm.per / 100 * (S.f.dorm || 0)) * (1 + FAC.union.per / 100 * (S.f.union || 0)) * (1 + FAC.institute.per / 100 * (S.f.institute || 0)) * (1 + FAC.gradhall.per / 100 * (S.f.gradhall || 0)) * rtClassMul() * taMult() * deptMult() * legacyMult() * setBonusMult() * tripMult() * clubTuitionMult() * elMult('tuition') * acMult() * snMult() * gdMult() * freshMult();   // 2.2.0 오늘의 급식, 4.0.0 새내기 장학금
  // 4.0.0 새내기 장학금(woodani 결정 2026-11-11: 대학교 1학년이 다른 학년의 두 배쯤 걸려서 줄여요): 대학교 1학년 동안만 수업료에 곱해요. 숫자는 bal400으로 잰 제안값
  const UNI_FRESH = { mult: 2.5 };
  const freshMult = () => (S && S.tier === 4 && S.tg === 0) ? UNI_FRESH.mult : 1;
  const feastOn = () => gameNow() < S.hd.feastUntil;   // 2.0.0 보안 점검(2-5): 게임 시계
  const rate = () => Math.max(0, Math.min(S.students, capacity()) - pcAway()) * CFG.base * CFG.pace * tuitionMult() * Math.pow(CFG.gradeMult, S.grade) * incomeScale() * (feastOn() ? 2 : 1);
  const offlineEff = () => Math.min(1, 0.3 + 0.15 * S.t.owl);
  const offlineCapH = () => CFG.offlineCapH + 4 * S.p.perk.night + rtLv('time');   // 5.0.0 연구 트리 시간
  const dropValue = () => rate() * 4 * (1 + 0.15 * S.t.bear) * (1 + 0.5 * S.p.perk.drop) * elMult('pick') * (wxIs('snow') ? 1.5 : 1);   // 2.0.1 반장 공약, 2.1.3 눈 오는 날 1.5배
  function earn(v) { S.earned += v; S.yearEarned += v; }
  // 수료증 = 10 × (올해 번 도토리 ÷ 100만)의 세제곱근 × 수료증 배수. 학교급이 오르면 공사비 배수로 나눠서 비슷한 장수가 나와요
  // (예전에는 제곱근이라 수업료가 크게 뛰는 고학년에서 수료증이 너무 많이 쌓였어요. 첫해 장수는 그대로예요)
  const dipMult = () => (1 + 0.25 * S.fp.dip) * (1 + 0.03 * S.f.science) * (S.hd.album ? 1.5 : 1);
  const previewDip = () => Math.floor(10 * Math.cbrt(S.yearEarned / (1e6 * costScale())) * dipMult() + 1e-9);
  const dipAt = d => Math.pow(d / (10 * dipMult()), 3) * 1e6 * costScale();
  // 졸업: 마지막 해(유치원 2년째)에 대도시 학교가 되면 졸업식을 열어요. 다음 학교급이 열려 있어야 해요
  const nextTierOpen = () => S.tier + 1 < TIER_OPEN;
  const finalYear = () => nextTierOpen() && S.tg >= tierInfo().grads;
  // 2.1.0: 초등학교부터는 한 학년이 두 학기예요. 1학기 끝에는 방학식(수료증 절반, 동네만 다시), 2학기 끝에 종업식이나 졸업식을 열어요
  const semOn = () => S.tier >= 1;
  const semFirst = () => semOn() && S.sem === 0;
  const semLabel = () => semOn() ? `${S.sem + 1}학기` : '';
  // 2.1.0 수료증은 전처럼 한 해 전체 수입으로 셈해요(woodani 결정): 방학식은 그 절반, 종업식은 한 해 몫에서 방학식에 준 것을 뺀 나머지
  const yearDip = () => semOn() ? Math.max(0, previewDip() - (S.semDip || 0)) : previewDip();
  const cereDip = () => semFirst() ? Math.ceil(previewDip() / 2) : yearDip();
  // 마지막 해에는 종업식 대신 졸업식을 열어요. 다음 학교급이 아직 안 열렸으면 종업식을 계속 열 수 있어요
  // 초등학교는 학년마다 메인 퀘스트 한 장이 있어서, 그 장을 마쳐야(그 학년 종업식 퀘스트까지 와야) 종업식을 열 수 있어요
  // 2.0.0: 중학교 학년 장도 같은 규칙(yt는 그 퀘스트의 학교급, 없으면 초등학교)
  const yearGateIdx = () => S.tier >= 1 ? MAIN.findIndex(q => q.ye === S.tg + 1 && (q.yt || 1) === S.tier) : -1;
  // 예전 장(1~6장)에 머물러 있는 학교는 막지 않아요. 수료증이 있어야 하는 퀘스트가 종업식에 막혀 멈추지 않게요
  // 2.0.0: 장마다 어느 학교급의 장인지(0~4장 유치원, 5~10장 초등학교, 11~14장 중학교). 다른 학교급의 장에 머물러 있으면 막지 않아요
  const chTier = ch => ch <= 4 ? 0 : ch <= 10 ? 1 : ch <= 14 ? 2 : ch <= 18 ? 3 : ch <= 23 ? 4 : 5;   // 5.0.0 24~27장은 대학원   // 4.0.0 19~23장은 대학교   // 3.0.0 15~18장은 고등학교
  // 2.1.0: 1학년 장(5장)도 막아요(퀘스트 목표를 상한 가까이로 다시 잡아서 학년 길이를 퀘스트가 맡아요)
  const yearLocked = () => { const i = yearGateIdx(), q = MAIN[S.q.m]; return i >= 0 && S.q.m < i && !!q && q.ch >= 5 && chTier(q.ch) === S.tier; };
  // 2.1.0 1학기 방학식: 그 학년 장의 앞 절반을 마쳐야(sy 표시가 붙은 '1학기 방학식' 퀘스트까지 와야) 열려요
  const semGateIdx = () => S.tier >= 1 ? MAIN.findIndex(q => q.sy === S.tg + 1 && (q.yt || 1) === S.tier) : -1;
  const semLocked = () => { const i = semGateIdx(), q = MAIN[S.q.m]; return semFirst() && i >= 0 && S.q.m < i && !!q && q.ch >= 5 && chTier(q.ch) === S.tier; };
  const semLeft = () => Math.max(0, semGateIdx() - S.q.m);
  const yearLeft = () => Math.max(0, yearGateIdx() - S.q.m);
  // 2.0.0: 초등학교 졸업식도 종업식처럼 6학년 장을 마쳐야(졸업식 퀘스트까지 와야) 열 수 있어요. 마치지 않은 채 중학교에 가면 6학년 퀘스트가 중학교에서 막혀요
  // 2.3.0 woodani 제보: 유치원 졸업식도 '유치원 졸업식'(k1) 퀘스트까지 와야 열려요(남은 유치원 퀘스트가 초등학교에서 뜨지 않게)
  const promoteGateIdx = () => MAIN.findIndex(q => q.t === 'tier' && q.n === S.tier + 1);
  const promoteLocked = () => { const i = promoteGateIdx(), q = MAIN[S.q.m]; return i >= 0 && S.q.m < i && !!q && (q.ch >= 6 || S.tier === 0) && chTier(q.ch) === S.tier; };
  const promoteLeft = () => Math.max(0, promoteGateIdx() - S.q.m);
  // 2026-11-11 woodani 결정: 마지막 학교급에서 학년을 되풀이할 때는(메인 퀘스트가 더 없어요) 건물 레벨을 더 올려야 방학식과 종업식을 열어요.
  // 전에는 기다림 없이 이어서 열려 수료증과 주간 리그 점수가 끝없이 쌓였어요. 지난 식 뒤로 건물 레벨 합이 '지은 건물 수'만큼 늘어야 해요(제안값). S.rp.b: 지난 식 때의 레벨 합
  const repYear = () => !!S && S.tier >= 1 && !nextTierOpen() && S.tg >= tierInfo().years;
  const repSum = () => facKeys().reduce((a, k) => a + (S.f[k] || 0), 0);
  const repBase = () => { if (!S.rp || !(S.rp.b > 0)) S.rp = { b: repSum() }; return S.rp.b; };   // 옛 저장은 처음 볼 때의 합부터 세요
  const repNeed = () => Math.min(facKeys().filter(k => (S.f[k] || 0) > 0).length, facKeys().reduce((a, k) => a + Math.max(0, facCap() - (S.f[k] || 0)), 0) + Math.max(0, repSum() - repBase()));
  const repLeft = () => repYear() ? Math.max(0, repNeed() - (repSum() - repBase())) : 0;
  const repLocked = () => repLeft() > 0;
  const repMark = () => { S.rp = { b: repSum() }; };
  const canGraduate = () => S.grade >= GRAD_MIN && (semFirst() ? !semLocked() : (!finalYear() && !yearLocked())) && !repLocked();   // 2.1.0 1학기 방학식은 앞 절반 퀘스트까지
  const canPromote = () => finalYear() && !semFirst() && S.grade >= GRAD_MIN && !promoteLocked();
  // 기금 = 이 학교급에서 모은 수료증 5장마다 1 + 졸업 축하 1. 올해 수료증도 함께 쳐요
  const FUND_PER = 5;
  const previewFund = () => Math.floor((S.tdip + yearDip()) / FUND_PER) + 1;
  const fpCost = k => FPERKS[k].cost(S.fp[k]);
  function addDip(v) { S.p.dip += v; S.tdip += v; S.st.dips += v; rankDirty(); }
  const perkCost = k => PERKS[k].cost(S.p.perk[k]);
  const perkMaxed = k => !!PERKS[k].max && S.p.perk[k] >= PERKS[k].max;
  // 2.0.0 업그레이드 추천(woodani: 무엇을 고칠지 모르겠어요). 기본은 수업료가 가장 많이 오르는 장학금이고,
  // 야간 자습 Lv.0이 장학금보다 싸면 먼저, 다른 것이 장학금 값의 3분의 1 이하로 싸면 그것을 추천해요
  function perkRec() {
    const ks = Object.keys(PERKS).filter(k => !perkMaxed(k)); if (!ks.length) return null;
    const sc = ks.includes('schol') ? perkCost('schol') : Infinity;
    if (ks.includes('night') && S.p.perk.night < 1 && perkCost('night') <= sc) return { k: 'night', why: '학교를 비운 동안 도토리가 더 오래 쌓여요' };
    const cheap = ks.filter(k => k !== 'schol').sort((a, b) => perkCost(a) - perkCost(b))[0];
    if (cheap && perkCost(cheap) * 3 <= sc) return { k: cheap, why: '지금 가장 경제적이에요' };
    return sc < Infinity ? { k: 'schol', why: '수업료가 가장 많이 올라요' } : { k: cheap, why: '지금 가장 경제적이에요' };
  }
  // 장학재단: 기본은 재단 장학금(수업료 두 배), 학급 문집이 장학금 값의 절반 이하면 학급 문집(수료증이 늘어 명예 교장실을 더 고쳐요)
  function fpRec() {
    const sc = fpCost('schol');
    if (fpCost('dip') * 2 <= sc) return { k: 'dip', why: '수료증이 늘어 명예 교장실을 더 고칠 수 있어요' };
    if (fpCost('rep') * 4 <= sc) return { k: 'rep', why: '지금 가장 경제적이에요' };
    return { k: 'schol', why: '수업료가 +100% 올라요' };
  }
  /* ---------- 게임 시계 (1.6.0) ----------
     하루 제한과 주간 제한은 기기 시계 대신 이 시계를 써요. 쓰는 법은 dev/memo.md "게임 시계".
     gameNow(): 지금 시각(ms, Date.now()와 같은 단위). 서버 시간을 받았으면(웹과 구글 플레이는 Firebase, 토스는 Environment.getServerTime) 서버 시간을 믿고 S.clk.last도 그 값으로 바로잡아요.
                서버 시간이 아직 없으면(오프라인, 옛 토스앱) 기기 시간을 쓰되, 지금까지 본 가장 늦은 시각(S.clk.last)보다 뒤로 가면 그 시각에 멈춰요. 그래서 시계를 뒤로 돌려도 새 날이 오지 않아요.
     gameToday(): gameNow()의 날짜를 한국 시간(UTC+9) 기준 'YYYY-MM-DD'로. 기기 시간대를 바꿔도 같은 날이에요.
     gameWeek(): 한국 시간 월요일 0시에 시작하는 주의 번호(정수). 2026-01-05(월)이 0이에요. */
  const KST_MS = 9 * 3600000;
  // SVR.base: 받은 서버 시각, SVR.perf: 그때의 performance.now(), SVR.dev: 그때의 기기 시각.
  // 2.0.0 Codex 검토(1): 서버 시간을 받은 뒤에는 기기 시계가 아니라 그때부터 흐른 시간(performance.now)을 더해요. 켜 둔 채 시계를 바꿔도 게임 시계는 그대로예요
  const SVR = { ok: false, offset: 0, base: 0, perf: 0, dev: 0, ask: 0, resync: null };   // offset: 서버 시간 - 기기 시간. Firebase(웹, 구글 플레이)나 토스(Environment.getServerTime)가 넣어 줘요
  const devNow = () => (window.__FOREST_TEST && rt.fakeNow) || Date.now();   // 기기 시계. 자동 시험은 꾸며 넣을 수 있어요
  const perfNow = () => (window.__FOREST_TEST && typeof rt.fakePerf === 'number') ? rt.fakePerf : performance.now();   // 흐른 시간. 자동 시험은 꾸며 넣을 수 있어요
  function setServerTime(serverMs) {
    if (!(typeof serverMs === 'number' && isFinite(serverMs) && serverMs > 0)) return;
    const was = S && SVR.ok && !rt.awayWait && !rt.paused && !document.hidden ? gameNow() : 0;   // 4.0.1 (3.3.2 분석 H4): 바로잡기 전 게임 시계
    SVR.offset = serverMs - devNow(); SVR.ok = true;
    SVR.base = serverMs; SVR.perf = perfNow(); SVR.dev = devNow(); SVR.ask = 0;
    if (S) {
      const t = gameNow();   // S.clk.last를 서버 시간으로 바로잡아요
      // 4.0.1 (H4, woodani 결정 2026-11-11): 켜 둔 채 휴대폰이 잠들어 흐른 시간이 멈췄던 기기는, 서버 시간을 다시 받았을 때 앞서간 만큼을 자리 비운 보상으로 줘요. 서버 시간끼리의 차이라 기기 시계로는 늘릴 수 없어요
      if (was > 0 && t - was > 10000) awayApply((t - was) / 1000);
      // 2.0.0 보안 점검(2-10): 미래로 고친 저장 시각은 서버 시간으로 되돌려요(다른 기기가 옛 학교로 되돌아가지 않게)
      if (S.savedAt > t + 60000) S.savedAt = t;
      awaySettle();   // 서버 시간을 기다리던 자리 비운 보상을 이제 계산해요
    }
  }
  // 기기 시계로 흐른 시간과 performance.now로 흐른 시간이 10초 넘게 다르면(시계를 바꿨거나 휴대폰이 잠들었다 깸) 서버 시간을 다시 받아요(1분에 한 번)
  function svrDrift(el) {
    if (Math.abs((devNow() - SVR.dev) - el) <= 10000) return;
    const p = perfNow();
    if (SVR.ask && p - SVR.ask < 60000) return;
    SVR.ask = p;
    if (typeof SVR.resync === 'function') setTimeout(() => { try { SVR.resync(); } catch (e) { /* 다음에 다시 */ } }, 0);
  }
  const kstDay = ms => { const d = new Date(ms + KST_MS); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`; };
  const serverTimeOk = () => SVR.ok;
  function gameNow() {
    const dev = devNow();
    if (!S) return dev;
    if (!S.clk) S.clk = { last: 0 };
    if (serverTimeOk()) { const el = Math.floor(perfNow() - SVR.perf), t = SVR.base + el; svrDrift(el); S.clk.last = t; return t; }
    // 2.0.0 보안 점검(2-6): 서버 시간을 받을 수 있는 판은 서버 시간이 오기 전까지 기기 시계를 믿지 않아요.
    // 마지막으로 믿은 시각(켤 때의 S.clk.last)에 이번에 켠 뒤 흐른 시간만 더해요. 그래서 오프라인에서 시계를 앞으로 돌려도 새 날이 오지 않아요
    if (timeSrc() && rt.clk0 && rt.clk0.last > 0) { const t = Math.max(S.clk.last, rt.clk0.last + (performance.now() - rt.clk0.perf)); S.clk.last = t; return t; }
    if (dev >= S.clk.last) { S.clk.last = dev; return dev; }
    return S.clk.last;
  }
  // 서버 시간을 받을 수 있는 판인지(웹과 구글 플레이는 Firebase, 토스는 Environment.getServerTime). Claude 화면과 옛 토스앱은 기기 시계를 써요
  const timeSrc = () => hasCloudBuild() || !!(AIT && AIT.serverTime);
  const gameToday = () => kstDay(gameNow());
  // 하루가 바뀌었으면 o.day를 오늘로 바꾸고 true를 돌려줘요. 하루 횟수를 0으로 돌리는 곳에서 써요: if (dayRoll(S.rd)) { S.rd.n = 0; }
  // 저장(save)은 부르지 않아요. 부르던 곳은 그 자리에서 그대로 불러요. 칸을 통째로 새로 만드는 곳(S.ffd = { day, n: 0 } 같은 곳)은 이 도우미를 쓰지 않아요
  const dayRoll = (o, t = gameToday()) => o.day !== t && (o.day = t, true);
  const gameWeek = () => Math.floor((gameNow() + KST_MS - Date.UTC(2026, 0, 5)) / 604800000);
  const boostLeft = () => BOOST.perDay - (S.ad.day === gameToday() ? S.ad.n : 0);
  const boostAmount = () => Math.max(100, nice(rate() * 60 * BOOST.min));
  const canStamp = () => S.att.last !== gameToday();
  const CH1 = () => MAIN.findIndex(q => q.ch === 1);   // 1장(튜토리얼)이 끝나는 퀘스트 번호
  const dealUnlocked = () => S.q.m >= CH1() || S.st.grads > 0 || S.tier > 0;
  const dealLeft = () => DEAL.perDay - (S.hd.day === gameToday() ? S.hd.n : 0);
  // 출석부는 1장(튜토리얼)을 마친 뒤에 열어서 첫 몇 분이 너무 쉬워지지 않게 해요
  const attUnlocked = () => S.q.m >= CH1() || S.st.grads > 0 || S.att.n > 0;
  /* 레벨 확장: 종업식을 열어도 시설과 선생님, 도토리는 그대로 남아요. 대신 학년(해)마다 시설의 최고 레벨이 5씩 늘어나요.
     유치원은 Lv.16부터, 초등학교는 Lv.18부터. 동네(마을 → 대도시)는 해마다 다시 키우고, 필요한 평판은 해마다 20%씩 높아져요 */
  const CAP_STEP = 5;
  // 2.1.0 두 학기 2차: 초등학교부터 상한을 1학기 방학식에 +2, 2학기 종업식에 +3(한 학년에 +5는 그대로, 균형 제안서 두 학기 2차)
  const SEM_CAP = 2;
  const yearCap = () => (S.tier >= GRAD_TIER ? 40 : S.tier >= 1 ? 18 : 16) + CAP_STEP * S.tg;   // 5.0.0 대학원은 대학교 4학년 2학기 상한(Lv.35) 다음부터   // 그 학년 1학기 상한(학기와 상관없이)
  const facCap = () => yearCap() + (S.tier >= 1 && S.sem ? SEM_CAP : 0);
  const capNext = () => !semOn() ? facCap() + CAP_STEP : semFirst() ? facCap() + SEM_CAP : yearCap() + CAP_STEP;   // 다음 식을 열면 열리는 상한
  const facMaxed = k => S.f[k] >= facCap();
  const CAMPUS8 = ['classroom', 'cafeteria', 'library', 'playground', 'science', 'store', 'dorm', 'union'];   // 5.0.1.3 대학원 퀘스트 facAll: 대학교 때 지은 건물 여덟 채
  // 학교가 계속 자라니까 높은 레벨은 값이 덜 가파르게 올라요: 시설은 Lv.15부터, 선생님은 Lv.12부터 한 레벨에 1.35배씩
  const SOFT = { fac: 15, tea: 12, g: 1.35 };
  const EARLY = { g: 1.27, ch: 7, back: 0.3 };   // 5.2.0 3안: 유치원과 초등 비용 곡선, 1~8장(유치원~초등 3학년) 건물 퀘스트는 그 레벨 공사비의 30%를 돌려받아요
  const softCost = (fn, L, from) => fn(Math.min(L, from)) * Math.pow(softG(), Math.max(0, L - from));
  // 5.2.0 woodani 결정(2026-11-20, '초반 성장 속도 조정안' 3안): 유치원과 초등학교는 레벨마다 1.35배 대신 1.30배
  // 5.3.0 woodani 결정(2026-11-20 저녁): 1.30배를 1.27배로(초등 4~6학년 도서관 퀘스트가 수업료로 19.5시간 걸리던 것, qbot 초등 전체 158시간 → 118시간)
  const softG = () => (S && S.tier <= 1) ? EARLY.g : SOFT.g;
  const facCost = k => facMaxed(k) ? Infinity : Math.ceil(softCost(FAC[k].cost, S.f[k] + (FAC[k].lvOff || 0), SOFT.fac) * costScale());   // 5.0.0 lvOff: 대학원 연구 건물
  /* ---------- 2.1.0 공사 시간과 시간 단축권 (속도와 경제 재설계안 2-1, 2-1-1) ----------
     시설을 한 레벨 올리거나 새로 지으면 돈을 내고 공사가 시작돼요. 끝나야 레벨이 올라요. 같은 건물은 한 번에 한 레벨, 다른 건물은 동시에 몇 개든.
     레벨 하나 공사 시간 [짧은 쪽, 긴 쪽](초): 학년 첫 레벨이 짧은 쪽, 그 학년 상한 레벨이 긴 쪽으로 고르게 늘어요. 새 건물(Lv.1 짓기)은 긴 쪽.
     자리 비운 동안에도 게임 시계(gameNow)로 공사가 돌아가요. 가구와 선생님 연수는 그대로 바로예요 */
  // 2.1.1 woodani 결정: 초등 저학년 1~15분, 고학년 15분~1시간, 중학교 1~2시간, 고등학교 2~3시간, 대학교 3~4시간, 대학원 4~8시간
  // 2.3.0 woodani 결정: 모든 학교급 처음 짓기 10초, 초등 1~3학년 30초~5분, 4~6학년 1~20분, 중학교 1학년 5~30분, 2학년 10~45분, 3학년 15분~1시간,
  // 고등학교 30분~1시간, 대학교 30분~2시간, 대학원 1~3시간(유치원 업그레이드는 5초 그대로)
  const CON = { kinder: [5, 5], low: [30, 300], high: [60, 1200], mid: [[300, 1800], [600, 2700], [900, 3600]], hs: [1800, 3600], uni: [1800, 7200], grad: [3600, 10800], first: 10 };
  const conBand = () => S.tier < 1 ? CON.kinder : S.tier === 1 ? (S.tg < 3 ? CON.low : CON.high) : S.tier === 2 ? CON.mid[Math.min(2, Math.max(0, S.tg))] : S.tier === 3 ? CON.hs : S.tier === 4 ? CON.uni : CON.grad;
  function conSec(k, L) {   // L: 공사가 끝나면 오를 레벨
    const [a, b] = conBand();
    if (k && FAC[k] && FAC[k].lvOff) { const [ua, ub] = CON.uni; return Math.round((L <= 1 ? ub : b) * fixMult() * (1 - deptX('eng') / 100) * (1 - rxPct('build') / 100)); }   // 5.0.0 연구 건물: 처음 짓기도 대학교 최고 레벨만큼(2시간), 그 뒤는 대학원 긴 쪽(3시간)
    if (L <= 1) return CON.first;   // 2.3.0 처음 짓기는 모든 학교급 10초
    const first = yearCap() - CAP_STEP + 1;   // 2학기에 상한이 +2 되어도 학년 첫 레벨은 그대로. 2학기에 열린 레벨(상한 +1, +2)은 긴 쪽
    return Math.round((a + (b - a) * Math.min(1, Math.max(0, (L - first) / (CAP_STEP - 1)))) * fixMult() * (1 - deptX('eng') / 100) * (1 - rxPct('build') / 100));   // 2.3.5 비버 선생님, 4.2.0 건축 연구
  }
  // 시간 단축권 넷(큰 것부터). 광고 1번에 5분권 6장, 하루 2번
  const TK = [{ k: 'h3', sec: 10800, name: '3시간권' }, { k: 'h1', sec: 3600, name: '1시간권' }, { k: 'm30', sec: 1800, name: '30분권' }, { k: 'm5', sec: 300, name: '5분권' }];
  const TKAD = { n: 6, perDay: 2 };
  const TK_CH = 6;   // 초등학교부터 메인 퀘스트 장을 마치면 5분권 6장
  // 2.1.1 woodani 요청: 미션과 이벤트 보상에도 시간 단축권(초등학교부터, 유치원은 공사가 5초라 안 줘요). 양은 본부 제안
  // 2.3.0.1 woodani 요청: 초반(유치원~초등 3학년)에 단축권을 얻을 길. 메인 퀘스트 1~8장에서 장마다 다섯 번째 퀘스트마다 5분권 1장,
  // 숲속 퍼즐 보상 판 한 판마다, 숲속 합치기 주문 5개마다 5분권 1장(각각 하루 1장, 모든 학교급). 숫자는 본부 제안
  const TK_REW = { pz: ['m5', 1], mg: ['m5', 1], dm: ['m5', 1], wk: ['m5', 1], evm: ['m5', 1], stamp: ['m5', 1], stamp5: ['m5', 1], box: ['m30', 1] };
  // 2.3.0.1 퍼즐과 합치기 단축권: 하루 TKE.perDay장까지
  function tkDaily(key) {
    if (!S || !S.tkd) return null;
    const t = gameToday(); if (dayRoll(S.tkd, t)) { S.tkd.pz = 0; S.tkd.mg = 0; }
    if ((S.tkd[key] || 0) >= TKE.perDay) return null;
    const it = tkGive(key); if (it) S.tkd[key] = (S.tkd[key] || 0) + 1;
    return it;
  }
  function tkGive(key) {
    const r = TK_REW[key]; if (!r || !S || !S.tk || (S.tier < 1 && key !== 'pz' && key !== 'mg')) return null;   // 2.3.0.1 퍼즐과 합치기는 유치원부터
    S.tk[r[0]] += r[1];
    const nm = TK.find(x => x.k === r[0]).name.replace('권', ' 단축권'), im = IMG('ticket_' + r[0]);
    return { ic: im ? `<img src="${im}" alt="" style="width:22px;height:22px;object-fit:contain">` : '⏱', t: `${nm} +${r[1]}장` };
  }
  const conOn = k => !!(S && S.bd && S.bd[k]);
  const conLeft = k => conOn(k) ? Math.max(0, Math.ceil((S.bd[k].e - gameNow()) / 1000)) : 0;
  const facBusy = k => facMaxed(k) || conOn(k);   // 추천에서 빼요(공사 중이면 다음 레벨을 못 걸어요)
  const tkAdLeft = () => TKAD.perDay - (S.tka.day === gameToday() ? S.tka.n : 0);
  const tkSum = () => TK.reduce((a, t) => a + S.tk[t.k], 0);
  // '1시간 30분', '45분', '5초'
  const hm = sec => { sec = Math.max(0, Math.ceil(sec)); if (sec < 60) return `${sec}초`; const m = Math.ceil(sec / 60), h = Math.floor(m / 60), r = m % 60; return h ? (r ? `${h}시간 ${r}분` : `${h}시간`) : `${r}분`; };
  // 바로 줄이기: 남은 시간에 맞춰 낭비가 가장 적은 조합. 큰 권부터 남은 시간을 넘지 않게 채우고, 자투리는 5분권으로.
  // 5분권이 모자라면 남은 시간보다 조금 넘는 가장 작은 권 하나. 그래도 모자라면 가진 만큼만 줄여요
  function tkPlan(rem) {
    const use = { h3: 0, h1: 0, m30: 0, m5: 0 }; let r = rem;
    for (const t of TK.slice(0, 3)) { const n = Math.min(S.tk[t.k], Math.floor(r / t.sec)); use[t.k] = n; r -= n * t.sec; }
    if (r > 0) { const n = Math.min(S.tk.m5, Math.ceil(r / 300)); use.m5 = n; r -= n * 300; }
    if (r > 0) { const t = TK.slice().reverse().find(x => S.tk[x.k] - use[x.k] > 0 && x.sec >= r); if (t) { use[t.k] += 1; r -= t.sec;
      // 2026-11-11: 큰 권 하나를 더 쓰게 됐으면, 그 권이 덮는 만큼 앞에서 넣은 작은 권은 도로 빼요(5분권이 같이 나가 버려지던 문제)
      for (const x of TK.slice().reverse()) { if (x.sec >= t.sec) continue; while (use[x.k] > 0 && r + x.sec <= 0) { use[x.k] -= 1; r += x.sec; } } } }
    const n = TK.reduce((a, t) => a + use[t.k], 0);
    return { use, n, left: Math.max(0, r), cut: rem - Math.max(0, r) };
  }
  const tkPlanText = p => TK.filter(t => p.use[t.k]).map(t => `${t.name} ${p.use[t.k]}장`).join(', ');
  const teaCost = k => Math.ceil(softCost(TEA[k].cost, S.t[k], SOFT.tea) * costScale() * (1 - deptX('edu') / 100));
  const teaMaxed = k => !!TEA[k].max && S.t[k] >= TEA[k].max;
  // 1.7.0 고슴도치 교감 선생님: 처음부터 계셔요(Lv.0). 연수를 보내면 학교 행사 상품 도토리가 레벨마다 +10%, 최고 Lv.10(+100%).
  // 올리는 값은 곰 선생님 연수 곡선(400부터 1.85배)과 같아요. 수업료 계산(rate)과 선생님 추천(TEA)에는 들어가지 않아요
  const VP = { name: '고슴도치 교감 선생님', subject: '교감', max: 10, per: 10,
    desc: '학교를 안내하는 교감 선생님이에요.',
    eff: L => L < 1 ? '학교 행사 보너스 없음' : `학교 행사 상품 +${VP.per * L}%` };
  const vpLv = () => (S && S.vp) || 0;
  const vpMaxed = () => vpLv() >= VP.max;
  const vpCost = () => Math.ceil(softCost(TEA.bear.cost, vpLv() + 1, SOFT.tea) * costScale() * (1 - deptX('edu') / 100));
  const vpMult = () => 1 + VP.per / 100 * vpLv();
  // 1.7.1 새 선생님 두 분: 그 건물을 지으면 학교에 오셔요(Lv.0). 교감 선생님처럼 따로 연수하고 값도 곰 연수 곡선, 최고 Lv.10.
  // 수업료 계산(rate)과 선생님 추천(TEA)에는 들어가지 않아요
  const XT = {
    diet: { name: '양 선생님', subject: '영양', fac: 'cafeteria', max: 10, per: 2, av: 'dietitian',
      desc: '급식실 식단을 짜는 영양 선생님이에요.',
      eff: L => L < 1 ? `특식 데이 ${DEAL.feastMin}분` : `특식 데이 ${DEAL.feastMin + XT.diet.per * L}분 (+${XT.diet.per * L}분)` },
    lib: { name: '사슴 선생님', subject: '사서', fac: 'library', max: 10, per: 3, av: 'librarian',
      desc: '도서관을 지키는 사서 선생님이에요.',
      eff: L => L < 1 ? '퍼즐 정수 보너스 없음' : `퍼즐 정수 +${XT.lib.per * L}%` },
    // 2.3.0 새 선생님 셋(작업지시서 39, woodani 결정). sub: 과목 선생님이라 탭에서 교감 선생님 위에, tier: 그 학교급부터 오셔요
    kor: { name: '고니 선생님', subject: '국어', fac: 'library', tier: 1, max: 10, per: 5, av: 'swan', sub: true,
      desc: '시를 즐겨 읽는 국어 선생님이에요.',
      eff: L => L < 1 ? '책 읽기 보너스 없음' : `책 읽기 국어 XP +${5 * L}%` + (Math.floor(L / 5) ? `, 하루 책 +${Math.floor(L / 5)}권` : '') },
    art: { name: '공작 선생님', subject: '미술', fac: 'classroom', tier: 1, max: 10, per: 5, av: 'peacock', sub: true,
      desc: '알록달록 깃털처럼 색을 잘 쓰는 미술 선생님이에요.',
      eff: L => L < 1 ? '합치기 보너스 없음' : `합치기 미술 XP +${5 * L}%` + (Math.floor(L / 5) ? `, 에너지 최대 +${10 * Math.floor(L / 5)}` : '') },
    snack: { name: '알파카 선생님', subject: '매점', fac: 'store', tier: 2, max: 10, per: 0.5, av: 'alpaca',
      desc: '복슬복슬한 매점 선생님이에요.',
      eff: L => `귀한 간식 ${(8 + 0.5 * L).toFixed(1).replace(/\.0$/, '')}%` + (L ? ` (+${(0.5 * L).toFixed(1).replace(/\.0$/, '')}%p)` : '') },
    // 3.0.0 오소리 선생님(작업지시서 39): 기숙사를 지으면 오셔요. 야간 자율학습으로 쌓이는 수업료가 늘어요
    dorm: { name: '오소리 선생님', subject: '사감', fac: 'dorm', tier: 3, max: 10, per: 5, av: 'badger',
      desc: '기숙사를 돌보는 사감 선생님이에요.',
      eff: L => L < 1 ? '자율학습 보너스 없음' : `자율학습 도토리 +${5 * L}%` },
    // 2.3.5 비버 선생님(작업지시서 48, woodani 결정): 초등학교부터, 연수는 숲의 정수(20+10n), 한 레벨에 공사 시간 -2%
    fix: { name: '비버 선생님', subject: '시설', fac: 'classroom', tier: 1, max: 10, per: 2, av: 'beaver', ess: true,
      desc: '망치질이 특기인 시설 선생님이에요. 공사장에서 뚝딱뚝딱 고쳐요.',
      eff: L => L < 1 ? '공사 시간 그대로' : `공사 시간 -${2 * L}%` },
    // 3.1.0 코끼리 선생님(3.1.0 설계안, woodani 결정): 고등학교부터 상담실. 연수 한 레벨에 상담 관심 +5%, Lv.5와 Lv.10에 하루 상담 +1번
    cou: { name: '코끼리 선생님', subject: '진로', fac: 'classroom', tier: 3, max: 10, per: 5, av: 'elephant',
      desc: '복도 상담실에서 학생들의 꿈을 함께 찾는 진로 선생님이에요.',
      eff: L => (L < 1 ? `하루 상담 ${CS.perDay}번` : `상담 관심 +${5 * L}%`) + (Math.floor(L / 5) ? `, 하루 상담 +${Math.floor(L / 5)}번` : '') },
    // 4.0.0 두루미 학장 교수님(4.0.0 설계안 4절, 작업지시서 54): 학생회관을 지으면 오셔요. 연수 한 레벨에 단과대학 보너스 +3%(최대 +30%). 단과대학(5절)이 들어오면 deanMult()를 곱해요
    dean: { name: '두루미 학장 교수님', subject: '학장', fac: 'union', tier: 4, max: 10, per: 3, av: 'crane',
      desc: '학생회관 학과 사무실에 계신 학장 교수님이에요.',
      eff: L => L < 1 ? '단과대학 수업료 보너스 그대로' : `단과대학 수업료 보너스 +${3 * L}%` },
    // 5.0.0 펠리컨 지도교수님(woodani 결정 2026-11-16, 작업지시서 85 그림): 연구소를 지으면 오셔요. 연수 한 레벨에 연구 트리 연구 시간 -3%(최대 -30%). 숫자는 본부 제안
    adv: { name: '펠리컨 지도교수님', subject: '지도교수', fac: 'institute', tier: 5, max: 10, per: 3, av: 'pelican',
      desc: '대학원생의 연구를 이끄는 지도교수님이에요. 연구소에 계셔요.',
      eff: L => L < 1 ? '연구 시간 그대로' : `연구 트리 연구 시간 -${3 * L}%` } };
  // 4.0.0 호칭(woodani 결정 2026-11-11): 대학교부터 과목을 가르치는 분(다람쥐, 곰, 부엉이, 고니, 공작)만 '교수님', 고슴도치 교감 선생님은 '부총장님'.
  // 영양, 사서, 매점, 사감, 시설, 진로처럼 과목이 아닌 분은 그대로 '선생님'. 아래 탭과 탭 안 제목은 대학교에서 '교수님'
  const uniNow = () => { try { return !!S && S.tier >= 4; } catch (e) { return false; } };
  const headText = t => uniNow() && typeof t === 'string' ? t.replace(/교장 선생님/g, '총장님') : t;   // 4.0.0 woodani 결정(2026-11-11): 대학교에서는 교장 선생님을 총장님으로(랭킹의 다른 사람 호칭은 그대로)
  const profText = t => uniNow() ? t.replace('교감 선생님', '부총장님').replace(/ 선생님/g, ' 교수님') : t;
  /* 4.1.1 woodani 결정(2026-11-12): 대학교에서는 학교 낱말을 대학교 낱말로 바꿔 보여요. 보이는 글자만 바꾸고 열쇠, 저장, 규칙은 그대로예요.
     화면에 글자가 들어올 때(MutationObserver) 바꾸고, 대학교가 아니게 되면 원래 글자로 되돌려요.
     바꾸지 않는 곳(data 없이 id로): 랭킹, 앨범, 이야기 수첩, 공지, 대학교 전 장의 이야기 장면, 지난 학교급과 다른 학교 구경 지도.
     UT: [원래, 대학교, 받침이 없어지면 1, ㄹ 받침이 다른 받침이 되면 2]. 긴 낱말을 먼저 적어요 */
  const UT = [['교장 선생님 이름', '총장님 이름', 0], ['명예 교장실', '명예 총장실', 0], ['교무실', '교수 연구실', 0], ['현장체험학습', '현장 답사', 1], ['야간 자율학습', '밤샘 공부', 1], ['숲속 운동회', '체육대회', 0], ['반장 선거', '학생회장 선거', 0], ['체험학습', '현장 답사', 1], ['보충수업', '계절학기', 1],
    ['종업식', '종강 파티', 1], ['방학식', '종강 파티', 1], ['졸업식', '학위수여식', 0], ['급식실', '학생 식당', 2], ['과학실', '실험실', 0], ['교실', '강의실', 0], ['운동회', '체육대회', 0], ['학예회', '동아리 공연', 0],
    ['전학생', '신입생', 0], ['반장', '학생회장', 0], ['소풍', 'MT', 1], ['숙제', '과제', 0], ['자율학습', '자습', 0], ['전학 온', '새로 온', 0], ['전학 왔', '입학했', 0], ['전학 올', '새로 올', 0], ['급식', '학식', 0], ['문제집', '전공책', 0]];
  const UT_MAP = Object.fromEntries(UT.map(x => [x[0], x])), UT_JO = { '을': '를', '이': '가', '은': '는', '과': '와', '으로': '로', '이에요': '예요', '이라': '라', '이나': '나', '이랑': '랑', '이었': '였' };
  const UT_RE = new RegExp('(' + UT.map(x => x[0]).join('|') + ')(이에요|이었|이라|이나|이랑|으로|로|을|이|은|과)?', 'g');
  const UT_SKIP = '#panelRank, #mAlbum, #mSb, #mNotice, input, textarea, script, style';
  const UT_OLD = /(유치원|초등학교|중학교|고등학교) $/;   // '유치원 졸업식'처럼 지난 학교급의 식 이름은 그대로 둬요
  const utW = X => gradOn() && X[1] === '종강 파티' ? '세미나' : X[1];   // 5.0.0 대학원은 학기를 마칠 때 세미나(woodani 결정)
  const uniTerm = t => t.replace(UT_RE, (m, w, jo, at, all) => { const X = UT_MAP[w]; if ((w === '졸업식' || w === '종업식' || w === '방학식') && UT_OLD.test(all.slice(0, at))) return m; if (!jo) return utW(X); if (X[2] === 1) return utW(X) + (UT_JO[jo] || jo); if (X[2] === 2 && jo === '로') return utW(X) + '으로'; return utW(X) + jo; });
  function utNode(n) {
    const pe = n.parentElement; if (!pe || !n.nodeValue) return;
    if (!uniNow()) { if (n._o != null && n.nodeValue === n._u) n.nodeValue = n._o; n._o = null; return; }
    UT_RE.lastIndex = 0; if (!UT_RE.test(n.nodeValue)) return;
    if (pe.closest(UT_SKIP)) return;
    if (pe.closest('#mSt') && !(rt.st && rt.st.uni)) return;   // 유치원부터 고등학교까지의 이야기는 쓰인 그대로
    if (rt.viewTier != null && pe.closest('#map')) return;      // 지난 학교급과 다른 학교 구경
    const o = n.nodeValue, u = uniTerm(o); if (u === o) return;
    n._o = o; n._u = u; n.nodeValue = u;
  }
  function utWalk(root) {
    if (!root) return;
    if (root.nodeType === 3) { utNode(root); return; }
    if (root.nodeType !== 1) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; const L = [];
    while ((n = w.nextNode())) L.push(n);
    for (const x of L) utNode(x);
  }
  // 학교급이 대학교가 되거나(졸업식, 다른 기기 학교 불러오기) 아니게 되면 화면 전체를 한 번 훑어요
  function utSync() {
    const on = uniNow(); if (rt.utOn === on) return;
    rt.utOn = on;
    if (!rt.utObs && on && window.MutationObserver) {
      rt.utObs = new MutationObserver(ms => { if (!rt.utOn) return; for (const m of ms) { if (m.type === 'characterData') utNode(m.target); else for (const a of m.addedNodes) utWalk(a); } });
      rt.utObs.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
    utWalk(document.body);
  }
  for (const o of [...Object.values(TEA), ...Object.values(XT).filter(X => X.sub), VP]) for (const f of ['name', 'desc']) { const t = o[f]; Object.defineProperty(o, f, { get: () => profText(t), enumerable: true, configurable: true }); }
  { const sj = VP.subject; Object.defineProperty(VP, 'subject', { get: () => uniNow() ? '부총장' : sj, enumerable: true, configurable: true }); }
  const deanMult = () => 1 + XT.dean.per / 100 * xtLv('dean');   // 4.0.0 단과대학 보너스에 곱해요
  // 4.0.0 단과대학(설계안 5절): 8곳 가운데 학년에 따라 1~3곳을 골라요. 숫자는 모두 제안값이에요
  const DEPT = { ess: 30, base: 10, max: 30, job: 2, jobMax: 10,
    list: [
      { k: 'science', name: '자연과학대학', sub: ['sci'], fac: 'science', em: '🔬' },
      { k: 'sports', name: '체육대학', sub: ['pe'], fac: 'playground', em: '⚽' },
      { k: 'human', name: '인문대학', sub: ['kor'], fac: 'library', em: '📖' },
      { k: 'art', name: '예술대학', sub: ['art'], fac: 'union', em: '🎨' },
      { k: 'biz', name: '경영대학', sub: ['math'], fac: 'store', em: '⚖️' },
      { k: 'eng', name: '공과대학', sub: ['math'], fac: 'dorm', em: '⚙️' },
      { k: 'edu', name: '사범대학', sub: ['kor', 'math', 'sci', 'art', 'pe'], avg: 1, fac: 'classroom', em: '🍎' },
      { k: 'med', name: '의과대학', sub: ['sci', 'pe'], low: 1, fac: 'cafeteria', year: 3, em: '🩺' }
    ] };
  const DEPT_AB = ['sci', 'pe', 'kor', 'art', 'math'];   // 진로(JOBS.ab) 번호를 과목 열쇠로
  const deptOf = k => DEPT.list.find(D => D.k === k);
  const deptOpen = () => uniNow() && (S.f.union || 0) >= 1;
