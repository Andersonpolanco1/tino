import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BotonCircular, BotonPastilla, Icono, Superficie, Texto, useTema } from '../diseno';
import { usePais } from '../paises';
import { useAlmacen } from '../estado';
import { useTarjetasEnPlan } from '../suscripciones/useSuscripcion';
import { useHoy } from '../inicio/useHoy';
import { proximoPago } from '../inicio/vista';
import { valorPuntoPorConfirmar } from '../inicio/ConfirmarValorPunto';
import { numeroDe } from '../motor/fechas';
import { descartarSugerencia, elegirSugerencia, type TipoSugerencia } from './elegir';
import { useConsejosFechas } from '../consejos';
import { registrarSugerenciaAceptada, registrarSugerenciaDescartada, registrarSugerenciaMostrada } from '../analitica';

// Días antes de una fecha límite en que tiene sentido sugerir los cobros (sección 2.2:
// "al acercarse una fecha límite").
const DIAS_PAGO_CERCANO = 7;
const ICONO_ACCION = { cobros: 'mas', fechas: 'derecha', valorPunto: 'check' } as const;

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

  const activas = tarjetas.filter(x => !x.enPausa);
  const sinConfirmar = activas.find(valorPuntoPorConfirmar);
  const pagoCercano = activas.some(x => numeroDe(proximoPago(x, hoy, config)) - numeroDe(hoy) <= DIAS_PAGO_CERCANO);
  const consejos = useConsejosFechas();
  const candidatas: TipoSugerencia[] = [];
  if (!ingresos.length && pagoCercano) candidatas.push('cobros');
  if (consejos.length) candidatas.push('fechas');
  if (sinConfirmar) candidatas.push('valorPunto');

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
  const texto = tipo === 'valorPunto' ? t('sugerencias.valorPunto', { alias: sinConfirmar?.alias ?? '' }) : t(`sugerencias.${tipo}`);
  const accion = () => {
    registrarSugerenciaAceptada(tipo);
    if (tipo === 'cobros') router.push('/cobros/nuevo');
    else if (tipo === 'fechas') router.push('/consejos/fechas');
    else if (sinConfirmar) router.push({ pathname: '/tarjeta/[id]', params: { id: sinConfirmar.id } });
  };
  return (
    <Superficie radio={tema.radio.lista} style={{ padding: tema.espacio.l, gap: tema.espacio.m }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: tema.espacio.m }}>
        <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: tema.color.neutroFondo, alignItems: 'center', justifyContent: 'center' }}>
          <Icono nombre={tipo === 'valorPunto' ? 'moneda' : 'calendario'} color="primario" tamano={20} />
        </View>
        <Texto variante="apoyo" style={{ flex: 1 }}>
          {texto}
        </Texto>
        <View style={{ marginTop: -tema.espacio.s, marginRight: -tema.espacio.s }}>
          <BotonCircular icono="cerrar" plano etiqueta={t('sugerencias.descartar')} onPress={() => {
              registrarSugerenciaDescartada(tipo);
              guardar(descartarSugerencia(estado, tipo, hoy)).catch(() => {});
            }} />
        </View>
      </View>
      <View style={{ alignItems: 'flex-start' }}>
        <BotonPastilla icono={ICONO_ACCION[tipo]} titulo={t(`sugerencias.${tipo}Accion`)} onPress={accion} />
      </View>
    </Superficie>
  );
}
