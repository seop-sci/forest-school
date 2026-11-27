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
      if (v === null || v === undefined || v === '') continue;
      if (!/\{\w+(?:\|[가-힣]+)?\}/.test(k)) { TR_EX.set(k, v); continue; }
      const names = []; let re = '^', last = 0;
      k.replace(TR_HOLE, (m, nm, j, off) => { re += trEsc(k.slice(last, off)) + '(.+?)' + (j && TR_JOSA[j] ? TR_JOSA[j] : ''); names.push(nm); last = off + m.length; return m; });
      re += trEsc(k.slice(last)) + '$';
      const lits = k.split(/\{\w+(?:\|[가-힣]+)?\}/), pre = lits[0], suf = lits[lits.length - 1];
      const p = { re: new RegExp(re, 's'), names, v, w: lits.join('').length };
      if (pre) put(TR_PRE, pre.slice(0, 1), p); else put(TR_SUF, suf.slice(-1), p);
    }
    for (const m of [TR_PRE, TR_SUF]) for (const a of m.values()) a.sort((x, y) => y.w - x.w);
  }
  function trPick(v, g) {                        // 복수형: 첫 숫자 자리로 골라요
    if (typeof v === 'string') return v;
    const x = g.find(y => /\d/.test(y)); const n = x ? Number(String(x).replace(/[^\d.]/g, '')) : 2;
    return v[plural(isFinite(n) ? n : 2)] || v.other || '';
  }
  // 글 하나를 바꿔요. 못 바꾸면 그대로 돌려줘요
  function trStr(s, d = 0) {
    if (LANG === 'ko' || !s || !HAN.test(s)) return s;
    if (!TR_EX) trBuild();
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s), core = trNorm(m[2]);
    let r = TR_CACHE.get(core);
    if (r === undefined) {
      r = null;
      const ex = TR_EX.get(core);
      if (ex !== undefined) r = trPick(ex, []);
      else {
        const cand = [...(TR_PRE.get(core.slice(0, 1)) || []), ...(TR_SUF.get(core.slice(-1)) || [])];
        for (const p of cand) {
          const g = p.re.exec(core); if (!g) continue;
          const vals = {}; p.names.forEach((nm, i) => { vals[nm] = g[i + 1]; });
          const tpl = trPick(p.v, g.slice(1));
          r = tpl.replace(TR_HOLE, (h, nm) => nm in vals ? (d < 3 ? trStr(vals[nm], d + 1) : vals[nm]) : h);
          break;
        }
      }
      if (r === null && d === 0 && !core.includes('<')) {   // 통째로 없으면 한글 덩이마다(예: '교실 Lv.14'의 '교실'), 그래도 없으면 낱말마다
        let hit = false;
        const one = w => { const x = TR_EX.get(w); return typeof x === 'string' ? (hit = true, x) : null; };
        const rr = core.replace(/[가-힣][가-힣 ]*[가-힣]|[가-힣]/g, run => one(run) ?? run.split(' ').map(w => one(w) ?? w).join(' '));
        if (hit) r = rr;
      }
      if (r === null && window.__FOREST_TEST && d === 0) TR_MISS.set(core, (TR_MISS.get(core) || 0) + 1);
      if (TR_CACHE.size > 6000) TR_CACHE.clear();
      TR_CACHE.set(core, r);
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
  function trTexts(el) {                         // 글 조각을 하나씩 바꿔요
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const list = []; while (tw.nextNode()) if (HAN.test(tw.currentNode.nodeValue)) list.push(tw.currentNode);
    for (const x of list) { const r = trStr(x.nodeValue); if (r !== x.nodeValue) x.nodeValue = r; }
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
      if (kids.length === 1 && kids[0].nodeType === 3) { const r = trStr(kids[0].nodeValue); if (r !== kids[0].nodeValue) kids[0].nodeValue = r; }
      else trUnit(el);
      return;
    }
    for (const c of [...el.childNodes]) {
      if (c.nodeType === 3) { if (HAN.test(c.nodeValue)) { const r = trStr(c.nodeValue); if (r !== c.nodeValue) c.nodeValue = r; } }
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
    langFont();
    i18nDom(document.body);
  }
  function langSet(l) {
    l = langOf(l) || 'ko';
    try { localStorage.setItem(LANG_KEY, l); } catch (e) { /* 저장소가 막혀 있어요 */ }
    try { const u = new URL(location.href); u.searchParams.delete('lang'); location.replace(u.toString()); } catch (e) { location.reload(); }
  }
