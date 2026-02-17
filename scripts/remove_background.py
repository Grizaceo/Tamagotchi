from PIL import Image
import sys
import os

def remove_background(image_path, output_path, tolerance=30):
    try:
        img = Image.open(image_path).convert("RGBA")
        datas = img.getdata()
        
        width, height = img.size
        # Process image in 40x40 chunks
        grid_size = 40
        pixels = img.load()
        
        for frame_idx in range(width // grid_size):
            offset_x = frame_idx * grid_size
            bg_color = pixels[offset_x, 0] # Top-left of the frame
            print(f"Frame {frame_idx} bg detected: {bg_color}")
            
            for y in range(height): # Assumes 1 row or handle height
                for x in range(offset_x, offset_x + grid_size):
                    if x >= width: break
                    r, g, b, a = pixels[x, y]
                    if (abs(r - bg_color[0]) <= tolerance and
                        abs(g - bg_color[1]) <= tolerance and
                        abs(b - bg_color[2]) <= tolerance):
                        pixels[x, y] = (0, 0, 0, 0)
        
        img.save(output_path, "PNG")
        print(f"Saved transparent image to {output_path}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python remove_background.py <input_path> <output_path>")
    else:
        remove_background(sys.argv[1], sys.argv[2])
