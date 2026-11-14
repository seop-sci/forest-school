import asyncio
from playwright.async_api import async_playwright
BASE='http://localhost:8766/'
CSS=f"""<link rel=stylesheet href="{BASE}fonts.css"><style>
*{{margin:0;box-sizing:border-box}} body{{overflow:hidden;font-family:Jua,sans-serif;position:relative}}
.bg{{position:absolute;inset:0;background:radial-gradient(120% 90% at 20% 10%,#BFE6A2,#5FA65A 55%,#2F6B3D)}}
.dots{{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.16) 16%,transparent 17%);background-size:60px 60px}}
.art{{position:absolute;overflow:hidden;border-radius:28px;box-shadow:0 18px 40px rgba(0,0,0,.3);border:8px solid #fff}}
.art img{{width:100%;display:block}}
.ph{{position:absolute;overflow:hidden;border-radius:30px;border:8px solid #fff;box-shadow:0 18px 40px rgba(0,0,0,.3);background:#fff}}
.ph img{{display:block}}
.cap{{position:absolute;color:#fff;text-shadow:0 4px 0 rgba(0,0,0,.15),0 8px 24px rgba(0,0,0,.2)}}
.cap h1{{font-weight:400;line-height:1.1}}
.pill{{display:inline-block;background:#FFF3B0;color:#3D6B2E;border-radius:999px;padding:.25em .9em;box-shadow:0 4px 0 rgba(0,0,0,.12)}}
</style>"""
def card(src, x, y, w, h, rot, pos='50% 0%'):
    return f'<div class=ph style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;transform:rotate({rot}deg)"><img src="{BASE}raw/{src}.png" style="width:100%;height:100%;object-fit:cover;object-position:{pos}"></div>'
def art(x,y,w,h,rot=0):
    return f'<div class=art style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;transform:rotate({rot}deg)"><img src="{BASE}boot.png" style="width:100%;height:100%;object-fit:cover;object-position:50% 0%"></div>'
T1='<h1 style="font-size:{s}px">도토리 모아<br>숲속 학교를<br>키워요</h1>'
LAY={
 'feature_1024x500':(1024,500, art(36,36,290,428,-3)+card('card_skill',600,70,390,180,3,'50% 62%')+card('card_campus',600,270,390,190,-2,'50% 30%')+
   '<div class=cap style="left:350px;top:110px;width:240px">'+T1.format(s=44)+'<div class=pill style="font-size:21px;margin-top:16px">숲속 탐험대 출동!</div></div>'),
 'ad_1200x628':(1200,628, art(40,40,360,548,-3)+card('card_skill',720,70,440,230,3,'50% 62%')+card('card_campus',720,330,440,250,-2,'50% 30%')+
   '<div class=cap style="left:430px;top:160px;width:280px">'+T1.format(s=52)+'<div class=pill style="font-size:25px;margin-top:20px">숲속 탐험대 출동!</div></div>'),
 'ad_1200x1200':(1200,1200, art(60,250,500,860,-3)+card('card_skill',600,270,540,300,3,'50% 60%')+card('card_campus',600,610,540,240,-2,'50% 30%')+card('card_xmas',600,890,540,240,2,'50% 40%')+
   '<div class=cap style="left:0;right:0;top:56px;text-align:center"><h1 style="font-size:82px">도토리 모아 숲속 학교를 키워요</h1><div class=pill style="font-size:36px;margin-top:20px">유치원부터 대학교까지, 숲속 탐험대까지</div></div>'),
 'ad_1200x1500':(1200,1500, art(60,420,540,860,-3)+card('card_skill',630,420,520,320,3,'50% 60%')+card('card_boss',630,770,520,320,-2,'50% 60%')+card('card_xmas',630,1120,520,280,2,'50% 40%')+
   '<div class=cap style="left:0;right:0;top:70px;text-align:center"><h1 style="font-size:94px">도토리 모아<br>숲속 학교를 키워요</h1><div class=pill style="font-size:38px;margin-top:22px">유치원부터 대학교까지, 숲속 탐험대까지</div></div>'),
}
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for name,(w,h,body) in LAY.items():
            pg=await b.new_page(viewport={'width':w,'height':h})
            await pg.set_content(f'<html><head>{CSS}</head><body style="width:{w}px;height:{h}px"><div class=bg></div><div class=dots></div>{body}</body></html>')
            await pg.wait_for_load_state('networkidle'); await pg.evaluate('document.fonts.ready'); await pg.wait_for_timeout(300)
            d='play' if name.startswith('feature') else 'ads'
            await pg.screenshot(path=f'out/{d}/{name}.png'); print(name); await pg.close()
        await b.close()
asyncio.run(main())
