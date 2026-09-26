import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Texto, useTema } from '../diseno';
import { PildoraSemaforo } from './Semaforo';
import { ChipBanco } from './ChipBanco';
import type { VistaTarjeta } from './useVistas';

// La tarjeta de hoy del rediseño: chip del banco, semáforo, días en grande, barra del ciclo,
// fecha de pago y recompensa.
// motivo: la línea que dice por qué ganó según el enfoque (sección 3.1).
export function TarjetaDestacada({ vista, motivo, onPress }: { vista: VistaTarjeta; motivo?: string; onPress: () => void }) {
  const tema = useTema();
  const { t } = useTranslation();
  const { tarjeta, resultado } = vista;
  // El alias casi siempre ya trae el banco ("Visa Clásica Banreservas"): no se repite debajo.
  const aliasConBanco = !!vista.banco && tarjeta.alias.toLocaleLowerCase().includes(vista.banco.toLocaleLowerCase());
  const detalle = tarjeta.ultimos4
    ? aliasConBanco
      ? t('inicio.termina', { ultimos4: tarjeta.ultimos4 })
      : t('inicio.bancoTermina', { banco: vista.banco, ultimos4: tarjeta.ultimos4 })
    : aliasConBanco
      ? ''
      : vista.banco;
  const extra = [motivo, t(`semaforo.${resultado.semaforo}`), vista.recompensa, ...vista.etiquetas.map(e => e.texto)].filter(Boolean).join('. ');
  const translucido = tema.modo === 'oscuro' ? 0.15 : 0.22;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('inicio.accesibleTarjeta', { alias: tarjeta.alias, dias: resultado.diasGracia, fecha: vista.fechaPago, extra })}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: tema.color.destacado,
        borderRadius: tema.radio.destacada,
        padding: 20,
        gap: tema.espacio.m,
        boxShadow: tema.sombra.destacada,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      {motivo ? (
        <Texto variante="etiqueta" color="sobreDestacado" style={{ fontFamily: tema.texto.apoyo.fontFamily }}>
          {motivo}
        </Texto>
      ) : null}

      {/* Compacta: nombre a todo el ancho, días con su fecha al lado, y semáforo con la recompensa al pie. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: tema.espacio.m }}>
        {vista.iniciales ? <ChipBanco iniciales={vista.iniciales} sobreDestacado /> : null}
        <View style={{ flex: 1 }}>
          <Texto variante="cuerpoFuerte" color="sobreDestacado" style={{ fontSize: 17 }} numberOfLines={2}>
            {tarjeta.alias}
          </Texto>
          {detalle ? (
            <Texto variante="apoyo" color="sobreDestacado" style={{ fontSize: 13 }} numberOfLines={1}>
              {detalle}
            </Texto>
          ) : null}
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: tema.espacio.m }}>
        <Texto variante="cifraGrande" color="sobreDestacado" style={{ fontSize: 64, lineHeight: 66, letterSpacing: -1.5 }}>
          {resultado.diasGracia}
        </Texto>
        <View style={{ flex: 1 }}>
          <Texto variante="cuerpoFuerte" color="sobreDestacado" style={{ fontSize: 17 }}>
            {t('inicio.diasParaPagar')}
          </Texto>
          <Texto variante="apoyo" color="sobreDestacado">
            {t('inicio.sePagaEl', { fecha: vista.fechaPagoCorta })}
          </Texto>
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <View style={{ height: 6, borderRadius: 3, overflow: 'hidden' }}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: tema.color.sobreDestacado, opacity: translucido }]} />
          <View style={{ width: `${Math.round(vista.ciclo.fraccion * 100)}%`, height: 6, borderRadius: 3, backgroundColor: tema.color.sobreDestacado }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: tema.espacio.s }}>
          <Texto variante="etiqueta" color="sobreDestacado" style={{ fontFamily: tema.texto.apoyo.fontFamily }}>
            {t('inicio.corto', { fecha: vista.ciclo.anteriorCorta })}
          </Texto>
          <Texto variante="etiqueta" color="sobreDestacado" style={{ fontFamily: tema.texto.apoyo.fontFamily, textAlign: 'right' }}>
            {t('inicio.corta', { fecha: vista.ciclo.proximoCorta })}
          </Texto>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: tema.espacio.s }}>
        {vista.recompensaCorta ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: tema.color.recompensaPunto }} />
            <Texto variante="apoyo" color="sobreDestacado" style={{ fontFamily: tema.texto.cuerpoFuerte.fontFamily }}>
              {vista.recompensaCorta}
            </Texto>
          </View>
        ) : (
          <View />
        )}
        <PildoraSemaforo luz={resultado.semaforo} sobreDestacado />
      </View>
    </Pressable>
  );
}
