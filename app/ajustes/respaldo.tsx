import { Platform, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BarraSuperior, Boton, Pantalla, Superficie, Texto, useTema } from '@/diseno';
import { useVolver } from '@/utilidades/useVolver';

const SECCIONES = ['cuando', 'datos', 'volver'] as const;

// Cómo funciona el respaldo automático (decisión D85): cuándo sube la copia el respaldo del
// sistema, cómo hacerlo sin Wi-Fi y cómo vuelve. Ninguna app puede subirlo por su cuenta, así
// que para un cambio de teléfono inmediato se ofrece el respaldo manual (D62).
export default function ComoFuncionaRespaldo() {
  const { t } = useTranslation();
  const tema = useTema();
  const router = useRouter();
  const volver = useVolver();
  const sistema = Platform.OS === 'ios' ? 'ios' : 'android';

  return (
    <Pantalla arriba={<BarraSuperior izquierda={{ tipo: 'atras', onPress: volver }} titulo={t('comoRespaldo.titulo')} />}>
      <Stack.Screen options={{ headerShown: false }} />
      <Texto color="textoSecundario">{t('comoRespaldo.intro')}</Texto>
      {SECCIONES.map(seccion => (
        <View key={seccion} style={{ gap: tema.espacio.xs }}>
          <Texto variante="cuerpoFuerte" accessibilityRole="header">
            {t(`comoRespaldo.${seccion}Titulo`)}
          </Texto>
          <Texto color="textoSecundario">{t(`comoRespaldo.${sistema}.${seccion}`)}</Texto>
        </View>
      ))}
      <Superficie style={{ padding: tema.espacio.l, gap: tema.espacio.m }}>
        <Texto variante="cuerpoFuerte" accessibilityRole="header">
          {t('comoRespaldo.ahoraTitulo')}
        </Texto>
        <Texto color="textoSecundario">{t('comoRespaldo.ahora')}</Texto>
        <Boton titulo={t('comoRespaldo.ahoraBoton')} icono="descargar" onPress={() => router.push('/respaldo/crear')} />
      </Superficie>
    </Pantalla>
  );
}
