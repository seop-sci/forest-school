  /* ---------- 서버 저장 (GitHub 테스트판) ----------
     GitHub Pages에 올린 index.html은 config.js의 Firebase 설정을 읽어 SDK를 불러오고 window.FOREST_FB에 담아요.
     Claude 화면에는 window.FOREST_FB가 없어서 지금처럼 이 기기의 브라우저에만 저장해요.
     서버 자리 (지키는 규칙은 database.rules.json)
       forest/saves/<내 id>  게임 저장. 나만 읽고 써요
       forest/rank/<내 id>   랭킹 이름과 학교 점수
       forest/stats/<내 id>  테스트 현황 (어디까지 했는지, 얼마나 했는지)
     <내 id>는 Firebase 익명 로그인이 기기(브라우저)마다 만들어 줘요. */
  const VERSION = '5.4.0.1';
  const NT_QUIET = ['5.4.0.1', '5.3.4.8', '5.3.4.7', '5.3.4.6', '5.3.4.5', '5.3.4.4', '5.3.4.3', '5.3.4.2', '5.3.4.1', '5.3.4', '5.3.2.1', '5.3.0.3', '5.3.0.2', '5.3.0.1', '5.2.2', '5.2.1', '5.2.0.2', '5.2.0.1', '5.1.1.3', '5.1.1.2', '5.1.1.1', '5.1.1', '5.0.3.1', '5.0.3', '5.0.2.2', '5.0.2.1', '2.1.20', '2.1.2.2', '2.3.0.1', '2.3.4', '3.2.3', '3.2.4', '3.2.5', '3.3.1', '3.3.2', '3.3.3', '4.4.1.1', '4.4.1.2', '4.4.1.3', '4.4.1.4', '5.0.1.1', '5.0.1.2', '5.0.1.3', '5.0.1.4', '5.0.1.5', '5.0.1.6', '5.0.1.7', '5.0.1.8'];   // 생물 탐사 고침은 공지 없이. 도 공지 없이(공지 줄은 정하면 넣어요). 공지 없이. 공지 줄은 woodani가 정할 때까지 조용히. 공지는 2026-11-16 woodani가 정해서 NOTICES로 옮겼어요. 은 공지를 띄워요. 도 공지 없이. 도 공지 창 없이. 도 공지 창 없이(공지는 그대로). 도 조용히. 도 공지 창 없이(공지 줄을 고르지 않음)
    // 이 버전들은 업데이트해도 공지 창을 띄우지 않아요(공지는 그대로)
  /* 공지사항 (은 이미 올려서 부터): 설정 > 공지사항. 맨 위가 가장 새 공지예요
     패치노트는 자동으로 넣지 않아요. woodani가 검수한 글만 여기에 적어요(CHANGELOG.md는 자세한 기록용이라 따로 있어요)
     접속하면 새 공지 창을 띄워요(올라온 뒤 7일 동안, '일주일간 열지 않기'를 누르면 7일 쉬어요). 업데이트한 뒤 첫 접속에는 쉬는 중이어도 한 번 띄워요 */
  const NOTICES = [
    // 공지(고른 네 줄). 웹 5.3.4.1~5.3.4.8(사진첩, 오늘의 손님, 생물 도감 150종, 고침)을 앱으로 묶음
    { id: '2026-11-23-v540', date: '2026-11-23', tag: '업데이트', title: '5.4.0 업데이트',
      lines: ['오늘의 손님 업데이트', '생물 도감 60종 추가', '사진첩과 계절 사진 미션 추가', '편의 개선과 오류 수정'] },
    // 공지(짧게, woodani 고름). 5.3.2.1 웹 고침, 누르는 곳과 받기, 상점 새 진열과 값 조정, 이달의 꾸미기를 앱으로 묶음
    { id: '2026-11-22-v533', date: '2026-11-22', tag: '업데이트', title: '5.3.3 업데이트',
      lines: ['새 상점 진열과 편의 개선'] },
    // 공지(고른 두 줄). 5.3.2 웹 5.3.1.1과 빨간 점, 처음 안내를 앱으로 묶음
    { id: '2026-11-22-v532', date: '2026-11-22', tag: '업데이트', title: '5.3.2 업데이트',
      lines: ['도감 모두 쓰다듬기 추가', '편의 개선과 오류 수정'] },
    // 공지(고른 세 줄). 5.3.1 살아 있는 숲속 마을
    { id: '2026-11-21-v531', date: '2026-11-21', tag: '업데이트', title: '5.3.1 업데이트',
      lines: ['살아 있는 숲속 마을 업데이트', '자연 소리와 사진 모드 추가', '편의 개선과 오류 수정'] },
    // 공지(한 줄). 웹 5.2.0.1~5.3.0.3을 앱으로 묶음
    { id: '2026-11-20-v530', date: '2026-11-20', tag: '업데이트', title: '5.3.0 업데이트',
      lines: ['학교 행사와 탐험 그래픽 개선'] },
    // 공지(고른 세 줄). 웹 5.1.1.1~5.1.1.4와 앱 뒤 고침을 함께
    { id: '2026-11-19-v520', date: '2026-11-19', tag: '업데이트', title: '5.2.0 업데이트',
      lines: ['논문과 숲속 학회 추가', '연구 나무와 테마 지붕 새 단장', '편의 개선과 오류 수정'] },
    // 공지(고른 세 줄)
    { id: '2026-11-19-v510', date: '2026-11-19', tag: '업데이트', title: '5.1.0 업데이트',
      lines: ['대학원 조교 파견 추가', '모교 기념비 추가', '편의 개선과 오류 수정'] },
    // 공지(고른 세 줄). 웹 5.0.1.1~5.0.1.8을 앱과 함께 하나로
    { id: '2026-11-18-v502', date: '2026-11-18', tag: '업데이트', title: '5.0.2 업데이트',
      lines: ['화면과 안내 새 단장', '설정에 화면 크기 추가', '대학원 균형 조정과 편의 개선'] },
    // 공지(한 줄)
    { id: '2026-11-17-v501', date: '2026-11-17', tag: '업데이트', title: '5.0.1 업데이트',
      lines: ['게임성 개선 및 최적화'] },
    // 공지(세 줄)
    { id: '2026-11-16-v500', date: '2026-11-16', tag: '업데이트', title: '5.0.0 업데이트',
      lines: ['숲속 대학원 오픈', '탐험 새 지역 오픈', '오류 수정 및 편의성 개선'] },
    // 공지(후보로 정했다가 저녁에 '연구 투자는 대학원으로 이동' 줄을 뺌)
    { id: '2026-11-15-v450', date: '2026-11-15', tag: '업데이트', title: '4.5.0 업데이트',
      lines: ['테마 단추와 편의 개선', '체험학습 기념품 확대'] },
    // 공지(고른 세 줄, 웹 ~를 모아 앱과 함께)
    { id: '2026-11-15-v441', date: '2026-11-15', tag: '업데이트', title: '4.4.1 업데이트',
      lines: ['홈 현황판 새 단장', '탐험 화면 다듬기와 빠른 스킵', '편의 개선과 오류 수정'] },
    // 공지(고른 세 줄)
    { id: '2026-11-15-v440', date: '2026-11-15', tag: '업데이트', title: '4.4.0 업데이트',
      lines: ['숲속 탐험대 전체 화면 개편', '심화 탐험과 심화 랭킹 추가', '편의 개선과 오류 수정'] },
    // 공지(고른 두 줄)
    { id: '2026-11-14-v431', date: '2026-11-14', tag: '업데이트', title: '4.3.1 업데이트',
      lines: ['숲속 탐험대 개편', '편의 개선과 오류 수정'] },
    // 공지(괄호 안 설명은 빼고 본문만)
    { id: '2026-11-14-v430', date: '2026-11-14', tag: '업데이트', title: '4.3.0 업데이트',
      lines: ['숲속 탐험대 업데이트', '탐험 랭킹', '편의 개선과 오류 수정'] },
    // 공지(고른 세 줄)
    { id: '2026-11-13-v420', date: '2026-11-13', tag: '업데이트', title: '4.2.0 업데이트',
      lines: ['대축제 업데이트(월 1회 진행)', '연구 투자 업데이트', '편의 개선과 오류 수정'] },
    // 공지(고른 한 줄)
    { id: '2026-11-12-v411', date: '2026-11-12', tag: '업데이트', title: '4.1.1 업데이트',
      lines: ['편의 개선과 오류 수정'] },
    // 공지(고른 세 줄)
    { id: '2026-11-12-v410', date: '2026-11-12', tag: '업데이트', title: '4.1.0 업데이트',
      lines: ['숲속 학교 이야기 추가', '대학 축제, 교환학생의 날, 숲속 장터', '편의 개선과 오류 수정'] },
    // 공지(세 줄)
    { id: '2026-11-11-v400', date: '2026-11-11', tag: '업데이트', title: '4.0.0 업데이트',
      lines: ['숲속 대학교 개교', '단과대학 추가', '각종 안내 글 정돈'] },
    // 공지(고른 한 줄)
    { id: '2026-11-10-v334', date: '2026-11-10', tag: '업데이트', title: '3.3.4 업데이트',
      lines: ['지도 참나무 새 단장과 편의 개선'] },
    // 공지(고른 B안 두 줄)
    { id: '2026-11-09-v330', date: '2026-11-09', tag: '업데이트', title: '3.3.0 업데이트',
      lines: ['학교 건물, 지도, 졸업식 새 단장', '편의 개선과 오류 수정'] },
    // 공지(가장 간단한 것)
    { id: '2026-11-06-v322', date: '2026-11-06', tag: '업데이트', title: '3.2.2 업데이트',
      lines: ['게임 최적화와 편의 개선'] },
    // 공지(고른 A안 세 줄)
    { id: '2026-11-06-v320', date: '2026-11-06', tag: '업데이트', title: '3.2.0 업데이트',
      lines: ['고등학교 수학여행 오픈', '밤 행사 새 배경음악', '게임 최적화와 편의 개선'] },
    // 공지(고른 A안 두 줄)
    { id: '2026-11-05-v312', date: '2026-11-05', tag: '업데이트', title: '3.1.2 업데이트',
      lines: ['학생 모자와 꾸미기 그림 새 단장', '홈 화면 정리와 편의 개선'] },
    // 공지(고른 A안 세 줄)
    { id: '2026-11-05-v311', date: '2026-11-05', tag: '업데이트', title: '3.1.1 업데이트',
      lines: ['고등학교 밤 행사 3종 추가', '진로 상담 대사 개선', '학교 행사 보상 조정과 오류 수정'] },
    // 공지(고른 세 줄)
    { id: '2026-11-04-v310', date: '2026-11-04', tag: '업데이트', title: '3.1.0 업데이트',
      lines: ['진로 상담실 오픈', '숲속 대결 문제 업데이트', '편의 기능 추가와 오류 수정'] },
    // 공지(세 줄)
    { id: '2026-11-03-v300', date: '2026-11-03', tag: '업데이트', title: '3.0.0 업데이트',
      lines: ['숲속 고등학교 개교', '기숙사와 야간 자율학습 추가', '보상 조정과 오류 수정'] },
    // 공지(세 줄)
    { id: '2026-11-03-v235', date: '2026-11-03', tag: '업데이트', title: '2.3.5 업데이트',
      lines: ['비버 선생님 등장', '생물 도감 60종 추가 (90종)', '보상 조정과 오류 수정'] },
    { id: '2026-11-02-v233', date: '2026-11-02', tag: '업데이트', title: '2.3.3 업데이트',
      lines: ['일일 보상과 시간 단축권 정리', '숲속 퍼즐과 숲속 합치기 화면 개선', '게임 이용 편의와 오류 수정'] },
    // 공지(A안 네 줄)
    { id: '2026-11-01-v232', date: '2026-11-01', tag: '업데이트', title: '2.3.2 업데이트',
      lines: ['체험학습 새 단장 (배웅과 마중)', '테마 세트 미리 보기 추가', '숲속 합치기 화면 정리와 새 단계 주문', '오류 수정과 최적화'] },
    // 공지(B안 세 줄)
    { id: '2026-10-31-v231', date: '2026-10-31', tag: '업데이트', title: '2.3.1 업데이트',
      lines: ['뱀과 매 침입자 액션 추가', '숲속 퍼즐과 숲속 합치기 보상 개선', '오류 수정과 화면 다듬기'] },
    // 공지(B안 다섯 줄). 부터는 실제 날짜. 그 앞 공지 날짜는 업데이트 간격이 너무 가까워 보여서 woodani 요청으로 3~5일 간격으로 고쳐 적었어요(id는 그대로라 다시 뜨지 않아요)
    { id: '2026-10-30-v230', date: '2026-10-30', tag: '업데이트', title: '2.3.0 업데이트',
      lines: ['졸업식 장면 새 단장', '새 선생님 3명 추가 (고니 국어, 공작 미술, 알파카 매점)', '숲의 정수로 공사 즉시 완료 추가', '건물 공사 시간 단축', '원할 때 쓰는 즉시 완공 단추 추가', '오류 수정과 안정성 개선'] },
    { id: '2026-10-30-v220', date: '2026-10-30', tag: '업데이트', title: '2.2.0 업데이트',
      lines: ['야간 건물 건설 이벤트 추가', '학교 텃밭 추가', '숲속 생물 탐사 추가', '동아리 대항전 추가', '예전 학교 되돌리기 추가'] },
    // 공지(A안 일곱 줄)
    { id: '2026-10-30-v213', date: '2026-10-25', tag: '업데이트', title: '2.1.3 업데이트',
      lines: ['숲속 패스 추가', '반짝 친구 추가', '랭킹 시즌 추가', '다른 학교 구경과 예시 학교 추가', '날씨 추가', '학부모 쪽지 이야기 추가', '숲속 합치기 에너지 배수와 그림 개선'] },
    // 공지(일곱 줄)
    { id: '2026-10-29-v212', date: '2026-10-22', tag: '업데이트', title: '2.1.2 업데이트',
      lines: ['마을 기부 추가', '매점 간식 뽑기 추가', '간식 도감과 학교 기분 추가', '마을 기부, 간식 도감 업적과 칭호 추가'] },   // 가 고른 네 줄
    { id: '2026-10-29-v211', date: '2026-10-19', tag: '업데이트', title: '2.1.1 업데이트',
      lines: ['단짝 친구, 친밀도, 생일 잔치 추가', '졸업 앨범, 졸업 편지 추가', '유치원, 초등학교, 중학교 건물 외형 변경', '건물마다 하루 1회 즉시 완공, 건설 부스터 추가', '공사 시간 단축', '숲속 대결 종목별 놀이 개선', '메인 퀘스트와 보상 개선'] },
    // 공지(일곱 줄)
    { id: '2026-10-29-v210', date: '2026-10-15', tag: '업데이트', title: '2.1.0 업데이트',
      lines: ['공사 시간과 시간 단축권 추가', '초등학교부터 한 학년이 두 학기로 변경', '숲속 소풍 추가', '초등학교 칭찬 스티커판 추가', '상점 새 단장: 꾸미기 백화점, 문방구, 꾸미기 가게', '밤 모드 추가', '숲속 대결 연출 개선'] },
    // 공지(열한 줄). id를 v201s로 바꿔 공부 시스템을 더한 뒤 한 번 더 띄워요
    { id: '2026-10-28-v201s', date: '2026-10-11', tag: '업데이트', title: '2.0.1 업데이트',
      lines: ['초등학교 학급 반장 선거 추가', '반장 공약으로 한 주 동안 보너스', '중학교 반장은 동아리 보너스 두 배', '졸업식 장면 추가', '이벤트 예정에 다가오는 이벤트 4개 표시',
        '미니게임 탭이 공부 탭으로, 다섯 과목 학교 학력 추가', '과학 탐구 실험과 실험 노트 추가', '도서관 책 읽기 추가', '4주마다 시험 기간과 성적표 추가', "새 미니게임 '숲속 대결'과 대결 순위 추가", '동아리 수학부 추가'] },
    // 공지: 반영하는 날 date를 그날로 맞춰요. 공지는 올라온 날부터 7일간 띄워요
    { id: '2026-10-28-v200', date: '2026-10-06', tag: '업데이트', title: '2.0.0 업데이트',
      lines: ['새 학교급 중학교 추가', '매점 추가', '학생 명부와 학생 능력치 추가', '동아리와 동아리 발표회 추가', '학교 복도 추가', '전학 오는 새 학생 6명과 인사 장면 추가', '지난 학교급 모습 보기 추가', '중학교 메인 퀘스트 추가', '매주 이벤트와 학교 특별 이벤트 추가', '이벤트 보상에 숲의 정수 추가', '이벤트 한정 장식 추가', '이벤트 미션을 더 쉽게 바꿈', '공지사항 추가', '황금 도토리 상점 부스터 묶음 10% 할인', '명예 교장실과 장학재단 업그레이드 추천 표시 추가'] },
    { id: '2026-10-27-v180', date: '2026-10-01', tag: '업데이트', title: '1.8.0 업데이트',
      lines: ["새 미니게임 '숲속 합치기'", '숲속 퍼즐 부스터 추가', '건물 업그레이드 애니메이션 추가', '메인 퀘스트 추가', '테마 배경음악 추가', '메인 화면 지도 개선', '학교 마크, 간판 추가'] }
  ];
  const NT_RECENT = 7 * 86400000, NT_HIDE = 7 * 86400000;   // 공지는 올라온 뒤 7일만 띄워요
  const ntTime = n => Date.parse(n.date + 'T00:00:00+09:00') || 0;
  const ntUnread = () => !!NOTICES[0] && S.nt.seen !== NOTICES[0].id;
  function renderNotice(auto) {
    $('#ntList').innerHTML = NOTICES.map((n, i) => `<details class="nt-item"${i === 0 ? ' open' : ''}><summary><span class="nt-tag">${esc(n.tag)}</span><b>${esc(n.title)}</b><small>${n.date.replace(/-/g, '.')}</small></summary>` +
      `<div class="nt-body">${n.tag === '업데이트' ? `<ol>${n.lines.map(l => `<li>${esc(l)}</li>`).join('')}</ol>` : n.lines.map(l => `<p>${esc(l)}</p>`).join('')}</div></details>`).join('') || '<p class="fine">아직 공지가 없어요</p>';
    $('#ntHide').hidden = !auto;
    const hd = IMG('notice_head'), he = $('#ntHead');   // 공지 창 맨 위 그림(작업지시서 23)
    he.classList.toggle('has-img', !!hd); he.style.backgroundImage = hd ? `url("${hd}")` : '';
  }
  function openNotice(auto) {
    if (!NOTICES.length) { toast('아직 공지가 없어요'); return false; }
    renderNotice(auto);
    S.nt.seen = NOTICES[0].id; save(); renderNoticeDot();
    openModal($('#mNotice'));
    return true;
  }
  function renderNoticeDot() {
    const d = $('#ntDot'); if (d) d.hidden = !ntUnread();
    const ic = $('#ntIc'), u = IMG('ic_notice'); if (ic && u && !ic.src) { ic.src = u; ic.hidden = false; }   // 설정 줄 아이콘(작업지시서 23)
  }
  // 접속할 때: 업데이트한 뒤 첫 접속이면 한 번, 아니면 최근 공지가 있고 쉬는 중이 아닐 때. 새 공지가 올라오면 쉬기도 풀려요
  function noticeWant() {
    const N = NOTICES[0]; if (!S || !N) return false;
    // 한 번 닫은 공지는 다시 저절로 열지 않아요(설정의 빨간 점으로만). 공지 날짜보다 늦게 시작한 학교에는 띄우지 않아요
    if (S.nt.seen === N.id) return false;
    if ((S.born || 0) > ntTime(N) + 86400000) return false;
    return true;
  }
  function noticeAuto() {
    if (!S || !NOTICES.length || rt.ntAuto) return;   // 한 번 켤 때 한 번만(핫픽스 공지를 받은 뒤 다시 불러도)
    if (window.__FOREST_TEST && !window.__NOTICE_AUTO) return;   // 자동 시험에서는 저절로 띄우지 않아요
    // 처음 시작한 학교는 튜토리얼이 먼저예요. 이번 공지는 본 것으로 쳐요
    if (S.tut.st !== 'done' && S.tut.st !== 'skip' && S.q.m < 3) { S.nt.ver = VERSION; S.nt.seen = NOTICES[0].id; save(); renderNoticeDot(); return; }
    if ((S.born || 0) > ntTime(NOTICES[0]) + 86400000 && S.nt.seen !== NOTICES[0].id) { S.nt.ver = VERSION; S.nt.seen = NOTICES[0].id; save(); renderNoticeDot(); return; }   // 공지보다 늦게 시작한 학교
    if (!noticeWant()) return;
    S.nt.ver = VERSION; rt.ntAuto = true;
    queueModal(() => openNotice(true));
  }
  const CLOUD_PUSH = 60000;   // 바뀐 게 있으면 60초마다 올려요(20초에서 늘림, 서버 내려받기 줄이기). 화면을 내리거나 닫을 때, 큰 일(cloudSoon)은 바로 올려요
  const STATS_PUSH = 60000;   // 테스트 현황은 1분마다
  const CLOUD_WAIT = 15000;   // 서버가 이만큼 답이 없으면 이 기기에만 저장해요
  const hasCloudBuild = () => typeof window.FOREST_FB !== 'undefined';
  const cloudOn = () => Cloud.state === 'on';
  const waitFor = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no({ code: 'timeout' }), ms))]);
  // 서버에 못 붙을 때 설정 화면의 '저장 위치'에 보여 줄 까닭
  const CLOUD_ERR = {
    // 이용자에게는 쉬운 말과 짧은 오류 이름만(문의할 때 알려 주면 원인을 찾아요)
    anon: '서버에 연결하지 못했어요. 잠시 뒤에 다시 해 보세요(오류 anon)',
    key: '서버에 연결하지 못했어요. 잠시 뒤에 다시 해 보세요(오류 key)',
    nourl: '서버에 연결하지 못했어요. 잠시 뒤에 다시 해 보세요(오류 url)',
    rules: '서버에 연결하지 못했어요. 잠시 뒤에 다시 해 보세요(오류 rules)',
    net: '인터넷 연결이 없거나 서버가 답하지 않아요',
    load: '서버에 연결하지 못했어요. 잠시 뒤에 다시 해 보세요(오류 load)',
    storage: '이 브라우저는 저장소가 막혀 있어요',
    acct: '구글 계정으로 바꾸던 중에 끊겼어요. 다시 시도하면 어느 학교로 할지 물어봐요',
    etc: '서버에 연결하지 못했어요'
  };
  function cloudErrKey(e) {
    const c = String((e && (e.code || e.message)) || e || '');
    if (/operation-not-allowed|admin-restricted/i.test(c)) return 'anon';
    if (/api-key|app-not-authorized|invalid-app|project-not-found/i.test(c)) return 'key';
    if (/permission/i.test(c)) return 'rules';
    if (/nourl|database url/i.test(c)) return 'nourl';
    if (/network|timeout|unavailable|offline/i.test(c)) return 'net';
    if (c === 'load' || c === 'storage') return c;
    return 'etc';
  }
  // 이 브라우저에서 예전에 받은 익명 id가 있으면 그대로 쓰고, 없으면 새로 받아요
  function cloudUser(auth) {
    return new Promise((ok, no) => {
      let un = null, done = false;
      un = auth.onAuthStateChanged(u => {
        if (done) return;
        done = true;
        if (un) un(); else setTimeout(() => { if (un) un(); }, 0);
        if (u) ok(u);
        else auth.signInAnonymously().then(c => ok(c.user), no);
      }, err => { if (!done) { done = true; no(err); } });
    });
  }
  async function initCloud() {
    if (!hasCloudBuild() || Cloud.state === 'wait' || Cloud.state === 'on' || rt.adopting) return;
    const g = ++Cloud.gen;
    Cloud.state = 'wait'; Cloud.err = '';
    renderCloudInfo();
    try {
      let fb = null;
      try { fb = await window.FOREST_FB; } catch (e) { throw { code: 'load' }; }
      if (g !== Cloud.gen) return;
      if (!fb) { Cloud.state = 'off'; renderCloudInfo(); rankAfterCloud(); return; }   // config.js가 비어 있으면 체험판이에요
      const cfg = window.FOREST_FIREBASE || {};
      if (!cfg.databaseURL) throw { code: 'nourl' };
      if (!fb.apps.length) fb.initializeApp(cfg);
      const auth = fb.auth(), db = fb.database();
      let user = await waitFor(cloudUser(auth), CLOUD_WAIT);
      if (g !== Cloud.gen) return;
      Cloud.fb = fb; Cloud.db = db; Cloud.uid = user.uid;
      // 지난번에 계정을 다 못 지웠으면, 이 계정으로 다시 저장하기 전에 먼저 지워요
      Cloud.delLeft = false;
      // 3: 서버 기록을 다 못 지운 채 꺼졌으면 그 계정이면 이어서 지워요(못 지우면 올리지 않고 기다려요)
      if (delData() && delData() === user.uid) {
        Cloud.deleting = true;
        if (await delResume(user.uid)) return;
        Cloud.deleting = false; Cloud.delLeft = true;
      } else if (delData()) delData(false);   // 다른 계정 표시는 지워요(그 계정은 이미 없어요)
      if (!Cloud.delLeft && delPending()) {
        if (await deleteAuthUser(false)) {
          delPending(false);
          setTimeout(() => toast('지난번에 남았던 계정까지 모두 지웠어요'), 1200);
          user = await waitFor(cloudUser(auth), CLOUD_WAIT);
          if (g !== Cloud.gen) return;
          Cloud.uid = user.uid;
        } else Cloud.delLeft = true;   // 서버에 올리지 않고, 설정의 계정 지우기를 다시 누를 수 있게 둬요
      }
      if (!Cloud.listening) {
        Cloud.listening = true;
        db.ref('.info/serverTimeOffset').on('value', snap => { Cloud.offset = Number(snap.val()) || 0; setServerTime(devNow() + Cloud.offset); });
        // 시계가 어긋나 보이면 다시 접속해서 서버 시간을 새로 받아요(서버 보정값은 접속할 때 정해져요)
        SVR.resync = () => { if (!Cloud.db || Cloud.resyncing) return; Cloud.resyncing = true; Cloud.db.goOffline(); Cloud.db.goOnline(); };
        db.ref('.info/connected').on('value', snap => {
          Cloud.online = !!snap.val();
          if (Cloud.online && Cloud.resyncing) { Cloud.resyncing = false; db.ref('.info/serverTimeOffset').once('value').then(s => { Cloud.offset = Number(s.val()) || 0; setServerTime(devNow() + Cloud.offset); }).catch(() => {}); }
          renderCloudInfo();
          if (Cloud.online && cloudOn() && Cloud.dirty) cloudPush();
        });
      }
      // 서버 저장과 이 기기 저장 중에서 이어 할 쪽을 골라요
      const srv = (await waitFor(db.ref('forest/saves/' + user.uid).once('value'), CLOUD_WAIT)).val();
      if (g !== Cloud.gen) return;
      if (srvTooNew(srv)) { Cloud.state = 'on'; renderCloudInfo(); return; }
      Cloud.lastAt = srv ? Number(srv.at) || 0 : 0; Cloud.fresh = true;   // 서버에서 마지막으로 본 저장 시각
      Cloud.rev = revOf(srv);   // 2: 이 기기가 본 서버 저장 리비전. 올릴 때 서버가 이 값 그대로일 때만 덮어써요
      // 구글 계정으로 바꾸다 끊겼으면, 그 계정의 학교를 덮어쓰지 않고 어느 학교로 할지 다시 물어봐요
      if (acctPending()) {
        if (srv && typeof srv.d === 'string') { rt.adopting = true; askAcct(srv.d, JSON.stringify(S)); return; }
        acctPending(false);
        if (!S.acctGift) giveAcctGift();
      }
      if (srv && typeof srv.d === 'string') {
        // 저장 안전 장치: 진행이 줄어드는 쪽으로 바뀌면(서버가 더 늦게 저장했지만 덜 키운 학교이거나, 이 기기 학교가 서버보다 덜 키운 학교) 물어봐요
        const ss = parseSave(srv.d), sp = progOf(ss), lp = progOf(S), how = Cloud.skipRestore ? 'keep' : cloudBootPick(srv), restore = how === 'restore';
        // 2: 지난번 이 기기가 맞춘 뒤로 서버(다른 기기)와 이 기기가 둘 다 바뀌었으면, 어느 쪽도 덮지 않고 물어봐요
        if (ss && how === 'clash' && askPick(srv.d, '다른 기기가 저장한 학교', Cloud.rev)) return;
        if (ss && ((restore && sp < lp) || (!restore && sp > lp)) && askPick(srv.d, restore ? '서버가 덜 키운 학교' : '이 기기가 덜 키운 학교', Cloud.rev)) return;
        if (restore) {
          const r = adoptSave(srv.d, '서버에 저장된 학교를 불러왔어요');
          if (r === 'ok') return;
          if (r === 'storage') throw { code: 'storage' };
          // 서버 저장이 망가졌으면 이 기기 학교로 덮어써요
        } else if (ss && ss.pid !== S.pid) bakAdd(srv.d, '덮이기 전 서버 학교');   // 다른 학교를 덮기 전에 남겨요
      }
      Cloud.state = 'on';
      renderCloudInfo();
      cloudPush(true); bakPush();   // 이 기기에 남긴 학교도 서버에
      rankAfterCloud();
    } catch (e) {
      if (g !== Cloud.gen) return;
      Cloud.state = 'error'; Cloud.err = cloudErrKey(e);
      renderCloudInfo();
      rankAfterCloud();
    }
  }
  /* 2: 저장 리비전(r). 서버 저장에 1, 2, 3…을 붙이고, 올릴 때는 트랜잭션으로 '내가 본 리비전 그대로일 때만' 덮어써요
     다른 기기가 그사이 저장했으면 덮지 않고 자동 올리기를 멈춘 뒤 두 학교를 보여 주고 물어요(고르지 않은 쪽은 예전 학교 되돌리기에 남아요)
     기기 시계로 최신 저장을 가리지 않아요. 이 기기가 마지막으로 서버와 맞춘 리비전과 그때 저장 시각(sv)을 기기에 남겨 켤 때 비교해요
     리비전이 없는 옛 저장(까지, 또는 옛 앱이 올린 저장)은 0으로 읽어요 */
  const SYNC_KEY = 'forest-cloud-sync';
  const revOf = v => v && typeof v === 'object' && Number.isInteger(v.r) && v.r > 0 ? v.r : 0;
  // 서버 학교가 이 앱보다 큰 버전(앞자리나 가운데 자리)에서 저장됐으면 받지도 덮지도 않아요
  // 옛 앱이 새 학교급 저장을 읽으면 모르는 칸이 빠지고, 그대로 다시 올리면 서버 학교가 망가져요. 이 기기에서는 계속 할 수 있고, 앱을 업데이트하면 이어져요
  const verMM = v => { const a = String(v || '').split('.'); return (+a[0] || 0) * 1000 + (+a[1] || 0); };
  function srvTooNew(srv) {
    if (!(srv && typeof srv === 'object' && typeof srv.v === 'string' && verMM(srv.v) > verMM(VERSION))) return false;
    if (!Cloud.old) { Cloud.old = srv.v; toast(`서버의 학교는 더 새 버전(${srv.v})에서 저장됐어요\n앱을 업데이트하면 이어서 할 수 있어요`); renderCloudInfo(); }
    return true;
  }
  function syncGet() { try { const o = JSON.parse(localStorage.getItem(SYNC_KEY) || 'null'); return o && typeof o.u === 'string' && Number.isInteger(o.r) ? o : null; } catch (e) { return null; } }
  function syncSet(r, sv) {
    Cloud.rev = r; Cloud.syncSv = sv;
    try { if (r == null) localStorage.removeItem(SYNC_KEY); else localStorage.setItem(SYNC_KEY, JSON.stringify({ u: Cloud.uid, r, sv })); } catch (e) { /* 남기지 못하면 다음에 켤 때 예전 방식으로 골라요 */ }
  }
  // 켤 때: 'restore' 서버 학교로, 'keep' 이 기기 학교로, 'clash' 둘 다 바뀌어서 묻기
  function cloudBootPick(srv) {
    const k = syncGet();
    if (k && k.u === Cloud.uid && Cloud.bootHadSave) {   // 이 기기 저장이 없으면(새 화면, 지워짐) 예전처럼 서버 학교를 받아요
      Cloud.syncSv = k.sv;
      if (revOf(srv) === k.r) return 'keep';   // 서버는 지난번 맞춘 그대로예요. 이 기기 학교가 같거나 더 나중이에요
      if ((Cloud.bootSavedAt || S.savedAt) === k.sv) return 'restore';   // 이 기기는 맞춘 뒤로 바뀌지 않았어요. 다른 기기가 이어 한 학교를 받아요. 켤 때 저장 시각으로 견줘요(서버 답을 기다리는 사이 저장이 생기면 '학교가 두 개' 창이 떴어요)
      return 'clash';
    }
    return cloudShouldRestore(srv) ? 'restore' : 'keep';   // 맞춘 기록이 없으면(옛 판에서 올렸거나 새 기기) 예전 방식
  }
  // 이 기기에 저장이 없던 새 화면이면 서버 학교를 이어 해요 (새로 10분 넘게 했으면 지금 학교를 지켜요).
  // 둘 다 있으면 더 나중에 저장한 쪽을 써요
  function cloudShouldRestore(srv) {
    const at = Number(srv.at) || 0;
    if (!Cloud.bootHadSave) return performance.now() < 10 * 60000;
    // 이 기기 저장 시각이 서버 시간보다 1분 넘게 미래면(기기 시계가 앞서 있었어요) 믿지 않고 서버 학교를 불러와요
    if (serverTimeOk() && (Cloud.bootSavedAt || 0) > gameNow() + 60000) return at > 0;
    return at > (Cloud.bootSavedAt || 0) + 5000;   // 보안 점검(1-1): 켠 뒤 이 기기에서 저장한 시각이 아니라 켤 때 저장 시각과 비교해요
  }
  /* ---------- 저장 안전 장치 ----------
     계정 하나에 서버 저장이 한 칸이라, 다른 기기의 옛 학교(초등 4학년 2학기)가 중학교 3학년 학교를 묻지 않고 덮은 일이 있었어요
     1) 진행(학교급, 학년, 학기)이 줄어드는 쪽으로 학교가 바뀔 때는 꼭 두 학교를 보여 주고 물어요. 고르기 전에는 서버에 올리지 않아요
     2) 학교가 바뀌거나 덮이기 직전 학교를 이 기기(forest-school-bak)와 서버(forest/bak/<id>/0~2)에 3개까지 남겨요
        설정 > 예전 학교 되돌리기에서 골라 되돌려요(되돌리기 전 지금 학교도 남겨요) */
  const BAK_KEY = 'forest-school-bak', BAK_MAX = 3;
  const progOf = s => s && typeof s === 'object' ? (Number(s.tier) || 0) * 10000 + (Number(s.tg) || 0) * 10 + (s.sem ? 5 : 0) : 0;
  const parseSave = d => { try { const o = typeof d === 'string' ? JSON.parse(d) : d; return o && typeof o === 'object' ? sanitize(o) : null; } catch (e) { return null; } };
  function saveSum(s) {
    try {
      const T = TIERS[s.tier], y = Math.min((s.tg || 0) + 1, T.years);
      return `${T.school} ${y}${T.unit}${s.tier >= 1 ? (s.sem ? ' 2학기' : ' 1학기') : ''}, 학교 파워 ${fmt(pwOf(s))}`;
    } catch (e) { return '학교'; }
  }
  // 하루 한 번 자동 백업: 그날 처음 켤 때의 학교를 이 기기에 두 날치 남겨요. 예전 학교 되돌리기 목록에 함께 보여요. 서버에는 올리지 않아요
  const BAKD_KEY = 'forest-school-bak-day';
  function bakDayList() { try { const L = JSON.parse(localStorage.getItem(BAKD_KEY) || '[]'); return Array.isArray(L) ? L.filter(b => b && typeof b.d === 'string' && typeof b.pid === 'string' && typeof b.day === 'string').slice(0, 2) : []; } catch (e) { return []; } }
  function bakDaily() {
    try {
      if (!S || !S.pid) return;
      const day = gameToday(), L = bakDayList(); if (L[0] && L[0].day === day) return;
      const e = { day, pid: S.pid, prog: progOf(S), sum: saveSum(S), sv: S.savedAt, at: Date.now(), why: '자동 백업', d: JSON.stringify(S) };
      localStorage.setItem(BAKD_KEY, JSON.stringify([e, ...L.filter(b => b.day !== day)].slice(0, 2)));
    } catch (er) { /* 저장소가 가득 찼으면 건너뛰어요 */ }
  }
  function bakList() {
    try { const L = JSON.parse(localStorage.getItem(BAK_KEY) || '[]'); return Array.isArray(L) ? L.filter(b => b && typeof b.d === 'string' && typeof b.pid === 'string').slice(0, BAK_MAX) : []; } catch (e) { return []; }
  }
  const bakSame = (a, b) => a.pid === b.pid && a.prog === b.prog;
  // 학교 하나를 남겨요. 같은 학교(번호와 진행이 같음)는 새것으로 바꾸고, 넘치면 가장 오래 남긴 것부터 빼요
  function bakAdd(d, why) {
    const s = parseSave(d); if (!s) return null;
    let raw = null; try { raw = typeof d === 'string' ? JSON.parse(d) : d; } catch (er) { raw = null; }
    const pid = raw && typeof raw.pid === 'string' && raw.pid ? raw.pid.slice(0, 16) : 'b' + (Number(raw && raw.born) || 0);   // 원래 저장의 학교 번호(읽을 때 새로 만든 번호가 아니라)
    const e = { pid, prog: progOf(s), sum: saveSum(s), sv: Number(s.savedAt) || 0, at: Date.now(), why: String(why || '').slice(0, 40), d: typeof d === 'string' ? d : JSON.stringify(d) };
    const L = [e, ...bakList().filter(b => !bakSame(b, e) && !(b.pid === e.pid && b.why === e.why))].slice(0, BAK_MAX);   // 같은 학교의 같은 까닭 백업은 새것 한 칸만 써요. 두 기기를 번갈아 쓸 때 평소 백업이 세 칸을 다 차지해 다른 학교 백업이 밀려났어요
    try { localStorage.setItem(BAK_KEY, JSON.stringify(L)); } catch (er) {
      try { localStorage.setItem(BAK_KEY, JSON.stringify(L.slice(0, 1))); } catch (er2) { /* 저장소가 가득 찼어요 */ }
    }
    if (cloudOn() && !Cloud.hold) bakPush();
    return e;
  }
  // 이 기기에 남긴 학교를 서버 칸 0~2에도 올려요(서버에 이미 같은 학교가 있으면 그 칸에). 켤 때와 남길 때 불러요
  async function bakPush() {
    if (!cloudOn() || !Cloud.db || !Cloud.uid || Cloud.bakBusy || Cloud.deleting || Cloud.delLeft || Cloud.hold) return;   // 3: 지우는 동안이나 지우기가 남았으면 올리지 않아요
    const L = bakList(); if (!L.length) return;
    Cloud.bakBusy = true;
    try {
      const ref = Cloud.db.ref('forest/bak/' + Cloud.uid);
      const srv = (await waitFor(ref.once('value'), CLOUD_WAIT)).val() || {};
      const slots = [0, 1, 2].map(i => srv[i] && typeof srv[i].d === 'string' ? srv[i] : null);
      for (const b of L.slice().reverse()) {
        if (typeof b.d !== 'string' || b.d.length >= 100000) continue;   // 서버 규칙의 예전 학교 칸 크기(이 기기에는 그대로 남아요)
        let i = slots.findIndex(x => x && x.pid === b.pid && x.prog === b.prog);
        if (i >= 0 && slots[i].at >= b.at) continue;
        if (i < 0) i = slots.findIndex(x => !x);
        if (i < 0) { i = 0; slots.forEach((x, j) => { if (x.at < slots[i].at) i = j; }); }
        const doc = { d: b.d, at: b.at, v: VERSION, pid: b.pid, prog: b.prog, sum: b.sum, sv: b.sv, why: b.why };
        await ref.child(String(i)).set(doc); slots[i] = doc;
      }
    } catch (e) { /* 다음에 다시 올려요 */ }
    Cloud.bakBusy = false;
  }
  async function bakAll() {
    const L = bakList();
    if (cloudOn() && Cloud.db && Cloud.uid) {
      try {
        const srv = (await waitFor(Cloud.db.ref('forest/bak/' + Cloud.uid).once('value'), CLOUD_WAIT)).val() || {};
        for (const i of [0, 1, 2]) { const x = srv[i]; if (x && typeof x.d === 'string' && !L.some(b => b.pid === x.pid && b.prog === x.prog)) L.push({ pid: x.pid, prog: x.prog, sum: x.sum, sv: x.sv, at: x.at, why: x.why || '', d: x.d, srv: true }); }
      } catch (e) { /* 이 기기 것만 보여요 */ }
    }
    for (const x of bakDayList()) L.push(Object.assign({}, x, { auto: true }));   // 자동 백업도 함께 보여요
    return L.sort((a, b) => b.at - a.at);
  }
  // 두 학교 중 하나를 골라요. 고르기 전에는 서버에 올리지 않아요(Cloud.hold)
  function askPick(srvD, why, r) {
    const s = parseSave(srvD); if (!s) return false;
    Cloud.hold = true; Cloud.state = 'hold'; clearTimeout(Cloud.timer);
    rt.pickSave = { d: srvD, why, r: Number.isInteger(r) ? r : Cloud.rev };
    $('#pickSrv').textContent = saveSum(s) + (s.savedAt ? `, ${agoText(s.savedAt)} 저장` : '');
    $('#pickLoc').textContent = saveSum(S) + (S.savedAt ? `, ${agoText(S.savedAt)} 저장` : '');
    $('#pickSrvNm').textContent = s.rank && s.rank.name ? `서버 학교 (${s.rank.name})` : '서버 학교';
    renderCloudInfo();
    if (rt.modalOpen) closeModal(rt.modalOpen);
    setTimeout(() => openModal($('#mPick')), 200);
    return true;
  }
  function pickKeepLocal() {
    const P = rt.pickSave; if (!P) return;
    rt.pickSave = null;
    Cloud.hold = false; Cloud.state = 'on'; Cloud.fresh = true;
    Cloud.rev = P.r || 0;   // 2: 본 서버 리비전 위에 이 기기 학교를 올려요(그사이 또 바뀌면 다시 물어요)
    bakAdd(P.d, '고르지 않은 서버 학교');
    closeModal($('#mPick'));
    renderCloudInfo(); cloudPush(true); rankAfterCloud();
    toast('이 기기 학교로 이어 해요. 서버 학교는 설정 > 예전 학교 되돌리기에 남겼어요');
  }
  function pickLoadSrv() {
    const P = rt.pickSave; if (!P) return;
    rt.pickSave = null;
    Cloud.hold = false;
    adoptSave(P.d, '서버 학교로 이어 해요. 이 기기 학교는 설정 > 예전 학교 되돌리기에 남겼어요');
  }
  async function openBak() {
    $('#bakList').innerHTML = '<p class="lead">불러오는 중이에요</p>';
    openModal($('#mBak'));
    const L = await bakAll(); rt.bakL = L;
    $('#bakList').innerHTML = L.length ? L.map((b, i) => `<div class="bak-row"><span class="txt"><b>${esc(b.sum)}</b><small>${agoText(b.at)} 남김${b.why ? `, ${esc(b.why)}` : ''}${b.srv ? ', 서버' : ''}</small></span><button class="btn-sub small" type="button" data-bak="${i}">되돌리기</button></div>`).join('')
      : '<p class="lead">아직 남긴 학교가 없어요.</p>';
  }
  function bakRestore(i) {
    const b = rt.bakL && rt.bakL[i]; if (!b) return;
    if (rt.bakArm !== i) { rt.bakArm = i; toast(`한 번 더 누르면 "${b.sum}" 학교로 되돌려요. 지금 학교는 남겨 둬요`); return; }
    rt.bakArm = -1;
    adoptSave(b.d, '예전 학교로 되돌렸어요. 바로 전 학교는 예전 학교 되돌리기에 남겼어요');
  }
  // 구글 계정 바꾸기가 끝나지 않았다는 표시 (다시 열어도 남아요). 인자 없이 부르면 읽고, false면 지워요
  const ACCT_PENDING = 'forest-acct-pending';
  function acctPending(set) {
    try {
      if (set === undefined) return localStorage.getItem(ACCT_PENDING) === '1';
      if (set) localStorage.setItem(ACCT_PENDING, '1'); else localStorage.removeItem(ACCT_PENDING);
    } catch (e) { /* 저장소가 막혀 있어요 */ }
    return false;
  }
  // 계정을 바꾸다 끊겼어요: 이 기기 학교는 계속 저장하고, 서버 저장은 멈춘 채(예전 id로 올리지 않게) 다시 시도를 기다려요
  function acctFail() {
    Cloud.gen += 1;
    Cloud.state = 'error'; Cloud.err = 'acct'; Cloud.uid = null;
    rt.adopting = false;
    save();
    renderCloudInfo(); renderAcct();
  }
  // 다른 학교로 바꿀 때는 저장을 바꿔 넣고 화면을 다시 열어요. 게임을 처음부터 다시 그리는 가장 안전한 방법이에요
  function adoptSave(d, msg) {
    let obj = null;
    try { obj = JSON.parse(d); } catch (e) { obj = null; }
    if (!obj || typeof obj !== 'object') return 'bad';
    if (S && S.pid && !rt.adopting) bakAdd(JSON.stringify(S), '바꾸기 전 이 기기 학교');   // 저장 안전 장치
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(obj)); sessionStorage.setItem('forest-adopt', msg || ''); } catch (e) { return 'storage'; }
    acctPending(false);
    rt.adopting = true;   // 다시 여는 동안 지금 학교가 저장을 덮어쓰지 않게 막아요
    clearTimeout(Cloud.timer);
    location.reload();
    return 'ok';
  }
  // 연결이 끝날 때까지(붙었거나 못 붙었거나) 기다려요
  function cloudSettled() {
    return new Promise(ok => {
      const t = () => (Cloud.state === 'idle' || Cloud.state === 'wait') ? setTimeout(t, 150) : ok();
      t();
    });
  }
  function retryCloud() {
    if (!hasCloudBuild() || Cloud.state !== 'error') return;
    if (Cloud.err === 'load' && !window.firebase && typeof window.FOREST_LOAD === 'function') window.FOREST_FB = window.FOREST_LOAD();
    Cloud.state = 'idle';
    Cloud.bootSavedAt = S.savedAt;   // 5.3.4.6: 켠 뒤 이 기기에서 놀았으면 서버 학교와 견줄 때 묻게(켤 때 값으로 견주면 묻지 않고 서버 학교로 바뀌었어요)
    renderCloudInfo();
    resetRank();
    if (rt.tab === 'rank') initRank(); else renderRankPanel();
    initCloud();
  }
  async function cloudPush(force) {
    if (!cloudOn() || rt.adopting || rt.uniPrev || Cloud.pushing || !S || Cloud.delLeft || Cloud.hold || Cloud.deleting || Cloud.old) return;   // 고르는 동안, 검토 3 계정을 지우는 동안은 올리지 않아요. 서버 학교가 더 새 버전일 때도
    if (!force && !Cloud.dirty) return;
    if (!Cloud.fresh) { Cloud.dirty = true; cloudVerify(); return; }   // 다시 켠 뒤에는 서버 저장을 먼저 확인해요
    Cloud.pushing = true; Cloud.dirty = false;
    syncMid();
    const db = Cloud.db, uid = Cloud.uid, g = Cloud.gen, at = S.savedAt, base = Cloud.rev || 0;
    const doc = { d: JSON.stringify(S), at, v: VERSION };
    let clash = null;
    try {
      // 2: 읽고 set하는 사이 다른 기기가 끼어들지 못하게 트랜잭션으로 '서버 리비전이 내가 본 값일 때만' 써요
      // 서버가 비었으면(처음, 지운 뒤) 그대로 써요. SDK가 아직 서버 값을 모를 때 null로 한 번 부르고 진짜 값으로 다시 불러요
      const res = await db.ref('forest/saves/' + uid).transaction(cur => {
        clash = null;
        if (cur && typeof cur === 'object') {
          const r = revOf(cur);
          if (r !== base || verMM(cur.v) > verMM(VERSION)) { clash = cur; return; }   // 그만둬요(덮지 않아요)
          return Object.assign({}, doc, { r: r + 1 });
        }
        return Object.assign({}, doc, { r: base + 1 });
      }, undefined, false);
      if (g !== Cloud.gen) return;
      if (!res || !res.committed) {
        const v = clash || (res && res.snapshot && res.snapshot.val());
        Cloud.dirty = true;
        if (!srvTooNew(v)) cloudClash(v);
      } else {
        syncSet(revOf(res.snapshot.val()) || base + 1, at);
        Cloud.lastAt = Math.max(Cloud.lastAt || 0, at);
        Cloud.lastPush = Date.now();
        // 자동으로 움직이는 브라우저(AI가 시험하려고 연 판)는 테스트 현황에 기록을 남기지 않아요. 자동 시험(가짜 서버)은 그대로 올려요
        if (!(navigator.webdriver && !window.__FOREST_TEST) && (force || Date.now() - Cloud.lastStats >= STATS_PUSH)) {
          Cloud.lastStats = Date.now();
          try { await db.ref('forest/stats/' + uid).set(statsDoc()); } catch (e2) { /* 테스트 현황을 못 올려도 학교 저장은 그대로예요(저장 위치를 오류로 바꾸지 않아요) */
            // 새 칸(adsT, adsD)을 받는 서버 규칙이 아직 게시되기 전이면 빼고 한 번 더 올려요
            try { const d = statsDoc(); delete d.adsT; delete d.adsD; await db.ref('forest/stats/' + uid).set(d); } catch (e3) { /* 그대로 */ } }
        }
      }
    } catch (e) {
      Cloud.dirty = true;
      if (g === Cloud.gen && cloudErrKey(e) === 'rules') { Cloud.state = 'error'; Cloud.err = 'rules'; rankAfterCloud(); }
    } finally { Cloud.pushing = false; }
    renderCloudInfo();
  }
  // 2: 올리려는데 다른 기기가 먼저 저장했어요. 자동 올리기를 멈추고 두 학교를 보여 주며 물어요
  // 서버 저장이 망가졌으면(읽을 수 없으면) 그 리비전 위에 이 기기 학교를 다시 올려요
  function cloudClash(v) {
    const r = revOf(v);
    if (v && typeof v.d === 'string' && askPick(v.d, '다른 기기가 저장한 학교', r)) return;
    Cloud.rev = r; Cloud.pushing = false; setTimeout(() => cloudPush(true), 0);
  }
  // 앱을 내렸다 다시 켜면, 그사이 다른 기기가 서버에 더 나중 학교를 올렸는지 먼저 봐요
  // 2: 저장 시각(기기 시계) 대신 리비전으로 봐요. 바뀌었으면 이 기기가 맞춘 뒤로 그대로일 때만 서버 학교를 불러오고
  // 이 기기도 그사이 바뀌었으면 묻는 창을 띄워요. 아니면 확인됐다고 표시하고 밀린 저장을 올려요
  async function cloudVerify() {
    if (!cloudOn() || Cloud.verifying || rt.adopting || !S || document.hidden || Cloud.hold) return;   // 내려 둔 동안에는 확인하지 않아요(그동안 올리지도 않아요)
    Cloud.verifying = true;
    const db = Cloud.db, uid = Cloud.uid, g = Cloud.gen, mine = S.savedAt === Cloud.syncSv || (Cloud.hideSv != null && Cloud.hideSv === Cloud.syncSv && performance.now() - (Cloud.wakeT || 0) < 15000);   // '내릴 때 올린 그대로'는 다시 켠 직후 15초만 믿어요. 그 뒤(오프라인으로 더 한 뒤)에는 묻지 않고 바꾸지 않아요. 켜는 순간 이 기기 학교가 맞춘 그대로인지(내릴 때 올린 그대로인지)
    try {
      const r = Number((await waitFor(db.ref('forest/saves/' + uid + '/r').once('value'), CLOUD_WAIT)).val()) || 0;
      if (g !== Cloud.gen) return;
      if (r !== (Cloud.rev || 0)) {
        const srv = (await waitFor(db.ref('forest/saves/' + uid).once('value'), CLOUD_WAIT)).val();
        if (g !== Cloud.gen) return;
        const rr = revOf(srv);
        if (srvTooNew(srv)) return;
        if (srv && typeof srv.d === 'string' && rr !== (Cloud.rev || 0)) {
          if (progOf(parseSave(srv.d)) < progOf(S) && askPick(srv.d, '다른 기기가 덜 키운 학교', rr)) return;   // 저장 안전 장치
          if (!mine && askPick(srv.d, '다른 기기가 저장한 학교', rr)) return;
          if (adoptSave(srv.d, '다른 기기에서 이어 한 학교를 불러왔어요') === 'ok') return;
        }
        if (!srv) Cloud.rev = 0;   // 서버 저장이 지워졌어요(계정 지우기 등). 다음 올리기가 새로 써요
      }
      if (document.hidden) return;   // 확인하는 사이 다시 내렸으면 다음에 켤 때 다시 확인해요
      Cloud.fresh = true; Cloud.hideSv = null;   // 확인이 끝났으면 내릴 때 값은 지워요
    } catch (e) { /* 다음에 다시 확인해요(그때까지 서버에 올리지 않아요) */ }
    finally { Cloud.verifying = false; }
    if (Cloud.fresh && Cloud.dirty) cloudPush();
  }
  function cloudTick() { if (cloudOn() && Cloud.dirty && Date.now() - Cloud.lastPush >= CLOUD_PUSH) cloudPush(); }
  // 종업식, 졸업식처럼 큰 일이 있으면 조금 뒤에 바로 올려요
  function cloudSoon() {
    if (!cloudOn()) return;
    clearTimeout(Cloud.timer);
    Cloud.timer = setTimeout(() => { save(); cloudPush(true); }, 1500);
  }
  // 테스트 현황에 남길 것: 이름과 연락처 같은 개인 정보는 받지 않아요
  function statsDoc() {
    const cm = curMain(), ua = navigator.userAgent || '';
    return {
      seen: Cloud.fb ? Cloud.fb.database.ServerValue.TIMESTAMP : Date.now(), born: Math.floor(S.born), pid: S.pid, name: S.rank.name || '',
      tier: S.tier, year: yearNo(), town: S.grade, q: cm ? qNo(S.q.m) : '끝', qt: cm ? cm.title : '',
      play: Math.floor(S.st.play), sess: S.st.sess, days: S.att.n, ads: S.st.ads, score: rankScore(),
      gold: S.gold, gearn: S.st.gold, gspent: S.st.gspent, cos: S.cos.own.length,
      dev: !!S.u.dev, v: VERSION, env: /KAKAOTALK/i.test(ua) ? 'kakao' : (navigator.maxTouchPoints > 0 ? 'mobile' : 'pc'),
      adsT: S.adx && S.adx.day === gameToday() ? (S.adx.all || 0) : 0, adsD: gameToday()   // 관리자 지표에 오늘 본 광고 수(서버 규칙 adsT, adsD)
    };
  }
  function agoText(t) {
    const s = Math.max(0, (Date.now() - t) / 1000);
    if (s < 10) return '방금';
    if (s < 60) return `${Math.floor(s)}초 전`;
    if (s < 3600) return `${Math.floor(s / 60)}분 전`;
    if (s < 86400) return `${Math.floor(s / 3600)}시간 전`;
    return `${Math.floor(s / 86400)}일 전`;
  }
  function renderCloudInfo() {
    if (!S) return;
    let t = AIT ? '이 기기의 토스 앱' : '이 기기의 브라우저';
    if (AIT) $('#infoAd').textContent = AIT.ads ? (AIT.testAd ? '토스 리워드 광고 (테스트 광고)' : '토스 리워드 광고') : '이 토스 앱에서는 광고가 안 나와요';
    if (hasCloudBuild()) {
      if (Cloud.state === 'on' && Cloud.delLeft) t = '이 기기의 브라우저 (지난번 계정 지우기가 끝나지 않았어요. 아래 계정 지우기를 다시 눌러 주세요)';
      else if (Cloud.state === 'on' && Cloud.old) t = `이 기기의 브라우저 (서버의 학교가 더 새 버전 ${Cloud.old}에서 저장됐어요. 앱을 업데이트해 주세요)`;
      else if (Cloud.state === 'on') t = !Cloud.online ? '서버 (인터넷이 끊겼어요. 다시 이어지면 저장해요)' : Cloud.lastPush ? `서버 (${agoText(Cloud.lastPush)} 저장)` : '서버';
      else if (Cloud.state === 'hold') t = '서버에 학교가 하나 더 있어요. 어느 학교로 이어 할지 골라 주세요';
      else if (Cloud.state === 'idle' || Cloud.state === 'wait') t = '서버에 연결하는 중이에요';
      else if (Cloud.state === 'error') t = `이 기기의 브라우저 (${CLOUD_ERR[Cloud.err] || CLOUD_ERR.etc})`;
      else t = '이 기기의 브라우저 (서버를 연결하기 전 체험판)';
    }
    const dd = $('#infoSave');
    if (dd.textContent !== t) dd.textContent = t;
    renderAcct();
    $('#delRow').hidden = !cloudOn() || !!AIT;
    $('#devStats').hidden = !hasCloudBuild();
    $('#pidRow').hidden = !hasCloudBuild() || !!window.FOREST_STORE;   // 학교 번호는 테스트판에서만 보여요
    $('#infoPid').textContent = '#' + S.pid.slice(0, 4);
  }

  /* 구글 계정 연결 (안드로이드 판에만 window.FOREST_GOOGLE이 있어요)
     지금 익명 id에 구글 계정을 이어 붙여요. id가 그대로라서 서버 저장도 그대로 이어져요.
     그 구글 계정에 이미 다른 학교가 있으면(새 휴대폰) 어느 학교로 이어 할지 물어봐요 */
  const hasGoogle = () => !!window.FOREST_GOOGLE;
  const ACCT_GIFT = { dip: 15, fund: 3, gold: 1 };   // 구글 계정을 처음 연결하면 한 번 주는 선물
  function giveAcctGift() {
    if (S.acctGift) return '';
    S.acctGift = true;
    addDip(ACCT_GIFT.dip); S.fund += ACCT_GIFT.fund; addGold(ACCT_GIFT.gold);
    save(); renderHUD(); renderGradPanel(true);
    return ` 선물로 수료증 +${ACCT_GIFT.dip}장, 기금 +${ACCT_GIFT.fund}, 황금 도토리 +${ACCT_GIFT.gold}개를 받았어요!`;
  }
  function googleUser() {
    try { const u = Cloud.fb.auth().currentUser; return (u && (u.providerData || []).find(p => p.providerId === 'google.com')) || null; } catch (e) { return null; }
  }
  function renderAcct() {
    const row = $('#optAcct');
    row.hidden = !(hasGoogle() && cloudOn());
    if (row.hidden) { $('#acctMenu').hidden = true; return; }
    const g = googleUser();
    $('#acctTitle').textContent = g ? '구글 계정 연결됨' : '구글 계정 연결';
    if (!g) $('#acctMenu').hidden = true;
    $('#acctSub').textContent = g ? `${g.email || '구글'} 계정에 학교가 저장돼요.` :   // '누르면 계정 바꾸기와 로그아웃' 글은 지움
      (S.acctGift ? '연결해 두면 휴대폰을 바꿔도 같은 학교를 이어 해요' : `연결하면 수료증 ${ACCT_GIFT.dip}장, 기금 ${ACCT_GIFT.fund}, 황금 도토리 ${ACCT_GIFT.gold}개를 선물로 줘요`);
  }
  // 광고와 구글 로그인이 실패한 까닭을 짧게 덧붙여요(문의할 때 알려 주면 원인을 찾기 쉬워요)
  const AD_ERR = { 0: '광고를 불러오지 못했어요', 1: '광고 요청 오류', 2: '인터넷 연결', 3: '지금 줄 광고가 없어요' };
  function adErrText(EXT) {
    const e = EXT && EXT.adError ? String(EXT.adError() || '') : ''; if (!e) return '';
    const m = e.match(/-?\d+/), why = /^consent/.test(e) ? '광고 동의 정보를 못 받았어요' : m && AD_ERR[m[0]] ? AD_ERR[m[0]] : '';
    return ` (오류 ${e.replace(/^consent:/, '')}${why ? ', ' + why : ''})`;
  }
  function googleErrText(c) {
    if (/\b10\b|DEVELOPER_ERROR/i.test(c)) return ' (오류 10. 잠시 뒤에 다시 해 보세요)';   // 자세한 까닭(앱 서명 키 SHA-1 등록)은 개발 문서에
    if (/28444|Developer console/i.test(c)) return ' (오류 28444. 잠시 뒤에 다시 해 보세요)';   // 앱 서명 키 SHA-1과 패키지 이름, 구글 클라우드 Android 클라이언트
    if (/No credentials|NoCredential/i.test(c)) return ' (이 휴대폰에 구글 계정이 없거나 고를 수 있는 계정이 없어요)';
    if (/\b7\b|network/i.test(c)) return ' (인터넷 연결을 확인해 주세요)';
    return c && c !== 'undefined' ? ` (오류 ${c.slice(0, 40)})` : '';
  }
  async function linkGoogle() {
    if (!cloudOn() || rt.acctBusy) return;
    if (googleUser()) { toast('이미 구글 계정에 연결돼 있어요'); return; }
    const G = window.FOREST_GOOGLE;
    // 카카오톡 같은 앱 안 브라우저에서는 구글이 로그인을 막아요
    if ((G.popup || G.web) && /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line\//i.test(navigator.userAgent || '')) {
      toast('이 앱 안에서는 구글 로그인이 안 돼요. 메뉴의 \'다른 브라우저로 열기\'로 열어 주세요');
      return;
    }
    rt.acctBusy = true;
    const auth = Cloud.fb.auth();
    let cred = null;
    try {
      try {
        if (G.popup) await auth.currentUser.linkWithPopup(new Cloud.fb.auth.GoogleAuthProvider());
        else {
          const g = await G.login();
          cred = Cloud.fb.auth.GoogleAuthProvider.credential(g.idToken);
          await auth.currentUser.linkWithCredential(cred);
        }
        const gift = giveAcctGift();
        toast('구글 계정을 연결했어요.' + gift); sfx('quest');
        renderAcct(); cloudPush(true); webLockCheck();
      } catch (e) {
        if (!/credential-already-in-use|email-already-in-use|account-exists/.test(String(e && e.code))) throw e;
        cred = cred || (e && e.credential);
        if (!cred) throw e;
        // 이 구글 계정은 이미 다른 학교를 갖고 있어요. 지금 학교의 랭킹과 테스트 기록은 정리하고 그 계정으로 들어가요
        save();
        const local = JSON.stringify(S), old = Cloud.uid;
        // 지우기 전에 올리기부터 멈춰요(지운 칸에 옛 계정 저장이 다시 올라가지 않게). 하던 올리기는 3초까지 기다려요
        Cloud.gen += 1; rt.adopting = true; clearTimeout(Cloud.timer);
        for (let i = 0; i < 30 && Cloud.pushing; i++) await new Promise(r => setTimeout(r, 100));
        try { await delServer(old); } catch (er) { /* 무시 */ }   // 예전 학교 칸과 공개 모습까지 서버 칸 여섯 곳을 모두 지워요. 보안 점검(2-12): 다시 못 쓰는 옛 익명 계정의 저장도 지워요(이 학교는 local로 가져가요)
        let u = null;
        try { u = (await auth.signInWithCredential(cred)).user; }
        catch (er) { rt.adopting = false; Cloud.dirty = true; save(); cloudPush(true); throw er; }   // 들어가지 못했으면 지금 계정으로 다시 저장해요
        acctPending(true);   // 예전 id로 하던 저장은 위에서 멈췄고, 고른 학교로 다시 열어요
        let srv = null;
        try { srv = (await waitFor(Cloud.db.ref('forest/saves/' + u.uid).once('value'), CLOUD_WAIT)).val(); }
        catch (er) { throw { acctFail: true }; }
        if (srv && typeof srv.d === 'string') askAcct(srv.d, local);
        else { if (!S.acctGift) { rt.adopting = false; giveAcctGift(); rt.adopting = true; } adoptSave(JSON.stringify(S), '구글 계정을 연결했어요'); }
      }
    } catch (e) {
      const c = String(e && (e.code || e.message));
      if (e && e.acctFail) { acctFail(); toast('연결이 끊겼어요. 이 기기 학교는 그대로예요\n인터넷이 되면 다시 해 주세요'); }
      else if (/popup-blocked/.test(c)) toast('팝업이 막혔어요. 브라우저에서 팝업을 허용해 주세요');
      else if (/unauthorized-domain/.test(c)) toast('Firebase 승인된 도메인에 이 주소를 넣어야 해요');
      else if (!/cancel|popup-closed/i.test(c)) toast('구글 계정을 연결하지 못했어요. 잠시 뒤에 다시 해 보세요' + googleErrText(c));
    }
    rt.acctBusy = false;
  }
  /* 구글 계정 바꾸기와 로그아웃. 먼저 지금 학교를 지금 계정에 저장하고, 이 기기 저장(학교, 예전 학교, 동기화 표시)을 비운 뒤 다시 열어요
     이 기기 저장을 비우지 않으면 새 계정에 같은 학교가 또 올라가서 랭킹에 같은 학교가 둘 생겨요 */
  const inAppBrowser = () => /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line\//i.test(navigator.userAgent || '');
  async function acctSaveFirst() {
    // 5.3.4.4: 서버 연결을 쉬던 중(netSleep)이면 깨우고, 서버 확인(cloudVerify)이 끝난 뒤에 올려요. 전에는 확인을 기다리지 않아 '저장하지 못했어요'가 떴어요
    const until = async (f, n) => { for (let i = 0; i < n && f(); i++) await new Promise(r => setTimeout(r, 150)); };
    if (Cloud.asleep) netWake();
    if (!Cloud.fresh && !Cloud.verifying) cloudVerify();
    await until(() => Cloud.verifying || Cloud.pushing, Math.ceil(CLOUD_WAIT * 2 / 150));   // 확인은 서버 읽기 두 번까지(CLOUD_WAIT씩)
    await cloudPush(true);
    await until(() => Cloud.pushing, 40);
    return !Cloud.dirty && cloudOn();
  }
  async function switchGoogle() {
    if (!cloudOn() || rt.acctBusy || !googleUser()) return;
    const G = window.FOREST_GOOGLE;
    if (!G || !G.login) return;
    if (inAppBrowser()) { toast('이 앱 안에서는 구글 로그인이 안 돼요. 메뉴의 \'다른 브라우저로 열기\'로 열어 주세요'); return; }
    rt.acctBusy = true;
    try {
      if (!(await acctSaveFirst())) { toast('지금 학교를 저장하지 못했어요. 인터넷을 확인하고 다시 해 주세요'); return; }
      try { if (G.logout) await G.logout(); } catch (e) { /* 계정 고르는 창을 다시 띄우려는 것이라 실패해도 괜찮아요 */ }
      const g = await G.login();
      const cred = Cloud.fb.auth.GoogleAuthProvider.credential(g.idToken), old = Cloud.uid;
      const u = (await Cloud.fb.auth().signInWithCredential(cred)).user;
      if (!u || u.uid === old) { toast('지금과 같은 계정이에요'); return; }
      Cloud.gen += 1; rt.adopting = true; clearTimeout(Cloud.timer);   // 예전 계정으로 하던 저장은 멈춰요
      let srv = null;
      try { srv = (await waitFor(Cloud.db.ref('forest/saves/' + u.uid).once('value'), CLOUD_WAIT)).val(); }
      catch (e) { delLocal(); try { sessionStorage.setItem('forest-adopt', '계정을 바꿨어요. 학교를 불러오지 못해서 다시 열었어요'); } catch (x) { /* 무시 */ } location.reload(); return; }
      delLocal();
      if (srv && typeof srv.d === 'string') { if (adoptSave(srv.d, '구글 계정을 바꿨어요. 이 계정의 학교를 불러왔어요') === 'ok') return; }
      try { sessionStorage.setItem('forest-adopt', '구글 계정을 바꿨어요. 이 계정에는 학교가 없어서 새 학교로 시작해요'); } catch (e) { /* 무시 */ }
      location.reload();
    } catch (e) {
      const c = String(e && (e.code || e.message));
      if (!/cancel|popup-closed/i.test(c)) toast('계정을 바꾸지 못했어요. 잠시 뒤에 다시 해 보세요' + googleErrText(c));
    } finally { rt.acctBusy = false; }
  }
  async function logoutGoogle() {
    if (!cloudOn() || rt.acctBusy || !googleUser()) return;
    rt.acctBusy = true;
    try {
      if (!(await acctSaveFirst())) { toast('지금 학교를 저장하지 못했어요. 인터넷을 확인하고 다시 해 주세요'); return; }
      Cloud.gen += 1; rt.adopting = true; clearTimeout(Cloud.timer);
      try { const G = window.FOREST_GOOGLE; if (G && G.logout) await G.logout(); } catch (e) { /* 무시 */ }
      await Cloud.fb.auth().signOut();
      delLocal();
      try { sessionStorage.setItem('forest-adopt', '로그아웃했어요. 설정의 구글 계정 연결로 다시 로그인하면 학교를 이어 해요'); } catch (e) { /* 무시 */ }
      location.reload();
    } catch (e) {
      rt.adopting = false;
      toast('로그아웃하지 못했어요. 잠시 뒤에 다시 해 보세요');
    } finally { rt.acctBusy = false; }
  }
  // 판 잠금: 구글 계정이고 forest/webOk/<계정 번호>가 true면 열려요. 앱(안드로이드, 토스) 판에는 FS_WEB_LOCK이 없어요
  async function webLockCheck() {
    if (!window.FS_WEB_LOCK || !/(github\.io|web\.app|firebaseapp\.com)$/.test(location.hostname)) return;   // 자동 시험(localhost)과 앱 판은 잠그지 않아요
    const el = $('#webLock'), tx = $('#wlTx'), go = $('#wlGo'), id = $('#wlId'), cp = $('#wlCopy');
    clearTimeout(rt.wlT);
    // 고침: 켜자마자 부르면 서버에 붙는 중('wait')이라 연결 실패로 보였어요. 붙을 때까지 다시 봐요
    // 서버 학교와 이 기기 학교 중 고르는 창이 떠 있으면 그 창을 먼저 고를 수 있게 잠깐 비켜 줘요
    if (Cloud.state !== 'on' && Cloud.state !== 'off' && Cloud.state !== 'error') {
      el.hidden = !!rt.modalOpen; document.body.classList.toggle('wl-on', !rt.modalOpen);
      tx.textContent = '서버에 연결하는 중이에요'; go.hidden = true; rt.wlT = setTimeout(webLockCheck, 1000); return;
    }
    el.hidden = false; document.body.classList.add('wl-on');
    if (!cloudOn()) { tx.textContent = '서버에 연결하지 못했어요. 인터넷을 확인하고 새로 고침해 주세요'; go.hidden = true; rt.wlT = setTimeout(webLockCheck, 5000); return; }
    if (!Cloud.uid || !Cloud.db) { tx.textContent = '계정을 확인하는 중이에요'; go.hidden = true; rt.wlT = setTimeout(webLockCheck, 1200); return; }
    id.textContent = '계정 번호 ' + Cloud.uid; cp.hidden = false;
    if (!googleUser()) { tx.textContent = '테스트 전용 판이에요. 허용된 구글 계정으로 로그인해 주세요'; go.hidden = false; return; }
    let ok = false;
    try { ok = (await waitFor(Cloud.db.ref('forest/webOk/' + Cloud.uid).once('value'), CLOUD_WAIT)).val() === true; } catch (e) { ok = false; }
    if (ok) { el.hidden = true; document.body.classList.remove('wl-on'); return; }
    go.hidden = true;
    tx.textContent = '이 구글 계정은 아직 테스트 계정이 아니에요. 아래 계정 번호를 Firebase 콘솔의 forest/webOk에 true로 넣으면 열려요';
  }
  function askAcct(d, local) {
    let inc = null;
    try { inc = sanitize(JSON.parse(d)); } catch (e) { inc = null; }
    if (!inc) { adoptSave(local, '구글 계정을 연결했어요'); return; }
    const T = TIERS[inc.tier], y = Math.min(inc.tg + 1, T.years);
    $('#acctFrom').textContent = inc.rank.name ? `${inc.rank.name}의 학교` : '계정에 있는 학교';
    $('#acctInfo').textContent = `${T.school} ${y}${T.unit}, ${CFG.grades[inc.grade].name} 학교, 학교 파워 ${fmt(pwOf(inc))}`;
    rt.acctPick = { d, local };
    if (rt.modalOpen) closeModal(rt.modalOpen);
    setTimeout(() => openModal($('#mAcct')), 200);
  }
  /* 테스트 현황 (개발자 메뉴): forest/stats를 읽어 테스터마다 어디까지 했는지 보여요.
     같은 학교가 기기를 옮겼으면 가장 최근 기록 하나만 보여요 */
  const ENV_NAME = { kakao: '카카오톡', mobile: '휴대폰', pc: '컴퓨터' };
  const playText = s => s < 60 ? '1분 미만' : s < 3600 ? `${Math.floor(s / 60)}분` : `${Math.floor(s / 3600)}시간 ${Math.floor(s % 3600 / 60)}분`;
  function openStats() {
    if (!cloudOn()) { toast('서버에 연결되면 볼 수 있어요'); return; }
    $('#statsList').textContent = '';
    rt.stPick = new Set(); rt.stConfirm = false;
    openModal($('#mStats'));
    checkAdmin().then(loadStats);
  }
  /* 관리자: 비밀 글자 대신 구글 계정. Firebase 콘솔에서 forest/adminUids/<계정 번호>에 true를 넣은 계정만
     다른 테스터의 테스트 현황을 보고 지울 수 있어요(규칙이 막아 줘요). 규칙에 이메일은 적지 않아요(공개 저장소) */
  async function checkAdmin() {
    rt.isAdmin = false;
    try { rt.isAdmin = (await waitFor(Cloud.db.ref('forest/adminUids/' + Cloud.uid).once('value'), CLOUD_WAIT)).val() === true; } catch (e) { /* 아니면 일반 화면 */ }
    $('#stKeyForm').hidden = true;
    renderStatsDel();
  }
  function renderStatsDel() {
    const b = $('#statsDel'), n = rt.stPick ? rt.stPick.size : 0;
    b.hidden = !rt.isAdmin;
    b.setAttribute('aria-disabled', n ? 'false' : 'true');
    b.textContent = !n ? '지울 기록을 골라 주세요' : rt.stConfirm ? `정말 ${n}개를 지울까요? 한 번 더 누르면 지워요` : `고른 기록 ${n}개 지우기`;
  }
  async function deleteStats() {
    const n = rt.stPick.size;
    if (!rt.isAdmin || !n) { shake($('#statsDel')); return; }
    if (!rt.stConfirm) { rt.stConfirm = true; renderStatsDel(); return; }
    const ids = [...rt.stPick].flatMap(pid => rt.stIds.get(pid) || []);
    let bad = 0;
    for (const id of ids) { try { await waitFor(Cloud.db.ref('forest/stats/' + id).remove(), CLOUD_WAIT); } catch (e) { bad++; } }
    rt.stPick = new Set(); rt.stConfirm = false;
    toast(bad ? `${ids.length - bad}개를 지웠어요. ${bad}개는 지우지 못했어요` : `기록 ${n}개를 지웠어요`);
    loadStats();
  }
  function readStat(id, d) {
    if (!d || typeof d !== 'object' || typeof d.seen !== 'number') return null;
    const n = (v, max) => { v = Number(v); return isFinite(v) && v >= 0 ? Math.min(v, max) : 0; };
    const tier = Math.min(TIERS.length - 1, Math.floor(n(d.tier, 9))), T = TIERS[tier];
    return {
      id, seen: d.seen, born: n(d.born, 9e15), pid: typeof d.pid === 'string' && d.pid ? d.pid.slice(0, 16) : id,
      name: cleanName(d.name), tier, year: Math.max(1, Math.min(T.years, Math.floor(n(d.year, 99)))),
      town: Math.min(CFG.grades.length - 1, Math.floor(n(d.town, 9))),
      q: typeof d.q === 'string' ? d.q.slice(0, 8) : '', qt: typeof d.qt === 'string' ? d.qt.slice(0, 30) : '',
      play: n(d.play, 1e9), sess: Math.floor(n(d.sess, 1e6)), days: Math.floor(n(d.days, 1e5)), ads: Math.floor(n(d.ads, 1e6)),
      score: Math.floor(n(d.score, 1e12)), gearn: Math.floor(n(d.gearn, 1e9)), gspent: Math.floor(n(d.gspent, 1e9)), cos: Math.floor(n(d.cos, 999)), dev: !!d.dev, v: typeof d.v === 'string' ? d.v.slice(0, 10) : '', env: ENV_NAME[d.env] || ''
    };
  }
  /* 관리자는 테스트 현황에서 그 테스터의 학교를 구경해요(다른 학교 구경과 같은 보기 전용 화면)
     서버 규칙이 forest/saves/<id> 읽기를 관리자(forest/adminUids)에게만 열어 줘요. 저장을 읽어 학교 모습만 만들고, 내 학교는 건드리지 않아요 */
  function adminLookData(raw) {
    const st = parseSave(raw); if (!st) return null;
    const keep = S; let doc = null;
    try { S = st; doc = lookDoc(); } catch (e) { doc = null; } finally { S = keep; }
    return doc ? lookRead(doc) : null;
  }
  async function adminLook(id, name) {
    if (!rt.isAdmin || !cloudOn()) return;
    let v = null;
    try { v = (await waitFor(Cloud.db.ref('forest/saves/' + id).once('value'), CLOUD_WAIT)).val(); }
    catch (e) { toast(cloudErrKey(e) === 'rules' ? '새 서버 규칙을 게시해야 볼 수 있어요' : '불러오지 못했어요. ' + CLOUD_ERR.net); return; }
    if (!v || typeof v.d !== 'string') { toast('이 학교는 서버 저장이 없어요'); return; }
    const data = adminLookData(v.d);
    if (!data) { toast('학교 모습을 만들지 못했어요'); return; }
    data.who = `${name || '이름 없는 학교'} (관리자 보기)`;
    closeModal($('#mStats'), () => { sfx('tap'); setTab('school'); if (rt.decoEdit) decoEditEnd(); rt.lookData = data; rt.viewTier = data.t; rt.viewEdit = false; renderTierView(true); renderTierDots(); });
  }
  async function loadStats() {
    if (!cloudOn()) return;
    const sum = $('#statsSum'), list = $('#statsList');
    sum.textContent = '불러오는 중이에요';
    let v = null;
    try { v = (await waitFor(Cloud.db.ref('forest/stats').once('value'), CLOUD_WAIT)).val(); }
    catch (e) { sum.textContent = cloudErrKey(e) === 'rules' ? (rt.isAdmin ? '불러오지 못했어요. ' + CLOUD_ERR.rules : '테스트 현황은 관리자 계정만 볼 수 있어요') : '불러오지 못했어요. ' + CLOUD_ERR.net; return; }
    const now = Date.now() + Cloud.offset, best = new Map();
    rt.stIds = new Map();   // 같은 학교(pid)가 여러 기기에 남긴 기록을 한꺼번에 지우려고 모아 둬요
    Object.keys(v || {}).forEach(id => {
      const r = readStat(id, v[id]);
      if (!r) return;
      rt.stIds.set(r.pid, (rt.stIds.get(r.pid) || []).concat(id));
      const old = best.get(r.pid);
      if (!old || r.seen > old.seen) best.set(r.pid, r);
    });
    const rows = [...best.values()].sort((a, b) => b.seen - a.seen);
    if (rt.stPick) for (const pid of [...rt.stPick]) if (!best.has(pid)) rt.stPick.delete(pid);
    renderStatsDel();
    const today = rows.filter(r => now - r.seen < 86400000).length;
    const avg = rows.length ? rows.reduce((t, r) => t + r.play, 0) / rows.length : 0;
    sum.textContent = rows.length ? `테스터 ${rows.length}명, 하루 안에 들어온 사람 ${today}명, 평균 플레이 ${playText(avg)}` : '아직 기록이 없어요';
    list.textContent = '';
    rows.forEach(r => {
      const li = document.createElement('li');
      li.className = 'st-row';
      const top = document.createElement('div');
      top.className = 'st-top';
      if (rt.isAdmin) {
        const lb = document.createElement('label'), cb = document.createElement('input');
        lb.className = 'st-pick'; cb.type = 'checkbox'; cb.checked = rt.stPick.has(r.pid);
        cb.setAttribute('aria-label', (r.name || '이름 없는 학교') + ' 기록 고르기');
        cb.addEventListener('change', () => { cb.checked ? rt.stPick.add(r.pid) : rt.stPick.delete(r.pid); rt.stConfirm = false; li.classList.toggle('picked', cb.checked); renderStatsDel(); });
        lb.appendChild(cb); top.appendChild(lb);
        li.classList.toggle('picked', cb.checked);
      }
      const nm = document.createElement('b');
      nm.textContent = r.name || '이름 없는 학교';   // 테스터가 적은 이름이라 textContent로만 넣어요
      top.appendChild(nm);
      const tag = (t, me) => { const sp = document.createElement('span'); sp.className = 'rk-tag' + (me ? ' me' : ''); sp.textContent = t; top.appendChild(sp); };
      tag('#' + r.pid.slice(0, 4));
      if (r.id === Cloud.uid) tag('나', true);
      if (r.dev) tag('테스트 도구');
      if (rt.isAdmin && r.id !== Cloud.uid) {   // 관리자는 그 학교 구경
        const lk = document.createElement('button'); lk.type = 'button'; lk.className = 'btn-sub small st-look'; lk.textContent = '학교 보기';
        lk.addEventListener('click', () => adminLook(r.id, r.name)); top.appendChild(lk);
      }
      const ago = document.createElement('span');
      ago.className = 'ago';
      ago.textContent = agoText(r.seen - Cloud.offset);
      top.appendChild(ago);
      const T = TIERS[r.tier];
      const mid = document.createElement('div');
      mid.className = 'st-mid';
      mid.textContent = `${T.school} ${r.year}${T.unit}, ${CFG.grades[r.town].name}, 퀘스트 ${r.q}${r.qt ? ' ' + r.qt : ''}`;
      const bot = document.createElement('div');
      bot.textContent = [`플레이 ${playText(r.play)}`, `접속 ${r.sess}번`, `출석 ${r.days}일`, `광고 ${r.ads}번`, `학교 파워 ${fmt(r.score)}`, `황금 도토리 ${r.gearn}개 받고 ${r.gspent}개 씀`, r.cos ? `꾸미기 ${r.cos}개` : '',
        r.born ? `처음 ${agoText(r.born)}` : '', r.env, r.v && r.v !== VERSION ? `버전 ${r.v}` : ''].filter(Boolean).join(', ');
      li.append(top, mid, bot);
      list.appendChild(li);
    });
  }

