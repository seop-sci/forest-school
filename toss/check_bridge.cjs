// 만든 bridge.js를 브라우저 비슷한 곳에서 실행해 window.AIT가 생기는지 봐요
const fs = require('fs'), vm = require('vm');
const code = fs.readFileSync(process.argv[2], 'utf8');
const win = { navigator: { userAgent: 'node' }, location: { href: 'http://x/' }, addEventListener() {}, removeEventListener() {}, document: { addEventListener() {} } };
win.window = win; win.self = win; win.globalThis = win;
const ctx = vm.createContext(win);
try { vm.runInContext(code, ctx); console.log('ran ok; window.AIT', typeof win.AIT, win.AIT ? Object.keys(win.AIT).join(',') : ''); }
catch (e) { console.log('ERROR', e.name + ': ' + e.message, '; window.AIT', typeof win.AIT); }
