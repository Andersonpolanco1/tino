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

// La tarjeta de hoy, en cuatro capas (decisión D43): nombre, días, línea del ciclo y recompensa.
// Lo que no ayuda a decidir queda en el detalle y en lo que anuncia el lector de pantalla: el
// corte anterior, el semáforo en verde y los últimos 4 dígitos, salvo que haya otra tarjeta
// del mismo banco (mostrarUltimos4).
export function TarjetaDestacada({ vista, mostrarUltimos4, onPress }: { vista: VistaTarjeta; mostrarUltimos4: boolean; onPress: () => void }) {
  const tema = useTema();
  const { t } = useTranslation();
  const hoy = useHoy();
  const { tarjeta, resultado } = vista;
  const detalle = subtituloTarjeta(tarjeta.alias, vista.banco, mostrarUltimos4 ? tarjeta.ultimos4 : undefined, t as unknown as Traducir);
  const extra = [tarjeta.ultimos4 ? t('inicio.termina', { ultimos4: tarjeta.ultimos4 }) : null, t(`semaforo.${resultado.semaforo}`), vista.recompensa, ...vista.etiquetas.map(e => e.texto)].filter(Boolean).join('. ');

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

      <BloqueDias dias={resultado.diasGracia} sobreDestacado />
      <LineaCiclo anterior={vista.ciclo.anterior} hoy={hoy} corte={resultado.proximoCorte} pago={resultado.fechaPago} sobreDestacado sinCorteAnterior />

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
        {/* El semáforo solo aparece cuando advierte algo; en verde lo dice el lector de pantalla. */}
        {resultado.semaforo !== 'verde' ? <PildoraSemaforo luz={resultado.semaforo} sobreDestacado /> : null}
      </View>
    </Pressable>
  );
}
