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
  const fxRnd = (a, b) => a + Math.random() * (b - a);
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
      if (o.tint) s.tint = Array.isArray(o.tint) ? o.tint[(Math.random() * o.tint.length) | 0] : o.tint; if (o.add) s.blendMode = 'add';
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
