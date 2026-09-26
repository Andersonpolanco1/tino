import { Children, Fragment, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Texto } from './Texto';
import { Icono, type NombreIcono } from './Icono';
import { Superficie } from './Superficie';
import { useTema } from './useTema';
import type { RolColor } from './tema';

// Varias filas dentro de una misma tarjeta redondeada, separadas por líneas finas (rediseño).
export function ListaAgrupada({ children, titulo, sangria = 64 }: { children: ReactNode; titulo?: string; sangria?: number }) {
  const tema = useTema();
  const filas = Children.toArray(children).filter(Boolean);
  return (
    <View style={{ gap: tema.espacio.s }}>
      {titulo ? (
        <Texto variante="apoyo" color="textoSecundario" style={{ paddingLeft: tema.espacio.xs, fontFamily: tema.texto.cuerpoFuerte.fontFamily }}>
          {titulo}
        </Texto>
      ) : null}
      <Superficie>
        {filas.map((fila, i) => (
          <Fragment key={i}>
            {i > 0 ? <View style={{ height: 1, marginLeft: sangria, backgroundColor: tema.color.divisor }} /> : null}
            {fila}
          </Fragment>
        ))}
      </Superficie>
    </View>
  );
}

type TonoIcono = 'primario' | 'recompensa' | 'alerta' | 'neutro';

const TONOS: Record<TonoIcono, { fondo: RolColor; trazo: RolColor }> = {
  primario: { fondo: 'neutroFondo', trazo: 'primario' },
  recompensa: { fondo: 'recompensaFondo', trazo: 'recompensaTexto' },
  alerta: { fondo: 'alertaFondo', trazo: 'alertaTexto' },
  neutro: { fondo: 'neutroFondo', trazo: 'textoSecundario' },
};

interface PropsFila {
  titulo: string;
  detalle?: string;
  valor?: string;
  icono?: NombreIcono;
  tono?: TonoIcono;
  // Círculo con iniciales (el banco) en lugar de un ícono.
  iniciales?: string;
  flecha?: boolean;
  destructiva?: boolean;
  derecha?: ReactNode;
  debajo?: ReactNode;
  onPress?: () => void;
  etiquetaAccesible?: string;
  seleccionada?: boolean;
}

export function FilaLista({
  titulo,
  detalle,
  valor,
  icono,
  tono = 'primario',
  iniciales,
  flecha = false,
  destructiva = false,
  derecha,
  debajo,
  onPress,
  etiquetaAccesible,
  seleccionada,
}: PropsFila) {
  const tema = useTema();
  const colores = TONOS[destructiva ? 'alerta' : tono];
  const contenido = (
    <>
      {iniciales ? (
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: tema.color.neutroFondo, alignItems: 'center', justifyContent: 'center' }}>
          <Texto variante="etiqueta" color="primario" style={{ fontSize: 13 }}>
            {iniciales}
          </Texto>
        </View>
      ) : icono ? (
        <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: tema.color[colores.fondo], alignItems: 'center', justifyContent: 'center' }}>
          <Icono nombre={icono} color={colores.trazo} tamano={18} />
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
        <Texto variante="cuerpoFuerte" color={destructiva ? 'alertaTexto' : 'texto'} style={{ fontSize: iniciales ? 16 : 15 }}>
          {titulo}
        </Texto>
        {detalle ? (
          <Texto variante="apoyo" color="textoSecundario" style={{ fontSize: 13 }}>
            {detalle}
          </Texto>
        ) : null}
        {debajo}
      </View>
      {valor ? (
        <Texto variante="apoyo" color="textoSecundario">
          {valor}
        </Texto>
      ) : null}
      {derecha}
      {seleccionada ? <Icono nombre="check" color="primario" /> : null}
      {flecha ? <Icono nombre="derecha" color="textoSecundario" tamano={18} /> : null}
    </>
  );
  const estilo = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: tema.espacio.m,
    minHeight: tema.toqueMinimo + tema.espacio.m,
    paddingVertical: tema.espacio.m,
    paddingHorizontal: tema.espacio.l,
  };
  if (!onPress) return <View style={estilo}>{contenido}</View>;
  return (
    <Pressable
      accessibilityRole={seleccionada !== undefined ? 'radio' : 'button'}
      accessibilityState={seleccionada !== undefined ? { selected: seleccionada } : undefined}
      accessibilityLabel={etiquetaAccesible}
      onPress={onPress}
      style={({ pressed }) => [estilo, { opacity: pressed ? 0.6 : 1 }]}
    >
      {contenido}
    </Pressable>
  );
}
