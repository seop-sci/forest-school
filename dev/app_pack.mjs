// 앱 묶음(안드로이드 www, 토스 dist)에 넣지 않는 파일을 한 곳에서 정해요. app/build-www.mjs와 toss/build.mjs가 함께 써요.
// 여기서 빼는 파일은 게임이 앱 판에서 웹(WEB_ROOT)에서 받거나, 묶음 안의 다른 파일로 대신해요(dev/forest-school.html의 APP_PACK 둘레).
import fs from 'node:fs';
const src = fs.readFileSync(new URL('./forest-school.html', import.meta.url), 'utf8');
const m = src.match(/const WEB_AUD = new Set\(\[([^\]]+)\]\)/);
if (!m) throw new Error('원본에서 WEB_AUD(웹에서 받는 곡 목록)를 찾지 못했어요');
export const WEB_AUD = m[1].split(',').map(s => s.trim().replace(/'/g, '')).filter(Boolean);
const TH = '(spring|summer|autumn|winter|xmas|space|retro)';
const SKIP = [
  new RegExp(`[\\\\/]maps[\\\\/][^\\\\/]*_${TH}\\.webp$`),          // 4.3.2 테마 지도와 테마 참나무 층(웹에서)
  /[\\/]img[\\/]a[\\/]map_[a-z_]+-[0-9a-f]{10}\.webp$/,            // 5.0.2 게임 안 저화질 지도 36장(앱은 묶음 안 고화질 지도를 써요)
  /[\\/]img[\\/](story|cere|cere3)$/, /[\\/]img[\\/](story|cere|cere3)[\\/]/,   // 5.0.2 이야기 장면 그림과 졸업식 그림(웹에서)
  new RegExp(`[\\\\/]audio[\\\\/](${WEB_AUD.join('|')})\\.mp4$`),   // 5.0.2 테마 곡과 행사, 졸업 곡(웹에서)
];
export const packKeep = f => !SKIP.some(re => re.test(f));
