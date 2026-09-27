import { Pressable } from 'react-native';
import { Icono, type NombreIcono } from './Icono';
import { Texto } from './Texto';
import { useTema } from './useTema';

interface Props {
  icono: NombreIcono;
  titulo: string;
  onPress: () => void;
}

// Acción a la derecha de la barra superior ("Editar"): sin fondo, como atrás y cerrar, en jade
// para que se lea como algo que se puede tocar.
export function AccionBarra({ icono, titulo, onPress }: Props) {
  const tema = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      onPress={onPress}
      hitSlop={tema.espacio.xs}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        minHeight: tema.toqueMinimo,
        paddingHorizontal: tema.espacio.s,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Icono nombre={icono} color="primario" tamano={18} grosor={2.2} />
      <Texto variante="cuerpoFuerte" color="primario">
        {titulo}
      </Texto>
    </Pressable>
  );
}
