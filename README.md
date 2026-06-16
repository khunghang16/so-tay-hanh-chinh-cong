# Sổ tay điện tử — Bản mirror tĩnh

Clone tĩnh y hệt của https://sotaydientuhuongdantthc.hanoi.gov.vn/
("Sổ tay điện tử – Hướng dẫn hỗ trợ người dân & doanh nghiệp thực hiện TTHC",
Trung tâm Phục vụ Hành chính công TP. Hà Nội).

> Bản chất site gốc: một **flipbook (sách lật)** export từ **FlipHTML5** — convert PDF → sách lật web.
> Toàn bộ là file tĩnh, **không backend/DB**. Bản mirror này tự chứa hoàn toàn, không gọi ngược về server gốc.

## Chạy thử

```bash
cd so-tay-hanh-chinh-cong
bash download-videos.sh      # tải 9 video (~1.7GB) — bị loại khỏi git, xem bên dưới
python3 serve.py             # server có HTTP Range (cần cho <video>); cổng 8777
# mở http://localhost:8777
```

(Phải chạy qua HTTP server, KHÔNG mở trực tiếp file:// vì trình duyệt chặn fetch/worker.
Dùng `serve.py` thay vì `python3 -m http.server` — server mặc định không hỗ trợ Range
nên video sẽ không phát/seek được, nhất là trên Safari.)

## Video (không nằm trong git)

9 video nhúng trong các trang nặng ~1.7GB (file lớn nhất 302MB). GitHub chặn file >100MB
nên chúng bị loại qua `.gitignore`. Sau khi clone, chạy `bash download-videos.sh` để tải
lại từ server gốc vào `files/editor/files/extfile/`.

## Cấu trúc

```
index.html                     # trang gốc, nạp engine flipbook
javascript/
  config.js                    # CẤU HÌNH SÁCH (mã hoá): số trang, kích thước, mục lục, link
  BookPreview.js               # engine render sách lật
  LoadingJS.js, resource_skeleton.js, editor.js
  pdf.js, pdf.worker.js        # render PDF (pdf.js của Mozilla)
files/
  page/1..66.jpg               # ẢNH TỪNG TRANG (full, 1358x1920) — nội dung chính
  thumb/1..66.jpg              # thumbnail cho thanh điều hướng
  basic-html/page1..66.html    # bản HTML fallback (noscript/SEO) + images/ icon điều hướng
  search/book_config.js        # toàn bộ TEXT từng trang + chỉ mục tìm kiếm
  extfile/                     # loadingPicture.png, htmlIcon.png (favicon)
  shot.png                     # ảnh og:image
```

## Làm sản phẩm tương tự (thay nội dung của bạn)

Vì engine FlipHTML5 đọc cấu hình từ `config.js` (đã mã hoá) nên **sửa trực tiếp rất khó**.
Hai hướng nên dùng:

1. **Tạo lại bằng FlipHTML5** (giống hệt cách site gốc làm): có PDF mới của bạn → đưa vào
   FlipHTML5 (hoặc tool tương tự: Heyzine, Issuu, FlipBuilder) → export HTML → ra đúng cấu trúc này.

2. **Tự dựng flipbook open-source** (chủ động hoàn toàn): giữ lại ý tưởng "ảnh từng trang",
   thay `files/page/*.jpg` bằng ảnh của bạn, rồi render bằng thư viện free:
   - [StPageFlip](https://github.com/Nodlik/StPageFlip) — hiện đại, hỗ trợ mobile/touch
   - [turn.js](http://www.turnjs.com/) — kinh điển
   Khi đó bỏ `config.js`/`BookPreview.js` gốc, viết ~50 dòng JS nạp 1.jpg..N.jpg.

> Khuyến nghị cho mục tiêu "sản phẩm riêng": dùng hướng (2) để không phụ thuộc engine FlipHTML5.

## Lưu ý pháp lý
Đây là tài liệu công khai của cơ quan nhà nước. Khi làm sản phẩm riêng, hãy **thay toàn bộ
nội dung, logo, thương hiệu** — không tái sử dụng nhãn hiệu/nội dung TP. Hà Nội cho mục đích khác.
```
