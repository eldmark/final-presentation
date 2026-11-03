# 01 · Julián — El antes (2:30)

**Perspectivas:** cliente → tienda → administradora. Abres la presentación.
**Por qué tú:** hiciste el diseño inicial en Figma y la documentación, y entiendes el problema desde la empatía con los tres actores.

## Se ve (3D, sin voces)
1. Mesa con un teléfono que vibra con burbujas de WhatsApp y un teléfono fijo que suena.
2. Un mapa de Quetzaltenango con trayectos que terminan en una estantería vacía.
3. Tres mostradores de tres sucursales, cada uno con su libreta o su sistema, sin conexión entre ellos.
4. Un escritorio con tres reportes sin relación.
5. **Logo de la bodega** en la fachada de la primera escena.

## Texto (≈ 360 palabras)

**[0:00 · gancho]** "Esto es **Bodega de Licores**, en Quetzaltenango. Antes de este proyecto, cada vez que alguien quería comprar una botella, empezaba con una pregunta: *¿cuánto cuesta?* y *¿hay?*."

"Esa pregunta llegaba por **WhatsApp**, por **llamada** o en persona. Y cada una de esas preguntas era una venta."

**[0:30 · el cliente]** *(cita C1 en pantalla, Administrador: "Escriben vía WhatsApp para cotizaciones, consulta de precios o existencias de productos. Todos los días.")* "Imaginen a un cliente. Escribe por WhatsApp y espera la respuesta. Llama a otra sucursal. Al final se sube al carro, va a la tienda y descubre que **no había**. Perdió su tiempo y la bodega perdió la venta."

"Y lo peor: **nadie supo que esa venta existió**. Esa pregunta no quedaba registrada en ningún lado."

**[1:20 · la tienda]** *(citas C3 y C4, Empleado: "En otros casos nos llegamos a comunicar en las otras sucursales preguntando si tienen el producto." / "Tengo [que] consultarlo con mi encargado.")* "Del otro lado del mostrador, el personal atendía a la persona que tenía enfrente, contestaba el teléfono y respondía mensajes, todo al mismo tiempo. Las ventas sí se registraban, pero **en el sistema de cada sucursal**. Cada una era una isla."

**[1:55 · la administradora]** *(citas C5 y C2, Administrador: "Se puede llegar a dar el caso de no concretar una venta por falta de producto." / sobre el tiempo de cada consulta: "Mínimo 10 minutos.")* "Y la persona que tenía que decidir qué comprar, cuándo hacer una oferta o qué no se estaba moviendo, se encontraba con **reportes separados** y sin una visión del conjunto. Decidía con intuición."

**[2:20 · giro]** "Entonces nos hicimos una pregunta: **¿y si cada pregunta de un cliente fuera un dato?**"

**[2:30 · objetivos]** *(tarjeta «Objetivos del proyecto» en pantalla; se responden en las conclusiones)* "Y estos son los **objetivos** con los que partimos:"
1. "Construir un panel de administración autogestionable que permita al personal de la licorera actualizar entradas y salidas de inventario en un tiempo máximo de 5 minutos diarios."
2. "Evaluar el impacto del software comparando métricas operativas del negocio, comprobando una reducción mínima de 15 horas semanales en la gestión manual de mensajes."
3. "Desarrollar una API RESTful y una interfaz de usuario que permitan buscar y visualizar la disponibilidad de productos en menos de 1.5 segundos, eliminando la necesidad de asistencia humana."

## Evidencia de las entrevistas (usa 3 o 4 datos, no todos)
Dilo como "en nuestras entrevistas del Corte 1, a 4 administradores, 4 empleados y 3 clientes". Muestra pequeña, dicho sin adornos.
- **4 de 4** administradores reciben consultas de precio o existencias por WhatsApp o llamada, entre "cada 2 días" y "todos los días".
- Cada consulta quita entre **1 y más de 10 minutos** al personal.
- **3 de 4** reconocen que se pierden ventas por falta de producto.
- **3 de 3** clientes querían ver precios y productos en línea; **2 de 3** ya habían llamado antes de ir.
- Los clientes pedían **domicilio** y saber **qué sucursal les queda más cerca**.
- Cuando no había producto, el personal llamaba a otras sucursales para trasladarlo.
Sin nombres. Una diapositiva con 3 números grandes. Las citas textuales están en [`../10-citas-de-entrevistas.md`](../10-citas-de-entrevistas.md); se leen en pantalla, no se recitan.

## Datos que respaldan lo que dices
- El negocio operaba solo de forma presencial; clientes llamaban o iban a la tienda por precio y disponibilidad, lo que saturaba al personal y perdía ventas. (Entregables del curso, `PROYECTO.md`.)
- Los tres actores del proyecto: cliente, empleado, administrador.
- La premisa del proyecto: **reducir llamadas y visitas**.

## No digas
- Cifras de ventas perdidas en quetzales: no están medidas. Usa solo los datos de las entrevistas.
- "El WhatsApp no funcionaba": funcionaba, pero no era un dato centralizado.

## Pasa la palabra
"Lo primero que cambió fue lo que ve el cliente. Lázaro."

## Tu aporte aparece también en
Mapa de sucursales y "cómo llegar" (Lázaro lo muestra), correos de pedidos y reservas, aviso de "volvió a haber stock", recomendación de sucursal por ubicación, caché del catálogo y campañas de marketing (Marco las nombra en su escena).

---

# Escena 7 · Valor e impacto (0:45, antes del cierre)

**Se ve:** la mesa del inicio, con el teléfono en silencio. Pasos: la pregunta, el "antes", dos tarjetas de Umami y la cota.

**Cifras reales** (capturas de Umami, últimos 90 días; **piloto y pruebas del equipo**, no tráfico de clientes):
- **79** visitantes · **122** visitas · **2 440** vistas de página · rebote 17 % · visita de 6 min 17 s.
- **230** eventos de consulta (`PRODUCT_VIEW`, `SEARCH`, `ADD_TO_CART`).
- Cada consulta atendida por personal quitaba entre **1 y 10+ minutos** (entrevistas).
- **Cota superior:** 230 consultas × 1 a 10 min = de **3.8 a 38 horas** de atención, **si** cada evento hubiera sido una llamada. Se dice como cota, no como ahorro medido.

**Texto (≈ 120 palabras):**
"¿Cuánto vale esto? Antes, cada consulta de precio o existencia le quitaba al personal entre uno y diez minutos o más. Durante el piloto, la plataforma registró **79 visitantes, 122 visitas y 230 eventos de consulta**: vistas de producto, búsquedas y productos al carrito. Si cada uno de esos eventos hubiera sido una llamada de uno a diez minutos, hablamos de **entre cuatro y treinta y ocho horas de atención**. Es una **cota superior**: fue un piloto y también incluye pruebas del equipo. Lo importante es la métrica: **minutos de personal liberados por semana**, y que ahora se puede medir. Gana el **cliente**, que no viaja en vano; el **empleado**, que no se interrumpe; y la **administradora**, que decide con datos."

**No digas** "ahorramos X horas" ni "X %": es una cota con supuesto explícito.

**Pasa la palabra:** "Lázaro cierra."

## Cambios del 2 de nov (valor e impacto)

- La slide de **tecnologías** («Esto fue todo lo que utilizamos», dos grupos: proyecto y presentación) ahora va **al inicio de esta escena**, antes de «¿Cuánto vale esto?». OpenStreetMap queda en «usado para esta presentación».
- Los datos de Umami usan la captura de **septiembre de 2026** (230 eventos) y se agrega la captura de costos de **Google Cloud** (USD 2.76, del 26 de sept al 2 de oct).
- La escena 7 ahora dura 63 s (722 a 785 s) y las conclusiones corren 20 s.
