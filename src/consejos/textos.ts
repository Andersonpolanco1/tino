import type { Tarjeta } from '../tipos/tipos';
import type { Traducir } from '../inicio/vista';
import type { ConsejoFechas } from './fechas';

// Decisión D75: breves y directos, en palabras de cualquier tarjetahabiente. Sin fechas de corte
// exactas: Tino no sabe qué ciclos ofrece cada banco (D73).
export interface TextosConsejo {
  titulo: string;
  // Qué pasa, en una frase con las fechas del usuario.
  problema: string;
  // Qué hacer: a quién llamar y qué pedir.
  solucion: string;
  // Qué hacer mientras tanto, si aplica.
  mientras: string | null;
}

// "5, 12 y 20": los días de corte de hoy, sin repetir.
function listaDias(dias: number[], t: Traducir): string {
  const unicos = [...new Set(dias)].sort((a, b) => a - b).map(String);
  if (unicos.length === 1) return unicos[0];
  return t('consejos.listaY', { inicio: unicos.slice(0, -1).join(', '), ultimo: unicos[unicos.length - 1] });
}

export function textosConsejo(consejo: ConsejoFechas, tarjetas: Tarjeta[], t: Traducir): TextosConsejo {
  const alias = tarjetas.find(x => x.id === consejo.tarjetaId)?.alias ?? '';

  if (consejo.tipo === 'cortesJuntos') {
    const datos = { alias, cortes: listaDias(consejo.cortes, t), peorDia: consejo.peorDia };
    const solucion = t('consejos.cortesJuntos.solucion', datos);
    return {
      titulo: t('consejos.cortesJuntos.titulo'),
      problema: t('consejos.cortesJuntos.problema', datos),
      solucion: consejo.conCobros ? `${solucion} ${t('consejos.cortesJuntos.cuidaCobro')}` : solucion,
      mientras: null,
    };
  }

  // Sin el día del cobro siguiente (pasa con pocas fechas personalizadas), sin fechas.
  const conDia = consejo.diaCobro > 0;
  const datos = { alias, pago: consejo.diaPago, cobro: consejo.diaCobro, dias: consejo.diasDesdeCobro };
  const problema = conDia ? (consejo.enDolares ? 'problemaDolares' : 'problema') : 'problemaSinDia';
  const solucion = t(`consejos.pagoLejosDelCobro.${conDia ? 'solucion' : 'solucionSinDia'}`, datos);
  return {
    titulo: t('consejos.pagoLejosDelCobro.titulo', datos),
    problema: t(`consejos.pagoLejosDelCobro.${problema}`, datos),
    solucion: consejo.separaCortes ? `${solucion} ${t('consejos.pagoLejosDelCobro.separa')}` : solucion,
    mientras: t('consejos.pagoLejosDelCobro.mientras'),
  };
}
