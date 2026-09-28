import { Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BarraSuperior, FilaLista, ListaAgrupada, Palanca, Pantalla, Texto } from '@/diseno';
import { useAlmacen } from '@/estado';
import { reiniciarIdentificadorAnalitica } from '@/analitica';
import { useVolver } from '@/utilidades/useVolver';

// Privacidad (decisión D83): el interruptor de datos de uso anónimos (D56) y el identificador.
export default function Privacidad() {
  const { t } = useTranslation();
  const volver = useVolver();
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
        <ListaAgrupada>
          <FilaLista
            icono="grafica"
            titulo={t('ajustes.analitica')}
            detalle={t('ajustes.analiticaDetalle')}
            derecha={<Palanca valor={preferencias.analiticaActiva} etiqueta={t('ajustes.analitica')} onCambio={valor => guardarPreferencias({ ...preferencias, analiticaActiva: valor })} />}
          />
          <FilaLista icono="reiniciar" titulo={t('ajustes.reiniciarId')} onPress={reiniciarIdentificador} />
        </ListaAgrupada>
      ) : null}
      <Texto variante="apoyo" color="textoSecundario">
        {t('ajustes.privacidadInfo')}
      </Texto>
    </Pantalla>
  );
}
