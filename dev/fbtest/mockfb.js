// 시험용 가짜 Firebase compat SDK: 진짜 SDK에서 게임이 쓰는 부분(firebase.apps, initializeApp, auth, database)만 같은 모양으로 흉내 내요.
// 읽기와 쓰기는 같은 주소의 /__fb로 보내고, 서버가 규칙을 검사해요. 'value' 듣기는 0.3초마다 다시 읽어서 바뀌면 알려요.
(function () {
  if (window.firebase) return;
  const st = { apps: [], listeners: new Set(), user: null };
  window.__fbCalls = [];
  async function call(body) {
    window.__fbCalls.push(body.op + ' ' + (body.path || ''));
    const r = await fetch('/__fb', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.assign({ uid: st.user && st.user.uid }, body)) });
    const j = await r.json();
    if (!j.ok) { const e = new Error(j.code + ': ' + (j.msg || '')); e.code = j.code; throw e; }
    return j;
  }
  const clone = v => v === undefined || v === null ? null : JSON.parse(JSON.stringify(v));
  function snap(key, val, pairs) {
    return {
      key,
      val: () => clone(val),
      exists: () => val !== null && val !== undefined,
      child: k => snap(k, val && typeof val === 'object' && k in val ? val[k] : null),
      numChildren: () => (pairs || Object.keys(val || {})).length,
      // 진짜 SDK처럼 콜백이 true를 돌려주면 멈춰요
      forEach: fn => {
        const list = pairs || (val && typeof val === 'object' ? Object.keys(val).sort().map(k => [k, val[k]]) : []);
        for (const [k, v] of list) if (fn(snap(k, v)) === true) return true;
        return false;
      }
    };
  }
  function ref(p, q) {
    const path = String(p || '').replace(/^\/+|\/+$/g, '');
    const key = path ? path.split('/').pop() : null;
    const read = async () => {
      if (path === '.info/connected') return snap('connected', true);
      if (path === '.info/serverTimeOffset') return snap('serverTimeOffset', 0);
      const j = await call({ op: q ? 'query' : 'get', path, q });
      return snap(key, j.val, q ? j.pairs : undefined);
    };
    const write = (op, value) => call({ op, path, value }).then(() => { bump(); });
    return {
      key, path,
      child: c => ref(path + '/' + c),
      orderByChild: k => ref(path, Object.assign({}, q, { order: k })),
      limitToLast: n => ref(path, Object.assign({}, q, { last: n })),
      set: v => write('set', v),
      update: v => write('update', v),
      remove: () => write('set', null),
      once: () => read(),
      // 2.2.0 검토 2: 진짜 SDK처럼 처음에는 모르는 값(null)으로 한 번 부르고, 서버 값과 다르면 서버 값으로 다시 불러요(서버가 비교하고 써요)
      transaction: async (fn, done, applyLocally) => {
        let cur = null;
        for (let i = 0; i < 25; i++) {
          const v = fn(clone(cur));
          if (v === undefined) return { committed: false, snapshot: snap(key, cur) };
          const j = await call({ op: 'cas', path, expect: cur, value: v });
          if (!j.stale) { bump(); return { committed: true, snapshot: snap(key, v) }; }
          cur = j.val;
        }
        throw Object.assign(new Error('maxretry'), { code: 'maxretry' });
      },
      on: (ev, cb, err) => { const l = { path, q, cb, err, read, sig: undefined }; st.listeners.add(l); poll(l); return cb; },
      off: (ev, cb) => { st.listeners.forEach(l => { if (l.path === path && (!cb || l.cb === cb)) st.listeners.delete(l); }); }
    };
  }
  async function poll(l) {
    try {
      const s = await l.read();
      if (!st.listeners.has(l)) return;
      const pairs = [];
      s.forEach(c => { pairs.push([c.key, c.val()]); });
      const sig = JSON.stringify([s.val(), pairs]);
      if (sig !== l.sig) { l.sig = sig; l.cb(s); }
    } catch (e) {
      if (!st.listeners.has(l)) return;
      st.listeners.delete(l);   // 진짜 SDK도 권한이 없으면 듣기를 멈춰요
      if (typeof l.err === 'function') l.err(e);
    }
  }
  function bump() { st.listeners.forEach(poll); }
  setInterval(bump, 300);
  function mkUser(uid) {
    const u = { uid, get providerData() { const t = localStorage.getItem('__mockG_' + uid); return t ? [{ providerId: 'google.com', email: t + '@gmail.com' }] : []; } };
    u.linkWithCredential = async c => { await call({ op: 'glink', token: c.token, uid }); localStorage.setItem('__mockG_' + uid, c.token); return { user: u }; };
    u.linkWithPopup = async () => { const t = localStorage.getItem('__gacct') || 'acctA'; try { return await u.linkWithCredential({ token: t }); } catch (e) { e.credential = { token: t }; throw e; } };
    // __delFail이 있으면 진짜 Firebase처럼 '최근에 로그인해야 해요'로 거절해요 (1.5.4 계정 지우기 다시 하기 시험)
    u.delete = async () => { if (localStorage.getItem('__delFail')) { const e = new Error('auth/requires-recent-login'); e.code = 'auth/requires-recent-login'; throw e; }
      localStorage.removeItem('__mockUid'); if (st.user === u) st.user = null; };
    return u;
  }
  const auth = {
    get currentUser() { return st.user; },
    onAuthStateChanged(next) {
      let live = true;
      setTimeout(() => {
        if (!live) return;
        const uid = localStorage.getItem('__mockUid');
        st.user = uid ? mkUser(uid) : null;
        next(st.user);
      }, 40);
      return () => { live = false; };
    },
    async signInWithCredential(c) {
      const j = await call({ op: 'gsignin', token: c.token });
      localStorage.setItem('__mockUid', j.uid); localStorage.setItem('__mockG_' + j.uid, c.token);
      st.user = mkUser(j.uid);
      return { user: st.user };
    },
    async signInAnonymously() {
      const j = await call({ op: 'anon' });
      localStorage.setItem('__mockUid', j.uid);
      st.user = mkUser(j.uid);
      return { user: st.user };
    }
  };
  const database = Object.assign(() => ({ ref: p => ref(p) }), { ServerValue: { TIMESTAMP: { '.sv': 'timestamp' } } });
  window.firebase = {
    apps: st.apps,
    initializeApp(cfg) { const a = { name: '[DEFAULT]', options: cfg }; st.apps.push(a); return a; },
    app() { return st.apps[0]; },
    auth: Object.assign(() => auth, { GoogleAuthProvider: Object.assign(function GoogleAuthProvider() {}, { credential: t => ({ token: t }) }) }),
    database
  };
})();
