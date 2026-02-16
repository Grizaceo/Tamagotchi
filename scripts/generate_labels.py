from PIL import Image, ImageDraw, ImageFont
import os

def create_pixel_label(text, filename, color=(58, 47, 31)):
    # Create a small image
    # Estimate size: 3px per char width + 1px spacing roughly, height 6px
    w = len(text) * 4 + 2
    h = 7
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Simple custom pixel font drawing
    # 3x5 font map
    font_map = {
        'H': [1,0,1, 1,0,1, 1,1,1, 1,0,1, 1,0,1],
        'U': [1,0,1, 1,0,1, 1,0,1, 1,0,1, 1,1,1],
        'N': [1,1,1, 1,0,1, 1,0,1, 1,0,1, 1,0,1], # simplified
        'A': [1,1,1, 1,0,1, 1,1,1, 1,0,1, 1,0,1],
        'P': [1,1,1, 1,0,1, 1,1,1, 1,0,0, 1,0,0],
        'Y': [1,0,1, 1,0,1, 1,1,1, 0,1,0, 0,1,0],
        'E': [1,1,1, 1,0,0, 1,1,1, 1,0,0, 1,1,1],
        'R': [1,1,1, 1,0,1, 1,1,1, 1,1,0, 1,0,1],
        'G': [1,1,1, 1,0,0, 1,0,1, 1,0,1, 1,1,1],
        'L': [1,0,0, 1,0,0, 1,0,0, 1,0,0, 1,1,1],
        'T': [1,1,1, 0,1,0, 0,1,0, 0,1,0, 0,1,0],
        'O': [1,1,1, 1,0,1, 1,0,1, 1,0,1, 1,1,1],
        'V': [1,0,1, 1,0,1, 1,0,1, 1,0,1, 0,1,0],
    }
    
    cursor_x = 0
    for char in text.upper():
        if char in font_map:
            bits = font_map[char]
            for i, bit in enumerate(bits):
                if bit:
                    x = i % 3
                    y = i // 3
                    img.putpixel((cursor_x + x, y), color)
        cursor_x += 4
        
    # Resize to be slightly larger for visibility (nearest neighbor)
    # Target height around 12-16px
    scale = 2
    img = img.resize((img.width * scale, img.height * scale), Image.NEAREST)
    
    # Save
    path = os.path.join('apps/web/public/assets/ui', filename)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path)
    print(f"Generated {path}")

create_pixel_label('HUN', 'label_hunger.png')
create_pixel_label('HAP', 'label_happy.png')
create_pixel_label('ENE', 'label_energy.png')
create_pixel_label('HEA', 'label_health.png')
create_pixel_label('LOV', 'label_love.png')
