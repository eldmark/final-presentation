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

### Conectar los celulares a la sesión local

Cada celular se convierte en un **control remoto** con las notas de quien habla. No necesita internet ni
instalar nada: solo abrir una dirección en el navegador.

**Antes de empezar**

- El equipo con la presentación y los celulares deben estar en la **misma red** (el mismo Wi-Fi, o el
  punto de acceso del celular de alguien; ver «Sin Wi-Fi» abajo).
- Docker debe estar corriendo (`./start.sh`).

**Paso a paso**

1. En el equipo de la presentación: `cd web && ./start.sh`. Al terminar imprime algo así:

   ```
   En este equipo:   http://localhost:8088/?k=509543f554fb
   Desde el celular: http://192.168.0.2:8088/remote?k=509543f554fb
   QR para todos:    http://localhost:8088/mobile-qr?k=509543f554fb
   ```

2. Abre la primera dirección **en el equipo** (la presentación, con el `?k=` completo).
3. Abre en el equipo **`http://localhost:8088/mobile-qr`** (la primera vez, con el `?k=` que imprimió `start.sh`;
   el navegador la recuerda y después basta la ruta). Es una pantalla con un **QR grande**, pensada para
   **proyectarla o enseñarla** a quienes van a conectarse, y un contador que dice **cuántos celulares hay
   conectados** («2 celulares conectados»). También está en la vista del presentador (tecla **P**).
4. Cada persona abre la **cámara** del celular y apunta al QR (o escribe la dirección que aparece debajo).
   Se abre la pantalla *Control remoto*; arriba debe decir **● Conectado (por red)**.
5. Prueba **Siguiente ›**: la presentación del equipo avanza un paso. Pueden conectarse **varios celulares a la vez**
   (todos controlan la misma sesión; avisen quién tiene el control).

> Si el QR dice `localhost`, escribe en el cuadro «Dirección de este equipo en la red» la IP que imprimió
> `start.sh` (por ejemplo `http://192.168.0.2:8088`). Se guarda para la próxima vez.

**Qué ve cada celular**: el nombre de quien habla (grande), sus ideas clave resaltadas, lo que viene, el
cronómetro total y de la escena, y botones grandes de *Atrás / Siguiente*, *escena anterior / siguiente* y el
modo. El resto de las notas está plegado.

**El token (`k=`)**: es la «llave» de la sesión. Sin ella nadie en el mismo Wi-Fi puede mover la presentación.
`start.sh` la crea una sola vez y la guarda en `.env` (no se sube a git). Para **cambiarla**: borra la línea
`PRESENTER_TOKEN` de `.env` y vuelve a correr `./start.sh`; los celulares tendrán que escanear el QR de nuevo.

**Si no conecta**

| Síntoma | Causa probable | Qué hacer |
| --- | --- | --- |
| El celular no abre la página | No están en la misma red, o el Wi-Fi aísla a los clientes («AP isolation», común en redes de universidad o cafetería) | Usa el punto de acceso de un celular (ver abajo) |
| Abre la página pero dice *Sin señal de la presentación* | La ventana de la presentación está minimizada o tapada | Déjala visible: el navegador pausa las ventanas ocultas |
| Dice *Esperando la presentación…* y nunca conecta | Falta el `?k=` o es el token viejo | Escanea el QR de nuevo o copia la dirección completa que imprimió `start.sh` |
| Cambió la IP del equipo (otra red) | `PUBLIC_URL` en `.env` quedó con la IP anterior | Borra `PUBLIC_URL` de `.env` y corre `./start.sh`, o escríbela en el cuadro del QR |
| Funciona en el equipo pero no en el celular | Firewall del equipo | Abre el puerto: `sudo ufw allow 8088/tcp` (ufw) o `sudo firewall-cmd --add-port=8088/tcp` (firewalld) |
| El celular se apaga durante la presentación | El navegador no deja bloquear la pantalla en `http://` de red local | Sube el tiempo de pantalla del celular a «nunca» mientras dure la presentación |
| Vibra al pulsar pero no avanza | La presentación ya terminó o está en modo automático | Pulsa **M** en el equipo o el botón *Paso a paso* del celular |

**Sin Wi-Fi, o si el Wi-Fi bloquea dispositivos: compartir datos desde un celular**

Sí funciona: si un celular comparte su internet como **punto de acceso Wi-Fi** y el equipo de la presentación y los
demás celulares se conectan a **esa misma red**, todos quedan en la misma red local y se ven entre sí.

1. En el celular que comparte: *Ajustes → Punto de acceso / Compartir internet → activar* (Wi-Fi).
2. Conecta el **equipo de la presentación por Wi-Fi** a esa red. **No** uses cable USB ni Bluetooth: con
   «anclaje USB» el equipo queda en otra subred y los amigos no lo alcanzan.
3. En el equipo, corre `./start.sh` **otra vez**, para que tome la IP nueva (cambia con cada red).
4. Abre `http://localhost:8088/mobile-qr` y que los demás escaneen el QR **estando conectados a ese mismo punto de acceso**.

Qué tener en cuenta:

- **No gasta datos móviles**: el control es tráfico local entre dispositivos. La presentación tampoco necesita
  internet. Solo el QR final de `bodegadelicores.app` usa los datos de quien lo escanee.
- **Cuántos caben**: el iPhone admite unos 5 dispositivos en su punto de acceso; muchos Android, 8 a 10. Cuenta el
  equipo de la presentación.
- **Los datos móviles pueden estar apagados** en el celular que comparte, o sin saldo: la red local funciona igual.
- El celular que comparte también puede ser control remoto. Si no abre la dirección, pruébalo antes con otro.
- Si el equipo está conectado además por cable o a otro Wi-Fi, `start.sh` puede escoger la IP equivocada: escribe la
  correcta en el cuadro «Dirección de este equipo en la red» de `/mobile-qr`.
- Direcciones típicas: iPhone `172.20.10.x`, Android `192.168.43.x` (o `10.x.x.x` en algunos modelos).

**Sin Docker**: `npm install && npm run build`, y luego
`PRESENTER_TOKEN=miclave PUBLIC_URL=http://IP:8088 PORT=8088 npm run serve`. El servidor de desarrollo
(`npm run dev`) **no** incluye el relevo: sirve para editar, no para usar el celular.

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
| Q | Calidad alta ↔ básica (la alta añade luz de estudio, oclusión, brillo y acabado de maqueta) |
| H · ? | Ayuda |
| P | Vista del presentador |
| I | Acerca de (diseño, datos y modelos 3D, en otra pestaña) |
| Inicio | Volver al principio |

Si el equipo no llega a 30 fps en los primeros segundos con la calidad alta, baja solo a la básica y avisa.
La elección hecha con **Q** se recuerda en ese navegador.

El control remoto de la sala suele mandar Av Pág / Re Pág: ya funcionan. Los controles se esconden solos
a los pocos segundos sin mover el mouse. Respeta `prefers-reduced-motion`: los viajes largos entre
estaciones pasan a ser cortes.

## Vista del presentador

Una segunda ventana, sincronizada en vivo con la presentación (mismo navegador, sin servidor):

- Se abre con la tecla **P**, con el botón **Presentador** de la barra, o en `presenter.html`.
- Muestra en **grande el nombre de quien habla** (el nombre **no** aparece en la presentación pública) y quién sigue.
- Las **ideas clave** van con alto contraste y resaltadas; el resto (datos, «no digas», pasos, escenas) queda plegado y atenuado para no hacer ruido.
- También muestra la **frase de relevo**.
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
| `?quality=high` · `?quality=low` | Fija la calidad (sin medir el equipo) |

## Dónde se edita cada cosa

| Qué | Archivo |
| --- | --- |
| Subtítulos, citas, tarjetas (imagen o cifras), disclaimer | `public/data/content.json`. Cada elemento con su segundo `at`; los que caen a menos de 1.6 s se funden en un mismo paso |
| Burbujas de WhatsApp | `src/bubbles.ts` (`BUBBLE_SPECS`) |
| Recorrido de cámara | `public/data/tour.json` (lo genera `blender/04_camera_tour.py`) |
| Modelo 3D | `public/models/diorama.glb` (lo genera `blender/05_export_glb.py`) |
| Personajes animados (cliente, empleada, administradora) | `public/models/people/` y `src/people.ts` (colores, animación por estación). Ocupan el lugar de las figuras `fig_*` del modelo; el atacante sigue siendo la silueta de Blender |
| Ambientación (estanterías con botellas, lámparas, plantas, alfombras, cuadros, sofá, vetas de madera, botella de vidrio) | `src/decor.ts`. Se monta en código encima del modelo: no hace falta volver a exportar de Blender |
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
