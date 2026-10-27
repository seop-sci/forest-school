// 안드로이드 판 만들기: 저장소 맨 위 index.html에서 GitHub 전용 부분(서버 저장, 링크 미리보기)을 빼고
// 서버 저장(config.js, fb.js), 구글 계정 연결(google.js), 애드몹 광고(ads.js), 앱 닫기와 뒤로 가기(app.js), 업데이트 알림(update.js)을 붙여 www 폴더에 담아요.
// ADMOB_TEST=1이면 구글 테스트 광고를 써요 (업로드 키가 없는 시험 빌드).
import * as esbuild from 'esbuild';
import { minifyGame } from '../dev/minify_game.mjs';
const { build } = esbuild;
import fs from 'node:fs';
let html = fs.readFileSync('../index.html', 'utf8');
const n0 = html.length;
html = html.replace(/<!-- github-only -->[\s\S]*?<!-- \/github-only -->\n?/g, '');
if (html.length === n0) throw new Error('index.html에서 GitHub 전용 부분을 찾지 못했어요');
html = html.replace('<title>', '<script>window.FOREST_STORE = true;</script>\n<script src="config.js"></script>\n<script src="fb.js"></script>\n<script src="google.js"></script>\n<script src="ads.js"></script>\n<script src="app.js"></script>\n<script src="update.js"></script>\n<title>');
html = html.split('테스트용 가짜 광고예요').join('구글 애드몹 보상형 광고');
// 1.6.0 보안 점검: 게임 코드와 스타일을 압축해요(주석과 긴 이름 없애기)
const mz = await minifyGame(html, esbuild); html = mz.html;
console.log(`게임 압축 ${(mz.before / 1024).toFixed(0)} KB → ${(mz.after / 1024).toFixed(0)} KB`);
fs.rmSync('www', { recursive: true, force: true });
fs.mkdirSync('www');
fs.writeFileSync('www/index.html', html);
fs.copyFileSync('../config.js', 'www/config.js');
// 1.8.0 배경음악 파일(audio 폴더)도 함께 담아요
fs.cpSync('../audio', 'www/audio', { recursive: true });
// 2.0.0 고화질 지도 그림(img/maps)도 함께 담아요
fs.cpSync('../img', 'www/img', { recursive: true });
const test = process.env.ADMOB_TEST === '1';
for (const f of ['fb', 'google', 'app', 'update']) await build({ entryPoints: [`src/${f}.js`], bundle: true, format: 'iife', target: 'es2019', minify: true, outfile: `www/${f}.js`, logLevel: 'warning' });
await build({ entryPoints: ['src/ads.js'], bundle: true, format: 'iife', target: 'es2019', minify: true, outfile: 'www/ads.js',
  define: { __ADMOB_TEST__: String(test) }, logLevel: 'warning' });
console.log('www 준비 완료' + (test ? ' (테스트 광고)' : ''));
