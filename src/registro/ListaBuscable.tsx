import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Campo, Fila, Texto, useTema } from '../diseno';
import { filtrar } from './borrador';

export interface ElementoLista {
  id: string;
  titulo: string;
  detalle?: string;
  buscarEn: string[];
}

interface Props {
  titulo: string;
  ayuda?: string;
  buscador: string;
  elementos: ElementoLista[];
  onElegir: (id: string) => void;
  // Salidas que nunca se filtran: "Mi tarjeta no está en la lista", "No sé el tipo"...
  salidas: { titulo: string; onPress: () => void }[];
}

// Elegir banco o producto en dos toques, con buscador (sección 4.1).
export function ListaBuscable({ titulo, ayuda, buscador, elementos, onElegir, salidas }: Props) {
  const tema = useTema();
  const [texto, setTexto] = useState('');
  const visibles = useMemo(() => filtrar(elementos, texto, e => e.buscarEn), [elementos, texto]);
  return (
    <View style={{ gap: tema.espacio.m }}>
      <Texto variante="titulo" accessibilityRole="header">
        {titulo}
      </Texto>
      {ayuda ? (
        <Texto variante="apoyo" color="textoSecundario">
          {ayuda}
        </Texto>
      ) : null}
      <Campo etiqueta={buscador} value={texto} onChangeText={setTexto} autoCorrect={false} returnKeyType="search" />
      <View style={{ gap: tema.espacio.s }}>
        {visibles.map(e => (
          <Fila key={e.id} titulo={e.titulo} detalle={e.detalle} onPress={() => onElegir(e.id)} />
        ))}
        {salidas.map(s => (
          <Fila key={s.titulo} titulo={s.titulo} onPress={s.onPress} />
        ))}
      </View>
    </View>
  );
}
