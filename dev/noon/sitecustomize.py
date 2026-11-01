# 밤 8시~자정(야간 건설 이벤트 시간)에 시험을 돌리면 기대값이 달라지는 시험이 있어요.
# 쓰는 법: cd dev && PYTHONPATH=noon python3 s37test.py
# Playwright로 여는 모든 브라우저 창의 시계를 그날 한국 시간 13시로 옮겨요(시간은 그대로 흘러요).
import playwright.async_api as _pa

_JS = """(() => {
  const D = Date, n = D.now(), day = 864e5, k = n + 324e5;
  const off = Math.floor(k / day) * day + 13 * 36e5 - 324e5 - n;
  class FD extends D { constructor(...a) { if (a.length) super(...a); else super(D.now() + off); } static now() { return D.now() + off; } }
  window.Date = FD;
})();"""

_orig = _pa.Browser.new_context
async def _new_context(self, *a, **k):
    ctx = await _orig(self, *a, **k)
    await ctx.add_init_script(_JS)
    return ctx
_pa.Browser.new_context = _new_context
