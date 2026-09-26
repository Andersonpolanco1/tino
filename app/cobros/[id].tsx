import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useAlmacen } from '@/estado';
import { FormularioIngreso } from '@/ingresos/FormularioIngreso';

export default function EditarCobro() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const ingreso = useAlmacen(s => s.ingresos.find(i => i.id === id));
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {ingreso ? <FormularioIngreso ingreso={ingreso} onCerrar={() => router.back()} onListo={() => router.back()} onBorrado={() => router.back()} /> : null}
    </>
  );
}
