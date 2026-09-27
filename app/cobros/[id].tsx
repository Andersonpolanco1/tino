import { Stack, useLocalSearchParams } from 'expo-router';
import { useAlmacen } from '@/estado';
import { FormularioIngreso } from '@/ingresos/FormularioIngreso';
import { useVolver } from '@/utilidades/useVolver';

export default function EditarCobro() {
  const volver = useVolver();
  const { id } = useLocalSearchParams<{ id: string }>();
  const ingreso = useAlmacen(s => s.ingresos.find(i => i.id === id));
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {ingreso ? <FormularioIngreso ingreso={ingreso} onCerrar={volver} onListo={volver} onBorrado={volver} /> : null}
    </>
  );
}
