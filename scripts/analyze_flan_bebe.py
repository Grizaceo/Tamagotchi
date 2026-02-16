from PIL import Image
import os

image_path = r"c:\Users\mirtg\.gemini\antigravity\brain\6899a526-21a2-45d5-a70d-9fddfc100f22\flan_bebe_1771215172347.png"

try:
    with Image.open(image_path) as img:
        print(f"Format: {img.format}")
        print(f"Size: {img.size}")
        print(f"Mode: {img.mode}")
        
        # Analyze grid if possible (simple heuristic)
        width, height = img.size
        print(f"Width: {width}, Height: {height}")
        
except Exception as e:
    print(f"Error opening image: {e}")
