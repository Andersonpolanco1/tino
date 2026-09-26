import Tabs from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';
import { BarraPestanas, type NombreIcono } from '@/diseno';

const ICONOS: Record<string, NombreIcono> = { inicio: 'inicio', tarjetas: 'tarjetas', ajustes: 'ajustes' };

// Barra de pestañas flotante del rediseño en lugar de la barra del sistema.
export default function LayoutPestanas() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => (
        <BarraPestanas
          etiqueta={t('pestanas.etiqueta')}
          activa={state.index}
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
