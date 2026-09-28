import { Linking } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BarraSuperior, FilaLista, ListaAgrupada, Palanca, type NombreIcono, Pantalla, Texto } from '@/diseno';
import type { AjustesAvisos } from '@/tipos/tipos';
import { AVISOS_PREDETERMINADOS } from '@/notificaciones/planificar';
import { usePermisoAvisos } from '@/notificaciones/usePermisoAvisos';
import { useAlmacen } from '@/estado';
import { useVolver } from '@/utilidades/useVolver';

// Los avisos del MVP (sección 11), cada uno con su interruptor.
const FILAS_AVISOS: [keyof AjustesAvisos, NombreIcono, string, string][] = [
  ['fechaLimite', 'calendario', 'ajustes.avisoFechaLimite', 'ajustes.avisoFechaLimiteDetalle'],
  ['venceAntesDelCobro', 'reloj', 'ajustes.avisoVenceAntes', 'ajustes.avisoVenceAntesDetalle'],
  ['vencimiento', 'alto', 'ajustes.avisoVencimiento', 'ajustes.avisoVencimientoDetalle'],
  ['antesDelCorte', 'compra', 'ajustes.avisoAntesDelCorte', 'ajustes.avisoAntesDelCorteDetalle'],
  ['cambioTarjeta', 'tarjetas', 'ajustes.avisoCambio', 'ajustes.avisoCambioDetalle'],
  ['resumenMensual', 'moneda', 'ajustes.avisoResumen', 'ajustes.avisoResumenDetalle'],
];

// Avisos (decisión D83): pantalla propia para que la lista pueda crecer sin alargar Ajustes.
export default function Avisos() {
  const { t } = useTranslation();
  const volver = useVolver();
  const preferencias = useAlmacen(s => s.preferencias);
  const guardarPreferencias = useAlmacen(s => s.guardarPreferencias);
  const permiso = usePermisoAvisos();
  const avisos = { ...AVISOS_PREDETERMINADOS, ...preferencias?.avisos };

  return (
    <Pantalla arriba={<BarraSuperior izquierda={{ tipo: 'atras', onPress: volver }} titulo={t('ajustes.avisosTitulo')} />}>
      <Stack.Screen options={{ headerShown: false }} />
      <Texto color="textoSecundario">{t('ajustes.avisosExplicacion')}</Texto>
      {permiso.estado === 'sin_preguntar' ? (
        <ListaAgrupada>
          <FilaLista icono="alto" tono="alerta" titulo={t('ajustes.activarAvisos')} detalle={t('ajustes.activarAvisosDetalle')} flecha onPress={permiso.pedir} />
        </ListaAgrupada>
      ) : permiso.estado === 'negado' ? (
        <ListaAgrupada>
          <FilaLista icono="alto" tono="alerta" titulo={t('ajustes.avisosApagados')} detalle={t('ajustes.avisosApagadosDetalle')} flecha onPress={() => Linking.openSettings()} />
        </ListaAgrupada>
      ) : null}
      {preferencias ? (
        <ListaAgrupada>
          {FILAS_AVISOS.map(([clave, icono, titulo, detalle]) => (
            <FilaLista
              key={clave}
              icono={icono}
              titulo={t(titulo)}
              detalle={t(detalle)}
              derecha={<Palanca valor={avisos[clave]} etiqueta={t(titulo)} onCambio={valor => guardarPreferencias({ ...preferencias, avisos: { ...avisos, [clave]: valor } })} />}
            />
          ))}
        </ListaAgrupada>
      ) : null}
    </Pantalla>
  );
}
