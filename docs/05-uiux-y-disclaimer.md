# 05 · UI/UX de la presentación y disclaimer de Lázaro

## Criterio

La presentación debe verse como el producto: usa la **misma paleta, tipografía y tokens** del frontend (`--theme-*` en `style.css`; modo claro y oscuro). Así el 3D no compite con la marca, la prolonga.

## Disclaimer (el que va dentro de la presentación)

Pedido: poner la UI/UX de **Lázaro** como disclaimer. Propuesta de texto, editable:

> **Sobre el diseño.** Las pantallas que verán (catálogo, panel, editor del carrusel) son el diseño de **Lázaro Díaz**. Un solo estilo en todo el panel, menú agrupado con las ventas primero, versión móvil, texto al 200 %, contraste 4.5:1, foco visible, botones de 44 px y uso completo con teclado.
> Las pantallas muestran datos reales **anonimizados**. Nombre y logo de la bodega se usan con su autorización.
> Los modelos 3D son una representación artística, no el local real.

Dónde va: (a) tarjeta fija al iniciar (5 s), (b) pie discreto en las escenas con pantallas del producto, (c) plano final con créditos.

## Qué respalda el disclaimer (para que no sea solo palabras)

- Mismo estilo en el panel: tablas, formularios, avisos y confirmaciones; menú agrupado (Ventas, Catálogo y ofertas, Organización, Análisis, Sistema).
- Responsive: menú lateral colapsable a riel de iconos, drawer ≤ 900 px, tablas a tarjetas, dos productos por fila en móvil.
- Accesibilidad como control continuo: reglas de lint de accesibilidad y pruebas automáticas con axe en 11 rutas públicas, en tema claro y oscuro, en cada integración.
- Preferencias persistentes: tema, idioma (es/en), escala de texto 200 %.

## Accesibilidad de la propia presentación (no ser hipócritas)

- Subtítulos siempre en pantalla; el relato no depende solo del audio.
- Contraste ≥ 4.5:1 en textos superpuestos al 3D; fondo semitransparente detrás del texto.
- Navegación **por teclado** (← → entre actos, `Esc` para salir de un recorrido libre) y botón visible de pausa.
- Opción **reducir movimiento** (`prefers-reduced-motion`): cámara por cortes en vez de travelling.
- Modo texto grande (200 %) y un resumen en texto plano de cada acto como `<noscript>`/alternativa.

## Guía visual

| Elemento | Decisión |
| --- | --- |
| Paleta | Tokens del frontend; el rojo de marca solo como acento, igual que el sidebar |
| Antes | Paleta desaturada, luz cálida y sucia, papel y teléfono |
| Después | Paleta limpia y saturada, luz fría, pantallas encendidas |
| Tipografía | La del frontend, mínimo 24 px en pantalla de proyección |
| Pantallas del producto | Capturas reales o el iframe en vivo dentro de una pantalla del modelo 3D |

## Pendiente de decidir
- Confirmar con Lázaro el texto exacto del disclaimer y que quiere ese énfasis.
- Fuente de las capturas: `bodegas-frontend/docs/qa/2026-10-22/` ya tiene ofertas (desktop/móvil), stock por sucursal y búsqueda.
