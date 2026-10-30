# 05 · Marco — La administradora decide (2:45)

**Perspectiva:** la administradora, con todos los datos juntos. Es el corazón de la historia.
**Por qué tú:** Grafana y Umami, exportes seguros, campañas de marketing, matriz de permisos, cimientos.

## Se ve
La pared de monitores de la oficina. Cada decisión es un monitor que se enciende con **un tablero de Grafana** (capturas 13–20 de `08`). El tablero muestra el dato y de ahí sale una **flecha de acción** hacia un botón del sistema.

## Texto (≈ 400 palabras)

**[0:00 · apertura]** "Antes, la administradora decidía con intuición. Hoy abre **Reportes**. Usamos **Grafana** para los datos del negocio y **Umami** para el tráfico web, y los dos viven dentro del panel de administración. Son ligeros y respetan la privacidad de los usuarios. Les voy a mostrar cinco decisiones."

**[0:25 · 1 · qué dejar de comprar]** "Primera: **qué dejar de comprar**. El tablero de demanda muestra el **capital detenido**: cuánto dinero está en bodega en productos que no se venden. Si no se mueve, no se vuelve a pedir, o se **liquida con una promoción**."

**[0:55 · 2 · qué empezar a vender]** "Segunda: **qué empezar a vender**. Cada búsqueda que dio **cero resultados** queda registrada. Es la **lista de compras que los clientes escribieron solos**. Lo que antes era una llamada perdida, hoy es el siguiente producto del catálogo."

**[1:25 · 3 · cuándo ofertar]** "Tercera: **cuándo ofertar**. Estacionalidad nos dice qué día, qué hora y qué mes se vende más, y por categoría: el vino sube en diciembre mientras la cerveza baja. Y el tablero de **Festividades** compara Navidad, Año Nuevo y la feria de septiembre."
> **[Jorge, 30 s opcional]** "El de Festividades lo hice yo: para cada fecha, qué productos suben y cuánto más se compran respecto a un día normal. Así se compra **antes** de la fecha, no durante."

**[1:55 · 4 · dónde se cae la compra]** "Cuarta: **dónde se cae la compra**. Vemos qué productos entraron al carrito y no se pidieron. Si hay stock, el problema es precio o fricción. Si no hay, el cliente **se enteró tarde**, y para eso está el aviso de cuando vuelve."

**[2:15 · 5 · qué reponer ya]** "Quinta: **qué reponer ya**. Stock crítico por sucursal y agotados con demanda."

**[2:25 · acciones]** "Y cada decisión termina en una **acción** dentro del mismo sistema: una **campaña de marketing** por correo con baja firmada, una oferta en el carrusel, un **exporte** a Excel o PDF, protegido y auditado. Todo con una **matriz de permisos** que dice quién puede ver qué."

**[2:40 · pasa la palabra]** "Con tanto dato valioso, hay que cuidarlo. Luis Ángel."

## Datos que respaldan lo que dices
- Tableros: ventas, pedidos, inventario, demanda, estacionalidad, festividades, navegación, seguridad y web (Umami). Ver `03`.
- Capital detenido = Inventario × precio de productos que no venden.
- Búsquedas sin resultados vienen del evento `SEARCH` con `results = 0`.
- Festividades: Navidad (24 de dic), Año Nuevo (29 dic–4 ene), feria e Independencia (12–18 sep).
- Campañas: baja firmada en cada correo y envío reanudable.
- Exportes: con rango de fechas, tope de filas, sin fórmulas maliciosas y cada uno auditado (Miro).
- Grafana con rol de solo lectura; Umami embebido en `/reports/web`.

## No digas
- Montos o porcentajes que no estén en tu captura revisada.
- Nombres de clientes ni filas individuales de pedidos.
- Ingresos del histórico de Almacén: ese histórico muestra **pedidos y unidades**, no ingresos.

## Si te pasas de tiempo
Corta Umami y la decisión 5, y deja las tres primeras.

## Pasa la palabra
"Con tanto dato valioso, hay que cuidarlo. Luis Ángel."
