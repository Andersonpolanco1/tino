import { render, renderHook, screen } from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import tokens from '../tokens.json';
import { useTema } from '../useTema';
import { Texto } from '../Texto';

function simularEsquema(esquema: 'light' | 'dark' | 'unspecified') {
  jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue(esquema);
}

afterEach(() => jest.restoreAllMocks());

test('useTema devuelve los roles claros en modo claro', async () => {
  simularEsquema('light');
  const { result } = await renderHook(() => useTema());
  expect(result.current.modo).toBe('claro');
  expect(result.current.color.fondo).toBe(tokens.color.claro.fondo);
});

test('useTema devuelve los roles oscuros en modo oscuro', async () => {
  simularEsquema('dark');
  const { result } = await renderHook(() => useTema());
  expect(result.current.modo).toBe('oscuro');
  expect(result.current.color.fondo).toBe(tokens.color.oscuro.fondo);
});

test('sin preferencia del sistema usa el modo claro', async () => {
  simularEsquema('unspecified');
  const { result } = await renderHook(() => useTema());
  expect(result.current.modo).toBe('claro');
});

test('Texto toma el color del rol en el modo activo y escala con el sistema', async () => {
  simularEsquema('dark');
  await render(<Texto color="textoSecundario">Hola</Texto>);
  const texto = screen.getByText('Hola');
  expect(texto).toHaveStyle({ color: tokens.color.oscuro.textoSecundario });
  expect(texto.props.allowFontScaling).toBe(true);
});

test('las cifras grandes crecen hasta su tope; el texto corrido, sin límite', async () => {
  await render(
    <>
      <Texto variante="cifraGrande">45</Texto>
      <Texto>Hola</Texto>
    </>,
  );
  expect(screen.getByText('45').props.maxFontSizeMultiplier).toBe(1.5);
  expect(screen.getByText('Hola').props.maxFontSizeMultiplier).toBe(0);
});
