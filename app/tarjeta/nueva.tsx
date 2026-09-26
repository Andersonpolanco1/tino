import { Stack, useRouter } from 'expo-router';
import { FormularioTarjeta } from '@/registro/FormularioTarjeta';

export default function NuevaTarjeta() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <FormularioTarjeta
        onCerrar={() => router.back()}
        onListo={(_tarjeta, preguntarPagoUsd) => (preguntarPagoUsd ? router.replace('/tarjeta/pago-usd') : router.back())}
      />
    </>
  );
}
