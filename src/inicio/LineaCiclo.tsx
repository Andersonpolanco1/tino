import { useState } from 'react';
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

  // Compacta: proporcional al tiempo, porque solo tiene las etiquetas de los extremos.
  // Completa: cada punto va justo encima de su etiqueta (4 columnas iguales) y la línea se llena
  // hasta "Hoy"; el orden siempre es Cortó ≤ Hoy ≤ Corta < Pagas.
  const inicio = numeroDe(anterior);
  const fin = numeroDe(corte);
  const proporcional = Math.min(1, Math.max(0, (numeroDe(hoy) - inicio) / Math.max(1, fin - inicio)));
  // Centro de cada punto en píxeles: los extremos a 6 del borde (la mitad del punto) y, en la
  // completa, Hoy y Corta en el centro de su columna (3/8 y 5/8 del ancho).
  const [ancho, setAncho] = useState(0);
  const x = (fraccion: number) => 6 + fraccion * (ancho - 12);
  const xHoy = completa ? (3 / 8) * ancho : x(proporcional);
  const xCorte = (5 / 8) * ancho;

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
      <View style={{ height: 20 }} onLayout={e => setAncho(e.nativeEvent.layout.width)} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={[{ position: 'absolute', left: 6, right: 6, top: 8, height: 4, borderRadius: 2 }, pista]} />
        <View style={{ position: 'absolute', left: 6, width: Math.max(0, xHoy - 6), top: 8, height: 4, borderRadius: 2, backgroundColor: trazo }} />
        <View style={{ position: 'absolute', left: 0, top: 4, width: 12, height: 12, borderRadius: 6, backgroundColor: trazo }} />
        {completa && ancho > 0 ? (
          <View style={{ position: 'absolute', left: xCorte - 6, top: 4, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: trazo, backgroundColor: fondoPunto }} />
        ) : null}
        <View
          style={[
            { position: 'absolute', right: 0, top: 4, width: 12, height: 12, borderRadius: 6 },
            completa ? { backgroundColor: tema.color.recompensaPunto } : { borderWidth: 2, borderColor: trazo, backgroundColor: fondoPunto },
          ]}
        />
        {/* Hasta medir el ancho no se sabe dónde va hoy. */}
        {ancho > 0 ? (
          <View style={{ position: 'absolute', left: xHoy - 9, top: 1, width: 18, height: 18, borderRadius: 9, borderWidth: 4, borderColor: trazo, backgroundColor: fondoPunto }} />
        ) : null}
      </View>
      <View style={{ flexDirection: 'row' }}>
        {hito(t('detalle.hitoCorto'), anterior, 'left')}
        {completa ? hito(t('detalle.hitoHoy'), hoy, 'center') : null}
        {hito(t('detalle.hitoCorta'), corte, completa ? 'center' : 'right')}
        {completa ? hito(t('detalle.hitoPagas'), pago, 'right') : null}
      </View>
    </View>
  );
}
