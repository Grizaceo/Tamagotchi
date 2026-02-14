import os
import math
from PIL import Image

def process_sprites():
    # Configuration
    INPUT_PATH = r"c:\Users\mirtg\OneDrive\Escritorio\Cristobalini\code related\Tamagotchi\apps\web\public\assets\tamagotchi_spritesheet_1768544718465.png"
    OUTPUT_PATH = r"c:\Users\mirtg\OneDrive\Escritorio\Cristobalini\code related\Tamagotchi\apps\web\public\assets\sprites_pompom.png"
    DEBUG_DIR = r"c:\Users\mirtg\OneDrive\Escritorio\Cristobalini\code related\Tamagotchi\scripts\debug_output"
    GRID_SIZE = 48
    
    # Expected animation rows (matching SpriteConfigs.ts)
    ANIMATION_MAP = [
        ('idle', 2),
        ('walk', 4),
        ('eat', 4),
        ('happy', 2),
        ('sad', 2),
        ('sick', 2),
        ('sleep', 2)
    ]
    
    if not os.path.exists(INPUT_PATH):
        print(f"Error: Input file not found at {INPUT_PATH}")
        return

    if not os.path.exists(DEBUG_DIR):
        os.makedirs(DEBUG_DIR)

    print(f"Processing {INPUT_PATH}...")
    
    try:
        img = Image.open(INPUT_PATH).convert("RGBA")
    except Exception as e:
        print(f"Error opening image: {e}")
        return

    width, height = img.size
    
    # Background Removal with Tolerance
    bg_color = img.getpixel((0,0))
    print(f"Detected background color: {bg_color}")
    
    threshold = 30 # Tolerance for background color
    
    datas = img.getdata()
    new_data = []
    
    for item in datas:
        # Check if color is close to background
        r_diff = abs(item[0] - bg_color[0])
        g_diff = abs(item[1] - bg_color[1])
        b_diff = abs(item[2] - bg_color[2])
        
        if r_diff < threshold and g_diff < threshold and b_diff < threshold:
            new_data.append((255, 255, 255, 0)) # Transparent
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(os.path.join(DEBUG_DIR, "debug_no_bg.png"))
    print("Saved background removed image.")

    # 1. Detect Rows
    # Scan horizontal lines. A line is "empty" if all pixels are transparent.
    has_content_y = [False] * height
    for y in range(height):
        for x in range(0, width, 2): # stride 2
            if img.getpixel((x, y))[3] > 10: # Check alpha
                has_content_y[y] = True
                break
                
    row_ranges = []
    y = 0
    while y < height:
        if has_content_y[y]:
            start = y
            while y < height and has_content_y[y]:
                y += 1
            # Filter small noise (rows < 10 pixels likely noise)
            if (y - start) > 10:
                row_ranges.append((start, y))
        else:
            y += 1
            
    print(f"Found {len(row_ranges)} rows.")
    
    all_sprites = []
    
    for r_idx, (r_start, r_end) in enumerate(row_ranges):
        row_img = img.crop((0, r_start, width, r_end))
        # row_img.save(os.path.join(DEBUG_DIR, f"row_{r_idx}.png"))
        
        r_height = r_end - r_start
        
        # Detect Columns in this row
        has_content_x = [False] * width
        for x in range(width):
            for y_sub in range(r_height):
                if row_img.getpixel((x, y_sub))[3] > 10:
                    has_content_x[x] = True
                    break
        
        col_ranges = []
        x = 0
        while x < width:
            if has_content_x[x]:
                start = x
                while x < width and has_content_x[x]:
                    x += 1
                if (x - start) > 10: # content width > 10
                    col_ranges.append((start, x))
            else:
                x += 1
                
        print(f"Row {r_idx}: Found {len(col_ranges)} sprites.")
        
        for c_idx, (c_start, c_end) in enumerate(col_ranges):
            sprite = row_img.crop((c_start, 0, c_end, r_height))
            bbox = sprite.getbbox()
            if bbox:
                sprite = sprite.crop(bbox)
                all_sprites.append(sprite)
                # sprite.save(os.path.join(DEBUG_DIR, f"sprite_{r_idx}_{c_idx}.png"))

    print(f"Total sprites found: {len(all_sprites)}")
    
    # 2. Assemble
    output_w = 4 * GRID_SIZE
    output_h = 7 * GRID_SIZE
    output_img = Image.new("RGBA", (output_w, output_h), (0, 0, 0, 0))
    
    sprite_idx = 0
    for row_idx, (anim_name, frame_count) in enumerate(ANIMATION_MAP):
        for frame_idx in range(frame_count):
            if sprite_idx < len(all_sprites):
                src = all_sprites[sprite_idx]
                w, h = src.size
                
                # Scale nicely preserving aspect ratio
                scale = min(GRID_SIZE / w, GRID_SIZE / h) * 0.95
                new_w = int(w * scale)
                new_h = int(h * scale)
                
                if new_w > 0 and new_h > 0:
                    src_resized = src.resize((new_w, new_h), Image.Resampling.NEAREST)
                    
                    target_x = (frame_idx * GRID_SIZE) + (GRID_SIZE - new_w) // 2
                    target_y = (row_idx * GRID_SIZE) + (GRID_SIZE - new_h) // 2
                    
                    output_img.paste(src_resized, (target_x, target_y))
                
                sprite_idx += 1
            else:
                 pass # Warning printed earlier
                 
    output_img.save(OUTPUT_PATH)
    print(f"Saved {OUTPUT_PATH}")

if __name__ == "__main__":
    process_sprites()
