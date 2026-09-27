import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { FilaLista } from '../ListaAgrupada';

// Decisión D63: el logo reemplaza las iniciales; sin logo, o si no carga, vuelven las iniciales.
// El círculo está oculto al lector de pantalla, por eso se buscan también los elementos ocultos.
const ocultos = { includeHiddenElements: true };
const logo = { uri: 'https://datos.ejemplo/v1/logos/bhd.png' };

test('sin logo muestra las iniciales', async () => {
  await render(<FilaLista titulo="Mi Visa" iniciales="BHD" />);
  expect(screen.getByText('BHD', ocultos)).toBeTruthy();
  expect(screen.queryByTestId('logo-banco', ocultos)).toBeNull();
});

test('con logo muestra la imagen en lugar de las iniciales', async () => {
  await render(<FilaLista titulo="Mi Visa" iniciales="BHD" logo={logo} />);
  expect(screen.getByTestId('logo-banco', ocultos)).toBeTruthy();
  expect(screen.queryByText('BHD', ocultos)).toBeNull();
});

test('si el logo no carga vuelve a las iniciales', async () => {
  await render(<FilaLista titulo="Mi Visa" iniciales="BHD" logo={logo} />);
  await act(async () => fireEvent(screen.getByTestId('logo-banco', ocultos), 'error'));
  expect(screen.getByText('BHD', ocultos)).toBeTruthy();
});
