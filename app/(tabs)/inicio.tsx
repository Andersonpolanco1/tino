import { useState } from 'react';
import { LayoutAnimation, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { OrdenVista } from '@/motor';
import { Boton, Icono, Pantalla, Texto, useTema } from '@/diseno';
import { partesFechaLarga } from '@/i18n';
import { usePais } from '@/paises';
import { useAlmacen } from '@/estado';
import { useVistas, type VistaTarjeta } from '@/inicio/useVistas';
import { useHoy } from '@/inicio/useHoy';
import { proximoPago, textoFecha } from '@/inicio/vista';
import { TarjetaDestacada } from '@/inicio/TarjetaDestacada';
import { FilaTarjeta } from '@/inicio/FilaTarjeta';
import { BarraOrden } from '@/inicio/BarraOrden';
import { SelectorEnfoque } from '@/inicio/SelectorEnfoque';
import { Semaforo } from '@/inicio/Semaforo';

// Sección 3 de la especificación y maquetas de inicio: la tarjeta de hoy al abrir la app.
export default function Inicio() {
  const { t } = useTranslation();
  const tema = useTema();
  const router = useRouter();
  const hoy = useHoy();
  const { config, idioma } = usePais();
  const hayTarjetas = useAlmacen(s => s.tarjetas.length > 0);
  const [orden, setOrden] = useState<OrdenVista>('recomendado');
  const vistas = useVistas({ orden });

  const abrir = (vista: VistaTarjeta) => router.push({ pathname: '/tarjeta/[id]', params: { id: vista.tarjeta.id } });
  const cambiarOrden = (nuevo: OrdenVista) => {
    // Sección 16.6: el reordenamiento se anima sin saltos.
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOrden(nuevo);
  };

  const encabezado = (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: tema.espacio.m }}>
      <View style={{ flexShrink: 1, gap: tema.espacio.xs }}>
        <Texto variante="apoyo" color="textoSecundario">
          {t('inicio.fechaHoy', partesFechaLarga(hoy, idioma))}
        </Texto>
        <Texto variante="titulo" accessibilityRole="header">
          {t('inicio.titulo')}
        </Texto>
      </View>
      {hayTarjetas ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('inicio.tengoUnaCompra')}
          onPress={() => router.push('/compra')}
          style={{
            width: tema.toqueMinimo,
            height: tema.toqueMinimo,
            borderRadius: tema.radio.circular,
            borderWidth: 1,
            borderColor: tema.color.borde,
            backgroundColor: tema.color.superficie,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icono nombre="compra" />
        </Pressable>
      ) : null}
    </View>
  );

  if (!hayTarjetas) {
    return (
      <Pantalla>
        {encabezado}
        <Texto color="textoSecundario">{t('inicio.vacio')}</Texto>
        <Boton titulo={t('inicio.agregarTarjeta')} onPress={() => router.push('/tarjeta/nueva')} />
      </Pantalla>
    );
  }

  const lista = vistas?.tarjetas ?? [];
  if (!lista.length) {
    return (
      <Pantalla>
        {encabezado}
        <Texto color="textoSecundario">{t('inicio.todasEnPausa')}</Texto>
      </Pantalla>
    );
  }

  const [primera, ...resto] = lista;
  const pago = lista
    .map(v => ({ vista: v, fecha: proximoPago(v.tarjeta, hoy, config) }))
    .sort((a, b) => (a.fecha < b.fecha ? -1 : 1))[0];
  const franjaPago = (
    <Pressable
      accessibilityRole="button"
      onPress={() => abrir(pago.vista)}
      style={{
        backgroundColor: tema.color.superficie,
        borderColor: tema.color.borde,
        borderWidth: 1,
        borderRadius: tema.radio.tarjeta,
        paddingVertical: tema.espacio.m,
        paddingHorizontal: tema.espacio.l,
        gap: tema.espacio.xs,
      }}
    >
      <Texto variante="apoyo" color="textoSecundario">
        {t('inicio.proximoPago')}
      </Texto>
      <Texto variante="cuerpoFuerte">
        {t('inicio.proximoPagoDe', { alias: pago.vista.tarjeta.alias, fecha: textoFecha(pago.fecha, idioma) })}
      </Texto>
    </Pressable>
  );

  // Sección 3.5: con una sola tarjeta la pregunta pasa de "¿qué tarjeta?" a "¿es buen momento?".
  if (lista.length === 1) {
    return (
      <Pantalla>
        {encabezado}
        <View
          style={{
            backgroundColor: tema.color.superficie,
            borderColor: tema.color.borde,
            borderWidth: 1,
            borderRadius: tema.radio.destacada,
            padding: tema.espacio.xl,
            gap: tema.espacio.m,
          }}
        >
          <Texto variante="apoyo" color="textoSecundario">
            {t('inicio.semaforoTitulo')}
          </Texto>
          <Semaforo luz={primera.resultado.semaforo} grande />
          <Texto>{primera.mensajeSemaforo}</Texto>
        </View>
        <TarjetaDestacada vista={primera} onPress={() => abrir(primera)} />
        {franjaPago}
        <Texto color="textoSecundario">{t('unaTarjeta.invitacion')}</Texto>
        <Boton titulo={t('inicio.agregarTarjeta')} variante="secundario" onPress={() => router.push('/tarjeta/nueva')} />
      </Pantalla>
    );
  }

  return (
    <Pantalla>
      {encabezado}
      <TarjetaDestacada vista={primera} onPress={() => abrir(primera)} />
      <View style={{ gap: tema.espacio.s }}>
        <SelectorEnfoque />
        <BarraOrden valor={orden} onCambio={cambiarOrden} />
      </View>
      <View style={{ gap: tema.espacio.s }}>
        <Texto variante="cuerpoFuerte" color="textoSecundario">
          {t('inicio.otrasTarjetas')}
        </Texto>
        {resto.map(v => (
          <FilaTarjeta key={v.tarjeta.id} vista={v} onPress={() => abrir(v)} />
        ))}
      </View>
      {franjaPago}
    </Pantalla>
  );
}
