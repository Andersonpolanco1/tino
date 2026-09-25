// Tino: tipos del modelo de datos (MVP).
// Fuente: especificación de features, secciones 2 a 7 y 18.
// Todas las fechas son cadenas ISO "AAAA-MM-DD" en la zona horaria del usuario.

export type CodigoMoneda = 'DOP' | 'USD' | 'EUR' | string; // ISO 4217
export type CodigoPais = 'DO' | 'US' | string;             // ISO 3166-1 alfa-2
export type FechaISO = string;                             // "2026-09-25"

// ---------- Tarjeta ----------

export type MonedaFacturacion =
  | 'solo_principal'   // solo pesos (u otra moneda principal), uso local e internacional
  | 'doble_balance'    // principal + USD
  | 'solo_usd'         // todo se factura en dólares
  | 'solo_local';      // no acepta compras internacionales

export type ReglaFechaLimite =
  | { tipo: 'dia_del_mes'; dia: number }          // 1..31; primera fecha con ese día posterior al corte
  | { tipo: 'dias_despues_corte'; dias: number }; // corte + N días

export type AjusteDiaNoHabil = 'adelantar' | 'atrasar' | 'ninguno';
export type CompraEnDiaDeCorte = 'entra_en_corte_actual' | 'entra_en_siguiente';

export type ReglaPuntos =
  | { tipo: 'por_monto'; puntos: number; porCadaMonto: number }  // 1 punto por cada 100
  | { tipo: 'por_porcentaje'; porcentaje: number }               // 2 (%)
  | { tipo: 'por_transaccion'; puntos: number };                 // 10 por compra

export type Recompensa =
  | { tipo: 'ninguna' }
  | { tipo: 'puntos'; regla: ReglaPuntos; valorPunto: number; valorPuntoConfirmado: boolean }
  | { tipo: 'cashback'; porcentaje: number };

export interface Tarjeta {
  id: string;
  alias: string;
  emisorId: string | null;          // id del catálogo; null = "Mi banco no está"
  emisorTextoLibre?: string;        // modo sin catálogo o banco no listado
  productoId: string | null;        // null = "Otro"
  productoDesconocido: boolean;     // true = "No sé el tipo"
  ultimos4?: string;                // nunca el número completo
  diaCorte: number;                 // 1..31; días inexistentes = último día del mes
  fechaLimite: ReglaFechaLimite;
  fechaLimiteUsd?: ReglaFechaLimite; // solo doble balance; máximo 5 días de diferencia
  ajusteDiaNoHabil: AjusteDiaNoHabil;
  compraEnDiaDeCorte: CompraEnDiaDeCorte;
  monedaFacturacion: MonedaFacturacion;
  recompensa: Recompensa;
  recompensaUsd?: Recompensa;       // si el banco da otra regla en compras en dólares
  enPausa: boolean;
  creadaEn: FechaISO;
}

// ---------- Ingresos (nivel 2) ----------

export type FrecuenciaIngreso =
  | { tipo: 'semanal'; diaSemana: 0 | 1 | 2 | 3 | 4 | 5 | 6 }            // 0 = domingo
  | { tipo: 'quincenal_dias_fijos'; dias: [number, number] }            // [15, 30]
  | { tipo: 'cada_dos_semanas'; diaSemana: number; referencia: FechaISO }
  | { tipo: 'mensual'; dia: number | 'ultimo_dia_habil' }
  | { tipo: 'personalizada'; fechas: { fecha: FechaISO; estimada: boolean }[] };

export interface FuenteIngreso {
  id: string;
  nombre: string;                    // "Nómina", "Cliente A"
  frecuencia: FrecuenciaIngreso;
  ajusteDiaNoHabil: AjusteDiaNoHabil;
}

// ---------- Enfoque ----------

export type ModoEnfoque = 'liquidez' | 'puntos' | 'cashback' | 'equilibrado' | 'reducir_deuda' | 'personalizado';

export interface Pesos { dias: number; puntos: number; cashback: number; salud: number } // suman 100

export interface Enfoque {
  modo: ModoEnfoque;
  pesosPersonalizados?: Pesos;       // solo Pro (v2)
}

// ---------- Preferencias y país ----------

export type PagoBalanceUsd = 'con_pesos' | 'con_dolares' | null; // null = aún no respondido

export interface Preferencias {
  pais: CodigoPais;
  idioma: string;                    // "es-DO"
  enfoque: Enfoque;
  pagoBalanceUsd: PagoBalanceUsd;
  diferencialCambiarioPct: number;   // 6 por defecto (sección 4.3 de la especificación)
  umbralCorteCercanoDias: number;    // 3 por defecto
  analiticaActiva: boolean;
  plan: 'gratis' | 'pro';
}

export interface ConfigPais {
  codigo: CodigoPais;
  monedaPrincipal: CodigoMoneda;
  monedaSecundaria: CodigoMoneda | null; // 'USD' en DO; null donde no aplica
  idiomas: string[];
  feriados: FechaISO[];              // ya trasladados según la ley local
  catalogoDisponible: boolean;       // false = modo sin catálogo
  funciones: { dobleBalance: boolean };
  montoReferencia: number;           // 1000: base de "por cada 1,000"
}

// ---------- Catálogo ----------

export interface Emisor {
  id: string;                        // "banreservas"
  nombreCorto: string;
  nombreLegal: string;
  tipoEntidad: string;
  grupo: 1 | 2;
  participacionActivosPct: number | null;
  emiteTarjetas: 'confirmado' | 'por_verificar' | 'no';
  productos: ProductoTarjeta[];
}

export interface ProductoTarjeta {
  id: string;                        // "banreservas-visa-oro"
  nombre: string;                    // "Visa Oro"
  marca: 'visa' | 'mastercard' | 'amex' | 'otra';
  monedaFacturacion?: MonedaFacturacion; // sin dato = el registro se la pregunta al usuario
  plantilla?: Partial<Pick<Tarjeta, 'fechaLimite' | 'ajusteDiaNoHabil' | 'compraEnDiaDeCorte' | 'recompensa'>>;
}

export interface Catalogo {
  pais: CodigoPais;
  version: string;                   // "2026.09.1"
  generadoEn: FechaISO;
  fuente: string;
  emisores: Emisor[];
}

// ---------- Motor ----------

export interface EntradaMotor {
  hoy: FechaISO;
  tarjetas: Tarjeta[];
  ingresos: FuenteIngreso[];
  preferencias: Preferencias;
  pais: ConfigPais;
  compra?: { monto: number; moneda: CodigoMoneda }; // "Tengo una compra"; sin compra = ranking de hoy
}

export type Etiqueta =
  | 'corta_pronto'
  | 'vence_antes_del_cobro'
  | 'en_pausa'
  | 'solo_local_excluida';

export interface ResultadoTarjeta {
  tarjetaId: string;
  diasGracia: number;
  fechaPago: FechaISO;
  proximoCorte: FechaISO;
  diasParaCorte: number;
  valorRecompensa: number;           // en moneda principal, sobre el monto de referencia o la compra
  normalizado: { dias: number; puntos: number; cashback: number };
  penalizacion: number;
  puntaje: number;
  etiquetas: Etiqueta[];
  semaforo: 'verde' | 'amarillo' | 'rojo';
}

export interface ResultadoMotor {
  ranking: ResultadoTarjeta[];       // ordenado; excluye pausadas y excluidas
  excluidas: { tarjetaId: string; motivo: Etiqueta }[];
  pesosAplicados: { dias: number; puntos: number; cashback: number };
}
