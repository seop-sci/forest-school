// 시험용 가짜 Firebase 서버: gh 폴더를 열어 주고, /__fb 요청을 database.rules.json 규칙(targaryen)으로 검사해서 처리해요
const http = require('http'), fs = require('fs'), path = require('path');
const targaryen = require('targaryen');
const [,, DIR, PORT, RULES] = process.argv;
const rules = JSON.parse(fs.readFileSync(RULES, 'utf8'));
let data = {};
let n = 0;
const G = {};
const MODE = { config: 'set', authOff: false, denyAll: false, delay: 0 };
const LOG = [];
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.md': 'text/plain; charset=utf-8' };
const CFG = { apiKey: 'test-key', authDomain: 'forest-test.firebaseapp.com', databaseURL: 'http://127.0.0.1:' + PORT, projectId: 'forest-test', appId: '1:1:web:1' };

function db(uid) {
  const d = targaryen.database(rules, data);
  return uid ? d.as({ uid, provider: 'anonymous' }) : d;
}
const norm = p => '/' + String(p || '').replace(/^\/+|\/+$/g, '');
function get(p) {
  let v = data;
  for (const k of norm(p).split('/').filter(Boolean)) { if (v == null || typeof v !== 'object') return null; v = v[k]; }
  return v === undefined ? null : v;
}
function handle(b) {
  if (b.op === 'anon') {
    if (MODE.authOff) return { ok: false, code: 'auth/operation-not-allowed', msg: 'anonymous sign-in is disabled' };
    return { ok: true, uid: 'u' + (++n) + Math.random().toString(36).slice(2, 6) };
  }
  if (b.op === 'glink' || b.op === 'gsignin') {
    G.map = G.map || {};
    const have = G.map[b.token];
    if (b.op === 'glink') { if (have && have !== b.uid) return { ok: false, code: 'auth/credential-already-in-use' }; G.map[b.token] = b.uid; return { ok: true, uid: b.uid }; }
    if (!have) { const nu = 'g' + (++n); G.map[b.token] = nu; return { ok: true, uid: nu }; }
    return { ok: true, uid: have };
  }
  const deny = { ok: false, code: 'PERMISSION_DENIED', msg: 'Permission denied' };
  if (MODE.denyAll) return deny;
  const d = db(b.uid);
  if (b.op === 'get' || b.op === 'query') {
    if (!d.read(norm(b.path), { now: Date.now() }).allowed) return deny;   // 읽기 규칙의 now (이어하기 코드 30분)
    const v = get(b.path);
    if (b.op === 'get') return { ok: true, val: v };
    let pairs = v && typeof v === 'object' ? Object.keys(v).map(k => [k, v[k]]) : [];
    if (b.q && b.q.order) pairs.sort((x, y) => ((x[1] || {})[b.q.order] ?? -Infinity) - ((y[1] || {})[b.q.order] ?? -Infinity) || (x[0] < y[0] ? -1 : 1));
    else pairs.sort((x, y) => (x[0] < y[0] ? -1 : 1));
    if (b.q && b.q.last) pairs = pairs.slice(-b.q.last);
    return { ok: true, val: v, pairs };
  }
  if (b.op === 'cas') {   // 2.2.0 검토 2: 트랜잭션 흉내(지금 값이 expect와 같을 때만 규칙 검사 뒤 써요)
    const canon = v => JSON.stringify(v, (k, x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.keys(x).sort().reduce((o, kk) => (o[kk] = x[kk], o), {}) : x);
    if (!d.read(norm(b.path), { now: Date.now() }).allowed) return deny;
    const now = get(b.path);
    if (canon(now === undefined ? null : now) !== canon(b.expect === undefined ? null : b.expect)) { LOG.push({ op: 'cas-stale', path: norm(b.path), uid: b.uid, t: Date.now() }); return { ok: true, stale: true, val: now }; }
    b.op = 'set';
  }
  if (b.op === 'set' || b.op === 'update') {
    const r = b.op === 'set' ? d.write(norm(b.path), b.value) : d.update(norm(b.path), b.value);
    LOG.push({ op: b.op, path: norm(b.path), uid: b.uid, ok: r.allowed, t: Date.now() });
    if (!r.allowed) return deny;
    data = r.newDatabase.root.$value() || {};
    return { ok: true };
  }
  return { ok: false, code: 'bad-op' };
}
function body(req) { return new Promise(ok => { let s = ''; req.on('data', c => { s += c; }); req.on('end', () => ok(s ? JSON.parse(s) : {})); }); }
const send = (res, code, type, text) => { res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' }); res.end(text); };
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (req.method === 'POST' && url.pathname === '/__fb') {
      const b = await body(req);
      if (MODE.delay) await new Promise(r => setTimeout(r, MODE.delay));
      return send(res, 200, 'application/json', JSON.stringify(handle(b)));
    }
    if (url.pathname === '/__dump') return send(res, 200, 'application/json', JSON.stringify({ data, log: LOG }));
    if (req.method === 'POST' && url.pathname === '/__mode') { Object.assign(MODE, await body(req)); return send(res, 200, 'application/json', JSON.stringify(MODE)); }
    if (req.method === 'POST' && url.pathname === '/__seed') {
      const b = await body(req);
      if (b.reset) data = {};
      if (b.path) {
        const ks = norm(b.path).split('/').filter(Boolean);
        let o = data;
        ks.slice(0, -1).forEach(k => { if (!o[k] || typeof o[k] !== 'object') o[k] = {}; o = o[k]; });
        if (b.value === null) delete o[ks[ks.length - 1]]; else o[ks[ks.length - 1]] = b.value;
      }
      return send(res, 200, 'application/json', '{"ok":true}');
    }
    if (url.pathname === '/config.js' && MODE.config !== 'file') {
      return send(res, 200, TYPES['.js'], 'window.FOREST_FIREBASE = ' + (MODE.config === 'set' ? JSON.stringify(CFG) : 'null') + ';');
    }
    const f = path.join(DIR, url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname));
    if (!f.startsWith(path.resolve(DIR)) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return send(res, 404, 'text/plain', 'not found');
    return send(res, 200, TYPES[path.extname(f)] || 'application/octet-stream', fs.readFileSync(f));
  } catch (e) {
    return send(res, 500, 'text/plain', String(e && e.stack || e));
  }
}).listen(Number(PORT), '127.0.0.1', () => console.log('fbserver on', PORT));
