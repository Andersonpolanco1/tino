import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { Tarjeta } from '@/tipos/tipos';
import { Boton, Fila, Interruptor, Pantalla, Texto, useTema } from '@/diseno';
import { useAlmacen } from '@/estado';
import { View } from 'react-native';

export default function Tarjetas() {
  const { t } = useTranslation();
  const tema = useTema();
  const router = useRouter();
  const tarjetas = useAlmacen(s => s.tarjetas);
  const alternarPausa = useAlmacen(s => s.alternarPausa);

  const pago = (tarjeta: Tarjeta) =>
    tarjeta.fechaLimite.tipo === 'dia_del_mes'
      ? t('tarjetas.pagoDia', { dia: tarjeta.fechaLimite.dia })
      : t('tarjetas.pagoDias', { dias: tarjeta.fechaLimite.dias });

  return (
    <Pantalla>
      <Texto variante="titulo" accessibilityRole="header">
        {t('tarjetas.titulo')}
      </Texto>
      {tarjetas.length === 0 ? <Texto color="textoSecundario">{t('tarjetas.vacio')}</Texto> : null}
      {tarjetas.map(tarjeta => (
        <View key={tarjeta.id} style={{ gap: tema.espacio.xs }}>
          <Fila
            titulo={tarjeta.alias}
            detalle={t('tarjetas.corteYPago', { corte: tarjeta.diaCorte, pago: pago(tarjeta) })}
            onPress={() => router.push({ pathname: '/tarjeta/editar/[id]', params: { id: tarjeta.id } })}
          />
          <Interruptor
            etiqueta={t('registro.enPausa')}
            valor={tarjeta.enPausa}
            onCambio={() => alternarPausa(tarjeta.id)}
          />
        </View>
      ))}
      <Boton titulo={t('tarjetas.agregar')} onPress={() => router.push('/tarjeta/nueva')} />
    </Pantalla>
  );
}
