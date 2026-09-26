import type { ConfigPais, EntradaMotor, FechaISO, ResultadoTarjeta, Tarjeta } from '../tipos/tipos';
import { calcularRanking } from '../motor';
import { aFecha, corteAnterior, fechaLimite, leer, numeroDe, proximoCorte } from '../motor/fechas';
import { formatearFecha, formatearMoneda } from '../i18n/formato';

export type Traducir = (clave: string, opciones?: Record<string, unknown>) => string;

export type TipoEtiqueta = 'recompensa' | 'alerta' | 'neutra';

export interface EtiquetaVista {
  tipo: TipoEtiqueta;
  texto: string;
}

interface Contexto {
  t: Traducir;
  pais: ConfigPais;
  idioma: string;
}

// Recompensa que corresponde: la de dólares si la compra es en la moneda secundaria y la tarjeta la tiene.
function recompensaAplicada(tarjeta: Tarjeta, pais: ConfigPais, compra?: EntradaMotor['compra']) {
  const enSecundaria = !!compra && pais.monedaSecundaria !== null && compra.moneda === pais.monedaSecundaria;
  return enSecundaria && tarjeta.recompensaUsd ? tarjeta.recompensaUsd : tarjeta.recompensa;
}

// Ranking de hoy: "15 pts por RD$1,000" o "RD$20 cashback por RD$1,000" (tabla 3.2).
// Tengo una compra: "15 pts en esta compra" o "RD$20 de cashback en esta compra".
// Los puntos se muestran en puntos; el motor los compara por su valor en dinero.
export function textoRecompensa(
  tarjeta: Tarjeta,
  resultado: ResultadoTarjeta,
  { t, pais, idioma }: Contexto,
  compra?: EntradaMotor['compra'],
): string | null {
  const r = recompensaAplicada(tarjeta, pais, compra);
  if (r.tipo === 'ninguna' || resultado.valorRecompensa === 0) return null;
  const moneda = compra?.moneda ?? pais.monedaPrincipal;
  if (r.tipo === 'cashback') {
    const valor = formatearMoneda(resultado.valorRecompensa, moneda, idioma);
    return compra ? t('compra.ganasCashback', { valor }) : t('inicio.recompensaCashback', { valor, monto: formatearMoneda(pais.montoReferencia, moneda, idioma) });
  }
  const puntos = (Math.round((resultado.valorRecompensa / r.valorPunto) * 100) / 100).toLocaleString(idioma);
  return compra ? t('compra.ganasPuntos', { puntos }) : t('inicio.recompensaPuntos', { puntos, monto: formatearMoneda(pais.montoReferencia, moneda, idioma) });
}

export function etiquetasDe(tarjeta: Tarjeta, resultado: ResultadoTarjeta, { t }: Contexto): EtiquetaVista[] {
  const etiquetas: EtiquetaVista[] = [];
  if (resultado.etiquetas.includes('corta_pronto')) etiquetas.push({ tipo: 'alerta', texto: t('etiqueta.cortaPronto', { dias: resultado.diasParaCorte }) });
  if (resultado.etiquetas.includes('vence_antes_del_cobro')) etiquetas.push({ tipo: 'alerta', texto: t('etiqueta.venceAntesDelCobro') });
  if (tarjeta.monedaFacturacion === 'doble_balance') etiquetas.push({ tipo: 'neutra', texto: t('etiqueta.pesosYDolares') });
  if (tarjeta.monedaFacturacion === 'solo_usd') etiquetas.push({ tipo: 'neutra', texto: t('etiqueta.dolares') });
  if (tarjeta.monedaFacturacion === 'solo_local') etiquetas.push({ tipo: 'neutra', texto: t('etiqueta.local') });
  // Sección 4.2: con el valor del punto sin revisar, la comparación es aproximada.
  if (tarjeta.recompensa.tipo === 'puntos' && !tarjeta.recompensa.valorPuntoConfirmado) {
    etiquetas.push({ tipo: 'neutra', texto: t('etiqueta.aproximada') });
  }
  return etiquetas;
}

// Sección 3.4. En rojo se sugiere esperar al día siguiente del corte y cuántos días se ganan,
// calculado con el mismo motor.
export function mensajeSemaforo(tarjeta: Tarjeta, resultado: ResultadoTarjeta, entrada: EntradaMotor, t: Traducir): string {
  if (resultado.semaforo === 'verde') return t('semaforo.mensajeVerde', { dias: resultado.diasGracia });
  if (resultado.semaforo === 'amarillo') return t('semaforo.mensajeAmarillo', { dias: resultado.diasGracia });
  const despuesDelCorte = aFecha(numeroDe(resultado.proximoCorte) + 1);
  const alEsperar = calcularRanking({ ...entrada, hoy: despuesDelCorte, tarjetas: [{ ...tarjeta, enPausa: false }], compra: undefined })
    .ranking[0];
  return t('semaforo.mensajeRojo', { dia: leer(despuesDelCorte).dia, antes: resultado.diasGracia, despues: alEsperar.diasGracia });
}

// Franja "Próximo pago": el estado de cuenta ya cortado que falta pagar; si su fecha límite
// ya pasó, el del próximo corte.
export function proximoPago(tarjeta: Tarjeta, hoy: FechaISO, pais: ConfigPais): FechaISO {
  const feriados = new Set(pais.feriados);
  const n = numeroDe(hoy);
  const siguiente = proximoCorte(n, tarjeta);
  const anterior = corteAnterior(siguiente, tarjeta.diaCorte);
  const pagoAnterior = fechaLimite(anterior, tarjeta.fechaLimite, tarjeta.ajusteDiaNoHabil, feriados);
  return aFecha(pagoAnterior >= n ? pagoAnterior : fechaLimite(siguiente, tarjeta.fechaLimite, tarjeta.ajusteDiaNoHabil, feriados));
}

export function textoFecha(fecha: FechaISO, idioma: string): string {
  return formatearFecha(fecha, idioma);
}
