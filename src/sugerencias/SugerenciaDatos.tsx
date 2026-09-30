import { useEffect, useMemo } from 'react';
import { Linking, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Boton, BotonCircular, BotonPastilla, Icono, Superficie, Texto, useTema } from '../diseno';
import { usePais } from '../paises';
import { useAlmacen } from '../estado';
import { useTarjetasEnPlan } from '../suscripciones/useSuscripcion';
import { useHoy } from '../inicio/useHoy';
import { proximoPago } from '../inicio/vista';
import { valorPuntoPorConfirmar } from '../inicio/ConfirmarValorPunto';
import { numeroDe } from '../motor/fechas';
import { descartarSugerencia, elegirSugerencia, type TipoSugerencia } from './elegir';
import { useConsejosNuevos } from '../consejos';
import { registrarSugerenciaAceptada, registrarSugerenciaDescartada, registrarSugerenciaMostrada } from '../analitica';
import { responderAnalitica, tocaPreguntarAnalitica } from '../privacidad/consentimiento';
import { DOCUMENTOS } from '../privacidad/terminos';

// Días antes de una fecha límite en que tiene sentido sugerir los cobros (sección 2.2:
// "al acercarse una fecha límite").
const DIAS_PAGO_CERCANO = 7;
const ICONO_ACCION = { cobros: 'mas', fechas: 'derecha', valorPunto: 'check', respaldo: 'descargar', analitica: 'check' } as const;
// Decisión D81: pasados 3 meses usando Tino sin un respaldo manual, se recuerda crearlo.
export const DIAS_SIN_RESPALDO = 90;

// La tarjeta discreta de sugerencia de la pantalla de inicio (sección 3.1): un dato, con su
// beneficio, que se completa en menos de 30 segundos o se descarta.
export function SugerenciaDatos() {
  const tema = useTema();
  const { t } = useTranslation();
  const router = useRouter();
  const hoy = useHoy();
  const { config } = usePais();
  const tarjetas = useTarjetasEnPlan();
  const ingresos = useAlmacen(s => s.ingresos);
  const estado = useAlmacen(s => s.sugerencias);
  const guardar = useAlmacen(s => s.guardarSugerencias);
  const preferencias = useAlmacen(s => s.preferencias);
  const guardarPreferencias = useAlmacen(s => s.guardarPreferencias);
  const ultimoRespaldo = preferencias?.ultimoRespaldoManual;

  const activas = tarjetas.filter(x => !x.enPausa);
  const sinConfirmar = activas.find(valorPuntoPorConfirmar);
  const pagoCercano = activas.some(x => numeroDe(proximoPago(x, hoy, config)) - numeroDe(hoy) <= DIAS_PAGO_CERCANO);
  // Decisión D68: solo mientras haya consejos nuevos; los vistos quedan en Tarjetas.
  const { nuevos: consejosNuevos } = useConsejosNuevos();
  const candidatas: TipoSugerencia[] = [];
  // D88: cuando toca volver a preguntar por los datos de uso, va primero; si ya hay otra
  // sugerencia esta semana, espera a la siguiente.
  if (tocaPreguntarAnalitica(preferencias, hoy)) candidatas.push('analitica');
  if (!ingresos.length && pagoCercano) candidatas.push('cobros');
  if (consejosNuevos.length) candidatas.push('fechas');
  if (sinConfirmar) candidatas.push('valorPunto');
  const desde = (fecha: string) => numeroDe(hoy) - numeroDe(fecha.slice(0, 10));
  const primeraTarjeta = tarjetas.map(x => x.creadaEn).sort()[0];
  if (primeraTarjeta && desde(primeraTarjeta) >= DIAS_SIN_RESPALDO && (!ultimoRespaldo || desde(ultimoRespaldo) >= DIAS_SIN_RESPALDO)) candidatas.push('respaldo');

  const clave = candidatas.join(',');
  const eleccion = useMemo(() => elegirSugerencia(estado, candidatas, hoy), [estado, clave, hoy]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (eleccion.estado !== estado) guardar(eleccion.estado).catch(() => {});
  }, [eleccion, estado, guardar]);

  const tipo = eleccion.tipo;
  useEffect(() => {
    if (tipo) registrarSugerenciaMostrada(tipo);
  }, [tipo]);
  if (!tipo) return null;
  const descartar = () => {
    registrarSugerenciaDescartada(tipo);
    guardar(descartarSugerencia(estado, tipo, hoy)).catch(() => {});
  };
  if (tipo === 'analitica') {
    // "Ahora no" y cerrar cuentan como un intento; "Compartir datos de uso" decide para siempre.
    const responder = (si: boolean) => {
      if (!preferencias) return;
      if (si) registrarSugerenciaAceptada(tipo);
      else descartar();
      guardarPreferencias(responderAnalitica(preferencias, si, hoy)).catch(() => {});
    };
    return (
      <Superficie radio={tema.radio.lista} style={{ padding: tema.espacio.l, gap: tema.espacio.m }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: tema.espacio.m }}>
          <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: tema.color.neutroFondo, alignItems: 'center', justifyContent: 'center' }}>
            <Icono nombre="grafica" color="primario" tamano={20} />
          </View>
          <Texto variante="apoyo" style={{ flex: 1 }}>
            {t('datosDeUso.textoInicio')}
          </Texto>
          <View style={{ marginTop: -tema.espacio.s, marginRight: -tema.espacio.s }}>
            <BotonCircular icono="cerrar" plano etiqueta={t('sugerencias.descartar')} onPress={() => responder(false)} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: tema.espacio.s }}>
          <BotonPastilla icono={ICONO_ACCION.analitica} titulo={t('datosDeUso.si')} onPress={() => responder(true)} />
          <Boton titulo={t('datosDeUso.no')} variante="texto" onPress={() => responder(false)} />
        </View>
        {DOCUMENTOS.privacidad ? (
          <View style={{ alignItems: 'flex-start' }}>
            <Boton titulo={t('datosDeUso.politica')} variante="texto" onPress={() => Linking.openURL(DOCUMENTOS.privacidad)} />
          </View>
        ) : null}
      </Superficie>
    );
  }
  const texto = tipo === 'valorPunto' ? t('sugerencias.valorPunto', { alias: sinConfirmar?.alias ?? '' }) : t(`sugerencias.${tipo}`);
  const accion = () => {
    registrarSugerenciaAceptada(tipo);
    if (tipo === 'cobros') router.push('/cobros/nuevo');
    else if (tipo === 'fechas') router.push('/consejos/fechas');
    else if (tipo === 'respaldo') router.push('/respaldo/crear');
    else if (sinConfirmar) router.push({ pathname: '/tarjeta/[id]', params: { id: sinConfirmar.id } });
  };
  return (
    <Superficie radio={tema.radio.lista} style={{ padding: tema.espacio.l, gap: tema.espacio.m }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: tema.espacio.m }}>
        <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: tema.color.neutroFondo, alignItems: 'center', justifyContent: 'center' }}>
          <Icono nombre={tipo === 'valorPunto' ? 'moneda' : tipo === 'respaldo' ? 'nube' : 'calendario'} color="primario" tamano={20} />
        </View>
        <Texto variante="apoyo" style={{ flex: 1 }}>
          {texto}
        </Texto>
        <View style={{ marginTop: -tema.espacio.s, marginRight: -tema.espacio.s }}>
          <BotonCircular icono="cerrar" plano etiqueta={t('sugerencias.descartar')} onPress={descartar} />
        </View>
      </View>
      <View style={{ alignItems: 'flex-start' }}>
        <BotonPastilla icono={ICONO_ACCION[tipo]} titulo={t(`sugerencias.${tipo}Accion`)} onPress={accion} />
      </View>
    </Superficie>
  );
}
