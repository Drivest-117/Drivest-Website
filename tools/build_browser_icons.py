from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE_WORDMARK = ROOT / "assets" / "drivest-wordmark.png"

# Tight crop of the standalone steering-wheel locator mark inside the wordmark art.
MARK_BOX = (10, 10, 180, 214)
BRAND_DARK = (0, 0, 0)
BRAND_ORANGE = (243, 93, 25)


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


def build_favicon_icon(mark: Image.Image, size: int) -> Image.Image:
    black_layer, orange_layer = split_mark_layers(mark)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    target_scale = 0.96 if size <= 16 else 0.94 if size <= 32 else 0.92
    target_width = round(size * target_scale)
    target_height = round(size * target_scale)
    scaled_black = ImageOps.contain(black_layer, (target_width, target_height), Image.Resampling.LANCZOS)
    scaled_orange = ImageOps.contain(orange_layer, (target_width, target_height), Image.Resampling.LANCZOS)
    if size <= 16:
        scaled_black = scaled_black.filter(ImageFilter.UnsharpMask(radius=0.4, percent=180, threshold=2))
        scaled_orange = scaled_orange.filter(ImageFilter.UnsharpMask(radius=0.4, percent=180, threshold=2))
        black_alpha = harden_alpha(scaled_black.getchannel("A"), floor=14, ceiling=135)
        orange_alpha = harden_alpha(scaled_orange.getchannel("A"), floor=10, ceiling=128).filter(
            ImageFilter.MaxFilter(3)
        )
        outline_kernel = 3
    elif size <= 32:
        black_alpha = harden_alpha(scaled_black.getchannel("A"), floor=10, ceiling=160)
        orange_alpha = harden_alpha(scaled_orange.getchannel("A"), floor=10, ceiling=160)
        outline_kernel = 3
    else:
        black_alpha = harden_alpha(scaled_black.getchannel("A"), floor=8, ceiling=175)
        orange_alpha = harden_alpha(scaled_orange.getchannel("A"), floor=8, ceiling=175)
        outline_kernel = 3
    scaled_black.putalpha(black_alpha)
    scaled_orange.putalpha(orange_alpha)

    x = (size - scaled_black.width) // 2
    y = max(0, (size - scaled_black.height) // 2 - max(0, round(size * 0.05)))

    outline_mask = ImageChops.subtract(black_alpha.filter(ImageFilter.MaxFilter(outline_kernel)), black_alpha)
    outline_strength = 205 if size <= 16 else 210
    outline = Image.new("RGBA", scaled_black.size, (255, 255, 255, 0))
    outline.putalpha(outline_mask.point(lambda value: 0 if value < 18 else min(value, outline_strength)))

    canvas.alpha_composite(outline, (x, y))
    canvas.alpha_composite(scaled_black, (x, y))
    canvas.alpha_composite(scaled_orange, (x, y))
    return canvas


def harden_alpha(alpha: Image.Image, floor: int, ceiling: int) -> Image.Image:
    span = max(1, ceiling - floor)
    return alpha.point(
        lambda value: 0
        if value < floor
        else 255 if value > ceiling else min(255, round((value - floor) * 255 / span))
    )


def split_mark_layers(mark: Image.Image) -> tuple[Image.Image, Image.Image]:
    black_layer = Image.new("RGBA", mark.size, (0, 0, 0, 0))
    orange_layer = Image.new("RGBA", mark.size, (0, 0, 0, 0))
    for x in range(mark.width):
        for y in range(mark.height):
            red, green, blue, alpha = mark.getpixel((x, y))
            if alpha == 0:
                continue
            if red > 150 and red - green > 70 and green > blue:
                orange_layer.putpixel((x, y), (*BRAND_ORANGE, alpha))
            else:
                black_layer.putpixel((x, y), (*BRAND_DARK, alpha))
    return black_layer, orange_layer


if __name__ == "__main__":
    main()
