#!/usr/bin/env python3
"""Generate the 128×128 extension icon: a cinnabar seal on xuan paper."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

SIZE = 512
OUT = Path(__file__).resolve().parent.parent / "packages" / "vscode" / "icon.png"

PAPER = "#f7f4ed"
PAPER_EDGE = "#ded3c0"
CINNABAR = "#b23a2e"
SEAL_INK = "#fbf3e6"

canvas = Image.new("RGBA", (SIZE, SIZE), PAPER)
draw = ImageDraw.Draw(canvas)
draw.rounded_rectangle((8, 8, SIZE - 8, SIZE - 8), radius=96, fill=PAPER, outline=PAPER_EDGE, width=6)

# Seal layer, rotated a couple of degrees like a hand-stamped mark.
seal = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
sdraw = ImageDraw.Draw(seal)
seal_box = (92, 92, SIZE - 92, SIZE - 92)
sdraw.rounded_rectangle(seal_box, radius=16, fill=CINNABAR)
inset = 24
sdraw.rounded_rectangle(
    (seal_box[0] + inset, seal_box[1] + inset, seal_box[2] - inset, seal_box[3] - inset),
    radius=6,
    outline=SEAL_INK,
    width=6,
)

font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Songti.ttc", 196, index=0)
glyph = "墨"
left, top, right, bottom = sdraw.textbbox((0, 0), glyph, font=font)
sdraw.text(
    ((SIZE - (right - left)) / 2 - left, (SIZE - (bottom - top)) / 2 - top),
    glyph,
    font=font,
    fill=SEAL_INK,
)

seal = seal.rotate(-3, resample=Image.BICUBIC, center=(SIZE / 2, SIZE / 2))
canvas = Image.alpha_composite(canvas, seal)

icon = canvas.resize((128, 128), Image.LANCZOS)
OUT.parent.mkdir(parents=True, exist_ok=True)
icon.save(OUT, optimize=True)
canvas.resize((512, 512), Image.LANCZOS).save(OUT.with_name("icon@512.png"), optimize=True)
print(f"wrote {OUT} and {OUT.with_name('icon@512.png')}")
