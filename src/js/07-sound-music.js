  /* ---------- 소리와 진동 ---------- */
  let actx = null, master = null;
  function ensureAudio(force) {
    if (!S || !(S.sound || S.bgm || S.ambV || force)) return;
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      // 같은 창에서 게임이 다시 시작되면(Claude 화면 게임이 새 판으로 바뀔 때 등) 앞 판의 소리가 계속 남아 음악이 겹쳤어요. 앞 판 소리는 닫고 시작해요
      try { if (window.__fsAudio && window.__fsAudio !== actx) { window.__fsAudio.close().catch(() => {}); } } catch (e) { /* 무시 */ }
      try { actx = new AC(); master = actx.createGain(); master.gain.value = 0.5; master.connect(actx.destination); window.__fsAudio = actx; } catch (e) { actx = null; return; }
    }
    if (actx.state === 'suspended' && !document.hidden && !rt.paused && !rt.adOpen) actx.resume().catch(() => {});   // 광고 중에 화면을 다시 보거나 눌러도 소리를 되살리지 않아요
    musicSync();
  }
  /* 소리 지킴이(웹판 숲속 퍼즐 중 배경음악이 '삐~' 소리로 바뀌어 퍼즐을 나갈 때까지 이어짐)
     기기의 소리 출력이 걸리면 마지막 소리 조각이 되풀이되어 '삐~' 하고 들리고, 그동안 소리 시계(actx.currentTime)가 거의 가지 않아요
     켜져 있는데 2초 넘게 소리 시계가 거의 멈춰 있으면 소리를 닫고 새로 열어 곡을 처음부터 다시 틀어요(풀어 둔 곡은 그대로 써요). 1초마다 봐요 */
  const AW = { wall: 0, at: 0, bad: 0, resets: 0 };
  function audioWatch() {
    if (!actx || actx.state !== 'running' || document.hidden || rt.paused || rt.adOpen) { AW.wall = 0; AW.bad = 0; return; }
    const w = performance.now() / 1000, a = actx.currentTime;
    if (AW.wall) {
      const dw = w - AW.wall, da = a - AW.at;
      if (dw > 0.8 && dw < 5 && da < dw * 0.2) AW.bad += 1; else AW.bad = 0;
      if (AW.bad >= 2) { AW.bad = 0; AW.wall = 0; audioReset(); return; }
    }
    AW.wall = w; AW.at = a;
  }
  function audioReset() {
    AW.resets += 1;
    const old = actx;
    clearInterval(Music.timer); Music.timer = 0;
    Music.cur = ''; Music.bus = null; Music.src = null; Music.out = null; Music.track = null; Music.noise = null;
    actx = null; master = null;
    try { if (old) old.close().catch(() => {}); } catch (e) { /* 이미 닫힘 */ }
    try { if (window.__fsAudio === old) window.__fsAudio = null; } catch (e) { /* 무시 */ }
    bgmBuf.clear();   // 풀어 둔 곡은 앞 소리판 것이라 새로 풀어요
    ensureAudio(true);
  }
  function note(freq, at, dur, type, vol, partial) {
    const t0 = actx.currentTime + at;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
    if (partial) {
      const o2 = actx.createOscillator(), g2 = actx.createGain();
      o2.type = 'sine'; o2.frequency.setValueAtTime(freq * partial, t0);
      g2.gain.setValueAtTime(0.0001, t0);
      g2.gain.exponentialRampToValueAtTime(vol * 0.25, t0 + 0.012);
      g2.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * 0.6);
      o2.connect(g2); g2.connect(master); o2.start(t0); o2.stop(t0 + dur);
    }
  }
  function sfx(name) {
    if (!S || !S.sound || rt.batch) return;   // 모두 받기 동안에는 소리를 겹쳐 내지 않아요
    ensureAudio();
    if (!actx) return;
    try {
      if (name === 'tap') note(740, 0, 0.07, 'triangle', 0.07);
      else if (name.startsWith('pz')) { const L = +name.slice(2) || 0; if (!L) { note(620, 0, 0.06, 'triangle', 0.07); note(880, 0.04, 0.08, 'triangle', 0.06); } else { const f = 740 * Math.pow(1.122, L); note(f, 0, 0.1, 'triangle', 0.12); note(f * 1.5, 0.07, 0.16, 'triangle', 0.11); if (L >= 3) note(f * 2, 0.14, 0.22, 'triangle', 0.1); } }
      else if (name === 'coin') { note(988, 0, 0.1, 'triangle', 0.13); note(1319, 0.07, 0.18, 'triangle', 0.13); }
      // 이어서 줍거나 꾹 눌러 올릴 때: 도토리 소리가 한 번마다 반음씩 높아져요(여덟 번까지)
      else if (name.startsWith('combo')) { const m = Math.pow(2, Math.min(8, +name.slice(5) || 0) / 12); note(988 * m, 0, 0.09, 'triangle', 0.12); note(1319 * m, 0.06, 0.15, 'triangle', 0.12); }
      else if (name === 'buy') { note(523.25, 0, 0.14, 'triangle', 0.12); note(659.25, 0.08, 0.14, 'triangle', 0.12); note(783.99, 0.16, 0.26, 'triangle', 0.12); }
      else if (name === 'shutter') { note(2200, 0, 0.025, 'square', 0.035); note(1400, 0.06, 0.04, 'square', 0.03); }   // 사진 찰칵
      else if (name === 'deny') note(196, 0, 0.16, 'square', 0.04);
      else if (name === 'leaf') { note(1150, 0, 0.04, 'triangle', 0.022); note(860, 0.035, 0.05, 'triangle', 0.018); }
      else if (name === 'tamWind') { note(330, 0, 0.14, 'sine', 0.1); note(440, 0.13, 0.18, 'triangle', 0.09); }
      else if (name === 'tamCounter') { note(165, 0, 0.13, 'triangle', 0.14); note(660, 0.025, 0.11, 'sine', 0.1); }
      else if (name === 'magpie') { note(1480, 0, 0.07, 'square', 0.03); note(1320, 0.13, 0.08, 'square', 0.03); }
      else if (name === 'done') { note(783.99, 0, 0.18, 'sine', 0.14, 2); note(1174.66, 0.12, 0.32, 'sine', 0.14, 2); }
      else if (name === 'quest') [1046.5, 1318.51, 1567.98, 2093].forEach((f, i) => note(f, i * 0.07, 0.22 + i * 0.05, 'triangle', 0.11));
      else if (name === 'bell') { /* 학교 종소리(딩동댕동)는 이제 어디서도 울리지 않아요 */ }
    } catch (e) { /* 소리 실패는 무시 */ }
  }
  function buzz(ms) {   // 숫자 하나나 [켜짐, 꺼짐, 켜짐] 패턴
    if (!S || !S.vibrate) return;
    try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* 진동을 못 쓰는 환경 */ }
  }

  /* ---------- 배경음악 ----------
     배경 테마 곡과 파일이 없을 때는 Web Audio로 직접 연주해요. 코드 곡은 모두 이 게임을 위해 새로 쓴 곡이에요
     학교 탭은 배경 테마마다 곡이 바뀌고(테마가 없으면 홈 곡), 다른 탭은 모두 같은 곡, 학교 행사 중에는 행사 곡이 나와요
     악보: 한 칸은 8분음표예요. 음 이름(C5, F#4, Bb4), 쉼표 '.', 앞 음 늘이기 '-'. 마디는 '|'로 나눠요(읽기 편하려고만)
     반주와 베이스는 마디마다 적은 화음(chords)으로 정해진 모양(style)에 맞춰 저절로 만들어요 */
  const SONGS = {
    // 곡을 줄였어요. 홈(학교 탭) 1곡, 그 밖의 화면 1곡, 학교 행사 1곡. 상점에서 산 배경이 있으면 홈에서는 그 배경 곡이 나와요
    home: { name: '숲속 아침', bpm: 96, chords: 'G D Em C G Bm C D',
      mel: { i: 'mar', v: 0.15, n: 'D5 - B4 - G4 - B4 D5|F#5 - E5 - D5 - A4 -|G5 - E5 - B4 - E5 G5|E5 - - - D5 C5 B4 -|B4 - D5 - G5 - F#5 G5|F#5 - D5 - B4 - D5 -|E5 - G5 - E5 - C5 -|D5 - - - A4 - . .' },
      acc: [{ i: 'pluck', v: 0.05, style: 'broken' }], bass: { i: 'bass', v: 0.1, style: 'root' }, dr: { h: '..x...x.' }, dv: 0.35 },
    room: { name: '쉬는 시간', bpm: 84, chords: 'F Am Bb C F Dm Gm C',
      mel: { i: 'flute', v: 0.1, n: 'C5 - - - A4 - C5 -|E5 - - - C5 - A4 -|D5 - F5 - D5 - Bb4 -|C5 - - - - - . .|A4 - C5 - F5 - E5 -|D5 - - - A4 - D5 -|Bb4 - D5 - G5 - F5 -|E5 - - - C5 - . .' },
      acc: [{ i: 'harp', v: 0.045, style: 'arp' }], bass: { i: 'bass', v: 0.08, style: 'pedal' }, echo: 0.15 },
    festival: { name: '숲속 축제', bpm: 132, chords: 'C G Am F C G F G',
      mel: { i: 'mar', v: 0.15, n: 'G4 C5 E5 G5 E5 - C5 -|D5 - G5 - B4 - D5 -|C5 E5 A5 - G5 - E5 -|F5 - E5 D5 C5 - A4 -|G4 C5 E5 G5 C6 - G5 -|B5 - G5 - D5 - G5 -|A5 G5 F5 E5 D5 - C5 -|D5 - - - G4 - . .' },
      acc: [{ i: 'pluck', v: 0.05, style: 'bounce' }], bass: { i: 'bass', v: 0.12, style: 'walk' }, dr: { k: 'x...x...', s: '....x...', h: 'x.x.x.x.' }, dv: 0.5 },
    spring: { name: '봄 벚꽃', bpm: 92, chords: 'G Em C D G Em Am D',
      mel: { i: 'box', v: 0.14, n: 'B4 - D5 - G5 - - -|E5 - D5 - B4 - G4 -|C5 - E5 - G5 - E5 -|F#5 - - - A5 - - -|G5 - F#5 G5 D5 - B4 -|B4 C5 D5 - E5 - G4 -|A4 - C5 - E5 - D5 C5|B4 - A4 - F#4 - - -' },
      acc: [{ i: 'harp', v: 0.05, style: 'arp' }], bass: { i: 'bass', v: 0.08, style: 'pedal' } },
    summer: { name: '여름 바다', bpm: 124, chords: 'C Am F G F G C C',
      mel: { i: 'mar', v: 0.15, n: 'E5 . G5 . E5 D5 C5 .|A4 - C5 - E5 - . .|F5 E5 D5 C5 A4 - C5 -|B4 - D5 - G5 - . .|A5 . A5 G5 F5 - E5 -|D5 . D5 E5 F5 - G5 -|E5 D5 C5 D5 E5 - G4 -|C5 - . . . . G4 .' },
      acc: [{ i: 'pluck', v: 0.055, style: 'bounce' }], bass: { i: 'bass', v: 0.12, style: 'root' }, dr: { k: 'x...x...', s: 'xxxxxxxx', h: '..x...x.' }, dv: 0.6 },
    autumn: { name: '가을 단풍', bpm: 84, chords: 'Dm Bb C F Gm A7 Dm Dm',
      mel: { i: 'flute', v: 0.1, n: 'A4 - - D5 F5 - E5 D5|D5 - - - Bb4 - - -|C5 - E5 - G5 - F5 E5|F5 - - - . . A4 -|Bb4 - D5 - G5 - F5 E5|E5 - C#5 - A4 - G4 -|F4 - A4 - D5 - E5 F5|D5 - - - - - . .' },
      acc: [{ i: 'pluck', v: 0.06, style: 'broken' }], bass: { i: 'bass', v: 0.1, style: 'root' } },
    winter: { name: '겨울 눈꽃', bpm: 96, spb: 6, chords: 'Am F C G Am F E E',
      mel: { i: 'bell', v: 0.1, n: 'A4 - C5 - E5 -|F5 - - - E5 D5|E5 - G5 - C5 -|D5 - - - B4 -|C5 - E5 - A5 -|A5 - G5 - F5 -|E5 - G#5 - B5 -|E5 - - - - -' },
      acc: [{ i: 'box', v: 0.045, style: 'waltz' }, { i: 'pad', v: 0.03, style: 'pad' }], bass: { i: 'bass', v: 0.09, style: 'waltz' }, echo: 0.25 },
    xmas: { name: '크리스마스', bpm: 132, chords: 'C F G C Am F G7 C',
      mel: { i: 'bell', v: 0.12, n: 'G4 - C5 - E5 - G5 -|A5 - G5 - F5 - C5 -|D5 - G5 - F5 E5 D5 -|E5 - C5 - G4 - . .|A4 - C5 E5 A5 - G5 -|F5 - A5 - C6 - A5 -|G5 F5 E5 D5 B4 - D5 -|C5 - - - . . . .' },
      acc: [{ i: 'mar', v: 0.05, style: 'bounce' }], bass: { i: 'bass', v: 0.12, style: 'walk' }, dr: { j: 'x.x.x.x.', k: 'x...x...' }, dv: 0.5 },
    space: { name: '우주 탐험', bpm: 72, chords: 'Em C G D Em C Am Bm',
      mel: { i: 'glass', v: 0.1, n: 'B5 - - - - - G5 -|E5 - - - - - G5 -|D5 - - - B4 - D5 -|F#5 - - - - - . .|G5 - - - F#5 - E5 -|G5 - - - - - E5 -|C6 - - - B5 - A5 -|F#5 - - - - - - -' },
      acc: [{ i: 'pad', v: 0.045, style: 'pad' }, { i: 'glass', v: 0.025, style: 'arp', oct: 1 }], bass: { i: 'bass', v: 0.09, style: 'pedal' }, echo: 0.4 },
    retro: { name: '레트로 70', bpm: 144, chords: 'C Am F G Em F G G',
      mel: { i: 'sq', v: 0.05, n: 'E5 - G5 - C6 - G5 -|A5 - E5 - C5 - E5 -|F5 G5 A5 - C6 - A5 -|G5 - D5 - B4 - D5 -|E5 G5 B5 - G5 - E5 -|F5 A5 C6 - A5 - F5 -|G5 - A5 - B5 - D6 -|G5 - - - . . . .' },
      acc: [{ i: 'sq', v: 0.018, style: 'bounce' }], bass: { i: 'tri', v: 0.12, style: 'oct8' }, dr: { k: 'x...x...', n: '..x...x.', h: 'xxxxxxxx' }, dv: 0.55 }
  };
  const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function midiOf(n) {
    const m = /^([A-G])([#b]?)(-?\d)$/.exec(n);
    return m ? 12 * (+m[3] + 1) + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) : null;
  }
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  // 화음 이름 → 음 높이들 (oct 옥타브의 근음부터)
  function chordTones(c, oct) {
    const m = /^([A-G])([#b]?)(.*)$/.exec(c);
    const root = 12 * (oct + 1) + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0), q = m[3];
    const iv = q === 'm' ? [0, 3, 7] : q === 'm7' ? [0, 3, 7, 10] : q === '7' ? [0, 4, 7, 10] : q === 'M7' ? [0, 4, 7, 11] : [0, 4, 7];
    return iv.map(x => root + x);
  }
  // 곡을 칸마다 칠 음 목록으로 바꿔 둬요
  function compileSong(id) {
    const T = SONGS[id];
    if (T.steps) return T;
    const spb = T.spb || 8, chords = T.chords.split(' '), len = chords.length * spb;
    const steps = Array.from({ length: len }, () => []);
    const toks = T.mel.n.replace(/\|/g, ' ').split(/\s+/).filter(Boolean);
    toks.forEach((tk, i) => {
      const m = midiOf(tk);
      if (m === null || i >= len) return;
      let d = 1; while (toks[i + d] === '-') d++;
      steps[i].push({ i: T.mel.i, f: hz(m), d, v: T.mel.v });
    });
    chords.forEach((c, b) => {
      for (let s = 0; s < spb; s++) {
        const at = steps[b * spb + s];
        for (const A of T.acc || []) {
          const t = chordTones(c, 4 + (A.oct || 0)), r = [t[0], t[1], t[2], t[0] + 12];
          if (A.style === 'arp') { const k = (spb === 6 ? [0, 1, 2, 3, 2, 1] : [0, 1, 2, 3, 2, 1, 2, 1])[s]; at.push({ i: A.i, f: hz(r[k]), d: 2, v: A.v }); }
          else if (A.style === 'bounce' && s % 4 === 2) t.slice(0, 3).forEach(x => at.push({ i: A.i, f: hz(x), d: 1, v: A.v }));
          else if (A.style === 'broken' && s % 2 === 0) at.push({ i: A.i, f: hz(r[[0, 1, 2, 1][(s / 2) % 4]]), d: 2, v: A.v });
          else if (A.style === 'pad' && s === 0) t.forEach(x => at.push({ i: A.i, f: hz(x), d: spb, v: A.v }));
          else if (A.style === 'waltz' && (s === 2 || s === 4)) t.slice(0, 3).forEach(x => at.push({ i: A.i, f: hz(x), d: 1.5, v: A.v }));
        }
        const B = T.bass;
        if (B) {
          const r = chordTones(c, 2)[0], f5 = r + 7;
          if (B.style === 'root' && s % (spb / 2) === 0) at.push({ i: B.i, f: hz(r), d: spb / 2, v: B.v });
          else if (B.style === 'walk' && s % 2 === 0) at.push({ i: B.i, f: hz([r, f5, r + 12, f5][(s / 2) % 4]), d: 2, v: B.v });
          else if (B.style === 'pedal' && s === 0) at.push({ i: B.i, f: hz(r), d: spb, v: B.v });
          else if (B.style === 'waltz' && s === 0) at.push({ i: B.i, f: hz(r), d: 2, v: B.v });
          else if (B.style === 'oct8') at.push({ i: B.i, f: hz(s % 2 ? r + 12 : r), d: 1, v: B.v });
        }
        for (const [k, p] of Object.entries(T.dr || {})) if (p[s % p.length] === 'x') at.push({ dr: k, v: T.dv || 0.5 });
      }
    });
    T.steps = steps; T.len = len;
    return T;
  }
  const Music = { cur: '', track: null, bus: null, out: null, step: 0, next: 0, timer: 0, preview: '', noise: null, src: null };
  // 음악 파일 곡(Suno 유료 플랜으로 만든 곡)
  // 파일이 없거나 풀기에 실패하면 예전처럼 코드로 연주하는 곡(SONGS)으로 돌아가요. 'play'(미니게임)는 코드 곡이 없어서 'room' 곡으로 돌아가요
  const FILE_SONG = { grad: 'bgm_grad', unigrad: 'bgm_unigrad', bigfest: 'bgm_bigfest', home: 'bgm_home', room: 'bgm_room', festival: 'bgm_festival', festnight: 'bgm_festnight', play: 'bgm_play',   // 밤 행사 곡(Suno)
   
    // 배경 테마 곡 7개(Suno로 만듦)
    spring: 'bgm_spring', summer: 'bgm_summer', autumn: 'bgm_autumn', winter: 'bgm_winter', xmas: 'bgm_xmas', space: 'bgm_space', retro: 'bgm_retro',
    // 숲속 탐험대 곡 넷(Suno): 운동장과 텃밭은 낮, 연못과 도서관은 잔잔, 뒤뜰과 천문대는 밤, 큰 장난꾸러기 층은 보스
    exday: 'bgm_ex_day', exnight: 'bgm_ex_night' };   // 탐험은 기본(낮)과 심화(밤) 두 곡만. 쓰지 않던 쉼 곡과 큰 장난꾸러기 곡은 앱 용량 때문에 뺐어요
  // 곡은 게임 파일 밖의 따로 된 파일이에요(게임 파일이 너무 커지지 않게). 웹, 안드로이드, 토스 판 모두 게임 옆 audio 폴더에 있어요
  const AUD_BASE = () => window.FS_AUD_BASE || 'audio/';
  // 용량: 테마 곡 7개와 행사, 졸업 곡 5개, 자연 소리 7개는 앱에 넣지 않고 웹에서 받아요. 못 받으면 홈 곡이 나와요. 곡 파일을 바꾸면 AUD_V를 올려요
  const WEB_AUD = new Set(['bgm_spring', 'bgm_summer', 'bgm_autumn', 'bgm_winter', 'bgm_xmas', 'bgm_space', 'bgm_retro', 'bgm_festival', 'bgm_festnight', 'bgm_bigfest', 'bgm_grad', 'bgm_unigrad', 'amb_day', 'amb_morning', 'amb_evening', 'amb_night', 'amb_rain', 'amb_snow', 'amb_water']), AUD_V = '1';
  const webAud = key => APP_PACK() && !window.FS_AUD_BASE && WEB_AUD.has(key);
  const FILE_GAIN = 0.6;   // 파일 곡은 코드 곡보다 커서 조금 줄여요
  const bgmBuf = new Map();   // 풀어 둔 곡. 한 곡이 30MB쯤 메모리를 써서 두 곡까지만 들고 있어요
  function bgmLoad(key) {
    if (bgmBuf.has(key)) { const p = bgmBuf.get(key); bgmBuf.delete(key); bgmBuf.set(key, p); return p; }
    if (!actx) return Promise.resolve(null);
    const p = audBytes(key).then(buf => actx.decodeAudioData(buf)).catch(() => { bgmBuf.delete(key); return null; });
    bgmBuf.set(key, p);
    while (bgmBuf.size > 2) bgmBuf.delete(bgmBuf.keys().next().value);
    return p;
  }
  function audBytes(key) {
    const url = window.FS_AUD && window.FS_AUD[key];   // 자동 시험판은 글자로 넣은 곡
    // fetch(data:)는 앱 보안 설정(CSP)에 막힐 수 있어서 글자를 직접 바이트로 바꿔요. 보통은 audio 폴더의 파일을 받아요
    const bytes = url ? new Promise(res => setTimeout(res, 0)).then(() => {
      const b64 = atob(url.slice(url.indexOf(',') + 1)), u8 = new Uint8Array(b64.length);
      for (let i = 0; i < b64.length; i++) u8[i] = b64.charCodeAt(i);
      return u8.buffer;
    }) : (webAud(key) ? webFetch(WEB_ROOT + 'audio/' + key + '.mp4?v=' + AUD_V) : fetch(AUD_BASE() + key + '.mp4').then(r => { if (!r.ok) throw new Error('곡 파일 ' + r.status); return r; })).then(r => r.arrayBuffer());
    return bytes;
  }
  const HOME_MUSIC_TABS = new Set(['shop', 'street', 'ess', 'deco', 'school', 'teachers', 'quests', 'rank', 'dex', 'event', 'hall', 'club', 'settings', 'mini', 'grad']);   // 공부 탭, 졸업 탭, 상점(거리, 백화점, 문방구, 꾸미기 가게 모두.), 학교 복도와 동아리실, 설정도 홈 곡
  // 테마 세트 미리 보기: 저장(S.cos.th)은 그대로 두고 화면만 미리 보는 테마로 그려요
  const thOn = () => (rt.thPrev ? rt.thPrev.th : S.cos.th);
  function musicWant() {
    if (!S || rt.paused || rt.adOpen) return '';   // 광고 중에는 배경음악을 틀지 않아요
    if (Music.preview && rt.tab === 'shop') return Music.preview;
    if (rt.thPrev && SONGS[rt.thPrev.id]) return rt.thPrev.id;   // 미리 보기 중에는 그 테마 곡
    if (!S.bgm) return '';
    // 졸업식 곡: 졸업식 장면과 이어지는 입학 창. 학위수여식 곡: 대학교에서 4학년을 마치는 식 창(Suno 곡)
    if (rt.cereOn || (rt.modalOpen && rt.modalOpen === $('#mTier'))) return 'grad';
    if (rt.uniGrad && rt.modalOpen && rt.modalOpen === $('#mGrad')) return 'unigrad';
    if (rt.fest && festDef(rt.fest.id) && (festDef(rt.fest.id).bf || festDef(rt.fest.id).fv) && bfOn()) return 'bigfest';   // 대축제 곡
    if (rt.fest || rt.sports) return rt.fest && festDef(rt.fest.id) && festDef(rt.fest.id).night ? 'festnight' : 'festival';   // 고등학교 밤 행사는 조용한 곡
    let play = false; try { play = !!((pzUI && pzUI.open) || (mgUI && mgUI.open) || (btUI && btUI.open)); } catch (e) { /* 퍼즐과 합치기가 아직 준비 전 */ }   // 숲속 합치기도 미니게임 곡
    if (play) return 'play';
    if (rt.tab === 'tam' && S.tam) return tamHOn() ? 'exnight' : 'exday';   // 탐험은 기본과 심화 두 곡만(지역과 큰 장난꾸러기로 바꾸지 않아요)
    // 곡이 자주 바뀌지 않게 홈에서 여는 탭(선생님, 퀘스트, 랭킹, 도감, 이벤트)도 홈 곡 그대로
    if (HOME_MUSIC_TABS.has(rt.tab) && bfOn()) return 'bigfest';   // 대축제 사흘 동안 대학교 홈 곡
    if (HOME_MUSIC_TABS.has(rt.tab)) return SONGS[thOn().bg] ? thOn().bg : 'home';
    return 'room';
  }
  // 곡을 바꿀 때는 지금 곡을 살짝 줄이고 새 곡을 키워요
  function musicSync() {
    if (!actx) return;
    ambSync();
    const w = musicWant();
    if (w === Music.cur) return;
    Music.cur = w;
    const now = actx.currentTime;
    if (Music.bus) { const old = Music.bus; old.gain.cancelScheduledValues(now); old.gain.setTargetAtTime(0, now, 0.18); setTimeout(() => { try { old.disconnect(); } catch (e) { /* 이미 끊김 */ } }, 1500); Music.bus = null; }
    if (Music.src) { const os = Music.src; Music.src = null; try { os.stop(now + 1.2); } catch (e) { /* 이미 멈춤 */ } }
    clearInterval(Music.timer); Music.timer = 0;
    if (!w) { Music.track = null; return; }
    if (!Music.out) { Music.out = actx.createGain(); Music.out.gain.value = 0.55; Music.out.connect(actx.destination); }
    const fk = FILE_SONG[w];
    if (fk) {   // 파일을 못 받으면(bgmLoad가 null) 코드 곡으로 돌아가요
      // 파일 곡: 풀어서(처음 한 번) 끝없이 되풀이해요. 곡 파일은 끝과 처음이 이어지게 잘라 두었어요
      const bus = actx.createGain();
      bus.gain.setValueAtTime(0, now); bus.connect(Music.out);
      Music.bus = bus; Music.track = null;
      bgmLoad(fk).then(buf => buf || !webAud(fk) ? buf : bgmLoad(FILE_SONG.home)).then(buf => {
        if (Music.bus !== bus || Music.cur !== w) return;   // 그사이 곡이 바뀌었어요
        if (!buf) { Music.cur = ''; Music.bus = null; try { bus.disconnect(); } catch (e) { /* 무시 */ } musicFallback(w); return; }
        const src = actx.createBufferSource(), t = actx.currentTime;
        src.buffer = buf; src.loop = true; src.connect(bus);
        bus.gain.cancelScheduledValues(t); bus.gain.setValueAtTime(0, t); bus.gain.setTargetAtTime(FILE_GAIN, t + 0.05, 0.3);
        src.start(t + 0.05); Music.src = src;
      });
      return;
    }
    musicSynth(SONGS[w] ? w : 'room', now);
  }
  /* 자연 소리: 홈 지도에서만 배경음악 밑에 깔리는 새소리, 풀벌레, 빗소리. 파일은 audio/amb_*.mp4(끝과 처음이 이어지게 다듬어 둠, 앱은 웹에서 받아요).
     바탕 한 겹(아침, 낮, 노을, 밤) 위에 날씨(rt.ambWx: 'rain', 'snow')와 물가(rt.ambWater 0~1)가 겹쳐요. 바뀔 때는 2~3초에 걸쳐 서서히 */
  const AMB = { out: null, lay: {}, buf: new Map() };
  const AMB_LV = [0, 0.22, 0.4, 0.65];   // 설정 끄기, 작게, 보통, 크게(제안 값)
  function ambWant() {
    const w = {};
    if (!S || !S.ambV || rt.paused || rt.adOpen || document.hidden || rt.tab !== 'school' || rt.cereOn) return w;
    let play = false; try { play = !!((pzUI && pzUI.open) || (mgUI && mgUI.open) || (btUI && btUI.open)); } catch (e) { /* 아직 준비 전 */ }
    if (play) return w;
    const h = kstHour(gameNow()), base = S && S.nl === 2 ? 'amb_day' /* 시간 흐름을 끄면(늘 낮) 자연 소리도 낮 */ : isNight() ? 'amb_night' : h < 9 ? 'amb_morning' : h >= 17 ? 'amb_evening' : 'amb_day';
    let bv = rt.fest || rt.sports ? 0.5 : 1;   // 행사 곡이 나올 때는 반쯤
    if (rt.ambWx === 'rain') { w.amb_rain = 1; bv *= 0.45; }
    else if (rt.ambWx === 'snow') { w.amb_snow = 1; bv *= base === 'amb_night' ? 0.3 : 0.6; }
    w[base] = bv;
    const wa = +rt.ambWater || 0; if (wa > 0) w.amb_water = Math.min(1, wa) * 0.8;
    return w;
  }
  function ambLoad(key) {
    if (AMB.buf.has(key)) return AMB.buf.get(key);
    const p = audBytes(key).then(b => actx.decodeAudioData(b)).catch(() => { AMB.buf.delete(key); return null; });   // 못 받으면 그 소리만 조용히 빠지고, 다음에 다시 받아요
    AMB.buf.set(key, p);
    return p;
  }
  function ambSync() {
    if (!actx) return;
    const want = ambWant(), now = actx.currentTime, lv = AMB_LV[S && S.ambV] || 0;
    if (!AMB.out) { AMB.out = actx.createGain(); AMB.out.gain.value = 0; AMB.out.connect(actx.destination); }
    AMB.out.gain.setTargetAtTime(lv, now, 0.4);
    for (const k of new Set([...Object.keys(want), ...Object.keys(AMB.lay)])) {
      const v = want[k] || 0, L = AMB.lay[k];
      if (L) { if (L.v !== v) { L.v = v; L.g.gain.cancelScheduledValues(now); L.g.gain.setTargetAtTime(v, now, 0.8); } if (!v && !L.off) L.off = now; if (v) L.off = 0; continue; }
      if (!v) continue;
      const g = actx.createGain(), N = { g, v, src: null, off: 0 }; g.gain.value = 0; g.connect(AMB.out); AMB.lay[k] = N;
      ambLoad(k).then(buf => {
        if (AMB.lay[k] !== N || !buf) return;
        const src = actx.createBufferSource(), t = actx.currentTime; src.buffer = buf; src.loop = true; src.connect(g);
        src.start(t, Math.random() * buf.duration);   // 매번 같은 곳부터 나오지 않게
        N.src = src; g.gain.setTargetAtTime(N.v, t, 0.8);
      });
    }
    for (const k in AMB.lay) {   // 다 줄어든 겹은 멈추고 떼어 내요
      const L = AMB.lay[k];
      if (L.off && now - L.off > 5) { try { if (L.src) L.src.stop(); L.g.disconnect(); } catch (e) { /* 이미 멈춤 */ } delete AMB.lay[k]; }
    }
    while (AMB.buf.size > 4) { const k = [...AMB.buf.keys()].find(x => !AMB.lay[x]); if (!k) break; AMB.buf.delete(k); }   // 풀어 둔 소리는 넷까지
  }
  setInterval(() => { try { if (actx && S) ambSync(); } catch (e) { /* 다음에 */ } }, 15000);   // 시간이 바뀌면(아침에서 낮으로) 바탕 소리도
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('#optAmb [data-amb]'); if (!b || !S) return;
    const v = +b.dataset.amb; if (v === S.ambV) return;
    S.ambV = v; save(); syncSettingsUI(); sfx('tap'); ensureAudio(true); ambSync();
  });
  // 파일 곡을 못 풀면 코드 곡으로(미니게임 곡은 쉬는 시간 곡으로)
  function musicFallback(w) { if (!actx) return; Music.cur = w; musicSynth(SONGS[w] ? w : 'room', actx.currentTime); }
  function musicSynth(w, now) {
    const T = compileSong(w), bus = actx.createGain();
    bus.gain.setValueAtTime(0, now); bus.gain.setTargetAtTime(1, now + 0.25, 0.25);
    bus.connect(Music.out);
    if (T.echo) {   // 메아리: 우주나 겨울처럼 넓은 느낌이 나는 곡
      const dl = actx.createDelay(1), fb = actx.createGain(), wet = actx.createGain();
      dl.delayTime.value = 60 / T.bpm * 0.75; fb.gain.value = 0.32; wet.gain.value = T.echo;
      bus.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(Music.out);
    }
    Music.bus = bus; Music.track = T; Music.step = 0; Music.next = now + 0.3;
    Music.timer = setInterval(musicTick, 60);
    musicTick();
  }
  function musicTick() {
    const T = Music.track;
    if (!T || !actx || actx.state !== 'running') return;
    const now = actx.currentTime, eighth = 60 / T.bpm / 2, sw = T.swing || 0;
    if (Music.next < now - 0.5) Music.next = now + 0.05;   // 오래 멈췄다 돌아오면 박자를 새로 맞춰요
    while (Music.next < now + 0.3) {
      const s = Music.step, dur = eighth * (sw ? (s % 2 ? 1 - sw : 1 + sw) : 1);
      for (const e of T.steps[s]) { try { e.dr ? drum(e.dr, Music.next, e.v) : voice(e.i, e.f, Music.next, e.d * eighth, e.v); } catch (err) { /* 한 음 실패는 넘어가요 */ } }
      Music.step = (s + 1) % T.len;
      Music.next += dur;
    }
  }
  // 악기: 모두 사인파, 세모파, 네모파, 톱니파를 섞어서 만들어요
  function env(g, t, a, peak, hold, rel) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    if (hold > a) g.gain.setValueAtTime(peak, t + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(hold, a) + rel);
  }
  function osc(type, f, t, end, g) {
    const o = actx.createOscillator();
    o.type = type; o.frequency.setValueAtTime(f, t);
    o.connect(g); o.start(t); o.stop(end + 0.05);
    return o;
  }
  function voice(kind, f, t, d, v) {
    const g = actx.createGain(); g.connect(Music.bus);
    const part = (ratio, pv, dec, type) => { const g2 = actx.createGain(); g2.connect(Music.bus); env(g2, t, 0.005, v * pv, 0, dec); osc(type || 'sine', f * ratio, t, t + dec, g2); };
    if (kind === 'box') { env(g, t, 0.004, v, 0, 1.4); osc('sine', f, t, t + 1.4, g); part(3, 0.25, 0.25); part(5.04, 0.08, 0.12); }
    else if (kind === 'bell') { env(g, t, 0.004, v, 0, 2.2); osc('sine', f, t, t + 2.2, g); part(2.76, 0.4, 0.9); part(5.4, 0.15, 0.4); }
    else if (kind === 'glass') { env(g, t, 0.02, v, 0, Math.max(1.2, d)); osc('sine', f, t, t + Math.max(1.2, d) + 0.1, g); part(2, 0.3, 0.6); }
    else if (kind === 'mar') { env(g, t, 0.003, v, 0, 0.55); osc('sine', f, t, t + 0.6, g); part(4, 0.18, 0.08); }
    else if (kind === 'harp') { env(g, t, 0.004, v, 0, 1.1); osc('triangle', f, t, t + 1.1, g); part(2, 0.2, 0.3); }
    else if (kind === 'pluck') { env(g, t, 0.003, v, 0, 0.32); osc('triangle', f, t, t + 0.35, g); part(2, 0.3, 0.08); }
    else if (kind === 'bass') { env(g, t, 0.006, v, 0, Math.min(0.9, d + 0.2)); osc('sine', f, t, t + 1, g); part(2, 0.15, 0.15, 'triangle'); }
    else if (kind === 'flute') {
      env(g, t, 0.07, v, d * 0.85, 0.18);
      const o = osc('sine', f, t, t + d + 0.25, g), lfo = actx.createOscillator(), lg = actx.createGain();
      lfo.frequency.value = 5; lg.gain.value = f * 0.006; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + d + 0.3);
      part(2, 0.12, d * 0.8);
    }
    else if (kind === 'sq') { env(g, t, 0.004, v, d * 0.8, 0.05); osc('square', f, t, t + d, g); }
    else if (kind === 'tri') { env(g, t, 0.004, v, d * 0.75, 0.05); osc('triangle', f, t, t + d, g); }
    else if (kind === 'pad') {
      const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100; lp.connect(g);
      env(g, t, 0.45, v, d * 0.8, 0.9);
      [-6, 6].forEach(c => { const o = osc('sawtooth', f, t, t + d + 1, lp); o.detune.value = c; });
    }
  }
  function noiseBuf() {
    if (Music.noise) return Music.noise;
    const b = actx.createBuffer(1, actx.sampleRate, actx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return (Music.noise = b);
  }
  function drum(k, t, v) {
    if (k === 'k') {
      const g = actx.createGain(), o = actx.createOscillator(); g.connect(Music.bus);
      o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.12);
      env(g, t, 0.003, 0.32 * v, 0, 0.16); o.connect(g); o.start(t); o.stop(t + 0.2);
      return;
    }
    const src = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
    src.buffer = noiseBuf(); src.connect(f); f.connect(g); g.connect(Music.bus);
    const P = { h: ['highpass', 7000, 0.06, 0.04], n: ['bandpass', 1800, 0.16, 0.12], s: ['bandpass', 5200, 0.05, 0.05], j: ['highpass', 7500, 0.09, 0.13] }[k];
    if (!P) return;
    f.type = P[0]; f.frequency.value = P[1];
    env(g, t, 0.002, P[2] * v, 0, P[3]);
    src.start(t, Math.random() * 0.5); src.stop(t + P[3] + 0.05);
    if (k === 'j') [2637, 3520].forEach(fr => { const g2 = actx.createGain(); g2.connect(Music.bus); env(g2, t, 0.002, 0.012 * v, 0, 0.09); osc('sine', fr, t, t + 0.1, g2); });
  }

