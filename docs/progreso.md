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
- [x] 18.6: cambiar el país cambia moneda, feriados, textos y funciones sin tocar el código. Selector en la bienvenida y en Ajustes (decisión D21).

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

- [x] Repositorios de tarjetas, ingresos y preferencias sobre la base cifrada
- [x] Catálogo: copia incluida en la app, descarga desde el servidor cada 24 horas, validación por esquema y caché (sección 7.1 técnica) **(asignada)**
- [x] Selector de banco y producto con "Otro" y "No sé el tipo"; modo sin catálogo fuera de RD
- [x] Fechas de corte y límite, ajuste de día no hábil y compra en día de corte
- [x] Moneda de facturación, reglas del doble balance y pregunta de pago en dólares (solo si el país lo activa)
- [x] Recompensas: tipo, tasa y valor del punto (precargado en 1.00, con botón para confirmarlo sin reescribirlo)
- [x] Interruptor En pausa
- [x] Onboarding: bienvenida, registro y pregunta de enfoque (13.1 de la especificación) **(asignada)**; cobros y permiso de notificaciones en la etapa 5 (decisión D18)
- [x] Validación: últimos 4 dígitos exactos y rechazo de 13 a 19 dígitos seguidos en cualquier campo **(asignada)**
- ~~Bloqueo con biometría o PIN al abrir y al volver tras 1 minuto~~ Descartado (decisión D25)
- ~~Cubrir la pantalla al pasar a segundo plano~~ Descartado (decisión D25)
- [ ] **Verificar en teléfono:** registrar 3 tarjetas en menos de 2 minutos (condición de "listo" de la etapa)

Criterios de la especificación:

- [x] 14.1: registrar con producto "Otro" o "No sé el tipo" no bloquea el registro y la tarjeta aparece en el ranking
- [x] 14.1: ningún campo permite guardar un número de tarjeta completo
- [x] 18.6: un usuario fuera de RD registra tarjetas en modo sin catálogo y ve el ranking completo
- [x] 18.6: el doble balance solo aparece en países donde está activado

## Etapa 4. Pantalla de inicio

Listo cuando: la pantalla coincide con las maquetas y cambia con el enfoque.

- [x] TarjetaDestacada, FilaTarjeta, Etiqueta, ControlEnfoque, Semaforo, Hoja y BotonPrimario
- [x] Ranking con control de enfoque de un toque (D30)
- [x] Modo una tarjeta
- [x] Detalle de tarjeta con semáforo del ciclo
- [x] Consulta "Tengo una compra"
- [x] Indicador de precisión (2.1 de la especificación) **(asignada)**
- [x] Iconos de la barra de pestañas según las maquetas
- [ ] **Verificar en teléfono:** que la pantalla coincida con las maquetas en claro y oscuro (condición de "listo" de la etapa)
- [x] Selector de país en Ajustes **(asignada)**; se adelantó a la etapa 3 (decisión D21)
- [x] Exportar datos y borrarlo todo, incluida la clave de cifrado (sección 6 técnica) **(asignada)**

Criterios de la especificación:

- [x] 14.1: con solo banco, producto, corte y fecha límite, inicio muestra la tarjeta de hoy sin otra acción (decisión D19)
- [x] 14.1: tocar un modo del control de enfoque lo guarda y recalcula al instante (D30)
- [x] 14.1: con una sola tarjeta se ven el semáforo y no el control de enfoque
- [x] 14.1: con 2 o más tarjetas, cambiar el enfoque lo guarda al instante y actualiza el ranking (el widget y las notificaciones se verifican en las etapas 5 y 6); con una tarjeta el selector no aparece
- [x] 14.1: doble balance muestra la etiqueta de ambas monedas (el recordatorio de dos pagos va en la etapa 5)
- [x] 14.1: en una compra en dólares pagando con dólares, el doble balance queda por encima de una tarjeta equivalente solo en pesos, y la de solo uso local nunca aparece
- [ ] 16.6: la tarjeta de hoy aparece en menos de 2 segundos en un Android de gama media
- [ ] 16.6: reordenar y cambiar el enfoque se animan sin saltos
- [ ] 16.6: con el texto del sistema al máximo, ninguna fila se corta ni se superpone
- [x] 16.6: un lector de pantalla anuncia el semáforo y las etiquetas en palabras
- [x] 16.6: el oro solo se usa en recompensas y el coral solo en alertas

## Etapa 5. Ingresos y avisos

Listo cuando: las notificaciones llegan en las fechas correctas en pruebas con fechas simuladas.

- [x] Completar `motor.py` con las 5 frecuencias, regenerar los casos y ajustar `ingresos.ts` (decisión D6): 21 casos, 4 de cobros (D37)
- [x] Registro de ingresos con las 5 frecuencias, incluida la personalizada con fechas estimadas (Ajustes > Tus cobros)
- [x] Etiqueta y alerta "Vence antes de tu cobro": la etiqueta en la lista (motor) y el aviso en Por pagar y en el detalle, con la variante prudente para cobros estimados (5.2)
- [x] Notificaciones: cambio de tarjeta recomendada, fecha límite, vence antes del cobro y resumen mensual (D38, D41), programadas con `expo-notifications` desde `src/notificaciones/`; falta verlas llegar en un teléfono
- [x] Pasos de cobros y de permiso de notificaciones en el onboarding (decisión D18): cobros con "Omitir por ahora" y avisos con "Ahora no"
- [x] Sugerencias de datos contextuales (2.2 de la especificación): agregar cobros cuando un pago está cerca y confirmar el valor del punto, en una tarjeta discreta de Inicio (D42)

Criterios de la especificación:

- [x] 14.1: las 5 frecuencias generan las fechas de cobro correctas durante 12 meses, incluidos feriados (`src/motor/__tests__/ingresos.test.ts`)
- [x] 14.1: si la fecha límite cae antes del próximo cobro, aparece la etiqueta y se envía la alerta
- [x] 14.1: una sugerencia descartada dos veces no reaparece en 60 días (`src/sugerencias/__tests__/elegir.test.ts`)
- [x] 14.1: el recordatorio de una tarjeta con doble balance menciona los dos pagos (`src/notificaciones/__tests__/planificar.test.ts`)

## Etapa 6. Pro, analítica y lanzamiento

Listo cuando: la versión 1.0.0 está aprobada en App Store y Google Play.

- [ ] Elegir y documentar proveedores de suscripciones, analítica y reporte de fallos (sección 7.2 técnica)
- [ ] Tino Pro con prueba de 30 días y límite de 2 tarjetas en el plan gratis
- [ ] Módulo de analítica con la lista cerrada de eventos, identificador anónimo e interruptor en Ajustes
- [ ] Registro anónimo de cada elección de "Otro" o de banco sin catálogo (4.1 de la especificación)
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
- [x] Productos del grupo 1 verificados en los sitios oficiales: 172 productos de 17 emisores (catálogo 2026.09.3, fuentes en `datos-publicos/verificacion-emisores-do.md`)
- [ ] Vimenca: confirmar qué tarjetas del portafolio anterior siguen vigentes (hoy solo Clásica, Gold e Infinite)
- [ ] Banco Caribe: confirmar Visa Elite Infinite (solo aparece en una nota de prensa)
- [ ] Confirmar la marca de los productos con marca `otra`: Preserva (Banreservas) y Clásica Internacional, Gold, ConfiaMás, Confía en Ti y Confiador (La Nacional)
- [ ] Confirmar la moneda de facturación de los productos que no la declaran; hoy la tienen los que el emisor publica como doble saldo, solo pesos o local
- [ ] Revisar el catálogo cada trimestre y con cada listado nuevo de la Superintendencia de Bancos
- [ ] Verificar los emisores que siguen "por verificar": Alaver, Banfondesa, Motor Crédito, Adopem y Citibank en el grupo 1, y los del grupo 2
- [ ] Búsqueda de marcas de "Tino" (1.1 de la especificación)
- [ ] Variantes oscura y tintada del icono de iOS
- [ ] Cuentas de Apple Developer, Google Play Console y proyecto en Expo
- [ ] Qué ofrecer al usuario si la clave de cifrado no abre su base (por ejemplo, una base restaurada en otro teléfono). Hoy la app muestra un mensaje y no borra nada.
- [ ] Configurar lint (`npx expo lint`)
- [ ] Confirmar la regla de fecha límite en día no laborable (¿se paga el siguiente día hábil sin cargo?). No aparece en el reglamento de la Superintendencia ni en los contratos de Promerica y Banesco; si se confirma, el valor por defecto pasa a "atrasar" y la pregunta se puede quitar
- [ ] Actualizar en claude.ai la especificación (12.2) y la documentación técnica (sección 6): sin bloqueo propio ni cobertura en segundo plano (decisión D25)
- [ ] Publicar el servidor de datos públicos (sección 7.1 técnica) y poner su dirección en `EXPO_PUBLIC_URL_DATOS_PUBLICOS` (secreto de EAS); mientras tanto la app usa la copia incluida
- [ ] Descargar también la configuración del país (`/v1/paises/xx.json`) igual que el catálogo; hoy se usa la copia incluida en `src/paises/`
- [ ] Actualizar en claude.ai la documentación técnica (sección 5.7 y 11): mencionar `generar_aleatorios.py` y los casos aleatorios, y reexportarla a `docs/`
- [ ] Verificar en un teléfono que los avisos llegan a las 9:00 en las fechas planificadas (etapa 5)
- [ ] Actualizar en claude.ai el ejemplo 7.4 de la especificación con los días reales (46, 35 y 50), como pide la nota de la sección 5.7 técnica
- [ ] Logos de los bancos en lugar de las iniciales: pospuesto hasta revisar el uso de las marcas (reglas de marca de cada banco y revisión de Apple). Plan listo: `assets/bancos/<id>.png` de 96 × 96 tomados del ícono para celulares de la web oficial, un mapa en `src/catalogo/logos.ts` y `ChipBanco` con las iniciales como respaldo

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
| D13 | 2026-09-25 | `ProductoTarjeta.monedaFacturacion` es opcional; si falta, el registro se la pregunta al usuario | La investigación del catálogo casi nunca la da, e inventarla penalizaría tarjetas sin razón en compras en dólares |
| D14 | 2026-09-25 | El catálogo trae solo nombre y marca, sin recompensas precargadas; las tasas por categoría (PREMIA, Insignia, ConnectMiles, etc.) quedan para v2 | El MVP solo maneja una tasa base; cargar una tasa de categoría como base distorsiona el ranking |
| D15 | 2026-09-25 | Cada variante comercial es un producto propio; el doble saldo es atributo, no producto; fuera del catálogo las líneas de crédito y las tarjetas de empresa | Las variantes cambian beneficios; el MVP es para personas |
| D16 | 2026-09-25 | El catálogo solo incluye productos que el emisor publica hoy, con su fuente registrada en `verificacion-emisores-do.md`; fuera las tarjetas de flotilla o combustible | La investigación preliminar tenía productos descontinuados y nombres equivocados; una tarjeta que solo sirve en gasolineras no debe competir en el ranking general |
| D17 | 2026-09-25 | ~~El bloqueo usa la biometría o el PIN del propio teléfono~~ Reemplazada por D25 | — |
| D18 | 2026-09-25 | Los pasos de cobros y de permiso de notificaciones del onboarding se hacen en la etapa 5 | Es donde se construyen los ingresos y los avisos |
| D19 | 2026-09-25 | La tarjeta de hoy en Inicio se construye en la etapa 4; en la etapa 3 la pestaña Tarjetas muestra lo registrado | La etapa 4 es la de la pantalla de inicio y sus componentes |
| D20 | 2026-09-25 | Si el banco no indica sus reglas, el registro precarga "adelantar" (fecha límite en día no hábil) y "entra en ese corte" (compra el día del corte); el usuario puede cambiarlas | Son los valores prudentes: la app calcula menos días de gracia en vez de más, y nadie paga tarde por culpa de Tino |
| D21 | 2026-09-25 | El país se confirma en la bienvenida ("¿Dónde vives?") y se guarda en las preferencias; la región del teléfono solo lo preselecciona. El selector de Ajustes se adelanta a la etapa 3 | Muchos dominicanos tienen el teléfono en inglés o con región de EE. UU.; detectar solo por región los dejaba sin catálogo |
| D22 | 2026-09-25 | La compra el día del corte ya no se pregunta: entra en ese corte. La moneda se pregunta como "¿Tu estado de cuenta trae un balance en dólares aparte?" (Sí/No); solo dólares y solo uso local pasan a "Más opciones"; sin doble balance en el país no se pregunta | Es el estándar en RD según la ABA; la pregunta de moneda no se entendía y se buscó reducir el registro |
| D23 | 2026-09-25 | Una tarjeta tiene un solo tipo de recompensa base (puntos o cashback) en el MVP; las combinaciones (cashback por categoría más puntos base, como BHD PREMIA) se modelan con las recompensas avanzadas de v2 | No se encontró una tarjeta de RD con puntos y cashback generales a la vez; soportarlo cambia tipos, motor y casos de referencia |
| D24 | 2026-09-25 | Agregar tarjeta es un asistente de un paso por pantalla (banco, tipo, tu tarjeta, dólares, fechas, recompensa) con "Paso X de N"; editar es una lista de secciones con resumen que se abren y guardan por separado. Las explicaciones van detrás de un ícono ⓘ en vez de estar siempre a la vista | Una sola pantalla con todo junto mareaba; cada opción debe poder explicarse sin llenar la pantalla de texto |
| D25 | 2026-09-25 | Tino no tiene bloqueo propio ni cubre la pantalla en segundo plano; se quitó `expo-local-authentication` | No guarda datos que permitan robar o suplantar (sin números, montos ni claves); la base ya está cifrada y iOS y Android permiten bloquear apps específicas a quien lo quiera. Se reconsidera cuando lleguen balances y montos (v2) |
| D26 | 2026-09-25 | Precisión por tarjeta: datos esenciales 40%, valor del punto confirmado 25% (completo si no da puntos), fechas de cobro registradas 25%, producto identificado 10% (completo si el país no tiene catálogo). En Ajustes, el promedio de las tarjetas. El balance se sumará en v2 | La sección 2.1 da el criterio (más peso a valor del punto, cobros y balance) pero no los números |
| D27 | 2026-09-25 | "Tengo una compra" pide monto y moneda; la categoría llega con las recompensas avanzadas en v2 | La categoría solo sirve con multiplicadores por categoría (decisión D23) |
| D28 | 2026-09-25 | El botón "La usé" queda para v2 | Así lo ubica la hoja de ruta de la especificación (sección 14) |
| D29 | 2026-09-25 | Se aplica el rediseño aprobado (maquetas en claude.ai): barra de pestañas flotante, listas agrupadas, control segmentado para el orden, íconos de trazo propios, cuadrícula de días para el corte y contador para la fecha límite, que se precarga 20 días después del corte. Los tokens suman los roles `divisor`, `segmentoFondo`, `segmentoActivo`, `perilla`, `pistaApagada`, `recompensaPunto`, `velo` y sombras por modo | Las pantallas parecían una web antigua; la cuadrícula y el contador evitan escribir números y 20 días es el plazo más común en RD |
| D30 | 2026-09-25 | En inicio, la barra de orden temporal y el selector de enfoque con hoja se unen en un solo control segmentado de enfoque (Equilibrado · Días · Puntos · Cashback) que guarda al tocar. La tarjeta destacada dice por qué ganó según el enfoque y un ícono ⓘ lo explica. Se quita el evento `orden_cambiado`; `ordenarRanking` queda en el motor sin usarse en pantalla. La especificación (secciones 3.1, 3.5, 7.4, 14.1 y 17) y la documentación técnica se corrigieron | Dos controles con las mismas palabras confundían; el orden por un solo dato ignoraba las penalizaciones y se perdía al salir |
| D31 | 2026-09-25 | El valor del punto se confirma en un toque: "Este valor es correcto" en el registro, y en el detalle de la tarjeta una tarjeta "¿1 punto vale RD$1?" con "Sí, es correcto" o "Cambiar el valor" (abre directo la recompensa). Ajustes lista las tarjetas por confirmar y explica qué falta para subir la precisión | Antes solo se confirmaba reescribiendo el campo, y el aviso de precisión no decía dónde hacerlo |
| D32 | 2026-09-26 | "Tengo una compra" no es una pestaña: es un botón con texto e ícono de carrito junto a la fecha de Inicio, y abre la consulta desde abajo con el teclado de números listo | Es una acción rápida, no un lugar; como pestaña quedaría abierta con un monto viejo y achicaría las demás. El círculo con una bolsa no se entendía |
| D33 | 2026-09-26 | Orden de Inicio: enfoque ("Tu enfoque" con ⓘ), tarjeta de hoy, "Otras opciones" y "Por pagar" con "Vence el … · en N días" (en coral si faltan 3 días o menos) | El enfoque cambia la tarjeta de hoy, así que va antes; la lista no incluye la destacada; el pago pendiente se confundía con la fecha de pago de una compra de hoy |
| D34 | 2026-09-26 | La tarjeta de hoy y el detalle comparten piezas (`BloqueDias`, `LineaCiclo` y el semáforo al pie) con fondos distintos: verde solo para la recomendada, blanco en el detalle. La línea del ciclo usa meses cortos ("8 sept."). Bajo el nombre no se repite el banco si el alias ya lo trae | Quien aprende a leer una tarjeta lee la otra; pintar de verde una tarjeta en "Espera" diría que conviene usarla |
| D35 | 2026-09-26 | La línea del ciclo es la misma en la tarjeta de hoy y en el detalle: Cortó, Hoy, Corta y Pagas, cada punto encima de su etiqueta y el relleno hasta "Hoy". En el detalle, el semáforo va arriba a la derecha de "Si la usas hoy" | Con la línea proporcional el relleno no llegaba a la etiqueta "Hoy" y parecía un error; el orden de los hitos nunca cambia, así que las posiciones fijas no engañan |
| D36 | 2026-09-26 | La fecha límite "un día del mes" se elige en la misma cuadrícula de días que el corte; el contador queda solo para "días después del corte" | Con + y − llegar del 1 al 30 era incómodo; los días después casi siempre están cerca de los 20 precargados |
| D37 | 2026-09-26 | Las 5 frecuencias de cobro en `motor.py` y `ingresos.ts`. Cada 2 semanas cobra el día de la semana cada 14 días desde la referencia; "último día hábil" ya es hábil y no se ajusta; la personalizada ajusta cada fecha y guarda si es estimada. Los cobros se buscan también 7 días a cada lado de la ventana, para contar el que el ajuste mete en ella (un sábado adelantado al viernes) y no contar el que saca | La referencia revisaba solo los días de la ventana antes de ajustar, y dejaba fuera un cobro adelantado al mismo día del pago; los 17 casos anteriores no cambian |
| D38 | 2026-09-26 | El resumen mensual del MVP cuenta lo que Tino sabe sin compras registradas: cuántas tarjetas distintas recomendó y hasta cuántos días para pagar dio la tarjeta de cada día. Lo ganado en puntos y cashback llega con "La usé" (v2) | La especificación (sección 11) pide días aprovechados y lo ganado, pero sin compras registradas no se puede calcular |
| D39 | 2026-09-26 | Sin la "ventaja" a las tarjetas que se pagan pocos días después de un cobro (sección 5.3 de la especificación); el MVP solo tiene la penalización de "vence antes del cobro" | La documentación técnica (5.3) y los casos de referencia no la definen; agregarla cambia las reglas del motor. Se reconsidera con los montos (nivel 3) |
| D40 | 2026-09-26 | Registro de cobros en 3 pasos (frecuencia, días y nombre) con vista previa de los próximos 3 cobros. Quincenal viene con 15 y 30; en cada 2 semanas se elige cuál de los dos últimos días de esa semana fue de cobro, en vez de pedir una fecha; las fechas variables se agregan con mes y día tocables y la marca "estimada". Si el cobro cae en día no hábil, viene "se adelanta". El onboarding pasa a bienvenida, tarjetas, enfoque y cobros. El modo Liquidez se llama "Días" en toda la app | Mismo patrón que el registro de tarjetas y sin teclados de fecha; en inicio el control decía "Días" y Ajustes "Liquidez" |
| D41 | 2026-09-26 | Avisos locales: se planifican 60 días hacia adelante (máximo 60, por el límite de 64 de iOS) a las 9:00, y se reprograman al cambiar tarjetas, cobros, preferencias o el día. El de cambio de tarjeta sale el día en que de verdad cambia la mejor, no "el día después de cada corte". Cada aviso tiene su interruptor en Ajustes (`Preferencias.avisos`, opcional para no migrar); el permiso se pide en el último paso del onboarding | Con las reglas del motor la mejor tarjeta cambia el mismo día del corte (la compra entra en el estado siguiente) o 3 días antes (corta pronto), así que "el día después" llegaba tarde o no llegaba |
| D42 | 2026-09-26 | Las sugerencias de datos se muestran solo dentro de la app, en una tarjeta discreta al final de Inicio; la notificación de sugerencia de la sección 11 queda fuera del MVP. Su historial vive en una tabla nueva (`sugerencias`, migración 2). Semana a semana se muestra una sola; descartada, no aparece otra hasta la semana siguiente | Los avisos ya son cuatro y una sugerencia como notificación se siente insistente; en Inicio aparece justo cuando el usuario está mirando sus tarjetas |
| D43 | 2026-09-26 | La tarjeta de hoy queda en cuatro capas: nombre, días, línea del ciclo (Hoy, Corta y Pagas; el corte anterior sin rótulo) y recompensa. Se quitan la línea del motivo del enfoque y "Se paga el…" bajo el número; el semáforo aparece solo si no está en verde y los últimos 4 solo si hay otra tarjeta del mismo banco. La ⓘ del enfoque pasa al final de su control. Todo sigue en el detalle y en lo que anuncia el lector de pantalla | La pantalla de inicio se sentía cargada: había datos repetidos (fecha de pago dos veces, motivo y enfoque) y otros que no ayudan a decidir |
| D44 | 2026-09-26 | "Por pagar" en Inicio solo aparece con pagos sin marcar que vencen en 7 días o menos, o antes del próximo cobro; si no hay, la sección no se muestra. La pestaña Tarjetas tiene "Próximos pagos" con todos, siempre visible | Inicio responde qué tarjeta usar hoy; un pago a 20 días era ruido diario y los avisos ya lo recuerdan |
| D45 | 2026-09-26 | "Ya pagué" mínimo en el MVP: marca como pagado el estado pendiente (campo opcional `Tarjeta.pagoHecho` con su fecha límite, sin montos; el motor no lo usa), lo saca de Inicio, cancela sus avisos de ese ciclo y se puede deshacer. Con el siguiente estado vuelve solo. La confirmación de pago con montos sigue en v2 | Sin marcarlo, Tino seguía avisando de pagos ya hechos, justo en los días en que "Por pagar" aparece |
| D46 | 2026-09-26 | El título de Inicio pasa de "Tu tarjeta de hoy" a "Hoy te conviene usar" | Se lee de corrido con el nombre de la tarjeta verde y dice que es una recomendación, no solo un rótulo; con una tarjeta sigue "¿Es buen momento?" |
| D47 | 2026-09-26 | En Inicio, el control de enfoque pasa arriba del título: fecha y "Tengo una compra", enfoque, "Hoy te conviene usar" y la tarjeta verde | El título se lee de corrido con el nombre de la tarjeta y el control lo cortaba; sigue antes de la tarjeta que cambia (D33) |
| D48 | 2026-09-26 | El enfoque en Inicio pasa de un control segmentado a una línea bajo el título, "Priorizando días para pagar ▾" (o puntos, cashback, "Buscando un equilibrio"), con su ⓘ al lado; al tocarla se abre la hoja con los 4 enfoques y su explicación. Ajusta D30 y D47 | El enfoque se elige en el onboarding y casi no se cambia; la fila de botones ocupaba espacio a diario. La confusión que motivó D30 venía de la barra de orden, que ya no existe, y la línea completa la frase "Hoy te conviene usar" |
| D49 | 2026-09-26 | La tarjeta de hoy no imita una tarjeta de crédito real (chip, número enmascarado, proporción fija) | No aporta información para decidir, quitaría espacio a la línea del ciclo y podría sugerir que Tino guarda la tarjeta. Se reconsidera solo si en pruebas con usuarios la tarjeta verde no se entiende como "la que debo usar" |
| D11 | 2026-09-25 | (Sin uso en pantalla desde D30.) La barra de orden desempata manteniendo el orden recomendado | La sección 5.4 no define el desempate de la barra; así el resultado es estable y predecible |
