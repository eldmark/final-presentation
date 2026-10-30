# 04 · Seguridad: el miedo a que lo hackeen (y cómo se resolvió)

Tesis del acto: el miedo era razonable, porque una tienda en línea guarda pedidos, NIT y datos personales. Lo enfrentamos en capas y lo dejamos **a la vista en un panel**.

Crédito principal en el Miro: **Luis Ángel** (auditoría administrativa, protección de datos en logs y telemetría, Sentry y trazabilidad, control de acceso a pedidos y reservas). Complementan **Marcelo** (IAP, GCP) y **Marco** (matriz de permisos, respaldos, CI).

**Tiempo:** 2:15. Se muestran 4 intentos de ataque en secuencia rápida y se termina con el bloqueo de IP.

## Escenas de ataque (solo contra entorno local o staging propio)

Las demostraciones se hacen en `localhost` o staging del equipo. Nunca contra producción ni terceros.

| # | Intento del "atacante" | Qué pasa | Origen en los docs |
| --- | --- | --- | --- |
| 1 | Crear un pedido con estado "Entregado" o con fecha pasada | El servidor lo ignora: el pedido nace Pendiente con la fecha del servidor | Validación estricta de `POST /orders` |
| 2 | Un empleado intenta cambiar su rol | Rechazado: solo el ADMIN edita usuarios; nadie cambia su propio rol | Control de acceso por rol |
| 3 | Intentar borrar o editar la bitácora | Bitácora de solo lectura de punta a punta | Auditoría administrativa |
| 4 | Leer el token de sesión desde la URL de un stream | No existe: tickets opacos de un solo uso (30 s) | Streams con ticket |
| 5 | Ráfaga de peticiones | Respuesta 429 y señal en el panel | Rate limit + SOC |
| 6 | Petición desde un origen no permitido | Se rechaza y queda registrada (CORS) | SOC |
| 7 | Abrir `/grafana/` sin sesión | nginx lo corta; solo el ADMIN entra | `auth_request` a `/internal/grafana-auth` |
| 8 | Seguir atacando desde la misma IP | El ADMIN la bloquea con un clic; solo se guarda el HMAC de la IP | Bloqueo por IP |
| 9 | Fórmula maliciosa dentro de un exporte | Los exportes están protegidos y cada exporte queda auditado | Exportes seguros (Marco) |
| 10 | Un panel de Grafana intenta escribir en la base | Imposible: el rol es de solo lectura | Rol de solo lectura de Grafana |

Antes de grabar cada escena, se verifica en local que se comporte como dice la tabla.

## Capas que se dibujan en 3D (de afuera hacia adentro)

1. **Borde:** dominio, nginx, IAP (Marcelo), `auth_request` para Grafana.
2. **Aplicación:** Clerk (sesión), roles ADMIN / EMPLOYEE / CLIENT, validación con zod, rate limit, CORS, helmet.
3. **Datos:** rol PostgreSQL de solo lectura para reportes, datos personales fuera de los logs, políticas de retención y saneamiento.
4. **Vigilancia:** señales de seguridad en el panel `/reports/security` (401, 403, CORS, 429, IP bloqueada), Sentry con trazabilidad por solicitud, escaneo OWASP ZAP semanal.
5. **Recuperación:** respaldos con `pg_dump` y retención, y un procedimiento de respuesta a incidentes.

## Lo que se muestra en el cierre del acto

- Una revisión técnica formal del código y los controles que salieron de ella.
- Miles de pruebas automáticas en CI (backend y frontend) antes de cada integración.
- Un panel de seguridad que el administrador ve en vivo.

Frase de cierre: *"Lo atacamos nosotros primero, lo vemos en vivo y lo dejamos documentado."*

## Imágenes
- Captura del panel `/reports/security` con eventos de la demostración (ver `08`).
- Captura de la pantalla de bloqueo de IP.

## Pendiente de decidir
- Qué escenas van en vivo y cuáles pregrabadas. Recomendado: grabar las 10 con un script y dejar en vivo solo la #8 por su efecto visual.
