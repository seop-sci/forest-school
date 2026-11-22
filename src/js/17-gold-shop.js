  /* ---------- 황금 도토리와 꾸미기 상점 ----------
     황금 도토리는 돈으로 사지 않고 모으기만 해요. 1.1.0부터 광고의 값어치를 올리려고 광고가 아닌 보상은 모두 1개로 줄였어요:
     광고마다 1개(3.0.0 조정안 3, 예전 3개. 상점 광고와 합쳐 하루 3번), 어려운 퀘스트와 출석 등의 보상은 각각 정해진 양을 줘요.
     쓰는 곳은 꾸미기와 테마 세트(계속 남아요), 부스터(1회 사용 가능). 뽑기 없이 정해진 값으로만 팔아요.
     토스 미니앱에서는 광고 그룹의 보상 이름을 '황금 도토리', 수량을 3으로 맞춰 두면 광고 화면에도 똑같이 보여요. */
  const GOLD = { hard: 1, adDay: 3, ad: 1, shopAd: 3, shopAdN: 3, att: 1, att7: 1, chapter: 1, grad: 1, promote: 1, rich: 60, essPer: 20 };
  // 지금까지 받은 황금 도토리가 60개(테마를 체험할 만큼)를 넘으면, 매일 매주 되풀이해 나오는 곳은 황금 도토리 1개 대신 숲의 정수 20을 줘요
  // 광고, 상점 광고, 축제와 대축제 도장판, 이벤트 기념 상자, 장 끝, 졸업, 학교급 올라가기, 마을 기부, 한 번만 나오는 보상은 그대로예요
  const goldRich = () => !!S && (S.st.gold || 0) >= GOLD.rich;
  function goldOr(n, why) {
    if (!(n > 0)) return null;
    const w = why ? ' ' + why : '';
    if (!goldRich()) { addGold(n); return { ic: 'gold', t: `황금 도토리 +${n}${w}` }; }
    const e = n * GOLD.essPer; addEss(e); return { ic: 'ess', t: `숲의 정수 +${e}${w}` };
  }
  const HATS = {
    crown: '<path d="M-6 -3 L-6.6 -9.4 L-3.2 -6.6 L0 -10.4 L3.2 -6.6 L6.6 -9.4 L6 -3 Z" class="h-crown"/><rect x="-6.2" y="-4.6" width="12.4" height="1.8" rx=".6" class="h-crown2"/><circle cx="0" cy="-6.8" r="1" class="h-gem"/>',
    cap: '<path d="M-6.2 -3.2 Q-6.4 -9.6 0 -9.8 Q6.4 -9.6 6.2 -3.2 Z" class="h-cap"/><path d="M-2 -3.6 Q4.6 -5.2 9.6 -3 Q4.8 -1.9 -2 -2.5 Z" class="h-cap2"/><circle cx="0" cy="-9.6" r="0.9" class="h-cap2"/>',
    beanie: '<path d="M-6.4 -2.6 Q-6.6 -10.2 0 -10.4 Q6.6 -10.2 6.4 -2.6 Z" class="h-bean"/><rect x="-6.9" y="-4.4" width="13.8" height="2.8" rx="1.3" class="h-bean2"/><circle cx="0" cy="-10.8" r="2" class="h-bean2"/>',
    straw: '<ellipse cx="0" cy="-4.2" rx="9.4" ry="2.1" class="h-straw"/><path d="M-4.9 -4.2 Q-5.1 -9.6 0 -9.8 Q5.1 -9.6 4.9 -4.2 Z" class="h-straw"/><path d="M-4.9 -5.4 Q0 -4.4 4.9 -5.4" class="s-hband"/>',
    beret: '<ellipse cx="0.6" cy="-5.8" rx="7" ry="3.4" class="h-beret"/><path d="M-6 -4.4 Q0 -2.8 6.6 -4.6" class="s-beret"/><circle cx="1.4" cy="-9.4" r="0.9" class="h-beret2"/>',   // 옷 세트
    bucket: '<path d="M-5 -3.8 L-4.4 -9 Q0 -10.4 4.4 -9 L5 -3.8 Z" class="h-bucket"/><path d="M-8.4 -3.4 Q0 -5.6 8.4 -3.4 Q0 -1.4 -8.4 -3.4 Z" class="h-bucket2"/>',
    flower: '<path d="M-5.8 -2.8 Q0 -9 5.8 -2.8" class="s-band"/><circle cx="-3.4" cy="-6.3" r="1.7" class="h-fl"/><circle cx="0" cy="-7.4" r="1.9" class="h-fl"/><circle cx="3.4" cy="-6.3" r="1.7" class="h-fl"/><circle cx="0" cy="-7.4" r="0.8" class="h-fl2"/>'
  };
  // 그림 모자(cos_hat_*): 작업지시서 3의 자리 안내(512칸, 아랫단 가운데가 y 360)에 맞춰 머리 위에 올려요
  const hatSVG = id => (HATS[id] && IMG('cos_hat_' + id) ? `<image href="${IMG('cos_hat_' + id)}" x="-8" y="-17.6" width="16" height="16"/>` : '') || HATS[id] ||   // 그림 모자(작업지시서 52)
    (IMG('cos_hat_' + id) ? `<image href="${IMG('cos_hat_' + id)}" x="-11.2" y="-18.75" width="22.4" height="22.4"/>` : '');
  const NECKS = {
    scarf: '<path d="M-4.8 5 Q0 7.2 4.8 5 L4.8 7 Q0 9.2 -4.8 7 Z" class="n-scarf"/><rect x="1.6" y="6.6" width="2.4" height="4.6" rx="1" class="n-scarf2"/>',
    bow: '<path d="M0 6.6 L-3.4 4.8 L-3.4 8.4 Z M0 6.6 L3.4 4.8 L3.4 8.4 Z" class="n-bow"/><circle cx="0" cy="6.6" r="1.1" class="n-bow2"/>',
    // 학생 옷 세트의 새 목 장식(그림 없이 그려요)
    bandana: '<path d="M-4.8 5 Q0 6.6 4.8 5 L0 10.4 Z" class="n-band"/><circle cx="0" cy="5.9" r="0.9" class="n-band2"/>',
    lei: '<circle cx="-4.4" cy="5.3" r="1.3" class="n-lei1"/><circle cx="-2.3" cy="6.7" r="1.3" class="n-lei2"/><circle cx="0" cy="7.2" r="1.3" class="n-lei1"/><circle cx="2.3" cy="6.7" r="1.3" class="n-lei2"/><circle cx="4.4" cy="5.3" r="1.3" class="n-lei1"/>',
    tie: '<path d="M-1.3 5.2 H1.3 L0.8 6.6 L1.7 10.6 L0 11.9 L-1.7 10.6 L-0.8 6.6 Z" class="n-tie"/><path d="M-1.3 5.2 H1.3 L0.8 6.6 H-0.8 Z" class="n-tie2"/>',
    bell: '<path d="M-4.8 5 Q0 7 4.8 5" class="s-bell"/><circle cx="0" cy="7.9" r="1.8" class="n-bell"/><path d="M-0.9 8.4 H0.9" stroke="#8A6A1E" stroke-width=".5"/>'
  };
  const COS = {
    hat: { name: '학생 모자', items: [
      { id: 'cap', name: '파란 야구모자', price: 8 }, { id: 'beanie', name: '빨간 털모자', price: 10 },
      { id: 'straw', name: '밀짚모자', price: 10 }, { id: 'flower', name: '꽃 머리띠', price: 12 },
      { id: 'crown', name: '금빛 왕관', price: 0, ex: true },
      // 한정 모자: 정수 상점에서 숲의 정수로만 사요(ess). 그림(cos_hat_*)으로 그려요
      { id: 'grad', name: '졸업모', price: 0, ess: 1, img: 1 }, { id: 'santa', name: '산타 모자', price: 0, ess: 1, img: 1 },
      { id: 'wizard', name: '마법사 모자', price: 0, ess: 1, img: 1 }, { id: 'mushroom', name: '버섯 모자', price: 0, ess: 1, img: 1 },
      { id: 'laurel', name: '월계관', price: 0, ess: 1, img: 1 },
      // 학생 옷 세트로만 사요(out). price는 옛 값(1.x 황금 상점)이라 이미 산 조각만큼 세트 값을 빼는 데 써요
      { id: 'beret', name: '보라 베레모', price: 0, out: 1 }, { id: 'bucket', name: '초록 벙거지', price: 0, out: 1 }] },
    neck: { name: '학생 목 장식', items: [
      { id: 'scarf', name: '빨간 목도리', price: 8 }, { id: 'bow', name: '나비넥타이', price: 8 },
      { id: 'bandana', name: '노란 손수건', price: 0, out: 1 }, { id: 'lei', name: '꽃 목걸이', price: 0, out: 1 },
      { id: 'tie', name: '빨간 넥타이', price: 0, out: 1 }, { id: 'bell', name: '방울 목걸이', price: 0, out: 1 }] }
  };
  /* 꾸미기 백화점 값(속도와 경제 재설계안 3절, Fable). 황금 도토리는 큰 꾸미기에만 써요(힘은 사지 않아요)
     테마 세트는 한 번에만 사요(이미 그 테마 배경을 샀으면 10 빼요). 옷 세트는 이미 산 조각의 옛 값만큼 빼요 */
  const ASK_GOLD = 30;   // 5.3.3 이 값 이상인 황금 품목만 사기 전에 한 번 더 물어요(docs/SHOP-2026-11.md)
  const GSHOP = { theme: 60, themeBgOff: 10, outfit: 25, outfitMin: 5, evDeco: 20, mark: 30 };
  const OUTFITS = [
    { id: 'ball', name: '야구 소년', hat: 'cap', neck: 'bandana' }, { id: 'snow', name: '겨울 산책', hat: 'beanie', neck: 'scarf' },
    { id: 'picnic', name: '여름 소풍', hat: 'straw', neck: 'lei' }, { id: 'garden', name: '꽃밭 친구', hat: 'flower', neck: 'bow' },
    { id: 'artist', name: '꼬마 화가', hat: 'beret', neck: 'tie' }, { id: 'camp', name: '숲속 캠핑', hat: 'bucket', neck: 'bell' }];
  const OUTFIT = Object.fromEntries(OUTFITS.map(o => [o.id, o]));
  const cosIt = (cat, id) => COS[cat].items.find(x => x.id === id);
  const ofOwnN = o => (S.cos.own.includes('hat:' + o.hat) ? 1 : 0) + (S.cos.own.includes('neck:' + o.neck) ? 1 : 0);
  const ofOwn = o => ofOwnN(o) === 2;
  const ofOn = o => S.cos.hat === o.hat && S.cos.neck === o.neck;
  const ofPrice = o => Math.max(GSHOP.outfitMin, GSHOP.outfit - (S.cos.own.includes('hat:' + o.hat) ? cosIt('hat', o.hat).price : 0) - (S.cos.own.includes('neck:' + o.neck) ? cosIt('neck', o.neck).price : 0));
  // 학교 마크 특별판: 마크 위에 덧씌워요(mkx:gold 같은 소유 열쇠)
  const MARKX = [['gold', '금테'], ['ribbon', '리본'], ['star', '반짝 별']];
  const MARKX_SVG = {
    gold: '<circle cx="50" cy="50" r="46" fill="none" stroke="#E2B12C" stroke-width="5"/><circle cx="50" cy="50" r="41.5" fill="none" stroke="#FFF1B8" stroke-width="1.6" opacity=".85"/><circle cx="50" cy="4.5" r="3.4" fill="#E2B12C"/>',
    ribbon: '<path d="M8 76 H24 V94 L16 88 L8 94 Z M76 76 H92 V94 L84 88 L76 94 Z" fill="#B13F38"/><path d="M14 72 H86 V88 H14 Z" fill="#D9534A"/><path d="M18 76 H82" stroke="#FFF1E6" stroke-width="1.4" opacity=".8"/>',
    star: '<path d="M14 6 l3 7 7 1 -5 5 1.5 7 -6.5 -3.5 -6.5 3.5 1.5 -7 -5 -5 7 -1z" fill="#F2C230"/><path d="M86 6 l3 7 7 1 -5 5 1.5 7 -6.5 -3.5 -6.5 3.5 1.5 -7 -5 -5 7 -1z" fill="#F2C230"/><path d="M86 74 l2 4.6 4.6 .6 -3.4 3.2 1 4.6 -4.2 -2.3 -4.2 2.3 1 -4.6 -3.4 -3.2 4.6 -.6z" fill="#FFE38A"/>'
  };
  const NIGHT_KEY = 'night:map';   // 밤 모드(문방구, 숲의 정수) 소유 열쇠
  // 이벤트 한정 학생 모자(작업지시서 27): 그 이벤트 도장 7개를 다 모으면 받아요. 상점에서는 팔지 않고 받은 뒤에만 보여요. 그림(cos_hat_ev_*)이 들어오기 전에는 나오지 않아요
  const EV_HAT = [['harvest', '도토리 모자'], ['friends', '무지개 리본 머리띠'], ['books', '책 핀 베레모'], ['lunch', '요리사 모자'], ['exam', '응원 머리띠'], ['xmas', '루돌프 머리띠'],
    ['newyear', '해님 머리띠'], ['winter1', '하늘색 귀마개'], ['winter2', '눈송이 털모자'], ['seollal', '조바위'], ['grad', '꽃 화관'], ['spring', '벚꽃 머리핀'], ['trip_spring', '노란 소풍 모자'],
    ['science', '실험 고글'], ['children', '바람개비 모자'], ['buddha', '연꽃 머리 장식'], ['final', '연필 머리띠'], ['vacation', '물안경'], ['liberation', '무궁화 머리핀'],
    ['fall', '해바라기 모자'], ['chuseok', '보름달 머리띠'], ['hangul', '꼬마 갓'], ['trip_fall', '단풍 베레모']];
  for (const [k, name] of EV_HAT) COS.hat.items.push({ id: 'ev_' + k, name, price: 0, evh: 1, img: 1 });
  const evHatArt = id => !!IMG('cos_hat_' + id);
  const COS_IDS = new Set(Object.keys(COS).flatMap(k => COS[k].items.map(it => k + ':' + it.id)));
  MARKX.forEach(([x]) => COS_IDS.add('mkx:' + x)); COS_IDS.add(NIGHT_KEY);
  const SP_IDS = new Set(['aquarium', 'cake', 'globelamp', 'dino', 'carousel'].map(id => 'sp:' + id));   // 특별 가구(정수 상점) 소유 열쇠
  /* 테마 세트: 테마마다 배경, 교실, 급식실, 도서관, 과학실, 운동장을 따로 사서 꾸며요
     여섯 개를 모두 모으면 세트 효과로 수업료가 올라요. 조정안 3: 모든 세트가 같은 값이라 효과도 세트마다 +3%, 일곱 벌 모두 +21%예요(세트마다 더해져요)
     색은 건물 그룹에 CSS 변수로 덮어쓰고, 처마에는 테마 장식(가랜드, 전구, 고드름)을 달아요 */
  const TH_SLOTS = [['bg', '배경'], ['classroom', '교실'], ['cafeteria', '급식실'], ['library', '도서관'], ['science', '과학실'], ['playground', '운동장']];
  const TH_SET_PER = 3;   // 조정안 3: 완성한 세트 하나의 수업료 효과(%). 예전에는 가장 비싼 세트 +30%, 합계 +162%
  const THEMES = [
    { id: 'spring', page: '#F3DDE4', board: '#5A3846', boardLine: '#74495B', name: '봄 벚꽃', price: 10, bgPrice: 15, fx: 'petal', motif: 'flowers', deco: ['#F5B3C6', '#FFFFFF', '#E796AE'],
      bg: { '--grass': '#D3E6B2', '--grass-deep': '#C1DA9A', '--leaf-1': '#F2B8C9', '--leaf-2': '#E89BB3', '--leaf-3': '#F7D3DE', '--path': '#F2E4CC' },
      bld: { '--roof': '#E796AE', '--roof-edge': '#C7758D', '--roof-2': '#F0A9BF', '--roof-k': '#E796AE', '--wall': '#FFF5F7', '--wall-2': '#F5DCE3', '--awning': '#F7C2D1', '--awning-2': '#FFFFFF' },
      lib: { '--leaf-1': '#F2B8C9', '--leaf-2': '#E594AD', '--leaf-3': '#F9D7E1' }, play: { '--field': '#CBE3A4', '--track': '#E8A6B9' } },
    { id: 'summer', page: '#CFE8EC', board: '#1F4A63', boardLine: '#2E6283', name: '여름 바다', price: 10, bgPrice: 15, fx: '', motif: 'bunting', deco: ['#3E8FC2', '#FFFFFF', '#F3C04B'],
      bg: { '--grass': '#BFE3C0', '--grass-deep': '#A9D7B0', '--leaf-1': '#5FB07A', '--leaf-2': '#3F9667', '--leaf-3': '#86C98F', '--path': '#F4E3B5' },
      bld: { '--roof': '#3E8FC2', '--roof-edge': '#2C6F9A', '--roof-2': '#5BB3D9', '--roof-k': '#3E8FC2', '--wall': '#FFFFFF', '--wall-2': '#E3F1F7', '--awning': '#5BB3D9', '--awning-2': '#FFFFFF', '--window': '#BDEBFA' },
      lib: { '--leaf-1': '#4FB37E', '--leaf-2': '#2F8F62', '--leaf-3': '#7FCC92', '--trunk': '#9A7048' }, play: { '--field': '#F2DFA6', '--track': '#4FB6C9' } },
    { id: 'autumn', page: '#EBDDB7', board: '#4A3526', boardLine: '#614631', name: '가을 단풍', price: 10, bgPrice: 15, fx: 'leaf', motif: 'leaves', deco: ['#E3873A', '#C8452F', '#F3C04B'],
      bg: { '--grass': '#E2D8A4', '--grass-deep': '#D6C686', '--leaf-1': '#E3873A', '--leaf-2': '#C8452F', '--leaf-3': '#F0B04A', '--path': '#EBD3A6' },
      bld: { '--roof': '#C8642F', '--roof-edge': '#9C4A20', '--roof-2': '#D98A3D', '--roof-k': '#C8642F', '--wall': '#FBEBD3', '--wall-2': '#F1D6AE', '--awning': '#E3873A', '--awning-2': '#FBEBD3' },
      lib: { '--leaf-1': '#E3873A', '--leaf-2': '#C8452F', '--leaf-3': '#F0B04A' }, play: { '--field': '#D9CF8E', '--track': '#C8642F' } },
    { id: 'winter', page: '#E5EDF2', board: '#2E4255', boardLine: '#40586F', name: '겨울 눈꽃', price: 12, bgPrice: 18, fx: 'snow', motif: 'icicles', deco: ['#FFFFFF', '#DDEEFB', '#B9D7EE'],
      bg: { '--grass': '#E9F0F4', '--grass-deep': '#D8E4EC', '--leaf-1': '#B9D3CF', '--leaf-2': '#8FB5B0', '--leaf-3': '#E4EEF0', '--path': '#F7FAFC' },
      bld: { '--roof': '#EEF3F7', '--roof-edge': '#B5C3CF', '--roof-2': '#DCE7EF', '--roof-k': '#EEF3F7', '--wall': '#F6F1E8', '--wall-2': '#E5DCCB', '--awning': '#9DC3E3', '--awning-2': '#FFFFFF' },
      lib: { '--leaf-1': '#E9F1F2', '--leaf-2': '#B6CFCB', '--leaf-3': '#FFFFFF' }, play: { '--field': '#F2F6F9', '--track': '#A9C6DD' } },
    { id: 'xmas', page: '#DCE9DF', board: '#1F4D33', boardLine: '#2D6646', name: '크리스마스', price: 14, bgPrice: 20, fx: 'snow', motif: 'lights', deco: ['#E04848', '#F3C04B', '#3FA45B'],
      bg: { '--grass': '#E4EEE6', '--grass-deep': '#CFE0D3', '--leaf-1': '#2F7D4A', '--leaf-2': '#1F6038', '--leaf-3': '#3E9459', '--path': '#F8F3EA' },
      bld: { '--roof': '#B8322F', '--roof-edge': '#8E2321', '--roof-2': '#2F7D4A', '--roof-k': '#B8322F', '--wall': '#FBF3E6', '--wall-2': '#EEDDC2', '--awning': '#C93A35', '--awning-2': '#FFFFFF' },
      lib: { '--leaf-1': '#2F7D4A', '--leaf-2': '#1F6038', '--leaf-3': '#3E9459' }, play: { '--field': '#F4F7F5', '--track': '#C93A35' } },
    { id: 'space', page: '#CBCEE9', board: '#1B1F45', boardLine: '#2C3266', name: '우주 탐험', price: 16, bgPrice: 24, fx: 'star', motif: 'stars', deco: ['#FFE38A', '#9FE7FF', '#C9B6FF'],
      bg: { '--grass': '#26305A', '--grass-deep': '#1D2549', '--leaf-1': '#5C4FA8', '--leaf-2': '#3E3486', '--leaf-3': '#7E70C9', '--path': '#4A5385' },
      bld: { '--roof': '#5B4FA8', '--roof-edge': '#3E3486', '--roof-2': '#7E70C9', '--roof-k': '#5B4FA8', '--wall': '#DCE2F2', '--wall-2': '#B9C2DE', '--awning': '#7E70C9', '--awning-2': '#DCE2F2', '--window': '#9FE7FF' },
      lib: { '--leaf-1': '#5C4FA8', '--leaf-2': '#3E3486', '--leaf-3': '#8E80D9', '--trunk': '#6D6A8C' }, play: { '--field': '#3A4677', '--track': '#8C7BD6' } },
    { id: 'retro', page: '#E9DEB6', board: '#3E4A2C', boardLine: '#55633C', name: '레트로 70', price: 14, bgPrice: 20, fx: '', motif: 'bunting', deco: ['#D9813B', '#2E8B88', '#F3C04B'],
      bg: { '--grass': '#D9D6A2', '--grass-deep': '#C9C484', '--leaf-1': '#8DA34A', '--leaf-2': '#6E8636', '--leaf-3': '#B0BF63', '--path': '#EBD7AE' },
      bld: { '--roof': '#D9813B', '--roof-edge': '#A85E26', '--roof-2': '#2E8B88', '--roof-k': '#D9813B', '--wall': '#F3E0B5', '--wall-2': '#E2C88E', '--awning': '#2E8B88', '--awning-2': '#F3C04B', '--window': '#BFE3D0' },
      lib: { '--leaf-1': '#8DA34A', '--leaf-2': '#6E8636', '--leaf-3': '#C9A93E' }, play: { '--field': '#C9C27A', '--track': '#D9813B' } }
  ];
  THEMES.forEach(t => { t.bonus = TH_SET_PER; });
  const THEME = Object.fromEntries(THEMES.map(t => [t.id, t]));
  const TH_IDS = THEMES.flatMap(t => TH_SLOTS.map(([s]) => `th:${t.id}:${s}`));
  // 처마 자리 (건물마다 장식을 다는 선): x1, x2, y
  const thEaves = k => { const [cx, cy, w] = bpos(k) || [0, 0, 0], e = geo().eaves[k] || 0; return [cx - w * 0.3, cx + w * 0.3, cy + w * e]; };
  const thOwn = (t, slot) => S.cos.own.includes(`th:${t}:${slot}`);
  const thCount = t => TH_SLOTS.filter(([s]) => thOwn(t, s)).length;
  function thSetsDone() { return THEMES.filter(t => thCount(t.id) === TH_SLOTS.length).reduce((a, t) => a + t.bonus, 0); }
  const setBonusMult = () => 1 + (rt.thBonus || 0) / 100;
  // 처마 장식
  function thMotif(t, x1, x2, y) {
    if (IMG('th_eave_' + t.id)) { const w = x2 - x1 + 6; return `<image href="${IMG('th_eave_' + t.id)}" x="${(x1 - 3).toFixed(1)}" y="${(y - 1.5).toFixed(1)}" width="${w.toFixed(1)}" height="${(w * 96 / 512).toFixed(1)}" preserveAspectRatio="none"/>`; }   // 그림 처마 띠
    const [a, b, c] = t.deco, n = Math.max(4, Math.round((x2 - x1) / 13)), step = (x2 - x1) / n;
    let h = '';
    if (t.motif === 'bunting' || t.motif === 'flowers' || t.motif === 'leaves') {
      h += `<path d="M${x1} ${y} Q${(x1 + x2) / 2} ${y + 6} ${x2} ${y}" fill="none" stroke="#6E4A2E" stroke-width="0.8" opacity=".7"/>`;
      for (let i = 0; i < n; i++) {
        const x = x1 + step * (i + 0.5), yy = y + 6 * (1 - Math.pow((x - (x1 + x2) / 2) / ((x2 - x1) / 2), 2)) * 0.95;
        const col = [a, b, c][i % 3];
        if (t.motif === 'bunting') h += `<path d="M${(x - 3.6).toFixed(1)} ${yy.toFixed(1)} h7.2 l-3.6 6.4 z" fill="${col}"/>`;
        else if (t.motif === 'flowers') h += `<g transform="translate(${x.toFixed(1)} ${(yy + 2.4).toFixed(1)})" fill="${col}"><circle cx="0" cy="-1.7" r="1.5"/><circle cx="1.6" cy="-0.5" r="1.5"/><circle cx="1" cy="1.4" r="1.5"/><circle cx="-1" cy="1.4" r="1.5"/><circle cx="-1.6" cy="-0.5" r="1.5"/><circle r="0.9" fill="#F3C04B"/></g>`;
        else h += `<path transform="translate(${x.toFixed(1)} ${(yy + 3).toFixed(1)}) rotate(${(i * 37) % 60 - 30})" d="M0 -3.2 L1 -1 L3 -1.6 L2 0.4 L3.2 2 L0.8 1.6 L0 3.4 L-0.8 1.6 L-3.2 2 L-2 0.4 L-3 -1.6 L-1 -1 Z" fill="${col}"/>`;
      }
    } else if (t.motif === 'lights') {
      h += `<path d="M${x1} ${y} Q${(x1 + x2) / 2} ${y + 6} ${x2} ${y}" fill="none" stroke="#2F3A2A" stroke-width="0.9"/>`;
      for (let i = 0; i < n; i++) {
        const x = x1 + step * (i + 0.5), yy = y + 6 * (1 - Math.pow((x - (x1 + x2) / 2) / ((x2 - x1) / 2), 2)) * 0.95;
        h += `<ellipse class="th-bulb d${i % 3}" cx="${x.toFixed(1)}" cy="${(yy + 2.6).toFixed(1)}" rx="1.7" ry="2.4" fill="${[a, b, c][i % 3]}"/>`;
      }
    } else if (t.motif === 'icicles') {
      h += `<path d="M${x1} ${y} H${x2}" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>`;
      for (let i = 0; i < n; i++) {
        const x = x1 + step * (i + 0.5), len = 3 + (i % 3) * 1.6;
        h += `<path d="M${(x - 1.6).toFixed(1)} ${y + 1} L${x.toFixed(1)} ${(y + 1 + len).toFixed(1)} L${(x + 1.6).toFixed(1)} ${y + 1} Z" fill="${i % 2 ? b : a}" opacity=".95"/>`;
      }
    } else if (t.motif === 'stars') {
      for (let i = 0; i < n; i++) {
        const x = x1 + step * (i + 0.5), yy = y + 2 + (i % 2) * 4;
        h += `<path class="th-twinkle d${i % 3}" transform="translate(${x.toFixed(1)} ${yy})" d="M0 -3 L0.8 -0.8 L3 0 L0.8 0.8 L0 3 L-0.8 0.8 L-3 0 L-0.8 -0.8 Z" fill="${[a, b, c][i % 3]}"/>`;
      }
    }
    return h;
  }
  /* 저장 안 된 테마로 바꾸면 그림을 받는 동안 화면이 깨져 보여요
     테마가 바뀔 때만 '테마 적용 중' 창을 덮고, 지도 그림을 다 받으면 걷어요(적어도 1초, 길어도 3초) */
  function themeVeil() {
    let v = $('#thVeil');
    if (!v) { v = document.createElement('div'); v.id = 'thVeil'; v.className = 'th-veil'; v.setAttribute('role', 'status'); v.innerHTML = '<div class="th-veil-box"><span class="th-veil-spin" aria-hidden="true"></span><b>테마 적용 중…</b></div>'; document.body.appendChild(v); }
    clearTimeout(rt.thVeilT); v.hidden = false; v.classList.remove('out');
    const t0 = Date.now(), done = () => { const w = Math.max(0, 1000 - (Date.now() - t0)); rt.thVeilT = setTimeout(() => { v.classList.add('out'); rt.thVeilT = setTimeout(() => { v.hidden = true; }, 260); }, w); };
    requestAnimationFrame(() => {
      const urls = [...new Set([...document.querySelectorAll('#map image')].map(e => e.getAttribute('href')).filter(u => u && !u.startsWith('data:')))];
      const one = u => new Promise(r => { const i = new Image(); i.onload = i.onerror = () => r(); i.src = u; });
      Promise.race([Promise.all(urls.map(one)), new Promise(r => setTimeout(r, 3000))]).then(done);
    });
  }
  function applyThemes() {
    const map = $('#map'), board = $('.board');
    { const sig = JSON.stringify(thOn()); if (rt.thSig != null && rt.thSig !== sig && (!window.__FOREST_TEST || window.__THVEIL)) themeVeil(); rt.thSig = sig; }
    const bgT = THEME[thOn().bg];   // 미리 보기 중에는 미리 보는 테마
    hudTheme();   // 현황판 틀도 테마 색으로
    // 지도 크기와 위치(fitMap)는 그대로 두고 테마 색만 지워요
    for (const T of THEMES) for (const k of Object.keys(T.bg)) map.style.removeProperty(k);
    board.removeAttribute('style'); board.removeAttribute('data-thf');
    document.body.classList.toggle('th-bg', !!bgT);
    document.body.style.setProperty('--th-bg', bgT ? bgT.page : '');
    setMapArt(); setSeasonArt();   // 테마 지도와 겨울 건물, 계절 참나무
    const dz = $('#thDeco');
    if (dz) {
      const tint = bgT && (has170(`${geo().map}_${bgT.id}`) || MAP_FILES.has(`${geo().map}_${bgT.id}`)) ? null :   /* 파일로만 있는 테마 지도(대학교)도 덮는 색을 꺼요 */ { space: ['#1B1F45', 0.45], retro: ['#B98A3E', 0.22] }[bgT && bgT.id];   // 작업지시서 46: 테마 지도 그림이 있으면 덮는 색을 꺼요(은 그림 위에 또 덮었어요)
      const own = bgT && IMG(`deco_${bgT.id}_1`);
      dz.innerHTML = (tint ? `<rect x="-300" y="-300" width="960" height="1020" fill="${tint[0]}" opacity="${tint[1]}" style="mix-blend-mode:multiply"/>` : '') +
        (own ? geo().deco.map(([x, y], i) => `<image x="${x - 24}" y="${y - 30}" width="48" height="48" href="${IMG(`deco_${bgT.id}_${i % 3 + 1}`)}"/>`).join('') : '');
      renderDeco(true);   // 장식과 간판 가까이의 스티커는 숨겨요
    }
    if (bgT) {
      for (const [k, v] of Object.entries(bgT.bg)) map.style.setProperty(k, v);
      board.style.setProperty('--board', bgT.board); board.style.setProperty('--board-line', bgT.boardLine);
      // 위쪽 도토리 칸(초록 고정)도 테마 칠판 색으로
      board.style.setProperty('--th-forest', bgT.board); board.style.setProperty('--th-forest-deep', `color-mix(in srgb, ${bgT.board} 75%, #000)`); board.setAttribute('data-thf', '');
    }
    for (const [slot] of TH_SLOTS) {
      if (slot === 'bg') continue;
      const g = $('#b-' + slot), t = THEME[thOn()[slot]];
      g.removeAttribute('style');
      let deco = g.querySelector('.th-deco');
      if (!deco) {
        deco = document.createElementNS(NS, 'g');
        deco.setAttribute('class', 'th-deco');
        deco.setAttribute('aria-hidden', 'true');
        g.querySelector('.built').appendChild(deco);
      }
      deco.innerHTML = '';
      const roof = $('.roofimg', g);
      if (roof) roof.style.display = t ? '' : 'none';
      if (!t) continue;
      // 겨울 테마 운동장은 트랙을 하늘색으로 칠하거나 고드름을 달지 않아요(얼음판처럼 보여 어색해요). 사도 운동장은 원래 모습이에요
      const thr = !!thrKey(slot);   // 새로 그린 테마 지붕: 처마 띠는 끄고(지붕 그림에 장식이 있어요), 겨울 운동장도 켜요
      if (slot === 'playground' && t.id === 'winter' && !thr) { if (roof) roof.style.display = 'none'; continue; }
      if (roof) $(`#rt-${slot} feFlood`).setAttribute('flood-color', slot === 'playground' && S.tier >= 1 ? t.play['--track'] : t.bld['--roof']);
      const vars = slot === 'library' ? t.lib : slot === 'playground' ? Object.assign({}, t.bld, t.play) : t.bld;
      for (const [k, v] of Object.entries(vars)) g.style.setProperty(k, v);
      deco.innerHTML = thr ? '' : thMotif(t, ...thEaves(slot));
    }
    rt.thBonus = thSetsDone();
    renderNight(true);   // 밤 모드
  }
  // 상점 그림: 칸마다 작은 건물 모양을 그 테마 색으로 그려요
  function thArt(t, slot) {
    if (IMG('th_slot_' + slot)) return `<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="7" fill="${t.page}"/><image href="${IMG('th_slot_' + slot)}" x="2" y="2" width="36" height="36"/></svg>`;   // 그림 칸 아이콘, 바탕은 테마 색
    const B = t.bld, BG = t.bg, P = t.play, L = t.lib;
    const ground = `<rect x="0" y="0" width="40" height="40" fill="${BG['--grass']}"/>`;
    if (slot === 'bg') {
      const dots = t.fx === 'star' ? '<circle cx="8" cy="7" r="1" fill="#FFE38A"/><circle cx="30" cy="10" r="1.2" fill="#fff"/><circle cx="20" cy="5" r=".8" fill="#9FE7FF"/>'
        : t.fx === 'snow' ? '<circle cx="8" cy="8" r="1.3" fill="#fff"/><circle cx="31" cy="6" r="1.2" fill="#fff"/><circle cx="22" cy="12" r="1" fill="#fff"/>'
        : t.fx === 'petal' ? '<circle cx="8" cy="9" r="1.3" fill="#F5B3C6"/><circle cx="30" cy="7" r="1.2" fill="#F5B3C6"/>'
        : t.fx === 'leaf' ? '<circle cx="9" cy="8" r="1.4" fill="#E3873A"/><circle cx="29" cy="9" r="1.3" fill="#C8452F"/>' : '';
      return `<svg viewBox="0 0 40 40" aria-hidden="true">${ground}<ellipse cx="12" cy="31" rx="10" ry="4" fill="${BG['--grass-deep']}"/><path d="M20 40 Q22 28 30 22" stroke="${BG['--path']}" stroke-width="4" fill="none"/><circle cx="31" cy="25" r="6" fill="${BG['--leaf-2']}"/><circle cx="28" cy="22" r="4" fill="${BG['--leaf-1']}"/><circle cx="9" cy="20" r="5" fill="${BG['--leaf-3']}"/>${dots}</svg>`;
    }
    if (slot === 'library') return `<svg viewBox="0 0 40 40" aria-hidden="true">${ground}<rect x="16" y="22" width="8" height="13" rx="2" fill="${L['--trunk'] || '#8A5D3B'}"/><circle cx="20" cy="17" r="11" fill="${L['--leaf-2']}"/><circle cx="14" cy="20" r="6" fill="${L['--leaf-1']}"/><circle cx="25" cy="13" r="5" fill="${L['--leaf-3']}"/><circle cx="16" cy="12" r="1.4" fill="${t.deco[0]}"/><circle cx="25" cy="20" r="1.4" fill="${t.deco[2]}"/></svg>`;
    if (slot === 'playground') return `<svg viewBox="0 0 40 40" aria-hidden="true">${ground}<ellipse cx="20" cy="24" rx="16" ry="10" fill="${P['--track']}"/><ellipse cx="20" cy="24" rx="12" ry="7" fill="${P['--field']}"/><path d="M8 11 H32" stroke="#6E4A2E" stroke-width=".7"/><path d="M10 11 h3 l-1.5 3z M16 11 h3 l-1.5 3z M22 11 h3 l-1.5 3z M28 11 h3 l-1.5 3z" fill="${t.deco[0]}"/></svg>`;
    if (slot === 'cafeteria') return `<svg viewBox="0 0 40 40" aria-hidden="true">${ground}<rect x="9" y="17" width="22" height="17" fill="${B['--wall']}"/><path d="M6 18 H34 L31 11 H9 Z" fill="${B['--roof-2']}"/><rect x="9" y="21" width="22" height="3" fill="${B['--awning']}"/><path d="M11 21h2v3h-2zM16 21h2v3h-2zM21 21h2v3h-2zM26 21h2v3h-2z" fill="${B['--awning-2']}"/><rect x="18" y="27" width="5" height="7" fill="#8A5D3B"/></svg>`;
    if (slot === 'science') return `<svg viewBox="0 0 40 40" aria-hidden="true">${ground}<path d="M12 19 Q12 9 20 9 Q28 9 28 19 Z" fill="${B['--roof-2']}"/><rect x="10" y="19" width="20" height="15" rx="1.5" fill="${B['--wall']}"/><rect x="9" y="18" width="22" height="2.4" rx="1" fill="${B['--roof-edge']}"/><circle cx="20" cy="25" r="3" fill="${B['--window'] || '#BEE0EA'}"/><path d="M28 11 l5 -4" stroke="#6E4A2E" stroke-width="1"/></svg>`;
    return `<svg viewBox="0 0 40 40" aria-hidden="true">${ground}<rect x="9" y="19" width="22" height="15" fill="${B['--wall']}"/><path d="M5 21 L20 8 L35 21 Z" fill="${B['--roof']}"/><rect x="6" y="20" width="28" height="2" fill="${B['--roof-edge']}"/><rect x="12" y="24" width="5" height="4" rx="1" fill="${B['--window'] || '#BEE0EA'}"/><rect x="23" y="24" width="5" height="4" rx="1" fill="${B['--window'] || '#BEE0EA'}"/><rect x="18" y="27" width="4" height="7" fill="#8A5D3B"/><path d="M9 21 Q20 25 31 21" stroke="${t.deco[0]}" stroke-width="1.4" fill="none"/></svg>`;
  }
  // 테마 세트는 한 번에만 사요(값 60, 그 테마 배경을 이미 샀으면 50). 이미 산 칸은 그대로 칸마다 쓰고 벗을 수 있어요
  const thSetPrice = t => GSHOP.theme - (thOwn(t, 'bg') ? GSHOP.themeBgOff : 0);
  function renderThemes(coin) {
    let h = `<h3 class="shop-h" data-cat="테마">테마 세트 <small>메인 화면, 배경 음악 | 세트당 수업료 +3%</small></h3>`;   // 5.3.3 설명은 머리에 한 번
    for (const t of THEMES) {
      const n = thCount(t.id), done = n === TH_SLOTS.length;
      const playing = Music.preview === t.id;
      const open = rt.thOpen === t.id;   // 5.3.3 테마 세트는 접힌 줄로, 누르면 펼쳐요
      h += `<div class="th-card${done ? ' done' : ''}${open ? ' open' : ' fold'}"><button class="th-fold" type="button" data-thfold="${t.id}" aria-expanded="${open}"><span class="th-sw">${thArt(t, 'bg')}</span><span class="th-nm"><b>${t.name}</b><small>${done ? '세트를 다 가졌어요' : `${n} / ${TH_SLOTS.length}칸 가짐`}</small></span>${done ? '<span class="pill own">가졌어요</span>' : `<span class="pill">${coin}${thSetPrice(t.id)}</span>`}</button>`;
      h += `<div class="th-body"><div class="th-top"><b>${t.name}</b><button class="th-play${playing ? ' on' : ''}" type="button" data-play="${t.id}" aria-pressed="${playing}">${playing ? '♪ 듣는 중' : '♪ 테마 곡 듣기'}</button><button class="th-play th-prev" type="button" data-thprev="${t.id}">미리 보기</button><span class="th-prog">${done ? '가졌어요' : n ? n + '/' + TH_SLOTS.length : ''}</span></div>` +
        (done ? '' : (() => { const p = thSetPrice(t.id), poor = S.gold < p;
          return `<button class="th-all${poor ? ' poor' : ''}" type="button" data-buy="s:${t.id}"><span>${n ? `남은 ${TH_SLOTS.length - n}칸까지 세트로 사기` : '세트 사기'}${thOwn(t.id, 'bg') ? ` <small>배경 산 값 ${GSHOP.themeBgOff} 빼 줌</small>` : ''}</span><b>${thOwn(t.id, 'bg') ? `<s>${GSHOP.theme}</s>` : ''}${coin}${p}</b></button>`; })()) +
        (() => { const own = TH_SLOTS.filter(([sl]) => thOwn(t.id, sl)), on = own.every(([sl]) => S.cos.th[sl] === t.id);
          return own.length >= 2 ? `<button class="th-apply${on ? ' on' : ''}" type="button" data-apply="${t.id}" aria-pressed="${on}">${on ? '이 테마를 모두 쓰는 중' : done ? '이 테마로 한 번에 바꾸기' : `가진 ${own.length}개 한 번에 쓰기`}</button>` : ''; })() +
        (done ? `<p class="th-bonus">세트 효과 수업료 +${t.bonus}% 받는 중</p>` : '') + '<div class="shop-grid">';
      for (const [slot, sname] of TH_SLOTS) {
        const own = thOwn(t.id, slot), on = S.cos.th[slot] === t.id;
        const pr = on ? '쓰는 중' : own ? '쓰기' : '세트로';
        h += `<button class="si${own ? ' own' : ' lock'}${on ? ' on' : ''}" type="button" data-buy="t:${t.id}:${slot}" aria-pressed="${on}" aria-label="${t.name} ${sname}">` +
          `<span class="pv">${thArt(t, slot)}</span><span class="nm">${sname}</span><span class="pr">${pr}</span></button>`;
      }
      h += '</div></div></div>';
    }
    return h;
  }
  TH_IDS.forEach(id => COS_IDS.add(id));
  const BOOST_ART = {
    feast: '<svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M-9 -1 H9 Q8.4 8 0 8.6 Q-8.4 8 -9 -1 Z" class="c-wall"/><path d="M-9 -1 H9" class="s-hatband"/><path d="M-6 -2 Q-6 -7 -2 -6.4 Q0 -9.4 3 -7 Q7 -7.6 6.4 -2 Z" class="c-dip"/><path d="M4 -10 L8 -3" stroke="#8A5D3B" stroke-width="1.2" stroke-linecap="round"/></svg>',
    skip: '<svg viewBox="-12 -12 24 24" aria-hidden="true"><circle r="9" class="c-clock"/><path d="M0 -5.6 V0 L4 2.6" fill="none" stroke="#6D4828" stroke-width="1.8" stroke-linecap="round"/></svg>',
    auto: '<svg viewBox="-12 -13 24 24" aria-hidden="true"><g transform="scale(1.25)">' + ACORN + '</g><path d="M6 -10 l1.2 2.6 2.6 1.2 -2.6 1.2 -1.2 2.6 -1.2 -2.6 -2.6 -1.2 2.6 -1.2 Z" class="c-gnut"/></svg>'
  };
  for (const k of Object.keys(BOOST_ART)) if (IMG('boost_' + k)) BOOST_ART[k] = `<svg viewBox="-12 -12 24 24" aria-hidden="true"><image href="${IMG('boost_' + k)}" x="-12" y="-12" width="24" height="24"/></svg>`;   // 작업지시서 52
  const GOLD_ICON = IMG('ic_gold_acorn') ? `<svg viewBox="-8 -11 16 20" aria-hidden="true"><image href="${IMG('ic_gold_acorn')}" x="-8" y="-9" width="16" height="16"/></svg>` : '<svg viewBox="-8 -11 16 20" aria-hidden="true"><path d="M-4.6 -1 Q-4.9 5.4 0 7.4 Q4.9 5.4 4.6 -1 Z" class="c-gnut"/><ellipse cx="-1.8" cy="2" rx="0.9" ry="2.1" class="c-gshine"/><path d="M-5.8 -0.8 Q-5.8 -6.2 0 -6.6 Q5.8 -6.2 5.8 -0.8 Q0 0.8 -5.8 -0.8 Z" class="c-gcap"/><path d="M-4 -3.2 H4 M-2.8 -5 H2.8" class="s-gline"/><path d="M0 -6.6 L0.9 -9.2" class="s-gstem"/></svg>';
  // 조금 어려운 퀘스트: 선생님 모두 키우기, 초당 도토리, 학생 50명 넘게, 시설 Lv.10 넘게, 도토리 15개 넘게 줍기.
  // 학생 부탁은 처음 한 번만 오는 이야기 부탁(s로 시작)만 쳐요. 반복 부탁은 끝없이 와서 넣지 않아요
  const hardQ = (q, sub) => !!q && (!sub || String(q.id)[0] === 's') && (q.t === 'teaAll' || q.t === 'rate' ||
    (q.t === 'students' && q.n >= 50) || (q.t === 'fac' && q.n >= 10 && !q.step) || (q.t === 'picks' && q.n >= 15) ||
    (q.t === 'trips' && q.n >= 3) || q.t === 'souv' || q.t === 'tripat' || q.t === 'sports' || q.t === 'fest');
  function goldDay() { const t = gameToday(); if (dayRoll(S.gd, t)) { S.gd.n = 0; S.gd.shop = 0; } }
  function addGold(n) {
    if (!(n > 0)) return;
    S.gold += n; S.st.gold += n;
    renderShopBtn();
    const b = $('#btnShop');
    if (!b.hidden) { const sp = document.createElement('span'); sp.className = 'gpop'; sp.textContent = '+' + n; b.appendChild(sp); setTimeout(() => sp.remove(), 1400); }
    if (rt.tab === 'shop') renderShop();
    if (rt.tab === 'street') renderStreet();
  }
  // 광고를 끝까지 보면 덤으로 3개 (상점 광고와 합쳐 하루 3번까지)
  // 광고를 끝까지 보면 받는 황금 도토리가 보이지 않았어요. 보상 창 뒤에 한 줄로 알려요
  function adGold() { goldDay(); if (S.gd.n >= GOLD.adDay) return; S.gd.n += 1; addGold(GOLD.ad); setTimeout(() => toast(`광고 선물! 황금 도토리 +${GOLD.ad} (오늘 ${S.gd.n}/${GOLD.adDay})`), 1300); }
