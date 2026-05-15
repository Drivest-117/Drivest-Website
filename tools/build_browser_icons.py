from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE_WORDMARK = ROOT / "assets" / "drivest-wordmark.png"
BRAND_CHARCOAL = (33, 30, 34, 255)
BRAND_ORANGE = (243, 93, 25, 255)
WHITE = (255, 255, 255, 255)

# Tight crop of the standalone steering-wheel locator mark inside the wordmark art.
MARK_BOX = (10, 10, 180, 214)


def main() -> None:
    mark = Image.open(SOURCE_WORDMARK).convert("RGBA").crop(MARK_BOX)
    mark = mark.crop(mark.getbbox())

    favicon_outputs = {
        ROOT / "favicon-16x16.png": 16,
        ROOT / "favicon-32x32.png": 32,
    }
    app_outputs = {
        ROOT / "apple-touch-icon.png": 180,
        ROOT / "android-chrome-192x192.png": 192,
        ROOT / "android-chrome-512x512.png": 512,
        ROOT / "assets" / "favicon-wheel.png": 512,
    }

    rendered_favicons = {}
    for destination, size in favicon_outputs.items():
        icon = build_favicon_icon(mark, size)
        destination.parent.mkdir(parents=True, exist_ok=True)
        icon.save(destination, format="PNG")
        rendered_favicons[size] = icon

    rendered_apps = {}
    for destination, size in app_outputs.items():
        icon = build_app_icon(mark, size)
        destination.parent.mkdir(parents=True, exist_ok=True)
        icon.save(destination, format="PNG")
        rendered_apps[size] = icon

    favicon_16 = rendered_favicons[16]
    favicon_32 = rendered_favicons[32]
    favicon_48 = build_favicon_icon(mark, 48)
    favicon_64 = build_favicon_icon(mark, 64)
    favicon_64.save(
        ROOT / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)],
        append_images=[favicon_48, favicon_32, favicon_16],
    )
    favicon_64.save(
        ROOT / "assets" / "favicon-wheel.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)],
        append_images=[favicon_48, favicon_32, favicon_16],
    )


def build_app_icon(mark: Image.Image, size: int) -> Image.Image:
    return build_tile_icon(
        mark,
        size,
        tile_inset_scale=0.045,
        radius_scale=0.16,
        border_scale=0.008,
        mark_scale=0.82,
        y_offset_scale=0.085,
        border_color=(236, 238, 242, 255),
    )


def build_favicon_icon(mark: Image.Image, size: int) -> Image.Image:
    glyph = build_favicon_glyph(mark)
    master_size = 192 if size <= 16 else 256 if size <= 32 else max(256, size * 4)
    master = build_tile_icon(
        glyph,
        master_size,
        tile_inset_scale=0.015,
        radius_scale=0.24,
        border_scale=0,
        mark_scale=0.8,
        y_offset_scale=0.12,
        fill_color=BRAND_ORANGE,
        border_color=BRAND_ORANGE,
    )
    icon = master.resize((size, size), Image.Resampling.LANCZOS)
    if size <= 16:
        icon = icon.filter(ImageFilter.UnsharpMask(radius=0.4, percent=210, threshold=1))
    elif size <= 32:
        icon = icon.filter(ImageFilter.UnsharpMask(radius=0.6, percent=190, threshold=1))
    return icon


def build_favicon_glyph(mark: Image.Image) -> Image.Image:
    wheel_only = mark.crop((0, 0, mark.width, round(mark.height * 0.77)))
    wheel_only = wheel_only.crop(wheel_only.getbbox())
    glyph = Image.new("RGBA", wheel_only.size, BRAND_CHARCOAL)
    glyph.putalpha(wheel_only.getchannel("A"))
    return glyph


def build_tile_icon(
    mark: Image.Image,
    size: int,
    *,
    tile_inset_scale: float,
    radius_scale: float,
    border_scale: float,
    mark_scale: float,
    y_offset_scale: float,
    fill_color: tuple[int, int, int, int] = WHITE,
    border_color: tuple[int, int, int, int],
) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    inset = max(1, round(size * tile_inset_scale))
    radius = round(size * radius_scale)
    border = max(0, round(size * border_scale))

    background = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(background)
    shape = (inset, inset, size - inset, size - inset)
    if border:
        draw.rounded_rectangle(shape, radius=radius, fill=fill_color, outline=border_color, width=border)
    else:
        draw.rounded_rectangle(shape, radius=radius, fill=fill_color)
    canvas.alpha_composite(background)

    target_width = round(size * mark_scale)
    target_height = round(size * mark_scale)
    scaled = ImageOps.contain(mark, (target_width, target_height), Image.Resampling.LANCZOS)
    x = (size - scaled.width) // 2
    y = max(inset, round(size * y_offset_scale))
    if y + scaled.height > size - inset:
        y = size - inset - scaled.height
    canvas.alpha_composite(scaled, (x, y))
    return canvas


if __name__ == "__main__":
    main()
