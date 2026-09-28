import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as Linking from 'expo-linking';
import { Asset } from 'expo-asset';
import { guardarLogos, guardarResumen, widgetDisponible, widgetsInstalados } from '../../modules/widget-android';
import { logoEmisor, useCatalogo } from '../catalogo';
import { useAlmacen } from '../estado';
import { usePais } from '../paises';
import { useHoy } from '../inicio/useHoy';
import type { Traducir } from '../inicio/vista';
import { useTarjetasEnPlan } from '../suscripciones/useSuscripcion';
import { registrarWidgetVisto } from '../analitica';
import type { FechaISO } from '../tipos/tipos';
import { logosDelResumen, planificarWidget } from './resumen';

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

// Archivo local de cada logo que usa el widget: el incluido en la app o, si el catálogo nombra
// uno que la app no trae, el del servidor (D63). Uno que no carga queda fuera y el widget
// muestra las iniciales.
async function prepararLogos(archivos: string[]): Promise<Record<string, string>> {
  const rutas: Record<string, string> = {};
  for (const archivo of archivos) {
    const fuente = logoEmisor({ logo: archivo });
    if (!fuente) continue;
    try {
      const asset = typeof fuente === 'number' ? Asset.fromModule(fuente) : Asset.fromURI((fuente as { uri: string }).uri);
      await asset.downloadAsync();
      if (asset.localUri) rutas[archivo] = asset.localUri;
    } catch {
      // Sin ese logo, las iniciales.
    }
  }
  return rutas;
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
  const catalogo = useCatalogo();
  const url = Linking.useLinkingURL();

  useEffect(() => {
    if (!preferencias || !widgetDisponible()) return;
    // Espera un momento para agrupar cambios seguidos, como los avisos.
    let vigente = true;
    const espera = setTimeout(async () => {
      const enlace = Linking.createURL('inicio', { queryParams: { origen: ORIGEN_WIDGET } });
      const resumen = planificarWidget({ hoy, tarjetas, ingresos, preferencias, pais: config, catalogo, t: t as unknown as Traducir, idioma, enlace });
      // Solo los logos de los bancos de las tarjetas del usuario, antes del resumen que los usa.
      const rutas = await prepararLogos(logosDelResumen(resumen));
      if (!vigente) return;
      guardarLogos(rutas);
      guardarResumen(JSON.stringify(resumen));
    }, 1000);
    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [hoy, tarjetas, ingresos, preferencias, config, catalogo, idioma, t]);

  useEffect(() => {
    if (!widgetDisponible()) return;
    if (abiertoDesdeWidget(url) || widgetsInstalados() > 0) registrarVisto(hoy);
  }, [url, hoy]);
}
