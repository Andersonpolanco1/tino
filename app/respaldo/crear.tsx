import { useState } from 'react';
import { Alert, View } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Crypto from 'expo-crypto';
import { BarraSuperior, Boton, Campo, Icono, Pantalla, Texto, useTema } from '@/diseno';
import { useAlmacen } from '@/estado';
import { cifrarRespaldo, LARGO_MINIMO_CONTRASENA } from '@/respaldo/cifrado';
import { contenidoDe } from '@/respaldo/contenido';
import { compartirRespaldo } from '@/respaldo/archivo';
import { hoyLocal } from '@/utilidades/fecha';
import { useVolver } from '@/utilidades/useVolver';

// Crear respaldo (decisión D62): todo cifrado con una contraseña que solo sabe el usuario.
export default function CrearRespaldo() {
  const { t } = useTranslation();
  const tema = useTema();
  const volver = useVolver();
  const tarjetas = useAlmacen(s => s.tarjetas);
  const ingresos = useAlmacen(s => s.ingresos);
  const preferencias = useAlmacen(s => s.preferencias);
  const sugerencias = useAlmacen(s => s.sugerencias);
  const [contrasena, setContrasena] = useState('');
  const [repetida, setRepetida] = useState('');
  const [error, setError] = useState<{ campo: 'contrasena' | 'repetida'; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function crear() {
    if (contrasena.length < LARGO_MINIMO_CONTRASENA) return setError({ campo: 'contrasena', texto: t('respaldo.errorCorta', { count: LARGO_MINIMO_CONTRASENA }) });
    if (contrasena !== repetida) return setError({ campo: 'repetida', texto: t('respaldo.errorNoCoinciden') });
    setError(null);
    setOcupado(true);
    try {
      const contenido = contenidoDe({ preferencias, tarjetas, ingresos, sugerencias }, new Date());
      const texto = await cifrarRespaldo(contenido, contrasena, n => Crypto.getRandomBytes(n));
      await compartirRespaldo(texto, hoyLocal(), t('respaldo.crearTitulo'));
      volver();
    } catch {
      Alert.alert(t('respaldo.errorCrear'));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Pantalla
      arriba={<BarraSuperior titulo={t('respaldo.crearTitulo')} cerrar={volver} />}
      pie={<Boton titulo={ocupado ? t('respaldo.cifrando') : t('respaldo.crearBoton')} icono="descargar" onPress={crear} deshabilitado={ocupado} />}
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
