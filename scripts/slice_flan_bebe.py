from PIL import Image
import os

source_path = r"c:\Users\mirtg\.gemini\antigravity\brain\6899a526-21a2-45d5-a70d-9fddfc100f22\flan_bebe_1771215172347.png"
output_dir = r"c:\Users\mirtg\OneDrive\Escritorio\Cristobalini\code related\Tamagotchi\apps\web\public\assets\sprites\flan_bebe"

os.makedirs(output_dir, exist_ok=True)

try:
    with Image.open(source_path) as img:
        width, height = img.size
        # Assuming 4x4 grid based on 640x640 size (160x160 per frame)
        rows = 4
        cols = 4
        framew = width // cols
        frameh = height // rows

        print(f"Slicing {width}x{height} image into {rows} rows and {cols} columns ({framew}x{frameh} px).")

        for row in range(rows):
            for col in range(cols):
                left = col * framew
                upper = row * frameh
                right = left + framew
                lower = upper + frameh

                crop = img.crop((left, upper, right, lower))
                filename = f"flan_bebe_r{row}_c{col}.png"
                crop.save(os.path.join(output_dir, filename))
                print(f"Saved {filename}")

except Exception as e:
    print(f"Error: {e}")
