import json, numpy as np
from PIL import Image
import pathlib; HERE=pathlib.Path(__file__).resolve().parent; ROOT=HERE.parent.parent
G=json.load(open(HERE/'geo.json')); S=1024/360; STEP=2  # 맵 단위 2칸 격자
def hsv(a):
    a=a/255.; r,g,b=a[...,0],a[...,1],a[...,2]; mx=a.max(-1); mn=a.min(-1); d=mx-mn+1e-9
    h=np.where(mx==r,((g-b)/d)%6,np.where(mx==g,(b-r)/d+2,(r-g)/d+4))*60
    return h, d/(mx+1e-9), mx
def mask(i):
    g=G[i]; im=np.asarray(Image.open(f'{ROOT}/img/maps/{g["map"]}.webp').convert('RGB')).astype(float)
    W,H=360//STEP,540//STEP
    # 칸마다 가운데 둘레 평균
    small=np.asarray(Image.fromarray(im.astype(np.uint8)).resize((W,H),Image.BOX)).astype(float)
    h,s,v=hsv(small)
    m=(h>18)&(h<52)&(s>0.08)&(s<0.5)&(v>0.55)
    return m, small
if __name__=='__main__':
    for i in range(9):
        m,small=mask(i)
        o=small.copy(); o[m]=o[m]*0.3+np.array([255,0,0])*0.7
        Image.fromarray(o.astype(np.uint8)).resize((360,540),Image.NEAREST).save(f'/tmp/paths_mk{i}.png')
