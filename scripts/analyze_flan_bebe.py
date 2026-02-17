from PIL import Image
import os

import sys

if len(sys.argv) > 1:
    image_path = sys.argv[1]
else:
    image_path = r"c:\Users\mirtg\.gemini\antigravity\brain\6899a526-21a2-45d5-a70d-9fddfc100f22\flan_bebe_1771215172347.png"

try:
    with Image.open(image_path) as img:
        print(f"Format: {img.format}")
        print(f"Size: {img.size}")
        print(f"Mode: {img.mode}")

        # Analyze grid if possible (simple heuristic)
        width, height = img.size
        print(f"Width: {width}, Height: {height}")
        
        pixel = img.getpixel((0,0))
        print(f"Pixel at (0,0): {pixel}")
        
        # Check center of frame 0 (should be the character)
        center_pixel = img.getpixel((20, 20))
        print(f"Pixel at center (20,20): {center_pixel}")

        # Analyze each 40x40 frame
        grid_size = 40
        num_frames = width // grid_size
        
        for i in range(num_frames):
            x = i * grid_size
            y = 0
            box = (x, y, x + grid_size, y + grid_size)
            crop = img.crop(box)
            bbox = crop.getbbox()
            if bbox:
                print(f"Frame {i}: Content bbox: {bbox} (W={bbox[2]-bbox[0]}, H={bbox[3]-bbox[1]})")
            else:
                print(f"Frame {i}: Empty")

except Exception as e:
    print(f"Error opening image: {e}")

