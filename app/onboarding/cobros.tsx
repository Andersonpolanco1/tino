import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BarraSuperior, Boton, FilaLista, ListaAgrupada, Pantalla, Texto } from '@/diseno';
import { useAlmacen } from '@/estado';
import { resumenFrecuencia, type Traducir } from '@/ingresos/borrador';

// Onboarding, paso 4 (luego vienen los avisos): fechas de cobro, opcionales y con "Omitir" visible (sección 13.1).
export default function CobrosOnboarding() {
  const { t } = useTranslation();
  const router = useRouter();
  const ingresos = useAlmacen(s => s.ingresos);
  const terminar = () => router.push('/onboarding/avisos');
  return (
    <Pantalla
      arriba={<BarraSuperior izquierda={{ tipo: 'atras', onPress: () => router.back() }} />}
      pie={
        ingresos.length ? (
          <Boton titulo={t('onboarding.continuar')} onPress={terminar} />
        ) : (
          <Boton titulo={t('onboarding.omitir')} variante="texto" onPress={terminar} />
        )
      }
    >
      <Texto variante="titulo" accessibilityRole="header">
        {t('onboarding.cobrosTitulo')}
      </Texto>
      <Texto color="textoSecundario">{t('onboarding.cobrosTexto')}</Texto>
      {ingresos.length ? (
        <ListaAgrupada sangria={16}>
          {ingresos.map(ingreso => (
            <FilaLista key={ingreso.id} titulo={ingreso.nombre} detalle={resumenFrecuencia(ingreso.frecuencia, t as unknown as Traducir)} />
          ))}
        </ListaAgrupada>
      ) : null}
      <Boton
        titulo={ingresos.length ? t('cobros.agregarOtro') : t('cobros.agregar')}
        variante={ingresos.length ? 'secundario' : 'primario'}
        icono="mas"
        onPress={() => router.push('/cobros/nuevo')}
      />
    </Pantalla>
  );
}
