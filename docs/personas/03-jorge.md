# 03 · Jorge — El cliente compra con confianza + resultados UX (2:00)

**Perspectiva:** el cliente, ya con el producto elegido.
**Por qué tú:** lógica del carrito, reservas conectadas al backend, sistema de recomendación y Basket Analysis, y el análisis del Neurolab.

## Se ve
1. El carrito con el producto, el total y un temporizador de **reserva** que corre.
2. Primero el **Neurolab**: fotos de la prueba y tarjeta con los hallazgos (63.8 %, 4 de 5, 2 de 5). Solo agregados, sin personas identificables.
3. Después el **Basket Analysis**: "clientes que compraron esto también llevaron".
4. Las **compras**: tarjetas de **Favoritos** (`favoritos.jpg`) y **Pedidos frecuentes / Easy Orders** (`pedidos-frecuentes.jpg`).

## Texto (≈ 220 palabras)

**[0:00]** "El cliente ya eligió. Lo agrega al **carrito** y puede **reservarlo**: la bodega le guarda el producto un tiempo. Si no pasa a recogerlo, la reserva **expira sola y el producto vuelve a estar disponible** para otro cliente."

**[0:25 · resultados UX · 0:45 min]** "No quisimos suponer qué le funciona al usuario, lo **medimos**. El **25 de septiembre** hicimos pruebas en el **NeuroLab de la UVG** con **eye tracking, un sensor de actividad electrodérmica y encuestas**. Seis personas hicieron tres tareas: buscar un producto, agregarlo al carrito y reservarlo."

"Primer hallazgo: **la búsqueda se llevó el 63.8 % del tiempo**. Cuatro de cinco encuestados describieron dificultades al buscar. Por eso incorporamos una **búsqueda tolerante a errores de escritura**, con trigramas."

"Segundo: en **2 de 5 videos** la gente **confundió comprar con reservar**. Ya tenemos la mejora definida: etiquetas distintas, 'Reservar para recoger' y 'Comprar y pagar'."

"Tercero: el **botón flotante del chat tapaba la paginación**, y lo corregimos. Además, la actividad electrodérmica subió al **escribir**, en los 5 casos analizables, así que mejoramos los mensajes de validación."

"Probamos también con **lector de pantalla y teclado**."

**[1:10 · recomendaciones]** "Mientras compra, la plataforma le sugiere qué más le puede interesar. Eso sale de un análisis de **coocurrencia**, lo que llamamos *Basket Analysis*: mira qué productos suelen comprarse juntos y recomienda según eso. Lo diseñamos desde el algoritmo hasta los servicios, lo optimizamos para producción en **GCP** y lo conectamos con el carrito y con los productos más populares."

**[1:30 · compras]** *(tarjetas Favoritos y Easy Orders)* "Y para comprar más rápido: en **Favoritos** guarda los productos que le gustan para volver a ellos, y en **Pedidos frecuentes (Easy Orders)** repite una compra anterior en un clic."

**[1:45 · pasa la palabra]** "Cuando el cliente confirma, el pedido tiene que llegar a la tienda. Marcelo."

## Datos que respaldan lo que dices
- Las reservas tienen expiración automática que libera el stock (job `reservationExpirer`).
- Recomendaciones por coocurrencia, similares, por categoría y populares, con caché (`RecommendationService`).
- Aportes de Jorge según el Miro: recomendación y Basket Analysis, carrito, reservas, dashboard en Grafana, análisis del Neurolab, accesibilidad con lectores de pantalla y teclado.

## Evidencia: Informe NeuroLab (`Informe_oficial_NeuroLab_APA7.pdf`)
- Fecha y lugar: 25 de septiembre de 2026, NeuroLab UVG. Eye Tracking Smart Eye AI-X, Shimmer GSR e iMotions. **Sin EEG.**
- Muestra: **6 registros** (conveniencia, 18–20 años), 5 videos revisados y 5 encuestas. Se dice tal cual: es un estudio exploratorio.
- **Búsqueda:** 518 de 812 s observados (63.8 %). (La mediana de 113 s ya no se dice en pantalla ni en voz; T2 agregar = 12 s; T3 reservar = 20 s.)
- **Encuesta:** 4 de 5 con dificultades de búsqueda; 4 de 5 consideraron suficiente la información del catálogo.
- **Compra vs. reserva:** 2 de 5 videos; uno rectificó (reserva a los 2:39) y otro no completó.
- **GSR:** más picos tras eventos de escritura en 5 de 5 casos analizables (+3.99 picos/min de mediana; p = .0625, exploratorio). No hay un aumento general en la reserva.
- **Decisiones:** búsqueda tolerante por trigramas (sprints 8 y 9, ya en el código); diferenciar compra y reserva (propuesta); evitar colisión chatbot/paginación (corregida en sprints 8 y 9); teléfono e idioma; agregado rápido y estado del carrito.
- El efecto cuantitativo de los cambios se medirá en una **segunda medición**: no se afirma una mejora medida.

## No digas
- Que los cambios "mejoraron" una cifra: el informe dice que falta la segunda medición.
- Nombres o datos de los participantes. Son P01–P06 y no se mencionan. **Se cuenta con el consentimiento informado** de la persona que aparece en las fotos del NeuroLab.
- Que la diferenciación 'Reservar para recoger' / 'Comprar y pagar' ya está en el producto: hoy es **propuesta**. **[confirmar]** si ya se aplicó.
- El detalle de permisos de empleados (no entra en esta escena).

## Pasa la palabra
"Cuando el cliente confirma, el pedido tiene que llegar a la tienda. Marcelo."

## Tu aporte aparece también en
Reportes de Grafana y el de **Festividades**: Marco te da la palabra 30 s en su escena para presentarlo. Está marcado en `05-marco.md`.
