#!/usr/bin/env python3
"""生成 Open Graph 分享封面 og-image.png (1200×630)"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
OUT = PUBLIC / "og-image.png"
W, H = 1200, 630


from typing import Optional, Tuple


def load_img(name: str, size: Optional[Tuple[int, int]] = None) -> Image.Image:
    img = Image.open(PUBLIC / name).convert("RGBA")
    if size:
        img = img.resize(size, Image.Resampling.LANCZOS)
    return img


def paste_centered(base: Image.Image, img: Image.Image, cx: int, cy: int) -> None:
    x = cx - img.width // 2
    y = cy - img.height // 2
    base.paste(img, (x, y), img)


def main() -> None:
    canvas = Image.new("RGB", (W, H), "#050a18")
    draw = ImageDraw.Draw(canvas)

    # 背景光晕
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse((280, 40, 920, 520), fill=(15, 240, 252, 38))
    gdraw.ellipse((620, 180, 1180, 620), fill=(255, 107, 53, 28))
    glow = glow.filter(ImageFilter.GaussianBlur(48))
    canvas.paste(glow, (0, 0), glow)

    # 网格
    grid = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g = ImageDraw.Draw(grid)
    step = 48
    for x in range(0, W, step):
        g.line([(x, 0), (x, H)], fill=(15, 240, 252, 18), width=1)
    for y in range(0, H, step):
        g.line([(0, y), (W, y)], fill=(15, 240, 252, 18), width=1)
    canvas.paste(grid, (0, 0), grid)

    # 品牌素材
    badge = load_img("bjtu-badge-white.png", (96, 96))
    icon = load_img("app-icon.png", (128, 128))
    logo = load_img("logo-horizontal.png", (420, int(420 * 0.28)))

    paste_centered(canvas, badge, W // 2, 118)
    paste_centered(canvas, icon, W // 2, 248)
    paste_centered(canvas, logo, W // 2, 368)

    # 文案
    try:
        title_font = ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", 28)
        sub_font = ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", 20)
        mono_font = ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", 16)
    except OSError:
        title_font = ImageFont.load_default()
        sub_font = title_font
        mono_font = title_font

    title = "北交大智慧校园 · 里世界 × 表世界"
    subtitle = "情绪共鸣 · 美食吐槽 · 3D 校园地图"
    footer = "bjtu.app · Powered by 扣子编程 × 火山引擎"

    def text_w(text, font):
        bbox = draw.textbbox((0, 0), text, font=font)
        return bbox[2] - bbox[0]

    draw.text(((W - text_w(title, title_font)) // 2, 430), title, fill=(210, 245, 255), font=title_font)
    draw.text(((W - text_w(subtitle, sub_font)) // 2, 478), subtitle, fill=(120, 210, 230), font=sub_font)
    draw.text(((W - text_w(footer, mono_font)) // 2, 548), footer, fill=(100, 160, 180), font=mono_font)

    # 边框
    border = ImageDraw.Draw(canvas)
    border.rounded_rectangle((24, 24, W - 24, H - 24), radius=20, outline=(15, 240, 252, 80), width=2)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT, "PNG", optimize=True)
    print(f"Wrote {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
