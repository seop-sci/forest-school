// 토스 미니앱 다리: 게임(index.html)이 window.AIT로 토스 기능을 써요.
// 리워드 광고, 토스 앱 저장소, 게임센터 리더보드, 게임 로그인(사용자 키), 닫기, 안전 영역.
import {
  loadFullScreenAd, showFullScreenAd, Storage, Game, getUserKeyForGame, closeView, SafeArea,
} from '@apps-in-toss/web-framework';

// 콘솔 > 인앱 광고에서 만든 리워드 광고 그룹 ID로 바꿔요.
// 개발과 QR 테스트 중에는 테스트 ID를 써야 해요 (진짜 ID로 테스트하면 제재를 받을 수 있어요)
const AD_GROUP_ID = 'ait-ad-test-rewarded-id';

const safe = (f, fb) => { try { return f(); } catch (e) { return fb; } };
const ads = safe(() => loadFullScreenAd.isSupported(), false);
let ready = false, loading = false;

// 광고는 누르기 전에 미리 불러 둬요 (검수 기준이에요)
function preload() {
  if (!ads || ready || loading) return;
  loading = true;
  try {
    loadFullScreenAd({
      options: { adGroupId: AD_GROUP_ID },
      onEvent: (e) => { if (e.type === 'loaded') { ready = true; loading = false; } },
      onError: () => { loading = false; setTimeout(preload, 15000); },
    });
  } catch (e) { loading = false; }
}

// done({ earned }): 끝까지 봐서 userEarnedReward가 왔을 때만 earned가 true예요
function showAd(done) {
  if (!ready) { preload(); done({ earned: false }); return; }
  ready = false;
  let earned = false, finished = false, guard = 0;
  const end = () => {
    if (finished) return;
    finished = true; clearTimeout(guard);
    done({ earned });
    preload();
  };
  try {
    showFullScreenAd({
      options: { adGroupId: AD_GROUP_ID },
      onEvent: (e) => {
        if (e.type === 'userEarnedReward') earned = true;
        if (e.type === 'impression') guard = setTimeout(end, 120000);   // 닫힘 신호가 안 오는 기기를 위한 안전장치
        if (e.type === 'dismissed' || e.type === 'failedToShow') end();
      },
      onError: end,
    });
  } catch (e) { end(); }
}

window.AIT = {
  ads,
  testAd: AD_GROUP_ID.startsWith('ait-ad-test'),
  adReady: () => ready,
  preload,
  showAd,
  storage: {
    getItem: (k) => Promise.resolve().then(() => Storage.getItem(k)).catch(() => null),
    setItem: (k, v) => Promise.resolve().then(() => Storage.setItem(k, v)),
  },
  setScore: (n) => Promise.resolve().then(() => (Game.setLeaderboardScore.isSupported() ? Game.setLeaderboardScore({ score: String(Math.floor(n)) }) : undefined)).catch(() => undefined),
  openBoard: () => Promise.resolve().then(() => Game.openLeaderboard()).catch(() => undefined),
  close: () => Promise.resolve().then(() => closeView()).catch(() => undefined),
  safeArea: () => safe(() => SafeArea.get(), null),
  subscribeSafe: (fn) => safe(() => SafeArea.subscribe({ onEvent: fn }), () => {}),
  userKey: async () => {
    try { const r = await getUserKeyForGame(); return r && r !== 'ERROR' && r.type === 'HASH' ? r.hash : ''; } catch (e) { return ''; }
  },
};
