import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BotonCircular } from './BotonCircular';
import { Texto } from './Texto';
import { useTema } from './useTema';

interface Props {
  // atras: botón redondo con flecha; cerrar: X; ninguno: espacio vacío.
  izquierda?: { tipo: 'atras' | 'cerrar'; onPress: () => void };
  titulo?: string;
  derecha?: ReactNode;
  // Cerrar sin fondo a la derecha (paso a paso del registro).
  cerrar?: () => void;
}

// Barra de arriba del rediseño, en lugar del encabezado del sistema.
export function BarraSuperior({ izquierda, titulo, derecha, cerrar }: Props) {
  const tema = useTema();
  const { t } = useTranslation();
  const hueco = <View style={{ width: tema.toqueMinimo }} />;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tema.espacio.m }}>
      {izquierda ? (
        <BotonCircular
          icono={izquierda.tipo}
          etiqueta={izquierda.tipo === 'atras' ? t('comun.atras') : t('comun.cerrar')}
          onPress={izquierda.onPress}
        />
      ) : (
        hueco
      )}
      {titulo ? (
        <Texto variante="cuerpoFuerte" color="textoSecundario" style={{ flexShrink: 1, textAlign: 'center' }} numberOfLines={1}>
          {titulo}
        </Texto>
      ) : null}
      {derecha ?? (cerrar ? <BotonCircular icono="cerrar" etiqueta={t('comun.cerrar')} onPress={cerrar} plano /> : hueco)}
    </View>
  );
}
