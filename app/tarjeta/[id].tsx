import { View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Boton, EtiquetaConInfo, Etiqueta, Interruptor, Pantalla, Texto, useTema } from '@/diseno';
import { formatearMoneda } from '@/i18n';
import { usePais } from '@/paises';
import { useAlmacen } from '@/estado';
import { aFecha, corteAnterior, numeroDe } from '@/motor/fechas';
import { useVistaTarjeta } from '@/inicio/useVistas';
import { useHoy } from '@/inicio/useHoy';
import { proximoPago, textoFecha } from '@/inicio/vista';
import { precisionTarjeta } from '@/inicio/precision';
import { Semaforo } from '@/inicio/Semaforo';

// Detalle de tarjeta (sección 3.3): semáforo del ciclo, fechas, recompensa, En pausa y editar.
export default function DetalleTarjeta() {
  const { t } = useTranslation();
  const tema = useTema();
  const router = useRouter();
  const hoy = useHoy();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { config, idioma } = usePais();
  const vista = useVistaTarjeta(id);
  const alternarPausa = useAlmacen(s => s.alternarPausa);
  if (!vista) return null;

  const { tarjeta, resultado } = vista;
  const anterior = aFecha(corteAnterior(numeroDe(resultado.proximoCorte), tarjeta.diaCorte));
  const precision = precisionTarjeta(tarjeta, { hayIngresos: false, catalogoDisponible: config.catalogoDisponible });
  const fila = (etiqueta: string, valor: string) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: tema.espacio.m }}>
      <Texto color="textoSecundario">{etiqueta}</Texto>
      <Texto variante="cuerpoFuerte">{valor}</Texto>
    </View>
  );
  const bloque = { backgroundColor: tema.color.superficie, borderColor: tema.color.borde, borderWidth: 1, borderRadius: tema.radio.tarjeta, padding: tema.espacio.l, gap: tema.espacio.m };

  return (
    <Pantalla conEncabezado>
      <Stack.Screen options={{ headerShown: true, title: tarjeta.alias }} />
      {tarjeta.enPausa ? <Etiqueta tipo="neutra" texto={t('detalle.enPausa')} /> : null}

      <View style={bloque}>
        <Semaforo luz={resultado.semaforo} grande />
        <Texto>{vista.mensajeSemaforo}</Texto>
      </View>

      <View style={bloque}>
        <Texto variante="subtitulo">{t('detalle.siUsasHoy')}</Texto>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: tema.espacio.s, flexWrap: 'wrap' }}>
          <Texto variante="cifra">{resultado.diasGracia}</Texto>
          <Texto>{t('inicio.diasParaPagar')}</Texto>
        </View>
        <Texto color="textoSecundario">{t('inicio.sePagaEl', { fecha: vista.fechaPago })}</Texto>
      </View>

      <View style={bloque}>
        <Texto variante="subtitulo">{t('detalle.cicloTitulo')}</Texto>
        {fila(t('detalle.corteAnterior'), textoFecha(anterior, idioma))}
        {fila(t('detalle.proximoCorte'), `${textoFecha(resultado.proximoCorte, idioma)} · ${t('inicio.cortaEn', { dias: resultado.diasParaCorte })}`)}
        {fila(t('detalle.pagoPendiente'), textoFecha(proximoPago(tarjeta, hoy, config), idioma))}
      </View>

      <View style={bloque}>
        <Texto variante="subtitulo">{t('detalle.recompensaTitulo')}</Texto>
        <Texto>{vista.recompensa ?? t('detalle.sinRecompensa')}</Texto>
        {tarjeta.recompensa.tipo === 'puntos' ? (
          <Texto color="textoSecundario">
            {t('detalle.valorPunto', { valor: formatearMoneda(tarjeta.recompensa.valorPunto, config.monedaPrincipal, idioma) })}
          </Texto>
        ) : null}
        {vista.etiquetas.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tema.espacio.xs }}>
            {vista.etiquetas.map(e => (
              <Etiqueta key={e.texto} tipo={e.tipo} texto={e.texto} />
            ))}
          </View>
        ) : null}
      </View>

      <EtiquetaConInfo etiqueta={t('detalle.precision', { porcentaje: precision })} info={t('detalle.precisionInfo')} variante="cuerpo" />
      <Interruptor etiqueta={t('registro.enPausa')} info={t('registro.info.enPausa')} valor={tarjeta.enPausa} onCambio={() => alternarPausa(tarjeta.id)} />
      <Boton titulo={t('detalle.editar')} variante="secundario" onPress={() => router.push({ pathname: '/tarjeta/editar/[id]', params: { id: tarjeta.id } })} />
    </Pantalla>
  );
}
