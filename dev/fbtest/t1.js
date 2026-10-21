const targaryen = require('targaryen');
const rules = { rules: { forest: {
  moves: { $code: { '.read': 'auth != null', '.write': 'auth != null && (!data.exists() || !newData.exists())',
    '.validate': "$code.matches(/^[2-9A-HJKMNP-Z]{8}$/) && newData.hasChildren(['d','at','from']) && newData.child('d').isString() && newData.child('d').val().length < 300000 && newData.child('from').val() === auth.uid && newData.child('at').val() <= now" } },
  rank: { '.read': 'auth != null', $uid: { '.write': 'auth != null && auth.uid === $uid',
    '.validate': "newData.child('name').isString() && newData.child('name').val().length >= 1 && newData.child('name').val().length <= 10" } }
}}};
let db = targaryen.database(rules, {}, 1000000);
const a = db.as({uid: 'A'});
let r = a.write('/forest/moves/K7QM2XPA', {d: 'x', at: {'.sv': 'timestamp'}, from: 'A'}, 2000000);
console.log('create', r.allowed, JSON.stringify(r.newDatabase && r.newDatabase.root && r.newDatabase.root.$value ? r.newDatabase.root.$value() : null));
db = r.newDatabase;
r = db.as({uid: 'B'}).write('/forest/moves/K7QM2XPA', {d: 'y', at: {'.sv': 'timestamp'}, from: 'B'}, 2000001);
console.log('overwrite by B', r.allowed);
r = db.as({uid: 'B'}).read('/forest/moves/K7QM2XPA'); console.log('read B', r.allowed);
r = db.as({uid: 'B'}).read('/forest/moves'); console.log('list B', r.allowed);
r = db.as({uid: 'B'}).write('/forest/moves/K7QM2XPA', null); console.log('delete B', r.allowed);
r = db.as({uid: 'A'}).write('/forest/moves/BADCODE1', {d: 'x', at: {'.sv': 'timestamp'}, from: 'A'}); console.log('bad code (has 1)', r.allowed);
r = db.as({uid: 'A'}).write('/forest/moves/ABCDEFGH', {d: 'x', at: 99999999999999, from: 'A'}); console.log('future at', r.allowed);
r = db.as({uid: 'A'}).write('/forest/rank/A', {name: '지섭 교장선생님만세', score: 1}); console.log('rank 10 ko chars', r.allowed);
r = db.as({uid: 'A'}).write('/forest/rank/A', {name: '지섭 교장선생님만세요', score: 1}); console.log('rank 11 chars', r.allowed);
r = db.as({uid: 'A'}).write('/forest/rank/B', {name: 'x', score: 1}); console.log('rank other', r.allowed);
r = db.as(null).read('/forest/rank'); console.log('rank unauth read', r.allowed);
console.log(Object.keys(r));
