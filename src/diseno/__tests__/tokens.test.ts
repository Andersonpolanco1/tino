import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import tokens from '../tokens.json';
import { razonContraste } from '../contraste';
import { temas, type RolColor, type VarianteTexto } from '../tema';

// Pares texto/fondo que usan las pantallas. Cada texto debe alcanzar 4.5:1 (sección 16.6).
const paresDeTexto: [RolColor, RolColor][] = [
  ['texto', 'fondo'],
  ['texto', 'superficie'],
  ['texto', 'neutroFondo'],
  ['textoSecundario', 'fondo'],
  ['textoSecundario', 'superficie'],
  ['textoSecundario', 'neutroFondo'],
  ['primario', 'fondo'],
  ['primario', 'superficie'],
  ['sobrePrimario', 'primario'],
  ['sobreDestacado', 'destacado'],
  ['recompensaTexto', 'recompensaFondo'],
  ['recompensaTexto', 'superficie'],
  ['alertaTexto', 'alertaFondo'],
  ['alertaTexto', 'superficie'],
  ['semaforoVerde', 'superficie'],
  ['semaforoAmarillo', 'superficie'],
  ['semaforoRojo', 'superficie'],
  ['navActivo', 'superficie'],
  ['navInactivo', 'superficie'],
];

describe.each(['claro', 'oscuro'] as const)('tokens en modo %s', modo => {
  const color = tokens.color[modo] as Record<RolColor, string>;

  test.each(paresDeTexto)('%s sobre %s cumple 4.5:1', (texto, fondo) => {
    expect(razonContraste(color[texto], color[fondo])).toBeGreaterThanOrEqual(4.5);
  });

  test('tiene los mismos roles que el otro modo', () => {
    expect(Object.keys(color).sort()).toEqual(Object.keys(tokens.color.claro).sort());
  });
});

test('la razón de contraste coincide con la referencia de WCAG', () => {
  expect(razonContraste('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
  expect(razonContraste('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
});

test('cada variante de texto tiene fuente, tamaño y alto de línea', () => {
  for (const estilo of Object.values(temas.claro.texto)) {
    expect(estilo.fontFamily).toBeTruthy();
    expect(estilo.fontSize).toBeGreaterThan(0);
    expect(estilo.lineHeight).toBeGreaterThanOrEqual(estilo.fontSize!);
  }
});

test('el área mínima de toque es de 44 puntos', () => {
  expect(temas.claro.toqueMinimo).toBe(44);
});

describe('escala tipográfica', () => {
  const variantes = Object.keys(temas.claro.texto) as VarianteTexto[];

  test('ningún texto baja de 13 pt (la x de Atkinson es más baja que la del sistema)', () => {
    for (const variante of variantes) expect(temas.claro.texto[variante].fontSize).toBeGreaterThanOrEqual(13);
  });

  test('ninguna variante suma el relleno de la fuente en Android', () => {
    for (const variante of variantes) expect(temas.claro.texto[variante].includeFontPadding).toBe(false);
  });

  test('las cifras tienen ancho fijo y un tope al crecer; el texto corrido crece sin tope', () => {
    for (const variante of variantes.filter(v => v.startsWith('cifra'))) {
      expect(temas.claro.texto[variante].fontVariant).toEqual(['tabular-nums']);
      expect(temas.claro.crecimientoTexto[variante]).toBeGreaterThan(1);
      expect(temas.claro.crecimientoTexto[variante]).toBeLessThanOrEqual(1.5);
    }
    for (const variante of ['cuerpo', 'cuerpoFuerte', 'apoyo', 'apoyoPequeno', 'etiqueta'] as VarianteTexto[]) {
      expect(temas.claro.crecimientoTexto[variante]).toBe(0);
    }
  });
});

// Regla de diseño: ningún tamaño escrito en las pantallas; todo sale de la escala de tokens.json.
test('ninguna pantalla escribe fontSize, lineHeight ni letterSpacing a mano', () => {
  const raiz = join(__dirname, '../../..');
  const archivos = (dir: string): string[] =>
    readdirSync(dir).flatMap(nombre => {
      const ruta = join(dir, nombre);
      if (statSync(ruta).isDirectory()) return nombre === '__tests__' || nombre === 'node_modules' ? [] : archivos(ruta);
      return /\.tsx?$/.test(nombre) ? [ruta] : [];
    });
  const encontrados = [...archivos(join(raiz, 'app')), ...archivos(join(raiz, 'src'))]
    .filter(ruta => !ruta.endsWith(join('diseno', 'tema.ts')))
    .flatMap(ruta =>
      readFileSync(ruta, 'utf8')
        .split('\n')
        .map((linea, i) => ({ ruta, linea: i + 1, texto: linea }))
        .filter(({ texto }) => /\b(fontSize|lineHeight|letterSpacing)\s*:/.test(texto)),
    )
    .map(({ ruta, linea }) => `${ruta.slice(raiz.length + 1)}:${linea}`);
  expect(encontrados).toEqual([]);
});
