import { useState } from 'react';
import { Linking, View } from 'react-native';
import * as Application from 'expo-application';
import Svg, { Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FilaLista, Hoja, LogoTino, ListaAgrupada, Pantalla, Superficie, Texto, useTema } from '@/diseno';
import type { TemaApp } from '@/tipos/tipos';
import { AVISOS_PREDETERMINADOS } from '@/notificaciones/planificar';
import { usePermisoAvisos } from '@/notificaciones/usePermisoAvisos';
import { nombrePais, usePais } from '@/paises';
import { useAlmacen, useElegirPais } from '@/estado';
import { pistaPrecision, precisionGeneral } from '@/inicio/precision';
import { HojaEnfoque } from '@/inicio/SelectorEnfoque';
import { valorPuntoPorConfirmar } from '@/inicio/ConfirmarValorPunto';
import { useComprasPro } from '@/suscripciones';
import { useEstadoRespaldoAutomatico } from '@/respaldo/automatico';
import { detalleRespaldoAutomatico } from '@/respaldo/detalle';

// Anillo de 84: con 100% el número necesita aire dentro del trazo.
const LADO_ANILLO = 84;
const GROSOR_ANILLO = 7;
const RADIO_ANILLO = (LADO_ANILLO - GROSOR_ANILLO) / 2;

const TEMAS: TemaApp[] = ['automatico', 'claro', 'oscuro'];
const CIRCUNFERENCIA = 2 * Math.PI * RADIO_ANILLO;

// Ajustes con el rediseño: precisión en un anillo y listas agrupadas.
export default function Ajustes() {
  const { t } = useTranslation();
  const tema = useTema();
  const router = useRouter();
  const { config, opciones, idioma } = usePais();
  const elegirPais = useElegirPais();
  const tarjetas = useAlmacen(s => s.tarjetas);
  const ingresos = useAlmacen(s => s.ingresos);
  const preferencias = useAlmacen(s => s.preferencias);
  const respaldo = useEstadoRespaldoAutomatico();
  const guardarPreferencias = useAlmacen(s => s.guardarPreferencias);
  const permiso = usePermisoAvisos();
  const compras = useComprasPro();
  const [hojaPais, setHojaPais] = useState(false);
  const [hojaEnfoque, setHojaEnfoque] = useState(false);
  const [hojaApariencia, setHojaApariencia] = useState(false);
  const porConfirmar = tarjetas.filter(valorPuntoPorConfirmar);
  const contextoPrecision = { hayIngresos: ingresos.length > 0, catalogoDisponible: config.catalogoDisponible };
  const precision = precisionGeneral(tarjetas, contextoPrecision);
  const pista = pistaPrecision(tarjetas, contextoPrecision);
  const avisos = { ...AVISOS_PREDETERMINADOS, ...preferencias?.avisos };
  const totalAvisos = Object.keys(AVISOS_PREDETERMINADOS).length;
  const avisosActivos = Object.values(avisos).filter(Boolean).length;
  // Mientras se consulta el permiso (null) no se alarma: casi siempre ya está concedido.
  const avisosSinPermiso = permiso.estado === 'negado' || permiso.estado === 'sin_preguntar';
  const textoPista = pista === 'punto' ? t('ajustes.precisionPistaPunto', { count: porConfirmar.length }) : t(`ajustes.precisionPista.${pista}`);
  // Decisión D82: lo que falta para subir la precisión va en filas dentro del mismo bloque, cada
  // una lleva al lugar donde se completa.
  const filasPista =
    pista === 'punto'
      ? porConfirmar.map(tarjeta => (
          <FilaLista
            key={tarjeta.id}
            icono="moneda"
            tono="recompensa"
            titulo={tarjeta.alias}
            detalle={t('ajustes.confirmarPunto')}
            flecha
            onPress={() => router.push({ pathname: '/tarjeta/[id]', params: { id: tarjeta.id } })}
          />
        ))
      : pista === 'cobros'
        ? [<FilaLista key="cobros" icono="calendario" titulo={t('ajustes.agregarCobros')} flecha onPress={() => router.push('/cobros/nuevo')} />]
        : pista === 'producto'
          ? tarjetas
              .filter(tarjeta => tarjeta.productoId === null)
              .map(tarjeta => (
                <FilaLista
                  key={tarjeta.id}
                  icono="tarjetas"
                  titulo={tarjeta.alias}
                  detalle={t('ajustes.elegirTipo')}
                  flecha
                  onPress={() => router.push({ pathname: '/tarjeta/editar/[id]', params: { id: tarjeta.id, seccion: 'tarjeta' } })}
                />
              ))
          : [];
  const nombreMoneda = (m: string) => t(`monedas.${m}`, { defaultValue: m });
  const monedas = config.monedaSecundaria
    ? t('ajustes.monedasDos', { principal: nombreMoneda(config.monedaPrincipal), secundaria: nombreMoneda(config.monedaSecundaria).toLocaleLowerCase(idioma) })
    : nombreMoneda(config.monedaPrincipal);

  // Pro se gestiona en la tienda (cancelar, cambiar de plan); Tino solo abre su página.
  async function abrirPlan() {
    if (preferencias?.plan !== 'pro') return router.push({ pathname: '/pro', params: { motivo: 'voluntario' } });
    const url = await compras.urlGestion().catch(() => null);
    if (url) Linking.openURL(url);
  }

  // Versión visible y número de compilación que pone la tienda (sección 12 técnica).
  const version = t('ajustes.acercaVersion', { version: Application.nativeApplicationVersion ?? '', compilacion: Application.nativeBuildVersion ?? '' });
  const derechos = t('ajustes.acercaDerechos', { anio: new Date().getFullYear() });

  return (
    <Pantalla conPestanas>
      <Texto variante="titulo" accessibilityRole="header" style={{ fontSize: 34, lineHeight: 40, letterSpacing: -0.6 }}>
        {t('ajustes.titulo')}
      </Texto>

      {precision !== null ? (
        <Superficie radio={24}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: tema.espacio.l, padding: 18 }}>
            <View style={{ width: LADO_ANILLO, height: LADO_ANILLO }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Svg width={LADO_ANILLO} height={LADO_ANILLO} viewBox={`0 0 ${LADO_ANILLO} ${LADO_ANILLO}`}>
                <Circle cx={LADO_ANILLO / 2} cy={LADO_ANILLO / 2} r={RADIO_ANILLO} fill="none" stroke={tema.color.neutroFondo} strokeWidth={GROSOR_ANILLO} />
                <Circle
                  cx={LADO_ANILLO / 2}
                  cy={LADO_ANILLO / 2}
                  r={RADIO_ANILLO}
                  fill="none"
                  stroke={tema.color.primario}
                  strokeWidth={GROSOR_ANILLO}
                  strokeLinecap="round"
                  strokeDasharray={`${(precision / 100) * CIRCUNFERENCIA} ${CIRCUNFERENCIA}`}
                  transform={`rotate(-90 ${LADO_ANILLO / 2} ${LADO_ANILLO / 2})`}
                />
              </Svg>
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                <Texto variante="cifra" style={{ fontSize: 17 }}>
                  {t('comun.porcentaje', { valor: precision })}
                </Texto>
              </View>
            </View>
            <View style={{ flex: 1, gap: tema.espacio.xs }} accessible accessibilityLabel={`${t('ajustes.precision', { porcentaje: precision })}. ${textoPista}`}>
              <Texto variante="cuerpoFuerte">{t('ajustes.precisionTitulo')}</Texto>
              <Texto variante="apoyo" color="textoSecundario" style={{ fontSize: 13 }}>
                {textoPista}
              </Texto>
            </View>
          </View>
          {filasPista.map(fila => (
            <View key={fila.key}>
              <View style={{ height: 1, marginLeft: tema.espacio.l, backgroundColor: tema.color.divisor }} />
              {fila}
            </View>
          ))}
        </Superficie>
      ) : null}

      {preferencias ? (
        <ListaAgrupada titulo={t('ajustes.planTitulo')}>
          <FilaLista
            icono="estrella"
            tono="recompensa"
            titulo={preferencias.plan === 'pro' ? t('pro.nombre') : t('ajustes.planGratis')}
            detalle={preferencias.plan === 'pro' ? t('ajustes.planProDetalle') : t('ajustes.planGratisDetalle')}
            valor={preferencias.plan === 'pro' ? t('ajustes.planPro') : undefined}
            flecha
            onPress={abrirPlan}
          />
        </ListaAgrupada>
      ) : null}

      <ListaAgrupada titulo={t('ajustes.general')}>
        <FilaLista
          icono="calendario"
          titulo={t('cobros.titulo')}
          valor={ingresos.length ? t('ajustes.cobrosN', { count: ingresos.length }) : t('ajustes.cobrosNinguno')}
          flecha
          onPress={() => router.push('/cobros')}
        />
        {preferencias ? (
          <FilaLista icono="ajustes" titulo={t('ajustes.enfoque')} valor={t(`enfoque.${preferencias.enfoque.modo}`)} flecha onPress={() => setHojaEnfoque(true)} />
        ) : null}
        {preferencias ? (
          <FilaLista icono="luna" titulo={t('ajustes.apariencia')} valor={t(`ajustes.temas.${preferencias.tema ?? 'automatico'}`)} flecha onPress={() => setHojaApariencia(true)} />
        ) : null}
        {/* Las monedas salen del país y no se eligen: van como detalle, sin fila propia. */}
        {/* D84: con un solo país disponible no hay nada que elegir. */}
        {opciones.length > 1 ? (
          <FilaLista icono="globo" titulo={t('ajustes.pais')} detalle={t('ajustes.paisDetalle', { pais: nombrePais(t, config.codigo), monedas })} flecha onPress={() => setHojaPais(true)} />
        ) : null}
      </ListaAgrupada>

      {preferencias ? (
        <ListaAgrupada>
          <FilaLista
            icono="reloj"
            tono={avisosSinPermiso ? 'alerta' : 'primario'}
            titulo={t('ajustes.avisosTitulo')}
            detalle={avisosSinPermiso ? t('ajustes.avisosResumenApagados') : t('ajustes.avisosResumen', { activos: avisosActivos, total: totalAvisos })}
            flecha
            onPress={() => router.push('/ajustes/avisos')}
          />
          <FilaLista
            icono="grafica"
            titulo={t('ajustes.privacidadTitulo')}
            detalle={t(preferencias.analiticaActiva ? 'ajustes.privacidadResumenSi' : 'ajustes.privacidadResumenNo')}
            flecha
            onPress={() => router.push('/ajustes/privacidad')}
          />
          <FilaLista
            icono="nube"
            titulo={t('ajustes.datosTitulo')}
            detalle={preferencias.plan === 'pro' && preferencias.respaldoAutomatico ? detalleRespaldoAutomatico(t, idioma, preferencias, respaldo) : t('ajustes.datosResumen')}
            flecha
            onPress={() => router.push('/ajustes/datos')}
          />
        </ListaAgrupada>
      ) : null}

      {/* Acerca de Tino: al final, discreto. */}
      <View style={{ alignItems: 'center', gap: tema.espacio.xs, paddingTop: tema.espacio.l }} accessible accessibilityLabel={[t('ajustes.acercaNombre'), version, derechos, t('ajustes.acercaMarcas')].join('. ')}>
        <LogoTino tamano={64} />
        <Texto variante="cuerpoFuerte">{t('ajustes.acercaNombre')}</Texto>
        <Texto variante="apoyo" color="textoSecundario" style={{ fontSize: 13 }}>
          {version}
        </Texto>
        <Texto variante="apoyo" color="textoSecundario" style={{ fontSize: 13, textAlign: 'center' }}>
          {derechos}
        </Texto>
        <Texto variante="apoyo" color="textoSecundario" style={{ fontSize: 13, textAlign: 'center' }}>
          {t('ajustes.acercaMarcas')}
        </Texto>
      </View>

      <Hoja visible={hojaPais} titulo={t('ajustes.pais')} onCerrar={() => setHojaPais(false)} cerrarEtiqueta={t('inicio.cerrar')}>
        <Texto variante="apoyo" color="textoSecundario">
          {t('ajustes.paisAyuda')}
        </Texto>
        <ListaAgrupada sangria={16}>
          {opciones.map(codigo => (
            <FilaLista
              key={codigo}
              titulo={nombrePais(t, codigo)}
              seleccionada={codigo === config.codigo}
              onPress={() => {
                setHojaPais(false);
                elegirPais(codigo);
              }}
            />
          ))}
        </ListaAgrupada>
      </Hoja>
      <HojaEnfoque visible={hojaEnfoque} onCerrar={() => setHojaEnfoque(false)} />
      <Hoja visible={hojaApariencia} titulo={t('ajustes.apariencia')} onCerrar={() => setHojaApariencia(false)} cerrarEtiqueta={t('inicio.cerrar')}>
        <ListaAgrupada sangria={16}>
          {TEMAS.map(tema => (
            <FilaLista
              key={tema}
              titulo={t(`ajustes.temas.${tema}`)}
              detalle={tema === 'automatico' ? t('ajustes.temaAutomaticoDetalle') : undefined}
              seleccionada={(preferencias?.tema ?? 'automatico') === tema}
              onPress={() => {
                setHojaApariencia(false);
                if (preferencias) guardarPreferencias({ ...preferencias, tema });
              }}
            />
          ))}
        </ListaAgrupada>
      </Hoja>
    </Pantalla>
  );
}
