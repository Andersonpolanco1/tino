import { useTranslation } from 'react-i18next';
import { Opciones, Pantalla, Texto } from '@/diseno';
import { nombrePais, usePais } from '@/paises';
import { useElegirPais } from '@/estado';

export default function Ajustes() {
  const { t } = useTranslation();
  const { config, opciones } = usePais();
  const elegirPais = useElegirPais();
  const monedas = [config.monedaPrincipal, config.monedaSecundaria].filter(Boolean).join(' · ');

  return (
    <Pantalla>
      <Texto variante="titulo" accessibilityRole="header">
        {t('ajustes.titulo')}
      </Texto>
      <Opciones
        etiqueta={t('ajustes.pais')}
        opciones={opciones.map(codigo => ({ valor: codigo, etiqueta: nombrePais(t, codigo) }))}
        valor={config.codigo}
        onCambio={elegirPais}
      />
      <Texto variante="apoyo" color="textoSecundario">
        {t('ajustes.paisAyuda')}
      </Texto>
      <Texto variante="apoyo" color="textoSecundario">
        {t('ajustes.moneda')}
      </Texto>
      <Texto variante="cuerpoFuerte">{monedas}</Texto>
    </Pantalla>
  );
}
