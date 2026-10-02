// Página de la tienda donde el usuario cancela o cambia Tino Pro. RevenueCat da la suya
// (managementURL) cuando la compra viene de una tienda, pero no siempre: la Test Store no tiene,
// y una fila con flecha nunca debe quedarse sin respuesta. Entonces se abre la página de
// suscripciones de la tienda del teléfono.
export function urlSuscripcionesTienda(plataforma: string, paquete: string | null): string {
  if (plataforma === 'ios') return 'https://apps.apple.com/account/subscriptions';
  return paquete
    ? `https://play.google.com/store/account/subscriptions?package=${encodeURIComponent(paquete)}`
    : 'https://play.google.com/store/account/subscriptions';
}
