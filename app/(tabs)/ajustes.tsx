import { useState } from 'react';
import { Alert, Linking, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FilaLista, Hoja, ListaAgrupada, Palanca, type NombreIcono, Pantalla, Superficie, Texto, useTema } from '@/diseno';
import type { AjustesAvisos } from '@/tipos/tipos';
import { AVISOS_PREDETERMINADOS } from '@/notificaciones/planificar';
import { usePermisoAvisos } from '@/notificaciones/usePermisoAvisos';
import { nombrePais, usePais } from '@/paises';
import { useAlmacen, useElegirPais } from '@/estado';
import { borrarBase, useEstadoDatos, useReabrirDatos } from '@/datos';
import { compartirExportacion, datosParaExportar } from '@/datos/exportar';
import { pistaPrecision, precisionGeneral } from '@/inicio/precision';
import { HojaEnfoque } from '@/inicio/SelectorEnfoque';
import { valorPuntoPorConfirmar } from '@/inicio/ConfirmarValorPunto';

// Anillo de 84: con 100% el número necesita aire dentro del trazo.
const LADO_ANILLO = 84;
const GROSOR_ANILLO = 7;
const RADIO_ANILLO = (LADO_ANILLO - GROSOR_ANILLO) / 2;

// Los avisos del MVP (sección 11), cada uno con su interruptor.
const FILAS_AVISOS: [keyof AjustesAvisos, NombreIcono, string, string][] = [
  ['fechaLimite', 'calendario', 'ajustes.avisoFechaLimite', 'ajustes.avisoFechaLimiteDetalle'],
  ['venceAntesDelCobro', 'reloj', 'ajustes.avisoVenceAntes', 'ajustes.avisoVenceAntesDetalle'],
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
  const guardarPreferencias = useAlmacen(s => s.guardarPreferencias);
  const permiso = usePermisoAvisos();
  const datos = useEstadoDatos();
  const reabrir = useReabrirDatos();
  const [hojaPais, setHojaPais] = useState(false);
  const [hojaEnfoque, setHojaEnfoque] = useState(false);
  const porConfirmar = tarjetas.filter(valorPuntoPorConfirmar);
  const contextoPrecision = { hayIngresos: ingresos.length > 0, catalogoDisponible: config.catalogoDisponible };
  const precision = precisionGeneral(tarjetas, contextoPrecision);
  const pista = pistaPrecision(tarjetas, contextoPrecision);
  const nombreMoneda = (m: string) => t(`monedas.${m}`, { defaultValue: m });
  const monedas = config.monedaSecundaria
    ? t('ajustes.monedasDos', { principal: nombreMoneda(config.monedaPrincipal), secundaria: nombreMoneda(config.monedaSecundaria).toLocaleLowerCase(idioma) })
    : nombreMoneda(config.monedaPrincipal);

  function exportar() {
    Alert.alert(t('ajustes.exportarTitulo'), t('ajustes.exportarAviso'), [
      { text: t('ajustes.cancelar'), style: 'cancel' },
      {
        text: t('ajustes.exportarConfirmar'),
        onPress: () =>
          compartirExportacion(datosParaExportar(preferencias, tarjetas, ingresos, new Date()), t('ajustes.exportarTitulo')).catch(() =>
            Alert.alert(t('ajustes.errorExportar')),
          ),
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
          reabrir();
        },
      },
    ]);
  }

  return (
    <Pantalla conPestanas>
      <Texto variante="titulo" accessibilityRole="header" style={{ fontSize: 34, lineHeight: 40, letterSpacing: -0.6 }}>
        {t('ajustes.titulo')}
      </Texto>

      {precision !== null ? (
        <Superficie radio={24} style={{ flexDirection: 'row', alignItems: 'center', gap: tema.espacio.l, padding: 18 }}>
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
          <View style={{ flex: 1, gap: tema.espacio.xs }} accessible accessibilityLabel={t('ajustes.precision', { porcentaje: precision })}>
            <Texto variante="cuerpoFuerte">{t('ajustes.precisionTitulo')}</Texto>
            <Texto variante="apoyo" color="textoSecundario" style={{ fontSize: 13 }}>
              {pista === 'punto' ? t('ajustes.precisionPistaPunto', { count: porConfirmar.length }) : t(`ajustes.precisionPista.${pista}`)}
            </Texto>
          </View>
        </Superficie>
      ) : null}
      {porConfirmar.length ? (
        <ListaAgrupada sangria={16}>
          {porConfirmar.map(tarjeta => (
            <FilaLista
              key={tarjeta.id}
              icono="moneda"
              tono="recompensa"
              titulo={tarjeta.alias}
              detalle={t('ajustes.confirmarPunto')}
              flecha
              onPress={() => router.push({ pathname: '/tarjeta/[id]', params: { id: tarjeta.id } })}
            />
          ))}
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

      <View style={{ gap: tema.espacio.s }}>
        <ListaAgrupada titulo={t('ajustes.datosTitulo')}>
          <FilaLista icono="descargar" titulo={t('ajustes.exportar')} flecha onPress={exportar} />
          <FilaLista icono="basura" titulo={t('ajustes.borrar')} destructiva onPress={borrarTodo} />
        </ListaAgrupada>
        <Texto variante="apoyo" color="textoSecundario" style={{ paddingHorizontal: tema.espacio.xs, fontSize: 13 }}>
          {t('ajustes.datosInfo')}
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
    </Pantalla>
  );
}
