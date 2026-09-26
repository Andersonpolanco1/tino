import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icono, Texto, useTema } from '../diseno';
import { ICONO_SEMAFORO } from './Semaforo';
import type { VistaTarjeta } from './useVistas';

// La tarjeta de hoy (maquetas de inicio): días de gracia en grande, fecha de pago,
// recompensa y semáforo.
export function TarjetaDestacada({ vista, onPress }: { vista: VistaTarjeta; onPress: () => void }) {
  const tema = useTema();
  const { t } = useTranslation();
  const { tarjeta, resultado } = vista;
  const detalle = tarjeta.ultimos4 ? t('inicio.bancoTermina', { banco: vista.banco, ultimos4: tarjeta.ultimos4 }) : vista.banco;
  const extra = [t(`semaforo.${resultado.semaforo}`), vista.recompensa, ...vista.etiquetas.map(e => e.texto)].filter(Boolean).join('. ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('inicio.accesibleTarjeta', { alias: tarjeta.alias, dias: resultado.diasGracia, fecha: vista.fechaPago, extra })}
      onPress={onPress}
      style={{ backgroundColor: tema.color.destacado, borderRadius: tema.radio.destacada, padding: tema.espacio.xl, gap: tema.espacio.m }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: tema.espacio.m }}>
        <View style={{ flexShrink: 1, gap: tema.espacio.xs }}>
          <Texto variante="subtitulo" color="sobreDestacado">
            {tarjeta.alias}
          </Texto>
          {detalle ? (
            <Texto variante="apoyo" color="sobreDestacado">
              {detalle}
            </Texto>
          ) : null}
        </View>
        <View style={{ borderRadius: tema.radio.circular, overflow: 'hidden' }}>
          {/* Fondo translúcido: el color del texto de la tarjeta con transparencia, como en las maquetas. */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: tema.color.sobreDestacado, opacity: 0.16 }]} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: tema.espacio.xs, paddingHorizontal: tema.espacio.m, paddingVertical: tema.espacio.xs }}>
            <Icono nombre={ICONO_SEMAFORO[resultado.semaforo]} color="sobreDestacado" tamano={tema.espacio.l} />
            <Texto variante="etiqueta" color="sobreDestacado">
              {t(`semaforo.${resultado.semaforo}`)}
            </Texto>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: tema.espacio.m, flexWrap: 'wrap' }}>
        <Texto variante="cifraGrande" color="sobreDestacado">
          {resultado.diasGracia}
        </Texto>
        <Texto variante="subtitulo" color="sobreDestacado">
          {t('inicio.diasParaPagar')}
        </Texto>
      </View>

      <View style={{ height: StyleSheet.hairlineWidth * 2, backgroundColor: tema.color.sobreDestacado, opacity: 0.25 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: tema.espacio.s }}>
        <Texto variante="apoyo" color="sobreDestacado">
          {t('inicio.sePagaEl', { fecha: vista.fechaPago })}
        </Texto>
        {vista.recompensa ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: tema.espacio.xs }}>
            <View style={{ width: tema.espacio.m, height: tema.espacio.m, borderRadius: tema.radio.circular, backgroundColor: tema.color.recompensaPunto }} />
            <Texto variante="apoyo" color="sobreDestacado" style={{ fontFamily: tema.texto.cuerpoFuerte.fontFamily }}>
              {vista.recompensa}
            </Texto>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
