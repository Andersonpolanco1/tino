import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Boton, FilaLista, ListaAgrupada, Pantalla, Texto } from '@/diseno';
import { useAlmacen } from '@/estado';
import { useCatalogo } from '@/catalogo';
import { buscarEmisor } from '@/registro/borrador';
import { inicialesBanco, textoFecha } from '@/inicio/vista';
import { useHoy } from '@/inicio/useHoy';
import { usePais } from '@/paises';
import { proximosPagos } from '@/pagos/pendientes';
import { textoVence } from '@/pagos/FilaPago';
import { useTarjetasEnPlan } from '@/suscripciones';

// Lista de tarjetas registradas (rediseño): lista agrupada; tocar una abre su detalle.
export default function Tarjetas() {
  const { t } = useTranslation();
  const router = useRouter();
  const tarjetas = useAlmacen(s => s.tarjetas);
  const catalogo = useCatalogo();
  const ingresos = useAlmacen(s => s.ingresos);
  const hoy = useHoy();
  const { config, idioma } = usePais();
  const enPlan = useTarjetasEnPlan();
  const pagos = proximosPagos(enPlan, hoy, ingresos, config);

  return (
    <Pantalla conPestanas>
      <Texto variante="titulo" accessibilityRole="header" style={{ fontSize: 34, lineHeight: 40, letterSpacing: -0.6 }}>
        {t('tarjetas.titulo')}
      </Texto>
      {tarjetas.length === 0 ? <Texto color="textoSecundario">{t('tarjetas.vacio')}</Texto> : null}
      {tarjetas.length ? (
        <ListaAgrupada sangria={70}>
          {tarjetas.map(tarjeta => {
            const banco = buscarEmisor(catalogo, tarjeta.emisorId)?.nombreCorto ?? tarjeta.emisorTextoLibre ?? '';
            // Decisión D54: la fila dice el estado del pago de hoy; el corte y la fecha límite
            // configurados siguen en el detalle. En pausa no hay pago que mostrar.
            const pago = pagos.find(p => p.tarjeta.id === tarjeta.id);
            const fecha = pago ? textoFecha(pago.fecha, idioma) : '';
            const urgente = !!pago && !pago.pagado && (pago.dias <= 3 || pago.aviso?.tipo === 'antes');
            const estado = !enPlan.includes(tarjeta)
              ? t('plan.fueraDelPlan')
              : !pago
                ? t('registro.enPausa')
                : pago.pagado
                  ? t('pagos.pagadoLinea', { fecha })
                  : textoVence(pago.dias, fecha, t as never);
            return (
              <FilaLista
                key={tarjeta.id}
                iniciales={inicialesBanco(banco) || tarjeta.alias.slice(0, 2).toUpperCase()}
                titulo={tarjeta.alias}
                detalle={urgente ? undefined : estado}
                debajo={
                  urgente ? (
                    <Texto variante="apoyo" color="alertaTexto" style={{ fontSize: 13 }}>
                      {estado}
                    </Texto>
                  ) : undefined
                }
                flecha
                onPress={() => router.push({ pathname: '/tarjeta/[id]', params: { id: tarjeta.id } })}
              />
            );
          })}
        </ListaAgrupada>
      ) : null}
      <Boton titulo={t('tarjetas.agregar')} icono="mas" onPress={() => router.push('/tarjeta/nueva')} />
    </Pantalla>
  );
}
