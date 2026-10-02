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
    # v2 pages: RIVET design directions, milestones, full Temu evidence
    "rivet3-direction-1-liquid-glass.png": ("dir-liquid-glass", (480, 960, 1600)),
    "rivet3-direction-2-fluent-mica.png": ("dir-fluent-mica", (480, 960, 1600)),
    "rivet3-direction-3-swiss-editorial.png": ("dir-swiss-editorial", (480, 960, 1600)),
    "rivet3-direction-4-neo-brutalist.png": ("dir-neo-brutalist", (480, 960, 1600)),
    "rivet3-m1-shell.png": ("ms-m1-shell", (480, 960, 1600)),
    "rivet3-m2-hud.png": ("ms-m2-hud", (480, 960, 1600)),
    "rivet3-m3-startup.png": ("ms-m3-startup", (480, 960, 1600)),
    "rivet3-m4-tweaks.png": ("ms-m4-tweaks", (480, 960, 1600)),
    "rivet3-m5-sprint.png": ("ms-m5-sprint", (480, 960, 1600)),
    "rivet3-m7-console.png": ("ms-m7-console", (480, 960, 1600)),
    "rivet3-m8-ask.png": ("ms-m8-ask", (480, 960, 1600)),
    "temu-e1-full.png": ("temu-e1", (300, 600, 1008)),
    "temu-e2-full.png": ("temu-e2", (300, 600, 1008)),
    "temu-e3-full.png": ("temu-e3", (300, 600, 1008)),
    "temu-e4-full.png": ("temu-e4", (300, 600, 1008)),
    "temu-e5-full.png": ("temu-e5", (300, 600, 1008)),
    "temu-e6-full.png": ("temu-e6", (300, 600, 1008)),
    "temu-e7-full.png": ("temu-e7", (300, 600, 1008)),
    "temu-e8-full.png": ("temu-e8", (300, 600, 1008)),
    "temu-e9-full.png": ("temu-e9", (300, 600, 1008)),
    "temu-e10-full.png": ("temu-e10", (300, 600, 1008)),
    "temu-e11-full.png": ("temu-e11", (300, 600, 1008)),
    "temu-e12-full.png": ("temu-e12", (300, 600, 1008)),
    "temu-e2-powertools.png":          ("temu-powertools",  (360, 720)),  # evidence E2, status bar cropped
    "temu-e3-makeup.png":              ("temu-makeup",      (360, 720)),  # evidence E3, status bar cropped
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
