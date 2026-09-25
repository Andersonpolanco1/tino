import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { getLocales } from 'expo-localization';
import type { CodigoPais, ConfigPais } from '../tipos/tipos';
import { elegirIdioma, iniciarI18n, type Idioma } from '../i18n';
import { configPara, detectarPais, type RegionDispositivo } from './paises';

interface ValorPais {
  config: ConfigPais;
  idioma: Idioma;
  cambiarPais: (codigo: CodigoPais) => void;
}

const ContextoPais = createContext<ValorPais | null>(null);

interface Props {
  children: ReactNode;
  // Se inyecta en pruebas; en la app sale de la configuración regional del teléfono.
  regiones?: RegionDispositivo[];
}

export function ProveedorPais({ children, regiones }: Props) {
  const regionesDispositivo = useMemo(() => regiones ?? getLocales(), [regiones]);
  const [codigo, setCodigo] = useState(() => detectarPais(regionesDispositivo));

  const valor = useMemo<ValorPais>(() => {
    const config = configPara(codigo, regionesDispositivo);
    const idioma = elegirIdioma([...config.idiomas, ...regionesDispositivo.map(r => r.languageTag)]);
    // Los textos deben estar listos antes del primer render de las pantallas.
    iniciarI18n(idioma);
    return { config, idioma, cambiarPais: setCodigo };
  }, [codigo, regionesDispositivo]);

  return <ContextoPais.Provider value={valor}>{children}</ContextoPais.Provider>;
}

export function usePais(): ValorPais {
  const valor = useContext(ContextoPais);
  if (!valor) throw new Error('usePais debe usarse dentro de ProveedorPais');
  return valor;
}
