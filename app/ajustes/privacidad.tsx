import { Linking } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BarraSuperior, FilaLista, ListaAgrupada, Palanca, Pantalla, Texto } from '@/diseno';
import { useAlmacen } from '@/estado';
import { useVolver } from '@/utilidades/useVolver';
import { useHoy } from '@/inicio/useHoy';
import { decidirAnaliticaEnAjustes, estadoAnalitica } from '@/privacidad/consentimiento';
import { DOCUMENTOS } from '@/privacidad/terminos';

// Privacidad (decisión D83): compartir los datos de uso (D56), en pocas palabras, y los documentos
// con el detalle (D91). Tocar el interruptor es una decisión: no se vuelve a preguntar (D88).
export default function Privacidad() {
  const { t } = useTranslation();
  const volver = useVolver();
  const hoy = useHoy();
  const preferencias = useAlmacen(s => s.preferencias);
  const guardarPreferencias = useAlmacen(s => s.guardarPreferencias);

  return (
    <Pantalla arriba={<BarraSuperior izquierda={{ tipo: 'atras', onPress: volver }} titulo={t('ajustes.privacidadTitulo')} />}>
      <Stack.Screen options={{ headerShown: false }} />
      {preferencias ? (
        <ListaAgrupada>
          <FilaLista
            icono="grafica"
            titulo={t('ajustes.analitica')}
            detalle={t('ajustes.analiticaDetalle')}
            derecha={
              <Palanca
                valor={estadoAnalitica(preferencias) === 'activa'}
                etiqueta={t('ajustes.analitica')}
                onCambio={valor => guardarPreferencias(decidirAnaliticaEnAjustes(preferencias, valor, hoy))}
              />
            }
          />
        </ListaAgrupada>
      ) : null}
      <Texto variante="apoyo" color="textoSecundario">
        {t('ajustes.analiticaExplicacion')}
      </Texto>
      {DOCUMENTOS.privacidad || DOCUMENTOS.terminos ? (
        <ListaAgrupada sangria={16}>
          {DOCUMENTOS.privacidad ? <FilaLista titulo={t('ajustes.docPrivacidad')} flecha onPress={() => Linking.openURL(DOCUMENTOS.privacidad)} /> : null}
          {DOCUMENTOS.terminos ? <FilaLista titulo={t('ajustes.docTerminos')} flecha onPress={() => Linking.openURL(DOCUMENTOS.terminos)} /> : null}
        </ListaAgrupada>
      ) : null}
    </Pantalla>
  );
}
