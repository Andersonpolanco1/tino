import { useState } from 'react';
import { Linking, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BarraSuperior, Boton, Pantalla, Texto, useTema } from '@/diseno';
import { useAlmacen } from '@/estado';
import { useHoy } from '@/inicio/useHoy';
import { responderAnalitica } from '@/privacidad/consentimiento';
import { HojaQueSeComparte } from '@/privacidad/QueSeComparte';
import { DOCUMENTOS } from '@/privacidad/terminos';

// Onboarding, último paso (decisión D88): el primer intento de pedir los datos de uso, cuando el
// usuario ya vio lo que Tino hace. Breve, con el detalle a un toque. Los eventos del onboarding
// esperan en memoria esta respuesta.
export default function DatosDeUsoOnboarding() {
  const { t } = useTranslation();
  const tema = useTema();
  const router = useRouter();
  const hoy = useHoy();
  const preferencias = useAlmacen(s => s.preferencias);
  const guardarPreferencias = useAlmacen(s => s.guardarPreferencias);
  const [detalle, setDetalle] = useState(false);

  async function responder(si: boolean) {
    if (preferencias) await guardarPreferencias(responderAnalitica(preferencias, si, hoy));
    router.replace('/inicio');
  }

  return (
    <Pantalla
      arriba={<BarraSuperior izquierda={{ tipo: 'atras', onPress: () => router.back() }} />}
      pie={
        <>
          <Boton titulo={t('datosDeUso.si')} onPress={() => responder(true)} />
          <Boton titulo={t('datosDeUso.no')} variante="texto" onPress={() => responder(false)} />
        </>
      }
    >
      <Texto variante="titulo" accessibilityRole="header">
        {t('datosDeUso.titulo')}
      </Texto>
      <Texto color="textoSecundario">{t('datosDeUso.texto')}</Texto>
      <Texto variante="apoyo" color="textoSecundario">
        {t('datosDeUso.cambiar')}
      </Texto>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: tema.espacio.l }}>
        <Boton titulo={t('datosDeUso.verQue')} variante="texto" onPress={() => setDetalle(true)} />
        {DOCUMENTOS.privacidad ? <Boton titulo={t('datosDeUso.politica')} variante="texto" onPress={() => Linking.openURL(DOCUMENTOS.privacidad)} /> : null}
      </View>
      <HojaQueSeComparte visible={detalle} onCerrar={() => setDetalle(false)} />
    </Pantalla>
  );
}
