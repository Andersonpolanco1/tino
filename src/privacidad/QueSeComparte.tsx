import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Hoja, Icono, Texto, useTema } from '../diseno';

// Decisión D88: la información completa de los datos de uso, a un toque desde cada pregunta y
// siempre a la vista en Ajustes, Privacidad (consentimiento informado, Ley 172-13, art. 5.3).
const SE_ENVIA = ['funciones', 'catalogo', 'version', 'fallos'] as const;
const NUNCA = ['montos', 'numeros', 'nombres', 'persona'] as const;

export function QueSeComparte() {
  const { t } = useTranslation();
  const tema = useTema();
  const lista = (titulo: string, claves: readonly string[], grupo: 'envia' | 'nunca') => (
    <View style={{ gap: tema.espacio.s }}>
      <Texto variante="cuerpoFuerte" accessibilityRole="header">
        {titulo}
      </Texto>
      {claves.map(clave => (
        <View key={clave} style={{ flexDirection: 'row', gap: tema.espacio.s, alignItems: 'flex-start' }}>
          <Icono nombre={grupo === 'envia' ? 'check' : 'cerrar'} color={grupo === 'envia' ? 'primario' : 'alertaTexto'} tamano={18} />
          <Texto variante="apoyo" style={{ flex: 1 }}>
            {t(`datosDeUso.${grupo}.${clave}`)}
          </Texto>
        </View>
      ))}
    </View>
  );
  return (
    <View style={{ gap: tema.espacio.l }}>
      {lista(t('datosDeUso.seEnvia'), SE_ENVIA, 'envia')}
      {lista(t('datosDeUso.nuncaSeEnvia'), NUNCA, 'nunca')}
      <Texto variante="apoyo" color="textoSecundario">
        {t('datosDeUso.donde')}
      </Texto>
    </View>
  );
}

export function HojaQueSeComparte({ visible, onCerrar }: { visible: boolean; onCerrar: () => void }) {
  const { t } = useTranslation();
  return (
    <Hoja visible={visible} titulo={t('datosDeUso.hojaTitulo')} onCerrar={onCerrar} cerrarEtiqueta={t('comun.cerrar')}>
      <QueSeComparte />
    </Hoja>
  );
}
