  /* ---------- 여러 나라 말(다국어 틀): 한국어 글을 그대로 열쇠로 써요 ----------
     프로젝트 문서 '다국어 계획서 (영어, 일본어, 중남미 스페인어)'. 한국어 화면은 그대로이고, 다른 말일 때만 사전에서 바꿔요.
     말 고르는 차례: 웹 주소 ?lang= → 이 기기에 고른 말(localStorage forest-lang) → 휴대폰 말 → 한국어. 토스 판은 늘 한국어
     사전: 맨 위 i18n/<말>.json = { "한국어 원문": "번역" 또는 { "one": "…", "other": "…" } }. 없는 글은 한국어 원문 그대로
     자리 표시: {n}, {name}. 한국어 조사는 {name|을} {name|이} {name|은} {name|와} {name|로} 처럼 써요(다른 말 사전에서는 {name}) */
  const LANGS = ['ko', 'en', 'ja', 'es'];
  const LANG_NAME = { ko: '한국어', en: 'English', ja: '日本語', es: 'Español' };
  const LANG_KEY = 'forest-lang';
  let LANG = 'ko', I18N = {};
  const langOf = v => { const s = String(v || '').toLowerCase().slice(0, 2); return LANGS.includes(s) ? s : ''; };
  function langPick() {
    if (AIT) return 'ko';
    let q = ''; try { q = langOf(new URLSearchParams(location.search).get('lang')); } catch (e) { q = ''; }
    if (q) return q;
    let saved = ''; try { saved = langOf(localStorage.getItem(LANG_KEY)); } catch (e) { saved = ''; }
    if (saved) return saved;
    // 자동 시험은 주소나 고른 말이 없으면 늘 한국어(시험 브라우저의 말은 영어예요)
    if (window.__FOREST_TEST) return 'ko';
    // 휴대폰 말: 한국어, 영어, 일본어, 스페인어가 아니면 영어로 보여 줘요(한국어가 아닌 사람에게는 영어가 가장 넓게 읽혀요)
    const nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'ko';
    return langOf(nav) || 'en';
  }
  // 조사: eul, iga, eun은 뒤에서 만들어요. 여기서는 이름으로 불러요
  const JOSA = { '을': w => eul(w), '를': w => eul(w), '이': w => iga(w), '가': w => iga(w), '은': w => eun(w), '는': w => eun(w),
    '와': w => w + (jong(w) ? '과' : '와'), '과': w => w + (jong(w) ? '과' : '와'),
    '로': w => w + (jong(w) && jong(w) !== 8 ? '으로' : '로'), '으로': w => w + (jong(w) && jong(w) !== 8 ? '으로' : '로') };
  // 받침 번호(0이면 받침 없음, 8은 ㄹ)
  function jong(w) { const c = String(w).trim().slice(-1).charCodeAt(0); return c >= 0xAC00 && c <= 0xD7A3 ? (c - 0xAC00) % 28 : 0; }
  const PLURAL = {};
  function plural(n) { try { return (PLURAL[LANG] || (PLURAL[LANG] = new Intl.PluralRules(LANG))).select(n); } catch (e) { return n === 1 ? 'one' : 'other'; } }
  // t('학생 {n}명 모으기', { n: 3 }): 말에 맞는 글. 사전에 없으면 한국어 원문
  function t(ko, v) {
    let s = LANG === 'ko' ? ko : (I18N[ko] !== undefined ? I18N[ko] : ko);
    if (s && typeof s === 'object') { const n = v && typeof v.n === 'number' ? v.n : 2; s = s[plural(n)] || s.other || ko; }
    if (!v) return s;
    return String(s).replace(/\{(\w+)(?:\|([가-힣]+))?\}/g, (m, k, j) => {
      if (!(k in v)) return m;
      const x = typeof v[k] === 'number' ? fmt(v[k]) : String(v[k]);
      return j && LANG === 'ko' && JOSA[j] ? JOSA[j](x) : x;
    });
  }
  const tHas = ko => LANG !== 'ko' && I18N[ko] !== undefined;
  /* 화면 글 바꾸기: 게임 코드는 한국어 글을 그대로 화면에 넣고, 여기서 화면에 들어온 글을 사전대로 바꿔요.
     사전 열쇠는 dev/i18n_extract.mjs가 원본에서 모은 모양이에요. {0} {name}은 바뀌는 자리, {0|을}은 조사가 붙는 자리,
     <b> </b> 같은 글 안 태그는 속성 없이 적어요. 한국어 화면에서는 아무것도 하지 않아요 */
  const TR_JOSA = { '을': '(?:을|를)', '를': '(?:을|를)', '이': '(?:이|가)', '가': '(?:이|가)', '은': '(?:은|는)', '는': '(?:은|는)', '와': '(?:와|과)', '과': '(?:와|과)', '로': '(?:으로|로)', '으로': '(?:으로|로)' };
  const TR_HOLE = /\{(\w+)(?:\|([가-힣]+))?\}/g;
  const TR_JOSA_ONLY = /^(?:을|를|이|가|은|는|과|와|으로|로|이에요|예요|이나|나|이랑|랑)$/;
  const TR_INLINE = new Set(['B', 'STRONG', 'I', 'EM', 'SMALL', 'SPAN', 'U', 'MARK', 'SUP', 'SUB', 'S', 'A', 'CODE', 'Q', 'ABBR', 'TIME', 'VAR', 'KBD', 'INS', 'DEL']);
  const TR_ATOM = new Set(['IMG', 'SVG', 'PICTURE', 'CANVAS']);
  const TR_ATTR = ['aria-label', 'title', 'placeholder', 'alt', 'data-tip'];
  const HAN = /[가-힣]/;
  let TR_EX = null, TR_PRE = null, TR_SUF = null;
  const TR_CACHE = new Map(), TR_MISS = new Map();
  const trEsc = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const trNorm = x => x.replace(/[\s\u00a0]+/g, ' ').trim();
  function trBuild() {
    TR_EX = new Map(); TR_PRE = new Map(); TR_SUF = new Map();
    const put = (m, c, p) => { let a = m.get(c); if (!a) m.set(c, a = []); a.push(p); };
    for (const [k, v] of Object.entries(I18N)) {
      if (v === null || v === undefined) continue;
      if (!/\{\w+(?:\|[가-힣]+)?\}/.test(k)) { TR_EX.set(k, v); continue; }
      const names = []; let re = '^', last = 0;
      // re: 자리마다 한 글자 이상, re0: 빈 자리도 돼요(코드가 있을 때만 넣는 글 '1시간 ', '2학기 '가 빈 채로 온 글)
      let re0 = '^', reG = '^';
      k.replace(TR_HOLE, (m, nm, j, off) => { const lit = trEsc(k.slice(last, off)), jo = j && TR_JOSA[j] ? TR_JOSA[j] : ''; re += lit + '(.+?)' + jo; reG += lit + '(.+)' + jo; re0 += lit + '(.*?)' + jo; names.push(nm); last = off + m.length; return m; });
      re += trEsc(k.slice(last)) + '$'; reG += trEsc(k.slice(last)) + '$'; re0 += trEsc(k.slice(last)) + '$';
      const lits = k.split(/\{\w+(?:\|[가-힣]+)?\}/), pre = lits[0], suf = lits[lits.length - 1];
      // w: 고정 글자 수(태그 빼고). adj: 자리 둘이 붙은 무늬('{0}{1}')는 어디서 나눌지 몰라서, 한국어가 하나도 안 남을 때만 써요
      const p = { k, re: new RegExp(re, 's'), reG: new RegExp(reG, 's'), re0: new RegExp(re0, 's'), glued: lits.slice(1, -1).map((x, i) => x === '' ? i : -1).filter(i => i >= 0), names, v, w: lits.join('').replace(/<[^>]*>/g, '').length, adj: /\}\{/.test(k) };
      if (!HAN.test(lits.join(''))) continue;   // 한국어 고정 글이 없는 무늬('{0}{1}')는 아무 글이나 잡아서 빼요
      if (pre) put(TR_PRE, pre.slice(0, 1), p); else put(TR_SUF, suf.slice(-1), p);
    }
    for (const m of [TR_PRE, TR_SUF]) for (const a of m.values()) a.sort((x, y) => y.w - x.w);
  }
  function trPick(v, g) {                        // 복수형: 첫 숫자 자리로 골라요
    if (typeof v === 'string') return v;
    const x = g.find(y => /\d/.test(y)); const n = x ? Number(String(x).replace(/[^\d.]/g, '')) : 2;
    return v[plural(isFinite(n) ? n : 2)] || v.other || '';
  }
  /* 대학교부터는 학교 낱말이 대학교 낱말로 바뀌어요(05-calc-clock의 UT, 교수님과 총장님 호칭).
     다른 말에서는 한국어 낱말 바꾸기(utNode)를 쉬고, 여기서 번역한 뒤 번역 낱말을 바꿔요(Classroom → Lecture Hall).
     코드가 이미 대학교 낱말로 만든 글(예: '고니 교수님')은 원래 낱말로 되돌려 번역하고 다시 바꿔요 */
  const TR_UNI_X = [['교장 선생님 이름', '총장님 이름'], ['교장 선생님', '총장님'], ['교감 선생님', '부총장님'], ['선생님', '교수님']];
  let TR_UNI = null;
  const trUniOn = () => { try { return uniNow(); } catch (e) { return false; } };
  function trUniPairs() {
    const gk = (() => { try { return gradOn() ? 2 : 1; } catch (e) { return 1; } })();
    if (TR_UNI && TR_UNI.gk === gk) return TR_UNI;
    let ut = []; try { ut = UT.map(x => [x[0], x[1]]); } catch (e) { return []; }
    try { if (gradOn()) ut = ut.map(([o, u]) => [o, u === '종강 파티' ? '세미나' : u]); } catch (e) { /* 대학원이 아니면 그대로 */ }
    return (TR_UNI = { gk, ut: [...ut].sort((a, b) => b[0].length - a[0].length), back: [...TR_UNI_X, ...ut].sort((a, b) => b[1].length - a[1].length) });
  }
  const TR_JO = { '을': ['을', '를'], '를': ['을', '를'], '이': ['이', '가'], '가': ['이', '가'], '은': ['은', '는'], '는': ['은', '는'], '과': ['과', '와'], '와': ['과', '와'],
    '이에요': ['이에요', '예요'], '예요': ['이에요', '예요'], '이었': ['이었', '였'], '였': ['이었', '였'], '이라': ['이라', '라'], '라': ['이라', '라'], '이나': ['이나', '나'], '나': ['이나', '나'], '이랑': ['이랑', '랑'], '랑': ['이랑', '랑'] };
  function trUniBack(core, used) {      // 대학교 낱말 → 원래 낱말, 뒤 조사는 받침에 맞춰요
    let out = core;
    for (const [o, u] of trUniPairs().back || []) {
      if (!out.includes(u)) continue;
      out = out.replace(new RegExp(trEsc(u) + '(이에요|예요|이었|였|이라|이나|이랑|으로|로|을|를|이|가|은|는|과|와|라|나|랑)?', 'g'), (m, jo) => {
        if (!jo) return o;
        if (jo === '으로' || jo === '로') return o + (jong(o) && jong(o) !== 8 ? '으로' : '로');
        const j = TR_JO[jo]; return o + (j ? j[jong(o) ? 0 : 1] : jo);
      });
      used.push([o, u]);
    }
    return out;
  }
  function trUniFwd(r, pairs) {          // 번역한 글의 학교 낱말 → 대학교 낱말
    for (const [o, u] of pairs) {
      const a = TR_EX.get(o), b = TR_EX.get(u);
      if (typeof a !== 'string' || typeof b !== 'string' || !a || a === b) continue;
      r = r.split(a).join(b);
      const lo = x => x.charAt(0).toLowerCase() + x.slice(1);
      if (lo(a) !== a) r = r.split(lo(a)).join(lo(b));
    }
    return r;
  }
  // 바뀌는 자리에 들어간 글: 그대로 없으면 끝의 조사를 떼고 다시 봐요(예: '종업식을' → '종업식')
  function trGroup(g, d) {
    const r = trStr(g, d);
    if (r !== g || !HAN.test(g)) return r;
    const m = /^(.*[가-힣])(을|를|이|가|은|는|과|와|으로|로|에서|에게|의|도|만|에)$/.exec(g.trim());
    if (m) { const b = trStr(m[1], d); if (b !== m[1]) return b; }
    return r;
  }
  // 조각을 이어 붙여 만든 글: 앞에서부터 이어진 조각 몇 개(5개까지)씩 묶어 사전에서 찾아요. 모든 묶음이 바뀌는 나눔이 있으면 그것을 써요
  // 예: '새 친구 고양이가 전학 왔어요! 앞으로 수업료 +5%.'와 '황금 도토리 +1개도 받았어요. 이제 시설을 Lv.21까지 키울 수 있어요.'를 이어 붙인 글
  const trClean = x => !HAN.test(x.replace(/<[^>]*>/g, ''));
  function trDP(parts, glue, d) {
    const n = parts.length, best = new Array(n + 1).fill(null); best[0] = [];
    for (let i = 1; i <= n; i++) for (let j = Math.max(0, i - 5); j < i; j++) {
      if (!best[j]) continue;
      const g = parts.slice(j, i).join(glue); let t = g && HAN.test(g) ? trStr(g, d + 1) : g;
      if (!trClean(t) && /[.。]$/.test(g)) { const u = trStr(g.slice(0, -1), d + 1); if (trClean(u)) t = u + g.slice(-1); }   // 사전 글에 마침표가 없으면 떼고 찾아요('2027 봄 시즌.')
      if (trClean(t) && (!best[i] || best[j].length + 1 < best[i].length)) best[i] = best[j].concat([t]);
    }
    return best[n];
  }
  // 통째로 없는 글은 문장, 화살표, 쉼표로 나눠 하나씩 바꿔 봐요. 모두 바뀔 때만 써요
  function trSplit(core, d) {
    { const m = /^(\d+-\d+\s+)(.+)$/.exec(core) || /^([“"「‘'(（])(.+)([”"」’')）])$/.exec(core);   // 퀘스트 번호('4-1 ')나 따옴표로 감싼 글은 안쪽만 바꿔요
      if (m) { const t = trStr(m[2], d + 1); if (trClean(t)) return m[1] + t + (m[3] || ''); } }
    { const parts = core.split(/(?<=[.!?。！？])\s+/);
      if (parts.length > 1) { const r = trDP(parts, ' ', d); if (r) return r.join(' '); } }
    for (const re of [/\s*→\s*/, /\s+~\s+/, /,\s+/]) {
      const parts = core.split(re);
      if (parts.length < 2) continue;
      const seps = core.match(new RegExp(re.source, 'g')) || [];
      const out = parts.map(x => x && HAN.test(x) ? trStr(x, d + 1) : x);
      if (out.every(x => trClean(x))) return out.map((x, i) => x + (seps[i] !== undefined ? (re.source.includes('→') ? ' → ' : re.source.includes('~') ? ' – ' : re.source.startsWith(',') ? ', ' : ' ') : '')).join('');
    }
    return null;
  }
  // 글 하나를 바꿔요. 못 바꾸면 그대로 돌려줘요
  function trStr(s, d = 0) {
    if (LANG === 'ko' || !s || !HAN.test(s)) return s;
    if (!TR_EX) trBuild();
    if (/\S\s*\n\s*\S/.test(s) && !s.includes('<') && !TR_EX.has(trNorm(s))) {   // 여러 줄 알림(쓰다듬기 보상 등)은 줄마다 바꿔요. 한 줄이라도 못 바꾸면 그대로
      const out = trDP(s.split('\n'), ' ', d);   // 이어진 줄 몇 개가 한 문장 묶음일 수도 있어요
      if (out) return out.join('\n');
    }
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s), core = trNorm(m[2]);
    const uni = d === 0 && trUniOn(), ck = (uni ? '\u0001' + (trUniPairs().gk || '') : '') + core;
    let r = TR_CACHE.get(ck);
    if (r === undefined) {
      r = null;
      const ex = TR_EX.get(core);
      if (ex !== undefined) r = trPick(ex, []);
      else {
        const cand = [...(TR_PRE.get(core.slice(0, 1)) || []), ...(TR_SUF.get(core.slice(-1)) || []), ...(TR_SUF.get('') || [])];   // ''는 앞뒤가 모두 자리인 무늬('{0} 하트 {1}칸! 숲의 정수 +{2}')예요. 전에는 찾지 못했어요
        // 먼저 자리마다 한 글자 이상으로 찾고, 못 찾으면 빈 자리도 되는 무늬로 한 번 더(코드가 있을 때만 넣는 글이 빈 채로 온 글)
        // 앞 자리를 짧게 잡아서 틀리면(예: '{0} {1}장'에서 {0}이 '대도시'만) 길게 잡아 다시 봐요
        for (const p of [...cand, ...cand.map(x => ({ ...x, re: x.reG })), ...cand.map(x => ({ ...x, re: x.re0, empty: true }))]) {
          const g = p.re.exec(core); if (!g) continue;
          if (p.glued.some(i => /[가-힣]$/.test(g[i + 1]) && /^[가-힣]/.test(g[i + 2]))) continue;   // 붙은 두 자리('{1}{2}')가 한 낱말을 가운데서 자르면('초|등학교') 다른 무늬를 봐요
          const vals = {}; p.names.forEach((nm, i) => { vals[nm] = g[i + 1]; });
          const tpl = trPick(p.v, g.slice(1));
          const c = tpl.replace(TR_HOLE, (h, nm) => nm in vals ? (vals[nm] === '은' && /메달|리그/.test(p.k) && TR_EX.has('은(메달)') ? TR_EX.get('은(메달)') : TR_JOSA_ONLY.test(vals[nm]) && !TR_EX.has(vals[nm]) ? '' : d < 3 ? trGroup(vals[nm], d + 1) : vals[nm]) : h);   // 자리에 조사만 들어왔으면(numEul, eulOf가 따로 붙인 '을', '와') 다른 말에서는 빼요
          // 바뀌는 자리에 한국어가 남으면 다른 무늬를 더 봐요. 고정 글이 짧은 무늬(예: '고{0}')가 긴 글을 잘못 잡지 않게
          if (!HAN.test(c.replace(/<[^>]*>/g, ''))) { r = c; break; }
          if (r === null && !p.adj && p.w >= core.replace(/<[^>]*>/g, '').length * 0.6) r = c;
        }
      }
      if (r === null && d <= 1 && !core.includes('<')) r = trSplit(core, d);
      if (r === null && !core.includes('<')) {   // 통째로 없으면 한글 덩이마다(예: '교실 Lv.14'의 '교실'), 그래도 없으면 낱말마다
        let hit = false;
        const one = w => { const x = w.length > 1 ? TR_EX.get(w) : undefined; return typeof x === 'string' ? (hit = true, x) : null; };   // 한 글자 낱말('월', '일')은 뜻이 여럿이라 빼요
        const rr = core.replace(/[가-힣][가-힣 ]*[가-힣]|[가-힣]/g, run => one(run) ?? run.split(' ').map(w => one(w) ?? w).join(' '));
        if (hit && !HAN.test(rr)) r = rr;         // 한국어가 섞여 남으면 차라리 바꾸지 않아요
      }
      if (uni) {
        const used = [];
        if (r === null) {                    // 코드가 대학교 낱말로 만든 글: 원래 낱말로 되돌려 다시
          const back = trUniBack(core, used);
          if (back !== core) { const r2 = trStr(back, 1); if (r2 !== back && !HAN.test(r2.replace(/<[^>]*>/g, ''))) r = r2; }
        }
        if (r !== null) r = trUniFwd(r, [...used, ...(trUniPairs().ut || []).filter(([o]) => new RegExp('(?<!(?:유치원|초등학교|중학교|고등학교) )' + trEsc(o)).test(core))]);   // '유치원 졸업식'처럼 지난 학교급 식 이름은 그대로(utNode와 같아요)
      }
      if (r === null && window.__FOREST_TEST && d === 0) TR_MISS.set(core, (TR_MISS.get(core) || 0) + 1);
      if (TR_CACHE.size > 6000) TR_CACHE.clear();
      TR_CACHE.set(ck, r);
    }
    return r === null ? s : m[1] + r + m[3];
  }
  const trSkip = el => !!(el.closest && el.closest('script,style,textarea,[data-i18n-skip],[contenteditable="true"]'));
  // 글 덩어리(안에 글과 굵은 글씨 같은 태그만 있는 칸)인지. 그림과 id가 있는 작은 칸(숫자 칸)은 '통째 자리'로 두고 그대로 써요
  const trAtom = c => TR_ATOM.has(c.tagName.toUpperCase()) || (!!c.id && TR_INLINE.has(c.tagName));
  function trLeaf(el) {
    for (const c of el.childNodes) {
      if (c.nodeType === 3 || c.nodeType === 8) continue;
      if (c.nodeType !== 1) return false;
      if (c.tagName === 'BR' || trAtom(c)) continue;
      if (!TR_INLINE.has(c.tagName) || !trLeaf(c)) return false;
    }
    return true;
  }
  const trHtml = x => x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const TR_TOK = /<(\/?)([a-z]+)>|\u0004(\d+)\u0005/g;
  // 덩어리 하나를 바꿔요. 번역의 태그 차례가 원래와 같으면 글 조각만 제자리에서 바꾸고(칸과 숫자 칸은 그대로), 다르면 다시 만들어요(숫자 칸은 옮겨 써요)
  function trUnit(el) {
    const atoms = [], sig = [], regs = [];
    let reg = null;
    const open = (par, after) => { reg = { par, after, nodes: [] }; regs.push(reg); };
    const ser = (n) => {
      let o = '';
      open(n, null);
      for (const c of n.childNodes) {
        if (c.nodeType === 3) { reg.nodes.push(c); o += c.nodeValue; continue; }
        if (c.nodeType !== 1) continue;
        if (c.tagName === 'BR') { o += '<br>'; sig.push('br'); open(n, c); continue; }
        if (trAtom(c)) { o += '\u0004' + atoms.length + '\u0005'; sig.push('@' + atoms.length); atoms.push(c); open(n, c); continue; }
        const tg = c.tagName.toLowerCase();
        sig.push('<' + tg); o += '<' + tg + '>' + ser(c) + '</' + tg + '>'; sig.push('/' + tg); open(n, c);
      }
      return o;
    };
    const src = ser(el);
    if (!HAN.test(src.replace(/\u0004\d+\u0005/g, ''))) { atoms.forEach(trEl); return; }
    const out = trStr(src);
    if (out === src) { trTexts(el); return; }
    // 번역을 태그와 글 조각으로 나눠요
    const tsig = [], texts = [];
    let last = 0, m; TR_TOK.lastIndex = 0;
    while ((m = TR_TOK.exec(out))) {
      texts.push(out.slice(last, m.index)); last = TR_TOK.lastIndex;
      tsig.push(m[3] !== undefined ? '@' + m[3] : m[2] === 'br' ? 'br' : (m[1] ? '/' : '<') + m[2]);
    }
    texts.push(out.slice(last));
    if (tsig.join(' ') === sig.join(' ') && texts.length === regs.length) {
      regs.forEach((r, i) => {
        const v = texts[i];
        if (r.nodes.length) { if (r.nodes[0].nodeValue !== v) r.nodes[0].nodeValue = v; for (const x of r.nodes.slice(1)) x.remove(); }
        else if (v) r.par.insertBefore(document.createTextNode(v), r.after ? r.after.nextSibling : r.par.firstChild);
      });
    } else {
      const ok = new Set(['b', 'strong', 'i', 'em', 'small', 'span', 'u', 'mark', 'sup', 'sub', 's', 'br']);
      el.innerHTML = trHtml(out).replace(/&lt;(\/?)([a-z]+)&gt;/g, (x, c, tg) => ok.has(tg) ? (tg === 'br' ? (c ? '' : '<br>') : '<' + c + tg + '>') : '')
        .replace(/\u0004(\d+)\u0005/g, (x, i) => `<i data-tra="${i}"></i>`);
      for (const ph of el.querySelectorAll('[data-tra]')) { const a = atoms[+ph.dataset.tra]; if (a) ph.replaceWith(a); else ph.remove(); }
    }
    atoms.forEach(a => { if (a.isConnected) trEl(a); });
  }
  // 지도(svg) 글을 바꾸면 글을 감싼 둥근 판(rect)이 한국어 길이에 맞춰져 있어 글이 삐져나와요. 판을 글 길이만큼 넓혀요
  function trSvgFit(t) {
    try {
      if (!t || t.namespaceURI !== 'http://www.w3.org/2000/svg' || t.tagName !== 'text') return;
      const g = t.parentNode, r = g && [...g.children].find(c => c.tagName === 'rect'); if (!r) return;
      const tw = t.getComputedTextLength(); if (!tw) return;
      const want = Math.ceil(tw) + 12, w = +r.getAttribute('width') || 0; if (want <= w) return;
      const mid = t.getAttribute('text-anchor') === 'middle' ? +(t.getAttribute('x') || 0) : (+r.getAttribute('x') || 0) + w / 2;
      r.setAttribute('width', want); r.setAttribute('x', mid - want / 2);
      const can = g.querySelector('.can'); if (can) can.setAttribute('transform', `translate(${mid + want / 2 + 1} -7)`);
    } catch (e) { /* 그리기 전이면 다음에 */ }
  }
  function trTexts(el) {                         // 글 조각을 하나씩 바꿔요
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const list = []; while (tw.nextNode()) if (HAN.test(tw.currentNode.nodeValue)) list.push(tw.currentNode);
    for (const x of list) { const r = trStr(x.nodeValue); if (r !== x.nodeValue) { x.nodeValue = r; trSvgFit(x.parentNode); } }
  }
  function trAttrs(el) {
    for (const a of TR_ATTR) { const v = el.getAttribute(a); if (v && HAN.test(v)) { const r = trStr(v); if (r !== v) el.setAttribute(a, r); } }
  }
  function trEl(el) {
    if (LANG === 'ko' || !el) return;
    if (el.nodeType === 3) { const p = el.parentNode; if (p && p.nodeType === 1) trEl(p); return; }
    if (el.nodeType !== 1 || trSkip(el)) return;
    if (el.hasAttribute && TR_ATTR.some(a => el.hasAttribute(a))) trAttrs(el);
    for (const a of el.querySelectorAll('[aria-label],[title],[placeholder],[alt],[data-tip]')) if (!trSkip(a)) trAttrs(a);
    if (!HAN.test(el.textContent)) return;
    if (trLeaf(el)) {
      const kids = [...el.childNodes].filter(c => c.nodeType === 3 || c.nodeType === 1);
      if (kids.length === 1 && kids[0].nodeType === 3) { const r = trStr(kids[0].nodeValue); if (r !== kids[0].nodeValue) { kids[0].nodeValue = r; trSvgFit(el); } }
      else trUnit(el);
      return;
    }
    for (const c of [...el.childNodes]) {
      if (c.nodeType === 3) { if (HAN.test(c.nodeValue)) { const r = trStr(c.nodeValue); if (r !== c.nodeValue) { c.nodeValue = r; trSvgFit(el); } } }
      else if (c.nodeType === 1) trEl(c);
    }
  }
  // 처음 화면과 그 뒤에 바뀌는 화면을 지켜봐요
  let TR_OBS = null; const TR_Q = new Set(); let TR_QON = false;
  function trFlush() {
    TR_QON = false;
    const list = [...TR_Q]; TR_Q.clear();
    for (const n of list) { if (n && n.isConnected) trEl(n); }
    if (document.title && HAN.test(document.title)) document.title = trStr(document.title);
  }
  function i18nDom(root) {
    if (LANG === 'ko' || !root) return 0;
    trEl(root);
    if (!TR_OBS && typeof MutationObserver !== 'undefined') {
      TR_OBS = new MutationObserver(recs => {
        for (const r of recs) {
          if (r.type === 'childList') for (const n of r.addedNodes) TR_Q.add(n.nodeType === 3 ? n.parentNode : n);
          else if (r.type === 'characterData') TR_Q.add(r.target.parentNode);
          else TR_Q.add(r.target);
        }
        if (!TR_QON) { TR_QON = true; queueMicrotask(trFlush); }
      });
      TR_OBS.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: TR_ATTR });
    }
    return 1;
  }
  // 일본어는 둥근 일본어 글꼴을 불러와요(한국어 글꼴에는 가나가 없어요)
  function langFont() {
    if (LANG !== 'ja' || document.getElementById('fontJa')) return;
    const l = document.createElement('link'); l.id = 'fontJa'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700&family=Zen+Maru+Gothic:wght@400;700&display=swap';
    document.head.appendChild(l);
  }
  // 시작하기 전에 한 번: 말을 고르고 사전을 받아요. 못 받으면 한국어로 시작해요
  async function langInit() {
    LANG = langPick();
    if (LANG !== 'ko') {
      // 웹과 앱은 i18n/, 시험 판(dev/test.html)은 한 칸 위 ../i18n/
      I18N = null;
      for (const u of [`i18n/${LANG}.json`, `../i18n/${LANG}.json`]) {
        try { const r = await fetch(u, { cache: 'no-cache' }); if (r.ok) { I18N = await r.json(); break; } } catch (e) { /* 다음 곳 */ }
      }
      if (!I18N || typeof I18N !== 'object') { LANG = 'ko'; I18N = {}; }
    }
    document.documentElement.lang = LANG;
    langFont(); langCss();
    i18nDom(document.body);
  }
  // 꾸밈(CSS)에 적힌 글(가졌어요 도장, 보기 ›, 추천 띠)은 화면 글 바꾸기가 닿지 않아서, 고른 말로 덮는 꾸밈을 따로 넣어요
  const LANG_CSS = [['.shop-panel .si.own::after', '가졌어요'], ['#sheetBuy.is-rec::after', '추천'], ['.dm-tx[data-mgo]>b::after', '가기 ›'],
    ['.tr-souv-d>summary .tr-h::after', '보기 ›'], ['.tr-souv-d[open]>summary .tr-h::after', '접기 ‹'], ['.mg-order.up::before', '새 단계']];
  function langCss() {
    if (LANG === 'ko' || document.getElementById('langCss')) return;
    const q = x => JSON.stringify(String(x));
    const st = document.createElement('style'); st.id = 'langCss';
    st.textContent = LANG_CSS.map(([sel, ko]) => { const v = trStr(ko); return v === ko ? '' : `html[lang="${LANG}"] ${sel}{content:${q(v)}}`; }).join('\n');
    document.head.appendChild(st);
  }
  function langSet(l) {
    l = langOf(l) || 'ko';
    try { localStorage.setItem(LANG_KEY, l); } catch (e) { /* 저장소가 막혀 있어요 */ }
    try { const u = new URL(location.href); u.searchParams.delete('lang'); location.replace(u.toString()); } catch (e) { location.reload(); }
  }
