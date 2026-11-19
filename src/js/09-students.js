  /* ---------- 학생들 ---------- */
  const BASE_SPECIES = ['rabbit', 'fox', 'raccoon', 'chick', 'bear'];
  // 종업식과 졸업식마다 전학 온 친구가 학생 무리에 섞여요
  const speciesList = () => BASE_SPECIES.concat(NEWCOMERS.slice(0, S.p.species).map(n => n.k));
  // 학생 옷차림은 학교급마다 달라요. 유치원은 노란 모자와 이름표, 초등학교는 책가방과 실내화 주머니
  // 1.5.0: 학생은 그림(PNG). 발은 y 11.5에 닿고, 모자와 목도리 꾸미기는 머리 자리에 겹쳐 그려요
  // 3.1.2 동물마다 모자와 목 장식 자리(woodani 요청): [머리 꼭대기, 빨간 목수건 윗선(그림 높이 비율), 이마 높이 머리 너비(그림 너비 비율), 눈으로 다듬은 모자 아래로(그림 높이 비율)와 크기 배수, 모자 옆으로(그림 너비 비율)]. 그림에서 재고 눈으로 다듬었어요
  const HAT_FIT = { w: 0.9, y: 0.3 };   // 모자 너비(머리 너비 대비), 모자 챙 높이(머리 꼭대기에서 목수건까지 중)
  const KID_FIT = { rabbit: [0.209, 0.673, 0.655], fox: [0.182, 0.609, 0.739], raccoon: [0.118, 0.55, 0.66], chick: [0.018, 0.568, 0.601, 0.02, 1.05], bear: [0.059, 0.573, 0.855], cat: [0.105, 0.577, 0.744], dog: [0.018, 0.541, 0.681], penguin: [0.023, 0.518, 0.716, 0.05, 1.2], panda: [0.064, 0.55, 0.813], koala: [0.168, 0.614, 0.945], otter: [0.018, 0.527, 0.569, 0.03, 1.05], squirrel: [0.064, 0.523, 0.547, 0.04, 1.3, 0.1], hamster: [0.014, 0.527, 0.833], duck: [0.005, 0.523, 0.614, 0.06, 1.2], turtle: [0.0, 0.464, 0.735], mole: [0.005, 0.505, 0.741], frog: [0.064, 0.459, 0.899], waterdeer: [0.141, 0.559, 0.908], redpanda: [0.082, 0.523, 0.853], capybara: [0.018, 0.473, 0.705], kangaroo: [0.177, 0.541, 0.781], meerkat: [0.03, 0.45, 0.6], sloth: [0.04, 0.47, 0.72], chinchilla: [0.12, 0.53, 0.58, 0, 1, 0.06] };
  const HEAD_Y = { rabbit: 0.5, fox: 0.36, raccoon: 0.33, chick: 0.34, bear: 0.31, cat: 0.35, dog: 0.32, penguin: 0.3, panda: 0.31, koala: 0.33, otter: 0.33 };
  // 2.0.0 새 전학생 그림(작업지시서 20)이 오기 전에는 그림 문자로 보여 줘요
  const KID_EMOJI = { hamster: '🐹', duck: '🦆', turtle: '🐢', mole: '🐭', frog: '🐸', waterdeer: '🦌' };
  function kidSVG(sp0, bag, look) {
    // 2.1.3 반짝 친구: 'rabbit_rare'처럼 받으면 반짝 친구 그림(같은 캔버스)과 둘레 반짝임
    const rare = typeof sp0 === 'string' && sp0.endsWith('_rare') && !!FSI('chr_' + sp0), sp = rare ? sp0.slice(0, -5) : (typeof sp0 === 'string' ? sp0.replace(/_rare$/, '') : sp0);
    const hat = look ? look.hat : (S ? S.cos.hat : ''), neck = look ? look.neck : (S ? S.cos.neck : ''), cap = look && look.cap;   // 2.0.1 cap: 졸업식 학사모(던지기 시작 초)
    const ar = CHR_AR['chr_' + sp] || 0.75, h = Math.min(24, 21 / ar), w = h * ar, top = 11.5 - h;
    const hy = top + h * (HEAD_Y[sp] || 0.33), r = h * 0.2, pic = FSI('chr_' + (rare ? sp0 : sp));
    return `<ellipse cx="0" cy="11.6" rx="${(w * 0.32).toFixed(1)}" ry="1.6" class="c-shadow"/>` +
      (pic || !KID_EMOJI[sp] ? `<image href="${pic}" x="${(-w / 2).toFixed(2)}" y="${top.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}"/>`
        : `<text x="0" y="9.5" text-anchor="middle" font-size="15">${KID_EMOJI[sp]}</text>`) +
      (hat || neck || cap ? (() => { const F = KID_FIT[sp], sc = r / 6, s3 = sc.toFixed(3);   // 3.1.2 표가 있으면 동물마다 자리
        const k = F ? Math.max(0.9, Math.min(1.9, Math.min(F[2], 0.8) * w * HAT_FIT.w / (14 * sc))) * (F[4] || 1) : 1;   // 모자를 머리 너비에 맞춰 키워요
        const yh = F ? top + h * (F[0] + HAT_FIT.y * (F[1] - F[0]) + (F[3] || 0)) + 2.6 * sc * k : hy, yn = F ? top + h * F[1] - 6.4 * sc : hy;
        return (neck ? `<g transform="translate(${F && F[5] ? (F[5] * w * 0.8).toFixed(2) : 0} ${yn.toFixed(2)}) scale(${s3})">${neck ? (IMG('cos_neck_' + neck) ? `<image href="${IMG('cos_neck_' + neck)}" x="-6" y="6.2" width="12" height="6"/>` : NECKS[neck] || '') : ''}</g>` : '') +
          (cap || hat ? `<g transform="translate(${F && F[5] ? (F[5] * w).toFixed(2) : 0} ${yh.toFixed(2)}) scale(${(sc * k).toFixed(3)})">${cap ? `<g class="cere-cap" style="animation-delay:${cap}s">${GRAD_CAP}</g>` : hat ? hatSVG(hat) : ''}</g>` : ''); })() : '') +
      `<g transform="translate(0 ${(top + 4).toFixed(1)})">${nlBadge(sp)}</g>` +
      (rare ? `<g class="rare-spark"><path d="M-8 ${(top + 3).toFixed(1)}l.8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8z"/><path d="M7.5 ${(top + 9).toFixed(1)}l.6 1.3 1.3.6-1.3.6-.6 1.3-.6-1.3-1.3-.6 1.3-.6z"/></g>` : '');
  }
  // 친구 성장 쪽지로 키운 전학생: 머리 옆에 별, Lv.5부터 금빛 별
  function nlBadge(sp) {
    const i = NEWCOMERS.findIndex(n => n.k === sp), L = i >= 0 && S && S.p.nl ? S.p.nl[i] : 0;
    if (!L) return '';
    return `<g transform="translate(6.2 -7.4) scale(${L >= 5 ? 1.25 : 1})"><path d="M0 -3.4 L1 -1 L3.4 -1 L1.5 .6 L2.1 3 L0 1.6 L-2.1 3 L-1.5 .6 L-3.4 -1 L-1 -1 Z" fill="${L >= 5 ? '#F3C04B' : '#FFFFFF'}" stroke="${L >= 5 ? '#A97A16' : '#7A8186'}" stroke-width=".6"/></g>`;
  }
  /* 1.5.1 학생 길 찾기: 건물, 공사 자리, 분수를 막힌 곳으로 보고 그 둘레 길로만 다녀요.
     막힌 곳은 건물 그림의 바닥 둘레(누르는 자리보다 조금 좁게)와 분수(타원)예요. 길이 끊긴 곳(초등학교 매점 공사 자리 아래)으로는
     걸어가지 않고 살짝 사라졌다가 나타나요 */
  // 3.0.0 woodani 제보: 학생이 마을 기부 기념물을 뚫고 지나가서, 기념물 바닥(이름표까지)도 막힌 곳으로 봐요
  function vdBlock() {
    if (!vdOpen() || rt.viewTier != null) return null;
    const m = decoMap(); if (!VD.spot[m]) return null;
    const [x, y] = pctXY(VD.spot[m]), { cw } = vdSize(S.vd.lv);
    return [x - cw / 2 - 2, y - cw * 0.4, x + cw / 2 + 2, y + 12];
  }
  function navInfo() {
    const G = geo(), vb = vdBlock(), vk = vb ? vb.map(Math.round).join() : '';
    if (rt.nav && rt.nav.G === G && rt.nav.vk === vk) return rt.nav;
    const M = 2, box = ([cx, cy, w]) => [cx - w * 0.38 - M, cy - w * 0.38 - M, cx + w * 0.38 + M, cy + w * 0.3 + M];
    const blocks = Object.values(G.b).map(box).concat(G.next ? [box(G.next.at)] : []);
    if (G.fount) { const [fx, fy, rx, ry] = G.fount; blocks.push([fx - rx, fy - ry, fx + rx, fy + ry, 1]); }
    if (vb) blocks.push(vb);   // 3.0.0 마을 기부 기념물
    // 기념물이 원래 걷는 점을 덮으면 그 점을 빼고 네 모서리에 우회점을 더해요.
    const N = G.spots.filter(([x, y]) => !blocks.some(b => inBlock(b, x, y, 1))).map(p => p.slice());
    if (vb) {
      const [x0, y0, x1, y1] = vb;
      for (const p of [[x0 - 3, y0 - 3], [x1 + 3, y0 - 3], [x0 - 3, y1 + 3], [x1 + 3, y1 + 3]])
        if (!blocks.some(b => inBlock(b, p[0], p[1], 1))) N.push(p);
    }
    const nav = { G, vk, blocks, N, adj: N.map(() => []) };
    for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++)
      if (navClear(nav, N[i][0], N[i][1], N[j][0], N[j][1], null)) { const d = Math.hypot(N[i][0] - N[j][0], N[i][1] - N[j][1]); nav.adj[i].push([j, d]); nav.adj[j].push([i, d]); }
    return (rt.nav = nav);
  }
  // q: 길을 고를 때는 1만큼 더 넉넉하게 봐서 모서리를 스치지 않게 해요
  const inBlock = (b, x, y, q = 0) => b[4] ? ((2 * x - b[0] - b[2]) / (b[2] - b[0] + 2 * q)) ** 2 + ((2 * y - b[1] - b[3]) / (b[3] - b[1] + 2 * q)) ** 2 < 1
    : x > b[0] - q && x < b[2] + q && y > b[1] - q && y < b[3] + q;
  function navClear(nav, x0, y0, x1, y1, skip) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    for (let s = 0; s <= n; s++) {
      const x = x0 + (x1 - x0) * s / n, y = y0 + (y1 - y0) * s / n;
      for (let b = 0; b < nav.blocks.length; b++) if (!(skip && skip.has(b)) && inBlock(nav.blocks[b], x, y, 1)) return false;
    }
    return true;
  }
  // 지나갈 점 목록을 줘요. 바로 갈 수 있으면 [], 갈 길이 없으면 null
  function navRoute(x0, y0, x1, y1) {
    const nav = navInfo(), skip = new Set();
    nav.blocks.forEach((b, i) => { if (inBlock(b, x0, y0) || inBlock(b, x1, y1)) skip.add(i); });
    if (navClear(nav, x0, y0, x1, y1, skip)) return [];
    const N = nav.N, dist = N.map(() => Infinity), prev = N.map(() => -1), done = N.map(() => false);
    const ends = N.map(([x, y]) => navClear(nav, x, y, x1, y1, skip) ? Math.hypot(x - x1, y - y1) : -1);
    N.forEach(([x, y], i) => { if (navClear(nav, x0, y0, x, y, skip)) dist[i] = Math.hypot(x - x0, y - y0); });
    let best = -1, bestD = Infinity;
    for (;;) {
      let u = -1;
      for (let i = 0; i < N.length; i++) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
      if (u < 0) break;
      done[u] = true;
      if (ends[u] >= 0 && dist[u] + ends[u] < bestD) { bestD = dist[u] + ends[u]; best = u; }
      for (const [v, d] of nav.adj[u]) if (dist[u] + d < dist[v]) { dist[v] = dist[u] + d; prev[v] = u; }
    }
    if (best < 0) return null;
    const out = [];
    for (let u = best; u >= 0; u = prev[u]) out.unshift([N[u][0], N[u][1]]);
    return out;
  }
  /* 4.4.1 woodani 요청: 평소에는 지도 그림의 길(흙, 보도블록)로만, 그리고 모든 길로 걸어요. 대학교 캠퍼스에서 건물을 뚫고 지나가던 것도 고쳐요.
     MAP_PATHS[지도 줄]은 { n: 갈림점과 길 위 점, e: 이어진 두 점 }이에요. dev/paths/chains.py(지도 그림을 보고 길 가운데를 따라 찍은 점)에서 만들고,
     건물 그림이 실제로 덮는 곳(paths/bldmask.py)과 분수는 빼요. 학생 그림은 건물 위에 그려져서 건물 뒤쪽 길은 걷지 않아요.
     행사, 운동회, 체험학습처럼 다른 코드가 정해 준 곳으로 갈 때는 예전처럼 막힌 곳만 돌아서 곧장 가요(k.pw가 갈 곳과 다를 때) */
  const MAP_PATHS = [{"n":[[175,410],[173,392],[171,375],[170,360],[171,348],[174,340],[182,330],[192,314],[195,300],[192,290],[185,277],[179,262],[177,248],[176,239],[157,234],[150,222],[157,206],[178,202],[200,205],[210,221],[200,236],[145,244],[128,247],[105,243],[83,231],[60,229],[40,226],[22,215],[143,256],[138,267],[135,224],[120,218],[118,210],[126,203],[170,190],[162,178],[150,163],[142,145],[145,125],[156,110],[82,40],[70,48],[70,62],[70,72],[60,82],[45,92],[38,105],[40,115],[55,125],[75,135],[87,145],[212,195],[225,188],[240,184],[256,180],[266,176],[204,185],[203,165],[205,145],[208,130],[215,122],[232,115],[255,112],[280,108],[305,106],[325,105],[337,112],[342,128],[345,150],[215,230],[232,235],[248,243],[157,347],[133,350],[100,353],[77,357],[62,363],[45,370],[25,375],[8,378],[48,348],[32,333],[15,318]],"e":[[0,1],[1,2],[2,3],[3,4],[4,5],[4,72],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,13],[13,14],[13,20],[14,15],[14,21],[15,16],[15,30],[16,17],[17,18],[17,34],[18,19],[18,51],[19,20],[19,69],[21,22],[21,28],[22,23],[23,24],[24,25],[25,26],[26,27],[28,29],[30,31],[34,35],[35,36],[36,37],[37,38],[38,50],[40,41],[41,42],[42,43],[43,44],[44,45],[45,46],[46,47],[47,48],[48,49],[49,50],[51,52],[51,56],[52,53],[53,54],[56,57],[57,58],[58,59],[59,60],[60,61],[61,62],[62,63],[72,73],[73,74],[74,75],[75,76],[76,77],[76,80],[77,78],[78,79],[80,81],[81,82]]},{"n":[[177,410],[173,392],[167,378],[147,367],[137,353],[137,340],[150,330],[167,321],[183,310],[193,297],[192,283],[180,270],[163,257],[151,248],[131,243],[122,229],[130,215],[151,210],[172,215],[181,229],[171,243],[180,325],[190,327],[127,250],[117,257],[113,213],[103,203],[187,230],[170,205],[173,183],[167,170],[153,160],[140,147],[133,137],[140,127],[137,117],[160,123],[187,113],[200,100],[200,87],[187,80],[173,77],[187,170],[207,160],[227,153]],"e":[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[7,21],[8,9],[9,10],[10,11],[11,12],[12,13],[13,14],[13,20],[14,15],[14,23],[15,16],[16,17],[16,25],[17,18],[18,19],[18,28],[19,20],[23,24],[28,29],[29,30],[29,42],[30,31],[31,32],[32,33],[33,34],[34,36],[36,37],[37,38],[38,39],[39,40],[40,41],[42,43]]},{"n":[[178,412],[177,398],[163,390],[147,383],[137,370],[137,357],[150,347],[173,337],[183,327],[180,310],[167,300],[143,290],[133,277],[140,263],[153,255],[177,250],[200,247],[213,237],[200,220],[193,207],[196,202],[171,195],[165,182],[174,169],[195,164],[216,170],[224,182],[217,195],[197,153],[192,137],[197,123],[203,110],[197,103],[183,100],[183,92],[150,105],[117,103],[97,97],[90,87],[100,77],[97,67],[107,50],[117,43],[127,40],[150,37],[160,163],[140,160],[123,155],[120,151],[157,185],[140,190],[130,193],[227,160],[247,155],[257,149],[128,253],[233,237],[260,235],[207,333],[233,328],[237,322],[127,345],[120,338]],"e":[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[6,61],[7,8],[8,9],[8,58],[9,10],[10,11],[11,12],[12,13],[13,14],[14,15],[15,16],[16,17],[17,18],[17,56],[18,19],[19,20],[20,27],[23,24],[23,45],[24,25],[24,28],[25,26],[25,52],[26,27],[28,29],[29,30],[30,31],[31,32],[32,33],[33,35],[35,39],[38,39],[39,40],[40,41],[41,42],[42,43],[52,53],[53,54],[56,57],[58,59],[59,60]]},{"n":[[178,412],[178,403],[180,380],[182,363],[180,347],[170,330],[163,313],[167,297],[177,283],[190,270],[200,257],[203,240],[191,229],[170,223],[161,210],[170,197],[191,191],[212,197],[220,210],[212,223],[173,177],[163,160],[160,143],[167,127],[180,113],[190,97],[187,80],[173,67],[160,57],[147,50],[137,103],[150,110],[163,120],[180,137],[197,143],[213,145],[225,141],[150,170],[133,177],[120,173],[50,78],[40,80],[27,93],[27,107],[40,120],[55,128],[227,202],[232,200],[213,262],[227,263],[150,313],[187,337],[200,333],[213,335]],"e":[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[5,51],[6,7],[6,50],[7,8],[8,9],[9,10],[10,11],[10,48],[11,12],[12,19],[14,15],[15,16],[15,20],[16,17],[17,18],[18,19],[20,21],[21,22],[21,37],[22,23],[23,24],[23,32],[23,33],[24,25],[25,26],[26,27],[27,28],[28,29],[31,32],[33,34],[37,38],[51,52],[52,53]]},{"n":[[113,52],[127,57],[140,63],[143,80],[150,97],[173,110],[190,127],[192,147],[180,160],[163,173],[157,187],[163,207],[177,223],[178,235],[167,250],[157,267],[153,287],[163,303],[177,320],[177,337],[170,357],[163,377],[167,397],[167,417],[165,438],[50,440],[100,440],[220,440],[262,440],[117,157],[133,167],[150,172],[195,233],[213,227],[227,217],[150,250],[128,254],[108,248],[147,337],[162,342]],"e":[[0,1],[1,2],[2,5],[5,6],[6,8],[8,9],[9,10],[9,31],[10,11],[11,12],[12,13],[13,14],[13,32],[14,15],[14,35],[15,16],[16,17],[17,18],[18,19],[19,20],[19,39],[20,21],[21,22],[22,23],[23,24],[24,26],[24,27],[25,26],[27,28],[29,30],[30,31],[32,33],[33,34],[35,36],[36,37],[38,39]]},{"n":[[253,78],[227,83],[207,90],[193,103],[193,117],[203,130],[200,147],[183,163],[167,173],[157,187],[150,207],[153,227],[160,240],[165,252],[150,258],[142,270],[150,283],[172,290],[193,283],[202,270],[193,257],[172,252],[187,300],[197,310],[200,327],[190,347],[173,363],[170,380],[173,403],[173,423],[172,438],[45,440],[100,440],[230,440],[270,440],[133,160],[147,168],[190,243],[207,234],[128,280],[157,340],[172,345]],"e":[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[5,8],[7,8],[8,9],[8,36],[9,10],[10,11],[11,12],[12,13],[13,14],[13,21],[14,15],[15,16],[16,17],[17,18],[17,22],[18,19],[19,20],[20,21],[20,37],[22,23],[23,24],[24,25],[25,26],[25,41],[26,27],[27,28],[28,29],[29,30],[30,32],[30,33],[31,32],[33,34],[35,36],[37,38],[40,41]]},{"n":[[177,113],[173,87],[170,67],[160,60],[145,52],[183,60],[198,52],[140,186],[130,200],[117,213],[115,228],[108,250],[105,282],[173,186],[173,205],[177,224],[207,186],[220,200],[237,217],[240,232],[243,255],[245,282],[150,232],[146,243],[150,255],[177,262],[204,255],[208,243],[204,231],[177,285],[177,305],[175,330],[175,355],[175,380],[175,405],[175,430],[175,455],[175,472],[140,290],[210,290]],"e":[[7,8],[8,9],[9,10],[10,11],[10,23],[11,12],[12,38],[13,14],[14,15],[15,22],[15,28],[16,17],[17,18],[18,19],[19,20],[19,27],[20,21],[21,39],[22,23],[23,24],[24,25],[25,26],[25,29],[26,27],[27,28],[29,30],[29,38],[29,39],[30,31],[31,32],[32,33],[33,34],[34,35],[35,36],[36,37]]},{"n":[[13,105],[27,80],[50,73],[87,70],[110,67],[133,58],[160,57],[187,63],[207,77],[233,83],[267,80],[300,82],[323,93],[333,110],[330,125],[173,232],[173,243],[160,260],[133,273],[113,287],[103,307],[107,327],[120,343],[140,363],[160,380],[167,397],[170,417],[172,438],[50,440],[100,440],[230,440],[270,440]],"e":[[15,16],[16,17],[17,18],[18,19],[19,20],[20,21],[21,22],[22,23],[23,24],[24,25],[25,26],[26,27],[27,29],[27,30],[28,29],[30,31]]},{"n":[[165,429],[163,419],[161,408],[160,398],[162,388],[166,378],[170,368],[174,358],[176,347],[178,337],[178,327],[175,317],[170,307],[164,298],[157,290],[150,282],[144,274],[143,264],[153,262],[163,260],[172,255],[175,246],[167,238],[158,234],[155,224],[155,214],[157,203],[161,193],[167,185],[173,176],[180,168],[187,160],[193,152],[199,143],[204,134],[206,124],[206,113],[202,103],[198,94],[192,84],[185,77],[176,71],[166,67],[156,64],[146,61],[158,198],[150,191],[140,186],[130,182],[121,177],[116,167],[175,244],[184,240],[193,234],[202,230],[211,225],[218,218]],"e":[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,13],[13,14],[14,15],[15,16],[16,17],[17,18],[18,19],[19,20],[20,21],[21,22],[22,23],[23,24],[24,25],[25,26],[26,27],[27,28],[28,29],[29,30],[30,31],[31,32],[32,33],[33,34],[34,35],[35,36],[36,37],[37,38],[38,39],[39,40],[40,41],[41,42],[42,43],[43,44],[45,46],[46,47],[47,48],[48,49],[49,50],[26,45],[51,52],[52,53],[53,54],[54,55],[55,56],[21,51]]},{"n":[[182,210],[160,215],[152,229],[160,243],[182,248],[204,243],[212,229],[204,215],[176,262],[173,272],[150,280],[133,284],[112,296],[101,320],[110,343],[133,363],[153,377],[160,390],[172,400],[197,280],[217,284],[235,293],[258,315],[263,340],[253,363],[227,373],[200,383],[185,398],[177,417],[177,437],[70,437],[120,437],[235,437],[290,437],[170,197],[160,182],[157,165],[167,147],[180,132],[187,110],[183,90],[173,77],[160,67],[157,55],[140,180],[107,173],[67,163],[40,147],[20,130],[17,117],[205,127],[222,122],[240,117],[262,110],[215,235],[250,235],[293,226],[307,207],[199,198],[200,182]],"e":[[0,1],[0,7],[0,34],[1,2],[2,3],[3,4],[4,5],[4,8],[5,6],[6,7],[6,54],[7,58],[8,9],[9,10],[9,19],[10,11],[11,12],[12,13],[13,14],[14,15],[15,16],[16,17],[17,18],[18,27],[18,28],[19,20],[20,21],[21,22],[22,23],[23,24],[24,25],[25,26],[26,27],[28,29],[29,31],[29,32],[30,31],[32,33],[34,35],[35,36],[35,44],[36,37],[37,38],[38,39],[38,50],[39,40],[40,41],[41,42],[42,43],[44,45],[45,46],[46,47],[47,48],[48,49],[50,51],[51,52],[52,53],[54,55],[55,56],[56,57],[58,59]]}];   // dev/paths/gen.py가 만들어요(손으로 고치지 않아요)
  function pathInfo() {
    const nav = navInfo();
    if (rt.mpath && rt.mpath.nav === nav) return rt.mpath;
    const D = MAP_PATHS[GEO.indexOf(nav.G)] || { n: [], e: [] }, N = D.n, adj = N.map(() => []), vb = vdBlock(), vn = vb ? { blocks: [vb] } : null;
    for (const [a, b] of D.e) {
      if (!N[a] || !N[b] || (vn && !navClear(vn, N[a][0], N[a][1], N[b][0], N[b][1], null))) continue;   // 기념물이 덮은 길은 빼요
      const L = Math.hypot(N[a][0] - N[b][0], N[a][1] - N[b][1]); adj[a].push([b, L]); adj[b].push([a, L]);
    }
    return (rt.mpath = { nav, N, adj, on: N.map((_, i) => i).filter(i => adj[i].length) });   // on: 길이 이어진 점
  }
  // 길로 가는 지나갈 점 목록. 길이 없으면 null(예전 길 찾기로 가요)
  function pathRoute(k) {
    const W = pathInfo(), N = W.N, t = k.pn, n = N.length;
    if (!(t >= 0 && t < n) || !W.adj[t].length) return null;
    let s = -1, sd = Infinity;
    for (const i of W.on) { const d = Math.hypot(N[i][0] - k.x, N[i][1] - k.y); if (d < sd) { sd = d; s = i; } }
    if (s < 0) return null;
    const dist = new Array(n).fill(Infinity), prev = new Array(n).fill(-1), done = new Array(n).fill(false);
    dist[s] = 0;
    for (;;) {
      let u = -1;
      for (const i of W.on) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
      if (u < 0 || u === t) break;
      done[u] = true;
      for (const [v, L] of W.adj[u]) if (dist[u] + L < dist[v]) { dist[v] = dist[u] + L; prev[v] = u; }
    }
    if (dist[t] === Infinity) return null;
    let out = [];
    if (sd > 1.5) {   // 길에서 떨어져 있으면(교문으로 들어올 때, 행사가 끝난 뒤 등) 가장 가까운 길 점까지 먼저 가요
      const lead = navRoute(k.x, k.y, N[s][0], N[s][1]);
      if (lead === null) return null;
      out = lead.concat([[N[s][0], N[s][1]]]);
    }
    const hops = []; for (let u = t; u !== s; u = prev[u]) hops.unshift(u);
    for (const u of hops) out.push([N[u][0], N[u][1]]);
    return out;
  }
  function planRoute(k) {
    k.rx = k.tx; k.ry = k.ty;
    if (k.pw && k.pw[0] === k.tx && k.pw[1] === k.ty) { const w = pathRoute(k); if (w) { k.route = w; return; } }   // 4.4.1 평소에는 길로만
    const r = navRoute(k.x, k.y, k.tx, k.ty);
    k.route = r || [];
    if (r) return;
    // 갈 길이 없어요: 버스에 타는 친구는 그 자리에서 타고, 다른 친구는 살짝 사라졌다가 갈 곳에 나타나요
    k.x = k.tx; k.y = k.ty;
    if (k.board) { k.gone = true; k.g.style.opacity = '0'; }
    else if (k.g.animate) k.g.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500 });
  }
  function pickTarget(k) {
    const SP = geo().spots;
    let i;
    const nav = navInfo(), vb = vdBlock();
    for (let t = 0; t < 12; t++) { i = Math.floor(Math.random() * SP.length); if ((i !== k.spot || SP.length < 2) && !(vb && inBlock(vb, SP[i][0], SP[i][1], 2))) break; }   // 3.0.0 기념물 자리에 선 자리는 피해요
    const W = pathInfo();
    if (W.on.length > 1) {   // 4.4.1 길 자료가 있는 지도에서는 모든 길 점 가운데 하나를 골라 길 위에 서요(길 폭 안에서 조금 흩어져요)
      let j = W.on[Math.floor(Math.random() * W.on.length)];
      if (j === k.pn) j = W.on[(W.on.indexOf(j) + 1) % W.on.length];
      k.pn = j; k.spot = i;
      k.tx = W.N[j][0] + rand(-2, 2); k.ty = W.N[j][1] + rand(-1.5, 1.5);
      k.pw = [k.tx, k.ty];   // 이 갈 곳은 평소 걷기라서 길로 가요
      return;
    }
    k.spot = i;
    // 자리 둘레로 조금씩 흩어져 서요. 흩어진 곳이 건물이나 분수에 닿으면 자리 한가운데에 서요
    const x = SP[i][0] + rand(-7, 7), y = SP[i][1] + rand(-5, 5), ok = !nav.blocks.some(b => inBlock(b, x, y));
    k.tx = ok ? x : SP[i][0];
    k.ty = ok ? y : SP[i][1];
    k.pw = null;
  }
  function placeKid(k, bob) {
    const tf = `translate(${k.x.toFixed(1)} ${(k.y + bob).toFixed(1)}) scale(${geo().campus ? 0.72 : 1.1})`;   // 4.0.0 캠퍼스 지도는 건물이 작게 그려져 있어 학생도 작게
    if (k.tf === tf) return;   // 3.2.6 끊김: 서 있는 학생은 같은 값을 다시 쓰지 않아요(지도 전체를 다시 그리게 돼서)
    k.tf = tf; k.g.setAttribute('transform', tf);
  }
  // 같은 종류가 가장 많이 겹친 학생의 자리(뒤쪽부터). 겹치는 학생이 없으면 -1
  function kidDupIdx(strict) {
    const n = {}; rt.kids.forEach(k => { n[k.sp] = (n[k.sp] || 0) + 1; });
    let best = -1, bn = 1;
    for (let i = rt.kids.length - 1; i >= 0; i--) { const c = n[rt.kids[i].sp]; if (c > bn) { bn = c; best = i; } }
    return best >= 0 ? best : strict ? -1 : rt.kids.length - 1;
  }
  function addKid(fromGate, want) {
    const list = speciesList();
    // 2.3.1 아직 지도에 없는 종류를 먼저, 다 있으면 가장 적은 종류
    const n = {}; rt.kids.forEach(k => { n[k.sp] = (n[k.sp] || 0) + 1; });
    let sp = want && list.includes(want) ? want : null;
    if (!sp) { let min = Infinity; for (let j = 0; j < list.length; j++) { const c = list[(rt.kidSeq + j) % list.length], v = n[c] || 0; if (v < min) { min = v; sp = c; } } }
    const bag = Math.floor(rt.kidSeq / list.length) % 3;
    rt.kidSeq++;
    dexMeet(sp);   // 1.7.0 도감
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'kid');
    const rare = rareGot(sp) && Math.random() < RARE.walk;   // 2.1.3 반짝 친구는 그 종 학생 가운데 가끔
    g.innerHTML = kidSVG(rare ? sp + '_rare' : sp, bag);
    layerKids.appendChild(g);
    const k = { g, sp, bag, rare, x: 0, y: 0, tx: 0, ty: 0, spot: -1, wait: rand(0, 2), speed: rand(14, 22), phase: rand(0, 6), moving: false };
    pickTarget(k);
    if (fromGate && !rt.reduced) { const [gx, gy] = geo().gate; k.x = gx + rand(-8, 8); k.y = gy; k.wait = 0; }
    else { k.x = k.tx; k.y = k.ty; pickTarget(k); }
    placeKid(k, 0);
    rt.kids.push(k);
  }
  // 2.3.1 woodani 결정: 지도 학생은 만난 종류가 모두 한 번씩 보이게. 만난 종류가 16종보다 많으면 그만큼 더 걸어 다녀요(학생 수 안에서).
  // 줄일 때는 같은 종류가 겹친 학생부터 빼요. 새 친구가 오면 겹치는 학생 하나를 그 친구로 바꿔요
  // 5.0.4 woodani 요청: 대학교와 대학원은 학생이 구역에 나뉘어 있어요(예전에는 구역마다 모든 학생이 다 보였어요). 좁은 체육 구역은 몫이 작아요. 몫은 제안값
  const ZONE_KID_W = { academic: 1.2, life: 1.2, plaza: 1, sports: 0.7, lab: 1 };
  function zoneKids(total) {
    const z = geo().zone; if (!z || !uniOn() || rt.fest) return total;   // 광장 행사 동안은 모두 모여요
    const sum = ZONE_KEYS.filter(zoneOpen).reduce((a, k) => a + (ZONE_KID_W[k] || 1), 0);
    return Math.max(rt.busHold || 0, Math.min(total, Math.max(2, Math.round(total * (ZONE_KID_W[z] || 1) / sum))));
  }
  function syncKids(initial) {
    const list = speciesList();
    // 3.2.5 체험학습 출발 장면 동안은 떠날 친구(rt.busHold명)가 버스에 탈 때까지 지도에 남아 있어요
    let want = Math.max(0, Math.min(Math.max(CFG.maxKids, list.length), Math.floor(S.students)) - Math.max(0, (S.trip.kids || 0) - (rt.busHold || 0)));
    if (geo().campus) want = Math.min(want, 6);   // 4.0.0 캠퍼스 지도에는 몇 명만 걸어요
    else want = zoneKids(want);   // 5.0.4 구역 지도에는 그 구역 몫만
    if (!rt.kids.length && geo().zone && uniOn()) rt.kidSeq = ZONE_KEYS.indexOf(geo().zone) * 5;   // 구역마다 다른 친구부터 나와요
    while (rt.kids.length < want) addKid(!initial);
    while (rt.kids.length > want) { const i = kidDupIdx(); const k = rt.kids.splice(i, 1)[0]; k.g.remove(); }
    if (rt.kidSpN !== list.length) {
      rt.kidSpN = list.length;
      for (const sp of list) {
        if (rt.kids.some(k => k.sp === sp) || !rt.kids.length || rt.kids.length < Math.min(list.length, want)) continue;
        const i = kidDupIdx(true); if (i < 0) break;
        const k = rt.kids.splice(i, 1)[0]; k.g.remove(); addKid(true, sp);
      }
    }
    rt.elBadgeT = '';   // 2.0.1 반장 배지는 다음 틱에 다시 달아요
  }
  function updateKids(dt, now) {
    if (rt.reduced) return;
    const away = kidsAway();   // 3.1.1 고등학교 밤에는 학생층이 숨어 있어서 걷기 계산만 하고 그리기(매 프레임 16명 setAttribute)와 줄 세우기는 쉬어요
    for (const k of rt.kids) {
      if (k.frz) continue;   // 3.2.6 체험학습 장면 동안 장면에 나오지 않는 친구는 잠깐 멈춰요(busScene)
      if (k.wait > 0) { k.wait -= dt; k.moving = false; }
      else {
        // 운동회 달리기(k.ang)는 운동장 트랙을 그대로 돌고, 그 밖에는 막힌 곳을 돌아서 가요
        if (k.ang === undefined && (k.rx !== k.tx || k.ry !== k.ty)) planRoute(k);
        const wp = k.ang === undefined && k.route && k.route.length ? k.route[0] : null;
        const dx = (wp ? wp[0] : k.tx) - k.x, dy = (wp ? wp[1] : k.ty) - k.y, d = Math.hypot(dx, dy);
        if (wp && d < 0.8) { k.route.shift(); k.moving = true; }
        else if (d < 0.8) { k.moving = false; if (k.propU) tripProp(k); if (!k.board && !k.hold && !k.rider && k.ang === undefined) { k.wait = rand(1, 4.5); pickTarget(k); } }
        else { const st = Math.min(d, k.speed * dt); k.x += dx / d * st; k.y += dy / d * st; k.moving = true; }
      }
      if (!away) placeKid(k, k.moving ? -Math.abs(Math.sin(now / 110 + k.phase)) * 1.6 : k.hold ? -Math.abs(Math.sin(now / 260 + k.cheer)) * 2.4 : 0);
    }
    if (away) { rt.kidsAway = true; return; }
    if (rt.kidsAway) { rt.kidsAway = false; rt.kids.forEach(k => placeKid(k, 0)); }   // 아침 6시에 다시 보일 때 지금 자리로
    rt.sortT += dt;
    if (rt.sortT > 0.5) {
      rt.sortT = 0;
      // 3.2.6 끊김: 예전에는 순서가 그대로여도 0.5초마다 학생 그림을 모두 빼서 다시 넣었어요(화면 배치를 다시 셈). 순서가 바뀐 때만 옮겨요
      const ord = rt.kids.slice().sort((a, b) => a.y - b.y);
      // 4.1.2 woodani 제보: 학예회 무대, 조명 그늘, 환영회 줄 장식(.kfloor)은 학생 층 맨 아래에 있어요. 학생은 그 뒤부터 줄 세워요(전에는 맨 앞에 끼워 넣어 무대가 학생을 가렸어요)
      const fl = layerKids.querySelectorAll(':scope > .kfloor'), floor = fl.length ? fl[fl.length - 1] : null;
      let prev = null;
      for (const k of ord) { const want = prev ? prev.g.nextSibling : floor ? floor.nextSibling : layerKids.firstChild; if (k.g !== want) layerKids.insertBefore(k.g, want); prev = k; }
    }
  }

  /* ---------- 도토리 떨어지기 ---------- */
  function shakeOak() {
    const c = $('#oakCanopy');
    c.classList.remove('shake'); void c.getBBox(); c.classList.add('shake');
    // 2.3.1 woodani: 참나무를 흔들 때 곰 선생님이 같이 뛰던 것(어색해서) 뺌
  }
  // 떨어질 자리: 이미 떨어진 도토리와 겹치지 않게 몇 군데 골라 보고 가장 떨어진 곳에 놓아요
  // near: 참나무를 눌러 떨어뜨린 도토리는 나무 가까이에 떨어져요
  function dropSpot(near) {
    let best = null, bestD = -1;
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random());
      // 1.5.5: 숲속 운동회 동안에는 운동장 트랙 안 잔디에 떨어져요 (평소에는 광장)
      const [ox, oy] = geo().oak, [dcx, dcy, drx, dry] = rt.sports ? [SPORTS.cx, SPORTS.cy, SPORTS.rx * 0.55, SPORTS.ry * 0.5] : geo().drop;
      const MO = near && mapOak(), md = MO && MO.drop[Math.floor(Math.random() * MO.drop.length)];   // 3.3.4 지도 참나무는 정해 둔 풀밭 자리 둘레에 떨어져요
      const x = md ? md[0] + Math.cos(a) * 7 * r : near ? ox + (ox < 180 ? 36 : -36) + Math.cos(a) * 26 * r : dcx + Math.cos(a) * drx * r;
      const y = md ? md[1] + Math.sin(a) * 4 * r : near ? oy + 18 + Math.sin(a) * 12 * r : dcy + Math.sin(a) * dry * r;
      const d = rt.drops.reduce((m, o) => Math.min(m, Math.hypot(o.x - x, o.y - y)), 99);
      if (d > bestD) { bestD = d; best = [x, y]; }
      if (d >= 26) break;
    }
    // 위쪽 UI와 아래 탭 막대에 가려지지 않는 곳으로 옮겨요
    const v = visMap();
    if (v) { best[0] = Math.min(v[2] - 14, Math.max(v[0] + 14, best[0])); best[1] = Math.min(v[3] - 14, Math.max(v[1] + 14, best[1])); }
    return best;
  }
  function spawnDrop(near) {
    const [x, y] = dropSpot(near && !rt.sports);   // 운동회 중에는 참나무를 눌러도 공이 트랙 안에 와요
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'drop');
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', '떨어진 도토리 줍기');
    g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    const ball = rt.sports && IMG('fest_ball_blue') ? festArtSvg('fest_ball_blue', 17) : '';   // 1.7.1 운동회 중에는 청팀 공이 굴러와요
    g.innerHTML = `<circle r="18" class="drop-hit"/><circle r="13" class="drop-ring"/><ellipse cx="0" cy="9" rx="6" ry="1.8" class="c-shadow"/><g class="drop-bob"><g class="drop-fall">${ball || `<g transform="scale(${IMG0('ic_acorn') ? 1.6 : 1.3})" filter="url(#nutLine)">${ACORN}</g>`}</g></g>`;
    layerFx.appendChild(g);
    const d = { g, x, y, born: performance.now(), dead: false };
    g.addEventListener('click', e => { e.stopPropagation(); collect(d); });
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); collect(d); } });
    rt.drops.push(d);
    const fall = g.querySelector('.drop-fall');
    if (rt.sports) {   // 운동회 공은 참나무에서 떨어지지 않고 트랙 바깥에서 통통 튀며 굴러 들어와요(나무도 흔들지 않아요)
      if (!rt.reduced && fall.animate) {
        const dx = (x < SPORTS.cx ? -1 : 1) * rand(70, 110);
        fall.animate([
          { transform: `translate(${dx}px, 0px) rotate(${dx > 0 ? 300 : -300}deg)` },
          { transform: `translate(${dx * 0.5}px, -10px) rotate(${dx > 0 ? 150 : -150}deg)`, offset: 0.4 },
          { transform: `translate(${dx * 0.18}px, 0px) rotate(${dx > 0 ? 50 : -50}deg)`, offset: 0.75 },
          { transform: `translate(${dx * 0.06}px, -3px) rotate(${dx > 0 ? 15 : -15}deg)`, offset: 0.88 },
          { transform: 'translate(0px, 0px) rotate(0deg)' }
        ], { duration: 750, easing: 'ease-out' });
      }
      return;
    }
    if (!rt.reduced && fall.animate) {
      const oa = oakAt(), dx = oa[0] - x, dy = oa[1] - 18 - y;
      fall.animate([
        { transform: `translate(${dx}px, ${dy}px)` },
        { transform: `translate(${dx * 0.45}px, ${Math.min(dy * 0.45, -18)}px)`, offset: 0.45 },
        { transform: 'translate(0px, 0px)' }
      ], { duration: 650, easing: 'ease-in' });
    }
    shakeOak();
  }
  function tapOak() {
    if (rt.paused || rt.decoEdit || rt.fest) return;   // 3.3.1 학교 행사와 꾸미기 중에는 참나무를 흔들지 않아요(운동회는 공 놀이라 그대로)
    shakeOak(); sfx('leaf');
    if (S.f.playground < 1) { oakHint(`${eul(FAC.playground.name)} 지으면 참나무 도토리를 주울 수 있어요`); return; }
    if (S.oak < 1) { oakHint(`참나무가 도토리를 다시 맺는 중이에요. ${Math.ceil((1 - S.oak) * OAK.regen)}초만 기다려요`); return; }
    if (rt.drops.length >= OAK.ground) { oakHint('떨어진 도토리를 먼저 주워 주세요'); return; }
    S.oak -= 1; S.st.shakes += 1;
    spawnDrop(true);
    renderOak();
  }
  function oakHint(msg) {
    const now = Date.now();
    if (now - rt.oakHintAt > 2500) { rt.oakHintAt = now; toast(msg); }
  }
  // 나무에 달린 도토리 수만큼 열매를 보여 줘요 (여섯 자리)
  function renderOak() {
    const n = S.f.playground >= 1 ? Math.min(6, Math.ceil(S.oak * 6 / OAK.max - 1e-9)) : 0;
    if (rt.oakN === n) return;
    rt.oakN = n;
    $$('.oak-nut').forEach((c, i) => c.classList.toggle('off', i >= n));
    $('#oak').setAttribute('aria-label', S.f.playground >= 1 ? `참나무 흔들기, 도토리가 ${Math.floor(S.oak)}개 달려 있어요` : '참나무');
  }
  function removeDrop(d) {
    d.dead = true;
    rt.drops = rt.drops.filter(x => x !== d);
    d.g.style.pointerEvents = 'none';
    if (!rt.reduced && d.g.animate) d.g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180 }).onfinish = () => d.g.remove();
    else d.g.remove();
  }
  function collect(d) {
    if (d.dead || rt.paused) return;
    const v = dropValue();
    S.budget += v; earn(v);
    S.st.picks += 1;
    if (rt.sports) { rt.sports.blue += 1; feverCombo(rt.sports, d.x, d.y); renderSportsBar(); }
    floatText(d.x, d.y - 12, '+' + fmt(v), 'gold');
    sfx('coin'); buzz(12);
    removeDrop(d);
    renderHUD(); renderAffordance();
  }
  function updateDrops(now) {
    for (const d of rt.drops.slice()) {
      const age = now - d.born;
      if (autoOn() && age > 700) { collect(d); continue; }   // 자동 줍기 부스터
      if (age > CFG.dropLife) removeDrop(d);
      else if (age > CFG.dropLife - 3000 && !d.g.classList.contains('blink')) d.g.classList.add('blink');
    }
  }
  function clearDrops() { rt.drops.forEach(d => d.g.remove()); rt.drops = []; }

  /* ---------- 학생이 말을 걸어요 ---------- */
  // 가끔 학생 머리 위에 느낌표가 떠요. 누르면 학생이 한마디 하고 도토리를 줘요 (떨어진 도토리 두 개 값)
  const TALK = { every: [25, 45], life: 20, show: 3.2 };
  const TALK_LINES = [
    '교장 선생님, 안녕하세요!', '오늘 급식 맛있었어요!', '도토리 주웠어요. 드릴게요!', '숙제 다 했어요!',
    '선생님이 칭찬해 주셨어요!', '운동장에서 놀고 싶어요!', '어제 책 한 권 다 읽었어요!', '우리 학교가 제일 좋아요!',
    '친구랑 화해했어요!', '내일도 일찍 올게요!', '받아쓰기 100점 받았어요!', '교장 선생님 최고예요!',
    '참나무에 도토리가 많아요!', '이거 길에서 주웠어요!', '오늘 발표 잘했어요!', '청소 깨끗이 했어요!'];
  // 4.1.1 woodani 결정(2026-11-12): 학생 말풍선은 학교급 나이에 맞게(유치원과 초등학교는 예전 글, 중학교, 고등학교, 대학교는 따로)
  const TALK_TIER = { 2: ['안녕하세요, 교장 선생님.', '오늘 급식 두 번 받았어요.', '수행평가 내일까지래요…', '동아리 시간만 기다려요.', '쉬는 시간이 너무 짧아요.', '체육복 또 놓고 왔어요.', '시험 범위가 왜 이렇게 넓어요?', '매점 줄이 교문까지예요.', '친구랑 화해했어요.', '키가 또 컸어요!', '이거 주웠어요. 드릴게요.', '우리 학교가 제일 나아요.'], 3: ['안녕하세요, 교장 선생님.', '모의고사 봤어요. 묻지 마세요.', '야자 끝나고 본 별이 예뻤어요.', '급식이 하루의 낙이에요.', '기숙사 점호 시간이에요.', '졸려요… 십 분만요.', '진로 상담 받고 왔어요.', '수학여행 언제 가요?', '친구가 문제집을 빌려줬어요.', '이거 주웠어요. 드릴게요.', '커피 우유로 버텨요.', '졸업하면 꼭 놀러 올게요.'], 4: ['안녕하세요, 총장님.', '과제가 세 개 겹쳤어요.', '공강이라 잔디밭에 누워 있었어요.', '학생 식당 오늘 메뉴 괜찮아요.', '조별 과제 조원이 연락이 안 돼요.', '수강 신청에 성공했어요!', '도서관 자리 맡아 놨어요.', '축제 언제 해요?', '교수님이 제 이름을 외우셨어요.', '이거 주웠어요. 드릴게요.', '아르바이트 가는 길이에요.', '이 학교 오길 잘했어요.'] };
  const talkLines = () => TALK_TIER[S.tier] || TALK_LINES;
  const talkValue = () => dropValue() * 2;
  /* ---------- 시련: 뱀이나 매가 학교에 와요 ----------
     1장을 마친 뒤 가끔(12~25분마다) 나타나요. 20초 안에 여러 번 눌러서 쫓아내면 상품, 못 쫓아내면 도토리를 조금 물고 가요.
     곰 선생님이 함께 막아 줘서 곰 선생님 레벨이 높을수록 덜 눌러도 돼요 */
  const TRIAL = { every: [720, 1500], first: 360, time: 20, win: 8, lose: 5, hunt: [20, 40], huntFirst: 3 };
  // 1.7.4 메인 퀘스트 '침입자 쫓아내기'를 하는 동안: 퀘스트가 나오면 3초 뒤 바로, 그 뒤로도 20~40초마다 와요
  const trialHunt = () => { const q = curMain(); return !!q && q.t === 'trials' && !mainReady(); };
  // 1.7.1 지도에 오는 뱀, 매, 까치도 도감 그림으로 그려요(그림이 없으면 예전 도형)
  const guestArt = kind => { const u = IMG170('chr_' + kind); if (!u) return kind === 'snake' ? SNAKE : kind === 'hawk' ? HAWK : MAGPIE;
    const w = kind === 'magpie' ? 40 : 38; return `<g class="tr-body"><image href="${u}" x="${-w / 2}" y="${-w / 2}" width="${w}" height="${w}"/></g>`; };
  const SNAKE = '<g class="tr-body"><path d="M-22 6 Q-14 -2 -6 6 T10 6 T22 2" fill="none" stroke="#5E8C3A" stroke-width="7" stroke-linecap="round"/><path d="M-22 6 Q-14 -2 -6 6 T10 6 T22 2" fill="none" stroke="#8DBE5A" stroke-width="2.4" stroke-dasharray="2 4" stroke-linecap="round"/>' +
    '<ellipse cx="25" cy="0" rx="7" ry="5.5" fill="#5E8C3A"/><circle cx="27" cy="-2" r="1.6" fill="#FFF6C0"/><circle cx="27.4" cy="-2" r=".8" fill="#2A2520"/><path d="M31 1 l4 -1 M31 1 l4 2" stroke="#D9534A" stroke-width="1" stroke-linecap="round"/></g>';
  const HAWK = '<g class="tr-body"><path d="M0 0 Q-14 -14 -30 -6 Q-16 -4 -6 4 Z M0 0 Q14 -14 30 -6 Q16 -4 6 4 Z" fill="#8A5D3B" stroke="#5E3F22" stroke-width="1"/><ellipse cx="0" cy="4" rx="6" ry="9" fill="#A97A4E"/>' +
    '<circle cx="0" cy="-6" r="5" fill="#F3E3C7"/><circle cx="-1.8" cy="-7" r="1" fill="#2A2520"/><circle cx="1.8" cy="-7" r="1" fill="#2A2520"/><path d="M-1.6 -4.4 L0 -1.6 L1.6 -4.4 Z" fill="#E7A92A"/><path d="M-4 12 l2 4 M4 12 l-2 4" stroke="#E7A92A" stroke-width="1.4" stroke-linecap="round"/></g>';
  const trialOpen = () => S.q.m >= CH1() || S.st.grads > 0 || S.tier > 0;
  const trialNeed = () => Math.max(6, 14 - Math.floor(S.t.bear / 3));
  /* 2.3.1 뱀과 매 침입자 액션(작업지시서 44 그림, woodani 확인한 시안 '침입자 액션 시안'):
     뱀은 꿈틀대며 기어 오고(두 자세 번갈아) 멈추면 혀를 날름, 매는 그림자가 먼저 지나간 뒤 내려와 날갯짓하며 빙빙 돌아요.
     누르면 놀란 그림으로 바뀌고 빨갛게 번쩍, 뱀은 뒤로 밀려나고 풀잎, 매는 깃털이 흩날려요. 빠르게 누르면 '퍽! ×n'.
     체력이 반이면 화나서 빨라지고 매는 한 번 급강하. 쫓아내면 뱀은 굴러 도망, 매는 날아가고 곰 선생님이 '이겼다!'. 못 쫓아내면 도토리를 물고 사라져요.
     다니는 길은 지금 화면에서 보이는 안전한 칸 안(위쪽 칸, 아래 탭, 왼쪽과 오른쪽 단추 줄, 아래 칩을 피해요). 그림이 없으면 예전 그림(chr_snake, chr_hawk) */
  const TRL = { snake: { sp: 26, angry: 2, frame: 0.22 }, hawk: { spA: 1.3, frame: 0.18 }, hurt: 0.28, kb: 18, combo: 0.55 };
  const trlImg = k => IMG(k) || '';
  function trialSafe() {
    const v = visMap(), fr = $('.frame');
    let [x0, y0, x1, y1] = v || [20, 40, 340, 420];
    if (fr && rt.mapS) {
      const fb = fr.getBoundingClientRect(), sc = rt.mapS;
      let left = 0, right = fb.width, bottom = fb.height;
      for (const el of $$('#btnTrip, #btnSports, #btnHall, .boost:not([hidden])')) { if (el.hidden || !el.offsetParent) continue; const q = el.getBoundingClientRect(); if (q.left - fb.left < fb.width / 2) left = Math.max(left, q.right - fb.left); }
      for (const el of $$('#ffChip, #upChip, #plChip, #tierDots')) { if (el.hidden || !el.offsetParent) continue; const q = el.getBoundingClientRect(); bottom = Math.min(bottom, q.top - fb.top); }
      x0 = Math.max(x0, x0 + (left + 8) / sc); y1 = Math.min(y1, y0 + (bottom - (rt.hudTop || 0) - 8) / sc);
      x1 = Math.min(x1, x0 + (right - left - (rt.hudRight || 0) - 16) / sc);
    }
    const pad = 26; x0 += pad; x1 -= pad; y0 += pad + 14; y1 -= pad;
    if (x1 - x0 < 60) { const c = (x0 + x1) / 2; x0 = c - 30; x1 = c + 30; }
    if (y1 - y0 < 60) { const c = (y0 + y1) / 2; y0 = c - 30; y1 = c + 30; }
    return [x0, y0, x1, y1];
  }
  function trlBurst(x, y, key, n) {
    const u = trlImg(key); if (!u || rt.reduced) return;
    for (let i = 0; i < n; i++) {
      const im = document.createElementNS(NS, 'image'); im.setAttribute('href', u); im.setAttribute('x', x - 6); im.setAttribute('y', y - 6); im.setAttribute('width', 12); im.setAttribute('height', 12);
      im.setAttribute('class', 'trl-part'); layerFx.appendChild(im);
      const a = Math.random() * Math.PI * 2, d = 14 + Math.random() * 18, rr = (Math.random() - 0.5) * 540;
      if (im.animate) im.animate([{ transform: 'translate(0px,0px) rotate(0deg)', opacity: 1 }, { transform: `translate(${(Math.cos(a) * d).toFixed(1)}px,${(Math.sin(a) * d + 14).toFixed(1)}px) rotate(${rr.toFixed(0)}deg)`, opacity: 0 }], { duration: 750 + Math.random() * 350, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => im.remove();
      else setTimeout(() => im.remove(), 800);
    }
  }
  function trlSet(T, key) {
    const k = trlImg(key) ? key : '';
    if (!k || T.cur === k) return; T.cur = k; T.im.setAttribute('href', trlImg(k));
  }
  function updateTrial(dt) {
    const T = rt.trial;
    if (T) {
      if (T.out) return;
      T.left -= dt; T.hurt = Math.max(0, T.hurt - dt); T.ft += dt;
      const S0 = T.safe = (T.safeT = (T.safeT || 0) - dt) > 0 ? T.safe : (T.safeT = 1, trialSafe());
      const [x0, y0, x1, y1] = S0;
      if (T.kind === 'snake') {
        const sp = TRL.snake.sp * (T.angry ? TRL.snake.angry : 1);
        if (T.kb > 0) { T.x -= T.dir * T.kb * dt * 10; T.kb = Math.max(0, T.kb - dt * 120); }
        if (T.tongue > 0) T.tongue -= dt;
        else {
          const dx = T.goal - T.x;
          if (Math.abs(dx) < 3) { T.tongue = T.angry ? 0.25 : 0.8; T.goal = T.x > (x0 + x1) / 2 ? x0 + (x1 - x0) * (0.05 + Math.random() * 0.25) : x0 + (x1 - x0) * (0.7 + Math.random() * 0.25); }
          else { T.dir = Math.sign(dx); T.x += T.dir * Math.min(Math.abs(dx), sp * dt); }
        }
        if (T.x < x1) T.inside = true;
        if (T.inside) T.x = Math.min(x1, Math.max(x0, T.x));
        T.y += (Math.min(y1, Math.max(y0, T.y)) - T.y) * Math.min(1, dt * 2);
        if (T.ft > TRL.snake.frame / (T.angry ? 1.7 : 1)) { T.ft = 0; T.fr ^= 1; }
        trlSet(T, T.hurt > 0 ? 'trl_snake_hurt' : T.tongue > 0 && !T.angry ? 'trl_snake_tongue' : T.angry && T.fr ? 'trl_snake_angry' : T.fr ? 'trl_snake_move_1' : 'trl_snake_move_2');
        T.g.setAttribute('transform', `translate(${T.x.toFixed(1)} ${T.y.toFixed(1)})`);
        T.body.setAttribute('transform', `scale(${T.dir > 0 ? 1 : -1} 1)`);
      } else {
        T.t += dt;
        const cx = (x0 + x1) / 2, cy = y0 + (y1 - y0) * 0.38, rx = (x1 - x0) * 0.32, ry = Math.min(30, (y1 - y0) * 0.1);
        if (T.st === 'shadow') {
          const p = Math.min(1, T.t / 0.8); T.g.setAttribute('transform', 'translate(-999 -999)');
          if (T.sh) T.sh.setAttribute('transform', `translate(${(x0 - 60 + p * (x1 - x0 + 120)).toFixed(1)} ${(cy + 60).toFixed(1)})`);
          if (p >= 1) { if (T.sh) T.sh.remove(); T.st = 'drop'; T.t = 0; }
        } else if (T.st === 'drop') { const p = Math.min(1, T.t / 0.8); T.x = cx; T.y = y0 - 80 + (cy - ry - y0 + 80) * (1 - Math.pow(1 - p, 3)); if (p >= 1) { T.st = 'fly'; T.a = -Math.PI / 2; } }
        else if (T.st === 'fly') { T.a += dt * TRL.hawk.spA * (T.angry ? 1.8 : 1); T.x = cx + Math.cos(T.a) * rx; T.y = cy + Math.sin(T.a * 2) * ry; }
        else if (T.st === 'dive') { T.dv += dt; const p = Math.min(1, T.dv / 0.9), s = Math.sin(p * Math.PI); T.x = T.dx0 + (cx - T.dx0) * s; T.y = T.dy0 + (y1 - T.dy0 - 20) * s; if (p >= 1) T.st = 'fly'; }
        if (T.ft > TRL.hawk.frame / (T.angry ? 1.6 : 1)) { T.ft = 0; T.fr ^= 1; }
        if (T.st !== 'shadow') {
          trlSet(T, T.hurt > 0 ? 'trl_hawk_hurt' : T.st === 'dive' ? 'trl_hawk_dive' : T.fr ? 'trl_hawk_up' : 'trl_hawk_down');
          T.g.setAttribute('transform', `translate(${T.x.toFixed(1)} ${T.y.toFixed(1)}) rotate(${T.st === 'fly' ? (Math.cos(T.a) * -10).toFixed(1) : 0})`);
        }
      }
      const sec = Math.max(0, Math.ceil(T.left));
      if (T.secShown !== sec) { T.secShown = sec; T.g.querySelector('.tr-sec').textContent = sec + '초'; }
      if (T.left <= 0) endTrial(false);
      return;
    }
    if (!trialOpen() || rt.tab !== 'school' || rt.modalOpen || festBusy() || rt.paused) return;
    const hunt = trialHunt();
    if (rt.trialT === undefined) rt.trialT = hunt ? TRIAL.huntFirst : TRIAL.first;
    if (hunt && rt.trialT > TRIAL.hunt[1]) rt.trialT = TRIAL.huntFirst;
    if (!hunt && rt.trialWasHunt) rt.trialT = rand(TRIAL.every[0], TRIAL.every[1]);   // 퀘스트를 마치면 다시 드문드문
    rt.trialWasHunt = hunt;
    rt.trialT -= dt;
    if (rt.trialT > 0) return;
    rt.trialT = hunt ? rand(TRIAL.hunt[0], TRIAL.hunt[1]) : rand(TRIAL.every[0], TRIAL.every[1]);
    startTrial(Math.random() < 0.5 ? 'snake' : 'hawk');
  }
  function startTrial(kind) {
    if (rt.trial) return;
    dexMeet('g_' + kind);   // 1.7.0 도감 특별 손님
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'trial ' + kind);
    g.setAttribute('role', 'button'); g.setAttribute('tabindex', '0');
    const nm = kind === 'snake' ? '뱀' : '매';
    g.setAttribute('aria-label', `${iga(nm)} 나타났어요. 여러 번 눌러서 쫓아내요`);
    const need = trialNeed(), art = trlImg(kind === 'snake' ? 'trl_snake_move_1' : 'trl_hawk_up'), w = kind === 'snake' ? 46 : 52;
    g.innerHTML = `<circle r="34" class="tr-hit"/>` + (art ? `<g class="tr-body has-im"><g class="tr-flip"><image class="tr-im" x="${-w / 2}" y="${-w / 2}" width="${w}" height="${w}" href="${art}"/></g></g>` : `<g transform="scale(1.3)">${guestArt(kind)}</g>`) +
      `<g transform="translate(0 -30)"><rect x="-22" y="-4" width="44" height="7" rx="3.5" class="tr-hpbg"/><rect x="-21" y="-3" width="42" height="5" rx="2.5" class="tr-hp"/><text y="-8" text-anchor="middle" class="tr-sec">${TRIAL.time}초</text></g>`;
    layerFx.appendChild(g);
    const sf = trialSafe();
    const T = { kind, g, hp: need, max: need, left: TRIAL.time, a: 0, secShown: TRIAL.time, im: g.querySelector('.tr-im'), body: g.querySelector('.tr-flip'), cur: '', hurt: 0, ft: 0, fr: 0, combo: 0, lastHit: 0, kb: 0, tongue: 0, dir: -1, t: 0, safe: sf, safeT: 1 };
    if (!T.im) { T.im = document.createElementNS(NS, 'image'); T.body = document.createElementNS(NS, 'g'); }   // 그림이 없으면 예전 그림 그대로
    if (kind === 'snake') { T.x = sf[2] + 40; T.y = sf[1] + (sf[3] - sf[1]) * (0.55 + Math.random() * 0.2); T.goal = sf[0] + (sf[2] - sf[0]) * 0.45; T.st = 'walk'; }
    else {
      T.x = (sf[0] + sf[2]) / 2; T.y = sf[1] - 80; T.st = trlImg('trl_hawk_shadow') && !rt.reduced ? 'shadow' : 'drop';
      if (T.st === 'shadow') { const sh = document.createElementNS(NS, 'image'); sh.setAttribute('href', trlImg('trl_hawk_shadow')); sh.setAttribute('x', -40); sh.setAttribute('y', -40); sh.setAttribute('width', 80); sh.setAttribute('height', 80); sh.setAttribute('class', 'trl-shadow'); layerFx.insertBefore(sh, g); T.sh = sh; }
    }
    g.setAttribute('transform', `translate(${T.x.toFixed(1)} ${T.y.toFixed(1)})`);
    g.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); hitTrial(); });
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hitTrial(); } });
    rt.trial = T;
    $('.stage').classList.add('danger');   // 1.7.2 위기: 화면 테두리를 빨갛게(2.3.1 그동안 아래 칩과 새 편지는 흐리게)
    sfx('magpie');
    toast(kind === 'snake' ? '뱀이 학교로 기어 와요! 여러 번 눌러서 쫓아내요' : '매가 학교 위를 맴돌아요! 여러 번 눌러서 쫓아내요');
  }
  function hitTrial() {
    const T = rt.trial;
    if (!T || rt.paused || T.out || T.st === 'shadow') return;
    T.hp -= 1;
    sfx('tap'); buzz(8);
    const bar = T.g.querySelector('.tr-hp');
    bar.setAttribute('width', Math.max(0, 42 * T.hp / T.max).toFixed(1));
    const now = performance.now() / 1000;
    T.combo = now - T.lastHit < TRL.combo ? T.combo + 1 : 1; T.lastHit = now;
    T.hurt = TRL.hurt;
    if (T.kind === 'snake') T.kb = TRL.kb;
    T.g.classList.remove('trl-flash'); void T.g.getBBox(); T.g.classList.add('trl-flash');
    const b = T.g.querySelector('.tr-body');
    if (b && b.animate && !rt.reduced && !trlImg('trl_snake_hurt')) b.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(0)' }], { duration: 160 });
    trlBurst(T.x, T.y - 4, T.kind === 'snake' ? 'trl_fx_grass' : 'trl_fx_feather', T.kind === 'snake' ? 2 : 3);
    floatText(T.x, T.y - 34, T.combo >= 3 ? `퍽! ×${T.combo}` : '퍽!', 'gold');
    if (T.hp <= T.max / 2 && !T.angry && T.hp > 0) {
      T.angry = true; T.g.classList.add('trl-angry'); floatText(T.x, T.y - 50, '화났다!', 'combo');
      if (T.kind === 'hawk' && T.st === 'fly') { T.st = 'dive'; T.dv = 0; T.dx0 = T.x; T.dy0 = T.y; }
    }
    if (T.hp <= 0) endTrial(true);
  }
  // 이기면 곰 선생님(모셨으면)이 통통 뛰며 '이겼다!'
  function trlBearCheer() {
    const b = $('#m-bear'); if (!b || !S.t.bear) return;
    const tin = $('.tinner', b); if (tin) { tin.classList.remove('hop'); void tin.getBBox(); tin.classList.add('hop'); setTimeout(() => tin.classList.remove('hop'), 1200); }
    const m = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(b.getAttribute('transform') || ''); if (m) floatText(+m[1], +m[2] - 30, '이겼다!', 'gold');
  }
  function endTrial(win) {
    const T = rt.trial; if (!T || T.out) return;
    T.out = true;
    $('.stage').classList.remove('danger');
    if (T.sh) T.sh.remove();
    const nm = T.kind === 'snake' ? '뱀' : '매', hpBox = T.g.querySelector('.tr-hp'); if (hpBox) hpBox.parentNode.remove();
    rt.trial = null;   // 물러나는 장면은 T만 들고 움직여요(다음 침입자를 막지 않게)
    const fin = () => { T.g.remove(); };
    setTimeout(fin, 3200);   // 움직임이 끝나지 않아도(창이 숨겨졌을 때) 꼭 치워요
    const anim = (frames, ms, then) => { if (T.g.animate && !rt.reduced) T.g.animate(frames, { duration: ms, easing: 'ease-in', fill: 'forwards' }).onfinish = then; else then(); };
    const at = `translate(${T.x.toFixed(1)}px, ${T.y.toFixed(1)}px)`;
    T.g.removeAttribute('transform'); T.g.style.transform = at;
    S.st.trials = (S.st.trials || 0) + (win ? 1 : 0);
    if (rt.trialWasHunt && !trialHunt()) { rt.trialWasHunt = false; rt.trialT = rand(TRIAL.every[0], TRIAL.every[1]); }   // 2.3.1 물러나는 장면 동안에도 퀘스트를 마쳤으면 다시 드문드문
    if (win) {
      if (T.kind === 'snake') { trlSet(T, 'trl_snake_run'); anim([{ transform: `${at} rotate(0deg)` }, { transform: `translate(${(T.safe[2] + 120).toFixed(1)}px, ${(T.y + 6).toFixed(1)}px) rotate(900deg)` }], 1100, fin); }
      else { trlBurst(T.x, T.y, 'trl_fx_feather', 5); let n = 0; const fl = setInterval(() => { trlSet(T, n++ % 2 ? 'trl_hawk_up' : 'trl_hawk_down'); if (n > 14) clearInterval(fl); }, 80); anim([{ transform: at }, { transform: `translate(${(T.x + 40).toFixed(1)}px, ${(T.safe[1] - 160).toFixed(1)}px) scale(.7)` }], 1100, fin); }
      trlBearCheer();
      const v = Math.max(20, nice(rate() * 60 * TRIAL.win));
      S.budget += v; earn(v);
      setTimeout(() => showReward({ title: `${eul(nm)} 쫓아냈어요!`, sub: '학생들이 교장 선생님을 응원해요', art: `<svg viewBox="-36 -24 72 48" aria-hidden="true">${guestArt(T.kind)}</svg>`, big: `${nm}${batchim(nm) ? '과' : '와'}의 대결 승리`, items: [{ ic: 'acorn', t: `도토리 +${fmt(v)}` }] }), rt.reduced ? 0 : 900);
    } else {
      const v = Math.min(Math.floor(S.budget * 0.1), Math.floor(rate() * 60 * TRIAL.lose));
      S.budget -= Math.max(0, v);
      const ax = (T.safe[0] + T.safe[2]) / 2, ay = T.safe[1] + (T.safe[3] - T.safe[1]) * 0.7;
      if (T.kind === 'snake') { anim([{ transform: at }, { transform: `translate(${ax.toFixed(1)}px, ${ay.toFixed(1)}px)` }], 600, () => { trlSet(T, 'trl_snake_carry'); anim([{ transform: `translate(${ax.toFixed(1)}px, ${ay.toFixed(1)}px)` }, { transform: `translate(${(T.safe[2] + 120).toFixed(1)}px, ${ay.toFixed(1)}px)` }], 1300, fin); }); }
      else { trlSet(T, 'trl_hawk_dive'); anim([{ transform: at }, { transform: `translate(${ax.toFixed(1)}px, ${(ay - 16).toFixed(1)}px)` }], 600, () => { trlSet(T, 'trl_hawk_carry'); anim([{ transform: `translate(${ax.toFixed(1)}px, ${(ay - 16).toFixed(1)}px)` }, { transform: `translate(${(T.safe[2] + 100).toFixed(1)}px, ${(T.safe[1] - 140).toFixed(1)}px)` }], 1300, fin); }); }
      toast(v > 0 ? `${iga(nm)} 도토리 ${fmt(v)}개를 물고 가 버렸어요. 다음에는 꼭 쫓아내요!` : `${iga(nm)} 그냥 돌아갔어요`);
    }
    save(); renderHUD();
  }

  /* ---------- 착한 민원인: 졸업생이 선물을 들고 찾아와요 ----------
     15~30분마다 교문으로 들어와 학교 앞에 서 있어요(40초). 누르면 고맙다는 말과 함께 선물을 줘요 */
  const VISIT = { every: [900, 1800], first: 540, life: 40 };
  const VISIT_LINES = ['교장 선생님 덕분에 꿈을 이뤘어요!', '모교가 이렇게 커졌네요!', '후배들 간식 사 왔어요!', '어릴 때 그 교실이 그리워요', '저 이번에 선생님이 됐어요!'];
  function updateVisit(dt) {
    const V = rt.visit;
    if (V) {
      V.age += dt;
      if (V.y > 300) { V.y = Math.max(300, V.y - dt * 30); V.g.setAttribute('transform', `translate(${V.x} ${V.y.toFixed(1)})`); }
      if (V.age > VISIT.life) endVisit(false);
      return;
    }
    if (!trialOpen() || rt.tab !== 'school' || rt.modalOpen || festBusy() || rt.paused) return;
    if (rt.visitT === undefined) rt.visitT = VISIT.first;
    rt.visitT -= dt;
    if (rt.visitT > 0) return;
    rt.visitT = rand(VISIT.every[0], VISIT.every[1]);
    startVisit();
  }
  function startVisit() {
    dexMeet('g_alumni');   // 1.7.0 도감 특별 손님
    const list = speciesList(), sp = list[Math.floor(Math.random() * list.length)];
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'visit'); g.setAttribute('role', 'button'); g.setAttribute('tabindex', '0');
    g.setAttribute('aria-label', '졸업생이 선물을 들고 찾아왔어요. 눌러서 받기');
    g.innerHTML = `<circle r="24" cy="-4" class="talk-hit"/><g transform="scale(1.7)">${kidSVG(sp, 1, { hat: 'cap', neck: '' })}</g>` +
      `<g class="visit-gift" transform="translate(13 6) scale(1.3)"><rect x="-5" y="-4" width="10" height="8" rx="1.4" fill="#F07C7C" stroke="#8A3B3B" stroke-width=".8"/><path d="M0 -4 v8 M-5 0 h10" stroke="#FFE27A" stroke-width="1.6"/><path d="M0 -4 q-3 -4 -4 -1 M0 -4 q3 -4 4 -1" fill="none" stroke="#FFE27A" stroke-width="1.2"/></g>` +
      `<g class="talk-mark" transform="translate(0 -24)"><circle r="7" class="talk-badge"/><text y="3.6" text-anchor="middle" class="talk-ex" style="font-size:11px">♥</text></g>`;
    layerFx.appendChild(g);
    const V = { g, sp, x: 196, y: 410, age: 0 };
    g.setAttribute('transform', `translate(${V.x} ${V.y})`);
    g.addEventListener('click', e => { e.stopPropagation(); endVisit(true); });
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); endVisit(true); } });
    rt.visit = V;
    toast(S.alb && S.alb.length ? `${S.alb.length}기 졸업생이 선물을 들고 학교에 찾아왔어요!` : '졸업생이 선물을 들고 학교에 찾아왔어요!');   // 2.1.1 앨범 쪽 수가 기수
  }
  function endVisit(take) {
    const V = rt.visit; if (!V) return;
    if (take && rt.paused) return;
    rt.visit = null;
    V.g.remove();
    if (!take) return;
    const roll = Math.random(), items = [];
    if (roll < 0.15) items.push(goldOr(1));   // 4.2.0
    else if (roll < 0.4 && (S.tier > 0 || S.st.grads > 0)) { addDip(1); items.push({ ic: 'dip', t: '수료증 +1장' }); }
    else { const v = Math.max(20, nice(rate() * 60 * 10)); S.budget += v; earn(v); items.push({ ic: 'acorn', t: `도토리 +${fmt(v)}` }); }
    S.st.visits = (S.st.visits || 0) + 1;
    if (S.alb && S.alb.length) { const pg = S.alb[Math.floor(Math.random() * S.alb.length)]; pg.v = Math.min(999, (pg.v || 0) + 1); }   // 2.1.1 앨범에 발자국 도장
    showReward({ title: '졸업생이 선물을 주고 갔어요', sub: `"${VISIT_LINES[Math.floor(Math.random() * VISIT_LINES.length)]}"`, art: `<svg viewBox="-12 -16 24 30" aria-hidden="true">${kidSVG(V.sp, 1, { hat: 'cap', neck: '' })}</svg>`, big: '착한 졸업생', items });
    save(); renderHUD();
  }

  // 5.1.1.2 woodani 제보: 소풍 간 친구(지도에서 숨김)에게 '!' 말풍선이 붙어 그림 없이 '!'만 돌아다녔어요
  const kidSeen = k => !!k && !!k.g && !k.gone && k.g.style.display !== 'none';
  function updateTalk(dt) {
    const T = rt.talk;
    if (T && kidsAway()) { endTalk(); return; }   // 3.1.1 woodani 제보: 학생은 안 보이는데 '!' 말풍선만 떠 있었어요
    if (T) {
      if (T.k.g.isConnected && rt.kids.includes(T.k) && !T.k.board && kidSeen(T.k)) {
        T.age += dt;
        if (T.age > TALK.life) endTalk();
        else T.g.setAttribute('transform', `translate(${T.k.x.toFixed(1)} ${(T.k.y - 15).toFixed(1)})`);
      } else endTalk();
      return;
    }
    if (rt.tab !== 'school' || rt.modalOpen || festBusy() || kidsAway()) return;
    rt.talkT -= dt;
    if (rt.talkT > 0) return;
    rt.talkT = rand(TALK.every[0], TALK.every[1]);
    const ks = rt.kids.filter(k => !k.board && !k.hold && k.ang === undefined && kidSeen(k));
    if (ks.length) startTalk(ks[Math.floor(Math.random() * ks.length)]);
  }
  function startTalk(k) {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'talk');
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', '학생이 할 말이 있대요. 눌러서 들어 보기');
    g.innerHTML = '<circle r="16" cy="-6" class="talk-hit"/><g class="talk-mark"><circle r="9" cy="-8" class="talk-badge"/><text y="-2.6" text-anchor="middle" class="talk-ex">!</text></g>';
    layerFx.appendChild(g);
    const T = { k, g, age: 0 };
    g.setAttribute('transform', `translate(${k.x.toFixed(1)} ${(k.y - 15).toFixed(1)})`);
    g.addEventListener('click', e => { e.stopPropagation(); tapTalk(T); });
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tapTalk(T); } });
    rt.talk = T;
  }
  function endTalk() { if (rt.talk) { rt.talk.g.remove(); rt.talk = null; } }
  function tapTalk(T) {
    if (rt.talk !== T || rt.paused) return;
    endTalk();
    const k = T.k, v = talkValue();
    k.tx = k.x; k.ty = k.y; k.wait = TALK.show;   // 말하는 동안 멈춰 서요
    S.budget += v; earn(v);
    sayBubble(k.x, k.y - 16, talkLines()[Math.floor(Math.random() * talkLines().length)]);
    floatText(k.x, k.y + 22, '+' + fmt(v), 'gold');
    sfx('coin'); buzz(12);
    renderHUD(); renderAffordance();
  }
  function sayBubble(x, y, txt) {
    txt = headText(txt);
    const w = Math.ceil(txt.length * 10.4 + 16), h = 22;
    const bx = Math.max(4, Math.min(356 - w, x - w / 2)), by = Math.max(4, y - h - 8);
    const tx = Math.max(bx + 8, Math.min(bx + w - 8, x));
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'bubble');
    g.innerHTML = `<path d="M${(tx - 4).toFixed(1)} ${by + h - 1} L${tx.toFixed(1)} ${by + h + 6} L${(tx + 4).toFixed(1)} ${by + h - 1}"/>` +
      `<rect x="${bx.toFixed(1)}" y="${by}" width="${w}" height="${h}" rx="9"/>` +
      `<path d="M${(tx - 3.2).toFixed(1)} ${by + h - 0.6} H${(tx + 3.2).toFixed(1)}" style="stroke:#FFFDF5;stroke-width:2"/>` +
      `<text x="${(bx + w / 2).toFixed(1)}" y="${by + 15}" text-anchor="middle"></text>`;
    g.querySelector('text').textContent = txt;
    layerFx.appendChild(g);
    const out = () => { if (!rt.reduced && g.animate) g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250 }).onfinish = () => g.remove(); else g.remove(); };
    if (!rt.reduced && g.animate) g.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 180, easing: 'ease-out' });
    setTimeout(out, TALK.show * 1000);
  }

  function floatText(x, y, txt, cls) {
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', x.toFixed(1)); t.setAttribute('y', y.toFixed(1));
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('class', 'float' + (cls ? ' ' + cls : ''));
    t.textContent = txt;
    layerFx.appendChild(t);
    if (rt.reduced || !t.animate) { setTimeout(() => t.remove(), 1000); return; }
    t.animate([{ transform: 'translateY(0px)', opacity: 1 }, { transform: 'translateY(-24px)', opacity: 0 }],
      { duration: 1300, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => t.remove();
  }

