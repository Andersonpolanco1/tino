import { useEffect, useState, type RefObject } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icono, type NombreIcono } from './Icono';
import { Texto } from './Texto';
import { useTema } from './useTema';
import { conOpacidad } from './tema';

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
  // En Android el desenfoque necesita la vista de contenido que pasa por debajo (BlurTargetView).
  objetivoDesenfoque?: RefObject<View | null>;
}

// Barra de pestañas flotante del rediseño: una píldora con sombra y la pestaña activa en jade.
export function BarraPestanas({ pestanas, activa, onElegir, etiqueta, objetivoDesenfoque }: Props) {
  const tema = useTema();
  const margenes = useSafeAreaInsets();
  // El desenfoque se vuelve a montar al cambiar de pestaña, un momento después, cuando el
  // BlurTargetView de esa pestaña ya existe; si no, no encuentra qué desenfocar.
  const [lista, setLista] = useState<number | null>(null);
  useEffect(() => {
    setLista(null);
    const espera = setTimeout(() => setLista(activa), 50);
    return () => clearTimeout(espera);
  }, [activa]);
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
        boxShadow: tema.sombra.flotante,
      }}
    >
      {/* Vidrio esmerilado: lo que pasa por debajo se desenfoca y un velo de la superficie da el
          color, para que no compita con las pestañas. */}
      <View style={[StyleSheet.absoluteFill, { borderRadius: 33, overflow: 'hidden' }]} pointerEvents="none">
        {lista === activa ? (
          <BlurView
            key={activa}
            style={StyleSheet.absoluteFill}
            intensity={tema.desenfoque.barraPestanas}
            tint={tema.modo === 'oscuro' ? 'dark' : 'light'}
            blurMethod="dimezisBlurViewSdk31Plus"
            blurTarget={objetivoDesenfoque}
          />
        ) : null}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: conOpacidad(tema.color.superficie, tema.opacidad.barraPestanas) }]} />
      </View>
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
