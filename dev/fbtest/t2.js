const targaryen = require('targaryen');
const rules = { rules: { forest: { rank: { '.read': 'auth != null' } } } };
let db = targaryen.database(rules, {});
console.log('default auth', JSON.stringify(db.auth));
for (const who of [null, undefined, 'unauthenticated', {uid:'A'}]) {
  const d = db.as(who);
  const r = d.read('/forest/rank');
  console.log(JSON.stringify(who), 'auth=', JSON.stringify(d.auth), 'allowed=', r.allowed, 'permitted=', r.permitted);
}
console.log(Object.keys(targaryen.users));
const u = targaryen.users.unauthenticated; console.log(JSON.stringify(u));
console.log(db.as(u).read('/forest/rank').allowed);
console.log(targaryen.database.toString().slice(0,300));
