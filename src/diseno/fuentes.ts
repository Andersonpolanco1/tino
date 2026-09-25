// Archivos de fuente incluidos en la app (sección 8.2). Se importan uno por uno
// para que el paquete lleve solo los pesos que usa la tipografía de los tokens.
export const archivosFuente = {
  BricolageGrotesque_600SemiBold: require('@expo-google-fonts/bricolage-grotesque/600SemiBold/BricolageGrotesque_600SemiBold.ttf'),
  BricolageGrotesque_700Bold: require('@expo-google-fonts/bricolage-grotesque/700Bold/BricolageGrotesque_700Bold.ttf'),
  AtkinsonHyperlegibleNext_400Regular: require('@expo-google-fonts/atkinson-hyperlegible-next/400Regular/AtkinsonHyperlegibleNext_400Regular.ttf'),
  AtkinsonHyperlegibleNext_600SemiBold: require('@expo-google-fonts/atkinson-hyperlegible-next/600SemiBold/AtkinsonHyperlegibleNext_600SemiBold.ttf'),
  AtkinsonHyperlegibleNext_700Bold: require('@expo-google-fonts/atkinson-hyperlegible-next/700Bold/AtkinsonHyperlegibleNext_700Bold.ttf'),
} as const;

export type NombreFuente = keyof typeof archivosFuente;

// En React Native cada peso de una fuente cargada es una familia distinta.
const familias: Record<'titulos' | 'texto', Partial<Record<number, NombreFuente>>> = {
  titulos: { 600: 'BricolageGrotesque_600SemiBold', 700: 'BricolageGrotesque_700Bold' },
  texto: {
    400: 'AtkinsonHyperlegibleNext_400Regular',
    600: 'AtkinsonHyperlegibleNext_600SemiBold',
    700: 'AtkinsonHyperlegibleNext_700Bold',
  },
};

export function nombreFuente(familia: 'titulos' | 'texto', peso: number): NombreFuente {
  const nombre = familias[familia][peso];
  if (!nombre) throw new Error(`No hay fuente cargada para ${familia} con peso ${peso}`);
  return nombre;
}
