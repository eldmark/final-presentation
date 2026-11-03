# 06 · Luis Ángel — El miedo a que lo hackeen (1:30)

**Perspectivas:** la dueña (que tiene miedo) y el "atacante" (solo como ilustración).
**Por qué tú:** APIs con validación y control de acceso, auditoría de la actividad administrativa, protección de datos en logs y telemetría, Sentry y trazabilidad por solicitud. Te acompañan Marcelo (IAP) y Marco (permisos, respaldos, CI).

## Se ve
La sala de datos en 3D con **capas concéntricas** de seguridad. Aparece una silueta "atacante" que golpea cada capa. Al lado, una pantalla con el panel de **Seguridad** (`/reports/security`) donde cada intento aparece **en tiempo real**.
Las demostraciones corren **solo en local o staging propio**.

## Texto (≈ 300 palabras)

**Orden de la escena (pedido del equipo): hook → hilo → Sentry → OWASP.**

**[HOOK · el miedo]** "En las entrevistas, los administradores nos dijeron qué les daba miedo de vender en línea: **la extorsión, las estafas y que usurparan la empresa**. *(citas C11 y C12 en pantalla)* Hay pedidos, NIT y datos personales."

**[HOOK · intentaron vulnerar]** "Y no es un miedo en el aire: **intentaron vulnerarnos con esta petición.**" *(en pantalla la captura de la petición de ataque, `web/public/cards/peticion-ataque.png`; hoy es un placeholder. No inventes datos: describe solo lo que muestre la captura real.)*

**[HILO · 4 ejemplos de intento y defensa]**
1. "Un pedido ya marcado como **entregado** y con fecha pasada: el servidor lo ignora. **Todo pedido nace pendiente y con la fecha del servidor.**"
2. "Un empleado trata de **cambiarse el rol**: rechazado. Solo el administrador edita usuarios y **nadie cambia su propio rol**."
3. "Borrar las huellas: la **bitácora de auditoría es de solo lectura**, y los logs **no guardan datos personales**."
4. "Todo lo que se intenta aparece **en tiempo real**: accesos rechazados, ráfagas, orígenes no permitidos. Si alguien insiste, el administrador **bloquea esa IP con un clic**; solo guardamos una huella cifrada."

**[SENTRY]** "Los errores llegan a **Sentry** con un identificador por solicitud, para seguirles la pista."

**[OWASP ZAP]** "Y lo cerramos con un escaneo completo de OWASP ZAP: **138 pruebas, 0 fallos.** Lo atacamos nosotros primero, lo vemos en vivo y lo dejamos documentado."

## Datos que respaldan lo que dices
- `POST /orders` con validación estricta: ignora estado y fechas del llamante.
- `PUT /users/:id` solo ADMIN; nadie cambia su propio rol.
- Bitácora de solo lectura de punta a punta.
- Señales de seguridad: `AUTHENTICATION_REJECTED`, `AUTHORIZATION_DENIED`, `CORS_ORIGIN_DENIED`, `RATE_LIMIT_EXCEEDED`, `IP_BLOCKED`, visibles en `/reports/security`.
- nginx con `auth_request` para Grafana; rol de PostgreSQL de solo lectura.
- Bloqueo por IP con HMAC (`IP_HASH_SECRET`).
- Sentry con `requestId`.
- OWASP ZAP, escaneo completo: 138 pruebas aprobadas, 0 fallos.

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
