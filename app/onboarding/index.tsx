import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Boton, Opciones, Pantalla, Texto } from '@/diseno';
import { nombrePais, usePais } from '@/paises';
import { useElegirPais } from '@/estado';

// Onboarding, paso 1: bienvenida (sección 13.1 de la especificación) y confirmación del
// país, porque la región del teléfono no siempre es donde vive el usuario.
export default function Bienvenida() {
  const { t } = useTranslation();
  const router = useRouter();
  const { config, opciones } = usePais();
  const elegirPais = useElegirPais();
  return (
    <Pantalla>
      <Texto variante="titulo" accessibilityRole="header">
        {t('onboarding.bienvenidaTitulo')}
      </Texto>
      <Texto>{t('onboarding.bienvenidaTexto')}</Texto>
      {opciones.length > 1 ? (
        <>
          <Opciones
            etiqueta={t('onboarding.dondeVives')}
            opciones={opciones.map(codigo => ({ valor: codigo, etiqueta: nombrePais(t, codigo) }))}
            valor={config.codigo}
            onCambio={elegirPais}
          />
          <Texto variante="apoyo" color="textoSecundario">
            {t('onboarding.dondeVivesAyuda')}
          </Texto>
        </>
      ) : null}
      <Texto variante="apoyo" color="textoSecundario">
        {t('onboarding.privacidad')}
      </Texto>
      <Boton titulo={t('onboarding.empezar')} onPress={() => router.push('/onboarding/tarjetas')} />
    </Pantalla>
  );
}
