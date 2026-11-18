# 대학원 학기마다 평판, 대도시 기준, 건물 레벨, 다음 건물 값(수업료 몇 시간치)을 찍어요. qbot.py를 그대로 돌리고 학기 줄에 값만 더해요(2026-11-18 조사).
# 쓰는 법: python3 wrap.py && python3 gradprobe.py
import asyncio, json, sys
sys.path.insert(0,'.')
import qbot
a="years.push(Object.assign({ tier: S.tier,"
assert a in qbot.JS
qbot.JS=qbot.JS.replace(a,"years.push(Object.assign({ rep: F.rep ? F.rep() : -1, need: F.townRep(4), cap: F.facCap(), f: Object.assign({}, S.f), teaLv: Object.keys(F.TEA).map(k=>S.t[k]||0).join(','), nextFac: F.facKeys().map(k=>F.facCost(k)/F.rate()/3600).filter(isFinite).map(x=>+x.toFixed(2)).join(','), tier: S.tier,")
r=asyncio.run(qbot.run(5))
for y in r['years']:
    if y['tier']>=4:
        print(y['tier'],y['tg']+1,y['sem']+1,y['kind'],'rate %.3g'%y['rate'],'rep',y['rep'],'need',y['need'],'cap',y['cap'],'h',y['h'],'con',y['con'],'buys',y['buys'])
        print('    f',list(y['f'].values()),'tea',y['teaLv'],'| 다음 건물 값(시간)',y['nextFac'])
