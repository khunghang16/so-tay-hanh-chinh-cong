/* Giới hạn flipbook chỉ hiển thị N trang đầu (tới hết mục "Có con nhỏ").
 *
 * Engine FlipHTML5 lấy số trang từ `bookConfig.totalPageCount` (giải mã từ blob
 * trong config.js) -> gán vào 2 biến global `originTotalPageCount` / `totalPageCount`,
 * và dựng ảnh từ mảng `fliphtml5_pages`. Script này KẸP các biến global đó về LIMIT
 * NGAY KHI engine gán (Object.defineProperty cài sẵn trước khi engine chạy).
 * KHÔNG đụng vào `window.bookConfig` vì engine có lúc gán null/ dựng lại -> vỡ.
 * Phải nạp NGAY SAU config.js và TRƯỚC engine (xem index.html).
 */
(function () {
  var LIMIT = 11;

  function clampPages(arr) {
    return Array.isArray(arr) && arr.length > LIMIT ? arr.slice(0, LIMIT) : arr;
  }

  // 1) Kẹp 2 biến đếm trang khi engine gán
  ['totalPageCount', 'originTotalPageCount'].forEach(function (name) {
    var val = window[name];
    try {
      Object.defineProperty(window, name, {
        configurable: true,
        get: function () { return val; },
        set: function (nv) {
          var n = parseInt(nv, 10);
          val = isNaN(n) ? nv : Math.min(n, LIMIT);
        }
      });
    } catch (e) {}
  });

  // 2) Cắt mảng ảnh trang (ảnh + thumbnail) khi engine gán
  var _fp = window.fliphtml5_pages;
  try {
    Object.defineProperty(window, 'fliphtml5_pages', {
      configurable: true,
      get: function () { return _fp; },
      set: function (arr) { _fp = clampPages(arr); }
    });
  } catch (e) {}
  if (_fp) _fp = clampPages(_fp);
})();
