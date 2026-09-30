import type { Preferencias } from '../../tipos/tipos';
import { preferenciasIniciales } from '../../datos/preferencias';
import { decidirAnaliticaEnAjustes, estadoAnalitica, responderAnalitica, tocaPreguntarAnalitica } from '../consentimiento';
import { aceptarTerminos, conservarAceptacion, VERSION_TERMINOS } from '../terminos';

const base: Preferencias = preferenciasIniciales('DO', 'es-DO');

describe('estado de los datos de uso (D88)', () => {
  it('al instalar, la analítica está apagada y espera la primera respuesta', () => {
    expect(base.analiticaActiva).toBe(false);
    expect(estadoAnalitica(base)).toBe('pendiente');
    expect(estadoAnalitica(null)).toBe('apagada');
  });

  it('"Sí" la activa; "No" la apaga sin retener nada', () => {
    expect(estadoAnalitica(responderAnalitica(base, true, '2026-10-01'))).toBe('activa');
    expect(estadoAnalitica(responderAnalitica(base, false, '2026-10-01'))).toBe('apagada');
  });

  it('encendida sin decisión (preferencias de antes de D88) no cuenta como consentimiento', () => {
    expect(estadoAnalitica({ ...base, analiticaActiva: true })).toBe('pendiente');
  });

  it('el interruptor de Ajustes decide en los dos sentidos', () => {
    const apagada = decidirAnaliticaEnAjustes(base, false, '2026-10-01');
    expect(estadoAnalitica(apagada)).toBe('apagada');
    expect(apagada.analiticaDecidida).toBe('2026-10-01');
    expect(estadoAnalitica(decidirAnaliticaEnAjustes(apagada, true, '2026-10-02'))).toBe('activa');
  });
});

describe('cuándo volver a preguntar (D88)', () => {
  const conNoes = (...fechas: string[]) => fechas.reduce((p, f) => responderAnalitica(p, false, f), base);

  it('sin respuesta, toca de una vez', () => {
    expect(tocaPreguntarAnalitica(base, '2026-10-01')).toBe(true);
  });

  it('el segundo intento llega 14 días después del primer "No"', () => {
    const p = conNoes('2026-10-01');
    expect(tocaPreguntarAnalitica(p, '2026-10-14')).toBe(false);
    expect(tocaPreguntarAnalitica(p, '2026-10-15')).toBe(true);
  });

  it('el tercero, 60 días después del segundo "No"', () => {
    const p = conNoes('2026-10-01', '2026-10-15');
    expect(tocaPreguntarAnalitica(p, '2026-12-13')).toBe(false);
    expect(tocaPreguntarAnalitica(p, '2026-12-14')).toBe(true);
  });

  it('después del tercer "No", no se pregunta más', () => {
    expect(tocaPreguntarAnalitica(conNoes('2026-10-01', '2026-10-15', '2026-12-14'), '2028-01-01')).toBe(false);
  });

  it('un "Sí" o un toque al interruptor de Ajustes cierra la pregunta', () => {
    expect(tocaPreguntarAnalitica(responderAnalitica(base, true, '2026-10-01'), '2027-01-01')).toBe(false);
    expect(tocaPreguntarAnalitica(decidirAnaliticaEnAjustes(conNoes('2026-10-01'), false, '2026-10-02'), '2027-01-01')).toBe(false);
  });
});

describe('aceptación de los términos (D88)', () => {
  it('guarda la versión vigente y la fecha', () => {
    expect(aceptarTerminos(base, '2026-10-01').terminosAceptados).toEqual({ version: VERSION_TERMINOS, fecha: '2026-10-01' });
  });

  it('al restaurar un respaldo vale la aceptación de este teléfono', () => {
    const deEsteTelefono = aceptarTerminos(base, '2026-10-05');
    const delRespaldo = { ...base, plan: 'pro' as const, terminosAceptados: { version: '2026-01-01', fecha: '2026-01-02' } };
    const restauradas = conservarAceptacion(delRespaldo, deEsteTelefono);
    expect(restauradas.plan).toBe('pro');
    expect(restauradas.terminosAceptados?.fecha).toBe('2026-10-05');
    expect(conservarAceptacion(delRespaldo, null).terminosAceptados?.fecha).toBe('2026-01-02');
  });
});
