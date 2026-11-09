# 3.3.0 새 지도 자리(작업지시서 57 자리 표, geo330.json)를 GEO, DECO_SLOTS, DECO_SIGN, BX_SPOT, VD.spot에 넣어요
import re, json
H='/home/claude/work/forest-school/dev/forest-school.html'
s=open(H,encoding='utf-8').read()
G=json.load(open('/home/claude/gen/geo330.json'))
MAP_W,MAP_H,MAP_Y=360,540,-60
X=lambda v: round(v/100*MAP_W,1); Y=lambda v: round(v/100*MAP_H+MAP_Y,1)
f=lambda v: ('%.2f'%v).rstrip('0').rstrip('.')
arr=lambda L: '['+', '.join(f(x) for x in L)+']'
names={'kinder':'map_kinder','elem':'map_elem','middle':'map_middle','high':'map_high'}
for t,mk in names.items():
    d=G[t]; i=s.index(f"{{ map: '{mk}',"); j=s.find('{ map:', i+5); j=s.index('];', i) if j<0 or j>s.index('];',i) else j
    e=s[i:j]
    lots=dict(d['lot'])
    if t=='kinder': lots={'science':d['next'],**lots}
    lot='lot: { '+', '.join(f"{k}: {arr(v)}" for k,v in lots.items())+' },'
    e=re.sub(r'lot: \{[^}]*\},', lot, e, count=1)
    e=re.sub(r'nextLot: \[[^\]]*\]', 'nextLot: '+arr(d['next']), e, count=1)
    px=lambda p: f"[{f(X(p[0]))}, {f(Y(p[1]))}]"
    e=re.sub(r'oak: \[[^\]]*\]', 'oak: '+px(d['oak']), e, count=1)
    e=re.sub(r'plaza: \[[^\]]*\]', 'plaza: '+px(d['plaza']), e, count=1)
    e=re.sub(r'bus: \[[^\]]*\]', f"bus: [{f(X(d['bus'][0]))}, {f(Y(d['bus'][1])-6)}]", e, count=1)
    e=re.sub(r'drop: \[[^\]]*\]', f"drop: [{f(X(d['plaza'][0]))}, {f(Y(d['plaza'][1])+22)}, 36, 12]", e, count=1)
    e=re.sub(r'spots: \[\[.*?\]\],', 'spots: ['+', '.join(px(p) for p in d['path'])+'],', e, count=1, flags=re.S)
    e=re.sub(r'fount: \[[^\]]*\]', f"fount: [{f(X(d['plaza'][0]))}, {f(Y(d['plaza'][1]))}, 22, 14]", e, count=1)
    tea=d['tea']; sc={'hedgehog':0.57,'squirrel':0.6,'bear':0.72,'owl':0.69,'owlAway':0.63}
    e=re.sub(r'tea: \{[^}]*\},', 'tea: { '+', '.join(f"{k}: [{f(v[0])}, {f(v[1])}, {sc[k]}]" for k,v in tea.items())+' },', e, count=1)
    sp=d['sports']; e=re.sub(r'sports: \[[^\]]*\]', f"sports: [{f(X(sp[0]))}, {f(Y(sp[1]))}, {f(sp[2]*3.6)}, {f(max(sp[3]*5.4,16))}]", e, count=1)
    e=e.replace(f"{{ map: '{mk}',", f"{{ map: '{mk}',\n      // 3.3.0 새 단장: 지도와 빈터는 작업지시서 57(lots_{t}), 선생님 자리는 빈 풀밭에서 골랐어요(dev/gen330 기록)", 1)
    s=s[:i]+e+s[j:]
# 꾸미기 11곳, 간판, 숨은 생물, 기념물
i=s.index('  const DECO_SLOTS = ['); j=s.index('  ];',i)+4
s=s[:i]+'  const DECO_SLOTS = [   // 3.3.0 새 단장: 작업지시서 57 자리 표의 꾸미기 11곳(D01~D11)\n'+''.join('    '+'['+', '.join(arr(p) for p in G[t]['deco'])+'].map(pctXY),\n' for t in names)+'  ];'+s[j:]
s=re.sub(r'  const DECO_SIGN = \[[^\n]*', '  const DECO_SIGN = ['+', '.join(f"pctXY({arr(G[t]['sign'])})" for t in names)+'];   // 3.3.0 새 단장: 작업지시서 57 자리 표의 간판 자리', s, count=1)
i=s.index('  const BX_SPOT = [null,'); j=s.index(']]];',i)+4
s=s[:i]+'  const BX_SPOT = [null,   // 3.3.0 새 단장: 빈 풀밭에서 서로 멀리 6곳(물가 하나)\n'+',\n'.join('    ['+', '.join(arr(p) for p in G[t]['bx'])+']' for t in ['elem','middle','high'])+'];'+s[j:]
s=re.sub(r'spot: \[null, \[[^\n]*', 'spot: [null, '+', '.join(arr(G[t]['mon'][:2]) for t in ['elem','middle','high'])+'],   // 3.3.0 새 단장: 작업지시서 57 기념물 자리', s, count=1)
open(H,'w',encoding='utf-8').write(s)
print('ok')
