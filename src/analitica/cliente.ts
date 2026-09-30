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
  // Decisión D88: mientras el usuario no responde por primera vez si comparte los datos de uso,
  // los eventos (los del onboarding) esperan en memoria: con un "Sí" salen, con un "No" se borran.
  retener: boolean;
  pais: string | null;
  // Mientras el servicio carga, los eventos esperan en memoria (el de la primera apertura de
  // Inicio sale antes de que esté listo). Nunca se guardan en disco.
  esperando: boolean;
  cola: { evento: string; propiedades: Propiedades }[];
}

const COLA_MAXIMA = 20;

const estado: Estado = { transporte: null, activa: false, retener: false, pais: null, esperando: false, cola: [] };

// Solo se llama cuando hay clave: sin ella nunca llega un servicio y no hay nada que esperar.
export function esperarTransporte() {
  if (!estado.transporte) estado.esperando = true;
}

// Sigue a las preferencias: consentimiento, interruptor de Ajustes y país (sección 18: el país
// va en cada evento).
export function configurarAnalitica({ activa, retener = false, pais }: { activa: boolean; retener?: boolean; pais: string }) {
  if (estado.transporte && activa !== estado.activa) {
    if (activa) estado.transporte.encender();
    else estado.transporte.apagar();
  }
  estado.activa = activa;
  estado.retener = !activa && retener;
  estado.pais = pais;
  if (!activa && !estado.retener) estado.cola = [];
  if (activa && estado.transporte) vaciarCola(estado.transporte);
}

function vaciarCola(transporte: Transporte) {
  const pendientes = estado.cola;
  estado.cola = [];
  for (const { evento, propiedades } of pendientes) transporte.capturar(evento, propiedades);
}

// Sin clave del servicio (desarrollo y pruebas) no hay transporte y nada sale del teléfono.
export function usarTransporte(transporte: Transporte | null) {
  if (estado.transporte && estado.transporte !== transporte) estado.transporte.cerrar();
  estado.transporte = transporte;
  estado.esperando = false;
  if (!transporte) {
    if (!estado.retener) estado.cola = [];
    return;
  }
  if (!estado.activa) {
    if (!estado.retener) estado.cola = [];
    return transporte.apagar();
  }
  vaciarCola(transporte);
}

// Con la analítica apagada el evento se descarta: no se envía ni se guarda. Sin respuesta todavía,
// espera en memoria.
export function enviar(evento: string, propiedades: Propiedades) {
  if (!estado.pais || (!estado.activa && !estado.retener)) return;
  const conPais = { ...propiedades, pais: estado.pais };
  if (estado.activa && estado.transporte) estado.transporte.capturar(evento, conPais);
  else if ((estado.retener || estado.esperando) && estado.cola.length < COLA_MAXIMA) estado.cola.push({ evento, propiedades: conPais });
}
