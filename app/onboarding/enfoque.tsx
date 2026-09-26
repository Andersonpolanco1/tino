import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { ModoEnfoque } from '@/tipos/tipos';
import { BarraSuperior, FilaLista, ListaAgrupada, Pantalla, Texto } from '@/diseno';
import { useAlmacen } from '@/estado';
import { MODOS_ENFOQUE } from '@/inicio/SelectorEnfoque';

// Onboarding, paso 3: pregunta de enfoque en un toque.
export default function EnfoqueOnboarding() {
  const { t } = useTranslation();
  const router = useRouter();
  const preferencias = useAlmacen(s => s.preferencias);
  const guardarPreferencias = useAlmacen(s => s.guardarPreferencias);

  async function elegir(modo: ModoEnfoque) {
    if (preferencias) await guardarPreferencias({ ...preferencias, enfoque: { modo } });
    router.push('/onboarding/cobros');
  }

  return (
    <Pantalla arriba={<BarraSuperior izquierda={{ tipo: 'atras', onPress: () => router.back() }} />}>
      <Texto variante="titulo" accessibilityRole="header">
        {t('onboarding.enfoqueTitulo')}
      </Texto>
      <Texto color="textoSecundario">{t('onboarding.enfoqueTexto')}</Texto>
      <ListaAgrupada sangria={16}>
        {MODOS_ENFOQUE.map(modo => (
          <FilaLista key={modo} titulo={t(`enfoque.${modo}`)} detalle={t(`enfoqueDescripcion.${modo}`)} flecha onPress={() => elegir(modo)} />
        ))}
      </ListaAgrupada>
    </Pantalla>
  );
}
