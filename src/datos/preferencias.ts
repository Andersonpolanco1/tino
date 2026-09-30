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
    // Decisión D88: apagada hasta que el usuario responda a "¿Nos ayudas a mejorar Tino?".
    analiticaActiva: false,
    plan: 'gratis',
  };
}
