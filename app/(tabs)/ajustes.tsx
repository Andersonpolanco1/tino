import { useTranslation } from 'react-i18next';
import { Pantalla, Texto } from '@/diseno';
import { usePais } from '@/paises';

export default function Ajustes() {
  const { t } = useTranslation();
  const { config } = usePais();
  const nombrePais = t(`paises.${config.codigo}`, { defaultValue: t('paises.otro', { codigo: config.codigo }) });
  const monedas = [config.monedaPrincipal, config.monedaSecundaria].filter(Boolean).join(' · ');

  return (
    <Pantalla>
      <Texto variante="titulo" accessibilityRole="header">
        {t('ajustes.titulo')}
      </Texto>
      <Texto variante="apoyo" color="textoSecundario">
        {t('ajustes.pais')}
      </Texto>
      <Texto variante="cuerpoFuerte">{nombrePais}</Texto>
      <Texto variante="apoyo" color="textoSecundario">
        {t('ajustes.moneda')}
      </Texto>
      <Texto variante="cuerpoFuerte">{monedas}</Texto>
    </Pantalla>
  );
}
