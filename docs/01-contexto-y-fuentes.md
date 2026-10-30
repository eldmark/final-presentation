# 01 · Contexto y fuentes

## El negocio

**Bodega de Licores**, Quetzaltenango, Guatemala. Operaba solo de forma presencial: clientes llamaban o iban a la tienda a preguntar precio y disponibilidad, lo que saturaba al personal y perdía ventas. La premisa del curso (Ingeniería de Software, UVG, sección 10, grupo 7) fue **reducir llamadas y visitas**.

Actores: **Cliente**, **Empleado** (inventario y pedidos), **Administrador** (control total, promociones, estadísticas).

## El problema "antes" (base de la historia)

| Antes | Consecuencia |
| --- | --- |
| Cliente pregunta precio por WhatsApp, llamada o visita | El empleado responde a mano, de memoria o revisando el sistema |
| Venta en tienda se registra en el sistema local (Almacén 3.1) | Cada sucursal tiene su dato; nada centralizado |
| El administrador no ve el conjunto | Decide por intuición: qué comprar, cuándo hacer ofertas, qué no rota |
| Nadie registra lo que el cliente quiso y no encontró | La demanda perdida es invisible |

El "antes" combina **ambos canales**: WhatsApp y llamada o visita a la tienda. Hoy WhatsApp ya no es un canal manual de precios: el backend lo usa como entrada del chat recomendador.

## Qué es el "después" (verificado en los docs)

- **Catálogo web** con precio y stock por sucursal, filtros, búsqueda con sugerencias, favoritos, repetir compra ("Easy Orders").
- **Pedidos y reservas**: reserva con expiración automática que libera el stock; pedidos con NIT y dirección.
- **Notificaciones** por correo (Resend) con outbox idempotente; aviso cuando un producto agotado vuelve.
- **Chat recomendador** (OpenRouter) y recomendación por coocurrencia (Basket Analysis).
- **Panel admin** con reportería **Grafana + Umami** embebida, exportes XLSX/PDF/CSV, campañas de marketing, matriz de permisos.
- **Sincronización** con Almacén 3.1 (MySQL, solo lectura, por Tailscale) y carga de histórico de ventas.
- **Seguridad y operación**: Clerk, roles, rate limit, bloqueo por IP, SOC propio en Grafana, Sentry, respaldos, CI, ZAP semanal.

Stack: Vue 3 + Vite + Pinia (frontend), Express + TypeScript + Prisma + PostgreSQL (backend), Docker, GCP, R2, nginx.

## Aportes por integrante (leídos del Miro)

| Persona | Aportes principales según el tablero |
| --- | --- |
| **Marcelo** | Login con Google (Clerk), roles, pantallas de login/signup, lógica y pantallas de **pedidos y reservas** y flujo de compra, **sincronización** de BD de solo lectura por Tailscale, servidor en GCP + dominio, Easy Orders / repetir compra / favoritos, imágenes en R2 (quitar fondo, WebP), FAQ y base de conocimiento del chatbot, **seguridad del server con IAP**, categorías, estados comerciales |
| **Marco** | Cimientos (servidor, login, roles, correos), **métricas y analítica web con Grafana y Umami**, exportes seguros, privacidad / reclamos / catálogo rápido, campañas de marketing, matriz de permisos, respaldos, seguridad y CI. Línea: 0 Cimientos → 1 Métricas → 2 Reportería → 3 Cliente → 4 Marketing → 5 Permisos → 6 Lo invisible |
| **Luis Ángel** | APIs de pedidos y reservas con validación y control de acceso, pedidos ligados a perfil/NIT/entrega, filtros de catálogo, existencias por sucursal e importación CSV, promociones y combos, exportes de ventas a Excel, **auditoría de actividad administrativa**, **protección de datos en logs y telemetría**, **monitoreo con Sentry y trazabilidad por request**, accesibilidad e imágenes WebP |
| **Jorge** | **Recomendación y Basket Analysis** (coocurrencia) optimizado en GCP, reservas y carrito, exportes PDF/XLSX/CSV, **dashboard en Grafana** y reportes como **Festividades**, **análisis del Neurolab** (respuesta galvánica, eye tracking, comportamiento), accesibilidad con lector de pantalla y teclado, permisos de empleados |
| **Julián** | Campañas de marketing, notificaciones por correo (pedidos, reservas, recordatorios, "volvió a haber stock"), mapa de sucursales con Waze / Google Maps, recomendación de sucursal por ubicación, accesibilidad por teclado, **caché** de catálogo y búsquedas, diseño inicial en Figma, documentación |
| **Lázaro** | Catálogo con filtros/búsqueda/orden, carga progresiva y modo oscuro, **editor visual tipo Canva** (carrusel y oferta del modal), **un solo estilo** en todo el panel, menú agrupado con ventas primero, versión móvil, texto al 200 %, accesibilidad (contraste 4.5:1, foco visible, botones de 44 px, teclado) |

## Datos para la presentación

Se usan **datos reales anonimizados** y capturas del proyecto completo. Las reglas de anonimización están en `03`.
