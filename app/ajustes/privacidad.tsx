import { Alert, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BarraSuperior, FilaLista, ListaAgrupada, Palanca, Pantalla, Superficie, Texto, useTema } from '@/diseno';
import { useAlmacen } from '@/estado';
import { reiniciarIdentificadorAnalitica } from '@/analitica';
import { useVolver } from '@/utilidades/useVolver';
import { useHoy } from '@/inicio/useHoy';
import { decidirAnaliticaEnAjustes, estadoAnalitica } from '@/privacidad/consentimiento';
import { QueSeComparte } from '@/privacidad/QueSeComparte';
import { DOCUMENTOS } from '@/privacidad/terminos';

// Privacidad (decisión D83): compartir los datos de uso (D56), qué incluyen, el identificador y
// los documentos. Tocar el interruptor es una decisión: no se vuelve a preguntar (D88).
export default function Privacidad() {
  const { t } = useTranslation();
  const tema = useTema();
  const volver = useVolver();
  const hoy = useHoy();
  const preferencias = useAlmacen(s => s.preferencias);
  const guardarPreferencias = useAlmacen(s => s.guardarPreferencias);

  function reiniciarIdentificador() {
    Alert.alert(t('ajustes.reiniciarIdTitulo'), t('ajustes.reiniciarIdAviso'), [
      { text: t('ajustes.cancelar'), style: 'cancel' },
      { text: t('ajustes.reiniciarIdConfirmar'), onPress: () => reiniciarIdentificadorAnalitica().catch(() => {}) },
    ]);
  }

  return (
    <Pantalla arriba={<BarraSuperior izquierda={{ tipo: 'atras', onPress: volver }} titulo={t('ajustes.privacidadTitulo')} />}>
      <Stack.Screen options={{ headerShown: false }} />
      {preferencias ? (
        <ListaAgrupada titulo={t('ajustes.seccionDatosUso')}>
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
      <Superficie radio={tema.radio.lista} style={{ padding: tema.espacio.l }}>
        <QueSeComparte />
      </Superficie>
      <ListaAgrupada titulo={t('ajustes.seccionIdentificador')}>
        <FilaLista icono="reiniciar" titulo={t('ajustes.reiniciarId')} detalle={t('ajustes.reiniciarIdDetalle')} onPress={reiniciarIdentificador} />
      </ListaAgrupada>
      <Texto variante="apoyo" color="textoSecundario">
        {t('ajustes.identificadorTexto')}
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
