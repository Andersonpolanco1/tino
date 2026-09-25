// Sección 6 técnica: bloqueo al abrir y al volver después de 1 minuto en segundo plano.
export const MINUTOS_PARA_BLOQUEAR = 1;

// ultimaSalida = cuándo pasó la app a segundo plano (ms); null = recién abierta.
export function debeBloquear(ultimaSalida: number | null, ahora: number, minutos = MINUTOS_PARA_BLOQUEAR): boolean {
  return ultimaSalida === null || ahora - ultimaSalida >= minutos * 60_000;
}
