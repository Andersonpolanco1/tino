import { Pressable, View } from 'react-native';
import { Texto } from './Texto';
import { EtiquetaConInfo } from './EtiquetaConInfo';
import { useTema } from './useTema';

interface PropsPalanca {
  valor: boolean;
  onCambio: (valor: boolean) => void;
  etiqueta: string;
}

// Interruptor del rediseño: pista redondeada y perilla, igual en iOS y Android.
export function Palanca({ valor, onCambio, etiqueta }: PropsPalanca) {
  const tema = useTema();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={etiqueta}
      accessibilityState={{ checked: valor }}
      onPress={() => onCambio(!valor)}
      style={{ width: 52, minHeight: tema.toqueMinimo, justifyContent: 'center' }}
    >
      <View
        style={{
          width: 52,
          height: 32,
          borderRadius: 16,
          padding: 3,
          backgroundColor: valor ? tema.color.primario : tema.color.pistaApagada,
          alignItems: valor ? 'flex-end' : 'flex-start',
        }}
      >
        <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: tema.color.perilla, boxShadow: tema.sombra.segmento }} />
      </View>
    </Pressable>
  );
}

interface Props {
  etiqueta: string;
  ayuda?: string;
  info?: string;
  valor: boolean;
  onCambio: (valor: boolean) => void;
}

export function Interruptor({ etiqueta, ayuda, info, valor, onCambio }: Props) {
  const tema = useTema();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: tema.espacio.m, minHeight: tema.toqueMinimo }}>
      <View style={{ flex: 1, gap: tema.espacio.xs }}>
        <EtiquetaConInfo etiqueta={etiqueta} info={info} variante="cuerpoFuerte" />
        {ayuda ? (
          <Texto variante="apoyo" color="textoSecundario">
            {ayuda}
          </Texto>
        ) : null}
      </View>
      <Palanca valor={valor} onCambio={onCambio} etiqueta={etiqueta} />
    </View>
  );
}
