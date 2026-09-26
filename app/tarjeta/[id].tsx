import { View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BarraSuperior, BotonPastilla, Etiqueta, FilaLista, ListaAgrupada, Palanca, Pantalla, Superficie, Texto, useTema } from '@/diseno';
import { usePais } from '@/paises';
import { useAlmacen } from '@/estado';
import { useVistaTarjeta } from '@/inicio/useVistas';
import { useHoy } from '@/inicio/useHoy';
import { pistaPrecision, precisionTarjeta } from '@/inicio/precision';
import { PildoraSemaforo } from '@/inicio/Semaforo';
import { ChipBanco } from '@/inicio/ChipBanco';
import { BloqueDias } from '@/inicio/BloqueDias';
import { proximosPagos } from '@/pagos/pendientes';
import { FilaPago } from '@/pagos/FilaPago';
import { LineaCiclo } from '@/inicio/LineaCiclo';
import { avisoCobro, subtituloTarjeta, textoFecha, type Traducir } from '@/inicio/vista';
import { ConfirmarValorPunto, valorPuntoPorConfirmar } from '@/inicio/ConfirmarValorPunto';

// Detalle de tarjeta (sección 3.3) con el rediseño: semáforo, línea del ciclo, recompensa,
// balance en dólares, En pausa y precisión.
export default function DetalleTarjeta() {
  const { t } = useTranslation();
  const tema = useTema();
  const router = useRouter();
  const hoy = useHoy();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { config, idioma } = usePais();
  const vista = useVistaTarjeta(id);
  const alternarPausa = useAlmacen(s => s.alternarPausa);
  const ingresos = useAlmacen(s => s.ingresos);
  const hayIngresos = ingresos.length > 0;
  if (!vista) return null;

  const { tarjeta, resultado } = vista;
  const editar = () => router.push({ pathname: '/tarjeta/editar/[id]', params: { id: tarjeta.id } });
  const editarRecompensa = () => router.push({ pathname: '/tarjeta/editar/[id]', params: { id: tarjeta.id, seccion: 'recompensa' } });
  const puntoPorConfirmar = valorPuntoPorConfirmar(tarjeta);
  // Sección 5.3: si una compra de hoy vence antes del próximo cobro, se dice cuándo se cobra.
  const aviso = avisoCobro(resultado.fechaPago, hoy, ingresos, config);
  // El pago pendiente de esta tarjeta, con "Ya pagué" (decisión D45).
  const [pendiente] = tarjeta.enPausa ? [] : proximosPagos([tarjeta], hoy, ingresos, config);
  const contextoPrecision = { hayIngresos, catalogoDisponible: config.catalogoDisponible };
  const precision = precisionTarjeta(tarjeta, contextoPrecision);
  const pista = pistaPrecision([tarjeta], contextoPrecision);
  const detalle = subtituloTarjeta(tarjeta.alias, vista.banco, tarjeta.ultimos4, t as unknown as Traducir);

  const resumenRecompensa =
    tarjeta.recompensa.tipo === 'cashback'
      ? t('detalle.cashbackPorcentaje', { porcentaje: tarjeta.recompensa.porcentaje })
      : tarjeta.recompensa.tipo === 'puntos'
        ? t('detalle.puntos')
        : t('detalle.sinRecompensaCorta');
  const resumenMoneda: Record<string, string> = {
    doble_balance: t('registro.resumenConDolares'),
    solo_principal: t('registro.resumenSinDolares'),
    solo_usd: t('registro.resumenSoloDolares'),
    solo_local: t('registro.resumenSoloLocal'),
  };

  return (
    <Pantalla
      arriba={
        <BarraSuperior
          izquierda={{ tipo: 'atras', onPress: () => router.back() }}
          derecha={
            <BotonPastilla icono="editar" titulo={t('detalle.editar')} onPress={editar} />
          }
        />
      }
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: tema.espacio.m }}>
        {vista.iniciales ? <ChipBanco iniciales={vista.iniciales} grande /> : null}
        <View style={{ flexShrink: 1 }}>
          <Texto variante="titulo" accessibilityRole="header" style={{ letterSpacing: -0.4 }}>
            {tarjeta.alias}
          </Texto>
          {detalle ? (
            <Texto variante="apoyo" color="textoSecundario">
              {detalle}
            </Texto>
          ) : null}
        </View>
      </View>
      {tarjeta.enPausa ? <Etiqueta tipo="neutra" texto={t('detalle.enPausa')} /> : null}
      {puntoPorConfirmar ? <ConfirmarValorPunto tarjeta={tarjeta} onCambiar={editarRecompensa} /> : null}

      {/* Mismas piezas que la tarjeta de hoy, en blanco: el verde queda para la recomendada. */}
      <Superficie radio={tema.radio.destacada} style={{ padding: 20, gap: tema.espacio.m }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: tema.espacio.s }}>
          <Texto variante="etiqueta" color="textoSecundario" style={{ fontFamily: tema.texto.apoyo.fontFamily, flexShrink: 1 }}>
            {t('detalle.siUsasHoy')}
          </Texto>
          <PildoraSemaforo luz={resultado.semaforo} />
        </View>
        <BloqueDias dias={resultado.diasGracia} fechaPago={vista.fechaPago} />
        <LineaCiclo anterior={vista.ciclo.anterior} hoy={hoy} corte={resultado.proximoCorte} pago={resultado.fechaPago} />
        {resultado.semaforo !== 'verde' ? <Texto variante="apoyo">{vista.mensajeSemaforo}</Texto> : null}
        {aviso ? (
          <Texto variante="apoyo" color="alertaTexto">
            {t(aviso.tipo === 'antes' ? 'detalle.avisoHoyAntesDelCobro' : 'inicio.avisoCobroEstimado', { cobro: textoFecha(aviso.cobro, idioma) })}
          </Texto>
        ) : null}
      </Superficie>

      {pendiente ? (
        <ListaAgrupada titulo={t('inicio.porPagar')}>
          <FilaPago pago={pendiente} conNombre={false} />
        </ListaAgrupada>
      ) : null}

      <ListaAgrupada>
        <FilaLista
          icono="moneda"
          tono="recompensa"
          titulo={resumenRecompensa}
          detalle={vista.recompensa ?? t('detalle.sinRecompensa')}
          flecha
          onPress={editarRecompensa}
        />
        {config.funciones.dobleBalance ? (
          <FilaLista icono="dinero" titulo={t('registro.seccionMoneda')} detalle={resumenMoneda[tarjeta.monedaFacturacion]} flecha onPress={editar} />
        ) : null}
        <FilaLista
          icono="pausa"
          tono="neutro"
          titulo={t('registro.enPausa')}
          detalle={t('detalle.pausaDetalle')}
          derecha={<Palanca valor={tarjeta.enPausa} onCambio={() => alternarPausa(tarjeta.id)} etiqueta={t('registro.enPausa')} />}
        />
      </ListaAgrupada>

      <Superficie radio={20} style={{ padding: tema.espacio.l, gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Texto variante="cuerpoFuerte">{t('detalle.precisionTitulo')}</Texto>
          <Texto variante="cifra" color="primario" style={{ fontSize: 22 }}>
            {t('comun.porcentaje', { valor: precision })}
          </Texto>
        </View>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: tema.color.neutroFondo, overflow: 'hidden' }}>
          <View style={{ width: `${precision}%`, height: 8, borderRadius: 4, backgroundColor: tema.color.primario }} />
        </View>
        <Texto variante="apoyo" color="textoSecundario" style={{ fontSize: 13 }}>
          {t(`detalle.precisionPista.${pista}`)}
        </Texto>
      </Superficie>
    </Pantalla>
  );
}
