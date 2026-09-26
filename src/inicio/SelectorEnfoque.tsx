import { useState } from 'react';
import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ModoEnfoque } from '../tipos/tipos';
import { FilaLista, Hoja, Icono, ListaAgrupada, Texto, useTema } from '../diseno';
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

// "Equilibrado ▾" junto al título de la lista (rediseño).
export function SelectorEnfoque() {
  const tema = useTema();
  const { t } = useTranslation();
  const [abierto, setAbierto] = useState(false);
  const modo = useAlmacen(s => s.preferencias?.enfoque.modo);
  if (!modo) return null;
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('inicio.enfoqueCambiar', { modo: t(`enfoque.${modo}`) })}
        onPress={() => setAbierto(true)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: tema.espacio.xs, minHeight: tema.toqueMinimo, paddingHorizontal: tema.espacio.xs }}
      >
        <Texto variante="cuerpoFuerte" color="primario">
          {t(`enfoque.${modo}`)}
        </Texto>
        <Icono nombre="abajo" color="primario" tamano={16} grosor={2.5} />
      </Pressable>
      <HojaEnfoque visible={abierto} onCerrar={() => setAbierto(false)} />
    </>
  );
}
