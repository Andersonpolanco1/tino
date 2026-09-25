import { Redirect } from 'expo-router';

// El onboarding (etapa 3) decidirá aquí si el usuario ya registró tarjetas.
export default function Entrada() {
  return <Redirect href="/inicio" />;
}
