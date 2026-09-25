import type { Tarjeta } from '../../tipos/tipos';
import { migrar } from '../migraciones';
import { ErrorDatoProhibido, repositorioPreferencias, repositorioTarjetas } from '../repositorios';
import { preferenciasIniciales } from '../preferencias';
import { basePrueba } from '../../pruebas/sqlitePrueba';

const tarjeta: Tarjeta = {
  id: 't1',
  alias: 'Visa Clásica',
  emisorId: 'banreservas',
  productoId: 'banreservas-visa-clasica',
  productoDesconocido: false,
  ultimos4: '4821',
  diaCorte: 5,
  fechaLimite: { tipo: 'dia_del_mes', dia: 25 },
  ajusteDiaNoHabil: 'ninguno',
  compraEnDiaDeCorte: 'entra_en_siguiente',
  monedaFacturacion: 'doble_balance',
  recompensa: { tipo: 'cashback', porcentaje: 1 },
  enPausa: false,
  creadaEn: '2026-09-25',
};

async function preparar() {
  const db = basePrueba();
  await migrar(db);
  return db;
}

describe('tarjetas', () => {
  test('guarda, lista en orden de registro, actualiza y borra', async () => {
    const repo = repositorioTarjetas(await preparar());
    await repo.guardar(tarjeta, '2026-09-25');
    await repo.guardar({ ...tarjeta, id: 't2', alias: 'Mastercard Gold' }, '2026-09-25');
    expect((await repo.listar()).map(t => t.alias)).toEqual(['Visa Clásica', 'Mastercard Gold']);

    await repo.guardar({ ...tarjeta, enPausa: true }, '2026-09-26');
    const [primera] = await repo.listar();
    expect(primera).toEqual({ ...tarjeta, enPausa: true });

    await repo.borrar('t1');
    expect((await repo.listar()).map(t => t.id)).toEqual(['t2']);
  });

  test('se niega a guardar un número de tarjeta completo', async () => {
    const db = await preparar();
    const repo = repositorioTarjetas(db);
    await expect(repo.guardar({ ...tarjeta, alias: '4111 1111 1111 1111' }, '2026-09-25')).rejects.toThrow(ErrorDatoProhibido);
    expect(await repo.listar()).toEqual([]);
  });
});

describe('preferencias', () => {
  test('no hay preferencias hasta que se guardan, y se reemplazan en una sola fila', async () => {
    const db = await preparar();
    const repo = repositorioPreferencias(db);
    expect(await repo.leer()).toBeNull();

    const iniciales = preferenciasIniciales('DO', 'es-DO');
    await repo.guardar(iniciales, '2026-09-25');
    await repo.guardar({ ...iniciales, enfoque: { modo: 'puntos' } }, '2026-09-26');

    expect(await repo.leer()).toEqual({ ...iniciales, enfoque: { modo: 'puntos' } });
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM preferencias').get()).toEqual({ n: 1 });
  });

  test('parten en modo Equilibrado, diferencial de 6% y corte cercano a 3 días', () => {
    expect(preferenciasIniciales('DO', 'es-DO')).toMatchObject({
      enfoque: { modo: 'equilibrado' },
      diferencialCambiarioPct: 6,
      umbralCorteCercanoDias: 3,
      pagoBalanceUsd: null,
      plan: 'gratis',
    });
  });
});
