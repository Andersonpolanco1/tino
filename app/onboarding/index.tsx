import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Boton, Pantalla, Texto } from '@/diseno';

// Onboarding, paso 1: bienvenida (sección 13.1 de la especificación).
export default function Bienvenida() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <Pantalla>
      <Texto variante="titulo" accessibilityRole="header">
        {t('onboarding.bienvenidaTitulo')}
      </Texto>
      <Texto>{t('onboarding.bienvenidaTexto')}</Texto>
      <Texto variante="apoyo" color="textoSecundario">
        {t('onboarding.privacidad')}
      </Texto>
      <Boton titulo={t('onboarding.empezar')} onPress={() => router.push('/onboarding/tarjetas')} />
    </Pantalla>
  );
}
