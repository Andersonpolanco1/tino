import { Stack, useLocalSearchParams } from 'expo-router';
import { MuroPago, type MotivoMuro } from '@/suscripciones';
import { useVolver } from '@/utilidades/useVolver';

// Tino Pro desde Ajustes o desde "Elige tus 2 tarjetas".
export default function Pro() {
  const volver = useVolver();
  const { motivo } = useLocalSearchParams<{ motivo?: MotivoMuro }>();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <MuroPago motivo={motivo ?? 'voluntario'} onCerrar={volver} onPro={volver} />
    </>
  );
}
