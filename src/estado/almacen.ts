import { createStore } from 'zustand/vanilla';
import type { CodigoPais, FuenteIngreso, Preferencias, Tarjeta } from '../tipos/tipos';
import { preferenciasIniciales } from '../datos/preferencias';
import type { RepositorioIngresos, RepositorioPreferencias, RepositorioTarjetas } from '../datos/repositorios';

export interface Repositorios {
  tarjetas: RepositorioTarjetas;
  ingresos: RepositorioIngresos;
  preferencias: RepositorioPreferencias;
}

export interface EstadoApp {
  cargado: boolean;
  tarjetas: Tarjeta[];
  // Fuentes de ingreso (sección 5): solo fechas de cobro en el MVP.
  ingresos: FuenteIngreso[];
  preferencias: Preferencias | null;
  cargar: () => Promise<void>;
  guardarTarjeta: (tarjeta: Tarjeta) => Promise<void>;
  borrarTarjeta: (id: string) => Promise<void>;
  alternarPausa: (id: string) => Promise<void>;
  guardarIngreso: (ingreso: FuenteIngreso) => Promise<void>;
  borrarIngreso: (id: string) => Promise<void>;
  guardarPreferencias: (preferencias: Preferencias) => Promise<void>;
  asegurarPreferencias: (pais: CodigoPais, idioma: string) => Promise<void>;
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

    async cargar() {
      const [tarjetas, ingresos, preferencias] = await Promise.all([repos.tarjetas.listar(), repos.ingresos.listar(), repos.preferencias.leer()]);
      set({ tarjetas, ingresos, preferencias, cargado: true });
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

    // La primera vez que abre la app, las preferencias parten del país detectado.
    async asegurarPreferencias(pais, idioma) {
      if (!get().preferencias) await get().guardarPreferencias(preferenciasIniciales(pais, idioma));
    },
  }));
}

export type Almacen = ReturnType<typeof crearAlmacen>;
