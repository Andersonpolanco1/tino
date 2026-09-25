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

- Etapa actual: **1. Base** (sección 13 de la documentación técnica). El repositorio aún no tiene el proyecto de Expo.
- Ya existen: tipos, casos de prueba del motor, motor de referencia en Python, tokens de diseño, textos iniciales, configuración de RD, catálogo de emisores e iconos.
- Pendiente de datos: feriados de RD en `src/paises/do.json` y productos de tarjeta en `datos-publicos/emisores-do.json`.

Actualiza esta sección al terminar cada etapa.

## Cómo trabajar

- Trabaja una etapa a la vez, en el orden de la sección 13. Al empezar una etapa, lee sus historias y los criterios de la especificación que cita.
- Antes de escribir código de una etapa, propón un plan breve (archivos a crear o cambiar, dependencias a instalar) y espera confirmación.
- Termina cada etapa con las pruebas pasando y una lista de lo que quedó hecho y lo pendiente.
- Haz commits pequeños con mensajes en español que digan qué cambió y por qué.

## Reglas que no se rompen

- **Motor:** es TypeScript puro en `src/motor/`, sin importar React ni Expo, y recibe la fecha de hoy como parámetro. Nunca cambies sus reglas sin actualizar primero `herramientas/motor-referencia/motor.py`, regenerar los casos con `python3 generar_casos.py` y después ajustar el código.
- **Privacidad:** nunca pidas ni guardes el número completo de tarjeta, la fecha de vencimiento, el CVV ni credenciales bancarias. Los datos financieros viven solo en la base local cifrada.
- **Analítica:** solo los eventos y propiedades de la sección 10 de la documentación técnica, desde `src/analitica/`. Nunca montos, alias ni números.
- **Diseño:** ningún color ni tamaño escrito en las pantallas; todo sale de `src/diseno/tokens.json` mediante `useTema()`. Contraste mínimo 4.5:1 y áreas de toque de 44 puntos.
- **Textos:** ningún texto visible escrito en el código; todo sale de `src/i18n/`. Español dominicano claro.
- **País:** nada específico de RD escrito en el código; sale de `src/paises/`.
- **Alcance:** construye solo el MVP. Las promociones, balances, salud financiera y demás funciones de v2 y v3 no se implementan aunque aparezcan en la especificación, salvo que se pida.
- **Imparcialidad:** ningún dato comercial entra al cálculo del ranking.
- **Secretos:** claves de servicios en variables de entorno o secretos de EAS, nunca en el repositorio.

## Comandos

Se completan cuando exista el proyecto de Expo (etapa 1):

- Instalar dependencias: `npm install`
- Iniciar en desarrollo: `npx expo start`
- Pruebas: `npm test`
- Regenerar casos del motor: `cd herramientas/motor-referencia && python3 generar_casos.py`
