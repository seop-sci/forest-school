  /* ===== 3.1.0 진로 상담 BEGIN (3.1.0 설계안, woodani 결정 2026-11-03) =====
     고등학교부터 복도 상담실. 명부 학생마다 희망 진로 후보 3장(뒷면). 코끼리 선생님과 하루 3번 상담: 학생 고민 한 줄에 답 셋 가운데 골라요.
     희망 진로와 맞는 답 관심 +2, 다른 후보 쪽 +1, 엇나간 답 +1. 관심 3(♥3 이상 2, ♥5 1)이면 카드 한 장이 열려요(학력 높은 과목 먼저).
     열린 카드 하나로 진로를 정하고(언제든 공짜로 바꿔요), 준비도 = 진로 과목 별(60%) + 이어진 건물이 학년 상한에 얼마나 가까운지(40%) + 같은 과목 동아리 10%p.
     준비도 80% 이상이면 진로를 이뤄요. 고등학교 3학년 졸업식에서 명부마다 한 번 정산(이룬 학생마다 수료증 +4%, 5명마다 황금 1), 진로 도감과 진로 편지. 숫자는 설계안 제안값 */
  const CS = { tier: 3, perDay: 3, need: 3, ready: 80, dipPer: 0.04, gold5: 1, dexEss: 5, dexGold: 3, good: 2, other: 1, off: 1 };
  // 진로 12종(과목 번호: 0 과학, 1 체육, 2 국어, 3 미술, 4 수학)
  const JOBS = [
    { k: 'scientist', name: '과학자', ab: 0, fac: 'science', line: '궁금한 건 못 참아요. 실험으로 답을 찾아요.',
      worry: ['실험할 때가 제일 신나요. 이걸로 무슨 일을 할 수 있을까요?', '왜 그런지 궁금한 게 너무 많아요. 이상한 걸까요?', '현미경으로 작은 세상을 보는 게 좋아요.', '새로운 걸 발견해서 모두를 놀라게 하고 싶어요.'],
      ans: ['궁금한 걸 끝까지 실험해 보는 사람이 과학자란다.', '작은 발견이 세상을 바꾸기도 해. 기록을 꼼꼼히 해 보렴.'],
      alt: ['과학자는 어떠니? 궁금한 걸 실험으로 풀어 보는 일이란다.'] },
    { k: 'doctor', name: '숲속 의사', ab: 0, fac: 'dorm', line: '다친 친구를 정성껏 돌봐요.',
      worry: ['아픈 친구를 보면 도와주고 싶은데, 방법을 잘 모르겠어요.', '몸이 어떻게 움직이는지 알고 싶어요.', '친구가 넘어지면 제가 제일 먼저 달려가요.'],
      ans: ['아픈 친구를 돕고 싶은 마음, 의사가 되는 첫걸음이야.', '몸이 어떻게 움직이는지 공부하면 많은 친구를 지킬 수 있어.'],
      alt: ['숲속 의사는 어떠니? 아픈 친구를 낫게 해 주는 일이란다.'] },
    { k: 'athlete', name: '운동선수', ab: 1, fac: 'playground', line: '땀 흘린 만큼 빨라지고 강해져요.',
      worry: ['달리기할 때가 제일 행복해요. 계속 달려도 될까요?', '시합에서 지면 너무 속상해요. 그래도 계속하고 싶어요.', '몸을 움직이면 머리가 맑아져요.', '친구들이랑 한 팀이 되면 힘이 나요.'],
      ans: ['지는 날도 있어야 더 강해지는 거야. 그게 선수란다.', '좋아하는 운동을 꾸준히 하면 꿈이 될 수 있어.'],
      alt: ['운동선수는 어떠니? 땀 흘린 만큼 강해지는 일이란다.'] },
    { k: 'ranger', name: '숲 지킴이', ab: 1, fac: 'playground', line: '동물과 나무가 살 곳을 지켜요.',
      worry: ['숲에서 동물이랑 나무를 지켜 주고 싶어요.', '산이랑 계곡을 돌아다니는 게 좋아요.', '쓰레기가 버려진 숲을 보면 마음이 아파요.'],
      ans: ['숲을 지키는 사람도 있단다. 동물과 나무의 친구지.', '산을 누비는 걸 좋아하면 숲 지킴이가 잘 맞을 거야.'],
      alt: ['숲 지킴이는 어떠니? 동물과 나무가 살 곳을 지키는 일이란다.'] },
    { k: 'writer', name: '작가', ab: 2, fac: 'library', line: '나만의 이야기를 글로 남겨요.',
      worry: ['제 이야기를 글로 써 보고 싶어요.', '책을 다 읽고 나면 뒷이야기를 혼자 상상해요.', '머릿속에 떠오르는 이야기가 너무 많아요.'],
      ans: ['읽은 이야기를 직접 써 보는 건 어때?', '너만의 이야기는 너만 쓸 수 있어. 일기부터 시작해 보렴.'],
      alt: ['작가는 어떠니? 나만의 이야기를 글로 남기는 일이란다.'] },
    { k: 'librarian', name: '사서', ab: 2, fac: 'library', line: '꼭 맞는 책을 찾아 줘요.',
      worry: ['책 읽는 건 좋은데, 그걸로 무슨 일을 할 수 있을지 모르겠어요.', '도서관에 있으면 마음이 편해요.', '친구한테 재미있는 책을 골라 주는 게 좋아요.'],
      ans: ['책을 좋아하는 친구들을 돕는 일도 있단다.', '도서관을 지키는 사서는 책의 길잡이야.'],
      alt: ['사서는 어떠니? 친구마다 꼭 맞는 책을 찾아 주는 일이란다.'] },
    { k: 'teacher', name: '선생님', ab: 2, fac: 'classroom', line: '아는 것을 친절하게 나눠요.',
      worry: ['동생들한테 뭘 알려 주는 게 재미있어요.', '다른 사람 이야기를 듣는 게 좋아요.', '친구가 모르는 문제를 같이 풀어 주면 뿌듯해요.'],
      ans: ['알려 주는 걸 좋아하면 선생님이 잘 어울려.', '잘 들어 주는 사람이 좋은 선생님이 된단다.'],
      alt: ['선생님은 어떠니? 아는 것을 친절하게 나누는 일이란다.'] },
    { k: 'painter', name: '화가', ab: 3, fac: 'classroom', line: '마음을 색과 그림으로 보여 줘요.',
      worry: ['그림을 그리면 시간 가는 줄 몰라요.', '예쁜 색을 보면 기분이 좋아져요.', '공책 귀퉁이에 자꾸 그림을 그리게 돼요.'],
      ans: ['그림으로 마음을 전하는 사람이 화가야.', '좋아하는 색을 마음껏 써 보렴. 그게 너의 그림이야.'],
      alt: ['화가는 어떠니? 마음을 색과 그림으로 보여 주는 일이란다.'] },
    { k: 'chef', name: '요리사', ab: 3, fac: 'cafeteria', line: '한 그릇으로 모두를 웃게 해요.',
      worry: ['급식 메뉴를 제가 직접 만들어 보고 싶어요.', '맛있는 냄새가 나면 부엌에 가 보고 싶어요.', '제가 만든 간식을 친구들이 맛있게 먹으면 신나요.'],
      ans: ['맛있는 냄새를 따라가 보렴. 요리사의 코를 가졌구나.', '먹는 사람을 웃게 만드는 일, 요리사란다.'],
      alt: ['요리사는 어떠니? 한 그릇으로 모두를 웃게 하는 일이란다.'] },
    { k: 'mathematician', name: '수학자', ab: 4, fac: 'classroom', line: '숫자 속 규칙을 찾아내요.',
      worry: ['숫자 퍼즐을 풀 때가 제일 재미있어요.', '규칙을 찾으면 짜릿해요.', '어려운 문제는 풀릴 때까지 붙잡고 있어요.'],
      ans: ['규칙을 찾는 즐거움, 수학자가 매일 느끼는 기분이야.', '어려운 문제를 끝까지 붙잡는 힘이 있구나.'],
      alt: ['수학자는 어떠니? 숫자 속 규칙을 찾아내는 일이란다.'] },
    { k: 'architect', name: '건축가', ab: 4, fac: 'science', line: '설계도로 멋진 건물을 지어요.',
      worry: ['블록으로 큰 집을 쌓아 보고 싶어요.', '설계도를 그려 보고 싶어요.', '멋진 건물을 보면 어떻게 지었는지 궁금해요.'],
      ans: ['설계도를 그려 집을 짓는 사람이 건축가야.', '블록 쌓기를 좋아하면 큰 건물도 지을 수 있어.'],
      alt: ['건축가는 어떠니? 설계도로 멋진 건물을 짓는 일이란다.'] },
    { k: 'shopkeeper', name: '가게 사장', ab: 4, fac: 'store', line: '손님을 반기고 가게를 꾸려요.',
      worry: ['매점에서 물건 파는 걸 도와봤는데 재밌었어요.', '계산이 딱 맞아떨어질 때 기분이 좋아요.', '손님이 웃으면서 가면 저도 기분이 좋아요.'],
      ans: ['손님을 반기고 셈을 잘하면 멋진 가게를 꾸릴 수 있어.', '반갑게 맞는 웃음이 가게를 살린단다. 너는 그걸 벌써 알고 있구나.'],
      alt: ['가게 사장은 어떠니? 손님을 반기고 가게를 꾸리는 일이란다.'] }
  ];
  // 고민을 과목에서 고르니 절반쯤 진로와 안 맞았어요. 고민은 이번 진로(JOBS[t].worry)에서, 다른 길 답은 권하는 말(alt)로
  // 대학교 상담실은 대학생 고민과 높임말 답으로(프로젝트 문서 '대학교 재정비 글 초안 1'). 직업, 숫자, 규칙은 그대로예요
  const JOBS_U = {
    scientist: { worry: ['실험실에서 밤을 새워도 시간 가는 줄 몰라요. 대학원에 가도 될까요?', '논문을 읽다 보면 질문이 더 늘어나요. 이게 맞는 건가요?', '제 가설이 틀렸어요. 석 달을 썼는데요.'], ans: ['질문이 늘어나는 건 잘 가고 있다는 뜻이에요. 그게 연구예요.', '틀린 가설도 기록해 두면 다음 사람의 길이 돼요.'], alt: ['연구원은 어때요? 궁금한 걸 끝까지 파는 일이에요.'] },
    doctor: { worry: ['실습 나가서 처음으로 환자 손을 잡아 봤어요. 손이 떨렸어요.', '외울 게 산더미예요. 제가 해낼 수 있을까요?', '아픈 친구 얘기를 들으면 저까지 마음이 무거워져요.'], ans: ['손이 떨렸다는 건 그 일이 무겁다는 걸 안다는 거예요. 좋은 시작이에요.', '하루에 한 장씩이면 돼요. 산도 한 걸음씩 오르는 거니까요.'], alt: ['숲속 의사는 어때요? 아픈 친구 곁을 지키는 일이에요.'] },
    athlete: { worry: ['기록이 반년째 그대로예요. 여기까지인 걸까요?', '졸업하면 실업팀에 갈지, 코치 공부를 할지 모르겠어요.', '부상에서 돌아왔는데 예전 같지 않아요.'], ans: ['기록이 멈춘 때가 몸이 다음 계단을 준비하는 때예요.', '쉬어 본 선수가 쉬어야 하는 선수를 가르칠 수 있어요.'], alt: ['운동선수는 어때요? 몸으로 답을 찾는 일이에요.'] },
    ranger: { worry: ['현장 조사를 나가면 살아 있는 기분이 들어요. 이걸 직업으로 삼아도 될까요?', '숲이 줄어든다는 보고서를 썼어요. 제가 뭘 할 수 있을까요?', '사무실보다 흙길이 편해요.'], ans: ['살아 있는 기분이 드는 곳이 일터가 되면 오래 할 수 있어요.', '보고서 한 장이 나무 한 그루를 지키기도 해요. 계속 써요.'], alt: ['숲 지킴이는 어때요? 나무와 동물이 살 곳을 지키는 일이에요.'] },
    writer: { worry: ['공모전에서 또 떨어졌어요. 그래도 내일 또 쓸 것 같아요.', '글로 먹고살 수 있을까요? 부모님이 걱정하세요.', '첫 문장만 열 번째 고치고 있어요.'], ans: ['떨어지고도 또 쓰는 사람을 작가라고 불러요.', '첫 문장은 마지막에 고쳐도 돼요. 일단 끝까지 가 봐요.'], alt: ['작가는 어때요? 자기 이야기를 글로 남기는 일이에요.'] },
    librarian: { worry: ['도서관 근로를 하는데, 책 찾아 주는 일이 제일 즐거워요.', '자료 정리를 하다 보면 마음이 가라앉아요. 이런 것도 적성일까요?', '요즘은 다들 검색만 해요. 사서가 필요할까요?'], ans: ['꼭 맞는 책을 건네는 일은 검색이 못 해요. 그건 사람의 일이에요.', '가라앉는 마음도 재능이에요. 조용한 곳을 지키는 사람이 필요해요.'], alt: ['사서는 어때요? 누군가에게 꼭 맞는 책을 찾아 주는 일이에요.'] },
    teacher: { worry: ['교생 실습에서 아이들이 제 이름을 불러 줬어요. 하루 종일 그 생각만 나요.', '수업 준비를 밤새 했는데 십 분 만에 끝나 버렸어요.', '임용 시험이 무서워요. 그래도 교실에 서고 싶어요.'], ans: ['이름이 불린 날을 잊지 마요. 힘든 날에 꺼내 볼 수 있어요.', '십 분 만에 끝난 수업도 수업이에요. 다음엔 십일 분이 될 거예요.'], alt: ['선생님은 어때요? 아는 것을 다정하게 나누는 일이에요.'] },
    painter: { worry: ['졸업 전시가 다가오는데 캔버스가 아직 하얘요.', '제 그림을 산다는 분이 처음 나타났어요. 값을 어떻게 매기죠?', '교수님은 좋다는데 저는 마음에 안 들어요.'], ans: ['하얀 캔버스는 아직 뭐든 될 수 있다는 뜻이에요. 한 줄만 그어 봐요.', '마음에 안 드는 눈이 있어야 다음 그림이 나아져요.'], alt: ['화가는 어때요? 마음을 색으로 보여 주는 일이에요.'] },
    chef: { worry: ['학생 식당 아르바이트를 하는데, 빈 그릇이 돌아오면 기분이 좋아요.', '제 가게를 내고 싶어요. 너무 큰 꿈일까요?', '같은 국을 백 번 끓였는데 백 번 다 달라요.'], ans: ['빈 그릇이 좋다면 이미 요리사 마음이에요.', '백 번 다 다른 걸 아는 혀가 있잖아요. 그게 실력이에요.'], alt: ['요리사는 어때요? 한 그릇으로 하루를 바꾸는 일이에요.'] },
    mathematician: { worry: ['증명 하나를 일주일째 붙잡고 있어요. 그런데 싫지 않아요.', '수학으로 무슨 일을 하냐고 다들 물어요.', '칠판 가득 썼는데 처음 줄이 틀렸어요.'], ans: ['일주일을 붙잡고도 싫지 않다면, 그 문제가 사람을 고른 거예요.', '처음 줄을 찾아낸 눈이 있으니 다음 칠판은 더 짧아질 거예요.'], alt: ['수학자는 어때요? 숫자 속 규칙을 찾아내는 일이에요.'] },
    architect: { worry: ['설계 과제로 사흘째 못 자고 있어요. 그런데 모형을 보면 웃음이 나요.', '제가 그린 건물에 누가 살게 된다고 생각하면 겁이 나요.', '교수님이 제 도면을 다 지우라고 하셨어요.'], ans: ['겁이 나는 사람이 지은 집이 튼튼해요.', '지운 자리에 더 좋은 선이 들어와요. 연필은 그래서 지워지는 거예요.'], alt: ['건축가는 어때요? 누군가 머물 곳을 그리는 일이에요.'] },
    shopkeeper: { worry: ['축제 부스를 맡았는데 장부 쓰는 게 제일 재미있었어요.', '창업 동아리에서 첫 손님을 받았어요. 한 명이었지만요.', '취업이 안전하다는데, 저는 제 가게를 하고 싶어요.'], ans: ['한 명을 반기는 법을 알면 백 명도 반길 수 있어요.', '장부가 재미있다면 가게를 오래 지킬 사람이에요.'], alt: ['가게 사장은 어때요? 손님을 반기고 살림을 꾸리는 일이에요.'] } };
  for (const J of JOBS) for (const f of ['worry', 'ans', 'alt']) { const hs = J[f]; Object.defineProperty(J, f, { get: () => uniNow() && JOBS_U[J.k] ? JOBS_U[J.k][f] : hs, enumerable: true, configurable: true }); }
  const CS_OFF_U = ['오늘은 일단 푹 자는 게 어때요?', '학생 식당 메뉴부터 보고 생각해요.', '운동장 한 바퀴 돌면 답이 나올지도 몰라요.', '그건 내일 날씨에 따라 다르겠네요.', '선생님은 사과를 좋아해요.', '그건 부총장님께 여쭤봐요.', '과제는 다 했어요?', '일단 크게 기지개를 켜 봐요.'];
  const CS_REACT_U = { good: ['맞아요, 바로 그거예요.', '그 말이 듣고 싶었나 봐요.', '한번 해 볼게요, 끝까지.', '길이 조금 보이는 것 같아요.', '오늘은 잠이 올 것 같아요.'], other: ['그런 길도 있군요. 알아볼게요.', '생각해 본 적 없는 쪽이에요.', '한번 찾아볼게요.'], off: ['네…? 그건 좀…', '선생님도 참.', '그래도 기분은 나아졌어요.', '다음엔 진지하게 들어 주세요.'] };
  const CS_WORRY = JOBS.map(J => J.worry);
  const CS_OFF = ['오늘은 일단 푹 자는 게 어떨까?', '간식부터 먹고 다시 생각해 보자.', '운동장 한 바퀴 돌면 답이 나올지도 몰라.', '음, 그건 내일 날씨에 따라 다르겠구나.',
    '선생님은 사과를 좋아한단다.', '코로 물 뿜는 법을 알려 줄까?', '그건 교감 선생님께 여쭤보렴.', '숙제는 다 했니?', '일단 크게 기지개를 켜 보자!', '구름 모양을 세어 보는 건 어때?'];
  const CS_REACT = {
    good: ['맞아요, 바로 그거예요!', '와, 가슴이 두근거려요!', '그 꿈, 꼭 이루고 싶어요!', '선생님 말씀 들으니 길이 보여요!', '저 그거 정말 해 보고 싶어요!', '생각만 해도 신나요!'],
    other: ['그것도 좋겠네요. 생각해 볼게요.', '음, 그런 길도 있군요!', '한번 알아볼게요.', '그것도 재미있겠어요.'],
    off: ['네…? 그건 좀…', '하하, 선생님도 참!', '음… 그래도 고마워요.', '갑자기요?', '다음엔 진지하게 들어 주세요!', '그래도 기분은 좋아졌어요.']
  };
  const csPick = a => a[Math.floor(Math.random() * a.length)];
  const freshCs = () => ({ day: '', n: 0, talks: 0, picks: 0, won: 0, paid: -1, done: {}, met: 0 });
  const csOpen = () => !!S && !!S.cs && S.tier >= CS.tier && rosterOn() && S.roster.list.length > 0;
  const csDay = () => { const t = gameToday(); if (dayRoll(S.cs, t)) { S.cs.n = 0; } };
  const csMax = () => CS.perDay + Math.floor(xtLv('cou') / 5) + (S.adx && S.adx.cs && S.adx.day === gameToday() ? 1 : 0);   // 광고로 한 번 더
  const csLeft = () => { if (!S || !S.cs) return 0; csDay(); return Math.max(0, csMax() - S.cs.n); };
  const csKid = i => S.roster.list[i] || null;
  // 진로 후보: 잘하는 과목(능력치가 가장 큰 칸)에서 둘, 다른 과목에서 하나
  function csCands(x) {
    const main = x.a.indexOf(Math.max(...x.a)), mine = JOBS.map((j, i) => i).filter(i => JOBS[i].ab === main), rest = JOBS.map((j, i) => i).filter(i => JOBS[i].ab !== main);
    const mix = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    return mix(mine).slice(0, 2).concat(mix(rest).slice(0, 1));
  }
  // 고등학교 명부 학생마다 후보를 정해요(옛 저장, 전 고등학교, 학년 중 전학생도)
  function csEnsure() {
    if (!S || !S.cs || S.tier < CS.tier || !rosterOn()) return false;
    let ch = false;
    for (const x of S.roster.list) if (!Array.isArray(x.jc) || x.jc.length !== 3) { x.jc = csCands(x); x.jo = []; x.ji = 0; x.jb = -1; ch = true; }
    return ch;
  }
  const csHearts = x => { const f = frOf(x.sp); return f && S.roster.list.find(y => y.sp === x.sp) === x ? frHeart(f.p) : 0; };   // 단짝 이름을 쓰는 학생(종류마다 첫 학생)만
  const csNeed = x => { const h = csHearts(x); return h >= 5 ? 1 : h >= 3 ? 2 : CS.need; };
  const csMul = j => 1 + acLv(AB_KEY[JOBS[j].ab]) / 200 + 0.05 * xtLv('cou');
  // 관심이 차면 아직 뒷면인 후보 가운데 학교 학력이 높은 과목부터 열어요. 돌려주는 값: 새로 연 진로 번호들
  function csOpenCards(x) {
    const got = [];
    while (x.jo.length < 3 && x.ji >= csNeed(x)) {
      const left = x.jc.filter(j => !x.jo.includes(j)).sort((a, b) => acLv(AB_KEY[JOBS[b].ab]) - acLv(AB_KEY[JOBS[a].ab]));
      x.ji = Math.round((x.ji - csNeed(x)) * 100) / 100; x.jo.push(left[0]); got.push(left[0]);
    }
    if (x.jo.length >= 3) x.ji = 0;
    return got;
  }
  function csReady(x) {
    if (!x || !(x.jb >= 0)) return 0;
    const J = JOBS[x.jb], cap = Math.max(1, facCap()), lv = S.f[J.fac] || 0;
    const club = x.c >= 0 && CLUBS[x.c] && CLUBS[x.c].ab === J.ab ? 10 : 0;
    return Math.min(100, Math.round(star(x.a[J.ab]) / 5 * 60 + Math.min(1, lv / cap) * 40 + club));
  }
  const csDone = x => x && x.jb >= 0 && csReady(x) >= CS.ready;
  // 대화 하나 만들기: 이번에 이야기할 진로(뒷면 후보 먼저), 그 과목 고민, 답 셋
  function csTalkMake(i) {
    const x = csKid(i); if (!x) return null;
    const t = csPick(x.jo.length ? x.jo : x.jc);   // 열린 카드가 있으면 그 진로 쪽 고민(설계안 3-3)
    const W = JOBS[t].worry;
    let wi = Math.floor(Math.random() * W.length); if (wi === x.jl && W.length > 1) wi = (wi + 1) % W.length;   // jl: 지난번 고민 번호(같은 줄 연달아 안 나오게)
    x.jl = wi;
    const others = x.jc.filter(j => j !== t), o = others.length ? csPick(others) : (t + 1) % JOBS.length;
    const opts = [{ how: 'good', j: t, tx: csPick(JOBS[t].ans) }, { how: 'other', j: o, tx: csPick(JOBS[o].alt) }, { how: 'off', j: -1, tx: csPick(uniNow() ? CS_OFF_U : CS_OFF) }];
    for (let a = opts.length - 1; a > 0; a--) { const b = Math.floor(Math.random() * (a + 1)); [opts[a], opts[b]] = [opts[b], opts[a]]; }
    return { i, t, worry: W[wi], opts, res: null };
  }
  function csAnswer(k) {
    const T = rt.csTalk; if (!T || T.res || !T.opts[k] || csLeft() <= 0) return;
    const x = csKid(T.i); if (!x) return;
    const o = T.opts[k], base = CS[o.how], j = o.how === 'off' ? T.t : o.j;
    S.cs.n += 1; S.cs.talks += 1;
    x.ji = Math.round((x.ji + base * csMul(j)) * 100) / 100;
    const opened = csOpenCards(x);
    T.res = { how: o.how, react: csPick((uniNow() ? CS_REACT_U : CS_REACT)[o.how]), opened };
    sfx(o.how === 'good' ? 'quest' : 'tap'); if (opened.length) setTimeout(() => sfx('done'), 300);
    checkQuests(); save(); renderCounsel();
  }
  function csChoose(i, j) {
    const x = csKid(i); if (!x || !x.jo.includes(j)) return;
    x.jb = x.jb === j ? -1 : j;
    if (x.jb >= 0 && !x.jf) { x.jf = 1; S.cs.picks += 1; }   // jf: 처음 진로를 정한 학생(퀘스트 수는 한 번만)
    sfx('tap'); toast(x.jb >= 0 ? `${x.nm}의 꿈은 ${JOBS[j].name}! 그 꿈을 응원할게요.` + (csDone(x) ? ' 벌써 준비가 다 됐어요!' : '') : `${x.nm}의 진로를 다시 고민해요`);
    checkQuests(); save();
    const row = rt.csView === 'list' && !rt.csTalk && document.querySelector(`#csBody [data-csrow="${i}"]`);   // 목록을 다시 그리지 않고 누른 학생 줄만 바꿔요
    if (row) row.outerHTML = csRowHTML(x, i, csLeft()); else renderCounsel();
  }
  // 고등학교 3학년 졸업식(대학교가 열리기 전에는 3학년을 다시 해요): 명부마다 한 번 수료증 보너스와 황금, 진로 도감은 졸업식마다 채워요
  function csSettle() {
    if (!csOpen() || S.tg < TIERS[S.tier].years - 1) return 0;
    const won = S.roster.list.filter(csDone);
    let newDex = 0;
    for (const x of won) { const J = JOBS[x.jb]; if (!S.cs.done[J.k]) { S.cs.done[J.k] = { nm: x.nm, sp: x.sp }; newDex += 1; } }
    if (newDex) addEss(CS.dexEss * newDex);   // 5.3.4.4: 다른 정수 보상처럼 정수 연구가 붙어요
    const allDex = JOBS.every(J => S.cs.done[J.k]);
    if (allDex && !S.deco.own.deco_career_tree) { S.deco.own.deco_career_tree = 1; addGold(CS.dexGold); }
    rt.csRw = [];
    if (S.cs.paid === S.roster.gen) { if (newDex) rt.csRw.push({ title: '진로 도감', sub: `새 진로 ${newDex}칸을 채웠어요`, items: [{ ic: 'ess', t: `숲의 정수 +${CS.dexEss * newDex}` }] }); return 0; }
    S.cs.paid = S.roster.gen; S.cs.won += won.length;
    const gold = Math.floor(won.length / 5) * CS.gold5, gIt = gold ? goldOr(gold) : null;
    if (won.length) {
      const best = won.slice().sort((a, b) => csHearts(b) - csHearts(a))[0];
      const art = IMG('letter_career') ? `<img src="${IMG('letter_career')}" alt="">` : '';
      rt.csRw.push({ title: '진로를 찾은 친구들', art, big: `${won.length}명이 꿈을 찾았어요`,
        sub: `"코끼리 선생님, 교장 선생님! 덕분에 꿈을 찾았어요. 나중에 꼭 멋진 ${JOBS[best.jb].name}${batchim(JOBS[best.jb].name) ? '이' : '가'} 돼서 학교에 놀러 올게요." – ${best.nm} 올림`,
        items: [{ ic: 'dip', t: `졸업식 수료증 +${Math.round(won.length * CS.dipPer * 100)}%` }, gIt,
          newDex ? { ic: 'ess', t: `진로 도감 ${newDex}칸, 숲의 정수 +${CS.dexEss * newDex}` } : null, allDex && S.deco.own.deco_career_tree ? { ic: '🌳', t: `진로 도감 완성! 장식 '진로 나무', 황금 도토리 +${CS.dexGold}` } : null].filter(Boolean) });
    }
    return won.length * CS.dipPer;
  }
  function openCounsel() {
    if (tr2Busy()) { toast(tr2Busy()); return; }   // 수학여행 중에는 학생이 없어요
    if (!csOpen()) { toast(S.tier < CS.tier ? '상담실은 고등학교부터 열려요' : '명부 학생이 있으면 상담할 수 있어요'); return; }
    if (rt.paused || rt.modalOpen) return;
    if (csEnsure()) save();
    rt.csTalk = null; rt.csView = S.cs.met ? 'list' : 'hi'; rt.csLastView = '';   // 새로 열 때는 맨 위부터
    renderCounsel(); openModal($('#mCounsel')); sfx('tap');
  }
  const csFace = how => IMG(how === 'good' ? 'cou_smile' : how === 'off' ? 'cou_tilt' : 'cou_listen') || IMG('tea_elephant');
  function csRowHTML(x, i, left) {   // 학생 한 줄(진로 카드를 누르면 이 줄만 바꿔요)
    const r = csReady(x), J = x.jb >= 0 ? JOBS[x.jb] : null;
    const cards = x.jc.map(j => x.jo.includes(j) ? `<button class="cs-chip${x.jb === j ? ' on' : ''}" type="button" data-cs="p${i}_${j}"><img src="${IMG('badge_' + JOBS[j].k) || ''}" alt="">${JOBS[j].name}</button>` : `<span class="cs-chip back">?</span>`).join('');
    return `<div class="cs-row${csDone(x) ? ' done' : ''}" data-csrow="${i}"><span class="cs-av">${kidAvatar(x.sp)}</span><div class="cs-tx"><b>${esc(x.nm)}${J ? ` <em>${J.name}</em>` : ''}</b>` +
      `<div class="cs-chips">${cards}</div>${J ? `<div class="qbar cs-bar"><i style="width:${r}%"></i></div><small>준비도 ${r}%${csDone(x) ? ` 완료! ${esc(x.nm)}, 이제 ${J.name}${batchim(J.name) ? '이' : '가'} 될 준비가 다 됐구나.` : ` (${STAT_NAME(J.ab)} 별과 ${FAC[J.fac].name} 레벨)`}</small>` : `<small>${x.jo.length ? '열린 카드를 눌러 진로로 정해요' : '상담하면 진로 카드가 열려요'}</small>`}</div>` +
      `<button class="cta small" type="button" data-cs="t${i}"${left ? '' : ' disabled'}>상담</button></div>`;
  }
  /* 직업 카드를 누르면 목록을 새로 그리면서 맨 위로 올라갔어요(휴대폰). 같은 화면을 다시 그릴 때는 스크롤 자리를 지켜요 */
  function renderCounsel() {
    const m = $('#mCounsel'), b = $('#csBody'), keep = !!b && rt.csView === rt.csLastView, ys = [];
    if (keep) for (let el = b; el && el !== document.body; el = el.parentElement) { if (el.scrollTop) ys.push([el, el.scrollTop]); if (el === m) break; }
    renderCounsel0();
    for (const [el, y] of ys) el.scrollTop = y;
    if (ys.length) requestAnimationFrame(() => { for (const [el, y] of ys) if (el.scrollTop < y - 2) el.scrollTop = y; });   // 휴대폰 브라우저는 누른 단추가 지워지면 다음 그리기에 맨 위로 튕겨서 한 번 더
    rt.csLastView = rt.csView;
  }
  function renderCounsel0() {
    const m = $('#mCounsel'); if (!m || !S.cs) return;
    const bg = IMG('room_counsel'); $('#csHead').style.backgroundImage = bg ? `url("${bg}")` : '';
    const left = csLeft(), T = rt.csTalk;
    $('#csLeft').textContent = `오늘 상담 ${csMax() - left}/${csMax()}`;
    const body = $('#csBody');
    if (rt.csView === 'hi') {   // 처음 만날 때
      const u = IMG('cou_smile') || IMG('tea_elephant');
      body.innerHTML = `<div class="cs-talk"><div class="cs-face">${u ? `<img src="${u}" alt="">` : '<span class="cs-em">🐘</span>'}</div>` +
        `<div class="cs-bub tea"><p><b>코끼리 선생님</b>안녕하세요, ${headText('교장 선생님')}. 저는 상담을 맡은 코끼리예요. 귀가 커서 이야기를 잘 들어요.</p></div>` +
        `<div class="cs-bub tea"><p>하루 ${csMax() === 3 ? '세 ' : csMax()}번 상담할 수 있어요.</p></div>` +
        `<div class="btn-row"><button class="cta" type="button" data-cs="met">좋아요</button></div></div>`;
      return;
    }
    if (rt.csView === 'dex') {
      body.innerHTML = `<p class="cs-lead">칸마다 숲의 정수 ${CS.dexEss}개를 받고, 12칸을 다 채우면 장식 '진로 나무'를 받아요.</p><div class="cs-dex">` +
        JOBS.map(J => { const d = S.cs.done[J.k], u = IMG('badge_' + J.k); return `<div class="cs-dx${d ? ' on' : ''}">${u ? `<img src="${u}" alt="">` : '🎓'}<b>${J.name}</b><small>${d ? esc(d.nm) : '아직'}</small></div>`; }).join('') +
        `</div><button class="btn-sub" type="button" data-cs="list">상담실로</button>`;
      return;
    }
    if (T) {
      const x = csKid(T.i), R = T.res, face = csFace(R ? R.how : 'listen');
      body.innerHTML = `<div class="cs-talk"><div class="cs-face">${face ? `<img src="${face}" alt="">` : '<span class="cs-em">🐘</span>'}</div>` +
        (R ? '' : `<div class="cs-bub tea"><p><b>코끼리 선생님</b>${esc(x.nm)}, 요즘 어떤 생각을 하고 있니?</p></div>`) +
        `<div class="cs-bub kid"><span class="cs-av">${kidAvatar(x.sp)}</span><p><b>${esc(x.nm)}</b>${esc(R ? R.react : T.worry)}</p>${R ? `<img class="cs-fx" src="${IMG(R.how === 'off' ? 'react_question' : 'react_spark') || ''}" alt="">` : ''}</div>` +
        (R ? (R.opened.length ? `<div class="cs-open">${R.opened.map(j => `<span class="cs-card new"><img src="${IMG('job_' + JOBS[j].k) || ''}" alt=""><b>${JOBS[j].name}</b><small>${JOBS[j].line}</small></span>`).join('')}<p>진로 카드가 열렸어요!${x.jb >= 0 ? '' : ' 아래 상담실 목록에서 진로로 정할 수 있어요.'}</p></div>` : `<p class="cs-lead">${esc(x.nm)}의 관심이 쌓였어요. 카드까지 ${Math.max(0, Math.ceil((csNeed(x) - x.ji) * 10) / 10)} 남았어요.</p>`) +
            `<div class="btn-row"><button class="cta" type="button" data-cs="list">다음</button></div>`
          : `<p class="cs-ask">코끼리 선생님은 뭐라고 답할까요?</p><div class="cs-opts">${T.opts.map((o, k) => `<button class="cs-opt" type="button" data-cs="a${k}">${esc(o.tx)}</button>`).join('')}</div>`) + '</div>';
      return;
    }
    const L = S.roster.list;
    body.innerHTML = `<p class="cs-lead">${left ? `오늘 ${left}번 더 상담할 수 있어요.` : '오늘 상담은 여기까지예요.'} 카드가 열리면 진로로 정하고, 준비도 ${CS.ready}%를 넘기면 3학년 졸업식에서 수료증이 늘어요.</p>` +
      `<div class="cs-list">` + L.map((x, i) => csRowHTML(x, i, left)).join('') + `</div><div class="btn-row">${!left && adxCan('cs') ? adxBtn('data-cs="adm"', '광고 보고 한 번 더') : ''}<button class="btn-sub" type="button" data-cs="dex">진로 도감 ${Object.keys(S.cs.done).length}/${JOBS.length}</button></div>`;
  }
  const STAT_NAME = ab => ABIL[ab];
  function csClick(e) {
    const b = e.target.closest('[data-cs]'); if (!b) return;
    const v = b.dataset.cs;
    if (v === 'list') { rt.csTalk = null; rt.csView = 'list'; }
    else if (v === 'met') { S.cs.met = 1; save(); rt.csView = 'list'; sfx('tap'); }
    else if (v === 'dex') { rt.csView = 'dex'; }
    else if (v[0] === 't') { if (csLeft() <= 0) { toast('오늘 상담은 여기까지예요. 내일 또 이야기 들어 볼게요'); return; } rt.csTalk = csTalkMake(+v.slice(1)); rt.csView = 'talk'; sfx('tap'); }
    else if (v === 'adm') { if (csOpen() && csLeft() <= 0) adxMore('cs', () => { renderCounsel(); toast('오늘 상담을 한 번 더 할 수 있어요'); return true; }); return; }   // 한 번 더
    else if (v[0] === 'a') { csAnswer(+v.slice(1)); return; }
    else if (v[0] === 'p') { const [i, j] = v.slice(1).split('_').map(Number); csChoose(i, j); return; }
    renderCounsel();
  }
  function sanitizeCs(d, s) {
    const c = d.cs && typeof d.cs === 'object' ? d.cs : {}, n = v => typeof v === 'number' && isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
    s.cs = freshCs();
    s.cs.day = typeof c.day === 'string' ? c.day.slice(0, 12) : '';
    s.cs.n = Math.min(99, n(c.n)); s.cs.talks = n(c.talks); s.cs.picks = n(c.picks); s.cs.won = n(c.won);
    s.cs.paid = Number.isInteger(c.paid) && c.paid >= 0 ? c.paid : -1; s.cs.met = c.met ? 1 : 0;
    const dn = c.done && typeof c.done === 'object' ? c.done : {};
    for (const J of JOBS) { const v = dn[J.k]; if (v && typeof v === 'object') s.cs.done[J.k] = { nm: typeof v.nm === 'string' ? v.nm.replace(/[<>&"'`\\]/g, '').slice(0, 8) : '친구', sp: typeof v.sp === 'string' ? v.sp.slice(0, 20) : '' }; }
  }
  /* ===== 진로 상담 END ===== */
  // 진로 상담: 명부 학생의 진로 칸(후보 jc, 연 카드 jo, 관심 ji, 고른 진로 jb, 지난 고민 jl). 없거나 틀리면 빼서 csEnsure가 다시 정해요
  function csSanKid(x) {
    const ok = j => Number.isInteger(j) && j >= 0 && j < JOBS.length;
    if (!Array.isArray(x.jc) || x.jc.length !== 3 || !x.jc.every(ok) || new Set(x.jc).size !== 3) return {};
    const jo = (Array.isArray(x.jo) ? x.jo : []).filter((j, i, a) => ok(j) && x.jc.includes(j) && a.indexOf(j) === i);
    const ji = typeof x.ji === 'number' && isFinite(x.ji) ? Math.max(0, Math.min(10, x.ji)) : 0;
    return { jc: x.jc.slice(), jo, ji, jb: ok(x.jb) && jo.includes(x.jb) ? x.jb : -1, jl: Number.isInteger(x.jl) ? x.jl : -1, ...(x.jf ? { jf: 1 } : {}) };
  }
  function sanitize200(d, s) {
    const r = d.roster && typeof d.roster === 'object' ? d.roster : {}, num = v => typeof v === 'number' && isFinite(v) ? v : NaN;
    s.roster.wk = Math.floor(num(r.wk)) >= -1 ? Math.floor(num(r.wk)) : -1;
    s.roster.gen = Math.max(0, Math.floor(num(r.gen)) || 0);
    s.roster.list = (Array.isArray(r.list) ? r.list : []).slice(0, ROSTER_MAX).filter(x => x && typeof x.sp === 'string' && (BASE_SPECIES.includes(x.sp) || NEWCOMERS.some(n => n.k === x.sp)))
      .map(x => ({ sp: x.sp, nm: typeof x.nm === 'string' ? x.nm.replace(/[<>&"'`\\]/g, '').slice(0, 8) : '친구',
        a: ABIL.map((_, i) => Math.max(1, Math.min(100, Math.floor(Array.isArray(x.a) ? (i === 4 && x.a.length < 5 ? 8 + Math.floor(Math.random() * 20) : num(x.a[i]) || 1) : 1)))),   // 옛 저장(네 칸)은 수학 칸을 채워요
        c: Number.isInteger(x.c) && x.c >= 0 && x.c < CLUBS.length ? x.c : -1, cw: Math.floor(num(x.cw)) || 0, ...(x.r === true ? { r: true } : {}), ...csSanKid(x) }));   // r: 반짝 친구 모습, jc/jo/ji/jb/jl: 진로 상담
    // 한 동아리에 3명보다 많으면 넘치는 학생은 동아리 밖으로
    CLUBS.forEach((_, c) => s.roster.list.filter(x => x.c === c).slice(CLUB.seats).forEach(x => { x.c = -1; }));
    // 학력과 능력치 균형: 옛 명부(v 없음)는 한 번만 능력치를 0.6배로(100 → 60). 그 뒤로는 v: 2라 다시 줄지 않아요
    if (r.v !== 2) s.roster.list.forEach(x => { x.a = x.a.map(v => Math.max(1, Math.round(v * 0.6))); });
    s.roster.v = 2;
    const k = d.club && typeof d.club === 'object' ? d.club : {};
    s.club.last = Math.floor(num(k.last)) >= 0 ? Math.floor(num(k.last)) : -1;
    s.club.n = Math.max(0, Math.floor(num(k.n)) || 0);
    s.club.shown = CLUBS.map((_, i) => Array.isArray(k.shown) && k.shown[i] ? 1 : 0);
    s.club.wk = Math.floor(num(k.wk)) >= 0 ? Math.floor(num(k.wk)) : -1;   // 옛 저장에는 없어서 -1(이번 주 기록 없음)
    s.club.wd = Math.max(0, Math.min(5, Math.floor(num(k.wd)) || 0)); s.club.we = Math.max(0, Math.min(CLUB.weekend, Math.floor(num(k.we)) || 0));
    // 반장 선거: 후보는 그 주 것만 써요(망가진 값은 새 선거로)
    { const e = d.el && typeof d.el === 'object' ? d.el : {}, ok = sp => typeof sp === 'string' && (BASE_SPECIES.includes(sp) || NEWCOMERS.some(n => n.k === sp));
      const cand = (Array.isArray(e.cand) ? e.cand : []).slice(0, 3).filter(x => x && ok(x.sp) && EL_PLEDGES[x.p])
        .map(x => ({ sp: x.sp, nm: typeof x.nm === 'string' ? x.nm.replace(/[<>&"'`\\]/g, '').slice(0, 8) : '친구', p: x.p }));
      s.el = cand.length === 3 ? { wk: Math.floor(num(e.wk)) || -1, pick: Number.isInteger(e.pick) && e.pick >= 0 && e.pick < 3 ? e.pick : -1, cand, tier: Number.isInteger(e.tier) ? e.tier : -1 } : freshEl(); }
    // 학교급 사진(졸업식 때 남긴 모습)
    s.snap = {};
    if (d.snap && typeof d.snap === 'object') for (let t = 0; t < TIERS.length; t++) {
      const x = d.snap[t]; if (!x || typeof x !== 'object' || t >= s.tier) continue;
      const f = {}, bs = {};
      for (const kk of Object.keys(FAC)) { f[kk] = Math.max(0, Math.min(SAVE_CAP.lv, Math.floor(num(x.f && x.f[kk]) || 0))); bs[kk] = Math.max(0, Math.min(t, Math.floor(num(x.bs && x.bs[kk]) || 0))); }
      s.snap[t] = { f, bs, st: Math.max(0, Math.min(SAVE_CAP.count, Math.floor(num(x.st)) || 0)), at: Math.max(0, num(x.at) || 0),
        roster: (Array.isArray(x.roster) ? x.roster : []).slice(0, ROSTER_MAX).filter(o => o && typeof o.sp === 'string').map(o => ({ sp: String(o.sp).slice(0, 12), nm: typeof o.nm === 'string' ? o.nm.replace(/[<>&"'`\\]/g, '').slice(0, 8) : '' })) };
    }
  }
  /* ---------- 학급 반장 선거 (로드맵 옛, 그림 작업지시서 11) ----------
     초등학교부터 열려요. 게임 시계로 매주 월요일에 후보 세 명이 공약을 하나씩 들고 나오고, 한 명을 뽑으면 그 공약이 일요일까지 이어져요
     초등학교는 교실 창에서, 중학교부터는 복도 학생회실에서도 열어요. 반장은 지도에서 머리 위에 배지를 달아요
     중학교부터는 명부 학생이 후보로 나오고, 반장이 속한 동아리의 보너스가 두 배가 돼요 */
  const EL_TIER = 1;
  const EL_PLEDGES = {
    tuition: { ic: 'elect_ic_library', em: '📚', t: '수업료 +10%', v: 1.1, say: '다 같이 공부를 열심히 해서 수업료를 올릴게요!' },
    fest: { ic: 'elect_ic_fest', em: '🎈', t: '학교 행사 보상 +20%', v: 1.2, say: '학교 행사를 더 신나게 만들게요!' },
    mission: { ic: 'elect_ic_mission', em: '📝', t: '오늘의 미션 도토리 +100%', v: 2, say: '오늘의 미션을 다 같이 끝내요!' },
    pick: { ic: 'elect_ic_pick', em: '🧺', t: '줍기 도토리 +100%', v: 2, say: '떨어진 도토리를 하나도 남기지 않고 주울게요!' }
  };
  // 대학교 학생회장 선거 공약 말(효과와 숫자는 그대로)
  const EL_SAY_U = { tuition: '스터디 모임을 늘려서 수업료를 올리겠습니다!', fest: '학교 행사를 더 크게, 더 신나게 열겠습니다!', mission: '오늘의 미션, 다 같이 끝내는 캠퍼스를 만들겠습니다!', pick: '캠퍼스에 떨어진 도토리, 한 알도 놓치지 않겠습니다!' };
  for (const k of Object.keys(EL_PLEDGES)) { const s0 = EL_PLEDGES[k].say; Object.defineProperty(EL_PLEDGES[k], 'say', { get: () => uniNow() && EL_SAY_U[k] ? EL_SAY_U[k] : s0, enumerable: true, configurable: true }); }
  function freshEl() { return { wk: -1, pick: -1, cand: [], tier: -1 }; }
  const elOpen = () => !!S && S.tier >= EL_TIER;
  const spName = sp => DEX_NAMES[sp] || (NEWCOMERS.find(n => n.k === sp) || {}).name || '친구';
  // 이번 주 후보 세 명: 공약 넷 가운데 셋, 중학교부터는 명부 학생(동아리에 든 학생 먼저), 그 전에는 만난 동물 친구
  function elMake() {
    const mix = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const ps = mix(Object.keys(EL_PLEDGES)).slice(0, 3);
    let who;
    if (rosterOn() && S.roster.list.length >= 3) who = mix(S.roster.list).sort((a, b) => (b.c >= 0) - (a.c >= 0)).slice(0, 3).map(x => ({ sp: x.sp, nm: x.nm }));
    else who = frRank(mix([...new Set(speciesList())])).slice(0, 3).map(sp => ({ sp, nm: frNm(sp) }));   // 초등학교 후보는 하트가 높은 단짝부터
    while (who.length < 3) who.push({ sp: 'rabbit', nm: spName('rabbit') });
    return who.map((w, i) => ({ sp: w.sp, nm: w.nm, p: ps[i] }));
  }
  // 새 주(또는 학교급이 바뀜)면 새 선거. 바뀌었으면 true
  function elSync() {
    if (!elOpen()) return false;
    const w = gameWeek();
    if (S.el.wk === w && S.el.tier === S.tier && S.el.cand.length === 3) return false;
    S.el = { wk: w, pick: -1, cand: elMake(), tier: S.tier };
    return true;
  }
  const elActive = () => elOpen() && !!S.el && S.el.wk === gameWeek() && S.el.tier === S.tier && S.el.pick >= 0 && !!S.el.cand[S.el.pick];
  const elPres = () => elActive() ? S.el.cand[S.el.pick] : null;
  function elMult(k) { if (!S || !S.el) return 1; const p = elPres(); return p && p.p === k ? EL_PLEDGES[k].v : 1; }
  function elClub() {
    if (!S || !S.el || !rosterOn()) return -1;
    const p = elPres(); if (!p) return -1;
    const s = S.roster.list.find(x => x.nm === p.nm && x.sp === p.sp);
    return s && s.c >= 0 ? s.c : -1;
  }
  const elWho = c => rosterOn() || (c.nm && c.nm !== spName(c.sp)) ? `${c.nm}(${spName(c.sp)})` : spName(c.sp);
  const elLeft = () => 7 - Math.floor(((gameNow() + KST_MS - Date.UTC(2026, 0, 5)) % 604800000 + 604800000) % 604800000 / 86400000);   // 다음 월요일까지 날 수(1~7)
  const elIc = (k, px) => IMG(EL_PLEDGES[k].ic) ? `<img src="${IMG(EL_PLEDGES[k].ic)}" alt="" draggable="false" style="width:${px}px;height:${px}px">` : `<span style="font-size:${Math.round(px * 0.7)}px">${EL_PLEDGES[k].em}</span>`;
  function openElect() {
    if (!elOpen()) { toast('반장 선거는 초등학교부터 열려요'); return; }
    if (rt.paused || rt.modalOpen) return;
    if (elSync()) save();
    renderElect();
    openModal($('#mElect'));
    sfx('tap');
  }
  function renderElect() {
    const m = $('#mElect'); if (!m || !S.el) return;
    const bg = IMG('elect_bg'); $('#elHead').style.backgroundImage = bg ? `url("${bg}")` : '';
    m.style.setProperty('--el-card-l', IMG('elect_card_light') ? `url("${IMG('elect_card_light')}")` : 'none');
    m.style.setProperty('--el-card-d', IMG('elect_card_dark') ? `url("${IMG('elect_card_dark')}")` : 'none');
    const pres = elPres(), mid = rosterOn();
    $('#elLead').textContent = nl(pres
      ? `이번 주 반장은 ${elWho(pres)}${batchim(elWho(pres)) ? '이에요' : '예요'}! 일요일까지 ${EL_PLEDGES[pres.p].t}.` + (mid ? (elClub() >= 0 ? ` ${CLUBS[elClub()].name} 보너스도 +100%예요.` : ' 반장이 동아리에 들면 그 동아리 보너스가 +100% 늘어나요.') : '')
      : '이번 주 후보 세 명이에요. 한 명을 뽑으면 그 공약이 일요일까지 이어져요.' + (mid ? ' 반장이 속한 동아리는 보너스가 +100% 늘어나요.' : ''));
    $('#elCands').innerHTML = S.el.cand.map((c, i) => {
      const P = EL_PLEDGES[c.p], on = pres && S.el.pick === i, club = mid ? (S.roster.list.find(x => x.nm === c.nm && x.sp === c.sp) || {}).c : -1;
      return `<div class="el-card${on ? ' pick' : pres ? ' dim' : ''}">` + (on && IMG('elect_badge') ? `<img class="el-badge-on" src="${IMG('elect_badge')}" alt="">` : '') +
        `<span class="el-av">${kidAvatar(c.sp)}</span><b class="el-nm">${esc(c.nm)}</b>${mid || c.nm !== spName(c.sp) ? `<small class="el-sp">${esc(spName(c.sp))}${club >= 0 ? `, ${CLUBS[club].name}` : ''}</small>` : ''}` +
        `<span class="el-ic">${elIc(c.p, 34)}</span><span class="el-pl">${P.t}</span><small class="el-say">${P.say}</small>` +
        (on ? '<span class="el-won">반장</span>' : pres ? '' : `<button class="cta small" type="button" data-el="${i}" aria-label="${esc(c.nm)} 뽑기, 공약 ${P.t}">뽑기</button>`) + '</div>';
    }).join('');
    $('#elNote').textContent = nl(`다음 선거는 월요일이에요(${elLeft()}일 뒤). 지금까지 반장을 ${S.st.elects}번 뽑았어요.`);
  }
  function elVote(i) {
    if (!elOpen() || rt.paused) return false;
    if (elSync()) { save(); renderElect(); return false; }   // 그사이 새 주가 됐어요
    if (S.el.pick >= 0 || !S.el.cand[i]) return false;
    S.el.pick = i;
    S.st.elects += 1; if (S.tier >= 2) S.st.elMid += 1;
    const c = S.el.cand[i];
    { const f = frOf(c.sp); if (f) { f.n.el += 1; const it = frAddP(c.sp, BF.elect, true); if (it.length) setTimeout(() => toast(it.map(x => x.t).join('\n')), 1600); } }
    sfx('quest'); buzz([20, 40, 20]);
    save(); renderElect(); elBadge(); renderHUD();
    if (rt.tab === 'club') renderClub();
    toast(`${elWho(c)} 반장이 뽑혔어요! 일요일까지 ${EL_PLEDGES[c.p].t}`);
    return true;
  }
  // 지도: 반장인 동물 친구 한 명의 머리 위에 배지
  function elBadge() {
    rt.kids.forEach(k => { const b = k.g.querySelector('.el-badge'); if (b) b.remove(); });
    const p = elPres(), u = IMG('elect_badge'); if (!p || !u) return;
    const k = rt.kids.find(x => x.sp === p.sp); if (!k) return;
    const im = document.createElementNS(NS, 'image');
    im.setAttribute('class', 'el-badge'); im.setAttribute('href', u);
    const ar = CHR_AR['chr_' + p.sp] || 0.75, top = 11.5 - Math.min(24, 21 / ar);   // kidSVG와 같은 그림 높이
    im.setAttribute('x', '-6'); im.setAttribute('y', (top - 10).toFixed(1)); im.setAttribute('width', '12'); im.setAttribute('height', '12');
    k.g.appendChild(im);
  }
  // 1초마다: 새 주면 새 선거를 알려요
  function elTick() {
    if (!elOpen()) return;
    if (elSync()) { save(); elBadge(); if (rt.modalOpen === $('#mElect')) renderElect(); rt.elNews = true; }
    // 새 선거 알림은 다른 알림과 창이 없을 때 띄워요(자리 비운 도토리 안내 같은 것을 덮지 않게)
    if (rt.elNews && $('#toast').hidden && !rt.modalOpen && !rt.cereOn && !rt.paused && !gameSceneOpen()) { rt.elNews = false; toast(S.tier >= 2 ? '새 반장 선거가 열렸어요!\n교실이나 복도의 학생회실에서 후보를 만나 보세요' : '새 반장 선거가 열렸어요!\n교실을 눌러 후보를 만나 보세요'); }
    if (rt.elBadgeT !== S.el.pick + ':' + rt.kids.length) { rt.elBadgeT = S.el.pick + ':' + rt.kids.length; elBadge(); }
  }
  /* ---------- 공부 2단계: 과학 탐구 실험(과학 공부), 책 읽기(국어 공부) ----------
     과학 탐구 실험: 초등학교부터, 과학실에서 하루 한 번. 재료 둘을 골라 섞으면 결과 카드(20종)나 실패 카드(4종)가 나와 실험 노트에 모여요
       성공하면 수업료 15분치와 과학 XP 30, 실패는 과학 XP 10, 새 카드면 황금 도토리 1. 재료는 처음 4개, 과학실 Lv.5, 10, 15에 하나씩
       같은 재료 둘은 늘 실패하고, 무지개 깃털과 버섯 포자도 실패예요(짝은, 그림은 작업지시서 18)
     책 읽기: 유치원부터, 도서관에서. 책 한 권 고르면 15분 뒤 다 읽어요(앱을 꺼도 가요). 국어 XP 20과 한 줄 감상. 하루 3권(작업지시서 29-1 책 그림) */
  const LAB = { tier: 1, xp: 45, xpF: 15, min: 15, gold: 1 };
  const LAB_IN = [
    { k: 'dew', name: '이슬 방울', lv: 1, c: '#8FD0EE' }, { k: 'acorn', name: '도토리 가루', lv: 1, c: '#C99A62' },
    { k: 'petal', name: '꽃잎', lv: 1, c: '#F2A7C2' }, { k: 'salt', name: '소금 결정', lv: 1, c: '#DDE6EC' },
    { k: 'spore', name: '버섯 포자', lv: 5, c: '#C9B48A' }, { k: 'firefly', name: '반딧불 빛', lv: 10, c: '#F2DA6A' },
    { k: 'feather', name: '무지개 깃털', lv: 15, c: '#B9A6F0' }
  ];
  const LAB_CARDS = {
    r01: '무지개 거품', r02: '작은 화산', r03: '반짝 결정', r04: '꽃 비누방울', r05: '빛나는 이끼', r06: '솜사탕 구름', r07: '꿀 젤리',
    r08: '눈송이 결정', r09: '떠다니는 씨앗', r10: '별빛 물약', r11: '색이 바뀌는 잉크', r12: '통통 튀는 공', r13: '꽃향기 연기', r14: '얼음꽃',
    r15: '반딧불 램프', r16: '작은 버섯 우산', r17: '도토리 로켓', r18: '비 오는 유리병', r19: '오로라 병', r20: '쑥쑥 자라는 새싹',
    f01: '펑! 회색 연기', f02: '넘친 초록 거품', f03: '까맣게 탄 숯', f04: '쏟아진 비커'
  };
  const LAB_KEYS = Object.keys(LAB_CARDS);   // 노트 순서: 결과 20장 뒤에 실패 4장
  // 짝(재료 번호가 작은 쪽 먼저). 같은 재료 둘은 LAB_DBL
  const LAB_MIX = { '0+1': 'r20', '0+2': 'r04', '0+3': 'r03', '1+2': 'r07', '1+3': 'r02', '2+3': 'r11',
    '0+4': 'r05', '1+4': 'r16', '2+4': 'r13', '3+4': 'r06',
    '0+5': 'r15', '1+5': 'r17', '2+5': 'r10', '3+5': 'r14', '4+5': 'r12',
    '0+6': 'r01', '1+6': 'r09', '2+6': 'r18', '3+6': 'r08', '5+6': 'r19', '4+6': 'f02' };
  const LAB_DBL = ['f04', 'f03', 'f01', 'f03', 'f02', 'f01', 'f04'];
  const LAB_SAY = { r01: '방울마다 무지개가 떠요!', r02: '보글보글 거품 화산이에요', r03: '햇빛에 반짝반짝 빛나요', r04: '꽃잎이 든 비누방울이 둥실둥실', r05: '어두운 데서 초록빛이 나요',
    r06: '폭신한 구름이 생겼어요', r07: '말랑말랑 달콤한 젤리예요', r08: '작은 눈송이가 자랐어요', r09: '씨앗이 바람을 타고 날아요', r10: '병 속에 별이 반짝여요',
    r11: '흔들 때마다 색이 바뀌어요', r12: '바닥에 닿으면 통통 튀어요', r13: '좋은 냄새가 솔솔 퍼져요', r14: '유리 위에 얼음꽃이 피었어요', r15: '반딧불이 램프가 됐어요',
    r16: '작은 우산 버섯이 쏙 올라왔어요', r17: '도토리가 슝 날아올라요', r18: '병 속에 작은 비가 내려요', r19: '병 속에 오로라가 일렁여요', r20: '새싹이 쑥쑥 자라요',
    f01: '펑! 연기만 났어요', f02: '거품이 넘쳐 버렸어요', f03: '까맣게 타 버렸어요', f04: '앗, 비커가 넘어졌어요' };
  const freshLab = () => ({ day: '', got: {}, pairs: {}, last: null, st: { n: 0, ok: 0 } });   // pairs: 해 본 짝('0+2')
  const labOpen = () => !!S && S.tier >= LAB.tier;
  const labReady = () => labOpen() && S.f.science >= 1;
  const labInOn = i => !!S && S.f.science >= LAB_IN[i].lv;
  const labDone = () => S.lab.day === gameToday();
  const labCount = () => S && S.lab ? LAB_KEYS.filter(k => S.lab.got[k] > 0).length : 0;
  const labOf = (a, b) => a === b ? LAB_DBL[a] : LAB_MIX[Math.min(a, b) + '+' + Math.max(a, b)];
  const labCard = (k, px) => IMG('lab_' + k.replace(/^r/, 'r_').replace(/^f/, 'f_')) ? `<img src="${IMG('lab_' + k.replace(/^r/, 'r_').replace(/^f/, 'f_'))}" alt="" draggable="false"${px ? ` style="width:${px}px;height:${px}px"` : ''}>` : `<span class="lab-em">${k[0] === 'f' ? '💨' : '✨'}</span>`;
  const labInImg = (i, px) => IMG('lab_in_' + LAB_IN[i].k) ? `<img src="${IMG('lab_in_' + LAB_IN[i].k)}" alt="" draggable="false" style="width:${px}px;height:${px}px">` : `<i class="lab-dot" style="background:${LAB_IN[i].c}"></i>`;
  // 섞기. 돌려주는 값: { r, ok, isNew, v(도토리), xp } 또는 null
  function labRun(a, b) {
    if (!labReady() || rt.paused) return null;
    if (labDone()) { toast('오늘 실험은 끝났어요.\n내일 또 해요'); return null; }
    if (!LAB_IN[a] || !LAB_IN[b] || !labInOn(a) || !labInOn(b)) return null;
    const r = labOf(a, b); if (!r) return null;
    const ok = r[0] === 'r', isNew = !(S.lab.got[r] > 0), pk = Math.min(a, b) + '+' + Math.max(a, b);
    S.lab.got[r] = (S.lab.got[r] || 0) + 1; S.lab.pairs[pk] = 1;
    S.lab.day = gameToday(); S.lab.last = { a, b, r, n: isNew ? 1 : 0 };
    S.lab.st.n += 1; if (ok) S.lab.st.ok += 1;
    let v = 0;
    if (ok) { v = Math.round(minAcorns(LAB.min) * (1 + deptX('science') / 100)); S.budget += v; earn(v); }
    const xp = acGain('sci', ok ? LAB.xp + (wxIs('fog') ? 15 : 0) : LAB.xpF);   // 안개 낀 날 성공 +15
    if (isNew) addGold(LAB.gold);
    save(); renderHUD(); checkQuests(); renderMini();
    return { r, ok, isNew, v, xp };
  }
  function openLab() {
    if (!labOpen()) { toast(`과학 탐구 실험은 ${TIERS[LAB.tier].name}부터 열려요`); return; }
    if (S.f.science < 1) { toast(`${eul(FAC.science.name)} 지으면 실험을 할 수 있어요`); return; }
    if (rt.paused || rt.modalOpen) return;
    rt.labSel = [-1, -1]; rt.labView = 'mix'; rt.labPage = 0; rt.labBusy = false;
    renderLab(); openModal($('#mLab')); sfx('tap');
  }
  function renderLab() {
    const m = $('#mLab'); if (!m || !S.lab) return;
    const bg = IMG('lab_bg'); $('#labHead').style.backgroundImage = bg ? `url("${bg}")` : '';
    m.style.setProperty('--lab-note-l', IMG('lab_note_light') ? `url("${IMG('lab_note_light')}")` : 'none');
    m.style.setProperty('--lab-note-d', IMG('lab_note_dark') ? `url("${IMG('lab_note_dark')}")` : 'none');
    $$('#labSeg [data-lv]').forEach(b => b.setAttribute('aria-checked', b.dataset.lv === rt.labView ? 'true' : 'false'));
    $('#labSegN').textContent = `${labCount()}/${LAB_KEYS.length}`;
    $('#labMixPane').hidden = rt.labView !== 'mix'; $('#labNotePane').hidden = rt.labView !== 'note';
    if (rt.labView === 'note') return renderLabNote();
    const done = labDone(), sel = rt.labSel, L = S.lab.last;
    const slot = j => sel[j] >= 0 ? `${labInImg(sel[j], 44)}<small>${LAB_IN[sel[j]].name}</small>` : `<b>+</b><small>재료 ${j + 1}</small>`;
    $('#labSlot0').innerHTML = slot(0); $('#labSlot1').innerHTML = slot(1);
    for (const id of ['#labSlot0', '#labSlot1']) $(id).classList.toggle('has-img', !!$(id).querySelector('img'));
    $('#labSlot0').setAttribute('aria-disabled', done ? 'true' : 'false'); $('#labSlot1').setAttribute('aria-disabled', done ? 'true' : 'false');
    const fl = IMG('lab_flask'), mx = IMG('lab_mix');
    const tint = sel[0] >= 0 && sel[1] >= 0 ? `linear-gradient(90deg, ${LAB_IN[sel[0]].c}, ${LAB_IN[sel[1]].c})` : sel[0] >= 0 ? LAB_IN[sel[0]].c : sel[1] >= 0 ? LAB_IN[sel[1]].c : 'transparent';
    $('#labFlask').innerHTML = `<i class="lab-liq" style="background:${tint}"></i>${fl ? `<img class="lab-fl" src="${fl}" alt="">` : '<span class="lab-em">⚗️</span>'}${mx ? `<img class="lab-mx" src="${mx}" alt="">` : ''}`;
    $('#labIns').innerHTML = LAB_IN.map((x, i) => { const on = labInOn(i), pick = sel.includes(i);
      return `<button class="lab-in${pick ? ' pick' : ''}${on ? '' : ' lock'}" type="button" data-li="${i}" aria-disabled="${on && !done ? 'false' : 'true'}" aria-label="${x.name}${on ? '' : `, ${FAC.science.name} Lv.${x.lv}에 열려요`}">` +
        `${labInImg(i, 40)}<small>${on ? x.name : `Lv.${x.lv}`}</small>${on ? '' : '<i class="lab-lock" aria-hidden="true">🔒</i>'}</button>`; }).join('');
    let lead, out = '';
    if (done && L) {
      lead = '오늘 실험은 끝났어요.\n내일 또 새 짝을 섞어 봐요.';
      out = `<div class="lab-card${L.r[0] === 'f' ? ' fail' : ''}">${labCard(L.r, 92)}<b>${LAB_CARDS[L.r]}</b><small>${LAB_IN[L.a].name} + ${LAB_IN[L.b].name}</small></div>`;
    } else if (sel[0] >= 0 && sel[1] >= 0) {
      const r = labOf(sel[0], sel[1]), pk = Math.min(sel[0], sel[1]) + '+' + Math.max(sel[0], sel[1]);
      lead = S.lab.pairs[pk] ? `이 짝은 해 봤어요.\n그때는 「${LAB_CARDS[r]}」${r[0] === 'f' ? '였어요' : '이 나왔어요'}.` : '두 재료를 섞어 볼까요?\n처음 보는 결과면 황금 도토리도 받아요.';
    } else lead = nl(`재료 두 가지를 골라 섞어요. 하루에 한 번이에요. 같은 재료 둘은 조심해요!`);
    $('#labLead').textContent = lead;
    $('#labOut').innerHTML = out; $('#labOut').hidden = !out;
    const can = !done && sel[0] >= 0 && sel[1] >= 0 && !rt.labBusy;
    $('#labGo').setAttribute('aria-disabled', can ? 'false' : 'true');
    $('#labGo').textContent = done ? '내일 또 해요' : '섞어 보기';
    const next = LAB_IN.find((x, i) => !labInOn(i));
    $('#labNote2').textContent = nl(`실험 ${S.lab.st.n}번, 노트 ${labCount()}/${LAB_KEYS.length}장.` + (next ? ` ${FAC.science.name} Lv.${next.lv}이면 ${eul(next.name)} 쓸 수 있어요.` : ''));
  }
  function renderLabNote() {
    const per = 12, pages = Math.ceil(LAB_KEYS.length / per);
    rt.labPage = Math.max(0, Math.min(pages - 1, rt.labPage || 0));
    const ks = LAB_KEYS.slice(rt.labPage * per, rt.labPage * per + per);
    // 노트 그림의 칸 자리(1024×768 기준): 왼쪽 쪽 3칸, 오른쪽 쪽 3칸, 두 줄
    const X = [78, 216, 354, 550, 688, 825], Y = [154, 391], W = 121, H = 198;
    // 칸 순서: 왼쪽 쪽 위 3칸, 왼쪽 쪽 아래 3칸, 오른쪽 쪽 위 3칸, 오른쪽 쪽 아래 3칸
    $('#labNote').innerHTML = ks.map((k, i) => { const col = (i < 6 ? 0 : 3) + (i % 3);
      const x = X[col] / 1024 * 100, y = Y[(i % 6) < 3 ? 0 : 1] / 768 * 100, got = S.lab.got[k] > 0;
      return `<div class="lab-slot${got ? ' got' : ''}" style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%;width:${(W / 1024 * 100).toFixed(2)}%;height:${(H / 768 * 100).toFixed(2)}%" title="${got ? LAB_CARDS[k] : '아직 몰라요'}">` +
        (got ? `${labCard(k)}<b>${LAB_CARDS[k]}</b>` : '<em>?</em>') + '</div>'; }).join('');
    $('#labPg').textContent = `${rt.labPage + 1}/${pages}`;
    $('#labPrev').setAttribute('aria-disabled', rt.labPage > 0 ? 'false' : 'true');
    $('#labNext').setAttribute('aria-disabled', rt.labPage < pages - 1 ? 'false' : 'true');
    $('#labNoteTx').textContent = nl(`모은 카드 ${labCount()}/${LAB_KEYS.length}장. 다 모으면 칭호 「꼬마 과학자」를 받아요.`);
  }
  function labTap(i) {
    if (labDone() || rt.labBusy || !labInOn(i)) { if (!labInOn(i)) toast(`${FAC.science.name} Lv.${LAB_IN[i].lv}이면 ${eul(LAB_IN[i].name)} 쓸 수 있어요`); return; }
    const s = rt.labSel;
    if (s[0] < 0) s[0] = i; else if (s[1] < 0) s[1] = i; else { s[0] = s[1]; s[1] = i; }
    sfx('tap'); renderLab();
  }
  function labGo() {
    const s = rt.labSel; if (labDone() || rt.labBusy || s[0] < 0 || s[1] < 0) return;
    rt.labBusy = true; renderLab();
    const fl = $('#labFlask'); fl.classList.add('mixing'); sfx('leaf'); buzz(12);
    setTimeout(() => {
      fl.classList.remove('mixing');
      const res = labRun(s[0], s[1]); rt.labBusy = false; rt.labSel = [-1, -1];
      if (rt.modalOpen === $('#mLab')) renderLab();
      if (!res) return;
      sfx(res.ok ? 'quest' : 'tap'); buzz(res.ok ? [20, 40, 20] : 30);
      const items = [{ ic: '', t: `과학 XP +${res.xp}` }];
      if (res.v) items.unshift({ ic: 'acorn', t: `도토리 +${fmt(res.v)}` });
      if (res.isNew) items.push({ ic: 'gold', t: `새 카드! 황금 도토리 +${LAB.gold}` });
      closeModal($('#mLab'));
      showReward({ title: res.ok ? '실험 성공!' : '앗, 실패!', sub: LAB_SAY[res.r], art: labCard(res.r, 120), big: LAB_CARDS[res.r], bigSub: res.isNew ? '실험 노트에 새로 붙었어요' : '', items });
    }, rt.reduced ? 80 : 1100);
  }

  const BOOKS = [
    { k: 'acorn', name: '도토리 모험', em: '🌰', c: '#A8743F', say: '작은 도토리도 멀리 갈 수 있대요.' },
    { k: 'rabbit', name: '토끼의 달', em: '🐰', c: '#3B4A7A', say: '달에도 친구가 살고 있을까요?' },
    { k: 'seasons', name: '숲의 사계절', em: '🌳', c: '#5C9A55', say: '나무는 계절마다 옷을 갈아입어요.' },
    { k: 'sea', name: '바다 친구들', em: '🐳', c: '#4A86C5', say: '고래랑 같이 헤엄치고 싶어요.' },
    { k: 'stars', name: '별자리 이야기', em: '⭐', c: '#7A5AB0', say: '밤하늘에 곰이 숨어 있었어요!' },
    { k: 'bread', name: '숲속 빵집', em: '🍞', c: '#E08A3C', say: '읽는 내내 배가 고팠어요.' },
    { k: 'train', name: '꼬마 기차', em: '🚂', c: '#C9483E', say: '칙칙폭폭, 포기하지 않는 기차예요.' },
    { k: 'garden', name: '작은 정원', em: '🌷', c: '#E58FB0', say: '꽃에 물을 주면 웃는 것 같아요.' },
    { k: 'dino', name: '공룡 시대', em: '🦕', c: '#B8933F', say: '공룡이 이렇게 컸다니요!' },
    { k: 'snow', name: '눈 오는 날', em: '⛄', c: '#8CC3E3', say: '눈사람에게 목도리를 둘러 줬어요.' },
    { k: 'music', name: '숲속 음악회', em: '🎻', c: '#E7C03A', say: '책에서 노랫소리가 들리는 것 같아요.' },
    { k: 'robot', name: '친절한 로봇', em: '🤖', c: '#8E969E', say: '로봇도 꽃을 좋아한대요.' }
  ];
  // 대학교에서는 책 12권이 전공 서적이에요. 열쇠(k)와 저장은 그대로이고 이름과 한마디만 바뀌어요. 표지 그림(book_u_<k>, 작업지시서 69)이 오면 그 그림을 써요
  const BOOKS_U = {
    acorn: ['도토리 경제학 원론', '도토리 한 알에도 값이 매겨지는 까닭을 알았어요.'], rabbit: ['달과 행성', '달의 뒷면은 생각보다 울퉁불퉁하대요.'],
    seasons: ['숲 생태학', '나무 한 그루에 천 가지 생물이 기대어 살아요.'], sea: ['해양 생물학', '고래의 노래에도 사투리가 있대요.'],
    stars: ['천체 물리학 입문', '별빛은 아주 오래전에 출발한 편지래요.'], bread: ['식품 영양학', '읽는 내내 배가 고팠어요. 이번에도요.'],
    train: ['기계 공학 개론', '톱니 하나가 빠지면 기차가 서요.'], garden: ['원예학', '물은 아침에 주는 게 좋대요. 꽃도 저도요.'],
    dino: ['고생물학', '뼈 한 조각으로 키를 알아낸대요.'], snow: ['기상학', '눈 결정은 하나도 같은 게 없대요.'],
    music: ['음악 이론', '쉼표도 음악이라는 걸 배웠어요.'], robot: ['인공지능 개론', '로봇도 틀리면서 배운대요.'] };
  for (const B of BOOKS) for (const [f, i] of [['name', 0], ['say', 1]]) { const t0 = B[f]; Object.defineProperty(B, f, { get: () => uniNow() && BOOKS_U[B.k] ? BOOKS_U[B.k][i] : t0, enumerable: true, configurable: true }); }
  const RD = { min: 15, perDay: 3, xp: 25 };
  const freshRd = () => ({ day: '', n: 0, cur: '', at: 0, got: {}, st: 0, q: [] });   // q: 예약한 책(읽는 책이 끝나면 이어서)
  const rdReady = () => !!S && S.f.library >= 1;
  function rdDay() { const t = gameToday(); if (dayRoll(S.rd, t)) { S.rd.n = 0; } }
  const rdLeft = () => { rdDay(); return Math.max(0, rdPerDay() - S.rd.n); };
  const rdEnd = () => S.rd.at + (S.rd.m || RD.min) * 60000;   // m: 읽기 시작할 때 정한 분(비 오는 날 10분)
  const rdRemain = () => S.rd.cur ? Math.max(0, rdEnd() - gameNow()) : 0;
  const bookOf = k => BOOKS.find(b => b.k === k);
  const bookKey = b => uniNow() && IMG('book_u_' + b.k) ? 'book_u_' + b.k : 'book_' + b.k;
  const bookCover = (b, cls) => IMG(bookKey(b)) ? `<img class="${cls || 'bk-img'}" src="${IMG(bookKey(b))}" alt="" draggable="false">` : `<span class="bk-fb ${cls || ''}" style="--bk:${b.c}"><i>${b.em}</i></span>`;
  function rdStart(k) {
    const b = bookOf(k); if (!b || !rdReady() || rt.paused) return false;
    if (rdLeft() <= 0) { toast(S.rd.cur ? `지금 「${bookOf(S.rd.cur).name}」${batchim(bookOf(S.rd.cur).name) ? '을' : '를'} 읽고 있어요.\n책은 하루 ${rdPerDay()}권까지예요` : `책은 하루 ${rdPerDay()}권까지예요.\n내일 또 읽어요`); return false; }
    if (S.rd.cur) {   // 읽는 중에 고르면 예약: 지금 책이 끝난 때부터 이어서 읽어요. 하루 권수는 예약할 때 세요
      S.rd.n += 1; S.rd.q.push(k);
      sfx('tap'); save(); renderRead(); renderMini();
      toast(`「${b.name}」${batchim(b.name) ? '을' : '를'} 예약했어요.\n지금 책을 다 읽으면 이어서 읽어요`);
      return true;
    }
    const first = S.rd.st === 0;   // 처음 읽는 책은 기다리지 않고 바로 다 읽어요(1장 '책 한 권 읽기'가 15분 벽이 되지 않게, 텃밭의 무료 바로 자라기처럼)
    S.rd.n += 1; S.rd.cur = k; S.rd.at = gameNow(); S.rd.m = rdMinNow();
    if (first) {
      S.rd.at = gameNow() - S.rd.m * 60000;
      sfx('quest'); rdSettle();
      const t = rt.rdNews; rt.rdNews = ''; renderRead(); renderMini();
      toast('첫 책은 바로 다 읽었어요!\n' + t);
      return true;
    }
    sfx('tap'); save(); renderRead(); renderMini();
    toast(`「${b.name}」${batchim(b.name) ? '을' : '를'} 읽기 시작했어요.\n${S.rd.m}분 뒤 다 읽어요${S.rd.m < RD.min ? ' (비 오는 날)' : ''}`);
    return true;
  }
  // 다 읽었으면 끝내요. 알림은 다른 알림이 없을 때(1초마다 rdTick)
  function rdSettle() {
    let any = false;
    for (let guard = 0; guard < 9; guard++) {   // 예약한 책이 있으면 앞 책이 끝난 때부터 이어서 읽어요(꺼 둔 동안 여러 권이 끝났을 수 있어요)
      if (!S.rd.cur || gameNow() < rdEnd()) break;
      const end = rdEnd(), b = bookOf(S.rd.cur); S.rd.cur = ''; S.rd.at = 0; S.rd.m = 0;
      if (b) {
        S.rd.got[b.k] = (S.rd.got[b.k] || 0) + 1; S.rd.st += 1;
        const xp = acGain('kor', Math.round((RD.xp + (wxIs('rain') ? 5 : 0)) * (1 + XT.kor.per / 100 * xtLv('kor')) * (1 + deptX('human') / 100)));   // 비 오는 날 +5, 국어 선생님
        const who = speciesList()[Math.floor(Math.random() * Math.max(1, speciesList().length))] || 'rabbit';
        rt.rdNews = `「${b.name}」${batchim(b.name) ? '을' : '를'} 다 읽었어요! 국어 XP +${xp}\n${spName(who)}: "${b.say}"`;
        any = true;
      }
      const nx = S.rd.q.shift(); if (nx && bookOf(nx)) { S.rd.cur = nx; S.rd.at = end; S.rd.m = rdMinNow(); }
    }
    if (!any) return false;
    save(); checkQuests(); renderMini();
    if (rt.modalOpen === $('#mRead')) renderRead();
    return true;
  }
  function rdUnqueue(i) {   // 예약 취소: 예약할 때 센 하루 권수를 돌려줘요
    if (!S.rd.q[i]) return;
    S.rd.q.splice(i, 1); rdDay(); S.rd.n = Math.max(0, S.rd.n - 1);
    sfx('tap'); save(); renderRead(); renderMini();
  }
  function rdTick() {
    if (!S || !S.rd) return;
    rdSettle();
    if (S.rd.cur && rt.modalOpen === $('#mRead')) renderReadBar();
    if (rt.rdNews && $('#toast').hidden && !rt.modalOpen && !rt.cereOn && !rt.paused && !gameSceneOpen()) { const t = rt.rdNews; rt.rdNews = ''; toast(t); }
  }
  function openRead() {
    if (!rdReady()) { toast(`${eul(FAC.library.name)} 지으면 책을 읽을 수 있어요`); return; }
    if (rt.paused || rt.modalOpen) return;
    rdSettle(); renderRead(); openModal($('#mRead')); sfx('tap');
  }
  function renderReadBar() {
    const bar = $('#rdNow'); if (!bar) return;
    const b = S.rd.cur && bookOf(S.rd.cur);
    bar.hidden = !b; if (!b) return;
    const left = rdRemain(), tot = RD.min * 60000, m = Math.ceil(left / 60000);
    bar.innerHTML = `${bookCover(b, 'bk-mini')}<span class="rd-tx"><b>「${b.name}」 읽는 중</b><small>${left > 0 ? `${m}분 남았어요` : '다 읽었어요!'}</small><span class="ac-bar"><i style="width:${Math.round(100 * (1 - left / tot))}%"></i></span></span>`;
  }
  function waitTicketButtons(attr) {
    const ts = TK.filter(t => S.tk[t.k] > 0);
    return ts.length ? `<div class="btn-row" style="flex-wrap:wrap">${ts.map(t => `<button class="btn-sub small" type="button" ${attr}="${t.k}">${t.name} (${S.tk[t.k]}장)</button>`).join('')}</div><p class="fine">남은 시간보다 긴 단축권을 쓰면 남는 시간은 사라져요.</p>` : '';
  }
  function readUseTicket(k) {
    const t = TK.find(x => x.k === k);
    if (!t || !S.rd.cur || rdRemain() <= 0 || S.tk[k] < 1) return;
    S.tk[k]--; S.st.tkUsed = (S.st.tkUsed || 0) + 1; S.rd.at = Math.max(1, S.rd.at - t.sec * 1000);
    if (!rdSettle()) save(); renderRead();
  }
  function renderRead() {
    if (!$('#mRead') || !S.rd) return;
    const left = rdLeft(), busy = !!S.rd.cur;
    $('#rdLead').textContent = nl(busy ? (left > 0 ? `책은 한 권씩 읽어요. 읽는 중에 다른 책을 누르면 예약돼요.` : `책은 한 권씩 읽어요. 오늘 고를 수 있는 책은 모두 골랐어요.`) : left > 0 ? `읽을 책을 골라요. ${RD.min}분 뒤 다 읽고 국어 학력이 올라요. 앱을 꺼도 읽어요.` : `오늘은 책을 ${rdPerDay()}권 다 읽었어요. 내일 또 와요.`);
    renderReadBar();
    $('#rdTickets').innerHTML = (busy && rdRemain() > 0 ? waitTicketButtons('data-read-tk') : '') +
      S.rd.q.map((k, i) => { const qb = bookOf(k); return qb ? `<div class="rd-q"><span>다음: 「${esc(qb.name)}」 (예약)</span><button type="button" class="btn-sub small" data-rd-unq="${i}" aria-label="${esc(qb.name)} 예약 취소">취소</button></div>` : ''; }).join('');
    $('#rdBooks').innerHTML = BOOKS.map(b => { const n = S.rd.got[b.k] || 0, now = S.rd.cur === b.k;
      return `<button class="rd-book${now ? ' now' : ''}" type="button" data-bk="${b.k}" aria-disabled="${left > 0 ? 'false' : 'true'}" aria-label="${b.name}${n ? `, ${n}번 읽음` : ''}${busy && left > 0 ? ', 눌러서 예약' : ''}">${bookCover(b)}<b>${b.name}</b><small>${now ? '읽는 중' : S.rd.q.includes(b.k) ? '예약함' : n ? `${n}번 읽음` : '새 책'}</small></button>`; }).join('');
    $('#rdNote').textContent = nl(`오늘 남은 책 ${left}/${rdPerDay()}권. 지금까지 ${S.rd.st}권 읽었어요. 한 권에 국어 XP +${Math.round(RD.xp * (1 + XT.kor.per / 100 * xtLv('kor')) * (1 + deptX('human') / 100))}.`);
  }
  // 저장 읽기(공부 2단계)
  function sanitizeStudy2(d, s) {
    s.lab = freshLab();
    const L = d.lab && typeof d.lab === 'object' ? d.lab : null;
    if (L) {
      s.lab.day = typeof L.day === 'string' ? L.day.slice(0, 10) : '';
      if (L.got && typeof L.got === 'object') for (const k of LAB_KEYS) { const v = Math.floor(numIn(L.got[k], 0, 1e6)); if (v > 0) s.lab.got[k] = v; }
      if (L.pairs && typeof L.pairs === 'object') for (const k of Object.keys(L.pairs)) if (/^[0-6]\+[0-6]$/.test(k) && L.pairs[k]) s.lab.pairs[k] = 1;
      const la = L.last;
      if (la && typeof la === 'object' && Number.isInteger(la.a) && Number.isInteger(la.b) && LAB_IN[la.a] && LAB_IN[la.b] && labOf(la.a, la.b) === la.r) s.lab.last = { a: la.a, b: la.b, r: la.r, n: la.n ? 1 : 0 };
      if (L.st && typeof L.st === 'object') { s.lab.st.n = Math.floor(numIn(L.st.n, 0, 1e6)); s.lab.st.ok = Math.min(s.lab.st.n, Math.floor(numIn(L.st.ok, 0, 1e6))); }
    }
    s.rd = freshRd();
    const R = d.rd && typeof d.rd === 'object' ? d.rd : null;
    if (R) {
      s.rd.day = typeof R.day === 'string' ? R.day.slice(0, 10) : '';
      s.rd.n = Math.floor(numIn(R.n, 0, RD.perDay + 2));   // 국어 선생님이면 하루 2권 더
      if (typeof R.cur === 'string' && bookOf(R.cur)) { s.rd.cur = R.cur; s.rd.at = numIn(R.at, 0, Date.now() + 366 * 86400000); s.rd.m = R.m === 10 ? 10 : 0; if (!s.rd.at) s.rd.cur = ''; }   // m
      if (R.got && typeof R.got === 'object') for (const b of BOOKS) { const v = Math.floor(numIn(R.got[b.k], 0, 1e6)); if (v > 0) s.rd.got[b.k] = v; }
      s.rd.st = Math.floor(numIn(R.st, 0, 1e7));
      if (s.rd.cur && Array.isArray(R.q)) s.rd.q = R.q.filter(k => typeof k === 'string' && bookOf(k)).slice(0, 5);   // 예약한 책
    }
  }
