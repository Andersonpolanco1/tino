import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BarraSuperior, Boton, Pantalla, Superficie, Texto, useTema } from '@/diseno';
import { useTarjetasEnPlan } from '@/suscripciones';
import { textosConsejo, useConsejosNuevos } from '@/consejos';
import type { Traducir } from '@/inicio/vista';
import { useVolver } from '@/utilidades/useVolver';

// Consejos de fechas (decisiones D73 a D75): qué pasa y qué hacer, breve y sin fechas exactas.
// Se abren desde el bombillo de Tarjetas y siguen aquí mientras el problema exista; con varios
// (máximo 2), uno debajo del otro.
export default function ConsejosFechas() {
  const { t } = useTranslation();
  const tema = useTema();
  const router = useRouter();
  const volver = useVolver();
  const tarjetas = useTarjetasEnPlan();
  const { consejos, marcar } = useConsejosNuevos();
  // Decisión D68: al abrir la pantalla, los consejos quedan vistos y se apaga el punto del bombillo.
  const marcarAlAbrir = useRef(marcar);
  marcarAlAbrir.current = marcar;
  useEffect(() => marcarAlAbrir.current(), []);

  return (
    <Pantalla arriba={<BarraSuperior izquierda={{ tipo: 'atras', onPress: volver }} />}>
      <Stack.Screen options={{ headerShown: false }} />
      <Texto variante="titulo" accessibilityRole="header">
        {t('consejos.titulo')}
      </Texto>
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
              <Texto variante="cuerpoFuerte">{t('consejos.queHacer')}</Texto>
              <Texto>{textos.solucion}</Texto>
            </View>
            {textos.mientras ? (
              <View style={{ gap: tema.espacio.xs }}>
                <Texto variante="cuerpoFuerte">{t('consejos.mientrasTanto')}</Texto>
                <Texto>{textos.mientras}</Texto>
              </View>
            ) : null}
            <Texto variante="apoyo" color="textoSecundario">
              {t('consejos.nota')}
            </Texto>
            <Boton
              titulo={t('consejos.actualizar', { alias })}
              icono="editar"
              onPress={() => router.push({ pathname: '/tarjeta/editar/[id]', params: { id: consejo.tarjetaId, seccion: 'fechas' } })}
            />
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
