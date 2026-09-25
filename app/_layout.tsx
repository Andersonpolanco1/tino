import { useEffect, useMemo } from 'react';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useTranslation } from 'react-i18next';
import { archivosFuente, Pantalla, Texto, useTema, type Tema } from '@/diseno';
import { ProveedorPais } from '@/paises';
import { ProveedorDatos, useEstadoDatos } from '@/datos';

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
  const listo = (fuentesListas || errorFuentes) && datos.estado !== 'cargando';
  const navegacion = useMemo(() => temaNavegacion(tema), [tema]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(tema.color.fondo);
  }, [tema]);

  useEffect(() => {
    if (listo) SplashScreen.hideAsync();
  }, [listo]);

  if (!listo) return null;

  return (
    <ThemeProvider value={navegacion}>
      <StatusBar style={tema.modo === 'oscuro' ? 'light' : 'dark'} />
      {datos.estado === 'error' ? (
        <ErrorDatos />
      ) : (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tema.color.fondo } }} />
      )}
    </ThemeProvider>
  );
}

function ErrorDatos() {
  const { t } = useTranslation();
  return (
    <Pantalla>
      <Texto accessibilityRole="alert">{t('errores.baseDatos')}</Texto>
    </Pantalla>
  );
}
