# Tino: progreso del MVP

Lista de seguimiento del MVP. Se marca cada casilla al terminar el trabajo y se actualiza en el mismo commit que lo completa.

- Etapas, historias y criterios salen de la sección 13 de `documentacion-tecnica.md` y de los criterios de aceptación de `especificacion.md` (14.1, 15.5, 16.6, 17.5 y 18.6).
- Las casillas marcadas **(asignada)** son funciones del MVP (sección 13.2 de la especificación o sección 6 de la documentación técnica) que la tabla de etapas no ubicaba. Se asignaron a la etapa donde encajan; se pueden mover.
- Una casilla se marca solo cuando está hecha y probada. Si falta verificarla en teléfono, queda sin marcar con una nota.

## Etapa 1. Base

Listo cuando: la app abre en iOS y Android con una pantalla vacía que respeta el tema y el país.

- [x] Proyecto Expo (SDK 57) con TypeScript y Expo Router
- [x] Perfiles de EAS: `development`, `preview` y `production`
- [x] Tokens, tema claro y oscuro con `useTema()` y componente `Texto`
- [x] Fuentes Bricolage Grotesque y Atkinson Hyperlegible Next incluidas en la app
- [x] Base local cifrada con SQLCipher; clave en Keychain o Keystore; se niega a abrir sin cifrado
- [x] Migraciones con versión de esquema, en transacción y sin pérdida de datos
- [x] Configuración por país con detección por región y modo sin catálogo
- [x] Textos con i18n y formato de montos y fechas del sistema
- [x] Iconos de tienda e icono adaptativo de Android en `app.config.ts`
- [x] Identificador de paquete `com.polanco.tino`
- [x] Feriados de RD de 2026
- [x] Verificado en Android: abre en el emulador Pixel 7 (API 35) con la base cifrada, el tema claro y oscuro y las tres pestañas
- [ ] Verificar en iOS (por TestFlight o compilación de desarrollo con EAS)

Criterios de la especificación:

- [x] 16.6: los textos de los tokens cumplen 4.5:1 en modo claro y oscuro (prueba automática). Se vuelve a revisar en la etapa 4 con las pantallas reales.
- [ ] 16.6: diseño idéntico en iOS y Android, en modo claro y oscuro. Verificado en Android; falta iOS.
- [ ] 18.6: cambiar el país cambia moneda, feriados, textos y funciones sin tocar el código. Probado en la configuración; falta el selector de país en Ajustes (etapa 4).

## Etapa 2. Motor

Listo cuando: `npm test` pasa todos los casos del motor.

- [x] `fechas.ts`: cortes (29–31 en meses cortos), próximo corte y corte anterior, fecha límite y ajuste de día no hábil
- [x] `recompensas.ts`: puntos por monto, por porcentaje y por transacción, y cashback
- [x] `ingresos.ts`: fechas de cobro entre hoy y la fecha de pago (3 frecuencias, igual que la referencia; ver decisión D6)
- [x] `ranking.ts`: exclusiones, penalizaciones, reparto de pesos, puntaje, semáforo y orden
- [x] `orden.ts`: barra de orden (Más días, Más puntos, Más cashback) sin cambiar el enfoque
- [x] Redondeo igual al de la referencia en Python
- [x] Los 17 casos de `motor.casos.json` pasan exactamente
- [x] Pruebas propias: meses de 28 a 31 días, año bisiesto, cambio de año, feriado junto a fin de semana
- [x] Prueba de que el motor no importa React ni Expo ni lee la hora del sistema
- [x] 200 casos aleatorios de la referencia (`generar_aleatorios.py`) que coinciden exactamente (decisión D10)

Criterios de la especificación:

- [x] 14.1: días de gracia correctos en meses de 28, 29, 30 y 31 días, y con fechas límite en fin de semana
- [x] 14.1: "1 punto por cada 100" y "2% en puntos" dan el valor por cada 1,000 esperado
- [x] 14.1: una tarjeta sin recompensa aparece en el ranking, puntuada solo por días
- [x] 14.1: una tarjeta en pausa no aparece en el ranking (en el widget se verifica en la etapa 6)

## Etapa 3. Registro de tarjetas

Listo cuando: se registran 3 tarjetas en menos de 2 minutos.

- [ ] Repositorios de tarjetas, ingresos y preferencias sobre la base cifrada
- [ ] Catálogo: copia incluida en la app, descarga desde el servidor cada 24 horas, validación por esquema y caché (sección 7.1 técnica) **(asignada)**
- [ ] Selector de banco y producto con "Otro" y "No sé el tipo"; modo sin catálogo fuera de RD
- [ ] Fechas de corte y límite, ajuste de día no hábil y compra en día de corte
- [ ] Moneda de facturación, reglas del doble balance y pregunta de pago en dólares (solo si el país lo activa)
- [ ] Recompensas: tipo, tasa y valor del punto (precargado en 1.00)
- [ ] Interruptor En pausa
- [ ] Onboarding: bienvenida, registro, pregunta de enfoque y cobros opcionales (13.1 de la especificación) **(asignada)**
- [ ] Validación: últimos 4 dígitos exactos y rechazo de 13 a 19 dígitos seguidos en cualquier campo **(asignada)**
- [ ] Bloqueo con biometría o PIN al abrir y al volver tras 1 minuto **(asignada)**
- [ ] Cubrir la pantalla al pasar a segundo plano **(asignada)**

Criterios de la especificación:

- [ ] 14.1: registrar con producto "Otro" o "No sé el tipo" no bloquea el registro y la tarjeta aparece en el ranking
- [ ] 14.1: ningún campo permite guardar un número de tarjeta completo
- [ ] 14.1: con solo banco, producto, corte y fecha límite, inicio muestra la tarjeta de hoy sin otra acción
- [ ] 14.1: doble balance muestra la etiqueta de ambas monedas (el recordatorio de dos pagos va en la etapa 5)
- [ ] 18.6: un usuario fuera de RD registra tarjetas en modo sin catálogo y ve el ranking completo
- [ ] 18.6: el doble balance solo aparece en países donde está activado

## Etapa 4. Pantalla de inicio

Listo cuando: la pantalla coincide con las maquetas y cambia con el enfoque.

- [ ] TarjetaDestacada, FilaTarjeta, Etiqueta, BarraOrden, SelectorEnfoque, Semaforo, Hoja y BotonPrimario
- [ ] Ranking con barra de orden y selector de enfoque
- [ ] Modo una tarjeta
- [ ] Detalle de tarjeta con semáforo del ciclo
- [ ] Consulta "Tengo una compra"
- [ ] Indicador de precisión (2.1 de la especificación) **(asignada)**
- [ ] Iconos de la barra de pestañas según las maquetas
- [ ] Selector de país en Ajustes **(asignada)**
- [ ] Exportar datos y borrarlo todo, incluida la clave de cifrado (sección 6 técnica) **(asignada)**

Criterios de la especificación:

- [ ] 14.1: Más días, Más puntos o Más cashback reordenan al instante sin cambiar el enfoque guardado
- [ ] 14.1: con una sola tarjeta se ven el semáforo y no la barra de orden
- [ ] 14.1: con 2 o más tarjetas, cambiar el enfoque lo guarda al instante y actualiza el ranking (el widget y las notificaciones se verifican en las etapas 5 y 6); con una tarjeta el selector no aparece
- [ ] 14.1: en una compra en dólares pagando con dólares, el doble balance queda por encima de una tarjeta equivalente solo en pesos, y la de solo uso local nunca aparece
- [ ] 16.6: la tarjeta de hoy aparece en menos de 2 segundos en un Android de gama media
- [ ] 16.6: reordenar y cambiar el enfoque se animan sin saltos
- [ ] 16.6: con el texto del sistema al máximo, ninguna fila se corta ni se superpone
- [ ] 16.6: un lector de pantalla anuncia el semáforo y las etiquetas en palabras
- [ ] 16.6: el oro solo se usa en recompensas y el coral solo en alertas

## Etapa 5. Ingresos y avisos

Listo cuando: las notificaciones llegan en las fechas correctas en pruebas con fechas simuladas.

- [ ] Completar `motor.py` con las 5 frecuencias, regenerar los casos y ajustar `ingresos.ts` (decisión D6)
- [ ] Registro de ingresos con las 5 frecuencias, incluida la personalizada con fechas estimadas
- [ ] Etiqueta y alerta "Vence antes de tu cobro"
- [ ] Notificaciones: cambio de tarjeta recomendada, fecha límite y resumen mensual de lo ganado
- [ ] Permiso de notificaciones al terminar el onboarding
- [ ] Sugerencias de datos contextuales (2.2 de la especificación)

Criterios de la especificación:

- [ ] 14.1: las 5 frecuencias generan las fechas de cobro correctas durante 12 meses, incluidos feriados
- [ ] 14.1: si la fecha límite cae antes del próximo cobro, aparece la etiqueta y se envía la alerta
- [ ] 14.1: una sugerencia descartada dos veces no reaparece en 60 días
- [ ] 14.1: el recordatorio de una tarjeta con doble balance menciona los dos pagos

## Etapa 6. Pro, analítica y lanzamiento

Listo cuando: la versión 1.0.0 está aprobada en App Store y Google Play.

- [ ] Elegir y documentar proveedores de suscripciones, analítica y reporte de fallos (sección 7.2 técnica)
- [ ] Tino Pro con prueba de 30 días y límite de 2 tarjetas en el plan gratis
- [ ] Módulo de analítica con la lista cerrada de eventos, identificador anónimo e interruptor en Ajustes
- [ ] Reporte de fallos sin datos de tarjetas
- [ ] Widget de Android
- [ ] Fichas de las tiendas, capturas y política de privacidad (Ley 172-13)
- [ ] Pruebas de flujos completos con Maestro
- [ ] Lista de verificación de la sección 11 técnica

Criterios de la especificación:

- [ ] 15.5: al intentar registrar la 3.ª tarjeta en el plan gratis aparece la oferta de Pro y las 2 existentes siguen funcionando
- [ ] 15.5: una tarjeta con doble balance cuenta como una sola para el límite
- [ ] 15.5: al vencer Pro no se borra ningún dato y el usuario elige qué 2 tarjetas quedan activas
- [ ] 15.5: ningún dato comercial entra al ranking y todo contenido patrocinado lleva su etiqueta
- [ ] 17.5: ningún evento contiene montos, números de tarjeta, alias ni fechas exactas de ingresos
- [ ] 17.5: desactivar la analítica detiene el envío de inmediato
- [ ] 17.5: el panel interno muestra ingreso recurrente, conversión, cancelación y retención por cohorte con máximo 24 horas de atraso
- [ ] 17.5: cada regla de decisión de la tabla 17.3 se puede evaluar en el panel
- [ ] 18.6: todos los eventos de analítica incluyen el país
- [ ] 14.1: una tarjeta en pausa no aparece en el widget

## Pendientes fuera del código

- [ ] Feriados de RD de 2027 en `src/paises/do.json`
- [ ] Productos de tarjeta y recompensas de los emisores del grupo 1 en `datos-publicos/emisores-do.json`
- [ ] Verificar los 7 emisores marcados "por verificar"
- [ ] Búsqueda de marcas de "Tino" (1.1 de la especificación)
- [ ] Variantes oscura y tintada del icono de iOS
- [ ] Cuentas de Apple Developer, Google Play Console y proyecto en Expo
- [ ] Qué ofrecer al usuario si la clave de cifrado no abre su base (por ejemplo, una base restaurada en otro teléfono). Hoy la app muestra un mensaje y no borra nada.
- [ ] Configurar lint (`npx expo lint`)
- [ ] Actualizar en claude.ai la documentación técnica (sección 5.7 y 11): mencionar `generar_aleatorios.py` y los casos aleatorios, y reexportarla a `docs/`
- [ ] Actualizar en claude.ai el ejemplo 7.4 de la especificación con los días reales (46, 35 y 50), como pide la nota de la sección 5.7 técnica

## Decisiones

| # | Fecha | Decisión | Por qué |
| --- | --- | --- | --- |
| D1 | 2026-09-25 | Expo SDK 57, con las rutas en `app/` en la raíz | Última versión estable; la estructura sigue la sección 3 técnica |
| D2 | 2026-09-25 | La app no corre en Expo Go; se prueba con compilación de desarrollo | SQLCipher necesita código nativo |
| D3 | 2026-09-25 | Clave de la base de 256 bits en formato crudo, solo en este teléfono y disponible tras el primer desbloqueo | Evita el costo de derivar la clave al abrir (meta de 2 segundos) y permite avisos en segundo plano |
| D4 | 2026-09-25 | Cada entidad se guarda como JSON en su propia tabla | El objeto de `tipos.ts` se guarda tal cual; las migraciones pueden transformarlo |
| D5 | 2026-09-25 | Identificador de paquete `com.polanco.tino` | Definido por el dueño del proyecto; no se puede cambiar tras publicar |
| D6 | 2026-09-25 | En la etapa 2, `ingresos.ts` reproduce la referencia, que solo calcula semanal, quincenal en días fijos y mensual en día fijo; lo que falta (cada 2 semanas, mensual el último día hábil y personalizada) se agrega en la etapa 5, primero en `motor.py` | El motor debe coincidir con la referencia; nadie puede registrar ingresos antes de la etapa 5 |
| D7 | 2026-09-25 | Los modos "Reducir deuda" y "Personalizado" hacen que el motor lance un error; la interfaz del MVP no los ofrece | Son de v2 y la referencia no tiene pesos para ellos |
| D8 | 2026-09-25 | El motor usa `pais.monedaSecundaria` donde la referencia escribe `'USD'` | Nada de RD va en el código; para RD el resultado es idéntico |
| D9 | 2026-09-25 | Las funciones marcadas **(asignada)** se ubicaron en las etapas 3 y 4 | La tabla de etapas no las asignaba |
| D10 | 2026-09-25 | Además de los 17 casos, el motor se compara con 200 casos aleatorios de la referencia (`motor.aleatorios.json`, semilla fija) | Los 17 casos documentan reglas; los aleatorios detectan diferencias de redondeo, meses cortos, feriados y cobros que nadie escribió a mano |
| D12 | 2026-09-25 | Toda transacción exclusiva usa `base.transaccion(...)`, que aplica la clave en la conexión de la transacción | expo-sqlite abre una conexión nueva para cada transacción exclusiva; sin la clave, SQLCipher responde "file is not a database" (encontrado al probar en el emulador) |
| D11 | 2026-09-25 | La barra de orden desempata manteniendo el orden recomendado | La sección 5.4 no define el desempate de la barra; así el resultado es estable y predecible |
