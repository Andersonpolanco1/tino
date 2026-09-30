import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Boton, Opciones, Pantalla, Superficie, Texto, useTema } from '@/diseno';
import { nombrePais, usePais } from '@/paises';
import { useAlmacen, useElegirPais } from '@/estado';
import { useEstadoDatos } from '@/datos';
import { marcarInicioOnboarding } from '@/analitica';
import { borrarRespaldoAutomatico, leerRespaldoAutomatico } from '@/respaldo/automatico';
import { reemplazarDatos, type ContenidoRespaldo } from '@/respaldo/contenido';
import { formatearFecha } from '@/i18n/formato';
import { useHoy } from '@/inicio/useHoy';
import { aceptarTerminos, conservarAceptacion } from '@/privacidad/terminos';
import { LineaAceptacion } from '@/privacidad/LineaAceptacion';

// Onboarding, paso 1: bienvenida (sección 13.1 de la especificación) y confirmación del país.
// Si el respaldo del teléfono trajo la copia automática de Tino (decisión D81), primero ofrece
// restaurarla. Continuar, por cualquiera de los caminos, acepta los términos (D88).
export default function Bienvenida() {
  const { t } = useTranslation();
  const tema = useTema();
  const router = useRouter();
  const { config, opciones, idioma } = usePais();
  const elegirPais = useElegirPais();
  const datos = useEstadoDatos();
  const cargar = useAlmacen(s => s.cargar);
  const preferencias = useAlmacen(s => s.preferencias);
  const guardarPreferencias = useAlmacen(s => s.guardarPreferencias);
  const hoy = useHoy();
  const [copia, setCopia] = useState<ContenidoRespaldo | null>(null);
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => marcarInicioOnboarding(), []);
  useEffect(() => {
    let vigente = true;
    leerRespaldoAutomatico().then(c => {
      if (vigente && c?.tarjetas.length) setCopia(c);
    });
    return () => {
      vigente = false;
    };
  }, []);

  async function aceptar() {
    if (!preferencias) return null;
    const aceptadas = aceptarTerminos(preferencias, hoy);
    await guardarPreferencias(aceptadas);
    return aceptadas;
  }

  async function restaurar() {
    if (!copia || datos.estado !== 'lista') return;
    setOcupado(true);
    try {
      const aceptadas = await aceptar();
      const contenido = copia.preferencias ? { ...copia, preferencias: conservarAceptacion(copia.preferencias, aceptadas) } : copia;
      await reemplazarDatos(datos.base.transaccion, contenido, new Date().toISOString());
      await cargar();
      router.replace('/inicio');
    } catch {
      Alert.alert(t('onboarding.copiaError'), t('comun.intentaDeNuevo'));
      setOcupado(false);
    }
  }

  async function empezarDeCero() {
    await borrarRespaldoAutomatico();
    setCopia(null);
  }

  return (
    <Pantalla
      pie={
        copia ? undefined : (
          <>
            <Boton
              titulo={t('onboarding.empezar')}
              onPress={async () => {
                await aceptar();
                router.push('/onboarding/tarjetas');
              }}
            />
            <LineaAceptacion />
          </>
        )
      }
    >
      <Texto variante="titulo" accessibilityRole="header" style={{ fontSize: 34, lineHeight: 40, letterSpacing: -0.6 }}>
        {t('onboarding.bienvenidaTitulo')}
      </Texto>
      {copia ? (
        <Superficie radio={tema.radio.destacada} style={{ padding: 20, gap: tema.espacio.m }}>
          <Texto variante="subtitulo" accessibilityRole="header">
            {t('onboarding.copiaTitulo')}
          </Texto>
          <Texto>{t('onboarding.copiaTexto', { count: copia.tarjetas.length, fecha: formatearFecha(copia.creadoEn.slice(0, 10), idioma) })}</Texto>
          <View style={{ gap: tema.espacio.s }}>
            <Boton titulo={t('onboarding.copiaRestaurar')} onPress={restaurar} deshabilitado={ocupado} />
            <Boton titulo={t('onboarding.copiaEmpezar')} variante="texto" onPress={empezarDeCero} deshabilitado={ocupado} />
          </View>
          <LineaAceptacion />
        </Superficie>
      ) : (
        <>
          <Texto>{t('onboarding.bienvenidaTexto')}</Texto>
          {opciones.length > 1 ? (
            <Opciones
              etiqueta={t('onboarding.dondeVives')}
              info={t('onboarding.dondeVivesAyuda')}
              opciones={opciones.map(codigo => ({ valor: codigo, etiqueta: nombrePais(t, codigo) }))}
              valor={config.codigo}
              onCambio={elegirPais}
            />
          ) : null}
          <Texto variante="apoyo" color="textoSecundario">
            {t('onboarding.privacidad')}
          </Texto>
          {/* Quien ya usaba Tino en otro teléfono recupera todo con su respaldo (D62). */}
          <Boton
            titulo={t('onboarding.restaurar')}
            variante="texto"
            onPress={async () => {
              await aceptar();
              router.push('/respaldo/restaurar');
            }}
          />
        </>
      )}
    </Pantalla>
  );
}
