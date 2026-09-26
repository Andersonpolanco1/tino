import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Campo, ControlSegmentado, EtiquetaConInfo, Texto, useTema } from '../diseno';
import type { BorradorRecompensa } from './borrador';

interface Props {
  etiqueta: string;
  info?: string;
  valor: BorradorRecompensa;
  onCambio: (valor: BorradorRecompensa) => void;
  error?: string;
}

// Solo dígitos y un separador decimal.
const decimal = (texto: string) => texto.replace(/[^\d.,]/g, '');

// Sección 4.2 con el rediseño: tipo y regla en controles segmentados, números en campos.
export function EditorRecompensa({ etiqueta, info, valor, onCambio, error }: Props) {
  const tema = useTema();
  const { t } = useTranslation();
  const cambiar = (cambios: Partial<BorradorRecompensa>) => onCambio({ ...valor, ...cambios });
  return (
    <View style={{ gap: tema.espacio.l }}>
      <EtiquetaConInfo etiqueta={etiqueta} info={info} />
      <ControlSegmentado
        etiqueta={etiqueta}
        valor={valor.tipo}
        onCambio={tipo => cambiar({ tipo })}
        opciones={[
          { valor: 'ninguna', etiqueta: t('registro.recompensaNinguna') },
          { valor: 'puntos', etiqueta: t('registro.recompensaPuntos') },
          { valor: 'cashback', etiqueta: t('registro.recompensaCashback') },
        ]}
      />
      {valor.tipo === 'puntos' ? (
        <View style={{ gap: tema.espacio.l }}>
          <EtiquetaConInfo etiqueta={t('registro.tipoRegla')} info={t('registro.info.reglaPuntos')} />
          <ControlSegmentado
            etiqueta={t('registro.tipoRegla')}
            valor={valor.regla}
            onCambio={regla => cambiar({ regla })}
            opciones={[
              { valor: 'por_monto', etiqueta: t('registro.reglaPorMonto') },
              { valor: 'por_porcentaje', etiqueta: t('registro.reglaPorPorcentaje') },
              { valor: 'por_transaccion', etiqueta: t('registro.reglaPorTransaccion') },
            ]}
          />
          {valor.regla === 'por_monto' ? (
            <View style={{ flexDirection: 'row', gap: tema.espacio.m }}>
              <View style={{ flex: 1 }}>
                <Campo etiqueta={t('registro.puntos')} value={valor.puntos} onChangeText={x => cambiar({ puntos: decimal(x) })} keyboardType="decimal-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Campo etiqueta={t('registro.porCadaMonto')} value={valor.porCadaMonto} onChangeText={x => cambiar({ porCadaMonto: decimal(x) })} keyboardType="decimal-pad" />
              </View>
            </View>
          ) : valor.regla === 'por_porcentaje' ? (
            <Campo etiqueta={t('registro.porcentaje')} value={valor.porcentajePuntos} onChangeText={x => cambiar({ porcentajePuntos: decimal(x) })} keyboardType="decimal-pad" />
          ) : (
            <Campo etiqueta={t('registro.puntosPorCompra')} value={valor.puntos} onChangeText={x => cambiar({ puntos: decimal(x) })} keyboardType="decimal-pad" />
          )}
          <Campo
            etiqueta={t('registro.valorPunto')}
            info={t('registro.info.valorPunto')}
            value={valor.valorPunto}
            onChangeText={x => cambiar({ valorPunto: decimal(x), valorPuntoConfirmado: true })}
            keyboardType="decimal-pad"
          />
        </View>
      ) : null}
      {valor.tipo === 'cashback' ? (
        <Campo
          etiqueta={t('registro.cashbackPorcentaje')}
          info={t('registro.info.cashback')}
          value={valor.porcentajeCashback}
          onChangeText={x => cambiar({ porcentajeCashback: decimal(x) })}
          keyboardType="decimal-pad"
        />
      ) : null}
      {error ? (
        <Texto variante="apoyo" color="alertaTexto" accessibilityLiveRegion="polite">
          {error}
        </Texto>
      ) : null}
    </View>
  );
}
