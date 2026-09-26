import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icono } from './Icono';
import { Texto } from './Texto';
import { Superficie } from './Superficie';
import { useTema } from './useTema';

interface Props {
  etiqueta: string;
  valor: number;
  min: number;
  max: number;
  onCambio: (valor: number) => void;
}

// Número con botones − y + (rediseño), para la fecha límite de pago.
export function Contador({ etiqueta, valor, min, max, onCambio }: Props) {
  const tema = useTema();
  const { t } = useTranslation();
  const boton = (icono: 'menos' | 'mas', siguiente: number, texto: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={texto}
      disabled={siguiente < min || siguiente > max}
      onPress={() => onCambio(siguiente)}
      style={({ pressed }) => ({
        width: tema.toqueMinimo,
        height: tema.toqueMinimo,
        borderRadius: tema.radio.circular,
        backgroundColor: tema.color.neutroFondo,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: siguiente < min || siguiente > max ? 0.4 : pressed ? 0.7 : 1,
      })}
    >
      <Icono nombre={icono} tamano={18} grosor={2.5} />
    </Pressable>
  );
  return (
    <Superficie radio={20} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingLeft: 18, paddingRight: tema.espacio.m }}>
      <Texto color="textoSecundario" style={{ flexShrink: 1 }}>
        {etiqueta}
      </Texto>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        {boton('menos', valor - 1, t('comun.menos', { etiqueta }))}
        <Texto variante="cifra" accessibilityLiveRegion="polite" style={{ minWidth: 36, textAlign: 'center', fontSize: 28 }}>
          {valor}
        </Texto>
        {boton('mas', valor + 1, t('comun.mas', { etiqueta }))}
      </View>
    </Superficie>
  );
}
