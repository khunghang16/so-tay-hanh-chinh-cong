/* Bộ test cho các shim tuỳ biến của flipbook (sotay-clone).
 * Phủ: limit-pages.js (kẹp 12 trang + getPagesByIndex => bìa sau ĐƠN), fix "sai page 10",
 * fix lỗi 'pageWidth' khi lật sang page 12, hotspot điều hướng (page-links.js),
 * anti-tamper (bookConfig không bị null khi lật).
 *
 * KHÔNG có test-runner Node trong repo — đây là engine chạy trong trình duyệt. Cách chạy:
 *   1) Mở flipbook (index.html) trong trình duyệt, ở CHẾ ĐỘ 2 TRANG (cửa sổ rộng >~1100px).
 *   2) Mở Console, paste toàn bộ file này (hoặc nạp như <script>).
 *   3) Gõ:  FlipTests.run().then(r => console.log(r.passed + '/' + r.total))
 *   Kết quả chi tiết in ở console + lưu tại window.__flipTestResults.
 * (Tự động chạy qua preview_eval: nạp file rồi gọi FlipTests.run().)
 */
(function () {
  var LIMIT = 12;          // tổng trang (11 nội dung + 1 bìa sau)
  var CONTENT_LAST = 11;   // trang nội dung cuối

  var results = [];
  function rec(name, pass, detail) { results.push({ name: name, pass: !!pass, detail: detail || '' }); }
  function eq(name, actual, expected) {
    rec(name, JSON.stringify(actual) === JSON.stringify(expected),
        'got ' + JSON.stringify(actual) + ' · want ' + JSON.stringify(expected));
  }
  function ok(name, cond, detail) { rec(name, cond, detail); }

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function settle() { // chờ animation lật xong (flipping=false)
    return new Promise(function (resolve) {
      var n = 0;
      (function chk() {
        var b = window.BookInfo && BookInfo.getBook && BookInfo.getBook();
        if (!b || !b.flipping || n > 80) return resolve();
        n++; setTimeout(chk, 50);
      })();
    });
  }
  function goto(p) { window.gotoPageFun(p, false, 'test'); return settle().then(function () { return wait(150); }); }
  function leftPageImg() { // số trang của ảnh đang nằm NỬA TRÁI viewport
    var W = window.innerWidth, H = window.innerHeight;
    var el = document.elementFromPoint(W * 0.25, H * 0.45);
    var img = el && el.querySelector ? el.querySelector('img') : (el && el.tagName === 'IMG' ? el : null);
    var src = img && img.src;
    var m = src && String(src).match(/page\/(\d+)\.jpg/);
    return m ? +m[1] : null;
  }
  function hotspotByTitle(t) {
    var ov = document.getElementById('__pagelinks');
    if (!ov) return null;
    return [].slice.call(ov.querySelectorAll('div')).filter(function (d) { return d.title === t; })[0] || null;
  }

  // bắt lỗi runtime 1 lần để kiểm tra "không còn lỗi pageWidth"
  var errors = [];
  if (!window.__flipErrHook) {
    window.__flipErrHook = true;
    window.addEventListener('error', function (e) { errors.push(e.message || String(e.error || e)); });
  }

  function syncTests() {
    // A) Kẹp số trang về 12
    eq('A1 totalPageCount = 12', window.totalPageCount, LIMIT);
    eq('A2 originTotalPageCount = 12', window.originTotalPageCount, LIMIT);
    eq('A3 fliphtml5_pages.length = 12', (window.fliphtml5_pages || []).length, LIMIT);
    ok('A4 BookInfo.getPageCount() = 12', window.BookInfo && BookInfo.getPageCount() === LIMIT,
       'got ' + (window.BookInfo && BookInfo.getPageCount()));

    // B) getPagesByIndex: ghép cặp đúng + bìa sau (page 12) ĐƠN
    ok('B1 getPagesByIndex override active', window.BookInfo && BookInfo.getPagesByIndex.__clamped);
    eq('B2 pair(1)  = [1]   (bìa trước đơn)', BookInfo.getPagesByIndex(1), [1]);
    eq('B3 pair(2)  = [2,3]', BookInfo.getPagesByIndex(2), [2, 3]);
    eq('B4 pair(10) = [10,11]', BookInfo.getPagesByIndex(10), [10, 11]);
    eq('B5 pair(11) = [10,11]', BookInfo.getPagesByIndex(11), [10, 11]);
    eq('B6 pair(12) = [12]  (BÌA SAU ĐƠN — fix chính)', BookInfo.getPagesByIndex(12), [12]);

    // C) Config nội dung
    var rc = window.readerConfig;
    ok('C1 video YouTube ở page 7', rc && JSON.stringify(rc.pages[6]).indexOf('popupVideo') > -1);
    eq('C2 page 12 đã dọn item rác', rc && rc.pages[11].items.length, 0);

    // D) page-links.js đã nạp (overlay tồn tại)
    ok('D1 overlay #__pagelinks tồn tại', !!document.getElementById('__pagelinks'));
  }

  function runAsync() {
    var bk = window.BookInfo && BookInfo.getBook && BookInfo.getBook();

    // E) Tiền đề: chế độ 2 trang (các test spread cần cửa sổ rộng)
    ok('E1 đang ở chế độ 2 trang (spread)', window.BookInfo && BookInfo.isDoublePage(),
       'isDoublePage=' + (window.BookInfo && BookInfo.isDoublePage()) + ' — nếu false, mở cửa sổ rộng hơn');

    // F) Page 12 là bìa sau ĐƠN + getCurrentPageWidthHeight KHÔNG văng 'pageWidth'
    return goto(12).then(function () {
      eq('F1 tại page 12: getCurrentPages = [12]', BookInfo.getCurrentPages(), [12]);
      // gọi trực tiếp hàm từng văng lỗi: nửa phải (x>0) trước đây đọc pageInfoArray[13]=undefined
      var threw = false, val = null;
      try {
        if (bk && bk.getCurrentPageWidthHeight) val = bk.getCurrentPageWidthHeight((bk.pageWidth || 100) * 0.4);
      } catch (e) { threw = true; }
      ok('F2 getCurrentPageWidthHeight(nửa phải) KHÔNG throw', !threw && val && val.pageWidth, threw ? 'THREW' : JSON.stringify(val));
      ok('F3 không có lỗi runtime "pageWidth"', !errors.some(function (m) { return /pageWidth/.test(m); }),
         errors.filter(function (m) { return /pageWidth/.test(m); }).join(' | '));
    }).then(function () {
      // G) Bug "sai page 10": back rồi next ở spread cuối -> nửa trái phải là page 10
      return goto(10);
    }).then(function () {
      eq('G1 về [10,11]', BookInfo.getCurrentPages(), [10, 11]);
      window.previousPageFun('test'); return settle().then(function () { return wait(150); });
    }).then(function () {
      eq('G2 back -> [8,9]', BookInfo.getCurrentPages(), [8, 9]);
      window.nextPageFun('test'); return settle().then(function () { return wait(150); });
    }).then(function () {
      eq('G3 next -> [10,11]', BookInfo.getCurrentPages(), [10, 11]);
      ok('G4 nửa trái hiển thị ĐÚNG page 10 (10.jpg)', leftPageImg() === 10, 'leftPageImg=' + leftPageImg());
    }).then(function () {
      // H) Không lật vượt quá page 12
      return goto(12);
    }).then(function () {
      var before = BookInfo.getCurrentPageIndex();
      window.nextPageFun('test'); return settle().then(function () { return wait(150); }).then(function () {
        ok('H1 không lật vượt quá page 12', BookInfo.getCurrentPageIndex() === before,
           'index sau next = ' + BookInfo.getCurrentPageIndex());
      });
    }).then(function () {
      // I) Hotspot điều hướng (page-links)
      return goto(2);
    }).then(function () {
      return wait(700); // chờ overlay render (poll 200ms + ảnh trang vào vị trí)
    }).then(function () {
      var ov = document.getElementById('__pagelinks');
      var n = ov ? ov.querySelectorAll('div').length : 0;
      ok('I1 page 2: có >=4 hotspot mục lục', n >= 4, 'hotspots=' + n);
      var conCon = hotspotByTitle('Có con nhỏ');
      ok('I2 có hotspot "Có con nhỏ"', !!conCon);
      if (conCon) conCon.click();
      return settle().then(function () { return wait(150); }).then(function () {
        eq('I3 click "Có con nhỏ" -> sang page 6 [6,7]', BookInfo.getCurrentPages(), [6, 7]);
      });
    }).then(function () {
      return wait(700);
    }).then(function () {
      var back = hotspotByTitle('Quay lại Mục lục');
      ok('I4 trang nội dung có hotspot "Quay lại Mục lục"', !!back);
      if (back) back.click();
      return settle().then(function () { return wait(150); }).then(function () {
        var p = BookInfo.getCurrentPages();
        ok('I5 click "Quay lại Mục lục" -> về mục lục (page 2)', p.indexOf(2) > -1, 'pages=' + JSON.stringify(p));
      });
    }).then(function () {
      // J) Anti-tamper: bookConfig KHÔNG bị null sau hàng loạt lần lật
      ok('J1 bookConfig còn nguyên sau khi lật (anti-tamper OK)',
         window.bookConfig && typeof window.bookConfig === 'object');
    });
  }

  function run() {
    results = []; errors.length = 0;
    if (!(window.BookInfo && window.gotoPageFun)) {
      var msg = { total: 0, passed: 0, failed: 1, error: 'Flipbook chưa sẵn sàng (BookInfo/gotoPageFun chưa có). Mở index.html và đợi sách dựng xong.' };
      window.__flipTestResults = msg; console.error(msg.error); return Promise.resolve(msg);
    }
    syncTests();
    return runAsync()
      .catch(function (e) { rec('RUNNER threw', false, String(e && e.stack || e)); })
      .then(function () { return goto(1); }) // reset về bìa trước
      .then(function () {
        var passed = results.filter(function (r) { return r.pass; }).length;
        var summary = { total: results.length, passed: passed, failed: results.length - passed, results: results };
        window.__flipTestResults = summary;
        console.log('%cFLIPBOOK TESTS  ' + passed + '/' + results.length + ' passed',
                    'font-weight:bold;font-size:13px;color:' + (passed === results.length ? '#0a0' : '#c00'));
        results.forEach(function (r) {
          console.log((r.pass ? '✅ ' : '❌ ') + r.name + (r.pass ? '' : '   — ' + r.detail));
        });
        return summary;
      });
  }

  window.FlipTests = { run: run };
})();
