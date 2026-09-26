import { View } from 'react-native';
import { Texto } from './Texto';
import { EtiquetaConInfo } from './EtiquetaConInfo';
import { FilaLista, ListaAgrupada } from './ListaAgrupada';
import { useTema } from './useTema';

interface Opcion<T extends string> {
  valor: T;
  etiqueta: string;
  detalle?: string;
}

interface Props<T extends string> {
  etiqueta?: string;
  info?: string;
  opciones: Opcion<T>[];
  valor: T | null;
  onCambio: (valor: T) => void;
  error?: string;
}

// Elección única como lista agrupada con marca de verificación (rediseño). Para 2 a 4
// opciones cortas se usa ControlSegmentado.
export function Opciones<T extends string>({ etiqueta, info, opciones, valor, onCambio, error }: Props<T>) {
  const tema = useTema();
  return (
    <View style={{ gap: tema.espacio.s }} accessibilityRole="radiogroup" accessibilityLabel={etiqueta}>
      {etiqueta ? <EtiquetaConInfo etiqueta={etiqueta} info={info} /> : null}
      <ListaAgrupada sangria={tema.espacio.l}>
        {opciones.map(o => (
          <FilaLista key={o.valor} titulo={o.etiqueta} detalle={o.detalle} seleccionada={o.valor === valor} onPress={() => onCambio(o.valor)} />
        ))}
      </ListaAgrupada>
      {error ? (
        <Texto variante="apoyo" color="alertaTexto" accessibilityLiveRegion="polite">
          {error}
        </Texto>
      ) : null}
    </View>
  );
}
