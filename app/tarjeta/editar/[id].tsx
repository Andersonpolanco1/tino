import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pantalla } from '@/diseno';
import { useAlmacen } from '@/estado';
import { FormularioTarjeta } from '@/registro/FormularioTarjeta';

export default function EditarTarjeta() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tarjeta = useAlmacen(s => s.tarjetas.find(x => x.id === id));
  return (
    <Pantalla conEncabezado>
      <Stack.Screen options={{ headerShown: true, title: t('registro.tituloEditar') }} />
      {tarjeta ? (
        <FormularioTarjeta
          tarjeta={tarjeta}
          onListo={(_tarjeta, preguntarPagoUsd) => (preguntarPagoUsd ? router.replace('/tarjeta/pago-usd') : router.back())}
          onBorrada={() => router.back()}
        />
      ) : null}
    </Pantalla>
  );
}
