import Tabs from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';
import { Icono, useTema, type NombreIcono } from '@/diseno';

// Íconos de la barra según las maquetas: jade la pestaña activa, gris las demás.
const icono = (nombre: NombreIcono) =>
  function IconoPestana({ focused }: { focused: boolean }) {
    return <Icono nombre={nombre} color={focused ? 'navActivo' : 'navInactivo'} />;
  };

export default function LayoutPestanas() {
  const tema = useTema();
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tema.color.navActivo,
        tabBarInactiveTintColor: tema.color.navInactivo,
        tabBarStyle: { backgroundColor: tema.color.superficie, borderTopColor: tema.color.borde },
        tabBarLabelStyle: tema.texto.etiqueta,
        tabBarItemStyle: { minHeight: tema.toqueMinimo },
      }}
    >
      <Tabs.Screen name="inicio" options={{ title: t('pestanas.inicio'), tabBarIcon: icono('inicio') }} />
      <Tabs.Screen name="tarjetas" options={{ title: t('pestanas.tarjetas'), tabBarIcon: icono('tarjetas') }} />
      <Tabs.Screen name="ajustes" options={{ title: t('pestanas.ajustes'), tabBarIcon: icono('ajustes') }} />
    </Tabs>
  );
}
