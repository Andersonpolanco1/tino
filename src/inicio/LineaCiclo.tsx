import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { FechaISO } from '../tipos/tipos';
import { Texto, useTema } from '../diseno';
import { numeroDe } from '../motor/fechas';
import { usePais } from '../paises';
import { fechaMesCorto, type Traducir } from './vista';

interface Props {
  anterior: FechaISO;
  hoy: FechaISO;
  corte: FechaISO;
  pago: FechaISO;
  // Completa (detalle): del último corte a la fecha de pago, con los 4 hitos.
  // Compacta (tarjeta de hoy): del último corte al próximo, con "Cortó" y "Corta".
  completa?: boolean;
  sobreDestacado?: boolean;
}

// Línea del ciclo compartida por la tarjeta de hoy y el detalle.
export function LineaCiclo({ anterior, hoy, corte, pago, completa = false, sobreDestacado = false }: Props) {
  const tema = useTema();
  const { t } = useTranslation();
  const { idioma } = usePais();
  const corta = (fecha: FechaISO) => fechaMesCorto(fecha, idioma, t as unknown as Traducir);

  const inicio = numeroDe(anterior);
  const fin = numeroDe(completa ? pago : corte);
  const fraccion = (fecha: FechaISO) => Math.min(1, Math.max(0, (numeroDe(fecha) - inicio) / Math.max(1, fin - inicio)));
  const posicion = (fecha: FechaISO) => `${Math.round(fraccion(fecha) * 100)}%` as const;

  const trazo = sobreDestacado ? tema.color.sobreDestacado : tema.color.primario;
  const fondoPunto = sobreDestacado ? tema.color.destacado : tema.color.superficie;
  const pista = sobreDestacado ? { backgroundColor: tema.color.sobreDestacado, opacity: tema.modo === 'oscuro' ? 0.15 : 0.22 } : { backgroundColor: tema.color.neutroFondo };
  const secundario = sobreDestacado ? 'sobreDestacado' : 'textoSecundario';
  const principal = sobreDestacado ? 'sobreDestacado' : 'texto';

  const hito = (etiqueta: string, fecha: FechaISO, alineacion: 'left' | 'center' | 'right') => (
    <View style={{ flex: 1 }}>
      <Texto variante="etiqueta" color={secundario} style={{ fontFamily: tema.texto.apoyo.fontFamily, textAlign: alineacion }}>
        {etiqueta}
      </Texto>
      <Texto variante="etiqueta" color={principal} style={{ textAlign: alineacion }}>
        {corta(fecha)}
      </Texto>
    </View>
  );

  return (
    <View style={{ gap: tema.espacio.s }}>
      <View style={{ height: 20, marginHorizontal: 6 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={[{ position: 'absolute', left: 0, right: 0, top: 8, height: 4, borderRadius: 2 }, pista]} />
        <View style={{ position: 'absolute', left: 0, width: posicion(hoy), top: 8, height: 4, borderRadius: 2, backgroundColor: trazo }} />
        <View style={{ position: 'absolute', left: -6, top: 4, width: 12, height: 12, borderRadius: 6, backgroundColor: trazo }} />
        {completa ? (
          <View style={{ position: 'absolute', left: posicion(corte), marginLeft: -6, top: 4, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: trazo, backgroundColor: fondoPunto }} />
        ) : null}
        <View
          style={[
            { position: 'absolute', right: -6, top: 4, width: 12, height: 12, borderRadius: 6 },
            completa ? { backgroundColor: tema.color.recompensaPunto } : { borderWidth: 2, borderColor: trazo, backgroundColor: fondoPunto },
          ]}
        />
        <View style={{ position: 'absolute', left: posicion(hoy), marginLeft: -9, top: 1, width: 18, height: 18, borderRadius: 9, borderWidth: 4, borderColor: trazo, backgroundColor: fondoPunto }} />
      </View>
      <View style={{ flexDirection: 'row', gap: tema.espacio.xs }}>
        {hito(t('detalle.hitoCorto'), anterior, 'left')}
        {completa ? hito(t('detalle.hitoHoy'), hoy, 'center') : null}
        {hito(t('detalle.hitoCorta'), corte, completa ? 'center' : 'right')}
        {completa ? hito(t('detalle.hitoPagas'), pago, 'right') : null}
      </View>
    </View>
  );
}
