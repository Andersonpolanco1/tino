import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Texto, useTema } from '../diseno';
import { PildoraSemaforo } from './Semaforo';
import { ChipBanco } from './ChipBanco';
import { BloqueDias } from './BloqueDias';
import { LineaCiclo } from './LineaCiclo';
import { useHoy } from './useHoy';
import type { VistaTarjeta } from './useVistas';
import { subtituloTarjeta, type Traducir } from './vista';

// La tarjeta de hoy del rediseño: chip del banco, semáforo, días en grande, barra del ciclo,
// fecha de pago y recompensa.
// motivo: la línea que dice por qué ganó según el enfoque (sección 3.1).
export function TarjetaDestacada({ vista, motivo, onPress }: { vista: VistaTarjeta; motivo?: string; onPress: () => void }) {
  const tema = useTema();
  const { t } = useTranslation();
  const hoy = useHoy();
  const { tarjeta, resultado } = vista;
  const detalle = subtituloTarjeta(tarjeta.alias, vista.banco, tarjeta.ultimos4, t as unknown as Traducir);
  const extra = [motivo, t(`semaforo.${resultado.semaforo}`), vista.recompensa, ...vista.etiquetas.map(e => e.texto)].filter(Boolean).join('. ');

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

      <BloqueDias dias={resultado.diasGracia} fechaPago={vista.fechaPagoCorta} sobreDestacado />
      <LineaCiclo anterior={vista.ciclo.anterior} hoy={hoy} corte={resultado.proximoCorte} pago={resultado.fechaPago} sobreDestacado />

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
