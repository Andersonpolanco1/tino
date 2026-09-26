import { useEffect, useState } from 'react';
import { Alert, Linking, Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BarraSuperior, Boton, FilaLista, Icono, ListaAgrupada, Pantalla, Texto, useTema } from '../diseno';
import { registrarMuroPagoVisto } from '../analitica';
import { DIAS_ANTES_FIN_PRUEBA } from '../notificaciones/planificar';
import { useComprasPro } from './useSuscripcion';
import { ahorroAnual, type OfertaPro } from './servicio';

export type MotivoMuro = 'tercera_tarjeta' | 'funcion_avanzada' | 'voluntario';

// Documentos legales publicados junto con la política de privacidad; sin dirección, no se muestran.
const URL_TERMINOS = process.env.EXPO_PUBLIC_URL_TERMINOS ?? '';
const URL_PRIVACIDAD = process.env.EXPO_PUBLIC_URL_PRIVACIDAD ?? '';

interface Props {
  motivo: MotivoMuro;
  onCerrar: () => void;
  // Pro quedó activo y el usuario tocó "Continuar".
  onPro: () => void;
}

// La oferta de Tino Pro (sección 15.2 y decisión D59). Con el límite del plan gratis, las 2
// tarjetas existentes siguen funcionando igual (15.5). Precios y prueba gratis salen de la tienda,
// nunca del código, y lo que se cobra se ve más que la prueba (norma 3.1.2 de Apple).
export function MuroPago({ motivo, onCerrar, onPro }: Props) {
  const { t } = useTranslation();
  const tema = useTema();
  const { estado, ofertas, cargar, comprar, restaurar } = useComprasPro();
  const [elegida, setElegida] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [listo, setListo] = useState<'compra' | 'prueba' | 'restaurada' | null>(null);
  const tienda = t(`pro.tienda.${Platform.OS === 'ios' ? 'ios' : 'android'}`);
  const oferta = ofertas.find(o => o.id === elegida) ?? ofertas[0];

  useEffect(() => {
    registrarMuroPagoVisto(motivo);
    cargar();
  }, [motivo, cargar]);

  const periodo = (o: OfertaPro) => (o.tipo === 'mensual' ? t('pro.alMes') : t('pro.alAnio'));
  const precioConPeriodo = (o: OfertaPro) => (o.tipo === 'mensual' ? t('pro.porMes', { precio: o.precio }) : t('pro.porAnio', { precio: o.precio }));
  const duracion = (o: OfertaPro) => (o.prueba ? t(`pro.duracion.${o.prueba.unidad}`, { count: o.prueba.cantidad }) : '');

  async function suscribirme() {
    if (!oferta) return;
    setOcupado(true);
    try {
      const resultado = await comprar(oferta.id);
      if (resultado === 'pro') setListo(oferta.prueba ? 'prueba' : 'compra');
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
      if (await restaurar()) setListo('restaurada');
      else Alert.alert(t('pro.nadaQueRestaurar', { tienda }));
    } catch {
      Alert.alert(t('pro.errorCompra'));
    } finally {
      setOcupado(false);
    }
  }

  // Confirmación: el pago se hizo y el usuario sabe qué sigue.
  if (listo) {
    return (
      <Pantalla pie={<Boton titulo={t('pro.continuar')} onPress={onPro} />}>
        <View style={{ gap: tema.espacio.l, paddingTop: tema.espacio.xl }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: tema.color.primario, alignItems: 'center', justifyContent: 'center' }}>
            <Icono nombre="check" color="sobrePrimario" tamano={32} grosor={2.5} />
          </View>
          <Texto variante="titulo" accessibilityRole="header">
            {t('pro.listoTitulo')}
          </Texto>
          <Texto color="textoSecundario">
            {listo === 'prueba'
              ? t('pro.listoPrueba', { count: DIAS_ANTES_FIN_PRUEBA })
              : listo === 'restaurada'
                ? t('pro.restaurado')
                : t('pro.listoCompra')}
          </Texto>
        </View>
      </Pantalla>
    );
  }

  return (
    <Pantalla
      arriba={<BarraSuperior izquierda={{ tipo: 'cerrar', onPress: onCerrar }} />}
      pie={
        <>
          {estado === 'listo' && oferta ? (
            <Boton titulo={oferta.prueba ? t('pro.empezarPrueba') : t('pro.suscribirme')} onPress={suscribirme} deshabilitado={ocupado} />
          ) : null}
          {estado === 'error' ? <Boton titulo={t('pro.reintentar')} onPress={cargar} /> : null}
          <Boton titulo={t('pro.restaurar')} variante="texto" onPress={restaurarCompras} deshabilitado={ocupado || estado === 'sin_servicio'} />
        </>
      }
    >
      <View style={{ gap: tema.espacio.s }}>
        <Texto variante="etiqueta" color="primario" style={{ fontSize: 13, letterSpacing: 0.6, textTransform: 'uppercase' }}>
          {t('pro.nombre')}
        </Texto>
        <Texto variante="titulo" accessibilityRole="header">
          {t('pro.titulo')}
        </Texto>
        <Texto color="textoSecundario">{motivo === 'tercera_tarjeta' ? t('pro.porLimite') : t('pro.voluntario')}</Texto>
      </View>

      <ListaAgrupada sangria={16}>
        <FilaLista icono="tarjetas" titulo={t('pro.beneficioTarjetas')} detalle={t('pro.beneficioTarjetasDetalle')} />
        <FilaLista icono="check" titulo={t('pro.beneficioDatos')} detalle={t('pro.beneficioDatosDetalle')} />
      </ListaAgrupada>
      <Texto variante="cuerpoFuerte">{t('pro.mensaje')}</Texto>

      {estado === 'cargando' ? <Texto color="textoSecundario">{t('pro.cargando')}</Texto> : null}
      {estado === 'error' ? <Texto color="textoSecundario">{t('pro.error')}</Texto> : null}
      {estado === 'sin_servicio' ? <Texto color="textoSecundario">{t('pro.sinServicio')}</Texto> : null}
      {estado === 'listo' ? (
        <ListaAgrupada sangria={16}>
          {ofertas.map(o => {
            const ahorro = ahorroAnual(o, ofertas);
            const destacados = [ahorro ? t('pro.ahorra', { porcentaje: ahorro }) : null, o.tipo === 'lanzamiento' ? t('pro.lanzamientoDetalle') : null].filter(Boolean);
            const detalle = o.prueba
              ? t('pro.pruebaLuego', { duracion: duracion(o), precio: precioConPeriodo(o) })
              : o.precioPorMes
                ? t('pro.equivale', { precio: o.precioPorMes })
                : undefined;
            return (
              <FilaLista
                key={o.id}
                titulo={t(`pro.oferta.${o.tipo}`)}
                detalle={detalle}
                debajo={
                  destacados.length ? (
                    <Texto variante="apoyo" color="primario" style={{ fontSize: 13, fontFamily: tema.texto.cuerpoFuerte.fontFamily }}>
                      {destacados.join(' · ')}
                    </Texto>
                  ) : undefined
                }
                derecha={
                  <View style={{ alignItems: 'flex-end' }}>
                    <Texto variante="cuerpoFuerte" style={{ fontSize: 17 }}>
                      {o.precio}
                    </Texto>
                    <Texto variante="apoyo" color="textoSecundario" style={{ fontSize: 13 }}>
                      {periodo(o)}
                    </Texto>
                  </View>
                }
                etiquetaAccesible={[t(`pro.oferta.${o.tipo}`), precioConPeriodo(o), detalle, ...destacados].filter(Boolean).join('. ')}
                seleccionada={o.id === oferta?.id}
                onPress={() => setElegida(o.id)}
              />
            );
          })}
        </ListaAgrupada>
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

      {estado === 'listo' ? (
        <Texto variante="apoyo" color="textoSecundario" style={{ fontSize: 13 }}>
          {t('pro.condiciones', { tienda })}
        </Texto>
      ) : null}
      {URL_TERMINOS || URL_PRIVACIDAD ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tema.espacio.m }}>
          {URL_TERMINOS ? <Boton titulo={t('pro.terminos')} variante="texto" onPress={() => Linking.openURL(URL_TERMINOS)} /> : null}
          {URL_PRIVACIDAD ? <Boton titulo={t('pro.privacidad')} variante="texto" onPress={() => Linking.openURL(URL_PRIVACIDAD)} /> : null}
        </View>
      ) : null}
    </Pantalla>
  );
}
