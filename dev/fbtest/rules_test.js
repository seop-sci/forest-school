// database.rules.json을 targaryen으로 시험해요: 누가 어디를 읽고 쓸 수 있는지
const targaryen = require('targaryen');
const rules = require(process.argv[2]);
const SAVE = { d: '{"v":4}', at: 1, v: '1.0' };
const RANK = { name: '지섭 교장', score: 120, at: { '.sv': 'timestamp' }, tier: 1, year: 2, test: false, pid: 'K7QM2XPA', week: 42, lp: 310, ws: 42000310 };
const STAT = { seen: 1, pid: 'K7QM2XPA', name: '', tier: 0 };
const NOW = Date.now();
const base = { forest: { saves: { A: SAVE }, rank: { A: Object.assign({}, RANK, { at: NOW - 3600e3 }), C: Object.assign({}, RANK, { score: 5000, at: NOW - 10e3, lp: 900, ws: 42000900 }) }, stats: { A: STAT }, admins: { Z: 'key' }, adminKey: 'key',
  moves: { K7QM2XPA: { d: 'x', at: NOW - 60000, from: 'A', v: '1.0' }, OLDC2345: { d: 'x', at: NOW - 31 * 60000, from: 'A', v: '1.0' } } } };
const fresh = () => targaryen.database(rules, base);   // 처음 상태는 로그인 안 한 사람
const as = uid => uid ? fresh().as({ uid, provider: 'anonymous' }) : fresh();
let pass = 0, fail = 0;
function t(name, got, want) {
  if (got === want) pass++;
  else { fail++; console.log('FAIL', name, 'got', got, 'want', want); }
}
const R = (uid, path) => as(uid).read(path, { now: Date.now() }).allowed;   // 읽기 규칙의 now를 넣어 줘요
const W = (uid, path, v) => as(uid).write(path, v).allowed;

// 게임 저장: 나만
t('save read own', R('A', '/forest/saves/A'), true);
t('save read other', R('B', '/forest/saves/A'), false);
t('save read anon', R(null, '/forest/saves/A'), false);
t('save list', R('A', '/forest/saves'), false);
t('save write own', W('A', '/forest/saves/A', SAVE), true);
t('save write other', W('B', '/forest/saves/A', SAVE), false);
t('save write anon', W(null, '/forest/saves/A', SAVE), false);
t('save bad shape', W('A', '/forest/saves/A', { d: 1, at: 1, v: '1.0' }), false);
t('save missing v', W('A', '/forest/saves/A', { d: 'x', at: 1 }), false);
t('save too big', W('A', '/forest/saves/A', { d: 'x'.repeat(200000), at: 1, v: '1.0' }), false);
t('save delete own', W('A', '/forest/saves/A', null), true);
// 2.2.0 예전 학교 남기기: 나만, 칸은 0~2
const BAK = { d: '{"v":4}', at: 1, v: '2.2.0', pid: 'K7QM2XPA', prog: 20015, sum: '중학교 3학년', sv: 1, why: 'x' };
t('bak write own slot', W('A', '/forest/bak/A/0', BAK), true);
t('bak write own slot 2', W('A', '/forest/bak/A/2', BAK), true);
t('bak write slot 3', W('A', '/forest/bak/A/3', BAK), false);
t('bak write other', W('B', '/forest/bak/A/0', BAK), false);
t('bak write anon', W(null, '/forest/bak/A/0', BAK), false);
t('bak read own', R('A', '/forest/bak/A'), true);
t('bak read other', R('B', '/forest/bak/A'), false);
t('bak list', R('A', '/forest/bak'), false);
t('bak bad shape', W('A', '/forest/bak/A/1', { d: 1, at: 1, v: '1' }), false);
t('bak too big', W('A', '/forest/bak/A/1', { d: 'x'.repeat(200000), at: 1, v: '1' }), false);
t('bak delete own', W('A', '/forest/bak/A/1', null), true);
// 랭킹: 로그인한 사람은 모두 읽고, 내 칸만 써요
t('rank read', R('B', '/forest/rank'), true);
t('rank read anon', R(null, '/forest/rank'), false);
t('rank write own', W('B', '/forest/rank/B', RANK), true);
t('rank write other', W('B', '/forest/rank/A', RANK), false);
t('rank server time', W('B', '/forest/rank/B', Object.assign({}, RANK, { at: { '.sv': 'timestamp' } })), true);
t('rank name 10', W('B', '/forest/rank/B', Object.assign({}, RANK, { name: '가나다라마바사아자차' })), true);
t('rank name 11', W('B', '/forest/rank/B', Object.assign({}, RANK, { name: '가나다라마바사아자차카' })), false);
// 2.0.1 숲속 대결 순위(bt 대결 점수, btm 메달). 2.2.0 검토 1: bt를 올리려면 btq(하루 200점 시간 예산)가 있어야 하고, 메달은 bt 리그를 넘지 못해요(자세한 시험은 rules_bt.js)
const DAY = 86400e3;
t('bt first 1190', W('B', '/forest/rank/B', Object.assign({}, RANK, { bt: 1190, btq: NOW - DAY + 190 * 432000 + 5000, btm: 1 })), true);
t('bt first 1500', W('B', '/forest/rank/B', Object.assign({}, RANK, { bt: 1500, btq: NOW - 1000, btm: 1 })), false);
t('bt first no btq', W('B', '/forest/rank/B', Object.assign({}, RANK, { bt: 1200, btm: 1 })), false);
t('bt first 1000 no btq', W('B', '/forest/rank/B', Object.assign({}, RANK, { bt: 1000, btm: 0 })), true);
t('bt below 1000', W('B', '/forest/rank/B', Object.assign({}, RANK, { bt: 999, btq: NOW - DAY })), false);
t('btm 6', W('B', '/forest/rank/B', Object.assign({}, RANK, { bt: 1000, btq: NOW - DAY, btm: 6 })), false);
t('btm over league', W('B', '/forest/rank/B', Object.assign({}, RANK, { bt: 1000, btq: NOW - DAY, btm: 1 })), false);
t('bt old row', W('A', '/forest/rank/A', Object.assign({}, RANK, { bt: 1190, btq: NOW - DAY + 190 * 432000 + 5000, btm: 0 })), true);
{ const db = targaryen.database(rules, { forest: { rank: { D: Object.assign({}, RANK, { at: NOW - DAY, bt: 1500, btq: NOW - 2 * DAY, btm: 2 }) } } }).as({ uid: 'D', provider: 'anonymous' });
  t('bt day later +190', db.write('/forest/rank/D', Object.assign({}, RANK, { bt: 1690, btq: NOW - DAY + 190 * 432000 + 1000, btm: 2 })).allowed, true);
  t('bt day later +390', db.write('/forest/rank/D', Object.assign({}, RANK, { bt: 1890, btq: NOW - 1000, btm: 2 })).allowed, false);
  t('btm down', db.write('/forest/rank/D', Object.assign({}, RANK, { bt: 1500, btq: NOW - DAY, btm: 1 })).allowed, false);
  t('bt down ok', db.write('/forest/rank/D', Object.assign({}, RANK, { bt: 1000, btq: NOW - DAY + 5000, btm: 2 })).allowed, true);
  t('btq future', db.write('/forest/rank/D', Object.assign({}, RANK, { bt: 1500, btq: NOW + 60000, btm: 2 })).allowed, false);
  t('btq dropped', db.write('/forest/rank/D', Object.assign({}, RANK, { bt: 1500, btm: 2 })).allowed, false);
  t('no bt ok', db.write('/forest/rank/D', Object.assign({}, RANK)).allowed, true); }
t('rank name empty', W('B', '/forest/rank/B', Object.assign({}, RANK, { name: '' })), false);
t('rank score neg', W('B', '/forest/rank/B', Object.assign({}, RANK, { score: -1 })), false);
t('rank score str', W('B', '/forest/rank/B', Object.assign({}, RANK, { score: '9' })), false);
t('rank score huge', W('B', '/forest/rank/B', Object.assign({}, RANK, { score: 1e12 })), false);
t('rank delete own', W('A', '/forest/rank/A', null), true);
// 1.5.4: 랭킹 문서 모양과 범위 (점수 자체는 여전히 기기가 정해요. 범위 검사만으로 조작을 다 막지는 못해요)
const RK = o => Object.assign({}, RANK, o);
t('rank extra field', W('B', '/forest/rank/B', RK({ hack: 1 })), false);
t('rank lp huge', W('B', '/forest/rank/B', RK({ lp: 1e30, ws: 42 * 1e6 + 1e30 })), false);
t('rank ws huge', W('B', '/forest/rank/B', RK({ ws: 1e30 })), false);
t('rank ws mismatch', W('B', '/forest/rank/B', RK({ ws: 42000999 })), false);
t('rank bad pid', W('B', '/forest/rank/B', RK({ pid: 'abc' })), false);
t('rank tier big', W('B', '/forest/rank/B', RK({ tier: 99 })), false);
t('rank test str', W('B', '/forest/rank/B', RK({ test: 'yes' })), false);
t('rank future at', W('B', '/forest/rank/B', RK({ at: NOW + 3600e3 })), false);
t('rank score max first', W('B', '/forest/rank/B', RK({ score: 999999999 })), false);
// 1.6.0 랭킹 점수 조작 막기: 처음은 5만 점까지, 그다음은 지난번보다 2,000점 + 지난 초 x 2점까지만 올라요. 시각은 서버 시각 앞뒤 1분
t('rank first 50000', W('B', '/forest/rank/B', RK({ score: 50000 })), true);
t('rank first 50001', W('B', '/forest/rank/B', RK({ score: 50001 })), false);
t('rank jump small', W('C', '/forest/rank/C', RK({ score: 7000, lp: 900, ws: 42000900 })), true);
t('rank jump big', W('C', '/forest/rank/C', RK({ score: 7100, lp: 900, ws: 42000900 })), false);
t('rank after an hour', W('A', '/forest/rank/A', RK({ score: 120 + 2000 + 7000 })), true);
t('rank down ok', W('C', '/forest/rank/C', RK({ score: 10, lp: 900, ws: 42000900 })), true);
t('rank past at', W('B', '/forest/rank/B', RK({ at: NOW - 3600e3 })), false);
t('rank lp jump', W('C', '/forest/rank/C', RK({ score: 5000, lp: 9000, ws: 42009000 })), false);
t('rank lp ok', W('C', '/forest/rank/C', RK({ score: 5000, lp: 1800, ws: 42001800 })), true);
t('rank lp new week', W('C', '/forest/rank/C', RK({ score: 5000, week: 43, lp: 1000, ws: 43001000 })), true);
t('rank lp new week big', W('C', '/forest/rank/C', RK({ score: 5000, week: 43, lp: 1900, ws: 43001900 })), false);
t('rank no week', W('B', '/forest/rank/B', { name: '다람쥐', score: 5, at: { '.sv': 'timestamp' } }), true);
t('rank delete other', W('B', '/forest/rank/A', null), false);
// 테스트 현황
t('stats read all (not admin)', R('B', '/forest/stats'), false);
t('stats read all (admin)', R('Z', '/forest/stats'), true);
// 1.6.0: 관리자 키를 바꾸면 예전 키로 등록된 관리자는 바로 못 봐요
t('stats read old admin', targaryen.database(rules, Object.assign({}, base, { forest: Object.assign({}, base.forest, { adminKey: 'new' }) })).as({ uid: 'Z', provider: 'anonymous' }).read('/forest/stats', { now: Date.now() }).allowed, false);
t('stats read own', R('A', '/forest/stats/A'), true);
t('stats read other', R('B', '/forest/stats/A'), false);
t('stats read anon', R(null, '/forest/stats'), false);
t('stats write own', W('B', '/forest/stats/B', Object.assign({}, STAT, { seen: { '.sv': 'timestamp' } })), true);
t('stats write other', W('B', '/forest/stats/A', STAT), false);
t('stats no pid', W('B', '/forest/stats/B', { seen: 1 }), false);
// 1.5.6: 이어하기 코드 자리(moves)는 없앴어요. 남은 기록도 아무도 읽거나 쓰지 못해요
const MV = { d: 'y', at: { '.sv': 'timestamp' }, from: 'B', v: '1.0' };
t('move read gone', R('B', '/forest/moves/K7QM2XPA'), false);
t('move list gone', R('B', '/forest/moves'), false);
t('move create gone', W('B', '/forest/moves/ABCD2345', MV), false);
t('move delete gone', W('B', '/forest/moves/K7QM2XPA', null), false);
// 2.1.3 랭킹 시즌(sk, sp): 리그 점수처럼 시즌이 같으면 지난 값 + 폭까지, 바뀌면 0부터
const RSN = Object.assign({}, RANK, { sk: 2, sp: 500 });
t('season first', W('B', '/forest/rank/B', Object.assign({}, RANK, { sk: 2, sp: 900 })), true);
t('season first too big', W('B', '/forest/rank/B', Object.assign({}, RANK, { sk: 2, sp: 5000 })), false);
t('season sp without sk', W('B', '/forest/rank/B', Object.assign({}, RANK, { sp: 10 })), false);
t('season bad sk', W('B', '/forest/rank/B', Object.assign({}, RANK, { sk: 0, sp: 10 })), false);
t('season grow', W('A', '/forest/rank/A', Object.assign({}, RANK, { sk: 2, sp: 1200 })), true);
// 2.1.3 다른 학교 구경(forest/look): 로그인하면 읽기, 쓰기는 나만, 4,000자, 60초에 한 번, 지우기는 언제나
const LOOK = { d: '{"v":1}', at: { '.sv': 'timestamp' } };
t('look read', R('B', '/forest/look/A'), true);
t('look read anon', R(null, '/forest/look/A'), false);
t('look write own', W('B', '/forest/look/B', LOOK), true);
t('look write other', W('B', '/forest/look/A', LOOK), false);
t('look too big', W('B', '/forest/look/B', { d: 'x'.repeat(4001), at: { '.sv': 'timestamp' } }), false);
t('look old time', W('B', '/forest/look/B', { d: 'x', at: 5 }), false);
t('look extra field', W('B', '/forest/look/B', Object.assign({ x: 1 }, LOOK)), false);
{ const db = targaryen.database(rules, { forest: { look: { B: { d: 'x', at: Date.now() - 5000 } } } }).as({ uid: 'B', provider: 'anonymous' });
  t('look too soon', db.write('/forest/look/B', LOOK).allowed, false);
  t('look delete anytime', db.write('/forest/look/B', null).allowed, true); }
{ const db = targaryen.database(rules, { forest: { look: { B: { d: 'x', at: Date.now() - 61000 } } } }).as({ uid: 'B', provider: 'anonymous' });
  t('look after a minute', db.write('/forest/look/B', LOOK).allowed, true); }
// 나머지는 막혀요
t('root read', R('A', '/'), false);
t('root write', W('A', '/hack', 1), false);
t('forest write', W('A', '/forest', {}), false);
console.log(`rules: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
