# Diorama 3D (Blender 5.2)

Se reconstruye entero desde los scripts. El `.blend` es una copia de trabajo.

| Paso | Archivo | Qué hace |
| --- | --- | --- |
| 0 | `prepare_textures.py` | Recorta la barra del navegador de las capturas, las reduce y genera `textures/` y el logo en PNG. Se corre **fuera** de Blender: `python3 -I blender/prepare_textures.py` |
| 1 | `01_greybox.py` | Limpia la escena y crea las 9 estaciones, la botella, el suelo, la luz y una cámara por estación (`cam_S0` a `cam_S8`) |
| 2 | `02_screens_logo.py` | Pone las capturas en laptop, tablet, monitores y tableros, y el logo en los letreros |
| 3 | `03_figures.py` | Figuras low-poly: cliente, empleada, administradora y la silueta del atacante |
| 4 | `04_camera_tour.py` | Recorrido de cámara de 13:30 con los tiempos del guion; crea marcadores y exporta `tour.json` |

En Blender, desde la consola o el MCP:

```python
exec(open("/home/dmark123/Documents/software/final-presentation/blender/01_greybox.py").read())
exec(open("/home/dmark123/Documents/software/final-presentation/blender/02_screens_logo.py").read())
exec(open("/home/dmark123/Documents/software/final-presentation/blender/03_figures.py").read())
exec(open("/home/dmark123/Documents/software/final-presentation/blender/04_camera_tour.py").read())
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

## Recorrido de cámara (`cam_tour`)

30 cuadros por segundo, 24 300 cuadros (13:30). Marcadores en la línea de tiempo por escena.

| Tiempo | Estación | Narra | Escena |
| --- | --- | --- | --- |
| 0:00–1:20 | S0 | Julián | El antes (cliente) |
| 1:20–1:55 | S1 | Julián | El antes (tienda) |
| 1:55–2:30 | S2 | Julián | El antes (administradora) |
| 2:30–4:00 | S4 | Lázaro | El cliente encuentra y elige |
| 4:00–6:00 | S4 | Jorge | Compra con confianza + resultados UX |
| 6:00–6:50 | S5 | Marcelo | El pedido llega a la tienda |
| 6:50–8:00 | S3 | Marcelo | Los datos se juntan |
| 8:00–10:30 | S6 | Marco | La administradora decide |
| 10:30–12:00 | S7 | Luis Ángel | El miedo a que lo hackeen |
| 12:00–12:45 | S0 | Julián | Valor e impacto (el teléfono en silencio) |
| 12:45–13:30 | S8 | Lázaro | Cierre; en los últimos 8 s se aleja hasta ver las 9 estaciones |

`tour.json` trae los mismos segmentos y las claves de cámara (posición y punto de mira) para reproducirlos en Three.js.

## Pendiente

- Burbujas de chat con texto y reportes visibles en las estaciones del "antes".
- Tarjetas de cita (entrevistas) y subtítulos: van en la capa web, no en Blender.
- Export a `.glb` por estación y video de respaldo.
- Pantallas de Ventas, Estacionalidad y Festividades cuando haya capturas de producción.
