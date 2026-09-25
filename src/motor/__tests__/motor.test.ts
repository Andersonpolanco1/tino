import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import type { EntradaMotor, ResultadoMotor } from '../../tipos/tipos';
import { calcularRanking } from '../ranking';
import datos from './motor.casos.json';

interface Caso {
  id: string;
  descripcion: string;
  verifica: string;
  entrada: EntradaMotor;
  esperado: ResultadoMotor;
}

const casos = datos.casos as unknown as Caso[];

test('hay 17 casos de referencia', () => {
  expect(casos).toHaveLength(17);
});

// Sección 5.7: la implementación reproduce cada resultado exactamente.
describe.each(casos.map(c => [c.id, c] as const))('caso %s', (_id, caso) => {
  test(caso.verifica || caso.descripcion, () => {
    expect(calcularRanking(caso.entrada)).toEqual(caso.esperado);
  });
});

// Casos aleatorios de generar_aleatorios.py: buscan diferencias con la referencia en
// combinaciones que nadie escribió a mano.
describe('casos aleatorios de la referencia', () => {
  const aleatorios = require('./motor.aleatorios.json').casos as Omit<Caso, 'descripcion' | 'verifica'>[];

  test('hay casos generados', () => {
    expect(aleatorios.length).toBeGreaterThanOrEqual(200);
  });

  test.each(aleatorios.map(c => [c.id, c] as const))('%s', (_id, caso) => {
    expect(calcularRanking(caso.entrada)).toEqual(caso.esperado);
  });
});

// Regla del motor: TypeScript puro, sin interfaz ni hora del sistema.
test('el motor no importa React ni Expo ni lee la hora del sistema', () => {
  const carpeta = join(__dirname, '..');
  const archivos = readdirSync(carpeta).filter(n => n.endsWith('.ts'));
  expect(archivos.length).toBeGreaterThan(0);
  for (const archivo of archivos) {
    const codigo = readFileSync(join(carpeta, archivo), 'utf8');
    const importaciones = [...codigo.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(m => m[1]);
    for (const origen of importaciones) {
      expect({ archivo, origen, relativo: origen.startsWith('.') }).toEqual({ archivo, origen, relativo: true });
    }
    expect(codigo).not.toMatch(/Date\.now|new Date\(\s*\)|performance\.now/);
  }
});
