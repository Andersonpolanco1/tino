import type { Catalogo } from '../../tipos/tipos';
import { migrar } from '../../datos/migraciones';
import { basePrueba } from '../../pruebas/sqlitePrueba';
import { actualizarCatalogo, catalogoIncluido, catalogoLocal, type DependenciasCatalogo } from '../catalogo';
import { compararVersiones, validarCatalogo } from '../esquema';

const incluido = catalogoIncluido('DO')!;
const conVersion = (version: string): Catalogo => ({ ...incluido, version });
const URL = 'https://datos.ejemplo';

async function preparar(respuestas: Record<string, unknown> = {}, ahora = new Date('2026-10-01T12:00:00Z')) {
  const db = basePrueba();
  await migrar(db);
  const descargar = jest.fn(async (url: string) => {
    if (!(url in respuestas)) throw new Error('sin conexión');
    return respuestas[url];
  });
  const deps: DependenciasCatalogo = { db, urlBase: URL, descargar, ahora: () => ahora };
  return { db, deps, descargar };
}

const indice = (version: string | null) => ({ paises: [{ codigo: 'DO', versionCatalogo: version }] });

describe('esquema', () => {
  test('la copia incluida cumple el esquema', () => {
    expect(validarCatalogo(incluido)).not.toBeNull();
  });

  test('rechaza archivos incompletos o con productos repetidos', () => {
    expect(validarCatalogo({ ...incluido, emisores: [] })).toBeNull();
    expect(validarCatalogo({ pais: 'DO' })).toBeNull();
    const [primero] = incluido.emisores;
    const repetido = { ...primero, productos: [...primero.productos, primero.productos[0]] };
    expect(validarCatalogo({ ...incluido, emisores: [repetido, ...incluido.emisores.slice(1)] })).toBeNull();
  });

  test('compara versiones por partes numéricas', () => {
    expect(compararVersiones('2026.09.10', '2026.09.9')).toBe(1);
    expect(compararVersiones('2026.09.3', '2026.09.3')).toBe(0);
    expect(compararVersiones('2026.09', '2026.10.1')).toBe(-1);
  });
});

describe('catálogo local', () => {
  test('sin caché usa la copia incluida', async () => {
    const { db } = await preparar();
    expect((await catalogoLocal('DO', db))?.version).toBe(incluido.version);
  });

  test('un país sin catálogo devuelve null (modo sin catálogo)', async () => {
    const { db } = await preparar();
    expect(await catalogoLocal('MX', db)).toBeNull();
  });

  test('usa la caché solo si es más nueva que la copia incluida', async () => {
    const { deps, db } = await preparar({ [`${URL}/v1/paises/index.json`]: indice('2099.1'), [`${URL}/v1/catalogos/do.json`]: conVersion('2099.1') });
    await actualizarCatalogo('DO', incluido, deps);
    expect((await catalogoLocal('DO', db))?.version).toBe('2099.1');

    db.sqlite.exec(`UPDATE cache_publica SET datos = '${JSON.stringify(conVersion('2000.1')).replace(/'/g, "''")}' WHERE clave = 'catalogo:DO'`);
    expect((await catalogoLocal('DO', db))?.version).toBe(incluido.version);
  });
});

describe('actualización desde el servidor', () => {
  test('descarga, valida y guarda una versión más nueva', async () => {
    const { deps } = await preparar({ [`${URL}/v1/paises/index.json`]: indice('2099.1'), [`${URL}/v1/catalogos/do.json`]: conVersion('2099.1') });
    expect((await actualizarCatalogo('DO', incluido, deps))?.version).toBe('2099.1');
  });

  test('no descarga el catálogo si la versión no cambió', async () => {
    const { deps, descargar } = await preparar({ [`${URL}/v1/paises/index.json`]: indice(incluido.version) });
    expect(await actualizarCatalogo('DO', incluido, deps)).toBeNull();
    expect(descargar).toHaveBeenCalledTimes(1);
  });

  test('un archivo inválido nunca reemplaza la caché', async () => {
    const { deps, db } = await preparar({
      [`${URL}/v1/paises/index.json`]: indice('2099.1'),
      [`${URL}/v1/catalogos/do.json`]: { ...conVersion('2099.1'), emisores: [] },
    });
    expect(await actualizarCatalogo('DO', incluido, deps)).toBeNull();
    expect((await catalogoLocal('DO', db))?.version).toBe(incluido.version);
  });

  test('un archivo con otra versión que la del índice se descarta', async () => {
    const { deps } = await preparar({ [`${URL}/v1/paises/index.json`]: indice('2099.1'), [`${URL}/v1/catalogos/do.json`]: conVersion('2099.2') });
    expect(await actualizarCatalogo('DO', incluido, deps)).toBeNull();
  });

  test('sin conexión sigue con lo que tiene y vuelve a intentar en la próxima apertura', async () => {
    const { deps, descargar } = await preparar();
    expect(await actualizarCatalogo('DO', incluido, deps)).toBeNull();
    expect(await actualizarCatalogo('DO', incluido, deps)).toBeNull();
    expect(descargar).toHaveBeenCalledTimes(2);
  });

  test('revisa como máximo una vez cada 24 horas', async () => {
    const ahora = { valor: new Date('2026-10-01T12:00:00Z') };
    const { deps, descargar } = await preparar({ [`${URL}/v1/paises/index.json`]: indice(incluido.version) });
    deps.ahora = () => ahora.valor;
    await actualizarCatalogo('DO', incluido, deps);
    ahora.valor = new Date('2026-10-02T11:00:00Z');
    await actualizarCatalogo('DO', incluido, deps);
    expect(descargar).toHaveBeenCalledTimes(1);
    ahora.valor = new Date('2026-10-02T12:30:00Z');
    await actualizarCatalogo('DO', incluido, deps);
    expect(descargar).toHaveBeenCalledTimes(2);
  });

  test('sin dirección de servidor no descarga nada', async () => {
    const { deps, descargar } = await preparar();
    expect(await actualizarCatalogo('DO', incluido, { ...deps, urlBase: undefined })).toBeNull();
    expect(descargar).not.toHaveBeenCalled();
  });
});
