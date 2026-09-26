import { Pressable } from 'react-native';
import { Icono, type NombreIcono } from './Icono';
import { useTema } from './useTema';

interface Props {
  icono: NombreIcono;
  etiqueta: string;
  onPress: () => void;
  // "plano": sin fondo ni sombra (el botón de cerrar de las maquetas).
  plano?: boolean;
  grande?: boolean;
}

// Botón redondo de solo ícono: atrás, cerrar, "Tengo una compra".
export function BotonCircular({ icono, etiqueta, onPress, plano = false, grande = false }: Props) {
  const tema = useTema();
  const lado = grande ? tema.toqueMinimo + tema.espacio.xs : tema.toqueMinimo;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      onPress={onPress}
      style={({ pressed }) => ({
        width: lado,
        height: lado,
        borderRadius: tema.radio.circular,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: plano ? 'transparent' : tema.color.superficie,
        boxShadow: plano ? undefined : tema.sombra.boton,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Icono nombre={icono} color={plano ? 'textoSecundario' : 'texto'} tamano={grande ? 22 : 20} grosor={icono === 'compra' ? 2 : 2.2} />
    </Pressable>
  );
}
