// 안드로이드 판 앱 이벤트: 구글 애즈 앱 캠페인이 '앱 전환'으로 셀 수 있게 Firebase(안드로이드 본체)로 이벤트를 보내요 (window.FOREST_TRACK)
// 웹 GA4가 아니라 앱 안의 Firebase SDK로 보내야 '앱 이벤트'가 돼요. google-services.json이 없으면 보내지 않고 조용히 넘어가요.
// 토스 판과 웹 판에는 이 파일이 없어서 게임 쪽 track()은 아무것도 하지 않아요.
import { registerPlugin, Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

const FA = registerPlugin('FirebaseAnalytics');
const NATIVE = Capacitor.isNativePlatform();
const ONCE_KEY = 'forest-fa-once';     // 한 번만 보내는 이벤트를 이미 보냈는지
const FIRST_KEY = 'forest-fa-first';   // 이 기기에서 처음 켠 날(day2_return 계산용)

const rd = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } };
const wr = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* 못 남기면 다음에 다시 보낼 수 있어요 */ } };

// Firebase 규칙: 이름은 영문 40자, 글 값은 100자까지
function clean(p) {
  const o = {};
  if (p && typeof p === 'object') for (const [k, v] of Object.entries(p)) {
    if (typeof v === 'number' && isFinite(v)) o[k.slice(0, 40)] = v;
    else if (v != null) o[k.slice(0, 40)] = String(v).slice(0, 100);
  }
  return o;
}
function send(name, params) {
  if (!NATIVE) return;
  try { FA.logEvent({ name, params: clean(params) }).catch(() => {}); } catch (e) { /* 이벤트 하나 못 보내도 게임은 그대로 */ }
}
function onceSent() { try { return JSON.parse(rd(ONCE_KEY, '{}')) || {}; } catch (e) { return {}; } }
// once가 참이면 이 기기에서 그 이름(또는 once에 준 글)으로 처음 한 번만 보내요
function track(name, params, once) {
  if (!name) return;
  if (once) {
    const key = once === true ? name : name + ':' + once, s = onceSent();
    if (s[key]) return;
    s[key] = 1; wr(ONCE_KEY, JSON.stringify(s));
  }
  send(name, params);
}
window.FOREST_TRACK = track;

// day2_return: 처음 켠 날보다 뒤의 날에 다시 켜면 한 번 보내요
const dayKey = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
function checkReturn() {
  const today = dayKey(), first = Number(rd(FIRST_KEY, 0));
  if (!first) { wr(FIRST_KEY, String(today)); return; }
  if (today > first) track('day2_return', {}, true);
}
checkReturn();
try { App.addListener('resume', checkReturn); } catch (e) { /* 다음에 켤 때 다시 봐요 */ }
