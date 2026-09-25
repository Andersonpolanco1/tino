import { useTranslation } from 'react-i18next';
import { Pantalla, Texto } from '@/diseno';

export default function Tarjetas() {
  const { t } = useTranslation();
  return (
    <Pantalla>
      <Texto variante="titulo" accessibilityRole="header">
        {t('tarjetas.titulo')}
      </Texto>
      <Texto color="textoSecundario">{t('tarjetas.vacio')}</Texto>
    </Pantalla>
  );
}
