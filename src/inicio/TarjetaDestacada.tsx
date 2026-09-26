import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Texto, useTema } from '../diseno';
import { PildoraSemaforo } from './Semaforo';
import { ChipBanco } from './ChipBanco';
import type { VistaTarjeta } from './useVistas';

// La tarjeta de hoy del rediseño: chip del banco, semáforo, días en grande, barra del ciclo,
// fecha de pago y recompensa.
export function TarjetaDestacada({ vista, onPress }: { vista: VistaTarjeta; onPress: () => void }) {
  const tema = useTema();
  const { t } = useTranslation();
  const { tarjeta, resultado } = vista;
  const detalle = tarjeta.ultimos4 ? t('inicio.bancoTermina', { banco: vista.banco, ultimos4: tarjeta.ultimos4 }) : vista.banco;
  const extra = [t(`semaforo.${resultado.semaforo}`), vista.recompensa, ...vista.etiquetas.map(e => e.texto)].filter(Boolean).join('. ');
  const translucido = tema.modo === 'oscuro' ? 0.15 : 0.22;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('inicio.accesibleTarjeta', { alias: tarjeta.alias, dias: resultado.diasGracia, fecha: vista.fechaPago, extra })}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: tema.color.destacado,
        borderRadius: tema.radio.destacada,
        padding: 22,
        gap: tema.espacio.l,
        boxShadow: tema.sombra.destacada,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: tema.espacio.m }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: tema.espacio.m, flexShrink: 1 }}>
          {vista.iniciales ? <ChipBanco iniciales={vista.iniciales} sobreDestacado /> : null}
          <View style={{ flexShrink: 1 }}>
            <Texto variante="cuerpoFuerte" color="sobreDestacado" style={{ fontSize: 17 }}>
              {tarjeta.alias}
            </Texto>
            {detalle ? (
              <Texto variante="apoyo" color="sobreDestacado" style={{ fontSize: 13 }}>
                {detalle}
              </Texto>
            ) : null}
          </View>
        </View>
        <PildoraSemaforo luz={resultado.semaforo} sobreDestacado />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: tema.espacio.m }}>
        <Texto variante="cifraGrande" color="sobreDestacado" style={{ fontSize: 80, lineHeight: 80, letterSpacing: -2 }}>
          {resultado.diasGracia}
        </Texto>
        <Texto variante="cuerpoFuerte" color="sobreDestacado" style={{ fontSize: 17, paddingBottom: tema.espacio.s }}>
          {t('inicio.diasParaPagarDosLineas')}
        </Texto>
      </View>

      <View style={{ gap: 6 }}>
        <View style={{ height: 6, borderRadius: 3, overflow: 'hidden' }}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: tema.color.sobreDestacado, opacity: translucido }]} />
          <View style={{ width: `${Math.round(vista.ciclo.fraccion * 100)}%`, height: 6, borderRadius: 3, backgroundColor: tema.color.sobreDestacado }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Texto variante="etiqueta" color="sobreDestacado" style={{ fontFamily: tema.texto.apoyo.fontFamily }}>
            {t('inicio.corto', { fecha: vista.ciclo.anteriorCorta })}
          </Texto>
          <Texto variante="etiqueta" color="sobreDestacado" style={{ fontFamily: tema.texto.apoyo.fontFamily }}>
            {t('inicio.corta', { fecha: vista.ciclo.proximoCorta })}
          </Texto>
        </View>
      </View>

      <View>
        <View style={{ height: 1, marginBottom: 14 }}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: tema.color.sobreDestacado, opacity: translucido }]} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: tema.espacio.s }}>
          <Texto variante="apoyo" color="sobreDestacado">
            {t('inicio.sePagaEl', { fecha: vista.fechaPagoCorta })}
          </Texto>
          {vista.recompensaCorta ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: tema.color.recompensaPunto }} />
              <Texto variante="apoyo" color="sobreDestacado" style={{ fontFamily: tema.texto.cuerpoFuerte.fontFamily }}>
                {vista.recompensaCorta}
              </Texto>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
