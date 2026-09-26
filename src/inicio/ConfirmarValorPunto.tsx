import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Recompensa, Tarjeta } from '../tipos/tipos';
import { Boton, Icono, Superficie, Texto, useTema } from '../diseno';
import { formatearMoneda } from '../i18n/formato';
import { usePais } from '../paises';
import { useAlmacen } from '../estado';

const porConfirmar = (r?: Recompensa) => r?.tipo === 'puntos' && !r.valorPuntoConfirmado;

export const valorPuntoPorConfirmar = (t: Tarjeta) => porConfirmar(t.recompensa) || porConfirmar(t.recompensaUsd);

const confirmar = (r: Recompensa): Recompensa => (r.tipo === 'puntos' ? { ...r, valorPuntoConfirmado: true } : r);

// Sección 4.2: el valor del punto viene precargado y la comparación es aproximada hasta que el
// usuario lo confirme. Aquí se confirma en un toque o se abre la recompensa para cambiarlo.
export function ConfirmarValorPunto({ tarjeta, onCambiar }: { tarjeta: Tarjeta; onCambiar: () => void }) {
  const tema = useTema();
  const { t } = useTranslation();
  const { config, idioma } = usePais();
  const guardarTarjeta = useAlmacen(s => s.guardarTarjeta);
  const r = porConfirmar(tarjeta.recompensa) ? tarjeta.recompensa : tarjeta.recompensaUsd;
  if (r?.tipo !== 'puntos') return null;
  const valor = formatearMoneda(r.valorPunto, config.monedaPrincipal, idioma);

  const siEsCorrecto = () =>
    guardarTarjeta({
      ...tarjeta,
      recompensa: confirmar(tarjeta.recompensa),
      ...(tarjeta.recompensaUsd ? { recompensaUsd: confirmar(tarjeta.recompensaUsd) } : {}),
    });

  return (
    <Superficie radio={tema.radio.lista} style={{ padding: tema.espacio.l, gap: tema.espacio.m }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: tema.espacio.m }}>
        <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: tema.color.recompensaFondo, alignItems: 'center', justifyContent: 'center' }}>
          <Icono nombre="moneda" color="recompensaTexto" tamano={20} />
        </View>
        <Texto variante="cuerpoFuerte" accessibilityRole="header" style={{ flex: 1 }}>
          {t('detalle.confirmarPuntoTitulo', { valor })}
        </Texto>
      </View>
      <Texto variante="apoyo" color="textoSecundario">
        {t('detalle.confirmarPuntoTexto')}
      </Texto>
      <Boton titulo={t('detalle.confirmarPuntoSi')} icono="check" onPress={siEsCorrecto} />
      <Boton titulo={t('detalle.confirmarPuntoCambiar')} variante="secundario" onPress={onCambiar} />
    </Superficie>
  );
}
