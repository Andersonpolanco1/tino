import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import configDO from '../do.json';
import { configPara, detectarPais, opcionesDePais, paisPermitido, PAIS_PREDETERMINADO, usarEleccionDePais, type RegionDispositivo } from '../paises';
import { ProveedorPais, usePais } from '../ContextoPais';

const telefonoRD: RegionDispositivo = { regionCode: 'DO', currencyCode: 'DOP', languageTag: 'es-DO' };
const telefonoMX: RegionDispositivo = { regionCode: 'MX', currencyCode: 'MXN', languageTag: 'es-MX' };
const telefonoFR: RegionDispositivo = { regionCode: 'FR', currencyCode: 'EUR', languageTag: 'fr-FR' };

// La base multipaís se prueba con la elección de país prendida; el lanzamiento solo en el
// país predeterminado (D84) tiene su propio bloque al final.
beforeEach(() => usarEleccionDePais(true));
afterEach(() => usarEleccionDePais(null));

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

describe('un solo país mientras "elegirPais" está apagado (decisión D84)', () => {
  beforeEach(() => usarEleccionDePais(false));

  test('cualquier región del teléfono usa el país predeterminado y no hay nada que elegir', () => {
    for (const region of [telefonoMX, telefonoFR, { regionCode: 'US', currencyCode: 'USD', languageTag: 'en-US' }]) {
      expect(detectarPais([region])).toBe(PAIS_PREDETERMINADO);
      expect(opcionesDePais([region])).toEqual([PAIS_PREDETERMINADO]);
    }
    expect(paisPermitido(PAIS_PREDETERMINADO)).toBe(true);
    expect(paisPermitido('MX')).toBe(false);
  });

  test('un teléfono en inglés de EE. UU. ve Tino con la configuración y el idioma del país predeterminado', async () => {
    await render(
      <ProveedorPais regiones={[{ regionCode: 'US', currencyCode: 'USD', languageTag: 'en-US' }]}>
        <MostrarPais />
      </ProveedorPais>,
    );
    expect(screen.getByTestId('pais')).toHaveTextContent(PAIS_PREDETERMINADO);
    expect(screen.getByTestId('moneda')).toHaveTextContent(configDO.monedaPrincipal);
    expect(screen.getByTestId('idioma')).toHaveTextContent(configDO.idiomas[0]);
  });

  test('el registro trae la elección apagada para el lanzamiento', () => {
    usarEleccionDePais(null);
    expect(require('../registro.json').elegirPais).toBe(false);
    expect(opcionesDePais([telefonoMX])).toEqual([PAIS_PREDETERMINADO]);
  });
});
