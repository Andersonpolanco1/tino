import { Platform } from 'react-native';
import Purchases, {
  INTRO_ELIGIBILITY_STATUS,
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesPackage,
  type PurchasesStoreProduct,
} from 'react-native-purchases';
import type { EstadoPro, OfertaPro, PeriodoPrueba, ServicioSuscripciones, TipoOferta } from './servicio';

// Derecho de RevenueCat que desbloquea Pro, y paquete propio del precio de lanzamiento
// (decisión D58). Quitar el paquete de la oferta en RevenueCat lo retira sin actualizar la app.
const DERECHO_PRO = 'pro';
const PAQUETE_LANZAMIENTO = 'lanzamiento';

const tienePro = (info: CustomerInfo) => !!info.entitlements.active[DERECHO_PRO];

const fechaLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Solo interesa el fin de una prueba que se va a cobrar: si ya la canceló, no hay nada que avisar.
function estadoDe(info: CustomerInfo): EstadoPro {
  const derecho = info.entitlements.active[DERECHO_PRO];
  const enPrueba = !!derecho && derecho.periodType === 'TRIAL' && derecho.willRenew && !!derecho.expirationDate;
  return { pro: !!derecho, finPrueba: enPrueba ? fechaLocal(new Date(derecho.expirationDate!)) : null };
}

// En iOS la prueba se da una vez por grupo de suscripción: prometerla a quien ya la usó es
// engañoso y Apple lo rechaza. Si no se sabe, no se muestra. Android ya no ofrece la fase gratis.
async function conElegibilidad(ofertas: OfertaPro[], productos: Map<string, string>): Promise<OfertaPro[]> {
  if (Platform.OS !== 'ios' || !ofertas.some(o => o.prueba)) return ofertas;
  try {
    const elegibles = await Purchases.checkTrialOrIntroductoryPriceEligibility([...productos.values()]);
    return ofertas.map(o => {
      const estado = elegibles[productos.get(o.id) ?? '']?.status;
      return estado === INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE ? o : { ...o, prueba: null };
    });
  } catch {
    return ofertas.map(o => ({ ...o, prueba: null }));
  }
}

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
          precioValor: p.product.price,
          precioPorMes: tipo === 'mensual' ? null : p.product.pricePerMonthString,
          prueba: pruebaDe(p.product),
        });
      }
      const orden: TipoOferta[] = ['lanzamiento', 'anual', 'mensual'];
      const productos = new Map(disponibles.map(p => [p.identifier, p.product.identifier]));
      return conElegibilidad(
        lista.sort((a, b) => orden.indexOf(a.tipo) - orden.indexOf(b.tipo)),
        productos,
      );
    },

    async comprar(id) {
      const paquete = paquetes.get(id);
      if (!paquete) return 'sin_pro';
      try {
        const { customerInfo } = await Purchases.purchasePackage(paquete);
        return tienePro(customerInfo) ? 'pro' : 'sin_pro';
      } catch (e) {
        const error = e as { userCancelled?: boolean | null; code?: string };
        if (error.userCancelled) return 'cancelada';
        if (error.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) return 'pendiente';
        throw e;
      }
    },

    async restaurar() {
      return tienePro(await Purchases.restorePurchases());
    },

    async estado() {
      return estadoDe(await Purchases.getCustomerInfo());
    },

    alCambiar(escuchar) {
      const oyente = (info: CustomerInfo) => escuchar(estadoDe(info));
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
