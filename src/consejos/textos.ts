import type { Tarjeta } from '../tipos/tipos';
import { fechaCorta, type Traducir } from '../inicio/vista';
import type { ConsejoFechas } from './fechas';

export interface TextosConsejo {
  titulo: string;
  // Qué pasa hoy, en una o dos frases.
  problema: string;
  // Qué pedirle al banco y qué gana.
  solucion: string;
  // Qué hacer si el banco no puede cambiar la fecha.
  siNoPuede: string;
  // "entre el 17 y el 21" o "el día 19".
  rango: string;
  // Una línea para la lista de la pestaña Tarjetas.
  resumen: string;
  pasos: string[];
}

// "5, 12 y 20": los días de corte de hoy, sin repetir.
function listaDias(dias: number[], t: Traducir): string {
  const unicos = [...new Set(dias)].sort((a, b) => a - b).map(String);
  if (unicos.length === 1) return unicos[0];
  return t('consejos.listaY', { inicio: unicos.slice(0, -1).join(', '), ultimo: unicos[unicos.length - 1] });
}

// Los textos de un consejo de fechas (decisión D65), en palabras simples y sin montos.
export function textosConsejo(consejo: ConsejoFechas, tarjetas: Tarjeta[], t: Traducir, idioma: string): TextosConsejo {
  const alias = tarjetas.find(x => x.id === consejo.tarjetaId)?.alias ?? '';
  const rango =
    consejo.corteDesde === consejo.corteHasta
      ? t('consejos.dia', { dia: consejo.corteSugerido })
      : t('consejos.rango', { desde: consejo.corteDesde, hasta: consejo.corteHasta });
  const fecha = (f: string | undefined) => (f ? fechaCorta(f, idioma, t) : '');
  const datos = {
    alias,
    rango,
    antes: consejo.mesesAntes,
    revisados: consejo.mesesRevisados,
    diasAntes: consejo.peorDiaAntes,
    diasDespues: consejo.peorDiaDespues,
    pago: fecha(consejo.pagoEjemplo),
    cobro: fecha(consejo.cobroEjemplo),
    cargado: fecha(consejo.cobroCargado),
    libre: fecha(consejo.cobroLibre),
    cortes: listaDias(consejo.cortesActuales, t),
    cantidad: consejo.cortesActuales.length,
  };
  const tipo = `consejos.${consejo.tipo}`;
  let problema = t(consejo.enDolares ? `${tipo}.problemaDolares` : `${tipo}.problema`, datos);
  if (consejo.tipo === 'pagoAntesDelCobro' && consejo.cobroEstimado) problema += ` ${t('consejos.pagoAntesDelCobro.margenEstimado')}`;
  let solucion = t(consejo.cobroEjemplo ? `${tipo}.solucion` : `${tipo}.solucionSinCobro`, datos);
  if (consejo.tambienDias) solucion += ` ${t('consejos.mismoCobro.tambienDias', datos)}`;
  return {
    titulo: t(`${tipo}.titulo`, datos),
    problema,
    solucion,
    siNoPuede: t(`${tipo}.siNoPuede`, datos),
    rango,
    resumen: t('consejos.resumen', datos),
    pasos: [t('consejos.paso1', datos), t('consejos.paso2', datos), t('consejos.paso3'), t('consejos.paso4')],
  };
}
