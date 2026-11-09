import json, re, base64, io, numpy as np, math
from PIL import Image
from scipy import ndimage, optimize
from skimage.morphology import disk
S=open('/home/claude/work/forest-school/dev/forest-school.html',encoding='utf-8').read()
G=json.load(open('grab.json')); PB=json.load(open('padbox.json'))
TN=['kinder','elem','middle','high']; Z=512/360  # 반 해상도 지도 픽셀/지도 단위
def lots(t):
    a=S.index(f"{{ map: 'map_{t}',"); e=S[a:a+3000]
    m=re.search(r'lot: \{([^}]*)\}', e); L={k:[float(x) for x in v.split(',')] for k,v in re.findall(r'(\w+): \[([^\]]*)\]', m.group(1))}
    L['next']=[float(x) for x in re.search(r'nextLot: \[([^\]]*)\]', e).group(1).split(',')]
    return L
def amat(cx,cy,w,a,r,Px,Py):
    # 지도 단위 → 그림 픽셀(400) 역변환 행렬(지도 반해상도 픽셀 기준)
    pass
res={}
for ti,t in enumerate(TN):
    L=lots(t); res[t]={}
    pads={k:np.array(Image.fromarray(np.load(f'pad_{t}_{k}.npy').astype(np.uint8)*255).resize((512,768)))>127 for k in PB[t]}
    allpad=np.zeros((768,512),bool)
    for m in pads.values(): allpad|=m
    for eid,v in G[str(ti)].items():
        if not v['href'] or v['w']==0: continue
        k=eid[2:]
        if t=='kinder' and k=='science': continue
        lot=L[k]; Px,Py=lot[0]/100*360, lot[1]/100*540-60
        im=Image.open(io.BytesIO(base64.b64decode(v['href'].split(',')[1]))).convert('RGBA'); A=np.array(im)[:,:,3]/255.; N=A.shape[0]
        bx,by,bw=v['x']+v['w']/2, v['y']+v['w']/2, v['w']
        # 가장 가까운 빈터
        def cen(m): ys,xs=np.where(m); return xs.mean()/Z, ys.mean()/Z-60
        pk=min(pads, key=lambda q: (cen(pads[q])[0]-Px)**2+(cen(pads[q])[1]-(Py-10))**2)
        P=pads[pk]; Pd=ndimage.binary_dilation(P,structure=disk(7)); ys,xs=np.where(P); ptop=ys.min(); pmid=int(ys.mean())
        others=allpad&~P
        rot_ok = k=='playground' and ti>0
        def render(p):
            dx,dy,f,a,r=p
            cx=Px+(bx-Px)*f+dx; cy=Py+(by-Py)*f+dy; w=bw*f; Qx,Qy=Px+dx,Py+dy
            # 지도 점 X → 그림: 역회전, 역세로배율 about Q, 그 다음 사각형
            th=math.radians(r); c,s_=math.cos(th),math.sin(th)
            # 지도 반해상도 픽셀(u,v) → 지도 단위 (u/Z, v/Z-60)
            # 순변환: X = Q + R*D*(Y-Q), Y=그림 위 점(지도 단위), D=diag(1,a)
            # 역: Y = Q + D^-1 R^-1 (X-Q); 그림 픽셀 = (Y - (cx-w/2, cy-w/2)) * N/w
            Ri=np.array([[c,s_],[-s_,c]]); Di=np.diag([1,1/a]); M=Di@Ri  # 지도단위 차이 → 그림 지도단위 차이
            sc=N/w
            # X(map units) = (u/Z, v/Z-60). pixel_img = sc*(Q + M@(X-Q) - (cx-w/2,cy-w/2))
            Mf=M/Z*sc
            off=sc*(np.array([Qx,Qy]) - M@np.array([Qx,Qy]) + M@np.array([0,-60]) - np.array([cx-w/2,cy-w/2]))
            # PIL affine: (x_img, y_img) = (a*u+b*v+c, d*u+e*v+f)
            out=Image.fromarray((A*255).astype(np.uint8)).transform((512,768),Image.AFFINE,(Mf[0,0],Mf[0,1],off[0],Mf[1,0],Mf[1,1],off[1]),resample=Image.BILINEAR)
            return np.array(out)>127
        low=np.zeros((768,512),bool); low[pmid-int((pmid-ptop)*0.3):,:]=True
        def cost(p):
            dx,dy,f,a,r=p
            if not (0.8<a<1.25 and 0.7<f<1.6): return 9
            if not rot_ok and abs(r)>0.01: return 9
            B=render(p); n=P.sum()
            unc=(P&~B).sum()/n; over=(B&low&~Pd).sum()/n; hit=(B&others).sum()/n
            return unc*4+over*1.0+hit*3+0.3*abs(a-1)+0.004*abs(r)
        best=None
        for r0 in ([0,-8,8] if rot_ok else [0]):
            x0=np.array([0,0,1.05,1,r0]); simp=np.array([x0,x0+[3,0,0,0,0],x0+[0,3,0,0,0],x0+[0,0,.12,0,0],x0+[0,0,0,.1,0],x0+[0,0,0,0,(4 if rot_ok else 0)]])
            o=optimize.minimize(cost,x0,method='Nelder-Mead',options=dict(initial_simplex=simp,maxiter=500,xatol=0.05,fatol=1e-4))
            if best is None or o.fun<best.fun: best=o
        p=best.x; B=render(p); n=P.sum()
        res[t][k]=dict(p=[round(float(x),3) for x in p], pad=pk, unc=round(float((P&~B).sum()/n),3), over=round(float((B&low&~Pd).sum()/n),3), hit=round(float((B&others).sum()/n),3),
                       unc0=round(float((P&~render([0,0,1,1,0])).sum()/n),3))
        print(t,k,pk,res[t][k],flush=True)
json.dump(res,open('opt.json','w'))
