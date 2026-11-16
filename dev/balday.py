# 접속 방식별 소요 일수 어림: dev/qbot.py가 잰 학기마다의 '도토리 시간'을, 하루에 수업료 몇 시간치를 버는지로 나눠 날 수로 바꿔요.
# 쓰는 법: python3 wrap.py && python3 qbot.py --json qbot.json && python3 balday.py qbot.json [--md 파일] [--eff-floor 0.5] [--cap-min 12] [--ad-min 30]
#
# 셈(모두 어림이에요. 줍기, 미션, 행사, 탐험 보상은 넣지 않아서 실제보다 길게 나와요):
#   하루에 버는 수업료 시간 = 접속해 있는 시간 + 자리 비운 동안(효율 × min(비운 시간, 상한)) + 광고
#   접속 방식: 1번(하루 한 번 10분), 3번(8시간마다 5분), 자주(깨어 있는 16시간 동안 1시간마다 3분, 밤 8시간)
#   광고 있음: 하루 3편(자리 비운 보상 2배 한 번은 가장 긴 간격에, 보충수업 두 번은 한 번에 --ad-min분치)
#   학기 날 수 = max(도토리 시간 ÷ 하루에 버는 시간, 공사 시간 ÷ 24 ÷ 동시 공사 2, 하루 횟수 때문에 드는 날)
#   자리 비운 효율과 상한은 qbot이 잰 그 학기 평균(새 학교급 첫 학기는 부엉이 선생님과 밤샘 수업이 0에서 시작해요)
# --eff-floor, --cap-min은 '효율 바닥'과 '상한 바닥'을 바꿔 보는 설계 검토용이에요(게임 값은 그대로).
import json, sys
TIER = ['유치원', '초등학교', '중학교', '고등학교', '대학교', '대학원']
PAT = {'1번': dict(on=10 / 60, gaps=[24 - 10 / 60]), '3번': dict(on=15 / 60, gaps=[8 - 5 / 60] * 3), '자주': dict(on=16 * 3 / 60, gaps=[1 - 3 / 60] * 15 + [8])}
def arg(a, k, d):
    return float(a[a.index(k) + 1]) if k in a else d
def day_hours(pat, eff, cap, ads, ad_min):
    P = PAT[pat]; off = [eff * min(g, cap) for g in P['gaps']]
    h = P['on'] + sum(off)
    if ads: h += max(off) + 2 * ad_min / 60   # 자리 비운 보상 2배 한 번 + 보충수업 두 번
    return h
def table(r, eff_floor=0.0, cap_min=0.0, ad_min=30.0, par=2):
    rows = {}
    for y in r['years']:
        t = rows.setdefault(y['tier'], dict(h=0, con=0, gate=0, days={(p, a): 0 for p in PAT for a in (0, 1)}, effH=0))
        eff, cap = max(y['eff'], eff_floor), max(y['capH'], cap_min)
        t['h'] += y['h']; t['con'] += y['con']; t['gate'] += y['days']; t['effH'] += y['eff'] * y['h']
        for p in PAT:
            for a in (0, 1):
                t['days'][(p, a)] += max(y['h'] / day_hours(p, eff, cap, a, ad_min), y['con'] / 24 / par, y['days'])
    return rows
def main():
    a = sys.argv[1:]; r = json.load(open(a[0], encoding='utf-8'))
    ef, cm, am = arg(a, '--eff-floor', 0.0), arg(a, '--cap-min', 0.0), arg(a, '--ad-min', 30.0)
    rows = table(r, ef, cm, am)
    head = '| 학교급 | 도토리 시간 | 공사 시간(차례로 더함) | 하루 횟수 대기 | 평균 효율 | 1번 | 1번+광고 | 3번 | 3번+광고 | 자주 | 자주+광고 |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |'
    out = [head]; tot = {k: 0 for k in rows[0]['days']}
    for t in sorted(rows):
        x = rows[t]; d = x['days']
        for k in tot: tot[k] += d[k]
        out.append(f"| {TIER[t]} | {x['h']:.0f}시간 | {x['con']:.0f}시간 | {x['gate']:.0f}일 | {100 * x['effH'] / max(1e-9, x['h']):.0f}% | " + ' | '.join(f"{d[(p, a)]:.1f}일" for p in PAT for a in (0, 1)) + ' |')
    out.append('| **합계** | | | | | ' + ' | '.join(f"**{tot[(p, a)]:.0f}일**" for p in PAT for a in (0, 1)) + ' |')
    md = '\n'.join(out); print(md)
    if '--md' in a: open(a[a.index('--md') + 1], 'w', encoding='utf-8').write(md + '\n')
main()
