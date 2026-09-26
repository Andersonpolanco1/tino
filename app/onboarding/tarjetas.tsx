import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BarraSuperior, Boton, FilaLista, ListaAgrupada, Pantalla, Texto } from '@/diseno';
import { useAlmacen } from '@/estado';

// Onboarding, paso 2: registrar tarjetas, unos 30 segundos cada una.
export default function TarjetasOnboarding() {
  const { t } = useTranslation();
  const router = useRouter();
  const tarjetas = useAlmacen(s => s.tarjetas);
  return (
    <Pantalla
      arriba={<BarraSuperior izquierda={{ tipo: 'atras', onPress: () => router.back() }} />}
      pie={tarjetas.length ? <Boton titulo={t('onboarding.continuar')} onPress={() => router.push('/onboarding/enfoque')} /> : undefined}
    >
      <Texto variante="titulo" accessibilityRole="header">
        {t('onboarding.tarjetasTitulo')}
      </Texto>
      <Texto color="textoSecundario">{t('onboarding.tarjetasTexto')}</Texto>
      {tarjetas.length ? (
        <ListaAgrupada sangria={16}>
          {tarjetas.map(tarjeta => (
            <FilaLista key={tarjeta.id} titulo={tarjeta.alias} />
          ))}
        </ListaAgrupada>
      ) : null}
      <Boton
        titulo={tarjetas.length ? t('onboarding.agregarOtra') : t('onboarding.agregarPrimera')}
        variante={tarjetas.length ? 'secundario' : 'primario'}
        icono="mas"
        onPress={() => router.push('/tarjeta/nueva')}
      />
    </Pantalla>
  );
}
