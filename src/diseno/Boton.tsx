import { Pressable, View } from 'react-native';
import { Texto } from './Texto';
import { Icono, type NombreIcono } from './Icono';
import { useTema } from './useTema';
import type { RolColor } from './tema';

interface Props {
  titulo: string;
  onPress: () => void;
  // primario: jade, alto y con sombra (acción principal); secundario: superficie con sombra;
  // texto: solo texto jade; alerta: para acciones que borran.
  variante?: 'primario' | 'secundario' | 'texto' | 'alerta';
  icono?: NombreIcono;
  deshabilitado?: boolean;
}

// BotonPrimario de la sección 8.3 técnica y sus variantes, según el rediseño.
export function Boton({ titulo, onPress, variante = 'primario', icono, deshabilitado = false }: Props) {
  const tema = useTema();
  const estilo = {
    primario: { fondo: tema.color.primario, texto: 'sobrePrimario' as RolColor, sombra: tema.sombra.destacada, alto: 56 },
    secundario: { fondo: tema.color.superficie, texto: 'texto' as RolColor, sombra: tema.sombra.boton, alto: 52 },
    texto: { fondo: 'transparent', texto: 'primario' as RolColor, sombra: undefined, alto: tema.toqueMinimo },
    alerta: { fondo: tema.color.alertaFondo, texto: 'alertaTexto' as RolColor, sombra: undefined, alto: 52 },
  }[variante];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: deshabilitado }}
      disabled={deshabilitado}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: estilo.alto,
        borderRadius: tema.radio.boton,
        backgroundColor: estilo.fondo,
        boxShadow: estilo.sombra,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: tema.espacio.l,
        opacity: deshabilitado ? 0.5 : pressed ? 0.85 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: tema.espacio.s }}>
        {icono ? <Icono nombre={icono} color={estilo.texto} tamano={18} /> : null}
        <Texto variante="cuerpoFuerte" color={estilo.texto} style={variante === 'primario' ? { fontSize: 17 } : undefined}>
          {titulo}
        </Texto>
      </View>
    </Pressable>
  );
}
