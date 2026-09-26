import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ModoEnfoque } from '../tipos/tipos';
import { Hoja, Icono, Texto, useTema } from '../diseno';
import { useAlmacen } from '../estado';

// Sección 6.2: los 4 modos del MVP.
const MODOS: ModoEnfoque[] = ['equilibrado', 'liquidez', 'puntos', 'cashback'];

// Botón "Enfoque: Equilibrado" que abre la hoja de modos. A diferencia de la barra de orden,
// cambia el enfoque guardado, que también usan el widget y las notificaciones (sección 3.1).
export function SelectorEnfoque() {
  const tema = useTema();
  const { t } = useTranslation();
  const [abierto, setAbierto] = useState(false);
  const preferencias = useAlmacen(s => s.preferencias);
  const guardarPreferencias = useAlmacen(s => s.guardarPreferencias);
  if (!preferencias) return null;
  const actual = preferencias.enfoque.modo;

  async function elegir(modo: ModoEnfoque) {
    setAbierto(false);
    if (modo !== actual && preferencias) await guardarPreferencias({ ...preferencias, enfoque: { modo } });
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('inicio.enfoqueBoton')}${t(`enfoque.${actual}`)}`}
        onPress={() => setAbierto(true)}
        style={{
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: tema.espacio.xs,
          minHeight: tema.toqueMinimo,
          paddingHorizontal: tema.espacio.m,
          borderRadius: tema.radio.control,
          borderWidth: 1,
          borderColor: tema.color.borde,
          backgroundColor: tema.color.superficie,
        }}
      >
        <Texto>
          {t('inicio.enfoqueBoton')}
          <Texto variante="cuerpoFuerte">{t(`enfoque.${actual}`)}</Texto>
        </Texto>
        <Icono nombre="abajo" tamano={tema.espacio.l} />
      </Pressable>

      <Hoja visible={abierto} titulo={t('inicio.elegirEnfoque')} onCerrar={() => setAbierto(false)} cerrarEtiqueta={t('inicio.cerrar')}>
        {MODOS.map(modo => {
          const activo = modo === actual;
          return (
            <Pressable
              key={modo}
              accessibilityRole="radio"
              accessibilityState={{ selected: activo }}
              onPress={() => elegir(modo)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: tema.espacio.m,
                minHeight: tema.toqueMinimo,
                padding: tema.espacio.m,
                borderRadius: tema.radio.control,
                backgroundColor: activo ? tema.color.neutroFondo : tema.color.superficie,
              }}
            >
              <View style={{ flex: 1, gap: tema.espacio.xs }}>
                <Texto variante="cuerpoFuerte">{t(`enfoque.${modo}`)}</Texto>
                <Texto variante="apoyo" color="textoSecundario">
                  {t(`enfoqueDescripcion.${modo}`)}
                </Texto>
              </View>
              {activo ? <Icono nombre="check" color="primario" /> : null}
            </Pressable>
          );
        })}
      </Hoja>
    </>
  );
}
