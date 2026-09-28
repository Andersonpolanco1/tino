import type { Tarjeta } from '../tipos/tipos';
import type { Traducir } from '../inicio/vista';
import type { ConsejoFechas } from './fechas';

export interface TextosConsejo {
  titulo: string;
  // Qué pasa hoy, con las fechas del usuario.
  problema: string;
  // Qué pedirle al banco, sin fechas exactas: Tino no sabe qué ciclos ofrece cada banco (D73).
  solucion: string;
  siNoPuedeTitulo: string;
  // Qué hacer mientras tanto o si el banco no puede.
  siNoPuede: string;
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

// Los textos de un consejo de fechas (decisión D73), en palabras simples y sin montos.
export function textosConsejo(consejo: ConsejoFechas, tarjetas: Tarjeta[], t: Traducir): TextosConsejo {
  const alias = tarjetas.find(x => x.id === consejo.tarjetaId)?.alias ?? '';
  const pasoFinal = [t('consejos.paso3'), t('consejos.paso4')];

  if (consejo.tipo === 'cortesJuntos') {
    const datos = { alias, cortes: listaDias(consejo.cortes, t), peorDia: consejo.peorDia };
    const solucion = t('consejos.cortesJuntos.solucion', datos);
    return {
      titulo: t('consejos.cortesJuntos.titulo'),
      problema: t('consejos.cortesJuntos.problema', datos),
      solucion: consejo.conCobros ? `${solucion} ${t('consejos.cortesJuntos.cuidaCobro')}` : solucion,
      siNoPuedeTitulo: t('consejos.cortesJuntos.siNoPuedeTitulo'),
      siNoPuede: t('consejos.cortesJuntos.siNoPuede'),
      resumen: t('consejos.cortesJuntos.resumen', datos),
      pasos: [t('consejos.paso1', datos), t('consejos.cortesJuntos.paso2'), ...pasoFinal],
    };
  }

  // Sin el día del cobro siguiente (pasa si solo hay fechas personalizadas cortas), sin fechas.
  const conDia = consejo.diaCobro > 0;
  const datos = { alias, pago: consejo.diaPago, cobro: consejo.diaCobro, dias: consejo.diasDesdeCobro };
  const clave = (nombre: string, sinDia: string) => `consejos.pagoLejosDelCobro.${conDia ? nombre : sinDia}`;
  let problema = t(clave(consejo.enDolares ? 'problemaDolares' : 'problema', 'problemaSinDia'), datos);
  if (consejo.cobroEstimado) problema += ` ${t('consejos.pagoLejosDelCobro.margenEstimado')}`;
  let solucion = t(clave('solucion', 'solucionSinDia'), datos);
  if (consejo.separaCortes) solucion += ` ${t('consejos.pagoLejosDelCobro.separa')}`;
  return {
    titulo: t('consejos.pagoLejosDelCobro.titulo', datos),
    problema,
    solucion,
    siNoPuedeTitulo: t('consejos.pagoLejosDelCobro.siNoPuedeTitulo'),
    siNoPuede: t('consejos.pagoLejosDelCobro.siNoPuede'),
    resumen: t(clave('resumen', 'resumenSinDia'), datos),
    pasos: [t('consejos.paso1', datos), t(clave('paso2', 'paso2SinDia'), datos), ...pasoFinal],
  };
}
