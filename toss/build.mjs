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
// 2.0.0 고화질 지도 그림(img/maps)도 함께 담아요
fs.cpSync('../img', 'dist/img', { recursive: true, filter: f => !/[\\/]maps[\\/][^\\/]*_(spring|summer|autumn|winter|xmas|space|retro)\.webp$/.test(f) });   // 4.3.2 테마 지도와 테마 참나무 층은 앱에 넣지 않고 웹에서 받아요(게임의 mapBase)   // 3.0.1 고급 지도도 담아요(예시 학교)
// 4.1.0 (3.3.2 분석 M8): AIT_AD_TEST=1이면 테스트용 광고 ID로 만들어요(QR 시험용). 올릴 파일은 이 값을 주지 않고 만들어요
const adTest = process.env.AIT_AD_TEST === '1';
await build({ entryPoints: ['src/bridge.js'], bundle: true, format: 'iife', target: 'es2019', minify: true, outfile: 'dist/bridge.js', logLevel: 'warning', define: { __AIT_AD_TEST__: adTest ? 'true' : 'false' } });
const outJs = fs.readFileSync('dist/bridge.js', 'utf8'), hasTest = outJs.includes('ait-ad-test-rewarded-id'), hasLive = outJs.includes('ait.v2.live.');
if (adTest ? hasLive || !hasTest : hasTest || !hasLive) throw new Error('광고 ID가 기대와 달라요. bridge.js를 확인해 주세요');
console.log(adTest ? '광고: 테스트용 ID (시험용 파일이에요. 토스 콘솔에 올리지 마세요)' : '광고: 정식 ID (올릴 파일이에요. 이 파일로 QR 시험을 하지 마세요)');
console.log('dist 준비 완료');
