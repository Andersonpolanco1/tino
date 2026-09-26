import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Catalogo, ConfigPais, EntradaMotor, FechaISO, ResultadoMotor, ResultadoTarjeta, Tarjeta } from '../tipos/tipos';
import { calcularRanking, type OrdenVista } from '../motor';
import { useAlmacen } from '../estado';
import { useCatalogo } from '../catalogo';
import { buscarEmisor } from '../registro/borrador';
import { usePais } from '../paises';
import { useRanking } from './useRanking';
import {
  cicloDe,
  diaConSemana,
  esperarA,
  etiquetasDe,
  fechaCorta,
  inicialesBanco,
  mensajeSemaforo,
  textoFecha,
  textoRecompensa,
  type EtiquetaVista,
  type Traducir,
} from './vista';

// Todo lo que necesita una tarjeta en pantalla, ya calculado y con textos.
export interface VistaTarjeta {
  tarjeta: Tarjeta;
  resultado: ResultadoTarjeta;
  banco: string;
  iniciales: string;
  fechaPago: string;
  fechaPagoCorta: string;
  recompensa: string | null;
  recompensaCorta: string | null;
  etiquetas: EtiquetaVista[];
  mensajeSemaforo: string;
  ciclo: { anterior: FechaISO; proximoCorta: string; fraccion: number };
  // Solo en rojo: esperar al día después del corte.
  esperar: { fecha: FechaISO; dia: string; dias: number } | null;
}

export interface Vistas {
  entrada: EntradaMotor;
  tarjetas: VistaTarjeta[];
}

interface ContextoVista {
  entrada: EntradaMotor;
  catalogo: Catalogo | null;
  t: Traducir;
  pais: ConfigPais;
  idioma: string;
}

export function construirVista(tarjeta: Tarjeta, resultado: ResultadoTarjeta, c: ContextoVista): VistaTarjeta {
  const contexto = { t: c.t, pais: c.pais, idioma: c.idioma };
  const banco = buscarEmisor(c.catalogo, tarjeta.emisorId)?.nombreCorto ?? tarjeta.emisorTextoLibre ?? '';
  const ciclo = cicloDe(tarjeta, resultado, c.entrada.hoy);
  const esperar = resultado.semaforo === 'rojo' ? esperarA(tarjeta, resultado, c.entrada) : null;
  return {
    tarjeta,
    resultado,
    banco,
    iniciales: inicialesBanco(banco),
    fechaPago: textoFecha(resultado.fechaPago, c.idioma),
    fechaPagoCorta: fechaCorta(resultado.fechaPago, c.idioma, c.t),
    recompensa: textoRecompensa(tarjeta, resultado, contexto, c.entrada.compra),
    recompensaCorta: textoRecompensa(tarjeta, resultado, contexto, c.entrada.compra, true),
    etiquetas: etiquetasDe(tarjeta, resultado, contexto),
    mensajeSemaforo: mensajeSemaforo(tarjeta, resultado, c.entrada, c.t, c.idioma),
    ciclo: {
      ...ciclo,
      proximoCorta: fechaCorta(resultado.proximoCorte, c.idioma, c.t),
    },
    esperar: esperar ? { ...esperar, dia: diaConSemana(esperar.fecha, c.idioma, c.t) } : null,
  };
}

export function useVistas(opciones: { orden?: OrdenVista; compra?: EntradaMotor['compra'] } = {}): (Vistas & { excluidas: ResultadoMotor['excluidas'] }) | null {
  const ranking = useRanking(opciones);
  const catalogo = useCatalogo();
  const { config, idioma } = usePais();
  const { t } = useTranslation();

  return useMemo(() => {
    if (!ranking) return null;
    const c = { entrada: ranking.entrada, catalogo, t: t as unknown as Traducir, pais: config, idioma };
    return {
      entrada: ranking.entrada,
      excluidas: ranking.resultado.excluidas,
      tarjetas: ranking.resultado.ranking.map(resultado => construirVista(ranking.tarjetaDe(resultado.tarjetaId), resultado, c)),
    };
  }, [ranking, catalogo, config, idioma, t]);
}

// Vista de una tarjeta para su detalle, aunque esté en pausa (se calcula como si estuviera activa).
export function useVistaTarjeta(id: string): VistaTarjeta | null {
  const ranking = useRanking();
  const catalogo = useCatalogo();
  const { config, idioma } = usePais();
  const { t } = useTranslation();
  const tarjeta = useAlmacen(s => s.tarjetas.find(x => x.id === id));

  return useMemo(() => {
    if (!ranking || !tarjeta) return null;
    const entrada = { ...ranking.entrada, tarjetas: [{ ...tarjeta, enPausa: false }] };
    const [resultado] = calcularRanking(entrada).ranking;
    return construirVista(tarjeta, resultado, { entrada, catalogo, t: t as unknown as Traducir, pais: config, idioma });
  }, [ranking, tarjeta, catalogo, config, idioma, t]);
}
