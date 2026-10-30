# GitHub Pages 판 만들기: forest-school.html(Claude 화면에 올리는 본문)을 완전한 웹 문서로 감싸고
# config.js와 Firebase SDK를 부르는 짧은 코드를 앞에 붙여요. config.js는 이미 있으면 건드리지 않아요.
import pathlib, sys
HERE = pathlib.Path(__file__).resolve().parent
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / 'gh'
OUT.mkdir(parents=True, exist_ok=True)
SITE = 'https://seop-sci.github.io/forest-school/'   # 저장소 이름이 다르면 여기만 바꿔요 (카카오톡 미리보기 그림 주소)
src = (HERE / 'forest-school.html').read_text(encoding='utf-8')
cut = src.index('</style>') + len('</style>')
head, body = src[:cut], src[cut:]
assert head.startswith('<title>'), head[:40]
# 안드로이드 판 업데이트 알림이 웹 판 첫머리에서 새 버전을 읽어요(큰 업데이트인지 가릴 때). 게임의 VERSION을 그대로 적어요
import re
VERSION = re.search(r"const VERSION = '([\d.]+)'", src).group(1)
VERMETA = f'<meta name="forest-version" content="{VERSION}">\n'

ICON = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E"
        "%3Cpath d='M32 5v9' stroke='%236E4A2E' stroke-width='6' stroke-linecap='round'/%3E"
        "%3Cpath d='M15 30c0 17 8 28 17 29 9-1 17-12 17-29z' fill='%23D9A55B'/%3E"
        "%3Cpath d='M10 30c0-10 10-17 22-17s22 7 22 17z' fill='%238A5D3B'/%3E%3C/svg%3E")

LOADER = """<script src="config.js"></script>
<script>
  /* Firebase SDK는 config.js에 설정이 있을 때만 불러와요.
     설정이 비어 있으면(null) 서버 없이 이 기기에만 저장하는 체험판으로 열려요. */
  window.FOREST_LOAD = function () {
    var base = 'https://www.gstatic.com/firebasejs/10.12.2/';
    function load(file) {
      return new Promise(function (ok, no) {
        var s = document.createElement('script');
        s.src = base + file;
        s.onload = ok;
        s.onerror = function () { s.remove(); no({ code: 'load' }); };
        document.head.appendChild(s);
      });
    }
    var p = load('firebase-app-compat.js')
      .then(function () { return Promise.all([load('firebase-auth-compat.js'), load('firebase-database-compat.js')]); })
      .then(function () { return window.firebase; });
    p.catch(function () {});   // 실패는 게임 쪽에서 다뤄요
    return p;
  };
  window.FOREST_FB = window.FOREST_FIREBASE ? window.FOREST_LOAD() : Promise.resolve(null);
  // GitHub 테스트판 구글 계정 연결: 구글 로그인(Google Identity Services)의 작은 계정 선택 창으로 토큰을 받아요.
  // 크롬은 화면 아래에 작게 뜨고, 그 밖의 브라우저는 '구글로 계속하기' 버튼 창을 보여 줘요
  if (window.FOREST_FIREBASE) window.FOREST_GOOGLE = (function () {
    var CLIENT = '371851641750-c206d9dtea31k8rdq6ctcd3jru0pkvsh.apps.googleusercontent.com';
    var lib = null, pending = null;
    function load() {
      return lib || (lib = new Promise(function (ok, no) {
        var s = document.createElement('script');
        s.src = 'https://accounts.google.com/gsi/client';
        s.onload = ok; s.onerror = function () { lib = null; no({ code: 'network' }); };
        document.head.appendChild(s);
      }));
    }
    function finish(r) {
      var p = pending; pending = null;
      var box = document.getElementById('gsiBox'); if (box) box.remove();
      try { google.accounts.id.cancel(); } catch (e) { /* 무시 */ }
      if (p) { if (r && r.credential) p.ok({ idToken: r.credential }); else p.no({ code: 'cancel' }); }
    }
    function card() {
      var box = document.createElement('div');
      box.id = 'gsiBox';
      box.style.cssText = 'position:fixed;inset:0;z-index:300;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(28,40,20,.45)';
      box.innerHTML = '<div style="width:100%;max-width:320px;padding:22px 18px 16px;border-radius:20px;background:#F8FAF1;color:#26301E;text-align:center;font-family:inherit">' +
        '<b style="display:block;font-size:19px;margin-bottom:6px">구글 계정 연결</b>' +
        '<p style="margin:0 0 14px;font-size:14px;line-height:1.5;color:#5F6B55">연결할 구글 계정을 골라 주세요</p>' +
        '<div id="gsiBtn" style="display:flex;justify-content:center;min-height:44px"></div>' +
        '<button type="button" id="gsiNo" style="margin-top:12px;width:100%;min-height:44px;border:0;border-radius:12px;background:#EEF3E2;color:#26301E;font:inherit;font-size:15px">닫기</button></div>';
      document.body.appendChild(box);
      box.querySelector('#gsiNo').onclick = function () { finish(null); };
      return box.querySelector('#gsiBtn');
    }
    return {
      web: true,
      login: function () {
        return load().then(function () {
          return new Promise(function (ok, no) {
            if (pending) finish(null);
            pending = { ok: ok, no: no };
            google.accounts.id.initialize({ client_id: CLIENT, callback: finish, use_fedcm_for_prompt: true, use_fedcm_for_button: true, context: 'use', locale: 'ko' });
            google.accounts.id.renderButton(card(), { theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill', locale: 'ko', width: 260 });
            google.accounts.id.prompt();
          });
        });
      }
    };
  })();
</script>"""

DOC = f"""<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
{VERMETA}<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="도토리를 모아 숲속 학교를 키우는 방치형 게임 테스트판이에요.">
<style>html,body{{margin:0}}</style>
<!-- github-only -->
<meta property="og:type" content="website">
<meta property="og:title" content="숲속 동물 학교">
<meta property="og:description" content="도토리를 모아 숲속 학교를 키워요. 테스트판이에요.">
<meta property="og:url" content="{SITE}">
<meta property="og:image" content="{SITE}og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="theme-color" content="#2C4A3D">
<link rel="icon" href="{ICON}">
{LOADER}
<script>window.FS_WEB_LOCK = true;</script>
<!-- /github-only -->
{head}
</head>
<body>
{body.strip()}
</body>
</html>
"""
(OUT / 'index.html').write_text(DOC, encoding='utf-8')
cfg = OUT / 'config.js'
if not cfg.exists():
    cfg.write_text((HERE / 'gh_config_template.js').read_text(encoding='utf-8'), encoding='utf-8')
for name in ('database.rules.json', 'README.md'):
    (OUT / name).write_text((HERE / ('gh_' + name)).read_text(encoding='utf-8'), encoding='utf-8')
(OUT / '.nojekyll').write_text('', encoding='utf-8')
# 1.8.0 배경음악은 게임 옆 audio 폴더의 파일이에요. 저장소 맨 위에 만들 때는 이미 거기 있고, 다른 곳에 만들 때만 복사해요
import shutil
AUD = HERE.parent / 'audio'
if OUT.resolve() != HERE.parent.resolve():
    (OUT / 'audio').mkdir(exist_ok=True)
    for f in sorted(AUD.glob('bgm_*.mp4')):
        shutil.copyfile(f, OUT / 'audio' / f.name)
    # 2.0.0 고화질 지도(img/maps)도 함께
    shutil.copytree(HERE.parent / 'img', OUT / 'img', dirs_exist_ok=True)
    shutil.copyfile(HERE.parent / 'live.json', OUT / 'live.json')   # 2.0.0 핫픽스 원격 설정
print('built', OUT, len(DOC))
