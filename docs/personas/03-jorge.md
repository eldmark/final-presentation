# 03 · Jorge — El cliente compra con confianza + resultados UX (2:00)

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

**[0:55 · resultados UX · 0:45 min]** "No quisimos suponer qué le funciona al usuario, lo **medimos**. En el **Neurolab** analizamos la **respuesta galvánica**, el **seguimiento ocular** y el comportamiento de personas usando la plataforma."

"Esto fue lo que encontramos: **[Hallazgo 1: qué se midió y qué se vio]**, y por eso **[cambio hecho en el producto]**. **[Hallazgo 2 y su cambio]**. **[Hallazgo 3 y su cambio]**."

"Además lo probamos con **lector de pantalla y con teclado**, y revisamos la accesibilidad de forma automática en cada integración."

**[1:45 · pasa la palabra]** "Cuando el cliente confirma, el pedido tiene que llegar a la tienda. Marcelo."

## Datos que respaldan lo que dices
- Las reservas tienen expiración automática que libera el stock (job `reservationExpirer`).
- Recomendaciones por coocurrencia, similares, por categoría y populares, con caché (`RecommendationService`).
- Aportes de Jorge según el Miro: recomendación y Basket Analysis, carrito, reservas, dashboard en Grafana, análisis del Neurolab, accesibilidad con lectores de pantalla y teclado.

## Lo que necesito de ti (criterio con más peso de la rúbrica: 32 %)
Los tres hallazgos del Neurolab, cada uno con **qué se midió, qué se vio y qué cambio se hizo**. Eso no está en los repos. Sin ese insumo este bloque queda vacío. Entrégalo hoy para armarlo con su captura.

## No digas
- Resultados numéricos del Neurolab que no estén en tu informe. Sin nombres ni datos de personas.
- El detalle de permisos de empleados (no entra en esta escena).

## Pasa la palabra
"Cuando el cliente confirma, el pedido tiene que llegar a la tienda. Marcelo."

## Tu aporte aparece también en
Reportes de Grafana y el de **Festividades**: Marco te da la palabra 30 s en su escena para presentarlo. Está marcado en `05-marco.md`.
