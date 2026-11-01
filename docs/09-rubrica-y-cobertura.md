# 09 · Rúbrica y cobertura del plan

Fuente: `Rubrica.xlsx` (CC3091, pitch con demostración, **14 minutos, 8 puntos**). Este documento cruza cada criterio con el guion y dice qué ajustamos.

## Resumen

| # | Criterio | Pts | Peso | Estado antes de revisar | Estado ahora |
| --- | --- | --- | --- | --- | --- |
| 4 | **Solución, demo y resultados UX** | 2.56 | 32 % | Faltaban pruebas con usuarios y flujos reales | Ajustado, **falta insumo de Jorge** |
| 1 | Hilo narrativo | 1.12 | 14 % | Bien | Reforzado el cierre |
| 2 | **Problemática del cliente** | 0.96 | 12 % | Sin evidencia | Resuelto con las entrevistas |
| 3 | **Valor e impacto de negocio** | 0.80 | 10 % | No estaba | Escena nueva, **faltan datos** |
| 5 | **Justificación tecnológica** | 0.80 | 10 % | No estaba | Una línea "por qué" por escena |
| 6 | Participación del equipo | 0.80 | 10 % | Bien | Todos hablan; relevos con frase |
| 7 | Dinamismo y profesionalismo | 0.48 | 6 % | Bien | Reglas de ritmo y no leer |
| 8 | Apoyo visual | 0.48 | 6 % | Bien | Poco texto, reglas abajo |

Lo que más pesa es el criterio 4 (casi un tercio de la nota): pide **flujos reales integrados a la historia** y **pruebas con usuarios, resultados y mejoras**.

---

## 4 · Solución, demo y resultados UX (2.56)

**Excelente pide:** demostrar cómo la solución resuelve el problema con flujos reales integrados a la historia, y mostrar pruebas con usuarios, resultados y mejoras.

**Ajustes:**
1. **Flujos reales, no solo capturas.** Dentro de las pantallas del 3D van **grabaciones de pantalla** de un flujo completo, con el mismo producto (la botella): buscar → ver stock por sucursal → reservar/pedir → empleada cambia estado → llega el correo → la administradora lo ve en el tablero. Las capturas quedan como apoyo. (Ver `08`.)
2. **Un bloque de resultados UX** de 30 s dentro de la escena de **Jorge**: qué probamos con usuarios, qué encontramos y **qué cambiamos**.
3. **Cada escena** termina señalando la necesidad del cliente que resolvió (entrevistas, abajo).

**Evidencia de usuarios que sí existe en los repos:**
- Entrevistas del Corte 1 a administradores, empleados y clientes (ver abajo).
- Prototipos de alta fidelidad en Figma (vistas de cliente y administrador), sprint 1.
- El chatbot recomendador se validó en 4 iteraciones de prototipo con el Product Owner.
- Guía de pruebas dinámicas (QA manual) y pruebas automáticas de accesibilidad (axe) sobre 11 rutas.

**Ya incorporado:** el **Informe NeuroLab** (`Informe_oficial_NeuroLab_APA7.pdf`, 25 de septiembre de 2026): 6 registros, 5 videos y 5 encuestas; hallazgos de búsqueda, compra vs. reserva, chatbot/paginación y actividad electrodérmica, con las decisiones aplicadas en los sprints 8 y 9. Resumen en `personas/03-jorge.md`.

> **Para Jorge:** confirmar si 'Reservar para recoger' / 'Comprar y pagar' ya está aplicado (en el código no encontré esas etiquetas) y preparar una figura del informe (tiempos por tarea) como captura.

---

## 2 · Problemática del cliente (0.96)

**Excelente pide:** cliente y usuarios concretos, evidencia del problema y consecuencias actuales.

- **Cliente:** Bodega de Licores, Quetzaltenango (varias sucursales).
- **Usuarios:** clientes, empleados de mostrador y administradores.
- **Evidencia: entrevistas del Corte 1** (4 administradores, 4 empleados, 3 clientes; muestra pequeña, se dice tal cual):

| Hallazgo | Dato |
| --- | --- |
| Consultas de precio y existencias llegan por WhatsApp o llamada | **4 de 4** administradores, con frecuencia "cada 2 días", "muy seguido" o "todos los días" |
| Tiempo que quitan al personal | Entre **1 minuto y "mínimo 10 minutos"** por consulta, según cuántos productos cotizan |
| Se pierden ventas por falta de producto | **3 de 4** administradores lo reconocen |
| Empleados reciben llamadas por precio o disponibilidad | **3 de 4** |
| Cuando no hay producto | Llaman a otras sucursales, trasladan o compran de emergencia, y ofrecen envío a domicilio |
| Clientes que quieren ver precios y productos en línea | **3 de 3** |
| Clientes que ya llamaron antes de ir | **2 de 3** |
| Clientes les han pedido compra en línea | **3 de 4** administradores |
| Lo que piden los clientes | Pedidos a domicilio y saber qué sucursal les queda más cerca |
| **Miedos al vender en línea** | **Extorsión, estafas y usurpación de la empresa** (3 de 4 administradores) |

**Consecuencias actuales** (lo que se dice): personal interrumpido, clientes que esperan o van en vano, inventario conocido solo por cada sucursal, ventas perdidas cuando no hay producto.

Estos datos van en la escena de **Julián** (problema) y alimentan la de **Luis Ángel** (el miedo era a la extorsión, las estafas y la usurpación; no una idea abstracta).

> Datos de entrevistas: se dicen **agregados** y sin nombres. Es una muestra pequeña: dilo con naturalidad ("en nuestras entrevistas...").

---

## 3 · Valor e impacto de negocio (0.80)

**Excelente pide:** comparar con la situación actual, estimar el impacto con **una métrica pertinente**, y explicar **supuestos, beneficiarios y alternativas**.

Se agrega una **escena de 45 s** (la presenta Julián, antes del cierre). Estructura:

| Pieza | Contenido |
| --- | --- |
| **Situación actual (antes)** | Consultas por WhatsApp o llamada: de cada 2 días a todos los días, de 1 a 10+ min cada una (entrevistas) |
| **Métrica** | **Minutos de personal liberados por semana** = consultas resueltas en la web × minutos por consulta × factor de sustitución |
| **De dónde sale cada número** | Consultas resueltas: eventos `PRODUCT_VIEW` y sesiones con stock visto (Umami y `InteractionEvent`). Minutos por consulta: rango 1–10 de las entrevistas. Factor: **supuesto**, se dice como escenarios (por ejemplo conservador, medio) |
| **Métricas de apoyo** | Búsquedas sin resultados (demanda que antes se perdía), pedidos y reservas web, abandono de carrito |
| **Beneficiarios** | Cliente (ahorra el viaje), empleado (menos interrupciones), administradora (decide con datos) |
| **Alternativas** | Seguir con WhatsApp y llamadas; catálogo de WhatsApp Business; plataforma de e-commerce de terceros; desarrollo propio (la elegida: integra con Almacén 3.1, reportería propia, control de los datos) |
| **Costo** | **[completar]** costo mensual real de servidor, dominio y servicios con plan de pago |

> **Cifras ya disponibles** (capturas de Umami, últimos 90 días, piloto y pruebas del equipo): 79 visitantes, 122 visitas, 2 440 vistas, 230 eventos de consulta. Con 1 a 10 min por consulta, la **cota superior** es de 3.8 a 38 horas. Se presenta como cota, nunca como ahorro medido.

> **Regla:** nada de "ahorramos X %" sin medirlo. Se presentan escenarios con su supuesto a la vista.

---

## 5 · Justificación tecnológica (0.80)

**Excelente pide:** por qué se eligió cada tecnología según requisitos, costos y alternativas. Todo sale del Corte 3 y de los docs:

| Capa | Elegido | Alternativas que se evaluaron | Por qué |
| --- | --- | --- | --- |
| Frontend | **Vue 3** | React | Curva de aprendizaje más simple y buen rendimiento; React exige más librerías para cosas comunes |
| Backend | **Express + TypeScript** | Laravel, FastAPI | Mismo lenguaje que el frontend; flexible para APIs REST; FastAPI integra poco con JS |
| Base de datos | **PostgreSQL + Prisma** | MySQL, MongoDB | Relaciones complejas e integridad referencial; el equipo ya la conocía; Prisma da tipado |
| Despliegue | **Docker** | — | Frontend, backend y base corren independientes y portables |
| Reportería | **Grafana + Umami** | Metabase | Medido en el Sprint 7: Metabase 1.5 GB de RAM (corre en la JVM); Grafana 260 MB y Umami 107 MB, unas 4 veces menos; tableros aprovisionados como código; Umami respeta la privacidad |
| Autenticación | **Clerk** | Hacerla propia | Login con Google y sesiones sin guardar contraseñas nosotros |
| Imágenes | **Cloudflare R2** | Disco del servidor | Almacenamiento externo compatible con S3 para imágenes WebP |
| Correo | **Resend** | — | Correos transaccionales con reintentos idempotentes |
| IA | **OpenRouter** | — | Cadena de modelos gratuitos con tope diario: control de costo |
| Conexión a Almacén 3.1 | **Tailscale** (solo lectura) | Exponer la base | La base de la tienda nunca se expone a internet |

**Cómo se dice:** no se lee la tabla. Cada persona dice **una frase** del "por qué" de lo que explica, y la tabla completa va en una tarjeta de 10 s en la escena de Marcelo (infraestructura) y otra de 10 s en la de Marco (reportería).

> **Pendiente:** confirmar con el equipo las alternativas de Clerk, R2, Resend y OpenRouter que sí se consideraron. En esta tabla solo están como "alternativa genérica", no como evaluación documentada. Si no se evaluaron, no se dice "comparamos"; se dice la razón de la elección.

---

## 1 · Hilo narrativo (1.12)

**Excelente pide:** conectar problema, solución y evidencia; transiciones claras y un **cierre que retoma el propósito**.

- Hilo: la **botella** + la pregunta del inicio ("¿cuánto cuesta y hay?").
- Cada escena termina con una **frase de relevo** (ya están en `personas/`).
- **Cierre:** retoma el propósito del inicio: *reducir llamadas y visitas* y *convertir cada pregunta en un dato*. Debe volver a la imagen de apertura (el teléfono que vibra) ahora en silencio, con el tablero encendido.

## 6 · Participación del equipo (0.80)

**Excelente pide:** todos exponen una parte sustancial, dominan su contenido y hacen relevos fluidos.

| Persona | Tiempo hablando |
| --- | --- |
| Julián | 2:30 + 0:45 (problema y valor) |
| Lázaro | 1:30 + 0:45 (UX y cierre) |
| Jorge | 2:00 |
| Marcelo | 2:00 |
| Marco | 2:30 |
| Luis Ángel | 1:30 |

Todos entre 1:30 y 3:15. Cada uno **responde preguntas de su parte** sin leer: se ensaya con preguntas del equipo.

## 7 · Dinamismo y profesionalismo (0.48)

- **No leer.** Los textos de `personas/` son guías; se ensayan hasta decirlos con sus palabras. Las ideas en negrita son lo mínimo.
- **Tiempo:** el total planeado es de **13:30** de 14:00. Cronometrar en cada ensayo.
- Voz clara, contacto visual con el público y no con la pantalla, lenguaje y vestimenta formales.
- Relevos de una frase, sin pausas.

## 8 · Apoyo visual (0.48)

- Poco texto: **máximo una frase o un dato grande por pantalla**.
- Textos legibles a distancia (≥ 24 px en proyección) y con contraste ≥ 4.5:1.
- Consistencia: misma paleta y tipografía del producto (`05`).
- Las tarjetas con tablas (tecnología, valor) son **imágenes con 3–4 líneas**, no tablas completas.

---

## Tiempos con los ajustes

| Escena | Narra | Tiempo | Acumulado |
| --- | --- | --- | --- |
| 1 · El antes, con evidencia de entrevistas | Julián | 2:30 | 2:30 |
| 2 · El cliente encuentra y elige | Lázaro | 1:30 | 4:00 |
| 3 · Compra con confianza + resultados UX | Jorge | 2:00 | 6:00 |
| 4 · Pedido a la tienda, datos juntos y stack | Marcelo | 2:00 | 8:00 |
| 5 · La administradora decide | Marco | 2:30 | 10:30 |
| 6 · El miedo a que lo hackeen | Luis Ángel | 1:30 | 12:00 |
| 7 · Valor e impacto | Julián | 0:45 | 12:45 |
| 8 · Cierre y disclaimer | Lázaro, con todos | 0:45 | 13:30 |

Margen: 30 s.

## Pendientes críticos (en orden)

1. **Jorge:** confirmar qué cambios del Neurolab ya están aplicados (criterio 4).
2. **Marco:** números reales anonimizados de uso (criterio 3).
3. **Equipo:** costo mensual del sistema y alternativas realmente evaluadas (criterios 3 y 5).
4. **Todos:** grabar el flujo real completo de la botella (criterio 4).
