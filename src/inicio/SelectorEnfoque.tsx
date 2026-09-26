import { useState } from 'react';
import { LayoutAnimation, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ModoEnfoque } from '../tipos/tipos';
import { ControlSegmentado, FilaLista, Hoja, Icono, ListaAgrupada, Texto, useTema } from '../diseno';
import { useAlmacen } from '../estado';

// Sección 6.2: los 4 modos del MVP.
export const MODOS_ENFOQUE: ModoEnfoque[] = ['equilibrado', 'liquidez', 'puntos', 'cashback'];

// Hoja con los modos de enfoque; cambia el enfoque guardado, que también usan el widget y las
// notificaciones (sección 3.1).
export function HojaEnfoque({ visible, onCerrar }: { visible: boolean; onCerrar: () => void }) {
  const { t } = useTranslation();
  const preferencias = useAlmacen(s => s.preferencias);
  const guardarPreferencias = useAlmacen(s => s.guardarPreferencias);
  const actual = preferencias?.enfoque.modo;

  async function elegir(modo: ModoEnfoque) {
    onCerrar();
    if (preferencias && modo !== actual) await guardarPreferencias({ ...preferencias, enfoque: { modo } });
  }

  return (
    <Hoja visible={visible} titulo={t('inicio.elegirEnfoque')} onCerrar={onCerrar} cerrarEtiqueta={t('inicio.cerrar')}>
      <ListaAgrupada sangria={16}>
        {MODOS_ENFOQUE.map(modo => (
          <FilaLista
            key={modo}
            titulo={t(`enfoque.${modo}`)}
            detalle={t(`enfoqueDescripcion.${modo}`)}
            seleccionada={modo === actual}
            onPress={() => elegir(modo)}
          />
        ))}
      </ListaAgrupada>
    </Hoja>
  );
}

// Decisión D30: en inicio el enfoque se cambia con un control segmentado de un toque y queda
// guardado; reemplaza a la barra de orden temporal y al enlace con hoja.
// Con la ⓘ al final de la fila, en vez de una fila aparte "Tu enfoque" (decisión D43).
export function ControlEnfoque() {
  const tema = useTema();
  const { t } = useTranslation();
  const [info, setInfo] = useState(false);
  const preferencias = useAlmacen(s => s.preferencias);
  const guardarPreferencias = useAlmacen(s => s.guardarPreferencias);
  if (!preferencias) return null;
  return (
    <View style={{ gap: tema.espacio.s }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: tema.espacio.xs }}>
        <View style={{ flex: 1 }}>
          <ControlSegmentado
            etiqueta={t('inicio.elegirEnfoque')}
            valor={preferencias.enfoque.modo}
            onCambio={modo => {
              if (modo === preferencias.enfoque.modo) return;
              // Sección 16.6: el reordenamiento se anima sin saltos.
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              guardarPreferencias({ ...preferencias, enfoque: { modo } });
            }}
            opciones={MODOS_ENFOQUE.map(modo => ({ valor: modo, etiqueta: t(`enfoqueCorto.${modo}`) }))}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('comun.masInformacion', { tema: t('inicio.tuEnfoque') })}
          accessibilityState={{ expanded: info }}
          onPress={() => setInfo(!info)}
          style={{ width: tema.toqueMinimo, height: tema.toqueMinimo, marginRight: -tema.espacio.s, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icono nombre="info" color="primario" tamano={20} grosor={info ? 2.6 : 2} />
        </Pressable>
      </View>
      {info ? (
        <View style={{ backgroundColor: tema.color.neutroFondo, borderRadius: tema.radio.segmento, padding: tema.espacio.m }}>
          <Texto variante="apoyo" accessibilityLiveRegion="polite">
            {t('inicio.enfoqueInfo')}
          </Texto>
        </View>
      ) : null}
    </View>
  );
}
