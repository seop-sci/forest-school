import asyncio
from playwright.async_api import async_playwright
BASE='http://localhost:8766/'
SEG=[('kinder','도토리 모아\n숲속 학교를 키워요','#7CC36B','#2F7A47'),('fight','숲속 탐험대 출동!','#FFB36B','#E2603A'),
     ('boss','큰 장난꾸러기를\n달래 주세요','#9C8CF0','#5B4BC4'),('campus','유치원부터\n대학교까지','#79B8F2','#3A6FC4'),
     ('xmas','계절마다 바뀌는\n꾸미기 테마','#8FD3E8','#3E8DB0'),('story','따뜻한 학교 이야기','#F4B6C2','#C86A86')]
FMT={'v':(1080,1920),'h':(1920,1080),'s':(1080,1080)}
CSS=f"""<link rel=stylesheet href="{BASE}fonts.css"><style>*{{margin:0;box-sizing:border-box}}body{{overflow:hidden;font-family:Jua,sans-serif;position:relative}}
.bg{{position:absolute;inset:0;background:linear-gradient(180deg,var(--a),var(--b))}}.dots{{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.18) 18%,transparent 19%);background-size:90px 90px;opacity:.6}}
h1{{position:absolute;color:#fff;font-weight:400;white-space:pre-line;word-break:keep-all;line-height:1.12;text-shadow:0 6px 0 rgba(0,0,0,.14),0 10px 30px rgba(0,0,0,.18)}}
.logo{{position:absolute;color:#fff;font-size:40px;opacity:.95}}</style>"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for f,(w,h) in FMT.items():
            pg=await b.new_page(viewport={'width':w,'height':h})
            for k,t,a,c in SEG:
                if f=='v': pos=f'left:0;right:0;top:110px;text-align:center;font-size:{100 if chr(10) in t else 112}px'
                elif f=='h': pos='left:110px;top:50%;transform:translateY(-50%);width:900px;font-size:110px'
                else: pos='left:60px;top:50%;transform:translateY(-50%);width:470px;font-size:76px'
                await pg.set_content(f'<html><head>{CSS}</head><body style="width:{w}px;height:{h}px;--a:{a};--b:{c}"><div class=bg></div><div class=dots></div><h1 style="{pos}">{t}</h1></body></html>')
                await pg.wait_for_load_state('networkidle'); await pg.evaluate('document.fonts.ready'); await pg.wait_for_timeout(150)
                await pg.screenshot(path=f'vbg/{f}_{k}.png')
            # 처음과 끝 카드
            for k,t,sub in (('intro','',''),('end','지금 바로 시작해요','숲속 동물 학교')):
                if f=='v': art='left:0;top:0;width:1080px;height:1620px'; tx=f'left:0;right:0;bottom:120px;text-align:center;font-size:100px'
                elif f=='h': art='left:0;top:0;width:960px;height:1080px'; tx='left:1040px;top:50%;transform:translateY(-50%);width:820px;font-size:104px'
                else: art='left:0;top:0;width:620px;height:1080px'; tx='left:650px;top:50%;transform:translateY(-50%);width:400px;font-size:72px'
                body=f'<div style="position:absolute;{art};background:url({BASE}boot.png) center top/cover"></div>'+ (f'<h1 style="{tx}">{t}</h1>' if t else '')
                bgc = '#2F6B3D'
                await pg.set_content(f'<html><head>{CSS}</head><body style="width:{w}px;height:{h}px;--a:#7CC36B;--b:{bgc}"><div class=bg></div><div class=dots></div>{body}</body></html>')
                await pg.wait_for_load_state('networkidle'); await pg.evaluate('document.fonts.ready'); await pg.wait_for_timeout(150)
                await pg.screenshot(path=f'vbg/{f}_{k}.png')
            await pg.close()
        await b.close()
asyncio.run(main())
