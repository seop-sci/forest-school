  /* ---------- 퀘스트 ---------- */
  /* ---------- 퀘스트 종류 표 ----------
     종류(t)마다 measure(지금 값), goal(목표 글), go(바로 가기)를 한곳에 둬요. qMeasure, qGoal, goTo가 이 표를 읽어요.
     measure가 없는 종류는 S.st의 같은 이름 칸으로 재요(picks, ups, trains, claims, grads, perks, fperks, trips, sports, trials, shows, elects, elMid, pz).
     새 종류를 더하면 dev/driftcheck.py가 goal과 go, 그리고 measure나 S.st 칸이 있는지 봐요 */
  const qtGoalGrade = q => `${CFG.grades[q.n].title} 되기`;   // grade, ygrade
  const qtMeasureGrade = q => rep();   // grade, ygrade
  const qtGoGrade = q => goRep('지금 평판을 올리기 좋은 곳이에요');   // grade, ygrade
  // 아직 대도시가 아니면 평판 올릴 곳으로, 대도시가 되어 열 수 있으면 졸업 탭으로
  const qtGoGrads = q => canGraduate() || S.grade >= GRAD_MIN ? goGrad() : goRep(`대도시가 되어야 ${semFirst() ? '방학식' : '종업식'}을 열 수 있어요. 지금 평판을 올리기 좋은 곳이에요`);   // grads, tgrads, semH
  const qtGoFperks = q => goGrad('fund');   // fperks, fpUp
  const qtGoTrips = q => openTrip();   // trips, souv, tripat
  const qtGoSports = q => openFest();   // sports, fest
  const qtGoClub = q => setTab('club');   // 대항전. club, shows, clubSum, star, clubShown, clubMat, cgPrac, cgShow
  const qtGoAcMax = q => setTab('mini');   // 공부 탭. acMax, acBook, acSum
  const qtGoElects = q => openElect();   // elects, elMid
  const qtGoBtPlays = q => { setTab('mini'); return toast('공부 탭의 숲속 대결을 눌러요'); };   // btPlays, btLg, btWins, btMid
  const qtGoBxSeen = q => { if (bxOpen()) { if (S.bx.sp.length) { setTab('school'); return toast('지도에서 흔들리는 풀숲이나 물가를 눌러 봐요'); } return toast(`지금은 숨은 생물이 없어요. ${hm(Math.max(60, Math.ceil((S.bx.next - gameNow()) / 1000)))} 뒤에 새 생물이 숨어요`); } return toast('생물 탐사는 초등학교부터 열려요'); };   // bxSeen, bxKinds
  const qtGoGdHarvest = q => { if (gdOpen()) return openGd(); return goFac('cafeteria', '급식실을 지으면 텃밭을 가꿀 수 있어요'); };   // gdHarvest, gdPlant, gdCook
  const qtGoSnDraw = q => { if (snOpen()) return openSn(); return goFac('store', '매점을 지으면 간식 뽑기를 할 수 있어요'); };   // snDraw, snDex
  const qtGoTr2Go = q => openTr2();   // tr2Go, tr2Back
  const qtGoCsTalk = q => { if (hallOpen() && csOpen()) return openCounsel(); return xtHere('cou') ? goTeacher('cou') : toast('상담실은 고등학교부터 열려요'); };   // csTalk, csPick
  const qtGoNsOn = q => { if (nsOpen()) return openNs(); return goFac('dorm', '기숙사를 지으면 야간 자율학습을 켤 수 있어요'); };   // nsOn, nsGot, nsFinished
  const qtGoVdGive = q => { setTab('school'); if (vdOpen()) return openVd(); return toast('마을 기부는 초등학교부터 열려요'); };   // vdGive, vdLv
  const qtGoPz = q => { setTab('mini'); return toast('숲속 퍼즐의 시작하기를 눌러요'); };   // pz, pzBest
  const qtGoMgBest = q => { setTab('mini'); return toast('숲속 합치기의 시작하기를 눌러요'); };   // mgBest, mgOrders, mgDex
  const QT = {
    fac: {
      measure: q => S.f[q.k],
      goal: q => q.n === 1 ? `${FAC[q.k].name} 짓기` : `${FAC[q.k].name} Lv.${q.n} 만들기`,
      go: q => goFac(q.k)
    },
    fur: {
      measure: q => S.fu[q.k][q.i],
      goal: q => q.n === 1 ? `${FUR[q.k][q.i].name} 고치기` : `${FUR[q.k][q.i].name} Lv.${q.n}`,
      go: q => goFur(q.k, q.i)
    },
    furAll: {
      measure: q => Math.min(...S.fu[q.k]),
      goal: q => `${FAC[q.k].name} 가구 모두 Lv.${q.n}`,
      go: q => goFur(q.k, -1)
    },
    facAll: {
      measure: q => Math.min(...(q.ks || CAMPUS8).map(k => S.f[k] || 0)),   // 대학원: 캠퍼스 건물 여덟 채 가운데 가장 낮은 레벨. ks가 있으면 그 건물만
      goal: q => q.ks ? q.title : `캠퍼스 건물 모두 Lv.${q.n}`,
      go: q => { const k = facAllNext(q.n, q.ks) || (q.ks || CAMPUS8).filter(x => (S.f[x] || 0) < q.n)[0]; return k ? goFac(k) : setTab('school'); }
    },
    tea: {
      measure: q => S.t[q.k],
      goal: q => q.n === 1 ? `${TEA[q.k].name} 모셔 오기` : `${TEA[q.k].name} Lv.${q.n}`,
      go: q => goTeacher(q.k)
    },
    teaAll: {
      measure: q => Math.min(S.t.squirrel, S.t.owl, S.t.bear),
      goal: q => `선생님 모두 Lv.${q.n}`,
      go: q => { const k = lowestTeacher(q.n); return k ? goTeacher(k) : setTab('teachers'); }
    },
    students: {
      measure: q => Math.floor(S.students + 1e-6),
      goal: q => `학생 ${q.n}명 모으기`,
      go: q => { if (capacity() < q.n) return goFac('classroom', '교실을 넓혀야 학생이 더 들어올 수 있어요');
        setTab('school'); return toast('학생들이 오고 있어요. 조금만 기다려 주세요'); }
    },
    grade: {
      measure: qtMeasureGrade,
      goal: qtGoalGrade,
      go: qtGoGrade
    },
    ygrade: {
      measure: qtMeasureGrade,
      goal: qtGoalGrade,
      go: qtGoGrade
    },
    rate: {
      measure: q => rate(),
      goal: q => `초당 도토리 ${fmt(q.n)}개 벌기`,
      go: q => { const b = bestPick('rate'); return b.f ? goFac(b.f, '지금 수업료를 올리기 좋은 곳이에요') : goTeacher(b.t, profText('다람쥐 선생님이 수업료를 올려 줘요')); }
    },
    picks: {
      goal: q => `떨어진 도토리 ${q.n}개 줍기`,
      go: q => { if (S.f.playground < 1) return goFac('playground', `${eul(FAC.playground.name)} 먼저 지어야 해요`);
        setTab('school'); return toast(`참나무를 누르면 도토리가 떨어져요\n떨어진 도토리를 눌러서 주워요`); }
    },
    zones: {
      measure: q => ZONE_KEYS.filter(z => z !== 'lab' && S.zv && S.zv[z]).length,   // 연구 구역은 세지 않아요(대학교 퀘스트 그대로). 들어가 본 구역 수
      goal: q => `구역 ${q.n}곳 둘러보기`,
      go: q => { setTab('school'); const z = ZONE_KEYS.find(z => zoneOpen(z) && !(S.zv && S.zv[z])); if (zoneKey()) setZone(''); return toast(z ? `캠퍼스 지도에서 ${ZONE_GEO[ZONE_KEYS.indexOf(z)].zname} 이름표를 눌러 봐요` : '구역을 모두 둘러봤어요'); }
    },
    dept: {
      measure: q => deptPicks().length,   // 다니는 단과대학 수
      goal: q => q.n > 1 ? `복수전공 ${q.n - 1}개 하기` : '주전공 고르기',
      go: q => { if (deptOpen()) return openDept(); return goFac('union', '학생회관을 지으면 학과 사무실이 열려요'); }
    },
    trials: {
      goal: q => q.n === 1 ? '매나 뱀 쫓아내기' : `매나 뱀 ${q.n}번 쫓아내기`,
      go: q => { setTab('school'); if (!rt.trial) rt.trialT = Math.min(rt.trialT === undefined ? 2 : rt.trialT, 2);
        return toast('곧 매나 뱀이 나타나요. 나타나면 여러 번 눌러서 쫓아내요'); }
    },
    ups: {
      goal: q => `시설 ${q.n}번 고치기`,
      go: q => goFac(bestPick('ups').f, '지금 가장 싸게 고칠 수 있는 시설이에요')
    },
    trains: {
      goal: q => `선생님 연수 ${q.n}번 보내기`,
      go: q => {
        const ks = Object.keys(TEA).filter(k => S.t[k] >= 1 && !teaMaxed(k)).sort((a, b) => teaCost(a) - teaCost(b));
        return ks[0] ? goTeacher(ks[0], '지금 가장 싸게 연수를 보낼 수 있는 선생님이에요') : setTab('teachers');
      }
    },
    claims: {
      goal: q => `자리 비운 보상 ${q.n}번 받기`,
      go: q => { setTab('school'); return toast('오른쪽 위 X로 학교 문을 닫고 30초 뒤에 다시 열어 보세요'); }
    },
    earned: {
      measure: q => S.earned,
      goal: q => `도토리 ${fmt(q.n)}개 모으기`,
      go: q => { setTab('school'); return toast(`수업료와 ${FAC.playground.name} 도토리가 쌓이면 채워져요`); }
    },
    grads: {
      goal: q => q.n === 1 ? '종업식 열기' : `종업식과 졸업식 ${q.n}번 열기`,
      go: qtGoGrads
    },
    perks: {
      goal: q => `명예 교장실 ${q.n}번 고치기`,
      go: q => goGrad('perks')
    },
    tier: {
      measure: q => S.tier,
      goal: q => q.n >= GRAD_TIER ? '대학교 학위수여식 열기' : `${TIERS[q.n - 1].name} 졸업하기`,
      go: q => canPromote() || S.grade >= GRAD_MIN ? goGrad('tier') : goRep('대도시가 되어야 졸업식을 열 수 있어요. 지금 평판을 올리기 좋은 곳이에요')
    },
    tgrads: {
      measure: q => S.tg,
      goal: q => gradOn() ? `${gradSemTxt(q.n, 1)} 세미나 열기` : `${tierInfo().name}에서 종업식 ${q.n}번 열기`,
      go: qtGoGrads
    },
    semH: {
      measure: q => S.tg + (S.sem ? 1 : 0),   // 그 학년 1학기 방학식을 열었는지
      goal: q => gradOn() ? `${gradSemTxt(q.n, 0)} 세미나 열기` : `${q.n}${tierInfo().unit} 1학기 방학식 열기`,
      go: qtGoGrads
    },
    fperks: {
      goal: q => `장학재단 ${q.n}번 고치기`,
      go: qtGoFperks
    },
    trips: {
      goal: q => q.n === 1 ? '현장체험학습 다녀오기' : `현장체험학습 ${q.n}번 다녀오기`,
      go: qtGoTrips
    },
    souv: {
      measure: q => S.trip.souv.length,
      goal: q => `기념품 ${q.n}종 모으기`,
      go: qtGoTrips
    },
    sports: {
      goal: q => q.n === 1 ? `${FEST.sports.name} 열기` : `${FEST.sports.name} ${q.n}번 열기`,   // 중학교부터 체육대회
      go: qtGoSports
    },
    fest: {
      measure: q => (S.fest.n[q.k] || 0) + ((S.fest.sub && S.fest.sub[q.k]) || 0),
      goal: q => `${FEST[q.k].name} 열기`,
      go: qtGoSports
    },
    tripat: {
      measure: q => (S.trip.been[q.k] || 0) + (S.trip.cur === q.k ? 1 : 0),   // 보내면 바로 완료
      goal: q => `${TRIP[q.k].name} 체험학습 보내기`,
      go: qtGoTrips
    },
    club: {
      // 동아리 퀘스트
      measure: q => rosterOn() ? Math.min(ROSTER_N, S.roster.list.filter(s => s.c >= 0).length) : 0,
      goal: q => `동아리 ${q.n}자리 채우기`,
      go: qtGoClub
    },
    shows: {
      goal: q => q.n === 1 ? '동아리 발표회 열기' : `동아리 발표회 ${q.n}번 열기`,
      go: qtGoClub
    },
    elects: {
      goal: q => q.n === 1 ? '반장 뽑기' : `반장 ${q.n}번 뽑기`,
      go: qtGoElects
    },
    elMid: {
      goal: q => '중학교에서 반장 뽑기',
      go: qtGoElects
    },
    clubSum: {
      measure: q => clubSum(),
      goal: q => `동아리 보너스 합 ${q.n}% 넘기`,
      go: qtGoClub
    },
    star: {
      measure: q => rosterOn() && S.roster.list.length ? Math.max(...S.roster.list.map(s => Math.max(...s.a.map(star)))) : 0,
      goal: q => `능력치 별 ${q.n}개 학생 만들기`,
      go: qtGoClub
    },
    clubShown: {
      measure: q => S.club.shown.reduce((a, b) => a + b, 0),
      goal: q => `동아리 ${q.n}곳 발표회 열기`,
      go: qtGoClub
    },
    fpUp: {
      measure: q => Math.max(0, S.st.fperks - (S.tfp || 0)),   // 이 학교급에 와서 장학재단을 고친 횟수(퀘스트 전에 고쳤어도 쳐요)
      goal: q => `장학재단 ${q.n}번 고치기`,
      go: qtGoFperks
    },
    mgBest: {
      measure: q => Math.max(0, ...Object.values(S.mg.best)),   // 숲속 합치기에서 만든 가장 높은 단계
      goal: q => `숲속 합치기 ${q.n}단계 만들기`,
      go: qtGoMgBest
    },
    mgOrders: {
      measure: q => S.mg.st.orders,
      goal: q => `합치기 주문 ${q.n}개 채우기`,
      go: qtGoMgBest
    },
    pz: {
      goal: q => q.n === 1 ? '숲속 퍼즐 한 판 끝내기' : `숲속 퍼즐 ${q.n}판 끝내기`,
      go: qtGoPz
    },
    ta: {
      measure: q => !S.ta ? 0 : q.k === 'seat' ? S.ta.seat.filter(x => x && x.b).length : q.k === 'trip' ? S.ta.n : S.ta.mon,   // 조교 자리, 파견 횟수, 기념비 단계
      goal: q => q.title || '',
      // 보강 퀘스트
      go: q => { if (!rtOpen()) return toast('연구 구역 연구소를 지으면 열려요'); rt.rxTab = 'ta'; return openRx(); }
    },
    pp: {
      measure: q => !S.pp ? 0 : q.k === 'n' ? S.pp.n : q.k === 'cb' ? Math.max(S.pp.cb, S.pp.cf) : q.k === 'deep' ? rtLv(q.b) : S.pp.sem,   // 논문 편수, 가장 높은 학회 점수, 심화 칸, 세미나 횟수
      goal: q => q.title || '',
      go: q => { if (!rtOpen()) return toast('연구 구역 연구소를 지으면 열려요'); rt.rxTab = q.k === 'deep' ? 'tree' : 'paper'; if (q.k === 'deep') rt.rtSel = q.b; return openRx(); }
    },
    xt: {
      measure: q => xtLv(q.k),   // 영양, 사서 선생님 연수 레벨
      goal: q => `${XT[q.k].name} Lv.${q.n}`,
      go: q => xtHere(q.k) ? goTeacher(q.k) : goFac(XT[q.k].fac, `${eul(FAC[XT[q.k].fac].name)} 지으면 오셔요`)
    },
    vp: {
      measure: q => vpLv(),   // 교감 선생님 연수 레벨
      goal: q => `${VP.name} Lv.${q.n}`,
      go: q => goTeacher('vp')
    },
    deco: {
      measure: q => decoPlacedAll(),   // 지도에 놓은 장식 수
      goal: q => `지도에 장식 ${q.n}개 놓기`,
      go: q => setTab('deco')
    },
    ach: {
      measure: q => ACH.reduce((a, x) => a + achGot(x.id), 0),   // 받은 업적 메달 수
      goal: q => `업적 메달 ${q.n}개 받기`,
      go: q => { setTab('dex'); return setDexSeg('ach'); }
    },
    mgDex: {
      measure: q => mgDexN(),   // 합치기 도감 칸
      goal: q => `합치기 도감 ${q.n}칸 채우기`,
      go: qtGoMgBest
    },
    pzBest: {
      measure: q => S.pz.best,   // 숲속 퍼즐 최고 점수
      goal: q => `숲속 퍼즐 ${fmt(q.n)}점 넘기기`,
      go: qtGoPz
    },
    acMax: {
      measure: q => Math.max(...AC.keys.map(acLv)),   // 공부: 가장 높은 과목 레벨
      goal: q => `과목 하나 Lv.${q.n} 만들기`,   // 공부
      go: qtGoAcMax
    },
    acSum: {
      measure: q => acSum(),   // 학기 숙제: 다섯 과목 레벨 합
      goal: q => `다섯 과목 레벨 합 ${q.n} 만들기`,
      go: qtGoAcMax
    },
    acBook: {
      measure: q => S.ac.st.bk,   // 산 문제집 수
      goal: q => q.n === 1 ? '문제집 한 권 풀기' : `문제집 ${q.n}권 풀기`,
      go: qtGoAcMax
    },
    clubMat: {
      measure: q => clubMembers(4).length,   // 수학부 부원 수
      goal: q => `수학부 부원 ${q.n}명`,
      go: qtGoClub
    },
    rdBooks: {
      measure: q => S.rd.st,   // 다 읽은 책 수
      goal: q => q.n === 1 ? '책 한 권 다 읽기' : `책 ${q.n}권 다 읽기`,
      go: q => rdReady() ? openRead() : goFac('library', `${eul(FAC.library.name)} 먼저 지어야 해요`)
    },
    labs: {
      measure: q => S.lab.st.n,   // 실험 횟수
      goal: q => q.n === 1 ? '과학 실험 한 번 하기' : `과학 실험 ${q.n}번 하기`,
      go: q => labReady() ? openLab() : goFac('science', `${eul(FAC.science.name)} 먼저 지어야 해요`)
    },
    picnics: {
      measure: q => S.pc.st.n + (pcActive() ? 1 : 0),   // 소풍 횟수. 보낸 순간부터 한 번으로 쳐요(미리 보낸 소풍이 퀘스트에 안 쳐짐)
      goal: q => q.n === 1 ? '숲속 소풍 보내기' : `숲속 소풍 ${q.n}번 보내기`,
      go: q => pcReady() ? openPicnic() : goFac('playground', `${eul(FAC.playground.name)} 먼저 지어야 해요`)
    },
    stickers: {
      measure: q => S.sk.st.all,   // 받은 칭찬 스티커 수
      goal: q => `칭찬 스티커 ${q.n}장 모으기`,
      go: q => openSticker()
    },
    frPat: {
      measure: q => S.frc ? S.frc.pat : 0,   // 단짝 쓰다듬기, 선물, 앨범 열기(지금까지 한 횟수)
      goal: q => '단짝 친구 쓰다듬기',
      go: q => { setTab('school'); return toast('지도에서 걷는 학생을 눌러 보세요'); }
    },
    frGift: {
      measure: q => S.frc ? S.frc.gift : 0,
      goal: q => '단짝 친구에게 선물하기',
      go: q => { const sp = frList()[0]; rt.dexPick = sp || ''; setTab('dex'); setDexSeg('dex'); renderDex(); return toast('학생을 누르고 선물을 줘요'); }
    },
    albOpen: {
      measure: q => S.frc ? S.frc.alb : 0,
      goal: q => '졸업 앨범 열어 보기',
      go: q => openAlbum()
    },
    btPlays: {
      measure: q => S.bt.st.w + S.bt.st.l,   // 숲속 대결 판 수
      goal: q => `숲속 대결 ${q.n}판 하기`,
      go: qtGoBtPlays
    },
    psGot: {
      measure: q => psOpen() ? (S.ps.tot || 0) : q.n,   // 숲속 패스에서 받은 단계 수(패스가 닫혀 있으면 멈추지 않게 마친 것으로)
      goal: q => `숲속 패스 ${q.n}단계 받기`,
      go: q => { rt.evSeg = 'ps'; return setTab('event'); }
    },
    btLg: {
      measure: q => S.bt.lg,   // 대결 메달 리그
      goal: q => `숲속 대결 ${BT_LG[q.n].n} 리그`,
      go: qtGoBtPlays
    },
    btWins: {
      measure: q => S.bt.st.w,   // 대결에서 이긴 판 수
      goal: q => `숲속 대결 ${q.n}번 이기기`,
      go: qtGoBtPlays
    },
    btMid: {
      measure: q => S.bt.st.wm + (S.tier >= 2 && S.bt.day === gameToday() && S.bt.n > 0 ? 1 : 0),   // 명부 학생으로 이긴 판. 오늘 중학교부터 한 판이라도 했으면 쳐요
      goal: q => '명부 학생으로 대결하기',
      go: qtGoBtPlays
    },
    vdGive: {
      measure: q => S.vd.n,   // 마을 기부 횟수
      goal: q => '마을에 기부하기',
      go: qtGoVdGive
    },
    snDraw: {
      measure: q => S.sn.n,   // 간식 뽑은 수
      goal: q => '간식 뽑기',
      go: qtGoSnDraw
    },
    snDex: {
      measure: q => snCount(),   // 간식 도감 종류
      goal: q => `간식 도감 ${q.n}종`,
      go: qtGoSnDraw
    },
    gdPlant: {
      measure: q => S.gn.st.plant,   // 텃밭에 심은 수
      goal: q => q.n === 1 ? '텃밭에 작물 심기' : `텃밭에 작물 ${q.n}번 심기`,
      go: qtGoGdHarvest
    },
    gdHarvest: {
      measure: q => S.gn.st.h,   // 텃밭 거둔 수
      goal: q => q.n === 1 ? '텃밭 작물 거두기' : `텃밭 작물 ${q.n}번 거두기`,
      go: qtGoGdHarvest
    },
    bxSeen: {
      measure: q => S.bx.st.n,   // 생물 관찰 수
      goal: q => q.n === 1 ? '생물 관찰하기' : `생물 ${q.n}번 관찰하기`,
      go: qtGoBxSeen
    },
    cgPrac: {
      measure: q => S.cg.st.p,   // 대항전 연습 수
      goal: q => q.n === 1 ? '대항전 연습하기' : `대항전 연습 ${q.n}번`,
      go: qtGoClub
    },
    cgShow: {
      measure: q => S.cg.st.s || 0,   // 대항전 중 발표회 수
      goal: q => '대항전 발표회 열기',
      go: qtGoClub
    },
    bxKinds: {
      measure: q => bxCount(),   // 생물 도감 종류
      goal: q => `생물 도감 ${q.n}종`,
      go: qtGoBxSeen
    },
    gdCook: {
      measure: q => S.gn.st.cook,   // 오늘의 급식 만든 수
      goal: q => q.n === 1 ? '오늘의 급식 만들기' : `오늘의 급식 ${q.n}번 만들기`,
      go: qtGoGdHarvest
    },
    vdLv: {
      measure: q => S.vd.lv,   // 마을 기부 단계
      goal: q => `마을 기부 ${q.n}단계`,
      go: qtGoVdGive
    },
    nsOn: {
      measure: q => S.ns ? S.ns.n : 0,   // 자율학습 준비 횟수(낮 예약 또는 밤 시작)
      goal: q => q.n === 1 ? '오늘 밤 자율학습 준비' : `자율학습 ${q.n}번 준비`,
      go: qtGoNsOn
    },
    nsFinished: {
      measure: q => Math.max(S.ns ? S.ns.fin || 0 : 0, S.st.nsAway || 0),
      goal: q => '자율학습 결과 받기',
      go: qtGoNsOn
    },
    csTalk: {
      measure: q => S.cs ? S.cs.talks : 0,   // 진로 상담 횟수
      goal: q => q.n === 1 ? '첫 진로 상담' : `진로 상담 ${q.n}번`,
      go: qtGoCsTalk
    },
    csPick: {
      measure: q => S.cs ? S.cs.picks : 0,   // 진로를 처음 정한 학생 수
      goal: q => q.n === 1 ? '학생 한 명 진로 정하기' : `학생 ${q.n}명 진로 정하기`,
      go: qtGoCsTalk
    },
    tr2Go: {
      measure: q => S.tr2 ? S.tr2.go : 0,   // 수학여행
      goal: q => '수학여행 떠나기',
      go: qtGoTr2Go
    },
    tr2Back: {
      measure: q => S.tr2 ? S.tr2.back : 0,
      goal: q => '수학여행에서 돌아오기',
      go: qtGoTr2Go
    },
    tr2Deco: {
      measure: q => S.tr2 ? tr2Placed() : 0,
      goal: q => '수학여행 기념품 지도에 놓기',
      go: q => setTab('deco')
    },
    nsGot: {
      measure: q => S.st.nsAway || 0,   // 자율학습을 켠 밤에 자리 비운 보상이 쌓인 횟수
      goal: q => '자율학습한 밤의 도토리 받기',
      go: qtGoNsOn
    }
  };
  function qMeasure(q) {
    const E = QT[q.t];
    return E && E.measure ? E.measure(q) : S.st[q.t] || 0;   // picks, ups, trains, claims, grads, perks, fperks
  }
  const qNeed = q => (q.t === 'grade' || q.t === 'ygrade') ? townRep(q.n) : q.n;
  // 퀘스트 보상: rm이 있으면 지금 수업료 몇 분치
  const qReward = q => {
    const b = q.rm ? Math.max(10, nice(rate() * 60 * q.rm)) : q.r;
    if (q.t !== 'fac' || q.rk || q.ch > EARLY.ch || !FAC[q.k]) return b;
    const c = Math.ceil(softCost(FAC[q.k].cost, q.n - 1 + (FAC[q.k].lvOff || 0), SOFT.fac) * costScale());   // 3안: 그 레벨 공사비의 30%
    return isFinite(c) && c > 0 ? Math.max(b, nice(c * EARLY.back)) : b;
  };
  /* 하루에 한 번이거나 기다리는 시간이 긴 행동(체험학습, 숲속 운동회, 학교 행사)은
     퀘스트가 오기 전이라도 그날(게임 시계) 이미 했으면 퀘스트에 쳐요. 하루를 시작할 때의 횟수를 S.dsn에 적어 두고 그보다 늘어난 만큼을 세요 */
  const TODAY_TYPES = new Set(['trips', 'sports', 'fest']);
  function dsnSync() {
    const t = gameToday();
    if (S.dsn && S.dsn.day === t) return;
    S.dsn = { day: t, trips: S.st.trips || 0, sports: S.st.sports || 0, fest: Object.assign({}, S.fest.n) };
  }
  const qBase = (q, base) => { if (!q || !TODAY_TYPES.has(q.t)) return base; dsnSync(); return Math.min(base, q.t === 'fest' ? (S.dsn.fest[q.k] || 0) : S.dsn[q.t]); };
  function qDone(q, base) {
    if (!q) return false;
    base = qBase(q, base);
    if (q.t === 'grade') return S.best >= q.n;   // 한 번이라도 오른 등급이면 종업식 뒤에도 완료로 쳐요
    if (q.t === 'ygrade') return S.grade >= q.n;   // 올해 동네가 그 단계까지 자랐는지
    const v = qMeasure(q);
    return COUNT_TYPES.has(q.t) ? v - base >= q.n - 1e-6 : v >= q.n - 1e-6;
  }
  function qProg(q, base) {
    base = qBase(q, base);
    const done = qDone(q, base) || (q === curMain() && S.q.lat === q.id), need = qNeed(q), v = qMeasure(q);
    let frac, text;
    if (COUNT_TYPES.has(q.t)) {
      const cur = Math.max(0, Math.min(need, v - base));
      frac = cur / need;
      text = `${fmt(cur)}/${fmt(need)}`;
    } else if (q.t === 'tier') {
      // 졸업식 퀘스트: 마지막 해 전까지는 몇 년째인지, 마지막 해에는 대도시까지 남은 평판으로 막대를 채워요
      const T = tierInfo(), need = townRep(GRAD_MIN), r = Math.min(rep(), need);
      if (canPromote()) { frac = 0.96; text = '준비 끝'; }
      else if (finalYear() && semFirst()) { frac = (T.grads + 0.4 * r / need) / (T.grads + 1); text = '1학기'; }   // 졸업반 1학기
      else if (finalYear()) { frac = (T.grads + r / need) / (T.grads + 1); text = `★${r}/${need}`; }
      else { frac = Math.min(S.tg, T.grads) / (T.grads + 1); text = `${yearNo()}${T.unit}`; }
    } else {
      // 레벨, 학생 수, 평판은 퀘스트를 받은 때부터 얼마나 왔는지로 막대를 채워요
      const from = Math.min(base, need), shown = Math.min(v, need);
      frac = need > from ? (shown - from) / (need - from) : 1;
      if (q.t === 'grade' || q.t === 'ygrade') text = `★${shown}/${need}`;
      else if (q.t === 'rate') text = `${fmtRate(shown)}/${fmt(need)}`;
      else if ((q.t === 'fac' || q.t === 'tea') && need === 1) text = `${shown}/1`;
      else if (q.t === 'students') text = `${shown}/${need}명`;
      else if (q.t === 'tgrads' && semOn() && shown < need) { frac = need > from ? (shown - from + 0.5 * S.sem) / (need - from) : 1; text = semLabel(); }   // 1학기 방학식을 마치면 막대가 반쯤 차요
      else if (q.t === 'semH') text = shown >= need ? '방학' : '1학기';
      else if (q.t === 'grads' || q.t === 'perks' || q.t === 'tgrads' || q.t === 'fperks' || q.t === 'tripat' || q.t === 'nsOn' || q.t === 'nsGot' || q.t === 'nsFinished' || q.t === 'csTalk' || q.t === 'csPick') text = `${shown}/${need}번`;   // 자율학습
      else if (q.t === 'souv') text = `${shown}/${need}종`;
      else if (q.t === 'club') text = `${shown}/${need}자리`;
      else if (q.t === 'clubSum') text = `${shown}/${need}%`;
      else if (q.t === 'star') text = `★${shown}/${need}`;
      else if (q.t === 'clubShown') text = `${shown}/${need}곳`;
      else if (q.t === 'pz') text = `${shown}/${need}판`;   // 보강 퀘스트
      else if (q.t === 'deco' || q.t === 'ach' || q.t === 'mgOrders') text = `${shown}/${need}개`;
      else if (q.t === 'mgDex') text = `${shown}/${need}칸`;
      else if (q.t === 'mgBest') text = `${shown}/${need}단계`;
      else if (q.t === 'pzBest') text = `${fmt(shown)}/${fmt(need)}점`;
      else if (q.t === 'acBook') text = `${shown}/${need}권`;   // 공부
      else if (q.t === 'clubMat') text = `${shown}/${need}명`;
      else if (q.t === 'rdBooks') text = `${shown}/${need}권`;
      else if (q.t === 'labs' || q.t === 'picnics' || q.t === 'frPat' || q.t === 'frGift' || q.t === 'albOpen') text = `${shown}/${need}번`;
      else if (q.t === 'stickers') text = `${shown}/${need}장`;
      else if (q.t === 'vdGive' || q.t === 'snDraw' || q.t === 'gdHarvest' || q.t === 'gdPlant' || q.t === 'gdCook' || q.t === 'bxSeen' || q.t === 'cgPrac' || q.t === 'cgShow') text = `${shown}/${need}번`;
      else if (q.t === 'snDex') text = `${shown}/${need}종`;
      else if (q.t === 'vdLv') text = `${shown}/${need}단계`;
      else if (q.t === 'btPlays' || q.t === 'btMid') text = `${shown}/${need}판`;
      else if (q.t === 'btLg') text = `${BT_LG[Math.min(5, shown)].n}/${BT_LG[need].n}`;
      else text = `Lv.${shown}/${need}`;
    }
    return { done, frac: done ? 1 : Math.max(0, Math.min(1, frac)), text };
  }
  function qGoal(q) {
    const E = QT[q.t];
    return E && E.goal ? E.goal(q) : '';
  }
  function qNo(i) {
    const ch = MAIN[i].ch;
    let j = 0;
    for (let x = 0; x < i; x++) if (MAIN[x].ch === ch) j++;
    return `${ch + 1}-${j + 1}`;
  }
  const curMain = () => MAIN[S.q.m] || null;
  // 한 번 이룬 메인 퀘스트는 종업식으로 학교가 처음으로 돌아가도 완료로 남아요
  const mainReady = () => { const q = curMain(); return !!q && (S.q.lat === q.id || qDone(q, S.q.mb)); };
  const subReady = s => qDone(s, s.b);
  const pickTutorial = () => { const q = curMain(); return !!q && q.t === 'picks' && !mainReady(); };
  const subSlots = () => S.q.m < CH1() ? 2 : 3;
  const kidAvatar = sp => `<svg viewBox="-10 -15.5 20 27" aria-hidden="true">${kidSVG(sp, 0)}</svg>`;
  const hedgehogAvatar = () => `<svg viewBox="-24 -24 48 48" aria-hidden="true">${AV.hedgehog}</svg>`;

  function startMain() { const q = curMain(); S.q.mb = q ? qMeasure(q) : 0; gdFreeGrant(q); }
  // 퀘스트가 생기기 전부터 하던 학교는 이미 이룬 메인 퀘스트를 보상 없이 건너뛰어요
  function fastForwardMain() {
    while (S.q.m < MAIN.length) {
      const q = MAIN[S.q.m];
      const ok = q.t === 'picks' ? S.f.playground >= 1 : (COUNT_TYPES.has(q.t) ? false : qDone(q, 0));
      if (!ok) break;
      S.q.m += 1; S.q.md += 1;
    }
    startMain();
  }
  function makeSub(d) {
    const s = { id: d.id, who: d.who, t: d.t, k: d.k || null, n: d.n, r: 0, b: 0, nw: true, say: '' };
    // 받자마자 끝나 버리는 부탁이 없게 목표를 지금보다 한 단계 위로 맞춰요
    if (s.t === 'fac') s.n = Math.max(s.n, S.f[s.k] + 1);
    if (s.t === 'students' && Math.floor(S.students) >= s.n) s.n = Math.floor(S.students) + 4;
    s.b = qMeasure(s);
    s.r = Math.max(d.r || 0, nice(rate() * (d.gen ? 60 : 30)));
    s.say = d.say(s.n);
    return s;
  }
  function nextSubDef() {
    const active = new Set(S.q.subs.map(s => s.id));
    for (const d of SUBS) {
      if (S.q.done.includes(d.id) || active.has(d.id)) continue;
      return S.q.m >= mainNewIdx(d.after) ? d : null;   // after는 한 단계 퀘스트를 넣기 전 번호예요
    }
    const c = S.q.gen, tpl = GEN[c % GEN.length];
    S.q.gen = c + 1;
    return { id: 'g' + c, who: tpl.who, t: tpl.t, n: tpl.n(Math.floor(c / GEN.length)), say: tpl.say, gen: true };
  }
  function fillSubs() {
    if (S.q.m < SUB_UNLOCK) return 0;
    let added = 0;
    while (S.q.subs.length < subSlots() && added < 3) {
      const d = nextSubDef();
      if (!d) break;
      S.q.subs.push(makeSub(d));
      added++;
    }
    return added;
  }

  function checkQuests(silent) {
    const q = curMain(), key = 'm' + S.q.m, mr = mainReady();
    if (mr && q) S.q.lat = q.id;
    if (mr && !rt.qr[key] && !silent) { sfx('done'); toast(rt.tab === 'school' ? `퀘스트 완료! 받기를 누르면 ${rewardText(q.rk, qReward(q))}${q.rk === 'dip' ? '을' : '를'} 받아요` : `퀘스트 완료! 홈의 퀘스트 칸에서 ${rewardText(q.rk, qReward(q))}${q.rk === 'dip' ? '을' : '를'} 받아요`); }
    rt.qr[key] = mr;
    for (const s of S.q.subs) {
      const r = subReady(s);
      if (r && !rt.qr[s.id] && !silent) { sfx('done'); toast(`${WHO[s.who]}의 부탁을 들어줬어요! 노란 쪽지를 눌러 보상을 받아요`); }
      rt.qr[s.id] = r;
    }
  }
  function claimMain(fromEl) {
    const q = curMain();
    if (!q || !mainReady() || rt.paused) return;
    const rv = qReward(q), no = qNo(S.q.m);
    grant(rv, fromEl, q.rk);
    const items = [q.rk === 'dip' ? { ic: 'dip', t: `수료증 +${fmt(rv)}장` } : { ic: 'acorn', t: `도토리 +${fmt(rv)}` }];
    if (hardQ(q)) items.push(goldOr(GOLD.hard));
    addLeague(LP.quest, true);
    S.q.m += 1; S.q.md += 1;
    startMain();
    const prep = prepTopUp(true);
    if (prep) items.push({ ic: 'acorn', t: `교감 선생님 준비물 +${fmt(prep)}` });
    const chEnd = !curMain() || curMain().ch !== q.ch;
    if (chEnd) { addGold(GOLD.chapter); items.push({ ic: 'gold', t: `황금 도토리 +${GOLD.chapter} (${q.ch + 1}장 끝)` }); }   // 한 장을 마치면 황금 도토리
    if (chEnd && chTier(q.ch) >= 1) { S.tk.m5 += TK_CH; items.push({ ic: 'acorn', t: `5분 단축권 +${TK_CH}장` }); }   // 초등학교부터 장 끝에 5분권
    if (TK_Q.has(q.id)) { S.tk.m5 += TKE.n; items.push({ ic: IMG('ticket_m5') ? `<img src="${IMG('ticket_m5')}" alt="" style="width:22px;height:22px;object-fit:contain">` : '⏱', t: `5분 단축권 +${TKE.n}장` }); }
    { const skIt = skAdd(); if (skIt) items.push(skIt); }   // 칭찬 스티커
    // 보통 퀘스트는 창 없이 알림 한 줄로 받아요. 창은 장 끝과 특별 보상(황금 도토리, 단축권)에만
    const special = chEnd || items.some(it => it.ic === 'gold' || /단축권/.test(it.t));
    { const n2 = curMain(); if (special) showReward({ title: chEnd ? `${q.ch + 1}장을 마쳤어요!` : '퀘스트 완료!', sub: `${no} ${q.title}`, items: items.concat(n2 ? [{ ic: hedgehogAvatar(), t: `다음: ${qNo(S.q.m)} ${n2.title}` }] : []) }); }
    const unlocked = S.q.m === SUB_UNLOCK;
    const added = fillSubs();
    const nx = curMain();
    const got = special ? '' : items.map(it => it.t).join(', ') + '\n';
    if (unlocked && added) toast(got + '학생들이 부탁을 하러 왔어요! 지도 오른쪽 퀘스트 단추를 눌러 보세요');
    else if (S.q.m === CH1()) toast(got + '출석부가 열렸어요!\n칠판 위 달력을 눌러 보세요');
    else if (nx) toast(`${got}다음 퀘스트 ${qNo(S.q.m)} ${nx.title}`);
    else toast(got + '메인 퀘스트를 모두 마쳤어요!');
    if (nx && nx.t === 'picks') rt.dropT = Math.max(rt.dropT, 3.5);
    questChanged();
  }
  function claimSub(id, fromEl) {
    const i = S.q.subs.findIndex(s => s.id === id);
    if (i < 0 || rt.paused) return;
    const s = S.q.subs[i];
    if (!subReady(s)) return;
    grant(s.r, fromEl);
    const hIt = hardQ(s, true) ? goldOr(GOLD.hard) : null;   // 조금 어려운 부탁
    addLeague(LP.quest, true);
    S.q.subs.splice(i, 1);
    if (s.id[0] === 's') S.q.done.push(s.id);
    S.q.subDone += 1;
    delete rt.qr[s.id];
    const added = fillSubs();
    const items = [{ ic: 'acorn', t: `도토리 +${fmt(s.r)}` }, hIt ? { ic: hIt.ic, t: hIt.t + ' (조금 어려운 부탁)' } : null, skAdd()].filter(Boolean);
    // 부탁도 메인 퀘스트처럼 창 없이 알림 한 줄로 받아요. 창은 황금 도토리를 받을 때와 모두 받기에만
    if (rt.batch || items.some(it => it.ic === 'gold')) showReward({ title: `${iga(WHO[s.who])} 고마워해요!`, sub: added ? '새 부탁이 들어왔어요' : '', items });
    else toast(`${iga(WHO[s.who])} 고마워해요!\n${items.map(it => it.t).join(', ')}` + (added ? '\n새 부탁이 들어왔어요' : ''));// 칭찬 스티커
    questChanged();
  }
  function grant(v, fromEl, kind) {
    // 퀘스트 보상은 '도토리 모으기' 부탁과 수료증 계산에는 세지 않아요
    if (kind === 'dip') addDip(v);
    else S.budget += v;
    sfx('quest'); buzz(15);
    flyAcorns(fromEl, v, kind);
    renderHUD();
    if (kind === 'dip') toast(`수료증 +${v}장`);
  }
  function questChanged() {
    rt.qKey = '';
    maybeAskNick();
    renderAffordance();
    save();
  }
  function flyAcorns(fromEl, v, kind) {
    // 도토리는 칠판의 도토리 숫자로, 수료증은 아래 졸업 탭으로 날아가요
    const isDip = kind === 'dip';
    const to = isDip ? $('.tab[data-tab="grad"]') : $('#vBudget');
    const bump = () => { if (!rt.reduced && to.animate) to.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { duration: 320, easing: 'ease-out' }); };
    const src = fromEl && (fromEl.querySelector('.q-act') || fromEl);
    if (!src || rt.reduced || !document.body.animate) { bump(); return; }
    const a = src.getBoundingClientRect(), b = to.getBoundingClientRect();
    if (!a.width) { bump(); return; }
    const n = Math.min(7, 3 + Math.floor(Math.log10(Math.max(10, v))));
    for (let i = 0; i < n; i++) {
      const el = document.createElement('span');
      el.className = 'fly';
      el.innerHTML = isDip ? dipIcon() : acornIcon();
      const sx = a.left + a.width * rand(0.25, 0.75) - 9, sy = a.top + a.height / 2 - 11;
      const ex = isDip ? b.left + b.width / 2 - 9 : b.left + 5, ey = b.top + b.height / 2 - 11;
      el.style.left = sx + 'px'; el.style.top = sy + 'px';
      document.body.appendChild(el);
      const mx = rand(-36, 36), my = rand(-60, -24);
      el.animate([
        { transform: 'translate(0px, 0px) scale(.5)', opacity: 0 },
        { transform: `translate(${mx}px, ${my}px) scale(1.15)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${ex - sx}px, ${ey - sy}px) scale(.7)`, opacity: 0.9 }
      ], { duration: 620 + i * 60, easing: 'cubic-bezier(.45,0,.3,1)' }).onfinish = () => { el.remove(); if (i === n - 1) bump(); };
    }
  }

  /* 칠판 아래 퀘스트 쪽지: 지금 메인 퀘스트, 다 마치면 학생 부탁 */
  /* 5.3.2.2 F-04: 건물 창과 선생님 탭에서는 위쪽 퀘스트 칸의 '받기'를 누르면 창만 닫혔어요. 퀘스트를 마치면 그 화면 아래에 '보상 받기' 띠를 띄워요 */
  function qReadyNow() {
    const mq = curMain();
    if (mq) return mainReady() ? { ref: 'main', tx: `${qNo(S.q.m)} ${mq.title}` } : null;
    const s = S.q.subs.find(subReady); return s ? { ref: s.id, tx: `${WHO[s.who]}의 부탁` } : null;
  }
  function renderQReady() {
    if (!S) return;
    const r = rt.paused ? null : qReadyNow();
    for (const [id, on] of [['#sheetQReady', !!rt.sheetKey], ['#teaQReady', rt.tab === 'teachers' && !rt.sheetKey]]) {
      const el = $(id); if (!el) continue;
      const key = r && on ? r.ref + '|' + r.tx : '';
      if (el.dataset.key === key) continue;
      el.dataset.key = key; el.hidden = !key; if (!key) continue;
      el.innerHTML = `<span class="qr-tx"><small>퀘스트를 마쳤어요</small><b>${esc(r.tx)}</b></span><span class="qr-go">보상 받기</span>`;
      el.setAttribute('aria-label', `${r.tx} 보상 받기`);
    }
  }
  function qReadyTap(el) {
    const r = qReadyNow(); if (!r || rt.paused) return;
    rt.qTap = true;
    if (r.ref === 'main') claimMain(el); else claimSub(r.ref, el);
    renderQReady(); if (rt.sheetKey) renderSheet();
  }
  setInterval(() => { try { renderQReady(); } catch (e) { /* 다음에 */ } }, 500);
  function renderQuestBar() {
    const bar = $('#questBar');
    const mq = curMain();
    let q, base, no, title, how, av;
    if (mq) { q = mq; base = S.q.mb; no = qNo(S.q.m); title = mq.title; how = repTxt(mq, mq.how); av = 'h';
      if (mq.t === 'fest' && FEST[mq.k] && !FEST[mq.k].night && festBase(mq.k) && festTimeLock(mq.k)) how = '밤에는 학교 행사의 밤 행사 한 번으로 대신해요'; }
    else {
      const s = S.q.subs.find(subReady) || S.q.subs[0];
      if (!s) { bar.hidden = true; return; }
      q = s; base = s.b; no = '부탁'; title = `${WHO[s.who]}의 부탁`; how = qGoal(s); av = s.who;
    }
    setHid(bar, rt.tab === 'quests');
    const key = `${no}|${title}|${how}`;
    if (bar.dataset.key !== key) {
      const first = !bar.dataset.key;
      bar.dataset.key = key;
      $('#qbAv').innerHTML = av === 'h' ? hedgehogAvatar() : kidAvatar(av);
      $('#qbNo').textContent = no;
      $('#qbTitle').textContent = title;
      $('#qbHow').textContent = how;
      $('#qbRewIc').innerHTML = rewardIcon(q.rk);
      if (!first && !rt.reduced && bar.animate) bar.animate([{ opacity: 0.3, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'ease-out' });
    }
    const p = qProg(q, base);
    setTx($('#qbRew'), fmt(qReward(q)));   // 바뀐 때만
    setHid($('#qbGold'), !hardQ(q));
    { const g = $('#qbGold'), k = goldRich() ? 'ess' : 'gold'; if (g.dataset.k !== k) { g.dataset.k = k; g.innerHTML = k === 'ess' ? ESS_ICON() : GOLD_ICON; } }   // 황금을 넉넉히 모은 뒤에는 정수로 받으니 정수 그림
    setTx($('#qbCnt'), p.done ? '완료' : p.text);
    { const fw = (p.frac * 100).toFixed(1) + '%', qf = $('#qbFill'); if (qf.style.width !== fw) qf.style.width = fw; }
    if (bar.classList.contains('ready') !== !!p.done) bar.classList.toggle('ready', p.done);
    setAt(bar, 'aria-label', `${mq ? '메인 퀘스트 ' + no : '학생 부탁'} ${title}. ${p.done ? '완료했어요. 눌러서 보상 받기' : p.text + '. 눌러서 바로 가기'}`);
  }

  /* 메인 화면 학생 부탁: 무엇을 부탁했는지와 진행 막대. 다 들어주면 눌러서 바로 받아요 */
  // 쪽지에는 짧게 '무엇 몇/몇'만 적어요. 누가 부탁했는지는 얼굴로, 자세한 말은 누르면 보여요
  function subText(s, p) {
    const v = qMeasure(s), cur = COUNT_TYPES.has(s.t) ? v - qBase(s, s.b) : v;
    const nums = `${fmt(Math.max(0, Math.min(s.n, Math.floor(cur + 1e-6))))}/${fmt(s.n)}`;
    switch (s.t) {
      case 'fac': return `${FAC[s.k].name} ${nums}`;
      case 'students': return `학생 ${nums}`;
      case 'picks': return `줍기 ${nums}`;
      case 'earned': return `모으기 ${nums}`;
      case 'ups': return `고치기 ${nums}`;
      case 'trains': return `연수 ${nums}`;
      case 'claims': return `문 닫기 ${nums}`;
      default: return p.text;
    }
  }
  function renderSubBar() {
    const bar = $('#subBar');
    // 메인 퀘스트를 다 마치면 위 쪽지가 부탁을 보여 주니까 여기서는 감춰요
    const show = rt.tab !== 'quests' && !!curMain() && S.q.subs.length > 0;
    bar.hidden = !show;
    if (!show) return;
    const key = S.q.subs.map(s => s.id + (subReady(s) ? '!' : '') + (s.nw ? '*' : '')).join(',');
    if (bar.dataset.key !== key) {
      bar.dataset.key = key;
      bar.innerHTML = S.q.subs.map(s => `<button class="sub${subReady(s) ? ' ready' : ''}${s.nw ? ' new' : ''}" type="button" data-sub="${s.id}">` +
        `<span class="s-av" aria-hidden="true">${kidAvatar(s.who)}</span><span class="s-txt"></span><i class="s-bar"></i></button>`).join('');
    }
    for (const s of S.q.subs) {
      const el = bar.querySelector(`[data-sub="${s.id}"]`);
      if (!el) continue;
      const p = qProg(s, s.b), txt = el.querySelector('.s-txt');
      const html = p.done ? `받기<span class="ric">${acornIcon()}</span>${fmt(s.r)}` : esc(subText(s, p));
      if (txt.dataset.h !== html) { txt.dataset.h = html; txt.innerHTML = html; }
      el.querySelector('.s-bar').style.width = (p.frac * 100).toFixed(0) + '%';
      el.setAttribute('aria-label', `${WHO[s.who]}의 부탁, ${qGoal(s)}. ${p.done ? '다 했어요. 눌러서 보상 받기' : p.text}`);
    }
  }
  function tapSub(id, el) {
    const s = S.q.subs.find(x => x.id === id);
    if (!s || rt.paused) return;
    if (subReady(s)) { claimSub(id, el); return; }
    if (s.nw) { s.nw = false; updateQuestDot(); }
    toast(`${WHO[s.who]}: ${s.say}`);
    goTo(s);
  }

  /* 퀘스트 탭 */
  const questKey = () => `${S.q.m}|${mainReady() ? 1 : 0}|${S.q.subs.map(s => s.id + (subReady(s) ? '!' : '')).join(',')}`;
  function renderQuestPanel(force) {
    if (rt.tab !== 'quests') return;
    if (force) $('#qDaily').dataset.key = '';
    renderMissions();
    const key = questKey();
    if (force || key !== rt.qKey) { rt.qKey = key; buildQuestPanel(); }
    else updateQuestProgress();
  }
  function questCard(q, base, o) {
    const p = qProg(q, base);
    const act = p.done
      ? `<button class="cta small" type="button" data-act="claim" data-q="${o.ref}">보상 받기</button>`
      : `<button class="btn-go" type="button" data-act="go" data-q="${o.ref}">바로 가기</button>`;
    return `<div class="qcard${p.done ? ' is-done' : ''}" data-qp="${o.ref}">` +
      `<div class="qwho"><span class="qav${o.kid ? ' kid' : ''}" aria-hidden="true">${o.av}</span><span class="qname">${esc(o.name)}</span>${o.badge ? `<span class="qnew">${o.badge}</span>` : ''}</div>` +
      `<p class="qsay">${esc(nl(repTxt(q, o.say)))}</p>` +   // 문장마다 줄바꿈
      `<div class="qgoal"><b>${esc(qGoal(q))}</b><span class="qp">${p.done ? '완료' : p.text}</span></div>` +
      `<div class="qbar"><i style="width:${(p.frac * 100).toFixed(1)}%"></i></div>` +
      `<div class="qfoot"><span class="qrew">보상 ${rewardIcon(q.rk)}<b>${fmt(qReward(q))}</b>${hardQ(q, o.ref !== 'main') ? (goldRich() ? `<span class="qgold" aria-label="숲의 정수 ${GOLD.hard * GOLD.essPer}">+${ESS_ICON()}<b>${GOLD.hard * GOLD.essPer}</b></span>` : `<span class="qgold" aria-label="황금 도토리 ${GOLD.hard}개">+${GOLD_ICON}<b>${GOLD.hard}</b></span>`) : ''}${o.ref === 'main' && TK_Q.has(q.id) ? `<span class="qgold qtk" aria-label="5분 단축권 ${TKE.n}장">+${IMG('ticket_m5') ? `<img src="${IMG('ticket_m5')}" alt="">` : '⏱'}<b>${TKE.n}</b></span>` : ''}</span>${act}</div></div>`;
  }
  function buildQuestPanel() {
    const i = S.q.m, q = MAIN[i];
    if (!q) {
      $('#qMain').innerHTML = gradOn()   // 5.3.2.1: 박사 학위 뒤에 할 일을 말해요
        ? '<div class="qall"><b>메인 퀘스트를 모두 마쳤어요</b><p>박사 학위까지 받았어요! 이제는 연구소 창의 논문 탭에서 논문을 쓰고 숲속 학회 메달을 모아요. 연구 트리와 학생들의 부탁도 이어 가요. 다음 학교급은 숲속 교육부가 준비 중이에요.</p></div>'
        : '<div class="qall"><b>메인 퀘스트를 모두 마쳤어요</b><p>끝까지 왔어요! 다음 학교급은 숲속 교육부가 열심히 준비 중이에요. 그동안 종업식으로 수료증을 모으고 학생들의 부탁도 들어주세요.</p></div>';
    } else {
      const ch = q.ch, list = [];
      MAIN.forEach((m, j) => { if (m.ch === ch) list.push(j); });
      const doneN = list.filter(j => j < i).length;
      const items = list.map((j, idx) => {
        const m = MAIN[j];
        if (j < i) return `<li class="qs done"><span class="mk">${CHECK}</span>${esc(m.title)}</li>`;
        if (j > i) return `<li class="qs"><span class="mk">${idx + 1}</span>${esc(m.title)}</li>`;
        return `<li class="qs cur">${questCard(m, S.q.mb, { ref: 'main', av: hedgehogAvatar(), name: `${qNo(j)} ${m.title}`, say: m.say, badge: S.q.seen < j ? '새 퀘스트' : '' })}</li>`;
      }).join('');
      const nx = CHAPTERS[ch + 1];
      const next = nx ? `<p class="ch-next">${CH_NEXT[ch]} ${ch + 2}장 「${nx}」 퀘스트가 열려요.</p>` : '';
      // 퀘스트가 많아서 기본은 접어 두고 지금 진행 중인 것만. 단추를 누르면 이 장 전체가 펼쳐져요
      const open = !!rt.qOpen, more = list.length - 1;
      const fold = more > 0 ? `<button type="button" class="ch-fold" data-act="fold" aria-expanded="${open}">${open ? '접기' : `이 장 퀘스트 모두 보기 (${list.length}개)`}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>` : '';
      $('#qMain').innerHTML = `<div class="chapter"><div class="ch-head"><span class="ch-no">${ch + 1}장</span><b>${CHAPTERS[ch]}</b><span class="ch-count">${doneN}/${list.length}</span></div><ol class="qsteps${open ? '' : ' fold'}">${items}</ol>${fold}${next}</div>`;
    }
    let subs;
    if (S.q.m < SUB_UNLOCK) subs = '<p class="qempty">메인 퀘스트 1-2 급식실 짓기를 마치면 학생들이 부탁을 하러 와요.</p>';
    else {
      subs = S.q.subs.map(s => questCard(s, s.b, { ref: s.id, kid: true, av: kidAvatar(s.who), name: WHO[s.who], say: `“${s.say}”`, badge: s.nw ? '새 부탁' : '' })).join('');
      if (S.q.subs.length < subSlots()) subs += '<p class="qempty">새 부탁을 기다리고 있어요. 메인 퀘스트를 진행하면 학생들이 또 찾아와요.</p>';
    }
    $('#qSubs').innerHTML = subs;
    $('#qTally').textContent = S.q.subDone > 0 ? `지금까지 들어준 부탁 ${S.q.subDone}개` : '';
  }
  function updateQuestProgress() {
    $$('#panelQuests [data-qp]').forEach(card => {
      const ref = card.dataset.qp;
      const q = ref === 'main' ? curMain() : S.q.subs.find(s => s.id === ref);
      if (!q) return;
      const p = qProg(q, ref === 'main' ? S.q.mb : q.b);
      $('.qp', card).textContent = p.done ? '완료' : p.text;
      $('.qbar i', card).style.width = (p.frac * 100).toFixed(1) + '%';
    });
  }
  function updateQuestDot() {
    dmDay(); lgWeek(); wkWeek();
    // 이벤트에서 받을 것은 이벤트 버튼의 점(#evDot)으로만 알려요(받을 퀘스트가 없는데 퀘스트 점이 남아요)
    const on = rt.tab !== 'quests' && (mainReady() || S.q.subs.some(s => subReady(s)) || dmClaimable() || wkClaimable());   // 새 부탁만으로는 점을 켜지 않아요
    $('#qDot').hidden = !on;
  }
  function markQuestsSeen() { S.q.seen = S.q.m; S.q.subs.forEach(s => { s.nw = false; }); }

  /* 지도와 탭 위 안내 화살표 */
  function guideTarget() {
    if (rt.tab !== 'school' || rt.sheetKey || rt.modalOpen || rt.paused) return null;
    const q = curMain();
    if (!q || mainReady()) return null;
    const early = S.q.m < CH1();   // 1장에서는 늘, 그다음부터는 살 수 있을 때만 가리켜요
    if (q.t === 'fac') return (early || S.budget >= facCost(q.k)) ? q.k : null;
    if (q.t === 'fur' || q.t === 'furAll') return q.k;
    if (q.t === 'students' && capacity() < q.n) return (early || S.budget >= facCost('classroom')) ? 'classroom' : null;
    if (q.t === 'picks') return S.f.playground >= 1 ? 'picks' : 'playground';
    return null;
  }
  function renderGuide() {
    layerFx.classList.toggle('rings', pickTutorial() || S.q.subs.some(s => s.t === 'picks' && !subReady(s)));
    const t = guideTarget();
    if (t === rt.guideKey) return;
    rt.guideKey = t;
    const g = $('#guide');
    { const zh = $('#zoneHome'); if (zh) zh.classList.remove('guide'); }
    if (!t) { g.innerHTML = ''; return; }
    // 대학교: 가리킬 건물(도토리 줍기는 참나무가 있는 체육 구역)이 지금 지도에 없으면 그 구역으로 안내해요
    // 캠퍼스 지도에서는 구역 이름표를 가리키고, 다른 구역 안에서는 '캠퍼스' 단추를 반짝여요
    if (uniOn()) {
      const tz = t === 'picks' ? zoneOf('playground') : zoneOf(t);
      if (tz && tz !== geo().zone) {
        const cz = CAMPUS.zones.find(z => z.key === tz);
        if (geo().campus && cz) { const [x, y] = cz.tag, w = cz.name.length * 11.5 + 18; g.innerHTML = `<g class="g-ring"><rect x="${x - w / 2 - 3}" y="${y - 13}" width="${w + 6}" height="26" rx="13"/></g><g transform="translate(${x} ${y + 17}) rotate(180)"><g class="g-arrow"><path d="M0 0 L-9 -11 L-4 -11 L-4 -23 L4 -23 L4 -11 L9 -11 Z"/></g></g>`; }
        else { g.innerHTML = ''; const zh = $('#zoneHome'); if (zh) zh.classList.add('guide'); }
        return;
      }
      if (!tz) { g.innerHTML = ''; return; }
    }
    // 도토리 줍기는 참나무를 가리켜요
    if (t === 'picks') { const [ox, oy, orr] = oakAt(); g.innerHTML = `<g class="g-ring"><circle cx="${ox}" cy="${oy - 8}" r="${orr}"/></g><g transform="translate(${ox} ${oy - 10 - orr})"><g class="g-arrow"><path d="M0 0 L-9 -11 L-4 -11 L-4 -23 L4 -23 L4 -11 L9 -11 Z"/></g></g>`; return; }
    const fr = $('#b-' + t + ' .focus-ring');
    const ring = `<rect x="${fr.getAttribute('x')}" y="${fr.getAttribute('y')}" width="${fr.getAttribute('width')}" height="${fr.getAttribute('height')}" rx="16"/>`;
    // 화살표는 건물 위에서 아래로 가리켜요. 지도 맨 위 건물은 이름표 아래에서 위로 가리켜요
    const [bx, by, bw] = bpos(t), top = by - bw * 0.4 > 34;
    const [x, y, dir] = top ? [bx, by - bw * 0.4, -1] : [bx, by + bw * 0.36 + 13, 1];
    g.innerHTML = `<g class="g-ring">${ring}</g><g transform="translate(${x} ${y})${dir > 0 ? ' rotate(180)' : ''}"><g class="g-arrow"><path d="M0 0 L-9 -11 L-4 -11 L-4 -23 L4 -23 L4 -11 L9 -11 Z"/></g></g>`;
  }
  function lowestTeacher(n) {
    const ks = Object.keys(TEA).filter(k => S.t[k] < n && !teaMaxed(k));
    ks.sort((a, b) => teaCost(a) - teaCost(b));
    return ks[0] || null;
  }
  function renderTeacherGuide() {
    const q = curMain();
    let k = null;
    if (q && !mainReady()) {
      if (q.t === 'tea') k = q.k;
      else if (q.t === 'teaAll') k = lowestTeacher(q.n);
    }
    const can = !!k && !teaMaxed(k) && S.budget >= teaCost(k);
    $('.tab[data-tab="teachers"]').classList.toggle('guide', !!k && rt.tab !== 'teachers' && (S.q.m < CH1() || can));
    // 종업식과 졸업식 퀘스트는 열 수 있거나 명예 교장실을 고칠 수 있을 때 졸업 탭을 가리켜요
    const gq = q && !mainReady() && (((q.t === 'grads' || q.t === 'tgrads' || q.t === 'semH') && canGraduate()) ||
      (q.t === 'perks' && Object.keys(PERKS).some(p => !perkMaxed(p) && S.p.dip >= perkCost(p))) ||
      (q.t === 'tier' && canPromote()) || (q.t === 'fperks' && Object.keys(FPERKS).some(p => S.fund >= fpCost(p))));
    $('.tab[data-tab="grad"]').classList.toggle('guide', !!gq && rt.tab !== 'grad');
    $$('.tcard').forEach(c => {
      const is = c.dataset.k === k;
      c.classList.toggle('is-quest', is);
      c.classList.toggle('guide-pulse', is && can);
    });
  }

  /* 바로 가기: 퀘스트에 필요한 곳을 열어 줘요 */
  function goFac(k, msg) { setTab('school'); zoneGo(zoneOf(k)); openSheet(k); if (msg) toast(msg); }
  // 가구 퀘스트: 건물 창을 열고 가구 칸까지 내려가요(전에는 건물 창도 열리지 않았어요)
  function goFur(k, i) {
    if (!FAC[k] || !FUR[k]) return setTab('school');
    if (S.f[k] < 1) return goFac(k, `${eul(FAC[k].name)} 먼저 지어야 가구를 둘 수 있어요`);
    goFac(k);
    if (!rt.sheetKey) return;
    const pick = i >= 0 ? i : S.fu[k].indexOf(Math.min(...S.fu[k]));
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const box = $('#furBox'), sh = $('#sheetWrap .sheet');
      if (!box || box.hidden || !sh) return;
      const a = box.getBoundingClientRect(), p = sh.getBoundingClientRect();
      sh.scrollTo({ top: Math.max(0, sh.scrollTop + a.top - p.top - 8), behavior: rt.reduced ? 'auto' : 'smooth' });
      box.classList.remove('flash'); void box.offsetWidth; box.classList.add('flash');
    }));
    toast(`${furName(k, pick)}부터 올려 보세요. 가구 이름표를 누르면 올라가요`);
  }
  function goTeacher(k, msg) {
    setTab('teachers');
    const card = $(`.tcard[data-k="${k}"]`);
    if (card) {
      // 선생님 탭은 탭 안에서 따로 스크롤돼요. 탭을 연 다음 그 칸으로 직접 내려가요
      requestAnimationFrame(() => {
        // 탭 화면을 CSS zoom으로 줄여서, 화면에서 잰 길이를 탭 안 길이로 바꿔요(z)
        const box = card.closest('.panel'), a = card.getBoundingClientRect(), p = box.getBoundingClientRect(), z = (p.height / box.offsetHeight) || 1;
        box.scrollTo({ top: Math.max(0, box.scrollTop + (a.top - p.top - (p.height - a.height) / 2) / z), behavior: rt.reduced ? 'auto' : 'smooth' });
      });
      card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash');
    }
    // 종업식을 열면 선생님도 쉬러 가셔서 새 학년에 다시 모셔 와야 해요
    if (msg) toast(msg);
  }
  function bestPick(kind) {
    const c = [];
    if (kind === 'rate') {
      c.push({ f: 'cafeteria', cost: facCost('cafeteria') }, { t: 'squirrel', cost: teaCost('squirrel') });
      if (S.students >= capacity() - 0.5) c.push({ f: 'classroom', cost: facCost('classroom') });
    } else {
      for (const k of facKeys()) c.push({ f: k, cost: facCost(k) / (kind === 'rep' ? FAC[k].rep : 1) });
      if (kind === 'rep') for (const k of Object.keys(TEA)) if (!teaMaxed(k)) c.push({ t: k, cost: teaCost(k) / 2 });
    }
    c.sort((a, b) => a.cost - b.cost);
    return c[0];
  }
  /* 오늘의 미션, 이번 주 미션, 패스 미션, 이벤트 미션을 누르면 그 일을 하는 곳으로 가요(찾아다니지 않게)
     미션 이름(id)을 퀘스트 바로 가기(goTo)의 종류로 바꿔요. 퍼즐과 합치기는 그 화면을 바로 열어요 */
  const MGO = { picks: 'picks', shakes: 'picks', ups: 'ups', con: 'ups', trains: 'trains', claims: 'claims', fest: 'fest', sports: 'fest',
    trip: 'trips', trips: 'trips', out: 'trips', ns: 'nsOn', cs: 'csTalk', rd: 'rdBooks', bt: 'btPlays', sk: 'stickers', lab: 'labs',
    sn: 'snDraw', gd: 'gdHarvest', bx: 'bxSeen', cg: 'cgPrac' };
  const MGO_MINI = { puzzle: '#pzOpen', pz: '#pzOpen', merge: '#mgOpen', mg: '#mgOpen', mgOrd: '#mgOpen' };
  const MGO_Q = { daily: '#qDaily', dm: '#qDaily', dmDone: '#qDaily', subs: '#qSubs' };
  const mgoHas = id => !!(MGO[id] || MGO_MINI[id] || MGO_Q[id]);
  const goAt = (id, on) => on && mgoHas(id) ? ` data-mgo="${id}" role="button" tabindex="0"` : '';
  function missionGo(id) {
    if (!S || rt.paused || !mgoHas(id)) return false;
    sfx('tap');
    if (MGO_MINI[id]) { setTab('mini'); setTimeout(() => { const b = $(MGO_MINI[id]); if (b && !b.closest('[hidden]')) b.click(); }, 60); return true; }
    if (MGO_Q[id]) { setTab('quests'); setTimeout(() => { const el = $(MGO_Q[id]); if (el) el.scrollIntoView({ block: 'start', behavior: rt.reduced ? 'auto' : 'smooth' }); }, 60); return true; }
    goTo({ t: MGO[id] });
    return true;
  }
  function goTo(q) {
    if (!q || rt.paused) return;
    const E = QT[q.t];
    if (E && E.go) return E.go(q);
  }

