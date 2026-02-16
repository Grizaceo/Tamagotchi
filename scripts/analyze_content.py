from PIL import Image
import os

path = r"c:\Users\mirtg\OneDrive\Escritorio\Cristobalini\code related\Tamagotchi\apps\web\public\assets\flan_bebe_clean.png"

def analyze():
    if not os.path.exists(path):
        print("File not found")
        return

    img = Image.open(path)
    print(f"Image Size: {img.size}")
    
    # Get bounding box of the whole non-transparent area
    bbox = img.getbbox()
    print(f"Global BBox: {bbox}")
    
    # Let's try to detect individual blobs
    # This is a naive blob detector for non-transparent pixels
    width, height = img.size
    pixels = img.load()
    
    # Scan horizontal projection
    projection = [0] * width
    for x in range(width):
        has_pixel = False
        for y in range(height):
            if pixels[x, y][3] > 0: # Alpha > 0
                has_pixel = True
                break
        if has_pixel:
            projection[x] = 1
            
    # Find segments
    segments = []
    start = None
    for x in range(width):
        if projection[x] == 1 and start is None:
            start = x
        elif projection[x] == 0 and start is not None:
            segments.append((start, x))
            start = None
    if start is not None:
        segments.append((start, width))
        
    print(f"Detected horizontal segments (sprites?): {segments}")
    print(f"Number of segments: {len(segments)}")
    
    if len(segments) > 0:
        avg_width = sum(end - start for start, end in segments) / len(segments)
        print(f"Average sprite width: {avg_width}")

if __name__ == "__main__":
    analyze()
