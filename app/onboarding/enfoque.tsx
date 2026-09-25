import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { ModoEnfoque } from '@/tipos/tipos';
import { Fila, Pantalla, Texto } from '@/diseno';
import { useAlmacen } from '@/estado';

// Sección 6.2 de la especificación: los 4 modos del MVP.
const MODOS: ModoEnfoque[] = ['equilibrado', 'liquidez', 'puntos', 'cashback'];

// Onboarding, paso 3: pregunta de enfoque en un toque.
export default function EnfoqueOnboarding() {
  const { t } = useTranslation();
  const router = useRouter();
  const preferencias = useAlmacen(s => s.preferencias);
  const guardarPreferencias = useAlmacen(s => s.guardarPreferencias);

  async function elegir(modo: ModoEnfoque) {
    if (preferencias) await guardarPreferencias({ ...preferencias, enfoque: { modo } });
    router.replace('/inicio');
  }

  return (
    <Pantalla>
      <Texto variante="titulo" accessibilityRole="header">
        {t('onboarding.enfoqueTitulo')}
      </Texto>
      <Texto color="textoSecundario">{t('onboarding.enfoqueTexto')}</Texto>
      {MODOS.map(modo => (
        <Fila key={modo} titulo={t(`enfoque.${modo}`)} detalle={t(`enfoqueDescripcion.${modo}`)} onPress={() => elegir(modo)} />
      ))}
    </Pantalla>
  );
}
