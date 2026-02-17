from PIL import Image
import os
import shutil

source_path = r"c:\Users\mirtg\OneDrive\Escritorio\Cristobalini\code related\Tamagotchi\apps\web\public\assets\flan_bebe_clean.png"
output_dir = r"c:\Users\mirtg\OneDrive\Escritorio\Cristobalini\code related\Tamagotchi\debug_frames"

if os.path.exists(output_dir):
    shutil.rmtree(output_dir)
os.makedirs(output_dir)

def analyze():
    if not os.path.exists(source_path):
        print("Source not found")
        return

    img = Image.open(source_path)
    print(f"Image Size: {img.size}")

    # Try 40x40 grid
    grid_size = 40
    rows = img.height // grid_size
    cols = img.width // grid_size

    print(f"Slicing into {rows}x{cols} grid (cell size {grid_size})")

    count = 0
    for r in range(rows):
        for c in range(cols):
            left = c * grid_size
            upper = r * grid_size
            crop = img.crop((left, upper, left + grid_size, upper + grid_size))

            # Check if empty
            bbox = crop.getbbox()
            if bbox:
                filename = f"f_{r}_{c}.png"
                crop.save(os.path.join(output_dir, filename))
                print(f"Saved {filename} (non-empty) at {r},{c}")
                count += 1
            else:
                pass # empty

    print(f"Found {count} non-empty frames of {grid_size}x{grid_size}")

if __name__ == "__main__":
    analyze()
