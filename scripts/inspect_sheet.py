from PIL import Image
import os

assets_dir = r"c:\Users\mirtg\OneDrive\Escritorio\Cristobalini\code related\Tamagotchi\apps\web\public\assets"
files = [
    "tamagotchi_spritesheet_1768544718465.png",
    "bagel_spritesheet_1768545538660.png"
]

for f in files:
    path = os.path.join(assets_dir, f)
    if not os.path.exists(path):
        print(f"File not found: {f}")
        continue

    try:
        img = Image.open(path)
        print(f"--- {f} ---")
        print(f"Size: {img.size}")
        print(f"Mode: {img.mode}")
        bbox = img.getbbox()
        print(f"Content BBox: {bbox}")

        # Check center pixel
        center = img.getpixel((512, 512))
        print(f"Center pixel: {center}")

        # Check palette size approx
        colors = img.getcolors(maxcolors=256)
        if colors:
            print(f"Unique colors (<=256): {len(colors)}")
        else:
            print("Unique colors: >256")

    except Exception as e:
        print(f"Error: {e}")
