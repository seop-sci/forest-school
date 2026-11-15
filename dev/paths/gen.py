# 4.4.2 학생 걷는 길 만들기: 지도 그림에서 길 색(흙, 보도블록)을 찾아 자리(spots) 사이 이웃 길을 이어요.
# 쓰는 법: cd dev && python3 wrap.py && python3 paths/dump.py && python3 paths/gen.py  → forest-school.html의 const MAP_PATHS 줄을 다시 써요(손으로 고치지 않아요). 확인 그림은 /tmp/paths_pe*.png
import json, numpy as np, heapq
from PIL import Image, ImageDraw
from scipy.sparse import lil_matrix, csr_matrix
from scipy.sparse.csgraph import dijkstra
from mask import mask, G, STEP, ROOT, HERE
CAMPUS_BLK=[(67,38,134,95),(32,84,77,126),(123,91,165,126),(197,28,327,108),(232,128,295,164),(188,147,228,179),(292,147,337,200),(28,197,84,232),(95,200,123,228),(21,232,136,284),(134,276,232,326),(95,334,130,372),(235,334,271,372),(32,260,70,295)]
def blocks(g):
    B=[]
    for k,(cx,cy,w,_) in g['b'].items(): B.append((cx-w*.38-4,cy-w*.38-4,cx+w*.38+4,cy+w*.3+4))
    if g['next']: cx,cy,w,_=g['next']; B.append((cx-w*.38-4,cy-w*.38-4,cx+w*.38+4,cy+w*.3+4))
    if g['campus']: B+=CAMPUS_BLK
    return B
def run(i):
    g=G[i]; m,small=mask(i); H,W=m.shape
    cost=np.where(m,1.0,80.0)
    yy,xx=np.mgrid[0:H,0:W]; X=xx*STEP+STEP/2; Y=yy*STEP+STEP/2-60
    blk=np.zeros_like(m)
    for (x0,y0,x1,y1) in blocks(g): blk|=(X>x0)&(X<x1)&(Y>y0)&(Y<y1)
    if g['fount']:
        fx,fy,rx,ry=g['fount']; blk|=((X-fx)/(rx+4))**2+((Y-fy)/(ry+4))**2<1
    blk|=(Y<20)  # 하늘과 먼 산
    cost[blk]=np.inf
    sp=[]
    for (x,y) in g['spots']:
        c=int(round(x/STEP-.5)), int(round((y+60)/STEP-.5))
        best=None
        for r in range(0,8):
            for dy in range(-r,r+1):
                for dx in range(-r,r+1):
                    cx,cy=c[0]+dx,c[1]+dy
                    if 0<=cx<W and 0<=cy<H and m[cy,cx] and not blk[cy,cx]:
                        d=dx*dx+dy*dy
                        if best is None or d<best[0]: best=(d,cx,cy)
            if best: break
        if not best: best=(0,c[0],c[1]); print('  spot off path',i,len(sp))
        sp.append((best[1],best[2]))
    idx=lambda cx,cy: cy*W+cx
    N=H*W; A=lil_matrix((N,N))
    for dy,dx in [(0,1),(1,0),(1,1),(1,-1)]:
        L=np.hypot(dx,dy)
        for cy in range(H):
            ny=cy+dy
            if ny>=H: continue
            for cx in range(W):
                nx=cx+dx
                if nx<0 or nx>=W: continue
                c=(cost[cy,cx]+cost[ny,nx])/2*L
                if np.isfinite(c): A[idx(cx,cy),idx(nx,ny)]=c
    A=csr_matrix(A)
    src=[idx(*p) for p in sp]
    D,P=dijkstra(A,directed=False,indices=src,return_predecessors=True)
    edges=[]
    for a in range(len(sp)):
        for b in range(a+1,len(sp)):
            t=src[b]
            if not np.isfinite(D[a,t]): continue
            path=[]; u=t
            while u!=src[a] and u>=0: path.append(u); u=P[a,u]
            path.append(src[a]); path.reverse()
            pts=[((u%W)*STEP+STEP/2,(u//W)*STEP+STEP/2-60) for u in path]
            # 다른 자리를 지나가면 이웃이 아니에요
            ok=True
            for k,(sx,sy) in enumerate(g['spots']):
                if k in (a,b) or min(np.hypot(sx-g['spots'][a][0],sy-g['spots'][a][1]),np.hypot(sx-g['spots'][b][0],sy-g['spots'][b][1]))<9: continue
                if min(np.hypot(px-sx,py-sy) for px,py in pts[2:-2] or pts)<7: ok=False; break
            off=sum(0 if m[u//W,u%W] else 1 for u in path)/len(path)
            ln=sum(np.hypot(pts[q+1][0]-pts[q][0],pts[q+1][1]-pts[q][1]) for q in range(len(pts)-1))
            edges.append((a,b,pts,off,ln,ok and (off<=0.3 or off*ln<=20)))
    # 이웃 길만 쓰고, 그래도 끊긴 자리 무리는 길에서 가장 덜 벗어나는 길로 이어요
    good=[e for e in edges if e[5]]
    comp=list(range(len(sp)))
    def f(x):
        while comp[x]!=x: comp[x]=comp[comp[x]]; x=comp[x]
        return x
    for e in good: comp[f(e[0])]=f(e[1])
    for e in sorted([e for e in edges if not e[5] and e[5] is not None], key=lambda e:e[3]*e[4]+e[4]*0.05):
        if f(e[0])!=f(e[1]): comp[f(e[0])]=f(e[1]); good.append(e); print('  bridge',i,e[0],e[1],round(e[3],2),round(e[4]))
    edges=[e[:5] for e in good]
    return sp,edges,blk
def simplify(pts,eps=1.5):
    if len(pts)<3: return pts
    (x0,y0),(x1,y1)=pts[0],pts[-1]; dx,dy=x1-x0,y1-y0; L=np.hypot(dx,dy) or 1
    d=[abs(dy*(x-x0)-dx*(y-y0))/L for x,y in pts]; k=int(np.argmax(d))
    if d[k]<eps: return [pts[0],pts[-1]]
    return simplify(pts[:k+1],eps)[:-1]+simplify(pts[k:],eps)
if __name__=='__main__':
    import sys
    out={}
    for i in range(9):
        sp,edges,blk=run(i); g=G[i]
        im=Image.open(f'{ROOT}/img/maps/{g["map"]}.webp').convert('RGB'); d=ImageDraw.Draw(im); S=1024/360
        E=[]
        for a,b,pts,off,ln in edges:
            s=simplify(pts)
            E.append([a,b,[[round(x),round(y)] for x,y in s[1:-1]]])
            d.line([(x*S,(y+60)*S) for x,y in [g['spots'][a]]+s+[g['spots'][b]]],fill=(255,0,0),width=6)
        for j,(x,y) in enumerate(g['spots']):
            X,Y=x*S,(y+60)*S; d.ellipse([X-10,Y-10,X+10,Y+10],fill=(255,0,255)); d.text((X+12,Y-12),str(j),fill=(0,0,0),font_size=34)
        im.resize((512,768)).save(f'/tmp/paths_pe{i}.png')
        out[i]=E; print(i,len(g['spots']),len(E))
    import re
    H=ROOT/'dev'/'forest-school.html'; t=H.read_text()
    line='  const MAP_PATHS = '+json.dumps([out[i] for i in range(9)],separators=(',',':'))+';   // dev/paths/gen.py가 만들어요(손으로 고치지 않아요)'
    t2,n=re.subn(r'^  const MAP_PATHS = .*$',lambda _:line,t,count=1,flags=re.M)
    assert n==1, 'forest-school.html에 const MAP_PATHS 줄이 없어요'
    H.write_text(t2); print('WALK', len(line))
