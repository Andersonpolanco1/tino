import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ResultadoTarjeta } from '../tipos/tipos';
import { Icono, Texto, useTema, type NombreIcono, type RolColor } from '../diseno';

type Luz = ResultadoTarjeta['semaforo'];

const COLOR: Record<Luz, RolColor> = { verde: 'semaforoVerde', amarillo: 'semaforoAmarillo', rojo: 'semaforoRojo' };
export const ICONO_SEMAFORO: Record<Luz, NombreIcono> = { verde: 'check', amarillo: 'reloj', rojo: 'alto' };

// Sección 3.4: punto de color más texto, para que el estado nunca dependa solo del color.
export function Semaforo({ luz, grande = false }: { luz: Luz; grande?: boolean }) {
  const tema = useTema();
  const { t } = useTranslation();
  return (
    <View
      accessible
      accessibilityLabel={t(`semaforo.${luz}`)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: tema.espacio.s }}
    >
      <Icono nombre={ICONO_SEMAFORO[luz]} color={COLOR[luz]} tamano={grande ? tema.espacio.xxl + tema.espacio.s : undefined} />
      <Texto variante={grande ? 'titulo' : 'cuerpoFuerte'} color={COLOR[luz]}>
        {t(`semaforo.${luz}`)}
      </Texto>
    </View>
  );
}
