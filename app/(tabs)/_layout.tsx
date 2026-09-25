import Tabs from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';
import { useTema } from '@/diseno';

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
        // Los iconos de la barra llegan con las maquetas en la etapa 4.
        tabBarIconStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="inicio" options={{ title: t('pestanas.inicio') }} />
      <Tabs.Screen name="tarjetas" options={{ title: t('pestanas.tarjetas') }} />
      <Tabs.Screen name="ajustes" options={{ title: t('pestanas.ajustes') }} />
    </Tabs>
  );
}
