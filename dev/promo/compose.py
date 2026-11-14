import asyncio, sys, json
from playwright.async_api import async_playwright
BASE='http://localhost:8766/'
SLIDES=[ # (파일, 큰 글, 작은 글, 배경 위색, 아래색, 강조색)
 ('kinder','숲속 동물 학교를\n키워 보세요','도토리를 모아 유치원부터 대학교까지','#7CC36B','#2F7A47','#FFE58A'),
 ('sk_sci_00','숲속 탐험대 출동!','귀여운 대원들과 끝없는 층에 도전','#FFB36B','#E2603A','#FFF3B0'),
 ('campus','대학교 캠퍼스까지\n쑥쑥 자라요','단과대학, 대학 축제, 배낭여행까지','#79B8F2','#3A6FC4','#FFF0A8'),
 ('tam_boss','큰 장난꾸러기를\n달래 주세요','대원을 키워 더 높은 층으로','#9C8CF0','#5B4BC4','#FFE3F2'),
 ('story','따뜻한 학교 이야기','장마다 펼쳐지는 숲속 학교의 비밀','#F4B6C2','#C86A86','#FFF6D8'),
 ('th_xmas','계절마다 바뀌는\n꾸미기 테마','봄, 여름, 가을, 겨울, 크리스마스','#8FD3E8','#3E8DB0','#FFFFFF'),
 ('tam_fight','대원을 키우고\n장비를 모아요','과목마다 다른 필살기','#9ED67A','#4E9A3A','#FFF3B0'),
 ('th_spring','학교가 자랄수록\n마을도 커져요','유치원, 초등학교, 중학교, 고등학교, 대학교','#FFC98A','#D9822B','#FFFBE0'),
]
CSS=f"""<link rel=stylesheet href="{BASE}fonts.css"><style>
*{{margin:0;box-sizing:border-box}} body{{width:1080px;height:1920px;overflow:hidden;font-family:Jua,sans-serif}}
.bg{{position:absolute;inset:0;background:linear-gradient(180deg,var(--a),var(--b))}}
.dots{{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.18) 18%,transparent 19%);background-size:90px 90px;opacity:.6}}
.cap{{position:absolute;left:0;right:0;top:92px;text-align:center;color:#fff;padding:0 60px}}
.cap h1{{font-weight:400;font-size:104px;line-height:1.12;letter-spacing:-1px;white-space:pre-line;text-shadow:0 6px 0 rgba(0,0,0,.14),0 10px 30px rgba(0,0,0,.18)}}
.cap p{{display:inline-block;margin-top:26px;font-size:44px;padding:12px 34px;border-radius:999px;background:rgba(255,255,255,.92);color:var(--b);box-shadow:0 6px 0 rgba(0,0,0,.1)}}
.phone{{position:absolute;left:50%;transform:translateX(-50%);width:860px;border-radius:64px 64px 0 0;overflow:hidden;border:14px solid #fff;border-bottom:0;box-shadow:0 30px 80px rgba(0,0,0,.28)}}
.phone{{height:var(--h)}} .phone img{{display:block;width:var(--zw);margin-left:var(--zl);margin-top:var(--off)}}
.spark{{position:absolute;font-size:70px}}
</style>"""
ZOOM={'sk_sci_00':1.14,'tam_boss':1.14,'tam_fight':1.14,'story':1.08}
OFF={'kinder':0,'sk_sci_00':290,'campus':240,'tam_boss':290,'story':300,'th_xmas':250,'tam_fight':290,'th_spring':250}
def slide_html(f, t, s, a, b, c, top):
    z=ZOOM.get(f,1.0); iw=832; zw=round(iw*z); zl=-round((zw-iw)/2); ih=zw*1920/1080
    off=round(min(OFF.get(f,0)*zw/1080, ih-(1960-top)))
    return f"""<html><head>{CSS}</head><body style="--a:{a};--b:{b};--c:{c}"><div class=bg></div><div class=dots></div>
<div class=cap><h1>{t}</h1><p>{s}</p></div>
<div class=phone style="top:{top}px;--off:-{off}px;--h:{1960-top}px;--zw:{zw}px;--zl:{zl}px"><img src="{BASE}raw/{f}.png"></div></body></html>"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':1080,'height':1920})
        for i,(f,t,s,a,bb,c) in enumerate(SLIDES,1):
            top = 560 if '\n' in t else 450
            await pg.set_content(slide_html(f,t,s,a,bb,c,top)); await pg.wait_for_load_state('networkidle'); await pg.evaluate("document.fonts.ready")
            await pg.wait_for_timeout(300); out=f'out/play/{i:02d}_{f}.png'; await pg.screenshot(path=out); print(out)
        await b.close()
asyncio.run(main())
