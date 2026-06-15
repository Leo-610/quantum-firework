#!/usr/bin/env python3
"""生成 bjtu.app 二维码素材（PPT / 录屏片尾 / 分享海报）"""

import qrcode
from PIL import Image, ImageDraw, ImageFont

URL = 'https://bjtu.app'
SLOGAN = '你在红果园种下的不只是情绪，是这一刻的你，被时间记住。'
OUT = 'public'


def save_qr(path: str, dark: str, light: str) -> None:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=12,
        border=2,
    )
    qr.add_data(URL)
    qr.make(fit=True)
    qr.make_image(fill_color=dark, back_color=light).convert('RGB').save(path)


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for fp in (
        '/System/Library/Fonts/PingFang.ttc',
        '/System/Library/Fonts/STHeiti Light.ttc',
    ):
        try:
            return ImageFont.truetype(fp, size)
        except OSError:
            continue
    return ImageFont.load_default()


def save_share_card(path: str) -> None:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=2,
    )
    qr.add_data(URL)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color='#0ff0fc', back_color='#0a0e1a').convert('RGBA')
    qw, qh = qr_img.size
    w, h = 800, 1000
    card = Image.new('RGBA', (w, h), (10, 14, 26, 255))
    card.paste(qr_img, ((w - qw) // 2, 120), qr_img)
    draw = ImageDraw.Draw(card)
    brand = load_font(42)
    sub = load_font(28)
    body = load_font(22)

    draw.text((w // 2, 48), '量子烟火', fill='#0ff0fc', font=brand, anchor='mm')
    draw.text((w // 2, 95), 'Quantum Fireworks', fill='#7b2fff', font=sub, anchor='mm')
    draw.text((w // 2, 120 + qh + 50), URL, fill='#ffffff', font=sub, anchor='mm')
    draw.text(
        (w // 2, 120 + qh + 95),
        '扫码体验 · 北交大双模态校园智能体',
        fill='#94a3b8',
        font=body,
        anchor='mm',
    )

    line, lines, max_w = '', [], w - 80
    for ch in SLOGAN:
        test = line + ch
        if draw.textlength(test, font=body) > max_w and line:
            lines.append(line)
            line = ch
        else:
            line = test
    if line:
        lines.append(line)
    y = h - 80 - len(lines) * 32
    for ln in lines:
        draw.text((w // 2, y), ln, fill='#cbd5e1', font=body, anchor='mm')
        y += 32

    card.convert('RGB').save(path, quality=95)


def main() -> None:
    save_qr(f'{OUT}/bjtu-app-qrcode.png', '#0a0e1a', 'white')
    save_qr(f'{OUT}/bjtu-app-qrcode-dark.png', '#0ff0fc', '#0a0e1a')
    save_share_card(f'{OUT}/bjtu-app-qrcode-share-card.png')
    print(f'Generated 3 files in {OUT}/')


if __name__ == '__main__':
    main()
