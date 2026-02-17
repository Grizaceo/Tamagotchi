import os
from PIL import Image

assets_dir = r"c:\Users\mirtg\OneDrive\Escritorio\Cristobalini\code related\Tamagotchi\apps\web\public\assets"

print(f"Analyzing images in {assets_dir}")

for filename in os.listdir(assets_dir):
    if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        filepath = os.path.join(assets_dir, filename)
        try:
            with Image.open(filepath) as img:
                print(f"{filename}: {img.size} ({img.format}) mode={img.mode}")
        except Exception as e:
            print(f"Error reading {filename}: {e}")
