# Presentación final — Bodega de Licores (plan)

Presentación 3D que cuenta, como historia de usuario, todo lo que resolvimos: del **cliente que preguntaba precios por WhatsApp, llamada o visita** a **la plataforma e-commerce con reportería**, cambiando en cada acto de quién se cuenta la historia.

- **Fecha:** martes 3 de noviembre de 2026.
- **Duración:** 14 min como máximo (el guion está armado para 13 min, con 1 min de margen).
- **Estado:** solo documentación. El modelado en Blender se hará después, vía MCP de Blender.

## Índice

| Doc | Contenido |
| --- | --- |
| [01-contexto-y-fuentes.md](01-contexto-y-fuentes.md) | Qué se revisó, el problema de antes y aportes por integrante |
| [02-guion-historia-de-usuario.md](02-guion-historia-de-usuario.md) | El guion en actos, con tiempos y perspectivas |
| [03-decisiones-de-negocio.md](03-decisiones-de-negocio.md) | Qué decide el administrador con cada reporte de Grafana |
| [04-seguridad-y-miedo-a-hackeo.md](04-seguridad-y-miedo-a-hackeo.md) | Acto de seguridad: el miedo y cómo se resolvió |
| [05-uiux-y-disclaimer.md](05-uiux-y-disclaimer.md) | Diseño de la presentación y disclaimer de UI/UX de Lázaro |
| [06-direccion-3d-y-blender.md](06-direccion-3d-y-blender.md) | Mundo 3D, assets, stack técnico, cámara |
| [07-plan-de-trabajo.md](07-plan-de-trabajo.md) | Calendario hasta el martes y reparto |
| [08-capturas-y-material-visual.md](08-capturas-y-material-visual.md) | Imágenes de la web por escena y cómo tomarlas |

## Decisiones tomadas

1. **Tono:** solo la historia de lo que resolvimos. Sin calificaciones, sin listas de pendientes.
2. **El "antes":** son **ambos** canales: WhatsApp y llamada/visita a la tienda.
3. **Datos:** reales **anonimizados** (reglas en `03`). Capturas del proyecto completo, revisadas entre nosotros.
3b. **Marca:** hay autorización para mostrar el **nombre y el logo de la bodega** y usar los assets completos (copiados en `assets/marca/`).
3c. **Formato de la charla:** **narramos nosotros** lo que pasa; no es una actuación. Sin diálogos ni actores.
4. **Formato:** presentación web 3D (Blender → glTF → Three.js), con video renderizado de respaldo.
5. **Blender:** el modelado lo hago yo vía MCP. Por ahora solo documentación.
6. **Imágenes:** capturas reales de la web integradas en las pantallas del mundo 3D y en tarjetas de apoyo (ver `08`).
7. **Idioma:** español.
8. **Demostraciones de ataque:** solo contra entorno local o staging propio.

## Fuentes

- Repos: `bodegas-backend/docs`, `bodegas-frontend/docs` (en `~/Documents/software/`).
- Miro: tablero "Brainstorming", leído por el MCP de Miro (33 notas, 15 conectores).
- Capturas existentes copiadas en `assets/capturas/` (stock por sucursal, ofertas desktop y móvil, búsqueda).
