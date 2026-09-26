import { Platform } from 'react-native';

// Las ofertas de Tino Pro tal como las muestra el muro de pago (sección 15.2). Los precios
// llegan ya formateados por la tienda, en la moneda del usuario.
export type TipoOferta = 'lanzamiento' | 'anual' | 'mensual';

export interface PeriodoPrueba {
  unidad: 'dia' | 'semana' | 'mes' | 'anio';
  cantidad: number;
}

export interface OfertaPro {
  id: string;
  tipo: TipoOferta;
  precio: string;
  // Solo en las anuales: lo que sale al mes, para comparar con la mensual.
  precioPorMes: string | null;
  prueba: PeriodoPrueba | null;
}

export type ResultadoCompra = 'pro' | 'cancelada' | 'sin_pro';

// La plataforma de suscripciones detrás del módulo (RevenueCat en la app, una falsa en las pruebas).
export interface ServicioSuscripciones {
  ofertas(): Promise<OfertaPro[]>;
  comprar(id: string): Promise<ResultadoCompra>;
  restaurar(): Promise<boolean>;
  tienePro(): Promise<boolean>;
  // Avisa cuando la tienda cambia el estado (compra en otro teléfono, vencimiento, reembolso).
  alCambiar(escuchar: (pro: boolean) => void): () => void;
  // Donde el usuario cancela o cambia su suscripción (la tienda, no Tino).
  urlGestion(): Promise<string | null>;
}

// Claves públicas de RevenueCat por plataforma, desde secretos de EAS. Sin clave no hay compras:
// la app funciona en el plan guardado.
const CLAVES: Partial<Record<typeof Platform.OS, string>> = {
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID,
};

let servicio: Promise<ServicioSuscripciones | null> | null = null;

// RevenueCat se carga solo si hay clave, así las pruebas y el desarrollo no lo tocan.
export function obtenerServicio(): Promise<ServicioSuscripciones | null> {
  if (!servicio) {
    const clave = CLAVES[Platform.OS];
    servicio = clave ? import('./revenuecat').then(m => m.crearServicioRevenueCat(clave)) : Promise.resolve(null);
  }
  return servicio;
}

export function usarServicioDePrueba(s: ServicioSuscripciones | null) {
  servicio = Promise.resolve(s);
}
