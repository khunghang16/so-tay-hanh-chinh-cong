#!/usr/bin/env python3
"""Static server with HTTP Range support — cần thiết để <video> phát/seek được
(Safari bắt buộc 206 Partial Content). Dùng: python3 serve.py [port]"""
import http.server, os, re, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8777

class RangeHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Accept-Ranges", "bytes")
        # Tắt cache trình duyệt khi dev — sửa file là thấy ngay sau khi reload
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def send_head(self):
        # Bỏ header điều kiện -> super() không bao giờ trả 304, luôn gửi bản mới nhất
        for h in ("If-Modified-Since", "If-None-Match"):
            if h in self.headers:
                del self.headers[h]
        rng = self.headers.get("Range")
        if not rng:
            return super().send_head()
        path = self.translate_path(self.path)
        if not os.path.isfile(path):
            return super().send_head()
        m = re.match(r"bytes=(\d+)-(\d*)", rng)
        if not m:
            return super().send_head()
        size = os.path.getsize(path)
        start = int(m.group(1))
        end = int(m.group(2)) if m.group(2) else size - 1
        end = min(end, size - 1)
        length = end - start + 1
        ctype = self.guess_type(path)
        f = open(path, "rb")
        f.seek(start)
        self.send_response(206)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(length))
        self.end_headers()
        # stream exactly `length` bytes
        self._range_remaining = length
        return _Limited(f, length)

class _Limited:
    """file-like wrapper that yields only N bytes to copyfile"""
    def __init__(self, f, n):
        self.f, self.n = f, n
    def read(self, bufsize=-1):
        if self.n <= 0:
            return b""
        chunk = self.f.read(min(bufsize if bufsize > 0 else 65536, self.n))
        self.n -= len(chunk)
        return chunk
    def close(self):
        self.f.close()

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    # ThreadingHTTPServer: xử lý nhiều kết nối song song. Bắt buộc — vì video
    # stream giữ kết nối mở lâu, server 1 luồng sẽ nghẽn cứng cả trang.
    httpd = http.server.ThreadingHTTPServer(("", PORT), RangeHandler)
    httpd.daemon_threads = True
    print(f"Serving (Range + threaded) at http://localhost:{PORT}")
    httpd.serve_forever()
