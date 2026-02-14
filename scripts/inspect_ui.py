from PIL import Image
import os

path = r"c:\Users\mirtg\OneDrive\Escritorio\Cristobalini\code related\Tamagotchi\apps\web\public\assets\retro_ui_icons_1768544742647.png"
debug_dir = r"c:\Users\mirtg\OneDrive\Escritorio\Cristobalini\code related\Tamagotchi\scripts\debug_output"

if not os.path.exists(debug_dir):
    os.makedirs(debug_dir)

if os.path.exists(path):
    img = Image.open(path)
    print(f"UI Sheet: {img.size} Mode={img.mode}")
    
    # Save a crop of the top area to see if icons are there
    img.crop((0, 0, 500, 100)).save(os.path.join(debug_dir, "ui_top_crop.png"))
    
    # Check if it has uniform background
    bg = img.getpixel((0,0))
    print(f"BG Color: {bg}")
    
    # Scan for bounding box of content
    bbox = img.getbbox()
    print(f"BBox: {bbox}")

else:
    print("UI file not found.")
