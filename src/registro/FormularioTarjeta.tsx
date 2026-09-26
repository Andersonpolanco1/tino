import { useState, type ReactNode } from 'react';
import { Alert, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { randomUUID } from 'expo-crypto';
import type { Tarjeta } from '../tipos/tipos';
import { BarraSuperior, Boton, EtiquetaConInfo, FilaLista, ListaAgrupada, Palanca, Pantalla, Texto, useTema } from '../diseno';
import { useCatalogo } from '../catalogo';
import { usePais } from '../paises';
import { useAlmacen } from '../estado';
import { hoyLocal } from '../utilidades/fecha';
import { inicialesBanco } from '../inicio/vista';
import {
  aTarjeta,
  borradorDesde,
  borradorNuevo,
  buscarEmisor,
  buscarProducto,
  elegirEmisor,
  elegirProducto,
  emisoresParaRegistro,
  erroresDelPaso,
  escribirBanco,
  pasosDelRegistro,
  productoFueraDeLista,
  tieneDolares,
  type BorradorTarjeta,
  type ErrorRegistro,
  type PasoRegistro,
  type Traducir,
} from './borrador';
import { ListaBuscable } from './ListaBuscable';
import { PasoFechas, PasoMoneda, PasoRecompensa, PasoTarjeta } from './Pasos';

interface Props {
  tarjeta?: Tarjeta;
  // preguntarPagoUsd: es la primera tarjeta con dólares y aún no se sabe cómo paga ese balance.
  onListo: (tarjeta: Tarjeta, preguntarPagoUsd: boolean) => void;
  onBorrada?: () => void;
  onCerrar: () => void;
  // Al editar, abre directo esa sección; guardar o volver cierra la pantalla (viene del detalle).
  seccionInicial?: PasoRegistro;
}

type Vista = 'banco' | 'producto' | PasoRegistro | 'secciones';

const TITULOS: Record<PasoRegistro, string> = {
  tarjeta: 'registro.tituloTarjeta',
  moneda: 'registro.tituloMoneda',
  fechas: 'registro.tituloFechas',
  recompensa: 'registro.tituloRecompensa',
};

const ORDEN_PASOS: PasoRegistro[] = ['tarjeta', 'moneda', 'fechas', 'recompensa'];

// Agregar: un paso por pantalla con barra de progreso (rediseño). Editar: la tarjeta en
// secciones; cada una se abre y se guarda sola.
export function FormularioTarjeta({ tarjeta, seccionInicial, onListo, onBorrada, onCerrar }: Props) {
  const tema = useTema();
  const { t } = useTranslation();
  const traducir = t as unknown as Traducir;
  const catalogo = useCatalogo();
  const { config: pais } = usePais();
  const guardarTarjeta = useAlmacen(s => s.guardarTarjeta);
  const borrarTarjeta = useAlmacen(s => s.borrarTarjeta);
  const pagoBalanceUsd = useAlmacen(s => s.preferencias?.pagoBalanceUsd ?? null);

  const editando = !!tarjeta;
  const [guardada, setGuardada] = useState<BorradorTarjeta>(() => (tarjeta ? borradorDesde(tarjeta) : borradorNuevo()));
  const [b, setB] = useState<BorradorTarjeta>(guardada);
  const [vista, setVista] = useState<Vista>(editando ? (seccionInicial ?? 'secciones') : catalogo ? 'banco' : 'tarjeta');
  const [bancoAMano, setBancoAMano] = useState(() => !catalogo || (!!tarjeta && tarjeta.emisorId === null));
  const [errores, setErrores] = useState<ErrorRegistro[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [masOpciones, setMasOpciones] = useState(false);

  const emisor = buscarEmisor(catalogo, b.emisorId);
  const producto = buscarProducto(catalogo, b.emisorId, b.productoId);
  const nombreBanco = emisor?.nombreCorto ?? b.bancoLibre;
  const pasos = pasosDelRegistro(b, pais);
  // Banco y tipo cuentan como el primer paso cuando hay catálogo.
  const conPasoBanco = !!catalogo;
  const total = pasos.length + (conPasoBanco ? 1 : 0);
  const numeroDe = (v: Vista) => (v === 'banco' || v === 'producto' ? 1 : pasos.indexOf(v as PasoRegistro) + 1 + (conPasoBanco ? 1 : 0));

  const error = (...claves: ErrorRegistro[]) => {
    const encontrado = claves.find(c => errores.includes(c));
    return encontrado ? t(`registro.errores.${encontrado}`) : undefined;
  };
  const ir = (siguiente: Vista) => {
    setErrores([]);
    setMasOpciones(false);
    setVista(siguiente);
  };
  const resultado = (borrador: BorradorTarjeta = b) => aTarjeta(borrador, pais, tarjeta?.id ?? randomUUID(), tarjeta?.creadaEn ?? hoyLocal());

  async function guardar(borrador: BorradorTarjeta = b) {
    const r = resultado(borrador);
    if (!r.ok) {
      // Lleva al primer paso con errores.
      const conError = ORDEN_PASOS.find(p => erroresDelPaso(p, r.errores).length);
      if (conError) setVista(conError);
      setErrores(r.errores);
      return;
    }
    setGuardando(true);
    try {
      await guardarTarjeta(r.tarjeta);
      setB(borrador);
      setGuardada(borrador);
      if (editando) seccionInicial ? onCerrar() : ir('secciones');
      onListo(r.tarjeta, tieneDolares(r.tarjeta) && pagoBalanceUsd === null);
    } catch {
      Alert.alert(t('registro.errorGuardar'));
    } finally {
      setGuardando(false);
    }
  }

  // Asistente: avanza solo si el paso actual no tiene errores; el último guarda.
  function siguiente(paso: PasoRegistro) {
    const r = resultado();
    const propios = r.ok ? [] : erroresDelPaso(paso, r.errores);
    if (propios.length) return setErrores(propios);
    const i = pasos.indexOf(paso);
    if (i === pasos.length - 1) guardar();
    else ir(pasos[i + 1]);
  }

  function atras(v: Vista) {
    if (editando) {
      setB(guardada);
      return seccionInicial ? onCerrar() : ir('secciones');
    }
    if (v === 'producto') return ir('banco');
    const i = pasos.indexOf(v as PasoRegistro);
    if (i > 0) ir(pasos[i - 1]);
    else if (catalogo) ir(bancoAMano ? 'banco' : 'producto');
    else onCerrar();
  }

  // Marco común de cada paso: barra, progreso, título en pregunta y botón fijo abajo.
  const marco = (v: Vista, titulo: string, contenido: ReactNode, opciones: { pie?: ReactNode; info?: string; subtitulo?: string } = {}) => (
    <Pantalla
      arriba={
        <View style={{ gap: 18 }}>
          <BarraSuperior
            izquierda={v === 'banco' && !editando ? { tipo: 'cerrar', onPress: onCerrar } : { tipo: 'atras', onPress: () => atras(v) }}
            titulo={editando ? t('registro.tituloEditar') : t('registro.pasoDe', { actual: numeroDe(v), total })}
            cerrar={!editando && v !== 'banco' ? onCerrar : undefined}
          />
          {!editando ? (
            <View style={{ flexDirection: 'row', gap: 6 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {Array.from({ length: total }, (_, i) => (
                <View key={i} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: i < numeroDe(v) ? tema.color.primario : tema.color.pistaApagada }} />
              ))}
            </View>
          ) : null}
        </View>
      }
      pie={opciones.pie}
    >
      <View style={{ gap: tema.espacio.xs }}>
        <EtiquetaConInfo etiqueta={titulo} info={opciones.info} variante="titulo" encabezado />
        {opciones.subtitulo ? (
          <Texto variante="apoyo" color="textoSecundario">
            {opciones.subtitulo}
          </Texto>
        ) : null}
      </View>
      {contenido}
    </Pantalla>
  );

  // ---------- Banco y tipo ----------

  if (vista === 'banco' && catalogo) {
    return marco(
      'banco',
      t('registro.tituloBanco'),
      <ListaBuscable
        buscador={t('registro.buscarBanco')}
        elementos={emisoresParaRegistro(catalogo).map(e => ({ id: e.id, titulo: e.nombreCorto, iniciales: inicialesBanco(e.nombreCorto), buscarEn: [e.nombreCorto, e.nombreLegal] }))}
        onElegir={id => {
          setB(elegirEmisor(b, id, traducir, catalogo));
          setBancoAMano(false);
          ir('producto');
        }}
        salidas={[
          {
            titulo: t('registro.bancoNoEsta'),
            onPress: () => {
              setB(escribirBanco(b, '', traducir, catalogo));
              setBancoAMano(true);
              ir('tarjeta');
            },
          },
        ]}
      />,
      { info: t('registro.porQue') },
    );
  }

  if (vista === 'producto' && emisor) {
    // Al editar, cambiar el tipo se guarda de una vez; si falta algo (como la moneda), lleva a ese paso.
    const despues = (nuevo: BorradorTarjeta) => {
      setB(nuevo);
      if (editando) guardar(nuevo);
      else ir('tarjeta');
    };
    return marco(
      'producto',
      t('registro.tituloProducto'),
      <ListaBuscable
        buscador={t('registro.buscarProducto')}
        elementos={emisor.productos.map(p => ({ id: p.id, titulo: p.nombre, buscarEn: [p.nombre, p.marca] }))}
        onElegir={id => despues(elegirProducto(b, id, traducir, catalogo))}
        salidas={[
          { titulo: t('registro.noEstaEnLaLista'), onPress: () => despues(productoFueraDeLista(b, false, traducir, catalogo)) },
          { titulo: t('registro.noSeElTipo'), onPress: () => despues(productoFueraDeLista(b, true, traducir, catalogo)) },
        ]}
      />,
      { subtitulo: emisor.nombreCorto },
    );
  }

  // ---------- Un paso ----------

  if (vista === 'tarjeta' || vista === 'moneda' || vista === 'fechas' || vista === 'recompensa') {
    const paso = vista;
    const esUltimo = pasos.indexOf(paso) === pasos.length - 1;
    const subtitulo = paso === 'tarjeta' ? nombreBanco : [b.alias, nombreBanco].filter(Boolean).join(' · ');
    const contenido =
      paso === 'tarjeta' ? (
        <PasoTarjeta b={b} setB={setB} error={error} bancoAMano={bancoAMano} />
      ) : paso === 'moneda' ? (
        <PasoMoneda b={b} setB={setB} error={error} pais={pais} />
      ) : paso === 'fechas' ? (
        <PasoFechas b={b} setB={setB} error={error} pais={pais} masOpciones={masOpciones || errores.some(e => e.startsWith('fechaLimiteUsd'))} />
      ) : (
        <PasoRecompensa b={b} setB={setB} error={error} />
      );
    const pie = (
      <>
        {paso === 'fechas' ? (
          <Boton titulo={masOpciones ? t('registro.menosOpciones') : t('registro.masOpciones')} variante="texto" onPress={() => setMasOpciones(!masOpciones)} />
        ) : null}
        <Boton
          titulo={editando || esUltimo ? t('registro.guardar') : t('registro.siguiente')}
          onPress={() => (editando ? guardar() : siguiente(paso))}
          deshabilitado={guardando}
        />
      </>
    );
    return marco(paso, t(TITULOS[paso]), contenido, {
      pie,
      info: paso === 'moneda' ? t('registro.info.moneda') : undefined,
      subtitulo: subtitulo || undefined,
    });
  }

  // ---------- Secciones (editar) ----------

  const resumenMoneda: Record<string, string> = {
    doble_balance: t('registro.resumenConDolares'),
    solo_principal: t('registro.resumenSinDolares'),
    solo_usd: t('registro.resumenSoloDolares'),
    solo_local: t('registro.resumenSoloLocal'),
  };
  const resumenRecompensa =
    b.recompensa.tipo === 'ninguna'
      ? t('registro.resumenNinguna')
      : b.recompensa.tipo === 'cashback'
        ? t('registro.resumenCashback', { porcentaje: b.recompensa.porcentajeCashback })
        : t('registro.resumenPuntos');
  const resumenPago =
    b.fechaLimite.tipo === 'dia_del_mes'
      ? t('registro.resumenPagoDia', { dia: b.fechaLimite.valor })
      : t('registro.resumenPagoDias', { dias: b.fechaLimite.valor });
  const nombreProducto = producto?.nombre ?? (b.productoDesconocido ? t('registro.productoDesconocido') : t('registro.productoOtro'));

  function confirmarBorrado() {
    if (!tarjeta) return;
    Alert.alert(t('registro.borrarConfirmar'), t('registro.borrarDetalle'), [
      { text: t('registro.cancelar'), style: 'cancel' },
      {
        text: t('registro.borrar'),
        style: 'destructive',
        onPress: async () => {
          await borrarTarjeta(tarjeta.id);
          onBorrada?.();
        },
      },
    ]);
  }

  return (
    <Pantalla arriba={<BarraSuperior izquierda={{ tipo: 'atras', onPress: onCerrar }} titulo={t('registro.tituloEditar')} />}>
      <Texto variante="titulo" accessibilityRole="header">
        {b.alias}
      </Texto>
      <ListaAgrupada>
        {catalogo && !bancoAMano ? (
          <FilaLista icono="tarjetas" titulo={t('registro.seccionBanco')} detalle={`${emisor?.nombreCorto ?? ''} · ${nombreProducto}`} flecha onPress={() => ir('banco')} />
        ) : null}
        <FilaLista
          icono="editar"
          titulo={t('registro.seccionTarjeta')}
          detalle={`${b.alias} · ${b.ultimos4 ? t('registro.resumenUltimos4', { digitos: b.ultimos4 }) : t('registro.resumenSinUltimos4')}`}
          flecha
          onPress={() => ir('tarjeta')}
        />
        {pais.funciones.dobleBalance ? (
          <FilaLista icono="dinero" titulo={t('registro.seccionMoneda')} detalle={resumenMoneda[b.monedaFacturacion ?? 'solo_principal']} flecha onPress={() => ir('moneda')} />
        ) : null}
        <FilaLista
          icono="calendario"
          titulo={t('registro.seccionFechas')}
          detalle={`${t('registro.resumenCorteDia', { dia: b.diaCorte })} · ${resumenPago}`}
          flecha
          onPress={() => ir('fechas')}
        />
        <FilaLista icono="moneda" tono="recompensa" titulo={t('registro.seccionRecompensa')} detalle={resumenRecompensa} flecha onPress={() => ir('recompensa')} />
      </ListaAgrupada>
      <ListaAgrupada>
        <FilaLista
          icono="pausa"
          tono="neutro"
          titulo={t('registro.enPausa')}
          detalle={t('detalle.pausaDetalle')}
          derecha={<Palanca valor={b.enPausa} onCambio={enPausa => guardar({ ...b, enPausa })} etiqueta={t('registro.enPausa')} />}
        />
        <FilaLista icono="basura" titulo={t('registro.borrar')} destructiva onPress={confirmarBorrado} />
      </ListaAgrupada>
    </Pantalla>
  );
}
