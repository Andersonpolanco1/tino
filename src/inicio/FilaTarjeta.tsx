import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Etiqueta, FilaLista, Texto, useTema } from '../diseno';
import type { VistaTarjeta } from './useVistas';

// Cada tarjeta del ranking dentro de la lista agrupada (rediseño): iniciales del banco,
// nombre, banco y fecha de pago, etiquetas y los días a la derecha.
export function FilaTarjeta({ vista, onPress, recompensa }: { vista: VistaTarjeta; onPress: () => void; recompensa?: string | null }) {
  const tema = useTema();
  const { t } = useTranslation();
  const { tarjeta, resultado } = vista;
  const textoRecompensa = recompensa === undefined ? vista.recompensa : recompensa;
  const etiquetas = [...(textoRecompensa ? [{ tipo: 'recompensa' as const, texto: textoRecompensa }] : []), ...vista.etiquetas];
  const extra = [t(`semaforo.${resultado.semaforo}`), ...etiquetas.map(e => e.texto)].join('. ');

  return (
    <FilaLista
      iniciales={vista.iniciales || tarjeta.alias.slice(0, 2).toUpperCase()}
      titulo={tarjeta.alias}
      detalle={vista.banco ? t('inicio.detalleLista', { banco: vista.banco, fecha: vista.fechaPagoCorta }) : t('inicio.sePagaEl', { fecha: vista.fechaPagoCorta })}
      etiquetaAccesible={t('inicio.accesibleTarjeta', { alias: tarjeta.alias, dias: resultado.diasGracia, fecha: vista.fechaPago, extra })}
      onPress={onPress}
      debajo={
        etiquetas.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
            {etiquetas.map(e => (
              <Etiqueta key={e.texto} tipo={e.tipo} texto={e.texto} />
            ))}
          </View>
        ) : undefined
      }
      derecha={
        <View style={{ alignItems: 'flex-end' }}>
          <Texto variante="cifra" style={{ fontSize: 28, lineHeight: 30 }}>
            {resultado.diasGracia}
          </Texto>
          <Texto variante="etiqueta" color="textoSecundario" style={{ fontFamily: tema.texto.apoyo.fontFamily }}>
            {t('inicio.dias')}
          </Texto>
        </View>
      }
    />
  );
}
