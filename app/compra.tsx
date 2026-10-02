import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { CodigoMoneda, FechaISO } from '@/tipos/tipos';
import { BarraSuperior, BotonPastilla, ControlSegmentado, Icono, ListaAgrupada, Pantalla, Superficie, Texto, useTema } from '@/diseno';
import { usePais } from '@/paises';
import { useAlmacen } from '@/estado';
import { useVistas, type VistaTarjeta } from '@/inicio/useVistas';
import { useHoy } from '@/inicio/useHoy';
import { fechaCompraValida } from '@/compra/fechaCompra';
import { riesgoIntereses } from '@/pagos/pendientes';
import { SelectorFechaCompra } from '@/compra/SelectorFechaCompra';
import { diaConSemana, textoFecha, valorRecompensaCompra, type Traducir } from '@/inicio/vista';
import { partesFechaLarga, simboloMoneda } from '@/i18n/formato';
import { calcularRanking } from '@/motor';
import { DIAS_MINIMOS_AL_ESPERAR } from '@/notificaciones/planificar';
import { FilaTarjeta } from '@/inicio/FilaTarjeta';
import { ChipBanco } from '@/inicio/ChipBanco';
import { registrarConsultaCompra } from '@/analitica';
import { useVolver } from '@/utilidades/useVolver';

// "Tengo una compra" (sección 7.5) con el rediseño: el monto en grande y el resultado al
// instante. La categoría llega en v2 (decisión D27). El día de la compra es hoy salvo que el
// usuario elija otro dentro del mes siguiente (decisión D96); no se guarda.
export default function Compra() {
  const { t } = useTranslation();
  const tema = useTema();
  const router = useRouter();
  const volver = useVolver();
  const { config, idioma } = usePais();
  const tarjetas = useAlmacen(s => s.tarjetas);
  const [texto, setTexto] = useState('');
  const [moneda, setMoneda] = useState<CodigoMoneda>(config.monedaPrincipal);
  const hoy = useHoy();
  const [elegida, setElegida] = useState<FechaISO | null>(null);
  const [eligiendo, setEligiendo] = useState(false);
  // Si pasa la medianoche y la fecha elegida queda atrás, vuelve a hoy.
  const fecha = fechaCompraValida(elegida, hoy);
  const otroDia = fecha !== hoy;
  const dia = diaConSemana(fecha, idioma, t as unknown as Traducir);
  const fechaVisible = otroDia ? t('comun.fechaLarga', partesFechaLarga(fecha, idioma)) : t('compra.hoy');

  const monto = Number(texto.replace(/,/g, ''));
  const compra = useMemo(() => (Number.isFinite(monto) && monto > 0 ? { monto, moneda } : undefined), [monto, moneda]);
  const vistas = useVistas({ compra, fecha: otroDia ? fecha : undefined });

  // Una consulta por visita, al escribir el primer monto válido; solo la moneda sale del teléfono.
  const consultada = useRef(false);
  useEffect(() => {
    if (!compra || consultada.current) return;
    consultada.current = true;
    registrarConsultaCompra(compra.moneda);
  }, [compra]);
  const [mejor, ...otras] = compra && vistas ? vistas.tarjetas : [];
  const preferencias = useAlmacen(s => s.preferencias);
  // Decisión D67: en una compra en la moneda secundaria, avisar si la mejor la convierte.
  // Decisión D69: si la mejor está por cortar (semáforo en rojo), cuántos días daría esperar al
  // día después del corte, con la mejor tarjeta de ese día (puede ser otra).
  const esperar = useMemo(() => {
    if (!mejor?.esperar || !vistas) return null;
    const [luego] = calcularRanking({ ...vistas.entrada, hoy: mejor.esperar.fecha }).ranking;
    if (!luego || luego.diasGracia - mejor.resultado.diasGracia < DIAS_MINIMOS_AL_ESPERAR) return null;
    return { fecha: mejor.esperar.fecha, dias: luego.diasGracia, tarjetaId: luego.tarjetaId };
  }, [mejor, vistas]);
  const conConversion = !!mejor && !!preferencias && moneda !== config.monedaPrincipal && mejor.tarjeta.monedaFacturacion === 'solo_principal';

  const monedas = [config.monedaPrincipal, ...(config.monedaSecundaria ? [config.monedaSecundaria] : [])];
  const simbolo = simboloMoneda(moneda, idioma);
  // El detalle muestra la tarjeta para el mismo día que la consulta.
  const abrir = (v: VistaTarjeta) => router.push({ pathname: '/tarjeta/[id]', params: otroDia ? { id: v.tarjeta.id, fecha } : { id: v.tarjeta.id } });
  const esperarElegible = !!esperar && fechaCompraValida(esperar.fecha, hoy) === esperar.fecha;
  const riesgo = mejor ? riesgoIntereses(mejor.tarjeta, fecha, hoy, config) : null;
  const aliasDe = (id: string) => tarjetas.find(x => x.id === id)?.alias ?? '';
  const ganancia = mejor && compra ? valorRecompensaCompra(mejor.tarjeta, mejor.resultado, { t: t as unknown as Traducir, pais: config, idioma }, compra) : null;

  return (
    <Pantalla arriba={<BarraSuperior titulo={t('compra.titulo')} cerrar={volver} />}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Los datos de la compra en una tarjeta: el día (casi siempre hoy, por eso discreto), el
          monto, que es lo único que hay que escribir, y la moneda. */}
      <Superficie radio={tema.radio.destacada} style={{ alignItems: 'center', gap: 14, paddingVertical: 26, paddingHorizontal: 22 }}>
        <BotonPastilla
          icono="calendario"
          titulo={fechaVisible}
          etiquetaAccesible={t('compra.diaDeLaCompra', { dia: fechaVisible })}
          onPress={() => setEligiendo(true)}
          neutra
          desplegable
        />
        <Texto color="textoSecundario">{t('compra.monto')}</Texto>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <Texto variante="cifra" color="textoSecundario">
            {simbolo}
          </Texto>
          <TextInput
            accessibilityLabel={t('compra.monto')}
            value={texto}
            onChangeText={x => setTexto(x.replace(/[^\d.,]/g, ''))}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={tema.color.textoSecundario}
            allowFontScaling
            autoFocus
            cursorColor={tema.color.primario}
            selectionColor={tema.color.primario}
            style={[tema.texto.cifraEntrada, { minWidth: 60, color: tema.color.texto, padding: 0 }]}
          />
        </View>
        {monedas.length > 1 ? (
          <View style={{ alignSelf: 'stretch' }}>
            <ControlSegmentado
              etiqueta={t('compra.moneda')}
              opciones={monedas.map(m => ({ valor: m, etiqueta: t(`monedas.${m}`, { defaultValue: m }) }))}
              valor={moneda}
              onCambio={setMoneda}
            />
          </View>
        ) : null}
      </Superficie>

      <SelectorFechaCompra visible={eligiendo} hoy={hoy} valor={fecha} onCambio={setElegida} onCerrar={() => setEligiendo(false)} />

      {/* Sin monto todavía: qué va a aparecer aquí, en vez de un espacio vacío. */}
      {!compra ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            padding: tema.espacio.l,
            borderRadius: tema.radio.lista,
            borderWidth: 1.5,
            borderStyle: 'dashed',
            borderColor: tema.color.borde,
          }}
        >
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: tema.color.neutroFondo, alignItems: 'center', justifyContent: 'center' }}>
            <Icono nombre="tarjetas" color="primario" tamano={20} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Texto variante="cuerpoFuerte">{t('compra.vacioTitulo')}</Texto>
            <Texto variante="apoyoPequeno" color="textoSecundario">
              {t('compra.vacioTexto')}
            </Texto>
          </View>
        </View>
      ) : null}

      {mejor ? (
        <View style={{ gap: 10 }}>
          <Texto variante="etiquetaMayus" color="primario">
            {otroDia ? t('compra.usaEstaEl', { dia }) : t('compra.usaEsta')}
          </Texto>
          <Pressable
            accessibilityRole="button"
            onPress={() => abrir(mejor)}
            style={{ padding: 18, gap: 14, borderRadius: 24, backgroundColor: tema.color.destacado, boxShadow: tema.sombra.destacada }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: tema.espacio.m }}>
              {mejor.iniciales ? <ChipBanco iniciales={mejor.iniciales} logo={mejor.logo} sobreDestacado /> : null}
              <Texto variante="cuerpoDestacado" color="sobreDestacado" style={{ flex: 1 }}>
                {mejor.tarjeta.alias}
              </Texto>
              <Icono nombre="check" color="sobreDestacado" tamano={22} grosor={2.5} />
            </View>
            <View style={{ flexDirection: 'row', gap: tema.espacio.m }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Texto variante="cifraDestacada" color="sobreDestacado">
                  {t('compra.diasN', { dias: mejor.resultado.diasGracia })}
                </Texto>
                <Texto variante="apoyoPequeno" color="sobreDestacado">
                  {t('compra.paraPagarla')}
                </Texto>
              </View>
              {ganancia ? (
                <View style={{ flex: 1, gap: 2 }}>
                  <Texto variante="cifraDestacada" color="sobreDestacado">
                    {ganancia.valor}
                  </Texto>
                  <Texto variante="apoyoPequeno" color="sobreDestacado">
                    {ganancia.texto}
                  </Texto>
                </View>
              ) : null}
            </View>
          </Pressable>
          {esperar ? (
            // Tocarlo calcula la compra para ese día, si cae dentro del mes (decisión D96).
            <Pressable
              accessibilityRole={esperarElegible ? 'button' : undefined}
              disabled={!esperarElegible}
              onPress={() => setElegida(esperar.fecha)}
              style={{ minHeight: tema.toqueMinimo, justifyContent: 'center' }}
            >
              <Texto variante="apoyo">
                {t(esperar.tarjetaId === mejor.tarjeta.id ? 'compra.esperar' : 'compra.esperarOtra', {
                  dia: diaConSemana(esperar.fecha, idioma, t as unknown as Traducir),
                  despues: esperar.dias,
                  antes: mejor.resultado.diasGracia,
                  alias: aliasDe(esperar.tarjetaId),
                })}
              </Texto>
              {esperarElegible ? (
                <Texto variante="apoyoFuerte" color="primario">
                  {t('compra.verEseDia')}
                </Texto>
              ) : null}
            </Pressable>
          ) : null}
          {riesgo ? (
            <Texto variante="apoyo">{t(riesgo.ya ? 'pagos.interesesYa' : 'pagos.interesesVencera', { fecha: textoFecha(riesgo.pago, idioma) })}</Texto>
          ) : null}
          {conConversion ? (
            <Texto variante="apoyo" color="alertaTexto">
              {t('compra.conversion', {
                moneda: t(`monedas.${config.monedaPrincipal}`).toLocaleLowerCase(idioma),
                monedaCompra: t(`monedas.${moneda}`).toLocaleLowerCase(idioma),
                porcentaje: preferencias?.diferencialCambiarioPct,
              })}
            </Texto>
          ) : null}
        </View>
      ) : null}

      {otras.length ? (
        <ListaAgrupada titulo={t('compra.otras')} sangria={70}>
          {otras.map(v => (
            <FilaTarjeta key={v.tarjeta.id} vista={v} onPress={() => abrir(v)} />
          ))}
        </ListaAgrupada>
      ) : null}
      {compra && vistas?.excluidas.length
        ? vistas.excluidas.map(e => (
            <Texto key={e.tarjetaId} variante="apoyo" color="textoSecundario">
              {t(e.motivo === 'solo_local_excluida' ? 'compra.excluidaLocal' : 'compra.excluidaPausa', { alias: aliasDe(e.tarjetaId) })}
            </Texto>
          ))
        : null}
    </Pantalla>
  );
}
