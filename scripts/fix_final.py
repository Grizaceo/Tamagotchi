from PIL import Image
import os

source_path = r"c:\Users\mirtg\OneDrive\Escritorio\Cristobalini\code related\Tamagotchi\apps\web\public\assets\flan_bebe_clean.png"
output_path = r"c:\Users\mirtg\OneDrive\Escritorio\Cristobalini\code related\Tamagotchi\apps\web\public\assets\flan_bebe_40px.png"

def process():
    if not os.path.exists(source_path):
        print(f"Source not found: {source_path}")
        return

    try:
        with Image.open(source_path) as img:
            print(f"Source size: {img.size}")

            # Crop top-left 160x40 area
            # This contains 4 sprites of 40x40 laid out horizontally
            crop_rect = (0, 0, 160, 40)
            strip = img.crop(crop_rect)

            strip.save(output_path)
            print(f"Saved 160x40 strip to {output_path}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    process()
