import os
from PIL import Image

# Configuration
ASSET_DIR = r"apps/web/public/assets/pompom"
OUTPUT_FILE = r"apps/web/public/assets/pompom_spritesheet.png"
GRID_SIZE = 48

# Animation order (defines the rows)
ANIMATION_ORDER = [
    'idle',
    'walk',
    'eat',
    'sleep',
    'happy',
    'sad',
    'sick',
    'evolve'
]

def assemble_sprites():
    # Collect all frame files
    frames = {}
    for filename in os.listdir(ASSET_DIR):
        if not filename.endswith('.png') or filename == "pompom_spritesheet.png":
            continue
        
        # Expected format: animation_frame_X.png (e.g., idle_frame_0.png)
        try:
            parts = filename.split('_')
            anim_name = parts[0]
            frame_index = int(parts[-1].split('.')[0])
            
            if anim_name not in frames:
                frames[anim_name] = []
            frames[anim_name].append((frame_index, filename))
        except ValueError:
            print(f"Skipping malformed filename: {filename}")
            continue

    # Determine dimensions
    max_frames = 0
    for anim in ANIMATION_ORDER:
        if anim in frames:
            max_frames = max(max_frames, len(frames[anim]))
    
    # We want at least enough columns for the longest animation
    # But usually sprite sheets have fixed width or variable. 
    # Let's make it wide enough for the longest animation.
    width = max_frames * GRID_SIZE
    height = len(ANIMATION_ORDER) * GRID_SIZE
    
    print(f"Creating sprite sheet: {width}x{height}")
    sprite_sheet = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    
    # Paste frames
    for row_index, anim in enumerate(ANIMATION_ORDER):
        if anim in frames:
            # Sort frames by index
            anim_frames = sorted(frames[anim], key=lambda x: x[0])
            
            for col_index, (f_idx, f_name) in enumerate(anim_frames):
                img_path = os.path.join(ASSET_DIR, f_name)
                try:
                    img = Image.open(img_path).convert("RGBA")
                    # Resize if not 48x48 (just in case)
                    if img.size != (GRID_SIZE, GRID_SIZE):
                        img = img.resize((GRID_SIZE, GRID_SIZE), Image.NEAREST)
                        
                    x = col_index * GRID_SIZE
                    y = row_index * GRID_SIZE
                    sprite_sheet.paste(img, (x, y))
                    print(f"Placed {anim} frame {f_idx} at {x},{y}")
                except Exception as e:
                    print(f"Error processing {f_name}: {e}")

    # Save
    sprite_sheet.save(OUTPUT_FILE)
    print(f"Saved sprite sheet to {OUTPUT_FILE}")

if __name__ == "__main__":
    assemble_sprites()
