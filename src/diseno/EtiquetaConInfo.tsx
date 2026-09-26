import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Texto } from './Texto';
import { Icono } from './Icono';
import { useTema } from './useTema';
import type { VarianteTexto } from './tema';

interface Props {
  etiqueta: string;
  // Explicación que se abre al tocar el ícono de información; sin ella solo se muestra la etiqueta.
  info?: string;
  variante?: VarianteTexto;
  encabezado?: boolean;
}

// Etiqueta con el ícono de información del rediseño: la explicación queda a un toque en vez
// de ocupar la pantalla todo el tiempo.
export function EtiquetaConInfo({ etiqueta, info, variante = 'cuerpoFuerte', encabezado = false }: Props) {
  const tema = useTema();
  const { t } = useTranslation();
  const [abierta, setAbierta] = useState(false);
  return (
    <View style={{ gap: tema.espacio.s }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tema.espacio.xs }}>
        <View style={{ flexShrink: 1 }}>
          <Texto variante={variante} accessibilityRole={encabezado ? 'header' : undefined}>
            {etiqueta}
          </Texto>
        </View>
        {info ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('comun.masInformacion', { tema: etiqueta })}
            accessibilityState={{ expanded: abierta }}
            onPress={() => setAbierta(!abierta)}
            style={{ width: tema.toqueMinimo, height: tema.toqueMinimo, marginVertical: -tema.espacio.m, marginRight: -tema.espacio.m, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icono nombre="info" color="primario" tamano={20} grosor={abierta ? 2.6 : 2} />
          </Pressable>
        ) : null}
      </View>
      {info && abierta ? (
        <View style={{ backgroundColor: tema.color.neutroFondo, borderRadius: tema.radio.segmento, padding: tema.espacio.m }}>
          <Texto variante="apoyo" accessibilityLiveRegion="polite">
            {info}
          </Texto>
        </View>
      ) : null}
    </View>
  );
}
