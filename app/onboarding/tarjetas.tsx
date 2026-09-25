import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Boton, Fila, Pantalla, Texto } from '@/diseno';
import { useAlmacen } from '@/estado';

// Onboarding, paso 2: registrar tarjetas, unos 30 segundos cada una.
export default function TarjetasOnboarding() {
  const { t } = useTranslation();
  const router = useRouter();
  const tarjetas = useAlmacen(s => s.tarjetas);
  return (
    <Pantalla>
      <Texto variante="titulo" accessibilityRole="header">
        {t('onboarding.tarjetasTitulo')}
      </Texto>
      <Texto color="textoSecundario">{t('onboarding.tarjetasTexto')}</Texto>
      {tarjetas.map(tarjeta => (
        <Fila key={tarjeta.id} titulo={tarjeta.alias} />
      ))}
      <Boton
        titulo={tarjetas.length ? t('onboarding.agregarOtra') : t('onboarding.agregarPrimera')}
        variante={tarjetas.length ? 'secundario' : 'primario'}
        onPress={() => router.push('/tarjeta/nueva')}
      />
      {tarjetas.length ? <Boton titulo={t('onboarding.continuar')} onPress={() => router.push('/onboarding/enfoque')} /> : null}
    </Pantalla>
  );
}
