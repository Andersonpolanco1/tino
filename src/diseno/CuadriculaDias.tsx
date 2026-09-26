import { Pressable, View } from 'react-native';
import { Texto } from './Texto';
import { Superficie } from './Superficie';
import { useTema } from './useTema';

const DIAS = Array.from({ length: 31 }, (_, i) => i + 1);

// Días del mes para tocar, en 7 columnas (rediseño), en lugar de escribirlos.
export function CuadriculaDias({ etiqueta, valor, onCambio }: { etiqueta: string; valor: number | null; onCambio: (dia: number) => void }) {
  const tema = useTema();
  return (
    <Superficie style={{ padding: tema.espacio.s }}>
      <View accessibilityRole="radiogroup" accessibilityLabel={etiqueta} style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {DIAS.map(dia => {
          const activo = dia === valor;
          return (
            <View key={dia} style={{ width: `${100 / 7}%`, padding: 2 }}>
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: activo }}
                accessibilityLabel={String(dia)}
                onPress={() => onCambio(dia)}
                style={{
                  height: tema.toqueMinimo,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: activo ? tema.color.primario : 'transparent',
                }}
              >
                <Texto variante={activo ? 'cuerpoFuerte' : 'cuerpo'} color={activo ? 'sobrePrimario' : 'texto'} style={{ fontSize: 15 }}>
                  {dia}
                </Texto>
              </Pressable>
            </View>
          );
        })}
      </View>
    </Superficie>
  );
}
