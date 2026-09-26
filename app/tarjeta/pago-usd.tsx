import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BarraSuperior, Opciones, Pantalla, Texto } from '@/diseno';
import { useAlmacen } from '@/estado';

// Sección 4.3: se pregunta una sola vez, al registrar la primera tarjeta con dólares.
export default function PagoUsd() {
  const { t } = useTranslation();
  const router = useRouter();
  const preferencias = useAlmacen(s => s.preferencias);
  const guardarPreferencias = useAlmacen(s => s.guardarPreferencias);

  async function responder(pagoBalanceUsd: 'con_pesos' | 'con_dolares') {
    if (preferencias) await guardarPreferencias({ ...preferencias, pagoBalanceUsd });
    router.back();
  }

  return (
    <Pantalla arriba={<BarraSuperior izquierda={{ tipo: 'cerrar', onPress: () => router.back() }} />}>
      <Stack.Screen options={{ headerShown: false }} />
      <Texto variante="titulo" accessibilityRole="header">
        {t('registro.pagoBalanceUsd')}
      </Texto>
      <Texto color="textoSecundario">{t('registro.pagoBalanceUsdAyuda')}</Texto>
      <Opciones
        valor={preferencias?.pagoBalanceUsd ?? null}
        onCambio={responder}
        opciones={[
          { valor: 'con_pesos', etiqueta: t('registro.conPesos') },
          { valor: 'con_dolares', etiqueta: t('registro.conDolares') },
        ]}
      />
    </Pantalla>
  );
}
