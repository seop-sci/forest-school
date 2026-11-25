  /* ---------- 종업식, 졸업식, 명예 교장실 ---------- */
  function renderGradPanel(force) {
    if (rt.tab !== 'grad' && !force) return;
    const d = cereDip(), can = canGraduate(), T = tierInfo(), N = TIERS[S.tier + 1], sf = semFirst(), cer = sf ? '1학기 방학식' : '종업식';
    $('#gYear').textContent = semOn() && !gradOn() ? `${yearLabel()} ${semLabel()}` : yearLabel();   // 대학원은 학기가 이미 들어 있어요
    // 마지막 해에는 종업식 카드를 숨기고 바로 아래 졸업식 카드로 안내해요
    const last = finalYear() && !sf;
    $('#gCard').hidden = last;
    $('#gLead').textContent = last
      ? `${T.name}${T.unit === '년째' ? `은 ${T.years}년째가 마지막 해예요` : `는 ${T.years}학년이 마지막 학년이에요`}. 대도시 학교가 되면 졸업식을 열고 ${N.school}에 입학해요.`
      : gradOn() ? `대도시 학교가 되면 종업식을 열 수 있어요. 다음 학기에는 시설을 Lv.${capNext()}까지 키울 수 있어요.`   // 대학원은 학년이 아니라 학기로 말해요
      : sf ? `대도시 학교가 되면 1학기 방학식을 열 수 있어요. 2학기에는 시설을 Lv.${capNext()}까지 키울 수 있어요.`
      : `대도시 학교가 되면 ${semOn() ? '2학기 ' : ''}종업식을 열 수 있어요. ${T.unit === '년째' ? '다음 해에는' : '다음 학년에는'} 시설을 Lv.${capNext()}까지 키울 수 있어요.`;
    $('#gHave').textContent = fmt(S.p.dip);
    $('#gPreview').textContent = `${fmt(d)}장`;
    $('#gPreviewSub').textContent = `지금 ${cer}${eul(cer).slice(-1)} 열면 받는 수료증`;
    $('#gYes').textContent = `${cer} 열기`;
    const fd = previewDip(), lo = dipAt(fd), hi = dipAt(fd + 1);   // 막대는 종업식 수료증 기준이에요
    const p = Math.max(0, Math.min(1, (S.yearEarned - lo) / (hi - lo)));
    $('#gBar').style.width = (p * 100).toFixed(1) + '%';
    $('#gBarWrap').setAttribute('aria-valuenow', Math.round(p * 100));
    const rl = !can && S.grade >= GRAD_MIN && repLocked(), locked = !rl && !can && S.grade >= GRAD_MIN && (sf ? semLocked() : yearLocked()), left = sf ? semLeft() : yearLeft();   // 1학기는 앞 절반 퀘스트
    $('#gNote').textContent = rl ? `건물 레벨을 모두 합쳐 ${repLeft()}만큼 더 올리면 ${eul(cer)} 열 수 있어요.` : locked ? `${yearLabel()} ${sf ? '1학기 ' : ''}메인 퀘스트를 마쳐야 ${eul(cer)} 열 수 있어요. 남은 퀘스트 ${left}개는 지도 오른쪽 퀘스트 단추에서 볼 수 있어요.` : can
      ? `${S.hd.album ? '단체 사진 덕분에 수료증 +50%예요. ' : ''}${sf ? '1학기 방학식은 수료증이 절반이에요. ' : ''}다음 수료증까지 도토리 ${fmt(Math.ceil(hi - S.yearEarned))}개 더 벌면 돼요.`
      : `평판 ★을 모아 ${CFG.grades[GRAD_MIN].title}가 되면 ${eul(cer)} 열 수 있어요. 지금은 ${CFG.grades[S.grade].title}예요. 건물과 선생님 레벨을 올리면 평판이 올라요.`;
    const btn = $('#gBtn');
    btn.textContent = can ? `${cer} 열기 (수료증 ${fmt(d)}장)` : rl ? `건물 레벨 ${repLeft()} 더 올리기` : locked ? `퀘스트 ${left}개를 먼저 마쳐요` : '아직 열 수 없어요';
    btn.setAttribute('aria-disabled', can ? 'false' : 'true');
    if (!can) $('#gConfirm').hidden = true;
    renderTierCard();
    // 명예 교장실, 장학재단, 전학생 목록은 바뀐 게 있을 때만 다시 그려요
    const key = [S.p.dip, ...Object.keys(PERKS).map(k => S.p.perk[k]), S.p.species, S.st.grads, S.tier, S.fund, ...Object.keys(FPERKS).map(k => S.fp[k])].join('|');
    if (force || key !== rt.gKey) {
      rt.gKey = key;
      const pr = perkRec(), fr = fpRec();
      $('#perkList').innerHTML = Object.keys(PERKS).map(k => {
        const P = PERKS[k], L = S.p.perk[k], maxed = perkMaxed(k), c = perkCost(k), rec = pr && pr.k === k;
        return `<div class="perk${rec ? ' rec' : ''}"><span class="p-ic">${P.icon}</span>` +
          `<div><b>${P.name} <span class="p-lv">Lv.${L}</span></b><small>${P.desc}</small>${rec ? `<span class="p-why">${pr.why}</span>` : ''}` +
          `<span class="p-eff">${maxed ? P.eff(L) + ' (최고)' : `${P.eff(L)} → ${P.eff(L + 1)}`}</span></div>` +
          `<span class="p-act">${rec ? '<span class="p-rec">추천</span>' : ''}` +   // 추천 표시를 버튼 위로
          (maxed ? '<button class="btn-perk" type="button" aria-disabled="true">최고</button>'
            : `<button class="btn-perk" type="button" data-perk="${k}" aria-disabled="${S.p.dip >= c ? 'false' : 'true'}" aria-label="${P.name} 고치기, 수료증 ${c}장${rec ? ', 추천' : ''}">${dipIcon()}${c}</button>`) +
          '</span></div>';
      }).join('');
      $('#perkHave').innerHTML = dipShown()
        ? `${dipIcon()}<span>가진 수료증 <b>${fmt(S.p.dip)}</b>장</span>`
        : `${dipIcon()}<span>종업식을 열면 수료증을 받아요</span>`;
      $('#fundHave').innerHTML = S.fund > 0 || S.tier > 0
        ? `${fundIcon()}<span>가진 기금 <b>${fmt(S.fund)}</b></span>`
        : `${fundIcon()}<span>졸업하면 기금을 받아요</span>`;
      $('#fundList').innerHTML = Object.keys(FPERKS).map(k => {
        const P = FPERKS[k], L = S.fp[k], c = fpCost(k), rec = fr.k === k && (S.fund > 0 || S.tier > 0);
        return `<div class="perk${rec ? ' rec' : ''}"><span class="p-ic">${P.icon}</span>` +
          `<div><b>${P.name} <span class="p-lv">Lv.${L}</span></b><small>${P.desc}</small>${rec ? `<span class="p-why">${fr.why}</span>` : ''}` +
          `<span class="p-eff">${P.eff(L)} → ${P.eff(L + 1)}</span></div>` +
          `<span class="p-act">${rec ? '<span class="p-rec">추천</span>' : ''}` +
          `<button class="btn-perk" type="button" data-fperk="${k}" aria-disabled="${S.fund >= c ? 'false' : 'true'}" aria-label="${P.name} 고치기, 기금 ${c}${rec ? ', 추천' : ''}"><span class="fic">${fundIcon()}</span>${c}</button></span></div>`;
      }).join('');
      const all = growOn(), tk = S.p.ticket || 0;
      $('#friendNote').hidden = !all;
      $('#friendNote').innerHTML = all ? `<span class="tk-ic">${TICKET_SVG}</span><span>친구 성장 쪽지 <b>${tk}</b>장. 종업식과 졸업식마다 1장씩 받아요. 키울 친구를 골라 주세요 (레벨마다 수업료 +2%)</span>` : '';
      $('#friendList').innerHTML = NEWCOMERS.map((n, i) => {
        const has = i < S.p.species, L = (S.p.nl || [])[i] || 0;
        return `<div class="friend${has ? '' : ' locked'}${L >= 5 ? ' gold' : ''}"><span class="f-av">${kidAvatar(n.k)}</span>` +
          `<span>${has ? n.name : `${i + 1}번째 전학생`}${has && all ? ` <b class="f-lv">Lv.${L}</b>` : ''}</span>` +
          (has && all ? `<button class="btn-perk f-up" type="button" data-grow="${i}" aria-disabled="${tk > 0 ? 'false' : 'true'}" aria-label="${n.name} 키우기, 쪽지 1장"><span class="fic">${TICKET_SVG}</span>1</button>` : '') + '</div>';
      }).join('');
    }
  }
  // 졸업 전에 조금 더 벌면 기금이 하나 느는지 알려 줘요
  function nextFundNote() {
    const tot = S.tdip + yearDip(), goal = (Math.floor(tot / FUND_PER) + 1) * FUND_PER;
    const more = Math.ceil(dipAt(goal - S.tdip) - S.yearEarned);
    return more > 0 ? `도토리를 ${fmt(more)}개 더 벌고 가면 기금이 1 늘어요.` : '';
  }
  // 졸업식 카드: 다음 학교급, 조건 두 가지, 받게 될 기금
  function renderTierCard() {
    const T = tierInfo(), N = TIERS[S.tier + 1] || { name: TIER_ALL[S.tier + 1] || '다음 학교', school: '숲속 ' + (TIER_ALL[S.tier + 1] || '다음 학교') }   /* 대학교에서는 다음이 대학원이에요(예전에는 '대학교 준비 중'으로 나왔어요) */, open = nextTierOpen(), can = canPromote(), f = previewFund();
    $('#tierFrom').textContent = T.school;
    const last = gradOn() && !open;   // 가장 높은 학교급(대학원)이고 다음 학교급이 아직 없어요
    $('#tierTo').textContent = last ? '다음 학교급 (준비 중)' : N ? N.school : '';
    const reqs = [
      gradOn() ? { ok: S.tg >= T.grads && S.sem >= 1, txt: `박사 8학기 되기 (지금 ${gradSemTxt(yearNo(), S.sem)})` }
        : { ok: S.tg >= T.grads, txt: `${T.name} ${T.years}${T.unit} 되기 (지금 ${yearNo()}${T.unit})` },
      { ok: S.grade >= GRAD_MIN, txt: `대도시 학교 되기 (지금 ${CFG.grades[S.grade].name})` }
    ];
    if (semOn() && open) reqs.splice(1, 0, { ok: finalYear() && !semFirst(), txt: `${T.years}${T.unit} 1학기 방학식 열기` });   // 졸업식은 2학기에
    if (promoteGateIdx() >= 0 && open) reqs.push({ ok: !promoteLocked(), txt: promoteLocked() ? `${T.years}${T.unit} 메인 퀘스트 마치기 (남은 퀘스트 ${promoteLeft()}개)` : `${T.years}${T.unit} 메인 퀘스트 마치기` });
    const html = reqs.map(r => `<li class="${r.ok ? 'ok' : ''}"><span class="mk2">${r.ok ? CHECK : ''}</span>${r.txt}</li>`).join('');
    if ($('#tierReqs').innerHTML !== html) $('#tierReqs').innerHTML = html;
    $('#tierFund').textContent = fmt(f);
    setHid($('#tierCard .tier-fund'), last);   // 대학원에서는 기금이 생기지 않아요
    $('#tierNote').textContent = last
      ? `숲속 대학원이 지금 가장 높은 학교급이에요. 박사 학위를 받은 뒤에도 논문과 숲속 학회, 연구 트리로 학교를 계속 키워요. 다음 학교급은 숲속 교육부가 준비 중이에요.`
      : !open
      ? `${eun(N.name)} 숲속 교육부가 열심히 준비 중이에요. 그동안 종업식을 열어 수료증을 모아 두면 졸업할 때 기금이 늘어요.`
      : can ? `지금 졸업하면 기금 ${fmt(f)}${numEul(f)} 받아요. ${nextFundNote()}`
      : `이 학교급에서 모은 수료증 ${FUND_PER}장마다 기금이 1씩 늘어요. 지금까지 ${fmt(S.tdip)}장을 모았어요.`;
    const btn = $('#tierBtn');
    btn.textContent = open ? `졸업식 열기 (${N.name} 입학)` : last ? '다음 학교급 준비 중' : `${N.name} 준비 중`;
    // 명예 교장실 머리말: 대학교에서는 학위수여식 뒤 대학원으로 이어 가고, 대학원은 다음 학교급이 없어요
    { const sm = $('#perkHead small'), h = S.tier === 4 ? '한 번 고치면 종업식을 열어도 효과가 남아요.<br>졸업식을 열어도 대학원으로 이어 가요.' : gradOn() ? '한 번 고치면 종업식을 열어도 효과가 남아요.' : '한 번 고치면 종업식을 열어도 효과가 남아요.<br>단, 졸업하면 처음부터예요.';
      if (sm && sm.dataset.h !== h) { sm.dataset.h = h; sm.innerHTML = h; } }
    { const sm = $('#tierHead small'), t = last ? '대학원이 지금 가장 높은 학교급이에요' : '마지막 해에 졸업하면 다음 학교에 입학해요'; if (sm && sm.dataset.h !== t) { sm.dataset.h = t; sm.textContent = t; } }   // 대학교 낱말 바꾸기가 글을 바꿔도 다시 쓰지 않게 열쇠로 견줘요
    btn.setAttribute('aria-disabled', can ? 'false' : 'true');
    if (!can) $('#tierConfirm').hidden = true;
  }
  function buyPerk(k, btn) {
    if (rt.paused || perkMaxed(k)) return;
    const c = perkCost(k);
    if (S.p.dip < c) { shake(btn); toast(`수료증이 ${fmt(c - S.p.dip)}장 모자라요. 종업식을 열면 받아요`); return; }
    S.p.dip -= c;
    S.p.perk[k] += 1;
    S.st.perks += 1;
    toast(`${PERKS[k].name} Lv.${S.p.perk[k]}! ${PERKS[k].eff(S.p.perk[k])}`);
    sfx('buy'); buzz(10);
    checkGrade();   // 소문난 졸업생은 평판을 바로 올려요
    renderGradPanel(true); renderHUD(); renderMap(); renderAffordance();
    save();
  }
  function buyFundPerk(k, btn) {
    if (rt.paused) return;
    const c = fpCost(k);
    if (S.fund < c) { shake(btn); toast(`장학재단 기금이 ${fmt(c - S.fund)} 모자라요. 졸업식을 열면 받아요`); return; }
    S.fund -= c;
    S.fp[k] += 1;
    S.st.fperks += 1;
    toast(`${FPERKS[k].name} Lv.${S.fp[k]}! ${FPERKS[k].eff(S.fp[k])}`);
    sfx('buy'); buzz(10);
    checkGrade();   // 재단 이사회는 평판을 바로 올려요
    renderGradPanel(true); renderHUD(); renderMap(); renderAffordance();
    save();
  }
  function askGraduate() {
    if (!canGraduate()) { shake($('#gBtn')); return; }
    const d = cereDip();
    const T = tierInfo(), n = S.tg + 2;
    const begins = n > T.years ? '새 학기가' : `${T.name} ${yearSubj(n, T)}`;
    let txt = semFirst()
      ? `1학기 방학식을 열면 ${yearLabel()} 2학기가 시작돼요. 수료증 ${fmt(d)}장(종업식의 절반)을 받고, 학교(시설, 선생님, 도토리)는 그대로 남아요. 시설은 Lv.${capNext()}까지 더 키울 수 있고 동네는 다시 키워요. 학년과 전학생은 2학기 ${finalYear() ? '졸업식' : '종업식'}에서 올라가요.`
      : `종업식을 열면 ${begins} 시작돼요. 수료증 ${fmt(d)}장을 받고, 학교(시설, 선생님, 도토리)는 그대로 남아요. 시설은 Lv.${capNext()}까지 더 키울 수 있고, 동네는 다시 키워요.`;
    if (mainReady()) txt += ' 받지 않은 메인 퀘스트 보상이 있으니 먼저 받아 주세요.';
    $('#gConfirmText').textContent = txt;   // 1학기 방학식 문구는 위에서 골라요
    $('#gConfirm').hidden = false;
    $('#gNo').focus({ preventScroll: true });
  }
  // 새 학기: 학교는 처음으로 돌아가고 종업식과 졸업식으로 얻은 것만 남아요
  function newYear(full) {
    if (!full) {
      // 종업식: 학교는 그대로, 동네만 다시 키워요. 새 학기 준비물이 있으면 수업료 몇 분치를 선물로 받아요
      const gift = S.p.perk.start > 0 ? nice(rate() * 60 * 30 * S.p.perk.start) : 0;
      if (gift) { S.budget += gift; rt.yearGift = gift; } else rt.yearGift = 0;
      S.gr0 = S.tier >= 1 ? rep() : -1;   // 새 학기의 동네 등급은 지금 평판 위로 올린 만큼으로
      S.grade = 0; S.pending = 0; S.pendingSec = 0; S.yearEarned = 0;
      fillSubs();
      const mq = curMain();
      if (mq && !COUNT_TYPES.has(mq.t)) startMain();
      clearDrops(); rt.dropT = 0; rt.guideKey = null;
      rt.deal = null;
      prepTopUp();
      return;
    }
    S.gr0 = -1;   // 새 학교급 첫 학기는 옛 기준
    S.budget = startBudget(S.p.perk.start) * costScale();
    S.students = 4;
    S.pwBank = (S.pwBank || 0) + pwLive(S);   // 졸업해서 시설이 처음으로 돌아가도 학교 파워는 줄지 않게 넣어 둬요
    S.f = { classroom: 1, cafeteria: 0, library: 0, playground: 0, science: 0, store: 0, dorm: 0, union: 0, institute: 0, gradhall: 0 };
    S.fu = freshFu();
    S.t = { squirrel: 1, owl: 0, bear: 0 };
    S.grade = 0; S.pending = 0; S.pendingSec = 0; S.yearEarned = 0;
    S.q.subs = S.q.subs.filter(s => COUNT_TYPES.has(s.t));
    fillSubs();
    const mq = curMain();
    if (mq && !COUNT_TYPES.has(mq.t)) startMain();
    rt.kids.forEach(k => k.g.remove()); rt.kids = [];
    clearDrops(); rt.dropT = 0; rt.guideKey = null;
    rt.deal = null;   // 학교가 새로 시작하면 까치도 새 소식을 찾아와요
    prepTopUp();
  }
  // 1학기 방학식: 수료증과 리그 점수는 절반(황금 도토리는 1개라 그대로), 학년과 전학생, 시설 최고 레벨은 그대로예요
  function semBreak() {
    const dip = cereDip(), leaving = Math.floor(S.students);
    addDip(dip);
    S.hd.album = false;
    rt.yearRec = facKeys().filter(k => S.f[k] > 0).map(k => `${FAC[k].name} Lv.${S.f[k]}`).join(', ') + `, 학생 ${Math.floor(S.students)}명`;
    S.st.grads += 1; S.st.sems = (S.st.sems || 0) + 1; repMark(); ppSemDone();   // 대학원 세미나 횟수와 연구 자료
    S.sem = 1; S.semDip = (S.semDip || 0) + dip;   // 종업식 수료증에서 뺄 몫
    addLeague(Math.round(LP.grad / 2), true);
    cloudSoon();
    addGold(GOLD.grad);
    const ye = S.yearEarned;
    newYear(false);
    S.yearEarned = ye;   // 한 해 수입은 2학기 종업식까지 이어서 세요
    $('#gConfirm').hidden = true;
    checkGrade();
    syncKids(false);
    renderMap(); renderHUD(); renderAffordance(); renderGradPanel(true);
    save();
    queueModal(() => showCeremony(dip, leaving, null, true));
  }
  // 종업식(graduate)과 졸업식(promote)이 함께 쓰는 세 토막(예전에는 두 곳에 같은 글이 있었어요)
  // 전학 올 친구가 남았으면 한 명을 데려오고, 다 만났으면 친구 성장 쪽지를 한 장 줘요(쪽지 알림은 식이 끝난 뒤 cereAfter에서)
  function cereNewcomer() {
    let newcomer = null;
    if (S.p.species < ncMax()) { newcomer = NEWCOMERS[S.p.species]; S.p.species += 1; }
    else { S.p.ticket = (S.p.ticket || 0) + 1; rt.tkReward = { title: '친구 성장 쪽지를 받았어요!', sub: '위쪽 졸업 단추의 전학 온 친구들에서 키울 친구를 골라요', items: [{ ic: 'ticket', t: `친구 성장 쪽지 +1 (지금 ${S.p.ticket}장)` }] }; }   // 여섯 친구가 다 온 뒤에는 친구 성장 쪽지
    return newcomer;
  }
  // 새 학년이 된 뒤 평판, 학생, 지도, 위쪽 숫자, 졸업 탭을 다시 그리고 저장해요
  function cereRefresh() {
    checkGrade();
    syncKids(false);
    renderMap(); renderHUD(); renderAffordance(); renderGradPanel(true);
    save();
  }
  // 식 창 다음에 줄 세울 것: 반짝 친구, 친구 성장 쪽지
  function cereAfter() {
    rareAfterCere();
    if (rt.tkReward) { showReward(rt.tkReward); rt.tkReward = null; }
  }
  function graduate() {
    if (!canGraduate() || rt.paused) return;
    if (semFirst()) { semBreak(); return; }
    const csB = csSettle();   // 진로 상담: 고등학교 3학년 졸업식에서 진로를 이룬 학생마다 수료증 +4%
    const dip = csB ? Math.floor(yearDip() * (1 + csB)) : yearDip(), leaving = Math.floor(S.students);
    const albPh = S.hd.album, albEl = (elPres() || {}).sp || '';   // 앨범: 사진사 까치, 반장
    addDip(dip);
    S.hd.album = false;
    rt.yearRec = facKeys().filter(k => S.f[k] > 0).map(k => `${FAC[k].name} Lv.${S.f[k]}`).join(', ') + `, 학생 ${Math.floor(S.students)}명`;
    S.st.grads += 1; S.tg += 1; S.sem = 0; S.semDip = 0; repMark(); ppSemDone();
    if (S.dp) S.dp.free = 1;   // 종업식 뒤 단과대학 바꾸기 한 번은 공짜
    albAdd('y', { y: S.tg, st: leaving, dip, ph: albPh, el: albEl });   // 졸업 앨범 한 쪽
    addLeague(LP.grad, true);
    cloudSoon();
    addGold(GOLD.grad);
    const newcomer = cereNewcomer();
    newYear(false);
    if (newcomer) { rt.kidSeq = BASE_SPECIES.length + S.p.species - 1; rosterAdd(newcomer.k); }   // 새 친구가 맨 먼저 교문으로 들어와요. 명부에도
    $('#gConfirm').hidden = true;
    cereRefresh();
    queueModal(() => showCeremony(dip, leaving, newcomer));
    if (S.tier === 4 && S.tg === 1) queueModal(() => { toast(`새내기 장학금이 끝났어요.\n2학년부터는 수업료가 평소대로예요`); return false; });
    if (newcomer) queueModal(() => showNewTalk(newcomer));   // 전학 대화(식 창 다음에)
    cereAfter();
    if (rt.csRw) { rt.csRw.forEach(showReward); rt.csRw = null; }   // 진로 편지도 식이 끝난 뒤에
  }
  function showCeremony(dip, leaving, newcomer, half) {
    // 방금 마친 해와 새로 시작하는 해 (다음 학교급이 아직 닫혀 있으면 마지막 해를 다시 해요)
    const T = tierInfo(), N = TIERS[S.tier + 1], ended = Math.min(S.tg, T.years), n = S.tg + 1;
    rt.uniGrad = !half && uniNow() && ended >= T.years;   // 대학교 4학년을 마치는 식은 학위수여식 곡
    if (gradOn()) {   // 대학원: 학기를 마칠 때는 '세미나', 석사 4학기와 박사 8학기 끝은 학위수여식
      const y = half ? yearNo() : ended, done = gradSemTxt(y, half ? 0 : 1), deg = !half && ended === 2 ? '석사' : !half && ended >= T.years ? '박사' : '';
      const next = half ? gradSemTxt(y, 1) : n <= T.years ? gradSemTxt(n, 0) : '';
      rt.uniGrad = !!deg;
      $('#gradTitle').textContent = deg ? `${deg} 학위수여식` : `${done} 세미나`;
      $('#gradText').textContent = (deg ? `대학원생 ${leaving}명이 ${deg} 학위를 받았어요. ` : `대학원생 ${leaving}명이 ${done} 연구를 발표했어요. `) + (next ? `이제 ${next}가 시작돼요. 동네는 다시 키워야 해요.` : '박사 8학기 연구실에서 새 대학원생을 맞아요.');
      $('#gradOk').textContent = next ? `${next} 시작하기` : '새 학기 시작하기';
      $('#gradDip').textContent = '+' + fmt(dip);
      $('#gradArt').innerHTML = newcomer ? `<svg viewBox="-10 -15.5 20 27" aria-hidden="true">${kidSVG(newcomer.k, 0)}</svg>` : `<svg viewBox="-10 -10 20 20" aria-hidden="true">${DIP}</svg>`;
      $('#gradNew').textContent = (newcomer ? `새 대학원생 ${newcomer.name}${newcomer.ga} 왔어요! 앞으로 수업료 +5%. ` : '') + `황금 도토리 +${GOLD.grad}개도 받았어요. 이제 시설을 Lv.${half ? capNext() : facCap()}까지 키울 수 있어요.` + (rt.yearGift ? ` 새 학기 준비물로 도토리 +${fmt(rt.yearGift)}!` : '');
      $('#gradRec').hidden = true;
      openModal($('#mGrad')); sfx('bell'); setTimeout(() => sfx('quest'), 900);
      return true;
    }
    if (half) {   // 1학기 방학식
      $('#gradTitle').textContent = `${yearLabel()} 1학기 방학식`;
      $('#gradText').textContent = `학생 ${leaving}명이 1학기를 마쳤어요. 신나는 방학을 보내고 이제 2학기가 시작돼요. 동네는 다시 키워야 해요.`;
      $('#gradOk').textContent = '2학기 시작하기';
      $('#gradDip').textContent = '+' + fmt(dip);
      $('#gradArt').innerHTML = `<svg viewBox="-10 -10 20 20" aria-hidden="true">${DIP}</svg>`;
      $('#gradNew').textContent = `황금 도토리 +${GOLD.grad}개도 받았어요. 2학기 ${finalYear() ? '졸업식' : '종업식'}을 열면 학년이 올라가${finalYear() ? '요.' : `고, 2학기에는 시설을 Lv.${facCap()}까지 키울 수 있어요.`}` + (rt.yearGift ? ` 새 학기 준비물로 도토리 +${fmt(rt.yearGift)}!` : '');
      $('#gradRec').hidden = true;   // 창 글이 길어서 키운 기록 줄은 빼요
      openModal($('#mGrad'));
      sfx('bell'); setTimeout(() => sfx('quest'), 900);
      return true;
    }
    $('#gradTitle').textContent = `${T.name} ${ended}${T.unit} 종업식`;
    $('#gradText').textContent = `학생 ${leaving}명이 ${ended}${T.unit}${T.unit === '년째' ? '를' : '을'} 마쳤어요. ` + (n <= T.years
      ? `이제 ${T.name} ${yearSubj(n, T)} 시작돼요.`
      : `${N ? N.name + '가 열릴 때까지 ' : ''}${T.years}${T.unit} 교실에서 새 친구들을 맞아요.`);
    $('#gradOk').textContent = n <= T.years ? `${n}${T.unit} 시작하기` : '새 학기 시작하기';
    $('#gradDip').textContent = '+' + fmt(dip);
    $('#gradArt').innerHTML = newcomer
      ? `<svg viewBox="-10 -15.5 20 27" aria-hidden="true">${kidSVG(newcomer.k, 0)}</svg>`
      : `<svg viewBox="-10 -10 20 20" aria-hidden="true">${DIP}</svg>`;
    $('#gradNew').textContent = newcomer
      ? `새 친구 ${newcomer.name}${newcomer.ga} 전학 왔어요! 앞으로 수업료 +5%.`
      : '전학 올 친구를 모두 만났어요. 수료증으로 명예 교장실을 고쳐 보세요.';
    $('#gradNew').textContent += ` 황금 도토리 +${GOLD.grad}개도 받았어요. 이제 시설을 Lv.${facCap()}까지 키울 수 있어요.` + (rt.yearGift ? ` 새 학기 준비물로 도토리 +${fmt(rt.yearGift)}!` : '');
    $('#gradRec').hidden = true;   // 창 글이 길어서 키운 기록 줄은 빼요
    openModal($('#mGrad'));
    sfx('bell'); setTimeout(() => sfx('quest'), 900);
    return true;
  }
  /* 졸업식: 수료증과 명예 교장실은 처음부터, 기금과 장학재단, 전학 온 친구들은 남아요 */
  function askPromote() {
    if (!canPromote()) { shake($('#tierBtn')); return; }
    const f = previewFund();
    if (S.tier + 1 >= GRAD_TIER) {   // 대학원은 캠퍼스를 이어 가요
      $('#tierConfirmText').textContent = `학위수여식을 열면 ${TIERS[S.tier + 1].school} 석사 과정이 시작돼요. 캠퍼스와 건물, 도토리, 선생님, 수료증과 명예 교장실은 그대로 이어 가고, 장학재단 기금 ${fmt(f)}${numEul(f)} 받아요. 연구 구역이 열려요.` + (mainReady() ? ' 받지 않은 메인 퀘스트 보상이 있으니 먼저 받아 주세요.' : '');
      $('#tierConfirm').hidden = false; $('#tierNo').focus({ preventScroll: true }); return;
    }
    let txt = `졸업식을 열면 ${TIERS[S.tier + 1].school}에 입학해요. 도토리, 시설, 선생님, 동네에 더해 수료증과 명예 교장실도 처음부터예요. 장학재단 기금 ${fmt(f)}${numEul(f)} 받고, 전학 온 친구들과 장학재단, 퀘스트 기록은 그대로 남아요.`;
    if (mainReady()) txt += ' 받지 않은 메인 퀘스트 보상이 있으니 먼저 받아 주세요.';
    $('#tierConfirmText').textContent = txt;
    $('#tierConfirm').hidden = false;
    $('#tierNo').focus({ preventScroll: true });
  }
  function promote() {
    if (!canPromote() || rt.paused) return;
    const fund = previewFund(), leaving = Math.floor(S.students), from = tierInfo();
    const dipsIn = Math.floor(S.tdip + yearDip());   // 이번 학교급에서 모은 수료증 (기금으로 바뀌어요)
    S.fund += fund;
    S.st.dips += yearDip();   // 마지막 해 수료증은 기금이 되지만 학교 점수에는 더해요
    rankDirty();
    const albPg = albAdd('g', { y: from.years, st: leaving, dip: dipsIn, ph: S.hd.album, ltr: frLetter(from) });   // 졸업 쪽과 단짝 편지
    S.hd.album = false;
    S.st.grads += 1;   // 졸업식도 종업식과 함께 행사 횟수로 쳐요
    cloudSoon();
    addGold(GOLD.promote);
    const crew = cereCrew();   // 졸업식 장면의 졸업생(명부를 비우기 전에)
    crew.c3 = cere3Info();   // 새 졸업식: 이름, 숫자, 지도도 명부를 비우기 전에
    const newcomer = cereNewcomer();
    snapTake();   // 졸업식 사진: 이 학교급의 마지막 모습
    S.tfp = S.st.fperks;
    const keep = S.tier + 1 >= GRAD_TIER;   // 대학원: 캠퍼스, 건물, 공사, 도토리, 선생님, 명부, 수료증과 명예 교장실을 이어 가요
    if (!keep) { S.roster = freshRoster(); S.club = freshClub(); }
    S.tier += 1; S.tg = 0; S.sem = 0; S.semDip = 0; S.tdip = 0; S.best = 0; S.hd.furNew = false;
    if (!keep) S.bd = {};   // 새 학교급은 처음부터 지어요(하던 공사는 없어져요)
    acAll();   // 공부: 학교급 상한이 풀려요
    if (!keep) { S.p.dip = 0; for (const k in S.p.perk) S.p.perk[k] = 0; }
    newYear(!keep);
    rosterEnsure(newcomer && newcomer.k);   // 중학교부터 새 명부(방금 전학 온 친구도 함께)
    { const gate = MAIN.findIndex(q => q.t === 'tier' && q.n === S.tier); if (S.tier >= 1 && gate >= 0 && S.q.m < gate) { S.q.m = gate; S.q.lat = ''; startMain(); } }   // 초등학교 입학도 같게. 졸업식 퀘스트(바로 완료)에서 이어가요
    if (newcomer) rt.kidSeq = BASE_SPECIES.length + S.p.species - 1;
    $('#tierConfirm').hidden = true;
    queueModal(() => showCere(from, crew));   // 졸업식 장면 먼저
    queueModal(() => showEntrance(fund, leaving, from, newcomer, dipsIn));
    if (S.tier === 4) queueModal(() => { toast(`새내기 장학금!\n1학년 동안 수업료 +${Math.round((UNI_FRESH.mult - 1) * 100)}%예요`); return false; });
    if (albPg.ltr) queueModal(() => openLetter(albPg));   // 졸업 편지
    if (newcomer) queueModal(() => showNewTalk(newcomer));   // 전학 대화
    cereAfter();
    cereRefresh();
  }
  function showEntrance(fund, leaving, from, newcomer, dipsIn) {
    const T = tierInfo();
    $('#tierTitle').textContent = `${from.school} 졸업식`;
    $('#tierText').textContent = `${eul(from.name)} 마친 친구들 ${leaving}명이 졸업장을 받았어요. ` + (S.tier >= GRAD_TIER ? `이제 ${T.school} 석사 1학기예요! 캠퍼스와 건물, 도토리, 선생님은 그대로 이어 가요.` : S.tier >= 4 ? `이제 ${T.school} 새내기가 돼요!` : `이제 책가방을 메고 ${T.school}에 입학해요!`);
    $('#tierFundAmt').textContent = '+' + fmt(fund);
    const crew = ['rabbit', newcomer ? newcomer.k : 'fox', 'chick'];
    $('#tierArt').innerHTML = `<svg viewBox="-26 -19 52 38" aria-hidden="true">` +
      crew.map((sp, i) => `<g transform="translate(${(i - 1) * 15} ${i === 1 ? -2 : 1}) scale(${i === 1 ? 1.1 : 0.95})">${kidSVG(sp, i)}</g>`).join('') + '</svg>';
    $('#tierFine').textContent = `${from.name}에서 모은 수료증 ${fmt(dipsIn || 0)}장이 장학재단 기금이 됐어요. ` + (newcomer ? `새 친구 ${newcomer.name}${newcomer.ga} 함께 왔어요. ` : '') +
      `새로 생긴 ${eul(T.newb || '건물')} 지어 보세요. 기금은 위쪽 졸업 단추의 장학재단에서 써요. 졸업 선물로 황금 도토리 +${GOLD.promote}개를 받았어요.` +
      (S.tier < GRAD_TIER ? ` 자리 비운 동안의 수업은 ${TEA.owl.name}이 맡아요. 먼저 모셔 보세요.` : '');   // 새 학교급은 부엉이 선생님이 0에서 시작해 자리 비운 효율이 30%예요
    $('#tierOk').textContent = `${T.name} 입학하기`;
    openModal($('#mTier'));
    if (rt.cereRang) { rt.cereRang = false; sfx('done'); }   // 졸업식 장면에서 종을 울렸으면 짧게만
    else { sfx('bell'); setTimeout(() => sfx('quest'), 900); }
    return true;
  }
  /* ---------- 졸업식 장면 ----------
     유치원과 초등학교 졸업식(학교급이 오르는 식)에서 입학 창 앞에 5초쯤 보여요. 졸업생이 하나씩 무대에 서고, 학사모를 던지면 꽃가루가 내려요
     화면 아무 곳이나 누르면 바로 입학 창으로 넘어가요. 동작 줄이기 설정이면 움직이지 않는 그림으로 보여요 */
  const GRAD_CAP = '<path d="M-5.2 -3 L-5.2 -6.6 Q0 -8 5.2 -6.6 L5.2 -3 Q0 -4.4 -5.2 -3 Z" fill="#2E2A3A"/>' +
    '<path d="M-10.4 -7.4 L0 -11 L10.4 -7.4 L0 -3.8 Z" fill="#3D3852" stroke="#25212F" stroke-width=".5"/>' +
    '<path d="M0 -7.4 Q6.4 -7 7.8 -3.6" fill="none" stroke="#F3C04B" stroke-width=".9"/><rect x="7.1" y="-4" width="1.5" height="3.2" rx=".6" fill="#F3C04B"/><circle cx="0" cy="-7.4" r="1" fill="#F3C04B"/>';
  const CERE_MS = 5200;
  // 졸업생: 이 학교급 명부 친구들, 만난 전학생, 처음 다섯 친구 순서로 다섯 명(방금 전학 온 친구는 입학 창에서 만나요)
  function cereCrew(skip) {
    const out = [], add = sp => { if (sp && sp !== skip && !out.includes(sp) && out.length < 5 && (FSI('chr_' + sp) || KID_EMOJI[sp])) out.push(sp); };
    ((S.roster && S.roster.list) || []).forEach(s => add(s.sp));
    NEWCOMERS.slice(0, S.p.species).forEach(n => add(n.k));
    BASE_SPECIES.forEach(add);
    return out;
  }
  function cereArt(from, crew) {
    const flags = ['#E8735A', '#F3C04B', '#6DB3E0', '#8CC66B', '#C48AD8'];
    let h = '<path d="M-4 10 Q110 34 224 10" fill="none" stroke="#8A5D2B" stroke-width="1"/>';
    for (let i = 0; i < 13; i++) {   // 줄에 걸린 깃발
      const x = 6 + i * 17.5, t = (x + 4) / 228, y = 10 + 48 * t * (1 - t);
      h += `<path d="M${(x - 5).toFixed(1)} ${y.toFixed(1)} L${(x + 5).toFixed(1)} ${y.toFixed(1)} L${x.toFixed(1)} ${(y + 10).toFixed(1)} Z" fill="${flags[i % 5]}"/>`;
    }
    h += '<rect x="44" y="28" width="132" height="30" rx="7" fill="#8A5D2B"/><rect x="48" y="32" width="124" height="22" rx="5" fill="#FFF4D6"/>' +
      `<text class="cere-ban" x="110" y="47.5" text-anchor="middle">${esc(from.school)} 졸업식</text>` +
      '<path class="cere-star" d="M36 39 l1.6 3.4 3.6 .4 -2.7 2.4 .8 3.6 -3.3 -1.9 -3.3 1.9 .8 -3.6 -2.7 -2.4 3.6 -.4 Z" fill="#F3C04B"/>' +
      '<path class="cere-star" style="animation-delay:.8s" d="M184 39 l1.6 3.4 3.6 .4 -2.7 2.4 .8 3.6 -3.3 -1.9 -3.3 1.9 .8 -3.6 -2.7 -2.4 3.6 -.4 Z" fill="#F3C04B"/>' +
      '<rect x="8" y="150" width="204" height="10" rx="3" fill="#C99A5B"/><rect x="8" y="158" width="204" height="12" rx="2" fill="#A8743C"/>' +
      '<path d="M8 162 h204" stroke="#8A5D2B" stroke-width=".8" opacity=".6"/>';
    const n = crew.length, gap = n > 4 ? 38 : 44;
    crew.forEach((sp, i) => {
      const x = 110 + (i - (n - 1) / 2) * gap;
      h += `<g class="cere-kid" style="animation-delay:${(0.25 + i * 0.22).toFixed(2)}s"><g transform="translate(${x.toFixed(1)} 151) scale(1.75)">${kidSVG(sp, i, { hat: '', neck: '', cap: (2.0 + i * 0.07).toFixed(2) })}</g></g>`;
    });
    const cc = ['#E8735A', '#F3C04B', '#6DB3E0', '#8CC66B', '#C48AD8', '#FFFFFF'];
    for (let i = 0; i < 34; i++) {   // 꽃가루(고정된 순서라 시험에서도 같은 그림)
      const x = (i * 53 + 11) % 214 + 3, y = -14 - (i * 37) % 30, d = 2.0 + (i * 0.11) % 1.3;
      h += `<rect class="cere-cf" style="animation-delay:${d.toFixed(2)}s" x="${x}" y="${y}" width="${i % 3 ? 3 : 2.2}" height="${i % 3 ? 4.4 : 2.2}" rx=".6" fill="${cc[i % 6]}"/>`;
    }
    return h;
  }
  /* 졸업식 장면 새 단장(메모 8): 강당 배경 위에 장면 셋
     1 입장(0~2.6초): 커튼이 열리고 졸업생이 줄지어 들어와요. 2 축사(2.6~5초): 단상 뒤 교감 선생님, 현수막, 졸업장이 반짝
     3 마무리(5~8.6초): 학사모를 던지면 불꽃, 꽃잎, 풍선, 색종이가 터지고 사진기 플래시와 함께 액자 속 단체 사진. 그림이 없으면 예전 장면 */
  const CERE2_MS = 8600;
  const CERE_BG = { '유치원': 'kinder', '초등학교': 'elem', '중학교': 'middle', '고등학교': 'high' };
  const cere2On = () => !!(IMG('cere_podium') && IMG('cere_curtain_l'));
  function cereArt2(from, crew) {
    const im = (k, x, y, w, h, cls, st) => IMG(k) ? `<image href="${IMG(k)}" x="${x}" y="${y}" width="${w}" height="${h}"${cls ? ` class="${cls}"` : ''}${st ? ` style="${st}"` : ''}/>` : '';
    const bg = CERE_BG[from.name] || 'elem';
    let h = '<defs><clipPath id="cereClip"><rect x="0" y="0" width="220" height="192" rx="10"/></clipPath></defs><g clip-path="url(#cereClip)">' +
      '<rect x="0" y="0" width="220" height="192" fill="#E9C98E"/>' +
      `<image href="${cereBgUrl(bg)}" x="0" y="-56" width="220" height="330" preserveAspectRatio="xMidYMid slice"/>` +
      im('cere_light', 60, -14, 100, 100, 'c2-fade', 'animation-delay:.4s;opacity:.8') +
      `<g class="c2-fade" style="animation-delay:2.4s">${im('cere_banner', 26, 4, 168, 42)}<text class="cere-ban" x="110" y="28.5" text-anchor="middle" style="font-size:10px">${esc(from.school)} 졸업식</text></g>` +
      im('cere_flower_stand', 18, 58, 30, 45, 'c2-fade', 'animation-delay:.9s') + im('cere_flower_stand', 172, 58, 30, 45, 'c2-fade', 'animation-delay:.9s');
    const hed = FSI('tea_hedgehog');
    if (hed) { const hh = 36, hw = hh * (CHR_AR.tea_hedgehog || .75); h += `<image href="${hed}" class="c2-pop" style="animation-delay:2.7s" x="${(110 - hw / 2).toFixed(1)}" y="50" width="${hw.toFixed(1)}" height="${hh}"/>`; }
    h += im('cere_podium', 94, 70, 32, 32, 'c2-fade', 'animation-delay:2.5s') +
      im('cere_diploma', 126, 74, 18, 18, 'c2-pop', 'animation-delay:3.4s') + im('cere_sparkle', 128, 68, 14, 14, 'c2-tw', 'animation-delay:3.6s') +
      '<path class="cere-star" d="M36 39 l1.6 3.4 3.6 .4 -2.7 2.4 .8 3.6 -3.3 -1.9 -3.3 1.9 .8 -3.6 -2.7 -2.4 3.6 -.4 Z" fill="#F3C04B" opacity="0"/>';
    const n = crew.length, gap = n > 4 ? 36 : 42;
    crew.forEach((sp, i) => {
      const x = 110 + (i - (n - 1) / 2) * gap;
      h += `<g class="cere-kid c2-walk" style="animation-delay:${(0.9 + i * 0.28).toFixed(2)}s"><g transform="translate(${x.toFixed(1)} 168) scale(1.6)">${kidSVG(sp, i, { hat: '', neck: '', cap: (5.0 + i * 0.07).toFixed(2) })}</g></g>`;
    });
    // 마무리: 불꽃(3단계와 다른 색 둘), 꽃잎, 풍선, 색종이
    const fw = [[40, 30, 'cere_fw_2', 5.2], [168, 26, 'cere_fw_b1', 5.5], [104, 8, 'cere_fw_b2', 5.9], [60, 18, 'cere_fw_2', 6.4], [150, 40, 'cere_fw_3', 6.7]];
    fw.forEach(([x, y, k, d]) => { h += im(k, x - 24, y - 24, 48, 48, 'c2-fw', `animation-delay:${d}s`); });
    for (let i = 0; i < 14; i++) { const x = (i * 37 + 9) % 206 + 4, d = 5.1 + (i * 0.23) % 2.2; h += im('cere_petal_' + (i % 3 + 1), x, -12, 9, 9, 'c2-petal', `animation-delay:${d.toFixed(2)}s`); }
    h += im('cere_balloon_1', 8, 196, 18, 27, 'c2-bal', 'animation-delay:5.3s') + im('cere_balloon_2', 196, 200, 18, 27, 'c2-bal', 'animation-delay:5.6s') + im('cere_balloon_1', 150, 205, 16, 24, 'c2-bal', 'animation-delay:6.1s');
    const cc = ['#E8735A', '#F3C04B', '#6DB3E0', '#8CC66B', '#C48AD8', '#FFFFFF'];
    for (let i = 0; i < 34; i++) {   // 꽃가루(고정된 순서라 시험에서도 같은 그림)
      const x = (i * 53 + 11) % 214 + 3, y = -14 - (i * 37) % 30, d = 5.0 + (i * 0.11) % 1.3;
      h += `<rect class="cere-cf" style="animation-delay:${d.toFixed(2)}s" x="${x}" y="${y}" width="${i % 3 ? 3 : 2.2}" height="${i % 3 ? 4.4 : 2.2}" rx=".6" fill="${cc[i % 6]}"/>`;
    }
    // 커튼(맨 위에서 열려요), 사진기 플래시와 액자
    h += im('cere_curtain_l', -4, -4, 118, 200, 'c2-curl') + im('cere_curtain_r', 106, -4, 118, 200, 'c2-curr') +
      im('cere_camera', 186, 140, 30, 30, 'c2-fade', 'animation-delay:6.9s') +
      `<rect x="0" y="0" width="220" height="192" fill="#FFF" class="c2-flash" style="animation-delay:7.4s"/>` +
      im('cere_photo_frame', 2, 6, 216, 162, 'c2-frame', 'animation-delay:7.5s') + '</g>';
    return h;
  }

  /* 새 졸업식(: 졸업식이 초라해요): 화면 가득 다섯 장면, 약 21초. 언제든 눌러서 건너뛰기는 그대로
     1 학교 전경(0~3.4초): 졸업하는 학교 지도를 천천히 훑고 현수막에 '숲속 ○○학교 졸업식'
     2 입장(3.2~7.4초): 학교급 강당, 조명, 졸업생이 통로로 걸어 들어와 앞줄에 서요(명부 이름표)
     3 축사(7.4~11.4초): 단상 뒤 교감 선생님 한마디, 우리 학교 이야기 숫자 넷이 하나씩
     4 졸업장 수여(11.4~16.2초): 세 친구가 차례로 단상 앞에서 졸업장을 받고 학교급 졸업 소품(유 꽃왕관, 초 꽃다발, 중 꽃 리본, 고 넥타이)
     5 단체 사진(16.2~21초): 학교 앞 계단 사진 액자, 모자 던지기, 꽃잎, 찰칵
     그림은 img/cere3(큰 그림이라 파일로). 다 받아지지 않았거나 움직임 줄이기면 장면(cereArt2) */
  const CERE3_MS = 21000;
  const CERE3_FILES = ['hall_kinder', 'hall_elem', 'hall_middle', 'hall_high', 'photo_bg', 'frame', 'petals', 'spot', 'podium', 'banner', 'diploma', 'prop_crown', 'prop_bouquet', 'prop_ribbon', 'prop_tie', 'cap_toss'];
  const C3_HALL = ['kinder', 'elem', 'middle', 'high', 'uni'], C3_PROP = ['prop_crown', 'prop_bouquet', 'prop_ribbon', 'prop_tie', 'prop_cap'];
  const C3_FLOOR = [186, 170, 172, 180, 192];   // 강당 그림마다 무대 바닥 높이(360×640 기준)
  const C3_BAN = [76, 40, 40, 64, 34];        // 강당 그림 속 빈 현수막 가운데 높이
  const cere3 = { st: '' };
  // 용량: 졸업식 그림(img/cere, img/cere3)도 앱에 넣지 않고 웹에서 받아요. 못 받으면 예전 졸업식 장면이 나와요
  const c3Raw = k => webDir('img/cere3/') + 'cere3_' + k + '.webp';
  const c3u = k => webSrcMap[c3Raw(k)] || c3Raw(k);
  const cereBgRaw = bg => webDir('img/cere/') + 'cere_bg_' + bg + '.webp';
  const cereBgUrl = bg => webSrcMap[cereBgRaw(bg)] || cereBgRaw(bg);
  function cere3Load() {
    if (cere3.st) return;
    if (location.protocol === 'file:' && !window.FS_IMG_BASE) { cere3.st = 'no'; return; }   // 자동 시험(file://)은 그림 폴더 옆에 있지 않아요
    cere3.st = 'wait'; let n = CERE3_FILES.length, bad = false;
    const done = () => { if (--n === 0) cere3.st = bad ? 'no' : 'ok'; };
    for (const k of CERE3_FILES) webImg(c3Raw(k), done, () => { bad = true; done(); });
    if (APP_PACK() && S) { const bg = CERE_BG[tierInfo().name]; if (bg) webSrc(cereBgRaw(bg)).catch(() => {}); if (uniOn()) { webSrc(c3Raw('hall_uni')).catch(() => {}); webSrc(c3Raw('prop_cap')).catch(() => {}); } }   // 예전 장면의 배경과 대학교 강당도 기기에 받아 둬요
  }
  // 졸업식 정보는 명부를 비우기 전에 모아요(이름, 숫자, 지도)
  function cere3Info() {
    const nm = {}; ((S.roster && S.roster.list) || []).forEach(x => { if (x && x.nm && !nm[x.sp]) nm[x.sp] = x.nm; });
    const lv = facKeys().reduce((a, k) => a + (S.f[k] || 0), 0), mk = mapKey(geo().map), G = geo();
    // 학교 전경에는 지금 지은 건물도 함께(지도 좌표 그대로, 앞에 있는 것이 위에)
    const bld = Object.keys(FAC).filter(k => (FAC[k].tier || 0) <= S.tier && G.lot[k] && (S.f[k] || 0) >= 1).sort((a, b) => G.lot[a][1] - G.lot[b][1]).map(k => {
      const key = seasonKey(bldImg(k)), R = lotRect(G.lot[k], key), [cx, cy, w] = R;
      return `<image href="${IMG170(key)}" x="${(cx - w / 2).toFixed(1)}" y="${(cy - w / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${w.toFixed(1)}"${xfAt(R)}/>`; }).join('');
    return { t: S.tier, nm, bld, map: mapHi[mk] === 'ok' ? mapUrl(mk) : mapLo(mk),
      stats: [['함께한 학생', fmt(Math.floor(S.students)) + '명'], ['건물 레벨 합', 'Lv.' + lv], ['체험학습', fmt(S.st.trips || 0) + '번'], ['모은 수료증', fmt(Math.floor(S.st.dips || 0)) + '장']] };
  }
  function cereArt3(from, crew, I) {
    const t = Math.max(0, Math.min(4, I.t | 0)), fy = C3_FLOOR[t], n = crew.length, sc = 2.3, rowY = fy + 98;
    const im = (k, x, y, w, h, cls, st) => `<image href="${c3u(k)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"${cls ? ` class="${cls}"` : ''}${st ? ` style="${st}"` : ''}/>`;
    const win = (at, dur, body, cls) => `<g class="c3-win${cls ? ' ' + cls : ''}" style="animation-delay:${at}s;animation-duration:${dur}s">${body}</g>`;
    const nmTx = `${from.school} 졸업식`, fs = Math.min(17, 230 / Math.max(6, nmTx.length) * 1.6).toFixed(1);
    const prop = (pi, d) => { const k = C3_PROP[pi]; const P = { prop_crown: [-8, -15.5, 16, 8], prop_bouquet: [1, -3, 11, 11], prop_ribbon: [-4.5, -2, 9, 9], prop_tie: [-2.6, -3.4, 5.2, 10], prop_cap: [-8.5, -19, 17, 13] }[k];
      return im(k, P[0], P[1], P[2], P[3], d == null ? '' : 'c3-pop', d == null ? '' : `animation-delay:${d}s`); };
    const pi = Math.min(4, t);
    let h = '<rect x="0" y="0" width="360" height="640" fill="#2A2018"/>';
    // 1 학교 전경
    h += win(0, 3.6, `<g class="c3-pan"><g transform="translate(-34 ${(-12 + 60 * 428 / 360).toFixed(1)}) scale(${(428 / 360).toFixed(4)})"><image href="${I.map}" x="0" y="-60" width="360" height="540" preserveAspectRatio="none"/>${I.bld || ''}</g></g>` +
      `<rect x="0" y="0" width="360" height="640" fill="url(#c3Sky)"/>` +
      `<g class="c3-pop" style="animation-delay:.5s">${im('banner', 22, 54, 316, 79)}<text class="c3-ban" x="180" y="${(97 + fs * 0.35).toFixed(1)}" style="font-size:${fs}px">${esc(nmTx)}</text></g>`);
    // 2~4 강당
    let hall = im('hall_' + C3_HALL[t], 0, 0, 360, 640) + `<g class="c3-in" style="animation-delay:3.7s">${im('spot', 104, -20, 152, 304, '', 'opacity:.6')}</g>` +
      `<text class="c3-ban" x="180" y="${(C3_BAN[t] + fs * 0.32).toFixed(1)}" style="font-size:${(fs * 0.8).toFixed(1)}px">${esc(nmTx)}</text>`;
    // 3 단상과 교감 선생님
    const hed = FSI('tea_hedgehog'), hh = 50, hw = hh * (CHR_AR.tea_hedgehog || .75);
    hall += `<g class="c3-pop" style="animation-delay:7.4s">${hed ? `<image href="${hed}" x="${(180 - hw / 2).toFixed(1)}" y="${fy - 82}" width="${hw.toFixed(1)}" height="${hh}"/>` : ''}${im('podium', 150, fy - 58, 60, 60)}</g>`;
    hall += win(7.8, 3.6, `<g class="c3-say"><rect x="206" y="${fy - 112}" width="142" height="40" rx="14"/><path d="M216 ${fy - 74} l-10 12 l18 -12z"/><text x="277" y="${fy - 96}">모두 졸업을 축하해요!</text><text x="277" y="${fy - 81}" class="s">정말 멋지게 자랐어요</text></g>`);
    I.stats.forEach(([a, b], i) => { const x = i % 2 ? 186 : 30, y = 446 + Math.floor(i / 2) * 58, d = 8.2 + i * 0.6;
      hall += win(d, 11.4 - d, `<g class="c3-pop" style="animation-delay:${d}s"><g class="c3-stat"><rect x="${x}" y="${y}" width="144" height="48" rx="14"/><text x="${x + 72}" y="${y + 18}" class="s">${a}</text><text x="${x + 72}" y="${y + 39}">${b}</text></g></g>`); });
    // 2 입장과 4 졸업장: 졸업생
    let kids = '';
    // 의자 위에 서 보이지 않게 가운데 통로에 2열 종대로(뒤 줄부터 그려서 앞 줄이 위에 겹쳐요)
    crew.forEach((sp, i) => {
      const r = i >> 1, solo = i === n - 1 && i % 2 === 0, x = 180 + (solo ? 0 : (i % 2 ? 1 : -1) * (21 + r * 4)), y = rowY + r * 54, ks = sc * (1 + r * 0.07);
      const aw = i < 3, ad = 11.6 + i * 1.5, nmK = I.nm[sp] || '';
      const award = aw ? `style="--ax:${(132 - x).toFixed(1)}px;--ay:${(fy + 14 - y).toFixed(1)}px;animation-delay:${ad}s" class="c3-award"` : '';
      kids += `<g transform="translate(${x.toFixed(1)} ${y})"><g class="c3-walk" style="--fx:${(180 - x).toFixed(1)}px;--fy:${330 - r * 54}px;animation-delay:${(3.8 + i * 0.35).toFixed(2)}s"><g ${award}>` +
        `<g transform="scale(${ks.toFixed(3)})">${kidSVG(sp, i, { hat: '', neck: '' })}${prop(pi, aw ? ad + 0.75 : 15.6)}</g>` +
        (nmK ? `<g class="c3-in c3-tag" style="animation-delay:${(5.4 + i * 0.35).toFixed(2)}s"><rect x="-24" y="-52" width="48" height="15" rx="7.5"/><text x="0" y="-41.5">${esc(nmK)}</text></g>` : '') + '</g></g></g>';
      if (aw) kids += win(ad + 0.35, 1.1, `<g class="c3-pop" style="animation-delay:${(ad + 0.35).toFixed(2)}s">${im('diploma', 112, fy - 44, 34, 34)}</g>`);
    });
    hall += kids;
    h += win(3.2, 13.2, hall);
    // 5 단체 사진
    let ph = `<image href="${c3u('photo_bg')}" x="-76" y="0" width="512" height="640" preserveAspectRatio="xMidYMid slice"/><rect x="0" y="0" width="360" height="640" fill="#2A2018" opacity=".62"/>` +
      `<g class="c3-photo" style="animation-delay:16.3s"><g clip-path="url(#c3Clip)">${im('photo_bg', 30, 110, 300, 375)}`;
    const back = crew.slice(0, Math.min(2, Math.max(0, n - 3))), front = crew.slice(back.length);
    [[back, 380, 2.5], [front, 452, 2.7]].forEach(([row, y, s2]) => row.forEach((sp, j) => { const x = 180 + (j - (row.length - 1) / 2) * 62;
      ph += `<g transform="translate(${x.toFixed(1)} ${y}) scale(${s2})">${kidSVG(sp, j, { hat: '', neck: '' })}${prop(pi)}</g>`; }));
    if (hed) ph += `<image href="${hed}" x="268" y="330" width="${(44 * (CHR_AR.tea_hedgehog || .75)).toFixed(1)}" height="44"/>`;
    ph += `</g>${im('frame', 16, 94, 328, 410)}</g>` +
      `<g class="c3-toss" style="animation-delay:17.4s">${im('cap_toss', 110, 150, 140, 140)}</g>` +
      `<g class="c3-fall" style="animation-delay:16.6s">${im('petals', 0, 0, 360, 640)}</g>` +
      `<rect x="0" y="0" width="360" height="640" fill="#FFF" class="c3-flash" style="animation-delay:17.1s"/>` +
      `<g class="c3-in" style="animation-delay:18s"><text class="c3-end" x="180" y="560">졸업을 축하해요!</text><text class="c3-end s" x="180" y="592">${esc($('#cereSub').textContent)}</text></g>`;
    h += `<g class="c3-in" style="animation-delay:16.1s">${ph}</g>`;
    return '<defs><linearGradient id="c3Sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF6D8" stop-opacity=".35"/><stop offset=".4" stop-color="#FFF6D8" stop-opacity="0"/></linearGradient>' +
      '<clipPath id="c3Clip"><rect x="30" y="110" width="300" height="375" rx="4"/></clipPath></defs>' + h;
  }
  function showCere(from, crew) {
    const m = $('#mCere'); if (!m || !crew || !crew.length) return false;
    const T = tierInfo(), v3 = !rt.reduced && !!crew.c3 && cere3.st === 'ok', v2 = !v3 && cere2On(), art = $('#cereArt');
    $('#cereSub').textContent = `이제 ${T.school}에 입학해요!`;
    art.setAttribute('viewBox', v3 ? '0 0 360 640' : '0 0 220 192'); art.setAttribute('preserveAspectRatio', v3 ? 'xMidYMid slice' : 'xMidYMid meet');
    art.innerHTML = v3 ? cereArt3(from, crew, crew.c3) : v2 ? cereArt2(from, crew) : cereArt(from, crew);
    m.classList.toggle('v2', v2); m.classList.toggle('v3', v3);
    rt.cereOn = true; rt.cereToasts = [];
    { const tEl = $('#toast'); if (!tEl.hidden) { rt.cereToasts.push(tEl.textContent); tEl.hidden = true; } }   // 식 직전에 뜬 알림도 장면 뒤로
    m.classList.remove('ask'); $('#cereAsk').hidden = true; cerePause(false);
    openModal(m);
    sfx('bell'); rt.cereRang = true;
    rt.cereAt = performance.now();
    if (rt.cereFx) { rt.cereFx._stop(); rt.cereFx = null; }
    if (v3) { try { rt.cereFx = cereFx(m) || null; } catch (e) { rt.cereFx = null; } }   // 꽃잎, 학사모, 불꽃
    rt.cereRun = { dur: rt.reduced ? 2600 : v3 ? CERE3_MS : v2 ? CERE2_MS : CERE_MS, used: 0, from: rt.cereAt, fan: false, fanAt: v3 ? 17100 : v2 && !rt.reduced ? 5100 : 2000 };
    cereTimers();
    return true;
  }
  // 남은 시간으로 효과음(2초)과 끝(5.2초) 타이머를 다시 걸어요. 건너뛸지 묻는 동안은 멈춰요
  function cereTimers() {
    const R = rt.cereRun; clearTimeout(rt.cereT1); clearTimeout(rt.cereT2);
    if (!rt.cereOn || !R) return;
    if (!R.fan) rt.cereT1 = setTimeout(() => { if (rt.cereOn && !rt.cereAsking) { R.fan = true; sfx('quest'); buzz([30, 60, 30]); } }, Math.max(0, (R.fanAt || 2000) - R.used));
    rt.cereT2 = setTimeout(() => cereEnd(true), Math.max(300, R.dur - R.used));
  }
  // 장면을 누르면 바로 넘기지 않고 건너뛸지 물어요
  // 묻는 동안 졸업식 그림 속 움직임을 멈췄다가 이어요(멈춘 것만 다시 재생)
  function cerePause(on) {
    const sv = document.querySelector('#mCere .cere-svg'); if (!sv || !sv.getAnimations) return;
    if (on && rt.cereFx) { rt.cereFx._stop(); rt.cereFx = null; }   // 묻는 동안 연출은 멈추고 다시 이어 하지 않아요
    if (on) { rt.cerePaused = sv.getAnimations({ subtree: true }).filter(a => a.playState === 'running'); rt.cerePaused.forEach(a => a.pause()); }
    else { (rt.cerePaused || []).forEach(a => { try { a.play(); } catch (e) { /* 무시 */ } }); rt.cerePaused = null; }
  }
  function cereAsk() {
    if (!rt.cereOn || rt.cereAsking) return;
    if (performance.now() - (rt.cereAt || 0) < 350) return;   // 졸업식 창 단추를 누른 손이 바로 묻지 않게
    const R = rt.cereRun; if (R) R.used += performance.now() - R.from;
    clearTimeout(rt.cereT1); clearTimeout(rt.cereT2);
    rt.cereAsking = true;
    $('#mCere').classList.add('ask'); $('#cereAsk').hidden = false; cerePause(true);
    sfx('tap');
  }
  function cereKeep() {
    if (!rt.cereAsking) return;
    rt.cereAsking = false;
    $('#mCere').classList.remove('ask'); $('#cereAsk').hidden = true; cerePause(false);
    if (rt.cereRun) rt.cereRun.from = performance.now();
    cereTimers();
  }
  function cereEnd(force) {
    if (!rt.cereOn) return;
    if (!force && performance.now() - (rt.cereAt || 0) < 350) return;
    rt.cereOn = false; rt.cereAsking = false; rt.cereRun = null;
    if (rt.cereFx) { rt.cereFx._stop(); rt.cereFx = null; }
    clearTimeout(rt.cereT1); clearTimeout(rt.cereT2);
    closeModal($('#mCere'));
    rt.cereToasts.splice(0).forEach((t, i) => setTimeout(() => toast(t), 450 + i * 2400));   // 미뤄 둔 알림을 차례로
  }
  function goRep(msg) { const b = bestPick('rep'); return b.f ? goFac(b.f, msg) : goTeacher(b.t, '연수를 보내면 평판이 ★2 올라요'); }   // 평판 추천
  function goGrad(where) {
    setTab('grad');
    const el = where === 'perks' ? $('#perkHead') : where === 'tier' ? $('#tierCard') : where === 'fund' ? $('#fundHead') : null;
    if (el) el.scrollIntoView({ block: where === 'tier' ? 'center' : 'start', behavior: rt.reduced ? 'auto' : 'smooth' });
  }

