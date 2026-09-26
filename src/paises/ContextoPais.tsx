import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { getLocales } from 'expo-localization';
import type { CodigoPais, ConfigPais } from '../tipos/tipos';
import { elegirIdioma, iniciarI18n, type Idioma } from '../i18n';
import { configPara, detectarPais, opcionesDePais, type RegionDispositivo } from './paises';

interface ValorPais {
  config: ConfigPais;
  idioma: Idioma;
  // Países que se ofrecen al elegir: los que tienen configuración y el de la región del teléfono.
  opciones: CodigoPais[];
  cambiarPais: (codigo: CodigoPais) => void;
  idiomaDe: (codigo: CodigoPais) => Idioma;
}

const ContextoPais = createContext<ValorPais | null>(null);

interface Props {
  children: ReactNode;
  // Se inyecta en pruebas; en la app sale de la configuración regional del teléfono.
  regiones?: RegionDispositivo[];
}

// La región del teléfono solo da el país inicial; el que el usuario confirma queda
// en sus preferencias y se aplica con cambiarPais.
export function ProveedorPais({ children, regiones }: Props) {
  const regionesDispositivo = useMemo(() => regiones ?? getLocales(), [regiones]);
  const [codigo, setCodigo] = useState(() => detectarPais(regionesDispositivo));

  const idiomaDe = useCallback(
    (c: CodigoPais) => elegirIdioma([...configPara(c, regionesDispositivo).idiomas, ...regionesDispositivo.map(r => r.languageTag)]),
    [regionesDispositivo],
  );

  const valor = useMemo<ValorPais>(() => {
    const config = configPara(codigo, regionesDispositivo);
    const idioma = idiomaDe(codigo);
    // Los textos deben estar listos antes del primer render de las pantallas.
    iniciarI18n(idioma);
    return { config, idioma, opciones: opcionesDePais(regionesDispositivo), cambiarPais: setCodigo, idiomaDe };
  }, [codigo, regionesDispositivo, idiomaDe]);

  return <ContextoPais.Provider value={valor}>{children}</ContextoPais.Provider>;
}

export function usePais(): ValorPais {
  const valor = useContext(ContextoPais);
  if (!valor) throw new Error('usePais debe usarse dentro de ProveedorPais');
  return valor;
}
