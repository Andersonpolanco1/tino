import { randomBytes } from 'node:crypto';
import type { FuenteIngreso, Tarjeta } from '../../tipos/tipos';
import { preferenciasIniciales } from '../../datos/preferencias';
import { migrar } from '../../datos/migraciones';
import { repositorioIngresos, repositorioPreferencias, repositorioSugerencias, repositorioTarjetas } from '../../datos/repositorios';
import { basePrueba } from '../../pruebas/sqlitePrueba';
import { cifrarRespaldo, descifrarRespaldo, ErrorRespaldo } from '../cifrado';
import { contenidoDe, reemplazarDatos, validarContenido } from '../contenido';

const aleatorio = (n: number) => new Uint8Array(randomBytes(n));

const tarjeta: Tarjeta = {
  id: 'tarjeta-1',
  alias: 'Visa de mamá',
  emisorId: 'banreservas',
  productoId: 'banreservas-visa-clasica',
  productoDesconocido: false,
  ultimos4: '4821',
  diaCorte: 15,
  fechaLimite: { tipo: 'dias_despues_corte', dias: 20 },
  ajusteDiaNoHabil: 'adelantar',
  compraEnDiaDeCorte: 'entra_en_corte_actual',
  monedaFacturacion: 'doble_balance',
  recompensa: { tipo: 'puntos', regla: { tipo: 'por_monto', puntos: 1, porCadaMonto: 100 }, valorPunto: 1, valorPuntoConfirmado: true },
  enPausa: false,
  creadaEn: '2026-09-01',
  pagoHecho: '2026-10-05',
};
const cobro: FuenteIngreso = { id: 'cobro-1', nombre: 'Nómina', frecuencia: { tipo: 'quincenal_dias_fijos', dias: [15, 30] }, ajusteDiaNoHabil: 'adelantar' };
const contenido = contenidoDe(
  {
    preferencias: { ...preferenciasIniciales('DO', 'es-DO'), plan: 'pro', tema: 'oscuro' },
    tarjetas: [tarjeta],
    ingresos: [cobro],
    sugerencias: { activa: null, descartes: { cobros: { veces: 2, ultimo: '2026-09-12' } } },
  },
  new Date('2026-09-26T12:00:00Z'),
);

describe('cifrado del respaldo (D62)', () => {
  it('con la contraseña correcta devuelve exactamente lo que se guardó, con tildes y ñ', async () => {
    const archivo = await cifrarRespaldo(contenido, 'Contraseña ñandú', aleatorio);
    expect(await descifrarRespaldo(archivo, 'Contraseña ñandú')).toEqual(contenido);
  });

  it('sin la contraseña no se ve ningún dato ni el nombre de ningún campo', async () => {
    const archivo = await cifrarRespaldo(contenido, 'una contraseña larga', aleatorio);
    for (const texto of ['mamá', 'Visa', '4821', 'banreservas', 'Nómina', 'diaCorte', 'valorPunto', 'recompensa', 'tarjetas', 'preferencias', '2026-10-05']) {
      expect(archivo).not.toContain(texto);
    }
  });

  it('una contraseña incorrecta no abre el respaldo', async () => {
    const archivo = await cifrarRespaldo(contenido, 'la correcta 123', aleatorio);
    await expect(descifrarRespaldo(archivo, 'la incorrecta 123')).rejects.toEqual(new ErrorRespaldo('contrasena'));
  });

  it('un archivo alterado se rechaza, incluido el encabezado', async () => {
    const archivo = JSON.parse(await cifrarRespaldo(contenido, 'la correcta 123', aleatorio));
    const datos = archivo.cifrado.datos as string;
    const cambiado = { ...archivo, cifrado: { ...archivo.cifrado, datos: (datos[0] === 'A' ? 'B' : 'A') + datos.slice(1) } };
    await expect(descifrarRespaldo(JSON.stringify(cambiado), 'la correcta 123')).rejects.toEqual(new ErrorRespaldo('contrasena'));
    const otrosParametros = { ...archivo, kdf: { ...archivo.kdf, r: 4 } };
    await expect(descifrarRespaldo(JSON.stringify(otrosParametros), 'la correcta 123')).rejects.toEqual(new ErrorRespaldo('contrasena'));
  });

  it('un archivo que no es un respaldo de Tino, o de una versión más nueva, se reconoce', async () => {
    await expect(descifrarRespaldo('hola', 'x')).rejects.toEqual(new ErrorRespaldo('formato'));
    await expect(descifrarRespaldo(JSON.stringify({ formato: 'otra-app' }), 'x')).rejects.toEqual(new ErrorRespaldo('formato'));
    const archivo = JSON.parse(await cifrarRespaldo(contenido, 'la correcta 123', aleatorio));
    await expect(descifrarRespaldo(JSON.stringify({ ...archivo, version: 99 }), 'x')).rejects.toEqual(new ErrorRespaldo('version'));
  });

  it('dos respaldos de los mismos datos no se parecen (sal y vector distintos)', async () => {
    const a = JSON.parse(await cifrarRespaldo(contenido, 'la misma 1234', aleatorio));
    const b = JSON.parse(await cifrarRespaldo(contenido, 'la misma 1234', aleatorio));
    expect(a.cifrado.datos).not.toBe(b.cifrado.datos);
  });
});

describe('contenido y restauración', () => {
  it('valida la forma y rechaza respaldos de un esquema más nuevo', () => {
    expect(validarContenido(contenido)).toEqual(contenido);
    expect(() => validarContenido({ ...contenido, tarjetas: [{ id: 'x' }] })).toThrow(new ErrorRespaldo('formato'));
    expect(() => validarContenido({ ...contenido, esquema: 99 })).toThrow(new ErrorRespaldo('version'));
  });

  it('reemplaza todos los datos de una vez', async () => {
    const db = basePrueba();
    await migrar(db);
    await repositorioTarjetas(db).guardar({ ...tarjeta, id: 'vieja', alias: 'Vieja' }, 'x');
    await reemplazarDatos(tarea => db.withExclusiveTransactionAsync(tarea as never), contenido, '2026-09-26');
    expect(await repositorioTarjetas(db).listar()).toEqual([tarjeta]);
    expect(await repositorioIngresos(db).listar()).toEqual([cobro]);
    expect(await repositorioPreferencias(db).leer()).toEqual(contenido.preferencias);
    expect(await repositorioSugerencias(db).leer()).toEqual(contenido.sugerencias);
  });

  it('si algo falla no cambia nada (un número de tarjeta completo en el respaldo)', async () => {
    const db = basePrueba();
    await migrar(db);
    await repositorioTarjetas(db).guardar(tarjeta, 'x');
    const conNumero = { ...contenido, tarjetas: [{ ...tarjeta, id: 'mala', alias: '4111111111111111' }] };
    await expect(reemplazarDatos(tarea => db.withExclusiveTransactionAsync(tarea as never), conNumero, 'x')).rejects.toThrow();
    expect(await repositorioTarjetas(db).listar()).toEqual([tarjeta]);
  });
});

describe('Ver mis datos (D62)', () => {
  const { iniciarI18n } = require('../../i18n/i18n');
  const { resumenDeDatos } = require('../resumen');
  const t = iniciarI18n('es-DO').t;
  const completo = {
    ...contenido,
    tarjetas: [
      {
        ...tarjeta,
        fechaLimiteUsd: { tipo: 'dias_despues_corte', dias: 22 },
        recompensaUsd: { tipo: 'cashback', porcentaje: 2 },
      },
    ],
    ingresos: [cobro, { id: 'c2', nombre: 'Alquiler', frecuencia: { tipo: 'personalizada', fechas: [{ fecha: '2026-10-03', estimada: true }] }, ajusteDiaNoHabil: 'ninguno' }],
    preferencias: { ...contenido.preferencias!, tarjetasDelPlan: ['tarjeta-1'], finPruebaPro: '2026-11-05', avisos: { fechaLimite: true, venceAntesDelCobro: false, cambioTarjeta: true, resumenMensual: true } },
    sugerencias: { activa: { tipo: 'valorPunto', desde: '2026-09-20', descartada: false }, descartes: { cobros: { veces: 2, ultimo: '2026-09-12' } } },
  };
  const texto: string = resumenDeDatos(completo, {
    t,
    idioma: 'es-DO',
    monedaPrincipal: 'DOP',
    monedaSecundaria: 'USD',
    catalogo: null,
    identificadorAnalitica: 'id-anonimo-123',
    hoy: '2026-09-26',
  });

  it('incluye cada dato del usuario, en palabras', () => {
    for (const esperado of [
      'Visa de mamá',
      'Banco: banreservas',
      'Últimos 4 dígitos: 4821',
      'Corta el día 15 de cada mes',
      'Se paga 20 días después del corte',
      'Balance en dólares: Se paga 22 días después del corte',
      'se paga el día hábil anterior',
      'Lo que compras el día del corte entra en ese corte',
      'Trae un balance en dólares aparte',
      '1 punto por cada RD$100 · 1 punto vale RD$1 (lo confirmaste)',
      'Recompensa en compras en dólares: 2% de cashback',
      'En pausa: no',
      'Registrada el 1 de septiembre',
      'Marcaste como pagado el estado que vence el 5 de octubre',
      'Nómina',
      'Días 15 y 30',
      'Generado el 26 de septiembre de 2026',
      'Alquiler',
      '3 de octubre de 2026 (estimada)',
      'cobras ese mismo día',
      'País: República Dominicana',
      'Enfoque: Equilibrado',
      'No has dicho cómo pagas el balance en dólares',
      'Diferencia de cambio que considera Tino al pagar dólares con pesos: 6%',
      'cuando faltan 3 días o menos',
      'Datos de uso anónimos: sí',
      'Plan: Tino Pro',
      'Tarjetas que usa el plan gratis: Visa de mamá',
      'Tu prueba de Tino Pro termina el 5 de noviembre',
      'vence antes de tu cobro: no',
      'Apariencia: Oscuro',
      'Sugerencia de esta semana: confirmar el valor del punto',
      'Descartaste la sugerencia de agregar tus días de cobro 2 veces, la última el 12 de septiembre',
      'id-anonimo-123',
    ]) {
      expect(texto).toContain(esperado);
    }
  });

  it('no expone identificadores internos ni nombres de campos', () => {
    for (const interno of ['tarjeta-1', 'cobro-1', 'diaCorte', 'valorPunto', 'por_monto', 'doble_balance', 'dias_despues_corte', 'esquema', 'creadoEn', '{', '}']) {
      expect(texto).not.toContain(interno);
    }
  });
});
