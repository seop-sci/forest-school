// 안드로이드 광고 시험: 가짜 애드몹 SDK로 app/src/ads.js를 묶어서, 동의 상태가 광고를 허락할 때만 광고를 준비하는지 봐요.
// 쓰는 법: node dev/check_ads.mjs   (toss/node_modules의 esbuild를 써요. 마지막 줄이 PASS면 통과)
import { build } from '../toss/node_modules/esbuild/lib/main.js';
import vm from 'node:vm';
const fake = `
export const AdmobConsentStatus = { REQUIRED: 'REQUIRED', OBTAINED: 'OBTAINED' };
export const RewardAdPluginEvents = { Rewarded: 'r', Dismissed: 'd', FailedToShow: 'f' };
export const AdMob = {
  initialize: async () => {}, addListener: () => {},
  requestConsentInfo: async () => { globalThis.LOG.push('consent'); if (globalThis.MODE === 'fail') throw new Error('net'); return { status: 'REQUIRED', isConsentFormAvailable: true, canRequestAds: false }; },
  showConsentForm: async () => { globalThis.LOG.push('form'); return { status: globalThis.MODE === 'yes' ? 'OBTAINED' : 'REQUIRED', canRequestAds: globalThis.MODE === 'yes' }; },
  prepareRewardVideoAd: async () => { globalThis.LOG.push('prepare'); },
  showRewardVideoAd: async () => {}
};`;
const out = await build({ entryPoints: ['app/src/ads.js'], bundle: true, write: false, format: 'iife', define: { __ADMOB_TEST__: 'true' },
  plugins: [{ name: 'fake', setup(b) { b.onResolve({ filter: /^@capacitor-community\/admob$/ }, () => ({ path: 'fake', namespace: 'fake' })); b.onLoad({ filter: /.*/, namespace: 'fake' }, () => ({ contents: fake, loader: 'js' })); } }] });
const code = out.outputFiles[0].text;
const fails = [];
for (const mode of ['no', 'fail', 'yes']) {
  const g = { LOG: [], MODE: mode, setTimeout: () => 0, Date, console };
  g.window = g; g.globalThis = g;
  vm.runInNewContext(code, g);
  await new Promise(r => setTimeout(r, 50));
  const prepared = g.LOG.includes('prepare');
  const st = g.FOREST_ADS.adState();
  console.log(mode, g.LOG.join(','), 'state=' + (st || 'ready'));
  if (mode !== 'yes' && prepared) fails.push(`${mode}: 동의가 없는데 광고를 준비했어요`);
  if (mode === 'yes' && !prepared) fails.push('yes: 동의했는데 광고를 준비하지 않았어요');
  if (mode === 'no' && st !== 'consent') fails.push('no: 상태가 consent가 아니에요');
}
fails.forEach(f => console.log('FAIL', f));
console.log(fails.length ? `FAIL (${fails.length})` : 'PASS');
