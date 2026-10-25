// 1.6.0 보안 점검: 토스 판과 안드로이드 판에 넣는 게임 HTML을 압축해요.
// 안쪽 <script>(src 없는 것)와 <style>을 esbuild로 줄여서 주석과 긴 이름을 없애요. 그림 묶음(window.FS_IMG...)은 그대로 둬요.
// 웹 테스트판(GitHub Pages)은 고쳐 보기 쉽게 그대로 둬요.
// 쓰는 법 (빌드 스크립트): import { minifyGame } from '../dev/minify_game.mjs'; html = await minifyGame(html, esbuild);
// 쓰는 법 (시험): node dev/minify_game.mjs <입력.html> <출력.html> <esbuild가 있는 node_modules 폴더>
export async function minifyGame(html, esbuild) {
  const parts = [];
  let last = 0, before = html.length;
  const re = /<(script|style)(\s[^>]*)?>([\s\S]*?)<\/\1>/g;
  let m;
  while ((m = re.exec(html))) {
    const [all, tag, attrs = '', body] = m;
    parts.push(html.slice(last, m.index));
    last = m.index + all.length;
    const skip = (tag === 'script' && /\ssrc=/.test(attrs)) || /^\s*window\.FS_IMG/.test(body) || !body.trim() || /type=["'](?!text\/javascript)/.test(attrs);
    if (skip) { parts.push(all); continue; }
    const out = await esbuild.transform(body, { loader: tag === 'style' ? 'css' : 'js', minify: true, legalComments: 'none', charset: 'utf8' });
    parts.push(`<${tag}${attrs}>${out.code.trim()}</${tag}>`);
  }
  parts.push(html.slice(last));
  // 남은 HTML 주석도 빼요(조건부 주석은 없어요)
  const outHtml = parts.join('').replace(/<!--[\s\S]*?-->/g, '');
  return { html: outHtml, before, after: outHtml.length };
}

// 명령줄에서 부를 때
if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , inp, outp, mods] = process.argv;
  const fs = await import('node:fs');
  const esbuild = await import(`${mods}/esbuild/lib/main.js`);
  const r = await minifyGame(fs.readFileSync(inp, 'utf8'), esbuild.default || esbuild);
  fs.writeFileSync(outp, r.html);
  console.log(`압축: ${(r.before / 1024).toFixed(0)} KB → ${(r.after / 1024).toFixed(0)} KB`);
}
