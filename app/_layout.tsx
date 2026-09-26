import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useTranslation } from 'react-i18next';
import { archivosFuente, Pantalla, Texto, useTema, type Tema } from '@/diseno';
import { ProveedorPais, usePais } from '@/paises';
import { ProveedorDatos, useEstadoDatos } from '@/datos';
import { ProveedorAlmacen, useAlmacen } from '@/estado';
import { useAvisos } from '@/notificaciones/useAvisos';
import { ProveedorCatalogo } from '@/catalogo';

SplashScreen.preventAutoHideAsync();

export default function Raiz() {
  return (
    <ProveedorPais>
      <ProveedorDatos>
        <Contenido />
      </ProveedorDatos>
    </ProveedorPais>
  );
}

// Colores de la navegación desde los roles del tema, para que no haya destellos de otro color.
function temaNavegacion(tema: Tema): Theme {
  const base = tema.modo === 'oscuro' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: tema.color.primario,
      background: tema.color.fondo,
      card: tema.color.superficie,
      text: tema.color.texto,
      border: tema.color.borde,
      notification: tema.color.alertaTexto,
    },
  };
}

function Contenido() {
  const tema = useTema();
  const [fuentesListas, errorFuentes] = useFonts(archivosFuente);
  const datos = useEstadoDatos();
  const { config } = usePais();
  const fuentes = !!(fuentesListas || errorFuentes);
  const navegacion = useMemo(() => temaNavegacion(tema), [tema]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(tema.color.fondo);
  }, [tema]);

  // Sin fuentes o con la base abriendo, sigue la pantalla de arranque.
  if (!fuentes || datos.estado === 'cargando') return null;

  return (
    <ThemeProvider value={navegacion}>
      <StatusBar style={tema.modo === 'oscuro' ? 'light' : 'dark'} />
      {datos.estado === 'error' ? (
        <OcultarArranque>
          <ErrorDatos />
        </OcultarArranque>
      ) : (
        <ProveedorAlmacen base={datos.base}>
          <ProveedorCatalogo pais={config.codigo} db={datos.base.db}>
            <CuandoCargue>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: tema.color.fondo },
                  headerTitleStyle: { fontFamily: tema.texto.subtitulo.fontFamily },
                  headerTintColor: tema.color.primario,
                }}
              >
                {/* "Tengo una compra" es una consulta rápida: sube desde abajo sobre Inicio. */}
                <Stack.Screen name="compra" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
              </Stack>
            </CuandoCargue>
          </ProveedorCatalogo>
        </ProveedorAlmacen>
      )}
    </ThemeProvider>
  );
}

// Espera a tener tarjetas y preferencias, para no mostrar un instante la pantalla equivocada.
// El país guardado en las preferencias manda sobre la región del teléfono.
function CuandoCargue({ children }: { children: ReactNode }) {
  const cargado = useAlmacen(s => s.cargado);
  const paisGuardado = useAlmacen(s => s.preferencias?.pais);
  const asegurarPreferencias = useAlmacen(s => s.asegurarPreferencias);
  const { config, idioma, cambiarPais } = usePais();
  // Solo la primera vez se espera a que coincidan; después no se desmonta la navegación.
  const [sincronizado, setSincronizado] = useState(false);

  useEffect(() => {
    if (!cargado) return;
    if (!paisGuardado) asegurarPreferencias(config.codigo, idioma);
    else if (paisGuardado !== config.codigo) cambiarPais(paisGuardado);
    else setSincronizado(true);
  }, [cargado, paisGuardado, asegurarPreferencias, cambiarPais, config.codigo, idioma]);

  if (!sincronizado) return null;
  return (
    <OcultarArranque>
      <AvisosProgramados />
      {children}
    </OcultarArranque>
  );
}

// Programa los avisos locales con los datos actuales (sección 11); no dibuja nada.
function AvisosProgramados() {
  useAvisos();
  return null;
}

function OcultarArranque({ children }: { children: ReactNode }) {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);
  return <>{children}</>;
}

function ErrorDatos() {
  const { t } = useTranslation();
  return (
    <Pantalla>
      <Texto accessibilityRole="alert">{t('errores.baseDatos')}</Texto>
    </Pantalla>
  );
}
