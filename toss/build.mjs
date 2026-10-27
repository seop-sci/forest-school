// 토스 판 만들기: 저장소 맨 위의 index.html(GitHub 판 게임)에서 GitHub 전용 부분(서버 저장 설정, 링크 미리보기)을 빼고,
// 토스 기능을 이어 주는 bridge.js를 붙여 dist 폴더에 담아요. 그다음 `ait build`가 dist를 .ait 파일로 묶어요.
import * as esbuild from 'esbuild';
import { minifyGame } from '../dev/minify_game.mjs';
const { build } = esbuild;
import fs from 'node:fs';

let html = fs.readFileSync('../index.html', 'utf8');
const before = html.length;
html = html.replace(/<!-- github-only -->[\s\S]*?<!-- \/github-only -->\n?/g, '');
if (html.length === before) throw new Error('index.html에서 GitHub 전용 부분을 찾지 못했어요');
html = html.replace('<title>', '<script src="bridge.js"></script>\n<title>');
// 1.6.0 보안 점검: 게임 코드와 스타일을 압축해요(주석과 긴 이름 없애기)
const mz = await minifyGame(html, esbuild); html = mz.html;
console.log(`게임 압축 ${(mz.before / 1024).toFixed(0)} KB → ${(mz.after / 1024).toFixed(0)} KB`);

fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync('dist');
fs.writeFileSync('dist/index.html', html);
// 1.8.0 배경음악 파일(audio 폴더)도 함께 담아요
fs.cpSync('../audio', 'dist/audio', { recursive: true });
await build({ entryPoints: ['src/bridge.js'], bundle: true, format: 'iife', target: 'es2019', minify: true, outfile: 'dist/bridge.js', logLevel: 'warning' });
console.log('dist 준비 완료');
