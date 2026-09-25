import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pantalla } from '@/diseno';
import { FormularioTarjeta } from '@/registro/FormularioTarjeta';

export default function NuevaTarjeta() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <Pantalla conEncabezado>
      <Stack.Screen options={{ headerShown: true, title: t('registro.tituloNueva') }} />
      <FormularioTarjeta
        onListo={(_tarjeta, preguntarPagoUsd) => (preguntarPagoUsd ? router.replace('/tarjeta/pago-usd') : router.back())}
      />
    </Pantalla>
  );
}
