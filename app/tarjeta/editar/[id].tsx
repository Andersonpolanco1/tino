import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useAlmacen } from '@/estado';
import { FormularioTarjeta } from '@/registro/FormularioTarjeta';

export default function EditarTarjeta() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tarjeta = useAlmacen(s => s.tarjetas.find(x => x.id === id));
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {tarjeta ? (
        <FormularioTarjeta
          tarjeta={tarjeta}
          onCerrar={() => router.back()}
          // Al editar se guarda por secciones y la pantalla sigue abierta; solo sale para la pregunta de dólares.
          onListo={(_tarjeta, preguntarPagoUsd) => preguntarPagoUsd && router.push('/tarjeta/pago-usd')}
          onBorrada={() => router.dismissTo('/inicio')}
        />
      ) : null}
    </>
  );
}
