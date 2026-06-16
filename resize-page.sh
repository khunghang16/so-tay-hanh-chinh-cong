#!/usr/bin/env bash
# Resize 1 ảnh về đúng chuẩn của flipbook, tạo cả files/page lẫn files/thumb.
#   page : 1358x1920  (~350-520KB)
#   thumb: 340x480    (~55-60KB)
# Dùng: bash resize-page.sh <ảnh-nguồn> <số-trang> [quality]
#   vd : bash resize-page.sh ~/Desktop/trang-moi.jpg 1
#        bash resize-page.sh anh.png 5 75
set -euo pipefail

SRC="${1:?Thiếu ảnh nguồn}"
N="${2:?Thiếu số trang}"
Q="${3:-80}"   # chất lượng JPEG 0-100 (mặc định 80; giảm nếu muốn nhẹ hơn)

[[ -f "$SRC" ]] || { echo "Không thấy file: $SRC"; exit 1; }
cd "$(dirname "$0")"
mkdir -p files/page files/thumb

sips -s format jpeg -s formatOptions "$Q" -z 1920 1358 "$SRC" --out "files/page/$N.jpg"  >/dev/null
sips -s format jpeg -s formatOptions "$Q" -z 480  340  "$SRC" --out "files/thumb/$N.jpg" >/dev/null

echo "Trang $N:"
echo "  page : $(( $(stat -f%z files/page/$N.jpg)/1024 ))KB  ($(sips -g pixelWidth -g pixelHeight files/page/$N.jpg | awk '/pixel/{printf $2" "}'))"
echo "  thumb: $(( $(stat -f%z files/thumb/$N.jpg)/1024 ))KB ($(sips -g pixelWidth -g pixelHeight files/thumb/$N.jpg | awk '/pixel/{printf $2" "}'))"
echo "Reload trang (Cmd+R) để xem."
