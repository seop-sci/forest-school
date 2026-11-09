# 3.3.0 건물을 빈터 크기에 맞추기: 바닥 섬 아래쪽 끝을 빈터 앞 가장자리 조금 안쪽에, 바닥 섬 너비를 빈터 너비에 맞춰요
import json, re, numpy as np
from PIL import Image
H='/home/claude/work/forest-school/dev/forest-school.html'
s=open(H,encoding='utf-8').read()
R=json.load(open('/home/claude/gen/lotfit.json'))
st={'0':'on'}
# 1) 새 건물 그림의 바닥 섬: 아래쪽 끝(가장 넓은 줄의 30% 넘는 마지막 줄)과 가장 넓은 줄의 가운데, 너비
import glob, base64, io
def isl2(im):
    a=np.array(im)[:,:,3]>40; Hh,W=a.shape; rows=a.sum(1); nz=np.where(rows>0)[0]; bot=nz[-1]; lo=max(0,bot-int(0.22*Hh))
    band=rows[lo:bot+1]; mx=band.max(); r=lo+int(np.where(band>=0.97*mx)[0][-1]); xs=np.where(a[r])[0]
    last=lo+int(np.where(band>=0.3*mx)[0][-1])
    return [round((xs[0]+xs[-1])/2/W-0.5,4), round(last/Hh-0.5,4), round((xs[-1]-xs[0]+1)/W,4)]
ISL={}
for k in sorted(set(re.findall(r'"(bld_[a-z]+_[a-z0-9]+(?:_winter)?)"\s*:\s*"data:', s))):
    m=re.search(r'"'+k+r'"\s*:\s*"data:image/webp;base64,([^"]+)"', s); im=Image.open(io.BytesIO(base64.b64decode(m.group(1)))).convert('RGBA')
    ISL[k]=isl2(im)
for k in list(ISL):
    if k.endswith('_winter') and k[:-7] in ISL: ISL[k]=ISL[k[:-7]]
# BLD_ISL 바꾸기
i=s.index('  const BLD_ISL = {'); j=s.index('};',i)
s=s[:i]+'  const BLD_ISL = {'+','.join(k+':['+', '.join(str(x) for x in v)+']' for k,v in sorted(ISL.items()))+s[j:]
i=s.index('  const GEO_ISL = {'); j=s.index('};',i); gk=re.findall(r'(bld_\w+):', s[i:j])
s=s[:i]+'  const GEO_ISL = {'+', '.join(k+': ['+', '.join(str(x) for x in ISL[k])+']' for k in gk)+s[j:]
s=s.replace("BLD_ISL[key] || [0, 0.1, 0.94]","BLD_ISL[key] || [0, 0.4, 0.94]",1)
s=s.replace("// 3.3.0 새 단장 건물(작업지시서 56)의 바닥 섬 값은 아래에서 가장 넓은 띠(넓이 97% 이상 줄 중 가장 아래)로 다시 쟀어요(겨울판은 기본과 같게)",
 "// 3.3.0 새 단장 건물(작업지시서 56)의 바닥 섬 값: [가장 넓은 줄 가운데 - 0.5, 바닥 섬 아래 끝 - 0.5, 가장 넓은 줄 너비]. 3.3.0 빈터 자리는 '바닥 섬 아래 끝이 놓일 곳'이에요(겨울판은 기본과 같게)",1)
# 2) 빈터 자리: [가운데 x, 앞 가장자리에서 빈터 높이의 12% 안쪽, 빈터 너비 × FIT]
FIT={'kinder':0.98,'elem':0.98,'middle':0.98,'high':1.02}
for t,mk in [('kinder','map_kinder'),('elem','map_elem'),('middle','map_middle'),('high','map_high')]:
    a=s.index(f"{{ map: '{mk}',"); b=s.find('{ map:', a+5); b=s.index('];', a) if b<0 else b; e=s[a:b]
    def v(k, cap=None):
        r=R[t][k]; w=r['w']*FIT[t]; w=min(w,cap) if cap else w
        return [r['cx'], round(r['cy']+r['h']/2-0.12*r['h'],2), round(w,2)]
    m=re.search(r'lot: \{([^}]*)\}', e); keys=re.findall(r'(\w+): \[', m.group(1))
    swap={'classroom':'playground','playground':'classroom'} if t=='middle' else {}
    parts=[]
    for k in keys:
        src='next' if (t=='kinder' and k=='science') else swap.get(k,k)
        cap=30 if (t=='middle' and k=='classroom') else None
        parts.append(f"{k}: [{', '.join(str(x) for x in v(src,cap))}]")
    e=e.replace(m.group(0), 'lot: { '+', '.join(parts)+' }')
    e=re.sub(r'nextLot: \[[^\]]*\]', 'nextLot: ['+', '.join(str(x) for x in v('next'))+']', e, count=1)
    s=s[:a]+e+s[b:]
open(H,'w',encoding='utf-8').write(s)
json.dump(ISL,open('/home/claude/gen/isl330b.json','w')); print('ok', len(ISL))
