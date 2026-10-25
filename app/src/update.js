// 안드로이드 판 업데이트 알림 (1.4.0): 플레이에 새 버전이 있으면 게임 창으로 알려 줘요.
// 앞자리나 가운데 자리가 바뀌는 큰 업데이트(1.3.0 → 1.4.0, 1.x → 2.0.0)는 필수, 끝자리만 바뀌면 권장("나중에" 가능).
// 플레이는 새 버전의 이름(1.4.0)을 알려 주지 않아서, 같은 때 바뀌는 웹 판(GitHub Pages) 첫머리의 버전 표시를 읽어 비교해요.
import { AppUpdate, AppUpdateAvailability, FlexibleUpdateInstallStatus } from '@capawesome/capacitor-app-update';

const PAGES = 'https://seop-sci.github.io/forest-school/';
const parts = s => { const m = /(\d+)\.(\d+)\.(\d+)/.exec(String(s || '')); return m ? m.slice(1).map(Number) : null; };
const mine = () => { const m = document.querySelector('meta[name="forest-version"]'); return m ? m.content : ''; };

// 큰 업데이트인지: 앞자리가 오르거나, 앞자리가 같고 가운데 자리가 오르면
export function isBig(cur, next) {
  const A = parts(cur), B = parts(next);
  if (!A || !B) return false;
  return B[0] > A[0] || (B[0] === A[0] && B[1] > A[1]);
}

async function latestWeb() {
  try {
    const r = await fetch(PAGES + '?v=' + Date.now(), { headers: { Range: 'bytes=0-2047' }, cache: 'no-store' });
    const m = /name="forest-version" content="([\d.]+)"/.exec((await r.text()).slice(0, 8000));
    return m ? m[1] : '';
  } catch (e) { return ''; }
}

// 게임의 확인 창으로 물어봐요. 게임이 아직 준비되지 않았으면 묻지 않은 것으로(false) 해요
const ask = o => new Promise(done => {
  if (typeof window.FOREST_ASK !== 'function') { done(false); return; }
  window.FOREST_ASK({ ...o, done });
});

async function mustUpdate() {
  for (let i = 0; i < 5; i++) {
    let r;
    try { r = await AppUpdate.performImmediateUpdate(); } catch (e) { r = { code: 2 }; }
    if (r && r.code === 0) return;
    const again = await ask({ title: '업데이트가 필요해요', text: '큰 업데이트가 나왔어요. 업데이트해야 계속 놀 수 있어요.', yes: '업데이트', no: '앱 닫기' });
    if (!again) { if (window.FOREST_APP) window.FOREST_APP.exit(); return; }
  }
}

let readyAsked = false;
async function flexReady() {
  if (readyAsked) return;
  readyAsked = true;
  const ok = await ask({ title: '업데이트 준비 끝', text: '새 버전을 다 받았어요. 지금 다시 켜서 적용할까요?', yes: '다시 켜기', no: '나중에' });
  if (!ok) return;
  if (window.FOREST_SAVE) window.FOREST_SAVE();
  AppUpdate.completeFlexibleUpdate().catch(() => undefined);
}

async function check() {
  let info;
  try { info = await AppUpdate.getAppUpdateInfo(); } catch (e) { return; }   // 플레이에서 받지 않은 앱이면 조용히 넘어가요
  if (info.installStatus === FlexibleUpdateInstallStatus.DOWNLOADED) { flexReady(); return; }
  if (info.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE) return;
  const big = isBig(mine(), await latestWeb());
  if (big && info.immediateUpdateAllowed !== false) { await mustUpdate(); return; }
  const ok = await ask({ title: '새 버전이 나왔어요', text: '지금 업데이트할까요? 받는 동안에도 계속 놀 수 있어요.', yes: '업데이트', no: '나중에' });
  if (!ok) return;
  if (info.flexibleUpdateAllowed !== false) {
    AppUpdate.addListener('onFlexibleUpdateStateChange', s => { if (s.installStatus === FlexibleUpdateInstallStatus.DOWNLOADED) flexReady(); });
    AppUpdate.startFlexibleUpdate().catch(() => undefined);
  } else {
    AppUpdate.performImmediateUpdate().catch(() => undefined);
  }
}

// 로딩 화면이 끝나고 게임이 자리 잡은 뒤에 확인해요
setTimeout(check, 6000);
