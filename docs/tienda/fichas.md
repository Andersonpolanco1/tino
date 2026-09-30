# Fichas de tienda de Tino 1.0.0

Textos y respuestas para App Store Connect y Google Play Console. Base: sección 1.1 de la especificación (nombre, subtítulo, descripción corta y palabras clave), 15.2 (planes) y las decisiones D58, D60, D63 y D84 de `docs/progreso.md`.

Reglas para todas las fichas:

- Sin nombres ni logos de bancos reales en textos, palabras clave ni capturas (1.1 y D63).
- Sin prometer ahorros exactos ni resultados financieros garantizados.
- Solo República Dominicana y solo español en el lanzamiento (D84).

## 1. Textos comunes

**Eslogan:** La tarjeta correcta, cada día.

**Descripción** (sirve para las dos tiendas; menos de 4,000 caracteres):

> ¿Tienes dos o más tarjetas de crédito y nunca sabes cuál usar? Tino te lo dice cada día.
>
> Registra tus tarjetas con su día de corte y su fecha límite de pago, y Tino calcula cuál te da más días para pagar sin intereses, cuál te da más puntos o más cashback. Al abrir la app ves la tarjeta que te conviene hoy, sin escribir nada.
>
> TU TARJETA DE HOY
> • Cuántos días tienes para pagar lo que compres hoy y en qué fecha se paga.
> • Un semáforo del ciclo: cuándo es buen momento para usar cada tarjeta y cuándo conviene esperar.
> • Tú eliges qué te importa más: días para pagar, puntos, cashback o un equilibrio.
> • "Tengo una compra": escribe el monto y te dice qué tarjeta usar, en pesos o en dólares.
>
> PAGA A TIEMPO
> • Avisos antes de cada fecha límite.
> • Si registras tus días de cobro, te avisa cuando una tarjeta vence antes de que cobres.
> • Tarjetas con balance en pesos y en dólares, con los dos pagos.
> • Consejos para acomodar tus fechas de corte a tu quincena.
>
> TUS DATOS SON TUYOS
> • Todo se guarda cifrado solo en tu teléfono. No hace falta crear una cuenta.
> • Nunca te pedimos el número de tu tarjeta, su vencimiento, el código de seguridad ni tus claves del banco.
> • Respaldo con contraseña para cambiar de teléfono.
> • Ningún banco puede pagar para que su tarjeta salga mejor en Tino.
>
> WIDGET
> • En Android, la tarjeta de hoy en tu pantalla de inicio.
>
> GRATIS Y TINO PRO
> Tino es gratis con hasta 2 tarjetas. Con Tino Pro registras todas tus tarjetas y activas el respaldo automático. Tino Pro se cobra por mes o por año en tu cuenta de la tienda y se renueva solo; lo cancelas cuando quieras desde la configuración de tu cuenta.
>
> Tino es una herramienta informativa y no está afiliada a ningún banco. Confirma siempre tus fechas y montos con tu estado de cuenta.

**Novedades de la versión 1.0.0:** Primera versión de Tino. ¡Gracias por probarla!

**Direcciones:**

| Campo | Valor |
| --- | --- |
| Política de privacidad | https://polancolabs.com/apps/tino/privacidad (la misma de `EXPO_PUBLIC_URL_PRIVACIDAD`) |
| Términos de uso (EULA) | https://polancolabs.com/apps/tino/terminos (la misma de `EXPO_PUBLIC_URL_TERMINOS`) |
| Soporte | https://polancolabs.com/apps/tino/soporte |
| Correo de contacto | polancolabsrd@gmail.com |
| Sitio web (opcional en Google Play) | https://polancolabs.com/apps/tino |

## 2. App Store

| Campo | Texto | Caracteres |
| --- | --- | --- |
| Nombre | Tino | 4 / 30 |
| Subtítulo | Qué tarjeta de crédito usar | 27 / 30 |
| Texto promocional | Abre Tino y ve qué tarjeta de crédito te conviene hoy: más días para pagar, más puntos o más cashback. Tus datos se quedan cifrados en tu teléfono. | 147 / 170 |
| Palabras clave | corte,fecha límite,puntos,cashback,millas,pago,quincena,recordatorio,crédito,dólares | 84 / 100 |
| Categoría principal | Finanzas | |
| Categoría secundaria | Utilidades | |
| Disponibilidad | Solo República Dominicana (D84) | |
| Precio | Gratis, con compras dentro de la app | |

Las palabras clave van separadas por comas y sin espacios después de la coma, porque Apple cuenta cada carácter. No repiten "Tino" ni palabras del nombre o del subtítulo.

**Compras dentro de la app** (D58 y D60, sin oferta de introducción):

| Producto | Nombre visible | Precio | Descripción (máx. 45) |
| --- | --- | --- | --- |
| Mensual | Tino Pro mensual | USD 2.49 | Todas tus tarjetas y respaldo automático |
| Anual | Tino Pro anual | USD 19.99 | Todas tus tarjetas y respaldo automático |
| Anual de lanzamiento | Tino Pro anual de lanzamiento | USD 14.99 | Precio especial para los primeros usuarios |

Los tres en el mismo grupo de suscripción, "Tino Pro". La reseña de Apple necesita una captura del muro de pago para cada producto.

**Privacidad de la app** (etiqueta de App Store Connect). Los datos que solo se guardan en el teléfono no se declaran, porque no se "recopilan" en el sentido de Apple.

| Tipo de dato | Uso | ¿Vinculado a la identidad? | ¿Rastreo? |
| --- | --- | --- | --- |
| Uso > Interacción con el producto | Analítica | No | No |
| Identificadores > ID de usuario (identificador anónimo de Tino y de RevenueCat) | Analítica y funcionalidad de la app | No | No |
| Compras > Historial de compras | Funcionalidad de la app | No | No |
| Diagnóstico > Datos de fallos | Funcionalidad de la app | No | No |
| Diagnóstico > Datos de rendimiento (sesiones sin fallos de Sentry) | Funcionalidad de la app | No | No |

"Rastreo" es "No" porque Tino no une sus datos con los de otras empresas ni los usa para publicidad; por eso no hace falta el aviso de App Tracking Transparency.

**Clasificación por edad:** responder "Ninguno" en todo el cuestionario (sin violencia, apuestas, contenido para adultos ni contenido generado por usuarios). Resultado esperado: 4+.

**Notas para la revisión de Apple:**

> Tino no requiere cuenta ni inicio de sesión. Para ver el ranking de tarjetas, registre dos tarjetas de ejemplo con cualquier banco (por ejemplo, "Mi banco no está en la lista" y un nombre inventado), cualquier día de corte y de pago. Para ver la oferta de Tino Pro, intente registrar una tercera tarjeta desde la pestaña Tarjetas, o toque Tino Pro en Ajustes. Todos los datos se guardan solo en el teléfono. Tino no está afiliado a ningún banco; los logos solo identifican al emisor de la tarjeta del usuario.

## 3. Google Play

| Campo | Texto | Caracteres |
| --- | --- | --- |
| Título | Tino: Qué tarjeta usar | 22 / 30 |
| Descripción corta | Descubre qué tarjeta de crédito usar hoy para tener más días, puntos o cashback. | 80 / 80 |
| Descripción completa | La descripción de la sección 1 | |
| Categoría | Finanzas | |
| Etiquetas | Finanzas personales, Presupuesto (elegir las más cercanas que ofrezca la consola) | |
| Países | Solo República Dominicana (D84) | |

**Suscripciones:** los mismos tres productos y precios que en App Store. En Google Play, el precio de lanzamiento puede ser un plan base aparte del anual; RevenueCat lo presenta como el paquete `lanzamiento` (pendiente de RevenueCat en `docs/progreso.md`).

**Seguridad de los datos** (Data safety):

| Pregunta | Respuesta |
| --- | --- |
| ¿La app recopila o comparte datos del usuario? | Sí, recopila; no comparte |
| ¿Los datos se cifran en tránsito? | Sí |
| ¿Los usuarios pueden pedir que se borren sus datos? | Sí: "Borrar todo" en la app y el correo de la política para los datos de uso ya enviados |

| Categoría > tipo | Recopilado | Compartido | Opcional | Para qué |
| --- | --- | --- | --- | --- |
| Actividad en la app > Interacciones con la app | Sí | No | Sí (solo si el usuario acepta, D88; se cambia en Ajustes) | Estadísticas |
| Información y rendimiento de la app > Registros de fallos | Sí | No | Sí (misma aceptación) | Estadísticas y funcionalidad |
| Información y rendimiento de la app > Diagnóstico | Sí | No | Sí (misma aceptación) | Estadísticas |
| Identificadores de dispositivo u otros (identificador anónimo) | Sí | No | Sí (misma aceptación) | Estadísticas |
| Información financiera > Historial de compras | Sí | No | No | Funcionalidad de la app (estado de Tino Pro) |

Los datos de tarjetas y cobros no se declaran: nunca salen del teléfono. Los proveedores que procesan datos por encargo de Tino (PostHog, Sentry y RevenueCat) no cuentan como "compartir" según Google.

**Declaración de funciones financieras:** Tino no ofrece préstamos, pagos, inversiones, criptomonedas ni banca. Elegir la opción que corresponda a "otras / ninguna de las anteriores" o a "gestión de finanzas personales", según lo que muestre la consola.

**Clasificación de contenido (IARC):** categoría "Utilidades, productividad, comunicación u otras"; responder "No" a violencia, contenido sexual, lenguaje, sustancias, apuestas, compras de contenido aleatorio e interacción entre usuarios. Sí tiene compras digitales. Resultado esperado: Para todos (3+).

**Público objetivo:** 18 años o más.

**Anuncios:** la app no contiene anuncios.

## 4. Capturas

Con datos de ejemplo, sin bancos reales (D63): bancos escritos a mano, como "Banco Uno", "Banco Dos" y "Banco Tres", que muestran iniciales en vez de logos. Modo claro, con el reloj del sistema a las 9:41 y la batería llena.

| # | Pantalla | Texto sobre la captura |
| --- | --- | --- |
| 1 | Inicio con 3 tarjetas, enfoque Equilibrado | La tarjeta correcta, cada día |
| 2 | Inicio con el enfoque Puntos | Tú eliges: días, puntos o cashback |
| 3 | Tengo una compra, con un monto en dólares | Pregunta antes de comprar |
| 4 | Aviso "Vence antes de tu cobro" en Por pagar | Paga a tiempo, cobres cuando cobres |
| 5 | Registro de tarjeta (paso de fechas) | Registra una tarjeta en 30 segundos |
| 6 | Widget de Android (solo Google Play) | Tu tarjeta de hoy, sin abrir la app |
| 7 | Privacidad en Ajustes | Tus datos se quedan en tu teléfono |

Tamaños:

- **App Store:** iPhone de 6.9" (1320 × 2868). Apple escala las demás.
- **Google Play:** teléfono, de 2 a 8 capturas (por ejemplo, 1080 × 1920 del emulador Pixel 7), y la imagen destacada de 1024 × 500. El icono de 512 es `assets/iconos/play-store-512.png`.
