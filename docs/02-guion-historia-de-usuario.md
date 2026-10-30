# 02 · Guion estilo historia de usuario

Cada acto cambia **quién mira**. El hilo es una sola compra: la misma botella recorre el sistema y se ve distinta desde cada lugar.

**Tiempo total: 13:00 de 14:00 permitidos.** Formato de cada escena: *Como [rol], quiero [necesidad], para [valor]* + qué se ve + qué se dice.

**Formato: narramos nosotros, no es una actuación.** No hay diálogos ni actores. Tres figuras low-poly ilustran lo que contamos: **el cliente** (Don Rafael), **la empleada** (Ana) y **la administradora** (Mónica); son nombres de apoyo para el relato, no personas reales. Producto hilo: una botella de whisky 12 años. La bodega aparece con su **nombre y logo** reales (autorizado).

## Tabla de tiempos

| Acto | Tema | Perspectiva | Tiempo | Acumulado |
| --- | --- | --- | --- | --- |
| 0 | Gancho | Teléfono que no para | 0:30 | 0:30 |
| 1 | Antes | Cliente | 1:00 | 1:30 |
| 2 | Antes | Tienda | 0:45 | 2:15 |
| 3 | Antes | Administradora | 0:45 | 3:00 |
| 4 | Puente | Los datos | 0:45 | 3:45 |
| 5 | Después | Cliente | 2:00 | 5:45 |
| 6 | Después | Tienda | 1:15 | 7:00 |
| 7 | Después | Administradora | 3:00 | 10:00 |
| 8 | Seguridad | Dueña y "atacante" | 2:15 | 12:15 |
| 9 | Cierre | Cámara cenital + créditos | 0:45 | 13:00 |

Los 60 s sobrantes quedan de margen. Si el tiempo aprieta, se acorta el acto 6.

---

## Acto 0 · Gancho (0:30)
Cámara sobre una mesa: un teléfono vibra sin parar con mensajes de "¿precio del whisky?" y, al lado, un teléfono fijo que suena.
**Frase:** "Esto eran ventas... y nadie las estaba contando."

## Acto 1 · ANTES · Cliente (1:00)
*Como cliente, quiero saber precio y si hay en mi sucursal, para decidir si voy.*
- Narrado: "un cliente escribía por **WhatsApp** y no le contestaban". Llamaba a otra sucursal por teléfono. Al final iba en persona a preguntar y no había.
- Se ve (animación sin voces): burbujas de chat, reloj, el teléfono fijo, un mapa con viajes en vano.
- Cierra con: la venta se perdió y nadie supo que la quiso.

## Acto 2 · ANTES · Tienda (0:45)
*Como empleada, quiero atender sin que el teléfono me interrumpa, para vender al que tengo enfrente.*
- Narrado: la empleada atendía el mostrador, el WhatsApp y las llamadas a la vez. La venta se registra en el sistema de **su** sucursal.
- Se ve: tres sucursales como islas, cada una con su propio registro.
- Cierra con: "se registra, pero no está centralizado".

## Acto 3 · ANTES · Administradora (0:45)
*Como administradora, quiero saber qué comprar y cuándo ofertar, para no inmovilizar capital.*
- Narrado: la administradora pedía "cómo vamos" y recibía tres reportes distintos. Decidía por intuición.
- Se ve: escritorio con papeles y una pregunta flotando: "¿qué no rota?".
- Giro: **"¿y si cada pregunta del cliente fuera un dato?"**

## Acto 4 · PUENTE · Los datos se juntan (0:45)
Los registros de las sucursales se funden en un solo PostgreSQL. Almacén 3.1 entra por la **sincronización** (conexión remota segura por Tailscale, solo lectura) y se carga el histórico de ventas.
- Se ve: tuberías de datos entre sucursales y la nube; el catálogo se enciende.
- Créditos: Marcelo (sincronización, GCP, IAP), Luis Ángel (APIs, importación CSV).

## Acto 5 · DESPUÉS · Cliente (2:00)
*Como cliente, quiero ver precio y stock por sucursal desde mi casa, para ir solo si hay.*
- Narrado: el cliente busca "whisky": **sugerencias**, filtros, stock por sucursal, mapa y "cómo llegar" (Waze y Google Maps). **Imágenes:** `search-1000.png`, `branch-stock.png`.
- Si se agotó: alternativas recomendadas y aviso por correo cuando vuelva.
- Reserva y la reserva **expira sola devolviendo el stock**. Repite compra con Easy Orders. Ve la oferta del modal (`offers-desktop.png`, `offers-mobile.png`).
- Para su tranquilidad: Centro de Privacidad, reclamos y chat seguro.
- Créditos: Lázaro (catálogo y UX), Marcelo (pedidos y reservas), Jorge (recomendaciones y carrito), Julián (mapas, correos, caché).

## Acto 6 · DESPUÉS · Tienda (1:15)
*Como empleada, quiero ver los pedidos y reservas de mi sucursal, para preparar y entregar.*
- Panel con **pedidos y reservas primero**; la empleada ve **su** sucursal. Cambia estados y el cliente recibe el correo.
- Se ve: el WhatsApp ya no es el canal de precios; se prepara el pedido del cliente.
- Créditos: Lázaro (panel con un solo estilo), Luis Ángel (control de acceso), Marcelo (estados).

## Acto 7 · DESPUÉS · Administradora: las decisiones (3:00, el corazón)
*Como administradora, quiero un panel centralizado, para decidir con datos.*
La administradora abre **Reportes** (Grafana) y se cuentan cinco decisiones, unos 30 s cada una más 30 s de apertura (detalle en `03`):
1. Qué dejar de comprar.
2. Qué empezar a vender.
3. Cuándo ofertar.
4. Dónde se cae la compra.
5. Qué reponer ya.
Cada decisión termina en una **acción** dentro del mismo sistema: campaña, oferta en el carrusel, exporte, pedido a proveedor.
- Créditos: Marco y Jorge (Grafana, Umami, Festividades), Julián (campañas), Lázaro (editor de oferta).

## Acto 8 · SEGURIDAD · El miedo a que lo hackeen (2:15)
*Como dueña, quiero que mi tienda en línea no sea un riesgo, para dormir tranquila.*
- Un "atacante" intenta cosas contra el entorno **local/staging**: inyectar un estado de pedido, saltarse un rol, repetir intentos, abrir Grafana sin sesión.
- Cada intento se rechaza y aparece **en tiempo real** en el panel de Seguridad; la IP se bloquea.
- Detalle en `04`. Créditos: Luis Ángel (auditoría, logs sin datos personales, Sentry), Marcelo (IAP), Marco (permisos, respaldos, CI).

## Acto 9 · Cierre (0:45)
La cámara se aleja: una ciudad 3D, tres sucursales conectadas, un tablero.
**Frase:** "Antes cada pregunta era una llamada perdida. Ahora cada pregunta es un dato con el que decidimos."
Último plano: el equipo y el disclaimer de UI/UX (ver `05`).

---

## Mapa de perspectivas

| Acto | Quién mira | Antes/Después |
| --- | --- | --- |
| 1 | Cliente | Antes |
| 2 | Tienda | Antes |
| 3 | Administradora | Antes |
| 4 | El sistema (datos) | Puente |
| 5 | Cliente | Después |
| 6 | Tienda | Después |
| 7 | Administradora | Después |
| 8 | Dueña y "atacante" | Seguridad |
| 9 | Cámara cenital | Cierre |

## Principios

- La **misma botella** aparece en todos los actos.
- Cada acto de "después" **espeja** uno de "antes" (mismo encuadre, distinto resultado).
- Cada afirmación sale de los docs de los repos. Nada de funciones inventadas.
- Quien presenta cada parte es quien la construyó (ver reparto en `07`).
