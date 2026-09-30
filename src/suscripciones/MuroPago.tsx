import { useEffect, useState } from 'react';
import { Alert, Linking, Platform, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BarraSuperior, Boton, FilaLista, Icono, ListaAgrupada, Pantalla, Superficie, Texto, useTema, type NombreIcono } from '../diseno';
import { registrarMuroPagoVisto } from '../analitica';
import { DIAS_ANTES_FIN_PRUEBA } from '../notificaciones/planificar';
import { useComprasPro } from './useSuscripcion';
import { ahorroAnual, type OfertaPro } from './servicio';
import { DOCUMENTOS } from '../privacidad/terminos';

export type MotivoMuro = 'tercera_tarjeta' | 'funcion_avanzada' | 'voluntario';

interface Props {
  motivo: MotivoMuro;
  onCerrar: () => void;
  // Pro quedó activo y el usuario tocó el botón de la confirmación.
  onPro: () => void;
}

type Traducir = (clave: string, opciones?: Record<string, unknown>) => string;

function textos(t: Traducir) {
  return {
    periodo: (o: OfertaPro) => (o.tipo === 'mensual' ? t('pro.alMes') : t('pro.alAnio')),
    precioConPeriodo: (o: OfertaPro) => (o.tipo === 'mensual' ? t('pro.porMes', { precio: o.precio }) : t('pro.porAnio', { precio: o.precio })),
    duracion: (o: OfertaPro) => (o.prueba ? t(`pro.duracion.${o.prueba.unidad}`, { count: o.prueba.cantidad }) : ''),
  };
}

// La oferta de Tino Pro (sección 15.2 y decisiones D59 y D60). Con el límite del plan gratis, las
// 2 tarjetas existentes siguen funcionando igual (15.5). Precios y prueba salen de la tienda, nunca
// del código, y lo que se cobra se ve más que la prueba (norma 3.1.2 de Apple).
export function MuroPago({ motivo, onCerrar, onPro }: Props) {
  const { t } = useTranslation();
  const tema = useTema();
  const { estado, ofertas, cargar, comprar, restaurar } = useComprasPro();
  const [elegida, setElegida] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [listo, setListo] = useState<{ tipo: 'compra' | 'prueba' | 'restaurada'; oferta?: OfertaPro } | null>(null);
  const tienda = t(`pro.tienda.${Platform.OS === 'ios' ? 'ios' : 'android'}`);
  const oferta = ofertas.find(o => o.id === elegida) ?? ofertas[0];
  const { precioConPeriodo, duracion } = textos(t as unknown as Traducir);

  useEffect(() => {
    registrarMuroPagoVisto(motivo);
    cargar();
  }, [motivo, cargar]);

  async function suscribirme() {
    if (!oferta) return;
    setOcupado(true);
    try {
      const resultado = await comprar(oferta.id);
      if (resultado === 'pro') setListo({ tipo: oferta.prueba ? 'prueba' : 'compra', oferta });
      else if (resultado === 'pendiente') Alert.alert(t('pro.pendienteTitulo'), t('pro.pendiente', { tienda }));
    } catch {
      Alert.alert(t('pro.errorCompra'));
    } finally {
      setOcupado(false);
    }
  }

  async function restaurarCompras() {
    setOcupado(true);
    try {
      if (await restaurar()) setListo({ tipo: 'restaurada' });
      else Alert.alert(t('pro.nadaQueRestaurar', { tienda }));
    } catch {
      Alert.alert(t('pro.errorCompra'));
    } finally {
      setOcupado(false);
    }
  }

  if (listo) return <Confirmacion listo={listo} motivo={motivo} onPro={onPro} />;

  const beneficios: [NombreIcono, string, string][] = [
    ['tarjetas', t('pro.beneficioTarjetas'), t('pro.beneficioTarjetasDetalle')],
    ['nube', t('pro.beneficioRespaldo'), t('pro.beneficioRespaldoDetalle')],
    ['check', t('pro.beneficioDatos'), t('pro.beneficioDatosDetalle')],
  ];

  return (
    <Pantalla
      arriba={<BarraSuperior cerrar={onCerrar} />}
      pie={
        <>
          {estado === 'listo' && oferta ? (
            <Boton
              titulo={oferta.prueba ? t('pro.empezarPrueba') : t('pro.suscribirmePor', { precio: precioConPeriodo(oferta) })}
              onPress={suscribirme}
              deshabilitado={ocupado}
            />
          ) : null}
          {estado === 'error' ? <Boton titulo={t('pro.reintentar')} onPress={cargar} /> : null}
          <Boton titulo={t('pro.restaurar')} variante="texto" onPress={restaurarCompras} deshabilitado={ocupado || estado === 'sin_servicio'} />
        </>
      }
    >
      {/* Encabezado de marca: el mismo verde de la tarjeta de hoy. */}
      <View style={{ backgroundColor: tema.color.destacado, borderRadius: tema.radio.destacada, padding: 22, gap: 18, boxShadow: tema.sombra.destacada }}>
        <View style={{ gap: tema.espacio.s }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: tema.espacio.s }}>
            <Icono nombre="estrella" color="sobreDestacado" tamano={16} grosor={2.2} />
            <Texto variante="etiqueta" color="sobreDestacado" style={{ fontSize: 13, letterSpacing: 0.8, textTransform: 'uppercase' }}>
              {t('pro.nombre')}
            </Texto>
          </View>
          <Texto variante="titulo" color="sobreDestacado" accessibilityRole="header" style={{ fontSize: 28, lineHeight: 33, letterSpacing: -0.4 }}>
            {t('pro.titulo')}
          </Texto>
          <Texto color="sobreDestacado">{motivo === 'tercera_tarjeta' ? t('pro.porLimite') : t('pro.voluntario')}</Texto>
        </View>
        <View style={{ gap: 14 }}>
          {beneficios.map(([icono, titulo, detalle]) => (
            <View key={titulo} style={{ flexDirection: 'row', gap: tema.espacio.m, alignItems: 'flex-start' }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: tema.color.sobreDestacado, alignItems: 'center', justifyContent: 'center' }}>
                <Icono nombre={icono} color="sobreDestacado" tamano={16} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Texto variante="cuerpoFuerte" color="sobreDestacado">
                  {titulo}
                </Texto>
                <Texto variante="apoyo" color="sobreDestacado" style={{ fontSize: 13 }}>
                  {detalle}
                </Texto>
              </View>
            </View>
          ))}
        </View>
        <Texto variante="apoyo" color="sobreDestacado" style={{ fontFamily: tema.texto.cuerpoFuerte.fontFamily }}>
          {t('pro.mensaje')}
        </Texto>
      </View>

      {estado === 'cargando' ? <Texto color="textoSecundario">{t('pro.cargando')}</Texto> : null}
      {estado === 'error' ? <Texto color="textoSecundario">{t('pro.error')}</Texto> : null}
      {estado === 'sin_servicio' ? <Texto color="textoSecundario">{t('pro.sinServicio')}</Texto> : null}
      {estado === 'listo' ? (
        <View accessibilityRole="radiogroup" style={{ gap: tema.espacio.l, paddingTop: tema.espacio.s }}>
          {ofertas.map(o => (
            <OpcionPlan key={o.id} oferta={o} ofertas={ofertas} elegida={o.id === oferta?.id} onPress={() => setElegida(o.id)} />
          ))}
        </View>
      ) : null}

      {/* Qué pasa durante la prueba, y el aviso antes del cobro que Tino sí envía (D59). */}
      {estado === 'listo' && oferta?.prueba ? (
        <View style={{ gap: tema.espacio.s }}>
          <Texto variante="subtitulo" accessibilityRole="header">
            {t('pro.comoFunciona')}
          </Texto>
          <ListaAgrupada sangria={16}>
            <FilaLista icono="check" titulo={t('pro.pasoHoy')} detalle={t('pro.pasoHoyDetalle')} />
            <FilaLista icono="reloj" titulo={t('pro.pasoAviso', { count: DIAS_ANTES_FIN_PRUEBA })} detalle={t('pro.pasoAvisoDetalle')} />
            <FilaLista
              icono="moneda"
              titulo={t('pro.pasoCobro', { duracion: duracion(oferta) })}
              detalle={t('pro.pasoCobroDetalle', { precio: precioConPeriodo(oferta), tienda })}
            />
          </ListaAgrupada>
        </View>
      ) : null}

      {estado === 'listo' && oferta ? (
        <Texto variante="apoyo" color="textoSecundario" style={{ fontSize: 13, textAlign: 'center' }}>
          {oferta.prueba ? t('pro.condicionesPrueba', { tienda }) : t('pro.condiciones', { tienda })}
        </Texto>
      ) : null}
      {DOCUMENTOS.terminos || DOCUMENTOS.privacidad ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: tema.espacio.m }}>
          {DOCUMENTOS.terminos ? <Boton titulo={t('pro.terminos')} variante="texto" onPress={() => Linking.openURL(DOCUMENTOS.terminos)} /> : null}
          {DOCUMENTOS.privacidad ? <Boton titulo={t('pro.privacidad')} variante="texto" onPress={() => Linking.openURL(DOCUMENTOS.privacidad)} /> : null}
        </View>
      ) : null}
    </Pantalla>
  );
}

// Un plan como tarjeta seleccionable: círculo de selección a la izquierda, precio fijo a la
// derecha y borde verde cuando está elegido. El ahorro va en una pastilla sobre el borde.
function OpcionPlan({ oferta: o, ofertas, elegida, onPress }: { oferta: OfertaPro; ofertas: OfertaPro[]; elegida: boolean; onPress: () => void }) {
  const { t } = useTranslation();
  const tema = useTema();
  const { periodo, precioConPeriodo, duracion } = textos(t as unknown as Traducir);
  const ahorro = ahorroAnual(o, ofertas);
  const detalle = o.prueba
    ? t('pro.pruebaLuego', { duracion: duracion(o), precio: precioConPeriodo(o) })
    : o.precioPorMes
      ? t('pro.equivale', { precio: o.precioPorMes })
      : null;
  const extra = o.tipo === 'lanzamiento' ? t('pro.lanzamientoDetalle') : null;
  const nombre = t(`pro.oferta.${o.tipo}`);

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: elegida, checked: elegida }}
      accessibilityLabel={[nombre, precioConPeriodo(o), detalle, ahorro ? t('pro.ahorra', { porcentaje: ahorro }) : null, extra].filter(Boolean).join('. ')}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        minHeight: tema.toqueMinimo + tema.espacio.l,
        paddingVertical: 18,
        paddingHorizontal: tema.espacio.l,
        borderRadius: tema.radio.tarjeta,
        borderWidth: 2,
        borderColor: elegida ? tema.color.primario : tema.color.divisor,
        backgroundColor: tema.color.superficie,
        boxShadow: elegida ? tema.sombra.boton : undefined,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: elegida ? tema.color.primario : tema.color.textoSecundario,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {elegida ? <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: tema.color.primario }} /> : null}
      </View>
      <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
        <Texto variante="cuerpoFuerte" style={{ fontSize: 17 }}>
          {nombre}
        </Texto>
        {detalle ? (
          <Texto variante="apoyo" color="textoSecundario" style={{ fontSize: 13 }}>
            {detalle}
          </Texto>
        ) : null}
        {extra ? (
          <Texto variante="apoyo" color="primario" style={{ fontSize: 13, fontFamily: tema.texto.cuerpoFuerte.fontFamily }}>
            {extra}
          </Texto>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Texto variante="cifra" style={{ fontSize: 20, lineHeight: 24 }}>
          {o.precio}
        </Texto>
        <Texto variante="apoyo" color="textoSecundario" style={{ fontSize: 13 }}>
          {periodo(o)}
        </Texto>
      </View>
      {ahorro ? (
        <View
          style={{
            position: 'absolute',
            top: -11,
            right: tema.espacio.l,
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: tema.radio.circular,
            backgroundColor: tema.color.primario,
          }}
        >
          <Texto variante="etiqueta" color="sobrePrimario" style={{ fontSize: 12 }}>
            {t('pro.ahorra', { porcentaje: ahorro })}
          </Texto>
        </View>
      ) : null}
    </Pressable>
  );
}

// Confirmación: el pago se hizo, qué se desbloqueó y qué sigue.
function Confirmacion({ listo, motivo, onPro }: { listo: { tipo: 'compra' | 'prueba' | 'restaurada'; oferta?: OfertaPro }; motivo: MotivoMuro; onPro: () => void }) {
  const { t } = useTranslation();
  const tema = useTema();
  const { precioConPeriodo } = textos(t as unknown as Traducir);
  const texto =
    listo.tipo === 'prueba' ? t('pro.listoPrueba', { count: DIAS_ANTES_FIN_PRUEBA }) : listo.tipo === 'restaurada' ? t('pro.restaurado') : t('pro.listoCompra');
  return (
    <Pantalla pie={<Boton titulo={motivo === 'tercera_tarjeta' ? t('pro.agregarMiTarjeta') : t('pro.continuar')} onPress={onPro} />}>
      <View style={{ alignItems: 'center', gap: tema.espacio.l, paddingTop: tema.espacio.xxl }}>
        <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: tema.color.neutroFondo, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: tema.color.primario, alignItems: 'center', justifyContent: 'center', boxShadow: tema.sombra.destacada }}>
            <Icono nombre="check" color="sobrePrimario" tamano={40} grosor={2.8} />
          </View>
        </View>
        <Texto variante="titulo" accessibilityRole="header" style={{ textAlign: 'center' }}>
          {t('pro.listoTitulo')}
        </Texto>
        <Texto color="textoSecundario" style={{ textAlign: 'center' }}>
          {texto}
        </Texto>
      </View>
      <Superficie radio={tema.radio.lista} style={{ padding: tema.espacio.l, gap: 14 }}>
        {listo.oferta ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: tema.espacio.m, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: tema.color.divisor }}>
            <Texto variante="cuerpoFuerte">{t('pro.tuPlan', { plan: t(`pro.oferta.${listo.oferta.tipo}`) })}</Texto>
            <Texto color="textoSecundario">{precioConPeriodo(listo.oferta)}</Texto>
          </View>
        ) : null}
        {[t('pro.beneficioTarjetas'), t('pro.listoRespaldo'), t('pro.beneficioDatos')].map(beneficio => (
          <View key={beneficio} style={{ flexDirection: 'row', alignItems: 'center', gap: tema.espacio.m }}>
            <Icono nombre="check" color="primario" tamano={20} grosor={2.5} />
            <Texto>{beneficio}</Texto>
          </View>
        ))}
      </Superficie>
    </Pantalla>
  );
}
