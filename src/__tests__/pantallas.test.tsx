import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';
import { ProveedorPais, type RegionDispositivo } from '@/paises';
import Inicio from '../../app/(tabs)/inicio';
import Ajustes from '../../app/(tabs)/ajustes';

const medidas = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function conPais(regiones: RegionDispositivo[], pantalla: ReactNode) {
  return (
    <SafeAreaProvider initialMetrics={medidas}>
      <ProveedorPais regiones={regiones}>{pantalla}</ProveedorPais>
    </SafeAreaProvider>
  );
}

const rd: RegionDispositivo = { regionCode: 'DO', currencyCode: 'DOP', languageTag: 'es-DO' };
const mx: RegionDispositivo = { regionCode: 'MX', currencyCode: 'MXN', languageTag: 'es-MX' };

test('inicio muestra su título como encabezado', async () => {
  await render(conPais([rd], <Inicio />));
  expect(screen.getByRole('header')).toHaveTextContent('Tu tarjeta de hoy');
});

test('ajustes muestra el país y las monedas de RD', async () => {
  await render(conPais([rd], <Ajustes />));
  expect(screen.getByText('República Dominicana')).toBeOnTheScreen();
  expect(screen.getByText('DOP · USD')).toBeOnTheScreen();
});

test('ajustes muestra un país sin catálogo con la moneda del teléfono', async () => {
  await render(conPais([mx], <Ajustes />));
  expect(screen.getByText('Otro país (MX)')).toBeOnTheScreen();
  expect(screen.getByText('MXN')).toBeOnTheScreen();
});
