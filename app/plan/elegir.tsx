import { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BarraSuperior, Boton, FilaLista, ListaAgrupada, Pantalla, Texto } from '@/diseno';
import { useAlmacen } from '@/estado';
import { useCatalogo } from '@/catalogo';
import { buscarEmisor } from '@/registro/borrador';
import { inicialesBanco } from '@/inicio/vista';
import { LIMITE_GRATIS, useTarjetasEnPlan } from '@/suscripciones';
import { useVolver } from '@/utilidades/useVolver';

// Sección 15.2: al vencer Pro, el usuario elige qué 2 tarjetas siguen activas. Nada se borra:
// las demás quedan guardadas y vuelven si renueva.
export default function ElegirTarjetas() {
  const { t } = useTranslation();
  const router = useRouter();
  const volver = useVolver();
  const catalogo = useCatalogo();
  const tarjetas = useAlmacen(s => s.tarjetas);
  const preferencias = useAlmacen(s => s.preferencias);
  const guardarPreferencias = useAlmacen(s => s.guardarPreferencias);
  const actuales = useTarjetasEnPlan();
  const [elegidas, setElegidas] = useState<string[]>(() => actuales.map(x => x.id));

  function alternar(id: string) {
    setElegidas(e => (e.includes(id) ? e.filter(x => x !== id) : e.length < LIMITE_GRATIS ? [...e, id] : e));
  }

  async function guardar() {
    if (preferencias) await guardarPreferencias({ ...preferencias, tarjetasDelPlan: elegidas });
    volver();
  }

  const completas = elegidas.length === Math.min(LIMITE_GRATIS, tarjetas.length);
  return (
    <Pantalla
      arriba={<BarraSuperior cerrar={volver} />}
      pie={
        <>
          <Boton titulo={t('plan.elegirGuardar')} onPress={guardar} deshabilitado={!completas} />
          <Boton titulo={t('plan.renovar')} variante="texto" onPress={() => router.push({ pathname: '/pro', params: { motivo: 'voluntario' } })} />
        </>
      }
    >
      <Stack.Screen options={{ headerShown: false }} />
      <Texto variante="titulo" accessibilityRole="header">
        {t('plan.elegirTitulo')}
      </Texto>
      <Texto color="textoSecundario">{t('plan.elegirTexto')}</Texto>
      <Texto variante="apoyo" color="textoSecundario" accessibilityLiveRegion="polite">
        {t('plan.elegidasN', { n: elegidas.length })}
      </Texto>
      <ListaAgrupada sangria={70}>
        {tarjetas.map(tarjeta => {
          const banco = buscarEmisor(catalogo, tarjeta.emisorId)?.nombreCorto ?? tarjeta.emisorTextoLibre ?? '';
          return (
            <FilaLista
              key={tarjeta.id}
              iniciales={inicialesBanco(banco) || tarjeta.alias.slice(0, 2).toUpperCase()}
              titulo={tarjeta.alias}
              detalle={banco || undefined}
              seleccionada={elegidas.includes(tarjeta.id)}
              onPress={() => alternar(tarjeta.id)}
            />
          );
        })}
      </ListaAgrupada>
    </Pantalla>
  );
}
