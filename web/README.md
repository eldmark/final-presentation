# Presentación web (Vite + TypeScript + Three.js)

Reproduce el diorama de Blender con el recorrido de cámara de 13:30, subtítulos, citas de entrevista,
tarjetas con imágenes, burbujas de WhatsApp y el disclaimer de UI/UX.

```bash
cd web
npm install
npm run dev        # http://127.0.0.1:5180
npm run build      # genera dist/ (se puede servir desde cualquier carpeta estática)
npm run typecheck
```

## Controles

| Tecla | Acción |
| --- | --- |
| Espacio / K | Pausa o reanuda |
| ← / → | Escena anterior o siguiente |
| F | Pantalla completa |
| A | Texto grande (para la sala) |
| Esc | Pausa |

La barra inferior permite saltar a cualquier punto. Respeta `prefers-reduced-motion`: los viajes largos
entre estaciones pasan a ser cortes.

## Para ensayar

| Parámetro | Efecto |
| --- | --- |
| `?t=300` | Empieza en el segundo 300 (5:00) |
| `?autoplay=1` | Salta la pantalla de inicio |
| `?autoplay=1&pause=1&t=300` | Congela el cuadro (útil para revisar una escena) |
| `?large=1` | Texto grande |

## Dónde se edita cada cosa

| Qué | Archivo |
| --- | --- |
| Subtítulos, citas, tarjetas, disclaimer | `public/data/content.json` (tiempos en segundos absolutos) |
| Burbujas de WhatsApp | `src/bubbles.ts` (`BUBBLE_SPECS`) |
| Recorrido de cámara | `public/data/tour.json` (lo genera `blender/04_camera_tour.py`) |
| Modelo 3D | `public/models/diorama.glb` (lo genera `blender/05_export_glb.py`) |
| Imágenes de las tarjetas | `public/cards/` |
| **Cambiar una captura de pantalla del modelo** | `public/screens/manifest.json` |

### Cambiar una captura sin volver a exportar de Blender

Pon la imagen en `public/screens/` y regístrala:

```json
{ "overrides": { "scr_monitor_10": "ventas.jpg", "scr_laptop_catalogo": "catalogo-nuevo.jpg" } }
```

Los nombres de pantalla del modelo: `scr_laptop_catalogo`, `scr_tablet_pedidos`, `scr_almacen`,
`scr_monitor_00` a `scr_monitor_12` (fila `r` y columna `col`: `scr_monitor_{r}{col}`), `scr_seguridad`.
Mismo formato horizontal (≈16:9) que el resto.

## Sin conexión

Todo es local: sin CDN ni fuentes externas. Basta copiar `dist/` al equipo de la sala y servirlo
(`npm run preview`, o cualquier servidor estático).
