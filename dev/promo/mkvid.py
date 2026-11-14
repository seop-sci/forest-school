import json, os, sys, subprocess
from PIL import Image, ImageDraw
FPS=30; V='/home/claude/promo/vid/'
TL=[('intro',None,1.5,0),('kinder','v_kinder',2.5,0.3),('fight','v_fight',4.0,0.4),('boss','v_boss',3.0,1.0),('campus','v_campus',2.5,0.3),('xmas','v_xmas',2.0,0.3),('story','v_story',2.0,0.4),('end',None,2.0,0)]
TWO={'kinder','boss','campus','xmas'}
def rr_mask(w,h,r,top_only=False):
    m=Image.new('L',(w,h),0); d=ImageDraw.Draw(m); d.rounded_rectangle((0,0,w-1,h+ (r if top_only else 0)-1),r,fill=255); return m
cache={}
def src(name, t):
    ts=cache.setdefault(name, json.load(open(V+name+'/ts.json')))
    i=min(range(len(ts)), key=lambda k: abs(ts[k]-t)); return Image.open(f'{V}{name}/{i:05d}.jpg').convert('RGB')
def frame(fmt, seg, name, t, local, dur):
    W,H={'v':(1080,1920),'h':(1920,1080),'s':(1080,1080)}[fmt]
    bg=Image.open(f'vbg/{fmt}_{seg}.png').convert('RGB')
    if name is None:
        z=1+0.05*local/dur; bw,bh=int(W*z),int(H*z); bg=bg.resize((bw,bh),Image.LANCZOS).crop(((bw-W)//2,(bh-H)//2,(bw-W)//2+W,(bh-H)//2+H)); return bg
    g=src(name,t)
    if fmt=='v':
        if seg in ('fight','boss','story'): g=g.crop((60,250,1020,1919))
        gw=860; gh=round(g.height*gw/g.width); g=g.resize((gw,gh),Image.LANCZOS); top=440 if seg in TWO else 340
        bw=14; box=Image.new('RGB',(gw+2*bw,gh+bw),'white'); box.paste(g,(bw,bw)); m=rr_mask(box.width,box.height,64,True)
        bg.paste(box,((W-box.width)//2,top),m)
    else:
        gh=1000; gw=round(1080*gh/1919); g=g.resize((gw,gh),Image.LANCZOS); bw=10
        box=Image.new('RGB',(gw+2*bw,gh+2*bw),'white'); box.paste(g,(bw,bw)); m=rr_mask(box.width,box.height,44)
        x = 1180 if fmt=='h' else 540; bg.paste(box,(x,(H-box.height)//2),m)
    return bg
def build(fmt):
    out=f'frames_{fmt}/'; os.makedirs(out,exist_ok=True)
    for f in os.listdir(out): os.remove(out+f)
    n=0; prev=None; XF=6
    for seg,name,dur,start in TL:
        N=int(round(dur*FPS))
        for k in range(N):
            im=frame(fmt,seg,name,start+k/FPS,k/FPS,dur)
            if prev is not None and k<XF: im=Image.blend(prev,im,(k+1)/(XF+1))
            im.save(f'{out}{n:05d}.jpg',quality=93); n+=1
        prev=im
    return n
fmts=sys.argv[1:] or ['v','h','s']
for fmt in fmts:
    n=build(fmt); dur=n/FPS
    W,H={'v':(1080,1920),'h':(1920,1080),'s':(1080,1080)}[fmt]
    o=f'out/video_{ {"v":"1080x1920","h":"1920x1080","s":"1080x1080"}[fmt] }.mp4'
    subprocess.run(['ffmpeg','-v','error','-y','-framerate',str(FPS),'-i',f'frames_{fmt}/%05d.jpg','-i','/home/claude/forest-school/audio/bgm_home.mp4',
      '-filter_complex',f'[1:a]atrim=0:{dur},afade=t=in:d=0.3,afade=t=out:st={dur-1.2}:d=1.2,asetpts=PTS-STARTPTS[a]','-map','0:v','-map','[a]',
      '-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart','-shortest',o],check=True)
    print(o, n, 'frames', dur, 's')
