import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BarraSuperior, Boton, Pantalla, Superficie, Texto, useTema } from '@/diseno';
import { useTarjetasEnPlan } from '@/suscripciones';
import { textosConsejo, useConsejosNuevos } from '@/consejos';
import type { Traducir } from '@/inicio/vista';
import { useVolver } from '@/utilidades/useVolver';

// Consejos de fechas (decisión D73): qué pasa, qué pedirle al banco y cómo, sin fechas exactas.
// "Ya lo sé" oculta el consejo mientras sus fechas y cobros sigan iguales.
export default function ConsejosFechas() {
  const { t } = useTranslation();
  const tema = useTema();
  const router = useRouter();
  const volver = useVolver();
  const tarjetas = useTarjetasEnPlan();
  const { consejos, marcar, ocultar } = useConsejosNuevos();
  // Decisión D68: al abrir la pantalla, los consejos quedan vistos (siguen aquí y en Tarjetas).
  const marcarAlAbrir = useRef(marcar);
  marcarAlAbrir.current = marcar;
  useEffect(() => marcarAlAbrir.current(), []);

  return (
    <Pantalla arriba={<BarraSuperior izquierda={{ tipo: 'atras', onPress: volver }} />}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ gap: tema.espacio.s }}>
        <Texto variante="titulo" accessibilityRole="header">
          {t('consejos.titulo')}
        </Texto>
        <Texto color="textoSecundario">{t('consejos.intro')}</Texto>
      </View>
      {consejos.length === 0 ? <Texto>{t('consejos.sinConsejos')}</Texto> : null}
      {consejos.map(consejo => {
        const textos = textosConsejo(consejo, tarjetas, t as unknown as Traducir);
        const alias = tarjetas.find(x => x.id === consejo.tarjetaId)?.alias ?? '';
        return (
          <Superficie key={`${consejo.tipo}:${consejo.tarjetaId}`} radio={tema.radio.destacada} style={{ padding: 20, gap: tema.espacio.m }}>
            <Texto variante="subtitulo" accessibilityRole="header">
              {textos.titulo}
            </Texto>
            <Texto>{textos.problema}</Texto>
            <View style={{ gap: tema.espacio.xs }}>
              <Texto variante="cuerpoFuerte">{t('consejos.quePedir')}</Texto>
              <Texto>{textos.solucion}</Texto>
            </View>
            <View style={{ gap: tema.espacio.xs }}>
              <Texto variante="cuerpoFuerte">{textos.siNoPuedeTitulo}</Texto>
              <Texto color="textoSecundario">{textos.siNoPuede}</Texto>
            </View>
            <Texto variante="cuerpoFuerte" style={{ paddingTop: tema.espacio.s }}>
              {t('consejos.pasosTitulo')}
            </Texto>
            {textos.pasos.map((paso, i) => (
              <View key={paso} style={{ flexDirection: 'row', gap: tema.espacio.m }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: tema.color.neutroFondo, alignItems: 'center', justifyContent: 'center' }}>
                  <Texto variante="etiqueta" color="primario">
                    {i + 1}
                  </Texto>
                </View>
                <Texto style={{ flex: 1 }}>{paso}</Texto>
              </View>
            ))}
            <Boton
              titulo={t('consejos.actualizar', { alias })}
              icono="editar"
              onPress={() => router.push({ pathname: '/tarjeta/editar/[id]', params: { id: consejo.tarjetaId, seccion: 'fechas' } })}
            />
            <View style={{ gap: tema.espacio.xs }}>
              <Boton titulo={t('consejos.ocultar')} variante="texto" onPress={() => ocultar(consejo)} />
              <Texto variante="apoyo" color="textoSecundario" style={{ textAlign: 'center' }}>
                {t('consejos.ocultarDetalle')}
              </Texto>
            </View>
          </Superficie>
        );
      })}
      {consejos[0]?.otrasPendientes ? (
        <Texto variante="apoyo" color="textoSecundario">
          {t('consejos.otrasPendientes', { count: consejos[0].otrasPendientes })}
        </Texto>
      ) : null}
    </Pantalla>
  );
}
