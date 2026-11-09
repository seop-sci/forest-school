# 3.3.0 새 지도 자리 표(작업지시서 57) → 게임 자리 값(JSON). 선생님과 숨은 생물 자리는 빈 풀밭을 자동으로 골라요
import re, json, math
import numpy as np
from PIL import Image
NM={'교실':'classroom','급식실':'cafeteria','도서관':'library','과학실':'science','운동장':'playground','놀이터':'playground','매점':'store','기숙사':'dorm'}
D='/home/claude/art/57v2/57_maps_v2/'
FILES=[('kinder','lots_kinder_v3.md'),('elem','lots_elem_v2.md'),('middle','lots_middle_v3.md'),('high','lots_high_v2.md')]
MAP_W,MAP_H,MAP_Y=360,540,-60
X=lambda v: round(v/100*MAP_W,1); Y=lambda v: round(v/100*MAP_H+MAP_Y,1)
out={}
for t,f in FILES:
    s=open(D+f,encoding='utf-8').read(); d={'lot':{},'lotH':{}}
    for name,a,b,c,h in re.findall(r'\|([^|\n]+?)\|\[([\d.]+),\s*([\d.]+),\s*([\d.]+)\]\|([\d.]+)\|',s):
        name=name.strip(); v=[float(a),float(b),float(c)]
        if '공사' in name: d['next']=v; d['nextH']=float(h)
        elif name in NM: d['lot'][NM[name]]=v; d['lotH'][NM[name]]=float(h)
    def one(lbl):
        m=re.search(re.escape(lbl)+r'[^|\n]*\|\[([\d., ]+)\]',s); return [float(x) for x in m.group(1).split(',')]
    for k,l in [('gate','교문'),('bus','버스'),('plaza','광장'),('oak','참나무'),('sign','간판'),('mon','기념물')]: d[k]=one(l)
    d['deco']=[[float(x) for x in m.split(',')][:2] for m in re.findall(r'\|D\d\d\|\[([\d., ]+)\]',s)]
    P={int(n):[float(x) for x in m.split(',')] for n,m in re.findall(r'\|P(\d\d)\|\[([\d., ]+)\]',s)}
    d['path']=[P[k] for k in sorted(P)]
    d['links']=[(int(a),int(b)) for a,b in re.findall(r'P(\d\d)–P(\d\d)',s)]
    ent={}
    for name,pn in re.findall(r'\|([^|\n]+?)\|P(\d\d)\|',s):
        name=name.strip(); key='next' if '공사' in name else NM.get(name)
        if key: ent[key]=P[int(pn)]
    d['ent']=ent
    m=re.search(r'\[가운데 가로, 세로, 너비, 높이\][^\[]*\[([\d., ]+)\]',s); d['sports']=[float(x) for x in m.group(1).split(',')]
    # ---- 빈 풀밭 찾기 (선생님, 숨은 생물)
    img=np.array(Image.open(D+f'map_{t}.png').convert('RGB')).astype(int)
    def busy(x,y,pad=0):
        for k,(lx,ly,lw) in list(d['lot'].items())+[('next',d['next'])]:
            if abs(x-lx)<lw/2+3+pad and ly-14-pad<y<ly+6+pad: return True   # 빈터와 그 위 건물, 아래 이름표
        for (a,b) in d['links']:
            ax,ay=P[a]; bx,by=P[b]; dx,dy=bx-ax,by-ay; L=dx*dx+dy*dy or 1
            u=max(0,min(1,((x-ax)*dx+(y-ay)*dy)/L)); px,py=ax+u*dx,ay+u*dy
            if math.hypot(x-px,(y-py)*1.5)<3: return True
        for q in d['deco']+[d['sign'],d['mon'][:2],d['oak'],d['plaza'][:2],d['gate'],d['bus']]:
            if math.hypot(x-q[0],(y-q[1])*1.5)<7: return True
        if abs(y-d['sports'][1])<3 and abs(x-d['sports'][0])<d['sports'][2]/2+2: return True
        return False
    def water(x,y):
        px,py=int(x/100*1024),int(y/100*1536); r,g,b=img[max(0,py-6):py+6,max(0,px-6):px+6].reshape(-1,3).mean(0)
        return b>r+20 and b>g-5
    cands=[(x,y) for x in np.arange(8,93,2.0) for y in np.arange(20,84,2.0) if not busy(x,y)]
    # 숨은 생물 6곳: 서로 멀리(가장 먼 점 고르기), 물가가 있으면 하나 이상
    wat=[c for c in cands if water(*c)]
    pick=[wat[len(wat)//2]] if wat else []
    pool=[c for c in cands if not water(*c)]
    if not pick: pick=[pool[len(pool)//2]]
    while len(pick)<6 and pool:
        best=max(pool,key=lambda c:min(math.hypot(c[0]-p[0],(c[1]-p[1])*1.5) for p in pick)); pick.append(best)
    d['bx']=[[round(x,1),round(y,1),1 if water(x,y) else 0] for x,y in pick]
    # 선생님: 건물 입구 길 점 옆 빈 곳(가장 가까운 후보)
    def near(q, used):
        c=[c for c in cands if all(math.hypot(c[0]-u[0],c[1]-u[1])>6 for u in used)]
        return min(c,key=lambda c:math.hypot(c[0]-q[0],(c[1]-q[1])*1.5))
    used=[p[:2] for p in d['bx']]
    tea={}
    for k,q in [('hedgehog',[d['plaza'][0]-14,d['plaza'][1]+2]),('squirrel',d['ent']['classroom']),('bear',d['ent']['playground']),('owl',d['ent']['library']),('owlAway',[d['plaza'][0]-20,d['plaza'][1]+12])]:
        c=near(q,used); used.append(c); tea[k]=[X(c[0]),Y(c[1])]
    d['tea']=tea
    out[t]=d
    print(t,'lots',len(d['lot']),'cands',len(cands),'bx',d['bx'],'tea',{k:v for k,v in tea.items()})
json.dump(out,open('/home/claude/gen/geo330.json','w'),ensure_ascii=False,indent=0)
