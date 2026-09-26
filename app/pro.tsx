import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MuroPago, type MotivoMuro } from '@/suscripciones';

// Tino Pro desde Ajustes o desde "Elige tus 2 tarjetas".
export default function Pro() {
  const router = useRouter();
  const { motivo } = useLocalSearchParams<{ motivo?: MotivoMuro }>();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <MuroPago motivo={motivo ?? 'voluntario'} onCerrar={() => router.back()} onPro={() => router.back()} />
    </>
  );
}
