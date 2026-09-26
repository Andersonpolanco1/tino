import { Pressable, View } from 'react-native';
import { Texto } from './Texto';
import { useTema } from './useTema';

interface Props<T extends string> {
  etiqueta: string;
  opciones: { valor: T; etiqueta: string }[];
  valor: T | null;
  onCambio: (valor: T) => void;
}

// Control segmentado del rediseño: fondo suave y la opción elegida en una pastilla con sombra.
export function ControlSegmentado<T extends string>({ etiqueta, opciones, valor, onCambio }: Props<T>) {
  const tema = useTema();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={etiqueta}
      style={{ flexDirection: 'row', gap: 2, padding: tema.espacio.xs, borderRadius: tema.radio.segmento, backgroundColor: tema.color.segmentoFondo }}
    >
      {opciones.map(o => {
        const activa = o.valor === valor;
        return (
          <Pressable
            key={o.valor}
            accessibilityRole="radio"
            accessibilityState={{ selected: activa }}
            onPress={() => onCambio(o.valor)}
            style={{
              flex: 1,
              minHeight: 40,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: tema.espacio.xs,
              borderRadius: tema.radio.opcion,
              backgroundColor: activa ? tema.color.segmentoActivo : 'transparent',
              boxShadow: activa ? tema.sombra.segmento : undefined,
            }}
          >
            <Texto variante={activa ? 'cuerpoFuerte' : 'apoyo'} color={activa ? 'texto' : 'textoSecundario'} numberOfLines={1} style={{ fontSize: 14 }}>
              {o.etiqueta}
            </Texto>
          </Pressable>
        );
      })}
    </View>
  );
}
