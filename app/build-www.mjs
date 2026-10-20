// 안드로이드 판 만들기: 저장소 맨 위 index.html에서 GitHub 전용 부분(서버 저장, 링크 미리보기)을 빼고
// 광고 대신 바로 보상을 주는 설정을 넣어 www 폴더에 담아요. 구글 플레이 판에는 광고가 없어요.
import fs from 'node:fs';
let html = fs.readFileSync('../index.html', 'utf8');
const n0 = html.length;
html = html.replace(/<!-- github-only -->[\s\S]*?<!-- \/github-only -->\n?/g, '');
if (html.length === n0) throw new Error('index.html에서 GitHub 전용 부분을 찾지 못했어요');
html = html.replace('<title>', '<script>window.FOREST_NOAD = true;</script>\n<title>');
// 광고가 없으니 버튼과 안내 글에서 '광고' 말을 바꿔요
const words = [
  ['광고 보고 황금 도토리 ', '황금 도토리 '], ['광고 보고 받기', '받기'], ['광고 보고 반값', '반값으로 짓기'],
  ['광고 보고 2배', '2배로 받기'], ['광고 보고 모으기', '모으러 가기'], ['광고를 끝까지 보면 ', ''],
  ['테스트용 가짜 광고예요', '광고 없음'], ['오늘 상점 광고를 모두 봤어요', '오늘 상점 선물을 모두 받았어요'],
  ['실제 미니앱에서는 이 화면 대신 토스 앱으로 돌아가요.', ''],
];
for (const [a, b] of words) html = html.split(a).join(b);
fs.rmSync('www', { recursive: true, force: true });
fs.mkdirSync('www');
fs.writeFileSync('www/index.html', html);
console.log('www 준비 완료');
