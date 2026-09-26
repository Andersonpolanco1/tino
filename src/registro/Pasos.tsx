import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ConfigPais, MonedaFacturacion } from '../tipos/tipos';
import { Boton, Campo, Interruptor, Opciones, useTema } from '../diseno';
import { editarAlias, elegirMoneda, escribirBanco, tieneDolares, type BorradorTarjeta, type ErrorRegistro, type Traducir } from './borrador';
import { EditorFecha } from './EditorFecha';
import { EditorRecompensa } from './EditorRecompensa';

export interface PropsPaso {
  b: BorradorTarjeta;
  setB: (b: BorradorTarjeta) => void;
  error: (...claves: ErrorRegistro[]) => string | undefined;
}

// Paso "Tu tarjeta": nombre en Tino y últimos 4 dígitos; el banco a mano si no está en el catálogo.
export function PasoTarjeta({ b, setB, error, bancoAMano }: PropsPaso & { bancoAMano: boolean }) {
  const tema = useTema();
  const { t } = useTranslation();
  const traducir = t as unknown as Traducir;
  return (
    <View style={{ gap: tema.espacio.l }}>
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
  const respuesta = b.monedaFacturacion === 'doble_balance' ? 'si' : b.monedaFacturacion === 'solo_principal' ? 'no' : null;
  const otras: { valor: MonedaFacturacion; etiqueta: string }[] = [
    ...(pais.monedaSecundaria ? [{ valor: 'solo_usd' as const, etiqueta: t('registro.monedaSoloDolares') }] : []),
    { valor: 'solo_local', etiqueta: t('registro.monedaSoloLocal') },
  ];
  return (
    <View style={{ gap: tema.espacio.l }}>
      <Opciones
        opciones={[
          { valor: 'si', etiqueta: t('registro.si') },
          { valor: 'no', etiqueta: t('registro.no') },
        ]}
        valor={respuesta}
        onCambio={r => setB(elegirMoneda(b, r === 'si' ? 'doble_balance' : 'solo_principal'))}
        error={error('monedaVacia', 'dobleBalanceNoDisponible')}
      />
      {verOtras ? (
        <Opciones etiqueta={t('registro.otraFacturacion')} info={t('registro.info.otraFacturacion')} opciones={otras} valor={b.monedaFacturacion} onCambio={m => setB(elegirMoneda(b, m))} />
      ) : (
        <Boton titulo={t('registro.otraFacturacion')} variante="secundario" onPress={() => setVerOtras(true)} />
      )}
    </View>
  );
}

// Paso "Fechas": corte y fecha límite; la fecha en dólares y el ajuste por feriado en "Más opciones".
export function PasoFechas({ b, setB, error }: PropsPaso) {
  const tema = useTema();
  const { t } = useTranslation();
  const errorUsd = error('fechaLimiteUsdLejana', 'fechaLimiteUsdSinDobleBalance');
  const [masOpciones, setMasOpciones] = useState(false);
  const abiertas = masOpciones || !!errorUsd;
  return (
    <View style={{ gap: tema.espacio.l }}>
      <Campo
        etiqueta={t('registro.diaCorte')}
        info={t('registro.info.diaCorte')}
        value={b.diaCorte}
        onChangeText={texto => setB({ ...b, diaCorte: texto.replace(/\D/g, '') })}
        keyboardType="number-pad"
        maxLength={2}
        error={error('diaCorteInvalido')}
      />
      <EditorFecha
        etiqueta={t('registro.fechaLimite')}
        info={t('registro.info.fechaLimite')}
        valor={b.fechaLimite}
        onCambio={fechaLimite => setB({ ...b, fechaLimite })}
        error={error('fechaLimiteInvalida')}
      />
      <Boton
        titulo={abiertas ? t('registro.menosOpciones') : t('registro.masOpciones')}
        variante="secundario"
        onPress={() => setMasOpciones(!abiertas)}
      />
      {abiertas ? (
        <View style={{ gap: tema.espacio.l }}>
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
            <>
              <Interruptor etiqueta={t('registro.separarFechaUsd')} info={t('registro.info.separarFechaUsd')} valor={b.separarFechaUsd} onCambio={separarFechaUsd => setB({ ...b, separarFechaUsd })} />
              {b.separarFechaUsd ? (
                <EditorFecha
                  etiqueta={t('registro.fechaLimiteUsd')}
                  valor={b.fechaLimiteUsd}
                  onCambio={fechaLimiteUsd => setB({ ...b, fechaLimiteUsd })}
                  error={errorUsd}
                />
              ) : null}
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

// Paso "Recompensa": ninguna, puntos o cashback; en tarjetas con dólares, otra para esas compras.
export function PasoRecompensa({ b, setB, error }: PropsPaso) {
  const tema = useTema();
  const { t } = useTranslation();
  const conDolares = !!b.monedaFacturacion && tieneDolares({ monedaFacturacion: b.monedaFacturacion });
  return (
    <View style={{ gap: tema.espacio.l }}>
      <EditorRecompensa etiqueta={t('registro.recompensa')} info={t('registro.info.recompensa')} valor={b.recompensa} onCambio={recompensa => setB({ ...b, recompensa })} error={error('recompensaInvalida')} />
      {conDolares ? (
        <>
          <Interruptor
            etiqueta={t('registro.recompensaUsdDistinta')}
            info={t('registro.info.recompensaUsd')}
            valor={b.recompensaUsdDistinta}
            onCambio={recompensaUsdDistinta => setB({ ...b, recompensaUsdDistinta })}
          />
          {b.recompensaUsdDistinta ? (
            <EditorRecompensa etiqueta={t('registro.recompensaUsd')} valor={b.recompensaUsd} onCambio={recompensaUsd => setB({ ...b, recompensaUsd })} />
          ) : null}
        </>
      ) : null}
    </View>
  );
}
