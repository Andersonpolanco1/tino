import { logoEmisor } from '../logos';

describe('logoEmisor', () => {
  test('usa la copia incluida aunque haya servidor', () => {
    expect(logoEmisor({ logo: 'bhd.png' }, 'https://datos.ejemplo')).not.toEqual({ uri: 'https://datos.ejemplo/v1/logos/bhd.png' });
    expect(logoEmisor({ logo: 'bhd.png' }, undefined)).toBeDefined();
  });

  test('un logo que la app no trae se pide al servidor', () => {
    expect(logoEmisor({ logo: 'banco-nuevo.png' }, 'https://datos.ejemplo')).toEqual({ uri: 'https://datos.ejemplo/v1/logos/banco-nuevo.png' });
  });

  test('sin logo, o sin copia ni servidor, no hay logo y se muestran las iniciales', () => {
    expect(logoEmisor({}, 'https://datos.ejemplo')).toBeUndefined();
    expect(logoEmisor(null)).toBeUndefined();
    expect(logoEmisor({ logo: 'banco-nuevo.png' }, '')).toBeUndefined();
  });
});
