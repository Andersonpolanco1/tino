import { Pressable, View } from 'react-native';
import { Texto } from './Texto';
import { useTema } from './useTema';

interface Opcion<T extends string> {
  valor: T;
  etiqueta: string;
}

interface Props<T extends string> {
  etiqueta?: string;
  opciones: Opcion<T>[];
  valor: T | null;
  onCambio: (valor: T) => void;
  error?: string;
}

// Elección única en chips de un toque (como la BarraOrden de la sección 8.3 técnica).
export function Opciones<T extends string>({ etiqueta, opciones, valor, onCambio, error }: Props<T>) {
  const tema = useTema();
  return (
    <View style={{ gap: tema.espacio.xs }} accessibilityRole="radiogroup" accessibilityLabel={etiqueta}>
      {etiqueta ? (
        <Texto variante="apoyo" color="textoSecundario">
          {etiqueta}
        </Texto>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tema.espacio.s }}>
        {opciones.map(o => {
          const activa = o.valor === valor;
          return (
            <Pressable
              key={o.valor}
              accessibilityRole="radio"
              accessibilityState={{ selected: activa }}
              onPress={() => onCambio(o.valor)}
              style={{
                minHeight: tema.toqueMinimo,
                justifyContent: 'center',
                paddingHorizontal: tema.espacio.l,
                borderRadius: tema.radio.chip,
                backgroundColor: activa ? tema.color.primario : tema.color.neutroFondo,
              }}
            >
              <Texto variante="cuerpoFuerte" color={activa ? 'sobrePrimario' : 'texto'}>
                {o.etiqueta}
              </Texto>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <Texto variante="apoyo" color="alertaTexto" accessibilityLiveRegion="polite">
          {error}
        </Texto>
      ) : null}
    </View>
  );
}
