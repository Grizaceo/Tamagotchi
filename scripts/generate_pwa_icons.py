"""
Genera íconos PWA para Pompom Tama.
Usa el primer frame del sprite flan/bebe sobre fondo cálido del juego.
Produce 4 archivos: icon-192, icon-512, icon-maskable-192, icon-maskable-512.
"""
from PIL import Image, ImageDraw
import os

# Paleta del juego
BG_COLOR      = (42, 31, 20, 255)   # #2a1f14 — carcasa del dispositivo
BG_DARK       = (15, 13,  8, 255)   # #0f0d08 — fondo más oscuro (borde)

SHEET_PATH   = 'apps/web/public/assets/sprites/flan/bebe.png'
OUTPUT_DIR   = 'apps/web/public/icons'

def load_first_frame(path: str, frame_size: int = 128) -> Image.Image:
    sheet = Image.open(path).convert('RGBA')
    return sheet.crop((0, 0, frame_size, frame_size))

def make_icon(frame: Image.Image, size: int, maskable: bool = False) -> Image.Image:
    icon = Image.new('RGBA', (size, size), BG_COLOR)

    # Añadir borde sutil redondeado (esquinas oscuras)
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    radius = size // 8
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    bg = Image.new('RGBA', (size, size), BG_DARK)
    icon = Image.composite(icon, bg, mask)

    # Zona segura maskable = 80% → sprite ocupa 55%
    # Ícono normal → sprite ocupa 72%
    sprite_ratio = 0.55 if maskable else 0.72
    sprite_size  = int(size * sprite_ratio)

    # Escalar con NEAREST para mantener pixel-art nítido
    sprite = frame.resize((sprite_size, sprite_size), Image.NEAREST)

    # Centrar verticalmente un poco hacia abajo (se ve más natural)
    offset_x = (size - sprite_size) // 2
    offset_y = int((size - sprite_size) / 2 + size * 0.03)
    offset_y = min(offset_y, size - sprite_size)

    icon.paste(sprite, (offset_x, offset_y), sprite)
    return icon

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    frame = load_first_frame(SHEET_PATH)
    print(f'Sprite frame cargado: {frame.size}')

    specs = [
        (192, False, 'icon-192.png'),
        (512, False, 'icon-512.png'),
        (192, True,  'icon-maskable-192.png'),
        (512, True,  'icon-maskable-512.png'),
    ]

    for size, maskable, filename in specs:
        img = make_icon(frame, size, maskable)
        # Guardar como PNG con fondo opaco (Android no maneja bien RGBA en algunos casos)
        final = Image.new('RGB', (size, size), (15, 13, 8))
        final.paste(img, (0, 0), img)
        out_path = os.path.join(OUTPUT_DIR, filename)
        final.save(out_path, 'PNG', optimize=True)
        print(f'  ✓ {out_path} ({size}x{size}, maskable={maskable})')

    print('\nÍconos generados correctamente.')

if __name__ == '__main__':
    main()
