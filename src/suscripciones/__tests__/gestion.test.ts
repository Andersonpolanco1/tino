import { urlSuscripcionesTienda } from '../gestion';

test('sin la página de RevenueCat, abre las suscripciones de la tienda del teléfono', () => {
  expect(urlSuscripcionesTienda('ios', 'com.polanco.tino')).toBe('https://apps.apple.com/account/subscriptions');
  expect(urlSuscripcionesTienda('android', 'com.polanco.tino')).toBe('https://play.google.com/store/account/subscriptions?package=com.polanco.tino');
  expect(urlSuscripcionesTienda('android', null)).toBe('https://play.google.com/store/account/subscriptions');
});
