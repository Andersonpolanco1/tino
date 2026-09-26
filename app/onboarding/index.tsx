import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Boton, Opciones, Pantalla, Texto } from '@/diseno';
import { nombrePais, usePais } from '@/paises';
import { useElegirPais } from '@/estado';

// Onboarding, paso 1: bienvenida (sección 13.1 de la especificación) y confirmación del país.
export default function Bienvenida() {
  const { t } = useTranslation();
  const router = useRouter();
  const { config, opciones } = usePais();
  const elegirPais = useElegirPais();
  return (
    <Pantalla pie={<Boton titulo={t('onboarding.empezar')} onPress={() => router.push('/onboarding/tarjetas')} />}>
      <Texto variante="titulo" accessibilityRole="header" style={{ fontSize: 34, lineHeight: 40, letterSpacing: -0.6 }}>
        {t('onboarding.bienvenidaTitulo')}
      </Texto>
      <Texto>{t('onboarding.bienvenidaTexto')}</Texto>
      {opciones.length > 1 ? (
        <Opciones
          etiqueta={t('onboarding.dondeVives')}
          info={t('onboarding.dondeVivesAyuda')}
          opciones={opciones.map(codigo => ({ valor: codigo, etiqueta: nombrePais(t, codigo) }))}
          valor={config.codigo}
          onCambio={elegirPais}
        />
      ) : null}
      <Texto variante="apoyo" color="textoSecundario">
        {t('onboarding.privacidad')}
      </Texto>
    </Pantalla>
  );
}
