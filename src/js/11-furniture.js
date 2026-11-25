  /* ---------- 시설 안 가구 ---------- */
  // 시설마다 가구가 네 개 있어요. 가구는 건물 레벨까지 올릴 수 있고, 네 개가 모두 건물 레벨에 닿아야 건물을 한 단계 키울 수 있어요.
  // 가구값은 건물값과 따로 내요 (네 개를 합치면 다음 건물값의 60%). 레벨이 오를수록 방 안 가구 수가 늘어요. 가구는 따로 효과가 없어요
  // 가구 모습은 학교급마다 한 단계씩 바뀌어요 (유치원 낡은, 초등학교 튼튼한, 중학교 산뜻한, 고등학교부터 반짝이는). 학교급이 오른 뒤 처음 올린 가구부터 새 모습이에요
  const FUR_SHARE = [0.12, 0.14, 0.16, 0.18];
  const FUR_STAGE = ['', '낡은', '튼튼한', '산뜻한', '반짝이는'];
  const furStage = n => n <= 0 ? 0 : Math.min(4, (S ? S.tier : 0) + 1);
  const FUR = {
    classroom: [{ id: 'desk', name: '책상' }, { id: 'chair', name: '의자' }, { id: 'fan', name: '선풍기' }, { id: 'locker', name: '청소도구함' }],
    cafeteria: [{ id: 'table', name: '식탁' }, { id: 'counter', name: '배식대' }, { id: 'water', name: '정수기' }, { id: 'rack', name: '식판 선반' }],
    library: [{ id: 'shelf', name: '책장' }, { id: 'rdesk', name: '열람 책상' }, { id: 'sofa', name: '독서 소파' }, { id: 'lamp', name: '스탠드' }],
    playground: [{ id: 'slide', name: '미끄럼틀' }, { id: 'swing', name: '그네' }, { id: 'bars', name: '철봉' }, { id: 'bench', name: '벤치' }],
    science: [{ id: 'lab', name: '실험대' }, { id: 'scope', name: '현미경' }, { id: 'chem', name: '약품장' }, { id: 'globe', name: '지구본' }],
    store: [{ id: 'snackrack', name: '간식 진열대' }, { id: 'fridge', name: '음료 냉장고' }, { id: 'register', name: '계산대' }, { id: 'snacktable', name: '간식 탁자' }],
    dorm: [{ id: 'bunk', name: '2층 침대' }, { id: 'sdesk', name: '공부 책상' }, { id: 'closet', name: '옷장' }, { id: 'rug', name: '러그' }],
    union: [{ id: 'union_board', name: '동아리 게시판' }, { id: 'union_sofa', name: '소파' }, { id: 'union_vend', name: '자판기' }, { id: 'union_stage', name: '무대' }],
    institute: [{ id: 'institute_bench', name: '실험대' }, { id: 'institute_board', name: '화이트보드' }, { id: 'institute_desk', name: '연구 책상' }, { id: 'institute_coffee', name: '커피 머신' }],   // 연구소
    gradhall: [{ id: 'gradhall_table', name: '세미나 탁자' }, { id: 'gradhall_screen', name: '발표 스크린' }, { id: 'gradhall_shelf', name: '논문 서가' }, { id: 'gradhall_plant', name: '큰 화분' }]   // 연구동 세미나실. 학생회관. 기숙사
  };
  // 대학교 가구 이름(그림도 바뀌어요). 열쇠와 저장은 그대로
  const FUR_NM_U = { fan: '빔 프로젝터', locker: '사물함', rack: '식판 반납대', shelf: '서가', rdesk: '열람석', slide: '농구 골대', swing: '축구 골대', bars: '허들', chem: '시약장', globe: '분자 모형', snackrack: '진열대', snacktable: '탁자', bunk: '침대', sdesk: '책상' };
  for (const k in FUR) for (const F of FUR[k]) { const n0 = F.name; Object.defineProperty(F, 'name', { get: () => { try { return uniNow() && FUR_NM_U[F.id] ? FUR_NM_U[F.id] : n0; } catch (e) { return n0; } }, enumerable: true, configurable: true }); }
  const batchim = w => { const c = w.charCodeAt(w.length - 1); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 > 0; };
  const iga = w => w + (batchim(w) ? '이' : '가'), eun = w => w + (batchim(w) ? '은' : '는');
  // '로/으로': 받침이 없거나 ㄹ 받침이면 '로'. 숫자로 끝나면 읽는 소리로(0 영, 3 삼, 6 육은 '으로')
  const euro = w => { w = String(w); const ch = w.charAt(w.length - 1), c = ch.charCodeAt(0); if (/[0-9]/.test(ch)) return w + ('036'.includes(ch) ? '으로' : '로'); if (c < 0xAC00 || c > 0xD7A3) return w + '로'; const j = (c - 0xAC00) % 28; return w + (j === 0 || j === 8 ? '로' : '으로'); };
  const freshFu = () => { const o = {}; for (const k in FUR) o[k] = [0, 0, 0, 0]; return o; };
  const furDone = (k, i) => S.f[k] < 1 || S.fu[k][i] >= S.f[k];
  const furReady = k => S.f[k] < 1 || S.fu[k].every(n => n >= S.f[k]);
  const furCost = (k, i) => furDone(k, i) ? Infinity : Math.ceil(softCost(FAC[k].cost, S.fu[k][i] + 1 + (FAC[k].lvOff || 0), SOFT.fac) * FUR_SHARE[i] * costScale() * taFurMul(k));   /* 조교가 일하는 건물은 가구 -10% */   // 연구 건물 가구도 건물처럼 lvOff(빠져서 아주 쌌어요)
  const furAllCost = k => FUR[k].reduce((a, _, i) => a + (furDone(k, i) ? 0 : furCost(k, i)), 0);
  // 이 시설에서 다음에 살 수 있는 것: 가구가 덜 찼으면 가장 싼 가구, 다 찼으면 건물
  const facNextCost = k => furReady(k) ? facCost(k) : Math.min(...FUR[k].map((_, i) => furCost(k, i)));
  const furName = (k, i) => { const n = S.fu[k][i], st = furStage(n); return (st ? FUR_STAGE[st] + ' ' : '') + FUR[k][i].name; };

  function buyFur(k, i, quiet) {
    if (furDone(k, i)) return false;
    const c = furCost(k, i);
    if (S.budget < c) return false;
    const was = S.fu[k][i];
    S.budget -= c;
    S.fu[k][i] = was + 1;
    S.st.ups += 1;
    if (quiet) return true;
    furAfter(k, [[i, was]]);
    return true;
  }
  function buyFurAll(k) {
    const c = furAllCost(k);
    if (!c || S.budget < c) return false;
    const ch = [];
    FUR[k].forEach((_, i) => { const was = S.fu[k][i]; if (buyFur(k, i, true)) ch.push([i, was]); });
    furAfter(k, ch);
    return true;
  }
  function furAfter(k, ch) {
    const up = S.tier >= 1 && !S.hd.furNew && ch.some(([, was]) => was === 0) ? ch.find(([, was]) => was === 0) : null;
    if (up) S.hd.furNew = true;   // 학교급이 오른 뒤 처음 놓은 가구: 새 모습을 한 번 알려 줘요
    if (up) toast(`새 학교급이라 ${iga(FUR[k][up[0]].name)} ${FUR_STAGE[furStage(S.fu[k][up[0]])]} 모습으로 바뀌었어요!`);
    else if (furReady(k)) toast(S.f[k] >= facCap() ? `가구를 다 채웠어요! ${eun(FAC[k].name)} 올해 최고 레벨이에요` : `가구를 다 채웠어요! 이제 ${eul(FAC[k].name)} Lv.${S.f[k] + 1}로 키울 수 있어요`);
    sfx('buy'); buzz(10);
    rt.recAt = 0;
    renderHUD(); renderAffordance();
    save();
    const sc = $('#furScene');
    if (!sc || rt.reduced) return;
    for (const [i] of ch) {
      const [x, ty] = (rt.furTag && rt.furTag[i]) || [160, 120];
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('x', x); t.setAttribute('y', ty - 12); t.setAttribute('text-anchor', 'middle'); t.setAttribute('class', 'fur-pop');
      t.textContent = 'Lv.' + S.fu[k][i];
      sc.appendChild(t);
      if (t.animate) t.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-26px)', opacity: 0 }], { duration: 900, easing: 'ease-out' }).onfinish = () => t.remove();
      else setTimeout(() => t.remove(), 900);
      sc.querySelectorAll(`.fur-it[data-fur="${i}"] .fur-art`).forEach(it => { if (it.animate) it.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 300, easing: 'ease-out' }); });
    }
  }

  /* 시설 방: 위에서 비스듬히 내려다본 진짜 교실처럼 그려요. 위쪽은 뒷벽, 아래는 바닥이에요.
     가구는 레벨이 오를수록 수가 늘어나고(책상은 Lv.21에 12개), 모습은 단계(1 낡은, 2 튼튼한, 3 산뜻한, 4 반짝이는)마다 달라져요 */
  const sparkle = (x, y, s = 1) => `<path d="M${x} ${y - 4 * s} Q${x + s} ${y - s} ${x + 4 * s} ${y} Q${x + s} ${y + s} ${x} ${y + 4 * s} Q${x - s} ${y + s} ${x - 4 * s} ${y} Q${x - s} ${y - s} ${x} ${y - 4 * s} Z" fill="#FFE27A" stroke="#C99A1E" stroke-width=".7" class="fur-twinkle"/>`;
  const furCnt = (n, base, step, max) => n < 1 ? 0 : Math.min(max, base + Math.floor((n - 1) / step));
  // 방마다 가구를 놓을 자리. 앞에 있는 자리부터 채워요. top: 천장에 다는 가구
  const FUR_SPOTS = {
    classroom: {
      desk: { cnt: n => furCnt(n, 2, 2, 12), at: Array.from({ length: 12 }, (_, j) => [44 + (j % 4) * 64, 120 + Math.floor(j / 4) * 42]) },
      chair: { cnt: n => furCnt(n, 2, 2, 12), at: Array.from({ length: 12 }, (_, j) => [51 + (j % 4) * 64, 136 + Math.floor(j / 4) * 42]) },
      fan: { top: true, cnt: n => furCnt(n, 1, 9, 2), at: [[236, 78]], cnt2: n => n >= 10 ? [[86, 78], [236, 78]] : null },
      locker: { cnt: n => furCnt(n, 1, 9, 2), at: [[8, 116], [8, 164]] }
    },
    cafeteria: {
      counter: { cnt: n => furCnt(n, 1, 6, 3), at: [[30, 92]] },
      table: { cnt: n => furCnt(n, 1, 4, 6), at: Array.from({ length: 6 }, (_, j) => [50 + (j % 3) * 78, 142 + Math.floor(j / 3) * 58]) },
      water: { cnt: n => furCnt(n, 1, 9, 2), at: [[290, 120], [290, 170]] },
      rack: { cnt: n => furCnt(n, 1, 9, 2), at: [[10, 140], [10, 196]] }
    },
    library: {
      shelf: { cnt: n => furCnt(n, 1, 5, 4), at: [[12, 96], [50, 96], [236, 96], [274, 96]] },
      rdesk: { cnt: n => furCnt(n, 1, 4, 6), at: Array.from({ length: 6 }, (_, j) => [58 + (j % 3) * 76, 140 + Math.floor(j / 3) * 44]) },
      sofa: { cnt: n => furCnt(n, 1, 12, 2), at: [[40, 226], [212, 226]] },
      lamp: { cnt: n => furCnt(n, 1, 6, 4), at: [[118, 226], [290, 226], [16, 172], [304, 172]] }
    },
    playground: {
      slide: { cnt: n => furCnt(n, 1, 99, 1), at: [[24, 150]] },
      swing: { cnt: n => furCnt(n, 1, 99, 1), at: [[128, 128]] },
      bars: { cnt: n => furCnt(n, 1, 99, 1), at: [[226, 150]] },
      bench: { cnt: n => furCnt(n, 1, 5, 4), at: [[30, 222], [102, 226], [174, 222], [246, 226]] }
    },
    science: {
      lab: { cnt: n => furCnt(n, 1, 4, 6), at: Array.from({ length: 6 }, (_, j) => [52 + (j % 2) * 112, 136 + Math.floor(j / 2) * 44]) },
      scope: { cnt: n => furCnt(n, 1, 6, 4), at: [[112, 90], [134, 90], [156, 90], [178, 90]] },
      chem: { cnt: n => furCnt(n, 1, 9, 2), at: [[262, 100], [290, 100]] },
      globe: { cnt: n => furCnt(n, 1, 99, 1), at: [[208, 90]] }
    },
    store: {   // 매점: 진열대는 뒷벽, 냉장고는 오른쪽 벽, 계산대는 앞 왼쪽, 간식 탁자는 가운데
      snackrack: { cnt: n => furCnt(n, 1, 6, 3) },
      fridge: { cnt: n => furCnt(n, 1, 9, 2) },
      register: { cnt: n => furCnt(n, 1, 99, 1) },
      snacktable: { cnt: n => furCnt(n, 1, 5, 4) }
    },
    dorm: {   // 기숙사: 2층 침대는 뒷벽, 공부 책상은 앞 양옆, 옷장은 뒷벽 오른쪽(신발장 옆), 러그는 가운데 바닥
      bunk: { cnt: n => furCnt(n, 1, 6, 3) },
      sdesk: { cnt: n => furCnt(n, 1, 5, 4) },
      closet: { cnt: n => furCnt(n, 1, 9, 2) },
      rug: { cnt: n => furCnt(n, 1, 99, 1) }
    },
    union: {   // 학생회관: 게시판은 뒷벽 앞, 소파는 왼쪽, 자판기는 뒷벽 가운데, 무대는 오른쪽 앞
      union_board: { cnt: n => furCnt(n, 1, 9, 2) },
      union_sofa: { cnt: n => furCnt(n, 1, 9, 2) },
      union_vend: { cnt: n => furCnt(n, 1, 9, 2) },
      union_stage: { cnt: n => furCnt(n, 1, 99, 1) }
    },
    institute: {   // 연구소: 실험대는 가운데, 화이트보드는 뒷벽, 책상은 왼쪽 앞, 커피 머신은 오른쪽 뒤
      institute_bench: { cnt: n => furCnt(n, 1, 9, 2) },
      institute_board: { cnt: n => furCnt(n, 1, 99, 1) },
      institute_desk: { cnt: n => furCnt(n, 1, 9, 2) },
      institute_coffee: { cnt: n => furCnt(n, 1, 99, 1) }
    },
    gradhall: {   // 연구동 세미나실: 탁자는 가운데, 스크린은 뒷벽, 서가는 왼쪽, 화분은 오른쪽 앞
      gradhall_table: { cnt: n => furCnt(n, 1, 9, 2) },
      gradhall_screen: { cnt: n => furCnt(n, 1, 99, 1) },
      gradhall_shelf: { cnt: n => furCnt(n, 1, 9, 2) },
      gradhall_plant: { cnt: n => furCnt(n, 1, 9, 2) }
    }
  };
  // 방 배경. 0~64는 뒷벽, 그 아래는 바닥이에요
  const FUR_ROOM = {
    classroom: '<rect width="320" height="230" fill="#C99B6B"/>' + Array.from({ length: 8 }, (_, i) => `<path d="M0 ${84 + i * 20} H320" stroke="#B4885A" stroke-width="1"/>`).join('') +
      '<rect width="320" height="64" fill="#F3E8CF"/><rect y="60" width="320" height="5" fill="#8C6440"/>' +
      '<rect x="96" y="8" width="128" height="44" rx="3" fill="#2F5D4A" stroke="#8C6440" stroke-width="3"/><text x="160" y="36" text-anchor="middle" class="fur-chalk">오늘도 즐겁게!</text><rect x="122" y="52" width="76" height="3" fill="#8C6440"/>' +
      '<rect x="14" y="10" width="62" height="40" rx="2" fill="#BEE0EA" stroke="#8C6440" stroke-width="2.5"/><path d="M45 10 V50 M14 30 H76" stroke="#8C6440" stroke-width="1.6"/>' +
      '<rect x="242" y="12" width="64" height="38" rx="2" fill="#D9B98A" stroke="#8C6440" stroke-width="2"/><rect x="248" y="17" width="16" height="12" fill="#FFFDF5"/><rect x="268" y="16" width="14" height="16" fill="#F7C9D2"/><rect x="286" y="18" width="14" height="11" fill="#CDE9F2"/><rect x="254" y="33" width="20" height="12" fill="#FFF1B8"/><rect x="280" y="33" width="18" height="12" fill="#D8EBC4"/>' +
      '<circle cx="230" cy="20" r="0" />' +
      // 교탁
      '<rect x="138" y="70" width="44" height="10" rx="1.2" fill="#B07F45" stroke="#4E3D2C"/><rect x="138" y="80" width="44" height="12" rx="1.2" fill="#8C6440" stroke="#4E3D2C"/>',
    cafeteria: '<rect width="320" height="230" fill="#E8D7C2"/>' + Array.from({ length: 9 }, (_, i) => `<path d="M${i * 40} 64 V230" stroke="#D2BFA6"/>`).join('') + Array.from({ length: 5 }, (_, i) => `<path d="M0 ${96 + i * 34} H320" stroke="#D2BFA6"/>`).join('') +
      '<rect width="320" height="64" fill="#F6E3D3"/><rect y="60" width="320" height="5" fill="#B89B7A"/>' +
      '<rect x="98" y="6" width="124" height="48" rx="5" fill="#FFFDF5" stroke="#C2533D" stroke-width="2.5"/><text x="160" y="22" text-anchor="middle" class="fur-menu-h">이번 주 식단</text><text x="160" y="37" text-anchor="middle" class="fur-menu">{M1}</text><text x="160" y="49" text-anchor="middle" class="fur-menu">{M2}</text>' +
      '<rect x="20" y="10" width="62" height="36" rx="2" fill="#BEE0EA" stroke="#B89B7A" stroke-width="2.5"/><path d="M20 18 H82" stroke="#F3B92E" stroke-width="5"/><rect x="238" y="10" width="62" height="36" rx="2" fill="#BEE0EA" stroke="#B89B7A" stroke-width="2.5"/><path d="M238 18 H300" stroke="#F3B92E" stroke-width="5"/>',
    library: '<rect width="320" height="230" fill="#A97C55"/><rect x="40" y="186" width="240" height="40" rx="6" fill="#C2533D" opacity=".55"/>' + Array.from({ length: 8 }, (_, i) => `<path d="M0 ${84 + i * 20} H320" stroke="#966B47"/>`).join('') +
      '<rect width="320" height="64" fill="#EAD9BF"/><rect y="60" width="320" height="5" fill="#7A5A3C"/>' +
      '<path d="M130 58 V28 Q160 0 190 28 V58 Z" fill="#BEE0EA" stroke="#7A5A3C" stroke-width="3"/><path d="M160 8 V58 M130 38 H190" stroke="#7A5A3C" stroke-width="1.6"/>' +
      '<rect x="100" y="20" width="20" height="30" rx="2" fill="#F7E7C6" stroke="#7A5A3C"/><rect x="200" y="20" width="20" height="30" rx="2" fill="#F7E7C6" stroke="#7A5A3C"/>',
    playground: '<rect width="320" height="230" fill="#D9C08A"/><rect width="320" height="44" fill="#CDE9F2"/><circle cx="284" cy="18" r="11" fill="#FFE27A"/><ellipse cx="64" cy="16" rx="18" ry="6" fill="#FFFFFF"/><ellipse cx="180" cy="12" rx="22" ry="7" fill="#FFFFFF"/>' +
      '<path d="M0 44 Q30 30 60 42 Q100 26 140 42 Q180 28 220 42 Q260 30 320 40 V64 H0 Z" fill="#7DA857"/><rect y="60" width="320" height="4" fill="#9DC37A"/>' +
      Array.from({ length: 17 }, (_, i) => `<path d="M${6 + i * 19} 66 V50 M${2 + i * 19} 54 H${12 + i * 19}" stroke="#A3713F" stroke-width="2"/>`).join('') +
      '<ellipse cx="80" cy="200" rx="40" ry="6" fill="#C9AE76"/><ellipse cx="230" cy="190" rx="30" ry="5" fill="#C9AE76"/>',
    science: '<rect width="320" height="230" fill="#B9C3C3"/>' + Array.from({ length: 9 }, (_, i) => `<path d="M${i * 40} 64 V230" stroke="#A3AEAE"/>`).join('') + Array.from({ length: 5 }, (_, i) => `<path d="M0 ${96 + i * 34} H320" stroke="#A3AEAE"/>`).join('') +
      '<rect width="320" height="64" fill="#E2ECEB"/><rect y="60" width="320" height="5" fill="#8C9898"/>' +
      '<rect x="118" y="6" width="84" height="48" rx="3" fill="#FFFDF5" stroke="#3E7E79" stroke-width="2.5"/><circle cx="160" cy="30" r="4" fill="#D9534A"/><ellipse cx="160" cy="30" rx="20" ry="7" fill="none" stroke="#3F8AD8" stroke-width="1.4"/><ellipse cx="160" cy="30" rx="20" ry="7" fill="none" stroke="#3F8AD8" stroke-width="1.4" transform="rotate(60 160 30)"/><ellipse cx="160" cy="30" rx="20" ry="7" fill="none" stroke="#3F8AD8" stroke-width="1.4" transform="rotate(-60 160 30)"/>' +
      '<rect x="16" y="10" width="60" height="38" rx="2" fill="#BEE0EA" stroke="#8C9898" stroke-width="2.5"/><path d="M46 10 V48" stroke="#8C9898" stroke-width="1.6"/>' +
      '<rect x="224" y="12" width="30" height="34" fill="#FFFDF5" stroke="#8C9898"/>' + Array.from({ length: 12 }, (_, i) => `<rect x="${227 + (i % 4) * 6}" y="${15 + Math.floor(i / 4) * 9}" width="5" height="7" fill="${['#F7C9D2', '#CDE9F2', '#FFF1B8', '#D8EBC4'][i % 4]}"/>`).join('') +
      // 시범 실험대
      '<rect x="104" y="70" width="112" height="9" rx="1.2" fill="#3E4A52" stroke="#4E3D2C"/><rect x="104" y="79" width="112" height="12" rx="1.2" fill="#D6A46A" stroke="#4E3D2C"/>'
  };
  // 매점 방(그림 room_store가 오기 전 임시)
  FUR_ROOM.store = '<rect x="-12.5" width="345" height="230" fill="#E7D3B4"/>' + Array.from({ length: 8 }, (_, i) => `<path d="M-12 ${84 + i * 20} H332" stroke="#D4BC98"/>`).join('') +
    '<rect x="-12.5" width="345" height="64" fill="#F4E6CC"/><rect x="-12.5" y="60" width="345" height="5" fill="#A9845C"/>' +
    '<path d="M60 8 h200 l-10 16 h-180 z" fill="#E9806E"/><path d="M80 8 v16 M100 8 v16 M120 8 v16 M140 8 v16 M160 8 v16 M180 8 v16 M200 8 v16 M220 8 v16 M240 8 v16" stroke="#FFF6E6" stroke-width="5"/>' +
    '<rect x="20" y="22" width="56" height="34" rx="2" fill="#BEE0EA" stroke="#A9845C" stroke-width="2.5"/><rect x="244" y="22" width="56" height="34" rx="2" fill="#BEE0EA" stroke="#A9845C" stroke-width="2.5"/>';
  // 급식실 칠판의 오늘의 급식: 실제 요일(일 0 ~ 토 6)에 따라 바뀌어요
  const MENU = [['오늘은 급식이 없어요', '월요일에 만나요'], ['도토리밥 버섯국', '산딸기 푸딩'], ['당근 볶음밥', '클로버 샐러드'], ['밤 카레라이스', '꿀 호떡'],
    ['연어 주먹밥', '블루베리 요거트'], ['호박 수프', '솔방울 쿠키'], ['오늘은 급식이 없어요', '월요일에 만나요']];

  /* 시설 안: 방 배경 그림 위에 가구 그림을 올려요. 바닥은 위에서 40%(y 92)부터예요
     자리는 [가운데 x, 바닥에 닿는 y], 너비는 지도 단위. 뒤쪽(y가 작은 곳)일수록 조금 작게 그려요 */
  const FUR_AR = { desk: 0.75, chair: 1.56, fan: 1.84, locker: 2.27, table: 0.53, counter: 0.43, water: 2.29, rack: 0.96, shelf: 1.28, rdesk: 0.39, sofa: 0.66, lamp: 2.40, lab: 0.87, scope: 1.72, chem: 0.91, globe: 1.41, slide: 1.00, swing: 0.70, bars: 0.46, bench: 0.57, snackrack: 1, fridge: 1.8, register: 0.75, snacktable: 0.8, bunk: 1.04, sdesk: 0.82, closet: 1.17, rug: 0.62, union_board: 1.06, union_sofa: 0.56, union_vend: 1.58, union_stage: 0.96, institute_bench: 0.85, institute_board: 1.06, institute_desk: 0.87, institute_coffee: 1.14, gradhall_table: 0.79, gradhall_screen: 1.01, gradhall_shelf: 1.17, gradhall_plant: 0.96 /* 연구소와 연구동 가구(빠져서 방에 안 보였어요) */ };   // 기숙사 가구(그림 테두리에 맞게 잘라 넣음)
  // 방 배치 다시 짜기(실제 모습처럼): 뒤쪽은 좁고 작게, 앞쪽은 넓고 크게 보이는 원근에 맞춰 놓아요
  // furP(u, y): 바닥 y에서 가로 위치 u(-1 왼쪽 벽 ~ 1 오른쪽 벽)를 지도 단위 x로 바꿔요. 자리는 [x, 바닥에 닿는 y]이고 앞(위쪽 자리)부터 채워요.
  // on: 다른 가구 위에 올려요(현미경은 실험대 위, 지구본은 약품장 위). dx는 받침 가구 너비에 대한 가로 비율, dy는 받침 가구 높이에 대한 높이 비율
  const furPersp = y => 0.62 + 0.38 * Math.max(0, Math.min(1, (y - 92) / 138));
  const furP = (u, y) => [+(160 + u * 165 * furPersp(y)).toFixed(1), y];
  const furGrid = (us, ys) => ys.flatMap(y => us.map(u => furP(u, y)));
  const FUR_LAY = {
    classroom: {   // 칠판을 바라보고 네 줄로 앉아요. 의자는 책상 바로 뒤, 청소도구함은 창가 뒤쪽 구석, 선풍기는 앞 구석
      desk: { w: 46, at: furGrid([-0.2, 0.2, -0.6, 0.6], [150, 183, 216]) },
      chair: { w: 19, at: furGrid([-0.2, 0.2, -0.6, 0.6], [160, 193, 226]) },
      fan: { w: 22, at: [furP(-0.9, 222), furP(0.9, 222)] },
      locker: { w: 26, at: [[26, 118], [50, 118]] }
    },
    cafeteria: {   // 배식대는 배식 창 아래 뒷벽에 나란히, 식탁은 두 줄, 식판 선반은 배식대 옆 왼쪽 벽, 정수기는 오른쪽 벽
      counter: { w: 68, at: [furP(0, 116), furP(-0.5, 116), furP(0.5, 116)] },
      table: { w: 64, at: furGrid([-0.42, 0.42], [160, 192, 224]) },
      water: { w: 20, at: [[298, 142], [302, 186]] },
      rack: { w: 40, at: [[34, 132], [30, 178]] }
    },
    library: {   // 책장은 뒷벽에 나란히, 열람 책상은 가운데 두 줄, 소파와 스탠드는 앞 구석
      shelf: { w: 46, at: [furP(-0.36, 112), furP(0.36, 112), furP(-0.78, 112), furP(0.78, 112)] },
      rdesk: { w: 60, at: furGrid([-0.4, 0.4], [162, 194, 226]) },
      sofa: { w: 54, at: [furP(-0.78, 212), furP(0.78, 212)] },
      lamp: { w: 14, at: [furP(0.98, 200), furP(-0.98, 200), furP(-0.14, 114), furP(0.14, 114)] }
    },
    playground: {
      slide: { w: 90, at: [[68, 178]] },
      swing: { w: 90, at: [[166, 148]] },
      bars: { w: 74, at: [[262, 174]] },
      bench: { w: 50, at: [[38, 226], [114, 228], [206, 228], [282, 226]] }
    },
    store: {   // 매점(가구 그림이 오면 자리를 다시 맞춰요)
      snackrack: { w: 58, at: [furP(-0.3, 114), furP(0.3, 114), furP(-0.78, 114)] },
      fridge: { w: 30, at: [[296, 150], [300, 192]] },
      register: { w: 56, at: [furP(-0.62, 226)] },
      snacktable: { w: 50, at: furGrid([-0.1, 0.5], [164, 204]) }
    },
    dorm: {   // 기숙사 방(room_dorm): 창은 왼쪽 벽, 문과 신발장은 뒷벽 오른쪽
      bunk: { w: 64, at: [furP(-0.42, 118), furP(0.02, 118), furP(-0.84, 132)] },
      sdesk: { w: 58, at: furGrid([-0.66, 0.66], [178, 222]) },
      closet: { w: 40, at: [furP(0.42, 114), [312, 160]] },
      rug: { w: 84, at: [[160, 206]] }
    },
    union: {   // 학생회관 방(room_union): 창은 왼쪽 벽, 그려진 작은 무대는 뒷벽 오른쪽
      union_board: { w: 50, at: [[40, 122], [30, 162]] },
      union_sofa: { w: 74, at: [[171, 114], [218, 194]] },
      union_vend: { w: 34, at: [[208, 97], [230, 97]] },
      union_stage: { w: 112, at: [[284, 102]] }
    },
    institute: {   // 연구소 방(room_institute). 자리는 본부 어림(학생회관 방과 같은 바닥 높이)
      institute_bench: { w: 92, at: [[150, 150], [150, 200]] },
      institute_board: { w: 70, at: [[160, 72]] },
      institute_desk: { w: 70, at: [[42, 170], [42, 214]] },
      institute_coffee: { w: 38, at: [[284, 104]] }
    },
    gradhall: {   // 연구동 세미나실(room_gradhall)
      gradhall_table: { w: 110, at: [[160, 170], [160, 214]] },
      gradhall_screen: { w: 80, at: [[164, 80]] },
      gradhall_shelf: { w: 50, at: [[34, 120], [34, 170]] },
      gradhall_plant: { w: 36, at: [[288, 200], [262, 214]] }
    },
    science: {   // 실험대는 가운데 두 줄, 현미경은 실험대 위, 약품장은 뒷벽 오른쪽, 지구본은 약품장 위
      lab: { w: 62, at: furGrid([-0.42, 0.42], [160, 192, 224]) },
      scope: { w: 18, on: 'lab', dx: 0.3, dy: 0.5 },
      chem: { w: 46, at: [furP(0.42, 116), furP(0.8, 116)] },
      globe: { w: 20, on: 'chem', dx: 0, dy: 0.98 }
    }
  };
  const FUR_SUF = ['', '_old', '', '_fresh', '_shiny'];
  // 특별 가구(정수 상점): 방마다 하나, 사면 그 방에 놓여요. [가운데 x, 바닥 y], 너비, 그림 세로 비율
  const SP_FUR = {
    classroom: { id: 'aquarium', name: '교실 어항', at: [300, 182], w: 42, ar: 1.46 },
    cafeteria: { id: 'cake', name: '케이크 진열장', at: [270, 118], w: 54, ar: 1.01 },
    library: { id: 'globelamp', name: '지구의 독서등', at: [160, 128], w: 36, ar: 1.64 },
    science: { id: 'dino', name: '공룡 뼈 모형', at: [52, 118], w: 74, ar: 0.78 },
    playground: { id: 'carousel', name: '회전목마', at: [294, 130], w: 68, ar: 1.17 }
  };
  const SP_BY_ID = Object.fromEntries(Object.entries(SP_FUR).map(([k, v]) => [v.id, Object.assign({ k }, v)]));
  function spFurImg(k) {
    const F = SP_FUR[k]; if (!F || S.cos.sp[k] !== F.id || !IMG('fur_sp_' + F.id)) return '';
    const [x, y] = F.at, s = furDepth(y), ww = F.w * s, hh = ww * F.ar;
    return `<g class="fur-it fur-sp"><ellipse cx="${x}" cy="${(y - 1).toFixed(1)}" rx="${(ww * 0.42).toFixed(1)}" ry="${(2 + ww * 0.04).toFixed(1)}" class="fur-shadow"/>` +
      `<image href="${IMG('fur_sp_' + F.id)}" x="${(x - ww / 2).toFixed(1)}" y="${(y - hh).toFixed(1)}" width="${ww.toFixed(1)}" height="${hh.toFixed(1)}"/>` +
      `<g class="fur-spark">${sparkle(x + ww * 0.3, y - hh * 0.9, 0.9)}</g></g>`;
  }
  const furDepth = y => 0.72 + 0.32 * Math.max(0, Math.min(1, (y - 92) / 138));   // 원근을 조금 더 세게(뒤 0.72배, 앞 1.04배)
  /* ===== 방 꾸밈 소품과 방 안을 걷는 선생님, 학생 BEGIN =====
     소품은 사지 않아요. 건물이 Lv.1, 5, 10, 15, 20이 되면 하나씩 나타나요(PROP_AT). 자리는 [가운데 x, 아래 끝 y, 너비], 그림 세로 비율은 PROP_AR
     wall: 벽에 걸려서 가구보다 먼저(뒤에) 그려요. flat: 바닥에 깔리는 것(러그). 천장 등은 위 끝을 천장에 붙여요 */
  const PROP_AT = [1, 5, 10, 15, 20];
  const PROP_AR = { classroom_teacherdesk: 1.12, classroom_clock: 1, classroom_board: 0.32, classroom_cubby: 0.28, classroom_plant: 0.61,
    cafeteria_return: 1.05, cafeteria_bins: 0.56, cafeteria_poster: 1.35, cafeteria_plant: 1.04, cafeteria_lamp: 1.5,
    library_rug: 0.35, library_cart: 1.1, library_ladder: 2.43, library_books: 0.67, library_poster: 1.23,
    playground_seesaw: 0.51, playground_sandbox: 0.48, playground_flowerbed: 0.5, playground_fountain: 1.27, playground_tree: 1.15,
    science_poster: 0.77, science_sink: 1.07, science_shelf: 0.38, science_plants: 0.69, science_rocket: 2.26,
    store_basket: 0.79, store_lamp: 1.43, store_menu: 0.83, store_plant: 1.1, store_poster: 1.23,
    dorm_clock: 1.07, dorm_lamp: 1.23, dorm_plant: 1.13, dorm_poster: 1.41, dorm_slippers: 0.79,
    union_poster: 1.43, union_guitar: 2.22, union_lamp: 1.01, union_plant: 1.06, union_cushion: 0.73 };   // 학생회관 소품. 기숙사 소품. 매점 소품
  const PROP_LAY = {
    classroom: [['teacherdesk', 180, 115, 29], ['clock', 267, 45, 17, 'wall'], ['cubby', 102, 104, 69], ['board', 229, 92, 59, 'wall'], ['plant', 15, 158, 27]],
    cafeteria: [['return', 14, 128, 22], ['bins', 296, 216, 44], ['poster', 260, 59, 21, 'wall'], ['plant', 10, 213, 29], ['lamp', 160, 62, 39, 'wall']],
    library: [['rug', 160, 180, 54, 'flat'], ['cart', 33, 133, 26], ['ladder', 260, 115, 13], ['books', 41, 170, 32], ['poster', 159, 61, 28, 'wall']],
    playground: [['seesaw', 152, 193, 59], ['sandbox', 305, 189, 38], ['flowerbed', 89, 92, 74, 'wall'], ['fountain', 10, 171, 20], ['tree', 240, 100, 59, 'wall']],
    science: [['poster', 145, 55, 54, 'wall'], ['sink', 19, 150, 31], ['shelf', 152, 94, 62, 'wall'], ['plants', 20, 207, 39], ['rocket', 293, 209, 18]],
    store: [['menu', 170, 48, 36, 'wall'], ['plant', 14, 206, 26], ['poster', 92, 56, 17, 'wall'], ['basket', 274, 224, 26], ['lamp', 240, 34, 18, 'wall']],   // 매점
    dorm: [['poster', 150, 60, 22, 'wall'], ['slippers', 268, 222, 24], ['clock', 196, 42, 18, 'wall'], ['plant', 16, 210, 26], ['lamp', 104, 30, 18, 'wall']],   // 기숙사
    union: [['poster', 282, 62, 22, 'wall'], ['plant', 14, 204, 30], ['lamp', 133, 40, 16, 'wall'], ['cushion', 150, 214, 36], ['guitar', 272, 198, 13]],
    institute: [['plant', 14, 206, 26], ['lamp', 240, 34, 18, 'wall']], gradhall: [['clock', 250, 42, 18, 'wall'], ['plant', 300, 208, 24]]   // 학생회관
  };
  // 대학교 방: 새 배경에 벽 그림이 이미 있어서 벽 소품과 어린 소품(시소, 모래밭, 로켓, 사물함 칸)은 그리지 않아요
  const PROP_SKIP_U = { classroom: ['cubby', 'board', 'clock'], cafeteria: ['poster', 'lamp'], library: ['poster'], playground: ['seesaw', 'sandbox', 'flowerbed', 'tree', 'fountain'], science: ['poster', 'shelf', 'rocket'], store: ['menu', 'poster', 'lamp'], dorm: ['poster', 'clock', 'lamp'] };
  const propSkip = (k, id) => uniNow() && IMG('room_u_' + k) && (PROP_SKIP_U[k] || []).includes(id);
  // 대학교에서 자리가 달라지는 가구: 빔 프로젝터 스크린은 칠판 양옆, 농구 골대는 왼쪽 뒤, 축구 골대는 오른쪽 뒤, 허들은 트랙 앞
  const FUR_LAY_U = { classroom: { fan: { w: 30, at: [[246, 116], [74, 116]] }, locker: { w: 26, at: [[22, 150], [18, 190]] } },
    playground: { slide: { w: 62, at: [[50, 156]] }, swing: { w: 96, at: [[236, 150]] }, bars: { w: 56, at: [[150, 128]] }, bench: { w: 50, at: [[60, 224], [260, 224], [130, 228], [196, 228]] } } };
  const furLay = (k, id) => (uniNow() && IMG('fur_u_' + id) && FUR_LAY_U[k] && FUR_LAY_U[k][id]) || FUR_LAY[k][id];
  const propCount = k => PROP_AT.filter(lv => (S.f[k] || 0) >= lv).length;
  function propInstances(k) {
    const L = PROP_LAY[k]; if (!L) return [];
    return L.slice(0, propCount(k)).map(([id, x, y, w, kind]) => {
      const u = IMG('prop_' + k + '_' + id); if (!u || propSkip(k, id)) return null;
      const d = kind ? 1 : furDepth(y), ww = w * d, hh = ww * PROP_AR[k + '_' + id];
      const sh = kind ? '' : `<ellipse cx="${x}" cy="${(y - 1).toFixed(1)}" rx="${(ww * 0.42).toFixed(1)}" ry="${(2 + ww * 0.04).toFixed(1)}" class="fur-shadow"/>`;
      return { sp: true, prop: id, y, z: kind ? -1 : y, svg: `<g class="fur-prop">${sh}<image href="${u}" x="${(x - ww / 2).toFixed(1)}" y="${(y - hh).toFixed(1)}" width="${ww.toFixed(1)}" height="${hh.toFixed(1)}"/></g>` };
    }).filter(Boolean);
  }
  // 방 안을 걷는 친구들: 선생님 한 분(그 방 선생님을 모셨을 때)과 학생 두 명. 길(점 목록)을 오가다 가끔 멈춰 서요
  const WALK = {
    classroom: { tea: 'squirrel', t: [[70, 130], [250, 130]], k: [[[furP(-0.4, 140)[0], 140], [furP(-0.4, 226)[0], 226]], [[160, 142], [160, 228]]] },
    cafeteria: { tea: 'dietitian', t: [[80, 138], [240, 138]], k: [[[160, 140], [160, 228]], [[60, 150], [60, 222]]] },
    library: { tea: 'librarian', t: [[90, 126], [230, 126]], k: [[[160, 140], [160, 228]], [[268, 150], [268, 200]]] },
    playground: { tea: 'bear', t: [[110, 208], [230, 208]], k: [[[40, 150], [120, 160], [60, 205]], [[200, 165], [290, 160], [250, 205]]] },
    science: { tea: 'owl', t: [[90, 132], [230, 132]], k: [[[160, 140], [160, 228]], [[60, 160], [60, 226]]] }
  };
  const walkTeaHere = k => { const t = WALK[k] && WALK[k].tea; return !!t && (t === 'dietitian' ? xtHere('diet') : t === 'librarian' ? xtHere('lib') : S.t[t] > 0); };
  function walkSprite(key, h) {
    const ar = CHR_AR[key] || 0.7, u = blobUrl(FSI(key)); if (!u) return null;   // Blob 주소
    const w = h * ar;
    return `<ellipse cx="0" cy="-0.5" rx="${(w * 0.36).toFixed(1)}" ry="${(1.6 + w * 0.05).toFixed(1)}" class="fur-shadow"/><g class="wk-flip"><image href="${u}" x="${(-w / 2).toFixed(1)}" y="${(-h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}"/></g>`;
  }
  function walkBuild(k) {
    const g = $('#roomWalk'); rt.walk = null; if (!g || !WALK[k] || !S.f[k]) return;
    const W = WALK[k], list = [], sp = speciesList();
    const add = (key, h, path, speed) => { const svg = walkSprite(key, h); if (!svg) return; const el = document.createElementNS(NS, 'g'); el.setAttribute('class', 'wk'); el.innerHTML = svg; g.appendChild(el);
      list.push({ el, path, i: 0, dir: 1, t: Math.random(), speed, wait: Math.random() * 2, h }); };
    if (walkTeaHere(k)) add('tea_' + W.tea, 34, W.t, 14);
    const kids = Math.min(2, Math.floor(S.students) || 0);
    for (let j = 0; j < kids; j++) add('chr_' + sp[(j * 3 + k.length) % sp.length], 24, W.k[j], 18 + j * 4);
    rt.walk = { k, list };
    walkStep(0);
  }
  function walkStep(dt) {
    const W = rt.walk; if (!W) return;
    for (const o of W.list) {
      if (o.wait > 0) { o.wait -= dt; } else {
        const a = o.path[o.i], b = o.path[o.i + o.dir] || o.path[o.i];
        const len = Math.max(1, Math.hypot(b[0] - a[0], b[1] - a[1]));
        o.t += dt * o.speed / len;
        if (o.t >= 1) { o.t = 0; o.i += o.dir; if (o.i + o.dir < 0 || o.i + o.dir >= o.path.length) o.dir *= -1; o.wait = Math.random() < 0.5 ? 0.8 + Math.random() * 2.2 : 0; }
      }
      const a = o.path[o.i], b = o.path[o.i + o.dir] || a, t = o.t;
      const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, s = furDepth(y), bob = o.wait > 0 ? 0 : Math.abs(Math.sin(t * Math.PI * 6)) * 1.2;
      o.y = y; o.el.setAttribute('transform', `translate(${x.toFixed(1)} ${(y - bob).toFixed(1)}) scale(${s.toFixed(3)})`);
      const left = b[0] < a[0] - 0.5; if (o.left !== left) { o.left = left; o.el.firstChild && o.el.querySelector('.wk-flip').setAttribute('transform', left ? 'scale(-1 1)' : ''); }
    }
    // 앞(아래)에 있는 친구가 위에 그려지게
    // 끊김 줄이기: 예전에는 순서가 같아도 프레임마다 모두 다시 붙였어요. 순서가 바뀔 때만 옮겨요
    if (W.list.length > 1) { const ord = W.list.slice().sort((p, q) => p.y - q.y), key = ord.map(o => W.list.indexOf(o)).join(''); if (W.ord !== key) { W.ord = key; const g = $('#roomWalk'); ord.forEach(o => g.appendChild(o.el)); } }
  }
  function tick171(dt) { if (!(rt.walk && rt.sheetKey === rt.walk.k)) { rt.wkT = 0; return; } rt.wkT = (rt.wkT || 0) + dt; if (rt.mf % MAP_DIV === 0) { walkStep(rt.wkT); rt.wkT = 0; } }   // 지도 학생처럼 1초에 30번
  /* ===== 방 꾸밈 소품과 걷는 친구들 END ===== */
  function furImg(id, x, y, w, st) {
    const s = furDepth(y), ww = w * s, hh = ww * FUR_AR[id];
    return `<ellipse cx="${x}" cy="${(y - 1).toFixed(1)}" rx="${(ww * 0.42).toFixed(1)}" ry="${(2 + ww * 0.04).toFixed(1)}" class="fur-shadow"/>` +
      `<image href="${IMG(furKey(id, st))}" x="${(x - ww / 2).toFixed(1)}" y="${(y - hh).toFixed(1)}" width="${ww.toFixed(1)}" height="${hh.toFixed(1)}"/>` +
      (st === 4 ? `<g class="fur-spark">${sparkle(x + ww * 0.34, y - hh * 0.86, 1.1)}${sparkle(x - ww * 0.3, y - hh * 0.5, 0.75)}</g>` : '');
  }
  const ROOM_TXT = {
    classroom: () => '<text x="250" y="55" text-anchor="end" class="fur-chalk room-chalk">떠든 사람: 토끼</text>',
    cafeteria: () => { const m = MENU[new Date().getDay()]; return '<g class="room-menu"><rect x="10" y="14" width="88" height="48" rx="4" class="room-menu-bg"/><text x="54" y="28" text-anchor="middle" class="fur-menu-h">이번 주 식단</text>' +
      `<text x="54" y="42" text-anchor="middle" class="fur-menu">${m[0]}</text><text x="54" y="54" text-anchor="middle" class="fur-menu">${m[1]}</text></g>`; }
  };
  const SN_MACH = [40, 152, 62];   // 매점 방 뽑기 기계 자리(가운데 x, 바닥 y, 크기)
  /* 방 그림, 가구, 건물 그림이 data: 글자(수백 KB)로 들어 있어서 창을 열 때마다
     긴 글자를 다시 읽고 그림을 다시 풀었어요. 한 번 Blob 주소로 바꿔 두면 짧은 주소만 넣고, 풀어 둔 그림을 다시 써요 */
  const BLOB = new Map(), BLOB_KEEP = [];
  function blobUrl(u) {
    if (!u || u.charCodeAt(0) !== 100 || !u.startsWith('data:') || !window.URL || !URL.createObjectURL) return u;
    let b = BLOB.get(u); if (b) return b;
    try {
      const i = u.indexOf(','), head = u.slice(5, i), bin = atob(u.slice(i + 1)), a = new Uint8Array(bin.length);
      for (let j = 0; j < bin.length; j++) a[j] = bin.charCodeAt(j);
      b = URL.createObjectURL(new Blob([a], { type: head.split(';')[0] || 'image/webp' }));
    } catch (e) { return u; }
    BLOB.set(u, b); return b;
  }
  const blobHtml = h => h.indexOf('"data:') < 0 ? h : h.replace(/(href|src)="(data:[^"]+)"/g, (m, a, u) => `${a}="${blobUrl(u)}"`);
  // 그림을 미리 풀어 둬요(풀린 그림을 잡아 두려고 Image를 남겨요)
  function blobWarm(u) { const b = blobUrl(u); if (!b || BLOB_KEEP.some(x => x.src === b || x.dataset.u === b)) return;   // 그림이 파일 주소여도 미리 불러 둬요
    if (b === u && !/^(img\/|https?:|blob:)/.test(u)) return; const im = new Image(); im.decoding = 'async'; im.dataset.u = b; im.src = b; BLOB_KEEP.push(im); if (im.decode) im.decode().catch(() => {}); }
  function warmRooms() {
    if (!S) return;
    const ks = facKeys().filter(k => S.f[k] >= 1);
    const job = () => { const k = ks.shift(); if (!k) return; try { blobWarm(IMG(roomKey(k))); blobWarm(IMG170(seasonKey(bldImg(k)))); if (!rt.sheetKey) { const ft = rt.furTag; blobHtml(renderFurScene(k)); rt.furTag = ft; } } catch (e) { /* 미리 풀기는 실패해도 괜찮아요 */ } (window.requestIdleCallback || (f => setTimeout(f, 200)))(job); };
    (window.requestIdleCallback || (f => setTimeout(f, 1500)))(job);
  }
  // 대학교 방 배경과 가구: 대학교에서는 room_u_<건물>, fur_u_<가구>가 있으면 그 그림을 써요
  const roomKey = k => uniNow() && IMG('room_u_' + k) ? 'room_u_' + k : 'room_' + k;
  const furKey = (id, st) => uniNow() && IMG('fur_u_' + id) ? 'fur_u_' + id : 'fur_' + id + FUR_SUF[st || 2];
  const roomImg = k => (IMG(roomKey(k)) || !FUR_ROOM[k] ? `<image href="${IMG(roomKey(k))}" x="-12.5" y="0" width="345" height="230" preserveAspectRatio="none"/>` : FUR_ROOM[k]) + (ROOM_TXT[k] ? ROOM_TXT[k]() : '');
  // 방 안 가구를 모두 그려요. 앞(아래)에 있는 것이 위에 그려지게 깊이 순서로 놓아요
  function furInstances(k) {
    const out = [];
    // 받침 가구(실험대, 약품장)의 자리를 먼저 알아야 그 위에 올리는 가구를 놓을 수 있어요
    const base = {};
    FUR[k].forEach((F, i) => { const lay = furLay(k, F.id); if (!lay.on) base[F.id] = lay.at.slice(0, Math.max(1, Math.min(lay.at.length, FUR_SPOTS[k][F.id].cnt(S.fu[k][i])))).map(([x, y]) => ({ x, y, w: lay.w, ar: FUR_AR[F.id] })); });
    FUR[k].forEach((F, i) => {
      const sp = FUR_SPOTS[k][F.id], lay = furLay(k, F.id), n = S.fu[k][i], st = furStage(n);
      if (lay.on) {
        // 받침 가구 위에 올려요. 받침 가구 하나에 하나씩, 받침 가구보다 나중에(위에) 그려요
        const under = base[lay.on] || [];
        under.slice(0, Math.max(1, Math.min(under.length, sp.cnt(n)))).forEach((b, j) => {
          const d = furDepth(b.y), bw = b.w * d, bh = bw * b.ar, x = +(b.x + bw * lay.dx).toFixed(1), y = +(b.y - bh * lay.dy).toFixed(1);
          out.push({ i, j, x, y, z: b.y + 0.5, top: false, ghost: n < 1, svg: furImg(F.id, x, y, lay.w * d / furDepth(y), st) });
        });
        return;
      }
      const at = lay.at.slice(0, Math.max(1, Math.min(lay.at.length, sp.cnt(n))));
      at.forEach(([x, y], j) => out.push({ i, j, x, y, top: false, ghost: n < 1, svg: furImg(F.id, x, y, lay.w, st) }));
    });
    if (SP_FUR[k]) { const sv = spFurImg(k); if (sv) out.push({ sp: true, y: SP_FUR[k].at[1], svg: sv }); }
    { const sv = psFurImg(k); if (sv) out.push({ sp: true, y: PS_FUR_AT[1], svg: sv }); }   // 시즌 가구
    if (k === 'store' && S.tier >= SN.tier && IMG('snack_machine')) out.push({ sp: true, y: SN_MACH[1], svg: `<image class="sn-mach${S.sn && S.sn.gold ? ' gold' : ''}" href="${IMG('snack_machine')}" x="${SN_MACH[0] - SN_MACH[2] / 2}" y="${(SN_MACH[1] - SN_MACH[2] * 0.95).toFixed(1)}" width="${SN_MACH[2]}" height="${SN_MACH[2]}" pointer-events="none"/>` });   // 간식 뽑기 기계. 특별 가구도 깊이 순서에 끼워요
    propInstances(k).forEach(o => out.push(o));   // 꾸밈 소품
    out.sort((a, b) => (a.z || a.y) - (b.z || b.y));
    return out;
  }
  function renderFurScene(k) {
    const L = S.f[k], tags = [];
    const body = furInstances(k).map(o => {
      if (o.sp) return o.svg;
      const n = S.fu[k][o.i], done = n >= L, can = !done && S.budget >= furCost(k, o.i);
      if (o.j === 0) tags.push([o, n, done, can]);
      return `<g class="fur-it${o.ghost ? ' fur-ghost' : ''}" data-fur="${o.i}"${o.j === 0 ? ` role="button" tabindex="0" aria-label="${furName(k, o.i)} Lv.${n}${done ? ', 다 올렸어요' : `, 눌러서 올리기 도토리 ${fmt(furCost(k, o.i))}개`}"` : ''}><g class="fur-art">${o.svg}</g></g>`;
    }).join('');
    // 가구 종류마다 첫 자리 위에 레벨 표를 붙여요
    rt.furTag = {};
    const tagSvg = tags.map(([o, n, done, can]) => {
      // 책상 이름표는 책상 위에 달아서, 바로 앞 의자 이름표와 겹치지 않게 해요
      const id = FUR[k][o.i].id, lay = furLay(k, id), up = (id === 'desk' || lay.on) ? lay.w * furDepth(o.y) * FUR_AR[id] + 10 : 0;   // 다른 가구 위에 올린 것도 이름표를 위에
      const tx = Math.max(20, Math.min(300, o.x)), ty = Math.min(221, Math.max(14, o.y + 6 - up));
      rt.furTag[o.i] = [tx, ty];
      const isRec = rt.rec && rt.rec.kind === 'fur' && rt.rec.k === k && rt.rec.i === o.i;
      return `<g class="fur-tagg${isRec ? ' rec' : done ? ' done' : can ? ' can' : ''}" data-fur="${o.i}"><rect x="${tx - 19}" y="${ty - 8}" width="38" height="15" rx="7.5" class="fur-tag"/><text x="${tx}" y="${ty + 3.2}" text-anchor="middle" class="fur-tag-t">${n ? 'Lv.' + n : '없음'}</text></g>`;
    }).join('');
    return roomImg(k) + body + '<g id="roomWalk" class="room-walk" aria-hidden="true"></g>' + tagSvg;   // 방 안을 걷는 선생님과 학생은 가구 위, 이름표 아래
  }
  function renderFur() {
    const k = rt.sheetKey, box = $('#furBox');
    if (!k || S.f[k] < 1) { box.hidden = true; $('#furAll').hidden = true; rt.furKey = ''; return; }
    box.hidden = false;
    const L = S.f[k];
    const rec = rt.rec && rt.rec.kind === 'fur' && rt.rec.k === k ? rt.rec.i : -1;
    // 도토리가 바뀌어 '올릴 수 있음' 표시만 달라질 때도 방 그림 전체(큰 방 그림과 걷는 친구)를
    // 다시 그려서 깜빡였어요. 방은 건물, 레벨, 가구가 바뀔 때만 다시 그리고, 살 수 있는지는 이름표 색만 바꿔요
    const aff = FUR[k].map((_, i) => S.budget >= furCost(k, i) ? 1 : 0).join('');
    const sk = [k, L, rec, new Date().getDay(), S.fu[k].join(',')].join('|'), key = sk + '|' + aff;
    if (key === rt.furKey) return;
    const same = !!rt.furKey && rt.furKey.startsWith(sk + '|');
    rt.furKey = key;
    if (same) $$('#furScene .fur-tagg').forEach(t => { const i = +t.dataset.fur, n = S.fu[k][i], done = n >= L; if (!t.classList.contains('rec')) t.classList.toggle('can', !done && S.budget >= furCost(k, i)); });
    else { $('#furScene').innerHTML = blobHtml(renderFurScene(k)); walkBuild(k); }   // Blob 주소로
    $('#furScene').setAttribute('aria-label', `${FAC[k].name} 안`);
    $('#furList').innerHTML = FUR[k].map((F, i) => {
      const n = S.fu[k][i], done = n >= L, c = furCost(k, i), ok = !done && S.budget >= c, st = furStage(n);
      return `<button class="fur-row${done ? ' done' : ''}" type="button" data-fur="${i}" aria-disabled="${ok ? 'false' : 'true'}">` +
        `<span class="fr-tx"><b>${furName(k, i)}${i === rec ? '<i class="fr-rec">추천</i>' : ''}</b><small>${n ? `Lv.${n} / ${L}` : '아직 없어요'}${n && st < 4 ? ' <i>다음 학교급에서 새 모습</i>' : ''}</small></span>` +
        (done ? '<span class="fr-done">완료</span>' : `<span class="fr-cost">${acornIcon()}<b>${fmt(c)}</b></span>`) + '</button>';
    }).join('');
    const all = furAllCost(k), ab = $('#furAll');
    ab.hidden = !all;
    ab.setAttribute('aria-disabled', S.budget >= all ? 'false' : 'true');
    $('#furAllCost').textContent = fmt(all);
  }
  function furTap(e) {
    const el = e.target.closest('[data-fur]'); const k = rt.sheetKey;
    if (!el || !k) return;
    const i = +el.dataset.fur;
    if (furDone(k, i)) { toast(`${eun(FUR[k][i].name)} 건물 레벨까지 다 올렸어요`); return; }
    if (!buyFur(k, i)) { shake(el.tagName === 'BUTTON' ? el : $('#furList').children[i]); if (S.budget < furCost(k, i)) toast(acornShort(furCost(k, i) - S.budget)); }
  }

  /* ---------- 지금 무엇을 올리면 좋을까 (추천) ----------
     메인 퀘스트가 살 것을 원하면 그것을 먼저 추천해요. 아니면 같은 도토리로 학교가 가장 크게 자라는 것을 골라요.
     가치 = 학생이 정원까지 찼을 때의 초당 도토리 증가 + 다음 동네까지 평판을 채워 주는 몫(동네가 자라면 수업료 ×1.3).
     가구는 효과가 없어서 '남은 가구 + 건물 한 단계'를 한 묶음으로 보고, 묶음이 뽑히면 그중 가장 싼 가구부터 추천해요 */
  function withTry(mut, fn) {
    const f = { ...S.f }, t = { ...S.t }, st = S.students;
    try { mut(); return fn(); } finally { S.f = f; S.t = t; S.students = st; }
  }
  const potRate = () => withTry(() => { S.students = capacity(); }, () => rate());
  function repWorth(dRep, base) {
    const G = CFG.grades;
    if (S.grade >= G.length - 1 || dRep <= 0) return 0;
    const need = Math.max(1, townRep(S.grade + 1) - rep());
    return base * (CFG.gradeMult - 1) * Math.min(1, dRep / need);
  }
  const furLeftCost = k => S.f[k] < 1 ? 0 : FUR[k].reduce((a, _, i) => {
    let c = 0; for (let n = S.fu[k][i]; n < S.f[k]; n++) c += Math.ceil(softCost(FAC[k].cost, n + 1 + (FAC[k].lvOff || 0), SOFT.fac) * FUR_SHARE[i] * costScale() * taFurMul(k));       // lvOff
    return a + c;
  }, 0);
  const cheapestFur = k => FUR[k].map((_, i) => i).filter(i => !furDone(k, i)).sort((a, b) => furCost(k, a) - furCost(k, b))[0];
  const facAllNext = (n, ks) => (ks || CAMPUS8).filter(k => (S.f[k] || 0) < n && !facBusy(k)).sort((a, b) => facCost(a) - facCost(b))[0];   // facAll 퀘스트에서 다음에 올릴 건물(가장 싼 것)
  const facPick = k => furReady(k) ? { kind: 'fac', k } : { kind: 'fur', k, i: cheapestFur(k) };
  // mode: 'rep' 평판을 가장 싸게, 'rate' 수업료를 가장 싸게, 없으면 학교가 가장 크게 자라는 것
  function valuePick(mode) {
    const base = potRate(), r0 = rep(), opts = [];
    const worth = (pr, rp) => mode === 'rep' ? rp - r0 : mode === 'rate' ? pr - base : pr - base + repWorth(rp - r0, base);
    for (const k of facKeys()) {
      if (facBusy(k)) continue;   // 공사 중인 건물은 빼요
      const cost = furLeftCost(k) + facCost(k);
      const [pr, rp] = withTry(() => { S.f[k] += 1; S.students = capacity(); }, () => [rate(), rep()]);
      opts.push({ v: worth(pr, rp) / Math.max(1, cost), pick: facPick(k) });
    }
    for (const k of Object.keys(TEA)) {
      if (teaMaxed(k)) continue;
      const cost = teaCost(k);
      const [pr, rp] = withTry(() => { S.t[k] += 1; S.students = capacity(); }, () => [rate(), rep()]);
      opts.push({ v: worth(pr, rp) / Math.max(1, cost), pick: { kind: 'tea', k } });
    }
    opts.sort((a, b) => b.v - a.v);
    return opts.length && opts[0].v > 0 ? opts[0].pick : null;
  }
  function questPick(qq) {
    const q = qq || curMain();
    if (!q || (!qq && mainReady())) return null;
    if (q.t === 'fac' && facKeys().includes(q.k) && !facBusy(q.k)) return facPick(q.k);
    if (q.t === 'fur' && !furDone(q.k, q.i)) return { kind: 'fur', k: q.k, i: q.i };
    if (q.t === 'furAll' && !furReady(q.k)) return { kind: 'fur', k: q.k, i: cheapestFur(q.k) };
    if (q.t === 'facAll') { const k = facAllNext(q.n, q.ks); if (k) return facPick(k); }
    if (q.t === 'tea' && !teaMaxed(q.k)) return { kind: 'tea', k: q.k };
    if (q.t === 'teaAll') { const k = Object.keys(TEA).filter(x => S.t[x] < q.n && !teaMaxed(x)).sort((a, b) => teaCost(a) - teaCost(b))[0]; if (k) return { kind: 'tea', k }; }
    if (q.t === 'students' && capacity() < q.n && !facBusy('classroom')) return facPick('classroom');
    // 평판이나 수업료를 모으는 퀘스트는 그것을 가장 싸게 올리는 것을 추천해요
    if (q.t === 'grade' || q.t === 'ygrade') return valuePick('rep');
    if (q.t === 'rate') return valuePick('rate');
    return null;
  }
  function recommend() { const q = curMain(); if (q && !mainReady() && (q.t === 'snDraw' || q.t === 'snDex') && snOpen()) return null; return questPick() || valuePick(); }
  // 추천은 1초에 한 번만 다시 계산해요
  function renderRec(force) {
    const now = performance.now();
    if (!force && rt.recAt && now - rt.recAt < 1000) return;
    rt.recAt = now;
    const r = recommend(), key = r ? `${r.kind}|${r.k}|${r.i ?? ''}` : '';
    if (key === rt.recKey) return;
    rt.recKey = key; rt.rec = r;
    for (const k of Object.keys(FAC)) { const pq = $('#pq-' + k); if (pq) pq.classList.toggle('is-rec', !!r && r.kind !== 'tea' && r.k === k); }
    $$('.tcard').forEach(c => c.classList.toggle('is-rec', !!r && r.kind === 'tea' && r.k === c.dataset.k));
    rt.furKey = '';
    if (rt.sheetKey) renderSheet();
  }

  /* 초반 준비물: 초등학교 1학년까지는 메인 퀘스트를 받을 때 교감 선생님이 다음 퀘스트에 드는 도토리가 모자라면 채워 줘요.
     그래서 켜 놓고 퀘스트를 따라가면 막히지 않고, 초등학교 2학년부터 처음으로 끄고 쉬었다 와야 하는 때가 와요.
     다음 퀘스트에 드는 도토리는 추천과 같은 방법으로 사 가며 어림해요(가상으로만 사고 원래대로 돌려놓아요) */
  const prepPhase = () => S.tier === 0;   // 교감 선생님 지원은 유치원까지만
  const PREP_TYPES = new Set(['fac', 'facAll', 'fur', 'furAll', 'tea', 'teaAll', 'students', 'grade', 'ygrade', 'rate']);
  function needCost(q) {
    if (q && q.t === 'tier' && finalYear()) q = { t: 'ygrade', n: GRAD_MIN };   // 졸업식 퀘스트는 마지막 해 대도시가 되는 데 드는 도토리로 쳐요
    if (!q || !PREP_TYPES.has(q.t)) return 0;
    const keep = { f: { ...S.f }, t: { ...S.t }, fu: JSON.parse(JSON.stringify(S.fu)), st: S.students };
    const reached = () => {
      if (q.t === 'grade' || q.t === 'ygrade') return rep() >= townRep(q.n);
      if (q.t === 'rate') return rate() >= q.n;
      if (q.t === 'students') return capacity() >= q.n;
      return qMeasure(q) >= q.n;
    };
    // 올해 최고 레벨을 넘겨 사지 않고, 그래도 못 이루는 퀘스트(종업식 뒤에 이룰 것)는 지원하지 않아요(0)
    let total = 0, ok = false;
    try {
      S.students = capacity();
      for (let i = 0; i < 120; i++) {
        if (reached()) { ok = true; break; }
        const p = questPick(q) || valuePick();
        if (!p) break;
        if (p.kind === 'tea') { if (teaMaxed(p.k)) break; total += teaCost(p.k); S.t[p.k] += 1; }
        else if (p.kind === 'fur') { if (S.fu[p.k][p.i] >= facCap()) break; total += furCost(p.k, p.i); S.fu[p.k][p.i] += 1; }
        else { if (facMaxed(p.k)) break; total += facCost(p.k); S.f[p.k] += 1; }
        S.students = capacity();
      }
    } finally { S.f = keep.f; S.t = keep.t; S.fu = keep.fu; S.students = keep.st; }
    return ok && isFinite(total) ? total : 0;
  }
  function prepTopUp(quiet) {
    if (!prepPhase()) return 0;
    // 한 번에 많아야 수업료 30분치 + 도토리 200만 개까지만 보태요 (계산이 틀려도 경제가 망가지지 않게)
    const cap = rate() * 60 * 30 + 2e6;
    const need = Math.min(cap, Math.ceil(needCost(curMain()) * 1.05 - S.budget));
    if (!(need > 0) || !isFinite(need)) return 0;
    // 앞 두 자리로 올림해서 보기 좋은 수로 주되, 올림이 상한을 넘으면 내림해서 상한 안에 머물러요 (Issue #2)
    const mag = Math.pow(10, Math.max(0, Math.floor(Math.log10(need)) - 1));
    let v = Math.ceil(need / mag) * mag;
    if (v > cap) v = Math.floor(cap / mag) * mag;
    if (!(v > 0)) return 0;
    S.budget += v;
    if (!quiet) setTimeout(() => toast(`교감 선생님이 다음 준비물로 도토리 ${fmt(v)}개를 보태 주셨어요`), 1600);
    return v;
  }

