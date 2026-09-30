import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BarraSuperior, Boton, FilaLista, ListaAgrupada, Pantalla, Texto } from '@/diseno';
import { usePermisoAvisos } from '@/notificaciones/usePermisoAvisos';
import { useAlmacen } from '@/estado';
import { registrarOnboardingCompletado } from '@/analitica';

// Onboarding, penúltimo paso: el permiso de avisos se pide al final, explicando para qué sirve
// (sección 13.1 de la especificación y 6 técnica).
export default function AvisosOnboarding() {
  const { t } = useTranslation();
  const router = useRouter();
  const { pedir } = usePermisoAvisos();
  const tarjetas = useAlmacen(s => s.tarjetas.length);
  const hayIngresos = useAlmacen(s => s.ingresos.length > 0);
  // Aquí termina el registro (17.4). Queda la pregunta de los datos de uso (D88): el evento espera
  // en memoria esa respuesta y solo sale si el usuario dice que sí.
  const terminar = () => {
    registrarOnboardingCompletado({ tarjetas, hayIngresos });
    router.push('/onboarding/datos-de-uso');
  };
  return (
    <Pantalla
      arriba={<BarraSuperior izquierda={{ tipo: 'atras', onPress: () => router.back() }} />}
      pie={
        <>
          <Boton
            titulo={t('onboarding.activarAvisos')}
            onPress={async () => {
              await pedir();
              terminar();
            }}
          />
          <Boton titulo={t('onboarding.ahoraNo')} variante="texto" onPress={terminar} />
        </>
      }
    >
      <Texto variante="titulo" accessibilityRole="header">
        {t('onboarding.avisosTitulo')}
      </Texto>
      <Texto color="textoSecundario">{t('onboarding.avisosTexto')}</Texto>
      <ListaAgrupada sangria={16}>
        <FilaLista icono="calendario" titulo={t('ajustes.avisoFechaLimite')} detalle={t('ajustes.avisoFechaLimiteDetalle')} />
        <FilaLista icono="reloj" titulo={t('ajustes.avisoVenceAntes')} detalle={t('ajustes.avisoVenceAntesDetalle')} />
        <FilaLista icono="tarjetas" titulo={t('ajustes.avisoCambio')} detalle={t('ajustes.avisoCambioDetalle')} />
      </ListaAgrupada>
    </Pantalla>
  );
}
