import { useState } from 'react';
import { Alert, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { randomUUID } from 'expo-crypto';
import type { Tarjeta } from '../tipos/tipos';
import { Boton, EtiquetaConInfo, Fila, Interruptor, Texto, useTema } from '../diseno';
import { useCatalogo } from '../catalogo';
import { usePais } from '../paises';
import { useAlmacen } from '../estado';
import { hoyLocal } from '../utilidades/fecha';
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
}

type Vista = 'banco' | 'producto' | PasoRegistro | 'secciones';

const TITULOS: Record<PasoRegistro, string> = {
  tarjeta: 'registro.tituloTarjeta',
  moneda: 'registro.tituloMoneda',
  fechas: 'registro.tituloFechas',
  recompensa: 'registro.tituloRecompensa',
};

const ORDEN_PASOS: PasoRegistro[] = ['tarjeta', 'moneda', 'fechas', 'recompensa'];

// Agregar: un paso por pantalla (banco, tipo, tu tarjeta, dólares, fechas, recompensa).
// Editar: una lista de secciones con su resumen; cada una se abre y se guarda sola.
export function FormularioTarjeta({ tarjeta, onListo, onBorrada }: Props) {
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
  const [vista, setVista] = useState<Vista>(editando ? 'secciones' : catalogo ? 'banco' : 'tarjeta');
  const [bancoAMano, setBancoAMano] = useState(() => !catalogo || (!!tarjeta && tarjeta.emisorId === null));
  const [errores, setErrores] = useState<ErrorRegistro[]>([]);
  const [guardando, setGuardando] = useState(false);

  const emisor = buscarEmisor(catalogo, b.emisorId);
  const producto = buscarProducto(catalogo, b.emisorId, b.productoId);
  const pasos = pasosDelRegistro(b, pais);
  const error = (...claves: ErrorRegistro[]) => {
    const encontrado = claves.find(c => errores.includes(c));
    return encontrado ? t(`registro.errores.${encontrado}`) : undefined;
  };
  const ir = (siguiente: Vista) => {
    setErrores([]);
    setVista(siguiente);
  };
  const resultado = (borrador: BorradorTarjeta = b) =>
    aTarjeta(borrador, pais, tarjeta?.id ?? randomUUID(), tarjeta?.creadaEn ?? hoyLocal());

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
      if (editando) ir('secciones');
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

  function atras(paso: PasoRegistro) {
    const i = pasos.indexOf(paso);
    if (i > 0) ir(pasos[i - 1]);
    else if (catalogo) ir(bancoAMano ? 'banco' : 'producto');
  }

  // ---------- Banco y tipo ----------

  if (vista === 'banco' && catalogo) {
    return (
      <ListaBuscable
        titulo={t('registro.banco')}
        ayuda={t('registro.porQue')}
        buscador={t('registro.buscarBanco')}
        elementos={emisoresParaRegistro(catalogo).map(e => ({ id: e.id, titulo: e.nombreCorto, buscarEn: [e.nombreCorto, e.nombreLegal] }))}
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
      />
    );
  }

  if (vista === 'producto' && emisor) {
    // Al editar, cambiar el tipo se guarda de una vez; si falta algo (como la moneda), lleva a ese paso.
    const despues = (nuevo: BorradorTarjeta) => {
      setB(nuevo);
      if (editando) guardar(nuevo);
      else ir('tarjeta');
    };
    return (
      <ListaBuscable
        titulo={t('registro.producto')}
        ayuda={emisor.nombreCorto}
        buscador={t('registro.buscarProducto')}
        elementos={emisor.productos.map(p => ({ id: p.id, titulo: p.nombre, buscarEn: [p.nombre, p.marca] }))}
        onElegir={id => despues(elegirProducto(b, id, traducir, catalogo))}
        salidas={[
          { titulo: t('registro.noEstaEnLaLista'), onPress: () => despues(productoFueraDeLista(b, false, traducir, catalogo)) },
          { titulo: t('registro.noSeElTipo'), onPress: () => despues(productoFueraDeLista(b, true, traducir, catalogo)) },
        ]}
      />
    );
  }

  // ---------- Un paso ----------

  if (vista === 'tarjeta' || vista === 'moneda' || vista === 'fechas' || vista === 'recompensa') {
    const paso = vista;
    const esUltimo = pasos.indexOf(paso) === pasos.length - 1;
    return (
      <View style={{ gap: tema.espacio.l }}>
        {!editando ? (
          <Texto variante="apoyo" color="textoSecundario">
            {t('registro.pasoDe', { actual: pasos.indexOf(paso) + 1, total: pasos.length })}
          </Texto>
        ) : null}
        <EtiquetaConInfo etiqueta={t(TITULOS[paso])} info={paso === 'moneda' ? t('registro.info.moneda') : undefined} variante="titulo" encabezado />
        {paso === 'tarjeta' ? (
          <PasoTarjeta b={b} setB={setB} error={error} bancoAMano={bancoAMano} />
        ) : paso === 'moneda' ? (
          <PasoMoneda b={b} setB={setB} error={error} pais={pais} />
        ) : paso === 'fechas' ? (
          <PasoFechas b={b} setB={setB} error={error} />
        ) : (
          <PasoRecompensa b={b} setB={setB} error={error} />
        )}
        <View style={{ flexDirection: 'row', gap: tema.espacio.m }}>
          <View style={{ flex: 1 }}>
            <Boton
              titulo={editando ? t('registro.cancelar') : t('registro.atras')}
              variante="secundario"
              onPress={() => {
                if (!editando) return atras(paso);
                setB(guardada);
                ir('secciones');
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Boton
              titulo={editando || esUltimo ? t('registro.guardar') : t('registro.siguiente')}
              onPress={() => (editando ? guardar() : siguiente(paso))}
              deshabilitado={guardando}
            />
          </View>
        </View>
      </View>
    );
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
    <View style={{ gap: tema.espacio.m }}>
      {catalogo && !bancoAMano ? (
        <Fila titulo={t('registro.seccionBanco')} detalle={`${emisor?.nombreCorto ?? ''} · ${nombreProducto}`} onPress={() => ir('banco')} />
      ) : null}
      <Fila
        titulo={t('registro.seccionTarjeta')}
        detalle={`${b.alias} · ${b.ultimos4 ? t('registro.resumenUltimos4', { digitos: b.ultimos4 }) : t('registro.resumenSinUltimos4')}`}
        onPress={() => ir('tarjeta')}
      />
      {pais.funciones.dobleBalance ? (
        <Fila titulo={t('registro.seccionMoneda')} detalle={resumenMoneda[b.monedaFacturacion ?? 'solo_principal']} onPress={() => ir('moneda')} />
      ) : null}
      <Fila
        titulo={t('registro.seccionFechas')}
        detalle={`${t('registro.resumenCorteDia', { dia: b.diaCorte })} · ${resumenPago}`}
        onPress={() => ir('fechas')}
      />
      <Fila titulo={t('registro.seccionRecompensa')} detalle={resumenRecompensa} onPress={() => ir('recompensa')} />
      <Interruptor
        etiqueta={t('registro.enPausa')}
        info={t('registro.info.enPausa')}
        valor={b.enPausa}
        onCambio={enPausa => guardar({ ...b, enPausa })}
      />
      <Boton titulo={t('registro.borrar')} variante="alerta" onPress={confirmarBorrado} />
    </View>
  );
}
