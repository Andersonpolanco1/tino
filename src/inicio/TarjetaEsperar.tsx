import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icono, Texto, useTema } from '../diseno';

// Decisión D103: con todas las tarjetas por cortar, el lugar de la tarjeta de hoy lo ocupa el
// consejo de esperar: cuándo y con qué tarjeta. No va en verde, porque no es una tarjeta para usar.
export function TarjetaEsperar({ dia, alias, dias, diasHoy, onPress }: { dia: string; alias: string; dias: number; diasHoy: number; onPress: () => void }) {
  const tema = useTema();
  const { t } = useTranslation();
  const titulo = t('inicio.esperarDia', { dia });
  const detalle = t('inicio.esperarDetalle', { alias, dias, hoy: diasHoy });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${titulo}. ${detalle}`}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: tema.espacio.m,
        padding: 20,
        borderRadius: tema.radio.destacada,
        backgroundColor: tema.color.superficie,
        boxShadow: tema.sombra.destacada,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: tema.color.recompensaFondo, alignItems: 'center', justifyContent: 'center' }}>
        <Icono nombre="reloj" color="semaforoAmarillo" tamano={22} grosor={2.4} />
      </View>
      <View style={{ flex: 1, gap: tema.espacio.xs }}>
        <Texto variante="cuerpoDestacado">{titulo}</Texto>
        <Texto variante="apoyo" color="textoSecundario">
          {detalle}
        </Texto>
      </View>
    </Pressable>
  );
}
