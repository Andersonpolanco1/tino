import { Pressable, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BarraSuperior, Etiqueta, FilaLista, Icono, ListaAgrupada, Palanca, Pantalla, Superficie, Texto, useTema } from '@/diseno';
import { usePais } from '@/paises';
import { useAlmacen } from '@/estado';
import { numeroDe } from '@/motor/fechas';
import { useVistaTarjeta } from '@/inicio/useVistas';
import { useHoy } from '@/inicio/useHoy';
import { fechaCorta, type Traducir } from '@/inicio/vista';
import { precisionTarjeta } from '@/inicio/precision';
import { PildoraSemaforo } from '@/inicio/Semaforo';
import { ChipBanco } from '@/inicio/ChipBanco';
import { ConfirmarValorPunto, valorPuntoPorConfirmar } from '@/inicio/ConfirmarValorPunto';

// Detalle de tarjeta (sección 3.3) con el rediseño: semáforo, línea del ciclo, recompensa,
// balance en dólares, En pausa y precisión.
export default function DetalleTarjeta() {
  const { t } = useTranslation();
  const traducir = t as unknown as Traducir;
  const tema = useTema();
  const router = useRouter();
  const hoy = useHoy();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { config, idioma } = usePais();
  const vista = useVistaTarjeta(id);
  const alternarPausa = useAlmacen(s => s.alternarPausa);
  if (!vista) return null;

  const { tarjeta, resultado } = vista;
  const editar = () => router.push({ pathname: '/tarjeta/editar/[id]', params: { id: tarjeta.id } });
  const editarRecompensa = () => router.push({ pathname: '/tarjeta/editar/[id]', params: { id: tarjeta.id, seccion: 'recompensa' } });
  const puntoPorConfirmar = valorPuntoPorConfirmar(tarjeta);
  const precision = precisionTarjeta(tarjeta, { hayIngresos: false, catalogoDisponible: config.catalogoDisponible });
  const detalle = tarjeta.ultimos4 ? t('inicio.bancoTermina', { banco: vista.banco, ultimos4: tarjeta.ultimos4 }) : vista.banco;

  // Línea del ciclo: del último corte a la fecha de pago de una compra de hoy.
  const inicio = numeroDe(vista.ciclo.anterior);
  const fin = numeroDe(resultado.fechaPago);
  const posicion = (fecha: string) => `${Math.round(((numeroDe(fecha) - inicio) / Math.max(1, fin - inicio)) * 100)}%` as const;
  const hito = (etiqueta: string, fecha: string, alineacion: 'left' | 'center' | 'right') => (
    <View style={{ flex: 1 }}>
      <Texto variante="etiqueta" color="textoSecundario" style={{ fontFamily: tema.texto.apoyo.fontFamily, textAlign: alineacion }}>
        {etiqueta}
      </Texto>
      <Texto variante="etiqueta" style={{ textAlign: alineacion }}>
        {fechaCorta(fecha, idioma, traducir)}
      </Texto>
    </View>
  );

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
            <Pressable
              accessibilityRole="button"
              onPress={editar}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                minHeight: tema.toqueMinimo,
                paddingHorizontal: tema.espacio.l,
                borderRadius: tema.radio.circular,
                backgroundColor: tema.color.superficie,
                boxShadow: tema.sombra.boton,
              }}
            >
              <Icono nombre="editar" tamano={16} />
              <Texto variante="cuerpoFuerte" style={{ fontSize: 14 }}>
                {t('detalle.editar')}
              </Texto>
            </Pressable>
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

      <Superficie radio={24} style={{ padding: tema.espacio.xl, gap: tema.espacio.l }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <PildoraSemaforo luz={resultado.semaforo} />
          <Texto variante="apoyo" color="textoSecundario" style={{ fontSize: 13 }}>
            {t('detalle.siUsasHoy')}
          </Texto>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
          <Texto variante="cifraGrande" style={{ lineHeight: 64, letterSpacing: -1.5 }}>
            {resultado.diasGracia}
          </Texto>
          <View style={{ paddingBottom: 2, flexShrink: 1 }}>
            <Texto variante="cuerpoFuerte">{t('inicio.diasParaPagar')}</Texto>
            <Texto color="textoSecundario">{t('inicio.sePagaEl', { fecha: vista.fechaPago })}</Texto>
          </View>
        </View>
        {resultado.semaforo !== 'verde' ? <Texto variante="apoyo">{vista.mensajeSemaforo}</Texto> : null}
        <View style={{ gap: 10 }}>
          <View style={{ height: 24 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <View style={{ position: 'absolute', left: 6, right: 6, top: 10, height: 4, borderRadius: 2, backgroundColor: tema.color.neutroFondo }} />
            <View style={{ position: 'absolute', left: 6, width: posicion(hoy), top: 10, height: 4, borderRadius: 2, backgroundColor: tema.color.primario }} />
            <View style={{ position: 'absolute', left: 0, top: 6, width: 12, height: 12, borderRadius: 6, backgroundColor: tema.color.primario }} />
            <View style={{ position: 'absolute', left: posicion(hoy), marginLeft: -4, top: 2, width: 20, height: 20, borderRadius: 10, borderWidth: 4, borderColor: tema.color.primario, backgroundColor: tema.color.superficie }} />
            <View style={{ position: 'absolute', left: posicion(resultado.proximoCorte), top: 6, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: tema.color.textoSecundario, backgroundColor: tema.color.superficie }} />
            <View style={{ position: 'absolute', right: 0, top: 6, width: 12, height: 12, borderRadius: 6, backgroundColor: tema.color.recompensaPunto }} />
          </View>
          <View style={{ flexDirection: 'row', gap: tema.espacio.xs }}>
            {hito(t('detalle.hitoCorto'), vista.ciclo.anterior, 'left')}
            {hito(t('detalle.hitoHoy'), hoy, 'left')}
            {hito(t('detalle.hitoCorta'), resultado.proximoCorte, 'center')}
            {hito(t('detalle.hitoPagas'), resultado.fechaPago, 'right')}
          </View>
        </View>
      </Superficie>

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
          {puntoPorConfirmar ? t('detalle.precisionPunto') : t('detalle.precisionCobros')}
        </Texto>
      </Superficie>
    </Pantalla>
  );
}
