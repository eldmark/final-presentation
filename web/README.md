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

## Docker (recomendado para la sala)

```bash
cd web
./start.sh          # construye la imagen, la levanta y muestra las direcciones
docker compose down # para detenerla
```

`start.sh` crea `.env` con un **token** aleatorio, detecta la IP del equipo y arranca el contenedor
(puerto **8088**, se cambia con `PORT` en `.env`). Imprime dos direcciones:

| Dirección | Para qué |
| --- | --- |
| `http://localhost:8088/?k=TOKEN` | La presentación, en el equipo del proyector |
| `http://IP:8088/remote?k=TOKEN` | El **control remoto del celular** |

El contenedor sirve la presentación y retransmite los mensajes entre dispositivos (WebSocket en `/ws`).
Todo funciona **sin internet**, pero el celular y el equipo deben estar en la **misma red Wi-Fi**.
Sin el token nadie puede mover la presentación desde otro dispositivo. `.env` no se sube a git.

### Control desde el celular

En la vista del presentador (tecla **P**) abre «Controlar desde el celular»: ahí hay un **QR**.
Si ves `localhost`, escribe la IP del equipo en el cuadro. El celular muestra las ideas clave de quien
habla, lo que viene, los relojes y botones grandes de **Atrás / Siguiente**, y mantiene la pantalla encendida.

### Portada y telón

La portada sigue el estilo de las diapositivas de Canva (fondo carbón, título condensado, acento lima, integrantes y botón **Presentar**).
Al pulsarlo —o con **Enter**, o desde el celular— la portada se desvanece, queda un **telón de terciopelo cerrado** y se abre
revelando la escena 1. Con `?autoplay=1` se salta la portada y con «reducir movimiento» el telón no se anima.


Pon `cover.json` y la imagen en `web/portada/` (ver `portada/README.md`). Esa carpeta está montada en el
contenedor: no hace falta reconstruir la imagen.

## Cómo se presenta

Por omisión es **paso a paso**: quien presenta decide el ritmo. Cada pulsación lleva al siguiente paso
(un subtítulo, una cita, una tarjeta, una burbuja de WhatsApp) y la cámara se mueve sola. Hay 8 escenas,
una por persona, y un cronómetro real de 14 minutos (`T`). También hay modo **automático** (`M`) que
reproduce los 13:30 sin intervención.

| Tecla | Acción |
| --- | --- |
| → · Espacio · Enter · Av Pág | Siguiente paso |
| ← · Re Pág · Retroceso | Paso anterior |
| Shift + → / ← | Escena siguiente / anterior |
| M | Paso a paso ↔ automático |
| T | Muestra u oculta el cronómetro |
| A | Texto grande (para la sala) |
| F | Pantalla completa |
| H · ? | Ayuda |
| P | Vista del presentador |
| I | Acerca de (diseño, datos y modelos 3D, en otra pestaña) |
| Inicio | Volver al principio |

El control remoto de la sala suele mandar Av Pág / Re Pág: ya funcionan. Los controles se esconden solos
a los pocos segundos sin mover el mouse. Respeta `prefers-reduced-motion`: los viajes largos entre
estaciones pasan a ser cortes.

## Vista del presentador

Una segunda ventana, sincronizada en vivo con la presentación (mismo navegador, sin servidor):

- Se abre con la tecla **P**, con el botón **Presentador** de la barra, o en `presenter.html`.
- Muestra la escena actual, las **ideas clave** de quien habla, los **datos que puede citar**, lo que **no debe decir** y la **frase de relevo**.
- Muestra **lo que viene** en el siguiente paso y avisa cuando cambia de escena y de persona.
- Dos relojes: el **total** contra los 14:00 y el de **esta escena** contra su tiempo (ámbar al pasarse, rojo al pasarse un 25 %).
- Controla la presentación: Siguiente, Anterior, escena anterior o siguiente, modo, y clic en cualquier paso o escena.
- Las notas de cada persona están en `public/data/notes.json`.

Ponla en la pantalla del portátil y la presentación en el proyector. Las dos ventanas deben estar **visibles**:
si una ventana queda minimizada o tapada, el navegador la pausa y la sincronización se retrasa.

## Para ensayar

| Parámetro | Efecto |
| --- | --- |
| `?t=300` | Empieza en el segundo 300 (5:00) |
| `?autoplay=1` | Salta la pantalla de inicio (paso a paso) |
| `?mode=auto` | Salta el inicio y reproduce solo |
| `?timer=1` | Muestra el cronómetro |
| `?large=1` | Texto grande |

## Dónde se edita cada cosa

| Qué | Archivo |
| --- | --- |
| Subtítulos, citas, tarjetas (imagen o cifras), disclaimer | `public/data/content.json`. Cada elemento con su segundo `at`; los que caen a menos de 1.6 s se funden en un mismo paso |
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
