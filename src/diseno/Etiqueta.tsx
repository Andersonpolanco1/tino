import { View } from 'react-native';
import { Texto } from './Texto';
import { useTema } from './useTema';
import type { RolColor } from './tema';

export type TipoEtiqueta = 'recompensa' | 'alerta' | 'neutra';

// Sección 16.6 de la especificación: el oro solo en recompensas y el coral solo en alertas.
const COLORES: Record<TipoEtiqueta, { fondo: RolColor; texto: RolColor }> = {
  recompensa: { fondo: 'recompensaFondo', texto: 'recompensaTexto' },
  alerta: { fondo: 'alertaFondo', texto: 'alertaTexto' },
  neutra: { fondo: 'neutroFondo', texto: 'textoSecundario' },
};

export function Etiqueta({ tipo, texto }: { tipo: TipoEtiqueta; texto: string }) {
  const tema = useTema();
  const { fondo, texto: colorTexto } = COLORES[tipo];
  return (
    <View
      style={{
        backgroundColor: tema.color[fondo],
        borderRadius: tema.radio.etiqueta,
        paddingHorizontal: tema.espacio.s,
        paddingVertical: tema.espacio.xs,
        alignSelf: 'flex-start',
      }}
    >
      <Texto variante="etiqueta" color={colorTexto}>
        {texto}
      </Texto>
    </View>
  );
}
