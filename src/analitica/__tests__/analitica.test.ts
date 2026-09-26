import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import type { Tarjeta } from '../../tipos/tipos';
import { configurarAnalitica, esperarTransporte, usarTransporte, type Propiedades, type Transporte } from '../cliente';
import * as eventos from '../eventos';

// Datos de ejemplo que nunca pueden salir del teléfono.
const ALIAS = 'Visa de mamá';
const ULTIMOS4 = '4821';
const MONTO = 12345.67;

const tarjeta: Tarjeta = {
  id: 'tarjeta-1',
  alias: ALIAS,
  emisorId: 'banreservas',
  productoId: 'banreservas-visa-gold',
  productoDesconocido: false,
  ultimos4: ULTIMOS4,
  diaCorte: 15,
  fechaLimite: { tipo: 'dias_despues_corte', dias: 20 },
  ajusteDiaNoHabil: 'adelantar',
  compraEnDiaDeCorte: 'entra_en_siguiente',
  monedaFacturacion: 'doble_balance',
  recompensa: { tipo: 'puntos', regla: { tipo: 'por_monto', puntos: 1, porCadaMonto: 100 }, valorPunto: 1, valorPuntoConfirmado: false },
  enPausa: false,
  creadaEn: '2026-09-26',
};

function transporteFalso() {
  const enviados: { evento: string; propiedades: Propiedades }[] = [];
  const t: Transporte & { enviados: typeof enviados; apagado: boolean } = {
    enviados,
    apagado: false,
    capturar: (evento, propiedades) => enviados.push({ evento, propiedades }),
    apagar: () => (t.apagado = true),
    encender: () => (t.apagado = false),
    cerrar: jest.fn(),
  };
  return t;
}

// Cada evento de la lista cerrada, llamado con datos de ejemplo.
function registrarTodos() {
  eventos.marcarInicioOnboarding(0);
  eventos.registrarOnboardingCompletado({ tarjetas: 3, hayIngresos: true }, 95_000);
  eventos.registrarTarjetaRegistrada(tarjeta);
  eventos.registrarTarjetaRegistrada({ ...tarjeta, emisorId: null, emisorTextoLibre: 'Mi cooperativa', productoId: null, productoDesconocido: true });
  eventos.registrarInicioVisto({ enfoque: 'puntos', tarjetas: 7 });
  eventos.registrarEnfoqueCambiado('equilibrado', 'liquidez');
  eventos.registrarConsultaCompra('USD');
  eventos.registrarWidgetVisto('android');
  eventos.registrarSugerenciaMostrada('valorPunto');
  eventos.registrarSugerenciaAceptada('valorPunto');
  eventos.registrarSugerenciaDescartada('cobros');
  eventos.registrarMuroPagoVisto('tercera_tarjeta');
}

let transporte: ReturnType<typeof transporteFalso>;
beforeEach(() => {
  transporte = transporteFalso();
  configurarAnalitica({ activa: true, pais: 'DO' });
  usarTransporte(transporte);
});

describe('eventos sin datos personales (sección 10 técnica y 17.5)', () => {
  it('ninguna propiedad lleva montos, alias, últimos 4, textos libres ni 13 a 19 dígitos', () => {
    registrarTodos();
    expect(transporte.enviados).toHaveLength(11);
    for (const { propiedades } of transporte.enviados) {
      for (const valor of Object.values(propiedades)) {
        // Solo categorías o sí/no: un número suelto sería un monto o un conteo exacto.
        expect(['string', 'boolean']).toContain(typeof valor);
        if (typeof valor !== 'string') continue;
        expect(valor).not.toMatch(/\d{13,19}/);
        expect(valor).not.toContain(ALIAS);
        expect(valor).not.toContain(ULTIMOS4);
        expect(valor).not.toContain('Mi cooperativa');
        expect(valor).not.toContain(String(Math.floor(MONTO)));
        // Si lleva cifras, es un rango ("3-4", "90-120", "5+"); nunca una fecha ni un valor.
        if (/\d/.test(valor)) expect(valor).toMatch(/^\d+(-\d+|\+)?$/);
      }
    }
  });

  it('todos los eventos incluyen el país (18.6)', () => {
    registrarTodos();
    for (const { propiedades } of transporte.enviados) expect(propiedades.pais).toBe('DO');
  });

  it('banco o producto fuera del catálogo se envían como "otro" y "no_se" (4.1)', () => {
    eventos.registrarTarjetaRegistrada({ ...tarjeta, emisorId: null, productoId: null, productoDesconocido: false });
    eventos.registrarTarjetaRegistrada({ ...tarjeta, productoId: null, productoDesconocido: true });
    expect(transporte.enviados.map(e => [e.propiedades.emisor, e.propiedades.producto])).toEqual([
      ['otro', 'otro'],
      ['banreservas', 'no_se'],
    ]);
  });

  it('la duración y las tarjetas van en rangos', () => {
    expect(eventos.rangoTarjetas(0)).toBe('0');
    expect(eventos.rangoTarjetas(2)).toBe('2');
    expect(eventos.rangoTarjetas(4)).toBe('3-4');
    expect(eventos.rangoTarjetas(12)).toBe('5+');
    expect(eventos.rangoDuracion(0)).toBe('0-30');
    expect(eventos.rangoDuracion(95)).toBe('90-120');
    expect(eventos.rangoDuracion(3600)).toBe('600+');
  });
});

describe('interruptor de privacidad (17.5)', () => {
  it('apagada, descarta los eventos y apaga el servicio de inmediato', () => {
    configurarAnalitica({ activa: false, pais: 'DO' });
    expect(transporte.apagado).toBe(true);
    registrarTodos();
    expect(transporte.enviados).toHaveLength(0);

    configurarAnalitica({ activa: true, pais: 'DO' });
    expect(transporte.apagado).toBe(false);
    eventos.registrarWidgetVisto('android');
    expect(transporte.enviados).toHaveLength(1);
  });

  it('un servicio nuevo nace apagado si la analítica está apagada, y el anterior se cierra', () => {
    configurarAnalitica({ activa: false, pais: 'DO' });
    const nuevo = transporteFalso();
    usarTransporte(nuevo);
    expect(transporte.cerrar).toHaveBeenCalled();
    expect(nuevo.apagado).toBe(true);
  });

  it('mientras el servicio carga, los eventos esperan en memoria y salen al estar listo', () => {
    usarTransporte(null);
    esperarTransporte();
    eventos.registrarInicioVisto({ enfoque: 'equilibrado', tarjetas: 2 });
    const nuevo = transporteFalso();
    usarTransporte(nuevo);
    expect(nuevo.enviados).toEqual([{ evento: 'inicio_visto', propiedades: { enfoque: 'equilibrado', tarjetas: '2', pais: 'DO' } }]);
  });

  it('apagar la analítica mientras carga descarta lo que esperaba', () => {
    usarTransporte(null);
    esperarTransporte();
    eventos.registrarInicioVisto({ enfoque: 'equilibrado', tarjetas: 2 });
    configurarAnalitica({ activa: false, pais: 'DO' });
    configurarAnalitica({ activa: true, pais: 'DO' });
    const nuevo = transporteFalso();
    usarTransporte(nuevo);
    expect(nuevo.enviados).toEqual([]);
  });

  it('sin servicio configurado no se envía nada', () => {
    usarTransporte(null);
    expect(() => registrarTodos()).not.toThrow();
    expect(transporte.enviados).toHaveLength(0);
  });
});

// Sección 10: `src/analitica/` es el único lugar que puede enviar eventos.
it('solo src/analitica importa el servicio de analítica', () => {
  const raiz = join(__dirname, '../../..');
  const fuera: string[] = [];
  const recorrer = (dir: string) => {
    for (const nombre of readdirSync(dir)) {
      const ruta = join(dir, nombre);
      if (statSync(ruta).isDirectory()) recorrer(ruta);
      else if (/\.tsx?$/.test(nombre) && !ruta.includes(join('src', 'analitica')) && readFileSync(ruta, 'utf8').includes('posthog-react-native')) fuera.push(ruta);
    }
  };
  recorrer(join(raiz, 'src'));
  recorrer(join(raiz, 'app'));
  expect(fuera).toEqual([]);
});
