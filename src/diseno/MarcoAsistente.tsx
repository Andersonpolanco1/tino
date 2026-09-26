import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Pantalla } from './Pantalla';
import { BarraSuperior } from './BarraSuperior';
import { EtiquetaConInfo } from './EtiquetaConInfo';
import { Texto } from './Texto';
import { useTema } from './useTema';

interface Props {
  // Barra: "atrás" o "cerrar" a la izquierda, "Paso X de N" o un título, y cerrar a la derecha.
  izquierda: { tipo: 'atras' | 'cerrar'; onPress: () => void };
  tituloBarra: string;
  onCerrar?: () => void;
  // Segmentos de avance; sin él (al editar) no se muestran.
  progreso?: { actual: number; total: number };
  titulo: string;
  info?: string;
  subtitulo?: string;
  pie?: ReactNode;
  children: ReactNode;
}

// Un paso por pantalla: barra, avance, título en pregunta con su ⓘ y el botón fijo abajo.
// Lo comparten el registro de tarjetas y el de cobros.
export function MarcoAsistente({ izquierda, tituloBarra, onCerrar, progreso, titulo, info, subtitulo, pie, children }: Props) {
  const tema = useTema();
  return (
    <Pantalla
      arriba={
        <View style={{ gap: 18 }}>
          <BarraSuperior izquierda={izquierda} titulo={tituloBarra} cerrar={onCerrar} />
          {progreso ? (
            <View style={{ flexDirection: 'row', gap: 6 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {Array.from({ length: progreso.total }, (_, i) => (
                <View key={i} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: i < progreso.actual ? tema.color.primario : tema.color.pistaApagada }} />
              ))}
            </View>
          ) : null}
        </View>
      }
      pie={pie}
    >
      <View style={{ gap: tema.espacio.xs }}>
        <EtiquetaConInfo etiqueta={titulo} info={info} variante="titulo" encabezado />
        {subtitulo ? (
          <Texto variante="apoyo" color="textoSecundario">
            {subtitulo}
          </Texto>
        ) : null}
      </View>
      {children}
    </Pantalla>
  );
}
