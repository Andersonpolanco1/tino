import { descartarSugerencia, elegirSugerencia, ESTADO_INICIAL, type EstadoSugerencias, type TipoSugerencia } from '../elegir';

// Avanza día a día como lo haría la pantalla de inicio al abrirse cada día.
function dia(estado: EstadoSugerencias, candidatas: TipoSugerencia[], hoy: string) {
  return elegirSugerencia(estado, candidatas, hoy);
}

test('una sugerencia por semana: la misma sigue hasta que se descarte', () => {
  const a = dia(ESTADO_INICIAL, ['cobros', 'valorPunto'], '2026-10-01');
  expect(a.tipo).toBe('cobros');
  expect(dia(a.estado, ['cobros', 'valorPunto'], '2026-10-03').tipo).toBe('cobros');
  const descartada = descartarSugerencia(a.estado, 'cobros', '2026-10-03');
  // Descartada: nada más esa semana, ni siquiera otra.
  expect(dia(descartada, ['cobros', 'valorPunto'], '2026-10-05').tipo).toBeNull();
  // A la semana siguiente vuelve a elegir.
  expect(dia(descartada, ['cobros', 'valorPunto'], '2026-10-08').tipo).toBe('cobros');
});

test('si el dato ya se completó, la sugerencia desaparece', () => {
  const a = dia(ESTADO_INICIAL, ['cobros'], '2026-10-01');
  expect(dia(a.estado, [], '2026-10-02').tipo).toBeNull();
});

test('descartada dos veces no reaparece en 60 días (criterio 14.1)', () => {
  let s = dia(ESTADO_INICIAL, ['cobros', 'valorPunto'], '2026-10-01').estado;
  s = descartarSugerencia(s, 'cobros', '2026-10-01');
  s = dia(s, ['cobros', 'valorPunto'], '2026-10-08').estado;
  s = descartarSugerencia(s, 'cobros', '2026-10-08');
  // La semana siguiente muestra otra; cobros queda bloqueada.
  const siguiente = dia(s, ['cobros', 'valorPunto'], '2026-10-15');
  expect(siguiente.tipo).toBe('valorPunto');
  expect(dia(descartarSugerencia(siguiente.estado, 'valorPunto', '2026-10-15'), ['cobros'], '2026-12-06').tipo).toBeNull(); // día 59
  const vuelve = dia(descartarSugerencia(siguiente.estado, 'valorPunto', '2026-10-15'), ['cobros'], '2026-12-07'); // día 60
  expect(vuelve.tipo).toBe('cobros');
  expect(vuelve.estado.descartes.cobros).toBeUndefined();
});

test('sin candidatas no cambia el estado', () => {
  const r = dia(ESTADO_INICIAL, [], '2026-10-01');
  expect(r).toEqual({ tipo: null, estado: ESTADO_INICIAL });
  expect(r.estado).toBe(ESTADO_INICIAL);
});
