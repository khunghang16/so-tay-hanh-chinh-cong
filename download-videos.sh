#!/usr/bin/env bash
# Tải 9 video (~1.7GB) của flipbook từ server gốc về đúng thư mục.
# Video bị loại khỏi git (file >100MB GitHub không nhận) nên cần chạy script này
# sau khi clone repo. Dùng: bash download-videos.sh
set -euo pipefail

BASE="https://sotaydientuhuongdantthc.hanoi.gov.vn/files/editor/files/extfile"
DST="files/editor/files/extfile"
UA="Mozilla/5.0"

HASHES=(
  07fd06f76c65431242fd5687d5fbfb45
  1a2286c00c86efcbd62b0e80b118faf6
  5a3a0b1b61014bf4757d90d7936004be
  7a20705e1e243f0f442fb3194dee4576
  9eb3578e1a77c6ad22033f8cc320dfce
  a90fd916231efd286810f851f185d309
  b2790acd0fe7bfbac0e6a5d937316aae
  d155bc9caba33668c0645f8dc604fd0d
  d63264ab9cd506d8eed088767074a58e
)

cd "$(dirname "$0")"
mkdir -p "$DST"
echo "Tải ${#HASHES[@]} video vào $DST ..."
for h in "${HASHES[@]}"; do
  out="$DST/$h.mp4"
  if [[ -s "$out" ]]; then
    echo "  [skip] đã có $h.mp4"
    continue
  fi
  echo "  [get ] $h.mp4"
  curl -fL --retry 3 --max-time 1800 -A "$UA" "$BASE/$h.mp4" -o "$out"
done
echo "Xong. Chạy site: python3 serve.py  (mở http://localhost:8777)"
