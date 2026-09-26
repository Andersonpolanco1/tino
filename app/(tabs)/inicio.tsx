import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Boton, BotonPastilla, EtiquetaConInfo, Icono, ListaAgrupada, Pantalla, Superficie, Texto, useTema, type RolColor } from '@/diseno';
import { partesFechaLarga } from '@/i18n';
import { usePais } from '@/paises';
import { useAlmacen } from '@/estado';
import { useVistas, type VistaTarjeta } from '@/inicio/useVistas';
import { useHoy } from '@/inicio/useHoy';
import { fechaCorta, proximoPago, textoFecha, type Traducir } from '@/inicio/vista';
import { TarjetaDestacada } from '@/inicio/TarjetaDestacada';
import { FilaTarjeta } from '@/inicio/FilaTarjeta';
import { ControlEnfoque } from '@/inicio/SelectorEnfoque';
import { PildoraSemaforo } from '@/inicio/Semaforo';
import { ChipBanco } from '@/inicio/ChipBanco';

// Sección 3 de la especificación, con el rediseño: la tarjeta de hoy al abrir la app.
export default function Inicio() {
  const { t } = useTranslation();
  const tema = useTema();
  const router = useRouter();
  const hoy = useHoy();
  const { config, idioma } = usePais();
  const hayTarjetas = useAlmacen(s => s.tarjetas.length > 0);
  const modo = useAlmacen(s => s.preferencias?.enfoque.modo);
  const vistas = useVistas();
  const lista = vistas?.tarjetas ?? [];
  const unaSola = lista.length === 1;

  const abrir = (vista: VistaTarjeta) => router.push({ pathname: '/tarjeta/[id]', params: { id: vista.tarjeta.id } });

  // "Tengo una compra" va con texto junto a la fecha: un ícono solo había que adivinarlo.
  const encabezado = (
    <View style={{ gap: 2 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: tema.espacio.m }}>
        <Texto variante="apoyo" color="textoSecundario">
          {t('inicio.fechaHoy', partesFechaLarga(hoy, idioma))}
        </Texto>
        {hayTarjetas ? <BotonPastilla icono="compra" titulo={t('inicio.tengoUnaCompra')} onPress={() => router.push('/compra')} primario /> : null}
      </View>
      <Texto variante="titulo" accessibilityRole="header" style={{ fontSize: 30, lineHeight: 36, letterSpacing: -0.5 }}>
        {unaSola ? t('inicio.semaforoTitulo') : t('inicio.titulo')}
      </Texto>
    </View>
  );

  if (!hayTarjetas) {
    return (
      <Pantalla conPestanas>
        {encabezado}
        <Texto color="textoSecundario">{t('inicio.vacio')}</Texto>
        <Boton titulo={t('inicio.agregarTarjeta')} icono="mas" onPress={() => router.push('/tarjeta/nueva')} />
      </Pantalla>
    );
  }

  if (!lista.length) {
    return (
      <Pantalla conPestanas>
        {encabezado}
        <Texto color="textoSecundario">{t('inicio.todasEnPausa')}</Texto>
      </Pantalla>
    );
  }

  const [primera, ...resto] = lista;
  const pago = lista.map(v => ({ vista: v, fecha: proximoPago(v.tarjeta, hoy, config) })).sort((a, b) => (a.fecha < b.fecha ? -1 : 1))[0];
  const invitacion = (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push('/tarjeta/nueva')}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: tema.espacio.l, borderRadius: tema.radio.lista, backgroundColor: tema.color.neutroFondo }}
    >
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: tema.color.primario, alignItems: 'center', justifyContent: 'center' }}>
        <Icono nombre="mas" color="sobrePrimario" tamano={20} grosor={2.5} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Texto variante="cuerpoFuerte">{t('unaTarjeta.titulo')}</Texto>
        <Texto variante="apoyo" color="textoSecundario">
          {t('unaTarjeta.texto')}
        </Texto>
      </View>
    </Pressable>
  );

  // Sección 3.5: con una sola tarjeta la pregunta pasa de "¿qué tarjeta?" a "¿es buen momento?".
  if (unaSola) {
    const { tarjeta, resultado, esperar } = primera;
    const maximo = Math.max(resultado.diasGracia, esperar?.dias ?? 0, 1);
    const barra = (etiqueta: string, dias: number, color: RolColor) => (
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Texto variante="apoyo" color="textoSecundario">
            {etiqueta}
          </Texto>
          <Texto variante="apoyo" style={{ fontFamily: tema.texto.cuerpoFuerte.fontFamily }}>
            {t('unaTarjeta.diasN', { dias })}
          </Texto>
        </View>
        <View style={{ height: 10, borderRadius: 5, backgroundColor: tema.color.neutroFondo, overflow: 'hidden' }}>
          <View style={{ width: `${Math.round((dias / maximo) * 100)}%`, height: 10, borderRadius: 5, backgroundColor: tema.color[color] }} />
        </View>
      </View>
    );
    return (
      <Pantalla conPestanas>
        {encabezado}
        <Pressable accessibilityRole="button" onPress={() => abrir(primera)}>
          <Superficie radio={tema.radio.destacada} style={{ padding: 22, gap: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: tema.espacio.m }}>
              {primera.iniciales ? <ChipBanco iniciales={primera.iniciales} /> : null}
              <Texto variante="cuerpoFuerte" style={{ flex: 1, fontSize: 17 }}>
                {tarjeta.alias}
              </Texto>
              <PildoraSemaforo luz={resultado.semaforo} />
            </View>
            <Texto variante="titulo" style={{ fontSize: 24, lineHeight: 29, letterSpacing: -0.3 }}>
              {primera.mensajeSemaforo}
            </Texto>
            <View style={{ gap: tema.espacio.m }}>
              {barra(t('unaTarjeta.siLaUsasHoy'), resultado.diasGracia, esperar ? 'alertaTexto' : 'primario')}
              {esperar ? barra(t('unaTarjeta.siEsperas', { dia: esperar.dia }), esperar.dias, 'primario') : null}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: tema.espacio.s, paddingTop: 14, borderTopWidth: 1, borderTopColor: tema.color.divisor }}>
              <Texto variante="apoyo" color="textoSecundario">
                {t('inicio.corta', { fecha: primera.ciclo.proximoCorta })}
              </Texto>
              <Texto variante="apoyo" color="textoSecundario">
                {t('unaTarjeta.proximoPago', { fecha: fechaCorta(pago.fecha, idioma, t as unknown as Traducir) })}
              </Texto>
            </View>
          </Superficie>
        </Pressable>
        {invitacion}
      </Pantalla>
    );
  }

  return (
    <Pantalla conPestanas>
      {encabezado}
      <TarjetaDestacada vista={primera} motivo={modo ? t(`inicio.motivo.${modo}`) : undefined} onPress={() => abrir(primera)} />
      <View style={{ gap: tema.espacio.m }}>
        <EtiquetaConInfo etiqueta={t('inicio.otrasTarjetas')} info={t('inicio.enfoqueInfo')} variante="subtitulo" encabezado />
        <ControlEnfoque />
        <ListaAgrupada sangria={70}>
          {resto.map(v => (
            <FilaTarjeta key={v.tarjeta.id} vista={v} onPress={() => abrir(v)} />
          ))}
        </ListaAgrupada>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => abrir(pago.vista)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: tema.espacio.m,
          paddingVertical: tema.espacio.m,
          paddingHorizontal: tema.espacio.l,
          borderRadius: tema.radio.tarjeta,
          backgroundColor: tema.color.superficie,
          boxShadow: tema.sombra.tarjeta,
        }}
      >
        <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: tema.color.neutroFondo, alignItems: 'center', justifyContent: 'center' }}>
          <Icono nombre="calendario" color="primario" tamano={20} />
        </View>
        <View style={{ flex: 1, gap: 1 }}>
          <Texto variante="etiqueta" color="textoSecundario" style={{ fontFamily: tema.texto.apoyo.fontFamily }}>
            {t('inicio.proximoPago')}
          </Texto>
          <Texto variante="cuerpoFuerte">{t('inicio.proximoPagoDe', { alias: pago.vista.tarjeta.alias, fecha: textoFecha(pago.fecha, idioma) })}</Texto>
        </View>
        <Icono nombre="derecha" color="textoSecundario" tamano={18} />
      </Pressable>
    </Pantalla>
  );
}
