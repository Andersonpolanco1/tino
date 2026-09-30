import { Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BarraSuperior, FilaLista, ListaAgrupada, Palanca, Pantalla, Superficie, useTema } from '@/diseno';
import { useAlmacen } from '@/estado';
import { reiniciarIdentificadorAnalitica } from '@/analitica';
import { useVolver } from '@/utilidades/useVolver';
import { useHoy } from '@/inicio/useHoy';
import { decidirAnaliticaEnAjustes, estadoAnalitica } from '@/privacidad/consentimiento';
import { QueSeComparte } from '@/privacidad/QueSeComparte';

// Privacidad (decisión D83): el interruptor de datos de uso anónimos (D56) y el identificador.
// Tocar el interruptor es una decisión: no se vuelve a preguntar (D88).
export default function Privacidad() {
  const { t } = useTranslation();
  const volver = useVolver();
  const preferencias = useAlmacen(s => s.preferencias);
  const guardarPreferencias = useAlmacen(s => s.guardarPreferencias);
  const tema = useTema();
  const hoy = useHoy();

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
            derecha={
              <Palanca
                valor={estadoAnalitica(preferencias) === 'activa'}
                etiqueta={t('ajustes.analitica')}
                onCambio={valor => guardarPreferencias(decidirAnaliticaEnAjustes(preferencias, valor, hoy))}
              />
            }
          />
          <FilaLista icono="reiniciar" titulo={t('ajustes.reiniciarId')} onPress={reiniciarIdentificador} />
        </ListaAgrupada>
      ) : null}
      <Superficie radio={tema.radio.lista} style={{ padding: tema.espacio.l }}>
        <QueSeComparte />
      </Superficie>
    </Pantalla>
  );
}
