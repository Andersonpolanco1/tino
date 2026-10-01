import { useEffect } from 'react';
import { Platform, useColorScheme } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import type { FechaISO } from '../tipos/tipos';
import { Hoja, useTema } from '../diseno';
import { aDateLocal, deDateLocal, limiteFechaCompra } from './fechaCompra';

interface Props {
  visible: boolean;
  hoy: FechaISO;
  valor: FechaISO;
  onCambio: (fecha: FechaISO) => void;
  onCerrar: () => void;
}

// Selector nativo de la fecha de la compra (decisión D96): solo hoy y el mes siguiente quedan
// habilitados. En Android es el diálogo del sistema; en iOS, el calendario dentro de una hoja.
// Sus colores los pone el sistema, salvo el acento y el modo, que salen del tema.
export function SelectorFechaCompra({ visible, hoy, valor, onCambio, onCerrar }: Props) {
  const { t } = useTranslation();
  const tema = useTema();
  const esquema = useColorScheme();
  const minimo = aDateLocal(hoy);
  const maximo = aDateLocal(limiteFechaCompra(hoy));

  useEffect(() => {
    if (!visible || Platform.OS !== 'android') return;
    DateTimePickerAndroid.open({
      value: aDateLocal(valor),
      mode: 'date',
      minimumDate: minimo,
      maximumDate: maximo,
      onChange: (evento, fecha) => {
        if (evento.type === 'set' && fecha) onCambio(deDateLocal(fecha));
        onCerrar();
      },
    });
    // Se abre una vez por cada vez que se pide; el diálogo vive fuera de React.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (Platform.OS === 'android') return null;
  return (
    <Hoja visible={visible} titulo={t('compra.cuando')} onCerrar={onCerrar} cerrarEtiqueta={t('comun.cerrar')}>
      <DateTimePicker
        value={aDateLocal(valor)}
        mode="date"
        display="inline"
        minimumDate={minimo}
        maximumDate={maximo}
        accentColor={tema.color.primario}
        themeVariant={esquema === 'dark' ? 'dark' : 'light'}
        onChange={(_, fecha) => {
          if (!fecha) return;
          onCambio(deDateLocal(fecha));
          onCerrar();
        }}
      />
    </Hoja>
  );
}
