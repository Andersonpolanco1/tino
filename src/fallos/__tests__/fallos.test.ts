import { readFileSync } from 'fs';
import { join } from 'path';
import { configurarFallos, reportesActivos, usarServicioFallos, type ServicioFallos } from '../cliente';
import { limpiarEvento, limpiarTexto } from '../filtro';

describe('filtro de reportes (sección 7.3 técnica)', () => {
  test('borra números de 13 a 19 dígitos, también separados', () => {
    for (const numero of ['4111111111111111', '4111 1111 1111 1111', '4111-1111-1111-1', '5555.5555.5555.5555.555']) {
      expect(limpiarTexto(`No se pudo guardar ${numero} hoy`)).toBe('No se pudo guardar [filtrado] hoy');
    }
  });

  test('deja los números cortos', () => {
    expect(limpiarTexto('Tarjeta 4821, corte 15, 123456789012')).toBe('Tarjeta 4821, corte 15, 123456789012');
  });

  test('quita migas, persona, petición y datos extra, y limpia todo texto anidado', () => {
    const evento = {
      event_id: '1234567890123456abcdef1234567890',
      message: 'Falló con 4111111111111111',
      breadcrumbs: [{ message: 'Tocó "Visa de mamá"' }],
      user: { id: 'abc', ip_address: '1.2.3.4' },
      request: { url: 'https://ejemplo.com' },
      extra: { alias: 'Visa de mamá' },
      server_name: 'Teléfono de Ana',
      exception: {
        values: [
          {
            type: 'Error',
            value: 'Número 4111 1111 1111 1111',
            stacktrace: { frames: [{ filename: 'app.js', lineno: 10, instruction_addr: '0x0000000100001234567' }] },
          },
        ],
      },
      contexts: { app: { app_version: '1.0.0' }, trace: { trace_id: '12345678901234567890123456789012' } },
      tags: { nota: '4111111111111111' },
    };

    const limpio = limpiarEvento(evento) as Record<string, unknown>;

    for (const campo of ['breadcrumbs', 'user', 'request', 'extra', 'server_name']) expect(limpio).not.toHaveProperty(campo);
    expect(limpio.message).toBe('Falló con [filtrado]');
    expect(limpio.tags).toEqual({ nota: '[filtrado]' });
    const valor = (limpio.exception as typeof evento.exception).values[0];
    expect(valor.value).toBe('Número [filtrado]');
    expect(JSON.stringify(limpio)).not.toContain('4111');
    expect(JSON.stringify(limpio)).not.toContain('Visa de mamá');
    // Los identificadores técnicos quedan intactos.
    expect(limpio.event_id).toBe(evento.event_id);
    expect((limpio.contexts as typeof evento.contexts).trace.trace_id).toBe(evento.contexts.trace.trace_id);
    expect(valor.stacktrace.frames[0].instruction_addr).toBe('0x0000000100001234567');
    // No toca el evento original.
    expect(evento.breadcrumbs).toHaveLength(1);
  });
});

describe('interruptor de datos de uso anónimos (decisión D56)', () => {
  function servicioFalso() {
    return { iniciar: jest.fn(), detener: jest.fn() } satisfies ServicioFallos;
  }

  afterEach(() => {
    configurarFallos(false);
    usarServicioFallos(null);
  });

  test('sin servicio (sin DSN) no hay reportes aunque el interruptor esté encendido', () => {
    usarServicioFallos(null);
    configurarFallos(true);
    expect(reportesActivos()).toBe(false);
  });

  test('con el interruptor apagado el servicio nunca se inicia', () => {
    const servicio = servicioFalso();
    configurarFallos(false);
    usarServicioFallos(servicio);
    expect(servicio.iniciar).not.toHaveBeenCalled();
    expect(reportesActivos()).toBe(false);
  });

  test('encendido se inicia una vez; al apagarlo se detiene de inmediato', () => {
    const servicio = servicioFalso();
    configurarFallos(true);
    usarServicioFallos(servicio);
    configurarFallos(true);
    expect(servicio.iniciar).toHaveBeenCalledTimes(1);
    expect(reportesActivos()).toBe(true);

    configurarFallos(false);
    expect(servicio.detener).toHaveBeenCalledTimes(1);
    expect(reportesActivos()).toBe(false);

    configurarFallos(true);
    expect(servicio.iniciar).toHaveBeenCalledTimes(2);
  });

  test('el servicio que llega después respeta el interruptor ya leído', () => {
    const servicio = servicioFalso();
    configurarFallos(true);
    usarServicioFallos(servicio);
    expect(servicio.iniciar).toHaveBeenCalledTimes(1);
  });
});

test('Sentry se configura sin datos de la persona, capturas ni migas', () => {
  const codigo = readFileSync(join(__dirname, '..', 'sentry.ts'), 'utf8');
  for (const opcion of [
    'sendDefaultPii: false',
    'attachScreenshot: false',
    'attachViewHierarchy: false',
    'maxBreadcrumbs: 0',
    'beforeBreadcrumb: () => null',
  ]) {
    expect(codigo).toContain(opcion);
  }
  expect(codigo).toMatch(/beforeSend: evento => \(reportesActivos\(\) \? limpiarEvento\(evento\) : null\)/);
});
