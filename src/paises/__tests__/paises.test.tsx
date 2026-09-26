import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import configDO from '../do.json';
import { configPara, detectarPais, opcionesDePais, PAIS_PREDETERMINADO, type RegionDispositivo } from '../paises';
import { ProveedorPais, usePais } from '../ContextoPais';

const telefonoRD: RegionDispositivo = { regionCode: 'DO', currencyCode: 'DOP', languageTag: 'es-DO' };
const telefonoMX: RegionDispositivo = { regionCode: 'MX', currencyCode: 'MXN', languageTag: 'es-MX' };
const telefonoFR: RegionDispositivo = { regionCode: 'FR', currencyCode: 'EUR', languageTag: 'fr-FR' };

describe('detectarPais', () => {
  test('usa la región del teléfono', () => {
    expect(detectarPais([telefonoMX])).toBe('MX');
  });

  test('toma la primera región disponible', () => {
    expect(detectarPais([{ ...telefonoRD, regionCode: null }, telefonoMX])).toBe('MX');
  });

  test('sin región usa el mercado inicial', () => {
    expect(detectarPais([{ regionCode: null, currencyCode: null, languageTag: 'es' }])).toBe(PAIS_PREDETERMINADO);
    expect(detectarPais([])).toBe(PAIS_PREDETERMINADO);
  });
});

describe('opcionesDePais', () => {
  test('ofrece los países con configuración y el de la región del teléfono', () => {
    expect(opcionesDePais([{ regionCode: 'US', currencyCode: 'USD', languageTag: 'en-US' }])).toEqual(['DO', 'US']);
  });

  test('no repite el país si la región ya tiene configuración', () => {
    expect(opcionesDePais([telefonoRD])).toEqual(['DO']);
  });
});

describe('configPara', () => {
  test('RD usa su archivo de configuración', () => {
    expect(configPara('DO')).toEqual(configDO);
  });

  test('un país sin archivo usa el modo sin catálogo', () => {
    const config = configPara('MX', [telefonoMX]);
    expect(config).toMatchObject({
      codigo: 'MX',
      monedaPrincipal: 'MXN',
      monedaSecundaria: null,
      idiomas: ['es-MX'],
      feriados: [],
      catalogoDisponible: false,
      funciones: { dobleBalance: false },
    });
    expect(config.montoReferencia).toBeGreaterThan(0);
  });

  test('sin datos de región usa la moneda de respaldo', () => {
    expect(configPara('XX').monedaPrincipal).toBe('USD');
  });
});

function MostrarPais() {
  const { config, idioma, cambiarPais } = usePais();
  const { t } = useTranslation();
  return (
    <>
      <Text testID="pais">{config.codigo}</Text>
      <Text testID="moneda">{config.monedaPrincipal}</Text>
      <Text testID="dobleBalance">{String(config.funciones.dobleBalance)}</Text>
      <Text testID="idioma">{idioma}</Text>
      <Text testID="texto">{t('pestanas.inicio')}</Text>
      <Text testID="cambiar" onPress={() => cambiarPais('MX')} />
    </>
  );
}

test('cambiar el país cambia moneda y funciones sin tocar el código (criterio 18.6)', async () => {
  await render(
    <ProveedorPais regiones={[telefonoRD, telefonoMX]}>
      <MostrarPais />
    </ProveedorPais>,
  );
  expect(screen.getByTestId('pais')).toHaveTextContent('DO');
  expect(screen.getByTestId('moneda')).toHaveTextContent('DOP');
  expect(screen.getByTestId('dobleBalance')).toHaveTextContent('true');
  expect(screen.getByTestId('texto')).toHaveTextContent('Inicio');

  await act(() => screen.getByTestId('cambiar').props.onPress());

  expect(screen.getByTestId('pais')).toHaveTextContent('MX');
  expect(screen.getByTestId('moneda')).toHaveTextContent('MXN');
  expect(screen.getByTestId('dobleBalance')).toHaveTextContent('false');
});

test('un teléfono en un idioma sin textos usa el idioma predeterminado', async () => {
  await render(
    <ProveedorPais regiones={[telefonoFR]}>
      <MostrarPais />
    </ProveedorPais>,
  );
  expect(screen.getByTestId('idioma')).toHaveTextContent('es-DO');
  expect(screen.getByTestId('texto')).toHaveTextContent('Inicio');
});
