import { View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BarraSuperior, Boton, FilaLista, ListaAgrupada, Pantalla, Texto, useTema } from '@/diseno';
import { usePais } from '@/paises';
import { useAlmacen } from '@/estado';
import { useHoy } from '@/inicio/useHoy';
import { fechaCorta, type Traducir as TraducirVista } from '@/inicio/vista';
import { proximosCobros, resumenFrecuencia, type Traducir } from '@/ingresos/borrador';

// Tus cobros (sección 5): lista de fuentes de ingreso con su próximo cobro.
export default function Cobros() {
  const { t } = useTranslation();
  const tema = useTema();
  const router = useRouter();
  const hoy = useHoy();
  const { config, idioma } = usePais();
  const ingresos = useAlmacen(s => s.ingresos);
  const corta = (fecha: string) => fechaCorta(fecha, idioma, t as unknown as TraducirVista);

  return (
    <Pantalla
      arriba={<BarraSuperior izquierda={{ tipo: 'atras', onPress: () => router.back() }} titulo={t('cobros.titulo')} />}
      pie={<Boton titulo={ingresos.length ? t('cobros.agregarOtro') : t('cobros.agregar')} icono="mas" onPress={() => router.push('/cobros/nuevo')} />}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <Texto color="textoSecundario">{t('cobros.explicacion')}</Texto>
      {ingresos.length ? (
        <ListaAgrupada>
          {ingresos.map(ingreso => {
            const [proximo] = proximosCobros([ingreso], hoy, config, 1);
            return (
              <FilaLista
                key={ingreso.id}
                icono="calendario"
                titulo={ingreso.nombre}
                detalle={[resumenFrecuencia(ingreso.frecuencia, t as unknown as Traducir), proximo ? t('cobros.proximo', { fecha: corta(proximo.fecha) }) : null].filter(Boolean).join(' · ')}
                flecha
                onPress={() => router.push({ pathname: '/cobros/[id]', params: { id: ingreso.id } })}
              />
            );
          })}
        </ListaAgrupada>
      ) : (
        <View style={{ gap: tema.espacio.s }}>
          <Texto variante="apoyo" color="textoSecundario">
            {t('cobros.vacio')}
          </Texto>
        </View>
      )}
    </Pantalla>
  );
}
