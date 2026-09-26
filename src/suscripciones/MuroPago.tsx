import { useEffect, useState } from 'react';
import { Alert, Linking, Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BarraSuperior, Boton, FilaLista, ListaAgrupada, Pantalla, Texto, useTema } from '../diseno';
import { registrarMuroPagoVisto } from '../analitica';
import { useComprasPro } from './useSuscripcion';
import type { OfertaPro } from './servicio';

export type MotivoMuro = 'tercera_tarjeta' | 'funcion_avanzada' | 'voluntario';

// Documentos legales publicados junto con la política de privacidad; sin dirección, no se muestran.
const URL_TERMINOS = process.env.EXPO_PUBLIC_URL_TERMINOS ?? '';
const URL_PRIVACIDAD = process.env.EXPO_PUBLIC_URL_PRIVACIDAD ?? '';

interface Props {
  motivo: MotivoMuro;
  onCerrar: () => void;
  // Pro quedó activo (compra o restauración).
  onPro: () => void;
}

// La oferta de Tino Pro (sección 15.2): con el límite del plan gratis, las 2 tarjetas existentes
// siguen funcionando igual (15.5). Precios y prueba gratis salen de la tienda, nunca del código.
export function MuroPago({ motivo, onCerrar, onPro }: Props) {
  const { t } = useTranslation();
  const tema = useTema();
  const { estado, ofertas, cargar, comprar, restaurar } = useComprasPro();
  const [elegida, setElegida] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const tienda = t(`pro.tienda.${Platform.OS === 'ios' ? 'ios' : 'android'}`);
  const oferta = ofertas.find(o => o.id === elegida) ?? ofertas[0];

  useEffect(() => {
    registrarMuroPagoVisto(motivo);
    cargar();
  }, [motivo, cargar]);

  const detalleDe = (o: OfertaPro) => {
    const precio = o.tipo === 'mensual' ? t('pro.porMes', { precio: o.precio }) : t('pro.porAnio', { precio: o.precio });
    const partes = [precio, ...(o.precioPorMes ? [t('pro.equivale', { precio: o.precioPorMes })] : [])];
    return partes.join(' · ');
  };
  const pruebaDe = (o: OfertaPro) => (o.prueba ? t(`pro.prueba.${o.prueba.unidad}`, { count: o.prueba.cantidad }) : null);

  async function suscribirme() {
    if (!oferta) return;
    setOcupado(true);
    try {
      if ((await comprar(oferta.id)) === 'pro') onPro();
    } catch {
      Alert.alert(t('pro.errorCompra'));
    } finally {
      setOcupado(false);
    }
  }

  async function restaurarCompras() {
    setOcupado(true);
    try {
      if (await restaurar()) {
        Alert.alert(t('pro.restaurado'));
        onPro();
      } else Alert.alert(t('pro.nadaQueRestaurar', { tienda }));
    } catch {
      Alert.alert(t('pro.errorCompra'));
    } finally {
      setOcupado(false);
    }
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
            const prueba = pruebaDe(o);
            return (
              <FilaLista
                key={o.id}
                titulo={t(`pro.oferta.${o.tipo}`)}
                detalle={detalleDe(o)}
                debajo={
                  prueba || o.tipo === 'lanzamiento' ? (
                    <Texto variante="apoyo" color="primario" style={{ fontSize: 13 }}>
                      {[prueba, o.tipo === 'lanzamiento' ? t('pro.lanzamientoDetalle') : null].filter(Boolean).join(' · ')}
                    </Texto>
                  ) : undefined
                }
                seleccionada={o.id === oferta?.id}
                onPress={() => setElegida(o.id)}
              />
            );
          })}
        </ListaAgrupada>
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
