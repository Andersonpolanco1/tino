import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTranslation } from 'react-i18next';
import { Boton, Texto, useTema } from '../diseno';
import { debeBloquear } from './bloqueo';

type Estado = 'bloqueado' | 'libre';

// Bloqueo con la biometría o el PIN del propio teléfono (decisión D17) y cobertura de la
// pantalla en segundo plano, para que los datos no aparezcan en el selector de apps.
export function ProveedorBloqueo({ children, ahora = Date.now }: { children: ReactNode; ahora?: () => number }) {
  const { t } = useTranslation();
  const [estado, setEstado] = useState<Estado>('bloqueado');
  const [cubierta, setCubierta] = useState(false);
  const ultimaSalida = useRef<number | null>(null);
  const autenticando = useRef(false);

  const desbloquear = useCallback(async () => {
    if (autenticando.current) return;
    autenticando.current = true;
    try {
      // Sin ningún bloqueo configurado en el teléfono, Tino no puede exigirlo.
      const nivel = await LocalAuthentication.getEnrolledLevelAsync();
      if (nivel === LocalAuthentication.SecurityLevel.NONE) {
        setEstado('libre');
        return;
      }
      const resultado = await LocalAuthentication.authenticateAsync({ promptMessage: t('bloqueo.motivo'), disableDeviceFallback: false });
      if (resultado.success) setEstado('libre');
    } finally {
      autenticando.current = false;
    }
  }, [t]);

  useEffect(() => {
    desbloquear();
  }, [desbloquear]);

  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', siguiente => {
      if (siguiente === 'active') {
        setCubierta(false);
        if (ultimaSalida.current !== null && debeBloquear(ultimaSalida.current, ahora())) {
          setEstado('bloqueado');
          desbloquear();
        }
        ultimaSalida.current = null;
      } else if (!autenticando.current) {
        // El diálogo de biometría también saca la app de "active"; eso no cuenta como salir.
        setCubierta(true);
        ultimaSalida.current ??= ahora();
      }
    });
    return () => suscripcion.remove();
  }, [ahora, desbloquear]);

  return (
    <View style={estilos.llenar}>
      {children}
      {estado === 'bloqueado' || cubierta ? <Cubierta bloqueada={estado === 'bloqueado'} onDesbloquear={desbloquear} /> : null}
    </View>
  );
}

function Cubierta({ bloqueada, onDesbloquear }: { bloqueada: boolean; onDesbloquear: () => void }) {
  const tema = useTema();
  const { t } = useTranslation();
  return (
    <View
      testID="cubierta-privacidad"
      accessibilityViewIsModal
      style={[StyleSheet.absoluteFill, estilos.centro, { backgroundColor: tema.color.fondo, padding: tema.espacio.xxl, gap: tema.espacio.l }]}
    >
      {bloqueada ? (
        <>
          <Texto variante="titulo" accessibilityRole="header">
            {t('bloqueo.titulo')}
          </Texto>
          <Boton titulo={t('bloqueo.desbloquear')} onPress={onDesbloquear} />
        </>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  llenar: { flex: 1 },
  centro: { alignItems: 'center', justifyContent: 'center' },
});
