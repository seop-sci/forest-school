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
  // 처음부터 화면에 적혀 있는 글(src/page)과 이름표(aria-label, title, placeholder, alt)를 사전대로 바꿔요
  function i18nDom(root) {
    if (LANG === 'ko' || !root) return 0;
    let n = 0;
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: x => /[가-힣]/.test(x.nodeValue) && !x.parentNode.closest('script,style,[data-i18n-skip]') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
    const list = []; while (tw.nextNode()) list.push(tw.currentNode);
    for (const x of list) { const k = x.nodeValue.trim(), v = I18N[k]; if (typeof v === 'string') { x.nodeValue = x.nodeValue.replace(k, v); n += 1; } }
    for (const a of ['aria-label', 'title', 'placeholder', 'alt']) for (const e of root.querySelectorAll(`[${a}]`)) { const k = e.getAttribute(a).trim(), v = I18N[k]; if (typeof v === 'string') { e.setAttribute(a, v); n += 1; } }
    return n;
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
