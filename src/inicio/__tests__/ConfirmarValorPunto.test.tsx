import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { Tarjeta } from '@/tipos/tipos';
import { ProveedorPais } from '@/paises';
import { migrar } from '@/datos/migraciones';
import { repositorioPreferencias, repositorioTarjetas } from '@/datos/repositorios';
import { preferenciasIniciales } from '@/datos/preferencias';
import { basePrueba } from '@/pruebas/sqlitePrueba';
import { crearAlmacen, ProveedorAlmacenDePrueba } from '@/estado';
import { precisionTarjeta } from '../precision';
import { ConfirmarValorPunto, valorPuntoPorConfirmar } from '../ConfirmarValorPunto';

const tarjeta: Tarjeta = {
  id: 'A',
  alias: 'Visa',
  emisorId: null,
  emisorTextoLibre: 'Banco',
  productoId: null,
  productoDesconocido: false,
  diaCorte: 5,
  fechaLimite: { tipo: 'dia_del_mes', dia: 25 },
  ajusteDiaNoHabil: 'ninguno',
  compraEnDiaDeCorte: 'entra_en_siguiente',
  monedaFacturacion: 'solo_principal',
  recompensa: { tipo: 'puntos', regla: { tipo: 'por_porcentaje', porcentaje: 1 }, valorPunto: 1, valorPuntoConfirmado: false },
  enPausa: false,
  creadaEn: '2026-09-01',
};

async function preparar() {
  const db = basePrueba();
  await migrar(db);
  const almacen = crearAlmacen({ tarjetas: repositorioTarjetas(db), preferencias: repositorioPreferencias(db) });
  await almacen.getState().cargar();
  await almacen.getState().guardarPreferencias(preferenciasIniciales('DO', 'es-DO'));
  await almacen.getState().guardarTarjeta(tarjeta);
  return almacen;
}

test('"Sí, es correcto" confirma el valor del punto y sube la precisión (sección 4.2)', async () => {
  const almacen = await preparar();
  const onCambiar = jest.fn();
  await render(
    <ProveedorPais regiones={[{ regionCode: 'DO', currencyCode: 'DOP', languageTag: 'es-DO' }]}>
      <ProveedorAlmacenDePrueba almacen={almacen}>
        <ConfirmarValorPunto tarjeta={tarjeta} onCambiar={onCambiar} />
      </ProveedorAlmacenDePrueba>
    </ProveedorPais>,
  );
  expect(screen.getByText('¿1 punto vale RD$1?')).toBeOnTheScreen();
  await fireEvent.press(screen.getByText('Cambiar el valor'));
  expect(onCambiar).toHaveBeenCalled();

  const contexto = { hayIngresos: false, catalogoDisponible: false };
  const antes = precisionTarjeta(almacen.getState().tarjetas[0], contexto);
  await fireEvent.press(screen.getByText('Sí, es correcto'));
  await act(async () => {});
  const guardada = almacen.getState().tarjetas[0];
  expect(valorPuntoPorConfirmar(guardada)).toBe(false);
  expect(precisionTarjeta(guardada, contexto)).toBe(antes + 25);
});
