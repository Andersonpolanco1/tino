import { useTranslation } from 'react-i18next';
import { Pantalla, Texto } from '@/diseno';

export default function Inicio() {
  const { t } = useTranslation();
  return (
    <Pantalla>
      <Texto variante="titulo" accessibilityRole="header">
        {t('inicio.titulo')}
      </Texto>
      <Texto color="textoSecundario">{t('inicio.vacio')}</Texto>
    </Pantalla>
  );
}
