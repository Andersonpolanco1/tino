import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ResultadoTarjeta } from '../tipos/tipos';
import { Icono, Texto, useTema, type NombreIcono, type RolColor } from '../diseno';

type Luz = ResultadoTarjeta['semaforo'];

export const ICONO_SEMAFORO: Record<Luz, NombreIcono> = { verde: 'check', amarillo: 'reloj', rojo: 'alto' };

// Colores de la píldora sobre superficie: verde en jade, amarillo en oro, rojo en coral (rediseño).
const TONO: Record<Luz, { fondo: RolColor; texto: RolColor }> = {
  verde: { fondo: 'neutroFondo', texto: 'semaforoVerde' },
  amarillo: { fondo: 'recompensaFondo', texto: 'semaforoAmarillo' },
  rojo: { fondo: 'alertaFondo', texto: 'semaforoRojo' },
};

// Sección 3.4: ícono más texto, para que el estado nunca dependa solo del color.
// "sobreDestacado": la píldora translúcida dentro de la tarjeta de hoy.
export function PildoraSemaforo({ luz, sobreDestacado = false }: { luz: Luz; sobreDestacado?: boolean }) {
  const tema = useTema();
  const { t } = useTranslation();
  const color: RolColor = sobreDestacado ? 'sobreDestacado' : TONO[luz].texto;
  return (
    <View
      accessible
      accessibilityLabel={t(`semaforo.${luz}`)}
      style={{ alignSelf: 'flex-start', borderRadius: tema.radio.circular, overflow: 'hidden' }}
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          sobreDestacado ? { backgroundColor: tema.color.sobreDestacado, opacity: tema.modo === 'oscuro' ? 0.12 : 0.18 } : { backgroundColor: tema.color[TONO[luz].fondo] },
        ]}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: tema.espacio.m, paddingVertical: 7 }}>
        <Icono nombre={ICONO_SEMAFORO[luz]} color={color} tamano={14} grosor={3} />
        <Texto variante="cuerpoFuerte" color={color} style={{ fontSize: 13 }}>
          {t(`semaforo.${luz}`)}
        </Texto>
      </View>
    </View>
  );
}
