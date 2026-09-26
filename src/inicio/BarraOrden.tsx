import { Pressable, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { OrdenVista } from '../motor';
import { Texto, useTema } from '../diseno';

const ORDENES: { valor: OrdenVista; clave: string }[] = [
  { valor: 'recomendado', clave: 'orden.recomendado' },
  { valor: 'mas_dias', clave: 'orden.masDias' },
  { valor: 'mas_puntos', clave: 'orden.masPuntos' },
  { valor: 'mas_cashback', clave: 'orden.masCashback' },
];

// Chips de un toque con desplazamiento horizontal (sección 3.1): reordenan la vista sin
// cambiar el enfoque guardado.
export function BarraOrden({ valor, onCambio }: { valor: OrdenVista; onCambio: (orden: OrdenVista) => void }) {
  const tema = useTema();
  const { t } = useTranslation();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="radiogroup"
      accessibilityLabel={t('inicio.ordenEtiqueta')}
      contentContainerStyle={{ gap: tema.espacio.s }}
    >
      {ORDENES.map(o => {
        const activa = o.valor === valor;
        return (
          <Pressable
            key={o.valor}
            accessibilityRole="radio"
            accessibilityState={{ selected: activa }}
            onPress={() => onCambio(o.valor)}
            style={{
              minHeight: tema.toqueMinimo,
              justifyContent: 'center',
              paddingHorizontal: tema.espacio.m,
              borderRadius: tema.radio.chip,
              borderWidth: 1,
              borderColor: activa ? tema.color.primario : tema.color.borde,
              backgroundColor: activa ? tema.color.primario : tema.color.superficie,
            }}
          >
            <Texto variante={activa ? 'cuerpoFuerte' : 'apoyo'} color={activa ? 'sobrePrimario' : 'texto'}>
              {t(o.clave)}
            </Texto>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
