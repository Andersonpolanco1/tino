import type { ReactNode } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { migrar } from '@/datos/migraciones';
import { repositorioIngresos, repositorioPreferencias, repositorioTarjetas } from '@/datos/repositorios';
import { preferenciasIniciales } from '@/datos/preferencias';
import { basePrueba } from '@/pruebas/sqlitePrueba';
import { crearAlmacen, ProveedorAlmacenDePrueba, type Almacen } from '@/estado';
import { ProveedorPais } from '@/paises';
import { FormularioIngreso } from '../FormularioIngreso';

jest.mock('expo-crypto', () => ({ randomUUID: () => 'id-cobro' }));
// Hoy fijo: sábado 26 de septiembre de 2026.
jest.mock('@/utilidades/fecha', () => ({ hoyLocal: () => '2026-09-26' }));

async function preparar() {
  const db = basePrueba();
  await migrar(db);
  const almacen = crearAlmacen({ tarjetas: repositorioTarjetas(db), ingresos: repositorioIngresos(db), preferencias: repositorioPreferencias(db) });
  await almacen.getState().cargar();
  await almacen.getState().guardarPreferencias(preferenciasIniciales('DO', 'es-DO'));
  return almacen;
}

function envolver(almacen: Almacen, hijos: ReactNode) {
  return (
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <ProveedorPais regiones={[{ regionCode: 'DO', currencyCode: 'DOP', languageTag: 'es-DO' }]}>
        <ProveedorAlmacenDePrueba almacen={almacen}>{hijos}</ProveedorAlmacenDePrueba>
      </ProveedorPais>
    </SafeAreaProvider>
  );
}

async function presionar(texto: string) {
  await fireEvent.press(screen.getByText(texto));
  await act(async () => {});
}

test('quincena del 15 y el 30 en tres pasos, con vista previa', async () => {
  const almacen = await preparar();
  const onListo = jest.fn();
  await render(envolver(almacen, <FormularioIngreso onListo={onListo} onCerrar={jest.fn()} />));

  expect(screen.getByText('Paso 1 de 3')).toBeOnTheScreen();
  await presionar('Siguiente');
  expect(screen.getByText('Elige cada cuánto cobras.')).toBeOnTheScreen();
  await presionar('Quincenal');
  await presionar('Siguiente');

  expect(screen.getByText('Tus próximos cobros: 30 de septiembre, 15 de octubre, 30 de octubre')).toBeOnTheScreen();
  await presionar('Siguiente');
  expect(screen.getByDisplayValue('Nómina')).toBeOnTheScreen();
  await presionar('Guardar');

  expect(onListo).toHaveBeenCalledWith({ id: 'id-cobro', nombre: 'Nómina', frecuencia: { tipo: 'quincenal_dias_fijos', dias: [15, 30] }, ajusteDiaNoHabil: 'adelantar' });
  expect(almacen.getState().ingresos).toHaveLength(1);
});

test('cada 2 semanas pide cuál fue el último cobro', async () => {
  const almacen = await preparar();
  const onListo = jest.fn();
  await render(envolver(almacen, <FormularioIngreso onListo={onListo} onCerrar={jest.fn()} />));
  await presionar('Cada 2 semanas');
  await presionar('Siguiente');
  await presionar('Siguiente');
  expect(screen.getByText('Elige cuándo fue tu último cobro.')).toBeOnTheScreen();
  await presionar('18 de septiembre');
  await presionar('Siguiente');
  await presionar('Guardar');
  expect(onListo).toHaveBeenCalledWith(expect.objectContaining({ frecuencia: { tipo: 'cada_dos_semanas', diaSemana: 5, referencia: '2026-09-18' } }));
});

test('fechas variables: agregar una fecha estimada', async () => {
  const almacen = await preparar();
  const onListo = jest.fn();
  await render(envolver(almacen, <FormularioIngreso onListo={onListo} onCerrar={jest.fn()} />));
  await presionar('Fechas variables');
  await presionar('Siguiente');
  await fireEvent.press(within(screen.getByLabelText('Agregar una fecha')).getByLabelText('10'));
  await fireEvent.press(screen.getByLabelText('Es una fecha estimada'));
  await presionar('Agregar esta fecha');
  expect(screen.getByText('Estimada')).toBeOnTheScreen();
  await presionar('Siguiente');
  expect(screen.getByDisplayValue('Cliente')).toBeOnTheScreen();
  await presionar('Guardar');
  expect(onListo).toHaveBeenCalledWith(expect.objectContaining({ frecuencia: { tipo: 'personalizada', fechas: [{ fecha: '2026-09-10', estimada: true }] } }));
});

test('editar permite borrar el cobro', async () => {
  const almacen = await preparar();
  const ingreso = { id: 'n', nombre: 'Nómina', frecuencia: { tipo: 'mensual' as const, dia: 30 }, ajusteDiaNoHabil: 'adelantar' as const };
  await almacen.getState().guardarIngreso(ingreso);
  await render(envolver(almacen, <FormularioIngreso ingreso={ingreso} onListo={jest.fn()} onCerrar={jest.fn()} />));
  expect(screen.getByText('Editar cobro')).toBeOnTheScreen();
  await presionar('Siguiente');
  await presionar('Siguiente');
  expect(screen.getByText('Borrar este cobro')).toBeOnTheScreen();
});
