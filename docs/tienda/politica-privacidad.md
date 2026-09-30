<!--
Borrador para publicar en la dirección de EXPO_PUBLIC_URL_PRIVACIDAD.
Antes de publicar: completar los campos [POR COMPLETAR], pedir revisión a un abogado
(Ley 172-13) y confirmar los pendientes de docs/progreso.md (sección "Pendientes fuera del código").
Todo lo que dice este texto debe seguir siendo cierto en el código: si cambia la analítica,
los reportes de fallos, el respaldo o las suscripciones, se actualiza aquí en el mismo commit.
-->

# Política de privacidad de Tino

Última actualización: 29 de septiembre de 2026

Tino te dice qué tarjeta de crédito te conviene usar cada día. Para eso necesita algunos datos de tus tarjetas, y queremos que sepas exactamente cuáles, dónde se guardan y qué sale de tu teléfono. Lo resumimos así:

- **Tus datos financieros se quedan en tu teléfono,** cifrados. No tenemos servidores donde se guarden tus tarjetas ni tus fechas.
- **No necesitas crear una cuenta.** No te pedimos nombre, correo ni teléfono.
- **Nunca te pedimos** el número completo de tu tarjeta, la fecha de vencimiento, el código de seguridad (CVV) ni tu usuario o clave del banco.
- **Solo si aceptas, enviamos datos de uso anónimos** para mejorar Tino, sin montos, números ni nombres de tarjetas ni fechas de cobro. Puedes cambiar tu respuesta en cualquier momento.
- **No vendemos datos** ni mostramos publicidad.

## 1. Quién es responsable de tus datos

El responsable de Tino es Anderson Polanco, que opera bajo el nombre comercial Polanco Labs, con domicilio en Calle Principal #1, Brisa Oriental, Santo Domingo Este, República Dominicana. Para cualquier pregunta sobre esta política o sobre tus datos, escríbenos a polancolabsrd@gmail.com.

Esta política se rige por la Ley 172-13 sobre protección de datos de carácter personal de la República Dominicana.

## 2. Qué datos guarda Tino en tu teléfono

Estos datos los escribes tú y se guardan **solo en tu teléfono**, en una base de datos cifrada. La clave de cifrado se crea al instalar Tino y se guarda en el almacén seguro del sistema (Keychain en iPhone, Keystore en Android).

| Dato | Para qué se usa |
| --- | --- |
| Tus tarjetas: el nombre que les pones, el banco y el tipo de tarjeta, los últimos 4 dígitos (opcional), el día de corte, la fecha límite de pago, la moneda en que factura y sus recompensas (puntos o cashback) | Calcular cuántos días tienes para pagar y qué tarjeta te conviene hoy |
| Si una tarjeta está en pausa y si marcaste un pago como hecho | Sacarla del ranking y dejar de recordarte ese pago |
| Tus días de cobro: el nombre que les pones (por ejemplo, "Nómina") y cada cuánto cobras. **Nunca montos** | Avisarte si una tarjeta vence antes de que cobres |
| Tus preferencias: el enfoque (días, puntos, cashback o equilibrado), cómo pagas tu balance en dólares, los avisos que quieres recibir, tu plan, tu respuesta sobre los datos de uso (y cuándo la diste) y cuándo aceptaste estos términos y esta política | Que Tino funcione como lo configuraste y recordar tus decisiones |
| Las sugerencias y consejos que ya viste o descartaste | No repetirte lo mismo |
| Una copia del catálogo público de bancos y tarjetas | Que puedas elegir tu banco sin conexión |

Tino no usa tu ubicación, tus contactos, tus fotos, tus mensajes ni tu cámara. El único permiso que te pide es el de notificaciones, y solo si decides activar los avisos.

## 3. Qué sale de tu teléfono

### 3.1 Datos de uso anónimos

Si aceptas compartir los **datos de uso anónimos**, Tino envía eventos como "se registró una tarjeta" o "se cambió el enfoque", para saber qué partes de la app se usan y cuáles mejorar.

**Cómo te lo preguntamos.** Al terminar de configurar Tino te preguntamos si quieres compartirlos, con la lista de lo que se envía a un toque. Hasta que respondas no sale nada: lo que hiciste mientras configurabas Tino se envía solo si aceptas, y si no, se borra. Si respondes que no, te lo volvemos a preguntar como máximo dos veces más desde la pantalla de inicio (a los 14 días y, si vuelves a decir que no, a los 60 días), y después no insistimos. Puedes cambiar tu respuesta cuando quieras en **Ajustes > Privacidad**; al apagarla, Tino deja de enviar eventos al instante y no los guarda para enviarlos después.

Cada evento puede llevar:

- el país configurado en Tino;
- categorías, nunca valores exactos: por ejemplo, el banco y el tipo de tarjeta del catálogo (o "otro"), la moneda en que factura, el tipo de recompensa, el enfoque elegido o cuántas tarjetas tienes en rangos (1, 2, 3 a 4, 5 o más);
- la versión de Tino y la del sistema operativo de tu teléfono, y el tamaño de su pantalla;
- la versión de la herramienta que envía los eventos y un identificador de la sesión de uso, que cambia cada vez que vuelves a Tino después de un rato;
- un identificador aleatorio creado por Tino en tu teléfono, que no está ligado a tu nombre, a tu cuenta de la tienda ni al teléfono. Puedes cambiarlo por uno nuevo en Ajustes > Privacidad, y también se crea uno nuevo si usas "Borrar todo".

**Nunca se envían** montos, balances, límites, números de tarjeta (ni los últimos 4 dígitos), los nombres que les pones a tus tarjetas o cobros, ni tus fechas de cobro. Como en cualquier conexión a internet, el servicio que recibe los eventos ve la dirección IP de tu teléfono: lo tenemos configurado para no guardarla ni usarla para ubicarte.

Estos eventos los recibe PostHog, en servidores de la Unión Europea.

### 3.2 Reportes de fallos

Solo si aceptaste compartir los datos de uso, si Tino se cierra o tiene un error, envía un reporte técnico para que podamos corregirlo: qué parte del código falló, la versión de la app, datos técnicos del teléfono (modelo, sistema, memoria y espacio libres, tamaño de pantalla, idioma y zona horaria) y si la sesión terminó sin fallos. Puede incluir un identificador técnico aleatorio que Sentry crea para contar cuántas instalaciones tuvieron un fallo, sin relación con tu nombre ni con el identificador de los datos de uso. Antes de enviarlo, Tino le quita los datos de pantalla y el historial de acciones, y reemplaza cualquier secuencia larga de números por "[filtrado]". Los reportes no incluyen capturas de pantalla.

Estos reportes los recibe Sentry, en servidores de la Unión Europea, configurado para no guardar la dirección IP. Sin tu aceptación, o con la opción apagada, no se envía ningún reporte.

### 3.3 Compras de Tino Pro

Si compras Tino Pro, el pago lo procesa Apple (App Store) o Google (Google Play); Tino nunca ve los datos de tu tarjeta de pago. Para saber si tienes Pro, Tino usa RevenueCat, que recibe el recibo de la compra de la tienda y un identificador anónimo propio. No le enviamos tu nombre, tu correo ni datos de tus tarjetas registradas en Tino. RevenueCat procesa estos datos en los Estados Unidos.

### 3.4 Catálogo público

Tino puede descargar de nuestro servidor la lista pública de bancos, tarjetas y logos, para mantenerla al día. Esa descarga no lleva ningún dato tuyo; como cualquier conexión a internet, el servidor ve la dirección IP desde donde se pide, y no la usamos para identificarte.

## 4. Respaldos

- **Respaldo con contraseña.** En Ajustes > Tus datos puedes crear un archivo de respaldo cifrado con una contraseña que eliges tú. Tú decides dónde guardarlo (correo, nube, computadora). Sin esa contraseña nadie puede leerlo, ni nosotros: si la olvidas, no la podemos recuperar.
- **Respaldo automático (Tino Pro).** Si lo enciendes, Tino guarda una copia de tus datos en su carpeta dentro del teléfono, y esa copia viaja con el respaldo de tu teléfono (Google en Android, iCloud en iPhone) según la configuración de tu cuenta. Esa copia no lleva una contraseña de Tino: en el teléfono queda en la carpeta privada de Tino, que otras apps no pueden leer, y en la nube la protege el respaldo de Google o de Apple, bajo sus propias políticas de privacidad. Viene apagado; al apagarlo, o con "Borrar todo", se borra la copia del teléfono.
- **Ver mis datos.** En Ajustes > Tus datos, "Ver mis datos" arma un texto legible con todo lo que Tino tiene guardado, incluido el identificador anónimo de los datos de uso, y te deja compartirlo donde quieras. Ese texto no va cifrado.

## 5. Avisos y widget

Los avisos se programan dentro de tu teléfono; no pasan por ningún servidor. Pueden mostrar en la pantalla bloqueada el nombre que le pusiste a una tarjeta y tus fechas de pago y de cobro, pero nunca montos. Puedes apagar cada aviso en Ajustes > Avisos.

En Android, el widget de la pantalla de inicio muestra la tarjeta que te conviene hoy. Para que funcione aunque no abras la app, Tino guarda en su almacenamiento privado un resumen de los próximos 60 días (los nombres de tus tarjetas, sus días para pagar y sus fechas, nunca montos) y los logos de tus bancos. Ese resumen no va cifrado, porque el widget no puede abrir la base cifrada; otras apps no pueden leerlo, y se borra al desinstalar Tino.

## 6. Con quién compartimos datos

No vendemos, alquilamos ni compartimos tus datos con bancos, comercios ni anunciantes. Ningún banco puede pagar para que su tarjeta aparezca mejor en Tino.

Solo usamos estos proveedores, que tratan los datos por encargo nuestro y para lo descrito arriba:

| Proveedor | Para qué | Dónde |
| --- | --- | --- |
| PostHog | Datos de uso anónimos | Unión Europea |
| Sentry | Reportes de fallos | Unión Europea |
| RevenueCat | Estado de la suscripción a Tino Pro | Estados Unidos |
| Apple y Google | Cobro de Tino Pro y respaldo del teléfono | Según su política |

Algunos de estos servidores están fuera de la República Dominicana. Solo les llegan los datos anónimos o técnicos descritos en esta política, nunca tus datos financieros:

- a **PostHog y Sentry**, porque tú lo autorizas al aceptar compartir los datos de uso (artículo 80 de la Ley 172-13);
- a **RevenueCat, Apple y Google**, porque es necesario para venderte Tino Pro y darte acceso a él.

Podríamos tener que entregar información si una autoridad competente lo exige conforme a la ley. Como tus datos financieros no salen de tu teléfono, no los tenemos para entregarlos.

## 7. Cuánto tiempo guardamos los datos

- **En tu teléfono:** hasta que los borres o desinstales Tino.
- **Datos de uso anónimos:** hasta 12 meses, y luego se borran.
- **Reportes de fallos:** hasta 90 días.
- **Compras:** mientras tengas o hayas tenido Tino Pro, y lo que exijan las tiendas y las leyes fiscales.

## 8. Tus derechos

La Ley 172-13 te da derecho a acceder a tus datos, corregirlos, pedir que se borren y oponerte a su uso. En Tino puedes hacerlo tú mismo:

- **Acceder:** Ajustes > Tus datos > Ver mis datos te da un texto con todo lo que Tino guarda.
- **Corregir:** edita tus tarjetas, cobros y preferencias cuando quieras.
- **Borrar:** Ajustes > Tus datos > Borrar todo elimina todos tus datos del teléfono, incluida la clave de cifrado, y crea un identificador anónimo nuevo. Desinstalar Tino también borra los datos del teléfono (el respaldo automático, si lo encendiste, queda en el respaldo de tu teléfono hasta que lo borres ahí).
- **Oponerte o retirar tu consentimiento:** apaga "Compartir datos de uso" en Ajustes > Privacidad.

Si quieres saber qué datos de uso anónimos se enviaron, o que los borremos, escríbenos a polancolabsrd@gmail.com con el identificador que aparece en "Ver mis datos". Te respondemos en un máximo de 5 días hábiles si pides acceso a esos datos, y de 10 días hábiles si pides corregirlos o borrarlos (artículos 8 y 10 de la Ley 172-13). Si no estás conforme con la respuesta, puedes acudir a los tribunales mediante la acción de hábeas data.

## 9. Seguridad

Tus datos se guardan en una base cifrada completa en tu teléfono. Fuera de ella solo quedan, en la carpeta privada de Tino, el resumen del widget de Android y, si la encendiste, la copia del respaldo automático (secciones 4 y 5). Todo lo que Tino envía a sus proveedores viaja cifrado. Tino rechaza cualquier campo que parezca un número de tarjeta completo, para que no se guarde por error. Aun así, ningún sistema es perfecto: protege tu teléfono con bloqueo de pantalla.

## 10. Menores de edad

Tino está dirigido a personas mayores de 18 años que tienen tarjetas de crédito. No recogemos a sabiendas datos de menores.

## 11. Cambios a esta política

Si cambiamos algo importante, lo avisaremos dentro de la app antes de que entre en vigor. La fecha de arriba indica la última versión.

## 12. Contacto

Anderson Polanco (Polanco Labs)\
polancolabsrd@gmail.com\
Calle Principal #1, Brisa Oriental, Santo Domingo Este, República Dominicana
