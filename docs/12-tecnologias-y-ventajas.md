# 12 · Tecnologías: para qué las usamos y por qué las elegimos

Slide final de la presentación («Esto fue todo lo que utilizamos»). En la web, al pasar el cursor o girar la rueda sobre un logo sale el **para qué**. Aquí está además el **por qué frente a la alternativa**, por si preguntan en la sesión de preguntas.

**Cómo usar este documento:** las columnas «Evidencia en el proyecto» son datos verificados en los repos. Lo de «Frente a…» es la ventaja que se puede decir en voz alta; son razones de ingeniería generales, no mediciones nuestras (salvo Grafana/Umami contra Metabase, que sí se midió). Si el equipo eligió por otra razón, se cambia la frase: el guion es de ustedes.

## Frase para decir (≈ 20 s, la dice Lázaro)
"Esto fue todo lo que utilizamos. Elegimos cada pieza por una razón: **Vue** para reutilizar componentes, **PostgreSQL** por sus constraints y su búsqueda por trigramas, **Prisma** para que la base y el código hablen el mismo idioma, **Grafana y Umami** porque pesan cuatro veces menos que la alternativa, y **Clerk** para no guardar nosotros las contraseñas."

## Frontend
| Tecnología | Para qué | Ventaja frente a la alternativa | Evidencia en el proyecto |
|---|---|---|---|
| **Vue 3** | Todo el frontend: catálogo, carrito, panel admin, editor de ofertas | **Frente a React:** al final necesitábamos **componentes reutilizables**, y en Vue cada componente es un archivo único (plantilla, lógica y estilos juntos) que se arma y se reutiliza fácil. El router, el estado (Pinia) y las traducciones son paquetes oficiales del mismo equipo, así que no hubo que escoger entre diez librerías. Además nació como proyecto de **una sola persona** (Evan You) y hoy lo sostiene una comunidad abierta. Honestidad: React tiene un ecosistema y un mercado laboral más grandes; Vue nos dio una curva de aprendizaje más suave con un equipo de 6. | 121 componentes `.vue` (41 reutilizables en `components/`, 15 en el backoffice), traducciones es/en |
| **Vite** | Compila y sirve el frontend | Arranque y recarga casi instantáneos frente a Webpack / Create React App, porque sirve módulos nativos en desarrollo. | Mismo Vite para la app, para Vitest y para esta presentación |
| **Pinia** | Estado: carrito, sesión, filtros, favoritos | Es el estado **oficial** de Vue; más simple que Vuex y con tipos de TypeScript de forma nativa. | |
| **TypeScript** | Frontend y backend | Los errores salen al compilar, no en producción; frontend y backend comparten el lenguaje y los tipos. | `vue-tsc` y `tsc` en ambos repos |
| **Leaflet + OpenStreetMap** | Mapa de sucursales, «cómo llegar» | Código abierto y gratis, sin llave de pago ni cobro por visitas, a diferencia de Google Maps API. En esta presentación los mosaicos están guardados en local, así que funciona sin internet. | Coordenadas de las 3 sucursales en `seed.js` |

## Backend y datos
| Tecnología | Para qué | Ventaja frente a la alternativa | Evidencia |
|---|---|---|---|
| **Node.js + Express** | La API de pedidos, reservas, catálogo | El mismo lenguaje que el frontend; Express es mínimo y deja poner los controles de seguridad que queremos (límite de uso, `helmet`, `hpp`) en vez de un framework pesado. | `express-rate-limit`, `helmet`, `hpp`, 65 usos de `$transaction` |
| **PostgreSQL** | Una sola base central para las 3 sucursales | **Constraints:** la propia base impide datos inválidos (**34 reglas `CHECK`**, llaves foráneas y únicos), no solo el código; por ejemplo, una oferta no puede terminar antes de empezar. **Transacciones con bloqueo de filas** (`FOR UPDATE`) para que dos pedidos no se lleven el mismo stock. **Búsqueda por trigramas** (`pg_trgm` + `unaccent`, índices GIN): tolera errores de dedo y acentos («whisky», «wiski») **sin montar otro servidor** como Elasticsearch. Frente a MySQL o MongoDB: integridad más estricta y la búsqueda difusa viene incluida. | Migración `fuzzy_product_search`; 66 migraciones; 15 índices únicos |
| **Prisma** | Acceso a la base | Los tipos se **generan del esquema**: si cambia una columna, el compilador avisa dónde se rompe. Migraciones versionadas. Frente a TypeORM/Sequelize: menos código a mano y menos errores. | `schema.prisma` + 66 migraciones |
| **Cloudflare R2** | Imágenes de productos y ofertas | Compatible con S3 (mismo SDK) y **sin cobro por la salida de datos**, que pesa cuando el catálogo carga muchas imágenes. | `@aws-sdk/client-s3`, `config/env.ts` |
| **Sharp** | Convierte imágenes a WebP | Más ligeras = catálogo más rápido. | |

## Infraestructura
| Tecnología | Para qué | Ventaja | Evidencia |
|---|---|---|---|
| **Docker** | Empaqueta API, base, Grafana y Umami | Corre igual en la laptop de cualquiera y en producción; `docker compose up` levanta todo. | `docker-compose.yml` |
| **Nginx** | Sirve el frontend en producción | Rápido para archivos estáticos y pone las cabeceras de seguridad. | `nginx.conf`, `security-headers.conf` |
| **Google Cloud (IAP)** | Servidores en producción | El acceso a las máquinas pasa por el proxy con identidad (IAP) en vez de abrir SSH directo. | Acceso por `gcloud` + IAP |
| **GitHub** | Código, revisiones, CI | Revisiones por pull request y flujos de integración continua. | `.github/workflows` en ambos repos |

## Servicios
| Tecnología | Para qué | Ventaja frente a la alternativa | Evidencia |
|---|---|---|---|
| **Clerk** | Inicio de sesión y roles (cliente, empleado, administrador) | **Frente a hacerlo a mano:** no guardamos contraseñas; se pueden **revocar sesiones y bloquear usuarios** desde la API, útil ante un incidente. | Procedimiento de respuesta a incidentes |
| **Resend** | Correos de pedidos, reservas, avisos de stock | API sencilla de integrar, frente a configurar y mantener un servidor SMTP. | `resend` en el backend |
| **Sentry** | Errores y trazabilidad | Cada error llega con el contexto de la solicitud; se ve el problema antes de que lo reporte un cliente. | `@sentry/node`, `@sentry/vue` |
| **Grafana + Umami** | Reportería para la administradora y analítica web | **Frente a Metabase** (medido en el Sprint 7): Metabase ~1.5 GB de RAM porque corre en la JVM; Grafana 260 MB y Umami 107 MB, **unas 4 veces menos**. Grafana además hace el tablero de seguridad (SOC). | Doc `03-decisiones-de-negocio.md` |

## Calidad y seguridad
| Tecnología | Para qué | Ventaja | Evidencia |
|---|---|---|---|
| **Vitest** | Pruebas del frontend | Comparte la configuración de Vite: arranca rápido, sin segunda configuración. | `@vitest/coverage-v8` |
| **Jest** | Pruebas del backend | Estándar para Node/TypeScript, con `ts-jest`. | `jest.config.js`, integración y unitarias |
| **Playwright** | Pruebas de extremo a extremo y accesibilidad | Prueba en varios navegadores y se combina con **axe-core** para revisar accesibilidad automáticamente. | `@playwright/test`, `@axe-core/playwright` |
| **ESLint** | Revisión de código | Con plugins de **seguridad** y **accesibilidad** (`eslint-plugin-security`, `vuejs-accessibility`) detecta riesgos mientras se programa. | Ambos repos |
| **OWASP ZAP** | Escaneo de seguridad | Herramienta abierta y de referencia para pruebas de seguridad web; el escaneo completo hizo 138 pruebas. | Escena 6 |

## Diseño, gestión y esta presentación
| Tecnología | Para qué | Ventaja |
|---|---|---|
| **Figma / Canva** | Diseño inicial de pantallas y material visual | Se trabaja en equipo y en vivo, sin instalar nada. |
| **Miro / Jira** | Planeación, aportes y tareas | Un solo lugar con el tablero del equipo y la evidencia de cada sprint. |
| **Three.js + Blender** | El diorama 3D de esta presentación | Corre en el navegador, sin instalar programas, y todo está bajo control de código; Blender es libre. Frente a grabar un video: se puede ensayar, editar y mostrar en vivo. |

## Si preguntan «¿por qué no…?»
- **¿Por qué no React?** Podría haber servido. Elegimos Vue por los componentes reutilizables y porque trae ruteo, estado y traducciones oficiales; el equipo lo aprendía más rápido.
- **¿Por qué no MongoDB?** Los pedidos, los stocks y las reservas son datos relacionados que necesitan integridad y transacciones; PostgreSQL las da de fábrica.
- **¿Por qué no Elasticsearch para buscar?** Los trigramas de PostgreSQL ya dan búsqueda tolerante a errores con un servicio menos que mantener.
- **¿Por qué no Metabase?** Pesaba unas 4 veces más en memoria (medido).
- **¿Por qué Clerk y no un login propio?** Guardar contraseñas es una responsabilidad que preferimos no asumir.

> **Nota sobre Redis:** el stack original lo mencionaba, pero el backend **no lo usa** hoy (hay comentarios que dicen «mover a Redis si se escala»). Por eso **no aparece** en la slide.
