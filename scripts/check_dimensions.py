from PIL import Image
import os

assets_dir = r"c:\Users\mirtg\OneDrive\Escritorio\Cristobalini\code related\Tamagotchi\apps\web\public\assets"
files = ["flan_bebe_v3.png", "flan_bebe_v2.png", "tamagotchi_spritesheet_1768544718465.png"]

print(f"Checking assets in {assets_dir}")
for f in files:
    path = os.path.join(assets_dir, f)
    if os.path.exists(path):
        try:
            with Image.open(path) as img:
                print(f"{f}: {img.size} mode={img.mode}")
        except Exception as e:
            print(f"{f}: Error {e}")
    else:
        print(f"{f}: Not found")
