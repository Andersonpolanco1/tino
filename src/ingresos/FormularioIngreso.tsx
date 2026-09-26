import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { randomUUID } from 'expo-crypto';
import type { AjusteDiaNoHabil, FechaISO, FuenteIngreso } from '../tipos/tipos';
import {
  Boton,
  BotonCircular,
  Campo,
  ControlSegmentado,
  CuadriculaDias,
  EtiquetaConInfo,
  FilaLista,
  Interruptor,
  ListaAgrupada,
  MarcoAsistente,
  Opciones,
  Superficie,
  Texto,
  useTema,
} from '../diseno';
import { usePais } from '../paises';
import { useAlmacen } from '../estado';
import { hoyLocal } from '../utilidades/fecha';
import { aFecha, leer, numero, ultimoDia } from '../motor/fechas';
import { fechaCorta, fechaMesCorto, type Traducir as TraducirVista } from '../inicio/vista';
import {
  aIngreso,
  borradorDesde,
  borradorNuevo,
  claveDia,
  elegirTipo,
  erroresDelPaso,
  frecuenciaDe,
  PASOS_INGRESO,
  proximosCobros,
  TIPOS_FRECUENCIA,
  tocarDiaQuincena,
  ultimasDosVeces,
  type BorradorIngreso,
  type ErrorIngreso,
  type PasoIngreso,
  type Traducir,
} from './borrador';

interface Props {
  ingreso?: FuenteIngreso;
  onListo: (ingreso: FuenteIngreso) => void;
  onCerrar: () => void;
  onBorrado?: () => void;
}

// Semana empezando el lunes, como se lee en RD.
const SEMANA = [1, 2, 3, 4, 5, 6, 0];

const TITULOS: Record<PasoIngreso, string> = {
  frecuencia: 'cobros.tituloFrecuencia',
  fechas: 'cobros.tituloFechas',
  nombre: 'cobros.tituloNombre',
};

// Registro de una fuente de ingreso (sección 5), un paso por pantalla como el de tarjetas:
// cada cuánto cobra, qué días y cómo se llama. Solo fechas: los montos llegan con el nivel 3.
export function FormularioIngreso({ ingreso, onListo, onCerrar, onBorrado }: Props) {
  const tema = useTema();
  const { t } = useTranslation();
  const traducir = t as unknown as Traducir;
  const { config: pais, idioma } = usePais();
  const guardarIngreso = useAlmacen(s => s.guardarIngreso);
  const borrarIngreso = useAlmacen(s => s.borrarIngreso);
  const editando = !!ingreso;
  const hoy = hoyLocal();

  const [b, setB] = useState<BorradorIngreso>(() => (ingreso ? borradorDesde(ingreso) : borradorNuevo()));
  const [paso, setPaso] = useState<PasoIngreso>('frecuencia');
  const [errores, setErrores] = useState<ErrorIngreso[]>([]);
  const i = PASOS_INGRESO.indexOf(paso);
  const error = (...claves: ErrorIngreso[]) => {
    const e = claves.find(c => errores.includes(c));
    return e ? t(`cobros.errores.${e}`) : undefined;
  };

  function ir(siguiente: PasoIngreso) {
    setErrores([]);
    setPaso(siguiente);
  }

  async function siguiente() {
    const r = aIngreso(b, ingreso?.id ?? randomUUID());
    const propios = r.ok ? [] : erroresDelPaso(paso, r.errores);
    if (propios.length) return setErrores(propios);
    if (i < PASOS_INGRESO.length - 1) return ir(PASOS_INGRESO[i + 1]);
    if (!r.ok) return;
    try {
      await guardarIngreso(r.ingreso);
      onListo(r.ingreso);
    } catch {
      Alert.alert(t('cobros.errorGuardar'));
    }
  }

  function borrar() {
    if (!ingreso) return;
    Alert.alert(t('cobros.borrarConfirmar'), undefined, [
      { text: t('registro.cancelar'), style: 'cancel' },
      {
        text: t('cobros.borrar'),
        style: 'destructive',
        onPress: async () => {
          await borrarIngreso(ingreso.id);
          onBorrado?.();
        },
      },
    ]);
  }

  // Vista previa: los próximos cobros con lo elegido hasta ahora.
  const frecuencia = frecuenciaDe(b);
  const proximos = frecuencia ? proximosCobros([{ id: 'vista', nombre: '', frecuencia, ajusteDiaNoHabil: b.ajuste }], hoy, pais) : [];
  const vistaPrevia = proximos.length ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: tema.espacio.m, paddingVertical: tema.espacio.m, paddingHorizontal: 14, borderRadius: tema.radio.segmento, backgroundColor: tema.color.neutroFondo }}>
      <Texto variante="apoyo" style={{ flex: 1 }} accessibilityLiveRegion="polite">
        {t('cobros.proximos', {
          fechas: proximos.map(p => fechaCorta(p.fecha, idioma, t as unknown as TraducirVista) + (p.estimada ? ` ${t('cobros.estimadaCorta')}` : '')).join(', '),
        })}
      </Texto>
    </View>
  ) : null;

  const errorTexto = (texto?: string) =>
    texto ? (
      <Texto variante="apoyo" color="alertaTexto" accessibilityLiveRegion="polite">
        {texto}
      </Texto>
    ) : null;

  let contenido;
  if (paso === 'frecuencia') {
    contenido = (
      <>
        <Opciones
          opciones={TIPOS_FRECUENCIA.map(tipo => ({ valor: tipo, etiqueta: t(`cobros.frecuencias.${tipo}`), detalle: t(`cobros.frecuenciasEjemplo.${tipo}`) }))}
          valor={b.tipo}
          onCambio={tipo => {
            setB(elegirTipo(b, tipo, traducir));
            setErrores([]);
          }}
        />
        {errorTexto(error('sinTipo'))}
      </>
    );
  } else if (paso === 'fechas') {
    contenido = (
      <View style={{ gap: tema.espacio.xl }}>
        {b.tipo === 'semanal' || b.tipo === 'cada_dos_semanas' ? (
          <View style={{ gap: tema.espacio.s }}>
            <EtiquetaConInfo etiqueta={t('cobros.queDia')} />
            <ControlSegmentado
              etiqueta={t('cobros.queDia')}
              valor={String(b.diaSemana)}
              onCambio={v => setB({ ...b, diaSemana: Number(v), referencia: null })}
              opciones={SEMANA.map(d => ({ valor: String(d), etiqueta: t(`${claveDia(d)}Corto`) }))}
            />
          </View>
        ) : null}

        {b.tipo === 'cada_dos_semanas' ? (
          <View style={{ gap: tema.espacio.s }}>
            <Opciones
              etiqueta={t('cobros.ultimoCobro')}
              info={t('cobros.info.ultimoCobro')}
              opciones={ultimasDosVeces(b.diaSemana, hoy).map(f => ({ valor: f, etiqueta: fechaCorta(f, idioma, t as unknown as TraducirVista) }))}
              valor={b.referencia}
              onCambio={referencia => setB({ ...b, referencia })}
            />
            {errorTexto(error('sinReferencia'))}
          </View>
        ) : null}

        {b.tipo === 'quincenal_dias_fijos' ? (
          <View style={{ gap: tema.espacio.s }}>
            <EtiquetaConInfo etiqueta={t('cobros.diasQuincena')} info={t('cobros.info.diasQuincena')} />
            <CuadriculaDias etiqueta={t('cobros.diasQuincena')} valores={b.dias} onCambio={dia => setB({ ...b, dias: tocarDiaQuincena(b.dias, dia) })} />
            {errorTexto(error('diasQuincena'))}
          </View>
        ) : null}

        {b.tipo === 'mensual' ? (
          <View style={{ gap: tema.espacio.s }}>
            <EtiquetaConInfo etiqueta={t('cobros.diaDelMes')} info={t('cobros.info.ultimoHabil')} />
            <ControlSegmentado
              etiqueta={t('cobros.diaDelMes')}
              valor={b.diaMes === 'ultimo_dia_habil' ? 'ultimo' : 'fijo'}
              onCambio={v => setB({ ...b, diaMes: v === 'ultimo' ? 'ultimo_dia_habil' : 30 })}
              opciones={[
                { valor: 'fijo', etiqueta: t('cobros.unDiaFijo') },
                { valor: 'ultimo', etiqueta: t('cobros.ultimoHabil') },
              ]}
            />
            {b.diaMes !== 'ultimo_dia_habil' ? <CuadriculaDias etiqueta={t('cobros.diaDelMes')} valor={b.diaMes} onCambio={diaMes => setB({ ...b, diaMes })} /> : null}
          </View>
        ) : null}

        {b.tipo === 'personalizada' ? <EditorFechas b={b} setB={setB} error={error('sinFechas')} /> : null}

        {vistaPrevia}
      </View>
    );
  } else {
    contenido = (
      <View style={{ gap: tema.espacio.xl }}>
        <Campo
          etiqueta={t('cobros.nombre')}
          info={t('cobros.info.nombre')}
          value={b.nombre}
          onChangeText={nombre => setB({ ...b, nombre, nombreEditado: true })}
          error={error('nombreVacio', 'numeroDeTarjeta')}
        />
        <Opciones<AjusteDiaNoHabil>
          etiqueta={t('cobros.ajuste')}
          info={t('cobros.info.ajuste')}
          valor={b.ajuste}
          onCambio={ajuste => setB({ ...b, ajuste })}
          opciones={[
            { valor: 'adelantar', etiqueta: t('cobros.ajusteAdelantar') },
            { valor: 'atrasar', etiqueta: t('cobros.ajusteAtrasar') },
            { valor: 'ninguno', etiqueta: t('cobros.ajusteNinguno') },
          ]}
        />
        {vistaPrevia}
        {editando ? <Boton titulo={t('cobros.borrar')} variante="alerta" icono="basura" onPress={borrar} /> : null}
      </View>
    );
  }

  const ultimo = i === PASOS_INGRESO.length - 1;
  return (
    <MarcoAsistente
      izquierda={i === 0 ? { tipo: 'cerrar', onPress: onCerrar } : { tipo: 'atras', onPress: () => ir(PASOS_INGRESO[i - 1]) }}
      tituloBarra={editando ? t('cobros.tituloEditar') : t('registro.pasoDe', { actual: i + 1, total: PASOS_INGRESO.length })}
      onCerrar={i > 0 ? onCerrar : undefined}
      progreso={{ actual: i + 1, total: PASOS_INGRESO.length }}
      titulo={t(TITULOS[paso])}
      info={paso === 'frecuencia' ? t('cobros.info.porQue') : undefined}
      subtitulo={paso === 'frecuencia' ? t('cobros.soloFechas') : undefined}
      pie={<Boton titulo={ultimo ? t('registro.guardar') : t('registro.siguiente')} onPress={siguiente} />}
    >
      {contenido}
    </MarcoAsistente>
  );
}

// Personalizada: fechas una por una, con mes y día tocables y la marca de "estimada" (sección 5.2).
function EditorFechas({ b, setB, error }: { b: BorradorIngreso; setB: (b: BorradorIngreso) => void; error?: string }) {
  const tema = useTema();
  const { t } = useTranslation();
  const { idioma } = usePais();
  const hoy = leer(hoyLocal());
  const meses = Array.from({ length: 12 }, (_, k) => {
    const m = ((hoy.mes - 1 + k) % 12) + 1;
    return { anio: hoy.anio + Math.floor((hoy.mes - 1 + k) / 12), mes: m };
  });
  const [mes, setMes] = useState(meses[0]);
  const [dia, setDia] = useState<number | null>(null);
  const [estimada, setEstimada] = useState(false);
  const nombreMes = (anio: number, m: number) => new Intl.DateTimeFormat(idioma, { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(anio, m - 1, 1)));

  function agregar() {
    if (!dia) return;
    const fecha: FechaISO = aFecha(numero({ anio: mes.anio, mes: mes.mes, dia: Math.min(dia, ultimoDia(mes.anio, mes.mes)) }));
    const resto = b.fechas.filter(f => f.fecha !== fecha);
    setB({ ...b, fechas: [...resto, { fecha, estimada }].sort((x, y) => (x.fecha < y.fecha ? -1 : 1)) });
    setDia(null);
    setEstimada(false);
  }

  return (
    <View style={{ gap: tema.espacio.l }}>
      {b.fechas.length ? (
        <ListaAgrupada titulo={t('cobros.tusFechas')} sangria={16}>
          {b.fechas.map(f => (
            <FilaLista
              key={f.fecha}
              titulo={fechaMesCorto(f.fecha, idioma, t as unknown as TraducirVista)}
              detalle={f.estimada ? t('cobros.estimada') : t('cobros.confirmada')}
              derecha={<BotonCircular icono="cerrar" plano etiqueta={t('cobros.quitarFecha', { fecha: fechaMesCorto(f.fecha, idioma, t as unknown as TraducirVista) })} onPress={() => setB({ ...b, fechas: b.fechas.filter(x => x.fecha !== f.fecha) })} />}
            />
          ))}
        </ListaAgrupada>
      ) : null}
      <Superficie style={{ padding: tema.espacio.l, gap: tema.espacio.m }}>
        <EtiquetaConInfo etiqueta={t('cobros.agregarFecha')} info={t('cobros.info.personalizada')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: tema.espacio.s }}>
          {meses.map(m => {
            const activo = m.anio === mes.anio && m.mes === mes.mes;
            return (
              <Pressable
                key={`${m.anio}-${m.mes}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: activo }}
                onPress={() => setMes(m)}
                style={{
                  minHeight: tema.toqueMinimo,
                  justifyContent: 'center',
                  paddingHorizontal: tema.espacio.l,
                  borderRadius: tema.radio.circular,
                  backgroundColor: activo ? tema.color.primario : tema.color.neutroFondo,
                }}
              >
                <Texto variante={activo ? 'cuerpoFuerte' : 'apoyo'} color={activo ? 'sobrePrimario' : 'texto'}>
                  {nombreMes(m.anio, m.mes)}
                </Texto>
              </Pressable>
            );
          })}
        </ScrollView>
        <CuadriculaDias etiqueta={t('cobros.agregarFecha')} valor={dia} onCambio={setDia} />
        <Interruptor etiqueta={t('cobros.esEstimada')} info={t('cobros.info.estimada')} valor={estimada} onCambio={setEstimada} />
        <Boton titulo={t('cobros.agregarEstaFecha')} variante="secundario" icono="mas" deshabilitado={!dia} onPress={agregar} />
      </Superficie>
      {error ? (
        <Texto variante="apoyo" color="alertaTexto" accessibilityLiveRegion="polite">
          {error}
        </Texto>
      ) : null}
    </View>
  );
}
