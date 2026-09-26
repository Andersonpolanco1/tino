import type { Tarjeta } from '../../tipos/tipos';
import { migrar } from '../../datos/migraciones';
import { repositorioIngresos, repositorioPreferencias, repositorioSugerencias, repositorioTarjetas } from '../../datos/repositorios';
import { preferenciasIniciales } from '../../datos/preferencias';
import { basePrueba } from '../../pruebas/sqlitePrueba';
import { crearAlmacen } from '../almacen';

const tarjeta: Tarjeta = {
  id: 't1',
  alias: 'Visa Clásica',
  emisorId: 'banreservas',
  productoId: null,
  productoDesconocido: false,
  diaCorte: 5,
  fechaLimite: { tipo: 'dia_del_mes', dia: 25 },
  ajusteDiaNoHabil: 'ninguno',
  compraEnDiaDeCorte: 'entra_en_siguiente',
  monedaFacturacion: 'solo_principal',
  recompensa: { tipo: 'ninguna' },
  enPausa: false,
  creadaEn: '2026-09-25',
};

async function preparar() {
  const db = basePrueba();
  await migrar(db);
  const repos = { tarjetas: repositorioTarjetas(db), ingresos: repositorioIngresos(db), preferencias: repositorioPreferencias(db), sugerencias: repositorioSugerencias(db) };
  return { repos, almacen: crearAlmacen(repos, () => '2026-09-25T12:00:00Z') };
}

test('guarda en la base antes de actualizar el estado, y lo recupera al cargar', async () => {
  const { repos, almacen } = await preparar();
  await almacen.getState().cargar();
  expect(almacen.getState()).toMatchObject({ cargado: true, tarjetas: [], preferencias: null });

  await almacen.getState().guardarTarjeta(tarjeta);
  await almacen.getState().guardarPreferencias(preferenciasIniciales('DO', 'es-DO'));

  const otro = crearAlmacen(repos);
  await otro.getState().cargar();
  expect(otro.getState().tarjetas).toEqual([tarjeta]);
  expect(otro.getState().preferencias?.pais).toBe('DO');
});

test('guarda, edita y borra fuentes de ingreso', async () => {
  const { repos, almacen } = await preparar();
  await almacen.getState().cargar();
  const nomina = { id: 'n', nombre: 'Nómina', frecuencia: { tipo: 'quincenal_dias_fijos' as const, dias: [15, 30] as [number, number] }, ajusteDiaNoHabil: 'adelantar' as const };
  await almacen.getState().guardarIngreso(nomina);
  await almacen.getState().guardarIngreso({ ...nomina, nombre: 'Sueldo' });
  const otro = crearAlmacen(repos);
  await otro.getState().cargar();
  expect(otro.getState().ingresos).toEqual([{ ...nomina, nombre: 'Sueldo' }]);
  await almacen.getState().borrarIngreso('n');
  expect(almacen.getState().ingresos).toEqual([]);
});

test('editar reemplaza la tarjeta sin cambiar el orden', async () => {
  const { almacen } = await preparar();
  await almacen.getState().guardarTarjeta(tarjeta);
  await almacen.getState().guardarTarjeta({ ...tarjeta, id: 't2', alias: 'Otra' });
  await almacen.getState().guardarTarjeta({ ...tarjeta, alias: 'Visa editada' });
  expect(almacen.getState().tarjetas.map(t => t.alias)).toEqual(['Visa editada', 'Otra']);
});

test('pausar y borrar', async () => {
  const { almacen } = await preparar();
  await almacen.getState().guardarTarjeta(tarjeta);
  await almacen.getState().alternarPausa('t1');
  expect(almacen.getState().tarjetas[0].enPausa).toBe(true);
  await almacen.getState().alternarPausa('t1');
  expect(almacen.getState().tarjetas[0].enPausa).toBe(false);
  await almacen.getState().borrarTarjeta('t1');
  expect(almacen.getState().tarjetas).toEqual([]);
});

test('si la base rechaza el dato, el estado no cambia', async () => {
  const { almacen } = await preparar();
  await expect(almacen.getState().guardarTarjeta({ ...tarjeta, alias: '4111111111111111' })).rejects.toThrow();
  expect(almacen.getState().tarjetas).toEqual([]);
});

test('crea las preferencias iniciales una sola vez', async () => {
  const { almacen } = await preparar();
  await almacen.getState().cargar();
  await almacen.getState().asegurarPreferencias('DO', 'es-DO');
  await almacen.getState().guardarPreferencias({ ...almacen.getState().preferencias!, enfoque: { modo: 'puntos' } });
  await almacen.getState().asegurarPreferencias('DO', 'es-DO');
  expect(almacen.getState().preferencias?.enfoque.modo).toBe('puntos');
});
