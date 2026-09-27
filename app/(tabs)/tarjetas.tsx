import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Boton, BotonPastilla, FilaLista, ListaAgrupada, Pantalla, Texto, useTema } from '@/diseno';
import type { Tarjeta } from '@/tipos/tipos';
import { useAlmacen } from '@/estado';
import { logoEmisor, useCatalogo } from '@/catalogo';
import { textosConsejo, useConsejosFechas } from '@/consejos';
import { buscarEmisor } from '@/registro/borrador';
import { inicialesBanco, textoFecha, type Traducir as TraducirVista } from '@/inicio/vista';
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
  const tema = useTema();
  const enPlan = useTarjetasEnPlan();
  // Al vencer Pro, las que quedan fuera del plan gratis se ven aparte: siguen guardadas, pero no
  // cuentan (15.2). Mezcladas con las activas parecía que las 3 funcionaban.
  const guardadas = tarjetas.filter(x => !enPlan.includes(x));
  const pagos = proximosPagos(enPlan, hoy, ingresos, config);
  const consejos = useConsejosFechas();

  const fila = (tarjeta: Tarjeta) => {
    const emisor = buscarEmisor(catalogo, tarjeta.emisorId);
    const banco = emisor?.nombreCorto ?? tarjeta.emisorTextoLibre ?? '';
    // Decisión D54: la fila dice el estado del pago de hoy; el corte y la fecha límite
    // configurados siguen en el detalle. En pausa no hay pago que mostrar.
    const pago = pagos.find(p => p.tarjeta.id === tarjeta.id);
    const fecha = pago ? textoFecha(pago.fecha, idioma) : '';
    const urgente = !!pago && !pago.pagado && (pago.dias <= 3 || pago.aviso?.tipo === 'antes');
    const estado = !enPlan.includes(tarjeta)
      ? t('plan.etiquetaFuera')
      : !pago
        ? t('registro.enPausa')
        : pago.pagado
          ? t('pagos.pagadoLinea', { fecha })
          : textoVence(pago.dias, fecha, t as never);
    return (
      <FilaLista
        key={tarjeta.id}
        iniciales={inicialesBanco(banco) || tarjeta.alias.slice(0, 2).toUpperCase()}
        logo={logoEmisor(emisor)}
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
  };

  return (
    <Pantalla conPestanas>
      <Texto variante="titulo" accessibilityRole="header" style={{ fontSize: 34, lineHeight: 40, letterSpacing: -0.6 }}>
        {t('tarjetas.titulo')}
      </Texto>
      {tarjetas.length === 0 ? <Texto color="textoSecundario">{t('tarjetas.vacio')}</Texto> : null}
      {enPlan.length ? <ListaAgrupada sangria={70}>{enPlan.map(fila)}</ListaAgrupada> : null}
      <Boton titulo={t('tarjetas.agregar')} icono="mas" onPress={() => router.push('/tarjeta/nueva')} />
      {/* Decisión D65: qué fecha de corte pedirle al banco para evitar moras o tener más días. */}
      {consejos.length ? (
        <ListaAgrupada titulo={t('consejos.seccion')}>
          {consejos.map(consejo => {
            const textos = textosConsejo(consejo, tarjetas, t as unknown as TraducirVista, idioma);
            return (
              <FilaLista
                key={`${consejo.tipo}:${consejo.tarjetaId}`}
                icono="calendario"
                tono={consejo.tipo === 'pagoAntesDelCobro' ? 'alerta' : 'primario'}
                titulo={textos.titulo}
                detalle={textos.resumen}
                flecha
                onPress={() => router.push('/consejos/fechas')}
              />
            );
          })}
        </ListaAgrupada>
      ) : null}
      {guardadas.length ? (
        <View style={{ gap: tema.espacio.m, paddingTop: tema.espacio.s }}>
          <View style={{ gap: tema.espacio.xs }}>
            <Texto variante="subtitulo" accessibilityRole="header">
              {t('tarjetas.guardadasTitulo')}
            </Texto>
            <Texto variante="apoyo" color="textoSecundario">
              {t('tarjetas.guardadasTexto', { count: guardadas.length })}
            </Texto>
          </View>
          <ListaAgrupada sangria={70}>{guardadas.map(fila)}</ListaAgrupada>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tema.espacio.s }}>
            <BotonPastilla icono="tarjetas" titulo={t('tarjetas.cambiarElegidas')} onPress={() => router.push('/plan/elegir')} />
            <BotonPastilla icono="estrella" titulo={t('plan.renovar')} onPress={() => router.push({ pathname: '/pro', params: { motivo: 'voluntario' } })} />
          </View>
        </View>
      ) : null}
    </Pantalla>
  );
}
