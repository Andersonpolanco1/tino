import { TextInput, View, type TextInputProps } from 'react-native';
import { Texto } from './Texto';
import { useTema } from './useTema';

interface Props extends Omit<TextInputProps, 'style'> {
  etiqueta: string;
  ayuda?: string;
  error?: string;
}

// Campo de texto con etiqueta, ayuda y error, todo desde los tokens.
export function Campo({ etiqueta, ayuda, error, ...entrada }: Props) {
  const tema = useTema();
  return (
    <View style={{ gap: tema.espacio.xs }}>
      <Texto variante="apoyo" color="textoSecundario">
        {etiqueta}
      </Texto>
      <TextInput
        {...entrada}
        accessibilityLabel={etiqueta}
        accessibilityHint={error ?? ayuda}
        allowFontScaling
        placeholderTextColor={tema.color.textoSecundario}
        style={[
          tema.texto.cuerpo,
          {
            color: tema.color.texto,
            backgroundColor: tema.color.superficie,
            borderColor: error ? tema.color.alertaTexto : tema.color.borde,
            borderWidth: 1,
            borderRadius: tema.radio.control,
            minHeight: tema.toqueMinimo,
            paddingHorizontal: tema.espacio.m,
            paddingVertical: tema.espacio.s,
          },
        ]}
      />
      {error ? (
        <Texto variante="apoyo" color="alertaTexto" accessibilityLiveRegion="polite">
          {error}
        </Texto>
      ) : ayuda ? (
        <Texto variante="apoyo" color="textoSecundario">
          {ayuda}
        </Texto>
      ) : null}
    </View>
  );
}
