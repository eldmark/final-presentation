# 06 · Dirección 3D y Blender

## Quién modela

El modelado lo hago yo en Blender 5.2 a través del **MCP de Blender**. Ese MCP aún no está conectado en esta sesión; hay que instalarlo y reiniciar antes de modelar (por ahora solo documentación).

## Stack propuesto

**Blender 5.2 (ya instalado) → exportar `.glb` → Three.js + Vite en el navegador.**

| Opción | Pros | Contras | Veredicto |
| --- | --- | --- | --- |
| **Web 3D (Three.js)** | Se ensaya en el navegador, pantallas del producto como iframe/textura en vivo, interactivo, un solo link | Hay que optimizar peso y rendimiento | **Recomendada** |
| Video renderizado (Blender Cycles/EEVEE) | Calidad cinematográfica, cero riesgo en vivo | No interactivo, render largo, no muestra Grafana vivo | **Plan B** y trailer |
| Híbrido | Escenas "pesadas" en video, escenas con pantallas en web | Dos pipelines | Si sobra tiempo |

Regla de respaldo: exportar siempre un **video completo** de la presentación por si falla el equipo del salón.

## Estructura del mundo

Una **ciudad en miniatura** (diorama sobre mesa, estilo isométrico/low-poly cuidado) con cámara que viaja entre estaciones. Cada acto es una estación con su luz.

| Estación | Acto | Contenido |
| --- | --- | --- |
| Sala del cliente | 1 y 5 | Sofá, teléfono, mapa; el *después* con laptop y pantalla del catálogo |
| Mostrador | 2 y 6 | Sucursal con estantería, caja, empleada; el *después* con tablet de pedidos |
| Oficina | 3 y 7 | Escritorio con papeles; el *después* con pared de monitores (Grafana) |
| Nube / sala de datos | 4 y 8 | Racks, tuberías, PostgreSQL, firewall en capas, panel de seguridad |
| Mapa de Quetzaltenango | 9 | Tres sucursales conectadas por líneas de luz |

## Lista de assets a modelar en Blender

Prioridad A = imprescindible, B = si hay tiempo.

| Asset | Prio | Notas |
| --- | --- | --- |
| Botella de whisky (el "hilo") | A | Material vidrio + etiqueta; aparece en todos los actos |
| Teléfono con burbujas de WhatsApp | A | Las burbujas son texto/planos animados |
| Mostrador, estantería y caja de una sucursal | A | Se reutiliza ×3 con variaciones |
| Figuras low-poly del cliente, la empleada y la administradora | A | Siluetas simples que ilustran lo que narramos; no hablan ni actúan |
| Escritorio con papeles / cuadernos | A | Para el *antes* del administrador |
| Pared de monitores y pantalla de laptop | A | Superficie donde va la captura o el iframe |
| Servidor/racks + base de datos (cilindro) | A | Acto 4 y 8 |
| Capas de seguridad (escudos o muros concéntricos) | A | Acto 8 |
| Mapa con pins de sucursales | B | Acto 9 |
| Camión de reparto, cajas de pedidos | B | Acto 6 |
| Props de festividades (adornos de Navidad) | B | Decisión 3 |
| Logo y rótulo de la bodega (fachada, mostrador, pantallas) | A | Autorizado. Fuentes en `assets/marca/` (SVG y WebP del frontend) |

Presupuesto técnico: escena completa < 25 MB de `.glb` (texturas WebP/KTX2, geometría con Draco), objetivo 60 fps en un portátil medio.

## Pipeline

1. **Bloqueo** (greybox) de cada estación en Blender con unidades en metros.
2. **Modelado** de assets A, material PBR simple y paleta limitada.
3. **Hornear luz** (bake) en las estaciones fijas para rendir bien en web.
4. **Animaciones** con acciones nombradas (ej. `bottle_float`, `pins_connect`) y empties como puntos de cámara.
5. **Exportar** `.glb` por estación (carga diferida), con nombres estables.
6. **Three.js**: cargar estaciones, cámara por *spline* entre empties, texturas de pantalla (`<video>`, imagen o iframe vía CSS3DRenderer).
7. **Guion → línea de tiempo**: cada acto = secuencia de cámara + subtítulo + disparador de animación.
8. **Exportar video** de respaldo con Blender o grabación de pantalla de la web.

Se puede automatizar la generación de piezas simples con scripts de Blender en Python (`bpy`) y ejecutar Blender en modo headless desde la terminal para exportar todo con un solo comando.

## Cámara y ritmo

- Un plano maestro por acto + 2 o 3 cortes de detalle. Sin movimientos mareantes.
- Transiciones entre actos: la cámara cruza un objeto (la botella) que sirve de *match cut*.
- **Antes** = cámara a mano ligera/estática; **Después** = movimientos suaves y simétricos.

## Pendiente de decidir
- Estilo exacto: low-poly limpio, recomendado por el poco tiempo (presentación el martes 3 de noviembre) y el peso.
- Sala y proyector: todo debe correr **sin conexión** (assets locales, sin CDN) por si no hay internet.
