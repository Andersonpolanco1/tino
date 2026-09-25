# Tino

App móvil que le dice al usuario qué tarjeta de crédito usar hoy, según sus fechas de corte y pago, sus recompensas y el enfoque que elija. Mercado inicial: República Dominicana. Stack: React Native con Expo y TypeScript. Nombre de la app y del plan pago: Tino y Tino Pro.

## Fuentes de verdad

1. `docs/especificacion.md`: qué hace la app (producto). Si algo se contradice, manda este documento.
2. `docs/documentacion-tecnica.md`: cómo se construye (arquitectura, modelo de datos, motor, pruebas, publicación, plan por etapas). Se importa completo abajo.
3. `src/tipos/tipos.ts`: modelo de datos. Úsalo tal cual; si necesitas cambiarlo, explica por qué antes de hacerlo.
4. `src/motor/__tests__/motor.casos.json`: resultados esperados del motor. La implementación debe reproducirlos exactamente.
5. `docs/maquetas/`: referencia visual de la pantalla de inicio en modo claro y oscuro (HTML estático).

Los enlaces a claude.ai dentro de los documentos no son accesibles desde aquí; las copias en `docs/` son las vigentes.

@docs/documentacion-tecnica.md

## Estado actual

- Etapa actual: **4. Pantalla de inicio** (sección 13 de la documentación técnica). Las etapas 2 (motor) y 3 (registro de tarjetas) están terminadas en código; la 3 falta verificarla en teléfono con una compilación nueva.
- El seguimiento detallado está en `docs/progreso.md`: casillas por etapa, criterios de aceptación, pendientes fuera del código y decisiones tomadas. Es la lista que se va tachando.
- Etapa 1 verificada en Android (emulador `TantyPhone`, perfil Pixel 7); falta iOS.

## Cómo trabajar

- Trabaja una etapa a la vez, en el orden de la sección 13. Al empezar una etapa, lee sus historias y los criterios de la especificación que cita.
- Antes de escribir código de una etapa, propón un plan breve (archivos a crear o cambiar, dependencias a instalar) y espera confirmación.
- Termina cada etapa con las pruebas pasando y una lista de lo que quedó hecho y lo pendiente.
- Marca en `docs/progreso.md` cada casilla en el mismo commit que la completa. Toda decisión que se aparte de los documentos o complete un vacío va a su tabla de decisiones, y todo lo que quede pendiente va a su lista; nada pendiente vive solo en la conversación.
- Haz commits pequeños con mensajes en español que digan qué cambió y por qué.

## Reglas que no se rompen

- **Motor:** es TypeScript puro en `src/motor/`, sin importar React ni Expo, y recibe la fecha de hoy como parámetro. Nunca cambies sus reglas sin actualizar primero `herramientas/motor-referencia/motor.py`, regenerar los casos con `python3 generar_casos.py` y `python3 generar_aleatorios.py`, y después ajustar el código.
- **Privacidad:** nunca pidas ni guardes el número completo de tarjeta, la fecha de vencimiento, el CVV ni credenciales bancarias. Los datos financieros viven solo en la base local cifrada.
- **Analítica:** solo los eventos y propiedades de la sección 10 de la documentación técnica, desde `src/analitica/`. Nunca montos, alias ni números.
- **Diseño:** ningún color ni tamaño escrito en las pantallas; todo sale de `src/diseno/tokens.json` mediante `useTema()`. Contraste mínimo 4.5:1 y áreas de toque de 44 puntos.
- **Textos:** ningún texto visible escrito en el código; todo sale de `src/i18n/`. Español dominicano claro.
- **País:** nada específico de RD escrito en el código; sale de `src/paises/`.
- **Alcance:** construye solo el MVP. Las promociones, balances, salud financiera y demás funciones de v2 y v3 no se implementan aunque aparezcan en la especificación, salvo que se pida.
- **Imparcialidad:** ningún dato comercial entra al cálculo del ranking.
- **Secretos:** claves de servicios en variables de entorno o secretos de EAS, nunca en el repositorio.

## Comandos

- Instalar dependencias: `npm install`. Para agregar paquetes usa `npx expo install <paquete>`, que elige versiones compatibles con el SDK.
- Iniciar en desarrollo: `npx expo start` (requiere la compilación de desarrollo instalada; no sirve Expo Go)
- Compilar y abrir en Android local: `npx expo run:android --device TantyPhone` (emulador Pixel 7). Para solo servir el código a la app ya instalada: `npx expo start --dev-client`
- Pruebas: `npm test`
- Tipos: `npm run typecheck`
- Diagnóstico de dependencias: `npx expo-doctor`
- Regenerar casos del motor: `cd herramientas/motor-referencia && python3 generar_casos.py && python3 generar_aleatorios.py` (en Windows, `python`)

Variables de entorno: `EXPO_PUBLIC_URL_DATOS_PUBLICOS` es la dirección del servidor de datos públicos (catálogo); vacía, la app usa solo la copia incluida.

Notas del entorno: TypeScript 6 no carga tipos globales solos (están en `types` de `tsconfig.json`); RNTL 14 tiene `render` y `renderHook` asíncronos; `Tabs` se importa de `expo-router/js-tabs`. Las pruebas no pueden vivir dentro de `app/` porque Expo Router las trataría como rutas. Las transacciones exclusivas de expo-sqlite abren otra conexión: usa siempre `base.transaccion(...)` de `src/datos`, que le aplica la clave.
