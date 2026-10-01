import { Pressable } from 'react-native';
import { Texto } from './Texto';
import { Icono, type NombreIcono } from './Icono';
import { useTema } from './useTema';

interface Props {
  icono: NombreIcono;
  titulo: string;
  onPress: () => void;
  // "primario": en jade, para la acción que se quiere destacar ("Tengo una compra").
  primario?: boolean;
  // "neutra": en gris suave y sin sombra, para ir dentro de una tarjeta (el día de la compra).
  neutra?: boolean;
  // Con flecha hacia abajo: abre una lista o un selector.
  desplegable?: boolean;
  // Cuando el texto solo no basta (por ejemplo, "Ya pagué" en una lista de tarjetas).
  etiquetaAccesible?: string;
}

// Botón compacto con ícono y texto, en forma de pastilla: "Editar", "Tengo una compra".
export function BotonPastilla({ icono, titulo, onPress, primario = false, neutra = false, desplegable = false, etiquetaAccesible }: Props) {
  const tema = useTema();
  const texto = primario ? 'sobrePrimario' : 'texto';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiquetaAccesible}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: tema.espacio.s,
        minHeight: tema.toqueMinimo,
        paddingHorizontal: tema.espacio.l,
        borderRadius: tema.radio.circular,
        backgroundColor: primario ? tema.color.primario : neutra ? tema.color.neutroFondo : tema.color.superficie,
        boxShadow: primario ? tema.sombra.destacada : neutra ? undefined : tema.sombra.boton,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Icono nombre={icono} color={texto} tamano={18} grosor={2.2} />
      <Texto variante="controlFuerte" color={texto}>
        {titulo}
      </Texto>
      {desplegable ? <Icono nombre="abajo" color={texto} tamano={16} grosor={2.2} /> : null}
    </Pressable>
  );
}
