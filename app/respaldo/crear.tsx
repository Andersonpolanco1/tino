import { useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Crypto from 'expo-crypto';
import { BarraSuperior, Boton, Campo, Icono, Pantalla, Texto, useTema } from '@/diseno';
import { useAlmacen } from '@/estado';
import { cifrarRespaldo, LARGO_MINIMO_CONTRASENA } from '@/respaldo/cifrado';
import { contenidoDe } from '@/respaldo/contenido';
import { compartirRespaldo, guardarRespaldoEnCarpeta } from '@/respaldo/archivo';
import { hoyLocal } from '@/utilidades/fecha';
import { useVolver } from '@/utilidades/useVolver';

// Crear respaldo (decisión D62): todo cifrado con una contraseña que solo sabe el usuario. En
// Android se puede guardar en una carpeta del teléfono o enviar a otra app (D93); en iPhone, la
// hoja de compartir ya trae "Guardar en Archivos".
export default function CrearRespaldo() {
  const { t } = useTranslation();
  const tema = useTema();
  const volver = useVolver();
  const tarjetas = useAlmacen(s => s.tarjetas);
  const ingresos = useAlmacen(s => s.ingresos);
  const preferencias = useAlmacen(s => s.preferencias);
  const sugerencias = useAlmacen(s => s.sugerencias);
  const guardarPreferencias = useAlmacen(s => s.guardarPreferencias);
  const [contrasena, setContrasena] = useState('');
  const [repetida, setRepetida] = useState('');
  const [error, setError] = useState<{ campo: 'contrasena' | 'repetida'; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function crear(destino: 'telefono' | 'compartir') {
    if (contrasena.length < LARGO_MINIMO_CONTRASENA) return setError({ campo: 'contrasena', texto: t('respaldo.errorCorta', { count: LARGO_MINIMO_CONTRASENA }) });
    if (contrasena !== repetida) return setError({ campo: 'repetida', texto: t('respaldo.errorNoCoinciden') });
    setError(null);
    setOcupado(true);
    try {
      const contenido = contenidoDe({ preferencias, tarjetas, ingresos, sugerencias }, new Date());
      const texto = await cifrarRespaldo(contenido, contrasena, n => Crypto.getRandomBytes(n));
      if (destino === 'telefono') {
        if (!(await guardarRespaldoEnCarpeta(texto, hoyLocal()))) return;
        Alert.alert(t('respaldo.guardado'), t('respaldo.guardadoTexto'));
      } else {
        await compartirRespaldo(texto, hoyLocal(), t('respaldo.crearTitulo'));
      }
      // Decisión D81: para recordarlo pasados 3 meses sin respaldo manual.
      if (preferencias) await guardarPreferencias({ ...preferencias, ultimoRespaldoManual: hoyLocal() }).catch(() => {});
      volver();
    } catch {
      Alert.alert(t('respaldo.errorCrear'), t('comun.intentaDeNuevo'));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Pantalla
      arriba={<BarraSuperior titulo={t('respaldo.crearTitulo')} cerrar={volver} />}
      pie={
        Platform.OS === 'android' ? (
          <>
            {ocupado ? (
              <Texto variante="apoyo" color="textoSecundario" style={{ textAlign: 'center' }}>
                {t('respaldo.puedeTardar')}
              </Texto>
            ) : null}
            <Boton titulo={ocupado ? t('respaldo.cifrando') : t('respaldo.guardarTelefono')} icono="descargar" onPress={() => crear('telefono')} deshabilitado={ocupado} />
            <Boton titulo={t('respaldo.enviarOtraApp')} variante="texto" onPress={() => crear('compartir')} deshabilitado={ocupado} />
          </>
        ) : (
          <>
            {ocupado ? (
              <Texto variante="apoyo" color="textoSecundario" style={{ textAlign: 'center' }}>
                {t('respaldo.puedeTardar')}
              </Texto>
            ) : null}
            <Boton titulo={ocupado ? t('respaldo.cifrando') : t('respaldo.crearBoton')} icono="descargar" onPress={() => crear('compartir')} deshabilitado={ocupado} />
          </>
        )
      }
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ gap: tema.espacio.s }}>
        <Texto variante="titulo" accessibilityRole="header">
          {t('respaldo.crearEncabezado')}
        </Texto>
        <Texto color="textoSecundario">{t('respaldo.crearTexto')}</Texto>
      </View>
      <Campo
        etiqueta={t('respaldo.contrasena')}
        ayuda={t('respaldo.contrasenaAyuda', { count: LARGO_MINIMO_CONTRASENA })}
        error={error?.campo === 'contrasena' ? error.texto : undefined}
        value={contrasena}
        onChangeText={setContrasena}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        autoComplete="new-password"
      />
      <Campo
        etiqueta={t('respaldo.repetir')}
        error={error?.campo === 'repetida' ? error.texto : undefined}
        value={repetida}
        onChangeText={setRepetida}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        autoComplete="new-password"
      />
      <View style={{ flexDirection: 'row', gap: tema.espacio.m, padding: tema.espacio.l, borderRadius: tema.radio.lista, backgroundColor: tema.color.alertaFondo }}>
        <Icono nombre="alto" color="alertaTexto" tamano={20} />
        <Texto variante="apoyo" color="alertaTexto" style={{ flex: 1 }}>
          {t('respaldo.advertencia')}
        </Texto>
      </View>
    </Pantalla>
  );
}
