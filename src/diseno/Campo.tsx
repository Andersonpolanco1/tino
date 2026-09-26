import { TextInput, View, type TextInputProps } from 'react-native';
import { Texto } from './Texto';
import { EtiquetaConInfo } from './EtiquetaConInfo';
import { useTema } from './useTema';

interface Props extends Omit<TextInputProps, 'style'> {
  etiqueta: string;
  ayuda?: string;
  info?: string;
  error?: string;
}

// Campo de texto del rediseño: superficie con sombra suave, sin borde salvo cuando hay error.
export function Campo({ etiqueta, ayuda, info, error, ...entrada }: Props) {
  const tema = useTema();
  return (
    <View style={{ gap: tema.espacio.s }}>
      <EtiquetaConInfo etiqueta={etiqueta} info={info} />
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
            borderColor: error ? tema.color.alertaTexto : 'transparent',
            borderWidth: 1.5,
            borderRadius: tema.radio.segmento,
            boxShadow: tema.sombra.tarjeta,
            minHeight: 52,
            paddingHorizontal: tema.espacio.l,
            paddingVertical: tema.espacio.m,
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
