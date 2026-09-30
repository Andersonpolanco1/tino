import { Alert, Platform, Share } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BarraSuperior, FilaLista, ListaAgrupada, Palanca, Pantalla, Texto } from '@/diseno';
import { usePais } from '@/paises';
import { useAlmacen } from '@/estado';
import { borrarBase, useEstadoDatos, useReabrirDatos } from '@/datos';
import { resumenDeDatos } from '@/respaldo/resumen';
import { contenidoDe } from '@/respaldo/contenido';
import { borrarRespaldoAutomatico, useEstadoRespaldoAutomatico } from '@/respaldo/automatico';
import { leerIdentificador } from '@/analitica/identificador';
import { reiniciarIdentificadorAnalitica } from '@/analitica';
import { useCatalogo } from '@/catalogo';
import { hoyLocal } from '@/utilidades/fecha';
import { useVolver } from '@/utilidades/useVolver';
import { detalleRespaldoAutomatico } from '@/respaldo/detalle';

// Tus datos (decisión D83): respaldos (D62 y D81), "Ver mis datos" y "Borrar todo".
export default function Datos() {
  const { t } = useTranslation();
  const router = useRouter();
  const volver = useVolver();
  const { config, idioma } = usePais();
  const tarjetas = useAlmacen(s => s.tarjetas);
  const ingresos = useAlmacen(s => s.ingresos);
  const preferencias = useAlmacen(s => s.preferencias);
  const sugerencias = useAlmacen(s => s.sugerencias);
  const guardarPreferencias = useAlmacen(s => s.guardarPreferencias);
  const catalogo = useCatalogo();
  const datos = useEstadoDatos();
  const reabrir = useReabrirDatos();
  const respaldo = useEstadoRespaldoAutomatico();

  // "Ver mis datos" (D62): todo lo que Tino guarda, en palabras; no va cifrado, por eso se avisa.
  function verMisDatos() {
    Alert.alert(t('ajustes.misDatosTitulo'), t('ajustes.misDatosAviso'), [
      { text: t('ajustes.cancelar'), style: 'cancel' },
      {
        text: t('ajustes.misDatosConfirmar'),
        onPress: async () => {
          try {
            const texto = resumenDeDatos(contenidoDe({ preferencias, tarjetas, ingresos, sugerencias }, new Date()), {
              t: t as never,
              idioma,
              monedaPrincipal: config.monedaPrincipal,
              monedaSecundaria: config.monedaSecundaria,
              catalogo,
              identificadorAnalitica: await leerIdentificador().catch(() => null),
              hoy: hoyLocal(),
            });
            await Share.share({ message: texto, title: t('misDatos.titulo') });
          } catch {
            Alert.alert(t('ajustes.errorMisDatos'));
          }
        },
      },
    ]);
  }

  function borrarTodo() {
    if (datos.estado !== 'lista') return;
    Alert.alert(t('ajustes.borrarTitulo'), t('ajustes.borrarAviso'), [
      { text: t('ajustes.cancelar'), style: 'cancel' },
      {
        text: t('ajustes.borrarConfirmar'),
        style: 'destructive',
        onPress: async () => {
          await borrarBase(datos.base);
          await borrarRespaldoAutomatico();
          await reiniciarIdentificadorAnalitica().catch(() => {});
          // Primero a la bienvenida y después la base nueva: al reabrir, el enrutador conserva la
          // pantalla en la que estaba, y sin esto se quedaba en Tus datos con todo borrado.
          if (router.canDismiss()) router.dismissAll();
          router.replace('/onboarding');
          reabrir();
        },
      },
    ]);
  }

  // Decisión D81: respaldo automático, solo con Pro. Al encenderlo, avisa que depende del
  // respaldo del teléfono (Tino no puede saber si está encendido o tiene espacio); al apagarlo,
  // borra la copia de este teléfono.
  function cambiarRespaldoAutomatico(valor: boolean) {
    if (!preferencias) return;
    if (valor) {
      guardarPreferencias({ ...preferencias, respaldoAutomatico: true }).catch(() => {});
      Alert.alert(t('ajustes.respaldoActivadoTitulo'), t(Platform.OS === 'ios' ? 'ajustes.respaldoActivadoIos' : 'ajustes.respaldoActivadoAndroid'), [
        { text: t('ajustes.respaldoVerComo'), onPress: () => router.push('/ajustes/respaldo') },
        { text: t('ajustes.entendido') },
      ]);
      return;
    }
    Alert.alert(t('ajustes.respaldoApagarTitulo'), t('ajustes.respaldoApagarTexto'), [
      { text: t('ajustes.cancelar'), style: 'cancel' },
      {
        text: t('ajustes.respaldoApagar'),
        style: 'destructive',
        onPress: async () => {
          const { respaldoAutomatico: _activo, ...resto } = preferencias;
          await guardarPreferencias(resto);
          await borrarRespaldoAutomatico();
        },
      },
    ]);
  }

  return (
    <Pantalla arriba={<BarraSuperior izquierda={{ tipo: 'atras', onPress: volver }} titulo={t('ajustes.datosTitulo')} />}>
      <Stack.Screen options={{ headerShown: false }} />
      <ListaAgrupada>
        {preferencias?.plan === 'pro' ? (
          <FilaLista
            icono="nube"
            titulo={t('ajustes.respaldoAutomatico')}
            detalle={detalleRespaldoAutomatico(t, idioma, preferencias, respaldo)}
            derecha={<Palanca valor={preferencias.respaldoAutomatico === true} etiqueta={t('ajustes.respaldoAutomatico')} onCambio={cambiarRespaldoAutomatico} />}
          />
        ) : (
          <FilaLista
            icono="nube"
            titulo={t('ajustes.respaldoAutomatico')}
            detalle={t('ajustes.respaldoSoloPro')}
            flecha
            onPress={() => router.push({ pathname: '/pro', params: { motivo: 'funcion_avanzada' } })}
          />
        )}
        {/* D85: cuándo sube la copia el respaldo del teléfono y cómo hacerlo sin Wi-Fi. */}
        <FilaLista icono="reloj" titulo={t('ajustes.respaldoComo')} flecha onPress={() => router.push('/ajustes/respaldo')} />
        <FilaLista icono="descargar" titulo={t('ajustes.crearRespaldo')} detalle={t('ajustes.crearRespaldoDetalle')} flecha onPress={() => router.push('/respaldo/crear')} />
        <FilaLista icono="reiniciar" titulo={t('ajustes.restaurarRespaldo')} flecha onPress={() => router.push('/respaldo/restaurar')} />
        <FilaLista icono="info" titulo={t('ajustes.misDatos')} flecha onPress={verMisDatos} />
        <FilaLista icono="basura" titulo={t('ajustes.borrar')} destructiva onPress={borrarTodo} />
      </ListaAgrupada>
      <Texto variante="apoyo" color="textoSecundario">
        {t('ajustes.datosInfo')}
      </Texto>
    </Pantalla>
  );
}
