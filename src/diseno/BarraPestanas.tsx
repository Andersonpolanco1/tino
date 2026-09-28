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
  // Un punto junto al ícono cuando hay algo nuevo (decisión D68), con su texto para el lector.
  aviso?: string;
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
  // El desenfoque se monta después del contenido, cuando su BlurTargetView ya existe.
  const [montada, setMontada] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- el segundo render es lo que se busca
  useEffect(() => setMontada(true), []);
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
        {montada ? (
          <BlurView
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
            accessibilityLabel={p.aviso ? `${p.titulo}. ${p.aviso}` : p.titulo}
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
            <View>
              <Icono nombre={p.icono} color={elegida ? 'sobrePrimario' : 'textoSecundario'} tamano={20} />
              {p.aviso ? (
                <View
                  testID={`aviso-${p.clave}`}
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -3,
                    width: 9,
                    height: 9,
                    borderRadius: 5,
                    backgroundColor: tema.color.alertaTexto,
                    borderWidth: 1.5,
                    borderColor: elegida ? tema.color.primario : tema.color.superficie,
                  }}
                />
              ) : null}
            </View>
            <Texto variante={elegida ? 'cuerpoFuerte' : 'apoyo'} color={elegida ? 'sobrePrimario' : 'textoSecundario'} numberOfLines={1} style={{ fontSize: 14 }}>
              {p.titulo}
            </Texto>
          </Pressable>
        );
      })}
    </View>
  );
}
