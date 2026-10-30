# 03 · Decisiones de negocio que habilita la reportería

Fuente: `bodegas-backend/docs/working/features/reporting.md` y `bodegas-frontend/docs/working/features/reporting.md`. Los tableros viven en `/reports/:section` y son de uso exclusivo del ADMIN.

## La cadena que se cuenta

**Evento** (clic, búsqueda, venta, movimiento de stock) → **dato centralizado** (PostgreSQL) → **tablero** (Grafana/Umami) → **decisión** → **acción** dentro del mismo sistema.

## Tableros y qué decisión permiten

| Ruta | Tablero | Pregunta de Mónica | Decisión | Acción en el sistema |
| --- | --- | --- | --- | --- |
| `/reports/sales` | ventas | ¿Cuánto facturamos y cuántas unidades? | Fijar metas y comparar sucursales | Exporte XLSX/PDF |
| `/reports/orders` | pedidos | ¿Cómo evolucionan ingresos y estados? | Detectar pedidos atascados | Revisar cola en el panel de pedidos |
| `/reports/inventory` | inventario | ¿Qué está crítico, qué no rota, qué se agotó con demanda? | **Reponer ya** / **dejar de comprar** | Orden de compra, promoción de liquidación |
| `/reports/demand` | demanda | ¿Qué buscan que no tengo? ¿Dónde se cae el carrito? | **Empezar a vender** un producto / corregir precio o fricción | Alta de producto, ajuste de precio |
| `/reports/seasonality` | estacionalidad | ¿Qué día, hora y mes se vende? | Horarios de atención, turnos de reparto, **cuándo ofertar** | Oferta del modal / campaña |
| `/reports/holidays` | festividades | ¿Qué sube en Navidad, Año Nuevo, feria? | **Comprar antes de la fecha** | Pedido a proveedor, campaña |
| `/reports/behavior` | navegación | ¿Cuánto dura la sesión? ¿Qué ven más? | Reordenar el catálogo y el carrusel | Editor visual del carrusel |
| `/reports/security` | seguridad | ¿Quién intenta qué? | **Bloquear** o ajustar | Bloqueo de IP |
| `/reports/web` | Umami | ¿De dónde llega la gente? | Dónde invertir en difusión | Campaña |

## Las cinco decisiones del Acto 7 (con su panel real)

### 1. Qué dejar de comprar
- Paneles: *Capital Detenido* (Inventario × precio de productos que no venden), *Inventario sin Rotación*, *Productos Nunca Vendidos*.
- Regla de lectura del doc: con **vistas en cero** el problema es visibilidad; con **vistas altas**, precio.
- Decisión: no recomprar, liquidar con promoción, o mejorar visibilidad.

### 2. Qué empezar a vender
- Paneles: *Búsquedas sin Resultados*, *Demanda que el Catálogo no Cubre* (lista de compras que los clientes escribieron solos), *Términos Más Buscados*.
- Es el dato que **antes no existía**: lo que el cliente quiso y no encontró.
- Decisión: sumar ese producto al catálogo y al próximo pedido a proveedor.

### 3. Cuándo ofertar
- Paneles: *Facturación por día de la semana*, *Pedidos por hora*, *Facturación por mes*, *Estacionalidad por categoría* (el vino sube en diciembre mientras la cerveza baja).
- Decisión: lanzar la oferta antes del pico, no durante; repartir turnos.

### 4. Dónde se cae la compra
- Paneles: *Abandono de Carrito*, *Al Carrito pero Nunca Pedido*, *Peor Conversión Carrito a Pedido* (mínimo 3 entradas al carrito para no leer ruido).
- Regla del doc: con stock apunta a **precio o fricción**; sin stock, a que el cliente **se enteró tarde**.
- Decisión: ajustar precio, simplificar el checkout o activar el aviso de "volvió a haber stock".

### 5. Qué reponer ya
- Paneles: *Stock crítico* (con umbral configurable), *Agotados con demanda*, *Antigüedad del stock*, *Días de bodega a venta*.
- Decisión: reponer lo que se vende rápido y está por agotarse.

## La decisión del título: Grafana

El equipo decidió **Grafana** (en vez de Metabase, ~1.5 GB RAM en JVM) por ser ligero (~50–80 MB) y por el **aprovisionamiento automático**: datasource y tableros como YAML/JSON versionados, sin configuración manual. Se conecta con un **rol PostgreSQL de solo lectura** (RTF-BL-01), así que ni un panel mal hecho puede modificar datos.

Decisiones de diseño de la reportería que vale mencionar:
- Un tablero por página (las filas colapsables escondían media reportería).
- Montos en quetzales (había un bug que mostraba Q35,200 como 35.2 mil dólares).
- Umbrales deliberados para no leer ruido (conversión ≥ 3 entradas; crecimiento festivo ≥ 10 pedidos festivos y 50 habituales).

## Datos reales anonimizados: reglas

- Solo **agregados** (totales, tendencias, rankings de productos). Nunca filas de clientes.
- Fuera de pantalla: nombres, correos, teléfonos, NIT, direcciones, IP y cualquier identificador de usuario.
- Los personajes (Don Rafael, Ana, Mónica) son ficticios. No se atribuyen a personas reales.
- Revisar cada captura antes de usarla (barra de usuario, tooltips, tablas de pedidos).
- Si un tablero muestra nombres de clientes, se recorta o se difumina.
- Las cifras de ingresos solo salen del canal web; el histórico de Almacén 3.1 se muestra en pedidos y unidades.

## Imágenes
Una captura por decisión (ver `08`): Capital detenido, Demanda no cubierta, Estacionalidad, Abandono de carrito y Stock crítico.
