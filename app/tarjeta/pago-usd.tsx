import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { PagoBalanceUsd } from '@/tipos/tipos';
import { Boton, Pantalla, Texto } from '@/diseno';
import { useAlmacen } from '@/estado';

// Sección 4.3: se pregunta una sola vez, al registrar la primera tarjeta con dólares.
export default function PagoUsd() {
  const { t } = useTranslation();
  const router = useRouter();
  const preferencias = useAlmacen(s => s.preferencias);
  const guardarPreferencias = useAlmacen(s => s.guardarPreferencias);

  async function responder(pagoBalanceUsd: PagoBalanceUsd) {
    if (preferencias) await guardarPreferencias({ ...preferencias, pagoBalanceUsd });
    router.back();
  }

  return (
    <Pantalla conEncabezado>
      <Stack.Screen options={{ headerShown: true, title: '' }} />
      <Texto variante="titulo" accessibilityRole="header">
        {t('registro.pagoBalanceUsd')}
      </Texto>
      <Texto color="textoSecundario">{t('registro.pagoBalanceUsdAyuda')}</Texto>
      <Boton titulo={t('registro.conPesos')} variante="secundario" onPress={() => responder('con_pesos')} />
      <Boton titulo={t('registro.conDolares')} variante="secundario" onPress={() => responder('con_dolares')} />
    </Pantalla>
  );
}
