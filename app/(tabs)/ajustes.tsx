import { useState } from 'react';
import { Alert, Linking, Platform, Share, View } from 'react-native';
import * as Application from 'expo-application';
import Svg, { Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FilaLista, Hoja, LogoTino, ListaAgrupada, Palanca, type NombreIcono, Pantalla, Superficie, Texto, useTema } from '@/diseno';
import type { AjustesAvisos, TemaApp } from '@/tipos/tipos';
import { AVISOS_PREDETERMINADOS } from '@/notificaciones/planificar';
import { usePermisoAvisos } from '@/notificaciones/usePermisoAvisos';
import { nombrePais, usePais } from '@/paises';
import { useAlmacen, useElegirPais } from '@/estado';
import { borrarBase, useEstadoDatos, useReabrirDatos } from '@/datos';
import { resumenDeDatos } from '@/respaldo/resumen';
import { contenidoDe } from '@/respaldo/contenido';
import { leerIdentificador } from '@/analitica/identificador';
import { useCatalogo } from '@/catalogo';
import { hoyLocal } from '@/utilidades/fecha';
import { pistaPrecision, precisionGeneral } from '@/inicio/precision';
import { HojaEnfoque } from '@/inicio/SelectorEnfoque';
import { valorPuntoPorConfirmar } from '@/inicio/ConfirmarValorPunto';
import { reiniciarIdentificadorAnalitica } from '@/analitica';
import { useComprasPro } from '@/suscripciones';
import { borrarRespaldoAutomatico, useEstadoRespaldoAutomatico } from '@/respaldo/automatico';
import { formatearFechaHora } from '@/i18n';

// Anillo de 84: con 100% el número necesita aire dentro del trazo.
const LADO_ANILLO = 84;
const GROSOR_ANILLO = 7;
const RADIO_ANILLO = (LADO_ANILLO - GROSOR_ANILLO) / 2;

// Los avisos del MVP (sección 11), cada uno con su interruptor.
const TEMAS: TemaApp[] = ['automatico', 'claro', 'oscuro'];

const FILAS_AVISOS: [keyof AjustesAvisos, NombreIcono, string, string][] = [
  ['fechaLimite', 'calendario', 'ajustes.avisoFechaLimite', 'ajustes.avisoFechaLimiteDetalle'],
  ['venceAntesDelCobro', 'reloj', 'ajustes.avisoVenceAntes', 'ajustes.avisoVenceAntesDetalle'],
  ['vencimiento', 'alto', 'ajustes.avisoVencimiento', 'ajustes.avisoVencimientoDetalle'],
  ['antesDelCorte', 'compra', 'ajustes.avisoAntesDelCorte', 'ajustes.avisoAntesDelCorteDetalle'],
  ['cambioTarjeta', 'tarjetas', 'ajustes.avisoCambio', 'ajustes.avisoCambioDetalle'],
  ['resumenMensual', 'moneda', 'ajustes.avisoResumen', 'ajustes.avisoResumenDetalle'],
];
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
  const detalleRespaldo = !preferencias?.respaldoAutomatico
    ? t('ajustes.respaldoAutomaticoDetalle')
    : respaldo.fallo
      ? t('ajustes.respaldoFallo')
      : respaldo.fecha
        ? t('ajustes.respaldoUltima', { fecha: formatearFechaHora(respaldo.fecha, idioma) })
        : t('ajustes.respaldoPendiente');
  const sugerencias = useAlmacen(s => s.sugerencias);
  const catalogo = useCatalogo();
  const guardarPreferencias = useAlmacen(s => s.guardarPreferencias);
  const permiso = usePermisoAvisos();
  const compras = useComprasPro();
  const datos = useEstadoDatos();
  const reabrir = useReabrirDatos();
  const [hojaPais, setHojaPais] = useState(false);
  const [hojaEnfoque, setHojaEnfoque] = useState(false);
  const [hojaApariencia, setHojaApariencia] = useState(false);
  const porConfirmar = tarjetas.filter(valorPuntoPorConfirmar);
  const contextoPrecision = { hayIngresos: ingresos.length > 0, catalogoDisponible: config.catalogoDisponible };
  const precision = precisionGeneral(tarjetas, contextoPrecision);
  const pista = pistaPrecision(tarjetas, contextoPrecision);
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

  // "Ver mis datos" (D62): todo lo que Tino guarda, en palabras; no va cifrado, por eso se avisa.
  function verMisDatos() {
    Alert.alert(t('ajustes.misDatosTitulo'), t('ajustes.misDatosAviso'), [
      { text: t('ajustes.cancelar'), style: 'cancel' },
      {
        text: t('ajustes.misDatosConfirmar'),
        onPress: async () => {
          try {
            const texto = resumenDeDatos(contenidoDe({ preferencias, tarjetas, ingresos, sugerencias }, new Date()), {
              t: t as never,
              idioma,
              monedaPrincipal: config.monedaPrincipal,
              monedaSecundaria: config.monedaSecundaria,
              catalogo,
              identificadorAnalitica: await leerIdentificador().catch(() => null),
              hoy: hoyLocal(),
            });
            await Share.share({ message: texto, title: t('misDatos.titulo') });
          } catch {
            Alert.alert(t('ajustes.errorMisDatos'));
          }
        },
      },
    ]);
  }

  function borrarTodo() {
    if (datos.estado !== 'lista') return;
    Alert.alert(t('ajustes.borrarTitulo'), t('ajustes.borrarAviso'), [
      { text: t('ajustes.cancelar'), style: 'cancel' },
      {
        text: t('ajustes.borrarConfirmar'),
        style: 'destructive',
        onPress: async () => {
          await borrarBase(datos.base);
          await borrarRespaldoAutomatico();
          await reiniciarIdentificadorAnalitica().catch(() => {});
          reabrir();
        },
      },
    ]);
  }

  // Decisión D81: respaldo automático, solo con Pro. Al encenderlo, avisa que depende del
  // respaldo del teléfono (Tino no puede saber si está encendido o tiene espacio); al apagarlo,
  // borra la copia de este teléfono.
  function cambiarRespaldoAutomatico(valor: boolean) {
    if (!preferencias) return;
    if (valor) {
      guardarPreferencias({ ...preferencias, respaldoAutomatico: true }).catch(() => {});
      Alert.alert(t('ajustes.respaldoActivadoTitulo'), t(Platform.OS === 'ios' ? 'ajustes.respaldoActivadoIos' : 'ajustes.respaldoActivadoAndroid'), [{ text: t('ajustes.entendido') }]);
      return;
    }
    Alert.alert(t('ajustes.respaldoApagarTitulo'), t('ajustes.respaldoApagarTexto'), [
      { text: t('ajustes.cancelar'), style: 'cancel' },
      {
        text: t('ajustes.respaldoApagar'),
        style: 'destructive',
        onPress: async () => {
          const { respaldoAutomatico: _activo, ...resto } = preferencias;
          await guardarPreferencias(resto);
          await borrarRespaldoAutomatico();
        },
      },
    ]);
  }

  // Pro se gestiona en la tienda (cancelar, cambiar de plan); Tino solo abre su página.
  async function abrirPlan() {
    if (preferencias?.plan !== 'pro') return router.push({ pathname: '/pro', params: { motivo: 'voluntario' } });
    const url = await compras.urlGestion().catch(() => null);
    if (url) Linking.openURL(url);
  }

  async function restaurarCompras() {
    const tienda = t(`pro.tienda.${Platform.OS === 'ios' ? 'ios' : 'android'}`);
    try {
      Alert.alert((await compras.restaurar()) ? t('pro.restaurado') : t('pro.nadaQueRestaurar', { tienda }));
    } catch {
      Alert.alert(t('pro.errorCompra'));
    }
  }

  // Versión visible y número de compilación que pone la tienda (sección 12 técnica).
  const version = t('ajustes.acercaVersion', { version: Application.nativeApplicationVersion ?? '', compilacion: Application.nativeBuildVersion ?? '' });
  const derechos = t('ajustes.acercaDerechos', { anio: new Date().getFullYear() });

  function reiniciarIdentificador() {
    Alert.alert(t('ajustes.reiniciarIdTitulo'), t('ajustes.reiniciarIdAviso'), [
      { text: t('ajustes.cancelar'), style: 'cancel' },
      { text: t('ajustes.reiniciarIdConfirmar'), onPress: () => reiniciarIdentificadorAnalitica().catch(() => {}) },
    ]);
  }

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
          <FilaLista icono="reiniciar" titulo={t('pro.restaurar')} onPress={restaurarCompras} />
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
        <FilaLista icono="globo" titulo={t('ajustes.pais')} detalle={t('ajustes.paisDetalle', { pais: nombrePais(t, config.codigo), monedas })} flecha onPress={() => setHojaPais(true)} />
      </ListaAgrupada>

      {preferencias ? (
        <ListaAgrupada titulo={t('ajustes.avisosTitulo')}>
          {permiso.estado === 'sin_preguntar' ? (
            <FilaLista icono="alto" tono="alerta" titulo={t('ajustes.activarAvisos')} detalle={t('ajustes.activarAvisosDetalle')} flecha onPress={permiso.pedir} />
          ) : permiso.estado === 'negado' ? (
            <FilaLista icono="alto" tono="alerta" titulo={t('ajustes.avisosApagados')} detalle={t('ajustes.avisosApagadosDetalle')} flecha onPress={() => Linking.openSettings()} />
          ) : null}
          {FILAS_AVISOS.map(([clave, icono, titulo, detalle]) => {
            const avisos = { ...AVISOS_PREDETERMINADOS, ...preferencias.avisos };
            return (
              <FilaLista
                key={clave}
                icono={icono}
                titulo={t(titulo)}
                detalle={t(detalle)}
                derecha={
                  <Palanca
                    valor={avisos[clave]}
                    etiqueta={t(titulo)}
                    onCambio={valor => guardarPreferencias({ ...preferencias, avisos: { ...avisos, [clave]: valor } })}
                  />
                }
              />
            );
          })}
        </ListaAgrupada>
      ) : null}

      {preferencias ? (
        <View style={{ gap: tema.espacio.s }}>
          <ListaAgrupada titulo={t('ajustes.privacidadTitulo')}>
            <FilaLista
              icono="grafica"
              titulo={t('ajustes.analitica')}
              detalle={t('ajustes.analiticaDetalle')}
              derecha={
                <Palanca
                  valor={preferencias.analiticaActiva}
                  etiqueta={t('ajustes.analitica')}
                  onCambio={valor => guardarPreferencias({ ...preferencias, analiticaActiva: valor })}
                />
              }
            />
            <FilaLista icono="reiniciar" titulo={t('ajustes.reiniciarId')} onPress={reiniciarIdentificador} />
          </ListaAgrupada>
          <Texto variante="apoyo" color="textoSecundario" style={{ paddingHorizontal: tema.espacio.xs, fontSize: 13 }}>
            {t('ajustes.privacidadInfo')}
          </Texto>
        </View>
      ) : null}

      <View style={{ gap: tema.espacio.s }}>
        <ListaAgrupada titulo={t('ajustes.datosTitulo')}>
          {preferencias?.plan === 'pro' ? (
            <FilaLista
              icono="nube"
              titulo={t('ajustes.respaldoAutomatico')}
              detalle={detalleRespaldo}
              derecha={<Palanca valor={preferencias.respaldoAutomatico === true} etiqueta={t('ajustes.respaldoAutomatico')} onCambio={cambiarRespaldoAutomatico} />}
            />
          ) : (
            <FilaLista
              icono="nube"
              titulo={t('ajustes.respaldoAutomatico')}
              detalle={t('ajustes.respaldoSoloPro')}
              flecha
              onPress={() => router.push({ pathname: '/pro', params: { motivo: 'funcion_avanzada' } })}
            />
          )}
          <FilaLista icono="descargar" titulo={t('ajustes.crearRespaldo')} detalle={t('ajustes.crearRespaldoDetalle')} flecha onPress={() => router.push('/respaldo/crear')} />
          <FilaLista icono="reiniciar" titulo={t('ajustes.restaurarRespaldo')} flecha onPress={() => router.push('/respaldo/restaurar')} />
          <FilaLista icono="info" titulo={t('ajustes.misDatos')} flecha onPress={verMisDatos} />
          <FilaLista icono="basura" titulo={t('ajustes.borrar')} destructiva onPress={borrarTodo} />
        </ListaAgrupada>
        <Texto variante="apoyo" color="textoSecundario" style={{ paddingHorizontal: tema.espacio.xs, fontSize: 13 }}>
          {t('ajustes.datosInfo')}
        </Texto>
      </View>

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
