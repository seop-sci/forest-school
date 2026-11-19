# 퀘스트를 따라 하는 자동 플레이: 새 학교에서 박사 학위까지 메인 퀘스트를 따라가며 퀘스트마다, 해마다 드는 시간을 재요.
# 실제 시간을 흉내 내지 않아요(bal500.py와 같은 셈). 사람처럼 살 수 있는 것 가운데 가장 싼 것부터 사면서
#   도토리 시간 = 그것을 살 때 '값 / 그때 수업료'(수업료만으로 모으는 데 걸리는 시간)
#   공사 시간   = 그 공사가 끝날 때까지 남은 시간(단축권과 광고는 쓰지 않아요)
#   기다림      = 게임이 정한 기다림(책 15분 같은 것)과 하루 횟수 때문에 드는 날 수(대결 판 수 같은 것, 아래 WAITS와 PERDAY는 어림)
# 을 퀘스트마다 더해요. 줍기, 미션, 광고, 자리 비운 보상은 넣지 않았어요(접속 방식별 날 수는 dev/balday.py가 이 결과로 셈해요).
# 봇이 직접 할 수 없는 퀘스트(공부, 대결, 꾸미기 등)는 기다림만 더하고 한 것으로 쳐요.
#
# 쓰는 법: python3 wrap.py && python3 qbot.py [옵션]
#   (옵션 없음)          퀘스트마다 한 줄, 해마다 한 줄을 찍어요
#   --json 파일          결과를 JSON으로 저장해요(dev/balday.py와 문서 표가 읽어요)
#   --check [시간]       검사만 해요: 도토리 시간이 [시간](기본 4, 로드맵 3절 '퀘스트 하나는 그 시점 수업료로 몇 시간 안에'의 제안값)을 넘는 퀘스트와
#                        Infinity, NaN, 10^15을 넘는 재화가 나온 곳을 찍고, 하나라도 있으면 끝 코드 1
#   --until 학교급       그 학교급(0 유치원 ~ 5 대학원)을 마치면 멈춰요(기본 5)
import asyncio, json, sys
from playwright.async_api import async_playwright
from testlib import URL

JS = r"""(cfg) => { const F = window.__forest, S = F.S, quests = [], years = [], notes = [], bad = [];
  const clean = () => { F.rt.modalQueue.length = 0; F.rt.modalOpen = null; if (F.rt.st) F.rt.st = null; };
  clean();
  let fake = Date.now(); F.rt.fakeNow = fake;
  const snaps = [];   // 졸업식마다 그때의 저장(dev/golden_make.py가 저장 표본으로 써요)
  let T = 0, C = 0, Wt = 0, Wd = 0, En = 0, buys = 0, effT = 0, capT = 0, ye = { e: 0, c: 0 };                       // 도토리 시간(초), 공사 시간(초), 기다림(초), 하루 횟수 때문에 드는 날
  let q0 = { T: 0, C: 0, Wt: 0, Wd: 0, En: 0, buys: 0 }, y0 = { T: 0, C: 0, Wt: 0, Wd: 0, En: 0, buys: 0 }, qid = '', maxCost = 0;
  // 재화 검사: 도토리, 황금 도토리, 수료증, 기금, 정수와 지금 살 것의 값
  const BIG = 1e15, seenBad = {};
  const chk = (name, v, where) => { if (typeof v !== 'number') return; const k = name + (Number.isNaN(v) ? ':NaN' : !isFinite(v) ? ':Infinity' : v > BIG ? ':big' : ''); if (k === name || seenBad[k]) return; seenBad[k] = 1;
    bad.push({ what: name, v: String(v), kind: k.split(':')[1], at: where, tier: S.tier, tg: S.tg, sem: S.sem }); };
  const chkAll = where => { chk('수료증', S.p.dip, where); chk('학교급 수료증', S.tdip, where); chk('기금', S.fund, where); chk('황금 도토리', S.gold, where); chk('숲의 정수', S.ess, where); chk('초당 수업료', F.rate(), where); chk('올해 번 도토리', S.yearEarned, where); };
  const pay = (fn, cost, what) => { if (!(cost > 0) || !isFinite(cost)) { if (cost !== 0 && !seenBad['cost:' + what]) { seenBad['cost:' + what] = 1; bad.push({ what: '값 ' + what, v: String(cost), kind: Number.isNaN(cost) ? 'NaN' : 'Infinity', at: qid, tier: S.tier, tg: S.tg, sem: S.sem }); } return false; }
    const r = F.rate(); if (!(r > 0)) return false; S.budget = cost * 1.000001; const ok = fn(); S.budget = 0; if (!ok) return false; T += cost / r; buys++; effT += F.offlineEff() * cost / r; capT += F.offlineCapH() * cost / r; S.yearEarned += cost; S.earned += cost; maxCost = Math.max(maxCost, cost);
    const now = F.gameNow(); for (const k in (S.bd || {})) C += Math.max(0, S.bd[k].e - now) / 1000;
    fake = Math.max(fake, now) + 86400e3; F.rt.fakeNow = fake; F.conTick(); enroll(); return true; };
  // 학생은 시간이 지나야 모여요: 자리가 늘면 채워 두고, 다 모일 때까지 걸리는 시간은 따로 세요(도토리 시간과 겹쳐 흘러요)
  const enroll = () => { const cap = F.capacity(); if (S.students < cap) { En += (cap - S.students) / F.CFG.enroll; S.students = cap; } };
  const snap = () => ({ T, C, Wt, Wd, En, buys });
  const diff = (a) => ({ h: +((T - a.T) / 3600).toFixed(3), con: +((C - a.C) / 3600).toFixed(2), wait: +((Wt - a.Wt) / 60).toFixed(1), days: +(Wd - a.Wd).toFixed(2), enroll: +((En - (a.En || 0)) / 3600).toFixed(2), buys: buys - a.buys });
  const yearRow = kind => { const dT = T - y0.T;   // 자리 비운 효율과 상한은 그 학기 동안 도토리 시간으로 가중한 평균(새 학교급 처음에는 부엉이 선생님이 없어 30%예요)
    years.push(Object.assign({ tier: S.tier, tg: S.tg, sem: S.sem, kind, rate: +F.rate().toPrecision(3), eff: dT > 0 ? +((effT - ye.e) / dT).toFixed(3) : F.offlineEff(), capH: dT > 0 ? +((capT - ye.c) / dT).toFixed(1) : F.offlineCapH(), owl: S.t.owl, dip: S.p.dip, fund: S.fund, fp: Object.assign({}, S.fp), perk: Object.assign({}, S.p.perk) }, diff(y0))); y0 = snap(); ye = { e: effT, c: capT }; };
  // 봇이 직접 못 하는 퀘스트: [게임이 정한 기다림(초, n마다), 하루에 할 수 있는 횟수(없으면 0)] 어림값
  const WAITS = cfg.waits, PERDAY = cfg.perDay;
  const skip = q => { const n = Math.max(1, (F.qNeed ? F.qNeed(q) : q.n) - Math.max(0, (F.qMeasure(q) || 0) - (S.q.mb || 0)));
    let w = (WAITS[q.t] || 0) * n; if (q.t === 'rdBooks' && S.rd.st === 0) w = (WAITS[q.t] || 0) * (n - 1);   // 첫 책은 바로
    Wt += w; if (PERDAY[q.t]) Wd += Math.max(0, Math.ceil(n / PERDAY[q.t]) - 1);
    S.q.lat = q.id; };
  const spendDips = () => { for (let i = 0; i < 200; i++) { const k = Object.keys(F.PERKS).filter(x => !F.perkMaxed(x)).sort((a, b) => F.perkCost(a) - F.perkCost(b))[0]; if (!k || F.perkCost(k) > S.p.dip) break; if (F.buyPerk(k, document.body) === false) break; clean(); }
    for (let i = 0; i < 200; i++) { const k = Object.keys(F.FPERKS).sort((a, b) => F.fpCost(a) - F.fpCost(b))[0]; if (!k || !(F.fpCost(k) <= S.fund)) break; const f0 = S.fund; F.buyFundPerk(k, document.body); clean(); if (S.fund >= f0) break; } };
  const BUY_T = ['fac', 'facAll', 'fur', 'furAll', 'tea', 'teaAll', 'grade', 'ygrade', 'students', 'rate', 'xt', 'vp'];
  let guard = 0, idle = 0;
  while (guard++ < 400000) {
    for (let i = 0; i < 8 && F.mainReady(); i++) { const q = F.curMain(); F.claimMain(null); clean();
      quests.push(Object.assign({ id: q.id, ch: q.ch, t: q.t, title: q.title, tier: S.tier, tg: S.tg, sem: S.sem, i: quests.length }, diff(q0))); q0 = snap(); }
    clean(); chkAll(qid);
    if (S.tier > cfg.until || (S.tier >= 5 && S.tg >= 6)) break;
    const q = F.curMain(); qid = q ? q.id : 'none';
    if (F.canGraduate()) { yearRow(F.semFirst && F.semFirst() ? '방학식' : '종업식'); F.graduate(); clean(); S.grade = 0; F.checkGrade(); spendDips(); idle = 0; continue; }
    if (F.canPromote()) { yearRow('졸업식'); snaps.push(JSON.stringify(S)); if (S.tier >= cfg.until) break; F.promote(); clean(); S.grade = 0; F.checkGrade(); spendDips(); idle = 0; continue; }
    if (q && q.t === 'xt' && F.xtLv(q.k) < q.n && pay(() => F.xtAct(q.k), F.xtCost(q.k), 'xt ' + q.k)) continue;
    if (q && q.t === 'vp' && pay(() => F.vpAct(), F.vpCost(), 'vp')) continue;
    // 5.1.0 --ta: 조교 자리를 늘 채우고, 조교 퀘스트(파견, 기념비)는 8시간 파견을 바로 끝내 셈해요(조교를 쓰는 사람의 위쪽 끝)
    if (cfg.ta && F.taOpen()) {
      for (let i = 0; i < F.taSeats(); i++) { const x = S.ta.seat[i]; if (!x || !x.b) { const k = F.facKeys().filter(k => S.f[k] >= 1 && !S.ta.seat.some(y => y && y.b === k))[0]; if (k) F.taSit(i, k); } }
      if (q && q.t === 'ta' && F.qMeasure(q) < q.n) { if (q.k === 'mon' && S.ta.mem >= F.TA.mon[S.ta.mon]) F.taMonUp(); else if (q.k !== 'seat') { F.taSend(F.taSeats() - 1, 0, 2); S.ta.out.forEach(o => { o.end = 0; }); F.taClaim(); } clean(); if (F.qMeasure(q) >= q.n || q.k !== 'seat') continue; }
    }
    // 사람처럼 살 수 있는 것 가운데 가장 싼 것부터(건물, 가구, 선생님)
    const c = [];
    for (const k of F.facKeys()) { if (!F.furReady(k)) { const j = F.FUR[k].map((_, j) => j).filter(j => !F.furDone(k, j)).sort((a, b) => F.furCost(k, a) - F.furCost(k, b))[0]; if (j !== undefined) c.push([F.furCost(k, j), () => F.buyFur(k, j, true), 'fur ' + k]); } else if (S.f[k] < F.facCap()) c.push([F.facCost(k), () => F.buyFacility(k), 'fac ' + k]); }
    for (const k of Object.keys(F.TEA)) if (!F.teaMaxed(k)) c.push([F.teaCost(k), () => F.teacherAct(k), 'tea ' + k]);
    c.sort((a, b) => a[0] - b[0]);
    // 퀘스트가 사는 것으로 끝나는 종류면 살 수 있는 가장 싼 것을 하나 사요. 그렇지 않으면 그 퀘스트는 기다림만 더하고 넘어가요
    if (q && !F.mainReady() && !BUY_T.includes(q.t) && !['grads', 'tgrads', 'semH', 'tier'].includes(q.t)) { skip(q); idle = 0; continue; }
    enroll();
    const lim = F.rate() * 3600 * cfg.maxH;   // 그때 수업료로 maxH시간을 넘게 모아야 하는 것은 사지 않아요(사람도 안 사요)
    let ok = false; for (const x of c) { if (x[0] > lim) break; if (pay(x[1], x[0], x[2])) { ok = true; break; } }
    F.checkGrade();
    if (ok) { idle = 0; continue; }
    if (q && !F.mainReady() && idle++ < 3) { skip(q); notes.push('살 것이 없어 넘김 ' + q.id); continue; }
    notes.push('멈춤 ' + JSON.stringify({ q: q && q.id, t: q && q.t, tier: S.tier, tg: S.tg, sem: S.sem, grade: S.grade, cg: F.canGraduate(), cp: F.canPromote(), left: c.length })); break;
  }
  return { snaps, quests, years, notes: notes.slice(0, 20), bad, guard, end: { tier: S.tier, tg: S.tg, sem: S.sem }, total: diff({ T: 0, C: 0, Wt: 0, Wd: 0, En: 0, buys: 0 }), maxCost }; }"""

# 게임이 정한 기다림(초, 한 번마다)과 하루 횟수. 코드의 값을 옮겨 적은 어림이에요(RD.min 15분, 소풍과 텃밭 심기는 보낸 순간 세요, 대결 하루 5판, 책 하루 3권)
WAITS = {'rdBooks': 900, 'trials': 60, 'pz': 180, 'mgBest': 120, 'mgOrders': 60, 'picks': 6, 'frPat': 5, 'frGift': 10, 'deco': 20, 'ach': 10, 'labs': 30, 'btPlays': 60, 'btWins': 90, 'stickers': 10, 'trips': 1800, 'fest': 120, 'sports': 120, 'shows': 120}
PERDAY = {'rdBooks': 3, 'btPlays': 5, 'btWins': 3, 'labs': 1, 'picnics': 1, 'stickers': 5, 'elects': 1 / 7}
TIER = ['유치원', '초등학교', '중학교', '고등학교', '대학교', '대학원']

async def run(until=5, ta=False):
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 390, 'height': 800})
        await ctx.add_init_script("window.__FOREST_TEST = true; localStorage.clear();")
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        await pg.evaluate("const t=document.querySelector('#tut'); if(t && !t.hidden){ window.__forest.S.tut.st='skip'; t.hidden=true; window.__forest.rt.modalOpen=null; }")
        r = await pg.evaluate(JS, {'until': until, 'waits': WAITS, 'perDay': PERDAY, 'maxH': 300, 'ta': ta})
        r['errs'] = errs[:5]; await b.close(); return r

def main():
    a = sys.argv[1:]
    until = int(a[a.index('--until') + 1]) if '--until' in a else 5
    r = asyncio.run(run(until, '--ta' in a))
    r.pop('snaps', None)
    if '--json' in a: json.dump(r, open(a[a.index('--json') + 1], 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    if '--check' in a:
        i = a.index('--check'); lim = float(a[i + 1]) if i + 1 < len(a) and a[i + 1].replace('.', '').isdigit() else 4.0
        slow = [q for q in r['quests'] if q['h'] > lim]
        # 도토리로 세는 값(수업료, 번 도토리, 값)은 학교급 배수 때문에 10^15을 넘는 것이 정상이라 처음 넘은 곳만 알려요. 개수로 세는 재화와 Infinity, NaN은 실패예요
        ACORN = ('초당 수업료', '올해 번 도토리')
        hard = [x for x in r['bad'] if x['kind'] in ('NaN', 'Infinity') or not (x['what'] in ACORN or x['what'].startswith('값 '))]
        soft = [x for x in r['bad'] if x not in hard]
        print(f"퀘스트 {len(r['quests'])}개, 끝난 곳 {TIER[min(5, r['end']['tier'])]} {r['end']['tg'] + 1}학년, 가장 비싼 값 {r['maxCost']:.3g}")
        print(f"도토리 시간이 {lim:g}시간을 넘는 퀘스트 {len(slow)}개")
        for q in sorted(slow, key=lambda q: -q['h'])[:40]: print(f"  {q['id']:<8} {TIER[q['tier']]} {q['tg'] + 1}학년 {'2' if q['sem'] else '1'}학기  {q['h']:7.1f}시간  {q['title']}")
        print(f"Infinity, NaN, 10^15을 넘는 개수 재화 {len(hard)}개")
        for x in hard: print(f"  {x['what']} = {x['v']} ({x['kind']})  {TIER[min(5, x['tier'])]} {x['tg'] + 1}학년, 퀘스트 {x['at']}")
        for x in soft: print(f"  (알림) {x['what']}: 10^15을 처음 넘은 곳은 {TIER[min(5, x['tier'])]} {x['tg'] + 1}학년, 퀘스트 {x['at']}")
        if r['notes']: print('메모', r['notes'][:5])
        okay = not slow and not hard and not r['errs'] and r['end']['tier'] >= min(5, until)
        print('PASS' if okay else 'FAIL'); sys.exit(0 if okay else 1)
    for q in r['quests']: print('%-8s %s %d학년  도토리 %7.2f시간  공사 %6.2f시간  기다림 %5.1f분 %+.0f일  구매 %3d  %s' % (q['id'], TIER[q['tier']], q['tg'] + 1, q['h'], q['con'], q['wait'], q['days'], q['buys'], q['title']))
    for y in r['years']: print('== %s %d학년 %s학기 %s: 도토리 %.1f시간, 공사 %.1f시간, 기다림 %.0f분 +%.0f일, 구매 %d, 자리 비운 효율 %d%% 상한 %d시간' % (TIER[y['tier']], y['tg'] + 1, '2' if y['sem'] else '1', y['kind'], y['h'], y['con'], y['wait'], y['days'], y['buys'], round(y['eff'] * 100), y['capH']))
    print('합계', r['total'], '끝', r['end'], '메모', r['notes'][:6], '재화 이상', r['bad'][:6], '오류', r['errs'])
if __name__ == '__main__': main()
