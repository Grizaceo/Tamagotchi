from PIL import Image

def create_red_square(path):
    img = Image.new('RGBA', (160, 40), color='red')
    img.save(path)
    print(f"Saved red square to {path}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        create_red_square(sys.argv[1])
    else:
        print("Usage: python create_red.py <output_path>")
