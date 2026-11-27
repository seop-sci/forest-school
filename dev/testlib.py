# 자동 시험의 공통 모듈 (5.0.2 개발 기반 정리). 예전에는 s4test.py가 겸했어요.
#   from testlib import URL, base, ctxpage, F, CLEAN, OVER, Checker, skip
# 이 모듈을 불러오기만 해도 시험의 끝 코드가 맞춰져요: 마지막으로 찍은 줄이 PASS(또는 SKIP)로 시작하지 않으면 끝 코드 1.
# 그래서 dev/runall.py와 GitHub 검사가 "마지막 줄 PASS"와 "끝 코드 0" 두 가지로 판정할 수 있어요.
import atexit, datetime, json, os, pathlib, sys, time
# 게임의 하루가 휴대폰 시간대를 따라요. 시험은 늘 한국 시간에서 돌려요(브라우저가 이 값을 읽어요)
os.environ.setdefault('TZ', 'Asia/Seoul')
try:
    time.tzset()
except AttributeError:
    pass
HERE = pathlib.Path(__file__).resolve().parent
URL = (HERE / 'test.html').resolve().as_uri() if not pathlib.Path('test.html').exists() else pathlib.Path('test.html').resolve().as_uri()
TODAY = datetime.date.today().isoformat()
BIG = dict(classroom=14, cafeteria=12, library=11, playground=8)
F = 'window.__forest'
# 떠 있는 창을 모두 닫고 줄 선 창을 비워요(시험이 보려는 창을 띄우기 전에)
CLEAN = "document.querySelectorAll('.overlay').forEach(o=>{o.hidden=true;o.classList.remove('open')}); window.__forest.rt.modalOpen=null; window.__forest.rt.modalQueue.length=0"
# 넘침 검사: 고른 요소 가운데 화면 밖으로 나가거나 안의 글이 넘치는 것의 목록(비어 있으면 통과). page.evaluate(OVER, '고르는 말')
OVER = """(sel => { const out = []; document.querySelectorAll(sel).forEach(el => { const r = el.getBoundingClientRect(); if (r.width && (r.right > innerWidth + 1 || r.left < -1 || el.scrollWidth > el.clientWidth + 2)) out.push((el.id || el.className) + ' ' + Math.round(r.left) + '~' + Math.round(r.right)); }); return out; })"""

def base(**kw):
    s = {'v':4,'budget':1e6,'students':60,'f':dict(BIG),'t':{'squirrel':5,'owl':5,'bear':5},'grade':4,'best':4,'sound':False,'vibrate':False,
         'savedAt':int(time.time()*1000),'pending':0,'pendingSec':0,'certNo':5,'earned':9e7,'yearEarned':3e6,
         'st':{'picks':40,'ups':90,'trains':20,'claims':3,'grads':0,'perks':0},
         'p':{'dip':0,'species':0,'perk':{'schol':0,'rep':0,'start':0,'drop':0,'night':0}},'att':{'last':TODAY,'n':2},'ad':{'day':'','n':0},'u':{'boost':True,'gtip':True},
         'tier':0,'tg':0,'tdip':0,'fund':0,'fp':{'schol':0,'rep':0,'dip':0},
         'q':{'init':True,'mid':'q22','m':22,'mb':0,'subs':[],'done':[],'gen':0,'subDone':5,'seen':22}}
    s.setdefault('rank', {'name': '', 'joined': False, 'sent': -1, 'by': '', 'asked': True})
    s.update(kw); return s

async def ctxpage(b, w, h, scheme, save):
    ctx = await b.new_context(viewport={'width':w,'height':h}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme=scheme)
    await ctx.add_init_script("window.__FOREST_TEST = true;")   # 2026-10-30: 업데이트 공지 창이 늦게 떠서 단추를 가려요. 시험 모드에서는 공지를 저절로 띄우지 않아요
    await ctx.add_init_script("if(!sessionStorage.getItem('seeded')){localStorage.setItem('forest-school-v1', %s);sessionStorage.setItem('seeded','1');}" % json.dumps(json.dumps(save)))
    page = await ctx.new_page(); errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.on('console', lambda m: errs.append('console:'+m.text) if m.type=='error' and 'ERR_TUNNEL' not in m.text and 'ERR_FILE_NOT_FOUND' not in m.text else None)   # 3.3.0부터 졸업식 큰 그림(img/cere)은 게임 밖 파일이라 시험 폴더에는 없어요
    await page.goto(URL); await page.wait_for_timeout(900)
    # 2.0.0부터 업데이트 뒤 첫 접속에 공지 창이 떠요. 이 시험은 공지를 보지 않으니 닫아요(2026-10-29)
    for _ in range(3):
        if not await page.evaluate("!document.querySelector('#mNotice').hidden"): break
        await page.evaluate("document.querySelector('#ntClose').click()"); await page.wait_for_timeout(300)
    return ctx, page, errs

class Checker:
    """틀린 것을 모았다가 끝에 PASS나 FAIL을 찍어요.  c = Checker(); c.ok(조건, '무엇'); ...; c.done()"""
    def __init__(self): self.bad = []
    def ok(self, cond, msg):
        if not cond: self.bad.append(msg); print('  틀림:', msg)
        return bool(cond)
    def done(self):
        print('PASS' if not self.bad else f'FAIL {len(self.bad)}'); sys.exit(1 if self.bad else 0)

def skip(why):
    """이 기계에서 돌릴 수 없는 시험(앱 묶음이 없음 등). runall은 SKIP으로 세고 실패로 보지 않아요"""
    print('SKIP ' + why); sys.exit(0)

async def open_browser(p, **kw):
    """Playwright 크로미움을 열어요.  async with async_playwright() as p: b = await open_browser(p)"""
    return await p.chromium.launch(**kw)

# ---- 끝 코드 맞추기: 마지막으로 찍은 줄을 기억했다가, PASS나 SKIP이 아니면 끝 코드 1 ----
class _Tee:
    def __init__(self, out): self.out = out; self.last = ''; self.buf = ''
    def write(self, t):
        self.buf += t
        while '\n' in self.buf:
            line, self.buf = self.buf.split('\n', 1)
            if line.strip(): self.last = line.strip()
        return self.out.write(t)
    def flush(self): return self.out.flush()
    def __getattr__(self, k): return getattr(self.out, k)
_tee = _Tee(sys.stdout); sys.stdout = _tee
def _final():
    last = (_tee.buf.strip() or _tee.last)
    try: sys.stdout.flush(); sys.stderr.flush()
    except Exception: pass
    if not (last.startswith('PASS') or last.startswith('SKIP')): os._exit(1)
# 시험 파일(sNNtest.py)을 바로 돌릴 때만 걸어요. 균형 도구(qbot.py 등)가 이 모듈을 불러도 끝 코드는 그대로예요
import re as _re
if _re.fullmatch(r's\d+test\.py', os.path.basename(sys.argv[0] or '')): atexit.register(_final)
else: sys.stdout = _tee.out
