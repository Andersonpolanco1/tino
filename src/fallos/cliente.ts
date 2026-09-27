// Reporte de fallos detrás del mismo interruptor que la analítica, "Datos de uso anónimos"
// (decisión D56). Sentry se enciende solo si el usuario lo tiene activo; apagado, se cierra.

// El servicio detrás del módulo (Sentry en la app, uno falso en las pruebas).
export interface ServicioFallos {
  iniciar(): void;
  detener(): void;
}

interface Estado {
  servicio: ServicioFallos | null;
  activo: boolean;
  iniciado: boolean;
}

const estado: Estado = { servicio: null, activo: false, iniciado: false };

function aplicar() {
  const { servicio } = estado;
  if (!servicio) return;
  if (estado.activo && !estado.iniciado) {
    servicio.iniciar();
    estado.iniciado = true;
  } else if (!estado.activo && estado.iniciado) {
    servicio.detener();
    estado.iniciado = false;
  }
}

// Sin clave del servicio (desarrollo y pruebas) no hay servicio y nada sale del teléfono.
export function usarServicioFallos(servicio: ServicioFallos | null) {
  if (estado.servicio && estado.iniciado && estado.servicio !== servicio) estado.servicio.detener();
  estado.servicio = servicio;
  estado.iniciado = false;
  aplicar();
}

// Sigue al interruptor de Ajustes.
export function configurarFallos(activo: boolean) {
  estado.activo = activo;
  aplicar();
}

// Última defensa: un reporte que llegue con el interruptor apagado se descarta.
export function reportesActivos() {
  return estado.activo && estado.iniciado;
}
