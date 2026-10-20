// 안드로이드 판 광고: 구글 애드몹 보상형 광고를 게임의 광고 버튼에 이어 줘요 (window.FOREST_ADS)
import { AdMob, RewardAdPluginEvents, AdmobConsentStatus } from '@capacitor-community/admob';

const AD_UNIT = 'ca-app-pub-5932346459951963/3611713925';   // 보상형 광고 단위 (황금 도토리 1개)
const TESTING = __ADMOB_TEST__;                              // 시험 빌드에서는 구글 테스트 광고를 써요

let ready = false, loading = false, started = false;
let onDone = null, earned = false;

function finish() {
  const cb = onDone; onDone = null;
  if (cb) cb({ earned });
  earned = false;
  preload();
}
async function preload() {
  if (!started || ready || loading) return;
  loading = true;
  try { await AdMob.prepareRewardVideoAd({ adId: AD_UNIT, isTesting: TESTING }); ready = true; }
  catch (e) { setTimeout(preload, 20000); }
  loading = false;
}
async function start() {
  try {
    await AdMob.initialize();
    // 유럽 등 동의가 필요한 지역이면 구글 동의 창을 먼저 보여 줘요
    try {
      const c = await AdMob.requestConsentInfo();
      if (c.isConsentFormAvailable && c.status === AdmobConsentStatus.REQUIRED) await AdMob.showConsentForm();
    } catch (e) { /* 동의 정보를 못 받아도 게임은 계속 */ }
    AdMob.addListener(RewardAdPluginEvents.Rewarded, () => { earned = true; });
    AdMob.addListener(RewardAdPluginEvents.Dismissed, finish);
    AdMob.addListener(RewardAdPluginEvents.FailedToShow, finish);
    started = true;
    preload();
  } catch (e) { started = false; }
}
window.FOREST_ADS = {
  adReady: () => ready,
  preload,
  // done({ earned }): 끝까지 봐서 보상 신호가 왔을 때만 earned가 true예요
  showAd(done) {
    if (!ready) { preload(); done({ earned: false }); return; }
    ready = false; earned = false; onDone = done;
    AdMob.showRewardVideoAd().catch(() => finish());
  }
};
start();
