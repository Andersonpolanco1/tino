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

**Descripción completa** (1774 / 4000)

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

**Acceso a la app:** "Todas las funciones están disponibles sin restricciones de acceso". Tino no tiene inicio de sesión.

**Anuncios:** No, la app no contiene anuncios.

**Clasificación de contenido (IARC):**

- Correo: el de contacto.
- Categoría: Utilidades, productividad, comunicación u otras.
- Violencia, contenido sexual, lenguaje, sustancias, apuestas, compras de contenido aleatorio e interacción entre usuarios: No.
- Compras digitales: Sí.
- Resultado esperado: Para todos (3+).

**Público objetivo:** 18 años o más. La app no está dirigida a niños.

**Funciones financieras:** Tino no ofrece préstamos, pagos, inversiones, criptomonedas ni banca. Elige "Mi app no ofrece ninguna de estas funciones" o la de gestión de finanzas personales, según lo que muestre la consola.

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
| Identificadores de dispositivo u otros | Sí | No | Sí | Estadísticas |
| Información financiera > Historial de compras | Sí | No | No | Funcionalidad de la app |

Ninguno se marca como "procesado de forma efímera". Los datos de tarjetas y cobros no se declaran: nunca salen del teléfono. PostHog, Sentry y RevenueCat procesan datos por encargo de Tino, y Google no los cuenta como "compartir".

**URL para pedir el borrado de datos (si la consola la pide)**

```text
https://polancolabs.com/apps/tino/privacidad
```

## 5. Países

En la pista de prueba cerrada (y luego en producción) > Países o regiones: solo República Dominicana (D84).

## 6. Suscripciones

Menú: Monetizar con Play > Productos > Suscripciones. Se habilita después de subir la primera AAB. Una sola suscripción con tres planes base, sin ofertas ni prueba gratis (D58 y D60). Los ID no se pueden cambiar ni reutilizar.

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

**Notas de la versión**

```text
<es-419>
Primera versión de Tino. ¡Gracias por probarla!
</es-419>
```

La consola pide las notas dentro de la etiqueta del idioma, como arriba.

