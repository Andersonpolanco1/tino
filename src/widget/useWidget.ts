import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as Linking from 'expo-linking';
import { guardarResumen, widgetDisponible, widgetsInstalados } from '../../modules/widget-android';
import { useAlmacen } from '../estado';
import { usePais } from '../paises';
import { useHoy } from '../inicio/useHoy';
import type { Traducir } from '../inicio/vista';
import { useTarjetasEnPlan } from '../suscripciones/useSuscripcion';
import { registrarWidgetVisto } from '../analitica';
import type { FechaISO } from '../tipos/tipos';
import { planificarWidget } from './resumen';

// Parámetro con el que el widget abre Inicio, para contar el toque.
export const ORIGEN_WIDGET = 'widget';

export function abiertoDesdeWidget(url: string | null): boolean {
  return !!url && new RegExp(`[?&]origen=${ORIGEN_WIDGET}(&|$)`).test(url);
}

// widget_visto (sección 10 técnica) sale como máximo una vez al día por sesión: al abrir la app
// desde el widget o al ver que hay uno en la pantalla (decisión D71).
let diaRegistrado: FechaISO | null = null;
function registrarVisto(hoy: FechaISO) {
  if (diaRegistrado === hoy) return;
  diaRegistrado = hoy;
  registrarWidgetVisto('android');
}

// Reescribe el resumen del widget cada vez que cambian las tarjetas, los cobros, las
// preferencias (incluido el enfoque), el país o el día. Va en el layout raíz; no dibuja nada.
export function useWidget() {
  const { t } = useTranslation();
  const { config, idioma } = usePais();
  const hoy = useHoy();
  // Las tarjetas fuera del plan gratis no salen en el widget, igual que en Inicio (15.2).
  const tarjetas = useTarjetasEnPlan();
  const ingresos = useAlmacen(s => s.ingresos);
  const preferencias = useAlmacen(s => s.preferencias);
  const url = Linking.useLinkingURL();

  useEffect(() => {
    if (!preferencias || !widgetDisponible()) return;
    // Espera un momento para agrupar cambios seguidos, como los avisos.
    const espera = setTimeout(() => {
      const enlace = Linking.createURL('inicio', { queryParams: { origen: ORIGEN_WIDGET } });
      const resumen = planificarWidget({ hoy, tarjetas, ingresos, preferencias, pais: config, t: t as unknown as Traducir, idioma, enlace });
      guardarResumen(JSON.stringify(resumen));
    }, 1000);
    return () => clearTimeout(espera);
  }, [hoy, tarjetas, ingresos, preferencias, config, idioma, t]);

  useEffect(() => {
    if (!widgetDisponible()) return;
    if (abiertoDesdeWidget(url) || widgetsInstalados() > 0) registrarVisto(hoy);
  }, [url, hoy]);
}
