import { Switch, View } from 'react-native';
import { Texto } from './Texto';
import { useTema } from './useTema';

interface Props {
  etiqueta: string;
  ayuda?: string;
  valor: boolean;
  onCambio: (valor: boolean) => void;
}

export function Interruptor({ etiqueta, ayuda, valor, onCambio }: Props) {
  const tema = useTema();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: tema.espacio.m, minHeight: tema.toqueMinimo }}>
      <View style={{ flex: 1, gap: tema.espacio.xs }}>
        <Texto variante="cuerpo">{etiqueta}</Texto>
        {ayuda ? (
          <Texto variante="apoyo" color="textoSecundario">
            {ayuda}
          </Texto>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={etiqueta}
        value={valor}
        onValueChange={onCambio}
        trackColor={{ false: tema.color.borde, true: tema.color.primario }}
        thumbColor={tema.color.superficie}
      />
    </View>
  );
}
