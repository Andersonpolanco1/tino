import { Alert, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Boton, EtiquetaConInfo, Opciones, Pantalla, Texto, useTema } from '@/diseno';
import { nombrePais, usePais } from '@/paises';
import { useAlmacen, useElegirPais } from '@/estado';
import { borrarBase, useEstadoDatos, useReabrirDatos } from '@/datos';
import { compartirExportacion, datosParaExportar } from '@/datos/exportar';
import { precisionGeneral } from '@/inicio/precision';

export default function Ajustes() {
  const { t } = useTranslation();
  const tema = useTema();
  const { config, opciones } = usePais();
  const elegirPais = useElegirPais();
  const tarjetas = useAlmacen(s => s.tarjetas);
  const preferencias = useAlmacen(s => s.preferencias);
  const datos = useEstadoDatos();
  const reabrir = useReabrirDatos();
  const monedas = [config.monedaPrincipal, config.monedaSecundaria].filter(Boolean).join(' · ');
  const precision = precisionGeneral(tarjetas, { hayIngresos: false, catalogoDisponible: config.catalogoDisponible });

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
    <Pantalla>
      <Texto variante="titulo" accessibilityRole="header">
        {t('ajustes.titulo')}
      </Texto>
      <Opciones
        etiqueta={t('ajustes.pais')}
        info={t('ajustes.paisAyuda')}
        opciones={opciones.map(codigo => ({ valor: codigo, etiqueta: nombrePais(t, codigo) }))}
        valor={config.codigo}
        onCambio={elegirPais}
      />
      <View style={{ gap: tema.espacio.xs }}>
        <Texto variante="apoyo" color="textoSecundario">
          {t('ajustes.moneda')}
        </Texto>
        <Texto variante="cuerpoFuerte">{monedas}</Texto>
      </View>
      {precision !== null ? (
        <EtiquetaConInfo etiqueta={t('ajustes.precision', { porcentaje: precision })} info={t('ajustes.precisionInfo')} variante="cuerpoFuerte" />
      ) : null}
      <View style={{ gap: tema.espacio.m }}>
        <EtiquetaConInfo etiqueta={t('ajustes.datosTitulo')} info={t('ajustes.datosInfo')} variante="subtitulo" encabezado />
        <Boton titulo={t('ajustes.exportar')} variante="secundario" onPress={exportar} />
        <Boton titulo={t('ajustes.borrar')} variante="alerta" onPress={borrarTodo} />
      </View>
    </Pantalla>
  );
}
