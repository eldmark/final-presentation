"""Prepara las texturas de las pantallas del diorama.

Recorta la barra del navegador de las capturas que la traen, reduce el ancho a 1280 px
y las guarda como JPEG en blender/textures/. Ejecutar fuera de Blender:
    python3 -I blender/prepare_textures.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "blender" / "textures"
OUT.mkdir(exist_ok=True)

PUB = ROOT / "public"
CAP = ROOT / "docs" / "assets" / "capturas"
BAR = 76  # px de barra de navegador en las capturas de pantalla completa

# nombre de salida -> (origen, píxeles a recortar arriba)
SOURCES = {
    "pedidos": (PUB / "2026_10_31_23_37_10_screenshot.png", BAR),
    "productos": (PUB / "2026_10_31_23_37_57_screenshot.png", BAR),
    "carrusel": (PUB / "2026_10_31_23_38_24_screenshot.png", BAR),
    "oferta_editor": (PUB / "2026_10_31_23_38_37_screenshot.png", BAR),
    "sucursales": (PUB / "2026_10_31_23_38_52_screenshot.png", BAR),
    "umami_events": (PUB / "2026_10_31_23_45_35_screenshot.png", 0),
    "umami_overview": (PUB / "2026_10_31_23_46_04_screenshot.png", 0),
    "umami_pages": (PUB / "2026_10_31_23_46_34_screenshot.png", 0),
    "almacen": (PUB / "2026_10_31_23_59_48_screenshot.png", 0),
    "estado_sistema": (PUB / "2026_11_01_00_00_04_screenshot.png", 0),
    "campanas": (PUB / "2026_11_01_00_00_23_screenshot.png", 0),
    "catalogo": (CAP / "catalogo-1207-productos.jpg", 0),
    "catalogo_oscuro": (CAP / "catalogo-modo-oscuro.jpg", 0),
    "grafana_inventario": (CAP / "grafana-inventario.jpg", 0),
    "grafana_seguridad": (CAP / "grafana-seguridad.jpg", 0),
    "oferta_home": (CAP / "home-oferta-modal.jpg", 0),
    "producto_similares": (CAP / "producto-similares.jpg", 0),
    "contacto": (CAP / "contacto-sucursales-waze-maps.jpg", 0),
}

for name, (src, crop) in SOURCES.items():
    if not src.exists():
        print("FALTA", src)
        continue
    im = Image.open(src).convert("RGB")
    if crop:
        im = im.crop((0, crop, im.width, im.height))
    w = 1280
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(OUT / f"{name}.jpg", quality=88)
    print(f"{name}: {im.width}x{im.height}")

# Logo: pasa a PNG para que Blender lo lea sin depender del códec WebP
logo = Image.open(ROOT / "docs" / "assets" / "marca" / "Logo.webp").convert("RGBA")
logo.save(OUT / "logo.png")
print("logo:", logo.size)
