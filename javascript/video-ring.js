/* video-ring.js — Ring video + nút mở YouTube cho TRANG 7, chạy trên MỌI thiết bị.
 *
 * Ring gốc là item "effect" (lottie). Engine TẮT lottie trên ĐIỆN THOẠI THẬT
 * (isPhone() đọc user-agent _agent_.browser.device==DEVICE_PHONE, trong app.js/Vue),
 * nên iPhone không thấy ring (và mất luôn click mở video). Preview Chromium emulate
 * mobile chỉ hẹp width, vẫn là desktop UA -> isPhone()=false -> ring vẫn hiện -> dễ
 * tưởng OK. Vá trong Vue bundle rất giòn, nên thay hẳn bằng ring tự vẽ.
 *
 * Shim này: trên trang 7 -> ẨN ring lottie gốc (nếu engine có render trên desktop) rồi
 * vẽ ring bằng SVG/CSS (độc lập lottie) ĐÚNG vị trí/size theo `style` của item effect,
 * và mở popup YouTube (iframe) khi bấm. Vậy ring + click GIỐNG NHAU desktop lẫn mobile.
 * Vị trí + youTubeId đọc từ readerConfig (không hardcode). Nạp cuối index.html.
 */
(function () {
  var PAGE = 7;
  var pc = (window.readerConfig && readerConfig.pageConfig) || {};
  var PW = pc.pageWidth || 584, PH = pc.pageHeight || 825;

  function effItem() {
    try { return readerConfig.pages[PAGE - 1].items.filter(function (it) { return it.type === 'effect'; })[0]; }
    catch (e) { return null; }
  }
  function displayed() { try { var p = BookInfo.getCurrentPages(); return Array.isArray(p) ? p : []; } catch (e) { return []; } }
  function pageRect(idx) {
    var re = new RegExp('files/page/' + idx + '\\.jpg'), best = null;
    [].forEach.call(document.querySelectorAll('img'), function (i) {
      if (!re.test(i.src) || i.offsetParent === null) return;
      var r = i.getBoundingClientRect();
      if (r.width > 50 && r.left > -50 && r.left < window.innerWidth && (!best || r.width > best.width)) best = r;
    });
    return best;
  }

  var kf = document.createElement('style');
  kf.textContent = '@keyframes __vrspin{to{transform:rotate(360deg)}}';
  document.head.appendChild(kf);

  var overlay = document.createElement('div');
  overlay.id = '__videoring';
  overlay.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:9001;';

  function youTubeIdOf(eff) {
    var u = '';
    try { u = eff.actionList[0].popupVideo.videoInfo.youTubeId || ''; } catch (e) {}
    return (u.match(/[?&]v=([^&]+)/) || [])[1] || (u.match(/youtu\.be\/([^?&]+)/) || [])[1] || (/^[\w-]{6,}$/.test(u) ? u : '');
  }
  function openVideo(eff) {
    var id = youTubeIdOf(eff); if (!id) return;
    if (document.getElementById('__vrmodal')) return;
    var m = document.createElement('div');
    m.id = '__vrmodal';
    m.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.86);display:flex;align-items:center;justify-content:center;';
    m.innerHTML = '<div style="position:relative;width:min(94vw,920px);aspect-ratio:16/9;">'
      + '<iframe src="https://www.youtube.com/embed/' + id + '?autoplay=1&playsinline=1&rel=0" '
      + 'style="width:100%;height:100%;border:0;border-radius:10px;" '
      + 'allow="autoplay;encrypted-media;picture-in-picture;fullscreen" allowfullscreen></iframe>'
      + '<div role="button" aria-label="Đóng" style="position:absolute;top:-46px;right:0;width:38px;height:38px;'
      + 'line-height:36px;text-align:center;background:#fff;border-radius:50%;font-size:24px;color:#222;'
      + 'cursor:pointer;user-select:none;">&times;</div></div>';
    function close() { if (m.parentNode) m.parentNode.removeChild(m); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    m.addEventListener('click', function (ev) { if (ev.target === m || ev.target.getAttribute('role') === 'button') close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(m);
  }

  var lastKey = '';
  function render() {
    if (!overlay.parentNode && document.body) document.body.appendChild(overlay);
    var eff = effItem(), onPage = displayed().indexOf(PAGE) > -1, rect = onPage ? pageRect(PAGE) : null;
    if (!eff || !onPage || !rect) { if (overlay.innerHTML) { overlay.innerHTML = ''; lastKey = ''; } return; }

    // Ẩn ring lottie gốc của page 7 (nếu engine render trên desktop) -> khỏi đè 2 ring.
    [].forEach.call(document.querySelectorAll('.lottieBox'), function (b) {
      if (/161,\s*8,\s*8/.test(b.innerHTML)) b.style.visibility = 'hidden';
    });

    var s = eff.style;
    var L = parseFloat(s.left), T = parseFloat(s.top), W = parseFloat(s.width), H = parseFloat(s.height);
    var x = rect.left + L / PW * rect.width, y = rect.top + T / PH * rect.height;
    var w = W / PW * rect.width, h = H / PH * rect.height;
    var key = Math.round(x) + ',' + Math.round(y) + ',' + Math.round(w);
    if (key === lastKey && overlay.firstChild) return;
    lastKey = key;
    overlay.innerHTML = '';
    var box = document.createElement('div');
    box.title = 'Xem video';
    box.style.cssText = 'position:absolute;pointer-events:auto;cursor:pointer;left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;';
    box.innerHTML = '<svg viewBox="0 0 220 220" style="width:100%;height:100%;overflow:visible;display:block;">'
      + '<circle cx="110" cy="110" r="100" fill="none" stroke="rgb(161,8,8)" stroke-width="14" stroke-linecap="round" '
      + 'stroke-dasharray="78 78" style="transform-origin:110px 110px;animation:__vrspin 7s linear infinite;"/></svg>';
    box.onclick = function (ev) { ev.preventDefault(); ev.stopPropagation(); openVideo(eff); };
    overlay.appendChild(box);
  }

  setInterval(render, 250);
  window.addEventListener('resize', function () { lastKey = ''; render(); });
  render();
})();
