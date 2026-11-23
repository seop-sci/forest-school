# 코드 점검 지적 검증

모델 claude-opus-5-5.

## 1. [시간과 날짜 경계] 4. 토스 판에서 화면을 다시 볼 때마다 서버 시간을 다시 받으며 자리 비운 보상이 겹칠 수 있음

판정: 모름

근거:
- 41-hotfix-start.js:224: 화면이 다시 보이면 `tossClock()`을 불러요. `AIT.serverTime()`은 Promise라서 `setServerTime`은 비동기로, 한 박자 늦게 실행돼요.
- 05-calc-clock.js:103: `was`는 `SVR.ok && !rt.awayWait && !rt.paused && !document.hidden`일 때만 계산돼요. 숨김/보임 처리 쪽이 `rt.awayWait`(awayStart)나 `rt.paused`를 세워 두면 `was = 0`이 되어 109줄 보상을 건너뛰어요. 겹침을 막으려고 둔 가드예요.
- 05:129: `gameNow`는 `SVR.base + (perfNow() - SVR.perf)`로 계산돼요. `performance.now`가 멈추는 기기에서는 숨김 처리 쪽도 `gameNow`로 시간을 재면 흐른 시간이 거의 0이라 보상이 없어요. 이때는 109줄만 보상하게 되고, 108줄 주석에 적힌 설계 의도와 같아요.
- 14-teachers-away-ads.js:196-207: `awayHold`는 skip 시간을 멈추고 이어 세기만 하고 보상은 주지 않아요. `awaySettle`은 `rt.awayWait`가 있을 때만 보상해요.
- 두 번 보상이 되려면 보이지 않는 숨김 처리 코드가 두 가지를 모두 해야 해요. 하나는 기기 시계(`Date.now`)로 숨긴 구간을 보상하는 것, 다른 하나는 `rt.awayWait`와 `rt.paused`를 세우지 않는 것이에요. 그 코드가 보이지 않아 확인할 수 없어요.

영향: 없음 (숨김 처리 코드를 봐야 판단할 수 있어요)

고치기: 해당 없음. 확인할 것: 숨김 처리 코드(wire 쪽 visibilitychange)가 보일 때 `rt.paused`나 `rt.awayWait`를 세우는지, 숨긴 시간을 `Date.now`로 재서 `applyAway`를 부르는지 봐 주세요.

## 2. [시간과 날짜 경계] 5. 켠 채 기기 시계를 바꾸면 웹 판 서버 시간 다시 받기가 기기 시계를 따라갈 수 있음

판정: 모름

근거:
- 05-calc-clock.js:121 — 기기 시계와 `perfNow` 경과가 10초 넘게 어긋나면 `svrDrift`가 `SVR.resync()`를 불러요(1분에 한 번).
- 41-hotfix-start.js:222-223 — 보이는 `resync`는 토스 판 것뿐이에요. `AIT.serverTime()`로 서버에 물어보니 이 경로는 안전해요. 웹(Firebase) 판의 `SVR.resync`가 무엇을 하는지는 주어진 코드에 없어요.
- 05:101-105 — `setServerTime`은 받은 값이 숫자이고 0보다 큰지만 봐요. 직전 게임 시계나 `perf` 경과와 비교해 큰 점프를 거르는 가드는 없어요. 그래서 낡은 offset으로 만든 `Date.now() + offset`이 들어오면 그대로 믿어요.
- 05:103, 109 — 켜져 있고 보이는 상태라면 `t - was`가 10초를 넘을 때 `awayApply`로 보상을 줘요. 129줄에서 `S.clk.last = t`가 되어 날짜도 넘어가요.
- 결국 지적이 맞는지는 웹 `resync`가 `.info/serverTimeOffset`의 캐시 값을 쓰는지, 실제 서버 왕복을 하는지에 달려 있어요. 이 부분은 보이지 않아서 짐작할 수밖에 없어요.

영향: 없음 (확인 불가). 웹 `resync`가 캐시 offset을 쓴다면, 기기 시계를 앞으로 돌릴 때 자리 비운 보상이 생기고 날짜가 넘어가요.

고치기: 웹 `SVR.resync` 구현(Firebase 초기화 쪽)을 확인해야 해요. 캐시 offset을 쓴다면 서버 왕복(`ServerValue.TIMESTAMP`를 쓰고 다시 읽기)으로 바꿔요. 또는 109줄에 `document.hidden`이었던 구간만 보상하는 가드를 더해요.

## 3. [행사와 시간 기능] 3. 장터 '깜짝 물건: 간식 뽑기'에서 뽑기가 안 되면 도토리만 생겨요

판정: 틀림

근거:
- `12-sheet.js:414-418`: snDraw가 null을 돌려주는 경우는 세 가지뿐이에요. `!snOpen()`일 때, `rt.paused`일 때, `S.budget < c`일 때. 지적에 나온 "간식함이 가득 참"이나 "다른 창이 열림" 같은 조건은 snDraw 안에 없어요.
- `28-festivals.js:907, 929-930`: 깜짝 물건이 `sn`이 되려면 `snOpen()`이 참이어야 하고, `mkSur()`가 없으면 930줄에서 바로 끝나요. 같은 동기 호출 안이라 940줄에서 `snOpen()`이 거짓으로 바뀔 수 없어요.
- `28-festivals.js:940`과 `12-sheet.js:417`: 먼저 `snCost(false)`만큼 더하고, snDraw가 같은 `snCost(false)`를 다시 계산해서 빼요. 그래서 예산이 모자라 거절되는 일은 없어요. snDraw 안의 `snSync()`(416줄)가 기분을 0으로 비워도, `snBase`(404줄)가 `rate()/snMult()`로 기분 몫을 나눠 없애므로 값은 그대로예요. 다만 rate()에 snMult가 곱해진다는 건 짐작이에요. 404줄 주석 "기분 배수는 빼고"가 그 뜻으로 보여요.
- `12-sheet.js:421-428`: 성공하면 n이 1 이상이라 out이 비지 않아요. 940줄의 `out && out.length` 검사는 방어용일 뿐, 실제로 비는 경로가 있다는 뜻은 아니에요.
- 남는 경로는 `rt.paused` 하나예요. 장터 창(`mkClick`)을 누르는 동안 paused가 참일 수 있는지는 코드가 보이지 않아 모름이에요. 보통 paused는 광고나 일시정지 중이라 장터 단추를 누를 수 없을 것으로 보여요.

영향: 없음

## 4. [퀘스트 막힘] 2. 대학원 마지막 해에 `TIERS[S.tier + 1]`이 없어 졸업 탭과 건물 창이 오류로 멈출 수 있음

판정: 틀림

근거:
- `01-numbers.js:32`: `TIER_OPEN = 6`입니다.
- `05-calc-clock.js:26`: `nextTierOpen = () => S.tier + 1 < TIER_OPEN`입니다. 대학원(tier 5)에서는 `6 < 6`이므로 항상 거짓입니다.
- `05-calc-clock.js:27`: `finalYear = () => nextTierOpen() && ...`입니다. 그래서 대학원에서는 박사 8학기여도 `finalYear()`가 항상 거짓입니다.
- `32-graduation.js:7`, `:10`: `last = finalYear() && !sf`가 대학원에서는 늘 거짓입니다. 그래서 `N.school`을 읽는 분기에 들어가지 않고 11줄 `gradOn()` 분기로 갑니다.
- `12-sheet.js:178`: `finalYear()`가 거짓이면 `TIERS[S.tier + 1].name`을 읽지 않고 종업식 문구로 갑니다. `finalYear()`가 참이 될 수 있는 tier 0~4에서는 `TIERS[1]`~`TIERS[5]`가 모두 있습니다(`01-numbers.js:24-31`).
- `32-graduation.js:79`의 `|| {...}`는 `finalYear`와 상관없이 늘 `N`을 읽는 곳이라 따로 막아 둔 것입니다. 이것이 다른 두 곳이 위험하다는 증거는 아닙니다.

영향: 없음

## 5. [퀘스트 막힘] 4. 학생 부탁(fac)이 올해 최고 레벨을 넘는 목표로 만들어져 칸을 막음

**판정: 맞음** (한 학년 동안 끝낼 수 없는 부탁이 생기는 것까지는 맞아요. "영구히 막힘"은 보이는 코드로는 확인되지 않아요.)

**근거:**
- 33-quests.js:550: `s.n = Math.max(s.n, S.f[s.k] + 1)`. 목표를 지금 레벨+1로 올리는데, facCap()과 견주는 가드가 없어요.
- 33-quests.js:567-575 `fillSubs`와 :561 `nextSubDef`: def를 고른 뒤 바로 makeSub에 넘겨요. 건너뛰거나 미루는 길이 없어요.
- 05-calc-clock.js:156-157 `yearCap`, `facCap`: 유치원 1년째(tier 0, tg 0)의 상한은 16이에요. 상한은 식(tg, sem)이 바뀔 때만 올라요.
- 05-calc-clock.js:159 `facMaxed`, :169 `facCost`: 상한에 닿으면 값이 Infinity라 더 올릴 수 없어요. 그래서 measure(29줄 `S.f[k]`)는 16에 멈춰요.
- 33-quests.js:465 `qDone`: fac은 COUNT_TYPES가 아니라 `v >= n`으로 봐요. 16 ≥ 17은 거짓이라 그 학년이 끝날 때까지 완료가 되지 않아요. 따로 버리는 경로도 이 코드에는 없어요.
- 영구 막힘과 졸업식 때 다시 내는 부분: 식 처리 코드가 보이지 않아 모름이에요. 마지막 학교급에서 학년을 되풀이할 때도 yearCap이 tg로 오르니, 보통은 다음 식에서 풀릴 것으로 보여요.

**영향:** 시설을 상한까지 올린 뒤 받은 학생 부탁이 "Lv.상한+1"을 요구해요. 그 학년(학기) 동안 부탁 칸 하나가 끝낼 수 없는 채로 남아 보상과 새 부탁이 막혀요. 메인 퀘스트는 막히지 않아요.

**고치기:** makeSub를 부르기 전(nextSubDef나 fillSubs)에 `d.t === 'fac' && S.f[d.k] + 1 > facCap()`이면 그 def를 건너뛰고 다음 def나 GEN 부탁으로 넘어가세요. 또는 목표를 `Math.min(..., facCap())`으로 두고, 이미 상한이면 미루세요.

## 6. [퀘스트 막힘] 5. 2학년부터 '○학년 소도시 되기'(ygrade) 진행 막대가 처음부터 꽉 차 보일 수 있음

판정: 틀림

근거:
- 01-numbers.js:62: `termOn()`은 초등학교부터(`S.tier >= 1`), 그리고 `S.gr0 >= 0`일 때 켜져요.
- 01-numbers.js:63: 이때 `townRep(g)`는 `S.gr0 + Math.round(termRep() * TERM_F[g])`를 돌려줘요. 즉 기준선에 gr0가 이미 더해진 절대 평판이에요.
- 32-graduation.js:154: 종업식 때 `S.gr0 = rep()`로 둬요. 그래서 2학년 1학기에 ★200에서 시작했다면 소도시 기준은 200 + round(16 × 0.5) = ★208이에요.
- 33-quests.js:7과 442: 막대의 v는 `rep()`(절대값), need는 `townRep(q.n)`(gr0가 들어간 절대값)이에요. 같은 기준끼리 견주니 처음에는 '★200/208'로 보이고 꽉 차지 않아요.
- 33-quests.js:484~485: base(S.q.mb)도 startMain 때의 `rep()`라서 막대가 0에서 시작해요.
- 33-quests.js:463: 완료는 `S.grade >= q.n`로 판정해요. 등급을 올리는 checkGrade는 보이지 않지만 이름으로 보아 같은 townRep 기준일 것으로 짐작돼요(모름).

영향: 없음

## 7. [클라우드 저장과 서버 규칙] 3. 주 번호가 -1이면 `ws`가 음수가 되어 랭킹 쓰기가 모두 거절됨

판정: 틀림

근거:
- `16-rank.js:304`: `submitRank`는 `ws`를 만들기 전에 늘 `lgWeek()`를 먼저 부릅니다.
- `30-missions.js:175~177`: `lgWeek`는 `w = weekIdx()`를 구하고, `S.lg.week`가 `w`와 다를 때만 아래로 진행합니다.
- `30-missions.js:178`: `w < S.lg.week`일 때만 그대로 둡니다. `S.lg.week`가 -1이면 `w`(0 이상)가 더 크므로 여기서 멈추지 않습니다.
- `30-missions.js:187`: 그래서 `S.lg = { week: w, ... }`로 바뀌고, -1은 현재 주 번호로 덮어써집니다. `lgWeek`에는 "리그가 열리기 전" 같은 조건도 없습니다.
- `30-missions.js:24~25`: `weekIdx = gameWeek()`는 2026-01-05(월)을 0으로 세는 주 번호입니다. 따라서 `309`줄의 `ws = S.lg.week * 1000000 + lp`는 0 이상이 되어 `ws ≥ 0` 규칙을 통과합니다.
- 지적은 `lgWeek`를 보이지 않는 함수로 보고 짐작했지만, 실제로는 이 파일에 있고 -1을 남기지 않습니다. 규칙의 `week === -1` 허용은 예전 줄이나 초기값을 받아 주는 여유로 보입니다.
- 남은 가능성: 게임 시계가 2026-01-05보다 앞서 `gameWeek()`가 음수를 내는 경우뿐입니다. `gameWeek` 본문은 보이지 않아 이 부분은 모름입니다. 다만 그때는 `week`도 -1이 아닌 다른 음수라서, 지적이 말하는 "-1" 시나리오와는 다릅니다.

영향: 없음

## 8. [클라우드 저장과 서버 규칙] 5. 공개 학교(`look`) 쓰기 간격 60초와 `lookPush` 호출 간격이 어긋날 수 있음

판정: 틀림

근거:
- 37-season.js:334: `RS.look = 600000`. 공개 학교 쓰기 간격을 10분으로 잡아 둡니다.
- 37-season.js:412: 강제(`force`)가 아니면 `Date.now() - S.lk.at < RS.look`일 때 바로 돌아갑니다. 내용이 같을 때(`d === S.lk.h`)도 돌아갑니다.
- 16-rank.js:334: `submitRank`가 11.5초마다 `lookPush()`를 불러도 인자가 없어 강제가 아닙니다. 그래서 위 10분 가드에 걸려 실제 쓰기는 10분에 한 번뿐이고, 규칙의 60초보다 훨씬 깁니다.
- 37-season.js:417: `S.lk.at`은 쓰기가 성공했을 때만 갱신되므로 간격 계산이 틀어지지 않습니다.
- 37-season.js:422: 강제 쓰기는 사용자가 '내 학교 보여 주기'를 켤 때(`lookSet(true)`)뿐입니다. 켰다 끄면 `lookDelNow`가 서버 문서를 먼저 지웁니다. 그래서 다시 켤 때는 덮어쓰기가 아니라 새로 쓰기가 됩니다. 다만 규칙이 지운 뒤 새로 쓰기를 어떻게 다루는지는 규칙 파일이 보이지 않아 짐작입니다.

영향: 없음. 지운 문서가 남아 있는 아주 드문 경우는 예외일 수 있습니다. 끌 때 삭제에 실패했는데 60초 안에 다시 켜면 강제 쓰기가 거절되어 `noLook`이 켜질 수 있으나, 지적한 재현 길(11.5초 간격 호출)과는 다른 길입니다.

## 9. [화면과 이벤트] 2. closeModal을 빨리 두 번 부르면 then(보상 받기)이 두 번 실행됨

**판정: 맞음**

근거:
- **34-ui-core-loop.js:18-20**: `open` 클래스와 `rt.modalOpen`만 정리합니다. 이미 닫히는 중인지 확인하는 줄이 없습니다.
- **34-ui-core-loop.js:21**: 부를 때마다 무조건 `setTimeout(...then()..., 180)`을 예약합니다. 그래서 두 번 부르면 `then`이 두 번 돕니다. 180ms 동안 `el.hidden`은 아직 false라서 단추가 화면에 남아 있습니다.
- **35-bind.js:49**: `#srGet` 처리기는 `closeModal($('#mSportsEnd'), () => claimSports(1))`만 부릅니다. `disabled`나 표식 같은 막음이 없습니다.
- **27-reward-scenes.js:248-256**: `claimSports`는 받았다는 표시를 확인하지도 지우지도 않습니다. `rt.sportsWin`은 그대로 남고, 부를 때마다 `S.budget += v`, `acGain('pe',15)`, `save()`를 합니다. 따라서 두 번째 호출도 상품을 그대로 한 번 더 줍니다.
- **34-ui-core-loop.js:14-15**: `openModal`은 `.cta`나 첫 단추에 포커스를 줍니다. 그래서 키보드 Enter나 Space를 빠르게 두 번 누르면, CSS `pointer-events`와 상관없이 두 번째 click이 납니다. 손가락 터치 길은 `.overlay:not(.open)`에 pointer-events: none이 있는지 보이지 않아 모릅니다. 키보드 길만으로도 재현됩니다.
- **같은 문제가 있는 곳**: `#exitYes`(924)는 `closeSchool`이 두 번 돌아 저장을 한 번 더 할 뿐이라 해는 작습니다. `#decoPickShop`(741)은 탭 이동이 두 번 될 뿐입니다.

영향: 운동회나 학교 행사 결과 창에서 받기를 빠르게 두 번 누르면(특히 Enter 연타) 상품 도토리와 체육 XP를 두 배로 받습니다.

고치기: `closeModal` 처음에 `if (el._closing) return; el._closing = true;`를 두고, 타이머 안에서 `el._closing = false;`로 지웁니다. 덧붙여 `claimSports` 쪽에도 한 번만 받게 하는 표식(예: `rt.sportsWin = null`로 비우기)을 두면 더 안전합니다.

## 10. [화면과 이벤트] 4. 퍼즐 화면에서 건물 창이 열린 채 뒤로 가기를 누르면 끝없이 서로 부름

**판정: 모름**
서로 부르는 고리는 코드에 확실히 있어요. 다만 그 상태(퍼즐이 열린 채 건물 창도 열림)가 실제로 생기는지는 보이지 않는 함수에 달려 있어요.

**근거**
- 35-bind.js:931: `rt.sheetKey`가 있으면 Escape keydown을 `document`에 바로(동기로) 보내요. `rt.adOpen`이면 948줄에서 끝나서 안전하지만, sheetKey일 때는 막는 가드가 없어요.
- 35-bind.js:949: `pzUI.open && !rt.modalOpen`이면 다시 `FOREST_BACK()`을 불러요. sheetKey를 보는 조건이 없어서 931줄로 되돌아가요. 그래서 964줄 `closeSheet()`에는 닿지 않아요.
- 12-sheet.js:2-5: `openSheet`는 꾸미기, 일시 정지, 행사만 막고 퍼즐(`pzUI.open`)은 막지 않아요.
- 35-bind.js:724: `closeSheet()` 다음에 `setTab`을 따로 불러요. 이걸 보면 `setTab`이 시트를 닫지 않을 수도 있어요. 하지만 `setTab`, 퍼즐 열기, `missionGo`는 보이지 않아서 이 상태가 실제로 생기는지는 모름이에요.
- 덧붙임: `dispatchEvent` 안에서 난 예외는 부른 쪽으로 전달되지 않고 보고만 돼요. 그래서 스택이 넘치면 오류 하나만 남고 끝까지 풀려요. 앱이 멈추거나 끝없이 도는 일은 아니에요.

**영향** (그 상태가 생긴다면)
뒤로 가기를 눌러도 건물 창과 퍼즐이 모두 닫히지 않고, 누를 때마다 콘솔에 RangeError가 남아요.

**고치기**
- 949줄 조건에 `&& !rt.sheetKey`를 더해요.
- 또는 931줄을 `if (rt.sheetKey && !rt.modalOpen && !rt.adOpen) { closeSheet(); return; }`처럼 먼저 따로 처리해요.

## 11. [학생과 지도와 그 밖] 5. 비 오는 날 아닌 읽기 시간이 저장 뒤 15분으로 돌아감 (짐작)

**판정:** 틀림

**근거:**
- `37-season.js:239` 의 `rdMinNow = () => wxIs('rain') ? 10 : RD.min` 은 10이나 15만 돌려줘요. 연구나 선생님 효과는 들어가지 않아요.
- `21-counsel-elect-lab.js:591` 의 `rdStart` 와 `:616` 의 `rdSettle` 예약 이어 읽기에서 `S.rd.m` 은 `rdMinNow()` 로만 정해져요. 그래서 저장되는 값은 10 아니면 15예요.
- `21-counsel-elect-lab.js:684` 는 `R.m === 10 ? 10 : 0` 이라서 15가 0이 돼요.
- `21-counsel-elect-lab.js:576` 의 `rdEnd` 는 `(S.rd.m || RD.min)` 이라서 0이면 15분으로 계산해요. 저장 전과 끝나는 시각이 같아요.
- `21-counsel-elect-lab.js:608` 의 `rdSettle` 도 끝낼 때 `S.rd.m = 0` 을 넣어요. 0이 "기본 15분"이라는 같은 약속을 따르는 거예요.

지적한 "12분" 같은 값은 현재 코드에서 생기지 않아요. 앞으로 `rdMinNow` 가 다른 값을 돌려주도록 바뀔 때만 생기는 잠재적인 문제예요.

**영향:** 없음

**고치기:** 필요 없어요. 다만 `rdMinNow` 를 늘릴 계획이 있다면 684줄을 `Number.isFinite(R.m) && R.m > 0 && R.m <= RD.min ? R.m : 0` 처럼 범위로 받아 두면 안전해요.

## 12. [학생과 지도와 그 밖] 3. 버스 돌아오기 장면을 건너뛰면 S.trip.kids가 줄지 않을 수 있음

판정: 모름

근거:
- 27-reward-scenes.js:76: `kidsAway()`일 때 `rt.busHold = 0` 후 바로 `then()`을 부르고, `S.trip.kids`는 건드리지 않아요.
- 27-reward-scenes.js:78: 움직임 줄이기(`rt.reduced`)이거나 `animate`가 없을 때도 같은 빠른 길이고, 역시 `S.trip.kids`를 건드리지 않아요.
- 27-reward-scenes.js:130-138: 'back' 모드에서 `S.trip.kids`를 줄이는 곳은 애니메이션 안의 `off()`뿐이에요(133줄 `Math.max(0, S.trip.kids - 1)`, 135줄 `syncKids(true)`).
- 09-students.js:218: `syncKids`는 지도 학생 수에서 `S.trip.kids - rt.busHold`를 빼요. 그래서 값이 남으면 지도 학생이 그만큼 적게 보여요.
- 75줄 주석("바로 보내고 맞아요")을 보면 빠른 길도 같은 결과를 내려는 뜻이에요. 다만 그 정리를 `then`(부르는 쪽, 체험학습 파일)이 하는지는 코드가 보이지 않아요.
- 수업료가 `S.trip.kids`를 쓰는지도 보이지 않아요.

영향: 없음. 확인되지 않았어요. 부르는 쪽 `then`이 `S.trip.kids`를 0으로 맞추지 않는다면, 움직임 줄이기나 밤에 돌아온 학생이 지도에 다시 나타나지 않아요.

고치기: 체험학습 파일에서 'back'으로 부르는 `then`이 `S.trip.kids = 0; syncKids(true)`를 하는지 먼저 확인해요. 안 한다면 76줄과 78줄의 빠른 길에서 `mode === 'back'`일 때 `S.trip.kids = Math.max(0, S.trip.kids - n); syncKids(true);`를 넣어요.


API 부름 12번, 입력 토큰 1,349,855, 출력 토큰 15,663
