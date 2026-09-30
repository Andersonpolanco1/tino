import { Linking, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Boton, Texto, useTema } from '../diseno';
import { DOCUMENTOS } from './terminos';

// Decisión D88: bajo el botón que continúa, "Al continuar, aceptas…" con los dos documentos a un
// toque (Ley 358-05, art. 83, y Ley 172-13, art. 5.3). Enlaces como botones, para los 44 puntos.
export function LineaAceptacion() {
  const { t } = useTranslation();
  const tema = useTema();
  const enlaces = [
    { url: DOCUMENTOS.terminos, titulo: t('onboarding.terminos') },
    { url: DOCUMENTOS.privacidad, titulo: t('onboarding.politica') },
  ].filter(e => e.url);
  return (
    <View style={{ alignItems: 'center', gap: tema.espacio.xs }}>
      <Texto variante="apoyo" color="textoSecundario" style={{ textAlign: 'center' }}>
        {t('onboarding.aceptas')}
      </Texto>
      {enlaces.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: tema.espacio.m }}>
          {enlaces.map(e => (
            <Boton key={e.url} titulo={e.titulo} variante="texto" onPress={() => Linking.openURL(e.url)} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
