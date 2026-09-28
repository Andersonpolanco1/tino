import { Pressable, View } from 'react-native';
import { Icono, type NombreIcono } from './Icono';
import { useTema } from './useTema';

interface Props {
  icono: NombreIcono;
  etiqueta: string;
  onPress: () => void;
  // "plano": sin fondo ni sombra (el botón de cerrar de las maquetas).
  plano?: boolean;
  grande?: boolean;
  // Un punto coral sobre el ícono cuando hay algo nuevo, como en la barra de pestañas. La
  // etiqueta debe decirlo en palabras.
  aviso?: boolean;
  testID?: string;
}

// Botón redondo de solo ícono: atrás, cerrar y los consejos de Tarjetas.
export function BotonCircular({ icono, etiqueta, onPress, plano = false, grande = false, aviso = false, testID }: Props) {
  const tema = useTema();
  const lado = grande ? tema.toqueMinimo + tema.espacio.xs : tema.toqueMinimo;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      onPress={onPress}
      testID={testID}
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
      <View>
        <Icono nombre={icono} color={plano ? 'textoSecundario' : 'texto'} tamano={grande ? 22 : 20} grosor={2.2} />
        {aviso ? (
          <View
            testID={testID ? `${testID}-aviso` : undefined}
            style={{
              position: 'absolute',
              top: -2,
              right: -3,
              width: 9,
              height: 9,
              borderRadius: 5,
              backgroundColor: tema.color.alertaTexto,
              borderWidth: 1.5,
              borderColor: plano ? tema.color.fondo : tema.color.superficie,
            }}
          />
        ) : null}
      </View>
    </Pressable>
  );
}
