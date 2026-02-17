from PIL import Image
import os

path = r"c:\Users\mirtg\OneDrive\Escritorio\Cristobalini\code related\Tamagotchi\apps\web\public\assets\sprites_pompom.png"

if os.path.exists(path):
    img = Image.open(path)
    print(f"Generated Sprite Sheet: {img.size}")
    if img.size == (192, 336):
        print("Dimensions CORRECT.")
    else:
        print(f"Dimensions INCORRECT (Expected 192x336).")
else:
    print("File not found.")
