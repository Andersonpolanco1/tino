import { Stack } from 'expo-router';
import { FormularioIngreso } from '@/ingresos/FormularioIngreso';
import { useVolver } from '@/utilidades/useVolver';

export default function NuevoCobro() {
  const volver = useVolver();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <FormularioIngreso onCerrar={volver} onListo={volver} />
    </>
  );
}
