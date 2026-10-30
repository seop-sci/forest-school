// 안드로이드 판 광고: 구글 애드몹 보상형 광고를 게임의 광고 버튼에 이어 줘요 (window.FOREST_ADS)
import { AdMob, RewardAdPluginEvents, AdmobConsentStatus } from '@capacitor-community/admob';

const AD_UNIT = 'ca-app-pub-5932346459951963/3611713925';   // 보상형 광고 단위 (황금 도토리 1개)
const TESTING = __ADMOB_TEST__;                              // 시험 빌드에서는 구글 테스트 광고를 써요
const CONSENT_RETRY = 60000;                                 // 동의 정보를 못 받았으면 1분 뒤부터 다시 물어봐요(실패가 이어지면 10분까지 늘려요)
const CONSENT_RETRY_MAX = 600000;
const CONSENT_KEY = 'forest-ads-consent';                    // 2.2.0 검토 4: 지난번에 SDK가 알려 준 canRequestAds(1 또는 0)

let ready = false, loading = false, started = false;
let canAds = false, consentAt = 0, asking = false;           // 1.5.4: 동의 상태가 광고를 허락할 때만 광고를 준비해요
let consentWait = CONSENT_RETRY, consentFails = 0, consentErr = false;
let onDone = null, earned = false;
let lastErr = '';                                            // 1.7.1: 광고를 못 불러온 까닭(애드몹 오류 코드)을 게임 알림에 보여 줘요

function finish() {
  const cb = onDone; onDone = null;
  if (cb) cb({ earned });
  earned = false;
  preload();
}
function savedConsent() { try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; } }
function keepConsent(ok) { try { localStorage.setItem(CONSENT_KEY, ok ? '1' : '0'); } catch (e) { /* 남기지 못해도 이번에는 SDK 답을 써요 */ } }
// 유럽 등 동의가 필요한 지역이면 구글 동의 창을 보여 주고, SDK가 알려 준 canRequestAds가 true일 때만 광고를 불러요.
// 2.2.0 검토 4: 예전(1.7.2)에는 동의 정보를 못 받으면 광고를 불렀어요. 이제는 실패를 허락으로 바꾸지 않아요.
// 구글 UMP는 동의 정보 갱신이 실패해도 지난 세션에 SDK가 얻은 동의로 canRequestAds를 답해요. 이 꾸러미는 실패하면 그 값을 주지 않아서,
// 지난번 성공한 확인에서 SDK가 준 canRequestAds를 기기에 남겨 두었다가 같은 뜻으로만 써요(SDK가 허락한 적이 없으면 광고 없음).
// 광고가 없어도 게임은 그대로 이어 가고, 동의 확인은 1분, 2분, 4분… 10분 간격으로 다시 해 봐요
async function checkConsent() {
  if (canAds || asking) return canAds;
  if (consentAt && Date.now() - consentAt < consentWait) return false;
  asking = true; consentAt = Date.now();
  try {
    let c = await AdMob.requestConsentInfo();
    if (c && c.isConsentFormAvailable && c.status === AdmobConsentStatus.REQUIRED) {
      const f = await AdMob.showConsentForm();
      if (f && typeof f.canRequestAds === 'boolean') c = f;
    }
    canAds = !!(c && c.canRequestAds === true);
    keepConsent(canAds); consentErr = false; consentFails = 0; consentWait = CONSENT_RETRY; lastErr = canAds ? lastErr : 'consent:denied';
  } catch (e) {
    lastErr = 'consent:' + String((e && (e.code ?? e.message)) || '').slice(0, 40);
    canAds = savedConsent() === '1';   // 지난번 SDK가 광고를 허락했을 때만. 처음 켰거나 거절했으면 광고 없음
    consentErr = !canAds;
    consentFails += 1; consentWait = Math.min(CONSENT_RETRY_MAX, CONSENT_RETRY * 2 ** (consentFails - 1));
  }
  asking = false;
  return canAds;
}
async function preload() {
  if (!started || ready || loading) return;
  if (!(await checkConsent())) { setTimeout(preload, consentWait); return; }
  loading = true;
  try { await AdMob.prepareRewardVideoAd({ adId: AD_UNIT, isTesting: TESTING }); ready = true; lastErr = ''; }
  catch (e) { lastErr = String((e && (e.code ?? e.message)) || 'unknown').slice(0, 60); setTimeout(preload, 20000); }
  loading = false;
}
async function start() {
  try {
    await AdMob.initialize();
    AdMob.addListener(RewardAdPluginEvents.Rewarded, () => { earned = true; });
    AdMob.addListener(RewardAdPluginEvents.Dismissed, finish);
    AdMob.addListener(RewardAdPluginEvents.FailedToShow, finish);
    started = true;
    preload();
  } catch (e) { started = false; }
}
window.FOREST_ADS = {
  adReady: () => ready,
  // 광고를 쓸 수 없는 까닭: 'consent'(동의가 없어요), 'loading'(준비 중), ''(준비됨)
  adState: () => (ready ? '' : (started && !canAds && consentAt ? 'consent' : 'loading')),
  preload,
  // 1.7.1 마지막으로 광고를 못 불러온 까닭. 애드몹 코드 0 내부 오류, 1 잘못된 요청, 2 인터넷, 3 줄 광고 없음
  adError: () => lastErr,
  // done({ earned }): 끝까지 봐서 보상 신호가 왔을 때만 earned가 true예요
  showAd(done) {
    if (!ready) { preload(); done({ earned: false }); return; }
    ready = false; earned = false; onDone = done;
    AdMob.showRewardVideoAd().catch(() => finish());
  }
};
start();
