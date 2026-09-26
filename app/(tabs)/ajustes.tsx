import { useState } from 'react';
import { Alert, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { FilaLista, Hoja, ListaAgrupada, Pantalla, Superficie, Texto, useTema } from '@/diseno';
import { nombrePais, usePais } from '@/paises';
import { useAlmacen, useElegirPais } from '@/estado';
import { borrarBase, useEstadoDatos, useReabrirDatos } from '@/datos';
import { compartirExportacion, datosParaExportar } from '@/datos/exportar';
import { precisionGeneral } from '@/inicio/precision';
import { HojaEnfoque } from '@/inicio/SelectorEnfoque';

const RADIO_ANILLO = 30;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO_ANILLO;

// Ajustes con el rediseño: precisión en un anillo y listas agrupadas.
export default function Ajustes() {
  const { t } = useTranslation();
  const tema = useTema();
  const { config, opciones, idioma } = usePais();
  const elegirPais = useElegirPais();
  const tarjetas = useAlmacen(s => s.tarjetas);
  const preferencias = useAlmacen(s => s.preferencias);
  const datos = useEstadoDatos();
  const reabrir = useReabrirDatos();
  const [hojaPais, setHojaPais] = useState(false);
  const [hojaEnfoque, setHojaEnfoque] = useState(false);
  const precision = precisionGeneral(tarjetas, { hayIngresos: false, catalogoDisponible: config.catalogoDisponible });
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
          compartirExportacion(datosParaExportar(preferencias, tarjetas, new Date()), t('ajustes.exportarTitulo')).catch(() =>
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
          <View style={{ width: 72, height: 72 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Svg width={72} height={72} viewBox="0 0 72 72">
              <Circle cx={36} cy={36} r={RADIO_ANILLO} fill="none" stroke={tema.color.neutroFondo} strokeWidth={8} />
              <Circle
                cx={36}
                cy={36}
                r={RADIO_ANILLO}
                fill="none"
                stroke={tema.color.primario}
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray={`${(precision / 100) * CIRCUNFERENCIA} ${CIRCUNFERENCIA}`}
                transform="rotate(-90 36 36)"
              />
            </Svg>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
              <Texto variante="cifra" style={{ fontSize: 20 }}>
                {t('comun.porcentaje', { valor: precision })}
              </Texto>
            </View>
          </View>
          <View style={{ flex: 1, gap: tema.espacio.xs }} accessible accessibilityLabel={t('ajustes.precision', { porcentaje: precision })}>
            <Texto variante="cuerpoFuerte">{t('ajustes.precisionTitulo')}</Texto>
            <Texto variante="apoyo" color="textoSecundario" style={{ fontSize: 13 }}>
              {t('ajustes.precisionPista')}
            </Texto>
          </View>
        </Superficie>
      ) : null}

      <ListaAgrupada titulo={t('ajustes.general')}>
        <FilaLista icono="globo" titulo={t('ajustes.pais')} valor={nombrePais(t, config.codigo)} flecha onPress={() => setHojaPais(true)} />
        <FilaLista icono="dinero" titulo={t('ajustes.monedas')} valor={monedas} />
        {preferencias ? (
          <FilaLista icono="ajustes" titulo={t('ajustes.enfoque')} valor={t(`enfoque.${preferencias.enfoque.modo}`)} flecha onPress={() => setHojaEnfoque(true)} />
        ) : null}
      </ListaAgrupada>

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
