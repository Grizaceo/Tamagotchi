from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "apps/web/public/Sprites/Sprite definitivo.png"
OUT_ROOT = ROOT / "apps/web/public/assets/sprites"
MANIFEST = ROOT / "apps/web/public/assets/sprites/canon_extract_manifest.json"


@dataclass(frozen=True)
class RegionSpec:
    key: str
    folder: str
    filename: str
    x1: int
    y1: int
    x2: int
    y2: int
    frames: int
    min_area: int = 1200
    frame_size: int = 128


SPECS: tuple[RegionSpec, ...] = (
    # FIU line
    RegionSpec("FIU_EGG", "fiu", "egg.png", 0, 20, 620, 170, 4),
    RegionSpec("FIU_BABY", "fiu", "baby.png", 0, 180, 620, 320, 4),
    RegionSpec("FIU_TEEN", "fiu", "teen.png", 0, 330, 620, 460, 4),
    RegionSpec("FIU_PERFECT", "fiu", "perfect.png", 0, 470, 620, 610, 4),
    RegionSpec("FIU_COMMON", "fiu", "common.png", 0, 610, 620, 760, 4),
    RegionSpec("FIU_FAIL", "fiu", "fail.png", 0, 760, 620, 920, 3),
    # Salchicha line
    RegionSpec("SALCHICHA_EGG", "salchicha", "egg.png", 680, 20, 1320, 170, 4),
    RegionSpec("SALCHICHA_BABY", "salchicha", "baby.png", 680, 180, 1320, 320, 4),
    RegionSpec("SALCHICHA_TEEN", "salchicha", "teen.png", 680, 330, 1320, 460, 4),
    RegionSpec("SALCHICHA_PERFECT", "salchicha", "perfect.png", 680, 470, 1320, 610, 4),
    RegionSpec("SALCHICHA_BROWN", "salchicha", "brown.png", 680, 610, 1320, 760, 4),
    RegionSpec("SALCHICHA_FAIL", "salchicha", "fail.png", 0, 1380, 620, 1536, 4),
    # Flan / Purin line
    RegionSpec("FLAN_EGG", "flan", "egg.png", 2200, 20, 2710, 170, 4),
    RegionSpec("FLAN_BEBE", "flan", "bebe.png", 2200, 190, 2710, 320, 4),
    RegionSpec("FLAN_TEEN", "flan", "teen.png", 2200, 330, 2710, 460, 4),
    RegionSpec("FLAN_ADULT", "flan", "adult.png", 2200, 610, 2710, 760, 3),
    RegionSpec("POMPOMPURIN", "flan", "pompompurin.png", 2200, 460, 2710, 610, 3),
    RegionSpec("BAGEL", "flan", "bagel.png", 2200, 610, 2710, 760, 3),
    RegionSpec("MUFFIN", "flan", "muffin.png", 2200, 760, 2710, 920, 3),
    RegionSpec("SCONE", "flan", "scone.png", 1420, 1240, 1950, 1385, 4),
    # Seal line
    RegionSpec("SEAL_EGG", "seal", "egg.png", 1420, 20, 2160, 170, 4),
    RegionSpec("SEAL_BABY", "seal", "baby.png", 1420, 200, 2160, 320, 4),
    RegionSpec("SEAL_TEEN", "seal", "teen.png", 1420, 330, 2160, 460, 4),
    RegionSpec("SEAL_PERFECT", "seal", "perfect.png", 1420, 460, 2160, 610, 4),
    RegionSpec("SEAL_BROWN", "seal", "brown.png", 1420, 620, 2160, 740, 4),
    RegionSpec("SEAL_FAIL", "seal", "fail.png", 1420, 800, 1860, 930, 3),
)


def is_checker_bg(r: int, g: int, b: int) -> bool:
    # Checkerboard from source is medium grayscale.
    if abs(r - g) > 8 or abs(g - b) > 8:
        return False
    return 30 <= r <= 190


def connected_components(mask: list[list[int]]) -> list[tuple[int, int, int, int, int]]:
    h = len(mask)
    w = len(mask[0]) if h else 0
    seen = [[0] * w for _ in range(h)]
    out: list[tuple[int, int, int, int, int]] = []

    for y in range(h):
        for x in range(w):
            if not mask[y][x] or seen[y][x]:
                continue
            stack = [(x, y)]
            seen[y][x] = 1
            area = 0
            minx = maxx = x
            miny = maxy = y
            while stack:
                cx, cy = stack.pop()
                area += 1
                if cx < minx:
                    minx = cx
                if cx > maxx:
                    maxx = cx
                if cy < miny:
                    miny = cy
                if cy > maxy:
                    maxy = cy
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and mask[ny][nx] and not seen[ny][nx]:
                        seen[ny][nx] = 1
                        stack.append((nx, ny))
            out.append((area, minx, miny, maxx, maxy))
    return out


def extract_components(region: Image.Image, min_area: int) -> list[tuple[int, int, int, int, int]]:
    rgb = region.convert("RGB")
    w, h = rgb.size
    px = rgb.load()
    mask = [[0] * w for _ in range(h)]
    for y in range(h):
        row = mask[y]
        for x in range(w):
            r, g, b = px[x, y]
            if not is_checker_bg(r, g, b):
                row[x] = 1
    comps = connected_components(mask)
    comps = [c for c in comps if c[0] >= min_area]
    comps.sort(key=lambda c: c[1])  # left-to-right
    return comps


def transparent_crop(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_checker_bg(r, g, b):
                px[x, y] = (0, 0, 0, 0)
            else:
                px[x, y] = (r, g, b, a)
    return rgba


def pack_strip(frames: Iterable[Image.Image], frame_size: int) -> Image.Image:
    frames = list(frames)
    out = Image.new("RGBA", (frame_size * len(frames), frame_size), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        bbox = frame.getbbox()
        if not bbox:
            continue
        content = frame.crop(bbox)
        cw, ch = content.size
        scale = min(frame_size / max(cw, 1), frame_size / max(ch, 1))
        nw = max(1, int(cw * scale))
        nh = max(1, int(ch * scale))
        resized = content.resize((nw, nh), Image.Resampling.LANCZOS)
        cell = Image.new("RGBA", (frame_size, frame_size), (0, 0, 0, 0))
        ox = (frame_size - nw) // 2
        oy = (frame_size - nh) // 2
        cell.alpha_composite(resized, (ox, oy))
        out.alpha_composite(cell, (i * frame_size, 0))
    return out


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    manifest: dict[str, dict] = {}

    for spec in SPECS:
        region = source.crop((spec.x1, spec.y1, spec.x2, spec.y2))
        comps = extract_components(region, spec.min_area)
        if len(comps) < spec.frames:
            raise RuntimeError(
                f"{spec.key}: expected at least {spec.frames} sprite components in region "
                f"({spec.x1},{spec.y1})-({spec.x2},{spec.y2}), got {len(comps)}"
            )
        selected = comps[: spec.frames]
        frames: list[Image.Image] = []
        frame_meta: list[dict] = []
        for area, x1, y1, x2, y2 in selected:
            pad = 4
            rx1 = max(0, x1 - pad)
            ry1 = max(0, y1 - pad)
            rx2 = min(region.width, x2 + 1 + pad)
            ry2 = min(region.height, y2 + 1 + pad)
            crop = region.crop((rx1, ry1, rx2, ry2))
            frames.append(transparent_crop(crop))
            frame_meta.append(
                {
                    "area": area,
                    "region_bbox": [rx1, ry1, rx2, ry2],
                    "source_bbox": [spec.x1 + rx1, spec.y1 + ry1, spec.x1 + rx2, spec.y1 + ry2],
                }
            )

        strip = pack_strip(frames, spec.frame_size)
        out_dir = OUT_ROOT / spec.folder
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / spec.filename
        strip.save(out_path)

        manifest[spec.key] = {
            "output": str(out_path.relative_to(ROOT)),
            "frames": spec.frames,
            "frame_size": spec.frame_size,
            "source_region": [spec.x1, spec.y1, spec.x2, spec.y2],
            "selected": frame_meta,
        }
        print(f"{spec.key}: wrote {out_path}")

    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"manifest: {MANIFEST}")


if __name__ == "__main__":
    main()
