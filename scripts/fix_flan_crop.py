import sys
from PIL import Image

def process_image():
    input_path = 'apps/web/public/assets/flan_bebe_clean.png'
    output_path = 'apps/web/public/assets/flan_bebe_40px.png' # Overwrite
    
    try:
        img = Image.open(input_path).convert("RGBA")
        width, height = img.size
        # Assuming 1 row, 4 frames
        num_frames = 4
        frame_width = width // num_frames # 160
        frame_height = height # 160
        
        target_size = 40 
        
        new_img = Image.new("RGBA", (target_size * num_frames, target_size), (0,0,0,0))
        
        print(f"Processing {num_frames} frames from {width}x{height} image...")
        
        for i in range(num_frames):
            # Extract FULL frame (160x160)
            box = (i * frame_width, 0, (i + 1) * frame_width, frame_height)
            frame = img.crop(box)
            
            # CROP bottom-left quadrant (x:0, y:80 to x:80, y:160)
            content_box = (0, 80, 80, 160)
            quadrant = frame.crop(content_box)
            
            # Sample background color from top-left of quadrant
            bg_r, bg_g, bg_b, bg_a = quadrant.getpixel((0,0))
            print(f"Frame {i}: bg_color at (0,0) is ({bg_r},{bg_g},{bg_b},{bg_a})")
            
            # Brute force removal with tolerance
            tolerance = 30
            data = quadrant.getdata()
            new_data = []
            
            for item in data:
                r, g, b, a = item
                if abs(r - bg_r) < tolerance and abs(g - bg_g) < tolerance and abs(b - bg_b) < tolerance:
                    new_data.append((0,0,0,0))
                else:
                    new_data.append(item)
            
            quadrant.putdata(new_data)
            
            # Find actual content bbox
            bbox = quadrant.getbbox()
            
            if bbox:
                content = quadrant.crop(bbox)
                content_w, content_h = content.size
                
                # Resize to fit 40x40 using NEAREST for retro look
                scale = min(target_size / content_w, target_size / content_h)
                new_w = int(content_w * scale)
                new_h = int(content_h * scale)
                
                if new_w > 0 and new_h > 0:
                    content_resized = content.resize((new_w, new_h), Image.Resampling.NEAREST)
                    
                    # Center
                    paste_x = (target_size - new_w) // 2
                    paste_y = (target_size - new_h) // 2
                    
                    new_img.paste(content_resized, (i * target_size + paste_x, paste_y))
                    print(f"Frame {i}: Content {content_w}x{content_h} -> {new_w}x{new_h}, pasted at {paste_x},{paste_y}")
                else:
                    print(f"Frame {i}: Resized to 0")
            else:
                print(f"Frame {i}: Empty after background removal in quadrant")
        
        new_img.save(output_path)
        print(f"Saved to {output_path}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    process_image()
