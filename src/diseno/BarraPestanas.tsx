import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icono, type NombreIcono } from './Icono';
import { Texto } from './Texto';
import { useTema } from './useTema';

export interface PestanaVista {
  clave: string;
  titulo: string;
  icono: NombreIcono;
}

interface Props {
  pestanas: PestanaVista[];
  activa: number;
  onElegir: (indice: number) => void;
  etiqueta: string;
}

// Barra de pestañas flotante del rediseño: una píldora con sombra y la pestaña activa en jade.
export function BarraPestanas({ pestanas, activa, onElegir, etiqueta }: Props) {
  const tema = useTema();
  const margenes = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={etiqueta}
      style={{
        position: 'absolute',
        left: tema.espacio.xl,
        right: tema.espacio.xl,
        bottom: Math.max(margenes.bottom, tema.espacio.xl),
        height: 66,
        flexDirection: 'row',
        gap: 6,
        padding: 7,
        borderRadius: 33,
        backgroundColor: tema.color.superficie,
        boxShadow: tema.sombra.flotante,
      }}
    >
      {pestanas.map((p, i) => {
        const elegida = i === activa;
        return (
          <Pressable
            key={p.clave}
            accessibilityRole="tab"
            accessibilityState={{ selected: elegida }}
            accessibilityLabel={p.titulo}
            onPress={() => onElegir(i)}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: tema.espacio.s,
              borderRadius: 26,
              backgroundColor: elegida ? tema.color.primario : 'transparent',
            }}
          >
            <Icono nombre={p.icono} color={elegida ? 'sobrePrimario' : 'textoSecundario'} tamano={20} />
            <Texto variante={elegida ? 'cuerpoFuerte' : 'apoyo'} color={elegida ? 'sobrePrimario' : 'textoSecundario'} numberOfLines={1} style={{ fontSize: 14 }}>
              {p.titulo}
            </Texto>
          </Pressable>
        );
      })}
    </View>
  );
}
