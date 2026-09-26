import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Texto } from './Texto';
import { useTema } from './useTema';
import type { VarianteTexto } from './tema';

interface Props {
  etiqueta: string;
  // Explicación que se abre al tocar el ícono ⓘ; sin ella solo se muestra la etiqueta.
  info?: string;
  variante?: VarianteTexto;
  encabezado?: boolean;
}

// Etiqueta con un ícono informativo: la explicación queda a un toque en vez de ocupar
// la pantalla todo el tiempo.
export function EtiquetaConInfo({ etiqueta, info, variante = 'apoyo', encabezado = false }: Props) {
  const tema = useTema();
  const { t } = useTranslation();
  const [abierta, setAbierta] = useState(false);
  const color = variante === 'apoyo' ? 'textoSecundario' : 'texto';
  return (
    <View style={{ gap: tema.espacio.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: tema.espacio.xs }}>
        <View style={{ flexShrink: 1 }}>
          <Texto variante={variante} color={color} accessibilityRole={encabezado ? 'header' : undefined}>
            {etiqueta}
          </Texto>
        </View>
        {info ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('comun.masInformacion', { tema: etiqueta })}
            accessibilityState={{ expanded: abierta }}
            onPress={() => setAbierta(!abierta)}
            style={{ minWidth: tema.toqueMinimo, minHeight: tema.toqueMinimo, alignItems: 'center', justifyContent: 'center' }}
          >
            <View
              style={{
                width: tema.espacio.xxl,
                height: tema.espacio.xxl,
                borderRadius: tema.radio.circular,
                borderWidth: 2,
                borderColor: tema.color.primario,
                backgroundColor: abierta ? tema.color.primario : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Texto variante="etiqueta" color={abierta ? 'sobrePrimario' : 'primario'} allowFontScaling={false}>
                {t('comun.iconoInfo')}
              </Texto>
            </View>
          </Pressable>
        ) : null}
      </View>
      {info && abierta ? (
        <View style={{ backgroundColor: tema.color.neutroFondo, borderRadius: tema.radio.control, padding: tema.espacio.m }}>
          <Texto variante="apoyo" accessibilityLiveRegion="polite">
            {info}
          </Texto>
        </View>
      ) : null}
    </View>
  );
}
