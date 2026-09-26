import type { CodigoMoneda, ModoEnfoque, MonedaFacturacion, Tarjeta } from '../tipos/tipos';
import type { TipoSugerencia } from '../sugerencias/elegir';
import { enviar } from './cliente';

// Lista cerrada de eventos de la sección 10 técnica: una función por evento y solo las
// propiedades permitidas, en categorías o rangos. Nunca montos, alias, números ni fechas.
// `orden_cambiado` salió con la decisión D30; los de suscripción llegan desde RevenueCat.

export type RangoTarjetas = '0' | '1' | '2' | '3-4' | '5+';

export function rangoTarjetas(n: number): RangoTarjetas {
  if (n <= 0) return '0';
  if (n === 1) return '1';
  if (n === 2) return '2';
  return n <= 4 ? '3-4' : '5+';
}

// Tramos de 30 segundos hasta 10 minutos; más allá, un solo tramo.
const TRAMO_SEGUNDOS = 30;
const TOPE_SEGUNDOS = 600;

export function rangoDuracion(segundos: number): string {
  if (segundos >= TOPE_SEGUNDOS) return `${TOPE_SEGUNDOS}+`;
  const desde = Math.floor(Math.max(0, segundos) / TRAMO_SEGUNDOS) * TRAMO_SEGUNDOS;
  return `${desde}-${desde + TRAMO_SEGUNDOS}`;
}

// El onboarding se mide desde la bienvenida hasta ver la tarjeta de hoy (sección 17.2).
let inicioOnboarding: number | null = null;

export function marcarInicioOnboarding(ahora: number = Date.now()) {
  if (inicioOnboarding === null) inicioOnboarding = ahora;
}

export function registrarOnboardingCompletado(datos: { tarjetas: number; hayIngresos: boolean }, ahora: number = Date.now()) {
  const duracion = inicioOnboarding === null ? 'desconocida' : rangoDuracion((ahora - inicioOnboarding) / 1000);
  inicioOnboarding = null;
  enviar('onboarding_completado', { duracion, tarjetas: rangoTarjetas(datos.tarjetas), ingresos_registrados: datos.hayIngresos });
}

// Banco y producto del catálogo, u "otro" si no está (sección 4.1: mide lo que falta catalogar).
// "No sé el tipo" se distingue de "Otro" para la métrica de producto desconocido (17.2).
export function registrarTarjetaRegistrada(tarjeta: Tarjeta) {
  const producto = tarjeta.productoId ?? (tarjeta.productoDesconocido ? 'no_se' : 'otro');
  const moneda: MonedaFacturacion = tarjeta.monedaFacturacion;
  enviar('tarjeta_registrada', {
    emisor: tarjeta.emisorId ?? 'otro',
    producto,
    moneda_facturacion: moneda,
    recompensa: tarjeta.recompensa.tipo,
  });
}

export function registrarInicioVisto(datos: { enfoque: ModoEnfoque; tarjetas: number }) {
  enviar('inicio_visto', { enfoque: datos.enfoque, tarjetas: rangoTarjetas(datos.tarjetas) });
}

export function registrarEnfoqueCambiado(anterior: ModoEnfoque, nuevo: ModoEnfoque) {
  enviar('enfoque_cambiado', { anterior, nuevo });
}

// Solo la moneda de la compra: el monto nunca sale del teléfono. Sin categoría (decisión D27).
export function registrarConsultaCompra(moneda: CodigoMoneda) {
  enviar('consulta_compra', { moneda });
}

export function registrarWidgetVisto(plataforma: 'android' | 'ios') {
  enviar('widget_visto', { plataforma });
}

export function registrarSugerenciaMostrada(tipo: TipoSugerencia) {
  enviar('sugerencia_mostrada', { tipo });
}

export function registrarSugerenciaAceptada(tipo: TipoSugerencia) {
  enviar('sugerencia_aceptada', { tipo });
}

export function registrarSugerenciaDescartada(tipo: TipoSugerencia) {
  enviar('sugerencia_descartada', { tipo });
}

export function registrarMuroPagoVisto(motivo: 'tercera_tarjeta' | 'funcion_avanzada') {
  enviar('muro_pago_visto', { motivo });
}
