# Diorama 3D (Blender 5.2)

Se reconstruye entero desde los scripts. El `.blend` es una copia de trabajo.

| Paso | Archivo | Qué hace |
| --- | --- | --- |
| 0 | `prepare_textures.py` | Recorta la barra del navegador de las capturas, las reduce y genera `textures/` y el logo en PNG. Se corre **fuera** de Blender: `python3 -I blender/prepare_textures.py` |
| 1 | `01_greybox.py` | Limpia la escena y crea las 9 estaciones, la botella, el suelo, la luz y una cámara por estación (`cam_S0` a `cam_S8`) |
| 2 | `02_screens_logo.py` | Pone las capturas en laptop, tablet, monitores y tableros, y el logo en los letreros |

En Blender, desde la consola o el MCP:

```python
exec(open("/home/dmark123/Documents/software/final-presentation/blender/01_greybox.py").read())
exec(open("/home/dmark123/Documents/software/final-presentation/blender/02_screens_logo.py").read())
```

## Estaciones

| # | Acto | Contenido | Pantallas |
| --- | --- | --- | --- |
| S0 | 1 · Antes · cliente | Sofá, teléfono, fijo, burbujas de WhatsApp, reloj | — |
| S1 | 2 · Antes · tienda | Mostrador, estantería, tres islas con libreta, letrero con logo | — |
| S2 | 3 · Antes · administradora | Escritorio con reportes sueltos y un "?" | — |
| S3 | 4 · Puente | Base de datos central con tres sucursales | Almacén 3.1 |
| S4 | 5 · Después · cliente | Escritorio con laptop | Catálogo (1207 productos) |
| S5 | 6 · Después · tienda | Mostrador, tablet, cajas de pedidos, letrero con logo | Pedidos |
| S6 | 7 · Después · administradora | Pared de 6 monitores | Inventario, Umami ×2, campañas, carrusel, editor de oferta |
| S7 | 8 · Seguridad | Anillos concéntricos, racks, pantalla grande | Tablero de Seguridad |
| S8 | 9 · Cierre | Mapa con tres pines unidos | Letrero grande con el logo |

## Convenciones

- Unidades en metros. Estaciones separadas 9 m sobre el eje X.
- Paleta: burdeos `#841C26`, crema `#F5F0EB`, azul de datos `#2C6BD6`.
- Gestión de color en **Standard** (AgX lavaba los colores).
- Los objetos de pantalla empiezan con `scr_` y los de logo con `logo_`: el script 02 los borra y los rehace.

## Pendiente

- Figuras low-poly (cliente, empleada, administradora).
- Pantallas de las estaciones del "antes" (burbujas de chat con texto).
- Recorrido de cámara entre estaciones con los tiempos del guion.
- Export a `.glb` por estación y video de respaldo.
