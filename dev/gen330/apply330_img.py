# 3.3.0 새 단장 그림 넣기: 작업지시서 56(건물 72, v3 목록), 57(지도 36)을 원본(base64)과 img/maps(고화질)에 넣고,
# 옛 건물에 맞춰 그린 창문 불빛 조각(glow_*)은 비워서 둥근 빛으로 돌아가게 해요. 바닥 섬 값(BLD_ISL)도 새로 재요.
import re, csv, base64, io, json, os, sys
import numpy as np
from PIL import Image
R='/home/claude/work/forest-school'
H=R+'/dev/forest-school.html'
s=open(H,encoding='utf-8').read()
def enc(im, q):
    b=io.BytesIO(); im.save(b,'WEBP',quality=q,method=6); return 'data:image/webp;base64,'+base64.b64encode(b.getvalue()).decode()
def put(key, url):
    global s
    pat=re.compile(r'(["\']'+re.escape(key)+r'["\']\s*:\s*["\'])data:image/[^"\']*(["\'])')
    s, n = pat.subn(lambda m: m.group(1)+url+m.group(2), s, count=1)
    assert n==1, key
def isl(im):
    a=np.array(im)[:,:,3]>40; Hh,W=a.shape; rows=a.sum(1); nz=np.where(rows>0)[0]; bot=nz[-1]; lo=max(0,bot-int(0.22*Hh))
    band=rows[lo:bot+1]; mx=band.max(); r=lo+int(np.where(band>=0.97*mx)[0][-1]); xs=np.where(a[r])[0]
    return [round((xs[0]+xs[-1])/2/W-0.5,4), round(r/Hh-0.5,4), round((xs[-1]-xs[0]+1)/W,4)]
# --- 건물
B='/home/claude/art/56v3/56_buildings/'
rows=list(csv.DictReader(open(B+'_preview/deliverables_final_v3.csv',encoding='utf-8-sig')))
ISL={}; done=[]
for r in rows:
    k=r['key']; b,st=k.split('_',1); suf='' if st=='on' else '_'+st; t=r['type']
    gk={'base':f'bld_{b}_{st}','winter':f'bld_{b}_{st}_winter','roof':f'roof_{b}{suf}'}.get(t,f'roof_{b}{suf}_winter')
    f=r['file']; f=f if os.path.isabs(f) and os.path.exists(f) else B+f.replace('\\','/').split('56_buildings/')[-1]
    im=Image.open(f).convert('RGBA').resize((400,400),Image.LANCZOS)
    put(gk, enc(im, 82 if gk.startswith('bld_') else 80)); done.append(gk)
    if gk.startswith('bld_'): ISL[gk]=isl(im)
# 바닥 섬 값: 겨울판은 기본과 같게(겨울은 눈만 다름)
for k in list(ISL):
    if k.endswith('_winter'): ISL[k]=ISL[k[:-7]]
# --- 창문 불빛 조각 비우기(새 건물과 안 맞음)
for k in re.findall(r'"(glow_(?:classroom|cafeteria|library|science|store|dorm)\w*)"\s*:\s*"data:', s):
    s=re.sub(r'("'+k+r'"\s*:\s*")data:image/[^"]*(")', r'\1\2', s, count=1)
# --- 지도
M1='/home/claude/art/57v2/57_maps_v2/'
M2=[os.path.join(dp,f) for dp,_,fs in os.walk('/home/claude/art/57m2') for f in fs if f.startswith('map_') and f.endswith('.png')]
src={os.path.basename(p)[:-4]:p for p in M2}
for t in ['kinder','elem','middle','high']:
    for x in ['','_winter']: src[f'map_{t}{x}']=M1+f'map_{t}{x}.png'
assert len(src)==36, len(src)
for k,p in sorted(src.items()):
    im=Image.open(p).convert('RGB')
    put(k, enc(im.resize((480,720),Image.LANCZOS), 80))
    im.resize((1024,1536),Image.LANCZOS).save(R+f'/img/maps/{k}.webp','WEBP',quality=80,method=6)
open(H,'w',encoding='utf-8').write(s)
json.dump(ISL,open('/home/claude/gen/isl330.json','w'))
print('건물',len(done),'지도',len(src),'섬',len(ISL))
