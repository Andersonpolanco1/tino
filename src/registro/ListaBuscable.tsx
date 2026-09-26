import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Campo, FilaLista, ListaAgrupada, useTema } from '../diseno';
import { filtrar } from './borrador';

export interface ElementoLista {
  id: string;
  titulo: string;
  detalle?: string;
  iniciales?: string;
  buscarEn: string[];
}

interface Props {
  buscador: string;
  elementos: ElementoLista[];
  onElegir: (id: string) => void;
  // Salidas que nunca se filtran: "Mi tarjeta no está en la lista", "No sé el tipo"...
  salidas: { titulo: string; onPress: () => void }[];
}

// Elegir banco o producto en dos toques, con buscador (sección 4.1), en listas agrupadas.
export function ListaBuscable({ buscador, elementos, onElegir, salidas }: Props) {
  const tema = useTema();
  const [texto, setTexto] = useState('');
  const visibles = useMemo(() => filtrar(elementos, texto, e => e.buscarEn), [elementos, texto]);
  const conIniciales = elementos.some(e => e.iniciales);
  return (
    <View style={{ gap: tema.espacio.l }}>
      <Campo etiqueta={buscador} value={texto} onChangeText={setTexto} autoCorrect={false} returnKeyType="search" />
      {visibles.length ? (
        <ListaAgrupada sangria={conIniciales ? 70 : 16}>
          {visibles.map(e => (
            <FilaLista key={e.id} titulo={e.titulo} detalle={e.detalle} iniciales={e.iniciales} flecha onPress={() => onElegir(e.id)} />
          ))}
        </ListaAgrupada>
      ) : null}
      <ListaAgrupada sangria={16}>
        {salidas.map(s => (
          <FilaLista key={s.titulo} titulo={s.titulo} flecha onPress={s.onPress} />
        ))}
      </ListaAgrupada>
    </View>
  );
}
