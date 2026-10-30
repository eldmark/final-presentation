# 04 · Marcelo — El pedido llega a la tienda y los datos se juntan (2:00)

**Perspectivas:** la tienda (empleada) y el sistema (datos).
**Por qué tú:** pedidos y reservas completos, flujo de compra, estados, sincronización con Tailscale, servidor en GCP, IAP, Easy Orders, R2.

## Se ve
1. El pedido sale de la laptop del cliente como una caja luminosa y viaja hasta el **mostrador de la sucursal**.
2. Una tablet con el panel de **pedidos y reservas** (primero en el menú), con estados que cambian.
3. El correo que le llega al cliente.
4. Las tres sucursales con sus libros de registro; de cada una sale una tubería luminosa (**Tailscale**) hacia una sola base **PostgreSQL** en la nube. Aparece el nombre de la bodega.
5. El catálogo se enciende con las imágenes (R2) en la nube.

## Texto (≈ 300 palabras)

**[0:00 · la tienda]** "El cliente confirmó. Ahora el pedido llega a la **sucursal que eligió**. La empleada lo ve en su panel, donde **pedidos y reservas van primero**, y cambia su estado conforme lo prepara: pendiente, confirmado, entregado."

"Cada cambio de estado **avisa al cliente por correo**. Nadie tiene que llamar para saber cómo va. Y cada empleado ve **lo de su sucursal**, no lo de las demás."

**[0:35 · las personas]** "Para quien compra seguido, hay **Easy Orders**: repite su compra anterior en un clic, y guarda sus **productos favoritos**."

**[0:50 · el puente]** "Ahora, el problema de fondo. Las ventas estaban **dispersas**, cada sucursal con su sistema. Lo que hicimos fue conectar el sistema que ya usaba la bodega, **Almacén 3.1**, a nuestra plataforma con una **sincronización de solo lectura** a través de una conexión remota segura con **Tailscale**. Es de solo lectura: **leemos, no modificamos** el sistema de la tienda."

**[1:20 · centralizado]** "De ahí, todo cae en **una sola base de datos**. Los productos, el stock por sucursal, las ventas históricas. Las imágenes de los productos viven en **Cloudflare R2**: al subirlas se les quita el fondo y se convierten a WebP, para que carguen rápido."

**[1:40 · el servidor]** "Todo corre en un servidor en **Google Cloud**, con nuestro dominio, y protegido con **IAP, un proxy que verifica la identidad** antes de dejar pasar a nadie."

**[1:55 · pasa la palabra]** "Con todos los datos en un solo lugar, ya se puede decidir. Marco."

## Datos que respaldan lo que dices
- Pedidos y reservas con estados y filtros por sucursal del empleado.
- Notificaciones por correo con outbox idempotente (Resend); recordatorios de reservas.
- Sincronización con Almacén 3.1 (MySQL, solo lectura) por Tailscale; carga del histórico de ventas.
- Imágenes en R2, quitar fondo y convertir a WebP.
- Servidor en GCP, dominio, IAP (Miro: "Manejo del server a través de GCP y el dominio con Name.com", "Seguridad del server mediante IAP").

## No digas
- Nombres de tablas, IPs o rutas internas de la sincronización.
- Que el sistema de la tienda se reemplazó. **Se complementa**: la tienda sigue vendiendo en Almacén y la plataforma lo lee.

## Pasa la palabra
"Con todos los datos en un solo lugar, ya se puede decidir. Marco."
