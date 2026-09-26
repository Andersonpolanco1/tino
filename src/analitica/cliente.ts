// Único punto de salida de la analítica (sección 10 técnica). Las pantallas no llaman a
// `enviar`: usan las funciones de `eventos.ts`, que solo aceptan las propiedades permitidas.

// Valores ya convertidos a categorías o rangos; nunca números sueltos.
export type Propiedades = Record<string, string | boolean>;

// El servicio de analítica detrás del módulo (PostHog en la app, uno falso en las pruebas).
export interface Transporte {
  capturar(evento: string, propiedades: Propiedades): void;
  // Apagada la analítica, descarta lo que tenga en cola y deja de enviar.
  apagar(): void;
  encender(): void;
  // Al reemplazar el transporte (identificador reiniciado) se cierra el anterior.
  cerrar(): void;
}

interface Estado {
  transporte: Transporte | null;
  activa: boolean;
  pais: string | null;
}

const estado: Estado = { transporte: null, activa: false, pais: null };

// Sigue a las preferencias: interruptor de Ajustes y país (sección 18: el país va en cada evento).
export function configurarAnalitica({ activa, pais }: { activa: boolean; pais: string }) {
  if (estado.transporte && activa !== estado.activa) {
    if (activa) estado.transporte.encender();
    else estado.transporte.apagar();
  }
  estado.activa = activa;
  estado.pais = pais;
}

// Sin clave del servicio (desarrollo y pruebas) no hay transporte y nada sale del teléfono.
export function usarTransporte(transporte: Transporte | null) {
  if (estado.transporte && estado.transporte !== transporte) estado.transporte.cerrar();
  estado.transporte = transporte;
  if (transporte && !estado.activa) transporte.apagar();
}

// Con la analítica apagada el evento se descarta: no se envía ni se guarda.
export function enviar(evento: string, propiedades: Propiedades) {
  if (!estado.activa || !estado.transporte || !estado.pais) return;
  estado.transporte.capturar(evento, { ...propiedades, pais: estado.pais });
}
