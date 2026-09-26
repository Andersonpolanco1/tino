import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Texto, useTema } from '../diseno';

// Días para pagar en grande con la fecha de pago al lado. Igual en la tarjeta de hoy y en el
// detalle, para que se lean de la misma forma.
// Sin fechaPago solo muestra los días (en la tarjeta de hoy la fecha va en la línea del ciclo).
export function BloqueDias({ dias, fechaPago, sobreDestacado = false }: { dias: number; fechaPago?: string; sobreDestacado?: boolean }) {
  const tema = useTema();
  const { t } = useTranslation();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: tema.espacio.m }}>
      <Texto variante="cifraGrande" color={sobreDestacado ? 'sobreDestacado' : 'texto'} style={{ fontSize: 64, lineHeight: 66, letterSpacing: -1.5 }}>
        {dias}
      </Texto>
      <View style={{ flex: 1 }}>
        <Texto variante="cuerpoFuerte" color={sobreDestacado ? 'sobreDestacado' : 'texto'} style={{ fontSize: 17 }}>
          {t('inicio.diasParaPagar')}
        </Texto>
        {fechaPago ? (
          <Texto variante="apoyo" color={sobreDestacado ? 'sobreDestacado' : 'textoSecundario'}>
            {t('inicio.sePagaEl', { fecha: fechaPago })}
          </Texto>
        ) : null}
      </View>
    </View>
  );
}
