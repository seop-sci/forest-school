# 3.3.0 빈터 가운데 다시 재기: 자리 표 가운데에서 바닥 색(흙, 보도블록)이 이어진 영역을 찾아 그 가운데와 너비로
import json, numpy as np
from PIL import Image
from scipy import ndimage
G=json.load(open('/home/claude/gen/geo330.json'))
D='/home/claude/art/57v2/57_maps_v2/'
res={}
for t in ['kinder','elem','middle','high']:
    a=np.array(Image.open(D+f'map_{t}.png').convert('RGB')).astype(float); H,W,_=a.shape
    items=list(G[t]['lot'].items())+[('next',G[t]['next'])]; res[t]={}
    for k,(x,y,w) in items:
        cx,cy=int(x/100*W),int(y/100*H)
        ref=np.median(a[cy-12:cy+12, cx-40:cx+40].reshape(-1,3),0)
        dist=np.sqrt(((a-ref)**2).sum(2))
        win=np.zeros((H,W),bool); x0w,x1w=max(0,cx-int(0.24*W)),min(W,cx+int(0.24*W)); y0w,y1w=max(0,cy-int(0.075*H)),min(H,cy+int(0.075*H)); win[y0w:y1w,x0w:x1w]=True
        thr={'middle':52}.get(t,34); mask=(dist<thr)&win
        mask=ndimage.binary_closing(mask, iterations=2)
        mask=ndimage.binary_opening(mask, structure=np.ones((3,3)), iterations={'middle':6}.get(t,9))   # 폭 50칸쯤 아래인 길은 잘려 나가요
        lab,_=ndimage.label(mask); L=lab[cy,cx]
        if L==0:
            # 가운데가 장식이면 근처에서 가장 큰 덩어리
            sub=lab[cy-20:cy+20,cx-60:cx+60]; v,c=np.unique(sub[sub>0],return_counts=True); L=v[np.argmax(c)]
        comp=lab==L; ys,xs=np.where(comp)
        # 너비는 가운데 높이 띠에서 재요(모서리 굴곡 영향 줄이기)
        my=int(np.median(ys)); band=comp[my-8:my+8]; bx=np.where(band.any(0))[0]
        x0,x1=bx.min(),bx.max(); y0,y1=ys.min(),ys.max()
        res[t][k]=dict(cx=round((x0+x1)/2/W*100,2), cy=round((y0+y1)/2/H*100,2), w=round((x1-x0)/W*100,2), h=round((y1-y0)/H*100,2), old=[x,y,w])
        print(t,k,'자리표',[x,y,w],'잰 값',[res[t][k]['cx'],res[t][k]['cy'],res[t][k]['w']],'높이',res[t][k]['h'])
json.dump(res,open('/home/claude/gen/lotfit.json','w'),ensure_ascii=False)
