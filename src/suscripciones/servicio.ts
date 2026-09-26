import { Platform } from 'react-native';
import type { FechaISO } from '../tipos/tipos';

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
  // El mismo precio como número, solo para calcular el ahorro del anual.
  precioValor: number;
  // Solo en las anuales: lo que sale al mes, para comparar con la mensual.
  precioPorMes: string | null;
  // Solo si este usuario tiene derecho a la prueba: en iOS se da una vez por grupo de suscripción.
  prueba: PeriodoPrueba | null;
}

// Pro y, si está en la prueba gratis y se va a renovar, el día en que se cobra (para avisar antes).
export interface EstadoPro {
  pro: boolean;
  finPrueba: FechaISO | null;
}

// "pendiente": la tienda espera el pago (efectivo en Android, "Pedir la compra" en iOS).
export type ResultadoCompra = 'pro' | 'pendiente' | 'cancelada' | 'sin_pro';

// Cuánto se ahorra con un plan anual frente a 12 meses del mensual, en %; nada si es poco.
export function ahorroAnual(oferta: OfertaPro, ofertas: OfertaPro[]): number | null {
  const mensual = ofertas.find(o => o.tipo === 'mensual');
  if (oferta.tipo === 'mensual' || !mensual || mensual.precioValor <= 0) return null;
  const ahorro = Math.round((1 - oferta.precioValor / (mensual.precioValor * 12)) * 100);
  return ahorro >= 5 ? ahorro : null;
}

// La plataforma de suscripciones detrás del módulo (RevenueCat en la app, una falsa en las pruebas).
export interface ServicioSuscripciones {
  ofertas(): Promise<OfertaPro[]>;
  comprar(id: string): Promise<ResultadoCompra>;
  restaurar(): Promise<boolean>;
  estado(): Promise<EstadoPro>;
  // Avisa cuando la tienda cambia el estado (compra en otro teléfono, vencimiento, reembolso).
  alCambiar(escuchar: (estado: EstadoPro) => void): () => void;
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
