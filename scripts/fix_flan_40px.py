import sys
from PIL import Image

def process_image():
    input_path = 'apps/web/public/assets/flan_bebe_clean.png'
    output_path = 'apps/web/public/assets/flan_bebe_40px.png' # Overwrite
    
    try:
        img = Image.open(input_path).convert("RGBA")
        width, height = img.size
        # Source checks
        num_frames = 4
        frame_width = width // num_frames
        frame_height = height
        
        target_size = 40 
        
        new_img = Image.new("RGBA", (target_size * num_frames, target_size), (0,0,0,0))
        
        print(f"Processing {num_frames} frames from {width}x{height} image (threshold 200)...")
        
        for i in range(num_frames):
            # Extract frame
            box = (i * frame_width, 0, (i + 1) * frame_width, frame_height)
            frame = img.crop(box)
            
            # Aggressive background removal
            # Remove anything that is vaguely white/gray
            # R>200, G>200, B>200
            
            data = frame.getdata()
            new_data = []
            
            # Count removed pixels
            removed = 0
            
            for item in data:
                r, g, b, a = item
                # Check for white-ish
                if r > 180 and g > 180 and b > 180:
                    new_data.append((0,0,0,0))
                    removed += 1
                else:
                    new_data.append(item)
            
            frame.putdata(new_data)
            
            # Find content bbox
            bbox = frame.getbbox()
            
            if bbox:
                content = frame.crop(bbox)
                content_w, content_h = content.size
                
                # Resize
                # Maintain aspect ratio
                scale = min(target_size / content_w, target_size / content_h)
                new_w = int(content_w * scale)
                new_h = int(content_h * scale)
                
                if new_w > 0 and new_h > 0:
                    content_resized = content.resize((new_w, new_h), Image.Resampling.LANCZOS)
                    
                    # Center
                    paste_x = (target_size - new_w) // 2
                    paste_y = (target_size - new_h) // 2
                    
                    new_img.paste(content_resized, (i * target_size + paste_x, paste_y))
                    print(f"Frame {i}: Content {content_w}x{content_h} -> {new_w}x{new_h}, pasted at {paste_x},{paste_y}. Removed {removed} pixels.")
                else:
                    print(f"Frame {i}: Resized to 0")
            else:
                print(f"Frame {i}: Empty after background removal")
        
        new_img.save(output_path)
        print(f"Saved to {output_path}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    process_image()
