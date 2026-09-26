import { useTranslation } from 'react-i18next';
import type { OrdenVista } from '../motor';
import { ControlSegmentado } from '../diseno';

// Barra de orden como control segmentado (rediseño): reordena la vista sin cambiar el
// enfoque guardado (sección 3.1).
export function BarraOrden({ valor, onCambio }: { valor: OrdenVista; onCambio: (orden: OrdenVista) => void }) {
  const { t } = useTranslation();
  return (
    <ControlSegmentado
      etiqueta={t('inicio.ordenEtiqueta')}
      valor={valor}
      onCambio={onCambio}
      opciones={[
        { valor: 'recomendado', etiqueta: t('orden.recomendado') },
        { valor: 'mas_dias', etiqueta: t('orden.masDias') },
        { valor: 'mas_puntos', etiqueta: t('orden.masPuntos') },
        { valor: 'mas_cashback', etiqueta: t('orden.masCashback') },
      ]}
    />
  );
}
