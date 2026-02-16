from PIL import Image, ImageDraw

def create_gear_icon(size=64, filename="menu_settings.png"):
    # Create a new image with alpha channel
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    center = size // 2
    inner_radius = size // 4
    outer_radius = size // 2.5
    tooth_width = size // 8
    num_teeth = 8
    
    # Colors
    main_color = (180, 180, 180, 255)
    shadow_color = (120, 120, 120, 255)
    highlight_color = (220, 220, 220, 255)
    
    # Draw Teeth
    import math
    for i in range(num_teeth):
        angle = (i / num_teeth) * 2 * math.pi
        
        # Calculate tooth corners
        x1 = center + outer_radius * math.cos(angle - 0.2)
        y1 = center + outer_radius * math.sin(angle - 0.2)
        x2 = center + outer_radius * math.cos(angle + 0.2)
        y2 = center + outer_radius * math.sin(angle + 0.2)
        
        # Base of tooth
        bx1 = center + inner_radius * math.cos(angle - 0.3)
        by1 = center + inner_radius * math.sin(angle - 0.3)
        bx2 = center + inner_radius * math.cos(angle + 0.3)
        by2 = center + inner_radius * math.sin(angle + 0.3)
        
        draw.polygon([(bx1, by1), (x1, y1), (x2, y2), (bx2, by2)], fill=main_color)
        
    # Draw outer circle (main body)
    draw.ellipse([center - inner_radius * 1.5, center - inner_radius * 1.5, 
                  center + inner_radius * 1.5, center + inner_radius * 1.5], 
                 fill=main_color)
    
    # Draw inner hole
    draw.ellipse([center - inner_radius * 0.5, center - inner_radius * 0.5, 
                  center + inner_radius * 0.5, center + inner_radius * 0.5], 
                 fill=(0, 0, 0, 0))
    
    # Add some simple "pixel art" shading/highlights
    # This is a very basic approximation
    for x in range(size):
        for y in range(size):
            r, g, b, a = img.getpixel((x, y))
            if a > 0:
                # Add a light highlight on top left
                if x < center and y < center:
                    img.putpixel((x, y), (min(255, r+20), min(255, g+20), min(255, b+20), a))
                # Add a shadow on bottom right
                elif x > center and y > center:
                    img.putpixel((x, y), (max(0, r-20), max(0, g-20), max(0, b-20), a))
    
    img.save(filename)
    print(f"Saved {filename}")

if __name__ == "__main__":
    create_gear_icon()
