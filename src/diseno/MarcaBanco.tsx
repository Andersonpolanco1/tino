import { useState, type ReactNode } from 'react';
import { Image, View, type ImageSourcePropType } from 'react-native';
import { useTema } from './useTema';

// Logo del banco sobre fondo blanco en ambos modos (muchos logos no se leen sobre el oscuro).
// Sin logo, o si no carga, muestra "respaldo": las iniciales (decisión D63).
export function MarcaBanco({
  logo,
  ancho,
  alto,
  radio,
  lado,
  respaldo,
}: {
  logo?: ImageSourcePropType;
  ancho: number;
  alto: number;
  radio: number;
  lado: number;
  respaldo: ReactNode;
}) {
  const tema = useTema();
  const [fallo, setFallo] = useState(false);
  if (!logo || fallo) return <>{respaldo}</>;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: ancho,
        height: alto,
        borderRadius: radio,
        backgroundColor: tema.color.fondoLogo,
        borderWidth: 1,
        borderColor: tema.color.divisor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image testID="logo-banco" source={logo} onError={() => setFallo(true)} resizeMode="contain" style={{ width: lado, height: lado }} />
    </View>
  );
}
