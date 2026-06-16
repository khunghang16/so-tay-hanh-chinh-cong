/* Vô hiệu hoá bẫy "anti-tamper" của engine FlipHTML5.
 *
 * Trong book.min.js có ĐÚNG MỘT chỗ:
 *   c = Module._getShadowRate(b,c,e,n,d, window.key_index, originTotalPageCount);
 *   1 < c && (window.bookConfig = null);
 * Giá trị `c` KHÔNG dùng để render (câu sau tính d không đụng tới c) — nó chỉ để phát
 * hiện sách đã bị chỉnh (số trang/ảnh khác bản gốc) rồi NULL hoá window.bookConfig.
 * Sau khi bị null, mọi thao tác kéo/lật trang crash:
 *   - bookConfig.FlipStyle.toLowerCase()  (getBookTye / isSlideBook)
 *   - bookConfig.upsideOnMobile()         (realPoint / onUp khi thả chuột)
 *   - ....stop()                          (flipIntervalTmp khi lật)
 *
 * Cách chữa an toàn nhất: kẹp giá trị trả về của _getShadowRate xuống ≤ 1, nên điều
 * kiện `1 < c` không bao giờ đúng, bookConfig không bao giờ bị xoá. Một "rate" hợp lệ
 * vốn nằm trong [0,1] nên kẹp không đổi hành vi render.
 *
 * Module nạp bất đồng bộ nên ta poll tới khi có rồi mới wrap.
 */
(function () {
  function wrap() {
    var M = window.Module;
    if (!M || typeof M._getShadowRate !== 'function') return false;
    if (M._getShadowRate.__patched) return true;
    var orig = M._getShadowRate;
    var patched = function () {
      var r = orig.apply(this, arguments);
      return (typeof r === 'number' && r > 1) ? 1 : r;
    };
    patched.__patched = true;
    try { M._getShadowRate = patched; return true; } catch (e) { return false; }
  }
  if (!wrap()) {
    var iv = setInterval(function () { if (wrap()) clearInterval(iv); }, 60);
    setTimeout(function () { clearInterval(iv); }, 30000);
  }
})();
