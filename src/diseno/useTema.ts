import { useColorScheme } from 'react-native';
import { temaPara, type Tema } from './tema';

// El tema activo sigue la configuración del sistema (sección 8.1).
export function useTema(): Tema {
  return temaPara(useColorScheme());
}
