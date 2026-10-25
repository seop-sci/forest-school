// 안드로이드 판 광고: 구글 애드몹 보상형 광고를 게임의 광고 버튼에 이어 줘요 (window.FOREST_ADS)
import { AdMob, RewardAdPluginEvents, AdmobConsentStatus } from '@capacitor-community/admob';

const AD_UNIT = 'ca-app-pub-5932346459951963/3611713925';   // 보상형 광고 단위 (황금 도토리 1개)
const TESTING = __ADMOB_TEST__;                              // 시험 빌드에서는 구글 테스트 광고를 써요
const CONSENT_RETRY = 60000;                                 // 동의 정보를 못 받았으면 1분 뒤에 다시 물어봐요

let ready = false, loading = false, started = false;
let canAds = false, consentAt = 0, asking = false;           // 1.5.4: 동의 상태가 광고를 허락할 때만 광고를 준비해요
let onDone = null, earned = false;

function finish() {
  const cb = onDone; onDone = null;
  if (cb) cb({ earned });
  earned = false;
  preload();
}
// 유럽 등 동의가 필요한 지역이면 구글 동의 창을 보여 주고, canRequestAds로 광고를 불러도 되는지 확인해요.
// 동의 정보를 못 받으면(인터넷 끊김 등) 광고는 준비하지 않고 게임은 그대로 이어 가요
async function checkConsent() {
  if (canAds || asking) return canAds;
  if (consentAt && Date.now() - consentAt < CONSENT_RETRY) return false;
  asking = true; consentAt = Date.now();
  try {
    let c = await AdMob.requestConsentInfo();
    if (c && c.isConsentFormAvailable && c.status === AdmobConsentStatus.REQUIRED) c = (await AdMob.showConsentForm()) || c;
    canAds = !!(c && c.canRequestAds);
  } catch (e) { canAds = false; }
  asking = false;
  return canAds;
}
async function preload() {
  if (!started || ready || loading) return;
  if (!(await checkConsent())) { setTimeout(preload, CONSENT_RETRY); return; }
  loading = true;
  try { await AdMob.prepareRewardVideoAd({ adId: AD_UNIT, isTesting: TESTING }); ready = true; }
  catch (e) { setTimeout(preload, 20000); }
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
  // done({ earned }): 끝까지 봐서 보상 신호가 왔을 때만 earned가 true예요
  showAd(done) {
    if (!ready) { preload(); done({ earned: false }); return; }
    ready = false; earned = false; onDone = done;
    AdMob.showRewardVideoAd().catch(() => finish());
  }
};
start();
