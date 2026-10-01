"""Rebuild web images in img/ from the originals in images/.

Run from the site root:  python tools/optimize.py
Requires Pillow. Originals are never modified.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "images"
OUT = ROOT / "img"

# source file -> (output stem, widths)
SHOT = (640, 1280, 1920)
JOBS = {
    "rivet35-01_guard.png":            ("rivet-guard",      SHOT),
    "rivet35-02_checkup.png":          ("rivet-checkup",    SHOT),
    "rivet35-03_windows_ai.png":       ("rivet-tweaks",     (480, 960, 1920)),  # file shows the Tweaks screen
    "rivet35-04_overview.png":         ("rivet-overview",   SHOT),
    "rivet35-05_processes.png":        ("rivet-processes",  (480, 960, 1920)),
    "rivet35-06_ask_rivet.png":        ("rivet-ask",        SHOT),
    "rivet35-07_history.png":          ("rivet-history",    (480, 960, 1920)),
    "rivet35-08_cleanup.png":          ("rivet-cleanup",    (480, 960, 1920)),
    "rivet35-hero-art.png":            ("rivet-hero-art",   (960, 1920)),
    "rivetxp-01-home-desktop.png":     ("xp-desktop",       (640, 1280)),
    "rivetxp-05-operative-xp-rank.png":("xp-rank",          (480, 960)),
    "rivet-3-logo.jpg":                ("rivet-logo",       (96, 192, 384)),
    "rivetxp-tile.png":                ("xp-tile",          (96, 192)),
}


def main() -> None:
    OUT.mkdir(exist_ok=True)
    for src_name, (stem, widths) in JOBS.items():
        im = Image.open(SRC / src_name)
        im = im.convert("RGBA" if "A" in im.getbands() else "RGB")  # keep icon transparency
        for w in widths:
            w = min(w, im.width)
            h = round(im.height * w / im.width)
            dst = OUT / f"{stem}-{w}.webp"
            im.resize((w, h), Image.LANCZOS).save(dst, "WEBP", quality=80, method=6)
            print(f"{dst.name:28} {w}x{h}  {dst.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
