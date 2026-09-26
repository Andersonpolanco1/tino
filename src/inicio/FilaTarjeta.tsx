import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Etiqueta, Texto, useTema } from '../diseno';
import type { VistaTarjeta } from './useVistas';

// Cada tarjeta del ranking (tabla 3.2 de la especificación): días, fecha de pago,
// recompensa y etiquetas.
export function FilaTarjeta({ vista, onPress }: { vista: VistaTarjeta; onPress: () => void }) {
  const tema = useTema();
  const { t } = useTranslation();
  const { tarjeta, resultado } = vista;
  const detalle = tarjeta.ultimos4
    ? t('inicio.detalleFilaUltimos4', { banco: vista.banco, ultimos4: tarjeta.ultimos4, fecha: vista.fechaPago })
    : t('inicio.detalleFila', { banco: vista.banco, fecha: vista.fechaPago });
  const etiquetas = [...(vista.recompensa ? [{ tipo: 'recompensa' as const, texto: vista.recompensa }] : []), ...vista.etiquetas];
  const extra = [t(`semaforo.${resultado.semaforo}`), ...etiquetas.map(e => e.texto)].join('. ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('inicio.accesibleTarjeta', { alias: tarjeta.alias, dias: resultado.diasGracia, fecha: vista.fechaPago, extra })}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: tema.espacio.m,
        backgroundColor: pressed ? tema.color.neutroFondo : tema.color.superficie,
        borderColor: tema.color.borde,
        borderWidth: 1,
        borderRadius: tema.radio.tarjeta,
        paddingVertical: tema.espacio.m,
        paddingHorizontal: tema.espacio.l,
      })}
    >
      <View style={{ flex: 1, gap: tema.espacio.xs }}>
        <Texto variante="cuerpoFuerte">{tarjeta.alias}</Texto>
        <Texto variante="apoyo" color="textoSecundario">
          {detalle}
        </Texto>
        {etiquetas.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tema.espacio.xs }}>
            {etiquetas.map(e => (
              <Etiqueta key={e.texto} tipo={e.tipo} texto={e.texto} />
            ))}
          </View>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Texto variante="cifra">{resultado.diasGracia}</Texto>
        <Texto variante="etiqueta" color="textoSecundario">
          {t('inicio.dias')}
        </Texto>
      </View>
    </Pressable>
  );
}
