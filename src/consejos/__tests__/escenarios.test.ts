import { consejosDeFechas } from '../fechas';
import { COBROS, escenarios, HOY, pais } from '../../../herramientas/consejos/escenarios';

// Decisión D73: escenarios de la vida real dominicana (1 a 4 tarjetas con cobros semanales de
// plataformas, quincenales, mensuales, del Gobierno, pensiones, remesas, independientes y sus
// combinaciones) con el consejo esperado de cada uno, revisado caso a caso con el simulador de
// herramientas/consejos. Los que no aparecen aquí no deben recibir ningún consejo.
// "cobro:X" = el pago de X queda lejos del cobro; "+separa" = el mismo cambio separa los cortes;
// "cortes:X" = los cortes están juntos y conviene mover X.
const ESPERADO: Record<number, string[]> = {
  9: ['cobro:Santa Cruz'],
  13: ['cobro:Santa Cruz'],
  25: ['cobro:Popular'],
  27: ['cobro:Popular'],
  29: ['cobro:Popular'],
  50: ['cobro:BHD'],
  55: ['cobro:BHD'],
  61: ['cortes:A'],
  62: ['cortes:A'],
  63: ['cortes:A'],
  64: ['cobro:B+separa', 'cobro:A'],
  65: ['cortes:A'],
  66: ['cobro:B+separa', 'cobro:A'],
  67: ['cortes:A'],
  68: ['cortes:B'],
  69: ['cortes:A'],
  70: ['cortes:A'],
  71: ['cortes:A'],
  72: ['cortes:A'],
  76: ['cobro:A'],
  78: ['cobro:A'],
  88: ['cobro:Banreservas'],
  90: ['cobro:Banreservas'],
  92: ['cobro:Santa Cruz'],
  93: ['cobro:Banreservas'],
  97: ['cortes:Popular'],
  98: ['cortes:Popular'],
  99: ['cortes:Popular'],
  100: ['cobro:Banreservas+separa'],
  101: ['cortes:Popular'],
  102: ['cobro:Banreservas+separa'],
  103: ['cortes:Popular'],
  104: ['cobro:Popular+separa'],
  105: ['cortes:Popular'],
  106: ['cortes:Popular'],
  107: ['cortes:Popular'],
  108: ['cortes:Popular'],
  109: ['cortes:B'],
  110: ['cortes:B'],
  111: ['cortes:B'],
  112: ['cobro:C+separa', 'cobro:B'],
  113: ['cortes:B'],
  114: ['cortes:B'],
  115: ['cortes:B'],
  116: ['cortes:B'],
  117: ['cortes:B'],
  118: ['cortes:B'],
  122: ['cobro:A'],
  125: ['cobro:B'],
  132: ['cobro:Popular'],
  139: ['cortes:B'],
  140: ['cortes:B'],
  141: ['cobro:D+separa', 'cobro:C'],
  142: ['cortes:B'],
  143: ['cortes:B'],
  144: ['cortes:B'],
  145: ['cortes:B'],
  146: ['cortes:B'],
  149: ['cobro:B'],
  157: ['cobro:B', 'cobro:A'],
  163: ['cobro:Visa doble'],
  166: ['cobro:Visa doble'],
  168: ['cobro:Scotiabank'],
  169: ['cobro:Scotiabank'],
  171: ['cobro:B', 'cobro:A'],
  172: ['cortes:A'],
};

test('hay más de 150 escenarios', () => {
  expect(escenarios.length).toBeGreaterThanOrEqual(150);
});

test.each(escenarios.map((e, i) => [i + 1, e] as const))('escenario %i', (n, e) => {
  const porId = new Map(e.tarjetas.map(t => [t.id, t]));
  const consejos = consejosDeFechas({ hoy: HOY, tarjetas: e.tarjetas, ingresos: COBROS[e.cobros], pais, enfoque: e.enfoque }).map(
    c => `${c.tipo === 'pagoLejosDelCobro' ? 'cobro' : 'cortes'}:${porId.get(c.tarjetaId)!.alias}${c.separaCortes ? '+separa' : ''}`,
  );
  const escenario = `${e.grupo}: ${e.nombre} · ${e.cobros}`;
  expect({ escenario, consejos }).toEqual({ escenario, consejos: ESPERADO[n] ?? [] });
});
