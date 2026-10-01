# Fichas de tienda de Tino 1.0.0

Textos y respuestas para App Store Connect y Google Play Console. Base: sección 1.1 de la especificación (nombre, subtítulo, descripción corta y palabras clave), 15.2 (planes) y las decisiones D58, D60, D63 y D84 de `docs/progreso.md`.

Reglas para todas las fichas:

- Sin nombres ni logos de bancos reales en textos, palabras clave ni capturas (1.1 y D63).
- Sin prometer ahorros exactos ni resultados financieros garantizados.
- Solo República Dominicana y solo español en el lanzamiento (D84).

## Dónde está cada texto

Los textos para copiar y pegar viven en un documento por tienda, en el orden de cada consola y con cada texto en su propio bloque:

- [google-play.md](google-play.md): Google Play Console (ficha, contenido de la app, seguridad de los datos, suscripciones y notas de la versión).
- [app-store.md](app-store.md): App Store Connect (información de la app, privacidad, versión, notas para la revisión y suscripciones).

La descripción completa es la misma en las dos tiendas: si cambia, se cambia en los dos documentos.

## Capturas

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
