// 5.0.2 웹판 첫 받기 줄이기: GitHub Pages에 올리는 index.html에서 주석과 공백만 빼요(함수와 변수 이름은 그대로).
// 저장소의 index.html은 그대로 두고, pages.yml의 '게임 파일만 모으기' 단계가 올릴 사본(_site/index.html)에만 돌려요.
// 줄인 뒤에 스스로 확인해요: 버전 표시(<meta name="forest-version">)가 그대로인지, 스크립트 개수가 같은지, 스크립트마다 문법이 맞는지.
// 하나라도 어긋나면 파일을 바꾸지 않고 끝 코드 1을 내요(그러면 pages.yml이 줄이지 않은 파일을 그대로 올려요).
// 쓰는 법: node dev/minify_web.mjs <index.html> <esbuild가 있는 node_modules 폴더>
import fs from 'node:fs';
import vm from 'node:vm';
import { minifyGame } from './minify_game.mjs';
const [, , file, mods] = process.argv;
const esbuild = await import(`${mods}/esbuild/lib/main.js`);
const src = fs.readFileSync(file, 'utf8');
const r = await minifyGame(src, esbuild.default || esbuild, { light: true });
const meta = s => (/<meta name="forest-version" content="([\d.]+)">/.exec(s.slice(0, 8000)) || [])[1];
const scripts = s => [...s.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const fail = msg => { console.error('웹판 압축을 그만둬요: ' + msg); process.exit(1); };
if (!meta(src) || meta(r.html) !== meta(src)) fail('버전 표시가 달라졌어요');
const a = scripts(src), b = scripts(r.html);
if (a.length !== b.length) fail(`스크립트 개수가 달라요 ${a.length} → ${b.length}`);
for (const body of b) { if (body.trim().length < 2000 || /^\s*window\.FS_IMG/.test(body)) continue; try { new vm.Script(body); } catch (e) { fail('문법 오류 ' + e.message); } }
for (const mark of ['<!-- github-only -->', '<!-- /github-only -->']) if (src.includes(mark) !== r.html.includes(mark)) fail('github-only 표시가 달라졌어요');
if (r.after >= r.before) fail('줄지 않았어요');
fs.writeFileSync(file, r.html);
console.log(`웹판 압축(주석과 공백): ${(r.before / 1024).toFixed(0)} KB → ${(r.after / 1024).toFixed(0)} KB`);
