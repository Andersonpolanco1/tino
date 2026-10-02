# Google Play: textos para copiar

Todo lo que se escribe en Google Play Console para Tino 1.0.0, en el orden de la consola. Cada texto va en su propio bloque: en la vista previa de VS Code (Ctrl+Shift+V), el botón de copiar del bloque lo copia exacto, y el número entre paréntesis es su largo frente al límite de la consola. Las reglas y el plan de capturas están en [fichas.md](fichas.md); lo de App Store, en [app-store.md](app-store.md).

## 1. Crear la app

- Nombre: el de la ficha (sección 2).
- Idioma predeterminado: Español (Latinoamérica), es-419.
- App o juego: App.
- Gratis o de pago: Gratis.

## 2. Ficha de Play Store principal

Menú: Hacer crecer usuarios > Presencia en Play Store > Ficha de Play Store principal.

**Nombre de la app** (22 / 30)

```text
Tino: Qué tarjeta usar
```

**Descripción breve** (80 / 80)

```text
Descubre qué tarjeta de crédito usar hoy para tener más días, puntos o cashback.
```

**Descripción completa** (1828 / 4000)

```text
¿Tienes dos o más tarjetas de crédito y nunca sabes cuál usar? Tino te lo dice cada día.

Agrega tus tarjetas con un nombre que reconozcas, su día de corte y su fecha límite de pago (sin el número de la tarjeta), y Tino calcula cuál te da más días para pagar sin intereses, cuál te da más puntos o más cashback. Al abrir la app ves la tarjeta que te conviene hoy, sin escribir nada.

TU TARJETA DE HOY
• Cuántos días tienes para pagar lo que compres hoy y en qué fecha se paga.
• Un semáforo del ciclo: cuándo es buen momento para usar cada tarjeta y cuándo conviene esperar.
• Tú eliges qué te importa más: días para pagar, puntos, cashback o un equilibrio.
• "Tengo una compra": escribe el monto y el día, y te dice qué tarjeta usar, en pesos o en dólares.

PAGA A TIEMPO
• Avisos antes de cada fecha límite.
• Si registras tus días de cobro, te avisa cuando una tarjeta vence antes de que cobres.
• Tarjetas con balance en pesos y en dólares, con los dos pagos.
• Consejos para acomodar tus fechas de corte a tu quincena.

TUS DATOS SON TUYOS
• Todo se guarda cifrado solo en tu teléfono. No hace falta crear una cuenta.
• Nunca te pedimos el número de tu tarjeta, su vencimiento, el código de seguridad ni tus claves del banco.
• Respaldo con contraseña para cambiar de teléfono.
• Ningún banco puede pagar para que su tarjeta salga mejor en Tino.

WIDGET
• En Android, la tarjeta de hoy en tu pantalla de inicio.

GRATIS Y TINO PRO
Tino es gratis con hasta 2 tarjetas. Con Tino Pro registras todas tus tarjetas y activas el respaldo automático. Tino Pro se cobra por mes o por año en tu cuenta de la tienda y se renueva solo; lo cancelas cuando quieras desde la configuración de tu cuenta.

Tino es una herramienta informativa y no está afiliada a ningún banco. Confirma siempre tus fechas y montos con tu estado de cuenta.
```

**Gráficos**

| Recurso | Archivo |
| --- | --- |
| Icono (512 × 512) | `assets/iconos/play-store-512.png` |
| Imagen destacada (1024 × 500) | `assets/tienda/google-play-destacada.png` (la genera `python herramientas/iconos/generar_imagen_destacada.py`) |
| Capturas de teléfono (2 a 8) | Pendientes; plan en [fichas.md](fichas.md) |

## 3. Categoría y contacto

Menú: Hacer crecer usuarios > Presencia en Play Store > Configuración de la ficha de Play Store.

- Categoría: Finanzas.
- Etiquetas: las más cercanas a finanzas personales y presupuesto que ofrezca la consola.

**Correo electrónico**

```text
polancolabsrd@gmail.com
```

**Sitio web**

```text
https://polancolabs.com/apps/tino
```

## 4. Contenido de la app

Menú: Supervisar y mejorar > Política y programas > Contenido de la app.

**Política de privacidad (URL)**

```text
https://polancolabs.com/apps/tino/privacidad
```

**Detalles de acceso** (antes "Acceso a la app"): "Sí, alguna parte está restringida", porque Google cuenta las suscripciones como acceso restringido. Se escribe en inglés. Google exige marcar que los detalles dan acceso completo, incluido lo pagado, así que primero hay que subir la AAB como borrador, crear la suscripción y un código promocional personalizado de Tino Pro (Monetiza con Play > Promociones), y reemplazar `CODIGO` en el texto. Usuario y contraseña, vacíos.

**Nombre** (21 / 60)

```text
No login, free access
```

**Cualquier otra información necesaria para acceder** (427 / 500 con un código de 12 caracteres)

```text
No account or login: the app works on first open; data stays on the device. Free plan: all features with up to 2 cards. Add sample cards choosing "Mi banco no está en la lista", any name and dates. Tino Pro (subscription) unlocks more than 2 cards and automatic backup. To unlock it, redeem promo code CODIGO in Play Store > Payments & subscriptions > Redeem code, then open Tino > Ajustes > Tino Pro > Restaurar compras.
```

Con el código en el texto, se marca la casilla "proporcionan acceso completo… incluido el premium o pagado".

**Anuncios:** No, la app no contiene anuncios.

**Clasificación de contenido (IARC):**

- Correo: el de contacto.
- Categoría: Utilidades, productividad, comunicación u otras.
- Violencia, contenido sexual, lenguaje, sustancias, apuestas, compras de contenido aleatorio e interacción entre usuarios: No.
- Compras digitales: Sí.
- Resultado esperado: Para todos (3+).

**Público objetivo:** 18 años o más. La app no está dirigida a niños.

**Funciones financieras:** "Mi app no ofrece ninguna función financiera". La declaración pregunta qué servicios financieros presta la app (préstamos, pagos, inversión, seguros, crédito, criptomonedas), y Tino no presta ninguno. No marcar "Recompensas, puntos…" (es para apps que dan puntos), "Asesoramiento financiero" (asesores con licencia: pediría documentación) ni "Otro".

**Apps gubernamentales, de salud y de noticias:** No.

**Seguridad de los datos:**

- ¿Recopila o comparte datos? Sí, recopila. No comparte.
- ¿Los datos se cifran en tránsito? Sí.
- ¿Se puede pedir que se borren? Sí.

| Categoría > tipo | Recopilado | Compartido | ¿Opcional? | Para qué |
| --- | --- | --- | --- | --- |
| Actividad en la app > Interacciones con la app | Sí | No | Sí | Estadísticas |
| Información y rendimiento de la app > Registros de fallos | Sí | No | Sí | Estadísticas, funcionalidad de la app |
| Información y rendimiento de la app > Diagnóstico | Sí | No | Sí | Estadísticas |
| Identificadores de dispositivo u otros | Sí | No | No (el identificador anónimo de RevenueCat se envía siempre; el de PostHog, solo si el usuario acepta) | Funciones de la app, estadísticas |
| Información financiera > Historial de compras | Sí | No | No | Funciones de la app |

Ninguno se marca como "procesado de forma efímera". La columna "¿Opcional?" es la pregunta "obligatorio u opcional" de la consola. Los datos de tarjetas y cobros no se declaran: nunca salen del teléfono. PostHog, Sentry y RevenueCat procesan datos por encargo de Tino, y Google no los cuenta como "compartir".

**URL para pedir el borrado de datos (si la consola la pide)**

```text
https://polancolabs.com/apps/tino/privacidad
```

## 5. Países

En la pista de prueba cerrada (y luego en producción) > Países o regiones: solo República Dominicana (D84).

## 6. Suscripciones

Menú: Monetizar con Play > Productos > Suscripciones. Se habilita después de subir la primera AAB. Una sola suscripción con tres planes base, sin ofertas ni prueba gratis (D58 y D60). Los ID no se pueden cambiar ni reutilizar.

Icono del producto (opcional): `assets/tienda/tino-pro-512.png` (512 × 512, PNG de 32 bits).

**ID del producto**

```text
tino_pro
```

**Nombre** (8 / 55)

```text
Tino Pro
```

**Beneficio 1** (32 / 40)

```text
Todas tus tarjetas en el ranking
```

**Beneficio 2** (32 / 40)

```text
Respaldo automático de tus datos
```

| ID del plan base | Renovación | Período | Precio |
| --- | --- | --- | --- |
| `mensual` | Automática | 1 mes | USD 2.49 |
| `anual` | Automática | 1 año | USD 19.99 |
| `anual-lanzamiento` | Automática | 1 año | USD 14.99 |

**ID del plan base: mensual**

```text
mensual
```

**ID del plan base: anual**

```text
anual
```

**ID del plan base: anual-lanzamiento**

```text
anual-lanzamiento
```

Activa los tres planes base: en borrador, RevenueCat no los ve. Revisa que el precio en pesos quede redondo.

## 7. Versión de la prueba cerrada

**Nombre de la versión**

```text
1.0.0
```

**Notas de la versión** (434 / 500, sin contar las etiquetas)

```text
<es-419>
Primera versión de Tino:
• Tu tarjeta de hoy: cuál te da más días para pagar, puntos o cashback.
• Semáforo del ciclo: cuándo usar cada tarjeta y cuándo esperar.
• "Tengo una compra": elige monto, día y moneda, y te dice qué tarjeta usar.
• Avisos antes de cada fecha límite y si vence antes de tu cobro.
• Tarjetas con balance en pesos y en dólares.
• Widget con la tarjeta de hoy.
• Datos cifrados solo en tu teléfono, con respaldo.
</es-419>
```

La consola pide las notas dentro de la etiqueta del idioma, como arriba: se borra todo el campo (también el texto gris de ejemplo) y se pega el bloque. La primera versión presenta lo que trae la app; las siguientes, solo lo nuevo.
