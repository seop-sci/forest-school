  /* ===== 1.7.1 업적과 칭호 BEGIN =====
     업적은 종류 12개 × 등급 5개(동, 은, 금, 백금, 무지개). 칭호는 5단계를 이루면 받아요. 이미 있는 누적 기록(v)으로 재요. 숫자와 칭호는 ACH 한곳에서 바꿔요.
     이룬 등급(hit)은 1초마다 기록해 두고(학생 수처럼 줄어드는 값도 한 번 이루면 남아요), 받기 버튼으로 보상(got)을 받아요.
     1.8.0 머지 게임 업적은 ACH에 한 줄 더하면 돼요 */
  const ACH_GOLD = [1, 2, 3, 4, 5];   // 단계마다 보상 황금 도토리
  const ACH_TIER = ['동', '은', '금', '백금', '무지개'];
  const ACH_N = ACH_TIER.length;
  const ACH = [
    { id: 'students', name: '학생 모으기', goals: [10, 50, 150, 400, 1000], title: '인기 만점 학교', t: n => `학생 ${fmt(n)}명 모으기`, v: () => Math.floor(S.students) },
    { id: 'grad', name: '종업식과 졸업식', goals: [1, 5, 20, 50, 100], title: '졸업식 단골', t: n => `종업식이나 졸업식 ${n}번 열기`, v: () => S.st.grads },
    { id: 'building', name: '건물 키우기', goals: [10, 20, 30, 40, 50], title: '숲속 건축왕', t: n => `건물 하나를 Lv.${n}까지 올리기`, v: () => Math.max(0, ...Object.values(S.f)) },
    { id: 'teacher', name: '선생님 연수', goals: [10, 50, 200, 500, 1000], title: '연수 대장', t: n => `선생님 연수 ${n}번 보내기`, v: () => S.st.trains, ok: () => false },
    { id: 'quest', name: '메인 퀘스트', goals: [10, 20, 40, 60, 80], title: '숲의 길잡이', t: n => `메인 퀘스트 ${n}개 끝내기`, v: () => S.q.md },   // 보안 점검(1-7): 번호 대신 끝낸 수
    { id: 'puzzle', name: '숲속 퍼즐', goals: [1000, 3000, 10000, 20000, 40000], title: '퍼즐 박사', t: n => `숲속 퍼즐 ${fmt(n)}점 넘기`, v: () => S.pz ? S.pz.best : 0 },
    { id: 'dex', name: '동물 도감', goals: [3, 6, 10, 14, 0], title: '동물 박사', t: n => n >= DEX_KEYS.length ? '동물 도감 모두 모으기' : `동물 도감 ${n}칸 채우기`, v: () => dexCount('all') },
    { id: 'fest', name: '학교 행사', goals: [5, 30, 100, 250, 500], title: '축제 대장', t: n => `학교 행사 ${n}번 열기`, v: () => S.st.sports + Object.values(S.fest.n).reduce((a, b) => a + b, 0) },
    { id: 'attend', name: '출석', goals: [7, 30, 100, 200, 365], title: '개근상', t: n => `출석 도장 ${n}일 찍기`, v: () => S.att.n },
    { id: 'trip', name: '체험학습', goals: [3, 15, 50, 100, 200], title: '여행 대장', t: n => `체험학습 ${n}번 다녀오기`, v: () => S.st.trips },
    { id: 'gold', name: '황금 도토리', goals: [30, 150, 500, 1000, 2000], title: '황금 부자', t: n => `황금 도토리 모두 ${n}개 모으기`, v: () => S.st.gold },
    { id: 'rank', name: '학교 파워', goals: [2000, 5000, 15000, 30000, 60000], title: '숲의 교장', t: n => `학교 파워 ${fmt(n)} 넘기`, v: () => schoolPower() },
    { id: 'deco', name: '학교 꾸미기', goals: [1, 3, 6, 9, 11], title: '꾸미기 장인', t: n => `지도에 장식 ${n}개 놓기`, v: () => decoPlacedAll() },
    { id: 'battle', name: '숲속 대결', goals: [10, 50, 200, 500, 1000], title: '승부사', t: n => `숲속 대결 ${fmt(n)}번 이기기`, v: () => S.bt ? S.bt.st.w : 0 },
    { id: 'league', name: '대결 리그', goals: [1, 2, 3, 4, 5], title: '숲속 챔피언', t: n => `숲속 대결 ${BT_LG[n].n} 리그 가기`, v: () => S.bt ? S.bt.lg : 0 },   // 동~무지개
    { id: 'snack', name: '간식 도감', goals: [5, 10, 14, 17, 20], title: '매점 단골', ic: 'snack_01', t: n => n >= 20 ? '간식 도감 모두 모으기' : `간식 도감 ${n}종 모으기`, v: () => snCount() },
    { id: 'donate', name: '마을 기부', goals: [1, 3, 5, 8, 20], title: '숲속 기부왕', ic: 'donate_ic', t: n => `마을 기부 ${n}단계`, v: () => S.vd ? S.vd.lv : 0 },
    { id: 'rare', name: '반짝 친구', goals: [1, 2, 3, 4, 6], title: '반짝 친구 수집가', ic: 'rare_badge', t: n => n >= 6 ? '반짝 친구 모두 만나기' : `반짝 친구 ${n}명 만나기`, v: () => S.rare ? S.rare.got.length : 0 },
    { id: 'garden', name: '급식 메뉴', goals: [2, 4, 8, 12, 16], title: '숲속 요리사', ic: 'menu_01', t: n => n >= GD_MENU.length ? '급식 메뉴 모두 만들기' : `급식 메뉴 ${n}가지 만들기`, v: () => gdMenuCount() },
    { id: 'cgwin', name: '동아리 대항전', goals: [1, 2, 4, 7, 10], title: '대항전 챔피언', ic: 'league_ic', t: n => `동아리 대항전 ${n}번 우승`, v: () => S.cg.wins },
    { id: 'bio', name: '생물 탐사', goals: [10, 25, 45, 70, 90], title: '꼬마 생물학자', ic: 'bio_ladybug', t: n => n >= BIO.length ? '생물 도감 모두 채우기' : `생물 ${n}종 관찰하기`, v: () => bxCount() },
    { id: 'lab', name: '과학 탐구 실험', goals: [3, 8, 14, 20, 24], title: '꼬마 과학자', t: n => n >= 24 ? '실험 노트 모두 채우기' : `실험 노트 ${n}장 채우기`, v: () => labCount() },   // 공부 2단계(노트 24장)
    { id: 'selfstudy', name: '야간 자율학습', goals: [1, 5, 15, 30, 60], title: '밤공부 대장', ic: 'ic_selfstudy', t: n => `야간 자율학습 ${n}번 마치기`, v: () => S.ns ? S.ns.fin || 0 : 0 },   // 마친 밤
    { id: 'counsel', name: '진로 상담', goals: [3, 6, 10, 14, 18], title: '꿈 찾기 선생님', ic: 'ach_counsel', t: n => `진로를 이룬 학생 ${n}명`, v: () => S.cs ? S.cs.won : 0 },
    { id: 'trip2', name: '수학여행', goals: [1, 3, 5, 7, 9], title: '여행 기록가', ic: 'ic_trip2', t: n => `수학여행 기념품 ${n}종`, v: () => S.tr2 ? S.tr2.souv.length : 0 }   // 졸업 정산에서 진로를 이룬 학생 수
  ];
  // 단과대학 장식 8개 모으기(대학교가 열렸을 때만 보여요). 숫자와 칭호는 제안값
  ACH.push({ id: 'college', name: '단과대학', goals: [1, 2, 4, 6, 8], title: '숲속 종합대학', ic: 'ic_col_edu', t: n => n >= 8 ? '단과대학 8곳 모두 전공해 보기' : `단과대학 ${n}곳 전공해 보기`, v: () => S.dp && S.dp.own ? Object.keys(S.dp.own).filter(k => deptOf(k)).length : 0 });
  // 대학 축제 부스 기념품 8종 모으기(대학교가 열렸을 때만 보여요). 숫자는 단과대학 업적과 같게(제안값)
  ACH.push({ id: 'bfown', name: '대축제', goals: [1, 3, 6, 9, 12], title: '사계절 축제왕', ic: 'ic_bf', t: n => n >= 12 ? '대축제 달 장식 12종 모두 모으기' : `대축제 달 장식 ${n}종 모으기`, v: () => S.bf && S.bf.own ? Object.keys(S.bf.own).filter(k => S.bf.own[k]).length : 0 });
  ACH.push({ id: 'fvown', name: '대학 축제', goals: [1, 2, 4, 6, 8], title: '축제의 달인', ic: 'ic_fv', t: n => n >= 8 ? '부스 기념품 8종 모두 모으기' : `부스 기념품 ${n}종 모으기`, v: () => S.fv && S.fv.own ? Object.keys(S.fv.own).filter(k => S.fv.own[k]).length : 0 });
  const ACH_EM = { counsel: '🐘', selfstudy: '🌙', rare: '✨', students: '🐰', grad: '🎓', building: '🏫', teacher: '🦔', quest: '📝', puzzle: '🧩', dex: '📖', fest: '🎈', attend: '📅', trip: '🚌', gold: '🌰', rank: '🏆', deco: '🪴', lab: '🧪', battle: '⚔️', league: '🏅' , donate: '🌳', snack: '🍪' };
  const achById = id => ACH.find(a => a.id === id);
  const achGoal = (a, i) => a.id === 'dex' && i === ACH_N - 1 ? DEX_KEYS.length : a.goals[i];
  const achHit = id => (S && S.ach && S.ach.hit[id]) || 0;
  const achGot = id => (S && S.ach && S.ach.got[id]) || 0;
  const achClaimable = () => !!S && !!S.ach && ACH.some(a => achGot(a.id) < achHit(a.id));
  // 업적 말고 받는 칭호(마을 기부 3단계, 8단계)
  const xtGot = t => !!S && (t.got ? !!t.got(S) : (!!S.vd && S.vd.lv >= t.lv));   // got(저장)으로 재는 칭호도(숲속 패스, 반짝 친구, 랭킹 시즌)
  const achTitles = () => [...ACH.filter(a => achGot(a.id) >= ACH_N), ...VD.titles.filter(xtGot), ...ST_TITLES.filter(t => stTitleGot(t)), ...PP_TITLES.filter(t => !!S && t.got(S))];   // 논문과 학회 칭호. 곁가지 이야기 칭호
  const achTitleName = id => { const a = achById(id) || VD.titles.find(t => t.id === id) || ST_TITLES.find(t => t.id === id) || PP_TITLES.find(t => t.id === id); return a ? a.title : ''; };
  const achVal = a => { try { return Number(a.v()) || 0; } catch (e) { return 0; } };
  // 1초마다 이룬 등급을 기록해요. 새로 이루면 알려 줘요(보상은 업적 화면에서 받아요)
  function achSync(quiet) {
    if (!S || !S.ach) return;
    for (const a of ACH) {
      const v = achVal(a);
      let h = achHit(a.id);
      while (h < ACH_N && v >= achGoal(a, h)) h += 1;
      if (h > achHit(a.id)) {
        S.ach.hit[a.id] = h;
        if (!quiet) (rt.achNote = rt.achNote || []).push(`업적 달성! ${a.t(achGoal(a, h - 1))}. 도감의 업적에서 받아요`);
      }
    }
  }
  function claimAch(id) {
    const a = achById(id); if (!a) return false;
    const from = achGot(id), to = achHit(id);
    if (to <= from) return false;
    let g = 0; for (let i = from; i < to; i++) g += ACH_GOLD[i];
    S.ach.got[id] = to;
    addGold(g);
    const newTitle = to >= ACH_N && from < ACH_N;
    if (newTitle && !S.ach.title) { S.ach.title = id; rankDirty(); }
    const art = IMG('ach_popup') ? `<img src="${IMG('ach_popup')}" alt="">` : '';
    showReward({ title: '업적 달성!', sub: a.t(achGoal(a, to - 1)), art, big: `${a.name} ${to}단계 ${ACH_TIER[to - 1]} 메달`,
      items: [{ ic: 'gold', t: `황금 도토리 +${g}` }, newTitle ? { ic: '🎖️', t: `칭호 "${a.title}"${S.ach.title === id ? '를 달았어요' : '를 받았어요'}` } : null] });
    save(); renderAch(true);
    return true;
  }
  // 받을 업적이 여럿이면 맨 위 '모두 받기'로 한 번에 받아요(하나만 있어도 보여요, 없어진 줄 알았대요)
  function claimAchAll() {
    const ids = ACH.filter(a => achHit(a.id) > achGot(a.id)).map(a => a.id); if (!ids.length) return 0;
    let g = 0, n = 0; const titles = [];
    for (const id of ids) {
      const a = achById(id), from = achGot(id), to = achHit(id);
      for (let i = from; i < to; i++) { g += ACH_GOLD[i]; n += 1; }
      S.ach.got[id] = to;
      if (to >= ACH_N && from < ACH_N) { titles.push(a.title); if (!S.ach.title) { S.ach.title = id; rankDirty(); } }
    }
    addGold(g);
    const art = IMG('ach_popup') ? `<img src="${IMG('ach_popup')}" alt="">` : '';
    showReward({ title: '업적 모두 받기!', sub: `업적 ${ids.length}개에서 메달 ${n}개를 받았어요`, art, big: `메달 ${n}개`,
      items: [{ ic: 'gold', t: `황금 도토리 +${g}` }, titles.length ? { ic: '🎖️', t: `새 칭호 ${titles.map(t => `"${t}"`).join(', ')}` } : null] });
    save(); renderAch(true); renderHudTitle();
    return ids.length;
  }
  function setTitle(id) {
    if (id && achGot(id) < ACH_N && !VD.titles.some(t => t.id === id && xtGot(t)) && !ST_TITLES.some(t => t.id === id && stTitleGot(t)) && !PP_TITLES.some(t => t.id === id && t.got(S))) return false;   // 곁가지 이야기 칭호도 달 수 있게
    S.ach.title = S.ach.title === id ? '' : id;
    toast(S.ach.title ? `칭호 "${achTitleName(S.ach.title)}"를 달았어요` : '칭호를 뗐어요');
    rankDirty(); save(); renderAch(true); renderHudTitle();
    return true;
  }
  function achMedal(a) {
    // 그림이 없을 때만 금 테두리에 색을 입혀요
    const g = achGot(a.id);
    const fk = g >= 5 ? 'ach_frame_rainbow' : g === 4 ? 'ach_frame_platinum' : g === 3 ? 'ach_frame_gold' : g === 2 ? 'ach_frame_silver' : g === 1 ? 'ach_frame_bronze' : 'ach_frame_locked';
    const frame = IMG(fk) || (g >= 4 ? IMG('ach_frame_gold') : ''), tint = !IMG(fk) && g >= 4 ? (g >= 5 ? ' tint-rainbow' : ' tint-plat') : '', ic = IMG('ach_ic_' + a.id) || (a.ic ? IMG(a.ic) : '');
    if (!frame || !ic) return `<span class="am-em">${ACH_EM[a.id]}</span>`;
    const sm = IMG('ach_ic_' + a.id) ? '' : ' am-sm';   // 업적 전용 그림이 아닌 그림(기부함, 별 등)은 테두리 안쪽에 작게
    return `<img class="am-fr${tint}" src="${frame}" alt=""><img class="am-ic${sm}${g ? '' : ' dim'}" src="${ic}" alt="">`;
  }
  function renderAch(force) {
    const box = $('#achList'); if (!box || !S || !S.ach) return;
    const vals = ACH.map(achVal);
    const key = ACH.map((a, i) => `${achHit(a.id)}${achGot(a.id)}:${Math.floor(vals[i])}`).join('|') + '|' + S.ach.title;
    if (!force && box.dataset.key === key) return; box.dataset.key = key;
    const ts = achTitles();
    $('#achTitle').innerHTML = `<span class="at-lab">내 칭호</span><span class="at-chips">${ts.length ? ts.map(a => `<button class="title-chip${S.ach.title === a.id ? ' on' : ' off'}" type="button" data-title="${a.id}" aria-pressed="${S.ach.title === a.id}">${esc(a.title)}</button>`).join('') : '<span class="at-none">업적을 5단계까지 이루면 칭호를 받아요</span>'}</span>`;
    { const nAll = ACH.filter(a => achHit(a.id) > achGot(a.id)).length, all = $('#achAll'); if (all) { all.hidden = nAll < 1; all.textContent = `모두 받기 (${nAll}개)`; } }
    box.innerHTML = ACH.map((a, i) => {
      const h = achHit(a.id), g = achGot(a.id), next = Math.min(ACH_N - 1, h), goal = achGoal(a, next), v = vals[i];
      const can = h > g;
      const pct = can || h >= ACH_N ? 100 : Math.max(0, Math.min(100, v / goal * 100));
      // 받을 것이 있으면 이룬 업적(가장 높은 등급)을 보여 주고, 아니면 다음 목표를 보여 줘요
      const head = can ? a.t(achGoal(a, h - 1)) : h >= ACH_N ? a.name : a.t(goal);
      const sub = can ? `${ACH_TIER[h - 1]} 메달을 이뤘어요! 황금 도토리 +${ACH_GOLD.slice(g, h).reduce((x, y) => x + y, 0)}` : h >= ACH_N ? `모두 이뤘어요. 칭호 "${a.title}"` : `${fmt(Math.min(v, goal))} / ${fmt(goal)}`;
      return `<div class="ach-row${can ? ' can' : ''}"><span class="ach-medal">${achMedal(a)}</span>` +
        `<span class="ach-tx"><b>${esc(head)}</b><small>${esc(sub)}</small><span class="ach-bar"><i style="width:${pct.toFixed(0)}%"></i></span>` +
        `<span class="ach-tiers" aria-label="받은 메달 ${g}개">${ACH_TIER.map((_, j) => `<i class="${j < g ? 't' + (j + 1) : ''}"></i>`).join('')}</span></span>` +
        (can ? `<button class="ach-btn" type="button" data-ach="${a.id}">받기</button>` : `<span class="ach-done">${g >= ACH_N ? '완료' : `다음: ${ACH_TIER[next]} 메달 (황금 도토리 +${ACH_GOLD[next]})`}</span>`) + '</div>';
    }).join('');
  }
  function setDexSeg(v) {
    rt.dexSeg = v === 'ach' ? 'ach' : v === 'sn' ? 'sn' : v === 'bx' ? 'bx' : v === 'deco' ? 'deco' : 'dex';   // 간식 도감, 생물 도감, 5.3.3 한정 장식 도감
    $$('#dexSeg [data-dseg]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.dseg === rt.dexSeg)));
    $('#dexPane').hidden = rt.dexSeg !== 'dex'; $('#achPane').hidden = rt.dexSeg !== 'ach'; $('#snPane').hidden = rt.dexSeg !== 'sn'; $('#bxPane').hidden = rt.dexSeg !== 'bx'; $('#decoDexPane').hidden = rt.dexSeg !== 'deco';
    if (rt.dexSeg === 'ach') renderAch(true); else if (rt.dexSeg === 'sn') snDexRender(); else if (rt.dexSeg === 'bx') bxDexRender(); else if (rt.dexSeg === 'deco') decoDexRender(); else renderDex();
  }
  // tick170에서 1초마다 불러요
  // 메인 화면 위쪽 학교 카드에 단 칭호를 보여 줘요. 누르면 업적 화면이 열려요
  function renderHudTitle() {
    const el = $('#hudTitle'); if (!el || !S || !S.ach) return;
    const t = achTitleName(S.ach.title);
    el.hidden = !t; if (t && el.textContent !== t) el.textContent = t;
  }
  function tick171ach() {
    achSync(false); renderHudTitle();
    // 업적 알림은 다른 알림(보상, 안내)을 덮지 않게, 알림 칸이 비어 있고 창이 열려 있지 않을 때 하나씩 띄워요
    if (rt.achNote && rt.achNote.length && $('#toast').hidden && !rt.modalOpen && !earlyDay()) toast(rt.achNote.shift());   // 처음 세 퀘스트 동안은 미뤄요
    const ad = $('#achDot'); if (ad) ad.hidden = !achClaimable();
    if (rt.tab === 'dex' && rt.dexSeg === 'ach') renderAch();
  }
  // 저장 읽기: 이룬 등급과 받은 등급은 0~3, 칭호는 받은 금 업적만
  function sanitize171(d, s) {
    const a = d.ach && typeof d.ach === 'object' ? d.ach : {};
    for (const x of ACH) {
      const h = Math.min(ACH_N, Math.max(0, Math.floor(Number(a.hit && a.hit[x.id]) || 0)));
      const g = Math.min(h, Math.max(0, Math.floor(Number(a.got && a.got[x.id]) || 0)));
      if (h) s.ach.hit[x.id] = h;
      if (g) s.ach.got[x.id] = g;
    }
    const vl = d.vd && typeof d.vd.lv === 'number' && isFinite(d.vd.lv) ? d.vd.lv : 0;   // 마을 기부 칭호
    s.ach.title = typeof a.title === 'string' && ((s.ach.got[a.title] || 0) >= ACH_N || VD.titles.some(t => t.id === a.title && (t.got ? !!t.got(d) : vl >= t.lv)) || ST_TITLES.some(t => t.id === a.title && stTitleGot(t, d && d.sto))) ? a.title : '';
  }
  ['light', 'dark'].forEach(t => { const u = IMG('title_ribbon_' + t); if (u) document.documentElement.style.setProperty('--ribbon-' + t, `url("${u}")`); });
  $('#hudTitle').addEventListener('click', () => { sfx('tap'); setTab('dex'); setDexSeg('ach'); });
  $('#panelDex').addEventListener('click', e => {
    const sg = e.target.closest('[data-dseg]'); if (sg) { sfx('tap'); setDexSeg(sg.dataset.dseg); return; }
    if (e.target.closest('#achAll')) { claimAchAll(); return; }
    const b = e.target.closest('[data-ach]'); if (b) { claimAch(b.dataset.ach); return; }
    const t = e.target.closest('[data-title]'); if (t) { sfx('tap'); setTitle(t.dataset.title); }
  });
  /* ===== 업적과 칭호 END ===== */
