import { useState } from 'react';
import { LayoutAnimation, Pressable, View } from 'react-native';
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
    if (!preferencias || modo === actual) return;
    // Sección 16.6: el reordenamiento se anima sin saltos.
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await guardarPreferencias({ ...preferencias, enfoque: { modo } });
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

// Decisión D48 (ajusta D30 y D47): bajo "Hoy te conviene usar", una línea que completa la frase
// ("Priorizando días para pagar ▾") y abre la hoja con los 4 enfoques explicados; la ⓘ al lado.
// El enfoque se elige en el onboarding y casi no se cambia: no necesita una fila de botones.
export function SelectorEnfoque() {
  const tema = useTema();
  const { t } = useTranslation();
  const [abierta, setAbierta] = useState(false);
  const [info, setInfo] = useState(false);
  const modo = useAlmacen(s => s.preferencias?.enfoque.modo);
  if (!modo) return null;
  return (
    <View style={{ gap: tema.espacio.s }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: tema.espacio.xs, marginVertical: -tema.espacio.s }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('inicio.enfoqueCambiar', { modo: t(`enfoque.${modo}`) })}
          onPress={() => setAbierta(true)}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: tema.espacio.xs, minHeight: tema.toqueMinimo, opacity: pressed ? 0.6 : 1 })}
        >
          <Texto variante="cuerpoFuerte" color="primario">
            {t(`enfoquePriorizando.${modo}`)}
          </Texto>
          <Icono nombre="abajo" color="primario" tamano={16} grosor={2.5} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('comun.masInformacion', { tema: t('inicio.tuEnfoque') })}
          accessibilityState={{ expanded: info }}
          onPress={() => setInfo(!info)}
          style={{ width: tema.toqueMinimo, height: tema.toqueMinimo, alignItems: 'center', justifyContent: 'center' }}
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
      <HojaEnfoque visible={abierta} onCerrar={() => setAbierta(false)} />
    </View>
  );
}
