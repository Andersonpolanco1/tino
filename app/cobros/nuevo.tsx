import { Stack, useRouter } from 'expo-router';
import { FormularioIngreso } from '@/ingresos/FormularioIngreso';

export default function NuevoCobro() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <FormularioIngreso onCerrar={() => router.back()} onListo={() => router.back()} />
    </>
  );
}
