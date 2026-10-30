# 08 · Capturas y material visual

Las imágenes de la web van en dos lugares: **dentro del mundo 3D** (como textura de monitores, laptops y tablets) y como **tarjetas de apoyo** que se superponen unos segundos.

Carpeta de trabajo: `assets/capturas/`. Nombres en minúsculas con guion, `acto-escena.png`.

## Ya tenemos (copiadas del frontend)

| Archivo | Muestra | Escena |
| --- | --- | --- |
| `branch-stock.png` | Stock por sucursal | Acto 5 |
| `search-1000.png` | Búsqueda con catálogo grande | Acto 5 |
| `offers-desktop.png` | Oferta en escritorio | Acto 5 |
| `offers-mobile.png` | Oferta en móvil | Acto 5 |

## Por tomar (stack local con datos reales anonimizados)

Resolución: 1920×1080 de escritorio y 390×844 de móvil. Tema claro y, donde aplique, oscuro.

| # | Captura | Ruta | Acto |
| --- | --- | --- | --- |
| 1 | Inicio con carrusel (diseño de Lázaro) | `/` | 5 |
| 2 | Catálogo con filtros y sugerencias | `/catalog` | 5 |
| 3 | Detalle de producto con stock por sucursal y mapa | `/product/:id` | 5 |
| 4 | Aviso de producto agotado con alternativas | `/product/:id` | 5 |
| 5 | Carrito y reserva con tiempo de expiración | `/cart` | 5 |
| 6 | Perfil: favoritos y repetir compra (Easy Orders) | `/profile/*` | 5 |
| 7 | Centro de Privacidad | `/privacy` | 5 |
| 8 | Chat recomendador | chat del sitio | 5 |
| 9 | Correo de confirmación de pedido (sin datos reales) | correo | 5–6 |
| 10 | Panel de pedidos con estados | panel | 6 |
| 11 | Panel de reservas | panel | 6 |
| 12 | Menú del panel agrupado (ventas primero) | panel | 6 |
| 13 | Tablero `ventas` | `/reports/sales` | 7 |
| 14 | Tablero `inventario` con stock crítico | `/reports/inventory` | 7 |
| 15 | Tablero `demanda`: capital detenido y demanda no cubierta | `/reports/demand` | 7 |
| 16 | Tablero `estacionalidad` | `/reports/seasonality` | 7 |
| 17 | Tablero `festividades` | `/reports/holidays` | 7 |
| 18 | Analítica web (Umami) | `/reports/web` | 7 |
| 19 | Editor visual tipo Canva del carrusel | panel | 7 |
| 20 | Campañas de marketing | panel | 7 |
| 21 | Tablero `seguridad` con eventos | `/reports/security` | 8 |
| 22 | Bloqueo de IP | panel | 8 |
| 23 | Sentry con trazabilidad por solicitud | Sentry | 8 |
| 24 | Matriz de roles y permisos | panel | 8 |

## Marca

Con autorización de la bodega se usan su nombre y su logo completos, en fachada, mostrador, pantallas y créditos. Archivos copiados en `assets/marca/`: `logobodega.svg`, `logoclaro.svg`, `logoclaro3.svg`, `Logo.webp` y `hero.webp`.

## Imágenes para el "antes"

No existen en el proyecto. Se generan en Blender o se arman como maqueta: burbujas de WhatsApp (texto inventado), teléfono fijo, libreta de ventas, papeles. Sin capturas de chats reales.

## Reglas antes de usar una captura

1. Fuera cualquier nombre, correo, teléfono, NIT, dirección o IP real (ver reglas en `03`).
2. Fuera barras del navegador con sesiones, extensiones o pestañas personales.
3. Sin claves, tokens ni `.env`.
4. En tableros, solo agregados; recortar o difuminar tablas con filas de clientes.
5. Nos revisamos las capturas entre nosotros antes del ensayo: cada quien valida las de su parte.

## Cómo se toman

- Con el stack local levantado (backend, frontend, Grafana, Umami) y datos reales anonimizados cargados.
- Con las herramientas de navegador de Claude (Chrome) o con Playwright, desde un script que recorra las rutas y guarde los archivos con el nombre de la tabla.
- Un solo script permite repetir la toma si cambia algo antes del martes.

## Dónde aparecen en el 3D

| Superficie del modelo | Contenido |
| --- | --- |
| Laptop de Don Rafael | Capturas 1–8 |
| Tablet de Ana | Capturas 10–12 |
| Pared de monitores de Mónica | Capturas 13–20 |
| Panel de seguridad en la sala de datos | Capturas 21–24 |
| Teléfono del cliente | Capturas móviles y el chat |
