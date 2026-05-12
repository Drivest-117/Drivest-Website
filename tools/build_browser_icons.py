from pathlib import Path

from PIL import Image, ImageDraw, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE_WORDMARK = ROOT / "assets" / "drivest-wordmark.png"

# Tight crop of the standalone steering-wheel locator mark inside the wordmark art.
MARK_BOX = (10, 10, 180, 214)


def main() -> None:
    mark = Image.open(SOURCE_WORDMARK).convert("RGBA").crop(MARK_BOX)
    mark = mark.crop(mark.getbbox())

    outputs = {
        ROOT / "favicon-16x16.png": 16,
        ROOT / "favicon-32x32.png": 32,
        ROOT / "apple-touch-icon.png": 180,
        ROOT / "android-chrome-192x192.png": 192,
        ROOT / "android-chrome-512x512.png": 512,
        ROOT / "assets" / "favicon-wheel.png": 512,
    }

    rendered = {}
    for destination, size in outputs.items():
        icon = build_icon(mark, size)
        destination.parent.mkdir(parents=True, exist_ok=True)
        icon.save(destination, format="PNG")
        rendered[size] = icon

    ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
    rendered[512].save(ROOT / "favicon.ico", format="ICO", sizes=ico_sizes)
    rendered[512].save(ROOT / "assets" / "favicon-wheel.ico", format="ICO", sizes=ico_sizes)


def build_icon(mark: Image.Image, size: int) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    inset = max(1, round(size * 0.045))
    radius = round(size * 0.16)
    border = max(1, round(size * 0.008))

    background = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(background)
    draw.rounded_rectangle(
        (inset, inset, size - inset, size - inset),
        radius=radius,
        fill=(255, 255, 255, 255),
        outline=(236, 238, 242, 255),
        width=border,
    )
    canvas.alpha_composite(background)

    target_width = round(size * 0.78)
    target_height = round(size * 0.78)
    scaled = ImageOps.contain(mark, (target_width, target_height), Image.Resampling.LANCZOS)
    x = (size - scaled.width) // 2
    y = max(inset, round(size * 0.095))
    if y + scaled.height > size - inset:
        y = size - inset - scaled.height
    canvas.alpha_composite(scaled, (x, y))
    return canvas


if __name__ == "__main__":
    main()
