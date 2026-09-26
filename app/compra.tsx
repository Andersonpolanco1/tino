import { useState } from 'react';
import { View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { CodigoMoneda } from '@/tipos/tipos';
import { Boton, Campo, EtiquetaConInfo, Opciones, Pantalla, Texto, useTema } from '@/diseno';
import { usePais } from '@/paises';
import { useAlmacen } from '@/estado';
import { useVistas, type VistaTarjeta } from '@/inicio/useVistas';
import { TarjetaDestacada } from '@/inicio/TarjetaDestacada';
import { FilaTarjeta } from '@/inicio/FilaTarjeta';

// "Tengo una compra" (sección 7.5): monto y moneda; la categoría llega en v2 (decisión D27).
export default function Compra() {
  const { t } = useTranslation();
  const tema = useTema();
  const router = useRouter();
  const { config } = usePais();
  const tarjetas = useAlmacen(s => s.tarjetas);
  const [texto, setTexto] = useState('');
  const [moneda, setMoneda] = useState<CodigoMoneda>(config.monedaPrincipal);
  const [compra, setCompra] = useState<{ monto: number; moneda: CodigoMoneda } | undefined>();
  const [error, setError] = useState<string>();
  const vistas = useVistas({ compra });

  const monedas = [config.monedaPrincipal, ...(config.monedaSecundaria ? [config.monedaSecundaria] : [])];
  const nombreMoneda = (codigo: string) => t(`monedas.${codigo}`, { defaultValue: codigo });

  function calcular() {
    const monto = Number(texto.replace(/,/g, ''));
    if (!Number.isFinite(monto) || monto <= 0) return setError(t('compra.montoInvalido'));
    setError(undefined);
    setCompra({ monto, moneda });
  }

  const abrir = (v: VistaTarjeta) => router.push({ pathname: '/tarjeta/[id]', params: { id: v.tarjeta.id } });
  const aliasDe = (id: string) => tarjetas.find(x => x.id === id)?.alias ?? '';
  const [mejor, ...otras] = compra && vistas ? vistas.tarjetas : [];

  return (
    <Pantalla conEncabezado>
      <Stack.Screen options={{ headerShown: true, title: t('compra.titulo') }} />
      <EtiquetaConInfo etiqueta={t('compra.titulo')} info={t('compra.info')} variante="titulo" encabezado />
      <Campo
        etiqueta={t('compra.monto')}
        value={texto}
        onChangeText={x => setTexto(x.replace(/[^\d.,]/g, ''))}
        keyboardType="decimal-pad"
        error={error}
        onSubmitEditing={calcular}
      />
      {monedas.length > 1 ? (
        <Opciones
          etiqueta={t('compra.moneda')}
          opciones={monedas.map(m => ({ valor: m, etiqueta: nombreMoneda(m) }))}
          valor={moneda}
          onCambio={setMoneda}
        />
      ) : null}
      <Boton titulo={t('compra.calcular')} onPress={calcular} />

      {mejor ? (
        <View style={{ gap: tema.espacio.m }}>
          <Texto variante="subtitulo">{t('compra.mejor')}</Texto>
          <TarjetaDestacada vista={mejor} onPress={() => abrir(mejor)} />
          {otras.length ? (
            <>
              <Texto variante="cuerpoFuerte" color="textoSecundario">
                {t('compra.otras')}
              </Texto>
              {otras.map(v => (
                <FilaTarjeta key={v.tarjeta.id} vista={v} onPress={() => abrir(v)} />
              ))}
            </>
          ) : null}
          {vistas?.excluidas.map(e => (
            <Texto key={e.tarjetaId} variante="apoyo" color="textoSecundario">
              {t(e.motivo === 'solo_local_excluida' ? 'compra.excluidaLocal' : 'compra.excluidaPausa', { alias: aliasDe(e.tarjetaId) })}
            </Texto>
          ))}
        </View>
      ) : null}
    </Pantalla>
  );
}
