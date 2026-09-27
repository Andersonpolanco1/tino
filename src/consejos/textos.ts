import type { Tarjeta } from '../tipos/tipos';
import { fechaCorta, type Traducir } from '../inicio/vista';
import type { ConsejoFechas } from './fechas';

export interface TextosConsejo {
  titulo: string;
  explicacion: string;
  // "entre el 17 y el 21" o "el día 19".
  rango: string;
  // Una línea para la lista de la pestaña Tarjetas.
  resumen: string;
  pasos: string[];
}

// Los textos de un consejo de fechas (decisión D65), en palabras simples y sin montos.
export function textosConsejo(consejo: ConsejoFechas, tarjetas: Tarjeta[], t: Traducir, idioma: string): TextosConsejo {
  const alias = tarjetas.find(x => x.id === consejo.tarjetaId)?.alias ?? '';
  const otra = tarjetas.find(x => x.id === consejo.conTarjetaId)?.alias ?? '';
  const rango =
    consejo.corteDesde === consejo.corteHasta
      ? t('consejos.dia', { dia: consejo.corteSugerido })
      : t('consejos.rango', { desde: consejo.corteDesde, hasta: consejo.corteHasta });
  const fecha = (f: string) => fechaCorta(f, idioma, t);
  const datos = {
    alias,
    otra,
    rango,
    meses: consejo.antes.mesesAntesDelCobro,
    antes: consejo.antes.peorDia,
    despues: consejo.despues.peorDia,
    pago: fecha(consejo.pagoEjemplo),
    cobro: consejo.cobroEjemplo ? fecha(consejo.cobroEjemplo) : '',
  };
  const explicacion =
    consejo.tipo === 'pagoAntesDelCobro' && consejo.cobroEjemplo
      ? t('consejos.pagoAntesDelCobro.explicacionConCobro', datos)
      : t(`consejos.${consejo.tipo}.explicacion`, datos);
  return {
    titulo: t(`consejos.${consejo.tipo}.titulo`, datos),
    explicacion,
    rango,
    resumen: t('consejos.resumen', datos),
    pasos: [t('consejos.paso1', datos), t('consejos.paso2', datos), t('consejos.paso3'), t('consejos.paso4')],
  };
}
