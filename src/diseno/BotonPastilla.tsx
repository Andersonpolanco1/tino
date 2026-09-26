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
  // Cuando el texto solo no basta (por ejemplo, "Ya pagué" en una lista de tarjetas).
  etiquetaAccesible?: string;
}

// Botón compacto con ícono y texto, en forma de pastilla: "Editar", "Tengo una compra".
export function BotonPastilla({ icono, titulo, onPress, primario = false, etiquetaAccesible }: Props) {
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
        backgroundColor: primario ? tema.color.primario : tema.color.superficie,
        boxShadow: primario ? tema.sombra.destacada : tema.sombra.boton,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Icono nombre={icono} color={texto} tamano={18} grosor={2.2} />
      <Texto variante="cuerpoFuerte" color={texto} style={{ fontSize: 15 }}>
        {titulo}
      </Texto>
    </Pressable>
  );
}
