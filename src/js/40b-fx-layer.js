  /* ---------- 5.2.1 효과층(PixiJS, 2026-11-20 woodani 결정 '엔진 1단계': 지도 위 연출만 엔진으로) ----------
     지도(#map) 바로 위에 투명한 그림판(canvas.fxl)을 한 장 얹어 참나무 흔들림, 잎, 떨어지는 도토리, 줍기 날아가기만 그려요.
     누르기는 그림판을 통과하고(pointer-events none), 게임 규칙과 값과 저장은 그대로예요(떨어질 자리, 줍는 값, 자동 줍기 모두 예전과 같아요).
     엔진 파일(img/lib/pixi.min.js)을 못 받거나 WebGL이 없거나 '움직임 줄이기'면 예전 SVG 연출 그대로예요(fxOn() false).
     배터리: 효과가 있을 때만 그리고, 없으면 멈춰요. 학교 탭이 아니거나 화면이 꺼지면 바로 지워요 */
  const FXL = { st: '', app: null, w: null, tex: {}, parts: [], falls: [], flys: [], raf: 0, last: 0, k: 1, oak: { a: 0, v: 0, s: 1 } };
  const FXL_V = '8.23.0';
  const FXL_SRC = () => window.FS_PIXI_SRC || IMG_BASE() + 'lib/pixi.min.js?v=' + FXL_V;
  const fxOn = () => FXL.st === 'ok' && !rt.reduced && rt.tab === 'school' && !document.hidden;
  // 제안 숫자(바꿀 수 있어요): 참나무 처음 흔들림 4도, 연타 때 최대 8도, 잎 6~10장
  const FXC = { oakDeg: 4, oakMax: 8, oakW: 90, oakDamp: 6, leaves: [6, 10], g: 620, bounce: 0.36, fly: 0.7 };
  function fxLoad() {
    if (FXL.st || rt.reduced) return;
    try { const c = document.createElement('canvas'); if (!(c.getContext('webgl2') || c.getContext('webgl'))) { FXL.st = 'no'; return; } } catch (e) { FXL.st = 'no'; return; }
    FXL.st = 'load';
    const s = document.createElement('script'); s.src = FXL_SRC(); s.async = true;
    s.onload = () => fxInit().catch(() => { FXL.st = 'no'; });
    s.onerror = () => { FXL.st = 'no'; };
    document.head.appendChild(s);
  }
  async function fxInit() {
    const fr = $('.frame'); if (!fr || !window.PIXI || !window.PIXI.Application) { FXL.st = 'no'; return; }
    const P = window.PIXI, app = new P.Application();
    await app.init({ width: Math.max(1, fr.clientWidth), height: Math.max(1, fr.clientHeight), backgroundAlpha: 0, antialias: true, resolution: Math.min(2, window.devicePixelRatio || 1), autoDensity: true, autoStart: false, sharedTicker: false, preference: 'webgl' });
    app.ticker.stop();
    const cv = app.canvas; cv.className = 'fxl'; cv.setAttribute('aria-hidden', 'true'); $('#map').after(cv);
    FXL.app = app; FXL.w = new P.Container(); app.stage.addChild(FXL.w);
    const tx = k => new Promise(r => { const u = IMG(k); if (!u) { r(null); return; } const im = new Image(); im.onload = () => { try { r(P.Texture.from(im)); } catch (e) { r(null); } }; im.onerror = () => r(null); im.src = u; });
    for (const k of ['ic_acorn', 'fx_leaf_1', 'fx_leaf_2', 'fx_leaf_3', 'fx_dust_1']) FXL.tex[k] = await tx(k);
    FXL.tex.star = app.renderer.generateTexture(new P.Graphics().star(0, 0, 4, 8, 3).fill(0xffffff));
    FXL.tex.dot = app.renderer.generateTexture(new P.Graphics().circle(0, 0, 4).fill(0xffffff));
    if (!FXL.tex.ic_acorn) { FXL.st = 'no'; cv.remove(); return; }
    FXL.st = 'ok';
    setTimeout(() => { try { ['fxe_conf_1', 'fxe_conf_2', 'fxe_conf_3', 'fxe_conf_4', 'fxe_bit', 'fxe_spark', 'fxe_cap', 'fxe_tape_l', 'fxe_tape_r', 'fxe_beam', 'fxe_petal_1', 'fxe_petal_2', 'fxe_petal_3', 'tr_leaf_2'].forEach(fxeTex); } catch (e) { /* 없으면 코드 모양 */ } }, 2000);   // 행사 그림(작업지시서 103) 미리 받기
  }
  const fxRnd = (a, b) => a + Math.random() * (b - a);   // 반짝이는 보통 섞기로 그려요(그림판 바탕이 투명이라 더하기 섞기는 거의 안 보여요)
  // 화면 자리(px) ↔ 지도 자리. 지도는 viewBox 0 -60 360 540이라 왼쪽 위가 (0, -60)
  function fxMapPt(cx, cy) { const R = $('#map').getBoundingClientRect(), k = R.width / 360 || 1; return [(cx - R.left) / k, (cy - R.top) / k - 60]; }
  function fxKick() { if (FXL.st === 'ok' && !FXL.raf) { FXL.last = performance.now(); FXL.raf = requestAnimationFrame(fxFrame); } }
  function fxClear() {
    for (const L of [FXL.parts, FXL.falls, FXL.flys]) { for (const p of L) { if (p.s && !p.s.destroyed) p.s.destroy(); if (p.d && p.d.g) { const f = p.d.g.querySelector('.drop-fall'); if (f) f.style.opacity = ''; } } L.length = 0; }
    const cv = $('#oakCanopy'); if (cv) cv.style.transform = ''; FXL.oak.a = FXL.oak.v = 0;
    fxeReset(); FXE.end = null;
    if (FXL.app) FXL.app.render();
  }
  function fxFrame(now) {
    FXL.raf = 0;
    const dt = Math.min(0.05, Math.max(0, (now - FXL.last) / 1000)); FXL.last = now;
    const app = FXL.app, fr = $('.frame'), mp = $('#map');
    if (!fxOn() || !fr || !mp) { fxClear(); return; }
    if (app.screen.width !== fr.clientWidth || app.screen.height !== fr.clientHeight) app.renderer.resize(Math.max(1, fr.clientWidth), Math.max(1, fr.clientHeight));
    const F = fr.getBoundingClientRect(), R = mp.getBoundingClientRect(), k = R.width / 360 || 1;
    FXL.k = k; FXL.w.scale.set(k); FXL.w.x = R.left - F.left - fr.clientLeft; FXL.w.y = R.top - F.top - fr.clientTop + 60 * k;
    let busy = false;
    // 참나무: 줄기 밑동을 축으로 용수철처럼(감쇠 진동)
    const o = FXL.oak, cvs = $('#oakCanopy');
    if (Math.abs(o.a) > 0.05 || Math.abs(o.v) > 0.5) {
      o.v += (-o.a * FXC.oakW - o.v * FXC.oakDamp) * dt; o.a += o.v * dt;
      if (cvs) cvs.style.transform = `rotate(${o.a.toFixed(2)}deg) skewX(${(o.a * 0.35).toFixed(2)}deg)`; busy = true;
    } else if (cvs && cvs.style.transform) { cvs.style.transform = ''; o.a = o.v = 0; }
    // 잎과 반짝이
    for (let i = FXL.parts.length - 1; i >= 0; i--) { const p = FXL.parts[i]; p.life -= dt; p.vy += p.g * dt; if (p.drag) { const f = Math.max(0, 1 - p.drag * dt); p.vx *= f; p.vy *= f; }
      p.s.x += (p.vx + (p.flut ? Math.sin(now / 200 + p.ph) * p.flut : 0)) * dt; p.s.y += p.vy * dt; p.s.rotation += p.rot * dt;
      const u = Math.max(0, p.life / p.max); p.s.alpha = Math.min(1, u * 1.8); if (p.shrink) p.s.scale.set(p.k0 * (0.35 + 0.65 * u)); if (p.life <= 0) { p.s.destroy(); FXL.parts.splice(i, 1); } }
    // 떨어지는 도토리: 돌면서 떨어지고 바닥에서 두세 번 튀어요. 다 서면 SVG 도토리를 다시 보이고 그림판 것은 지워요
    for (let i = FXL.falls.length - 1; i >= 0; i--) { const f = FXL.falls[i], s = f.s;
      if (f.d.dead) { s.destroy(); FXL.falls.splice(i, 1); continue; }
      f.vy += FXC.g * dt; s.y += f.vy * dt;
      if (f.ball) { const dx = (f.tx - s.x) * Math.min(1, dt * 3.2); s.x += dx; s.rotation += dx / 11; }   // 운동회 공: 굴러 들어와 마찰로 멈춰요
      else { s.x += f.vx * dt; s.rotation += f.vr * dt; } s.scale.set(f.k0 + (f.k1 - f.k0) * Math.min(1, Math.max(0, (s.y - f.sy) / Math.max(1, f.ty - f.sy))));   // 가지의 작은 도토리(13)가 바닥 도토리 크기(22)로
      if (!f.ball && f.vx && (f.vx > 0 ? s.x >= f.tx : s.x <= f.tx)) { s.x = f.tx; f.vx = 0; }
      if (s.y >= f.ty) { s.y = f.ty; f.n++; f.vy = -Math.abs(f.vy) * FXC.bounce; f.vr *= 0.5; if (!f.ball) { s.x = f.tx; f.vx = 0; }
        fxBurst(f.tx, f.ty + 8, 3, { tex: FXL.tex.fx_dust_1 || FXL.tex.dot, sz: 7, sp: 22, up: 6, life: 0.5, tint: FXL.tex.fx_dust_1 ? 0xffffff : 0xd9c39a });
        if ((f.n >= 3 || Math.abs(f.vy) < 45) && (!f.ball || Math.abs(f.tx - s.x) < 1.5)) { s.rotation = 0; const fall = f.d.g.querySelector('.drop-fall'); if (fall) fall.style.opacity = ''; s.destroy(); FXL.falls.splice(i, 1); continue; } }
      busy = true; }
    // 주운 도토리: 반짝이 꼬리를 그리며 위쪽 도토리 숫자로
    const to = $('#vBudget'), tb = to && to.getBoundingClientRect();
    for (let i = FXL.flys.length - 1; i >= 0; i--) { const f = FXL.flys[i], s = f.s; f.t += dt;
      const [ex, ey] = tb && tb.width ? fxMapPt(tb.left + 8, tb.top + tb.height / 2) : [f.sx, f.sy - 200];
      const u = Math.min(1, f.t / FXC.fly), e = u * u * (3 - 2 * u), a = 1 - e;
      s.x = a * a * f.sx + 2 * a * e * f.mx + e * e * ex; s.y = a * a * f.sy + 2 * a * e * f.my + e * e * ey; s.rotation += dt * 9; s.scale.set(f.sc * (1 - 0.35 * e));
      if (Math.random() < 0.7) fxBurst(s.x, s.y, 1, { tex: FXL.tex.star, sz: 5, sp: 8, life: 0.35, tint: 0xfff2a0, add: true });
      if (u >= 1) { s.destroy(); FXL.flys.splice(i, 1); if (to && to.animate) to.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.22)' }, { transform: 'scale(1)' }], { duration: 300, easing: 'ease-out' }); } }
    if (fxeStep(dt, now)) busy = true;   // 학교 행사
    if (FXL.parts.length || FXL.falls.length || FXL.flys.length) busy = true;
    app.render();
    if (busy) FXL.raf = requestAnimationFrame(fxFrame);
  }
  function fxSprite(tex, x, y, sz) { const s = new window.PIXI.Sprite(tex); s.anchor.set(0.5); s.x = x; s.y = y; s.scale.set(sz * (tex._fxK || 1) / (tex.width || 1)); FXL.w.addChild(s); return s; }
  function fxBurst(x, y, n, o) {
    if (!o.tex) return;
    for (let i = 0; i < n; i++) { const s = fxSprite(o.tex, x, y, o.sz * fxRnd(0.7, 1.25)), a = o.ang != null ? o.ang + fxRnd(-o.spread, o.spread) : fxRnd(0, Math.PI * 2), sp = o.sp * fxRnd(0.5, 1.3);
      if (o.tint) s.tint = Array.isArray(o.tint) ? o.tint[(Math.random() * o.tint.length) | 0] : o.tint; 
      FXL.parts.push({ s, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - (o.up || 0), rot: fxRnd(-3, 3), life: o.life * fxRnd(0.8, 1.2), max: o.life, g: o.g || 0, flut: o.flut || 0, ph: fxRnd(0, 6) }); }
  }
  // 참나무를 흔들었어요(누를 때마다). 연타하면 더 크게(최대 oakMax)
  const fxOakTh = () => { try { return (S && S.cos && S.cos.th && thOn().bg) || ''; } catch (e) { return ''; } };
  function fxOak() {
    if (!fxOn()) return false;
    const o = FXL.oak; o.s = -o.s || 1; const w = Math.sqrt(FXC.oakW);
    o.v = o.s * Math.min(FXC.oakMax * w * 1.6, Math.abs(o.v) + FXC.oakDeg * w * 1.6);   // 감쇠 때문에 1.6배를 줘야 처음 꼭대기가 oakDeg쯤
    // 잎 색을 테마에 맞춰요. 봄은 벚꽃잎, 가을은 노랗고 붉은 잎, 겨울과 크리스마스는 앙상한 가지라 잎 대신 가지에 쌓인 눈가루만
    const [x, y, r] = oakAt(), bg = fxOakTh(), n = Math.round(fxRnd(FXC.leaves[0], FXC.leaves[1]));
    if (bg === 'winter' || bg === 'xmas') {
      for (let i = 0; i < 5; i++) { const a = fxRnd(0, Math.PI * 2), d = Math.sqrt(Math.random()) * r * 0.7;
        fxBurst(x + Math.cos(a) * d, y - r * 0.4 + Math.sin(a) * d * 0.5, 1, { tex: FXL.tex.dot, sz: fxRnd(2.5, 4), sp: 12, up: 4, life: fxRnd(1.2, 1.8), g: 22, flut: 10, tint: 0xffffff }); }
      fxKick(); return true;
    }
    const lt = bg === 'spring' ? ['fxe_petal_1', 'fxe_petal_2', 'fxe_petal_3'].map(fxeTex) : bg === 'autumn' ? [fxeTex('tr_leaf_2'), fxeTex('tr_leaf_2'), FXL.tex.fx_leaf_1].filter(Boolean) : [FXL.tex.fx_leaf_1, FXL.tex.fx_leaf_2].filter(Boolean);
    const tn = i => bg === 'autumn' ? [0xffffff, 0xffa060, 0xe0602a][i % 3] : 0;
    for (let i = 0; i < n; i++) { const a = fxRnd(0, Math.PI * 2), d = Math.sqrt(Math.random()) * r * 0.75;
      fxBurst(x + Math.cos(a) * d, y - r * 0.35 + Math.sin(a) * d * 0.6, 1, { tex: lt.length ? lt[i % lt.length] : FXL.tex.dot, sz: fxRnd(9, 13) * (bg === 'spring' ? 0.75 : 1), sp: 26, up: 10, life: fxRnd(1.6, 2.4), g: 26, flut: 22, tint: lt.length ? tn(i) : 0x8fbf4a }); }
    fxKick(); return true;
  }
  // 떨어진 도토리(d)를 가지 자리(sx, sy)에서 떨어뜨려요. 그동안 SVG 도토리는 숨겨요
  function fxNutFall(d, from) {
    if (!fxOn()) return false;
    const fall = d.g.querySelector('.drop-fall'); if (!fall) return false;
    let sx, sy;
    if (from && from.getBoundingClientRect) { const b = from.getBoundingClientRect(); if (b.width) [sx, sy] = fxMapPt(b.left + b.width / 2, b.top + b.height / 2); }
    if (sx == null) { const [ox, oy, r] = oakAt(); sx = ox + fxRnd(-r * 0.4, r * 0.4); sy = oy - r * 0.3; }
    fall.style.opacity = '0';
    const tx = d.x, ty = d.y - 1.6, T = Math.sqrt(Math.max(8, 2 * (ty - sy + 30)) / FXC.g);
    const s = fxSprite(FXL.tex.ic_acorn, sx, sy, 13), k0 = s.scale.x, k1 = k0 * 22 / 13;   // 바닥 SVG 도토리는 지도 22칸쯤(ACORN × 1.6)
    FXL.falls.push({ d, s, sy, tx, ty, k0, k1, vx: (tx - sx) / Math.max(0.3, T + 0.18), vy: -110, vr: fxRnd(-9, 9), n: 0 });
    fxKick(); return true;
  }
  // 주웠어요: 반짝이와 도토리 날아가기(값과 글씨는 collect가 그대로)
  function fxPick(d) {
    if (!fxOn()) return false;
    let sx = d.x, sy = d.y - 1.6;
    const fi = FXL.falls.findIndex(f => f.d === d); if (fi >= 0) { const f = FXL.falls[fi]; sx = f.s.x; sy = f.s.y; f.s.destroy(); FXL.falls.splice(fi, 1); }
    fxBurst(sx, sy, 10, { tex: FXL.tex.star, sz: 7, sp: 70, up: 30, life: 0.55, tint: [0xfff2a0, 0xffd36b, 0xffffff], add: true, g: 90 });
    const s = fxSprite(FXL.tex.ic_acorn, sx, sy, 22);
    FXL.flys.push({ s, t: 0, sx, sy, mx: sx + fxRnd(-30, 30), my: sy - fxRnd(50, 80), sc: s.scale.x });
    fxKick(); return true;
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden && FXL.st === 'ok') fxClear(); });
  if (motionMQ && motionMQ.addEventListener) motionMQ.addEventListener('change', e => { if (e.matches && FXL.st === 'ok') fxClear(); });
  window.addEventListener('load', () => setTimeout(fxLoad, 1500));

  /* ---------- 탐험 효과층('탐험도 인게임에서'): 탐험 무대(#tmFx) 안에 그림판(canvas.fxt)을 한 장 더 ----------
     지금 탐험 연출(대원 공격 자세, 날아가는 기술 그림, 숫자, 흔들림, 필살기 장면)은 그대로 두고 그 위에 더해요
     맞을 때 과목 색 반짝이와 먼지, 강한 한 방은 더 크게, 필살기는 충격 고리, 날아가는 기술 그림 뒤 반짝이 꼬리, 쓰러지면 도토리와 재료가 튀어 바닥에 굴러요
     재화, 전투 결과, 저장은 그대로예요. 탐험 탭이 아니거나 창이 열리면 지워요 */
  const FXT = { st: '', app: null, w: null, parts: [], rings: [], raf: 0, last: 0, sc: 1 };
  const fxTamOn = () => FXL.st === 'ok' && !rt.reduced && tamFxOn();
  const FXT_COL = { sci: [0x9df0ff, 0x6fd3ff, 0xffffff], kor: [0xffe27a, 0xfff6c8, 0xffffff], art: [0xff8ac4, 0xffd36b, 0x8ad8ff], math: [0xfff27a, 0xffffff, 0xffc94a], pe: [0xffa45a, 0xffe27a, 0xffffff] };
  async function fxTamInit() {
    if (FXT.st || FXL.st !== 'ok') return; const box = $('#tmFx'); if (!box) return;
    FXT.st = 'load';
    try {
      const P = window.PIXI, app = new P.Application();
      await app.init({ width: Math.max(1, box.clientWidth), height: Math.max(1, box.clientHeight), backgroundAlpha: 0, antialias: true, resolution: Math.min(2, window.devicePixelRatio || 1), autoDensity: true, autoStart: false, sharedTicker: false, preference: 'webgl' });
      app.ticker.stop(); const cv = app.canvas; cv.className = 'fxt'; cv.setAttribute('aria-hidden', 'true'); box.prepend(cv);
      FXT.app = app; FXT.w = new P.Container(); app.stage.addChild(FXT.w);
      const tx = k => new Promise(r => { const u = IMG(k); if (!u) { r(null); return; } const im = new Image(); im.onload = () => { try { r(P.Texture.from(im)); } catch (e) { r(null); } }; im.onerror = () => r(null); im.src = u; });
      for (const k of ['ex_mat_twig', 'ex_mat_stone', 'ex_mat_petal', 'ex_mat_star']) FXL.tex[k] = FXL.tex[k] || await tx(k);
      // 그려 만든 그림(RenderTexture)은 그 그림판에서만 써요. 탐험 그림판 것을 따로 만들어요
      FXT.star = app.renderer.generateTexture(new P.Graphics().star(0, 0, 4, 8, 3).fill(0xffffff)); FXT.dot = app.renderer.generateTexture(new P.Graphics().circle(0, 0, 4).fill(0xffffff));
      FXT.st = 'ok';
    } catch (e) { FXT.st = 'no'; }
  }
  // 무대 자리: tamAt은 화면에서 잰 값(카메라 확대가 들어 있음)이라 그림판 칸으로 바꿔요
  function fxTamAt(el, fy) { const box = $('#tmFx'); if (!box || !el) return null; const [x, y] = tamAt(el, fy), r = box.getBoundingClientRect(), k = box.clientWidth / (r.width || 1); return [x * k, y * k]; }
  function fxTamKick() { if (FXT.st === 'ok' && !FXT.raf) { FXT.last = performance.now(); FXT.raf = requestAnimationFrame(fxTamFrame); } }
  function fxTamClear() { for (const p of FXT.parts) if (!p.s.destroyed) p.s.destroy(); FXT.parts.length = 0; for (const g of FXT.rings) if (!g.g.destroyed) g.g.destroy(); FXT.rings.length = 0; if (FXT.app) FXT.app.render(); }
  function fxTamPart(tex, x, y, sz, o) {
    if (!tex) return; const s = new window.PIXI.Sprite(tex); s.anchor.set(0.5); s.x = x; s.y = y; s.scale.set(sz / (tex.width || 1)); if (o.tint) s.tint = o.tint;  FXT.w.addChild(s);
    FXT.parts.push({ s, vx: o.vx || 0, vy: o.vy || 0, g: o.g || 0, rot: o.rot || 0, life: o.life, max: o.life, floor: o.floor, bounce: o.bounce || 0, n: 0, shrink: !!o.shrink, k0: s.scale.x });
  }
  function fxTamBurst(x, y, n, o) { for (let i = 0; i < n; i++) { const a = o.ang != null ? o.ang + fxRnd(-o.spread, o.spread) : fxRnd(0, Math.PI * 2), sp = o.sp * fxRnd(0.45, 1.25), cs = o.cols;
    fxTamPart(o.tex, x, y, o.sz * fxRnd(0.6, 1.3), { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * (o.flat || 1) - (o.up || 0), g: o.g, rot: fxRnd(-6, 6), life: o.life * fxRnd(0.75, 1.25), tint: cs ? cs[(Math.random() * cs.length) | 0] : o.tint, add: o.add, shrink: o.shrink, floor: o.floor, bounce: o.bounce }); } }
  // 맞았어요: el 맞은 장난꾸러기, cr 강한 한 방, big 필살기, ri 과목 번호(TAM.role)
  function fxTamHit(el, cr, big, ri) {
    if (!fxTamOn()) return; if (FXT.st !== 'ok') { fxTamInit(); return; }
    const at = fxTamAt(el, 0.45), ft = fxTamAt(el, 0.98); if (!at) return;
    const k = TAM.role[ri] ? TAM.role[ri].k : '', cols = FXT_COL[k] || [0xfff2a0, 0xffd36b, 0xffffff], W = FXT.app.screen.width;
    fxTamBurst(at[0], at[1], big ? 34 : cr ? 20 : 10, { tex: FXT.star, sz: W * (big ? 0.05 : cr ? 0.045 : 0.038), sp: W * (big ? 0.9 : cr ? 0.7 : 0.45), up: W * 0.12, g: W * 1.4, life: big ? 0.8 : 0.55, cols, add: true, shrink: true });
    if (ft) fxTamBurst(ft[0], ft[1], big ? 10 : 5, { tex: FXL.tex.fx_dust_1 || FXT.dot, sz: W * 0.05, sp: W * 0.18, flat: 0.25, up: W * 0.03, life: 0.6, tint: FXL.tex.fx_dust_1 ? 0xffffff : 0xd9c39a });
    if (big || cr) { const g = new window.PIXI.Graphics(); g.x = at[0]; g.y = at[1]; FXT.w.addChild(g); FXT.rings.push({ g, t: 0, max: big ? 0.5 : 0.32, r: W * (big ? 0.42 : 0.2), col: big ? 0xfff2a0 : 0xffffff }); }
    fxTamKick();
  }
  // 대원이 뛰어나가요: 발밑 먼지
  function fxTamDust(el) {
    if (!fxTamOn()) return; if (FXT.st !== 'ok') { fxTamInit(); return; }
    const ft = fxTamAt(el, 0.98); if (!ft) return; const W = FXT.app.screen.width;
    fxTamBurst(ft[0], ft[1], 4, { tex: FXL.tex.fx_dust_1 || FXT.dot, sz: W * 0.045, sp: W * 0.12, ang: Math.PI, spread: 0.5, flat: 0.3, up: W * 0.02, life: 0.5, tint: FXL.tex.fx_dust_1 ? 0xffffff : 0xd9c39a }); fxTamKick();
  }
  // 쓰러졌어요: 도토리와 그 지역 재료가 튀어 바닥에서 통통 굴러요(받는 양은 그대로, 그림만)
  function fxTamDrop(el, fl) {
    if (!fxTamOn()) return; if (FXT.st !== 'ok') { fxTamInit(); return; }
    const at = fxTamAt(el, 0.5), ft = fxTamAt(el, 0.98); if (!at || !ft) return; const W = FXT.app.screen.width;
    const mt = FXL.tex[['ex_mat_twig', 'ex_mat_stone', 'ex_mat_petal'][tamReg(fl).mat] || 'ex_mat_star'] || FXL.tex.ex_mat_star;
    for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + fxRnd(-1.1, 1.1), sp = W * fxRnd(0.35, 0.7), tex = i % 3 === 0 && mt ? mt : FXL.tex.ic_acorn;
      fxTamPart(tex, at[0], at[1], W * (tex === mt ? 0.06 : 0.05), { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: W * 2.6, rot: fxRnd(-8, 8), life: 1.1, floor: ft[1] + fxRnd(-W * 0.02, W * 0.02), bounce: 0.42 }); }
    fxTamBurst(at[0], at[1], 14, { tex: FXT.star, sz: W * 0.03, sp: W * 0.5, up: W * 0.1, g: W, life: 0.6, cols: [0xffffff, 0xfff2a0, 0xffd36b], add: true, shrink: true });
    fxTamKick();
  }
  function fxTamFrame(now) {
    FXT.raf = 0; const dt = Math.min(0.05, Math.max(0, (now - FXT.last) / 1000)); FXT.last = now;
    const app = FXT.app, box = $('#tmFx');
    if (!fxTamOn() || !box) { fxTamClear(); return; }
    if (app.screen.width !== box.clientWidth || app.screen.height !== box.clientHeight) app.renderer.resize(Math.max(1, box.clientWidth), Math.max(1, box.clientHeight));
    // 날아가는 기술 그림(DOM .tm-shot) 뒤에 반짝이 꼬리
    const shots = $$('#tmFx .tm-shot'), br = box.getBoundingClientRect(), kk = box.clientWidth / (br.width || 1), W = app.screen.width;
    for (const sh of shots) { const r = sh.getBoundingClientRect(); if (!r.width || Math.random() < 0.35) continue;
      fxTamPart(FXT.star, (r.left - br.left + r.width / 2) * kk, (r.top - br.top + r.height / 2) * kk, W * 0.022, { vx: fxRnd(-20, 20), vy: fxRnd(-20, 20), life: 0.35, tint: 0xfff2a0, add: true, shrink: true }); }
    for (let i = FXT.parts.length - 1; i >= 0; i--) { const p = FXT.parts[i], s = p.s; p.life -= dt; p.vy += p.g * dt; s.x += p.vx * dt; s.y += p.vy * dt; s.rotation += p.rot * dt;
      if (p.floor != null && s.y > p.floor && p.vy > 0) { s.y = p.floor; p.n++; p.vy = -p.vy * p.bounce; p.vx *= 0.6; p.rot *= 0.5; if (p.n > 3) { p.vy = 0; p.g = 0; p.vx *= 0.8; } }
      const u = Math.max(0, p.life / p.max); s.alpha = p.floor != null ? Math.min(1, u * 3) : Math.min(1, u * 1.8); if (p.shrink) s.scale.set(p.k0 * (0.4 + 0.6 * u));
      if (p.life <= 0) { s.destroy(); FXT.parts.splice(i, 1); } }
    for (let i = FXT.rings.length - 1; i >= 0; i--) { const R = FXT.rings[i]; R.t += dt; const u = Math.min(1, R.t / R.max);
      R.g.clear().circle(0, 0, R.r * (0.15 + 0.85 * u)).stroke({ color: R.col, width: Math.max(1, R.r * 0.12 * (1 - u)), alpha: 1 - u }); if (u >= 1) { R.g.destroy(); FXT.rings.splice(i, 1); } }
    app.render();
    if (FXT.parts.length || FXT.rings.length || shots.length) FXT.raf = requestAnimationFrame(fxTamFrame);
  }

  /* ---------- 학교 행사 효과('행사 열 가지 한 번에', 설계안 ' 설계안 (학교 행사 실제 움직임, 효과층 3단계)') ----------
     규칙(시간, 목표, 값, 운동회 점수)은 그대로이고 그림과 움직임만 더해요. 학생 몸(기울기, 점프, 찌그러짐)은 학생 SVG에(placeKid의 k.lean, k.jY, k.sq)
     색종이, 불꽃, 먼지, 빛줄기는 지도 효과층(canvas.fxl)에 그려요. 그림(작업지시서 103 fxe_*)이 있으면 그림을, 없으면 코드로 그린 모양을 써요 */
  const FXE = { tex: {}, beams: null, sprint: 0, end: null };
  const FXE_TEAM = { b: [0x3f78c2, 0x7fb2ff, 0xffffff], w: [0xffffff, 0xe9eef5, 0xffe27a] };
  const hexN = c => parseInt(String(c || '#ffffff').replace('#', ''), 16) || 0xffffff;
  // 그림은 둘레에 빈 곳이 있어서 코드 모양보다 조금 크게 그려요
  const FXE_K = k => k === 'fxe_spark' ? 2.4 : /^fxe_conf_/.test(k) ? 1.7 : k === 'fxe_bit' ? 1.5 : /^fxe_petal_/.test(k) ? 1.3 : k === 'fxe_cap' ? 1.25 : 1;
  function fxeTex(k) {
    if (FXE.tex[k] !== undefined) return FXE.tex[k];
    const u = IMG(k);
    if (u) { FXE.tex[k] = null; const im = new Image(); im.onload = () => { try { const t = window.PIXI.Texture.from(im); t._fxK = FXE_K(k); FXE.tex[k] = t; } catch (e) { /* 코드 모양 그대로 */ } }; im.src = u; }
    const P = window.PIXI, r = FXL.app.renderer, G = () => new P.Graphics();
    let g;
    if (k === 'fxe_conf_1') g = G().rect(-8, -3, 16, 6).fill(0xe04848);
    else if (k === 'fxe_conf_2') g = G().rect(-7, -3, 14, 6).fill(0x3f78c2);
    else if (k === 'fxe_conf_3') g = G().circle(0, 0, 4.5).fill(0xf3c04b);
    else if (k === 'fxe_conf_4') g = G().star(0, 0, 5, 6, 3).fill(0x3fa45b);
    else if (k === 'fxe_bit') g = G().poly([-6, -2, -1, -6, 6, -3, 4, 4, -3, 5]).fill(0xffffff);
    else if (k === 'fxe_spark') { g = G(); for (let i = 4; i >= 1; i--) g.circle(0, 0, i * 2).fill({ color: 0xffffff, alpha: i === 1 ? 1 : 0.22 }); }
    else if (k === 'fxe_cap') g = G().poly([-12, 0, 0, -6, 12, 0, 0, 6]).fill(0x2b2b33).rect(-6, 1, 12, 6).fill(0x2b2b33).moveTo(0, 0).lineTo(9, 7).stroke({ color: 0xf3c04b, width: 1.6 });
    else if (k === 'fxe_tape_l' || k === 'fxe_tape_r') { g = G(); for (let i = 0; i < 8; i++) g.rect(i * 6, 0, 6, 5).fill(i % 2 ? 0xffffff : 0xe04848); }
    else if (k === 'fxe_beam') { g = G(); for (let i = 0; i < 6; i++) g.poly([-4 - i * 2, 0, 4 + i * 2, 0, 30 + i * 6, 160, -30 - i * 6, 160]).fill({ color: 0xffffff, alpha: 0.05 }); }
    else g = G().circle(0, 0, 4).fill(0xffffff);
    const t = r.generateTexture(g); if (FXE.tex[k] === undefined || FXE.tex[k] === null) FXE.tex[k] = FXE.tex[k] || t;
    return FXE.tex[k] || t;
  }
  const FXE_CONF = ['fxe_conf_1', 'fxe_conf_2', 'fxe_conf_3', 'fxe_conf_4'];
  function fxeConfetti(x, y, n, o) {
    o = o || {};
    for (let i = 0; i < n; i++) { const tex = fxeTex(FXE_CONF[i % 4]), a = (o.ang != null ? o.ang : -Math.PI / 2) + fxRnd(-(o.spread || 1.2), o.spread || 1.2), sp = (o.sp || 120) * fxRnd(0.5, 1.2);
      const s = fxSprite(tex, x, y, (o.sz || 6) * fxRnd(0.8, 1.3)); if (o.cols) s.tint = o.cols[(Math.random() * o.cols.length) | 0];
      FXL.parts.push({ s, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, rot: fxRnd(-8, 8), life: o.life || 2, max: o.life || 2, g: o.g != null ? o.g : 160, flut: 26, ph: fxRnd(0, 6), drag: 1.6 }); }
  }
  function fxeSparks(x, y, n, o) {
    for (let i = 0; i < n; i++) { const a = fxRnd(0, Math.PI * 2), sp = (o.sp || 80) * (o.ring ? fxRnd(0.85, 1.05) : fxRnd(0.3, 1.1));
      const s = fxSprite(fxeTex('fxe_spark'), x, y, (o.sz || 5) * fxRnd(0.7, 1.2)); s.tint = o.cols ? o.cols[(Math.random() * o.cols.length) | 0] : 0xffffff;
      FXL.parts.push({ s, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 0), rot: 0, life: (o.life || 1) * fxRnd(0.75, 1.2), max: o.life || 1, g: o.g || 0, drag: o.drag || 0, shrink: true, k0: s.scale.x }); }
  }
  // 학생 점프(지연 dl초 뒤, 높이 h), 박수 파도는 왼쪽부터 차례로
  function fxeJump(k, dl, h) { if (!k || k.jT > 0) return; k.jT = -(dl || 0); k.jH = h || 7; }
  function fxeWave(ks, step, h) { [...ks].sort((a, b) => a.x - b.x).forEach((k, i) => fxeJump(k, i * (step || 0.05), h)); }
  const fxeHold = () => rt.kids.filter(k => k.hold && !k.board);
  const fxeNear = (x, y, list) => (list || rt.kids).reduce((b, k) => { const d = (k.x - x) ** 2 + (k.y - y) ** 2; return !b || d < b.d ? { k, d } : b; }, null);
  // 행사 하나가 시작될 때와 놀이 루프에서(updateFest, updateSports) 불러요: 효과층 그리기를 깨워요
  function fxeTick() { if (fxOn()) fxKick(); }
  // 효과층 한 장면마다(fxFrame에서): 학생 몸, 운동회 달리기, 빛줄기, 떠오르는 것 꼬리
  function fxeStep(dt, now) {
    let busy = false;
    for (const k of rt.kids) {   // 점프와 찌그러짐
      if (k.jT == null) continue;
      k.jT += dt; busy = true;
      if (k.jT < 0) continue;
      const T = 0.42, t = k.jT;
      if (t < T) { k.jY = Math.sin(t / T * Math.PI) * k.jH; k.sq = t < 0.06 ? 0.12 * (1 - t / 0.06) : -0.06 * Math.sin(t / T * Math.PI); }
      else if (t < T + 0.12) { k.jY = 0; k.sq = 0.14 * Math.sin((t - T) / 0.12 * Math.PI); }
      else { k.jY = 0; k.sq = 0; k.jT = null; }
    }
    const R = rt.sports;
    if (R && !R.ending && !(R.intro > 0)) {   // 운동회: 앞으로 기울고, 굽은 곳에서 안쪽으로, 가끔 전력 질주, 발밑 흙먼지
      busy = true; FXE.sprint -= dt;
      const run = rt.kids.filter(k => k.ang !== undefined && !k.board);
      if (FXE.sprint <= 0 && run.length) { FXE.sprint = fxRnd(2, 4); const k = run[(Math.random() * run.length) | 0]; if (!k.spd0) { k.spd0 = k.spd; k.spd *= 1.8; k.sprT = 1.5; } }
      for (const k of run) {
        if (k.sprT > 0) { k.sprT -= dt; if (k.sprT <= 0 && k.spd0) { k.spd = k.spd0; k.spd0 = 0; } }
        const vx = -Math.sin(k.ang) * k.spd, vy = Math.cos(k.ang) * k.spd * 0.33;
        k.lean = Math.max(-16, Math.min(16, vx * 10 + vy * 4)) * (k.spd0 ? 1.4 : 1);
        if (Math.random() < dt * (k.spd0 ? 9 : 4)) { const s = fxSprite(FXL.tex.fx_dust_1 || FXL.tex.dot, k.x - Math.sign(vx) * 4, k.y + 1, fxRnd(3, 5)); s.tint = FXL.tex.fx_dust_1 ? 0xf0dcc0 : 0xd9a77a; s.alpha = 0.8; FXL.parts.push({ s, vx: -vx * 12, vy: -fxRnd(4, 10), rot: 0, life: 0.45, max: 0.45, g: 0 }); }
      }
    }
    const F = rt.fest && festDef(rt.fest.id);
    if (F && !rt.fest.ending) {
      busy = true;
      if (F.form === 'stage' && !FXE.beams) {   // 학예회: 무대 위 빛줄기 둘이 천천히 흔들려요
        FXE.beams = [-1, 1].map(sd => { const s = new window.PIXI.Sprite(fxeTex('fxe_beam')); s.anchor.set(0.5, 0); s.x = pzx() + sd * 34; s.y = pzy() - 120; s.scale.set(60 / (s.texture.width || 60)); s.alpha = 0.5; s.tint = sd < 0 ? 0xfff2b0 : 0xd8ecff; FXL.w.addChildAt(s, 0); return { s, sd }; });
      }
      if (FXE.beams) FXE.beams.forEach(b => { b.s.rotation = b.sd * 0.25 + Math.sin(now / 900 + b.sd) * 0.22; });
      for (const it of rt.fest.items) {   // 떠오르는 것, 떨어지는 것 꼬리
        if (it.dead || Math.random() > dt * 14) continue;
        if (F.bf) fxeSparks(it.x + fxRnd(-2, 2), it.y + 8, 1, { sz: 4, sp: 12, life: 0.5, g: 30, cols: [0xffd36b, 0xff9a4a] });
        else if (it.fall) fxeSparks(it.x - 4, it.y - 3, 2, { sz: 4, sp: 6, life: 0.6, cols: [0xffffff, 0xfff2a0] });
        else if (F.item === 'lantern') fxeSparks(it.x + fxRnd(-4, 4), it.y + 4, 1, { sz: 3, sp: 8, up: 16, life: 0.9, cols: [0xffc46b, 0xff8a4a] });
        else if (F.item === 'firefly') fxeSparks(it.x + fxRnd(-6, 6), it.y + fxRnd(-6, 6), 1, { sz: 4, sp: 4, life: 0.7, cols: [0xe8ff9a, 0xc6ff6b] });
      }
    }
    if (FXE.end) { FXE.end.t -= dt; busy = true; if (FXE.end.t <= 0) FXE.end = null; }
    return busy;
  }
  // 누른 것마다
  function fxeHit(it, F) {
    if (!fxOn() || !it) return;
    const x = it.x, y = it.y, bc = hexN(it.g && it.g.style.getPropertyValue('--bc'));
    if (F.bf) fxeFirework(x, y);
    else if (F.item === 'balloon') { for (let i = 0; i < 8; i++) { const s = fxSprite(fxeTex('fxe_bit'), x, y, fxRnd(4, 7)); s.tint = bc; const a = fxRnd(0, Math.PI * 2), sp = fxRnd(40, 110); FXL.parts.push({ s, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30, rot: fxRnd(-10, 10), life: 0.9, max: 0.9, g: 260 }); }
      fxeConfetti(x, y, 6, { sp: 70, life: 1.2, sz: 5 }); fxeWave(fxeHold(), 0.04, 6); }
    else if (F.item === 'note') { fxeSparks(x, y, 10, { sz: 5, sp: 60, life: 0.7, cols: [0xfff2a0, 0xffffff, 0xffc0d6] }); fxeWave(fxeHold(), 0.035, 5); }
    else if (F.item === 'smile') { const n = fxeNear(x, y + 20, fxeHold()); if (n) fxeJump(n.k, 0, 5); fxeSparks(x, y, 10, { sz: 5, sp: 55, life: 0.6, cols: [0xfff27a, 0xffffff] }); }
    else if (F.item === 'paper' || (F.fv && F.how === 'pop')) { fxeSparks(x, y, 12, { sz: 5, sp: 70, up: 20, g: 90, life: 0.7, cols: [0xffe27a, 0xffffff, 0xffc46b] }); fxeConfetti(x, y, 5, { sp: 60, life: 1, sz: 4 }); }
    else if (F.item === 'meteor') fxeSparks(x, y, 16, { sz: 4, sp: 90, life: 0.7, cols: [0xffffff, 0xfff2a0, 0xbfe0ff] });
    else if (F.item === 'lantern') fxeSparks(x, y, 14, { sz: 4, sp: 50, up: 40, life: 1, cols: [0xffc46b, 0xff8a4a, 0xfff2a0] });
    else if (F.item === 'firefly') fxeSparks(x, y, 12, { sz: 6, sp: 40, life: 0.6, cols: [0xe8ff9a, 0xffffff] });
    else fxeSparks(x, y, 10, { sz: 5, sp: 60, up: 10, g: 60, life: 0.6, cols: [bc, 0xffffff] });
    fxKick();
  }
  // 불꽃놀이: 둥글게 퍼져 처지며 사그라들어요. 가끔 겹꽃
  const FXE_FW = [[0xffd36b, 0xfff2a0, 0xffffff], [0xff7ab0, 0xffc0d6, 0xffffff], [0x6fc3ff, 0xbfe0ff, 0xffffff], [0x8ae06b, 0xd6ff9a, 0xffffff], [0xc08aff, 0xe6ccff, 0xffffff]];
  function fxeFirework(x, y, small) {
    const cols = FXE_FW[(Math.random() * FXE_FW.length) | 0], n = small ? 36 : Math.round(fxRnd(60, 90));
    fxeSparks(x, y, n, { ring: true, sz: small ? 4 : 5, sp: small ? 55 : 95, g: 45, drag: 1.1, life: small ? 0.9 : 1.4, cols });
    fxeSparks(x, y, 10, { sz: 7, sp: 20, life: 0.35, cols: [0xffffff] });
    if (!small && Math.random() < 0.3) setTimeout(() => { if (fxOn()) { fxeFirework(x + fxRnd(-25, 25), y + fxRnd(-25, 5), true); fxKick(); } }, 320);
    fxKick();
  }
  // 운동회
  function fxeBall(d, dx) {   // 트랙 밖에서 튀며 굴러 들어와 마찰로 멈춰요. 그동안 SVG 공은 숨겨요
    if (!fxOn()) return false; const fall = d.g.querySelector('.drop-fall'), u = IMG('fest_ball_blue'); if (!fall || !u) return false;
    if (FXE.tex.ball === undefined) { FXE.tex.ball = null; const im = new Image(); im.onload = () => { try { FXE.tex.ball = window.PIXI.Texture.from(im); } catch (e) { /* 없으면 예전 공 */ } }; im.src = u; }
    if (!FXE.tex.ball) return false;
    fall.style.opacity = '0';
    const s = fxSprite(FXE.tex.ball, d.x + dx, d.y - 1, 22);
    FXL.falls.push({ d, s, ball: true, tx: d.x, ty: d.y - 1, sy: d.y - 30, k0: s.scale.x, k1: s.scale.x, vx: -dx * 1.6, vy: -120, vr: -Math.sign(dx) * 14, n: 0 });
    fxKick(); return true;
  }
  function fxeBlue(d) { if (!fxOn()) return; fxeConfetti(d.x, d.y, 10, { sp: 90, life: 1.3, sz: 5, cols: FXE_TEAM.b }); const b = rt.kids.filter(k => k.team === 'b'); if (b.length) fxeJump(b[(Math.random() * b.length) | 0], 0, 7); fxKick(); }
  function fxeWhite() { if (!fxOn()) return; const w = rt.kids.filter(k => k.team === 'w'); if (!w.length) return; const k = w[(Math.random() * w.length) | 0]; fxeSparks(k.x, k.y - 16, 8, { sz: 4, sp: 40, life: 0.6, cols: FXE_TEAM.w }); fxeJump(k, 0, 6); fxKick(); }
  function fxeSportsEnd(win) {   // 결승 테이프가 끊기고 이긴 팀 색종이와 점프
    if (!fxOn()) return;
    const x = SPORTS.cx + SPORTS.rx, y = SPORTS.cy, team = win ? 'b' : 'w';
    for (const sd of [-1, 1]) { const s = fxSprite(fxeTex(sd < 0 ? 'fxe_tape_l' : 'fxe_tape_r'), x + sd * 10, y - 12, 22); FXL.parts.push({ s, vx: sd * 60, vy: -20, rot: sd * 5, life: 1.2, max: 1.2, g: 140 }); }
    for (let i = 0; i < 3; i++) setTimeout(() => { if (fxOn()) { fxeConfetti(SPORTS.cx + fxRnd(-80, 80), SPORTS.cy - 60, 22, { ang: Math.PI / 2, spread: 0.6, sp: 40, g: 70, life: 2.4, sz: 6, cols: FXE_TEAM[team] }); fxKick(); } }, i * 220);
    fxeWave(rt.kids.filter(k => k.team === team), 0.05, 9);
    FXE.end = { t: 1.4 }; fxKick();
  }
  // 행사가 끝날 때: 졸업 사진 성공이면 학사모 던지기, 다른 행사 성공이면 색종이
  function fxeEnd(F, win) {
    if (FXE.beams) { FXE.beams.forEach(b => b.s.destroy()); FXE.beams = null; }
    if (!fxOn() || !F) return;
    if (F.form === 'rows' && win) { for (const k of fxeHold().slice(0, 12)) { const s = fxSprite(fxeTex('fxe_cap'), k.x, k.y - 14, 13); FXL.parts.push({ s, vx: fxRnd(-25, 25), vy: -fxRnd(150, 210), rot: fxRnd(-9, 9), life: 1.6, max: 1.6, g: 230 }); fxeJump(k, fxRnd(0, 0.1), 7); }
      fxeConfetti(pzx(), pzy() - 40, 24, { sp: 120, life: 2, sz: 5 }); }
    else if (win) fxeConfetti(pzx(), pzy() - 30, 26, { sp: 130, life: 2, sz: 5 });
    FXE.end = { t: 1.8 }; fxKick();
  }
  function fxeReset() {   // 행사가 끝나면 학생 몸을 원래대로
    for (const k of rt.kids) { k.lean = 0; k.jY = 0; k.sq = 0; k.jT = null; if (k.spd0) { k.spd = k.spd0; k.spd0 = 0; } k.sprT = 0; }
    if (FXE.beams) { FXE.beams.forEach(b => { if (!b.s.destroyed) b.s.destroy(); }); FXE.beams = null; }
  }
  /* ---------- 전환과 보상, 졸업 연출(효과층 5단계, 설계안 ' 효과층 마무리' 2, 3절) ----------
     모두 HTML 위에 얹는 움직임이에요(누르기 통과, 값과 저장 그대로). 움직임 줄이기면 하지 않아요
     그림(작업지시서 104: tr_leaf_1, tr_leaf_2, tr_leaves, rw_burst, fxe_petal_1~3)이 없으면 그 움직임만 빼요 */
  const UIFX = { tabA: null, wipe: null };
  const uiOn = () => !rt.reduced && !document.hidden;
  function uiLayer() { let L = $('#uiFx'); if (!L) { L = document.createElement('div'); L.id = 'uiFx'; L.className = 'ui-fx'; L.setAttribute('aria-hidden', 'true'); document.body.appendChild(L); } return L; }
  function uiImg(k, cls) { const u = IMG(k); if (!u) return null; const im = document.createElement('img'); im.src = u; im.alt = ''; im.className = cls || 'ui-p'; uiLayer().appendChild(im); return im; }
  // 탭 넘김: 새 화면이 살짝 떠올라요(0.25초, 빨리 눌러도 앞 움직임을 지우고 새로)
  function trTab(t, prev) {
    if (!uiOn() || t === prev) return;
    // 탐험에 들어갈 때 잎사귀 무리(trWipe)도 쓰지 않아요
    const el = t === 'school' ? $('.frame') : document.querySelector('.panel:not([hidden])');
    if (UIFX.tabA) { try { UIFX.tabA.cancel(); } catch (e) { /* 이미 끝남 */ } }
    if (el && el.animate) UIFX.tabA = el.animate([{ opacity: 0.55, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 250, easing: 'cubic-bezier(.2,.8,.3,1)' });
    // 탭 넘김 때 날아가는 잎사귀는 뺐어요
  }
  // 큰 장면 넘김: 잎사귀 무리가 화면을 덮은 채 시작해 왼쪽으로 쓸려 나가며 새 화면이 보여요(화면은 이미 바뀐 뒤라 누르기를 막지 않아요)
  function trWipe() {
    if (!uiOn()) return; const im = uiImg('tr_leaves', 'ui-wipe'); if (!im) return;
    if (UIFX.wipe) UIFX.wipe.remove(); UIFX.wipe = im;
    const a = im.animate([{ transform: 'translateX(-12%)' }, { transform: 'translateX(-12%)', offset: 0.15 }, { transform: 'translateX(-115%)' }], { duration: 620, easing: 'cubic-bezier(.5,0,.6,1)', fill: 'forwards' });
    a.onfinish = () => { im.remove(); if (UIFX.wipe === im) UIFX.wipe = null; };
  }
  // 보상 창: 뒤에서 빛살이 천천히 돌아요(받는 값이 보이는 창만)
  const UI_RW = ['mReward', 'mSportsEnd', 'mFestEnd', 'mOffline'];
  function uiRwOpen(el) { }   // 보상 창 뒤 빛살은 뺐어요(받으면 도토리가 날아가는 것은 그대로)

  // 받기: 받은 자리에서 도토리가 위쪽 도토리 칸으로 날아가요(최대 8개)
  function uiRwClose(el) {
    if (!el || !uiOn() || !(UI_RW.includes(el.id) || el.querySelector('.amount')) || !el.querySelector('[data-acorn], .amount svg, .amount img, .rw-list svg, .rw-big svg')) return;   // 도토리를 받는 창만
    const from = el.querySelector('.amount') || el.querySelector('.rw-list li') || el.querySelector('.rw-big'), to = $('#vBudget'), u = IMG('ic_acorn');
    if (!from || !to || !u) return; const A = from.getBoundingClientRect(), B = to.getBoundingClientRect(); if (!A.width || !B.width) return;
    const n = 6;
    for (let i = 0; i < n; i++) { const im = uiImg('ic_acorn', 'ui-p ui-acorn'); if (!im) return; const x0 = A.left + A.width / 2 + (Math.random() - 0.5) * 60, y0 = A.top + A.height / 2 + (Math.random() - 0.5) * 20, x1 = B.left + B.width / 2 - 12, y1 = B.top + B.height / 2 - 12, mx = (x0 + x1) / 2 + (Math.random() - 0.5) * 120, my = Math.min(y0, y1) - 40 - Math.random() * 60;
      const a = im.animate([{ transform: `translate(${x0 - 12}px,${y0 - 12}px) scale(.6)`, opacity: 0 }, { transform: `translate(${mx}px,${my}px) scale(1.15)`, opacity: 1, offset: 0.45 }, { transform: `translate(${x1}px,${y1}px) scale(.7)`, opacity: 1 }], { duration: 620, delay: i * 55, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'backwards' });
      a.onfinish = () => { im.remove(); if (i === n - 1 && to.animate) to.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 260 }); }; }
  }
  // 졸업식(cereArt3, 21초) 위에 꽃잎, 학사모 따로따로, 색종이, 마지막 불꽃 세 번
  function cereFx(host) {
    if (!host || !uiOn() || !IMG('fxe_petal_1')) return;
    const L = document.createElement('div'); L.className = 'cere-fx'; L.setAttribute('aria-hidden', 'true'); host.appendChild(L);
    const R = () => host.getBoundingClientRect(), add = (k, w) => { const u = IMG(k); if (!u) return null; const im = document.createElement('img'); im.src = u; im.alt = ''; im.style.width = w + 'px'; L.appendChild(im); return im; };
    const timers = [], at = (ms, f) => timers.push(setTimeout(() => { if (L.isConnected) f(); }, ms));
    const petals = (n, t0, dur) => { for (let i = 0; i < n; i++) at(t0 + Math.random() * dur, () => { const r = R(), im = add('fxe_petal_' + (1 + (i % 3)), 12 + Math.random() * 10); if (!im) return; const x = Math.random() * r.width * 1.1 - r.width * 0.05, sw = 30 + Math.random() * 50, d = 3800 + Math.random() * 2200;
      const a = im.animate([{ transform: `translate(${x}px,-30px) rotate(0deg)` }, { transform: `translate(${x + sw}px,${r.height * 0.5}px) rotate(${180 + Math.random() * 180}deg)`, offset: 0.5 }, { transform: `translate(${x - sw * 0.3}px,${r.height + 30}px) rotate(${400 + Math.random() * 200}deg)` }], { duration: d, easing: 'linear' }); a.onfinish = () => im.remove(); }); };
    petals(14, 200, 3200);   // 1 학교 전경
    petals(10, 11600, 4400);   // 4 졸업장
    at(17500, () => { const r = R(); for (let i = 0; i < 7; i++) { const im = add('fxe_cap', 34 + Math.random() * 10); if (!im) break; const x = r.width * (0.2 + i * 0.1), h = r.height * (0.35 + Math.random() * 0.15), d = 1700 + Math.random() * 400, sp = (Math.random() - 0.5) * 900;   // 5 학사모가 따로따로
      const a = im.animate([{ transform: `translate(${x}px,${r.height * 0.62}px) rotate(0deg)` }, { transform: `translate(${x + (Math.random() - 0.5) * 60}px,${r.height * 0.62 - h}px) rotate(${sp}deg)`, offset: 0.45, easing: 'ease-in' }, { transform: `translate(${x + (Math.random() - 0.5) * 90}px,${r.height + 40}px) rotate(${sp * 1.8}deg)` }], { duration: d, delay: i * 70, easing: 'ease-out', fill: 'backwards' }); a.onfinish = () => im.remove(); } });
    at(17600, () => { const r = R(); for (let i = 0; i < 26; i++) { const im = add('fxe_conf_' + (1 + (i % 4)), 12 + Math.random() * 6); if (!im) break; const x = Math.random() * r.width, d = 2200 + Math.random() * 1200;
      const a = im.animate([{ transform: `translate(${r.width / 2}px,${r.height * 0.4}px) rotate(0deg)` }, { transform: `translate(${x}px,${r.height * (0.1 + Math.random() * 0.2)}px) rotate(${Math.random() * 360}deg)`, offset: 0.3, easing: 'ease-in' }, { transform: `translate(${x + (Math.random() - 0.5) * 40}px,${r.height + 20}px) rotate(${Math.random() * 720}deg)` }], { duration: d, easing: 'ease-out' }); a.onfinish = () => im.remove(); } });
    petals(16, 16700, 3600);
    [18600, 19300, 19900].forEach((t, j) => at(t, () => { const r = R(), cx = r.width * [0.28, 0.72, 0.5][j], cy = r.height * [0.2, 0.17, 0.12][j], cols = ['#FFD36B', '#FF9BC4', '#9FD3FF'];   // 마지막 불꽃 세 번
      for (let i = 0; i < 22; i++) { const im = add('fxe_spark', 15); if (!im) break; im.style.filter = `drop-shadow(0 0 5px ${cols[j]}) drop-shadow(0 0 2px ${cols[j]})`; const an = i / 22 * Math.PI * 2, d = r.width * (0.13 + Math.random() * 0.05);
        const a = im.animate([{ transform: `translate(${cx}px,${cy}px) scale(.6)`, opacity: 1 }, { transform: `translate(${cx + Math.cos(an) * d}px,${cy + Math.sin(an) * d}px) scale(1)`, opacity: 1, offset: 0.55 }, { transform: `translate(${cx + Math.cos(an) * d * 1.1}px,${cy + Math.sin(an) * d * 1.1 + 24}px) scale(.5)`, opacity: 0 }], { duration: 1200, easing: 'cubic-bezier(.1,.8,.3,1)' }); a.onfinish = () => im.remove(); } }));
    L._stop = () => { timers.forEach(clearTimeout); L.remove(); };
    return L;
  }
  /* ---------- 탐험 오르는 길(효과층 6단계, 작업지시서 105, 105-2) ----------
     탐험 무대 바닥을 엔진으로 그려요: 바닥 조각(ex6_<지역>_tile)을 세로로 눌러 원근을 주고, 그 위에 사선 길 한 줄(ex6_<지역>_path)을 깔아요
     다 처치하면 대원들이 길을 따라 오른쪽 위로 달리고, 화면이 따라가며 바닥이 왼쪽 아래로 흘러요. 10층마다 아치문(ex6_<지역>_gate)을 지나요
     높이 오를수록(지역 안 50층) 먼 풍경이 내려가고 발아래로 구름(ex6_cloud)이 지나가요
     하늘, 먼 풍경, 앞 장식은 그대로 HTML 겹(작업지시서 104-2). 엔진이 없거나 움직임 줄이기면 예전 오르기 그대로. 겨루기 계산과 값은 바꾸지 않아요 */
  const FXG = { st: '', app: null, root: null, sq: null, floor: null, path: null, cloud: null, gate: null, gs: 0, reg: '', tex: {}, raf: 0, last: 0, run: 0, sp: 0, ang: 0, ux: 0, uy: 0, mid: [0, 0], top: 0, W: 0, H: 0, h: 0 };
  const FXG_SQ = 0.6;   // 바닥을 세로로 누르는 정도(원근 어림)
  const fxgOn = fl => fxTamOn() && FXG.st === 'ok' && !!fxgTexOk(tamReg(fl).k);
  function fxgTexOk(k) { return !!(IMG(`ex6_${k}_tile`) && IMG(`ex6_${k}_path`)); }
  function fxgTex(k) {
    if (FXG.tex[k] !== undefined) return FXG.tex[k];
    FXG.tex[k] = null; const u = IMG(k); if (!u) return null;
    const im = new Image(); im.onload = () => { try { FXG.tex[k] = window.PIXI.Texture.from(im); fxgRefresh(); } catch (e) { /* 없으면 예전 바닥 */ } }; im.src = u;
    return null;
  }
  // 엔진이나 그림이 늦게 준비되면 지금 탐험 화면에 바로 깔아요(처음 연 뒤 첫 오르기부터 새 길로)
  function fxgRefresh() { try { if (rt.tab === 'tam' && rt.tam && !rt.tam.climbing) { const fl = (rt.tam.F && rt.tam.F.fl) || tamCurFl(); if (FXG.reg && FXG.reg !== tamReg(fl).k) FXG.reg = ''; tamG6(fl); } } catch (e) { /* 다음 걷기에서 */ } }
  async function fxgInit() {
    if (FXG.st || FXL.st !== 'ok') return; const world = $('#tmWorld'); if (!world) return;
    FXG.st = 'load';
    try {
      const P = window.PIXI, app = new P.Application();
      await app.init({ width: Math.max(1, world.clientWidth), height: Math.max(1, world.clientHeight), backgroundAlpha: 0, antialias: true, resolution: Math.min(2, window.devicePixelRatio || 1), autoDensity: true, autoStart: false });
      app.ticker.stop(); const cv = app.canvas; cv.className = 'fxg'; cv.setAttribute('aria-hidden', 'true');
      const bgs = world.querySelector('.tm-bgs'); if (bgs) bgs.after(cv); else world.prepend(cv);
      FXG.app = app; FXG.root = new P.Container(); app.stage.addChild(FXG.root);
      FXG.sq = new P.Container(); FXG.root.addChild(FXG.sq);
      ['ex6_cloud'].forEach(fxgTex);
      FXG.st = 'ok'; cv.hidden = true; fxgRefresh();
    } catch (e) { FXG.st = 'no'; }
  }
  // 대원 무리 가운데와 장난꾸러기 무리 가운데(무대 칸)를 이어 길 방향을 정해요
  function fxgGeom() {
    const world = $('#tmWorld'), W = world.clientWidth, H = world.clientHeight, fl = $('.tm-bg.cur .ly.floor');
    const wr = world.getBoundingClientRect(), k = W / (wr.width || W);
    let top = H * 0.36; if (fl) { const r = fl.getBoundingClientRect(); if (r.height) top = (r.top - wr.top) * k + r.height * k * 0.1; }
    const pt = L => { const n = Math.min(3, L.length); let x = 0, y = 0; for (let i = 0; i < n; i++) { x += L[i][0]; y += L[i][1]; } return [W * x / n / 100, H * (1 - (y / n + TM_UP) / 100)]; };
    const a = pt(TM_PPOS), b = pt(TM_MPOS), loc = ([x, y]) => [x - W / 2, (y - top) / FXG_SQ];
    const la = loc(a), lb = loc(b), dx = lb[0] - la[0], dy = lb[1] - la[1], d = Math.hypot(dx, dy) || 1;
    Object.assign(FXG, { W, H, top, ux: dx / d, uy: dy / d, ang: Math.atan2(dy, dx), mid: [(la[0] + lb[0]) / 2, (la[1] + lb[1]) / 2] });
  }
  // 지역 바닥과 길을 깔아요(force면 그림이 늦게 받아졌을 때 다시)
  function fxgSet(k, force) {
    if (FXG.st !== 'ok') return false; const P = window.PIXI, app = FXG.app, world = $('#tmWorld'); if (!world) return false;
    const tile = fxgTex(`ex6_${k}_tile`), path = fxgTex(`ex6_${k}_path`); fxgTex(`ex6_${k}_gate`);   // 문은 미리 받아 둬요
    if (!tile || !path) { app.canvas.hidden = true; FXG.reg = ''; return false; }   // 그림이 오면 fxgRefresh가 이 지역으로 새로 깔아요(앞 지역 바닥이 남지 않게)
    if (app.screen.width !== world.clientWidth || app.screen.height !== world.clientHeight) { app.renderer.resize(Math.max(1, world.clientWidth), Math.max(1, world.clientHeight)); force = true; }
    if (FXG.reg === k && FXG.floor && !force) { app.canvas.hidden = false; return true; }
    FXG.reg = k; fxgGeom();
    const { W, H, top } = FXG, sq = FXG.sq;
    sq.removeChildren().forEach(c => c.destroy()); FXG.gate = null;
    sq.position.set(W / 2, top); sq.scale.set(1, FXG_SQ);
    const ts = Math.max(0.3, W * 0.8 / 720), LH = (H - top) / FXG_SQ + 40;
    const floor = new P.TilingSprite({ texture: tile, width: W * 3, height: LH + 80 }); floor.position.set(-W * 1.5, -40); floor.tileScale.set(ts); sq.addChild(floor); FXG.floor = floor;
    const len = Math.hypot(W, LH) * 2.2, pw = 256 * ts * 1.05;
    const pa = new P.TilingSprite({ texture: path, width: pw, height: len }); pa.anchor.set(0.5); pa.tileScale.set(ts * 1.05); pa.rotation = FXG.ang + Math.PI / 2; pa.position.set(FXG.mid[0], FXG.mid[1]); sq.addChild(pa); FXG.path = pa;
    // 위쪽 가장자리는 HTML 바닥(풀숲 가장자리)과 이어지게 흐리게. 엔진 8은 여러 조각을 묶은 가림이 투명도를 무시해서(딱 잘림) 그림 한 장으로 가려요
    const mh = H - top + 24, ff = Math.min(0.9, 110 / Math.max(1, mh)), c = document.createElement('canvas'); c.width = 4; c.height = 256;
    { const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(ff, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,1)'); g.fillStyle = gr; g.fillRect(0, 0, 4, 256); }
    if (FXG.mask) FXG.mask.destroy({ texture: true, textureSource: true }); const m = new P.Sprite(P.Texture.from(c));
    m.position.set(0, top - 24); m.width = W; m.height = mh; FXG.root.addChild(m); sq.mask = m; FXG.mask = m;
    const ct = fxgTex('ex6_cloud');
    if (ct && !FXG.cloud) { const cl = new P.TilingSprite({ texture: ct, width: W, height: H * 0.3 }); cl.tileScale.set(H * 0.3 / 512); cl.position.set(0, H * 0.72); cl.alpha = 0; FXG.root.addChild(cl); FXG.cloud = cl; }
    if (FXG.cloud) { FXG.cloud.width = W; FXG.cloud.height = H * 0.3; FXG.cloud.position.set(0, H * 0.72); FXG.root.addChild(FXG.cloud); }
    app.canvas.hidden = false; app.render(); return true;
  }
  // 높이: 지역 안 50층 가운데 어디쯤인지(0~1). 먼 풍경이 내려가고 구름이 짙어져요
  function fxgHeight(fl) {
    const h = ((Math.max(1, fl) - 1) % TAM.regLen) / (TAM.regLen - 1); FXG.h = h;
    const far = $('.tm-bg.cur .ly.far'); if (far) far.style.translate = `0 ${(h * 9).toFixed(1)}%`;
    if (FXG.cloud) { FXG.cloud.alpha = h < 0.3 ? 0 : Math.min(0.75, (h - 0.3) * 1.3); FXG.cloud.tint = { lab: 0xf3e6ff, tower: 0xc9c2f0, yard: 0xffffff }[FXG.reg] || 0xffffff; }
  }
  // 길을 따라 ms 동안 d만큼 흘러요(대원이 오른쪽 위로 가는 만큼 바닥은 왼쪽 아래로)
  function fxgRun(ms, d, gate) {
    if (FXG.st !== 'ok' || !FXG.floor) return;
    FXG.run = ms / 1000; FXG.sp = d / Math.max(0.1, FXG.run);
    if (gate) { const g = fxgTex(`ex6_${FXG.reg}_gate`); if (g) { if (FXG.gate) FXG.gate.destroy(); const s = new window.PIXI.Sprite(g); s.anchor.set(0.5, 0.96); const gh = FXG.H * 0.24; s.scale.set(gh / (g.height || 1)); FXG.root.addChildAt(s, FXG.root.children.indexOf(FXG.mask) + 1); FXG.gate = s; FXG.gs = FXG.W * 0.45; fxgGatePos(); } }
    fxgKick();
  }
  function fxgKick() { if (FXG.st === 'ok' && !FXG.raf) { FXG.last = performance.now(); FXG.raf = requestAnimationFrame(fxgFrame); } }
  function fxgGatePos() { const g = FXG.gate; if (!g) return; const lx = FXG.mid[0] + FXG.ux * FXG.gs, ly = FXG.mid[1] + FXG.uy * FXG.gs; g.position.set(FXG.W / 2 + lx, FXG.top + ly * FXG_SQ); }
  function fxgFrame(now) {
    FXG.raf = 0; const dt = Math.min(0.05, Math.max(0, (now - FXG.last) / 1000)); FXG.last = now;
    if (!fxTamOn() || !FXG.floor) { FXG.run = 0; return; }
    if (FXG.run > 0) {
      const e = Math.min(1, FXG.run / 0.25), v = FXG.sp * e * dt; FXG.run -= dt;   // 끝 0.25초는 천천히 멈춰요
      FXG.floor.tilePosition.x -= FXG.ux * v; FXG.floor.tilePosition.y -= FXG.uy * v;
      FXG.path.tilePosition.y += v;
      if (FXG.cloud && FXG.cloud.alpha > 0) FXG.cloud.tilePosition.x -= v * 0.35;
      if (FXG.gate) { FXG.gs -= v; fxgGatePos(); if (FXG.gs < -Math.hypot(FXG.W, FXG.H) * 0.8) { FXG.gate.destroy(); FXG.gate = null; } }
    }
    FXG.app.render();
    if (FXG.run > 0) FXG.raf = requestAnimationFrame(fxgFrame);
  }
  function fxgHide() { if (FXG.app) FXG.app.canvas.hidden = true; const st = $('#tmStage'); if (st) st.classList.remove('g6'); }
  /* ---------- 미니게임 터지는 효과(효과층 7단계) ----------
     숲속 퍼즐: 줄이 지워지면 블록 그림이 네 조각으로 깨져 떨어져요. 숲속 합치기: 합쳐지면 빛 고리와 별 조각이 퍼져요
     그림판 하나(canvas.fxo)를 퍼즐 판이나 합치기 판에 옮겨 붙여 써요. 값과 저장은 그대로, 엔진이 없거나 움직임 줄이기면 예전 효과 그대로 */
  const FXO = { st: '', app: null, w: null, g: null, parts: [], rings: [], raf: 0, last: 0, tex: {}, star: null, dot: null };
  const fxoOn = () => FXL.st === 'ok' && FXO.st === 'ok' && !rt.reduced;
  async function fxoInit() {
    if (FXO.st || FXL.st !== 'ok') return; FXO.st = 'load';
    try {
      const P = window.PIXI, app = new P.Application();
      await app.init({ width: 4, height: 4, backgroundAlpha: 0, antialias: true, resolution: Math.min(2, window.devicePixelRatio || 1), autoDensity: true, autoStart: false });
      app.ticker.stop(); app.canvas.className = 'fxo'; app.canvas.setAttribute('aria-hidden', 'true');
      FXO.app = app; FXO.w = new P.Container(); FXO.g = new P.Graphics(); app.stage.addChild(FXO.g, FXO.w);
      FXO.star = app.renderer.generateTexture(new P.Graphics().star(0, 0, 5, 10, 4).fill(0xffffff)); FXO.dot = app.renderer.generateTexture(new P.Graphics().circle(0, 0, 6).fill(0xffffff));
      FXO.st = 'ok';
    } catch (e) { FXO.st = 'no'; }
  }
  function fxoHost(host) {
    if (!fxoOn() || !host) return false; const cv = FXO.app.canvas;
    if (cv.parentElement !== host) { fxoClear(); host.appendChild(cv); }
    const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight);
    if (FXO.app.screen.width !== w || FXO.app.screen.height !== h) FXO.app.renderer.resize(w, h);
    return true;
  }
  // 칸 그림 주소(url('...'))로 그림을 받아 둬요. 처음 한 번은 받는 동안 점 조각으로
  function fxoUrlTex(css) {
    const m = /url\(['"]?([^'")]+)['"]?\)/.exec(css || ''); if (!m) return null; const u = m[1];
    if (FXO.tex[u] !== undefined) return FXO.tex[u]; FXO.tex[u] = null;
    const im = new Image(); im.onload = () => { try { FXO.tex[u] = window.PIXI.Texture.from(im); } catch (e) { /* 점 조각 */ } }; im.src = u; return null;
  }
  function fxoPart(tex, x, y, sz, o) {
    const s = new window.PIXI.Sprite(tex); s.anchor.set(0.5); s.x = x; s.y = y; s.scale.set(sz / (tex.frame ? tex.frame.width : tex.width || 1)); if (o.tint) s.tint = o.tint; s.rotation = o.r0 || 0; FXO.w.addChild(s);
    FXO.parts.push({ s, vx: o.vx || 0, vy: o.vy || 0, g: o.g || 0, rot: o.rot || 0, life: o.life, max: o.life, k0: s.scale.x, shrink: !!o.shrink });
  }
  // 블록 하나가 네 조각으로 깨져 떨어져요(그림이 아직 없으면 색 점)
  function fxoShatter(cx, cy, cw, css, tint, delay) {
    const tex = fxoUrlTex(css), P = window.PIXI;
    const go = () => {
      if (tex && tex.source) { const fw = tex.frame.width / 2, fh = tex.frame.height / 2;
        for (let q = 0; q < 4; q++) { const qx = q % 2, qy = q >> 1, t = new P.Texture({ source: tex.source, frame: new P.Rectangle(tex.frame.x + qx * fw, tex.frame.y + qy * fh, fw, fh) });
          const dx = qx ? 1 : -1, dy = qy ? 1 : -1;
          fxoPart(t, cx + dx * cw * 0.25, cy + dy * cw * 0.25, cw * 0.5, { vx: dx * fxRnd(40, 110), vy: dy * fxRnd(20, 60) - fxRnd(160, 260), g: 900, rot: dx * fxRnd(4, 9), life: fxRnd(0.6, 0.8) }); } }
      else for (let q = 0; q < 4; q++) fxoPart(FXO.dot, cx, cy, cw * 0.3, { vx: fxRnd(-110, 110), vy: -fxRnd(150, 250), g: 900, life: 0.6, tint: tint || 0xffe08a, shrink: true });
      fxoKick();
    };
    if (delay) setTimeout(go, delay); else go();
  }
  // 빛 고리와 별 조각(색은 그 조각 색)
  function fxoBurst(cx, cy, r, col, big) {
    const c = typeof col === 'string' && /^#/.test(col) ? parseInt(col.slice(1).padEnd(6, '0').slice(0, 6), 16) : (col || 0xffe08a);
    FXO.rings.push({ x: cx, y: cy, r0: r * 0.3, r1: r * (big ? 1.9 : 1.4), t: 0, d: big ? 0.55 : 0.4, c, w: big ? 5 : 3 });
    const n = big ? 16 : 9;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + fxRnd(-0.2, 0.2), v = fxRnd(90, big ? 260 : 180);
      fxoPart(i % 3 ? FXO.star : FXO.dot, cx, cy, fxRnd(7, big ? 14 : 10), { vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, g: 260, rot: fxRnd(-6, 6), life: fxRnd(0.45, 0.7), tint: i % 2 ? c : 0xfff6c8, shrink: true }); }
    fxoKick();
  }
  function fxoKick() { if (FXO.st === 'ok' && !FXO.raf) { FXO.last = performance.now(); FXO.raf = requestAnimationFrame(fxoFrame); } }
  function fxoClear() { for (const p of FXO.parts) if (!p.s.destroyed) p.s.destroy(); FXO.parts.length = 0; FXO.rings.length = 0; if (FXO.g) FXO.g.clear(); if (FXO.app) FXO.app.render(); }
  function fxoFrame(now) {
    FXO.raf = 0; const dt = Math.min(0.05, Math.max(0, (now - FXO.last) / 1000)); FXO.last = now;
    const cv = FXO.app.canvas; if (!cv.isConnected || !cv.offsetParent) { fxoClear(); return; }
    for (let i = FXO.parts.length - 1; i >= 0; i--) { const p = FXO.parts[i], s = p.s; p.life -= dt;
      if (p.life <= 0) { s.destroy(); FXO.parts.splice(i, 1); continue; }
      p.vy += p.g * dt; s.x += p.vx * dt; s.y += p.vy * dt; s.rotation += p.rot * dt; const k = p.life / p.max; s.alpha = Math.min(1, k * 3); if (p.shrink) s.scale.set(p.k0 * (0.4 + 0.6 * k)); }
    const g = FXO.g; g.clear();
    for (let i = FXO.rings.length - 1; i >= 0; i--) { const R = FXO.rings[i]; R.t += dt; const k = R.t / R.d; if (k >= 1) { FXO.rings.splice(i, 1); continue; }
      const e = 1 - Math.pow(1 - k, 3); g.circle(R.x, R.y, R.r0 + (R.r1 - R.r0) * e).stroke({ width: R.w * (1 - k) + 0.5, color: R.c, alpha: 0.9 * (1 - k) }); }
    FXO.app.render();
    if (FXO.parts.length || FXO.rings.length) FXO.raf = requestAnimationFrame(fxoFrame);
  }
