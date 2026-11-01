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

## Estado de las capturas (31 de octubre)

Las nuevas están en `../public/` con nombre de fecha. Leyenda: ✅ lista · ✂️ lista pero hay que recortar o tapar algo · 🔁 repetir · ❌ falta.

### Ya tomadas

| Archivo (`public/2026_10_31_…`) | Muestra | Cubre | Estado |
| --- | --- | --- | --- |
| `23_37_10` | Gestión de Pedidos con estados | #10 | ✂️ recortar la barra del navegador |
| `23_37_37` | Gestión de Reservas | #11 | ✂️ **tapar la columna CLIENTE** (se ven nombres reales) y recortar la barra |
| `23_37_57` | Gestión de Productos con imágenes | Marcelo (R2 y catálogo) | ✂️ recortar la barra |
| `23_38_10` | Promociones **vacía** ("No se encontraron promociones") | — | 🔁 volver a tomar con al menos una promoción, o no usar |
| `23_38_24` | Carrusel del home (3 slides) | #19 | ✂️ recortar la barra |
| `23_38_37` | Oferta del modal, editor con cuenta regresiva | #19 | ✂️ recortar la barra |
| `23_38_52` | Sucursales (Calvario, Zona 3, Zona 9) | Mapa de sucursales | ✂️ recortar la barra |
| `23_45_35` y `23_45_53` | Umami · Events (visitantes, eventos, PRODUCT_VIEW, SEARCH, ADD_TO_CART) | #18 y escena de valor | ✅ (en `23_45_53` queda un tooltip "3" sobre la tarjeta: usar `23_45_35`) |
| `23_46_04` | Umami · Overview (79 visitantes, 122 visitas, 2.44k vistas, rebote 17 %, 6 min 17 s) | #18 y escena de valor | ✅ |
| `23_46_34` | Umami · Pages y Sources | #18 | ✅ (no tiene datos personales) |
| `docs/assets/capturas/branch-stock.png` | Stock por sucursal | #3 | ✅ |
| `docs/assets/capturas/search-1000.png` | Búsqueda con catálogo grande | #2 | ✅ |
| `docs/assets/capturas/offers-desktop.png` y `offers-mobile.png` | Oferta en escritorio y móvil | #1 y #2 | ✅ |

El **menú agrupado del panel** (#12) ya se ve en todas las capturas del administrador: no hace falta una aparte.

### Tomadas por Claude el 1 de noviembre (en `assets/capturas/`)

Tomadas en local (Grafana con la base local) y del sitio público de producción (solo lectura, sin datos personales).

| Archivo | Muestra | Cubre | Estado |
| --- | --- | --- | --- |
| `grafana-seguridad.jpg` | Operaciones de Seguridad: 966 señales bloqueadas, 1424 cambios administrativos, IP redactada | #21 | ✅ la mejor del lote |
| `grafana-inventario.jpg` | Stock crítico por sucursal y productos populares | #14 | ✅ (parte inferior "Agotados con demanda" sale sin datos) |
| `catalogo-1207-productos.jpg` | Catálogo con filtros, 1207 productos y etiqueta "Más vendido" | #2 | ✅ |
| `catalogo-modo-oscuro.jpg` | El mismo catálogo en modo oscuro | N6 | ✅ |
| `home-oferta-modal.jpg` | Oferta del mes con cuenta regresiva vista por el cliente | #1 | ✅ |
| `producto-detalle.jpg` | Ficha de producto | #3 | ✅ |
| `producto-similares.jpg` | "Productos similares" (recomendaciones) | N1 | ✅ |
| `contacto-sucursales-waze-maps.jpg` | Mapa y las 3 sucursales con Waze y Google Maps | Mapa | ⚠ los tiles del mapa salen grises: repetir en un equipo con la capa de mapa cargada |
| `categorias.jpg` | Categorías con conteo de productos | extra | ✅ |
| `privacidad.jpg` | Política de privacidad pública | #7 (parcial) | ✅ (el Centro de Privacidad con sesión sigue pendiente) |

También llegaron en `public/`: **Almacén 3.1** (`23_59_48`, sincronización exitosa en 12 s, fuente MySQL) → N3 ✅; **Estado del sistema** (`00_00_04`) ✅; **Campañas de marketing** (`00_00_23`) → #20 ✅.

**Datos locales insuficientes, no usar:** `Ventas`, `Estacionalidad`, `Festividades` salen con "No data" porque la base local tiene 0 pedidos y 0 ventas históricas. `Demanda` (Abandono 100 %, Capital detenido Q0) y `Navegación` (109 sesiones, 109 rebotes) muestran valores que se ven mal por ser datos de prueba. Esos cinco tableros hay que tomarlos de **producción**.

### Faltan, por prioridad

**A · Imprescindibles (rúbrica y guion)**

| # | Captura | Ruta | Escena |
| --- | --- | --- | --- |
| 13 | Tablero `ventas` (Grafana) | `/reports/sales` | Marco |
| 14 | Tablero `inventario`: stock crítico y agotados con demanda | `/reports/inventory` | Marco |
| 15 | Tablero `demanda`: capital detenido y búsquedas sin resultados | `/reports/demand` | Marco |
| 16 | Tablero `estacionalidad` | `/reports/seasonality` | Marco |
| 17 | Tablero `festividades` | `/reports/holidays` | Marco y Jorge |
| 21 | Tablero `seguridad` con eventos | `/reports/security` | Luis Ángel |
| 22 | Bloqueo de IP | panel | Luis Ángel |
| 5 | Carrito con la reserva y su tiempo de expiración | `/cart` | Jorge |
| 3b | Ficha de producto con stock por sucursal **y mapa / cómo llegar** | `/product/:id` | Lázaro |
| 4 | Producto agotado con alternativas y aviso de "volvió a haber stock" | `/product/:id` | Lázaro y Jorge |
| N1 | Recomendaciones ("también llevaron") en carrito o producto | `/cart` | Jorge |
| N2 | Figura de tiempos por tarea del **informe Neurolab** (Figura 1 y Tabla 3) | PDF | Jorge |
| N3 | Almacén 3.1: pantalla de sincronización | panel | Marcelo |

**B · Muy recomendadas**

| # | Captura | Ruta | Escena |
| --- | --- | --- | --- |
| 1 | Inicio con el carrusel visto por el cliente | `/` | Lázaro |
| 6 | Perfil: favoritos y repetir compra (Easy Orders) | `/profile/*` | Marcelo |
| 7 | Centro de Privacidad | `/privacy` | Luis Ángel |
| 8 | Chat recomendador | chat del sitio | Jorge |
| 9 | Correo de confirmación de pedido (sin datos reales) | correo | Marcelo |
| 20 | Campañas de marketing | panel | Marco |
| 24 | Matriz de roles y permisos | panel | Luis Ángel |
| 19b | Editor visual del carrusel (editar una slide) | panel | Lázaro |
| N4 | Sentry con trazabilidad por solicitud | Sentry | Luis Ángel |
| N5 | Versión móvil del catálogo (dos productos por fila) | `/catalog` en 390 px | Lázaro |
| N6 | Modo oscuro y texto al 200 % | cualquier vista | Lázaro |

**C · Solo si sobra tiempo**: Insights, Estado del sistema, Reclamos, Reportes de navegación (`/reports/behavior`).

### Una nota sobre las capturas de Umami
Los picos de tráfico (21–28 de septiembre) coinciden con las pruebas del NeuroLab (25 de septiembre) y las pruebas del equipo. En la escena de valor se presentan como **piloto y pruebas**, no como tráfico de clientes. Dentro de esos datos, `PRODUCT_VIEW`, `SEARCH` y `ADD_TO_CART` son justo los eventos de la métrica.

### Para todas
1. **Recortar la barra del navegador** (se ve Brave y extensiones). Basta la imagen de la página.
2. **Tapar nombres de clientes** (en Reservas se ven nombres reales).
3. En Pedidos, los totales de Q0.00 no ayudan al relato: si hay un pedido real mejor, usarlo.

## Flujos reales grabados (criterio 4 de la rúbrica)

La rúbrica pide **flujos reales integrados a la historia**. Además de las capturas, se graban en video (30–45 s cada uno) **el mismo flujo con la misma botella**, y se reproducen como textura en las pantallas del 3D:

| Flujo | Dónde se reproduce |
| --- | --- |
| Buscar, ver stock por sucursal y elegir | Laptop del cliente (Lázaro) |
| Agregar al carrito, reservar y recomendaciones | Laptop del cliente (Jorge) |
| Empleada cambia el estado y llega el correo | Tablet de la sucursal (Marcelo) |
| Administradora abre Reportes y toma una decisión (con acción) | Pared de monitores (Marco) |
| Intentos de ataque rechazados en el panel de Seguridad | Pantalla de la sala de datos (Luis Ángel) |

Se graba con Playwright o el navegador, con datos anonimizados y sin mostrar barras de usuario.

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
