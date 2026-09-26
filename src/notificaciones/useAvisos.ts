import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePais } from '../paises';
import { useAlmacen } from '../estado';
import { useHoy } from '../inicio/useHoy';
import type { Traducir } from '../inicio/vista';
import { planificarAvisos } from './planificar';
import { programarAvisos } from './programar';

// Vuelve a programar los avisos cada vez que cambian las tarjetas, los cobros, las
// preferencias o el día. Va en el layout raíz, una sola vez.
export function useAvisos() {
  const { t } = useTranslation();
  const { config, idioma } = usePais();
  const hoy = useHoy();
  const tarjetas = useAlmacen(s => s.tarjetas);
  const ingresos = useAlmacen(s => s.ingresos);
  const preferencias = useAlmacen(s => s.preferencias);

  useEffect(() => {
    if (!preferencias) return;
    // Espera un momento para agrupar cambios seguidos (por ejemplo, al registrar varias tarjetas).
    const espera = setTimeout(() => {
      const avisos = planificarAvisos({ hoy, tarjetas, ingresos, preferencias, pais: config, t: t as unknown as Traducir, idioma });
      programarAvisos(avisos, t('avisos.canal')).catch(() => {
        // Sin permiso o sin servicio de avisos, la app sigue igual.
      });
    }, 1000);
    return () => clearTimeout(espera);
  }, [hoy, tarjetas, ingresos, preferencias, config, idioma, t]);
}
