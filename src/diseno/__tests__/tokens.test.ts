import tokens from '../tokens.json';
import { razonContraste } from '../contraste';
import { temas, type RolColor } from '../tema';

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
