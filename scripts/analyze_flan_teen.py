from PIL import Image
import os
import glob

assets_dir = r"c:\Users\mirtg\OneDrive\Escritorio\Cristobalini\code related\Tamagotchi\apps\web\public\assets"
search_pattern = os.path.join(assets_dir, "flan_teen_*.png")

files = glob.glob(search_pattern)
print(f"Found {len(files)} flan_teen candidates.")

for file_path in files:
    try:
        with Image.open(file_path) as img:
            print(f"File: {os.path.basename(file_path)}")
            print(f"  Size: {img.size}")
            print(f"  Mode: {img.mode}")
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
