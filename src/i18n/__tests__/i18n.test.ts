import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import esDO from '../es-DO.json';
import { elegirIdioma, iniciarI18n } from '../i18n';
import { formatearFecha, formatearMoneda } from '../formato';

describe('elegirIdioma', () => {
  test('usa el idioma exacto si tiene textos', () => {
    expect(elegirIdioma(['es-DO'])).toBe('es-DO');
  });

  test('usa otra variante del mismo idioma', () => {
    expect(elegirIdioma(['en-US', 'es-MX'])).toBe('es-DO');
  });

  test('sin coincidencias usa el predeterminado', () => {
    expect(elegirIdioma(['fr-FR'])).toBe('es-DO');
  });
});

test('interpola variables en los textos', () => {
  const i18n = iniciarI18n('es-DO');
  expect(i18n.t('inicio.sePagaEl', { fecha: '20 de octubre' })).toBe('Se paga el 20 de octubre');
});

describe('formato', () => {
  test('montos en pesos y dólares', () => {
    expect(formatearMoneda(1000, 'DOP', 'es-DO')).toBe('RD$1,000');
    expect(formatearMoneda(1000.5, 'USD', 'es-DO')).toBe('US$1,000.50');
  });

  test('fechas con día y mes, sin desfase por zona horaria', () => {
    expect(formatearFecha('2026-09-25', 'es-DO')).toBe('25 de septiembre');
    expect(formatearFecha('2027-01-01', 'es-DO')).toBe('1 de enero');
  });
});

// Toda clave usada con t('...') en el código debe existir en es-DO.json.
function archivosCodigo(dir: string): string[] {
  return readdirSync(dir).flatMap(nombre => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return nombre === '__tests__' ? [] : archivosCodigo(ruta);
    return /\.tsx?$/.test(nombre) ? [ruta] : [];
  });
}

// Con plurales de i18next la clave existe como clave_one y clave_other.
function existeClave(clave: string): boolean {
  return existeExacta(clave) || (existeExacta(`${clave}_one`) && existeExacta(`${clave}_other`));
}

function existeExacta(clave: string): boolean {
  let nodo: unknown = esDO;
  for (const parte of clave.split('.')) {
    if (typeof nodo !== 'object' || nodo === null || !(parte in nodo)) return false;
    nodo = (nodo as Record<string, unknown>)[parte];
  }
  return typeof nodo === 'string';
}

test('todas las claves de texto usadas en el código existen', () => {
  const raiz = join(__dirname, '..', '..', '..');
  const archivos = [...archivosCodigo(join(raiz, 'app')), ...archivosCodigo(join(raiz, 'src'))];
  const faltantes: string[] = [];
  for (const archivo of archivos) {
    const codigo = readFileSync(archivo, 'utf8');
    for (const [, clave] of codigo.matchAll(/\bt\(\s*['"]([\w.]+)['"]/g)) {
      if (!existeClave(clave)) faltantes.push(`${clave} en ${archivo}`);
    }
  }
  expect(faltantes).toEqual([]);
});
