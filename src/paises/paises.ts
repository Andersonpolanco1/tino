import type { CodigoPais, ConfigPais } from '../tipos/tipos';
import registro from './registro.json';
import configDO from './do.json';

// Países con configuración propia. Agregar un país = agregar su archivo aquí (sección 9).
const configuraciones: Record<string, ConfigPais> = {
  DO: configDO as ConfigPais,
};

export interface RegionDispositivo {
  regionCode: string | null;
  currencyCode: string | null;
  languageTag: string;
}

export const PAIS_PREDETERMINADO: CodigoPais = registro.predeterminado;

export function tieneConfiguracion(codigo: CodigoPais): boolean {
  return codigo in configuraciones;
}

// El país sale de la región del teléfono; sin región, el mercado inicial.
export function detectarPais(regiones: RegionDispositivo[]): CodigoPais {
  const region = regiones.find(r => r.regionCode)?.regionCode;
  return region ? region.toUpperCase() : PAIS_PREDETERMINADO;
}

// Un país sin archivo usa el modo sin catálogo: sin feriados ni doble balance,
// con la moneda y el idioma del teléfono.
export function configPara(codigo: CodigoPais, regiones: RegionDispositivo[] = []): ConfigPais {
  const propia = configuraciones[codigo];
  if (propia) return propia;
  const region = regiones.find(r => r.regionCode?.toUpperCase() === codigo) ?? regiones[0];
  return {
    codigo,
    monedaPrincipal: region?.currencyCode ?? registro.monedaRespaldo,
    monedaSecundaria: null,
    idiomas: region ? [region.languageTag] : [],
    feriados: [],
    catalogoDisponible: false,
    funciones: { dobleBalance: false },
    montoReferencia: registro.montoReferenciaRespaldo,
  };
}
