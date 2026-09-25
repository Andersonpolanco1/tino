import type { CodigoPais, Preferencias } from '../tipos/tipos';

// Valores de partida (secciones 4.3 y 5.3 técnica); el usuario los cambia desde la app.
export function preferenciasIniciales(pais: CodigoPais, idioma: string): Preferencias {
  return {
    pais,
    idioma,
    enfoque: { modo: 'equilibrado' },
    pagoBalanceUsd: null,
    diferencialCambiarioPct: 6,
    umbralCorteCercanoDias: 3,
    analiticaActiva: true,
    plan: 'gratis',
  };
}
