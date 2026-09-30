import { useState } from 'react';
import { Alert, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BarraSuperior, Boton, Campo, FilaLista, ListaAgrupada, Pantalla, Texto, useTema } from '@/diseno';
import { useAlmacen } from '@/estado';
import { useEstadoDatos } from '@/datos';
import { descifrarRespaldo, ErrorRespaldo } from '@/respaldo/cifrado';
import { reemplazarDatos, validarContenido, type ContenidoRespaldo } from '@/respaldo/contenido';
import { elegirRespaldo } from '@/respaldo/archivo';
import { formatearFecha } from '@/i18n/formato';
import { usePais } from '@/paises';
import { useVolver } from '@/utilidades/useVolver';
import { conservarAceptacion } from '@/privacidad/terminos';

// Restaurar un respaldo (decisión D62), gratis: elegir el archivo, poner la contraseña, ver qué
// trae y confirmar. Reemplaza todo en una sola transacción; si algo falla, no cambia nada.
export default function RestaurarRespaldo() {
  const { t } = useTranslation();
  const tema = useTema();
  const router = useRouter();
  const volver = useVolver();
  const { idioma } = usePais();
  const datos = useEstadoDatos();
  const cargar = useAlmacen(s => s.cargar);
  const actuales = useAlmacen(s => s.tarjetas.length);
  const preferenciasActuales = useAlmacen(s => s.preferencias);
  const [archivo, setArchivo] = useState<{ nombre: string; texto: string } | null>(null);
  const [contrasena, setContrasena] = useState('');
  const [contenido, setContenido] = useState<ContenidoRespaldo | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [ocupado, setOcupado] = useState(false);

  async function elegir() {
    try {
      const elegido = await elegirRespaldo();
      if (!elegido) return;
      setArchivo(elegido);
      setContenido(null);
      setError(undefined);
    } catch {
      Alert.alert(t('respaldo.archivoNoValido'), t('respaldo.error.formato'));
    }
  }

  async function abrir() {
    if (!archivo || !contrasena) return;
    setOcupado(true);
    try {
      setContenido(validarContenido(await descifrarRespaldo(archivo.texto, contrasena)));
      setError(undefined);
    } catch (e) {
      setError(t(`respaldo.error.${e instanceof ErrorRespaldo ? e.motivo : 'formato'}`));
    } finally {
      setOcupado(false);
    }
  }

  async function restaurar() {
    if (!contenido || datos.estado !== 'lista') return;
    setOcupado(true);
    try {
      // La aceptación de los términos que vale es la de este teléfono (D88).
      const restaurado = contenido.preferencias ? { ...contenido, preferencias: conservarAceptacion(contenido.preferencias, preferenciasActuales) } : contenido;
      await reemplazarDatos(datos.base.transaccion, restaurado, new Date().toISOString());
      await cargar();
      Alert.alert(t('respaldo.restaurado'), t('respaldo.restauradoTexto'));
      router.replace('/inicio');
    } catch {
      Alert.alert(t('respaldo.errorRestaurar'), t('respaldo.errorRestaurarTexto'));
      setOcupado(false);
    }
  }

  const pie = contenido ? (
    <Boton titulo={t('respaldo.restaurarBoton')} onPress={restaurar} deshabilitado={ocupado} />
  ) : archivo ? (
    <>
      {ocupado ? (
        <Texto variante="apoyo" color="textoSecundario" style={{ textAlign: 'center' }}>
          {t('respaldo.puedeTardar')}
        </Texto>
      ) : null}
      <Boton titulo={ocupado ? t('respaldo.abriendo') : t('respaldo.abrir')} onPress={abrir} deshabilitado={ocupado || !contrasena} />
    </>
  ) : (
    <Boton titulo={t('respaldo.elegirArchivo')} onPress={elegir} />
  );

  return (
    <Pantalla arriba={<BarraSuperior titulo={t('respaldo.restaurarTitulo')} cerrar={volver} />} pie={pie}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ gap: tema.espacio.s }}>
        <Texto variante="titulo" accessibilityRole="header">
          {t('respaldo.restaurarEncabezado')}
        </Texto>
        <Texto color="textoSecundario">{t('respaldo.restaurarTexto')}</Texto>
      </View>

      {archivo ? (
        <ListaAgrupada sangria={16}>
          <FilaLista icono="descargar" titulo={archivo.nombre} detalle={t('respaldo.otroArchivo')} onPress={elegir} />
        </ListaAgrupada>
      ) : null}

      {archivo && !contenido ? (
        <Campo
          etiqueta={t('respaldo.contrasena')}
          error={error}
          value={contrasena}
          onChangeText={texto => {
            setContrasena(texto);
            setError(undefined);
          }}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          autoComplete="password"
          onSubmitEditing={abrir}
        />
      ) : null}

      {contenido ? (
        <View style={{ gap: tema.espacio.m }}>
          <ListaAgrupada titulo={t('respaldo.contiene', { fecha: formatearFecha(contenido.creadoEn.slice(0, 10), idioma) })} sangria={16}>
            <FilaLista
              icono="tarjetas"
              titulo={t('respaldo.tarjetasN', { count: contenido.tarjetas.length })}
              detalle={contenido.tarjetas.map(x => x.alias).join(', ') || undefined}
            />
            <FilaLista
              icono="calendario"
              titulo={t('respaldo.cobrosN', { count: contenido.ingresos.length })}
              detalle={contenido.ingresos.map(x => x.nombre).join(', ') || undefined}
            />
          </ListaAgrupada>
          <Texto variante="apoyo" color={actuales ? 'alertaTexto' : 'textoSecundario'}>
            {actuales ? t('respaldo.reemplaza', { count: actuales }) : t('respaldo.reemplazaVacio')}
          </Texto>
        </View>
      ) : null}
    </Pantalla>
  );
}
