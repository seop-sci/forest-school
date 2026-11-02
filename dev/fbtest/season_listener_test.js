// 실제 게임의 fbRank 함수를 실행해 조회 순서와 시즌 전환/구독 해제를 확인해요. 서버 요청 없음.
const fs = require('fs'), vm = require('vm'), assert = require('assert/strict');
const file = process.argv[2] || 'dev/forest-school.html';
const source = fs.readFileSync(file, 'utf8');
const start = source.indexOf('  function fbRank()');
const end = source.indexOf('  async function initRank()', start);
assert(start > 0 && end > start);
const rows = { current: { sk: 2, sp: 100 } };
for (let i = 0; i < 60; i++) { rows['old' + i] = { sk: 1, sp: 1000 }; rows['future' + i] = { sk: 3, sp: 2000 }; }
let season = 2, interval, cleared = false, received = [], active = 0;
const make = order => ({
  equalTo(n) { this.equal = n; return this; },
  limitToLast(n) { this.last = n; return this; },
  on(event, cb) {
    active++;
    let pairs = Object.entries(rows).filter(([k, v]) => this.equal === undefined || v[order] === this.equal);
    pairs.sort((a, b) => a[1][order] - b[1][order]);
    if (this.last) pairs = pairs.slice(-this.last);
    cb({ forEach: fn => pairs.forEach(([key, v]) => fn({ key, val: () => v })) });
  },
  off() { active--; }
});
const context = { Cloud: { uid: 'A', db: { ref: () => ({ orderByChild: make }) } }, RANK_MAX: 50,
  rsNum: () => season, setInterval: fn => { interval = fn; return 1; }, clearInterval: () => { cleared = true; } };
vm.runInNewContext(source.slice(start, end) + '\nthis.backend = fbRank();', context);
const stop = context.backend.listenSea(pairs => { received = pairs; }, e => { throw e; });
assert.deepEqual(Array.from(received, x => x[0]), ['current']);
assert.equal(active, 1);
season = 3; interval();
assert.equal(received.length, 60);
assert(received.every(x => x[1].sk === 3));
assert.equal(active, 1);
stop(); assert.equal(active, 0); assert(cleared);
console.log('PASS actual fbRank: current season first, boundary resubscribe, listener/timer cleanup');
