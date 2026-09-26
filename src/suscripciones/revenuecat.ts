import Purchases, { PACKAGE_TYPE, type CustomerInfo, type PurchasesPackage, type PurchasesStoreProduct } from 'react-native-purchases';
import type { OfertaPro, PeriodoPrueba, ServicioSuscripciones, TipoOferta } from './servicio';

// Derecho de RevenueCat que desbloquea Pro, y paquete propio del precio de lanzamiento
// (decisión D58). Quitar el paquete de la oferta en RevenueCat lo retira sin actualizar la app.
const DERECHO_PRO = 'pro';
const PAQUETE_LANZAMIENTO = 'lanzamiento';

const tienePro = (info: CustomerInfo) => !!info.entitlements.active[DERECHO_PRO];

function tipoDe(p: PurchasesPackage): TipoOferta | null {
  if (p.identifier === PAQUETE_LANZAMIENTO) return 'lanzamiento';
  if (p.packageType === PACKAGE_TYPE.ANNUAL) return 'anual';
  if (p.packageType === PACKAGE_TYPE.MONTHLY) return 'mensual';
  return null;
}

const UNIDADES: Record<string, PeriodoPrueba['unidad']> = { DAY: 'dia', WEEK: 'semana', MONTH: 'mes', YEAR: 'anio' };

// La prueba gratis: en iOS es el precio introductorio en 0; en Android, la fase gratis de la oferta.
function pruebaDe(producto: PurchasesStoreProduct): PeriodoPrueba | null {
  const gratis = producto.defaultOption?.freePhase?.billingPeriod;
  if (gratis && UNIDADES[gratis.unit]) return { unidad: UNIDADES[gratis.unit], cantidad: gratis.value };
  const intro = producto.introPrice;
  if (intro && intro.price === 0 && UNIDADES[intro.periodUnit]) return { unidad: UNIDADES[intro.periodUnit], cantidad: intro.periodNumberOfUnits };
  return null;
}

export function crearServicioRevenueCat(clave: string): ServicioSuscripciones {
  // Sin cuentas propias (sección 2 técnica): RevenueCat usa su identificador anónimo y la
  // compra queda en la cuenta de la tienda del usuario. No se le envían atributos.
  Purchases.configure({ apiKey: clave });
  let paquetes = new Map<string, PurchasesPackage>();

  return {
    async ofertas() {
      const ofertas = await Purchases.getOfferings();
      const disponibles = ofertas.current?.availablePackages ?? [];
      paquetes = new Map(disponibles.map(p => [p.identifier, p]));
      const lista: OfertaPro[] = [];
      for (const p of disponibles) {
        const tipo = tipoDe(p);
        if (!tipo) continue;
        lista.push({
          id: p.identifier,
          tipo,
          precio: p.product.priceString,
          precioPorMes: tipo === 'mensual' ? null : p.product.pricePerMonthString,
          prueba: pruebaDe(p.product),
        });
      }
      const orden: TipoOferta[] = ['lanzamiento', 'anual', 'mensual'];
      return lista.sort((a, b) => orden.indexOf(a.tipo) - orden.indexOf(b.tipo));
    },

    async comprar(id) {
      const paquete = paquetes.get(id);
      if (!paquete) return 'sin_pro';
      try {
        const { customerInfo } = await Purchases.purchasePackage(paquete);
        return tienePro(customerInfo) ? 'pro' : 'sin_pro';
      } catch (e) {
        if ((e as { userCancelled?: boolean | null }).userCancelled) return 'cancelada';
        throw e;
      }
    },

    async restaurar() {
      return tienePro(await Purchases.restorePurchases());
    },

    async tienePro() {
      return tienePro(await Purchases.getCustomerInfo());
    },

    alCambiar(escuchar) {
      const oyente = (info: CustomerInfo) => escuchar(tienePro(info));
      Purchases.addCustomerInfoUpdateListener(oyente);
      return () => {
        Purchases.removeCustomerInfoUpdateListener(oyente);
      };
    },

    async urlGestion() {
      return (await Purchases.getCustomerInfo()).managementURL;
    },
  };
}
