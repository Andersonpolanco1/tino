import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Boton, BotonPastilla, Icono, ListaAgrupada, Pantalla, Superficie, Texto, useTema, type RolColor } from '@/diseno';
import { partesFechaLarga } from '@/i18n';
import { usePais } from '@/paises';
import { useAlmacen } from '@/estado';
import { useVistas, type VistaTarjeta } from '@/inicio/useVistas';
import { useHoy } from '@/inicio/useHoy';
import { fechaCorta, proximoPago, type Traducir } from '@/inicio/vista';
import { TarjetaDestacada } from '@/inicio/TarjetaDestacada';
import { FilaTarjeta } from '@/inicio/FilaTarjeta';
import { SelectorEnfoque } from '@/inicio/SelectorEnfoque';
import { PildoraSemaforo } from '@/inicio/Semaforo';
import { ChipBanco } from '@/inicio/ChipBanco';
import { SugerenciaDatos } from '@/sugerencias/SugerenciaDatos';
import { pagosParaInicio, proximosPagos } from '@/pagos/pendientes';
import { FilaPago } from '@/pagos/FilaPago';

// Sección 3 de la especificación, con el rediseño: la tarjeta de hoy al abrir la app.
export default function Inicio() {
  const { t } = useTranslation();
  const tema = useTema();
  const router = useRouter();
  const hoy = useHoy();
  const { config, idioma } = usePais();
  const hayTarjetas = useAlmacen(s => s.tarjetas.length > 0);
  const ingresos = useAlmacen(s => s.ingresos);
  const vistas = useVistas();
  const lista = vistas?.tarjetas ?? [];
  const unaSola = lista.length === 1;

  const abrir = (vista: VistaTarjeta) => router.push({ pathname: '/tarjeta/[id]', params: { id: vista.tarjeta.id } });

  // "Tengo una compra" va con texto junto a la fecha: un ícono solo había que adivinarlo.
  const filaFecha = (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: tema.espacio.m }}>
      <Texto variante="apoyo" color="textoSecundario">
        {t('inicio.fechaHoy', partesFechaLarga(hoy, idioma))}
      </Texto>
      {hayTarjetas ? <BotonPastilla icono="compra" titulo={t('inicio.tengoUnaCompra')} onPress={() => router.push('/compra')} primario /> : null}
    </View>
  );
  const titulo = (
    <Texto variante="titulo" accessibilityRole="header" style={{ fontSize: 30, lineHeight: 36, letterSpacing: -0.5 }}>
      {unaSola ? t('inicio.semaforoTitulo') : t('inicio.titulo')}
    </Texto>
  );
  const encabezado = (
    <View style={{ gap: 2 }}>
      {filaFecha}
      {titulo}
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

  // Por pagar (decisión D44): solo los pagos sin marcar que vencen en 7 días o menos, o antes
  // del próximo cobro. La lista completa está en la pestaña Tarjetas.
  const porPagar = pagosParaInicio(proximosPagos(lista.map(v => v.tarjeta), hoy, ingresos, config));
  const seccionPorPagar = porPagar.length ? (
    <View style={{ gap: tema.espacio.m }}>
      <Texto variante="subtitulo" accessibilityRole="header">
        {t('inicio.porPagar')}
      </Texto>
      <ListaAgrupada>
        {porPagar.map(p => (
          <FilaPago key={p.tarjeta.id} pago={p} />
        ))}
      </ListaAgrupada>
    </View>
  ) : null;

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
        {seccionPorPagar}
        <SugerenciaDatos />
      </Pantalla>
    );
  }

  // De arriba abajo: el enfoque, "Hoy te conviene usar" con la tarjeta que gana, las demás y lo que queda por pagar.
  return (
    <Pantalla conPestanas>
      {filaFecha}
      {/* "Hoy te conviene usar", priorizando…, y la tarjeta que gana (decisión D48). */}
      <View style={{ gap: tema.espacio.m }}>
        <View>
          {titulo}
          <SelectorEnfoque />
        </View>
        <TarjetaDestacada vista={primera} mostrarUltimos4={lista.some(v => v !== primera && v.banco === primera.banco)} onPress={() => abrir(primera)} />
      </View>
      <View style={{ gap: tema.espacio.m }}>
        <Texto variante="subtitulo" accessibilityRole="header">
          {t('inicio.otrasOpciones')}
        </Texto>
        <ListaAgrupada sangria={70}>
          {resto.map(v => (
            <FilaTarjeta key={v.tarjeta.id} vista={v} onPress={() => abrir(v)} />
          ))}
        </ListaAgrupada>
      </View>
      {seccionPorPagar}
      <SugerenciaDatos />
    </Pantalla>
  );
}
