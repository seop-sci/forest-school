# 옛 시험용 시계: 게임을 2026-11-01 0시(한국 시간)에 켠 것처럼 꾸며요.
# 게임 시계는 뒤로 가지 않아서, 시험이 정해 둔 날짜(2026년 11월)보다 오늘이 늦으면 그 날짜로 갈 수 없어요.
# 이 글을 add_init_script 맨 앞에 붙이면 켤 때의 '오늘'이 시험 날짜보다 앞이라 시험이 날짜와 상관없이 같게 돌아요.
PAST = ("(()=>{ const R = Date, sh = R.UTC(2026, 9, 31, 15, 0) - R.now();"
        " const D = class extends R { constructor(...a) { if (a.length) super(...a); else super(R.now() + sh); } static now() { return R.now() + sh; } };"
        " window.Date = D; })(); ")
