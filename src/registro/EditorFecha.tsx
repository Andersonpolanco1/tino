import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Campo, Opciones, useTema } from '../diseno';
import type { BorradorFechaLimite } from './borrador';

interface Props {
  etiqueta: string;
  valor: BorradorFechaLimite;
  onCambio: (valor: BorradorFechaLimite) => void;
  error?: string;
}

// Fecha límite como "día del mes" o "días después del corte" (sección 4.1).
export function EditorFecha({ etiqueta, valor, onCambio, error }: Props) {
  const tema = useTema();
  const { t } = useTranslation();
  return (
    <View style={{ gap: tema.espacio.s }}>
      <Opciones
        etiqueta={etiqueta}
        valor={valor.tipo}
        onCambio={tipo => onCambio({ ...valor, tipo })}
        opciones={[
          { valor: 'dia_del_mes', etiqueta: t('registro.diaDelMes') },
          { valor: 'dias_despues_corte', etiqueta: t('registro.diasDespues') },
        ]}
      />
      <Campo
        etiqueta={valor.tipo === 'dia_del_mes' ? t('registro.diaDelMesValor') : t('registro.diasDespuesValor')}
        value={valor.valor}
        onChangeText={texto => onCambio({ ...valor, valor: texto.replace(/\D/g, '') })}
        keyboardType="number-pad"
        maxLength={2}
        error={error}
      />
    </View>
  );
}
