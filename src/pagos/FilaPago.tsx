import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BotonPastilla, FilaLista, Texto, useTema } from '../diseno';
import { usePais } from '../paises';
import { useAlmacen } from '../estado';
import { textoFecha } from '../inicio/vista';
import type { PagoPendiente } from './pendientes';

// "Vence hoy", "Vence mañana, 30 de septiembre", "Vence el 30 de septiembre · en 4 días".
export function textoVence(dias: number, fecha: string, t: (k: string, o?: Record<string, unknown>) => string) {
  if (dias <= 0) return t('inicio.venceHoy');
  if (dias === 1) return t('inicio.venceManana', { fecha });
  return t('inicio.venceEnDias', { fecha, dias });
}

// Un pago pendiente con su "Ya pagué" (decisión D45). Marcado, dice "Pagada" y deja deshacerlo.
export function FilaPago({ pago, conNombre = true }: { pago: PagoPendiente; conNombre?: boolean }) {
  const tema = useTema();
  const { t } = useTranslation();
  const { idioma } = usePais();
  const marcarPagado = useAlmacen(s => s.marcarPagado);
  const fecha = textoFecha(pago.fecha, idioma);
  const urgente = !pago.pagado && (pago.dias <= 3 || pago.aviso?.tipo === 'antes');
  const vence = textoVence(pago.dias, fecha, t as never);
  const aviso =
    !pago.pagado && pago.aviso
      ? t(pago.aviso.tipo === 'antes' ? 'inicio.avisoAntesDelCobro' : 'inicio.avisoCobroEstimado', { cobro: textoFecha(pago.aviso.cobro, idioma) })
      : null;

  // Pagado: una sola línea, con "Deshacer" como enlace pequeño a la derecha (decisión D52).
  if (pago.pagado) {
    const linea = t('pagos.pagadoLinea', { fecha });
    return (
      <FilaLista
        icono="check"
        titulo={conNombre ? pago.tarjeta.alias : t('pagos.pagado')}
        detalle={conNombre ? linea : t('pagos.venceEl', { fecha })}
        derecha={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('pagos.deshacerDe', { alias: pago.tarjeta.alias })}
            onPress={() => marcarPagado(pago.tarjeta.id, null)}
            style={{ minHeight: tema.toqueMinimo, justifyContent: 'center', paddingLeft: tema.espacio.s }}
          >
            <Texto variante="cuerpoFuerte" color="primario" style={{ fontSize: 14 }}>
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
            <Texto variante="apoyo" color="alertaTexto" style={{ fontSize: 13 }}>
              {aviso}
            </Texto>
          ) : null}
          <View style={{ marginTop: tema.espacio.xs }}>
            <BotonPastilla icono="check" titulo={t('pagos.yaPague')} etiquetaAccesible={t('pagos.yaPagueDe', { alias: pago.tarjeta.alias })} onPress={() => marcarPagado(pago.tarjeta.id, pago.fecha)} />
          </View>
        </View>
      }
    />
  );
}
