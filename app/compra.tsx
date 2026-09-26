import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { CodigoMoneda } from '@/tipos/tipos';
import { BarraSuperior, ControlSegmentado, Icono, ListaAgrupada, Pantalla, Texto, useTema } from '@/diseno';
import { usePais } from '@/paises';
import { useAlmacen } from '@/estado';
import { useVistas, type VistaTarjeta } from '@/inicio/useVistas';
import { valorRecompensaCompra, type Traducir } from '@/inicio/vista';
import { FilaTarjeta } from '@/inicio/FilaTarjeta';
import { ChipBanco } from '@/inicio/ChipBanco';

// "Tengo una compra" (sección 7.5) con el rediseño: el monto en grande y el resultado al
// instante. La categoría llega en v2 (decisión D27).
export default function Compra() {
  const { t } = useTranslation();
  const tema = useTema();
  const router = useRouter();
  const { config, idioma } = usePais();
  const tarjetas = useAlmacen(s => s.tarjetas);
  const [texto, setTexto] = useState('');
  const [moneda, setMoneda] = useState<CodigoMoneda>(config.monedaPrincipal);

  const monto = Number(texto.replace(/,/g, ''));
  const compra = useMemo(() => (Number.isFinite(monto) && monto > 0 ? { monto, moneda } : undefined), [monto, moneda]);
  const vistas = useVistas({ compra });
  const [mejor, ...otras] = compra && vistas ? vistas.tarjetas : [];

  const monedas = [config.monedaPrincipal, ...(config.monedaSecundaria ? [config.monedaSecundaria] : [])];
  const simbolo = new Intl.NumberFormat(idioma, { style: 'currency', currency: moneda }).formatToParts(0).find(p => p.type === 'currency')?.value ?? moneda;
  const abrir = (v: VistaTarjeta) => router.push({ pathname: '/tarjeta/[id]', params: { id: v.tarjeta.id } });
  const aliasDe = (id: string) => tarjetas.find(x => x.id === id)?.alias ?? '';
  const ganancia = mejor && compra ? valorRecompensaCompra(mejor.tarjeta, mejor.resultado, { t: t as unknown as Traducir, pais: config, idioma }, compra) : null;

  return (
    <Pantalla arriba={<BarraSuperior izquierda={{ tipo: 'cerrar', onPress: () => router.back() }} titulo={t('compra.titulo')} />}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ alignItems: 'center', gap: 14, paddingTop: tema.espacio.s }}>
        <Texto color="textoSecundario">{t('compra.monto')}</Texto>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <Texto variante="cifra" color="textoSecundario" style={{ fontSize: 28 }}>
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
            style={[tema.texto.cifraGrande, { fontSize: 60, lineHeight: 68, minWidth: 120, color: tema.color.texto, padding: 0, letterSpacing: -1.5 }]}
          />
        </View>
        {monedas.length > 1 ? (
          <View style={{ width: 220 }}>
            <ControlSegmentado
              etiqueta={t('compra.moneda')}
              opciones={monedas.map(m => ({ valor: m, etiqueta: t(`monedas.${m}`, { defaultValue: m }) }))}
              valor={moneda}
              onCambio={setMoneda}
            />
          </View>
        ) : null}
      </View>

      {mejor ? (
        <View style={{ gap: 10 }}>
          <Texto variante="etiqueta" color="primario" style={{ fontSize: 13, letterSpacing: 0.6, textTransform: 'uppercase' }}>
            {t('compra.usaEsta')}
          </Texto>
          <Pressable
            accessibilityRole="button"
            onPress={() => abrir(mejor)}
            style={{ padding: 18, gap: 14, borderRadius: 24, backgroundColor: tema.color.destacado, boxShadow: tema.sombra.destacada }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: tema.espacio.m }}>
              {mejor.iniciales ? <ChipBanco iniciales={mejor.iniciales} sobreDestacado /> : null}
              <Texto variante="cuerpoFuerte" color="sobreDestacado" style={{ flex: 1, fontSize: 17 }}>
                {mejor.tarjeta.alias}
              </Texto>
              <Icono nombre="check" color="sobreDestacado" tamano={22} grosor={2.5} />
            </View>
            <View style={{ flexDirection: 'row', gap: tema.espacio.m }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Texto variante="cifra" color="sobreDestacado" style={{ fontSize: 34, lineHeight: 36 }}>
                  {t('compra.diasN', { dias: mejor.resultado.diasGracia })}
                </Texto>
                <Texto variante="apoyo" color="sobreDestacado" style={{ fontSize: 13 }}>
                  {t('compra.paraPagarla')}
                </Texto>
              </View>
              {ganancia ? (
                <View style={{ flex: 1, gap: 2 }}>
                  <Texto variante="cifra" color="sobreDestacado" style={{ fontSize: 34, lineHeight: 36 }}>
                    {ganancia.valor}
                  </Texto>
                  <Texto variante="apoyo" color="sobreDestacado" style={{ fontSize: 13 }}>
                    {ganancia.texto}
                  </Texto>
                </View>
              ) : null}
            </View>
          </Pressable>
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
