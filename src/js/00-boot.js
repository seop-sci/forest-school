<script>
(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  // 건물 창은 0.25초마다 다시 그려서, 같은 글과 그림도 매번 새로 넣느라 휴대폰이 다시 칠했어요. 바뀐 것만 넣어요
  const setT = (el, v) => { if (!el) return; v = v == null ? '' : String(v); if (el.textContent !== v) el.textContent = v; };
  const setH = (el, v) => { if (!el) return; v = v == null ? '' : String(v); if (el._h !== v) { el._h = v; el.innerHTML = v; } };
  const SAVE_KEY = 'forest-school-v1';
  // 토스 미니앱 판이면 toss/src/bridge.js가 window.AIT에 광고, 저장소, 게임센터 기능을 담아 둬요
  const AIT = window.AIT || null;
  // 앱(안드로이드, 토스) 묶음에는 한 번 보는 것과 고르는 것(이야기 장면 그림, 테마 곡, 행사와 졸업 곡, 테마 지도, 졸업식 그림)을 넣지 않고 웹에서 받아요
  // 받는 곳은 여기 한 곳(WEB_ROOT)에서만 정해요. 웹 판은 지금처럼 게임 옆 폴더에서 받아요
  const WEB_ROOT = 'https://seop-sci.github.io/forest-school/';
  const APP_PACK = () => !!(AIT || window.FOREST_STORE) && !window.FS_IMG_BASE;   // 앱 묶음인지(시험에서 FS_IMG_BASE를 정하면 옆 폴더)
  const webDir = dir => APP_PACK() ? WEB_ROOT + dir : dir === 'audio/' ? AUD_BASE() : IMG_BASE() + dir.replace(/^img\//, '');
  // 받은 파일은 기기 저장(Cache Storage)에 남겨서 다음부터는 인터넷 없이도 써요. 저장을 못 쓰는 기기(안전하지 않은 주소, 옛 WebView)는 그냥 받아요
  const WEB_CACHE = 'fs-web-1';
  const webCacheOk = () => { try { return typeof caches !== 'undefined' && !!caches.open && window.isSecureContext !== false; } catch (e) { return false; } };
  function webFetch(url) {
    const net = () => fetch(url, { mode: 'cors' }).then(r => { if (!r.ok) throw new Error('파일 ' + r.status); return r; });
    if (!webCacheOk()) return net();
    return caches.open(WEB_CACHE).then(c => c.match(url).then(hit => hit || net().then(r => { c.put(url, r.clone()).catch(() => {}); return r; })), () => net());
  }
  const webSrcMap = {};   // 웹 주소 → 화면에 쓸 주소(기기 저장에서 꺼낸 blob 주소)
  const webSrc = url => !/^https?:/.test(url) || !webCacheOk() ? Promise.resolve(url) : webSrcMap[url] ? Promise.resolve(webSrcMap[url])
    : webFetch(url).then(r => r.blob()).then(b => webSrcMap[url] || (webSrcMap[url] = URL.createObjectURL(b)));
  // 그림 하나 받기: 다 오면 ok(주소, 그림), 못 받으면 no()
  function webImg(url, ok, no) {
    webSrc(url).then(u => { const im = new Image(); im.alt = ''; im.decoding = 'async'; im.onload = () => ok(u, im); im.onerror = () => { if (no) no(); }; im.src = u; }, () => { if (no) no(); });
  }
  // 옛 판 지도처럼 주소가 바뀐 파일은 기기 저장에서 지워요(켤 때 한 번)
  function webCachePrune(keep) {
    if (!webCacheOk()) return;
    caches.open(WEB_CACHE).then(c => c.keys().then(ks => ks.forEach(q => { if (!keep(q.url)) c.delete(q); }))).catch(() => {});
  }
  const ADS_EXT = window.FOREST_ADS || null;   // 광고 없이 보상을 주던 옛 스위치(FOREST_NOAD)는 켜는 판이 없어 지웠어요. 보안 점검(2-8): 켤 때 한 번만 읽어요(나중에 바꿔 넣어도 소용없게)
  const motionMQ = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

