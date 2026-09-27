import { useRef } from 'react';
import { View } from 'react-native';
import Tabs from 'expo-router/js-tabs';
import { usePathname, useRouter } from 'expo-router';
import { BlurTargetView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { BarraPestanas, type NombreIcono } from '@/diseno';
import { useConsejosNuevos } from '@/consejos';

const PESTANAS: { nombre: 'inicio' | 'tarjetas' | 'ajustes'; icono: NombreIcono }[] = [
  { nombre: 'inicio', icono: 'inicio' },
  { nombre: 'tarjetas', icono: 'tarjetas' },
  { nombre: 'ajustes', icono: 'ajustes' },
];

// Barra de pestañas flotante del rediseño en lugar de la barra del sistema. Las pestañas van
// dentro de un BlurTargetView y la barra fuera, encima: así en Android la barra puede desenfocar
// el contenido que pasa por debajo sin desenfocarse a sí misma.
export default function LayoutPestanas() {
  const { t } = useTranslation();
  const router = useRouter();
  const ruta = usePathname();
  const objetivo = useRef<View>(null);
  const activa = Math.max(0, PESTANAS.findIndex(p => ruta.startsWith(`/${p.nombre}`)));
  // Decisión D68: un punto en Tarjetas mientras haya consejos de fechas sin ver.
  const hayConsejosNuevos = useConsejosNuevos().nuevos.length > 0;
  return (
    <View style={{ flex: 1 }}>
      <BlurTargetView ref={objetivo} style={{ flex: 1 }}>
        <Tabs screenOptions={{ headerShown: false }} tabBar={() => null}>
          {PESTANAS.map(p => (
            <Tabs.Screen key={p.nombre} name={p.nombre} />
          ))}
        </Tabs>
      </BlurTargetView>
      <BarraPestanas
        etiqueta={t('pestanas.etiqueta')}
        activa={activa}
        objetivoDesenfoque={objetivo}
        pestanas={PESTANAS.map(p => ({
          clave: p.nombre,
          titulo: t(`pestanas.${p.nombre}`),
          icono: p.icono,
          aviso: p.nombre === 'tarjetas' && hayConsejosNuevos ? t('pestanas.consejosNuevos') : undefined,
        }))}
        onElegir={i => i !== activa && router.navigate(`/${PESTANAS[i].nombre}`)}
      />
    </View>
  );
}
