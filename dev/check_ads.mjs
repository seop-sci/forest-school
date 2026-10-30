// 안드로이드 광고 시험: 가짜 애드몹 SDK로 app/src/ads.js를 묶어서, SDK가 canRequestAds로 허락할 때만 광고를 준비하는지 봐요.
// 2.2.0 검토 4: 거절, 동의 정보 오류(처음, 지난번 허락, 지난번 거절), 허락, 오류 뒤 다시 확인(재시도)을 봐요.
// 쓰는 법: node dev/check_ads.mjs   (toss/node_modules의 esbuild를 써요. 마지막 줄이 PASS면 통과)
import { build } from '../toss/node_modules/esbuild/lib/main.js';
import vm from 'node:vm';
const fake = `
export const AdmobConsentStatus = { REQUIRED: 'REQUIRED', OBTAINED: 'OBTAINED' };
export const RewardAdPluginEvents = { Rewarded: 'r', Dismissed: 'd', FailedToShow: 'f' };
export const AdMob = {
  initialize: async () => {}, addListener: () => {},
  requestConsentInfo: async () => { const m = globalThis.MODES.shift() || globalThis.MODE; globalThis.CUR = m; globalThis.LOG.push('consent:' + m); if (m === 'fail') throw new Error('net');
    if (m === 'ok') return { status: 'OBTAINED', isConsentFormAvailable: false, canRequestAds: true };
    return { status: 'REQUIRED', isConsentFormAvailable: true, canRequestAds: false }; },
  showConsentForm: async () => { globalThis.LOG.push('form'); const y = globalThis.CUR === 'yes'; return { status: y ? 'OBTAINED' : 'REQUIRED', canRequestAds: y }; },
  prepareRewardVideoAd: async () => { globalThis.LOG.push('prepare'); },
  showRewardVideoAd: async () => {}
};`;
const out = await build({ entryPoints: ['app/src/ads.js'], bundle: true, write: false, format: 'iife', define: { __ADMOB_TEST__: 'true' },
  plugins: [{ name: 'fake', setup(b) { b.onResolve({ filter: /^@capacitor-community\/admob$/ }, () => ({ path: 'fake', namespace: 'fake' })); b.onLoad({ filter: /.*/, namespace: 'fake' }, () => ({ contents: fake, loader: 'js' })); } }] });
const code = out.outputFiles[0].text;
const fails = [];
const tick = () => new Promise(r => setTimeout(r, 30));
// 한 경우: modes는 차례로 쓰는 SDK 답, saved는 기기에 남은 지난 답, steps는 시계를 앞으로 돌리며 다시 부르는 횟수
async function run(name, { mode, modes = [], saved = null, steps = 0 }) {
  let clock = 1e12; const timers = [], store = new Map(saved == null ? [] : [['forest-ads-consent', saved]]);
  const g = { LOG: [], MODE: mode, MODES: modes.slice(), setTimeout: (f, ms) => { timers.push({ f, at: clock + ms }); return timers.length; }, console,
    Date: class extends Date { static now() { return clock; } },
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)) } };
  g.window = g; g.globalThis = g;
  vm.runInNewContext(code, g);
  await tick();
  const waits = [];
  for (let i = 0; i < steps; i++) {
    const t = timers.filter(x => !x.done).sort((a, b) => a.at - b.at)[0]; if (!t) break;
    waits.push(t.at - clock); clock = t.at; t.done = true; t.f(); await tick();
  }
  const st = g.FOREST_ADS.adState();
  console.log(name, g.LOG.join(','), 'state=' + (st || 'ready'), 'saved=' + store.get('forest-ads-consent'), waits.length ? 'waits=' + waits.join('/') : '');
  return { prepared: g.LOG.includes('prepare'), st, saved: store.get('forest-ads-consent'), log: g.LOG, waits };
}
let r = await run('거절', { mode: 'no' });
if (r.prepared) fails.push('거절: 광고를 준비했어요'); if (r.st !== 'consent') fails.push('거절: 상태가 consent가 아니에요'); if (r.saved !== '0') fails.push('거절: 거절을 남기지 않았어요');
r = await run('오류(처음)', { mode: 'fail' });
if (r.prepared) fails.push('오류(처음): 동의 확인이 실패했는데 광고를 준비했어요'); if (r.st !== 'consent') fails.push('오류(처음): 상태가 consent가 아니에요');
r = await run('오류(지난번 거절)', { mode: 'fail', saved: '0' });
if (r.prepared) fails.push('오류(지난번 거절): 광고를 준비했어요');
r = await run('오류(지난번 허락)', { mode: 'fail', saved: '1' });
if (!r.prepared) fails.push('오류(지난번 허락): SDK가 지난번 허락한 동의로 광고를 준비하지 않았어요');
r = await run('허락', { mode: 'yes' });
if (!r.prepared) fails.push('허락: 광고를 준비하지 않았어요'); if (r.saved !== '1') fails.push('허락: 허락을 남기지 않았어요');
r = await run('지난번 허락 뒤 거절', { mode: 'no', saved: '1' });
if (r.prepared) fails.push('지난번 허락 뒤 거절: 새 SDK 답(거절)보다 남은 값을 썼어요'); if (r.saved !== '0') fails.push('지난번 허락 뒤 거절: 남은 값을 바꾸지 않았어요');
r = await run('재시도', { mode: 'ok', modes: ['fail', 'fail', 'fail'], steps: 4 });
if (r.log.filter(x => x === 'consent:fail').length !== 3) fails.push('재시도: 실패 뒤 다시 묻지 않았어요');
if (!r.prepared) fails.push('재시도: 다시 물어 허락을 받았는데 광고를 준비하지 않았어요');
if (r.log.indexOf('prepare') < r.log.indexOf('consent:ok')) fails.push('재시도: 허락 전에 광고를 준비했어요');
if (!(r.waits[0] === 60000 && r.waits[1] === 120000 && r.waits[2] === 240000)) fails.push('재시도: 간격이 1분, 2분, 4분이 아니에요 ' + r.waits.join('/'));
fails.forEach(f => console.log('FAIL', f));
console.log(fails.length ? `FAIL (${fails.length})` : 'PASS');
