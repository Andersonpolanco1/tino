# App Store: textos para copiar

Todo lo que se escribe en App Store Connect para Tino 1.0.0, en el orden de la consola. Cada texto va en su propio bloque: en la vista previa de VS Code (Ctrl+Shift+V), el botón de copiar del bloque lo copia exacto, y el número entre paréntesis es su largo frente al límite de la consola. Las reglas y el plan de capturas están en [fichas.md](fichas.md); lo de Google Play, en [google-play.md](google-play.md).

## 1. Crear la app

Menú: Apps > + > Nueva app.

- Plataforma: iOS.
- Idioma principal: Español (México), el más cercano a RD que ofrece Apple.
- Bundle ID: `com.polanco.tino`. Aparece después de que EAS lo registre en la primera compilación de iOS, o se crea antes en developer.apple.com.
- Acceso de usuarios: Acceso completo.

**Nombre** (4 / 30)

```text
Tino
```

**SKU**

```text
tino-ios
```

## 2. Información de la app

Menú: la app > General > Información de la app.

**Subtítulo** (27 / 30)

```text
Qué tarjeta de crédito usar
```

- Categoría principal: Finanzas.
- Categoría secundaria: Utilidades.
- Derechos de contenido: No contiene contenido de terceros.
- Clasificación por edad: "Ninguno" en todo el cuestionario. Resultado esperado: 4+.

## 3. Precios y disponibilidad

- Precio: Gratis (USD 0).
- Disponibilidad: solo República Dominicana (D84).

## 4. Privacidad de la app

Menú: la app > Privacidad de la app.

**URL de la política de privacidad**

```text
https://polancolabs.com/apps/tino/privacidad
```

**Datos recopilados.** Ninguno se vincula a la identidad ni se usa para rastreo:

| Tipo de dato | Uso |
| --- | --- |
| Uso > Interacción con el producto | Analítica |
| Identificadores > ID de usuario | Analítica, funcionalidad de la app |
| Compras > Historial de compras | Funcionalidad de la app |
| Diagnóstico > Datos de fallos | Funcionalidad de la app |
| Diagnóstico > Datos de rendimiento | Funcionalidad de la app |

Los datos de tarjetas y cobros no se declaran: se quedan en el teléfono. No hace falta el aviso de App Tracking Transparency.

## 5. Versión 1.0.0

Menú: la app > iOS > 1.0 Preparar para el envío.

**Texto promocional** (147 / 170)

```text
Abre Tino y ve qué tarjeta de crédito te conviene hoy: más días para pagar, más puntos o más cashback. Tus datos se quedan cifrados en tu teléfono.
```

**Descripción** (1774 / 4000)

```text
¿Tienes dos o más tarjetas de crédito y nunca sabes cuál usar? Tino te lo dice cada día.

Registra tus tarjetas con su día de corte y su fecha límite de pago, y Tino calcula cuál te da más días para pagar sin intereses, cuál te da más puntos o más cashback. Al abrir la app ves la tarjeta que te conviene hoy, sin escribir nada.

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

**Palabras clave** (84 / 100)

```text
corte,fecha límite,puntos,cashback,millas,pago,quincena,recordatorio,crédito,dólares
```

Sin espacios después de las comas: Apple cuenta cada carácter.

**URL de soporte**

```text
https://polancolabs.com/apps/tino/soporte
```

**URL de marketing**

```text
https://polancolabs.com/apps/tino
```

**Copyright**

```text
2026 Anderson Polanco (Polanco Labs)
```

**Capturas:** iPhone de 6.9" (1320 × 2868); Apple escala las demás. Plan en [fichas.md](fichas.md).

## 6. Información para la revisión

- Inicio de sesión requerido: No.
- Contacto: tu nombre y teléfono, y el correo de abajo.

**Correo de contacto**

```text
polancolabsrd@gmail.com
```

**Notas** (509 / 4000)

```text
Tino no requiere cuenta ni inicio de sesión. Para ver el ranking de tarjetas, registre dos tarjetas de ejemplo con cualquier banco (por ejemplo, "Mi banco no está en la lista" y un nombre inventado), cualquier día de corte y de pago. Para ver la oferta de Tino Pro, intente registrar una tercera tarjeta desde la pestaña Tarjetas, o toque Tino Pro en Ajustes. Todos los datos se guardan solo en el teléfono. Tino no está afiliado a ningún banco; los logos solo identifican al emisor de la tarjeta del usuario.
```

## 7. Suscripciones

Menú: la app > Monetización > Suscripciones. Un grupo con tres productos, sin oferta de introducción (D58 y D60). Antes hace falta el acuerdo de apps de pago, con datos bancarios y fiscales (Empresa > Acuerdos, impuestos y banca).

**Nombre de referencia del grupo**

```text
Tino Pro
```

**Nombre visible del grupo (localización en español)**

```text
Tino Pro
```

### Tino Pro mensual

Duración: 1 mes. Precio: USD 2.49.

**Nombre de referencia** (16 / 64)

```text
Tino Pro mensual
```

**ID del producto**

```text
tino_pro_mensual
```

**Nombre visible** (16 / 35)

```text
Tino Pro mensual
```

**Descripción** (40 / 45)

```text
Todas tus tarjetas y respaldo automático
```

Información para la revisión: una captura del muro de pago (Ajustes > Tino Pro).

### Tino Pro anual

Duración: 1 año. Precio: USD 19.99.

**Nombre de referencia** (14 / 64)

```text
Tino Pro anual
```

**ID del producto**

```text
tino_pro_anual
```

**Nombre visible** (14 / 35)

```text
Tino Pro anual
```

**Descripción** (40 / 45)

```text
Todas tus tarjetas y respaldo automático
```

Información para la revisión: una captura del muro de pago (Ajustes > Tino Pro).

### Tino Pro anual de lanzamiento

Duración: 1 año. Precio: USD 14.99.

**Nombre de referencia** (29 / 64)

```text
Tino Pro anual de lanzamiento
```

**ID del producto**

```text
tino_pro_anual_lanzamiento
```

**Nombre visible** (29 / 35)

```text
Tino Pro anual de lanzamiento
```

**Descripción** (42 / 45)

```text
Precio especial para los primeros usuarios
```

Información para la revisión: una captura del muro de pago (Ajustes > Tino Pro).

### Términos de uso

**EULA (enlace al final de la descripción, o en el campo de EULA personalizado)**

```text
https://polancolabs.com/apps/tino/terminos
```

Apple exige un enlace a los términos en apps con suscripciones; la app ya lo muestra en el muro de pago.

