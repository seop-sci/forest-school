  /* ---------- 6.0.0 씨앗 학교(세대) 저장 시제품 (Issue #265 단계 1, 개발자 메뉴에서만) ----------
     본교를 저장 한 벌 그대로 S.gen.home에 접어 두고 새 유치원으로 갔다가, 되돌아오면 접어 둔 본교를 그대로 꺼내요.
     기존 저장 칸은 하나도 지우거나 뜻을 바꾸지 않고 새 칸 S.gen만 더해요. 본교 안의 gen.home은 늘 null이라 한 겹만 접혀요.
     게임 화면에는 아무것도 보이지 않아요(웹판 개발자 메뉴의 두 단추뿐). 숫자와 규칙은 단계 2, 3에서 정해요 */
  const GEN6 = { v: 1 };   // 저장 칸 판 번호
  const freshGen = () => ({ v: GEN6.v, n: 0, home: null });
  // 저장 읽기: n은 세대 수. home(접어 둔 본교)은 받은 그대로 두고 망가지지 않았는지만 봐요(꺼낼 때 보통 불러오기처럼 한 번 다듬어요).
  // 읽을 때마다 다듬으면 본교가 여러 번 다듬어져 꺼낸 모습이 '그냥 다시 불러온 본교'와 달라져요. 안쪽(inner)에서는 home을 늘 비워요
  const GEN_HOME_MAX = 150000;   // 접어 둔 본교 글자 수 상한(서버 저장 한도 200,000자 안에서 새 학교 몫을 남겨요)
  function sanitizeGen(d, s, inner) {
    s.gen = freshGen();
    const G = d && d.gen && typeof d.gen === 'object' ? d.gen : null; if (!G) return;
    s.gen.n = Math.floor(numFb(G.n, 0, 0, SAVE_CAP.count));
    if (inner || !G.home || typeof G.home !== 'object' || Array.isArray(G.home)) return;
    try {
      const txt = JSON.stringify(G.home); if (txt.length > GEN_HOME_MAX) return;
      const h = JSON.parse(txt); sanitize(JSON.parse(txt), true);   // 다듬다가 멈추는 본교는 버려요(접기 전에 자동 보관이 있어요)
      if (h.gen && typeof h.gen === 'object') h.gen.home = null;   // 한 겹만
      s.gen.home = h;
    } catch (e) { s.gen.home = null; }
  }
  // 새 학교(유치원): 새로 시작하되 학교 번호, 설정, 게임 시계는 그대로. 랭킹에는 올리지 않아요(개발자 표시)
  const GEN_KEEP = ['pid', 'sound', 'bgm', 'vibrate', 'ambV', 'gfx', 'uiz', 'units', 'wxOff', 'nl'];
  function genMake(cur) {
    const home = JSON.parse(JSON.stringify(cur)); home.gen = { v: GEN6.v, n: cur.gen ? cur.gen.n : 0, home: null };   // 본교 한 벌(저장 글 그대로, 안쪽은 한 겹)
    const n = fresh();
    for (const k of GEN_KEEP) if (home[k] !== undefined) n[k] = home[k];
    n.clk = { last: Math.max((home.clk && home.clk.last) || 0, gameNow()) };
    n.tut = Object.assign({}, n.tut, { st: 'skip' });   // 시제품: 처음 안내는 건너뛰어요
    n.u.dev = true;   // 새 학교는 랭킹과 테스트 현황에서 개발자 학교로
    n.gen = { v: GEN6.v, n: home.gen.n, home };
    return n;
  }
  // 되돌아오기: 접어 둔 본교를 그대로 꺼내요. 본교는 멈춰 있었으니 저장 시각과 게임 시계만 지금으로(그동안 자리 비운 보상은 없어요)
  function genHome(cur) {
    if (!cur || !cur.gen || !cur.gen.home) return null;
    const h = JSON.parse(JSON.stringify(cur.gen.home)), now = gameNow();
    h.savedAt = now; h.away = { from: 0, skip: 0 };
    h.clk = Object.assign({}, h.clk, { last: Math.max((h.clk && h.clk.last) || 0, (cur.clk && cur.clk.last) || 0, now) });
    return h;
  }
  function genFold() {
    if (!S || rt.paused || rt.modalOpen || (S.gen && S.gen.home)) { toast(S && S.gen && S.gen.home ? '이미 새 학교에 와 있어요' : '지금은 할 수 없어요'); return false; }
    save();
    return adoptSave(JSON.stringify(genMake(S)), '시제품: 본교를 접어 두고 새 유치원으로 왔어요') === 'ok';   // 바꾸기 전 학교는 자동 보관(bak)에도 남아요
  }
  function genBack() {
    const h = genHome(S); if (!h || rt.paused) { toast('접어 둔 본교가 없어요'); return false; }
    save();
    return adoptSave(JSON.stringify(h), '시제품: 본교로 돌아왔어요') === 'ok';
  }
  function genDevSync() { const b = $('#devGenBack'); if (b) b.hidden = !(S && S.gen && S.gen.home); }
  document.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('#devGenGo, #devGenBack'); if (!t || !S) return;
    sfx('tap'); if (t.id === 'devGenGo') genFold(); else genBack();
  });
  setInterval(() => { try { if (!$('#devBox').hidden) genDevSync(); } catch (e) { /* 다음에 */ } }, 1000);
