#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WALE COOKING — P04 asset validator.

Kiểm tra: XML hợp lệ, an toàn (không script/on*/foreignObject/image/external href),
có viewBox, quy tắc đặt tên, tông màu nằm trong palette P03, và tính nhất quán
nhận diện mascot. Chạy: python3 scripts/p04_validate_assets.py
"""
import os, re, sys, json
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "public", "assets")

# Palette hợp lệ (P03 tokens + tông da/má dẫn xuất + trắng)
PALETTE = {
    "#FFF9F0", "#C9E8D5", "#789B83", "#F8DDE3", "#E8DCC6", "#594B40",
    "#FFFFFF", "#52705C", "#F1DFC7", "#F4C9D3",
    # màu phụ trợ hợp lệ trong token P03
    "#FFFBF3", "#FBF3E8", "#6B5C4F", "#7A6A5B", "#8F7E66", "#A2937F",
    "#3F7D5B", "#A15C00", "#B3261E", "#2A6B9E",
    "#DCEAF5", "#2C5C42", "#8A1C16", "#7A4500", "#1E4E75",
}

errors, warnings = [], []
svg_files = []
for root, _, files in os.walk(ASSETS):
    for fn in sorted(files):
        if fn.endswith(".svg"):
            svg_files.append(os.path.join(root, fn))

name_re = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*\.svg$")
total_size = 0
mascot_headers = []

for path in svg_files:
    rel = os.path.relpath(path, ROOT)
    data = open(path, encoding="utf-8").read()
    total_size += os.path.getsize(path)

    # 1) XML hợp lệ
    try:
        tree = ET.fromstring(data)
    except ET.ParseError as e:
        errors.append("XML lỗi trong %s: %s" % (rel, e))
        continue

    # 2) An toàn
    low = data.lower()
    if "<script" in low:
        errors.append("Có <script> trong %s" % rel)
    if "<foreignobject" in low:
        errors.append("Có <foreignObject> trong %s" % rel)
    if "<image" in low:
        errors.append("Có <image> (nhúng ngoài) trong %s" % rel)
    if "doctype" in low or "<?xml-stylesheet" in low or "<!entity" in low:
        errors.append("Có DOCTYPE/stylesheet/ENTITY trong %s" % rel)
    if re.search(r"\son[a-z]+\s*=", low):
        errors.append("Có thuộc tính sự kiện on* trong %s" % rel)
    if re.search(r"(?:xlink:)?href\s*=\s*\"(?!#)", low):
        errors.append("Có href tham chiếu ngoài trong %s" % rel)

    # 3) viewBox
    if "viewbox" not in low:
        errors.append("Thiếu viewBox trong %s" % rel)

    # 3b) Không có text thô kiểu path-data ngoài thẻ (lỗi cấu trúc)
    path_data = re.compile(r"^\s*[Mm][0-9\s.,\-]+$")
    for el in tree.iter():
        if el.text and path_data.match(el.text):
            errors.append("Có path-data thô ngoài <path> trong %s: %r" % (rel, el.text[:30]))
            break

    # 4) Tên file
    if not name_re.match(os.path.basename(path)):
        errors.append("Tên file không đúng quy tắc kebab-case: %s" % rel)

    # 5) Màu ngoài palette
    for hexv in re.findall(r"#[0-9a-fA-F]{6}", data):
        if hexv.upper() not in PALETTE:
            warnings.append("Màu ngoài palette %s trong %s" % (hexv, rel))

# 6) Nhất quán mascot: cùng viewBox + cùng đầu (cx110 cy126 r46)
for path in svg_files:
    if "/mascot/" in path:
        d = open(path, encoding="utf-8").read()
        ok_vb = 'viewBox="0 0 220 260"' in d
        ok_head = 'cx="110" cy="126" r="46"' in d
        mascot_headers.append((os.path.basename(path), ok_vb, ok_head))
        if not ok_vb:
            errors.append("Mascot %s sai viewBox" % os.path.basename(path))
        if not ok_head:
            errors.append("Mascot %s thiếu đầu chuẩn (nhất quán nhận diện)" % os.path.basename(path))

# Báo cáo
print("Tổng file SVG: %d" % len(svg_files))
print("Tổng dung lượng: %.1f KB" % (total_size / 1024.0))
big = sorted(svg_files, key=os.path.getsize, reverse=True)[:5]
print("5 file lớn nhất:")
for p in big:
    print("  %6d B  %s" % (os.path.getsize(p), os.path.relpath(p, ROOT)))
print("Mascot (nhất quán viewBox/đầu): %d biến thể" % len(mascot_headers))
for n, vb, hd in mascot_headers:
    print("  %-28s viewBox=%s head=%s" % (n, vb, hd))

print("\n=== KẾT QUẢ ===")
print("Lỗi: %d" % len(errors))
for e in errors: print("  [E]", e)
print("Cảnh báo: %d" % len(warnings))
for wv in warnings: print("  [W]", wv)
sys.exit(1 if errors else 0)
