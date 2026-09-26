import { createStore } from 'zustand/vanilla';
import type { CodigoPais, FechaISO, FuenteIngreso, Preferencias, Tarjeta } from '../tipos/tipos';
import { preferenciasIniciales } from '../datos/preferencias';
import type { RepositorioIngresos, RepositorioPreferencias, RepositorioSugerencias, RepositorioTarjetas } from '../datos/repositorios';
import { ESTADO_INICIAL, type EstadoSugerencias } from '../sugerencias/elegir';

export interface Repositorios {
  tarjetas: RepositorioTarjetas;
  ingresos: RepositorioIngresos;
  preferencias: RepositorioPreferencias;
  sugerencias: RepositorioSugerencias;
}

export interface EstadoApp {
  cargado: boolean;
  tarjetas: Tarjeta[];
  // Fuentes de ingreso (sección 5): solo fechas de cobro en el MVP.
  ingresos: FuenteIngreso[];
  preferencias: Preferencias | null;
  // Historial de sugerencias de datos (sección 2.2).
  sugerencias: EstadoSugerencias;
  cargar: () => Promise<void>;
  guardarTarjeta: (tarjeta: Tarjeta) => Promise<void>;
  borrarTarjeta: (id: string) => Promise<void>;
  alternarPausa: (id: string) => Promise<void>;
  // Marca (o desmarca con null) como pagado el estado que vence en esa fecha.
  marcarPagado: (id: string, fecha: FechaISO | null) => Promise<void>;
  guardarIngreso: (ingreso: FuenteIngreso) => Promise<void>;
  borrarIngreso: (id: string) => Promise<void>;
  guardarPreferencias: (preferencias: Preferencias) => Promise<void>;
  asegurarPreferencias: (pais: CodigoPais, idioma: string) => Promise<void>;
  guardarSugerencias: (estado: EstadoSugerencias) => Promise<void>;
}

// Datos globales de la sección 3 técnica. Primero se guarda en la base y después se
// actualiza el estado, para que la pantalla nunca muestre algo que no quedó guardado.
// El ranking no se guarda aquí: se recalcula con el motor a partir de estos datos.
export function crearAlmacen(repos: Repositorios, ahora: () => string = () => new Date().toISOString()) {
  return createStore<EstadoApp>()((set, get) => ({
    cargado: false,
    tarjetas: [],
    ingresos: [],
    preferencias: null,
    sugerencias: ESTADO_INICIAL,

    async cargar() {
      const [tarjetas, ingresos, preferencias, sugerencias] = await Promise.all([
        repos.tarjetas.listar(),
        repos.ingresos.listar(),
        repos.preferencias.leer(),
        repos.sugerencias.leer(),
      ]);
      set({ tarjetas, ingresos, preferencias, sugerencias: sugerencias ?? ESTADO_INICIAL, cargado: true });
    },

    async guardarTarjeta(tarjeta) {
      await repos.tarjetas.guardar(tarjeta, ahora());
      const existe = get().tarjetas.some(t => t.id === tarjeta.id);
      set({ tarjetas: existe ? get().tarjetas.map(t => (t.id === tarjeta.id ? tarjeta : t)) : [...get().tarjetas, tarjeta] });
    },

    async borrarTarjeta(id) {
      await repos.tarjetas.borrar(id);
      set({ tarjetas: get().tarjetas.filter(t => t.id !== id) });
    },

    async alternarPausa(id) {
      const tarjeta = get().tarjetas.find(t => t.id === id);
      if (tarjeta) await get().guardarTarjeta({ ...tarjeta, enPausa: !tarjeta.enPausa });
    },

    async marcarPagado(id, fecha) {
      const tarjeta = get().tarjetas.find(t => t.id === id);
      if (!tarjeta) return;
      const { pagoHecho: _anterior, ...resto } = tarjeta;
      await get().guardarTarjeta(fecha ? { ...resto, pagoHecho: fecha } : resto);
    },

    async guardarIngreso(ingreso) {
      await repos.ingresos.guardar(ingreso, ahora());
      const existe = get().ingresos.some(i => i.id === ingreso.id);
      set({ ingresos: existe ? get().ingresos.map(i => (i.id === ingreso.id ? ingreso : i)) : [...get().ingresos, ingreso] });
    },

    async borrarIngreso(id) {
      await repos.ingresos.borrar(id);
      set({ ingresos: get().ingresos.filter(i => i.id !== id) });
    },

    async guardarPreferencias(preferencias) {
      await repos.preferencias.guardar(preferencias, ahora());
      set({ preferencias });
    },

    async guardarSugerencias(sugerencias) {
      await repos.sugerencias.guardar(sugerencias, ahora());
      set({ sugerencias });
    },

    // La primera vez que abre la app, las preferencias parten del país detectado.
    async asegurarPreferencias(pais, idioma) {
      if (!get().preferencias) await get().guardarPreferencias(preferenciasIniciales(pais, idioma));
    },
  }));
}

export type Almacen = ReturnType<typeof crearAlmacen>;
