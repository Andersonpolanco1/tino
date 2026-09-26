import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Boton, Etiqueta, FilaLista, ListaAgrupada, Pantalla, Texto } from '@/diseno';
import { useAlmacen } from '@/estado';
import { useCatalogo } from '@/catalogo';
import { buscarEmisor } from '@/registro/borrador';
import { inicialesBanco } from '@/inicio/vista';
import { useHoy } from '@/inicio/useHoy';
import { usePais } from '@/paises';
import { proximosPagos } from '@/pagos/pendientes';
import { FilaPago } from '@/pagos/FilaPago';

// Lista de tarjetas registradas (rediseño): lista agrupada; tocar una abre su detalle.
export default function Tarjetas() {
  const { t } = useTranslation();
  const router = useRouter();
  const tarjetas = useAlmacen(s => s.tarjetas);
  const catalogo = useCatalogo();
  const ingresos = useAlmacen(s => s.ingresos);
  const hoy = useHoy();
  const { config } = usePais();
  // Decisión D44: todos los pagos pendientes, pagados o no, en orden de fecha.
  const pagos = proximosPagos(tarjetas, hoy, ingresos, config);

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
            const pago =
              tarjeta.fechaLimite.tipo === 'dia_del_mes'
                ? t('registro.resumenPagoDia', { dia: tarjeta.fechaLimite.dia })
                : t('registro.resumenPagoDias', { dias: tarjeta.fechaLimite.dias });
            return (
              <FilaLista
                key={tarjeta.id}
                iniciales={inicialesBanco(banco) || tarjeta.alias.slice(0, 2).toUpperCase()}
                titulo={tarjeta.alias}
                detalle={`${t('registro.resumenCorteDia', { dia: tarjeta.diaCorte })} · ${pago}`}
                derecha={tarjeta.enPausa ? <Etiqueta tipo="neutra" texto={t('registro.enPausa')} /> : undefined}
                flecha
                onPress={() => router.push({ pathname: '/tarjeta/[id]', params: { id: tarjeta.id } })}
              />
            );
          })}
        </ListaAgrupada>
      ) : null}
      <Boton titulo={t('tarjetas.agregar')} icono="mas" onPress={() => router.push('/tarjeta/nueva')} />
      {pagos.length ? (
        <ListaAgrupada titulo={t('pagos.proximos')}>
          {pagos.map(p => (
            <FilaPago key={p.tarjeta.id} pago={p} />
          ))}
        </ListaAgrupada>
      ) : null}
    </Pantalla>
  );
}
