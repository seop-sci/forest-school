// 다국어 글 꺼내기: src/js와 src/page의 한국어 글을 번역 열쇠로 모아 dev/i18n_keys.json에 적어요.
// 열쇠는 화면에 보이는 모양 그대로예요. ${…} 자리는 {0} {1}, 조사 함수 eul(x) iga(x) eun(x)는 {0|을} {0|이} {0|은},
// 글 안의 굵은 글씨 같은 태그는 속성을 뺀 <b> </b>로 남겨요. div, button 같은 덩어리 태그에서 잘라 덩어리마다 열쇠 하나예요.
// 쓰는 법: NODE_PATH=/tmp/i18ntool/node_modules node dev/i18n_extract.mjs   (acorn, acorn-walk가 필요해요: npm i acorn acorn-walk)
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const acorn = require('acorn');
const walk = require('acorn-walk');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const parts = fs.readFileSync(path.join(ROOT, 'dev/src_parts.txt'), 'utf8').split('\n')
  .filter(l => l && !l.startsWith('#')).map(l => l.split('\t')[0]);
const HAN = /[가-힣]/;
const JOSA_FN = { eul: '을', eulOf: '을', iga: '이', eun: '은', wa: '와', ro: '로' };
const BLOCK = 'div|p|button|li|ul|ol|h[1-6]|section|article|header|footer|label|td|th|tr|table|tbody|thead|dt|dd|dl|nav|aside|main|figure|figcaption|option|select|textarea|input|form|details|summary|canvas|video|audio|template|dialog';
const INLINE = 'b|strong|i|em|small|span|u|mark|sup|sub|s|a|code|q|abbr|time|var|kbd|ins|del';
const ATTRS = /\b(?:title|aria-label|placeholder|alt|data-tip)\s*=\s*"([^"]*)"/g;
const P = (i) => '\u0002' + i + '\u0003';            // 자리 표시 임시 표
const keys = new Map();                                 // 열쇠 → { f: 파일들, n: 나온 수 }

function add(k, file) {
  const o = keys.get(k) || { f: [], n: 0 };
  if (!o.f.includes(file)) o.f.push(file);
  o.n++; keys.set(k, o);
}
const decode = s => s.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
export function norm(s) { return s.replace(/[\s ]+/g, ' ').trim(); }

// raw: 자리 표시(P(i))가 들어간 HTML 조각. josa[i]가 있으면 그 자리는 조사 자리예요
function segments(raw, josa, file) {
  for (const m of raw.matchAll(ATTRS)) {           // 속성 글
    const v = m[1];
    if (HAN.test(v)) emit(v.replace(/<[^>]*>/g, ''), josa, file);
  }
  let s = raw.replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '\u0004')
    .replace(/<(?:img|picture|object|iframe)\b[^>]*>/gi, '\u0004')
    .replace(new RegExp('<(' + INLINE + ')\\b[^>]*\\bid=[^>]*>(?:(?!<\\1\\b)[\\s\\S])*?<\\/\\1>', 'gi'), '\u0004')   // id가 있는 작은 칸(숫자 칸)은 통째 자리
    .replace(/^[^<>]*?["'=][^<>]*>/, ' ')               // 태그 중간에서 시작한 조각
    .replace(/<[a-zA-Z\/][^>]*$/, ' ');                 // 태그 중간에서 끝난 조각
  const parts = s.split(new RegExp('<\\/?(?:' + BLOCK + ')\\b[^>]*>', 'i'));
  for (let seg of parts) {
    if (!seg) continue;
    seg = seg.replace(new RegExp('<(\\/?)(' + INLINE + ')\\b[^>]*>', 'gi'), (m, c, t) => '<' + c + t.toLowerCase() + '>')
      .replace(/<br\b[^>]*>/gi, '<br>')
      .replace(/<(?!\/?(?:b|strong|i|em|small|span|u|mark|sup|sub|s|a|code|q|abbr|time|var|kbd|ins|del|br)>)[^>]*>/gi, ' ');
    emit(seg, josa, file);
    // 덩어리가 화면에서 따로 바뀔 때(글 조각마다)를 위해 태그 사이 조각도 열쇠로 둬요
    if (/<|\u0004/.test(seg)) for (const pc of seg.split(/<[^>]*>|\u0004/)) if (pc.trim() && pc.trim() !== seg.trim()) emit(pc, josa, file);
  }
}
function emit(seg, josa, file) {
  seg = norm(decode(seg));
  if (!HAN.test(seg.replace(/\u0002\d+\u0003/g, ''))) return;
  let n = 0;
  const k = seg.replace(/\u0002(\d+)\u0003|\u0004/g, (m, i) => {
    const j = i !== undefined && josa[i] ? '|' + josa[i] : '';
    return '{' + (n++) + j + '}';
  });
  if (k.length > 600) return;                         // 아주 긴 덩어리(통째 HTML)는 빼요
  add(k, file);
}

function tplKey(node) {                               // 템플릿 글 → raw와 조사 표
  let raw = '', josa = {};
  node.quasis.forEach((q, i) => {
    raw += q.value.cooked ?? q.value.raw;
    if (i < node.expressions.length) {
      const e = node.expressions[i];
      if (e.type === 'CallExpression' && e.callee.type === 'Identifier' && JOSA_FN[e.callee.name] && e.arguments.length === 1) josa[i] = JOSA_FN[e.callee.name];
      raw += P(i);
    }
  });
  return { raw, josa };
}
function flatPlus(node, out) {                        // a + '…' + b 를 한 줄로
  if (node.type === 'BinaryExpression' && node.operator === '+') { flatPlus(node.left, out); flatPlus(node.right, out); }
  else out.push(node);
  return out;
}

const skip = new WeakSet();
for (const f of parts) {
  const file = path.join(ROOT, 'src', f);
  let src = fs.readFileSync(file, 'utf8');
  if (f.endsWith('.html')) {
    if (f.includes('img-map')) continue;
    const body = src.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
    segments(body, {}, f);
    continue;
  }
  if (!f.endsWith('.js')) continue;
  continue;
}
// js 파일은 이어 붙여 한 번에 읽어요(파일 하나가 함수 중간에서 끝날 수 있어요)
let all = '', marks = [];
for (const f of parts.filter(p => p.endsWith('.js') && !p.includes('00b-i18n'))) {   // 다국어 틀 파일(조사 무늬, 말 이름)은 빼요
  let s = fs.readFileSync(path.join(ROOT, 'src', f), 'utf8').replace(/^\s*<script>/, '').replace(/<\/script>\s*$/, '');
  marks.push([all.length, f]); all += s + '\n';
}
const fileAt = pos => { let r = marks[0][1]; for (const [p, f] of marks) { if (p <= pos) r = f; else break; } return r; };
const ast = acorn.parse(all, { ecmaVersion: 'latest', sourceType: 'script', allowReturnOutsideFunction: true });

walk.fullAncestor(ast, (node, st, anc) => {
  if (skip.has(node)) return;
  const parent = anc[anc.length - 2];
  if (node.type === 'BinaryExpression' && node.operator === '+' && !(parent && parent.type === 'BinaryExpression' && parent.operator === '+')) {
    const items = flatPlus(node, []);
    if (!items.some(x => x.type === 'Literal' && typeof x.value === 'string' && HAN.test(x.value))) return;
    if (!items.some(x => !(x.type === 'Literal'))) return;
    let raw = '', josa = {}, k = 0;
    for (const x of items) {
      if (x.type === 'Literal' && typeof x.value === 'string') { raw += x.value; skip.add(x); }
      else {
        if (x.type === 'CallExpression' && x.callee.type === 'Identifier' && JOSA_FN[x.callee.name] && x.arguments.length === 1) josa[k] = JOSA_FN[x.callee.name];
        raw += P(k++);
      }
    }
    segments(raw, josa, fileAt(node.start));
    return;
  }
  if (node.type === 'Literal' && typeof node.value === 'string' && HAN.test(node.value)) {
    if (!parent) return;
    if (parent.type === 'Property' && parent.key === node && !parent.computed) return;
    if (parent.type === 'BinaryExpression' && /^[!=]==?$|^in$/.test(parent.operator)) return;
    if (parent.type === 'SwitchCase') return;
    if (parent.type === 'MemberExpression') { /* '…'.length 같은 것도 글이에요 */ }
    if (parent.type === 'CallExpression' && parent.callee.type === 'MemberExpression' && parent.callee.object.name === 'console') return;
    segments(node.value, {}, fileAt(node.start));
    return;
  }
  if (node.type === 'TemplateLiteral') {
    if (!node.quasis.some(q => HAN.test(q.value.cooked ?? q.value.raw))) return;
    if (parent && parent.type === 'TaggedTemplateExpression') return;
    const { raw, josa } = tplKey(node);
    segments(raw, josa, fileAt(node.start));
  }
});

const out = {};
for (const [k, o] of [...keys.entries()].sort((a, b) => parts.indexOf(a[1].f[0]) - parts.indexOf(b[1].f[0]))) out[k] = o.f;
fs.writeFileSync(path.join(ROOT, 'dev/i18n_keys.json'), JSON.stringify(out, null, 0).replace(/\],"/g, '],\n"') + '\n');
const byFile = {};
for (const [k, fs_] of Object.entries(out)) { const f = fs_[0]; byFile[f] = (byFile[f] || 0) + 1; }
console.log('열쇠', Object.keys(out).length);
for (const [f, n] of Object.entries(byFile)) console.log(' ', f, n);
