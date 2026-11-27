#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WALE COOKING — P04 asset generator.

Sinh tài nguyên minh họa NGUYÊN BẢN cho WALE COOKING dựa trên Design System
P03 (Pastel Mint). Chạy:  python3 scripts/p04_generate_assets.py
Sinh lại toàn bộ thư mục public/assets/ (idempotent, ghi đè).

Chỉ dùng hình khối vector tự vẽ; KHÔNG nhúng script, KHÔNG tham chiếu ngoài.
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "assets")

# --- Palette (khớp docs/P03/tokens/design-tokens.json) ---
CREAM     = "#FFF9F0"
MINT      = "#C9E8D5"
MINT_DARK = "#789B83"
PINK      = "#F8DDE3"
BEIGE     = "#E8DCC6"
BROWN     = "#594B40"
WHITE     = "#FFFFFF"
PRIMARY   = "#52705C"
SKIN      = BEIGE       # da nhân vật — dùng đúng màu brand Beige
BLUSH     = PINK        # má hồng — dùng đúng màu brand Soft Pink

STROKE = 3

def w(path, _directory, name, content):
    d = os.path.join(OUT, path)
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, name), "w", encoding="utf-8") as f:
        f.write(content)

def svg(vb, inner, width=None, height=None, extra=""):
    size = ""
    if width and height:
        size = ' width="%s" height="%s"' % (width, height)
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s"%s %s>\n%s\n</svg>\n'
            % (vb, size, extra, inner))

# =====================================================================
#  MASCOT  (khung 0 0 220 260)
# =====================================================================
def _hat():
    return (
        f'<g stroke="{BROWN}" stroke-width="{STROKE}" stroke-linejoin="round">'
        f'<ellipse cx="76" cy="66" rx="20" ry="20" fill="{CREAM}"/>'
        f'<ellipse cx="110" cy="52" rx="27" ry="25" fill="{CREAM}"/>'
        f'<ellipse cx="144" cy="66" rx="20" ry="20" fill="{CREAM}"/>'
        f'<rect x="72" y="76" width="76" height="18" rx="8" fill="{CREAM}"/>'
        f'</g>'
    )

def _head():
    return (
        f'<g stroke="{BROWN}" stroke-width="{STROKE}" stroke-linejoin="round">'
        f'<circle cx="60" cy="128" r="9" fill="{SKIN}"/>'
        f'<circle cx="160" cy="128" r="9" fill="{SKIN}"/>'
        f'<circle cx="110" cy="126" r="46" fill="{SKIN}"/>'
        f'</g>'
        f'<path d="M74 100c10-14 62-14 72 0-14-5-58-5-72 0z" fill="{BROWN}"/>'
    )

def _face(expr):
    e = f'<g stroke="{BROWN}" stroke-width="{STROKE}" stroke-linecap="round" fill="none">'
    cheeks = (f'<ellipse cx="76" cy="142" rx="10" ry="6" fill="{BLUSH}" stroke="none"/>'
              f'<ellipse cx="144" cy="142" rx="10" ry="6" fill="{BLUSH}" stroke="none"/>')
    if expr == "neutral":
        eyes = (f'<circle cx="92" cy="124" r="5" fill="{BROWN}"/>'
                f'<circle cx="128" cy="124" r="5" fill="{BROWN}"/>'
                f'<circle cx="94" cy="122" r="1.6" fill="{WHITE}"/>'
                f'<circle cx="130" cy="122" r="1.6" fill="{WHITE}"/>')
        mouth = f'<path d="M100 146c4 6 16 6 20 0"/>'
    elif expr == "happy":
        eyes = (f'<path d="M84 126c4-6 12-6 16 0" stroke-width="3.5"/>'
                f'<path d="M120 126c4-6 12-6 16 0" stroke-width="3.5"/>')
        mouth = f'<path d="M98 144c4 12 20 12 24 0z" fill="{BROWN}" stroke="none"/>' \
                f'<ellipse cx="110" cy="152" rx="6" ry="3.5" fill="{BLUSH}" stroke="none"/>'
    elif expr == "focus":
        eyes = (f'<circle cx="93" cy="127" r="5" fill="{BROWN}"/>'
                f'<circle cx="127" cy="127" r="5" fill="{BROWN}"/>'
                f'<path d="M84 116c4-4 12-4 16-1M120 115c4-3 12-3 16 1"/>')
        mouth = f'<path d="M103 148h14"/>'
    elif expr == "think":
        eyes = (f'<circle cx="95" cy="120" r="5" fill="{BROWN}"/>'
                f'<circle cx="129" cy="120" r="5" fill="{BROWN}"/>'
                f'<path d="M120 111c4-3 12-3 16 0"/>')
        mouth = f'<path d="M104 149c4-4 12-4 14 0"/>'
    elif expr == "star":
        eyes = (f'<path d="M92 118l2.6 6.4 6.4 2.6-6.4 2.6-2.6 6.4-2.6-6.4-6.4-2.6 6.4-2.6z" fill="{BROWN}" stroke="none"/>'
                f'<path d="M128 118l2.6 6.4 6.4 2.6-6.4 2.6-2.6 6.4-2.6-6.4-6.4-2.6 6.4-2.6z" fill="{BROWN}" stroke="none"/>')
        mouth = f'<path d="M98 144c4 12 20 12 24 0z" fill="{BROWN}" stroke="none"/>'
    elif expr == "sad":
        eyes = (f'<path d="M85 128c4 6 12 6 16 0" stroke-width="3.5"/>'
                f'<path d="M119 128c4 6 12 6 16 0" stroke-width="3.5"/>'
                f'<path d="M84 112c4-4 12-4 16-1M120 111c4-3 12-3 16 1"/>')
        mouth = f'<path d="M101 152c4-6 14-6 18 0"/>'
    else:
        eyes = ""
        mouth = ""
    return e + cheeks + eyes + mouth + "</g>"

def _torso():
    return (
        f'<g stroke="{BROWN}" stroke-width="{STROKE}" stroke-linejoin="round">'
        f'<rect x="96" y="158" width="28" height="16" fill="{SKIN}"/>'
        f'<path d="M66 214c0-30 16-44 44-44s44 14 44 44c0 14-8 22-22 22H88c-14 0-22-8-22-22z" fill="{CREAM}"/>'
        f'</g>'
        f'<g stroke="{BROWN}" stroke-width="{STROKE}" stroke-linejoin="round">'
        f'<path d="M74 214c0-24 14-36 36-36s36 12 36 36c0 12-7 18-19 18H93c-12 0-19-6-19-18z" fill="{MINT}"/>'
        f'<path d="M92 184c2-8 34-8 36 0" fill="none" stroke-width="2.5"/>'
        f'<rect x="98" y="206" width="24" height="18" rx="4" fill="{MINT_DARK}" stroke="none"/>'
        f'</g>'
    )

def _arm(side, pose, accessory):
    """side: 'L'|'R'. Trả về group cánh tay + bàn tay (+ vật thể nếu cần)."""
    skin = f'<circle cx="%d" cy="%d" r="9" fill="{SKIN}"/>'
    g = f'<g stroke="{BROWN}" stroke-width="{STROKE}" stroke-linecap="round" fill="none">'
    if side == "L":
        sx, sy = 74, 190
        if pose == "down":   hx, hy = 60, 236; p = f'M{sx} {sy}C56 202 54 220 60 234'
        elif pose == "open": hx, hy = 40, 216; p = f'M{sx} {sy}C56 200 46 206 42 214'
        elif pose == "up":   hx, hy = 52, 136; p = f'M{sx} {sy}C56 172 50 150 54 138'
        elif pose == "hold": hx, hy = 88, 210; p = f'M{sx} {sy}C74 200 80 206 88 208'
        else:                hx, hy = 60, 236; p = f'M{sx} {sy}C56 202 54 220 60 234'
    else:
        sx, sy = 146, 190
        if pose == "down":   hx, hy = 160, 236; p = f'M{sx} {sy}C164 202 166 220 160 234'
        elif pose == "open": hx, hy = 180, 216; p = f'M{sx} {sy}C164 200 174 206 178 214'
        elif pose == "up":   hx, hy = 168, 136; p = f'M{sx} {sy}C164 172 170 150 166 138'
        elif pose == "wave": hx, hy = 172, 132; p = f'M{sx} {sy}C166 170 172 146 172 134'
        elif pose == "chin": hx, hy = 129, 158; p = f'M{sx} {sy}C150 174 144 164 131 160'
        elif pose == "pan":  hx, hy = 176, 178; p = f'M{sx} {sy}C160 184 170 180 176 178'
        elif pose == "hold": hx, hy = 130, 210; p = f'M{sx} {sy}C146 200 140 206 132 208'
        else:                hx, hy = 160, 236; p = f'M{sx} {sy}C164 202 166 220 160 234'
    g += f'<path d="{p}"/>' + "</g>"
    # bàn tay
    hand = f'<g stroke="{BROWN}" stroke-width="{STROKE}">' + (skin % (hx, hy)) + "</g>"
    return g + hand

def mascot_inner(expr, pose, accessory=""):
    parts = ["<g stroke-linejoin='round'>"]
    parts.append(_hat())
    parts.append(_head())
    parts.append(_torso())
    # cánh tay trái, phải (vẽ sau torso, trước vật thể)
    left_pose = pose if pose in ("down", "open", "up", "hold") else "down"
    right_pose = pose
    parts.append(_arm("L", left_pose, accessory))
    parts.append(_arm("R", right_pose, accessory))
    # vật thể / phụ kiện
    if accessory == "card":
        parts.append(
            f'<g stroke="{BROWN}" stroke-width="{STROKE}" stroke-linejoin="round">'
            f'<rect x="86" y="196" width="48" height="58" rx="7" fill="{WHITE}"/>'
            f'<path d="M94 212h32M94 224h32M94 236h20" stroke-width="2.5" stroke-linecap="round"/>'
            f'<circle cx="122" cy="200" r="5" fill="{MINT}"/>'
            f'</g>'
            f'<g stroke="{BROWN}" stroke-width="{STROKE}">'
            f'<circle cx="88" cy="210" r="8" fill="{SKIN}"/>'
            f'<circle cx="132" cy="210" r="8" fill="{SKIN}"/></g>'
        )
    elif accessory == "pan":
        parts.append(
            f'<g stroke="{BROWN}" stroke-width="{STROKE}" stroke-linejoin="round">'
            f'<path d="M168 178h16" stroke-width="4" stroke-linecap="round"/>'
            f'<ellipse cx="198" cy="178" rx="16" ry="9" fill="{BROWN}"/>'
            f'<ellipse cx="198" cy="175" rx="12" ry="6" fill="{CREAM}" stroke="none"/>'
            f'</g>'
        )
    parts.append(_face(expr))
    if accessory == "sparkle":
        parts.append(
            f'<g fill="{MINT_DARK}" stroke="none">'
            f'<path d="M40 96l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"/>'
            f'<path d="M182 92l2.4 6.4 6.4 2.4-6.4 2.4-2.4 6.4-2.4-6.4-6.4-2.4 6.4-2.4z"/>'
            f'</g>'
        )
    if accessory == "question":
        parts.append(
            f'<path d="M170 74c0-8 12-8 12 0 0 5-6 5-6 9" stroke="{PRIMARY}" stroke-width="{STROKE}" '
            f'stroke-linecap="round" fill="none"/>'
            f'<circle cx="176" cy="92" r="2.6" fill="{PRIMARY}"/>'
        )
    parts.append("</g>")
    return "".join(parts)

MASCOT_VARIANTS = {
    "mascot-default":        ("neutral", "down",  ""),
    "mascot-happy":          ("happy",   "open",  ""),
    "mascot-cooking":        ("focus",   "pan",   "pan"),
    "mascot-holding-recipe": ("happy",   "hold",  "card"),
    "mascot-thinking":       ("think",   "chin",  "question"),
    "mascot-success":        ("star",    "up",    "sparkle"),
    "mascot-error":          ("sad",     "down",  ""),
    "mascot-waving":         ("happy",   "wave",  ""),
}

def build_mascot():
    for name, (expr, pose, acc) in MASCOT_VARIANTS.items():
        inner = mascot_inner(expr, pose, acc)
        content = svg("0 0 220 260", inner, 220, 260,
                      extra='role="img" aria-label="Mascot WALE COOKING"')
        w("mascot", "", name + ".svg", content)

# =====================================================================
#  BRAND / LOGO
# =====================================================================
def _mark_head(scale=1.0):
    """Đầu mascot rút gọn (dùng cho logo-mark, favicon, app icon)."""
    return (
        f'<g stroke="{BROWN}" stroke-width="{STROKE}" stroke-linejoin="round">'
        f'<ellipse cx="30" cy="22" rx="9" ry="9" fill="{CREAM}"/>'
        f'<ellipse cx="44" cy="15" rx="12" ry="11" fill="{CREAM}"/>'
        f'<ellipse cx="58" cy="22" rx="9" ry="9" fill="{CREAM}"/>'
        f'<rect x="28" y="27" width="32" height="8" rx="4" fill="{CREAM}"/>'
        f'<circle cx="44" cy="56" r="22" fill="{SKIN}"/>'
        f'</g>'
        f'<ellipse cx="34" cy="62" rx="5" ry="3" fill="{BLUSH}" stroke="none"/>'
        f'<ellipse cx="54" cy="62" rx="5" ry="3" fill="{BLUSH}" stroke="none"/>'
        f'<circle cx="37" cy="54" r="2.6" fill="{BROWN}"/>'
        f'<circle cx="51" cy="54" r="2.6" fill="{BROWN}"/>'
        f'<path d="M39 66c3 4 9 4 12 0" stroke="{BROWN}" stroke-width="2.4" '
        f'stroke-linecap="round" fill="none"/>'
    )

def build_brand():
    # Primary logo — mark + wordmark ngang
    inner = (
        f'<g transform="translate(6,8)">{_mark_head()}</g>'
        f'<g font-family="\'Baloo 2\', \'Nunito\', system-ui, sans-serif" font-weight="700">'
        f'<text x="108" y="52" font-size="34" fill="{BROWN}" letter-spacing="0.5">WALE</text>'
        f'<text x="108" y="80" font-size="20" fill="{PRIMARY}" letter-spacing="3">COOKING</text>'
        f'</g>'
    )
    w("brand", "", "logo-primary.svg",
      svg("0 0 340 96", inner, 340, 96, extra='role="img" aria-label="Logo WALE COOKING"'))

    # Compact logo — mark trên, wordmark dưới
    inner = (
        f'<g transform="translate(46,6)">{_mark_head()}</g>'
        f'<g font-family="\'Baloo 2\', \'Nunito\', system-ui, sans-serif" font-weight="700" text-anchor="middle">'
        f'<text x="88" y="122" font-size="20" fill="{BROWN}">WALE</text>'
        f'<text x="88" y="142" font-size="12" fill="{PRIMARY}" letter-spacing="2.5">COOKING</text>'
        f'</g>'
    )
    w("brand", "", "logo-compact.svg",
      svg("0 0 176 156", inner, 176, 156, extra='role="img" aria-label="Logo WALE COOKING (gọn)"'))

    # Mascot-only mark — đầu mascot trong badge
    inner = (
        f'<rect x="4" y="4" width="112" height="112" rx="28" fill="{MINT}"/>'
        f'<g transform="translate(16,18) scale(1)">{_mark_head()}</g>'
    )
    w("brand", "", "logo-mark.svg",
      svg("0 0 120 120", inner, 120, 120, extra='role="img" aria-label="Brand mark WALE COOKING"'))

    # Favicon 32 (mark rút gọn)
    inner = (
        f'<rect x="0" y="0" width="32" height="32" rx="8" fill="{MINT}"/>'
        f'<g transform="translate(3.2,3.8) scale(0.29)">{_mark_head()}</g>'
    )
    w("brand", "", "favicon.svg",
      svg("0 0 32 32", inner, 32, 32, extra='role="img" aria-label="WALE COOKING"'))

    # App / site icon 512
    inner = (
        f'<rect x="0" y="0" width="512" height="512" rx="112" fill="{MINT}"/>'
        f'<g transform="translate(51,61) scale(4.26)">{_mark_head()}</g>'
    )
    w("brand", "", "app-icon.svg",
      svg("0 0 512 512", inner, 512, 512, extra='role="img" aria-label="Biểu tượng ứng dụng WALE COOKING"'))

# =====================================================================
#  ICONS  (24x24, stroke=currentColor)
# =====================================================================
ICONS = {
  # --- Navigation ---
  "nav/home": '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-5.5h5V20"/>',
  "nav/recipes": '<path d="M12 6.5C10 5 7 4.5 4 4.5v13c3 0 6 .5 8 2 2-1.5 5-2 8-2v-13c-3 0-6 .5-8 2z"/><path d="M12 6.5v13"/>',
  "nav/categories": '<rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.6"/>',
  "nav/search": '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
  "nav/favorites": '<path d="M12 20C6.5 16 4 12.6 4 9.6A4.6 4.6 0 0 1 12.5 6.3 4.6 4.6 0 0 1 20 9.6c0 3-2.5 6.4-8 10.4z"/>',
  "nav/profile": '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6"/>',
  "nav/settings": '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.3M12 18.7V21M3 12h2.3M18.7 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"/>',
  # --- Cooking ---
  "cooking/ingredient": '<path d="M13.5 4.5 19.5 10.5 9.6 20.4a2.8 2.8 0 0 1-4-4z"/><path d="m6.6 13.4 4 4M9.6 10.4l3.4 3.4"/><path d="M13.5 4.5c-.6-2 1-3.6 3-3.6M18.2 9.2c2-.6 3.6 1 3.6 3"/>',
  "cooking/cooking-time": '<circle cx="12" cy="13.5" r="8"/><path d="M12 9.5v4l2.6 2"/><path d="M9 2.5h6M12 2.5V5.5"/>',
  "cooking/prep-time": '<path d="M7 3h10M7 21h10"/><path d="M8 3c0 4.2 4 5.2 4 9s-4 4.8-4 9M16 3c0 4.2-4 5.2-4 9s4 4.8 4 9"/>',
  "cooking/servings": '<path d="M7 3v6a2 2 0 0 0 4 0V3M9 9v12"/><path d="M16.5 3c1.8 0 3 2 3 5s-1 5-3 5V3zM16.5 13v8"/>',
  "cooking/difficulty": '<path d="M5 20v-6M12 20V9M19 20V4"/>',
  "cooking/cooking-method": '<path d="M12 3c2 3 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3s1 2 2 2c0-3 1-6 2-8z"/>',
  "cooking/temperature": '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/><circle cx="12" cy="17" r="1.4" fill="currentColor" stroke="none"/>',
  "cooking/nutrition": '<path d="M12 7c-1-2.4-4.4-2.4-6 0-1.6 2.4-1 7 2.5 9.6 1.5 1.1 2.4 0 3.5 0s2 1.1 3.5 0C19 14 19.6 9.4 18 7c-1.6-2.4-5-2.4-6 0z"/><path d="M12 7V4"/>',
  "cooking/allergen": '<path d="M12 3l7 3v6c0 4.2-3 7.4-7 9-4-1.6-7-4.8-7-9V6z"/><path d="M12 9.5v4"/><circle cx="12" cy="16.6" r="1" fill="currentColor" stroke="none"/>',
  # --- Interaction ---
  "interaction/add": '<path d="M12 5v14M5 12h14"/>',
  "interaction/edit": '<path d="M4 20l4-1 10-10-3-3L5 16z"/><path d="m13.5 6.5 3 3"/>',
  "interaction/delete": '<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/>',
  "interaction/save": '<path d="M6 3h12v18l-6-4-6 4z"/>',
  "interaction/share": '<circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="6" r="2.6"/><circle cx="18" cy="18" r="2.6"/><path d="M8.3 10.7 15.7 7.3M8.3 13.3l7.4 3.4"/>',
  "interaction/print": '<path d="M7 8V3h10v5"/><path d="M5 8h14v7h-3v5H8v-5H5z"/><path d="M8 15h8"/>',
  "interaction/filter": '<path d="M3 5h18l-7 8v6l-4-2v-4z"/>',
  "interaction/sort": '<path d="M8 4v16M8 4 5 7.5M8 4l3 3.5M16 20V4M16 20l-3-3.5M16 20l3-3.5"/>',
  "interaction/back": '<path d="M20 12H4"/><path d="m10 6-6 6 6 6"/>',
  "interaction/close": '<path d="M6 6l12 12M18 6 6 18"/>',
  "interaction/check": '<path d="m4 12 5 5 11-11"/>',
  "interaction/warning": '<path d="M12 4 2.5 20h19z"/><path d="M12 10v4"/><circle cx="12" cy="17.2" r="1" fill="currentColor" stroke="none"/>',
  "interaction/error": '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
  # --- Content ---
  "content/breakfast": '<ellipse cx="12" cy="12" rx="8.5" ry="7" fill="currentColor" opacity="0.15" stroke="none"/><ellipse cx="12" cy="12" rx="8.5" ry="7"/><circle cx="12" cy="12" r="3.4" fill="currentColor" stroke="none"/>',
  "content/lunch": '<path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M4 11h16"/><path d="M9 7c0-1 1-1 1-2M12 7c0-1 1-1 1-2M15 7c0-1 1-1 1-2"/>',
  "content/dinner": '<path d="M5 16a7 7 0 0 1 14 0z"/><path d="M4 16h16M12 9V6.5"/><circle cx="12" cy="5.5" r="1.2" fill="currentColor" stroke="none"/>',
  "content/dessert": '<path d="M7.5 11h9l-1 9.5h-7z"/><path d="M6 11a6 6 0 0 1 12 0"/><path d="M12 5v2"/>',
  "content/drink": '<path d="M6.5 8h11l-1 12.5h-9z"/><path d="M9 8l1-5h3"/><path d="m14.5 3-1.2 5"/>',
  "content/vegetarian": '<path d="M20 4c0 9-5 13-11 13-2 0-3.2-1.2-3.2-3.2C5.8 8 10 5 20 4z"/><path d="M4 20c2.2-4.2 6-7 11-8"/>',
  "content/meat": '<path d="M4 8.5h8.5a7.5 7.5 0 0 1 7.5 7.5v.5H7.5A3.5 3.5 0 0 1 4 13z"/><path d="M8.5 12.5h5"/>',
  "content/seafood": '<path d="M4 12c3-4.6 9.2-5 12.4-3l4.6-2-2 5 2 5-4.6-2C13.2 17 7 16.6 4 12z"/><circle cx="8.6" cy="11" r="1.1" fill="currentColor" stroke="none"/>',
  "content/baking": '<path d="M12 3v6"/><path d="M12 9c-3 0-4.6 3-4.6 6s1.6 6 4.6 6 4.6-3 4.6-6-1.6-6-4.6-6z"/><path d="M12 9c-1.6 0-2.4 3-2.4 6s.8 6 2.4 6 2.4-3 2.4-6-.8-6-2.4-6z"/>',
}

def build_icons():
    for path, body in ICONS.items():
        inner = (
            f'<g fill="none" stroke="currentColor" stroke-width="2" '
            f'stroke-linecap="round" stroke-linejoin="round">{body}</g>'
        )
        content = svg("0 0 24 24", inner, 24, 24,
                      extra='role="img" aria-hidden="true" focusable="false"')
        rel = path.split("/")
        w("icons/" + rel[0], "", rel[1] + ".svg", content)

# =====================================================================
#  ILLUSTRATIONS  (320x220)
# =====================================================================
def _blob(cx, cy, rx, ry, fill):
    return (f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{fill}"/>')

def build_illustrations():
    VB = "0 0 320 220"
    def compose(prop, blob_fill, mascot=(185, 24, 0.62), expr="happy", pose="happy"):
        scene = _blob(150, 118, 132, 88, blob_fill)
        m = mascot_inner(expr, pose, "")
        mx, my, ms = mascot
        return svg(VB, scene + prop + f'<g transform="translate({mx},{my}) scale({ms})">{m}</g>',
                   320, 220, extra='role="img" aria-label="Minh họa WALE COOKING"')

    # 1. Empty recipe list — bát trống + dấu +
    prop = (f'<g stroke="{BROWN}" stroke-width="4" fill="none" stroke-linecap="round">'
            f'<path d="M58 120h84a42 42 0 0 1-84 0z" fill="{WHITE}"/>'
            f'<path d="M54 120h92"/><path d="M100 90v-18M91 81h18"/></g>')
    w("illustrations", "", "empty-recipes.svg",
      compose(prop, BEIGE, expr="neutral", pose="down"))

    # 2. No search results — kính lúp rỗng
    prop = (f'<g stroke="{BROWN}" stroke-width="5" fill="none" stroke-linecap="round">'
            f'<circle cx="96" cy="96" r="34" fill="{WHITE}"/>'
            f'<path d="M120 120l22 22"/><path d="M84 96h24"/></g>')
    w("illustrations", "", "no-results.svg",
      compose(prop, PINK, expr="think", pose="chin"))

    # 3. Empty favorites — trái tim rỗng
    prop = (f'<g stroke="{BROWN}" stroke-width="5" fill="{WHITE}" stroke-linejoin="round">'
            f'<path d="M100 132C70 110 58 92 58 76a24 24 0 0 1 42-14 24 24 0 0 1 42 14c0 16-12 34-42 56z"/></g>')
    w("illustrations", "", "empty-favorites.svg",
      compose(prop, MINT, expr="neutral", pose="down"))

    # 4. Empty shopping list — tờ giấy + dòng
    prop = (f'<g stroke="{BROWN}" stroke-width="4" fill="{WHITE}" stroke-linejoin="round">'
            f'<rect x="58" y="60" width="90" height="104" rx="10"/>'
            f'<path d="M74 86h58M74 104h58M74 122h38" stroke-linecap="round"/></g>')
    w("illustrations", "", "empty-shopping-list.svg",
      compose(prop, BEIGE, expr="happy", pose="hold"))

    # 5. Loading — mascot + vòng xoay
    prop = (f'<g stroke="{PRIMARY}" stroke-width="6" fill="none" stroke-linecap="round">'
            f'<path d="M96 96a30 30 0 1 1-8 21"/></g>'
            f'<circle cx="96" cy="96" r="5" fill="{MINT_DARK}"/>')
    w("illustrations", "", "loading.svg",
      compose(prop, MINT, expr="happy", pose="open"))

    # 6. Error — dấu ! trong vòng
    prop = (f'<g stroke="{BROWN}" stroke-width="5" fill="{WHITE}">'
            f'<circle cx="98" cy="98" r="42"/>'
            f'<path d="M98 76v26" stroke-linecap="round"/>'
            f'<circle cx="98" cy="116" r="3.4" fill="{BROWN}" stroke="none"/></g>')
    w("illustrations", "", "error.svg",
      compose(prop, PINK, expr="sad", pose="down"))

    # 7. 404 — số 404
    prop = (f'<g font-family="\'Baloo 2\', system-ui, sans-serif" font-weight="700" '
            f'fill="{BROWN}"><text x="60" y="128" font-size="78">404</text></g>')
    w("illustrations", "", "404.svg",
      compose(prop, BEIGE, expr="think", pose="chin"))

    # 8. Success — dấu check trong vòng
    prop = (f'<g stroke="{BROWN}" stroke-width="5" fill="{MINT}">'
            f'<circle cx="98" cy="98" r="42"/>'
            f'<path d="m78 99 14 14 28-30" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>')
    w("illustrations", "", "success.svg",
      compose(prop, MINT, expr="star", pose="up"))

    # 9. Welcome / new user — vẫy tay + chào
    prop = (f'<g stroke="{MINT_DARK}" stroke-width="5" fill="none" stroke-linecap="round">'
            f'<path d="M64 92c8-10 20-10 28 0M64 116c8-10 20-10 28 0"/></g>'
            f'<g fill="{MINT_DARK}">'
            f'<path d="M50 70l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/>'
            f'<path d="M40 112l2.2 5.6 5.6 2.2-5.6 2.2-2.2 5.6-2.2-5.6-5.6-2.2 5.6-2.2z"/></g>')
    w("illustrations", "", "welcome.svg",
      compose(prop, PINK, expr="happy", pose="wave"))

# =====================================================================
def main():
    build_mascot()
    build_brand()
    build_icons()
    build_illustrations()
    # đếm
    total = 0
    for root, _, files in os.walk(OUT):
        total += len([f for f in files if f.endswith(".svg")])
    print("Đã sinh %d file SVG vào %s" % (total, OUT))

if __name__ == "__main__":
    main()
