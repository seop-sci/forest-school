  /* ---------- 마을 층(5.3.1 살아 있는 숲속 마을): 하루의 빛, 날씨, 구름 그림자, 작은 생물, 물결 ----------
     홈 지도에서만 움직여요. 빛과 가장자리 그늘은 지도 위 얇은 막(.wld-tint, .wld-vig), 나머지는 효과층(FXL) 그림판에 같이 그려요.
     그래픽 품질(S.gfx): 0 낮음(지금까지 화면 그대로), 1 보통(초당 20장, 적게), 2 높음(초당 30장). -1은 자동(폰 성능으로)
     값과 규칙과 저장은 건드리지 않아요. 비와 눈은 그날의 게임 날씨를 엔진으로 더 곱게 그리는 것이에요(예전 CSS 비와 눈은 이때 숨겨요) */
  const WLD = { st: '', lv: -1, ph: '', wx: '', key: '', tint: null, vig: null, mc: null, sc: null, tex: {}, parts: [], next: {}, timer: 0, last: 0, water: [], wv: 0, tier0: null, curWait: false };
  const WLD_FPS = [0, 20, 30];
  // 제안 숫자: 빗방울 수, 눈송이 수, 반딧불 수, 나비 수(보통, 높음)
  const WLD_N = { rain: [30, 60], snow: [35, 70], fly: [5, 10], bfly: [2, 3], cloud: [0, 3] };
  const WLD_WATER = {"map_elem":[[18,186],[2,230],[18,258],[14,294],[26,358],[2,382]],"map_high":[[338,66],[358,94],[338,122],[354,150],[346,182],[186,206],[350,214],[354,246]],"map_kinder":[[22,126],[186,218],[2,350],[34,366],[42,398]]};   // dev/water_spots.py로 고른 물 자리
  // 자동은 '높음'을 고르지 않아요(안드로이드 웹뷰는 중급 폰도 메모리를 8로 알려요). 홈에서 느리면 그 기기에서 한 단계 낮춰요(wldFpsWatch)
  function wldAuto() {
    const c = navigator.hardwareConcurrency || 4, base = c >= 4 ? 1 : 0;
    let cap = 9; try { cap = +(localStorage.getItem(WLD_CAP_KEY) || 9); } catch (e) { /* 저장소를 못 쓰면 그대로 */ }
    return Math.max(0, Math.min(base, cap));
  }
  const WLD_CAP_KEY = 'forest-school-gfxcap';   // 이 기기에서 자동 품질을 낮춘 단계(게임 저장과 따로, 기기마다)
  const wldLv = () => rt.reduced || !S ? 0 : rt.photo ? 2 : (S.gfx >= 0 ? S.gfx : wldAuto());
  const wldMonth = () => new Date(gameNow() + KST_MS).getUTCMonth() + 1;
  const wldBg = () => { try { return thOn().bg || ''; } catch (e) { return ''; } };
  function wldPhase() {
    if (rt.wldPh) return rt.wldPh;   // 사진 모드에서 고른 시간
    const h = kstHour(gameNow());
    return isNight() ? 'night' : h < 9 ? 'morning' : h >= 17 ? 'evening' : 'day';
  }
  // 날씨는 그날 정해지는 게임 날씨(wxOf, 37-season.js)를 따라요. 날씨 효과를 끈 사람(S.wxOff)은 맑음처럼
  function wldWeather() {
    if (rt.wldWx != null) return rt.wldWx;   // 사진 모드에서 고른 날씨('' 맑음)
    if (!S || S.wxOff || rt.viewTier != null) return '';
    const k = wxOf(); return k === 'rain' || k === 'snow' ? k : '';
  }
  function wldDom() {
    if (WLD.tint) return true;
    const mp = $('#map'); if (!mp) return false;
    WLD.tint = document.createElement('div'); WLD.tint.className = 'wld-tint'; WLD.tint.setAttribute('aria-hidden', 'true');
    WLD.vig = document.createElement('div'); WLD.vig.className = 'wld-vig'; WLD.vig.setAttribute('aria-hidden', 'true');
    ($('.frame canvas.fxl') || mp).after(WLD.tint, WLD.vig);   // 효과층 그림판은 늘 지도 바로 뒤(겹치는 차례는 z-index)
    return true;
  }
  // 날씨, 시간, 품질을 다시 보고 막과 소리와 움직임을 맞춰요(탭을 바꿀 때와 15초마다)
  function wldSync() {
    if (!S || !wldDom()) return;
    if (rt.photo && rt.tab !== 'school') photoClose();
    const lv = wldLv(), home = rt.tab === 'school' && !document.hidden, ph = lv ? wldPhase() : '', wx = lv ? wldWeather() : '';
    WLD.lv = lv; WLD.ph = ph; WLD.wx = wx;
    const hsN = $('#map') && $('#map').classList.contains('hs-night');   // 고등학교부터의 밤은 예전 밤 화면(창문 불빛)이 맡아요
    WLD.tint.className = 'wld-tint' + (lv && ph ? ' ph-' + ph : '') + (hsN ? ' hs' : '') + (wx ? ' wx-' + wx : '') + (S.nl && !rt.photo ? ' nl' + S.nl : '');
    kidsNightSync(); renderTierDots();   // 밤에는 학생 셋 중 하나만, 밤 밝기 단추
    WLD.vig.className = 'wld-vig' + (lv >= 2 ? ' on' : '');
    rt.ambWx = home ? wx : '';
    const key = (geo().map || '').replace(/_(spring|summer|autumn|winter|xmas|space|retro|lux)$/, '');
    if (key !== WLD.key) { WLD.key = key; WLD.water = WLD_WATER[key] || []; wldReset(); }
    if (home && lv && FXL.st === 'ok') wldStart(); else wldStop();
    if (lv && !FXL.st) fxWant();
    wldFpsWatch();
  }
  function wldPixi() {
    if (WLD.st) return WLD.st === 'ok';
    if (FXL.st !== 'ok') return false;
    const P = window.PIXI, r = FXL.app.renderer, cv = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d')); return P.Texture.from(c); };
    WLD.mc = new P.Container(); FXL.w.addChildAt(WLD.mc, 0);   // 지도 자리: 구름 그림자, 물결, 생물(효과 밑)
    WLD.sc = new P.Container(); FXL.app.stage.addChild(WLD.sc);   // 화면 자리: 비와 눈(맨 위)
    WLD.tex.soft = cv(128, 128, g => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.6, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
    WLD.tex.drop = cv(4, 40, g => { const gr = g.createLinearGradient(0, 0, 0, 40); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,.75)'); g.fillStyle = gr; g.fillRect(1, 0, 2, 40); });
    WLD.tex.ring = r.generateTexture(new P.Graphics().ellipse(0, 0, 20, 8).stroke({ width: 1.6, color: 0xffffff, alpha: 0.9 }));
    WLD.st = 'ok'; return true;
  }
  function wldTex(k) {
    if (WLD.tex[k] !== undefined) return WLD.tex[k];
    WLD.tex[k] = null; const u = IMG(k); if (!u) return null;
    const im = new Image(); im.onload = () => { try { WLD.tex[k] = fxTexSm(im); } catch (e) { /* 없으면 그 생물만 빠져요 */ } }; im.src = u;
    return null;
  }
  function wldReset() { for (const p of WLD.parts) if (p.s && !p.s.destroyed) p.s.destroy(); WLD.parts.length = 0; WLD.next = {}; }
  function wldStart() { if (!wldPixi()) return; WLD.mc.visible = WLD.sc.visible = true; const fr = $('.frame'); if (fr) fr.classList.add('wld-on'); if (!WLD.timer) { WLD.last = performance.now(); WLD.timer = setTimeout(wldTick, 0); } }
  function wldStop() {
    clearTimeout(WLD.timer); WLD.timer = 0; const fr = $('.frame'); if (fr) fr.classList.remove('wld-on');
    if (WLD.st === 'ok') { wldReset(); WLD.mc.visible = WLD.sc.visible = false; if (!FXL.raf) fxShow(false); }
  }
  function wldTick() {
    WLD.timer = 0;
    if (!WLD.lv || rt.tab !== 'school' || document.hidden || FXL.st !== 'ok') { wldStop(); return; }
    requestAnimationFrame(now => {
      const dt = Math.min(0.1, Math.max(0, (now - WLD.last) / 1000)); WLD.last = now;
      try { wldStep(dt, now); } catch (e) { /* 한 장 실패는 넘어가요 */ }
      if (WLD.lv) WLD.timer = setTimeout(wldTick, WLD.parts.length ? 1000 / WLD_FPS[WLD.lv] : 250);   // 그릴 것이 없으면 0.25초마다 새로 나올 것만 봐요
    });
  }
  const wldRnd = (a, b) => a + Math.random() * (b - a);
  function wldAdd(tex, x, y, sz, o, screen) {
    const s = new window.PIXI.Sprite(tex); s.anchor.set(0.5); s.x = x; s.y = y; s.scale.set(sz / (tex.width || 1));
    if (o.add) s.blendMode = 'add'; if (o.alpha != null) s.alpha = o.alpha; if (o.tint) s.tint = o.tint;
    (screen ? WLD.sc : WLD.mc).addChild(s); const p = Object.assign({ s, k0: s.scale.x, t: 0 }, o); WLD.parts.push(p); return p;
  }
  const wldCount = kind => WLD.parts.reduce((n, p) => n + (p.kind === kind), 0);
  // 지금 화면에 보이는 지도 칸(지도 좌표)
  // 지도 자리는 지도가 움직였을 때만 다시 재요(getBoundingClientRect를 프레임마다 부르면 화면 배치를 다시 셈)
  function wldRects() {
    const fr = $('.frame'), mp = $('#map'); if (!fr || !mp) return null;
    const key = mp.style.transform + '|' + mp.className.baseVal + mp.getAttribute('class') + '|' + rt.mapS + '|' + rt.zoom + '|' + fr.clientWidth + 'x' + fr.clientHeight;
    if (WLD.rk !== key || mp.classList.contains('cam-move')) { WLD.rk = key; WLD.F = fr.getBoundingClientRect(); WLD.R = mp.getBoundingClientRect(); }
    return [WLD.F, WLD.R, fr];
  }
  function wldView() {
    const r = wldRects(); if (!r) return [0, -60, 360, 480];
    const [F, R] = r, k = R.width / 360 || 1;
    return [(F.left - R.left) / k, (F.top - R.top) / k - 60, (F.right - R.left) / k, (F.bottom - R.top) / k - 60];
  }
  function wldStep(dt, now) {
    const app = FXL.app, rr = wldRects(); if (!rr) return; const [F, R, fr] = rr;
    if (!FXL.raf) {   // 효과층이 쉬고 있으면 지도 자리를 여기서 맞춰요(움직이는 중이면 효과층이 맞춰요)
      if (app.screen.width !== fr.clientWidth || app.screen.height !== fr.clientHeight) app.renderer.resize(Math.max(1, fr.clientWidth), Math.max(1, fr.clientHeight));
      const k = R.width / 360 || 1;
      FXL.k = k; FXL.w.scale.set(k); FXL.w.x = R.left - F.left - fr.clientLeft; FXL.w.y = R.top - F.top - fr.clientTop + 60 * k;
    }
    const lv = WLD.lv, hi = lv >= 2 ? 1 : 0, ph = WLD.ph, wx = WLD.wx, W = app.screen.width, H = app.screen.height, V = wldView(), m = wldMonth(), bg = wldBg();
    const wint = bg === 'winter' || bg === 'xmas' || m === 12 || m <= 2, dayish = ph === 'day' || ph === 'morning';
    WLD.mc.tint = ph === 'night' ? 0x8a93c8 : ph === 'evening' ? 0xffd2b0 : 0xffffff;
    const due = (k, a, b) => { if (!WLD.next[k]) WLD.next[k] = now + wldRnd(a, b) * 500; if (now < WLD.next[k]) return false; WLD.next[k] = now + wldRnd(a, b) * 1000; return true; };
    // 비와 눈(화면 자리)
    const nR = wx === 'rain' ? WLD_N.rain[hi] : 0, nS = wx === 'snow' ? WLD_N.snow[hi] : 0;
    for (let c = wldCount('rain'); c < nR; c++) wldAdd(WLD.tex.drop, wldRnd(-40, W + 40), wldRnd(-H, 0), wldRnd(2.2, 3), { kind: 'rain', vy: wldRnd(520, 680), alpha: wldRnd(0.5, 0.8) }, true).s.rotation = 0.18;
    for (let c = wldCount('snow'); c < nS; c++) wldAdd(WLD.tex.soft, wldRnd(0, W), wldRnd(-H, 0), wldRnd(5, 10), { kind: 'snow', vy: wldRnd(28, 55), ph: wldRnd(0, 6), alpha: wldRnd(0.6, 0.95) }, true);
    // 구름 그림자(맑은 낮, 높음만)
    const nC = dayish && !wx ? WLD_N.cloud[hi] : 0;
    for (let c = wldCount('cloud'); c < nC; c++) { const p = wldAdd(WLD.tex.soft, wldRnd(-140, 300), wldRnd(0, 420), 200, { kind: 'cloud', vx: wldRnd(4, 7), alpha: 0, a1: wldRnd(0.07, 0.11), tint: 0x23402a }); p.s.scale.y = p.k0 * 0.55; }
    // 반딧불(노을과 밤, 비나 눈이 없을 때)
    const nF = (ph === 'night' || ph === 'evening') && !wx && !wint ? WLD_N.fly[hi] : 0;
    for (let c = wldCount('fly'); c < nF; c++) wldAdd(WLD.tex.soft, wldRnd(V[0], V[2]), wldRnd(Math.max(40, V[1]), V[3]), wldRnd(8, 11), { kind: 'fly', add: true, tint: 0xe8ff8a, alpha: 0, ph: wldRnd(0, 6), vx: wldRnd(-6, 6), vy: wldRnd(-5, 5) });
    // 나비와 잠자리(맑은 낮, 봄부터 가을까지)
    const nB = dayish && !wx && !wint && m >= 3 && m <= 10 ? WLD_N.bfly[hi] : 0;
    if (wldCount('bfly') < nB && due('bfly', 2, 6)) {
      const dragon = m >= 7 && Math.random() < 0.35, c = ['y', 'w', 'b'][(Math.random() * 3) | 0], k1 = dragon ? 'fx_dfly_1' : `fx_bfly_${c}_1`, t1 = wldTex(k1), t2 = wldTex(dragon ? 'fx_dfly_2' : `fx_bfly_${c}_2`);
      if (t1 && t2) { const x = wldRnd(V[0] + 20, V[2] - 20), y = wldRnd(Math.max(60, V[1] + 40), V[3] - 40); wldAdd(t1, x, y, dragon ? 15 : 11, { kind: 'bfly', t1, t2, dragon, tx: x, ty: y, life: wldRnd(14, 26), alpha: 0 }); }
    }
    // 새 떼(맑을 때 가끔, 지도 위쪽 하늘을 가로질러요)
    if (!wx && ph !== 'night' && due('bird', 30, 70)) {
      const t1 = wldTex('fx_bird_1'), t2 = wldTex('fx_bird_2');
      if (t1 && t2) { const dir = Math.random() < 0.5 ? 1 : -1, y0 = wldRnd(-40, 70), n = 3 + ((Math.random() * 3) | 0);
        for (let i = 0; i < n; i++) { const p = wldAdd(t1, (dir > 0 ? -30 : 390) - dir * i * wldRnd(10, 16), y0 + wldRnd(-10, 10) + i * 3, wldRnd(8, 10), { kind: 'bird', t1, t2, vx: dir * wldRnd(36, 44), vy: wldRnd(-2, 2), ph: wldRnd(0, 6) }); p.s.scale.x *= -dir; } }
    }
    // 바람에 날리는 잎(맑은 낮, 가끔)
    if (dayish && !wx && due('leaf', 7, 16)) {
      const ks = bg === 'spring' ? ['fxe_petal_1', 'fxe_petal_2', 'fxe_petal_3'] : bg === 'autumn' || (m >= 9 && m <= 11) ? ['tr_leaf_2', 'fx_leaf_1'] : wint ? [] : ['fx_leaf_1', 'fx_leaf_2', 'fx_leaf_3'];
      const y0 = wldRnd(Math.max(40, V[1]), V[3] - 60);
      for (let i = 0; i < 3 + ((Math.random() * 3) | 0); i++) { const t = wldTex(ks[i % (ks.length || 1)]); if (t) wldAdd(t, V[0] - 20 - i * wldRnd(15, 30), y0 + wldRnd(-30, 30), wldRnd(7, 10), { kind: 'leaf', vx: wldRnd(45, 70), vy: wldRnd(4, 14), rot: wldRnd(-3, 3), ph: wldRnd(0, 6), life: 12 }); }
    }
    // 물결(물이 보이는 지도만, 비가 오면 자주)
    let wv = 0; for (const [x, y] of WLD.water) if (x >= V[0] - 10 && x <= V[2] + 10 && y >= V[1] && y <= V[3]) wv++;
    const wa = Math.min(1, wv / 3); if (Math.abs(wa - WLD.wv) > 0.05) { WLD.wv = wa; rt.ambWater = wa; }
    if (wv && due('ring', wx === 'rain' ? 0.25 : 0.9, wx === 'rain' ? 0.6 : 2)) { const [x, y] = WLD.water[(Math.random() * WLD.water.length) | 0]; wldAdd(WLD.tex.ring, x + wldRnd(-6, 6), y + wldRnd(-5, 5), 8, { kind: 'ring', life: 1.6, alpha: 0.7 }); }
    // 움직이기
    for (let i = WLD.parts.length - 1; i >= 0; i--) {
      const p = WLD.parts[i], s = p.s; p.t += dt; let dead = false;
      if (p.kind === 'rain') { s.y += p.vy * dt; s.x += p.vy * 0.18 * dt; if (s.y > H + 30) { if (wldCount('rain') > nR) dead = true; else { s.y = wldRnd(-60, -20); s.x = wldRnd(-40, W); } } }
      else if (p.kind === 'snow') { s.y += p.vy * dt; s.x += Math.sin(now / 900 + p.ph) * 14 * dt; if (s.y > H + 10) { if (wldCount('snow') > nS) dead = true; else { s.y = -10; s.x = wldRnd(0, W); } } }
      else if (p.kind === 'cloud') { s.x += p.vx * dt; s.alpha = Math.min(p.a1, s.alpha + dt * 0.02); if (s.x > 480 || nC === 0) { s.alpha -= dt * 0.05; if (s.x > 480 || s.alpha <= 0) dead = true; } }
      else if (p.kind === 'fly') { p.vx += wldRnd(-8, 8) * dt; p.vy += wldRnd(-8, 8) * dt; p.vx *= 0.99; p.vy *= 0.99; s.x += p.vx * dt; s.y += p.vy * dt; s.alpha = nF ? 0.35 + 0.65 * Math.max(0, Math.sin(now / 700 + p.ph)) : s.alpha - dt; if (!nF && s.alpha <= 0) dead = true; }
      else if (p.kind === 'bfly') {
        if (Math.hypot(p.tx - s.x, p.ty - s.y) < 4) { p.tx = s.x + wldRnd(-60, 60); p.ty = s.y + wldRnd(-40, 40); }
        const dx = p.tx - s.x, dy = p.ty - s.y, d = Math.hypot(dx, dy) || 1, sp = p.dragon ? 34 : 16;
        s.x += dx / d * sp * dt; s.y += dy / d * sp * dt + (p.dragon ? 0 : Math.sin(now / 160) * 6 * dt);
        s.texture = (now / (p.dragon ? 60 : 130)) % 2 < 1 ? p.t1 : p.t2; s.scale.x = Math.abs(s.scale.x) * (dx < 0 ? -1 : 1);
        p.life -= dt; s.alpha = Math.min(1, p.t, Math.max(0, p.life)); if (p.life <= 0 || nB === 0) dead = true;
      }
      else if (p.kind === 'bird') { s.x += p.vx * dt; s.y += p.vy * dt + Math.sin(now / 400 + p.ph) * 4 * dt; s.texture = (now / 180 + p.ph) % 2 < 1 ? p.t1 : p.t2; if (s.x < -60 || s.x > 420) dead = true; }
      else if (p.kind === 'leaf') { s.x += p.vx * dt; s.y += (p.vy + Math.sin(now / 300 + p.ph) * 18) * dt; s.rotation += p.rot * dt; p.life -= dt; if (p.life <= 0 || s.x > V[2] + 30) dead = true; }
      else if (p.kind === 'ring') { const u = p.t / p.life; s.scale.set(p.k0 * (0.4 + u * 1.2)); s.alpha = 0.7 * (1 - u); if (u >= 1) dead = true; }
      if (dead) { s.destroy(); WLD.parts.splice(i, 1); }
    }
    if (!FXL.raf) { if (WLD.parts.length) { fxShow(true); app.render(); } else fxShow(false); }   // 그릴 생물이 없으면 그리지 않고 그림판을 숨겨요
  }
  setInterval(() => { try { wldSync(); } catch (e) { /* 다음에 */ } }, 15000);
  document.addEventListener('visibilitychange', () => { try { wldSync(); } catch (e) { /* 다음에 */ } });
  window.addEventListener('load', () => setTimeout(() => { try { wldSync(); } catch (e) { /* 다음에 */ } }, 2600));   // 효과층(1.5초 뒤 받기) 다음에
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('#optGfx [data-gfx]'); if (!b || !S) return;
    const v = +b.dataset.gfx; if (v === S.gfx) return;
    S.gfx = v; save(); syncSettingsUI(); sfx('tap'); FXL.touched = true; wldSync();
  });
  // 조용한 손맛: 앱에서 단추를 누르면 아주 짧게 떨려요(진동을 켠 사람만, 그래픽 낮음은 빼요)
  let wldTapT = 0;
  document.addEventListener('pointerdown', e => {
    if (!S || !S.vibrate || !APP_PACK() || wldLv() < 1) return;
    if (!e.target.closest || !e.target.closest('button, [role="button"], .tab')) return;
    const t = performance.now(); if (t - wldTapT < 80) return; wldTapT = t;
    buzz(6);
  }, { capture: true, passive: true });
  // 학교급이 오르면(졸업식이 끝나고 홈 지도로 돌아오면) 구름 막이 걷히며 새 학교가 보여요
  function wldCurtain() {
    const fr = $('.frame'), u = [1, 2, 3].map(i => IMG('tr_cloud_' + i)); if (!fr || u.some(x => !x)) return;
    const c = document.createElement('div'); c.className = 'wld-cur'; c.setAttribute('aria-hidden', 'true');
    c.innerHTML = `<img class="c1" src="${u[0]}" alt=""><img class="c2" src="${u[1]}" alt=""><img class="c3" src="${u[2]}" alt="">`;
    fr.appendChild(c); setTimeout(() => c.remove(), 3000);
  }
  setInterval(() => {
    if (!S) return;
    if (WLD.tier0 == null) { WLD.tier0 = S.tier; return; }
    if (S.tier > WLD.tier0) { WLD.tier0 = S.tier; WLD.curWait = true; }
    if (WLD.curWait && rt.tab === 'school' && !rt.modalOpen && !rt.cereOn && !document.hidden) { WLD.curWait = false; if (wldLv() >= 1) wldCurtain(); }
  }, 400);
  // 사진 모드: 글과 단추를 숨기고 마을만. 시간과 날씨를 골라 볼 수 있어요(저장은 휴대폰 화면 캡처로)
  const PH_T = [['morning', '아침'], ['day', '낮'], ['evening', '노을'], ['night', '밤']], PH_W = [['', '맑음'], ['rain', '비'], ['snow', '눈']];
  function photoOpen() {
    if (!S) return;
    if (rt.modalOpen) closeModal(rt.modalOpen);
    setTab('school'); rt.photo = true; rt.wldPh = wldPhase(); rt.wldWx = wldWeather(); document.body.classList.add('photo');
    const b = document.createElement('div'); b.className = 'photo-bar'; b.id = 'photoBar';
    const seg = (id, L, cur, k) => `<div class="seg" id="${id}" role="radiogroup">${L.map(([v, t]) => `<button type="button" role="radio" data-${k}="${v}" aria-checked="${v === cur}">${t}</button>`).join('')}</div>`;
    b.innerHTML = seg('phT', PH_T, rt.wldPh, 'pht') + seg('phW', PH_W, rt.wldWx, 'phw') + '<button type="button" class="btn-sub" id="phX">닫기</button>';
    document.body.appendChild(b); wldSync();
    requestAnimationFrame(() => { const fr = $('.frame'); if (!fr || !rt.mapS) return; const z = Math.min(ZOOM_MAX, Math.max(1, fr.clientHeight / (rt.mapH / (rt.zoom || 1)))); rt.zoom = z; fitMap(false); panTo((fr.clientWidth - rt.mapW) / 2, (fr.clientHeight - rt.mapH) / 2); });   // 지도가 화면 위아래를 다 채우게
  }
  function photoClose() {
    rt.photo = false; rt.wldPh = undefined; rt.wldWx = undefined; document.body.classList.remove('photo');
    const b = $('#photoBar'); if (b) b.remove(); wldSync(); if (rt.tab === 'school') fitMap(true);
  }
  document.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('#optPhoto, #photoBar button'); if (!t) return;
    if (t.id === 'optPhoto') { sfx('tap'); photoOpen(); return; }
    if (t.id === 'phX') { sfx('tap'); photoClose(); return; }
    if (t.dataset.pht != null) rt.wldPh = t.dataset.pht; else if (t.dataset.phw != null) rt.wldWx = t.dataset.phw; else return;
    t.parentNode.querySelectorAll('button').forEach(x => x.setAttribute('aria-checked', x === t ? 'true' : 'false')); sfx('tap'); wldSync();
  });
  // 자동 품질 지키기: 홈에서 5초 동안 잰 평균이 초당 45장 아래면 이 기기에서 한 단계 낮추고 한 번만 알려요
  // 자동(S.gfx -1)일 때만, 사진 모드와 직접 고른 품질은 그대로. 처음 켠 뒤 8초와 다른 탭, 창이 열린 때는 재지 않아요
  const WLD_FPS_MIN = 45;
  function wldFpsWatch() {
    if (WLD.fw || !S || S.gfx !== -1 || rt.photo || wldLv() < 1 || rt.tab !== 'school' || document.hidden || performance.now() < 8000) return;
    WLD.fw = true; let n = 0, t0 = 0;
    const f = t => {
      if (S.gfx !== -1 || rt.photo || rt.tab !== 'school' || rt.modalOpen || document.hidden) { WLD.fw = false; return; }
      if (!t0) t0 = t; n++;
      if (t - t0 < 5000) { requestAnimationFrame(f); return; }
      const fps = n / ((t - t0) / 1000); WLD.fps = Math.round(fps);
      if (fps < WLD_FPS_MIN) {
        const lv = wldLv(); try { localStorage.setItem(WLD_CAP_KEY, String(Math.max(0, lv - 1))); } catch (e) { /* 이번에만 */ }
        let told = false; try { told = !!localStorage.getItem(WLD_CAP_KEY + '-told'); localStorage.setItem(WLD_CAP_KEY + '-told', '1'); } catch (e) { /* 그대로 */ }
        if (!told) toast('화면이 느려서 그래픽을 한 단계 낮췄어요.\n설정에서 바꿀 수 있어요');
        wldSync(); syncSettingsUI();
      }
      setTimeout(() => { WLD.fw = false; wldFpsWatch(); }, 30000);   // 30초 뒤 다시
    };
    requestAnimationFrame(f);
  }
  // 초당 장수 보기(재기 도구): 화면 왼쪽 위 작은 숫자, 지난 5초 평균. 웹은 개발자 메뉴 단추, 토스와 앱은 설정 > 정보의 버전 줄을 빠르게 다섯 번
  function fpsToggle() {
    let el = $('#fpsMeter');
    if (el) { el.remove(); WLD.fpsOn = false; return; }
    el = document.createElement('div'); el.id = 'fpsMeter'; el.className = 'fps-meter'; el.setAttribute('aria-hidden', 'true'); document.body.appendChild(el);
    WLD.fpsOn = true; const ts = [];
    const f = t => {
      if (!WLD.fpsOn) return;
      ts.push(t); while (ts.length && t - ts[0] > 5000) ts.shift();
      if (!el.dataset.t || t - +el.dataset.t > 500) { el.dataset.t = t; const s = ts.length > 1 ? (ts.length - 1) / ((t - ts[0]) / 1000) : 0; el.textContent = Math.round(s) + ' fps ' + ['낮음', '보통', '높음'][wldLv()] + (FXL.st === 'ok' ? '' : ', 엔진 없음'); }
      requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  }
  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#devFps')) fpsToggle(); });
