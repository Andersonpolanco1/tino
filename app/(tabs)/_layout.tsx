import { createRef, useRef, type RefObject } from 'react';
import type { View } from 'react-native';
import Tabs from 'expo-router/js-tabs';
import { BlurTargetView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { BarraPestanas, type NombreIcono } from '@/diseno';

const ICONOS: Record<string, NombreIcono> = { inicio: 'inicio', tarjetas: 'tarjetas', ajustes: 'ajustes' };

// Barra de pestañas flotante del rediseño en lugar de la barra del sistema.
export default function LayoutPestanas() {
  const { t } = useTranslation();
  // Cada pestaña va dentro de su BlurTargetView; la barra desenfoca la que está a la vista.
  const objetivos = useRef<Record<string, RefObject<View | null>>>({});
  const objetivoDe = (clave: string) => (objetivos.current[clave] ??= createRef<View>());
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      screenLayout={({ route, children }) => (
        <BlurTargetView ref={objetivoDe(route.key)} style={{ flex: 1 }}>
          {children}
        </BlurTargetView>
      )}
      tabBar={({ state, navigation }) => (
        <BarraPestanas
          etiqueta={t('pestanas.etiqueta')}
          activa={state.index}
          objetivoDesenfoque={objetivoDe(state.routes[state.index].key)}
          pestanas={state.routes.map(r => ({ clave: r.key, titulo: t(`pestanas.${r.name}`), icono: ICONOS[r.name] ?? 'inicio' }))}
          onElegir={i => {
            const ruta = state.routes[i];
            const evento = navigation.emit({ type: 'tabPress', target: ruta.key, canPreventDefault: true });
            if (state.index !== i && !evento.defaultPrevented) navigation.navigate(ruta.name);
          }}
        />
      )}
    >
      <Tabs.Screen name="inicio" />
      <Tabs.Screen name="tarjetas" />
      <Tabs.Screen name="ajustes" />
    </Tabs>
  );
}
