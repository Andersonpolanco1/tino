import type { ConfigPais, EntradaMotor, FechaISO, ResultadoTarjeta, Tarjeta } from '../tipos/tipos';
import { calcularRanking } from '../motor';
import { aFecha, corteAnterior, fechaLimite, numeroDe, proximoCorte } from '../motor/fechas';
import { formatearFecha, formatearMoneda, partesFechaLarga } from '../i18n/formato';

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

// Ranking de hoy: "20 pts por RD$1,000" o "RD$10 cashback por RD$1,000" (tabla 3.2); en la tarjeta
// de hoy, la forma corta "RD$10 por RD$1,000".
// Tengo una compra: "50 pts en esta compra" o "RD$25 de cashback en esta compra".
// Los puntos se muestran en puntos; el motor los compara por su valor en dinero.
export function textoRecompensa(
  tarjeta: Tarjeta,
  resultado: ResultadoTarjeta,
  { t, pais, idioma }: Contexto,
  compra?: EntradaMotor['compra'],
  corto = false,
): string | null {
  const r = recompensaAplicada(tarjeta, pais, compra);
  if (r.tipo === 'ninguna' || resultado.valorRecompensa === 0) return null;
  const moneda = compra?.moneda ?? pais.monedaPrincipal;
  const monto = formatearMoneda(pais.montoReferencia, moneda, idioma);
  if (r.tipo === 'cashback') {
    const valor = formatearMoneda(resultado.valorRecompensa, moneda, idioma);
    if (compra) return t('compra.ganasCashback', { valor });
    return t(corto ? 'inicio.recompensaCashbackCorta' : 'inicio.recompensaCashback', { valor, monto });
  }
  const puntos = (Math.round((resultado.valorRecompensa / r.valorPunto) * 100) / 100).toLocaleString(idioma);
  return compra ? t('compra.ganasPuntos', { puntos }) : t('inicio.recompensaPuntos', { puntos, monto });
}

// Valor de la recompensa de una compra, sin texto alrededor, para la tarjeta grande de Tengo una compra.
export function valorRecompensaCompra(tarjeta: Tarjeta, resultado: ResultadoTarjeta, { t, pais, idioma }: Contexto, compra: NonNullable<EntradaMotor['compra']>) {
  const r = recompensaAplicada(tarjeta, pais, compra);
  if (r.tipo === 'ninguna' || resultado.valorRecompensa === 0) return null;
  if (r.tipo === 'cashback') return { valor: formatearMoneda(resultado.valorRecompensa, compra.moneda, idioma), texto: t('compra.deCashback') };
  const puntos = (Math.round((resultado.valorRecompensa / r.valorPunto) * 100) / 100).toLocaleString(idioma);
  return { valor: t('compra.puntosCorto', { puntos }), texto: t('compra.enPuntos') };
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

// "21 de nov." (rediseño).
export function fechaCorta(fecha: FechaISO, idioma: string, t: Traducir): string {
  const { dia, mes } = partesFechaLarga(fecha, idioma);
  return t('comun.fechaCorta', { dia, mes });
}

// "martes 6".
export function diaConSemana(fecha: FechaISO, idioma: string, t: Traducir): string {
  const { diaSemana, dia } = partesFechaLarga(fecha, idioma);
  return t('comun.diaConSemana', { diaSemana: diaSemana.toLocaleLowerCase(idioma), dia });
}

// Iniciales del banco para el chip de la tarjeta y el círculo de la lista: "BHD", "PO", "BR".
export function inicialesBanco(banco: string): string {
  const limpio = banco.trim();
  if (!limpio) return '';
  if (/^[A-ZÁÉÍÓÚÑ0-9]{2,4}$/.test(limpio)) return limpio;
  const palabras = limpio.split(/\s+/).filter(p => p.length > 2 || /^[A-Z]/.test(p));
  if (palabras.length >= 2) return (palabras[0][0] + palabras[1][0]).toUpperCase();
  return limpio.slice(0, 2).toUpperCase();
}

// Corte anterior y cuánto del ciclo ya pasó, para la barra de la tarjeta de hoy.
export function cicloDe(tarjeta: Tarjeta, resultado: ResultadoTarjeta, hoy: FechaISO) {
  const siguiente = numeroDe(resultado.proximoCorte);
  const anterior = corteAnterior(siguiente, tarjeta.diaCorte);
  const fraccion = siguiente > anterior ? Math.min(1, Math.max(0, (numeroDe(hoy) - anterior) / (siguiente - anterior))) : 1;
  return { anterior: aFecha(anterior), fraccion };
}

// En rojo: los días que tendría una compra hecha el día después del corte, con el mismo motor.
export function esperarA(tarjeta: Tarjeta, resultado: ResultadoTarjeta, entrada: EntradaMotor) {
  const fecha = aFecha(numeroDe(resultado.proximoCorte) + 1);
  const dias = calcularRanking({ ...entrada, hoy: fecha, tarjetas: [{ ...tarjeta, enPausa: false }], compra: undefined }).ranking[0].diasGracia;
  return { fecha, dias };
}

// Sección 3.4, con los textos del rediseño.
export function mensajeSemaforo(tarjeta: Tarjeta, resultado: ResultadoTarjeta, entrada: EntradaMotor, t: Traducir, idioma = 'es-DO'): string {
  if (resultado.semaforo === 'verde') return t('semaforo.mensajeVerde', { dias: resultado.diasGracia });
  if (resultado.semaforo === 'amarillo') return t('semaforo.mensajeAmarillo', { dias: resultado.diasGracia });
  const esperar = esperarA(tarjeta, resultado, entrada);
  const dia = diaConSemana(esperar.fecha, idioma, t);
  return esperar.dias >= resultado.diasGracia * 2
    ? t('semaforo.mensajeRojoDoble', { dia })
    : t('semaforo.mensajeRojo', { dia, antes: resultado.diasGracia, despues: esperar.dias });
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
