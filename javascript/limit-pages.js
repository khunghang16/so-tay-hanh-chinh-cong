/* Giới hạn flipbook ở LIMIT trang: 11 trang nội dung + 1 BÌA SAU (page 12) = 12.
 *
 * Engine FlipHTML5 đọc số trang gốc từ bookConfig.totalPageCount=66 (giải mã từ blob
 * mã hoá trong config.js) -> originTotalPageCount/totalPageCount, và dựng ảnh từ mảng
 * fliphtml5_pages. Shim này KẸP mọi thứ về LIMIT=12 NGAY KHI engine gán
 * (Object.defineProperty cài trước khi engine chạy). KHÔNG đụng window.bookConfig
 * (engine có lúc gán null/dựng lại -> vỡ) và KHÔNG sửa bookConfig.totalPageCount (có
 * _VerifyBookConfig integrity check -> vỡ build). Nạp NGAY SAU config.js, TRƯỚC engine.
 *
 * 4 việc, để vừa fix "sai page 10" vừa cho page 12 là BÌA SAU ĐƠN như bản gốc:
 *  1) totalPageCount / originTotalPageCount = 12: để [10-11] là spread GIỮA -> page 10
 *     render đúng. (Bug "sai page 10": engine làm hỏng nửa TRÁI của spread CUỐI khi
 *     back rồi next; biến [10-11] thành spread giữa là hết. Để 11 thì bug quay lại.)
 *  2) fliphtml5_pages cắt còn 12 ảnh trang (+ thumbnail).
 *  3) getPageCount() -> 12: đồng bộ các check "trang cuối" (UI / biên) về 12.
 *  4) getPagesByIndex() LỌC bỏ trang > 12: mấu chốt để page 12 thành TRANG ĐƠN. Hàm
 *     gốc ghép cặp bằng `f <= bookConfig.totalPageCount` (=66) nên page 12 ra [12,13]
 *     (vì 13<=66) -> getCurrentPageWidthHeight đọc pageInfoArray[13]=undefined ->
 *     'Cannot read properties of undefined (reading pageWidth)' khi hover. Lọc >12 ->
 *     [12,13] thành [12] -> getCurrentPages=[12] -> render ĐƠN, căn giữa (isCoverPage(12)
 *     =true vì totalPageCount global=12) -> hết lỗi, đúng như bản gốc (page 66 đơn).
 * (Đã verify 2026-06.)
 */
(function () {
  var LIMIT = 12;   // 11 trang nội dung + 1 BÌA SAU (page 12). Xem chú thích đầu file.

  // Cache-buster cho ẢNH trang/thumb. URL ảnh gốc dùng version CỐ ĐỊNH (engine nối
  // "?<bookConfig.CreatedTime>") nên trình duyệt giữ ảnh cũ rất lâu (trước đây nginx
  // còn để cache 30 ngày) -> hard-reload không ăn vì ảnh do JS nạp động. Ta gắn thêm
  // "?v=ASSET_VER" vào path; engine sẽ nối tiếp bằng "&CreatedTime" (book.min.js:424
  // dùng "&" khi đã có "?") -> đổi ASSET_VER là đổi URL -> trình duyệt tải ảnh mới.
  // Kết hợp nginx "no-cache" cho ảnh (luôn revalidate) thì lần sau đổi ảnh KHÔNG cần
  // bump nữa — chỉ bump nếu muốn ép tải lại ngay với client còn kẹt cache cũ.
  var ASSET_VER = '20260616';
  function bustUrl(u) {
    return (typeof u === 'string' && /files\/(page|thumb)\//.test(u) && u.indexOf('?v=') < 0)
      ? u + '?v=' + ASSET_VER : u;
  }

  function clampPages(arr) {
    if (!Array.isArray(arr)) return arr;
    var out = arr.length > LIMIT ? arr.slice(0, LIMIT) : arr;
    out.forEach(function (it) { if (it) { it.l = bustUrl(it.l); it.t = bustUrl(it.t); } });
    return out;
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

  // 3) Override BookInfo.getPageCount() -> LIMIT (đồng bộ check "trang cuối" UI/biên)
  (function patchGetPageCount(c) {
    if (window.BookInfo && typeof BookInfo.getPageCount === 'function' && !BookInfo.getPageCount.__clamped) {
      var orig = BookInfo.getPageCount.bind(BookInfo);
      var wrapped = function () { var r = orig(); return (typeof r === 'number' && r > LIMIT) ? LIMIT : r; };
      wrapped.__clamped = true;
      try { BookInfo.getPageCount = wrapped; } catch (e) {}
      return;
    }
    if (c < 400) setTimeout(function () { patchGetPageCount(c + 1); }, 40);
  })(0);

  // 4) Override BookInfo.getPagesByIndex() -> LỌC trang > LIMIT khỏi cặp => page 12 ĐƠN
  //    (xem mục 4 ở chú thích đầu file). Page 1-11 không đổi (cặp đều <=12).
  (function patchGetPagesByIndex(c) {
    if (window.BookInfo && typeof BookInfo.getPagesByIndex === 'function' && !BookInfo.getPagesByIndex.__clamped) {
      var orig = BookInfo.getPagesByIndex.bind(BookInfo);
      var wrapped = function (b) {
        var r = orig(b);
        return Array.isArray(r) ? r.filter(function (p) { return p <= LIMIT; }) : r;
      };
      wrapped.__clamped = true;
      try { BookInfo.getPagesByIndex = wrapped; } catch (e) {}
      return;
    }
    if (c < 400) setTimeout(function () { patchGetPagesByIndex(c + 1); }, 40);
  })(0);
})();
