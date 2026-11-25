  /* ---------- 5.4.0.3 놀이 기록 (woodani 2026-11-25 "모든 버전에 넣어줘") ----------
     무엇을 얼마나 하는지 재서 방향을 정하려고요. 화면에 보이는 것은 바뀌지 않아요.
     - 이 기기 저장 S.use: d[열쇠] 그 열쇠를 쓴 최근 날(날 번호, 7개까지), n[열쇠] 모두 몇 번. 열쇠는 60개까지
     - 열쇠: 탭 'tab_<탭>', 창 열기 '<창 id>', 합치기 'mg', 퍼즐 'pz', 대결 'bt', 광고 누름 'ad_ask:<자리>', 끝까지 봄 'ad_ok:<자리>', 못 봄 'ad_no:<자리>'
     - 웹과 안드로이드: 테스트 현황(forest/stats)의 use 칸(글 한 줄)으로 올라가요. 관리자 테스트 현황 위쪽에 놀이별로 모아 보여요
     - 토스: 토스 분석 로그(Analytics.screen, log_name이 열쇠)로도 보내요. 토스 콘솔에서 봐요 */
  const USE_KEEP = 7, USE_MAX = 60;
  const freshUse = () => ({ d: {}, n: {} });
  const useDayNo = () => Math.floor(Date.parse(gameToday() + 'T00:00:00Z') / 864e5) || 0;
  function useLog(k) {
    try {
      if (!S || !S.use || !k) return;
      k = String(k).replace(/[^A-Za-z0-9_:\-]/g, '').slice(0, 32);
      if (!k) return;
      const U = S.use;
      if (!(k in U.n) && Object.keys(U.n).length >= USE_MAX) return;
      U.n[k] = Math.min(1e7, (U.n[k] || 0) + 1);
      const t = useDayNo(), a = U.d[k] || (U.d[k] = []);
      if (a[a.length - 1] !== t) { a.push(t); if (a.length > USE_KEEP) a.splice(0, a.length - USE_KEEP); }
      if (AIT && AIT.log) AIT.log(k);
    } catch (e) { /* 기록은 게임에 닿지 않아요 */ }
  }
  // 테스트 현황 한 줄: '열쇠:지난 7일 쓴 날/모두 횟수', 많이 쓴 것부터 800자까지
  function useStr() {
    if (!S || !S.use) return '';
    const t = useDayNo(), U = S.use, out = [];
    for (const k of Object.keys(U.n)) out.push([k, (U.d[k] || []).filter(x => t - x < 7).length, U.n[k]]);
    out.sort((a, b) => b[1] - a[1] || b[2] - a[2]);
    let s = '';
    for (const [k, d, n] of out) { const p = `${k}:${d}/${Math.floor(n)}`; if (s.length + p.length + 1 > 800) break; s += (s ? ',' : '') + p; }
    return s;
  }
  function sanitizeUse(d, s) {
    const f = freshUse(), U = d && d.use && typeof d.use === 'object' ? d.use : null;
    if (U && U.n && typeof U.n === 'object') {
      for (const k of Object.keys(U.n).slice(0, USE_MAX)) {
        if (!/^[A-Za-z0-9_:\-]{1,32}$/.test(k)) continue;
        f.n[k] = Math.floor(numIn(U.n[k], 0, 1e7));
        const a = U.d && Array.isArray(U.d[k]) ? U.d[k].filter(x => Number.isInteger(x) && x > 0 && x < 1e6).slice(-USE_KEEP) : [];
        if (a.length) f.d[k] = a;
      }
    }
    s.use = f;
  }
  // 관리자 테스트 현황: 놀이별로 지난 7일 쓴 사람 수와 날 수를 모아요(테스트 도구로 만든 학교는 빼요)
  const USE_NM = { tab_school: '홈', tab_teachers: '선생님 탭', tab_tam: '탐험 탭', tab_study: '공부 탭', tab_street: '상점 탭', tab_shop: '가게', tab_rank: '랭킹', tab_dex: '도감', tab_deco: '꾸미기', tab_ess: '정수 가게',
    mg: '숲속 합치기', pz: '숲속 퍼즐', bt: '대결' };
  const useNm = k => { const [a, b] = k.split(':'); const m = { ad_ask: '광고 누름', ad_ok: '광고 봄', ad_no: '광고 못 봄' }[a]; return m ? `${m}(${b || ''})` : USE_NM[k] || k; };
  function useSumText(rows) {
    const agg = new Map();
    for (const r of rows) {
      if (r.dev || !r.use) continue;
      for (const p of r.use.split(',')) {
        const m = /^([A-Za-z0-9_:\-]{1,32}):(\d+)\/(\d+)$/.exec(p); if (!m || +m[2] <= 0) continue;
        const o = agg.get(m[1]) || { who: 0, days: 0 }; o.who++; o.days += Math.min(7, +m[2]); agg.set(m[1], o);
      }
    }
    if (!agg.size) return '';
    return '지난 7일 놀이별(쓴 사람, 쓴 날): ' + [...agg.entries()].sort((a, b) => b[1].who - a[1].who || b[1].days - a[1].days).slice(0, 30).map(([k, o]) => `${useNm(k)} ${o.who}명 ${o.days}일`).join(', ');
  }
