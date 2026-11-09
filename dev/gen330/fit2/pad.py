# 빈터(흙/보도) 마스크: 가운데 색에서 Lab 거리로 영역 키우기
import json, numpy as np, sys
from PIL import Image
from scipy import ndimage
from skimage import color
R=json.load(open('/home/claude/gen/lotfit.json'))
M='/home/claude/work/forest-school/img/maps/'
out={}
RAD={'middle':14}
for t in ['kinder','elem','middle','high']:
    rgb=np.array(Image.open(M+f'map_{t}.webp').convert('RGB')); H,W,_=rgb.shape
    lab=color.rgb2lab(rgb/255.)
    vis=rgb.copy().astype(float)
    for k,r in R[t].items():
        cx,cy=int(r['cx']/100*W),int(r['cy']/100*H)
        ref=np.median(lab[cy-10:cy+10,cx-30:cx+30].reshape(-1,3),0)
        d=np.sqrt(((lab-ref)**2).sum(2))
        thr={('elem','next'):9,('kinder','playground'):12,('kinder','next'):12}.get((t,k), float(sys.argv[1]) if len(sys.argv)>1 else 14)
        win=np.zeros((H,W),bool); win[max(0,cy-160):cy+160, max(0,cx-260):cx+260]=True
        m=(d<thr)&win
        m=ndimage.binary_closing(m,iterations=3)
        from skimage.morphology import disk, convex_hull_image
        m=ndimage.binary_closing(m,structure=disk(6))
        m=ndimage.binary_opening(m,structure=disk(RAD.get(t,16)))
        lab_,_=ndimage.label(m); L=lab_[cy,cx]
        if L==0:
            v,c=np.unique(lab_[cy-20:cy+20,cx-60:cx+60],return_counts=True); c=c[v>0]; v=v[v>0]; L=v[np.argmax(c)]
        m=convex_hull_image(lab_==L)
        np.save(f'/home/claude/gen/fit2/pad_{t}_{k}.npy', m)
        vis[m]=vis[m]*0.4+np.array([255,0,255])*0.6
        ys,xs=np.where(m); out.setdefault(t,{})[k]=[int(xs.min()),int(xs.max()),int(ys.min()),int(ys.max())]
    Image.fromarray(vis.astype(np.uint8)).resize((512,768)).save(f'/home/claude/gen/fit2/padvis_{t}.png')
json.dump(out,open('/home/claude/gen/fit2/padbox.json','w'))
print(out)
