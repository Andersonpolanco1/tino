import type { Recompensa } from '../tipos/tipos';

export interface ValorRecompensa {
  puntos: number;
  cashback: number;
}

// Sección 5.2. Los puntos por transacción solo cuentan en "Tengo una compra".
export function valorRecompensa(recompensa: Recompensa, monto: number, esCompra: boolean): ValorRecompensa {
  switch (recompensa.tipo) {
    case 'ninguna':
      return { puntos: 0, cashback: 0 };
    case 'cashback':
      return { puntos: 0, cashback: (monto * recompensa.porcentaje) / 100 };
    case 'puntos': {
      const { regla, valorPunto } = recompensa;
      switch (regla.tipo) {
        case 'por_monto':
          return { puntos: (monto / regla.porCadaMonto) * regla.puntos * valorPunto, cashback: 0 };
        case 'por_porcentaje':
          return { puntos: ((monto * regla.porcentaje) / 100) * valorPunto, cashback: 0 };
        case 'por_transaccion':
          return { puntos: esCompra ? regla.puntos * valorPunto : 0, cashback: 0 };
      }
    }
  }
}
