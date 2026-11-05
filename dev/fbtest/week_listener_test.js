// 보안 보강 1절(2026-11-06): 실제 게임의 fbRank().listenWeek를 실행해, 다음 주로 쓴 줄 60개가 있어도 이번 주 줄을 받는지, 주가 바뀌면 다시 붙는지, 끝낼 때 정리하는지 봐요. 서버 요청 없음.
// 쓰는 법: node dev/fbtest/week_listener_test.js [dev/forest-school.html]   (마지막 줄 PASS)
const fs = require('fs'), vm = require('vm'), assert = require('assert/strict');
const file = process.argv[2] || 'dev/forest-school.html';
const source = fs.readFileSync(file, 'utf8');
const start = source.indexOf('  function fbRank()');
const end = source.indexOf('  async function initRank()', start);
assert(start > 0 && end > start);
const W = 43, rows = {};
for (let i = 0; i < 5; i++) rows['ok' + i] = { week: W, lp: 300 + i, ws: W * 1e6 + 300 + i };
for (let i = 0; i < 60; i++) { rows['next' + i] = { week: W + 1, lp: i, ws: (W + 1) * 1e6 + i }; rows['old' + i] = { week: W - 1, lp: 900, ws: (W - 1) * 1e6 + 900 }; }
let week = W, interval, cleared = false, received = [], active = 0;
const make = order => ({
  startAt(n) { this.lo = n; return this; }, endAt(n) { this.hi = n; return this; },
  equalTo(n) { this.lo = this.hi = n; return this; },
  limitToLast(n) { this.last = n; return this; },
  on(event, cb) {
    active++;
    let pairs = Object.entries(rows).filter(([k, v]) => (this.lo === undefined || v[order] >= this.lo) && (this.hi === undefined || v[order] <= this.hi));
    pairs.sort((a, b) => a[1][order] - b[1][order]);
    if (this.last) pairs = pairs.slice(-this.last);
    cb({ forEach: fn => pairs.forEach(([key, v]) => fn({ key, val: () => v })) });
  },
  off() { active--; }
});
const context = { Cloud: { uid: 'A', db: { ref: () => ({ orderByChild: make }) } }, RANK_MAX: 50,
  weekIdx: () => week, rsNum: () => 1, setInterval: fn => { interval = fn; return 1; }, clearInterval: () => { cleared = true; } };
vm.runInNewContext(source.slice(start, end) + '\nthis.backend = fbRank();', context);
const stop = context.backend.listenWeek(pairs => { received = pairs; }, e => { throw e; });
assert.equal(received.length, 5, '이번 주 5명을 모두 받아요: ' + received.length);
assert(received.every(x => x[1].week === W));
assert.equal(received[0][0], 'ok4', '위에서부터(점수 높은 순)');
assert.equal(active, 1);
interval(); assert.equal(active, 1, '같은 주면 다시 붙지 않아요');
week = W + 1; interval();
assert.equal(received.length, 60); assert(received.every(x => x[1].week === W + 1)); assert.equal(active, 1, '주가 바뀌면 새 범위로 다시 붙어요');
stop(); assert.equal(active, 0); assert(cleared);
console.log('PASS actual fbRank: this week range only, week change resubscribe, listener/timer cleanup');
