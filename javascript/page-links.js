/* Hotspot điều hướng (overlay runtime) — hỗ trợ CẢ 1 trang LẪN 2 trang (spread).
 *
 * Engine để link nội bộ (insertPageLink) trong config đã mã hoá -> ta phủ overlay trong
 * suốt lên TỪNG trang đang hiển thị, đặt vùng click theo % của trang đó, click thì gọi
 * gotoPageFun(target).
 *
 * QUAN TRỌNG (fix bug spread): khi cửa sổ rộng, book hiển thị 2 trang cạnh nhau (vd 6-7).
 * getCurrentPageIndex() chỉ trả 1 trang -> trang kia mất hotspot. Vì vậy ta dùng
 * BookInfo.getCurrentPages() (trả [6,7] hoặc [N]) và vẽ hotspot cho MỌI trang hiển thị,
 * mỗi trang theo rect ảnh riêng của nó. Toạ độ % nên tự co giãn desktop/mobile.
 */
(function () {
  var DEBUG = false; // true: vẽ viền đỏ để soi; đặt false khi xong

  var LINKS = {
    // Trang 2 = Mục lục
    2: [
      { l: 8, t: 34, w: 82, h: 5,  to: 3, label: 'Lợi ích DVC trực tuyến' },
      { l: 8, t: 40, w: 82, h: 5,  to: 4, label: 'Giới thiệu Cổng DVC Quốc gia' },
      { l: 8, t: 46, w: 82, h: 5,  to: 5, label: 'Ứng dụng VNeID' },
      { l: 9, t: 63, w: 39, h: 8,  to: 6, label: 'Có con nhỏ' }
    ],
    // Trang 6 = Có con nhỏ
    6: [
      { l: 8, t: 48, w: 50, h: 6,  to: 7, label: 'Đăng ký khai sinh' },
      { l: 8, t: 57, w: 62, h: 17, to: 9, label: 'Liên thông TTHC' }
    ]
  };
  // Footer "Quay lại Mục lục" -> trang 2, cho mọi trang nội dung
  [3, 4, 5, 6, 7, 8, 9, 10, 11].forEach(function (p) {
    (LINKS[p] = LINKS[p] || []).push({ l: 36, t: 93, w: 30, h: 5, to: 2, label: 'Quay lại Mục lục' });
  });

  var overlay = document.createElement('div');
  overlay.id = '__pagelinks';
  overlay.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:9000;';
  function mounted() {
    if (!overlay.parentNode && document.body) document.body.appendChild(overlay);
    return !!overlay.parentNode;
  }

  // Các trang đang hiển thị: [N] (1 trang) hoặc [chẵn, lẻ] (spread)
  function displayedPages() {
    try { var p = BookInfo.getCurrentPages(); if (Array.isArray(p) && p.length) return p; } catch (e) {}
    try { var c = BookInfo.getCurrentPageIndex(); if (c) return [c]; } catch (e) {}
    return [];
  }

  // Rect màn hình của ảnh trang idx (bản front-facing, to nhất trong viewport)
  function pageRect(idx) {
    var re = new RegExp('files/page/' + idx + '\\.jpg');
    var best = null;
    [].forEach.call(document.querySelectorAll('img'), function (i) {
      if (!re.test(i.src) || i.offsetParent === null) return;
      var r = i.getBoundingClientRect();
      if (r.width > 50 && r.left > -50 && r.left < window.innerWidth && (!best || r.width > best.width)) best = r;
    });
    return best;
  }

  var lastKey = '';
  function render() {
    if (!mounted()) return;
    var plan = [];
    displayedPages().forEach(function (idx) {
      var spots = LINKS[idx]; if (!spots) return;
      var rect = pageRect(idx); if (!rect) return;
      plan.push({ idx: idx, rect: rect, spots: spots });
    });
    var key = plan.map(function (p) {
      return p.idx + ':' + Math.round(p.rect.left) + ',' + Math.round(p.rect.top) + ',' + Math.round(p.rect.width);
    }).join('|');
    if (key === lastKey) return;
    lastKey = key;
    overlay.innerHTML = '';
    plan.forEach(function (p) {
      p.spots.forEach(function (s) {
        var a = document.createElement('div');
        a.title = s.label || ('-> ' + s.to);
        a.style.cssText = 'position:absolute;pointer-events:auto;cursor:pointer;border-radius:6px;'
          + 'left:' + (p.rect.left + s.l / 100 * p.rect.width) + 'px;'
          + 'top:' + (p.rect.top + s.t / 100 * p.rect.height) + 'px;'
          + 'width:' + (s.w / 100 * p.rect.width) + 'px;'
          + 'height:' + (s.h / 100 * p.rect.height) + 'px;'
          + (DEBUG ? 'background:rgba(255,0,0,.28);outline:2px solid #f00;' : 'background:transparent;');
        a.onclick = function (ev) {
          ev.preventDefault(); ev.stopPropagation();
          try {
            if (typeof window.gotoPageFun === 'function') window.gotoPageFun(s.to, false, 'pagelink');
            else if (window.flipBook && window.flipBook.gotoPage) window.flipBook.gotoPage(s.to);
          } catch (e) {}
        };
        overlay.appendChild(a);
      });
    });
  }

  setInterval(render, 200);
  window.addEventListener('resize', function () { lastKey = ''; render(); });
  render();
})();
