"""Build Android launcher + splash assets from the desktop icon (256px, transparent bg).

Regenerate with: python assets/make_assets.py
Requires: pip install pillow
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent
SRC = Path(r"D:\Proyectos programacion\Terminados\TRAKKNAME\app\resources\trakkname.png")
BG = (21, 22, 23, 255)  # TRAKKOUT fondo #151617


def artwork(size: int) -> Image.Image:
    src = Image.open(SRC).convert("RGBA")
    bbox = src.getbbox() or (0, 0, *src.size)
    art = src.crop(bbox)
    # NOTE: thumbnail() never upscales — use resize for exact target size.
    scale = size / max(art.width, art.height)
    art = art.resize((round(art.width * scale), round(art.height * scale)), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.alpha_composite(art, ((size - art.width) // 2, (size - art.height) // 2))
    return canvas


def main() -> None:
    # Launcher foreground 1024: amber circle near full-bleed (like the desktop
    # icon) so it reads big under adaptive masks; the dark background fills
    # whatever the mask crops.
    icon = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    icon.alpha_composite(artwork(860), (82, 82))
    icon.save(ROOT / "icon.png")

    # Adaptive foregrounds, full-bleed direct resize: capacitor-assets insets
    # the source into the safe zone (too small for this bleed-style logo),
    # so the density foregrounds are written here instead. Re-run this
    # script (not capacitor-assets alone) after any icon change.
    android_res = Path(ROOT).parent / "android" / "app" / "src" / "main" / "res"
    for qualifier, size in (("mdpi", 108), ("hdpi", 162), ("xhdpi", 216),
                            ("xxhdpi", 324), ("xxxhdpi", 432)):
        fg = icon.resize((size, size), Image.LANCZOS)
        fg.save(android_res / f"mipmap-{qualifier}" / "ic_launcher_foreground.png")

    # Foreground variant (same file reused by capacitor-assets as adaptive fg).
    # Splash 2732: art centered on transparent (bg color set via CLI).
    splash = Image.new("RGBA", (2732, 2732), (0, 0, 0, 0))
    splash.alpha_composite(artwork(1100), (816, 816))
    splash.save(ROOT / "splash.png")

    # Web favicon 512.
    fav = Image.new("RGBA", (512, 512), BG)
    fav.alpha_composite(artwork(360), (76, 76))
    fav.save(Path(ROOT).parent / "public" / "icon-512.png")
    print("assets written: icon.png, splash.png, public/icon-512.png")


if __name__ == "__main__":
    main()
