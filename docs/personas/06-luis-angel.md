# 06 · Luis Ángel — El miedo a que lo hackeen (1:30)

**Perspectivas:** la dueña (que tiene miedo) y el "atacante" (solo como ilustración).
**Por qué tú:** APIs con validación y control de acceso, auditoría de la actividad administrativa, protección de datos en logs y telemetría, Sentry y trazabilidad por solicitud. Te acompañan Marcelo (IAP) y Marco (permisos, respaldos, CI).

## Se ve
La sala de datos en 3D con **capas concéntricas** de seguridad. Aparece una silueta "atacante" que golpea cada capa. Al lado, una pantalla con el panel de **Seguridad** (`/reports/security`) donde cada intento aparece **en tiempo real**.
Las demostraciones corren **solo en local o staging propio**.

## Texto (≈ 300 palabras)

**[0:00 · el miedo]** "En las entrevistas, los administradores nos dijeron qué les daba miedo de vender en línea: **la extorsión, las estafas y que usurparan la empresa**. *(citas C11 y C12 en pantalla, Administrador: "Estafas, extorción." / "Robo o usurpación de empresa.")* Hay pedidos, NIT y datos personales. Lo trabajamos en **capas**, y lo hicimos visible."

**[0:20 · intento 1]** "Primer intento: un usuario manda un pedido ya marcado como **entregado** y con una fecha pasada. El servidor lo ignora. **Todo pedido nace pendiente y con la fecha del servidor.** Siempre."

**[0:40 · intento 2]** "Segundo intento: un empleado trata de **cambiarse el rol**. Rechazado: solo el administrador edita usuarios, y **nadie cambia su propio rol**."

**[0:55 · intento 3]** "Tercero: borrar las huellas. La **bitácora de auditoría es de solo lectura**, de punta a punta. Cada cambio administrativo queda registrado, y los logs **no guardan datos personales**."

**[1:10 · intento 4]** "Cuarto: abrir Grafana sin sesión. El proxy lo corta antes de llegar. Y aunque alguien entrara, el tablero se conecta con un usuario de **solo lectura**: no puede ni escribir en la base."

**[1:30 · vigilancia]** "Y todo lo que se intenta aparece aquí, **en tiempo real**: accesos rechazados, ráfagas de peticiones, orígenes no permitidos. Los errores llegan a **Sentry** con un identificador por solicitud, para seguirles la pista."

**[1:45 · bloqueo]** "Si alguien insiste, el administrador **bloquea esa IP con un clic**. Y de la IP solo guardamos una huella cifrada, no la dirección."

**[1:55 · cierre del acto]** "Lo atacamos nosotros primero, lo vemos en vivo y lo dejamos documentado."

## Datos que respaldan lo que dices
- `POST /orders` con validación estricta: ignora estado y fechas del llamante.
- `PUT /users/:id` solo ADMIN; nadie cambia su propio rol.
- Bitácora de solo lectura de punta a punta.
- Señales de seguridad: `AUTHENTICATION_REJECTED`, `AUTHORIZATION_DENIED`, `CORS_ORIGIN_DENIED`, `RATE_LIMIT_EXCEEDED`, `IP_BLOCKED`, visibles en `/reports/security`.
- nginx con `auth_request` para Grafana; rol de PostgreSQL de solo lectura.
- Bloqueo por IP con HMAC (`IP_HASH_SECRET`).
- Sentry con `requestId`.

## Antes de grabar
Probar en local cada intento y comprobar que se comporta como dice el texto. Si alguno no sale, **se saca del guion**. Lista completa en `04-seguridad-y-miedo-a-hackeo.md`.

## No digas
- "Es imposible hackearlo". Di "lo atacamos nosotros primero".
- Direcciones IP reales, dominios internos ni claves.
- Nada de pruebas contra producción ni terceros.

## Con 1:30
Deja solo los intentos 1 y 2, el panel en tiempo real y el bloqueo de IP. Quita los intentos 3 y 4 del texto de arriba.

## Pasa la palabra
"Todo esto tiene un valor medible. Julián." (Julián presenta valor e impacto y luego Lázaro cierra.)
