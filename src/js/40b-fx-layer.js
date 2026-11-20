  /* ---------- 5.2.1 효과층(PixiJS, 2026-11-20 woodani 결정 '엔진 1단계': 지도 위 연출만 엔진으로) ----------
     지도(#map) 바로 위에 투명한 그림판(canvas.fxl)을 한 장 얹어 참나무 흔들림, 잎, 떨어지는 도토리, 줍기 날아가기만 그려요.
     누르기는 그림판을 통과하고(pointer-events none), 게임 규칙과 값과 저장은 그대로예요(떨어질 자리, 줍는 값, 자동 줍기 모두 예전과 같아요).
     엔진 파일(img/lib/pixi.min.js)을 못 받거나 WebGL이 없거나 '움직임 줄이기'면 예전 SVG 연출 그대로예요(fxOn() false).
     배터리: 효과가 있을 때만 그리고, 없으면 멈춰요. 학교 탭이 아니거나 화면이 꺼지면 바로 지워요 */
  const FXL = { st: '', app: null, w: null, tex: {}, parts: [], falls: [], flys: [], raf: 0, last: 0, k: 1, oak: { a: 0, v: 0, s: 1 } };
  const FXL_V = '8.23.0';
  const FXL_SRC = () => window.FS_PIXI_SRC || IMG_BASE() + 'lib/pixi.min.js?v=' + FXL_V;
  const fxOn = () => FXL.st === 'ok' && !rt.reduced && rt.tab === 'school' && !document.hidden;
  // 제안 숫자(woodani가 바꿀 수 있어요): 참나무 처음 흔들림 4도, 연타 때 최대 8도, 잎 6~10장
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
  }
  const fxRnd = (a, b) => a + Math.random() * (b - a);   // 반짝이는 보통 섞기로 그려요(그림판 바탕이 투명이라 더하기 섞기는 거의 안 보여요)
  // 화면 자리(px) ↔ 지도 자리. 지도는 viewBox 0 -60 360 540이라 왼쪽 위가 (0, -60)
  function fxMapPt(cx, cy) { const R = $('#map').getBoundingClientRect(), k = R.width / 360 || 1; return [(cx - R.left) / k, (cy - R.top) / k - 60]; }
  function fxKick() { if (FXL.st === 'ok' && !FXL.raf) { FXL.last = performance.now(); FXL.raf = requestAnimationFrame(fxFrame); } }
  function fxClear() {
    for (const L of [FXL.parts, FXL.falls, FXL.flys]) { for (const p of L) { if (p.s && !p.s.destroyed) p.s.destroy(); if (p.d && p.d.g) { const f = p.d.g.querySelector('.drop-fall'); if (f) f.style.opacity = ''; } } L.length = 0; }
    const cv = $('#oakCanopy'); if (cv) cv.style.transform = ''; FXL.oak.a = FXL.oak.v = 0;
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
    for (let i = FXL.parts.length - 1; i >= 0; i--) { const p = FXL.parts[i]; p.life -= dt; p.vy += p.g * dt; p.s.x += (p.vx + (p.flut ? Math.sin(now / 200 + p.ph) * p.flut : 0)) * dt; p.s.y += p.vy * dt; p.s.rotation += p.rot * dt;
      p.s.alpha = Math.min(1, p.life / p.max * 1.8); if (p.life <= 0) { p.s.destroy(); FXL.parts.splice(i, 1); } }
    // 떨어지는 도토리: 돌면서 떨어지고 바닥에서 두세 번 튀어요. 다 서면 SVG 도토리를 다시 보이고 그림판 것은 지워요
    for (let i = FXL.falls.length - 1; i >= 0; i--) { const f = FXL.falls[i], s = f.s;
      if (f.d.dead) { s.destroy(); FXL.falls.splice(i, 1); continue; }
      f.vy += FXC.g * dt; s.y += f.vy * dt; s.x += f.vx * dt; s.rotation += f.vr * dt; s.scale.set(f.k0 + (f.k1 - f.k0) * Math.min(1, Math.max(0, (s.y - f.sy) / Math.max(1, f.ty - f.sy))));   // 가지의 작은 도토리(13)가 바닥 도토리 크기(22)로
      if (f.vx && (f.vx > 0 ? s.x >= f.tx : s.x <= f.tx)) { s.x = f.tx; f.vx = 0; }
      if (s.y >= f.ty) { s.y = f.ty; f.n++; f.vy = -Math.abs(f.vy) * FXC.bounce; f.vr *= 0.5; s.x = f.tx; f.vx = 0;
        fxBurst(f.tx, f.ty + 8, 3, { tex: FXL.tex.fx_dust_1 || FXL.tex.dot, sz: 7, sp: 22, up: 6, life: 0.5, tint: FXL.tex.fx_dust_1 ? 0xffffff : 0xd9c39a });
        if (f.n >= 3 || Math.abs(f.vy) < 45) { s.rotation = 0; const fall = f.d.g.querySelector('.drop-fall'); if (fall) fall.style.opacity = ''; s.destroy(); FXL.falls.splice(i, 1); continue; } }
      busy = true; }
    // 주운 도토리: 반짝이 꼬리를 그리며 위쪽 도토리 숫자로
    const to = $('#vBudget'), tb = to && to.getBoundingClientRect();
    for (let i = FXL.flys.length - 1; i >= 0; i--) { const f = FXL.flys[i], s = f.s; f.t += dt;
      const [ex, ey] = tb && tb.width ? fxMapPt(tb.left + 8, tb.top + tb.height / 2) : [f.sx, f.sy - 200];
      const u = Math.min(1, f.t / FXC.fly), e = u * u * (3 - 2 * u), a = 1 - e;
      s.x = a * a * f.sx + 2 * a * e * f.mx + e * e * ex; s.y = a * a * f.sy + 2 * a * e * f.my + e * e * ey; s.rotation += dt * 9; s.scale.set(f.sc * (1 - 0.35 * e));
      if (Math.random() < 0.7) fxBurst(s.x, s.y, 1, { tex: FXL.tex.star, sz: 5, sp: 8, life: 0.35, tint: 0xfff2a0, add: true });
      if (u >= 1) { s.destroy(); FXL.flys.splice(i, 1); if (to && to.animate) to.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.22)' }, { transform: 'scale(1)' }], { duration: 300, easing: 'ease-out' }); } }
    if (FXL.parts.length || FXL.falls.length || FXL.flys.length) busy = true;
    app.render();
    if (busy) FXL.raf = requestAnimationFrame(fxFrame);
  }
  function fxSprite(tex, x, y, sz) { const s = new window.PIXI.Sprite(tex); s.anchor.set(0.5); s.x = x; s.y = y; s.scale.set(sz / (tex.width || 1)); FXL.w.addChild(s); return s; }
  function fxBurst(x, y, n, o) {
    if (!o.tex) return;
    for (let i = 0; i < n; i++) { const s = fxSprite(o.tex, x, y, o.sz * fxRnd(0.7, 1.25)), a = o.ang != null ? o.ang + fxRnd(-o.spread, o.spread) : fxRnd(0, Math.PI * 2), sp = o.sp * fxRnd(0.5, 1.3);
      if (o.tint) s.tint = Array.isArray(o.tint) ? o.tint[(Math.random() * o.tint.length) | 0] : o.tint; 
      FXL.parts.push({ s, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - (o.up || 0), rot: fxRnd(-3, 3), life: o.life * fxRnd(0.8, 1.2), max: o.life, g: o.g || 0, flut: o.flut || 0, ph: fxRnd(0, 6) }); }
  }
  // 참나무를 흔들었어요(누를 때마다). 연타하면 더 크게(최대 oakMax)
  function fxOak() {
    if (!fxOn()) return false;
    const o = FXL.oak; o.s = -o.s || 1; const w = Math.sqrt(FXC.oakW);
    o.v = o.s * Math.min(FXC.oakMax * w * 1.6, Math.abs(o.v) + FXC.oakDeg * w * 1.6);   // 감쇠 때문에 1.6배를 줘야 처음 꼭대기가 oakDeg쯤
    const [x, y, r] = oakAt(), lt = [FXL.tex.fx_leaf_1, FXL.tex.fx_leaf_2].filter(Boolean), n = Math.round(fxRnd(FXC.leaves[0], FXC.leaves[1]));
    for (let i = 0; i < n; i++) { const a = fxRnd(0, Math.PI * 2), d = Math.sqrt(Math.random()) * r * 0.75;
      fxBurst(x + Math.cos(a) * d, y - r * 0.35 + Math.sin(a) * d * 0.6, 1, { tex: lt.length ? lt[i % lt.length] : FXL.tex.dot, sz: fxRnd(9, 13), sp: 26, up: 10, life: fxRnd(1.6, 2.4), g: 26, flut: 22, tint: lt.length ? 0 : 0x8fbf4a }); }
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

  /* ---------- 5.2.2 탐험 효과층(2026-11-20 woodani '탐험도 인게임에서'): 탐험 무대(#tmFx) 안에 그림판(canvas.fxt)을 한 장 더 ----------
     지금 탐험 연출(대원 공격 자세, 날아가는 기술 그림, 숫자, 흔들림, 필살기 장면)은 그대로 두고 그 위에 더해요.
     맞을 때 과목 색 반짝이와 먼지, 강한 한 방은 더 크게, 필살기는 충격 고리, 날아가는 기술 그림 뒤 반짝이 꼬리, 쓰러지면 도토리와 재료가 튀어 바닥에 굴러요.
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
