from PIL import Image
import os

source_path = r"c:\Users\mirtg\OneDrive\Escritorio\Cristobalini\code related\Tamagotchi\apps\web\public\assets\flan_bebe_v2.png"
output_path = r"c:\Users\mirtg\OneDrive\Escritorio\Cristobalini\code related\Tamagotchi\apps\web\public\assets\flan_bebe_clean.png"

def process():
    if not os.path.exists(source_path):
        print(f"Source not found: {source_path}")
        return

    try:
        with Image.open(source_path) as img:
            print(f"Source size: {img.size}")
            
            # Helper to crop a grid cell
            # Rows 0-3, Cols 0-3. Grid size 160x160?
            grid_size = 160
            
            # We want Row 0 (Idle)
            frames = []
            row = 0
            for col in range(4):
                left = col * grid_size
                upper = row * grid_size
                right = left + grid_size
                lower = upper + grid_size
                
                print(f"Cropping {left},{upper} -> {right},{lower}")
                crop = img.crop((left, upper, right, lower))
                frames.append(crop)
            
            # Create a horizontal strip (640x160)
            strip = Image.new('RGBA', (640, 160))
            for i, frame in enumerate(frames):
                strip.paste(frame, (i * 160, 0))
                
            strip.save(output_path)
            print(f"Saved strip to {output_path}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    process()
