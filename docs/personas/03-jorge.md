# 03 · Jorge — El cliente compra con confianza (1:30)

**Perspectiva:** el cliente, ya con el producto elegido.
**Por qué tú:** lógica del carrito, reservas conectadas al backend, sistema de recomendación y Basket Analysis, y el análisis del Neurolab.

## Se ve
1. El carrito con el producto, el total y un temporizador de **reserva** que corre.
2. Una tarjeta de "**clientes que compraron esto también llevaron**" con dos o tres productos.
3. Si el producto estuviera agotado: alternativas y la opción de avisar cuando vuelva.
4. Una pantalla corta del **Neurolab**: mapa de calor del ojo y curva de respuesta galvánica. Solo agregados, sin personas identificables.

## Texto (≈ 220 palabras)

**[0:00]** "El cliente ya eligió. Lo agrega al **carrito** y puede **reservarlo**: la bodega le guarda el producto un tiempo. Si no pasa a recogerlo, la reserva **expira sola y el producto vuelve a estar disponible** para otro cliente."

**[0:25]** "Mientras compra, la plataforma le sugiere qué más le puede interesar. Eso sale de un análisis de **coocurrencia**, lo que llamamos *Basket Analysis*: mira qué productos suelen comprarse juntos y recomienda según eso. Lo diseñamos desde el algoritmo hasta los servicios, lo optimizamos para producción en **GCP** y lo conectamos con el carrito y con los productos más populares."

**[0:55]** "Y como no queríamos suponer qué le funciona al usuario, lo **medimos**. En el **Neurolab** analizamos **respuesta galvánica**, **seguimiento ocular** y comportamiento mientras la gente usaba la plataforma, y lo que encontramos lo convertimos en mejoras del producto."

**[1:15]** "También nos aseguramos de que se pueda usar con **lector de pantalla y con teclado**."

**[1:25 · pasa la palabra]** "Cuando el cliente confirma, el pedido tiene que llegar a la tienda. Marcelo."

## Datos que respaldan lo que dices
- Las reservas tienen expiración automática que libera el stock (job `reservationExpirer`).
- Recomendaciones por coocurrencia, similares, por categoría y populares, con caché (`RecommendationService`).
- Aportes de Jorge según el Miro: recomendación y Basket Analysis, carrito, reservas, dashboard en Grafana, análisis del Neurolab, accesibilidad con lectores de pantalla y teclado.

## No digas
- Resultados numéricos del Neurolab que no estén en el informe. **[confirmar]** qué hallazgo concreto quieres mostrar y su fuente.
- El detalle de permisos de empleados (no entra en esta escena).

## Pasa la palabra
"Cuando el cliente confirma, el pedido tiene que llegar a la tienda. Marcelo."

## Tu aporte aparece también en
Reportes de Grafana y el de **Festividades**: Marco te da la palabra 30 s en su escena para presentarlo. Está marcado en `05-marco.md`.
