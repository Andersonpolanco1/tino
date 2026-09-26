import type {
  AjusteDiaNoHabil,
  Catalogo,
  CompraEnDiaDeCorte,
  ConfigPais,
  Emisor,
  FechaISO,
  MonedaFacturacion,
  ProductoTarjeta,
  Recompensa,
  ReglaFechaLimite,
  ReglaPuntos,
  Tarjeta,
} from '../tipos/tipos';
import { validarTarjeta, type ErrorTarjeta } from '../validacion/tarjeta';

// Lo que el usuario va llenando. Los números se guardan como texto hasta guardar,
// para no perder lo que está escribiendo.
export interface BorradorRecompensa {
  tipo: Recompensa['tipo'];
  regla: ReglaPuntos['tipo'];
  puntos: string;
  porCadaMonto: string;
  porcentajePuntos: string;
  valorPunto: string;
  valorPuntoConfirmado: boolean;
  porcentajeCashback: string;
}

export interface BorradorFechaLimite {
  tipo: ReglaFechaLimite['tipo'];
  valor: string;
}

export interface BorradorTarjeta {
  emisorId: string | null;
  bancoLibre: string; // "Mi banco no está" o país sin catálogo
  productoId: string | null;
  productoDesconocido: boolean;
  alias: string;
  aliasEditado: boolean;
  ultimos4: string;
  diaCorte: string;
  fechaLimite: BorradorFechaLimite;
  separarFechaUsd: boolean;
  fechaLimiteUsd: BorradorFechaLimite;
  ajusteDiaNoHabil: AjusteDiaNoHabil;
  compraEnDiaDeCorte: CompraEnDiaDeCorte;
  monedaFacturacion: MonedaFacturacion | null;
  monedaPrecargada: boolean; // true = vino del catálogo y se reemplaza al cambiar de producto
  recompensa: BorradorRecompensa;
  recompensaUsdDistinta: boolean;
  recompensaUsd: BorradorRecompensa;
  enPausa: boolean;
}

export type Traducir = (clave: string, opciones?: Record<string, string>) => string;

// Valores cuando el banco no los indica. Ajuste de día no hábil: el prudente (decisión D20),
// mejor calcular menos días de gracia que hacer que alguien pague tarde. Compra el día del
// corte: entra en ese corte, que es el estándar en RD y ya no se pregunta (decisión D22).
const AJUSTE_PREDETERMINADO: AjusteDiaNoHabil = 'adelantar';
const COMPRA_EN_CORTE_PREDETERMINADA: CompraEnDiaDeCorte = 'entra_en_corte_actual';

const recompensaVacia = (): BorradorRecompensa => ({
  tipo: 'ninguna',
  regla: 'por_monto',
  puntos: '1',
  porCadaMonto: '100',
  porcentajePuntos: '',
  valorPunto: '1.00', // sección 4.2: precargado en 1.00 y editable
  valorPuntoConfirmado: false,
  porcentajeCashback: '',
});

export function borradorNuevo(): BorradorTarjeta {
  return {
    emisorId: null,
    bancoLibre: '',
    productoId: null,
    productoDesconocido: false,
    alias: '',
    aliasEditado: false,
    ultimos4: '',
    diaCorte: '',
    fechaLimite: { tipo: 'dia_del_mes', valor: '' },
    separarFechaUsd: false,
    fechaLimiteUsd: { tipo: 'dia_del_mes', valor: '' },
    ajusteDiaNoHabil: AJUSTE_PREDETERMINADO,
    compraEnDiaDeCorte: COMPRA_EN_CORTE_PREDETERMINADA,
    monedaFacturacion: null,
    monedaPrecargada: false,
    recompensa: recompensaVacia(),
    recompensaUsdDistinta: false,
    recompensaUsd: recompensaVacia(),
    enPausa: false,
  };
}

// ---------- Catálogo ----------

export function buscarEmisor(catalogo: Catalogo | null, id: string | null): Emisor | undefined {
  return id ? catalogo?.emisores.find(e => e.id === id) : undefined;
}

export function buscarProducto(catalogo: Catalogo | null, emisorId: string | null, productoId: string | null): ProductoTarjeta | undefined {
  return productoId ? buscarEmisor(catalogo, emisorId)?.productos.find(p => p.id === productoId) : undefined;
}

// Bancos que se ofrecen en el registro: los que confirman tarjetas, por participación de mercado.
export function emisoresParaRegistro(catalogo: Catalogo): Emisor[] {
  return catalogo.emisores
    .filter(e => e.emiteTarjetas === 'confirmado')
    .sort((a, b) => (b.participacionActivosPct ?? -1) - (a.participacionActivosPct ?? -1) || a.nombreCorto.localeCompare(b.nombreCorto));
}

// Búsqueda sin distinguir acentos ni mayúsculas.
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function filtrar<T>(elementos: T[], texto: string, nombres: (e: T) => string[]): T[] {
  const buscado = normalizar(texto);
  if (!buscado) return elementos;
  return elementos.filter(e => nombres(e).some(n => normalizar(n).includes(buscado)));
}

// Sección 4.1: alias sugerido, por ejemplo "Visa Gold Banco X".
export function aliasSugerido(t: Traducir, banco: string, producto?: string): string {
  if (!banco) return '';
  return producto ? t('registro.aliasSugerido', { producto, banco }) : t('registro.aliasSinProducto', { banco });
}

function conAlias(b: BorradorTarjeta, t: Traducir, catalogo: Catalogo | null): BorradorTarjeta {
  if (b.aliasEditado) return b;
  const emisor = buscarEmisor(catalogo, b.emisorId);
  const banco = emisor?.nombreCorto ?? b.bancoLibre.trim();
  return { ...b, alias: aliasSugerido(t, banco, buscarProducto(catalogo, b.emisorId, b.productoId)?.nombre) };
}

// La moneda que vino del catálogo se quita al cambiar de producto; la que eligió el usuario se respeta.
function sinMonedaPrecargada(b: BorradorTarjeta): BorradorTarjeta {
  return b.monedaPrecargada ? { ...b, monedaFacturacion: null, monedaPrecargada: false } : b;
}

export function elegirEmisor(b: BorradorTarjeta, emisorId: string, t: Traducir, catalogo: Catalogo | null): BorradorTarjeta {
  return conAlias(sinMonedaPrecargada({ ...b, emisorId, bancoLibre: '', productoId: null, productoDesconocido: false }), t, catalogo);
}

export function escribirBanco(b: BorradorTarjeta, bancoLibre: string, t: Traducir, catalogo: Catalogo | null): BorradorTarjeta {
  return conAlias(sinMonedaPrecargada({ ...b, emisorId: null, bancoLibre, productoId: null, productoDesconocido: false }), t, catalogo);
}

// Al elegir el producto se precarga lo que el catálogo sabe de él (sección 4.1).
export function elegirProducto(b: BorradorTarjeta, productoId: string, t: Traducir, catalogo: Catalogo | null): BorradorTarjeta {
  const producto = buscarProducto(catalogo, b.emisorId, productoId);
  let siguiente = sinMonedaPrecargada({ ...b, productoId, productoDesconocido: false });
  if (producto?.monedaFacturacion) siguiente = { ...siguiente, monedaFacturacion: producto.monedaFacturacion, monedaPrecargada: true };
  const plantilla = producto?.plantilla;
  if (plantilla?.fechaLimite) siguiente = { ...siguiente, fechaLimite: borradorFecha(plantilla.fechaLimite) };
  if (plantilla?.ajusteDiaNoHabil) siguiente = { ...siguiente, ajusteDiaNoHabil: plantilla.ajusteDiaNoHabil };
  if (plantilla?.compraEnDiaDeCorte) siguiente = { ...siguiente, compraEnDiaDeCorte: plantilla.compraEnDiaDeCorte };
  if (plantilla?.recompensa) siguiente = { ...siguiente, recompensa: borradorRecompensa(plantilla.recompensa) };
  return conAlias(siguiente, t, catalogo);
}

// "Mi tarjeta no está en la lista" (producto Otro) y "No sé el tipo".
export function productoFueraDeLista(b: BorradorTarjeta, desconocido: boolean, t: Traducir, catalogo: Catalogo | null): BorradorTarjeta {
  return conAlias(sinMonedaPrecargada({ ...b, productoId: null, productoDesconocido: desconocido }), t, catalogo);
}

export function editarAlias(b: BorradorTarjeta, alias: string): BorradorTarjeta {
  return { ...b, alias, aliasEditado: true };
}

export function elegirMoneda(b: BorradorTarjeta, monedaFacturacion: MonedaFacturacion): BorradorTarjeta {
  return { ...b, monedaFacturacion, monedaPrecargada: false };
}

// ---------- Conversión ----------

const numero = (texto: string) => {
  const limpio = texto.trim().replace(',', '.');
  return limpio === '' ? NaN : Number(limpio);
};

function borradorFecha(regla: ReglaFechaLimite): BorradorFechaLimite {
  return { tipo: regla.tipo, valor: String(regla.tipo === 'dia_del_mes' ? regla.dia : regla.dias) };
}

function aFecha(b: BorradorFechaLimite): ReglaFechaLimite {
  return b.tipo === 'dia_del_mes' ? { tipo: 'dia_del_mes', dia: numero(b.valor) } : { tipo: 'dias_despues_corte', dias: numero(b.valor) };
}

function borradorRecompensa(r: Recompensa): BorradorRecompensa {
  const vacia = recompensaVacia();
  if (r.tipo === 'ninguna') return vacia;
  if (r.tipo === 'cashback') return { ...vacia, tipo: 'cashback', porcentajeCashback: String(r.porcentaje) };
  const g = r.regla;
  return {
    ...vacia,
    tipo: 'puntos',
    regla: g.tipo,
    puntos: g.tipo === 'por_porcentaje' ? vacia.puntos : String(g.puntos),
    porCadaMonto: g.tipo === 'por_monto' ? String(g.porCadaMonto) : vacia.porCadaMonto,
    porcentajePuntos: g.tipo === 'por_porcentaje' ? String(g.porcentaje) : '',
    valorPunto: String(r.valorPunto),
    valorPuntoConfirmado: r.valorPuntoConfirmado,
  };
}

function aRecompensa(b: BorradorRecompensa): Recompensa {
  if (b.tipo === 'ninguna') return { tipo: 'ninguna' };
  if (b.tipo === 'cashback') return { tipo: 'cashback', porcentaje: numero(b.porcentajeCashback) };
  const regla: ReglaPuntos =
    b.regla === 'por_monto'
      ? { tipo: 'por_monto', puntos: numero(b.puntos), porCadaMonto: numero(b.porCadaMonto) }
      : b.regla === 'por_porcentaje'
        ? { tipo: 'por_porcentaje', porcentaje: numero(b.porcentajePuntos) }
        : { tipo: 'por_transaccion', puntos: numero(b.puntos) };
  return { tipo: 'puntos', regla, valorPunto: numero(b.valorPunto), valorPuntoConfirmado: b.valorPuntoConfirmado };
}

export function borradorDesde(t: Tarjeta): BorradorTarjeta {
  return {
    ...borradorNuevo(),
    emisorId: t.emisorId,
    bancoLibre: t.emisorTextoLibre ?? '',
    productoId: t.productoId,
    productoDesconocido: t.productoDesconocido,
    alias: t.alias,
    aliasEditado: true,
    ultimos4: t.ultimos4 ?? '',
    diaCorte: String(t.diaCorte),
    fechaLimite: borradorFecha(t.fechaLimite),
    separarFechaUsd: !!t.fechaLimiteUsd,
    fechaLimiteUsd: t.fechaLimiteUsd ? borradorFecha(t.fechaLimiteUsd) : { tipo: 'dia_del_mes', valor: '' },
    ajusteDiaNoHabil: t.ajusteDiaNoHabil,
    compraEnDiaDeCorte: t.compraEnDiaDeCorte,
    monedaFacturacion: t.monedaFacturacion,
    recompensa: borradorRecompensa(t.recompensa),
    recompensaUsdDistinta: !!t.recompensaUsd,
    recompensaUsd: t.recompensaUsd ? borradorRecompensa(t.recompensaUsd) : recompensaVacia(),
    enPausa: t.enPausa,
  };
}

export type ErrorRegistro = ErrorTarjeta | 'monedaVacia';

export type ResultadoRegistro = { ok: true; tarjeta: Tarjeta } | { ok: false; errores: ErrorRegistro[] };

// Convierte el borrador en Tarjeta y la valida. La moneda de facturación no se adivina:
// si el catálogo no la trae, el usuario la elige (decisión D13).
// Donde el país no tiene doble balance no se pregunta: por defecto, todo en la moneda principal.
export function aTarjeta(borrador: BorradorTarjeta, pais: ConfigPais, id: string, creadaEn: FechaISO): ResultadoRegistro {
  const b: BorradorTarjeta =
    !borrador.monedaFacturacion && !pais.funciones.dobleBalance ? { ...borrador, monedaFacturacion: 'solo_principal' } : borrador;
  if (!b.monedaFacturacion) {
    return { ok: false, errores: ['monedaVacia'] };
  }
  const dobleBalance = b.monedaFacturacion === 'doble_balance';
  const tarjeta: Tarjeta = {
    id,
    alias: b.alias.trim(),
    emisorId: b.emisorId,
    ...(b.emisorId === null && b.bancoLibre.trim() ? { emisorTextoLibre: b.bancoLibre.trim() } : {}),
    productoId: b.productoId,
    productoDesconocido: b.productoId === null && b.productoDesconocido,
    ...(b.ultimos4.trim() ? { ultimos4: b.ultimos4.trim() } : {}),
    diaCorte: numero(b.diaCorte),
    fechaLimite: aFecha(b.fechaLimite),
    ...(dobleBalance && b.separarFechaUsd ? { fechaLimiteUsd: aFecha(b.fechaLimiteUsd) } : {}),
    ajusteDiaNoHabil: b.ajusteDiaNoHabil,
    compraEnDiaDeCorte: b.compraEnDiaDeCorte,
    monedaFacturacion: b.monedaFacturacion,
    recompensa: aRecompensa(b.recompensa),
    // Las recompensas distintas en dólares solo aplican si la tarjeta factura en dólares.
    ...(b.monedaFacturacion !== 'solo_principal' && b.monedaFacturacion !== 'solo_local' && b.recompensaUsdDistinta
      ? { recompensaUsd: aRecompensa(b.recompensaUsd) }
      : {}),
    enPausa: b.enPausa,
    creadaEn,
  };
  const errores = validarTarjeta(tarjeta, pais);
  return errores.length ? { ok: false, errores } : { ok: true, tarjeta };
}

// Sección 4.3: la pregunta de pago en dólares se hace una vez, con la primera tarjeta con dólares.
export function tieneDolares(t: Pick<Tarjeta, 'monedaFacturacion'>): boolean {
  return t.monedaFacturacion === 'doble_balance' || t.monedaFacturacion === 'solo_usd';
}
