import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BotonPastilla, FilaLista, Hoja, ListaAgrupada, Texto, useTema } from '../diseno';
import { usePais } from '../paises';
import { useAlmacen } from '../estado';
import { textoFecha } from '../inicio/vista';
import type { PagoPendiente } from './pendientes';

// "Vence hoy", "Vence mañana, 30 de septiembre", "Vence el 30 de septiembre · en 4 días". Vencido,
// una pregunta y no una alarma, porque Tino no sabe si se pagó por otra vía (decisión D99).
export function textoVence(dias: number, fecha: string, t: (k: string, o?: Record<string, unknown>) => string) {
  if (dias < 0) return t('pagos.preguntaVencido', { fecha });
  if (dias === 0) return t('inicio.venceHoy');
  if (dias === 1) return t('inicio.venceManana', { fecha });
  return t('inicio.venceEnDias', { fecha, dias });
}

// En color de alerta: vence en 3 días o menos, o antes del cobro. Vencido, solo si el usuario ya usa
// "Ya pagué" en alguna tarjeta: a quien paga por débito automático y no marca nada, Tino no le
// pinta una alarma cada mes (decisión D99).
export function pagoUrgente(pago: PagoPendiente, usaYaPague: boolean): boolean {
  if (pago.pagado) return false;
  if (pago.vencido) return usaYaPague;
  return pago.dias <= 3 || pago.aviso?.tipo === 'antes';
}

// Un pago pendiente con su "Ya pagué" (decisión D45). Marcado, dice "Pagada" y deja deshacerlo.
export function FilaPago({ pago, conNombre = true }: { pago: PagoPendiente; conNombre?: boolean }) {
  const tema = useTema();
  const { t } = useTranslation();
  const { idioma } = usePais();
  const marcarPagado = useAlmacen(s => s.marcarPagado);
  const usaYaPague = useAlmacen(s => s.tarjetas.some(x => !!x.pagoHecho));
  const parcial = !!pago.tarjeta.pagoParcial;
  // Decisión D101: al marcar, si fue el balance al corte o menos; sin montos.
  const [preguntando, setPreguntando] = useState(false);
  const fecha = textoFecha(pago.fecha, idioma);
  const urgente = pagoUrgente(pago, usaYaPague);
  const vence = textoVence(pago.dias, fecha, t as never);
  const aviso =
    !pago.pagado && pago.aviso
      ? t(pago.aviso.tipo === 'antes' ? 'inicio.avisoAntesDelCobro' : 'inicio.avisoCobroEstimado', { cobro: textoFecha(pago.aviso.cobro, idioma) })
      : null;

  // Pagado: una sola línea, con "Deshacer" como enlace pequeño a la derecha (decisión D52).
  if (pago.pagado) {
    const linea = t(parcial ? 'pagos.pagadoParcialLinea' : 'pagos.pagadoLinea', { fecha });
    return (
      <FilaLista
        icono="check"
        titulo={conNombre ? pago.tarjeta.alias : t(parcial ? 'pagos.pagadoParcial' : 'pagos.pagado')}
        detalle={conNombre ? linea : t('pagos.venceEl', { fecha })}
        derecha={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('pagos.deshacerDe', { alias: pago.tarjeta.alias })}
            onPress={() => marcarPagado(pago.tarjeta.id, null)}
            style={{ minHeight: tema.toqueMinimo, justifyContent: 'center', paddingLeft: tema.espacio.s }}
          >
            <Texto variante="apoyoFuerte" color="primario">
              {t('pagos.deshacer')}
            </Texto>
          </Pressable>
        }
      />
    );
  }

  // Sin pagar: la acción va debajo del texto; a la derecha le quitaba medio ancho y partía las fechas.
  return (
    <FilaLista
      icono="calendario"
      tono={urgente ? 'alerta' : 'primario'}
      titulo={conNombre ? pago.tarjeta.alias : vence}
      detalle={conNombre ? vence : undefined}
      debajo={
        <View style={{ gap: tema.espacio.s, alignItems: 'flex-start' }}>
          {aviso ? (
            <Texto variante="apoyoPequeno" color="alertaTexto">
              {aviso}
            </Texto>
          ) : null}
          <View style={{ marginTop: tema.espacio.xs }}>
            {/* Un solo estilo, discreto: la urgencia la dicen el ícono, el color y el texto de la fila. */}
            <BotonPastilla icono="check" titulo={t('pagos.yaPague')} etiquetaAccesible={t('pagos.yaPagueDe', { alias: pago.tarjeta.alias })} onPress={() => setPreguntando(true)} secundaria />
          </View>
          <Hoja visible={preguntando} titulo={t('pagos.preguntaCuanto', { fecha })} onCerrar={() => setPreguntando(false)} cerrarEtiqueta={t('comun.cerrar')}>
            <ListaAgrupada sangria={16}>
              <FilaLista
                titulo={t('pagos.pagoTotal')}
                detalle={t('pagos.pagoTotalDetalle')}
                onPress={() => {
                  setPreguntando(false);
                  marcarPagado(pago.tarjeta.id, pago.fecha);
                }}
              />
              <FilaLista
                titulo={t('pagos.pagoMenos')}
                detalle={t('pagos.pagoMenosDetalle')}
                onPress={() => {
                  setPreguntando(false);
                  marcarPagado(pago.tarjeta.id, pago.fecha, true);
                }}
              />
            </ListaAgrupada>
          </Hoja>
        </View>
      }
    />
  );
}
