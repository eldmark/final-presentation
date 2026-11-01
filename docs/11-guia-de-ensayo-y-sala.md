# 11 · Guía de ensayo y de la sala

## Montaje (10 minutos antes)

1. Llevar la carpeta `web/dist/` (generada con `npm run build`) **en el portátil y en una memoria USB**.
   Funciona sin internet. Alternativa: `npm run dev` con el repo clonado.
2. Conectar el proyector como **pantalla extendida** (no duplicada).
3. Abrir `index.html` (o `http://127.0.0.1:5180`) en Chrome y **moverlo al proyector**: pantalla completa (`F`).
4. Pulsar **P** para abrir la vista del presentador y dejarla **en la pantalla del portátil**.
5. Activar el cronómetro en la ventana principal (`T`) solo si se quiere que el público lo vea; en la vista del presentador ya está siempre.
6. Probar **Siguiente** desde el portátil: la presentación debe avanzar un paso.
7. Si hay control remoto, probar Av Pág y Re Pág.
8. Texto grande (`A`) si la sala es grande.

## Si algo falla

| Problema | Qué hacer |
| --- | --- |
| No hay internet | No hace falta: todo es local |
| La vista del presentador dice "Sin señal" | La ventana principal está minimizada o tapada: ponerla visible |
| El 3D va lento | Bajar la resolución de la pantalla del proyector, o cerrar otras pestañas |
| No abre el 3D | Abrir el **video de respaldo** (pendiente de renderizar) y narrar con las mismas frases |
| Se pierde el hilo | `Shift + →` / `←` cambia de escena; clic en una escena de la barra |

## Ensayo cronometrado

Tiempos por escena (suman 13:30; el límite es 14:00):

| Escena | Quién | Tiempo | Pasos |
| --- | --- | --- | --- |
| 1 · El antes | Julián | 2:30 | 20 |
| 2 · El cliente encuentra y elige | Lázaro | 1:30 | 5 |
| 3 · Compra con confianza | Jorge | 2:00 | 14 |
| 4 · Pedido, datos y stack | Marcelo | 2:00 | 11 |
| 5 · La administradora decide | Marco | 2:30 | 9 |
| 6 · El miedo a que lo hackeen | Luis Ángel | 1:30 | 6 |
| 7 · Valor e impacto | Julián | 0:45 | 5 |
| 8 · Cierre y disclaimer | Lázaro | 0:45 | 2 |

Reglas del ensayo:
1. **Primer ensayo con el guion en mano**, para fijar cuántos pasos se dicen en cada pulsación.
2. **Segundo ensayo sin leer**: solo ideas clave, y quien tiene el clicker avanza.
3. **Tercer ensayo con el cronómetro** y público (un compañero que haga preguntas de la rúbrica).
4. Anotar la escena que se pasa de tiempo y recortar según la tabla de `personas/README.md`.
5. Cada quien **responde preguntas de su parte** sin mirar las notas.

## Quién maneja el clicker

Una sola persona avanza durante toda la presentación (o se pasa el control en cada relevo).
La que habla puede pedir "siguiente" o hacerlo con la vista del presentador si tiene el portátil.

## Lista de revisión final (la noche anterior)

- [ ] `npm run build` sin errores y `dist/` probado abriéndolo desde otra carpeta.
- [ ] Capturas con datos anonimizados revisadas entre el equipo.
- [ ] Cifras de Umami presentadas como piloto y pruebas, y la cota con su supuesto.
- [ ] Notas de `public/data/notes.json` leídas por cada persona.
- [ ] Video de respaldo en la memoria USB.
