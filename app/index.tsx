import { Redirect } from 'expo-router';
import { useAlmacen } from '@/estado';

// Sin tarjetas registradas, la app empieza por el onboarding.
export default function Entrada() {
  const hayTarjetas = useAlmacen(s => s.tarjetas.length > 0);
  return <Redirect href={hayTarjetas ? '/inicio' : '/onboarding'} />;
}
