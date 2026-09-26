import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ConfigPais, MonedaFacturacion, ReglaFechaLimite, Tarjeta } from '../tipos/tipos';
import {
  Boton,
  Campo,
  Contador,
  ControlSegmentado,
  CuadriculaDias,
  EtiquetaConInfo,
  FilaLista,
  Icono,
  ListaAgrupada,
  Opciones,
  Palanca,
  Texto,
  useTema,
} from '../diseno';
import { calcularRanking } from '../motor';
import { useAlmacen } from '../estado';
import { hoyLocal } from '../utilidades/fecha';
import { editarAlias, elegirMoneda, escribirBanco, tieneDolares, type BorradorFechaLimite, type BorradorTarjeta, type ErrorRegistro, type Traducir } from './borrador';
import { EditorRecompensa } from './EditorRecompensa';

export interface PropsPaso {
  b: BorradorTarjeta;
  setB: (b: BorradorTarjeta) => void;
  error: (...claves: ErrorRegistro[]) => string | undefined;
}

// Paso "¿Cómo quieres llamarla?": nombre en Tino y últimos 4 dígitos; el banco a mano si no
// está en el catálogo.
export function PasoTarjeta({ b, setB, error, bancoAMano }: PropsPaso & { bancoAMano: boolean }) {
  const tema = useTema();
  const { t } = useTranslation();
  const traducir = t as unknown as Traducir;
  return (
    <View style={{ gap: tema.espacio.xl }}>
      {bancoAMano ? (
        <Campo
          etiqueta={t('registro.nombreBanco')}
          info={t('registro.info.nombreBanco')}
          value={b.bancoLibre}
          onChangeText={texto => setB(escribirBanco(b, texto, traducir, null))}
          error={error('bancoVacio')}
        />
      ) : null}
      <Campo
        etiqueta={t('registro.alias')}
        info={t('registro.info.alias')}
        value={b.alias}
        onChangeText={texto => setB(editarAlias(b, texto))}
        error={error('aliasVacio', 'numeroDeTarjeta')}
      />
      <Campo
        etiqueta={t('registro.ultimos4')}
        info={t('registro.info.ultimos4')}
        value={b.ultimos4}
        onChangeText={texto => setB({ ...b, ultimos4: texto.replace(/\D/g, '') })}
        keyboardType="number-pad"
        maxLength={4}
        error={error('ultimos4Invalido')}
      />
    </View>
  );
}

// Paso "Balance en dólares": Sí o No; lo poco común queda escondido.
export function PasoMoneda({ b, setB, error, pais }: PropsPaso & { pais: ConfigPais }) {
  const tema = useTema();
  const { t } = useTranslation();
  const pocoComun = b.monedaFacturacion === 'solo_usd' || b.monedaFacturacion === 'solo_local';
  const [verOtras, setVerOtras] = useState(pocoComun);
  const opciones: { valor: MonedaFacturacion; etiqueta: string }[] = [
    { valor: 'doble_balance', etiqueta: t('registro.resumenConDolares') },
    { valor: 'solo_principal', etiqueta: t('registro.resumenSinDolares') },
    ...(verOtras
      ? [
          ...(pais.monedaSecundaria ? [{ valor: 'solo_usd' as const, etiqueta: t('registro.monedaSoloDolares') }] : []),
          { valor: 'solo_local' as const, etiqueta: t('registro.monedaSoloLocal') },
        ]
      : []),
  ];
  return (
    <View style={{ gap: tema.espacio.l }}>
      <Opciones opciones={opciones} valor={b.monedaFacturacion} onCambio={m => setB(elegirMoneda(b, m))} error={error('monedaVacia', 'dobleBalanceNoDisponible')} />
      {!verOtras ? <Boton titulo={t('registro.otraFacturacion')} variante="texto" onPress={() => setVerOtras(true)} /> : null}
    </View>
  );
}

// Valor inicial de la fecha límite al elegir el corte: 20 días después, que el usuario ajusta.
function fechaSugerida(diaCorte: number, tipo: ReglaFechaLimite['tipo']): string {
  return tipo === 'dia_del_mes' ? String(((diaCorte + 19) % 31) + 1) : '20';
}

function EditorLimite({ etiqueta, info, valor, onCambio, error }: { etiqueta: string; info?: string; valor: BorradorFechaLimite; onCambio: (v: BorradorFechaLimite) => void; error?: string }) {
  const tema = useTema();
  const { t } = useTranslation();
  const esDia = valor.tipo === 'dia_del_mes';
  const numero = Number(valor.valor) || (esDia ? 25 : 20);
  return (
    <View style={{ gap: 10 }}>
      <EtiquetaConInfo etiqueta={etiqueta} info={info} />
      <ControlSegmentado
        etiqueta={etiqueta}
        valor={valor.tipo}
        onCambio={tipo => onCambio({ tipo, valor: tipo === valor.tipo ? valor.valor : tipo === 'dia_del_mes' ? '25' : '20' })}
        opciones={[
          { valor: 'dia_del_mes', etiqueta: t('registro.diaDelMes') },
          { valor: 'dias_despues_corte', etiqueta: t('registro.diasDespues') },
        ]}
      />
      <Contador
        etiqueta={esDia ? t('registro.sePagaElDia') : t('registro.diasDespuesDelCorte')}
        valor={numero}
        min={1}
        max={esDia ? 31 : 60}
        onCambio={n => onCambio({ ...valor, valor: String(n) })}
      />
      {error ? (
        <Texto variante="apoyo" color="alertaTexto" accessibilityLiveRegion="polite" style={{ marginTop: -tema.espacio.xs }}>
          {error}
        </Texto>
      ) : null}
    </View>
  );
}

// Paso de fechas del rediseño: cuadrícula de días para el corte, fecha límite con contador y
// cuántos días tendría una compra de hoy con esas fechas.
export function PasoFechas({ b, setB, error, pais, masOpciones }: PropsPaso & { pais: ConfigPais; masOpciones: boolean }) {
  const tema = useTema();
  const { t } = useTranslation();
  const preferencias = useAlmacen(s => s.preferencias);
  const corte = Number(b.diaCorte) || null;

  const diasHoy = useMemo(() => {
    const limite = Number(b.fechaLimite.valor);
    if (!corte || !limite || !preferencias) return null;
    const tarjeta: Tarjeta = {
      id: 'vista-previa',
      alias: '',
      emisorId: null,
      productoId: null,
      productoDesconocido: false,
      diaCorte: corte,
      fechaLimite: b.fechaLimite.tipo === 'dia_del_mes' ? { tipo: 'dia_del_mes', dia: limite } : { tipo: 'dias_despues_corte', dias: limite },
      ajusteDiaNoHabil: b.ajusteDiaNoHabil,
      compraEnDiaDeCorte: b.compraEnDiaDeCorte,
      monedaFacturacion: 'solo_principal',
      recompensa: { tipo: 'ninguna' },
      enPausa: false,
      creadaEn: hoyLocal(),
    };
    return calcularRanking({ hoy: hoyLocal(), tarjetas: [tarjeta], ingresos: [], preferencias, pais }).ranking[0]?.diasGracia ?? null;
  }, [corte, b.fechaLimite, b.ajusteDiaNoHabil, b.compraEnDiaDeCorte, preferencias, pais]);

  function elegirCorte(dia: number) {
    const fechaLimite = b.fechaLimite.valor ? b.fechaLimite : { ...b.fechaLimite, valor: fechaSugerida(dia, b.fechaLimite.tipo) };
    setB({ ...b, diaCorte: String(dia), fechaLimite });
  }

  return (
    <View style={{ gap: tema.espacio.xl }}>
      <View style={{ gap: tema.espacio.s }}>
        <EtiquetaConInfo etiqueta={t('registro.diaCorte')} info={t('registro.info.diaCorte')} />
        <CuadriculaDias etiqueta={t('registro.diaCorte')} valor={corte} onCambio={elegirCorte} />
        {error('diaCorteInvalido') ? (
          <Texto variante="apoyo" color="alertaTexto" accessibilityLiveRegion="polite">
            {error('diaCorteInvalido')}
          </Texto>
        ) : null}
      </View>

      {corte ? (
        <EditorLimite
          etiqueta={t('registro.fechaLimite')}
          info={t('registro.info.fechaLimite')}
          valor={b.fechaLimite}
          onCambio={fechaLimite => setB({ ...b, fechaLimite })}
          error={error('fechaLimiteInvalida')}
        />
      ) : null}

      {diasHoy !== null ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: tema.espacio.m, paddingVertical: tema.espacio.m, paddingHorizontal: 14, borderRadius: tema.radio.segmento, backgroundColor: tema.color.neutroFondo }}>
          <Icono nombre="check" color="primario" />
          <Texto variante="apoyo" style={{ flex: 1 }} accessibilityLiveRegion="polite">
            {t('registro.vistaPrevia', { dias: diasHoy })}
          </Texto>
        </View>
      ) : null}

      {masOpciones ? (
        <View style={{ gap: tema.espacio.xl }}>
          <Opciones
            etiqueta={t('registro.ajuste')}
            info={t('registro.info.ajuste')}
            valor={b.ajusteDiaNoHabil}
            onCambio={ajusteDiaNoHabil => setB({ ...b, ajusteDiaNoHabil })}
            opciones={[
              { valor: 'adelantar', etiqueta: t('registro.ajusteAdelantar') },
              { valor: 'atrasar', etiqueta: t('registro.ajusteAtrasar') },
              { valor: 'ninguno', etiqueta: t('registro.ajusteNinguno') },
            ]}
          />
          {b.monedaFacturacion === 'doble_balance' ? (
            <View style={{ gap: tema.espacio.l }}>
              <ListaAgrupada sangria={16}>
                <FilaLista
                  titulo={t('registro.separarFechaUsd')}
                  derecha={<Palanca valor={b.separarFechaUsd} onCambio={separarFechaUsd => setB({ ...b, separarFechaUsd })} etiqueta={t('registro.separarFechaUsd')} />}
                />
              </ListaAgrupada>
              {b.separarFechaUsd ? (
                <EditorLimite
                  etiqueta={t('registro.fechaLimiteUsd')}
                  info={t('registro.info.separarFechaUsd')}
                  valor={b.fechaLimiteUsd.valor ? b.fechaLimiteUsd : { ...b.fechaLimiteUsd, valor: b.fechaLimite.valor }}
                  onCambio={fechaLimiteUsd => setB({ ...b, fechaLimiteUsd })}
                  error={error('fechaLimiteUsdLejana', 'fechaLimiteUsdSinDobleBalance')}
                />
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

// Paso "¿Qué te da esta tarjeta?": ninguna, puntos o cashback; en tarjetas con dólares, otra
// recompensa para esas compras.
export function PasoRecompensa({ b, setB, error }: PropsPaso) {
  const tema = useTema();
  const { t } = useTranslation();
  const conDolares = !!b.monedaFacturacion && tieneDolares({ monedaFacturacion: b.monedaFacturacion });
  return (
    <View style={{ gap: tema.espacio.xl }}>
      <EditorRecompensa
        etiqueta={t('registro.recompensa')}
        info={t('registro.info.recompensa')}
        valor={b.recompensa}
        onCambio={recompensa => setB({ ...b, recompensa })}
        error={error('recompensaInvalida')}
      />
      {conDolares ? (
        <View style={{ gap: tema.espacio.l }}>
          <ListaAgrupada sangria={16}>
            <FilaLista
              titulo={t('registro.recompensaUsdDistinta')}
              derecha={
                <Palanca valor={b.recompensaUsdDistinta} onCambio={recompensaUsdDistinta => setB({ ...b, recompensaUsdDistinta })} etiqueta={t('registro.recompensaUsdDistinta')} />
              }
            />
          </ListaAgrupada>
          {b.recompensaUsdDistinta ? (
            <EditorRecompensa etiqueta={t('registro.recompensaUsd')} info={t('registro.info.recompensaUsd')} valor={b.recompensaUsd} onCambio={recompensaUsd => setB({ ...b, recompensaUsd })} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
