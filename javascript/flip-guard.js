/* Chống "lật chồng" (overlapping flip).
 *
 * Khi bấm nút lật liên tục/nhanh hơn thời gian animation, callback của lần lật trước chạy
 * SAU khi lần lật sau đã reset this.flipInterval -> this.flipInterval.stop() trên undefined
 * (book.min.js flipIntervalTmp) -> "Cannot read properties of undefined (reading 'stop')".
 *
 * Cách chữa: chặn click nút lật nếu chưa qua cooldown (~ thời gian 1 lần lật ~300ms). Dùng
 * listener pha CAPTURE để chặn TRƯỚC handler của engine. Không ảnh hưởng hotspot điều hướng
 * (#__pagelinks) vì chúng không phải nút lật.
 */
(function () {
  var COOLDOWN = 360; // ms, > flippingTime (~300ms)
  var last = 0;
  var SEL = '.flip_button_right,.flip_button_left,.flip_button_first,.flip_button_last,'
          + '.flip_button_next,.flip_button_pre,.flip_button_prev';
  document.addEventListener('click', function (ev) {
    var t = ev.target;
    var btn = t && t.closest ? t.closest(SEL) : null;
    if (!btn) return;
    var now = window.performance ? performance.now() : Date.now();
    if (now - last < COOLDOWN) {
      ev.stopImmediatePropagation();
      ev.preventDefault();
      return;
    }
    last = now;
  }, true);
})();
