import { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { randomUUID } from 'expo-crypto';
import type { MonedaFacturacion, Tarjeta } from '../tipos/tipos';
import { Boton, Campo, Fila, Interruptor, Opciones, Texto, useTema } from '../diseno';
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
  editarAlias,
  elegirEmisor,
  elegirMoneda,
  elegirProducto,
  emisoresParaRegistro,
  escribirBanco,
  productoFueraDeLista,
  tieneDolares,
  type BorradorTarjeta,
  type ErrorRegistro,
} from './borrador';
import { ListaBuscable } from './ListaBuscable';
import { EditorFecha } from './EditorFecha';
import { EditorRecompensa } from './EditorRecompensa';

interface Props {
  tarjeta?: Tarjeta;
  // preguntarPagoUsd: es la primera tarjeta con dólares y aún no se sabe cómo paga ese balance.
  onListo: (tarjeta: Tarjeta, preguntarPagoUsd: boolean) => void;
  onBorrada?: () => void;
}

type Paso = 'banco' | 'producto' | 'formulario';

// Errores que se muestran en "Más opciones"; si aparece uno, esa sección se abre sola.
const ERRORES_DE_MAS_OPCIONES: ErrorRegistro[] = ['ultimos4Invalido', 'fechaLimiteUsdLejana', 'fechaLimiteUsdSinDobleBalance'];

export function FormularioTarjeta({ tarjeta, onListo, onBorrada }: Props) {
  const tema = useTema();
  const { t } = useTranslation();
  const traducir = t as unknown as (clave: string, opciones?: Record<string, string>) => string;
  const catalogo = useCatalogo();
  const { config: pais } = usePais();
  const guardarTarjeta = useAlmacen(s => s.guardarTarjeta);
  const borrarTarjeta = useAlmacen(s => s.borrarTarjeta);
  const pagoBalanceUsd = useAlmacen(s => s.preferencias?.pagoBalanceUsd ?? null);

  const [b, setB] = useState<BorradorTarjeta>(() => (tarjeta ? borradorDesde(tarjeta) : borradorNuevo()));
  const [paso, setPaso] = useState<Paso>(tarjeta || !catalogo ? 'formulario' : 'banco');
  const [bancoManual, setBancoManual] = useState(() => !!tarjeta && tarjeta.emisorId === null);
  const [errores, setErrores] = useState<ErrorRegistro[]>([]);
  const [masOpciones, setMasOpciones] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const emisor = buscarEmisor(catalogo, b.emisorId);
  const producto = buscarProducto(catalogo, b.emisorId, b.productoId);
  const error = (...claves: ErrorRegistro[]) => {
    const encontrado = claves.find(c => errores.includes(c));
    return encontrado ? t(`registro.errores.${encontrado}`) : undefined;
  };

  // Formas de facturación poco comunes; van en "Más opciones".
  const otrasFacturaciones = useMemo(() => {
    const lista: { valor: MonedaFacturacion; etiqueta: string }[] = [];
    // Sin doble balance en el país no hay pregunta principal: "Normal" permite volver a solo pesos.
    if (!pais.funciones.dobleBalance) lista.push({ valor: 'solo_principal', etiqueta: t('registro.monedaNormal') });
    if (pais.monedaSecundaria) lista.push({ valor: 'solo_usd', etiqueta: t('registro.monedaSoloDolares') });
    lista.push({ valor: 'solo_local', etiqueta: t('registro.monedaSoloLocal') });
    return lista;
  }, [pais, t]);
  const respuestaDolares = b.monedaFacturacion === 'doble_balance' ? 'si' : b.monedaFacturacion === 'solo_principal' ? 'no' : null;
  const facturacionPocoComun = b.monedaFacturacion === 'solo_usd' || b.monedaFacturacion === 'solo_local';

  if (paso === 'banco' && catalogo) {
    return (
      <ListaBuscable
        titulo={t('registro.banco')}
        ayuda={t('registro.porQue')}
        buscador={t('registro.buscarBanco')}
        elementos={emisoresParaRegistro(catalogo).map(e => ({ id: e.id, titulo: e.nombreCorto, buscarEn: [e.nombreCorto, e.nombreLegal] }))}
        onElegir={id => {
          setB(elegirEmisor(b, id, traducir, catalogo));
          setBancoManual(false);
          setPaso('producto');
        }}
        salidas={[
          {
            titulo: t('registro.bancoNoEsta'),
            onPress: () => {
              setB(escribirBanco(b, '', traducir, catalogo));
              setBancoManual(true);
              setPaso('formulario');
            },
          },
        ]}
      />
    );
  }

  if (paso === 'producto' && emisor) {
    return (
      <ListaBuscable
        titulo={t('registro.producto')}
        ayuda={emisor.nombreCorto}
        buscador={t('registro.buscarProducto')}
        elementos={emisor.productos.map(p => ({ id: p.id, titulo: p.nombre, buscarEn: [p.nombre, p.marca] }))}
        onElegir={id => {
          setB(elegirProducto(b, id, traducir, catalogo));
          setPaso('formulario');
        }}
        salidas={[
          { titulo: t('registro.noEstaEnLaLista'), onPress: () => (setB(productoFueraDeLista(b, false, traducir, catalogo)), setPaso('formulario')) },
          { titulo: t('registro.noSeElTipo'), onPress: () => (setB(productoFueraDeLista(b, true, traducir, catalogo)), setPaso('formulario')) },
        ]}
      />
    );
  }

  const nombreProducto = producto?.nombre ?? (b.productoDesconocido ? t('registro.productoDesconocido') : t('registro.productoOtro'));

  async function guardar() {
    const resultado = aTarjeta(b, pais, tarjeta?.id ?? randomUUID(), tarjeta?.creadaEn ?? hoyLocal());
    if (!resultado.ok) {
      setErrores(resultado.errores);
      if (resultado.errores.some(e => ERRORES_DE_MAS_OPCIONES.includes(e))) setMasOpciones(true);
      return;
    }
    setGuardando(true);
    try {
      await guardarTarjeta(resultado.tarjeta);
      onListo(resultado.tarjeta, tieneDolares(resultado.tarjeta) && pagoBalanceUsd === null);
    } catch {
      Alert.alert(t('registro.errorGuardar'));
    } finally {
      setGuardando(false);
    }
  }

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
    <View style={{ gap: tema.espacio.l }}>
      {catalogo && !bancoManual ? (
        <Fila
          titulo={emisor?.nombreCorto ?? t('registro.banco')}
          detalle={emisor ? nombreProducto : undefined}
          onPress={() => setPaso('banco')}
          derecha={
            <Texto variante="apoyo" color="primario">
              {t('registro.cambiar')}
            </Texto>
          }
        />
      ) : null}
      {catalogo && emisor && !bancoManual ? (
        <Boton titulo={t('registro.producto')} variante="secundario" onPress={() => setPaso('producto')} />
      ) : null}
      {bancoManual || !catalogo ? (
        <Campo
          etiqueta={t('registro.nombreBanco')}
          value={b.bancoLibre}
          onChangeText={texto => setB(escribirBanco(b, texto, traducir, catalogo))}
          error={error('bancoVacio')}
        />
      ) : null}

      <Campo
        etiqueta={t('registro.alias')}
        ayuda={t('registro.aliasAyuda')}
        value={b.alias}
        onChangeText={texto => setB(editarAlias(b, texto))}
        error={error('aliasVacio', 'numeroDeTarjeta')}
      />

      <Campo
        etiqueta={t('registro.diaCorte')}
        ayuda={t('registro.diaCorteAyuda')}
        value={b.diaCorte}
        onChangeText={texto => setB({ ...b, diaCorte: texto.replace(/\D/g, '') })}
        keyboardType="number-pad"
        maxLength={2}
        error={error('diaCorteInvalido')}
      />

      <EditorFecha
        etiqueta={t('registro.fechaLimite')}
        valor={b.fechaLimite}
        onCambio={fechaLimite => setB({ ...b, fechaLimite })}
        error={error('fechaLimiteInvalida')}
      />

      {pais.funciones.dobleBalance ? (
        <View style={{ gap: tema.espacio.xs }}>
          <Opciones
            etiqueta={t('registro.moneda')}
            opciones={[
              { valor: 'si', etiqueta: t('registro.si') },
              { valor: 'no', etiqueta: t('registro.no') },
            ]}
            valor={respuestaDolares}
            onCambio={respuesta => setB(elegirMoneda(b, respuesta === 'si' ? 'doble_balance' : 'solo_principal'))}
            error={error('monedaVacia', 'dobleBalanceNoDisponible')}
          />
          <Texto variante="apoyo" color="textoSecundario">
            {facturacionPocoComun ? t('registro.monedaOtraElegida') : t('registro.monedaAyuda')}
          </Texto>
        </View>
      ) : null}

      <EditorRecompensa
        etiqueta={t('registro.recompensa')}
        valor={b.recompensa}
        onCambio={recompensa => setB({ ...b, recompensa })}
        error={error('recompensaInvalida')}
      />

      <Boton
        titulo={masOpciones ? t('registro.menosOpciones') : t('registro.masOpciones')}
        variante="secundario"
        onPress={() => setMasOpciones(!masOpciones)}
      />

      {masOpciones ? (
        <View style={{ gap: tema.espacio.l }}>
          <Campo
            etiqueta={t('registro.ultimos4')}
            ayuda={t('registro.ultimos4Ayuda')}
            value={b.ultimos4}
            onChangeText={texto => setB({ ...b, ultimos4: texto.replace(/\D/g, '') })}
            keyboardType="number-pad"
            maxLength={4}
            error={error('ultimos4Invalido')}
          />
          <Opciones
            etiqueta={t('registro.ajuste')}
            valor={b.ajusteDiaNoHabil}
            onCambio={ajusteDiaNoHabil => setB({ ...b, ajusteDiaNoHabil })}
            opciones={[
              { valor: 'adelantar', etiqueta: t('registro.ajusteAdelantar') },
              { valor: 'atrasar', etiqueta: t('registro.ajusteAtrasar') },
              { valor: 'ninguno', etiqueta: t('registro.ajusteNinguno') },
            ]}
          />
          <Opciones
            etiqueta={t('registro.otraFacturacion')}
            valor={b.monedaFacturacion}
            onCambio={moneda => setB(elegirMoneda(b, moneda))}
            opciones={otrasFacturaciones}
          />
          {b.monedaFacturacion === 'doble_balance' ? (
            <>
              <Interruptor etiqueta={t('registro.separarFechaUsd')} valor={b.separarFechaUsd} onCambio={separarFechaUsd => setB({ ...b, separarFechaUsd })} />
              {b.separarFechaUsd ? (
                <EditorFecha
                  etiqueta={t('registro.fechaLimiteUsd')}
                  valor={b.fechaLimiteUsd}
                  onCambio={fechaLimiteUsd => setB({ ...b, fechaLimiteUsd })}
                  error={error('fechaLimiteUsdLejana', 'fechaLimiteUsdSinDobleBalance')}
                />
              ) : null}
            </>
          ) : null}
          {b.monedaFacturacion && tieneDolares({ monedaFacturacion: b.monedaFacturacion }) ? (
            <>
              <Interruptor
                etiqueta={t('registro.recompensaUsdDistinta')}
                valor={b.recompensaUsdDistinta}
                onCambio={recompensaUsdDistinta => setB({ ...b, recompensaUsdDistinta })}
              />
              {b.recompensaUsdDistinta ? (
                <EditorRecompensa etiqueta={t('registro.recompensaUsd')} valor={b.recompensaUsd} onCambio={recompensaUsd => setB({ ...b, recompensaUsd })} />
              ) : null}
            </>
          ) : null}
        </View>
      ) : null}

      {tarjeta ? (
        <Interruptor etiqueta={t('registro.enPausa')} ayuda={t('registro.enPausaAyuda')} valor={b.enPausa} onCambio={enPausa => setB({ ...b, enPausa })} />
      ) : null}

      <Boton titulo={t('registro.guardar')} onPress={guardar} deshabilitado={guardando} />
      {tarjeta ? <Boton titulo={t('registro.borrar')} variante="alerta" onPress={confirmarBorrado} /> : null}
    </View>
  );
}
