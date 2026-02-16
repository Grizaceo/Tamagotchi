from PIL import Image
import os

def fix_flan_sprite():
    src_path = 'apps/web/public/assets/flan_bebe_v2.png'
    dst_path = 'apps/web/public/assets/flan_bebe_v3.png'
    
    if not os.path.exists(src_path):
        print(f"Error: {src_path} not found.")
        return

    img = Image.open(src_path)
    print(f"Original size: {img.size}")
    
    # Assumption: The image is 640x640 and contains 4 frames in a 2x2 grid.
    # We want to convert this to a 4x1 strip.
    # Each quadrant is 320x320.
    # Target grid size is 160x160 (as per config).
    
    # Quadrant coordinates
    quadrants = [
        (0, 0, 320, 320),     # Top-left
        (320, 0, 640, 320),   # Top-right
        (0, 320, 320, 640),   # Bottom-left
        (320, 320, 640, 640)  # Bottom-right
    ]
    
    frames = []
    for box in quadrants:
        crop = img.crop(box)
        # Resize to 160x160 to match standard grid density or keep at 320?
        # Config says gridSize: 160. So let's resize to 160x160.
        # Use NEAREST to keep pixel art crisp if scaling down integer amount
        crop = crop.resize((160, 160), Image.NEAREST)
        frames.append(crop)
        
    # Create new strip 640x160 (4 frames * 160 width)
    new_img = Image.new('RGBA', (160 * 4, 160))
    
    for i, frame in enumerate(frames):
        new_img.paste(frame, (i * 160, 0))
        
    new_img.save(dst_path)
    print(f"Saved fixed sprite to {dst_path} (Size: {new_img.size})")

if __name__ == "__main__":
    fix_flan_sprite()
