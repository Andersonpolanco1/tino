import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { FechaISO } from '../tipos/tipos';
import { Texto, useTema } from '../diseno';
import { usePais } from '../paises';
import { fechaMesCorto, type Traducir } from './vista';

interface Props {
  anterior: FechaISO;
  hoy: FechaISO;
  corte: FechaISO;
  pago: FechaISO;
  sobreDestacado?: boolean;
}

// Línea del ciclo compartida por la tarjeta de hoy y el detalle: Cortó, Hoy, Corta y Pagas.
// Cada punto va encima de su etiqueta (4 columnas iguales) y la línea se llena hasta Hoy;
// el orden siempre es Cortó ≤ Hoy ≤ Corta < Pagas (decisión D35).
export function LineaCiclo({ anterior, hoy, corte, pago, sobreDestacado = false }: Props) {
  const tema = useTema();
  const { t } = useTranslation();
  const { idioma } = usePais();
  const corta = (fecha: FechaISO) => fechaMesCorto(fecha, idioma, t as unknown as Traducir);

  // Centro de cada punto en píxeles: los extremos a 6 del borde (la mitad del punto); Hoy y
  // Corta en el centro de su columna (3/8 y 5/8 del ancho).
  const [ancho, setAncho] = useState(0);
  const xHoy = (3 / 8) * ancho;
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
        {ancho > 0 ? (
          <View style={{ position: 'absolute', left: xCorte - 6, top: 4, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: trazo, backgroundColor: fondoPunto }} />
        ) : null}
        <View
          style={[
            { position: 'absolute', right: 0, top: 4, width: 12, height: 12, borderRadius: 6 },
            { backgroundColor: tema.color.recompensaPunto },
          ]}
        />
        {/* Hasta medir el ancho no se sabe dónde va hoy. */}
        {ancho > 0 ? (
          <View style={{ position: 'absolute', left: xHoy - 9, top: 1, width: 18, height: 18, borderRadius: 9, borderWidth: 4, borderColor: trazo, backgroundColor: fondoPunto }} />
        ) : null}
      </View>
      <View style={{ flexDirection: 'row' }}>
        {hito(t('detalle.hitoCorto'), anterior, 'left')}
        {hito(t('detalle.hitoHoy'), hoy, 'center')}
        {hito(t('detalle.hitoCorta'), corte, 'center')}
        {hito(t('detalle.hitoPagas'), pago, 'right')}
      </View>
    </View>
  );
}
