  /* ---------- 컴팩트 키우기 0단계 시제품 (프로젝트 문서 '컴팩트 키우기 개편안' 8절 0단계, woodani 2026-11-24 "12번부터") ----------
     개발자 스위치를 켠 기기에서만 보여요(이 기기 저장 'forest-proto', 게임 저장과 따로). 끄면 지금 게임 그대로예요.
     1) 홈 아래 키우기 띠: 탐험 대원 얼굴과 이름, 지금 도전하는 층, 추천 강화 단추, 합치기 단추
     2) 단짝 이름 붙이기: 탐험 화면에서 '곰' 대신 그 종 단짝 이름(단짝이 없으면 종 이름 그대로)
     값과 규칙은 바꾸지 않아요(강화는 탐험 화면의 '추천 강화'와 같은 함수, 합치기는 공부 탭의 시작 단추와 같은 길) */
  const PROTO_KEY = 'forest-proto';
  try { const q = new URLSearchParams(location.search).get('proto'); if (q === '1' || q === '0') localStorage.setItem(PROTO_KEY, q); } catch (e) { /* 주소로 켜기를 못 쓰면 개발자 단추로 */ }
  const protoOn = () => { try { return localStorage.getItem(PROTO_KEY) === '1'; } catch (e) { return false; } };
  // 탐험 화면 이름: 시제품이 켜져 있고 그 종 단짝이 있으면 단짝 이름
  const tamNm = sp => protoOn() && S && S.fr && S.fr[sp] && S.fr[sp].nm ? S.fr[sp].nm : spName(sp);
  function kbShow() {
    const el = $('#kbBand'); if (!el) return false;
    const on = protoOn() && !!S && tamOn() && rt.tab === 'school' && !rt.photo && !document.body.classList.contains('mg-on') && !rt.cereOn;
    if (on) { const t = $('.tabs'); if (t) el.style.bottom = Math.max(0, Math.round(innerHeight - t.getBoundingClientRect().top)) + 'px'; }
    if (el.hidden === on) { el.hidden = !on; try { hudVars(); } catch (e) { /* 다음 갱신에 */ } }
    document.body.classList.toggle('kb-on', on);
    return on;
  }
  function kbKey() {
    const R = tamUpRec().mem;
    return [tamParty().map(sp => sp + tamMem(sp).lv + tamNm(sp)).join(','), tamCurFl(), tamHOn() ? 1 : 0, R ? R.sp + R.c : '', R && S.budget >= R.c ? 1 : 0].join('|');
  }
  function kbRender(force) {
    if (!kbShow()) return;
    const el = $('#kbBand'), k = kbKey();
    if (!force && el.dataset.k === k) return;
    el.dataset.k = k;
    const R = tamUpRec().mem;
    const faces = tamParty().map(sp => `<button type="button" class="kb-kid" data-kb="tam" aria-label="${esc(tamNm(sp))} Lv.${tamMem(sp).lv}, 탐험으로"><img src="${tamPcPic(sp)}" alt=""><b>${esc(tamNm(sp))}</b><small>Lv.${fmt(tamMem(sp).lv)}</small></button>`).join('');
    const up = R ? `<button type="button" class="kb-up" data-kb="up"${S.budget >= R.c ? '' : ' aria-disabled="true"'}><span>추천 강화</span><b>${esc(tamNm(R.sp))} Lv.${fmt(tamMem(R.sp).lv + 1)}</b><em>${acornIcon()}${fmt(R.c)}</em></button>` : '';
    el.innerHTML = `<div class="kb-kids">${faces}</div><div class="kb-side"><button type="button" class="kb-fl" data-kb="tam">${tamFlTx(tamCurFl(), tamHOn())} 도전</button>${up}<button type="button" class="kb-mg" data-kb="mg">합치기</button></div>`;
    try { hudVars(); } catch (e) { /* 다음 갱신에 */ }   // 띠 높이가 정해진 뒤 홈 UI 아래 기준을 다시 재요
  }
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('#kbBand [data-kb], #devProto'); if (!b || !S) return;
    if (b.id === 'devProto') {
      try { localStorage.setItem(PROTO_KEY, protoOn() ? '0' : '1'); } catch (x) { /* 저장소를 못 쓰면 그대로 */ }
      sfx('tap'); toast(protoOn() ? '키우기 띠 시제품을 켰어요' : '키우기 띠 시제품을 껐어요'); protoDevSync(); kbRender(true); return;
    }
    const a = b.dataset.kb;
    if (a === 'tam') { sfx('tap'); setTab('tam'); return; }
    if (a === 'mg') { const m = $('#mgOpen'); if (m) m.click(); return; }
    if (a === 'up') {
      const R = tamUpRec().mem; if (!R) return;
      if (S.budget < R.c) { sfx('tap'); toast(`도토리가 ${fmt(R.c - S.budget)}개 모자라요`); return; }
      if (!tamLvBuy(R.sp, 1)) return;
      sfx('coin'); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
      toast(`${tamNm(R.sp)} Lv.${fmt(tamMem(R.sp).lv)}! 탐험대 힘 ${fmt(tamPow())}`);
      kbRender(true);
    }
  });
  function protoDevSync() { const d = $('#devProto'); if (d) d.textContent = protoOn() ? '키우기 띠 시제품 끄기' : '키우기 띠 시제품 켜기'; }
  setInterval(() => { try { protoDevSync(); kbRender(false); } catch (e) { /* 다음 번에 */ } }, 500);
